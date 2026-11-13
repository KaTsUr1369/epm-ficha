/**
 * Puxar itens de um compêndio direto do inventário: escolhe o compêndio, busca, marca a quantidade e adiciona.
 * Também abre o compêndio para arrastar. Consumíveis e materiais iguais (mesmo item do catálogo ou mesmo nome)
 * somam na quantidade em vez de criar outro item.
 */
import { FLAG } from "./config.mjs";
import { int } from "./data.mjs";
import { fvtt, escapar } from "./helpers.mjs";
import { ID_PACOTE_ITENS } from "./compendio-itens.mjs";

const TIPOS_INVENTARIO = ["weapon", "equipment", "consumable", "tool", "loot", "container", "backpack"];
const EMPILHA = ["consumable", "loot"];
const CAMPOS = ["img", "type", "folder", `flags.${FLAG}.resumo`, `flags.${FLAG}.catalogo`, `flags.${FLAG}.raridade`, "system.price"];
const semAcento = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Compêndios de itens que o usuário pode ver (o do EPM primeiro). */
export function compendiosDeItens() {
  return [...(game.packs?.values?.() ?? [])].filter(p => p.documentName === "Item" && (p.visible ?? true))
    .sort((a, b) => Number(b.collection === ID_PACOTE_ITENS) - Number(a.collection === ID_PACOTE_ITENS) || String(a.title ?? a.metadata?.label).localeCompare(String(b.title ?? b.metadata?.label), "pt-BR"));
}

/** Cria os itens escolhidos na ficha. `escolhas` = [{ uuid, qtd }]. */
export async function adicionarDoCompendio(actor, escolhas, mochilaId = null) {
  const criar = [], somar = [], nomes = [];
  for (const { uuid, qtd } of escolhas) {
    const doc = await fromUuid(uuid);
    if (!doc || !TIPOS_INVENTARIO.includes(doc.type)) continue;
    const n = Math.max(1, int(qtd, 1));
    const cat = doc.flags?.[FLAG]?.catalogo;
    const igual = EMPILHA.includes(doc.type)
      ? actor.items.find(i => i.type === doc.type && ((cat && i.flags?.[FLAG]?.catalogo === cat) || (!cat && i.name === doc.name)))
      : null;
    const porUnidade = Math.max(1, int(doc.system?.quantity, 1));
    if (igual) somar.push({ _id: igual.id, "system.quantity": int(igual.system?.quantity, 1) + n * porUnidade });
    else {
      const data = doc.toObject();
      for (const k of ["_id", "folder", "sort", "ownership", "_stats"]) delete data[k];
      if (data.system) data.system.container = mochilaId || null;
      if (EMPILHA.includes(doc.type)) { data.system.quantity = n * porUnidade; criar.push(data); }
      else for (let i = 0; i < n; i++) criar.push(foundry.utils.deepClone(data));
    }
    nomes.push(`${n > 1 ? `${n}× ` : ""}${doc.name}`);
  }
  if (somar.length) await actor.updateEmbeddedDocuments("Item", somar);
  if (criar.length) await actor.createEmbeddedDocuments("Item", criar);
  if (nomes.length) ui.notifications.info(`${actor.name}: ${nomes.join(", ")}.`);
  else ui.notifications.warn("Nenhum item de inventário marcado.");
}

