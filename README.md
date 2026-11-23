# apollo11-ia

API Express + TypeScript + Postgres usada em demonstrações.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/customers/:id/charges` | Debita um valor do saldo do cliente. Exige o header `Idempotency-Key` para retentativas seguras. Body: `{ "amount_cents": 2500, "description": "..." }` |
| `GET` | `/customers/:id/orders` | Histórico de pedidos do cliente com itens, total por pedido e total gasto. |

## Rodando

```bash
npm install
npm run db:up      # Postgres 17 via docker compose (porta 5544)
npm run db:seed    # schema + massa de dados (2k clientes, 400k pedidos, 2M itens)
npm run dev        # http://localhost:3000
```

```bash
curl -X POST localhost:3000/customers/7/charges \
  -H 'Idempotency-Key: 6f1c...' -H 'Content-Type: application/json' \
  -d '{"amount_cents": 2500}'

curl localhost:3000/customers/42/orders
```

## Testes

```bash
npm run typecheck
npm test           # integração contra o Postgres do docker compose (banco apollo_test)
```
