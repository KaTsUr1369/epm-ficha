/**
 * Compêndio "EPM · Arquétipos e Classes", no formato do D&D 5e: cada Arquétipo é um item Classe,
 * cada Classe pronta é uma Subclasse do arquétipo dela, e cada habilidade é um Talento (feat) ligado
 * por nível (Advancement "ItemGrant") à Classe ou Subclasse.
 *
 * O compêndio é do mundo (o Mestre ativo cria e atualiza sozinho quando o módulo muda), então não precisa
 * de arquivos de banco de dados no módulo. Arrastar o item para a ficha EPM define o arquétipo ou a classe
 * (actor-sheet.mjs → _soltarItem); o nível continua sendo o da ficha EPM.
 */
import { FLAG, MODULE_ID } from "./config.mjs";
import { ARQUETIPOS } from "./arquetipos.mjs";
import { CLASSES_NOTION, habilidadesDaClasse, RECURSOS_ARQUETIPO } from "./regras-extras.mjs";
import { dadosHabilidadeArquetipo, dadosHabilidadeClasse } from "./extras.mjs";
import { escapar } from "./helpers.mjs";

export const NOME_PACOTE = "epm-arquetipos-classes";
export const ID_PACOTE = `world.${NOME_PACOTE}`;
const ROTULO = "EPM · Arquétipos e Classes";
/** Suba quando mudar o formato dos itens (força refazer o compêndio mesmo sem mudar os dados). */
const FORMATO = 1;

const IMAGENS_ARQ = { combatente: "icons/svg/combat.svg", conjurador: "icons/svg/lightning.svg", artifice: "icons/svg/item-bag.svg" };

/** Id fixo de 16 caracteres a partir de um texto (os links entre os itens não mudam de uma versão para outra). */
export function idFixo(texto) {
  const abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  const s = `epm:${texto}`;
  let out = "";
  for (let k = 0; out.length < 16; k++) {
    for (let i = 0; i < s.length; i++) {
      h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0;
      h2 = Math.imul(h2 + s.charCodeAt(i) + k, 2246822519) >>> 0;
    }
    out += abc[((h1 ^ (h2 >>> 7)) >>> 0) % abc.length] + abc[((h2 ^ (h1 >>> 11)) >>> 0) % abc.length];
  }
  return out.slice(0, 16);
}

const uuid = id => `Compendium.${ID_PACOTE}.Item.${id}`;
const link = (id, nome) => `@UUID[${uuid(id)}]{${nome}}`;
const dadoFaces = dado => `d${String(dado ?? "").split("d")[1] || 8}`;

/** Agrupa habilidades por nível e devolve o Advancement ItemGrant de cada nível. */
function concessoes(lista, prefixo) {
  const porNivel = new Map();
  for (const h of lista) {
    if (!porNivel.has(h.nivel)) porNivel.set(h.nivel, []);
    porNivel.get(h.nivel).push(h);
  }
  return [...porNivel.entries()].sort((a, b) => a[0] - b[0]).map(([nivel, hs]) => ({
    _id: idFixo(`${prefixo}:adv:${nivel}`), type: "ItemGrant", level: nivel, title: hs.length > 1 ? "Habilidades" : hs[0].nome,
    configuration: { items: hs.map(h => ({ uuid: uuid(h.id), optional: false })), optional: false, spell: null }
  }));
}

