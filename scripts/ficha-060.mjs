/**
 * Ações da ficha que vieram na 0.6.0 (com Foundry): raça pronta, Sanidade e insanidades, máximos automáticos,
 * talentos, votos e pactos, catálogos do Notion (treinos, armas, armaduras, kits), nomeação de criaturas,
 * classes do Notion (Fúria, Proteções, Posições), conversão da Ação Padrão e Noção de Vitalidade.
 * As funções `acao*` viram métodos da ficha (actor-sheet.mjs); o resto é chamado por hooks e pelo chat.
 */
import { num as numBonus } from "./numeros.mjs";
import { FLAG, RECURSOS, ATRIBUTOS, GRUPOS_ATRIBUTO } from "./config.mjs";
import { int, num, novoId, formaPadrao } from "./data.mjs";
import { escapar } from "./helpers.mjs";
import { estadoAtor, confirmar, rolarTeste, calcularPerda, calcularRecuperacao } from "./mecanicas.mjs";
import { custoRecurso } from "./extras.mjs";
import { RACAS, racaPorId, qtdUnicas, opcoesAmalgama, habilidadePorRef } from "./racas.mjs";
import { insanidadeTemporaria, insanidadePermanente, estadoSanidade, RECUPERACAO_SANIDADE } from "./insanidades.mjs";
import { TREINAMENTOS_NOTION, KITS_INICIAIS, ARMAS_REGIAO, ARMADURAS_REGIAO, REGIOES, PROPRIEDADES_ARMA, TIPOS_ARMADURA } from "./catalogos.mjs";
import {
  ATRIBUTOS_ACIMA_4, RECURSOS_ARQUETIPO, custoNomeacao, CLASSES_NOTION, PENALIDADE_PACTO, nocaoVitalidade, idArquetipo
} from "./regras-extras.mjs";
import { niveisArquetipos } from "./ficha-extras.mjs";
import * as mundo from "./mundo.mjs";
import { formulario } from "./mundo.mjs";
import { EXEMPLO_CRIATURA, TIPOS_INSANIDADE, INTENSIDADES_INSANIDADE } from "./contexto-060.mjs";

const P = `flags.${FLAG}`;

/* -------------------------------------------- */
/*  Utilitários de diálogo e chat               */
/* -------------------------------------------- */

const notaChat = (actor, html, cor = "#A47DDB") => ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor }),
  content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:${cor}">${html}</div>`
});

const opcoes = (lista, atual = "") => lista.map(([v, l]) => `<option value="${escapar(v)}" ${String(v) === String(atual) ? "selected" : ""}>${escapar(l)}</option>`).join("");

/* -------------------------------------------- */
/*  Raça pronta                                 */
/* -------------------------------------------- */

const atributosDosGrupos = (grupos = [], exceto = []) => Object.entries(ATRIBUTOS)
  .filter(([id, a]) => (!grupos?.length || grupos.includes(a.grupo)) && !exceto.includes(id));

/** Lista de "vagas" de atributo da raça (cada uma vira um select no diálogo). */
function vagasAumento(aumento, extras = []) {
  const vagas = [];
  for (const e of aumento?.escolhas ?? []) for (let i = 0; i < (e.qtd ?? 1); i++) vagas.push({ valor: e.valor, grupos: e.grupos ?? [], exceto: e.exceto ?? [] });
  for (const e of extras) vagas.push(e);
  return vagas;
}

