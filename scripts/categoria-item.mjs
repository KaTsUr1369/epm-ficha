/**
 * Trocar a categoria de um item (ex.: Loot → Ferramenta, Armadura → Vestimenta).
 * Dentro do mesmo tipo do D&D (equipamento) muda só o subtipo; entre tipos diferentes o item
 * é recriado com o mesmo id, nome, imagem, quantidade, peso, preço, descrição, mochila e todos
 * os dados do EPM (flags). Campos próprios do tipo antigo no D&D (ex.: dano nativo) não vão junto.
 */
import { FLAG, CATEGORIA_MOCHILAS, TIPOS_VESTIMENTA } from "./config.mjs";
import { danoArma } from "./context.mjs";

export const CATEGORIAS_TROCA = [
  { id: "arma",       label: "Arma",       type: "weapon" },
  { id: "consumivel", label: "Consumível", type: "consumable" },
  { id: "armadura",   label: "Armadura",   type: "equipment", sub: "light" },
  { id: "escudo",     label: "Escudo",     type: "equipment", sub: "shield" },
  { id: "vestimenta", label: "Vestimenta", type: "equipment", sub: "clothing" },
  { id: "acessorio",  label: "Acessório",  type: "equipment", sub: "trinket" },
  { id: "ferramenta", label: "Ferramenta", type: "tool" },
  { id: "loot",       label: "Loot",       type: "loot" },
  { id: "mochila",    label: "Mochila",    type: "container" }
];

export function categoriaDoItem(item) {
  const t = item?.type;
  if (t === "equipment") {
    const sub = item.system?.type?.value;
    if (sub === "shield") return "escudo";
    if (sub === "clothing") return "vestimenta";
    if (TIPOS_VESTIMENTA.includes(sub)) return "acessorio";
    return "armadura";
  }
  if (CATEGORIA_MOCHILAS.tipos.includes(t)) return "mochila";
  return CATEGORIAS_TROCA.find(c => c.type === t)?.id ?? "";
}

export const opcoesCategoria = item => {
  const atual = categoriaDoItem(item);
  return CATEGORIAS_TROCA.map(c => ({ id: c.id, label: c.label, selected: c.id === atual }));
};

/** Dados do item recriado no tipo novo. */
export function dadosNaCategoria(item, cat) {
  const d = item.toObject();
  const s = d.system ?? {};
  const system = {};
  for (const k of ["description", "quantity", "weight", "price", "rarity", "identified", "source", "unidentified"]) if (s[k] !== undefined) system[k] = s[k];
  system.container = CATEGORIA_MOCHILAS.tipos.includes(cat.type) ? null : (s.container ?? null);
  if (["weapon", "equipment"].includes(cat.type) && s.equipped !== undefined) system.equipped = s.equipped;
  if (cat.type === "equipment") system.type = { value: cat.sub, baseItem: "" };
  const flags = foundry.utils.deepClone(d.flags ?? {});
  // Dano nativo do D&D vira o dano do EPM, para não se perder ao virar arma de novo
  if (item.type === "weapon" && !flags[FLAG]?.dano) {
    const dano = danoArma(item);
    if (dano) foundry.utils.setProperty(flags, `${FLAG}.dano`, dano);
  }
  return { _id: d._id, name: d.name, img: d.img, type: cat.type, system, flags, folder: d.folder ?? null, sort: d.sort ?? 0, ownership: d.ownership, effects: d.effects ?? [] };
}

/** Troca a categoria. Devolve o item novo (ou o mesmo, se só mudou o subtipo). */
export async function mudarCategoriaItem(item, catId, { confirmarPerda = true } = {}) {
  const cat = CATEGORIAS_TROCA.find(c => c.id === catId);
  if (!item || !cat || categoriaDoItem(item) === catId) return item;
  if (item.type === cat.type) {
    await item.update({ "system.type.value": cat.sub });
    return item;
  }
  if (confirmarPerda) {
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: `Virar ${cat.label}` },
      content: `<p><strong>${foundry.utils.escapeHTML?.(item.name) ?? item.name}</strong> vai para a categoria <strong>${cat.label}</strong>.</p><p class="epm-dica">Nome, imagem, quantidade, peso, preço, descrição e os dados do EPM ficam. Campos só do tipo antigo no D&amp;D se perdem.</p>`,
      classes: ["epm-dialogo"], rejectClose: false
    });
    if (!ok) return null;
  }
  const dados = dadosNaCategoria(item, cat);
  const pai = item.parent;
  const backup = item.toObject();
  const sheetAberta = item.sheet?.rendered;
  // Mochila que deixa de ser mochila: os itens de dentro voltam para o inventário
  if (pai && CATEGORIA_MOCHILAS.tipos.includes(item.type)) {
    const dentro = pai.items.filter(i => i.system?.container === item.id);
    if (dentro.length) await pai.updateEmbeddedDocuments("Item", dentro.map(i => ({ _id: i.id, "system.container": null })));
  }
  try { await item.sheet?.close?.(); } catch { /* sem ficha aberta */ }
  let novo;
  try {
    if (pai) {
      await pai.deleteEmbeddedDocuments("Item", [item.id]);
      [novo] = await pai.createEmbeddedDocuments("Item", [dados], { keepId: true });
    } else {
      await item.delete();
      novo = await Item.implementation.create(dados, { keepId: true });
    }
  } catch (err) {
    console.error("EPM | Falha ao trocar a categoria", err);
    ui.notifications.error(`Não deu para trocar a categoria de ${backup.name}; o item foi restaurado.`);
    if (pai) { if (!pai.items.get(backup._id)) [novo] = await pai.createEmbeddedDocuments("Item", [backup], { keepId: true }); }
    else if (!game.items?.get(backup._id)) novo = await Item.implementation.create(backup, { keepId: true });
    return novo ?? null;
  }
  if (sheetAberta) novo?.sheet?.render(true);
  ui.notifications.info(`${dados.name} agora é ${cat.label}.`);
  return novo;
}
