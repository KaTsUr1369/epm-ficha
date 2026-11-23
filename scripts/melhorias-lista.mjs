/**
 * Melhorias de itens (0.8.21): só dados, sem Foundry. Fonte: EPM/itens/melhorias-itens.md.
 *
 * Cada melhoria: { id, chave, nome, tipo, listas[], texto | beneficio + custo, so?, alvo?, pre?, auto?, escolha? }
 * - tipo: modificacao, encantamento, maldicao, bencao.
 * - listas: em que listas aparece (geral, armas-cac, armas-disparo, armas-fogo, municao, protecoes, escudos, vestimentas,
 *   consumiveis-cura, consumiveis-ofensivos, ferramentas, focos, aventura, mochilas). As com pré-requisito usam `alvo`.
 * - chave: identidade para "sem repetição" (a mesma melhoria em duas listas conta como uma).
 * - pre: { m: [ids] (qualquer uma), modo: "consome" | "mantem", prop, material, portador: { atributo, pericia, arquetipo, favorita, sanidadeMax },
 *   feito, maldicoes, bencao, titulos }.
 * - auto: efeitos automáticos (veja `melhorias.mjs`).
 * - escolha: o que se escolhe ao fazer ("tipoDano", "elemento", "pericia", "texto").
 */

export const TIPOS_MELHORIA = {
  modificacao: { label: "Modificação", plural: "Modificações", vagas: 3, titulo: "Item Refinado", icone: "fa-solid fa-screwdriver-wrench", teto: 2 },
  encantamento: { label: "Encantamento", plural: "Encantamentos", vagas: 2, vagasPergaminho: 3, titulo: "Item Arcano", icone: "fa-solid fa-wand-sparkles", teto: 5 },
  maldicao: { label: "Maldição", plural: "Maldições", vagas: 3, titulo: "Objeto Amaldiçoado", icone: "fa-solid fa-skull", teto: 10 },
  bencao: { label: "Bênção", plural: "Bênçãos", vagas: 2, titulo: "Objeto Divino", icone: "fa-solid fa-sun", teto: 25 }
};

export const LISTAS_MELHORIA = {
  geral: "Geral", "armas-cac": "Armas corpo a corpo", "armas-disparo": "Armas de disparo", "armas-fogo": "Armas de fogo e energia",
  municao: "Munição", protecoes: "Proteções", escudos: "Só escudos", vestimentas: "Vestimentas e acessórios",
  "consumiveis-cura": "Consumíveis (cura)", "consumiveis-ofensivos": "Consumíveis (ofensivos)", ferramentas: "Ferramentas e kits",
  focos: "Focos e instrumentos", aventura: "Equipamento de aventura", mochilas: "Mochilas e recipientes"
};

/** Alvos das melhorias com pré-requisito ("Item" na tabela). */
export const ALVOS_MELHORIA = {
  qualquer: "Qualquer item", arma: "Arma", "arma-cac": "Arma corpo a corpo", "arma-disparo": "Arma de disparo",
  "arma-fogo": "Arma de fogo e energia", "disparo-ou-fogo": "Arma de disparo ou de fogo e energia", "arma-nomeada": "Arma nomeada",
  "item-nomeado": "Item nomeado", protecao: "Proteção", armadura: "Armadura", "armadura-media-pesada": "Armadura média ou pesada",
  "armadura-pesada": "Armadura pesada", "pesada-ou-escudo-pesado": "Armadura pesada ou escudo pesado", "escudo-leve": "Escudo leve",
  vestimenta: "Vestimenta", "vestimenta-olhos": "Vestimenta (máscara, óculos, capuz, visor)", foco: "Foco", grimorio: "Grimório",
  consumivel: "Consumível", "consumivel-cura": "Consumível de cura", "pocao-vida": "Poção de Vida", ferramenta: "Ferramenta", mochila: "Mochila"
};

/** Listas de cada categoria do catálogo (seção 6). null = matéria-prima, não recebe melhorias. */
export const LISTAS_POR_CATEGORIA = {
  armaduras: ["geral", "protecoes"], escudos: ["geral", "protecoes", "escudos"], vestimentas: ["geral", "vestimentas"],
  municao: ["municao"], pocoes: ["consumiveis-cura"], medicina: ["consumiveis-cura"], comida: ["consumiveis-cura"],
  arremesso: ["consumiveis-ofensivos"], venenos: ["consumiveis-ofensivos"], ferramentas: ["geral", "ferramentas"],
  aventura: ["geral", "aventura"], recipientes: ["geral", "mochilas"],
  minerios: null, especiais: null, gemas: null, recursos: null, ervas: null, criaturas: null
};
/** Itens de Conjuração e música que são focos (o resto é componente: Consumíveis de cura). */
export const FOCOS_CONJURACAO = /foco|varinha|orbe|grim[oó]rio|livro de runas|s[ií]mbolo sagrado|cajado|bast[aã]o/i;

/** Preço da vaga em PO (comprar). A 3ª de Encantamento é o Pergaminho (20.000 PO) + imbuir. */
export const PRECO_VAGA = { modificacao: [200, 800, 3000], encantamento: [1000, 4000, 20000] };
/** DT da vaga ao fazer. */
export const DT_VAGA = { modificacao: [35, 50, 70], encantamento: [30, 45, 70] };
/** Horas de trabalho (em 3 etapas). */
export const HORAS_MELHORIA = { modificacao: 8, encantamento: 24 };
export const LOJA_ARMAS = 1.5;
export const ETAPAS_MELHORIA = 3;
export const PERGAMINHO = { identificar: { pericia: "conhecimentosmagicos", dt: 35 }, imbuir: { pericia: "arcanismo", dt: 70 }, catalogo: "conjuracao.pergaminho-de-encantamento" };

/* -------------------------------------------- */
/*  Materiais (seção 8)                         */
/* -------------------------------------------- */

