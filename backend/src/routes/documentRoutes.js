// Definição dos endpoints de documentos, delegando para os controllers.
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { upload } = require('../repositories/uploadStorage');
const documentController = require('../controllers/documentController');

const router = express.Router();

function readPositiveInteger(value, fallback) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

const downloadRateLimiter = rateLimit({
  windowMs: readPositiveInteger(process.env.DOWNLOAD_RATE_LIMIT_WINDOW_MS, 60_000),
  limit: readPositiveInteger(process.env.DOWNLOAD_RATE_LIMIT_MAX_REQUESTS, 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de download. Tente novamente em instantes.' },
});

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', downloadRateLimiter, documentController.downloadDocument);

module.exports = router;
