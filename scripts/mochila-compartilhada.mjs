/**
 * Mochilas compartilhadas (0.8.21): uma mochila de um personagem fica à disposição de outros personagens escolhidos.
 * A mochila (e o peso dela) continua com quem a carrega; os membros veem o conteúdo na própria ficha e podem pegar
 * ou guardar itens. Quando o jogador não é dono de quem carrega, o Mestre faz a troca pelo socket.
 * Na mochila: flags.epm-ficha.compartilhada = [ids dos personagens].
 */
import { FLAG } from "./config.mjs";
import { num } from "./data.mjs";
import { escapar, fvtt } from "./helpers.mjs";
import { atorVisivel, escolherAtores } from "./escolher-ator.mjs";

const P = `flags.${FLAG}`;
const TIPOS_MOCHILA = ["container", "backpack"];
const EMPILHA = ["consumable", "loot"];

/** Ids dos personagens com quem a mochila é compartilhada. */
export function membrosDe(mochila) {
  const l = mochila?.flags?.[FLAG]?.compartilhada;
  return Array.isArray(l) ? l.filter(Boolean) : [];
}
export const eCompartilhada = mochila => TIPOS_MOCHILA.includes(mochila?.type) && membrosDe(mochila).length > 0;

/** Mochilas de outros personagens compartilhadas com este. */
export function compartilhadasCom(actor) {
  const out = [];
  if (!actor) return out;
  for (const dono of globalThis.game?.actors ?? []) {
    if (dono.id === actor.id) continue;
    for (const m of dono.items ?? []) if (eCompartilhada(m) && membrosDe(m).includes(actor.id)) out.push({ dono, mochila: m });
  }
  return out;
}

