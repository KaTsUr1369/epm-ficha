/**
 * Pular tempo (timeskip) único para tudo o que depende de tempo ou do calendário:
 *   - treinamentos e criações da Oficina (8 h de treino por dia, divididas entre eles), sobra vira PT de estudo;
 *   - projetos do Artífice (produção, volta, Soma/Proteção e o limite do dia);
 *   - produções (receitas);
 *   - pacto quebrado (habilidades bloqueadas por horas);
 *   - Ressonância de Alma (Troca de lugar de 1 hora, manifestação, Conversa semanal e Troca mensal sem Simple Calendar);
 *   - a cena acaba (bônus de cena e por turnos) e os usos "1× por dia" voltam quando passa um dia;
 *   - descanso curto ou longo no fim, se marcado;
 *   - o Mestre pode avançar o relógio do mundo (e o Simple Calendar) junto.
 *
 * Sem mexer no relógio do mundo, a ficha "adianta" os próprios prazos (fim de produção, volta de projeto, fim da troca…)
 * pelo tempo pulado; com o relógio avançado, eles vencem sozinhos.
 */
import { FLAG, TREINO } from "./config.mjs";
import { num, int } from "./data.mjs";
import { escapar, fvtt } from "./helpers.mjs";

const P = `flags.${FLAG}`;
const COR = "#5B8DB8";
export const UNIDADES_SKIP = { minutos: { label: "minutos", horas: 1 / 60 }, horas: { label: "horas", horas: 1 }, dias: { label: "dias", horas: 24 }, semanas: { label: "semanas", horas: 168 }, meses: { label: "meses (30 dias)", horas: 720 } };

/** Horas de treino que cabem num tempo pulado: 8 h por dia inteiro, mais o que sobrar do último (até 8 h). */
export function horasDeTreino(horas) {
  const h = Math.max(0, num(horas));
  return Math.floor(h / 24) * TREINO.horasDia + Math.min(h % 24, TREINO.horasDia);
}

/** Divide as horas igualmente entre os alvos, sem passar do que falta em cada um. { chave: horas } */
export function dividirHoras(alvos, total) {
  const out = Object.fromEntries(alvos.map(a => [a.chave, 0]));
  let resto = Math.max(0, Math.floor(total));
  // quem está mais perto de terminar recebe a sobra primeiro
  let abertos = alvos.filter(a => a.total - a.feitas > 0).sort((x, y) => (x.total - x.feitas) - (y.total - y.feitas));
  while (resto > 0 && abertos.length) {
    const parte = Math.max(1, Math.floor(resto / abertos.length));
    for (const a of abertos) {
      const cabe = Math.min(parte, a.total - a.feitas - out[a.chave], resto);
      out[a.chave] += cabe;
      resto -= cabe;
      if (!resto) break;
    }
    abertos = abertos.filter(a => out[a.chave] < a.total - a.feitas);
  }
  return out;
}

/** Treinos e criações em andamento: [{ chave, tipo, id, nome, total, feitas }]. */
export async function alvosDeTreino(dados) {
  const { lerCriacao } = await import("./oficina.mjs");
  const { especiaisDaFicha } = await import("./treinamentos-lista.mjs");
  const { horasDoTreino } = await import("./mecanicas.mjs");
  const artesao = especiaisDaFicha(dados).has("mestreArtesao");
  return [
    ...Object.entries(dados.treinamentos ?? {}).filter(([, t]) => t && t.estado === "andamento").map(([id, t]) => {
      const total = horasDoTreino(t);
      return { chave: `t-${id}`, tipo: "treino", id, nome: t.nome || "Treinamento", total, feitas: Math.min(total, Math.max(0, num(t.horasFeitas))) };
    }),
    ...Object.entries(dados.criacoes ?? {}).filter(([, c]) => c).map(([id, c]) => ({ id, c: lerCriacao(id, c, { artesao }) })).filter(x => x.c.estado === "andamento").map(({ id, c }) => {
      const total = Math.max(1, Math.ceil(num(c.horas)));
      return { chave: `t-c${id}`, tipo: "criacao", id, nome: `Criação: ${c.nome || "projeto"}`, total, feitas: Math.min(total, Math.max(0, num(c.feitas))) };
    })
  ];
}

