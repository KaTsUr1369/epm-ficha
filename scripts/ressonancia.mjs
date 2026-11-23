/**
 * Ressonância de Alma: almas registradas, Conversa (1×/semana), Troca de lugar (1×/mês, com Relíquia),
 * Manifestação involuntária, Ritual do Vazio e Guardião Ancestral.
 *
 * Tudo fica em flags.epm-ficha.ressonancia:
 *   almas.<id>      { nome, img, origem, personalidade, conhecimento, ator (uuid), reliquia (id do item), revelada, criado, guardiao }
 *   usos.<tipo>     { chave (período do calendário), usado, quando, alma }   tipo = conversa | troca
 *   troca           { alma, inicio, fim, combate, backup: { atributos, pericias, itens, maximos } }
 *   manifestacao    { alma, gatilho, inicio, fim, combate, rodadaFim, tentou }
 *   ritual          { alma, recompensa, etapa (memorias | aprovar), memorias, recusa }
 *   bonus.<id>      { tipo (mod | vantagem | texto), alvo, valor, pericia, texto, nome, alma }
 *   idiomas         [nomes vindos da Ressonância: não podem ser esquecidos]
 *   esquecidas.<id> { tipo, ref, rotulo, conteudo, antes, quando, alma }   (o conteúdo só o Mestre vê)
 *   rituais.<id>    { alma, quando, recompensa, memorias }
 *   bloqueio        texto: bloqueio manual do Mestre (maldição etc.)
 */
import { FLAG, alvosModificador, UNIDADES_TEMPO, REVELACOES } from "./config.mjs";
import { int, num, novoId } from "./data.mjs";
import { escapar } from "./helpers.mjs";
import { TREINAMENTOS_NOTION } from "./catalogos.mjs";

const P = `flags.${FLAG}`;
const R = `${P}.ressonancia`;
export const DT_CALAR = 20;
export const LIMITE_SANIDADE = 25;
const SEG_HORA = 3600;
const SEG_MINUTO = 60;
const RODADAS_MANIFESTACAO = 10;
const TIPOS_HABILIDADE = ["feat", "spell"];
const CONDICOES_BLOQUEIO = ["epm-vinculo-quebrado", "epm-apagamento", "epm-ruptura-espiritual"];
const CAMPOS_BACKGROUND = REVELACOES.filter(r => ["personalidade", "objetivos", "medos", "historia", "outros"].includes(r.id));
const IMG_PADRAO = "icons/svg/mystery-man.svg";
const COR = "#7FB3E0";

const mec = () => import("./mecanicas.mjs");
const mun = () => import("./mundo.mjs");
const agora = () => Number(globalThis.game?.time?.worldTime) || 0;
const opcoesHtml = (lista, atual = "") => lista.map(([v, l]) => `<option value="${escapar(v)}" ${String(v) === String(atual) ? "selected" : ""}>${escapar(l)}</option>`).join("");

/* -------------------------------------------- */
/*  Leitura                                     */
/* -------------------------------------------- */

export const lerRessonancia = actor => actor?.flags?.[FLAG]?.ressonancia ?? {};

export function listaAlmas(res, { todas = true } = {}) {
  return Object.entries(res?.almas ?? {}).filter(([, a]) => a && typeof a === "object")
    .map(([id, a]) => ({ id, ...a }))
    .filter(a => todas || a.revelada)
    .sort((a, b) => num(a.criado) - num(b.criado));
}

/** Período do Simple Calendar ("s:…" semana, "m:…" mês). Sem calendário: null (o Mestre recarrega no Escudo). */
export function chavePeriodo(tipo) {
  const api = globalThis.SimpleCalendar?.api;
  if (!api?.timestampToDate) return null;
  try {
    const ts = Number(api.timestamp?.() ?? agora()) || 0;
    const d = api.timestampToDate(ts);
    if (!d) return null;
    if (tipo === "mes") return `m:${d.year}-${d.month}`;
    const segDia = Math.max(1, Number(api.timestampPlusInterval?.(0, { day: 1 })) || 86400);
    const diaAbs = Math.floor(ts / segDia);
    return `s:${diaAbs - (int(d.dayOfTheWeek) || 0)}`;
  } catch { return null; }
}

const PERIODO = { conversa: "semana", troca: "mes" };
export function estadoUso(res, tipo) {
  const u = res?.usos?.[tipo] ?? {};
  const periodo = chavePeriodo(PERIODO[tipo]);
  const usado = periodo ? u.chave === periodo : !!u.usado;
  return { usado, calendario: !!periodo, periodo };
}

/** Condições e maldições que bloqueiam a alma (e com ela a Ressonância). */
export function bloqueiosRessonancia(actor, ficha = null) {
  const motivos = [];
  const ativos = new Set([...(actor?.statuses ?? []), ...(ficha?.condicoesAtivas ?? []).map(c => c.id)]);
  for (const id of CONDICOES_BLOQUEIO) {
    if (!ativos.has(id)) continue;
    const c = (ficha?.condicoes ?? []).find(x => x.id === id);
    motivos.push(c?.label ?? id.replace(/^epm-/, "").replace(/-/g, " "));
  }
  for (const x of ficha?.bencaos ?? []) {
    if (x.tipo !== "maldicao" || !x.ativo) continue;
    const b = x.b ?? {};
    const texto = `${b.nome ?? ""} ${b.efeito ?? ""} ${b.descricao ?? ""}`;
    if (b.bloqueiaAlma || /ressonân|bloque\w*[^.]{0,40}\balmas?\b|\balmas?\b[^.]{0,40}bloque/i.test(texto)) motivos.push(b.nome || "Maldição");
  }
  const manual = String(lerRessonancia(actor).bloqueio ?? "").trim();
  if (manual) motivos.push(manual);
  return [...new Set(motivos)];
}

/** Item que é a Relíquia daquela alma (no inventário ou numa mochila). */
export function reliquiaDe(actor, alma) {
  const itens = actor?.items?.contents ?? actor?.items ?? [];
  return itens.find(i => (alma?.reliquia && i.id === alma.reliquia) || i.flags?.[FLAG]?.reliquiaAlma === alma?.id) ?? null;
}

export function atorDaAlma(alma) {
  if (!alma?.ator) return null;
  try { return globalThis.fromUuidSync?.(alma.ator) ?? null; } catch { return null; }
}

/* -------------------------------------------- */
/*  Contexto da aba                             */
/* -------------------------------------------- */

function idiomasLista(actor) {
  const langs = actor?.system?.traits?.languages ?? {};
  const valor = langs.value instanceof Set ? [...langs.value] : (Array.isArray(langs.value) ? langs.value : []);
  const custom = String(langs.custom ?? "").split(";").map(t => t.trim()).filter(Boolean);
  let mapa = {};
  try { mapa = Object.fromEntries((globalThis.game?.polyglot?.languageProvider?.languages ? Object.entries(game.polyglot.languageProvider.languages).map(([k, l]) => [k, l?.label ?? k]) : [])); } catch { mapa = {}; }
  const dnd = globalThis.CONFIG?.DND5E?.languages ?? {};
  const rotuloDnd = k => { for (const g of Object.values(dnd)) { if (g?.children?.[k]) return g.children[k]?.label ?? g.children[k]; } return dnd[k]?.label ?? (typeof dnd[k] === "string" ? dnd[k] : ""); };
  return [
    ...valor.map(k => ({ chave: k, rotulo: mapa[k] || rotuloDnd(k) || k })),
    ...custom.map(c => ({ chave: "", rotulo: c }))
  ];
}

