/**
 * 0.8.10: Tipos de ficha de NPC (NPC Importante, NPC Comum, Monstro, Monstro Forte, Chefe).
 * Só para atores "npc". A aba "Ficha do Mestre" (id "npc") é só do Mestre; o tipo decide quais abas
 * aparecem por padrão (o Mestre ainda pode mostrar ou esconder cada uma em Personalizar).
 * Dados em flags["epm-ficha"].npc.
 */
import { custoInimigo, TIPO_DA_FICHA } from "./inimigos-nivel.mjs";
import { FLAG, ABAS, COR_PADRAO, COR_PADRAO_ANTIGA } from "./config.mjs";
import { num, int, novoId } from "./data.mjs";
import { escapar } from "./helpers.mjs";

const P = `flags.${FLAG}`;

export const TIPOS_NPC = {
  importante: { label: "NPC Importante", icone: "fa-solid fa-user-tie", resumo: "Mentores, rivais, aliados e vilões que voltam várias vezes: ficha completa + serviços e notas do Mestre." },
  comum:      { label: "NPC Comum",      icone: "fa-solid fa-user",     resumo: "Figurantes de uma cena: guardas, bandidos, mercadores. Atributos diretos, Vida por fórmula, moral e loot." },
  monstro:    { label: "Monstro",        icone: "fa-solid fa-spider",   resumo: "Criaturas de combate comuns: bloco de estatísticas, defesas, comportamento, conhecimento e materiais." },
  forte:      { label: "Monstro Forte",  icone: "fa-solid fa-dragon",   resumo: "Elite: Monstro + Tenacidade, Ações Lendárias, recargas, limiar de Vida e lacaios." },
  chefe:      { label: "Chefe",          icone: "fa-solid fa-crown",    resumo: "Fim de arco: Monstro Forte + fases, Resistência Lendária, Mítica/Arcaica, covil, vitória alternativa e recompensas." }
};

/** Abas escondidas por padrão em cada tipo (o Mestre pode mudar em Personalizar). */
const OCULTAS = {
  importante: ["bestiario", "producao", "treinamentos"],
  comum: ["habilidades", "magias", "treinamentos", "sobre", "bencaos", "relacoes", "companheiros", "bestiario", "producao"],
  monstro: ["magias", "treinamentos", "sobre", "bencaos", "relacoes", "companheiros", "bestiario", "producao"],
  forte: ["treinamentos", "sobre", "relacoes", "companheiros", "bestiario", "producao"],
  chefe: ["treinamentos", "sobre", "relacoes", "companheiros", "bestiario", "producao"]
};

const NIVEL = { importante: 0, comum: 0, monstro: 1, forte: 2, chefe: 3 };

export const DISPOSICOES = ["Hostil", "Desconfiado", "Neutro", "Amigável", "Leal"];
export const TAMANHOS = ["Minúsculo", "Pequeno", "Médio", "Grande", "Enorme", "Colossal"];

export const eAtorNpc = actor => actor?.type === "npc";

export function tipoNpc(bruto = {}) {
  const t = bruto?.npc?.tipo;
  return TIPOS_NPC[t] ? t : "importante";
}

/** A aba está escondida? Escolha explícita em Personalizar vence; senão vale o padrão do tipo. */
export function abaOcultaNpc(actor, bruto, id) {
  const escolha = bruto?.personalizacao?.abasOcultas ?? {};
  if (Object.prototype.hasOwnProperty.call(escolha, id)) return !!escolha[id];
  if (!eAtorNpc(actor)) return false;
  return OCULTAS[tipoNpc(bruto)].includes(id);
}

/** PEv que a criatura dá (5 × ND), como na calculadora de encontro. */
export const pevDoNd = nd => Math.max(0, Math.round(5 * num(nd)));

const lista = (obj, mapa) => Object.entries(obj ?? {}).filter(([, v]) => v && typeof v === "object")
  .map(([id, v]) => ({ id, ...mapa(v, id), criado: num(v.criado) })).sort((a, b) => a.criado - b.criado);

/** Contexto da aba (puro). */
export function contextoNpc({ actor, bruto = {}, isGM = false, abaOculta = () => false }) {
  if (!eAtorNpc(actor)) return null;
  const n = bruto.npc ?? {};
  const tipo = tipoNpc(bruto);
  const nv = NIVEL[tipo];
  const acoes = bruto.acoes ?? {};
  const contador = (usado, max) => ({ usado: Math.max(0, int(usado)), max: Math.max(0, int(max)), livres: Math.max(0, int(max) - int(usado)),
    marcas: Array.from({ length: Math.min(10, Math.max(0, int(max))) }, (_, i) => ({ cheio: i < Math.max(0, int(max) - int(usado)) })) });
  const hp = actor?.system?.attributes?.hp ?? {};
  const vidaPct = int(hp.max) > 0 ? Math.round((int(hp.value) / int(hp.max)) * 100) : 100;
  return {
    tipo, tipoLabel: TIPOS_NPC[tipo].label, resumo: TIPOS_NPC[tipo].resumo, icone: TIPOS_NPC[tipo].icone,
    tipos: Object.entries(TIPOS_NPC).map(([id, t]) => ({ id, label: t.label, sel: id === tipo })),
    eImportante: tipo === "importante", eComum: tipo === "comum", eCriatura: nv >= 1, eElite: nv >= 2, eChefe: nv >= 3,
    comInterpretacao: tipo === "importante" || tipo === "comum",
    comMoral: tipo === "comum" || tipo === "monstro" || tipo === "forte",
    comLoot: tipo !== "importante",
    nd: num(n.nd), pev: pevDoNd(n.nd), vidaPct,
    regiao: n.regiao ?? "", grupo: n.grupo ?? "", semCombate: !!n.semCombate,
    funcao: n.funcao ?? "", disposicao: n.disposicao ?? "", categoria: n.categoria ?? "", tamanho: n.tamanho ?? "", habitat: n.habitat ?? "",
    disposicoes: DISPOSICOES.map(d => ({ v: d, sel: d === n.disposicao })),
    tamanhos: TAMANHOS.map(d => ({ v: d, sel: d === n.tamanho })),
    vidaFormula: n.vidaFormula ?? "", referencia: n.referencia?.nivel ? n.referencia : null,
    raridades: [["comum", "Comum"], ["raro", "Raro"], ["epico", "Épico"], ["lendario", "Lendário"]].map(([v, l]) => ({ v, l, sel: (n.raridade || "comum") === v })),
    custo: n.custo ?? "", custoPadrao: custoInimigo(n.referencia?.tipo || TIPO_DA_FICHA[tipo] || "monstro", n.raridade || "comum"),
    interp: { jeito: n.interp?.jeito ?? "", quer: n.interp?.quer ?? "", sabe: n.interp?.sabe ?? "" },
    moral: { pct: Math.max(0, Math.min(99, int(n.moral?.pct, tipo === "chefe" ? 0 : 25))), texto: n.moral?.texto ?? "", avisado: !!n.moral?.avisado },
    defesas: {
      deslocamentos: n.defesas?.deslocamentos ?? "", rd: n.defesas?.rd ?? "", imunesCondicoes: n.defesas?.imunesCondicoes ?? "", sentidos: n.defesas?.sentidos ?? ""
    },
    tatica: n.tatica ?? "",
    servicos: lista(n.servicos, s => ({ nome: s.nome ?? "", detalhes: s.detalhes ?? "", preco: s.preco ?? "" })),
    loot: lista(n.loot, l => ({ nome: l.nome ?? "", qtd: l.qtd ?? "1", chance: Math.max(0, Math.min(100, int(l.chance, 100))), uso: l.uso ?? "" })),
    moedasLoot: n.moedasLoot ?? "",
    conhecimento: {
      pericia: n.conhecimento?.pericia ?? "Investigação", revelado: int(n.conhecimento?.revelado),
      niveis: lista(n.conhecimento?.niveis, c => ({ dt: int(c.dt, 10), revela: c.revela ?? "" })).sort((a, b) => a.dt - b.dt)
    },
    lacaios: lista(n.lacaios, l => ({ nome: l.nome ?? "", qtd: l.qtd ?? "1", nota: l.nota ?? "" })),
    recargas: lista(n.recargas, r => ({ nome: r.nome ?? "", min: Math.max(2, Math.min(6, int(r.min, 5))), pronta: r.pronta !== false })),
    tenacidade: contador(n.tenacidade?.usada, n.tenacidade?.max ?? (nv >= 3 ? 3 : 2)),
    resistLendaria: contador(n.resistLendaria?.usada, n.resistLendaria?.max ?? 3),
    lendarias: int(acoes.lendaria?.max), miticas: int(acoes.mitica?.max), arcaicas: int(acoes.arcaica?.max),
    covil: { ativo: !!n.covil?.ativo, entradas: lista(n.covil?.entradas, c => ({ texto: c.texto ?? "" })).map((c, i) => ({ ...c, n: i + 1 })) },
    vitoria: (() => {
      const meta = Math.max(1, int(n.vitoria?.meta, 3)), suc = Math.max(0, int(n.vitoria?.sucessos)), fal = Math.max(0, int(n.vitoria?.falhas));
      return { nome: n.vitoria?.nome ?? "", texto: n.vitoria?.texto ?? "", fase: int(n.vitoria?.fase), meta, sucessos: suc, falhas: fal,
        pipsS: Array.from({ length: meta }, (_, i) => i < suc), pipsF: Array.from({ length: meta }, (_, i) => i < fal) };
    })(),
    recompensas: n.recompensas ?? "",
    recomp: { feito: n.recomp?.feito ?? "", titulo: n.recomp?.titulo ?? "", item: n.recomp?.item ?? "", bencao: n.recomp?.bencao ?? "" },
    bando: n.bando ?? "", covilNome: n.covilNome ?? "", barra: !!n.barra, barraNumeros: !!n.barraNumeros,
    vidaEstimada: vidaPct >= 100 ? "Ileso" : vidaPct > 50 ? "Arranhado" : vidaPct > 20 ? "Ferido (metade)" : vidaPct > 0 ? "Quase morto" : "Caído",
    bencaosLista: Object.values(bruto.bencaos ?? {}).filter(b => b && typeof b === "object" && b.nome).map(b => ({ nome: b.nome, tipo: b.tipo === "maldicao" ? "maldição" : "bênção" })),
    temNotas: !!(n.notas?.agenda || n.notas?.segredo || n.notas?.ganchos || n.notas?.seMorrer),
    notas: { agenda: n.notas?.agenda ?? "", segredo: n.notas?.segredo ?? "", ganchos: n.notas?.ganchos ?? "", seMorrer: n.notas?.seMorrer ?? "" },
    chefeAtivo: !!bruto.chefe?.ativo,
    abasOcultas: OCULTAS[tipo].filter(id => abaOculta(id)).map(id => ABAS.find(a => a.id === id)?.label ?? id)
  };
}