/** Para a aba Inventário: as mochilas compartilhadas com este personagem e o que tem nelas. */
export function contextoCompartilhadas(actor, fechadas = new Set()) {
  return compartilhadasCom(actor).map(({ dono, mochila }) => {
    const conteudo = (dono.items?.contents ?? [...(dono.items ?? [])]).filter(i => i.system?.container === mochila.id)
      .map(i => ({ id: i.id, uuid: i.uuid, name: i.name, img: i.img, qtd: num(i.system?.quantity, 1), peso: num(i.system?.weight?.value ?? i.system?.weight, 0) }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const outros = membrosDe(mochila).filter(id => id !== actor.id).map(id => globalThis.game?.actors?.get(id)?.name).filter(Boolean);
    return {
      id: mochila.id, donoId: dono.id, nome: mochila.name, img: mochila.img, dono: dono.name, conteudo, vazia: !conteudo.length,
      membrosTexto: outros.join(", "), aberta: !fechadas.has(`comp-${mochila.id}`), chave: `comp-${mochila.id}`
    };
  });
}

/** Opções do editor da mochila: personagens que podem receber o compartilhamento. */
export function opcoesMembros(mochila) {
  // Só os membros atuais (como fichas); a escolha é pelo diálogo com busca
  return membrosDe(mochila).map(id => globalThis.game?.actors?.get(id)).filter(a => a && atorVisivel(a))
    .map(a => ({ id: a.id, nome: a.name, img: a.img, marcado: true }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Diálogo com busca para escolher com quem compartilhar (o jogador só vê fichas de jogadores). */
export async function escolherMembros(mochila) {
  const dono = mochila?.parent;
  if (!dono) return;
  const r = await escolherAtores({
    titulo: `Compartilhar ${mochila.name}`, multiplos: true, ok: "Compartilhar", excluir: [dono.uuid],
    marcados: membrosDe(mochila),
    dica: "Marque quem pode ver, pegar e guardar itens nesta mochila. O peso continua com quem carrega."
  });
  if (!r) return;
  // Mantém quem o jogador não pode ver na lista (ex.: um NPC posto pelo Mestre)
  const invisiveis = membrosDe(mochila).filter(id => !atorVisivel(globalThis.game?.actors?.get(id)));
  return mochila.update({ [`${P}.compartilhada`]: [...new Set([...invisiveis, ...r.ids])] });
}

export async function alternarMembro(mochila, actorId) {
  const l = membrosDe(mochila);
  const novo = l.includes(actorId) ? l.filter(id => id !== actorId) : [...l, actorId];
  return mochila.update({ [`${P}.compartilhada`]: novo });
}

/* ---------------- Transferência ---------------- */

/** Move `qtd` unidades de um item de um personagem para outro (empilha com um item igual no destino). */
export async function moverItem(origem, itemId, destino, qtd, containerId = null) {
  const item = origem.items.get(itemId);
  if (!item) throw new Error("item não encontrado");
  if (TIPOS_MOCHILA.includes(item.type)) throw new Error("mochilas não entram em mochilas compartilhadas");
  const tem = num(item.system?.quantity, 1);
  const leva = Math.max(1, Math.min(tem, Math.floor(num(qtd, tem))));
  const igual = EMPILHA.includes(item.type) ? destino.items.find(i => i.type === item.type && i.name === item.name && (i.system?.container ?? null) === containerId
    && JSON.stringify(i.flags?.[FLAG]?.melhoriasDoItem ?? {}) === JSON.stringify(item.flags?.[FLAG]?.melhoriasDoItem ?? {})) : null;
  if (igual) await igual.update({ "system.quantity": num(igual.system?.quantity, 1) + leva });
  else {
    const dados = item.toObject();
    delete dados._id;
    dados.system = { ...dados.system, quantity: leva, container: containerId };
    if ("equipped" in dados.system) dados.system.equipped = false;
    await destino.createEmbeddedDocuments("Item", [dados]);
  }
  if (tem - leva <= 0) await item.delete(); else await item.update({ "system.quantity": tem - leva });
  return { nome: item.name, qtd: leva };
}

/** Faz a troca (no Mestre ou em quem é dono dos dois). op: "pegar" (da mochila para o membro) ou "guardar". */
export async function executarTroca({ op, membroId, donoId, mochilaId, itemId, qtd, destino = null, paraDonoId = null, paraMochilaId = null }) {
  const membro = game.actors.get(membroId);
  const dono = game.actors.get(donoId);
  const mochila = dono?.items.get(mochilaId);
  if (!membro || !dono || !mochila) return false;
  if (!membrosDe(mochila).includes(membro.id)) { console.warn("EPM | mochila compartilhada: personagem não é membro"); return false; }
  if (op === "pegar") {
    const it = dono.items.get(itemId);
    if (!it || it.system?.container !== mochila.id) return false;
    // Destino: solto no inventário (null) ou numa mochila do próprio membro
    const destMochila = destino ? membro.items.get(destino) : null;
    const containerId = destMochila && TIPOS_MOCHILA.includes(destMochila.type) ? destMochila.id : null;
    const r = await moverItem(dono, itemId, membro, qtd, containerId);
    await aviso(membro, `<p><i class="fa-solid fa-people-carry-box" aria-hidden="true"></i> <strong>${escapar(membro.name)}</strong> pegou ${escapar(r.nome)} ×${r.qtd} da mochila compartilhada <strong>${escapar(mochila.name)}</strong> (com ${escapar(dono.name)})${destMochila ? ` e pôs em ${escapar(destMochila.name)}` : ""}.</p>`);
    return true;
  }
  if (op === "passar") {
    // De uma mochila compartilhada para outra (o membro precisa estar nas duas)
    const dono2 = game.actors.get(paraDonoId);
    const mochila2 = dono2?.items.get(paraMochilaId);
    if (!dono2 || !mochila2 || !membrosDe(mochila2).includes(membro.id)) return false;
    const it = dono.items.get(itemId);
    if (!it || it.system?.container !== mochila.id) return false;
    if (dono2.id === dono.id) { await moverDentro(dono, it, mochila2.id, qtd); }
    else await moverItem(dono, itemId, dono2, qtd, mochila2.id);
    await aviso(membro, `<p><i class="fa-solid fa-people-carry-box" aria-hidden="true"></i> <strong>${escapar(membro.name)}</strong> passou ${escapar(it.name)} de <strong>${escapar(mochila.name)}</strong> para <strong>${escapar(mochila2.name)}</strong>.</p>`);
    return true;
  }
  if (op === "guardar") {
    const r = await moverItem(membro, itemId, dono, qtd, mochila.id);
    await aviso(membro, `<p><i class="fa-solid fa-people-carry-box" aria-hidden="true"></i> <strong>${escapar(membro.name)}</strong> guardou ${escapar(r.nome)} ×${r.qtd} na mochila compartilhada <strong>${escapar(mochila.name)}</strong> (com ${escapar(dono.name)}).</p>`);
    return true;
  }
  return false;
}
/** Move parte (ou toda) a pilha para outra mochila do mesmo personagem. */
async function moverDentro(ator, item, containerId, qtd) {
  const tem = num(item.system?.quantity, 1);
  const leva = Math.max(1, Math.min(tem, Math.floor(num(qtd, tem))));
  if (leva >= tem) return item.update({ "system.container": containerId });
  await item.update({ "system.quantity": tem - leva });
  const d = item.toObject(); delete d._id;
  d.system = { ...d.system, quantity: leva, container: containerId };
  return ator.createEmbeddedDocuments("Item", [d]);
}
const aviso = (actor, html) => ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="epm-chat epm-chat-nota" style="--cor: #6FA8DC">${html}</div>` });

async function pedirTroca(dados) {
  const dono = game.actors.get(dados.donoId);
  const membro = game.actors.get(dados.membroId);
  const dono2 = dados.paraDonoId ? game.actors.get(dados.paraDonoId) : null;
  if (dono?.isOwner && membro?.isOwner && (!dono2 || dono2.isOwner)) return executarTroca(dados);
  const { pedirAoMestre } = await import("./mundo.mjs");
  return pedirAoMestre("mochilaCompartilhada", dados);
}

/** Quantas unidades (diálogo só quando há mais de 1). */
async function perguntarQtd(titulo, max) {
  if (max <= 1) return 1;
  const r = await fvtt.DialogV2.wait({
    window: { title: titulo }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<label class="epm-campo"><span>Quantidade (até ${max})</span><input type="number" name="qtd" min="1" max="${max}" value="${max}"></label>`,
    buttons: [{ action: "ok", label: "Confirmar", icon: "fa-solid fa-check", default: true, callback: (ev, b) => num(b.form.elements.qtd.value, max) }, { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
  });
  return typeof r === "number" ? Math.max(1, Math.min(max, Math.floor(r))) : 0;
}

export async function pegar(membro, donoId, mochilaId, itemId, destino = null) {
  const dono = game.actors.get(donoId);
  const it = dono?.items.get(itemId);
  if (!it) return;
  const qtd = await perguntarQtd(`Pegar ${it.name}`, num(it.system?.quantity, 1));
  if (!qtd) return;
  return pedirTroca({ op: "pegar", membroId: membro.id, donoId, mochilaId, itemId, qtd, destino: destino || null });
}

/** Passa um item de uma mochila compartilhada para outra (as duas com este membro). */
export async function passar(membro, donoId, mochilaId, itemId, paraDonoId, paraMochilaId) {
  const dono = game.actors.get(donoId);
  const it = dono?.items.get(itemId);
  if (!it) return;
  const qtd = await perguntarQtd(`Mover ${it.name}`, num(it.system?.quantity, 1));
  if (!qtd) return;
  return pedirTroca({ op: "passar", membroId: membro.id, donoId, mochilaId, itemId, qtd, paraDonoId, paraMochilaId });
}

/**
 * "Mover para…" de um item que está numa mochila compartilhada: inventário, uma mochila do membro
 * ou outra mochila compartilhada com ele.
 */
export async function moverDaCompartilhada(membro, donoId, mochilaId, itemId) {
  const dono = game.actors.get(donoId);
  const it = dono?.items.get(itemId);
  if (!it) return;
  const opcoes = [{ v: "inv:", t: "Seu inventário (fora das mochilas)" },
    ...membro.items.filter(i => TIPOS_MOCHILA.includes(i.type)).map(m => ({ v: `minha:${m.id}`, t: `Sua mochila: ${m.name}` })),
    ...compartilhadasCom(membro).filter(c => c.mochila.id !== mochilaId).map(c => ({ v: `comp:${c.dono.id}:${c.mochila.id}`, t: `${c.mochila.name} (com ${c.dono.name})` }))];
  const max = num(it.system?.quantity, 1);
  const r = await fvtt.DialogV2.wait({
    window: { title: `Mover ${it.name}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<label class="epm-campo"><span>Para</span><select name="destino">${opcoes.map(o => `<option value="${escapar(o.v)}">${escapar(o.t)}</option>`).join("")}</select></label>`
      + (max > 1 ? `<label class="epm-campo"><span>Quantos (de ${max})</span><input type="number" name="qtd" min="1" max="${max}" value="${max}"></label>` : ""),
    buttons: [{ action: "ok", label: "Mover", icon: "fa-solid fa-right-left", default: true, callback: (ev, b) => ({ destino: b.form.elements.destino.value, qtd: b.form.elements.qtd ? num(b.form.elements.qtd.value, max) : max }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
  });
  if (!r || typeof r !== "object") return;
  const qtd = Math.max(1, Math.min(max, Math.floor(num(r.qtd, max))));
  const [tipo, a, b] = String(r.destino).split(":");
  if (tipo === "comp") return pedirTroca({ op: "passar", membroId: membro.id, donoId, mochilaId, itemId, qtd, paraDonoId: a, paraMochilaId: b });
  return pedirTroca({ op: "pegar", membroId: membro.id, donoId, mochilaId, itemId, qtd, destino: tipo === "minha" ? a : null });
}

/** Guarda direto (sem perguntar o item), para o "Mover para…" do inventário. */
export async function guardarQtd(membro, donoId, mochilaId, itemId, qtd) {
  return pedirTroca({ op: "guardar", membroId: membro.id, donoId, mochilaId, itemId, qtd });
}

export async function guardar(membro, donoId, mochilaId, itemId = "") {
  let alvo = itemId ? membro.items.get(itemId) : null;
  if (!alvo) {
    const opcoes = membro.items.filter(i => ["weapon", "equipment", "consumable", "tool", "loot"].includes(i.type))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map(i => `<option value="${i.id}">${escapar(i.name)}${num(i.system?.quantity, 1) > 1 ? ` ×${num(i.system?.quantity, 1)}` : ""}</option>`).join("");
    if (!opcoes) return ui.notifications.info("Nenhum item para guardar.");
    const id = await fvtt.DialogV2.wait({
      window: { title: "Guardar na mochila compartilhada" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
      content: `<label class="epm-campo"><span>Item</span><select name="item">${opcoes}</select></label>`,
      buttons: [{ action: "ok", label: "Escolher", icon: "fa-solid fa-check", default: true, callback: (ev, b) => b.form.elements.item.value }, { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
    });
    if (!id || id === "cancelar") return;
    alvo = membro.items.get(id);
  }
  if (!alvo) return;
  if (TIPOS_MOCHILA.includes(alvo.type)) return ui.notifications.warn("Mochilas não entram em mochilas compartilhadas.");
  const qtd = await perguntarQtd(`Guardar ${alvo.name}`, num(alvo.system?.quantity, 1));
  if (!qtd) return;
  return pedirTroca({ op: "guardar", membroId: membro.id, donoId, mochilaId, itemId: alvo.id, qtd });
}

/* ---------------- Fichas abertas ---------------- */

/** Redesenha as fichas abertas dos membros quando algo muda numa mochila compartilhada. */
export function registrarMochilasCompartilhadas() {
  let pendente = null;
  const redesenhar = actor => {
    if (!actor || actor.documentName !== "Actor") return;
    const ids = new Set();
    for (const m of actor.items ?? []) if (eCompartilhada(m)) membrosDe(m).forEach(id => ids.add(id));
    if (!ids.size) return;
    clearTimeout(pendente);
    pendente = setTimeout(() => {
      for (const id of ids) { const a = game.actors.get(id); if (a?.sheet?.rendered) a.sheet.render(); }
    }, 150);
  };
  for (const h of ["createItem", "updateItem", "deleteItem"]) Hooks.on(h, it => redesenhar(it.parent));
  Hooks.on("updateItem", (it, mud) => {
    if (!mud?.flags?.[FLAG] || !("compartilhada" in mud.flags[FLAG])) return;
    for (const a of game.actors ?? []) if (a.sheet?.rendered) a.sheet.render();
  });
}
