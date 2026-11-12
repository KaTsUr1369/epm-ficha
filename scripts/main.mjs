/**
 * Escolhidos pelo Multiverso: Ficha — ponto de entrada do módulo.
 */
import { MODULE_ID, CAMINHO, FLAG } from "./config.mjs";
import { registrarHelpers, fvtt, escapar } from "./helpers.mjs";
import { registrarAjustes, ajustes, migrarListaPericiasMundo } from "./settings.mjs";
import { registrarCondicoes } from "./conditions.mjs";
import { EPMActorSheet, catalogoBencaos } from "./actor-sheet.mjs";
import { EPMPoderSheet, abrirEditorPoder } from "./poder-sheet.mjs";
import { EPMItemSheet, abrirEditorItem } from "./item-sheet.mjs";
import * as mecanicas from "./mecanicas.mjs";
import { prepararPastaImagens } from "./imagens.mjs";
import { relacaoMultipla } from "./relacoes.mjs";
import { PainelGrupo, abrirPainelGrupo, atualizarPainelGrupo, botaoNoDiretorio } from "./grupo.mjs";
import { EscudoMestre, abrirEscudo, atualizarEscudo, botaoEscudo } from "./escudo.mjs";
import { integrarDock } from "./integracao-dock.mjs";
import { registrarRelogioProjetos } from "./projetos.mjs";
import { registrarSeletorDano } from "./seletor-dano.mjs";

integrarDock();
registrarRelogioProjetos();
registrarSeletorDano();
import * as extras from "./extras.mjs";
import * as mundo from "./mundo.mjs";
import { sincronizarMaximos } from "./ficha-060.mjs";

const ID_FICHA = `${MODULE_ID}.EPMActorSheet`;

Hooks.once("init", () => {
  registrarAjustes();
  // Marcador de turno EPM em volta do token de quem está na vez (quando a configuração do combate não define outra imagem)
  if (CONFIG.Combat && ajustes().marcadorTurnoEpm !== false) CONFIG.Combat.fallbackTurnMarker = `modules/${MODULE_ID}/assets/marcador-turno.webp`;
  registrarHelpers(Handlebars);

  const DSC = fvtt.DocumentSheetConfig;
  const rotulo = "Ficha EPM (Escolhidos pelo Multiverso)";
  DSC.registerSheet(Actor, MODULE_ID, EPMActorSheet, { types: ["character"], makeDefault: true, label: rotulo });
  DSC.registerSheet(Actor, MODULE_ID, EPMActorSheet, { types: ["npc"], makeDefault: false, label: rotulo });
  DSC.registerSheet(Item, MODULE_ID, EPMPoderSheet, { types: ["feat", "spell"], makeDefault: false, label: "Editor de poder EPM" });
  const tiposItem = ["weapon", "equipment", "consumable", "tool", "loot", "container"].filter(t => !CONFIG.Item?.dataModels || t in CONFIG.Item.dataModels);
  DSC.registerSheet(Item, MODULE_ID, EPMItemSheet, { types: tiposItem, makeDefault: true, label: "Editor de item EPM" });

  fvtt.loadTemplates({
    "epm-item-linha": `${CAMINHO}/partials/item-linha.hbs`,
    "epm-poder-linha": `${CAMINHO}/partials/poder-linha.hbs`,
    "epm-exaustao": `${CAMINHO}/partials/exaustao.hbs`,
    "epm-bencao": `${CAMINHO}/partials/bencao.hbs`,
    "epm-arquetipo-painel": `${CAMINHO}/partials/arquetipo-painel.hbs`,
    "epm-transformacoes": `${CAMINHO}/partials/transformacoes.hbs`,
    "epm-historico": `${CAMINHO}/partials/historico.hbs`,
    "epm-painel-060": `${CAMINHO}/partials/painel-060.hbs`
  });

  const modulo = game.modules.get(MODULE_ID);
  if (modulo) modulo.api = { EPMActorSheet, EPMPoderSheet, EPMItemSheet, abrirEditorPoder, abrirEditorItem, mecanicas, extras, relacaoMultipla, catalogoBencaos, PainelGrupo, painelGrupo: abrirPainelGrupo, EscudoMestre, escudoMestre: abrirEscudo, mundo };
});

