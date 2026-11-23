# 04: Pausar, retomar e remover Exemplar + estante pública

Spec: `.scratch/book-lending/spec.md`

**What to build:** O Dono pausa, retoma, edita a observação e remove seus Exemplares, e qualquer visitante vê a estante pública de um Usuário. A projeção de disponibilidade acompanha cada mudança.

**Blocked by:** 03 — Busca e detalhe do Livro com projeção de disponibilidade

**Status:** ready-for-agent

- [ ] `PATCH /copies/:id` com `{ paused?, note? }`; Exemplar Pausado some da contagem e do detalhe do Livro; retomar o devolve
- [ ] `DELETE /copies/:id` faz remoção lógica: o Exemplar some da busca, do detalhe e das estantes, mas continua referenciável pelo histórico
- [ ] Alterar ou remover Exemplar de outro Usuário → 403
- [ ] `GET /users/:id/copies` (público, cursor) lista Exemplares não removidos do Usuário com `available` booleano
- [ ] Testes verificam a contagem na busca após pausar, retomar e remover