/** arma / protecao / outros: { texto, auto }. `catalogo`: id do material no catálogo (preço). */
export const MATERIAIS = {
  "prata-lunar": { nome: "Prata Lunar", raridade: "rara", catalogo: "especiais.prata-lunar",
    arma: { texto: "Ignora a resistência e a meia imunidade de mortos-vivos, licantropos e demônios" },
    protecao: { texto: "RD 3 contra dano dessas criaturas" } },
  "ferro-frio": { nome: "Ferro Frio", raridade: "rara", catalogo: "especiais.ferro-frio",
    arma: { texto: "+1d6 de dano contra fadas e criaturas feitas de magia", auto: { danoExtra: [{ formula: "1d6", tipo: "", contra: "fadas e criaturas de magia" }] } },
    protecao: { texto: "RD 3 contra dano de fadas e criaturas feitas de magia" } },
  "ferro-negro": { nome: "Ferro Negro", raridade: "rara", catalogo: "especiais.ferro-negro",
    arma: { texto: "+1d4 Necrótico e ganha Corrosiva", auto: { danoExtra: [{ formula: "1d4", tipo: "Necrótico" }], props: ["Corrosiva"] } },
    protecao: { texto: "RD 5 contra Necrótico", auto: { rd: [[5, "Necrótico"]] } } },
  mitral: { nome: "Mitral", raridade: "rara", catalogo: "especiais.mitral",
    arma: { texto: "Pesa metade e ganha Acuidade", auto: { peso: 0.5, props: ["Acuidade"] } },
    protecao: { texto: "Pesa metade, −2 na penalidade de Furtividade e sem penalidade de deslocamento", auto: { peso: 0.5, furtividadeMenos: 2, semPenalDesloc: true } },
    outros: { texto: "Pesa metade", auto: { peso: 0.5 } } },
  "madeira-elfica": { nome: "Madeira Élfica", raridade: "rara", catalogo: "especiais.madeira-elfica",
    arma: { texto: "Arcos e cajados: pesam metade e +1 no acerto", auto: { peso: 0.5, acerto: 1 } },
    protecao: { texto: "Escudos de madeira: pesam metade e +1 na CA", auto: { peso: 0.5, ca: 1 } },
    outros: { texto: "Pesa metade", auto: { peso: 0.5 } } },
  "cristal-de-nucleo": { nome: "Cristal de Núcleo", raridade: "rara", catalogo: "especiais.cristal-de-nucleo",
    arma: { texto: "Guarda até 10 PM, que o portador pode gastar", auto: { reservaPm: 10 } },
    protecao: { texto: "Guarda até 10 PM, que o portador pode gastar", auto: { reservaPm: 10 } },
    outros: { texto: "Guarda até 10 PM, que o portador pode gastar", auto: { reservaPm: 10 } } },
  "liga-balistica": { nome: "Liga Balística", raridade: "rara", catalogo: "especiais.liga-balistica",
    protecao: { texto: "RD 5 contra Balístico", auto: { rd: [[5, "Balístico"]] } } },
  "fibra-de-carbono": { nome: "Fibra de Carbono", raridade: "rara", catalogo: "especiais.fibra-de-carbono-militar",
    arma: { texto: "Pesa metade", auto: { peso: 0.5 } }, protecao: { texto: "Pesa metade", auto: { peso: 0.5 } }, outros: { texto: "Pesa metade", auto: { peso: 0.5 } } },
  adamante: { nome: "Adamante", raridade: "epica", catalogo: "especiais.adamante",
    arma: { texto: "Ganha Anti-Blindagem e ignora 5 de RD", auto: { props: ["Anti-Blindagem"], ignoraRd: 5 } },
    protecao: { texto: "RD 5 contra dano Físico", auto: { rd: [[5, "Físico"]] } },
    outros: { texto: "Inquebrável por meios comuns" } },
  oricalco: { nome: "Oricalco", raridade: "epica", catalogo: "especiais.oricalco",
    arma: { texto: "Conta como Foco Arcano; −2 no custo de uma magia ou habilidade que a use" },
    protecao: { texto: "Conta como Foco Arcano; −2 no custo de uma magia ou habilidade que a use" },
    outros: { texto: "Conta como Foco Arcano; −2 no custo de uma magia ou habilidade que a use" } },
  "osso-de-dragao": { nome: "Osso de Dragão", raridade: "epica", catalogo: "especiais.osso-de-dragao", escolha: "elemento",
    arma: { texto: "+1d6 do elemento do dragão", auto: { danoExtra: [{ formula: "1d6", tipo: "@escolha" }] } },
    protecao: { texto: "Resistência ao elemento do dragão", auto: { resist: ["@escolha"] } } },
  "nanoliga-reativa": { nome: "Nanoliga Reativa", raridade: "epica", catalogo: "especiais.nanoliga-reativa",
    arma: { texto: "Ganha Penetração", auto: { props: ["Penetração"] } },
    protecao: { texto: "RD 5 contra todo dano de Energia", auto: { rd: [[5, "Energia"]] } } },
  "ferro-estelar": { nome: "Ferro Estelar", raridade: "lendaria", catalogo: "especiais.ferro-estelar",
    arma: { texto: "O dano sobe uma categoria (Normal → Verdadeiro)", auto: { categoria: 1 } } },
  "fragmento-do-vazio": { nome: "Fragmento do Vazio", raridade: "mitica", catalogo: "especiais.fragmento-do-vazio",
    arma: { texto: "O Mestre decide o efeito. Quem carrega recebe 1 de Corrupção por dia" },
    protecao: { texto: "O Mestre decide o efeito. Quem carrega recebe 1 de Corrupção por dia" },
    outros: { texto: "O Mestre decide o efeito. Quem carrega recebe 1 de Corrupção por dia" } }
};
/** Armaduras e escudos pesados gastam 2 unidades do material. */
export const MATERIAL_UNIDADES_PESADO = 2;

/* -------------------------------------------- */
/*  Listas                                      */
/* -------------------------------------------- */

const slug = t => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\[.*?\]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ARMAS = ["armas-cac", "armas-disparo", "armas-fogo"];
const PROT = ["protecoes"];
const CONS = ["consumiveis-cura", "consumiveis-ofensivos"];

