# Spec: API de empréstimo de livros entre Usuários

Status: ready-for-agent

Vocabulário: ver `GLOSSARY.md`. Arquitetura de leitura: ver `docs/adr/0001-leitura-via-projecao-cache-http-e-pool-de-leitura.md`.

## Problem Statement

Pessoas têm livros físicos parados na estante e querem emprestá-los a outras pessoas — e, do outro lado, querem ler livros sem comprá-los. Hoje não há um lugar para descobrir quem perto de mim tem um Exemplar Disponível de um Livro, pedir esse empréstimo, combinar a devolução e acompanhar quem está com o quê. Sem isso, empréstimos se perdem, ninguém lembra a data combinada e o Dono não tem como saber o histórico de quem pegou seu livro.

O uso é fortemente dominado por leitura: muito mais gente navega e busca no catálogo do que efetivamente solicita ou aceita Empréstimos. A API precisa responder a buscas e detalhes de Livro de forma rápida e barata mesmo sob pico, sem comprometer a correção das escritas.

## Solution

Uma API HTTP/JSON (sem interface) em que:

- Cada Usuário mantém um perfil (nome de exibição, cidade, contato) e cadastra seus Exemplares, vinculados a um catálogo compartilhado de Livros (deduplicado por ISBN quando houver).
- Qualquer pessoa, mesmo sem autenticação, busca Livros por texto e cidade e vê quantos Exemplares estão Disponíveis e de quais Donos (nome de exibição e cidade).
- Um Tomador solicita um Exemplar propondo uma Data prevista de devolução; o Dono aceita (podendo ajustar a data) ou recusa; ao aceitar, as demais Solicitações daquele Exemplar sofrem Recusa automática e o contato de cada parte é revelado à outra.
- O Dono confirma a entrega e a devolução, ou declara o Exemplar Extraviado. Solicitações e Empréstimos Aceitos sem andamento expiram sozinhos em 7 dias.
- Dono e Tomador consultam seus Empréstimos ativos, pendentes, Atrasados e o histórico completo.
- As rotas públicas de catálogo são servidas a partir de uma projeção desnormalizada de disponibilidade, com cache HTTP curto e um pool de conexões de leitura separável para réplica.

## User Stories

### Perfil

1. Como Usuário autenticado, quero cadastrar meu perfil (nome de exibição, cidade e contato), para poder participar de Empréstimos.
2. Como Usuário, quero atualizar meu nome de exibição, cidade e contato a qualquer momento, para manter meus dados corretos.
3. Como Usuário, quero consultar meu próprio perfil, para conferir o que os outros verão.
4. Como Usuário sem perfil cadastrado, quero receber um erro claro ao tentar cadastrar um Exemplar ou solicitar um Empréstimo, para saber que preciso completar o perfil antes.
5. Como Usuário, quero que meu contato só seja visível para quem tem um Empréstimo Aceito comigo, para preservar minha privacidade.
6. Como Dono, quero que, ao mudar de cidade, meus Exemplares passem a aparecer na busca da nova cidade, para que a busca reflita onde eu realmente estou.

### Livros e Exemplares

7. Como Dono, quero cadastrar um Exemplar informando ISBN, título e autor, para disponibilizá-lo para empréstimo.
8. Como Dono, quero que, se o ISBN já existir no catálogo, meu Exemplar seja vinculado ao Livro existente, para não criar Livros duplicados.
9. Como Dono de uma edição antiga sem ISBN, quero cadastrar o Exemplar só com título e autor, para não ficar de fora do sistema.
10. Como Dono, quero cadastrar um Exemplar apontando diretamente para um Livro que já encontrei no catálogo, para não redigitar os dados.
11. Como Dono, quero adicionar uma observação ao Exemplar (ex.: estado de conservação), para que o Tomador saiba o que esperar.
12. Como Dono, quero listar todos os meus Exemplares com o estado de cada um (Disponível, Pausado, emprestado, Extraviado), para gerenciar minha estante.
13. Como Dono, quero pausar um Exemplar, para tirá-lo temporariamente de circulação sem perder o cadastro.
14. Como Dono, quero que pausar um Exemplar recuse as Solicitações pendentes dele, para que ninguém fique esperando algo que não vai acontecer.
15. Como Dono, quero retomar um Exemplar Pausado, para que ele volte a ficar Disponível.
16. Como Dono, quero remover um Exemplar que não tenho mais, para que ele não apareça mais no sistema.
17. Como Dono, quero ser impedido de remover um Exemplar com Empréstimo ativo, para não perder o rastro de um livro que está com alguém.
18. Como Dono, quero que remover um Exemplar recuse as Solicitações pendentes dele, para não deixar Tomadores esperando.
19. Como Dono, quero que o histórico de Empréstimos de um Exemplar removido continue consultável, para ter registro do passado.
20. Como Usuário, quero ser impedido de alterar ou remover Exemplares de outra pessoa.

