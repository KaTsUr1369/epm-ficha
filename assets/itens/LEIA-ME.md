# Ícones dos itens

Há dois tipos de arquivo nesta pasta:

- **Ícones de categoria** (`armas-corpo.svg`, `pocoes.svg`…): o padrão do módulo, usado quando o item não tem ícone próprio nem arte do Foundry.
- **Ícones próprios de itens** (`categoria.nome-do-item.svg`): SVG de 128 × 128. O nome do arquivo é o id do item no catálogo. O `icones.json` lista todos, com nome, raridade e região.

## Ícones próprios (378)

- **Umbra'Draxil (105):** itens de raridade Rara para cima. Os comuns continuam com a arte do próprio Foundry.
- **Briavoterna (177) e Genesis (96):** todos os itens, comuns incluídos, porque o Foundry quase não tem arte moderna ou futurista.

## Como ler um ícone

- **Moldura:** cor da raridade. Comum (cinza), Rara (azul), Épica (roxo), Lendária (dourado, com losango no topo), Mítica (vermelho, com losango no topo).
- **Cantos:** marca da região. Traço rúnico em Umbra'Draxil, cantoneira com rebite em Briavoterna, trilha de circuito em Genesis.
- **Poções:** a cor do líquido indica o tipo; o selo no canto indica o efeito (escudo cheio = Proteção, escudo pela metade = Resistência, estrela = Suprema).
- **Munição:** a cor da ponta ou da ogiva indica o tipo; o tamanho do cartucho indica o calibre (Pistola, Rifle, .50).

## Nomes

Itens que ainda não estão no catálogo do módulo (Briavoterna, Genesis e as munições novas de `EPM/itens/municoes.md`) usam os nomes dos documentos do Projeto. Se o catálogo usar outro nome, renomeie o arquivo para o id novo.
