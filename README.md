# apollo11-ia — API de empréstimo de livros

Spec: `.scratch/book-lending/spec.md` · Vocabulário: `GLOSSARY.md` · Decisões: `docs/adr/`.

```sh
npm install
npm run db:up        # Postgres 17 em docker (localhost:5544)
npm run db:migrate   # aplica db/migrations/*.sql pendentes
JWT_SECRET=dev-secret-at-least-32-bytes-long!! npm run dev
npm run typecheck
npm test             # recria o banco apollo_test e roda os testes de integração
```

Variáveis: `DATABASE_URL` (pool `primary`), `READ_DATABASE_URL` (pool `read`, padrão = `DATABASE_URL`),
`JWT_SECRET` (HS256; o `sub` do token é o id do Usuário), `PORT`.
