# Testes do módulo

Rodam fora do Foundry (Node 20+), com um Foundry simulado. No GitHub, rodam a cada envio para a `main`, e a release só é publicada se passarem.

Para rodar na sua máquina (Linux ou macOS), com o módulo em `/home/claude/epm-ficha`, estes testes em `/home/claude/dev` e o Handlebars em `/home/claude/ext/handlebars/handlebars.js` (os mesmos atalhos que o workflow cria):

```
for t in testes/testes/*.mjs; do node "$t" || exit 1; done
```