export async function escolherRaca(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const atual = dados.racaEscolha?.id ?? "";
  const r1 = await formulario("Escolher raça (Notion)", `
    <p class="epm-dica">Preenche os bônus de atributo da raça, a Vida/Mana/Estamina base (para os máximos automáticos), deslocamento, tamanho,
    resistências e cria as habilidades na sub-aba Raça. Dá para trocar depois; os bônus de raça antigos são substituídos.</p>
    <label class="epm-campo"><span>Raça</span><select name="raca">${opcoes(RACAS.map(r => [r.id, `${r.nome}${r.dlc ? " (DLC)" : ""}`]), atual)}</select></label>`, { botao: "Continuar" });
  if (!r1) return;
  const raca = racaPorId(r1.raca);
  if (!raca) return;

  // Habilidades Únicas (Mestiço: duas raças, uma única de cada)
  let unicas = [];
  let mestico = null;
  if (raca.mestico) {
    const outras = RACAS.filter(r => !r.mestico && !r.dlc);
    const r2 = await formulario("Mestiço: as duas raças", `
      <label class="epm-campo"><span>Primeira raça</span><select name="a">${opcoes(outras.map(r => [r.id, r.nome]))}</select></label>
      <label class="epm-campo"><span>Segunda raça</span><select name="b">${opcoes(outras.map(r => [r.id, r.nome]), outras[1]?.id)}</select></label>`, { botao: "Continuar" });
    if (!r2) return;
    if (r2.a === r2.b) return ui.notifications.warn("Escolha duas raças diferentes.");
    const A = racaPorId(r2.a), B = racaPorId(r2.b);
    const habs = [...A.habilidades.map(h => [`${A.id}:${h.id}`, `${A.nome}: ${h.nome}`]), ...B.habilidades.map(h => [`${B.id}:${h.id}`, `${B.nome}: ${h.nome}`])];
    const r3 = await formulario("Mestiço: habilidades", `
      <p class="epm-dica">Uma característica passiva e uma habilidade de uma das raças, e duas Habilidades Únicas (uma de cada raça).</p>
      <label class="epm-campo"><span>Passiva</span><select name="h1">${opcoes(habs)}</select></label>
      <label class="epm-campo"><span>Habilidade</span><select name="h2">${opcoes(habs, habs[1]?.[0])}</select></label>
      <label class="epm-campo"><span>Única de ${escapar(A.nome)}</span><select name="u1">${opcoes(A.unicas.map(u => [`${A.id}:${u.id}`, u.nome]))}</select></label>
      <label class="epm-campo"><span>Única de ${escapar(B.nome)}</span><select name="u2">${opcoes(B.unicas.map(u => [`${B.id}:${u.id}`, u.nome]))}</select></label>`, { botao: "Continuar" });
    if (!r3) return;
    mestico = { a: A.id, b: B.id, habilidades: [...new Set([r3.h1, r3.h2])], unicas: [r3.u1, r3.u2] };
  } else if (raca.unicas.length) {
    const r2 = await formulario(`${raca.nome}: Habilidade Única`, `
      <p class="epm-dica">Escolha 1 (Compatibilidade à Fera dá +2). ${escapar(raca.aumento?.texto ?? "")}</p>
      <div class="epm-lista-escolha">${raca.unicas.map(u => `<label class="epm-check epm-check-bloco"><input type="checkbox" name="unicas[]" value="${u.id}" ${dados.racaEscolha?.id === raca.id && (dados.racaEscolha?.unicas ?? []).includes(u.id) ? "checked" : ""}>
        <span><strong>${escapar(u.nome)}</strong> ${escapar(u.texto)}</span></label>`).join("")}</div>`, { botao: "Continuar", largura: 600 });
    if (!r2) return;
    unicas = r2.unicas ?? [];
    const max = qtdUnicas(raca, unicas);
    if (unicas.length > max) { ui.notifications.warn(`${raca.nome}: só ${max} Habilidade(s) Única(s). Fiquei com as primeiras.`); unicas = unicas.slice(0, max); }
  }

  // Amálgama: escolhe uma passiva ou habilidade de outra raça
  let amalgama = "";
  if (raca.unicas.some(u => u.auto?.amalgama && unicas.includes(u.id))) {
    const lista = opcoesAmalgama(raca.id);
    const atual = dados.racaEscolha?.amalgama ?? "";
    const ra = await formulario("Amálgama: habilidade de outra raça", `
      <p class="epm-dica">Escolha uma passiva ou habilidade de outra raça. Ela entra na sub-aba Raça e os efeitos automáticos dela valem.</p>
      <div class="epm-lista-escolha">${lista.map((o, i) => `<label class="epm-check epm-check-bloco"><input type="radio" name="ref" value="${escapar(o.ref)}" ${o.ref === atual || (!atual && i === 0) ? "checked" : ""}>
        <span><strong>${escapar(o.label)}</strong> ${escapar(o.texto)}</span></label>`).join("")}</div>`, { botao: "Continuar", largura: 620 });
    if (!ra) return;
    amalgama = ra.ref ?? "";
  }

  // Atributos (aumento da raça; Variante troca; Conhecimento Extra soma)
  const escolhidas = raca.unicas.filter(u => unicas.includes(u.id));
  const troca = escolhidas.find(u => u.auto?.trocaAumento)?.auto?.trocaAumento;
  const aumento = troca ?? raca.aumento;
  const extras = escolhidas.filter(u => u.auto?.atributo).map(u => ({ valor: u.auto.atributo.valor, grupos: u.auto.atributo.grupos, exceto: [] }));
  const vagas = vagasAumento(aumento, extras);
  const fixos = aumento?.fixos ?? {};
  const fixosTexto = Object.entries(fixos).map(([id, v]) => `+${v} ${ATRIBUTOS[id]?.label ?? id}`).join(", ");
  let html = `<p class="epm-dica">${escapar(aumento?.texto ?? "")}${fixosTexto ? ` (fixos: ${escapar(fixosTexto)})` : ""}</p>`;
  if (aumento?.pontos) {
    html += `<p class="epm-dica">Distribua ${aumento.pontos} pontos (no máximo +2 em cada atributo).</p><div class="epm-grade-atributos">`
      + Object.entries(ATRIBUTOS).map(([id, a]) => `<label class="epm-campo epm-campo-mini"><span>${escapar(a.label)}</span><input type="number" name="p_${id}" value="0" min="0" max="2"></label>`).join("") + "</div>";
  }
  vagas.forEach((v, i) => {
    html += `<label class="epm-campo"><span>+${v.valor} em</span><select name="v${i}">${opcoes(atributosDosGrupos(v.grupos, v.exceto).map(([id, a]) => [id, `${a.label} (${GRUPOS_ATRIBUTO[a.grupo] ?? a.grupo})`]))}</select></label>`;
  });
  if (raca.deslocamentoOpcoes) html += `<label class="epm-campo"><span>Velocidade</span><select name="desl">${opcoes(raca.deslocamentoOpcoes.map(d => [d, `${d} m`]), raca.deslocamento)}</select></label>`;
  const r4 = (vagas.length || aumento?.pontos || raca.deslocamentoOpcoes) ? await formulario(`${raca.nome}: atributos`, html, { botao: "Aplicar raça" }) : {};
  if (!r4) return;
  const valores = Object.fromEntries(Object.keys(ATRIBUTOS).map(id => [id, 0]));
  for (const [id, v] of Object.entries(fixos)) valores[id] += v;
  const usados = [];
  vagas.forEach((v, i) => { const id = r4[`v${i}`]; if (ATRIBUTOS[id]) { valores[id] += v.valor; usados.push(id); } });
  if (new Set(usados).size < usados.length) ui.notifications.warn("Atenção: o mesmo atributo foi escolhido mais de uma vez (confira com o Mestre).");
  if (aumento?.pontos) {
    let soma = 0;
    for (const id of Object.keys(ATRIBUTOS)) { const p = Math.max(0, Math.min(2, int(r4[`p_${id}`]))); valores[id] += p; soma += p; }
    if (soma !== aumento.pontos) ui.notifications.warn(`Mestiço: distribuiu ${soma} de ${aumento.pontos} pontos.`);
  }

  const upd = {
    [`${P}.raca`]: mestico ? `Mestiço (${racaPorId(mestico.a).nome} + ${racaPorId(mestico.b).nome})` : raca.nome,
    [`${P}.racaEscolha`]: { id: raca.id, unicas, mestico, amalgama, aumento: valores },
    [`${P}.deslocamento.base`]: num(r4.desl, raca.deslocamento),
    [`${P}.tamanho`]: raca.tamanho
  };
  for (const id of Object.keys(ATRIBUTOS)) upd[`${P}.atributos.${id}.raca`] = valores[id];
  // Concessões únicas (uma vez por raça): PT de Versátil, PH de Variante, pontos de perícia de Amigo de Todos
  const concedido = dados.racaConcedido ?? {};
  const todas = [...raca.habilidades, ...escolhidas];
  const pt = todas.reduce((s, h) => s + num(h.auto?.pt), 0);
  const ph = todas.reduce((s, h) => s + num(h.auto?.ph), 0);
  const pp = todas.reduce((s, h) => s + num(h.auto?.periciaPontos), 0);
  const ganhos = [];
  if (!concedido[raca.id]) {
    if (pt) { upd[`${P}.pontos.pt`] = int(dados.pontos?.pt) + pt; ganhos.push(`+${pt} PT`); }
    if (ph) { upd[`${P}.pontos.ph`] = int(dados.pontos?.ph) + ph; ganhos.push(`+${ph} PH`); }
    if (pp) { upd[`${P}.pontosPericiaExtra`] = int(dados.pontosPericiaExtra) + pp; ganhos.push(`+${pp} pontos de perícia`); }
    upd[`${P}.racaConcedido.${raca.id}`] = true;
  }
  await actor.update(upd);

  // Habilidades da raça na sub-aba Raça (as antigas da raça saem)
  const antigas = actor.items.filter(i => i.flags?.[FLAG]?.racaRef).map(i => i.id);
  if (antigas.length) await actor.deleteEmbeddedDocuments("Item", antigas);
  const lista = mestico
    ? [...mestico.habilidades, ...mestico.unicas].map(ref => { const [rid, hid] = ref.split(":"); const rr = racaPorId(rid); const h = [...rr.habilidades, ...rr.unicas].find(x => x.id === hid); return h ? { ...h, origemRaca: rr.nome, unica: rr.unicas.includes(h) } : null; }).filter(Boolean)
    : [...raca.habilidades.filter(h => !escolhidas.some(u => u.auto?.perdeHabilidade === h.id)).map(h => ({ ...h, origemRaca: raca.nome })), ...escolhidas.map(u => ({ ...u, origemRaca: raca.nome, unica: true }))];
  const amal = habilidadePorRef(amalgama);
  if (amal) lista.push({ ...amal.habilidade, origemRaca: `Amálgama (${amal.raca.nome})` });
  await actor.createEmbeddedDocuments("Item", lista.map(h => dadosHabilidadeRaca(h)));
  ui.notifications.info(`${raca.nome} aplicada${ganhos.length ? ` (${ganhos.join(", ")})` : ""}. As habilidades estão em Habilidades → Raça.`);
}

function dadosHabilidadeRaca(h) {
  const pod = h.auto?.poder;
  const forma = formaPadrao(0, pod ? "Usar" : "Passiva");
  forma.acao = pod?.acao ?? "passiva";
  if (pod?.custo) forma.custo = { recurso: pod.custo.recurso, valor: pod.custo.valor };
  if (pod?.dano) forma.dano = { formula: pod.dano, tipo: pod.tipoDano ?? "" };
  if (pod?.cura) forma.efeito = `Cura ${pod.cura}`;
  return {
    name: h.nome, type: "feat", img: h.unica ? "icons/svg/aura.svg" : "icons/svg/statue.svg",
    system: { description: { value: `<p>${escapar(h.texto)}</p><p class="epm-dica">${escapar(h.origemRaca)}${h.unica ? " · Habilidade Única" : ""} (Notion).</p>` } },
    flags: { [FLAG]: {
      raridade: "comum", origem: "raca", passiva: !pod, racaRef: `${h.origemRaca}:${h.id}`,
      formas: { [novoId()]: forma }, usos: { valor: pod?.usos ?? 0, max: pod?.usos ?? 0, recarga: pod?.recarga ? ({ descanso: "descanso", dia: "dia", combate: "combate" }[pod.recarga] ?? "nenhuma") : "nenhuma" }
    } }
  };
}

/* -------------------------------------------- */
/*  Sanidade e insanidades                      */
/* -------------------------------------------- */

async function rolarD100() {
  const r = new Roll("1d100");
  await r.evaluate();
  return r.total;
}

/** Sorteia uma insanidade (temporária: refaz nos números que faltam no PDF; permanente: faixa) e grava na ficha. */
export async function ganharInsanidade(actor, tipo = "temporaria", { intensa = false, motivo = "" } = {}) {
  let numero = await rolarD100();
  let entrada = null;
  if (tipo === "temporaria") {
    for (let i = 0; i < 5 && !(entrada = insanidadeTemporaria(numero)); i++) numero = await rolarD100();
    if (entrada?.numero === 100) return ganharInsanidade(actor, "permanente", { motivo: "Temporária 100: insanidade de longa duração" });
  } else {
    entrada = insanidadePermanente(numero);
  }
  if (!entrada) return null;
  const id = novoId();
  const nome = tipo === "temporaria" ? `${entrada.numero}. ${entrada.texto}` : entrada.nome;
  await actor.update({ [`${P}.insanidades.${id}`]: {
    tipo, numero: entrada.numero ?? numero, nome, texto: tipo === "temporaria" ? entrada.texto : `Insanidade permanente (d100 = ${numero}).`,
    condicoes: entrada.condicoes ?? [], intensa, motivo, criada: Date.now(), encerrada: false
  } });
  await notaChat(actor, `<p><strong>${tipo === "temporaria" ? "Insanidade temporária" : "Insanidade PERMANENTE"}</strong> (1d100 = ${numero})${intensa ? " — mais intensa" : ""}</p>
    <p>${escapar(nome)}</p>${entrada.combinadas ? `<p class="epm-dica">Role mais ${entrada.combinadas} na tabela permanente e combine.</p>` : ""}${motivo ? `<p class="epm-dica">${escapar(motivo)}</p>` : ""}`);
  return id;
}

