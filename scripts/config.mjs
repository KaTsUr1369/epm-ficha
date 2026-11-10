/**
 * Escolhidos pelo Multiverso — configuração do sistema.
 * Tudo que é "regra" ou "rótulo" mora aqui: para renomear algo (ex.: Esforço → Estamina),
 * adicionar uma condição ou mudar um limite, edite este arquivo.
 */

export const MODULE_ID = "epm-ficha";
/** Escopo das flags onde os dados da ficha ficam guardados (actor.flags["epm-ficha"]). */
export const FLAG = "epm-ficha";
export const CAMINHO = `modules/${MODULE_ID}/templates`;

export const ATRIBUTOS = {
  forca:        { label: "Força",        abrev: "FOR", grupo: "fisicos" },
  destreza:     { label: "Destreza",     abrev: "DES", grupo: "fisicos" },
  constituicao: { label: "Constituição", abrev: "CON", grupo: "fisicos" },
  aparencia:    { label: "Aparência",    abrev: "APA", grupo: "sociais" },
  carisma:      { label: "Carisma",      abrev: "CAR", grupo: "sociais" },
  inteligencia: { label: "Inteligência", abrev: "INT", grupo: "mentais" },
  autocontrole: { label: "Autocontrole", abrev: "AUT", grupo: "mentais" },
  nucleo:       { label: "Núcleo",       abrev: "NUC", grupo: "mistico" }
};

export const GRUPOS_ATRIBUTO = {
  fisicos: "Físicos",
  sociais: "Sociais",
  mentais: "Mentais",
  mistico: "Místico"
};

/**
 * Lista oficial de perícias: [id, nome, atributos possíveis].
 * O primeiro atributo é o somado por padrão; na ficha (modo edição) o jogador escolhe
 * qual usar e pode somar mais de um. Ofício não tem atributo fixo.
 * "Vig" (Vigor) foi lido como Constituição.
 */
export const PERICIAS_PADRAO = [
  ["acrobacia", "Acrobacia", ["destreza"]],
  ["adestramento", "Adestramento", ["carisma", "inteligencia"]],
  ["arcanismo", "Arcanismo", ["nucleo"]],
  ["atletismo", "Atletismo", ["forca"]],
  ["ciencia", "Ciência", ["inteligencia"]],
  ["conhecimentosmagicos", "Conhecimentos Mágicos", ["nucleo", "inteligencia"]],
  ["crime", "Crime", ["destreza", "inteligencia"]],
  ["diplomacia", "Diplomacia", ["carisma"]],
  ["empatia", "Empatia", ["carisma"]],
  ["fortitude", "Fortitude", ["constituicao"]],
  ["furtividade", "Furtividade", ["destreza", "inteligencia"]],
  ["historia", "História", ["inteligencia"]],
  ["intimidacao", "Intimidação", ["carisma", "nucleo"]],
  ["intuicao", "Intuição", ["inteligencia"]],
  ["investigacao", "Investigação", ["inteligencia"]],
  ["labia", "Lábia", ["carisma"]],
  ["lideranca", "Liderança", ["carisma", "inteligencia"]],
  ["linguistica", "Linguística", ["carisma", "inteligencia"]],
  ["luta", "Luta", ["destreza", "forca"]],
  ["medicina", "Medicina", ["inteligencia"]],
  ["oficio", "Ofício", []],
  ["percepcao", "Percepção", ["inteligencia"]],
  ["performance", "Performance", ["carisma"]],
  ["pilotagem", "Pilotagem", ["destreza", "inteligencia"]],
  ["pontaria", "Pontaria", ["destreza"]],
  ["psicologia", "Psicologia", ["carisma", "inteligencia"]],
  ["religiao", "Religião", ["inteligencia"]],
  ["sobrevivencia", "Sobrevivência", ["inteligencia"]],
  ["tecnologia", "Tecnologia", ["inteligencia"]],
  ["vontade", "Vontade", ["nucleo"]]
];

