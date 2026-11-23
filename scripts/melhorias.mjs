/**
 * Melhorias de itens (0.8.21): vagas, pré-requisitos, efeitos automáticos, Material Especial, lotes, fazer em 3 etapas e comprar.
 * A primeira parte é pura (testável fora do Foundry); as ações ficam no fim.
 *
 * No item (flags.epm-ficha):
 * - melhoriasDoItem: { uid: { id, tipo, escolha, material, criado, origem, consumiu: [{ id, tipo, escolha }], selada } }
 * - pergaminhoEncantamento: true (3ª vaga de Encantamento)
 * - feitosMelhoria: { idDaMelhoria: true } (o Mestre marca)
 * - fazendoMelhoria: trabalho em andamento (etapas)
 * - listaMelhorias: categoria escolhida à mão ("" = automática)
 */
import {
  MELHORIAS_ITEM, TIPOS_MELHORIA, LISTAS_MELHORIA, ALVOS_MELHORIA, LISTAS_POR_CATEGORIA, FOCOS_CONJURACAO, MATERIAIS,
  PRECO_VAGA, DT_VAGA, HORAS_MELHORIA, LOJA_ARMAS, ETAPAS_MELHORIA, MATERIAL_UNIDADES_PESADO, PERGAMINHO, melhoriaPorId, textoMelhoria
} from "./melhorias-lista.mjs";
import { itemCatalogoPorId } from "./itens-catalogo.mjs";
import { arquetiposDoPersonagem, eTipoFavorito } from "./arquetipos.mjs";

const FLAG = "epm-ficha";
const P = `flags.${FLAG}`;
const n = (v, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d; };
const norm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Categorias para escolher à mão no editor (a automática vem do catálogo ou do tipo do item). */
export const CATEGORIAS_MELHORIA = {
  "": "Automática", "armas-cac": "Arma corpo a corpo", "armas-disparo": "Arma de disparo", "armas-fogo": "Arma de fogo e energia",
  municao: "Munição", armaduras: "Armadura", "escudos-leve": "Escudo leve", escudos: "Escudo médio", "escudos-pesado": "Escudo pesado",
  vestimentas: "Vestimenta ou acessório", "vestimentas-olhos": "Vestimenta para os olhos (máscara, óculos, capuz, visor)", cura: "Consumível de cura", "pocao-vida": "Poção de Vida",
  ofensivos: "Consumível ofensivo (bomba)", venenos: "Veneno", ferramentas: "Ferramenta ou kit", focos: "Foco ou instrumento", grimorio: "Grimório",
  aventura: "Equipamento de aventura", mochilas: "Mochila ou recipiente", nenhuma: "Não recebe melhorias"
};
const LISTAS_DA_CATEGORIA = {
  "armas-cac": ["geral", "armas-cac"], "armas-disparo": ["geral", "armas-disparo"], "armas-fogo": ["geral", "armas-fogo"],
  municao: ["municao"], armaduras: ["geral", "protecoes"], escudos: ["geral", "protecoes", "escudos"], "escudos-leve": ["geral", "protecoes", "escudos"],
  "escudos-pesado": ["geral", "protecoes", "escudos"], vestimentas: ["geral", "vestimentas"], "vestimentas-olhos": ["geral", "vestimentas"],
  cura: ["consumiveis-cura"], "pocao-vida": ["consumiveis-cura"], grimorio: ["geral", "focos"], ofensivos: ["consumiveis-ofensivos"], venenos: ["consumiveis-ofensivos"], ferramentas: ["geral", "ferramentas"],
  focos: ["geral", "focos"], aventura: ["geral", "aventura"], mochilas: ["geral", "mochilas"], nenhuma: []
};
const RE_FOGO = /bal[ií]stic|energia|plasma|laser|el[eé]tric|explosiv|rel[aâ]mpago/i;
const RE_ARMA_FOGO = /pistola|rev[oó]lver|rifle|fuzil|espingarda|metralhadora|carabina|escopeta|canh[aã]o|blaster|lan[cç]a-chamas|submetralhadora|sniper/i;

/** Itens do catálogo que já vêm com um subtipo (o resto o jogador ou o Mestre escolhe no editor). */
const SUBTIPO_CATALOGO = {
  "vestimentas.capa-com-capuz": "vestimentas-olhos", "vestimentas.visor-tatico": "vestimentas-olhos", "conjuracao.grimorio": "grimorio"
};