Hooks.once("setup", () => registrarCondicoes());

Hooks.once("ready", () => {
  mecanicas.registrarChat();
  mundo.registrarSocket();
  mecanicas.integrarIniciativa(EPMActorSheet);
  prepararPastaImagens();
  verificarFichaPadrao();
  migrarListaPericiasMundo().catch(err => console.warn("EPM | Migração da lista de perícias", err));
  console.log(`${MODULE_ID} | Ficha Escolhidos pelo Multiverso pronta`);
});

/** Menu do chat: as opções de dano do D&D 5e não valem para os cartões EPM (eles têm o botão Aplicar dano). */
Hooks.on("getChatMessageContextOptions", mecanicas.filtrarMenuChat);
Hooks.on("renderActorDirectory", botaoNoDiretorio);
Hooks.on("renderActorDirectory", botaoEscudo);
Hooks.on("renderCombatTracker", botaoEscudo);
for (const gancho of ["updateActor", "createActiveEffect", "deleteActiveEffect", "updateCombat", "createCombat", "deleteCombat",
  "createCombatant", "updateCombatant", "deleteCombatant", "controlToken", "createItem", "deleteItem"]) Hooks.on(gancho, atualizarEscudo);
for (const gancho of ["updateActor", "createActiveEffect", "deleteActiveEffect", "createActor", "deleteActor"]) Hooks.on(gancho, atualizarPainelGrupo);
Hooks.on("getChatLogEntryContext", mecanicas.filtrarMenuChat);

/** Fim de combate: recarrega usos "por combate" e aplica maldições de fim de combate. */
Hooks.on("deleteCombat", combate => {
  mecanicas.fimDeCombate(combate).catch(err => console.error("EPM | Fim de combate", err));
});

/** Quando um personagem muda, as fichas que têm relação com ele atualizam nome, imagem e background. */
/* Gatilho "ao sofrer dano" dos bônus situacionais (roda no cliente do dono do personagem) */
Hooks.on("preUpdateActor", (ator, mudancas, opcoes) => {
  const hp = ator.system?.attributes?.hp;
  if (hp && foundry.utils.hasProperty(mudancas, "system.attributes.hp")) opcoes.epmPvAntes = (Number(hp.value) || 0) + (Number(hp.temp) || 0);
});
Hooks.on("updateActor", (ator, mudancas, opcoes) => {
  if (opcoes?.epmPvAntes === undefined || !ator.flags?.[FLAG]) return;
  const hp = ator.system?.attributes?.hp ?? {};
  if ((Number(hp.value) || 0) + (Number(hp.temp) || 0) >= opcoes.epmPvAntes) return;
  const donos = game.users.filter(u => u.active && !u.isGM && ator.testUserPermission(u, "OWNER"));
  const responsavel = donos[0] ?? game.users.activeGM;
  if (responsavel?.isSelf) mecanicas.gatilhosAoSofrerDano(ator).catch(err => console.warn("EPM | gatilho ao sofrer dano", err));
});

Hooks.on("updateActor", ator => {
  for (const app of fichasAbertas()) {
    if (app.actor?.uuid === ator.uuid) continue;
    const relacoes = Object.values(app.actor?.flags?.[FLAG]?.relacoes ?? {});
    if (relacoes.some(r => r?.uuid === ator.uuid)) app.render({ parts: ["relacoes"] });
  }
});

function fichasAbertas() {
  const out = [];
  const instancias = foundry.applications?.instances;
  if (instancias?.values) for (const app of instancias.values()) if (app instanceof EPMActorSheet && app.rendered) out.push(app);
  return out;
}

