/**
 * Bênçãos e maldições: catálogo oficial com a automação de cada entrada.
 * Só dados e funções puras (sem Foundry), para poder ser testado em Node.
 *
 * Automação (chave "b034" = bênção 34, "m019" = maldição 19):
 *  - mods [{ alvo, valor }] .......... entram na ficha enquanto a entrada está ativa (o jogador pode editar)
 *  - efeitos { ... } ................. mesmas chaves das condições, valem enquanto ativa
 *      (+ danoAtaques, danoMult, resistencias, imunidades, custoExtraMagia, pvPorPm, pmPorPv,
 *       pvPorHabilidade, psFimCombate, psPorDescansoLongo, pvMaxPorDescanso, descansoCurtoMetade,
 *       iniciativaZero, metadeDinheiro, bloqueiaPericias, suspendeBencaos "todas"|"divina")
 *  - duracao N ....................... "Usar" liga por N turnos; o Novo turno desconta
 *  - frequencia ...................... turno | combate | dia | semana | unica (lida do texto se faltar)
 *  - aoUsar { pv, pm, pe, ps, temp, pvDefinir, removerCondicoes, condicoes, permanentes }
 *  - aoTerminar { pv, pm, pe, rolar, texto } quando a duração acaba ou ao encerrar
 *  - escolha { tipo: "imunidade", rotulo, sugestoes } pergunta algo ao adicionar
 */
import { LISTA_BENCAOS } from "./bencaos-lista.mjs";

export const NATUREZAS = {
  divina:   { label: "Divina",   bencao: "Bênçãos Divinas",   maldicao: "Maldições Divinas" },
  caotica:  { label: "Caótica",  bencao: "Bênçãos Caóticas",  maldicao: "Maldições Caóticas" },
  memetica: { label: "Memética", bencao: "Bênçãos Meméticas", maldicao: "Maldições Meméticas" }
};

export const RARIDADES_BENCAO = {
  boa:      { label: "Boa",      cor: "#7FB4E6", ordem: 1 },
  epica:    { label: "Épica",    cor: "#A86BE3", ordem: 2 },
  lendaria: { label: "Lendária", cor: "#E58A2A", ordem: 3 }
};

export const FREQUENCIAS = {
  livre:   { label: "Sem limite", curto: "" },
  turno:   { label: "1 vez por turno", curto: "1/turno" },
  combate: { label: "1 vez por combate", curto: "1/combate" },
  dia:     { label: "1 vez por dia", curto: "1/dia" },
  semana:  { label: "1 vez por semana", curto: "1/semana" },
  unica:   { label: "Só uma vez", curto: "1 vez" }
};

export const REGRAS_BENCAOS = LISTA_BENCAOS.regras;
export const GRUPOS_BENCAO = LISTA_BENCAOS.grupos;
export const DESCRICAO_RARIDADE = LISTA_BENCAOS.raridades;

const ATRS = ["forca", "destreza", "constituicao", "aparencia", "carisma", "inteligencia", "autocontrole", "nucleo"];
const todos = valor => ATRS.map(a => ({ alvo: `atributo.${a}`, valor }));
const atr = (lista, valor) => lista.map(a => ({ alvo: `atributo.${a}`, valor }));