/** Categoria automática do item (catálogo primeiro; senão pelo tipo do item). */
export function categoriaAutomatica(item) {
  const f = item?.flags?.[FLAG] ?? {};
  if (SUBTIPO_CATALOGO[f.catalogo]) return SUBTIPO_CATALOGO[f.catalogo];
  if (/^pocoes\.pocao-de-vida/.test(String(f.catalogo ?? ""))) return "pocao-vida";
  const nome = String(item?.name ?? "");
  const cat = String(f.catalogo ?? "").split(".")[0];
  const x = f.catalogo ? itemCatalogoPorId(f.catalogo) : null;
  if (cat && cat in LISTAS_POR_CATEGORIA && LISTAS_POR_CATEGORIA[cat] === null) return "nenhuma";
  const tipo = item?.type;
  if (tipo === "weapon") {
    const pontaria = f.periciaAtaque === "pontaria" || f.alcance === "distancia";
    if (!pontaria) return "armas-cac";
    return RE_FOGO.test(String(f.tipoDano ?? "")) || RE_ARMA_FOGO.test(nome) ? "armas-fogo" : "armas-disparo";
  }
  if (cat === "armaduras") return "armaduras";
  if (cat === "escudos") {
    const t = norm(x?.armadura?.tipoEscudo);
    return t === "leve" ? "escudos-leve" : t === "pesado" ? "escudos-pesado" : "escudos";
  }
  if (cat === "vestimentas") return "vestimentas";
  if (cat === "municao") return "municao";
  if (["pocoes", "medicina", "comida"].includes(cat)) return "cura";
  if (cat === "venenos") return "venenos";
  if (cat === "arremesso") return "ofensivos";
  if (cat === "ferramentas") return "ferramentas";
  if (cat === "aventura") return "aventura";
  if (cat === "recipientes") return "mochilas";
  if (cat === "conjuracao") return x?.tipo === "tool" || FOCOS_CONJURACAO.test(nome) ? "focos" : "cura";
  if (tipo === "equipment") {
    if (f.tipoArmadura) return "armaduras";
    if (/escudo|broquel/i.test(nome) || item.system?.type?.value === "shield") return "escudos";
    return "vestimentas";
  }
  if (tipo === "consumable") {
    const sub = item.system?.type?.value;
    if (sub === "ammo") return "municao";
    if (sub === "poison") return "venenos";
    if (["potion", "food"].includes(sub)) return "cura";
    if (f.formula && !Object.values(f.efeitos ?? {}).some(e => e?.tipo === "cura")) return "ofensivos";
    return "cura";
  }
  if (tipo === "tool") return item.system?.type?.value === "music" || FOCOS_CONJURACAO.test(nome) ? "focos" : "ferramentas";
  if (tipo === "container" || tipo === "backpack") return "mochilas";
  if (tipo === "loot") return FOCOS_CONJURACAO.test(nome) ? "focos" : "aventura";
  return "nenhuma";
}

/** Tudo o que as listas e os pré-requisitos precisam saber do item. */
export function perfilItem(item) {
  const f = item?.flags?.[FLAG] ?? {};
  const manual = f.listaMelhorias && CATEGORIAS_MELHORIA[f.listaMelhorias] ? f.listaMelhorias : "";
  const cat = manual || categoriaAutomatica(item);
  const nome = String(item?.name ?? "");
  const x = f.catalogo ? itemCatalogoPorId(f.catalogo) : null;
  const armadura = cat === "armaduras" ? (f.tipoArmadura || "leve") : "";
  const escudo = cat.startsWith("escudos");
  const tipoEscudo = cat === "escudos-leve" ? "leve" : cat === "escudos-pesado" ? "pesado" : escudo ? "medio" : "";
  void x;
  return {
    categoria: cat, automatica: !manual, listas: LISTAS_DA_CATEGORIA[cat] ?? [], nome,
    arma: cat.startsWith("armas-"), armaCac: cat === "armas-cac", armaDisparo: cat === "armas-disparo", armaFogo: cat === "armas-fogo",
    municao: cat === "municao", armadura, escudo, tipoEscudo, protecao: !!armadura || escudo, vestimenta: cat.startsWith("vestimentas"),
    olhos: cat === "vestimentas-olhos", grimorio: cat === "grimorio", pocaoVida: cat === "pocao-vida",
    consumivel: ["cura", "pocao-vida", "ofensivos", "venenos"].includes(cat), cura: ["cura", "pocao-vida"].includes(cat), ofensivo: ["ofensivos", "venenos"].includes(cat),
    venenos: cat === "venenos", bombas: cat === "ofensivos", ferramenta: cat === "ferramentas", foco: ["focos", "grimorio"].includes(cat),
    aventura: cat === "aventura", mochila: cat === "mochilas", lote: ["cura", "pocao-vida", "ofensivos", "venenos", "municao"].includes(cat),
    nomeado: !!String(f.titulo ?? "").trim(), props: (Array.isArray(f.propriedades) ? f.propriedades : []).map(norm)
  };
}

