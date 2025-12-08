const controllers = {
    auth: require('./auth'),
    user: require('./user'),
    File: require('./File'),
    error: require('./error'),
    deposit: require('./deposit'),
    admin: require('./admin'),
    referral: require('./referral'),
    wallet: require('./wallet'),
    bonus: require('./bonus'),
    stripe: require('./stripe'),
}

module.exports = controllers;
