# Documentação - Recurso Documents

## 1. Objetivo

Permitir o upload, a listagem e o download de documentos, associando cada
documento a um `owner` e armazenando o arquivo localmente no filesystem da
aplicação.

## 2. Endpoints expostos

### `POST /upload`

- **Entrada**: `multipart/form-data` com campo `file` (arquivo) e campo `owner`
  (string), tratado pelo middleware `upload.single('file')` (multer).
- **Saída (201)**: metadados do documento criado — `id`, `originalName`,
  `size`, `uploadedAt`, `owner`.
- **Erros**:
  - `400`: arquivo ausente ou `owner` não informado
    (`{ erro: 'Arquivo e owner são obrigatórios.' }`).

### `GET /documents`

- **Entrada**: nenhuma obrigatória; aceita filtro opcional por `owner` via
  query string.
- **Saída (200)**: lista de metadados de documentos (`id`, `originalName`,
  `size`, `uploadedAt`, `owner`).

### `GET /documents/:id/download`

- **Entrada**: `id` do documento na URL.
- **Saída (200)**: conteúdo binário do arquivo, enviado via `res.download`
  com o nome original do arquivo.
- **Erros**:
  - `404`: documento não encontrado ou arquivo ausente no disco
    (`{ erro: 'Documento não encontrado.' }`).

## 3. Regras de negócio (services)

Implementadas em `documentService.js`:

- `registerUpload({ file, owner })`: monta os metadados do documento a partir
  do arquivo recebido pelo multer (`id` = nome do arquivo em disco, gerado
  pelo `uploadStorage`) e delega a persistência ao repositório.
- `listDocuments(owner)`: retorna os metadados de todos os documentos,
  filtrando por `owner` quando informado.
- `getDocumentFile(id)`: resolve o caminho físico do arquivo no
  `STORAGE_DIR` a partir do `id`, para uso no download.
- `toPublicMetadata(document)`: expõe apenas os campos públicos do documento
  (`id`, `originalName`, `size`, `uploadedAt`, `owner`).

## 4. Modelo de dados (metadados do documento)

| Campo        | Tipo   | Descrição                                                |
| ------------ | ------ | --------------------------------------------------------- |
| id           | string | Nome único do arquivo em disco (UUID + extensão original) |
| originalName | string | Nome original do arquivo enviado                           |
| size         | number | Tamanho em bytes                                           |
| uploadedAt   | string | Data/hora do upload (ISO 8601)                             |
| owner        | string | Identificador do usuário dono do documento                 |

## 5. Camadas e arquivos envolvidos

```
routes/documentRoutes.js
  -> controllers/documentController.js
    -> services/documentService.js
      -> repositories/documentRepository.js   (metadados em memória)
      -> repositories/uploadStorage.js          (arquivo em disco via multer)
```

- `routes/documentRoutes.js`: define `POST /upload`, `GET /documents` e
  `GET /documents/:id/download`, aplicando `upload.single('file')` na rota de
  upload.
- `controllers/documentController.js`: valida entrada básica (arquivo e
  `owner`), traduz requisições/respostas HTTP e verifica a existência do
  arquivo antes do download.
- `services/documentService.js`: concentra as regras de negócio descritas na
  seção 3.
- `repositories/documentRepository.js`: mantém os metadados dos documentos em
  memória (array), sem banco de dados nesta fase.
- `repositories/uploadStorage.js`: configura o `multer.diskStorage`,
  definindo `STORAGE_DIR` (via variável de ambiente `STORAGE_DIR` ou
  `backend/storage`) e gerando um nome único (UUID) para cada arquivo.