/** O item cabe no "Item" de uma melhoria com pré-requisito? */
export function alvoCabe(alvo, p) {
  if (!p.listas.length) return false;
  switch (alvo) {
    case "qualquer": return true;
    case "arma": return p.arma;
    case "arma-cac": return p.armaCac;
    case "arma-disparo": return p.armaDisparo;
    case "arma-fogo": return p.armaFogo;
    case "disparo-ou-fogo": return p.armaDisparo || p.armaFogo;
    case "arma-nomeada": return p.arma && p.nomeado;
    case "item-nomeado": return p.nomeado && !p.consumivel && !p.municao;
    case "protecao": return p.protecao;
    case "armadura": return !!p.armadura;
    case "armadura-media-pesada": return ["media", "pesada"].includes(p.armadura);
    case "armadura-pesada": return p.armadura === "pesada";
    case "pesada-ou-escudo-pesado": return p.armadura === "pesada" || p.tipoEscudo === "pesado";
    case "escudo-leve": return p.tipoEscudo === "leve";
    case "vestimenta": return p.vestimenta;
    case "vestimenta-olhos": return p.olhos;
    case "foco": return p.foco;
    case "grimorio": return p.grimorio;
    case "consumivel": return p.consumivel;
    case "consumivel-cura": return p.cura;
    case "pocao-vida": return p.pocaoVida;
    case "ferramenta": return p.ferramenta;
    case "mochila": return p.mochila;
    default: return false;
  }
}

/** A melhoria serve para este item (lista do tipo ou "Item" do pré-requisito)? */
export function melhoriaServe(m, p) {
  if (!p.listas.length) return false;
  if (m.alvo) return alvoCabe(m.alvo, p);
  if (!m.listas.some(l => p.listas.includes(l))) return false;
  if (m.so && !p[m.so]) return false;
  if (m.id === "material-especial" && (p.consumivel)) return false;
  return true;
}

/** Entradas gravadas no item, com a definição de cada uma. */
export function lerMelhorias(item) {
  const bruto = item?.flags?.[FLAG]?.melhoriasDoItem ?? {};
  return Object.entries(bruto).filter(([, e]) => e && typeof e === "object")
    .map(([uid, e]) => {
      const def = melhoriaPorId(e.id, e.tipo) ?? (e.manual ? null : melhoriaPorId(e.id));
      const tipo = TIPOS_MELHORIA[e.tipo] ? e.tipo : (def?.tipo ?? "modificacao");
      return {
        uid, id: e.id ?? "", tipo, def, escolha: String(e.escolha ?? ""), material: MATERIAIS[e.material] ? e.material : "",
        consumiu: Array.isArray(e.consumiu) ? e.consumiu : [], selada: !!e.selada, criado: n(e.criado), origem: e.origem ?? "",
        manual: e.manual && typeof e.manual === "object" ? { nome: String(e.manual.nome ?? ""), texto: String(e.manual.texto ?? "") } : null
      };
    })
    .sort((a, b) => a.criado - b.criado);
}

/** Nome mostrado da entrada ("Material Especial: Mitral", "Elemental (Fogo)"). */
export function nomeDaEntrada(e) {
  if (e.manual) return e.manual.nome || "Melhoria";
  const base = e.def?.nome ?? e.id;
  if (e.id === "material-especial") return `Material Especial: ${MATERIAIS[e.material]?.nome ?? "—"}`;
  return e.escolha ? `${base} (${e.escolha})` : base;
}

/** Coluna da tabela de Materiais que vale no item. */
export function colunaMaterial(p) {
  if (p.arma || p.municao) return "arma";
  if (p.protecao) return "protecao";
  return "outros";
}

/** Material Especial do item (id) ou "". */
export const materialDoItem = item => lerMelhorias(item).find(e => e.id === "material-especial")?.material ?? "";

