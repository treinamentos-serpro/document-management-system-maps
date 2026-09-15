// Configuração do multer (diskStorage) para gravação local dos arquivos enviados.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, '..', '..', 'storage');

fs.mkdirSync(STORAGE_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, STORAGE_DIR);
  },
  filename: (req, file, cb) => {
    // Nome único em disco; também usado como id do documento.
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
module.exports = { upload, STORAGE_DIR };