/** Todos os documentos do compêndio (pastas e itens), sem Foundry. */
export function documentosDoCompendio() {
  const pastas = [
    { _id: idFixo("pasta:arquetipos"), name: "Arquétipos (Classes)", type: "Item", sorting: "m", sort: 1, color: "#8a6d3b" },
    { _id: idFixo("pasta:classes"), name: "Classes (Subclasses)", type: "Item", sorting: "m", sort: 2, color: "#5b3f8c" },
    { _id: idFixo("pasta:hab-arq"), name: "Habilidades de Arquétipo", type: "Item", sorting: "m", sort: 3 },
    { _id: idFixo("pasta:hab-classe"), name: "Habilidades de Classe", type: "Item", sorting: "m", sort: 4 }
  ];
  const itens = [];

  for (const [arqId, a] of Object.entries(ARQUETIPOS)) {
    const habs = a.habilidades.map(h => ({ ...h, id: idFixo(`arq:${arqId}:${h.nivel}:${h.nome}`) }));
    for (const h of habs) {
      const d = dadosHabilidadeArquetipo(arqId, h);
      itens.push({ ...d, _id: h.id, folder: idFixo("pasta:hab-arq"), sort: h.nivel * 10, flags: { ...d.flags, [FLAG]: { ...d.flags[FLAG], compendio: "habilidade" } } });
    }
    const subclasses = Object.entries(CLASSES_NOTION).filter(([, c]) => (c.arquetipo ?? "combatente") === arqId);
    const rec = RECURSOS_ARQUETIPO[arqId] ?? {};
    const prog = Object.entries(a.progressao ?? {}).map(([n, t]) => `<tr><td>${n}</td><td>${escapar(t)}</td></tr>`).join("");
    const desc = [
      `<p>${escapar(a.funcao ?? "")}</p>`,
      a.recursos ? `<p class="epm-dica">${escapar(a.recursos)}</p>` : "",
      rec.pv ? `<p><strong>Recursos no 1º nível:</strong> ${rec.pv.inicial} PV, ${rec.pe?.inicial ?? 0} PE, ${rec.pm?.inicial ?? 0} PM. <strong>Por nível:</strong> PV ${rec.pv.dado}, PE ${rec.pe?.dado}, PM ${rec.pm?.dado}.</p>` : "",
      `<h3>Habilidades</h3><ul>${habs.map(h => `<li><strong>Nível ${h.nivel}</strong>: ${link(h.id, h.nome)}</li>`).join("")}</ul>`,
      subclasses.length ? `<h3>Classes (subclasses)</h3><ul>${subclasses.map(([id, c]) => `<li>${link(idFixo(`classe:${id}`), c.nome)}</li>`).join("")}</ul>` : "",
      prog ? `<h3>Progressão (níveis 1 a 50)</h3><table><thead><tr><th>Nível</th><th>Ganha</th></tr></thead><tbody>${prog}</tbody></table>` : "",
      `<p class="epm-dica">Arraste para a ficha EPM para definir o arquétipo. O nível continua sendo o da ficha.</p>`
    ].join("");
    itens.push({
      _id: idFixo(`arquetipo:${arqId}`), name: a.nome, type: "class", img: IMAGENS_ARQ[arqId] ?? "icons/svg/upgrade.svg", folder: idFixo("pasta:arquetipos"),
      system: {
        identifier: arqId, levels: 1, description: { value: desc },
        hd: { denomination: dadoFaces(rec.pv?.dado), spent: 0 },
        advancement: [
          ...concessoes(habs, `arq:${arqId}`),
          ...(subclasses.length ? [{ _id: idFixo(`arq:${arqId}:subclasse`), type: "Subclass", level: 3, title: "Classe", configuration: {} }] : [])
        ]
      },
      flags: { [FLAG]: { compendio: "arquetipo", arquetipoId: arqId } }
    });
  }

  for (const [classeId, c] of Object.entries(CLASSES_NOTION)) {
    const arqId = c.arquetipo ?? "combatente";
    const habs = habilidadesDaClasse(classeId).map(h => ({ ...h, id: idFixo(`classe:${h.ref}`) }));
    for (const h of habs) {
      const d = dadosHabilidadeClasse(classeId, h);
      itens.push({ ...d, _id: h.id, folder: idFixo("pasta:hab-classe"), sort: h.nivel * 10, flags: { ...d.flags, [FLAG]: { ...d.flags[FLAG], compendio: "habilidade" } } });
    }
    const caminho = h => h.caminho ? ` <em>(${escapar(c.caminhos?.[h.caminho] ?? h.caminho)})</em>` : "";
    const desc = [
      `<p>${escapar(c.descricao ?? "")}</p>`,
      `<p><strong>Arquétipo:</strong> ${link(idFixo(`arquetipo:${arqId}`), ARQUETIPOS[arqId]?.nome ?? arqId)}</p>`,
      c.caminhos ? `<p><strong>Caminhos:</strong> ${Object.values(c.caminhos).map(escapar).join(", ")} (liga na ficha, sub-aba Classe).</p>` : "",
      `<h3>Habilidades</h3><ul>${habs.map(h => `<li><strong>Nível ${h.nivel}</strong>: ${link(h.id, h.nome)}${caminho(h)}</li>`).join("")}</ul>`,
      `<p class="epm-dica">Arraste para a ficha EPM para escolher esta classe: as habilidades liberadas no nível do arquétipo entram sozinhas na sub-aba Classe.</p>`
    ].join("");
    itens.push({
      _id: idFixo(`classe:${classeId}`), name: c.nome, type: "subclass", img: "icons/svg/book.svg", folder: idFixo("pasta:classes"),
      system: { identifier: classeId, classIdentifier: arqId, description: { value: desc }, advancement: concessoes(habs, `classe:${classeId}`) },
      flags: { [FLAG]: { compendio: "classe", classeId, arquetipoId: arqId } }
    });
  }
  return { pastas, itens };
}