/** O portador cumpre o pré-requisito? Devolve o motivo quando não cumpre ("" = cumpre). */
export function motivoPortador(pre, item, dados) {
  const req = pre?.portador;
  if (!req) return "";
  if (!dados) return "precisa de um portador";
  if (req.atributo) {
    const [id, min] = req.atributo;
    const a = dados.atributos?.[id] ?? {};
    const v = n(a.base) + n(a.raca) + n(a.aumento) + n(a.outros);
    if (v < min) return `portador com ${rotuloAtributo(id)} ${min}`;
  }
  if (req.pericia) {
    const [ids, min] = req.pericia;
    const lista = Array.isArray(ids) ? ids : [ids];
    // Ofício é coringa: vale o maior entre os ofícios da pessoa (Ofício (Ferreiro), Ofício (Cozinheiro)…)
    const pontosDe = id => id === "oficio"
      ? Math.max(0, ...Object.entries(dados.pericias ?? {}).filter(([pid, pp]) => /^oficio/.test(pid) || /^oficio/.test(norm(pp?.nome))).map(([, pp]) => n(pp?.pontos)))
      : n(dados.pericias?.[id]?.pontos);
    const melhor = Math.max(...lista.map(pontosDe));
    if (melhor < min) return `portador com ${min} pontos em ${lista.map(rotuloPericia).join(" ou ")}`;
  }
  if (req.arquetipo && !arquetiposDoPersonagem(dados).some(a => a.id === req.arquetipo)) return `portador ${req.arquetipo === "conjurador" ? "Conjurador" : req.arquetipo}`;
  if (req.favorita && !eTipoFavorito(item, dados)) return "ser a arma favorita do portador";
  if (req.sanidadeMax !== undefined) {
    const ps = n(dados.recursos?.ps?.value ?? dados.recursos?.sanidade?.value, 999);
    if (ps > req.sanidadeMax) return `portador com ${req.sanidadeMax} de Sanidade ou menos`;
  }
  return "";
}
const ROT_ATR = { forca: "Força", destreza: "Destreza", constituicao: "Constituição", aparencia: "Aparência", carisma: "Carisma", inteligencia: "Inteligência", autocontrole: "Autocontrole", nucleo: "Núcleo" };
const rotuloAtributo = id => ROT_ATR[id] ?? id;
const ROT_PER = { oficio: "Ofício", furtividade: "Furtividade", luta: "Luta", pontaria: "Pontaria" };
const rotuloPericia = id => ROT_PER[id] ?? id;
const nomeMelhoria = id => melhoriaPorId(id)?.nome ?? id;

/**
 * Estado completo das melhorias do item: vagas, títulos, entradas (ativas ou desligadas, com motivo) e efeitos somados.
 * `dados`: flags do portador (para os pré-requisitos de portador). Sem portador, os de portador ficam desligados.
 */
export function estadoMelhorias(item, { dados } = {}) {
  const f = item?.flags?.[FLAG] ?? {};
  const p = perfilItem(item);
  const entradas = lerMelhorias(item);
  const feitos = f.feitosMelhoria ?? {};
  const material = entradas.find(e => e.id === "material-especial")?.material ?? "";
  const presentes = new Set(entradas.map(e => e.id));
  const bloqueadas = new Set(entradas.flatMap(e => e.consumiu.map(c => c.id)));
  const pureza = entradas.some(e => e.def?.auto?.pureza && e.tipo === "bencao");
  const vagas = {};
  for (const [tipo, t] of Object.entries(TIPOS_MELHORIA)) {
    let max = tipo === "encantamento" && f.pergaminhoEncantamento ? t.vagasPergaminho : t.vagas;
    // Forja dos Deuses: 1 vez por item, uma Modificação feita com ela não conta no limite de 3
    if (tipo === "modificacao" && f.modExtraForja) max += 1;
    const usadas = entradas.filter(e => e.tipo === tipo).length;
    vagas[tipo] = { tipo, ...t, usadas, max, livres: Math.max(0, max - usadas), cheio: usadas >= max };
  }
  const titulos = p.lote ? [] : Object.values(vagas).filter(v => v.cheio && v.usadas > 0).map(v => v.titulo);
  const lista = entradas.map(e => {
    const motivos = [];
    const pre = e.def?.pre;
    if (pre) {
      if (pre.modo === "mantem" && pre.m?.length && !pre.m.some(id => presentes.has(id))) motivos.push(`falta ${pre.m.map(nomeMelhoria).join(" ou ")}`);
      if (pre.mTambem?.length && !pre.mTambem.every(id => presentes.has(id))) motivos.push(`falta ${pre.mTambem.map(nomeMelhoria).join(" e ")}`);
      if (pre.material && material !== pre.material) motivos.push(`pede o material ${MATERIAIS[pre.material]?.nome}`);
      if (pre.prop && !p.props.includes(norm(pre.prop)) && !propsDeMateriais(material, p).includes(norm(pre.prop))) motivos.push(`pede a propriedade ${pre.prop}`);
      if (pre.maldicoes && entradas.filter(x => x.tipo === "maldicao" && x.uid !== e.uid).length < pre.maldicoes) motivos.push(`pede ${pre.maldicoes} Maldições no item`);
      if (pre.titulos && titulos.length < pre.titulos) motivos.push(`pede ${pre.titulos} Títulos`);
      if (pre.feito && !feitos[e.id]) motivos.push(`feito: ${pre.feito} (o Mestre marca)`);
      const mp = motivoPortador(pre, item, dados);
      if (mp) motivos.push(mp);
    }
    return { ...e, nome: nomeDaEntrada(e), texto: e.manual ? e.manual.texto : (e.id === "material-especial" ? (MATERIAIS[e.material]?.[colunaMaterial(p)]?.texto ?? "Sem efeito neste tipo de item") : textoMelhoria(e.def)),
      ativa: !motivos.length, motivos, motivoTexto: motivos.join("; ") };
  });
  const efeitos = somarEfeitos(lista.filter(e => e.ativa), { p, material, pureza, nome: p.nome });
  return { perfil: p, vagas, titulos, entradas: lista, material, bloqueadas, pureza, efeitos, pergaminho: !!f.pergaminhoEncantamento };
}