/* -------------------------------------------- */
/*  Ações (Foundry)                             */
/* -------------------------------------------- */

const LISTAS = {
  servicos: () => ({ nome: "", detalhes: "", preco: "" }),
  loot: () => ({ nome: "", qtd: "1", chance: 100, uso: "" }),
  lacaios: () => ({ nome: "", qtd: "1", nota: "" }),
  recargas: () => ({ nome: "", min: 5, pronta: true }),
  "conhecimento.niveis": () => ({ dt: 10, revela: "" }),
  "covil.entradas": () => ({ texto: "" }),
  loja: () => ({ nome: "", estoque: 1, preco: "" })
};

export function novoNaLista(actor, chave) {
  if (!LISTAS[chave]) return;
  return actor.update({ [`${P}.npc.${chave}.${novoId()}`]: { ...LISTAS[chave](), criado: Date.now() } });
}
export function apagarDaLista(actor, chave, id) {
  if (!LISTAS[chave] || !id) return;
  return actor.update({ [`${P}.npc.${chave}.-=${id}`]: null });
}

/** Modelos de partida ao escolher o tipo (só preenche o que está vazio). */
export async function aplicarTipo(actor, tipo) {
  if (!TIPOS_NPC[tipo] || !game.user.isGM) return;
  const n = actor.flags?.[FLAG]?.npc ?? {};
  const upd = { [`${P}.npc.tipo`]: tipo };
  const nv = NIVEL[tipo];
  if (nv >= 1 && !Object.keys(n.conhecimento?.niveis ?? {}).length) {
    const base = nv >= 3 ? [15, 20, 25] : nv >= 2 ? [12, 17, 22] : [10, 15, 20];
    const textos = ["Nome, categoria e de onde vem", "Resistências, vulnerabilidades e imunidades", "Ações especiais e o ponto fraco"];
    base.forEach((dt, i) => { upd[`${P}.npc.conhecimento.niveis.${novoId()}`] = { dt, revela: textos[i], criado: Date.now() + i }; });
  }
  const acoes = actor.flags?.[FLAG]?.acoes ?? {};
  if (nv >= 2 && !int(acoes.lendaria?.max)) { upd[`${P}.acoes.lendaria.max`] = nv >= 3 ? 3 : 2; upd[`${P}.acoes.lendaria.value`] = nv >= 3 ? 3 : 2; }
  if (nv >= 3) {
    if (!int(acoes.mitica?.max)) { upd[`${P}.acoes.mitica.max`] = 1; upd[`${P}.acoes.mitica.value`] = 1; }
    if (!int(acoes.arcaica?.max)) { upd[`${P}.acoes.arcaica.max`] = 1; upd[`${P}.acoes.arcaica.value`] = 1; }
  }
  await actor.update(upd);
  // Chefe liga as fases (50% e 25%) da regra opcional "Chefes com fases"
  if (tipo === "chefe" && !actor.flags?.[FLAG]?.chefe?.ativo) {
    const { alternarChefe } = await import("./opcionais-acoes.mjs");
    await alternarChefe(actor);
  }
}

const cartao = (actor, html, { cor = "#C9A35A", gm = false } = {}) => ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor }),
  content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:${cor}">${html}</div>`,
  ...(gm ? { whisper: game.users.filter(u => u.isGM).map(u => u.id) } : {}),
  flags: { [FLAG]: { npc: true } }
});

async function rolar(formula) {
  const r = await new Roll(String(formula || "0")).evaluate();
  return r;
}

/** Rola a Vida pela fórmula (nesta ficha ou nos tokens selecionados desta criatura). */
export async function rolarVida(actor, { tokens = false } = {}) {
  const formula = String(actor.flags?.[FLAG]?.npc?.vidaFormula ?? "").trim();
  if (!formula) return ui.notifications.warn("Escreva a fórmula da Vida (ex.: 4d8 + 6).");
  let alvos = [actor];
  if (tokens) {
    const base = actor.isToken ? actor.baseActor ?? actor : actor;
    alvos = (canvas?.tokens?.controlled ?? []).filter(t => t.actor && (t.document.actorId === base.id)).map(t => t.actor);
    if (!alvos.length) return ui.notifications.warn("Selecione no mapa os tokens desta criatura.");
  }
  const linhas = [];
  for (const a of alvos) {
    let r;
    try { r = await rolar(formula); } catch { return ui.notifications.error(`Fórmula inválida: ${formula}`); }
    const v = Math.max(1, Math.round(r.total));
    await a.update({ "system.attributes.hp.value": v, "system.attributes.hp.max": v });
    linhas.push(`<li>${escapar(a.token?.name ?? a.name)}: <strong>${v}</strong> PV</li>`);
  }
  return cartao(actor, `<p><strong>Vida rolada</strong> (${escapar(formula)})</p><ul>${linhas.join("")}</ul>`, { gm: true });
}

