# 09: Cache HTTP e pool de leitura nas rotas públicas

Spec: `.scratch/book-lending/spec.md`

**What to build:** As rotas públicas de catálogo (`GET /books`, `GET /books/:id`, `GET /users/:id/copies`) passam a ler pelo pool `read` e a ser cacheáveis por proxy/CDN; as rotas autenticadas nunca são cacheadas. Ver ADR-0001.

**Blocked by:** 04 — Pausar, retomar e remover Exemplar + estante pública

**Status:** ready-for-agent

- [ ] Rotas públicas usam exclusivamente o pool `read`; escritas e rotas pessoais usam `primary`
- [ ] Rotas públicas respondem `Cache-Control: public, max-age=5, stale-while-revalidate=30` e `ETag`
- [ ] `If-None-Match` com ETag atual → `304` sem corpo
- [ ] Rotas autenticadas respondem `Cache-Control: no-store`
- [ ] Respostas públicas não variam por usuário (cidade só via parâmetro explícito)
- [ ] Testes cobrem cabeçalhos e `304`