/** Perícias da lista provisória da versão 0.1 (removidas na migração se estiverem zeradas). */
export const PERICIAS_OBSOLETAS = ["atuacao", "canalizacao", "conhecimento", "disfarce", "enganacao", "iniciativa", "ladinagem", "misticismo", "reflexos", "seducao"];

/** Recursos. PV usa o campo nativo do dnd5e (barra do token funciona); os demais ficam nas flags. */
export const RECURSOS = {
  pv: { label: "Vida",     abrev: "PV", cor: "#D2544A" },
  pm: { label: "Mana",     abrev: "PM", cor: "#4C8EE0" },
  pe: { label: "Estamina", abrev: "PE", cor: "#E3A13A" },
  ps: { label: "Sanidade", abrev: "PS", cor: "#A47DDB" }
};

export const REGRAS = {
  atributosIniciais: 16,      // pontos para distribuir
  atributoMaxInicial: 3,      // máximo por atributo no nível 1
  atributoExcecao: 4,         // um atributo pode ir a 4 se dois ficarem em −1
  atributoMinimoExcecao: -1,
  periciasIniciais: 45,
  periciasPorMarco: 15,       // a cada 5 níveis
  periciaLimiteInicial: 5,
  periciaMarcosLimite: [15, 35], // níveis em que o limite por perícia sobe
  periciaAumentoLimite: 5,
  nivelMaxArquetipo: 50,
  nivelMaxTotal: 100,
  ptPorPh: 5,                 // 5 PT = 1 PH
  pevPorPh: 2,                // 2 PEv = 1 PH
  ptPorTreino: 5,             // treino durante descanso
  sanidadeInicial: 100,
  maxDefesasPorRodada: 3
};

/** Custo em PEv para subir o Arquétipo para `novoNivel`: 2 × (novo nível − 1). */
export const custoNivel = (novoNivel) => 2 * (novoNivel - 1);

export const ARQUETIPOS_SUGERIDOS = ["Combatente", "Conjurador"];

/* -------------------------------------------- */
/*  Raridades                                   */
/* -------------------------------------------- */

/** Raridades de itens (inventário). */
export const RARIDADES_ITEM = {
  comum:    { label: "Comum",    cor: "#AEB4AE", ordem: 1 },
  rara:     { label: "Rara",     cor: "#4F9FE0", ordem: 2 },
  epica:    { label: "Épica",    cor: "#A86BE3", ordem: 3 },
  lendaria: { label: "Lendária", cor: "#E58A2A", ordem: 4 },
  mitica:   { label: "Mítica",   cor: "#E2465F", ordem: 5 },
  arcaica:  { label: "Arcaica",  cor: "#3ED1B9", ordem: 6 }
};

/** Conversão da raridade nativa do dnd5e quando o item ainda não tem raridade EPM. */
export const RARIDADE_DND5E = {
  common: "comum", uncommon: "rara", rare: "epica",
  veryRare: "lendaria", legendary: "mitica", artifact: "arcaica"
};

/** Raridades de habilidades e magias, com limites, custos em PH e teto de poder. */
export const RARIDADES_PODER = {
  comum:    { label: "Comum",    cor: "#AEB4AE", ordem: 1, limite: null, criar: 5,  aprender: 3,  danoMax: "2d6",       efeitos: 1 },
  rara:     { label: "Rara",     cor: "#4F9FE0", ordem: 2, limite: null, criar: 10, aprender: 5,  danoMax: "3d8",       efeitos: 2 },
  epica:    { label: "Épica",    cor: "#A86BE3", ordem: 3, limite: 4,    criar: 20, aprender: 10, danoMax: "4d10",      efeitos: 3 },
  lendaria: { label: "Lendária", cor: "#E58A2A", ordem: 4, limite: 3,    criar: 35, aprender: 18, danoMax: "4d12 + 15", efeitos: 4 },
  unica:    { label: "Única",    cor: "#F0CF62", ordem: 5, limite: 2,    criar: 50, aprender: 25, danoMax: "5d12 + 20", efeitos: 5 }
};

