/**
 * Imagens dos itens do catálogo, nesta ordem:
 * 0) Ícone próprio do item (assets/itens/<id>.svg), quando o id está em itens-icones.mjs.
 * 1) Padrão (sempre existe): um ícone por categoria, que vem no módulo (assets/itens/*.svg).
 * 2) Arte do Foundry: o Mestre, ao montar o compêndio, procura nas pastas de ícones do próprio Foundry
 *    (icons/weapons, icons/consumables…) um arquivo com as palavras do item. Achou, usa; não achou, fica o padrão.
 *    O resultado fica guardado numa configuração do mundo, e o Catálogo de itens usa as mesmas imagens.
 */
import { ICONES_ITENS } from "./itens-icones.mjs";

const PASTA = "modules/epm-ficha/assets/itens";

/** O item tem ícone próprio no módulo? */
export const temIconeProprio = x => ICONES_ITENS.has(x?.id);

/** Imagem final do item: ícone próprio → arte do Foundry (artes[id]) → ícone da categoria. Pura. */
export function imagemItem(x, artes = {}) {
  if (temIconeProprio(x)) return `${PASTA}/${x.id}.svg`;
  return artes?.[x.id] || imagemPadrao(x);
}

/** Ícone do módulo para o item (sem Foundry). */
export function imagemPadrao(x) {
  if (x.categoria === "armas") return `${PASTA}/${x.arma?.pericia === "pontaria" ? "armas-distancia" : "armas-corpo"}.svg`;
  return `${PASTA}/${x.categoria}.svg`;
}

/**
 * Regras de arte: a primeira que casar com o nome (sem acento, minúsculo) define a pasta do Foundry e as palavras
 * do arquivo (em inglês, como os ícones do Foundry). Sem palavras, qualquer arquivo da pasta serve.
 */
