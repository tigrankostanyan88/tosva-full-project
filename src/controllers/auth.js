const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Email = require('../utils/Email');

const DB = require('../models');
const User = DB.models.User; 
const {Op} = DB.Sequelize; 

const createSendToken = (user, statusCode, req, res, target = false) => {
    const jwtExpire = req.body.remember == 1 ? process.env.JWT_EXPIRES_IN : 1;

    const token = jwt.sign({
        id: user.id
    }, process.env.JWT_SECRET, {
        expiresIn: jwtExpire + 'd'
    });

    const cookieOptions = {
        expires: new Date(Date.now() + jwtExpire * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if (process.env.NODE_ENV === 'production') 
        cookieOptions.secure = true;
    
    res.cookie('jwt', token, cookieOptions);

    res.locals.token = token;

    if (!target) {
        user.password = undefined;
        user.deleted = undefined;

        res.status(statusCode)
            .json({
                status: 'success',
                time: (Date.now() - req.time) + ' ms',
                token,
                user
            });
    }
};

const logOutUser = (res) => {
    res.cookie('auth', 'loggedout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
};

module.exports = {
    signUp: catchAsync(async(req, res, next) => {
        const userService = require('../services/user.service');
        const user = await userService.registerUser(req.body);
        createSendToken(user, 201, req, res);
    }),
   
    signIn: catchAsync(async(req, res, next) => {
        const {email, password} = req.body;

        if (!email || !password) 
            return next(new AppError('Please provide email and password!', 400));
        
    
        const user = await User.findOne({where: { email }});

        const security = require('../services/security.service');
        if (user && await security.isLocked(user)) {
            return next(new AppError('Too many login attempts. Try again later.', 429));
        }

        if (!user) {
            return next(new AppError('Incorrect email or password', 401));
        }
        const correctPassword = await user.correctPassword(password, user.password);
        if (!correctPassword) {
            if (user) await security.recordFailedLogin(user);
            return next(new AppError('Incorrect email or password', 401));
        }
        await security.recordSuccessfulLogin(user);
        
        createSendToken(user, 200, req, res, true);

        res
            .status(200)
            .json({
                status: 'success',
                token: res.locals.token,
                time: (Date.now() - req.time + ' ms'),
                reload: true
            });
    }),
    logout: async(req, res) => {
        res.cookie('auth', 'loggedout', {
            expires: new Date(Date.now() + 2 * 1000),
            httpOnly: true
        });

        res.status(200)
            .json({status: 'success', message: 'Your successfully logged out!'})
    },
    forgotPassword: catchAsync(async(req, res, next) => {
        const {email} = req.body;

        if (!email) {
            return next(new AppError('Please provide your email!', 400));
        }
        const user = await User.findOne({where: {
                email
            }});

        if (!user) 
            return next(new AppError('There is no user with email address.', 404));
        
        const resetToken = user.createPasswordResetToken();

        await user.save();

        try {
            const resetURL = `${req
                .protocol}://${req
                .get('host')}/resetPassword/${resetToken}`;
            await new Email(user, resetURL).sendResetPassword();

            res
                .status(200)
                .json({
                    status: 'success',
                    message: 'Token sent to email!',
                    reload: false,
                    time: (Date.now() - req.time) + ' ms',
                    user
                });
        } catch (err) {
            user.passwordResetToken = null;
            user.passwordResetExpires = null;
            await user.save();

            return next(new AppError('There was an error sending the email. Try again later!'), 500);
        }
    }),
    resetPassword: catchAsync(async(req, res, next) => {
        const hashedToken = crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex");

        const user = await User.findOne({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: {
                    [Op.gt]: Date.now()
                }
            }
        });

        if (!user) {
            return next(new AppError('Token is invalid or has expired', 401));
        }

        user.password = req.body.password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        createSendToken(user, 200, req, res, true);
        res
            .status(200)
            .json({status: 'success'})
    }),
    updatePassword: catchAsync(async(req, res, next) => {
        const user = await User.findByPk(req.user.id);

        const correctPassword = await user.correctPassword(req.body.passwordCurrent, user.password);

        if (!correctPassword) 
            return next(new AppError('Your current password is wrong.', 401));
        
        user.password = req.body.password;
        await user.save();

        createSendToken(user, 200, req, res);

        res
            .status(200)
            .json({status: 'success', message: 'password succesfuly update'});

    }),
    deleteMe: catchAsync(async(req, res) => {
        const user = await User.findByPk(req.user.id);
        user.deleted = true;
        user.save();
        logOutUser();

        res
            .status(204)
            .json({status: 'success', user})
    }),
    restrictTo: (...roles) => {
        return (req, res, next) => {
            if (!roles.includes(req.user.role)) {
                return next(new AppError('You do not have permission to perform this action, access denied', 403));
            }
            next();
        };
    },
    isLoggedIn: async(req, res, next) => {
        res.locals.user = undefined;
        if (req.cookies.jwt) {
            try {
                if (res.getHeader('x-ratelimit-remaining') == 0) {
                    logOutUser(res);
                }

                const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
                const currentUser = await User.findByPk(decoded.id);

                if (!currentUser) {
                    return next();
                }

                if (currentUser.changedPasswordAfter(decoded.iat)) {
                    return next();
                }

                res.locals.user = currentUser.toJSON();
                return next();
            } catch (err) {
                return next();
            }
        }
        next();
    },
    protect: catchAsync(async(req, res, next) => {
        res.locals.user = undefined;
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt
        }
        if (!token) {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const currentUser = await User.findByPk(decoded.id);

        if (!currentUser) {
            return next(new AppError('The user belonging to this token does no longer exist.', 401));
        }

        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('User recently changed password! Please log in again.', 401));
        }

        req.user = currentUser;
        res.locals.user = currentUser.toJSON();

        next();
    }),
    protectUser: (req, res, next) => {
        if (res.locals.user) {
            return next(new AppError('You are already logged in!', 403));
        }
        next();
    }
};