const textoLimpo = html => String(html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/** Memórias que o personagem pode esquecer num ritual. */
export function memoriasDisponiveis(actor) {
  const d = actor?.flags?.[FLAG] ?? {};
  const res = d.ressonancia ?? {};
  const daRes = new Set((res.idiomas ?? []).map(x => String(x).toLowerCase()));
  const out = [];
  for (const i of idiomasLista(actor)) {
    if (daRes.has(i.rotulo.toLowerCase())) continue;
    out.push({ valor: `idioma|${i.chave}|${i.rotulo}`, tipo: "idioma", rotulo: `Idioma: ${i.rotulo}` });
  }
  for (const [id, r] of Object.entries(d.relacoes ?? {})) {
    if (!r) continue;
    const nome = r.nome || atorRelacao(r)?.name || "Relação";
    out.push({ valor: `relacao|${id}`, tipo: "relacao", rotulo: `Relação: ${nome} (afinidade ${int(r.afinidade)})` });
  }
  for (const c of CAMPOS_BACKGROUND) {
    const t = textoLimpo(d.sobre?.[c.id]);
    if (t) out.push({ valor: `background|${c.id}`, tipo: "background", rotulo: `Background: ${c.label}`, previa: t.slice(0, 80) });
  }
  for (const [id, t] of Object.entries(d.treinamentos ?? {})) {
    if (!t || t.estado !== "concluido" || t.ressonancia) continue;
    out.push({ valor: `treino|${id}`, tipo: "treino", rotulo: `Treinamento: ${t.nome || "sem nome"}` });
  }
  return out;
}
function atorRelacao(r) { try { return r?.uuid ? fromUuidSync(r.uuid) : null; } catch { return null; } }

const ROTULO_TIPO_RECOMPENSA = { item: "Relíquia (item)", bonus: "Bônus permanente", idioma: "Idioma", treino: "Treinamento" };
export function textoRecompensa(rec = {}) {
  if (rec.tipo === "item") return `Relíquia: ${rec.nome || "item"}`;
  if (rec.tipo === "idioma") return `Idioma: ${rec.idioma || "?"}`;
  if (rec.tipo === "treino") return `Treinamento: ${rec.nome || "?"}`;
  if (rec.tipo === "bonus") return `Bônus: ${textoBonus(rec)}`;
  return "—";
}
function textoBonus(b = {}) {
  if (b.modo === "vantagem" || b.tipo === "vantagem") return `vantagem em ${b.periciaNome || (b.pericia === "testes" ? "todos os testes" : b.pericia || "?")}`;
  if (b.modo === "texto" || b.tipo === "texto") return b.texto || "efeito narrativo";
  const v = num(b.valor);
  return `${v >= 0 ? "+" : ""}${v} em ${b.alvoNome || b.alvo || "?"}`;
}

export function contextoAlmas({ actor, dados, ficha, isGM, edicao, editavel }) {
  const res = dados?.ressonancia ?? {};
  const bloqueios = bloqueiosRessonancia(actor, ficha);
  const bloqueado = bloqueios.length > 0;
  const conversa = estadoUso(res, "conversa");
  const troca = estadoUso(res, "troca");
  const trocaAtiva = res.troca?.alma ? res.troca : null;
  const manif = res.manifestacao?.alma ? res.manifestacao : null;
  const todas = listaAlmas(res);
  const atoresMundo = isGM && edicao ? [...(globalThis.game?.actors ?? [])].filter(a => a.id !== actor.id).map(a => ({ uuid: a.uuid, nome: a.name })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")) : [];
  const itensInv = isGM && edicao ? (actor.items?.contents ?? actor.items ?? []).filter(i => !TIPOS_HABILIDADE.includes(i.type)).map(i => ({ id: i.id, nome: i.name })) : [];
  const almas = todas.filter(a => isGM || a.revelada).map(a => {
    const alvo = atorDaAlma(a);
    const rel = reliquiaDe(actor, a);
    return {
      ...a, img: a.img || alvo?.img || IMG_PADRAO, nome: a.nome || alvo?.name || "Alma sem nome",
      nomeBruto: a.nome ?? "", ficha: alvo ? { nome: alvo.name, uuid: alvo.uuid } : null, reliquiaItem: rel ? { id: rel.id, nome: rel.name, img: rel.img } : null,
      podeConversar: editavel && !bloqueado && !conversa.usado && !!a.revelada,
      podeTrocar: editavel && !bloqueado && !troca.usado && !trocaAtiva && !!a.revelada && !!rel && !!alvo,
      motivoSemTroca: !rel ? "Precisa da Relíquia desta alma no inventário." : !alvo ? "O Mestre ainda não ligou a ficha desta alma." : troca.usado ? "Já trocou de lugar este mês." : "",
      guardiaoAtivo: !!a.guardiao?.token, noControle: trocaAtiva?.alma === a.id, falando: manif?.alma === a.id,
      atores: atoresMundo.map(x => ({ ...x, selected: x.uuid === a.ator })),
      itens: itensInv.map(x => ({ ...x, selected: x.id === a.reliquia }))
    };
  });
  const nomeAlma = id => { const a = res.almas?.[id]; return a?.nome || atorDaAlma(a)?.name || "Uma alma"; };
  const memoriasRitual = (res.ritual?.memorias ?? []).map(m => m.rotulo + (m.trecho ? ` (trecho: "${String(m.trecho).slice(0, 40)}")` : ""));
  const esquecidas = Object.entries(res.esquecidas ?? {}).filter(([, e]) => e).map(([id, e]) => ({
    id, ...e, rotuloJogador: e.tipo === "background" ? `Um trecho de ${e.rotulo}` : e.rotulo,
    conteudoTexto: isGM ? textoLimpo(e.conteudo) : ""
  })).sort((a, b) => num(b.quando) - num(a.quando));
  const bonus = Object.entries(res.bonus ?? {}).filter(([, b]) => b).map(([id, b]) => ({ id, texto: textoBonus(b), nome: b.nome || "", alma: nomeAlma(b.alma) }));
  return {
    almas, temAlmas: almas.length > 0, bloqueado, bloqueios: bloqueios.join(", "), bloqueioManual: res.bloqueio ?? "",
    conversa, troca, calendario: conversa.calendario,
    trocaAtiva: trocaAtiva ? {
      alma: nomeAlma(trocaAtiva.alma), emCombate: !!trocaAtiva.combate,
      termina: trocaAtiva.combate ? "no fim do combate" : trocaAtiva.fim ? `em ${Math.max(0, Math.ceil((num(trocaAtiva.fim) - agora()) / SEG_MINUTO))} min de jogo` : "quando o Mestre encerrar"
    } : null,
    manifestacao: manif ? {
      alma: nomeAlma(manif.alma), gatilho: manif.gatilho ?? "", tentou: !!manif.tentou,
      termina: manif.rodadaFim ? `até a rodada ${manif.rodadaFim}` : `por cerca de 1 minuto`
    } : null,
    ritual: res.ritual?.etapa ? {
      etapa: res.ritual.etapa, escolhendo: res.ritual.etapa === "memorias", aprovando: res.ritual.etapa === "aprovar",
      alma: nomeAlma(res.ritual.alma), recompensa: textoRecompensa(res.ritual.recompensa), memorias: memoriasRitual, recusa: res.ritual.recusa ?? ""
    } : null,
    bonus, temBonus: bonus.length > 0, idiomas: res.idiomas ?? [],
    esquecidas, temEsquecidas: esquecidas.length > 0,
    rituais: Object.entries(res.rituais ?? {}).filter(([, r]) => r).map(([id, r]) => ({ id, alma: nomeAlma(r.alma), recompensa: r.recompensa, memorias: isGM ? (r.memorias ?? []).join("; ") : `${(r.memorias ?? []).length} memória(s) esquecida(s)` })).sort((a, b) => b.id.localeCompare(a.id)),
    temRevelada: todas.some(a => a.revelada)
  };
}

/** Fontes de bônus dos rituais (entram em fontesDaFicha). */
export function bonusDaRessonancia(d) {
  const out = { mods: [], vantagensPericia: [], vantagemTestes: [] };
  const res = d?.ressonancia ?? {};
  for (const b of Object.values(res.bonus ?? {})) {
    if (!b) continue;
    const fonte = `Ressonância${b.nome ? `: ${b.nome}` : ""}`;
    if (b.tipo === "mod" && b.alvo && num(b.valor)) out.mods.push({ alvo: b.alvo, valor: num(b.valor), fonte });
    else if (b.tipo === "vantagem" && b.pericia === "testes") out.vantagemTestes.push(fonte);
    else if (b.tipo === "vantagem" && b.pericia) out.vantagensPericia.push({ pericia: b.pericia, fonte });
  }
  return out;
}

/* -------------------------------------------- */
/*  Chat                                        */
/* -------------------------------------------- */

const destinatarios = actor => [...(globalThis.game?.users ?? [])].filter(u => u.isGM || actor?.testUserPermission?.(u, "OWNER")).map(u => u.id);

function cartaoAlma(actor, alma, { titulo, sub = "", corpo = "", botoes = "", cor = COR, sussurro = false, flags = {} } = {}) {
  const img = escapar(alma?.img || atorDaAlma(alma)?.img || IMG_PADRAO);
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    ...(sussurro ? { whisper: destinatarios(actor) } : {}),
    flags: { [FLAG]: { ressonancia: true, ...flags } },
    content: `<div class="epm-chat epm-chat-alma" data-actor-uuid="${escapar(actor.uuid)}" style="--epm-cor-cartao:${cor}">
      <header class="epm-chat-topo"><img src="${img}" alt=""><div class="epm-chat-titulos"><h3>${escapar(titulo)}</h3>${sub ? `<span class="epm-chat-sub">${escapar(sub)}</span>` : ""}</div></header>
      ${corpo}${botoes ? `<div class="epm-chat-botoes">${botoes}</div>` : ""}
    </div>`
  });
}

