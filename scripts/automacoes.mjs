/**
 * Novas mecânicas automáticas (ganchos do Foundry):
 *   4. Concentrado: cada dano sofrido (mesmo só na vida temporária) pede Vontade DT 15; falhou, a condição sai.
 *  11. Recuperado: quando Atordoado, Paralisado ou Dominado sai, fica imune a ela até o fim do próximo turno.
 *  12. Estamina zerada: +1 de Exaustão na hora (a Exaustão 6 ainda pede confirmação).
 *  17. Traumas (opcional): Sanidade a 0 dá um trauma permanente e a Sanidade volta a 20; Voz interna no combate.
 *  21. Acúmulos (opcional): aplicar de novo Sangrando, Envenenado ou Em Chamas soma um acúmulo (até 3).
 * Só um cliente age por ator: o primeiro dono jogador conectado ou, sem ele, o Mestre ativo.
 */
import { FLAG } from "./config.mjs";
import { int } from "./data.mjs";
import { fvtt, escapar } from "./helpers.mjs";
import { regra, ACUMULAVEIS, ROTULOS_ACUMULAVEIS, MAX_ACUMULOS, acumulosDe, tabelaTraumas } from "./opcionais.mjs";

const P = `flags.${FLAG}`;
const M = () => import("./mecanicas.mjs");
export const DT_CONCENTRACAO = 15;
export const CONDICOES_RECUPERAVEIS = ["epm-atordoado", "epm-paralisado", "epm-dominado"];
const NOMES = { "epm-atordoado": "Atordoado", "epm-paralisado": "Paralisado", "epm-dominado": "Dominado", ...ROTULOS_ACUMULAVEIS };
export const SANIDADE_DEPOIS_DO_TRAUMA = 20;

// Mensagens automáticas: somem do chat se a ficha estiver com "Chat só do que eu clicar"
const nota = (ator, html, cor = "#A47DDB") => ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: ator }), flags: { [FLAG]: { automatico: true } }, content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:${cor}">${html}</div>`
});

/** Este cliente é o responsável pelo ator? (primeiro dono jogador conectado ou o Mestre ativo) */
export function souResponsavel(ator) {
  const users = game.users ?? [];
  const dono = users.find?.(u => u.active && !u.isGM && ator?.testUserPermission?.(u, "OWNER"));
  const resp = dono ?? users.activeGM;
  return !!resp?.isSelf;
}
const souMestreAtivo = () => !!game.user?.isGM && (!game.users?.activeGM || game.users.activeGM.isSelf);

/* -------------------------------------------- */
/*  Status: imunidade do Recuperado e acúmulos  */
/* -------------------------------------------- */

let embrulhado = false;

/** Envolve Actor#toggleStatusEffect: Recuperado bloqueia a condição; aplicar de novo uma acumulável soma 1. */
export function instalarEmbrulhoStatus() {
  if (embrulhado) return;
  const Classe = CONFIG.Actor?.documentClass;
  const original = Classe?.prototype?.toggleStatusEffect;
  if (typeof original !== "function") return;
  embrulhado = true;
  Classe.prototype.toggleStatusEffect = async function (statusId, opcoes = {}) {
    try {
      const dados = this.flags?.[FLAG];
      if (dados) {
        const tem = this.statuses?.has(statusId);
        const ligar = opcoes?.active === true || (opcoes?.active === undefined && !tem);
        if (ligar && !tem && (dados.recuperado?.conds ?? []).includes(statusId)) {
          ui.notifications.info(`${this.name} está Recuperado: imune a ${NOMES[statusId] ?? statusId} até o fim do próximo turno.`);
          return false;
        }
        if (opcoes?.active === true && tem && ACUMULAVEIS.includes(statusId) && regra("acumulos")) {
          const n = acumulosDe(dados, statusId);
          if (n < MAX_ACUMULOS) await this.update({ [`${P}.acumulos.${statusId}`]: n + 1 });
          else ui.notifications.info(`${this.name}: ${NOMES[statusId]} já está em ×${MAX_ACUMULOS}.`);
          return true;
        }
      }
    } catch (err) {
      console.warn("EPM | status", err);
    }
    return original.call(this, statusId, opcoes);
  };
}

