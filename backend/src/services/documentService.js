// Regras de negócio para upload, listagem e download de documentos.
const documentRepository = require('../repositories/documentRepository');
const { resolveStorageFilePath } = require('../repositories/uploadStorage');

function toPublicMetadata(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

function createDocumentRecord(file, owner) {
  return {
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };
}

function toDownloadTarget(document) {
  return {
    filePath: resolveStorageFilePath(document.id),
    originalName: document.originalName,
  };
}

function registerUpload({ file, owner }) {
  const document = createDocumentRecord(file, owner);
  return toPublicMetadata(documentRepository.create(document));
}

function listDocuments(owner) {
  return documentRepository.findAll(owner).map(toPublicMetadata);
}

function getDocumentFile(id) {
  const document = documentRepository.findById(id);
  return document ? toDownloadTarget(document) : null;
}

module.exports = { registerUpload, listDocuments, getDocumentFile };
