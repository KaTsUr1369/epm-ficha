/**
 * Novas mecânicas: ações em conjunto e Inspiração de Tema.
 *  1. Ataque em dupla: parceiro com afinidade +3 ou mais (vale o menor valor das duas fichas) e Ação Padrão livre.
 *     Um acerto só (o maior bônus dos dois), o dano dos dois soma, com +1 nível de dano.
 *  3. Magia conjunta: dois conjuradores dividem a Mana como quiserem; CD = maior CD dos dois + 2.
 *  6. Inspiração: contador 0 a 3 (o Mestre dá), vantagem, rerrolar e +5 no teste de um aliado.
 * O parceiro (ou o Mestre) confirma pelo socket antes da rolagem.
 */
import { FLAG, MODULE_ID } from "./config.mjs";
import { int, bonusCenaAtivos } from "./data.mjs";
import { fvtt, escapar } from "./helpers.mjs";
import { ataqueDeArma, ataqueCustom, modsDoAtaque } from "./context.mjs";
import { subirNivelDano } from "./opcionais.mjs";

const P = `flags.${FLAG}`;
const CANAL = `module.${MODULE_ID}`;
export const AFINIDADE_DUPLA = 3;
export const INSPIRACAO_MAX = 3;
const ACOES_MARCAVEIS = ["padrao", "bonus", "movimento", "reacao"];
const M = () => import("./mecanicas.mjs");

/* -------------------------------------------- */
/*  Afinidade e parceiros                       */
/* -------------------------------------------- */

function afinidadeDe(a, b) {
  const rel = Object.values(a?.flags?.[FLAG]?.relacoes ?? {}).find(r => r?.uuid && r.uuid === b?.uuid);
  return rel ? int(rel.afinidade) : null;
}

/** Afinidade entre duas fichas: o menor dos dois valores (ou o único que existir). */
export function afinidadeEntre(a, b) {
  const v = [afinidadeDe(a, b), afinidadeDe(b, a)].filter(x => x !== null);
  return v.length ? Math.min(...v) : null;
}

function porUuid(uuid) {
  try { const d = uuid ? fromUuidSync(uuid) : null; return d?.documentName === "Actor" ? d : null; } catch { return null; }
}

/** Quem pode ser parceiro: relações ligadas, quem está no combate e os personagens de jogador. */
function candidatos(actor) {
  const vistos = new Map();
  const add = a => { if (a && a.uuid !== actor.uuid && a.flags?.[FLAG] && !vistos.has(a.uuid)) vistos.set(a.uuid, a); };
  for (const r of Object.values(actor.flags?.[FLAG]?.relacoes ?? {})) if (r?.uuid) add(porUuid(r.uuid));
  for (const c of game.combat?.combatants ?? []) add(c.actor);
  for (const a of game.actors ?? []) if (a.type === "character" && a.hasPlayerOwner) add(a);
  return [...vistos.values()];
}