/** Botões ×N da ficha: +1 ou −1 acúmulo (−1 em ×1 tira a condição). */
export async function alterarAcumulo(ator, id, delta) {
  if (!ACUMULAVEIS.includes(id) || !ator?.isOwner) return;
  const tem = ator.statuses?.has(id);
  const n = tem ? acumulosDe(ator.flags?.[FLAG], id) : 0;
  const novo = Math.max(0, Math.min(MAX_ACUMULOS, n + int(delta)));
  if (novo === n) return;
  if (novo === 0) return ator.toggleStatusEffect(id, { active: false });
  if (!tem) return ator.toggleStatusEffect(id, { active: true });
  return ator.update({ [`${P}.acumulos.${id}`]: novo });
}

/* -------------------------------------------- */
/*  Ganchos                                     */
/* -------------------------------------------- */

const somaRecurso = r => (Number(r?.value) || 0) + Math.max(0, Number(r?.temp) || 0);

/** preUpdateActor: guarda Estamina e Sanidade de antes (o Foundry repassa as opções aos outros clientes). */
export function antesDeAtualizar(ator, mudancas, opcoes) {
  const r = ator.flags?.[FLAG]?.recursos;
  if (!r) return;
  if (foundry.utils.hasProperty(mudancas, `flags.${FLAG}.recursos.pe`)) opcoes.epmPeAntes = somaRecurso(r.pe);
  if (foundry.utils.hasProperty(mudancas, `flags.${FLAG}.recursos.ps`)) opcoes.epmPsAntes = somaRecurso(r.ps);
}

/** updateActor: Concentrado, Estamina zerada e Traumas. */
export async function aoAtualizar(ator, mudancas, opcoes) {
  const dados = ator.flags?.[FLAG];
  if (!dados) return;
  // 4. Concentrado: um teste por dano sofrido (a vida temporária absorver não evita o teste)
  if (opcoes?.epmPvAntes !== undefined && !opcoes?.epmCusto && ator.statuses?.has("epm-concentrado") && souResponsavel(ator)) {
    const hp = ator.system?.attributes?.hp ?? {};
    if ((Number(hp.value) || 0) + (Number(hp.temp) || 0) < Number(opcoes.epmPvAntes)) await testeConcentracao(ator);
  }
  // 12. Estamina zerada: +1 de Exaustão
  if (opcoes?.epmPeAntes !== undefined && Number(opcoes.epmPeAntes) > 0 && somaRecurso(dados.recursos?.pe) <= 0 && souResponsavel(ator)) {
    const { definirExaustao } = await M();
    const antes = int(dados.exaustao);
    const n = await definirExaustao(ator, antes + 1);
    if (n !== null && n !== undefined && n > antes) await nota(ator, `<p><strong>${escapar(ator.name)}</strong> ficou sem Estamina: <strong>Exaustão ${antes} → ${n}</strong>.</p>`, "#4E9A5B");
  }
  // 17. Traumas: Sanidade a 0
  if (regra("traumas") && opcoes?.epmPsAntes !== undefined && Number(opcoes.epmPsAntes) > 0 && somaRecurso(dados.recursos?.ps) <= 0) {
    const mestre = game.users?.activeGM;
    if (mestre ? souMestreAtivo() : souResponsavel(ator)) await ganharTrauma(ator, { escolher: !!mestre });
  }
}

/* -------------------------------------------- */
/*  Pedidos de teste: cartão com botão de rolar */
/* -------------------------------------------- */

const ROTULO_PEDIDO = {
  concentracao: "Concentração", sobrecarga: "Sobrecarga de Núcleo", aura: "Aura de Horror"
};

/**
 * Manda um cartão pedindo o teste, com um botão de rolar para o dono (ou o Mestre).
 * `alvo` = "pericia:vontade" ou "atributo:nucleo". `extra` vai junto para aplicar o resultado.
 */
