/**
 * Grimório de Magias do EPM dentro do Foundry: as magias do documento "Grimório de Magias" (scripts/grimorio-dados.mjs)
 * viram magias da ficha sem passar pelo site. Só dados e contas puras (sem depender do Foundry, exceto o id padrão).
 *
 * Cada magia vira um item "spell" com uma forma: círculo, custo em PM pelo círculo, ação, alcance, alvo, área, duração,
 * teste (ataque com Arcanismo ou resistência) e dano lidos dos campos e das linhas de Acerto/Dano.
 */
import { FLAG, TIPOS_DANO } from "./config.mjs";
import { formaPadrao } from "./data.mjs";

/** Endereço do site do Grimório (página publicada com as mesmas magias). */
export const GRIMORIO_URL = "https://claude.ai/artifact/A6QayZpDEmQ6YTkTqag5rR";

/** Seções do grimório na ordem do documento. */
export const SECOES_GRIMORIO = [
  { id: "c0", label: "Truques", curto: "Truque", tipo: "truque", circulo: 0 },
  { id: "c1", label: "1º Círculo", curto: "1º", tipo: "magia", circulo: 1 },
  { id: "c2", label: "2º Círculo", curto: "2º", tipo: "magia", circulo: 2 },
  { id: "c3", label: "3º Círculo", curto: "3º", tipo: "magia", circulo: 3 },
  { id: "c4", label: "4º Círculo", curto: "4º", tipo: "magia", circulo: 4 },
  { id: "c5", label: "5º Círculo", curto: "5º", tipo: "magia", circulo: 5 },
  { id: "c6", label: "6º Círculo", curto: "6º", tipo: "magia", circulo: 6 },
  { id: "ritual", label: "Rituais", curto: "Ritual", tipo: "ritual", circulo: null }
];

/** Seção de uma magia ("c0"…"c6" ou "ritual"). */
export const secaoDe = m => (m.tipo === "ritual" ? "ritual" : `c${m.circulo}`);

/** Ícone do Foundry por escola. */
const ICONES = {
  "Abjuração": "icons/svg/mage-shield.svg", "Adivinhação": "icons/svg/eye.svg", "Conjuração": "icons/svg/aura.svg",
  "Encantamento": "icons/svg/daze.svg", "Evocação": "icons/svg/explosion.svg", "Ilusão": "icons/svg/invisible.svg",
  "Necromancia": "icons/svg/skull.svg", "Transmutação": "icons/svg/upgrade.svg", "Universal": "icons/svg/book.svg"
};
export const iconeGrimorio = m => (m.tipo === "ritual" ? "icons/svg/book.svg" : ICONES[m.escola] ?? "icons/svg/explosion.svg");

const norm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Negrito e itálico do markdown simples do grimório (o texto já vem escapado). */
const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");

/** Markdown simples (parágrafos, listas "- ", negrito) → HTML. */
export function htmlGrimorio(md) {
  return String(md ?? "").trim().split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(b => {
    const ls = b.split("\n").map(x => x.trim()).filter(Boolean);
    if (ls.every(x => /^[-•]\s/.test(x))) return `<ul>${ls.map(x => `<li>${inline(x.replace(/^[-•]\s*/, ""))}</li>`).join("")}</ul>`;
    return `<p>${ls.map(inline).join("<br>")}</p>`;
  }).join("");
}

/** Texto para busca (sem acento). */
export function textoBusca(m) {
  return norm([m.nome, m.escola, m.rotulo, Object.values(m.campos ?? {}).join(" "), m.texto, (m.mecanica ?? []).join(" ")].join(" "));
}

/** Ação da ficha pela linha "Execução". */
export function acaoDe(execucao) {
  const e = norm(execucao);
  if (/^reacao/.test(e)) return "reacao";
  if (/^acao bonus$/.test(e)) return "bonus";
  if (/^acao bonus/.test(e) && !/1 acao/.test(e)) return "bonus";
  return "padrao";
}

