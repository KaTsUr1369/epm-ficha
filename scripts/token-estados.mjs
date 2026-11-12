/**
 * Imagens do token por estado: Normal, Insano (Sanidade < 50%), Machucado (Vida < 50%), Morrendo, Morto
 * e Transformado (a imagem da transformação ativa). Quando mais de um vale ao mesmo tempo, o dono ou o Mestre
 * escolhe qual usar (na ficha ou no HUD do token); sem escolha, vale a prioridade Morto > Morrendo > Transformado > Machucado > Insano.
 */
import { FLAG } from "./config.mjs";

const P = `flags.${FLAG}`;
const n = v => Number(v) || 0;

export const ESTADOS_TOKEN = [
  { id: "normal", label: "Normal", dica: "Imagem de sempre" },
  { id: "insano", label: "Insano", dica: "Sanidade abaixo de 50%" },
  { id: "machucado", label: "Machucado", dica: "Vida abaixo de 50%" },
  { id: "morrendo", label: "Morrendo", dica: "Vida 0 ou condição Morrendo" },
  { id: "morto", label: "Morto", dica: "Condição Morto (derrotado)" }
];
const PRIORIDADE = ["morto", "morrendo", "transformado", "machucado", "insano"];

/** Estados que valem agora e têm imagem: [{ id, label, img }]. */
export function estadosAtivos(actor) {
  const d = actor?.flags?.[FLAG] ?? {};
  const imgs = d.tokensEstado ?? {};
  const st = actor?.statuses ?? new Set();
  const hp = actor?.system?.attributes?.hp ?? {};
  const ps = d.recursos?.ps ?? {};
  const vale = {
    morto: st.has("dead") || st.has("epm-morto"),
    morrendo: (n(hp.max) > 0 && n(hp.value) <= 0) || st.has("epm-morrendo"),
    insano: n(ps.max) > 0 && n(ps.value) / n(ps.max) < 0.5,
    machucado: n(hp.max) > 0 && n(hp.value) > 0 && n(hp.value) / n(hp.max) < 0.5
  };
  const out = [];
  for (const id of PRIORIDADE) {
    if (id === "transformado") {
      const tid = d.transformacao?.ativa;
      const t = tid ? d.transformacoes?.[tid] : null;
      if (t?.img && t.trocarToken) out.push({ id: `transf:${tid}`, label: `Transformado: ${t.nome || "Transformação"}`, img: t.img });
      continue;
    }
    if (vale[id] && imgs[id]) out.push({ id, label: ESTADOS_TOKEN.find(e => e.id === id).label, img: imgs[id] });
  }
  return out;
}

/** Imagem que o token deve usar agora. */
export function imagemAtual(actor) {
  const d = actor?.flags?.[FLAG] ?? {};
  const ativos = estadosAtivos(actor);
  const escolhido = ativos.find(e => e.id === d.tokenEscolha);
  if (escolhido) return escolhido.img;
  if (d.tokenEscolha === "normal" || !ativos.length) return d.tokensEstado?.normal || null;
  return ativos[0].img;
}

/** Aplica a imagem do estado em todos os tokens do personagem nas cenas abertas. */
export async function aplicarTokenEstado(actor) {
  if (!actor) return;
  const img = imagemAtual(actor);
  for (const t of actor.getActiveTokens?.(false, true) ?? []) {
    const doc = t.document ?? t;
    if (!doc?.isOwner) continue;
    const original = doc.getFlag?.(FLAG, "imgOriginal") ?? doc.getFlag?.(FLAG, "imgAntesTransformar");
    const atual = doc.texture?.src;
    try {
      if (img) {
        if (atual === img) continue;
        const upd = { "texture.src": img };
        if (!original) upd[`flags.${FLAG}.imgOriginal`] = atual;
        await doc.update(upd);
      } else if (original) {
        await doc.update({ "texture.src": original, [`flags.${FLAG}.-=imgOriginal`]: null, [`flags.${FLAG}.-=imgAntesTransformar`]: null });
      }
    } catch (err) { console.warn("EPM | imagem do token", err); }
  }
}

/** Só um cliente aplica: o dono jogador ativo ou, sem ele, o Mestre ativo. */
function souResponsavel(actor) {
  const usuarios = game.users;
  if (!usuarios?.filter) return false;
  const donos = usuarios.filter(u => u.active && !u.isGM && actor.testUserPermission?.(u, "OWNER"));
  return !!(donos[0] ?? usuarios.activeGM)?.isSelf;
}
const pendentes = new Map();
export function agendarTokenEstado(actor) {
  if (!actor?.flags?.[FLAG] || !souResponsavel(actor)) return;
  clearTimeout(pendentes.get(actor.id));
  pendentes.set(actor.id, setTimeout(() => { pendentes.delete(actor.id); aplicarTokenEstado(actor); }, 150));
}

/** Escolher a imagem (ficha ou HUD). */
export async function escolherTokenEstado(actor) {
  if (!actor?.isOwner) return;
  const d = actor.flags?.[FLAG] ?? {};
  const ativos = estadosAtivos(actor);
  const opcoes = [{ id: "", label: "Automático (prioridade)", img: "" }, { id: "normal", label: "Normal", img: d.tokensEstado?.normal || actor.prototypeToken?.texture?.src || "" }, ...ativos];
  const html = opcoes.map(o => `<label class="epm-token-opcao"><input type="radio" name="estado" value="${o.id}" ${(d.tokenEscolha ?? "") === o.id ? "checked" : ""}>${o.img ? `<img src="${o.img}" alt="" width="48" height="48">` : ""}<span>${o.label}</span></label>`).join("");
  const r = await foundry.applications.api.DialogV2.prompt({
    window: { title: `Imagem do token: ${actor.name}` },
    content: `<div class="epm-token-opcoes">${html}</div><p class="hint">Só aparecem os estados que valem agora e têm imagem.</p>`,
    ok: { label: "Usar", callback: (ev, botao) => botao.form.elements.estado.value }, rejectClose: false
  });
  if (r === null || r === undefined) return;
  await actor.update({ [`${P}.tokenEscolha`]: r });
}

/** Botão no HUD do token. */
export function botaoHudToken(hud, html) {
  const actor = hud.object?.actor;
  if (!actor?.isOwner || !actor.flags?.[FLAG]) return;
  const raiz = html instanceof HTMLElement ? html : html?.[0];
  const col = raiz?.querySelector(".col.left");
  if (!col || col.querySelector(".epm-hud-token")) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "control-icon epm-hud-token";
  b.dataset.tooltip = "Imagem do token (EPM)";
  b.innerHTML = '<i class="fa-solid fa-masks-theater"></i>';
  b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); escolherTokenEstado(actor); });
  col.append(b);
}