/** Janela de busca no compêndio. */
export async function puxarDoCompendio(actor) {
  if (!actor?.isOwner) return;
  const pacotes = compendiosDeItens();
  if (!pacotes.length) return ui.notifications.warn("Nenhum compêndio de itens neste mundo (o do EPM é criado quando o Mestre entra).");
  let pacote = pacotes[0];
  let indice = [];
  const marcados = new Map();

  const linhas = (lista, busca) => {
    const b = semAcento(busca).trim().split(/\s+/).filter(Boolean);
    const vis = lista.filter(e => TIPOS_INVENTARIO.includes(e.type) && b.every(t => semAcento(`${e.name} ${e.flags?.[FLAG]?.resumo ?? ""} ${e.pasta ?? ""}`).includes(t))).slice(0, 200);
    if (!vis.length) return '<li class="epm-dica">Nada encontrado.</li>';
    return vis.map(e => {
      const uuid = e.uuid ?? `Compendium.${pacote.collection}.Item.${e._id}`;
      const q = marcados.get(uuid);
      return `<li class="epm-puxar-linha${q ? " marcado" : ""}" data-uuid="${escapar(uuid)}" data-tooltip="${escapar(e.flags?.[FLAG]?.resumo ?? "")}">
        <input type="checkbox" data-marca ${q ? "checked" : ""} aria-label="Marcar ${escapar(e.name)}">
        <img src="${escapar(e.img || "icons/svg/item-bag.svg")}" alt="" loading="lazy">
        <span class="epm-puxar-nome">${escapar(e.name)}${e.pasta ? ` <small>${escapar(e.pasta)}</small>` : ""}</span>
        <input type="number" min="1" value="${q ?? 1}" data-qtd aria-label="Quantidade">
      </li>`;
    }).join("");
  };

  const carregar = async () => {
    const idx = await pacote.getIndex({ fields: CAMPOS });
    const pastas = new Map((pacote.folders ?? []).map(f => [f.id, f.folder ? `${f.folder.name ?? ""} / ${f.name}` : f.name]));
    indice = [...idx.values()].map(e => ({ ...e, pasta: pastas.get(e.folder) ?? "" }))
      .sort((a, b) => String(a.pasta).localeCompare(String(b.pasta), "pt-BR") || a.name.localeCompare(b.name, "pt-BR"));
  };
  await carregar();

  const r = await fvtt.DialogV2.wait({
    window: { title: `Compêndio → ${actor.name}`, icon: "fa-solid fa-book-atlas" }, classes: ["epm-dialogo", "epm-puxar"], rejectClose: false, modal: false,
    position: { width: 560, height: 640 },
    content: `<div class="epm-puxar-corpo">
      <div class="epm-puxar-topo">
        <select data-pacote aria-label="Compêndio">${pacotes.map(p => `<option value="${escapar(p.collection)}">${escapar(p.title ?? p.metadata?.label ?? p.collection)}</option>`).join("")}</select>
        <input type="search" data-busca placeholder="Buscar (nome, efeito, pasta…)" aria-label="Buscar">
        <button type="button" class="epm-botao epm-botao-mini" data-abrir title="Abre o compêndio para arrastar os itens para a ficha"><i class="fa-solid fa-up-right-from-square"></i> Abrir</button>
      </div>
      <ul class="epm-puxar-lista">${linhas(indice, "")}</ul>
      <p class="epm-dica" data-total>Nenhum marcado.</p>
    </div>`,
    buttons: [
      { action: "ok", label: "Adicionar ao inventário", icon: "fa-solid fa-plus", default: true, callback: () => "ok" },
      { action: "cancelar", label: "Fechar", icon: "fa-solid fa-xmark" }
    ],
    render: (ev, dlg) => {
      const raiz = dlg?.element ?? ev?.target?.element ?? ev?.target;
      const el = raiz?.querySelector ? raiz : document;
      const lista = el.querySelector(".epm-puxar-lista");
      const busca = el.querySelector("[data-busca]");
      const total = () => { const n = [...marcados.values()].reduce((s, q) => s + q, 0); const t = el.querySelector("[data-total]"); if (t) t.textContent = n ? `${marcados.size} item(ns) marcado(s), ${n} no total.` : "Nenhum marcado."; };
      const redesenhar = () => { lista.innerHTML = linhas(indice, busca?.value ?? ""); };
      busca?.addEventListener("input", redesenhar);
      el.querySelector("[data-pacote]")?.addEventListener("change", async e => {
        pacote = pacotes.find(p => p.collection === e.target.value) ?? pacote;
        await carregar();
        redesenhar();
      });
      el.querySelector("[data-abrir]")?.addEventListener("click", () => pacote.render(true));
      lista.addEventListener("change", e => {
        const li = e.target.closest("[data-uuid]");
        if (!li) return;
        const marca = li.querySelector("[data-marca]");
        if (e.target.matches("[data-qtd]")) marca.checked = true;
        if (marca.checked) marcados.set(li.dataset.uuid, Math.max(1, int(li.querySelector("[data-qtd]").value, 1)));
        else marcados.delete(li.dataset.uuid);
        li.classList.toggle("marcado", marca.checked);
        total();
      });
    }
  });
  if (r !== "ok" || !marcados.size) return;
  return adicionarDoCompendio(actor, [...marcados].map(([uuid, qtd]) => ({ uuid, qtd })));
}
