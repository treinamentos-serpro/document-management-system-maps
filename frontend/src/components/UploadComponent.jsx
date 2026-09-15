// Formulário de envio de documentos (arquivo + dono).
import { useState } from 'react';
import { uploadDocument } from '../services/documentApi';

export default function UploadComponent({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || !owner) {
      setError('Selecione um arquivo e informe o dono do documento.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      await uploadDocument(file, owner);
      setFile(null);
      setOwner('');
      event.target.reset();
      onUploadComplete?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section>
      <h2>Enviar documento</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="owner">Dono</label>
          <input
            id="owner"
            type="text"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="file">Arquivo</label>
          <input
            id="file"
            type="file"
            onChange={(event) => setFile(event.target.files[0] ?? null)}
          />
        </div>
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </section>
  );
}