export const ORIGENS_HABILIDADE = {
  arquetipo: "Arquétipo",
  classe: "Classe",
  raca: "Raça",
  arma: "Arma",
  geral: "Geral",
  customizada: "Customizada"
};

export const CIRCULOS = [
  { nivel: 0, label: "Truques",    curto: "Truques" },
  { nivel: 1, label: "1º Círculo", curto: "1º" },
  { nivel: 2, label: "2º Círculo", curto: "2º" },
  { nivel: 3, label: "3º Círculo", curto: "3º" },
  { nivel: 4, label: "4º Círculo", curto: "4º" },
  { nivel: 5, label: "5º Círculo", curto: "5º" },
  { nivel: 6, label: "6º Círculo", curto: "6º" }
];

/* -------------------------------------------- */
/*  Ações, requisitos e testes                  */
/* -------------------------------------------- */

export const ACOES = {
  padrao:    { label: "Ação Padrão",       curto: "Padrão" },
  bonus:     { label: "Ação Bônus",        curto: "Bônus" },
  movimento: { label: "Ação de Movimento", curto: "Movimento" },
  reacao:    { label: "Reação",            curto: "Reação" },
  livre:     { label: "Ação Livre",        curto: "Livre" },
  lendaria:  { label: "Ação Lendária",     curto: "Lendária" },
  mitica:    { label: "Ação Mítica",       curto: "Mítica" },
  arcaica:   { label: "Ação Arcaica",      curto: "Arcaica" },
  passiva:   { label: "Passiva",           curto: "Passiva" }
};

/** Ações do turno controladas na ficha (nesta ordem, as defesas consomem do fim para o começo). */
export const ACOES_TURNO = ["padrao", "bonus", "movimento"];
export const ACOES_ESPECIAIS = ["lendaria", "mitica", "arcaica"];

/** O que uma forma precisa para ser usada. Condições bloqueiam requisitos. */
export const REQUISITOS = {
  gestual:      { label: "Gestual",      dica: "Precisa mover braços e mãos" },
  verbal:       { label: "Verbal",       dica: "Precisa falar ou entoar" },
  movimento:    { label: "Movimento",    dica: "Precisa se deslocar" },
  visao:        { label: "Visão",        dica: "Precisa enxergar o alvo" },
  concentracao: { label: "Concentração", dica: "Precisa manter o foco" },
  arma:         { label: "Arma",         dica: "Precisa de uma arma em mãos" },
  contato:      { label: "Contato",      dica: "Precisa tocar o alvo" }
};

export const TIPOS_TESTE = {
  nenhum:      "Sem teste",
  ataque:      "Ataque (perícia do usuário)",
  resistencia: "Resistência do alvo (CD 8 + Arcanismo)",
  pericia:     "Teste de perícia do usuário"
};

/** Habilidades e magias custam Mana ou Estamina (não há usos limitados). */
export const CUSTO_RECURSOS = {
  nenhum: { label: "Sem custo", sigla: "" },
  pm: { label: "Mana (PM)", sigla: "PM" },
  pe: { label: "Estamina (PE)", sigla: "PE" }
};

/** CD dos testes de resistência contra habilidades e magias: 8 + perícia (com atributo). */
export const CD = { base: 8, pericia: "arcanismo" };

export const CRITICO_PADRAO = { margem: 20, mult: 2 };
export const COR_VIDA_TEMP = "#E8C547";

export const RECARGAS = {
  nenhuma: "Sem recarga automática",
  curto:   "Descanso curto",
  longo:   "Descanso longo",
  combate: "Por combate",
  dia:     "Por dia"
};

/* -------------------------------------------- */
/*  Melhorias com PT                            */
/* -------------------------------------------- */

