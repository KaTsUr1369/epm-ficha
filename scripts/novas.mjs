/**
 * Novas mecânicas: liga os ganchos do Foundry e os botões de chat dos módulos novos
 * (cooperacao, automacoes, oficina, vinculos, opcionais-acoes).
 */
import { FLAG } from "./config.mjs";
import { int } from "./data.mjs";
import * as C from "./cooperacao.mjs";
import * as A from "./automacoes.mjs";
import * as O from "./oficina.mjs";
import * as V from "./vinculos.mjs";
import * as R from "./opcionais-acoes.mjs";

const aviso = rotulo => err => console.warn(`EPM | ${rotulo}`, err);

/** Ganchos (chamado uma vez, no "init"). */
export function ligarGanchosNovas() {
  Hooks.on("preUpdateActor", (ator, mudancas, opcoes) => {
    try {
      A.antesDeAtualizar(ator, mudancas, opcoes);
      const hp = ator.system?.attributes?.hp;
      if (hp && foundry.utils.hasProperty(mudancas, "system.attributes.hp.value")) opcoes.epmHpAntes = Number(hp.value) || 0;
    } catch (err) { aviso("antes de atualizar")(err); }
  });
  Hooks.on("updateActor", (ator, mudancas, opcoes) => {
    if (!ator.flags?.[FLAG]) return;
    A.aoAtualizar(ator, mudancas, opcoes).catch(aviso("automações"));
    R.verificarFases(ator, opcoes).catch(aviso("fases do chefe"));
  });
  Hooks.on("deleteActiveEffect", efeito => { A.aoApagarEfeito(efeito).catch(aviso("Recuperado")); });
  // Âncoras: o item saiu do inventário ou a pessoa morreu
  Hooks.on("deleteItem", item => { if (item.parent?.documentName === "Actor") V.verificarAncoras({ itemDe: item.parent, itemId: item.id }).catch(aviso("âncoras")); });
  Hooks.on("createActiveEffect", efeito => {
    const ator = efeito?.parent;
    if (ator?.documentName === "Actor" && [...(efeito.statuses ?? [])].some(s => s === "epm-morto" || s === "dead")) V.verificarAncoras({ morto: ator }).catch(aviso("âncoras"));
  });
  Hooks.on("updateCombat", (combate, mudancas) => { A.aoMudarTurno(combate, mudancas).catch(aviso("fim do turno")); });
  Hooks.on("combatStart", combate => {
    A.vozInterna(combate).catch(aviso("Voz interna"));
    R.auraNoCombate(combate).catch(aviso("Aura de Horror"));
  });
  Hooks.on("deleteCombat", combate => {
    A.aoFimDoCombate(combate).catch(aviso("fim do combate"));
    R.resetarFases(combate).catch(aviso("fases do chefe"));
    R.feitosDoFimDoCombate(combate).catch(aviso("feitos"));
  });
  Hooks.on("renderChatMessageHTML", (msg, html) => { try { C.decorarMensagem(msg, html); } catch (err) { aviso("Inspiração no chat")(err); } });
}

/** Socket, tratadores do Mestre e o embrulho dos status (chamado no "ready"). */
export function prepararNovas() {
  C.registrarCooperacao();
  V.registrarVinculos();
  R.registrarOpcionaisAcoes();
  A.instalarEmbrulhoStatus();
}

/** Botões dos cartões de chat das novas mecânicas. */
export async function cliqueChatNovas(acao, actor, botao) {
  if (await C.cliqueInspiracao(acao, actor, botao)) return true;
  if (await R.cliqueOpcionais(acao, actor, botao)) return true;
  if (acao === "testePedido") { await A.resolverPedido(actor, botao); return true; }
  if (acao === "treinoPtGrupo") {
    let parceiro = null;
    try { parceiro = fromUuidSync(botao.dataset.parceiro); } catch { parceiro = null; }
    if (!parceiro?.isOwner) { ui.notifications.warn("Só quem controla esse personagem registra o treino dele."); return true; }
    const { treinoGanharPT } = await import("./mecanicas.mjs");
    await treinoGanharPT(parceiro, { grupo: botao.dataset.de ? [botao.dataset.de] : [] });
    return true;
  }
  if (acao === "treinoEmGrupo") {
    let parceiro = null;
    try { parceiro = fromUuidSync(botao.dataset.parceiro); } catch { parceiro = null; }
    if (!parceiro?.isOwner) { ui.notifications.warn("Só quem controla esse personagem registra o treino dele."); return true; }
    await O.registrarTreinoEmGrupo(parceiro, int(botao.dataset.horas), botao.dataset.de);
    return true;
  }
  return false;
}
