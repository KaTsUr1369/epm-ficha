/**
 * Catálogo de itens do EPM. Por enquanto só Umbra'Draxil (Tec 1); Briavoterna e Genesis voltam quando
 * terminar a revisão deles (a lista completa está no Projeto, em EPM/itens/itens-catalogo.mjs).
 *
 * Já com as mudanças aprovadas na conversa dos itens (EPM/itens/mudancas-itens.md): curas e consumíveis,
 * Poções de Proteção e de Resistência, nomes oficiais dos tipos de dano, Cristais de Mana, ajustes de armas
 * e armaduras, armaduras novas, Vestimentas, propriedades de proteção, os escudos oficiais, armas novas,
 * a propriedade Dupla, munição nova e as armas Exóticas (com o texto da Maestria).
 *
 * Só dados e contas puras (sem Foundry no topo). Preço em PO (1 PO = 10 PP = 100 PC), peso em kg.
 */
import { ARMAS_REGIAO, ARMADURAS_REGIAO, lerCritico } from "./catalogos.mjs";
import { imagemPadrao } from "./itens-imagens.mjs";

export const REGIOES_CATALOGO = { umbra: "Umbra'Draxil" };

export const CATEGORIAS_CATALOGO = [
  { id: "armas", label: "Armas", icone: "fa-solid fa-khanda" },
  { id: "armaduras", label: "Armaduras", icone: "fa-solid fa-shirt" },
  { id: "escudos", label: "Escudos", icone: "fa-solid fa-shield-halved" },
  { id: "vestimentas", label: "Vestimentas", icone: "fa-solid fa-vest" },
  { id: "municao", label: "Munição", icone: "fa-solid fa-bullseye" },
  { id: "pocoes", label: "Poções e elixires", icone: "fa-solid fa-flask" },
  { id: "medicina", label: "Medicina e curativos", icone: "fa-solid fa-kit-medical" },
  { id: "comida", label: "Comida e bebida", icone: "fa-solid fa-drumstick-bite" },
  { id: "arremesso", label: "Bombas e arremessáveis", icone: "fa-solid fa-bomb" },
  { id: "venenos", label: "Venenos", icone: "fa-solid fa-skull-crossbones" },
  { id: "aventura", label: "Equipamento de aventura", icone: "fa-solid fa-compass" },
  { id: "ferramentas", label: "Ferramentas e kits", icone: "fa-solid fa-screwdriver-wrench" },
  { id: "conjuracao", label: "Conjuração e música", icone: "fa-solid fa-wand-sparkles" },
  { id: "recipientes", label: "Mochilas e recipientes", icone: "fa-solid fa-suitcase" },
  { id: "minerios", label: "Minérios e metais", icone: "fa-solid fa-cubes-stacked" },
  { id: "especiais", label: "Materiais especiais", icone: "fa-solid fa-gem" },
  { id: "gemas", label: "Gemas e tesouros", icone: "fa-solid fa-coins" },
  { id: "recursos", label: "Recursos e peças", icone: "fa-solid fa-tree" },
  { id: "ervas", label: "Ervas e plantas", icone: "fa-solid fa-leaf" },
  { id: "criaturas", label: "Partes de criaturas", icone: "fa-solid fa-paw" }
];

/** Os 10 elementos oficiais das Poções de Proteção e de Resistência. */
export const ELEMENTOS = ["Ácido", "Fogo", "Frio", "Força", "Necrótico", "Psíquico", "Radiante", "Relâmpago", "Sonoro", "Venenoso"];

/* -------------------------------------------- */
/*  Propriedades de proteção (armaduras e escudos) */
/* -------------------------------------------- */

/** Propriedades que valem em Umbra'Draxil: comuns às eras, da Era Medieval e as exclusivas de escudo. */
export const PROPRIEDADES_PROTECAO = {
  "Reforçada": { tipo: "Positiva", efeito: "+1 na CA." },
  "Flexível": { tipo: "Positiva", efeito: "+1 em Esquiva." },
  "Articulada": { tipo: "Positiva", efeito: "Reduz em 1,5 m a penalidade de deslocamento da armadura." },
  "Camuflada": { tipo: "Condicional", efeito: "+2 em Furtividade num tipo de ambiente, escolhido ao comprar." },
  "Pesada": { tipo: "Negativa", efeito: "−1,5 m de deslocamento." },
  "Barulhenta": { tipo: "Negativa", efeito: "Desvantagem em Furtividade." },
  "Desajeitada": { tipo: "Negativa", efeito: "−2 em Esquiva e em Acrobacia." },
  "Acolchoada": { tipo: "Positiva", efeito: "RD 3 contra Contundente." },
  "Malha": { tipo: "Positiva", efeito: "RD 3 contra Cortante." },
  "Placas": { tipo: "Positiva", efeito: "RD 3 contra dano físico (Cortante, Perfurante e Contundente)." },
  "Escudada": { tipo: "Positiva", efeito: "+2 em Bloqueio." },
  "Aparada": { tipo: "Positiva", efeito: "+2 em Contra-ataque." },
  "Espinhosa": { tipo: "Condicional", efeito: "Quem acerta você corpo a corpo sofre 1d4 Perfurante." },
  "Ornamentada": { tipo: "Condicional", efeito: "+2 em testes sociais com quem reconhece os símbolos." },
  "Resistente ao Fogo": { tipo: "Positiva", efeito: "RD 5 contra Fogo." },
  "Resistente ao Frio": { tipo: "Positiva", efeito: "RD 5 contra Frio." },
  "Consagrada": { tipo: "Condicional", efeito: "RD 5 contra Necrótico; vantagem contra efeitos profanos (o Mestre define quais)." },
  "Rúnica": { tipo: "Especial", efeito: "Uma runa com efeito próprio, escrito no item." },
  "Encantada": { tipo: "Especial", efeito: "Tem 1 Encantamento (sistema de Melhorias)." },
  "Antimagia": { tipo: "Condicional", efeito: "RD 5 contra dano de magias; +2 nos testes para resistir a magias." },
  "Amaldiçoada": { tipo: "Especial", efeito: "Tem 1 Maldição de item: bônus em troca de penalidade (sistema de Melhorias)." },
  "Acoplável": { tipo: "Positiva", efeito: "Preso ao antebraço: a mão fica livre para segurar objetos leves.", escudo: true },
  "Instalável": { tipo: "Condicional", efeito: "Com uma Ação de Movimento, apoia no chão e vira cobertura até você se mover.", escudo: true },
  "Protetor": { tipo: "Condicional", efeito: "Como Reação, um aliado adjacente que for atacado usa a sua CA.", escudo: true },
  "Barreira": { tipo: "Condicional", efeito: "Aliados logo atrás de você ganham meia cobertura (+2 na CA).", escudo: true },
  "Transparente": { tipo: "Positiva", efeito: "Não tapa a visão: sem penalidade em Percepção enquanto se protege.", escudo: true },
  "Armada": { tipo: "Positiva", efeito: "Também é arma: 1d4 Perfurante, Leve.", escudo: true },
  "Dobrável": { tipo: "Positiva", efeito: "Fechado, ocupa o espaço de um livro; abrir ou fechar é Ação Bônus.", escudo: true },
  "Livre": { tipo: "Especial", efeito: "Não ocupa a mão: soma com arma de duas mãos.", escudo: true }
};

/* -------------------------------------------- */
/*  Ajudantes                                   */
/* -------------------------------------------- */

const U = "umbra";
const mod = (alvo, valor) => ({ tipo: "mod", alvo, valor });
const rd = (tipoDano, valor) => ({ tipo: "rd", tipoDano, valor });
const res = tipoDano => ({ tipo: "resistencia", tipoDano });
const cura = (recurso, formula) => ({ tipo: "cura", recurso, formula, quando: "uso" });

const slug = t => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Linha genérica: [nome, região, preço PO, peso kg, descrição, extras]. */
function lista(categoria, tipo, sub, linhas) {
  return linhas.map(([nome, regiao, preco, peso, desc = "", extra = {}]) => ({
    id: `${categoria}.${slug(nome)}`, nome, categoria, tipo, sub, regiao, preco, peso, desc, raridade: "comum", pacote: 1, ...extra
  }));
}

const CALMA = "Item de calma: só um deles (Chá Calmante, Incenso Tranquilizante ou Banquete) funciona por descanso.";

