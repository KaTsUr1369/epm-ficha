# Escolhidos pelo Multiverso: Ficha

Ficha de personagem do sistema **Escolhidos pelo Multiverso (EPM)** para o Foundry VTT v13 com o sistema dnd5e 5.x.

O módulo registra uma ficha própria para personagens do dnd5e. Os dados do EPM ficam nas flags do ator (`flags.epm-ficha`); a Vida usa o campo nativo do dnd5e, então a barra do token e a aplicação de dano continuam funcionando.

## Instalação

No Foundry: **Módulos complementares → Instalar módulo → URL do manifesto**:

```
https://github.com/KaTsUr1369/epm-ficha/releases/latest/download/module.json
```

Ative o módulo no mundo. A ficha EPM vira a ficha padrão de personagens; para trocar uma ficha específica, use o botão de configuração da ficha (ícone de engrenagem no topo).

## Novidades da 0.2.2

- A vida temporária virou a caixa "Temp" no quadro de Vida: clicando, abre um mini editor com « ‹ › » e campo para digitar (Enter confirma, Esc fecha).

## Novidades da 0.2.1

- Setas em volta dos recursos: « e » mudam 5, ‹ e › mudam 1, sem precisar do modo edição.
- Aparência (aba Sobre) aceita imagem, texto ou os dois juntos.

## Novidades da 0.2

- **Modo edição** (interruptor no canto do cabeçalho, como no D&D 5e): fora dele a ficha mostra só os números; dentro dele aparecem os campos de máximo, atributos, perícias, detalhes de itens e textos. Valores atuais de Vida, Mana, Estamina e Sanidade, PT, PH e PEv, quantidades, condições e interruptores continuam editáveis sempre.
- **Imagens do computador:** retrato, aparência, Marca, itens, habilidades e magias aceitam imagem enviada do computador do jogador ou escolhida nos arquivos do Foundry. As imagens enviadas vão para a pasta `epm-ficha-imagens` (criada quando o Mestre entra no mundo). O jogador precisa das permissões "Usar navegador de arquivos" e "Enviar arquivos" (Configurações → Configurar permissões).
- **Principal:** faixa de PEv, PT e PH sempre editável; caixas separadas para Condições, Resistências (resiste, imune, vulnerável) e Idiomas.
- **Atributos:** só o valor final na tela; no modo edição, Base, Raça, Aumento e Outros, aceitando negativos (duas bases em −1 liberam uma em 4).
- **Perícias:** lista oficial; cada perícia soma o atributo escolhido (ou mais de um) e tem campo Outros. Limite por perícia sobe +5 nos níveis 15 e 35.
- **Aba Combate:** CA, deslocamento, iniciativa (Destreza), defesas (CA + pontos da perícia), turno, exaustão, ataques (armas equipadas e ataques personalizados) e bônus de cena que somam em todos os ataques.
- **Ataques:** antes de rolar, escolha normal, vantagem ou desvantagem, bônus externo no acerto e no dano e ajuste a margem e o multiplicador de crítico. No crítico os dados da arma são multiplicados (2d10 ×3 = 6d10).
- **Vida temporária** numa segunda barra amarela, que só aparece quando existe.
- **Habilidades e magias** custam Mana ou Estamina (sem usos limitados). A CD de resistência é calculada: 8 + Arcanismo.

## Abas

- **Principal:** PEv, PT e PH; condições, resistências e idiomas; atributos; perícias; progressão.
- **Combate:** defesas, turno, exaustão, descansos, ataques e bônus de cena.
- **Inventário:** carteira com Joias de Kan, Platina, Ouro, Prata e Cobre (receber, pagar com troco automático, consolidar), filtro por raridade e categorias Armas, Consumíveis, Armaduras, Ferramentas, Mochilas e Loot. Dentro de cada categoria, favoritos vêm primeiro e o resto é agrupado por raridade (Comum, Rara, Épica, Lendária, Mítica, Arcaica).
- **Habilidades:** seções Comum, Rara, Épica, Lendária, Única e Passivas, com contador do limite de cada raridade.
- **Magias:** sub-abas Truques e 1º a 6º Círculo.
- **Sobre:** traços (idade, altura, olhos…), Tema, Marca e textos longos (história, personalidade…).
- **Anotações:** páginas criadas pelo jogador, cada uma de texto livre ou mapa mental.
- **Condições:** condições clicáveis que mudam a ficha, exaustão e listas de resistências, vulnerabilidades, imunidades e idiomas.
- **Bênçãos:** bênçãos e maldições com interruptor e modificadores que entram nos números da ficha.
- **Relações:** personagens arrastados da barra lateral, com tipo de relação e afinidade.

