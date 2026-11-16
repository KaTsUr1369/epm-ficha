/**
 * Habilidades prontas do Escudo do Mestre (como as transformações prontas): o Mestre dá só para quem deve ter.
 * E a criação de uma habilidade ou magia de qualquer categoria direto do Escudo.
 * Só dados e contas puras.
 */
import { FLAG, ORIGENS_HABILIDADE, RARIDADES_PODER, ACOES, CUSTO_RECURSOS, CIRCULOS } from "./config.mjs";
import { formaPadrao } from "./data.mjs";

const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Texto simples → HTML (uma linha por parágrafo). */
const html = texto => String(texto ?? "").split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => `<p>${esc(l)}</p>`).join("");

export const HABILIDADES_PRONTAS = [
  {
    id: "dobro-e-passo",
    nome: "Dobro e Passo",
    tipo: "habilidade", origem: "meme", tipoHab: "Habilidade Global", raridade: "comum",
    // "Global" no nome, mas só quem o Mestre der tem; não conta no limite da raridade
    foraDoLimite: true,
    resumo: "Passa o dano de um ataque que iria para você para um aliado. Quem receber o ataque tem +5 no teste ou no dano do próximo ataque.",
    formas: [{
      nome: "Dobro e Passo", acao: "reacao",
      efeito: "<p>Passe o dano de um ataque que iria para você para um aliado.</p><p>Quem receber o ataque tem <strong>+5</strong> no teste ou no dano do próximo ataque.</p>"
    }]
  }
];

/** Dados do item (feat ou spell) de uma habilidade pronta. `id(t)` gera os ids das formas. */
export function dadosHabilidadePronta(h, { id = () => foundry.utils.randomID() } = {}) {
  return montarPoder({
    nome: h.nome, tipo: h.tipo, origem: h.origem, raridade: h.raridade, tipoHab: h.tipoHab, foraDoLimite: h.foraDoLimite,
    descricao: `<p>${esc(h.resumo)}</p>`, formas: h.formas, pronta: h.id
  }, { id });
}

/**
 * Item de habilidade ou magia a partir de campos simples (Escudo → Criar habilidade).
 * opcoes: { nome, tipo: "habilidade"|"magia", origem, circulo, raridade, tipoHab, tema, passiva, foraDoLimite, alternavel,
 *           acao, custoRecurso, custoValor, duracao, alcance, efeito (texto ou HTML), descricao, formas }
 */
export function montarPoder(o = {}, { id = () => foundry.utils.randomID() } = {}) {
  const magia = o.tipo === "magia";
  const raridade = RARIDADES_PODER[o.raridade] ? o.raridade : "comum";
  const formas = (o.formas?.length ? o.formas : [{
    nome: o.nome || "Padrão", acao: o.acao, custo: { recurso: o.custoRecurso, valor: o.custoValor },
    duracao: o.duracao, alcance: o.alcance, efeito: /<\w/.test(o.efeito ?? "") ? o.efeito : html(o.efeito)
  }]).map((f, i) => {
    const base = formaPadrao(i, f.nome || o.nome || "Padrão");
    const recurso = CUSTO_RECURSOS[f.custo?.recurso] ? f.custo.recurso : "nenhum";
    return {
      ...base, ...f,
      acao: ACOES[f.acao] ? f.acao : (o.passiva ? "passiva" : "padrao"),
      custo: { recurso, valor: recurso === "nenhum" ? 0 : Math.max(0, Math.floor(Number(f.custo?.valor) || 0)) }
    };
  });
  const flags = {
    raridade, origem: magia ? "" : (ORIGENS_HABILIDADE[o.origem] ? o.origem : ""),
    passiva: !!o.passiva, foraDoLimite: !!o.foraDoLimite, alternavel: !magia && !!o.alternavel,
    tipoHab: String(o.tipoHab ?? "").trim(), tema: String(o.tema ?? "").trim(),
    formas: Object.fromEntries(formas.map((f, i) => [id(`forma:${i}:${f.nome}`), f])),
    ...(o.pronta ? { pronta: o.pronta } : {})
  };
  const d = {
    name: String(o.nome ?? "").trim() || (magia ? "Nova magia" : "Nova habilidade"),
    type: magia ? "spell" : "feat",
    img: magia ? "icons/svg/explosion.svg" : "icons/svg/book.svg",
    system: { description: { value: o.descricao ? (/<\w/.test(o.descricao) ? o.descricao : html(o.descricao)) : "" } },
    flags: { [FLAG]: flags }
  };
  if (magia) d.system.level = Math.min(6, Math.max(0, Math.floor(Number(o.circulo) || 0)));
  return d;
}

/** Opções dos seletores do formulário de criação (para o template do Escudo). */
export function opcoesCriarPoder() {
  return {
    origens: [{ id: "", label: "Sem categoria" }, ...Object.entries(ORIGENS_HABILIDADE).map(([id, label]) => ({ id, label }))],
    raridades: Object.entries(RARIDADES_PODER).map(([id, r]) => ({ id, label: r.label })),
    acoes: Object.entries(ACOES).map(([id, a]) => ({ id, label: a.label })),
    recursos: Object.entries(CUSTO_RECURSOS).map(([id, r]) => ({ id, label: r.label ?? r.sigla ?? id })),
    circulos: CIRCULOS.map(c => ({ id: c.nivel, label: c.label }))
  };
}