/**
 * Dano de Sanidade (Notion): teste de Autocontrole (passa = metade, falha = cheio, falha crítica = dobro),
 * a RD de Sanidade do Autocontrole alto e o efeito do estado em que ficou (Instável, Quebrado, Colapso).
 */
export async function danoSanidade(actor, { formula = "", motivo = "" } = {}) {
  const r = await formulario(`Dano de Sanidade${motivo ? `: ${motivo}` : ""}`, `
    <label class="epm-campo"><span>Dano (número ou fórmula)</span><input type="text" name="dano" value="${escapar(formula || "1d10")}"></label>
    <label class="epm-check"><input type="checkbox" name="teste" checked> Teste de Autocontrole para resistir</label>
    <label class="epm-campo"><span>DT do teste</span><input type="number" name="dt" value="15"></label>
    <p class="epm-dica">Passou: metade. Falhou: cheio. Falha crítica (1 natural): dobro. A Sanidade só cai com o que o personagem não consegue processar.</p>`, { botao: "Aplicar" });
  if (!r) return;
  let rolagem;
  try { rolagem = new Roll(String(r.dano || "0")); await rolagem.evaluate(); } catch { return ui.notifications.error("Fórmula de dano inválida."); }
  let dano = Math.max(0, Math.floor(rolagem.total));
  const dt = int(r.dt, 15);
  let { ficha } = estadoAtor(actor);
  const notas = [`Dano rolado: ${dano}`];
  if (r.teste) {
    const atr = ficha.atributos.autocontrole;
    const blindada = ficha.extras?.menteBlindada ? numBonus("treino.menteBlindada") : 0;
    const tituloSan = int(ficha.extras?.titulos?.ativo?.sanidade) + int(ficha.extras?.fortalecimentoMental);
    const extrasTxt = [blindada ? "Mente Blindada +5" : "", tituloSan ? `títulos e treinos +${tituloSan}` : ""].filter(Boolean).join(", ");
    const t = await rolarTeste(actor, { rotulo: `Resistir (Autocontrole) DT ${dt}${extrasTxt ? ` · ${extrasTxt}` : ""}`, bonus: (atr?.testeTotal ?? atr?.total ?? 0) + blindada + tituloSan });
    const natural = t?.dice?.[0]?.results?.find(x => x.active)?.result ?? t?.dice?.[0]?.total ?? 0;
    if (natural === 1) { dano *= 2; notas.push("falha crítica: dobro"); }
    else if (t && t.total >= dt) { dano = Math.floor(dano / 2); notas.push("passou: metade"); }
    else notas.push("falhou: cheio");
  }
  const rdSan = ficha.extras?.altos?.rdSanidade ?? 0;
  if (rdSan && dano) { dano = Math.max(0, dano - rdSan); notas.push(`RD de Sanidade ${rdSan}`); }
  const perda = calcularPerda(ficha, "ps", dano);
  await actor.update(perda.updates);
  ({ ficha } = estadoAtor(actor));
  const estado = estadoSanidade(ficha.recursos.ps.value + Math.max(0, ficha.recursos.ps.temp ?? 0));
  await notaChat(actor, `<p><strong>Sanidade −${dano}</strong> (${escapar(notas.join("; "))}) → ${ficha.recursos.ps.value} (${estado.label})</p><p class="epm-dica">${escapar(estado.texto)}</p>`);
  if (!dano) return;
  if (estado.id === "colapso") {
    await actor.update({ [`${P}.conquistas.colapsos`]: int(actor.flags?.[FLAG]?.conquistas?.colapsos) + 1 });
    return ganharInsanidade(actor, "permanente", { motivo: "Colapso (Sanidade 0)" });
  }
  if (estado.id === "instavel" || estado.id === "quebrado") {
    const per = ficha.periciaPorId.vontade;
    const t = await rolarTeste(actor, { rotulo: `Vontade DT ${dt} (Sanidade ${estado.label})`, bonus: per?.testeTotal ?? per?.total ?? 0 });
    const natural = t?.dice?.[0]?.results?.find(x => x.active)?.result ?? 0;
    const falhou = !t || t.total < dt;
    if (estado.id === "instavel" && falhou) return ganharInsanidade(actor, "temporaria", { motivo: "Instável: falhou na Vontade" });
    if (estado.id === "quebrado") {
      await ganharInsanidade(actor, "temporaria", { intensa: falhou, motivo: `Quebrado: insanidade automática${falhou ? "; falhou na Vontade (mais intensa)" : ""}` });
      if (natural === 1) await notaChat(actor, `<p><strong>Falha crítica na Vontade:</strong> a insanidade pode virar permanente (o Mestre decide).</p>`);
    }
  }
}

export async function recuperarSanidade(actor) {
  const r = await formulario("Recuperar Sanidade", `
    <p class="epm-dica">No Notion a recuperação é narrativa, não automática: o Mestre decide quando vale.</p>
    <label class="epm-campo"><span>Motivo</span><select name="tipo">${opcoes([...RECUPERACAO_SANIDADE.map(x => [x.id, `${x.label} (${x.faixa})`]), ["outro", "Outro (valor abaixo)"]])}</select></label>
    <label class="epm-campo"><span>Valor (se "Outro")</span><input type="number" name="valor" value="5"></label>`, { botao: "Recuperar" });
  if (!r) return;
  const preset = RECUPERACAO_SANIDADE.find(x => x.id === r.tipo);
  let valor = int(r.valor);
  if (preset) { const roll = new Roll(preset.formula); await roll.evaluate(); valor = roll.total; }
  const { ficha } = estadoAtor(actor);
  const rec = calcularRecuperacao(ficha, "ps", valor, { fonte: preset?.label ?? "Sanidade" });
  if (Object.keys(rec.updates).length) await actor.update(rec.updates);
  return notaChat(actor, `<p><strong>Sanidade +${valor}</strong> (${escapar(preset?.label ?? "Outro")}). ${escapar(rec.texto ?? "")}</p>`);
}

/* -------------------------------------------- */
/*  Máximos automáticos: rolar níveis           */
/* -------------------------------------------- */

/** Rola os dados de Vida/Estamina/Mana dos níveis que ainda não têm rolagem (modo "rolagem"). */
export async function rolarNiveisRecursos(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const niveis = niveisArquetipos(dados);
  const upd = {};
  const linhas = [];
  niveis.forEach((n, idx) => {
    const extras = idx === 0 ? n.nivel - 1 : n.nivel;
    const cfg = RECURSOS_ARQUETIPO[n.arquetipo];
    if (!cfg) return;
    for (const r of ["pv", "pe", "pm"]) {
      const atuais = [...(dados.recursosAuto?.rolagens?.[n.arquetipo]?.[r] ?? [])];
      const faltam = Math.max(0, extras - atuais.length);
      for (let i = 0; i < faltam; i++) {
        const faces = int(cfg[r].dado.split("d")[1], 6);
        atuais.push(1 + Math.floor(Math.random() * faces));
      }
      if (faltam) { upd[`${P}.recursosAuto.rolagens.${n.arquetipo}.${r}`] = atuais; linhas.push(`${RECURSOS[r]?.abrev ?? r} (${n.arquetipo}): ${atuais.slice(-faltam).join(", ")}`); }
    }
  });
  if (!linhas.length) return ui.notifications.info("Todos os níveis já têm rolagem.");
  await actor.update(upd);
  return notaChat(actor, `<p><strong>Rolagens por nível</strong></p><p>${linhas.map(escapar).join("<br>")}</p>`, "#4C8EE0");
}

/**
 * Quando um bônus muda o atributo de um recurso (ex.: +2 Constituição no nível 5 = +10 de Vida máxima),
 * a Vida/Estamina/Mana atual sobe (ou desce) junto. Guarda o último bônus aplicado em flags.bonusRecursosAplicado.
 */
export async function ajustarAtualPorBonus(actor) {
  if (!actor?.isOwner) return;
  const { ficha, dados } = estadoAtor(actor);
  const novo = ficha.bonusAtributoRecursos ?? {};
  const antes = dados.bonusRecursosAplicado;
  const upd = {};
  if (antes && typeof antes === "object") {
    for (const r of ["pv", "pm", "pe"]) {
      const delta = int(novo[r]) - int(antes[r]);
      if (!delta) continue;
      const rec = ficha.recursos[r];
      const valor = Math.max(0, Math.min(rec.max, int(rec.value) + delta));
      if (valor === int(rec.value)) continue;
      if (r === "pv") upd["system.attributes.hp.value"] = valor;
      else upd[`${P}.recursos.${r}.value`] = valor;
    }
  }
  if (JSON.stringify(antes ?? null) !== JSON.stringify({ pv: int(novo.pv), pm: int(novo.pm), pe: int(novo.pe) })) {
    upd[`${P}.bonusRecursosAplicado`] = { pv: int(novo.pv), pm: int(novo.pm), pe: int(novo.pe) };
  }
  if (Object.keys(upd).length) await actor.update(upd, { epmSincronizar: true });
}

