# Escolhidos pelo Multiverso: Ficha

Ficha de personagem do sistema **Escolhidos pelo Multiverso (EPM)** para o Foundry VTT v13 com o sistema dnd5e 5.x.

O módulo registra uma ficha própria para personagens do dnd5e. Os dados do EPM ficam nas flags do ator (`flags.epm-ficha`); a Vida usa o campo nativo do dnd5e, então a barra do token e a aplicação de dano continuam funcionando.

## Instalação

No Foundry: **Módulos complementares → Instalar módulo → URL do manifesto**:

```
https://github.com/KaTsUr1369/epm-ficha/releases/latest/download/module.json
```

Ative o módulo no mundo. A ficha EPM vira a ficha padrão de personagens; para trocar uma ficha específica, use o botão de configuração da ficha (ícone de engrenagem no topo).

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
- Perícias: 45 pontos + 15 a cada 5 níveis; limite de 5 por perícia, +5 a cada 5 níveis.
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
