/**
 * Escolhidos pelo Multiverso: Ficha — ponto de entrada do módulo.
 */
import { MODULE_ID, CAMINHO } from "./config.mjs";
import { registrarHelpers, fvtt } from "./helpers.mjs";
import { registrarAjustes } from "./settings.mjs";
import { registrarCondicoes } from "./conditions.mjs";
import { EPMActorSheet } from "./actor-sheet.mjs";
import { EPMPoderSheet, abrirEditorPoder } from "./poder-sheet.mjs";
import * as mecanicas from "./mecanicas.mjs";
import { prepararPastaImagens } from "./imagens.mjs";

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
  if (modulo) modulo.api = { EPMActorSheet, EPMPoderSheet, abrirEditorPoder, mecanicas };
});

Hooks.once("setup", () => registrarCondicoes());

Hooks.once("ready", () => {
  mecanicas.registrarChat();
  mecanicas.integrarIniciativa(EPMActorSheet);
  prepararPastaImagens();
  console.log(`${MODULE_ID} | Ficha Escolhidos pelo Multiverso pronta`);
});
