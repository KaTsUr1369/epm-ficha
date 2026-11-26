/**
 * Inimigos por nível (0.9.0): tabela calibrada no simulador de combate, uma linha por nível de 1 a 100
 * (51–100 são projeção, até o multiarquétipo ter regras). Lacaio usa a CA, o acerto e a CD do Monstro.
 * Ordem das contas: tabela → raridade → poder do grupo; PV e dano arredondados no fim (dano do Lacaio com 1 casa).
 * A primeira parte é pura (testável fora do Foundry).
 */
import { FLAG } from "./config.mjs";
import { int } from "./data.mjs";
import { escapar } from "./helpers.mjs";

const P = `flags.${FLAG}`;

/** [nível, Monstro [CA, acerto, CD, PV, dano], Forte [...], Chefe [...], Lacaio [PV, dano]] */
export const TABELA_INIMIGOS = [
  [1, [18,14,20,60,22], [19,15,22,116,22], [20,16,24,227,26], [15,5.5]],
  [2, [19,14,20,60,25], [20,15,22,118,25], [21,16,24,229,30], [15,6.3]],
  [3, [19,14,20,69,31], [20,15,22,134,31], [21,16,24,262,37], [17,7.7]],
  [4, [20,14,20,80,37], [21,15,22,155,37], [22,16,24,302,45], [20,9.3]],
  [5, [20,14,20,89,43], [21,15,22,173,43], [22,16,24,337,51], [22,10.7]],
  [6, [21,14,20,99,50], [22,15,22,194,50], [23,16,24,378,59], [25,12.4]],
  [7, [21,14,20,111,57], [22,15,22,217,57], [23,16,24,423,68], [28,14.2]],
  [8, [22,14,20,121,63], [23,15,22,237,63], [24,16,24,461,76], [30,15.8]],
  [9, [22,14,20,132,70], [23,15,22,257,70], [24,16,24,500,83], [33,17.4]],
  [10, [24,14,20,145,78], [25,15,22,283,78], [26,16,24,551,93], [36,19.5]],
  [11, [24,14,20,159,86], [25,15,22,310,86], [26,16,24,603,104], [40,22]],
  [12, [24,15,20,174,96], [25,16,22,339,96], [26,17,24,661,115], [43,24]],
  [13, [24,15,20,190,106], [25,16,22,371,106], [26,17,24,723,127], [48,26]],
  [14, [26,15,20,203,114], [27,16,22,395,114], [28,17,24,770,137], [51,28]],
  [15, [30,15,25,215,122], [31,16,27,420,122], [32,17,29,818,147], [54,31]],
  [16, [32,15,25,229,131], [33,16,27,447,131], [34,17,29,872,158], [57,33]],
  [17, [32,15,25,244,141], [33,16,27,475,141], [34,17,29,926,169], [61,35]],
  [18, [32,15,25,255,148], [33,16,27,496,148], [34,17,29,968,178], [64,37]],
  [19, [32,15,25,276,161], [33,16,27,537,161], [34,17,29,1047,194], [69,40]],
  [20, [34,15,25,296,175], [35,16,27,577,175], [36,17,29,1125,209], [74,44]],
  [21, [34,15,25,315,187], [35,16,27,614,187], [36,17,29,1197,224], [79,47]],
  [22, [34,15,25,332,198], [35,16,27,647,198], [36,17,29,1261,238], [83,50]],
  [23, [34,15,25,352,211], [35,16,27,687,211], [36,17,29,1339,254], [88,53]],
  [24, [34,18,26,368,222], [35,19,28,718,222], [36,20,30,1400,267], [92,56]],
  [25, [34,18,26,385,233], [35,19,28,751,233], [36,20,30,1463,280], [96,58]],
  [26, [34,20,27,405,247], [35,21,29,790,247], [36,22,31,1540,296], [101,62]],
  [27, [34,20,27,429,263], [35,21,29,837,263], [36,22,31,1631,315], [107,66]],
  [28, [34,22,28,449,276], [35,23,30,875,276], [36,24,32,1706,331], [112,69]],
  [29, [34,22,28,478,295], [35,23,30,932,295], [36,24,32,1816,354], [119,74]],
  [30, [34,24,29,500,310], [35,25,31,975,310], [36,26,33,1900,372], [125,78]],
  [31, [34,24,29,518,323], [35,25,31,1010,323], [36,26,33,1969,387], [130,81]],
  [32, [34,26,30,543,339], [35,27,32,1058,339], [36,28,34,2062,407], [136,85]],
  [33, [34,26,30,570,357], [35,27,32,1111,357], [36,28,34,2166,429], [142,89]],
  [34, [34,28,31,591,372], [35,29,33,1153,372], [36,30,35,2247,447], [148,93]],
  [35, [40,28,36,619,391], [41,29,38,1208,391], [42,30,40,2353,469], [155,98]],
  [36, [40,31,37,655,415], [41,32,39,1277,415], [42,33,41,2488,498], [164,104]],
  [37, [40,31,37,679,431], [41,32,39,1323,431], [42,33,41,2579,518], [170,108]],
  [38, [40,32,38,707,451], [41,33,40,1379,451], [42,34,42,2687,541], [177,113]],
  [39, [40,32,38,739,473], [41,33,40,1442,473], [42,34,42,2810,567], [185,118]],
  [40, [40,33,39,773,496], [41,34,41,1506,496], [42,35,43,2936,595], [193,124]],
  [41, [40,33,39,806,518], [41,34,41,1571,518], [42,35,43,3061,622], [201,130]],
  [42, [40,34,40,853,550], [41,35,42,1663,550], [42,36,44,3240,660], [213,137]],
  [43, [40,34,40,885,573], [41,35,42,1726,573], [42,36,44,3364,687], [221,143]],
  [44, [40,35,41,925,600], [41,36,43,1805,600], [42,37,45,3517,720], [231,150]],
  [45, [40,35,41,956,621], [41,36,43,1864,621], [42,37,45,3632,746], [239,155]],
  [46, [40,36,42,989,645], [41,37,44,1929,645], [42,38,46,3759,774], [247,161]],
  [47, [40,36,42,1013,662], [41,37,44,1976,662], [42,38,46,3850,794], [253,165]],
  [48, [40,36,42,1048,686], [41,37,44,2043,686], [42,38,46,3981,823], [262,171]],
  [49, [40,36,42,1068,701], [41,37,44,2084,701], [42,38,46,4060,842], [267,175]],
  [50, [40,36,42,1109,729], [41,37,44,2163,729], [42,38,46,4214,875], [277,182]],
  [51, [43,39,45,1145,755], [44,40,47,2233,755], [45,41,49,4351,906], [286,189]],
  [52, [43,40,46,1181,780], [44,41,48,2304,780], [45,42,50,4489,936], [295,195]],
  [53, [43,40,46,1218,806], [44,41,48,2375,806], [45,42,50,4629,968], [305,202]],
  [54, [44,40,46,1255,833], [45,41,48,2448,833], [46,42,50,4770,999], [314,208]],
  [55, [44,40,46,1293,859], [45,41,48,2521,859], [46,42,50,4913,1031], [323,215]],
  [56, [44,40,46,1331,887], [45,41,48,2595,887], [46,42,50,5058,1064], [333,222]],
  [57, [44,41,47,1369,914], [45,42,49,2670,914], [46,43,51,5204,1097], [342,228]],
  [58, [44,41,47,1408,942], [45,42,49,2746,942], [46,43,51,5352,1130], [352,235]],
  [59, [45,41,47,1448,970], [46,42,49,2823,970], [47,43,51,5501,1164], [362,242]],
  [60, [45,42,48,1487,998], [46,43,50,2900,998], [47,44,52,5652,1198], [372,250]],
  [61, [45,42,48,1527,1027], [46,43,50,2978,1027], [47,44,52,5804,1232], [382,257]],
  [62, [46,42,48,1568,1056], [47,43,50,3057,1056], [48,44,52,5958,1267], [392,264]],
  [63, [46,42,48,1609,1086], [47,43,50,3137,1086], [48,44,52,6113,1303], [402,271]],
  [64, [46,42,48,1650,1115], [47,43,50,3218,1115], [48,44,52,6270,1339], [413,279]],
  [65, [46,43,49,1692,1146], [47,44,51,3299,1146], [48,45,53,6429,1375], [423,286]],
  [66, [46,43,49,1734,1176], [47,44,51,3381,1176], [48,45,53,6589,1411], [433,294]],
  [67, [47,43,49,1776,1207], [48,44,51,3464,1207], [49,45,53,6750,1448], [444,302]],
  [68, [47,44,50,1819,1238], [48,45,52,3548,1238], [49,46,54,6913,1486], [455,310]],
  [69, [47,44,50,1863,1270], [48,45,52,3632,1270], [49,46,54,7078,1523], [466,317]],
  [70, [48,44,50,1906,1301], [49,45,52,3717,1301], [50,46,54,7243,1562], [477,325]],
  [71, [48,44,50,1950,1333], [49,45,52,3803,1333], [50,46,54,7411,1600], [488,333]],
  [72, [48,44,50,1995,1366], [49,45,52,3889,1366], [50,46,54,7579,1639], [499,341]],
  [73, [48,45,51,2039,1399], [49,46,53,3977,1399], [50,47,55,7750,1678], [510,350]],
  [74, [48,45,51,2085,1432], [49,46,53,4065,1432], [50,47,55,7921,1718], [521,358]],
  [75, [49,45,51,2130,1465], [50,46,53,4154,1465], [51,47,55,8094,1758], [533,366]],
  [76, [49,46,52,2176,1499], [50,47,54,4243,1499], [51,48,56,8269,1799], [544,375]],
  [77, [49,46,52,2222,1533], [50,47,54,4333,1533], [51,48,56,8444,1840], [556,383]],
  [78, [50,46,52,2269,1568], [51,47,54,4424,1568], [52,48,56,8622,1881], [567,392]],
  [79, [50,46,52,2316,1602], [51,47,54,4516,1602], [52,48,56,8800,1923], [579,401]],
  [80, [50,46,52,2363,1637], [51,47,54,4608,1637], [52,48,56,8980,1965], [591,409]],
  [81, [50,47,53,2411,1673], [51,48,55,4701,1673], [52,49,57,9162,2007], [603,418]],
  [82, [50,47,53,2459,1708], [51,48,55,4795,1708], [52,49,57,9344,2050], [615,427]],
  [83, [51,47,53,2508,1744], [52,48,55,4890,1744], [53,49,57,9529,2093], [627,436]],
  [84, [51,48,54,2556,1781], [52,49,56,4985,1781], [53,50,58,9714,2137], [639,445]],
  [85, [51,48,54,2605,1817], [52,49,56,5081,1817], [53,50,58,9901,2181], [651,454]],
  [86, [52,48,54,2655,1854], [53,49,56,5177,1854], [54,50,58,10089,2225], [664,464]],
  [87, [52,48,54,2705,1892], [53,49,56,5275,1892], [54,50,58,10279,2270], [676,473]],
  [88, [52,48,54,2755,1929], [53,49,56,5372,1929], [54,50,58,10469,2315], [689,482]],
  [89, [52,49,55,2806,1967], [53,50,57,5471,1967], [54,51,59,10662,2360], [701,492]],
  [90, [52,49,55,2857,2005], [53,50,57,5570,2005], [54,51,59,10855,2406], [714,501]],
  [91, [53,49,55,2908,2044], [54,50,57,5670,2044], [55,51,59,11050,2452], [727,511]],
  [92, [53,50,56,2959,2082], [54,51,58,5771,2082], [55,52,60,11246,2499], [740,521]],
  [93, [53,50,56,3011,2121], [54,51,58,5872,2121], [55,52,60,11443,2546], [753,530]],
  [94, [54,50,56,3064,2161], [55,51,58,5974,2161], [56,52,60,11642,2593], [766,540]],
  [95, [54,50,56,3116,2201], [55,51,58,6077,2201], [56,52,60,11842,2641], [779,550]],
  [96, [54,50,56,3169,2241], [55,51,58,6180,2241], [56,52,60,12043,2689], [792,560]],
  [97, [54,51,57,3223,2281], [55,52,59,6284,2281], [56,53,61,12246,2737], [806,570]],
  [98, [54,51,57,3276,2321], [55,52,59,6389,2321], [56,53,61,12450,2786], [819,580]],
  [99, [55,51,57,3330,2362], [56,52,59,6494,2362], [57,53,61,12655,2835], [833,591]],
  [100, [55,52,58,3385,2404], [56,53,60,6600,2404], [57,54,62,12861,2884], [846,601]]
];
export const NIVEL_MAX_INIMIGO = 100;
export const NIVEL_CALIBRADO = 50;
export const TIPOS_INIMIGO = { lacaio: "Lacaio", monstro: "Monstro", forte: "Monstro Forte", chefe: "Chefe" };
/** Ataques por rodada (o Chefe: 2 no turno e 2 Lendárias). */
export const ATAQUES_POR_TIPO = { lacaio: 1, monstro: 2, forte: 3, chefe: 4 };
/** Custo no orçamento do encontro (cada jogador vale 1). */
export const CUSTO_TIPO = { lacaio: 0.25, monstro: 1, forte: 2, chefe: 4 };
export const RARIDADES_INIMIGO = {
  comum: { label: "Comum", bonus: 0, mult: 1, custo: 1, exemplo: "Orc" },
  raro: { label: "Raro", bonus: 1, mult: 1.3, custo: 1.5, exemplo: "Líder orc, alfa da matilha" },
  epico: { label: "Épico", bonus: 2, mult: 1.6, custo: 2, exemplo: "Campeão orc" },
  lendario: { label: "Lendário", bonus: 3, mult: 2, custo: 3, exemplo: "Rei orc, criatura única" }
};
/** Poder do grupo: multiplica PV e dano (nível 1–30 / 31+). */
export const PODERES_GRUPO = {
  fraco: { label: "Fraco", dica: "sem talentos nem treinamentos", baixo: 0.7, alto: 0.7 },
  normal: { label: "Normal", dica: "talentos e treinamentos comuns", baixo: 1, alto: 1 },
  equipado: { label: "Equipado", dica: "arma e armadura com Modificações e Encantamento", baixo: 1.2, alto: 1.1 },
  lendario: { label: "Lendário", dica: "Maldição ou Bênção de item, atributos no máximo", baixo: 1.45, alto: 1.25 }
};
/** Tipo de ficha do NPC → coluna da tabela. */
export const TIPO_DA_FICHA = { monstro: "monstro", forte: "forte", chefe: "chefe", comum: "lacaio", importante: "monstro" };