### Busca e catálogo (público)

21. Como visitante, quero buscar Livros por texto (título ou autor) sem estar autenticado, para descobrir o que existe antes de me cadastrar.
22. Como visitante, quero que a busca tolere pequenas diferenças de grafia e acentuação, para encontrar o Livro mesmo digitando aproximado.
23. Como visitante, quero filtrar a busca por cidade, para ver só o que consigo pegar perto de mim.
24. Como visitante, quero filtrar só Livros com ao menos um Exemplar Disponível, para não perder tempo com o que não está disponível.
25. Como visitante, quero ver em cada resultado quantos Exemplares Disponíveis existem (na cidade filtrada ou no total), para avaliar minhas chances.
26. Como visitante, quero paginar os resultados de forma estável mesmo em listas grandes, para navegar sem itens repetidos ou pulados.
27. Como visitante, quero ver o detalhe de um Livro com a lista de Exemplares Disponíveis, o nome de exibição e a cidade de cada Dono, para escolher de quem solicitar.
28. Como visitante, quero ver a estante pública de um Usuário (seus Exemplares não removidos e quais estão Disponíveis), para conhecer o acervo de alguém.
29. Como visitante, quero que Exemplares Pausados, Extraviados ou removidos não apareçam como Disponíveis, para não ser enganado.
30. Como operador do sistema, quero que as rotas públicas de catálogo sejam cacheáveis por proxy/CDN, para absorver picos de leitura sem sobrecarregar o banco.
31. Como cliente da API, quero receber `304 Not Modified` ao revalidar um recurso de catálogo que não mudou, para economizar banda.
32. Como operador, quero que as rotas públicas de catálogo leiam de um pool de leitura separado, para poder apontá-lo para uma réplica sem mudar código.

### Solicitação

33. Como Tomador, quero solicitar um Exemplar Disponível propondo uma Data prevista de devolução, para pedir o livro emprestado.
34. Como Tomador, quero ser impedido de solicitar meu próprio Exemplar.
35. Como Tomador, quero ser impedido de criar uma segunda Solicitação pendente para o mesmo Exemplar, para evitar duplicidade.
36. Como Tomador, quero ser impedido de solicitar um Exemplar Pausado, Extraviado, removido ou com Empréstimo ativo, e receber um erro explicando o motivo.
37. Como Tomador, quero que a Data prevista de devolução proposta seja validada (posterior a hoje e no máximo 60 dias à frente), para não propor algo que o sistema vai rejeitar.
38. Como sistema, quero limitar cada Tomador a 10 Solicitações pendentes, para conter abuso.
39. Como sistema, quero limitar cada Tomador a 5 Empréstimos ativos, para conter abuso.
40. Como Tomador, quero cancelar minha Solicitação enquanto ela não foi respondida.
41. Como Tomador, quero que reenviar a mesma requisição de Solicitação com a mesma chave de idempotência não crie uma Solicitação duplicada, para poder repetir com segurança em caso de falha de rede.
42. Como Tomador, quero que minha Solicitação expire após 7 dias sem resposta, para não ficar presa indefinidamente.

### Decisão do Dono

43. Como Dono, quero listar as Solicitações pendentes dos meus Exemplares, para decidir a quem emprestar.
44. Como Dono, quero aceitar uma Solicitação, para emprestar o Exemplar àquele Tomador.
45. Como Dono, quero ajustar a Data prevista de devolução ao aceitar, respeitando o limite de 60 dias a partir do aceite.
46. Como Dono, quero que, ao aceitar uma Solicitação, todas as outras Solicitações pendentes daquele Exemplar sejam recusadas automaticamente.
47. Como Dono, quero recusar uma Solicitação.
48. Como Dono, quero que dois aceites simultâneos para o mesmo Exemplar nunca resultem em dois Empréstimos ativos, para não prometer o mesmo livro a duas pessoas.
49. Como Dono, quero ser impedido de aceitar uma Solicitação já expirada, cancelada ou recusada.
50. Como Dono e como Tomador, quero ver o contato da outra parte assim que o Empréstimo for Aceito, para combinar a entrega fora do sistema.
51. Como Dono, quero cancelar um Empréstimo Aceito antes da entrega, caso desista.
52. Como Tomador, quero cancelar um Empréstimo Aceito antes da entrega, caso desista.
53. Como Dono, quero que um Empréstimo Aceito não Entregue expire após 7 dias, liberando o Exemplar.