/** [nome, texto, listas, extra] por tipo. extra: { auto, pre, alvo, so, escolha, chave } */
const M = [
  // Geral
  ["Leve", "O item pesa metade", ["geral"], { auto: { peso: 0.5 } }],
  ["Furtiva", "Vantagem em teste para esconder o item e pesa −1", ["geral", "armas-cac", "armas-disparo", "armas-fogo"], { auto: { pesoMenos: 1 } }],
  ["Rápida", "Pode sacá-lo com ação livre", ["geral", "armas-cac", "armas-disparo", "armas-fogo"]],
  ["Durável", "Não quebra com uso comum; testes para quebrá-lo ou danificá-lo têm desvantagem", ["geral"]],
  ["Ornamentada", "+2 em testes sociais com quem vê e valoriza o item", ["geral"]],
  ["Selada", "À prova d'água e de poeira: funciona molhado ou submerso", ["geral"]],
  // Armas corpo a corpo
  ["Afiada", "+2 em rolagens de dano", ["armas-cac"], { auto: { dano: 2 } }],
  ["Balanceada", "+2 em teste de ataque", ["armas-cac"], { auto: { acerto: 2 } }],
  ["Injetora", "Aplica efeito preparado (de poção)", ["armas-cac", "municao"]],
  ["Sintonizada", "Diminui em 2 o custo de UMA habilidade ativa que use armas corpo a corpo", ["armas-cac"], { chave: "sintonizada-cac", escolha: "texto" }],
  ["Perigosa", "+1 em margem de ameaça", ["armas-cac"], { auto: { margem: 1 } }],
  // Armas de disparo
  ["Leve", "+2 em teste de ataque", ["armas-disparo"], { chave: "leve-disparo", id: "leve-disparo", auto: { acerto: 2 } }],
  ["Letal", "+2 em rolagens de dano", ["armas-disparo"], { auto: { dano: 2 } }],
  ["Potente", "Aumenta o alcance em um passo", ["armas-disparo"], { chave: "potente-disparo", id: "potente-disparo", auto: { alcance: 1 } }],
  ["Sintonizada", "Diminui em 2 o custo de UMA habilidade ativa que use armas de disparo", ["armas-disparo"], { chave: "sintonizada-disparo", id: "sintonizada-disparo", escolha: "texto" }],
  ["Red dot", "+1 em margem de ameaça", ["armas-disparo"], { chave: "red-dot-disparo", id: "red-dot-disparo", auto: { margem: 1 } }],
  // Armas de fogo e energia
  ["Mira aprimorada", "+2 em teste de ataque", ["armas-fogo"], { auto: { acerto: 2 } }],
  ["Bruta", "+1 dado do mesmo tipo", ["armas-fogo"], { auto: { dados: 1 } }],
  ["Mira Telescópica", "Aumenta o alcance em um passo", ["armas-fogo"], { auto: { alcance: 1 } }],
  ["Silenciador", "Não recebe penalidade por tentar se esconder depois de atirar", ["armas-fogo"]],
  ["Red dot", "+2 em margem de ameaça", ["armas-fogo"], { chave: "red-dot-fogo", id: "red-dot-fogo", auto: { margem: 2 } }],
  ["Visão de calor", "Ignora Camuflagem", ["armas-fogo"]],
  ["Compensador", "Anula a penalidade por rajada", ["armas-fogo"]],
  ["Ferrolho automático", "A arma se torna automática", ["armas-fogo"], { auto: { props: ["Automática"] } }],
  // Munição
  ["Expansiva", "+1 no multiplicador de crítico", ["municao"], { auto: { mult: 1 } }],
  ["Explosiva", "Aumenta o dano em 2d6", ["municao"], { auto: { danoExtra: [{ formula: "2d6", tipo: "" }] } }],
  // Proteções
  ["Reforçada", "+2 na CA (soma com a propriedade Reforçada)", PROT, { auto: { ca: 2 } }],
  ["Ajustada", "Reduz em 1,5 m a penalidade de deslocamento da armadura", PROT, { auto: { penalDesloc: 1.5 } }],
  ["Abafada", "Anula a penalidade e a desvantagem em Furtividade da armadura", PROT, { auto: { semPenalFurtividade: true } }],
  ["Revestida", "RD 2 contra 1 tipo de dano Físico, Natural ou Tecnológico, escolhido ao fazer", PROT, { escolha: "tipoDano", auto: { rd: [[2, "@escolha"]] } }],
  ["Cravejada", "Quem acerta você corpo a corpo sofre 1d6 Perfurante", PROT],
  ["Compartimentos", "4 objetos pequenos à mão; sacar um deles não gasta ação", PROT],
  ["Isolada", "Ignora frio ou calor extremo (escolhido ao fazer)", PROT, { escolha: "texto" }],
  // Só escudos
  ["Borda de Combate", "O escudo também é arma: 1d6 Contundente ou Cortante, Leve", ["escudos"]],
  ["Empunhadura Firme", "+2 em Bloqueio", ["escudos"], { auto: { mods: { "defesa.bloqueio": 2 } } }],
  ["Alça de Antebraço", "Preso ao antebraço: a mão fica livre para segurar objetos leves", ["escudos"]],
  // Vestimentas
  ["Bolsos Ocultos", "Esconde até 3 objetos pequenos; achá-los pede Investigação DT 20", ["vestimentas"]],
  ["Sob Medida", "+2 em testes sociais em que a aparência conta", ["vestimentas"]],
  ["Térmica", "Ignora frio ou calor extremo (escolhido ao fazer)", ["vestimentas"], { escolha: "texto" }],
  ["Camuflada", "+2 em Furtividade em um tipo de ambiente, escolhido ao fazer", ["vestimentas"], { escolha: "texto" }],
  ["Reversível", "Com uma Ação Padrão, vira outra roupa: +2 nos testes para se disfarçar", ["vestimentas"]],
  // Consumíveis
  ["Concentrada", "+1 dado do mesmo tipo na cura ou no dano (2d8 + 4 → 3d8 + 4)", CONS, { auto: { consDados: 1 } }],
  ["Dose Rápida", "Usar custa Ação Bônus em vez de Ação Padrão", ["consumiveis-cura"]],
  ["Duradoura", "Durações em rodadas, minutos ou horas dobram; \"pela cena\" passa a valer por 1 hora", CONS],
  ["Discreta", "Sem cor, cheiro nem sabor: notar pede Percepção ou Medicina DT 25; vantagem para esconder", CONS],
  ["Potente", "+2 na DT para resistir", ["consumiveis-ofensivos"], { chave: "potente-consumivel", id: "potente-consumivel" }],
  ["Ampliada", "+1,5 m no raio ou no cone", ["consumiveis-ofensivos"], { chave: "ampliada-consumivel", id: "ampliada-consumivel" }],
  ["Aderente", "O veneno aplicado na arma vale para 2 acertos", ["consumiveis-ofensivos"], { so: "venenos" }],
  ["Retardada", "Explode quando você quiser, até 1 minuto depois, ou por um gatilho simples (pisar, abrir)", ["consumiveis-ofensivos"], { so: "bombas" }],
  // Ferramentas
  ["Precisa", "+2 nos testes feitos com a ferramenta", ["ferramentas"], { auto: { testeFerramenta: 2 } }],
  ["De Cinto", "Presa ao corpo: pegar e guardar não gasta ação", ["ferramentas"]],
  ["Ágil", "A tarefa feita com ela leva metade do tempo", ["ferramentas"]],
  ["Ampliada", "Kits com usos ganham +2 usos", ["ferramentas"], { chave: "ampliada-ferramenta", id: "ampliada-ferramenta" }],
  ["Multiuso", "Também serve como uma segunda ferramenta, escolhida ao fazer", ["ferramentas"], { chave: "multiuso-ferramenta", id: "multiuso-ferramenta", escolha: "texto" }],
  // Focos
  ["Acoplado", "Preso a uma arma, escudo, luva ou braço: usá-lo não ocupa a mão", ["focos"]],
  ["Lapidado", "+2 no acerto de magias lançadas com ele", ["focos"], { auto: { acertoMagia: 2 } }],
  ["Ressonante", "+2 na CD das magias lançadas com ele", ["focos"], { auto: { cdMagia: 2 } }],
  ["Sintonizado", "Diminui em 2 o custo de UMA magia ou habilidade, escolhida ao fazer", ["focos"], { escolha: "texto" }],
  ["Afinado", "Instrumento: +2 em Performance e nos efeitos de música", ["focos"], { auto: { mods: { "pericia.performance": 2 } } }],
  // Aventura
  ["Aprimorada", "Dobra o alcance de luz, som, visão ou sinal", ["aventura"]],
  ["Autonomia", "Dura o dobro com o mesmo combustível, óleo, pilha ou bateria", ["aventura"]],
  ["Multiuso", "Junta dois itens de aventura num só (corda com gancho, lanterna com apito)", ["aventura"], { chave: "multiuso-aventura", id: "multiuso-aventura", escolha: "texto" }],
  // Mochilas
  ["Compartimentada", "1 vez por turno, tirar dela um item pequeno não gasta ação", ["mochilas"]],
  ["Ampliada", "+50% de capacidade", ["mochilas"], { chave: "ampliada-mochila", id: "ampliada-mochila", auto: { capacidade: 1.5 } }],
  ["Fundo Falso", "Esconde até 2 kg; achar pede Investigação DT 25", ["mochilas"]],
  ["Alças Ajustadas", "O peso de dentro conta 25% a menos na sua carga", ["mochilas"], { auto: { pesoDentro: 0.75 } }],
  ["Trancada", "Fechadura embutida: abrir sem a chave pede Crime DT 20", ["mochilas"]],
  // Com pré-requisito
  ["Serrilhada", "+2 em rolagens de dano; no crítico, o alvo fica Sangrando", [], { alvo: "arma-cac", pre: { m: ["afiada"], modo: "consome" }, auto: { dano: 2 } }],
  ["Contrapeso", "+2 em teste de ataque e +2 em Contra-ataque", [], { alvo: "arma-cac", pre: { m: ["balanceada"], modo: "consome" }, auto: { acerto: 2, mods: { "defesa.contra": 2 } } }],
  ["Brutal", "+2 em rolagens de dano e ignora 2 de RD", [], { alvo: "arma", pre: { prop: "Pesada", portador: { atributo: ["forca", 5] } }, auto: { dano: 2, ignoraRd: 2 } }],
  ["Fio de Duelista", "+1 em margem de ameaça e +2 em Contra-ataque", [], { alvo: "arma", pre: { prop: "Acuidade", portador: { atributo: ["destreza", 5] } }, auto: { margem: 1, mods: { "defesa.contra": 2 } } }],
  ["Tensionada", "Alcance +1 passo e o disparo ignora 2 de RD", [], { alvo: "arma-disparo", pre: { m: ["potente-disparo"], modo: "consome" }, auto: { alcance: 1, ignoraRd: 2 } }],
  ["Gatilho Fino", "+2 em teste de ataque e ignora meia cobertura", [], { alvo: "disparo-ou-fogo", pre: { m: ["leve-disparo", "mira-aprimorada"], modo: "consome" }, auto: { acerto: 2 } }],
  ["Estabilizada", "Alcance +1 passo; se você não se moveu no turno, +2 em rolagens de dano", [], { alvo: "arma-fogo", pre: { m: ["mira-telescopica"], modo: "consome" }, auto: { alcance: 1, danoParado: 2 } }],
  ["Desmontável", "Desmonta em peças que não parecem arma (montar ou desmontar: Ação de Movimento); vantagem para escondê-la e pesa −1", [], { alvo: "arma", pre: { m: ["furtiva"], modo: "consome" }, auto: { pesoMenos: 1 } }],
  ["Saque Relâmpago", "Saca com ação livre; +2 na iniciativa enquanto o item estiver à mão (não soma com outro Saque Relâmpago)", [], { alvo: "qualquer", pre: { m: ["rapida"], modo: "consome" }, auto: { iniciativaUnica: 2 } }],
  ["Placas Sobrepostas", "+2 na CA e RD 2 contra dano Físico", [], { alvo: "armadura-media-pesada", pre: { m: ["reforcada"], modo: "consome" }, auto: { ca: 2, rd: [[2, "Físico"]] } }],
  ["Encaixe Perfeito", "Anula a penalidade de deslocamento da armadura", [], { alvo: "armadura", pre: { m: ["ajustada"], modo: "consome" }, auto: { semPenalDesloc: true } }],
  ["Broquel de Duelo", "+2 em Bloqueio e +2 em Contra-ataque", [], { alvo: "escudo-leve", pre: { m: ["empunhadura-firme"], modo: "consome" }, auto: { mods: { "defesa.bloqueio": 2, "defesa.contra": 2 } } }],
  ["Prisma", "+2 no acerto de magias; magias de ataque ignoram meia cobertura", [], { alvo: "foco", pre: { m: ["lapidado"], modo: "consome" }, auto: { acertoMagia: 2, notaMagia: "magias de ataque ignoram meia cobertura." } }],
  ["Fórmula Própria", "+1 dado do mesmo tipo e +2 no valor fixo (2d8 + 4 → 3d8 + 6)", [], { alvo: "consumivel", pre: { m: ["concentrada"], modo: "consome", portador: { pericia: ["oficio", 10] }, quemPrepara: true }, auto: { consDados: 1, consFixo: 2 } }],
  ["Bancada Portátil", "A tarefa leva um terço do tempo", [], { alvo: "ferramenta", pre: { m: ["agil"], modo: "consome", portador: { pericia: ["oficio", 10] } } }],
  ["Mochila de Expedição", "+100% de capacidade", [], { alvo: "mochila", pre: { m: ["ampliada-mochila"], modo: "consome" }, auto: { capacidade: 2 } }]
];