const AUTO = {
  /* ---------- Bênçãos Divinas ---------- */
  b006: { frequencia: "combate" },
  b010: { efeitos: { bloqueiaRequisitos: ["verbal"] } },
  b014: { aoUsar: { pv: "metade" } },
  b017: { aoUsar: { pv: "max", removerCondicoes: true } },
  b018: { duracao: 3 },
  b021: { escolha: { tipo: "imunidade", rotulo: "Tipo de dano elemental", sugestoes: ["Fogo", "Gelo", "Elétrico", "Ácido", "Trovão", "Veneno"] } },
  b022: { efeitos: { bloqueiaAtaques: true } },
  b024: { duracao: 3, aoTerminar: { texto: "A criatura marcada morre." } },
  b026: { efeitos: { deslocamentoMult: 0 }, aoTerminar: { texto: "Perde todas as ações por 2 turnos." } },
  b032: { efeitos: { imunidades: ["Dominado", "Subjugado"] } },
  /* ---------- Bênçãos Caóticas ---------- */
  b036: { aoUsar: { pv: -10 } },
  b037: { efeitos: { dot: [{ formula: "15", recurso: "pv", opcional: true, rotulo: "Fome Infinita (turno sem atacar)" }] } },
  b039: { efeitos: { dot: [{ formula: "5", recurso: "pv", opcional: true, rotulo: "Sombra Devoradora atacou" }] } },
  b040: { efeitos: { bloqueiaAcoes: ["padrao"] } },
  b041: { efeitos: { danoAtaques: "3d8" } },
  b043: { efeitos: { implica: ["epm-cego"] } },
  b044: { efeitos: { implica: ["epm-preso"] } },
  b045: { aoUsar: { temp: "metadeMax" }, aoTerminar: { texto: "Perde permanentemente 10 PV máximos." } },
  b046: { aoUsar: { pm: -10 } },
  b047: { efeitos: { danoMult: 2 }, aoTerminar: { texto: "Fica incapaz de realizar ações durante 2 turnos." } },
  b048: { aoUsar: { permanentes: [{ alvo: "recurso.pv", valor: -20 }] } },
  b049: { duracao: 3, aoTerminar: { texto: "A cópia se torna hostil e ataca você." } },
  b051: { aoTerminar: { rolar: "10d10", texto: "Perde todos os PV recuperados e sofre 10d10 de dano verdadeiro." } },
  b054: { mods: atr(["forca", "destreza", "constituicao"], 3), aoTerminar: { pv: -30, texto: "Fica impedido de conjurar por 2 turnos." } },
  b060: { aoTerminar: { texto: "Todos os danos acumulados são aplicados de uma vez." } },
  b062: { aoTerminar: { pm: "zero", pe: "zero" } },
  b065: { mods: todos(5), aoTerminar: { texto: "PV máximos reduzidos à metade e perde todas as ações por 3 turnos." } },
  b066: { aoUsar: { permanentes: [{ alvo: "atributo.nucleo", valor: -1 }, { alvo: "atributo.constituicao", valor: -1 }] } },
  b067: { aoUsar: { pvDefinir: 1 } },
  /* ---------- Bênçãos Meméticas ---------- */
  b070: { efeitos: { resistencias: ["Todos os danos"] } },
  b074: { aoUsar: { condicoes: ["epm-caido"] } },
  b075: { duracao: 5 },
  b079: { efeitos: { deslocamentoMult: 0, bloqueiaAcoes: ["padrao", "bonus", "movimento", "reacao"] } },
  b080: { aoUsar: { pv: "max" }, mods: todos(3) },
  b087: { mods: atr(["inteligencia", "carisma", "nucleo"], 4) },
  b094: { aoUsar: { pv: "max", pe: "max", pm: "max" } },
  b096: { mods: todos(5) },
  b098: { aoUsar: { pv: "max" }, mods: atr(["forca", "constituicao"], 5) },

  /* ---------- Maldições Divinas ---------- */
  m004: { efeitos: { deslocamentoMult: 0.5 } },
  m005: { efeitos: { descansoCurtoMetade: true } },
  m006: { efeitos: { bloqueiaRequisitos: ["verbal"] } },
  m013: { efeitos: { recuperacaoMetade: ["pv"] } },
  m014: { efeitos: { bloqueiaMagias: true } },
  m015: { efeitos: { vulneravel: ["Espiritual", "Sanidade"] } },
  m016: { efeitos: { suspendeBencaos: "divina" } },
  m019: { mods: todos(-2) },
  m023: { efeitos: { suspendeBencaos: "divina" } },
  m026: { efeitos: { avisos: ["Dano recebido ignora resistências e reduções"] } },
  m028: { efeitos: { pvPorHabilidade: 5 } },
  m029: { efeitos: { psFimCombate: 10 } },
  m030: { efeitos: { suspendeBencaos: "divina" } },
  m033: { efeitos: { suspendeBencaos: "todas" } },
  /* ---------- Maldições Caóticas ---------- */
  m036: { efeitos: { vulneravel: ["Impacto"] } },
  m037: { efeitos: { custoExtraMagia: 5 } },
  m045: { efeitos: { dot: [{ formula: "5", recurso: "pv", opcional: true, rotulo: "Corpo Faminto (turno sem causar dano)" }] } },
  m047: { mods: [{ alvo: "", valor: -4 }] },
  m048: { efeitos: { pvPorPm: true } },
  m050: { efeitos: { avisos: ["Ao sofrer dano, perde a Reação até o próximo turno"] } },
  m052: { efeitos: { pvMaxPorDescanso: -10 } },
  m055: { efeitos: { avisos: ["Não regenera PV"] } },
  m056: { efeitos: { iniciativaZero: true } },
  m059: { efeitos: { semRecuperar: ["pv", "pm", "pe"] } },
  m060: { efeitos: { dot: [{ formula: "20", recurso: "pv", rotulo: "Corpo do Apocalipse" }] } },
  m061: { efeitos: { psPorDescansoLongo: 10 } },
  m063: { efeitos: { avisos: ["Suas habilidades têm o efeito invertido"] } },
  /* ---------- Maldições Meméticas ---------- */
  m071: { efeitos: { atributos: { aparencia: -2, carisma: -2 } } },
  m079: { efeitos: { bloqueiaPericias: ["furtividade"] } },
  m080: { efeitos: { avisos: ["Inimigos causam +3 de dano em você"] } },
  m083: { efeitos: { metadeDinheiro: true } },
  m092: { efeitos: { pmPorPv: true } },
  m100: { mods: [...todos(-3), { alvo: "pericias", valor: -3 }] }
};

