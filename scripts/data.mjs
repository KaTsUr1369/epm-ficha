/**
 * Camada de regras "pura": não depende do Foundry, para poder ser testada fora dele.
 * Recebe dados simples e devolve números prontos para a ficha.
 */
import {
  FLAG, ATRIBUTOS, GRUPOS_ATRIBUTO, PERICIAS_PADRAO, RECURSOS, REGRAS, custoNivel,
  RARIDADES_PODER, RARIDADES_ITEM, RARIDADE_DND5E, CONDICOES, EXAUSTAO, DEFESAS, MOEDAS,
  ACOES, ACOES_BLOQUEADAS_COMA, REQUISITOS, TIPOS_TESTE, CUSTO_RECURSOS, RECARGAS, CD
} from "./config.mjs";

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

export function dadosPadrao(listaPericias = PERICIAS_PADRAO) {
  return {
    versao: 2,
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
    ca: { base: 10, bonus: 0 },
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
    relacoes: {},
    ataques: {},
    bonusCena: {}
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

/* -------------------------------------------- */
/*  Ficha derivada                              */
/* -------------------------------------------- */

function lerModsAE(modsAE, somar) {
  if (!eObjeto(modsAE)) return;
  const fonte = "Efeitos ativos";
  const grupos = { atributos: "atributo", pericias: "pericia", recursos: "recurso", defesas: "defesa" };
  for (const [chave, prefixo] of Object.entries(grupos)) {
    for (const [id, valor] of Object.entries(modsAE[chave] ?? {})) somar(`${prefixo}.${id}`, valor, fonte);
  }
  for (const chave of ["ca", "deslocamento", "iniciativa"]) {
    if (modsAE[chave] !== undefined) somar(chave, modsAE[chave], fonte);
  }
}

/**
 * Calcula tudo que a ficha mostra a partir dos dados salvos.
 * @param {object} p
 * @param {object} p.dados       dados normalizados (normalizarDados)
 * @param {object} p.hp          { value, max (efetivo do dnd5e), maxFonte, temp }
 * @param {Iterable} p.statuses  ids de status ativos no ator
 * @param {object} p.modsAE      actor.flags[FLAG].mods depois dos Active Effects
 */
export function calcularFicha({ dados, hp = {}, statuses = [], modsAE = {} }) {
  const d = dados;
  const st = new Set(statuses);
  const nivel1 = Math.max(0, int(d.nivel, 1));
  const temSegundo = !!String(d.arquetipo2 ?? "").trim();
  const nivel2 = temSegundo ? Math.max(0, int(d.nivel2, 0)) : 0;
  const nivelTotal = nivel1 + nivel2;
  const exaustao = Math.max(0, int(d.exaustao, 0));
  const coma = exaustao >= 6;

  // Condições e imunidades
  const imunes = new Set((d.imunidades ?? []).map(normalizarTexto));
  const condicoes = CONDICOES.map(c => {
    const ativa = st.has(c.id);
    const imune = imunes.has(normalizarTexto(c.label));
    return { ...c, ativa, imune, efetiva: ativa && !imune, resumo: resumirEfeitos(c.efeitos) };
  });
  const efetivas = condicoes.filter(c => c.efetiva);

  // Modificadores
  const mods = {};
  const somar = (alvo, valor, fonte) => {
    const v = num(valor);
    if (!alvo || !v) return;
    mods[alvo] ??= { total: 0, fontes: [] };
    mods[alvo].total += v;
    mods[alvo].fontes.push({ fonte, valor: v });
  };
  for (const b of Object.values(d.bencaos ?? {})) {
    if (!b?.ativo) continue;
    const fonte = b.nome || (b.tipo === "maldicao" ? "Maldição" : "Bênção");
    for (const m of Object.values(b.mods ?? {})) somar(m?.alvo, m?.valor, fonte);
  }
  for (const c of efetivas) for (const m of c.efeitos.mods ?? []) somar(m.alvo, m.valor, c.label);
  lerModsAE(modsAE, somar);
  const mod = alvo => mods[alvo]?.total ?? 0;
  const fontes = alvo => mods[alvo]?.fontes ?? [];

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
    atributos[id] = { id, ...cfg, base, raca, aumento, outros, mod: m, total: base + raca + aumento + outros + m, fontes: fontes(`atributo.${id}`) };
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
    const m = mod(`pericia.${id}`);
    return {
      id, nome: p.nome || id, atributos: atrs,
      sugestoes: (Array.isArray(p.sugestoes) ? p.sugestoes : []).filter(a => ATRIBUTOS[a]),
      atributoAbrev: atrs.length ? atrs.map(a => ATRIBUTOS[a].abrev).join(" + ") : "—",
      pontos, outros, valorAtributo, mod: m,
      bonusProprio: pontos + outros + m,
      total: pontos + valorAtributo + outros + m,
      acimaLimite: pontos > limitePericia, fontes: fontes(`pericia.${id}`)
    };
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const periciaPorId = Object.fromEntries(pericias.map(p => [p.id, p]));

  // Recursos
  const recursos = {};
  {
    let max = num(hp.max) + mod("recurso.pv");
    const motivos = [];
    if (exaustao >= 4) { max = Math.floor(max / 2); motivos.push("Exaustão 4"); }
    recursos.pv = {
      id: "pv", ...RECURSOS.pv, value: num(hp.value), max, maxFonte: hp.maxFonte ?? "",
      temp: num(hp.temp), mod: mod("recurso.pv"), fontes: fontes("recurso.pv"), motivos
    };
  }
  for (const id of ["pm", "pe", "ps"]) {
    const r = d.recursos?.[id] ?? {};
    recursos[id] = {
      id, ...RECURSOS[id], value: num(r.value), maxFonte: num(r.max),
      max: num(r.max) + mod(`recurso.${id}`), mod: mod(`recurso.${id}`), fontes: fontes(`recurso.${id}`), motivos: []
    };
  }
  for (const r of Object.values(recursos)) {
    r.pct = r.max > 0 ? limitar(r.value / r.max, 0, 1) : 0;
    r.maxDiferente = r.max !== num(r.id === "pv" ? hp.maxFonte : r.maxFonte);
  }

  // CA
  const ca = { base: int(d.ca?.base, 10), bonus: int(d.ca?.bonus), mod: mod("ca"), fontes: fontes("ca") };
  ca.total = ca.base + ca.bonus + ca.mod;

  // Deslocamento
  const deslocamento = { base: num(d.deslocamento?.base, 9), mod: mod("deslocamento"), fontes: fontes("deslocamento"), motivos: [] };
  let mult = 1;
  for (const c of efetivas) {
    if (c.efeitos.deslocamentoMult === undefined) continue;
    mult = Math.min(mult, c.efeitos.deslocamentoMult);
    deslocamento.motivos.push(c.label);
  }
  if (coma) { mult = 0; deslocamento.motivos.push("Coma"); }
  else if (exaustao >= 5) { mult = 0; deslocamento.motivos.push("Exaustão 5"); }
  else if (exaustao >= 2) { mult = Math.min(mult, 0.5); deslocamento.motivos.push("Exaustão 2"); }
  deslocamento.mult = mult;
  deslocamento.final = arredondar(Math.max(0, deslocamento.base + deslocamento.mod) * mult, 2);
  deslocamento.reduzido = deslocamento.final < deslocamento.base + deslocamento.mod;

  // Exaustão
  const diasExtra = Math.max(0, exaustao - 6) * 2;
  const exaustaoInfo = {
    nivel: exaustao, coma, diasExtra,
    formulaComa: diasExtra ? `1d6 + ${diasExtra}` : "1d6",
    efeitos: EXAUSTAO.filter(e => e.nivel <= Math.min(exaustao, 6)),
    pips: EXAUSTAO.map(e => ({ nivel: e.nivel, ativo: exaustao >= e.nivel, texto: e.texto }))
  };

  // Desvantagens
  const desvantagens = { testes: [], ataques: [], resistencias: [] };
  for (const c of efetivas) {
    if (c.efeitos.desvantagemTestes) desvantagens.testes.push(c.label);
    if (c.efeitos.desvantagemAtaques) desvantagens.ataques.push(c.label);
  }
  if (exaustao >= 1) desvantagens.testes.push("Exaustão 1");
  if (exaustao >= 3) { desvantagens.ataques.push("Exaustão 3"); desvantagens.resistencias.push("Exaustão 3"); }

  // Bloqueios
  const bloqueios = { acoes: {}, requisitos: {} };
  for (const c of efetivas) {
    for (const a of c.efeitos.bloqueiaAcoes ?? []) (bloqueios.acoes[a] ??= []).push(c.label);
    for (const r of c.efeitos.bloqueiaRequisitos ?? []) (bloqueios.requisitos[r] ??= []).push(c.label);
  }
  if (coma) for (const a of ACOES_BLOQUEADAS_COMA) (bloqueios.acoes[a] ??= []).push("Coma");

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

  // Iniciativa
  const iniciativa = {
    fonte: ATRIBUTOS.destreza.label,
    base: atributos.destreza.total,
    bonus: int(d.iniciativa?.bonus), mod: mod("iniciativa"), fontes: fontes("iniciativa")
  };
  iniciativa.total = iniciativa.base + iniciativa.bonus + iniciativa.mod;

  // Ações do turno
  const a = d.acoes ?? {};
  const acoes = {
    padrao: !!a.padrao, bonus: !!a.bonus, movimento: !!a.movimento, reacao: !!a.reacao,
    defesas: limitar(int(a.defesas), 0, REGRAS.maxDefesasPorRodada),
    especiais: ["lendaria", "mitica", "arcaica"].map(id => ({
      id, label: ACOES[id].label, value: int(a[id]?.value), max: int(a[id]?.max)
    }))
  };
  acoes.temEspeciais = acoes.especiais.some(e => e.max > 0);

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

  return {
    nivelTotal, atributos, gruposAtributo,
    pontosAtributo: {
      disponivel: disponivelAtributos, gasto: gastoAtributos, restante: disponivelAtributos - gastoAtributos,
      aumentoDisponivel: disponivelAumento, aumentoGasto: gastoAumento, avisos: avisosAtributos
    },
    cd: { valor: CD.base + (periciaPorId[CD.pericia]?.total ?? 0), base: CD.base, periciaNome: periciaPorId[CD.pericia]?.nome ?? CD.pericia },
    pericias, periciaPorId,
    pontosPericia: {
      disponivel: disponivelPericias, gasto: gastoPericias, restante: disponivelPericias - gastoPericias,
      limite: limitePericia, excedido: gastoPericias > disponivelPericias
    },
    recursos, ca, deslocamento, exaustao: exaustaoInfo,
    condicoes, condicoesAtivas: condicoes.filter(c => c.ativa),
    desvantagens, bloqueios, defesas, iniciativa, acoes, pontos, progressao, mods
  };
}

/** Texto curto do que uma condição faz, para mostrar no cartão. */
export function resumirEfeitos(efeitos = {}) {
  const partes = [];
  if (efeitos.deslocamentoMult === 0) partes.push("Deslocamento 0");
  else if (efeitos.deslocamentoMult !== undefined) partes.push(`Deslocamento ×${efeitos.deslocamentoMult}`);
  if (efeitos.desvantagemTestes) partes.push("Desvantagem em testes");
  if (efeitos.desvantagemAtaques) partes.push("Desvantagem em ataques");
  const acoes = efeitos.bloqueiaAcoes ?? [];
  if (acoes.length >= 8) partes.push("Sem ações");
  else if (acoes.length) partes.push(`Sem ${acoes.map(a => ACOES[a]?.curto ?? a).join(", ")}`);
  const reqs = efeitos.bloqueiaRequisitos ?? [];
  if (reqs.length) partes.push(`Bloqueia: ${reqs.map(r => REQUISITOS[r]?.label ?? r).join(", ")}`);
  for (const m of efeitos.mods ?? []) partes.push(`${m.alvo} ${m.valor > 0 ? "+" : ""}${m.valor}`);
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

/**
 * Verifica se uma forma pode ser usada agora e se respeita os limites da raridade.
 * @returns {{bloqueada:boolean, motivos:string[], semRecurso:boolean, excedeDano:boolean, maxDano:number|null, teto:number|null}}
 */
export function avaliarForma(forma, ficha, { raridade = "comum", melhorias = [], dadosRolagem = {} } = {}) {
  const motivos = [];
  if (forma && forma.acao !== "passiva") {
    motivos.push(...(ficha.bloqueios.acoes[forma.acao] ?? []));
    for (const [req, ligado] of Object.entries(forma.requisitos ?? {})) {
      if (ligado) motivos.push(...(ficha.bloqueios.requisitos[req] ?? []));
    }
  }
  const recurso = forma?.custo?.recurso;
  const valor = forma?.custo?.valor ?? 0;
  const atual = recurso && recurso !== "nenhum" ? ficha.recursos[recurso]?.value ?? 0 : null;
  const maxDano = forma?.dano?.formula ? maxFormula(forma.dano.formula, dadosRolagem) : null;
  const teto = tetoDano(raridade);
  const efeitosUsados = forma ? contarEfeitos(melhorias, forma.id) : 0;
  const limiteEfeitos = RARIDADES_PODER[raridade]?.efeitos ?? 0;
  return {
    bloqueada: motivos.length > 0,
    motivos: [...new Set(motivos)],
    semRecurso: atual !== null && valor > atual,
    maxDano, teto,
    excedeDano: maxDano !== null && teto !== null && maxDano > teto,
    efeitosUsados, limiteEfeitos,
    excedeEfeitos: efeitosUsados > limiteEfeitos
  };
}

export function textoCusto(forma) {
  if (!forma || forma.custo.recurso === "nenhum" || !forma.custo.valor) return "Sem custo";
  return `${forma.custo.valor} ${CUSTO_RECURSOS[forma.custo.recurso].sigla}`;
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
  for (const c of MOEDAS) {
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
  for (const c of MOEDAS) {
    const n = Math.min(m[c.id], Math.floor(resto / c.valor));
    m[c.id] -= n;
    resto -= n * c.valor;
  }
  if (resto > 0) {
    const quebrar = [...MOEDAS].reverse().find(c => m[c.id] > 0 && c.valor > resto);
    if (!quebrar) return null;
    m[quebrar.id] -= 1;
    let troco = quebrar.valor - resto;
    for (const c of MOEDAS) {
      if (c.valor >= quebrar.valor) continue;
      const n = Math.floor(troco / c.valor);
      m[c.id] += n;
      troco -= n * c.valor;
    }
  }
  return m;
}

/** "1 JK, 250 PL, 3 PO" (só as moedas que aparecem). */
export function formatarMoedas(cobre) {
  const partes = decompor(cobre);
  const texto = MOEDAS.filter(c => partes[c.id]).map(c => `${partes[c.id].toLocaleString("pt-BR")} ${c.abrev}`);
  return texto.length ? texto.join(", ") : "0 PC";
}

export function moedaPorId(id) {
  return MOEDAS.find(m => m.id === id) ?? null;
}

/* -------------------------------------------- */
/*  Ataques                                     */
/* -------------------------------------------- */

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
