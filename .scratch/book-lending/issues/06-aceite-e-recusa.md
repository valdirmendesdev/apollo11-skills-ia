# 06: Aceite e recusa pelo Dono

Spec: `.scratch/book-lending/spec.md`

**What to build:** O Dono aceita uma Solicitação (podendo ajustar a Data prevista de devolução) ou a recusa. Ao aceitar, as demais Solicitações daquele Exemplar sofrem Recusa automática, o Exemplar deixa de ser Disponível e o contato de cada parte passa a ser visível para a outra. Um Empréstimo Aceito pode ser cancelado por qualquer das partes antes da entrega. Pausar ou remover um Exemplar passa a recusar suas Solicitações pendentes.

**Blocked by:** 05 — Solicitação de Empréstimo e consultas pessoais

**Status:** ready-for-agent

- [ ] `POST /loans/:id/accept` com `{ dueDate? }` pelo Dono → `accepted`; `dueDate` ajustada deve ser > hoje e ≤ data do aceite + 60 dias
- [ ] Ao aceitar, todas as outras Solicitações `requested` do Exemplar viram `rejected` na mesma transação
- [ ] Índice único parcial garante no máximo um Empréstimo `accepted`/`handed_over` por Exemplar; teste com aceites paralelos em Solicitações diferentes do mesmo Exemplar → exatamente um sucesso, os demais 409
- [ ] `POST /loans/:id/reject` pelo Dono em `requested` → `rejected`
- [ ] `POST /loans/:id/cancel` por Dono ou Tomador em `accepted` → `cancelled`, e o Exemplar volta a ser Disponível
- [ ] Ações por quem não tem o papel → 403; transições inválidas para o estado atual → 409
- [ ] Contato da outra parte aparece em `GET /loans/:id` e `GET /me/loans` apenas para Empréstimos que passaram por `accepted`
- [ ] Pausar ou remover Exemplar recusa as Solicitações pendentes; remover com Empréstimo ativo → 409
- [ ] Projeção correta após aceite e cancelamento de Aceito (verificado via busca)
