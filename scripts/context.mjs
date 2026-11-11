/**
 * Monta o contexto dos templates a partir dos dados do ator.
 * Não usa APIs do Foundry diretamente: recebe objetos simples (ou documentos) e devolve dados prontos.
 * O que depende do Foundry (lista de idiomas, outros atores) chega já resolvido pela ficha.
 */
import {
  FLAG, ATRIBUTOS, RARIDADES_ITEM, RARIDADES_PODER, ORIGENS_HABILIDADE, CIRCULOS,
  ACOES, ACOES_TURNO, CATEGORIAS_ITEM, CATEGORIA_MOCHILAS, MOEDAS, CAMPOS_SOBRE, TEXTOS_SOBRE, TIPOS_RELACAO,
  AFINIDADE, ABAS, SUGESTOES, ARQUETIPOS_SUGERIDOS, alvosModificador, REQUISITOS,
  PERICIAS_PADRAO, CUSTO_RECURSOS, TIPOS_TESTE, MELHORIAS, CRITICO_PADRAO, COR_VIDA_TEMP, CORES_TEMP, CD,
  CATEGORIAS_CONDICAO, TIPOS_EFEITO_ITEM, QUANDO_CURA, RECURSOS, REVELACOES, OPCOES_REVELAR,
  CORES_PRONTAS, COR_PADRAO, BRILHO_PADRAO, SUBABAS_HABILIDADE, TREINO, UNIDADES_TEMPO, ESTADOS_TREINO, MINIJOGOS, EXEMPLOS_TREINAMENTO
} from "./config.mjs";
import {
  num, int, limitar, normalizarDados, calcularFicha, lerPoder, avaliarForma, textoCusto, contarRaridades,
  situacaoLimite, raridadeItem, valorEmCobre, formatarMoedas, arredondar, bonusCenaAtivos, entradaPericia, lerCaminho,
  efeitosDeItens, lerEfeitosItem, resumoEfeitoItem, itemAtivo, ordenarPorLista, normalizarTexto
} from "./data.mjs";
import {
  CATALOGO, NATUREZAS, RARIDADES_BENCAO, FREQUENCIAS, REGRAS_BENCAOS, GRUPOS_BENCAO, textoBusca, automacaoDe
} from "./bencaos.mjs";
import { normalizarHex, posicaoNaRoda, estiloPaleta } from "./cores.mjs";

/** Dados de rolagem do EPM (@atr.forca, @per.luta, @nivel, @cd …). */
export function dadosRolagemEPM(ficha) {
  return {
    atr: Object.fromEntries(Object.values(ficha.atributos).map(a => [a.id, a.total])),
    per: Object.fromEntries(ficha.pericias.map(p => [p.id, p.total])),
    nivel: ficha.nivelTotal,
    ca: ficha.ca.total,
    cd: ficha.cd.valor,
    pv: ficha.recursos.pv.value, pm: ficha.recursos.pm.value,
    pe: ficha.recursos.pe.value, ps: ficha.recursos.ps.value
  };
}

/** Dados do ator prontos para o cálculo (usado pela ficha, pelas rolagens e pelo chat). */
export function lerAtor(actor, listaPericias) {
  const bruto = actor?.flags?.[FLAG] ?? {};
  const dados = normalizarDados(bruto, listaPericias);
  const hpDerivado = actor?.system?.attributes?.hp ?? {};
  const hpFonte = actor?._source?.system?.attributes?.hp ?? hpDerivado;
  const hp = { value: num(hpDerivado.value), max: num(hpDerivado.max), maxFonte: hpFonte.max ?? "", temp: num(hpDerivado.temp) };
  const statuses = actor?.statuses ? [...actor.statuses] : [];
  let itens = [];
  try { itens = efeitosDeItens(actor?.items?.contents ?? actor?.items ?? []); } catch { itens = []; }
  const ficha = calcularFicha({ dados, hp, statuses, modsAE: bruto.mods, itens });
  return { dados, ficha, hp };
}

const fontesTexto = fontes => (fontes ?? []).map(f => `${f.fonte}: ${f.valor > 0 ? "+" : ""}${f.valor}`).join("\n");

function rotuloAfinidade(v) {
  if (v <= -4) return "Hostil";
  if (v <= -2) return "Antipatia";
  if (v <= 1) return "Neutra";
  if (v <= 3) return "Simpatia";
  return "Leal";
}

function pesoItem(item) {
  const w = item?.system?.weight;
  return num(typeof w === "object" && w !== null ? w.value : w);
}

export function danoArma(item) {
  const f = item?.flags?.[FLAG]?.dano;
  if (f) return f;
  const base = item?.system?.damage?.base;
  try { if (base?.formula) return base.formula; } catch { /* getter pode falhar fora do dnd5e */ }
  if (base?.number && base?.denomination) return `${base.number}d${base.denomination}${base.bonus ? ` + ${base.bonus}` : ""}`;
  const partes = item?.system?.damage?.parts;
  if (Array.isArray(partes) && partes[0]?.[0]) return partes[0][0];
  return "";
}

/** Perícia padrão de ataque de uma arma: Pontaria para armas à distância, Luta para o resto. */
export function periciaAtaquePadrao(item) {
  const escolhida = item?.flags?.[FLAG]?.periciaAtaque;
  if (escolhida) return escolhida;
  return /R$/.test(String(item?.system?.type?.value ?? "")) ? "pontaria" : "luta";
}

/* -------------------------------------------- */
/*  Ataques                                     */
/* -------------------------------------------- */

export function ataqueDeArma(item) {
  const f = item?.flags?.[FLAG] ?? {};
  const margemNativa = int(item?.system?.critical?.threshold, CRITICO_PADRAO.margem) || CRITICO_PADRAO.margem;
  const efeitos = lerEfeitosItem(item);
  return {
    tipo: "arma", id: item.id, nome: item.name, img: item.img,
    periciaId: periciaAtaquePadrao(item), bonusAcerto: int(f.bonusAcerto), dano: danoArma(item), tipoDano: f.tipoDano ?? "",
    critMargem: limitar(int(f.critMargem, margemNativa), 2, 20), critMult: Math.max(2, int(f.critMult, CRITICO_PADRAO.mult)),
    equipado: !!item?.system?.equipped,
    danoExtra: efeitos.filter(e => e.tipo === "danoExtra" && e.formula).map(e => ({ formula: e.formula, tipo: e.tipoDano })),
    curas: efeitos.filter(e => e.tipo === "cura" && e.quando === "acerto" && e.formula).map(e => ({ formula: e.formula, recurso: e.recurso }))
  };
}

export function ataqueCustom(id, a = {}) {
  return {
    tipo: "custom", id, nome: a.nome || "Ataque", img: "",
    periciaId: a.pericia || "luta", bonusAcerto: int(a.bonusAcerto), dano: a.dano ?? "", tipoDano: a.tipoDano ?? "",
    critMargem: limitar(int(a.critMargem, CRITICO_PADRAO.margem), 2, 20), critMult: Math.max(2, int(a.critMult, CRITICO_PADRAO.mult)),
    notas: a.notas ?? "", criado: num(a.criado), danoExtra: [], curas: []
  };
}

export function textoCritico(margem, mult) {
  return `${margem < 20 ? `${margem}–20` : "20"}/×${mult}`;
}

/** Troca @atr.x, @per.y… pelos valores atuais, só para exibir ("2d8 + @atr.nucleo" → "2d8 + 6"). */
export function resolverReferencias(formula, ficha) {
  const dados = dadosRolagemEPM(ficha);
  return String(formula ?? "").replace(/@([\w.]+)/g, (_, caminho) => {
    const v = Number(lerCaminho(dados, caminho));
    return Number.isFinite(v) ? String(v) : "0";
  });
}

/** Ataque à distância? (usa Pontaria) */
export const ataqueADistancia = at => at?.periciaId === "pontaria";

/** Modificadores gerais que valem num ataque (condições, bênçãos, itens). */
export function modsDoAtaque(at, ficha) {
  const g = ficha.ataquesGerais;
  const distancia = ataqueADistancia(at) ? g.distancia : 0;
  return {
    acerto: g.penal + distancia,
    acertoFontes: [...g.fontes, ...(ataqueADistancia(at) ? g.fontesDistancia : [])],
    dano: g.dano, danoFontes: g.fontesDano,
    danoExtra: [...g.danoExtra.map(x => x.formula), ...(at.danoExtra ?? []).map(x => x.formula)],
    danoMult: g.danoMult.valor
  };
}

export function resumoAtaque(at, ficha, cena) {
  const per = ficha.periciaPorId[at.periciaId];
  const m = modsDoAtaque(at, ficha);
  const partesDano = [at.dano, ...cena.dano, ...m.danoExtra].filter(Boolean).map(f => resolverReferencias(f, ficha));
  if (m.dano) partesDano.push(String(m.dano));
  return {
    ...at,
    periciaNome: per?.nome ?? "sem perícia",
    acertoTotal: (per?.total ?? 0) + at.bonusAcerto + cena.acerto + m.acerto,
    acertoMods: m.acerto, acertoModsTexto: fontesTexto(m.acertoFontes),
    danoTexto: partesDano.join(" + ").replace(/\+ -/g, "− "),
    danoBase: at.dano ? resolverReferencias(at.dano, ficha).replace(/\+ -/g, "− ") : "",
    danoMult: m.danoMult > 1 ? m.danoMult : 0,
    critTexto: textoCritico(at.critMargem, at.critMult),
    bloqueado: ficha.ataquesGerais.bloqueados.join(", ")
  };
}

