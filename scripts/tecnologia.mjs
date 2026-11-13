/**
 * Níveis de tecnologia (patch das novas mecânicas, item 23). Só contas puras.
 * Umbra'Draxil = 1, Briavoterna = 2, Genesis = 3. O personagem tem a região de origem (aba Sobre) e as
 * adaptações; o item tem a região (ou o "nível de tecnologia") e pode ser "complexo".
 */
export const NIVEIS_REGIAO = { umbra: 1, briavoterna: 2, genesis: 3 };
export const NOMES_REGIAO = { umbra: "Umbra'Draxil", briavoterna: "Briavoterna", genesis: "Genesis" };
export const REGIAO_DO_NIVEL = { 1: "umbra", 2: "briavoterna", 3: "genesis" };
/** DT do teste de Tecnologia para usar um item complexo 2 níveis acima. */
export const DT_COMPLEXO = 20;

const norm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** "umbra", "Umbra'Draxil", "Genesis"… → id da região ("" se não reconhecer). */
export function idRegiao(texto) {
  const t = norm(texto);
  if (!t) return "";
  if (t.startsWith("umbra")) return "umbra";
  if (t.startsWith("bria")) return "briavoterna";
  if (t.startsWith("gene")) return "genesis";
  return "";
}

/** Nível de tecnologia do item (0 = sem tecnologia, não penaliza). */
export function nivelTecItem(item) {
  const f = item?.flags?.["epm-ficha"] ?? {};
  const n = Math.floor(Number(f.nivelTec) || 0);
  if (n > 0) return Math.min(3, n);
  return NIVEIS_REGIAO[idRegiao(f.regiao)] ?? 0;
}

/** O item é proteção (armadura, escudo ou vestimenta)? Armas e itens de usar seguem a outra regra. */
export function eProtecao(item) {
  return item?.type === "equipment";
}

/**
 * Penalidade de um item para quem domina o nível `nivelPersonagem`.
 * Proteção: −2 / −5 na CA e sem as propriedades especiais. Arma ou item de usar: desvantagem; 2 acima, −5 também
 * e, se for complexo, um teste de Tecnologia DT 20 antes de usar.
 */
export function penalidadeTec(item, nivelPersonagem) {
  const nivelItem = nivelTecItem(item);
  const diff = nivelItem && nivelPersonagem ? nivelItem - nivelPersonagem : 0;
  if (diff <= 0) return null;
  const regiao = NOMES_REGIAO[REGIAO_DO_NIVEL[nivelItem]] ?? `nível ${nivelItem}`;
  const fonte = `Tecnologia de ${regiao} (${diff} acima)`;
  if (eProtecao(item)) {
    const ca = diff >= 2 ? -5 : -2;
    return { diff, nivelItem, protecao: true, ca, semPropriedades: true, fonte, texto: `${fonte}: −${Math.abs(ca)} na CA, sem as propriedades especiais` };
  }
  const penal = diff >= 2 ? -5 : 0;
  const complexo = diff >= 2 && !!item?.flags?.["epm-ficha"]?.complexo;
  return {
    diff, nivelItem, protecao: false, desvantagem: true, penal, complexo, fonte,
    texto: `${fonte}: desvantagem${penal ? ` e −${Math.abs(penal)}` : ""}${complexo ? `; complexo: Tecnologia DT ${DT_COMPLEXO} antes de usar` : ""}`
  };
}

/** Na proteção penalizada só ficam os efeitos negativos (penalidades e desvantagens continuam valendo). */
export function efeitosSemPropriedades(efeitos = []) {
  return efeitos.filter(e => e.tipo === "desvantagem" || e.tipo === "vulnerabilidade" || (e.tipo === "mod" && Number(e.valor) < 0));
}