function propsDeMateriais(material, p) {
  return (MATERIAIS[material]?.[colunaMaterial(p)]?.auto?.props ?? []).map(norm);
}

/**
 * Soma os efeitos das melhorias ativas. Tudo soma, inclusive o mesmo efeito em duas melhorias
 * (Afiada +2 e Brutal +2 = +4; RD do mesmo tipo soma; Leve e Mitral: metade de metade do peso).
 */
export function somarEfeitos(ativas, { p, material, pureza = false, nome = "" } = {}) {
  const r = {
    acerto: 0, dano: 0, margem: 0, mult: 0, dados: 0, passo: 0, ignoraRd: 0, danoCritico: 0, alcance: 0, danoParado: 0,
    massacre: false, maxNo20: false, maxNoCritico: false, categoria: 0, props: new Set(), danoExtra: [], curaAcerto: [], notas: [], custoNotas: [],
    mods: {}, rd: {}, resist: new Set(), peso: 1, pesoMenos: 0, capacidade: 1, pesoDentro: 1, consDados: 0, consFixo: 0, consMax: false,
    reservaPm: 0, iniciativa: 0, acertoItem: 0, semPenalDesloc: false, penalDesloc: 0, semPenalFurtividade: false, furtividadeMenos: 0,
    curaTurno: [], protetiva: false, pureza, selaBencao: false, cdMagia: 0, acertoMagia: 0, notasMagia: [], custoMagia: [], testeFerramenta: 0, forjaDosDeuses: false
  };
  const aplicar = (auto, e, fonte) => {
    if (!auto) return;
    if (auto.so && !auto.so.test(nome)) return;
    const troca = v => v === "@escolha" ? (e.escolha || "") : v === "@material" ? (e.materialEscolha || "") : v;
    for (const k of ["acerto", "dano", "margem", "mult", "dados", "passo", "ignoraRd", "danoCritico", "alcance", "danoParado", "categoria", "consDados", "consFixo", "pesoMenos", "penalDesloc", "furtividadeMenos", "acertoItem", "cdMagia", "acertoMagia", "testeFerramenta"]) if (auto[k]) r[k] += n(auto[k]);
    for (const k of ["massacre", "maxNo20", "maxNoCritico", "consMax", "semPenalDesloc", "semPenalFurtividade", "protetiva", "selaBencao", "forjaDosDeuses"]) if (auto[k]) r[k] = true;
    // Tudo soma (decisão de 22/11): peso e peso de dentro multiplicam (metade de metade), capacidade soma os acréscimos
    if (auto.peso !== undefined) r.peso *= auto.peso;
    if (auto.capacidade) r.capacidade += auto.capacidade - 1;
    if (auto.pesoDentro !== undefined) r.pesoDentro *= auto.pesoDentro;
    if (auto.reservaPm) r.reservaPm += auto.reservaPm;
    if (auto.iniciativaUnica) r.iniciativa = Math.max(r.iniciativa, auto.iniciativaUnica);
    for (const pr of auto.props ?? []) r.props.add(pr);
    for (const d of auto.danoExtra ?? []) {
      const tipo = troca(d.tipo);
      if (d.contra) r.notas.push(`${fonte}: +${d.formula}${tipo ? ` ${tipo}` : ""} contra ${d.contra}.`);
      else r.danoExtra.push({ formula: d.formula, tipo, fonte });
    }
    for (const c of auto.cura ?? []) r.curaAcerto.push({ ...c, fonte });
    if (auto.curaTurno) r.curaTurno.push({ formula: auto.curaTurno, fonte });
    for (const [alvo, v] of Object.entries(auto.mods ?? {})) r.mods[alvo] = (r.mods[alvo] ?? 0) + n(v);
    if (auto.ca) r.mods.ca = (r.mods.ca ?? 0) + n(auto.ca);
    if (auto.periciaEscolhida && e.escolha) { const k = `pericia.${norm(e.escolha).replace(/[^a-z]/g, "")}`; r.mods[k] = (r.mods[k] ?? 0) + n(auto.periciaEscolhida); }
    for (const [v, tipo] of auto.rd ?? []) { const t = troca(tipo); r.rd[t] = (r.rd[t] ?? 0) + n(v); }
    for (const t of auto.resist ?? []) { const x = troca(t); if (x) r.resist.add(x); }
    if (auto.nota) r.notas.push(`${fonte}: ${auto.nota}`);
    if (auto.notaMagia) r.notasMagia.push(`${fonte}: ${auto.notaMagia}`);
  };
  const materialEscolha = ativas.find(e => e.id === "material-especial")?.escolha ?? "";
  for (const e of ativas) {
    const fonte = nomeDaEntrada(e);
    const ctx = { ...e, materialEscolha };
    if (e.id === "material-especial") { aplicar(MATERIAIS[e.material]?.[colunaMaterial(p)]?.auto, ctx, fonte); continue; }
    const auto = e.def?.auto;
    if (!auto) continue;
    aplicar(auto, ctx, fonte);
    if (e.tipo === "maldicao" && !pureza) {
      if (auto.custo) aplicar(auto.custo, ctx, `${fonte} (custo)`);
      if (auto.custoNota) r.custoNotas.push(`${fonte}: ${auto.custoNota}`);
      if (auto.custoMagia) r.custoMagia.push(`${fonte}: ${auto.custoMagia}`);
    }
  }
  r.props = [...r.props];
  r.resist = [...r.resist];
  return r;
}