/** Assinatura do conteúdo: muda quando os dados ou o formato mudam. */
export function assinaturaCompendio() {
  const { pastas, itens } = documentosDoCompendio();
  const texto = JSON.stringify({ FORMATO, pastas, itens: itens.map(i => ({ ...i, flags: { ...i.flags, [FLAG]: { ...i.flags[FLAG], formas: undefined } } })) });
  return idFixo(texto);
}

/**
 * Cria o compêndio do mundo (se não existe) e refaz o conteúdo quando os dados mudaram.
 * Só o Mestre ativo. `forcar` refaz mesmo sem mudança.
 */
export async function sincronizarCompendio({ forcar = false } = {}) {
  if (!game.user?.isGM || (game.users?.activeGM && !game.users.activeGM.isSelf)) return null;
  const Colecao = foundry.documents?.collections?.CompendiumCollection ?? globalThis.CompendiumCollection;
  let pacote = game.packs.get(ID_PACOTE);
  if (!pacote) {
    pacote = await Colecao.createCompendium({ type: "Item", label: ROTULO, name: NOME_PACOTE, package: "world", system: game.system?.id });
  }
  const assinatura = assinaturaCompendio();
  let atual = "";
  try { atual = game.settings.get(MODULE_ID, "assinaturaCompendioClasses"); } catch { /* sem a configuração */ }
  const vazio = (await pacote.getIndex()).size === 0;
  if (!forcar && !vazio && atual === assinatura) return pacote;

  const travado = pacote.locked;
  if (travado) await pacote.configure({ locked: false });
  const { pastas, itens } = documentosDoCompendio();
  const ItemCls = foundry.documents?.Item ?? globalThis.Item;
  const PastaCls = foundry.documents?.Folder ?? globalThis.Folder;
  const idsVelhos = [...(await pacote.getIndex()).keys()];
  if (idsVelhos.length) await ItemCls.deleteDocuments(idsVelhos, { pack: pacote.collection });
  const pastasVelhas = pacote.folders?.map?.(f => f.id) ?? [];
  if (pastasVelhas.length) await PastaCls.deleteDocuments(pastasVelhas, { pack: pacote.collection });
  await PastaCls.createDocuments(pastas, { pack: pacote.collection, keepId: true });
  for (let i = 0; i < itens.length; i += 100) await ItemCls.createDocuments(itens.slice(i, i + 100), { pack: pacote.collection, keepId: true });
  if (travado) await pacote.configure({ locked: true });
  try { await game.settings.set(MODULE_ID, "assinaturaCompendioClasses", assinatura); } catch (err) { console.warn("EPM |", err); }
  console.log(`EPM | Compêndio "${ROTULO}" atualizado (${itens.length} itens).`);
  return pacote;
}

/** Registra a configuração e liga a sincronização no ready. */
export function registrarCompendioClasses() {
  game.settings.register(MODULE_ID, "assinaturaCompendioClasses", { scope: "world", config: false, type: String, default: "" });
  Hooks.once("ready", () => {
    sincronizarCompendio().catch(err => console.error("EPM | Falha ao montar o compêndio de Arquétipos e Classes", err));
  });
}
