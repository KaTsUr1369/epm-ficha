# Site do Grimório do Multiverso

`index.html` é o site publicado em https://katsur1369.github.io/grimorio-do-multiverso/ (o repositório `grimorio-do-multiverso` só publica).

O site acompanha o módulo: a cada 15 minutos (ou na hora, pelo botão **Run workflow** da aba Actions do `grimorio-do-multiverso`), ele pega a `main` deste repositório e publica:

- `site/index.html` (este arquivo);
- `grimorio.json`, gerado de `scripts/grimorio-dados.mjs` com a versão do `module.json`.

Ou seja: mudou o site, as magias ou a versão aqui na `main`, o site atualiza sozinho. Não edite o `index.html` no `grimorio-do-multiverso`: ele é sobrescrito.