/**
 * `dano`: soma esta parte à fórmula de dano da forma escolhida.
 * `efeito`: conta para o limite de efeitos adicionais da raridade.
 * `de`/`para`: troca a ação da forma.
 */
export const MELHORIAS = [
  { id: "d6",      label: "+1d6 de dano",              custo: 15, dano: "1d6" },
  { id: "d8",      label: "+1d8 de dano",              custo: 20, dano: "1d8" },
  { id: "d10",     label: "+1d10 de dano",             custo: 25, dano: "1d10" },
  { id: "d12",     label: "+1d12 de dano",             custo: 35, dano: "1d12" },
  { id: "fixo5",   label: "+5 de dano fixo",           custo: 15, dano: "5" },
  { id: "efLeve",  label: "Novo efeito leve",          custo: 15, efeito: true },
  { id: "efMod",   label: "Novo efeito moderado",      custo: 25, efeito: true },
  { id: "efForte", label: "Novo efeito forte",         custo: 40, efeito: true },
  { id: "efMelh",  label: "Melhorar efeito existente", custo: 20 },
  { id: "alcance", label: "Aumentar alcance",          custo: 15 },
  { id: "alvo",    label: "Atingir mais 1 alvo",       custo: 20 },
  { id: "area",    label: "Aumentar a área",           custo: 25 },
  { id: "custo",   label: "Reduzir custo de ativação", custo: 40 },
  { id: "bonus",   label: "Ação Padrão → Ação Bônus",  custo: 50, de: "padrao", para: "bonus" },
  { id: "reacao",  label: "Ação Padrão → Reação",      custo: 60, de: "padrao", para: "reacao" }
];

/* -------------------------------------------- */
/*  Combate                                     */
/* -------------------------------------------- */

export const DEFESAS = {
  esquiva: {
    label: "Esquiva", pericia: "acrobacia", icone: "fa-solid fa-person-running",
    descricao: "Tenta evitar o ataque por completo. Se o atacante passar, você recebe o dano; se falhar, não recebe nada."
  },
  bloqueio: {
    label: "Bloqueio", pericia: "fortitude", icone: "fa-solid fa-shield-halved",
    descricao: "Tenta reduzir o dano. Atacante falhou por 1–2: recebe 2/3 do dano. Por 3–4: metade. Por 5 ou mais: nenhum dano."
  },
  contra: {
    label: "Contra-ataque", pericia: "luta", icone: "fa-solid fa-hand-fist",
    descricao: "Declare antes do ataque inimigo. Se ele errar, você realiza um ataque contra ele (precisa alcançá-lo)."
  }
};

export const EXAUSTAO = [
  { nivel: 1, texto: "Desvantagem em testes" },
  { nivel: 2, texto: "Deslocamento reduzido pela metade" },
  { nivel: 3, texto: "Desvantagem em ataques e testes de resistência" },
  { nivel: 4, texto: "Vida máxima reduzida pela metade" },
  { nivel: 5, texto: "Deslocamento reduzido a 0" },
  { nivel: 6, texto: "Coma por 1d6 dias (+2 dias por nível acima de 6)" }
];

/* -------------------------------------------- */
/*  Condições                                   */
/* -------------------------------------------- */

const TODAS_ACOES = ["padrao", "bonus", "movimento", "reacao", "livre", "lendaria", "mitica", "arcaica"];

/**
 * Condições pré-definidas. Elas viram status do Foundry: aparecem no HUD do token e
 * podem ser ligadas tanto pela ficha quanto pelo token.
 *
 * efeitos:
 *  - deslocamentoMult: multiplica o deslocamento (0 = parado). Vale o mais severo.
 *  - desvantagemTestes / desvantagemAtaques: aplicadas automaticamente nas rolagens.
 *  - bloqueiaAcoes: formas que usam essas ações ficam bloqueadas.
 *  - bloqueiaRequisitos: formas com esses requisitos ficam bloqueadas.
 *  - mods: [{ alvo, valor }] — mesmos alvos das bênçãos (ex.: { alvo: "ca", valor: -2 }).
 */