/* ---------------- Fórmulas ---------------- */

const PASSOS = [4, 6, 8, 10, 12];
/** Dados da arma descem ou sobem passos (d8 → d10); fora da escala fica no limite. */
export function passoDeDado(formula, passos) {
  if (!passos) return formula;
  return String(formula).replace(/(\d*)d(\d+)/g, (_, q, f) => {
    const i = PASSOS.indexOf(Number(f));
    if (i < 0) return `${q}d${f}`;
    return `${q}d${PASSOS[Math.max(0, Math.min(PASSOS.length - 1, i + passos))]}`;
  });
}
/** +N dados do mesmo tipo no primeiro termo de dados ("2d8 + 4" → "3d8 + 4"). */
export function maisDados(formula, qtd) {
  if (!qtd) return formula;
  let feito = false;
  return String(formula).replace(/(\d*)d(\d+)/, (_, q, f) => { feito = true; return `${(Number(q) || 1) + qtd}d${f}`; }) + (feito ? "" : "");
}
/** Fórmula de consumível com Concentrada, Fórmula Própria, Viciante, Instável e Ambrosia. */
export function formulaConsumivel(formula, ef) {
  let fo = String(formula ?? "").trim();
  if (!fo || !ef) return fo;
  fo = maisDados(fo, ef.consDados);
  if (ef.consFixo) fo = `${fo} + ${ef.consFixo}`;
  if (ef.consMax) fo = fo.replace(/(\d*)d(\d+)/g, (_, q, f) => String((Number(q) || 1) * Number(f)));
  return fo;
}
/** Dano maximizado ("2d8 + 3" → "16 + 3"). */
export const maximizar = formula => String(formula).replace(/(\d*)d(\d+)/g, (_, q, f) => String((Number(q) || 1) * Number(f)));

/* ---------------- Efeitos para a ficha ---------------- */

/**
 * Efeitos no formato de lerEfeitosItem (mod, rd, resistencia, cura, danoExtra) que as melhorias dão.
 * Em armas, acerto/dano/margem vão direto no ataque (não aqui), para não valerem nos outros ataques.
 */
export function efeitosDasMelhorias(item, est) {
  const r = est.efeitos;
  const out = [];
  const origem = tipo => tipo === "maldicao" ? "maldicao" : tipo === "bencao" ? "bencao" : "item";
  const ordem = { mod: 0 };
  for (const [alvo, valor] of Object.entries(r.mods)) if (valor) out.push({ tipo: "mod", alvo, valor, origem: "item" });
  if (r.iniciativa) out.push({ tipo: "mod", alvo: "iniciativa", valor: r.iniciativa, origem: "item" });
  for (const [tipoDano, valor] of Object.entries(r.rd)) if (valor) out.push({ tipo: "rd", valor, tipoDano });
  for (const t of r.resist) out.push({ tipo: "resistencia", tipoDano: t });
  for (const d of r.danoExtra) out.push({ tipo: "danoExtra", formula: d.formula, tipoDano: d.tipo });
  for (const c of r.curaAcerto) out.push({ tipo: "cura", quando: "acerto", formula: c.formula, recurso: c.recurso ?? "pv" });
  for (const c of r.curaTurno) out.push({ tipo: "cura", quando: "turno", formula: c.formula, recurso: "pv" });
  void ordem; void origem;
  return out.map((e, i) => ({ id: `melhoria-${i}`, alvo: "", valor: 0, tipoDano: "", em: "", recurso: "pv", formula: "", quando: "uso", criado: 1e15 + i, deMelhoria: true, ...e }));
}

