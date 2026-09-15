// Definição dos endpoints de documentos, delegando para os controllers.
const express = require('express');
const { upload } = require('../repositories/uploadStorage');
const documentController = require('../controllers/documentController');

const router = express.Router();
const downloadRequestCounters = new Map();
const DOWNLOAD_RATE_LIMIT_WINDOW_MS = Number(process.env.DOWNLOAD_RATE_LIMIT_WINDOW_MS || 60_000);
const DOWNLOAD_RATE_LIMIT_MAX_REQUESTS = Number(process.env.DOWNLOAD_RATE_LIMIT_MAX_REQUESTS || 30);

function getRateLimitKey(req) {
  return req.ip || req.socket?.remoteAddress || 'anonymous';
}

function rateLimitDownloads(req, res, next) {
  const currentTime = Date.now();
  const rateLimitKey = getRateLimitKey(req);
  const currentCounter = downloadRequestCounters.get(rateLimitKey);

  if (!currentCounter || currentTime - currentCounter.startedAt >= DOWNLOAD_RATE_LIMIT_WINDOW_MS) {
    downloadRequestCounters.set(rateLimitKey, { count: 1, startedAt: currentTime });
    next();
    return;
  }

  if (currentCounter.count >= DOWNLOAD_RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({ erro: 'Muitas tentativas de download. Tente novamente em instantes.' });
    return;
  }

  currentCounter.count += 1;
  next();
}

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', rateLimitDownloads, documentController.downloadDocument);

module.exports = router;