/** Frequência de uso lida do texto ("Uma vez por combate" → combate). */
export function frequenciaDoTexto(texto) {
  const t = String(texto ?? "").toLowerCase();
  if (/uma vez por turno/.test(t)) return "turno";
  if (/uma vez por combate/.test(t)) return "combate";
  if (/uma vez por dia/.test(t)) return "dia";
  if (/uma vez por semana/.test(t)) return "semana";
  if (/só funciona uma vez/.test(t)) return "unica";
  return "livre";
}

/** Duração em turnos lida do texto ("Dura 3 turnos", "Durante 2 turnos"). */
export function duracaoDoTexto(texto) {
  const m = /(?:dura|durante|permanece por)\s+(\d+)\s+turnos?/i.exec(String(texto ?? ""));
  return m ? Number(m[1]) : 0;
}

const pad = n => String(n).padStart(3, "0");

/** Catálogo completo (200 entradas) com a automação já resolvida. */
export const CATALOGO = LISTA_BENCAOS.entradas.map(e => {
  const id = `${e.tipo === "maldicao" ? "m" : "b"}${pad(e.numero)}`;
  const auto = AUTO[id] ?? {};
  const textos = [e.efeito, e.condicao, e.custo, e.consequencia].filter(Boolean).join(" ");
  return {
    id, numero: e.numero, nome: e.nome, tipo: e.tipo, natureza: e.origem, raridade: e.raridade,
    efeito: e.efeito, condicao: e.condicao ?? "", custo: e.custo ?? "", consequencia: e.consequencia ?? "",
    frequencia: e.tipo === "bencao" ? (auto.frequencia ?? frequenciaDoTexto(textos)) : "livre",
    duracao: e.tipo === "bencao" ? (auto.duracao ?? duracaoDoTexto(textos)) : 0,
    mods: auto.mods ?? [], efeitos: auto.efeitos ?? {}, aoUsar: auto.aoUsar ?? null,
    aoTerminar: auto.aoTerminar ?? null, escolha: auto.escolha ?? null,
    automatica: !!(auto.mods?.length || Object.keys(auto.efeitos ?? {}).length || auto.aoUsar || auto.aoTerminar || auto.escolha)
  };
});

const POR_ID = new Map(CATALOGO.map(c => [c.id, c]));
export const entradaCatalogo = id => POR_ID.get(id) ?? null;

/** Texto de busca (sem acento) de uma entrada do catálogo. */
export function textoBusca(c) {
  return [c.nome, c.efeito, c.condicao, c.custo, c.consequencia, NATUREZAS[c.natureza]?.label, RARIDADES_BENCAO[c.raridade]?.label]
    .join(" ").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Dados gravados na ficha ao adicionar uma entrada do catálogo. A automação (efeitos, custos,
 * frequência) continua sendo lida do catálogo pelo id, para acompanhar atualizações do módulo.
 */
export function dadosNovaEntrada(c, { escolha = "", criado = Date.now(), novoIdFn } = {}) {
  const mods = {};
  c.mods.forEach((m, i) => { mods[novoIdFn ? novoIdFn() : `m${i}`] = { alvo: m.alvo, valor: m.valor }; });
  return {
    catalogo: c.id, nome: c.nome, tipo: c.tipo, natureza: c.natureza, raridade: c.raridade,
    ativo: c.tipo === "maldicao" || !c.duracao,
    origem: "", descricao: c.efeito, condicao: c.condicao, custo: c.custo, consequencia: c.consequencia,
    escolha, mods, permanentes: {}, usado: false, turnosRestantes: 0, criado
  };
}

/**
 * Automação efetiva de uma entrada gravada na ficha: a do catálogo (se veio dele)
 * mais o que o jogador definiu à mão (frequência e duração das entradas próprias).
 */
export function automacaoDe(entrada) {
  const c = entrada?.catalogo ? entradaCatalogo(entrada.catalogo) : null;
  const efeitos = structuredClone(c?.efeitos ?? {});
  if (c?.escolha?.tipo === "imunidade" && entrada.escolha) {
    efeitos.imunidades = [...(efeitos.imunidades ?? []), entrada.escolha];
  }
  const freq = FREQUENCIAS[entrada?.frequencia] ? entrada.frequencia : (c?.frequencia ?? "livre");
  const duracao = Number.isFinite(Number(entrada?.duracao)) && Number(entrada.duracao) > 0 ? Number(entrada.duracao) : (c?.duracao ?? 0);
  return {
    catalogo: c, efeitos, frequencia: freq, duracao,
    aoUsar: c?.aoUsar ?? null, aoTerminar: c?.aoTerminar ?? null, escolha: c?.escolha ?? null
  };
}
