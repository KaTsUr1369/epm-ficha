# Escolhidos pelo Multiverso: Ficha

Ficha de personagem do sistema **Escolhidos pelo Multiverso (EPM)** para o Foundry VTT v13 com o sistema dnd5e 5.x.

O módulo registra uma ficha própria para personagens do dnd5e. Os dados do EPM ficam nas flags do ator (`flags.epm-ficha`); a Vida usa o campo nativo do dnd5e, então a barra do token e a aplicação de dano continuam funcionando.

## Instalação

No Foundry: **Módulos complementares → Instalar módulo → URL do manifesto**:

```
https://github.com/KaTsUr1369/epm-ficha/releases/latest/download/module.json
```

Ative o módulo no mundo. A ficha EPM vira a ficha padrão de personagens; para trocar uma ficha específica, use o botão de configuração da ficha (ícone de engrenagem no topo).

## Novidades da 0.9.1

- **Kits iniciais com itens de verdade**: o kit entrega os itens do compêndio EPM · Itens (dano, CA, propriedades, peso e preço), comuns da região de origem da ficha. Umbra'Draxil: Espada Longa, Cota de Malha, Arco Curto, Escudo Redondo…; Briavoterna (e Genesis): Pistola, Armadura Tática, Escudo Policial… Fichas antigas trocam os itens genéricos do kit ("Arma Corpo a Corpo Média" etc.) pelos do compêndio.
- **ND = nível do inimigo** (antes era a metade; o sistema vai até o 50): PEv ao derrotar = 5 × ND. NPC rápido, NPCs modelo e o "Preencher pelo nível" gravam assim; NPCs antigos com o ND automático antigo são corrigidos.
- **Barra de rolagem em todo lugar com texto grande**: janelas de diálogo (do EPM e do Foundry) não passam da tela e o conteúdo rola com os botões sempre visíveis; ficha, habilidade e item rolam; dicas compridas, cartões longos do chat, descrições abertas e campos de texto ganham rolagem; nomes e efeitos cortados com "…" mostram o texto inteiro ao passar o mouse.

## Novidades da 0.9.0

**Sistema de Habilidades, Magias e Rituais**
- **Criador** nas abas Habilidades (botões Criar e Ritual) e Magias (Criar magia): categoria, natureza, nome, tipo, tema e técnicas, cada uma com raridade, modo, modificadores, restrições, efeito e custo proposto. A ficha calcula o Orçamento de cada técnica, o custo de uso (+50% com área), a manutenção da sustentada, a Potência, os PH, as horas e a DT, e bloqueia o que a raridade não permite. Dá para partir de um dos 32 exemplos.
- **7 raridades**: Comum, Incomum, Rara, Épica (limite 4), Lendária (limite 3), Mítica (limite 2) e Única (limite 2). Os limites somam habilidades e magias (opção do mundo; padrão "Somados").
- **Projeto** na sub-aba Criação dos Treinamentos: as horas entram nas 8 h do dia, um teste por dia, os PH só saem no sucesso. Afinidade (natureza do arquétipo): −25% de horas e +2 no teste. Mítica e Única esperam o Mestre marcar o Catalisador; a Única, o Despertar.
- **Aprender** arrastando uma habilidade com receita (vira projeto com os PH de aprender, metade das horas e DT −5). **Aprimorar** (PT por +1 de Orçamento ou −20% no custo), **Evoluir**, **Nova técnica** e **Remodelar** no botão novo da linha da habilidade.
- Compêndio novo **EPM · Habilidades de exemplo** com as 31 habilidades, magias e rituais do documento e O Legado do Errante.

**Habilidade Única Inicial (HUI)**
- Último passo da criação guiada: o questionário de 6 perguntas, com "Enviar ao Mestre", "Responder depois" e "Sem Habilidade Única Inicial" (opção do mundo, ligada).
- Na seção Única da aba Habilidades: "Continuar Criação de Habilidade Única Inicial", "Aguardando o Mestre" e, ativa, o selo do estágio, o peso, a barra de usos e o próximo estágio.
- Mestre: cartão no chat e lista no Escudo (aba Habilidades) com Copiar prompt, Colar resposta, Montar no criador, +1/−1 uso e "sem HUI".
- Criador no modo Única Inicial: peso Leve 1 / Regular 2 / Suprema 3, até 10 de peso, 5 técnicas e 1 Suprema (12 e 6 no Estágio VI). A raridade sai do peso, do estágio e da Ressonância; no Estágio VI todas as técnicas são Transcendidas. Não ocupa espaço de raridade.
- Estágios nos níveis 1, 10, 20, 30, 40 e 50 (sobem e descem com o nível); usos de técnica ativa (até 3 por combate) dão a Ressonância (10/15/20/25/30) e, no VI, a Ressonância final com 40.

**Classes nas versões finais**
- As 23 classes (9 de Combatente, 8 de Conjurador e 6 de Artífice) com o texto final, as regras e as 16 habilidades de cada uma. Entraram Guerreiro, Arqueiro, Mago, Clérigo, Invocador, Xamã, Mago de Guerra, Alquimista, Armadura Viva, Curandeiro e Master of Puppets.
- Automação nova: Posturas do Guerreiro, Fúria do Bárbaro por faixa (dano, RD, PE por turno e usos), Couraça e Muralha do Guardião, golpe desarmado do Lutador, Bastião (+20/+20/+30 PV, CA, testes e Corpo Inabalável), Elemental (2d12 no 48, Núcleo fixo por acerto, margem), Alice (limiar da Histeria), Caçador (Pistola 3d10/4d10, Munição de Oficina), Mecha do Mecânico de Guerra e Marionetes do Master of Puppets.
- Saíram as regras antigas: Proteções do Bárbaro, tabela de crítico, caminhos, Posições do Lutador e Corpo de Pedra. As fichas antigas trocam as habilidades de classe sozinhas.

**Inimigos por nível, raridade e poder do grupo**
- "Preencher pelo nível" com a tabela nova (um nível por linha, de 1 a 100; acima de 50 é projeção). Cria os ataques prontos: Lacaio 1, Monstro 2, Forte 3, Chefe 4 (2 Lendárias), em d8, e ataque em área com recarga 5–6 no Forte e no Chefe.
- **Raridade** do inimigo (Comum, Raro, Épico, Lendário) com selo no cabeçalho e **poder do grupo** (Fraco, Normal, Equipado, Lendário; opção do mundo).
- **Orçamento do encontro** no Escudo (aba Combate): custo dos NPCs contra os jogadores, com Fácil, Justo ou Difícil.
- NPC rápido e os NPCs modelo usam a tabela nova. NPCs antigos ganham raridade, custo e a Vida da tabela nova (se a Vida não foi mexida).

## Novidades da 0.8.31

Correções nos testes do Quench (o módulo em si não mudou):
- **Projetos do Artífice**: o Foundry não devolve os itens criados juntos na mesma ordem; o teste trocava a Afiação pela Torreta. Agora os itens são achados pelo nome.
- **Combate e recursos**: personagem novo do dnd5e nasce com Vida máxima 0 (sem classe), então dano e cura não tinham de onde partir. O teste fixa a Vida máxima em 30 antes.
- Mensagens de erro mais detalhadas (mostram os efeitos gravados quando a Afiação falha).

## Novidades da 0.8.30

- **Compêndios numa pasta**: os 8 compêndios do EPM (Manual, NPCs modelo, Tabelas de loot, Macros, Melhorias, Receitas do Artífice, Arquétipos e Classes, Itens) ficam juntos na pasta "EPM · Escolhidos pelo Multiverso" da aba Compêndios. O Mestre arruma sozinho ao abrir o mundo.
- **Mais testes no Quench**: de 22 para 66, em 10 lotes. Novos: combate e recursos (Vida temporária, cura, consumível, condição, cena da Engenhoca), compêndios (existem, têm conteúdo e estão na pasta), listas e catálogos (bênçãos, condições, raças, kits, receitas, NPCs modelo, migração, custo de nível, grupos) e **fluxos com janelas**, que o teste responde sozinho: criação guiada no nível 4, kit de outro arquétipo recusado, raça Mutante com a Fera e raça comum com uma Única só, subir de nível (com e sem PEv), descanso longo, criar/renomear/apagar grupo, compartilhar mochila e Mover para, fabricar/enviar/recolher/desmontar Projeto, conectar Relação e NPC rápido na pasta.
- Os testes apagam no fim as fichas, as mensagens e as pastas de atores que criaram (pastas que já existiam ficam).
- Correção: fechar a ficha logo depois de abrir uma seção dava um erro no console (`_onAbrirCategoria`).

## Novidades da 0.8.29

