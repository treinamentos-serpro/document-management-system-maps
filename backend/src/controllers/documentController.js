// Tratamento de entrada/saída HTTP e validações básicas dos endpoints de documentos.
const fs = require('fs');
const documentService = require('../services/documentService');

function uploadDocument(req, res) {
  const { owner } = req.body;
  if (!req.file || !owner) {
    return res.status(400).json({ erro: 'Arquivo e owner são obrigatórios.' });
  }
  const document = documentService.registerUpload({ file: req.file, owner });
  return res.status(201).json(document);
}

function listDocuments(req, res) {
  const { owner } = req.query;
  const documents = documentService.listDocuments(owner);
  return res.status(200).json(documents);
}

function downloadDocument(req, res) {
  const { id } = req.params;
  const documentFile = documentService.getDocumentFile(id);
  if (!documentFile || !fs.existsSync(documentFile.filePath)) {
    return res.status(404).json({ erro: 'Documento não encontrado.' });
  }
  return res.download(documentFile.filePath, documentFile.originalName);
}

module.exports = { uploadDocument, listDocuments, downloadDocument };