/** Rótulo curto da execução para listas ("1 Ação", "Ação Bônus", "Reação", "10 minutos"…). */
export function execucaoCurta(execucao) {
  const e = String(execucao ?? "").trim();
  if (/^rea[cç][aã]o/i.test(e)) return "Reação";
  const cortado = e.replace(/\s*\(.*$/, "");
  return cortado.length > 22 ? "Várias" : cortado;
}

/** Ação do filtro: "acao", "bonus", "acaoBonus", "reacao", "longa". */
export function tipoExecucao(execucao) {
  const e = norm(execucao);
  if (/^reacao/.test(e)) return "reacao";
  if (/^acao bonus \(|ou 1 acao/.test(e)) return "varias";
  if (/^1 acao \+ acao bonus/.test(e)) return "acaoBonus";
  if (/^acao bonus/.test(e)) return "bonus";
  if (/^1 acao/.test(e)) return "acao";
  return "longa";
}
export const EXECUCOES = { acao: "1 Ação", bonus: "Ação Bônus", acaoBonus: "1 Ação + Ação Bônus", reacao: "Reação", varias: "Várias execuções", longa: "Minutos ou mais" };

const PERICIA_RES = [["reflexo", "reflexos"], ["fortitude", "fortitude"], ["vontade", "vontade"]];

/** Tipo de dano (rótulo da ficha) citado num trecho: "Gelo" → "Frio", "Raio" → "Relâmpago", "Luz" → "Radiante". */
/** "raio de 6 m" é área, não o tipo Raio (Relâmpago). */
const semRaioDeArea = t => t.replace(/ raio de \d+/g, " ").replace(/ (?:num|em um|no) raio /g, " ");
export function tipoDanoNoTexto(trecho) {
  const t = semRaioDeArea(` ${norm(trecho).replace(/[^a-z0-9]+/g, " ")} `);
  let melhor = null;
  for (const tipo of TIPOS_DANO) {
    if (tipo.extra || tipo.grupo === "tecnologicos") continue;
    for (const nome of [tipo.label, ...(tipo.aliases ?? [])]) {
      const n = norm(nome).replace(/[^a-z0-9]+/g, " ").trim();
      if (!n) continue;
      const i = t.search(new RegExp(` ${n}s? `));
      if (i >= 0 && (melhor === null || i < melhor.i)) melhor = { i, label: tipo.label };
    }
  }
  return melhor?.label ?? "";
}

/** Todos os tipos de dano (rótulos da ficha) citados em frases que falam de dano, para o filtro. */
export function tiposDanoGrimorio(m) {
  const frases = [...(m.mecanica ?? []), ...String(m.texto ?? "").split(/(?<=[.;:])\s+|\n/)].filter(f => /dano/i.test(f));
  const tipos = new Set();
  for (const f of frases) {
    const t = semRaioDeArea(` ${norm(f).replace(/[^a-z0-9]+/g, " ")} `);
    for (const tipo of TIPOS_DANO) {
      if (tipo.extra || tipo.grupo === "tecnologicos") continue;
      if ([tipo.label, ...(tipo.aliases ?? [])].some(n => { const x = norm(n).replace(/[^a-z0-9]+/g, " ").trim(); return x.length > 2 && t.includes(` ${x} `); })) tipos.add(tipo.label);
    }
  }
  return [...tipos];
}

/** Dano e teste lidos das linhas de Acerto/Dano e da Resistência. */
export function mecanicaGrimorio(m) {
  const linhas = m.mecanica ?? [];
  const teste = { tipo: "nenhum", pericia: "", nd: "" };
  if (linhas.some(l => /^Acerto:\s*Arcanismo/i.test(l) && /\bCA\b/.test(l))) Object.assign(teste, { tipo: "ataque", pericia: "arcanismo" });
  else {
    const res = norm(m.campos?.["Resistência"]);
    const p = PERICIA_RES.find(([k]) => res.includes(k));
    if (p) teste.tipo = "resistencia", teste.pericia = p[1];
  }
  const dano = { formula: "", tipo: "" };
  for (const l of linhas) {
    if (/^Cura/i.test(l)) continue;
    const corpo = l.replace(/^[^:]*:\s*/, "");
    const f = corpo.match(/(\d+d\d+(?:\s*\+\s*(?:\d+|N[uú]cleo)\b)*)/i);
    if (!f) continue;
    dano.formula = f[1].replace(/N[uú]cleo/gi, "@atr.nucleo").replace(/\s*\+\s*/g, " + ");
    const depois = corpo.slice(f.index + f[0].length).split(/[.;(]/)[0];
    dano.tipo = tipoDanoNoTexto(depois);
    break;
  }
  return { teste, dano };
}

/** Descrição completa (HTML) de uma magia do grimório. */
export function descricaoGrimorio(m) {
  const campos = Object.entries(m.campos ?? {}).filter(([k]) => k !== "Custo PM")
    .map(([k, v]) => `<strong>${esc(k)}:</strong> ${esc(v)}`).join("<br>");
  const asc = (m.ascensoes ?? []).map(a => `<li><strong>${esc(a.quando)}:</strong> ${inline(a.texto)}</li>`).join("");
  return `<p><em>${esc(m.escola)} · ${esc(m.rotulo)}</em></p><p>${campos}</p>${htmlGrimorio(m.texto)}`
    + (m.mecanica ?? []).map(l => `<p>${inline(l)}</p>`).join("")
    + (asc ? `<p><strong>Ascensão</strong></p><ul>${asc}</ul>` : "");
}

/** Dados de item "spell" do Foundry para uma magia do grimório. */
export function dadosMagiaGrimorio(m, { id = () => foundry.utils.randomID() } = {}) {
  const c = m.campos ?? {};
  const pm = Number(c["Custo PM"]) || 0;
  const { teste, dano } = mecanicaGrimorio(m);
  const asc = (m.ascensoes ?? []).map(a => `<li><strong>${esc(a.quando)}:</strong> ${inline(a.texto)}</li>`).join("");
  const forma = {
    ...formaPadrao(0, m.tipo === "ritual" ? "Ritual" : "Padrão"),
    acao: acaoDe(c["Execução"]),
    custo: pm ? { recurso: "pm", valor: pm } : { recurso: "nenhum", valor: 0 },
    alcance: c["Alcance"] ?? "", alvo: c["Alvo"] ?? c["Área ou Alvo"] ?? "", area: c["Área"] ?? "", duracao: c["Duração"] ?? "",
    teste, dano,
    efeito: `${c["Execução"] && acaoDe(c["Execução"]) === "padrao" && !/^1 a[cç][aã]o$/i.test(c["Execução"]) ? `<p><strong>Execução:</strong> ${esc(c["Execução"])}</p>` : ""}${htmlGrimorio(m.texto)}${(m.mecanica ?? []).map(l => `<p>${inline(l)}</p>`).join("")}${asc ? `<ul>${asc}</ul>` : ""}`
  };
  return {
    name: m.nome, type: "spell", img: iconeGrimorio(m),
    system: { level: Math.max(0, Math.min(6, Number(m.circulo) || 0)), description: { value: descricaoGrimorio(m) } },
    flags: { [FLAG]: {
      raridade: "comum", tema: m.escola, fonte: "Grimório de Magias", grimorio: m.id,
      ...(m.tipo === "ritual" ? { ritual: true } : {}),
      origemExterna: { site: "grimorio", url: GRIMORIO_URL },
      formas: { [id(`forma:0:${m.id}`)]: forma }
    } }
  };
}

/**
 * Registro no formato do botão "Copiar registro" (o mesmo do Códex do Vazio, que a ficha já sabe ler):
 *   Nome / Nível N · Escola / Custo: X PM · Ação / Alcance: … · Duração: … / texto / Efeito: …
 */
export function registroGrimorio(m) {
  const c = m.campos ?? {};
  const efeito = [...(m.mecanica ?? []), ...(m.ascensoes ?? []).map(a => `Ascensão — ${a.quando}: ${a.texto}`)].join("\n");
  const outros = Object.entries(c).filter(([k]) => !["Execução", "Custo PM", "Alcance", "Duração"].includes(k)).map(([k, v]) => `${k}: ${v}`);
  return [
    m.nome, `Nível ${m.circulo} · ${m.escola}`,
    `Custo: ${Number(c["Custo PM"]) || 0} PM · ${c["Execução"] ?? "1 Ação"}`,
    `Alcance: ${c["Alcance"] ?? "—"} · Duração: ${c["Duração"] ?? "—"}`,
    [...outros, "", String(m.texto ?? "").replace(/\*\*/g, "")].join("\n").trim(),
    efeito ? `Efeito: ${efeito}` : ""
  ].filter(x => x !== "").join("\n");
}