/** Visão no escuro da ficha (raça ou manual) vira o sentido do dnd5e e o alcance de visão do token. */
export async function sincronizarVisao(actor) {
  if (!actor?.isOwner) return;
  const { ficha } = estadoAtor(actor);
  const m = Math.max(0, int(ficha.extras?.corpo?.sentidos?.visaoEscuro));
  const upd = {};
  const sens = actor.system?.attributes?.senses ?? {};
  if (sens.ranges && "darkvision" in sens.ranges) { if (int(sens.ranges.darkvision) !== m) upd["system.attributes.senses.ranges.darkvision"] = m; }
  else if ("darkvision" in sens && int(sens.darkvision) !== m) upd["system.attributes.senses.darkvision"] = m;
  const proto = actor.prototypeToken?.sight;
  if (m > 0 && proto && int(proto.range) < m) upd["prototypeToken.sight.range"] = m;
  if (Object.keys(upd).length) await actor.update(upd, { epmSincronizar: true });
  if (m > 0) for (const t of actor.getActiveTokens(false, true)) if (int(t.sight?.range) < m) await t.update({ "sight.range": m }).catch(() => null);
}

/** Mantém a Vida máxima (hp.max) e os máximos de Mana/Estamina iguais ao cálculo automático, quando ligado. */
export async function sincronizarMaximos(actor) {
  if (!actor?.isOwner || !actor.flags?.[FLAG]?.recursosAuto?.ativo) return;
  const { ficha } = estadoAtor(actor);
  const auto = ficha.extras?.recursosAuto;
  if (!auto) return;
  const upd = {};
  if (int(actor.system?.attributes?.hp?.max) !== auto.pv.total) upd["system.attributes.hp.max"] = auto.pv.total;
  for (const r of ["pm", "pe"]) if (int(actor.flags[FLAG].recursos?.[r]?.max) !== auto[r].total) upd[`${P}.recursos.${r}.max`] = auto[r].total;
  if (Object.keys(upd).length) await actor.update(upd, { epmSincronizar: true });
}

/* -------------------------------------------- */
/*  Catálogos do Notion                         */
/* -------------------------------------------- */

export async function treinoDoCatalogo(actor, indice) {
  const e = TREINAMENTOS_NOTION[int(indice)];
  if (!e) return;
  const mods = {};
  for (const m of e.mods ?? []) mods[novoId()] = { alvo: m.alvo, valor: m.valor };
  await actor.update({ [`${P}.treinamentos.${novoId()}`]: {
    nome: e.nome, categoria: e.categoria, tempo: e.tempo, unidade: e.unidade, pt: e.pt, requisitos: e.requisitos,
    treinador: !!e.treinador, beneficios: e.beneficios, especial: e.especial ?? "", estado: "planejado", horasFeitas: 0, mods, criado: Date.now()
  } });
  ui.notifications.info(`Treinamento "${e.nome}" adicionado (planejado).`);
}

/** Item de arma ou armadura do catálogo das regiões. */
function dadosItemCatalogo(tipo, x) {
  if (tipo === "arma") {
    return {
      name: x.nome, type: "weapon", img: x.pericia === "pontaria" ? "icons/svg/target.svg" : "icons/svg/sword.svg",
      system: { description: { value: `<p>${escapar(REGIOES[x.regiao])} · ${escapar(x.alcance)} · ${escapar(x.propriedades.join(", ") || "sem propriedades")}</p>` } },
      flags: { [FLAG]: { dano: x.dano, tipoDano: x.tipoDano, critMargem: x.critMargem, critMult: x.critMult, periciaAtaque: x.pericia,
        propriedades: x.propriedades, alcance: x.alcance, regiao: x.regiao, tipoArma: "" } }
    };
  }
  const efeitos = {};
  x.efeitos.forEach((e, i) => { efeitos[novoId()] = { ...e, criado: Date.now() + i }; });
  return {
    name: x.nome, type: "equipment", img: "icons/svg/shield.svg",
    system: { description: { value: `<p>${escapar(REGIOES[x.regiao])} · ${escapar(TIPOS_ARMADURA[x.tipo])} · Defesa +${x.defesa}</p><p>Desvantagem: ${escapar(x.desvantagem)}</p>${x.especial ? `<p>${escapar(x.especial)}</p>` : ""}` } },
    flags: { [FLAG]: { armadura: x.defesa, tipoArmadura: x.tipo, estaminaPorTurno: x.estaminaPorTurno, regiao: x.regiao, efeitos } }
  };
}

export async function catalogoItens(actor) {
  const linhas = (tipo, lista) => lista.map((x, i) => `<label class="epm-check epm-check-bloco"><input type="checkbox" name="${tipo}[]" value="${x.regiao}:${i}">
    <span><strong>${escapar(x.nome)}</strong> ${tipo === "arma"
      ? `${escapar(x.dano || "—")} · crítico ${x.critMargem < 20 ? `${x.critMargem}–20` : "20"}/×${x.critMult} · ${escapar(x.tipoDano)}${x.propriedades.length ? ` · <em>${escapar(x.propriedades.join(", "))}</em>` : ""}`
      : `${escapar(TIPOS_ARMADURA[x.tipo])} +${x.defesa} · ${escapar(x.desvantagem)}${x.especial ? ` · <em>${escapar(x.especial)}</em>` : ""}`}</span></label>`).join("");
  const regioes = Object.entries(REGIOES).map(([id, nome]) => `<details class="epm-cat-regiao" ${id === "umbra" ? "open" : ""}><summary>${escapar(nome)}</summary>
    <h4>Armas</h4>${linhas("arma", ARMAS_REGIAO[id])}<h4>Armaduras</h4>${linhas("armadura", ARMADURAS_REGIAO[id])}</details>`).join("");
  const r = await formulario("Armas e armaduras do Notion", `<p class="epm-dica">Marque o que quer criar no inventário. Tipos de dano regionais (Balístico, Energia…) são não oficiais: o Mestre liga no Escudo.</p>${regioes}`, { botao: "Adicionar", largura: 720 });
  if (!r) return;
  const docs = [];
  for (const ref of r.arma ?? []) { const [reg, i] = ref.split(":"); const x = ARMAS_REGIAO[reg]?.[int(i)]; if (x) docs.push(dadosItemCatalogo("arma", x)); }
  for (const ref of r.armadura ?? []) { const [reg, i] = ref.split(":"); const x = ARMADURAS_REGIAO[reg]?.[int(i)]; if (x) docs.push(dadosItemCatalogo("armadura", x)); }
  if (!docs.length) return;
  await actor.createEmbeddedDocuments("Item", docs);
  ui.notifications.info(`${docs.length} item(ns) adicionado(s).`);
}

export async function kitInicial(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const arq = idArquetipo(dados.arquetipo) || "combatente";
  const lista = Object.entries(KITS_INICIAIS).flatMap(([a, kits]) => kits.map(k => [`${a}:${k.id}`, `${a[0].toUpperCase()}${a.slice(1)} · ${k.nome}: ${k.itens.map(i => i[0] + (i[2] ? ` (${i[2]})` : "")).join(", ")}${Object.keys(k.moedas).length ? ` + ${Object.values(k.moedas)[0]} PO` : ""}`]));
  const r = await formulario("Kit inicial do arquétipo", `<label class="epm-campo"><span>Kit</span><select name="kit">${opcoes(lista, `${arq}:a`)}</select></label>
    <p class="epm-dica">Cria itens genéricos (troque pelas armas e armaduras de verdade depois) e soma as moedas.</p>`, { botao: "Criar kit", largura: 640 });
  if (!r) return;
  const [a, id] = String(r.kit).split(":");
  const kit = KITS_INICIAIS[a]?.find(k => k.id === id);
  if (!kit) return;
  await actor.createEmbeddedDocuments("Item", kit.itens.map(([nome, type, qtd]) => ({ name: nome, type, system: qtd ? { quantity: qtd } : {} })));
  const upd = {};
  for (const [m, v] of Object.entries(kit.moedas)) upd[`${P}.moedas.${m}`] = int(dados.moedas?.[m]) + v;
  if (Object.keys(upd).length) await actor.update(upd);
  ui.notifications.info(`Kit criado: ${kit.itens.length} item(ns).`);
}