const E = [
  // Geral
  ["Vinculada", "Com Ação Bônus, o item voa para a sua mão de até 30 m (com caminho livre). Você sempre sabe a direção e a distância dele", ["geral"]],
  ["Inquebrável", "Não quebra nem é destruído por meios comuns, só por efeitos Lendários ou de entidades", ["geral"]],
  ["Luminosa", "Emite luz de 6 m; liga e desliga com ação livre", ["geral"]],
  ["Pluma", "O item não pesa nada", ["geral"], { auto: { peso: 0 } }],
  ["Autorreparo", "Conserta sozinho danos e quebras em 1 hora", ["geral"]],
  ["Disfarçada", "Parece um objeto comum à sua escolha (uma espada vira bengala); notar pede Investigação DT 25 ou detectar magia", ["geral"], { escolha: "texto" }],
  ["Canalizada", "Pode armazenar e lançar 1 magia, conhecida ou não (para imbuir, precisa conhecê-la de alguma forma; para lançar, não). Fora de uma arma, o item serve de foco para essa magia", ["geral", ...ARMAS], { escolha: "texto" }],
  // Armas
  ["Vampírica", "Causa sangramento cumulativo (1d4 por acerto). +1d12 de vida temporária em crítico", ARMAS, { auto: { nota: "Acerto: Sangrando 1d4 (acumula). Crítico: +1d12 de vida temporária." } }],
  ["Cruel", "Causa +15 de dano (do mesmo tipo) em acertos críticos. Exceção ao teto", ARMAS, { auto: { danoCritico: 15 } }],
  ["Defensiva", "+3 na CA enquanto empunha a arma", ARMAS, { auto: { ca: 3 } }],
  ["Envenenada", "Ao atacar com a arma, pode gastar 10 de Mana para envenenar o alvo (1d12 por 3 turnos)", ARMAS, { auto: { nota: "Pode gastar 10 PM: alvo Envenenado (1d12 por 3 turnos)." } }],
  ["Instintiva", "Persegue o alvo, ignorando camuflagem leve e total. +1 categoria de alcance em armas de longa distância", ARMAS, { auto: { alcance: 1 } }],
  ["Elemental", "+1d8 de dano de 1 elemento (exceto Necrótico e Radiante). Com +3 PM, vira 2d6 do mesmo elemento", [...ARMAS, "municao"], { escolha: "elemento", auto: { danoExtra: [{ formula: "1d8", tipo: "@escolha" }], nota: "Com +3 PM: o dano elemental vira 2d6." } }],
  ["Bumerangue", "Ganha a propriedade Arremessável; se já tinha, aumenta o alcance em 1 passo. No fim do ataque a arma volta; pegá-la gasta a sua Reação", ARMAS, { auto: { props: ["Arremessável"] } }],
  ["Sagrada", "+2d6 de dano Radiante", [...ARMAS, "municao"], { auto: { danoExtra: [{ formula: "2d6", tipo: "Radiante" }] } }],
  ["Profana", "+2d6 de dano Necrótico", [...ARMAS, "municao"], { auto: { danoExtra: [{ formula: "2d6", tipo: "Necrótico" }] } }],
  ["Drenante", "1 vez por turno, ao acertar, recupera 1d4 de Mana", ARMAS, { auto: { cura: [{ formula: "1d4", recurso: "pm" }] } }],
  ["Impactante", "No crítico, o alvo faz Fortitude DT 15 ou fica Caído e é empurrado 3 m", ARMAS, { auto: { nota: "Crítico: Fortitude DT 15 ou Caído e empurrado 3 m." } }],
  // Proteções
  ["Fortificada", "+3 na CA", PROT, { auto: { ca: 3 } }],
  ["Guardiã", "+3 em Fortitude, Reflexos e Vontade", PROT, { chave: "guardia-protecao", id: "guardia-protecao", auto: { mods: { "pericia.fortitude": 3, "pericia.reflexos": 3, "pericia.vontade": 3 } } }],
  ["Resistência Elemental", "RD 5 contra 1 tipo de dano Natural ou Mágico (exceto Necrótico e Radiante). Como Reação, gaste 3 PM: Resistência a esse tipo (metade do dano) até o início do seu próximo turno", PROT, { escolha: "elemento", auto: { rd: [[5, "@escolha"]] } }],
  ["Santificada", "RD 5 contra Necrótico; mortos-vivos e demônios que acertam você corpo a corpo sofrem 1d6 Radiante", PROT, { auto: { rd: [[5, "Necrótico"]] } }],
  ["Profanada", "RD 5 contra Radiante; criaturas sagradas que acertam você corpo a corpo sofrem 1d6 Necrótico", PROT, { auto: { rd: [[5, "Radiante"]] } }],
  ["Refletora", "1 vez por cena, quando uma magia de alvo único acerta você, gaste 10 PM (Reação): você sofre metade e o conjurador sofre a outra metade", PROT],
  ["Ilusória", "O primeiro ataque contra você em cada cena tem desvantagem", PROT],
  ["Vital", "No início de cada turno em combate, recupera 2 de Vida", PROT, { auto: { curaTurno: "2" } }],
  ["Espinhos Arcanos", "Quem acerta você corpo a corpo sofre 1d8 de Força", PROT],
  // Só escudos
  ["Defletora", "+5 na CA contra ataques à distância e magias de ataque", ["escudos"]],
  ["Muralha", "1 vez por cena, com Ação Bônus: aliados adjacentes ganham +3 na CA até o seu próximo turno", ["escudos"]],
  // Vestimentas
  ["Andarilha", "+1,5 m de deslocamento; não se cansa em marchas de até 12 h", ["vestimentas"], { auto: { mods: { deslocamento: 1.5 } } }],
  ["Sombria", "+5 em Furtividade na penumbra e no escuro", ["vestimentas"]],
  ["Carismática", "+5 em uma perícia de Carisma ou Aparência, escolhida ao encantar", ["vestimentas"], { escolha: "pericia", auto: { periciaEscolhida: 5 } }],
  ["Anfíbia", "Respira debaixo d'água e nada com o deslocamento normal", ["vestimentas"]],
  ["Olhos da Noite", "Máscaras, óculos, capuzes e visores: enxerga no escuro até 18 m", ["vestimentas"]],
  ["Aracnídea", "Escala paredes e tetos com o deslocamento normal, sem teste", ["vestimentas"]],
  ["Poliglota", "Entende e fala um idioma, escolhido ao encantar", ["vestimentas"], { escolha: "texto" }],
  // Consumíveis
  ["Purificadora", "Também remove Envenenado, Enfermo ou Sangrando (uma delas)", ["consumiveis-cura"]],
  ["Transbordante", "O que passar do máximo vira recurso temporário (até 10)", ["consumiveis-cura"]],
  ["Partilhada", "Ao usar, um aliado a até 3 m recebe metade da recuperação", ["consumiveis-cura"]],
  ["Elemental", "Troca o tipo de dano por um elemento escolhido (exceto Necrótico e Radiante)", ["consumiveis-ofensivos"], { chave: "elemental-consumivel", id: "elemental-consumivel", escolha: "elemento" }],
  ["Arcana", "O dano conta como mágico e ignora RD que não seja mágica", ["consumiveis-ofensivos"]],
  // Ferramentas
  ["Mestra", "+5 nos testes feitos com a ferramenta", ["ferramentas"], { auto: { testeFerramenta: 5 } }],
  ["Animada", "Trabalha sozinha até 4 h por dia, sem você. Conta como horas de trabalho para fabricar ou consertar; o teste continua sendo seu", ["ferramentas"], { chave: "animada-ferramenta", id: "animada-ferramenta" }],
  ["Restauradora", "Kits que curam ou consertam recuperam +1d6 por uso", ["ferramentas"]],
  ["Inesgotável", "Kits com usos recuperam 1 uso a cada descanso longo", ["ferramentas"], { chave: "inesgotavel-ferramenta", id: "inesgotavel-ferramenta" }],
  ["Reveladora", "Com 1 minuto examinando um item, descobre as Modificações e os Encantamentos dele. Maldições e Bênçãos pedem Conhecimentos Mágicos DT 25", ["ferramentas"]],
  // Focos
  ["Amplificador", "1 vez por turno, +2d6 no dano de uma magia lançada com ele", ["focos"], { auto: { notaMagia: "1×/turno: +2d6 no dano desta magia." } }],
  ["Reservatório", "Guarda até 20 PM. Enche fora de combate, pagando 1 PM seu para cada 1 PM guardado", ["focos"], { auto: { reservaPm: 20 } }],
  ["Longínquo", "O alcance das magias lançadas com ele sobe 1 passo", ["focos"]],
  ["Afinidade Elemental", "Escolha 1 tipo de dano: magias desse tipo ganham +1 dado do mesmo tipo", ["focos"], { escolha: "elemento", auto: { notaMagia: "magias do tipo escolhido: +1 dado do mesmo tipo." } }],
  ["Sussurro", "Magias lançadas com ele não precisam de componente verbal", ["focos"]],
  ["Hipnótico", "Instrumento: +3 na CD das músicas e dos efeitos de Trovador", ["focos"], { auto: { notaMagia: "músicas e efeitos de Trovador: +3 na CD." } }],
  // Aventura
  ["Inesgotável", "Não gasta combustível, óleo, pilha nem bateria", ["aventura"], { chave: "inesgotavel-aventura", id: "inesgotavel-aventura" }],
  ["Animada", "Cordas, correntes e redes obedecem a comandos simples: amarrar, soltar, subir até 15 m", ["aventura"], { chave: "animada-aventura", id: "animada-aventura" }],
  ["Vigia", "Avisa o dono, mesmo dormindo, quando uma criatura hostil chega a 9 m", ["aventura"]],
  ["Ecoante", "Aparelhos de visão e de comunicação: alcance ×10, e funcionam sem rede nem sinal", ["aventura"]],
  // Mochilas
  ["Dimensional", "Capacidade dobrada, e o que está dentro não pesa", ["mochilas"], { auto: { capacidade: 2, pesoDentro: 0 } }],
  ["Preservadora", "Comida e poções dentro não estragam; o conteúdo não sofre com fogo, água ou frio", ["mochilas"]],
  ["Guardiã", "Só o dono abre. Quem mais tentar sofre 2d6 de Força, e o dono sente na hora", ["mochilas"], { chave: "guardia-mochila", id: "guardia-mochila" }],
  // Com pré-requisito
  ["Tempestade Elemental", "+2d6 de um elemento (exceto Necrótico e Radiante). Com +5 PM, vira 3d6 e o alvo faz Fortitude DT 15 ou sofre a condição do elemento (Em Chamas, Lento, Eletrizado, Surdo, Envenenado…)", [], { alvo: "arma", escolha: "elemento", pre: { m: ["elemental"], modo: "consome" }, auto: { danoExtra: [{ formula: "2d6", tipo: "@escolha" }], nota: "Com +5 PM: vira 3d6 e o alvo faz Fortitude DT 15 ou sofre a condição do elemento." } }],
  ["Ricochete", "Ganha Arremessável. Ao voltar, acerta um segundo alvo a até 3 m do primeiro (metade do dano); pegá-la não gasta Reação", [], { alvo: "arma", pre: { m: ["bumerangue"], modo: "consome" }, auto: { props: ["Arremessável"], nota: "Ao voltar: acerta um 2º alvo a até 3 m (metade do dano)." } }],
  ["Sentinela", "1 vez por rodada, quando um inimigo entra no seu alcance, você pode atacá-lo como Reação", [], { alvo: "arma-cac", pre: { m: ["defensiva"], modo: "mantem" } }],
  ["Juramentada", "+3 em teste de ataque e +3 em rolagens de dano; com outro portador, não funciona", [], { alvo: "arma", pre: { portador: { favorita: true } }, auto: { acerto: 3, dano: 3 } }],
  ["Lâmina Lunar", "+2d6 Radiante contra mortos-vivos, licantropos e demônios; brilha quando um deles está a até 18 m", [], { alvo: "arma", pre: { material: "prata-lunar" }, auto: { danoExtra: [{ formula: "2d6", tipo: "Radiante", contra: "mortos-vivos, licantropos e demônios" }] } }],
  ["Munição Infinita", "Não gasta munição comum: cria a própria (sem melhorias). Munições especiais continuam sendo gastas", [], { alvo: "disparo-ou-fogo", pre: { material: "cristal-de-nucleo" } }],
  ["Fortaleza", "+5 na CA; aliados adjacentes ganham +2 na CA", [], { alvo: "pesada-ou-escudo-pesado", pre: { m: ["fortificada"], modo: "consome" }, auto: { ca: 5 } }],
  ["Espelho Arcano", "Funciona 2 vezes por cena; a metade refletida vai para o conjurador ou para outro alvo a até 9 m", [], { alvo: "protecao", pre: { m: ["refletora"], modo: "consome" } }],
  ["Escamas do Dragão", "Resistência ao elemento em todas as categorias de dano (não só Normal) e RD 5 contra ele", [], { alvo: "protecao", pre: { material: "osso-de-dragao", m: ["resistencia-elemental"], modo: "consome" }, auto: { rd: [[5, "@material"]], resist: ["@material"] } }],
  ["Sombra Viva", "+5 em Furtividade na penumbra e no escuro; na escuridão total, fica Invisível com Ação Bônus até se mover ou atacar", [], { alvo: "vestimenta", pre: { m: ["sombria"], modo: "consome", portador: { pericia: ["furtividade", 10] } } }],
  ["Grimório Vivo", "Guarda 1 magia a mais, além do limite de magias conhecidas (até Épica). Sem o grimório, a magia some até recuperá-lo", [], { alvo: "grimorio", pre: { portador: { arquetipo: "conjurador" } } }],
  ["Âncora de Alma", "Volta para a sua mão de qualquer distância (no mesmo plano) com Ação Bônus; se for destruído, se refaz em 1 dia", [], { alvo: "qualquer", pre: { m: ["vinculada"], modo: "consome" } }],
  ["Ferramenta Viva", "Trabalha sozinha até 8 h por dia", [], { alvo: "ferramenta", pre: { m: ["animada-ferramenta"], modo: "consome" } }],
  ["Bolsa sem Fundo", "Capacidade ×5, o que está dentro não pesa, e tirar um item é ação livre (1 por turno)", [], { alvo: "mochila", pre: { m: ["dimensional"], modo: "consome" }, auto: { capacidade: 5, pesoDentro: 0 } }],
  ["Elixir Coletivo", "Todos os aliados a até 3 m recebem metade da recuperação", [], { alvo: "consumivel-cura", pre: { m: ["partilhada"], modo: "consome" } }],
  ["Sol Portátil", "Luz de 18 m; na luz, mortos-vivos e criaturas das sombras têm −3 nos ataques", [], { alvo: "qualquer", pre: { m: ["luminosa"], modo: "consome" } }]
];

