/**
 * Maestria das armas Exóticas e Arma favorita (EPM/itens/mudancas-itens.md, seções 10 e 11).
 *
 * A Maestria Exótica se libera (o que vier primeiro):
 *  - com 10 pontos colocados na perícia da arma (Luta ou Pontaria), sem atributo nem "Outros";
 *    15 pontos se a arma for de outra região que não a de origem do personagem;
 *  - na hora, se a arma for a favorita do personagem (campo Arma favorita) ou do tipo favorito do Combatente.
 *
 * A chave `maestria` já é usada pelo Domínio de arma e pelas Maestrias do Combatente: aqui é `maestriaExotica`.
 * Só contas puras (o item e as flags do ator entram como dados).
 */
import { MAESTRIAS, itemCatalogoPorId, REGIOES_CATALOGO } from "./itens-catalogo.mjs";
import { idRegiao } from "./tecnologia.mjs";

const FLAG = "epm-ficha";
export const PONTOS_MAESTRIA = { mesmaRegiao: 10, outraRegiao: 15 };
export const LIMITE_FAVORITAS_PADRAO = 1;

const norm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const int = (v, p = 0) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? n : p; };

/** Propriedades da arma (lista de nomes). */
const propriedadesDe = item => {
  const p = item?.flags?.[FLAG]?.propriedades;
  return Array.isArray(p) ? p : typeof p === "string" ? p.split(",").map(x => x.trim()).filter(Boolean) : [];
};

/** A arma é Exótica? */
export const eExotica = item => propriedadesDe(item).some(p => norm(p) === "exotica");

/** Maestria Exótica da arma: a guardada no item, a da versão antiga (flags.maestria com texto) ou a do catálogo. */
export function maestriaDoItem(item) {
  if (!item || item.type !== "weapon") return null;
  const f = item.flags?.[FLAG] ?? {};
  if (f.maestriaExotica?.texto) return f.maestriaExotica;
  if (f.maestria && typeof f.maestria === "object" && f.maestria.texto) return f.maestria;
  if (!eExotica(item)) return null;
  const doCatalogo = f.catalogo ? itemCatalogoPorId(f.catalogo) : null;
  return MAESTRIAS[doCatalogo?.nome] ?? MAESTRIAS[item.name] ?? null;
}

/** Armas favoritas guardadas na ficha: [{ id, catalogo, nome }]. */
export function armasFavoritas(dados = {}) {
  return Object.entries(dados.armasFavoritas ?? {})
    .filter(([, v]) => v && (v.catalogo || v.nome))
    .map(([id, v]) => ({ id, catalogo: v.catalogo ?? "", nome: v.nome ?? itemCatalogoPorId(v.catalogo)?.nome ?? "" }));
}

/** Quantas favoritas o personagem pode ter (o Mestre aumenta por ficha). */
export const limiteFavoritas = (dados = {}) => Math.max(LIMITE_FAVORITAS_PADRAO, int(dados.limiteFavoritas, LIMITE_FAVORITAS_PADRAO));

/** A arma (item) é uma das favoritas? Vale para qualquer cópia: compara o id do catálogo ou o nome. */
export function eArmaFavorita(item, dados = {}) {
  const cat = item?.flags?.[FLAG]?.catalogo ?? "";
  const nome = norm(item?.name);
  return armasFavoritas(dados).some(f => (cat && f.catalogo === cat) || (f.nome && norm(f.nome) === nome));
}

/** Tipo favorito do Combatente (Arma Favorita do arquétipo) também libera a Maestria Exótica daquele tipo de arma. */
function eTipoFavoritoCombatente(item, dados = {}) {
  const fav = norm(dados.arquetipoOpcoes?.combatente?.tipoFavorito);
  if (!fav) return false;
  return [item?.flags?.[FLAG]?.tipoArma, item?.name].some(t => t && norm(t) === fav);
}

/** Perícia da arma (Luta para corpo a corpo, Pontaria para distância). */
const periciaDaArma = item => {
  const p = item?.flags?.[FLAG]?.periciaAtaque;
  if (p === "luta" || p === "pontaria") return p;
  return /dist|longo|medio|médio|curto/i.test(String(item?.flags?.[FLAG]?.alcance ?? "")) && !/corpo/i.test(String(item?.flags?.[FLAG]?.alcance ?? "")) ? "pontaria" : "luta";
};

/**
 * Estado da Maestria Exótica de uma arma para o personagem.
 * { texto, liberada, motivo, pericia, pontos, precisa, faltam, efeitos: { propriedades, semPropriedades, critMargem } } ou null.
 */
export function estadoMaestria(item, dados = {}) {
  const m = maestriaDoItem(item);
  if (!m) return null;
  const pericia = periciaDaArma(item);
  const pontos = int(dados.pericias?.[pericia]?.pontos);
  const regiaoArma = idRegiao(item?.flags?.[FLAG]?.regiao ?? "") || "";
  const origem = idRegiao(dados.regiaoOrigem ?? "");
  // Sem região conhecida (arma feita à mão ou personagem sem origem), conta como mesma região
  const outra = !!(regiaoArma && origem && regiaoArma !== origem);
  const precisa = outra ? PONTOS_MAESTRIA.outraRegiao : PONTOS_MAESTRIA.mesmaRegiao;
  let motivo = "";
  if (eArmaFavorita(item, dados)) motivo = "arma favorita";
  else if (eTipoFavoritoCombatente(item, dados)) motivo = "Arma Favorita do Combatente";
  else if (pontos >= precisa) motivo = `${pontos} pontos em ${pericia === "luta" ? "Luta" : "Pontaria"}`;
  return {
    texto: m.texto, liberada: !!motivo, motivo, pericia, periciaLabel: pericia === "luta" ? "Luta" : "Pontaria",
    pontos, precisa, faltam: Math.max(0, precisa - pontos), outraRegiao: outra, regiaoArma: REGIOES_CATALOGO[regiaoArma] ?? "",
    efeitos: { propriedades: m.propriedades ?? [], semPropriedades: m.semPropriedades ?? [], critMargem: m.critMargem ?? 0 }
  };
}

/** Aplica os efeitos automáticos da Maestria liberada num ataque (propriedades e margem de crítico). */
export function aplicarMaestriaNoAtaque(at, estado) {
  if (!estado) return at;
  const out = { ...at, maestriaExotica: estado };
  if (!estado.liberada) return out;
  const tira = new Set(estado.efeitos.semPropriedades.map(norm));
  const props = (at.propriedades ?? []).filter(p => !tira.has(norm(p)));
  for (const p of estado.efeitos.propriedades) if (!props.some(x => norm(x) === norm(p))) props.push(p);
  out.propriedades = props;
  if (estado.efeitos.critMargem) out.critMargem = Math.min(at.critMargem ?? 20, estado.efeitos.critMargem);
  return out;
}

/** Texto curto para o selo da linha da arma. */
export function seloMaestria(estado) {
  if (!estado) return null;
  return estado.liberada
    ? { liberada: true, texto: "Maestria Exótica", dica: `Maestria Exótica liberada (${estado.motivo}): ${estado.texto}` }
    : { liberada: false, texto: `faltam ${estado.faltam} pontos em ${estado.periciaLabel}`,
      dica: `Maestria Exótica: ${estado.texto} Libera com ${estado.precisa} pontos colocados em ${estado.periciaLabel}${estado.outraRegiao ? ` (arma de ${estado.regiaoArma}, outra região)` : ""} ou sendo a arma favorita. Hoje: ${estado.pontos}.` };
}
