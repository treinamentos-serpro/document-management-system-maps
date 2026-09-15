---
description: Cria uma documentação do backend
name: documentacao
argument-hint: nome do recurso (ex. documents)
agent: agent
---

# Documentação de um recurso do backend

Gere a documentação técnica do recurso `${input:recurso:nome do recurso}` com base no código existente em `backend/src` (routes, controllers, services, repositories).

Crie o arquivo `docs/specs/${input:recurso}-doc.md` contendo:

1. Objetivo do recurso.
2. Endpoints expostos (método, rota, entrada, saída, códigos de erro).
3. Regras de negócio implementadas nos services.
4. Modelo de dados/metadados utilizado.
5. Camadas e arquivos envolvidos (routes -> controllers -> services -> repositories).

Requisitos:

- Baseie o conteúdo no código real existente, sem inventar comportamento.
- Use como referência o formato de `docs/specs/spec-template.md`.
- Escreva em português.