/** O que mais a ficha tem que depende de tempo (para o diálogo mostrar só o que existe). */
export function temposDaFicha(dados = {}, t = 0) {
  const projetos = Object.values(dados.projetos ?? {}).filter(Boolean);
  const producoes = Object.values(dados.producoes ?? {}).filter(p => p?.estado === "andamento");
  const pactos = Object.values(dados.pactos ?? {}).filter(p => p?.quebrado && num(p.bloqueioAte) > t);
  const res = dados.ressonancia ?? {};
  return {
    projetos: projetos.length + Object.keys(dados.projetosEfeitos ?? {}).length,
    producoes: producoes.length, pactos: pactos.length,
    troca: !!res.troca?.alma, manifestacao: !!res.manifestacao?.alma,
    usosAlma: !!(res.usos?.conversa?.usado || res.usos?.troca?.usado),
    cena: Object.values(dados.bonusCena ?? {}).some(b => b && (b.cena || b.ateTurno || num(b.turnos) > 0)),
    usosDia: Object.values(dados.usosFormas ?? {}).some(v => v === "dia")
  };
}

/**
 * Atualizações do tempo pulado (sem treino e sem descanso, que vêm à parte).
 * seg: segundos pulados; relogio: o relógio do mundo já avançou (os prazos vencem sozinhos).
 * Devolve { updates, feitos[], encerrarTroca, encerrarManifestacao }.
 */
