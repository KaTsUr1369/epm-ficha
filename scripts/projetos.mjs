/**
 * Projetos do Artífice (reformulado): reserva de Projetos de Criação, Grau, Livro de Projetos (receitas),
 * Consumíveis (1 Projeto, duram até ser usados) e Engenhocas (ocupam Projetos e duram cenas).
 * Os itens fabricados vão para o inventário com flags.epm-ficha.projeto.
 *
 * Também guarda o relógio usado pela Produção (agora, somarTempo, textoDuracao), que segue o Simple Calendar.
 */
import { FLAG } from "./config.mjs";
import { int, novoId } from "./data.mjs";
import { fvtt, escapar } from "./helpers.mjs";
import {
  ARQUETIPOS, TIPOS_PROJETO, nivelArquetipo, criacaoDe, valoresDoGrau, grauRomano, montagemDe, encantadosDe, dadoUtensilios
} from "./arquetipos.mjs";
import { RECEITAS_ARTIFICE, receitaPorId, grauMinimo, normalizarReceita } from "./receitas-artifice.mjs";
import { estadoAtor, calcularRecuperacao, confirmar } from "./mecanicas.mjs";

const P = `flags.${FLAG}`;
const COR = ARQUETIPOS.artifice.cor;

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

/** Produção em andamento: redesenha a aba Produção quando o relógio anda (no máximo a cada 3 s). */
export function registrarRelogioProjetos() {
  Hooks.on("updateWorldTime", (novo, delta) => {
    const antes = novo - (Number(delta) || 0);
    const apps = globalThis.foundry?.applications?.instances?.values?.() ?? [];
    for (const app of apps) {
      const actor = app?.actor;
      const dados = actor?.flags?.[FLAG];
      if (!dados || !app.rendered || app.document !== actor) continue;
      const prod = Object.values(dados.producoes ?? {}).filter(p => p?.estado === "andamento");
      if (!prod.length) continue;
      if (prod.some(p => { const m = Number(p.fim) || 0; return m > Math.min(antes, novo) && m <= Math.max(antes, novo); })) { app.render(); continue; }
      if (Date.now() - (app._epmRelogio ?? 0) > 3000) { app._epmRelogio = Date.now(); app.render({ parts: ["producao"] }); }
    }
  });
}

/* ---------------- Estado ---------------- */

const flagProjeto = item => item?.flags?.[FLAG]?.projeto ?? null;

/**
 * CD de Projeto = 10 + Inteligência + metade (para baixo) do bônus da perícia do Projeto sem o atributo
 * (pontos + Outros + bônus). Ex.: Int 6, Ofício 5 pontos e +3 em Outros → 10 + 6 + 8/2 = 20.
 */
export function cdDeProjeto(inteligencia, pericia) {
  const bonus = Math.floor(Number(pericia?.bonusProprio ?? (int(pericia?.pontos) + int(pericia?.outros) + int(pericia?.mod))) || 0);
  return 10 + (Number(inteligencia) || 0) + Math.floor(bonus / 2);
}
const listaItens = actor => actor?.items?.contents ?? [...(actor?.items ?? [])];

/** Livro de Projetos da ficha (receitas conhecidas, já normalizadas). */
export function livroDaFicha(dados = {}) {
  return Object.entries(dados.artificeLivro ?? {}).filter(([, r]) => r).map(([chave, r]) => {
    const base = r.receita ? receitaPorId(r.receita) : null;
    return { chave, ...normalizarReceita({ ...(base ?? {}), ...r, id: r.receita || chave }), temporaria: !!r.temporaria };
  });
}

/**
 * Situação do Artífice: reserva, o que as Engenhocas ocupam, Consumíveis carregados, Livro e itens.
 * `ficha` = calcularFicha (para a Inteligência e o Ofício).
 */
export function estadoArtifice(actor, ficha = null) {
  const dados = actor?.flags?.[FLAG] ?? {};
  if (!nivelArquetipo(dados, "artifice")) return null;
  return estadoArtificeDe(dados, ficha ?? estadoAtor(actor).ficha, listaItens(actor));
}