export async function pedirTeste(ator, { tipo, alvo, dt, motivo = "", extra = {} }) {
  const [qual, id] = String(alvo).split(":");
  const { estadoAtor } = await M();
  const { ficha } = estadoAtor(ator);
  const nome = qual === "atributo" ? ficha.atributos[id]?.label : ficha.periciaPorId[id]?.nome;
  const html = `<div class="epm-chat epm-chat-nota epm-pedido-teste" data-actor-uuid="${escapar(ator.uuid)}" style="--epm-cor-cartao:#6B3FA0">
    <p><i class="fa-solid fa-dice-d20" aria-hidden="true"></i> <strong>${escapar(ROTULO_PEDIDO[tipo] ?? "Teste")}</strong>: ${escapar(ator.name)} faz <strong>${escapar(nome ?? id)} DT ${dt}</strong>.${motivo ? ` <span class="epm-dica">${escapar(motivo)}</span>` : ""}</p>
    <p><button type="button" class="epm-botao" data-epm-action="testePedido"><i class="fa-solid fa-dice-d20"></i> Rolar ${escapar(nome ?? "")}</button></p></div>`;
  return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: ator }), content: html, flags: { [FLAG]: { pedido: { tipo, alvo, dt, extra, feito: false } } } });
}

/** Botão do cartão: rola e aplica o resultado. */
export async function resolverPedido(ator, botao) {
  const msg = game.messages.get(botao.closest("[data-message-id]")?.dataset.messageId);
  const p = msg?.flags?.[FLAG]?.pedido;
  if (!p || !ator) return;
  if (p.feito) return ui.notifications.info("Esse teste já foi rolado.");
  if (!ator.isOwner) return ui.notifications.warn(`Só quem controla ${ator.name} (ou o Mestre) rola.`);
  const { estadoAtor, rolarTeste } = await M();
  const { ficha } = estadoAtor(ator);
  const [qual, id] = p.alvo.split(":");
  const base = qual === "atributo" ? ficha.atributos[id] : ficha.periciaPorId[id];
  const roll = await rolarTeste(ator, {
    rotulo: `${ROTULO_PEDIDO[p.tipo] ?? "Teste"}: ${qual === "atributo" ? base?.label : base?.nome} DT ${p.dt}`, bonus: base?.testeTotal ?? base?.total ?? 0, penalidades: base?.testeFontes ?? [],
    desvantagens: [...ficha.desvantagens.testes, ...(base?.desvantagem ?? [])], vantagens: [...ficha.vantagens.testes, ...(base?.vantagem ?? [])]
  });
  if (!roll) return;
  botao.disabled = true;
  try { if (msg.isAuthor || game.user.isGM) await msg.update({ [`flags.${FLAG}.pedido.feito`]: true }); else await (await import("./cooperacao.mjs")).pedirAoMestreNovas("pedidoFeito", { mensagem: msg.id }); } catch { /* segue */ }
  const passou = roll.total >= p.dt;
  if (p.tipo === "concentracao" && !passou) {
    try { if (ator.statuses?.has("epm-concentrado")) await ator.toggleStatusEffect("epm-concentrado", { active: false }); } catch (err) { console.warn("EPM |", err); }
    return nota(ator, `<p><i class="fa-solid fa-brain" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> perdeu a concentração (${roll.total} contra DT ${p.dt}): <strong>Concentrado</strong> saiu.</p>`, "#6B3FA0");
  }
  if (p.tipo === "sobrecarga" && !passou) {
    try { if (!ator.statuses?.has("epm-mana-instavel")) await ator.toggleStatusEffect("epm-mana-instavel", { active: true }); } catch (err) { console.warn("EPM |", err); }
    return nota(ator, `<p><strong>${escapar(ator.name)}</strong> falhou no Núcleo (${roll.total} contra DT ${p.dt}): fica com <strong>Mana Instável</strong>.</p>`, "#6B3FA0");
  }
  if (p.tipo === "aura" && !passou) {
    const { calcularPerda } = await M();
    const dano = new Roll(p.extra?.dado || "1d6");
    await dano.evaluate();
    const perda = calcularPerda(estadoAtor(ator).ficha, "ps", dano.total);
    await ator.update(perda.updates);
    return dano.toMessage({ speaker: ChatMessage.getSpeaker({ actor: ator }), flags: { [FLAG]: { automatico: true } }, flavor: `<span class="epm-flavor"><strong>Aura de Horror${p.extra?.criatura ? ` (${escapar(p.extra.criatura)})` : ""}</strong><em>Falhou (${roll.total}): −${dano.total} de Sanidade${perda.doTemp ? `, ${perda.doTemp} da temporária` : ""}</em></span>` });
  }
  if (passou) await nota(ator, `<p><strong>${escapar(ator.name)}</strong> passou (${roll.total} contra DT ${p.dt}).</p>`, "#4E9A5B");
}

