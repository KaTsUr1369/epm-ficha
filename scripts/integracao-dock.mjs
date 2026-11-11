/**
 * Integração com o módulo Combat Tracker Dock (theripper93): o carrossel do combate passa a mostrar
 * os valores do EPM (PV, PM, PE, PS, CA, defesas e DT) e ganha o botão do Escudo do Mestre.
 * Atributos com o prefixo "epm." são lidos da ficha EPM; o resto continua com o padrão do dock.
 */
import { FLAG } from "./config.mjs";
import { lerAtor } from "./context.mjs";
import { abrirEscudo } from "./escudo.mjs";

const DOCK = "combat-tracker-dock";

/** Atributos que o dock mostra para cada combatente (ícone, valor, unidade). */
export const ATRIBUTOS_DOCK = [
  { attr: "epm.pv", icon: "fas fa-heart", units: "PV" },
  { attr: "epm.pm", icon: "fas fa-droplet", units: "PM" },
  { attr: "epm.pe", icon: "fas fa-bolt", units: "PE" },
  { attr: "epm.ps", icon: "fas fa-brain", units: "PS" },
  { attr: "epm.ca", icon: "fas fa-shield", units: "CA" },
  { attr: "epm.esquiva", icon: "fas fa-person-running", units: "Esquiva" },
  { attr: "epm.bloqueio", icon: "fas fa-shield-halved", units: "Bloqueio" },
  { attr: "epm.contra", icon: "fas fa-hand-fist", units: "Contra" },
  { attr: "epm.dt", icon: "fas fa-hand-sparkles", units: "DT" }
];

/** Valor EPM de um ator para uma chave (pv, pm, pe, ps, ca, esquiva, bloqueio, contra, dt, exaustao). */
export function valorEPM(actor, chave) {
  let ficha;
  try { ({ ficha } = lerAtor(actor)); } catch { return { max: undefined, value: undefined, percentage: undefined }; }
  const rec = ficha.recursos?.[chave];
  if (rec) {
    const temp = Math.max(0, rec.temp ?? 0);
    return { max: rec.max, value: temp ? `${rec.value}+${temp}` : rec.value, percentage: rec.max > 0 ? Math.min(100, Math.max(0, Math.round((rec.value / rec.max) * 100))) : undefined };
  }
  const def = (ficha.defesas ?? []).find(d => d.id === chave);
  const valor = def ? def.valor
    : chave === "ca" ? ficha.ca?.total
      : chave === "dt" ? ficha.cd?.valor
        : chave === "exaustao" ? ficha.exaustao?.nivel : undefined;
  return { max: undefined, value: valor, percentage: undefined };
}

export function integrarDock() {
  Hooks.once(`${DOCK}-init`, cfg => {
    const Base = cfg.CombatantPortrait;
    if (Base) {
      cfg.CombatantPortrait = class EPMCombatantPortrait extends Base {
        getResource(resource = null, primary = false) {
          const r = resource ?? this.combat?.settings?.resource;
          if (typeof r === "string" && r.startsWith("epm.") && this.actor) return valorEPM(this.actor, r.slice(4));
          return super.getResource(resource, primary);
        }
      };
    }
    // Padrão do dock para o dnd5e passa a ser o do EPM (vale em "Restaurar padrão" da configuração de atributos)
    const padrao = cfg.defaultAttributesConfig;
    if (typeof padrao === "function") cfg.defaultAttributesConfig = () => ({ ...padrao(), dnd5e: ATRIBUTOS_DOCK });
  });

  // Uma vez por mundo: aplica os atributos EPM e a 2ª barra (Mana) no dock
  // (espera o dock registrar as opções dele, que também acontece no "ready")
  Hooks.once("ready", () => setTimeout(async () => {
    if (!game.user.isGM || !game.modules.get(DOCK)?.active) return;
    if (game.settings.get(FLAG, "dockConfigurado") || !game.settings.settings.has(`${DOCK}.attributes`)) return;
    try {
      await game.settings.set(DOCK, "attributes", ATRIBUTOS_DOCK);
      await game.settings.set(DOCK, "resource", "epm.pm");
      await game.settings.set(FLAG, "dockConfigurado", true);
      ui.notifications.info("EPM: Combat Tracker Dock configurado com PV, PM, PE, PS, CA, defesas e DT.");
    } catch (err) {
      console.warn("EPM | Não consegui configurar o Combat Tracker Dock", err);
    }
  }, 1500));

  // Botão do Escudo do Mestre no carrossel (só o Mestre)
  Hooks.on("renderCombatDock", app => {
    if (!game.user.isGM) return;
    const raiz = app.element;
    const lado = raiz?.querySelector(".buttons-container.left");
    if (!lado || lado.querySelector(".epm-dock-escudo")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "icon ui-control fa-solid fa-shield epm-dock-escudo";
    b.dataset.tooltip = "Escudo do Mestre (EPM)";
    b.setAttribute("aria-label", "Escudo do Mestre");
    b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); abrirEscudo(); });
    lado.prepend(b);
  });
}
