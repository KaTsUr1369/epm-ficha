/**
 * Compêndio "EPM · Itens de Umbra'Draxil": todos os itens do catálogo como itens do Foundry, com imagem,
 * separados em pastas por categoria (e subpastas em Armas, Armaduras e Poções), do mais barato ao mais caro.
 * O Mestre ativo cria e atualiza sozinho quando o catálogo muda (mesmo esquema do compêndio de Arquétipos e Classes).
 */
import { FLAG, MODULE_ID } from "./config.mjs";
import { ITENS_CATALOGO, CATEGORIAS_CATALOGO, REGIOES_CATALOGO, dadosItemCatalogo } from "./itens-catalogo.mjs";
import { procurarArtes } from "./itens-imagens.mjs";
import { idFixo } from "./compendio-classes.mjs";

export const NOME_PACOTE_ITENS = "epm-itens-umbra";
export const ID_PACOTE_ITENS = `world.${NOME_PACOTE_ITENS}`;
const ROTULO = `EPM · Itens de ${Object.values(REGIOES_CATALOGO).join(", ")}`;
const FORMATO = 1;
const CHAVE_ARTES = "artesItensCatalogo";

/** Subpasta do item dentro da categoria ("" = direto na categoria). */
export function subpasta(x) {
  if (x.categoria === "armas") return x.arma?.pericia === "pontaria" ? "Distância" : "Corpo a corpo";
  if (x.categoria === "armaduras") return { leve: "Leves", media: "Médias", pesada: "Pesadas" }[x.armadura?.tipo] ?? "";
  if (x.categoria === "pocoes") {
    const n = x.nome;
    if (/Vida/.test(n)) return "Vida";
    if (/Mana/.test(n)) return "Mana";
    if (/Estamina/.test(n)) return "Estamina";
    if (/Proteção contra/.test(n)) return "Proteção";
    if (/Resistência a/.test(n)) return "Resistência";
    if (x.efeitos?.some(e => e.recurso === "ps") || x.removeCondicoes?.includes("amedrontado")) return "Sanidade e coragem";
    if (/Elixir Restaurador/.test(n)) return "Vida";
    return "Outras";
  }
  return "";
}

/** Pastas e itens do compêndio (sem Foundry). `artes` = { id do catálogo: imagem do Foundry }. */
export function documentosItens(artes = {}) {
  const pastas = [];
  const idPasta = {};
  CATEGORIAS_CATALOGO.forEach((c, i) => {
    if (!ITENS_CATALOGO.some(x => x.categoria === c.id)) return;
    const id = idFixo(`itens:pasta:${c.id}`);
    idPasta[c.id] = id;
    pastas.push({ _id: id, name: c.label, type: "Item", sorting: "m", sort: (i + 1) * 100 });
    const subs = [...new Set(ITENS_CATALOGO.filter(x => x.categoria === c.id).map(subpasta).filter(Boolean))];
    subs.forEach((s, j) => {
      const sid = idFixo(`itens:pasta:${c.id}:${s}`);
      idPasta[`${c.id}:${s}`] = sid;
      pastas.push({ _id: sid, name: s, type: "Item", folder: id, sorting: "m", sort: (j + 1) * 10 });
    });
  });
  const itens = [];
  for (const c of CATEGORIAS_CATALOGO) {
    const daCategoria = ITENS_CATALOGO.filter(x => x.categoria === c.id).sort((a, b) => a.preco - b.preco || a.nome.localeCompare(b.nome, "pt-BR"));
    daCategoria.forEach((x, i) => {
      const s = subpasta(x);
      const d = dadosItemCatalogo(x, { qtd: 1, flag: FLAG, img: artes[x.id] ?? "" });
      itens.push({ ...d, _id: idFixo(`itens:${x.id}`), folder: idPasta[s ? `${c.id}:${s}` : c.id], sort: (i + 1) * 10 });
    });
  }
  return { pastas, itens };
}

