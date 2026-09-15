// Listagem dos documentos enviados, com ação de download por item.
import DownloadButton from './DownloadButton';

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return '-';
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString('pt-BR');
}

export default function DocumentList({ documents, isLoading, error }) {
  if (isLoading) {
    return <p>Carregando documentos...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!documents.length) {
    return <p>Nenhum documento enviado ainda.</p>;
  }

  return (
    <section>
      <h2>Documentos</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Dono</th>
            <th>Tamanho</th>
            <th>Enviado em</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>{document.originalName}</td>
              <td>{document.owner}</td>
              <td>{formatFileSize(document.size)}</td>
              <td>{formatDate(document.uploadedAt)}</td>
              <td>
                <DownloadButton documentId={document.id} fileName={document.originalName} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
