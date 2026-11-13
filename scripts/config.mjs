/**
 * Escolhidos pelo Multiverso — configuração do sistema.
 * Tudo que é "regra" ou "rótulo" mora aqui: para renomear algo (ex.: Esforço → Estamina),
 * adicionar uma condição ou mudar um limite, edite este arquivo.
 */

import { CONDICOES_DADOS, CATEGORIAS_CONDICAO, COMBINACOES, CONDICOES_RENOMEADAS, CONDICOES_NOTION_DADOS, CATEGORIA_NOTION } from "./condicoes.mjs";

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

/** Atalhos dos atributos nas fórmulas (1d8 + @for): valem o total final do atributo, já com penalidades. */
export const ATALHOS_ATRIBUTO = { for: "forca", des: "destreza", con: "constituicao", apa: "aparencia", car: "carisma", int: "inteligencia", aut: "autocontrole", nuc: "nucleo" };

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
  ["reflexos", "Reflexos", ["destreza"]],
  ["religiao", "Religião", ["inteligencia"]],
  ["sobrevivencia", "Sobrevivência", ["inteligencia"]],
  ["tecnologia", "Tecnologia", ["inteligencia"]],
  ["vontade", "Vontade", ["autocontrole"]]
];

/** Perícias da lista provisória da versão 0.1 (removidas na migração se estiverem zeradas). */
/** Testes de Resistência (caixa própria acima das perícias). */
export const PERICIAS_RESISTENCIA = ["fortitude", "reflexos", "vontade"];

export const PERICIAS_OBSOLETAS = ["atuacao", "canalizacao", "conhecimento", "disfarce", "enganacao", "iniciativa", "ladinagem", "misticismo", "seducao"];

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
  periciasIniciais: 50,
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
  customizada: "Customizada",
  transformacao: "Transformação",
  maestria: "Domínio",
  meme: "Meme"
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
  resistencia: "Resistência do alvo (DT 10 + atributo + perícia)",
  pericia:     "Teste de perícia do usuário"
};

/** Habilidades e magias custam Mana ou Estamina (não há usos limitados). */
export const CUSTO_RECURSOS = {
  nenhum: { label: "Sem custo", sigla: "" },
  pm: { label: "Mana (PM)", sigla: "PM" },
  pe: { label: "Estamina (PE)", sigla: "PE" }
};

/**
 * DT dos testes de resistência contra habilidades e magias: 10 + atributo + perícia.
 * Padrão: Núcleo + Arcanismo (cada personagem pode trocar os dois na aba Magias, no modo edição).
 * A perícia entra sem o próprio atributo (pontos + outros + bônus), para o atributo não contar duas vezes.
 */
export const CD = { base: 10, atributo: "nucleo", pericia: "arcanismo" };

export const CRITICO_PADRAO = { margem: 20, mult: 2 };
export const COR_VIDA_TEMP = "#E8C547";
/** Cores das barras temporárias: Vida amarela, Estamina verde, Mana roxa, Sanidade cinza. */
export const CORES_TEMP = { pv: COR_VIDA_TEMP, pe: "#5FBF6A", pm: "#9B6BE0", ps: "#A3A9AE" };

/** Limite de uso de cada forma de uma habilidade ("Uso: uma vez por combate"). */
export const USOS_FORMA = {
  livre:   "Sem limite",
  combate: "1× por combate",
  cena:    "1× por cena",
  curto:   "1× por descanso curto",
  longo:   "1× por descanso longo",
  dia:     "1× por dia"
};

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
    label: "Esquiva", pericia: "reflexos", icone: "fa-solid fa-person-running",
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
export const CONDICOES = [...CONDICOES_DADOS, ...CONDICOES_NOTION_DADOS]
  .map(c => ({ ...c, icone: `${ASSETS}/condicoes/${c.iconeSlug ?? c.slug}.svg` }));
