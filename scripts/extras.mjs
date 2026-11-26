/**
 * Mecânicas da 0.5.4: histórico de afinidade e reputação, transformações, arquétipos modelo,
 * companheiros, bestiário, atrasar turno, ataque de oportunidade, Ressonância de Alma,
 * timeskip de treino, diário de sessões, ações em várias habilidades e os botões novos do chat.
 */
import {
  FLAG, CAMINHO, AFINIDADE, HISTORICO_MAX, CUSTO_RECURSOS, RECURSOS, RARIDADES_PODER, ORIGENS_HABILIDADE, CIRCULOS,
  UNIDADES_TEMPO, TREINO, REGRAS
} from "./config.mjs";
import { num, int, novoId, formaPadrao } from "./data.mjs";
import {
  ARQUETIPOS, nivelArquetipo, arquetiposDoPersonagem, idArquetipo as idArquetipoNome, degrau, efeitoMaestria, bonusAutomato, recuperarManaDe, cacadorDe, folegoDe, usosFolego, sobrecargaDe, corpoDeManaDe, zonaDeManaDe
} from "./arquetipos.mjs";
import { CLASSES_EPM, habilidadesDaClasse, habilidadesLiberadas, tipoDoElemento } from "./regras-extras.mjs";
import { idClasse } from "./ficha-extras.mjs";
import { fvtt, escapar } from "./helpers.mjs";
import { dataDoMundo } from "./calendario.mjs";
import { ataquesDaArma } from "./context.mjs";
import { curaDoCartao } from "./projetos.mjs";
import {
  estadoAtor, confirmar, calcularPerda, calcularRecuperacao, rolarFormula, horasDoTreino, usarPoder, cartaoItem, dialogoAtaque, rolarTeste
} from "./mecanicas.mjs";

const P = `flags.${FLAG}`;
const falar = actor => ChatMessage.getSpeaker({ actor });
const nota = (actor, html, cor = "") => ChatMessage.create({
  speaker: falar(actor), content: `<div class="epm-chat epm-chat-nota"${cor ? ` style="--cor: ${cor}"` : ""}>${html}</div>`
});
const limitarAf = v => Math.max(AFINIDADE.min, Math.min(AFINIDADE.max, int(v)));

