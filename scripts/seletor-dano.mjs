/**
 * Seletor de tipo de dano: troca a lista nativa do navegador (que não rola e não cabia na tela)
 * por uma lista própria, com rolagem, agrupada (Físicos, Elementais…) e com os níveis em botões.
 * Vale para qualquer campo da ficha cuja <datalist> tenha os tipos de dano.
 * Corrupção não tem níveis.
 */
import { TIPOS_DANO, GRUPOS_DANO, NIVEIS_DANO } from "./config.mjs";
import { normalizarTexto } from "./data.mjs";

const SEM_NIVEL = new Set(["corrupcao"]);
const TIPO_POR_LABEL = new Map(TIPOS_DANO.map(t => [normalizarTexto(t.label), t]));
const GRUPO_LABELS = new Set(Object.values(GRUPOS_DANO).map(normalizarTexto));
let caixa = null;
let campo = null;

/** O texto sem o nível: "Fogo (Mágico)" → "Fogo". */
function semNivel(texto) {
  let t = String(texto ?? "");
  for (const n of NIVEIS_DANO) t = t.replace(new RegExp(`\\s*\\(?\\b${n.label}\\b\\)?`, "i"), "");
  return t.trim();
}
function nivelDe(texto) {
  const t = normalizarTexto(texto);
  return NIVEIS_DANO.slice(1).find(n => t.includes(normalizarTexto(n.label)))?.id ?? "natural";
}
function comNivel(base, nivelId) {
  const n = NIVEIS_DANO.find(x => x.id === nivelId);
  const b = semNivel(base);
  if (!b || !n || n.id === "natural") return b;
  if (SEM_NIVEL.has(normalizarTexto(b))) return b;
  return `${b} (${n.label})`;
}

function opcoesDaLista(input) {
  const lista = document.getElementById(input.dataset.epmLista ?? "");
  return lista ? [...lista.querySelectorAll("option")].map(o => o.value).filter(Boolean) : [];
}

function eListaDeDano(dl) {
  return !!dl && [...dl.querySelectorAll("option")].some(o => o.value === TIPOS_DANO[0].label);
}

function fechar() {
  if (campo) delete campo.dataset.epmNivel;
  caixa?.remove();
  caixa = null;
  campo = null;
}

function aplicar(valor) {
  if (!campo) return;
  campo.value = valor;
  campo.dispatchEvent(new Event("input", { bubbles: true }));
  campo.dispatchEvent(new Event("change", { bubbles: true }));
}

function posicionar() {
  if (!caixa || !campo) return;
  const r = campo.getBoundingClientRect();
  const largura = Math.max(r.width, 260);
  const abaixo = window.innerHeight - r.bottom - 8;
  const acima = r.top - 8;
  const altura = Math.min(340, Math.max(abaixo, acima));
  caixa.style.width = `${largura}px`;
  caixa.style.left = `${Math.min(r.left, window.innerWidth - largura - 8)}px`;
  caixa.style.maxHeight = `${Math.max(140, altura)}px`;
  if (abaixo >= 200 || abaixo >= acima) { caixa.style.top = `${r.bottom + 2}px`; caixa.style.bottom = ""; }
  else { caixa.style.bottom = `${window.innerHeight - r.top + 2}px`; caixa.style.top = ""; }
}

