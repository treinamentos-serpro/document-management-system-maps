const { beforeEach, test } = require('node:test');
const assert = require('node:assert');
const documentService = require('../src/services/documentService');
const documentRepository = require('../src/repositories/documentRepository');

beforeEach(() => {
  documentRepository.clear();
});

test('registerUpload persiste e retorna apenas os metadados públicos', () => {
  const result = documentService.registerUpload({
    file: {
      filename: 'stored-file.pdf',
      originalname: 'contrato.pdf',
      size: 128,
    },
    owner: 'maria',
  });

  assert.deepStrictEqual(result, {
    id: 'stored-file.pdf',
    originalName: 'contrato.pdf',
    size: 128,
    uploadedAt: result.uploadedAt,
    owner: 'maria',
  });

  assert.match(result.uploadedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepStrictEqual(documentRepository.findById('stored-file.pdf'), result);
});

test('listDocuments filtra por owner sem duplicar transformação de saída', () => {
  documentService.registerUpload({
    file: {
      filename: 'stored-1.pdf',
      originalname: 'contrato-1.pdf',
      size: 100,
    },
    owner: 'maria',
  });
  documentService.registerUpload({
    file: {
      filename: 'stored-2.pdf',
      originalname: 'contrato-2.pdf',
      size: 200,
    },
    owner: 'joao',
  });

  const documents = documentService.listDocuments('maria');

  assert.strictEqual(documents.length, 1);
  assert.deepStrictEqual(documents[0], {
    id: 'stored-1.pdf',
    originalName: 'contrato-1.pdf',
    size: 100,
    uploadedAt: documents[0].uploadedAt,
    owner: 'maria',
  });
});

test('getDocumentFile retorna o identificador armazenado e null quando não encontra', () => {
  documentService.registerUpload({
    file: {
      filename: 'stored-file.pdf',
      originalname: 'contrato.pdf',
      size: 128,
    },
    owner: 'maria',
  });

  const documentFile = documentService.getDocumentFile('stored-file.pdf');
  assert.deepStrictEqual(documentFile, {
    storageName: 'stored-file.pdf',
    storageName: 'stored-file.pdf',
    originalName: 'contrato.pdf',
  });
  assert.strictEqual(documentService.getDocumentFile('missing'), null);
});
