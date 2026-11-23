# 08: Expiração e varredura

Spec: `.scratch/book-lending/spec.md`

**What to build:** Solicitações sem resposta há 7 dias e Empréstimos Aceitos não Entregues há 7 dias expiram. A expiração é avaliada na leitura (rede de segurança) e consolidada no banco por `sweepExpirations({ primary, clock })`, que também atualiza a projeção de disponibilidade na mesma transação. O processo servidor agenda a varredura a cada minuto.

**Blocked by:** 06 — Aceite e recusa pelo Dono

**Status:** ready-for-agent

- [ ] Leituras apresentam como `expired` um Empréstimo `requested` com mais de 7 dias desde a solicitação ou `accepted` com mais de 7 dias desde o aceite
- [ ] Aceitar, entregar ou cancelar um Empréstimo vencido → 409
- [ ] Empréstimos expirados não contam nos limites do Tomador e não bloqueiam nova Solicitação no mesmo Exemplar
- [ ] `sweepExpirations` marca `expired` no banco e ajusta a projeção; avançar o relógio 8 dias e chamar a varredura faz a busca voltar a contar o Exemplar
- [ ] Varredura é idempotente e segura para rodar concorrentemente com requisições
- [ ] Agendamento a cada minuto no servidor (não testado)
