/**
 * Camada de regras "pura": não depende do Foundry, para poder ser testada fora dele.
 * Recebe dados simples e devolve números prontos para a ficha.
 */
import { modsDeArquetipo } from "./arquetipos.mjs";
import {
  FLAG, ATRIBUTOS, GRUPOS_ATRIBUTO, PERICIAS_PADRAO, RECURSOS, REGRAS, custoNivel,
  RARIDADES_PODER, RARIDADES_ITEM, RARIDADE_DND5E, CONDICOES, COMBINACOES, EXAUSTAO, EXAUSTAO_MAX, DEFESAS,
  MOEDAS, MOEDAS_DESC, MOEDAS_ANTIGAS, ACOES, REQUISITOS, TIPOS_TESTE, CUSTO_RECURSOS, RECARGAS, CD,
  TIPOS_EFEITO_ITEM, QUANDO_CURA, COR_PADRAO, BRILHO_PADRAO
} from "./config.mjs";
import { automacaoDe, NATUREZAS } from "./bencaos.mjs";

/* -------------------------------------------- */
/*  Utilitários                                 */
/* -------------------------------------------- */

export const num = (v, padrao = 0) => {
  if (v === null || v === undefined || v === "") return padrao;
  const n = Number(v);
  return Number.isFinite(n) ? n : padrao;
};
export const int = (v, padrao = 0) => Math.trunc(num(v, padrao));
export const limitar = (v, min, max) => Math.min(max, Math.max(min, v));
export const arredondar = (v, casas = 1) => Math.round(v * 10 ** casas) / 10 ** casas;

