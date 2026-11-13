/**
 * Dica ao passar o mouse nos itens dos compêndios (e na aba Itens): mostra o resumo guardado em
 * flags.epm-ficha.resumo (o que o item faz, preço, peso e raridade). Vale para os compêndios do EPM e
 * para qualquer item que tenha esse resumo.
 */
import { FLAG } from "./config.mjs";
import { escapar } from "./helpers.mjs";

const CAMPO = `flags.${FLAG}.resumo`;

/** HTML da dica (pura, para teste). */
export function htmlDica(nome, resumo) {
  const [corpo, ...resto] = String(resumo ?? "").split("\n");
  return `<div class="epm-dica-item"><strong>${escapar(nome)}</strong>${corpo ? `<p>${escapar(corpo)}</p>` : ""}${resto.length ? `<p class="epm-dica-item-rodape">${escapar(resto.join(" · "))}</p>` : ""}</div>`;
}

function marcar(raiz, porId) {
  for (const li of raiz.querySelectorAll("[data-entry-id], [data-document-id]")) {
    const id = li.dataset.entryId ?? li.dataset.documentId;
    const e = porId(id);
    const resumo = e?.flags?.[FLAG]?.resumo;
    if (!resumo) continue;
    li.dataset.tooltip = htmlDica(e.name, resumo);
    li.dataset.tooltipDirection ??= "RIGHT";
    li.dataset.tooltipClass = "epm-dica-tooltip";
  }
}

async function aoAbrirCompendio(app, html) {
  try {
    const pack = app?.collection ?? app?.pack;
    if (!pack || pack.documentName !== "Item") return;
    const indice = await pack.getIndex({ fields: [CAMPO] });
    const raiz = html instanceof HTMLElement ? html : html?.[0] ?? app.element;
    if (raiz) marcar(raiz, id => indice.get(id));
  } catch (err) { console.warn("EPM | dica do compêndio", err); }
}

function aoAbrirItens(app, html) {
  try {
    const raiz = html instanceof HTMLElement ? html : html?.[0] ?? app?.element;
    if (raiz) marcar(raiz, id => game.items?.get(id));
  } catch (err) { console.warn("EPM | dica dos itens", err); }
}

export function registrarDicasCompendio() {
  Hooks.on("renderCompendium", aoAbrirCompendio);
  Hooks.on("renderItemDirectory", aoAbrirItens);
}
