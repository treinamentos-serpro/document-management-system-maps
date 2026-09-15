// Cliente HTTP para a API de documentos do backend (prefixo /api via proxy do Vite).
const API_BASE_URL = '/api';

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.erro || 'Erro ao comunicar com o servidor.');
  }
  return data;
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('owner', owner);
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  return parseJsonResponse(response);
}

export async function fetchDocuments() {
  const response = await fetch(`${API_BASE_URL}/documents`);
  return parseJsonResponse(response);
}

export function getDownloadUrl(documentId) {
  return `${API_BASE_URL}/documents/${documentId}/download`;
}