/** Rola o loot: chance de cada item, quantidade e moedas. */
export async function saquear(actor) {
  const n = actor.flags?.[FLAG]?.npc ?? {};
  const itens = Object.values(n.loot ?? {}).filter(l => l && l.nome);
  const linhas = [];
  for (const l of itens) {
    const chance = Math.max(0, Math.min(100, int(l.chance, 100)));
    const d = chance >= 100 ? 1 : (await rolar("1d100")).total;
    if (d > chance) { linhas.push(`<li class="epm-falha">${escapar(l.nome)}: não veio (${d} &gt; ${chance}%)</li>`); continue; }
    let qtd = 1;
    try { qtd = Math.max(1, Math.round((await rolar(l.qtd || "1")).total)); } catch { qtd = 1; }
    linhas.push(`<li><strong>${qtd}× ${escapar(l.nome)}</strong>${l.uso ? ` <span class="epm-dica">· ${escapar(l.uso)}</span>` : ""}</li>`);
  }
  let moedas = "";
  if (String(n.moedasLoot ?? "").trim()) {
    const m = String(n.moedasLoot).trim().match(/^(.*?)\s*(PC|PP|PO|PL|DR)?$/i);
    try { moedas = `<p>Moedas: <strong>${Math.max(0, Math.round((await rolar(m[1])).total))} ${escapar((m[2] ?? "PO").toUpperCase())}</strong></p>`; }
    catch { moedas = `<p>Moedas: ${escapar(n.moedasLoot)}</p>`; }
  }
  if (!linhas.length && !moedas) return ui.notifications.info("Esta ficha não tem loot cadastrado.");
  return cartao(actor, `<p><strong>Loot de ${escapar(actor.name)}</strong></p><ul>${linhas.join("")}</ul>${moedas}`, { cor: "#C9A24E" });
}

/** Conhecimento: o Mestre informa o total do teste e o cartão mostra o que foi descoberto. */
export async function revelarConhecimento(actor) {
  const c = actor.flags?.[FLAG]?.npc?.conhecimento ?? {};
  const niveis = Object.values(c.niveis ?? {}).filter(x => x && x.revela).sort((a, b) => int(a.dt) - int(b.dt));
  if (!niveis.length) return ui.notifications.warn("Cadastre o que cada DT revela.");
  const { DialogV2 } = foundry.applications.api;
  const total = await DialogV2.prompt({
    window: { title: `Conhecimento: ${actor.name}` }, classes: ["epm-dialogo"], rejectClose: false,
    content: `<p>Total do teste de <strong>${escapar(c.pericia || "Investigação")}</strong>:</p><input type="number" name="total" autofocus style="width:100%">`,
    ok: { label: "Revelar", callback: (ev, btn) => int(btn.form.elements.total.value) }
  });
  if (total === null || total === undefined) return;
  const sabe = niveis.filter(x => int(x.dt) <= total);
  if (total > int(c.revelado)) await actor.update({ [`${P}.npc.conhecimento.revelado`]: total });
  const prox = niveis.find(x => int(x.dt) > total);
  const html = sabe.length
    ? `<ul>${sabe.map(x => `<li><strong>DT ${int(x.dt)}</strong>: ${escapar(x.revela)}</li>`).join("")}</ul>`
    : `<p>Nada descoberto.</p>`;
  return cartao(actor, `<p><strong>Conhecimento: ${escapar(actor.name)}</strong> (${escapar(c.pericia || "Investigação")} ${total})</p>${html}${prox ? `<p class="epm-dica">Próxima descoberta com DT ${int(prox.dt)}.</p>` : ""}`, { cor: "#7DB65A" });
}

/** Contadores de elite: Tenacidade e Resistência Lendária (usa = +1 usada e avisa no chat). */
export async function usarContador(actor, campo) {
  const nomes = { tenacidade: "Tenacidade", resistLendaria: "Resistência Lendária" };
  if (!nomes[campo]) return;
  const nv = NIVEL[tipoNpc(actor.flags?.[FLAG])];
  const c = actor.flags?.[FLAG]?.npc?.[campo] ?? {};
  const max = int(c.max ?? (campo === "tenacidade" ? (nv >= 3 ? 3 : 2) : 3));
  const usada = int(c.usada);
  if (usada >= max) return ui.notifications.warn(`${nomes[campo]} esgotada.`);
  await actor.update({ [`${P}.npc.${campo}.usada`]: usada + 1, [`${P}.npc.${campo}.max`]: max });
  const txt = campo === "tenacidade" ? "recusa a condição" : "escolhe passar no teste";
  return cartao(actor, `<p><strong>${escapar(actor.name)}</strong> usa <strong>${nomes[campo]}</strong> e ${txt}. (${max - usada - 1} restante${max - usada - 1 === 1 ? "" : "s"})</p>`, { cor: "#E58A2A" });
}
export const zerarContador = (actor, campo) => actor.update({ [`${P}.npc.${campo}.usada`]: 0 });

/** Recarga: usar a ação marca como gasta; o Novo turno (ou o começo do turno dele no combate) rola 1d6. */
export async function usarRecarga(actor, id) {
  const r = actor.flags?.[FLAG]?.npc?.recargas?.[id];
  if (!r) return;
  if (r.pronta === false) return ui.notifications.warn(`${r.nome || "Ação"} ainda não recarregou.`);
  await actor.update({ [`${P}.npc.recargas.${id}.pronta`]: false });
  return cartao(actor, `<p><strong>${escapar(actor.name)}</strong> usa <strong>${escapar(r.nome || "ação com recarga")}</strong> (recarga ${int(r.min, 5)}–6).</p>`, { cor: "#E07A3A" });
}
export async function rolarRecargas(actor) {
  const rs = Object.entries(actor.flags?.[FLAG]?.npc?.recargas ?? {}).filter(([, r]) => r && r.pronta === false);
  if (!rs.length) return;
  const upd = {}; const linhas = [];
  for (const [id, r] of rs) {
    const d = (await rolar("1d6")).total;
    const ok = d >= Math.max(2, Math.min(6, int(r.min, 5)));
    if (ok) upd[`${P}.npc.recargas.${id}.pronta`] = true;
    linhas.push(`<li>${escapar(r.nome || "Ação")}: ${d} → ${ok ? "<strong>pronta</strong>" : "ainda não"}</li>`);
  }
  if (Object.keys(upd).length) await actor.update(upd);
  return cartao(actor, `<p><strong>Recargas de ${escapar(actor.name)}</strong></p><ul>${linhas.join("")}</ul>`, { cor: "#E07A3A", gm: true });
}

/** Ações de Covil: sorteia uma entrada da tabela. */
export async function rolarCovil(actor) {
  const ent = Object.values(actor.flags?.[FLAG]?.npc?.covil?.entradas ?? {}).filter(c => c && c.texto);
  if (!ent.length) return ui.notifications.warn("Cadastre as Ações de Covil.");
  const d = (await rolar(`1d${ent.length}`)).total;
  const e = ent.sort((a, b) => num(a.criado) - num(b.criado))[d - 1];
  return cartao(actor, `<p><strong>Ação de Covil</strong> de ${escapar(actor.name)} (${d} em d${ent.length})</p><p>${escapar(e.texto)}</p>`, { cor: "#B0479A" });
}

/** Vitória alternativa: sucessos e falhas. */
export async function marcarVitoria(actor, tipo, delta = 1) {
  const v = actor.flags?.[FLAG]?.npc?.vitoria ?? {};
  const meta = Math.max(1, int(v.meta, 3));
  const campo = tipo === "falhas" ? "falhas" : "sucessos";
  const novo = Math.max(0, Math.min(meta, int(v[campo]) + int(delta, 1)));
  await actor.update({ [`${P}.npc.vitoria.${campo}`]: novo });
  if (delta > 0 && novo >= meta) {
    const ok = campo === "sucessos";
    return cartao(actor, `<p><strong>${ok ? "Vitória alternativa!" : "A tentativa falhou!"}</strong> ${escapar(actor.name)}</p>${ok && v.texto ? `<p>${escapar(v.texto)}</p>` : ""}`, { cor: ok ? "#4caf7d" : "#D2544A" });
  }
}

/* -------------------------------------------- */
/*  Ganchos                                     */
/* -------------------------------------------- */

const souMestreAtivo = () => !!game.user?.isGM && (!game.users?.activeGM || game.users.activeGM.isSelf);

