/** Registra as condições EPM como status do Foundry (HUD do token e Actor#toggleStatusEffect). */
import { CONDICOES } from "./config.mjs";
import { ajustes } from "./settings.mjs";

/** Status que o dnd5e e o Foundry usam internamente e que não podem sumir. */
const MANTER = ["dead", "unconscious", "exhaustion", "concentrating", "bloodied"];

/** _id fixo de 16 caracteres para cada condição (mesmo padrão que o dnd5e usa). */
export function idEstatico(id) {
  return `epm${String(id).replace(/[^a-z0-9]/gi, "")}`.padEnd(16, "0").slice(0, 16);
}

export function registrarCondicoes() {
  const epm = CONDICOES.map(c => ({
    id: c.id,
    _id: idEstatico(c.id),
    name: c.label,
    img: c.icone,
    description: `<p>${c.descricao}</p>`
  }));
  const ids = new Set(epm.map(e => e.id));
  const atuais = (CONFIG.statusEffects ?? []).filter(s => !ids.has(s.id));
  if (ajustes().condicoesHud === "adicionar") {
    CONFIG.statusEffects = [...atuais, ...epm];
  } else {
    const especiais = new Set([...Object.values(CONFIG.specialStatusEffects ?? {}), ...MANTER]);
    CONFIG.statusEffects = [...atuais.filter(s => especiais.has(s.id)), ...epm];
  }
}
