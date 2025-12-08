const routes = {
    user: require('./user'),
    auth: require('./auth'),
    me: require('./me'),
    deposits: require('./deposits'),
    admin: require('./admin'),
    referrals: require('./referrals'),
    bonus: require('./bonus'),
    code: require('./code'),
    wallet: require('./wallet'),
    stripe: require('./stripe'),
}
module.exports = routes;