const REGRAS = [
  // Armas
  [/adaga|sai \(par\)/, "icons/weapons/daggers", ["dagger"]],
  [/espada curta|cimitarra/, "icons/weapons/swords", ["short", "scimitar", "sword"]],
  [/rapieira/, "icons/weapons/swords", ["rapier", "thin", "sword"]],
  [/katana/, "icons/weapons/swords", ["katana", "curved", "sword"]],
  [/montante|espada bastarda/, "icons/weapons/swords", ["great", "bastard", "two", "sword"]],
  [/espada/, "icons/weapons/swords", ["long", "sword"]],
  [/machado/, "icons/weapons/axes", ["axe"]],
  [/mangual/, "icons/weapons/maces", ["flail", "mace"]],
  [/maca/, "icons/weapons/maces", ["mace"]],
  [/clava|bordao/, "icons/weapons/staves", ["staff", "club"]],
  [/martelo/, "icons/weapons/hammers", ["hammer"]],
  [/picareta/, "icons/weapons/hammers", ["pick", "hammer"]],
  [/tridente/, "icons/weapons/polearms", ["trident", "spear"]],
  [/foice|kusarigama/, "icons/weapons/sickles", ["scythe", "sickle"]],
  [/lanca|azagaia|alabarda|glaive/, "icons/weapons/polearms", ["spear", "halberd", "glaive", "pike"]],
  [/besta/, "icons/weapons/crossbows", ["crossbow"]],
  [/arco/, "icons/weapons/bows", ["bow"]],
  [/funda/, "icons/weapons/slings", ["sling"]],
  [/dardos|zarabatana/, "icons/weapons/thrown", ["dart", "throwing"]],
  [/chicote/, "icons/weapons/misc", ["whip"]],
  [/soco-ingles|manopla/, "icons/weapons/fist", ["knuckle", "gauntlet", "fist"]],
  // Munição
  [/flechas|virotes/, "icons/weapons/ammunition", ["arrow", "bolt"]],
  [/pedras de funda/, "icons/commodities/stone", ["stone", "rock"]],
  // Proteção
  [/escudo|broquel/, "icons/equipment/shield", ["shield", "buckler", "round", "kite", "heater"], ["escudos"]],
  [/placas|campeao|cavaleiro|talas|dracon/, "icons/equipment/chest", ["plate", "breastplate"], ["armaduras"]],
  [/malha|escamas|brigandina/, "icons/equipment/chest", ["chain", "scale", "mail"], ["armaduras"]],
  [/couro|gambeson|peles|peitoral/, "icons/equipment/chest", ["leather", "vest", "padded", "breastplate"], ["armaduras"]],
  [/capa|manto/, "icons/equipment/back", ["cloak", "cape", "mantle"]],
  [/roupas|traje|vestes/, "icons/equipment/chest", ["robe", "coat", "shirt", "tunic"]],
  // Poções e cura
  [/vida|elixir restaurador/, "icons/consumables/potions", ["red"]],
  [/mana|cristal de mana/, "icons/consumables/potions", ["blue"]],
  [/estamina|tonico/, "icons/consumables/potions", ["green", "yellow"]],
  [/cha calmante|lucidez|mente serena|lagrima/, "icons/consumables/potions", ["purple", "pink"]],
  [/pocao|elixir|antidoto|antitoxina/, "icons/consumables/potions", ["potion", "bottle", "vial"]],
  [/bandagens|tala/, "icons/sundries/survival", ["bandage", "cloth"]],
  [/erva|unguento|colirio|sais/, "icons/consumables/plants", ["leaf", "herb", "plant"]],
  // Comida e bebida
  [/cerveja|hidromel|vinho|saque|aguardente|odre/, "icons/consumables/drinks", ["mug", "bottle", "wine", "flask"]],
  [/pao/, "icons/consumables/grains", ["bread"]],
  [/queijo/, "icons/consumables/food", ["cheese"]],
  [/frutas/, "icons/consumables/fruit", ["apple", "fruit"]],
  [/carne/, "icons/consumables/meat", ["meat", "jerky"]],
  [/racoes|refeicao|banquete/, "icons/consumables/food", ["bowl", "plate", "food"]],
  // Arremessáveis e venenos
  [/oleo|fogo alquimico|acido|agua benta/, "icons/consumables/potions", ["flask", "bottle"]],
  [/bomba|po de cegueira|cola/, "icons/weapons/thrown", ["bomb", "grenade", "pouch"]],
  [/estrepes/, "icons/weapons/thrown", ["caltrop", "spike"]],
  [/veneno|peconha|beladona|sonifero|paralisante/, "icons/consumables/potions", ["green", "poison", "vial"]],
  // Aventura
  [/tocha/, "icons/sundries/lights", ["torch"]],
  [/vela/, "icons/sundries/lights", ["candle"]],
  [/lampiao|lanterna/, "icons/sundries/lights", ["lantern"]],
  [/corda|corrente/, "icons/sundries/survival", ["rope", "chain"]],
  [/tenda|saco de dormir|cobertor|lona/, "icons/sundries/survival", ["bedroll", "tent", "blanket"]],
  [/mapa|papel|livro|grimorio|pergaminho/, "icons/sundries/documents", ["map", "paper", "scroll", "book"]],
  [/ampulheta|abaco|sino|apito|espelho|giz|luneta/, "icons/sundries/misc", []],
  // Ferramentas e conjuração
  [/ferreiro|martelo/, "icons/tools/smithing", ["hammer", "anvil", "tongs"]],
  [/alquimista|herbalismo|botanico|venenos/, "icons/tools/laboratory", ["flask", "mortar", "alembic"]],
  [/cozinheiro|panela/, "icons/tools/cooking", ["pot", "pan", "ladle"]],
  [/cartografo|navegacao/, "icons/tools/navigation", ["compass", "map", "sextant"]],
  [/caligrafia|tinta|pena/, "icons/tools/scribal", ["quill", "ink", "pen"], ["aventura", "ferramentas", "conjuracao"]],
  [/pesca/, "icons/tools/fishing", ["fishing", "rod", "hook"]],
  [/flauta|tambor|lira|alaude|violino/, "icons/tools/instruments", ["flute", "drum", "lyre", "lute", "harp"]],
  [/varinha|foco|orbe|simbolo|componentes/, "icons/weapons/wands", ["wand", "orb"]],
  [/ferramentas|kit|pa$|pe de cabra|picareta de mineracao|martelo$/, "icons/tools/hand", []],
  // Recipientes
  [/bau/, "icons/containers/chest", ["chest"]],
  [/barril/, "icons/containers/barrels", ["barrel"]],
  [/algibeira|saco|mochila|bolsa|aljava|estojo/, "icons/containers/bags", ["bag", "pack", "pouch", "sack"]],
  // Materiais
  [/minerio|carvao|obsidiana/, "icons/commodities/stone", ["ore", "rock", "stone"]],
  [/lingote|ferro|prata|mitral|adamante|oricalco|aco/, "icons/commodities/metal", ["ingot", "bar"]],
  [/madeira/, "icons/commodities/wood", ["log", "wood", "plank"]],
  [/couro|pele de animal|couro de lobo/, "icons/commodities/leather", ["leather", "hide", "pelt"]],
  [/tecido|seda|linha/, "icons/commodities/cloth", ["cloth", "fabric", "thread"]],
  [/quartzo|agata|ametista|onix|ambar|perola|granada|topazio|esmeralda|safira|rubi|diamante|cristal/, "icons/commodities/gems", ["gem"]],
  [/taca|estatueta|colar|coroa/, "icons/commodities/treasure", []],
  [/pedra|argila|areia|vidro|sal$|cera|resina/, "icons/commodities/materials", []],
  [/cadeado|algemas|gancho|pitons|escada|balde|cantil|vara|pederneira|incenso/, "icons/sundries/misc", []],
  [/folha|flor|raiz|lirio|cogumelo|musgo|petala|mandragora|semente|beladona/, "icons/consumables/plants", ["leaf", "flower", "root", "mushroom", "plant"]],
  [/osso|presas|garras|chifre|escama|pena/, "icons/commodities/bones", ["bone", "fang", "claw", "horn", "scale", "feather"]],
  [/sangue|glandula|ectoplasma|olho|essencia|nucleo/, "icons/commodities/biological", ["organ", "eye", "blood", "sac"]]
];