export const CONDICOES = [
  { id: "epm-lento", label: "Lento", icone: "icons/svg/downgrade.svg",
    descricao: "Deslocamento reduzido pela metade.",
    efeitos: { deslocamentoMult: 0.5 } },
  { id: "epm-preso", label: "Preso", icone: "icons/svg/net.svg",
    descricao: "Não pode se deslocar. Habilidades e magias com requisito gestual ou de movimento ficam bloqueadas.",
    efeitos: { deslocamentoMult: 0, bloqueiaRequisitos: ["gestual", "movimento"] } },
  { id: "epm-caido", label: "Caído", icone: "icons/svg/falling.svg",
    descricao: "Rastejando: deslocamento pela metade e desvantagem em ataques.",
    efeitos: { deslocamentoMult: 0.5, desvantagemAtaques: true } },
  { id: "epm-cego", label: "Cego", icone: "icons/svg/blind.svg",
    descricao: "Não enxerga. Bloqueia o que exige visão; desvantagem em ataques.",
    efeitos: { bloqueiaRequisitos: ["visao"], desvantagemAtaques: true } },
  { id: "epm-surdo", label: "Surdo", icone: "icons/svg/deaf.svg",
    descricao: "Não ouve. Falha automaticamente no que depende de audição.",
    efeitos: {} },
  { id: "epm-silenciado", label: "Silenciado", icone: "icons/svg/silenced.svg",
    descricao: "Não consegue falar. Bloqueia o que tem requisito verbal.",
    efeitos: { bloqueiaRequisitos: ["verbal"] } },
  { id: "epm-amedrontado", label: "Amedrontado", icone: "icons/svg/terror.svg",
    descricao: "Desvantagem em testes e ataques enquanto a fonte do medo estiver à vista.",
    efeitos: { desvantagemTestes: true, desvantagemAtaques: true } },
  { id: "epm-envenenado", label: "Envenenado", icone: "icons/svg/poison.svg",
    descricao: "Desvantagem em testes.",
    efeitos: { desvantagemTestes: true } },
  { id: "epm-enfraquecido", label: "Enfraquecido", icone: "icons/svg/degen.svg",
    descricao: "Desvantagem em ataques.",
    efeitos: { desvantagemAtaques: true } },
  { id: "epm-eletrocutado", label: "Eletrocutado", icone: "icons/svg/lightning.svg",
    descricao: "Músculos travados: não pode usar a Reação.",
    efeitos: { bloqueiaAcoes: ["reacao"] } },
  { id: "epm-atordoado", label: "Atordoado", icone: "icons/svg/daze.svg",
    descricao: "Não pode agir nem se mover.",
    efeitos: { deslocamentoMult: 0, bloqueiaAcoes: ["padrao", "bonus", "movimento", "reacao"] } },
  { id: "epm-congelado", label: "Congelado", icone: "icons/svg/frozen.svg",
    descricao: "Preso no gelo: não se desloca nem gesticula.",
    efeitos: { deslocamentoMult: 0, bloqueiaRequisitos: ["movimento", "gestual"] } },
  { id: "epm-paralisado", label: "Paralisado", icone: "icons/svg/paralysis.svg",
    descricao: "Não pode agir, se mover nem falar.",
    efeitos: { deslocamentoMult: 0, bloqueiaAcoes: TODAS_ACOES, bloqueiaRequisitos: ["verbal", "gestual", "movimento"] } },
  { id: "epm-dormindo", label: "Dormindo", icone: "icons/svg/sleep.svg",
    descricao: "Não age nem percebe o entorno. Acorda ao sofrer dano ou ser sacudido.",
    efeitos: { deslocamentoMult: 0, bloqueiaAcoes: TODAS_ACOES } },
  { id: "epm-inconsciente", label: "Inconsciente", icone: "icons/svg/unconscious.svg",
    descricao: "Não age, não se move e não percebe o entorno.",
    efeitos: { deslocamentoMult: 0, bloqueiaAcoes: TODAS_ACOES } },
  { id: "epm-sangrando", label: "Sangrando", icone: "icons/svg/blood.svg",
    descricao: "Perde vida no início de cada turno (o Mestre define o valor).",
    efeitos: {} },
  { id: "epm-queimando", label: "Queimando", icone: "icons/svg/fire.svg",
    descricao: "Sofre dano de fogo no início de cada turno até apagar as chamas.",
    efeitos: {} },
  { id: "epm-invisivel", label: "Invisível", icone: "icons/svg/invisible.svg",
    descricao: "Não pode ser visto sem meios especiais.",
    efeitos: {} },
  { id: "epm-voando", label: "Voando", icone: "icons/svg/wing.svg",
    descricao: "Está no ar.",
    efeitos: {} },
  { id: "epm-concentrado", label: "Concentrado", icone: "icons/svg/eye.svg",
    descricao: "Mantendo uma habilidade ou magia que exige concentração.",
    efeitos: {} }
];