/** Parceiros do Ataque em dupla: afinidade +3 ou mais e Ação Padrão livre. */
export function parceirosDupla(actor) {
  return candidatos(actor).map(a => ({ a, af: afinidadeEntre(actor, a) }))
    .filter(x => x.af !== null && x.af >= AFINIDADE_DUPLA && !x.a.flags[FLAG].acoes?.padrao)
    .map(x => ({ uuid: x.a.uuid, nome: x.a.name, afinidade: x.af }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Parceiros da Magia conjunta: quem tem Mana (conjurador) e ainda tem a ação da magia. */
export async function parceirosConjunta(actor, acao = "padrao") {
  const { estadoAtor } = await M();
  return candidatos(actor).filter(a => {
    if (ACOES_MARCAVEIS.includes(acao) && a.flags[FLAG].acoes?.[acao]) return false;
    try { return estadoAtor(a).ficha.recursos.pm.max > 0; } catch { return false; }
  }).map(a => {
    const f = (() => { try { return estadoAtor(a).ficha; } catch { return null; } })();
    return { uuid: a.uuid, nome: a.name, pm: (f?.recursos.pm.value ?? 0) + Math.max(0, f?.recursos.pm.temp ?? 0), cd: f?.cd?.valor ?? 0 };
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/* -------------------------------------------- */
/*  Confirmação do parceiro (ou do Mestre)      */
/* -------------------------------------------- */

const pendentes = new Map();
const abertos = new Map();
let ligado = false;

export function registrarCooperacao() {
  if (ligado) return;
  ligado = true;
  aoPedidoDoMestre("pedidoFeito", async d => { const m = game.messages.get(d.mensagem); if (m) await m.update({ [`flags.${FLAG}.pedido.feito`]: true }); });
  aoPedidoDoMestre("inspAjuda", async d => { const m = game.messages.get(d.mensagem); if (m) await somarCinco(m, d.nome, d.uuid); });
  game.socket?.on(CANAL, msg => {
    if (msg?.epm !== "coop") return;
    tratarSocket(msg).catch(err => console.error("EPM | ação em conjunto", err));
  });
}

const emitir = msg => game.socket?.emit(CANAL, { epm: "coop", ...msg });
const souMestreAtivo = () => !!game.user?.isGM && (!game.users?.activeGM || game.users.activeGM.isSelf);

/* Pedidos que só o Mestre grava (ficha de outro jogador): cada módulo registra o seu tratador. */
const TRATADORES_MESTRE = new Map();
export function aoPedidoDoMestre(nome, fn) { TRATADORES_MESTRE.set(nome, fn); }
export async function pedirAoMestreNovas(nome, dados = {}) {
  if (souMestreAtivo()) return TRATADORES_MESTRE.get(nome)?.(dados, game.user.id);
  if (!game.users?.activeGM) { ui.notifications.warn("Precisa de um Mestre conectado para isso."); return false; }
  emitir({ op: "mestre", nome, dados, de: game.user.id });
  return true;
}

/** Faz no parceiro o que o pedido combinou (marcar a ação, pagar Mana). Roda em quem confirmou. */
async function efeitosNoParceiro(ator, efeitos = {}) {
  if (!ator?.isOwner) return;
  const upd = {};
  if (ACOES_MARCAVEIS.includes(efeitos.acao)) upd[`${P}.acoes.${efeitos.acao}`] = true;
  if (int(efeitos.pm) > 0) {
    const { estadoAtor, calcularPerda } = await M();
    Object.assign(upd, calcularPerda(estadoAtor(ator).ficha, "pm", int(efeitos.pm)).updates);
  }
  if (Object.keys(upd).length) await ator.update(upd);
}

function dialogoPedido(msg) {
  return fvtt.DialogV2.wait({
    window: { title: msg.titulo }, classes: ["epm-dialogo"], rejectClose: false, modal: false,
    content: `${msg.html}<p class="epm-dica">Pedido de ${escapar(msg.nomeDe ?? "outro jogador")}. Responda em até ${int(msg.tempo) || 60} s.</p>`,
    buttons: [
      { action: "sim", label: "Aceitar", icon: "fa-solid fa-check", default: true, callback: (ev, b) => ({ ok: true, dados: Object.fromEntries(new FormData(b.form)) }) },
      { action: "nao", label: "Recusar", icon: "fa-solid fa-xmark", callback: () => ({ ok: false }) }
    ],
    render: (ev, app) => { const inst = app?.element ? app : ev?.target; if (inst?.close) abertos.set(msg.id, inst); }
  });
}

async function tratarSocket(msg) {
  if (msg.op === "mestre") {
    if (souMestreAtivo()) await TRATADORES_MESTRE.get(msg.nome)?.(msg.dados ?? {}, msg.de);
    return;
  }
  if (msg.op === "pedir") {
    if (!(msg.alvos ?? []).includes(game.user.id)) return;
    const r = await dialogoPedido(msg);
    abertos.delete(msg.id);
    if (!r || typeof r !== "object") return;
    if (r.ok) await efeitosNoParceiro(porUuid(msg.parceiro), msg.efeitos);
    emitir({ op: "resposta", id: msg.id, para: msg.de, ok: !!r.ok, dados: r.dados ?? {}, quem: game.user.name });
    emitir({ op: "fechar", id: msg.id });
  } else if (msg.op === "resposta") {
    if (msg.para !== game.user.id) return;
    const p = pendentes.get(msg.id);
    if (!p) return;
    clearTimeout(p.timer);
    pendentes.delete(msg.id);
    p.resolve({ ok: msg.ok, dados: msg.dados ?? {}, quem: msg.quem });
  } else if (msg.op === "fechar") {
    const app = abertos.get(msg.id);
    abertos.delete(msg.id);
    app?.close?.();
  }
}

/**
 * Pede a confirmação de quem controla o parceiro (jogador dono conectado ou o Mestre).
 * Se quem pede já controla o parceiro, o diálogo abre aqui mesmo.
 * `efeitos` = { acao, pm }: o que acontece na ficha do parceiro se ele aceitar.
 * Devolve { ok, dados, quem }.
 */
export async function pedirConfirmacao(parceiro, { titulo, html, efeitos = {}, tempo = 60 }) {
  const id = foundry.utils.randomID();
  const msg = { id, titulo, html, tempo, de: game.user.id, nomeDe: game.user.name, parceiro: parceiro.uuid, efeitos };
  if (parceiro.isOwner) {
    const r = await dialogoPedido(msg);
    if (!r || typeof r !== "object" || !r.ok) return { ok: false };
    await efeitosNoParceiro(parceiro, efeitos);
    return { ok: true, dados: r.dados ?? {}, quem: game.user.name };
  }
  const donos = (game.users ?? []).filter(u => u.active && !u.isGM && parceiro.testUserPermission?.(u, "OWNER")).map(u => u.id);
  const alvos = [...new Set([...donos, game.users?.activeGM?.id].filter(Boolean))];
  if (!alvos.length) {
    ui.notifications.warn(`Ninguém conectado pode confirmar por ${parceiro.name}.`);
    return { ok: false };
  }
  ui.notifications.info(`Esperando ${parceiro.name} (ou o Mestre) confirmar…`);
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      pendentes.delete(id);
      emitir({ op: "fechar", id });
      ui.notifications.warn(`${parceiro.name} não respondeu a tempo.`);
      resolve({ ok: false, expirou: true });
    }, (int(tempo) || 60) * 1000);
    pendentes.set(id, { resolve, timer });
    emitir({ op: "pedir", ...msg, alvos });
  });
}

/* -------------------------------------------- */
/*  1. Ataque em dupla                          */
/* -------------------------------------------- */

/** Acerto total de um ataque (perícia + bônus da arma + cena + modificadores da ficha). */
export function acertoDoAtaque(ficha, dados, at) {
  const per = ficha.periciaPorId[at.periciaId];
  return (per?.total ?? 0) + int(at.bonusAcerto) + bonusCenaAtivos(dados).acerto + modsDoAtaque(at, ficha).acerto;
}

/** Ataques que o parceiro pode usar: armas equipadas e ataques próprios. */
function ataquesDoAtor(ator, ficha, dados) {
  const out = [];
  for (const item of ator.items ?? []) {
    if (item.type !== "weapon" || !item.system?.equipped) continue;
    const at = ataqueDeArma(item);
    if (at) out.push({ ref: `arma:${item.id}`, at });
  }
  for (const [id, a] of Object.entries(dados.ataques ?? {})) {
    if (!a) continue;
    const at = ataqueCustom(id, a);
    if (at) out.push({ ref: `custom:${id}`, at });
  }
  return out.map(x => ({ ...x, acerto: acertoDoAtaque(ficha, dados, x.at) }));
}

/** Monta o HTML da escolha de parceiro no diálogo de ataque. */
export function htmlDupla(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const lista = parceirosDupla(actor);
  const minhaLivre = !dados.acoes?.padrao;
  const desab = !minhaLivre || !lista.length;
  const dica = !minhaLivre ? "Sua Ação Padrão já foi usada neste turno." : !lista.length ? `Ninguém com afinidade +${AFINIDADE_DUPLA} e Ação Padrão livre.` : "Gasta a Ação Padrão dos dois. O parceiro (ou o Mestre) confirma antes da rolagem.";
  return `<fieldset class="epm-aquisicao epm-dupla"><legend>Em conjunto</legend>
    <label class="epm-check epm-check-linha" title="${escapar(dica)}"><input type="checkbox" name="dupla" ${desab ? "disabled" : ""}> Ataque em dupla com
      <select name="duplaParceiro" ${desab ? "disabled" : ""}>${lista.map(p => `<option value="${escapar(p.uuid)}">${escapar(p.nome)} (afinidade ${p.afinidade >= 0 ? "+" : ""}${p.afinidade})</option>`).join("") || "<option value=\"\">ninguém</option>"}</select></label>
    <p class="epm-dica">${escapar(dica)}</p></fieldset>`;
}

/**
 * Depois do diálogo: confere de novo, pede a confirmação e devolve o que muda no ataque
 * ({ parceiro, danoParceiro, tipoDano, bonusFontes, notas }) ou null.
 */
export async function prepararDupla(actor, at, uuid) {
  const { estadoAtor, dadosRolagem } = await M();
  const parceiro = porUuid(uuid);
  if (!parceiro) { ui.notifications.warn("Parceiro não encontrado."); return null; }
  const dados = actor.flags?.[FLAG] ?? {};
  if (dados.acoes?.padrao) { ui.notifications.warn("Sua Ação Padrão já foi usada neste turno."); return null; }
  if (parceiro.flags?.[FLAG]?.acoes?.padrao) { ui.notifications.warn(`${parceiro.name} já usou a Ação Padrão.`); return null; }
  const af = afinidadeEntre(actor, parceiro);
  if (af === null || af < AFINIDADE_DUPLA) { ui.notifications.warn(`Precisa de afinidade +${AFINIDADE_DUPLA} com ${parceiro.name}.`); return null; }
  const { ficha: fP } = estadoAtor(parceiro);
  const dP = parceiro.flags[FLAG];
  const ataques = ataquesDoAtor(parceiro, fP, dP);
  const opcoes = ataques.map((x, i) => `<option value="${escapar(x.ref)}" ${i === 0 ? "selected" : ""}>${escapar(x.at.nome)} (acerto ${x.acerto >= 0 ? "+" : ""}${x.acerto}${x.at.dano ? `, dano ${escapar(x.at.dano)}` : ""})</option>`).join("");
  const html = `<p><strong>${escapar(actor.name)}</strong> chama <strong>${escapar(parceiro.name)}</strong> para um <strong>Ataque em dupla</strong> (${escapar(at.nome)}).</p>
    <p class="epm-dica">Um acerto só, com o maior bônus dos dois. O dano dos dois soma, com +1 nível de dano. Gasta a Ação Padrão dos dois.</p>
    ${ataques.length ? `<label class="epm-campo"><span>Com o que ${escapar(parceiro.name)} ataca</span><select name="ataque">${opcoes}</select></label>` : `<p class="epm-dica">${escapar(parceiro.name)} não tem arma equipada nem ataque próprio: entra só com o acerto (${fP.periciaPorId.luta?.total ?? 0}).</p>`}`;
  const r = await pedirConfirmacao(parceiro, { titulo: `Ataque em dupla: ${actor.name}`, html, efeitos: { acao: "padrao" } });
  if (!r.ok) { if (!r.expirou) ui.notifications.info(`${parceiro.name} não aceitou o Ataque em dupla.`); return null; }
  const escolhido = ataques.find(x => x.ref === r.dados?.ataque) ?? ataques[0] ?? null;
  const { ficha: fA } = estadoAtor(actor);
  const acA = acertoDoAtaque(fA, dados, at);
  const acP = escolhido ? escolhido.acerto : (fP.periciaPorId.luta?.total ?? 0);
  const danoParceiro = escolhido?.at?.dano ? Roll.replaceFormulaData(String(escolhido.at.dano), dadosRolagem(parceiro, fP), { missing: "0" }) : "";
  const tipoDano = subirNivelDano(at.tipoDano || escolhido?.at?.tipoDano || "");
  const notas = [
    `Ataque em dupla com ${parceiro.name}${escolhido ? ` (${escolhido.at.nome})` : ""}: um acerto só com o maior bônus (${Math.max(acA, acP) >= 0 ? "+" : ""}${Math.max(acA, acP)}), dano somado, +1 nível de dano (${tipoDano}).`,
    `Gastaram a Ação Padrão: ${actor.name} e ${parceiro.name}${r.quem && r.quem !== game.user.name ? ` (confirmado por ${r.quem})` : ""}.`
  ];
  return {
    parceiro, danoParceiro, tipoDano, tipoDanoParceiro: escolhido?.at?.tipoDano ?? "", notas,
    bonusFontes: acP > acA ? [{ valor: acP - acA, fonte: `Ataque em dupla (acerto de ${parceiro.name})` }] : []
  };
}

/* -------------------------------------------- */
/*  3. Magia conjunta                           */
/* -------------------------------------------- */

/**
 * Antes de pagar a magia: escolhe o parceiro e quanto de Mana cada um paga, pede a confirmação
 * e devolve { parceiro, parteParceiro, cd, nota } ou null.
 */
export async function prepararConjunta(actor, nomeMagia, forma, custoPm, ficha) {
  const acao = forma?.acao ?? "padrao";
  const lista = await parceirosConjunta(actor, acao);
  if (!lista.length) { ui.notifications.warn("Nenhum conjurador por perto com a ação livre para a Magia conjunta."); return null; }
  const custo = Math.max(0, int(custoPm));
  const r = await fvtt.DialogV2.wait({
    window: { title: `Magia conjunta: ${nomeMagia}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p class="epm-dica">Só você precisa conhecer a magia. Os dois gastam a ação da magia e dividem a Mana como quiserem. A CD vira a maior CD dos dois + 2.</p>
      <label class="epm-campo"><span>Com quem</span><select name="parceiro">${lista.map(p => `<option value="${escapar(p.uuid)}">${escapar(p.nome)} (${p.pm} PM, CD ${p.cd})</option>`).join("")}</select></label>
      ${custo ? `<label class="epm-campo"><span>Quanto o parceiro paga (de ${custo} PM)</span><input type="number" name="parte" min="0" max="${custo}" value="${Math.floor(custo / 2)}"></label>` : "<p class=\"epm-dica\">A magia não custa Mana.</p>"}`,
    buttons: [
      { action: "ok", label: "Pedir", icon: "fa-solid fa-people-arrows", default: true, callback: (ev, b) => ({ parceiro: b.form.elements.parceiro.value, parte: int(b.form.elements.parte?.value) }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object") return null;
  const parceiro = porUuid(r.parceiro);
  const info = lista.find(p => p.uuid === r.parceiro);
  if (!parceiro || !info) return null;
  const parte = Math.max(0, Math.min(custo, int(r.parte)));
  if (parte > info.pm) { ui.notifications.warn(`${parceiro.name} tem só ${info.pm} PM.`); return null; }
  const html = `<p><strong>${escapar(actor.name)}</strong> quer conjurar <strong>${escapar(nomeMagia)}</strong> junto com <strong>${escapar(parceiro.name)}</strong>.</p>
    <p>${escapar(parceiro.name)} paga <strong>${parte} PM</strong>${custo ? ` de ${custo}` : ""} e gasta a ação da magia. A CD vira a maior das duas + 2.</p>`;
  const resp = await pedirConfirmacao(parceiro, { titulo: `Magia conjunta: ${actor.name}`, html, efeitos: { acao, pm: parte } });
  if (!resp.ok) { if (!resp.expirou) ui.notifications.info(`${parceiro.name} não aceitou a Magia conjunta.`); return null; }
  const cd = Math.max(ficha.cd.valor, info.cd) + 2;
  return {
    parceiro, parteParceiro: parte, cd, acao,
    nota: `Magia conjunta com ${parceiro.name}: ${parceiro.name} pagou ${parte} PM e gastou a ação. CD ${cd} (maior CD + 2).`
  };
}

/* -------------------------------------------- */
/*  6. Inspiração de Tema                       */
/* -------------------------------------------- */

export const inspiracaoDe = ator => Math.max(0, Math.min(INSPIRACAO_MAX, int(ator?.flags?.[FLAG]?.inspiracao)));

/** O Mestre dá Inspiração (máximo 3 acumuladas). */
export async function darInspiracao(atores = [], qtd = 1) {
  if (!game.user.isGM) return ui.notifications.warn("Só o Mestre dá Inspiração.");
  const nomes = [];
  const cheios = [];
  for (const a of atores) {
    if (!a?.flags) continue;
    const atual = inspiracaoDe(a);
    const novo = Math.max(0, Math.min(INSPIRACAO_MAX, atual + qtd));
    if (novo === atual) { if (qtd > 0) cheios.push(a.name); continue; }
    await a.update({ [`${P}.inspiracao`]: novo, ...(novo === 0 ? { [`${P}.inspiracaoVantagem`]: false } : {}) });
    nomes.push(`${a.name} (${novo})`);
  }
  if (cheios.length) ui.notifications.info(`Já com ${INSPIRACAO_MAX} Inspirações: ${cheios.join(", ")}.`);
  if (!nomes.length || qtd < 0) return;
  return ChatMessage.create({ content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#E8C547"><p><i class="fa-solid fa-feather-pointed" aria-hidden="true"></i> <strong>Inspiração de Tema</strong>: ${escapar(nomes.join(", "))}.</p></div>` });
}

/** Gasta 1 Inspiração (devolve false se não tiver). */
export async function gastarInspiracao(ator, motivo = "") {
  const atual = inspiracaoDe(ator);
  if (atual < 1) { ui.notifications.warn(`${ator.name} não tem Inspiração.`); return false; }
  await ator.update({ [`${P}.inspiracao`]: atual - 1, ...(atual - 1 === 0 ? { [`${P}.inspiracaoVantagem`]: false } : {}) });
  if (motivo) ui.notifications.info(`${ator.name}: −1 Inspiração (${motivo}).`);
  return true;
}

/** Liga ou desliga "próximo teste com vantagem". */
export async function armarInspiracao(ator) {
  const d = ator.flags?.[FLAG] ?? {};
  if (!d.inspiracaoVantagem && inspiracaoDe(ator) < 1) return ui.notifications.warn("Sem Inspiração para gastar.");
  return ator.update({ [`${P}.inspiracaoVantagem`]: !d.inspiracaoVantagem });
}

/** Na hora do teste: se a vantagem estiver armada, gasta 1 Inspiração e devolve true. */
export async function consumirVantagemArmada(ator) {
  const d = ator?.flags?.[FLAG];
  if (!d?.inspiracaoVantagem || !ator.isOwner) return false;
  if (inspiracaoDe(ator) < 1) { await ator.update({ [`${P}.inspiracaoVantagem`]: false }); return false; }
  await ator.update({ [`${P}.inspiracao`]: inspiracaoDe(ator) - 1, [`${P}.inspiracaoVantagem`]: false });
  return true;
}

/** Personagem de quem clica (para o +5 no aliado): o atribuído ou um personagem que ele controla, com Inspiração. */
function meuInspirado(excluirUuid) {
  const lista = game.user?.isGM ? [game.user.character] : [game.user?.character, ...(game.actors ?? []).filter(a => a.isOwner && a.type === "character")];
  return lista.filter(Boolean).find(a => a.uuid !== excluirUuid && a.flags?.[FLAG] && inspiracaoDe(a) >= 1) ?? null;
}

/** Botões de Inspiração nos cartões de teste (rerrolar do dono, +5 de um aliado). */
export function decorarMensagem(mensagem, html) {
  const f = mensagem?.flags?.[FLAG];
  if (f?.tipo !== "teste" || f.rerrolado) return;
  const el = html?.[0] ?? html;
  const alvo = el?.querySelector?.(".message-content");
  if (!alvo || alvo.querySelector(".epm-chat-insp")) return;
  const ator = porUuid(f.actorUuid);
  const botoes = [];
  if (!f.deRerrolagem && ator?.isOwner && inspiracaoDe(ator) >= 1 && (mensagem.isAuthor || game.user?.isGM)) {
    botoes.push(`<button type="button" class="epm-botao epm-botao-mini" data-epm-action="inspRerrolar" title="Gasta 1 Inspiração e rola de novo; fica o novo resultado"><i class="fa-solid fa-rotate"></i> Rerrolar (Inspiração)</button>`);
  }
  const aliado = meuInspirado(f.actorUuid);
  if (aliado && !(f.ajudas ?? []).includes(aliado.uuid)) {
    botoes.push(`<button type="button" class="epm-botao epm-botao-mini" data-epm-action="inspAjudar" data-aliado="${escapar(aliado.uuid)}" title="${escapar(aliado.name)} gasta 1 Inspiração: +5 neste teste"><i class="fa-solid fa-hand-holding-heart"></i> +5 (${escapar(aliado.name)})</button>`);
  }
  if (!botoes.length) return;
  const div = document.createElement("div");
  div.className = "epm-chat epm-chat-insp";
  if (f.actorUuid) div.dataset.actorUuid = f.actorUuid;
  div.innerHTML = botoes.join("");
  alvo.append(div);
}

/** Cliques dos botões de Inspiração. */
export async function cliqueInspiracao(acao, actor, botao) {
  if (acao !== "inspRerrolar" && acao !== "inspAjudar") return false;
  const id = botao.closest("[data-message-id]")?.dataset.messageId;
  const msg = id ? game.messages.get(id) : null;
  const f = msg?.flags?.[FLAG];
  if (!msg || f?.tipo !== "teste") return true;
  const falarDe = a => ChatMessage.getSpeaker({ actor: a });
  if (acao === "inspRerrolar") {
    if (!actor?.isOwner) { ui.notifications.warn("Só o dono do personagem rerrola."); return true; }
    if (f.rerrolado) return true;
    if (!(await gastarInspiracao(actor))) return true;
    const roll = new Roll(f.formula || "1d20");
    await roll.evaluate();
    await roll.toMessage({
      speaker: falarDe(actor),
      flavor: `<span class="epm-flavor"><strong>${escapar(f.rotulo || "Teste")}</strong><em>Rerrolado com Inspiração: fica este resultado (antes ${int(f.total)})</em></span>`,
      flags: { [FLAG]: { ...f, total: roll.total, rerrolado: false, deRerrolagem: true } }
    });
    try { await msg.update({ [`flags.${FLAG}.rerrolado`]: true }); } catch { /* sem permissão: segue */ }
    return true;
  }
  const aliado = porUuid(botao.dataset.aliado);
  if (!aliado?.isOwner) { ui.notifications.warn("Esse personagem não é seu."); return true; }
  if ((f.ajudas ?? []).includes(aliado.uuid)) return true;
  if (!(await gastarInspiracao(aliado))) return true;
  const novo = int(f.total) + 5;
  // O total do próprio cartão é atualizado (quem não é autor pede ao Mestre)
  if (msg.isAuthor || game.user.isGM) await somarCinco(msg, aliado.name, aliado.uuid);
  else await pedirAoMestreNovas("inspAjuda", { mensagem: msg.id, nome: aliado.name, uuid: aliado.uuid });
  await ChatMessage.create({
    speaker: falarDe(aliado),
    content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#E8C547"><p><i class="fa-solid fa-hand-holding-heart" aria-hidden="true"></i> <strong>${escapar(aliado.name)}</strong> inspira ${escapar(actor?.name ?? "o aliado")}: <strong>+5</strong> em ${escapar(f.rotulo || "o teste")} (${int(f.total)} → <strong>${novo}</strong>).</p></div>`
  });
  return true;
}

/** +5 no total do cartão de teste: soma um termo "+ 5" na rolagem e marca quem ajudou. */
export async function somarCinco(msg, nome, uuid) {
  const f = msg?.flags?.[FLAG];
  if (!f || (f.ajudas ?? []).includes(uuid)) return;
  const upd = { [`flags.${FLAG}.ajudas`]: [...(f.ajudas ?? []), uuid], [`flags.${FLAG}.total`]: int(f.total) + 5 };
  try {
    const roll = msg.rolls?.[0];
    if (roll) {
      const dados = roll.toJSON();
      dados.terms = [...dados.terms, { class: "OperatorTerm", operator: "+", evaluated: true, options: {} }, { class: "NumericTerm", number: 5, evaluated: true, options: { flavor: `Inspiração de ${nome}` } }];
      dados.formula = `${dados.formula} + 5[Inspiração de ${nome}]`;
      dados.total = roll.total + 5;
      upd.rolls = [JSON.stringify(Roll.fromData(dados).toJSON())];
      upd.content = String(roll.total + 5);
    }
  } catch (err) { console.warn("EPM | +5 no cartão", err); }
  await msg.update(upd);
}