/** Ajusta os efeitos gravados do item (armadura): Ajustada, Encaixe Perfeito, Mitral, Abafada. */
export function ajustarEfeitosGravados(efeitos, r) {
  if (!r) return efeitos;
  let folgaDesloc = r.penalDesloc;
  let folgaFurt = r.furtividadeMenos;
  return efeitos.map(e => {
    if (e.tipo === "mod" && e.alvo === "deslocamento" && e.valor < 0) {
      if (r.semPenalDesloc) return null;
      if (folgaDesloc > 0) { const usa = Math.min(folgaDesloc, -e.valor); folgaDesloc -= usa; const v = e.valor + usa; return v ? { ...e, valor: v } : null; }
    }
    if (e.tipo === "mod" && e.alvo === "pericia.furtividade" && e.valor < 0) {
      if (r.semPenalFurtividade) return null;
      if (folgaFurt > 0) { const usa = Math.min(folgaFurt, -e.valor); folgaFurt -= usa; const v = e.valor + usa; return v ? { ...e, valor: v } : null; }
    }
    if (e.tipo === "desvantagem" && /furtividade/.test(String(e.em)) && r.semPenalFurtividade) return null;
    return e;
  }).filter(Boolean);
}

/** Peso de 1 unidade com as melhorias (Leve, Pluma, Mitral, Furtiva…). */
export function pesoComMelhorias(peso, r) {
  if (!r) return peso;
  return Math.max(0, n(peso) * r.peso - r.pesoMenos);
}

/** Resumo curto para a linha do item e o cartão ("Afiada · Elemental (Fogo) · Item Refinado"). */
export function resumoMelhorias(est) {
  const nomes = est.entradas.map(e => e.ativa ? e.nome : `${e.nome} (desligada)`);
  return [...nomes, ...est.titulos].join(" · ");
}

/* ---------------- Adicionar: regras ---------------- */

/** Pode receber esta melhoria? { ok, motivo, consome: [uid], vaga (1, 2, 3) }. */
export function podeAdicionar(item, def, { mestre = false, escolha = "", forja = false } = {}) {
  if (!def) return { ok: false, motivo: "Melhoria desconhecida." };
  const est = estadoMelhorias(item);
  const p = est.perfil;
  if (!p.listas.length) return { ok: false, motivo: "Este item não recebe melhorias (matéria-prima)." };
  if (!melhoriaServe(def, p)) return { ok: false, motivo: `${def.nome} não serve para este tipo de item.` };
  if (["maldicao", "bencao"].includes(def.tipo) && !mestre) return { ok: false, motivo: "Maldições e Bênçãos só o Mestre adiciona." };
  const chaves = new Set(est.entradas.map(e => e.def?.chave ?? e.id));
  if (chaves.has(def.chave)) return { ok: false, motivo: `${def.nome} já está no item.` };
  if (est.bloqueadas.has(def.id)) return { ok: false, motivo: `${def.nome} foi consumida por outra melhoria e não volta enquanto ela estiver no item.` };
  const pre = def.pre ?? {};
  const consome = [];
  if (pre.m?.length) {
    const tem = est.entradas.find(e => pre.m.includes(e.id));
    if (!tem) return { ok: false, motivo: `Pede ${pre.m.map(nomeMelhoria).join(" ou ")} no item.` };
    if (pre.modo === "consome") consome.push(tem.uid);
  }
  if (pre.mTambem?.length && !pre.mTambem.every(id => est.entradas.some(e => e.id === id))) return { ok: false, motivo: `Pede ${pre.mTambem.map(nomeMelhoria).join(" e ")} no item.` };
  if (pre.bencao) {
    const b = est.entradas.find(e => e.tipo === "bencao" && !e.selada);
    if (!b) return { ok: false, motivo: "Pede uma Bênção no item." };
  }
  if (pre.material && est.material !== pre.material) return { ok: false, motivo: `Pede o Material Especial ${MATERIAIS[pre.material]?.nome}.` };
  if (pre.prop && !p.props.includes(norm(pre.prop)) && !propsDeMateriais(est.material, p).includes(norm(pre.prop))) return { ok: false, motivo: `Pede um item com a propriedade ${pre.prop}.` };
  if (pre.maldicoes && est.entradas.filter(e => e.tipo === "maldicao").length < pre.maldicoes) return { ok: false, motivo: `Pede ${pre.maldicoes} Maldições no item.` };
  if (pre.titulos && est.titulos.length < pre.titulos) return { ok: false, motivo: `Pede ${pre.titulos} Títulos no item.` };
  if (def.escolha && def.escolha !== "material" && !String(escolha).trim() && def.escolha !== "condicao") { /* a escolha é pedida no diálogo */ }
  const v = est.vagas[def.tipo];
  const livres = v.max - v.usadas + consome.filter(uid => est.entradas.find(e => e.uid === uid)?.tipo === def.tipo).length;
  if (livres <= 0 && def.tipo === "modificacao" && forja && !item?.flags?.[FLAG]?.modExtraForja) {
    return { ok: true, consome, vaga: 3, estado: est, extraForja: true };
  }
  if (livres <= 0) return { ok: false, motivo: `As vagas de ${v.plural} estão cheias (${v.usadas} de ${v.max}).` };
  // Vaga para preço e teste: a seguinte, contando a que vai sair (máximo 3ª Modificação ou 2º Encantamento)
  const teto = def.tipo === "encantamento" && !est.pergaminho ? 2 : 3;
  const vaga = Math.min(teto, v.usadas + 1);
  return { ok: true, consome, vaga, estado: est };
}

