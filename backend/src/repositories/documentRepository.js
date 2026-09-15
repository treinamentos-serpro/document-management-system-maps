// Persistência dos metadados dos documentos em memória (sem banco de dados nesta fase).
const documents = [];

function create(document) {
  documents.push(document);
  return document;
}

function findAll(owner) {
  if (owner) {
    return documents.filter((document) => document.owner === owner);
  }
  return [...documents];
}

function findById(id) {
  return documents.find((document) => document.id === id);
}

module.exports = { create, findAll, findById };