export { CATEGORIAS_CONDICAO, COMBINACOES, CONDICOES_RENOMEADAS, CATEGORIA_NOTION };

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
  { id: "armaduras",   label: "Armaduras e escudos",   tipos: ["equipment"],            criar: "equipment",  novo: "Nova armadura ou escudo",    icone: "fa-solid fa-shield-halved", semVestimentas: true },
  { id: "vestimentas", label: "Vestimentas e acessórios", tipos: ["equipment"], subtipo: "clothing", criar: "equipment", novo: "Nova vestimenta ou acessório", icone: "fa-solid fa-shirt", soVestimentas: true },
  { id: "ferramentas", label: "Ferramentas", tipos: ["tool"],                 criar: "tool",       novo: "Nova ferramenta",  icone: "fa-solid fa-screwdriver-wrench" },
  { id: "loot",        label: "Loot",        tipos: ["loot"],                 criar: "loot",       novo: "Novo loot",        icone: "fa-solid fa-gem" }
];
/** Tipos de equipamento do D&D que contam como vestimenta ou acessório (roupa, bugiganga, anel, bastão, varinha). */
export const TIPOS_VESTIMENTA = ["clothing", "trinket", "ring", "rod", "wand"];
/** Vestimenta ou acessório: sem CA de armadura, fica em "Vestimentas e acessórios" no inventário. */
export const eVestimenta = item => item?.type === "equipment" && TIPOS_VESTIMENTA.includes(item?.system?.type?.value);
/** O item entra nesta categoria do inventário? */
export const itemNaCategoria = (cat, item, tipo = item?.type) =>
  cat.tipos.includes(tipo) && !(cat.semVestimentas && eVestimenta(item)) && !(cat.soVestimentas && !eVestimenta(item));
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
  { id: "apelido", label: "Apelido" },
  { id: "vulgo",  label: "Vulgo" },
  { id: "idade",  label: "Idade" },
  { id: "altura", label: "Altura" },
  { id: "peso",   label: "Peso" },
  { id: "olhos",  label: "Cor dos olhos" },
  { id: "cabelo", label: "Cabelo" },
  { id: "pele",   label: "Pele" },
  { id: "genero", label: "Gênero" },
  { id: "sexualidade", label: "Sexualidade" },
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
/** Ícone e cor de cada tipo de vínculo (selo na relação). */
export const ESTILO_RELACAO = {
  aliado:  { icone: "fa-solid fa-handshake",        cor: "#6FAE8C" },
  amigo:   { icone: "fa-solid fa-face-smile",       cor: "#7FB7D9" },
  familia: { icone: "fa-solid fa-house-chimney",    cor: "#D9A25A" },
  mentor:  { icone: "fa-solid fa-graduation-cap",   cor: "#B49BE0" },
  amor:    { icone: "fa-solid fa-heart",            cor: "#E07A9B" },
  contato: { icone: "fa-solid fa-address-book",     cor: "#A3A9AE" },
  rival:   { icone: "fa-solid fa-bolt",             cor: "#E3A13A" },
  inimigo: { icone: "fa-solid fa-skull",            cor: "#D2544A" },
  outro:   { icone: "fa-solid fa-circle-question",  cor: "#93A9A3" }
};

/** Nomes da reputação com facções (−5 a +5). */
export const ROTULOS_REPUTACAO = {
  "-5": "Caçado", "-4": "Odiado", "-3": "Hostil", "-2": "Desconfiado", "-1": "Malvisto", "0": "Neutro",
  "1": "Conhecido", "2": "Respeitado", "3": "Honrado", "4": "Aliado", "5": "Herói"
};

/** Histórico de afinidade e reputação: quantas mudanças ficam guardadas por relação ou facção. */
export const HISTORICO_MAX = 25;