/** Opções de um DialogV2 simples (devolve o objeto do callback ou null). */
export async function dialogo({ titulo, content, ok = "Confirmar", icone = "fa-solid fa-check", callback, render }) {
  const r = await fvtt.DialogV2.wait({
    window: { title: titulo }, classes: ["epm-dialogo"], rejectClose: false, modal: true, content, render,
    buttons: [
      { action: "ok", label: ok, icon: icone, default: true, callback: (ev, b) => callback?.(b.form?.elements ?? {}, b) ?? true },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  return r && typeof r === "object" ? r : (r === true ? {} : null);
}

/**
 * Gasta um recurso (temporário primeiro). Avisa e devolve false se não houver o bastante.
 * Não grava: devolve as atualizações para juntar com outras.
 */
export function custoRecurso(ficha, recurso, valor) {
  const v = Math.max(0, Math.floor(num(valor)));
  if (!v) return { ok: true, updates: {} };
  const r = ficha.recursos[recurso];
  const disponivel = (r?.value ?? 0) + Math.max(0, r?.temp ?? 0);
  if (disponivel < v) return { ok: false, falta: v - disponivel, updates: {} };
  return { ok: true, updates: calcularPerda(ficha, recurso, v).updates };
}

async function gastar(actor, recurso, valor, motivo) {
  const { ficha } = estadoAtor(actor);
  const c = custoRecurso(ficha, recurso, valor);
  if (!c.ok) {
    ui.notifications.warn(`${motivo}: faltam ${c.falta} ${RECURSOS[recurso]?.abrev ?? recurso}.`);
    return false;
  }
  if (Object.keys(c.updates).length) await actor.update(c.updates);
  return true;
}

/* -------------------------------------------- */
/*  Histórico de afinidade e reputação          */
/* -------------------------------------------- */

/**
 * Atualizações que registram uma mudança no histórico de `caminho` (relacoes.<id> ou faccoes.<id>)
 * e apagam as mais velhas além do limite.
 */
export function entradaHistorico(registro, caminho, de, para, { origem = "", motivo = "" } = {}) {
  const updates = {};
  updates[`${P}.${caminho}.historico.${novoId()}`] = {
    quando: Date.now(), data: dataDoMundo(), quem: game.user?.name ?? "", de, para, origem, motivo
  };
  const antigos = Object.entries(registro?.historico ?? {}).filter(([, h]) => h).sort((a, b) => num(b[1].quando) - num(a[1].quando));
  for (const [hid] of antigos.slice(HISTORICO_MAX - 1)) updates[`${P}.${caminho}.historico.-=${hid}`] = null;
  return updates;
}

export async function ajustarAfinidade(actor, id, delta, { origem = "", motivo = "" } = {}) {
  const rel = actor.flags?.[FLAG]?.relacoes?.[id];
  if (!rel) return null;
  const atual = limitarAf(rel.afinidade);
  const novo = limitarAf(atual + int(delta));
  if (novo === atual) return null;
  const upd = entradaHistorico(rel, `relacoes.${id}`, atual, novo, { origem, motivo });
  await actor.update({ [`${P}.relacoes.${id}.afinidade`]: novo, ...upd });
  // id da entrada nova (para o campo de motivo que aparece logo abaixo)
  return Object.keys(upd).find(k => !k.includes(".-="))?.split(".historico.")[1] ?? null;
}

export async function ajustarReputacao(actor, id, delta) {
  const fac = actor.flags?.[FLAG]?.faccoes?.[id];
  if (!fac) return;
  const atual = limitarAf(fac.reputacao);
  const novo = limitarAf(atual + int(delta));
  if (novo === atual) return;
  await actor.update({ [`${P}.faccoes.${id}.reputacao`]: novo, ...entradaHistorico(fac, `faccoes.${id}`, atual, novo) });
}

/* -------------------------------------------- */
/*  Transformações                              */
/* -------------------------------------------- */

/** Troca (ou devolve) a imagem dos tokens do personagem na cena. */
async function imagemDosTokens(actor, _img) {
  // 0.6.7: a imagem passa pelo sistema de estados do token (token-estados.mjs)
  const { aplicarTokenEstado } = await import("./token-estados.mjs");
  return aplicarTokenEstado(actor);
}

export async function transformar(actor, id) {
  const dados = actor.flags?.[FLAG] ?? {};
  const t = dados.transformacoes?.[id];
  if (!t) return;
  if (dados.transformacao?.ativa === id) return destransformar(actor);
  if (dados.transformacao?.ativa) await destransformar(actor, { silencioso: true });
  const { ficha } = estadoAtor(actor);
  const updates = {};
  const rec = CUSTO_RECURSOS[t.custo?.recurso] && t.custo.recurso !== "nenhum" ? t.custo.recurso : null;
  const valor = Math.max(0, int(t.custo?.valor));
  if (rec && valor) {
    const c = custoRecurso(ficha, rec, valor);
    if (!c.ok) return ui.notifications.warn(`${t.nome || "Transformação"}: faltam ${c.falta} ${CUSTO_RECURSOS[rec].sigla}.`);
    Object.assign(updates, c.updates);
  }
  updates[`${P}.transformacao.ativa`] = id;
  updates[`${P}.transformacao.turnos`] = Math.max(0, int(t.duracao));
  await actor.update(updates);
  if (t.trocarToken && t.img) await imagemDosTokens(actor, t.img);
  return ChatMessage.create({
    speaker: falar(actor),
    content: `<div class="epm-chat epm-chat-transformacao">
      <header class="epm-chat-topo">${t.img ? `<img src="${escapar(t.img)}" alt="">` : ""}<div class="epm-chat-titulos"><h3>${escapar(actor.name)} se transforma</h3>
      <span class="epm-chat-sub">${escapar(t.nome || "Transformação")}${int(t.duracao) > 0 ? ` · ${int(t.duracao)} turno(s)` : ""}${rec && valor ? ` · ${valor} ${CUSTO_RECURSOS[rec].sigla}` : ""}</span></div></header>
      ${t.descricao ? `<p class="epm-chat-texto">${escapar(t.descricao)}</p>` : ""}
    </div>`
  });
}

export async function destransformar(actor, { porDuracao = false, silencioso = false } = {}) {
  const dados = actor.flags?.[FLAG] ?? {};
  const id = dados.transformacao?.ativa;
  if (!id) return;
  const t = dados.transformacoes?.[id] ?? {};
  await actor.update({ [`${P}.transformacao.ativa`]: "", [`${P}.transformacao.turnos`]: 0 });
  if (t.trocarToken) await imagemDosTokens(actor, null);
  if (silencioso) return;
  return nota(actor, `<p><strong>${escapar(actor.name)}</strong> volta ao normal${porDuracao ? ` (fim da duração de ${escapar(t.nome || "transformação")})` : ` (${escapar(t.nome || "transformação")})`}.</p>`);
}

/** Novo turno: conta a duração da transformação (devolve as atualizações e se terminou). */
export function turnoTransformacao(dados) {
  const id = dados?.transformacao?.ativa;
  const turnos = int(dados?.transformacao?.turnos);
  if (!id || turnos <= 0) return { updates: {}, terminou: false };
  if (turnos - 1 <= 0) return { updates: {}, terminou: true };
  return { updates: { [`${P}.transformacao.turnos`]: turnos - 1 }, terminou: false };
}

/* -------------------------------------------- */
/*  Arquétipos modelo                           */
/* -------------------------------------------- */

export function dadosHabilidadeArquetipo(arqId, h) {
  const a = ARQUETIPOS[arqId];
  const forma = formaPadrao(0, "Passiva");
  forma.acao = "passiva";
  return {
    name: h.nome, type: "feat", img: "icons/svg/upgrade.svg",
    system: { description: { value: `<p>${escapar(h.resumo)}</p><p class="epm-dica">${escapar(a.nome)}, nível ${h.nivel} (modelo 0.5).</p>` } },
    flags: { [FLAG]: {
      raridade: "comum", origem: "arquetipo", passiva: true, arquetipoRef: h.ref ?? `${arqId}:${h.nivel}`,
      formas: { [novoId()]: forma }, usos: { valor: 0, max: 0, recarga: "nenhuma" }
    } }
  };
}

/* -------------------------------------------- */
/*  Classes prontas                             */
/* -------------------------------------------- */

/** Classe pronta da ficha, o nível dela (o do arquétipo da classe) e os caminhos escolhidos. */
export function classeDaFicha(dados = {}) {
  const id = idClasse(dados.classe);
  const def = id ? CLASSES_EPM[id] : null;
  if (!def) return null;
  const nivel = arquetiposDoPersonagem(dados).find(a => a.id === (def.arquetipo ?? "combatente"))?.nivel ?? 0;
  const caminhos = Array.isArray(dados.classeEpm?.caminhos) ? dados.classeEpm.caminhos : [];
  return { id, def, nivel, caminhos };
}

/**
 * Habilidades de classe que precisam de escolha ao usar (valem até o descanso).
 * Ex.: Revestimento Elemental (Guerreiro Elemental, nível 6): resistência a um elemento desbloqueado.
 */
export function formaEspecialClasse(ref) {
  if (ref === "guerreiroElemental:pele-de-mana" || ref === "guerreiroElemental:revestimento-elemental") {
    const forma = formaPadrao(0, "Escolher elemento");
    forma.acao = "livre"; forma.uso = "curto";
    forma.efeito = "<p>Escolha um elemento desbloqueado: resistência a ele até o próximo descanso. Depois do descanso, pode escolher de novo.</p>";
    const elementos = (CLASSES_EPM.guerreiroElemental?.elementos ?? []).flatMap(([nivel, lista]) => lista.map(e => [nivel, e]));
    forma.bonus = {
      gatilho: "uso", escolha: "escolher", duracao: "descanso",
      opcoes: Object.fromEntries(elementos.map(([nivel, e], i) => [`el${i}`, { tipo: "resistencia", valor: tipoDoElemento(e), rotulo: e, nivel, criado: i + 1 }]))
    };
    return { forma, passiva: false };
  }
  return null;
}

export function dadosHabilidadeClasse(classeId, h) {
  const c = CLASSES_EPM[classeId];
  const especial = formaEspecialClasse(h.ref);
  const forma = especial?.forma ?? formaPadrao(0, "Passiva");
  if (!especial) forma.acao = "passiva";
  const caminho = h.caminho ? ` · ${c.caminhos?.[h.caminho] ?? h.caminho}` : "";
  return {
    name: h.nome, type: "feat", img: "icons/svg/book.svg",
    system: { description: { value: `<p>${escapar(h.texto)}</p><p class="epm-dica">${escapar(c.nome)}, nível ${h.nivel}${escapar(caminho)}.</p>` } },
    flags: { [FLAG]: {
      raridade: "comum", origem: "classe", passiva: especial ? especial.passiva : true, classeRef: h.ref,
      formas: { [novoId()]: forma }, usos: { valor: 0, max: 0, recarga: "nenhuma" }
    } }
  };
}

/**
 * Cria na ficha (sub-aba Classe) as habilidades liberadas da classe que faltam.
 * `ref` = uma habilidade ("barbaro:furia") ou vazio (todas as liberadas). `automatico`: pula as que o jogador apagou.
 */
export async function adicionarHabilidadesClasse(actor, ref = "", { automatico = false } = {}) {
  const dados = actor.flags?.[FLAG] ?? {};
  const cl = classeDaFicha(dados);
  if (!cl) return;
  const jaTem = new Set(actor.items.map(i => i.flags?.[FLAG]?.classeRef).filter(Boolean));
  const dispensadas = new Set(Array.isArray(dados.classeDispensadas) ? dados.classeDispensadas : []);
  const liberadas = habilidadesLiberadas(cl.id, cl.nivel, cl.caminhos);
  const alvo = ref ? liberadas.filter(h => h.ref === ref) : liberadas.filter(h => !(automatico && dispensadas.has(h.ref)));
  const novas = alvo.filter(h => !jaTem.has(h.ref));
  if (!novas.length) {
    if (!automatico) ui.notifications.info("Nada novo para adicionar.");
    return;
  }
  // Quem pede à mão volta a querer a habilidade: sai da lista de apagadas
  const voltam = novas.filter(h => dispensadas.has(h.ref)).map(h => h.ref);
  if (voltam.length) await actor.update({ [`${P}.classeDispensadas`]: [...dispensadas].filter(r => !voltam.includes(r)) });
  await actor.createEmbeddedDocuments("Item", novas.map(h => dadosHabilidadeClasse(cl.id, h)));
  ui.notifications.info(automatico
    ? `${actor.name}: ${novas.map(h => h.nome).join(", ")} (${cl.def.nome}) entrou na sub-aba Classe.`
    : `${novas.length} habilidade(s) de ${cl.def.nome} adicionada(s) na sub-aba Classe.`);
}

/** Pergunta se tira da ficha as habilidades de classe que não são da classe nova. */
async function tirarHabilidadesDeOutraClasse(actor, novaId = "") {
  const outras = actor.items.filter(i => {
    const r = i.flags?.[FLAG]?.classeRef;
    return r && r.split(":")[0] !== novaId;
  });
  if (!outras.length) return;
  const nomes = outras.map(i => escapar(i.name)).join(", ");
  const ok = await confirmar("Habilidades da classe anterior", `<p>Tirar da ficha as habilidades da classe anterior?</p><p class="epm-dica">${nomes}</p>`);
  if (ok) await actor.deleteEmbeddedDocuments("Item", outras.map(i => i.id), { epmTrocaClasse: true });
}

/** Escolhe uma classe pronta (só as do arquétipo do personagem) e já cria as habilidades liberadas. */
export async function escolherClasse(actor, id) {
  const def = CLASSES_EPM[id];
  if (!def || !actor?.isOwner) return;
  const dados = actor.flags?.[FLAG] ?? {};
  const arqs = arquetiposDoPersonagem(dados).map(a => a.id);
  if (!arqs.includes(def.arquetipo ?? "combatente")) return ui.notifications.warn(`${def.nome} é uma classe de ${ARQUETIPOS[def.arquetipo]?.nome ?? def.arquetipo}: escolha esse arquétipo primeiro.`);
  if (idClasse(dados.classe) === id) return adicionarHabilidadesClasse(actor);
  await tirarHabilidadesDeOutraClasse(actor, id);
  await actor.update({ [`${P}.classe`]: def.nome, [`${P}.classeLivre`]: false, [`${P}.classeDispensadas`]: [], [`${P}.classeEpm.caminhos`]: [] });
  await adicionarHabilidadesClasse(actor, "", { automatico: true });
}

/**
 * Arquétipo arrastado do compêndio (item Classe do D&D): vira o arquétipo principal ou o segundo.
 * Depois cria as habilidades de arquétipo já liberadas no nível da ficha.
 */
export async function definirArquetipo(actor, arqId) {
  const a = ARQUETIPOS[arqId];
  if (!a || !actor?.isOwner) return;
  const dados = actor.flags?.[FLAG] ?? {};
  const um = idArquetipoNome(dados.arquetipo), dois = idArquetipoNome(dados.arquetipo2);
  if (um === arqId || dois === arqId) return ui.notifications.info(`${actor.name} já tem o arquétipo ${a.nome}.`);
  let campo = "arquetipo";
  if (String(dados.arquetipo ?? "").trim()) {
    const r = await fvtt.DialogV2.wait({
      window: { title: `Arquétipo: ${a.nome}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
      content: `<p>${escapar(actor.name)} já é <strong>${escapar(dados.arquetipo)}</strong>${dois ? ` e <strong>${escapar(dados.arquetipo2)}</strong>` : ""}. Onde entra ${escapar(a.nome)}?</p>`,
      buttons: [
        { action: "arquetipo2", label: dois ? "Trocar o segundo" : "Segundo arquétipo", icon: "fa-solid fa-plus", default: true },
        { action: "arquetipo", label: "Trocar o principal", icon: "fa-solid fa-right-left" },
        { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
      ]
    });
    if (r !== "arquetipo" && r !== "arquetipo2") return;
    campo = r;
  }
  await actor.update({ [`${P}.${campo}`]: a.nome });
  ui.notifications.info(`${actor.name}: arquétipo ${a.nome}${campo === "arquetipo2" ? " (segundo)" : ""}.`);
  const nivel = nivelArquetipo(actor.flags?.[FLAG] ?? {}, arqId);
  if (a.habilidades.some(h => h.nivel <= nivel)) await adicionarHabilidadesArquetipo(actor, arqId);
}

/** Classe arrastada do compêndio (item Subclasse do D&D). Sem o arquétipo dela na ficha, define antes. */
export async function definirClassePorItem(actor, classeId) {
  const def = CLASSES_EPM[classeId];
  if (!def || !actor?.isOwner) return;
  const dados = actor.flags?.[FLAG] ?? {};
  const arqId = def.arquetipo ?? "combatente";
  const tem = arquetiposDoPersonagem(dados).some(a => a.id === arqId);
  if (!tem) {
    if (String(dados.arquetipo ?? "").trim()) {
      return ui.notifications.warn(`${def.nome} é uma classe de ${ARQUETIPOS[arqId]?.nome ?? arqId}. Arraste esse arquétipo do compêndio primeiro.`);
    }
    await actor.update({ [`${P}.arquetipo`]: ARQUETIPOS[arqId]?.nome ?? arqId });
  }
  return escolherClasse(actor, classeId);
}

/** Habilidade de arquétipo ou de classe arrastada do compêndio: entra sem custo (é da classe), sem repetir. */
export async function adicionarHabilidadeDoCompendio(actor, item) {
  if (!actor?.isOwner) return;
  const f = item.flags?.[FLAG] ?? {};
  const ja = actor.items.find(i => (f.classeRef && i.flags?.[FLAG]?.classeRef === f.classeRef) || (f.arquetipoRef && i.flags?.[FLAG]?.arquetipoRef === f.arquetipoRef));
  if (ja) return ui.notifications.info(`${actor.name} já tem ${item.name}.`);
  const data = item.toObject();
  for (const k of ["_id", "folder", "sort", "ownership", "_stats"]) delete data[k];
  delete data.flags[FLAG].compendio;
  if (f.classeRef) {
    const dispensadas = (actor.flags?.[FLAG]?.classeDispensadas ?? []).filter(r => r !== f.classeRef);
    await actor.update({ [`${P}.classeDispensadas`]: dispensadas });
  }
  await actor.createEmbeddedDocuments("Item", [data]);
  ui.notifications.info(`${item.name} entrou na sub-aba ${f.classeRef ? "Classe" : "Arquétipo"}.`);
}

/** Volta para a escolha de classe (ou para uma classe escrita à mão, com `livre`). */
export async function trocarClasse(actor, { livre = false } = {}) {
  if (!actor?.isOwner) return;
  await tirarHabilidadesDeOutraClasse(actor, "");
  await actor.update({ [`${P}.classe`]: "", [`${P}.classeLivre`]: livre, [`${P}.classeDispensadas`]: [] });
}

/** Liga ou desliga um caminho da classe (Caminho do Escudo, Punho de Aço…). */
export async function alternarCaminhoClasse(actor, caminho) {
  const cl = classeDaFicha(actor.flags?.[FLAG] ?? {});
  if (!cl?.def.caminhos?.[caminho]) return;
  const liga = !cl.caminhos.includes(caminho);
  await actor.update({ [`${P}.classeEpm.caminhos`]: liga ? [...cl.caminhos, caminho] : cl.caminhos.filter(c => c !== caminho) });
  if (liga) await adicionarHabilidadesClasse(actor, "", { automatico: true });
  else {
    const doCaminho = new Set(habilidadesDaClasse(cl.id).filter(h => h.caminho === caminho).map(h => h.ref));
    const itens = actor.items.filter(i => doCaminho.has(i.flags?.[FLAG]?.classeRef));
    if (itens.length && await confirmar(cl.def.caminhos[caminho], `<p>Tirar da ficha as habilidades do ${escapar(cl.def.caminhos[caminho])}?</p><p class="epm-dica">${itens.map(i => escapar(i.name)).join(", ")}</p>`)) {
      await actor.deleteEmbeddedDocuments("Item", itens.map(i => i.id), { epmTrocaClasse: true });
    }
  }
}

/** Cria na ficha (sub-aba Arquétipo) as habilidades liberadas que ainda faltam. `ref` = "combatente:4" ou só o id do arquétipo (todas). */
export async function adicionarHabilidadesArquetipo(actor, ref) {
  const [arqId, nivelTxt] = String(ref).split(":");
  const a = ARQUETIPOS[arqId];
  if (!a) return;
  const nivel = nivelArquetipo(actor.flags?.[FLAG] ?? {}, arqId);
  const jaTem = new Set(actor.items.filter(i => i.flags?.[FLAG]?.arquetipoRef).map(i => i.flags[FLAG].arquetipoRef));
  const alvo = nivelTxt ? a.habilidades.filter(h => h.ref === ref) : a.habilidades;
  const novas = alvo.filter(h => h.nivel <= nivel && !jaTem.has(h.ref)).map(h => dadosHabilidadeArquetipo(arqId, h));
  if (!novas.length) return ui.notifications.info("Nada novo para adicionar.");
  await actor.createEmbeddedDocuments("Item", novas);
  ui.notifications.info(`${novas.length} habilidade(s) de ${a.nome} adicionada(s) na sub-aba Arquétipo.`);
}

export async function recuperarMana(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const nivel = nivelArquetipo(dados, "conjurador");
  const rec = recuperarManaDe(nivel, dados);
  if (!rec) return ui.notifications.warn("Recuperar Mana libera no nível 11 de Conjurador.");
  if (dados.usos?.recuperarMana) return ui.notifications.warn("Recuperar Mana já foi usado nesta cena.");
  const { ficha } = estadoAtor(actor);
  const c = custoRecurso(ficha, "pe", rec.pe);
  if (!c.ok) return ui.notifications.warn(`Recuperar Mana: faltam ${c.falta} PE.`);
  const qtd = rec.pm;
  const r = calcularRecuperacao(ficha, "pm", qtd, { fonte: "Recuperar Mana", trocaPm: false });
  await actor.update({ ...c.updates, ...r.updates, [`${P}.usos.recuperarMana`]: true });
  return nota(actor, `<p><strong>Recuperar Mana</strong>: −${rec.pe} PE. ${escapar(r.texto || `+${qtd} PM`)}</p><p class="epm-dica">Usa uma ação. Uma vez por cena.</p>`, "#8A7CE0");
}

/** Barreira Arcana (Conjurador 21): Reação, gasta PM para reduzir o dano em 2 por PM (máx. 2 × Núcleo PM). */
export async function barreiraArcana(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  if (nivelArquetipo(dados, "conjurador") < ARQUETIPOS.conjurador.barreira.nivel) return ui.notifications.warn("Barreira Arcana libera no nível 21 de Conjurador.");
  const { ficha } = estadoAtor(actor);
  const max = Math.max(0, 2 * Math.floor(Number(ficha.atributos?.nucleo?.total) || 0));
  if (!max) return ui.notifications.warn("Barreira Arcana: o máximo é 2 × Núcleo PM (Núcleo 0).");
  const r = await dialogo({
    titulo: "Barreira Arcana", ok: "Reduzir o dano", icone: "fa-solid fa-shield",
    content: `<p class="epm-dica">Reação, 1×/rodada, sem gastar ação do próximo turno. Cada PM reduz o dano em 2. Máximo ${max} PM (2 × Núcleo).</p>
      <label class="epm-campo"><span>PM</span><input type="number" name="pm" value="${Math.min(max, 5)}" min="1" max="${max}"></label>`,
    callback: f => ({ pm: Math.max(1, Math.min(max, int(f.pm?.value))) })
  });
  if (!r) return;
  if (!(await gastar(actor, "pm", r.pm, "Barreira Arcana"))) return;
  return nota(actor, `<p><strong>Barreira Arcana</strong> (Reação, −${r.pm} PM): reduz o dano deste ataque ou magia em <strong>${r.pm * ARQUETIPOS.conjurador.barreira.reducaoPorPm}</strong>.</p>`, "#8A7CE0");
}

/** Corpo de Mana (Conjurador 22; grátis e voo dobrado no 46): paga a rodada. */
export async function corpoDeMana(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const cm = corpoDeManaDe(nivelArquetipo(dados, "conjurador"));
  if (!cm) return ui.notifications.warn("Corpo de Mana libera no nível 22 de Conjurador.");
  if (cm.pm && !(await gastar(actor, "pm", cm.pm, "Corpo de Mana"))) return;
  return nota(actor, `<p><strong>Corpo de Mana</strong>${cm.pm ? ` (−${cm.pm} PM, esta rodada)` : ""}: flutua com voo ${cm.vooDobro ? "igual ao dobro do" : "igual ao"} deslocamento e anda por paredes e tetos.</p>`, "#8A7CE0");
}

/** Zona de Mana (Conjurador 41; 2.0 no 50): ativa (1×/cena) ou paga a manutenção do turno; encerra se não pagar. */
export async function zonaDeMana(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const zm = zonaDeManaDe(nivelArquetipo(dados, "conjurador"));
  if (!zm) return ui.notifications.warn("Zona de Mana libera no nível 41 de Conjurador.");
  const { ficha } = estadoAtor(actor);
  const ativa = !!dados.usos?.zonaDeMana;
  if (ativa) {
    const r = await fvtt.DialogV2.wait({ window: { title: "Zona de Mana" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
      content: `<p>Manter a zona neste turno custa <strong>${zm.manterPm} PM + ${zm.manterPe} PE</strong>. Sem pagar, ela termina.</p>`,
      buttons: [{ action: "manter", label: "Manter", icon: "fa-solid fa-rotate", default: true }, { action: "encerrar", label: "Encerrar", icon: "fa-solid fa-xmark" }] });
    if (r === "encerrar") { await actor.update({ [`${P}.usos.zonaDeMana`]: false }); return nota(actor, "<p><strong>Zona de Mana</strong> encerrada.</p>", "#8A7CE0"); }
    if (r !== "manter") return;
    const cpm = custoRecurso(ficha, "pm", zm.manterPm), cpe = custoRecurso(ficha, "pe", zm.manterPe);
    if (!cpm.ok || !cpe.ok) { await actor.update({ [`${P}.usos.zonaDeMana`]: false }); return nota(actor, "<p><strong>Zona de Mana</strong> termina: faltou recurso para manter.</p>", "#8A7CE0"); }
    await actor.update({ ...cpm.updates, ...cpe.updates });
    return nota(actor, `<p><strong>Zona de Mana</strong> mantida (−${zm.manterPm} PM, −${zm.manterPe} PE).${zm.modGratis ? " A primeira modificação paga com PE neste turno sai de graça." : ""}</p>`, "#8A7CE0");
  }
  if (dados.usosFormas?.["arq-zona-de-mana"]) return ui.notifications.warn("Zona de Mana: 1× por cena.");
  const cpm = custoRecurso(ficha, "pm", zm.pm), cpe = custoRecurso(ficha, "pe", zm.pe);
  if (!cpm.ok || !cpe.ok) return ui.notifications.warn(`Zona de Mana: precisa de ${zm.pm} PM e ${zm.pe} PE.`);
  await actor.update({ ...cpm.updates, ...cpe.updates, [`${P}.usos.zonaDeMana`]: true, [`${P}.usosFormas.arq-zona-de-mana`]: "cena" });
  return nota(actor, `<p><strong>Zona de Mana</strong> ativada (−${zm.pm} PM, −${zm.pe} PE). Move-se no ar, paredes, teto ou chão; magias podem surgir de qualquer ponto da zona; percebe manifestações de mana. Manter custa ${zm.manterPm} PM + ${zm.manterPe} PE por turno.${zm.modGratis ? " A primeira modificação paga com PE em cada turno sai de graça." : ""}</p>`, "#8A7CE0");
}

/** Fôlego de Combate (Combatente 10/22/35): Ação Bônus, recupera PV; 1× por cena (2× no 35). */
export async function folegoCombate(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const nivel = nivelArquetipo(dados, "combatente");
  const fol = folegoDe(nivel, dados);
  if (!fol) return ui.notifications.warn("Fôlego de Combate libera no nível 10 de Combatente.");
  const usados = usosFolego(dados);
  if (usados >= fol.usos) return ui.notifications.warn(`Fôlego de Combate já usado ${fol.usos}× nesta cena.`);
  const { estadoAtor } = await import("./mecanicas.mjs");
  const { ficha } = estadoAtor(actor);
  const roll = await new Roll(String(fol.dado)).evaluate();
  // Reformulado: recupera PV (antes era PE)
  const hp = actor.system?.attributes?.hp ?? {};
  const atual = int(hp.value), max = int(hp.max) || int(ficha.recursos?.pv?.max);
  const novo = Math.min(max, atual + roll.total);
  await actor.update({ "system.attributes.hp.value": novo, [`${P}.usosFormas.arq-folego-${usados + 1}`]: "cena", ...(game.combat?.started ? { [`${P}.acoes.bonus`]: true } : {}) });
  await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>Fôlego de Combate</strong> (Ação Bônus): +${novo - atual} PV${fol.usos > 1 ? ` · ${usados + 1}/${fol.usos} nesta cena` : ""}` });
}

/** Caçador Natural (Combatente 19/29/47): marca a Presa até o fim do combate; transferir custa (ou é grátis do 29 em diante). */
export async function cacadorNatural(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const cfg = cacadorDe(nivelArquetipo(dados, "combatente"), dados);
  if (!cfg) return ui.notifications.warn(`Caçador Natural libera no nível ${ARQUETIPOS.combatente.cacador.nivel} de Combatente.`);
  const atual = dados.usos?.presa ?? "";
  const alvoMarcado = [...(game.user?.targets ?? [])][0];
  const sugestao = alvoMarcado?.name ?? "";
  const r = await dialogo({
    titulo: "Caçador Natural", ok: atual ? "Trocar a Presa" : "Marcar a Presa", icone: "fa-solid fa-crosshairs",
    content: `<p class="epm-dica">${atual ? `Presa atual: <strong>${escapar(atual)}</strong>. Trocar ${cfg.transferir ? `custa ${cfg.transferir} PE` : "é grátis"} (quando ela chega a 0 PV).` : `Custa ${cfg.custo} PE. Contra a Presa: +${cfg.acerto} Acerto, +${cfg.ca} CA${cfg.esquiva ? `, +${cfg.esquiva} em Bloqueio, Contra-ataque e Esquiva` : ""}, ignora a Resistência dela${cfg.imunidadeVira ? " (a Imunidade vira Resistência)" : ""} e ${cfg.todoAcerto ? "todo acerto" : "1 acerto por turno"} causa +1 dado de dano, até o fim do combate.`}</p>
      <label class="epm-campo"><span>Presa</span><input type="text" name="presa" value="${escapar(sugestao)}" placeholder="nome da criatura (o alvo marcado vem sozinho)"></label>
      ${atual ? `<label class="epm-check"><input type="checkbox" name="encerrar"> Encerrar (sem custo)</label>` : ""}`,
    callback: f => ({ presa: String(f.presa?.value ?? "").trim(), encerrar: !!f.encerrar?.checked })
  });
  if (!r) return;
  if (r.encerrar) return actor.update({ [`${P}.usos.presa`]: "" });
  if (!r.presa) return ui.notifications.warn("Escreva o nome da Presa (ou marque um alvo antes).");
  const custo = atual ? cfg.transferir : cfg.custo;
  if (!(await gastar(actor, "pe", custo, "Caçador Natural"))) return;
  await actor.update({ [`${P}.usos.presa`]: r.presa });
  return nota(actor, `<p><strong>Caçador Natural</strong>: ${escapar(actor.name)} marca <strong>${escapar(r.presa)}</strong> como Presa (−${custo} PE).</p>`, ARQUETIPOS.combatente.cor);
}

/* -------------------------------------------- */
/*  Companheiros e bestiário                    */
/* -------------------------------------------- */

export function novoCompanheiro(dadosExtra = {}) {
  return {
    nome: "", tipo: "pet", img: "", uuid: "", pv: { value: 10, max: 10 }, pm: { value: 0, max: 0 }, pe: { value: 0, max: 0 },
    ca: 10, deslocamento: 9, atributos: {}, ataques: {}, habilidades: "", notas: "", automato: false, criado: Date.now(), ...dadosExtra
  };
}

export async function criarAutomato(actor) {
  const dados = actor.flags?.[FLAG] ?? {};
  const cfg = ARQUETIPOS.artifice.automato;
  const nivel = nivelArquetipo(dados, "artifice");
  if (nivel < cfg.nivel) return ui.notifications.warn(`Pequeno Autômato libera no nível ${cfg.nivel} de Artífice.`);
  const { ficha } = estadoAtor(actor);
  const atributos = { ...cfg.atributos, inteligencia: ficha.atributos?.inteligencia?.total ?? 0, carisma: ficha.atributos?.carisma?.total ?? 0 };
  const id = novoId();
  await actor.update({ [`${P}.companheiros.${id}`]: novoCompanheiro({
    nome: "Pequeno Autômato", tipo: "automato", automato: true, img: "icons/svg/cog.svg", atributos,
    pv: { value: 20, max: 20 }, pm: { value: 0, max: 0 }, pe: { value: 10, max: 10 },
    habilidades: "Usa a Inteligência e o Carisma do Artífice (copiados na criação). Recursos de um autômato básico: ajuste PV, PM e PE com o Mestre.",
    notas: ""
  }) });
  const b = bonusAutomato(nivel);
  ui.notifications.info(`Pequeno Autômato criado na aba Companheiros${b.atributos ? ` (com o bônus +${b.atributos}/+${b.recursos})` : ""}.`);
}

/** Ataque de um companheiro: 1d20 + acerto e o dano, no cartão de ataque (com o botão Aplicar dano). */
export async function rolarAtaqueCompanheiro(actor, cid, aid) {
  const c = actor.flags?.[FLAG]?.companheiros?.[cid];
  const at = c?.ataques?.[aid];
  if (!at) return;
  let atk;
  let dmg = null;
  try {
    atk = new Roll(`1d20 + ${int(at.acerto)}`.replace("+ -", "- "));
    await atk.evaluate();
    if (at.dano) {
      dmg = new Roll(String(at.dano));
      await dmg.evaluate();
    }
  } catch (err) {
    console.warn("EPM |", err);
    return ui.notifications.error("Não consegui rolar o ataque do companheiro. Confira o dano.");
  }
  const alvos = [...(game.user?.targets ?? [])].map(t => t.actor).filter(a => a && a.uuid !== actor.uuid);
  const botoes = dmg ? [{
    acao: "dano", valor: Math.max(0, Math.round(dmg.total)), alvos: alvos.map(a => a.uuid).join(","), tipoDano: at.tipoDano ?? "",
    rotulo: `${at.nome}: dano`, icone: "fa-solid fa-burst",
    label: alvos.length ? `Aplicar ${Math.max(0, Math.round(dmg.total))} de dano em ${alvos.map(a => a.name).join(", ")}` : `Aplicar ${Math.max(0, Math.round(dmg.total))} de dano no alvo`
  }] : [];
  const critico = (atk.dice[0]?.total ?? 0) >= 20;
  const content = await fvtt.renderTemplate(`${CAMINHO}/chat/ataque.hbs`, {
    actorUuid: actor.uuid, img: c.img || "icons/svg/mystery-man.svg", nome: `${c.nome || "Companheiro"}: ${at.nome || "Ataque"}`,
    periciaNome: `companheiro de ${actor.name}`, modo: "", htmlAtaque: await atk.render(), htmlDano: dmg ? await dmg.render() : "",
    critico, mult: 2, tipoDano: at.tipoDano ?? "", notas: [], botoes, cor: critico ? "#E8C547" : "#9BC48A"
  });
  const msg = { speaker: falar(actor), content, rolls: [atk, dmg].filter(Boolean), sound: CONFIG.sounds?.dice, flags: { [FLAG]: { tipo: "ataque" } } };
  try { ChatMessage.applyRollMode(msg, game.settings.get("core", "rollMode")); } catch { /* padrão */ }
  return ChatMessage.create(msg);
}

/** Máximo de PV/PM/PE de um companheiro com o bônus do autômato. */
export function maxCompanheiro(dados, c, recurso) {
  const base = int(c?.[recurso]?.max);
  if (!c?.automato) return base;
  const b = bonusAutomato(nivelArquetipo(dados, "artifice"));
  return base + (base > 0 || recurso === "pv" ? b.recursos : 0);
}

/**
 * Fim do combate: cada personagem EPM registra no bestiário as criaturas (não jogadoras) que enfrentou.
 * Usa o nome do token (o Mestre pode deixar "???"); soma um encontro e, se a criatura caiu, uma derrota.
 */
export async function registrarBestiario(combate) {
  const combatentes = [...(combate?.combatants ?? [])];
  const herois = combatentes.filter(c => c.actor?.flags?.[FLAG] && c.actor.hasPlayerOwner);
  const criaturas = combatentes.filter(c => c.actor && !c.actor.hasPlayerOwner);
  if (!herois.length || !criaturas.length) return;
  const norm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  for (const h of herois) {
    const actor = h.actor;
    const best = actor.flags?.[FLAG]?.bestiario ?? {};
    const updates = {};
    const vistos = new Set();
    for (const c of criaturas) {
      const nome = c.name || c.actor.name;
      const chave = norm(nome);
      if (!chave || vistos.has(chave)) continue;
      vistos.add(chave);
      const caiu = int(c.actor.system?.attributes?.hp?.value) <= 0 || c.defeated;
      const existente = Object.entries(best).find(([, b]) => b && (norm(b.nome) === chave || (b.uuid && b.uuid === c.actor.uuid)));
      if (existente) {
        const [bid, b] = existente;
        updates[`${P}.bestiario.${bid}.encontros`] = int(b.encontros) + 1;
        if (caiu) updates[`${P}.bestiario.${bid}.derrotados`] = int(b.derrotados) + 1;
      } else {
        updates[`${P}.bestiario.${novoId()}`] = {
          nome, img: c.token?.texture?.src || c.img || c.actor.img || "", uuid: c.actor.uuid, tipo: "", local: canvas?.scene?.name ?? "",
          fraquezas: [], resistencias: [], imunidades: [], notas: "", encontros: 1, derrotados: caiu ? 1 : 0, criado: Date.now()
        };
      }
    }
    if (Object.keys(updates).length) await actor.update(updates);
  }
}

/* -------------------------------------------- */
/*  Combate: atrasar turno, oportunidade        */
/* -------------------------------------------- */

function meuCombatente(actor, combate = game.combat) {
  return combate?.combatants?.find(c => c.actor?.uuid === actor.uuid) ?? combate?.combatants?.find(c => c.actorId === actor.id) ?? null;
}

/** Atrasar Turno: 1 vez por combate; escolhe depois de quem agir e a nova posição fica pelo resto do combate. */
export async function atrasarTurno(actor) {
  const combate = game.combat;
  if (!combate?.started) return ui.notifications.warn("Não há combate em andamento.");
  const meu = meuCombatente(actor, combate);
  if (!meu) return ui.notifications.warn(`${actor.name} não está no combate.`);
  if (actor.flags?.[FLAG]?.combate?.atrasou === combate.id) return ui.notifications.warn("Você já atrasou o turno neste combate (limite: 1 vez por combate).");
  const turnos = combate.turns ?? [];
  const i = turnos.findIndex(t => t.id === meu.id);
  const depois = turnos.slice(i + 1).filter(t => !t.defeated);
  if (!depois.length) return ui.notifications.warn("Você já é o último na iniciativa.");
  const r = await dialogo({
    titulo: "Atrasar turno", ok: "Atrasar", icone: "fa-solid fa-hourglass-half",
    content: `<p class="epm-dica">Escolha depois de quem você vai agir. A nova posição fica até o fim do combate. Limite: 1 vez por combate.</p>
      <label class="epm-campo"><span>Agir depois de</span><select name="alvo">${depois.map(t => `<option value="${t.id}">${escapar(t.name)} (${t.initiative ?? "—"})</option>`).join("")}</select></label>`,
    callback: f => ({ alvo: f.alvo?.value })
  });
  if (!r?.alvo) return;
  const alvo = turnos.find(t => t.id === r.alvo);
  const seguinte = turnos[turnos.indexOf(alvo) + 1];
  const iniAlvo = num(alvo?.initiative);
  let nova = seguinte && seguinte.id !== meu.id && seguinte.initiative !== null ? (iniAlvo + num(seguinte.initiative)) / 2 : iniAlvo - 1;
  if (seguinte && num(seguinte.initiative) === iniAlvo) nova = iniAlvo - 0.01;
  try {
    await meu.update({ initiative: Math.round(nova * 100) / 100 });
  } catch (err) {
    console.warn("EPM |", err);
    return ui.notifications.warn("Não consegui mudar a iniciativa. Peça ao Mestre.");
  }
  await actor.update({ [`${P}.combate.atrasou`]: combate.id });
  if (combate.combatant?.id === meu.id) {
    try { await combate.nextTurn(); } catch { ui.notifications.info("Passe o turno no Combat Tracker."); }
  }
  return nota(actor, `<p><strong>${escapar(actor.name)}</strong> atrasa o turno e vai agir depois de <strong>${escapar(alvo?.name ?? "")}</strong>.</p>`);
}

/** Ataque de oportunidade: gasta a Reação e faz 1 ataque simples (sem ataque extra nem ação bônus). */
export async function ataqueDeOportunidade(actor) {
  const { dados } = estadoAtor(actor);
  if (dados.acoes?.reacao) return ui.notifications.warn("A Reação já foi usada neste turno.");
  const escolha = await escolherAtaque(actor, "Ataque de oportunidade", "Um inimigo a até 1,5 m tentou sair do seu alcance. Gasta a Reação; 1 ataque simples, sem ataque extra.");
  if (!escolha) return null;
  return dialogoAtaque(actor, escolha.tipo, escolha.ref, { oportunidade: true });
}

/** Escolhe com qual arma (equipada, se houver) ou ataque personalizado atacar. */
export async function escolherAtaque(actor, titulo, dica) {
  const { dados } = estadoAtor(actor);
  const armas = actor.items.filter(i => i.type === "weapon");
  const equipadas = armas.filter(i => i.system?.equipped);
  const lista = equipadas.length ? equipadas : armas;
  const custom = Object.entries(dados.ataques ?? {}).filter(([, a]) => a);
  if (!lista.length && !custom.length) { ui.notifications.warn("Nenhuma arma ou ataque para usar."); return null; }
  // Cada modo da arma (ex.: lança perfurante / contundente) é uma opção
  const opcoesArma = lista.flatMap(i => ataquesDaArma(i).map(a => ({ ref: a.ref, nome: a.nome })));
  let tipo = "arma";
  let ref = opcoesArma[0]?.ref;
  if (opcoesArma.length + custom.length > 1) {
    const r = await dialogo({
      titulo, ok: "Escolher", icone: "fa-solid fa-hand-fist",
      content: `<p class="epm-dica">${escapar(dica)}</p>
        <label class="epm-campo"><span>Com</span><select name="ref">${opcoesArma.map(a => `<option value="arma|${a.ref}">${escapar(a.nome)}</option>`).join("")}${custom.map(([id, a]) => `<option value="custom|${id}">${escapar(a.nome || "Ataque")}</option>`).join("")}</select></label>`,
      callback: f => ({ ref: f.ref?.value })
    });
    if (!r?.ref) return null;
    [tipo, ref] = r.ref.split("|");
  } else if (!lista.length) {
    tipo = "custom";
    ref = custom[0][0];
  }
  return { tipo, ref };
}

/** Ressonância de Alma: chama outro personagem seu pela Marca (registra no chat e abre a ficha dele). */
export async function ressonanciaDeAlma(actor) {
  const donos = Object.entries(actor.ownership ?? {}).filter(([uid, nivel]) => uid !== "default" && nivel >= 3 && !game.users.get(uid)?.isGM).map(([uid]) => uid);
  const meus = game.actors.filter(a => a.id !== actor.id && a.type === "character" && (game.user.isGM
    ? (donos.length ? donos.some(uid => a.testUserPermission(game.users.get(uid), "OWNER")) : true)
    : a.isOwner));
  if (!meus.length) return ui.notifications.warn("Nenhum outro personagem seu para chamar pela Marca.");
  const r = await dialogo({
    titulo: "Ressonância de Alma", ok: "Chamar", icone: "fa-solid fa-link",
    content: `<p class="epm-dica">A Marca liga você aos seus outros personagens: escolha quem vem ajudar.</p>
      <label class="epm-campo"><span>Personagem</span><select name="quem">${meus.map(a => `<option value="${a.id}">${escapar(a.name)}</option>`).join("")}</select></label>
      <label class="epm-campo"><span>Como ajuda (opcional)</span><input type="text" name="como" placeholder="empresta força, conhecimento, uma habilidade…"></label>`,
    callback: f => ({ quem: f.quem?.value, como: String(f.como?.value ?? "").trim() })
  });
  if (!r?.quem) return;
  const outro = game.actors.get(r.quem);
  if (!outro) return;
  outro.sheet?.render(true);
  return ChatMessage.create({
    speaker: falar(actor),
    content: `<div class="epm-chat epm-chat-ressonancia">
      <header class="epm-chat-topo"><img src="${escapar(outro.img)}" alt=""><div class="epm-chat-titulos"><h3>Ressonância de Alma</h3>
      <span class="epm-chat-sub">${escapar(actor.name)} chama ${escapar(outro.name)} pela Marca</span></div></header>
      ${r.como ? `<p class="epm-chat-texto">${escapar(r.como)}</p>` : ""}
    </div>`
  });
}

/* -------------------------------------------- */
/*  Treino: pular tempo (timeskip)              */
/* -------------------------------------------- */

/** Pular tempo: o diálogo único (treinos, criações, projetos, produções, pacto, Ressonância, cena e usos por dia). */
export async function pularHoras(actor) {
  const { dialogoPularTempo } = await import("./pular-tempo.mjs");
  return dialogoPularTempo(actor, { unidade: "dias", qtd: 1 });
}

/* -------------------------------------------- */
/*  Diário de sessões                           */
/* -------------------------------------------- */

export async function novaSessao(actor) {
  const diario = actor.flags?.[FLAG]?.diario ?? {};
  const maior = Object.values(diario).reduce((m, e) => Math.max(m, int(e?.sessao)), 0);
  const hoje = new Date();
  const p = n => String(n).padStart(2, "0");
  await actor.update({ [`${P}.diario.${novoId()}`]: {
    data: `${hoje.getFullYear()}-${p(hoje.getMonth() + 1)}-${p(hoje.getDate())}`, sessao: maior + 1, titulo: "", resumo: "",
    pev: 0, pt: 0, ph: 0, itens: "", aplicado: false, criado: Date.now()
  } });
}

export async function somarSessao(actor, id) {
  const e = actor.flags?.[FLAG]?.diario?.[id];
  if (!e || e.aplicado) return;
  const { ficha } = estadoAtor(actor);
  const updates = { [`${P}.diario.${id}.aplicado`]: true };
  const partes = [];
  for (const k of ["pev", "pt", "ph"]) {
    const v = int(e[k]);
    if (!v) continue;
    updates[`${P}.pontos.${k}`] = Math.max(0, int(ficha.pontos[k]) + v);
    partes.push(`${v > 0 ? "+" : ""}${v} ${k === "pev" ? "PEv" : k.toUpperCase()}`);
  }
  if (!partes.length) return;
  await actor.update(updates);
  ui.notifications.info(`Sessão ${int(e.sessao) || ""}: ${partes.join(", ")} somados na ficha.`);
  import("./mundo.mjs").then(m => m.avisarDiscord("sessao", `📜 **${actor.name}** — Sessão ${int(e.sessao) || ""}${e.titulo ? ` (${e.titulo})` : ""}: ${partes.join(", ")}.${e.resumo ? `\n${String(e.resumo).slice(0, 1200)}` : ""}`)).catch(() => null);
}

/* -------------------------------------------- */
/*  Várias habilidades ou magias de uma vez     */
/* -------------------------------------------- */

export async function acaoEmMassa(actor, ids, op) {
  const itens = ids.map(id => actor.items.get(id)).filter(Boolean);
  if (!itens.length) return ui.notifications.info("Nada selecionado.");
  const nomes = itens.map(i => escapar(i.name)).join(", ");
  switch (op) {
    case "usar":
      for (const it of itens) await usarPoder(actor, it);
      return;
    case "chat":
      for (const it of itens) await cartaoItem(actor, it);
      return;
    case "favoritar": {
      const todos = itens.every(i => i.flags?.[FLAG]?.favorito);
      return actor.updateEmbeddedDocuments("Item", itens.map(i => ({ _id: i.id, [`flags.${FLAG}.favorito`]: !todos })));
    }
    case "duplicar": {
      const dados = itens.map(i => {
        const d = i.toObject();
        delete d._id;
        d.name = `${i.name} (variante)`;
        foundry.utils.setProperty(d, `flags.${FLAG}.favorito`, false);
        return d;
      });
      return actor.createEmbeddedDocuments("Item", dados);
    }
    case "apagar": {
      if (!(await confirmar("Excluir várias", `<p>Excluir <strong>${itens.length}</strong>: ${nomes}?</p>`))) return;
      return actor.deleteEmbeddedDocuments("Item", itens.map(i => i.id));
    }
    case "passiva": {
      const todas = itens.every(i => i.flags?.[FLAG]?.passiva);
      return actor.updateEmbeddedDocuments("Item", itens.filter(i => i.type === "feat").map(i => ({ _id: i.id, [`flags.${FLAG}.passiva`]: !todas })));
    }
    case "raridade": {
      const r = await dialogo({
        titulo: "Mudar raridade", ok: "Mudar",
        content: `<p class="epm-dica">${itens.length} selecionada(s).</p><label class="epm-campo"><span>Raridade</span><select name="raridade">${Object.entries(RARIDADES_PODER).map(([id, x]) => `<option value="${id}">${x.label}</option>`).join("")}</select></label>`,
        callback: f => ({ raridade: f.raridade?.value })
      });
      if (!r?.raridade) return;
      return actor.updateEmbeddedDocuments("Item", itens.map(i => ({ _id: i.id, [`flags.${FLAG}.raridade`]: r.raridade })));
    }
    case "mover": {
      const transf = Object.entries(actor.flags?.[FLAG]?.transformacoes ?? {}).filter(([, t]) => t);
      const opcoes = [["", "Geral"], ["arquetipo", "Arquétipo"], ["classe", "Classe"], ["raca", ORIGENS_HABILIDADE.raca], ["meme", "Meme"],
        ...transf.map(([id, t]) => [`transformacao:${id}`, `Transformação: ${t.nome || "sem nome"}`])];
      const r = await dialogo({
        titulo: "Mover habilidades", ok: "Mover",
        content: `<p class="epm-dica">${itens.length} selecionada(s).</p><label class="epm-campo"><span>Para</span><select name="destino">${opcoes.map(([id, l]) => `<option value="${id}">${escapar(l)}</option>`).join("")}</select></label>`,
        callback: f => ({ destino: f.destino?.value ?? "" })
      });
      if (!r) return;
      const [origem, transformacao = ""] = String(r.destino).split(":");
      return actor.updateEmbeddedDocuments("Item", itens.filter(i => i.type === "feat").map(i => ({
        _id: i.id, [`flags.${FLAG}.origem`]: origem, [`flags.${FLAG}.transformacao`]: transformacao
      })));
    }
    case "circulo": {
      const r = await dialogo({
        titulo: "Mudar círculo", ok: "Mudar",
        content: `<p class="epm-dica">${itens.length} selecionada(s).</p><label class="epm-campo"><span>Círculo</span><select name="circulo">${CIRCULOS.map(c => `<option value="${c.nivel}">${c.label}</option>`).join("")}</select></label>`,
        callback: f => ({ circulo: int(f.circulo?.value) })
      });
      if (!r) return;
      return actor.updateEmbeddedDocuments("Item", itens.filter(i => i.type === "spell").map(i => ({ _id: i.id, "system.level": r.circulo })));
    }
    default: return null;
  }
}

/* -------------------------------------------- */
/*  Botões novos do chat                        */
/* -------------------------------------------- */

/** Rola dano extra e posta um cartão pequeno com o botão Aplicar dano (alvos do cartão original). */
async function cartaoDanoExtra(actor, { titulo, valor, alvos = "", tipoDano = "", texto = "" }) {
  const content = `<div class="epm-chat epm-chat-nota" data-actor-uuid="${actor.uuid}">
    <p><strong>${escapar(titulo)}</strong>${texto ? `: ${escapar(texto)}` : ""}</p>
    <div class="epm-chat-botoes"><button type="button" data-epm-action="dano" data-valor="${valor}"${alvos ? ` data-alvos="${escapar(alvos)}"` : ""}${tipoDano ? ` data-tipo-dano="${escapar(tipoDano)}"` : ""} data-rotulo="${escapar(titulo)}"><i class="fa-solid fa-burst" aria-hidden="true"></i> Aplicar ${valor} de dano</button></div>
  </div>`;
  return ChatMessage.create({ speaker: falar(actor), content, flags: { [FLAG]: { tipo: "ataque" } } });
}

/**
 * Defesa escolhida pelo alvo no cartão de ataque (regras de sempre): compara a defesa (CA + perícia)
 * com o acerto, calcula quanto do dano o alvo recebe e gasta 1 ação do próximo turno.
 */
export async function defenderDoCartao(defensor, defesaId, { acerto, dano = 0, tipoDano = "", atacanteUuid = "", critico = false, tipoArma = "" }) {
  const { ficha } = estadoAtor(defensor);
  const def0 = ficha.defesas.find(d => d.id === defesaId);
  if (!def0) return null;
  // Caçador Natural: contra a Presa, +1 CA e +2 em Bloqueio, Contra-ataque e Esquiva
  let def = def0;
  const dDef = defensor.flags?.[FLAG] ?? {};
  const cacDef = dDef.usos?.presa ? cacadorDe(nivelArquetipo(dDef, "combatente"), dDef) : null;
  if (cacDef && atacanteUuid) {
    const atacante = await fromUuid(atacanteUuid).catch(() => null);
    const nomeA = String(atacante?.name ?? "").trim().toLowerCase();
    if (nomeA && nomeA === String(dDef.usos.presa).trim().toLowerCase()) {
      const extra = int(cacDef.ca) + int(cacDef.esquiva);
      def = { ...def0, valor: def0.valor + extra, periciaBonus: def0.periciaBonus + extra, periciaNome: `${def0.periciaNome} + Presa` };
    }
  }
  if (ficha.acoes.defesas >= REGRAS.maxDefesasPorRodada) return ui.notifications.warn(`${defensor.name}: as 3 ações do próximo turno já foram gastas em defesas.`);
  const passou = acerto >= def.valor;
  const falhaPor = def.valor - acerto;
  let fracao = 1;
  let texto;
  if (defesaId === "esquiva") {
    fracao = passou ? 1 : 0;
    texto = passou ? "O ataque passou: recebe o dano." : "Esquivou: não recebe dano.";
  } else if (defesaId === "bloqueio") {
    if (passou) { fracao = 1; texto = "O ataque passou o bloqueio: recebe o dano todo."; }
    else if (falhaPor <= 2) { fracao = 2 / 3; texto = `Bloqueou (atacante falhou por ${falhaPor}): recebe 2/3 do dano.`; }
    else if (falhaPor <= 4) { fracao = 1 / 2; texto = `Bloqueou (atacante falhou por ${falhaPor}): recebe metade do dano.`; }
    else { fracao = 0; texto = `Bloqueou (atacante falhou por ${falhaPor}): não recebe dano.`; }
  } else {
    fracao = passou ? 1 : 0;
    texto = passou ? "O contra-ataque não deu certo: recebe o dano." : "O atacante errou: não recebe dano e pode contra-atacar.";
  }
  const recebe = Math.floor(int(dano) * fracao);
  const usadas = ficha.acoes.defesas + 1;
  await defensor.update({ [`${P}.acoes.defesas`]: usadas });
  const botoes = [];
  if (dano > 0 && recebe > 0) botoes.push(`<button type="button" data-epm-action="dano" data-valor="${recebe}" data-alvos="${escapar(defensor.uuid)}"${tipoDano ? ` data-tipo-dano="${escapar(tipoDano)}"` : ""}${critico ? " data-critico=\"1\"" : ""}${tipoArma ? ` data-tipo-arma="${escapar(tipoArma)}"` : ""} data-rotulo="Dano após ${escapar(def.label)}"><i class="fa-solid fa-burst" aria-hidden="true"></i> Aplicar ${recebe} de dano em ${escapar(defensor.name)}</button>`);
  if (dano > 0 && recebe > 0 && temDobroPasso(defensor)) botoes.push(botaoDobroPasso(defensor, recebe, { tipoDano, critico, tipoArma }));
  if (defesaId === "contra" && !passou) botoes.push(`<button type="button" data-epm-action="contraatacar" data-defensor="${escapar(defensor.uuid)}" data-rotulo="Contra-ataque"><i class="fa-solid fa-hand-fist" aria-hidden="true"></i> ${escapar(defensor.name)} contra-ataca</button>`);
  const fracTexto = fracao === 1 ? "todo o dano" : fracao === 0 ? "nenhum dano" : fracao > 0.6 ? "2/3 do dano" : "metade do dano";
  return ChatMessage.create({
    speaker: falar(defensor),
    content: `<div class="epm-chat epm-chat-defesa" data-actor-uuid="${escapar(atacanteUuid)}">
      <header class="epm-chat-topo"><i class="${def.icone}" aria-hidden="true"></i><div class="epm-chat-titulos"><h3>${escapar(defensor.name)}: ${escapar(def.label)} ${def.valor}</h3>
      <span class="epm-chat-sub">contra acerto ${acerto} · CA ${ficha.ca.total} + ${escapar(def.periciaNome)} ${def.periciaBonus}</span></div></header>
      <p class="epm-chat-texto">${escapar(texto)}${dano > 0 ? ` Recebe ${recebe} de ${dano}.` : ` Recebe ${fracTexto}.`}</p>
      ${dano > 0 && recebe > 0 ? `<p class="epm-chat-requisitos">Use este botão no lugar do "Aplicar dano" do ataque.</p>` : ""}
      <p class="epm-chat-aviso">Gasta 1 ação do próximo turno (${usadas} de 3).${usadas >= 3 ? " Começará o próximo turno sem ações." : ""}</p>
      ${botoes.length ? `<div class="epm-chat-botoes">${botoes.join("")}</div>` : ""}
    </div>`,
    flags: { [FLAG]: { tipo: "defesa" } }
  });
}

/** Teste de resistência contra uma habilidade ou magia com DT: rola a perícia pedida e gasta a Reação. */
export async function resistirDoCartao(defensor, { pericia, dt, rotulo = "" }) {
  const { ficha, dados } = estadoAtor(defensor);
  const per = ficha.periciaPorId[pericia];
  if (dados.acoes?.reacao && !(await confirmar("Sem Reação", `<p>${escapar(defensor.name)} já usou a Reação neste turno (o teste de resistência gasta a Reação).</p><p>Resistir mesmo assim?</p>`))) return null;
  const roll = await rolarTeste(defensor, {
    rotulo: `${rotulo || "Resistência"}: ${per?.nome ?? pericia} contra DT ${dt}`, bonus: per?.testeTotal ?? 0,
    desvantagens: [...ficha.desvantagens.testes, ...ficha.desvantagens.resistencias, ...(per?.desvantagem ?? [])],
    vantagens: [...ficha.vantagens.testes, ...(per?.vantagem ?? [])], penalidades: per?.testeFontes ?? []
  });
  if (!roll) return null;
  await defensor.update({ [`${P}.acoes.reacao`]: true });
  const passou = roll.total >= dt;
  return nota(defensor, `<p><strong>${escapar(defensor.name)}</strong> ${passou ? "resistiu" : "não resistiu"}: ${roll.total} contra DT ${dt} (${escapar(per?.nome ?? pericia)}). Gastou a Reação.</p>`, passou ? "#6FAE8C" : "#D2544A");
}

/* ---------------- Dobro e Passo (habilidade pronta) ---------------- */

/** A ficha tem a habilidade pronta "Dobro e Passo"? */
export function temDobroPasso(actor) {
  return (actor?.items?.contents ?? [...(actor?.items ?? [])]).some(i => i.flags?.[FLAG]?.pronta === "dobro-e-passo" || i.name === "Dobro e Passo");
}

function botaoDobroPasso(defensor, valor, { tipoDano = "", critico = false, tipoArma = "" } = {}) {
  return `<button type="button" data-epm-action="dobroPasso" data-defensor="${escapar(defensor.uuid)}" data-valor="${int(valor)}"${tipoDano ? ` data-tipo-dano="${escapar(tipoDano)}"` : ""}${critico ? " data-critico=\"1\"" : ""}${tipoArma ? ` data-tipo-arma="${escapar(tipoArma)}"` : ""} data-rotulo="Dobro e Passo" title="Ação livre: passa este dano para um aliado na cena; quem receber ganha +5 no teste ou no dano do próximo ataque"><i class="fa-solid fa-people-arrows" aria-hidden="true"></i> Dobro e Passo: passar para um aliado</button>`;
}

/** Cartão com só o botão do Dobro e Passo (quem não reagiu e foi acertado). */
export async function cartaoDobroPasso(defensor, valor, extra = {}) {
  if (!temDobroPasso(defensor) || int(valor) <= 0) return null;
  return ChatMessage.create({
    speaker: falar(defensor),
    content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#7FB0C9"><p><strong>${escapar(defensor.name)}</strong> foi acertado (${int(valor)} de dano) e tem <strong>Dobro e Passo</strong>.</p><div class="epm-chat-botoes">${botaoDobroPasso(defensor, valor, extra)}</div></div>`,
    flags: { [FLAG]: { tipo: "defesa" } }
  });
}

/** Aliados na cena: fichas com token na cena atual, do mesmo lado (disposição) do defensor. */
export function aliadosNaCena(defensor) {
  const tokens = [...(globalThis.canvas?.scene?.tokens ?? [])];
  const meu = tokens.find(t => t.actor?.id === defensor.id || t.actorId === defensor.id);
  const lado = meu?.disposition ?? 1;
  const ids = new Set(tokens.filter(t => (t.disposition ?? 1) === lado && t.actorId && t.actorId !== defensor.id).map(t => t.actorId));
  return ids;
}

/** Usa o Dobro e Passo: escolhe o aliado, gasta a Reação, manda o dano para ele e dá +5 no próximo ataque. */
export async function usarDobroPasso(defensor, { valor = 0, tipoDano = "", critico = false, tipoArma = "" } = {}) {
  const { escolherAtores } = await import("./escolher-ator.mjs");
  const naCena = aliadosNaCena(defensor);
  const r = await escolherAtores({
    titulo: `Dobro e Passo: ${defensor.name}`, excluir: [defensor.uuid], filtro: a => !naCena.size || naCena.has(a.id),
    dica: `Passa ${int(valor)} de dano para um aliado${naCena.size ? " na cena" : ""}. Quem receber ganha +5 no próximo ataque.`,
    extra: `<label class="epm-campo"><span>Bônus de quem recebe</span><select name="bonus"><option value="acerto">+5 no teste de ataque do próximo ataque</option><option value="dano">+5 no dano do próximo ataque</option></select></label>`,
    ok: "Passar o dano"
  });
  if (!r?.uuids?.length) return null;
  const aliado = await fromUuid(r.uuids[0]);
  if (!aliado) return null;
  // Ação livre: pode ser usada quando quiser, sem gastar Reação nem ações
  const bonus = { nome: `Dobro e Passo (de ${defensor.name})`, ativo: true, acerto: r.bonus === "dano" ? 0 : 5, dano: r.bonus === "dano" ? "5" : "", umaVez: true, soAtaque: true, cena: true, criado: Date.now() };
  const { pedirAoMestre } = await import("./mundo.mjs");
  if (aliado.isOwner) await aliado.update({ [`${P}.bonusCena.${foundry.utils.randomID()}`]: bonus });
  else await pedirAoMestre("bonusCenaAtor", { uuid: aliado.uuid, bonus });
  return ChatMessage.create({
    speaker: falar(defensor),
    content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#7FB0C9"><p><i class="fa-solid fa-people-arrows" aria-hidden="true"></i> <strong>${escapar(defensor.name)}</strong> usou <strong>Dobro e Passo</strong>: o dano vai para <strong>${escapar(aliado.name)}</strong>, que ganha +5 ${r.bonus === "dano" ? "no dano" : "no teste de ataque"} do próximo ataque.</p>
      <p class="epm-chat-requisitos">Use este botão no lugar do "Aplicar dano" do ataque e da defesa.</p>
      <div class="epm-chat-botoes"><button type="button" data-epm-action="dano" data-valor="${int(valor)}" data-alvos="${escapar(aliado.uuid)}"${tipoDano ? ` data-tipo-dano="${escapar(tipoDano)}"` : ""}${critico ? " data-critico=\"1\"" : ""}${tipoArma ? ` data-tipo-arma="${escapar(tipoArma)}"` : ""} data-rotulo="Dobro e Passo"><i class="fa-solid fa-burst" aria-hidden="true"></i> Aplicar ${int(valor)} de dano em ${escapar(aliado.name)}</button></div></div>`,
    flags: { [FLAG]: { tipo: "defesa" } }
  });
}

/** Trata os botões novos do chat. Devolve true se tratou. */
export async function cliqueChatExtra(acao, actor, botao) {
  const { cliqueChatNovas } = await import("./novas.mjs");
  if (await cliqueChatNovas(acao, actor, botao)) return true;
  if (String(acao).startsWith("alma")) {
    const { cliqueChatAlma } = await import("./ressonancia.mjs");
    if (await cliqueChatAlma(acao, actor, botao)) return true;
  }
  if (String(acao).startsWith("npc")) {
    const { cliqueChatNpc } = await import("./tipos-npc.mjs");
    if (await cliqueChatNpc(acao, botao)) return true;
  }
  if (["votar", "encerrarEnquete", "sanidadeCartao", "condicaoAlvo"].includes(acao)) {
    const { cliqueChat060 } = await import("./mundo.mjs");
    if (await cliqueChat060(acao, actor, botao)) return true;
  }
  const msgIdDef = botao.closest("[data-message-id]")?.dataset.messageId;
  // Ataque escondido: o Mestre ou quem atacou revela sem esperar a reação
  if (acao === "revelarAtaque") {
    const msg = game.messages?.get(msgIdDef);
    const atacante = msg?.flags?.[FLAG]?.atacante ? await fromUuid(msg.flags[FLAG].atacante) : null;
    if (!game.user?.isGM && !atacante?.isOwner) { ui.notifications.warn("Só o Mestre ou quem atacou revela o ataque."); return true; }
    await revelarAtaque(msgIdDef, "", { forcar: true });
    return true;
  }
  if (acao === "semReacao") {
    const defensor = botao.dataset.defensor ? await fromUuid(botao.dataset.defensor) : null;
    if (!defensor) return true;
    if (!defensor.isOwner) { ui.notifications.warn(`Só quem controla ${defensor.name} escolhe a reação.`); return true; }
    const chaveDef = `${msgIdDef}:def:${defensor.uuid}`;
    cliqueChatExtra.usados ??= new Set();
    if (cliqueChatExtra.usados.has(chaveDef)) { ui.notifications.info(`${defensor.name} já respondeu a este cartão.`); return true; }
    cliqueChatExtra.usados.add(chaveDef);
    await revelarAtaque(msgIdDef, defensor.uuid, { reacao: "Nenhuma" });
    const oc = game.messages?.get(msgIdDef)?.flags?.[FLAG]?.oculto;
    if (oc && int(oc.dano) > 0) await cartaoDobroPasso(defensor, int(oc.dano), { tipoDano: oc.tipoDano ?? "", critico: !!oc.critico, tipoArma: oc.tipoArma ?? "" });
    return true;
  }
  if (acao === "dobroPasso") {
    const defensor = botao.dataset.defensor ? await fromUuid(botao.dataset.defensor) : null;
    if (!defensor) return true;
    if (!defensor.isOwner) { ui.notifications.warn(`Só quem controla ${defensor.name} usa o Dobro e Passo.`); return true; }
    const chave = `${msgIdDef}:dobroPasso:${defensor.uuid}`;
    cliqueChatExtra.usados ??= new Set();
    if (cliqueChatExtra.usados.has(chave)) { ui.notifications.info("Dobro e Passo já usado neste cartão."); return true; }
    const r = await usarDobroPasso(defensor, { valor: int(botao.dataset.valor), tipoDano: botao.dataset.tipoDano ?? "", critico: !!botao.dataset.critico, tipoArma: botao.dataset.tipoArma ?? "" });
    if (r) cliqueChatExtra.usados.add(chave);
    return true;
  }
  if (acao === "defender" || acao === "resistir" || acao === "contraatacar") {
    let defensor = botao.dataset.defensor ? await fromUuid(botao.dataset.defensor) : null;
    if (!defensor && acao === "resistir") defensor = canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
    if (!defensor) { ui.notifications.warn("Selecione o seu token (ou tenha um personagem atribuído) e clique de novo."); return true; }
    if (!defensor.isOwner) { ui.notifications.warn(`Só quem controla ${defensor.name} escolhe a defesa ou a resistência.`); return true; }
    const chaveDef = `${msgIdDef}:${acao === "contraatacar" ? "contra" : "def"}:${defensor.uuid}`;
    cliqueChatExtra.usados ??= new Set();
    if (cliqueChatExtra.usados.has(chaveDef)) { ui.notifications.info(`${defensor.name} já respondeu a este cartão.`); return true; }
    if (acao === "defender") {
      // Cartão escondido: os números vêm da mensagem (não ficam no botão)
      const oculto = game.messages?.get(msgIdDef)?.flags?.[FLAG]?.oculto ?? null;
      const r = await defenderDoCartao(defensor, botao.dataset.defesa, {
        acerto: oculto ? int(oculto.acerto) : int(botao.dataset.acerto), dano: oculto ? int(oculto.dano) : int(botao.dataset.valor),
        tipoDano: oculto ? (oculto.tipoDano ?? "") : (botao.dataset.tipoDano ?? ""),
        atacanteUuid: botao.closest(".epm-chat")?.dataset.actorUuid ?? "", critico: oculto ? !!oculto.critico : !!botao.dataset.critico,
        tipoArma: oculto ? (oculto.tipoArma ?? "") : (botao.dataset.tipoArma ?? "")
      });
      if (r) {
        cliqueChatExtra.usados.add(chaveDef);
        if (oculto) await revelarAtaque(msgIdDef, defensor.uuid, { reacao: botao.dataset.rotulo || botao.dataset.defesa });
      }
      return true;
    }
    if (acao === "resistir") {
      const r = await resistirDoCartao(defensor, { pericia: botao.dataset.pericia, dt: int(botao.dataset.dt), rotulo: botao.dataset.rotulo });
      if (r) cliqueChatExtra.usados.add(chaveDef);
      return true;
    }
    const escolha = await escolherAtaque(defensor, "Contra-ataque", "O atacante errou: escolha com o que contra-atacar (a ação já foi paga pela defesa).");
    if (!escolha) return true;
    cliqueChatExtra.usados.add(chaveDef);
    await dialogoAtaque(defensor, escolha.tipo, escolha.ref, { contra: true });
    return true;
  }
  if (acao === "curaProjeto") { await curaDoCartao(actor, botao); return true; }
  const novos = ["destrutivo", "alongado", "esmagador", "sangrenta", "manipulacao", "sobrecarga"];
  if (!novos.includes(acao)) return false;
  if (!actor) { ui.notifications.warn("Não encontrei o personagem deste cartão."); return true; }
  if (!actor.isOwner) { ui.notifications.warn("Só o dono do personagem usa este botão."); return true; }
  const msgId = botao.closest("[data-message-id]")?.dataset.messageId;
  const chave = `${msgId}:${acao}`;
  cliqueChatExtra.usados ??= new Set();
  if (cliqueChatExtra.usados.has(chave)) { ui.notifications.info("Já usado neste cartão."); return true; }
  const dados = actor.flags?.[FLAG] ?? {};
  if (["destrutivo", "alongado", "esmagador", "sangrenta"].includes(acao)) {
    const e = efeitoMaestria(acao, nivelArquetipo(dados, "combatente"), dados);
    if (!e) { ui.notifications.warn("Maestria indisponível."); return true; }
    // Cada Maestria com custo em PE vale 1×/turno; Maestrias diferentes podem no mesmo turno
    const usadas = Array.isArray(dados.usos?.maestriasTurno) ? dados.usos.maestriasTurno : [];
    if (e.custo && usadas.includes(acao)) { ui.notifications.warn(`${e.nome}: só 1 vez por turno.`); return true; }
    if (!(await gastar(actor, "pe", e.custo, e.nome))) return true;
    if (e.custo) await actor.update({ [`flags.${FLAG}.usos.maestriasTurno`]: [...usadas, acao] });
    cliqueChatExtra.usados.add(chave);
    if (acao === "esmagador" || acao === "sangrenta") {
      const cd = int(botao.dataset.cd) || 10;
      const efeito = acao === "esmagador" ? `Fortitude CD ${cd} ou ${e.efeito}.` : `Fortitude CD ${cd} ou fica Sangrando: perde ${e.dadosSangue} de Vida no início de cada turno, até passar em Fortitude CD ${cd} no fim do turno ou ser tratado. Aplicar de novo só renova.`;
      const alvos = String(botao.dataset.alvos ?? "").split(",").filter(Boolean);
      const resistir = (alvos.length ? alvos : [""]).map(uuid => `<button type="button" data-epm-action="resistir" data-pericia="fortitude" data-dt="${cd}"${uuid ? ` data-defensor="${escapar(uuid)}"` : ""} data-rotulo="${escapar(e.nome)}"><i class="fa-solid fa-shield-heart" aria-hidden="true"></i> Fortitude CD ${cd}${uuid ? `: ${escapar(fromUuidSync?.(uuid)?.name ?? "alvo")}` : ""}</button>`).join("");
      await ChatMessage.create({ speaker: falar(actor), flags: { [FLAG]: { tipo: "ataque" } },
        content: `<div class="epm-chat epm-chat-nota" data-actor-uuid="${actor.uuid}"><p><strong>${escapar(e.nome)}</strong> (−${e.custo} PE): ${escapar(efeito)}</p><div class="epm-chat-botoes">${resistir}</div></div>` });
      return true;
    }
    await cartaoDanoExtra(actor, {
      titulo: e.nome, valor: e.dano, alvos: botao.dataset.alvos ?? "", tipoDano: botao.dataset.tipoDano ?? "",
      texto: acao === "destrutivo" ? `−${e.custo} PE, +${e.dano} de dano` : `−${e.custo} PE: ${e.dano} de dano mesmo errando (não conta como acerto)`
    });
    return true;
  }
  const nivel = nivelArquetipo(dados, "conjurador");
  const cfg = ARQUETIPOS.conjurador;
  if (acao === "manipulacao") {
    const dupla = nivel >= cfg.manipulacao.nivelDupla;
    const exclui = nivel >= cfg.manipulacao.nivelPrecisa ? 4 : 2;
    const r = await dialogo({
      titulo: "Manipulação Mágica", ok: "Aplicar", icone: "fa-solid fa-wand-magic-sparkles",
      content: `<p class="epm-dica">Uma vez por magia. ${dupla ? "Uma modificação: 5 PE. Duas ao mesmo tempo: 10 PE." : "5 PE por uma modificação."}</p>
        ${cfg.manipulacao.opcoes.map((o, i) => `<label class="epm-check"><input type="checkbox" name="m${i}"> ${escapar(i === 3 ? `Excluir até ${exclui} criaturas da área` : o)}</label>`).join("")}`,
      callback: f => ({ escolhas: cfg.manipulacao.opcoes.map((o, i) => (f[`m${i}`]?.checked ? (i === 3 ? `Excluir até ${exclui} criaturas da área` : o) : null)).filter(Boolean) })
    });
    if (!r) return true;
    const limite = dupla ? 2 : 1;
    if (!r.escolhas.length) { ui.notifications.warn("Escolha uma modificação."); return true; }
    if (r.escolhas.length > limite) { ui.notifications.warn(`No seu nível: até ${limite} modificação(ões).`); return true; }
    const valor = r.escolhas.length > 1 ? cfg.manipulacao.custoDupla : cfg.manipulacao.custo;
    if (!(await gastar(actor, "pe", valor, "Manipulação Mágica"))) return true;
    cliqueChatExtra.usados.add(chave);
    await nota(actor, `<p><strong>Manipulação Mágica</strong> (−${valor} PE): ${escapar(r.escolhas.join("; "))}.</p>`, cfg.cor);
    return true;
  }
  if (acao === "sobrecarga") {
    const dado = botao.dataset.formula || "1d6";
    const opcoes = sobrecargaDe(nivel);
    const { ficha } = estadoAtor(actor);
    const pe = ficha.recursos.pe.value + Math.max(0, ficha.recursos.pe.temp ?? 0);
    const r = await dialogo({
      titulo: "Sobrecarga Mágica", ok: "Sobrecarregar", icone: "fa-solid fa-bolt",
      content: `<p class="epm-dica">Uma vez por magia. Dado da magia: ${escapar(dado)}.</p>
        ${opcoes.map((o, i) => `<label class="epm-check"><input type="radio" name="op" value="${i}" ${i === 0 ? "checked" : ""} ${pe < o.pe ? "disabled" : ""}> ${o.pe} PE: +${o.dados} dado${o.dados > 1 ? "s" : ""}</label>`).join("")}`,
      callback: f => ({ op: int(f.op?.value) })
    });
    if (!r) return true;
    const o = opcoes[r.op] ?? opcoes[0];
    if (!(await gastar(actor, "pe", o.pe, "Sobrecarga Mágica"))) return true;
    cliqueChatExtra.usados.add(chave);
    const lados = String(dado).match(/d(\d+)/i)?.[1] ?? "6";
    await rolarFormula(actor, `${o.dados}d${lados}`, `Sobrecarga Mágica (−${o.pe} PE): +${o.dados} dado(s)`);
    return true;
  }
  return false;
}



/* -------------------------------------------- */
/*  Ataque escondido até a reação do alvo       */
/* -------------------------------------------- */

/** Pede a revelação do ataque: direto se puder mexer na mensagem; senão o Mestre faz (socket). */
export async function revelarAtaque(msgId, defensorUuid = "", { forcar = false, reacao = "" } = {}) {
  const msg = game.messages?.get(msgId);
  if (!msg) return false;
  if (msg.isOwner || game.user?.isGM) return aplicarRevelacao(msg, defensorUuid, { forcar, reacao });
  const { pedirAoMestre } = await import("./mundo.mjs");
  return pedirAoMestre("revelarAtaque", { msgId, defensor: defensorUuid, forcar, reacao });
}

/** Marca a reação do defensor; quando todos responderam (ou forçado), troca o cartão pelo completo com as rolagens. */
export async function aplicarRevelacao(msg, defensorUuid = "", { forcar = false, reacao = "" } = {}) {
  const oculto = msg?.flags?.[FLAG]?.oculto;
  if (!oculto || oculto.revelado) return false;
  const respostas = { ...(oculto.respostas ?? {}) };
  if (defensorUuid) respostas[defensorUuid.replace(/\./g, "_")] = { reacao: reacao || "—", uuid: defensorUuid };
  const todos = (oculto.defensores ?? []).every(u => respostas[u.replace(/\./g, "_")]);
  if (!todos && !forcar) {
    await msg.update({ [`flags.${FLAG}.oculto.respostas`]: respostas });
    return false;
  }
  const nomes = await Promise.all(Object.values(respostas).map(async r => `${escapar((await fromUuid(r.uuid))?.name ?? "Alvo")}: ${escapar(r.reacao)}`));
  const linhaReacoes = nomes.length ? `<p class="epm-chat-requisitos epm-chat-reacoes"><strong>Reação</strong>: ${nomes.join("; ")}.</p>` : `<p class="epm-chat-requisitos epm-chat-reacoes">Revelado sem esperar a reação.</p>`;
  const conteudo = String(oculto.conteudo ?? "").replace(/<\/div>\s*$/, `${linhaReacoes}</div>`);
  const upd = { content: conteudo, [`flags.${FLAG}.oculto.revelado`]: true, [`flags.${FLAG}.oculto.respostas`]: respostas };
  if (Array.isArray(oculto.rolls) && oculto.rolls.length) upd.rolls = oculto.rolls;
  await msg.update(upd);
  return true;
}