/* -------------------------------------------- */
/*  Armas                                       */
/* -------------------------------------------- */

/** Preço (PO) e peso (kg) das armas do Notion de Umbra'Draxil, pelo nome. */
const NOTION_ARMAS = {
  "Adaga": [2, 0.5], "Espada Curta": [10, 1], "Espada Longa": [15, 1.5], "Espada Bastarda": [35, 2], "Montante": [50, 3],
  "Machado de Mão": [5, 1], "Machado de Batalha": [30, 3], "Maça": [5, 2], "Martelo de Guerra": [25, 3], "Lança": [2, 1.5],
  "Alabarda": [20, 3], "Arco Curto": [25, 1], "Arco Longo": [50, 1.5], "Besta": [50, 3]
};
/** Armas do Notion que ganharam a propriedade Dupla (aprovado; o resto dos números continua igual). */
const NOTION_DUPLA = ["Adaga", "Espada Curta", "Machado de Mão"];

/** Maestria das armas Exóticas: texto e, quando der, o que muda na arma. */
export const MAESTRIAS = {
  "Katana": { texto: "Vira Leve e ganha Dupla.", propriedades: ["Leve", "Dupla"] },
  "Rapieira": { texto: "Crítico passa a 17–20.", critMargem: 17 },
  "Chicote": { texto: "Desarmar ou derrubar junto com o dano, em vez de no lugar dele." },
  "Kusarigama": { texto: "Enredar junto com o dano." },
  "Tridente": { texto: "Ao acertar, pode Agarrar o alvo sem gastar ação." },
  "Foice de Guerra": { texto: "Quando derruba um inimigo a 0 de Vida, faz um ataque extra contra outro adjacente (1 vez por rodada)." },
  "Lança de Cavalaria": { texto: "Sem desvantagem a pé." },
  "Besta de Mão": { texto: "Perde Recarga Lenta e ganha Dupla.", propriedades: ["Dupla"], semPropriedades: ["Recarga Lenta"] },
  "Zarabatana": { texto: "Venenos aplicados por ela têm +2 na DT." },
  "Arco Élfico": { texto: "Ignora meia cobertura." }
};

/** [nome, dano, crítico, alcance, tipo de dano, propriedades, perícia, preço, peso, extras]. */
const ARMAS_NOVAS = [
  ["Clava", "1d6", "", "Corpo a corpo", "Contundente", ["Leve"], "luta", 0.1, 1.5],
  ["Bordão", "1d6", "", "Corpo a corpo", "Contundente", ["Versátil"], "luta", 0.2, 2, { desc: "Cajado de madeira. Um conjurador pode prepará-lo como Foco Arcano." }],
  ["Soco-Inglês", "1d4", "", "Corpo a corpo", "Contundente", ["Leve", "Ocultável", "Dupla"], "luta", 2, 0.2, { desarmado: true, desc: "Conta como ataque desarmado (recebe os bônus de desarmado)." }],
  ["Manopla de Combate", "1d6", "", "Corpo a corpo", "Contundente", ["Leve", "Dupla"], "luta", 10, 1, { desarmado: true, desc: "Conta como ataque desarmado (recebe os bônus de desarmado)." }],
  ["Cimitarra", "1d6", "18", "Corpo a corpo", "Cortante", ["Acuidade", "Leve", "Dupla"], "luta", 25, 1.5],
  ["Sai (par)", "1d4", "", "Corpo a corpo", "Perfurante", ["Acuidade", "Leve", "Dupla"], "luta", 5, 1, { desc: "+2 nos testes para desarmar." }],
  ["Rapieira", "1d8", "18", "Corpo a corpo", "Perfurante", ["Acuidade", "Exótica"], "luta", 25, 1],
  ["Katana", "1d8", "18", "Corpo a corpo", "Cortante", ["Versátil", "Acuidade", "Exótica"], "luta", 50, 1.5],
  ["Mangual", "1d6+1d4", "19", "Corpo a corpo", "Contundente", ["Pesada"], "luta", 15, 2.5],
  ["Maça-Estrela", "1d8", "19", "Corpo a corpo", "Contundente, Perfurante", ["Pesada"], "luta", 15, 2],
  ["Picareta de Guerra", "1d6", "x4", "Corpo a corpo", "Perfurante", ["Anti-Blindagem"], "luta", 10, 2],
  ["Tridente", "1d8", "19", "Curto", "Perfurante", ["Arremessável", "Versátil", "Exótica"], "luta", 15, 2],
  ["Chicote", "1d4", "", "Curto", "Cortante", ["Acuidade", "Leve", "Exótica"], "luta", 2, 1.5, { desc: "Alcance de 3 m. Pode tentar desarmar ou derrubar no lugar do dano (o Mestre decide o teste)." }],
  ["Kusarigama", "1d6", "", "Curto", "Cortante", ["Acuidade", "Exótica"], "luta", 20, 1.5, { desc: "Alcance de 3 m. Pode Enredar no lugar do dano." }],
  ["Foice de Guerra", "2d4", "x4", "Corpo a corpo", "Cortante", ["Pesada", "Duas Mãos", "Exótica"], "luta", 30, 4],
  ["Glaive", "1d10", "x3", "Curto", "Cortante", ["Pesada", "Duas Mãos"], "luta", 20, 3],
  ["Machado Grande", "1d12", "x3", "Corpo a corpo", "Cortante", ["Pesada", "Duas Mãos"], "luta", 40, 3.5],
  ["Lança de Cavalaria", "1d12", "x3", "Curto", "Perfurante", ["Pesada", "Exótica"], "luta", 10, 3, { desc: "Montado, usa com uma mão. A pé, ataca com desvantagem." }],
  ["Azagaia", "1d6", "", "Médio", "Perfurante", ["Arremessável"], "pontaria", 0.5, 1],
  ["Dardos", "1d4", "", "Curto", "Perfurante", ["Arremessável", "Leve", "Acuidade"], "pontaria", 0.5, 1, { pacote: 10, desc: "Pacote com 10 dardos." }],
  ["Funda", "1d4", "", "Médio", "Contundente", ["Leve", "Silenciosa"], "pontaria", 0.1, 0.1, { desc: "Usa Pedras de Funda (ou pedras comuns, com −2 no dano)." }],
  ["Zarabatana", "1", "", "Curto", "Perfurante", ["Silenciosa", "Ocultável", "Exótica"], "pontaria", 10, 0.5, { desc: "Feita para veneno: usa Dardos de Zarabatana e aplica um veneno preparado." }],
  ["Besta de Mão", "1d6", "19", "Curto", "Perfurante", ["Leve", "Recarga Lenta", "Ocultável", "Exótica"], "pontaria", 75, 1.5],
  ["Besta Pesada", "1d12", "19/x3", "Longo", "Perfurante", ["Pesada", "Duas Mãos", "Recarga Lenta", "Longo Alcance"], "pontaria", 100, 8],
  ["Arco Élfico", "1d12", "18/x3", "Longo", "Perfurante", ["Longo Alcance", "Silenciosa", "Duas Mãos", "Exótica"], "pontaria", 300, 1, { raridade: "rara" }]
];

function armas() {
  const out = [];
  for (const x of ARMAS_REGIAO.umbra ?? []) {
    const [preco, peso] = NOTION_ARMAS[x.nome] ?? [0, 1];
    const propriedades = NOTION_DUPLA.includes(x.nome) ? [...x.propriedades, "Dupla"] : [...x.propriedades];
    out.push({
      id: `armas.${slug(x.nome)}`, nome: x.nome, categoria: "armas", tipo: "weapon", sub: "", regiao: U, preco, peso, raridade: "comum", pacote: 1, notion: true, desc: "",
      arma: { dano: x.dano, critMargem: x.critMargem, critMult: x.critMult, alcance: x.alcance, tipoDano: x.tipoDano, propriedades, pericia: x.pericia, desarmado: false }
    });
  }
  for (const [nome, dano, crit, alcance, tipoDano, propriedades, pericia, preco, peso, extra = {}] of ARMAS_NOVAS) {
    const c = lerCritico(crit);
    const { desarmado = false, ...resto } = extra;
    const maestria = propriedades.includes("Exótica") ? MAESTRIAS[nome] ?? null : null;
    out.push({
      id: `armas.${slug(nome)}`, nome, categoria: "armas", tipo: "weapon", sub: "", regiao: U, preco, peso, raridade: "comum", pacote: 1, desc: "",
      ...resto, ...(maestria ? { maestria } : {}),
      arma: { dano, critMargem: c.margem, critMult: c.mult, alcance, tipoDano, propriedades, pericia, desarmado }
    });
  }
  return out;
}