/** Moral: a Vida passou do limite → pergunta ao Mestre (fugir ou render-se). Uma vez por combate. */
export async function verificarMoral(actor, opcoes) {
  if (!souMestreAtivo() || !eAtorNpc(actor)) return;
  const n = actor.flags?.[FLAG]?.npc;
  if (!n || n.moral?.avisado) return;
  const tipo = tipoNpc(actor.flags?.[FLAG]);
  if (!["comum", "monstro", "forte"].includes(tipo)) return;
  const pct = int(n.moral?.pct, 25);
  const hp = actor.system?.attributes?.hp ?? {};
  if (pct <= 0 || int(hp.max) <= 0 || int(hp.value) <= 0) return;
  const agora = (int(hp.value) / int(hp.max)) * 100;
  if (agora > pct) return;
  if (opcoes?.epmPvAntes !== undefined && (int(opcoes.epmPvAntes) / int(hp.max)) * 100 <= pct) return;
  await actor.update({ [`${P}.npc.moral.avisado`]: true });
  const nome = escapar(actor.token?.name ?? actor.name);
  return cartao(actor, `<p><strong>Moral:</strong> ${nome} chegou a ${Math.round(agora)}% da Vida.${n.moral?.texto ? ` ${escapar(n.moral.texto)}` : ""}</p>
    <p><button type="button" class="epm-botao epm-botao-mini" data-epm-action="npcFugir" data-uuid="${actor.uuid}">Foge (Fugindo)</button>
    <button type="button" class="epm-botao epm-botao-mini" data-epm-action="npcRender" data-uuid="${actor.uuid}">Rende-se</button>
    <button type="button" class="epm-botao epm-botao-mini" data-epm-action="npcLutar" data-uuid="${actor.uuid}">Continua lutando</button></p>`, { cor: "#6FA8A0", gm: true });
}

/** Botões dos cartões de NPC. */
export async function cliqueChatNpc(acao, botao) {
  if (!["npcFugir", "npcRender", "npcLutar"].includes(acao)) return false;
  if (!game.user.isGM) { ui.notifications.warn("Só o Mestre decide."); return true; }
  const actor = botao.dataset.uuid ? await fromUuid(botao.dataset.uuid) : null;
  if (!actor) return true;
  const nome = escapar(actor.token?.name ?? actor.name);
  if (acao === "npcFugir") {
    if (!actor.statuses?.has("epm-fugindo")) await actor.toggleStatusEffect("epm-fugindo", { active: true });
    await cartao(actor, `<p>${nome} perde a coragem e <strong>foge</strong>.</p>`, { cor: "#6FA8A0" });
  } else if (acao === "npcRender") {
    await cartao(actor, `<p>${nome} <strong>se rende</strong>.</p>`, { cor: "#6FA8A0" });
  }
  botao.closest("p")?.querySelectorAll("button").forEach(b => { b.disabled = true; });
  return true;
}

/** Fim do combate: zera Tenacidade, moral e vitória alternativa; recargas voltam prontas. */
export async function fimDeCombateNpc(combate) {
  if (!souMestreAtivo()) return;
  const atores = new Set();
  for (const c of combate?.combatants ?? []) if (c.actor && eAtorNpc(c.actor)) atores.add(c.actor);
  for (const a of atores) {
    const n = a.flags?.[FLAG]?.npc;
    if (!n) continue;
    const upd = {};
    if (int(n.tenacidade?.usada)) upd[`${P}.npc.tenacidade.usada`] = 0;
    if (n.moral?.avisado) upd[`${P}.npc.moral.avisado`] = false;
    if (int(n.vitoria?.sucessos) || int(n.vitoria?.falhas)) { upd[`${P}.npc.vitoria.sucessos`] = 0; upd[`${P}.npc.vitoria.falhas`] = 0; }
    for (const [id, r] of Object.entries(n.recargas ?? {})) if (r && r.pronta === false) upd[`${P}.npc.recargas.${id}.pronta`] = true;
    if (Object.keys(upd).length) await a.update(upd);
  }
}

/** Começo do turno de uma criatura no combate: rola as recargas gastas. */
export async function turnoNpc(combate, mudancas) {
  if (!souMestreAtivo() || !combate?.started) return;
  if (!("turn" in (mudancas ?? {})) && !("round" in (mudancas ?? {}))) return;
  const a = combate.combatant?.actor;
  if (a && eAtorNpc(a)) await rolarRecargas(a);
  // Covil (tabela da ficha) na rodada nova, para chefes com o covil ligado
  if ("round" in (mudancas ?? {})) {
    for (const c of combate.combatants ?? []) {
      const x = c.actor;
      if (x && eAtorNpc(x) && x.flags?.[FLAG]?.npc?.covil?.ativo && tipoNpc(x.flags[FLAG]) === "chefe") await rolarCovil(x);
    }
  }
}

/** Descanso longo: Resistência Lendária volta. */
export async function descansoNpc(actor, tipo) {
  if (tipo !== "longo" || !eAtorNpc(actor)) return;
  if (int(actor.flags?.[FLAG]?.npc?.resistLendaria?.usada)) await actor.update({ [`${P}.npc.resistLendaria.usada`]: 0 });
}

export function registrarTiposNpc() {
  registrarBarraChefe();
  Hooks.on("updateActor", (ator, mudancas, opcoes) => {
    if (!eAtorNpc(ator) || !foundry.utils.hasProperty(mudancas, "system.attributes.hp")) return;
    verificarMoral(ator, opcoes).catch(err => console.warn("EPM | moral", err));
  });
  Hooks.on("deleteCombat", c => { fimDeCombateNpc(c).catch(err => console.warn("EPM | fim de combate (NPC)", err)); });
  Hooks.on("updateCombat", (c, m) => { turnoNpc(c, m).catch(err => console.warn("EPM | turno (NPC)", err)); });
}

/* -------------------------------------------- */
/*  0.8.11: visual igual aos modelos (PDF)      */
/* -------------------------------------------- */

/** Cor de cada tipo (usada quando o Mestre não escolheu outra cor em Personalizar). */
export const CORES_TIPO = { importante: "#C9A35A", comum: "#6FA8A0", monstro: "#7DB65A", forte: "#E07A3A", chefe: "#D64560" };
export const corPadraoNpc = actor => (eAtorNpc(actor) ? CORES_TIPO[tipoNpc(actor.flags?.[FLAG])] : null);
/** Cor escolhida em Personalizar (a cor padrão do módulo conta como "não escolhida" para NPCs). */
export const corEscolhida = bruto => {
  const c = String(bruto?.personalizacao?.cor ?? "").trim();
  return c && ![COR_PADRAO, COR_PADRAO_ANTIGA].some(p => c.toLowerCase() === String(p).toLowerCase()) ? c : "";
};
export const corDaFicha = (actor, bruto) => corEscolhida(bruto) || corPadraoNpc(actor) || "";

/** Abas de cada tipo, na ordem dos modelos. */
export const ABAS_TIPO = {
  importante: ["principal", "combate", "habilidades", "magias", "inventario", "bencaos", "condicoes", "relacoes", "sobre", "servicos", "anotacoes", "npc"],
  comum: ["ficha", "condicoes", "inventario", "anotacoes", "npc"],
  monstro: ["ficha", "acoes", "condicoes", "loot", "conhecimento", "anotacoes", "npc"],
  forte: ["ficha", "acoes", "condicoes", "bencaos", "loot", "conhecimento", "anotacoes", "npc"],
  chefe: ["ficha", "fases", "acoes", "covil", "condicoes", "bencaos", "recompensas", "conhecimento", "anotacoes", "npc"]
};
export const abasDoTipo = actor => ABAS_TIPO[tipoNpc(actor?.flags?.[FLAG])];

const GRUPO_SING = { fisicos: "Físico", sociais: "Social", mentais: "Mental", mistico: "Místico" };
const ABREV = { forca: "FOR", destreza: "DES", constituicao: "CON", aparencia: "APA", carisma: "CAR", inteligencia: "INT", autocontrole: "AUT", nucleo: "NÚC" };
const NOMES_GRUPO = { importante: "NPC Importante", comum: "NPC Comum", monstro: "Monstro", forte: "Monstro Forte", chefe: "Chefe" };
const sinal = v => (int(v) > 0 ? `+${int(v)}` : int(v) < 0 ? `−${Math.abs(int(v))}` : "0");
const valorAttr = v => (int(v) < 0 ? `−${Math.abs(int(v))}` : String(int(v)));
const pillDe = id => ({ padrao: "ok", bonus: "ok", movimento: "ok", reacao: "", livre: "", lendaria: "gold", mitica: "v", arcaica: "r", passiva: "v" })[id] ?? "";
const pillCusto = t => (/PM|Mana/i.test(t) ? "p" : /PE|Estamina/i.test(t) ? "e" : "");