## Regras automatizadas

- Atributos: 16 pontos + 1 a cada nível par; avisos das regras do nível 1 (máximo 3, um atributo em 4 se dois ficarem em 1).
- Perícias: 45 pontos + 15 a cada 5 níveis; limite de 5 por perícia, +5 a cada 5 níveis.
- Subir de nível cobra 2 × (novo nível − 1) PEv e lista o que foi ganho; conversões 5 PT → 1 PH e 2 PEv → 1 PH (Shift converte tudo).
- Criar ou aprender habilidades e magias cobra PH conforme a raridade e confere os limites (Épica 4, Lendária 3, Única 2). Arrastar uma habilidade ou magia de um compêndio pergunta se é "aprender".
- Melhorias com PT seguem a tabela do sistema: dano é somado à fórmula, troca de ação muda a forma e o teto de dano e de efeitos da raridade é conferido antes de cobrar.
- Formas: uma habilidade ou magia pode ter vários modos, cada um com ação, custo (PM, PE, PV ou PS), teste, dano e requisitos. Ao usar, o jogador escolhe a forma, o custo é descontado e um cartão vai para o chat com botões de rolagem.
- Condições: Lento corta o deslocamento pela metade, Preso zera o deslocamento e bloqueia formas com requisito gestual ou de movimento, Silenciado bloqueia o verbal, Envenenado dá desvantagem em testes, e assim por diante. Imunidade com o mesmo nome da condição anula o efeito.
- Exaustão 1 a 6+ com os efeitos do sistema, dias de coma rolados na ficha e botão de acordar (volta com Exaustão 3).
- Defesas: Esquiva (CA + Acrobacia), Bloqueio (CA + Fortitude) e Contra-ataque (CA + Luta); cada uso conta uma ação do próximo turno, descontada no botão Novo turno.
- Testes: 1d20 + valor (configurável). Shift rola com vantagem, Ctrl com desvantagem; desvantagens de condições e exaustão entram sozinhas. A iniciativa da ficha e a do Combat Tracker usam a perícia Iniciativa.
- Recursos no cabeçalho aceitam `+5` e `-3` para somar ou tirar.

## Personalização

Quase tudo que é regra ou rótulo está em `scripts/config.mjs`: nomes dos recursos (trocar "Esforço" por "Estamina", por exemplo), lista inicial de perícias, condições e seus efeitos, raridades, custos, moedas, tabela de melhorias.

A lista de perícias também pode ser editada dentro da ficha (lápis no painel Perícias). O Mestre pode salvá-la como padrão do mundo; fichas antigas recebem as que faltam com "Trazer do padrão".

Fórmulas aceitam `@atr.forca`, `@atr.nucleo`, `@per.luta`, `@nivel`, `@ca` e `@cd`.

Itens com Active Effects podem mexer nos números da ficha usando chaves como `flags.epm-ficha.mods.atributos.forca`, `flags.epm-ficha.mods.pericias.luta`, `flags.epm-ficha.mods.recursos.pm`, `flags.epm-ficha.mods.ca` ou `flags.epm-ficha.mods.deslocamento` (modo Adicionar).

## Opções do módulo

Em **Configurar opções → Escolhidos pelo Multiverso: Ficha**: condições no HUD do token, limites de raridade separados ou somados, bloqueio de limites para jogadores, dado dos testes e marcação automática de ações em combate.

## Publicar uma nova versão

1. Faça commit das mudanças.
2. Crie uma release no GitHub com a tag `vX.Y.Z` (por exemplo `v0.1.1`).
3. A ação `.github/workflows/release.yml` gera `module.zip` e `module.json` com a versão e anexa os dois à release. O Foundry passa a oferecer a atualização.

## Créditos

Fonte Cormorant Garamond (SIL Open Font License, ver `fonts/OFL.txt`).
