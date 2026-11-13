/**
 * Novas mecânicas: vínculos entre personagens.
 *   9. Histórico de afinidade: data do Simple Calendar, motivo opcional e eventos rápidos do Mestre.
 *  10. Juramentos: promessas entre dois personagens, nas duas fichas; quebrar sorteia uma Maldição Memética Boa.
 *  16. Âncoras (opcional): pessoa, objeto ou juramento; Interagir recupera 1d6 de Sanidade por dia.
 *  20. Purificação e transferência de maldição (opcional, só o Mestre).
 */
import { FLAG, AFINIDADE, MOEDAS } from "./config.mjs";
import { int, num, pagarMoedas, formatarMoedas, valorEmCobre } from "./data.mjs";
import { fvtt, escapar } from "./helpers.mjs";
import { CATALOGO, dadosNovaEntrada } from "./bencaos.mjs";
import { pedirConfirmacao, pedirAoMestreNovas, aoPedidoDoMestre } from "./cooperacao.mjs";
import { eventosAfinidade } from "./opcionais.mjs";
import { dataDoMundo } from "./calendario.mjs";

export { dataDoMundo };

const P = `flags.${FLAG}`;
const M = () => import("./mecanicas.mjs");
const X = () => import("./extras.mjs");
const falar = a => ChatMessage.getSpeaker({ actor: a });
const nota = (ator, html, cor = "#A47DDB", extra = {}) => ChatMessage.create({ speaker: ator ? falar(ator) : undefined, flags: { [FLAG]: { automatico: true } }, content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:${cor}">${html}</div>`, ...extra });
const porUuid = uuid => { try { const d = uuid ? fromUuidSync(uuid) : null; return d?.documentName === "Actor" ? d : null; } catch { return null; } };

/* -------------------------------------------- */
/*  9. Data do calendário e eventos rápidos     */
/* -------------------------------------------- */

/** Botão rápido do Mestre: muda a afinidade com o motivo do evento (e na ficha de volta, se for de jogador). */
export async function eventoAfinidade(ator, relId, indice) {
  if (!game.user.isGM) return ui.notifications.warn("Só o Mestre usa os eventos rápidos.");
  const ev = eventosAfinidade()[int(indice)];
  if (!ev) return;
  const { ajustarAfinidade } = await X();
  await ajustarAfinidade(ator, relId, ev.delta, { origem: "Evento", motivo: ev.nome });
}

/* -------------------------------------------- */
/*  10. Juramentos                              */
/* -------------------------------------------- */

export const ESTADOS_JURAMENTO = { ativo: "Ativo", cumprido: "Cumprido", quebrado: "Quebrado" };

/** Grava (ou atualiza) o juramento nas duas fichas. Roda em quem pode editar as duas (ou no Mestre). */
async function gravarJuramento({ jid, dados, uuids }) {
  for (const uuid of uuids) {
    const a = porUuid(uuid);
    if (!a?.flags?.[FLAG] || !a.isOwner) continue;
    await a.update({ [`${P}.juramentos.${jid}`]: dados });
  }
}

/** Liga o tratador do Mestre (chamado no "ready"). */
export function registrarVinculos() {
  aoPedidoDoMestre("juramento", dados => gravarJuramento(dados));
}

async function salvarNasDuas(jid, dados) {
  const uuids = [dados.quem, dados.com].filter(Boolean);
  const todosMeus = uuids.every(u => porUuid(u)?.isOwner);
  if (todosMeus) return gravarJuramento({ jid, dados, uuids });
  // A minha ficha eu gravo; a do outro, o Mestre
  for (const u of uuids) { const a = porUuid(u); if (a?.isOwner) await a.update({ [`${P}.juramentos.${jid}`]: dados }); }
  return pedirAoMestreNovas("juramento", { jid, dados, uuids: uuids.filter(u => !porUuid(u)?.isOwner) });
}

/** Novo juramento: com quem (relação ligada), quem prometeu e o texto. */
export async function novoJuramento(ator) {
  const rels = Object.values(ator.flags?.[FLAG]?.relacoes ?? {}).filter(r => r?.uuid && porUuid(r.uuid));
  if (!rels.length) return ui.notifications.warn("Conecte o outro personagem na aba Relações antes do juramento.");
  const r = await fvtt.DialogV2.wait({
    window: { title: "Novo juramento" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<label class="epm-campo"><span>Com quem</span><select name="com">${rels.map(x => `<option value="${escapar(x.uuid)}">${escapar(porUuid(x.uuid)?.name ?? x.nome)}</option>`).join("")}</select></label>
      <label class="epm-campo"><span>Quem prometeu</span><select name="quem"><option value="eu">${escapar(ator.name)}</option><option value="outro">o outro personagem</option></select></label>
      <label class="epm-campo"><span>A promessa</span><textarea name="texto" rows="3" placeholder="Prometo proteger a vila de Aster até o fim da guerra."></textarea></label>`,
    buttons: [{ action: "ok", label: "Jurar", icon: "fa-solid fa-handshake", default: true, callback: (ev, b) => ({ com: b.form.elements.com.value, quem: b.form.elements.quem.value, texto: b.form.elements.texto.value.trim() }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
  });
  if (!r || typeof r !== "object" || !r.texto) return;
  const outro = porUuid(r.com);
  if (!outro) return;
  const quem = r.quem === "outro" ? outro : ator;
  const com = r.quem === "outro" ? ator : outro;
  const jid = foundry.utils.randomID();
  const dados = { texto: r.texto, quem: quem.uuid, quemNome: quem.name, com: com.uuid, comNome: com.name, data: dataDoMundo(), quando: Date.now(), estado: "ativo" };
  await salvarNasDuas(jid, dados);
  return nota(quem, `<p><i class="fa-solid fa-handshake" aria-hidden="true"></i> <strong>Juramento</strong>: ${escapar(quem.name)} promete a ${escapar(com.name)}:</p><blockquote>${escapar(r.texto)}</blockquote>`, "#C9A24E");
}

/** Cumprido (qualquer um dos dois) ou Quebrado (só o Mestre: sorteia uma Maldição Memética Boa para quem prometeu). */
export async function mudarJuramento(ator, jid, estado) {
  const j = ator.flags?.[FLAG]?.juramentos?.[jid];
  if (!j || !ESTADOS_JURAMENTO[estado] || j.estado === estado) return;
  if (estado === "quebrado" && !game.user.isGM) return ui.notifications.warn("Só o Mestre marca um juramento como quebrado.");
  if (estado === "quebrado") {
    const ok = await fvtt.DialogV2.confirm({ window: { title: "Quebrar juramento" }, content: `<p>${escapar(j.quemNome)} quebrou o juramento?</p><blockquote>${escapar(j.texto)}</blockquote><p>Uma Maldição Memética Boa é sorteada e vai para a ficha de ${escapar(j.quemNome)}.</p>`, rejectClose: false });
    if (!ok) return;
  }
  const dados = { ...j, estado, mudou: Date.now(), dataEstado: dataDoMundo() };
  await salvarNasDuas(jid, dados);
  if (estado === "cumprido") return nota(porUuid(j.quem) ?? ator, `<p><i class="fa-solid fa-handshake" aria-hidden="true"></i> <strong>Juramento cumprido</strong>: ${escapar(j.quemNome)} cumpriu a promessa a ${escapar(j.comNome)}.</p><blockquote>${escapar(j.texto)}</blockquote>`, "#4E9A5B");
  if (estado === "quebrado") {
    await amaldicoarQuebra(porUuid(j.quem), j);
    if (game.user.isGM) await verificarAncoras({ juramento: jid });
  }
}

/** Sorteia uma Maldição Memética Boa do catálogo e coloca na ficha de quem quebrou. */
export async function amaldicoarQuebra(ator, j) {
  const opcoes = CATALOGO.filter(c => c.tipo === "maldicao" && c.natureza === "memetica" && c.raridade === "boa" && !c.extra);
  if (!ator || !opcoes.length) return null;
  const r = new Roll(`1d${opcoes.length}`);
  await r.evaluate();
  const c = opcoes[r.total - 1] ?? opcoes[0];
  await ator.update({ [`${P}.bencaos.${foundry.utils.randomID()}`]: dadosNovaEntrada(c, { escolha: c.escolha?.sugestoes?.[0] ?? "", novoIdFn: () => foundry.utils.randomID() }) });
  return nota(ator, `<p><i class="fa-solid fa-skull" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> quebrou o juramento feito a ${escapar(j.comNome ?? "")}.</p><blockquote>${escapar(j.texto ?? "")}</blockquote>
    <p>Maldição sorteada (1d${opcoes.length} = ${r.total}): <strong>${escapar(c.nome)}</strong> (Memética, Boa).</p><p>${escapar(c.efeito ?? "")}</p>`, "#B0479A");
}

export async function apagarJuramento(ator, jid) {
  if (!ator.flags?.[FLAG]?.juramentos?.[jid]) return;
  return ator.update({ [`${P}.juramentos.-=${jid}`]: null });
}

/* -------------------------------------------- */
/*  16. Âncoras                                 */
/* -------------------------------------------- */

export const MAX_ANCORAS = 3;
export const AFINIDADE_ANCORA = 4;
export const PERDA_ANCORA = 20;
export const TIPOS_ANCORA = { pessoa: "Pessoa", objeto: "Objeto", juramento: "Juramento" };

/** Opções de âncora de cada tipo (pessoa: afinidade +4; objeto: item; juramento: não quebrado). */
export function opcoesAncora(ator) {
  const d = ator.flags?.[FLAG] ?? {};
  return {
    pessoa: Object.entries(d.relacoes ?? {}).filter(([, r]) => r && int(r.afinidade) >= AFINIDADE_ANCORA).map(([id, r]) => ({ id, nome: porUuid(r.uuid)?.name ?? r.nome ?? "Relação" })),
    objeto: (ator.items ?? []).filter(i => !["feat", "spell", "class", "subclass", "background", "race"].includes(i.type)).map(i => ({ id: i.id, nome: i.name })),
    juramento: Object.entries(d.juramentos ?? {}).filter(([, j]) => j && j.estado !== "quebrado").map(([id, j]) => ({ id, nome: j.texto?.slice(0, 60) ?? "Juramento" }))
  };
}

export async function novaAncora(ator) {
  const d = ator.flags?.[FLAG] ?? {};
  if (Object.values(d.ancoras ?? {}).filter(Boolean).length >= MAX_ANCORAS) return ui.notifications.warn(`No máximo ${MAX_ANCORAS} âncoras.`);
  const op = opcoesAncora(ator);
  const grupo = (tipo, lista) => lista.length ? `<optgroup label="${TIPOS_ANCORA[tipo]}">${lista.map(x => `<option value="${tipo}:${escapar(x.id)}">${escapar(x.nome)}</option>`).join("")}</optgroup>` : "";
  const html = grupo("pessoa", op.pessoa) + grupo("objeto", op.objeto) + grupo("juramento", op.juramento);
  if (!html) return ui.notifications.warn(`Nada pode virar âncora ainda: uma pessoa com afinidade +${AFINIDADE_ANCORA}, um item ou um juramento.`);
  const r = await fvtt.DialogV2.wait({
    window: { title: "Nova âncora" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<label class="epm-campo"><span>Âncora</span><select name="ref">${html}</select></label><p class="epm-dica">Pessoa: relação com afinidade +${AFINIDADE_ANCORA} ou mais. Objeto: um item. Juramento: um juramento não quebrado.</p>`,
    buttons: [{ action: "ok", label: "Ancorar", icon: "fa-solid fa-anchor", default: true, callback: (ev, b) => ({ ref: b.form.elements.ref.value }) }, { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
  });
  if (!r?.ref) return;
  const [tipo, ...resto] = String(r.ref).split(":");
  const ref = resto.join(":");
  const nome = op[tipo]?.find(x => x.id === ref)?.nome ?? "";
  return ator.update({ [`${P}.ancoras.${foundry.utils.randomID()}`]: { tipo, ref, nome, usada: false, criado: Date.now() } });
}

/** Interagir: 1d6 de Sanidade, uma vez por dia por âncora (recarrega no descanso longo). */
export async function interagirAncora(ator, aid) {
  const a = ator.flags?.[FLAG]?.ancoras?.[aid];
  if (!a) return;
  if (a.usada) return ui.notifications.warn("Esta âncora já foi usada hoje (recarrega no descanso longo).");
  const { estadoAtor, calcularRecuperacao } = await M();
  const roll = new Roll("1d6");
  await roll.evaluate();
  const r = calcularRecuperacao(estadoAtor(ator).ficha, "ps", roll.total, { fonte: `âncora: ${a.nome}` });
  await ator.update({ ...r.updates, [`${P}.ancoras.${aid}.usada`]: true });
  await roll.toMessage({ speaker: falar(ator), flags: { [FLAG]: { automatico: true } }, flavor: `<span class="epm-flavor"><strong>Âncora: ${escapar(a.nome || TIPOS_ANCORA[a.tipo])}</strong><em>${escapar(r.texto || "Sanidade")}</em></span>` });
}

/** Perdida (só o Mestre): −20 de Sanidade e o espaço fica livre. */
export async function perderAncora(ator, aid, motivo = "") {
  if (!game.user.isGM) return ui.notifications.warn("Só o Mestre marca uma âncora como perdida.");
  const a = ator.flags?.[FLAG]?.ancoras?.[aid];
  if (!a) return;
  const ok = await fvtt.DialogV2.confirm({ window: { title: "Âncora perdida" }, content: `${motivo ? `<p><strong>${escapar(motivo)}</strong></p>` : ""}<p>${escapar(ator.name)} perdeu a âncora <strong>${escapar(a.nome)}</strong>?</p><p>Tira ${PERDA_ANCORA} de Sanidade e libera o espaço.</p>`, rejectClose: false });
  if (!ok) return;
  const { estadoAtor, calcularPerda } = await M();
  const perda = calcularPerda(estadoAtor(ator).ficha, "ps", PERDA_ANCORA);
  await ator.update({ ...perda.updates, [`${P}.ancoras.-=${aid}`]: null });
  return nota(ator, `<p><i class="fa-solid fa-anchor-circle-xmark" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> perdeu a âncora <strong>${escapar(a.nome)}</strong>: −${PERDA_ANCORA} de Sanidade.</p>`, "#7A4FA0");
}

const souMestreAtivo = () => !!game.user?.isGM && (!game.users?.activeGM || game.users.activeGM.isSelf);

/** A ficha detectou que uma âncora se perdeu: o Mestre confirma. */
export async function verificarAncoras({ itemDe = null, itemId = "", morto = null, juramento = "" } = {}) {
  if (!souMestreAtivo()) return;
  const { regra } = await import("./opcionais.mjs");
  if (!regra("ancoras")) return;
  for (const ator of game.actors ?? []) {
    for (const [aid, a] of Object.entries(ator.flags?.[FLAG]?.ancoras ?? {})) {
      if (!a) continue;
      let motivo = "";
      if (a.tipo === "objeto" && itemDe?.uuid === ator.uuid && a.ref === itemId) motivo = `${a.nome} saiu do inventário.`;
      if (a.tipo === "pessoa" && morto) { const rel = ator.flags[FLAG].relacoes?.[a.ref]; if (rel?.uuid && rel.uuid === morto.uuid) motivo = `${morto.name} está Morto.`; }
      if (a.tipo === "juramento" && juramento && a.ref === juramento) motivo = "O juramento foi quebrado.";
      // A ficha detecta e o Mestre confirma
      if (motivo) {
        const { confirmar } = await import("./mecanicas.mjs");
        const ok = await confirmar("Âncora perdida?", `<p>${escapar(ator.name)}: a âncora <strong>${escapar(a.nome || "sem nome")}</strong> parece perdida. ${escapar(motivo)}</p><p>Marcar como Perdida (−20 de Sanidade e libera o espaço)?</p>`);
        if (ok) await perderAncora(ator, aid, motivo);
      }
    }
  }
}

/** Descanso longo: as âncoras recarregam. */
export function recarregarAncoras(dados) {
  const upd = {};
  for (const [id, a] of Object.entries(dados?.ancoras ?? {})) if (a?.usada) upd[`${P}.ancoras.${id}.usada`] = false;
  return upd;
}

/* -------------------------------------------- */
/*  20. Purificação e transferência             */
/* -------------------------------------------- */

export async function purificarMaldicao(ator, bid) {
  if (!game.user.isGM) return ui.notifications.warn("Só o Mestre purifica maldições.");
  const b = ator.flags?.[FLAG]?.bencaos?.[bid];
  if (!b || b.tipo !== "maldicao") return;
  const r = await fvtt.DialogV2.wait({
    window: { title: `Purificar: ${b.nome}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>Remove <strong>${escapar(b.nome)}</strong> de ${escapar(ator.name)} mediante pagamento.</p>
      <label class="epm-campo"><span>Pagamento</span><select name="tipo"><option value="moedas">Moedas</option><option value="sanidade">Sanidade</option><option value="sacrificio">Sacrifício</option></select></label>
      <div class="epm-dialogo-linha">
        <label class="epm-campo"><span>Valor (moedas ou Sanidade)</span><input type="number" name="valor" min="0" value="0"></label>
        <label class="epm-campo"><span>Moeda</span><select name="moeda">${MOEDAS.map(m => `<option value="${m.id}" ${m.id === "po" ? "selected" : ""}>${m.label}</option>`).join("")}</select></label>
      </div>
      <label class="epm-campo"><span>Sacrifício (texto livre)</span><input type="text" name="sacrificio" placeholder="A espada do pai, oferecida no altar"></label>`,
    buttons: [{ action: "ok", label: "Purificar", icon: "fa-solid fa-hand-sparkles", default: true, callback: (ev, b2) => Object.fromEntries(new FormData(b2.form)) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
  });
  if (!r || typeof r !== "object") return;
  const upd = {};
  let paga = "";
  if (r.tipo === "moedas") {
    const moeda = MOEDAS.find(m => m.id === r.moeda) ?? MOEDAS[2];
    const custo = Math.max(0, Math.floor(num(r.valor) * moeda.valor));
    const novas = pagarMoedas(ator.flags[FLAG].moedas, custo);
    if (!novas) return ui.notifications.warn(`${ator.name} não tem ${formatarMoedas(custo)} (tem ${formatarMoedas(valorEmCobre(ator.flags[FLAG].moedas))}).`);
    for (const [k, v] of Object.entries(novas)) upd[`${P}.moedas.${k}`] = v;
    paga = formatarMoedas(custo);
  } else if (r.tipo === "sanidade") {
    const { estadoAtor, calcularPerda } = await M();
    const valor = Math.max(0, int(r.valor));
    Object.assign(upd, calcularPerda(estadoAtor(ator).ficha, "ps", valor).updates);
    paga = `${valor} de Sanidade`;
  } else {
    if (!String(r.sacrificio ?? "").trim()) return ui.notifications.warn("Descreva o sacrifício.");
    paga = `sacrifício: ${String(r.sacrificio).trim()}`;
  }
  upd[`${P}.bencaos.-=${bid}`] = null;
  await ator.update(upd);
  return nota(ator, `<p><i class="fa-solid fa-hand-sparkles" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> foi purificado de <strong>${escapar(b.nome)}</strong> (${escapar(paga)}).</p>`, "#7FB4E6");
}

export async function transferirMaldicao(ator, bid) {
  if (!game.user.isGM) return ui.notifications.warn("Só o Mestre transfere maldições.");
  const b = ator.flags?.[FLAG]?.bencaos?.[bid];
  if (!b || b.tipo !== "maldicao") return;
  const alvos = (game.actors ?? []).filter(a => a.uuid !== ator.uuid && a.flags?.[FLAG] && ["character", "npc"].includes(a.type))
    .sort((a, c) => a.name.localeCompare(c.name, "pt-BR"));
  if (!alvos.length) return;
  const r = await fvtt.DialogV2.wait({
    window: { title: `Transferir: ${b.nome}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<label class="epm-campo"><span>Para quem</span><select name="para">${alvos.map(a => `<option value="${escapar(a.uuid)}">${escapar(a.name)}</option>`).join("")}</select></label><p class="epm-dica">Quem recebe precisa aceitar.</p>`,
    buttons: [{ action: "ok", label: "Pedir", icon: "fa-solid fa-right-left", default: true, callback: (ev, b2) => ({ para: b2.form.elements.para.value }) }, { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
  });
  if (!r?.para) return;
  const alvo = porUuid(r.para);
  if (!alvo) return;
  const resp = await pedirConfirmacao(alvo, {
    titulo: `Maldição: ${b.nome}`,
    html: `<p>A maldição <strong>${escapar(b.nome)}</strong> de ${escapar(ator.name)} vai passar para <strong>${escapar(alvo.name)}</strong>.</p><p>${escapar(b.efeito ?? b.descricao ?? "")}</p><p>${escapar(alvo.name)} aceita?</p>`
  });
  if (!resp.ok) { if (!resp.expirou) ui.notifications.info(`${alvo.name} não aceitou a maldição.`); return; }
  const copia = foundry.utils.deepClone(b);
  await alvo.update({ [`${P}.bencaos.${foundry.utils.randomID()}`]: copia });
  await ator.update({ [`${P}.bencaos.-=${bid}`]: null });
  return nota(alvo, `<p><i class="fa-solid fa-right-left" aria-hidden="true"></i> A maldição <strong>${escapar(b.nome)}</strong> passou de ${escapar(ator.name)} para <strong>${escapar(alvo.name)}</strong>, que aceitou.</p>`, "#B0479A");
}

export { AFINIDADE };