/* -------------------------------------------- */
/*  Votos, pactos e talentos                    */
/* -------------------------------------------- */

export async function quebrarPacto(actor, id) {
  const pacto = actor.flags?.[FLAG]?.pactos?.[id];
  if (!pacto) return;
  const r = await formulario(`Quebrar pacto: ${pacto.nome || "sem nome"}`, `
    <p>${escapar(PENALIDADE_PACTO)}</p>
    <p class="epm-dica">Distribua os −20 pontos de atributo entre os atributos (o total precisa dar 20).</p>
    <div class="epm-grade-atributos">${Object.entries(ATRIBUTOS).map(([aid, a]) => `<label class="epm-campo epm-campo-mini"><span>${escapar(a.label)}</span><input type="number" name="a_${aid}" value="0" min="0"></label>`).join("")}</div>
    <label class="epm-campo"><span>Habilidades bloqueadas por (horas, definido pela outra parte; 0 = até o Mestre liberar)</span><input type="number" name="horas" value="24"></label>`, { botao: "Quebrar o pacto" });
  if (!r) return;
  const atributos = {};
  let soma = 0;
  for (const aid of Object.keys(ATRIBUTOS)) { const v = Math.max(0, int(r[`a_${aid}`])); if (v) { atributos[aid] = v; soma += v; } }
  if (soma !== 20) ui.notifications.warn(`Os pontos somam ${soma}, não 20.`);
  const horas = Math.max(0, int(r.horas));
  const agora = game.time?.worldTime ?? 0;
  const hp = actor.system?.attributes?.hp ?? {};
  const novoMax = Math.max(1, Math.floor(int(hp.max) / 2));
  await actor.update({
    [`${P}.pactos.${id}.quebrado`]: true,
    [`${P}.pactos.${id}.penalidade`]: { atributos, pvMaxAntes: int(hp.max) },
    [`${P}.pactos.${id}.bloqueioAte`]: horas ? agora + horas * 3600 : 0,
    "system.attributes.hp.max": novoMax, "system.attributes.hp.value": Math.min(int(hp.value), novoMax)
  });
  return notaChat(actor, `<p><strong>Pacto quebrado:</strong> ${escapar(pacto.nome || "")}</p><p>Vida máxima ${int(hp.max)} → ${novoMax}; −${soma} pontos de atributo; habilidades bloqueadas${horas ? ` por ${horas} h` : " até o Mestre liberar"}.</p>`, "#B0479A");
}

export async function comprarTalento(actor, id) {
  const t = actor.flags?.[FLAG]?.talentos?.[id];
  if (!t || t.comprado) return;
  const custo = Math.max(0, int(t.custo));
  const pev = int(actor.flags[FLAG].pontos?.pev);
  if (pev < custo) return ui.notifications.warn(`Faltam ${custo - pev} PEv para comprar ${t.nome || "o talento"}.`);
  const extrasAtr = Object.values(t.mods ?? {}).filter(m => String(m?.alvo).startsWith("atributo.")).reduce((s, m) => s + Math.max(0, num(m.valor)), 0);
  if (extrasAtr > 2) ui.notifications.warn("Talentos, treinos e habilidades dão no máximo +2 pontos de atributo (Notion).");
  await actor.update({ [`${P}.talentos.${id}.comprado`]: true, [`${P}.pontos.pev`]: pev - custo });
  ui.notifications.info(`Talento comprado: ${t.nome || "sem nome"} (−${custo} PEv).`);
}

/* -------------------------------------------- */
/*  Nomeação de criaturas                       */
/* -------------------------------------------- */

export async function nomearCriatura(actor, id) {
  const dados = actor.flags?.[FLAG] ?? {};
  const c = dados.companheiros?.[id];
  if (!c) return;
  const { ficha } = estadoAtor(actor);
  const nivelJogador = ficha.nivelTotal;
  const r = await formulario(`Nomear: ${c.nome || "criatura"}`, `
    <p class="epm-dica">Ritual sem teste. A criatura precisa estar domesticada; as inteligentes precisam aceitar o nome.</p>
    <label class="epm-campo"><span>Nível da criatura</span><input type="number" name="nivel" value="${int(c.nivelCriatura, 1)}" min="1" max="50"></label>
    <label class="epm-campo"><span>Quantas iguais (até 5 por ritual)</span><input type="number" name="qtd" value="1" min="1" max="5"></label>`, { botao: "Ver custo" });
  if (!r) return;
  const custo = custoNomeacao({ nivelCriatura: int(r.nivel, 1), nivelJogador, quantidade: int(r.qtd, 1), pmAtual: ficha.recursos.pm.value + Math.max(0, ficha.recursos.pm.temp ?? 0) });
  const ok = await confirmar("Custo da nomeação", `<p>Faixa <strong>${escapar(custo.faixa.label)}</strong>: ${custo.pm} PM e ${custo.exaustao} de Exaustão${custo.sobrecarga ? ` (inclui +${custo.sobrecarga} de sobrecarga: faltam ${custo.falta} PM)` : ""}.</p><p>Pagar e nomear?</p>`);
  if (!ok) return;
  const perda = calcularPerda(ficha, "pm", custo.pmPago);
  await actor.update({
    ...perda.updates, [`${P}.exaustao`]: Math.min(6, int(dados.exaustao) + custo.exaustao),
    [`${P}.companheiros.${id}.nomeada`]: true, [`${P}.companheiros.${id}.nivelCriatura`]: int(r.nivel, 1),
    [`${P}.companheiros.${id}.faixa`]: custo.faixa.id, [`${P}.companheiros.${id}.quantidade`]: custo.quantidade
  });
  return notaChat(actor, `<p><strong>Nomeação:</strong> ${escapar(c.nome || "criatura")} (${escapar(custo.faixa.label)}${custo.quantidade > 1 ? ` ×${custo.quantidade}` : ""})</p><p>−${custo.pmPago} PM, +${custo.exaustao} Exaustão. Ganha aumento de atributos, 1 habilidade única e um vínculo permanente.</p>`, "#7FB4E6");
}

/* -------------------------------------------- */
/*  Classes do Notion                           */
/* -------------------------------------------- */

export async function alternarFuria(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const ativa = !!dados.classeEpm?.furiaAtiva;
  if (ativa) return actor.update({ [`${P}.classeEpm.furiaAtiva`]: false });
  const usos = int(dados.classeEpm?.furiaUsos);
  if (usos >= CLASSES_NOTION.barbaro.furia.usos) return ui.notifications.warn("Fúria: os 2 usos deste descanso já foram.");
  await actor.update({ [`${P}.classeEpm.furiaAtiva`]: true, [`${P}.classeEpm.furiaUsos`]: usos + 1 });
  const { ficha } = estadoAtor(actor);
  const f = ficha.extras?.classe?.furia;
  return notaChat(actor, `<p><strong>Fúria!</strong> +${f?.dano ?? 0} de dano e RD ${f?.rd ?? 0} até o fim da cena (${usos + 1}/2 neste descanso).</p>`, "#D2544A");
}

export async function alternarLista(actor, caminho, id, max = 99) {
  const atual = foundry.utils.getProperty(actor.flags?.[FLAG] ?? {}, caminho);
  const lista = Array.isArray(atual) ? [...atual] : [];
  const i = lista.indexOf(id);
  if (i >= 0) lista.splice(i, 1);
  else if (lista.length < max) lista.push(id);
  else return ui.notifications.warn(`No seu nível: até ${max}.`);
  return actor.update({ [`${P}.${caminho}`]: lista });
}

/* -------------------------------------------- */
/*  Ações e Noção de Vitalidade                 */
/* -------------------------------------------- */

/** A Ação Padrão não usada vira uma Ação Bônus ou de Movimento extra neste turno (Notion). */
export async function converterPadrao(actor, para) {
  const dados = actor.flags?.[FLAG] ?? {};
  if (dados.acoes?.padrao) return ui.notifications.warn("A Ação Padrão já foi usada neste turno.");
  if (!["bonus", "movimento"].includes(para)) return;
  return actor.update({ [`${P}.acoes.padrao`]: true, [`${P}.acoes.convertida`]: para });
}

export async function usarNocaoVitalidade(actor) {
  const alvos = [...(game.user?.targets ?? [])].map(t => t.actor).filter(Boolean);
  if (!alvos.length) return ui.notifications.warn("Marque os alvos (tecla T) e use de novo.");
  const { ficha } = estadoAtor(actor);
  const c = custoRecurso(ficha, "pe", 5);
  if (!c.ok) return ui.notifications.warn(`Noção de Vitalidade: faltam ${c.falta} PE.`);
  if (Object.keys(c.updates).length) await actor.update(c.updates);
  const linhas = alvos.map(a => { const hp = a.system?.attributes?.hp ?? {}; return `<li><strong>${escapar(a.name)}</strong>: ${nocaoVitalidade(int(hp.value), int(hp.max))}</li>`; });
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }), whisper: [game.user.id, ...game.users.filter(u => u.isGM).map(u => u.id)],
    content: `<div class="epm-chat epm-chat-nota"><p><strong>Noção de Vitalidade</strong> (−5 PE)</p><ul>${linhas.join("")}</ul></div>`
  });
}

