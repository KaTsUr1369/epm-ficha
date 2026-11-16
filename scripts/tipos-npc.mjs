/**
 * 0.8.10: Tipos de ficha de NPC (NPC Importante, NPC Comum, Monstro, Monstro Forte, Chefe).
 * Só para atores "npc". A aba "Ficha do Mestre" (id "npc") é só do Mestre; o tipo decide quais abas
 * aparecem por padrão (o Mestre ainda pode mostrar ou esconder cada uma em Personalizar).
 * Dados em flags["epm-ficha"].npc.
 */
import { FLAG, ABAS } from "./config.mjs";
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
  if (!eAtorNpc(actor) || !isGM) return null;
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
    funcao: n.funcao ?? "", disposicao: n.disposicao ?? "", categoria: n.categoria ?? "", tamanho: n.tamanho ?? "", habitat: n.habitat ?? "",
    disposicoes: DISPOSICOES.map(d => ({ v: d, sel: d === n.disposicao })),
    tamanhos: TAMANHOS.map(d => ({ v: d, sel: d === n.tamanho })),
    vidaFormula: n.vidaFormula ?? "",
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
      pericia: n.conhecimento?.pericia ?? "Investigação",
      niveis: lista(n.conhecimento?.niveis, c => ({ dt: int(c.dt, 10), revela: c.revela ?? "" })).sort((a, b) => a.dt - b.dt)
    },
    lacaios: lista(n.lacaios, l => ({ nome: l.nome ?? "", qtd: l.qtd ?? "1", nota: l.nota ?? "" })),
    recargas: lista(n.recargas, r => ({ nome: r.nome ?? "", min: Math.max(2, Math.min(6, int(r.min, 5))), pronta: r.pronta !== false })),
    tenacidade: contador(n.tenacidade?.usada, n.tenacidade?.max ?? (nv >= 3 ? 3 : 2)),
    resistLendaria: contador(n.resistLendaria?.usada, n.resistLendaria?.max ?? 3),
    lendarias: int(acoes.lendaria?.max), miticas: int(acoes.mitica?.max), arcaicas: int(acoes.arcaica?.max),
    covil: { ativo: !!n.covil?.ativo, entradas: lista(n.covil?.entradas, c => ({ texto: c.texto ?? "" })).map((c, i) => ({ ...c, n: i + 1 })) },
    vitoria: { texto: n.vitoria?.texto ?? "", meta: Math.max(1, int(n.vitoria?.meta, 3)), sucessos: Math.max(0, int(n.vitoria?.sucessos)), falhas: Math.max(0, int(n.vitoria?.falhas)) },
    recompensas: n.recompensas ?? "",
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
  "covil.entradas": () => ({ texto: "" })
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
  Hooks.on("updateActor", (ator, mudancas, opcoes) => {
    if (!eAtorNpc(ator) || !foundry.utils.hasProperty(mudancas, "system.attributes.hp")) return;
    verificarMoral(ator, opcoes).catch(err => console.warn("EPM | moral", err));
  });
  Hooks.on("deleteCombat", c => { fimDeCombateNpc(c).catch(err => console.warn("EPM | fim de combate (NPC)", err)); });
  Hooks.on("updateCombat", (c, m) => { turnoNpc(c, m).catch(err => console.warn("EPM | turno (NPC)", err)); });
}
