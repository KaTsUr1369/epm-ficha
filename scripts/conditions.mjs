/** Registra as condições EPM como status do Foundry (HUD do token e Actor#toggleStatusEffect). */
import { CONDICOES } from "./config.mjs";
import { ajustes } from "./settings.mjs";

/** Status que o dnd5e e o Foundry usam internamente e que não podem sumir. */
const MANTER = ["dead", "unconscious", "exhaustion", "concentrating", "bloodied"];

/** Condições que já existiam na 0.2.x: mantêm o _id antigo para os efeitos já criados continuarem ligados. */
const LEGADO = new Set(["epm-lento", "epm-preso", "epm-caido", "epm-cego", "epm-surdo", "epm-silenciado", "epm-envenenado",
  "epm-enfraquecido", "epm-atordoado", "epm-congelado", "epm-paralisado", "epm-dormindo", "epm-inconsciente",
  "epm-sangrando", "epm-invisivel", "epm-voando", "epm-concentrado"]);

function hash36(texto) {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (const ch of String(texto)) {
    const c = ch.codePointAt(0);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ (c + 7), 2246822519) >>> 0;
  }
  return (h1.toString(36) + h2.toString(36)).padEnd(13, "0");
}

/**
 * _id fixo de 16 caracteres para cada condição. As antigas usam o formato da 0.2.x;
 * as novas usam um código calculado do nome (nomes longos não colidem).
 */
export function idEstatico(id) {
  if (LEGADO.has(id)) return `epm${String(id).replace(/[^a-z0-9]/gi, "")}`.padEnd(16, "0").slice(0, 16);
  return `epm${hash36(id)}`.slice(0, 16);
}

export function registrarCondicoes() {
  const todas = ajustes().condicoesHudTodas;
  const epm = CONDICOES.map(c => ({
    id: c.id,
    _id: idEstatico(c.id),
    name: c.label,
    img: c.icone,
    description: `<p>${c.efeito}</p>`,
    hud: todas || c.categoria === "basicas"
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
