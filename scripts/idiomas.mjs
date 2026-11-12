/**
 * Idiomas: a ficha guarda os idiomas no campo do dnd5e (system.traits.languages), que é o que o
 * módulo Polyglot lê. A lista de opções vem do Polyglot quando ele está ativo; senão, do D&D 5e.
 */
import { FLAG, IDIOMAS_EPM, IDIOMAS_PROIBIDOS } from "./config.mjs";
import { normalizarTexto } from "./data.mjs";

export function polyglotAtivo() {
  return !!game.modules?.get("polyglot")?.active;
}

/**
 * Lista de idiomas disponíveis: [{ key, label, proibido }]. Com o Polyglot, os idiomas dele (chave própria);
 * os do EPM que faltarem entram sem chave (ficam como idioma escrito). Sem Polyglot, a lista do EPM.
 * Os proibidos só aparecem para o Mestre.
 */
export function catalogoIdiomas({ incluirProibidos = !!game.user?.isGM } = {}) {
  let lista = [];
  const provedor = polyglotAtivo() ? game.polyglot?.languageProvider : null;
  if (provedor?.languages && Object.keys(provedor.languages).length) {
    lista = Object.entries(provedor.languages).map(([key, l]) => ({ key, label: l?.label || key }));
  }
  const tem = new Set(lista.map(l => normalizarTexto(l.label)));
  for (const nome of [...IDIOMAS_EPM, ...(incluirProibidos ? IDIOMAS_PROIBIDOS : [])]) {
    if (!tem.has(normalizarTexto(nome))) { lista.push({ key: "", label: nome }); tem.add(normalizarTexto(nome)); }
  }
  const proibidos = new Set(IDIOMAS_PROIBIDOS.map(normalizarTexto));
  const vistos = new Set();
  return lista.filter(l => incluirProibidos || !proibidos.has(normalizarTexto(l.label)))
    .map(l => ({ ...l, proibido: proibidos.has(normalizarTexto(l.label)) }))
    .filter(l => { const k = l.key || `t:${normalizarTexto(l.label)}`; return !vistos.has(k) && vistos.add(k); })
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export const idiomaProibido = nome => IDIOMAS_PROIBIDOS.some(p => normalizarTexto(p) === normalizarTexto(nome));

function lerAtuais(actor) {
  const langs = actor?.system?.traits?.languages ?? {};
  const valor = langs.value instanceof Set ? [...langs.value] : (Array.isArray(langs.value) ? [...langs.value] : []);
  const custom = String(langs.custom ?? "").split(";").map(t => t.trim()).filter(Boolean);
  return { valor, custom };
}

/** Acha um idioma do catálogo pelo nome ou pela chave (sem acento e sem caixa). */
export function acharIdioma(texto, catalogo = catalogoIdiomas()) {
  const alvo = normalizarTexto(texto);
  return catalogo.find(l => normalizarTexto(l.label) === alvo || (l.key && normalizarTexto(l.key) === alvo)) ?? null;
}

export async function adicionarIdioma(actor, texto) {
  const nome = String(texto ?? "").trim();
  if (!nome) return;
  if (idiomaProibido(nome) && !game.user?.isGM) return ui.notifications.warn(`${nome} não pode ser escolhido (só o Mestre concede).`);
  const { valor, custom } = lerAtuais(actor);
  const achado = acharIdioma(nome, catalogoIdiomas({ incluirProibidos: true }));
  if (achado?.key) {
    if (valor.includes(achado.key)) return;
    valor.push(achado.key);
    return actor.update({ "system.traits.languages.value": valor });
  }
  const rotulo = achado?.label ?? nome;
  if (custom.some(c => normalizarTexto(c) === normalizarTexto(rotulo))) return;
  custom.push(rotulo);
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
