/**
 * Talentos na ficha: adicionar do catálogo (ou à mão), habilidades das ações limitadas (origem "Talento"),
 * Sortudo (pontos de Sorte e "Rerrolar" nos testes), Escolhido do Multiverso ("Tornar 20 natural"),
 * Fúria Controlada (oferece sozinha na primeira vez do combate em metade da Vida) e as recargas por sessão e semana.
 */
import { FLAG } from "./config.mjs";
import { novoId, formaPadrao, int, num } from "./data.mjs";
import { escapar, fvtt } from "./helpers.mjs";
import {
  talentoModelo, modeloDoTalento, talentosAtivos, temTalento, SORTE_POR_DIA, FURIA, FAIXAS_TALENTO, CATEGORIAS_TALENTOS, AFINIDADE_INICIAL, talentoPorNome
} from "./talentos-lista.mjs";

const P = `flags.${FLAG}`;
const COR = "#C58B3A";

/** Dados do item de habilidade de um talento (formas vindas do catálogo). */
export function dadosHabilidadeTalento(e, idTalento) {
  const formas = {};
  (e.auto?.acoes ?? []).forEach((a, ordem) => {
    formas[novoId()] = { ...formaPadrao(ordem, a.nome), ...a, ordem, nome: a.nome, custo: { ...a.custo }, teste: { ...a.teste }, dano: { ...a.dano } };
  });
  const passiva = (e.auto?.acoes ?? []).every(a => a.acao === "passiva");
  return {
    name: e.nome, type: "feat", img: "icons/svg/aura.svg",
    system: { description: { value: `<p>${escapar(e.beneficio)}</p><p class="epm-dica">Talento ${escapar(FAIXAS_TALENTO[e.faixa]?.label ?? "")}.</p>` } },
    flags: { [FLAG]: { origem: "talento", raridade: "comum", foraDoLimite: true, talentoRef: idTalento, talentoModelo: e.id, formas, ...(passiva ? { passiva: true } : {}) } }
  };
}

/** Cria e apaga as habilidades dos talentos (idempotente). */
export async function aplicarTalentos(actor) {
  if (!actor?.isOwner) return [];
  const dados = actor.flags?.[FLAG] ?? {};
  const itens = actor.items?.contents ?? actor.items ?? [];
  const ativos = talentosAtivos(dados);
  const criar = [];
  const apagar = [];
  for (const { id, modelo } of ativos) {
    if (!modelo?.auto?.acoes?.length) continue;
    if (!itens.some(i => i.flags?.[FLAG]?.talentoRef === id)) criar.push(dadosHabilidadeTalento(modelo, id));
  }
  const idsAtivos = new Set(ativos.map(x => x.id));
  for (const i of itens) {
    const ref = i.flags?.[FLAG]?.talentoRef;
    if (ref && !idsAtivos.has(ref)) apagar.push(i.id);
  }
  if (criar.length) await actor.createEmbeddedDocuments("Item", criar);
  if (apagar.length) await actor.deleteEmbeddedDocuments("Item", apagar);
  return criar.map(c => c.name);
}

