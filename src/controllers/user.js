// DB module imports the defined models in the project.
const DB = require('../models');
const { User, Like } = DB.models;

// Module exports a function that acts as an error handler
const catchAsync = require('./../utils/catchAsync');

// Module exports an error handler for HTTP requests
const AppError = require('./../utils/Error');
const helpers = require('./../utils/helpers');
const File = require('./File');

module.exports = {
    getUsers: catchAsync(async (req, res) => {
        // 3) Update user
        const user = await User.findAll({
            include: [
                { model: Like, as: 'likes'}
            ],
            raw: true,
            order: [
                ["id", "ASC"]
            ],
            attributes: ['name', 'email', 'provider'], // Specify the columns you want to retrieve
        });
        res.status(200).json({
            user,
            current: req.user,
            time: (Date.now() - req.time) + ' ms'
        });
    }),
    updateMe: catchAsync(async (req, res, next) => {
        // 1) Create error if user POSTs password data
        if (req.body.password || req.body.passwordConfirm)
            return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));

        // 2) Updated only allowed fields
        const filteredBody = helpers.filterObj(req.body, 'name', 'phone');

        // 3) Update user
        // const user = await User.findByPk(req.user.id);
        const user = await User.findByPk(req.user.id, { include: 'files' });

        if (req.files) {
            // User image avatar
            if (req.files.avatar) {
                // console.log(req.files.image)
                const fileAvatar = await new File(user, req.files.avatar).replace('avatar');
                if (fileAvatar.status == 'success') {
                    // create row
                    await user.createFile(fileAvatar.table);
                } else {
                    console.log(fileAvatar);
                    // ? - show same message / other message...
                    return next(new AppError(Object.values(fileAvatar.message).join(' '), 400));
                }
            }
        }

        user.set(filteredBody);
        await user.save();

        res.status(200).json({
            status: 'success',
            user,
            time: (Date.now() - req.time) + ' ms'
        });
    }),
}