### Entrega, devolução e desfechos

54. Como Dono, quero confirmar a entrega do Exemplar, para marcar o início efetivo do Empréstimo.
55. Como Dono, quero confirmar a devolução do Exemplar, para que ele volte a ficar Disponível.
56. Como Dono, quero declarar um Exemplar Extraviado a partir de um Empréstimo Entregue, para encerrar o caso de um livro que não vai voltar.
57. Como Dono, quero que um Exemplar Extraviado saia de circulação definitivamente.
58. Como Tomador, quero ser impedido de confirmar entrega, devolução ou extravio, pois essas confirmações cabem ao Dono.
59. Como parte de um Empréstimo, quero receber um erro de conflito ao tentar uma transição inválida para o estado atual (ex.: devolver algo não Entregue).
60. Como Dono e como Tomador, quero saber quando um Empréstimo está Atrasado, para cobrar ou me organizar.

### Consultas pessoais

61. Como Tomador, quero listar meus Empréstimos filtrando por estado, para acompanhar o que peguei e o que pedi.
62. Como Dono, quero listar os Empréstimos dos meus Exemplares filtrando por estado, para saber o que está com quem.
63. Como Usuário, quero listar só os Empréstimos Atrasados em que sou parte.
64. Como Usuário, quero ver o histórico completo de Empréstimos encerrados (Devolvido, Recusado, Cancelado, Expirado, Extraviado), para ter registro do passado.
65. Como Usuário, quero ver o detalhe de um Empréstimo em que sou parte, com estados, datas e (se aplicável) o contato da outra parte.
66. Como Usuário, quero ser impedido de ver Empréstimos em que não sou parte.
67. Como Usuário, quero que minhas consultas pessoais reflitam imediatamente o que acabei de fazer, para não ver um estado desatualizado após uma ação minha.

### Operação

68. Como operador, quero que expirações sejam consolidadas por uma varredura periódica, para que a disponibilidade na busca não fique errada esperando uma escrita.
69. Como operador, quero que toda resposta de erro siga um formato padronizado e legível por máquina, para facilitar a integração de clientes.

## Implementation Decisions

### Stack e estrutura

- TypeScript, Express 5, Postgres via `pg` (SQL manual, sem ORM), zod para validação, vitest + supertest para testes. Mesma stack do projeto anterior deste repositório.
- Identificadores de código e da API em inglês, conforme os nomes entre crases no `GLOSSARY.md` (`Book`, `Copy`, `Loan`, `owner`, `borrower`, `dueDate`, estados `requested`/`accepted`/`handed_over`/`returned`/`rejected`/`cancelled`/`expired`/`lost`).
- Ponto de montagem da aplicação: `createApp(deps)` recebe `{ primary, read, clock, auth }`:
  - `primary` e `read`: dois pools Postgres. Rotas públicas de catálogo usam `read`; todas as escritas e rotas pessoais (`/me…`, `/loans…`) usam `primary`.
  - `clock`: fonte de "agora" injetável; toda lógica de tempo (expiração, Atrasado, limites de data) usa esse relógio, nunca `Date.now()` direto.
  - `auth`: configuração de verificação de JWT (chave/segredo). O `sub` do token é o id do Usuário. Sem cadastro/login próprio.
- Função de varredura `sweepExpirations({ primary, clock })` exportada separadamente; o processo servidor a agenda a cada minuto.

### Módulos

- **Auth**: verifica JWT e expõe o id do Usuário à requisição; rotas públicas de catálogo não exigem token.
- **Users**: perfil (nome de exibição, cidade, contato). Cidade é texto livre, comparada de forma normalizada (trim, minúsculas, sem acento).
- **Catalog**: Livros e Exemplares. Deduplicação de Livro por ISBN (normalizado, ISBN-10/13 aceitos); Livros sem ISBN sempre criam um novo Livro. Remoção de Exemplar é lógica (preserva histórico).
- **Loans**: máquina de estados do Empréstimo como função pura de transição (estado atual + ator + ação + agora → novo estado ou erro), envolvida por um serviço transacional que aplica regras de limite, Recusa automática e atualização da projeção.
- **Availability projection** (módulo profundo e único ponto de escrita da projeção): recebe "o Exemplar X mudou" dentro da transação corrente e recalcula sua contribuição. Todas as escritas que afetam disponibilidade (cadastro, pausa, retomada, remoção, aceite, cancelamento de Aceito, expiração de Aceito, devolução, extravio, mudança de cidade do Dono) passam por ele.
- **Search**: consultas de catálogo sobre a projeção + índice textual.
- **HTTP plumbing**: erros `problem+json`, cabeçalhos de cache/ETag, idempotência, paginação por cursor.

