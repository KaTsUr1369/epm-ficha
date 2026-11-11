/**
 * Projetos do Artífice: criar (2 por dia, prontos em 1 minuto), usar (some e volta depois de 1 hora),
 * Soma (+testes) e Proteção (+CA) por 1 hora, e o Livro de Projetos.
 * O tempo é o relógio do mundo (game.time.worldTime). Com o Simple Calendar ativo, usa o calendário dele
 * para o tamanho da hora e para saber quando o dia muda.
 */
import { FLAG } from "./config.mjs";
import { int, novoId } from "./data.mjs";
import { fvtt, escapar } from "./helpers.mjs";
import {
  ARQUETIPOS, TIPOS_PROJETO, nivelArquetipo, projetosDoNivel, limiteLivro, estadoProjetos, efeitosProjetoValendo
} from "./arquetipos.mjs";
import { estadoAtor, calcularRecuperacao } from "./mecanicas.mjs";

const P = `flags.${FLAG}`;
const CFG = () => ARQUETIPOS.artifice.tempoProjeto;

/* ---------------- Relógio (Simple Calendar quando houver) ---------------- */

const apiSC = () => globalThis.SimpleCalendar?.api ?? null;

export const agora = () => Number(globalThis.game?.time?.worldTime) || 0;

function segundosPor() {
  const dias = globalThis.game?.time?.calendar?.days;
  const spm = Number(dias?.secondsPerMinute) || 60;
  const mph = Number(dias?.minutesPerHour) || 60;
  return { minuto: spm, hora: spm * mph };
}

/** Soma minutos/horas a um instante do mundo respeitando o calendário em uso. */
export function somarTempo(t, { minutos = 0, horas = 0 } = {}) {
  const api = apiSC();
  if (api?.timestampPlusInterval) {
    try { return api.timestampPlusInterval(t, { minute: minutos, hour: horas }); } catch { /* segue */ }
  }
  const s = segundosPor();
  return t + minutos * s.minuto + horas * s.hora;
}

/** Chave do dia do calendário (os projetos terminam quando ela muda). */
export function chaveDia(t = agora()) {
  const api = apiSC();
  if (api?.timestampToDate) {
    try { const d = api.timestampToDate(t); if (d) return `${d.year}-${d.month}-${d.day}`; } catch { /* segue */ }
  }
  const cal = globalThis.game?.time?.calendar;
  if (cal?.timeToComponents) {
    try { const c = cal.timeToComponents(t); return `${c.year}-${c.day}`; } catch { /* segue */ }
  }
  return String(Math.floor(t / 86400));
}

/** "45 min", "1 h 10 min", "30 s". */
export function textoDuracao(seg) {
  const s = segundosPor();
  const v = Math.max(0, Math.ceil(seg));
  if (v < s.minuto) return `${v} s`;
  const min = Math.ceil(v / s.minuto);
  const mph = s.hora / s.minuto;
  if (min < mph) return `${min} min`;
  const h = Math.floor(min / mph);
  const resto = min - h * mph;
  return resto ? `${h} h ${resto} min` : `${h} h`;
}

/* ---------------- Dados para a ficha ---------------- */

/** Bloco "projetos do dia" do painel do Artífice. */
export function painelProjetos(dados, nivel, intel, podeUsar) {
  const t = agora();
  const dia = chaveDia(t);
  const valores = projetosDoNivel(nivel, intel);
  const todos = estadoProjetos(dados, t, dia);
  const lista = todos.filter(p => !p.apagado).map(p => ({
    ...p,
    valor: valores ? (p.tipo === "dano" ? valores.dano : p.tipo === "cura" ? valores.cura : `+${valores[p.tipo]}`) : "",
    producao: p.estado === "producao", recarga: p.estado === "recarga", pronto: p.estado === "pronto",
    faltamTexto: p.faltam ? textoDuracao(p.faltam) : ""
  }));
  const efeitos = efeitosProjetoValendo(dados, t).map(e => ({
    ...e, label: TIPOS_PROJETO[e.tipo].label, alvo: e.tipo === "soma" ? "em todos os testes" : "na CA", faltamTexto: textoDuracao(e.ate - t)
  }));
  const limite = limiteLivro(nivel, intel);
  const livro = Object.entries(dados.livroProjetos ?? {}).filter(([, l]) => l && TIPOS_PROJETO[l.tipo])
    .map(([id, l]) => ({ id, nome: l.nome || TIPOS_PROJETO[l.tipo].label, tipoLabel: TIPOS_PROJETO[l.tipo].label, icone: TIPOS_PROJETO[l.tipo].icone }));
  const porDia = ARQUETIPOS.artifice.projetosPorDia;
  return {
    lista, efeitos, livro, limiteLivro: limite, livroCheio: livro.length >= limite,
    criadosHoje: todos.length, restam: Math.max(0, porDia - todos.length), podeCriar: podeUsar && todos.length < porDia,
    podeUsar, calendario: !!apiSC()
  };
}

