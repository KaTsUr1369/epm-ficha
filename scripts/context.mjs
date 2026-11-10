/**
 * Monta o contexto dos templates a partir dos dados do ator.
 * Não usa APIs do Foundry diretamente: recebe objetos simples (ou documentos) e devolve dados prontos.
 */
import {
  FLAG, ATRIBUTOS, RARIDADES_ITEM, RARIDADES_PODER, ORIGENS_HABILIDADE, CIRCULOS,
  ACOES, ACOES_TURNO, CATEGORIAS_ITEM, MOEDAS, CAMPOS_SOBRE, TEXTOS_SOBRE, TIPOS_RELACAO,
  AFINIDADE, ABAS, SUGESTOES, ARQUETIPOS_SUGERIDOS, alvosModificador, REQUISITOS,
  PERICIAS_PADRAO, CUSTO_RECURSOS, TIPOS_TESTE, MELHORIAS, CRITICO_PADRAO, COR_VIDA_TEMP, CD
} from "./config.mjs";
import {
  num, int, limitar, normalizarDados, calcularFicha, lerPoder, avaliarForma, textoCusto, contarRaridades,
  situacaoLimite, raridadeItem, valorEmCobre, formatarMoedas, arredondar, bonusCenaAtivos, entradaPericia, lerCaminho
} from "./data.mjs";

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
  const ficha = calcularFicha({ dados, hp, statuses, modsAE: bruto.mods });
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
  return {
    tipo: "arma", id: item.id, nome: item.name, img: item.img,
    periciaId: periciaAtaquePadrao(item), bonusAcerto: int(f.bonusAcerto), dano: danoArma(item), tipoDano: f.tipoDano ?? "",
    critMargem: limitar(int(f.critMargem, margemNativa), 2, 20), critMult: Math.max(2, int(f.critMult, CRITICO_PADRAO.mult)),
    equipado: !!item?.system?.equipped
  };
}

