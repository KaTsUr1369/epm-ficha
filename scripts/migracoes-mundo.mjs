/**
 * Atualiza as fichas e itens que já existem quando o módulo muda (roda no Mestre ativo ao abrir o mundo).
 * Cada passo confere item por item e só mexe no que está desatualizado (pode rodar sempre).
 */
import { FLAG } from "./config.mjs";

const P = `flags.${FLAG}`;

/** Todos os itens do mundo: soltos e dentro das fichas. */
function todosItens() {
  const out = [...(game.items ?? [])];
  for (const a of game.actors ?? []) out.push(...(a.items ?? []));
  return out;
}

/** Magias importadas pelo leitor antigo (site PF2 SRD): tira o link errado e aponta para o Códex do Vazio. */
async function corrigirMagiasPf2(itens) {
  const { CODEX_URL } = await import("./codex.mjs");
  let n = 0;
  for (const item of itens) {
    const f = item.flags?.[FLAG];
    if (item.type !== "spell" || f?.origemExterna?.site !== "pf2srd" || f?.origemCorrigida) continue;
    const desc = String(item.system?.description?.value ?? "");
    const nova = desc.replace(/<p class="epm-dica">Importada do Codex do Vazio[\s\S]*?<\/p>/, `<p class="epm-dica">Importada de uma versão antiga do módulo, de outro site (não é do Códex do Vazio). Para pegar a versão do <a href="${CODEX_URL}" target="_blank" rel="noopener">Códex do Vazio</a>, use o botão Códex do Vazio na aba Magias.</p>`);
    await item.update({ "system.description.value": nova, [`${P}.origemCorrigida`]: true, [`${P}.origemExterna.url`]: "" });
    n++;
  }
  return n;
}

/** Itens prontos do Escudo (Hydrakariel): versão nova troca formas, efeitos e texto, mantendo equipado e passiva. */
async function atualizarItensProntos(itens) {
  const { itemProntoPorId } = await import("./itens-prontos.mjs");
  let n = 0;
  for (const item of itens) {
    const f = item.flags?.[FLAG];
    const pronto = f?.pronto ? itemProntoPorId(f.pronto) : null;
    if (!pronto) continue;
    const novo = pronto.dados();
    const nf = novo.flags[FLAG];
    if ((f.prontoVersao ?? 1) >= (nf.prontoVersao ?? 1)) continue;
    await item.update({ [`${P}.-=formas`]: null, [`${P}.-=efeitos`]: null });
    await item.update({ [`${P}.formas`]: nf.formas, [`${P}.efeitos`]: nf.efeitos, [`${P}.prontoVersao`]: nf.prontoVersao, "system.description.value": novo.system.description.value });
    n++;
  }
  return n;
}

export async function migrarMundo() {
  if (!game.user?.isGM || (game.users?.activeGM && !game.users.activeGM.isSelf)) return;
  const itens = todosItens();
  const feitos = [];
  try { const n = await corrigirMagiasPf2(itens); if (n) feitos.push(`${n} magia(s) com o link antigo corrigidas`); } catch (err) { console.warn("EPM | migração das magias", err); }
  try { const n = await atualizarItensProntos(itens); if (n) feitos.push(`${n} item(ns) pronto(s) atualizado(s)`); } catch (err) { console.warn("EPM | migração dos itens prontos", err); }
  if (feitos.length) ui.notifications.info(`EPM: fichas antigas atualizadas (${feitos.join("; ")}).`);
  return feitos;
}
