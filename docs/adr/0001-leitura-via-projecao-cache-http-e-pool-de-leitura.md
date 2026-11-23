# Leitura escalada por projeção desnormalizada, cache HTTP e pool de leitura separado

O sistema é dominado por leitura (busca no catálogo e detalhe de Livro, alvo de ~5k leituras/s contra ~20 escritas/s). Decidimos manter tudo no Postgres: a disponibilidade por Livro e cidade é mantida numa projeção desnormalizada (`livro_disponibilidade`) atualizada na **mesma transação** de cada mudança de estado de Exemplar/Empréstimo, a busca textual usa `pg_trgm`/`tsvector`, as rotas públicas de catálogo saem com `Cache-Control` curto (`max-age=5, stale-while-revalidate`) + `ETag`, e a aplicação tem dois pools desde o dia 1 — `read` (catálogo/busca, apontável para réplica) e `primary` (escritas e rotas "meus…", que exigem read-your-writes). Na hora de solicitar, a disponibilidade é sempre verificada no `primary`.

## Considered Options

- **Elasticsearch/OpenSearch para busca**: rejeitado na v1 — mais uma peça para manter sincronizada; `pg_trgm` atende a escala alvo.
- **Redis como cache principal**: adiado — cache HTTP + réplica devem bastar; Redis entra só se medições mostrarem necessidade.
- **Agregar disponibilidade em tempo de consulta (JOIN + COUNT)**: rejeitado — custo cresce com o acervo e roda na rota mais quente.

## Consequences

- Toda escrita que muda a disponibilidade de um Exemplar precisa atualizar a projeção na mesma transação; esquecer isso gera contagens erradas na busca.
- A busca pode mostrar disponibilidade com alguns segundos de defasagem (cache + réplica); isso é aceito.
- Expirações não podem ser só preguiçosas: a projeção é um contador e ficaria errada até a próxima escrita. Um job de varredura a cada minuto marca Empréstimos Expirados e ajusta a projeção na mesma transação; a avaliação na leitura permanece como rede de segurança para a janela de até um minuto.
- As rotas de catálogo/busca são públicas e sem personalização (cidade como parâmetro explícito), para que o cache HTTP seja compartilhável.
