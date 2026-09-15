const fs = require('fs');
const os = require('os');
const path = require('path');
const { afterEach, test } = require('node:test');
const assert = require('node:assert');
const documentRepository = require('../src/repositories/documentRepository');
const documentService = require('../src/services/documentService');

const originalGetDocumentFile = documentService.getDocumentFile;
const appModulePath = require.resolve('../src/app');
const routesModulePath = require.resolve('../src/routes/documentRoutes');
const controllerModulePath = require.resolve('../src/controllers/documentController');
const uploadStorageModulePath = require.resolve('../src/repositories/uploadStorage');

const storageDirectories = new Set();

function clearBackendModules() {
  delete require.cache[appModulePath];
  delete require.cache[routesModulePath];
  delete require.cache[controllerModulePath];
  delete require.cache[uploadStorageModulePath];
}

function loadFreshApp(storageDir) {
  if (storageDir) {
    process.env.STORAGE_DIR = storageDir;
  } else {
    delete process.env.STORAGE_DIR;
  }
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
  for (const storageDir of storageDirectories) {
    fs.rmSync(storageDir, { recursive: true, force: true });
  }
  storageDirectories.clear();
  documentRepository.clear();
  documentService.getDocumentFile = originalGetDocumentFile;
  delete process.env.STORAGE_DIR;
  delete process.env.DOWNLOAD_RATE_LIMIT_MAX_REQUESTS;
  delete process.env.DOWNLOAD_RATE_LIMIT_WINDOW_MS;
  clearBackendModules();
});

function createTemporaryStorageDir() {
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-storage-'));
  storageDirectories.add(storageDir);
  return storageDir;
}

async function stopServer(server) {
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

async function uploadDocument(baseUrl, { owner, fileName, content, contentType = 'text/plain' }) {
  const formData = new FormData();
  formData.append('owner', owner);
  formData.append('file', new Blob([content], { type: contentType }), fileName);

  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
}

test('rota de upload persiste o arquivo em disco e retorna os metadados públicos', async () => {
  const app = loadFreshApp(createTemporaryStorageDir());
  const { server, baseUrl } = await startServer(app);

  try {
    const response = await uploadDocument(baseUrl, {
      owner: 'maria',
      fileName: 'contrato.txt',
      content: 'conteúdo do contrato',
    });

    assert.strictEqual(response.status, 201);

    const document = await response.json();

    assert.ok(document.id);
    assert.strictEqual(document.originalName, 'contrato.txt');
    assert.strictEqual(document.owner, 'maria');
    assert.strictEqual(document.size, Buffer.byteLength('conteúdo do contrato'));
    assert.match(document.uploadedAt, /^\d{4}-\d{2}-\d{2}T/);

    const storedFilePath = path.join(process.env.STORAGE_DIR, document.id);
    assert.ok(fs.existsSync(storedFilePath));
    assert.strictEqual(fs.readFileSync(storedFilePath, 'utf8'), 'conteúdo do contrato');
  } finally {
    await stopServer(server);
  }
});

test('rota de listagem retorna apenas os documentos do owner informado', async () => {
  const app = loadFreshApp(createTemporaryStorageDir());
  const { server, baseUrl } = await startServer(app);

  try {
    await uploadDocument(baseUrl, {
      owner: 'maria',
      fileName: 'contrato-maria.txt',
      content: 'arquivo da maria',
    });
    await uploadDocument(baseUrl, {
      owner: 'joao',
      fileName: 'contrato-joao.txt',
      content: 'arquivo do joao',
    });

    const response = await fetch(`${baseUrl}/documents?owner=maria`);

    assert.strictEqual(response.status, 200);

    const documents = await response.json();

    assert.strictEqual(documents.length, 1);
    assert.strictEqual(documents[0].originalName, 'contrato-maria.txt');
    assert.strictEqual(documents[0].owner, 'maria');
    assert.ok(documents[0].id);
    assert.match(documents[0].uploadedAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    await stopServer(server);
  }
});

test('rota de download devolve o arquivo salvo para um documento existente', async () => {
  const app = loadFreshApp(createTemporaryStorageDir());
  const { server, baseUrl } = await startServer(app);

  try {
    const uploadResponse = await uploadDocument(baseUrl, {
      owner: 'maria',
      fileName: 'contrato.txt',
      content: 'conteúdo para download',
    });
    const document = await uploadResponse.json();

    const response = await fetch(`${baseUrl}/documents/${document.id}/download`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(await response.text(), 'conteúdo para download');
    assert.match(
      response.headers.get('content-disposition') || '',
      /attachment;\s*filename="?contrato\.txt"?/
    );
  } finally {
    await stopServer(server);
  }
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
    await stopServer(server);
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
    await stopServer(server);
  }
});