export function novoId() {
  if (globalThis.foundry?.utils?.randomID) return globalThis.foundry.utils.randomID();
  const c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 16; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

/** "Ofício Mágico" → "oficiomagico" (usado como id de perícia). */
export function slug(texto) {
  return String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Comparação de textos sem acento e sem caixa. */
export function normalizarTexto(texto) {
  return String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function lerCaminho(obj, caminho) {
  return String(caminho).split(".").reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), obj);
}

function eObjeto(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Mescla profunda sem mutar: `extra` sobrescreve `base`; arrays são substituídos; null/undefined são ignorados. */
export function mesclar(base, extra) {
  if (!eObjeto(extra)) return structuredClone(base);
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(extra)) {
    if (v === null || v === undefined) continue;
    if (eObjeto(v) && eObjeto(out[k])) out[k] = mesclar(out[k], v);
    else out[k] = structuredClone(v);
  }
  return out;
}

/* -------------------------------------------- */
/*  Dados padrão                                */
/* -------------------------------------------- */

/** Lê uma entrada de lista de perícias: [id, nome, atributos possíveis, atributos somados?]. */
export function entradaPericia(e) {
  const validos = v => (Array.isArray(v) ? v : (v ? [v] : [])).filter(a => ATRIBUTOS[a]);
  if (Array.isArray(e)) {
    const [id, nome, possiveis, somados] = e;
    const sugestoes = validos(possiveis);
    return { id, nome: nome || id, sugestoes, atributos: somados ? validos(somados) : sugestoes.slice(0, 1) };
  }
  const sugestoes = validos(e?.sugestoes ?? e?.atributos ?? e?.atributo);
  return { id: e?.id, nome: e?.nome || e?.id, sugestoes, atributos: validos(e?.atributos ?? e?.atributo) };
}

/** Atributos somados numa perícia (aceita o formato antigo com um só atributo). */
export function atributosDaPericia(p) {
  const lista = Array.isArray(p?.atributos) ? p.atributos : (p?.atributo ? [p.atributo] : []);
  return [...new Set(lista.filter(a => ATRIBUTOS[a]))];
}

export function periciasParaObjeto(lista = PERICIAS_PADRAO) {
  const out = {};
  for (const e of lista) {
    const { id, nome, sugestoes, atributos } = entradaPericia(e);
    if (id) out[id] = { nome, atributos, sugestoes, pontos: 0, outros: 0 };
  }
  return out;
}

/** Converte as perícias de uma ficha numa lista [id, nome, possíveis, somados] (para salvar como padrão). */
export function periciasParaLista(pericias) {
  return Object.entries(pericias ?? {})
    .filter(([, p]) => p)
    .map(([id, p]) => {
      const somados = atributosDaPericia(p);
      const possiveis = [...new Set([...(Array.isArray(p.sugestoes) ? p.sugestoes : []), ...somados])].filter(a => ATRIBUTOS[a]);
      return [id, p.nome || id, possiveis, somados];
    })
    .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
}

/**
 * Atualizações para trazer uma ficha da 0.1 para a lista oficial de perícias:
 * converte "atributo" em "atributos", adiciona as que faltam, aplica os atributos oficiais
 * às que já existiam e remove as provisórias que estiverem zeradas.
 */
export function migrarPericias(pericias = {}, lista = PERICIAS_PADRAO, obsoletas = []) {
  const updates = {};
  const oficiais = new Map(lista.map(e => { const x = entradaPericia(e); return [x.id, x]; }));
  for (const [id, p] of Object.entries(pericias ?? {})) {
    if (!p) continue;
    const oficial = oficiais.get(id);
    if (oficial) {
      updates[`${id}.atributos`] = oficial.atributos;
      updates[`${id}.sugestoes`] = oficial.sugestoes;
      if (oficial.nome !== p.nome && id !== "oficio") updates[`${id}.nome`] = oficial.nome;
    } else if (obsoletas.includes(id) && !int(p.pontos)) {
      updates[`-=${id}`] = null;
      continue;
    } else if (!Array.isArray(p.atributos)) {
      updates[`${id}.atributos`] = atributosDaPericia(p);
    }
  }
  for (const [id, x] of oficiais) {
    if (!pericias?.[id]) updates[id] = { nome: x.nome, atributos: x.atributos, sugestoes: x.sugestoes, pontos: 0, outros: 0 };
  }
  return updates;
}

/** Versão atual do formato dos dados (normalizarDados e migrarDados levam fichas antigas até ela). */
export const VERSAO_DADOS = 5;

export function dadosPadrao(listaPericias = PERICIAS_PADRAO) {
  return {
    versao: VERSAO_DADOS,
    raca: "", arquetipo: "", classe: "",
    nivel: 1, arquetipo2: "", nivel2: 0,
    pontos: { pt: 0, pev: 0, ph: 0 },
    recursos: {
      pm: { value: 0, max: 0 },
      pe: { value: 0, max: 0 },
      ps: { value: REGRAS.sanidadeInicial, max: REGRAS.sanidadeInicial }
    },
    atributos: Object.fromEntries(Object.keys(ATRIBUTOS).map(k => [k, { base: 0, raca: 0, aumento: 0, outros: 0 }])),
    pericias: periciasParaObjeto(listaPericias),
    ca: { base: 10, atributo: "destreza", bonus: 0 },
    dt: { atributo: CD.atributo, pericia: CD.pericia },
    deslocamento: { base: 9 },
    iniciativa: { bonus: 0 },
    exaustao: 0,
    acoes: {
      padrao: false, bonus: false, movimento: false, reacao: false, defesas: 0,
      lendaria: { value: 0, max: 0 }, mitica: { value: 0, max: 0 }, arcaica: { value: 0, max: 0 }
    },
    moedas: Object.fromEntries(MOEDAS.map(m => [m.id, 0])),
    idiomas: [], resistencias: [], vulnerabilidades: [], imunidades: [],
    espacos: { habilidades: 2, magias: 2, truques: 0 },
    sobre: {},
    notas: { paginas: {} },
    bencaos: {},
    treinamentos: {},
    treinoDia: { horas: 0 },
    relacoes: {},
    faccoes: {},
    diario: {},
    transformacoes: {},
    transformacao: { ativa: "", turnos: 0 },
    companheiros: {},
    bestiario: {},
    rd: {},
    projetos: {},
    projetosEfeitos: {},
    livroProjetos: {},
    arquetipoOpcoes: { combatente: { tipoFavorito: "", maestria: "", estilos: [] }, artifice: { utensilios: [] }, conjurador: { dominio: "" } },
    usos: { ataqueExtraTurno: false, gemeaTurno: false, recuperarMana: false, presa: "" },
    combate: { atrasou: "" },
    sustentadas: {},
    ataques: {},
    bonusCena: {},
    personalizacao: {
      cor: COR_PADRAO, brilho: BRILHO_PADRAO, abasExtras: {}, abasOcultas: {},
      fundo: "", fundoVeu: 70, moldura: "astrolabio", fonte: "classica", escala: 100
    },
    arqclasse: { arquetipo: { notas: "" }, classe: { notas: "" } },
    ui: { ordemAbas: [], ordemCategorias: [], periciasFavoritasTopo: false }
  };
}

/** Dados da ficha com padrões preenchidos. As perícias salvas substituem a lista padrão inteira. */
export function normalizarDados(bruto = {}, listaPericias = PERICIAS_PADRAO) {
  const padrao = dadosPadrao(listaPericias);
  const dados = mesclar(padrao, bruto);
  if (eObjeto(bruto?.pericias)) dados.pericias = structuredClone(bruto.pericias);
  for (const campo of ["idiomas", "resistencias", "vulnerabilidades", "imunidades"]) {
    if (!Array.isArray(dados[campo])) dados[campo] = [];
  }
  for (const [antiga, nova] of Object.entries(MOEDAS_ANTIGAS)) {
    if (bruto?.moedas?.[antiga] !== undefined && !int(bruto?.moedas?.[nova])) dados.moedas[nova] = int(bruto.moedas[antiga]);
    delete dados.moedas[antiga];
  }
  dados.exaustao = limitar(int(dados.exaustao), 0, EXAUSTAO_MAX);
  if (!Array.isArray(dados.ui?.ordemAbas)) dados.ui.ordemAbas = [];
  if (!Array.isArray(dados.ui?.ordemCategorias)) dados.ui.ordemCategorias = [];
  return dados;
}

/** Chaves de primeiro nível que faltam numa ficha (para inicializar atores antigos). */
export function camposFaltando(bruto = {}, listaPericias = PERICIAS_PADRAO) {
  const padrao = dadosPadrao(listaPericias);
  const faltando = {};
  for (const [k, v] of Object.entries(padrao)) {
    if (bruto?.[k] === undefined) faltando[k] = v;
  }
  return faltando;
}

/**
 * Atualizações (caminhos relativos a flags.epm-ficha) que levam uma ficha para a versão atual:
 * Joias de Kan viram Dracmas, a exaustão acima de 6 volta a 6 (não há mais coma) e
 * Vontade troca Núcleo por Autocontrole se ainda estava no padrão antigo.
 * Idiomas são migrados pela ficha, porque dependem da lista de idiomas do mundo.
 */
export function migrarDados(bruto = {}) {
  const updates = {};
  const versao = int(bruto?.versao);
  if (versao >= VERSAO_DADOS) return updates;
  for (const [antiga, nova] of Object.entries(MOEDAS_ANTIGAS)) {
    if (bruto?.moedas?.[antiga] === undefined) continue;
    updates[`moedas.${nova}`] = int(bruto.moedas?.[nova]) + int(bruto.moedas[antiga]);
    updates[`moedas.-=${antiga}`] = null;
  }
  if (int(bruto?.exaustao) > EXAUSTAO_MAX) updates.exaustao = EXAUSTAO_MAX;
  // 0.5.2: Vontade passa a somar Autocontrole por padrão (só muda quem ainda estava no padrão antigo, Núcleo)
  const vontade = versao < 4 ? bruto?.pericias?.vontade : null;
  const soNucleo = v => (Array.isArray(v) ? v.length === 1 && v[0] === "nucleo" : v === "nucleo");
  if (vontade && soNucleo(vontade.atributos ?? vontade.atributo)) {
    updates["pericias.vontade.atributos"] = ["autocontrole"];
    if (vontade.atributo !== undefined) updates["pericias.vontade.-=atributo"] = null;
  }
  if (vontade && soNucleo(vontade.sugestoes)) updates["pericias.vontade.sugestoes"] = ["autocontrole"];
  // 0.5.4: a CA não tem mais o campo Armadura manual (vem só das armaduras equipadas); o valor vai para "outros"
  const armaduraManual = int(bruto?.ca?.armadura);
  if (bruto?.ca && bruto.ca.armadura !== undefined) {
    if (armaduraManual) updates["ca.bonus"] = int(bruto.ca.bonus) + armaduraManual;
    updates["ca.-=armadura"] = null;
  }
  updates.versao = VERSAO_DADOS;
  return updates;
}

/* -------------------------------------------- */
/*  Ordem das abas e categorias                 */
/* -------------------------------------------- */

/** Aplica uma ordem salva a uma lista de ids: os conhecidos na ordem salva, os novos no fim. */
export function ordenarPorLista(ids, salva = []) {
  const conhecidos = new Set(ids);
  const out = (Array.isArray(salva) ? salva : []).filter(id => conhecidos.has(id));
  for (const id of ids) if (!out.includes(id)) out.push(id);
  return out;
}

/** Move `id` para antes de `antesDe` (ou para o fim, se `antesDe` for vazio). */
export function moverNaLista(lista, id, antesDe = null) {
  const out = lista.filter(x => x !== id);
  const i = antesDe ? out.indexOf(antesDe) : -1;
  if (i < 0) out.push(id);
  else out.splice(i, 0, id);
  return out;
}

/* -------------------------------------------- */
/*  Itens: bônus e efeitos                      */
/* -------------------------------------------- */

const EQUIPAVEIS = ["weapon", "equipment"];

export function lerEfeitosItem(item) {
  const f = item?.flags?.[FLAG]?.efeitos ?? {};
  const padraoQuando = item?.type === "weapon" ? "acerto" : "uso";
  return Object.entries(f)
    .filter(([, e]) => e && TIPOS_EFEITO_ITEM[e.tipo])
    .map(([id, e]) => ({
      id, tipo: e.tipo, alvo: e.alvo ?? "", valor: num(e.valor),
      tipoDano: String(e.tipoDano ?? "").trim(), em: e.em ?? "",
      recurso: RECURSOS[e.recurso] ? e.recurso : "pv",
      formula: String(e.formula ?? "").trim(),
      quando: QUANDO_CURA[e.quando] ? e.quando : padraoQuando,
      criado: num(e.criado)
    }))
    .sort((a, b) => a.criado - b.criado);
}

/** O item dá seus bônus passivos agora? Armas e armaduras: equipadas. Consumíveis: só ao usar. */
export function itemAtivo(item) {
  if (!item) return false;
  if (EQUIPAVEIS.includes(item.type)) return !!item.system?.equipped;
  if (item.type === "consumable") return false;
  return num(item.system?.quantity, 1) > 0;
}

/** Fontes de bônus passivos dos itens ativos (para calcularFicha). */
export function efeitosDeItens(itens = []) {
  const out = [];
  for (const item of itens) {
    let efeitos;
    let armadura = 0;
    let arma = false;
    try {
      if (!itemAtivo(item)) continue;
      efeitos = lerEfeitosItem(item).filter(e => !["cura", "danoExtra"].includes(e.tipo));
      if (item.type === "equipment") armadura = int(item.flags?.[FLAG]?.armadura);
      arma = item.type === "weapon";
    } catch { continue; }
    if (efeitos.length || armadura || arma) out.push({ id: item.id, nome: item.name, efeitos, armadura, arma, tipoArma: arma ? String(item.flags?.[FLAG]?.tipoArma ?? "").trim() : "" });
  }
  return out;
}

/** Texto curto de um efeito de item ("CA +2", "RD 3 (Corte)", "Desvantagem: Furtividade"). */
export function resumoEfeitoItem(e, rotulos = {}) {
  const alvo = rotulos.alvos?.[e.alvo] ?? e.alvo;
  const em = rotulos.em?.[e.em] ?? e.em;
  switch (e.tipo) {
    case "mod": return alvo ? `${alvo} ${e.valor > 0 ? "+" : e.valor < 0 ? "−" : ""}${Math.abs(e.valor).toLocaleString("pt-BR")}` : "";
    case "rd": return `RD ${e.valor.toLocaleString("pt-BR")}${e.tipoDano ? ` (${e.tipoDano})` : ""}`;
    case "resistencia": return e.tipoDano ? `Resiste: ${e.tipoDano}` : "";
    case "imunidade": return e.tipoDano ? `Imune: ${e.tipoDano}` : "";
    case "vulnerabilidade": return e.tipoDano ? `Vulnerável: ${e.tipoDano}` : "";
    case "desvantagem": return em ? `Desvantagem: ${em}` : "";
    case "vantagem": return em ? `Vantagem: ${em}` : "";
    case "cura": return e.formula ? `${QUANDO_CURA[e.quando]}: ${RECURSOS[e.recurso]?.abrev ?? "PV"} +${e.formula}` : "";
    case "danoExtra": return e.formula ? `Dano +${e.formula}${e.tipoDano ? ` ${e.tipoDano}` : ""}` : "";
    default: return "";
  }
}

/* -------------------------------------------- */
/*  Condições, combinações e efeitos            */
/* -------------------------------------------- */

const CONDICAO_POR_ID = new Map(CONDICOES.map(c => [c.id, c]));
export const condicaoPorId = id => CONDICAO_POR_ID.get(id) ?? null;

/** Efeitos da exaustão em cada nível (cumulativos). */
const EFEITOS_EXAUSTAO = {
  1: { desvTestes: true, desvAtaques: true, desvResistencias: true, desvDano: true },
  2: { testes: -5, defesa: -5 },
  3: { bloqueiaAcoes: ["bonus", "reacao"], deslocamentoMult: 0.5 },
  4: { acoesMax: 1 },
  5: { implica: ["epm-incapacitado", "epm-inconsciente"] },
  6: {}
};

function lerModsAE(modsAE, somar) {
  if (!eObjeto(modsAE)) return;
  const fonte = "Efeitos ativos";
  const grupos = { atributos: "atributo", pericias: "pericia", recursos: "recurso", defesas: "defesa" };
  for (const [chave, prefixo] of Object.entries(grupos)) {
    for (const [id, valor] of Object.entries(modsAE[chave] ?? {})) somar(`${prefixo}.${id}`, valor, fonte);
  }
  for (const chave of ["ca", "deslocamento", "iniciativa", "testes", "acerto", "danoAtaque"]) {
    if (modsAE[chave] !== undefined) somar(chave, modsAE[chave], fonte);
  }
}

const novaLista = () => [];
const somaLista = lista => lista.reduce((s, x) => s + x.valor, 0);

/**
 * Lê as bênçãos e maldições gravadas: ativas, suspensas (Vínculo Quebrado, maldições que anulam
 * bênçãos) e a automação de cada uma (catálogo + o que o jogador definiu).
 */
export function lerBencaos(bencaos = {}, { suspensaoCondicao = [] } = {}) {
  const lista = Object.entries(bencaos ?? {}).filter(([, b]) => b && typeof b === "object").map(([id, b]) => {
    const tipo = b.tipo === "maldicao" ? "maldicao" : "bencao";
    const auto = automacaoDe(b);
    const natureza = NATUREZAS[b.natureza] ? b.natureza : (auto.catalogo?.natureza ?? "");
    return { id, b, tipo, natureza, ativo: !!b.ativo, auto };
  });
  const suspensoes = [];
  for (const x of lista) {
    if (x.tipo !== "maldicao" || !x.ativo) continue;
    const s = x.auto.efeitos.suspendeBencaos;
    if (s) suspensoes.push({ alcance: s === "divina" ? "divina" : "todas", fonte: x.b.nome || "Maldição" });
  }
  for (const fonte of suspensaoCondicao) suspensoes.push({ alcance: "todas", fonte });
  for (const x of lista) {
    x.suspensaPor = x.tipo === "bencao"
      ? suspensoes.filter(s => s.alcance === "todas" || (s.alcance === "divina" && x.natureza === "divina")).map(s => s.fonte)
      : [];
    x.vale = x.ativo && !x.suspensaPor.length;
  }
  return lista;
}

/**
 * Calcula tudo que a ficha mostra a partir dos dados salvos.
 * @param {object} p
 * @param {object} p.dados       dados normalizados (normalizarDados)
 * @param {object} p.hp          { value, max (efetivo do dnd5e), maxFonte, temp }
 * @param {Iterable} p.statuses  ids de status ativos no ator
 * @param {object} p.modsAE      actor.flags[FLAG].mods depois dos Active Effects
 * @param {Array} p.itens        fontes de bônus dos itens ativos (efeitosDeItens)
 */
/** DT das habilidades e magias: 10 + atributo escolhido + perícia escolhida (sem o atributo dela). */
export function dtDe(d, atributos, periciaPorId) {
  const atributo = ATRIBUTOS[d?.dt?.atributo] ? d.dt.atributo : CD.atributo;
  const pericia = periciaPorId[d?.dt?.pericia] ? d.dt.pericia : CD.pericia;
  const valorAtr = int(atributos?.[atributo]?.total);
  const per = periciaPorId[pericia];
  const valorPer = per?.bonusProprio ?? 0;
  const atributoNome = ATRIBUTOS[atributo]?.label ?? atributo;
  const periciaNome = per?.nome ?? pericia;
  return {
    valor: CD.base + valorAtr + valorPer, base: CD.base, atributo, atributoNome, valorAtributo: valorAtr,
    pericia, periciaNome, valorPericia: valorPer,
    formula: `${CD.base} + ${atributoNome} ${valorAtr} + ${periciaNome} ${valorPer}`
  };
}

export function calcularFicha({ dados, hp = {}, statuses = [], modsAE = {}, itens = [], agora = null }) {
  const d = dados;
  const st = new Set(statuses);
  const nivel1 = Math.max(0, int(d.nivel, 1));
  const temSegundo = !!String(d.arquetipo2 ?? "").trim();
  const nivel2 = temSegundo ? Math.max(0, int(d.nivel2, 0)) : 0;
  const nivelTotal = nivel1 + nivel2;
  const exaustao = limitar(int(d.exaustao, 0), 0, EXAUSTAO_MAX);

  /* ---------- Bênçãos e maldições (1ª passada: suspensões) ---------- */
  const diretas = new Set(CONDICOES.filter(c => st.has(c.id)).map(c => c.id));
  // Vínculo Quebrado e afins suspendem bênçãos; só conta se marcado (ou implicado) por condições.
  const suspensaoCondicao = [];
  {
    const vistos = new Set();
    const fila = [...diretas];
    while (fila.length) {
      const id = fila.shift();
      if (vistos.has(id)) continue;
      vistos.add(id);
      const c = CONDICAO_POR_ID.get(id);
      if (!c) continue;
      if (c.efeitos.suspendeBencaos) suspensaoCondicao.push(c.label);
      fila.push(...(c.efeitos.implica ?? []));
    }
  }
  const bencaos = lerBencaos(d.bencaos, { suspensaoCondicao });
  const bencaosValendo = bencaos.filter(x => x.vale);

  /* ---------- Imunidades (tags, itens e bênçãos) ---------- */
  const imunidadesTags = [];
  for (const t of d.imunidades ?? []) if (t) imunidadesTags.push({ tipo: t, fonte: "" });
  for (const fonteItem of itens) {
    for (const e of fonteItem.efeitos) if (e.tipo === "imunidade" && e.tipoDano) imunidadesTags.push({ tipo: e.tipoDano, fonte: fonteItem.nome });
  }
  for (const x of bencaosValendo) for (const t of x.auto.efeitos.imunidades ?? []) imunidadesTags.push({ tipo: t, fonte: x.b.nome });
  const imunes = new Set(imunidadesTags.map(t => normalizarTexto(t.tipo)));

  /* ---------- Condições: diretas, implicadas (automáticas) e imunes ---------- */
  const porQue = new Map();
  const efetivasIds = new Set();
  {
    const fila = [];
    const empurrar = (id, motivo) => {
      if (!CONDICAO_POR_ID.has(id)) return;
      if (motivo) {
        if (!porQue.has(id)) porQue.set(id, []);
        if (!porQue.get(id).includes(motivo)) porQue.get(id).push(motivo);
      }
      fila.push(id);
    };
    for (const id of diretas) empurrar(id, null);
    for (const x of bencaosValendo) for (const id of x.auto.efeitos.implica ?? []) empurrar(id, x.b.nome || "Bênção");
    for (let n = 1; n <= exaustao; n++) for (const id of EFEITOS_EXAUSTAO[n]?.implica ?? []) empurrar(id, `Exaustão ${n}`);
    const vistos = new Set();
    while (fila.length) {
      const id = fila.shift();
      if (vistos.has(id)) continue;
      vistos.add(id);
      const c = CONDICAO_POR_ID.get(id);
      if (imunes.has(normalizarTexto(c.label))) continue;
      efetivasIds.add(id);
      for (const filho of c.efeitos.implica ?? []) empurrar(filho, c.label);
    }
  }
  const condicoes = CONDICOES.map(c => {
    const ativa = diretas.has(c.id);
    const automatica = !ativa && porQue.has(c.id) && (efetivasIds.has(c.id) || imunes.has(normalizarTexto(c.label)));
    const imune = imunes.has(normalizarTexto(c.label));
    return {
      ...c, ativa, automatica, imune, efetiva: efetivasIds.has(c.id),
      porQue: automatica ? porQue.get(c.id) : [], resumo: resumirEfeitos(c.efeitos)
    };
  });
  const efetivas = condicoes.filter(c => c.efetiva);

  /* ---------- Combinações (as duas condições marcadas diretamente) ---------- */
  const combinacoes = COMBINACOES.filter(k => k.condicoes.every(id => diretas.has(id) && !imunes.has(normalizarTexto(CONDICAO_POR_ID.get(id)?.label))))
    .map(k => ({
      ...k,
      nomes: k.condicoes.map(id => CONDICAO_POR_ID.get(id)?.label ?? id),
      podeAplicar: (k.aplicar ?? []).some(id => !diretas.has(id)),
      podeRemover: (k.remover ?? []).some(id => diretas.has(id)),
      aplicarNomes: (k.aplicar ?? []).map(id => CONDICAO_POR_ID.get(id)?.label ?? id),
      removerNomes: (k.remover ?? []).map(id => CONDICAO_POR_ID.get(id)?.label ?? id)
    }));

  /* ---------- Fontes de efeito ---------- */
  const fontesEfeito = [];
  for (const c of efetivas) fontesEfeito.push({ fonte: c.label, efeitos: c.efeitos, tipo: "condicao" });
  for (const k of combinacoes) if (k.efeitos) fontesEfeito.push({ fonte: k.titulo, efeitos: k.efeitos, tipo: "combinacao" });
  for (const x of bencaosValendo) fontesEfeito.push({ fonte: x.b.nome || (x.tipo === "maldicao" ? "Maldição" : "Bênção"), efeitos: x.auto.efeitos, tipo: x.tipo });
  for (let n = 1; n <= exaustao; n++) fontesEfeito.push({ fonte: `Exaustão ${n}`, efeitos: EFEITOS_EXAUSTAO[n] ?? {}, tipo: "exaustao" });

  const penal = { testes: novaLista(), ataques: novaLista(), distancia: novaLista(), dano: novaLista(), defesa: novaLista() };
  const penalAtributo = {};
  const penalPericia = {};
  const desv = { testes: [], ataques: [], ataquesMagicos: [], iniciativa: [], resistencias: [], dano: [], pericias: {} };
  const vant = { testes: [], ataques: [], pericias: {} };
  const bloqueios = { acoes: {}, requisitos: {}, magias: [], mana: [], ataques: [], origens: {}, pericias: {} };
  const recuperacao = { sem: { pv: [], pm: [], pe: [], ps: [] }, metade: { pv: [], pm: [], pe: [], ps: [] }, semDescansoCurto: [], descansoCurtoMetade: [] };
  const dots = [];
  const turnoEfeitos = [];
  const vulneraveisBrutos = [];
  const anulados = new Map();
  const avisos = [];
  const especiais = {
    danoAtaques: [], danoMult: { valor: 1, fontes: [] }, custoExtraMagia: { valor: 0, fontes: [] },
    pvPorPm: [], pmPorPv: [], pvPorHabilidade: { valor: 0, fontes: [] }, psFimCombate: { valor: 0, fontes: [] },
    psPorDescansoLongo: { valor: 0, fontes: [] }, pvMaxPorDescanso: { valor: 0, fontes: [] },
    iniciativaZero: [], metadeDinheiro: []
  };
  const resistenciasExtra = [];
  let deslMult = 1;
  const deslMotivos = [];
  let acoesMax = null;
  const acoesMaxFontes = [];

  for (const { fonte, efeitos: e } of fontesEfeito) {
    for (const chave of ["testes", "ataques", "distancia", "dano", "defesa"]) {
      if (num(e[chave])) penal[chave].push({ valor: num(e[chave]), fonte });
    }
    for (const [a, v] of Object.entries(e.atributos ?? {})) if (ATRIBUTOS[a] && num(v)) (penalAtributo[a] ??= []).push({ valor: num(v), fonte });
    for (const [p, v] of Object.entries(e.pericias ?? {})) if (num(v)) (penalPericia[p] ??= []).push({ valor: num(v), fonte });
    if (e.desvTestes) desv.testes.push(fonte);
    if (e.desvAtaques) desv.ataques.push(fonte);
    if (e.desvAtaquesMagicos) desv.ataquesMagicos.push(fonte);
    if (e.desvIniciativa) desv.iniciativa.push(fonte);
    if (e.desvResistencias) desv.resistencias.push(fonte);
    if (e.desvDano) desv.dano.push(fonte);
    for (const p of e.desvPericias ?? []) (desv.pericias[p] ??= []).push(fonte);
    if (e.deslocamentoMult !== undefined) {
      deslMult = Math.min(deslMult, num(e.deslocamentoMult, 1));
      deslMotivos.push(fonte);
    }
    for (const a of e.bloqueiaAcoes ?? []) (bloqueios.acoes[a] ??= []).push(fonte);
    for (const r of e.bloqueiaRequisitos ?? []) (bloqueios.requisitos[r] ??= []).push(fonte);
    for (const o of e.bloqueiaOrigens ?? []) (bloqueios.origens[o] ??= []).push(fonte);
    for (const p of e.bloqueiaPericias ?? []) (bloqueios.pericias[p] ??= []).push(fonte);
    if (e.bloqueiaMagias) bloqueios.magias.push(fonte);
    if (e.bloqueiaMana) bloqueios.mana.push(fonte);
    if (e.bloqueiaAtaques) bloqueios.ataques.push(fonte);
    for (const r of e.semRecuperar ?? []) recuperacao.sem[r]?.push(fonte);
    for (const r of e.recuperacaoMetade ?? []) recuperacao.metade[r]?.push(fonte);
    if (e.semDescansoCurto) recuperacao.semDescansoCurto.push(fonte);
    if (e.descansoCurtoMetade) recuperacao.descansoCurtoMetade.push(fonte);
    for (const dot of e.dot ?? []) dots.push({ ...dot, fonte, rotulo: dot.rotulo || fonte });
    if (e.turno) turnoEfeitos.push({ tipo: e.turno, fonte });
    for (const t of e.vulneravel ?? []) vulneraveisBrutos.push({ tipo: t, fonte });
    for (const t of e.anulaVulnerabilidade ?? []) anulados.set(normalizarTexto(t), fonte);
    for (const t of e.avisos ?? []) avisos.push({ texto: t, fonte });
    for (const t of e.resistencias ?? []) resistenciasExtra.push({ tipo: t, fonte });
    if (e.acoesMax) { acoesMax = acoesMax === null ? e.acoesMax : Math.min(acoesMax, e.acoesMax); acoesMaxFontes.push(fonte); }
    if (e.danoAtaques) especiais.danoAtaques.push({ formula: e.danoAtaques, fonte });
    if (num(e.danoMult) > 1) { especiais.danoMult.valor = Math.max(especiais.danoMult.valor, num(e.danoMult)); especiais.danoMult.fontes.push(fonte); }
    for (const chave of ["custoExtraMagia", "pvPorHabilidade", "psFimCombate", "psPorDescansoLongo", "pvMaxPorDescanso"]) {
      if (num(e[chave])) { especiais[chave].valor += num(e[chave]); especiais[chave].fontes.push(fonte); }
    }
    for (const chave of ["pvPorPm", "pmPorPv", "iniciativaZero", "metadeDinheiro"]) if (e[chave]) especiais[chave].push(fonte);
  }

  /* ---------- Itens: desvantagem, vantagem, resistências, RD ---------- */
  const reducoes = [];
  // RD da própria ficha (aba Combate): reduz o número escolhido do dano daquele tipo
  for (const r of Object.values(d.rd ?? {})) {
    if (r && num(r.valor) > 0) reducoes.push({ valor: num(r.valor), tipos: String(r.tipo ?? "").trim() || "todos os danos", fonte: "Ficha" });
  }
  const tagsItens = { resistencias: [], vulnerabilidades: [] };
  for (const fonteItem of itens) {
    for (const e of fonteItem.efeitos) {
      const fonte = fonteItem.nome;
      if (e.tipo === "desvantagem" || e.tipo === "vantagem") {
        const alvoLista = e.tipo === "desvantagem" ? desv : vant;
        if (e.em === "testes") alvoLista.testes.push(fonte);
        else if (e.em === "ataques") alvoLista.ataques.push(fonte);
        else if (e.em === "iniciativa" && e.tipo === "desvantagem") desv.iniciativa.push(fonte);
        else if (String(e.em).startsWith("pericia.")) (alvoLista.pericias[e.em.slice(8)] ??= []).push(fonte);
      } else if (e.tipo === "rd" && num(e.valor)) {
        reducoes.push({ valor: num(e.valor), tipos: e.tipoDano || "todos os danos", fonte });
      } else if (e.tipo === "resistencia" && e.tipoDano) {
        tagsItens.resistencias.push({ tipo: e.tipoDano, fonte });
      } else if (e.tipo === "vulnerabilidade" && e.tipoDano) {
        tagsItens.vulnerabilidades.push({ tipo: e.tipoDano, fonte });
      }
    }
  }

  /* ---------- Vulnerabilidades por condição (×2), menos as anuladas ---------- */
  const vulneraveis = [];
  for (const v of vulneraveisBrutos) {
    const chave = normalizarTexto(v.tipo);
    const existente = vulneraveis.find(x => normalizarTexto(x.tipo) === chave);
    if (anulados.has(chave)) {
      if (!existente) vulneraveis.push({ tipo: v.tipo, fontes: [v.fonte], anulada: anulados.get(chave) });
      else existente.fontes.push(v.fonte);
      continue;
    }
    if (existente) existente.fontes.push(v.fonte);
    else vulneraveis.push({ tipo: v.tipo, fontes: [v.fonte], anulada: null });
  }
  for (const v of vulneraveis) v.texto = `${v.tipo} ×2`;

  /* ---------- Modificadores numéricos ---------- */
  const mods = {};
  const somar = (alvo, valor, fonte) => {
    const v = num(valor);
    if (!alvo || !v) return;
    mods[alvo] ??= { total: 0, fontes: [] };
    mods[alvo].total += v;
    mods[alvo].fontes.push({ fonte, valor: v });
  };
  for (const x of bencaos) {
    const fonte = x.b.nome || (x.tipo === "maldicao" ? "Maldição" : "Bênção");
    for (const m of Object.values(x.b.permanentes ?? {})) somar(m?.alvo, m?.valor, `${fonte} (permanente)`);
    if (!x.vale) continue;
    for (const m of Object.values(x.b.mods ?? {})) somar(m?.alvo, m?.valor, fonte);
  }
  for (const c of efetivas) for (const m of c.efeitos.mods ?? []) somar(m.alvo, m.valor, c.label);
  for (const t of Object.values(d.treinamentos ?? {})) {
    if (t?.estado !== "concluido") continue;
    for (const m of Object.values(t.mods ?? {})) somar(m?.alvo, m?.valor, `Treinamento: ${t.nome || "sem nome"}`);
  }
  for (const fonteItem of itens) for (const e of fonteItem.efeitos) if (e.tipo === "mod") somar(e.alvo, e.valor, fonteItem.nome);
  // Transformação ativa (sub-aba Transformações)
  const tAtiva = d.transformacao?.ativa ? d.transformacoes?.[d.transformacao.ativa] : null;
  if (tAtiva) for (const m of Object.values(tAtiva.mods ?? {})) somar(m?.alvo, m?.valor, `Transformação: ${tAtiva.nome || "sem nome"}`);
  // Arquétipos modelo: Reserva Arcana, Utensílios, Arma Protetora, Arma Dupla, projetos do Artífice
  for (const m of modsDeArquetipo(d, itens.filter(x => x.arma), agora)) somar(m.alvo, m.valor, m.fonte);
  lerModsAE(modsAE, somar);
  const mod = alvo => mods[alvo]?.total ?? 0;
  const fontes = alvo => mods[alvo]?.fontes ?? [];

  /* ---------- Bônus/penalidade nos testes ---------- */
  const penalTestesTotal = somaLista(penal.testes) + mod("testes");
  const fontesTestes = [...penal.testes, ...fontes("testes")];

  // Atributos: base (16 pontos) + raça + aumento (1 por nível par) + outros
  const atributos = {};
  let gastoAtributos = 0;
  let gastoAumento = 0;
  for (const [id, cfg] of Object.entries(ATRIBUTOS)) {
    const a = d.atributos?.[id] ?? {};
    const base = int(a.base);
    const raca = int(a.raca);
    const aumento = int(a.aumento);
    const outros = int(a.outros);
    const m = mod(`atributo.${id}`);
    gastoAtributos += base;
    gastoAumento += aumento;
    const penalProprio = penalAtributo[id] ?? [];
    const testeFontes = [...fontesTestes, ...penalProprio];
    const testeMod = penalTestesTotal + somaLista(penalProprio);
    atributos[id] = {
      id, ...cfg, base, raca, aumento, outros, mod: m, total: base + raca + aumento + outros + m, fontes: fontes(`atributo.${id}`),
      testeMod, testeFontes, testeTotal: base + raca + aumento + outros + m + testeMod
    };
  }
  const gruposAtributo = Object.entries(GRUPOS_ATRIBUTO).map(([id, label]) => ({
    id, label, atributos: Object.values(atributos).filter(a => a.grupo === id)
  }));
  const disponivelAtributos = REGRAS.atributosIniciais;
  const disponivelAumento = Math.floor(nivelTotal / 2);
  const avisosAtributos = [];
  if (gastoAtributos > disponivelAtributos) avisosAtributos.push(`A base soma ${gastoAtributos}; o limite é ${disponivelAtributos}.`);
  if (gastoAumento > disponivelAumento) avisosAtributos.push(`Aumentos somam ${gastoAumento}; no nível ${nivelTotal} são ${disponivelAumento} (1 por nível par).`);
  {
    const bases = Object.values(atributos).map(a => a.base);
    const emExcecao = bases.filter(b => b === REGRAS.atributoExcecao).length;
    const negativos = bases.filter(b => b <= REGRAS.atributoMinimoExcecao).length;
    if (bases.some(b => b > REGRAS.atributoExcecao)) avisosAtributos.push(`Nenhuma base passa de ${REGRAS.atributoExcecao}.`);
    if (emExcecao > 1) avisosAtributos.push(`Só uma base pode ficar em ${REGRAS.atributoExcecao}.`);
    else if (emExcecao === 1 && negativos < 2) avisosAtributos.push(`Para ter uma base em ${REGRAS.atributoExcecao}, duas precisam ficar em ${REGRAS.atributoMinimoExcecao}.`);
  }

  // Perícias: pontos + atributos escolhidos + outros
  const marcos = Math.floor(nivelTotal / 5);
  const limitePericia = REGRAS.periciaLimiteInicial + REGRAS.periciaMarcosLimite.filter(n => nivelTotal >= n).length * REGRAS.periciaAumentoLimite;
  const disponivelPericias = REGRAS.periciasIniciais + marcos * REGRAS.periciasPorMarco;
  let gastoPericias = 0;
  const pericias = Object.entries(d.pericias ?? {}).filter(([, p]) => p).map(([id, p]) => {
    const atrs = atributosDaPericia(p);
    const pontos = int(p.pontos);
    const outros = int(p.outros);
    gastoPericias += pontos;
    const valorAtributo = atrs.reduce((s, a) => s + atributos[a].total, 0);
    const m = mod(`pericia.${id}`) + mod("pericias");
    // Penalidades dos atributos: cada fonte conta uma vez só (a mais severa entre os atributos da perícia)
    const porFonte = new Map();
    for (const a of atrs) {
      for (const x of penalAtributo[a] ?? []) {
        const atual = porFonte.get(x.fonte);
        if (atual === undefined || x.valor < atual) porFonte.set(x.fonte, x.valor);
      }
    }
    const penalAtrs = [...porFonte.entries()].map(([fonte, valor]) => ({ fonte, valor }));
    const penalProprio = penalPericia[id] ?? [];
    const testeFontes = [...fontesTestes, ...penalAtrs, ...penalProprio];
    const testeMod = penalTestesTotal + somaLista(penalAtrs) + somaLista(penalProprio);
    const total = pontos + valorAtributo + outros + m;
    return {
      id, nome: p.nome || id, atributos: atrs,
      sugestoes: (Array.isArray(p.sugestoes) ? p.sugestoes : []).filter(a => ATRIBUTOS[a]),
      atributoAbrev: atrs.length ? atrs.map(a => ATRIBUTOS[a].abrev).join(" + ") : "—",
      pontos, outros, valorAtributo, mod: m,
      bonusProprio: pontos + outros + m,
      total, testeMod, testeFontes, testeTotal: total + testeMod,
      desvantagem: [...(desv.pericias[id] ?? [])], vantagem: [...(vant.pericias[id] ?? [])],
      bloqueada: [...(bloqueios.pericias[id] ?? [])],
      acimaLimite: pontos > limitePericia, fontes: [...fontes(`pericia.${id}`), ...fontes("pericias")]
    };
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const periciaPorId = Object.fromEntries(pericias.map(p => [p.id, p]));

  // Recursos
  const recursos = {};
  recursos.pv = {
    id: "pv", ...RECURSOS.pv, value: num(hp.value), max: num(hp.max) + mod("recurso.pv"), maxFonte: hp.maxFonte ?? "",
    temp: num(hp.temp), mod: mod("recurso.pv"), fontes: fontes("recurso.pv"), motivos: []
  };
  for (const id of ["pm", "pe", "ps"]) {
    const r = d.recursos?.[id] ?? {};
    recursos[id] = {
      id, ...RECURSOS[id], value: num(r.value), maxFonte: num(r.max), temp: Math.max(0, num(r.temp)),
      max: num(r.max) + mod(`recurso.${id}`), mod: mod(`recurso.${id}`), fontes: fontes(`recurso.${id}`), motivos: []
    };
  }
  for (const r of Object.values(recursos)) {
    r.pct = r.max > 0 ? limitar(r.value / r.max, 0, 1) : 0;
    r.maxDiferente = r.max !== num(r.id === "pv" ? hp.maxFonte : r.maxFonte);
    r.semRecuperar = recuperacao.sem[r.id] ?? [];
    r.recuperaMetade = recuperacao.metade[r.id] ?? [];
  }

  // CA (Defesa)
  // CA = 10 + atributo (Destreza por padrão, escolhível) + armaduras e escudos equipados + outros (+ efeitos e penalidades)
  const caAtr = ATRIBUTOS[d.ca?.atributo] ? d.ca.atributo : (d.ca?.atributo === "nenhum" ? "nenhum" : "destreza");
  const ca = {
    base: int(d.ca?.base, 10), atributo: caAtr, atributoLabel: ATRIBUTOS[caAtr]?.label ?? "Nenhum",
    atributoValor: caAtr === "nenhum" ? 0 : int(atributos[caAtr]?.total), armaduraManual: int(d.ca?.armadura),
    armaduraItens: itens.reduce((s, x) => s + int(x.armadura), 0), armaduraFontes: itens.filter(x => int(x.armadura)).map(x => `${x.nome} ${int(x.armadura)}`),
    // Ficha antiga ainda não migrada: o campo Armadura manual conta como "outros"
    bonus: int(d.ca?.bonus) + int(d.ca?.armadura), mod: mod("ca"), fontes: [...fontes("ca"), ...penal.defesa], penal: somaLista(penal.defesa)
  };
  ca.armadura = ca.armaduraItens;  // só armaduras e escudos equipados
  ca.total = ca.base + ca.atributoValor + ca.armadura + ca.bonus + ca.mod + ca.penal;

  // Deslocamento
  const deslocamento = { base: num(d.deslocamento?.base, 9), mod: mod("deslocamento"), fontes: fontes("deslocamento"), motivos: [...new Set(deslMotivos)] };
  deslocamento.mult = deslMult;
  deslocamento.final = arredondar(Math.max(0, deslocamento.base + deslocamento.mod) * deslMult, 2);
  deslocamento.reduzido = deslocamento.final < deslocamento.base + deslocamento.mod;

  // Exaustão
  const atual = EXAUSTAO.find(e => e.nivel === exaustao) ?? null;
  const exaustaoInfo = {
    nivel: exaustao, nome: atual?.nome ?? "", colapso: exaustao >= 5, morte: exaustao >= EXAUSTAO_MAX,
    efeitos: EXAUSTAO.filter(e => e.nivel <= exaustao),
    pips: EXAUSTAO.map(e => ({ nivel: e.nivel, nome: e.nome, ativo: exaustao >= e.nivel, texto: e.texto }))
  };

  // Desvantagens (as condições mandam; vantagem e desvantagem se anulam na rolagem)
  const desvantagens = {
    testes: [...new Set(desv.testes)], ataques: [...new Set(desv.ataques)], ataquesMagicos: [...new Set(desv.ataquesMagicos)],
    iniciativa: [...new Set([...desv.testes, ...desv.iniciativa])], resistencias: [...new Set([...desv.resistencias])],
    dano: [...new Set(desv.dano)], pericias: desv.pericias
  };
  const vantagens = { testes: [...new Set(vant.testes)], ataques: [...new Set(vant.ataques)], pericias: vant.pericias };

  // Defesas
  const defesas = Object.entries(DEFESAS).map(([id, def]) => {
    const per = periciaPorId[def.pericia];
    const m = mod(`defesa.${id}`);
    const bonus = per?.bonusProprio ?? 0;
    return {
      id, ...def, mod: m, periciaNome: per?.nome ?? def.pericia, periciaBonus: bonus,
      faltaPericia: !per, valor: ca.total + bonus + m
    };
  });

  // Iniciativa (é um teste de Destreza)
  const iniciativa = {
    fonte: ATRIBUTOS.destreza.label,
    base: atributos.destreza.total,
    bonus: int(d.iniciativa?.bonus), mod: mod("iniciativa"), fontes: fontes("iniciativa"),
    testeMod: atributos.destreza.testeMod, testeFontes: atributos.destreza.testeFontes,
    zero: especiais.iniciativaZero
  };
  iniciativa.total = iniciativa.base + iniciativa.bonus + iniciativa.mod;
  iniciativa.testeTotal = iniciativa.total + iniciativa.testeMod;

  // Ataques (valem para todos)
  const ataquesGerais = {
    penal: somaLista(penal.ataques) + mod("acerto"), fontes: [...penal.ataques, ...fontes("acerto")],
    distancia: somaLista(penal.distancia), fontesDistancia: penal.distancia,
    dano: somaLista(penal.dano) + mod("danoAtaque"), fontesDano: [...penal.dano, ...fontes("danoAtaque")],
    danoExtra: especiais.danoAtaques, danoMult: especiais.danoMult,
    bloqueados: [...new Set(bloqueios.ataques)]
  };

  // Ações do turno
  const a = d.acoes ?? {};
  const acoes = {
    padrao: !!a.padrao, bonus: !!a.bonus, movimento: !!a.movimento, reacao: !!a.reacao,
    defesas: limitar(int(a.defesas), 0, REGRAS.maxDefesasPorRodada),
    especiais: ["lendaria", "mitica", "arcaica"].map(id => ({
      id, label: ACOES[id].label, value: int(a[id]?.value), max: int(a[id]?.max)
    })),
    limite: acoesMax, limiteFontes: acoesMaxFontes
  };
  acoes.temEspeciais = acoes.especiais.some(e => e.max > 0);
  acoes.usadas = ["padrao", "bonus", "movimento"].filter(id => acoes[id]).length;
  acoes.esgotadas = acoesMax !== null && acoes.usadas >= acoesMax;

  // Progressão
  const pontos = { pt: int(d.pontos?.pt), pev: int(d.pontos?.pev), ph: int(d.pontos?.ph) };
  const progressao = {
    nivel1, nivel2, nivelTotal, temSegundo,
    custo1: nivel1 < REGRAS.nivelMaxArquetipo ? custoNivel(nivel1 + 1) : null,
    custo2: temSegundo && nivel2 < REGRAS.nivelMaxArquetipo ? custoNivel(nivel2 + 1) : null,
    phDePt: Math.floor(pontos.pt / REGRAS.ptPorPh),
    phDePev: Math.floor(pontos.pev / REGRAS.pevPorPh)
  };
  progressao.podeSubir1 = progressao.custo1 !== null && pontos.pev >= progressao.custo1 && nivelTotal < REGRAS.nivelMaxTotal;
  progressao.podeSubir2 = progressao.custo2 !== null && pontos.pev >= progressao.custo2 && nivelTotal < REGRAS.nivelMaxTotal;

  // Resistências, imunidades e vulnerabilidades reunidas (tags + itens + bênçãos + condições)
  const tags = {
    resistencias: [...(d.resistencias ?? []).filter(Boolean).map(t => ({ tipo: t, fonte: "" })), ...tagsItens.resistencias, ...resistenciasExtra],
    imunidades: imunidadesTags,
    vulnerabilidades: [...(d.vulnerabilidades ?? []).filter(Boolean).map(t => ({ tipo: t, fonte: "" })), ...tagsItens.vulnerabilidades],
    reducoes
  };

  return {
    nivelTotal, atributos, gruposAtributo,
    pontosAtributo: {
      disponivel: disponivelAtributos, gasto: gastoAtributos, restante: disponivelAtributos - gastoAtributos,
      aumentoDisponivel: disponivelAumento, aumentoGasto: gastoAumento, avisos: avisosAtributos
    },
    cd: dtDe(d, atributos, periciaPorId),
    pericias, periciaPorId,
    pontosPericia: {
      disponivel: disponivelPericias, gasto: gastoPericias, restante: disponivelPericias - gastoPericias,
      limite: limitePericia, excedido: gastoPericias > disponivelPericias
    },
    recursos, ca, deslocamento, exaustao: exaustaoInfo,
    condicoes, condicoesAtivas: condicoes.filter(c => c.ativa || c.automatica), condicoesDiretas: [...diretas],
    combinacoes, penalidades: {
      testes: { total: penalTestesTotal, fontes: fontesTestes },
      ataques: { total: ataquesGerais.penal, fontes: ataquesGerais.fontes },
      distancia: { total: ataquesGerais.distancia, fontes: penal.distancia },
      dano: { total: ataquesGerais.dano, fontes: ataquesGerais.fontesDano },
      defesa: { total: ca.penal, fontes: penal.defesa },
      atributos: penalAtributo, pericias: penalPericia
    },
    desvantagens, vantagens, bloqueios, recuperacao, dots, turnoEfeitos, vulneraveis, avisos, especiais,
    ataquesGerais, tags, bencaos, defesas, iniciativa, acoes, pontos, progressao, mods
  };
}

/** Texto curto do que uma condição faz, para mostrar no cartão. */
export function resumirEfeitos(efeitos = {}) {
  const partes = [];
  const sinal = v => (v > 0 ? `+${v}` : `−${Math.abs(v)}`);
  const pena = [["testes", "testes"], ["ataques", "ataques"], ["distancia", "ataques à distância"], ["dano", "dano"], ["defesa", "Defesa"]];
  const iguais = pena.filter(([k]) => num(efeitos[k]));
  if (iguais.length && iguais.every(([k]) => efeitos[k] === efeitos[iguais[0][0]])) {
    partes.push(`${sinal(efeitos[iguais[0][0]])} em ${iguais.map(([, l]) => l).join(", ")}`);
  } else {
    for (const [k, l] of iguais) partes.push(`${sinal(efeitos[k])} em ${l}`);
  }
  const atrs = Object.entries(efeitos.atributos ?? {});
  if (atrs.length) {
    const valores = [...new Set(atrs.map(([, v]) => v))];
    if (valores.length === 1) partes.push(`${sinal(valores[0])} em testes de ${atrs.map(([a]) => ATRIBUTOS[a]?.label ?? a).join(", ")}`);
    else for (const [a, v] of atrs) partes.push(`${sinal(v)} em ${ATRIBUTOS[a]?.label ?? a}`);
  }
  for (const [p, v] of Object.entries(efeitos.pericias ?? {})) partes.push(`${sinal(v)} em ${p === "percepcao" ? "Percepção" : p}`);
  if (efeitos.desvTestes) partes.push("Desvantagem em testes");
  if (efeitos.desvAtaques) partes.push("Desvantagem em ataques");
  if (efeitos.desvAtaquesMagicos) partes.push("Desvantagem em ataques mágicos");
  if (efeitos.desvIniciativa) partes.push("Desvantagem na iniciativa");
  for (const p of efeitos.desvPericias ?? []) partes.push(`Desvantagem em ${p === "percepcao" ? "Percepção" : p}`);
  if (efeitos.deslocamentoMult === 0) partes.push("Deslocamento 0");
  else if (efeitos.deslocamentoMult !== undefined) partes.push(efeitos.deslocamentoMult === 0.5 ? "Deslocamento ÷2" : `Deslocamento ×${efeitos.deslocamentoMult}`);
  const acoes = efeitos.bloqueiaAcoes ?? [];
  if (acoes.length >= 8) partes.push("Sem ações");
  else if (acoes.length) partes.push(`Sem ${acoes.map(a => ACOES[a]?.curto ?? a).join(", ")}`);
  const reqs = efeitos.bloqueiaRequisitos ?? [];
  if (reqs.length) partes.push(`Bloqueia: ${reqs.map(r => REQUISITOS[r]?.label ?? r).join(", ")}`);
  if (efeitos.bloqueiaMagias) partes.push("Sem magias");
  if (efeitos.bloqueiaMana) partes.push("Sem poderes de mana");
  if (efeitos.bloqueiaAtaques) partes.push("Sem ataques");
  if (efeitos.bloqueiaOrigens?.length) partes.push("Sem habilidades raciais e de arquétipo");
  if (efeitos.semRecuperar?.length) partes.push(`Não recupera ${efeitos.semRecuperar.map(r => RECURSOS[r]?.abrev ?? r).join(", ")}`);
  if (efeitos.recuperacaoMetade?.length) partes.push(`Recupera ½ ${efeitos.recuperacaoMetade.map(r => RECURSOS[r]?.abrev ?? r).join(", ")}`);
  if (efeitos.semDescansoCurto) partes.push("Sem descanso curto");
  for (const dot of efeitos.dot ?? []) partes.push(`−${dot.formula} ${RECURSOS[dot.recurso]?.abrev ?? "PV"} por turno${dot.opcional ? " (se valer)" : ""}`);
  if (efeitos.turno === "insano") partes.push("Rola 1d6 no início do turno");
  for (const t of efeitos.vulneravel ?? []) partes.push(`${t} ×2`);
  for (const t of efeitos.anulaVulnerabilidade ?? []) partes.push(`Anula ${t} ×2`);
  if (efeitos.suspendeBencaos) partes.push("Suspende bênçãos");
  for (const m of efeitos.mods ?? []) {
    const alvo = m.alvo === "recurso.pv" ? "PV máx." : m.alvo;
    partes.push(`${alvo} ${m.valor > 0 ? "+" : "−"}${Math.abs(m.valor)}`);
  }
  if (efeitos.implica?.length) {
    partes.push(`Fica ${efeitos.implica.map(id => CONDICAO_POR_ID.get(id)?.label ?? id).join(", ")}`);
  }
  return partes;
}

/* -------------------------------------------- */
/*  Habilidades e magias                        */
/* -------------------------------------------- */

export function normalizarForma(id, fo = {}) {
  return {
    id,
    nome: fo.nome || "Forma",
    ordem: num(fo.ordem),
    acao: ACOES[fo.acao] ? fo.acao : "padrao",
    custo: {
      recurso: CUSTO_RECURSOS[fo.custo?.recurso] ? fo.custo.recurso : "nenhum",
      valor: Math.max(0, int(fo.custo?.valor))
    },
    // Sustentada: gasto a cada turno enquanto estiver mantida
    porTurno: {
      recurso: CUSTO_RECURSOS[fo.porTurno?.recurso] ? fo.porTurno.recurso : "nenhum",
      valor: Math.max(0, int(fo.porTurno?.valor))
    },
    alcance: fo.alcance ?? "",
    area: fo.area ?? "",
    alvo: fo.alvo ?? "",
    duracao: fo.duracao ?? "",
    teste: {
      tipo: TIPOS_TESTE[fo.teste?.tipo] ? fo.teste.tipo : "nenhum",
      pericia: fo.teste?.pericia ?? "",
      nd: fo.teste?.nd ?? ""
    },
    dano: { formula: String(fo.dano?.formula ?? "").trim(), tipo: fo.dano?.tipo ?? "" },
    efeito: fo.efeito ?? "",
    requisitos: Object.fromEntries(Object.keys(REQUISITOS).map(k => [k, !!fo.requisitos?.[k]]))
  };
}

export function formaPadrao(ordem = 0, nome = "Padrão") {
  return {
    nome, ordem, acao: "padrao",
    custo: { recurso: "nenhum", valor: 0 },
    porTurno: { recurso: "nenhum", valor: 0 },
    alcance: "", area: "", alvo: "", duracao: "",
    teste: { tipo: "nenhum", pericia: "", nd: "" },
    dano: { formula: "", tipo: "" },
    efeito: "",
    requisitos: Object.fromEntries(Object.keys(REQUISITOS).map(k => [k, false]))
  };
}

/** Lê os dados EPM de um item de habilidade (feat) ou magia (spell). */
export function lerPoder(item) {
  const f = item?.flags?.[FLAG] ?? {};
  const tipo = item?.type === "spell" ? "magia" : "habilidade";
  const raridade = RARIDADES_PODER[f.raridade] ? f.raridade : "comum";
  const formas = Object.entries(f.formas ?? {})
    .filter(([, fo]) => fo)
    .map(([id, fo]) => normalizarForma(id, fo))
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"));
  const melhorias = Object.entries(f.melhorias ?? {})
    .filter(([, m]) => m)
    .map(([id, m]) => ({ id, ...m }))
    .sort((a, b) => num(a.data) - num(b.data));
  return {
    tipo, raridade, passiva: !!f.passiva, origem: f.origem ?? "", favorito: !!f.favorito,
    transformacao: f.transformacao ?? "", arquetipoRef: f.arquetipoRef ?? "",
    circulo: tipo === "magia" ? limitar(int(item?.system?.level, 0), 0, 9) : null,
    formas, melhorias,
    usos: { valor: Math.max(0, int(f.usos?.valor)), max: Math.max(0, int(f.usos?.max)), recarga: RECARGAS[f.usos?.recarga] ? f.usos.recarga : "nenhuma" }
  };
}

/** Teto de dano de uma raridade (valor máximo possível da fórmula de referência). */
export function tetoDano(raridade) {
  return maxFormula(RARIDADES_PODER[raridade]?.danoMax ?? "0");
}

export function contarEfeitos(melhorias, formaId) {
  return melhorias.filter(m => m.efeito && (!formaId || m.forma === formaId)).length;
}

/** A forma é ofensiva? (ataque ou dano que não seja cura) */
export function formaOfensiva(forma) {
  if (!forma) return false;
  if (forma.teste?.tipo === "ataque") return true;
  return !!forma.dano?.formula && !/cura/i.test(forma.dano?.tipo ?? "");
}

/** Custo real de uma forma (Mana Corrompida e afins somam PM às magias). */
export function custoEfetivo(forma, ficha, tipo = "habilidade") {
  if (!forma || forma.custo?.recurso === "nenhum") return { recurso: "nenhum", valor: 0, extra: 0 };
  const extra = tipo === "magia" && forma.custo.recurso === "pm" ? (ficha?.especiais?.custoExtraMagia?.valor ?? 0) : 0;
  return { recurso: forma.custo.recurso, valor: Math.max(0, int(forma.custo.valor)) + extra, extra };
}

/**
 * Verifica se uma forma pode ser usada agora e se respeita os limites da raridade.
 * `poder` informa o tipo (habilidade/magia) e a origem, para bloqueios de magia e de origem.
 * @returns {{bloqueada:boolean, motivos:string[], semRecurso:boolean, excedeDano:boolean, maxDano:number|null, teto:number|null}}
 */
export function avaliarForma(forma, ficha, { raridade = "comum", melhorias = [], dadosRolagem = {}, poder = {} } = {}) {
  const motivos = [];
  const b = ficha.bloqueios ?? {};
  if (forma && forma.acao !== "passiva") {
    motivos.push(...(b.acoes?.[forma.acao] ?? []));
    for (const [req, ligado] of Object.entries(forma.requisitos ?? {})) {
      if (ligado) motivos.push(...(b.requisitos?.[req] ?? []));
    }
    if (poder.tipo === "magia") motivos.push(...(b.magias ?? []));
    if (poder.origem) motivos.push(...(b.origens?.[poder.origem] ?? []));
    if (forma.custo?.recurso === "pm" && forma.custo?.valor > 0) motivos.push(...(b.mana ?? []));
    if (formaOfensiva(forma)) motivos.push(...(b.ataques ?? []));
  }
  const custo = custoEfetivo(forma, ficha, poder.tipo);
  const atual = custo.recurso !== "nenhum" ? ficha.recursos?.[custo.recurso]?.value ?? 0 : null;
  const maxDano = forma?.dano?.formula ? maxFormula(forma.dano.formula, dadosRolagem) : null;
  const teto = tetoDano(raridade);
  const efeitosUsados = forma ? contarEfeitos(melhorias, forma.id) : 0;
  const limiteEfeitos = RARIDADES_PODER[raridade]?.efeitos ?? 0;
  return {
    bloqueada: motivos.length > 0,
    motivos: [...new Set(motivos)],
    semRecurso: atual !== null && custo.valor > atual,
    custo,
    maxDano, teto,
    excedeDano: maxDano !== null && teto !== null && maxDano > teto,
    efeitosUsados, limiteEfeitos,
    excedeEfeitos: efeitosUsados > limiteEfeitos
  };
}

/** Forma sustentada (gasta todo turno)? */
export const eSustentada = forma => !!forma && forma.porTurno?.recurso !== "nenhum" && int(forma.porTurno?.valor) > 0;

export function textoCusto(forma, extra = 0) {
  if (!forma || forma.custo.recurso === "nenhum" || (!forma.custo.valor && !extra)) return "Sem custo";
  return `${forma.custo.valor + extra} ${CUSTO_RECURSOS[forma.custo.recurso].sigla}${extra ? ` (+${extra})` : ""}`;
}

/** Contagem por raridade, separando habilidades e magias. */
export function contarRaridades(poderes) {
  const zero = () => Object.fromEntries(Object.keys(RARIDADES_PODER).map(r => [r, 0]));
  const out = { habilidade: zero(), magia: zero(), total: zero() };
  for (const p of poderes) {
    out[p.tipo][p.raridade] += 1;
    out.total[p.raridade] += 1;
  }
  return out;
}

/**
 * Situação do limite de uma raridade.
 * @param {"separados"|"combinados"} modo
 */
export function situacaoLimite(contagem, tipo, raridade, modo = "separados", adicionando = 0) {
  const limite = RARIDADES_PODER[raridade]?.limite ?? null;
  const usados = (modo === "combinados" ? contagem.total[raridade] : contagem[tipo][raridade]) + adicionando;
  return { limite, usados, excedido: limite !== null && usados > limite, cheio: limite !== null && usados >= limite };
}

/* -------------------------------------------- */
/*  Raridade de itens                           */
/* -------------------------------------------- */

export function raridadeItem(item) {
  const r = item?.flags?.[FLAG]?.raridade;
  if (RARIDADES_ITEM[r]) return r;
  const nativa = item?.system?.rarity;
  return RARIDADE_DND5E[nativa] ?? "comum";
}

/* -------------------------------------------- */
/*  Fórmulas de dados                           */
/* -------------------------------------------- */

function tokenizar(s, dados) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if ("+-*/()".includes(ch)) { out.push({ t: ch }); i++; continue; }
    const resto = s.slice(i);
    if (ch === "@") {
      const m = /^@([\w.-]+)/.exec(resto);
      if (!m) return null;
      const v = Number(lerCaminho(dados, m[1]));
      out.push({ t: "n", v: Number.isFinite(v) ? v : 0 });
      i += m[0].length;
      continue;
    }
    const dado = /^(\d*)[dD](\d+)((?:[a-zA-Z]+\d*)*)/.exec(resto);
    if (dado) {
      const qtd = dado[1] === "" ? 1 : Number(dado[1]);
      const faces = Number(dado[2]);
      let mantidos = qtd;
      const k = /k[hl]?(\d+)/i.exec(dado[3] ?? "");
      if (k) mantidos = Math.min(qtd, Number(k[1]));
      else if (/k[hl]?$/i.test(dado[3] ?? "")) mantidos = Math.min(qtd, 1);
      out.push({ t: "n", v: mantidos * faces });
      i += dado[0].length;
      continue;
    }
    const n = /^\d+(?:\.\d+)?/.exec(resto);
    if (n) { out.push({ t: "n", v: Number(n[0]) }); i += n[0].length; continue; }
    return null;
  }
  return out;
}

/**
 * Valor máximo possível de uma fórmula ("2d6 + 3" → 15). Referências @x.y são lidas de `dados`.
 * Retorna null se a fórmula não puder ser interpretada.
 */
export function maxFormula(formula, dados = {}) {
  if (formula === null || formula === undefined) return null;
  const s = String(formula).trim();
  if (!s) return 0;
  const tokens = tokenizar(s, dados);
  if (!tokens || !tokens.length) return null;
  let i = 0;
  const espiar = () => tokens[i];
  const proximo = () => tokens[i++];
  const fator = () => {
    const tk = proximo();
    if (!tk) throw new Error("fim");
    if (tk.t === "-") return -fator();
    if (tk.t === "+") return fator();
    if (tk.t === "n") return tk.v;
    if (tk.t === "(") {
      const v = expressao();
      if (proximo()?.t !== ")") throw new Error("parêntese");
      return v;
    }
    throw new Error("token");
  };
  const termo = () => {
    let v = fator();
    while (espiar() && (espiar().t === "*" || espiar().t === "/")) {
      const op = proximo().t;
      const r = fator();
      v = op === "*" ? v * r : (r === 0 ? NaN : v / r);
    }
    return v;
  };
  const expressao = () => {
    let v = termo();
    while (espiar() && (espiar().t === "+" || espiar().t === "-")) {
      const op = proximo().t;
      const r = termo();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  };
  try {
    const v = expressao();
    if (i !== tokens.length || !Number.isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
}

/** Junta uma parte de dano a uma fórmula existente ("2d6" + "1d6" → "2d6 + 1d6"). */
export function somarFormula(formula, parte) {
  const f = String(formula ?? "").trim();
  return f ? `${f} + ${parte}` : String(parte);
}

/* -------------------------------------------- */
/*  Moedas                                      */
/* -------------------------------------------- */

export function limparMoedas(moedas = {}) {
  return Object.fromEntries(MOEDAS.map(m => [m.id, Math.max(0, Math.floor(num(moedas[m.id])))]));
}

export function valorEmCobre(moedas = {}) {
  const m = limparMoedas(moedas);
  return MOEDAS.reduce((soma, c) => soma + m[c.id] * c.valor, 0);
}

/** Quebra um valor em cobre na menor quantidade de moedas. */
export function decompor(cobre) {
  const out = {};
  let resto = Math.max(0, Math.floor(num(cobre)));
  for (const c of MOEDAS_DESC) {
    out[c.id] = Math.floor(resto / c.valor);
    resto -= out[c.id] * c.valor;
  }
  return out;
}

/** Converte moedas pequenas em maiores (100 cobres → 1 ouro …). */
export function consolidarMoedas(moedas) {
  return decompor(valorEmCobre(moedas));
}

/**
 * Paga um valor (em cobre) com as moedas disponíveis, gastando as maiores primeiro sem passar
 * do valor e quebrando uma moeda maior se faltar troco. Retorna null se não houver dinheiro.
 */
export function pagarMoedas(moedas, custo) {
  const m = limparMoedas(moedas);
  let resto = Math.max(0, Math.floor(num(custo)));
  if (!resto) return m;
  if (valorEmCobre(m) < resto) return null;
  for (const c of MOEDAS_DESC) {
    const n = Math.min(m[c.id], Math.floor(resto / c.valor));
    m[c.id] -= n;
    resto -= n * c.valor;
  }
  if (resto > 0) {
    const quebrar = MOEDAS.find(c => m[c.id] > 0 && c.valor > resto);
    if (!quebrar) return null;
    m[quebrar.id] -= 1;
    let troco = quebrar.valor - resto;
    for (const c of MOEDAS_DESC) {
      if (c.valor >= quebrar.valor) continue;
      const n = Math.floor(troco / c.valor);
      m[c.id] += n;
      troco -= n * c.valor;
    }
  }
  return m;
}

/** "1 DR, 250 PL, 3 PO" (só as moedas que aparecem, da maior para a menor). */
export function formatarMoedas(cobre) {
  const partes = decompor(cobre);
  const texto = MOEDAS_DESC.filter(c => partes[c.id]).map(c => `${partes[c.id].toLocaleString("pt-BR")} ${c.abrev}`);
  return texto.length ? texto.join(", ") : "0 PC";
}

export function moedaPorId(id) {
  return MOEDAS.find(m => m.id === id) ?? null;
}

/* -------------------------------------------- */
/*  Ataques                                     */
/* -------------------------------------------- */

/** O tipo de uma resistência/RD vale para este dano? ("todos os danos" vale para qualquer um; aceita lista com vírgula.) */
export function tipoCobre(tipos, tipoDano) {
  const lista = String(tipos ?? "").split(/[,;/]| e /).map(t => normalizarTexto(t)).filter(Boolean);
  if (!lista.length || lista.some(t => t.startsWith("todo"))) return true;
  const alvo = normalizarTexto(tipoDano);
  return !!alvo && lista.includes(alvo);
}

/**
 * Dano que o alvo recebe: imunidade zera, a RD tira o número fixo e a resistência corta à metade
 * (RD antes da resistência). Devolve { final, passos } para explicar no aviso.
 */
export function danoRecebido(ficha, valor, tipoDano = "") {
  let dano = Math.max(0, Math.floor(num(valor)));
  const passos = [];
  const tags = ficha?.tags ?? {};
  const imune = (tags.imunidades ?? []).find(t => tipoCobre(t.tipo, tipoDano));
  if (dano && imune) return { final: 0, passos: [`imune (${imune.tipo})`] };
  const rd = (tags.reducoes ?? []).filter(r => tipoCobre(r.tipos, tipoDano)).reduce((s, r) => s + num(r.valor), 0);
  if (dano && rd) { const antes = dano; dano = Math.max(0, dano - rd); passos.push(`RD ${rd}: ${antes} → ${dano}`); }
  const resiste = (tags.resistencias ?? []).find(t => tipoCobre(t.tipo, tipoDano));
  if (dano && resiste) { const antes = dano; dano = Math.floor(dano / 2); passos.push(`resistência (${resiste.tipo}): ${antes} → ${dano}`); }
  return { final: dano, passos };
}

/** Multiplica a quantidade de dados de uma fórmula (crítico ×3: "2d10 + 4" → "6d10 + 4"). */
export function multiplicarDados(formula, mult) {
  const m = Math.max(1, int(mult, 1));
  return String(formula ?? "").replace(/(\d*)[dD](\d+)/g, (_, n, f) => `${(n === "" ? 1 : Number(n)) * m}d${f}`);
}

/** Soma dos bônus de cena ativos (ex.: "+1d8 de dano pela cena"). */
export function bonusCenaAtivos(dados) {
  const ativos = Object.values(dados?.bonusCena ?? {}).filter(b => b?.ativo);
  return {
    acerto: ativos.reduce((s, b) => s + int(b.acerto), 0),
    dano: ativos.map(b => String(b.dano ?? "").trim()).filter(Boolean),
    nomes: ativos.map(b => b.nome || "Bônus").filter(Boolean)
  };
}
