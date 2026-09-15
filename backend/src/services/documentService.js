// Regras de negócio para upload, listagem e download de documentos.
const path = require('path');
const documentRepository = require('../repositories/documentRepository');
const { STORAGE_DIR } = require('../repositories/uploadStorage');

function toPublicMetadata(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

function registerUpload({ file, owner }) {
  const document = {
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };
  documentRepository.create(document);
  return toPublicMetadata(document);
}

function listDocuments(owner) {
  return documentRepository.findAll(owner).map(toPublicMetadata);
}

function getDocumentFile(id) {
  const document = documentRepository.findById(id);
  if (!document) {
    return null;
  }
  return {
    filePath: path.join(STORAGE_DIR, document.id),
    originalName: document.originalName,
  };
}

module.exports = { registerUpload, listDocuments, getDocumentFile };
