/**
 * Novas mecânicas: as regras opcionais (Escudo do Mestre → Ajustes → Regras opcionais) e as listas
 * que o Mestre edita (eventos de afinidade, traumas, feitos, dano dos acúmulos).
 * O topo é só dados e contas puras, para os testes rodarem fora do Foundry.
 */
import { MODULE_ID, NIVEIS_DANO } from "./config.mjs";

/* ---------------- Regras opcionais (todas começam desligadas) ---------------- */

export const REGRAS_OPCIONAIS = [
  { id: "falhaCritica", n: 13, label: "Falha crítica com tabela", dica: "Um 1 natural no d20 de um ataque rola 1d4: a arma cai, Caído, Desprevenido ou acerta um aliado perto. Cartão no chat com botão para aplicar." },
  { id: "chefes", n: 14, label: "Chefes com fases", dica: "Na ficha do NPC o Mestre marca \"Chefe\" e configura as fases (limiar de Vida e o que acontece). A fase entra sozinha quando a Vida passa do limiar, uma vez por combate." },
  { id: "auraHorror", n: 15, label: "Aura de Horror", dica: "Dado e DT na ficha do NPC. No Escudo, quem vê a criatura faz Vontade; se falhar, perde Sanidade. A ficha lembra quem já viu." },
  { id: "ancoras", n: 16, label: "Âncoras", dica: "Seção na aba Sobre com 1 a 3 âncoras (pessoa, objeto ou juramento). Interagir recupera 1d6 de Sanidade por dia." },
  { id: "traumas", n: 17, label: "Traumas", dica: "Sanidade a 0 dá um trauma permanente e a Sanidade volta a 20. Tabela editável abaixo." },
  { id: "maestria", n: 18, label: "Domínio de arma", dica: "A ficha conta os acertos por tipo de arma: 50 dá +1 de acerto, 200 libera uma técnica, 500 dá +1 nível de dano." },
  { id: "feitos", n: 19, label: "Feitos e títulos", dica: "Lista de feitos editável abaixo (PEv e título). Alguns são detectados sozinhos, os outros o Mestre dá no Escudo → Grupo." },
  { id: "purificacao", n: 20, label: "Purificação e transferência de maldição", dica: "Botões só do Mestre em cada maldição: Purificar (moedas, Sanidade ou sacrifício) e Transferir (o outro precisa aceitar)." },
  { id: "acumulos", n: 21, label: "Acúmulos de condições", dica: "Sangrando, Envenenado e Em Chamas acumulam de 1 a 3. O dano do Novo turno é multiplicado pelos acúmulos." },
  { id: "descanso", n: 22, label: "Atividades de descanso", dica: "No descanso longo cada personagem escolhe: Vigiar, Cozinhar, Conversar, Estudar ou Rezar." },
  { id: "durabilidade", n: 8, label: "Durabilidade de itens", dica: "Armas, armaduras, escudos e ferramentas vão de 0 a 100. Falha crítica com a arma e crítico sofrido tiram 10; em 0 o item fica Quebrado (sem efeitos, nem a CA) até ser consertado (ferramenta, 10 minutos, Ofício DT 12, +50). Desligada, nada disso aparece e nenhum item fica quebrado." }
];
export const PADRAO_REGRAS = Object.fromEntries(REGRAS_OPCIONAIS.map(r => [r.id, false]));

/** Eventos rápidos de afinidade (botões do Mestre na aba Relações). */
export const EVENTOS_AFINIDADE_PADRAO = [
  { nome: "Salvou a vida", delta: 1 },
  { nome: "Ajudou numa luta", delta: 1 },
  { nome: "Cumpriu uma promessa", delta: 1 },
  { nome: "Mentiu", delta: -1 },
  { nome: "Abandonou em perigo", delta: -2 },
  { nome: "Traição", delta: -2 }
];

/** Tabela de traumas (os 6 primeiros têm automação pelo id). */
export const TRAUMAS_PADRAO = [
  { id: "fobia", nome: "Fobia", texto: "O jogador escolhe o gatilho. Perto dele, o personagem tem desvantagem em testes e ataques (liga quando o gatilho está presente)." },
  { id: "tique", nome: "Tique", texto: "−2 em Furtividade." },
  { id: "voz", nome: "Voz interna", texto: "No começo de cada combate, rola 1d6. Com 1, fica Confuso no primeiro turno." },
  { id: "inquietacao", nome: "Inquietação", texto: "Não consegue fazer descanso curto." },
  { id: "maos", nome: "Mãos trêmulas", texto: "−2 nos ataques de Pontaria." },
  { id: "hipervigilancia", nome: "Hipervigilância", texto: "+2 na iniciativa e −2 nos testes de Vontade." }
];