const COLUNA = { monstro: 1, forte: 2, chefe: 3 };

/** Custo de um inimigo no orçamento (tipo × raridade). */
export function custoInimigo(tipo = "monstro", raridade = "comum") {
  const t = CUSTO_TIPO[tipo] ?? CUSTO_TIPO[TIPO_DA_FICHA[tipo]] ?? 1;
  return Math.round(t * (RARIDADES_INIMIGO[raridade]?.custo ?? 1) * 1000) / 1000;
}

/** Dano médio → dados: ~60% em d8 e o resto fixo (25 → 2d8 + 16). */
export function formulaD8(media) {
  const m = Math.max(1, Math.round(Number(media) || 1));
  // 60% do dano no máximo dos dados (o exemplo do patch: 25 → 2d8 + 16)
  const qtd = Math.max(1, Math.round((m * 0.6) / 8));
  const fixo = Math.round(m - qtd * 4.5);
  return fixo > 0 ? `${qtd}d8 + ${fixo}` : fixo < 0 ? `${qtd}d8 - ${-fixo}` : `${qtd}d8`;
}

/** Divide o dano por turno em N partes inteiras (a sobra vai para os primeiros). */
export function dividirDano(total, n) {
  const t = Math.max(n, Math.round(Number(total) || 0));
  const base = Math.floor(t / n);
  return Array.from({ length: n }, (_, i) => base + (i < t - base * n ? 1 : 0));
}

