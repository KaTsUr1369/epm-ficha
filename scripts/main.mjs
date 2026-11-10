/**
 * Escolhidos pelo Multiverso: Ficha — ponto de entrada do módulo.
 */
import { MODULE_ID, CAMINHO, FLAG } from "./config.mjs";
import { registrarHelpers, fvtt, escapar } from "./helpers.mjs";
import { registrarAjustes, ajustes } from "./settings.mjs";
import { registrarCondicoes } from "./conditions.mjs";
import { EPMActorSheet, catalogoBencaos } from "./actor-sheet.mjs";
import { EPMPoderSheet, abrirEditorPoder } from "./poder-sheet.mjs";
import * as mecanicas from "./mecanicas.mjs";
import { prepararPastaImagens } from "./imagens.mjs";
import { relacaoMultipla } from "./relacoes.mjs";

const ID_FICHA = `${MODULE_ID}.EPMActorSheet`;

Hooks.once("init", () => {
  registrarAjustes();
  registrarHelpers(Handlebars);

  const DSC = fvtt.DocumentSheetConfig;
  const rotulo = "Ficha EPM (Escolhidos pelo Multiverso)";
  DSC.registerSheet(Actor, MODULE_ID, EPMActorSheet, { types: ["character"], makeDefault: true, label: rotulo });
  DSC.registerSheet(Actor, MODULE_ID, EPMActorSheet, { types: ["npc"], makeDefault: false, label: rotulo });
  DSC.registerSheet(Item, MODULE_ID, EPMPoderSheet, { types: ["feat", "spell"], makeDefault: false, label: "Editor de poder EPM" });

  fvtt.loadTemplates({
    "epm-item-linha": `${CAMINHO}/partials/item-linha.hbs`,
    "epm-poder-linha": `${CAMINHO}/partials/poder-linha.hbs`,
    "epm-exaustao": `${CAMINHO}/partials/exaustao.hbs`,
    "epm-bencao": `${CAMINHO}/partials/bencao.hbs`
  });

  const modulo = game.modules.get(MODULE_ID);
  if (modulo) modulo.api = { EPMActorSheet, EPMPoderSheet, abrirEditorPoder, mecanicas, relacaoMultipla, catalogoBencaos };
});

Hooks.once("setup", () => registrarCondicoes());

Hooks.once("ready", () => {
  mecanicas.registrarChat();
  mecanicas.integrarIniciativa(EPMActorSheet);
  prepararPastaImagens();
  verificarFichaPadrao();
  console.log(`${MODULE_ID} | Ficha Escolhidos pelo Multiverso pronta`);
});

/** Fim de combate: recarrega usos "por combate" e aplica maldições de fim de combate. */
Hooks.on("deleteCombat", combate => {
  mecanicas.fimDeCombate(combate).catch(err => console.error("EPM | Fim de combate", err));
});

/** Quando um personagem muda, as fichas que têm relação com ele atualizam nome, imagem e background. */
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
