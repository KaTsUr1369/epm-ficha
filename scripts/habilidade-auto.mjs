/**
 * Automação pelo texto (0.9.3): lê o texto de uma habilidade, magia ou ritual e preenche a forma
 * (ação, custo, custo por turno, uso, alcance, área, duração, teste, dano e condições aplicadas),
 * e monta a receita no padrão do Grimório do Multiverso (categoria, natureza, técnicas com raridade,
 * modo, modificadores e restrições) para as habilidades que já existiam antes do criador.
 * Só dados e contas puras: roda fora do Foundry (testes em testes/testes/habilidade-auto.mjs).
 */
import { CONDICOES } from "./config.mjs";
import { normalizarTexto as norm } from "./data.mjs";
import { tipoDanoNoTexto } from "./grimorio.mjs";
import { RARIDADES_HAB, MODOS } from "./habilidades-sistema.mjs";

/** Versão da padronização: subir quando a leitura melhorar, para a migração passar de novo nos itens. */
export const VERSAO_PADRONIZACAO = 1;

const ATRIBUTOS = ["nucleo", "forca", "destreza", "constituicao", "inteligencia", "carisma", "autocontrole", "aparencia"];
const ATR = `(?:${ATRIBUTOS.join("|")})`;

/** Severidade das condições, como no criador (Orçamento). */
export const SEVERIDADE = {
  leve: ["desestabilizado", "desprevenido", "lento", "abalado", "caido", "revelado", "enredado", "surdo"],
  media: ["cego", "silenciado", "preso", "sangrando", "em chamas", "envenenado", "eletrizado", "enregelado", "fraco"],
  forte: ["atordoado", "paralisado", "incapacitado", "apavorado"],
  dominado: ["dominado"]
};

/** HTML → texto simples (parágrafos e itens de lista viram quebras de linha). */
export function textoPuro(html) {
  return String(html ?? "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|li|div|h\d|tr)>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'")
    .replace(/\*\*/g, "").replace(/[ \t]+/g, " ").replace(/\n\s+/g, "\n").trim();
}

const FORMAS_AREA = { cone: "Cone", esfera: "Esfera", linha: "Linha", raio: "Raio", circulo: "Círculo", cubo: "Cubo" };
const numero = s => Number(String(s).replace(",", "."));

/** Fórmula de dano/cura a partir de "3d10 + 10 + Núcleo", "2d6 + Força ou Destreza" (normalizado). */
export function formulaDoTexto(t) {
  const m = norm(t).match(new RegExp(`(\\d+d\\d+)((?:\\s*\\+\\s*(?:\\d+(?![d\\d])|${ATR}))*)`));
  if (!m) return "";
  const partes = [m[1]];
  for (const p of m[2].split("+").map(x => x.trim()).filter(Boolean)) partes.push(ATRIBUTOS.includes(p) ? `@atr.${p}` : p);
  return partes.join(" + ");
}

/** DT escrita no texto: "CD 10 + Força + 1" → "10 + @atr.forca + 1"; com Arcanismo fica a CD da ficha (""). */
export function dtDoTexto(t) {
  const m = norm(t).match(new RegExp(`\\b(?:cd|dt)\\s*(\\d+)((?:\\s*\\+\\s*(?:\\d+|arcanismo|${ATR}))*)`));
  if (!m) return "";
  const partes = m[2].split("+").map(x => x.trim()).filter(Boolean);
  if (partes.includes("arcanismo")) return "";
  return [m[1], ...partes.map(p => (ATRIBUTOS.includes(p) ? `@atr.${p}` : p))].join(" + ");
}

/** Condições que o efeito aplica ("fica Lento e Fraco", "quem falha fica Em Chamas"). Ignora "perde", "não fica", "imune". */
export function condicoesDoTexto(texto) {
  const n = ` ${norm(textoPuro(texto)).replace(/[^a-z0-9,.;: ]+/g, " ")} `;
  const achadas = [];
  for (const c of CONDICOES) {
    if (c.extra) continue;
    const l = norm(c.label).replace(/[^a-z0-9 ]+/g, " ").trim();
    if (!l || l.length < 4) continue;
    const variantes = [l, l.replace(/o$/, "a"), `${l}s`, `${l.replace(/o$/, "a")}s`];
    const re = new RegExp(`[^a-z](${[...new Set(variantes)].join("|")})(?=[^a-z])`, "g");
    let m;
    while ((m = re.exec(n))) {
      const antes = n.slice(Math.max(0, m.index - 45), m.index + 1);
      const trecho = antes.split(/[.;:]/).pop();
      if (/(nao fica|perde|perdem|remove|imune|sem a condicao|contra |\bse ficar|\bse estiver|enquanto)/.test(trecho)) continue;
      if (!/(fica|ficam|ficar|deixa|aplica|torna|cai)/.test(trecho)) continue;
      achadas.push(c.id);
      break;
    }
  }
  return [...new Set(achadas)];
}

