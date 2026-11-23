# 07: Entrega, devolução, extravio e Atrasado

Spec: `.scratch/book-lending/spec.md`

**What to build:** O Dono confirma a entrega e a devolução do Exemplar, ou declara o Exemplar Extraviado. Empréstimos Entregues cuja Data prevista de devolução passou aparecem como Atrasados.

**Blocked by:** 06 — Aceite e recusa pelo Dono

**Status:** ready-for-agent

- [ ] `POST /loans/:id/hand-over` pelo Dono em `accepted` → `handed_over`
- [ ] `POST /loans/:id/return` pelo Dono em `handed_over` → `returned`; Exemplar volta a ser Disponível na busca
- [ ] `POST /loans/:id/mark-lost` pelo Dono em `handed_over` → `lost`; o Exemplar fica `lost` e sai de circulação definitivamente
- [ ] Tomador tentando essas ações → 403; estados inválidos → 409
- [ ] Campo `overdue` (derivado, nunca armazenado) é `true` quando `handed_over` e hoje (`America/Sao_Paulo`, via `clock`) > `dueDate`
- [ ] `GET /me/loans?overdue=true` filtra Atrasados
- [ ] Testes usam relógio controlável para Atrasado