### Esquema (forma, não DDL final)

- `users`: id (= `sub` do JWT), display_name, city, city_normalized, contact, timestamps.
- `books`: id, isbn (único quando presente), title, authors, vetor de busca textual + índice trigram sobre título/autor.
- `copies`: id, book_id, owner_id, note, status (`active` | `paused` | `lost` | `removed`), timestamps.
- `loans`: id, copy_id, owner_id (denormalizado), borrower_id, status, due_date (data, sem hora), requested_at, accepted_at, handed_over_at, closed_at, timestamps.
  - Índice único parcial: no máximo um Empréstimo com status em (`accepted`, `handed_over`) por copy_id.
  - Índice único parcial: no máximo um `requested` por (copy_id, borrower_id).
- `book_availability` (projeção): (book_id, city_normalized) → available_count. Disponível = copy `active` + Dono com perfil + sem Empréstimo ativo. Linhas com contagem 0 podem ser removidas.
- `idempotency_keys`: escopo (usuário, rota) + chave → resposta armazenada.

### Regras de negócio

- Perfil obrigatório antes de criar Exemplar ou Solicitação.
- Solicitação: não pode ser no próprio Exemplar; Exemplar precisa estar Disponível no momento (verificado no `primary`); no máximo uma pendente por (Tomador, Exemplar); no máximo 10 Solicitações pendentes e 5 Empréstimos ativos por Tomador.
- `dueDate` é uma data (`YYYY-MM-DD`) no fuso `America/Sao_Paulo`; deve ser > hoje. Na Solicitação, ≤ hoje + 60 dias; no aceite (proposta ou ajustada), ≤ data do aceite + 60 dias.
- Transições permitidas:
  - `requested` → `accepted` (Dono), `rejected` (Dono, Recusa automática, pausa ou remoção do Exemplar), `cancelled` (Tomador), `expired` (7 dias após `requested_at`).
  - `accepted` → `handed_over` (Dono), `cancelled` (Dono ou Tomador), `expired` (7 dias após `accepted_at`).
  - `handed_over` → `returned` (Dono), `lost` (Dono; também marca o Exemplar como `lost`).
  - Estados terminais: `returned`, `rejected`, `cancelled`, `expired`, `lost`.
- Atrasado é derivado (status `handed_over` e hoje > `dueDate`), nunca armazenado; exposto como campo booleano `overdue` e como filtro.
- Expiração: avaliada na leitura (um Empréstimo vencido é apresentado como `expired` e não pode ser aceito/entregue) e consolidada no banco pela varredura, que também atualiza a projeção na mesma transação.
- Pausa permitida mesmo com Empréstimo ativo (só impede novas Solicitações); recusa as Solicitações pendentes. Remoção bloqueada com Empréstimo ativo; recusa as Solicitações pendentes.
- Contato da outra parte incluído no detalhe/listagem do Empréstimo apenas se ele passou por `accepted` (inclusive depois de encerrado).

### Contrato da API (forma)

Públicas (sem auth, servidas pelo pool `read`, `Cache-Control: public, max-age=5, stale-while-revalidate=30` + `ETag`, respondem `304` a `If-None-Match`):
- `GET /books?q=&city=&available=true&limit=&cursor=` → `{ items: [{ id, isbn, title, authors, availableCount }], nextCursor }`. Sem `city`, `availableCount` é o total.
- `GET /books/:id?city=` → Livro + Exemplares Disponíveis (id, note, owner: { id, displayName, city }).
- `GET /users/:id/copies?limit=&cursor=` → estante pública (Exemplares não removidos, com `available` booleano).

Autenticadas (pool `primary`, `Cache-Control: no-store`):
- `GET /me`, `PUT /me` (displayName, city, contact).
- `GET /me/copies`, `POST /copies` (bookId **ou** { isbn?, title, authors }, + note?), `PATCH /copies/:id` (paused: boolean, note), `DELETE /copies/:id`.
- `POST /loans` (copyId, dueDate) → 201 com o Empréstimo `requested`.
- `POST /loans/:id/accept` (dueDate?), `/reject`, `/cancel`, `/hand-over`, `/return`, `/mark-lost`.
- `GET /loans/:id` (só partes).
- `GET /me/loans?role=owner|borrower&status=&overdue=true&limit=&cursor=`.