/* -------------------------------------------- */
/*  Turno e fim de combate                      */
/* -------------------------------------------- */

/** Início do turno: libera a Manobra, desfaz a conversão da Ação Padrão e cobra Estamina de armaduras (Genesis). */
export async function inicioDeTurno060(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const upd = {};
  if (dados.usos?.manobraTurno) upd[`${P}.usos.manobraTurno`] = false;
  if (dados.acoes?.convertida) upd[`${P}.acoes.convertida`] = "";
  const custo = actor.items.filter(i => i.type === "equipment" && i.system?.equipped).reduce((s, i) => s + int(i.flags?.[FLAG]?.estaminaPorTurno), 0);
  let texto = "";
  if (custo) {
    const { ficha } = estadoAtor(actor);
    Object.assign(upd, calcularPerda(ficha, "pe", custo).updates);
    texto = `−${custo} PE (armadura)`;
  }
  if (Object.keys(upd).length) await actor.update(upd);
  return texto;
}

/** Fim de combate: Fúria acaba (dura 1 cena), Projeto Ágil e pacote de munição liberados. */
export function fimDeCombate060(dados) {
  const upd = {};
  if (dados.classeEpm?.furiaAtiva) upd[`${P}.classeEpm.furiaAtiva`] = false;
  if (dados.usos?.projetoAgil) upd[`${P}.usos.projetoAgil`] = false;
  if (dados.usos?.pacotes && Object.keys(dados.usos.pacotes).length) upd[`${P}.usos.-=pacotes`] = null;
  return upd;
}

/* -------------------------------------------- */
/*  Métodos da ficha                            */
/* -------------------------------------------- */

export const NOMES_ACOES_060 = [
  "escolherRaca", "caminho", "sanidadeDano", "sanidadeRecuperar", "insanidadeRolar", "insanidadeEncerrar", "insanidadeRemover",
  "rolarNiveisRecursos", "treinoCatalogo", "catalogoItens", "kitInicial", "novoTalento", "excluirTalento", "comprarTalento",
  "adicionarModTalento", "removerModTalento", "novoVoto", "excluirVoto", "usarVoto", "novoPacto", "excluirPacto", "quebrarPacto",
  "restaurarPacto", "nomearCriatura", "furia", "histeria", "racaAtivavel", "imagemTokenEstado", "limparTokenEstado", "escolherTokenEstado", "protecaoBarbaro", "posicaoLutador", "converterPadrao", "nocaoVitalidade",
  "acaoCompleta", "resgatarCodigo", "novoTitulo", "excluirTitulo", "insanidadeManual", "cumprirPacto",
  "compendioPegar", "compendioEnviar", "compendioAtualizar", "npcRapido", "estudarCriatura", "presencaCriatura", "exemploCriatura",
  "trilhaRelacao", "rolarComRelacao", "testeTraicao", "novaTrocaBonus", "excluirTrocaBonus", "importarMagias"
];

