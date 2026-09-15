# Especificação - Document Management System

## 1. Objetivo

Fornecer um sistema web simples para upload, listagem e download de documentos, com armazenamento local em disco e metadados básicos por usuário.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário (identificação do dono do documento)

### Fora do escopo

- Armazenamento externo ou em nuvem
- Versionamento de documentos
- Autenticação/autorização completa (login, senha, permissões)
- Edição ou exclusão de documentos

## 3. Requisitos funcionais

| ID    | Requisito                                                        |
| ----- | ----------------------------------------------------------------- |
| RF-01 | O usuário pode enviar um documento via `POST /upload`             |
| RF-02 | O usuário pode listar os documentos enviados via `GET /documents` |
| RF-03 | O usuário pode baixar um documento pelo identificador via `GET /documents/:id/download` |
| RF-04 | O sistema associa cada documento enviado a um `owner` informado na requisição |

## 4. Requisitos não funcionais

| ID     | Requisito                                                           |
| ------ | -------------------------------------------------------------------- |
| RNF-01 | Arquivos são gravados no filesystem local via `multer` (diskStorage), na pasta `backend/storage` |
| RNF-02 | Metadados dos documentos são mantidos em memória nesta fase (sem banco de dados) |
| RNF-03 | Configuração (porta, caminhos) via variáveis de ambiente (12-Factor App) |
| RNF-04 | Erros são tratados nos limites do sistema (entrada HTTP, leitura/escrita de arquivos), retornando status HTTP apropriados |
| RNF-05 | Metadados em memória são perdidos ao reiniciar o processo (limitação conhecida desta fase) |

## 5. Modelo de dados (metadados do documento)

| Campo        | Tipo   | Descrição                                          |
| ------------ | ------ | --------------------------------------------------- |
| id           | string | Identificador único do documento (gerado pelo servidor) |
| originalName | string | Nome original do arquivo enviado                     |
| size         | number | Tamanho em bytes                                     |
| uploadedAt   | string | Data/hora do upload (ISO 8601)                       |
| owner        | string | Identificador do usuário dono do documento           |

## 6. Contratos de API

### POST /upload

- Entrada: `multipart/form-data` com campo `file` (arquivo) e campo `owner` (string)
- Saída (201): metadados do documento criado (`id`, `originalName`, `size`, `uploadedAt`, `owner`)
- Erros:
  - 400: arquivo ausente ou `owner` não informado
  - 500: falha ao gravar o arquivo no disco

### GET /documents

- Entrada: nenhuma (opcionalmente filtro por `owner` via query string)
- Saída (200): lista de metadados de documentos

### GET /documents/:id/download

- Entrada: `id` do documento na URL
- Saída (200): conteúdo binário do arquivo, com `Content-Disposition` e `Content-Type` apropriados
- Erros:
  - 404: documento não encontrado ou arquivo ausente no disco

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples: `routes -> controllers -> services -> repositories`, sem que camadas internas conheçam camadas externas
- `routes/`: definem endpoints e delegam para `controllers/`
- `controllers/`: tratam entrada/saída HTTP e validação básica
- `services/`: concentram as regras de negócio (ex.: geração de metadados, validações de domínio)
- `repositories/`: cuidam da persistência (gravação em disco via multer e armazenamento de metadados em memória)
- Frontend baseado em componentes React, organizado em `components/`, `pages/`, `services/`, comunicando-se com o backend via `fetch` sob o prefixo `/api`
- Armazenamento estritamente local: sem provedores externos ou serviços de upload de terceiros

## 8. Plano de execução

1. Implementar camada `repositories/` para persistência de arquivos (multer/diskStorage) e metadados em memória
2. Implementar camada `services/` com as regras de negócio de upload, listagem e download
3. Implementar camada `controllers/` para tratar entrada/saída HTTP e validações básicas
4. Implementar camada `routes/` conectando os endpoints `/upload`, `/documents` e `/documents/:id/download`
5. Escrever testes de backend (`node:test`) cobrindo os três endpoints
6. Implementar páginas e componentes do frontend para upload, listagem e download de documentos
7. Integrar frontend ao backend via `services/` (fetch) sob o prefixo `/api`
8. Validar o fluxo completo ponta a ponta (upload -> listagem -> download)
