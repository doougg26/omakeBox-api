const TranslateService = require('../../src/services/TranslateService');

// Mock https module para evitar chamadas reais à API
jest.mock('https', () => {
  const mockReq = {
    on: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  };
  return {
    request: jest.fn((url, options, callback) => {
      // Simula resposta assíncrona
      const mockRes = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler(JSON.stringify({ translatedText: 'Olá, mundo!' }));
          }
          if (event === 'end') {
            handler();
          }
        }),
      };
      setImmediate(() => callback(mockRes));
      return mockReq;
    }),
  };
});

describe('TranslateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve traduzir texto do inglês para português', async () => {
    const result = await TranslateService.translate('Hello, world!', 'pt', 'en');

    expect(result).toBe('Olá, mundo!');
  });

  it('deve usar idiomas padrão (en → pt)', async () => {
    const result = await TranslateService.translate('Good morning');

    expect(result).toBe('Olá, mundo!');
  });

  it('deve lançar erro se texto for muito longo (> 2000 caracteres)', async () => {
    const longText = 'a'.repeat(2001);

    await expect(
      TranslateService.translate(longText)
    ).rejects.toThrow('Texto muito longo para tradução');
  });

  it('deve aceitar texto com 2000 caracteres (limite máximo)', async () => {
    const text2000 = 'a'.repeat(2000);

    const result = await TranslateService.translate(text2000);
    expect(result).toBeDefined();
  });

  it('deve lançar erro se texto for vazio', async () => {
    await expect(
      TranslateService.translate('')
    ).rejects.toThrow('Texto muito longo para tradução');
  });
});
