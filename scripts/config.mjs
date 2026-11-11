/**
 * Escolhidos pelo Multiverso — configuração do sistema.
 * Tudo que é "regra" ou "rótulo" mora aqui: para renomear algo (ex.: Esforço → Estamina),
 * adicionar uma condição ou mudar um limite, edite este arquivo.
 */

import { CONDICOES_DADOS, CATEGORIAS_CONDICAO, COMBINACOES, CONDICOES_RENOMEADAS } from "./condicoes.mjs";

export const MODULE_ID = "epm-ficha";
/** Escopo das flags onde os dados da ficha ficam guardados (actor.flags["epm-ficha"]). */
export const FLAG = "epm-ficha";
export const CAMINHO = `modules/${MODULE_ID}/templates`;
export const ASSETS = `modules/${MODULE_ID}/assets`;

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
  ["vontade", "Vontade", ["autocontrole"]]
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

export const ARQUETIPOS_SUGERIDOS = ["Combatente", "Conjurador", "Artífice"];

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
  audicao:      { label: "Audição",      dica: "Precisa ouvir" },
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
/** Cores das barras temporárias: Vida amarela, Estamina verde, Mana roxa, Sanidade cinza. */
export const CORES_TEMP = { pv: COR_VIDA_TEMP, pe: "#5FBF6A", pm: "#9B6BE0", ps: "#A3A9AE" };

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

/** Exaustão 1 a 6, cumulativa (cada nível inclui os anteriores). */
export const EXAUSTAO = [
  { nivel: 1, nome: "Leve",     texto: "Desvantagem em tudo, inclusive no dano" },
  { nivel: 2, nome: "Moderada", texto: "−5 na Defesa e nos testes" },
  { nivel: 3, nome: "Grave",    texto: "Sem Ação Bônus e Reação; deslocamento pela metade" },
  { nivel: 4, nome: "Crítica",  texto: "No máximo 1 ação por turno" },
  { nivel: 5, nome: "Colapso",  texto: "Incapacitado e Inconsciente" },
  { nivel: 6, nome: "Morte",    texto: "O personagem morre" }
];
export const EXAUSTAO_MAX = 6;

/* -------------------------------------------- */
/*  Condições                                   */
/* -------------------------------------------- */

export const TODAS_ACOES = ["padrao", "bonus", "movimento", "reacao", "livre", "lendaria", "mitica", "arcaica"];

/**
 * Condições pré-definidas (lista oficial em condicoes.mjs). Elas viram status do Foundry:
 * aparecem no HUD do token e podem ser ligadas tanto pela ficha quanto pelo token.
 */
export const CONDICOES = CONDICOES_DADOS.map(c => ({ ...c, icone: `${ASSETS}/condicoes/${c.slug}.svg` }));
export { CATEGORIAS_CONDICAO, COMBINACOES, CONDICOES_RENOMEADAS };

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
  alvos.push({ id: "acerto", label: "Acerto de todos os ataques", grupo: "Combate" });
  alvos.push({ id: "danoAtaque", label: "Dano de todos os ataques", grupo: "Combate" });
  for (const [id, d] of Object.entries(DEFESAS)) alvos.push({ id: `defesa.${id}`, label: d.label, grupo: "Combate" });
  alvos.push({ id: "testes", label: "Todos os testes", grupo: "Testes" });
  alvos.push({ id: "pericias", label: "Todas as perícias", grupo: "Testes" });
  for (const p of pericias) alvos.push({ id: `pericia.${p.id}`, label: p.nome, grupo: "Perícias" });
  return alvos;
}

/* -------------------------------------------- */
/*  Inventário                                  */
/* -------------------------------------------- */

/** Categorias do inventário. As mochilas ficam sempre no topo, como um segundo inventário. */
export const CATEGORIAS_ITEM = [
  { id: "armas",       label: "Armas",       tipos: ["weapon"],               criar: "weapon",     novo: "Nova arma",        icone: "fa-solid fa-khanda" },
  { id: "consumiveis", label: "Consumíveis", tipos: ["consumable"],           criar: "consumable", novo: "Novo consumível",  icone: "fa-solid fa-flask" },
  { id: "armaduras",   label: "Armaduras",   tipos: ["equipment"],            criar: "equipment",  novo: "Nova armadura",    icone: "fa-solid fa-shield-halved" },
  { id: "ferramentas", label: "Ferramentas", tipos: ["tool"],                 criar: "tool",       novo: "Nova ferramenta",  icone: "fa-solid fa-screwdriver-wrench" },
  { id: "loot",        label: "Loot",        tipos: ["loot"],                 criar: "loot",       novo: "Novo loot",        icone: "fa-solid fa-gem" }
];
export const CATEGORIA_MOCHILAS = { id: "mochilas", label: "Mochilas", tipos: ["container", "backpack"], criar: "container", novo: "Nova mochila", icone: "fa-solid fa-suitcase" };

/**
 * Bônus e efeitos que um item pode dar. Armas e armaduras valem quando equipadas;
 * ferramentas, loot e mochilas valem enquanto estão no inventário; consumíveis valem ao usar.
 */
