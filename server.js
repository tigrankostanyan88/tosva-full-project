const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

// Import dependencies
require('dotenv').config({
    path: './.env',
    override: true
});

const AppError = require('./src/utils/Error');
const helpers = require('./src/utils/helpers');
const Server = require('./src/utils/Server');

// Define Routes
const routes = require('./src/routes');

// Error handling
const ctrls = require('./src/controllers');
const globalErrorHandler = ctrls.error;

// Initialize Express framework
const app = express();

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


app.use(cookieParser());
app.use(cors());
app.use(helmet());
app.use(compression());

 
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// My middleware
app.use((req, res, next) => {
    req.body = helpers.encode(req.body);
    req.time = Date.now(); 
    next();
});

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}));

// No rendered pages — pure API

// API RUOTES
app.use('/api/v1/users', routes.user);
app.use('/api/v1/auth', routes.auth);
app.use('/api/v1/me', routes.me);
app.use('/api/v1/deposits', routes.deposits);
app.use('/api/v1/admin', routes.admin);
app.use('/api/v1/referrals', routes.referrals);
app.use('/api/v1/bonus', routes.bonus);
app.use('/api/v1/code', routes.code);
app.use('/api/v1/wallet', routes.wallet);
app.use('/api/v1/stripe', routes.stripe);

// All 404 Errors
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// // All errors
app.use(globalErrorHandler);

// Run Server
Server(app);

// Timecode scheduler removed

try {
    const onchain = require('./src/jobs/onchain.monitor');
    onchain.start();
} catch (e) {}

try {
    const wd = require('./src/jobs/withdraws.worker');
    wd.start();
} catch (e) {}

try {
    const bonusScheduler = require('./src/jobs/bonus.scheduler');
    bonusScheduler.start();
} catch (e) {}
