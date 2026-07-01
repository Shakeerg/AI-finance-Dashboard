const errorHandler = (err, req, res, next) => {
  console.error(`🚨 Global Error Caught:`, err.stack);

  // Default to 500 Server Error unless a specific code was set earlier
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only reveal the code stack trace if we are running in local development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
};

module.exports = { errorHandler };