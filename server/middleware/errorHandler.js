const errorHandler = (err, req, res, next) => {
    // Log the error for internal tracking (exclude in production if needed, or use a logger like Winston)
    console.error(`[Error] ${req.method} ${req.url}:`, err.message);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        error: err.message || 'Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;
