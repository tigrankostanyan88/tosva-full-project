const Sequelize = require('sequelize');

const db_name = process.env.DB_NAME;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;

const connect = new Sequelize(db_name, username, password, {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,

    define: {
        timestamp: false,
        createdAt: false,
        updatedAt: false,
        freezeTableName: true
    }
});


connect.authenticate()
    .then(() => console.log('DB connection 👏'))
    .catch((e) => console.log('Error connection', e.message));

const DB = { con: connect, Sequelize };

module.exports = DB;