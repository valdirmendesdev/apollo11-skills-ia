# Empréstimo de Livros

Sistema em que usuários emprestam seus livros físicos uns aos outros. O nome entre crases ao lado de cada termo é o identificador usado no código e na API.

## Pessoas

**Usuário** (`User`):
Pessoa cadastrada no sistema; pode possuir Exemplares e tomar emprestados os de outros.
_Avoid_: Cliente, conta, membro

**Dono** (`owner`):
Papel do Usuário que possui o Exemplar de um Empréstimo.
_Avoid_: Proprietário, emprestador, credor

**Tomador** (`borrower`):
Papel do Usuário que recebe o Exemplar emprestado em um Empréstimo.
_Avoid_: Mutuário, leitor, solicitante

## Acervo

**Livro** (`Book`):
Obra do catálogo compartilhado (título, autor, ISBN), independente de quem a possui.
_Avoid_: Título, obra, item

**Exemplar** (`Copy`):
Cópia física de um Livro pertencente a um Usuário específico.
_Avoid_: Cópia, livro (quando se refere ao objeto físico), unidade

**Disponível** (`available`):
Condição do Exemplar que não está Pausado nem fora de circulação e não tem Empréstimo ativo; só assim pode receber Solicitações.
_Avoid_: Livre, em estoque

**Pausado** (`paused`):
Exemplar que o Dono tirou temporariamente de circulação; não aparece na busca nem recebe Solicitações.
_Avoid_: Inativo, oculto, desativado

## Empréstimo

**Empréstimo** (`Loan`):
Cessão temporária de um Exemplar do Dono ao Tomador, desde a solicitação até o desfecho.
_Avoid_: Locação, aluguel, reserva

**Solicitação** (`requested Loan`):
Empréstimo no estado inicial, aguardando decisão do Dono; um Exemplar pode ter várias ao mesmo tempo.
_Avoid_: Pedido, requisição

**Empréstimo ativo** (`active Loan`):
Empréstimo Aceito ou Entregue; um Exemplar tem no máximo um.
_Avoid_: Empréstimo em aberto, em andamento

**Recusa automática** (`auto-rejection`):
Recusa das demais Solicitações de um Exemplar quando o Dono aceita uma delas.

**Data prevista de devolução** (`dueDate`):
Data proposta pelo Tomador e confirmada (ou ajustada) pelo Dono ao aceitar.
_Avoid_: Vencimento, deadline

**Expiração** (`expiration`):
Encerramento automático de uma Solicitação sem resposta ou de um Empréstimo Aceito não Entregue após 7 dias.
_Avoid_: Timeout, caducidade

**Atrasado** (`overdue`):
Empréstimo Entregue cuja Data prevista de devolução já passou.
_Avoid_: Vencido, inadimplente

## Estados do Empréstimo

- **Solicitado** (`requested`): aguardando decisão do Dono.
- **Aceito** (`accepted`): o Dono concordou; aguardando a entrega do Exemplar.
- **Entregue** (`handed_over`): o Exemplar está com o Tomador (confirmado pelo Dono).
- **Devolvido** (`returned`): o Exemplar voltou ao Dono (confirmado pelo Dono). Terminal.
- **Recusado** (`rejected`): o Dono recusou, ou houve Recusa automática. Terminal.
- **Cancelado** (`cancelled`): o Tomador (antes da entrega) ou o Dono (quando Aceito) desistiu. Terminal.
- **Expirado** (`expired`): encerrado por Expiração. Terminal.
- **Extraviado** (`lost`): o Dono declarou que o Exemplar não voltará; o Exemplar sai de circulação. Terminal.
_Avoid_: Perdido, finalizado, concluído (use o estado terminal específico)