export const TIPOS_EFEITO_ITEM = {
  mod:             { label: "Bônus ou penalidade", dica: "Soma (ou tira) de um número da ficha" },
  rd:              { label: "Redução de dano (RD)", dica: "Diminui o dano recebido dos tipos indicados" },
  resistencia:     { label: "Resistência",          dica: "Resiste a um tipo de dano" },
  imunidade:       { label: "Imunidade",            dica: "Dano ou condição que não afeta" },
  vulnerabilidade: { label: "Vulnerabilidade",      dica: "Tipo de dano que fere mais" },
  desvantagem:     { label: "Desvantagem",          dica: "Desvantagem numa perícia, nos testes ou nos ataques" },
  vantagem:        { label: "Vantagem",             dica: "Vantagem numa perícia, nos testes ou nos ataques" },
  cura:            { label: "Cura ou recuperação",  dica: "Recupera Vida, Mana, Estamina ou Sanidade" },
  danoExtra:       { label: "Dano extra",           dica: "Dano a mais nos ataques com esta arma" }
};
export const QUANDO_CURA = { uso: "Ao usar", acerto: "Ao acertar um ataque" };

/** Tipos do dnd5e que não fazem sentido na ficha EPM (ignorados ao soltar na ficha). */
export const TIPOS_IGNORADOS = ["class", "subclass", "background", "race", "facility"];

/** Moedas, da menor para a maior. O valor é em cobre. */
export const MOEDAS = [
  { id: "pc", label: "Cobre",   abrev: "PC", valor: 1,       cor: "#C27A4A", img: `${ASSETS}/moedas/cobre.webp`,   dica: "A menor moeda" },
  { id: "pp", label: "Prata",   abrev: "PP", valor: 10,      cor: "#B4BCC2", img: `${ASSETS}/moedas/prata.webp`,   dica: "1 Prata = 10 Cobres" },
  { id: "po", label: "Ouro",    abrev: "PO", valor: 100,     cor: "#D9A25A", img: `${ASSETS}/moedas/ouro.webp`,    dica: "1 Ouro = 10 Pratas" },
  { id: "pl", label: "Platina", abrev: "PL", valor: 1000,    cor: "#8D8992", img: `${ASSETS}/moedas/platina.webp`, dica: "1 Platina = 10 Ouros" },
  { id: "dr", label: "Dracmas", abrev: "DR", valor: 1000000, cor: "#B0479A", img: `${ASSETS}/moedas/dracma.webp`,  dica: "1 Dracma = 1.000 Platinas" }
];
/** As mesmas moedas da maior para a menor (para troco e consolidação). */
export const MOEDAS_DESC = [...MOEDAS].sort((a, b) => b.valor - a.valor);
/** Moedas antigas e para onde vão na migração. */
export const MOEDAS_ANTIGAS = { kan: "dr" };

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

/**
 * Partes do background que outro personagem vê conforme a afinidade dele com você.
 * O dono da ficha pode mudar o nível de cada parte na aba Sobre (modo edição).
 */
export const REVELACOES = [
  { id: "tracos",        label: "Traços",                  padrao: 1 },
  { id: "aparencia",     label: "Aparência",               padrao: 1 },
  { id: "personalidade", label: "Personalidade",           padrao: 2 },
  { id: "marca",         label: "Marca",                   padrao: 3 },
  { id: "objetivos",     label: "Objetivos e motivações",  padrao: 3 },
  { id: "medos",         label: "Medos e fraquezas",       padrao: 4 },
  { id: "historia",      label: "História",                padrao: 5 },
  { id: "outros",        label: "Outras anotações",        padrao: "nunca" }
];
export const OPCOES_REVELAR = [
  { id: "sempre", label: "Sempre" },
  { id: "1", label: "Afinidade 1+" }, { id: "2", label: "Afinidade 2+" }, { id: "3", label: "Afinidade 3+" },
  { id: "4", label: "Afinidade 4+" }, { id: "5", label: "Afinidade 5" },
  { id: "nunca", label: "Nunca" }
];

export const ABAS = [
  { id: "principal",   label: "Principal",   icone: "fa-solid fa-user" },
  { id: "combate",     label: "Combate",     icone: "fa-solid fa-crosshairs" },
  { id: "inventario",  label: "Inventário",  icone: "fa-solid fa-sack-dollar" },
  { id: "habilidades", label: "Habilidades", icone: "fa-solid fa-hand-sparkles" },
  { id: "arqclasse",   label: "Arquétipo",   titulo: "Arquétipo e Classe", icone: "fa-solid fa-chess-knight", opcional: true },
  { id: "magias",      label: "Magias",      icone: "fa-solid fa-wand-sparkles" },
  { id: "treinamentos", label: "Treinamentos", icone: "fa-solid fa-dumbbell" },
  { id: "sobre",       label: "Sobre",       icone: "fa-solid fa-feather-pointed" },
  { id: "anotacoes",   label: "Anotações",   icone: "fa-solid fa-diagram-project" },
  { id: "condicoes",   label: "Condições",   icone: "fa-solid fa-heart-pulse" },
  { id: "bencaos",     label: "Bênçãos",     icone: "fa-solid fa-yin-yang" },
  { id: "relacoes",    label: "Relações",    icone: "fa-solid fa-people-arrows" },
  { id: "personalizacao", label: "Personalizar", titulo: "Personalização da ficha", icone: "fa-solid fa-palette", soEdicao: true }
];