/** Maldições: [nome, benefício, custo, listas, extra]. */
const MA = [
  ["Sussurrante", "+10 em Percepção", "−5 de Sanidade por dia de uso", ["geral"], { auto: { mods: { "pericia.percepcao": 10 } } }],
  ["Grudada", "Ninguém tira o item de você contra a sua vontade (desarmar, roubar); se perdido, volta ao amanhecer", "Você não consegue largá-lo nem usar outro item do mesmo tipo", ["geral"]],
  ["Agourenta", "1 vez por cena, rerrola um d20 seu e fica com o novo resultado", "1 vez por sessão, o Mestre faz você rerrolar um 20 natural", ["geral"]],
  ["Gananciosa", "+5 em todos os testes feitos com o item", "Todo amanhecer, o item come 10 PO × seu nível. Sem pagar, as outras melhorias param até você pagar o dobro", ["geral"], { auto: { acertoItem: 5 } }],
  ["Sedenta", "+2d8 Necrótico", "Perde 1d6 de Vida em cada turno em que não acertar", ARMAS, { auto: { danoExtra: [{ formula: "2d8", tipo: "Necrótico" }], custoNota: "Se não acertar neste turno: perde 1d6 de Vida." } }],
  ["Ciumenta", "+5 no acerto", "Só larga a arma com Autocontrole DT 20", ARMAS, { auto: { acerto: 5 } }],
  ["Faminta de Mana", "O dano da arma sobe 1 passo de dado (d8 → d10)", "Cada ataque custa 5 PM ou 1d6 de Vida", ARMAS, { auto: { passo: 1, custoNota: "Este ataque custa 5 PM ou 1d6 de Vida." } }],
  ["Sanguinária", "+2 de dano por inimigo derrubado na cena (máximo +10)", "Não pode recuar nem fugir enquanto houver inimigo de pé (Autocontrole DT 20 para resistir)", ARMAS, { auto: { nota: "+2 de dano por inimigo derrubado na cena (máx. +10): some no campo de dano extra." } }],
  ["Traiçoeira", "+3 em margem de ameaça", "Com 1 natural no ataque, você acerta a si mesmo ou o aliado mais próximo", ARMAS, { auto: { margem: 3, custoNota: "Com 1 natural: acerta você mesmo ou o aliado mais próximo." } }],
  ["Penitente", "+5 na CA", "No fim de cada combate em que foi acertado, perde 5 de Sanidade", PROT, { auto: { ca: 5 } }],
  ["Enraizada", "RD 5 contra todo dano", "−3 m de deslocamento, sem Disparada; tirar a armadura exige um descanso longo", PROT, { auto: { rd: [[5, ""]], custo: { mods: { deslocamento: -3 } } } }],
  ["Vingativa", "Quem acerta você corpo a corpo sofre 3d6 Necrótico", "Você sofre 1d6 Necrótico cada vez que isso acontece", PROT],
  ["Máscara de Outro", "+10 para se disfarçar e imitar vozes", "A cada dia de uso, Vontade DT 15 ou perde 3 de Sanidade", ["vestimentas"]],
  ["Vaidosa", "+5 em testes sociais", "−5 em Furtividade; com a roupa suja ou rasgada, o bônus vira −5", ["vestimentas"], { auto: { mods: { "pericia.diplomacia": 5, "pericia.labia": 5, "pericia.lideranca": 5, "pericia.intimidacao": 5 }, custo: { mods: { "pericia.furtividade": -5 } } } }],
  ["Viciante", "+2 dados na recuperação", "Ao usar, Autocontrole DT 15. Se falhar, −2 em todos os testes até usar outra dose ou fazer um descanso longo", ["consumiveis-cura"], { auto: { consDados: 2, custoNota: "Ao usar: Autocontrole DT 15; se falhar, −2 em todos os testes até outra dose ou descanso longo." } }],
  ["Instável", "+3 dados de dano na bomba", "Com 1 natural no arremesso, explode no seu espaço", ["consumiveis-ofensivos"], { so: "bombas", auto: { consDados: 3 } }],
  ["Obsessiva", "+10 nos testes feitos com a ferramenta", "Não consegue parar um trabalho começado (Autocontrole DT 20 para parar)", ["ferramentas"], { auto: { testeFerramenta: 10 } }],
  ["Foco de Sangue", "Pode pagar o custo das magias com Vida (2 PV = 1 PM)", "Só recupera metade dos PM no descanso longo", ["focos"]],
  ["Voz do Abismo", "+5 na CD das magias", "Cada magia que não seja truque custa 2 de Sanidade", ["focos"], { auto: { cdMagia: 5, custoMagia: "a magia (se não for truque) custa 2 de Sanidade." } }],
  ["Farol Maldito", "Luzes: revelam criaturas invisíveis e ilusões no alcance da luz", "Criaturas hostis a até 1 km sabem onde a luz está", ["aventura"]],
  ["Boca Faminta", "Capacidade ×3", "1 vez por dia, some um item comum aleatório de dentro", ["mochilas"], { auto: { capacidade: 3 } }],
  // Com pré-requisito
  ["Massacre", "O bônus numérico também é critável: no crítico, os bônus fixos multiplicam junto com os dados", "Reduz todos os dados de dano da arma em 1 passo (d12 → d10 → d8 → d6 → d4)", [], { alvo: "arma", pre: { m: ["cruel"], modo: "consome" }, auto: { massacre: true, custo: { passo: -1 } } }],
  ["Hemofagia", "Sangramento cumulativo de 1d8 por acerto; você recupera Vida igual ao sangramento que causar (até 10 por turno)", "Curas que não venham da arma recuperam metade", [], { alvo: "arma", pre: { m: ["vampirica"], modo: "consome" }, auto: { nota: "Acerto: Sangrando 1d8 (acumula); recupera Vida igual ao sangramento (até 10 por turno)." } }],
  ["Peçonha Viva", "Todo acerto envenena, sem gastar Mana: 2d6 Venenoso por 3 turnos (não acumula; renova a duração)", "Desvantagem em testes contra venenos; perde as resistências a Venenoso", [], { alvo: "arma", pre: { m: ["envenenada"], modo: "consome" }, auto: { nota: "Acerto: Envenenado 2d6 por 3 turnos (renova)." } }],
  ["Cataclismo", "+3d6 do elemento; 1 vez por turno, ao acertar, explode em 3 m: quem estiver em volta (aliados também) sofre metade desse dano", "Você sofre 1d6 do elemento em cada turno em que atacar com ela", [], { alvo: "arma", escolha: "elemento", pre: { m: ["elemental", "tempestade-elemental"], modo: "consome" }, auto: { danoExtra: [{ formula: "3d6", tipo: "@escolha" }], nota: "1×/turno: explode em 3 m (metade desse dano em quem estiver em volta).", custoNota: "Você sofre 1d6 do elemento neste turno." } }],
  ["Profanação", "+3d6 Necrótico; ao derrubar um inimigo, recupera 1d10 de Vida", "Suas Bênçãos Divinas ficam suspensas enquanto a arma estiver com você", [], { alvo: "arma", pre: { m: ["sagrada"], modo: "consome" }, auto: { danoExtra: [{ formula: "3d6", tipo: "Necrótico" }] } }],
  ["Sede Saciada", "+3d8 Necrótico; não perde mais Vida por turno", "Perde 1d6 de Vida máxima por dia sem matar (volta quando matar)", [], { alvo: "arma", pre: { m: ["sedenta"], modo: "consome", feito: "50 criaturas mortas com a arma" }, auto: { danoExtra: [{ formula: "3d8", tipo: "Necrótico" }] } }],
  ["Coração de Ferro", "RD 10 contra todo dano", "−3 m de deslocamento, sem Disparada, afunda na água; tirar a armadura exige um descanso longo", [], { alvo: "armadura-pesada", pre: { m: ["enraizada"], modo: "consome" }, auto: { rd: [[10, ""]], custo: { mods: { deslocamento: -3 } } } }],
  ["Simbionte", "O item vira parte do seu corpo: não pode ser tirado, roubado nem desarmado; +5 em todos os testes feitos com ele", "Se o item for destruído, você perde 10 de Vida máxima para sempre", [], { alvo: "qualquer", pre: { m: ["grudada"], modo: "consome" }, auto: { acertoItem: 5 } }],
  ["Abismo Faminto", "+8 na CD; as magias causam +2d8 Psíquico", "Cada magia custa 3 de Sanidade; abaixo de 25 de Sanidade, fica Insano até um descanso longo", [], { alvo: "foco", pre: { m: ["voz-do-abismo"], modo: "consome", portador: { sanidadeMax: 50 } }, auto: { cdMagia: 8, notaMagia: "a magia causa +2d8 Psíquico.", custoMagia: "a magia custa 3 de Sanidade; abaixo de 25, Insano até um descanso longo." } }],
  ["Arma Senciente", "+8 em todos os testes feitos com ela; 1 vez por rodada, ela ataca sozinha como Reação", "Tem vontade própria: 1 vez por sessão o Mestre faz ela recusar uma ação (Autocontrole DT 25 para obrigar), e ela pede um favor por semana", [], { alvo: "arma-nomeada", pre: { maldicoes: 2 }, auto: { acertoItem: 8 } }],
  ["Bênção Caída", "O efeito da bênção continua, e o item ganha +5 em todos os testes. A vaga de Bênção fica selada", "O deus da bênção vira seu inimigo: suas Bênçãos Divinas ficam suspensas e você tem −5 em testes contra efeitos sagrados", [], { alvo: "qualquer", pre: { bencao: 1, modo: "consome" }, auto: { acertoItem: 5, selaBencao: true } }],
  ["Fome do Vazio", "+10 em um tipo de teste, escolhido ao receber", "+2 de Corrupção por dia (em vez de 1)", [], { alvo: "qualquer", escolha: "pericia", pre: { material: "fragmento-do-vazio" }, auto: { periciaEscolhida: 10 } }]
];

