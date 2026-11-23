# 01: Esqueleto da aplicação + perfil (`/me`)

Spec: `.scratch/book-lending/spec.md`

**What to build:** Um Usuário autenticado por JWT externo consegue cadastrar, atualizar e consultar seu perfil (nome de exibição, cidade, contato). Junto vem a base sobre a qual todos os outros tickets constroem: aplicação montada por `createApp({ primary, read, clock, auth })`, migrações, erros em `problem+json` e o harness de testes de integração contra Postgres real (banco de teste recriado e migrado num global setup, dados limpos antes de cada teste, tokens assinados nos testes com chave de teste).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `PUT /me` cria ou atualiza o perfil do Usuário identificado pelo `sub` do JWT; `GET /me` o devolve
- [x] Cidade é armazenada também em forma normalizada (trim, minúsculas, sem acento)
- [x] Requisição sem token ou com token inválido → 401 `problem+json`
- [x] Corpo inválido → 400 `problem+json` com detalhes de validação (zod)
- [x] `GET /me` sem perfil cadastrado → 404 `problem+json`
- [x] Scripts de desenvolvimento: subir Postgres em docker, migrar, rodar servidor, typecheck e testes
- [x] Testes de integração via supertest cobrem os casos acima

## Comments

- Implementado. Notas para os próximos tickets:
  - `normalizeCity` (`src/users/city.ts`) não tem teste nesta fatia: a spec proíbe consultar tabelas nos testes e nenhuma rota expõe a forma normalizada ainda. O ticket 03 (busca por cidade) deve cobri-la via HTTP. Além de trim/minúsculas/sem acento, ela colapsa espaços internos.
  - A expiração do JWT é verificada contra o relógio real, não contra o `clock` injetado (é regra de autenticação, não de domínio). Testes que avançam o `clock` continuam usando tokens válidos em tempo real (`tokenFor`).
  - `Cache-Control: no-store` nas rotas autenticadas ficou para o ticket 09.
  - Helpers de teste: `as(app, sub)` (requisições autenticadas), `tokenFor({ sub, secret, expiresAt })`, `expectProblem(res, status, type)`.
