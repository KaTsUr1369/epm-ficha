/**
 * Busca na ficha inteira (0.8.23): um campo na barra de abas acha perícias, itens, habilidades, magias, treinos,
 * receitas, relações e criaturas de uma vez; clicar no resultado abre a aba e mostra onde está.
 */
import { LISTAS, textoDoItem, casa } from "./busca-lista.mjs";
import { escapar } from "./helpers.mjs";

const SELETORES = [...new Set([...Object.values(LISTAS).flatMap(c => c.itens.split(",").map(s => s.trim())), ".epm-criatura"])].join(", ");
const NOME = ".epm-item-titulo, .epm-poder-nome, .epm-pericia-nome, .epm-treino-nome, .epm-relacao-nome, h4, h3, strong";

/** Resultados para um termo: [{ el, tab, aba, nome }], no máximo `max`. */
export function buscarNaFicha(raiz, termo, max = 40) {
  if (!String(termo ?? "").trim()) return [];
  const rotulo = id => raiz.querySelector(`.epm-nav-item[data-tab="${id}"] span`)?.textContent?.trim() || id;
  const vistos = new Set();
  const out = [];
  for (const el of raiz.querySelectorAll(SELETORES)) {
    if (vistos.has(el) || el.closest(".epm-busca-global")) continue;
    vistos.add(el);
    const tab = (el.closest('.tab[data-group="primary"]') ?? el.closest(".tab.epm-aba[data-tab]"))?.dataset.tab;
    if (!tab || !casa(textoDoItem(el), termo)) continue;
    const nome = (el.querySelector(NOME)?.textContent ?? el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
    out.push({ el, tab, aba: rotulo(tab), nome });
    if (out.length >= max) break;
  }
  return out;
}

/** Põe o campo na barra de abas (a cada desenho) e liga a busca. */
export function ligarBuscaGlobal(app) {
  const raiz = app.element;
  const nav = raiz?.querySelector("nav.epm-nav");
  if (!nav || nav.querySelector(".epm-busca-global")) return;
  const caixa = document.createElement("div");
  caixa.className = "epm-busca-global";
  caixa.innerHTML = `<input type="search" placeholder="Buscar na ficha…" aria-label="Buscar na ficha inteira" value="${escapar(app._buscaGlobal ?? "")}"><ol class="epm-busca-global-res" hidden></ol>`;
  nav.append(caixa);
  const manual = document.createElement("button");
  manual.type = "button";
  manual.className = "epm-link epm-abrir-manual";
  manual.innerHTML = '<i class="fa-solid fa-book-open" aria-hidden="true"></i> Manual';
  manual.title = "Abrir o Manual da Ficha EPM (guias, regras rápidas e patch notes)";
  manual.addEventListener("click", async () => (await import("./conteudo-epm.mjs")).abrirManual());
  nav.append(manual);
  const input = caixa.querySelector("input");
  const lista = caixa.querySelector("ol");
  let resultados = [];
  const mostrar = () => {
    app._buscaGlobal = input.value;
    resultados = buscarNaFicha(raiz, input.value);
    lista.hidden = !input.value.trim();
    // A lista flutua por cima da ficha (a barra de abas é estreita e corta o que passa dela)
    const r = input.getBoundingClientRect();
    Object.assign(lista.style, { position: "fixed", left: `${r.left}px`, top: `${r.bottom + 2}px`, width: "320px" });
    lista.innerHTML = resultados.length
      ? resultados.map((r, i) => `<li><button type="button" data-i="${i}"><span class="epm-busca-global-aba">${escapar(r.aba)}</span> ${escapar(r.nome)}</button></li>`).join("")
      : `<li class="epm-vazio">Nada encontrado.</li>`;
  };
  input.addEventListener("input", mostrar);
  input.addEventListener("keydown", ev => { if (ev.key === "Escape") { input.value = ""; mostrar(); } if (ev.key === "Enter") { ev.preventDefault(); lista.querySelector("button")?.click(); } });
  input.addEventListener("change", ev => ev.stopPropagation(), { capture: true });
  lista.addEventListener("click", ev => {
    const b = ev.target.closest("button[data-i]");
    const r = b ? resultados[Number(b.dataset.i)] : null;
    if (!r) return;
    raiz.querySelector(`.epm-nav-item[data-tab="${r.tab}"]`)?.click();
    // Sub-aba escondida: abre a que contém o resultado
    const sub = r.el.closest('.tab[data-group]:not([data-group="primary"])');
    if (sub?.dataset?.tab) raiz.querySelector(`.epm-subnav-item[data-group="${sub.dataset.group}"][data-tab="${sub.dataset.tab}"]`)?.click();
    setTimeout(() => {
      const alvo = r.el.isConnected ? r.el : null;
      alvo?.scrollIntoView({ block: "center", behavior: "smooth" });
      alvo?.classList.add("epm-busca-achado");
      setTimeout(() => alvo?.classList.remove("epm-busca-achado"), 1800);
    }, 120);
    lista.hidden = true;
  });
  if (input.value) mostrar();
}