/** Tipos de companheiro (aba Companheiros). */
export const TIPOS_COMPANHEIRO = {
  pet: "Pet", montaria: "Montaria", invocacao: "Invocação", automato: "Autômato", aliado: "Aliado", outro: "Outro"
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
  { id: "companheiros", label: "Companheiros", icone: "fa-solid fa-paw", seConteudo: "companheiros" },
  { id: "bestiario",   label: "Bestiário",   icone: "fa-solid fa-dragon" },
  { id: "producao",    label: "Produção",    titulo: "Produção: forja, alquimia, rituais e encantamento", icone: "fa-solid fa-hammer", seConteudo: "receitas" },
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
/** Transformações prontas que o Mestre entrega pelo Escudo (aba Itens). */
export const TRANSFORMACOES_PRONTAS = [
  {
    id: "bestaDesperta", nome: "Besta Desperta (Forma Bestial)",
    custo: { recurso: "pe", valor: 5 }, custoPorTurno: true, duracao: 0, frenesi: true,
    mods: [{ alvo: "acerto", valor: 8 }, { alvo: "danoAtaque", valor: 10 }, { alvo: "deslocamento", valor: 8 }, { alvo: "pericia.percepcao", valor: 6 }, { alvo: "atributo.constituicao", valor: 5 }],
    descricao: "Transformação Suprema · 5 PE por turno · Pessoal. Libera completamente os instintos: a postura muda, os sentidos se aguçam e o corpo assume uma forma bestial, feita para caçar, perseguir e destruir.\n" +
      "+8 Acerto, +10 Dano, +8 m de Movimento, +6 Percepção, +5 Vigor (Constituição).\n" +
      "Predador Nato: não sofre penalidade por atacar enquanto se movimenta.\n" +
      "Caçada Implacável: ao atingir um alvo, pode se deslocar uma curta distância sem gastar ação.\n" +
      "Instinto de Sobrevivência: quando um ataque o deixaria fora de combate, pode fazer um teste para ficar de pé com um mínimo de energia.\n" +
      "Sentidos da Besta: não é facilmente surpreendido por criaturas no alcance dos seus sentidos.\n" +
      "Frenesi: +5 de dano com até 100% da Vida, +10 até 75%, +15 até 50% e +20 até 25%."
  }
];

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
  { id: "raca",      label: "Raça",      origem: "raca" },
  { id: "arquetipo", label: "Arquétipo", origem: "arquetipo" },
  { id: "classe",    label: "Classe",    origem: "classe" },
  { id: "transformacoes", label: "Transformações", origem: "transformacao" },
  { id: "meme",      label: "Memes",     origem: "meme" }
];
/** Sub-abas que também aparecem na aba opcional Arquétipo e Classe. */
export const SUBABAS_ARQCLASSE = ["arquetipo", "classe"];

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

/** Personalização: moldura do retrato, estilo de letra e tamanho do texto. */
export const MOLDURAS = {
  astrolabio: { label: "Astrolábio (padrão)" },
  simples:    { label: "Simples" },
  dourada:    { label: "Dourada" },
  runica:     { label: "Rúnica" },
  nenhuma:    { label: "Sem moldura" }
};
export const FONTES = {
  classica:   { label: "Clássica (padrão)", display: "", ui: "" },
  limpa:      { label: "Limpa",      display: '"Signika", "Segoe UI", system-ui, sans-serif', ui: "" },
  condensada: { label: "Condensada", display: '"Modesto Condensed", "Arial Narrow", sans-serif', ui: '"Signika", "Arial Narrow", sans-serif' },
  antiga:     { label: "Antiga",     display: '"Amiri", "Book Antiqua", Georgia, serif', ui: '"Amiri", Georgia, "Times New Roman", serif' },
  futurista:  { label: "Futurista",  display: '"Bruno Ace", "Orbitron", "Eurostile", sans-serif', ui: "" }
};
export const ESCALA_TEXTO = { min: 85, max: 125, passo: 5, padrao: 100 };
export const BRILHO_PADRAO = 50;

export const CORES_NO = ["#2B4440", "#3A3355", "#4A2F33", "#4A4128", "#26404F", "#3B4A2B"];

/** Sugestões para os campos de tags (o jogador pode digitar qualquer valor). */
/**
 * Tipos de dano do RPG (20 + Corrupção), em grupos. "aliases" são nomes antigos ou alternativos
 * que continuam valendo nas fichas (ex.: uma resistência a "Corte" vale para dano Cortante).
 */
