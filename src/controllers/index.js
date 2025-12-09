const controllers = {
    auth: require('./auth'),
    user: require('./user'),
    File: require('./File'),
    error: require('./error'),
    deposit: require('./deposit'),
    code: require('./code'),
    admin: require('./admin'),
    referral: require('./referral'),
    wallet: require('./wallet'),
    stripe: require('./stripe'),
}

module.exports = controllers;