/* -------------------------------------------- */
/*  Mestre: criar, editar e revelar almas       */
/* -------------------------------------------- */

export async function novaAlma(actor) {
  if (!game.user?.isGM) return ui.notifications.warn("Só o Mestre cria almas.");
  const id = novoId();
  const primeira = !listaAlmas(lerRessonancia(actor)).length;
  await actor.update({ [`${R}.almas.${id}`]: { nome: "", img: "", origem: "", personalidade: "", conhecimento: "", ator: "", reliquia: "", revelada: false, criado: Date.now() } });
  if (primeira) ui.notifications.info("Alma criada (oculta para o jogador até você revelar). O personagem começa conhecendo só uma.");
  return id;
}

export async function revelarAlma(actor, id) {
  if (!game.user?.isGM) return;
  const a = lerRessonancia(actor).almas?.[id];
  if (!a) return;
  await actor.update({ [`${R}.almas.${id}.revelada`]: !a.revelada });
  if (!a.revelada) await cartaoAlma(actor, { ...a, id }, { titulo: "Uma alma desperta", sub: `${actor.name} sente outra vida ecoar`, corpo: `<p><strong>${escapar(a.nome || "Uma alma")}</strong>${a.origem ? `, de ${escapar(a.origem)}` : ""}.</p>`, sussurro: true });
}

export async function excluirAlma(actor, id) {
  if (!game.user?.isGM) return;
  const a = lerRessonancia(actor).almas?.[id];
  if (!a) return;
  const { confirmar } = await mec();
  if (!(await confirmar("Excluir alma", `<p>Excluir <strong>${escapar(a.nome || "esta alma")}</strong> da Ressonância?</p>`))) return;
  if (a.guardiao?.token) await dispensarGuardiao(actor, id, { silencioso: true });
  await actor.update({ [`${R}.almas.-=${id}`]: null });
}

export async function imagemAlma(actor, id) {
  if (!game.user?.isGM) return;
  const { escolherImagem } = await import("./imagens.mjs");
  const atual = lerRessonancia(actor).almas?.[id]?.img ?? "";
  const caminho = await escolherImagem({ atual, titulo: "Imagem da alma", forma: "circulo" });
  if (caminho) await actor.update({ [`${R}.almas.${id}.img`]: caminho });
}

export async function recarregarUsos(actor, { silencioso = false } = {}) {
  if (!game.user?.isGM) return;
  await actor.update({ [`${R}.usos`]: { conversa: {}, troca: {} } });
  if (!silencioso) ui.notifications.info(`Ressonância de ${actor.name}: Conversa e Troca liberadas.`);
}

/** Escudo: recarrega a Ressonância de todos os personagens dos jogadores. */
export async function recarregarTodos() {
  if (!game.user?.isGM) return;
  const lista = game.actors.filter(a => a.type === "character" && listaAlmas(lerRessonancia(a)).length);
  for (const a of lista) await recarregarUsos(a, { silencioso: true });
  ui.notifications.info(lista.length ? `Ressonância recarregada: ${lista.map(a => a.name).join(", ")}.` : "Nenhum personagem com almas registradas.");
  return lista.length;
}

/* -------------------------------------------- */
/*  1. Conversa                                 */
/* -------------------------------------------- */

function checarBloqueio(actor) {
  const { estadoAtor } = globalThis.__epmMec ?? {};
  let ficha = null;
  try { ficha = estadoAtor?.(actor)?.ficha ?? null; } catch { ficha = null; }
  const b = bloqueiosRessonancia(actor, ficha);
  if (b.length) { ui.notifications.warn(`A Ressonância está bloqueada: ${b.join(", ")}.`); return true; }
  return false;
}

export async function conversar(actor, id) {
  const res = lerRessonancia(actor);
  const alma = res.almas?.[id];
  if (!alma?.revelada && !game.user?.isGM) return;
  if (!alma) return;
  await prepararMec();
  if (checarBloqueio(actor)) return;
  const uso = estadoUso(res, "conversa");
  if (uso.usado) {
    if (!game.user?.isGM) return ui.notifications.warn("A Conversa desta semana já foi usada (não acumula).");
    const { confirmar } = await mec();
    if (!(await confirmar("Conversa já usada", "<p>A Conversa desta semana já foi usada. Usar de novo mesmo assim?</p>"))) return;
  }
  const { formulario } = await mun();
  const r = await formulario(`Conversar com ${alma.nome || "a alma"}`, `
    <p class="epm-dica">A alma responde a uma pergunta dentro da área de conhecimento dela${alma.conhecimento ? ` (<strong>${escapar(alma.conhecimento)}</strong>)` : ""}.
    A resposta pode vir incompleta ou enviesada pela personalidade dela. Sem teste; usa a Conversa da semana.</p>
    <label class="epm-campo"><span>Pergunta</span><textarea name="pergunta" rows="4" placeholder="O que você quer saber?"></textarea></label>`, { botao: "Chamar a alma" });
  const pergunta = String(r?.pergunta ?? "").trim();
  if (!pergunta) return;
  await actor.update({ [`${R}.usos.conversa`]: { chave: uso.periodo ?? "", usado: true, quando: agora(), alma: id } });
  return cartaoAlma(actor, { ...alma, id }, {
    titulo: "Conversa com outra vida", sub: `${actor.name} chama ${alma.nome || "uma alma"}`, sussurro: true,
    corpo: `${alma.conhecimento ? `<p class="epm-dica">Área de conhecimento: ${escapar(alma.conhecimento)}${alma.personalidade ? ` · Personalidade: ${escapar(alma.personalidade)}` : ""}</p>` : ""}
      <p class="epm-chat-texto"><strong>Pergunta:</strong> ${escapar(pergunta)}</p>`,
    botoes: `<button type="button" class="epm-so-mestre" data-epm-action="almaResponder"><i class="fa-solid fa-comment-dots" aria-hidden="true"></i> Responder como ${escapar(alma.nome || "a alma")}</button>`,
    flags: { alma: { id, pergunta } }
  });
}

/* -------------------------------------------- */
/*  2. Troca de lugar                           */
/* -------------------------------------------- */

export async function trocarDeLugar(actor, id) {
  const res = lerRessonancia(actor);
  const alma = res.almas?.[id];
  if (!alma || (!alma.revelada && !game.user?.isGM)) return;
  await prepararMec();
  if (checarBloqueio(actor)) return;
  if (res.troca?.alma) return ui.notifications.warn("Já existe uma troca de lugar em andamento.");
  if (!reliquiaDe(actor, { ...alma, id })) return ui.notifications.warn("Precisa da Relíquia de Alma desta alma no inventário (mochila conta).");
  if (!alma.ator) return ui.notifications.warn("O Mestre ainda não ligou a ficha desta alma.");
  if (estadoUso(res, "troca").usado) return ui.notifications.warn("A Troca de lugar deste mês já foi usada (não acumula).");
  const emCombate = combateDoAtor(actor);
  const { confirmar } = await mec();
  if (!(await confirmar("Trocar de lugar", `<p><strong>${escapar(alma.nome || "A alma")}</strong> assume o corpo de ${escapar(actor.name)}
    ${emCombate ? "até o <strong>fim do combate</strong>" : "por <strong>1 hora</strong>"}.</p>
    <p class="epm-dica">A ficha passa a usar os atributos, perícias, habilidades e ataques da alma. Vida, Mana, Estamina e condições continuam as do corpo.
    Ao terminar, volta tudo e o personagem ganha 1 nível de Exaustão. Ele não lembra do que a alma fez, só da sensação de ter feito.</p>`))) return;
  const { pedirAoMestre } = await mun();
  return pedirAoMestre("ressonancia", { acao: "trocar", ator: actor.uuid, alma: id });
}

