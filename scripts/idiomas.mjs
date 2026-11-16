/**
 * Idiomas: a ficha guarda os idiomas no campo do dnd5e (system.traits.languages), que o provedor do
 * EPM no Polyglot lê (polyglot-epm.mjs). Com o Polyglot, a lista é só a dos idiomas do EPM.
 */
import { FLAG, IDIOMAS_EPM, IDIOMAS_PROIBIDOS } from "./config.mjs";
import { normalizarTexto } from "./data.mjs";
import { idiomasPolyglot } from "./polyglot-epm.mjs";

const slug = t => String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function polyglotAtivo() {
  return !!game.modules?.get("polyglot")?.active;
}

/**
 * Lista de idiomas disponíveis: [{ key, label, proibido }]. Só os idiomas do EPM (os do D&D 5e não aparecem).
 * Com o Polyglot usando o provedor do EPM, a chave é a dele; com outro provedor, a chave dele quando o nome bate.
 * Os proibidos só aparecem para o Mestre.
 */
export function catalogoIdiomas({ incluirProibidos = !!game.user?.isGM } = {}) {
  const provedor = polyglotAtivo() ? game.polyglot?.languageProvider : null;
  const nossos = idiomasPolyglot();
  const chavesProv = Object.keys(provedor?.languages ?? {});
  const nosso = chavesProv.length > 0 && chavesProv.every(k => nossos[k]);
  const doProvedor = nome => {
    if (nosso) return slug(nome);
    const alvo = normalizarTexto(nome);
    return chavesProv.find(k => normalizarTexto(provedor.languages[k]?.label ?? k) === alvo) ?? "";
  };
  const proibidos = new Set(IDIOMAS_PROIBIDOS.map(normalizarTexto));
  return [...IDIOMAS_EPM, ...(incluirProibidos ? IDIOMAS_PROIBIDOS : [])]
    .map(label => ({ key: polyglotAtivo() ? doProvedor(label) : "", label, proibido: proibidos.has(normalizarTexto(label)) }))
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
