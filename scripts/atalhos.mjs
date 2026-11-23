/**
 * Atalhos na barra de macros (0.8.23): arraste o botão de uma perícia, de um ataque ou de uma habilidade/magia
 * da ficha para a barra; a macro rola ou usa direto, com o personagem da ficha (ou o token selecionado).
 */
import { MODULE_ID } from "./config.mjs";

const ACOES = { rolarPericia: "pericia", atacar: "ataque", usarPoder: "poder" };
const ICONES = { pericia: "icons/svg/d20-highlight.svg", ataque: "icons/svg/sword.svg", poder: "icons/svg/aura.svg" };

/** Dados do atalho a partir de um botão da ficha (ou null). */
export function dadosAtalho(botao, actor) {
  const tipo = ACOES[botao?.dataset?.action];
  if (!tipo || !actor) return null;
  const d = { type: "EPMAtalho", tipo, actorUuid: actor.uuid, actorId: actor.id };
  if (tipo === "pericia") { d.pericia = botao.dataset.pericia; d.nome = `${actor.name}: ${botao.closest("[data-busca], li, tr")?.querySelector(".epm-pericia-nome, .epm-npcv-link")?.textContent?.trim() || botao.getAttribute("title")?.replace(/^Rolar\s*/, "").replace(/\s*\(.*$/, "") || d.pericia}`; }
  if (tipo === "ataque") { d.ataque = botao.dataset.tipo; d.ref = botao.dataset.ref; d.nome = `${actor.name}: ${actor.items?.get?.(String(botao.dataset.ref).split(":")[0])?.name ?? "Ataque"}`; }
  if (tipo === "poder") { d.itemId = botao.dataset.itemId; const it = actor.items?.get?.(d.itemId); d.nome = `${actor.name}: ${it?.name ?? "Habilidade"}`; d.img = it?.img; }
  return d;
}

/** Liga o arrastar nos botões de uma ficha já desenhada. */
export function ligarAtalhos(raiz, actor) {
  for (const b of raiz.querySelectorAll('[data-action="rolarPericia"], [data-action="atacar"], [data-action="usarPoder"]')) {
    if (b.dataset.epmAtalho) continue;
    b.dataset.epmAtalho = "1";
    b.draggable = true;
    b.title = `${b.title ? `${b.title} · ` : ""}Arraste para a barra de macros para criar um atalho`;
    b.addEventListener("dragstart", ev => {
      const d = dadosAtalho(b, actor);
      if (!d) return;
      ev.stopPropagation();
      ev.dataTransfer?.setData("text/plain", JSON.stringify(d));
    });
  }
}

/** Executa um atalho (chamado pela macro). */
export async function executarAtalho(d = {}) {
  let actor = d.actorUuid ? (globalThis.fromUuidSync?.(d.actorUuid) ?? await fromUuid(d.actorUuid)) : null;
  actor ??= game.actors?.get(d.actorId) ?? canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character;
  if (!actor) return ui.notifications.warn("Atalho EPM: não achei o personagem. Selecione o token ou abra a ficha.");
  const M = await import("./mecanicas.mjs");
  if (d.tipo === "pericia") return M.rolarPericia(actor, d.pericia, null);
  if (d.tipo === "ataque") return M.dialogoAtaque(actor, d.ataque, d.ref);
  if (d.tipo === "poder") {
    const item = actor.items.get(d.itemId) ?? actor.items.find(i => i.name === String(d.nome ?? "").split(": ").slice(1).join(": "));
    if (!item) return ui.notifications.warn("Atalho EPM: a habilidade não está mais na ficha.");
    return M.usarPoder(actor, item);
  }
}

export function registrarAtalhos() {
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data?.type !== "EPMAtalho") return;
    (async () => {
      const comando = `game.modules.get("${MODULE_ID}").api.atalho(${JSON.stringify({ tipo: data.tipo, actorUuid: data.actorUuid, actorId: data.actorId, pericia: data.pericia, ataque: data.ataque, ref: data.ref, itemId: data.itemId, nome: data.nome })});`;
      let macro = game.macros?.find(m => m.command === comando && m.isOwner);
      macro ??= await Macro.create({ name: data.nome ?? "Atalho EPM", type: "script", img: data.img || ICONES[data.tipo], command: comando });
      await game.user.assignHotbarMacro(macro, slot);
    })().catch(err => console.warn("EPM | atalho", err));
    return false;
  });
}