/* -------------------------------------------- */
/*  Armaduras, escudos e vestimentas            */
/* -------------------------------------------- */

const NOTION_ARMADURAS = {
  "Armadura de Couro": [10, 5], "Gambeson": [5, 4], "Gambeson Reforçado": [20, 6], "Cota de Malha": [75, 15], "Brigandina": [150, 15],
  "Armadura de Placas": [1500, 25], "Armadura de Cavaleiro Real": [3000, 28, "rara"], "Armadura de Cavaleiro Sagrado": [3500, 26, "rara"],
  "Armadura do Campeão": [8000, 30, "epica"], "Armadura Dracônica": [25000, 28, "lendaria"]
};

/** [nome, tipo, defesa, desvantagem, especial, efeitos, preço, peso, raridade]. */
const ARMADURAS_NOVAS = [
  ["Couro Batido", "leve", 2, "Nenhuma", "+1 em Furtividade", [mod("pericia.furtividade", 1)], 15, 6],
  ["Couro de Basilisco", "leve", 3, "Nenhuma", "Resistência a Venenoso", [res("Venenoso")], 1200, 4, "rara"],
  ["Armadura de Peles", "media", 3, "−1 em Furtividade", "Vantagem para resistir ao frio", [mod("pericia.furtividade", -1)], 10, 6],
  ["Cota de Escamas", "media", 4, "−2 em Furtividade", "RD 3 contra Perfurante", [mod("pericia.furtividade", -2), rd("Perfurante", 3)], 50, 20],
  ["Peitoral de Aço", "media", 5, "−1 em Furtividade", "", [mod("pericia.furtividade", -1)], 175, 10],
  ["Armadura de Talas", "pesada", 6, "−3 m de deslocamento e −5 em Furtividade", "Sem RD", [mod("deslocamento", -3), mod("pericia.furtividade", -5)], 600, 27]
];

const TIPOS_ARM = { leve: "Leve", media: "Média", pesada: "Pesada" };

function armaduras() {
  const out = [];
  for (const x of ARMADURAS_REGIAO.umbra ?? []) {
    const [preco, peso, raridade = "comum"] = NOTION_ARMADURAS[x.nome] ?? [0, 5];
    out.push({
      id: `armaduras.${slug(x.nome)}`, nome: x.nome, categoria: "armaduras", tipo: "equipment", sub: x.tipo, regiao: U, preco, peso, raridade, pacote: 1, notion: true, desc: "",
      armadura: { tipo: x.tipo, defesa: x.defesa, desvantagem: x.desvantagem, especial: x.especial, estaminaPorTurno: x.estaminaPorTurno ?? 0 }, efeitos: x.efeitos
    });
  }
  for (const [nome, tipo, defesa, desvantagem, especial, efeitos, preco, peso, raridade = "comum"] of ARMADURAS_NOVAS) {
    out.push({
      id: `armaduras.${slug(nome)}`, nome, categoria: "armaduras", tipo: "equipment", sub: tipo, regiao: U, preco, peso, raridade, pacote: 1, desc: "",
      armadura: { tipo, defesa, desvantagem, especial, estaminaPorTurno: 0 }, efeitos
    });
  }
  return out;
}

/** Escudos oficiais (Notion) e extras. [nome, tipo, defesa, efeito, efeitos automáticos, propriedades, preço, peso, raridade]. */
const ESCUDOS = [
  ["Broquel", "Leve", 1, "+3 na defesa de Contra-ataque", [mod("defesa.contra", 3)], ["Acoplável"], 5, 1.5],
  ["Escudo de Madeira", "Leve", 2, "+2 na CA contra ataques à distância", [], [], 10, 3],
  ["Escudo Redondo", "Leve", 2, "+2 na CA contra ataques corpo a corpo", [], [], 15, 3],
  ["Escudo com Cravos", "Leve", 2, "", [], ["Armada"], 20, 3.5],
  ["Escudo de Ferro", "Médio", 3, "RD 5", [rd("", 5)], [], 75, 5],
  ["Escudo Rúnico", "Médio", 3, "Runa: RD 5 contra Fogo, Frio e Relâmpago", [rd("Fogo, Frio, Relâmpago", 5)], ["Rúnica"], 900, 5, "rara"],
  ["Escudo Kite (Cavaleiro)", "Médio", 4, "Meia cobertura (+2 na CA) ao usar Bloqueio", [], ["Ornamentada"], 150, 6],
  ["Escudo Torre", "Pesado", 5, "RD 5", [rd("", 5), mod("deslocamento", -1.5)], ["Instalável", "Pesada"], 600, 12],
  ["Escudo Real", "Pesado", 5, "RD 5", [rd("", 5)], ["Protetor", "Ornamentada"], 1500, 10, "rara"],
  ["Escudo Dracônico", "Pesado", 6, "RD 10", [rd("", 10)], ["Protetor", "Encantada", "Acoplável"], 20000, 8, "lendaria"]
];

function escudos() {
  return ESCUDOS.map(([nome, tipoEscudo, defesa, efeito, efeitos, propriedades, preco, peso, raridade = "comum"]) => ({
    id: `escudos.${slug(nome)}`, nome, categoria: "escudos", tipo: "equipment", sub: "shield", regiao: U, preco, peso, raridade, pacote: 1, desc: efeito,
    armadura: { tipo: "escudo", tipoEscudo, defesa, desvantagem: "", especial: "", estaminaPorTurno: 0 }, efeitos, escudo: true, propriedades
  }));
}

/** Vestimentas: não contam como proteção (sem CA, não ocupam o lugar da armadura). */
const VESTIMENTAS = lista("vestimentas", "equipment", "clothing", [
  ["Roupas Comuns", U, 0.5, 1.5, ""],
  ["Roupas de Viagem", U, 2, 2, ""],
  ["Roupas Finas", U, 15, 3, "Vestido assim, ambientes nobres o recebem melhor."],
  ["Traje de Nobre", U, 75, 3, "Vantagem em Diplomacia com a nobreza (o Mestre decide quando vale)."],
  ["Roupas de Inverno", U, 5, 3, "Vantagem em testes para resistir ao frio."],
  ["Capa com Capuz", U, 1, 1, ""],
  ["Manto Élfico", U, 250, 0.5, "Usando: +2 em Furtividade.", { efeitos: [mod("pericia.furtividade", 2)], raridade: "rara" }],
  ["Vestes do Arquimago", U, 1500, 1.5, "Usando: +2 em Arcanismo.", { efeitos: [mod("pericia.arcanismo", 2)], raridade: "rara" }]
]);

/* -------------------------------------------- */
/*  Munição                                     */
/* -------------------------------------------- */

const MUNICAO = lista("municao", "consumable", "ammo", [
  ["Flechas", U, 1, 1, "Pacote com 20 flechas para arcos.", { pacote: 20 }],
  ["Virotes", U, 1, 1.5, "Pacote com 20 virotes para bestas.", { pacote: 20 }],
  ["Pedras de Funda", U, 0.04, 1.5, "Pacote com 20 pedras arredondadas.", { pacote: 20 }],
  ["Dardos de Zarabatana", U, 0.5, 0.1, "Pacote com 20 dardos para a Zarabatana.", { pacote: 20 }],
  ["Flechas de Prata", U, 25, 0.3, "Pacote com 5. Ignoram a resistência de mortos-vivos, licantropos e demônios.", { pacote: 5, raridade: "rara" }],
  ["Flechas Incendiárias", U, 10, 0.3, "Pacote com 5. +1d6 de dano de Fogo; o alvo pode ficar Queimado.", { pacote: 5, formula: "1d6[Fogo]" }]
]);

/* -------------------------------------------- */
/*  Poções e elixires                           */
/* -------------------------------------------- */