/** O mesmo, só com dados (para o contexto da ficha). */
export function estadoArtificeDe(dados, f, todosItens = []) {
  const nivel = nivelArquetipo(dados, "artifice");
  if (!nivel) return null;
  const intel = f.atributos?.inteligencia?.total ?? 0;
  const cri = criacaoDe(nivel, intel, dados.ajustesBonus);
  const itens = todosItens.filter(i => flagProjeto(i));
  const engenhocas = itens.filter(i => flagProjeto(i).categoria === "engenhoca");
  const consumiveis = itens.filter(i => flagProjeto(i).categoria !== "engenhoca");
  const ocupados = engenhocas.reduce((s, i) => s + Math.max(0, int(flagProjeto(i).ocupa, 1)), 0)
    + Object.values(dados.projetosEnviados ?? {}).reduce((s, e) => s + Math.max(0, int(e?.ocupa, 1)), 0);
  const gastos = Math.max(0, int(dados.projetosCriacao?.gastos));
  const carregados = consumiveis.reduce((s, i) => s + Math.max(1, int(i.system?.quantity, 1)), 0);
  // Perícia do Projeto: Ofício (padrão) ou Tecnologia
  const periciaProjeto = dados.arquetipoOpcoes?.artifice?.periciaProjeto === "tecnologia" ? "tecnologia" : "oficio";
  const per = f.periciaPorId?.[periciaProjeto];
  const oficio = Math.floor(Number(per?.total) || 0);
  const cd = cdDeProjeto(intel, per);
  const livro = livroDaFicha(dados);
  const enviados = Object.entries(dados.projetosEnviados ?? {}).filter(([, e]) => e && typeof e === "object").map(([id, e]) => ({ id, ...e }));
  return {
    nivel, intel, criacao: cri, ocupados, gastos, disponivel: Math.max(0, cri.projetos - ocupados - gastos),
    carregados, podeCarregar: carregados < cri.carregar, cd, oficio, periciaProjeto, periciaNome: per?.nome ?? (periciaProjeto === "tecnologia" ? "Tecnologia" : "Ofício"),
    bonusPericia: per ? Math.floor(Number(per.bonusProprio) || 0) : 0, enviados,
    livro, livroCheio: livro.filter(r => !r.temporaria).length >= cri.livro,
    sobrecarga: nivel >= ARQUETIPOS.artifice.sobrecargaNivel, menteInventora: nivel >= ARQUETIPOS.artifice.menteInventora,
    montagem: montagemDe(nivel), encantados: encantadosDe(nivel), utensilios: dadoUtensilios(nivel),
    engenhocas, consumiveis
  };
}

/* ---------------- Livro de Projetos ---------------- */

/** Põe uma receita no Livro (pronta, pelo id, ou escrita: objeto). `temporaria` = Engenharia Reversa (fora do limite). */
export async function aprenderReceita(actor, receita, { temporaria = false } = {}) {
  const est = estadoArtifice(actor);
  if (!est) return ui.notifications.warn("O Livro de Projetos é do Artífice.");
  const r = typeof receita === "string" ? receitaPorId(receita) : receita;
  if (!r) return;
  if (!temporaria && est.livroCheio) return ui.notifications.warn(`Livro de Projetos cheio (${est.criacao.livro} receitas). Tire uma para trocar (1 por Descanso Longo).`);
  const id = r.id && receitaPorId(r.id) ? r.id : "";
  if (id && est.livro.some(l => l.id === id)) return ui.notifications.info(`${r.nome} já está no Livro.`);
  const dados = id ? { receita: id, temporaria } : { ...normalizarReceita(r), propria: true, temporaria };
  await actor.update({ [`${P}.artificeLivro.${novoId()}`]: dados });
  ui.notifications.info(`${r.nome} entrou no Livro de Projetos${temporaria ? " (temporária, até o próximo Descanso Longo)" : ""}.`);
}

export async function esquecerReceita(actor, chave) {
  return actor.update({ [`${P}.artificeLivro.-=${chave}`]: null });
}