export function efeitosDoTempo(dados = {}, { seg, horas, agora = 0, relogio = false, calendario = false }) {
  const up = {};
  const feitos = [];
  const adiantar = v => Math.max(0, num(v) - (relogio ? 0 : seg));
  // Projetos do Artífice
  const projetos = Object.entries(dados.projetos ?? {}).filter(([, p]) => p);
  if (horas >= 24 && projetos.length) {
    for (const [id] of projetos) up[`${P}.projetos.-=${id}`] = null;
    feitos.push("Projetos: dia novo (o limite do dia voltou)");
  } else if (projetos.length) {
    let n = 0;
    for (const [id, p] of projetos) {
      if (num(p.prontoEm) > agora) { up[`${P}.projetos.${id}.prontoEm`] = Math.min(num(p.prontoEm), Math.max(agora, adiantar(p.prontoEm))); n++; }
      if (num(p.voltaEm) > agora) { up[`${P}.projetos.${id}.voltaEm`] = Math.min(num(p.voltaEm), Math.max(agora, adiantar(p.voltaEm))); n++; }
    }
    if (n) feitos.push("Projetos: produção e volta andaram");
  }
  for (const [id, e] of Object.entries(dados.projetosEfeitos ?? {})) {
    if (!e) continue;
    if (adiantar(e.ate) <= agora || horas >= 24) { up[`${P}.projetosEfeitos.-=${id}`] = null; feitos.push(`${e.nome || "Efeito de projeto"} terminou`); }
    else if (!relogio) up[`${P}.projetosEfeitos.${id}.ate`] = adiantar(e.ate);
  }
  // Produções (receitas)
  for (const [id, p] of Object.entries(dados.producoes ?? {})) {
    if (p?.estado !== "andamento" || relogio) continue;
    const fim = adiantar(p.fim);
    up[`${P}.producoes.${id}.fim`] = Math.max(Math.min(num(p.fim), agora), fim);
    if (fim <= agora) feitos.push(`Produção pronta para os testes: ${p.nome || "receita"}`);
  }
  // Pacto quebrado: bloqueio por horas
  for (const [id, p] of Object.entries(dados.pactos ?? {})) {
    if (!p?.quebrado || num(p.bloqueioAte) <= agora || relogio) continue;
    const ate = adiantar(p.bloqueioAte);
    up[`${P}.pactos.${id}.bloqueioAte`] = ate <= agora ? ((agora - 1) || -1) : ate; // 0 quer dizer "até o Mestre liberar"
    if (ate <= agora && num(p.bloqueioAte) > agora) feitos.push(`Pacto: as habilidades voltaram (${p.nome || "pacto"})`);
  }
  // Ressonância de Alma
  const res = dados.ressonancia ?? {};
  const encerrarTroca = !!res.troca?.alma && !res.troca.combate && (relogio ? num(res.troca.fim) <= agora : adiantar(res.troca.fim) <= agora);
  const encerrarManifestacao = !!res.manifestacao?.alma && horas >= 1 / 60;
  if (!calendario) {
    if (res.usos?.conversa?.usado && horas >= 168) { up[`${P}.ressonancia.usos.conversa`] = {}; feitos.push("Ressonância: Conversa da semana livre de novo"); }
    if (res.usos?.troca?.usado && horas >= 720) { up[`${P}.ressonancia.usos.troca`] = {}; feitos.push("Ressonância: Troca do mês livre de novo"); }
  }
  // A cena acaba: bônus de cena, até o turno e por turnos
  for (const [id, b] of Object.entries(dados.bonusCena ?? {})) {
    if (b && (b.cena || b.ateTurno || num(b.turnos) > 0)) up[`${P}.bonusCena.-=${id}`] = null;
  }
  if (Object.keys(up).some(k => k.includes(".bonusCena.-="))) feitos.push("A cena acabou: bônus de cena saíram");
  // Passou um dia: usos "1× por dia" voltam e as horas de treino do dia zeram
  if (horas >= 24) {
    for (const [k, v] of Object.entries(dados.usosFormas ?? {})) if (v === "dia" || v === "cena" || v === "combate") up[`${P}.usosFormas.-=${k}`] = null;
    if (num(dados.treinoDia?.horas)) up[`${P}.treinoDia.horas`] = 0;
    if (num(dados.sorte?.usados)) { up[`${P}.sorte.usados`] = 0; feitos.push("Sortudo: a Sorte do dia voltou"); }
  }
  // Passou uma semana: usos "1× por semana" (Imortal Teimoso) voltam
  if (horas >= 168) for (const [k, v] of Object.entries(dados.usosFormas ?? {})) if (v === "semana") up[`${P}.usosFormas.-=${k}`] = null;
  return { updates: up, feitos, encerrarTroca, encerrarManifestacao };
}

