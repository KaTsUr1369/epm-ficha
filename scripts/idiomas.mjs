/**
 * Idiomas: a ficha guarda os idiomas no campo do dnd5e (system.traits.languages), que é o que o
 * módulo Polyglot lê. A lista de opções vem do Polyglot quando ele está ativo; senão, do D&D 5e.
 */
import { FLAG } from "./config.mjs";
import { normalizarTexto } from "./data.mjs";

export function polyglotAtivo() {
  return !!game.modules?.get("polyglot")?.active;
}

/** Achata a árvore de idiomas do dnd5e ({ standard: { label, children: {...} }, ... }). */
function achatarDnd5e(arvore, out = []) {
  for (const [key, v] of Object.entries(arvore ?? {})) {
    if (typeof v === "string") out.push({ key, label: game.i18n?.localize?.(v) ?? v });
    else if (v && typeof v === "object") {
      if (v.children) achatarDnd5e(v.children, out);
      else if (v.label) out.push({ key, label: game.i18n?.localize?.(v.label) ?? v.label });
    }
  }
  return out;
}

/** Lista de idiomas disponíveis: [{ key, label }]. */
export function catalogoIdiomas() {
  let lista = [];
  const provedor = polyglotAtivo() ? game.polyglot?.languageProvider : null;
  if (provedor?.languages && Object.keys(provedor.languages).length) {
    lista = Object.entries(provedor.languages).map(([key, l]) => ({ key, label: l?.label || key }));
  } else {
    try { lista = achatarDnd5e(CONFIG.DND5E?.languages ?? {}); } catch { lista = []; }
  }
  const vistos = new Set();
  return lista.filter(l => l.key && !vistos.has(l.key) && vistos.add(l.key))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

function lerAtuais(actor) {
  const langs = actor?.system?.traits?.languages ?? {};
  const valor = langs.value instanceof Set ? [...langs.value] : (Array.isArray(langs.value) ? [...langs.value] : []);
  const custom = String(langs.custom ?? "").split(";").map(t => t.trim()).filter(Boolean);
  return { valor, custom };
}

/** Acha um idioma do catálogo pelo nome ou pela chave (sem acento e sem caixa). */
export function acharIdioma(texto, catalogo = catalogoIdiomas()) {
  const alvo = normalizarTexto(texto);
  return catalogo.find(l => normalizarTexto(l.label) === alvo || normalizarTexto(l.key) === alvo) ?? null;
}

export async function adicionarIdioma(actor, texto) {
  const nome = String(texto ?? "").trim();
  if (!nome) return;
  const { valor, custom } = lerAtuais(actor);
  const achado = acharIdioma(nome);
  if (achado) {
    if (valor.includes(achado.key)) return;
    valor.push(achado.key);
    return actor.update({ "system.traits.languages.value": valor });
  }
  if (custom.some(c => normalizarTexto(c) === normalizarTexto(nome))) return;
  custom.push(nome);
  return actor.update({ "system.traits.languages.custom": custom.join("; ") });
}

export async function removerIdioma(actor, { chave = "", rotulo = "" } = {}) {
  const { valor, custom } = lerAtuais(actor);
  if (chave && valor.includes(chave)) {
    return actor.update({ "system.traits.languages.value": valor.filter(v => v !== chave) });
  }
  const resto = custom.filter(c => normalizarTexto(c) !== normalizarTexto(rotulo));
  return actor.update({ "system.traits.languages.custom": resto.join("; ") });
}

/**
 * Leva os idiomas guardados pela 0.2.x (flags.epm-ficha.idiomas, uma lista de textos)
 * para o campo do dnd5e. Devolve as atualizações (ou null se não houver nada).
 */
export function migrarIdiomas(actor) {
  const antigos = actor?.flags?.[FLAG]?.idiomas;
  if (!Array.isArray(antigos) || !antigos.length) return null;
  const catalogo = catalogoIdiomas();
  const { valor, custom } = lerAtuais(actor);
  for (const nome of antigos) {
    const achado = acharIdioma(nome, catalogo);
    if (achado) { if (!valor.includes(achado.key)) valor.push(achado.key); }
    else if (!custom.some(c => normalizarTexto(c) === normalizarTexto(nome))) custom.push(String(nome).trim());
  }
  return {
    "system.traits.languages.value": valor,
    "system.traits.languages.custom": custom.join("; "),
    [`flags.${FLAG}.idiomas`]: []
  };
}
