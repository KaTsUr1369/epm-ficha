/**
 * Criação rápida de NPC (0.8.22): escolhe o tipo de ficha, a força da criatura, o nível, se é inteligente, o foco,
 * a natureza, o tamanho e a disposição; a ficha já nasce com atributos, Vida, CA, acerto, CD e um ataque.
 * A primeira parte é pura (testável fora do Foundry).
 */
import { FLAG, MODULE_ID, ATRIBUTOS } from "./config.mjs";
import { int, dadosPadrao } from "./data.mjs";
import { escapar } from "./helpers.mjs";
import { inimigoPorNivel } from "./inimigos-nivel.mjs";

const P = `flags.${FLAG}`;

/** Força da criatura: pontos nos atributos, piso de cada atributo, multiplicador da Vida e do dano, ajuste de CA/acerto/CD. */
export const FORCAS_CRIATURA = {
  muitoFraca: { label: "Muito fraca", pontos: 4, piso: 0, vida: 0.5, ajuste: -2 },
  fraca: { label: "Fraca", pontos: 8, piso: 0, vida: 0.75, ajuste: -1 },
  media: { label: "Média", pontos: 14, piso: 1, vida: 1, ajuste: 0 },
  forte: { label: "Forte", pontos: 20, piso: 1, vida: 1.25, ajuste: 1 },
  muitoForte: { label: "Muito forte", pontos: 28, piso: 2, vida: 1.5, ajuste: 2 },
  lendaria: { label: "Lendária", pontos: 38, piso: 3, vida: 2, ajuste: 3 }
};
/** Para onde vão os pontos (pesos por atributo). */
export const FOCOS_CRIATURA = {
  fisico: { label: "Físico (Força e Constituição)", pesos: { forca: 3, constituicao: 3, destreza: 2, autocontrole: 1 } },
  agil: { label: "Ágil (Destreza)", pesos: { destreza: 4, constituicao: 1, forca: 1, autocontrole: 1 } },
  magico: { label: "Mágico (Núcleo)", pesos: { nucleo: 4, inteligencia: 2, autocontrole: 2, constituicao: 1 } },
  social: { label: "Social (Carisma e Aparência)", pesos: { carisma: 3, aparencia: 2, inteligencia: 2, autocontrole: 1 } },
  equilibrado: { label: "Equilibrado", pesos: { forca: 1, destreza: 1, constituicao: 1, aparencia: 1, carisma: 1, inteligencia: 1, autocontrole: 1, nucleo: 1 } }
};
export const NATUREZAS_CRIATURA = ["Humanoide", "Fera", "Monstruosidade", "Morto-vivo", "Constructo", "Elemental", "Demônio", "Celestial", "Dragão", "Fada", "Aberração", "Planta", "Gosma"];
/** Tipo de ficha → coluna da tabela de inimigos. */
const TIPO_TABELA = { comum: "lacaio", importante: "monstro", monstro: "monstro", forte: "forte", chefe: "chefe" };
const ATAQUE_NATURAL = { Fera: "Mordida", Monstruosidade: "Garras", "Morto-vivo": "Toque gélido", Constructo: "Pancada", Elemental: "Golpe elemental", Demônio: "Garras", Dragão: "Mordida", Planta: "Chicote de vinha", Gosma: "Pseudópode", Aberração: "Tentáculo", Fada: "Toque", Celestial: "Golpe radiante", Humanoide: "Ataque" };
const TIPO_DANO_NATURAL = { Fera: "Perfurante", Monstruosidade: "Cortante", "Morto-vivo": "Necrótico", Constructo: "Contundente", Elemental: "Fogo", Demônio: "Cortante", Dragão: "Perfurante", Planta: "Contundente", Gosma: "Ácido", Aberração: "Psíquico", Fada: "Psíquico", Celestial: "Radiante", Humanoide: "Cortante" };

/** Distribui pontos pelos pesos (o resto vai para os de maior peso). */
export function distribuir(pontos, pesos) {
  const ids = Object.keys(pesos);
  const total = ids.reduce((s, id) => s + pesos[id], 0) || 1;
  const out = Object.fromEntries(ids.map(id => [id, Math.floor((pontos * pesos[id]) / total)]));
  let resto = pontos - Object.values(out).reduce((a, b) => a + b, 0);
  const ordem = [...ids].sort((a, b) => pesos[b] - pesos[a]);
  for (let i = 0; resto > 0; i++, resto--) out[ordem[i % ordem.length]]++;
  return out;
}

/** Dano médio → fórmula com d6 ("12" → "2d6 + 5"). */
export function formulaDoDano(media, dado = 6) {
  const m = Math.max(1, Math.round(Number(media) || 1));
  const porDado = (dado + 1) / 2;
  const qtd = Math.max(1, Math.round((m * 0.6) / porDado));
  const fixo = Math.round(m - qtd * porDado);
  return fixo > 0 ? `${qtd}d${dado} + ${fixo}` : fixo < 0 ? `${qtd}d${dado} - ${-fixo}` : `${qtd}d${dado}`;
}