/**
 * Dados do visual das fichas de NPC (puro): cabeçalho, barras, atributos, combate, perícias,
 * ataques/ações, defesas, fases, elite e o resto que os modelos mostram.
 */
export function visualNpc({ ctx, actor, bruto = {}, ficha, poderes = [], isGM = false, edicao = false }) {
  if (!eAtorNpc(actor) || !ficha) return null;
  const tipo = tipoNpc(bruto);
  const nv = NIVEL[tipo];
  const n = bruto.npc ?? {};
  const cor = corEscolhida(bruto) || CORES_TIPO[tipo];
  const hp = actor?.system?.attributes?.hp ?? {};
  const vidaPct = int(hp.max) > 0 ? Math.max(0, Math.min(100, Math.round((int(hp.value) / int(hp.max)) * 100))) : 100;

  /* Fases do chefe (regra opcional "Chefes com fases") */
  const etapas = Object.entries(bruto.chefe?.etapas ?? {}).filter(([, f]) => f)
    .map(([id, f]) => ({ id, limiar: Math.max(1, Math.min(99, int(f.limiar, 50))), f, criado: num(f.criado) }))
    .sort((a, b) => b.limiar - a.limiar || a.criado - b.criado);
  const usadas = Array.isArray(bruto.chefe?.usadas) ? bruto.chefe.usadas : [];
  const faseAtual = 1 + etapas.filter(e => usadas.includes(e.id) || vidaPct <= e.limiar).length;
  const nomesFase = n.fasesNomes ?? {};
  const acaoLabel = { lendaria: "Ação Lendária", mitica: "Ação Mítica", arcaica: "Ação Arcaica" };
  const fases = [{ id: "f1", n: 1, nome: nomesFase.f1 ?? "", gatilho: "início do combate", cor: "ok", limiar: 100, efeitos: [], texto: n.fase1Texto ?? "", campoNome: "flags.epm-ficha.npc.fasesNomes.f1", campoTexto: "flags.epm-ficha.npc.fase1Texto", primeira: true }]
    .concat(etapas.map((e, i) => {
      const f = e.f; const ef = [];
      if (f.tirarNegativas) ef.push("Tira todas as condições negativas dele.");
      if (f.acao && int(f.acaoQtd, 1) > 0) ef.push(`Libera ${int(f.acaoQtd, 1)} ${acaoLabel[f.acao] ?? f.acao}${int(f.acaoQtd, 1) > 1 ? "s" : ""}.`);
      if (String(f.cura ?? "").trim()) ef.push(`Cura ${String(f.cura).trim()} de Vida.`);
      if (String(f.condicoes ?? "").trim()) ef.push(`Fica ${String(f.condicoes).trim()}.`);
      if (int(f.acerto)) ef.push(`${sinal(f.acerto)} no acerto.`);
      if (String(f.dano ?? "").trim()) ef.push(`+${String(f.dano).trim()} de dano.`);
      return { id: e.id, n: i + 2, nome: nomesFase[e.id] ?? "", gatilho: `Vida ≤ ${e.limiar}%`, cor: i === 0 ? "gold" : "r", limiar: e.limiar, efeitos: ef, texto: f.texto ?? "",
        campoNome: `flags.epm-ficha.npc.fasesNomes.${e.id}`, campoTexto: `flags.epm-ficha.chefe.etapas.${e.id}.texto`, usada: usadas.includes(e.id), etapa: e.f };
    }));
  fases.forEach(f => { f.atual = f.n === faseAtual; f.estado = f.atual ? "ativa" : f.n < faseAtual ? "passou" : "aguardando"; });

  /* Cabeçalho */
  const chips = [];
  const ch = (texto, cls = "") => { if (String(texto ?? "").trim()) chips.push({ texto, cls }); };
  // Raridade do inimigo (0.9.0): selo no cabeçalho, menos para o Comum
  const RAR = { raro: "Raro", epico: "Épico", lendario: "Lendário" };
  if (RAR[n.raridade]) ch(RAR[n.raridade], `raridade ${n.raridade}`);
  if (nv === 0) {
    ch(bruto.raca);
    if (bruto.arquetipo) ch(`${bruto.arquetipo} ${int(bruto.nivel, 1)}`, "ac");
    if (bruto.arquetipo2 && int(bruto.nivel2)) ch(`${bruto.arquetipo2} ${int(bruto.nivel2)}`, "ac");
    if (tipo === "comum" && n.funcao) ch(`Função: ${n.funcao}`, "ac");
    const reg = bruto.sobre?.regiao ?? bruto.regiaoOrigem ?? n.regiao;
    if (reg) ch(`Região: ${reg}`);
    if (bruto.sobre?.tema) ch(`Tema: ${bruto.sobre.tema}`);
    if (n.disposicao) ch(`Disposição: ${n.disposicao}`);
    if (n.grupo) ch(`Grupo: ${n.grupo}`);
    if (tipo === "comum" && n.semCombate) ch("Combate oculto", "gm");
  } else {
    if (n.categoria) ch(`Categoria: ${n.categoria}`, "ac");
    if (n.tamanho) ch(`Tamanho: ${n.tamanho}`);
    if (n.habitat) ch(`${tipo === "chefe" ? "Região" : "Habitat"}: ${n.habitat}`);
    if (n.covilNome) ch(`Covil: ${n.covilNome}`);
    if (n.bando) ch(`Bando: ${n.bando}`);
    const lac = Object.values(n.lacaios ?? {}).filter(l => l?.nome);
    if (lac.length && nv === 2) ch(`Lacaios: ${lac.map(l => `${l.qtd || 1} ${l.nome}`).join(", ")}`);
    if (nv === 2) ch("Elite", "red");
    if (nv === 3) { ch("Chefe", "red"); ch(`Fase atual: ${faseAtual}`, "ac"); }
  }
  const badges = [{ l: "ND", v: String(num(n.nd) || 0), ac: true }];
  if (tipo === "importante") badges.push({ l: "Nível total", v: String(ficha.nivelTotal ?? int(bruto.nivel, 1)) });
  if (!(tipo === "comum" && !num(n.nd))) badges.push({ l: tipo === "importante" ? "PEv ao derrotar" : "PEv", v: String(pevDoNd(n.nd)) });
  if (nv === 3) {
    const rl = Math.max(0, int(n.resistLendaria?.max ?? 3));
    const livres = Math.max(0, rl - int(n.resistLendaria?.usada));
    badges.push({ l: "Res. Lendária", v: "●".repeat(livres) + "○".repeat(rl - livres) || "—" });
  }

  /* Barras */
  const barras = (ctx.recursosLista ?? []).map(r => {
    const off = !(num(r.max) > 0);
    let label = r.label;
    if (r.id === "pv") label = (nv >= 2 || tipo === "importante") ? (nv >= 2 ? "Vida (fixa)" : "Vida") : (n.vidaFormula ? `Vida · ${n.vidaFormula}` : "Vida");
    return { ...r, off, labelBarra: label, pctNum: Math.round(num(r.pct) * 100), tempPctNum: Math.round(num(r.tempPct) * 100) };
  });

  /* Atributos */
  const atributos = Object.keys(ABREV).map(id => {
    const a = ficha.atributos?.[id] ?? {};
    const grupo = (ficha.gruposAtributo ?? []).find(g => (g.atributos ?? []).some(x => x.id === id))?.id;
    return { id, label: a.label ?? id, valor: valorAttr(a.total), grupo: GRUPO_SING[grupo] ?? "", pen: int(a.testeMod) ? sinal(a.testeMod) : "", penNeg: int(a.testeMod) < 0, base: int(a.base), campo: `flags.epm-ficha.atributos.${id}.base` };
  });

  /* Combate */
  const def = Object.fromEntries((ficha.defesas ?? []).map(d => [d.id, d.valor]));
  const stats = [
    { l: "CA", v: String(ficha.ca?.total ?? 10), ac: true },
    { l: "Iniciativa", v: sinal(ficha.iniciativa?.total), acao: "rolarIniciativa" },
    { l: "Esquiva", v: String(def.esquiva ?? "—"), acao: "defesa", defesa: "esquiva" },
    { l: "Bloqueio", v: String(def.bloqueio ?? "—"), acao: "defesa", defesa: "bloqueio" },
    { l: tipo === "importante" ? "Contra-atq." : "Contra", v: String(def.contra ?? def.contraataque ?? def["contra-ataque"] ?? "—"), acao: "defesa", defesa: Object.keys(def).find(k => /contra/.test(k)) ?? "contra" }
  ];
  const deslocExtra = String(n.defesas?.deslocamentos ?? "").split(/[,;]/).map(s => s.trim()).filter(Boolean);
  if (nv >= 1 && deslocExtra.length) {
    for (const d of deslocExtra.slice(0, 3)) {
      const m = d.match(/^(.*?)\s*([\d.,]+\s*m)$/i);
      stats.push(m ? { l: m[1] || "Desloc.", v: m[2].replace(/\s/g, " ") } : { l: "Desloc.", v: d });
    }
  } else stats.push({ l: nv >= 1 ? "Andar" : "Desloc.", v: `${String(ficha.deslocamento?.final ?? 9).replace(".", ",")} m` });
  if (tipo === "importante" || nv === 3) stats.push({ l: "CD", v: String(ficha.cd?.valor ?? "—"), ac: true });
  const pills = (ctx.acoesTurno ?? []).map(a => ({ texto: a.label, cls: a.usada ? "" : "ok", acao: a.id }));
  for (const e of (ficha.acoes?.especiais ?? [])) {
    if (!int(e.max)) continue;
    const simb = { lendaria: "◆", mitica: "◇", arcaica: "▲" }[e.id] ?? "";
    pills.push({ texto: `${e.label.replace(/^Ação /, "")} ${simb.repeat(Math.min(5, int(e.max)))}`, cls: pillDe(e.id) });
  }
  const caTexto = `CA = ${ficha.ca?.base ?? 10} + ${ABREV[ficha.ca?.atributo] ?? "DES"} ${int(ficha.ca?.atributoValor)}${int(ficha.ca?.armadura) ? ` + armadura ${int(ficha.ca.armadura)}${ficha.ca?.armaduraFontes?.length ? ` (${ficha.ca.armaduraFontes.join(", ")})` : ""}` : ""}${int(ficha.ca?.bonus) ? ` + outros ${int(ficha.ca.bonus)}` : ""}${tipo === "importante" ? ` · CD = ${ficha.cd?.formula ?? "8 + Arcanismo"}` : ""}`;

  /* Perícias */
  const todas = [...(ctx.resistenciasPericia ?? []), ...(ctx.pericias ?? [])];
  const favs = todas.filter(p => p.favorita);
  const limite = tipo === "importante" ? 8 : 5;
  favs.sort((a, b) => b.total - a.total);
  const destaque = (favs.length ? [...favs, ...todas.filter(p => !p.favorita && int(p.pontos) > 0).sort((a, b) => b.total - a.total)] : [...todas].filter(p => int(p.pontos) > 0 || int(p.outros) > 0).sort((a, b) => b.total - a.total))
    .slice(0, limite).map(p => ({ id: p.id, nome: p.nome, total: int(p.total), favorita: !!p.favorita, atributo: (p.atributos ?? []).map(a => ABREV[a] ?? a).join(" + ") }));

  /* Ataques (armas equipadas e ataques personalizados) */
  const linhaAtaque = (a, tipoAtq) => ({
    nome: a.modoLabel ? `${a.nomeItem ?? a.nome}` : a.nome,
    sub: [a.alcance, a.modoLabel].filter(Boolean).join(" · ") || (/pontaria/i.test(a.periciaNome ?? "") ? "à distância" : /luta/i.test(a.periciaNome ?? "") ? "corpo a corpo" : ""),
    acerto: `${a.periciaNome ?? ""} ${sinal(a.acertoTotal)}`.trim(), dano: a.danoTexto || "—", tipoDano: a.tipoDano ?? "", tipo: tipoAtq, ref: tipoAtq === "arma" ? a.ref : a.id, notas: a.notas ?? "", formas: a.formas ?? [], itemId: a.id
  });
  const ataques = [...(ctx.ataques?.armas ?? []).map(a => linhaAtaque(a, "arma")), ...(ctx.ataques?.custom ?? []).map(a => linhaAtaque(a, "custom"))];

  /* Ações: ataques + habilidades e magias (uma linha por forma) */
  const acoes = [];
  for (const a of ataques) acoes.push({ pill: "Padrão", cls: "ok", nome: a.nome, teste: a.acerto, efeito: `${a.dano}${a.tipoDano ? ` ${a.tipoDano}` : ""}${a.notas ? `. ${a.notas}` : ""}`, dados: true, acao: "atacar", tipo: a.tipo, ref: a.ref, formas: a.formas, itemId: a.itemId });
  const cd = ficha.cd?.valor;
  const ordemAcao = { padrao: 0, bonus: 1, movimento: 2, reacao: 3, livre: 4, lendaria: 5, mitica: 6, arcaica: 7 };
  const linhasPoder = [];
  for (const p of poderes) {
    if (p.passiva || !p.formas?.length) {
      linhasPoder.push({ ordem: 9, pill: "Passiva", cls: "v", nome: p.name, teste: "—", efeito: (p.formas?.[0]?.efeito || p.resumo || "").replace(/<[^>]+>/g, ""), acao: "usarPoder", itemId: p.id, passiva: true });
      continue;
    }
    for (const f of p.formas) {
      const custo = f.custoTexto && !/^sem custo$/i.test(f.custoTexto) ? f.custoTexto : "";
      linhasPoder.push({
        ordem: ordemAcao[f.acao] ?? 4, pill: `${f.acaoLabel}${custo ? ` · ${custo}` : ""}`, cls: custo ? pillCusto(custo) || pillDe(f.acao) : pillDe(f.acao),
        nome: p.variasFormas ? `${p.name}: ${f.nome}` : p.name, teste: f.resistencia ? `CD ${cd}` : "—",
        efeito: [f.dano ? `${f.dano}` : "", String(f.efeito ?? "").replace(/<[^>]+>/g, "")].filter(Boolean).join(" · "), acao: "usarPoder", itemId: p.id, bloqueada: f.bloqueada
      });
    }
  }
  linhasPoder.sort((a, b) => a.ordem - b.ordem);
  acoes.push(...linhasPoder);
  const habResumo = poderes.slice(0, 8).map(p => {
    const f = p.formas?.[0];
    return { nome: p.name, tipo: `${p.tipo === "magia" ? "Magia" : p.passiva ? "Passiva" : "Habilidade"}${p.tipo === "magia" || !p.passiva ? ` · ${p.raridadeLabel}` : ""}`, acao: p.passiva ? "—" : (f?.acaoLabel ?? "—"),
      custo: f?.custoTexto && !/^sem custo$/i.test(f.custoTexto) ? f.custoTexto : "—", custoCls: pillCusto(f?.custoTexto ?? ""), efeito: [f?.dano, String(f?.efeito ?? "").replace(/<[^>]+>/g, "")].filter(Boolean).join(" · ") || "—", itemId: p.id };
  });

  /* Defesas */
  const db = ctx.defesasBox ?? {};
  const txt = l => (l ?? []).map(t => t.texto ?? t).filter(Boolean).join(", ");
  const defesas = [
    ["Resistência", txt(db.resistencias)], ["Vulnerável", txt(db.vulnerabilidades)],
    ["RD", [n.defesas?.rd, ...(db.reducoes ?? []).map(r => r.texto)].filter(Boolean).join("; ")],
    ["Imune", txt(db.imunidades)], ["Imune a condições", n.defesas?.imunesCondicoes ?? ""],
    ...(nv === 3 ? [["Resistência Lendária", `${int(n.resistLendaria?.max ?? 3)} por dia: ao falhar num teste, escolhe passar`]] : []),
    ["Sentidos", n.defesas?.sentidos ?? ""], ["Idiomas", (ctx.idiomas ?? []).map(i => i.label).join(", ") || "—"]
  ].filter(([, v]) => String(v ?? "").trim()).map(([l, v]) => ({ l, v }));

  /* Condições (Principal do NPC Importante) */
  const condicoes = (ctx.condicoesBox?.condicoes ?? []).map(c => ({ texto: c.label, neg: true }));

  /* Aura */
  const aura = bruto.aura?.dado ? { dado: bruto.aura.dado, dt: int(bruto.aura.dt, 15), vistos: (Array.isArray(bruto.aura.vistos) ? bruto.aura.vistos.length : 0) } : null;

  /* Conhecimento (visão do jogador) */
  const conh = Object.values(n.conhecimento?.niveis ?? {}).filter(x => x && x.revela).sort((a, b) => int(a.dt) - int(b.dt));

  return {
    tipo, nv, cor, nomeTipo: NOMES_GRUPO[tipo], isGM, edicao,
    eImportante: tipo === "importante", eComum: tipo === "comum", eMonstro: tipo === "monstro", eForte: tipo === "forte", eChefe: tipo === "chefe",
    eCriatura: nv >= 1, eElite: nv >= 2, semCombate: tipo === "comum" && !!n.semCombate,
    titulo: n.titulo ?? "", chips, badges, barras, vidaPct, fases, faseAtual, temFases: etapas.length > 0,
    atributos, stats, pills, caTexto, destaque, ataques, acoes, habResumo, defesas, condicoes, aura,
    conhecimento: conh.map(x => ({ dt: int(x.dt), revela: x.revela })),
    loja: Object.entries(n.loja ?? {}).filter(([, l]) => l && typeof l === "object").map(([id, l]) => ({ id, nome: l.nome ?? "", estoque: Math.max(0, int(l.estoque, 1)), preco: l.preco ?? "", criado: num(l.criado) })).sort((a, b) => a.criado - b.criado),
    afinidadeGrupo: Math.max(-5, Math.min(5, int(n.afinidadeGrupo))),
    afinidadeCelulas: Array.from({ length: 11 }, (_, i) => {
      const v = i - 5, a = Math.max(-5, Math.min(5, int(n.afinidadeGrupo)));
      return { cls: v === 0 ? (a === 0 ? "z" : "") : (a < 0 && v < 0 && v >= a) ? "n" : (a > 0 && v > 0 && v <= a) ? "p" : "" };
    }),
    afinidadeTexto: sinal(n.afinidadeGrupo)
  };
}


