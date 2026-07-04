function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Erro interno do servidor';

  if (process.env.NODE_ENV === 'development' && !err.statusCode) {
    console.error('Erro não tratado:', err);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && !err.statusCode
      ? { stack: err.stack }
      : {}),
  });
}

module.exports = errorHandler;