function assinatura(artes) {
  const { pastas, itens } = documentosItens(artes);
  // os efeitos ganham ids aleatórios a cada montagem: ficam de fora da assinatura
  return idFixo(JSON.stringify({ FORMATO, pastas, itens: itens.map(i => ({ ...i, flags: { ...i.flags, [FLAG]: { ...i.flags[FLAG], efeitos: Object.values(i.flags[FLAG].efeitos ?? {}).map(({ criado, ...e }) => e) } } })) }));
}

/** Imagens do Foundry já escolhidas (o Catálogo de itens usa as mesmas). */
export function artesSalvas() {
  try { return game.settings.get(MODULE_ID, CHAVE_ARTES) ?? {}; } catch { return {}; }
}

/** Cria o compêndio do mundo (se não existe) e refaz quando o catálogo mudou. Só o Mestre ativo. */
export async function sincronizarCompendioItens({ forcar = false } = {}) {
  if (!game.user?.isGM || (game.users?.activeGM && !game.users.activeGM.isSelf)) return null;
  const Colecao = foundry.documents?.collections?.CompendiumCollection ?? globalThis.CompendiumCollection;
  let pacote = game.packs.get(ID_PACOTE_ITENS);
  if (!pacote) pacote = await Colecao.createCompendium({ type: "Item", label: ROTULO, name: NOME_PACOTE_ITENS, package: "world", system: game.system?.id });

  let artes = artesSalvas();
  if (forcar || !Object.keys(artes).length) {
    artes = await procurarArtes(ITENS_CATALOGO);
    try { await game.settings.set(MODULE_ID, CHAVE_ARTES, artes); } catch (err) { console.warn("EPM |", err); }
  }
  const sig = assinatura(artes);
  let atual = "";
  try { atual = game.settings.get(MODULE_ID, "assinaturaCompendioItens"); } catch { /* sem a configuração */ }
  const vazio = (await pacote.getIndex()).size === 0;
  if (!forcar && !vazio && atual === sig) return pacote;

  const travado = pacote.locked;
  if (travado) await pacote.configure({ locked: false });
  const { pastas, itens } = documentosItens(artes);
  const ItemCls = foundry.documents?.Item ?? globalThis.Item;
  const PastaCls = foundry.documents?.Folder ?? globalThis.Folder;
  const velhos = [...(await pacote.getIndex()).keys()];
  if (velhos.length) await ItemCls.deleteDocuments(velhos, { pack: pacote.collection });
  const pastasVelhas = pacote.folders?.map?.(f => f.id) ?? [];
  if (pastasVelhas.length) await PastaCls.deleteDocuments(pastasVelhas, { pack: pacote.collection });
  // pastas de cima antes das subpastas
  await PastaCls.createDocuments(pastas.filter(p => !p.folder), { pack: pacote.collection, keepId: true });
  await PastaCls.createDocuments(pastas.filter(p => p.folder), { pack: pacote.collection, keepId: true });
  for (let i = 0; i < itens.length; i += 100) await ItemCls.createDocuments(itens.slice(i, i + 100), { pack: pacote.collection, keepId: true });
  if (travado) await pacote.configure({ locked: true });
  try { await game.settings.set(MODULE_ID, "assinaturaCompendioItens", sig); } catch (err) { console.warn("EPM |", err); }
  console.log(`EPM | Compêndio "${ROTULO}" atualizado (${itens.length} itens, ${Object.keys(artes).length} com arte do Foundry).`);
  return pacote;
}

export function registrarCompendioItens() {
  game.settings.register(MODULE_ID, "assinaturaCompendioItens", { scope: "world", config: false, type: String, default: "" });
  game.settings.register(MODULE_ID, CHAVE_ARTES, { scope: "world", config: false, type: Object, default: {} });
  Hooks.once("ready", () => {
    sincronizarCompendioItens().catch(err => console.error("EPM | Falha ao montar o compêndio de itens", err));
  });
}