/**
 * Valores do inimigo: tabela → raridade (+CA/acerto/CD, ×PV/dano) → poder do grupo (×PV/dano).
 * Devolve também os ataques prontos (dano em dados), o ataque em área (Forte e Chefe) e o custo no orçamento.
 */
export function inimigoPorNivel(nivel, tipo = "monstro", { raridade = "comum", poder = "normal" } = {}) {
  const n = Math.max(1, Math.min(NIVEL_MAX_INIMIGO, int(nivel, 1)));
  const t = TIPOS_INIMIGO[tipo] ? tipo : "monstro";
  const rar = RARIDADES_INIMIGO[raridade] ? raridade : "comum";
  const pod = PODERES_GRUPO[poder] ? poder : "normal";
  const linha = TABELA_INIMIGOS[n - 1];
  const def = linha[COLUNA[t] ?? 1];
  const r = RARIDADES_INIMIGO[rar];
  const multPoder = n <= 30 ? PODERES_GRUPO[pod].baixo : PODERES_GRUPO[pod].alto;
  const pvBase = t === "lacaio" ? linha[4][0] : def[3];
  const danoBase = t === "lacaio" ? linha[4][1] : def[4];
  const mult = r.mult * multPoder;
  const pv = Math.max(1, Math.round(pvBase * mult));
  const dano = t === "lacaio" ? Math.max(1, Math.round(danoBase * mult * 10) / 10) : Math.max(1, Math.round(danoBase * mult));
  const qtd = ATAQUES_POR_TIPO[t];
  const ataques = dividirDano(dano, qtd).map((media, i) => ({
    media, dano: formulaD8(media), lendaria: t === "chefe" && i >= 2
  }));
  const cd = def[2] + r.bonus;
  const area = t === "forte" || t === "chefe" ? { media: Math.round(dano * 0.6), dano: formulaD8(dano * 0.6), alvos: 3, cd, resistencia: "Reflexo", recarga: 5 } : null;
  return {
    nivel: n, tipo: t, tipoLabel: TIPOS_INIMIGO[t], raridade: rar, raridadeLabel: r.label, poder: pod, poderLabel: PODERES_GRUPO[pod].label,
    projecao: n > NIVEL_CALIBRADO,
    ca: def[0] + r.bonus, acerto: def[1] + r.bonus, cd, pv, dano, ataques, area, custo: custoInimigo(t, rar)
  };
}