**Testes no Quench.** Com o módulo [Quench](https://foundryvtt.com/packages/quench) ativo, a janela dele mostra 6 lotes do EPM:

| Lote | O que confere |
| --- | --- |
| EPM: regras (sem criar nada) | Contas da criação guiada, Habilidade Única, CD de Projeto, Afiação e Placas, quem vê quais fichas |
| EPM: ficha de personagem | Cria um personagem, calcula a ficha e abre a ficha com as abas |
| EPM: mochila compartilhada | Pegar, passar entre mochilas, guardar empilhando e quem saiu não pega mais |
| EPM: Projetos do Artífice | CD com Ofício e Tecnologia, Afiação na arma de outro, Torreta no inventário de outro e Recolher |
| EPM: NPCs | NPC rápido na pasta automática (sem duplicar) e os 35 NPCs modelo no compêndio |
| EPM: grupos separados | Ficha num grupo e o filtro por grupo (a configuração do Escudo volta ao que era) |

Como rodar: ative o Quench no mundo (de preferência um mundo de teste), entre como Mestre, abra a janela do Quench, marque os lotes "EPM" e rode. As fichas de teste se chamam "[Teste EPM] …", ficam na pasta "EPM · Testes (Quench)" e são apagadas no fim, junto com as mensagens que geraram no chat. Quem não é Mestre só roda o lote de regras (os outros pulam). Sem o Quench, nada disso é carregado.

## Novidades da 0.8.28

- **Mochila compartilhada**: cada personagem recolhe as mochilas compartilhadas pela setinha, só na própria ficha. Os itens de lá têm "Mover para…" (seu inventário, uma mochila sua ou outra compartilhada) e podem ser arrastados direto para uma mochila sua ou para outra compartilhada. O "Mover para…" do inventário também lista as compartilhadas.
- **Escolher fichas com busca**: compartilhar mochila, enviar Projeto, Relações e "Adicionar ficha" do Escudo e do Painel do grupo usam a mesma lista com busca pelo nome (o Mestre também filtra por tipo). O jogador só vê fichas que têm jogador: NPCs e chefes do Mestre não aparecem, nem pelo nome.
- **Projetos do Artífice em outras fichas**: botão "Enviar" nas Engenhocas. Afiação ou Acoplamento vira dano extra na arma escolhida (de qualquer personagem, ou a sua); Placas de Reforço vira RD física na armadura; as outras Engenhocas vão para o inventário de quem recebe, com botão Usar (que usa os números do Artífice). Continuam ocupando a reserva até "Recolher" (no painel, em "Em outras fichas"). Sem ser dono da outra ficha, o Mestre conectado faz a troca.
- **CD de Projeto** = 10 + Inteligência + metade (para baixo) do bônus do Ofício sem o atributo (pontos + Outros + bônus). Ex.: Int 6, Ofício 5 e +3 em Outros → 10 + 6 + 4 = 20. Novo campo "Perícia do Projeto" para usar Tecnologia no lugar do Ofício (vale para a CD e os ataques de Projeto).
- **Grupos separados** no Escudo do Mestre (aba Grupo) e no Painel do grupo: abas Todos / cada grupo / Sem grupo, "Novo grupo" (as fichas marcadas já entram), seletor de grupo em cada ficha, renomear e apagar. Marcar, dar pontos e descansos valem para o grupo aberto.
- **Pasta automática**: o NPC rápido e a ficha rápida de NPC do Mundo guardam as fichas na pasta "NPCs rápidos" da aba Atores, com subpasta por natureza (ou raça). Dá para desligar no diálogo.
- **NPCs modelo**: 19 novos (35 no total), com função, jeito, tática, defesas, serviços, loot, conhecimento por CD, recargas, lacaios, segundo ataque e vitória alternativa nos chefes. Os modelos cobrem os 5 tipos de ficha e disposições diferentes (mercadores e curandeiros amigáveis).

**Decisões tomadas**: Afiação e Placas instaladas não gastam cenas (são passivas) e valem com o item equipado; o Acoplamento escolhe entre os tipos Naturais e Tecnológicos; a ficha só fica num grupo por vez; o jogador continua vendo as fichas que ele controla, mesmo sem jogador (ex.: um companheiro dele).

## Novidades da 0.8.27

**Arquétipos reformulados** (do documento "Reformulação do Arquétipo"):
- **Combatente**: Arsenal de Maestrias no nível 1 (1 Maestria, 2 no 21, 3 no 41) com a Arma Favorita; novas Maestrias Golpe Esmagador, Arma Sangrenta e Sentinela; Arma Perigosa com margem 1/2/3; Fôlego de Combate cura PV; estilos com os valores novos (Duelista +8, Arma Dupla +2, Atirador margem 4). Regra opcional para Maestrias em várias armas.
- **Conjurador**: Acúmulo de Magias (só as do arquétipo contam; Classe, raça, pergaminho e treino somam por fora), Magia Assinatura (metade do PM), Barreira Arcana, Corpo de Mana, Zona de Mana, Sobrecarga 12/22 PE (acumula com Canalização) e Maestria Elemental.
- **Artífice**: Projetos de Criação com reserva, Graus I a V, Livro de Projetos com 20 receitas (12 Consumíveis e 8 Engenhocas, também no compêndio "EPM · Receitas do Artífice"), fabricar, usar, reparar e desmontar pela ficha, Utensílios e Modificação Permanente.

**Criação guiada reformulada**:
- Conceito opcional e nível da ficha no primeiro passo; um passo para os níveis seguintes (Aumentos de Status com o teto do nível, Arma Favorita, Maestrias e Estilos, Acúmulo do Conjurador, Livro e Utensílios do Artífice) e a Classe a partir do nível 3.
- O botão Próximo trava enquanto atributos (16 pontos, máximo 3; o 4 só com dois em −1), perícias (pontos e limite do nível: 5 até o 15) ou Aumentos não fecham.
- Habilidade Única: só 1. Com Compatibilidade à Fera (Mutante, ou Mestiço com Mutante) mais 2; as caixas travam na hora.
- Kit inicial: só os do arquétipo da ficha; os outros aparecem travados.

**Fichas existentes** migram sozinhas: a Maestria única vira lista, os números antigos dos estilos voltam ao padrão novo, os projetos do modelo antigo saem e os Artífices ganham um Livro inicial (Carga Explosiva, Remendo de Campo, Torreta e Escudo Defletor).

**Decisões tomadas**: Utensílios virou botão (4 PE + dado) em vez de +2 fixo; a Modificação Permanente só é automática no próprio Artífice (visão fica no texto); "Engenhocas só no descanso" fica como aviso, sem trava; Duelista +8 pode passar do Teto, que corta; Maestria Elemental é lembrete; Ímpeto, Herói e afins seguem como texto; nova origem de magia "Pergaminho".

## Novidades da 0.8.26

- **Atirador Arcano é classe de Conjurador** (o nível da classe é o de Conjurador). Se alguma ficha escolheu a classe como Artífice na 0.8.25, o Mestre recebe um aviso com o nome dela para ajustar o arquétipo.
- **Mais de uma Arma Mágica:** continua uma por vez, mas o Mestre pode liberar mais numa ficha (caixa "Mestre: permitir mais de uma Arma Mágica" no painel da classe). Com a permissão, criar outra arma não tira a anterior.
- **Acelerador de Mana acumula com a Mira Estabilizada:** +3 e +2 nos ataques com a Arma Mágica.

## Novidades da 0.8.25

- **Visual "Atlas do Multiverso" em todo o módulo:** a ficha virou uma carta celeste. O fundo é azul-noite com meridianos bem apagados, as abas formam uma constelação (a aba aberta é a estrela que brilha), os painéis são placas com fio e cantos de latão, e os títulos usam a Cormorant em versalete. Vale para a ficha, as fichas de NPC (a cor do tipo continua como destaque), o Escudo do Mestre, o grupo, o catálogo, os editores de item e poder, e as janelas de diálogo do módulo.
- **Fichas que já existem:** quem estava na cor padrão antiga passa sozinho para o Atlas. Quem escolheu outra cor continua com ela, e o verde antigo ficou nas cores prontas da Personalização, como "Verdete (antigo)".
- **Nova classe: Atirador Arcano (Conjurador desde a 0.8.26).** Todas as habilidades do nível 3 ao 48 estão na ficha e no compêndio de classes. O painel fica na aba Combate:
  - **Arma Mágica:** cria uma arma a partir de uma arma de disparo conhecida, rolando o custo em PM pelo porte, ou imbui uma arma do inventário. Tem a opção de Arma de Sangue, que paga também PV e atordoa se passar da metade dos PV máximos. Armas de Gênesis só com o Mestre.
  - **Ataques com a Arma Mágica:** usam Arcanismo + Núcleo, e a partir do nível 36 somam também a Pontaria.
  - **Diálogo de ataque:** traz a Posição Tática (I, II, III e Absoluta, com margem, multiplicador e dados), a Munição de Mana, o Núcleo Ressonante, a Câmara de Acúmulo, o Disparo Potencializado, o Disparo Espiral e o Amplificador. Tudo já cobra os PM e os PE.
  - **Painel da classe:** botões do Starlight Step (usos por descanso longo e versão Aprimorada), Magia Aplicada, Câmara de Acúmulo, Circuitos Balísticos (5 PM por circuito) e Sobrecarga Arcana.

## Novidades da 0.8.24

- **Enquadrar imagens:** ao trocar o ícone de um item ou poder, o retrato, a imagem de um companheiro, criatura, facção, Marca ou da alma, abre o mesmo editor do token (sem a borda): arraste o quadrado, puxe as laterais e os cantos ou use a roda do mouse. O retrato, o companheiro e a alma usam a guia redonda; os ícones, a quadrada. A imagem enquadrada vai para a pasta `epm-ficha-imagens` e a original não muda.
- **Enquadrar a atual:** quem já tem uma imagem pode só enquadrar de novo. O editor parte da imagem original, sem perder qualidade.
- "Sem enquadrar" usa a imagem como veio. O fundo da ficha e a Aparência não passam pelo editor; a transformação e os tokens por estado continuam com o enquadramento na borda do token.

## Novidades da 0.8.23

- **Manual dentro do Foundry:** compêndio "EPM · Manual" com o diário "Manual da Ficha EPM": Começando, Guia do jogador, Guia do Mestre, Regras rápidas e Patch notes (resumo de cada versão). Botão "Manual" na barra de abas da ficha. Ao atualizar o módulo, um aviso oferece abrir as Patch notes.
- **Conteúdo pronto em compêndios:** EPM · NPCs modelo (16 criaturas por região), EPM · Tabelas de loot (por região e faixa de nível, mais materiais), EPM · Macros (Escudo, grupo, pular tempo, NPC rápido, Grimório, catálogo, manual) e EPM · Melhorias (arraste uma melhoria ou um material para o editor de um item). Ícones próprios para os tipos de melhoria e os materiais.
- **Busca na ficha inteira:** campo embaixo das abas; acha perícia, item, habilidade, magia, treino, receita, relação ou criatura e leva até ela.
- **Atalhos na barra de macros:** arraste o botão de uma perícia, de um ataque ou de uma habilidade/magia para a barra.
- **Caixas de texto:** salvam sozinhas enquanto você escreve (sem precisar sair do campo) e crescem com o texto.
- **Criação guiada de personagem (base):** botão "Criação guiada" em personagem novo: nome, raça, atributos (16 pontos), arquétipo, perícias (50 pontos) e kit inicial.
- **Erros amigáveis:** quando algo da ficha falha, um aviso diz o que fazer e um cartão (só para você) traz o botão "Copiar o erro". Dá para desligar nas configurações.
- **Barra de Vida nos tokens novos:** opção nas configurações (não mexer, ao passar o mouse, sempre, ou para todos).
- **Nomeação e Títulos:** o campo "Nome do item (Nomeação)" fica em todo item, na seção Melhorias. Os Títulos (Item Refinado, Item Arcano…) viraram a regra opcional "Títulos de itens" e só vão para itens com nome. A bênção de arma agora se chama "Ensinamento da Guerra".
- **Por dentro:** testes rodam no GitHub antes de cada release (a release só sai se passarem); a parte de Treinamentos saiu de mecanicas.mjs para um arquivo próprio; a base antiga das melhorias (0.6.0) foi tirada (a migração já converte os itens); o cálculo das melhorias é guardado durante o desenho da ficha.

## Novidades da 0.8.22

- **Melhorias de itens (ajustes):**
  - **Ofício:** fazer uma melhoria usa o Ofício que você escolher (Ferreiro, Encantador ou outro da ficha) e o atributo que você escolher. Trocar de material também. As ferramentas com melhorias somam no teste (Precisa, Mestra, Obsessiva, Mão do Criador, Forja dos Deuses).
  - **Tudo soma:** RD do mesmo tipo soma; Leve e Mitral dão metade de metade do peso; as capacidades da mochila somam.
  - **3º Encantamento:** o Pergaminho é pago à parte; o 3º Encantamento custa o preço da vaga (comprar) ou metade dele em material (fazer).
  - **Pular tempo** anda pelas 3 etapas das melhorias em andamento e faz os testes sozinho; há a opção de sair de graça (sem pagar o material).
  - **Subtipo pelo tipo de item, não pelo nome:** Escudo leve, médio ou pesado; Vestimenta para os olhos (máscara, óculos, capuz, visor); Grimório; Poção de Vida. Vem do catálogo ou se escolhe no editor do item.
  - **Forja dos Deuses:** 1 vez por item, uma Modificação feita com ela não conta no limite (o item fica com 4).
  - **Focos:** Lapidado, Ressonante, Prisma, Voz Divina, Voz do Abismo e Abismo Faminto somam na CD (e o acerto aparece no cartão) das magias de quem carrega o foco; Amplificador e Afinidade Elemental viram notas no cartão.
- **Mochilas compartilhadas:** arraste um item seu para a mochila compartilhada para guardar, e um item dela para o seu inventário para pegar.
- **Criar NPC rápido** (aba Atores, botão "NPC rápido", e no Escudo do Mestre): tipo de ficha, força da criatura (de Muito fraca a Lendária), nível, natureza, foco, tamanho, disposição, se é inteligente e quantas fichas. Atributos, Vida, CA, acerto, CD e um ataque vêm prontos.
- **Item Piles:** lojas, baús e trocas passam a usar as moedas EPM (dá para desligar nas configurações do módulo).
- **Arrastar:** consumível ou loot igual soltado na ficha soma na pilha; itens soltos no Escudo do Mestre vão para quem está em "Dar para"; fichas soltas no Escudo entram no grupo; outros tipos (diário, macro, tabela) mostram um aviso em vez de não fazer nada.
- **Idiomas:** a lista já era exatamente a pedida (14 que se pode escolher e 5 proibidos).

## Novidades da 0.8.21

- **Melhorias de itens** (seção "Melhorias" no editor do item EPM):
  - **Vagas:** Modificações 3, Encantamentos 2 (3 com o Pergaminho de Encantamento), Maldições 3, Bênçãos 2. Ao completar um tipo, o item mostra o título (Item Refinado, Item Arcano, Objeto Amaldiçoado, Objeto Divino).
  - **Listas:** "Adicionar" abre a lista filtrada pelo tipo do item, com busca: Geral mais a do tipo (consumíveis e munição só a própria; matéria-prima não recebe). O tipo vem do catálogo ou do item e pode ser trocado à mão. São 217 melhorias.
  - **Regras:** a mesma melhoria não entra duas vezes. Vaga cheia bloqueia. Pré-requisitos de melhoria ("consome" tira a exigida, que não volta; "mantém" desliga a nova se a exigida sair), de item (propriedade, tipo de armadura ou escudo, material), de portador (atributo, pontos na perícia, arquétipo, arma favorita, Sanidade) e de feito (o Mestre marca). Sem cumprir, a melhoria fica desligada, com o motivo.
  - **Automático:** acerto, dano, margem de ameaça, multiplicador de crítico, dados extras (Elemental, Sagrada, Sedenta…), passos de dado (Faminta de Mana sobe; Massacre desce), CA, Bloqueio, Contra-ataque, perícias, testes de resistência, RD, resistência, iniciativa, deslocamento, peso, capacidade da mochila e as fórmulas de consumíveis (Concentrada, Fórmula Própria, Viciante, Ambrosia). Cruel soma +15 no crítico; Massacre multiplica os bônus fixos; Ensinamento e Avatar da Guerra maximizam o dano. Pureza Divina desliga o custo das Maldições. Bênção Protetiva: +3 CA por item (até +12) e +5 nos testes de resistência. O resto vai como nota no cartão de ataque.
  - **Material Especial:** ocupa 1 vaga de Modificação e aplica a coluna certa da tabela (arma, proteção ou outros). Dá para trocar: paga o novo menos metade do anterior e faz o teste da vaga.
  - **Fazer:** Modificação pela Forja, Encantamento pelo Encantamento, com DT da vaga (35/50/70 e 30/45/70). São 8 h ou 24 h em 3 etapas, cada uma com um teste; falhou, repete a etapa. O material é metade do preço da vaga, pago 1/3 por etapa. Usa as horas do dia (as mesmas dos treinos) e também anda com o Pular tempo.
  - **Comprar:** 200/800/3.000 PO e 1.000/4.000 PO, loja de armas +50%, consumíveis e munição 1/5, pago com as moedas da ficha. Maldições e Bênçãos só o Mestre adiciona.
  - **Consumíveis e munição:** Modificação e Encantamento valem para o lote (até 5 unidades, separadas da pilha; a munição é o pacote). Bênção e Maldição separam 1 unidade. As melhorias da munição ligada à arma valem nos disparos.
  - Linha do item no inventário e cartão de ataque mostram o resumo.
- **Mochilas compartilhadas:** no editor da mochila, marque os personagens com quem ela é compartilhada. Eles veem o conteúdo na aba Inventário ("Compartilhadas com você") e podem pegar e guardar itens. A mochila e o peso continuam com quem carrega. Quando o jogador não é dono de quem carrega, o Mestre faz a troca sozinho (precisa de um Mestre conectado).
- **Ofícios (Produção):** as regras já estavam na ficha (CD 15/25/35, 4 h por profissão, etapas, um teste por profissão no fim, falha crítica e as combinações). Agora os +3 Pontos de Estrutura da Forja valem: cada ponto segura uma perda inteira de durabilidade, e o campo aparece no editor do item. O produto defeituoso da falha crítica entra no inventário marcado como Defeituoso.
- **Fichas e itens antigos:** a base antiga das melhorias (nome e texto livres) passa para o formato novo. Nome igual a uma melhoria da lista vira ela; o resto fica escrito à mão, com o texto antigo; o primeiro título vai para "Título da arma".

## Novidades da 0.8.20

- **Os Talentos viraram Treinamentos.** A sub-aba e a janela de Talentos saíram. Os 55 agora estão no catálogo de treinamentos ("Adicionar da lista"), nas categorias de treino, com tempo e PT pela antiga faixa:
  - Comum: 24 h, 5 PT, sem treinador;
  - Avançado: 1 semana, 10 PT, com treinador, nível total 25;
  - Superior: 2 semanas, 15 PT, com treinador, nível total 50;
  - Lendário: 1 mês, 20 PT, com treinador, nível total 75.
- **Requisitos novos no catálogo:** nível total e arquétipo (ex.: Avatar da Guerra pede Combatente).
- **A automação vale ao concluir o treino:** bônus fixos, opções no diálogo de ataque, Sortudo (Rerrolar), Escolhido do Multiverso, Fúria Controlada, Sangue Mágico, Presença Marcante / Lenda Viva. As ações viram habilidades de Treinamento.
- **Robusto:** +3 PV por nível total, contando os níveis anteriores (concluído no nível 10 = +30). Ao rolar o dado de Vida de um nível novo, rola 2 vezes e fica o maior.
- **Sortudo** passou para Avançado. **Afinidade Elemental** pede o tipo de dano ao adicionar e pode ser feita mais de uma vez.
- **Ambidestria:** com o treino Combate com Duas Armas, o diálogo de ataque ganha a opção "Ataque da segunda arma". Sem Ambidestria, o dano não soma o atributo. Com ela, soma.
- **Nova cena** (modo edição, aba Habilidades): recarrega os usos de 1× por cena, por turno e por rodada da ficha.
- **Raridade na Criação:** cada projeto da Oficina tem raridade. A ficha avisa quando passa do que o nível total permite (Comum 1, Rara 10, Épica 25, Lendária 50, Mítica 75; Arcaica só com o Mestre) e pede confirmação no teste. O item criado já sai com essa raridade.
- **Forja do Multiverso** (treino): na Criação, o limite de raridade sobe uma.
- **Arquétipos balanceados** (PDFs de Combatente, Conjurador e Artífice):
  - **Combatente:** Ataque Extra com custo por ataque (escolha quantos no diálogo; Arma Gêmea usa a Ação Bônus e dá desconto); **Fôlego de Combate** (botão em Combate); Reflexos +3 no 7 e +5 no 17; Maestrias com números novos (Protetora dá CA e Defesa, Leve dá Esquiva, Perigosa dá dados no crítico); Estilos Duelista +2, Atirador margem +2, Dupla +1; **Caçador Natural** em 3 etapas (19, 29, 47) por 12 PE; **Comando de Campo** no lugar de Especialista em Campo; sem Ataque Extra 6.0.
  - **Conjurador:** Reserva Arcana +10 no 26, +25 no 41 e +40 no 49; Recuperar Mana 4.0 no 43; Sobrecarga por nível (37 e 49); Domínio de Conjuração no 34; Zona de Mana no 50.
  - **Artífice:** tabela de Projetos nova (dano e cura usam Inteligência; Soma e Livro de Projetos não); Itens Encantados com valores fixos; Modificações Permanentes 2.0; Pequeno Autômato +2/+10 no 29 e +4/+25 no 41.
- **Classes balanceadas** (16 habilidades cada, do nível 3 ao 50):
  - **Novas:** Bastião e Guerreiro do Vazio (Combatente), Vitalista (Conjurador) e Mecânico de Guerra (Artífice).
  - **Reescritas:** Guerreiro Elemental (Arma Elemental 1d4 a 1d10 em todo ataque; Núcleo Vermelho no primeiro acerto do turno; margem a partir do 12; efeito do elemento a partir do 39 com crítico ou 15+ de dano; Pele de Mana no lugar de Revestimento Elemental), Alice (Histeria com um quarto dos PV: +3 de Acerto e +1d10, 2d10 no 45), Trovador (Inspiração por 3 PE para vários aliados) e Caçador (Pistola com Balas de Mercúrio por descanso).
  - Bárbaro, Guardião e Lutador continuam iguais.
- **Os bônus continuam ajustáveis por ficha:** em "Ajustar bônus" o Mestre ou o jogador troca qualquer número dado pelo arquétipo ou pela classe, inclusive os novos. Fichas que tinham gravado o padrão antigo (ex.: Duelista +3) passam a seguir o livro; valores pessoais diferentes ficam.
- **Fichas antigas:** as habilidades de arquétipo e de classe criadas pelo modelo são renomeadas e ganham o texto novo; as que saíram do livro somem (as escritas pelo jogador ficam); as novas liberadas entram uma vez.
- **Fichas antigas:** os talentos da 0.8.19 (e os antigos comprados com PEv) viram treinos. Os que estavam valendo ficam concluídos; os desligados ou não comprados ficam planejados.

## Novidades da 0.8.19

- **Talentos.** Nova sub-aba **Talentos** na aba Habilidades. São dons e estilos de luta escolhidos ao subir de nível: não custam PT nem tempo.
  - **Contador "usados / disponíveis"** pelo nível total: 1 no nível 1 e +1 nos níveis 10, 20… 100. O campo **Extras** (só o Mestre muda) soma os talentos dados por raça, classe, bênção ou pelo Mestre.
  - **Avisos, sem bloquear:** talentos a mais, mais de 1 Lendário, faixa acima do nível ou talento repetido.
  - **Adicionar da lista:** 55 talentos em 8 categorias e 4 faixas (Comum 1, Avançado 25, Superior 50, Lendário 75). Tem busca sem acento, filtro por faixa, "só os que eu cumpro" (atributos, perícias, outros talentos, treinos concluídos, arquétipo e nível), a cadeia de pré-requisitos e o que cada um libera.
  - **Talento à mão:** nome, faixa, texto e bônus fixos. Qualquer talento pode ser desligado sem apagar.
  - **Bônus automáticos:**
    - Pés Leves +1,5 m;
    - Robusto +2 PV por nível total;
    - Força de Vontade +10 PS;
    - Alerta +3 na iniciativa e imune a Surpreendido;
    - Tático (iniciativa com Inteligência);
    - Olhos de Águia +2 em Percepção;
    - Inventor Nato +2 em Ofício;
    - Vontade de Ferro imune a Dominado;
    - Afinidade Elemental +2 no dano das magias do tipo escolhido (pergunta o tipo ao adicionar).
  - **Opções no diálogo de ataque**, para marcar quando valer: Golpe Pesado, Duelista (também no Contra-ataque), Atirador Paciente, Matador de Gigantes, Executor e Investida.
  - **Ações limitadas viram habilidades** na sub-aba, com origem Talento, botão de usar e recarga: Teimoso, Segundo Fôlego, Fúria Controlada, Golpe Devastador, Tempestade de Lâminas, Sombra Veloz, Magia Persistente e Gêmea, Sobrecarga Domada, Engenhoca de Bolso, Inspirador, Lábia, Voz de Comando, Alma Resiliente e os Lendários.
    - 1× por sessão volta no **Início da sessão** do Escudo;
    - 1× por semana volta com o Pular tempo.
  - **Sortudo:** 3 pontos de Sorte por dia e botão **Rerrolar** nos seus testes. Voltam no descanso longo.
  - **Escolhido do Multiverso:** botão **Tornar 20 natural** nos testes seus e dos aliados, 1× por sessão. Não garante o acerto.
  - **Sangue Mágico** paga com Vida o PM que faltar. **Fúria Controlada** oferece sozinha o PV temporário e o dano ao cair para metade da Vida.
  - **Presença Marcante / Lenda Viva** sugerem ao Mestre a afinidade inicial ao conectar um NPC novo.
  - **Fichas antigas:** os talentos comprados com PEv vão para a sub-aba e se ligam ao catálogo pelo nome. Os que não tinham sido comprados ficam desligados.
- **Barra de pesquisa** nas listas longas: perícias, treinamentos, magias (todos os círculos), habilidades (todas as sub-abas), arquétipo e classe, inventário (inclusive dentro das mochilas), receitas, relações, diário e talentos.
  - Procura também na descrição e não liga para acento.
  - Esc limpa a busca, e o termo continua depois que a ficha redesenha.

## Novidades da 0.8.18

- **Pular tempo único.** Um só diálogo para tudo o que depende de tempo ou do calendário. Fica na aba Treinamentos, no painel de projetos do Artífice, em Produção e na Troca de lugar da Ressonância. Escolha quanto tempo passou (minutos, horas, dias, semanas ou meses de 30 dias) e a ficha acompanha:
  - **Treinos e criações da Oficina:** 8 h de treino por dia, divididas igualmente; a sobra vai primeiro para quem está mais perto de terminar. Dá para escolher quanto vai para cada um, e as horas que sobrarem podem virar PT de estudo.
  - **Projetos do Artífice:** produção e volta andam; passando 1 dia, o limite do dia volta; Soma e Proteção acabam no prazo.
  - **Produções:** ficam prontas para os testes.
  - **Pacto quebrado:** o bloqueio por horas acaba.
  - **Ressonância de Alma:** a Troca de lugar acaba depois de 1 hora fora de combate, a manifestação se recolhe e, sem o Simple Calendar, a Conversa volta depois de 1 semana e a Troca depois de 1 mês.
  - **A cena acaba:** os bônus de cena e por turnos saem; passando 1 dia, os usos por dia, cena e combate voltam.
  - **Descanso** curto ou longo no fim, se marcado.
  - Um cartão no chat lista o que mudou.
- **O Mestre** pode avançar junto o relógio do mundo (e o Simple Calendar). No Escudo, "Pular tempo" faz isso para o grupo: avança o relógio e aplica o tempo nas fichas marcadas (personagens de jogadores vêm marcados).

## Novidades da 0.8.17

- **Catálogo de treinamentos** (EPM/treinamentos.md): 95 treinos em 9 categorias (Físicos, De Arma, De Aura, De Magias, Extras, Ofício e Sobrevivência, Mente e Sanidade, Furtividade e Infiltração, e os modelos de adaptação tecnológica).
  - Botão **Adicionar da lista** na aba Treinamentos: categorias, busca sem acento, filtro **Só os que eu cumpro**, cadeia de pré-requisitos e o que cada treino libera. Os modelos continuam editáveis e dá para criar treinos à mão.
  - Requisitos conferidos pela ficha: atributos (com "ou"), pontos em perícias, treinos concluídos, arma favorita e arma Exótica.
  - **Ao concluir**: os números entram sozinhos (deslocamento, Esquiva, iniciativa, RD física, PM + Núcleo, Núcleo no dano com armas, margem da favorita, imunidade a Abalado e Confuso, escalada e natação iguais ao deslocamento…). As ações com custo (Fôlego de Batalha, Explosão de Aura, Flash Step, Aura Intimidadora, Punho de Aura, Selo de Aura, Discurso de Guerra, Primeiros Socorros, Contramagia Instintiva…) viram habilidades na sub-aba Geral, com origem Treinamento, formas, custo, frequência e DT própria.
  - Poliglota abre a escolha de idioma; Protagonista ganha 1 Inspiração no novo botão **Início da sessão** do Escudo.
  - Automáticos: Canal Estável, Mente Fria (rerrolar Vontade), Meditação Profunda, Aura de Recuperação, Resistência ao Horror, Reparo de Campo, Armeiro, Mestre Artesão, Estudo de Arma Exótica e Mentor (+1 PT por dia no treino em grupo). O que depende do Mestre fica como lembrete.
  - Fichas antigas: treinos com o nome de um modelo são ligados a ele sem perder horas nem estado (números diferentes pedem confirmação), e os já concluídos ganham as habilidades.
- **Grimório de Magias** (0.8.16) com os nomes de dano da ficha (Frio, Relâmpago, Radiante); "raio de 6 m" não conta mais como Relâmpago.

## Novidades da 0.8.16

- **Grimório de Magias dentro do Foundry** (substitui o Códex do Vazio):
  - Botão **Grimório** na aba Magias: as 390 magias e rituais do grimório do EPM, com busca, círculo, escola, ação e tipo de dano. Clique no nome para ler a magia inteira.
  - Marque e clique em **Adicionar à ficha**: a magia entra no círculo certo, com custo em PM, ação, alcance, alvo, área, duração, teste (ataque com Arcanismo ou resistência) e dano já preenchidos. Não precisa abrir o site nem copiar nada.
  - **Atualizar as da ficha** reescreve as magias que vieram do Grimório quando o texto dele mudar (raridade, favorito e formas extras ficam).
  - No Escudo do Mestre (aba Itens): **Grimório** para dar magias a qualquer ficha ou **importar para o mundo** (pasta "EPM · Grimório de Magias", uma subpasta por círculo).
  - Macro: `game.modules.get("epm-ficha").api.grimorio()`.
  - O **Colar texto / Códex** continua lendo o botão "Copiar registro" do site novo e do Códex antigo.

## Novidades da 0.8.15

- **Artífice**: cancelar um projeto que ainda não foi usado tira ele do limite do dia e, se ele foi guardado no Livro de Projetos a partir dali, do livro também (fichas antigas: os projetos apagados sem uso deixam de contar). Projeto já usado continua contando.
- **Pular tempo em tudo que depende de tempo**:
  - Projetos do Artífice: termina a produção e a volta agora, encerra Soma/Proteção ou começa um dia novo (modo edição).
  - Treinamentos e **criações da Oficina** no mesmo "Pular tempo" (as horas vão para cada um), com botão também na sub-aba Criação.
  - Escudo do Mestre: **Pular tempo** no relógio do mundo (e no Simple Calendar), para projetos, produções, Troca de lugar e efeitos com hora.
- **Estilo de Combate** no nível 4 (as habilidades de arquétipo já criadas acompanham).
- **Margem de ameaça não garante o acerto** (sistema todo): o cartão do crítico avisa que o total ainda precisa passar a defesa.
- Correção: atacar com um bônus "só no próximo teste" ligado travava a rolagem.

## Novidades da 0.8.14

- **Fichas antigas acompanham as mudanças da 0.8.13** (roda sozinho quando o Mestre abre o mundo):
  - Habilidades de arquétipo criadas pelos modelos passam a ter o texto e o nível do livro atual (ex.: Magia 3 a 6 do Conjurador nos níveis 19, 29, 38 e 47). Textos editados à mão não são mexidos.
  - Valores que eram o padrão antigo do livro e ficaram gravados na ficha (Vida, Mana e Estamina iniciais do Combatente 20/12/16 e os números antigos dos Estilos) voltam a seguir o livro novo. Valores pessoais diferentes continuam.
  - O mesmo vale para os números antigos dos Estilos salvos nas configurações do mundo.

## Novidades da 0.8.13

- **Ressonância de Alma** (aba nova **Almas**):
  - O Mestre registra as almas do personagem: nome, imagem, origem, personalidade, área de conhecimento, ficha ligada e Relíquia de Alma. Almas não reveladas não aparecem para o jogador.
  - **Conversar** (1 vez por semana, sem teste): a pergunta vai para o chat, só para o Mestre e o dono, com um botão para o Mestre responder no próprio cartão.
  - **Trocar de lugar** (1 vez por mês, só com a Relíquia no inventário ou na mochila): a ficha passa a usar os atributos, perícias, habilidades e ataques da alma; Vida, Mana, Estamina e condições continuam as do corpo. Acaba depois de 1 hora de jogo ou no fim do combate (se começou nele), volta tudo e dá +1 de Exaustão.
  - **Manifestação involuntária**: dispara sozinha com a Vida em 0 e quando a Sanidade cai para 25 ou menos; o Mestre também tem um botão. A alma fala por cerca de 1 minuto (10 rodadas em combate). **Calar**: Vontade DT 20; falhar tira 1d6 de Sanidade (a temporária primeiro).
  - **Ritual do Vazio** (Mestre): recompensa permanente (Relíquia, bônus, idioma ou treinamento concluído sem PT nem horas, marcada como Ressonância). O jogador escolhe 2 memórias para esquecer e o Mestre aprova. As memórias esquecidas ficam guardadas só para o Mestre, que pode devolver.
  - **Guardião Ancestral** (Mestre): token fantasma com a ficha da alma e metade da Vida, entra no combate junto do personagem. **Dispensar** remove.
  - Vínculo Quebrado, Apagamento, Ruptura Espiritual, maldições que bloqueiam a alma ou um bloqueio manual do Mestre desligam a seção. Sem o Simple Calendar, o Mestre recarrega os usos no Escudo (**Recarregar Ressonância**).
- **Balanceamento (regras gerais e arquétipos)**:
  - **Teto de Bônus** (regra opcional, ligada por padrão): bônus de habilidades de arquétipo e classe e bônus de cena de habilidade somam no máximo +5 / +8 / +12 / +15 num mesmo teste, ataque, CA ou defesa. O cartão mostra quanto foi cortado. Os bônus de cena ganharam o campo **origem**.
  - **Tipos de dano em quatro naturezas** (Físico, Natural, Mágico, Tecnológico), com Água, Ar, Terra e Sombra, e a opção de escolher a natureza inteira ("dano natural"). Nomes antigos (Elétrico, Raio, Gelo, Trovejante, Pressão, Arcano, Sangue, Luz…) são trocados nas fichas e itens que já existem.
  - Condições: **Flutuando** (mover gasta a Ação Padrão), **Assustado** (desvantagem no próximo ataque; sai depois dele ou no fim do próximo turno), **Molhado** (o próximo acerto de Relâmpago dobra e o Molhado termina).
  - Combatente: recursos 26 PV / 16 PM / 21 PE no nível 1; Estilos com os números novos (Duelista +3, Bêbado +3/+1/+1, Arma Dupla +2 Acerto e +1 Esquiva, Atirador margem +1 ou +4 abrindo mão do atributo); Maestrias com custo em PE só 1 vez por turno.
  - Conjurador: círculos nos níveis 2 / 10 / 19 / 29 / 38 / 47. Aumento de Status em todo nível par para todos (2 no nível 50). Artífice: 2 / 3 / 4 Projetos por dia (níveis 1 / 25 / 47).
  - Aba Mestre das fichas de NPC: **Preencher pelo nível** (Lacaio, Monstro, Monstro Forte ou Chefe, níveis 1–50): CA, acerto, CD e Vida pela tabela de inimigos, e o dano por turno de referência.

## Novidades da 0.8.12

- **Formas das armas na aba Combate**: cada forma da arma (as que não são passivas) aparece como um botão próprio ao lado de "Atacar", com o nome, a ação, o custo e o uso (ex.: "Varredura · Bônus · 3 PE · 1× por combate"). Clicar usa a forma direto, sem abrir a lista. Formas bloqueadas ou com o uso já gasto aparecem apagadas. O mesmo vale nas fichas de NPC (Ataques e Ações).

## Novidades da 0.8.11

- **Fichas de NPC iguais aos modelos**: cada tipo tem o próprio visual e as próprias abas.
  - Cabeçalho novo: retrato, nome, linha de descrição, etiquetas (função, região, categoria, tamanho, habitat, covil, Elite/Chefe, fase atual), selos de ND, PEv, nível total e Resistência Lendária, e barras de Vida, Mana, Estamina e Sanidade lado a lado (recursos com máximo 0 aparecem como "não usa").
  - **NPC Importante**: Principal resumida (atributos, combate, condições, perícias com favoritas e habilidades), aba **Serviços** e aba **Mestre**.
  - **NPC Comum**: aba **Ficha** com atributos, combate, perícias de destaque, ataques, comportamento, interpretação, relação com o grupo e loot; botões Rolar Vida, **Gerar variação**, **Duplicar como grupo** e Promover. Modo "sem combate" com **Loja** (compra com desconto pela afinidade e troco automático).
  - **Monstro**: Ficha (bloco de estatísticas com defesas e ações), **Ações**, **Loot** e **Conhecimento** (o que o grupo já descobriu e como os jogadores veem a criatura).
  - **Monstro Forte**: traços de elite (Aura de Horror, Tenacidade, Ações Lendárias, Limiar), recargas, lacaios e bênçãos.
  - **Chefe**: abas **Fases** (cartões das fases com fala, forçar/voltar fase, vitória alternativa), **Covil** e **Recompensas** ("Entregar no chat"); **barra de chefe** no topo da tela de todos durante o combate (opcional, com ou sem números).
  - No modo edição os campos aparecem no lugar e as outras abas da ficha ficam no fim da barra.
- **Sanidade máxima 0** desliga a Sanidade (sem penalidade de Colapso em monstros e construtos).

## Novidades da 0.8.10

- **Tipos de ficha de NPC**: fichas de NPC (atores "npc") ganham a aba **Mestre** (só o Mestre vê) com o tipo de ficha: **NPC Importante**, **NPC Comum**, **Monstro**, **Monstro Forte** e **Chefe**. Cada tipo mostra só as abas que fazem sentido (dá para mostrar ou esconder cada uma em Personalizar).
- **Todos**: ND com os PEv ao derrotar (5 × ND), Vida por fórmula com "Rolar Vida" (na ficha ou um valor diferente para cada token selecionado) e Notas do Mestre (agenda, segredo, ganchos, se morrer).
- **NPC Importante**: Serviços (treinos, loja, serviços com preço), função, disposição e interpretação rápida.
- **NPC Comum**: interpretação em três linhas (jeito, o que quer, o que sabe), moral e loot.
- **Monstro**: categoria, tamanho, habitat, deslocamentos, RD, imunidade a condições, sentidos e tática; **Conhecimento** por DT ("Revelar" pede o total do teste e manda o que foi descoberto para o chat); **Loot e materiais** com chance e quantidade ("Saquear" rola tudo).
- **Moral**: quando a Vida passa do limite (padrão 25%), cartão só para o Mestre: foge (aplica Fugindo), rende-se ou continua lutando. Uma vez por combate.
- **Monstro Forte**: Tenacidade (recusa condições, volta no fim do combate), Ações Lendárias por rodada, **Recargas 5–6** (roladas sozinhas no começo do turno dele no combate) e lacaios.
- **Chefe**: liga as fases da regra "Chefes com fases" sozinho, Resistência Lendária (volta no descanso longo), Míticas e Arcaicas, **Ações de Covil** com tabela (rolagem sozinha a cada rodada, se ligada), **vitória alternativa** com sucessos e falhas, e recompensas.

## Novidades da 0.8.9

- **Hydrakariel 100% automático**: botão de ligar/desligar a passiva (regeneração, resistências e reações), Corpo adaptável (resistência ao tipo de dano sofrido até o seu próximo turno, menos Arcaico), Sobrevivência da Hidra (fica com 1 PV e rola 15d12 Venenoso, 1× por combate), Regeneração de Cabeças (golpe de 100+ pede a escolha), Devoradora (pergunta o dano e cura ¼ até 50), Veneno Primordial (30 por turno no alvo por 3 turnos), Corrosão (−5 de CA no alvo por 2 turnos), Guardiã (barreira de 150 até o seu turno), Renascimento (metade da Vida e encerra condições negativas). Quem já tinha o cajado recebe a versão nova sozinho.
- **Resumo ao passar o mouse** em cada forma na hora de escolher qual usar.
- **Ativação condicional mais completa**: gatilho "ao chegar a 0 de Vida" (com "fica com 1 PV"), dano mínimo no gatilho de dano, efeitos na hora (cura com @dano/@nivel/@pvMax, barreira, encerrar condições, dano por turno no alvo), debuffs no alvo marcado, resistência ao tipo do dano recebido, duração "até o seu próximo turno", "por alguns turnos" e "até trocar", e bônus "só no próximo teste" (um por ativação).
- **Escolhas**: habilidades com duas opções trocam quando você usa de novo ("até trocar"); treinos com escolha: Aura de Proteção (RD ou CA) e Sintonização com Arma (escolha a arma e ela conta como desarmada sozinha), na aba Treinos e na aba Combate.
- **Códex do Vazio**: o botão da aba Magias agora usa o site certo; cole um ou vários registros ("Copiar registro") e viram magias. As magias antigas com o link do site errado são corrigidas sozinhas.
- **Testes de Resistência** ficam só na caixa própria (e se editam lá), com o aviso de que contam como perícias.
- **Resistências de fora** (itens, bônus de cena, bênçãos) também aparecem no modo edição da aba Combate.
- **Fichas antigas** recebem as mudanças das versões novas ao abrir o mundo (Mestre).

## Novidades da 0.8.8

- **Escudo do Mestre**
  - Aba **Habilidades**: habilidades prontas (Dobro e Passo, Meme, fora do limite), transformações, criar habilidade ou magia de qualquer categoria (dar ou só criar no mundo), colar texto e as habilidades do mundo com Dar.
  - Aba **Opcionais**: as mecânicas opcionais e as listas delas saíram de Ajustes.
  - **Itens prontos**: Hydrakariel, Trono das Sete Cabeças (cajado mítico com 11 formas, resistências e regeneração).
  - Correções: Teste em grupo sem perícias, caixinhas enormes nas regras, consumível repetido agora soma na pilha, nomes de condição cortados.
- **Armas e itens**
  - Campo **Alcance** na arma (Automático, Corpo a corpo, À distância): bônus de corpo a corpo não vão para uma sniper.
  - **Formas em itens**: arma ou acessório com vários poderes; o botão Formas escolhe qual usar. Novo uso "1× por turno" e cura de item no início do turno.
  - **Joia de Kan** no catálogo (Gemas e tesouros), valendo 3 Dracmas. Kan antigo guardado como moeda vira 3 Dracmas por Joia.
- **Combate**
  - **Testes contra a morte** com 0 de Vida: d20 puro, 11+ positivo, 10− negativo, 20 vale 2 positivos e 1 vale 2 negativos; 3 de um lado decidem. Rola sozinho no Novo turno.
  - **Reação antes do acerto**: contra uma ficha EPM, o cartão esconde acerto e dano até o alvo escolher Esquiva, Bloqueio, Contra-ataque ou Nenhuma (desligável nas configurações).
  - **Crítico nos danos extras**: bônus de cena, efeitos e bônus externos com dados também multiplicam, cada um com a origem anotada.
  - **Ataque extra** comum: Ação de Movimento primeiro e sem a penalidade de −5.
- **Bônus de cena e ativação condicional**
  - Bônus de cena com testes, deslocamento, desvantagem e **Debuff** (números viram penalidade).
  - Opções de ativação condicional podem ser debuff, condição, desvantagem ou resistência, com nível mínimo e duração "até o próximo descanso". Revestimento Elemental (Guerreiro Elemental 6) pede o elemento ao usar.
- **Valores por ficha**: na aba Arquétipo e na sub-aba Classe, modo edição, cada personagem pode trocar os números do arquétipo e da classe (Duelista, Ataque Extra, Maestria, Projetos com "Int", Fúria, Crítico Brutal, Núcleo Vermelho…).
- **Relações**: pastas (Membros do grupo, Aliados, Inimigos…) e o jogador já conecta personagens de outros jogadores (não NPCs).
- **Polyglot**: só os idiomas do EPM aparecem.

## Novidades da 0.8.7

- **Briavoterna e Genesis de volta ao catálogo**: o catálogo agora tem as três regiões (646 itens: Umbra'Draxil 373, Briavoterna 177, Genesis 96), com os números revisados na conversa dos itens:
  - armas novas (Taco, Motosserra, Derringer, Lança-Arpão, Escopeta Automática, Fuzil de Atirador, Rifle Antimaterial, Pistola de Agulhas, Disco de Energia, Lança de Íons, Rifle Criogênico, Martelo Gravitacional, Lâmina Fantasma, Canhão Sônico) e a propriedade **Dupla** nas armas aprovadas;
  - armaduras novas, os escudos oficiais das duas regiões (saem o Escudo de Aço e o Gerador de Escudo de Energia), Vestimentas, curas e consumíveis com os preços e ações revisados;
  - Gelo virou Frio e Raio virou Relâmpago (Taser, Bastão de Choque, Mina de Pulso).
- **Munições novas**: Balas de Chumbo e as pontas especiais de Umbra'Draxil em Flecha e Virote; as balas especiais de Briavoterna nos calibres Pistola, Rifle e .50 (Expansiva, Explosiva e Injetora deixam de ser caixa genérica); cartuchos de escopeta, foguetes, granadas de lançador, arpões e as células e núcleos de Genesis.
- **Ícones próprios dos itens**: 378 ícones (Umbra'Draxil de Rara para cima; Briavoterna e Genesis inteiros). A imagem do item segue a ordem ícone próprio → arte do Foundry → ícone da categoria, igual no compêndio e no Catálogo de itens. O compêndio de itens ganhou subpastas por região.
- **Maestria das armas Exóticas**:
  - libera com **10 pontos** colocados na perícia da arma (Luta ou Pontaria; sem atributo nem "Outros"), ou **15** se a arma for de outra região que não a de origem;
  - a **arma favorita** libera na hora (e a Arma Favorita do Combatente também libera as Exóticas daquele tipo);
  - a linha da arma mostra o selo **Maestria Exótica** ou "faltam X pontos em Luta/Pontaria";
  - efeitos automáticos: Katana fica Leve e ganha Dupla; Besta de Mão perde Recarga Lenta e ganha Dupla; Rapieira passa a crítico 17–20. O resto vai como texto no cartão de ataque.
- **Arma favorita** (aba Sobre): 1 por personagem (o Mestre aumenta o limite por ficha), primeira escolha livre. Para trocar, o treinamento modelo **Trocar arma favorita** (10 PT, 1 semana): ao concluir, a ficha troca sozinha e avisa no chat. O Mestre troca direto.
- **Ajustar bônus do arquétipo e da classe** (modo edição, aba Arquétipo e Classe): troque os números que o arquétipo e a classe dão (vazio = livro, 0 desliga), a Vida/Estamina/Mana inicial, o dado e a média de cada arquétipo, e crie **bônus extras** (ex.: Duelista também dá CA ou RD), com condição (sempre, um Estilo, uma Maestria, Fúria ou Histeria ligada).

## Novidades da 0.8.6

- **Vida, Mana e Estamina automáticas com os seus números**: no modo edição, o painel ganhou:
  - opção **Digitar os valores** em "por nível": uma tabela com o valor do dado de cada nível (Vida, Estamina e Mana, por arquétipo). Dá para pôr os números da ficha antiga; vazio = média. No modo "Rolar o dado" a mesma tabela aparece e dá para corrigir qualquer rolagem;
  - **Ajuste manual** de Vida, Estamina e Mana: soma (ou tira) direto no máximo, para bater exatamente com outra ficha.
  - O detalhe de cada máximo mostra "valores digitados" e "Ajuste manual".

## Novidades da 0.8.5

- **Habilidades em várias partes** (ex.: *O Legado do Errante*):
  - botão **Colar texto** nas abas Habilidades e Magias: cole o texto (nome, Tipo, Tema, abertura e partes numeradas com Custo, Ação, Duração, Uso, Alcance, Alvo, Área) e a ficha monta a habilidade com uma forma por parte;
  - campos **Tipo** e **Tema** no editor;
  - **Uso** por forma (1× por combate, cena, descanso curto, descanso longo ou dia): depois de usada fica marcada "(usada)" e volta sozinha no fim do combate ou no descanso (o Mestre pode liberar antes);
  - ao abrir a habilidade na ficha, o efeito de cada parte aparece embaixo dela;
  - *O Legado do Errante* entrou no compêndio, em "Habilidades de exemplo".
- **Não conta no limite**: marque no editor as habilidades que ficam fora do limite da raridade (ex.: as 2 únicas).
- **Interruptor Ativa/Inativa** só aparece nas habilidades com **Liga/desliga** marcado no editor.
- **Chat só do que eu clicar**: toggle pequeno no topo da ficha, abaixo do Editar. Ligado, o que a ficha faz sozinha (gatilhos, automações, avisos de fim de combate) não vai para o chat; ataques, itens e habilidades usadas e rolagens continuam. Pedidos de teste com botão continuam aparecendo.
- **Textos sempre abertos**: Sobre, Anotações, descrições de itens e habilidades já abrem prontos para escrever (sem o botão de editar), com a barra de formatação. Salvar o texto não redesenha mais a janela, então a tela não pisca.
- **Mudar a categoria de um item**: seletor "categoria" no topo do editor do item (Arma, Consumível, Armadura, Escudo, Vestimenta, Acessório, Ferramenta, Loot, Mochila) e opção **Categoria** na seleção de vários itens (modo edição).
- **Bônus de cena**: o nome não fica mais espremido; novos campos **margem** (de ameaça) e **×crítico** (soma no multiplicador). Bônus situacional de habilidade também ganhou **Multiplicador de crítico**. A linha do ataque mostra o crítico já com os bônus de cena.
- **Painéis recolhidos são lembrados** mesmo quando o título tem contador ou estado (nível, sanidade…), e as mochilas fechadas também ficam fechadas na próxima vez.
- **Correções**:
  - o interruptor dos Bônus de cena e das Bênçãos tinha ficado com a aparência errada na 0.8.4;
  - fórmulas com atributo negativo mostravam "− -2" (agora "+ 2") e o detalhe do dano mostrava "−-2";
  - nomes de perícia compridos e o resumo de bônus dos itens não são mais cortados;
  - perícia e dano do ataque personalizado no modo edição ficaram mais largos;
  - o "Quando" dos efeitos de cura no editor do item mostra o texto inteiro.

## Novidades da 0.8.4

- **De onde vem cada valor**: passe o mouse no dano ou no acerto de um ataque, no dano de uma habilidade ou magia e no total de atributos e perícias para ver cada parte e a fonte dela.
- **Atalhos de atributo nas fórmulas**: `@for`, `@des`, `@con`, `@apa`, `@car`, `@int`, `@aut` e `@nuc` (valor final, já com penalidades). Ex.: `1d8 + @for`. O chip de dano mostra a fórmula resolvida.
- **Somar atributo no dano** das armas (seletor no editor da arma). A linha do ataque ficou em duas linhas: o nome não corta e o dano vai para baixo, sem os "+ 0".
- **Várias propriedades por item** como chips; propriedades de arma só em armas, de proteção só em armaduras e escudos (as de escudo só em escudos).
- **Durabilidade virou regra opcional** (desligada por padrão, em Regras opcionais).
- **Dica no compêndio**: passar o mouse num item, classe ou habilidade do compêndio mostra um resumo.
- **Inventário**:
  - botão **Do compêndio** para puxar itens direto para a ficha (itens iguais somam na quantidade);
  - categoria **Vestimentas e acessórios** abaixo de Armaduras e escudos (roupas, anéis, bugigangas, bastões, varinhas) e campo **Categoria** no editor do item;
  - **Mover para** em cada item: escolhe a mochila e quantos levar (separa ou junta pilhas);
  - **Organizar mochila**: por nome, raridade, peso, tipo ou do seu jeito (arrastar ou setas).
- **Habilidades**:
  - **interruptor Ativa/Inativa** ao lado do Usar (ligar usa e paga; desligar tira o bônus de cena e a sustentação);
  - **ativação condicional**: ao sofrer dano, Vida abaixo de 50% ou 25%, início do combate ou crítico, com bônus de margem de ameaça e valores **por nível da habilidade** (campo Nível e botão Subir de nível);
  - nova categoria **Meme** (subaba Memes);
  - exemplo **Instinto Assassino** no compêndio de Arquétipos e Classes.
- **Token fixo**: escolha qualquer imagem de token (ex.: a de insano) sem precisar cumprir a condição.

## Novidades da 0.8.3

- **Borda do token em 3 cores**: **Principal** (anel), **Secundária** (chamas) e **Terciária** (só as runas e o brilho das estrelas). Cada parte tem seu seletor de cor e um botão para voltar à cor original. As partes mantêm o claro e o escuro do desenho. A janela lembra as últimas cores.

## Novidades da 0.8.2

- **Compêndio "EPM · Itens de Umbra'Draxil"**: os 338 itens do catálogo como itens do Foundry, com imagem, separados em pastas por categoria e do mais barato ao mais caro.
  - Subpastas: Armas (Corpo a corpo, Distância), Armaduras (Leves, Médias, Pesadas) e Poções (Vida, Mana, Estamina, Sanidade e coragem, Proteção, Resistência, Outras).
  - O Mestre cria e atualiza o compêndio sozinho ao entrar no mundo. É só arrastar os itens para as fichas.
  - Imagens: o módulo procura nas pastas de ícones do próprio Foundry uma imagem com o nome do item (espada, machado, poção vermelha…). Quando não acha, usa o ícone da categoria que vem com o módulo. O Catálogo de itens usa as mesmas imagens.
- **Enquadrar o token como editor de foto**:
  - um quadrado sobre a imagem, que aumenta ou diminui puxando as laterais e os cantos e anda segurando o meio;
  - o que fica dentro dele vai para o círculo da borda;
  - prévia ao lado;
  - **cor da borda** (ou a cor original). A ficha lembra a última cor escolhida.

## Novidades da 0.8.1

- **Enquadrar o token na borda do EPM** (anel de runas com chamas). Ao escolher a imagem de um estado do token (Normal, Insano, Machucado, Morrendo, Morto) ou de uma transformação, abre o enquadramento:
  - arraste a imagem e use a roda do mouse (ou o zoom) até ela ficar no círculo de dentro, antes das runas;
  - o que fica fora da borda e das chamas sai transparente;
  - o PNG (512 px) é salvo na pasta **Tokens** dos dados do Foundry.
- O botão de recorte ao lado da imagem enquadra de novo a partir da imagem original. "Sem enquadrar" usa a imagem como veio, e dá para desligar a borda.
- Salvar o token precisa da permissão "Enviar arquivos" (o Mestre libera para os jogadores).

## Novidades da 0.8.0

Patch das novas mecânicas (documento do Projeto `EPM/patch-novas-mecanicas.md`). Os itens 1 a 22 e 24 já estavam na 0.7.x; esta versão traz a Parte 3 e os ajustes em que o texto do patch mudou.

- **Níveis de tecnologia** (Umbra'Draxil 1, Briavoterna 2, Genesis 3):
  - Aba **Sobre**: campo **Região de origem**. Ele define o nível de tecnologia que o personagem domina (sem ele, vale o campo antigo "tecnologia" do painel).
  - Editor de item: **Região** e **Nível de tecnologia** também em consumíveis e ferramentas, e a caixinha **Complexo**.
  - A ficha compara o item com o personagem e aplica a penalidade sozinha:
    - arma ou item de usar 1 nível acima: desvantagem;
    - 2 níveis acima: desvantagem e −5. Se for complexo, pede um teste de Tecnologia DT 20 antes de usar. Passou, o personagem entende aquele item e não pede mais.
    - armadura ou escudo 1 ou 2 níveis acima: −2 ou −5 na CA e sem as propriedades especiais (as penalidades continuam valendo).
  - A linha do item mostra a penalidade.
  - Treinamentos modelo: **Adaptação tecnológica: nível 2** (5 PT, 48 h) e **nível 3** (10 PT, 56 h; pede nível de tecnologia 2). Concluir uma adaptação tira a penalidade daquele nível. O Mestre pode dar ou tirar a adaptação na mão (painel da ficha, modo edição).
- **Falha crítica com tabela:** a ficha pergunta antes de aplicar o resultado.
- **Âncoras:** quando a ficha detecta que uma âncora se perdeu, o Mestre confirma antes de tirar a Sanidade.
- **Conserto:** leva 10 minutos (não gasta horas de treino) e o sucesso recupera 50 de durabilidade.

## Novidades da 0.7.9

- **Compêndio "EPM · Arquétipos e Classes"**, no formato do D&D 5e: cada **Arquétipo** é um item **Classe**, cada **Classe** pronta é uma **Subclasse** do arquétipo dela, e cada habilidade é um **Talento** ligado por nível (como os avanços do D&D). Fica na aba Compêndios do mundo; o Mestre cria e atualiza sozinho quando o módulo muda.
  - Arrastar um **Arquétipo** para a ficha define o arquétipo (pergunta se é o principal ou o segundo) e cria as habilidades já liberadas.
  - Arrastar uma **Classe** escolhe a classe (e o arquétipo dela, se a ficha ainda não tiver um) e cria as habilidades liberadas na sub-aba Classe.
  - Arrastar uma **habilidade** do compêndio põe só ela, sem custo de PH e sem repetir.
  - O nível continua sendo o da ficha EPM. Botão do livro ao lado do Arquétipo (modo edição) abre o compêndio.
- **Escudo do Mestre → Itens:** com fichas marcadas, "Dar para" passa a ser **Os marcados** e itens, transformações, moedas e o catálogo vão para todas as fichas marcadas. Antes ia sempre para a primeira ficha do grupo.

## Novidades da 0.7.8

- **Catálogo de itens de Umbra'Draxil** (338 itens): botão **Catálogo de itens** no Inventário e no Escudo do Mestre → Itens. Busca sem acento, filtro por categoria, quantidade, total em moedas, **pagar com as moedas da ficha** e, para o Mestre, **dar** para um personagem ou **importar para o mundo** (pasta "EPM · Catálogo de itens").
  - Já com as mudanças aprovadas na revisão dos itens: curas e consumíveis (Erva Curativa, Bandagens, itens de calma, Tônico da Lucidez, Elixir Restaurador), Poções de Proteção e de Resistência para os 10 elementos, nomes oficiais de dano (Frio, Relâmpago), Cristais de Mana como Ação Livre, ajustes de Peitoral de Aço, Couro Batido e Mangual, armaduras novas (Peles, Talas, Couro de Basilisco), a categoria **Vestimentas** (com as Vestes do Arquimago), os 8 escudos oficiais e 2 extras com as propriedades de escudo, 8 armas novas, a propriedade **Dupla**, Dardos de Zarabatana e as armas **Exóticas** com o texto da Maestria.
  - As Poções de Resistência dão Resistência de verdade pela cena (Bônus de cena).
  - Briavoterna e Genesis entram depois da revisão deles. O botão **Armas e armaduras do Notion** continua para as armas e armaduras dessas regiões.

## Novidades da 0.7.7

- Os cartões das listas agora recolhem com a seta (para cima / para baixo) no título, como os treinamentos: bênçãos e maldições, companheiros, criaturas do bestiário, relações, facções e receitas. Recolhido, fica só a linha do nome; a ficha lembra quais estão fechados.

## Novidades da 0.7.6

- **Selecionar vários** em todas as abas com listas. O botão **Selecionar** no topo da aba põe uma caixinha em cada linha e uma barra de ações. Shift + clique marca um intervalo, e **Marcar todos** pega tudo o que está visível.
  - **Inventário:** Usar (consumíveis e itens com cargas), Equipar/tirar, Favoritar, No chat, Mochila (guardar numa mochila ou tirar). No modo edição também tem Raridade, Duplicar e Apagar (os itens de dentro de uma mochila apagada voltam para o inventário).
  - **Bênçãos e maldições:** Usar, Ligar/desligar, Recarregar, Encerrar, No chat e, no modo edição, Apagar.
  - **Companheiros:** Recuperar tudo (enche PV, PM e PE) e, no modo edição, Apagar.
  - **Bestiário** (modo edição): +1 encontro, +1 derrota, Tirar do bestiário.
  - **Relações e facções, Produção** (modo edição) e **Treinamentos e projetos de criação:** Apagar.
  - **Habilidades e Magias** continuam com a seleção que já tinham (Usar, Favoritar, No chat, Raridade, Mover/Círculo, Passiva, Duplicar, Apagar).

## Novidades da 0.7.5

- Reflexos agora aparece na lista de Perícias também no modo edição (é ali que se editam nome, pontos e atributos). Nos Testes de Resistência ele continua visível, só para leitura, enquanto a ficha está em edição.

## Novidades da 0.7.4

- **Reflexos na lista de perícias:** além da caixa de Testes de Resistência, Reflexos aparece na lista de perícias (no modo edição ele fica só na caixa, para não duplicar os campos).

## Novidades da 0.7.3

- **Fichas antigas em dia:** quando o Mestre entra no mundo, todas as fichas EPM (personagens e NPCs, mesmo as que ninguém abriu) recebem o que entrou até agora: perícias da lista do mundo que faltavam, Testes de Resistência, Vontade com Autocontrole e as habilidades da classe pronta já escolhida. Nada é apagado.

## Novidades da 0.7.2

- **Treinamentos recolhíveis:** cada treino (e cada projeto de Criação) tem a seta no canto para recolher; recolhido, fica só o nome e a barra de progresso.
- **Perícias no modo edição:** o nome volta ao tamanho normal e com espaço para ler; os atributos ficam na linha de baixo.
- **Nova perícia:** escolhe o atributo na hora; o Mestre pode marcar "em todas as fichas", e a perícia entra na lista do mundo (fichas novas) e em todas as fichas antigas.

## Novidades da 0.7.1

- **Reflexos nas fichas antigas:** quem não tinha a perícia Reflexos (e o Teste de Resistência) ganha sozinho, com Destreza. Vale para personagens e NPCs, mesmo os que ninguém abriu; Fortitude e Vontade também entram se faltarem.

## Novidades da 0.7.0

**Novas mecânicas na ficha**
- **Ataque em dupla** (afinidade +3) e **Magia conjunta** (CD maior + 2): o parceiro ou o Mestre confirma, e a ficha marca as ações e desconta a Mana dos dois.
- **Sobrecarga de Núcleo:** sem Mana, paga o resto com o dobro em PV ou o mesmo em PS; depois vem o cartão do teste de Núcleo DT 15 (falhou, Mana Instável).
- **Concentrado:** cada dano sofrido pede Vontade DT 15 por cartão; falhou, a concentração sai sozinha.
- **Recuperado:** quem sai de Atordoado, Paralisado ou Dominado fica imune a ela até o fim do próximo turno.
- **Estamina zerada:** +1 de Exaustão na hora.
- **Inspiração de Tema** (até 3, o Mestre dá): vantagem no próximo teste, rerrolar ou +5 no teste de um aliado pelos botões do cartão.
- **Treinamentos:** requisitos de atributo, perícia e treinamento conferidos sozinhos; treino em grupo (afinidade +2); treinador com preço por hora pago com as moedas; 0 acertos no minijogo deixa Lesionado.
- **Criação de itens:** sub-aba em Treinamentos, com item modelo e materiais arrastados, horas, perícia e DT.
- **Durabilidade** de armas, armaduras e ferramentas: falha crítica e crítico sofrido tiram 10; em 0 o item quebra e perde os efeitos; conserto com ferramenta e Ofício DT 12.
- **Afinidade:** histórico com data do Simple Calendar, motivo e eventos rápidos do Mestre.
- **Juramentos** nas duas fichas; quebrar sorteia uma Maldição Memética Boa.

**Regras opcionais** (Escudo do Mestre → Ajustes; começam desligadas)
- Falha crítica com tabela, Chefes com fases, Aura de Horror, Âncoras, Traumas, Domínio de arma, Feitos e títulos, Purificação e transferência de maldição, Acúmulos de condições e Atividades de descanso (com o botão Emboscada).

**Correções e visual**
- **Vontade** usa só Autocontrole (lista do mundo, fichas novas, antigas e NPCs).
- **Ficha mais limpa:** Principal com atributos à esquerda e perícias à direita, Turno no topo do Combate, explicações longas e painéis vazios só no modo edição.
- **Também nesta versão:** painel do grupo com qualquer ator, perícias iniciais 50, bônus de raça automáticos, voto passivo da troca de atributo, Besta Desperta no Escudo, imagens do token por estado, bônus de atributo nos recursos e escolha de classe pelo arquétipo.

## Novidades da 0.6.6

- **De onde vem o total da perícia:** fora do modo edição, cada perícia mostra o atributo com o valor, os pontos e, em dourado, os bônus de fora (passe o mouse para ver as fontes).
- **Aparência 6+:** o bônus vale para toda perícia com Carisma na base, mesmo que o atributo somado seja trocado (ex.: Intimidação com Núcleo = Núcleo + Aparência).

## Novidades da 0.6.5

- **Estilos de Combate do Combatente:** Combate Defensivo, Arma Pesada, Arma Leve, Duelista, Bêbado (com a nova condição Bêbado), Atirador, Armamento Longo e Arma Dupla, aplicados na ficha e no ataque.
- **Treinos automáticos:** Aura Iniciante, Magia Potente e Fortalecimento Mental passam a somar sozinhos; o quadro "Efeitos dos treinos concluídos" mostra o resto.
- **Treinos concluídos por categoria**, em divisões que abrem e fecham.
- **Bônus editáveis pelo Mestre:** Configurações → Bônus de estilos e treinos.
- **Classes novas:** Guerreiro Elemental (Arma Elemental 4d12 no nível 39), Portadora do País Impossível, Caçador e Trovador, com as habilidades por nível no painel da classe.
- **Testes de Resistência:** caixa própria acima das perícias com Fortitude, Reflexos (nova; a Esquiva agora usa Reflexos) e Vontade.
- **Ordem das perícias:** no modo edição, arraste ou use as setas.
- **Correção:** a ficha não pula mais de posição ao sair de um campo.

## Novidades da 0.6.4

- **Marcador de turno EPM:** anel roxo em volta do token de quem está na vez. Vale quando o marcador de turno do combate está sem imagem própria. Dá para desligar em Configurações → "Marcador de turno EPM".

## Novidades da 0.6.3

- **Codex do Vazio:** botão na aba Magias para importar magias de pf2srd.com.br/magias, pelo nome, pelo endereço ou colando o texto da página.
- **Fase de vida (geração)** escolhível em Sobre, com mais peso que a idade em anos.
- **Idade:**
  - "1.200 anos" passa a valer 1200;
  - a raça escrita à mão é reconhecida;
  - raça sem tabela de idade fica sem efeito.
- **Passar o mouse mostra o efeito** das condições, exaustão, idade e Sanidade nas penalidades, nos atributos e nas perícias.
- **Ficha rápida de NPC** cria uma ficha de NPC de verdade (aba Atores), já com a ficha EPM.
- **Seções que abrem e fecham** (Caminhos, Conquistas, catálogos…) continuam abertas depois de clicar em botões dentro delas, na ficha e no Escudo.

## Novidades da 0.6.2

- Removida a mecânica de **região e densidade de mana**: a seção "Região e mana" do Escudo → Mundo, o passaporte da aba Sobre e os efeitos da densidade nas magias (custo extra, Recuperar Mana e Antimagia). A região das armas e armaduras do catálogo e o nível de tecnologia continuam.

## Novidades da 0.6.1

- **Corrupção com máximo ajustável:** o Mestre define quanto cada personagem resiste. O padrão é 100. Os marcos ficam em 25%, 50%, 75% e 100% do máximo.
- **Troca de bônus de atributo acima de 4:**
  - dois atributos trocam de bônus entre si (Força ⇄ Constituição, por exemplo), e cada atributo entra em uma troca só;
  - a troca só vale com um voto aprovado pelo Mestre;
  - o Mestre marca "aprovado" em Bênçãos → Votos.
- **Arma que conta como ataque desarmado** (Sintonização com Arma), com a opção de receber só os bônus de desarmado ou os dois.
- **Amálgama** (Entretenimento Divino): escolhe uma passiva ou habilidade de outra raça.
- **Vida/Mana/Estamina automáticas:** as opções (média ou rolar o dado, atributo de cada recurso) aparecem no modo edição mesmo com o cálculo desligado.
- **Correções:**
  - o campo Efeito das habilidades voltou a ser editável;
  - o tipo de arma da Arma Favorita não se repete mais ("Katana,Katana…"), e as fichas afetadas se corrigem sozinhas;
  - a imagem de fundo da ficha aparece, e os painéis ficam translúcidos sobre ela.

## Novidades da 0.6.0

Conteúdo do Notion e as ideias novas. Precisa recarregar o mundo (o módulo passa a usar socket).

- **Raças prontas**: 13 raças do Notion, com Habilidades Únicas, Mestiço, atributos da raça, deslocamento, tamanho, habilidades na sub-aba Raça e os Caminhos do Entretenimento Divino.
- **Vida, Mana e Estamina automáticas**: Raça + Arquétipo + atributo (padrão Constituição, Núcleo e Constituição; dá para escolher). Por nível, a média ou o dado rolado, mais o atributo.
- **Atributos acima de 4 e teto por nível**.
- **Sanidade**: estados (Estável a Colapso), dano com teste de Autocontrole, as 100 insanidades do PDF com as condições ligadas, e insanidades com tipo, gatilho e intensidade.
- **Corrupção acumulada** com marcos.
- **Combate**:
  - Ação Completa (Investida, Correr, Recarga Lenta, Primeiros Socorros com Medicina DT 20).
  - Padrão → Bônus ou Movimento.
  - Manobra do Combatente.
  - Crítico Brutal.
  - Noção de Vitalidade.
  - Familiaridade tecnológica.
  - Munição em Pacote.
- **Classes completas do Notion**: Bárbaro (Fúria, Proteções), Guardião (Corpo de Pedra, Proteção) e Lutador (Porrada Franca, Posições). A árvore elemental vale para o Guerreiro Elemental.
- **Votos e pactos** (quebrar e cumprir).
- **Talentos** comprados com PEv.
- **Treinamentos do Notion** por categoria, com modelos para a categoria Mental.
- **Itens**:
  - Armas e armaduras das três regiões, com propriedades e Estamina por turno.
  - Kits iniciais.
  - Base das Melhorias de itens.
- **Elemento** nas magias.
- **Nomeação de criaturas**, liderança, hierarquia militar, Receio e Confiança.
- **Bestiário**: conhecimento de criaturas compartilhado com o grupo e ficha de criatura.
- **Idiomas do EPM** com nível (Básico, Fluente, Nativo). Os proibidos só o Mestre concede.
- **Tamanho, movimentos e sentidos**. Idade como regra opcional.
- **Títulos e conquistas**.
- **Escudo do Mestre → Mundo**:
  - Relógios de urgência e enquetes.
  - Códigos de recompensa.
  - Ficha rápida de NPC.
  - Chefes com fases.
  - Compêndio do mundo.
  - Calculadora de encontro.
  - Avisos no Discord.
- **Escudo → Ajustes**: conteúdo não oficial do Notion (condições, tipos de dano, bênçãos e maldições, idade, grau do Núcleo, calculadora), tudo desligado por padrão.

## Novidades da 0.5.12

- **Munição da arma**: no editor da arma, a caixa **"Gasta munição"**. Marcada, escolhe o tipo:
  - **Unitário** (1 flecha, 1 virote…): cada ataque tira direto do item de munição escolhido (quantos por ataque).
  - **Pente**: tamanho do pente, quantos tiros tem agora, munição usada para recarregar e qual ação recarregar gasta. Os tiros saem do pente; o botão Recarregar enche com a munição.
  Desmarcada, a arma não gasta nada. Armas antigas continuam como estavam (munição ligada = unitário; pente > 0 = pente).

## Novidades da 0.5.11

- **Armas com mais de um modo de ataque**: no editor da arma, "Modos de ataque" adiciona outros jeitos de atacar com a mesma arma (ex.: lança: ponta 1d6 Perfurante, cabo 1d4 Contundente). Cada modo tem nome, dano, tipo de dano e, se quiser, perícia e bônus de acerto próprios (vazio = igual à arma). Cada modo vira uma linha em Combate → Ataques, com munição, cargas, Maestria e defesas funcionando igual. O contra-ataque também deixa escolher o modo.

## Novidades da 0.5.10

- **Resistências, imunidades e vulnerabilidades** agora ficam só na aba **Combate** (painel "Defesas contra dano", embaixo da RD): fora do modo edição mostra tudo (inclusive o que vem de itens, bênçãos e condições, com a origem ao passar o mouse); no modo edição, os três campos para adicionar e remover.
- Saíram da aba Condições (junto com o aviso de Idiomas) e da Principal (que agora tem só Condições e Idiomas).

## Novidades da 0.5.9

- **Seletor de tipo de dano** novo: a lista do navegador não cabia na tela e não rolava. Agora, ao clicar num campo de tipo de dano (ataques, armas, habilidades, resistências, imunidades, vulnerabilidades, RD, Escudo), abre uma lista própria com rolagem, separada por grupo (Físicos, Elementais…), com os grupos inteiros e os outros itens (condições, "Todos os danos") no fim. O nível (Natural, Mágico, Verdadeiro, Límbico, Arcaico) é escolhido nos botões do topo. Digitar filtra a lista.
- **Corrupção não tem níveis**: não ganha "(Mágico)" etc. e qualquer proteção contra Corrupção vale.

## Novidades da 0.5.8

- **Tipos de dano do RPG**: Contundente, Cortante, Perfurante (Físicos); Fogo, Água, Ar, Terra, Gelo, Raio, Ácido, Sonoro (Elementais); Força, Radiante (Sagrado), Luz, Necrótico, Sombra, Espiritual, Temporal e Corrupção (Energéticos e místicos); Psíquico (Mentais); Venenoso (Biológicos). Nomes antigos continuam valendo (Corte = Cortante, Trevas = Sombra, Elétrico = Raio…), e dá para proteger um grupo inteiro ("Elementais").
- **Níveis de dano**: Natural → Mágico → Verdadeiro → Límbico → Arcaico. Resistência, imunidade e RD têm nível (padrão Natural) e só seguram dano do nível delas ou abaixo: "Fogo (Mágico)". A vulnerabilidade vale em qualquer nível. O aviso do dano diz quando o nível passou a proteção. Referência no Escudo → Regras.
- **Bônus situacionais** em habilidades e magias: cada forma pode ter opções (RD, CA, dano, acerto, testes, deslocamento) que valem pela cena. Escolhe na hora ou rola o dado (d4 com 4 opções). Gatilho "ao sofrer dano": conjura sozinha se tiver o custo (ex.: Sentido de sobrevivência). Vira um Bônus de cena (que agora também soma CA, RD, testes e deslocamento) e some no fim do combate ou no descanso.
- **Aba Produção** (aparece quando há receita): forja, alquimia, rituais mágicos e encantamento. Receitas com profissões combináveis, dificuldade (CD 15/25/35), ingredientes conferidos e gastos do inventário, ferramentas, resultado (item ligado ou simples). 4 h por profissão no relógio do mundo (Simple Calendar), barra e etapa atual, "Pular tempo" no modo edição, um teste por profissão no fim (1d20 + perícia + atributo). Sucesso cria o item (Forja: +3 Pontos de Estrutura); falha perde os materiais; 1 natural é falha crítica (acidente ou produto defeituoso).

## Novidades da 0.5.7

- Ordem do dano corrigida: **imunidade → vulnerabilidade (×2) → resistência (metade) → RD**. Vulnerável e resistente ao mesmo tipo: uma anula a outra.
- Tipo de dano novo: **Corrupção**.

## Novidades da 0.5.6

- **Redução de dano (RD)** na aba Combate: caixa nova para RDs da ficha (valor + tipo de dano; vazio = todos os danos; aceita lista como "Fogo, Gelo"). Funciona como uma resistência, mas tira o número escolhido em vez de cortar à metade. As RDs de itens aparecem junto.
- **Aplicar dano** agora considera, nas fichas EPM, a imunidade (zera), a vulnerabilidade (×2), a resistência (metade) e a RD (tira o número), nessa ordem. O aviso mostra a conta de cada alvo.
- **Escudo do Mestre → Grupo**: botão **Adicionar ficha** (qualquer ator do mundo: NPC, aliado, montaria…) ou arrastar da aba Atores. Cada linha tem **Tirar do grupo** (a ficha não é apagada) e há **restaurar padrão**. O grupo vale para Dar pontos, Descanso, Testes e Itens.
- Escudo: campo opcional **tipo de dano** no dano rápido, para a RD, a resistência e a imunidade entrarem sozinhas.

## Novidades da 0.5.5

- **Projetos do Artífice** no painel do arquétipo (abas Habilidades e Arquétipo e Classe):
  - **Criar projeto** (Dano, Cura, Soma ou Proteção): 2 por dia, fica pronto depois de 1 minuto de produção.
  - **Usar**: Dano e Cura rolam no chat com botão para aplicar nos alvos marcados (a cura vai no próprio Artífice se ninguém estiver marcado). Soma dá +X em todos os testes e Proteção dá +X de CA, por 1 hora, já somados na ficha.
  - O projeto usado some e volta depois de 1 hora. Tudo termina quando o dia muda.
  - **Livro de Projetos**: guarde um projeto do dia para recriá-lo depois (limite pelo nível e Inteligência).
  - O tempo segue o relógio do mundo. Com o **Simple Calendar** ativo, usa o calendário dele (hora e virada do dia), e a ficha se atualiza sozinha quando o tempo avança.

## Novidades da 0.5.4

- **Arquétipos modelo 0.5 (Combatente, Conjurador, Artífice):** em Habilidades → Arquétipo, a progressão do 1 ao 50, as habilidades liberadas (botão para criar na ficha) e as automações:
  - Combatente: Arma Favorita (um tipo de arma, escrito no editor de cada arma) com as 8 Maestrias por etapa (Certeiro e Arma Longa no diálogo de ataque; Destrutivo e Alongado no cartão do chat; Protetora na CA; Perigosa no crítico; Gêmea como ataques extras), Ataque Extra por PE (1×/turno), Estilos de Combate (Duelista, Atirador, Arma Dupla) e Caçador Natural.
  - Conjurador: custo das magias por círculo (já vem nas magias novas), círculos trancados até o nível, Reserva Arcana no PM máximo, Recuperar Mana (1×/cena) e Manipulação Mágica e Sobrecarga direto no cartão da magia.
  - Artífice: valores de Criar Projetos, Livro de Projetos e Itens Encantados pela Inteligência, Utensílios (+2 em 3 perícias) e o Pequeno Autômato (2.0 e 3.0) na aba Companheiros.
- **Defesa no chat:** o cartão de ataque mostra Esquiva, Bloqueio e Contra-ataque para cada alvo; o resultado já calcula o dano (2/3, metade ou nada no Bloqueio) e gasta a ação do próximo turno. Contra-ataque abre o ataque de volta.
- **DT das magias e habilidades** = 10 + atributo (Núcleo) + perícia (Arcanismo), os dois escolhíveis. O alvo clica em Resistir e rola a perícia pedida (Vontade, Fortitude, Acrobacia…), gastando a Reação.
- **Combate:** ataque extra comum (Ação Bônus ou de Movimento, com penalidade configurável), ataque de oportunidade (gasta a Reação) e atrasar turno (1×/combate). Munição e cargas descontam sozinhas no ataque e recarregam no descanso ou no fim do combate.
- **Sustentadas:** cada forma de habilidade ou magia pode ter um gasto por turno (PM, PE…). Ao usar, ela fica "Sustentando" (Combate, Habilidades e Magias) e o custo sai a cada Novo turno; se faltar recurso, termina sozinha. Um X encerra.
- **Armas de fogo com pente:** a arma tem quantos tiros cabem no pente; cada ataque gasta do pente e "Recarregar" puxa da munição ligada e gasta a ação escolhida na arma (Padrão, Bônus, Movimento, Reação ou Livre).
- **Habilidades:** sub-aba Transformações (imagem, custo, duração, modificadores enquanto ativa, habilidades que só funcionam transformado, troca opcional do token); Habilidade Única em destaque; seleção de várias habilidades ou magias para usar, favoritar, mover, mudar raridade ou círculo, duplicar ou apagar de uma vez.
- **Sobre:** bordão (aparece embaixo do nome), música tema, Segredos (só o dono e o Mestre) e o botão Ressonância de Alma na Marca.
- **Relações:** selo colorido do vínculo, nota privada, histórico da afinidade (quem mudou, quando e por quê) e Facções com reputação de −5 a +5.
- **Abas novas:** Companheiros (mini-fichas; aparece fora do modo edição quando tem alguém) e Bestiário (criaturas, fraquezas, encontros; registra sozinho no fim do combate, opção do módulo). Anotações ganhou o Diário de sessões (ganhos de PEv, PT e PH somados com um clique).
- **Treinamentos:** "Pular tempo" no modo edição (timeskip sem o limite do dia; o que sobra pode virar PT de estudo).
- **Personalizar:** imagem de fundo com véu, moldura do retrato, estilo de letra, tamanho do texto e esconder abas que não usa.
- **Escudo do Mestre:** janela só do Mestre (botão na aba Atores e no Combat Tracker), no estilo da ficha, com abas Combate (iniciativa editável, recursos, defesas, condições, próximo turno, Novo turno EPM), Grupo (dar PEv/PT/PH, descansos, Relação múltipla), Condições (as 131 em um clique e Exaustão), Itens (dar itens do mundo e moedas), Testes (teste em grupo contra DT, rolagem livre), Regras e Notas. Dano, cura e temporário rápido nos alvos marcados ou nos tokens selecionados.
- **Combat Tracker Dock:** com o módulo ativo, o carrossel mostra PV, PM, PE, PS, CA, Esquiva, Bloqueio, Contra-ataque e DT do EPM (configurado sozinho na primeira vez; a 2ª barra é a Mana) e ganha o botão do Escudo do Mestre.
- **Mestre:** Painel do grupo (botão na aba Atores) com recursos, CA, Exaustão e condições de todos, e "Dar aos marcados" (PEv, PT e PH).
- **CA:** "Armaduras e escudos" é um valor fixo que vem só do que está equipado no Inventário (o campo manual antigo foi para "outros").
- **Barras:** Vida, Mana, Estamina, Sanidade e os temporários descem (e sobem) deslizando; o que foi perdido deixa um rastro claro.

## Novidades da 0.5.3

- **Sobre → Traços:** novos campos Apelido, Vulgo e Sexualidade. Também aparecem nas relações, junto com os outros traços, quando a afinidade libera.

## Novidades da 0.5.2

- **CA = 10 + Destreza + Armadura + outros.** No modo edição, o atributo da CA pode ser trocado (Destreza é o padrão). Armaduras e equipamentos ganham o campo "Armadura", que soma na CA quando equipados.
- **Aba Treinamentos.** Ganhe PT com "Treinar ou estudar" (6 h = 5 PT) ou "Conversa ou tutor" (1 a 3 PT), com o limite de 8 horas de treino por dia (zera no descanso longo). Crie treinamentos com tempo, PT, requisitos, treinador (✓/✗), benefícios e modificadores que entram na ficha ao concluir; comece pagando os PT e registre as horas até concluir. Modelos do livro: Corredor e Flash Step.
- **Treino rápido:** três minijogos (Sequência, Na mira e Explosão) de 5 rodadas para uma hora de descanso: 2 ou 3 acertos valem 1 PT, 4 ou 5 valem 2 PT.
- **Editor de item EPM.** Armas, armaduras, consumíveis, ferramentas, loot e mochilas abrem numa janela própria (no lugar da do D&D) com raridade, quantidade, peso, preço em moedas EPM, ataque, armadura, bônus e efeitos e descrição. **Mochilas guardam moedas EPM** (Guardar da carteira / Pegar para a carteira) e mostram o conteúdo.
- **Relações:** jogadores e Mestre mudam a afinidade com quem quiserem, personagens ou NPCs, no modo edição. A opção "Só o Mestre muda a afinidade" agora vem desligada (ligada, só o Mestre muda).
- **Recursos temporários** também para Estamina (verde), Mana (roxa) e Sanidade (cinza), além da Vida (amarela). Custos e perdas saem primeiro da reserva temporária.
- **Vontade** passa a somar Autocontrole por padrão (fichas que ainda estavam com Núcleo, o padrão antigo, são atualizadas sozinhas).

## Novidades da 0.5.1

- Corrigido: ao atacar com um alvo marcado, o dano ia para o atacante (o token selecionado) e somava o resultado do acerto. O cartão de ataque agora tem o botão **Aplicar dano**, que tira só o valor do dano dos alvos marcados no momento do ataque (primeiro da vida temporária). Se ninguém estava marcado, marque o alvo e clique no botão. Em alvos que não são seus, quem aplica é o Mestre, pelo mesmo botão.
- As opções de dano do menu do chat do D&D 5e não aparecem mais nos cartões da ficha EPM, porque eram elas que somavam acerto e dano.

## Novidades da 0.5.0

- **Conectar personagem e Relação múltipla:** a lista de personagens tem imagens pequenas e rola, dá para marcar vários sem a janela quebrar.
- **Painéis recolhíveis:** todo painel grande (Perícias, Atributos, Condições, categorias do inventário, seções de habilidades…) tem uma seta no título para fechar e abrir. Fica salvo para o seu usuário, em todas as fichas.
- **Perícias favoritas:** estrela em cada perícia e a opção "Favoritas no topo", que coloca as marcadas acima das outras.
- **Habilidades em sub-abas:** Geral (como antes), Arquétipo e Classe. As duas últimas só usam Passiva e Comum. Passivas agora vêm primeiro. "Nova habilidade" cria na sub-aba aberta.
- **Aba Arquétipo e Classe (opcional):** liga em Personalizar → Ordem das abas → "mostrar". Tem as sub-abas Arquétipo e Classe, cada uma com anotações próprias e as mesmas habilidades das sub-abas de Habilidades (o que se cria em um lugar aparece no outro).
- **Moedas** com a arte nova.
- **Artífice** entre os arquétipos sugeridos.


## Novidades da 0.4.0

Esta versão junta o que tinha sido feito entre a 0.2.5 e a 0.3.0 (refeito a partir da 0.2.4) com o patch note novo.

### Patch note

- **Idiomas na aba Sobre.** O painel para adicionar e remover idiomas saiu de Condições e foi para Sobre (modo edição). Eles continuam aparecendo na caixa Idiomas da Principal.
- **Polyglot.** Com o módulo Polyglot ativo, a lista de idiomas é a dele; sem ele, é a do D&D 5e. Os idiomas ficam no campo nativo do personagem (`system.traits.languages`), então o Polyglot já reconhece no chat. Um idioma digitado que não está na lista fica como personalizado. Idiomas das versões antigas são migrados sozinhos.
- **Ordem das abas.** No modo edição, segure e arraste as abas da barra lateral. A aba Personalizar também tem a lista com setas e "Restaurar ordem".
- **Relações.** "Conectar personagem" abre a lista de atores (com busca), ou arraste um ator da barra lateral. Nome e imagem vêm da ficha do parceiro e se atualizam sozinhos. A afinidade vai de −5 a +5 e, conforme sobe, revela partes do background do parceiro; cada jogador escolhe em Sobre → "Quem vê seu background" a afinidade que libera cada parte (ou "Nunca"). A relação pode ser criada nas duas fichas ao mesmo tempo.
- **Relação múltipla (Mestre).** Um personagem ou NPC muda a afinidade com vários atores de uma vez (por exemplo, +1 com o grupo inteiro), criando a relação onde ela ainda não existe.
- **Lista de Bênçãos e Maldições.** "Adicionar da lista" mostra as 100 bênçãos e 100 maldições do sistema, separadas por natureza (Divina, Caótica, Memética) e raridade (Boa, Épica, Lendária), com busca e as regras gerais. Na ficha cada uma tem frequência (livre, 1/turno, 1/combate, 1/dia, 1/semana, única), duração em turnos, botões Usar, Encerrar e Recarregar e cartão no chat. Parte dos efeitos é automática: bônus em atributos, resistências, imunidades, PV ao usar ou ao terminar, custo extra de magias, metade do dinheiro recebido, bloqueios, dano contínuo etc.
- **Lista de Condições.** 131 condições (43 básicas e 88 do sistema) em 10 categorias, cada uma com ícone próprio, busca e filtro "Só ativas". Uma condição pode causar outra (aparece como automática), 26 combinações têm efeito próprio (Molhado + Enregelado → Congelado, por exemplo), há dano no início do turno, Insano rola a tabela, e as restrições de descanso e recuperação entram sozinhas. Os efeitos aparecem na Principal ao lado de cada atributo e perícia.
- **Inventário.** Itens ganham efeitos: bônus ou penalidade em qualquer número da ficha (CA, deslocamento, atributo, perícia, acerto, dano…), redução de dano (RD), resistência, imunidade, vulnerabilidade, vantagem, desvantagem, cura (ao usar ou ao acertar) e dano extra. Armas e proteções valem quando equipadas; consumíveis, ao usar. As **Mochilas** ficam no topo como um segundo inventário: arraste itens para dentro, tire pelo botão e veja peso e capacidade. A ordem das categorias muda arrastando o título ou pelas setas (modo edição).
- **Personalizar.** Aba nova, só no modo edição: roda de cores para escolher a cor base da ficha, traço de brilho, campo de cor em hex e 7 cores prontas. A cor vale também para as janelas de habilidades e magias do personagem.

### Recuperado da 0.2.5 à 0.3.0

- **Moedas:** Cobre, Prata, Ouro, Platina e **Dracmas** (1 Dracma = 1.000 Platinas), com imagens. As antigas Joias de Kan viram Dracmas sozinhas.
- **Exaustão 1 a 6:** Leve, Moderada, Grave, Crítica, Colapso e Morte, sem dias de coma. O nível 6 pede confirmação e marca o personagem como morto.
- **Aviso de ficha padrão:** se os personagens estiverem abrindo a ficha do D&D 5e, o Mestre recebe um aviso com o botão "Usar a Ficha EPM".

### Mudanças de dados

- As condições Amedrontado, Queimando e Eletrocutado viraram Apavorado, Em Chamas e Eletrizado; tokens e fichas antigos são atualizados ao abrir.
- A ficha migra os dados para a versão 3 na primeira abertura (moedas, idiomas, condições renomeadas).

## Novidades da 0.2.4

- Corrigido: a ficha não abria (erro "Failed to render template part sobre ... reading 'hash'"). Os templates chamavam sem querer o helper `editor` do Foundry; agora todos os campos são lidos com `this.`, o que também evita conflito com helpers de outros módulos.

## Novidades da 0.2.3

- Modo de segurança: se algo der errado ao abrir uma ficha, ela abre mesmo assim e mostra a mensagem de erro no topo. Itens que não puderem ser lidos ficam escondidos e listados na aba Principal.

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

- **Principal:** PEv, PT e PH; condições (com as automáticas, combinações e a lista de penalidades e bloqueios), resistências e RD, idiomas; atributos e perícias com as penalidades marcadas; progressão.
- **Combate:** CA, deslocamento e iniciativa já com penalidades, defesas, turno (ações bloqueadas por condições), exaustão, descansos, ataques e bônus de cena.
- **Inventário:** carteira com Cobre, Prata, Ouro, Platina e Dracmas (receber, pagar com troco automático, consolidar), mochilas, filtro por raridade e categorias Armas, Consumíveis, Armaduras, Ferramentas e Loot, na ordem que o dono quiser. Dentro de cada categoria, favoritos vêm primeiro e o resto é agrupado por raridade (Comum, Rara, Épica, Lendária, Mítica, Arcaica).
- **Habilidades:** seções Comum, Rara, Épica, Lendária, Única e Passivas, com contador do limite de cada raridade.
- **Magias:** sub-abas Truques e 1º a 6º Círculo.
- **Sobre:** traços (idade, altura, olhos…), Tema, aparência, idiomas, Marca, quem vê o background e textos longos (história, personalidade…).
- **Anotações:** páginas criadas pelo jogador, cada uma de texto livre ou mapa mental.
- **Condições:** as 131 condições por categoria, combinações, exaustão e listas de resistências, vulnerabilidades e imunidades.
- **Bênçãos:** bênçãos e maldições da lista ou criadas à mão, com interruptor, usos e modificadores que entram nos números da ficha.
- **Relações:** personagens conectados, afinidade e o background liberado de cada um.
- **Personalizar** (modo edição): cor da ficha e ordem das abas.

## Regras automatizadas

- Atributos: 16 pontos + 1 a cada nível par; avisos das regras do nível 1 (máximo 3, um atributo em 4 se dois ficarem em 1).
- Perícias: 50 pontos + 15 a cada 5 níveis; limite de 5 por perícia, +5 a cada 5 níveis.
- Subir de nível cobra 2 × (novo nível − 1) PEv e lista o que foi ganho; conversões 5 PT → 1 PH e 2 PEv → 1 PH (Shift converte tudo).
- Criar ou aprender habilidades e magias cobra PH conforme a raridade e confere os limites (Épica 4, Lendária 3, Única 2). Arrastar uma habilidade ou magia de um compêndio pergunta se é "aprender".
- Melhorias com PT seguem a tabela do sistema: dano é somado à fórmula, troca de ação muda a forma e o teto de dano e de efeitos da raridade é conferido antes de cobrar.
- Formas: uma habilidade ou magia pode ter vários modos, cada um com ação, custo (PM, PE, PV ou PS), teste, dano e requisitos. Ao usar, o jogador escolhe a forma, o custo é descontado e um cartão vai para o chat com botões de rolagem.
- Condições: Lento corta o deslocamento pela metade, Preso zera o deslocamento e bloqueia formas com requisito gestual ou de movimento, Silenciado bloqueia o verbal, Envenenado dá desvantagem em testes, e assim por diante. Imunidade com o mesmo nome da condição anula o efeito. Uma penalidade de atributo vinda da mesma condição conta uma vez só em cada perícia.
- Condições que causam dano no início do turno abrem uma janela no botão Novo turno (com opção de rolar ou pular quando o texto diz "pode"); Insano rola a tabela de comportamento.
- Descansos respeitam as condições e maldições que impedem recuperar PV, PM ou PE, recuperam pela metade ou proíbem o descanso curto.
- Bênçãos de 1/turno recarregam no Novo turno, as de 1/combate no fim do combate e as de 1/dia no descanso longo; durações em turnos contam sozinhas.
- Efeitos de itens: o bônus aparece no nome do item e entra nos números; cura de arma aparece como botão no cartão do ataque.
- Exaustão 1 a 6: 1 desvantagem em testes, ataques e dano; 2 −5 em testes e na Defesa; 3 sem Ação Bônus e Reação e deslocamento pela metade; 4 só uma ação por turno; 5 Colapso (incapacitado e inconsciente); 6 morte.
- Defesas: Esquiva (CA + Acrobacia), Bloqueio (CA + Fortitude) e Contra-ataque (CA + Luta); cada uso conta uma ação do próximo turno, descontada no botão Novo turno.
- Testes: 1d20 + valor (configurável). Shift rola com vantagem, Ctrl com desvantagem; desvantagens de condições e exaustão entram sozinhas. A iniciativa da ficha e a do Combat Tracker usam a perícia Iniciativa.
- Recursos no cabeçalho aceitam `+5` e `-3` para somar ou tirar.

## Personalização

Quase tudo que é regra ou rótulo está em `scripts/config.mjs`: nomes dos recursos (trocar "Esforço" por "Estamina", por exemplo), lista inicial de perícias, condições e seus efeitos, raridades, custos, moedas, tabela de melhorias.

A lista de perícias também pode ser editada dentro da ficha (lápis no painel Perícias). O Mestre pode salvá-la como padrão do mundo; fichas antigas recebem as que faltam com "Trazer do padrão".

Fórmulas aceitam `@atr.forca`, `@atr.nucleo`, `@per.luta`, `@nivel`, `@ca` e `@cd`.

Itens com Active Effects podem mexer nos números da ficha usando chaves como `flags.epm-ficha.mods.atributos.forca`, `flags.epm-ficha.mods.pericias.luta`, `flags.epm-ficha.mods.recursos.pm`, `flags.epm-ficha.mods.ca` ou `flags.epm-ficha.mods.deslocamento` (modo Adicionar).

## Opções do módulo

Em **Configurar opções → Escolhidos pelo Multiverso: Ficha**:

- Condições no HUD do token (só EPM ou junto com as do D&D 5e) e se o HUD mostra só as 43 básicas ou todas as 131.
- Só o Mestre muda a afinidade (desligado por padrão: jogadores e Mestre mudam com qualquer um, no modo edição).
- Conectar relações nas duas fichas (ligado por padrão).
- Avisar se a ficha padrão não for a EPM.
- Limites de raridade separados ou somados e bloqueio de limites para jogadores.
- Dado dos testes e marcação automática de ações em combate.

Para o Mestre, numa macro de script: `game.modules.get("epm-ficha").api.relacaoMultipla()` abre a Relação múltipla sem precisar abrir uma ficha.

## Publicar uma nova versão

1. Faça commit das mudanças.
2. Crie uma release no GitHub com a tag `vX.Y.Z` (por exemplo `v0.4.0`).
3. A ação `.github/workflows/release.yml` gera `module.zip` e `module.json` com a versão e anexa os dois à release. O Foundry passa a oferecer a atualização.

## Créditos

- Fonte Cormorant Garamond (SIL Open Font License, ver `fonts/OFL.txt`).
- Ícones de condição do [game-icons.net](https://game-icons.net). Icons made by Lorc, Delapouite, Sbed, Skoll, PriorBlue, Carl Olsen and Cathelineau under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), and by Zeromancer under CC0. A lista de qual ícone é de quem está em `assets/condicoes/CREDITOS.md`.
- Imagens das moedas: arte da autora do sistema.