Convenções:
- Todo `POST` aceita `Idempotency-Key`; escopo por (Usuário, rota); mesma chave com corpo diferente → 422.
- Paginação keyset em toda listagem: `limit` padrão 20, máximo 50; `cursor` opaco; resposta `{ items, nextCursor }`. Na busca com `q`, a ordem é (relevância, id); sem `q`, (título, id).
- Erros em `application/problem+json` com `type` estável por caso: 400 validação; 401 sem/inválido token; 403 perfil ausente ou não é parte/dono; 404 inexistente; 409 transição inválida ou Exemplar indisponível ou Empréstimo ativo; 422 regra de negócio (limites, próprio Exemplar, datas, chave de idempotência reutilizada).

## Testing Decisions

- Bons testes exercitam apenas comportamento externo: requisições HTTP e respostas. Nada de consultar tabelas ou chamar funções internas nos testes — a consistência da projeção é verificada pelo que a busca devolve.
- **Seam principal**: `createApp({ primary, read, clock, auth })` via supertest contra Postgres real em docker. Nos testes, `primary` e `read` apontam para o mesmo banco; `clock` é controlável; tokens são assinados nos próprios testes com uma chave de teste.
- **Seam auxiliar**: `sweepExpirations({ primary, clock })` chamada diretamente, com efeitos verificados via HTTP. O agendamento a cada minuto não é testado.
- Banco de teste recriado e migrado num global setup; dados limpos antes de cada teste.
- Cobertura esperada:
  - Perfil obrigatório; atualização de cidade move a disponibilidade na busca entre cidades.
  - Deduplicação por ISBN; Livros sem ISBN.
  - Toda transição válida e uma amostra representativa das inválidas (409), incluindo permissões Dono × Tomador (403).
  - Recusa automática ao aceitar; recusa por pausa e por remoção.
  - Limites (5 ativos / 10 pendentes / uma pendente por Exemplar / próprio Exemplar).
  - Validação de `dueDate` (passado, > 60 dias, ajuste no aceite).
  - Concorrência: aceites paralelos no mesmo Exemplar → exatamente um sucesso.
  - Idempotência: repetição devolve a mesma resposta; corpo diferente → 422.
  - Projeção: após cada transição que afeta disponibilidade, `availableCount` na busca e no detalhe está correto.
  - Expiração: avançar relógio 8 dias → leitura mostra `expired`; após varredura, busca volta a contar o Exemplar.
  - Atrasado: avançar relógio além de `dueDate` → `overdue: true` e filtro funciona.
  - Visibilidade do contato só após `accepted`; Empréstimo invisível a terceiros (404/403).
  - Cabeçalhos de cache nas rotas públicas, `304` com `If-None-Match`, `no-store` nas pessoais.
  - Paginação por cursor sem repetição/omissão.
- **Prior art**: o projeto anterior deste repositório (removido do working tree; disponível no histórico do git em `d1641c0`) usava exatamente esse padrão — `createApp(pool)` + supertest, global setup que recria o banco de teste e migra, e helper que limpa os dados antes de cada teste.

## Out of Scope

- Interface (web/mobile); só a API.
- Cadastro, login e emissão de tokens (autenticação é externa).
- Dinheiro: caução, multa, aluguel.
- Reputação/avaliação entre Usuários.
- Renovação de Empréstimo.
- Fila de espera/reserva de Exemplar.
- Mensageria/chat entre Usuários e notificações (e-mail, push).
- Busca por raio/geolocalização (apenas cidade).
- Integração com catálogos externos (OpenLibrary, Google Books) e upload de capas.
- Elasticsearch/OpenSearch, Redis, réplica de leitura provisionada (o código só deixa o pool `read` pronto).
- OpenAPI/documentação gerada.
- Moderação/edição colaborativa de dados de Livro e fusão de Livros duplicados sem ISBN.
- Expurgo de histórico.

## Further Notes

- O working tree removeu o projeto anterior (charges/orders); esta spec parte de um repositório sem código.
- O ADR-0001 explica por que tudo fica no Postgres e por que a projeção é atualizada na mesma transação; quem implementar deve garantir que **toda** escrita que afeta disponibilidade passe pelo módulo de projeção.
- Ordem sugerida de fatias verticais: Usuário/`me` → Livro e Exemplar → busca e projeção → ciclo do Empréstimo → expiração e varredura → cache HTTP e pool de leitura.