/** Etiqueta do orçamento do encontro: custo dos NPCs contra o número de jogadores. */
export function orcamentoEncontro(custos = [], jogadores = 0) {
  const custo = Math.round(custos.reduce((s, c) => s + (Number(c) || 0), 0) * 100) / 100;
  const orc = Math.max(0, int(jogadores));
  const pct = orc ? Math.round((custo / orc) * 100) : 0;
  const etiqueta = !orc || !custo ? "" : pct <= 60 ? "Fácil" : pct <= 120 ? "Justo" : "Difícil";
  return { custo, orcamento: orc, pct, etiqueta, cls: { "Fácil": "ok", "Justo": "aviso", "Difícil": "perigo" }[etiqueta] ?? "" };
}

/** Custo guardado na ficha do NPC (ou calculado pelo tipo e pela raridade). */
export function custoDoNpc(npc = {}) {
  const v = Number(npc.custo);
  if (npc.custo !== undefined && npc.custo !== "" && Number.isFinite(v)) return v;
  return custoInimigo(npc.referencia?.tipo || TIPO_DA_FICHA[npc.tipo] || "monstro", npc.raridade || "comum");
}

/* ---------------- Foundry ---------------- */

/** Poder do grupo salvo no mundo (padrão Normal). */
export function poderDoMundo() {
  try { const v = game.settings.get(FLAG, "poderGrupo"); return PODERES_GRUPO[v] ? v : "normal"; } catch { return "normal"; }
}