export const GRUPOS_DANO = {
  fisicos: "Físicos", elementais: "Elementais", misticos: "Energéticos e místicos", mentais: "Mentais", biologicos: "Biológicos",
  regionais: "Regionais (Notion)"
};
export const TIPOS_DANO = [
  { id: "contundente", label: "Contundente", grupo: "fisicos", aliases: ["impacto", "concussao", "esmagamento", "contusao"], desc: "Impactos, golpes, esmagamentos e colisões." },
  { id: "cortante", label: "Cortante", grupo: "fisicos", aliases: ["corte"], desc: "Lâminas, garras e objetos capazes de cortar." },
  { id: "perfurante", label: "Perfurante", grupo: "fisicos", aliases: ["perfuracao"], desc: "Ataques que atravessam ou perfuram o alvo." },
  { id: "fogo", label: "Fogo", grupo: "elementais", aliases: [], desc: "Chamas, combustão e calor extremo." },
  { id: "agua", label: "Água", grupo: "elementais", aliases: [], desc: "Jatos, ondas e impactos de água." },
  { id: "ar", label: "Ar", grupo: "elementais", aliases: ["vento"], desc: "Correntes de vento, rajadas e lâminas de ar." },
  { id: "terra", label: "Terra", grupo: "elementais", aliases: [], desc: "Rochas, minerais, areia e movimentos do solo." },
  { id: "gelo", label: "Gelo", grupo: "elementais", aliases: ["frio"], desc: "Congelamento, cristais de gelo e temperaturas extremamente baixas." },
  { id: "raio", label: "Raio", grupo: "elementais", aliases: ["eletrico", "eletricidade", "relampago"], desc: "Descargas elétricas e fenômenos eletromagnéticos." },
  { id: "acido", label: "Ácido", grupo: "elementais", aliases: [], desc: "Substâncias corrosivas que deterioram materiais e tecidos." },
  { id: "sonoro", label: "Sonoro", grupo: "elementais", aliases: ["trovao", "som", "trovejante"], desc: "Ondas sonoras, vibrações e frequências destrutivas." },
  { id: "forca", label: "Força", grupo: "misticos", aliases: ["magico"], desc: "Energia mágica concentrada, impactos arcanos e energia pura." },
  { id: "radiante", label: "Radiante", grupo: "misticos", aliases: ["sagrado", "radiante (sagrado)"], desc: "Energia divina, santidade e poderes sagrados." },
  { id: "luz", label: "Luz", grupo: "misticos", aliases: [], desc: "Energia luminosa concentrada, feixes de luz e radiação luminosa." },
  { id: "necrotico", label: "Necrótico", grupo: "misticos", aliases: [], desc: "Morte, decomposição, corrupção e drenagem de energia vital." },
  { id: "sombra", label: "Sombra", grupo: "misticos", aliases: ["trevas", "escuridao", "obscuro"], desc: "Trevas, escuridão sobrenatural e energias sombrias." },
  { id: "espiritual", label: "Espiritual", grupo: "misticos", aliases: ["alma"], desc: "Afeta diretamente a alma e a essência espiritual de um ser." },
  { id: "temporal", label: "Temporal", grupo: "misticos", aliases: ["tempo"], desc: "Manipulação do tempo, envelhecimento acelerado e distorções temporais." },
  { id: "corrupcao", label: "Corrupção", grupo: "misticos", aliases: [], desc: "Corrupção. Não tem níveis." },
  { id: "psiquico", label: "Psíquico", grupo: "mentais", aliases: ["mental"], desc: "Ataques mentais, manipulação da mente e destruição cognitiva." },
  { id: "venenoso", label: "Venenoso", grupo: "biologicos", aliases: ["veneno", "venoso"], desc: "Toxinas e venenos que prejudicam o organismo." },
  // Não oficiais (Notion): só aparecem no seletor quando o Mestre liga "Tipos de dano do Notion" no Escudo.
  { id: "queda", label: "Queda", grupo: "fisicos", aliases: [], extra: true, desc: "Dano de queda (Notion)." },
  { id: "balistico", label: "Balístico", grupo: "regionais", aliases: ["balistica"], extra: true, desc: "Projéteis de armas de fogo (Briavoterna)." },
  { id: "explosivo", label: "Explosivo", grupo: "regionais", aliases: ["explosao"], extra: true, desc: "Explosões e estilhaços (granadas, foguetes)." },
  { id: "energiaCortante", label: "Energia cortante", grupo: "regionais", aliases: ["energia (cortante)"], extra: true, desc: "Lâminas de energia (Genesis)." },
  { id: "energiaBalistica", label: "Energia balística", grupo: "regionais", aliases: ["energia (balistica)"], extra: true, desc: "Disparos de energia (Genesis)." },
  { id: "energiaExplosiva", label: "Energia explosiva", grupo: "regionais", aliases: ["energia (explosiva)"], extra: true, desc: "Explosões de energia (Genesis)." },
  { id: "energiaPerfurante", label: "Energia perfurante", grupo: "regionais", aliases: ["energia (perfurante)"], extra: true, desc: "Feixes perfurantes de energia (Genesis)." },
  { id: "sangue", label: "Sangue", grupo: "regionais", aliases: [], extra: true, desc: "Armas e magias feitas do próprio sangue (Atirador Arcano)." }
];

/**
 * Níveis de dano (hierarquia). Resistência, imunidade e RD têm um nível (padrão Natural) e só valem
 * contra dano do mesmo nível ou abaixo: resistência a Fogo (Natural) não segura Fogo (Verdadeiro).
 */
export const NIVEIS_DANO = [
  { id: "natural", label: "Natural", valor: 1 },
  { id: "magico", label: "Mágico", valor: 2 },
  { id: "verdadeiro", label: "Verdadeiro", valor: 3 },
  { id: "limbico", label: "Límbico", valor: 4 },
  { id: "arcaico", label: "Arcaico", valor: 5 }
];