/* ---------------- Ações ---------------- */

async function perguntar({ titulo, content, ok, icone, callback }) {
  const r = await fvtt.DialogV2.wait({
    window: { title: titulo }, classes: ["epm-dialogo"], rejectClose: false, modal: true, content,
    buttons: [
      { action: "ok", label: ok, icon: icone, default: true, callback: (ev, b) => callback(b.form?.elements ?? {}) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  return r && typeof r === "object" ? r : null;
}

/** Remove dos dados os projetos de outros dias e os efeitos vencidos. */
function limpezas(dados, t, dia) {
  const up = {};
  for (const [id, p] of Object.entries(dados.projetos ?? {})) if (!p || p.dia !== dia) up[`${P}.projetos.-=${id}`] = null;
  for (const [id, e] of Object.entries(dados.projetosEfeitos ?? {})) if (!e || Number(e.ate) <= t) up[`${P}.projetosEfeitos.-=${id}`] = null;
  return up;
}

export async function criarProjeto(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  if (!nivelArquetipo(dados, "artifice")) return ui.notifications.warn("Criar Projetos é do Artífice.");
  const t = agora();
  const dia = chaveDia(t);
  const porDia = ARQUETIPOS.artifice.projetosPorDia;
  const hoje = estadoProjetos(dados, t, dia).length;
  if (hoje >= porDia) return ui.notifications.warn(`Você já criou ${porDia} projetos hoje. Eles voltam a ficar disponíveis quando o dia muda.`);
  const livro = Object.entries(dados.livroProjetos ?? {}).filter(([, l]) => l && TIPOS_PROJETO[l.tipo]);
  const opcoesTipo = Object.entries(TIPOS_PROJETO).map(([id, x]) => `<option value="${id}">${x.label}</option>`).join("");
  const opcoesLivro = livro.map(([id, l]) => `<option value="${id}">${escapar(l.nome || TIPOS_PROJETO[l.tipo].label)} (${TIPOS_PROJETO[l.tipo].label})</option>`).join("");
  const r = await perguntar({
    titulo: "Criar projeto", ok: "Começar a produção", icone: "fa-solid fa-screwdriver-wrench",
    content: `<p class="epm-dica">Fica pronto em ${CFG().producaoMin} minuto de produção. ${porDia - hoje} de ${porDia} restantes hoje.</p>
      ${livro.length ? `<label class="epm-campo"><span>Do Livro de Projetos</span><select name="livro"><option value="">— projeto novo —</option>${opcoesLivro}</select></label>` : ""}
      <label class="epm-campo"><span>Nome</span><input type="text" name="nome" placeholder="ex.: Granada de pregos"></label>
      <label class="epm-campo"><span>Tipo</span><select name="tipo">${opcoesTipo}</select></label>`,
    callback: f => ({ livro: f.livro?.value ?? "", nome: String(f.nome?.value ?? "").trim(), tipo: f.tipo?.value ?? "dano" })
  });
  if (!r) return;
  const doLivro = r.livro ? dados.livroProjetos?.[r.livro] : null;
  const tipo = doLivro?.tipo ?? r.tipo;
  if (!TIPOS_PROJETO[tipo]) return;
  const nome = r.nome || doLivro?.nome || TIPOS_PROJETO[tipo].label;
  const id = novoId();
  await actor.update({
    ...limpezas(dados, t, dia),
    [`${P}.projetos.${id}`]: { nome, tipo, dia, criadoEm: t, prontoEm: somarTempo(t, { minutos: CFG().producaoMin }), voltaEm: 0 }
  });
  ui.notifications.info(`${nome}: em produção (${CFG().producaoMin} min).`);
}

/** Usa o projeto: rola dano ou cura, ou liga Soma/Proteção por 1 hora. O projeto some e volta depois de 1 hora. */
export async function usarProjeto(actor, id) {
  const dados = actor.flags?.[FLAG] ?? {};
  const t = agora();
  const p = estadoProjetos(dados, t, chaveDia(t)).find(x => x.id === id);
  if (!p || p.apagado) return ui.notifications.warn("Esse projeto não existe mais (os projetos terminam no fim do dia).");
  if (p.estado === "producao") return ui.notifications.warn(`${p.nome} ainda está em produção (falta ${textoDuracao(p.faltam)}).`);
  if (p.estado === "recarga") return ui.notifications.warn(`${p.nome} volta em ${textoDuracao(p.faltam)}.`);
  const { ficha } = estadoAtor(actor);
  const nivel = nivelArquetipo(dados, "artifice");
  const v = projetosDoNivel(nivel, ficha.atributos?.inteligencia?.total ?? 0);
  if (!v) return;
  const volta = somarTempo(t, { horas: CFG().voltaHoras });
  const up = { [`${P}.projetos.${id}.voltaEm`]: volta };
  const falar = ChatMessage.getSpeaker({ actor });
  const titulo = `<strong>${escapar(p.nome)}</strong> <em>(projeto de ${TIPOS_PROJETO[p.tipo].label.toLowerCase()})</em>`;
  const rodape = `<p class="epm-dica">O projeto some e volta em ${CFG().voltaHoras} hora.</p>`;

  if (p.tipo === "dano" || p.tipo === "cura") {
    const formula = p.tipo === "dano" ? v.dano : v.cura;
    const roll = await new Roll(formula).evaluate();
    await actor.update(up);
    const alvos = [...(game.user?.targets ?? [])].map(x => x.actor?.uuid).filter(Boolean).join(",");
    const botao = p.tipo === "dano"
      ? `<button type="button" data-epm-action="dano" data-valor="${roll.total}" data-alvos="${alvos}"><i class="fa-solid fa-burst"></i> Aplicar ${roll.total} de dano</button>`
      : `<button type="button" data-epm-action="curaProjeto" data-valor="${roll.total}" data-alvos="${alvos}"><i class="fa-solid fa-heart"></i> Aplicar ${roll.total} de cura</button>`;
    return roll.toMessage({
      speaker: falar,
      flavor: `<div class="epm-chat epm-chat-nota" data-actor-uuid="${actor.uuid}" style="--cor: #C9A55A"><p>${titulo}</p>
        <div class="epm-chat-botoes">${botao}</div>${rodape}</div>`
    });
  }
  const valor = p.tipo === "soma" ? v.soma : v.protecao;
  const ate = somarTempo(t, { horas: CFG().efeitoHoras });
  up[`${P}.projetosEfeitos.${id}`] = { tipo: p.tipo, valor, ate, nome: p.nome };
  await actor.update(up);
  return ChatMessage.create({
    speaker: falar,
    content: `<div class="epm-chat epm-chat-nota" style="--cor: #C9A55A"><p>${titulo}: <strong>+${valor} ${p.tipo === "soma" ? "em todos os testes" : "de CA"}</strong> por ${CFG().efeitoHoras} hora (já somado na ficha).</p>${rodape}</div>`
  });
}

/** Apaga da lista, mas continua contando no limite do dia (some de vez quando o dia muda). */
export async function apagarProjeto(actor, id) {
  return actor.update({ [`${P}.projetos.${id}.apagado`]: true });
}

export async function encerrarEfeitoProjeto(actor, id) {
  return actor.update({ [`${P}.projetosEfeitos.-=${id}`]: null });
}

/** Livro de Projetos: guarda o projeto (nome e tipo) para recriar depois. */
export async function guardarNoLivro(actor, id) {
  const dados = actor.flags?.[FLAG] ?? {};
  const p = dados.projetos?.[id];
  if (!p) return;
  const { ficha } = estadoAtor(actor);
  const limite = limiteLivro(nivelArquetipo(dados, "artifice"), ficha.atributos?.inteligencia?.total ?? 0);
  if (!limite) return ui.notifications.warn("O Livro de Projetos libera no nível 3 de Artífice.");
  const livro = Object.values(dados.livroProjetos ?? {}).filter(Boolean);
  if (livro.some(l => l.nome === p.nome && l.tipo === p.tipo)) return ui.notifications.info(`${p.nome} já está no livro.`);
  if (livro.length >= limite) return ui.notifications.warn(`O livro está cheio (${limite}). Apague um projeto dele primeiro.`);
  await actor.update({ [`${P}.livroProjetos.${novoId()}`]: { nome: p.nome, tipo: p.tipo } });
  ui.notifications.info(`${p.nome} guardado no Livro de Projetos.`);
}

export async function apagarDoLivro(actor, id) {
  return actor.update({ [`${P}.livroProjetos.-=${id}`]: null });
}

/** Botão "Aplicar cura" do cartão do projeto: cura os alvos marcados (ou o próprio Artífice). */
export async function curaDoCartao(actor, botao) {
  const valor = Math.max(0, int(botao.dataset.valor));
  let alvos = (botao.dataset.alvos ?? "").split(",").filter(Boolean).map(u => fromUuidSync(u)).filter(Boolean);
  if (!alvos.length) alvos = [...(game.user?.targets ?? [])].map(x => x.actor).filter(Boolean);
  if (!alvos.length && actor) alvos = [actor];
  const sem = alvos.filter(a => !a.isOwner);
  if (sem.length) return ui.notifications.warn(`Só o Mestre (ou o dono) aplica a cura em ${sem.map(a => a.name).join(", ")}.`);
  for (const alvo of alvos) {
    if (alvo.flags?.[FLAG]) {
      const r = calcularRecuperacao(estadoAtor(alvo).ficha, "pv", valor, { fonte: "Projeto" });
      if (Object.keys(r.updates).length) await alvo.update(r.updates);
    } else {
      const hp = alvo.system?.attributes?.hp;
      if (hp) await alvo.update({ "system.attributes.hp.value": Math.min(int(hp.max), int(hp.value) + valor) });
    }
  }
  ui.notifications.info(`${valor} de cura em ${alvos.map(a => a.name).join(", ")}.`);
}

/* ---------------- Atualizar fichas quando o relógio anda ---------------- */

/** Instantes em que algo muda para este ator (produção termina, projeto volta, efeito acaba). */
function marcos(dados) {
  const out = [];
  for (const p of Object.values(dados.projetos ?? {})) if (p) out.push(Number(p.prontoEm) || 0, Number(p.voltaEm) || 0);
  for (const e of Object.values(dados.projetosEfeitos ?? {})) if (e) out.push(Number(e.ate) || 0);
  for (const p of Object.values(dados.producoes ?? {})) if (p && p.estado === "andamento") out.push(Number(p.fim) || 0);
  return out.filter(Boolean);
}

/** Quando o tempo do mundo (ou o Simple Calendar) avança, redesenha só as fichas em que algo virou. */
export function registrarRelogioProjetos() {
  Hooks.on("updateWorldTime", (novo, delta) => {
    const antes = novo - (Number(delta) || 0);
    const diaMudou = chaveDia(antes) !== chaveDia(novo);
    const apps = globalThis.foundry?.applications?.instances?.values?.() ?? [];
    for (const app of apps) {
      const actor = app?.actor;
      const dados = actor?.flags?.[FLAG];
      if (!dados || !app.rendered || app.document !== actor) continue;
      const temProjetos = Object.keys(dados.projetos ?? {}).length || Object.keys(dados.projetosEfeitos ?? {}).length;
      const produzindo = Object.values(dados.producoes ?? {}).some(p => p?.estado === "andamento");
      if (!temProjetos && !produzindo) continue;
      if (diaMudou || marcos(dados).some(m => m > Math.min(antes, novo) && m <= Math.max(antes, novo))) { app.render(); continue; }
      // Produção em andamento: só a aba Produção, no máximo a cada 3 s (o relógio do Simple Calendar pode andar a cada segundo)
      if (produzindo && Date.now() - (app._epmRelogio ?? 0) > 3000) { app._epmRelogio = Date.now(); app.render({ parts: ["producao"] }); }
    }
  });
}
