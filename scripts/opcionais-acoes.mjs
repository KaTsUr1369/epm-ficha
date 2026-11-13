/**
 * Regras opcionais (Escudo do Mestre → Ajustes): o que acontece na mesa.
 *  13. Falha crítica com tabela   14. Chefes com fases   15. Aura de Horror
 *  18. Maestria de arma           19. Feitos e títulos   22. Atividades de descanso
 * Cada função confere se a regra está ligada antes de agir.
 */
import { FLAG, CONDICOES } from "./config.mjs";
import { int, num } from "./data.mjs";
import { fvtt, escapar } from "./helpers.mjs";
import { regra, listaFeitos, chaveTipoArma, MARCOS_MAESTRIA, fasesCruzadas } from "./opcionais.mjs";
import { aoPedidoDoMestre, pedirAoMestreNovas } from "./cooperacao.mjs";
import { dataDoMundo } from "./calendario.mjs";

const P = `flags.${FLAG}`;
const M = () => import("./mecanicas.mjs");
const falar = a => ChatMessage.getSpeaker({ actor: a });
const cartao = (ator, html, cor = "#A47DDB", extra = {}) => ChatMessage.create({ speaker: ator ? falar(ator) : undefined, content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:${cor}">${html}</div>`, ...extra });
const souMestreAtivo = () => !!game.user?.isGM && (!game.users?.activeGM || game.users.activeGM.isSelf);
const porUuid = uuid => { try { const d = uuid ? fromUuidSync(uuid) : null; return d?.documentName === "Actor" ? d : null; } catch { return null; } };
const nomeCond = id => CONDICOES.find(c => c.id === id)?.label ?? id;

/* -------------------------------------------- */
/*  13. Falha crítica com tabela                */
/* -------------------------------------------- */

export const TABELA_FALHA = [
  { n: 1, id: "cai", texto: "A arma cai." },
  { n: 2, id: "caido", texto: "Fica Caído." },
  { n: 3, id: "desprevenido", texto: "Fica Desprevenido até o próximo turno." },
  { n: 4, id: "aliado", texto: "Acerta um aliado perto." }
];

/** Aliados perto de quem errou: no combate, os do mesmo lado; fora dele, os personagens de jogador. */
function aliadosDe(ator) {
  const token = ator.getActiveTokens?.()[0]?.document ?? null;
  const lado = token?.disposition;
  const doCombate = (game.combat?.combatants ?? []).map(c => ({ a: c.actor, d: c.token?.disposition })).filter(x => x.a && x.a.uuid !== ator.uuid);
  const lista = doCombate.length ? doCombate.filter(x => lado === undefined || x.d === lado).map(x => x.a)
    : (game.actors ?? []).filter(a => a.type === "character" && a.hasPlayerOwner && a.uuid !== ator.uuid);
  return [...new Map(lista.map(a => [a.uuid, a])).values()];
}

/** 1 natural num ataque: rola 1d4. 1 a 3 entram sozinhos; no 4 o Mestre escolhe o aliado no cartão. */
export async function falhaCritica(ator, at) {
  if (!regra("falhaCritica")) return null;
  const r = new Roll("1d4");
  await r.evaluate();
  const linha = TABELA_FALHA[r.total - 1] ?? TABELA_FALHA[0];
  let feito = "";
  // A ficha pergunta antes de aplicar (patch: "Com a regra ligada, a ficha pergunta antes de aplicar o resultado")
  let aplicar = ator.isOwner && linha.id !== "aliado";
  if (aplicar) {
    const { confirmar } = await M();
    aplicar = await confirmar("Falha crítica", `<p>1d4 = <strong>${r.total}</strong>: ${escapar(linha.texto)}</p><p>Aplicar agora na ficha de ${escapar(ator.name)}?</p>`);
    if (!aplicar) feito = "Não aplicado (a ficha perguntou e a resposta foi não).";
  }
  if (aplicar) {
    if (linha.id === "cai") {
      const item = at?.tipo === "arma" ? ator.items.get(at.id) : null;
      if (item?.system?.equipped) { await item.update({ "system.equipped": false }); feito = `${item.name} foi desequipada.`; }
      else feito = "Sem arma equipada para cair.";
    } else if (linha.id !== "aliado") {
      const id = linha.id === "caido" ? "epm-caido" : "epm-desprevenido";
      try { if (!ator.statuses?.has(id)) await ator.toggleStatusEffect(id, { active: true }); } catch (err) { console.warn("EPM |", err); }
      if (linha.id === "desprevenido") await ator.update({ [`${P}.falhaDesprevenido`]: true });
      feito = linha.id === "caido" ? "Caído aplicado." : "Desprevenido aplicado (sai no próximo turno).";
    }
  }
  let botoes = "";
  if (linha.id === "aliado") {
    const aliados = aliadosDe(ator);
    botoes = at?.dano && aliados.length
      ? `<p class="epm-dica">Mestre: escolha o aliado atingido (o dano é rolado e aplicado).</p><p>${aliados.map(a => `<button type="button" class="epm-botao epm-botao-mini" data-epm-action="falhaAplicar" data-efeito="aliado" data-alvo="${escapar(a.uuid)}" data-formula="${escapar(at.dano)}" data-tipo-dano="${escapar(at.tipoDano ?? "")}"><i class="fa-solid fa-burst"></i> ${escapar(a.name)}</button>`).join(" ")}</p>`
      : "<p class=\"epm-dica\">Nenhum aliado perto: o golpe passa no vazio.</p>";
  }
  return ChatMessage.create({
    speaker: falar(ator), rolls: [r],
    content: `<div class="epm-chat epm-chat-nota" data-actor-uuid="${escapar(ator.uuid)}" style="--epm-cor-cartao:#D2544A"><p><i class="fa-solid fa-skull-crossbones" aria-hidden="true"></i> <strong>Falha crítica</strong> de ${escapar(ator.name)}${at?.nome ? ` (${escapar(at.nome)})` : ""}: 1d4 = ${r.total}.</p><p>${escapar(linha.texto)}${feito ? ` <em>${escapar(feito)}</em>` : ""}</p>${botoes}</div>`
  });
}

async function aplicarFalha(ator, botao) {
  if (botao.dataset.efeito !== "aliado") return;
  if (!game.user.isGM) return ui.notifications.warn("O Mestre escolhe o aliado.");
  const { rolarFormula, aplicarDanoDoCartao } = await M();
  const roll = await rolarFormula(ator, botao.dataset.formula, `Falha crítica: ${ator?.name ?? ""} acerta um aliado`);
  if (!roll) return;
  const b = document.createElement("button");
  Object.assign(b.dataset, { valor: String(Math.max(0, Math.round(roll.total))), alvos: botao.dataset.alvo, tipoDano: botao.dataset.tipoDano ?? "" });
  await aplicarDanoDoCartao(ator, b);
  botao.closest("p")?.querySelectorAll("button").forEach(x => { x.disabled = true; });
}

/** Botões das regras opcionais nos cartões (falha crítica, "Acertou" da Maestria). */
export async function cliqueOpcionais(acao, ator, botao) {
  if (acao === "falhaAplicar") { await aplicarFalha(ator, botao); return true; }
  if (acao === "maestriaAcerto") {
    if (!ator) return true;
    if (!ator.isOwner && !game.user.isGM) { ui.notifications.warn("Só o dono do personagem (ou o Mestre) marca o acerto."); return true; }
    const msg = game.messages.get(botao.closest("[data-message-id]")?.dataset.messageId);
    if (msg?.flags?.[FLAG]?.maestriaContada) { ui.notifications.info("Este acerto já foi contado."); return true; }
    const n = await contarAcertoMaestria(ator, botao.dataset.tipoArma, msg);
    if (typeof n === "number") ui.notifications.info(`Domínio de arma (${botao.dataset.tipoArma}): ${n} acertos.`);
    return true;
  }
  return false;
}

/** Novo turno: o Desprevenido da falha crítica acaba. */
export async function fimDesprevenidoDaFalha(ator) {
  if (!ator?.flags?.[FLAG]?.falhaDesprevenido) return;
  await ator.update({ [`${P}.-=falhaDesprevenido`]: null });
  try { if (ator.statuses?.has("epm-desprevenido")) await ator.toggleStatusEffect("epm-desprevenido", { active: false }); } catch (err) { console.warn("EPM |", err); }
}

/* -------------------------------------------- */
/*  14. Chefes com fases                        */
/* -------------------------------------------- */

export const ACOES_ESPECIAIS = { lendaria: "Lendária", mitica: "Mítica", arcaica: "Arcaica" };

export function lerFasesChefe(chefe = {}) {
  return Object.entries(chefe?.etapas ?? {}).filter(([, f]) => f).map(([id, f]) => ({
    id, limiar: Math.max(1, Math.min(99, int(f.limiar, 50))), texto: f.texto ?? "", tirarNegativas: !!f.tirarNegativas,
    acao: ACOES_ESPECIAIS[f.acao] ? f.acao : "", acaoQtd: Math.max(0, int(f.acaoQtd, 1)), cura: String(f.cura ?? "").trim(),
    condicoes: String(f.condicoes ?? "").trim(), acerto: int(f.acerto), dano: String(f.dano ?? "").trim(), criado: num(f.criado)
  })).sort((a, b) => b.limiar - a.limiar || a.criado - b.criado);
}

/** Marca (ou desmarca) o NPC como chefe; a primeira vez cria as fases de 50% e 25%. */
export async function alternarChefe(ator) {
  if (!game.user.isGM) return;
  const c = ator.flags?.[FLAG]?.chefe ?? {};
  const upd = { [`${P}.chefe.ativo`]: !c.ativo };
  if (!c.ativo && !Object.keys(c.etapas ?? {}).length) {
    upd[`${P}.chefe.etapas.${foundry.utils.randomID()}`] = { limiar: 50, texto: "", criado: Date.now() };
    upd[`${P}.chefe.etapas.${foundry.utils.randomID()}`] = { limiar: 25, texto: "", criado: Date.now() + 1 };
  }
  return ator.update(upd);
}
export const novaFaseChefe = ator => ator.update({ [`${P}.chefe.etapas.${foundry.utils.randomID()}`]: { limiar: 10, texto: "", criado: Date.now() } });
export const apagarFaseChefe = (ator, id) => ator.update({ [`${P}.chefe.etapas.-=${id}`]: null });

/** Aplica uma fase: tira condições negativas, dá ações especiais, cura, aplica condições e bônus, e manda o cartão. */
export async function aplicarFaseChefe(ator, fase, n) {
  const { removerCondicoesNegativas, estadoAtor, calcularRecuperacao } = await M();
  const feito = [];
  if (fase.tirarNegativas) { const q = await removerCondicoesNegativas(ator); if (q) feito.push(`tirou ${q} condição(ões) negativa(s)`); }
  const upd = {};
  if (fase.acao && fase.acaoQtd) {
    const a = ator.flags[FLAG].acoes?.[fase.acao] ?? {};
    upd[`${P}.acoes.${fase.acao}.max`] = int(a.max) + fase.acaoQtd;
    upd[`${P}.acoes.${fase.acao}.value`] = int(a.value) + fase.acaoQtd;
    feito.push(`+${fase.acaoQtd} ação ${ACOES_ESPECIAIS[fase.acao]}`);
  }
  if (fase.cura) {
    try {
      const r = new Roll(fase.cura);
      await r.evaluate();
      const rec = calcularRecuperacao(estadoAtor(ator).ficha, "pv", r.total, { fonte: "fase" });
      Object.assign(upd, rec.updates);
      feito.push(`curou ${rec.ganho} (${fase.cura})`);
    } catch { feito.push(`cura inválida (${fase.cura})`); }
  }
  if (fase.acerto || fase.dano) {
    upd[`${P}.bonusCena.${foundry.utils.randomID()}`] = { nome: `Fase ${n}`, ativo: true, acerto: fase.acerto, dano: fase.dano, criado: Date.now() };
    feito.push(`bônus de cena${fase.acerto ? ` ${fase.acerto > 0 ? "+" : ""}${fase.acerto} acerto` : ""}${fase.dano ? ` +${fase.dano} dano` : ""}`);
  }
  if (Object.keys(upd).length) await ator.update(upd, { epmFaseChefe: true });
  const conds = fase.condicoes.split(/[,;]/).map(t => t.trim()).filter(Boolean)
    .map(t => CONDICOES.find(c => c.id === t || c.slug === t || c.label.toLowerCase() === t.toLowerCase())).filter(Boolean);
  for (const c of conds) { try { if (!ator.statuses?.has(c.id)) await ator.toggleStatusEffect(c.id, { active: true }); } catch (err) { console.warn("EPM |", err); } }
  if (conds.length) feito.push(`ficou ${conds.map(c => c.label).join(", ")}`);
  return cartao(ator, `<p><i class="fa-solid fa-crown" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> entra na <strong>fase ${n}</strong> (Vida ≤ ${fase.limiar}%).</p>${fase.texto ? `<p>${escapar(fase.texto)}</p>` : ""}${feito.length ? `<p class="epm-dica">${escapar(feito.join("; "))}.</p>` : ""}`, "#D2544A", { flags: { [FLAG]: { automatico: true } } });
}

/** updateActor (Mestre ativo): a Vida cruzou um limiar para baixo → a fase entra, uma vez por combate. */
export async function verificarFases(ator, opcoes) {
  if (!regra("chefes") || !souMestreAtivo() || opcoes?.epmFaseChefe) return;
  const c = ator.flags?.[FLAG]?.chefe;
  if (!c?.ativo || opcoes?.epmHpAntes === undefined) return;
  const hp = ator.system?.attributes?.hp ?? {};
  const max = int(hp.max);
  if (max <= 0) return;
  const antes = (int(opcoes.epmHpAntes) / max) * 100;
  const agora = (int(hp.value) / max) * 100;
  const fases = lerFasesChefe(c);
  const usadas = Array.isArray(c.usadas) ? c.usadas : [];
  const idx = fasesCruzadas(fases, antes, agora, fases.map((f, i) => (usadas.includes(f.id) ? i : -1)).filter(i => i >= 0));
  if (idx.length) {
    await ator.update({ [`${P}.chefe.usadas`]: [...usadas, ...idx.map(i => fases[i].id)] }, { epmFaseChefe: true });
    for (const i of idx) await aplicarFaseChefe(ator, fases[i], i + 2);
  }
  // Chefe derrotado: feito para o grupo do combate
  if (int(opcoes.epmHpAntes) > 0 && int(hp.value) <= 0) await feitoAutomatico("chefe", personagensDoCombate());
}

/** Fim do combate: as fases voltam a valer. */
export async function resetarFases(combate) {
  if (!souMestreAtivo()) return;
  for (const c of combate?.combatants ?? []) {
    const a = c.actor;
    if (a?.flags?.[FLAG]?.chefe?.usadas?.length) await a.update({ [`${P}.chefe.usadas`]: [] }, { epmFaseChefe: true });
  }
}

/* -------------------------------------------- */
/*  15. Aura de Horror                          */
/* -------------------------------------------- */

export const DADOS_AURA = ["1d4", "1d6", "1d8", "1d10", "1d12", "1d20"];

/** Pede o teste de Vontade de cada um (cartão com botão de rolar) e guarda quem já viu a criatura. */
async function pedirAura(criatura, uuids) {
  const aura = criatura.flags[FLAG].aura;
  const dt = Math.max(1, int(aura.dt, 15));
  const vistos = Array.isArray(aura.vistos) ? aura.vistos : [];
  const { pedirTeste } = await import("./automacoes.mjs");
  for (const uuid of uuids) {
    const a = porUuid(uuid);
    if (a) await pedirTeste(a, { tipo: "aura", alvo: "pericia:vontade", dt, motivo: `Viu ${criatura.name}. Se falhar, perde ${aura.dado} de Sanidade (a temporária primeiro).`, extra: { dado: aura.dado, criatura: criatura.name } });
  }
  await criatura.update({ [`${P}.aura.vistos`]: [...new Set([...vistos, ...uuids])] });
}

/** Escudo (fora de combate): o Mestre escolhe quem vê a criatura. */
export async function auraDeHorror(criatura, candidatos = []) {
  if (!game.user.isGM || !regra("auraHorror")) return;
  const aura = criatura?.flags?.[FLAG]?.aura ?? {};
  if (!criatura || !DADOS_AURA.includes(aura.dado)) return ui.notifications.warn("A criatura precisa do dado da Aura de Horror na ficha (de 1d4 a 1d20).");
  const vistos = Array.isArray(aura.vistos) ? aura.vistos : [];
  const lista = candidatos.filter(a => a?.flags?.[FLAG] && a.uuid !== criatura.uuid);
  if (!lista.length) return ui.notifications.warn("Marque no Escudo quem vê a criatura (ou deixe o grupo à vista).");
  const r = await fvtt.DialogV2.wait({
    window: { title: `Aura de Horror: ${criatura.name}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>Quem vê a criatura faz Vontade DT ${Math.max(1, int(aura.dt, 15))}; quem falhar perde ${escapar(aura.dado)} de Sanidade.</p>
      ${lista.map(a => `<label class="epm-check"><input type="checkbox" name="${escapar(a.uuid)}" ${vistos.includes(a.uuid) ? "" : "checked"}> ${escapar(a.name)}${vistos.includes(a.uuid) ? " <em>(já viu)</em>" : ""}</label>`).join("")}`,
    buttons: [{ action: "ok", label: "Pedir os testes", icon: "fa-solid fa-ghost", default: true, callback: (ev, b) => [...b.form.querySelectorAll("input:checked")].map(i => i.name) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
  });
  if (!Array.isArray(r) || !r.length) return;
  return pedirAura(criatura, r);
}

/** Começo do combate (Mestre ativo): quem ainda não viu cada criatura com aura faz o teste. */
export async function auraNoCombate(combate) {
  if (!regra("auraHorror") || !souMestreAtivo()) return;
  const atores = (combate?.combatants ?? []).map(c => c.actor).filter(Boolean);
  const pjs = atores.filter(a => a.hasPlayerOwner && a.flags?.[FLAG]);
  for (const cr of atores) {
    const aura = cr.flags?.[FLAG]?.aura;
    if (!aura || !DADOS_AURA.includes(aura.dado)) continue;
    const vistos = Array.isArray(aura.vistos) ? aura.vistos : [];
    const novos = pjs.filter(a => a.uuid !== cr.uuid && !vistos.includes(a.uuid)).map(a => a.uuid);
    if (novos.length) await pedirAura(cr, novos);
  }
}

/* -------------------------------------------- */
/*  18. Maestria de arma                        */
/* -------------------------------------------- */

/** +1 acerto com aquele tipo de arma; conta uma vez por cartão. Devolve o novo total (ou null). */
export async function contarAcertoMaestria(atacante, tipoArma, mensagem = null) {
  if (!regra("maestria") || !atacante?.flags?.[FLAG]) return null;
  const chave = chaveTipoArma(tipoArma);
  if (!chave) return null;
  if (mensagem?.flags?.[FLAG]?.maestriaContada) return null;
  if (!atacante.isOwner) return pedirAoMestreNovas("maestria", { uuid: atacante.uuid, tipoArma, mensagem: mensagem?.id ?? "" });
  const m = atacante.flags[FLAG].maestria?.[chave] ?? {};
  const novo = int(m.acertos) + 1;
  await atacante.update({ [`${P}.maestria.${chave}`]: { ...m, nome: m.nome || String(tipoArma).trim(), acertos: novo } });
  if (mensagem) { try { await mensagem.update({ [`flags.${FLAG}.maestriaContada`]: true }); } catch { /* sem permissão */ } }
  const marco = Object.entries(MARCOS_MAESTRIA).find(([, v]) => v === novo);
  if (marco) {
    const texto = { acerto: "+1 de acerto com esse tipo de arma", tecnica: "pode criar uma técnica própria (aba Combate, aprovada pelo Mestre)", dano: "+1 nível de dano com esse tipo de arma" }[marco[0]];
    await cartao(atacante, `<p><i class="fa-solid fa-medal" aria-hidden="true"></i> <strong>Domínio de arma</strong>: ${escapar(atacante.name)} chegou a ${novo} acertos com ${escapar(String(tipoArma))}: ${texto}.</p>`, "#C9A24E");
    if (marco[0] === "acerto") await feitoAutomatico("maestria50", [atacante]);
  }
  return novo;
}

/** Técnica de Maestria (200 acertos): habilidade com origem "Maestria", pendente até o Mestre aprovar. */
export async function criarTecnica(ator, chave) {
  const m = ator.flags?.[FLAG]?.maestria?.[chave];
  if (!m || int(m.acertos) < MARCOS_MAESTRIA.tecnica) return ui.notifications.warn(`A técnica libera com ${MARCOS_MAESTRIA.tecnica} acertos.`);
  if (m.tecnica && ator.items.get(m.tecnica)) return ator.items.get(m.tecnica).sheet?.render(true);
  const [item] = await ator.createEmbeddedDocuments("Item", [{
    name: `Técnica de Domínio: ${m.nome || chave}`, type: "feat", img: "icons/svg/sword.svg",
    flags: { [FLAG]: { origem: "maestria", raridade: "comum", aprovacao: game.user.isGM ? "aprovada" : "pendente", tipoArmaMaestria: chave } }
  }]);
  if (!item) return;
  await ator.update({ [`${P}.maestria.${chave}.tecnica`]: item.id });
  item.sheet?.render(true);
  if (!game.user.isGM) await cartao(ator, `<p><i class="fa-solid fa-medal" aria-hidden="true"></i> ${escapar(ator.name)} criou a técnica <strong>${escapar(item.name)}</strong>. Aguardando o Mestre aprovar.</p>`, "#C9A24E");
}

export async function aprovarTecnica(ator, itemId) {
  if (!game.user.isGM) return;
  const item = ator.items.get(itemId);
  if (item) await item.update({ [`flags.${FLAG}.aprovacao`]: "aprovada" });
}

/* -------------------------------------------- */
/*  19. Feitos e títulos                        */
/* -------------------------------------------- */

const personagensDoCombate = () => (game.combat?.combatants ?? []).map(c => c.actor).filter(a => a?.flags?.[FLAG] && a.hasPlayerOwner);

/** Dá o feito (uma vez por personagem): PEv, título e cartão. Só o Mestre grava fichas dos outros. */
export async function darFeito(atores, feitoId) {
  if (!regra("feitos")) return;
  const f = listaFeitos().find(x => x.id === feitoId);
  if (!f) return ui.notifications.warn("Feito não encontrado.");
  const ganhos = [];
  for (const a of atores) {
    if (!a?.flags?.[FLAG]) continue;
    if (!a.isOwner) { await pedirAoMestreNovas("feito", { uuid: a.uuid, feitoId }); continue; }
    const ja = Object.values(a.flags[FLAG].feitos ?? {}).some(x => x?.feitoId === f.id);
    if (ja) continue;
    const pev = int(a.flags[FLAG].pontos?.pev);
    await a.update({
      [`${P}.feitos.${foundry.utils.randomID()}`]: { feitoId: f.id, nome: f.nome, descricao: f.descricao, pev: f.pev, titulo: f.titulo, quando: Date.now(), data: dataDoMundo() },
      ...(f.pev ? { [`${P}.pontos.pev`]: pev + f.pev } : {})
    });
    ganhos.push(a.name);
  }
  if (!ganhos.length) return;
  return cartao(null, `<p><i class="fa-solid fa-trophy" aria-hidden="true"></i> <strong>Feito: ${escapar(f.nome)}</strong> — ${escapar(ganhos.join(", "))}.</p>${f.descricao ? `<p>${escapar(f.descricao)}</p>` : ""}<p class="epm-dica">${f.pev ? `+${f.pev} PEv. ` : ""}${f.titulo ? `Título liberado: ${escapar(f.titulo)}.` : ""}</p>`, "#C9A24E");
}

/** Feitos detectados sozinhos (umPv, chefe, maestria50). */
export async function feitoAutomatico(auto, atores) {
  if (!regra("feitos") || !atores?.length) return;
  for (const f of listaFeitos().filter(x => x.auto === auto)) await darFeito(atores, f.id);
}

/** Fim do combate: quem terminou com exatamente 1 PV ganha "Por um fio". */
export async function feitosDoFimDoCombate(combate) {
  if (!regra("feitos") || !souMestreAtivo()) return;
  const umPv = (combate?.combatants ?? []).map(c => c.actor).filter(a => a?.flags?.[FLAG] && a.hasPlayerOwner && int(a.system?.attributes?.hp?.value) === 1);
  if (umPv.length) await feitoAutomatico("umPv", umPv);
}

/** Pedidos de jogadores que só o Mestre grava (feito e maestria em ficha de outro). */
export function registrarOpcionaisAcoes() {
  aoPedidoDoMestre("feito", async d => { const a = porUuid(d.uuid); if (a) await darFeito([a], d.feitoId); });
  aoPedidoDoMestre("maestria", async d => { const a = porUuid(d.uuid); if (a) await contarAcertoMaestria(a, d.tipoArma, d.mensagem ? game.messages.get(d.mensagem) : null); });
  aoPedidoDoMestre("cozinhar", async d => { const a = porUuid(d.uuid); if (a) await curarComida(a, d.valor); });
}

/* -------------------------------------------- */
/*  22. Atividades de descanso                  */
/* -------------------------------------------- */

async function curarComida(a, valor) {
  const { estadoAtor, calcularRecuperacao } = await M();
  const r = calcularRecuperacao(estadoAtor(a).ficha, "pv", Math.max(0, int(valor)), { fonte: "comida" });
  if (Object.keys(r.updates).length) await a.update(r.updates);
}

/** Escudo → Emboscada: Surpreendido no grupo, menos se alguém vigiou no último descanso longo. */
export async function emboscada(grupo = []) {
  if (!game.user.isGM || !regra("descanso")) return;
  const fichas = grupo.filter(a => a?.flags?.[FLAG]);
  if (!fichas.length) return ui.notifications.warn("Ninguém no grupo.");
  const vigias = fichas.filter(a => a.flags[FLAG].vigiou);
  if (vigias.length) return cartao(null, `<p><i class="fa-solid fa-eye" aria-hidden="true"></i> <strong>Emboscada!</strong> ${escapar(vigias.map(a => a.name).join(", "))} estava vigiando: ninguém fica Surpreendido.</p>`, "#4E9A5B");
  for (const a of fichas) { try { if (!a.statuses?.has("epm-surpreendido")) await a.toggleStatusEffect("epm-surpreendido", { active: true }); } catch (err) { console.warn("EPM |", err); } }
  return cartao(null, `<p><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> <strong>Emboscada!</strong> Ninguém vigiou no último descanso: ${escapar(fichas.map(a => a.name).join(", "))} ficam Surpreendidos.</p>`, "#D2544A");
}

export const ATIVIDADES_DESCANSO = {
  vigiar: "Vigiar: se houver emboscada, o grupo não fica Surpreendido",
  cozinhar: "Cozinhar: quem você escolher recebe +1d8 PV",
  conversar: "Conversar: +1 de afinidade com uma relação",
  estudar: "Estudar: treinou durante o descanso (+5 PT)",
  rezar: "Rezar: +1d6 + 2 de Sanidade temporária até o próximo descanso longo"
};

/** HTML da escolha no diálogo de descanso longo. */
export function htmlAtividades(ator, ptTreino = 5) {
  const rels = Object.entries(ator.flags?.[FLAG]?.relacoes ?? {}).filter(([, r]) => r);
  const grupo = (game.actors ?? []).filter(a => a.type === "character" && a.hasPlayerOwner && a.flags?.[FLAG]);
  const radio = (id, rotulo, extra = "") => `<label class="epm-check"><input type="radio" name="atividade" value="${id}" ${id === "estudar" ? "" : ""}> ${escapar(rotulo)}</label>${extra}`;
  return `<fieldset class="epm-aquisicao epm-atividades"><legend>Atividade do descanso</legend>
    <label class="epm-check"><input type="radio" name="atividade" value="" checked> Nenhuma</label>
    ${radio("vigiar", ATIVIDADES_DESCANSO.vigiar)}
    ${radio("cozinhar", ATIVIDADES_DESCANSO.cozinhar, grupo.length ? `<div class="epm-atividade-extra">${grupo.map(a => `<label class="epm-check"><input type="checkbox" name="cozinhar_${escapar(a.uuid)}" value="${escapar(a.uuid)}" checked> ${escapar(a.name)}</label>`).join("")}</div>` : "")}
    ${radio("conversar", ATIVIDADES_DESCANSO.conversar, rels.length ? `<div class="epm-atividade-extra"><select name="conversarCom">${rels.map(([id, r]) => `<option value="${id}">${escapar(porUuid(r.uuid)?.name ?? r.nome ?? "Relação")}</option>`).join("")}</select></div>` : "")}
    ${radio("estudar", ATIVIDADES_DESCANSO.estudar.replace("+5", `+${ptTreino}`))}
    ${radio("rezar", ATIVIDADES_DESCANSO.rezar)}
  </fieldset>`;
}

/** Lê a atividade escolhida no formulário do descanso. */
export function lerAtividade(form) {
  const atividade = form.querySelector("input[name='atividade']:checked")?.value ?? "";
  return {
    atividade,
    cozinhar: [...form.querySelectorAll("input[name^='cozinhar_']:checked")].map(i => i.value),
    conversarCom: form.elements.conversarCom?.value ?? ""
  };
}

/** Antes do descanso longo: a Sanidade temporária da reza anterior acaba. Devolve updates. */
export function fimDaReza(dados) {
  const reza = int(dados?.rezaTemp);
  if (!reza) return {};
  const temp = Math.max(0, int(dados.recursos?.ps?.temp));
  return { [`${P}.recursos.ps.temp`]: Math.max(0, temp - reza), [`${P}.rezaTemp`]: 0 };
}

/** Faz a atividade do descanso longo. Devolve { updates, textos } (o que é da própria ficha) e já cuida do resto. */
export async function fazerAtividade(ator, escolha, { ptTreino = 5, pontosPt = 0, psTempBase = 0 } = {}) {
  const updates = { [`${P}.vigiou`]: escolha?.atividade === "vigiar" };
  const textos = [];
  switch (escolha?.atividade) {
    case "vigiar":
      textos.push("vigiou (numa emboscada, o grupo não fica Surpreendido)");
      break;
    case "cozinhar": {
      const nomes = [];
      for (const uuid of escolha.cozinhar ?? []) {
        const a = porUuid(uuid);
        if (!a) continue;
        const r = new Roll("1d8");
        await r.evaluate();
        if (a.isOwner) await curarComida(a, r.total);
        else await pedirAoMestreNovas("cozinhar", { uuid, valor: r.total });
        nomes.push(`${a.name} +${r.total}`);
      }
      if (nomes.length) textos.push(`cozinhou (${nomes.join(", ")} PV)`);
      break;
    }
    case "conversar": {
      const rel = ator.flags?.[FLAG]?.relacoes?.[escolha.conversarCom];
      if (rel) {
        const { ajustarAfinidade } = await import("./extras.mjs");
        await ajustarAfinidade(ator, escolha.conversarCom, 1, { origem: "Descanso", motivo: "Conversa no descanso" });
        textos.push(`conversou com ${porUuid(rel.uuid)?.name ?? rel.nome ?? "uma relação"} (+1 de afinidade)`);
      }
      break;
    }
    case "estudar":
      updates[`${P}.pontos.pt`] = pontosPt + ptTreino;
      textos.push(`+${ptTreino} PT de estudo`);
      break;
    case "rezar": {
      const r = new Roll("1d6 + 2");
      await r.evaluate();
      updates[`${P}.recursos.ps.temp`] = psTempBase + r.total;
      updates[`${P}.rezaTemp`] = r.total;
      textos.push(`rezou (+${r.total} de Sanidade temporária até o próximo descanso longo)`);
      break;
    }
    default:
  }
  return { updates, textos };
}

export { nomeCond };