/** Tipos de dano para a Afinidade Elemental (os mágicos primeiro). */
async function escolherElemento(actor, nome) {
  const { TIPOS_DANO } = await import("./config.mjs");
  const tipos = [...TIPOS_DANO.filter(t => t.grupo === "magicos"), ...TIPOS_DANO.filter(t => t.grupo !== "magicos" && !t.extra)];
  const r = await fvtt.DialogV2.wait({
    window: { title: `${nome}: tipo de dano` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p class="epm-dica">As magias de ${escapar(actor.name)} desse tipo causam +2 de dano.</p>
      <label class="epm-campo"><span>Tipo de dano</span><select name="tipo">${tipos.map(t => `<option value="${escapar(t.label)}">${escapar(t.label)}</option>`).join("")}</select></label>`,
    buttons: [
      { action: "ok", label: "Escolher", icon: "fa-solid fa-check", default: true, callback: (ev, b) => b.form.elements.tipo.value },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  return typeof r === "string" && r !== "cancelar" && r !== "ok" ? r : null;
}

/** Adiciona um talento do catálogo. Devolve o id na ficha (ou null). */
export async function adicionarTalento(actor, modeloId, { silencioso = false, escolha = null } = {}) {
  const e = talentoModelo(modeloId);
  if (!e || !actor?.isOwner) return null;
  const dados = actor.flags?.[FLAG] ?? {};
  if (!e.repetivel && talentosAtivos(dados).some(x => x.modelo?.id === e.id)) {
    if (!silencioso) ui.notifications.warn(`${actor.name} já tem ${e.nome}.`);
    return null;
  }
  let valor = escolha;
  if (e.auto?.escolha === "elemento" && !valor) {
    valor = await escolherElemento(actor, e.nome);
    if (!valor) return null;
  }
  const id = novoId();
  await actor.update({
    [`${P}.talentos.${id}`]: {
      modelo: e.id, nome: valor ? `${e.nome} (${valor})` : e.nome, categoria: e.categoria, faixa: e.faixa, descricao: e.beneficio,
      ...(valor ? { escolha: valor } : {}), mods: {}, versao: 2, criado: Date.now()
    }
  });
  await aplicarTalentos(actor);
  if (!silencioso) ui.notifications.info(`${actor.name}: talento ${e.nome} adicionado.`);
  return id;
}

/** Talento criado à mão (sem modelo). */
export async function novoTalentoManual(actor) {
  return actor.update({ [`${P}.talentos.${novoId()}`]: { nome: "Novo talento", categoria: "", faixa: "comum", descricao: "", mods: {}, versao: 2, criado: Date.now() } });
}

/** Ligar/desligar (talentos antigos não comprados vêm desligados). */
export async function alternarTalento(actor, id) {
  const t = actor.flags?.[FLAG]?.talentos?.[id];
  if (!t) return;
  await actor.update({ [`${P}.talentos.${id}.inativo`]: !t.inativo });
  await aplicarTalentos(actor);
}

export async function excluirTalento(actor, id) {
  await actor.update({ [`${P}.talentos.-=${id}`]: null });
  await aplicarTalentos(actor);
}

/* -------------------------------------------- */
/*  Sortudo e Escolhido do Multiverso (chat)    */
/* -------------------------------------------- */

export const sorteRestante = dados => Math.max(0, SORTE_POR_DIA - int(dados?.sorte?.usados));

/** Forma "1× por sessão" do Escolhido: { item, chave } ou null. */
function usoEscolhido(actor) {
  const item = (actor.items?.contents ?? []).find(i => i.flags?.[FLAG]?.talentoModelo === "escolhidoMultiverso");
  const formaId = item ? Object.keys(item.flags[FLAG].formas ?? {})[0] : null;
  return item && formaId ? { item, chave: `${item.id}_${formaId}` } : null;
}
const escolhidoLivre = actor => { const u = usoEscolhido(actor); return !!u && !actor.flags?.[FLAG]?.usosFormas?.[u.chave]; };

/** Personagens meus com o Escolhido livre nesta sessão. */
function meusEscolhidos() {
  // O Mestre só vê o botão de quem não tem o dono jogador conectado (para não encher o cartão)
  const donoOnline = a => game.users?.some(u => u.active && !u.isGM && a.testUserPermission?.(u, "OWNER"));
  return (game.actors?.contents ?? []).filter(a => a.isOwner && a.flags?.[FLAG] && (!game.user.isGM || !donoOnline(a)) && temTalento(a.flags[FLAG], "escolhidoMultiverso") && escolhidoLivre(a));
}

/** Botões no cartão de teste (d20): Rerrolar com Sorte (dono) e Tornar 20 natural (dono ou aliado). */
export function decorarTeste(mensagem, html) {
  const f = mensagem?.flags?.[FLAG];
  if (f?.tipo !== "teste" || f.rerrolado || f.virouVinte) return;
  const el = html?.[0] ?? html;
  const alvo = el?.querySelector?.(".message-content");
  if (!alvo || alvo.querySelector(".epm-chat-talento")) return;
  let ator = null;
  try { ator = f.actorUuid ? fromUuidSync(f.actorUuid) : null; } catch { ator = null; }
  const botoes = [];
  if (ator?.isOwner && temTalento(ator.flags?.[FLAG], "sortudo") && sorteRestante(ator.flags[FLAG]) > 0) {
    botoes.push(`<button type="button" class="epm-botao epm-botao-mini" data-epm-action="talSorte" title="Sortudo: gasta 1 ponto de Sorte e rola de novo (fica o resultado que quiser)"><i class="fa-solid fa-clover"></i> Rerrolar (Sorte ${sorteRestante(ator.flags[FLAG])})</button>`);
  }
  for (const a of meusEscolhidos()) {
    botoes.push(`<button type="button" class="epm-botao epm-botao-mini" data-epm-action="talVinte" data-escolhido="${escapar(a.uuid)}" title="Escolhido do Multiverso (${escapar(a.name)}, 1× por sessão): o d20 vira 20 natural. Não garante o acerto."><i class="fa-solid fa-star"></i> Tornar 20 natural${a.uuid === f.actorUuid ? "" : ` (${escapar(a.name)})`}</button>`);
  }
  if (!botoes.length) return;
  const div = document.createElement("div");
  div.className = "epm-chat epm-chat-talento";
  if (f.actorUuid) div.dataset.actorUuid = f.actorUuid;
  div.innerHTML = botoes.join("");
  alvo.append(div);
}

/** Cliques dos botões de talento no chat. */
export async function cliqueTalento(acao, actor, botao) {
  if (acao !== "talSorte" && acao !== "talVinte") return false;
  const id = botao.closest("[data-message-id]")?.dataset.messageId;
  const msg = id ? game.messages.get(id) : null;
  const f = msg?.flags?.[FLAG];
  if (!msg || f?.tipo !== "teste") return true;
  if (acao === "talSorte") {
    if (!actor?.isOwner) { ui.notifications.warn("Só o dono do personagem usa a Sorte."); return true; }
    const dados = actor.flags?.[FLAG] ?? {};
    if (sorteRestante(dados) <= 0) { ui.notifications.warn("Sem pontos de Sorte hoje."); return true; }
    const roll = new Roll(f.formula || "1d20");
    await roll.evaluate();
    await actor.update({ [`${P}.sorte.usados`]: int(dados.sorte?.usados) + 1 });
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `<span class="epm-flavor"><strong>${escapar(f.rotulo || "Teste")}</strong><em>Sortudo: rolou de novo (antes ${int(f.total)}). Fica o resultado que quiser. Sorte: ${sorteRestante(dados) - 1} de ${SORTE_POR_DIA} hoje.</em></span>`,
      flags: { [FLAG]: { ...f, total: roll.total, rerrolado: false, deRerrolagem: true } }
    });
    return true;
  }
  let escolhido = null;
  try { escolhido = fromUuidSync(botao.dataset.escolhido); } catch { escolhido = null; }
  if (!escolhido?.isOwner) { ui.notifications.warn("Esse personagem não é seu."); return true; }
  const uso = usoEscolhido(escolhido);
  if (!uso || escolhido.flags?.[FLAG]?.usosFormas?.[uso.chave]) { ui.notifications.warn("O Escolhido do Multiverso já foi usado nesta sessão."); return true; }
  const roll = msg.rolls?.[0];
  const d20 = roll?.dice?.find(d => d.faces === 20);
  const natural = d20?.total ?? 0;
  const novo = int(f.total) - natural + 20;
  await escolhido.update({ [`${P}.usosFormas.${uso.chave}`]: "sessao" });
  try { await msg.update({ [`flags.${FLAG}.virouVinte`]: true }); } catch { /* sem permissão */ }
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: escolhido }),
    flags: { [FLAG]: { tipo: "notaTalento" } },
    content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:${COR}"><p><i class="fa-solid fa-star" aria-hidden="true"></i> <strong>${escapar(escolhido.name)}</strong> (Escolhido do Multiverso): o d20 de <em>${escapar(f.rotulo || "Teste")}</em>${actor && actor.uuid !== escolhido.uuid ? ` de ${escapar(actor.name)}` : ""} vira <strong>20 natural</strong>. Total: ${int(f.total)} → <strong>${novo}</strong>.</p>
      <p class="epm-dica">A margem de ameaça não garante o acerto: o 20 é o resultado do dado. Volta no Início da sessão.</p></div>`
  });
  return true;
}

/* -------------------------------------------- */
/*  Fúria Controlada                            */
/* -------------------------------------------- */

/** Quem decide pela ficha: o dono jogador ativo ou, sem ele, o Mestre ativo. */
function decisorDe(actor) {
  const dono = game.users?.find(u => u.active && !u.isGM && actor.testUserPermission?.(u, "OWNER"));
  return dono ?? game.users?.activeGM ?? null;
}

export async function verificarFuria(actor) {
  const dados = actor?.flags?.[FLAG];
  if (!dados || !temTalento(dados, "furiaControlada")) return;
  const combate = game.combat;
  if (!combate?.started || !combate.combatants?.some(c => c.actor?.uuid === actor.uuid || c.actorId === actor.id)) return;
  if (dados.furiaCombate === combate.id) return;
  const hp = actor.system?.attributes?.hp ?? {};
  const max = num(hp.max);
  if (!max || num(hp.value) > max / 2 || num(hp.value) <= 0) return;
  if (decisorDe(actor)?.id !== game.user?.id) return;
  await actor.update({ [`${P}.furiaCombate`]: combate.id });
  const { estadoAtor } = await import("./mecanicas.mjs");
  const con = Math.max(0, int(estadoAtor(actor).ficha.atributos?.constituicao?.total));
  const temp = FURIA.mult * con;
  const sim = await fvtt.DialogV2.confirm({
    window: { title: `Fúria Controlada: ${actor.name}` },
    content: `<p><strong>${escapar(actor.name)}</strong> caiu para metade da Vida ou menos pela primeira vez neste combate.</p><p>Ativar a Fúria Controlada: <strong>${temp} PV temporários</strong> (2 × Constituição) e <strong>+${FURIA.dano} no dano</strong> até o fim do combate?</p>`,
    rejectClose: false, modal: false
  });
  if (!sim) return;
  const item = (actor.items?.contents ?? []).find(i => i.flags?.[FLAG]?.talentoModelo === "furiaControlada");
  const formaId = item ? Object.keys(item.flags[FLAG].formas ?? {})[0] : null;
  await actor.update({
    "system.attributes.hp.temp": Math.max(num(hp.temp), temp),
    [`${P}.bonusCena.${novoId()}`]: { nome: "Fúria Controlada", ativo: true, acerto: 0, dano: String(FURIA.dano), ca: 0, rd: 0, rdTipo: "", testes: 0, deslocamento: 0, cena: true, origem: item?.id ?? "", criado: Date.now() },
    ...(item && formaId ? { [`${P}.usosFormas.${item.id}_${formaId}`]: "combate" } : {})
  });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#C0563A"><p><i class="fa-solid fa-fire" aria-hidden="true"></i> <strong>${escapar(actor.name)}</strong>: Fúria Controlada! ${temp} PV temporários e +${FURIA.dano} no dano até o fim do combate.</p></div>`
  });
}