/** Ações bloqueadas automaticamente pelo coma (exaustão 6+). */
export const ACOES_BLOQUEADAS_COMA = TODAS_ACOES;

/* -------------------------------------------- */
/*  Modificadores (bênçãos, maldições, efeitos) */
/* -------------------------------------------- */

/** Alvos que um modificador pode afetar. Perícias são adicionadas dinamicamente. */
export function alvosModificador(pericias = []) {
  const alvos = [];
  for (const [id, a] of Object.entries(ATRIBUTOS)) alvos.push({ id: `atributo.${id}`, label: a.label, grupo: "Atributos" });
  for (const [id, r] of Object.entries(RECURSOS)) alvos.push({ id: `recurso.${id}`, label: `${r.label} máxima`, grupo: "Recursos" });
  alvos.push({ id: "ca", label: "CA", grupo: "Combate" });
  alvos.push({ id: "deslocamento", label: "Deslocamento (m)", grupo: "Combate" });
  alvos.push({ id: "iniciativa", label: "Iniciativa", grupo: "Combate" });
  for (const [id, d] of Object.entries(DEFESAS)) alvos.push({ id: `defesa.${id}`, label: d.label, grupo: "Combate" });
  for (const p of pericias) alvos.push({ id: `pericia.${p.id}`, label: p.nome, grupo: "Perícias" });
  return alvos;
}

/* -------------------------------------------- */
/*  Inventário                                  */
/* -------------------------------------------- */

export const CATEGORIAS_ITEM = [
  { id: "armas",       label: "Armas",       tipos: ["weapon"],               criar: "weapon",     novo: "Nova arma",        icone: "fa-solid fa-khanda" },
  { id: "consumiveis", label: "Consumíveis", tipos: ["consumable"],           criar: "consumable", novo: "Novo consumível",  icone: "fa-solid fa-flask" },
  { id: "armaduras",   label: "Armaduras",   tipos: ["equipment"],            criar: "equipment",  novo: "Nova armadura",    icone: "fa-solid fa-shield-halved" },
  { id: "ferramentas", label: "Ferramentas", tipos: ["tool"],                 criar: "tool",       novo: "Nova ferramenta",  icone: "fa-solid fa-screwdriver-wrench" },
  { id: "mochilas",    label: "Mochilas",    tipos: ["container", "backpack"], criar: "container", novo: "Nova mochila",     icone: "fa-solid fa-suitcase" },
  { id: "loot",        label: "Loot",        tipos: ["loot"],                 criar: "loot",       novo: "Novo loot",        icone: "fa-solid fa-gem" }
];

/** Tipos do dnd5e que não fazem sentido na ficha EPM (ignorados ao soltar na ficha). */
export const TIPOS_IGNORADOS = ["class", "subclass", "background", "race", "facility"];