/** Bônus situacionais de habilidades e magias (valem pela cena, viram um Bônus de cena na aba Combate). */
export const TIPOS_BONUS_SITUACIONAL = {
  rd: { label: "RD", texto: v => `+${v} de RD` },
  ca: { label: "CA", texto: v => `+${v} de CA` },
  dano: { label: "Dano", texto: v => `+${v} de dano` },
  acerto: { label: "Acerto", texto: v => `+${v} no teste de ataque` },
  testes: { label: "Testes", texto: v => `+${v} em todos os testes` },
  deslocamento: { label: "Deslocamento", texto: v => `+${v} m de deslocamento` },
  margem: { label: "Margem de ameaça", texto: v => `−${v} na margem de ameaça (crítico mais fácil)` },
  critMult: { label: "Multiplicador de crítico", texto: v => `+${v} no multiplicador de crítico` }
};
/**
 * Quando o bônus da habilidade entra (ativação condicional). Os automáticos disparam sozinhos uma vez por cena,
 * se o personagem tiver o custo; somem no fim do combate.
 */
export const GATILHOS_BONUS = {
  uso: "Ao usar",
  dano: "Ao sofrer dano (automático)",
  vida50: "Ao ficar com a Vida em 50% ou menos (automático)",
  vida25: "Ao ficar com a Vida em 25% ou menos (automático)",
  combate: "No começo do combate (automático)",
  critico: "Ao acertar um crítico (automático)"
};
/** Como a opção do bônus é escolhida. */
export const ESCOLHAS_BONUS = { escolher: "O jogador escolhe uma", rolar: "Rolar uma", todas: "Todas juntas" };

/** Tipos de dano sem níveis (vale contra qualquer proteção do tipo, em qualquer nível). */
export const TIPOS_SEM_NIVEL = ["corrupcao"];

/** Sugestões dos campos de tipo de dano: os tipos e os grupos (o nível é escolhido nos botões do seletor). */
export const SUGESTOES = {
  dano: [...TIPOS_DANO.filter(t => !t.extra).map(t => t.label), ...Object.entries(GRUPOS_DANO).filter(([id]) => id !== "regionais").map(([, l]) => l)],
  /** Tipos do Notion (não oficiais): entram nas sugestões quando o Mestre liga no Escudo. */
  danoExtra: [...TIPOS_DANO.filter(t => t.extra).map(t => t.label), GRUPOS_DANO.regionais]
};

/** Tipos de arma sugeridos (Arma Favorita do Combatente vale para um tipo). Dá para escrever outro. */
export const TIPOS_ARMA = [
  "Adaga", "Espada curta", "Espada longa", "Espada grande", "Katana", "Rapieira", "Machado", "Machado grande", "Maça", "Martelo",
  "Martelo de guerra", "Lança", "Alabarda", "Foice", "Cajado", "Chicote", "Manopla", "Desarmado", "Arco curto", "Arco longo",
  "Besta", "Arma de arremesso", "Funda", "Pistola", "Revólver", "Rifle", "Espingarda", "Submetralhadora", "Escudo"
];

/* -------------------------------------------- */
/*  Produção (profissões)                       */
/* -------------------------------------------- */

/** Dificuldades das receitas (CD do teste). */
export const DIFICULDADES_PRODUCAO = {
  baixa: { label: "Baixa", cd: 15 },
  media: { label: "Média", cd: 25 },
  superior: { label: "Superior", cd: 35 }
};

/** Regras gerais: 4 horas por profissão; um teste por profissão, no fim do processo. */
export const PRODUCAO = { horasPorProfissao: 4, historico: 12 };

/**
 * Profissões. "pericias": a primeira que existir na ficha é usada (por id ou nome); se nenhuma existir, Ofício.
 * O teste é 1d20 + perícia (sem o atributo dela) + o atributo da profissão.
 */