function combateDoAtor(actor) {
  const c = globalThis.game?.combat;
  if (!c?.started && !c?.round) return null;
  const lista = c.combatants?.contents ?? c.combatants ?? [];
  return [...lista].some(x => x.actorId === actor.id || x.actor?.id === actor.id) ? c : null;
}

/** Roda no Mestre: troca atributos, perícias, habilidades e ataques pelos da alma. */
export async function iniciarTroca(actor, id) {
  const res = lerRessonancia(actor);
  const alma = res.almas?.[id];
  if (!alma || res.troca?.alma) return null;
  const alvo = alma.ator ? await fromUuid(alma.ator) : null;
  if (!alvo) { ui.notifications.warn("Não encontrei a ficha da alma."); return null; }
  const { estadoAtor } = await mec();
  const { ficha } = estadoAtor(actor);
  const fl = actor.flags?.[FLAG] ?? {};
  const fa = alvo.flags?.[FLAG] ?? {};
  const itensCorpo = (actor.items?.contents ?? actor.items ?? []).filter(i => TIPOS_HABILIDADE.includes(i.type) && !i.flags?.[FLAG]?.almaTemporario);
  const guardados = itensCorpo.map(i => i.toObject());
  const novos = (alvo.items?.contents ?? alvo.items ?? []).filter(i => [...TIPOS_HABILIDADE, "weapon"].includes(i.type)).map(i => {
    const o = i.toObject();
    delete o._id;
    o.flags = { ...(o.flags ?? {}), [FLAG]: { ...(o.flags?.[FLAG] ?? {}), almaTemporario: id } };
    return o;
  });
  const maximos = Object.fromEntries(["pv", "pm", "pe"].map(r => [r, num(ficha.recursos?.[r]?.max) - num(ficha.recursos?.[r]?.mod)]));
  const emCombate = combateDoAtor(actor);
  const troca = {
    alma: id, inicio: agora(), fim: emCombate ? 0 : agora() + SEG_HORA, combate: emCombate?.id ?? "",
    backup: { atributos: foundry.utils.deepClone(fl.atributos ?? {}), pericias: foundry.utils.deepClone(fl.pericias ?? {}), itens: guardados, maximos }
  };
  const usaFicha = !!(fa.atributos || fa.pericias);
  await actor.update({ [`${P}.-=atributos`]: null, [`${P}.-=pericias`]: null }, { render: false });
  await actor.update({
    [`${P}.atributos`]: foundry.utils.deepClone(fa.atributos ?? fl.atributos ?? {}),
    [`${P}.pericias`]: foundry.utils.deepClone(fa.pericias ?? fl.pericias ?? {}),
    [`${R}.troca`]: troca,
    [`${R}.usos.troca`]: { chave: chavePeriodo("mes") ?? "", usado: true, quando: agora(), alma: id }
  });
  if (itensCorpo.length) await actor.deleteEmbeddedDocuments("Item", itensCorpo.map(i => i.id));
  if (novos.length) await actor.createEmbeddedDocuments("Item", novos);
  await cartaoAlma(actor, { ...alma, id, img: alma.img || alvo.img }, {
    titulo: "Troca de lugar", sub: `${alma.nome || alvo.name} assume o corpo de ${actor.name}`,
    corpo: `<p>Dura ${emCombate ? "até o fim do combate" : "1 hora de jogo"}. Atributos, perícias, habilidades e ataques são os de ${escapar(alma.nome || alvo.name)}; Vida, Mana, Estamina e condições continuam as do corpo.</p>
      ${usaFicha ? "" : `<p class="epm-dica">A ficha ligada não é do EPM: os atributos e perícias do corpo continuam.</p>`}`
  });
  return troca;
}

/** Fim da troca: volta tudo e aplica +1 de Exaustão. */
export async function encerrarTroca(actor, { motivo = "" } = {}) {
  const res = lerRessonancia(actor);
  const troca = res.troca;
  if (!troca?.alma) return null;
  const b = troca.backup ?? {};
  const alma = res.almas?.[troca.alma] ?? {};
  await actor.update({ [`${P}.-=atributos`]: null, [`${P}.-=pericias`]: null }, { render: false });
  await actor.update({ [`${P}.atributos`]: b.atributos ?? {}, [`${P}.pericias`]: b.pericias ?? {}, [`${R}.-=troca`]: null });
  const temp = (actor.items?.contents ?? actor.items ?? []).filter(i => i.flags?.[FLAG]?.almaTemporario).map(i => i.id);
  if (temp.length) await actor.deleteEmbeddedDocuments("Item", temp);
  const recriar = (b.itens ?? []).filter(o => o?._id && !actor.items.get(o._id));
  if (recriar.length) await actor.createEmbeddedDocuments("Item", recriar, { keepId: true });
  const { definirExaustao } = await mec();
  const antes = int(actor.flags?.[FLAG]?.exaustao);
  const nova = await definirExaustao(actor, antes + 1);
  await cartaoAlma(actor, { ...alma, id: troca.alma }, {
    titulo: "Fim da troca", sub: `${actor.name} volta ao próprio corpo${motivo ? ` (${motivo})` : ""}`,
    corpo: `<p>Não lembra do que ${escapar(alma.nome || "a alma")} fez, só fica com a sensação de ter feito.</p>
      <p><strong>${nova === null ? "Exaustão não aplicada (cancelada na confirmação)" : `+1 de Exaustão (agora ${nova})`}</strong></p>`
  });
  return true;
}

/* -------------------------------------------- */
/*  3. Manifestação involuntária                */
/* -------------------------------------------- */

export async function manifestar(actor, { alma: almaId = "", gatilho = "", forcar = false } = {}) {
  const res = lerRessonancia(actor);
  if (res.manifestacao?.alma && !forcar) return null;
  const reveladas = listaAlmas(res, { todas: false });
  const candidatas = almaId ? listaAlmas(res).filter(a => a.id === almaId) : reveladas;
  if (!candidatas.length) return null;
  await prepararMec();
  let ficha = null;
  try { ficha = globalThis.__epmMec.estadoAtor(actor).ficha; } catch { ficha = null; }
  if (bloqueiosRessonancia(actor, ficha).length) return null;
  const alma = candidatas[Math.floor(Math.random() * candidatas.length)];
  const c = combateDoAtor(actor);
  const m = {
    alma: alma.id, gatilho, inicio: agora(), tentou: false,
    fim: c ? 0 : agora() + SEG_MINUTO, combate: c?.id ?? "", rodadaFim: c ? int(c.round) + RODADAS_MANIFESTACAO : 0
  };
  await actor.update({ [`${R}.manifestacao`]: m });
  await cartaoAlma(actor, alma, {
    titulo: `${alma.nome || "Uma alma"} fala através de ${actor.name}`, sub: gatilho ? `Gatilho: ${gatilho}` : "Manifestação involuntária", cor: "#C77DFF",
    corpo: `<p>A alma toma a voz de ${escapar(actor.name)} por ${c ? `${RODADAS_MANIFESTACAO} rodadas (até a rodada ${m.rodadaFim})` : "cerca de 1 minuto"}.
      Ela <strong>só pode falar</strong>: não age, não ataca e não usa habilidades.</p>
      ${alma.personalidade ? `<p class="epm-dica">Personalidade: ${escapar(alma.personalidade)}</p>` : ""}`,
    botoes: `<button type="button" data-epm-action="almaCalar"><i class="fa-solid fa-hand" aria-hidden="true"></i> Calar (Vontade DT ${DT_CALAR})</button>`
  });
  return m;
}

