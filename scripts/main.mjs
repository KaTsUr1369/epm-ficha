/**
 * Escolhidos pelo Multiverso: Ficha — ponto de entrada do módulo.
 */
import { MODULE_ID, CAMINHO, FLAG } from "./config.mjs";
import { registrarHelpers, fvtt, escapar } from "./helpers.mjs";
import { registrarAjustes, ajustes, migrarListaPericiasMundo, migrarReflexosMundo, migrarVontadeAutocontrole } from "./settings.mjs";
import { registrarCondicoes } from "./conditions.mjs";
import { EPMActorSheet, catalogoBencaos } from "./actor-sheet.mjs";
import { EPMPoderSheet, abrirEditorPoder } from "./poder-sheet.mjs";
import { EPMItemSheet, abrirEditorItem } from "./item-sheet.mjs";
import * as mecanicas from "./mecanicas.mjs";
import { prepararPastaImagens } from "./imagens.mjs";
import { prepararPastaTokens } from "./enquadrar-token.mjs";
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
import { sincronizarMaximos, sincronizarVisao, ajustarAtualPorBonus } from "./ficha-060.mjs";
import { agendarTokenEstado, botaoHudToken } from "./token-estados.mjs";
import { ligarGanchosNovas, prepararNovas } from "./novas.mjs";
import { registrarCompendioClasses, sincronizarCompendio } from "./compendio-classes.mjs";
import { registrarCompendioItens } from "./compendio-itens.mjs";
import { registrarDicasCompendio } from "./compendio-dicas.mjs";

ligarGanchosNovas();

const ID_FICHA = `${MODULE_ID}.EPMActorSheet`;

Hooks.once("init", () => {
  registrarAjustes();
  registrarCompendioClasses();
  registrarCompendioItens();
  registrarDicasCompendio();
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
    "epm-classe-painel": `${CAMINHO}/partials/classe-painel.hbs`,
    "epm-novas": `${CAMINHO}/partials/novas.hbs`,
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
  prepararNovas();
  mecanicas.integrarIniciativa(EPMActorSheet);
  prepararPastaImagens();
  prepararPastaTokens();
  verificarFichaPadrao();
  migrarListaPericiasMundo().then(() => migrarReflexosMundo()).then(() => migrarVontadeAutocontrole()).catch(err => console.warn("EPM | Migração da lista de perícias", err));
  console.log(`${MODULE_ID} | Ficha Escolhidos pelo Multiverso pronta`);
});