const POCOES = lista("pocoes", "consumable", "potion", [
  ["Poção de Vida Pequena", U, 25, 0.3, "Beber: Ação Bônus. Recupera 2d8 + 4 de Vida.", { efeitos: [cura("pv", "2d8 + 4")] }],
  ["Poção de Vida Média", U, 75, 0.3, "Beber: Ação Bônus. Recupera 4d8 + 8 de Vida.", { efeitos: [cura("pv", "4d8 + 8")] }],
  ["Poção de Vida Grande", U, 250, 0.4, "Beber: Ação Padrão. Recupera 8d8 + 16 de Vida.", { efeitos: [cura("pv", "8d8 + 16")], raridade: "rara" }],
  ["Poção de Vida Superior", U, 1000, 0.4, "Beber: Ação Padrão. Recupera 12d10 + 30 de Vida.", { efeitos: [cura("pv", "12d10 + 30")], raridade: "epica" }],
  ["Poção de Vida Suprema", U, 5000, 0.5, "Beber: Ação Padrão. Recupera 20d10 + 60 de Vida.", { efeitos: [cura("pv", "20d10 + 60")], raridade: "lendaria" }],
  ["Poção de Mana Pequena", U, 30, 0.3, "Beber: Ação Bônus. Recupera 2d6 + 4 de Mana.", { efeitos: [cura("pm", "2d6 + 4")] }],
  ["Poção de Mana Média", U, 90, 0.3, "Beber: Ação Bônus. Recupera 4d6 + 8 de Mana.", { efeitos: [cura("pm", "4d6 + 8")] }],
  ["Poção de Mana Grande", U, 300, 0.4, "Beber: Ação Padrão. Recupera 6d10 + 15 de Mana.", { efeitos: [cura("pm", "6d10 + 15")], raridade: "rara" }],
  ["Poção de Mana Superior", U, 1200, 0.4, "Beber: Ação Padrão. Recupera 10d10 + 30 de Mana.", { efeitos: [cura("pm", "10d10 + 30")], raridade: "epica" }],
  ["Poção de Mana Suprema", U, 6000, 0.5, "Beber: Ação Padrão. Recupera 16d10 + 50 de Mana.", { efeitos: [cura("pm", "16d10 + 50")], raridade: "lendaria" }],
  ["Tônico de Estamina Pequeno", U, 20, 0.3, "Beber: Ação Bônus. Recupera 2d6 + 4 de Estamina.", { efeitos: [cura("pe", "2d6 + 4")] }],
  ["Tônico de Estamina Médio", U, 60, 0.3, "Beber: Ação Bônus. Recupera 4d6 + 8 de Estamina.", { efeitos: [cura("pe", "4d6 + 8")] }],
  ["Tônico de Estamina Grande", U, 200, 0.4, "Beber: Ação Padrão. Recupera 6d10 + 15 de Estamina.", { efeitos: [cura("pe", "6d10 + 15")], raridade: "rara" }],
  ["Tônico de Estamina Superior", U, 800, 0.4, "Beber: Ação Padrão. Recupera 10d10 + 30 de Estamina.", { efeitos: [cura("pe", "10d10 + 30")], raridade: "epica" }],
  ["Elixir Restaurador", U, 250, 0.4, "Beber: Ação Padrão. Recupera 4d8 + 8 de Vida, Mana e Estamina.", { efeitos: [cura("pv", "4d8 + 8"), cura("pm", "4d8 + 8"), cura("pe", "4d8 + 8")], raridade: "rara" }],
  ["Chá Calmante", U, 5, 0.2, `Recupera 1d4 + 1 de Sanidade. Precisa de alguns minutos de calma. ${CALMA}`, { efeitos: [cura("ps", "1d4 + 1")] }],
  ["Incenso Tranquilizante", U, 15, 0.1, `Queimado durante um descanso: recupera 1d6 + 2 de Sanidade. ${CALMA}`, { efeitos: [cura("ps", "1d6 + 2")] }],
  ["Tônico da Lucidez", U, 60, 0.3, "Beber: Ação Bônus. Recupera 2d6 + 4 de Sanidade.", { efeitos: [cura("ps", "2d6 + 4")], raridade: "rara" }],
  ["Elixir da Mente Serena", U, 800, 0.3, "Recupera 4d6 + 8 de Sanidade e remove Amedrontado, Abalado e Confuso.", { efeitos: [cura("ps", "4d6 + 8")], removeCondicoes: ["amedrontado", "abalado", "confuso"], raridade: "epica" }],
  ["Lágrima de Anjo", U, 5000, 0.1, "Recupera 6d10 + 10 de Sanidade e remove uma insanidade temporária (o Mestre escolhe).", { efeitos: [cura("ps", "6d10 + 10")], raridade: "lendaria" }],
  ["Poção de Coragem", U, 30, 0.3, "Remove Amedrontado, Assustado e Apavorado.", { removeCondicoes: ["amedrontado", "assustado", "apavorado"] }],
  ["Poção de Força do Gigante", U, 120, 0.3, "+1d6 de dano nos ataques pela cena.", { bonusUso: { texto: "+1d6 de dano", dano: "1d6" }, raridade: "rara" }],
  ["Poção de Pele de Pedra", U, 150, 0.3, "RD 5 contra todos os danos pela cena.", { bonusUso: { texto: "RD 5", rd: 5 }, raridade: "rara" }],
  ["Poção de Agilidade", U, 150, 0.3, "+2 na CA e +3 m de deslocamento pela cena.", { bonusUso: { texto: "+2 CA e +3 m", ca: 2, deslocamento: 3 }, raridade: "rara" }],
  ["Poção de Precisão", U, 150, 0.3, "+3 no acerto pela cena.", { bonusUso: { texto: "+3 no acerto", acerto: 3 }, raridade: "rara" }],
  ["Poção de Foco", U, 200, 0.3, "+2 em todos os testes pela cena.", { bonusUso: { texto: "+2 nos testes", testes: 2 }, raridade: "rara" }],
  ...ELEMENTOS.map(el => [`Poção de Proteção contra ${el}`, U, 100, 0.3,
    `RD 10 contra ${el} pela cena, em qualquer nível de dano. Soma com a Poção de Resistência: primeiro a Resistência corta o dano pela metade, depois a RD é descontada.`,
    { bonusUso: { texto: `RD 10 (${el})`, rd: 10, rdTipo: el }, raridade: "rara" }]),
  ...ELEMENTOS.map(el => [`Poção de Resistência a ${el}`, U, 250, 0.3,
    `Resistência a ${el} (metade do dano) pela cena, só no nível Normal. Soma com a Poção de Proteção.`,
    { bonusUso: { texto: `Resistência a ${el}`, resTipo: el }, raridade: "rara" }]),
  ["Poção de Visão no Escuro", U, 50, 0.3, "Enxerga no escuro até 18 m por 1 hora."],
  ["Poção de Respirar na Água", U, 40, 0.3, "Respira debaixo d'água por 1 hora."],
  ["Poção de Invisibilidade", U, 800, 0.3, "Fica Invisível por 1 minuto ou até atacar ou conjurar.", { aplicaCondicoes: ["invisivel"], raridade: "epica" }],
  ["Poção de Voo", U, 900, 0.3, "Voa com o próprio deslocamento por 10 minutos.", { aplicaCondicoes: ["voando"], raridade: "epica" }],
  ["Poção do Gigante (Aumentar)", U, 500, 0.4, "Fica um tamanho maior por 1 minuto: +1d4 de dano corpo a corpo e vantagem em testes de Força.", { bonusUso: { texto: "+1d4 de dano (aumentado)", dano: "1d4" }, raridade: "rara" }]
]);

/* -------------------------------------------- */
/*  Medicina e curativos                        */
/* -------------------------------------------- */