/** Concentrado sofreu dano: pede Vontade DT 15. */
export async function testeConcentracao(ator) {
  return pedirTeste(ator, { tipo: "concentracao", alvo: "pericia:vontade", dt: DT_CONCENTRACAO, motivo: "Sofreu dano estando Concentrado. Se falhar, a concentração acaba." });
}

/** deleteActiveEffect: Recuperado e limpeza dos acúmulos. */
export async function aoApagarEfeito(efeito) {
  const ator = efeito?.parent;
  if (ator?.documentName !== "Actor" || !ator.flags?.[FLAG]) return;
  const ids = [...(efeito.statuses ?? [])];
  if (!souResponsavel(ator)) return;
  const upd = {};
  for (const id of ids) if (ACUMULAVEIS.includes(id) && ator.flags[FLAG].acumulos?.[id]) upd[`${P}.acumulos.-=${id}`] = null;
  const saiu = ids.filter(id => CONDICOES_RECUPERAVEIS.includes(id) && !ator.statuses?.has(id));
  if (saiu.length) {
    const conds = [...new Set([...(ator.flags[FLAG].recuperado?.conds ?? []), ...saiu])];
    upd[`${P}.recuperado`] = { conds, estado: "aguardando" };
  }
  if (Object.keys(upd).length) await ator.update(upd);
  if (saiu.length) {
    try { if (!ator.statuses?.has("epm-recuperado")) await ator.toggleStatusEffect("epm-recuperado", { active: true }); } catch (err) { console.warn("EPM |", err); }
    await nota(ator, `<p><i class="fa-solid fa-shield-heart" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> se livrou de ${escapar(saiu.map(i => NOMES[i]).join(", "))}: fica <strong>Recuperado</strong> (imune a isso até o fim do próximo turno).</p>`, "#4E9A5B");
  }
}

/** Tira o Recuperado (e a imunidade). */
export async function encerrarRecuperado(ator) {
  if (!ator?.flags?.[FLAG]?.recuperado && !ator?.statuses?.has("epm-recuperado")) return;
  if (ator.flags[FLAG].recuperado) await ator.update({ [`${P}.-=recuperado`]: null });
  try { if (ator.statuses?.has("epm-recuperado")) await ator.toggleStatusEffect("epm-recuperado", { active: false }); } catch (err) { console.warn("EPM |", err); }
}

/** Novo turno do personagem: o Recuperado vale durante este turno e acaba no próximo Novo turno. Devolve updates. */
export function recuperadoNoNovoTurno(dados) {
  const r = dados?.recuperado;
  if (!r) return { updates: {}, encerrar: false };
  if (r.estado === "aguardando") return { updates: { [`${P}.recuperado.estado`]: "noTurno" }, encerrar: false };
  return { updates: {}, encerrar: true };
}

/**
 * updateCombat (só no Mestre ativo): o turno de alguém acabou → o Recuperado dele termina
 * e a Confusão da Voz interna (primeiro turno) sai.
 */
export async function aoMudarTurno(combate, mudancas) {
  if (!souMestreAtivo() || !combate?.started) return;
  if (!("turn" in (mudancas ?? {})) && !("round" in (mudancas ?? {}))) return;
  const anterior = combate.previous?.combatantId ? combate.combatants?.get(combate.previous.combatantId) : null;
  const ator = anterior?.actor;
  if (!ator?.flags?.[FLAG]) return;
  if (ator.flags[FLAG].recuperado?.estado === "noTurno") await encerrarRecuperado(ator);
  if (ator.flags[FLAG].vozConfuso && ator.flags[FLAG].vozConfuso === combate.id) {
    await ator.update({ [`${P}.-=vozConfuso`]: null });
    try { if (ator.statuses?.has("epm-confuso")) await ator.toggleStatusEffect("epm-confuso", { active: false }); } catch (err) { console.warn("EPM |", err); }
  }
}

/** Fim do combate: ninguém continua Recuperado. */
export async function aoFimDoCombate(combate) {
  if (!souMestreAtivo()) return;
  for (const c of combate?.combatants ?? []) {
    const a = c.actor;
    if (!a?.flags?.[FLAG]) continue;
    if (a.flags[FLAG].recuperado) await encerrarRecuperado(a);
    if (a.flags[FLAG].vozConfuso) await a.update({ [`${P}.-=vozConfuso`]: null });
  }
}

