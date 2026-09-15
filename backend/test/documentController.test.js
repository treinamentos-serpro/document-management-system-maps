const { afterEach, test } = require('node:test');
const assert = require('node:assert');
const documentController = require('../src/controllers/documentController');
const documentService = require('../src/services/documentService');
const { STORAGE_DIR } = require('../src/repositories/uploadStorage');

const originalGetDocumentFile = documentService.getDocumentFile;

afterEach(() => {
  documentService.getDocumentFile = originalGetDocumentFile;
});

test('downloadDocument envia o arquivo usando o diretório de storage configurado', () => {
  documentService.getDocumentFile = () => ({
    storageName: 'stored-file.pdf',
    originalName: 'contrato.pdf',
  });

  let downloadCall;
  const res = {
    download(storageName, originalName, options, callback) {
      downloadCall = { storageName, originalName, options };
      callback();
    },
  };

  documentController.downloadDocument({ params: { id: 'stored-file.pdf' } }, res, assert.fail);

  assert.deepStrictEqual(downloadCall, {
    storageName: 'stored-file.pdf',
    originalName: 'contrato.pdf',
    options: { root: STORAGE_DIR },
  });
});

test('downloadDocument retorna 404 quando o arquivo não existe mais no disco', () => {
  documentService.getDocumentFile = () => ({
    storageName: 'stored-file.pdf',
    originalName: 'contrato.pdf',
  });

  let responseStatus;
  let responseBody;
  const res = {
    headersSent: false,
    download(storageName, originalName, options, callback) {
      callback({ code: 'ENOENT' });
    },
    status(statusCode) {
      responseStatus = statusCode;
      return this;
    },
    json(payload) {
      responseBody = payload;
      return this;
    },
  };

  documentController.downloadDocument({ params: { id: 'stored-file.pdf' } }, res, assert.fail);

  assert.strictEqual(responseStatus, 404);
  assert.deepStrictEqual(responseBody, { erro: 'Documento não encontrado.' });
});