/** Preço em PO para comprar (vaga, loja de armas, material, lote). */
export function precoMelhoria(def, vaga, { lojaArmas = false, lote = false, precoMaterial = 0 } = {}) {
  const tabela = PRECO_VAGA[def.tipo];
  if (!tabela) return null;
  let po = tabela[Math.max(0, Math.min(tabela.length - 1, vaga - 1))];
  if (def.id === "material-especial") po += precoMaterial;
  if (lojaArmas) po *= LOJA_ARMAS;
  if (lote) po /= 5;
  return Math.round(po * 100) / 100;
}
/** Trocar de material: preço do novo − metade do anterior (mínimo 0). */
export const precoTrocaMaterial = (novo, anterior) => Math.max(0, n(novo) - n(anterior) / 2);
export const dtMelhoria = (tipo, vaga) => DT_VAGA[tipo]?.[Math.max(0, Math.min(2, vaga - 1))] ?? 0;
/** Custo de material fazendo sozinho: metade do preço da vaga (1/3 por etapa). */
export const custoFazerPO = (def, vaga, opts = {}) => n(precoMelhoria(def, vaga, { ...opts, lojaArmas: false })) / 2;
export const precoMaterialPO = id => n(itemCatalogoPorId(MATERIAIS[id]?.catalogo)?.preco);

/** Entrada nova para gravar no item. */
export function novaEntrada(def, { escolha = "", material = "", origem = "", consumiu = [] } = {}) {
  return { id: def.id, tipo: def.tipo, escolha: String(escolha ?? "").trim(), ...(material ? { material } : {}), origem, consumiu, criado: Date.now() };
}

/** Lista para o diálogo de adicionar: melhorias do tipo que servem no item, com o motivo de bloqueio. */
export function opcoesParaAdicionar(item, tipo, { mestre = false } = {}) {
  const p = perfilItem(item);
  return MELHORIAS_ITEM.filter(m => m.tipo === tipo && melhoriaServe(m, p)).map(m => {
    const r = podeAdicionar(item, m, { mestre });
    return { ...m, textoCompleto: textoMelhoria(m), ok: r.ok, motivo: r.motivo ?? "", vaga: r.vaga ?? 0,
      pre: m.pre, temPre: !!m.pre, listaTexto: m.alvo ? ALVOS_MELHORIA[m.alvo] : m.listas.map(l => LISTAS_MELHORIA[l]).join(", ") };
  });
}

/** Bônus das ferramentas nos testes de Ofício (a melhor ferramenta) e se alguma é Forja dos Deuses. */
export function bonusDeFerramentas(actor) {
  let melhor = 0, nome = "", forja = false;
  for (const it of actor?.items ?? []) {
    if (!it.flags?.[FLAG]?.melhoriasDoItem || it.flags[FLAG].passivaDesligada) continue;
    const est = estadoMelhorias(it, { dados: actor.flags?.[FLAG] });
    if (!est.perfil.ferramenta) continue;
    if (est.efeitos.forjaDosDeuses) forja = true;
    if (est.efeitos.testeFerramenta > melhor) { melhor = est.efeitos.testeFerramenta; nome = it.name; }
  }
  return { bonus: melhor, nome, forja };
}

/** Bônus de magia dos focos que o personagem carrega (passiva ligada): { cd, acerto, notas }. */
export function bonusDeFocos(actor) {
  const out = { cd: 0, acerto: 0, fontesCd: [], fontesAcerto: [], notas: [] };
  for (const it of actor?.items ?? []) {
    if (it.flags?.[FLAG]?.passivaDesligada || n(it.system?.quantity, 1) <= 0) continue;
    if (!it.flags?.[FLAG]?.melhoriasDoItem) continue;
    const est = estadoMelhorias(it, { dados: actor.flags?.[FLAG] });
    if (!est.perfil.foco) continue;
    const r = est.efeitos;
    if (r.cdMagia) { out.cd += r.cdMagia; out.fontesCd.push(it.name); }
    if (r.acertoMagia) { out.acerto += r.acertoMagia; out.fontesAcerto.push(it.name); }
    out.notas.push(...r.notasMagia.map(x => `${it.name}: ${x}`));
    if (!est.pureza) out.notas.push(...r.custoMagia.map(x => `${it.name} (maldição): ${x}`));
  }
  return out;
}

export { TIPOS_MELHORIA, LISTAS_MELHORIA, MATERIAIS, HORAS_MELHORIA, ETAPAS_MELHORIA, MATERIAL_UNIDADES_PESADO, PERGAMINHO, melhoriaPorId, textoMelhoria };