const B = [
  ["Pureza Divina", "Anula o lado negativo de todas as maldições do item, mantendo o lado positivo", ["geral"], { auto: { pureza: true } }],
  ["Protetiva", "+3 na CA para cada item com essa bênção no inventário (limite +12 CA) e +5 em testes de resistência (não cumulativo)", ["geral"], { auto: { protetiva: true } }],
  ["Inviolável", "Só o dono e quem ele permitir usam o item. Nas mãos de outro, pesa 10× e queima 4d6 Radiante por turno", ["geral"]],
  ["Relíquia", "+5 em todos os testes feitos com o item; 1 vez por dia, rola de novo um deles e fica com o melhor", ["geral"], { auto: { acertoItem: 5 } }],
  ["Ensinamento da Guerra", "Ao tirar 20 natural, o dano é maximizado", ARMAS, { id: "ensinamento", chave: "ensinamento", auto: { maxNo20: true } }],
  ["Golpe Divino", "1 vez por cena, um ataque que acertou vira crítico", ARMAS],
  ["Égide", "1 vez por cena, como Reação, anula todo o dano de um ataque", PROT],
  ["Graça Imaculada", "Imune a uma condição, escolhida ao receber a bênção: Apavorado, Envenenado, Sangrando, Atordoado ou Em Chamas", PROT, { escolha: "condicao" }],
  ["Manto do Peregrino", "Não sente fome, sede, nem frio ou calor naturais", ["vestimentas"]],
  ["Ambrosia", "A recuperação é sempre o máximo dos dados", CONS, { auto: { consMax: true } }],
  ["Cálice sem Fundo", "1 vez por dia, a dose não é gasta", CONS],
  ["Mão do Criador", "+10 nos testes feitos com a ferramenta; 1 vez por semana, um deles vira 20 natural", ["ferramentas"], { auto: { testeFerramenta: 10 } }],
  ["Voz Divina", "+5 no acerto e na CD das magias lançadas com o foco; 1 vez por dia, uma delas não gasta PM", ["focos"], { auto: { acertoMagia: 5, cdMagia: 5, notaMagia: "1×/dia, uma magia não gasta PM." } }],
  ["Luz da Verdade", "Luzes: ilusões se desfazem na luz, e ninguém nela mente sem passar em Vontade DT 20", ["aventura"]],
  ["Provisão Divina", "Todo amanhecer aparecem dentro 1 ração e água para 1 dia", ["mochilas"]],
  // Com pré-requisito
  ["Lâmina do Juízo", "+3d8 Radiante; contra mortos-vivos e demônios, todo o dano da arma é maximizado", [], { alvo: "arma", pre: { m: ["sagrada"], modo: "consome" }, auto: { danoExtra: [{ formula: "3d8", tipo: "Radiante" }], nota: "Contra mortos-vivos e demônios: todo o dano é maximizado." } }],
  ["Avatar da Guerra", "+2 em margem de ameaça; o dano maximizado vale em qualquer crítico, não só no 20 natural", [], { alvo: "arma", pre: { m: ["ensinamento"], modo: "mantem", portador: { pericia: [["luta", "pontaria"], 20] } }, auto: { margem: 2, maxNoCritico: true } }],
  ["Égide Eterna", "2 vezes por cena, como Reação, anula todo o dano de um ataque contra você ou contra um aliado a até 9 m", [], { alvo: "protecao", pre: { m: ["egide"], modo: "consome" } }],
  ["Armadura do Escolhido", "+8 na CA; 1 vez por dia, quando cairia a 0 de Vida, fica com 1", [], { alvo: "armadura", pre: { m: ["fortificada", "fortaleza"], modo: "consome", feito: "cair a 0 de Vida usando a armadura e se levantar na mesma cena" }, auto: { ca: 8 } }],
  ["Olhos do Vigia", "Enxerga no escuro, mágico também, até 36 m; +25 em Percepção para notar emboscadas, criaturas invisíveis e ilusões", [], { alvo: "vestimenta-olhos", pre: { m: ["olhos-da-noite"], modo: "consome" } }],
  ["Forja dos Deuses", "+20 em testes de Ofício feitos com ela; 1 vez por item, uma Modificação feita com ela não conta no limite de 3", [], { alvo: "ferramenta", pre: { m: ["mestra"], modo: "consome", portador: { pericia: ["oficio", 15] } }, auto: { testeFerramenta: 20, forjaDosDeuses: true } }],
  ["Fonte Viva", "Guarda até 50 PM e se enche sozinha com 10 PM por hora", [], { alvo: "foco", pre: { m: ["reservatorio"], modo: "consome", portador: { arquetipo: "conjurador" } }, auto: { reservaPm: 50 } }],
  ["Sopro de Vida", "Cura máxima; usada em quem morreu há até 1 minuto, traz a pessoa de volta com 1 de Vida", [], { alvo: "pocao-vida", pre: { m: ["ambrosia"], modo: "consome" }, auto: { consMax: true } }],
  ["Celeiro Divino", "Todo amanhecer, comida e água para até 6 pessoas; 1 vez por semana, aparece uma Poção de Vida Média", [], { alvo: "mochila", pre: { m: ["provisao-divina"], modo: "consome", mTambem: ["preservadora"] } }],
  ["Coroa de Glória", "+10 em todos os testes feitos com o item; ele não pode ser destruído, nem por entidades", [], { alvo: "item-nomeado", pre: { titulos: 2 }, auto: { acertoItem: 10 } }]
];