/** Gera os números da criatura. */
export function gerarCriatura({ nome = "", tipo = "monstro", forca = "media", nivel = 1, inteligente = true, foco = "fisico", natureza = "Fera", tamanho = "Médio", disposicao = "Hostil" } = {}) {
  const f = FORCAS_CRIATURA[forca] ?? FORCAS_CRIATURA.media;
  const fo = FOCOS_CRIATURA[foco] ?? FOCOS_CRIATURA.fisico;
  const n = Math.max(1, Math.min(50, int(nivel, 1)));
  const pontos = f.pontos + Math.floor(n / 2);
  const pesos = { ...fo.pesos };
  if (!inteligente) { delete pesos.inteligencia; delete pesos.carisma; delete pesos.aparencia; if (!Object.keys(pesos).length) pesos.forca = 1; }
  const extra = distribuir(pontos, pesos);
  const atributos = {};
  for (const id of Object.keys(ATRIBUTOS)) atributos[id] = f.piso + (extra[id] ?? 0);
  if (!inteligente) { atributos.inteligencia = 0; atributos.carisma = 0; atributos.aparencia = 0; }
  else atributos.inteligencia = Math.max(1, atributos.inteligencia);
  const bruta = inimigoPorNivel(n, TIPO_TABELA[tipo] ?? "monstro");
  // A força mexe também na CA, no acerto, na CD e no dano (fraca menos, forte mais)
  const tab = { ...bruta, ca: bruta.ca + f.ajuste, acerto: bruta.acerto + f.ajuste, cd: bruta.cd + f.ajuste, dano: Math.max(1, Math.round(bruta.dano * f.vida)) };
  const pv = Math.max(1, Math.round(tab.pv * f.vida));
  const ataqueAtr = foco === "agil" ? "destreza" : foco === "magico" ? "nucleo" : "forca";
  return {
    nome: nome || `${natureza} ${f.label.toLowerCase()}`, tipo, forca, forcaLabel: f.label, nivel: n, inteligente, foco, natureza, tamanho, disposicao,
    atributos, pv, ca: tab.ca, acerto: tab.acerto, cd: tab.cd, danoMedio: tab.dano, tabela: tab,
    ataque: {
      nome: inteligente && natureza === "Humanoide" ? "Arma" : (ATAQUE_NATURAL[natureza] ?? "Ataque"),
      pericia: ataqueAtr === "destreza" ? "pontaria" : "luta", atributo: ataqueAtr,
      dano: formulaDoDano(tab.dano), tipo: TIPO_DANO_NATURAL[natureza] ?? "Contundente"
    }
  };
}

/* ---------------- Foundry ---------------- */

/** Diálogo e criação da ficha (só o Mestre). */
export async function criarNpcRapido() {
  if (!game.user?.isGM) return ui.notifications.warn("Só o Mestre cria fichas de NPC.");
  const { formulario, opcoes } = await import("./mundo.mjs");
  const { TIPOS_NPC, TAMANHOS, DISPOSICOES } = await import("./tipos-npc.mjs");
  const r = await formulario("Criar NPC rápido", `
    <p class="epm-dica">A ficha nasce pronta: atributos pela força e pelo foco, Vida, CA, acerto e CD pela tabela de inimigos do nível, e um ataque. Dá para editar tudo depois.</p>
    <label class="epm-campo"><span>Nome</span><input type="text" name="nome" placeholder="(automático)"></label>
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Tipo de ficha</span><select name="tipo">${opcoes(Object.entries(TIPOS_NPC).map(([id, t]) => [id, t.label]), "monstro")}</select></label>
      <label class="epm-campo"><span>Força da criatura</span><select name="forca">${opcoes(Object.entries(FORCAS_CRIATURA).map(([id, x]) => [id, x.label]), "media")}</select></label>
      <label class="epm-campo"><span>Nível (1–50)</span><input type="number" name="nivel" min="1" max="50" value="5"></label>
    </div>
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Natureza</span><select name="natureza">${opcoes(NATUREZAS_CRIATURA.map(x => [x, x]), "Fera")}</select></label>
      <label class="epm-campo"><span>Foco</span><select name="foco">${opcoes(Object.entries(FOCOS_CRIATURA).map(([id, x]) => [id, x.label]), "fisico")}</select></label>
    </div>
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Tamanho</span><select name="tamanho">${opcoes(TAMANHOS.map(x => [x, x]), "Médio")}</select></label>
      <label class="epm-campo"><span>Disposição</span><select name="disposicao">${opcoes(DISPOSICOES.map(x => [x, x]), "Hostil")}</select></label>
      <label class="epm-campo"><span>Quantas fichas</span><input type="number" name="qtd" min="1" max="20" value="1"></label>
    </div>
    <label class="epm-check"><input type="checkbox" name="inteligente" checked> Criatura inteligente (pensa, fala e planeja; sem isso, Inteligência, Carisma e Aparência ficam em 0)</label>
    <label class="epm-check"><input type="checkbox" name="pasta" checked> Guardar na pasta "${PASTA_NPC}" da aba Atores (com uma subpasta por natureza)</label>
    <label class="epm-check"><input type="checkbox" name="abrir" checked> Abrir a ficha depois de criar</label>`, { botao: "Criar", largura: 600 });
  if (!r) return null;
  const qtd = Math.max(1, Math.min(20, int(r.qtd, 1)));
  const criados = [];
  const folder = r.pasta !== false ? await pastaNpcRapido(r.natureza) : null;
  for (let i = 0; i < qtd; i++) {
    const c = gerarCriatura({ ...r, nome: r.nome ? (qtd > 1 ? `${r.nome} ${i + 1}` : r.nome) : "", inteligente: r.inteligente !== false });
    if (!r.nome && qtd > 1) c.nome = `${c.nome} ${i + 1}`;
    criados.push(await criarAtorDaCriatura(c, { folder }));
  }
  ui.notifications.info(`${criados.length} ficha(s) de NPC criada(s) na aba Atores.`);
  if (r.abrir !== false) criados[0]?.sheet?.render(true);
  return criados;
}

