// Definição dos endpoints de documentos, delegando para os controllers.
const express = require('express');
const { upload } = require('../repositories/uploadStorage');
const documentController = require('../controllers/documentController');

const router = express.Router();

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;