export const PROFISSOES = {
  forja: {
    label: "Forja", icone: "fa-solid fa-hammer", pericias: ["ferraria", "forja"], atributo: "forca",
    etapas: [
      ["Preparação", "Selecionar e examinar os materiais, preparar a fornalha e separar as ferramentas."],
      ["Aquecimento", "Levar o metal à temperatura adequada para ser trabalhado."],
      ["Modelagem", "Martelar, dobrar, esticar e dar forma à peça."],
      ["Tratamento", "Resfriamento, têmpera ou outro tratamento que muda as propriedades do metal."],
      ["Acabamento", "Remover imperfeições, afiar, polir e finalizar a peça."]
    ],
    resultado: "Equipamentos com +3 Pontos de Estrutura, além das propriedades da receita.", estrutura: 3
  },
  alquimia: {
    label: "Alquimia", icone: "fa-solid fa-flask", pericias: ["alquimia"], atributo: "inteligencia",
    etapas: [
      ["Preparação", "Separar, limpar e organizar os ingredientes e instrumentos."],
      ["Extração", "Retirar dos ingredientes as propriedades necessárias (moagem, fervura, destilação…)."],
      ["Composição", "Combinar os extratos nas proporções indicadas pela receita."],
      ["Transformação", "Produzir a reação alquímica desejada."],
      ["Estabilização", "Controlar a reação, resfriar e armazenar o produto final."]
    ],
    resultado: "Poções, óleos, pós, compostos, venenos e outros produtos alquímicos, conforme a receita."
  },
  ritual: {
    label: "Ritual mágico", icone: "fa-solid fa-circle-nodes", pericias: ["arcanismo"], atributo: "nucleo",
    etapas: [
      ["Preparação", "Escolher o local, reunir os materiais e preparar os componentes."],
      ["Inscrição", "Desenhar círculos, símbolos, runas e demais estruturas mágicas."],
      ["Condução", "Iniciar o ritual e direcionar a mana pelos símbolos e componentes."],
      ["Manifestação", "Executar a parte principal do ritual, produzindo o efeito mágico."],
      ["Fixação", "Estabilizar o resultado e encerrar o ritual corretamente."]
    ],
    resultado: "Efeitos ritualísticos: selamentos, invocações, proteções, alterações ambientais e outros da receita."
  },
  encantamento: {
    label: "Encantamento", icone: "fa-solid fa-wand-magic-sparkles", pericias: ["arcanismo"], atributo: "nucleo",
    etapas: [
      ["Preparação", "Escolher o objeto, reunir os materiais e preparar a mana necessária."],
      ["Escrita", "Registrar no objeto os símbolos, runas e inscrições do encantamento."],
      ["Imbuição de Mana", "Inserir mana na estrutura escrita, tornando-a funcional."],
      ["Alocação de Feitiço", "Inserir e conectar a magia desejada, definindo como funciona."]
    ],
    resultado: "Objetos encantados com os efeitos definidos pela receita."
  }
};

/* -------------------------------------------- */
/*  Idiomas do EPM (0.6.0)                      */
/* -------------------------------------------- */

export const IDIOMAS_EPM = ["Comum", "Dracônico", "Anão", "Élfico", "Mecânico", "Infernal", "Celestial", "Gigântico", "Silvestre", "Rúnico", "Goblin", "Serpentino", "Linguagem das Ruas", "Linguagem de Sinais"];
/** Existem no mundo, mas não podem ser escolhidos pelos jogadores (só o Mestre adiciona). */
export const IDIOMAS_PROIBIDOS = ["Abissal", "Carmesim", "Primordial", "Astral", "Titânico"];
export const NIVEIS_IDIOMA = {
  nativo: { label: "Nativo", texto: "Fala, lê e escreve como língua materna." },
  fluente: { label: "Fluente", texto: "Conversa e lê sem problemas." },
  basico: { label: "Básico", texto: "−5 em testes sociais nessa língua." }
};
export const REGRAS_IDIOMA = [
  "Aprender: 24 h / 2 PT para Básico, mais 48 h / 4 PT para Fluente.",
  "Linguística DT 20 permite entender o básico de uma língua parecida sem treino.",
  "Línguas arcanas (como a do Grimório): ler pede Conhecimentos Mágicos DT 25 e custa 1d6 de Sanidade."
];

/* -------------------------------------------- */
/*  Melhorias de itens (0.6.0: só a base)       */
/* -------------------------------------------- */

/** Base para a conversa futura sobre Melhorias de itens: categorias e limites provisórios, sem automação. */
export const CATEGORIAS_MELHORIA_ITEM = {
  modificacao: { label: "Modificação", limite: 3, icone: "fa-solid fa-screwdriver-wrench" },
  encantamento: { label: "Encantamento", limite: 2, icone: "fa-solid fa-wand-sparkles" },
  maldicaoBencao: { label: "Maldição ou Bênção de item", limite: 3, icone: "fa-solid fa-skull" },
  titulo: { label: "Título", limite: 2, icone: "fa-solid fa-award" }
};
