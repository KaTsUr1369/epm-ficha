/**
 * Testes contra a morte: com 0 de Vida, d20 puro. 11 ou mais = 1 sucesso, 10 ou menos = 1 falha;
 * 20 natural = 2 sucessos, 1 natural = 2 falhas. Melhor de 5: 3 sucessos estabiliza, 3 falhas morre.
 * Recuperar Vida acima de 0 zera tudo.
 */
import { FLAG } from "./config.mjs";
import { int } from "./data.mjs";
import { escapar } from "./helpers.mjs";

const P = `flags.${FLAG}`;
export const META_MORTE = 3;

/** Resultado de um d20 no teste contra a morte. */
export function resultadoMorte(d20) {
  const n = int(d20);
  if (n >= 20) return { sucessos: 2, falhas: 0, texto: "Sucesso crítico: 2 pontos positivos" };
  if (n <= 1) return { sucessos: 0, falhas: 2, texto: "Falha crítica: 2 pontos negativos" };
  if (n >= 11) return { sucessos: 1, falhas: 0, texto: "Sucesso: 1 ponto positivo" };
  return { sucessos: 0, falhas: 1, texto: "Falha: 1 ponto negativo" };
}

/** Estado atual (para a ficha). */
export function estadoMorte(actor) {
  const hp = actor?.system?.attributes?.hp ?? {};
  const m = actor?.flags?.[FLAG]?.morte ?? {};
  const zerado = int(hp.max) > 0 && int(hp.value) <= 0;
  const sucessos = Math.min(META_MORTE, Math.max(0, int(m.sucessos)));
  const falhas = Math.min(META_MORTE, Math.max(0, int(m.falhas)));
  const estado = m.estado === "estavel" || m.estado === "morto" ? m.estado : "";
  return {
    ativo: zerado, sucessos, falhas, estado,
    pipsSucesso: Array.from({ length: META_MORTE }, (_, i) => i < sucessos),
    pipsFalha: Array.from({ length: META_MORTE }, (_, i) => i < falhas),
    texto: estado === "estavel" ? "Estável: não morre, mas continua com 0 de Vida até ser curado."
      : estado === "morto" ? "Morreu: 3 falhas nos testes contra a morte."
      : "Com 0 de Vida: d20 puro. 11+ é ponto positivo, 10− é negativo; 20 vale 2 positivos e 1 vale 2 negativos. 3 de um lado decidem."
  };
}

/** Rola um teste contra a morte (d20 sem bônus) e aplica o resultado. */
export async function testeContraMorte(actor) {
  const e = estadoMorte(actor);
  if (!e.ativo) { ui.notifications.info(`${actor.name} não está com 0 de Vida.`); return null; }
  if (e.estado) { ui.notifications.info(`${actor.name} já está ${e.estado === "estavel" ? "estável" : "morto"}.`); return null; }
  const roll = await new Roll("1d20").evaluate();
  const d20 = roll.dice?.[0]?.total ?? roll.total;
  const r = resultadoMorte(d20);
  const sucessos = Math.min(META_MORTE, e.sucessos + r.sucessos);
  const falhas = Math.min(META_MORTE, e.falhas + r.falhas);
  const estado = sucessos >= META_MORTE ? "estavel" : falhas >= META_MORTE ? "morto" : "";
  await actor.update({ [`${P}.morte`]: { sucessos, falhas, estado } });
  if (estado === "morto") {
    const morto = CONFIG.specialStatusEffects?.DEFEATED ?? "dead";
    try { if (!actor.statuses?.has(morto)) await actor.toggleStatusEffect(morto, { active: true, overlay: true }); } catch (err) { console.warn("EPM |", err); }
  }
  const pips = (n, cls) => Array.from({ length: META_MORTE }, (_, i) => `<span class="epm-morte-pip ${cls}${i < n ? " marcado" : ""}"></span>`).join("");
  const final = estado === "estavel" ? `<p><strong>${escapar(actor.name)} estabilizou.</strong> Continua com 0 de Vida até ser curado.</p>`
    : estado === "morto" ? `<p><strong>${escapar(actor.name)} morreu.</strong></p>` : "";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }), rolls: [roll],
    content: `<div class="epm-chat epm-chat-nota epm-chat-morte" style="--cor: ${estado === "morto" ? "#D2544A" : estado === "estavel" ? "#5FB38A" : "#B9A27A"}">
      <p><strong>Teste contra a morte</strong>: d20 = <strong>${d20}</strong>. ${escapar(r.texto)}.</p>
      <p class="epm-morte-placar"><span>Positivos ${pips(sucessos, "sucesso")}</span> <span>Negativos ${pips(falhas, "falha")}</span></p>${final}</div>`
  });
  return { d20, ...r, sucessos, falhas, estado };
}

/** Vida mudou: subiu acima de 0 zera os testes; caiu a 0 começa do zero e avisa. */
export async function vidaMudouMorte(actor, pvAntes) {
  const hp = actor?.system?.attributes?.hp ?? {};
  const m = actor?.flags?.[FLAG]?.morte;
  if (int(hp.value) > 0) {
    if (m && (int(m.sucessos) || int(m.falhas) || m.estado)) await actor.update({ [`${P}.-=morte`]: null });
    return;
  }
  if (int(hp.max) > 0 && pvAntes !== undefined && int(pvAntes) > 0) {
    await actor.update({ [`${P}.morte`]: { sucessos: 0, falhas: 0, estado: "" } });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="epm-chat epm-chat-nota" style="--cor: #D2544A"><p><strong>${escapar(actor.name)} caiu a 0 de Vida.</strong> A cada turno, um teste contra a morte (d20 puro): 3 pontos positivos estabiliza, 3 negativos morre.</p></div>`
    });
  }
}