export const METODOS_060 = {
  acaoEscolherRaca() { return escolherRaca(this.actor); },
  async acaoCaminho(ev, alvo) {
    const id = alvo.dataset.caminho;
    const atual = int(this.actor.flags?.[FLAG]?.caminhos?.[id]);
    return this.actor.update({ [`${P}.caminhos.${id}`]: Math.max(0, atual + int(alvo.dataset.delta, 1)) });
  },
  acaoSanidadeDano() { return danoSanidade(this.actor); },
  acaoSanidadeRecuperar() { return recuperarSanidade(this.actor); },
  acaoInsanidadeRolar(ev, alvo) { return ganharInsanidade(this.actor, alvo.dataset.tipo === "permanente" ? "permanente" : "temporaria"); },
  acaoInsanidadeEncerrar(ev, alvo) {
    const atual = !!this.actor.flags?.[FLAG]?.insanidades?.[alvo.dataset.id]?.encerrada;
    return this.actor.update({ [`${P}.insanidades.${alvo.dataset.id}.encerrada`]: !atual });
  },
  async acaoInsanidadeRemover(ev, alvo) {
    if (!(await confirmar("Remover insanidade", "<p>Apagar esta insanidade da ficha?</p>"))) return;
    return this.actor.update({ [`${P}.insanidades.-=${alvo.dataset.id}`]: null });
  },
  acaoRolarNiveisRecursos() { return rolarNiveisRecursos(this.actor); },
  acaoTreinoCatalogo(ev, alvo) { return treinoDoCatalogo(this.actor, alvo.dataset.indice); },
  acaoCatalogoItens() { return catalogoItens(this.actor); },
  acaoKitInicial() { return kitInicial(this.actor); },
  acaoNovoTalento() { return this.actor.update({ [`${P}.talentos.${novoId()}`]: { nome: "Novo talento", custo: 5, descricao: "", comprado: false, mods: {}, criado: Date.now() } }); },
  async acaoExcluirTalento(ev, alvo) {
    if (!(await confirmar("Excluir talento", "<p>Apagar este talento? (Os PEv gastos não voltam.)</p>"))) return;
    return this.actor.update({ [`${P}.talentos.-=${alvo.dataset.id}`]: null });
  },
  acaoComprarTalento(ev, alvo) { return comprarTalento(this.actor, alvo.dataset.id); },
  acaoAdicionarModTalento(ev, alvo) { return this.actor.update({ [`${P}.talentos.${alvo.dataset.id}.mods.${novoId()}`]: { alvo: "atributo.forca", valor: 1 } }); },
  acaoRemoverModTalento(ev, alvo) { return this.actor.update({ [`${P}.talentos.${alvo.dataset.id}.mods.-=${alvo.dataset.mod}`]: null }); },
  acaoNovoVoto() { return this.actor.update({ [`${P}.votos.${novoId()}`]: { nome: "Novo voto", tipo: "ativavel", custo: "", efeito: "", usado: false, criado: Date.now() } }); },
  async acaoExcluirVoto(ev, alvo) {
    if (!(await confirmar("Excluir voto", "<p>Apagar este voto?</p>"))) return;
    return this.actor.update({ [`${P}.votos.-=${alvo.dataset.id}`]: null });
  },
  async acaoUsarVoto(ev, alvo) {
    const v = this.actor.flags?.[FLAG]?.votos?.[alvo.dataset.id];
    if (!v) return;
    await notaChat(this.actor, `<p><strong>Voto: ${escapar(v.nome || "")}</strong> (${v.tipo === "permanente" ? "permanente" : "ativável"})</p><p><em>Custo:</em> ${escapar(v.custo || "—")}</p><p><em>Efeito:</em> ${escapar(v.efeito || "—")}</p>`, "#C9A24E");
    if (v.tipo === "permanente") return this.actor.update({ [`${P}.votos.${alvo.dataset.id}.usado`]: true });
  },
  acaoNovoPacto() { return this.actor.update({ [`${P}.pactos.${novoId()}`]: { nome: "Novo pacto", tipo: "npc", com: "", clausulas: "", beneficios: "", quebrado: false, criado: Date.now() } }); },
  async acaoExcluirPacto(ev, alvo) {
    if (!(await confirmar("Excluir pacto", "<p>Apagar este pacto da ficha? (Se estava quebrado, a penalidade de atributos sai junto; a Vida máxima não volta sozinha.)</p>"))) return;
    return this.actor.update({ [`${P}.pactos.-=${alvo.dataset.id}`]: null });
  },
  acaoQuebrarPacto(ev, alvo) { return quebrarPacto(this.actor, alvo.dataset.id); },
  async acaoRestaurarPacto(ev, alvo) {
    const p = this.actor.flags?.[FLAG]?.pactos?.[alvo.dataset.id];
    if (!p) return;
    const upd = { [`${P}.pactos.${alvo.dataset.id}.quebrado`]: false, [`${P}.pactos.${alvo.dataset.id}.penalidade`]: null, [`${P}.pactos.${alvo.dataset.id}.bloqueioAte`]: 0 };
    if (int(p.penalidade?.pvMaxAntes)) upd["system.attributes.hp.max"] = int(p.penalidade.pvMaxAntes);
    return this.actor.update(upd);
  },
  acaoNomearCriatura(ev, alvo) { return nomearCriatura(this.actor, alvo.dataset.id); },
  acaoFuria() { return alternarFuria(this.actor); },
  async acaoImagemTokenEstado(ev, alvo) {
    const { escolherImagem } = await import("./imagens.mjs");
    const e = alvo.dataset.estado;
    const caminho = await escolherImagem({ atual: this.actor.flags?.[FLAG]?.tokensEstado?.[e] ?? "", titulo: "Imagem do token" });
    if (caminho) await this.actor.update({ [`${P}.tokensEstado.${e}`]: caminho });
  },
  async acaoLimparTokenEstado(ev, alvo) {
    await this.actor.update({ [`${P}.tokensEstado.-=${alvo.dataset.estado}`]: null });
  },
  async acaoEscolherTokenEstado() {
    const { escolherTokenEstado } = await import("./token-estados.mjs");
    return escolherTokenEstado(this.actor);
  },
  async acaoRacaAtivavel(ev, alvo) {
    const id = alvo.dataset.id;
    const atual = Array.isArray(this.actor.flags?.[FLAG]?.racaAtivas) ? this.actor.flags[FLAG].racaAtivas : [];
    const liga = !atual.includes(id);
    await this.actor.update({ [`${P}.racaAtivas`]: liga ? [...atual, id] : atual.filter(x => x !== id) });
    if (liga) notaChat(this.actor, `<p><strong>${alvo.textContent.trim()}</strong> ligado até ser desligado.</p>`);
  },
  async acaoHisteria() {
    const ativa = !!this.actor.flags?.[FLAG]?.classeEpm?.histeria;
    await this.actor.update({ [`${P}.classeEpm.histeria`]: !ativa });
    if (!ativa) notaChat(this.actor, `<p><strong>Histeria!</strong> +5 de Acerto, imune a Amedrontada e dano extra com a Faca por 3 rodadas.</p>`, "#B48CE0");
  },
  acaoProtecaoBarbaro(ev, alvo) { return alternarLista(this.actor, "classeEpm.protecoes", alvo.dataset.id, int(alvo.dataset.max, 1)); },
  acaoPosicaoLutador(ev, alvo) { return alternarLista(this.actor, "classeEpm.posicoes", alvo.dataset.id, int(alvo.dataset.max, 1)); },
  acaoConverterPadrao(ev, alvo) { return converterPadrao(this.actor, alvo.dataset.para); },
  acaoNocaoVitalidade() { return usarNocaoVitalidade(this.actor); },
  acaoAcaoCompleta() { return acaoCompleta(this.actor); },
  acaoResgatarCodigo() { return mundo.resgatarCodigo(this.actor); },
  async acaoNovoTitulo() {
    const r = await formulario("Novo título", `<label class="epm-campo"><span>Título</span><input type="text" name="nome"></label>
      <label class="epm-campo"><span>Bônus (texto)</span><input type="text" name="texto"></label><label class="epm-campo"><span>Origem</span><input type="text" name="origem" placeholder="Dado pelo Mestre"></label>`);
    if (!r?.nome) return;
    return this.actor.update({ [`${P}.titulos.${novoId()}`]: { nome: r.nome, texto: r.texto ?? "", origem: r.origem || "Dado pelo Mestre", criado: Date.now() } });
  },
  acaoExcluirTitulo(ev, alvo) { return this.actor.update({ [`${P}.titulos.-=${alvo.dataset.id}`]: null }); },
  acaoInsanidadeManual() { return insanidadeManual(this.actor); },
  async acaoCumprirPacto(ev, alvo) {
    if (!(await confirmar("Pacto cumprido", "<p>Marcar este pacto como cumprido? (Conta para a conquista Palavra de Ferro.)</p>"))) return;
    return this.actor.update({ [`${P}.pactos.${alvo.dataset.id}.cumprido`]: true, [`${P}.conquistas.pactosCumpridos`]: int(this.actor.flags?.[FLAG]?.conquistas?.pactosCumpridos) + 1 });
  },
  acaoCompendioPegar(ev, alvo) { return mundo.pegarDoCompendio(this.actor, alvo.dataset.tipo); },
  async acaoCompendioEnviar(ev, alvo) {
    if (alvo.dataset.tipo && alvo.dataset.id) return mundo.enviarAoCompendio(this.actor, alvo.dataset.tipo, alvo.dataset.id);
    const dados = this.actor.flags?.[FLAG] ?? {};
    const lista = Object.entries(mundo.TIPOS_COMPENDIO).flatMap(([tipo, t]) => Object.entries(dados[tipo] ?? {}).filter(([, x]) => x).map(([id, x]) => [`${tipo}:${id}`, `${t.label}: ${x.nome || "sem nome"}`]));
    if (!lista.length) return ui.notifications.info("Esta ficha não tem treinos, bênçãos, receitas, criaturas ou talentos para enviar.");
    const r = await formulario("Enviar ao compêndio do mundo", `<label class="epm-campo"><span>Entrada</span><select name="ref">${mundo.opcoes(lista)}</select></label>
      <p class="epm-dica">O progresso pessoal (horas, usos, encontros) não vai junto. Se a entrada já veio do compêndio, a versão é atualizada e as fichas avisam.</p>`, { botao: "Enviar" });
    if (!r) return;
    const [tipo, id] = String(r.ref).split(":");
    return mundo.enviarAoCompendio(this.actor, tipo, id);
  },
  acaoCompendioAtualizar(ev, alvo) { return mundo.atualizarDoCompendio(this.actor, alvo.dataset.tipo, alvo.dataset.id); },
  acaoNpcRapido() { return mundo.fichaRapidaNpc(this.actor); },
  acaoEstudarCriatura(ev, alvo) { return mundo.estudarCriatura(this.actor, alvo.dataset.id); },
  acaoPresencaCriatura(ev, alvo) {
    const b = this.actor.flags?.[FLAG]?.bestiario?.[alvo.dataset.id];
    if (!b?.presenca) return;
    return ChatMessage.create({ content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#A47DDB"><p><strong>Presença de ${escapar(b.nome)}</strong>: quem a vê sofre dano de Sanidade.</p>
      <p><button type="button" class="epm-botao epm-botao-mini" data-epm-action="sanidadeCartao" data-formula="${escapar(b.presenca)}" data-rotulo="${escapar(b.nome)}">Sofrer ${escapar(b.presenca)} de Sanidade</button></p></div>` });
  },
  acaoExemploCriatura() { return this.actor.update({ [`${P}.bestiario.${novoId()}`]: { ...EXEMPLO_CRIATURA, img: "", uuid: "", encontros: 0, derrotados: 0, notas: "", criado: Date.now() } }); },
  acaoTrilhaRelacao(ev, alvo) {
    const { relacao, trilha } = alvo.dataset;
    const atual = int(this.actor.flags?.[FLAG]?.relacoes?.[relacao]?.[trilha]);
    const valor = int(alvo.dataset.valor);
    return this.actor.update({ [`${P}.relacoes.${relacao}.${trilha}`]: atual === valor ? valor - 1 : valor });
  },
  acaoRolarComRelacao(ev, alvo) { return rolarComRelacao(this.actor, alvo.dataset.relacao, ev); },
  acaoTesteTraicao(ev, alvo) { return testeTraicao(this.actor, alvo.dataset.relacao); },
  acaoNovaTrocaBonus() { return novaTrocaBonus(this.actor); },
  async acaoImportarMagias() { const { importarMagias } = await import("./importar-magias.mjs"); return importarMagias(this.actor); },
  async acaoExcluirTrocaBonus(ev, alvo) {
    if (!(await confirmar("Desfazer troca", "<p>Desfazer esta troca de bônus? Cada atributo volta a dar o próprio bônus.</p>"))) return;
    const t = this.actor.flags?.[FLAG]?.trocasBonus?.[alvo.dataset.id];
    const voto = t?.voto && this.actor.flags?.[FLAG]?.votos?.[t.voto];
    const upd = { [`${P}.trocasBonus.-=${alvo.dataset.id}`]: null };
    if (voto?.tipo === "passivo") upd[`${P}.votos.-=${t.voto}`] = null;
    return this.actor.update(upd);
  }
};

/** Troca de bônus de atributo acima de 4: via de mão dupla, ligada a um voto que o Mestre aprova. */
export async function novaTrocaBonus(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const atrs = Object.keys(ATRIBUTOS_ACIMA_4);
  const ocupados = new Set(Object.values(dados.trocasBonus ?? {}).flatMap(t => t ? [t.a, t.b] : []));
  const livres = atrs.filter(a => !ocupados.has(a)).map(a => [a, ATRIBUTOS[a].label]);
  if (livres.length < 2) return ui.notifications.warn("Não há dois atributos livres para trocar (cada atributo entra em uma troca só).");
  const r = await formulario("Trocar bônus de atributo", `
    <p class="epm-dica">Os dois atributos trocam de bônus entre si (ex.: Força passa a dar RD e Constituição passa a dar dano extra). A ficha cria um <strong>voto passivo</strong> (não conta no limite de votos); a troca só vale depois que o Mestre aprovar esse voto.</p>
    <label class="epm-campo"><span>Atributo</span><select name="a">${opcoes(livres)}</select></label>
    <label class="epm-campo"><span>Troca com</span><select name="b">${opcoes(livres, livres[1][0])}</select></label>
    `, { botao: "Trocar" });
  if (!r) return;
  if (r.a === r.b) return ui.notifications.warn("Escolha dois atributos diferentes.");
  const idVoto = novoId();
  const nomeA = ATRIBUTOS[r.a]?.label ?? r.a, nomeB = ATRIBUTOS[r.b]?.label ?? r.b;
  await actor.update({
    [`${P}.votos.${idVoto}`]: { nome: `Troca de bônus: ${nomeA} ↔ ${nomeB}`, tipo: "passivo", custo: "", efeito: `${nomeA} e ${nomeB} trocam os bônus de atributo acima de 4.`, usado: false, aprovado: false, criado: Date.now() },
    [`${P}.trocasBonus.${novoId()}`]: { a: r.a, b: r.b, voto: idVoto, criado: Date.now() }
  });
  ui.notifications.info("Troca criada com um voto passivo. Peça ao Mestre para aprovar o voto.");
}

/* -------------------------------------------- */
/*  Ação Completa (modelo da 0.6.0)             */
/* -------------------------------------------- */

export const ACOES_COMPLETAS = [
  { id: "investida", label: "Investida", texto: "Até 2× o deslocamento em linha reta e um ataque com +2 no acerto; −2 na CA até o próximo turno." },
  { id: "correr", label: "Correr", texto: "Move até 3× o deslocamento." },
  { id: "recarga", label: "Recarga Lenta", texto: "Recarrega uma arma com a propriedade Recarga Lenta." },
  { id: "socorros", label: "Primeiros Socorros", texto: "Medicina DT 20: estabiliza quem está Morrendo." },
  { id: "outra", label: "Outra", texto: "Qualquer coisa que o Mestre considere uma Ação Completa." }
];

export async function acaoCompleta(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  if (dados.acoes?.padrao || dados.acoes?.movimento) return ui.notifications.warn("A Ação Completa precisa da Ação Padrão e da de Movimento livres.");
  const r = await formulario("Ação Completa", `<p class="epm-dica">Gasta a Ação Padrão e a de Movimento; sobram a Bônus e a Reação.</p>
    ${ACOES_COMPLETAS.map((a, i) => `<label class="epm-check epm-check-bloco"><input type="radio" name="tipo" value="${a.id}" ${i === 0 ? "checked" : ""}> <span><strong>${escapar(a.label)}</strong> ${escapar(a.texto)}</span></label>`).join("")}`, { botao: "Usar" });
  if (!r) return;
  const a = ACOES_COMPLETAS.find(x => x.id === r.tipo) ?? ACOES_COMPLETAS.at(-1);
  const { ficha } = estadoAtor(actor);
  const upd = { [`${P}.acoes.padrao`]: true, [`${P}.acoes.movimento`]: true };
  let extra = "";
  if (a.id === "investida") {
    upd[`${P}.bonusCena.${novoId()}`] = { nome: "Investida (+2 no acerto, −2 na CA)", acerto: 2, dano: "", ativo: true, criado: Date.now() };
    extra = `<p class="epm-dica">Deslocamento até ${2 * (ficha.deslocamento?.final ?? 9)} m. O bônus de +2 no acerto ficou nos bônus de cena (desligue depois do ataque); −2 na CA até o próximo turno.</p>`;
  }
  if (a.id === "correr") extra = `<p class="epm-dica">Até ${3 * (ficha.deslocamento?.final ?? 9)} m.</p>`;
  await actor.update(upd);
  await notaChat(actor, `<p><strong>Ação Completa: ${escapar(a.label)}</strong>. ${escapar(a.texto)}</p>${extra}`, "#D3A85E");
  if (a.id === "socorros") {
    const per = ficha.periciaPorId.medicina;
    const t = await rolarTeste(actor, { rotulo: "Primeiros Socorros (Medicina DT 20)", bonus: per?.total ?? 0 });
    if (t && t.total >= 20) {
      const alvo = [...(game.user?.targets ?? [])][0]?.actor;
      await notaChat(actor, `<p>Estabilizou${alvo ? ` ${escapar(alvo.name)}` : " o ferido"}: deixa de estar Morrendo.</p>`, "#5FB38A");
      if (alvo?.isOwner) for (const id of ["epm-n-morrendo", "epm-morrendo"]) if (alvo.statuses?.has(id)) await alvo.toggleStatusEffect(id, { active: false });
    }
  }
}

/* -------------------------------------------- */
/*  Insanidade manual (estrutura da 0.6.0)      */
/* -------------------------------------------- */

export async function insanidadeManual(actor) {
  const r = await formulario("Nova insanidade", `
    <label class="epm-campo"><span>Nome</span><input type="text" name="nome" placeholder="Fobia de fogo"></label>
    <label class="epm-campo"><span>Tipo</span><select name="categoria">${Object.entries(TIPOS_INSANIDADE).map(([id, l]) => `<option value="${id}">${escapar(l)}</option>`).join("")}</select></label>
    <label class="epm-campo"><span>Intensidade</span><select name="intensidade">${Object.entries(INTENSIDADES_INSANIDADE).map(([id, x]) => `<option value="${id}">${escapar(x.label)} — ${escapar(x.texto)}</option>`).join("")}</select></label>
    <label class="epm-campo"><span>Gatilho</span><input type="text" name="gatilho" placeholder="Ver chamas a até 9 m"></label>
    <label class="epm-campo"><span>Efeito</span><input type="text" name="efeito" placeholder="Fica Apavorado enquanto vê; na Intensa, não usa ataques de Fogo"></label>`, { botao: "Criar" });
  if (!r?.nome) return;
  return actor.update({ [`${P}.insanidades.${novoId()}`]: {
    tipo: r.intensidade === "permanente" ? "permanente" : "temporaria", nome: r.nome, texto: "", categoria: r.categoria, intensidade: r.intensidade,
    intensa: r.intensidade === "intensa", gatilho: r.gatilho ?? "", efeito: r.efeito ?? "", condicoes: [], criada: Date.now(), criado: Date.now(), encerrada: false
  } });
}

/* -------------------------------------------- */
/*  Receio e Confiança (relações)               */
/* -------------------------------------------- */

export async function rolarComRelacao(actor, relId, evento) {
  const rel = actor.flags?.[FLAG]?.relacoes?.[relId];
  if (!rel) return;
  const conf = Math.max(0, Math.min(5, int(rel.confianca)));
  const rec = Math.max(0, Math.min(5, int(rel.receio)));
  const r = await formulario(`Teste social com ${rel.nome || "NPC"}`, `<label class="epm-campo"><span>Perícia</span><select name="pericia">
    <option value="diplomacia">Diplomacia (+${2 * conf} pela Confiança)</option><option value="labia">Lábia (+${2 * conf} pela Confiança)</option><option value="intimidacao">Intimidação (+${2 * rec} pelo Receio)</option></select></label>`, { botao: "Rolar" });
  if (!r) return;
  const { ficha } = estadoAtor(actor);
  const per = ficha.periciaPorId[r.pericia];
  const bonus = r.pericia === "intimidacao" ? 2 * rec : 2 * conf;
  return rolarTeste(actor, { rotulo: `${per?.nome ?? r.pericia} com ${rel.nome || "NPC"}`, bonus: (per?.total ?? 0) + bonus, evento,
    penalidades: [{ valor: bonus, fonte: r.pericia === "intimidacao" ? "Receio" : "Confiança" }] });
}

export async function testeTraicao(actor, relId) {
  const rel = actor.flags?.[FLAG]?.relacoes?.[relId];
  if (!rel) return;
  const roll = new Roll(`1d20 + ${int(rel.receio)} - ${int(rel.confianca)}`);
  await roll.evaluate();
  const trai = roll.total >= 15;
  return ChatMessage.create({
    whisper: game.users.filter(u => u.isGM).map(u => u.id), rolls: [roll],
    content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#B0479A"><p><strong>Traição? ${escapar(rel.nome || "NPC")}</strong> (com ${escapar(actor.name)})</p>
      <p>d20 + Receio ${int(rel.receio)} − Confiança ${int(rel.confianca)} = <strong>${roll.total}</strong>: ${trai ? "trai ou foge." : "continua leal."}</p>
      <p class="epm-dica">Rolar quando o personagem cai para metade da Vida ou menos, ou quando o NPC recebe proposta melhor.</p></div>`
  });
}

export { PROPRIEDADES_ARMA };