/**
 * Avisa o Mestre quando a ficha padrão de personagens do mundo não é a EPM
 * (nesse caso os jogadores abrem a ficha do D&D) e corrige com um clique.
 */
async function verificarFichaPadrao() {
  if (!game.user.isGM || !ajustes().avisoFichaPadrao) return;
  let atual;
  try { atual = game.settings.get("core", "sheetClasses")?.Actor?.character; } catch { atual = undefined; }
  if (!atual || atual === ID_FICHA) return;
  const nome = CONFIG.Actor?.sheetClasses?.character?.[atual]?.label ?? atual;
  const r = await fvtt.DialogV2.wait({
    window: { title: "Ficha EPM" }, classes: ["epm-dialogo"], rejectClose: false, modal: false,
    content: `<p>A ficha padrão de personagens deste mundo está como <strong>${escapar(nome)}</strong>.</p>
      <p>Por isso os jogadores abrem essa ficha em vez da Ficha EPM.</p>`,
    buttons: [
      { action: "corrigir", label: "Usar a Ficha EPM", icon: "fa-solid fa-check", default: true },
      { action: "depois", label: "Agora não", icon: "fa-solid fa-clock" },
      { action: "nunca", label: "Não avisar mais", icon: "fa-solid fa-bell-slash" }
    ]
  });
  if (r === "nunca") return game.settings.set(MODULE_ID, "avisoFichaPadrao", false);
  if (r !== "corrigir") return;
  try {
    const DSC = fvtt.DocumentSheetConfig;
    if (typeof DSC?.updateDefaultSheets === "function") await DSC.updateDefaultSheets({ Actor: { character: ID_FICHA } });
    else {
      const atuais = foundry.utils.deepClone(game.settings.get("core", "sheetClasses") ?? {});
      foundry.utils.setProperty(atuais, "Actor.character", ID_FICHA);
      await game.settings.set("core", "sheetClasses", atuais);
    }
    ui.notifications.info("A Ficha EPM agora é a ficha padrão dos personagens. Peça aos jogadores para recarregar (F5).");
  } catch (err) {
    console.error("EPM |", err);
    ui.notifications.error("Não consegui mudar a ficha padrão. Faça em Configurações → Configurar fichas padrão → Ator / Personagem.");
  }
}

/* ---------- 0.6.0 ---------- */

/** Chefes com fases, aviso de queda no Discord e máximos automáticos de Vida/Mana/Estamina. */
Hooks.on("updateActor", (ator, mudancas, opcoes) => {
  if (!ator.flags?.[FLAG]) return;
  if (foundry.utils.hasProperty(mudancas, "system.attributes.hp")) {
    mundo.verificarFaseChefe(ator).catch(err => console.warn("EPM | fase do chefe", err));
    const hp = ator.system?.attributes?.hp ?? {};
    if (mundo.souMestreAtivo() && ator.hasPlayerOwner && Number(hp.value) <= 0 && Number(opcoes?.epmPvAntes) > 0) {
      mundo.avisarDiscord("morte", `☠️ **${ator.name}** caiu a 0 de Vida.`);
    }
  }
  if (!opcoes?.epmSincronizar && ator.isOwner && ator.flags[FLAG].recursosAuto?.ativo) {
    const donos = game.users.filter(u => u.active && ator.testUserPermission(u, "OWNER"));
    const resp = donos.find(u => !u.isGM) ?? game.users.activeGM;
    if (resp?.isSelf) sincronizarMaximos(ator).catch(err => console.warn("EPM | máximos automáticos", err));
  }
});

/** Ações de Covil: lembrete ao Mestre a cada rodada nova. */
Hooks.on("updateCombat", (combate, mudancas) => {
  if ("round" in (mudancas ?? {})) mundo.lembrarCovil(combate).catch(err => console.warn("EPM | covil", err));
});

/** Botões só do Mestre nos cartões (encerrar enquete). */
Hooks.on("renderChatMessageHTML", mundo.ocultarBotoesDeMestre);
