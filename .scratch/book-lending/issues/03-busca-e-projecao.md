# 03: Busca e detalhe do Livro com projeção de disponibilidade

Spec: `.scratch/book-lending/spec.md`

**What to build:** Qualquer visitante (sem autenticação) busca Livros por texto e cidade e vê quantos Exemplares estão Disponíveis, e abre o detalhe de um Livro com os Exemplares Disponíveis e o nome de exibição e a cidade de cada Dono. A disponibilidade vem da projeção desnormalizada `book_availability` (Livro × cidade → contagem), mantida por um único módulo e atualizada na mesma transação de cada escrita que a afeta (ver ADR-0001). Neste ticket, as escritas que a afetam são: cadastro de Exemplar e mudança de cidade do Dono em `PUT /me`.

**Blocked by:** 02 — Cadastro de Exemplar e "minha estante"

**Status:** ready-for-agent

- [ ] `GET /books?q=&city=&available=true&limit=&cursor=` devolve `{ items: [{ id, isbn, title, authors, availableCount }], nextCursor }`
- [ ] Busca textual por título/autor tolera acentuação e pequenas diferenças de grafia (`tsvector` + `pg_trgm`)
- [ ] Sem `city`, `availableCount` é o total; com `city`, comparação normalizada
- [ ] Paginação keyset: com `q`, ordem (relevância, id); sem `q`, (título, id); sem itens repetidos ou omitidos entre páginas
- [ ] `GET /books/:id?city=` devolve o Livro e seus Exemplares Disponíveis com `owner: { id, displayName, city }` — nunca o contato
- [ ] Exemplar de Dono que muda de cidade passa a contar na cidade nova e deixa de contar na antiga
- [ ] Rotas públicas não exigem token
- [ ] Testes verificam a contagem apenas via respostas HTTP
