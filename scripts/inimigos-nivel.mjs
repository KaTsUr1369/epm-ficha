/**
 * Inimigos por nível (Guia de Balanceamento): CA, acerto, CD, Vida e dano por turno sugeridos
 * para Lacaio, Monstro, Monstro Forte e Chefe, do nível 1 ao 50 (interpolado entre as linhas).
 * O Lacaio usa a CA, o acerto e a CD do Monstro.
 */
import { FLAG } from "./config.mjs";
import { int } from "./data.mjs";
import { escapar } from "./helpers.mjs";

const P = `flags.${FLAG}`;

/** [nível, CA M/F/C, acerto M/F/C, CD M/F/C, PV lacaio/monstro/forte/chefe, dano lacaio/monstro/forte/chefe] */
export const TABELA_INIMIGOS = [
  [1, [19, 21, 23], [11, 13, 15], [21, 23, 25], [6, 20, 52, 130], [2, 4, 6, 10]],
  [5, [21, 23, 25], [13, 15, 17], [23, 25, 27], [12, 38, 100, 250], [3, 8, 12, 20]],
  [10, [24, 26, 28], [16, 18, 20], [26, 28, 30], [20, 60, 160, 400], [5, 12, 20, 32]],
  [15, [31, 33, 35], [23, 25, 27], [33, 35, 37], [28, 82, 220, 550], [7, 16, 28, 44]],
  [20, [34, 36, 38], [26, 28, 30], [36, 38, 40], [35, 105, 280, 700], [8, 21, 35, 56]],
  [25, [36, 38, 40], [28, 30, 32], [38, 40, 42], [42, 128, 340, 850], [10, 26, 42, 68]],
  [30, [39, 41, 43], [31, 33, 35], [41, 43, 45], [50, 150, 400, 1000], [12, 30, 50, 80]],
  [35, [46, 48, 50], [38, 40, 42], [48, 50, 52], [58, 172, 460, 1150], [14, 34, 58, 92]],
  [40, [49, 51, 53], [41, 43, 45], [51, 53, 55], [65, 195, 520, 1300], [16, 39, 65, 104]],
  [45, [51, 53, 55], [43, 45, 47], [53, 55, 57], [72, 218, 580, 1450], [17, 44, 72, 116]],
  [50, [54, 56, 58], [46, 48, 50], [56, 58, 60], [80, 240, 640, 1600], [19, 48, 80, 128]]
];
export const TIPOS_INIMIGO = { lacaio: "Lacaio", monstro: "Monstro", forte: "Monstro Forte", chefe: "Chefe" };
const COL_DEF = { lacaio: 0, monstro: 0, forte: 1, chefe: 2 };
const COL_PV = { lacaio: 0, monstro: 1, forte: 2, chefe: 3 };

/** Valores sugeridos para o nível e o tipo (interpolados e arredondados). */
export function inimigoPorNivel(nivel, tipo = "monstro") {
  const n = Math.max(1, Math.min(50, int(nivel, 1)));
  const t = TIPOS_INIMIGO[tipo] ? tipo : "monstro";
  let i = TABELA_INIMIGOS.findIndex(l => l[0] >= n);
  if (i < 0) i = TABELA_INIMIGOS.length - 1;
  const b = TABELA_INIMIGOS[i];
  const a = i > 0 ? TABELA_INIMIGOS[i - 1] : b;
  const f = b[0] === a[0] ? 0 : (n - a[0]) / (b[0] - a[0]);
  const lerp = (x, y) => Math.round(x + (y - x) * f);
  const d = COL_DEF[t], p = COL_PV[t];
  return {
    nivel: n, tipo: t, tipoLabel: TIPOS_INIMIGO[t],
    ca: lerp(a[1][d], b[1][d]), acerto: lerp(a[2][d], b[2][d]), cd: lerp(a[3][d], b[3][d]),
    pv: lerp(a[4][p], b[4][p]), dano: lerp(a[5][p], b[5][p])
  };
}

const TIPO_DA_FICHA = { monstro: "monstro", forte: "forte", chefe: "chefe", comum: "lacaio", importante: "monstro" };

/** Botão "Preencher pelo nível" (aba Mestre): ajusta CA, acerto (Luta e Pontaria), CD, Vida e guarda o dano por turno. */
export async function preencherPeloNivel(actor) {
  if (!game.user?.isGM) return;
  const { formulario, opcoes } = await import("./mundo.mjs");
  const atual = actor.flags?.[FLAG]?.npc ?? {};
  const ref = atual.referencia ?? {};
  const tipoPadrao = ref.tipo || TIPO_DA_FICHA[atual.tipo] || "monstro";
  const r = await formulario("Preencher pelo nível", `
    <p class="epm-dica">Sugere CA, acerto, CD, Vida e dano por turno pela tabela de inimigos do Guia de Balanceamento (valores entre as linhas são interpolados). Dá para editar tudo depois.</p>
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Nível (1–50)</span><input type="number" name="nivel" min="1" max="50" value="${int(ref.nivel, 1)}"></label>
      <label class="epm-campo"><span>Tipo</span><select name="tipo">${opcoes(Object.entries(TIPOS_INIMIGO), tipoPadrao)}</select></label>
    </div>
    <label class="epm-check"><input type="checkbox" name="vida" checked> Trocar a Vida também</label>`, { botao: "Preencher" });
  if (!r) return;
  return aplicarInimigo(actor, inimigoPorNivel(r.nivel, r.tipo), { vida: r.vida !== false });
}

export async function aplicarInimigo(actor, v, { vida = true } = {}) {
  const { estadoAtor } = await import("./mecanicas.mjs");
  const { ficha } = estadoAtor(actor);
  const d = actor.flags?.[FLAG] ?? {};
  const upd = {};
  // CA: o que falta vai para "outros" da CA
  upd[`${P}.ca.bonus`] = int(d.ca?.bonus) + int(d.ca?.armadura) + (v.ca - ficha.ca.total);
  if (d.ca?.armadura !== undefined) upd[`${P}.ca.armadura`] = 0;
  // Acerto: Luta e Pontaria chegam ao valor (no "outros" da perícia)
  for (const id of ["luta", "pontaria"]) {
    const per = ficha.periciaPorId?.[id];
    if (per) upd[`${P}.pericias.${id}.outros`] = int(d.pericias?.[id]?.outros) + (v.acerto - per.total);
  }
  // CD: a perícia da DT (Arcanismo) chega ao valor
  const perCd = ficha.cd?.pericia;
  if (perCd && d.pericias?.[perCd]) upd[`${P}.pericias.${perCd}.outros`] = int(upd[`${P}.pericias.${perCd}.outros`] ?? d.pericias[perCd].outros) + (v.cd - ficha.cd.valor);
  if (vida) { upd["system.attributes.hp.max"] = v.pv; upd["system.attributes.hp.value"] = v.pv; }
  upd[`${P}.npc.referencia`] = v;
  await actor.update(upd);
  await ChatMessage.create({
    whisper: [...(game.users ?? [])].filter(u => u.isGM).map(u => u.id),
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#C9A35A"><p><strong>${escapar(actor.name)}: ${escapar(v.tipoLabel)} de nível ${v.nivel}</strong></p>
      <p>CA ${v.ca} · Acerto +${v.acerto} · CD ${v.cd} · Vida ${v.pv} · Dano por turno ~${v.dano}</p></div>`
  });
  return v;
}