const MEDICINA = lista("medicina", "consumable", "trinket", [
  ["Bandagens", U, 0.5, 0.1, "Ação Padrão: recupera 1d4 de Vida e para o sangramento. A cura vale uma vez por hora por alvo; parar o sangramento não tem limite.", { efeitos: [cura("pv", "1d4")], removeCondicoes: ["sangrando"], pacote: 5 }],
  ["Erva Curativa Mastigável", U, 1, 0.05, "Ação Padrão: recupera 1d6 de Vida (uma vez por hora).", { efeitos: [cura("pv", "1d6")] }],
  ["Antitoxina", U, 50, 0.1, "Vantagem em testes contra venenos por 1 hora."],
  ["Antídoto", U, 30, 0.1, "Remove Envenenado.", { removeCondicoes: ["envenenado"] }],
  ["Elixir Purificador", U, 60, 0.2, "Remove Enfermo e Doente.", { removeCondicoes: ["enfermo", "doente"] }],
  ["Sais de Cheiro", U, 10, 0.05, "Acorda: remove Inconsciente e Dormindo (não funciona com 0 de Vida).", { removeCondicoes: ["inconsciente", "dormindo"] }],
  ["Colírio", U, 8, 0.05, "Remove Ofuscado e a cegueira não mágica.", { removeCondicoes: ["ofuscado", "cego"] }],
  ["Unguento para Queimaduras", U, 15, 0.1, "Recupera 1d6 de Vida e remove Queimado.", { efeitos: [cura("pv", "1d6")], removeCondicoes: ["queimado"] }],
  ["Tala e Faixas", U, 5, 0.5, "Imobiliza um osso: remove Fraturado depois de um descanso longo (narrativo).", {}],
  ["Kit de Curandeiro", U, 5, 1.5, "10 usos. Estabiliza quem está Morrendo sem teste de Medicina.", { cargas: 10 }]
]);

/* -------------------------------------------- */
/*  Comida e bebida                             */
/* -------------------------------------------- */

const COMIDA = lista("comida", "consumable", "food", [
  ["Rações (1 dia)", U, 0.5, 1, "Comida de viagem para um dia."],
  ["Odre (água)", U, 0.2, 2, "Água para um dia de viagem. Vazio, pode ser enchido de novo."],
  ["Pão", U, 0.02, 0.5, ""],
  ["Carne Seca", U, 0.05, 0.3, ""],
  ["Queijo", U, 0.1, 0.5, ""],
  ["Frutas", U, 0.01, 0.3, ""],
  ["Refeição de Taverna", U, 0.3, 0, "Prato quente e bebida."],
  ["Banquete", U, 10, 0, `Refeição farta para uma pessoa. Num descanso, recupera +1d6 de Sanidade. ${CALMA}`, { efeitos: [cura("ps", "1d6")] }],
  ["Cerveja (caneca)", U, 0.04, 0.5, "Bebida alcoólica fraca."],
  ["Hidromel", U, 0.5, 1, "Bebida alcoólica de mel."],
  ["Vinho (garrafa)", U, 2, 1.5, "Bebida alcoólica."],
  ["Saquê", U, 0.5, 1, "Bebida alcoólica. Cada dose seguida: Fortitude DT 10 (+2 por dose); se falhar, fica Bêbado."],
  ["Aguardente", U, 1, 1, "Destilado forte. Fortitude DT 14 por dose; se falhar, fica Bêbado."]
]);

/* -------------------------------------------- */
/*  Bombas e arremessáveis                      */
/* -------------------------------------------- */

const ARREMESSO = lista("arremesso", "consumable", "trinket", [
  ["Óleo (frasco)", U, 0.1, 0.5, "Combustível de lampião ou arma improvisada: espalhado e aceso, causa 1d4 de Fogo por turno em 1,5 m.", { formula: "1d4[Fogo]" }],
  ["Fogo Alquímico", U, 50, 0.5, "Arremesso (9 m): 1d6 de Fogo; o alvo fica Queimado (apaga com uma Ação).", { formula: "1d6[Fogo]" }],
  ["Frasco de Ácido", U, 25, 0.5, "Arremesso (6 m): 2d6 de Ácido.", { formula: "2d6[Ácido]" }],
  ["Água Benta", U, 25, 0.5, "Arremesso (6 m): 2d6 Radiante em mortos-vivos e demônios.", { formula: "2d6[Radiante]" }],
  ["Bomba de Fumaça", U, 15, 0.3, "Nuvem de 3 m de raio por 1 minuto: tudo dentro fica com camuflagem total."],
  ["Pó de Cegueira", U, 20, 0.1, "Arremesso (3 m): Fortitude DT 13 ou fica Ofuscado por 1 rodada."],
  ["Bolsa de Cola", U, 50, 0.5, "Arremesso (6 m): Reflexos DT 14 ou fica Enredado."],
  ["Estrepes", U, 1, 1, "Saco que cobre 1,5 m: quem pisar sofre 1d4 Perfurante e −3 m de deslocamento.", { formula: "1d4[Perfurante]" }]
]);

/* -------------------------------------------- */
/*  Venenos                                     */
/* -------------------------------------------- */

const VENENOS = lista("venenos", "consumable", "poison", [
  ["Veneno Simples", U, 50, 0.1, "Aplicar na arma (Ação Padrão): o próximo acerto causa +1d6 Venenoso e o alvo faz Fortitude DT 13 ou fica Envenenado.", { formula: "1d6[Venenoso]" }],
  ["Peçonha de Aranha Gigante", U, 150, 0.1, "Na arma: +2d6 Venenoso no próximo acerto; Fortitude DT 15 ou fica Envenenado e Lento.", { formula: "2d6[Venenoso]", raridade: "rara" }],
  ["Essência de Beladona", U, 100, 0.1, "Ingerida: Fortitude DT 15 ou sofre 3d6 Venenoso e fica Enjoado.", { formula: "3d6[Venenoso]", raridade: "rara" }],
  ["Pó Sonífero", U, 200, 0.1, "Soprado ou ingerido: Fortitude DT 14 ou fica Dormindo por 1 minuto (acorda ao sofrer dano).", { raridade: "rara" }],
  ["Essência Paralisante", U, 500, 0.1, "Na arma: +1d6 Venenoso no próximo acerto; Fortitude DT 17 ou fica Paralisado até o fim do próximo turno.", { formula: "1d6[Venenoso]", raridade: "epica" }]
]);

/* -------------------------------------------- */
/*  Equipamento de aventura                     */
/* -------------------------------------------- */

const AVENTURA = [
  ...lista("aventura", "consumable", "trinket", [
    ["Tocha", U, 0.01, 0.5, "Acesa, ilumina 6 m (e luz fraca até 12 m) por 1 hora. Usada como arma: 1d4 de Fogo.", { formula: "1d4[Fogo]" }],
    ["Vela", U, 0.01, 0.1, "Ilumina 1,5 m por 1 hora."],
    ["Óleo de Lampião", U, 0.1, 0.5, "Abastece um lampião ou lanterna por 6 horas."]
  ]),
  ...lista("aventura", "loot", "gear", [
    ["Kit de Aventura", U, 10, 12, "Mochila, saco de dormir, pederneira, 10 tochas, 5 rações, odre e 15 m de corda de cânhamo."],
    ["Ábaco", U, 1, 1, "Ferramenta de cálculo manual."],
    ["Ampulheta", U, 25, 0.5, "Mede a passagem do tempo."],
    ["Balde", U, 0.05, 1, "Carrega líquidos (12 litros)."],
    ["Corda de Cânhamo (15 m)", U, 1, 5, "Escalada e amarras. Romper: Atletismo DT 17."],
    ["Corda de Seda (15 m)", U, 10, 2.5, "Mais leve e resistente. Romper: Atletismo DT 20."],
    ["Escada Portátil (3 m)", U, 0.1, 12, "Subida rápida."],
    ["Gancho de Escalada", U, 2, 2, "Preso a uma corda, auxilia a subida."],
    ["Lanterna Coberta", U, 5, 1, "Luz controlada: 9 m, ou só um feixe com a tampa."],
    ["Lanterna Furta-Fogo", U, 10, 1, "Luz constante em cone de 18 m."],
    ["Lampião", U, 0.5, 1, "Ilumina 4,5 m por 6 horas de óleo."],
    ["Sino", U, 1, 0.1, "Alerta sonoro."],
    ["Tenda (2 pessoas)", U, 2, 10, "Abrigo portátil."],
    ["Saco de Dormir", U, 1, 3, ""],
    ["Cobertor", U, 0.5, 1.5, ""],
    ["Pederneira e Isca", U, 0.5, 0.1, "Acende fogo em 1 minuto."],
    ["Giz", U, 0.01, 0, "Marca caminhos e paredes."],
    ["Espelho de Aço", U, 5, 0.25, "Ver em volta de cantos e sinalizar com o sol."],
    ["Corrente (3 m)", U, 5, 5, "Romper: Atletismo DT 25."],
    ["Cadeado", U, 10, 0.5, "Abrir sem a chave: Crime DT 18."],
    ["Algemas", U, 2, 3, "Escapar: Acrobacia DT 20 ou Atletismo DT 22."],
    ["Pitons (10)", U, 0.05, 1, "Grampos de escalada."],
    ["Martelo", U, 1, 1.5, ""],
    ["Lona", U, 1, 2, ""],
    ["Cantil", U, 0.2, 1, "Guarda 1 litro."],
    ["Panela de Ferro", U, 0.2, 5, ""],
    ["Kit de Pesca", U, 1, 2, "Vara, linha, anzóis e iscas."],
    ["Kit de Escalada", U, 25, 6, "Pitons, botas com cravos e luvas: vantagem em Atletismo para escalar."],
    ["Vara de 3 m", U, 0.05, 3.5, "Testa o chão e aciona armadilhas de longe."],
    ["Rede de Pesca", U, 1, 1.5, ""],
    ["Apito", U, 0.05, 0, ""],
    ["Papel (10 folhas)", U, 2, 0.1, ""],
    ["Tinta e Pena", U, 10, 0.1, ""],
    ["Livro em Branco", U, 25, 2.5, ""],
    ["Mapa da Região", U, 10, 0.1, "Vantagem em Sobrevivência para se orientar na região do mapa."],
    ["Luneta", U, 1000, 0.5, "Vê objetos distantes como se estivessem 10× mais perto.", { raridade: "rara" }]
  ])
];