/** Cores prontas da Personalização (a primeira é a padrão: verdete). */
/* -------------------------------------------- */
/*  Treinamentos                                */
/* -------------------------------------------- */

/** Regras de PT e horas de treino. */
export const TREINO = {
  horasDia: 8,                       // horas de treino por dia
  acao: { horas: 6, pt: 5 },         // Treinamento ou Estudo: 6 h → 5 PT
  conversa: { min: 1, max: 3 },      // conversa ou tutor: 1 a 3 PT
  minijogo: { horas: 1 },            // treino rápido (minijogo) numa hora de descanso
  ptMin: 1, ptMax: 20,               // faixa recomendada (o Mestre pode passar)
  horasMin: 6, horasMax: 240         // 6 h a 1 mês (idem)
};

/** Unidades de tempo dos treinamentos, em horas de treino (o dia de treino tem 8 h). */
export const UNIDADES_TEMPO = {
  horas:   { label: "horas",   umLabel: "hora",   horas: 1 },
  dias:    { label: "dias",    umLabel: "dia",    horas: 8 },
  semanas: { label: "semanas", umLabel: "semana", horas: 56 },
  meses:   { label: "meses",   umLabel: "mês",    horas: 240 }
};

export const ESTADOS_TREINO = {
  planejado: { label: "Planejado", icone: "fa-regular fa-clipboard" },
  andamento: { label: "Em andamento", icone: "fa-solid fa-person-running" },
  concluido: { label: "Concluído", icone: "fa-solid fa-medal" }
};

/** Modelos que vêm com o sistema (exemplos do livro). */
export const EXEMPLOS_TREINAMENTO = [
  { nome: "Corredor", tempo: 48, unidade: "horas", pt: 5, requisitos: "4 de Destreza", treinador: false,
    beneficios: "Seu deslocamento aumenta em 3 metros e você pode realizar a ação Disparada como ação bônus.",
    mods: [{ alvo: "deslocamento", valor: 3 }] },
  { nome: "Flash Step", tempo: 1, unidade: "meses", pt: 100, requisitos: "12 de Destreza ou Força, 8 de Núcleo", treinador: true,
    beneficios: "Defina com o Mestre.", mods: [] }
];

/** Minijogos do treino rápido. */
export const MINIJOGOS = {
  sequencia: { label: "Sequência", icone: "fa-solid fa-arrows-up-down-left-right", dica: "Reflexos: repita as setas antes do tempo acabar." },
  mira:      { label: "Na mira",   icone: "fa-solid fa-bullseye", dica: "Foco: pare o marcador dentro da faixa." },
  forca:     { label: "Explosão",  icone: "fa-solid fa-hand-fist", dica: "Força: aperte o mais rápido que puder para encher a barra." }
};
/** PT ganhos por acertos no minijogo (de 5 rodadas). */
export const PT_POR_ACERTOS = [0, 0, 1, 1, 2, 2];

/** Sub-abas da aba Habilidades (origem da habilidade). Arquétipo e Classe só usam Passiva e Comum. */
export const SUBABAS_HABILIDADE = [
  { id: "geral",     label: "Geral" },
  { id: "arquetipo", label: "Arquétipo", origem: "arquetipo" },
  { id: "classe",    label: "Classe",    origem: "classe" }
];

export const CORES_PRONTAS = [
  { id: "verdete",  label: "Verdete",  cor: "#5D9F98" },
  { id: "noite",    label: "Noite",    cor: "#5A7FB0" },
  { id: "ametista", label: "Ametista", cor: "#8A6BB0" },
  { id: "sangue",   label: "Sangue",   cor: "#A85660" },
  { id: "ambar",    label: "Âmbar",    cor: "#AD8A4F" },
  { id: "floresta", label: "Floresta", cor: "#6A9A62" },
  { id: "grafite",  label: "Grafite",  cor: "#7C838A" }
];
export const COR_PADRAO = CORES_PRONTAS[0].cor;
export const BRILHO_PADRAO = 50;

export const CORES_NO = ["#2B4440", "#3A3355", "#4A2F33", "#4A4128", "#26404F", "#3B4A2B"];

/** Sugestões para os campos de tags (o jogador pode digitar qualquer valor). */
export const SUGESTOES = {
  dano: ["Corte", "Perfuração", "Impacto", "Fogo", "Gelo", "Elétrico", "Ácido", "Veneno", "Psíquico", "Necrótico", "Radiante", "Trovão", "Força", "Mágico", "Espiritual", "Sanidade", "Caos", "Luz", "Trevas", "Sangue"]
};