/** Feitos de exemplo. `auto` = detectado sozinho (umPv, chefe, maestria50). */
export const FEITOS_PADRAO = [
  { id: "porUmFio", nome: "Por um fio", descricao: "Terminar um combate com 1 PV.", pev: 5, titulo: "Por um Fio", auto: "umPv" },
  { id: "matadorChefes", nome: "Matador de chefes", descricao: "Derrotar um Chefe.", pev: 10, titulo: "Matador de Chefes", auto: "chefe" },
  { id: "maoFirme", nome: "Mão firme", descricao: "Chegar a 50 acertos com um tipo de arma (Domínio de arma).", pev: 5, titulo: "Mão Firme", auto: "maestria50" },
  { id: "salvador", nome: "Salvador", descricao: "Tirar um aliado da beira da morte.", pev: 5, titulo: "Salvador", auto: "" },
  { id: "diplomata", nome: "Diplomata", descricao: "Resolver um conflito sério sem lutar.", pev: 5, titulo: "Diplomata", auto: "" }
];
export const AUTO_FEITOS = { "": "Só pelo Mestre", umPv: "Terminar um combate com 1 PV", chefe: "Derrotar um Chefe", maestria50: "50 acertos no Domínio de arma" };

/** Condições que acumulam (regra 21) e o dano de cada acúmulo no Novo turno. */
export const ACUMULAVEIS = ["epm-sangrando", "epm-envenenado", "epm-em-chamas"];
export const ROTULOS_ACUMULAVEIS = { "epm-sangrando": "Sangrando", "epm-envenenado": "Envenenado", "epm-em-chamas": "Em Chamas" };
export const DANO_ACUMULO_PADRAO = { "epm-sangrando": "1d4", "epm-envenenado": "1d4", "epm-em-chamas": "1d6" };
export const MAX_ACUMULOS = 3;

/* ---------------- Leitura das configurações ---------------- */

function ler(chave, padrao) {
  try {
    const v = globalThis.game?.settings?.get(MODULE_ID, chave);
    return v === undefined || v === null ? padrao : v;
  } catch {
    return padrao;
  }
}

/** Regras ligadas (objeto id → true/false). Fora do Foundry, tudo desligado. */
export function regrasLigadas() {
  const v = ler("regrasOpcionais", {});
  return { ...PADRAO_REGRAS, ...(v && typeof v === "object" ? v : {}) };
}
export const regra = id => !!regrasLigadas()[id];

const lista = (v, padrao) => (Array.isArray(v) && v.length ? v : padrao);
export const eventosAfinidade = () => lista(ler("eventosAfinidade", []), EVENTOS_AFINIDADE_PADRAO)
  .map(e => ({ nome: String(e?.nome ?? "").trim(), delta: Math.trunc(Number(e?.delta) || 0) })).filter(e => e.nome && e.delta);
export const tabelaTraumas = () => lista(ler("tabelaTraumas", []), TRAUMAS_PADRAO)
  .map((t, i) => ({ id: String(t?.id || `t${i}`), nome: String(t?.nome ?? "").trim(), texto: String(t?.texto ?? "") })).filter(t => t.nome);
export const listaFeitos = () => lista(ler("listaFeitos", []), FEITOS_PADRAO)
  .map((f, i) => ({ id: String(f?.id || `f${i}`), nome: String(f?.nome ?? "").trim(), descricao: String(f?.descricao ?? ""), pev: Math.max(0, Math.trunc(Number(f?.pev) || 0)),
    titulo: String(f?.titulo ?? "").trim(), auto: AUTO_FEITOS[f?.auto] !== undefined ? f.auto : "" })).filter(f => f.nome);
export const danoAcumulos = () => ({ ...DANO_ACUMULO_PADRAO, ...(ler("danoAcumulos", {}) ?? {}) });

/** Registra as configurações do mundo (chamado em registrarAjustes). */
export function registrarOpcionais(reg) {
  const redesenhar = () => {
    for (const app of globalThis.foundry?.applications?.instances?.values?.() ?? []) {
      if (app?.rendered && (app.document?.documentName === "Actor" || app.id === "epm-escudo-mestre")) app.render();
    }
  };
  reg("regrasOpcionais", { scope: "world", config: false, type: Object, default: { ...PADRAO_REGRAS }, onChange: redesenhar });
  reg("eventosAfinidade", { scope: "world", config: false, type: Array, default: [], onChange: redesenhar });
  reg("tabelaTraumas", { scope: "world", config: false, type: Array, default: [], onChange: redesenhar });
  reg("listaFeitos", { scope: "world", config: false, type: Array, default: [], onChange: redesenhar });
  reg("danoAcumulos", { scope: "world", config: false, type: Object, default: {}, onChange: redesenhar });
}

/* ---------------- Contas puras ---------------- */

const int = v => Math.trunc(Number(v) || 0);

/** Acúmulos de uma condição (1 se ativa sem registro). */
export function acumulosDe(dados, id) {
  return Math.max(1, Math.min(MAX_ACUMULOS, int(dados?.acumulos?.[id]) || 1));
}

