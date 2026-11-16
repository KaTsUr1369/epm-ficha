/**
 * Atualiza as fichas e itens que já existem quando o módulo muda (roda no Mestre ativo ao abrir o mundo).
 * Cada passo confere item por item e só mexe no que está desatualizado (pode rodar sempre).
 */
import { FLAG } from "./config.mjs";

const P = `flags.${FLAG}`;

/** Todos os itens do mundo: soltos e dentro das fichas. */
function todosItens() {
  const out = [...(game.items ?? [])];
  for (const a of game.actors ?? []) out.push(...(a.items ?? []));
  return out;
}

/** Magias importadas pelo leitor antigo (site PF2 SRD): tira o link errado e aponta para o Códex do Vazio. */
async function corrigirMagiasPf2(itens) {
  const { CODEX_URL } = await import("./codex.mjs");
  let n = 0;
  for (const item of itens) {
    const f = item.flags?.[FLAG];
    if (item.type !== "spell" || f?.origemExterna?.site !== "pf2srd" || f?.origemCorrigida) continue;
    const desc = String(item.system?.description?.value ?? "");
    const nova = desc.replace(/<p class="epm-dica">Importada do Codex do Vazio[\s\S]*?<\/p>/, `<p class="epm-dica">Importada de uma versão antiga do módulo, de outro site (não é do Códex do Vazio). Para pegar a versão do <a href="${CODEX_URL}" target="_blank" rel="noopener">Códex do Vazio</a>, use o botão Códex do Vazio na aba Magias.</p>`);
    await item.update({ "system.description.value": nova, [`${P}.origemCorrigida`]: true, [`${P}.origemExterna.url`]: "" });
    n++;
  }
  return n;
}

/** Itens prontos do Escudo (Hydrakariel): versão nova troca formas, efeitos e texto, mantendo equipado e passiva. */
async function atualizarItensProntos(itens) {
  const { itemProntoPorId } = await import("./itens-prontos.mjs");
  let n = 0;
  for (const item of itens) {
    const f = item.flags?.[FLAG];
    const pronto = f?.pronto ? itemProntoPorId(f.pronto) : null;
    if (!pronto) continue;
    const novo = pronto.dados();
    const nf = novo.flags[FLAG];
    if ((f.prontoVersao ?? 1) >= (nf.prontoVersao ?? 1)) continue;
    await item.update({ [`${P}.-=formas`]: null, [`${P}.-=efeitos`]: null });
    await item.update({ [`${P}.formas`]: nf.formas, [`${P}.efeitos`]: nf.efeitos, [`${P}.prontoVersao`]: nf.prontoVersao, "system.description.value": novo.system.description.value });
    n++;
  }
  return n;
}

/** Tipos de dano com nome antigo (Elétrico, Gelo, Trovejante, Pressão, Arcano, Sangue…) viram os da lista nova. */
export function renomearTipoTexto(texto, mapa) {
  let t = String(texto ?? "");
  for (const [velho, novo] of Object.entries(mapa)) {
    t = t.replace(new RegExp(`(^|[^\\p{L}])${velho}(?=$|[^\\p{L}])`, "gu"), `$1${novo}`);
  }
  return t;
}
const CHAVE_TIPO = /^(tipoDano|resTipo|tipoDanoExtra|rdTipo)$/;
const LISTAS_TIPO = ["resistencias", "vulnerabilidades", "imunidades"];
export function trocasTiposDano(flags, mapa, prefixo = P) {
  const upd = {};
  const andar = (o, caminho, dentroLista = false) => {
    if (!o || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o)) {
      const c = `${caminho}.${k}`;
      if (typeof v === "string" && (CHAVE_TIPO.test(k) || dentroLista)) {
        const novo = renomearTipoTexto(v, mapa);
        if (novo !== v) upd[c] = novo;
      } else if (Array.isArray(v) && LISTAS_TIPO.includes(k)) {
        const nova = v.map(x => typeof x === "string" ? renomearTipoTexto(x, mapa) : x);
        if (JSON.stringify(nova) !== JSON.stringify(v)) upd[c] = nova;
      } else if (v && typeof v === "object" && !Array.isArray(v)) andar(v, c);
    }
  };
  andar(flags, prefixo);
  return upd;
}

async function renomearTiposDano(itens) {
  const { TIPOS_DANO_ANTIGOS } = await import("./config.mjs");
  let n = 0;
  for (const doc of [...(game.actors ?? []), ...itens]) {
    const f = doc.flags?.[FLAG];
    if (!f || f.tiposDanoV2) continue;
    const upd = trocasTiposDano(f, TIPOS_DANO_ANTIGOS);
    await doc.update({ ...upd, [`${P}.tiposDanoV2`]: true }, { render: false });
    if (Object.keys(upd).length) n++;
  }
  return n;
}

/**
 * Habilidades de arquétipo criadas pelos modelos: acompanham o texto e o nível do livro atual
 * (ex.: Magia 3 do Conjurador passou do nível 26 para o 19). Só mexe se o texto ainda é o do modelo.
 */
