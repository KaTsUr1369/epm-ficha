/**
 * Importa magias do Códex do Vazio (site de magias da mesa): o texto do botão "Copiar registro".
 * Um ou vários registros colados de uma vez viram magias da ficha, com círculo, custo, ação, alcance,
 * duração, escola (tema), teste e dano quando o texto diz. Só dados e contas puras.
 *
 * Formato do registro:
 *   Bolha Ácida
 *   Nível 0 · Abjuração
 *   Custo: 0 PM · 1 Ação
 *   Alcance: Pessoal · Duração: Instantânea
 *   (texto)
 *   Efeito: (texto)
 */
import { FLAG, TIPOS_DANO } from "./config.mjs";
import { formaPadrao } from "./data.mjs";

/** Endereço do Códex do Vazio (site de magias da mesa). */
export const CODEX_URL = "https://codex-do-vazio-rpg-g-ow5k.bolt.host/";

const norm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const LINHA_NIVEL = /^\s*n[ií]vel\s+(\d+)\s*[·•\-|]\s*(.+?)\s*$/i;

/** O texto parece registro(s) do Códex? (segunda linha "Nível N · Escola") */
export function eRegistroCodex(texto) {
  const l = String(texto ?? "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  return l.length >= 2 && LINHA_NIVEL.test(l[1]);
}

/** Separa vários registros: cada um começa num nome seguido da linha "Nível N · Escola". */
function separar(texto) {
  const linhas = String(texto ?? "").replace(/\r/g, "").split("\n");
  const inicios = [];
  for (let i = 0; i < linhas.length - 1; i++) {
    if (!linhas[i].trim() || /^=+$/.test(linhas[i].trim())) continue;
    let j = i + 1;
    while (j < linhas.length && !linhas[j].trim()) j++;
    if (j < linhas.length && LINHA_NIVEL.test(linhas[j])) inicios.push(i);
  }
  return inicios.map((ini, k) => linhas.slice(ini, inicios[k + 1] ?? linhas.length).join("\n").replace(/\n=+\s*$/, "").trim());
}

const ACOES_CODEX = [[/rea[cç][aã]o/, "reacao"], [/b[oô]nus/, "bonus"], [/movimento/, "movimento"], [/livre/, "livre"], [/completa/, "completa"], [/a[cç][aã]o/, "padrao"]];
const PERICIA_RES = { destreza: "reflexos", reflexos: "reflexos", fortitude: "fortitude", constituicao: "fortitude", vigor: "fortitude", vontade: "vontade", sabedoria: "vontade" };

/** Tipo de dano por uma palavra do texto ("ácido", "mental"…). */
function tipoDanoDe(palavra) {
  const p = norm(palavra).replace(/s$/, "");
  if (!p) return "";
  const t = TIPOS_DANO.find(x => norm(x.label).startsWith(p.slice(0, 5)) || (x.aliases ?? []).some(a => norm(a).startsWith(p.slice(0, 5))));
  return t?.label ?? "";
}

/** Dano e teste lidos do efeito/descrição. */
function lerMecanica(texto) {
  const t = String(texto ?? "");
  const dano = { formula: "", tipo: "" };
  const m = t.match(/(\d+d\d+(?:\s*\+\s*(?:\d+|N[uú]cleo))*)\s+(?:de\s+)?dano(?:\s+(?:de\s+)?([A-Za-zÀ-ÿ]+))?/i);
  if (m) {
    dano.formula = m[1].replace(/N[uú]cleo/gi, "@atr.nucleo").replace(/\s*\+\s*/g, " + ");
    dano.tipo = tipoDanoDe(m[2]);
  } else if (/dano\s+([A-Za-zÀ-ÿ]+)\s+igual\s+ao\s+seu\s+N[uú]cleo/i.test(t)) {
    dano.formula = "@atr.nucleo";
    dano.tipo = tipoDanoDe(t.match(/dano\s+([A-Za-zÀ-ÿ]+)\s+igual/i)[1]);
  }
  const teste = { tipo: "nenhum", pericia: "", nd: "" };
  const r = t.match(/teste de resist[eê]ncia de ([A-Za-zÀ-ÿ]+)/i);
  if (/teste de ataque m[aá]gico|rolagem de ataque m[aá]gico/i.test(t)) Object.assign(teste, { tipo: "ataque", pericia: "arcanismo" });
  else if (r && PERICIA_RES[norm(r[1])]) Object.assign(teste, { tipo: "resistencia", pericia: PERICIA_RES[norm(r[1])] });
  return { dano, teste };
}

/** Paragrafos em HTML (linhas "- " viram lista). */
function html(texto) {
  const blocos = String(texto ?? "").trim().split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  return blocos.map(b => {
    const ls = b.split("\n").map(x => x.trim()).filter(Boolean);
    if (ls.some(x => /^[-•]\s/.test(x))) {
      const fora = ls.filter(x => !/^[-•]\s/.test(x)), itens = ls.filter(x => /^[-•]\s/.test(x));
      return `${fora.length ? `<p>${esc(fora[0])}</p>` : ""}<ul>${itens.map(x => `<li>${esc(x.replace(/^[-•]\s*/, ""))}</li>`).join("")}</ul>${fora.slice(1).map(x => `<p>${esc(x)}</p>`).join("")}`;
    }
    return `<p>${ls.map(esc).join("<br>")}</p>`;
  }).join("");
}

/** Lê um registro: { nome, circulo, escola, custo, acao, alcance, duracao, descricao, efeito, dano, teste }. */
export function lerRegistroCodex(texto) {
  const linhas = String(texto ?? "").replace(/\r/g, "").split("\n");
  const nome = linhas.shift().trim();
  while (linhas.length && !linhas[0].trim()) linhas.shift();
  const nv = (linhas.shift() ?? "").match(LINHA_NIVEL);
  const out = { nome, circulo: Math.min(6, Math.max(0, Number(nv?.[1]) || 0)), escola: nv?.[2]?.trim() ?? "", custo: { recurso: "nenhum", valor: 0 }, acao: "padrao", alcance: "", duracao: "", descricao: "", efeito: "" };
  // Linhas de cabeçalho: "Custo: 0 PM · 1 Ação" e "Alcance: … · Duração: …"
  while (linhas.length && /^\s*(custo|alcance|dura[cç][aã]o|a[cç][aã]o)\s*:/i.test(linhas[0])) {
    for (const parte of linhas.shift().split(/\s*[·•]\s*/)) {
      const [chave, ...resto] = parte.split(":");
      const valor = resto.join(":").trim();
      const k = norm(chave);
      if (!valor) { // "1 Ação" sem rótulo
        const a = ACOES_CODEX.find(([re]) => re.test(norm(parte)));
        if (a) out.acao = a[1];
        continue;
      }
      if (k === "custo") {
        const c = valor.match(/(\d+)\s*(PM|PE|PV|PS)?/i);
        const sig = (c?.[2] ?? "PM").toLowerCase();
        out.custo = { recurso: Number(c?.[1]) ? sig : "nenhum", valor: Number(c?.[1]) || 0 };
      } else if (k === "alcance") out.alcance = valor;
      else if (k.startsWith("dura")) out.duracao = valor;
      else if (k.startsWith("acao")) { const a = ACOES_CODEX.find(([re]) => re.test(norm(valor))); if (a) out.acao = a[1]; }
    }
  }
  const corpo = linhas.join("\n").trim();
  const i = corpo.search(/^\s*Efeito\s*:/im);
  out.descricao = (i >= 0 ? corpo.slice(0, i) : corpo).trim();
  out.efeito = i >= 0 ? corpo.slice(i).replace(/^\s*Efeito\s*:\s*/i, "").trim() : "";
  Object.assign(out, lerMecanica(`${out.efeito}\n${out.descricao}`));
  return out;
}

/** Todos os registros do texto colado, já lidos. */
export function lerRegistrosCodex(texto) {
  return separar(texto).map(lerRegistroCodex).filter(r => r.nome);
}

/** Dados de item "spell" do Foundry para um registro lido. */
export function dadosMagiaCodex(r, { id = () => foundry.utils.randomID() } = {}) {
  const forma = {
    ...formaPadrao(0, r.nome),
    acao: r.acao, custo: r.custo, alcance: r.alcance, duracao: r.duracao,
    teste: r.teste, dano: r.dano,
    efeito: html(r.efeito || r.descricao)
  };
  return {
    name: r.nome, type: "spell", img: "icons/svg/explosion.svg",
    system: { level: r.circulo, description: { value: `${r.escola ? `<p><strong>Escola:</strong> ${esc(r.escola)}</p>` : ""}${html(r.descricao)}` } },
    flags: { [FLAG]: {
      raridade: "comum", tema: r.escola, fonte: "Códex do Vazio", codex: norm(r.nome).replace(/[^a-z0-9]+/g, "-"), origemExterna: { site: "codex", url: CODEX_URL },
      formas: { [id(`forma:0:${r.nome}`)]: forma }
    } }
  };
}