/* ---------- 0.8.11: ações novas dos modelos ---------- */

export async function ajustarAfinidadeGrupo(actor, delta) {
  if (!game.user.isGM) return;
  const v = Math.max(-5, Math.min(5, int(actor.flags?.[FLAG]?.npc?.afinidadeGrupo) + int(delta)));
  return actor.update({ [`${P}.npc.afinidadeGrupo`]: v });
}

/** "50 PO" → valor em cobre. */
export function precoEmCobre(texto) {
  const m = String(texto ?? "").replace(/\./g, "").replace(",", ".").match(/([\d.]+)\s*(PC|PP|PO|PL|DR)?/i);
  if (!m) return 0;
  const mult = { PC: 1, PP: 10, PO: 100, PL: 1000, DR: 1000000 }[(m[2] ?? "PO").toUpperCase()];
  return Math.round(Number(m[1]) * mult);
}
export function descontoPorAfinidade(af) {
  const a = int(af);
  return a >= 4 ? -10 : a >= 2 ? -5 : a <= -2 ? 10 : 0;
}

/** Loja: compra para o token selecionado (ou o personagem do usuário). */
export async function comprar(actor, id) {
  const entrada = actor.flags?.[FLAG]?.npc?.loja?.[id];
  if (!entrada) return;
  if (int(entrada.estoque, 1) <= 0) return ui.notifications.warn("Sem estoque.");
  const comprador = (canvas?.tokens?.controlled ?? []).map(t => t.actor).find(a => a && a.uuid !== actor.uuid) ?? game.user?.character;
  if (!comprador) return ui.notifications.warn("Selecione o token de quem vai comprar.");
  if (!comprador.isOwner) return ui.notifications.warn(`Só o Mestre ou o dono de ${comprador.name} faz a compra.`);
  const { pagarMoedas, formatarMoedas } = await import("./data.mjs");
  const rel = Object.values(comprador.flags?.[FLAG]?.relacoes ?? {}).find(r => r?.uuid === actor.uuid || r?.uuid === actor.baseActor?.uuid);
  const af = rel ? int(rel.afinidade) : int(actor.flags?.[FLAG]?.npc?.afinidadeGrupo);
  const pct = descontoPorAfinidade(af);
  const base = precoEmCobre(entrada.preco);
  const custo = Math.max(0, Math.round(base * (100 + pct) / 100));
  const novas = pagarMoedas(comprador.flags?.[FLAG]?.moedas ?? {}, custo);
  if (!novas) return ui.notifications.warn(`${comprador.name} não tem ${formatarMoedas(custo)}.`);
  await comprador.update({ [`${P}.moedas`]: novas });
  await actor.update({ [`${P}.npc.loja.${id}.estoque`]: int(entrada.estoque, 1) - 1 });
  const modelo = actor.items.find(i => i.name.toLowerCase() === String(entrada.nome).toLowerCase());
  const dados = modelo ? modelo.toObject() : { name: entrada.nome || "Item", type: "loot", system: {} };
  delete dados._id;
  if (dados.system) { dados.system.quantity = 1; delete dados.system.container; }
  await comprador.createEmbeddedDocuments("Item", [dados]);
  return cartao(actor, `<p><strong>${escapar(comprador.name)}</strong> comprou <strong>${escapar(entrada.nome)}</strong> de ${escapar(actor.name)} por <strong>${formatarMoedas(custo)}</strong>${pct ? ` (${pct > 0 ? "+" : ""}${pct}% pela afinidade ${af > 0 ? "+" : ""}${af})` : ""}.</p>`, { cor: "#C9A24E" });
}