export async function sincronizarHabilidadesArquetipo(itens) {
  const { ARQUETIPOS } = await import("./arquetipos.mjs");
  const { escapar } = await import("./helpers.mjs");
  let n = 0;
  for (const item of itens) {
    const ref = item.flags?.[FLAG]?.arquetipoRef;
    if (!ref) continue;
    const [arqId] = String(ref).split(":");
    const a = ARQUETIPOS[arqId];
    const h = a?.habilidades?.find(x => x.nome === item.name);
    if (!h) continue;
    const desc = String(item.system?.description?.value ?? "");
    if (!/\(modelo 0\.5\)/.test(desc)) continue;
    const nova = `<p>${escapar(h.resumo)}</p><p class="epm-dica">${escapar(a.nome)}, nível ${h.nivel} (modelo 0.5).</p>`;
    const novoRef = `${arqId}:${h.nivel}`;
    if (desc === nova && ref === novoRef) continue;
    await item.update({ "system.description.value": nova, [`${P}.arquetipoRef`]: novoRef }, { render: false });
    n++;
  }
  return n;
}

/** Valores que eram o padrão antigo do livro e ficaram gravados na ficha: voltam a seguir o livro novo (0.8.13). */
const ANTIGOS_0813 = {
  tabela: { combatente: { pv: 20, pe: 16, pm: 12 } },
  ajustes: { "arq-estilo-duelista-acertoisolado": 5, "arq-estilo-bebado-acerto": 5, "arq-estilo-bebado-esquiva": 2, "arq-estilo-bebado-ca": 2,
    "arq-estilo-dupla-acerto": 3, "arq-estilo-dupla-ca": 2, "arq-estilo-atirador-margem": 2 },
  numeros: { "estilo.duelista.acertoIsolado": 5, "estilo.bebado.acerto": 5, "estilo.bebado.esquiva": 2, "estilo.bebado.ca": 2,
    "estilo.atirador.margem": 2, "estilo.dupla.acerto": 3, "estilo.dupla.ca": 2 }
};
export function trocasValoresAntigos(f = {}) {
  const upd = {};
  for (const [arq, recs] of Object.entries(ANTIGOS_0813.tabela)) for (const [r, velho] of Object.entries(recs)) {
    const v = f.recursosAuto?.tabela?.[arq]?.[r]?.inicial;
    if (v !== undefined && v !== "" && Number(v) === velho) upd[`${P}.recursosAuto.tabela.${arq}.${r}.inicial`] = "";
  }
  for (const [k, velho] of Object.entries(ANTIGOS_0813.ajustes)) {
    const v = f.ajustesBonus?.[k];
    if (v !== undefined && v !== "" && Number(v) === velho) upd[`${P}.ajustesBonus.-=${k}`] = null;
  }
  return upd;
}
async function valoresAntigos() {
  let n = 0;
  for (const a of game.actors ?? []) {
    const f = a.flags?.[FLAG];
    if (!f || f.migrado0813) continue;
    const upd = trocasValoresAntigos(f);
    await a.update({ ...upd, [`${P}.migrado0813`]: true }, { render: false });
    if (Object.keys(upd).length) n++;
  }
  try {
    const salvos = { ...(game.settings.get(FLAG, "numerosBonus") ?? {}) };
    let mudou = false;
    for (const [k, velho] of Object.entries(ANTIGOS_0813.numeros)) if (salvos[k] !== undefined && Number(salvos[k]) === velho) { delete salvos[k]; mudou = true; }
    if (mudou) await game.settings.set(FLAG, "numerosBonus", salvos);
  } catch (err) { console.warn("EPM | números dos estilos", err); }
  return n;
}

export async function migrarMundo() {
  if (!game.user?.isGM || (game.users?.activeGM && !game.users.activeGM.isSelf)) return;
  const itens = todosItens();
  const feitos = [];
  try { const n = await corrigirMagiasPf2(itens); if (n) feitos.push(`${n} magia(s) com o link antigo corrigidas`); } catch (err) { console.warn("EPM | migração das magias", err); }
  try { const n = await atualizarItensProntos(itens); if (n) feitos.push(`${n} item(ns) pronto(s) atualizado(s)`); } catch (err) { console.warn("EPM | migração dos itens prontos", err); }
  try { const n = await renomearTiposDano(itens); if (n) feitos.push(`${n} ficha(s)/item(ns) com tipos de dano renomeados`); } catch (err) { console.warn("EPM | migração dos tipos de dano", err); }
  try { const n = await sincronizarHabilidadesArquetipo(itens); if (n) feitos.push(`${n} habilidade(s) de arquétipo com o texto e o nível do livro atual`); } catch (err) { console.warn("EPM | habilidades de arquétipo", err); }
  try { const n = await valoresAntigos(); if (n) feitos.push(`${n} ficha(s) com valores antigos do livro atualizados`); } catch (err) { console.warn("EPM | valores antigos", err); }
  if (feitos.length) ui.notifications.info(`EPM: fichas antigas atualizadas (${feitos.join("; ")}).`);
  return feitos;
}