export async function manifestacaoDoMestre(actor) {
  if (!game.user?.isGM) return;
  const res = lerRessonancia(actor);
  const almas = listaAlmas(res, { todas: false });
  if (!almas.length) return ui.notifications.warn("Revele pelo menos uma alma antes.");
  const { formulario } = await mun();
  const r = await formulario("Manifestação involuntária", `
    <label class="epm-campo"><span>Alma</span><select name="alma"><option value="">Sortear entre as reveladas</option>${opcoesHtml(almas.map(a => [a.id, a.nome || "Alma sem nome"]))}</select></label>
    <label class="epm-campo"><span>Gatilho</span><input type="text" name="gatilho" placeholder="viu um lugar, pessoa ou objeto ligado à vida da alma…"></label>`, { botao: "Manifestar" });
  if (!r) return;
  const m = await manifestar(actor, { alma: r.alma, gatilho: String(r.gatilho ?? "").trim() || "Gatilho do Mestre", forcar: true });
  if (!m) ui.notifications.warn("A Ressonância está bloqueada.");
  return m;
}

export async function encerrarManifestacao(actor, { aviso = false } = {}) {
  const res = lerRessonancia(actor);
  if (!res.manifestacao?.alma) return null;
  const nome = res.almas?.[res.manifestacao.alma]?.nome || "A alma";
  await actor.update({ [`${R}.-=manifestacao`]: null });
  if (aviso) ui.notifications.info(`${nome} se recolhe; ${actor.name} recupera a própria voz.`);
  return true;
}

export async function calar(actor) {
  if (!actor?.isOwner) return ui.notifications.warn(`Só quem controla ${actor?.name ?? "o personagem"} tenta calar a alma.`);
  const res = lerRessonancia(actor);
  const m = res.manifestacao;
  if (!m?.alma) return ui.notifications.info("Nenhuma alma está falando agora.");
  if (m.tentou) return ui.notifications.warn("Já tentou calar esta manifestação.");
  const { estadoAtor, rolarTeste, calcularPerda } = await mec();
  const { ficha } = estadoAtor(actor);
  const per = ficha.periciaPorId?.vontade;
  const nome = res.almas?.[m.alma]?.nome || "a alma";
  const t = await rolarTeste(actor, {
    rotulo: `Calar ${nome}: Vontade DT ${DT_CALAR}`, bonus: per?.testeTotal ?? per?.total ?? 0,
    desvantagens: [...(ficha.desvantagens?.testes ?? []), ...(per?.desvantagem ?? [])], vantagens: [...(ficha.vantagens?.testes ?? []), ...(per?.vantagem ?? [])],
    penalidades: per?.testeFontes ?? []
  });
  if (!t) return null;
  if (t.total >= DT_CALAR) {
    await actor.update({ [`${R}.-=manifestacao`]: null });
    await cartaoAlma(actor, res.almas?.[m.alma], { titulo: "Alma calada", sub: `${actor.name} retoma a própria voz`, corpo: `<p>Passou na Vontade (${t.total}).</p>` });
    return { calou: true };
  }
  const rolagem = new Roll("1d6");
  await rolagem.evaluate();
  const dano = Math.max(0, Math.floor(rolagem.total));
  const perda = calcularPerda(ficha, "ps", dano);
  await actor.update({ ...perda.updates, [`${R}.manifestacao.tentou`]: true });
  await cartaoAlma(actor, res.almas?.[m.alma], {
    titulo: "Não conseguiu calar", sub: `${nome} continua falando`, cor: "#E05A4E",
    corpo: `<p>Falhou na Vontade (${t.total}). <strong>Sanidade −${dano}</strong>${perda.doTemp ? ` (${perda.doTemp} da temporária)` : ""}.</p>`
  });
  return { calou: false, dano };
}

/** Gatilhos automáticos: Vida chegou a 0, Sanidade cruzou para 25 ou menos. */
export async function checarGatilhos(actor, antes = {}) {
  if (!listaAlmas(lerRessonancia(actor), { todas: false }).length) return null;
  const hp = actor.system?.attributes?.hp ?? {};
  const ps = actor.flags?.[FLAG]?.recursos?.ps ?? {};
  const psTotal = num(ps.value) + Math.max(0, num(ps.temp));
  const usaSanidade = !(ps.max !== undefined && ps.max !== "" && num(ps.max) <= 0);
  if (antes.pv !== undefined && num(antes.pv) > 0 && num(hp.value) <= 0) return manifestar(actor, { gatilho: "ficou com 0 de Vida" });
  if (usaSanidade && antes.ps !== undefined && num(antes.ps) > LIMITE_SANIDADE && psTotal <= LIMITE_SANIDADE) return manifestar(actor, { gatilho: `a Sanidade chegou a ${psTotal}` });
  return null;
}

/* -------------------------------------------- */
/*  4. Ritual do Vazio                          */
/* -------------------------------------------- */

export async function iniciarRitual(actor) {
  if (!game.user?.isGM) return;
  const res = lerRessonancia(actor);
  const almas = listaAlmas(res);
  if (!almas.length) return ui.notifications.warn("Registre uma alma antes.");
  await prepararMec();
  const { ficha } = globalThis.__epmMec.estadoAtor(actor);
  const pericias = (ficha.pericias ?? []).map(p => ({ id: p.id, nome: p.nome }));
  const alvos = alvosModificador(pericias);
  let idiomas = [];
  try { idiomas = (await import("./idiomas.mjs")).catalogoIdiomas({ incluirProibidos: true }).map(l => l.label); } catch { idiomas = []; }
  const { formulario } = await mun();
  const r = await formulario("Ritual do Vazio", `
    <p class="epm-dica">Num Templo do Vazio, ${escapar(actor.name)} puxa memórias de outra vida. Escolha a recompensa (entra sem custo de PT nem horas e nunca se perde).
    Depois o jogador escolhe 2 memórias para esquecer e você aprova.</p>
    <label class="epm-campo"><span>Alma</span><select name="alma">${opcoesHtml(almas.map(a => [a.id, a.nome || "Alma sem nome"]))}</select></label>
    <label class="epm-campo"><span>Recompensa</span><select name="tipo">${opcoesHtml(Object.entries(ROTULO_TIPO_RECOMPENSA))}</select></label>
    <fieldset class="epm-aquisicao"><legend>Relíquia (item)</legend>
      <label class="epm-campo"><span>UUID do item (arraste do diretório ou compêndio)</span><input type="text" name="itemUuid" placeholder="Item.xxxx ou Compendium.…"></label>
      <label class="epm-campo"><span>ou nome de um item novo</span><input type="text" name="itemNome" placeholder="Anel de prata da alma"></label></fieldset>
    <fieldset class="epm-aquisicao"><legend>Bônus permanente</legend>
      <label class="epm-campo"><span>Tipo</span><select name="bonusModo">${opcoesHtml([["mod", "Número (+1 em uma perícia, atributo…)"], ["vantagem", "Vantagem num tipo de teste"], ["texto", "Só texto (o Mestre aplica)"]])}</select></label>
      <div class="epm-dialogo-linha"><label class="epm-campo"><span>Onde</span><select name="bonusAlvo">${opcoesHtml(alvos.map(a => [a.id, `${a.grupo}: ${a.label}`]), "pericia." + (pericias[0]?.id ?? ""))}</select></label>
      <label class="epm-campo"><span>Valor</span><input type="number" name="bonusValor" value="1"></label></div>
      <label class="epm-campo"><span>Vantagem em</span><select name="bonusPericia">${opcoesHtml([["testes", "Todos os testes"], ...pericias.map(p => [p.id, p.nome])])}</select></label>
      <label class="epm-campo"><span>Nome ou texto</span><input type="text" name="bonusTexto" placeholder="Memória do ferreiro"></label></fieldset>
    <fieldset class="epm-aquisicao"><legend>Idioma</legend>
      <label class="epm-campo"><span>Idioma</span><select name="idioma"><option value="">—</option>${opcoesHtml(idiomas.map(l => [l, l]))}</select></label>
      <label class="epm-campo"><span>ou outro</span><input type="text" name="idiomaOutro"></label></fieldset>
    <fieldset class="epm-aquisicao"><legend>Treinamento</legend>
      <label class="epm-campo"><span>Da lista</span><select name="treino"><option value="">—</option>${opcoesHtml(TREINAMENTOS_NOTION.map((t, i) => [String(i), t.nome]))}</select></label>
      <label class="epm-campo"><span>ou um novo (nome)</span><input type="text" name="treinoNome"></label>
      <label class="epm-campo"><span>Benefícios (treino novo)</span><input type="text" name="treinoBeneficios"></label></fieldset>`, { botao: "Abrir o ritual", largura: 600 });
  if (!r) return;
  const rec = montarRecompensa(r, { alvos, pericias });
  if (!rec) return ui.notifications.warn("Recompensa incompleta.");
  await actor.update({ [`${R}.ritual`]: { alma: r.alma, recompensa: rec, etapa: "memorias", memorias: [], recusa: "", criado: Date.now() } });
  const alma = res.almas?.[r.alma] ?? {};
  await cartaoAlma(actor, { ...alma, id: r.alma }, {
    titulo: "Ritual do Vazio", sub: `${actor.name} puxa memórias de ${alma.nome || "outra vida"}`, sussurro: true,
    corpo: `<p>Recompensa: <strong>${escapar(textoRecompensa(rec))}</strong>.</p><p>Custo: esquecer 2 memórias. Escolha na aba <strong>Almas</strong>; o Mestre aprova.</p>`
  });
  return rec;
}