/** Criar bando: cópias do token selecionado desta criatura, com Vida rolada em cada uma. */
export async function duplicarComoGrupo(actor) {
  if (!game.user.isGM) return;
  const base = actor.isToken ? actor.baseActor ?? actor : actor;
  const tok = (canvas?.tokens?.controlled ?? []).find(t => t.document.actorId === base.id) ?? canvas?.tokens?.placeables?.find(t => t.document.actorId === base.id);
  if (!tok) return ui.notifications.warn("Ponha um token desta criatura no mapa (e selecione) para criar o bando.");
  const { DialogV2 } = foundry.applications.api;
  const qtd = await DialogV2.prompt({
    window: { title: `Criar bando: ${base.name}` }, classes: ["epm-dialogo"], rejectClose: false,
    content: `<p>Quantas cópias? ${actor.flags?.[FLAG]?.npc?.bando ? `<span class="epm-dica">(bando: ${escapar(actor.flags[FLAG].npc.bando)})</span>` : ""}</p><input type="text" name="qtd" value="${escapar(actor.flags?.[FLAG]?.npc?.bando || "3")}" autofocus style="width:100%">`,
    ok: { label: "Criar", callback: (ev, btn) => btn.form.elements.qtd.value }
  });
  if (!qtd) return;
  let n = 0;
  try { n = Math.max(1, Math.min(20, Math.round((await rolar(qtd)).total))); } catch { return ui.notifications.error("Quantidade inválida."); }
  const formula = String(base.flags?.[FLAG]?.npc?.vidaFormula ?? "").trim();
  const grade = canvas.grid?.size ?? 100;
  const copias = [];
  for (let i = 0; i < n; i++) {
    const d = tok.document.toObject();
    delete d._id;
    d.actorLink = false;
    d.x += grade * ((i % 4) + 1);
    d.y += grade * Math.floor(i / 4 + 1) * (i % 2 ? 1 : -1);
    d.name = `${tok.document.name} ${i + 2}`;
    if (formula) {
      const v = Math.max(1, Math.round((await rolar(formula)).total));
      d.delta = { ...(d.delta ?? {}), system: { attributes: { hp: { value: v, max: v } } } };
    }
    copias.push(d);
  }
  await canvas.scene.createEmbeddedDocuments("Token", copias);
  return cartao(actor, `<p>Bando de <strong>${escapar(base.name)}</strong>: +${n} no mapa${formula ? ` (Vida ${escapar(formula)} em cada)` : ""}.</p>`, { gm: true, cor: "#7DB65A" });
}