/** Aplica o tempo pulado numa ficha. */
export async function aplicarTempo(actor, { horas, porAlvo = null, estudo = false, descanso = "nenhum", relogio = false, silencioso = false } = {}) {
  if (!actor?.isOwner) return null;
  const { agora } = await import("./projetos.mjs");
  const { chavePeriodo } = await import("./ressonancia.mjs");
  const { TREINO: T } = await import("./config.mjs");
  const dados = actor.flags?.[FLAG] ?? {};
  const seg = Math.round(horas * 3600);
  const t = agora();
  const feitos = [];
  const up = {};
  // Treino e criação
  const alvos = await alvosDeTreino(dados);
  const disponivel = horasDeTreino(horas);
  const dist = porAlvo ?? dividirHoras(alvos, disponivel);
  let usadas = 0;
  for (const a of alvos) {
    const pedidas = Math.min(Math.max(0, Math.floor(num(dist[a.chave]))), a.total - a.feitas, Math.max(0, disponivel - usadas));
    if (!pedidas) continue;
    usadas += pedidas;
    const novo = a.feitas + pedidas;
    if (a.tipo === "treino") {
      up[`${P}.treinamentos.${a.id}.horasFeitas`] = novo;
      if (novo >= a.total) up[`${P}.treinamentos.${a.id}.estado`] = "concluido";
    } else {
      up[`${P}.criacoes.${a.id}.horasFeitas`] = novo;
      if (novo >= a.total) up[`${P}.criacoes.${a.id}.estado`] = "pronto";
    }
    feitos.push(`${a.nome}: +${pedidas} h${novo >= a.total ? (a.tipo === "treino" ? " (concluído!)" : " (pronto para o teste)") : ` (${novo} de ${a.total} h)`}`);
  }
  const sobra = Math.max(0, disponivel - usadas);
  if (estudo && sobra >= T.acao.horas) {
    const { estadoAtor } = await import("./mecanicas.mjs");
    const pt = Math.floor(sobra / T.acao.horas) * T.acao.pt;
    up[`${P}.pontos.pt`] = estadoAtor(actor).ficha.pontos.pt + pt;
    feitos.push(`Estudo: +${pt} PT (${Math.floor(sobra / T.acao.horas) * T.acao.horas} h)`);
  }
  // Tudo o mais que depende de tempo
  const ef = efeitosDoTempo(dados, { seg, horas, agora: t, relogio, calendario: !!chavePeriodo("semana") });
  Object.assign(up, ef.updates);
  feitos.push(...ef.feitos);
  if (Object.keys(up).length) await actor.update(up);
  if (ef.encerrarManifestacao) { const R = await import("./ressonancia.mjs"); await R.encerrarManifestacao(actor); feitos.push("Ressonância: a alma se recolheu"); }
  if (ef.encerrarTroca) {
    const { pedirAoMestre } = await import("./mundo.mjs");
    await pedirAoMestre("ressonancia", { acao: "encerrar", ator: actor.uuid, motivo: "passou o tempo" });
    feitos.push("Ressonância: a troca de lugar acabou");
  }
  if (!silencioso) {
    const qtd = horas >= 24 ? `${Math.round((horas / 24) * 10) / 10} dia(s)` : horas >= 1 ? `${Math.round(horas * 10) / 10} h` : `${Math.round(horas * 60)} min`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="epm-chat epm-chat-nota epm-chat-treino" style="--epm-cor-cartao:${COR}"><p><i class="fa-solid fa-forward" aria-hidden="true"></i> <strong>${escapar(actor.name)}</strong>: passou ${qtd}${relogio ? " (relógio do mundo)" : ""}.</p>
        ${feitos.length ? `<ul>${feitos.map(f => `<li>${escapar(f)}</li>`).join("")}</ul>` : `<p class="epm-dica">Nada dependia desse tempo.</p>`}</div>`
    });
  }
  // Descanso por último (abre o diálogo de sempre)
  if (descanso === "curto" || descanso === "longo") {
    const { descanso: descansar } = await import("./mecanicas.mjs");
    await descansar(actor, descanso);
  }
  return feitos;
}

const opcoesHtml = (lista, atual) => lista.map(([v, l]) => `<option value="${v}" ${v === atual ? "selected" : ""}>${escapar(l)}</option>`).join("");

/** Diálogo da ficha: quanto tempo, como dividir o treino e o que mais acontece. */
export async function dialogoPularTempo(actor, { unidade = "horas", qtd = 8 } = {}) {
  if (!actor?.isOwner) return null;
  const dados = actor.flags?.[FLAG] ?? {};
  const { agora } = await import("./projetos.mjs");
  const alvos = await alvosDeTreino(dados);
  const tem = temposDaFicha(dados, agora());
  const gm = !!game.user?.isGM;
  const linhas = alvos.map(a => `<label class="epm-campo epm-pular-linha"><span>${escapar(a.nome)} <em class="epm-dica">faltam ${a.total - a.feitas} h</em></span>
      <input type="number" min="0" step="1" name="${a.chave}" data-falta="${a.total - a.feitas}" value="0"></label>`).join("");
  const outros = [
    tem.projetos ? "projetos do Artífice" : "", tem.producoes ? "produções" : "", tem.pactos ? "bloqueio de pacto" : "",
    tem.troca ? "Troca de lugar" : "", tem.manifestacao ? "manifestação da alma" : "", tem.usosAlma ? "usos da Ressonância" : "",
    tem.cena ? "bônus de cena" : "", tem.usosDia ? "usos por dia" : ""
  ].filter(Boolean);
  const r = await fvtt.DialogV2.wait({
    window: { title: `Pular tempo: ${actor.name}` }, classes: ["epm-dialogo", "epm-pular-tempo"], rejectClose: false, modal: true,
    content: `<p class="epm-dica">Para quando o tempo passa fora de cena. Vale para tudo o que depende de tempo: treinos e criações (${TREINO.horasDia} h de treino por dia), projetos do Artífice, produções, pacto, Ressonância, bônus de cena e usos por dia.</p>
      <div class="epm-dialogo-linha"><label class="epm-campo"><span>Quanto tempo passou</span><input type="number" min="0" step="any" name="qtd" value="${qtd}"></label>
      <label class="epm-campo"><span>Unidade</span><select name="unidade">${opcoesHtml(Object.entries(UNIDADES_SKIP).map(([k, u]) => [k, u.label]), unidade)}</select></label></div>
      <p class="epm-dica epm-pular-total">= <strong data-total-horas></strong> h; até <strong data-treino-horas></strong> h de treino.</p>
      ${alvos.length ? `<fieldset class="epm-aquisicao"><legend>Treinos e criações em andamento</legend>
        <label class="epm-check"><input type="radio" name="modo" value="auto" checked> Dividir igualmente</label>
        <label class="epm-check"><input type="radio" name="modo" value="manual"> Escolher quanto vai para cada um</label>
        <div data-manual hidden>${linhas}</div></fieldset>` : `<p class="epm-dica">Nenhum treino ou criação em andamento.</p>`}
      <label class="epm-check"><input type="checkbox" name="estudo" ${alvos.length ? "" : "checked"}> As horas de treino que sobrarem viram PT de estudo (${TREINO.acao.pt} PT a cada ${TREINO.acao.horas} h)</label>
      ${outros.length ? `<p class="epm-dica">Também anda: ${escapar(outros.join(", "))}.</p>` : ""}
      <label class="epm-campo"><span>No fim</span><select name="descanso">${opcoesHtml([["nenhum", "Sem descanso"], ["curto", "Descanso curto"], ["longo", "Descanso longo"]], "nenhum")}</select></label>
      ${gm ? `<label class="epm-check"><input type="checkbox" name="relogio"> Avançar também o relógio do mundo (e o Simple Calendar) para todos</label>` : ""}`,
    render: (ev, dlg) => {
      const raiz = dlg?.element ?? ev?.target?.element ?? ev?.target;
      const el = raiz?.querySelector ? raiz : document;
      const horas = () => Math.max(0, num(el.querySelector('[name="qtd"]')?.value) * (UNIDADES_SKIP[el.querySelector('[name="unidade"]')?.value]?.horas ?? 1));
      const atualizar = () => {
        const h = horas();
        el.querySelector("[data-total-horas]").textContent = String(Math.round(h * 10) / 10);
        el.querySelector("[data-treino-horas]").textContent = String(horasDeTreino(h));
        const d = dividirHoras(alvos, horasDeTreino(h));
        if (el.querySelector('[name="modo"]:checked')?.value !== "manual") for (const a of alvos) { const i = el.querySelector(`[name="${a.chave}"]`); if (i) i.value = String(d[a.chave] ?? 0); }
      };
      el.querySelector('[name="qtd"]')?.addEventListener("input", atualizar);
      el.querySelector('[name="unidade"]')?.addEventListener("change", atualizar);
      for (const m of el.querySelectorAll('[name="modo"]')) m.addEventListener("change", () => { el.querySelector("[data-manual]").hidden = el.querySelector('[name="modo"]:checked')?.value !== "manual"; atualizar(); });
      atualizar();
    },
    buttons: [
      { action: "ok", label: "Pular", icon: "fa-solid fa-forward", default: true, callback: (ev, b) => {
        const f = b.form.elements;
        const horas = Math.max(0, num(f.qtd?.value) * (UNIDADES_SKIP[f.unidade?.value]?.horas ?? 1));
        const manual = b.form.querySelector('[name="modo"]:checked')?.value === "manual";
        return { horas, porAlvo: manual ? Object.fromEntries(alvos.map(a => [a.chave, num(f[a.chave]?.value)])) : null, estudo: !!f.estudo?.checked, descanso: f.descanso?.value ?? "nenhum", relogio: !!f.relogio?.checked };
      } },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object" || !r.horas) return null;
  if (r.relogio && gm) await avancarRelogio(r.horas);
  return aplicarTempo(actor, r);
}

/** Avança o relógio do mundo (e o Simple Calendar). Só o Mestre. */
export async function avancarRelogio(horas) {
  if (!game.user?.isGM) return false;
  const { somarTempo, agora } = await import("./projetos.mjs");
  const t = agora();
  const fim = somarTempo(t, { horas });
  await game.time.advance(Math.max(0, fim - t));
  return true;
}

/** Escudo: pula o tempo para o grupo (relógio do mundo e as fichas escolhidas, com o treino dividido igualmente). */
export async function pularTempoGrupo() {
  if (!game.user?.isGM) return;
  const pjs = game.actors.filter(a => a.type === "character" && a.flags?.[FLAG]).sort((x, y) => Number(!!y.hasPlayerOwner) - Number(!!x.hasPlayerOwner));
  const r = await fvtt.DialogV2.wait({
    window: { title: "Pular tempo (grupo)" }, classes: ["epm-dialogo", "epm-pular-tempo"], rejectClose: false, modal: true,
    content: `<p class="epm-dica">Passa o tempo para todo mundo: o relógio do mundo (e o Simple Calendar) e, nas fichas marcadas, treinos e criações (${TREINO.horasDia} h por dia, divididas igualmente), projetos, produções, pactos, Ressonância, bônus de cena e usos por dia.</p>
      <div class="epm-dialogo-linha"><label class="epm-campo"><span>Quanto tempo passou</span><input type="number" min="0" step="any" name="qtd" value="1"></label>
      <label class="epm-campo"><span>Unidade</span><select name="unidade">${opcoesHtml(Object.entries(UNIDADES_SKIP).map(([k, u]) => [k, u.label]), "dias")}</select></label></div>
      <label class="epm-check"><input type="checkbox" name="relogio" checked> Avançar o relógio do mundo</label>
      <fieldset class="epm-aquisicao"><legend>Fichas</legend>${pjs.map(a => `<label class="epm-check"><input type="checkbox" name="a_${a.id}" ${a.hasPlayerOwner ? "checked" : ""}> ${escapar(a.name)}</label>`).join("") || `<p class="epm-dica">Nenhum personagem.</p>`}</fieldset>
      <label class="epm-check"><input type="checkbox" name="estudo" checked> As horas de treino que sobrarem viram PT de estudo</label>
      <label class="epm-campo"><span>No fim</span><select name="descanso">${opcoesHtml([["nenhum", "Sem descanso"], ["curto", "Descanso curto"], ["longo", "Descanso longo"]], "nenhum")}</select></label>`,
    buttons: [
      { action: "ok", label: "Pular", icon: "fa-solid fa-forward", default: true, callback: (ev, b) => {
        const f = b.form.elements;
        return { horas: Math.max(0, num(f.qtd?.value) * (UNIDADES_SKIP[f.unidade?.value]?.horas ?? 1)), relogio: !!f.relogio?.checked, estudo: !!f.estudo?.checked, descanso: f.descanso?.value ?? "nenhum", atores: pjs.filter(a => f[`a_${a.id}`]?.checked) };
      } },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object" || !r.horas) return;
  if (r.relogio) await avancarRelogio(r.horas);
  for (const a of r.atores) await aplicarTempo(a, { horas: r.horas, estudo: r.estudo, descanso: r.descanso, relogio: r.relogio });
  ui.notifications.info(`Tempo pulado: ${Math.round(r.horas * 10) / 10} h${r.atores.length ? ` para ${r.atores.map(a => a.name).join(", ")}` : ""}.`);
  return r.atores.length;
}

export { int };