/* -------------------------------------------- */
/*  Ferramentas e kits                          */
/* -------------------------------------------- */

const FERRAMENTAS = lista("ferramentas", "tool", "", [
  ["Ferramentas de Ladrão", U, 25, 0.5, "Necessárias para abrir fechaduras e desarmar armadilhas (Crime)."],
  ["Kit de Disfarce", U, 25, 1.5, "Alterar a aparência."],
  ["Kit de Falsificação", U, 15, 2.5, "Criar documentos falsos."],
  ["Kit de Herbalismo", U, 5, 1.5, "Trabalhar com plantas; fazer poções simples."],
  ["Kit Botânico", U, 10, 1.5, "Coletar e conservar plantas e ingredientes mágicos."],
  ["Kit de Venenos", U, 50, 1, "Produzir e aplicar venenos com segurança."],
  ["Kit Mecânico", U, 30, 4, "Consertar e montar mecanismos."],
  ["Pá", U, 2, 2.5, "Escavar."],
  ["Pé de Cabra", U, 2, 2.5, "Forçar objetos: vantagem em Atletismo para abrir portas e baús."],
  ["Picareta de Mineração", U, 2, 5, "Extrair minérios."],
  ["Ferramentas de Ferreiro", U, 20, 4, "Forjar e consertar armas e armaduras; fazer Modificações."],
  ["Ferramentas de Alquimista", U, 50, 4, "Fazer poções, ácidos e fogo alquímico."],
  ["Ferramentas de Carpinteiro", U, 8, 3, ""],
  ["Ferramentas de Joalheiro", U, 25, 1, "Lapidar gemas e avaliar tesouros."],
  ["Ferramentas de Cartógrafo", U, 15, 3, ""],
  ["Ferramentas de Navegação", U, 25, 1, ""],
  ["Ferramentas de Costureiro", U, 1, 2.5, ""],
  ["Ferramentas de Cozinheiro", U, 1, 4, ""],
  ["Kit de Caligrafia", U, 10, 2.5, ""],
  ["Ferramentas de Encantador", U, 100, 2, "Ofício (Encantador): imbuir Encantamentos em itens.", { raridade: "rara" }]
]);

/* -------------------------------------------- */
/*  Conjuração e música                         */
/* -------------------------------------------- */

const CRISTAL = "Quebrar o cristal é Ação Livre, limitada a 1 cristal por turno.";

const CONJURACAO = [
  ...lista("conjuracao", "loot", "gear", [
    ["Foco Arcano (Cristal)", U, 10, 0.5, "Canaliza a mana do conjurador."],
    ["Varinha", U, 10, 0.5, "Foco Arcano."],
    ["Orbe", U, 20, 1.5, "Foco Arcano."],
    ["Grimório", U, 25, 1.5, "Guarda as magias conhecidas."],
    ["Livro de Runas", U, 30, 1.5, ""],
    ["Símbolo Sagrado", U, 5, 0.5, "Foco divino."],
    ["Giz Arcano", U, 0.5, 0, "Desenha círculos e runas."],
    ["Pergaminho em Branco", U, 1, 0, ""],
    ["Tinta Arcana", U, 20, 0.1, "Escreve pergaminhos e runas."],
    ["Pergaminho de Encantamento", U, 20000, 0, "Identificar o encantamento: Conhecimentos Mágicos DT 35. Imbuir no item: Arcanismo DT 70. O item ganha +1 vaga de Encantamento (máximo 3).", { raridade: "lendaria" }]
  ]),
  ...lista("conjuracao", "consumable", "trinket", [
    ["Componentes Mágicos", U, 1, 0.5, "Bolsa com 20 componentes; gasta 1 por magia que pedir.", { pacote: 20 }],
    ["Fragmento de Cristal de Mana", U, 40, 0.1, `Quebrado: recupera 2d6 + 2 de Mana. ${CRISTAL}`, { efeitos: [cura("pm", "2d6 + 2")] }],
    ["Cristal de Mana Carregado", U, 400, 0.3, `Quebrado: recupera 6d6 + 10 de Mana. ${CRISTAL}`, { efeitos: [cura("pm", "6d6 + 10")], raridade: "rara" }]
  ]),
  ...lista("conjuracao", "tool", "music", [
    ["Flauta", U, 2, 0.5, "Instrumento (Performance; foco de Trovador)."],
    ["Tambor", U, 6, 1.5, "Instrumento (Performance; foco de Trovador)."],
    ["Lira", U, 30, 1, "Instrumento (Performance; foco de Trovador)."],
    ["Alaúde", U, 35, 1, "Instrumento (Performance; foco de Trovador)."],
    ["Violino", U, 50, 0.5, "Instrumento (Performance; foco de Trovador)."]
  ])
];

/* -------------------------------------------- */
/*  Mochilas e recipientes                      */
/* -------------------------------------------- */

const RECIPIENTES = lista("recipientes", "container", "", [
  ["Algibeira", U, 0.1, 0.5, "Bolsa de cinto.", { capacidade: 3 }],
  ["Saco", U, 0.01, 0.25, "Transporte simples.", { capacidade: 15 }],
  ["Mochila", U, 2, 2.5, "Armazena equipamentos.", { capacidade: 30 }],
  ["Aljava", U, 1, 0.5, "Guarda até 20 flechas ou virotes.", { capacidade: 2 }],
  ["Estojo de Pergaminhos", U, 1, 0.5, "", { capacidade: 1 }],
  ["Baú", U, 5, 12, "Guarda itens com segurança.", { capacidade: 150 }],
  ["Barril", U, 2, 35, "Armazena líquidos (150 litros) ou secos.", { capacidade: 50 }],
  ["Bolsa Dimensional", U, 4000, 7, "Por dentro é bem maior: guarda até 250 kg, sempre com o mesmo peso.", { capacidade: 250, raridade: "epica" }]
]);

/* -------------------------------------------- */
/*  Minérios, metais e materiais especiais      */
/* -------------------------------------------- */

const MINERIOS = lista("minerios", "loot", "material", [
  ["Carvão (1 kg)", U, 0.1, 1, "Combustível de forja."],
  ["Minério de Cobre", U, 0.5, 1, ""],
  ["Minério de Estanho", U, 0.5, 1, ""],
  ["Minério de Ferro", U, 1, 1, ""],
  ["Minério de Prata", U, 5, 1, ""],
  ["Minério de Ouro", U, 20, 1, ""],
  ["Lingote de Cobre", U, 1, 1, ""],
  ["Lingote de Bronze", U, 2, 1, ""],
  ["Lingote de Ferro", U, 2, 1, ""],
  ["Lingote de Aço", U, 5, 1, "Base das armas e armaduras de metal."],
  ["Lingote de Prata", U, 10, 1, ""],
  ["Lingote de Ouro", U, 100, 1, ""],
  ["Obsidiana", U, 20, 1, "Vidro vulcânico (veja Materiais especiais)."]
]);