export const MOEDAS = [
  { id: "kan", label: "Joias de Kan", abrev: "JK", valor: 1000000, cor: "#3ED1B9", dica: "1 Joia de Kan = 1000 Platinas" },
  { id: "pl",  label: "Platina",      abrev: "PL", valor: 1000,    cor: "#C7D2DA", dica: "1 Platina = 10 Ouros" },
  { id: "po",  label: "Ouro",         abrev: "PO", valor: 100,     cor: "#E3B341", dica: "1 Ouro = 10 Pratas" },
  { id: "pp",  label: "Prata",        abrev: "PP", valor: 10,      cor: "#B4BCC2", dica: "1 Prata = 10 Cobres" },
  { id: "pc",  label: "Cobre",        abrev: "PC", valor: 1,       cor: "#C27A4A", dica: "Menor moeda" }
];

/* -------------------------------------------- */
/*  Sobre o personagem / relações / abas        */
/* -------------------------------------------- */

export const CAMPOS_SOBRE = [
  { id: "idade",  label: "Idade" },
  { id: "altura", label: "Altura" },
  { id: "peso",   label: "Peso" },
  { id: "olhos",  label: "Cor dos olhos" },
  { id: "cabelo", label: "Cabelo" },
  { id: "pele",   label: "Pele" },
  { id: "genero", label: "Gênero" },
  { id: "origem", label: "Terra natal" },
  { id: "tema",   label: "Tema", dica: "Caos, Luz, Trevas, Sangue, Estrelas, Tempo…" }
];

export const TEXTOS_SOBRE = [
  { id: "historia",      label: "História" },
  { id: "aparencia",     label: "Aparência" },
  { id: "personalidade", label: "Personalidade" },
  { id: "objetivos",     label: "Objetivos e motivações" },
  { id: "medos",         label: "Medos e fraquezas" },
  { id: "outros",        label: "Outras anotações" }
];

export const TIPOS_RELACAO = {
  aliado: "Aliado", amigo: "Amigo", familia: "Família", mentor: "Mentor",
  amor: "Interesse amoroso", contato: "Contato", rival: "Rival", inimigo: "Inimigo", outro: "Outro"
};

export const AFINIDADE = { min: -5, max: 5 };

export const ABAS = [
  { id: "principal",   label: "Principal",   icone: "fa-solid fa-user" },
  { id: "combate",     label: "Combate",     icone: "fa-solid fa-crosshairs" },
  { id: "inventario",  label: "Inventário",  icone: "fa-solid fa-sack-dollar" },
  { id: "habilidades", label: "Habilidades", icone: "fa-solid fa-hand-sparkles" },
  { id: "magias",      label: "Magias",      icone: "fa-solid fa-wand-sparkles" },
  { id: "sobre",       label: "Sobre",       icone: "fa-solid fa-feather-pointed" },
  { id: "anotacoes",   label: "Anotações",   icone: "fa-solid fa-diagram-project" },
  { id: "condicoes",   label: "Condições",   icone: "fa-solid fa-heart-pulse" },
  { id: "bencaos",     label: "Bênçãos",     icone: "fa-solid fa-yin-yang" },
  { id: "relacoes",    label: "Relações",    icone: "fa-solid fa-people-arrows" }
];

export const CORES_NO = ["#2B4440", "#3A3355", "#4A2F33", "#4A4128", "#26404F", "#3B4A2B"];

/** Sugestões para os campos de tags (o jogador pode digitar qualquer valor). */
export const SUGESTOES = {
  dano: ["Corte", "Perfuração", "Impacto", "Fogo", "Gelo", "Elétrico", "Ácido", "Veneno", "Psíquico", "Necrótico", "Radiante", "Trovão", "Força", "Caos", "Luz", "Trevas", "Sangue"],
  idiomas: ["Comum"]
};
