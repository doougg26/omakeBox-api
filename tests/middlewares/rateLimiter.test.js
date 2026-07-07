const http = require('http');
const express = require('express');

/**
 * Cria um servidor Express de teste com o rate limiter aplicado a uma rota.
 */
function createTestApp(limiter) {
  const app = express();

  // Rota de teste com o rate limiter
  app.get('/test', limiter, (_req, res) => {
    res.json({ success: true });
  });

  return app;
}

/**
 * Faz requisições HTTP ao servidor de teste e retorna as respostas.
 */
function makeRequests(app, count) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const results = [];
      let completed = 0;

      for (let i = 0; i < count; i++) {
        const req = http.get(`http://localhost:${port}/test`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            results.push({
              status: res.statusCode,
              body: JSON.parse(data),
              remaining: parseInt(res.headers['ratelimit-remaining'], 10),
            });
            completed++;
            if (completed === count) {
              server.close();
              resolve(results);
            }
          });
        });
        req.on('error', (err) => {
          results.push({ status: 500, body: { error: err.message } });
          completed++;
          if (completed === count) {
            server.close();
            resolve(results);
          }
        });
      }
    });
  });
}

describe('apiLimiter', () => {
  let apiLimiter;

  beforeEach(() => {
    jest.resetModules();
    apiLimiter = require('../../src/middlewares/rateLimiter').apiLimiter;
  });

  it('deve permitir requisição dentro do limite (1 de 100)', async () => {
    const app = createTestApp(apiLimiter);
    const results = await makeRequests(app, 1);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe(200);
    expect(results[0].body.success).toBe(true);
  });

  it('deve retornar headers de rate limit na resposta', async () => {
    const app = createTestApp(apiLimiter);
    const results = await makeRequests(app, 1);

    expect(results[0].remaining).toBeDefined();
    expect(results[0].remaining).toBe(99); // 100 - 1
  });
});

describe('authLimiter', () => {
  let authLimiter;

  beforeEach(() => {
    jest.resetModules();
    authLimiter = require('../../src/middlewares/rateLimiter').authLimiter;
  });

  it('deve permitir até 5 requisições', async () => {
    const app = createTestApp(authLimiter);
    const results = await makeRequests(app, 5);

    const successes = results.filter((r) => r.status === 200);
    expect(successes).toHaveLength(5);
  });

  it('deve bloquear a 6ª requisição com status 429', async () => {
    const app = createTestApp(authLimiter);
    const results = await makeRequests(app, 6);

    const blocked = results.filter((r) => r.status === 429);
    expect(blocked).toHaveLength(1);
    expect(blocked[0].status).toBe(429);
  });

  it('deve retornar mensagem de erro em português ao bloquear', async () => {
    const app = createTestApp(authLimiter);
    const results = await makeRequests(app, 6);

    const blocked = results.find((r) => r.status === 429);
    expect(blocked).toBeDefined();
    expect(blocked.body.error).toBe('Muitas tentativas de login. Aguarde 1 minuto.');
  });

  it('deve ter remaining 0 após 5 requisições', async () => {
    const app = createTestApp(authLimiter);
    const results = await makeRequests(app, 5);

    const last = results[results.length - 1];
    expect(last.remaining).toBe(0);
  });

  it('não deve mostrar remaining negativo após exceder limite', async () => {
    const app = createTestApp(authLimiter);
    const results = await makeRequests(app, 7);

    const blocked = results.filter((r) => r.status === 429);
    for (const req of blocked) {
      expect(req.remaining).toBe(0); // não deve ficar negativo
    }
  });
});