/** Cria o ator com a ficha EPM a partir dos números gerados. */
export const PASTA_NPC = "NPCs rápidos";

/** Pasta automática da aba Atores para os NPCs rápidos (e a subpasta da natureza). Cria se não existir. */
export async function pastaNpcRapido(natureza = "") {
  try {
    const pastas = game.folders?.filter?.(f => f.type === "Actor") ?? [];
    let raiz = pastas.find(f => f.name === PASTA_NPC && !f.folder);
    raiz ??= await Folder.create({ name: PASTA_NPC, type: "Actor", color: "#7a3b3b", sorting: "a" });
    if (!raiz || !natureza) return raiz?.id ?? null;
    let sub = (game.folders?.filter?.(f => f.type === "Actor") ?? []).find(f => f.name === natureza && (f.folder?.id ?? f.folder) === raiz.id);
    sub ??= await Folder.create({ name: natureza, type: "Actor", folder: raiz.id, sorting: "a" });
    return sub?.id ?? raiz.id;
  } catch (err) { console.warn("EPM | pasta dos NPCs rápidos", err); return null; }
}

export async function criarAtorDaCriatura(c, { folder = null } = {}) {
  let base = {};
  try { const { listaPericias } = await import("./settings.mjs"); base = dadosPadrao(listaPericias?.()); } catch { base = dadosPadrao(); }
  const dados = foundry.utils.mergeObject(base, {
    atributos: Object.fromEntries(Object.entries(c.atributos).map(([id, v]) => [id, { base: v }])),
    nivel: c.nivel,
    npc: { tipo: c.tipo, categoria: c.natureza, tamanho: c.tamanho, disposicao: c.disposicao, nd: Math.max(1, Math.round(c.nivel / 2)),
      referencia: { nivel: c.nivel, tipo: c.tabela.tipo, dano: c.danoMedio }, interp: c.inteligente ? {} : { jeito: "Age por instinto: não fala nem negocia." } },
    ataques: { [foundry.utils.randomID()]: { nome: c.ataque.nome, pericia: c.ataque.pericia, bonusAcerto: 0, dano: c.ataque.dano,
      tipoDano: c.ataque.tipo, critMargem: 20, critMult: 2, notas: `${c.forcaLabel}, nível ${c.nivel}`, criado: Date.now() } },
    sobre: { outros: `<p>${escapar(c.natureza)} ${escapar(c.forcaLabel.toLowerCase())}, nível ${c.nivel}${c.inteligente ? ", inteligente" : ", não inteligente"}. Criado pelo NPC rápido.</p>` }
  }, { inplace: false });
  const ator = await Actor.create({
    name: c.nome, type: "npc", img: "icons/svg/mystery-man.svg", ...(folder ? { folder } : {}),
    system: { attributes: { hp: { value: c.pv, max: c.pv } } },
    prototypeToken: { name: c.nome, actorLink: false, disposition: ["Hostil", "Desconfiado"].includes(c.disposicao) ? -1 : c.disposicao === "Neutro" ? 0 : 1 },
    flags: { [FLAG]: dados, core: { sheetClass: `${MODULE_ID}.EPMActorSheet` } }
  });
  if (!ator) return null;
  try {
    const { aplicarTipo } = await import("./tipos-npc.mjs");
    await aplicarTipo(ator, c.tipo);
    const { aplicarInimigo } = await import("./inimigos-nivel.mjs");
    await aplicarInimigo(ator, { ...c.tabela, pv: c.pv });
  } catch (err) { console.warn("EPM | NPC rápido", err); }
  return ator;
}

export { P };
