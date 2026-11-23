# 05: Solicitação de Empréstimo e consultas pessoais

Spec: `.scratch/book-lending/spec.md`

**What to build:** O Tomador solicita um Exemplar Disponível propondo uma Data prevista de devolução, pode cancelar a Solicitação, e consulta seus Empréstimos; o Dono vê as Solicitações recebidas. Introduz a máquina de estados do Empréstimo como função pura de transição (estado + ator + ação + agora → novo estado ou erro), usada por um serviço transacional.

**Blocked by:** 04 — Pausar, retomar e remover Exemplar + estante pública

**Status:** ready-for-agent

- [ ] `POST /loans` com `{ copyId, dueDate }` cria Empréstimo `requested` (201); idempotente
- [ ] `dueDate` é `YYYY-MM-DD` em `America/Sao_Paulo`, deve ser > hoje e ≤ hoje + 60 dias, senão 422
- [ ] Solicitar o próprio Exemplar → 422; Exemplar Pausado, removido, Extraviado ou com Empréstimo ativo → 409 (verificado no pool `primary`)
- [ ] Segunda Solicitação pendente do mesmo Tomador para o mesmo Exemplar → 409 (índice único parcial)
- [ ] Limites por Tomador: 10 Solicitações pendentes e 5 Empréstimos ativos → 422
- [ ] Usuário sem perfil → 403
- [ ] `POST /loans/:id/cancel` pelo Tomador em `requested` → `cancelled`; pelo Dono em `requested` → 403 (o Dono recusa, não cancela)
- [ ] `GET /loans/:id` só para Dono ou Tomador; terceiros → 404
- [ ] `GET /me/loans?role=owner|borrower&status=&limit=&cursor=` lista com paginação keyset
- [ ] Testes cobrem os casos acima
