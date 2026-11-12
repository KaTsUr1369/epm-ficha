/**
 * Importar magias do Codex do Vazio em português (pf2srd.com.br/magias).
 * Tenta buscar a página direto; se o navegador bloquear (o site não autoriza outros endereços), aceita o texto colado.
 * O texto da página é lido pelos rótulos (Tradições, Execução, Distância, Alvos, Área, Duração, Teste de Resistência…)
 * e vira uma magia EPM com uma forma.
 */
import { FLAG } from "./config.mjs";
import { novoId, formaPadrao, normalizarTexto } from "./data.mjs";
import { escapar } from "./helpers.mjs";
import { criarPoder } from "./mecanicas.mjs";
import { custoMagiaCirculo } from "./arquetipos.mjs";
import { formulario } from "./mundo.mjs";

export const SITE_MAGIAS = "https://pf2srd.com.br/magias";
const ROTULOS = ["Tradições", "Tradição", "Execução", "Conjuração", "Distância", "Alcance", "Alvos", "Alvo", "Área", "Duração",
  "Teste de Resistência", "Defesa", "Gatilho", "Requisitos", "Custo", "Fonte"];

/** "Bola de Fogo" → "bola-de-fogo"; um endereço completo é aceito como está. */
export function enderecoDaMagia(texto) {
  const t = String(texto ?? "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t.split(/[?#]/)[0];
  const slug = normalizarTexto(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug ? `${SITE_MAGIAS}/${slug}` : "";
}

/** Texto legível de um HTML (blocos viram linhas). */
export function textoDoHtml(html) {
  const doc = new DOMParser().parseFromString(String(html ?? ""), "text/html");
  doc.querySelectorAll("script, style, nav, header, footer, noscript").forEach(e => e.remove());
  const raiz = doc.querySelector("main, article") ?? doc.body;
  raiz.querySelectorAll("br").forEach(b => b.replaceWith("\n"));
  raiz.querySelectorAll("p, div, li, h1, h2, h3, h4, h5, tr, dt, dd").forEach(e => e.append("\n"));
  return raiz.textContent.replace(/ /g, " ").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

/** Lê o texto de uma magia do PF2 SRD (puro). */
export function lerMagiaPf2(texto) {
  const linhas = String(texto ?? "").split(/\n/).map(l => l.replace(/\*\*/g, "").trim()).filter(Boolean);
  const out = { nome: "", tipo: "Magia", nivel: 1, tracos: [], campos: {}, descricao: [], elevadas: [], fonte: "" };
  const reRotulo = new RegExp(`^(${ROTULOS.join("|")})\\s*:?\\s*(.*)$`, "i");
  const reNivel = /^(Truque Mágico|Truque|Magia|Foco|Ritual)\s+(\d+)\b/i;
  const reElevada = /^((?:Elevada|Intensificad[ao])\s*\(([^)]*)\))\s*:?\s*(.*)$/i;
  let i = 0;
  // Nome: primeira linha que não é o próprio título do site
  while (i < linhas.length && /^(magias?|pf2 ?srd|início|voltar)$/i.test(linhas[i])) i++;
  out.nome = linhas[i] ?? "";
  // A linha de nível pode vir junto do nome ("Luz Truque Mágico 0")
  const juntos = out.nome.match(/^(.*?)\s+(Truque Mágico|Magia|Foco|Ritual)\s+(\d+)$/i);
  if (juntos) { out.nome = juntos[1]; out.tipo = juntos[2]; out.nivel = Number(juntos[3]); }
  for (i = i + 1; i < linhas.length; i++) {
    const l = linhas[i];
    let m;
    if ((m = l.match(reNivel)) && !out.tracos.length && !Object.keys(out.campos).length) { out.tipo = m[1]; out.nivel = Number(m[2]); continue; }
    if ((m = l.match(reElevada))) { out.elevadas.push({ rotulo: m[2], texto: m[3] }); continue; }
    if ((m = l.match(reRotulo))) {
      const chave = normalizarTexto(m[1]).replace(/\s+/g, "");
      if (chave === "fonte") out.fonte = m[2];
      else out.campos[chave] = m[2];
      continue;
    }
    if (!out.tracos.length && !Object.keys(out.campos).length && !out.descricao.length && /,/.test(l) && l.length < 160) {
      out.tracos = l.split(",").map(t => t.trim()).filter(Boolean);
      continue;
    }
    if (/^(fonte|licença|ogl|orc)\b/i.test(l)) break;
    out.descricao.push(l);
  }
  if (/truque/i.test(out.tipo)) out.nivel = 0;
  return out;
}

const PERICIA_RESISTENCIA = { reflexos: "acrobacia", fortitude: "fortitude", vontade: "vontade" };

/** Magia lida → dados do item EPM (spell). `conjurador` = cobra PM pelo círculo. */
export function dadosMagiaEpm(m, { url = "", conjurador = true } = {}) {
  const c = m.campos;
  const forma = formaPadrao(0, "Padrão");
  const exec = normalizarTexto(c.execucao ?? c.conjuracao ?? "");
  forma.acao = /reac/.test(exec) ? "reacao" : /livre/.test(exec) ? "livre" : /(2|duas|3|tres) ac/.test(exec) ? "padrao" : "padrao";
  forma.requisitos.verbal = /verbal/.test(exec);
  forma.requisitos.gestual = /somatic|gestual/.test(exec);
  forma.alcance = c.distancia ?? c.alcance ?? "";
  forma.alvo = c.alvos ?? c.alvo ?? "";
  forma.area = c.area ?? "";
  forma.duracao = c.duracao ?? "";
  const res = normalizarTexto(c.testederesistencia ?? c.defesa ?? "");
  const per = Object.entries(PERICIA_RESISTENCIA).find(([k]) => res.includes(k))?.[1];
  if (per) forma.teste = { tipo: "resistencia", pericia: per, nd: "" };
  else if (/ataque/.test(normalizarTexto(m.descricao.join(" ")))) forma.teste = { tipo: "ataque", pericia: "arcanismo", nd: "" };
  const dano = m.descricao.join(" ").match(/(\d+d\d+(?:\s*\+\s*\d+)?)\s+(?:pontos\s+)?de\s+dano\s+(?:de\s+)?([a-zà-ú]+)/i);
  if (dano) forma.dano = { formula: dano[1].replace(/\s+/g, " "), tipo: dano[2][0].toUpperCase() + dano[2].slice(1) };
  forma.efeito = `<p>${m.descricao.map(escapar).join("</p><p>")}</p>`;
  const circulo = Math.max(0, Math.min(9, Number(m.nivel) || 0));
  if (conjurador) { const pm = custoMagiaCirculo(circulo); if (pm) forma.custo = { recurso: "pm", valor: pm }; }
  const campos = Object.entries({ "Tradições": c.tradicoes ?? c.tradicao, "Execução": c.execucao ?? c.conjuracao, "Distância": forma.alcance, "Alvos": forma.alvo,
    "Área": forma.area, "Duração": forma.duracao, "Teste de Resistência": c.testederesistencia ?? c.defesa, "Gatilho": c.gatilho, "Requisitos": c.requisitos, "Custo": c.custo })
    .filter(([, v]) => v).map(([k, v]) => `<p><strong>${k}:</strong> ${escapar(v)}</p>`).join("");
  const descricao = `<p><em>${escapar(m.tipo)} ${m.nivel}${m.tracos.length ? ` · ${escapar(m.tracos.join(", "))}` : ""}</em></p>${campos}
    ${m.descricao.map(l => `<p>${escapar(l)}</p>`).join("")}
    ${m.elevadas.map(e => `<p><strong>Elevada (${escapar(e.rotulo)}):</strong> ${escapar(e.texto)}</p>`).join("")}
    <p class="epm-dica">Importada do Codex do Vazio${m.fonte ? ` (${escapar(m.fonte)})` : ""}${url ? ` — <a href="${escapar(url)}" target="_blank" rel="noopener">${escapar(url)}</a>` : ""}. Revise custo, ação e dano para as regras do EPM.</p>`;
  return {
    name: m.nome || "Magia importada", type: "spell", img: "icons/svg/lightning.svg",
    system: { level: circulo, description: { value: descricao } },
    flags: { [FLAG]: { formas: { [novoId()]: forma }, usos: { valor: 0, max: 0, recarga: "nenhuma" }, raridade: "comum", origemExterna: { site: "pf2srd", url } } }
  };
}

/** Tenta baixar a página; null se o navegador bloquear. */
async function baixar(url) {
  try {
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

/** Diálogo: nomes ou endereços (um por linha) ou o texto copiado da página. */
export async function importarMagias(actor) {
  const r = await formulario("Importar magias do Codex do Vazio", `
    <p class="epm-dica">Do Codex do Vazio (<a href="${SITE_MAGIAS}" target="_blank" rel="noopener">pf2srd.com.br/magias</a>). Escreva o nome ou cole o endereço (uma magia por linha).
    Se o navegador não deixar buscar a página, abra a magia no site, selecione o texto dela (do nome até a Fonte), copie e cole na caixa de baixo.</p>
    <label class="epm-campo"><span>Nomes ou endereços</span><textarea name="lista" rows="3" placeholder="Luz&#10;https://pf2srd.com.br/magias/bola-de-fogo"></textarea></label>
    <label class="epm-campo"><span>Ou o texto copiado de uma magia</span><textarea name="texto" rows="6"></textarea></label>
    <label class="epm-check"><input type="checkbox" name="pm" checked> Cobrar a Mana pelo círculo (Conjurador)</label>`, { botao: "Importar", largura: 620 });
  if (!r) return;
  const itens = [];
  const falhas = [];
  if (String(r.texto ?? "").trim()) itens.push(dadosMagiaEpm(lerMagiaPf2(r.texto), { conjurador: !!r.pm }));
  for (const linha of String(r.lista ?? "").split("\n").map(t => t.trim()).filter(Boolean)) {
    const url = enderecoDaMagia(linha);
    const html = url ? await baixar(url) : null;
    if (!html) { falhas.push(linha); continue; }
    const m = lerMagiaPf2(textoDoHtml(html));
    if (!m.nome || !m.descricao.length) { falhas.push(linha); continue; }
    itens.push(dadosMagiaEpm(m, { url, conjurador: !!r.pm }));
  }
  let criadas = 0;
  for (const dados of itens) if (await criarPoder(actor, { tipo: "magia", raridade: "comum", aquisicao: "gratis", dadosBase: dados })) criadas++;
  if (criadas) ui.notifications.info(`${criadas} magia(s) importada(s). Confira o custo, a ação e o dano no editor.`);
  if (falhas.length) {
    ui.notifications.warn(`Não consegui buscar: ${falhas.join(", ")}. O site pode estar bloqueando o acesso direto; copie o texto da magia e cole na caixa de texto.`, { permanent: true });
  }
}
