/**
 * Escudo do Mestre: monta o contexto das abas a partir de dados simples (testável fora do Foundry).
 * Quem chama (escudo.mjs) junta o combate, os personagens, os itens do mundo e o estado da janela.
 */
import {
  CONDICOES, CATEGORIAS_CONDICAO, EXAUSTAO, ACOES, DEFESAS, MOEDAS, ROTULOS_REPUTACAO, RECURSOS, REGRAS, TIPOS_ARMA
} from "./config.mjs";
import { lerAtor } from "./context.mjs";
import { ARQUETIPOS } from "./arquetipos.mjs";

export const ABAS_ESCUDO = [
  { id: "combate",   label: "Combate",   icone: "fa-solid fa-khanda" },
  { id: "grupo",     label: "Grupo",     icone: "fa-solid fa-people-group" },
  { id: "condicoes", label: "Condições", icone: "fa-solid fa-skull-crossbones" },
  { id: "itens",     label: "Itens",     icone: "fa-solid fa-sack-dollar" },
  { id: "testes",    label: "Testes",    icone: "fa-solid fa-dice-d20" },
  { id: "regras",    label: "Regras",    icone: "fa-solid fa-book" },
  { id: "notas",     label: "Notas",     icone: "fa-solid fa-feather" }
];

const CORES = { pv: "#D2544A", pm: "#4C8EE0", pe: "#E3A13A", ps: "#A47DDB" };
const norm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const TIPOS_ITEM = { weapon: "Arma", equipment: "Armadura / escudo", consumable: "Consumível", tool: "Ferramenta", loot: "Loot", container: "Mochila", spell: "Magia", feat: "Habilidade" };

/** Resumo de um personagem (ou NPC) para as linhas do escudo. */
export function resumoAtor(actor, { marcado = false } = {}) {
  let ficha;
  try { ({ ficha } = lerAtor(actor)); } catch { ficha = null; }
  const recursos = ["pv", "pm", "pe", "ps"].map(id => {
    const r = ficha?.recursos?.[id] ?? { value: 0, max: 0, temp: 0, pct: 0 };
    return {
      id, abrev: RECURSOS[id]?.abrev ?? id.toUpperCase(), cor: CORES[id], value: r.value, max: r.max, temp: r.temp ?? 0,
      pct: Math.round((r.pct ?? 0) * 100), baixo: r.max > 0 && (r.pct ?? 0) <= 0.25, mostrar: r.max > 0 && (id !== "ps" || !!actor.hasPlayerOwner)
    };
  });
  const condicoes = (ficha?.condicoesAtivas ?? []).map(c => ({ id: c.id, label: c.label, icone: c.icone, automatica: !c.ativa && c.automatica }));
  return {
    id: actor.id, uuid: actor.uuid, name: actor.name, img: actor.img || "icons/svg/mystery-man.svg", marcado,
    jogador: !!actor.hasPlayerOwner, recursos, ca: ficha?.ca?.total ?? 10, exaustao: ficha?.exaustao?.nivel ?? 0,
    defesas: (ficha?.defesas ?? []).map(d => ({ id: d.id, label: d.label, total: d.valor })),
    defesasUsadas: ficha?.acoes?.defesas ?? 0, condicoes, temCondicoes: condicoes.length > 0,
    pontos: ficha?.pontos ?? { pev: 0, pt: 0, ph: 0 }, nivel: ficha?.nivel?.total ?? ficha?.nivelTotal ?? 0
  };
}

/**
 * @param {object} p
 * @param {string} p.aba
 * @param {object|null} p.combate { iniciado, rodada, linhas: [{ id, actor, name, img, initiative, defeated, oculto, atual }] }
 * @param {object[]} p.grupo     personagens dos jogadores
 * @param {object[]} p.itensMundo { id, name, img, type }
 * @param {object} p.ui          { marcados:Set<uuid>, buscaCond, buscaItem, tipoItem, alvoItem, testes, notas, nomesAlvos }
 */
