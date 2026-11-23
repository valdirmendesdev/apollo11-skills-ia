# 02: Cadastro de Exemplar e "minha estante"

Spec: `.scratch/book-lending/spec.md`

**What to build:** O Dono cadastra um Exemplar e o vê na sua estante. O Exemplar pode apontar para um Livro existente (`bookId`) ou trazer dados de Livro (ISBN opcional, título, autores); com ISBN já existente no catálogo, o Exemplar é vinculado ao Livro existente. Este ticket também introduz a idempotência por `Idempotency-Key`, que passa a valer para todo `POST` (este e os dos tickets seguintes).

**Blocked by:** 01 — Esqueleto da aplicação + perfil

**Status:** ready-for-agent

- [ ] `POST /copies` com `{ isbn?, title, authors, note? }` cria Livro + Exemplar; repetir o mesmo ISBN (10 ou 13, normalizado) reaproveita o Livro
- [ ] `POST /copies` sem ISBN sempre cria um novo Livro
- [ ] `POST /copies` com `bookId` vincula ao Livro existente; `bookId` inexistente → 404
- [ ] Usuário sem perfil → 403 `problem+json` (tipo "perfil obrigatório")
- [ ] `GET /me/copies` lista os Exemplares do Usuário com estado, paginação por cursor (limite padrão 20, máx. 50)
- [ ] `Idempotency-Key` em `POST`: repetição devolve a mesma resposta sem criar outro Exemplar; mesma chave com corpo diferente → 422; escopo por (Usuário, rota)
- [ ] Testes de integração cobrem os casos acima