/** Materiais especiais: a coluna "Material Especial" das Modificações (Notion) usa estes efeitos. */
const ESPECIAIS = lista("especiais", "loot", "material", [
  ["Prata Lunar", U, 300, 1, "Material Especial: a arma ignora a resistência e a meia imunidade de mortos-vivos, licantropos e demônios.", { raridade: "rara" }],
  ["Ferro Frio", U, 150, 1, "Material Especial: +1d6 de dano contra fadas e criaturas feitas de magia.", { raridade: "rara" }],
  ["Ferro Negro", U, 200, 1, "Forjado em Umbra'Draxil. Material Especial: +1d4 Necrótico e a arma ganha Corrosiva.", { raridade: "rara" }],
  ["Mitral", U, 500, 1, "Material Especial: o item pesa metade. Armadura: −2 a menos de penalidade em Furtividade e não reduz o deslocamento. Arma: ganha Acuidade.", { raridade: "rara" }],
  ["Adamante", U, 1000, 1, "Material Especial: arma ganha Anti-Blindagem e ignora 5 de RD; armadura ganha RD 5 contra dano físico.", { raridade: "epica" }],
  ["Oricalco", U, 2500, 1, "Conduz mana. Material Especial: o item conta como Foco Arcano e −2 no custo de uma magia ou habilidade que o use.", { raridade: "epica" }],
  ["Madeira Élfica", U, 100, 1, "Material Especial: arcos e cajados pesam metade e dão +1 no acerto.", { raridade: "rara" }],
  ["Osso de Dragão", U, 3000, 2, "Material Especial: armadura dá Resistência ao elemento do dragão; arma causa +1d6 desse elemento.", { raridade: "epica" }],
  ["Cristal de Núcleo", U, 800, 0.5, "Material Especial: o item guarda até 10 PM, que o portador pode gastar.", { raridade: "rara" }],
  ["Ferro Estelar", U, 5000, 1, "Metal de meteorito. Material Especial: o dano da arma sobe uma categoria (Normal → Verdadeiro).", { raridade: "lendaria" }]
]);

/* -------------------------------------------- */
/*  Gemas e tesouros                            */
/* -------------------------------------------- */

const GEMAS = [
  ...lista("gemas", "loot", "gem", [
    ["Quartzo", U, 5, 0, ""],
    ["Ágata", U, 10, 0, ""],
    ["Ametista", U, 50, 0, ""],
    ["Ônix", U, 50, 0, ""],
    ["Âmbar", U, 100, 0, ""],
    ["Pérola", U, 100, 0, ""],
    ["Granada (gema)", U, 100, 0, ""],
    ["Topázio", U, 500, 0, ""],
    ["Esmeralda", U, 1000, 0, "", { raridade: "rara" }],
    ["Safira", U, 1000, 0, "", { raridade: "rara" }],
    ["Rubi", U, 5000, 0, "", { raridade: "epica" }],
    ["Diamante", U, 5000, 0, "Componente de magias de ressurreição (o Mestre decide).", { raridade: "epica" }],
    ["Diamante Negro", U, 10000, 0, "", { raridade: "lendaria" }]
  ]),
  ...lista("gemas", "loot", "treasure", [
    ["Taça de Prata", U, 25, 0.5, ""],
    ["Estatueta de Marfim", U, 250, 1, ""],
    ["Colar de Ouro", U, 750, 0.1, ""],
    ["Coroa Cerimonial", U, 7500, 1, "", { raridade: "epica" }]
  ])
];

/* -------------------------------------------- */
/*  Recursos e peças                            */
/* -------------------------------------------- */

const RECURSOS = lista("recursos", "loot", "resource", [
  ["Madeira (tábuas)", U, 0.2, 5, ""],
  ["Madeira Nobre", U, 5, 5, ""],
  ["Couro Curtido", U, 5, 2, ""],
  ["Pele de Animal", U, 1, 3, ""],
  ["Tecido de Linho", U, 0.5, 1, ""],
  ["Tecido de Lã", U, 1, 1, ""],
  ["Seda", U, 10, 0.5, ""],
  ["Linha e Agulha", U, 0.2, 0, ""],
  ["Pedra Lapidada", U, 0.1, 10, ""],
  ["Argila", U, 0.01, 2, ""],
  ["Areia", U, 0.01, 2, ""],
  ["Vidro", U, 1, 1, ""],
  ["Sal", U, 0.05, 0.5, "Conserva comida."],
  ["Cera", U, 0.1, 0.5, ""],
  ["Resina", U, 0.5, 0.5, ""]
]);

/* -------------------------------------------- */
/*  Ervas e plantas                             */
/* -------------------------------------------- */

const ERVAS = lista("ervas", "loot", "resource", [
  ["Folha-de-Cura", U, 1, 0, "Base das Poções de Vida."],
  ["Flor-de-Mana", U, 2, 0, "Pétalas azuladas: base das Poções de Mana."],
  ["Raiz Vigorosa", U, 1, 0.1, "Base dos Tônicos de Estamina."],
  ["Lírio Sereno", U, 3, 0, "Base dos chás e elixires de Sanidade."],
  ["Erva-Amarga", U, 0.5, 0, "Base de antídotos."],
  ["Cogumelo Lumínico", U, 0.5, 0, "Brilha fraco no escuro."],
  ["Musgo de Caverna", U, 0.2, 0, ""],
  ["Beladona", U, 2, 0, "Venenosa: base de venenos."],
  ["Pétala de Fogo", U, 5, 0, "Base das Poções de Proteção e de Resistência a Fogo."],
  ["Flor da Lua", U, 50, 0, "Só abre à luz da lua cheia.", { raridade: "rara" }],
  ["Raiz de Mandrágora", U, 80, 0.1, "Grita ao ser arrancada: Fortitude DT 12 ou Atordoado por 1 rodada.", { raridade: "rara" }],
  ["Semente de Árvore-Mundo", U, 5000, 0, "Lendária: cresce em qualquer solo.", { raridade: "lendaria" }]
]);

/* -------------------------------------------- */
/*  Partes de criaturas                         */
/* -------------------------------------------- */

const CRIATURAS = lista("criaturas", "loot", "material", [
  ["Couro de Lobo", U, 2, 3, ""],
  ["Presas de Fera", U, 2, 0.2, ""],
  ["Garras de Fera", U, 2, 0.2, ""],
  ["Ossos", U, 0.01, 1, ""],
  ["Penas", U, 0.01, 0, ""],
  ["Chifre", U, 20, 1, ""],
  ["Escamas de Réptil", U, 5, 0.5, ""],
  ["Sangue de Monstro (frasco)", U, 10, 0.3, "Usado em alquimia e rituais."],
  ["Glândula de Veneno", U, 20, 0.2, "Rende 1 dose de Veneno Simples com o Kit de Venenos."],
  ["Ectoplasma", U, 50, 0.1, "Resto de espíritos e assombrações.", { raridade: "rara" }],
  ["Pena de Grifo", U, 100, 0, "", { raridade: "rara" }],
  ["Olho de Basilisco", U, 300, 0.2, "", { raridade: "rara" }],
  ["Escama de Dragão", U, 500, 0.5, "", { raridade: "epica" }],
  ["Essência Elemental de Fogo", U, 150, 0.1, "Usada em encantamentos de Fogo.", { raridade: "rara" }],
  ["Essência Elemental de Água", U, 150, 0.1, "Usada em encantamentos de Água e Frio.", { raridade: "rara" }],
  ["Essência Elemental de Ar", U, 150, 0.1, "Usada em encantamentos de Ar e Sonoro.", { raridade: "rara" }],
  ["Essência Elemental de Terra", U, 150, 0.1, "Usada em encantamentos de Terra e Força.", { raridade: "rara" }],
  ["Núcleo de Criatura (Fraco)", U, 20, 0.1, "Restos do Núcleo de uma criatura fraca: componente de encantamento."],
  ["Núcleo de Criatura (Moderado)", U, 200, 0.2, "Restos do Núcleo de uma criatura moderada.", { raridade: "rara" }],
  ["Núcleo de Criatura (Intenso)", U, 2000, 0.3, "Restos do Núcleo de uma criatura intensa.", { raridade: "epica" }]
]);

/* -------------------------------------------- */
/*  Catálogo montado                            */
/* -------------------------------------------- */