const sem = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Regra de arte para o item (ou null). Pura, para teste. */
export function regraDeArte(x) {
  const n = sem(x.nome);
  for (const [re, pasta, palavras, categorias] of REGRAS) {
    if (categorias && !categorias.includes(x.categoria)) continue;
    if (re.test(n)) return { pasta, palavras };
  }
  return null;
}

/** Hash simples, para itens parecidos não pegarem sempre o mesmo arquivo. */
function hash(t) { let h = 0; for (const c of String(t)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; }

/** Escolhe um arquivo da lista para o item (pura). */
export function escolherArquivo(arquivos, x, palavras = []) {
  if (!arquivos?.length) return null;
  const imgs = arquivos.filter(f => /\.(webp|png|jpg|jpeg|svg)$/i.test(f));
  let candidatos = imgs;
  for (const p of palavras) {
    const achou = imgs.filter(f => f.toLowerCase().split("/").pop().includes(p));
    if (achou.length) { candidatos = achou; break; }
  }
  if (!candidatos.length) return null;
  return candidatos[hash(x.id) % candidatos.length];
}

/**
 * Procura arte do Foundry para todos os itens. Só o Mestre (precisa navegar nos arquivos do Foundry).
 * Devolve { id: caminho } só para os que acharam arte.
 */
export async function procurarArtes(itens) {
  const FP = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
  if (!FP?.browse || !game.user?.isGM) return {};
  const cache = new Map();
  const listar = async pasta => {
    if (cache.has(pasta)) return cache.get(pasta);
    let arquivos = [];
    try {
      const r = await FP.browse("public", pasta);
      arquivos = r?.files ?? [];
    } catch { arquivos = []; }
    cache.set(pasta, arquivos);
    return arquivos;
  };
  const out = {};
  for (const x of itens) {
    if (temIconeProprio(x)) continue;
    const regra = regraDeArte(x);
    if (!regra) continue;
    const arq = escolherArquivo(await listar(regra.pasta), x, regra.palavras);
    if (arq) out[x.id] = arq;
  }
  return out;
}