/** Menu do chat: as opções de dano do D&D 5e não valem para os cartões EPM (eles têm o botão Aplicar dano). */
Hooks.on("getChatMessageContextOptions", mecanicas.filtrarMenuChat);
// Imagem do token por estado (Normal, Insano, Machucado, Morrendo, Morto, Transformado)
Hooks.on("updateActor", ator => agendarTokenEstado(ator));
for (const h of ["createActiveEffect", "deleteActiveEffect", "updateActiveEffect"]) Hooks.on(h, ef => { if (ef.parent?.documentName === "Actor") { agendarTokenEstado(ef.parent); agendarBonusRecursos(ef.parent); } });
// Bônus em atributo muda a Vida/Mana/Estamina atual junto com a máxima
const bonusPendentes = new Map();
function agendarBonusRecursos(ator) {
  if (!ator?.flags?.[FLAG] || !game.users?.filter) return;
  const resp = game.users.filter(u => u.active && !u.isGM && ator.testUserPermission(u, "OWNER"))[0] ?? game.users.activeGM;
  if (!resp?.isSelf) return;
  clearTimeout(bonusPendentes.get(ator.id));
  bonusPendentes.set(ator.id, setTimeout(() => { bonusPendentes.delete(ator.id); ajustarAtualPorBonus(ator).catch(err => console.warn("EPM | bônus de atributo nos recursos", err)); }, 200));
}
Hooks.on("updateActor", (ator, mudancas, opcoes) => { if (!opcoes?.epmSincronizar) agendarBonusRecursos(ator); });
// Classe pronta: as habilidades entram sozinhas na ficha quando o nível do arquétipo chega
const classesPendentes = new Map();
function agendarClasse(ator) {
  if (!ator?.flags?.[FLAG]?.classe || !game.users?.filter) return;
  const resp = game.users.filter(u => u.active && !u.isGM && ator.testUserPermission(u, "OWNER"))[0] ?? game.users.activeGM;
  if (!resp?.isSelf) return;
  clearTimeout(classesPendentes.get(ator.id));
  classesPendentes.set(ator.id, setTimeout(() => {
    classesPendentes.delete(ator.id);
    extras.adicionarHabilidadesClasse(ator, "", { automatico: true }).catch(err => console.warn("EPM | habilidades de classe", err));
  }, 300));
}
Hooks.on("updateActor", (ator, mudancas) => {
  const fl = mudancas?.flags?.[FLAG];
  if (fl && ["nivel", "nivel2", "arquetipo", "arquetipo2"].some(k => k in fl)) agendarClasse(ator);
});
// Habilidade de classe apagada à mão não volta sozinha (o botão "Adicionar" do painel traz de volta)
Hooks.on("deleteItem", (item, opcoes, userId) => {
  const ref = item.flags?.[FLAG]?.classeRef;
  const ator = item.parent;
  if (!ref || ator?.documentName !== "Actor" || opcoes?.epmTrocaClasse || userId !== game.user.id) return;
  const lista = Array.isArray(ator.flags?.[FLAG]?.classeDispensadas) ? ator.flags[FLAG].classeDispensadas : [];
  if (!lista.includes(ref)) ator.update({ [`flags.${FLAG}.classeDispensadas`]: [...lista, ref] }).catch(() => null);
});
for (const h of ["createItem", "updateItem", "deleteItem"]) Hooks.on(h, it => { if (it.parent?.documentName === "Actor") agendarBonusRecursos(it.parent); });
Hooks.on("createToken", tok => { if (tok.actor) agendarTokenEstado(tok.actor); });
Hooks.on("renderTokenHUD", botaoHudToken);
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
/* Gatilho "no começo do combate" das habilidades com ativação condicional */
Hooks.on("combatStart", combate => {
  for (const c of combate?.combatants ?? []) {
    const ator = c.actor;
    if (!ator?.flags?.[FLAG]) continue;
    const donos = game.users.filter(u => u.active && !u.isGM && ator.testUserPermission(u, "OWNER"));
    const responsavel = donos[0] ?? game.users.activeGM;
    if (responsavel?.isSelf) mecanicas.dispararGatilhos(ator, "combate").catch(err => console.warn("EPM | gatilho no começo do combate", err));
  }
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
  const fl = mudancas?.flags?.[FLAG];
  if (!opcoes?.epmSincronizar && fl && (fl.racaEscolha || fl.sentidos || fl.racaAtivas) && ator.isOwner) {
    const resp = game.users.filter(u => u.active && ator.testUserPermission(u, "OWNER")).find(u => !u.isGM) ?? game.users.activeGM;
    if (resp?.isSelf) sincronizarVisao(ator).catch(err => console.warn("EPM | visão no escuro", err));
  }
});

/** Ações de Covil: lembrete ao Mestre a cada rodada nova. */
Hooks.on("updateCombat", (combate, mudancas) => {
  if ("round" in (mudancas ?? {})) mundo.lembrarCovil(combate).catch(err => console.warn("EPM | covil", err));
});

/** Botões só do Mestre nos cartões (encerrar enquete). */
Hooks.on("renderChatMessageHTML", mundo.ocultarBotoesDeMestre);


/* Chat só do que eu clicar: mensagens automáticas da ficha (gatilhos, automações, avisos do fim do combate…)
   não são criadas quando a ficha de quem fala está com a opção ligada. Pedidos de teste com botão continuam. */
Hooks.on("preCreateChatMessage", msg => {
  try {
    const f = msg.flags?.[FLAG] ?? {};
    if (!f.automatico || f.pedido) return;
    const ator = ChatMessage.getSpeakerActor?.(msg.speaker) ?? game.actors?.get(msg.speaker?.actor);
    if (ator?.flags?.[FLAG]?.ui?.chatDiscreto) return false;
  } catch (err) { console.warn("EPM | chat discreto", err); }
});

/* Treinamento "Trocar arma favorita": ao concluir, troca a favorita (só no cliente de quem fez a mudança). */
Hooks.on("updateActor", (ator, mudancas, opcoes, userId) => {
  if (userId !== game.user?.id) return;
  const treinos = mudancas?.flags?.[FLAG]?.treinamentos;
  if (!treinos) return;
  for (const [id, t] of Object.entries(treinos)) {
    if (t?.estado !== "concluido") continue;
    import("./ficha-060.mjs").then(m => m.aplicarTrocaFavorita(ator, id)).catch(err => console.warn("EPM | troca de arma favorita", err));
  }
});
