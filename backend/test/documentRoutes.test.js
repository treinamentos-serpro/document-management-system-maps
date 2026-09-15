const { afterEach, test } = require('node:test');
const assert = require('node:assert');
const documentService = require('../src/services/documentService');

const originalGetDocumentFile = documentService.getDocumentFile;
const appModulePath = require.resolve('../src/app');
const routesModulePath = require.resolve('../src/routes/documentRoutes');

function clearBackendModules() {
  delete require.cache[appModulePath];
  delete require.cache[routesModulePath];
}

function loadFreshApp() {
  clearBackendModules();
  return require('../src/app');
}

async function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}`,
      });
    });
  });
}

afterEach(() => {
  documentService.getDocumentFile = originalGetDocumentFile;
  delete process.env.DOWNLOAD_RATE_LIMIT_MAX_REQUESTS;
  delete process.env.DOWNLOAD_RATE_LIMIT_WINDOW_MS;
  clearBackendModules();
});

test('rota de download retorna 429 após exceder o limite configurado', async () => {
  process.env.DOWNLOAD_RATE_LIMIT_MAX_REQUESTS = '1';
  process.env.DOWNLOAD_RATE_LIMIT_WINDOW_MS = '60000';
  documentService.getDocumentFile = () => null;

  const app = loadFreshApp();
  const { server, baseUrl } = await startServer(app);

  try {
    const firstResponse = await fetch(`${baseUrl}/documents/missing/download`);
    const secondResponse = await fetch(`${baseUrl}/documents/missing/download`);

    assert.strictEqual(firstResponse.status, 404);
    assert.strictEqual(secondResponse.status, 429);
    assert.deepStrictEqual(await secondResponse.json(), {
      erro: 'Muitas tentativas de download. Tente novamente em instantes.',
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

test('rota de download reinicia a contagem após a janela expirar', async () => {
  process.env.DOWNLOAD_RATE_LIMIT_MAX_REQUESTS = '1';
  process.env.DOWNLOAD_RATE_LIMIT_WINDOW_MS = '50';
  documentService.getDocumentFile = () => null;

  const app = loadFreshApp();
  const { server, baseUrl } = await startServer(app);

  try {
    const firstResponse = await fetch(`${baseUrl}/documents/missing/download`);
    const limitedResponse = await fetch(`${baseUrl}/documents/missing/download`);

    assert.strictEqual(firstResponse.status, 404);
    assert.strictEqual(limitedResponse.status, 429);

    await new Promise((resolve) => setTimeout(resolve, 60));

    const responseAfterWindow = await fetch(`${baseUrl}/documents/missing/download`);

    assert.strictEqual(responseAfterWindow.status, 404);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});