/** Botão "Preencher pelo nível" (aba Mestre): CA, acerto, CD, Vida, ataques prontos, raridade e custo. */
export async function preencherPeloNivel(actor) {
  if (!game.user?.isGM) return;
  const { formulario, opcoes } = await import("./mundo.mjs");
  const atual = actor.flags?.[FLAG]?.npc ?? {};
  const ref = atual.referencia ?? {};
  const tipoPadrao = ref.tipo || TIPO_DA_FICHA[atual.tipo] || "monstro";
  const r = await formulario("Preencher pelo nível", `
    <p class="epm-dica">CA, acerto, CD, Vida e dano por turno pela tabela de inimigos (uma linha por nível). Dá para editar tudo depois.</p>
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Nível (1–${NIVEL_MAX_INIMIGO})</span><input type="number" name="nivel" min="1" max="${NIVEL_MAX_INIMIGO}" value="${int(ref.nivel, 1)}"></label>
      <label class="epm-campo"><span>Tipo</span><select name="tipo">${opcoes(Object.entries(TIPOS_INIMIGO), tipoPadrao)}</select></label>
    </div>
    <div class="epm-dialogo-linha">
      <label class="epm-campo" title="${Object.values(RARIDADES_INIMIGO).map(x => `${x.label}: ${x.exemplo}`).join(" · ")}"><span>Raridade</span><select name="raridade">${opcoes(Object.entries(RARIDADES_INIMIGO).map(([id, x]) => [id, x.label]), atual.raridade || "comum")}</select></label>
      <label class="epm-campo" title="${Object.values(PODERES_GRUPO).map(x => `${x.label}: ${x.dica}`).join(" · ")}"><span>Poder do grupo</span><select name="poder">${opcoes(Object.entries(PODERES_GRUPO).map(([id, x]) => [id, x.label]), poderDoMundo())}</select></label>
    </div>
    <p class="epm-dica epm-aviso-projecao" hidden>Acima do nível ${NIVEL_CALIBRADO} os números são uma projeção (o multiarquétipo ainda não tem regras).</p>
    <label class="epm-check"><input type="checkbox" name="vida" checked> Trocar a Vida também</label>
    <label class="epm-check"><input type="checkbox" name="ataques" checked> Criar os ataques prontos (troca os criados antes por este botão)</label>
    <label class="epm-check"><input type="checkbox" name="salvarPoder"> Guardar este poder do grupo como padrão do mundo</label>`, {
    botao: "Preencher",
    render: (ev, dlg) => {
      const raiz = dlg?.element ?? ev?.target?.element ?? document;
      const campo = raiz.querySelector?.("[name=nivel]"), aviso = raiz.querySelector?.(".epm-aviso-projecao");
      const ver = () => { if (aviso) aviso.hidden = int(campo?.value, 1) <= NIVEL_CALIBRADO; };
      campo?.addEventListener?.("input", ver); ver();
    }
  });
  if (!r) return;
  if (r.salvarPoder && PODERES_GRUPO[r.poder]) { try { await game.settings.set(FLAG, "poderGrupo", r.poder); } catch (err) { console.warn("EPM |", err); } }
  const v = inimigoPorNivel(r.nivel, r.tipo, { raridade: r.raridade, poder: r.poder });
  return aplicarInimigo(actor, v, { vida: r.vida !== false, ataques: r.ataques !== false });
}