function desenhar() {
  if (!caixa || !campo) return;
  const filtro = normalizarTexto(semNivel(campo.value));
  const nivel = campo.dataset.epmNivel ?? nivelDe(campo.value);
  const todas = opcoesDaLista(campo);
  const casa = v => !filtro || normalizarTexto(v).includes(filtro);
  const grupos = Object.entries(GRUPOS_DANO).map(([gid, label]) => ({
    label, itens: TIPOS_DANO.filter(t => t.grupo === gid && todas.includes(t.label) && casa(t.label))
  })).filter(g => g.itens.length);
  const gruposInteiros = todas.filter(v => GRUPO_LABELS.has(normalizarTexto(v)) && casa(v));
  const outros = todas.filter(v => !TIPO_POR_LABEL.has(normalizarTexto(v)) && !GRUPO_LABELS.has(normalizarTexto(v)) && casa(v));
  const botao = (valor, rotulo, titulo = "") => `<button type="button" class="epm-sd-op" data-valor="${valor.replace(/"/g, "&quot;")}" title="${titulo.replace(/"/g, "&quot;")}">${rotulo}</button>`;
  caixa.innerHTML = `
    <div class="epm-sd-niveis" title="Nível do dano (resistência, imunidade e RD só seguram até o nível delas). Corrupção não tem nível.">
      ${NIVEIS_DANO.map(n => `<button type="button" class="epm-sd-nivel${n.id === nivel ? " ativo" : ""}" data-nivel="${n.id}">${n.label}</button>`).join("")}
    </div>
    <div class="epm-sd-lista">
      ${grupos.map(g => `<div class="epm-sd-grupo"><span>${g.label}</span>${g.itens.map(t => botao(t.label, t.label, t.desc)).join("")}</div>`).join("")}
      ${gruposInteiros.length ? `<div class="epm-sd-grupo"><span>Grupos inteiros</span>${gruposInteiros.map(v => botao(v, v, "Vale para todos os tipos do grupo")).join("")}</div>` : ""}
      ${outros.length ? `<div class="epm-sd-grupo"><span>Outros</span>${outros.map(v => botao(v, v)).join("")}</div>` : ""}
      ${!grupos.length && !gruposInteiros.length && !outros.length ? `<p class="epm-sd-vazio">Nada com "${campo.value.replace(/</g, "&lt;")}". Tecle Enter para usar o texto.</p>` : ""}
    </div>`;
  posicionar();
}

function abrir(input) {
  if (campo === input && caixa) return desenhar();
  fechar();
  campo = input;
  caixa = document.createElement("div");
  caixa.className = "epm-seletor-dano";
  // Mantém o foco no campo ao clicar na lista
  caixa.addEventListener("mousedown", ev => ev.preventDefault());
  caixa.addEventListener("click", ev => {
    const nv = ev.target.closest("[data-nivel]");
    if (nv) {
      const base = semNivel(campo.value);
      campo.dataset.epmNivel = nv.dataset.nivel;
      // Com um tipo já escrito, troca o nível na hora; vazio, só guarda para o próximo clique
      if (base && !campo.dataset.tagCampo) aplicar(comNivel(base, nv.dataset.nivel));
      else if (base) campo.value = comNivel(base, nv.dataset.nivel);
      return desenhar();
    }
    const op = ev.target.closest("[data-valor]");
    if (!op) return;
    const nivel = campo.dataset.epmNivel ?? nivelDe(campo.value);
    const eDano = TIPO_POR_LABEL.has(normalizarTexto(op.dataset.valor)) || GRUPO_LABELS.has(normalizarTexto(op.dataset.valor));
    aplicar(eDano ? comNivel(op.dataset.valor, nivel) : op.dataset.valor);
    fechar();
    // Campos de etiqueta (Resistências…) limpam sozinhos depois de adicionar
  });
  document.body.append(caixa);
  desenhar();
}

/** Liga o seletor em todo o documento (uma vez). */
export function registrarSeletorDano() {
  if (registrarSeletorDano.feito) return;
  registrarSeletorDano.feito = true;
  document.addEventListener("focusin", ev => {
    const el = ev.target;
    if (el?.tagName !== "INPUT" || el.type !== "text") return;
    if (!el.closest(".epm, .epm-dialogo")) return;
    // Primeira vez: tira a lista nativa e guarda o id
    if (!el.dataset.epmLista) {
      const dl = el.list;
      if (!eListaDeDano(dl)) return;
      el.dataset.epmLista = dl.id;
      el.removeAttribute("list");
      el.setAttribute("autocomplete", "off");
    }
    delete el.dataset.epmNivel;
    abrir(el);
  });
  // Clicar de novo no campo (já com foco) reabre a lista
  document.addEventListener("click", ev => {
    const el = ev.target;
    if (el?.tagName === "INPUT" && el.dataset?.epmLista && !caixa) abrir(el);
  });
  document.addEventListener("input", ev => {
    if (ev.target === campo) return desenhar();
    if (ev.target?.dataset?.epmLista && !caixa) abrir(ev.target);
  });
  document.addEventListener("focusout", ev => { if (ev.target === campo) setTimeout(() => { if (document.activeElement !== campo) fechar(); }, 120); });
  document.addEventListener("keydown", ev => { if (campo && ev.target === campo && (ev.key === "Escape" || ev.key === "Enter")) fechar(); }, true);
  window.addEventListener("resize", posicionar);
  document.addEventListener("scroll", ev => { if (caixa && !caixa.contains(ev.target)) posicionar(); }, true);
}

export { semNivel, nivelDe, comNivel };