/** Escolher uma receita pronta para o Livro (ou escrever uma nova). */
export async function escolherReceita(actor) {
  const est = estadoArtifice(actor);
  if (!est) return;
  const ja = new Set(est.livro.map(r => r.id));
  const opc = cat => RECEITAS_ARTIFICE.filter(r => r.categoria === cat && !ja.has(r.id))
    .map(r => `<option value="${r.id}">${escapar(r.nome)} [${escapar(TIPOS_PROJETO[r.tipo]?.label ?? r.tipo)}]</option>`).join("");
  const r = await fvtt.DialogV2.wait({
    window: { title: "Livro de Projetos: nova receita" }, classes: ["epm-dialogo"], rejectClose: false, modal: true, position: { width: 520 },
    content: `<p class="epm-dica">${est.livro.filter(x => !x.temporaria).length} de ${est.criacao.livro} receitas. O Livro precisa de pelo menos 1 Consumível e 1 Engenhoca. A cada Descanso Longo dá para trocar 1 receita.</p>
      <label class="epm-campo"><span>Receita pronta</span><select name="receita"><optgroup label="Consumíveis">${opc("consumivel")}</optgroup><optgroup label="Engenhocas">${opc("engenhoca")}</optgroup></select></label>`,
    buttons: [
      { action: "ok", label: "Pôr no Livro", icon: "fa-solid fa-book", default: true, callback: (ev, b) => b.form.elements.receita.value },
      { action: "nova", label: "Escrever uma receita", icon: "fa-solid fa-pen" },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (r === "nova") return escreverReceita(actor);
  if (r && r !== "cancelar") return aprenderReceita(actor, r);
}

/** Receita nova escrita pelo jogador ou pelo Mestre (valores por Grau). */
export async function escreverReceita(actor) {
  const r = await fvtt.DialogV2.wait({
    window: { title: "Escrever receita" }, classes: ["epm-dialogo"], rejectClose: false, modal: true, position: { width: 560 },
    content: `<p class="epm-dica">No mesmo padrão das receitas do livro (o Mestre aprova). Use "Int." para a Inteligência; "—" num Grau que não dá para fabricar.</p>
      <label class="epm-campo"><span>Nome</span><input type="text" name="nome" placeholder="Ex.: Arpéu Magnético"></label>
      <div class="epm-dialogo-linha">
        <label class="epm-campo"><span>Categoria</span><select name="categoria"><option value="consumivel">Consumível</option><option value="engenhoca">Engenhoca</option></select></label>
        <label class="epm-campo"><span>Tipo</span><select name="tipo">${Object.entries(TIPOS_PROJETO).map(([id, t]) => `<option value="${id}">${t.label}</option>`).join("")}</select></label>
      </div>
      <label class="epm-campo"><span>Uso</span><input type="text" name="uso" placeholder="Ação Padrão, Reação, Passivo…"></label>
      <label class="epm-campo"><span>Efeito</span><textarea name="efeito" rows="3"></textarea></label>
      <div class="epm-dialogo-linha">${[1, 2, 3, 4, 5].map(g => `<label class="epm-campo epm-campo-mini"><span>Grau ${grauRomano(g)}</span><input type="text" name="v${g}"></label>`).join("")}</div>`,
    buttons: [
      { action: "ok", label: "Pôr no Livro", icon: "fa-solid fa-book", default: true, callback: (ev, b) => {
        const f = b.form.elements;
        return { nome: f.nome.value, categoria: f.categoria.value, tipo: f.tipo.value, uso: f.uso.value, efeito: f.efeito.value, valores: [1, 2, 3, 4, 5].map(g => f[`v${g}`].value) };
      } },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object" || !String(r.nome).trim()) return;
  return aprenderReceita(actor, { ...r, propria: true });
}

/* ---------------- Fabricar ---------------- */

/**
 * Fabrica um Projeto do Livro. Consumível: custa 1 Projeto. Engenhoca: ocupa os Projetos do Grau enquanto existir.
 * `montagem` = Montagem em Campo (Consumível no meio da cena, com a ação do nível).
 */
export async function fabricarProjeto(actor, chave, { montagem = false } = {}) {
  const est = estadoArtifice(actor);
  if (!est) return;
  const r = est.livro.find(x => x.chave === chave);
  if (!r) return ui.notifications.warn("Receita não encontrada no Livro.");
  if (montagem && r.categoria === "engenhoca") return ui.notifications.warn("Engenhocas só são montadas em Descanso Curto ou Longo.");
  const gMin = grauMinimo(r);
  if (gMin > est.criacao.grauMax) return ui.notifications.warn(`${r.nome} pede Grau ${grauRomano(gMin)}; o seu máximo é ${grauRomano(est.criacao.grauMax)}.`);
  const graus = Array.from({ length: est.criacao.grauMax - gMin + 1 }, (_, i) => gMin + i);
  const escolha = await fvtt.DialogV2.wait({
    window: { title: `${montagem ? "Montagem em Campo" : "Fabricar"}: ${r.nome}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true, position: { width: 520 },
    content: `<p class="epm-dica">${escapar(r.efeito)}</p>
      <label class="epm-campo"><span>Grau</span><select name="grau">${graus.map(g => {
        const v = valoresDoGrau(g, est.intel);
        return `<option value="${g}" ${g === est.criacao.grauMax ? "selected" : ""}>Grau ${grauRomano(g)}: ${escapar(r.valores[g - 1])}${r.categoria === "engenhoca" ? ` · ${v.cenas} cenas, ocupa ${v.ocupa}` : ""}</option>`;
      }).join("")}</select></label>
      ${r.rolar?.escolha ? `<label class="epm-campo"><span>Tipo</span><select name="variante">${r.rolar.escolha.map(e => `<option>${escapar(e)}</option>`).join("")}</select></label>` : ""}
      ${r.categoria === "engenhoca" ? `<label class="epm-campo" title="Com portador, funciona a qualquer distância; sem portador, para depois de 1 dia longe do Artífice"><span>Portador</span><input type="text" name="portador" value="${escapar(actor.name)}"></label>` : ""}
      <p class="epm-dica">Reserva: ${est.disponivel} de ${est.criacao.projetos} Projetos em aberto${montagem && est.montagem ? ` · Montagem em Campo: ${escapar(est.montagem.label)}` : ""}.</p>`,
    buttons: [
      { action: "ok", label: montagem ? "Montar" : "Fabricar", icon: "fa-solid fa-screwdriver-wrench", default: true, callback: (ev, b) => {
        const f = b.form.elements;
        return { grau: int(f.grau.value, est.criacao.grauMax), variante: f.variante?.value ?? "", portador: f.portador?.value ?? "" };
      } },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!escolha || typeof escolha !== "object") return null;
  const v = valoresDoGrau(escolha.grau, est.intel);
  const custo = r.categoria === "engenhoca" ? v.ocupa : 1;
  if (est.disponivel < custo) return ui.notifications.warn(`Faltam Projetos de Criação: precisa de ${custo}, tem ${est.disponivel} em aberto.`);
  if (r.categoria !== "engenhoca" && !est.podeCarregar) return ui.notifications.warn(`Consumíveis carregados no máximo (${est.criacao.carregar}, 2× seus Projetos).`);
  const updAtor = {};
  if (r.categoria !== "engenhoca") updAtor[`${P}.projetosCriacao.gastos`] = est.gastos + 1;
  if (montagem && est.montagem) {
    const acao = est.montagem.acao;
    if (acao === "livre") {
      if (actor.flags?.[FLAG]?.usos?.linhaMontagemTurno) return ui.notifications.warn("Linha de Montagem: ação livre só 1×/turno.");
      updAtor[`${P}.usos.linhaMontagemTurno`] = true;
    } else updAtor[`${P}.acoes.${acao}`] = true;
  }
  const nome = `${r.nome}${escolha.variante ? ` (${escolha.variante})` : ""} · Grau ${v.romano}`;
  const projeto = {
    receita: r.id, chaveLivro: chave, nome: r.nome, categoria: r.categoria, tipo: r.tipo, grau: v.grau, variante: escolha.variante,
    ...(r.categoria === "engenhoca" ? { cenas: v.cenas, cenasMax: v.cenas, ocupa: v.ocupa, portador: escolha.portador.trim() } : {})
  };
  const doc = {
    name: nome, type: r.categoria === "engenhoca" ? "equipment" : "consumable", img: r.categoria === "engenhoca" ? "icons/svg/clockwork.svg" : "icons/svg/explosion.svg",
    system: { quantity: 1, description: { value: `<p><strong>${escapar(r.uso)}</strong>. ${escapar(r.efeito)}</p><p><strong>Grau ${v.romano}:</strong> ${escapar(r.valores[v.grau - 1] ?? "")}</p>` } },
    flags: { [FLAG]: { projeto, categoria: r.categoria === "engenhoca" ? "ferramentas" : "consumiveis" } }
  };
  if (Object.keys(updAtor).length) await actor.update(updAtor);
  const [criado] = await actor.createEmbeddedDocuments("Item", [doc]);
  await cartao(actor, `<p><strong>${montagem ? "Montagem em Campo" : "Fabricou"}:</strong> ${escapar(nome)}${r.categoria === "engenhoca" ? ` (ocupa ${v.ocupa} Projeto${v.ocupa > 1 ? "s" : ""}, ${v.cenas} cenas)` : " (1 Projeto)"}.</p>`);
  return criado;
}

/* ---------------- Usar ---------------- */

const cartao = (actor, html, botoes = "") => ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor }),
  content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:${COR}" data-actor-uuid="${actor.uuid}">${html}${botoes ? `<div class="epm-chat-botoes">${botoes}</div>` : ""}</div>`,
  flags: { [FLAG]: { tipo: "ataque" } }
});

const alvosMarcados = () => [...(game.user?.targets ?? [])].map(t => t.actor).filter(Boolean);

/**
 * Usa um Projeto do inventário. Consumível: some (ou −1). Engenhoca: gasta 1 cena só na primeira ativação da cena.
 * `sobrecarga` (Nv. 3): a Engenhoca funciona 1 Grau acima e perde 1 cena (no Nv. 50 é sempre, sem perder cena).
 */
export async function usarProjeto(actor, itemId, { sobrecarga = false } = {}) {
  const item = actor.items.get(itemId);
  const pj = flagProjeto(item);
  if (!pj) return;
  // Engenhoca enviada por um Artífice: usa os números dele (Inteligência, CD, Livro)
  const criador = pj.artificeId && pj.artificeId !== actor.id ? game.actors.get(pj.artificeId) : null;
  const est = (criador ? estadoArtifice(criador) : null) ?? estadoArtifice(actor);
  const dados = actor.flags?.[FLAG] ?? {};
  const eng = pj.categoria === "engenhoca";
  const receita = est?.livro.find(r => r.chave === pj.chaveLivro || (pj.receita && r.id === pj.receita)) ?? normalizarReceita(receitaPorId(pj.receita) ?? { nome: pj.nome });
  if (eng && int(pj.cenas) <= 0) return ui.notifications.warn(`${item.name} está Quebrada: use o Reparo Rápido ou espere o descanso.`);
  const mente = !!est?.menteInventora;
  const sobre = eng && (mente || (sobrecarga && est?.sobrecarga));
  const grau = int(pj.grau, 1) + (sobre ? 1 : 0);
  const v = valoresDoGrau(grau, est?.intel ?? 0);
  const updItem = {};
  const avisos = [];
  if (eng) {
    const chaveCena = `eng-${item.id}`;
    let cenas = int(pj.cenas);
    if (!dados.usosFormas?.[chaveCena]) { cenas -= 1; await actor.update({ [`${P}.usosFormas.${chaveCena}`]: "cena" }); avisos.push("gastou 1 cena (primeira ativação nesta cena)"); }
    if (sobre && !mente) { cenas -= 1; avisos.push("Sobrecarga: −1 cena"); }
    if (sobre) avisos.push(`funciona como Grau ${v.romano}`);
    updItem[`flags.${FLAG}.projeto.cenas`] = Math.max(0, cenas);
    if (cenas <= 0) avisos.push("ficou Quebrada");
  }
  // Valor do Grau para o cartão
  const iG = Math.min(5, grau) - 1;
  const valorTexto = receita.valores?.[iG] ?? "";
  const md = receita.rolar?.modo ?? "nota";
  const cd = est?.cd ?? 10;
  const enc = est?.encantados;
  let html = `<p><strong>${escapar(item.name)}</strong>${sobre ? ` <em>(Grau ${v.romano})</em>` : ""}: ${escapar(receita.efeito)}</p><p>${escapar(valorTexto)}${grau > 5 ? ` (acima do Grau V: +2 dados ou +2)` : ""}</p>`;
  let botoes = "";
  const alvos = alvosMarcados();
  const formulaDano = () => {
    if (receita.rolar?.dados) { const d = receita.rolar.dados[iG]; return grau > 5 ? d.replace(/^(\d+)d/, (m, n) => `${Number(n) + 2 * (grau - 5)}d`) : d; }
    return receita.rolar?.dano === "danoArea" ? v.danoArea : v.dano;
  };
  if (md === "ataque") {
    const atk = await new Roll(`1d20 + ${est?.oficio ?? 0}`).evaluate();
    const nomePer = est?.periciaNome ?? "Ofício";
    const dmg = await new Roll(`${formulaDano()}${enc ? ` + ${enc.dano}` : ""}`).evaluate();
    html += `<p>Ataque (d20 + ${escapar(nomePer)}): <strong>${atk.total}</strong>${atk.dice[0]?.total === 20 ? " (20 natural)" : ""} · Dano: <strong>${dmg.total}</strong> ${escapar(receita.rolar?.tipoDano ?? "")}${enc ? ` (com Itens Encantados ${enc.dano}, 1×/turno)` : ""}</p>`;
    botoes += `<button type="button" data-epm-action="dano" data-valor="${dmg.total}" ${alvos.length ? `data-alvos="${alvos.map(a => a.uuid).join(",")}"` : ""} data-tipo-dano="${escapar(receita.rolar?.tipoDano ?? "")}" data-rotulo="${escapar(item.name)}"><i class="fa-solid fa-burst"></i> Aplicar ${dmg.total} de dano</button>`;
  } else if (md === "area") {
    const dmg = await new Roll(formulaDano()).evaluate();
    html += `<p>Dano: <strong>${dmg.total}</strong>${receita.rolar?.metade ? " (metade com Reflexo)" : ""} · CD de Projeto ${cd}.</p>`;
    botoes += `<button type="button" data-epm-action="dano" data-valor="${dmg.total}" ${alvos.length ? `data-alvos="${alvos.map(a => a.uuid).join(",")}"` : ""} data-tipo-dano="${escapar(receita.rolar?.tipoDano ?? escolhaTipo(pj))}" data-rotulo="${escapar(item.name)}"><i class="fa-solid fa-burst"></i> Aplicar ${dmg.total}</button>`;
    if (receita.rolar?.metade) botoes += `<button type="button" data-epm-action="dano" data-valor="${Math.floor(dmg.total / 2)}" data-rotulo="${escapar(item.name)} (metade)"><i class="fa-solid fa-burst"></i> Metade (${Math.floor(dmg.total / 2)})</button>`;
    botoes += botoesResistencia(receita.rolar?.resistencia, cd, item.name, alvos);
  } else if (md === "resist") {
    html += `<p>CD de Projeto ${cd}.</p>`;
    botoes += botoesResistencia(receita.rolar?.resistencia, cd, item.name, alvos);
  } else if (md === "cura") {
    const rec = receita.rolar?.recurso ?? "pv";
    const roll = await new Roll(`${v.cura}${rec === "pv" && enc ? ` + ${enc.cura}` : ""}`).evaluate();
    html += `<p>${rec === "pe" ? "Recupera" : "Cura"}: <strong>${roll.total}</strong> ${rec.toUpperCase()}${rec === "pv" && enc ? ` (Itens Encantados +${enc.cura})` : ""}.</p>`;
    if (rec === "pv") botoes += `<button type="button" data-epm-action="curaProjeto" data-valor="${roll.total}" ${alvos.length ? `data-alvos="${alvos.map(a => a.uuid).join(",")}"` : ""} data-rotulo="${escapar(item.name)}"><i class="fa-solid fa-heart"></i> Aplicar ${roll.total} de cura</button>`;
  } else if (receita.rolar?.valor) {
    const val = v[receita.rolar.valor];
    const aux = (receita.tipo === "soma" || receita.tipo === "protecao") && enc ? enc.auxilio : 0;
    html += `<p>Valor no Grau ${v.romano}: <strong>${typeof val === "number" ? `+${val + aux}` : escapar(val)}</strong>${aux ? ` (Itens Encantados: Auxílio +${aux})` : ""}.</p>`;
  }
  if (avisos.length) html += `<p class="epm-dica">${escapar(avisos.join(" · "))}.</p>`;
  if (eng) { if (Object.keys(updItem).length) await item.update(updItem); }
  else {
    const qtd = int(item.system?.quantity, 1);
    if (qtd > 1) await item.update({ "system.quantity": qtd - 1 }); else await item.delete();
  }
  return cartao(actor, html, botoes);
}

const escolhaTipo = pj => ({ Fogo: "Fogo", Frio: "Gelo", "Relâmpago": "Elétrico", "Água": "Água" })[pj?.variante] ?? "";

function botoesResistencia(pericia, cd, rotulo, alvos) {
  if (!pericia) return "";
  const nome = { reflexos: "Reflexo", fortitude: "Fortitude", vontade: "Vontade" }[pericia] ?? pericia;
  const lista = alvos.length ? alvos : [null];
  return lista.map(a => `<button type="button" data-epm-action="resistir" data-pericia="${pericia}" data-dt="${cd}"${a ? ` data-defensor="${escapar(a.uuid)}"` : ""} data-rotulo="${escapar(rotulo)}"><i class="fa-solid fa-shield-heart"></i> ${nome} CD ${cd}${a ? `: ${escapar(a.name)}` : ""}</button>`).join("");
}

/** Reparo Rápido: Ação Bônus e 5 PE, a Engenhoca recupera 1 cena (1× por cena por Engenhoca). */
export async function repararEngenhoca(actor, itemId) {
  const item = actor.items.get(itemId);
  const pj = flagProjeto(item);
  if (!pj || pj.categoria !== "engenhoca") return;
  const dados = actor.flags?.[FLAG] ?? {};
  const chave = `reparo-${item.id}`;
  if (dados.usosFormas?.[chave]) return ui.notifications.warn(`${item.name}: Reparo Rápido só 1× por cena.`);
  if (int(pj.cenas) >= int(pj.cenasMax)) return ui.notifications.info(`${item.name} já está com a Durabilidade cheia.`);
  const { ficha } = estadoAtor(actor);
  const { custoRecurso } = await import("./extras.mjs");
  const c = custoRecurso(ficha, "pe", ARQUETIPOS.artifice.reparo.pe);
  if (!c.ok) return ui.notifications.warn(`Reparo Rápido: faltam ${c.falta} PE.`);
  await actor.update({ ...c.updates, [`${P}.usosFormas.${chave}`]: "cena", ...(game.combat?.started ? { [`${P}.acoes.bonus`]: true } : {}) });
  await item.update({ [`flags.${FLAG}.projeto.cenas`]: Math.min(int(pj.cenasMax), int(pj.cenas) + 1) });
  return cartao(actor, `<p><strong>Reparo Rápido</strong> (Ação Bônus, −5 PE): ${escapar(item.name)} recupera 1 cena (${Math.min(int(pj.cenasMax), int(pj.cenas) + 1)}/${int(pj.cenasMax)}).</p>`);
}

/** Desmontar (ação livre): a Engenhoca some e os Projetos que ela ocupava voltam. */
export async function desmontarEngenhoca(actor, itemId) {
  const item = actor.items.get(itemId);
  if (!flagProjeto(item)) return;
  if (!(await confirmar("Desmontar", `<p>Desmontar <strong>${escapar(item.name)}</strong>? Os Projetos que ela ocupa voltam na hora.</p>`))) return;
  await item.delete();
}

/** Descanso: Longo zera a reserva gasta e restaura as Engenhocas; Curto recupera ¼ (mín. 1) e devolve 1 cena. */
export function updatesDescansoArtifice(actor, longo) {
  const est = estadoArtifice(actor);
  if (!est) return { ator: {}, itens: [], texto: "" };
  const ator = {};
  const itens = [];
  if (longo) {
    if (est.gastos) ator[`${P}.projetosCriacao.gastos`] = 0;
    for (const i of est.engenhocas) { const pj = flagProjeto(i); if (int(pj.cenas) < int(pj.cenasMax)) itens.push({ _id: i.id, [`flags.${FLAG}.projeto.cenas`]: int(pj.cenasMax) }); }
    // Engenharia Reversa: a receita temporária some no Descanso Longo
    for (const r of est.livro.filter(x => x.temporaria)) ator[`${P}.artificeLivro.-=${r.chave}`] = null;
    return { ator, itens, texto: "Projetos de Criação de volta e Engenhocas restauradas" };
  }
  const volta = Math.max(1, Math.floor(est.criacao.projetos / 4));
  if (est.gastos) ator[`${P}.projetosCriacao.gastos`] = Math.max(0, est.gastos - volta);
  for (const i of est.engenhocas) { const pj = flagProjeto(i); if (int(pj.cenas) < int(pj.cenasMax)) itens.push({ _id: i.id, [`flags.${FLAG}.projeto.cenas`]: int(pj.cenas) + 1 }); }
  return { ator, itens, texto: `+${volta} Projeto${volta > 1 ? "s" : ""} e +1 cena nas Engenhocas` };
}

/** Utensílios (Nv. 5): 4 PE por +dado num teste com uma das 3 perícias. */
export async function usarUtensilios(actor) {
  const est = estadoArtifice(actor);
  if (!est?.utensilios) return ui.notifications.warn("Utensílios libera no nível 5 de Artífice.");
  const { ficha } = estadoAtor(actor);
  const { custoRecurso } = await import("./extras.mjs");
  const c = custoRecurso(ficha, "pe", ARQUETIPOS.artifice.utensilios.pe);
  if (!c.ok) return ui.notifications.warn(`Utensílios: faltam ${c.falta} PE.`);
  await actor.update(c.updates);
  const roll = await new Roll(est.utensilios).evaluate();
  return roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>Utensílios</strong> (−4 PE): +${roll.total} no teste (${est.utensilios}). Vale só nas 3 perícias escolhidas.` });
}

/** Botão "Aplicar cura" do cartão do Projeto: cura os alvos marcados (ou o próprio Artífice). */
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

/* ---------------- Projetos em outras fichas (0.8.28) ---------------- */

/**
 * Engenhocas que se instalam num item de quem recebe: viram um efeito no item (e saem do inventário do Artífice).
 * As outras vão como item para o inventário de quem recebe, que usa pela própria ficha.
 */
export const INSTALAVEIS = {
  afiacao: { alvo: "arma", tipos: ["weapon"], rotulo: "arma" },
  "placas-reforco": { alvo: "armadura", tipos: ["equipment"], rotulo: "armadura" }
};
const DADOS_AFIACAO = ["2d6", "3d8", "4d10", "6d10", "8d10"];
const RD_PLACAS = [3, 4, 5, 6, 8];

/** Efeito que o Projeto instalado põe no item (Afiação: dano extra; Placas: RD física). */
export function efeitoInstalado(receitaId, grau, intel, { modo = "afiacao", tipoDano = "" } = {}) {
  const i = Math.max(0, Math.min(4, int(grau, 1) - 1));
  const extra = Math.max(0, int(grau, 1) - 5) * 2;
  if (receitaId === "afiacao") {
    const dado = DADOS_AFIACAO[i].replace(/^(\d+)d/, (m, n) => `${Number(n) + extra}d`);
    return { tipo: "danoExtra", formula: `${dado} + ${Math.max(0, int(intel))}`, tipoDano: modo === "acoplamento" ? tipoDano : "", quando: "acerto", valor: 0, alvo: "", recurso: "pv" };
  }
  if (receitaId === "placas-reforco") return { tipo: "rd", valor: RD_PLACAS[i] + extra, tipoDano: "Físico", alvo: "", formula: "", quando: "uso", recurso: "pv" };
  return null;
}

const itensDoTipo = (ator, tipos) => (ator?.items?.contents ?? [...(ator?.items ?? [])]).filter(i => tipos.includes(i.type) && !i.flags?.[FLAG]?.projeto);

/** Escolhe quem recebe (diálogo com busca) e, nos instaláveis, em qual item. */
export async function enviarProjeto(actor, itemId) {
  const item = actor.items.get(itemId);
  const pj = flagProjeto(item);
  if (!pj || pj.categoria !== "engenhoca") return ui.notifications.warn("Só Engenhocas vão para outra ficha.");
  const inst = INSTALAVEIS[pj.receita];
  const { escolherAtores } = await import("./escolher-ator.mjs");
  const r = await escolherAtores({
    titulo: `Enviar ${item.name}`, ok: inst ? "Escolher" : "Enviar",
    excluir: inst ? [] : [actor.uuid],
    filtro: inst ? null : a => a.id !== actor.id,
    dica: inst ? `Escolha de quem é a ${inst.rotulo} (pode ser você). O Projeto continua ocupando a sua reserva até ser recolhido.`
      : "A Engenhoca vai para o inventário da ficha escolhida, que usa pela própria ficha. Ela continua ocupando a sua reserva até ser recolhida."
  });
  const uuid = r?.uuids?.[0];
  if (!uuid) return;
  const alvo = await fromUuid(uuid);
  if (!alvo) return;
  const dados = { artificeId: actor.id, itemId, alvoId: alvo.id, alvoItemId: null, modo: "afiacao", tipoDano: "" };
  if (inst) {
    const opcoes = itensDoTipo(alvo, inst.tipos);
    if (!opcoes.length) return ui.notifications.warn(`${alvo.name} não tem ${inst.rotulo} no inventário.`);
    const { TIPOS_DANO } = await import("./config.mjs");
    const tipos = TIPOS_DANO.filter(t => !t.extra && ["naturais", "tecnologicos"].includes(t.grupo)).map(t => t.label);
    const e = await fvtt.DialogV2.wait({
      window: { title: `Instalar ${item.name}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
      content: `<label class="epm-campo"><span>${inst.rotulo === "arma" ? "Arma" : "Armadura"} de ${escapar(alvo.name)}</span><select name="alvoItem">${opcoes.map(o => `<option value="${o.id}">${escapar(o.name)}${o.system?.equipped ? " (equipada)" : ""}</option>`).join("")}</select></label>
        ${pj.receita === "afiacao" ? `<label class="epm-campo"><span>Modo</span><select name="modo"><option value="afiacao">Afiação: dano do tipo da arma</option><option value="acoplamento">Acoplamento: dano de um tipo Natural ou Energia</option></select></label>
        <label class="epm-campo"><span>Tipo (Acoplamento)</span><select name="tipoDano">${tipos.map(t => `<option>${escapar(t)}</option>`).join("")}</select></label>` : ""}
        <p class="epm-dica">O efeito vale enquanto o item estiver equipado.</p>`,
      buttons: [{ action: "ok", label: "Instalar", icon: "fa-solid fa-screwdriver-wrench", default: true, callback: (ev, b) => ({ alvoItem: b.form.elements.alvoItem.value, modo: b.form.elements.modo?.value ?? "afiacao", tipoDano: b.form.elements.tipoDano?.value ?? "" }) },
        { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
    });
    if (!e || typeof e !== "object") return;
    Object.assign(dados, { alvoItemId: e.alvoItem, modo: e.modo, tipoDano: e.modo === "acoplamento" ? e.tipoDano : "" });
  }
  if (alvo.isOwner) return executarEnvio(dados);
  const { pedirAoMestre } = await import("./mundo.mjs");
  return pedirAoMestre("projetoEnviar", dados);
}

/** Faz o envio (no Mestre, ou em quem é dono das duas fichas). */
export async function executarEnvio({ artificeId, itemId, alvoId, alvoItemId = null, modo = "afiacao", tipoDano = "" }) {
  const art = game.actors.get(artificeId);
  const alvo = game.actors.get(alvoId);
  const item = art?.items.get(itemId);
  const pj = flagProjeto(item);
  if (!art || !alvo || !pj) return false;
  const est = estadoArtifice(art);
  const enviadoId = novoId();
  const registro = { nome: item.name, receita: pj.receita, grau: int(pj.grau, 1), ocupa: int(pj.ocupa, 1), cenas: int(pj.cenas), cenasMax: int(pj.cenasMax),
    alvoId: alvo.id, alvoNome: alvo.name, alvoItemId: null, alvoItemNome: "", projeto: pj, itemDados: item.toObject() };
  delete registro.itemDados._id;
  if (INSTALAVEIS[pj.receita]) {
    const alvoItem = alvo.items.get(alvoItemId);
    if (!alvoItem) return false;
    const ef = efeitoInstalado(pj.receita, int(pj.grau, 1) + (est?.menteInventora ? 1 : 0), est?.intel ?? 0, { modo, tipoDano });
    await alvoItem.update({
      [`flags.${FLAG}.efeitos.proj${enviadoId}`]: { ...ef, criado: Date.now(), projeto: { artificeId: art.id, enviadoId, nome: item.name } },
      [`flags.${FLAG}.projetosInstalados.${enviadoId}`]: { artificeId: art.id, artificeNome: art.name, nome: item.name }
    });
    Object.assign(registro, { alvoItemId: alvoItem.id, alvoItemNome: alvoItem.name, modo, tipoDano });
  } else {
    const d = item.toObject(); delete d._id;
    foundry.utils.setProperty(d, `flags.${FLAG}.projeto.artificeId`, art.id);
    foundry.utils.setProperty(d, `flags.${FLAG}.projeto.enviadoId`, enviadoId);
    foundry.utils.setProperty(d, `flags.${FLAG}.projeto.portador`, alvo.name);
    const [novo] = await alvo.createEmbeddedDocuments("Item", [d]);
    registro.alvoItemId = novo?.id ?? null;
  }
  await art.update({ [`${P}.projetosEnviados.${enviadoId}`]: registro });
  await item.delete();
  await cartao(art, `<p><strong>${escapar(art.name)}</strong> ${INSTALAVEIS[pj.receita] ? `instalou <strong>${escapar(item.name)}</strong> em ${escapar(registro.alvoItemNome)} de ${escapar(alvo.name)}${modo === "acoplamento" && tipoDano ? ` (Acoplamento: ${escapar(tipoDano)})` : ""}` : `entregou <strong>${escapar(item.name)}</strong> para ${escapar(alvo.name)}`}. Continua ocupando ${registro.ocupa} Projeto${registro.ocupa > 1 ? "s" : ""} da reserva.</p>`);
  return true;
}

/** Recolhe um Projeto enviado: tira o efeito (ou o item) de quem recebeu e devolve a Engenhoca ao Artífice. */
export async function recolherProjeto(actor, enviadoId) {
  const reg = actor.flags?.[FLAG]?.projetosEnviados?.[enviadoId];
  if (!reg) return;
  const alvo = game.actors.get(reg.alvoId);
  if (!alvo || alvo.isOwner) return executarRecolher({ artificeId: actor.id, enviadoId });
  const { pedirAoMestre } = await import("./mundo.mjs");
  return pedirAoMestre("projetoRecolher", { artificeId: actor.id, enviadoId });
}

export async function executarRecolher({ artificeId, enviadoId }) {
  const art = game.actors.get(artificeId);
  const reg = art?.flags?.[FLAG]?.projetosEnviados?.[enviadoId];
  if (!art || !reg) return false;
  const alvo = game.actors.get(reg.alvoId);
  const alvoItem = alvo?.items.get(reg.alvoItemId);
  let cenas = int(reg.cenas);
  if (alvoItem) {
    if (INSTALAVEIS[reg.receita]) await alvoItem.update({ [`flags.${FLAG}.efeitos.-=proj${enviadoId}`]: null, [`flags.${FLAG}.projetosInstalados.-=${enviadoId}`]: null });
    else { cenas = int(alvoItem.flags?.[FLAG]?.projeto?.cenas, cenas); await alvoItem.delete(); }
  }
  const d = foundry.utils.deepClone(reg.itemDados ?? {});
  if (d.name) {
    foundry.utils.setProperty(d, `flags.${FLAG}.projeto.cenas`, cenas);
    foundry.utils.setProperty(d, `flags.${FLAG}.projeto.portador`, art.name);
    for (const k of ["artificeId", "enviadoId"]) if (d.flags?.[FLAG]?.projeto) delete d.flags[FLAG].projeto[k];
    await art.createEmbeddedDocuments("Item", [d]);
  }
  await art.update({ [`${P}.projetosEnviados.-=${enviadoId}`]: null });
  await cartao(art, `<p><strong>${escapar(art.name)}</strong> recolheu <strong>${escapar(reg.nome)}</strong>${alvo ? ` de ${escapar(alvo.name)}` : ""}.</p>`);
  return true;
}