/* -------------------------------------------- */
/*  17. Traumas                                 */
/* -------------------------------------------- */

/** Sanidade a 0: sorteia (ou o Mestre escolhe) um trauma, grava na ficha e a Sanidade volta a 20. */
export async function ganharTrauma(ator, { escolher = false, traumaId = "" } = {}) {
  const tabela = tabelaTraumas();
  if (!tabela.length) return null;
  let escolhido = tabela.find(t => t.id === traumaId) ?? null;
  let sorteio = null;
  if (!escolhido && escolher) {
    const r = await fvtt.DialogV2.wait({
      window: { title: `Trauma: ${ator.name}` }, classes: ["epm-dialogo"], rejectClose: false, modal: false,
      content: `<p><strong>${escapar(ator.name)}</strong> chegou a 0 de Sanidade e ganha um trauma permanente. A Sanidade volta para ${SANIDADE_DEPOIS_DO_TRAUMA}.</p>
        <label class="epm-campo"><span>Trauma</span><select name="trauma"><option value="">Sortear</option>${tabela.map(t => `<option value="${escapar(t.id)}">${escapar(t.nome)}</option>`).join("")}</select></label>`,
      buttons: [
        { action: "ok", label: "Dar o trauma", icon: "fa-solid fa-brain", default: true, callback: (ev, b) => ({ trauma: b.form.elements.trauma.value }) },
        { action: "cancelar", label: "Agora não", icon: "fa-solid fa-xmark" }
      ]
    });
    if (!r || typeof r !== "object") return null;
    escolhido = tabela.find(t => t.id === r.trauma) ?? null;
  }
  if (!escolhido) {
    sorteio = new Roll(`1d${tabela.length}`);
    await sorteio.evaluate();
    escolhido = tabela[sorteio.total - 1] ?? tabela[0];
  }
  const { estadoAtor } = await M();
  const ps = estadoAtor(ator).ficha.recursos.ps;
  const volta = ps.max > 0 ? Math.min(ps.max, SANIDADE_DEPOIS_DO_TRAUMA) : SANIDADE_DEPOIS_DO_TRAUMA;
  const id = foundry.utils.randomID();
  await ator.update({
    [`${P}.traumas.${id}`]: { tipo: escolhido.id, nome: escolhido.nome, texto: escolhido.texto, gatilho: "", gatilhoPresente: false, criado: Date.now() },
    [`${P}.recursos.ps.value`]: volta
  });
  await nota(ator, `<p><i class="fa-solid fa-brain" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> chegou a 0 de Sanidade e ganhou um trauma${sorteio ? ` (1d${tabela.length} = ${sorteio.total})` : ""}: <strong>${escapar(escolhido.nome)}</strong>.</p>
    <p>${escapar(escolhido.texto)}</p>${escolhido.id === "fobia" ? "<p class=\"epm-dica\">O jogador escolhe o gatilho na ficha (caixa Traumas).</p>" : ""}<p>A Sanidade volta para ${volta}.</p>`, "#7A4FA0");
  return escolhido;
}

/** combatStart (Mestre ativo): Voz interna rola 1d6 para cada um; com 1, Confuso no primeiro turno. */
export async function vozInterna(combate) {
  if (!souMestreAtivo() || !regra("traumas")) return;
  for (const c of combate?.combatants ?? []) {
    const a = c.actor;
    const traumas = Object.values(a?.flags?.[FLAG]?.traumas ?? {}).filter(t => t?.tipo === "voz");
    if (!traumas.length) continue;
    const r = new Roll("1d6");
    await r.evaluate();
    const confuso = r.total === 1;
    if (confuso) {
      try { if (!a.statuses?.has("epm-confuso")) await a.toggleStatusEffect("epm-confuso", { active: true }); } catch (err) { console.warn("EPM |", err); }
      await a.update({ [`${P}.vozConfuso`]: combate.id });
    }
    await r.toMessage({ speaker: ChatMessage.getSpeaker({ actor: a }), flags: { [FLAG]: { automatico: true } }, flavor: `<span class="epm-flavor"><strong>Voz interna</strong><em>${confuso ? "Com 1: Confuso no primeiro turno" : "Sem efeito neste combate"}</em></span>` });
  }
}