function montar(tipo, linhas, maldicao = false) {
  return linhas.map(l => {
    const [nome, a, b, c, d] = l;
    const [texto, custo, listas, extra = {}] = maldicao ? [a, b, c, d] : [a, null, b, c];
    const id = extra.id ?? slug(nome);
    return {
      id, chave: extra.chave ?? id, nome, tipo, listas, ...(maldicao ? { beneficio: texto, custo } : { texto }),
      ...(extra.alvo ? { alvo: extra.alvo } : {}), ...(extra.so ? { so: extra.so } : {}), ...(extra.escolha ? { escolha: extra.escolha } : {}),
      ...(extra.pre ? { pre: extra.pre } : {}), ...(extra.auto ? { auto: extra.auto } : {})
    };
  });
}

/** Modificação Material Especial (ocupa 1 vaga de Modificação; o efeito vem de MATERIAIS). */
const MATERIAL = { id: "material-especial", chave: "material-especial", nome: "Material Especial", tipo: "modificacao",
  listas: ["geral", "armas-cac", "armas-disparo", "municao"], texto: "Conforme a tabela de Materiais", escolha: "material" };

export const MELHORIAS_ITEM = [
  ...montar("modificacao", M), MATERIAL,
  ...montar("encantamento", E),
  ...montar("maldicao", MA, true),
  ...montar("bencao", B)
];

const POR_TIPO_ID = new Map(MELHORIAS_ITEM.map(m => [`${m.tipo}:${m.id}`, m]));
/** Melhoria pelo tipo e id ("encantamento", "elemental"). Sem tipo: a primeira com o id. */
export function melhoriaPorId(id, tipo = "") {
  if (tipo) return POR_TIPO_ID.get(`${tipo}:${id}`) ?? null;
  return MELHORIAS_ITEM.find(m => m.id === id) ?? null;
}
/** Texto de uma melhoria (Maldição: benefício e custo). */
export function textoMelhoria(m) {
  if (!m) return "";
  return m.custo ? `${m.beneficio}. Custo: ${m.custo}` : m.texto;
}