/* -------------------------------------------- */
/*  Recargas                                    */
/* -------------------------------------------- */

/** Libera os usos de um período (sessão, semana) numa ficha. */
export function liberarPeriodo(dados, periodo) {
  const up = {};
  for (const [k, v] of Object.entries(dados?.usosFormas ?? {})) if (v === periodo) up[`${P}.usosFormas.-=${k}`] = null;
  return up;
}

/** Início da sessão (Escudo): usos "1× por sessão" voltam em todas as fichas. */
export async function sessaoNova() {
  if (!game.user?.isGM) return 0;
  let n = 0;
  for (const a of game.actors?.contents ?? []) {
    const up = liberarPeriodo(a.flags?.[FLAG], "sessao");
    if (Object.keys(up).length) { await a.update(up); n++; }
  }
  return n;
}

/** Relações: NPC novo conectado a quem tem Presença Marcante ou Lenda Viva (só o Mestre confirma). */
export async function sugerirAfinidade(actor, outro, relacaoId) {
  const dados = actor?.flags?.[FLAG];
  if (!dados || !outro || outro.hasPlayerOwner) return;
  const fontes = [["lendaViva", "Lenda Viva"], ["presencaMarcante", "Presença Marcante"]].filter(([id]) => temTalento(dados, id));
  if (!fontes.length) return;
  const valor = Math.max(...fontes.map(([id]) => AFINIDADE_INICIAL[id]));
  const nome = fontes.find(([id]) => AFINIDADE_INICIAL[id] === valor)[1];
  if (game.user?.isGM) {
    const ok = await fvtt.DialogV2.confirm({
      window: { title: `${nome}: afinidade inicial` },
      content: `<p><strong>${escapar(actor.name)}</strong> tem ${escapar(nome)}. ${escapar(outro.name)} começa com afinidade <strong>+${valor}</strong>?</p>`,
      rejectClose: false, modal: true
    });
    if (ok && relacaoId) await actor.update({ [`${P}.relacoes.${relacaoId}.afinidade`]: valor });
    return;
  }
  const gms = game.users?.filter(u => u.isGM).map(u => u.id) ?? [];
  await ChatMessage.create({
    whisper: gms, speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:${COR}"><p><i class="fa-solid fa-handshake" aria-hidden="true"></i> <strong>${escapar(actor.name)}</strong> conectou ${escapar(outro.name)}. Pelo talento ${escapar(nome)}, a afinidade inicial sugerida é <strong>+${valor}</strong> (o Mestre confirma na ficha).</p></div>`
  });
}

/** Ganchos: habilidades dos talentos, Fúria Controlada e os botões no chat. */
export function registrarTalentos() {
  Hooks.on("updateActor", (ator, mud, _o, userId) => {
    if (userId === game.user?.id && foundry.utils.hasProperty(mud, `flags.${FLAG}.talentos`)) aplicarTalentos(ator).catch(err => console.warn("EPM | talentos", err));
    if (foundry.utils.hasProperty(mud, "system.attributes.hp.value")) verificarFuria(ator).catch(err => console.warn("EPM | Fúria Controlada", err));
  });
  Hooks.on("renderChatMessageHTML", (msg, html) => { try { decorarTeste(msg, html); } catch (err) { console.warn("EPM | talentos no chat", err); } });
}

export { CATEGORIAS_TALENTOS, FAIXAS_TALENTO, modeloDoTalento, talentoPorNome };