/** Forçar a próxima fase do chefe ou voltar uma. */
export async function mudarFase(actor, delta) {
  if (!game.user.isGM) return;
  const Opc = await import("./opcionais-acoes.mjs");
  const c = actor.flags?.[FLAG]?.chefe ?? {};
  const fases = Opc.lerFasesChefe(c);
  const usadas = Array.isArray(c.usadas) ? [...c.usadas] : [];
  if (int(delta) < 0) {
    if (!usadas.length) return;
    usadas.pop();
    return actor.update({ [`${P}.chefe.usadas`]: usadas }, { epmFaseChefe: true });
  }
  const i = fases.findIndex(f => !usadas.includes(f.id));
  if (i < 0) return ui.notifications.info("Não há próxima fase.");
  await actor.update({ [`${P}.chefe.usadas`]: [...usadas, fases[i].id] }, { epmFaseChefe: true });
  return Opc.aplicarFaseChefe(actor, fases[i], i + 2);
}

/** Recompensas no chat. */
export async function entregarRecompensas(actor) {
  const n = actor.flags?.[FLAG]?.npc ?? {};
  const r = n.recomp ?? {};
  const linhas = [`<li><strong>PEv</strong>: ${pevDoNd(n.nd)} (5 × ND, +2 por nível de diferença)</li>`];
  if (r.feito) linhas.push(`<li><strong>Feito</strong> “${escapar(r.feito)}”${r.titulo ? ` · título <strong>${escapar(r.titulo)}</strong>` : ""}</li>`);
  if (r.item) linhas.push(`<li><strong>Item</strong>: ${escapar(r.item)}</li>`);
  if (r.bencao) linhas.push(`<li><strong>Bênção</strong>: ${escapar(r.bencao)}</li>`);
  if (n.moedasLoot) {
    let txt = escapar(n.moedasLoot);
    try { const m = String(n.moedasLoot).trim().match(/^(.*?)\s*(PC|PP|PO|PL|DR)?$/i); txt = `${Math.round((await rolar(m[1])).total)} ${(m[2] ?? "PO").toUpperCase()}`; } catch { /* texto */ }
    linhas.push(`<li><strong>Moedas</strong>: ${txt}</li>`);
  }
  if (n.recompensas) linhas.push(`<li>${escapar(n.recompensas)}</li>`);
  return cartao(actor, `<p><strong>Recompensas: ${escapar(actor.name)}</strong></p><ul>${linhas.join("")}</ul>`, { cor: "#C9A24E" });
}

/* ---------- Barra de chefe na tela de todos ---------- */

function chefesNaBarra() {
  const comb = game.combat;
  if (!comb?.started) return [];
  return (comb.combatants ?? []).map(c => c.actor).filter(a => a && eAtorNpc(a) && tipoNpc(a.flags?.[FLAG]) === "chefe" && a.flags[FLAG].npc?.barra);
}

export function desenharBarraChefe() {
  let raiz = document.getElementById("epm-barra-chefe");
  const chefes = chefesNaBarra();
  if (!chefes.length) { raiz?.remove(); return; }
  if (!raiz) { raiz = document.createElement("div"); raiz.id = "epm-barra-chefe"; document.body.append(raiz); }
  raiz.innerHTML = chefes.map(a => {
    const hp = a.system?.attributes?.hp ?? {};
    const pct = int(hp.max) > 0 ? Math.max(0, Math.min(100, (int(hp.value) / int(hp.max)) * 100)) : 0;
    const c = a.flags[FLAG].chefe ?? {};
    const etapas = Object.entries(c.etapas ?? {}).filter(([, f]) => f).map(([id, f]) => ({ id, limiar: int(f.limiar, 50), texto: f.texto ?? "" })).sort((x, y) => y.limiar - x.limiar);
    const usadas = Array.isArray(c.usadas) ? c.usadas : [];
    const passou = etapas.filter(e => usadas.includes(e.id) || pct <= e.limiar);
    const fase = 1 + passou.length;
    const nomes = a.flags[FLAG].npc?.fasesNomes ?? {};
    const nomeFase = fase === 1 ? nomes.f1 : nomes[passou[passou.length - 1]?.id];
    const fala = fase === 1 ? (a.flags[FLAG].npc?.fase1Texto ?? "") : (passou[passou.length - 1]?.texto ?? "");
    const cor = corEscolhida(a.flags[FLAG]) || CORES_TIPO.chefe;
    return `<div class="epm-barra-chefe-item" style="--npc-ac:${cor}">
      <div class="nome">${escapar(a.token?.name ?? a.name)}</div>
      <div class="trilho"><div class="f" style="width:${pct}%"></div>${etapas.map(e => `<div class="mk" style="left:${e.limiar}%"></div>`).join("")}</div>
      <div class="rod"><span class="fase">Fase ${fase}${nomeFase ? ` · ${escapar(nomeFase)}` : ""}</span>${a.flags[FLAG].npc?.barraNumeros ? `<span>${int(hp.value)} / ${int(hp.max)}</span>` : ""}</div>
      ${fala ? `<div class="fala">“${escapar(fala)}”</div>` : ""}
    </div>`;
  }).join("");
}

export function registrarBarraChefe() {
  const redesenhar = () => { try { desenharBarraChefe(); } catch (err) { console.warn("EPM | barra de chefe", err); } };
  for (const g of ["updateActor", "updateCombat", "createCombat", "deleteCombat", "createCombatant", "deleteCombatant", "updateToken", "canvasReady"]) Hooks.on(g, redesenhar);
  Hooks.once("ready", redesenhar);
}

/* ---------- Gerar variação (NPC Comum) ---------- */
const NOMES_VAR = ["Bartho", "Sima", "Joran", "Mirelle", "Tavo", "Ilsa", "Corvin", "Neda", "Rufo", "Lisandra", "Okar", "Vera", "Doran", "Pimm", "Talia", "Breno", "Yssa", "Gaspar", "Lune", "Hamir"];
const SOBRENOMES_VAR = ["Venn", "Tolle", "Marr", "Quill", "Sorn", "Achet", "Bramm", "Dusk", "Ferro", "Lago", "Pardo", "Ruiva", "Sálvia", "Torres", "Ulm"];
const JEITOS_VAR = ["fala olhando para os lados, nunca para quem pergunta", "ri alto de tudo, até do que não tem graça", "mastiga alguma coisa o tempo inteiro", "repete a última palavra de quem fala com ele",
  "conta dinheiro enquanto conversa", "desconfia de quem é educado demais", "sempre pede um favor antes de ajudar", "fala baixo e obriga todo mundo a chegar perto",
  "cita ditados que ninguém conhece", "coça a cicatriz da mão quando mente"];
const sortear = l => l[Math.floor(Math.random() * l.length)];

/** Nome, Vida e jeito novos para os tokens selecionados desta criatura (ou para esta ficha, se for de um token). */
export async function gerarVariacao(actor) {
  if (!game.user.isGM) return;
  const base = actor.isToken ? actor.baseActor ?? actor : actor;
  let alvos = (canvas?.tokens?.controlled ?? []).filter(t => t.document.actorId === base.id && !t.document.actorLink).map(t => t.actor);
  if (!alvos.length && actor.isToken) alvos = [actor];
  if (!alvos.length) return ui.notifications.warn("Selecione no mapa os tokens (não vinculados) deste NPC.");
  const formula = String(base.flags?.[FLAG]?.npc?.vidaFormula ?? "").trim();
  const linhas = [];
  for (const a of alvos) {
    const nome = `${sortear(NOMES_VAR)} ${sortear(SOBRENOMES_VAR)}`;
    const jeito = sortear(JEITOS_VAR);
    const upd = { [`${P}.npc.interp.jeito`]: `${jeito[0].toUpperCase()}${jeito.slice(1)}.` };
    if (formula) { const v = Math.max(1, Math.round((await rolar(formula)).total)); upd["system.attributes.hp.value"] = v; upd["system.attributes.hp.max"] = v; }
    await a.update(upd);
    await a.token?.update({ name: nome });
    linhas.push(`<li><strong>${escapar(nome)}</strong>: ${escapar(jeito)}${formula ? ` · ${upd["system.attributes.hp.max"]} PV` : ""}</li>`);
  }
  return cartao(actor, `<p><strong>Variações de ${escapar(base.name)}</strong></p><ul>${linhas.join("")}</ul>`, { gm: true, cor: "#6FA8A0" });
}