/** "1d4" com 3 acúmulos → "3d4" (multiplica cada grupo de dados; números ficam iguais). */
export function multiplicarDadosFormula(formula, n) {
  const k = Math.max(1, int(n));
  return String(formula ?? "").replace(/(\d*)d(\d+)/gi, (_, q, l) => `${(int(q) || 1) * k}d${l}`);
}

/** Dano por turno das condições acumuláveis ativas (regra 21). */
export function dotsDeAcumulos(dados, statuses = [], danos = DANO_ACUMULO_PADRAO, rotulos = ROTULOS_ACUMULAVEIS) {
  const ativos = new Set(statuses);
  return ACUMULAVEIS.filter(id => ativos.has(id) && danos[id]).map(id => {
    const n = acumulosDe(dados, id);
    const nome = rotulos[id] ?? id.replace(/^epm-/, "");
    return { fonte: `${nome}${n > 1 ? ` ×${n}` : ""}`, efeitos: { dot: [{ formula: multiplicarDadosFormula(danos[id], n), recurso: "pv", rotulo: `${nome}${n > 1 ? ` ×${n}` : ""}` }] }, tipo: "acumulo" };
  });
}

/** Efeitos dos traumas da ficha (regra 17): fontesEfeito e mods para a ficha. */
export function efeitosDosTraumas(dados) {
  const fontes = [];
  const mods = [];
  for (const t of Object.values(dados?.traumas ?? {})) {
    if (!t) continue;
    const fonte = `Trauma: ${t.nome || "Trauma"}`;
    if (t.tipo === "fobia" && t.gatilhoPresente) fontes.push({ fonte: `${fonte}${t.gatilho ? ` (${t.gatilho})` : ""}`, efeitos: { desvTestes: true, desvAtaques: true }, tipo: "trauma" });
    if (t.tipo === "tique") fontes.push({ fonte, efeitos: { pericias: { furtividade: -2 } }, tipo: "trauma" });
    if (t.tipo === "inquietacao") fontes.push({ fonte, efeitos: { semDescansoCurto: true }, tipo: "trauma" });
    if (t.tipo === "maos") fontes.push({ fonte, efeitos: { distancia: -2 }, tipo: "trauma" });
    if (t.tipo === "hipervigilancia") {
      fontes.push({ fonte, efeitos: { pericias: { vontade: -2 } }, tipo: "trauma" });
      mods.push({ alvo: "iniciativa", valor: 2, fonte });
    }
  }
  return { fontes, mods };
}

/** Chave de um tipo de arma ("Espada Longa" → "espada longa"). */
export function chaveTipoArma(tipo) {
  return String(tipo ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export const MARCOS_MAESTRIA = { acerto: 50, tecnica: 200, dano: 500 };

/** Bônus de Maestria de arma para um tipo (regra 18). */
export function bonusMaestria(dados, tipoArma) {
  const m = dados?.maestria?.[chaveTipoArma(tipoArma)];
  const acertos = Math.max(0, int(m?.acertos));
  return {
    acertos, acerto: acertos >= MARCOS_MAESTRIA.acerto ? 1 : 0, tecnica: acertos >= MARCOS_MAESTRIA.tecnica, nivelDano: acertos >= MARCOS_MAESTRIA.dano ? 1 : 0
  };
}

const semAcento = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const VOGAIS = { a: "[aáàâã]", e: "[eéê]", i: "[ií]", o: "[oóôõ]", u: "[uú]", c: "[cç]" };
const padraoFlexivel = palavra => semAcento(palavra).toLowerCase().replace(/[aeiouc]/g, ch => VOGAIS[ch]);

/**
 * Sobe o nível do tipo de dano ("Cortante" → "Cortante (Mágico)", "Fogo (Mágico)" → "Fogo (Verdadeiro)").
 * Sem tipo, devolve só o nível. Arcaico é o teto.
 */
export function subirNivelDano(tipoDano, passos = 1) {
  let base = String(tipoDano ?? "");
  let atual = 0;
  NIVEIS_DANO.forEach((n, i) => {
    const re = new RegExp(`\\(?\\s*\\b${padraoFlexivel(n.label)}\\b\\s*\\)?`, "i");
    if (re.test(base)) { atual = Math.max(atual, i); base = base.replace(re, " "); }
  });
  base = base.replace(/\(\s*\)/g, "").replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();
  const novo = NIVEIS_DANO[Math.min(NIVEIS_DANO.length - 1, atual + Math.max(0, int(passos)))];
  return base ? `${base} (${novo.label})` : novo.label;
}

/** Fases do chefe que a Vida acabou de cruzar para baixo (regra 14), em ordem. */
export function fasesCruzadas(fases = [], pctAntes, pctAgora, usadas = []) {
  return fases.map((f, i) => ({ lim: Number(f?.limiar), i }))
    .filter(x => Number.isFinite(x.lim) && !usadas.includes(x.i) && pctAntes > x.lim && pctAgora <= x.lim)
    .sort((a, b) => b.lim - a.lim).map(x => x.i);
}
