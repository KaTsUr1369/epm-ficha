/**
 * Criar uma habilidade a partir de um texto colado, no formato dos documentos do EPM:
 *
 *   O Legado do Errante
 *   Tipo: Ofensiva / Especial
 *   Tema: Liberdade, estratégia…
 *   (texto de abertura)
 *   1. A Fortuna do Estrategista
 *   Custo: 5 PE
 *   Ação: Ação Bônus
 *   Duração: 3 rodadas
 *   Uso: Uma vez por combate
 *   (efeito)
 *   2. …
 *
 * Cada parte numerada vira uma forma (com custo, ação, duração, alcance, alvo, área e limite de uso);
 * o resto do texto da parte vira o efeito. Sem partes numeradas, o texto todo vira uma forma só.
 */
import { FLAG, ACOES, CUSTO_RECURSOS, USOS_FORMA } from "./config.mjs";
import { formaPadrao, normalizarTexto } from "./data.mjs";

const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Linhas soltas → HTML (parágrafos; linhas com "-" ou "•" viram lista). */
export function textoParaHtml(linhas) {
  const out = [];
  let lista = null, par = [];
  const fecharPar = () => { if (par.length) out.push(`<p>${esc(par.join(" "))}</p>`); par = []; };
  const fecharLista = () => { if (lista) out.push(`<ul>${lista.map(l => `<li>${esc(l)}</li>`).join("")}</ul>`); lista = null; };
  for (const bruta of linhas) {
    const l = bruta.trim();
    if (!l) { fecharPar(); fecharLista(); continue; }
    const item = l.match(/^[-•*–]\s+(.*)$/);
    if (item) { fecharPar(); (lista ??= []).push(item[1]); continue; }
    fecharLista();
    // Cada linha do texto colado é um parágrafo (os documentos já vêm quebrados assim)
    par.push(l); fecharPar();
  }
  fecharPar(); fecharLista();
  return out.join("");
}

function acaoDe(t) {
  const n = normalizarTexto(t);
  for (const [id, a] of Object.entries(ACOES)) if (n === normalizarTexto(a.label) || n === normalizarTexto(a.curto)) return id;
  if (/bonus/.test(n)) return "bonus";
  if (/reac/.test(n)) return "reacao";
  if (/moviment/.test(n)) return "movimento";
  if (/livre/.test(n)) return "livre";
  if (/passiv/.test(n)) return "passiva";
  if (/lendari/.test(n)) return "lendaria";
  if (/mitic/.test(n)) return "mitica";
  if (/arcaic/.test(n)) return "arcaica";
  return "padrao";
}

function custoDe(t) {
  const n = normalizarTexto(t);
  const valor = Number(n.match(/\d+/)?.[0] ?? 0);
  let recurso = "nenhum";
  for (const [id, c] of Object.entries(CUSTO_RECURSOS)) if (c.sigla && new RegExp(`\\b${c.sigla.toLowerCase()}\\b`).test(n)) recurso = id;
  if (recurso === "nenhum" && /mana/.test(n)) recurso = "pm";
  if (recurso === "nenhum" && /estamina|vigor/.test(n)) recurso = "pe";
  return { recurso: valor ? recurso : "nenhum", valor: recurso === "nenhum" ? 0 : valor };
}

function usoDe(t) {
  const n = normalizarTexto(t);
  if (/combate/.test(n)) return "combate";
  if (/cena/.test(n)) return "cena";
  if (/descanso curto/.test(n)) return "curto";
  if (/descanso longo|descanso/.test(n)) return "longo";
  if (/dia/.test(n)) return "dia";
  return "livre";
}

const CAMPOS = { custo: "custo", acao: "acao", "ação": "acao", duracao: "duracao", "duração": "duracao", uso: "uso", usos: "uso", alcance: "alcance", alvo: "alvo", alvos: "alvo", area: "area", "área": "area" };

/** Lê o texto e devolve { nome, tipoHab, tema, descricao (HTML), formas: [{…forma}] }. */
export function lerHabilidadeTexto(texto) {
  const linhas = String(texto ?? "").replace(/\r/g, "").split("\n");
  while (linhas.length && !linhas[0].trim()) linhas.shift();
  const nome = (linhas.shift() ?? "").trim().replace(/^#+\s*/, "") || "Nova habilidade";
  let tipoHab = "", tema = "";
  const abertura = [];
  const partes = [];
  let atual = null;
  for (const bruta of linhas) {
    const l = bruta.trim();
    const num = l.match(/^(\d+)\s*[.)\-–]\s+(.+)$/);
    if (num) { atual = { nome: num[2].trim(), campos: {}, texto: [] }; partes.push(atual); continue; }
    const campo = l.match(/^([A-Za-zÀ-ÿ]+)\s*:\s*(.+)$/);
    const chave = campo ? normalizarTexto(campo[1]) : "";
    if (!atual && campo && chave === "tipo") { tipoHab = campo[2].trim(); continue; }
    if (!atual && campo && chave === "tema") { tema = campo[2].trim(); continue; }
    if (atual && campo && CAMPOS[chave] && !atual.texto.some(t => t.trim())) { atual.campos[CAMPOS[chave]] = campo[2].trim(); continue; }
    (atual ? atual.texto : abertura).push(bruta);
  }
  // Sem partes numeradas: o texto todo é uma forma só
  if (!partes.length) {
    const unica = { nome, campos: {}, texto: [] };
    const resto = [];
    for (const l of abertura) {
      const campo = l.trim().match(/^([A-Za-zÀ-ÿ]+)\s*:\s*(.+)$/);
      const chave = campo ? normalizarTexto(campo[1]) : "";
      if (campo && CAMPOS[chave]) unica.campos[CAMPOS[chave]] = campo[2].trim(); else resto.push(l);
    }
    unica.texto = resto;
    partes.push(unica);
    abertura.length = 0;
  }
  const formas = partes.map((p, i) => {
    const c = p.campos;
    const custo = c.custo ? custoDe(c.custo) : { recurso: "nenhum", valor: 0 };
    return {
      ...formaPadrao(i, p.nome),
      acao: c.acao ? acaoDe(c.acao) : "padrao",
      custo, duracao: c.duracao ?? "", alcance: c.alcance ?? "", alvo: c.alvo ?? "", area: c.area ?? "",
      uso: c.uso ? usoDe(c.uso) : "livre",
      efeito: textoParaHtml(p.texto)
    };
  });
  return { nome, tipoHab, tema, descricao: textoParaHtml(abertura), formas };
}

/** Dados de um item "feat" do Foundry com a habilidade lida. `id(texto)` gera os ids das formas. */
export function dadosHabilidadeTexto(texto, { id = () => foundry.utils.randomID(), extra = {} } = {}) {
  const h = lerHabilidadeTexto(texto);
  const cab = [h.tipoHab ? `<p><strong>Tipo:</strong> ${esc(h.tipoHab)}</p>` : "", h.tema ? `<p><strong>Tema:</strong> ${esc(h.tema)}</p>` : ""].join("");
  return {
    name: h.nome, type: "feat", img: "icons/svg/book.svg",
    system: { description: { value: cab + h.descricao } },
    flags: { [FLAG]: {
      raridade: "comum", tipoHab: h.tipoHab, tema: h.tema, ...extra,
      formas: Object.fromEntries(h.formas.map((f, i) => [id(`forma:${i}:${f.nome}`), f]))
    } }
  };
}

export { USOS_FORMA };