export function montarEscudo({ aba = "combate", combate = null, grupo = [], itensMundo = [], ui = {} } = {}) {
  const marcados = ui.marcados ?? new Set();
  const ctx = { aba };
  ctx.abas = ABAS_ESCUDO.map(a => ({ ...a, ativa: a.id === aba, cls: a.id === aba ? "active" : "" }));
  ctx.cls = Object.fromEntries(ABAS_ESCUDO.map(a => [a.id, a.id === aba ? "active" : ""]));

  /* Combate */
  if (combate) {
    const linhas = combate.linhas.map(l => {
      const r = l.actor ? resumoAtor(l.actor, { marcado: marcados.has(l.actor.uuid) }) : { recursos: [], condicoes: [], defesas: [] };
      return { ...r, combatente: l.id, name: l.name, img: l.img || r.img, iniciativa: l.initiative ?? "", semIniciativa: l.initiative === null || l.initiative === undefined,
        derrotado: !!l.defeated, oculto: !!l.oculto, atual: !!l.atual, npc: !r.jogador };
    });
    ctx.combate = {
      existe: true, iniciado: !!combate.iniciado, rodada: combate.rodada ?? 0, linhas, vazio: !linhas.length,
      atual: linhas.find(l => l.atual)?.name ?? "", semIniciativa: linhas.filter(l => l.semIniciativa).length
    };
  } else ctx.combate = { existe: false, linhas: [], vazio: true };

  /* Grupo */
  ctx.grupo = grupo.map(a => resumoAtor(a, { marcado: marcados.has(a.uuid) }));
  ctx.grupoVazio = !ctx.grupo.length;
  ctx.grupoAjustado = !!(ui.grupoAjustado);

  /* Alvos (marcados no escudo ou tokens selecionados) */
  ctx.alvos = { nomes: ui.nomesAlvos ?? [], qtd: (ui.nomesAlvos ?? []).length, origem: ui.origemAlvos ?? "" };

  /* Condições */
  const busca = norm(ui.buscaCond);
  const ativasNosAlvos = ui.condicoesDosAlvos ?? {};
  ctx.condicoes = CATEGORIAS_CONDICAO.map(cat => {
    const itens = CONDICOES.filter(c => c.categoria === cat.id && (!busca || norm(`${c.label} ${c.efeito ?? ""}`).includes(busca)))
      .map(c => ({ id: c.id, label: c.label, icone: c.icone, efeito: c.efeito ?? "", estado: ativasNosAlvos[c.id] ?? "" }));
    return { ...cat, itens, qtd: itens.length };
  }).filter(c => c.qtd);
  ctx.buscaCond = ui.buscaCond ?? "";
  ctx.exaustao = EXAUSTAO;

  /* Itens do mundo */
  const buscaI = norm(ui.buscaItem);
  const tipo = ui.tipoItem ?? "";
  const itens = itensMundo.filter(i => TIPOS_ITEM[i.type] && !["spell", "feat"].includes(i.type))
    .filter(i => (!tipo || i.type === tipo) && (!buscaI || norm(i.name).includes(buscaI)))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  ctx.itens = itens.slice(0, 120).map(i => ({ id: i.id, uuid: i.uuid, name: i.name, img: i.img, tipoLabel: TIPOS_ITEM[i.type] }));
  ctx.itensMais = Math.max(0, itens.length - 120);
  ctx.itensVazio = !itens.length;
  ctx.buscaItem = ui.buscaItem ?? "";
  ctx.tiposItem = [{ id: "", label: "Todos", selected: !tipo }, ...Object.entries(TIPOS_ITEM).filter(([id]) => !["spell", "feat"].includes(id))
    .map(([id, label]) => ({ id, label, selected: id === tipo }))];
  ctx.destinos = grupo.map(a => ({ id: a.id, label: a.name, selected: a.id === ui.alvoItem }));
  ctx.moedas = MOEDAS.map(m => ({ id: m.id, label: m.label, abrev: m.abrev, img: m.img }));

  /* Testes do grupo */
  ctx.testes = ui.testes ?? null;
  ctx.periciasTeste = ui.pericias ?? [];

  /* Regras rápidas */
  const conj = ARQUETIPOS.conjurador;
  ctx.regras = {
    acoes: ["padrao", "bonus", "movimento", "reacao", "livre"].map(id => ACOES[id].label),
    defesas: Object.values(DEFESAS).map(d => ({ label: d.label, icone: d.icone, texto: d.descricao })),
    exaustao: EXAUSTAO,
    custosMagia: conj.custosMagia.map((pm, c) => ({ label: c === 0 ? "Truque" : `${c}º`, pm, nivel: conj.circulos[c] })),
    reputacao: Object.entries(ROTULOS_REPUTACAO).map(([v, l]) => ({ valor: Number(v) > 0 ? `+${v}` : v, label: l })),
    progressao: [
      `PEv por combate: 5 × ND do inimigo (5 se perder); +2 por nível de diferença.`,
      `PT: ${REGRAS.ptPorPh ?? 5} PT = 1 PH. 6 h de treino = 5 PT (até 8 h por dia).`,
      `Subir nível de arquétipo: 2 × (novo nível − 1) PEv.`
    ],
    tiposArma: TIPOS_ARMA.slice(0, 12).join(", ")
  };

  /* Notas */
  ctx.notas = ui.notas ?? "";
  return ctx;
}