export function montarRecompensa(r, { alvos = [], pericias = [] } = {}) {
  const tipo = r.tipo;
  if (tipo === "item") {
    const uuid = String(r.itemUuid ?? "").trim().replace(/^@UUID\[|\]$/g, "").replace(/\{.*$/, "");
    const nome = String(r.itemNome ?? "").trim();
    if (!uuid && !nome) return null;
    return { tipo, uuid, nome: nome || "" };
  }
  if (tipo === "bonus") {
    const modo = ["mod", "vantagem", "texto"].includes(r.bonusModo) ? r.bonusModo : "mod";
    const nome = String(r.bonusTexto ?? "").trim();
    if (modo === "mod") {
      const alvo = String(r.bonusAlvo ?? "");
      const a = alvos.find(x => x.id === alvo);
      if (!alvo || !num(r.bonusValor)) return null;
      return { tipo, modo, alvo, alvoNome: a?.label ?? alvo, valor: num(r.bonusValor), nome };
    }
    if (modo === "vantagem") {
      const per = String(r.bonusPericia ?? "testes");
      return { tipo, modo, pericia: per, periciaNome: per === "testes" ? "todos os testes" : (pericias.find(p => p.id === per)?.nome ?? per), nome };
    }
    if (!nome) return null;
    return { tipo, modo, texto: nome, nome };
  }
  if (tipo === "idioma") {
    const idioma = String(r.idiomaOutro ?? "").trim() || String(r.idioma ?? "").trim();
    return idioma ? { tipo, idioma } : null;
  }
  if (tipo === "treino") {
    const nomeNovo = String(r.treinoNome ?? "").trim();
    if (nomeNovo) return { tipo, nome: nomeNovo, beneficios: String(r.treinoBeneficios ?? "").trim() };
    const e = r.treino !== "" && r.treino !== undefined ? TREINAMENTOS_NOTION[int(r.treino)] : null;
    return e ? { tipo, indice: int(r.treino), nome: e.nome } : null;
  }
  return null;
}

export async function escolherMemorias(actor) {
  if (!actor?.isOwner) return;
  const res = lerRessonancia(actor);
  if (res.ritual?.etapa !== "memorias") return ui.notifications.info("Nenhum ritual esperando as memórias.");
  const lista = memoriasDisponiveis(actor);
  if (!lista.length) return ui.notifications.warn("Não há memórias para esquecer (idioma, relação, background ou treinamento concluído).");
  const precisa = Math.min(2, lista.length);
  const { formulario } = await mun();
  const r = await formulario("Esquecer 2 memórias", `
    <p class="epm-dica">O custo do Ritual do Vazio: escolha ${precisa === 2 ? "2 memórias" : "a memória"} que ${escapar(actor.name)} esquece. O Mestre aprova.
    Uma memória esquecida só volta por meios extraordinários.</p>
    ${res.ritual.recusa ? `<p class="epm-aviso">O Mestre pediu outra escolha: ${escapar(res.ritual.recusa)}</p>` : ""}
    <div class="epm-lista-checks">${lista.map(m => `<label class="epm-check"><input type="checkbox" name="mem[]" value="${escapar(m.valor)}"> ${escapar(m.rotulo)}${m.previa ? ` <em class="epm-dica">${escapar(m.previa)}…</em>` : ""}</label>`).join("")}</div>
    <label class="epm-campo"><span>Trecho do background (opcional: só este pedaço some; vazio = a parte inteira)</span><textarea name="trecho" rows="2"></textarea></label>`, { botao: "Enviar ao Mestre" });
  if (!r) return;
  const escolhidas = (r.mem ?? []).map(v => lista.find(m => m.valor === v)).filter(Boolean);
  if (escolhidas.length !== precisa) return ui.notifications.warn(`Escolha exatamente ${precisa} memória${precisa > 1 ? "s" : ""}.`);
  const trecho = String(r.trecho ?? "").trim();
  const memorias = escolhidas.map(m => ({ valor: m.valor, tipo: m.tipo, rotulo: m.rotulo, trecho: m.tipo === "background" ? trecho : "" }));
  await actor.update({ [`${R}.ritual.memorias`]: memorias, [`${R}.ritual.etapa`]: "aprovar", [`${R}.ritual.recusa`]: "" });
  ui.notifications.info("Memórias enviadas. Falta o Mestre aprovar o ritual.");
  return memorias;
}

export async function recusarMemorias(actor) {
  if (!game.user?.isGM) return;
  const { formulario } = await mun();
  const r = await formulario("Pedir outras memórias", `<label class="epm-campo"><span>Motivo (aparece para o jogador)</span><input type="text" name="motivo"></label>`, { botao: "Devolver ao jogador" });
  if (!r) return;
  await actor.update({ [`${R}.ritual.etapa`]: "memorias", [`${R}.ritual.memorias`]: [], [`${R}.ritual.recusa`]: String(r.motivo ?? "").trim() || "Escolha outras memórias." });
}

export async function cancelarRitual(actor) {
  if (!game.user?.isGM) return;
  await actor.update({ [`${R}.-=ritual`]: null });
}

export async function aprovarRitual(actor) {
  if (!game.user?.isGM) return;
  const res = lerRessonancia(actor);
  const rit = res.ritual;
  if (rit?.etapa !== "aprovar") return;
  const textos = await aplicarRecompensa(actor, rit.alma, rit.recompensa);
  const esquecidas = [];
  for (const m of rit.memorias ?? []) {
    const e = await esquecer(actor, m, rit.alma);
    if (e) esquecidas.push(e);
  }
  await actor.update({
    [`${R}.-=ritual`]: null,
    [`${R}.rituais.${novoId()}`]: { alma: rit.alma, quando: agora(), recompensa: textoRecompensa(rit.recompensa), memorias: esquecidas.map(e => e.rotulo) }
  });
  const alma = res.almas?.[rit.alma] ?? {};
  await cartaoAlma(actor, { ...alma, id: rit.alma }, {
    titulo: "Ritual do Vazio concluído", sub: `${actor.name} carrega agora um pedaço de ${alma.nome || "outra vida"}`,
    corpo: `<p>Ganhou: <strong>${escapar(textos.join("; ") || textoRecompensa(rit.recompensa))}</strong> (Ressonância: nunca se perde).</p><p>Esqueceu ${esquecidas.length} memória${esquecidas.length === 1 ? "" : "s"}.</p>`
  });
  return { recompensa: textos, esquecidas };
}

async function aplicarRecompensa(actor, almaId, rec = {}) {
  const textos = [];
  if (rec.tipo === "item") {
    let obj = null;
    if (rec.uuid) {
      try { const src = await fromUuid(rec.uuid); obj = src?.toObject?.() ?? null; } catch { obj = null; }
    }
    if (!obj) obj = { name: rec.nome || "Relíquia de Alma", type: "loot", img: "icons/commodities/gems/gem-faceted-round-white.webp", system: {} };
    delete obj._id;
    if (rec.nome && rec.uuid) obj.name = rec.nome;
    obj.flags = { ...(obj.flags ?? {}), [FLAG]: { ...(obj.flags?.[FLAG] ?? {}), reliquiaAlma: almaId, ressonancia: true } };
    const [criado] = await actor.createEmbeddedDocuments("Item", [obj]);
    if (criado) await actor.update({ [`${R}.almas.${almaId}.reliquia`]: criado.id });
    textos.push(`Relíquia de Alma: ${obj.name}`);
  } else if (rec.tipo === "bonus") {
    const b = { tipo: rec.modo, alvo: rec.alvo ?? "", alvoNome: rec.alvoNome ?? "", valor: num(rec.valor), pericia: rec.pericia ?? "", periciaNome: rec.periciaNome ?? "", texto: rec.texto ?? "", nome: rec.nome ?? "", alma: almaId };
    await actor.update({ [`${R}.bonus.${novoId()}`]: b });
    textos.push(`Bônus permanente: ${textoBonus(b)}`);
  } else if (rec.tipo === "idioma") {
    const { adicionarIdioma } = await import("./idiomas.mjs");
    await adicionarIdioma(actor, rec.idioma);
    const atuais = lerRessonancia(actor).idiomas ?? [];
    await actor.update({ [`${R}.idiomas`]: [...new Set([...atuais, rec.idioma])] });
    textos.push(`Idioma: ${rec.idioma}`);
  } else if (rec.tipo === "treino") {
    const e = rec.indice !== undefined && !rec.beneficios && rec.nome === TREINAMENTOS_NOTION[rec.indice]?.nome ? TREINAMENTOS_NOTION[rec.indice] : null;
    const mods = {};
    for (const m of e?.mods ?? []) mods[novoId()] = { alvo: m.alvo, valor: m.valor };
    const unidade = e?.unidade && UNIDADES_TEMPO[e.unidade] ? e.unidade : "horas";
    const tempo = num(e?.tempo) || 1;
    const horas = Math.max(1, Math.round(tempo * UNIDADES_TEMPO[unidade].horas));
    await actor.update({ [`${P}.treinamentos.${novoId()}`]: {
      nome: rec.nome, categoria: e?.categoria ?? "", tempo, unidade, pt: 0, requisitos: e?.requisitos ?? "", treinador: false,
      beneficios: e?.beneficios ?? rec.beneficios ?? "", especial: e?.especial ?? "", estado: "concluido", horasFeitas: horas, mods,
      criado: Date.now(), ressonancia: true, almaOrigem: almaId
    } });
    textos.push(`Treinamento concluído: ${rec.nome}`);
  }
  return textos;
}

async function esquecer(actor, m, almaId) {
  const [tipo, ref, extra] = String(m.valor ?? "").split("|");
  const d = actor.flags?.[FLAG] ?? {};
  const base = { tipo, ref: ref ?? "", quando: agora(), alma: almaId };
  if (tipo === "idioma") {
    const { removerIdioma } = await import("./idiomas.mjs");
    await removerIdioma(actor, { chave: ref, rotulo: extra ?? "" });
    return guardarEsquecida(actor, { ...base, rotulo: `Idioma: ${extra || ref}`, conteudo: extra || ref, dados: { chave: ref, rotulo: extra ?? "" } });
  }
  if (tipo === "relacao") {
    const r = d.relacoes?.[ref];
    if (!r) return null;
    await actor.update({ [`${P}.relacoes.${ref}.afinidade`]: 0 });
    return guardarEsquecida(actor, { ...base, rotulo: `Relação: ${r.nome || atorRelacao(r)?.name || "?"}`, conteudo: `Afinidade era ${int(r.afinidade)}`, dados: { afinidade: int(r.afinidade) } });
  }
  if (tipo === "background") {
    const campo = CAMPOS_BACKGROUND.find(c => c.id === ref);
    if (!campo) return null;
    const html = String(d.sobre?.[ref] ?? "");
    const trecho = String(m.trecho ?? "").trim();
    let novo = "", guardado = html;
    if (trecho && html.includes(trecho)) { novo = html.replace(trecho, ""); guardado = trecho; }
    await actor.update({ [`${P}.sobre.${ref}`]: novo });
    return guardarEsquecida(actor, { ...base, rotulo: campo.label, conteudo: guardado, dados: { parcial: novo !== "" } });
  }
  if (tipo === "treino") {
    const t = d.treinamentos?.[ref];
    if (!t) return null;
    await actor.update({ [`${P}.treinamentos.${ref}.estado`]: "planejado", [`${P}.treinamentos.${ref}.horasFeitas`]: 0, [`${P}.treinamentos.${ref}.esquecido`]: true });
    return guardarEsquecida(actor, { ...base, rotulo: `Treinamento: ${t.nome || "sem nome"}`, conteudo: t.beneficios ?? "", dados: { horasFeitas: num(t.horasFeitas) } });
  }
  return null;
}

async function guardarEsquecida(actor, e) {
  await actor.update({ [`${R}.esquecidas.${novoId()}`]: e });
  return e;
}

/** Meios extraordinários: o Mestre devolve uma memória esquecida. */
export async function restaurarMemoria(actor, id) {
  if (!game.user?.isGM) return;
  const e = lerRessonancia(actor).esquecidas?.[id];
  if (!e) return;
  const d = actor.flags?.[FLAG] ?? {};
  if (e.tipo === "idioma") await (await import("./idiomas.mjs")).adicionarIdioma(actor, e.dados?.rotulo || e.conteudo);
  else if (e.tipo === "relacao" && d.relacoes?.[e.ref]) await actor.update({ [`${P}.relacoes.${e.ref}.afinidade`]: int(e.dados?.afinidade) });
  else if (e.tipo === "background") await actor.update({ [`${P}.sobre.${e.ref}`]: `${d.sobre?.[e.ref] ?? ""}${e.conteudo ?? ""}` });
  else if (e.tipo === "treino" && d.treinamentos?.[e.ref]) await actor.update({ [`${P}.treinamentos.${e.ref}.estado`]: "concluido", [`${P}.treinamentos.${e.ref}.horasFeitas`]: num(e.dados?.horasFeitas), [`${P}.treinamentos.${e.ref}.-=esquecido`]: null });
  await actor.update({ [`${R}.esquecidas.-=${id}`]: null });
  ui.notifications.info(`Memória devolvida: ${e.rotulo}.`);
}

export async function removerBonus(actor, id) {
  if (!game.user?.isGM) return;
  const { confirmar } = await mec();
  if (!(await confirmar("Remover bônus da Ressonância", "<p>A recompensa do ritual nunca se perde. Remover mesmo assim (correção do Mestre)?</p>"))) return;
  await actor.update({ [`${R}.bonus.-=${id}`]: null });
}

/* -------------------------------------------- */
/*  5. Guardião Ancestral                       */
/* -------------------------------------------- */

export async function invocarGuardiao(actor, id) {
  if (!game.user?.isGM) return;
  const res = lerRessonancia(actor);
  const alma = res.almas?.[id];
  if (!alma) return;
  if (alma.guardiao?.token) return ui.notifications.warn("Este guardião já está em cena.");
  const alvo = alma.ator ? await fromUuid(alma.ator) : null;
  if (!alvo) return ui.notifications.warn("Ligue a ficha da alma antes (modo edição).");
  const cena = globalThis.canvas?.scene ?? game.scenes?.current;
  const corpo = actor.getActiveTokens?.(true, true)?.find(t => t.parent?.id === cena?.id || t.scene?.id === cena?.id) ?? actor.getActiveTokens?.()?.[0];
  const doc = corpo?.document ?? corpo;
  if (!cena || !doc) return ui.notifications.warn(`Coloque o token de ${actor.name} na cena atual antes.`);
  const grade = Number(cena.grid?.size) || 100;
  const proto = await alvo.getTokenDocument({
    x: num(doc.x) + grade, y: num(doc.y), actorLink: false, alpha: 0.6, disposition: doc.disposition ?? 1,
    name: `${alma.nome || alvo.name} (Guardião)`, [`flags.${FLAG}.guardiao`]: { corpo: actor.uuid, alma: id }
  });
  const dados = proto.toObject?.() ?? proto;
  foundry.utils.setProperty(dados, `flags.${FLAG}.guardiao`, { corpo: actor.uuid, alma: id });
  const [tok] = await cena.createEmbeddedDocuments("Token", [dados]);
  if (!tok) return;
  const max = num(alvo.system?.attributes?.hp?.max);
  const metade = Math.max(1, Math.ceil(max / 2));
  if (max && tok.actor) await tok.actor.update({ "system.attributes.hp.value": metade });
  const c = combateDoAtor(actor);
  if (c) {
    const lista = [...(c.combatants?.contents ?? c.combatants ?? [])];
    const doCorpo = lista.find(x => x.actorId === actor.id);
    const ini = doCorpo?.initiative;
    await c.createEmbeddedDocuments("Combatant", [{ tokenId: tok.id, sceneId: cena.id, actorId: alvo.id, initiative: ini !== null && ini !== undefined ? Number(ini) - 0.01 : null }]);
  }
  await actor.update({ [`${R}.almas.${id}.guardiao`]: { cena: cena.id, token: tok.id } });
  await cartaoAlma(actor, { ...alma, id, img: alma.img || alvo.img }, {
    titulo: "Guardião Ancestral", sub: `${alma.nome || alvo.name} surge como um fantasma protetor`,
    corpo: `<p>Acompanha o grupo até a saída ou até o chefe cair. Age no turno de ${escapar(actor.name)}, com a ficha da alma e <strong>metade da Vida (${metade})</strong>.</p>
      <p class="epm-dica">Pode ensinar algo durante a dungeon. Quando ele vai embora, tudo o que não virou habilidade (dicas, segredos, rotas) é esquecido.</p>`
  });
  return tok;
}

export async function dispensarGuardiao(actor, id, { silencioso = false } = {}) {
  if (!game.user?.isGM) return;
  const alma = lerRessonancia(actor).almas?.[id];
  const g = alma?.guardiao;
  if (!g?.token) return;
  const cena = game.scenes?.get(g.cena);
  for (const c of [...(game.combats ?? [])]) {
    const ids = [...(c.combatants?.contents ?? c.combatants ?? [])].filter(x => x.tokenId === g.token).map(x => x.id);
    if (ids.length) await c.deleteEmbeddedDocuments("Combatant", ids);
  }
  const tok = cena?.tokens?.get(g.token);
  if (tok) await tok.delete();
  await actor.update({ [`${R}.almas.${id}.-=guardiao`]: null });
  if (!silencioso) await cartaoAlma(actor, { ...alma, id }, { titulo: "O guardião vai embora", sub: alma.nome || "A alma", corpo: "<p>Tudo o que ele ensinou e não virou habilidade (dicas, segredos, rotas) é esquecido.</p>" });
}

/* -------------------------------------------- */
/*  Chat e socket                               */
/* -------------------------------------------- */

export async function cliqueChatAlma(acao, actor, botao) {
  if (acao === "almaCalar") { if (actor) await calar(actor); return true; }
  if (acao === "almaResponder") {
    if (!game.user?.isGM) return true;
    const msg = game.messages?.get(botao.closest("[data-message-id]")?.dataset.messageId);
    const info = msg?.flags?.[FLAG]?.alma ?? {};
    const nome = lerRessonancia(actor).almas?.[info.id]?.nome || "A alma";
    const { formulario } = await mun();
    const r = await formulario(`Resposta de ${nome}`, `<p class="epm-dica">Pode vir incompleta ou enviesada pela personalidade dela.</p>
      <label class="epm-campo"><span>Resposta</span><textarea name="resposta" rows="5"></textarea></label>`, { botao: "Responder" });
    const resposta = String(r?.resposta ?? "").trim();
    if (!resposta || !msg) return true;
    const conteudo = String(msg.content ?? "").replace(/<div class="epm-chat-botoes">[\s\S]*?<\/div>/, "")
      .replace(/<\/div>\s*$/, `<p class="epm-chat-texto epm-alma-resposta"><strong>${escapar(nome)}:</strong> ${escapar(resposta)}</p></div>`);
    await msg.update({ content: conteudo });
    return true;
  }
  return false;
}

/** Pedidos que precisam do Mestre (a troca mexe em itens e lê a ficha da alma). */
export async function pedidoNoMestre(dados = {}) {
  const actor = dados.ator ? await fromUuid(dados.ator) : null;
  if (!actor) return null;
  if (dados.acao === "trocar") return iniciarTroca(actor, dados.alma);
  if (dados.acao === "encerrar") return encerrarTroca(actor, { motivo: dados.motivo ?? "" });
  return null;
}

export async function pedirEncerrarTroca(actor) {
  if (!actor?.isOwner) return;
  const { confirmar } = await mec();
  if (!(await confirmar("Encerrar a troca", "<p>A alma volta e o personagem retoma o corpo com +1 de Exaustão.</p>"))) return;
  const { pedirAoMestre } = await mun();
  return pedirAoMestre("ressonancia", { acao: "encerrar", ator: actor.uuid, motivo: "encerrada antes" });
}

/* -------------------------------------------- */
/*  Tempo e combate (no Mestre)                 */
/* -------------------------------------------- */

const atoresComRessonancia = () => [...(globalThis.game?.actors ?? [])].filter(a => {
  const r = a.flags?.[FLAG]?.ressonancia;
  return r && (r.troca?.alma || r.manifestacao?.alma);
});

export async function verificarTempo() {
  const t = agora();
  for (const a of atoresComRessonancia()) {
    const r = lerRessonancia(a);
    if (r.troca?.alma && !r.troca.combate && num(r.troca.fim) && t >= num(r.troca.fim)) await encerrarTroca(a, { motivo: "passou 1 hora" });
    if (r.manifestacao?.alma && !r.manifestacao.combate && num(r.manifestacao.fim) && t >= num(r.manifestacao.fim)) await encerrarManifestacao(a);
  }
}

export async function verificarRodada(combate) {
  for (const a of atoresComRessonancia()) {
    const m = lerRessonancia(a).manifestacao;
    if (m?.alma && m.combate === combate?.id && int(combate.round) >= int(m.rodadaFim)) await encerrarManifestacao(a);
  }
}

export async function fimDeCombateAlma(combate) {
  for (const a of atoresComRessonancia()) {
    const r = lerRessonancia(a);
    if (r.troca?.alma && r.troca.combate === combate?.id) await encerrarTroca(a, { motivo: "fim do combate" });
    if (r.manifestacao?.alma && r.manifestacao.combate === combate?.id) await encerrarManifestacao(a);
  }
}

/** Precarrega mecânicas para as funções síncronas (bloqueios). */
async function prepararMec() {
  if (!globalThis.__epmMec) globalThis.__epmMec = await mec();
  return globalThis.__epmMec;
}

export function registrarRessonancia() {
  const souMestre = () => !!game.user?.isGM && (!game.users?.activeGM || game.users.activeGM.isSelf);
  Hooks.on("preUpdateActor", (ator, mudancas, opcoes) => {
    if (!ator.flags?.[FLAG]?.ressonancia) return;
    if (foundry.utils.hasProperty(mudancas, "system.attributes.hp")) opcoes.epmAlmaPv = num(ator.system?.attributes?.hp?.value);
    if (foundry.utils.hasProperty(mudancas, `flags.${FLAG}.recursos.ps`)) {
      const ps = ator.flags?.[FLAG]?.recursos?.ps ?? {};
      opcoes.epmAlmaPs = num(ps.value) + Math.max(0, num(ps.temp));
    }
  });
  Hooks.on("updateActor", (ator, _m, opcoes, userId) => {
    if (userId !== game.user?.id) return;
    if (opcoes?.epmAlmaPv === undefined && opcoes?.epmAlmaPs === undefined) return;
    checarGatilhos(ator, { pv: opcoes.epmAlmaPv, ps: opcoes.epmAlmaPs }).catch(err => console.warn("EPM | Ressonância (gatilhos)", err));
  });
  Hooks.on("updateWorldTime", () => { if (souMestre()) verificarTempo().catch(err => console.warn("EPM | Ressonância (tempo)", err)); });
  Hooks.on("updateCombat", (c, mud) => { if (souMestre() && "round" in (mud ?? {})) verificarRodada(c).catch(err => console.warn("EPM | Ressonância (rodada)", err)); });
  Hooks.on("deleteCombat", c => { if (souMestre()) fimDeCombateAlma(c).catch(err => console.warn("EPM | Ressonância (fim do combate)", err)); });
  Hooks.on("deleteToken", tok => {
    const g = tok.flags?.[FLAG]?.guardiao;
    if (!g || !souMestre()) return;
    fromUuid(g.corpo).then(a => a && lerRessonancia(a).almas?.[g.alma]?.guardiao?.token === tok.id ? a.update({ [`${R}.almas.${g.alma}.-=guardiao`]: null }) : null)
      .catch(err => console.warn("EPM | Ressonância (guardião)", err));
  });
}