export function ataqueCustom(id, a = {}) {
  return {
    tipo: "custom", id, nome: a.nome || "Ataque", img: "",
    periciaId: a.pericia || "luta", bonusAcerto: int(a.bonusAcerto), dano: a.dano ?? "", tipoDano: a.tipoDano ?? "",
    critMargem: limitar(int(a.critMargem, CRITICO_PADRAO.margem), 2, 20), critMult: Math.max(2, int(a.critMult, CRITICO_PADRAO.mult)),
    notas: a.notas ?? "", criado: num(a.criado)
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

export function resumoAtaque(at, ficha, cena) {
  const per = ficha.periciaPorId[at.periciaId];
  return {
    ...at,
    periciaNome: per?.nome ?? "sem perícia",
    acertoTotal: (per?.total ?? 0) + at.bonusAcerto + cena.acerto,
    danoTexto: [at.dano, ...cena.dano].filter(Boolean).map(f => resolverReferencias(f, ficha)).join(" + "),
    critTexto: textoCritico(at.critMargem, at.critMult)
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

/* -------------------------------------------- */

export function montarContexto({
  actor, itens = [], ui = {}, ajustes = {}, usuario = {}, enriquecidos = {}, editores = {}, editavel = false
}) {
  const { dados, ficha } = lerAtor(actor, ajustes.listaPericias);
  const rolagem = dadosRolagemEPM(ficha);
  const edicao = !!ui.edicao && editavel;
  const abaAtual = ui.limitado ? "sobre" : (ui.abas?.primary ?? "principal");
  const cls = Object.fromEntries(ABAS.map(a => [a.id, a.id === abaAtual ? "active" : ""]));
  const expandidos = ui.expandidos ?? new Set();
  const filtro = ui.filtroRaridades ?? new Set();
  const cena = bonusCenaAtivos(dados);
  const falhas = [];
  const tipoDe = i => { try { return i?.type; } catch { return undefined; } };

  const ctx = {
    actor: { id: actor.id, uuid: actor.uuid, name: actor.name, img: actor.img },
    editavel, edicao, isGM: !!usuario.isGM, limitado: !!ui.limitado, tempAberto: !!ui.tempAberto && editavel,
    dados, ficha, cls,
    abas: ABAS.map(a => ({ ...a, ativa: a.id === abaAtual })),
    arquetiposSugeridos: ARQUETIPOS_SUGERIDOS
  };

  /* ---------- Cabeçalho ---------- */
  const raios = { pv: 66, pm: 60, pe: 54, ps: 48 };
  ctx.recursosLista = ["pv", "pm", "pe", "ps"].map(id => {
    const r = ficha.recursos[id];
    const eVida = id === "pv";
    return {
      ...r, eVida,
      nomeMax: eVida ? "system.attributes.hp.max" : `flags.${FLAG}.recursos.${id}.max`,
      temTemp: eVida && r.temp > 0,
      tempPct: eVida && r.max > 0 ? limitar(r.temp / r.max, 0, 1) : 0,
      corTemp: COR_VIDA_TEMP,
      motivosTexto: [...r.motivos, ...r.fontes.map(f => `${f.fonte}: ${f.valor > 0 ? "+" : ""}${f.valor}`)].join("\n")
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
  ctx.gruposAtributo = ficha.gruposAtributo.map(g => ({
    ...g, atributos: g.atributos.map(a => ({ ...a, fontesTexto: fontesTexto(a.fontes) }))
  }));
  ctx.pericias = ficha.pericias.map(p => ({
    ...p,
    fontesTexto: fontesTexto(p.fontes),
    chips: Object.entries(ATRIBUTOS).map(([id, a]) => ({
      id, abrev: a.abrev, label: a.label, ativo: p.atributos.includes(id), sugerido: p.sugestoes.includes(id)
    }))
  }));
  ctx.pontosLista = [
    { id: "pev", sigla: "PEv", nome: "Evolução", valor: ficha.pontos.pev, dica: "Pontos de Evolução: combates (5 × ND), encontros e recompensas" },
    { id: "pt", sigla: "PT", nome: "Treinamento", valor: ficha.pontos.pt, dica: "Pontos de Treinamento: 6 horas de treino ou estudo dão 5 PT" },
    { id: "ph", sigla: "PH", nome: "Habilidade", valor: ficha.pontos.ph, dica: "Pontos de Habilidade: criam e ensinam habilidades e magias" }
  ];
  ctx.condicoesBox = {
    condicoes: ficha.condicoesAtivas,
    desvantagens: [
      ficha.desvantagens.testes.length ? { label: "Desvantagem em testes", fontes: ficha.desvantagens.testes.join(", ") } : null,
      ficha.desvantagens.ataques.length ? { label: "Desvantagem em ataques", fontes: ficha.desvantagens.ataques.join(", ") } : null,
      ficha.desvantagens.resistencias.length ? { label: "Desvantagem em resistências", fontes: ficha.desvantagens.resistencias.join(", ") } : null
    ].filter(Boolean)
  };
  ctx.condicoesBox.vazio = !ctx.condicoesBox.condicoes.length && !ctx.condicoesBox.desvantagens.length;
  const tags = campo => (dados[campo] ?? []).filter(Boolean);
  ctx.defesasBox = { resistencias: tags("resistencias"), imunidades: tags("imunidades"), vulnerabilidades: tags("vulnerabilidades") };
  ctx.defesasBox.vazio = !ctx.defesasBox.resistencias.length && !ctx.defesasBox.imunidades.length && !ctx.defesasBox.vulnerabilidades.length;
  ctx.idiomas = tags("idiomas");

  /* ---------- Combate ---------- */
  ctx.acoesTurno = [...ACOES_TURNO, "reacao"].map(id => ({ id, label: ACOES[id].curto, usada: !!ficha.acoes[id] }));
  ctx.defesasPendentes = Array.from({ length: 3 }, (_, i) => ({ ativa: i < ficha.acoes.defesas }));
  const opcoesPericia = selecionada => ficha.pericias.map(p => ({ id: p.id, nome: p.nome, selected: p.id === selecionada }));
  const armas = cadaSeguro(itens.filter(i => tipoDe(i) === "weapon"), ataqueDeArma, falhas);
  const custom = cadaSeguro(Object.entries(dados.ataques ?? {}).filter(([, a]) => a && typeof a === "object"), ([id, a]) => ataqueCustom(id, a), falhas)
    .sort((a, b) => a.criado - b.criado || a.nome.localeCompare(b.nome, "pt-BR"));
  ctx.ataques = {
    armas: cadaSeguro(armas.filter(a => a.equipado), a => resumoAtaque(a, ficha, cena), falhas),
    armasGuardadas: armas.filter(a => !a.equipado).length,
    custom: cadaSeguro(custom, a => ({ ...resumoAtaque(a, ficha, cena), opcoesPericia: opcoesPericia(a.periciaId) }), falhas)
  };
  ctx.ataques.vazio = !ctx.ataques.armas.length && !ctx.ataques.custom.length;
  ctx.bonusCena = Object.entries(dados.bonusCena ?? {}).filter(([, b]) => b).map(([id, b]) => ({
    id, nome: b.nome ?? "", ativo: !!b.ativo, acerto: int(b.acerto), dano: b.dano ?? "", criado: num(b.criado)
  })).sort((a, b) => a.criado - b.criado);
  ctx.cena = cena;

  /* ---------- Poderes (habilidades e magias) ---------- */
  const poderes = cadaSeguro(itens.filter(i => tipoDe(i) === "feat" || tipoDe(i) === "spell"), item => {
    const p = lerPoder(item);
    const formas = p.formas.map(fo => {
      const av = avaliarForma(fo, ficha, { raridade: p.raridade, melhorias: p.melhorias, dadosRolagem: rolagem });
      return {
        id: fo.id, nome: fo.nome, acao: fo.acao, acaoLabel: ACOES[fo.acao]?.curto ?? fo.acao,
        custoTexto: textoCusto(fo), bloqueada: av.bloqueada, motivosTexto: av.motivos.join(", "),
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
      passiva: p.passiva, favorito: p.favorito, origemLabel: ORIGENS_HABILIDADE[p.origem] ?? "", circulo: p.circulo,
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
  const secoesHab = [...Object.entries(RARIDADES_PODER).map(([id, r]) => ({
    id, label: r.label, cor: r.cor, ...situacaoLimite(contagem, "habilidade", id, modo),
    itens: habilidades.filter(h => !h.passiva && h.raridade === id).sort(ordenarPoderes)
  })), {
    id: "passivas", label: "Passivas", cor: "#93A9A3", limite: null,
    itens: habilidades.filter(h => h.passiva).sort(ordenarPoderes)
  }];
  for (const s of secoesHab) s.vazia = !s.itens.length;
  ctx.habilidades = {
    secoes: secoesHab, total: habilidades.length,
    conhecidas: habilidades.filter(h => h.raridade !== "unica").length,
    espacos: int(dados.espacos?.habilidades, 2)
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
    espacosTruques: int(dados.espacos?.truques, 0)
  };
  if (!ctx.magias.circulos.some(c => c.ativa)) {
    ctx.magias.circulos[0].ativa = true;
    ctx.magias.circulos[0].cls = "active";
  }
  ctx.modoLimites = modo;

  /* ---------- Inventário ---------- */
  const contidos = {};
  for (const i of itens) {
    try { if (i.system?.container) contidos[i.system.container] = (contidos[i.system.container] ?? 0) + 1; } catch { /* item ilegível */ }
  }
  const nomes = {};
  for (const i of itens) { try { nomes[i.id] = i.name; } catch { /* item ilegível */ } }
  let pesoTotal = 0;
  ctx.categorias = CATEGORIAS_ITEM.map(cat => {
    const lista = cadaSeguro(itens.filter(i => cat.tipos.includes(tipoDe(i))), item => {
      const raridade = raridadeItem(item);
      const r = RARIDADES_ITEM[raridade];
      const qtd = num(item.system?.quantity, 1);
      const peso = pesoItem(item);
      pesoTotal += peso * qtd;
      const f = item.flags?.[FLAG] ?? {};
      const eArma = item.type === "weapon";
      const ataque = eArma ? resumoAtaque(ataqueDeArma(item), ficha, cena) : null;
      return {
        id: item.id, uuid: item.uuid, name: item.name, img: item.img, type: item.type,
        quantidade: qtd, peso: arredondar(peso, 2), pesoLinha: arredondar(peso * qtd, 2),
        raridade, raridadeLabel: r.label, raridadeCor: r.cor, raridadeOrdem: r.ordem,
        favorito: !!f.favorito,
        equipavel: ["weapon", "equipment"].includes(item.type),
        equipado: !!item.system?.equipped,
        eArma, eConsumivel: item.type === "consumable", ataque,
        formulaUso: f.formula ?? "",
        containerNome: item.system?.container ? (nomes[item.system.container] ?? "") : "",
        conteudo: contidos[item.id] ?? 0,
        expandido: expandidos.has(item.id),
        descricao: enriquecidos.itens?.[item.id] ?? "",
        opcoesRaridade: Object.entries(RARIDADES_ITEM).map(([id, rr]) => ({ id, label: rr.label, selected: id === raridade })),
        opcoesPericia: eArma ? opcoesPericia(ataque.periciaId) : []
      };
    }, falhas);
    const visiveis = lista.filter(i => !filtro.size || filtro.has(i.raridade));
    const porNome = (a, b) => a.name.localeCompare(b.name, "pt-BR");
    const grupos = [];
    const favoritos = visiveis.filter(i => i.favorito).sort((a, b) => b.raridadeOrdem - a.raridadeOrdem || porNome(a, b));
    if (favoritos.length) grupos.push({ id: "favoritos", label: "Favoritos", cor: "#D3A85E", favoritos: true, itens: favoritos });
    for (const [id, r] of Object.entries(RARIDADES_ITEM).sort((a, b) => b[1].ordem - a[1].ordem)) {
      const doGrupo = visiveis.filter(i => !i.favorito && i.raridade === id).sort(porNome);
      if (doGrupo.length) grupos.push({ id, label: r.label, cor: r.cor, itens: doGrupo });
    }
    return { ...cat, total: lista.length, grupos, vazia: !lista.length, filtrada: lista.length > 0 && !visiveis.length };
  });
  ctx.pesoTotal = arredondar(pesoTotal, 2);
  ctx.filtros = Object.entries(RARIDADES_ITEM).map(([id, r]) => ({ id, label: r.label, cor: r.cor, ativo: filtro.has(id) }));
  ctx.temFiltro = filtro.size > 0;
  ctx.moedas = MOEDAS.map(m => ({ ...m, quantidade: int(dados.moedas?.[m.id]) }));
  ctx.patrimonio = formatarMoedas(valorEmCobre(dados.moedas));

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
  ctx.condicoesLista = ficha.condicoes;
  ctx.tagsCondicoes = [
    { campo: "resistencias", label: "Resistências", dica: "Tipos de dano que você resiste", itens: dados.resistencias, sugestoes: SUGESTOES.dano },
    { campo: "imunidades", label: "Imunidades", dica: "Danos ou condições. Uma condição com o mesmo nome é ignorada.", itens: dados.imunidades, sugestoes: [...SUGESTOES.dano, ...ficha.condicoes.map(c => c.label)] },
    { campo: "vulnerabilidades", label: "Vulnerabilidades", dica: "Tipos de dano que te ferem mais", itens: dados.vulnerabilidades, sugestoes: SUGESTOES.dano },
    { campo: "idiomas", label: "Idiomas", dica: "Línguas que o personagem fala", itens: dados.idiomas, sugestoes: SUGESTOES.idiomas }
  ];

  /* ---------- Bênçãos e maldições ---------- */
  const alvos = alvosModificador(ficha.pericias.map(p => ({ id: p.id, nome: p.nome })));
  const gruposAlvo = [...new Set(alvos.map(a => a.grupo))];
  const rotuloAlvo = Object.fromEntries(alvos.map(a => [a.id, a.label]));
  const entradas = Object.entries(dados.bencaos ?? {}).filter(([, b]) => b).map(([id, b]) => ({
    id, nome: b.nome ?? "", tipo: b.tipo === "maldicao" ? "maldicao" : "bencao", ativo: !!b.ativo,
    origem: b.origem ?? "", descricao: b.descricao ?? "", criado: num(b.criado),
    mods: Object.entries(b.mods ?? {}).filter(([, m]) => m).map(([mid, m]) => ({
      id: mid, alvo: m.alvo ?? "", valor: num(m.valor), alvoLabel: rotuloAlvo[m.alvo] ?? "",
      grupos: gruposAlvo.map(g => ({ grupo: g, opcoes: alvos.filter(a => a.grupo === g).map(a => ({ ...a, selected: a.id === m.alvo })) }))
    }))
  })).sort((a, b) => a.criado - b.criado || a.nome.localeCompare(b.nome, "pt-BR"));
  ctx.bencaos = entradas.filter(e => e.tipo === "bencao");
  ctx.maldicoes = entradas.filter(e => e.tipo === "maldicao");

  /* ---------- Relações ---------- */
  ctx.relacoes = Object.entries(dados.relacoes ?? {}).filter(([, r]) => r).map(([id, r]) => {
    const af = Math.max(AFINIDADE.min, Math.min(AFINIDADE.max, int(r.afinidade)));
    return {
      id, nome: r.nome ?? "", img: r.img || "icons/svg/mystery-man.svg", uuid: r.uuid ?? "",
      tipo: r.tipo ?? "outro", tipoLabel: TIPOS_RELACAO[r.tipo ?? "outro"] ?? "Outro",
      afinidade: af, afinidadeLabel: rotuloAfinidade(af),
      afinidadePct: Math.round(((af - AFINIDADE.min) / (AFINIDADE.max - AFINIDADE.min)) * 100),
      notas: r.notas ?? "", criado: num(r.criado),
      opcoesTipo: Object.entries(TIPOS_RELACAO).map(([tid, label]) => ({ id: tid, label, selected: tid === (r.tipo ?? "outro") }))
    };
  }).sort((a, b) => a.criado - b.criado || a.nome.localeCompare(b.nome, "pt-BR"));
  ctx.afinidade = AFINIDADE;
  ctx.itensComErro = falhas;

  return ctx;
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
    av: avaliarForma(fo, fichaBase, { raridade: p.raridade, melhorias: p.melhorias, dadosRolagem: rolagem }),
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