/** Severidade de uma condição (pelo rótulo). */
export function severidadeDe(id) {
  const c = CONDICOES.find(x => x.id === id);
  const l = norm(c?.label ?? "");
  for (const [k, lista] of Object.entries(SEVERIDADE)) if (lista.includes(l)) return k;
  return "leve";
}

/** Lê o texto e devolve o que der para automatizar. `modo` ajuda a não ler dano onde não há (Defesa, Passiva). */
export function lerAutomacao(texto, { modo = "" } = {}) {
  const bruto = textoPuro(texto);
  const n = norm(bruto);
  const r = {};
  if (modo === "passiva" || /\bsempre ligad/.test(n)) r.acao = "passiva";
  else if (/\breacao\b/.test(n)) r.acao = "reacao";
  else if (/acao bonus/.test(n)) r.acao = "bonus";
  else if (/acao de movimento/.test(n)) r.acao = "movimento";
  else if (/acao livre/.test(n)) r.acao = "livre";
  else if (/acao padrao/.test(n)) r.acao = "padrao";

  const turno = n.match(/(\d+)\s*(pm|pe)\s*(?:por turno|a cada turno)/);
  if (turno) r.porTurno = { recurso: turno[2], valor: Number(turno[1]) };
  const custos = [...n.matchAll(/(\d+)\s*(pm|pe)\b(?!\s*(?:por turno|a cada turno))/g)];
  if (custos.length) r.custo = { recurso: custos[0][2], valor: Number(custos[0][1]) };

  if (/(1x|uma vez) por combate/.test(n)) r.uso = "combate";
  else if (/(1x|uma vez) por cena/.test(n)) r.uso = "cena";
  else if (/(1x|uma vez) por sessao/.test(n)) r.uso = "sessao";
  else if (/(1x|uma vez) por dia/.test(n)) r.uso = "dia";
  else if (/(1x|uma vez) por descanso longo/.test(n)) r.uso = "longo";
  else if (/(1x|uma vez) por descanso curto/.test(n)) r.uso = "curto";
  else if (/(1x|uma vez) por (rodada|turno)/.test(n)) r.uso = "turno";

  const area = n.match(/\b(cone|esfera|linha|raio|circulo|cubo)\s+de\s+(\d+(?:,\d+)?)\s*m\b/);
  if (area) r.area = `${FORMAS_AREA[area[1]]} de ${area[2]} m`;
  const alcance = n.match(/(?:\ba ate|\balcance(?: de)?|\bate)\s+(\d+(?:,\d+)?)\s*m\b/);
  if (alcance && !(area && alcance[1] === area[2] && !/a ate/.test(alcance[0]))) r.alcance = `${alcance[1]} m`;

  if (/sustentad/.test(n)) r.duracao = "Sustentada";
  else if (/(\d+)\s*rodadas?/.test(n)) r.duracao = `${n.match(/(\d+)\s*rodadas?/)[1]} rodadas`;
  else if (/(\d+)\s*minutos?\b/.test(n)) { const q = n.match(/(\d+)\s*minutos?\b/)[1]; r.duracao = q === "1" ? "1 minuto" : `${q} minutos`; }
  else if (/(ate o fim da cena|durante a cena|pela cena)/.test(n)) r.duracao = "Cena";
  else if (/proximo descanso longo/.test(n)) r.duracao = "Até o próximo descanso longo";
  else if (/ate o fim do (seu )?proximo turno/.test(n) && modo !== "golpe") r.duracao = "Até o fim do próximo turno";

  const atq = n.match(/ataque com (arcanismo|luta|pontaria|tecnologia)/);
  const res = n.match(/\b(reflexos?|fortitude|vontade)\b/);
  if (atq) r.teste = { tipo: "ataque", pericia: atq[1], nd: "" };
  else if (res && /(\bcd\b|\bdt\b|\bfaz\b|falhar|falha|passa|teste)/.test(n)) r.teste = { tipo: "resistencia", pericia: res[1].startsWith("reflexo") ? "reflexos" : res[1], nd: dtDoTexto(n) };

  if (modo !== "passiva" && modo !== "defesa") {
    for (const frase of bruto.split(/(?<=[.;])\s+|\n/)) {
      const nf = norm(frase);
      if (/reduz o dano/.test(nf)) continue;
      const formula = formulaDoTexto(nf);
      if (!formula) continue;
      const cura = /\bcura|recupera/.test(nf.slice(0, Math.max(0, nf.search(/\d+d\d+/)) + 1)) || modo === "cura";
      const depois = nf.slice(nf.search(/\d+d\d+/));
      if (!cura && !/dano/.test(nf) && !tipoDanoNoTexto(depois.split(/[.;(]/)[0])) continue;
      r.dano = { formula, tipo: cura ? "Cura" : tipoDanoNoTexto(depois.split(/[.;(]/)[0]) };
      break;
    }
  }
  const condicoes = condicoesDoTexto(bruto);
  if (condicoes.length) r.condicoes = condicoes;
  return r;
}

/**
 * Preenche a forma com o que foi lido, sem apagar nada que já esteja preenchido.
 * Devolve { forma, campos } (campos = o que mudou, para avisar).
 */
export function automatizarForma(forma, texto, { modo = "" } = {}) {
  const f = { ...forma, custo: { ...(forma.custo ?? {}) }, porTurno: { ...(forma.porTurno ?? {}) }, teste: { ...(forma.teste ?? {}) }, dano: { ...(forma.dano ?? {}) } };
  const r = lerAutomacao(texto, { modo });
  const campos = [];
  if (r.acao && (!f.acao || f.acao === "padrao") && r.acao !== "padrao") { f.acao = r.acao; campos.push("ação"); }
  if (r.custo && (!f.custo.recurso || f.custo.recurso === "nenhum")) { f.custo = r.custo; campos.push("custo"); }
  if (r.porTurno && (!f.porTurno.recurso || f.porTurno.recurso === "nenhum")) { f.porTurno = r.porTurno; campos.push("custo por turno"); }
  if (r.uso && (!f.uso || f.uso === "livre")) { f.uso = r.uso; campos.push("uso"); }
  for (const [k, rot] of [["alcance", "alcance"], ["area", "área"], ["duracao", "duração"]]) if (r[k] && !String(f[k] ?? "").trim()) { f[k] = r[k]; campos.push(rot); }
  if (r.teste && (!f.teste.tipo || f.teste.tipo === "nenhum")) { f.teste = r.teste; campos.push("teste"); }
  if (r.dano && !String(f.dano.formula ?? "").trim()) { f.dano = r.dano; campos.push(r.dano.tipo === "Cura" ? "cura" : "dano"); }
  if (r.condicoes?.length) {
    const antes = new Set(f.condicoes ?? []);
    const novas = r.condicoes.filter(c => !antes.has(c));
    if (novas.length) { f.condicoes = [...antes, ...novas]; campos.push("condições"); }
  }
  return { forma: f, campos };
}

/* ------------------------------------------------------------ */
/*  Receita no padrão do Grimório para habilidades antigas      */
/* ------------------------------------------------------------ */

const metros = t => numero(String(t ?? "").match(/(\d+(?:[.,]\d+)?)\s*m\b/)?.[1] ?? 0);

/** Modo provável da forma, pela ação, teste, dano e texto. */
export function modoDaForma(f, texto = "") {
  const n = norm(textoPuro(texto));
  const temDano = !!String(f.dano?.formula ?? "").trim();
  const cura = /cura/i.test(f.dano?.tipo ?? "") || /\bcura\b/.test(n);
  if (f.acao === "passiva" || /sempre ligad|\bpassiv/.test(n)) return "passiva";
  if (f.acao === "reacao" && /reduz/.test(n)) return "defesa";
  if (cura && (temDano || /\bcura\b/.test(n))) return "cura";
  if (f.acao === "movimento" || /(teletransporte|reaparece|anda o deslocamento|se move)/.test(n) && !temDano) return "movimento";
  if (temDano && f.teste?.tipo === "resistencia" && (f.area || /cone|esfera|linha|raio/.test(n))) return "explosao";
  if (temDano && f.teste?.tipo === "ataque" && f.teste?.pericia === "arcanismo") return "disparo";
  if (temDano || /ataque com a arma|golpe|ataca/.test(n)) return "golpe";
  if (/aliad/.test(n) && f.acao === "bonus") return "suporte";
  if (f.acao === "bonus" && /(por acerto|seus ataques|voce ganha|recebe \+)/.test(n)) return "buff";
  return "utilidade";
}

/** Modificadores que o texto e os campos da forma mostram. */
export function modsDaForma(f, modo, texto = "") {
  const mods = {};
  const n = norm(textoPuro(texto));
  const al = metros(f.alcance);
  if (al > 1.5) mods[al <= 9 ? "alcance9" : al <= 18 ? "alcance18" : "alcance36"] = 1;
  const area = norm(f.area ?? "");
  if (area) {
    const m = metros(area);
    const nivel = /cone/.test(area) ? (m <= 4.5 ? 1 : 2) : /linha/.test(area) ? (m <= 9 ? 1 : 3) : m <= 1.5 ? 1 : m <= 3 ? 2 : m <= 6 ? 3 : 4;
    mods[`area${nivel}`] = 1;
  }
  for (const c of f.condicoes ?? []) {
    const s = severidadeDe(c);
    const id = s === "leve" ? "condLeve" : s === "media" ? "condMedia" : s === "forte" ? "condForte" : "dominado";
    mods[id] = (mods[id] ?? 0) + 1;
  }
  const d = norm(f.duracao ?? "");
  if (/sustentad/.test(d)) mods.sustentada = 1;
  else if (/rodada/.test(d)) mods.dur3 = 1;
  else if (/minuto/.test(d)) mods.dur1min = 1;
  else if (/cena/.test(d)) mods.durCena = 1;
  else if (/hora|descanso/.test(d)) mods.durFora = 1;
  const base = MODOS[modo]?.acao ?? "padrao";
  if (f.acao !== base && modo !== "passiva") {
    if (f.acao === "bonus" && base === "padrao") mods.acaoBonus = 1;
    else if (f.acao === "movimento" && base === "bonus") mods.acaoMovimento = 1;
    else if (f.acao === "livre") mods.acaoLivre = 1;
  }
  const rd = n.match(/ignora(?:ndo)? (\d+) de rd/);
  if (rd) mods.ignorarRd = Math.min(2, Math.max(1, Math.round(Number(rd[1]) / 5)));
  if (/empurra|puxa/.test(n)) mods.empurrar = 1;
  if (/teletransport|reaparece/.test(n)) mods.teleporte = 1;
  if (/\bvantagem\b/.test(n) && !/desvantagem/.test(n)) mods.vantagem = 1;
  return mods;
}

/** Restrições pela frequência de uso. */
export function restricoesDaForma(f, texto = "") {
  const r = {};
  if (["combate", "cena"].includes(f.uso)) r.porCena = 1;
  else if (["dia", "longo"].includes(f.uso)) r.porDia = 1;
  else if (f.uso === "sessao") r.porSessao = 1;
  const n = norm(textoPuro(texto));
  if (/concentra/.test(n)) r.concentracao = 1;
  if (/exaust/.test(n)) r.colateralPesado = 1;
  return r;
}

/**
 * Receita no padrão do site para um poder que veio de fora do criador.
 * `p` = { tipoItem: "feat"|"spell", nome, raridade, origem, descricao (HTML), formas: [forma normalizada] }.
 */
export function receitaDoPoder(p) {
  const categoria = p.tipoItem === "spell" ? "magia" : p.origem === "ritual" ? "ritual" : "habilidade";
  const descricao = textoPuro(p.descricao);
  const tudo = norm([descricao, ...(p.formas ?? []).map(f => textoPuro(f.efeito))].join(" "));
  const natureza = categoria === "magia" || (p.formas ?? []).some(f => f.custo?.recurso === "pm") || /\bnucleo\b|\bmana\b/.test(tudo) ? "mistica"
    : /inteligencia|tecnologia|oficio|engenhoca/.test(tudo) ? "tecnica"
      : /carisma|lideranca|persuas|aliados que ouv/.test(tudo) ? "mental" : "fisica";
  const raridade = RARIDADES_HAB[p.raridade] ? p.raridade : "comum";
  const tecnicas = (p.formas ?? []).map((f, i) => {
    const texto = textoPuro(f.efeito) || (p.formas.length === 1 ? descricao : "");
    const modo = modoDaForma(f, texto);
    return { nome: f.nome || `Técnica ${i + 1}`, raridade, modo, efeito: texto, mods: modsDaForma(f, modo, texto), restricoes: restricoesDaForma(f, texto) };
  });
  return { nome: p.nome, categoria, natureza, tipo: p.tipoHab ?? "", tema: p.tema ?? "", descricao, tecnicas, padronizada: true };
}
