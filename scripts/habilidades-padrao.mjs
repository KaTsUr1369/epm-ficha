/**
 * Padronização (0.9.2): as habilidades e magias que já existem no Foundry entram no padrão do Grimório do Multiverso.
 *  - Cada forma é automatizada pelo próprio texto (ação, custo, uso, alcance, área, duração, teste, dano e condições),
 *    só preenchendo o que estiver vazio: nada do que o jogador ou o Mestre escreveu é apagado.
 *  - Habilidades feitas à mão (sem origem de arquétipo, classe, raça ou treino, fora do Grimório e da HUI) ganham a receita
 *    do criador (categoria, natureza e técnicas com raridade, modo, modificadores e restrições), e passam a ter
 *    o menu Aprimorar, Evoluir, Nova técnica e Remodelar.
 * A migração do mundo roda uma vez por versão da leitura (VERSAO_PADRONIZACAO); "Ler o texto de novo" refaz um item.
 */
import { FLAG } from "./config.mjs";
import { lerPoder } from "./data.mjs";
import { automatizarForma, receitaDoPoder, textoPuro, VERSAO_PADRONIZACAO } from "./habilidade-auto.mjs";

const P = `flags.${FLAG}`;
/** Origens que podem virar habilidade "criada" (as outras vêm de livro: arquétipo, classe, raça, treinos, talentos…). */
const ORIGENS_RECEITA = ["", "criada", "ritual", "geral", "texto", "outro"];
const CAMPOS_FORMA = ["acao", "custo", "porTurno", "uso", "alcance", "area", "duracao", "teste", "dano", "condicoes"];

/** Plano de mudanças de um item (puro: recebe o objeto do item). Devolve { upd, campos } ou null. */
export function planoPadronizacao(item, { forcar = false } = {}) {
  if (!item || !["feat", "spell"].includes(item.type)) return null;
  const f = item.flags?.[FLAG] ?? {};
  if (!forcar && Number(f.padronizada ?? 0) >= VERSAO_PADRONIZACAO) return null;
  const p = lerPoder(item);
  const desc = item.system?.description?.value ?? "";
  const upd = { [`${P}.padronizada`]: VERSAO_PADRONIZACAO };
  const campos = new Set();
  const formasNovas = [];
  for (const fo of p.formas) {
    const texto = textoPuro(fo.efeito) || (p.formas.length === 1 ? textoPuro(desc) : "");
    if (!texto) { formasNovas.push(fo); continue; }
    const { forma, campos: c } = automatizarForma(fo, texto, { modo: fo.tecnica?.modo ?? (fo.acao === "passiva" ? "passiva" : "") });
    formasNovas.push(forma);
    if (!c.length) continue;
    c.forEach(x => campos.add(x));
    for (const k of CAMPOS_FORMA) upd[`${P}.formas.${fo.id}.${k}`] = forma[k];
  }
  const podeReceita = !f.receita && !f.hui && !f.grimorio && !f.compendio && ORIGENS_RECEITA.includes(String(f.origem ?? "")) && formasNovas.length;
  if (podeReceita) {
    upd[`${P}.receita`] = receitaDoPoder({
      tipoItem: item.type, nome: item.name, raridade: f.raridade, origem: f.origem, descricao: desc,
      formas: formasNovas, tipoHab: f.tipoHab, tema: f.tema
    });
    campos.add("receita do criador");
  }
  return { upd, campos: [...campos] };
}

/** Padroniza um item (botão "Ler o texto de novo" refaz mesmo já padronizado). */
export async function padronizarItem(item, { forcar = true, avisar = true } = {}) {
  const plano = planoPadronizacao(item, { forcar });
  if (!plano) return 0;
  await item.update(plano.upd);
  if (avisar) {
    ui.notifications.info(plano.campos.length
      ? `${item.name}: preenchido pelo texto (${plano.campos.join(", ")}).`
      : `${item.name}: o texto não trouxe nada novo para preencher.`);
  }
  return plano.campos.length ? 1 : 0;
}

/** Migração do mundo: itens soltos e das fichas, em lote por ficha. Devolve quantos mudaram de verdade. */
export async function padronizarMundo(itens = null) {
  const lista = itens ?? [...(game.items ?? []), ...[...(game.actors ?? [])].flatMap(a => [...(a.items ?? [])])];
  const porDono = new Map();
  let mudaram = 0;
  for (const item of lista) {
    let plano = null;
    try { plano = planoPadronizacao(item); } catch (err) { console.warn("EPM | padronização de", item?.name, err); }
    if (!plano) continue;
    if (plano.campos.length) mudaram++;
    const dono = item.parent?.documentName === "Actor" ? item.parent : null;
    const chave = dono ?? "mundo";
    if (!porDono.has(chave)) porDono.set(chave, []);
    porDono.get(chave).push({ _id: item.id, ...plano.upd });
  }
  for (const [dono, upds] of porDono) {
    for (let i = 0; i < upds.length; i += 50) {
      const lote = upds.slice(i, i + 50);
      if (dono === "mundo") await Item.updateDocuments(lote);
      else await dono.updateEmbeddedDocuments("Item", lote, { render: false });
    }
  }
  return mudaram;
}