/** Ataques prontos do inimigo (marcados para serem trocados na próxima vez). */
export function ataquesDoInimigo(v, { nome = "Ataque", tipoDano = "Contundente", pericia = "luta" } = {}) {
  const out = {};
  const agora = Date.now();
  v.ataques.forEach((a, i) => {
    out[`epmini${i}`] = { nome: v.ataques.length > 1 ? `${nome} ${i + 1}${a.lendaria ? " (Lendária)" : ""}` : nome, pericia, bonusAcerto: 0, dano: a.dano,
      tipoDano, critMargem: 20, critMult: 2, notas: `${v.tipoLabel} nível ${v.nivel}: ~${a.media} de dano${a.lendaria ? ". Ação Lendária (fora do turno)." : "."}`, gerado: true, criado: agora + i };
  });
  if (v.area) out.epminiArea = { nome: "Ataque em área", pericia, bonusAcerto: 0, dano: v.area.dano, tipoDano, critMargem: 20, critMult: 2, gerado: true, criado: agora + 9,
    notas: `Até ${v.area.alvos} alvos; ${v.area.resistencia} CD ${v.area.cd} para metade. Recarga ${v.area.recarga}–6.` };
  return out;
}

export async function aplicarInimigo(actor, v, { vida = true, ataques = false, chat = true } = {}) {
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
  const { ataques: _a, area: _ar, ...ref } = v;
  upd[`${P}.npc.referencia`] = ref;
  upd[`${P}.npc.raridade`] = v.raridade ?? "comum";
  upd[`${P}.npc.custo`] = v.custo ?? custoInimigo(v.tipo, v.raridade);
  if (ataques && v.ataques?.length) {
    const velhos = Object.entries(d.ataques ?? {}).filter(([, a]) => a?.gerado).map(([id]) => id);
    for (const id of velhos) upd[`${P}.ataques.-=${id}`] = null;
    const modelo = Object.values(d.ataques ?? {}).find(a => a && !a.gerado);
    const novos = ataquesDoInimigo(v, { nome: modelo?.nome || "Ataque", tipoDano: modelo?.tipoDano || "Contundente", pericia: modelo?.pericia || "luta" });
    for (const [id, a] of Object.entries(novos)) upd[`${P}.ataques.${id}`] = a;
    if (v.area) {
      const rec = Object.entries(d.npc?.recargas ?? {}).find(([, x]) => x?.nome === "Ataque em área");
      upd[`${P}.npc.recargas.${rec?.[0] ?? "epminiArea"}`] = { nome: "Ataque em área", min: v.area.recarga, pronta: true };
    }
  }
  // Limpar os ataques gerados antes de gravar os novos (as chaves "-=" e os novos com o mesmo id não podem ir juntos)
  const apagar = Object.fromEntries(Object.entries(upd).filter(([k]) => k.includes(".ataques.-=")));
  if (Object.keys(apagar).length) { await actor.update(apagar); for (const k of Object.keys(apagar)) delete upd[k]; }
  await actor.update(upd);
  if (chat) await ChatMessage.create({
    whisper: [...(game.users ?? [])].filter(u => u.isGM).map(u => u.id),
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#C9A35A"><p><strong>${escapar(actor.name)}: ${escapar(v.tipoLabel)}${v.raridade && v.raridade !== "comum" ? ` ${escapar(v.raridadeLabel)}` : ""} de nível ${v.nivel}</strong>${v.projecao ? " <em>(projeção)</em>" : ""}</p>
      <p>CA ${v.ca} · Acerto +${v.acerto} · CD ${v.cd} · Vida ${v.pv} · Dano por turno ~${v.dano}${v.ataques?.length ? ` em ${v.ataques.length} ataque(s)` : ""}${v.poder && v.poder !== "normal" ? ` · grupo ${escapar(v.poderLabel)}` : ""} · custo ${v.custo}</p></div>`
  });
  return v;
}
