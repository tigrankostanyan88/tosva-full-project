// Module exports an error handler for HTTP requests
const AppError = require('../utils/AppError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
}

/* This function handles casting errors in the database,
creating and returning a custom error with a message that
includes the invalid path and value. */

const handleDuplicateFieldsDB = err => {
    let message = 'Duplicate entry';
    const sqlMsg = (err && err.original && err.original.sqlMessage) || (err && err.parent && err.parent.sqlMessage);
    if (sqlMsg) {
        message = sqlMsg;
    } else if (err && err.fields && typeof err.fields === 'object') {
        const fields = Object.keys(err.fields);
        if (fields.length) message = `Duplicate value for field: ${fields.join(', ')}`;
    } else if (Array.isArray(err.errors) && err.errors.length) {
        const first = err.errors[0];
        if (first && first.message) message = first.message;
    } else if (err && typeof err.message === 'string' && err.message) {
        message = err.message;
    }
    return new AppError(message, 400);
}

// This function handles duplicate field errors in the database, extracting the unique value causing the error from the errmsg and logging it to the console.
const handleValidationErrorDB = err => {
    const errorsArray = Array.isArray(err.errors) ? err.errors : Object.values(err.errors || {});
    const messages = errorsArray.map(el => el.message).filter(Boolean);
    const message = messages.length ? messages.join('. ') : 'Invalid input data';
    return new AppError(message, 400);
}

// This function handles validation errors in the database by mapping the errors object and extracting a message from each error element. 
const handleJWTError = err => new AppError('Invalid token. Please log in.', 401);

// This function handles JWT expired errors, creating and returning a custom error with a message that informs the user their token has expired.
const handleJWTExpiredError = err => new AppError('Your token has expired. Please log in again.', 401);

// This function sends error responses to the client during development. It checks if the request is coming from an API or a rendered website and responds accordingly with the appropriate status code and error object or error template.
const sendErrorDev = (err, req, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

// This function sends error responses to the client during production. It checks if the request is coming from an API or a rendered website and responds accordingly with the appropriate status code and message.
const sendErrorProd = (err, req, res, next) => {
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    console.error('ERROR 💥', err);
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
    });
};


// This function handles errors that occur during processing
module.exports = (err, req, res, next) => {
    // Set default values for status code and error status
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Check if running in development environment
    if (process.env.NODE_ENV === 'development') {
        // If so, send detailed error message with stack trace
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        // If not, create a copy of the error object 
        let error = {...err};
        error.message = err.message;

        // CastError (Mongo style)
        if (error.name === 'CastError') error = handleCastErrorDB(error);

        // Duplicate key errors
        if (error.code === 11000 || error.name === 'SequelizeUniqueConstraintError' || (error.original && error.original.code === 'ER_DUP_ENTRY') || (error.parent && error.parent.code === 'ER_DUP_ENTRY')) {
            error = handleDuplicateFieldsDB(error);
        }

        // Validation errors
        if (error.name === 'ValidationError' || error.name === 'SequelizeValidationError') {
            error = handleValidationErrorDB(error);
        }

        // Check for JWT errors
        if (error.name === 'JsonWebTokenError')
            error = handleJWTError(error);

        // Check for expired JWT tokens
        if (error.name === 'TokenExpiredError')
            error = handleJWTExpiredError(error);

        // Send error response to client.
        sendErrorProd(error, req, res);
    }
}