/** Aplica `fn` a cada elemento; se um falhar, ele é pulado e o nome vai para `falhas`. */
function cadaSeguro(lista, fn, falhas) {
  const out = [];
  for (const x of lista) {
    try {
      const r = fn(x);
      if (r) out.push(r);
    } catch (err) {
      let nome = "?";
      try { nome = x?.name ?? x?.nome ?? "?"; } catch { /* nome ilegível */ }
      console.warn(`EPM | Ignorado ao montar a ficha: ${nome}`, err);
      if (!falhas.includes(nome)) falhas.push(nome);
    }
  }
  return out;
}

const sinal = v => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0");

/* -------------------------------------------- */
/*  Idiomas                                     */
/* -------------------------------------------- */

/**
 * Idiomas do ator: chaves de system.traits.languages.value (rótulos vindos do Polyglot ou do D&D)
 * e os personalizados (system.traits.languages.custom, separados por ";").
 */
export function idiomasDoAtor(actor, catalogo = []) {
  const langs = actor?.system?.traits?.languages ?? {};
  const rotulo = new Map(catalogo.map(l => [l.key, l.label]));
  const valor = langs.value instanceof Set ? [...langs.value] : (Array.isArray(langs.value) ? langs.value : []);
  const conhecidos = valor.map(key => ({ key, label: rotulo.get(key) ?? key, custom: false }));
  const custom = String(langs.custom ?? "").split(";").map(t => t.trim()).filter(Boolean).map(label => ({ key: "", label, custom: true }));
  return [...conhecidos, ...custom].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

/* -------------------------------------------- */
/*  Background revelado nas relações            */
/* -------------------------------------------- */

/** Nível de afinidade que libera cada parte do background de um personagem. */
export function niveisRevelacao(sobre = {}) {
  const salvo = sobre?.revelar ?? {};
  return Object.fromEntries(REVELACOES.map(r => {
    const v = salvo[r.id];
    const valido = v === "sempre" || v === "nunca" || (int(v) >= 1 && int(v) <= AFINIDADE.max);
    return [r.id, valido ? (typeof v === "string" && isNaN(Number(v)) ? v : int(v)) : r.padrao];
  }));
}

export function revelado(nivel, afinidade) {
  if (nivel === "sempre") return true;
  if (nivel === "nunca") return false;
  return afinidade >= int(nivel);
}

const temTexto = html => !!String(html ?? "").replace(/<[^>]*>/g, "").trim();

/**
 * O que cada parte do background de um personagem mostra para quem tem a relação liberada.
 * `enriquecidos` traz o HTML já enriquecido dos textos longos (a ficha faz isso antes).
 */
export function conteudoRevelacoes(dadosParceiro = {}, enriquecidos = {}) {
  const sobre = dadosParceiro?.sobre ?? {};
  const out = {};
  const campos = CAMPOS_SOBRE.map(c => ({ label: c.label, valor: sobre[c.id] ?? "" })).filter(c => String(c.valor).trim());
  out.tracos = { campos, vazio: !campos.length };
  out.aparencia = { imagem: sobre.imagemAparencia ?? "", html: temTexto(sobre.aparencia) ? (enriquecidos.aparencia ?? "") : "" };
  out.aparencia.vazio = !out.aparencia.imagem && !out.aparencia.html;
  out.marca = { imagem: sobre.imagemMarca ?? "", local: sobre.marcaLocal ?? "", texto: sobre.marcaAparencia ?? "" };
  out.marca.vazio = !out.marca.imagem && !String(out.marca.local).trim() && !String(out.marca.texto).trim();
  for (const id of ["personalidade", "objetivos", "medos", "historia", "outros"]) {
    out[id] = { html: temTexto(sobre[id]) ? (enriquecidos[id] ?? "") : "" };
    out[id].vazio = !out[id].html;
  }
  return out;
}

/* -------------------------------------------- */

export function montarContexto({
  actor, itens = [], ui = {}, ajustes = {}, usuario = {}, enriquecidos = {}, editores = {}, editavel = false,
  idiomas = { catalogo: [], polyglot: false }, atores = {}
}) {
  const { dados, ficha } = lerAtor(actor, ajustes.listaPericias);
  const rolagem = dadosRolagemEPM(ficha);
  const edicao = !!ui.edicao && editavel;
  const isGM = !!usuario.isGM;
  const ordemAbas = ordenarPorLista(ABAS.map(a => a.id), dados.ui?.ordemAbas);
  const abasExtras = dados.personalizacao?.abasExtras ?? {};
  const abasVisiveis = ordemAbas.map(id => ABAS.find(a => a.id === id))
    .filter(a => a && (!a.soEdicao || edicao) && (!a.opcional || abasExtras[a.id]));
  let abaAtual = ui.limitado ? "sobre" : (ui.abas?.primary ?? "principal");
  if (!abasVisiveis.some(a => a.id === abaAtual)) abaAtual = ui.limitado ? "sobre" : "principal";
  const cls = Object.fromEntries(ABAS.map(a => [a.id, a.id === abaAtual ? "active" : ""]));
  const expandidos = ui.expandidos ?? new Set();
  const filtro = ui.filtroRaridades ?? new Set();
  const cena = bonusCenaAtivos(dados);
  const falhas = [];
  const tipoDe = i => { try { return i?.type; } catch { return undefined; } };

  const ctx = {
    actor: { id: actor.id, uuid: actor.uuid, name: actor.name, img: actor.img },
    editavel, edicao, isGM, limitado: !!ui.limitado, tempAberto: !!ui.tempAberto && editavel,
    dados, ficha, cls, abaAtual,
    abas: abasVisiveis.map(a => ({ ...a, ativa: a.id === abaAtual })),
    arquetiposSugeridos: ARQUETIPOS_SUGERIDOS
  };

  /* ---------- Personalização (cor da ficha) ---------- */
  const cor = normalizarHex(dados.personalizacao?.cor, COR_PADRAO);
  const brilho = limitar(int(dados.personalizacao?.brilho, BRILHO_PADRAO), 0, 100);
  ctx.estiloFicha = estiloPaleta(cor, brilho);
  const pos = posicaoNaRoda(cor);
  ctx.personalizacao = {
    cor, brilho, padrao: cor === COR_PADRAO && brilho === BRILHO_PADRAO,
    marcadorX: arredondar(50 + Math.cos((pos.angulo - 90) * Math.PI / 180) * pos.raio * 50, 2),
    marcadorY: arredondar(50 + Math.sin((pos.angulo - 90) * Math.PI / 180) * pos.raio * 50, 2),
    prontas: CORES_PRONTAS.map(c => ({ ...c, ativa: normalizarHex(c.cor) === cor })),
    abas: ordemAbas.map((id, i, lista) => {
      const a = ABAS.find(x => x.id === id);
      return { id, label: a.titulo && a.opcional ? a.titulo : a.label, icone: a.icone, primeira: i === 0, ultima: i === lista.length - 1,
        opcional: !!a.opcional, ligada: !a.opcional || !!abasExtras[a.id] };
    }),
    ordemPadrao: !(dados.ui?.ordemAbas ?? []).length
  };

  /* ---------- Cabeçalho ---------- */
  const raios = { pv: 66, pm: 60, pe: 54, ps: 48 };
  ctx.recursosLista = ["pv", "pm", "pe", "ps"].map(id => {
    const r = ficha.recursos[id];
    const eVida = id === "pv";
    const avisos = [...r.semRecuperar.map(f => `Não recupera (${f})`), ...r.recuperaMetade.map(f => `Recupera metade (${f})`)];
    return {
      ...r, eVida,
      nomeMax: eVida ? "system.attributes.hp.max" : `flags.${FLAG}.recursos.${id}.max`,
      temTemp: r.temp > 0,
      tempPct: r.max > 0 ? limitar(r.temp / r.max, 0, 1) : 0,
      corTemp: CORES_TEMP[id] ?? COR_VIDA_TEMP,
      tempId: eVida ? "temp" : `temp-${id}`,
      tempAberto: editavel && ui.tempAberto === id,
      tempLabel: `${r.label} temporária`,
      bloqueado: r.semRecuperar.length > 0,
      motivosTexto: [...r.motivos, ...r.fontes.map(f => `${f.fonte}: ${f.valor > 0 ? "+" : ""}${f.valor}`), ...avisos].join("\n")
    };
  });
  ctx.aneis = ctx.recursosLista.map(r => {
    const raio = raios[r.id];
    const circ = 2 * Math.PI * raio;
    return { id: r.id, r: raio, cor: r.cor, dash: arredondar(circ * r.pct, 2), resto: arredondar(circ * (1 - r.pct), 2) };
  });
  ctx.marcas = Array.from({ length: 36 }, (_, i) => {
    const ang = (i / 36) * 2 * Math.PI;
    const longo = i % 9 === 0;
    const r1 = 69.5, r2 = longo ? 74 : 72;
    return {
      x1: arredondar(75 + r1 * Math.sin(ang), 2), y1: arredondar(75 - r1 * Math.cos(ang), 2),
      x2: arredondar(75 + r2 * Math.sin(ang), 2), y2: arredondar(75 - r2 * Math.cos(ang), 2), longo
    };
  });

  /* ---------- Principal ---------- */
  const estadoPontos = restante => (restante > 0 ? "sobrando" : restante < 0 ? "excedido" : "completo");
  ctx.estadoAtributos = estadoPontos(ficha.pontosAtributo.restante);
  ctx.estadoAumentos = estadoPontos(ficha.pontosAtributo.aumentoDisponivel - ficha.pontosAtributo.aumentoGasto);
  ctx.estadoPericias = estadoPontos(ficha.pontosPericia.restante);
  const badge = (valor, fontes) => (valor ? { valor, texto: sinal(valor), tipo: valor < 0 ? "penal" : "bonus", fontesTexto: fontesTexto(fontes) } : null);
  ctx.gruposAtributo = ficha.gruposAtributo.map(g => ({
    ...g, atributos: g.atributos.map(a => ({ ...a, fontesTexto: fontesTexto(a.fontes), teste: badge(a.testeMod, a.testeFontes) }))
  }));
  const favoritasTopo = !!dados.ui?.periciasFavoritasTopo;
  ctx.periciasFavoritasTopo = favoritasTopo;
  ctx.pericias = ficha.pericias.map(p => ({
    ...p,
    favorita: !!dados.pericias?.[p.id]?.favorita,
    fontesTexto: fontesTexto(p.fontes),
    teste: badge(p.testeMod, p.testeFontes),
    desvantagemTexto: p.desvantagem.join(", "), vantagemTexto: p.vantagem.join(", "), bloqueadaTexto: p.bloqueada.join(", "),
    chips: Object.entries(ATRIBUTOS).map(([id, a]) => ({
      id, abrev: a.abrev, label: a.label, ativo: p.atributos.includes(id), sugerido: p.sugestoes.includes(id)
    }))
  }));
  if (favoritasTopo) ctx.pericias = [...ctx.pericias.filter(p => p.favorita), ...ctx.pericias.filter(p => !p.favorita)];
  ctx.periciasTemFavoritas = ctx.pericias.some(p => p.favorita);
  ctx.pontosLista = [
    { id: "pev", sigla: "PEv", nome: "Evolução", valor: ficha.pontos.pev, dica: "Pontos de Evolução: combates (5 × ND), encontros e recompensas" },
    { id: "pt", sigla: "PT", nome: "Treinamento", valor: ficha.pontos.pt, dica: "Pontos de Treinamento: 6 horas de treino ou estudo dão 5 PT" },
    { id: "ph", sigla: "PH", nome: "Habilidade", valor: ficha.pontos.ph, dica: "Pontos de Habilidade: criam e ensinam habilidades e magias" }
  ];

  // Avisos de penalidades e bloqueios (caixa de Condições)
  const linhas = [];
  const pen = ficha.penalidades;
  const linhaPen = (rotulo, x) => { if (x.total) linhas.push({ texto: `${sinal(x.total)} ${rotulo}`, fontes: [...new Set(x.fontes.map(f => f.fonte))].join(", "), tipo: x.total < 0 ? "penal" : "bonus" }); };
  linhaPen("em testes", pen.testes);
  linhaPen("em ataques", pen.ataques);
  linhaPen("em ataques à distância", pen.distancia);
  linhaPen("no dano", pen.dano);
  linhaPen("na Defesa", pen.defesa);
  for (const [a, lista] of Object.entries(pen.atributos)) {
    const total = lista.reduce((s, x) => s + x.valor, 0);
    if (total) linhas.push({ texto: `${sinal(total)} em testes de ${ATRIBUTOS[a].label}`, fontes: [...new Set(lista.map(x => x.fonte))].join(", "), tipo: "penal" });
  }
  for (const [p, lista] of Object.entries(pen.pericias)) {
    const total = lista.reduce((s, x) => s + x.valor, 0);
    const nome = ficha.periciaPorId[p]?.nome ?? p;
    if (total) linhas.push({ texto: `${sinal(total)} em ${nome}`, fontes: [...new Set(lista.map(x => x.fonte))].join(", "), tipo: "penal" });
  }
  const linhaLista = (texto, fontes, tipo = "alerta") => { if (fontes?.length) linhas.push({ texto, fontes: [...new Set(fontes)].join(", "), tipo }); };
  linhaLista("Desvantagem em testes", ficha.desvantagens.testes);
  linhaLista("Desvantagem em ataques", ficha.desvantagens.ataques);
  linhaLista("Desvantagem em ataques mágicos", ficha.desvantagens.ataquesMagicos);
  linhaLista("Desvantagem no dano", ficha.desvantagens.dano);
  linhaLista("Desvantagem em resistências", ficha.desvantagens.resistencias);
  const nomesAcoes = Object.entries(ficha.bloqueios.acoes).filter(([, f]) => f.length);
  if (nomesAcoes.length >= 8) linhaLista("Sem ações", nomesAcoes.flatMap(([, f]) => f), "bloqueio");
  else for (const [a, f] of nomesAcoes) linhaLista(`Sem ${ACOES[a]?.label ?? a}`, f, "bloqueio");
  if (ficha.acoes.limite !== null) linhaLista(`No máximo ${ficha.acoes.limite} ação por turno`, ficha.acoes.limiteFontes, "bloqueio");
  for (const [r, f] of Object.entries(ficha.bloqueios.requisitos)) linhaLista(`Bloqueia o que exige ${REQUISITOS[r]?.label ?? r}`, f, "bloqueio");
  linhaLista("Não conjura magias", ficha.bloqueios.magias, "bloqueio");
  linhaLista("Sem poderes que usam mana", ficha.bloqueios.mana, "bloqueio");
  linhaLista("Não pode atacar", ficha.bloqueios.ataques, "bloqueio");
  for (const [o, f] of Object.entries(ficha.bloqueios.origens)) linhaLista(`Sem habilidades de ${ORIGENS_HABILIDADE[o] ?? o}`, f, "bloqueio");
  for (const [r, f] of Object.entries(ficha.recuperacao.sem)) linhaLista(`Não recupera ${RECURSOS[r]?.abrev ?? r}`, f, "bloqueio");
  for (const [r, f] of Object.entries(ficha.recuperacao.metade)) linhaLista(`Recupera só metade de ${RECURSOS[r]?.abrev ?? r}`, f);
  linhaLista("Sem descanso curto", ficha.recuperacao.semDescansoCurto, "bloqueio");
  for (const dot of ficha.dots) linhas.push({ texto: `−${dot.formula} ${RECURSOS[dot.recurso]?.abrev ?? "PV"} no início do turno${dot.opcional ? " (quando valer)" : ""}`, fontes: dot.fonte, tipo: "penal" });
  for (const t of ficha.turnoEfeitos) linhas.push({ texto: "Rola 1d6 no início do turno", fontes: t.fonte, tipo: "alerta" });
  for (const av of ficha.avisos) linhas.push({ texto: av.texto, fontes: av.fonte, tipo: "alerta" });
  ctx.condicoesBox = {
    condicoes: ficha.condicoesAtivas.map(c => ({ ...c, porQueTexto: c.porQue.join(", ") })),
    combinacoes: ficha.combinacoes,
    linhas
  };
  ctx.condicoesBox.vazio = !ctx.condicoesBox.condicoes.length && !linhas.length;

  const chipTag = (t, extra = {}) => ({ texto: t.tipo, fonte: t.fonte, ...extra });
  const vuln = [
    ...ficha.tags.vulnerabilidades.map(t => chipTag(t)),
    ...ficha.vulneraveis.map(v => ({ texto: v.texto, fonte: v.fontes.join(", "), anulada: v.anulada }))
  ];
  ctx.defesasBox = {
    resistencias: ficha.tags.resistencias.map(t => chipTag(t)),
    imunidades: ficha.tags.imunidades.map(t => chipTag(t)),
    vulnerabilidades: vuln,
    reducoes: ficha.tags.reducoes.map(r => ({ texto: `RD ${r.valor} (${r.tipos})`, fonte: r.fonte }))
  };
  ctx.defesasBox.vazio = !ctx.defesasBox.resistencias.length && !ctx.defesasBox.imunidades.length
    && !ctx.defesasBox.vulnerabilidades.length && !ctx.defesasBox.reducoes.length;

  ctx.idiomas = idiomasDoAtor(actor, idiomas.catalogo ?? []);
  ctx.idiomasInfo = {
    polyglot: !!idiomas.polyglot,
    opcoes: (idiomas.catalogo ?? []).filter(l => !ctx.idiomas.some(i => i.key === l.key)).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
  };

  /* ---------- Combate ---------- */
  const bloqAcao = id => ficha.bloqueios.acoes[id] ?? [];
  ctx.acoesTurno = [...ACOES_TURNO, "reacao"].map(id => {
    const bloq = bloqAcao(id);
    const limite = id !== "reacao" && !ficha.acoes[id] && ficha.acoes.esgotadas;
    return {
      id, label: ACOES[id].curto, usada: !!ficha.acoes[id],
      bloqueada: bloq.length > 0 || limite,
      motivo: bloq.length ? `Bloqueada: ${bloq.join(", ")}` : limite ? `Limite de ${ficha.acoes.limite} ação por turno (${ficha.acoes.limiteFontes.join(", ")})` : ""
    };
  });
  ctx.caPenalTexto = [...new Set(ficha.penalidades.defesa.fontes.map(f => f.fonte))].join(", ");
  ctx.defesasPendentes = Array.from({ length: 3 }, (_, i) => ({ ativa: i < ficha.acoes.defesas }));
  const opcoesPericia = selecionada => ficha.pericias.map(p => ({ id: p.id, nome: p.nome, selected: p.id === selecionada }));
  const armas = cadaSeguro(itens.filter(i => tipoDe(i) === "weapon"), ataqueDeArma, falhas);
  const custom = cadaSeguro(Object.entries(dados.ataques ?? {}).filter(([, a]) => a && typeof a === "object"), ([id, a]) => ataqueCustom(id, a), falhas)
    .sort((a, b) => a.criado - b.criado || a.nome.localeCompare(b.nome, "pt-BR"));
  ctx.ataques = {
    armas: cadaSeguro(armas.filter(a => a.equipado), a => resumoAtaque(a, ficha, cena), falhas),
    armasGuardadas: armas.filter(a => !a.equipado).length,
    custom: cadaSeguro(custom, a => ({ ...resumoAtaque(a, ficha, cena), opcoesPericia: opcoesPericia(a.periciaId) }), falhas),
    bloqueados: ficha.ataquesGerais.bloqueados.join(", ")
  };
  ctx.ataques.vazio = !ctx.ataques.armas.length && !ctx.ataques.custom.length;
  ctx.bonusCena = Object.entries(dados.bonusCena ?? {}).filter(([, b]) => b).map(([id, b]) => ({
    id, nome: b.nome ?? "", ativo: !!b.ativo, acerto: int(b.acerto), dano: b.dano ?? "", criado: num(b.criado)
  })).sort((a, b) => a.criado - b.criado);
  /* ---------- CA ---------- */
  const caF = ficha.ca;
  ctx.caAtributos = [...Object.entries(ATRIBUTOS).map(([id, a]) => ({ id, abrev: a.abrev, label: a.label })), { id: "nenhum", abrev: "—", label: "Nenhum" }]
    .map(o => ({ ...o, selected: o.id === caF.atributo }));
  ctx.caFormula = [`Base ${caF.base}`, `${caF.atributoLabel} ${sinal(caF.atributoValor)}`, `Armadura ${caF.armadura}${caF.armaduraFontes.length ? ` (${caF.armaduraFontes.join(", ")})` : ""}`, `Outros ${sinal(caF.bonus)}`,
    ...(caF.mod ? [`Efeitos ${sinal(caF.mod)}`] : [])].join(" + ") + ` = ${caF.total - caF.penal}`;

  ctx.cena = cena;
  ctx.efeitosTurno = { dots: ficha.dots.length, insano: ficha.turnoEfeitos.length > 0 };

  /* ---------- Poderes (habilidades e magias) ---------- */
  const poderes = cadaSeguro(itens.filter(i => tipoDe(i) === "feat" || tipoDe(i) === "spell"), item => {
    const p = lerPoder(item);
    const formas = p.formas.map(fo => {
      const av = avaliarForma(fo, ficha, { raridade: p.raridade, melhorias: p.melhorias, dadosRolagem: rolagem, poder: { tipo: p.tipo, origem: p.origem } });
      return {
        id: fo.id, nome: fo.nome, acao: fo.acao, acaoLabel: ACOES[fo.acao]?.curto ?? fo.acao,
        custoTexto: textoCusto(fo, av.custo.extra), bloqueada: av.bloqueada, motivosTexto: av.motivos.join(", "),
        semRecurso: av.semRecurso, excedeDano: av.excedeDano, excedeEfeitos: av.excedeEfeitos,
        dano: fo.dano.formula, resistencia: fo.teste.tipo === "resistencia",
        requisitos: Object.entries(fo.requisitos).filter(([, v]) => v).map(([k]) => REQUISITOS[k]?.label ?? k)
      };
    });
    const r = RARIDADES_PODER[p.raridade];
    const alertas = [];
    if (formas.some(f => f.excedeDano)) alertas.push(`Dano acima do teto da raridade ${r.label} (${r.danoMax})`);
    if (formas.some(f => f.excedeEfeitos)) alertas.push(`Mais efeitos adicionais do que a raridade ${r.label} permite (${r.efeitos})`);
    return {
      id: item.id, uuid: item.uuid, name: item.name, img: item.img, tipo: p.tipo,
      raridade: p.raridade, raridadeLabel: r.label, raridadeCor: r.cor,
      passiva: p.passiva, favorito: p.favorito, origem: p.origem, origemLabel: ORIGENS_HABILIDADE[p.origem] ?? "", circulo: p.circulo,
      formas, nFormas: formas.length, variasFormas: formas.length > 1,
      bloqueada: formas.length > 0 && formas.every(f => f.bloqueada),
      motivosTexto: [...new Set(formas.filter(f => f.bloqueada).flatMap(f => f.motivosTexto.split(", ")))].filter(Boolean).join(", "),
      alertas, alertasTexto: alertas.join("\n"),
      expandido: expandidos.has(item.id), descricao: enriquecidos.itens?.[item.id] ?? ""
    };
  }, falhas);
  const ordenarPoderes = (a, b) => (b.favorito - a.favorito) || a.name.localeCompare(b.name, "pt-BR");
  const contagem = contarRaridades(poderes);
  const modo = ajustes.modoLimites ?? "separados";

  const habilidades = poderes.filter(p => p.tipo === "habilidade");
  const origensEspeciais = SUBABAS_HABILIDADE.filter(s => s.origem).map(s => s.origem);
  const daSubaba = sub => habilidades.filter(h => (sub.origem ? h.origem === sub.origem : !origensEspeciais.includes(h.origem)));
  const passivas = lista => ({ id: "passivas", label: "Passivas", cor: "#93A9A3", limite: null, itens: lista.filter(h => h.passiva).sort(ordenarPoderes) });
  const secoesDe = sub => {
    const lista = daSubaba(sub);
    const secoes = sub.origem
      ? [passivas(lista), { id: "comum", label: "Comum", cor: RARIDADES_PODER.comum.cor, limite: null, itens: lista.filter(h => !h.passiva).sort(ordenarPoderes) }]
      : [passivas(lista), ...Object.entries(RARIDADES_PODER).map(([id, r]) => ({
        id, label: r.label, cor: r.cor, ...situacaoLimite(contagem, "habilidade", id, modo),
        itens: lista.filter(h => !h.passiva && h.raridade === id).sort(ordenarPoderes)
      }))];
    for (const s of secoes) s.vazia = !s.itens.length;
    return { secoes, total: lista.length };
  };
  const subAtual = SUBABAS_HABILIDADE.some(s => s.id === ui.abas?.habilidades) ? ui.abas.habilidades : "geral";
  const subabas = SUBABAS_HABILIDADE.map(sub => ({
    ...sub, ...secoesDe(sub), ativa: sub.id === subAtual, cls: sub.id === subAtual ? "active" : ""
  }));
  const geral = daSubaba(SUBABAS_HABILIDADE[0]);
  ctx.habilidades = {
    subabas, total: habilidades.length,
    conhecidas: geral.filter(h => h.raridade !== "unica").length,
    espacos: int(dados.espacos?.habilidades, 2)
  };
  // Aba opcional Arquétipo e Classe: anotações próprias + as mesmas habilidades das sub-abas
  ctx.arqclasse = {
    subabas: SUBABAS_HABILIDADE.filter(s => s.origem).map(sub => {
      const atual = (ui.abas?.arqclasse ?? "arquetipo") === sub.id;
      const nomes = sub.id === "arquetipo" ? [dados.arquetipo, dados.arquetipo2] : [dados.classe];
      const notas = dados.arqclasse?.[sub.id]?.notas ?? "";
      return {
        ...sub, ...secoesDe(sub), ativa: atual, cls: atual ? "active" : "",
        nome: nomes.map(n => String(n ?? "").trim()).filter(Boolean).join(" / "),
        editor: editores.arqclasse?.[sub.id] ?? "", texto: temTexto(notas) ? (enriquecidos.arqclasse?.[sub.id] ?? "") : ""
      };
    })
  };

  const magias = poderes.filter(p => p.tipo === "magia");
  const circuloAtual = String(ui.abas?.magias ?? "0");
  const circulos = CIRCULOS.map(c => ({ ...c, chave: String(c.nivel) }));
  if (magias.some(m => m.circulo > 6)) circulos.push({ nivel: 7, label: "7º ou acima", curto: "7+", chave: "7" });
  ctx.magias = {
    circulos: circulos.map(c => {
      const lista = magias.filter(m => (c.nivel === 7 ? m.circulo >= 7 : m.circulo === c.nivel)).sort(ordenarPoderes);
      return { ...c, itens: lista, total: lista.length, vazia: !lista.length, ativa: c.chave === circuloAtual, cls: c.chave === circuloAtual ? "active" : "" };
    }),
    limites: Object.entries(RARIDADES_PODER).filter(([, r]) => r.limite !== null).map(([id, r]) => ({
      id, label: r.label, cor: r.cor, ...situacaoLimite(contagem, "magia", id, modo)
    })),
    total: magias.length,
    conhecidas: magias.filter(m => m.circulo >= 1 && m.raridade !== "unica").length,
    truques: magias.filter(m => m.circulo === 0).length,
    espacosMagias: int(dados.espacos?.magias, 2),
    espacosTruques: int(dados.espacos?.truques, 0),
    bloqueadas: ficha.bloqueios.magias.join(", ")
  };
  if (!ctx.magias.circulos.some(c => c.ativa)) {
    ctx.magias.circulos[0].ativa = true;
    ctx.magias.circulos[0].cls = "active";
  }
  ctx.modoLimites = modo;

  /* ---------- Treinamentos ---------- */
  {
    const alvosT = alvosModificador(ficha.pericias.map(p => ({ id: p.id, nome: p.nome })));
    const gruposT = [...new Set(alvosT.map(a => a.grupo))];
    const rotuloT = Object.fromEntries(alvosT.map(a => [a.id, a.label]));
    const horasHoje = Math.max(0, num(dados.treinoDia?.horas));
    const livres = Math.max(0, TREINO.horasDia - horasHoje);
    const lista = Object.entries(dados.treinamentos ?? {}).filter(([, t]) => t).map(([id, t]) => {
      const unidade = UNIDADES_TEMPO[t.unidade] ? t.unidade : "horas";
      const qtd = Math.max(0, num(t.tempo));
      const horas = Math.max(1, Math.round(qtd * UNIDADES_TEMPO[unidade].horas));
      const feitas = Math.min(horas, Math.max(0, num(t.horasFeitas)));
      const estado = ESTADOS_TREINO[t.estado] ? t.estado : "planejado";
      const pt = Math.max(0, int(t.pt));
      const mods = Object.entries(t.mods ?? {}).filter(([, m]) => m).map(([mid, m]) => ({
        id: mid, alvo: m.alvo ?? "", valor: num(m.valor), alvoLabel: rotuloT[m.alvo] ?? "",
        grupos: gruposT.map(g => ({ grupo: g, opcoes: alvosT.filter(a => a.grupo === g).map(a => ({ ...a, selected: a.id === m.alvo })) }))
      }));
      return {
        id, nome: t.nome || "Treinamento sem nome", nomeBruto: t.nome ?? "", tempo: qtd, unidade, horas, feitas,
        tempoTexto: `${arredondar(qtd, 2)} ${qtd === 1 ? UNIDADES_TEMPO[unidade].umLabel : UNIDADES_TEMPO[unidade].label}`,
        unidades: Object.entries(UNIDADES_TEMPO).map(([uid, u]) => ({ id: uid, label: u.label, selected: uid === unidade })),
        pt, requisitos: t.requisitos ?? "", treinador: !!t.treinador, beneficios: t.beneficios ?? "", estado,
        estadoLabel: ESTADOS_TREINO[estado].label, estadoIcone: ESTADOS_TREINO[estado].icone,
        pct: Math.round((feitas / horas) * 100), faltam: horas - feitas,
        podeComecar: editavel && estado === "planejado", semPT: pt > ficha.pontos.pt,
        podeTreinar: editavel && estado === "andamento" && livres > 0,
        foraDaFaixa: pt > TREINO.ptMax || horas > TREINO.horasMax || (pt > 0 && pt < TREINO.ptMin) || horas < TREINO.horasMin,
        mods, temMods: mods.some(m => m.alvoLabel), criado: num(t.criado)
      };
    }).sort((a, b) => a.criado - b.criado);
    ctx.treinos = {
      pt: ficha.pontos.pt, horasHoje, horasDia: TREINO.horasDia, livres, pctDia: Math.round((Math.min(horasHoje, TREINO.horasDia) / TREINO.horasDia) * 100),
      acao: TREINO.acao, podeAcao: editavel && livres >= TREINO.acao.horas, podeMinijogo: editavel && livres >= TREINO.minijogo.horas,
      minijogos: Object.entries(MINIJOGOS).map(([mid, j]) => ({ id: mid, ...j })),
      exemplos: EXEMPLOS_TREINAMENTO.map((e, i) => ({ indice: i, nome: e.nome })),
      grupos: ["andamento", "planejado", "concluido"].map(estado => {
        const itens = lista.filter(t => t.estado === estado);
        return { id: estado, label: ESTADOS_TREINO[estado].label, icone: ESTADOS_TREINO[estado].icone, itens, vazio: !itens.length };
      }),
      total: lista.length
    };
  }

  /* ---------- Inventário ---------- */
  const alvos = alvosModificador(ficha.pericias.map(p => ({ id: p.id, nome: p.nome })));
  const gruposAlvo = [...new Set(alvos.map(a => a.grupo))];
  const rotuloAlvo = Object.fromEntries(alvos.map(a => [a.id, a.label]));
  const opcoesEm = [
    { id: "testes", label: "Todos os testes" }, { id: "ataques", label: "Ataques" }, { id: "iniciativa", label: "Iniciativa" },
    ...ficha.pericias.map(p => ({ id: `pericia.${p.id}`, label: p.nome }))
  ];
  const rotuloEm = Object.fromEntries(opcoesEm.map(o => [o.id, o.label]));
  const nomes = {};
  for (const i of itens) { try { nomes[i.id] = i.name; } catch { /* item ilegível */ } }
  let pesoTotal = 0;
  const linhaItem = item => {
    const raridade = raridadeItem(item);
    const r = RARIDADES_ITEM[raridade];
    const qtd = num(item.system?.quantity, 1);
    const peso = pesoItem(item);
    pesoTotal += peso * qtd;
    const f = item.flags?.[FLAG] ?? {};
    const eArma = item.type === "weapon";
    const ataque = eArma ? resumoAtaque(ataqueDeArma(item), ficha, cena) : null;
    const efeitos = lerEfeitosItem(item);
    const ativo = itemAtivo(item);
    return {
      id: item.id, uuid: item.uuid, name: item.name, img: item.img, type: item.type,
      quantidade: qtd, peso: arredondar(peso, 2), pesoLinha: arredondar(peso * qtd, 2),
      raridade, raridadeLabel: r.label, raridadeCor: r.cor, raridadeOrdem: r.ordem,
      favorito: !!f.favorito,
      equipavel: ["weapon", "equipment"].includes(item.type),
      equipado: !!item.system?.equipped,
      eArma, eConsumivel: item.type === "consumable", ataque,
      eArmadura: item.type === "equipment", armadura: int(f.armadura),
      formulaUso: f.formula ?? "",
      containerNome: item.system?.container ? (nomes[item.system.container] ?? "") : "",
      expandido: expandidos.has(item.id),
      descricao: enriquecidos.itens?.[item.id] ?? "",
      opcoesRaridade: Object.entries(RARIDADES_ITEM).map(([id, rr]) => ({ id, label: rr.label, selected: id === raridade })),
      opcoesPericia: eArma ? opcoesPericia(ataque.periciaId) : [],
      efeitosAtivos: ativo || item.type === "consumable",
      resumoEfeitos: [...(item.type === "equipment" && int(f.armadura) ? [`Armadura ${int(f.armadura)}`] : []),
        ...efeitos.map(e => resumoEfeitoItem(e, { alvos: rotuloAlvo, em: rotuloEm })).filter(Boolean)],
      efeitos: efeitos.map(e => ({
        ...e,
        eMod: e.tipo === "mod", eRd: e.tipo === "rd", eTipoDano: ["resistencia", "imunidade", "vulnerabilidade", "danoExtra"].includes(e.tipo),
        eEm: e.tipo === "desvantagem" || e.tipo === "vantagem", eCura: e.tipo === "cura", eFormula: e.tipo === "cura" || e.tipo === "danoExtra",
        tipoLabel: TIPOS_EFEITO_ITEM[e.tipo]?.label ?? e.tipo,
        grupos: gruposAlvo.map(g => ({ grupo: g, opcoes: alvos.filter(a => a.grupo === g).map(a => ({ ...a, selected: a.id === e.alvo })) })),
        opcoesEm: opcoesEm.map(o => ({ ...o, selected: o.id === e.em })),
        opcoesRecurso: Object.entries(RECURSOS).map(([id, rr]) => ({ id, label: rr.label, selected: id === e.recurso })),
        opcoesQuando: Object.entries(QUANDO_CURA).map(([id, label]) => ({ id, label, selected: id === e.quando }))
      })),
      dicaAtivo: ["weapon", "equipment"].includes(item.type) ? "Os bônus valem com o item equipado"
        : item.type === "consumable" ? "Curas e recuperações acontecem ao usar" : "Os bônus valem enquanto o item estiver no inventário"
    };
  };
  const doInventario = itens.filter(i => {
    try { return !TIPOS_PODER.includes(i.type); } catch { return false; }
  });
  const idsMochilas = new Set(doInventario.filter(i => CATEGORIA_MOCHILAS.tipos.includes(tipoDe(i))).map(i => i.id));
  const dentro = {};
  for (const i of doInventario) {
    try {
      const c = i.system?.container;
      if (c && idsMochilas.has(c)) (dentro[c] ??= []).push(i);
    } catch { /* item ilegível */ }
  }
  const estaDentro = i => { try { return !!(i.system?.container && idsMochilas.has(i.system.container)); } catch { return false; } };
  const porNome = (a, b) => a.name.localeCompare(b.name, "pt-BR");
  ctx.mochilas = cadaSeguro(doInventario.filter(i => idsMochilas.has(i.id) && !estaDentro(i)), item => {
    const base = linhaItem(item);
    const conteudo = cadaSeguro(dentro[item.id] ?? [], linhaItem, falhas).sort((a, b) => (b.favorito - a.favorito) || porNome(a, b));
    const capacidade = num(item.system?.capacity?.weight?.value ?? item.system?.capacity?.value, 0);
    const pesoDentro = arredondar(conteudo.reduce((s, x) => s + x.pesoLinha, 0), 2);
    return {
      ...base, conteudo, qtdDentro: conteudo.length, pesoDentro,
      moedas: moedasDaMochila(item), temMoedas: moedasDaMochila(item).length > 0,
      capacidade, cheia: capacidade > 0 && pesoDentro > capacidade,
      aberta: !(ui.mochilasFechadas ?? new Set()).has(item.id)
    };
  }, falhas).sort(porNome);
  ctx.temMochilas = ctx.mochilas.length > 0;
  const ordemCategorias = ordenarPorLista(CATEGORIAS_ITEM.map(c => c.id), dados.ui?.ordemCategorias);
  ctx.categorias = ordemCategorias.map((id, indice) => {
    const cat = CATEGORIAS_ITEM.find(c => c.id === id);
    const lista = cadaSeguro(doInventario.filter(i => cat.tipos.includes(tipoDe(i)) && !estaDentro(i)), linhaItem, falhas);
    const visiveis = lista.filter(i => !filtro.size || filtro.has(i.raridade));
    const grupos = [];
    const favoritos = visiveis.filter(i => i.favorito).sort((a, b) => b.raridadeOrdem - a.raridadeOrdem || porNome(a, b));
    if (favoritos.length) grupos.push({ id: "favoritos", label: "Favoritos", cor: "#D3A85E", favoritos: true, itens: favoritos });
    for (const [rid, r] of Object.entries(RARIDADES_ITEM).sort((a, b) => b[1].ordem - a[1].ordem)) {
      const doGrupo = visiveis.filter(i => !i.favorito && i.raridade === rid).sort(porNome);
      if (doGrupo.length) grupos.push({ id: rid, label: r.label, cor: r.cor, itens: doGrupo });
    }
    return {
      ...cat, total: lista.length, grupos, vazia: !lista.length, filtrada: lista.length > 0 && !visiveis.length,
      primeira: indice === 0, ultima: indice === ordemCategorias.length - 1
    };
  });
  ctx.categoriaMochilas = CATEGORIA_MOCHILAS;
  ctx.ordemCategoriasPadrao = !(dados.ui?.ordemCategorias ?? []).length;
  ctx.pesoTotal = arredondar(pesoTotal, 2);
  ctx.filtros = Object.entries(RARIDADES_ITEM).map(([id, r]) => ({ id, label: r.label, cor: r.cor, ativo: filtro.has(id) }));
  ctx.temFiltro = filtro.size > 0;
  ctx.moedas = MOEDAS.map(m => ({ ...m, quantidade: int(dados.moedas?.[m.id]) }));
  ctx.patrimonio = formatarMoedas(valorEmCobre(dados.moedas));
  ctx.metadeDinheiro = ficha.especiais.metadeDinheiro.join(", ");
  ctx.tiposEfeitoItem = Object.entries(TIPOS_EFEITO_ITEM).map(([id, t]) => ({ id, ...t }));
  ctx.sugestoesDano = [...SUGESTOES.dano, ...ficha.condicoes.filter(c => c.categoria === "basicas").map(c => c.label)];

  /* ---------- Sobre ---------- */
  ctx.camposSobre = CAMPOS_SOBRE.map(c => ({ ...c, valor: dados.sobre?.[c.id] ?? "" }));
  ctx.marca = { aparencia: dados.sobre?.marcaAparencia ?? "", local: dados.sobre?.marcaLocal ?? "", imagem: dados.sobre?.imagemMarca ?? "" };
  ctx.imagemAparencia = dados.sobre?.imagemAparencia ?? "";
  ctx.textosSobre = TEXTOS_SOBRE.filter(t => t.id !== "aparencia")
    .map(t => ({ ...t, editor: editores.sobre?.[t.id] ?? "", texto: enriquecidos.sobre?.[t.id] ?? "" }));
  const textoAparencia = enriquecidos.sobre?.aparencia ?? "";
  ctx.aparencia = {
    editor: editores.sobre?.aparencia ?? "",
    texto: String(dados.sobre?.aparencia ?? "").replace(/<[^>]*>/g, "").trim() ? textoAparencia : "",
    imagem: ctx.imagemAparencia
  };
  ctx.aparencia.vazia = !ctx.aparencia.texto && !ctx.aparencia.imagem;
  const niveis = niveisRevelacao(dados.sobre);
  ctx.revelacoes = REVELACOES.map(r => ({
    ...r, nivel: String(niveis[r.id]),
    opcoes: OPCOES_REVELAR.map(o => ({ ...o, selected: o.id === String(niveis[r.id]) }))
  }));

  /* ---------- Anotações ---------- */
  const paginas = Object.entries(dados.notas?.paginas ?? {})
    .filter(([, p]) => p)
    .map(([id, p]) => ({ id, nome: p.nome || "Sem título", tipo: p.tipo === "mapa" ? "mapa" : "texto", ordem: num(p.ordem) }))
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"));
  const paginaAtiva = paginas.find(p => p.id === ui.abas?.notas)?.id ?? paginas[0]?.id ?? null;
  ctx.paginas = paginas.map((p, i) => ({
    ...p, ativa: p.id === paginaAtiva, cls: p.id === paginaAtiva ? "active" : "",
    eMapa: p.tipo === "mapa", primeira: i === 0, ultima: i === paginas.length - 1,
    editor: p.tipo === "texto" ? (editores.notas?.[p.id] ?? "") : ""
  }));
  ctx.semPaginas = !paginas.length;

  /* ---------- Condições ---------- */
  const uiCond = ui.condicoes ?? {};
  const abertas = uiCond.abertas ?? null;
  ctx.condicoesUi = { busca: uiCond.busca ?? "", soAtivas: !!uiCond.soAtivas };
  ctx.categoriasCondicao = CATEGORIAS_CONDICAO.map(cat => {
    const lista = ficha.condicoes.filter(c => c.categoria === cat.id).map(c => ({
      ...c, porQueTexto: c.porQue.join(", "),
      busca: normalizarTexto(`${c.label} ${c.descricao} ${c.efeito} ${c.resumo.join(" ")}`)
    })).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
    const ativas = lista.filter(c => c.ativa || c.automatica).length;
    const aberta = abertas ? abertas.has(cat.id) || ativas > 0 : ativas > 0 || cat.id === "basicas";
    return { ...cat, condicoes: lista, total: lista.length, ativas, aberta };
  });
  ctx.totalCondicoesAtivas = ficha.condicoesAtivas.length;
  ctx.combinacoesAtivas = ficha.combinacoes;
  ctx.tagsCondicoes = [
    { campo: "resistencias", label: "Resistências", dica: "Tipos de dano que você resiste", itens: dados.resistencias, sugestoes: SUGESTOES.dano },
    { campo: "imunidades", label: "Imunidades", dica: "Danos ou condições. Uma condição com o mesmo nome é ignorada.", itens: dados.imunidades, sugestoes: [...SUGESTOES.dano, ...ficha.condicoes.map(c => c.label)] },
    { campo: "vulnerabilidades", label: "Vulnerabilidades", dica: "Tipos de dano que te ferem mais", itens: dados.vulnerabilidades, sugestoes: SUGESTOES.dano }
  ];

  /* ---------- Bênçãos e maldições ---------- */
  const situacao = new Map(ficha.bencaos.map(x => [x.id, x]));
  const entradas = Object.entries(dados.bencaos ?? {}).filter(([, b]) => b && typeof b === "object").map(([id, b]) => {
    const x = situacao.get(id);
    const auto = x?.auto ?? automacaoDe(b);
    const c = auto.catalogo;
    const tipo = b.tipo === "maldicao" ? "maldicao" : "bencao";
    const natureza = NATUREZAS[b.natureza] ? b.natureza : (c?.natureza ?? "");
    const raridade = RARIDADES_BENCAO[b.raridade] ? b.raridade : (c?.raridade ?? "");
    const freq = auto.frequencia;
    const duracao = auto.duracao;
    const restantes = int(b.turnosRestantes);
    const resumoAuto = [
      ...resumirAutomacao(auto),
      ...(c?.escolha && b.escolha ? [`Imune: ${b.escolha}`] : [])
    ];
    return {
      id, nome: b.nome ?? "", tipo, ativo: !!b.ativo,
      origem: b.origem ?? "", descricao: b.descricao ?? "", criado: num(b.criado),
      condicao: b.condicao ?? "", custo: b.custo ?? "", consequencia: b.consequencia ?? "",
      catalogo: b.catalogo ?? "", natureza, naturezaLabel: NATUREZAS[natureza]?.label ?? "",
      raridade, raridadeLabel: RARIDADES_BENCAO[raridade]?.label ?? "", raridadeCor: RARIDADES_BENCAO[raridade]?.cor ?? "",
      suspensa: (x?.suspensaPor ?? []).join(", "),
      frequencia: freq, frequenciaLabel: FREQUENCIAS[freq]?.curto ?? "", temFrequencia: freq !== "livre",
      usado: !!b.usado, duracao, restantes, emCurso: restantes > 0,
      podeUsar: tipo === "bencao", temTermino: !!auto.aoTerminar,
      resumoAuto,
      permanentes: Object.values(b.permanentes ?? {}).filter(m => m?.alvo && num(m.valor)).map(m => `${rotuloAlvo[m.alvo] ?? m.alvo} ${sinal(num(m.valor))}`),
      opcoesFrequencia: Object.entries(FREQUENCIAS).map(([fid, f]) => ({ id: fid, label: f.label, selected: fid === (b.frequencia ?? (c ? "" : "livre")) })),
      mods: Object.entries(b.mods ?? {}).filter(([, m]) => m).map(([mid, m]) => ({
        id: mid, alvo: m.alvo ?? "", valor: num(m.valor), alvoLabel: rotuloAlvo[m.alvo] ?? "",
        grupos: gruposAlvo.map(g => ({ grupo: g, opcoes: alvos.filter(a => a.grupo === g).map(a => ({ ...a, selected: a.id === m.alvo })) }))
      }))
    };
  }).sort((a, b) => a.criado - b.criado || a.nome.localeCompare(b.nome, "pt-BR"));
  ctx.bencaos = entradas.filter(e => e.tipo === "bencao");
  ctx.maldicoes = entradas.filter(e => e.tipo === "maldicao");
  const uiBen = ui.bencaos ?? {};
  const podeCatalogo = editavel && (edicao || isGM);
  ctx.catalogo = {
    pode: podeCatalogo, aberto: !!uiBen.aberto && podeCatalogo,
    busca: uiBen.busca ?? "", tipo: uiBen.tipo ?? "bencao",
    regras: REGRAS_BENCAOS
  };
  if (ctx.catalogo.aberto) {
    const naFicha = new Set(entradas.map(e => e.catalogo).filter(Boolean));
    ctx.catalogo.grupos = Object.entries(NATUREZAS).map(([nid, n]) => ({
      id: nid, label: n[ctx.catalogo.tipo], descricao: GRUPOS_BENCAO[ctx.catalogo.tipo]?.[nid]?.descricao ?? "",
      raridades: Object.entries(RARIDADES_BENCAO).map(([rid, r]) => ({
        id: rid, label: r.label, cor: r.cor,
        itens: CATALOGO.filter(c => c.tipo === ctx.catalogo.tipo && c.natureza === nid && c.raridade === rid).map(c => ({
          ...c, naFicha: naFicha.has(c.id), busca: textoBusca(c),
          frequenciaLabel: FREQUENCIAS[c.frequencia]?.curto ?? "", segundo: c.condicao || c.custo || c.consequencia,
          segundoRotulo: c.consequencia ? "Consequência" : c.custo ? "Custo" : "Condição"
        }))
      }))
    }));
  }

  /* ---------- Relações ---------- */
  // Jogadores e Mestre mudam a afinidade com qualquer um (no modo edição), a menos que a opção "Só o Mestre" esteja ligada.
  const soMestre = ajustes.afinidadeSoMestre === true;
  const podeAjustar = () => edicao && (isGM || !soMestre);
  const relAbertas = ui.relacoesAbertas ?? new Set();
  ctx.relacoes = Object.entries(dados.relacoes ?? {}).filter(([, r]) => r).map(([id, r]) => {
    const af = Math.max(AFINIDADE.min, Math.min(AFINIDADE.max, int(r.afinidade)));
    const ator = r.uuid && atores.porUuid ? atores.porUuid(r.uuid) : null;
    const nome = ator?.name ?? r.nome ?? "";
    const img = ator?.img || r.img || "icons/svg/mystery-man.svg";
    let background = null;
    if (ator?.dados) {
      const nv = niveisRevelacao(ator.dados.sobre);
      background = REVELACOES.map(rv => {
        const ok = revelado(nv[rv.id], af);
        return {
          id: rv.id, label: rv.label, revelado: ok, nivel: nv[rv.id],
          nivelTexto: nv[rv.id] === "nunca" ? "fechado pelo dono" : nv[rv.id] === "sempre" ? "" : `libera com afinidade +${nv[rv.id]}`,
          conteudo: ok ? (ator.revelacoes?.[rv.id] ?? null) : null
        };
      });
    }
    const liberadas = background ? background.filter(b => b.revelado && b.conteudo && !b.conteudo.vazio).length : 0;
    return {
      id, nome, img, uuid: r.uuid ?? "", ligado: !!ator, perdido: !!r.uuid && !ator,
      tipo: r.tipo ?? "outro", tipoLabel: TIPOS_RELACAO[r.tipo ?? "outro"] ?? "Outro",
      afinidade: af, afinidadeLabel: rotuloAfinidade(af), podeAfinidade: podeAjustar(ator?.jogador),
      soMestreAqui: edicao && !isGM && soMestre,
      afinidadePct: Math.round(((af - AFINIDADE.min) / (AFINIDADE.max - AFINIDADE.min)) * 100),
      notas: r.notas ?? "", criado: num(r.criado),
      background, liberadas, totalPartes: background?.length ?? 0, aberta: relAbertas.has(id),
      opcoesTipo: Object.entries(TIPOS_RELACAO).map(([tid, label]) => ({ id: tid, label, selected: tid === (r.tipo ?? "outro") }))
    };
  }).sort((a, b) => a.criado - b.criado || a.nome.localeCompare(b.nome, "pt-BR"));
  ctx.afinidade = AFINIDADE;
  ctx.podeAfinidade = ctx.relacoes.some(r => r.podeAfinidade);
  ctx.itensComErro = falhas;

  return ctx;
}

const TIPOS_PODER = ["feat", "spell", "class", "subclass", "background", "race", "facility"];

/** Lista curta do que a automação de uma bênção ou maldição faz sozinha. */
export function resumirAutomacao(auto) {
  const out = [];
  const e = auto?.efeitos ?? {};
  const u = auto?.aoUsar ?? {};
  if (e.deslocamentoMult === 0) out.push("Deslocamento 0");
  else if (e.deslocamentoMult !== undefined) out.push("Deslocamento ÷2");
  if (e.bloqueiaMagias) out.push("Sem magias");
  if (e.bloqueiaAtaques) out.push("Sem ataques");
  if (e.bloqueiaRequisitos?.length) out.push(`Bloqueia ${e.bloqueiaRequisitos.map(r => REQUISITOS[r]?.label ?? r).join(", ")}`);
  if (e.bloqueiaAcoes?.length) out.push(`Sem ${e.bloqueiaAcoes.map(a => ACOES[a]?.curto ?? a).join(", ")}`);
  if (e.semRecuperar?.length) out.push(`Não recupera ${e.semRecuperar.map(r => RECURSOS[r]?.abrev ?? r).join(", ")}`);
  if (e.recuperacaoMetade?.length) out.push(`Recupera ½ ${e.recuperacaoMetade.map(r => RECURSOS[r]?.abrev ?? r).join(", ")}`);
  for (const t of e.vulneravel ?? []) out.push(`${t} ×2`);
  for (const t of e.resistencias ?? []) out.push(`Resiste: ${t}`);
  for (const t of e.imunidades ?? []) out.push(`Imune: ${t}`);
  if (e.suspendeBencaos) out.push(e.suspendeBencaos === "divina" ? "Suspende bênçãos divinas" : "Suspende todas as bênçãos");
  if (e.danoAtaques) out.push(`+${e.danoAtaques} de dano nos ataques`);
  if (e.danoMult) out.push(`Dano ×${e.danoMult}`);
  if (e.custoExtraMagia) out.push(`Magias custam +${e.custoExtraMagia} PM`);
  if (e.pvPorPm) out.push("Gastar PM tira o mesmo em PV");
  if (e.pmPorPv) out.push("Recuperar PV tira o mesmo em PM");
  if (e.pvPorHabilidade) out.push(`−${e.pvPorHabilidade} PV por habilidade usada`);
  if (e.psFimCombate) out.push(`−${e.psFimCombate} PS no fim de cada combate`);
  if (e.psPorDescansoLongo) out.push(`−${e.psPorDescansoLongo} PS por dia`);
  if (e.pvMaxPorDescanso) out.push(`${e.pvMaxPorDescanso} PV máx. a cada descanso`);
  if (e.descansoCurtoMetade) out.push("Descanso curto recupera metade");
  if (e.iniciativaZero) out.push("Iniciativa 0");
  if (e.metadeDinheiro) out.push("Metade do dinheiro recebido some");
  if (e.bloqueiaPericias?.length) out.push(`Sem ${e.bloqueiaPericias.join(", ")}`);
  for (const dot of e.dot ?? []) out.push(`−${dot.formula} ${RECURSOS[dot.recurso]?.abrev ?? "PV"} por turno${dot.opcional ? " (quando valer)" : ""}`);
  for (const id of e.implica ?? []) out.push(`Fica ${id.replace("epm-", "").replace(/-/g, " ")}`);
  const res = (k, v) => (v === "max" ? `${k} cheio` : v === "metade" ? `${k} pela metade do máximo` : v === "zero" ? `${k} a 0` : `${v > 0 ? "+" : "−"}${Math.abs(v)} ${k}`);
  for (const k of ["pv", "pm", "pe", "ps"]) if (u[k] !== undefined) out.push(`Ao usar: ${res(RECURSOS[k].abrev, u[k])}`);
  if (u.temp) out.push("Ao usar: vida temporária = metade da Vida máxima");
  if (u.pvDefinir !== undefined) out.push(`Ao usar: PV vão a ${u.pvDefinir}`);
  if (u.removerCondicoes) out.push("Ao usar: remove as condições");
  if (u.condicoes?.length) out.push(`Ao usar: fica ${u.condicoes.map(id => id.replace("epm-", "")).join(", ")}`);
  if (u.permanentes?.length) out.push(`Ao usar: ${u.permanentes.map(m => `${m.alvo.split(".").pop()} ${m.valor}`).join(", ")} para sempre`);
  const t = auto?.aoTerminar ?? null;
  if (t) {
    const partes = [];
    for (const k of ["pv", "pm", "pe"]) if (t[k] !== undefined) partes.push(res(RECURSOS[k].abrev, t[k]));
    if (t.rolar) partes.push(`rola ${t.rolar}`);
    if (partes.length) out.push(`Ao terminar: ${partes.join(", ")}`);
  }
  if (auto?.duracao) out.push(`Dura ${auto.duracao} turnos`);
  return out;
}

/* -------------------------------------------- */
/*  Editor de habilidade / magia                */
/* -------------------------------------------- */

export function montarContextoPoder({ item, ficha = null, listaPericias = null, editores = {}, editavel = false }) {
  const p = lerPoder(item);
  const r = RARIDADES_PODER[p.raridade];
  const rolagem = ficha ? dadosRolagemEPM(ficha) : {};
  const fichaBase = ficha ?? { bloqueios: { acoes: {}, requisitos: {} }, recursos: {} };
  const pericias = ficha
    ? ficha.pericias.map(x => ({ id: x.id, nome: x.nome }))
    : (listaPericias ?? PERICIAS_PADRAO).map(e => entradaPericia(e)).map(x => ({ id: x.id, nome: x.nome })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const maxCirculo = Math.max(6, p.circulo ?? 0);
  const formas = p.formas.map((fo, i) => ({
    ...fo,
    av: avaliarForma(fo, fichaBase, { raridade: p.raridade, melhorias: p.melhorias, dadosRolagem: rolagem, poder: { tipo: p.tipo, origem: p.origem } }),
    primeira: i === 0,
    ultima: i === p.formas.length - 1,
    resistencia: fo.teste.tipo === "resistencia",
    opcoesAcao: Object.entries(ACOES).map(([id, a]) => ({ id, label: a.label, selected: id === fo.acao })),
    opcoesCusto: Object.entries(CUSTO_RECURSOS).map(([id, c]) => ({ id, label: c.label, selected: id === fo.custo.recurso })),
    opcoesTeste: Object.entries(TIPOS_TESTE).map(([id, label]) => ({ id, label, selected: id === fo.teste.tipo })),
    opcoesPericia: pericias.map(x => ({ ...x, selected: x.id === fo.teste.pericia })),
    requisitosLista: Object.entries(REQUISITOS).map(([id, q]) => ({ id, label: q.label, dica: q.dica, checked: fo.requisitos[id] })),
    editorEfeito: editores.formas?.[fo.id] ?? ""
  }));
  return {
    item: { id: item.id, uuid: item.uuid, name: item.name, img: item.img, type: item.type },
    editavel, eMagia: p.tipo === "magia", dados: p,
    raridadeCor: r.cor, raridadeLabel: r.label,
    limite: { danoMax: r.danoMax, efeitos: r.efeitos, limite: r.limite },
    cd: ficha ? ficha.cd : null, cdFormula: `${CD.base} + Arcanismo`,
    opcoesRaridade: Object.entries(RARIDADES_PODER).map(([id, x]) => ({ id, label: x.label, selected: id === p.raridade })),
    opcoesOrigem: Object.entries(ORIGENS_HABILIDADE).map(([id, label]) => ({ id, label, selected: id === p.origem })),
    opcoesCirculo: Array.from({ length: maxCirculo + 1 }, (_, n) => ({
      nivel: n, label: CIRCULOS.find(c => c.nivel === n)?.label ?? `${n}º Círculo`, selected: n === p.circulo
    })),
    formas,
    melhoriasOpcoes: MELHORIAS,
    melhorias: p.melhorias.map(m => ({ ...m, formaNome: p.formas.find(f => f.id === m.forma)?.nome ?? m.formaNome ?? "" })),
    temDono: !!ficha,
    pt: ficha?.pontos.pt ?? 0,
    editorDescricao: editores.descricao ?? "",
    sugestoesDano: [...SUGESTOES.dano, "Cura"]
  };
}


/* -------------------------------------------- */
/*  Editor de item EPM (janela própria)         */
/* -------------------------------------------- */

const TIPOS_ITEM_LABEL = { weapon: "Arma", equipment: "Armadura / equipamento", consumable: "Consumível", tool: "Ferramenta", loot: "Loot", container: "Mochila", backpack: "Mochila" };

/** Moedas guardadas numa mochila (só as que têm quantidade). */
export function moedasDaMochila(item) {
  const m = item?.flags?.[FLAG]?.moedas ?? {};
  return MOEDAS.map(x => ({ id: x.id, label: x.label, abrev: x.abrev, img: x.img, qtd: Math.max(0, int(m[x.id])) })).filter(x => x.qtd > 0);
}

/** Contexto do editor de item: dados gerais, ataque, armadura, efeitos, preço e (mochila) conteúdo e moedas. */
export function montarContextoItem({ item, ficha = null, editores = {}, editavel = false }) {
  const f = item.flags?.[FLAG] ?? {};
  const tipo = item.type;
  const eMochila = CATEGORIA_MOCHILAS.tipos.includes(tipo);
  const eArma = tipo === "weapon";
  const raridade = raridadeItem(item);
  const r = RARIDADES_ITEM[raridade];
  const pericias = ficha?.pericias ?? PERICIAS_PADRAO.map(entradaPericia);
  const alvos = alvosModificador(pericias.map(p => ({ id: p.id, nome: p.nome })));
  const gruposAlvo = [...new Set(alvos.map(a => a.grupo))];
  const opcoesEm = [
    { id: "testes", label: "Todos os testes" }, { id: "ataques", label: "Ataques" }, { id: "iniciativa", label: "Iniciativa" },
    ...pericias.map(p => ({ id: `pericia.${p.id}`, label: p.nome }))
  ];
  const ataque = eArma ? ataqueDeArma(item) : null;
  const efeitos = lerEfeitosItem(item).map(e => ({
    ...e,
    eMod: e.tipo === "mod", eRd: e.tipo === "rd", eTipoDano: ["resistencia", "imunidade", "vulnerabilidade", "danoExtra"].includes(e.tipo),
    eEm: e.tipo === "desvantagem" || e.tipo === "vantagem", eCura: e.tipo === "cura", eFormula: e.tipo === "cura" || e.tipo === "danoExtra",
    tipoLabel: TIPOS_EFEITO_ITEM[e.tipo]?.label ?? e.tipo,
    grupos: gruposAlvo.map(g => ({ grupo: g, opcoes: alvos.filter(a => a.grupo === g).map(a => ({ ...a, selected: a.id === e.alvo })) })),
    opcoesEm: opcoesEm.map(o => ({ ...o, selected: o.id === e.em })),
    opcoesRecurso: Object.entries(RECURSOS).map(([id, rr]) => ({ id, label: rr.label, selected: id === e.recurso })),
    opcoesQuando: Object.entries(QUANDO_CURA).map(([id, label]) => ({ id, label, selected: id === e.quando }))
  }));
  const preco = f.preco ?? {};
  const ctx = {
    item: { id: item.id, uuid: item.uuid, name: item.name, img: item.img, tipo, tipoLabel: TIPOS_ITEM_LABEL[tipo] ?? tipo },
    editavel, raridadeCor: r.cor, raridadeLabel: r.label,
    opcoesRaridade: Object.entries(RARIDADES_ITEM).map(([id, rr]) => ({ id, label: rr.label, selected: id === raridade })),
    quantidade: num(item.system?.quantity, 1), peso: num(item.system?.weight?.value ?? item.system?.weight, 0),
    equipavel: ["weapon", "equipment"].includes(tipo), equipado: !!item.system?.equipped,
    preco: { valor: num(preco.valor), moedas: MOEDAS.map(m => ({ id: m.id, label: m.label, selected: m.id === (preco.moeda ?? "po") })) },
    eArma, ataque, opcoesPericia: eArma ? pericias.map(p => ({ id: p.id, nome: p.nome, selected: p.id === ataque.periciaId })) : [],
    eArmadura: tipo === "equipment", armadura: int(f.armadura),
    eConsumivel: tipo === "consumable", formulaUso: f.formula ?? "",
    eMochila, efeitos, temEfeitos: efeitos.length > 0,
    tiposEfeitoItem: Object.entries(TIPOS_EFEITO_ITEM).map(([id, t]) => ({ id, label: t.label, dica: t.dica ?? "" })),
    sugestoesDano: SUGESTOES.dano ?? [],
    dicaAtivo: ["weapon", "equipment"].includes(tipo) ? "Os bônus valem com o item equipado"
      : tipo === "consumable" ? "Curas e recuperações acontecem ao usar" : "Os bônus valem enquanto o item estiver no inventário",
    descricao: editores.descricao ?? ""
  };
  if (eMochila) {
    const actor = item.actor;
    const conteudo = (actor?.items?.contents ?? [...(actor?.items ?? [])]).filter(i => i.system?.container === item.id)
      .map(i => ({ id: i.id, name: i.name, img: i.img, qtd: num(i.system?.quantity, 1), peso: num(i.system?.weight?.value ?? i.system?.weight, 0) }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const m = f.moedas ?? {};
    const carteira = actor?.flags?.[FLAG]?.moedas ?? {};
    ctx.mochila = {
      conteudo, vazia: !conteudo.length, temDono: !!actor,
      capacidade: num(item.system?.capacity?.weight?.value ?? item.system?.capacity?.value, 0),
      pesoDentro: arredondar(conteudo.reduce((s, x) => s + x.peso * x.qtd, 0), 2),
      moedas: MOEDAS.map(x => ({ id: x.id, label: x.label, abrev: x.abrev, img: x.img, qtd: Math.max(0, int(m[x.id])), naCarteira: Math.max(0, int(carteira[x.id])) })),
      totalTexto: [...MOEDAS].reverse().filter(x => int(m[x.id]) > 0).map(x => `${int(m[x.id])} ${x.abrev}`).join(", ") || "vazia"
    };
  }
  return ctx;
}
