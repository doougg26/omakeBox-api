function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Erro interno do servidor';

  // Sempre loga erros não tratados (produção também)
  if (!err.statusCode) {
    console.error('✗ Erro não tratado:', err.message || err);
    if (err.original) {
      console.error('  Detalhe BD:', err.original.message);
    }
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development'
      ? { stack: err.stack, detail: err.original?.message || null }
      : {}),
  });
}

module.exports = errorHandler;