export const ITENS_CATALOGO = [
  ...armas(), ...armaduras(), ...escudos(), ...VESTIMENTAS, ...MUNICAO, ...POCOES, ...MEDICINA, ...COMIDA, ...ARREMESSO, ...VENENOS,
  ...AVENTURA, ...FERRAMENTAS, ...CONJURACAO, ...RECIPIENTES, ...MINERIOS, ...ESPECIAIS, ...GEMAS, ...RECURSOS, ...ERVAS, ...CRIATURAS
];

export const itemCatalogoPorId = id => ITENS_CATALOGO.find(x => x.id === id) ?? null;

/** Preço em cobre (PO × 100). */
export const precoEmCobre = entrada => Math.round((Number(entrada?.preco) || 0) * 100);

/** Preço para o dnd5e (system.price): a maior moeda que divide o valor certinho. */
export function precoDnd5e(entrada) {
  const c = precoEmCobre(entrada);
  if (c && c % 100 === 0) return { value: c / 100, denomination: "gp" };
  if (c && c % 10 === 0) return { value: c / 10, denomination: "sp" };
  return { value: c, denomination: "cp" };
}

/** Resumo de uma linha do catálogo (dano, defesa, recuperação…). */
export function resumoCatalogo(x) {
  if (x.arma) {
    const a = x.arma;
    const crit = `${a.critMargem < 20 ? `${a.critMargem}–20` : "20"}/×${a.critMult}`;
    return [a.dano || "—", crit, a.tipoDano, a.alcance, a.propriedades.join(", "), a.desarmado ? "conta como desarmado" : "", x.desc,
      x.maestria ? `Maestria: ${x.maestria.texto}` : ""].filter(Boolean).join(" · ");
  }
  if (x.armadura) {
    if (x.escudo) return [`${x.armadura.tipoEscudo} +${x.armadura.defesa}`, x.desc, (x.propriedades ?? []).join(", ")].filter(Boolean).join(" · ");
    return [`${TIPOS_ARM[x.armadura.tipo] ?? ""} +${x.armadura.defesa}`, x.armadura.desvantagem && x.armadura.desvantagem !== "Nenhuma" ? x.armadura.desvantagem : "", x.armadura.especial].filter(Boolean).join(" · ");
  }
  return x.desc ?? "";
}

/* -------------------------------------------- */
/*  Item do Foundry                             */
/* -------------------------------------------- */

const ESC = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const idAleatorio = () => Array.from({ length: 16 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
const TIPO_EQUIP_DND5E = { leve: "light", media: "medium", pesada: "heavy", shield: "shield", clothing: "clothing" };
const pesoTexto = kg => `${Number(kg).toLocaleString("pt-BR")} kg`;

/** Preço legível ("1 PO, 5 PP"; 0 = "sem preço"). */
export function precoTexto(entrada) {
  const c = precoEmCobre(entrada);
  return c ? moedasTexto(c) : "sem preço";
}

/** Valor em cobre escrito em ouro (até 9.999 PO), ou em dracma/platina acima disso. */
export function moedasTexto(c) {
  c = Math.max(0, Math.round(Number(c) || 0));
  if (!c) return "0 PC";
  const partes = [];
  let resto = c;
  for (const [abrev, valor] of [["DR", 1000000], ["PL", 1000], ["PO", 100], ["PP", 10], ["PC", 1]]) {
    // Até 9.999 PO mostra em ouro (mais fácil de comparar); acima, sobe para platina e dracma
    if ((abrev === "PL" || abrev === "DR") && c < 1000000) continue;
    const n = Math.floor(resto / valor);
    if (n) { partes.push(`${n.toLocaleString("pt-BR")} ${abrev}`); resto -= n * valor; }
  }
  return partes.join(", ");
}

/**
 * Dados de criação do item (Item.create / createEmbeddedDocuments). `qtd` = quantas unidades do catálogo
 * (cada uma com `pacote` peças). `flag` é o id do módulo nas flags.
 */
export function dadosItemCatalogo(x, { qtd = 1, flag = "epm-ficha", img = "" } = {}) {
  const f = { raridade: x.raridade, catalogo: x.id, regiao: x.regiao, preco: precoEmCobre(x) };
  const efeitos = {};
  (x.efeitos ?? []).forEach((e, i) => { efeitos[idAleatorio()] = { ...e, criado: Date.now() + i }; });
  if (Object.keys(efeitos).length) f.efeitos = efeitos;
  const linhas = [];
  if (x.arma || x.armadura) {
    const resumo = x.escudo
      ? [`${x.armadura.tipoEscudo} +${x.armadura.defesa}`, x.desc].filter(Boolean).join(" · ")
      : x.arma ? resumoCatalogo({ ...x, desc: "", maestria: null }) : resumoCatalogo(x);
    if (resumo) linhas.push(`<p>${ESC(resumo)}</p>`);
    if (x.desc && !x.escudo) linhas.push(`<p>${ESC(x.desc)}</p>`);
  } else if (x.desc) linhas.push(`<p>${ESC(x.desc)}</p>`);
  if (x.propriedades?.length) {
    linhas.push(`<ul>${x.propriedades.map(p => `<li><strong>${ESC(p)}</strong>${PROPRIEDADES_PROTECAO[p] ? `: ${ESC(PROPRIEDADES_PROTECAO[p].efeito)}` : ""}</li>`).join("")}</ul>`);
  }
  if (x.maestria) linhas.push(`<p><strong>Exótica · Maestria:</strong> ${ESC(x.maestria.texto)}</p>`);
  linhas.push(`<p><em>${ESC(REGIOES_CATALOGO[x.regiao] ?? "")} · ${ESC(precoTexto(x))} · ${ESC(pesoTexto(x.peso))}${x.pacote > 1 ? ` · pacote com ${x.pacote}` : ""}</em></p>`);
  const system = {
    description: { value: linhas.join("") },
    weight: { value: Number(x.peso) || 0, units: "kg" },
    price: precoDnd5e(x)
  };
  const doc = { name: x.nome, type: x.tipo, img: img || imagemPadrao(x), system, flags: { [flag]: f } };

  if (x.tipo === "weapon") {
    const a = x.arma;
    Object.assign(f, {
      dano: a.dano, tipoDano: a.tipoDano, critMargem: a.critMargem, critMult: a.critMult, periciaAtaque: a.pericia,
      propriedades: a.propriedades, alcance: a.alcance, tipoArma: ""
    });
    if (a.desarmado) { f.contaDesarmado = true; f.desarmadoBonus = "desarmado"; }
    if (x.maestria) f.maestria = { ...x.maestria };
    system.quantity = Math.max(1, qtd) * (x.pacote || 1);
  } else if (x.tipo === "equipment") {
    if (x.armadura) {
      f.armadura = x.armadura.defesa;
      if (x.armadura.tipo !== "escudo") f.tipoArmadura = x.armadura.tipo;
      if (x.armadura.estaminaPorTurno) f.estaminaPorTurno = x.armadura.estaminaPorTurno;
    }
    if (x.propriedades?.length) f.propriedades = [...x.propriedades];
    const t = TIPO_EQUIP_DND5E[x.sub];
    if (t) system.type = { value: t };
    system.quantity = Math.max(1, qtd);
  } else if (x.tipo === "consumable") {
    if (x.sub) system.type = { value: x.sub };
    if (x.formula) f.formula = x.formula;
    if (x.cargas) f.cargas = { valor: x.cargas, max: x.cargas };
    if (x.removeCondicoes?.length) f.removeCondicoes = [...x.removeCondicoes];
    if (x.aplicaCondicoes?.length) f.aplicaCondicoes = [...x.aplicaCondicoes];
    if (x.bonusUso) f.bonusUso = { ...x.bonusUso };
    system.quantity = Math.max(1, qtd) * (x.pacote || 1);
  } else if (x.tipo === "container") {
    system.capacity = { weight: { value: Number(x.capacidade) || 0, units: "kg" } };
    system.quantity = Math.max(1, qtd);
  } else {
    if (x.sub) system.type = { value: x.sub };
    system.quantity = Math.max(1, qtd) * (x.pacote || 1);
  }
  return doc;
}

/** Itens que empilham (somam quantidade no mesmo item em vez de criar outro). */
export const empilha = x => ["consumable", "loot"].includes(x.tipo) && !x.cargas;
