/**
 * Seleção de vários itens nas abas da ficha (Inventário, Bênçãos, Companheiros, Bestiário,
 * Relações, Treinamentos e Produção). Habilidades e Magias têm a barra no próprio template
 * (extras.acaoEmMassa); aqui a barra, o botão "Selecionar" e as caixinhas entram pelo JS
 * a cada desenho, a partir da tabela ABAS_SELECAO.
 */
import { FLAG, RARIDADES_ITEM, CATEGORIA_MOCHILAS } from "./config.mjs";
import { int } from "./data.mjs";
import { escapar } from "./helpers.mjs";
import * as M from "./mecanicas.mjs";
import { dialogo, maxCompanheiro } from "./extras.mjs";

const P = `flags.${FLAG}`;
const flags = actor => actor.flags?.[FLAG] ?? {};
const eMochila = item => CATEGORIA_MOCHILAS.tipos.includes(item.type);
const usavel = item => item.type === "consumable" || int(item.flags?.[FLAG]?.cargas?.max) > 0;
const equipavel = item => ["weapon", "equipment"].includes(item.type);

/** Abas com seleção do template (não passam por aqui). */
export const ABAS_PODERES = ["habilidades", "magias"];

/**
 * Cada aba: onde ficam as linhas (sel), como ler o id, onde pôr a caixinha (onde, relativo à linha),
 * rótulo do contador, como saber se o id ainda existe e as ações.
 * quando: "sempre" (quem pode editar a ficha), "edicao" (só no modo edição).
 */
export const ABAS_SELECAO = {
  inventario: {
    rotulo: ["item selecionado", "itens selecionados"],
    linhas: [
      { sel: "li.epm-item[data-item-id]", id: el => el.dataset.itemId, onde: ":scope > .epm-item-linha" },
      { sel: "article.epm-mochila[data-item-id]", id: el => el.dataset.itemId, onde: ":scope > header.epm-mochila-topo" }
    ],
    existe: (actor, id) => !!actor.items.get(id),
    ops: [
      { op: "usar", label: "Usar", icone: "fa-solid fa-flask", dica: "Gasta 1 de cada consumível (ou 1 carga) e mostra no chat" },
      { op: "equipar", label: "Equipar", icone: "fa-solid fa-shirt", dica: "Equipa as armas e armaduras marcadas (se todas já estiverem equipadas, tira)" },
      { op: "favoritar", label: "Favoritar", icone: "fa-solid fa-star" },
      { op: "chat", label: "No chat", icone: "fa-solid fa-comment" },
      { op: "mochila", label: "Mover para", icone: "fa-solid fa-right-left", dica: "Guardar numa mochila ou tirar das mochilas" },
      { op: "raridade", label: "Raridade", icone: "fa-solid fa-gem", quando: "edicao" },
      { op: "duplicar", label: "Duplicar", icone: "fa-solid fa-clone", quando: "edicao" },
      { op: "apagar", label: "Apagar", icone: "fa-solid fa-trash", quando: "edicao", perigo: true }
    ]
  },
  bencaos: {
    rotulo: ["selecionada", "selecionadas"],
    linhas: [{ sel: "article.epm-bencao[data-bencao]", id: el => el.dataset.bencao, onde: ":scope > header.epm-bencao-topo" }],
    existe: (actor, id) => !!flags(actor).bencaos?.[id],
    ops: [
      { op: "usar", label: "Usar", icone: "fa-solid fa-hand-sparkles", dica: "Usa uma por uma (as já usadas avisam)" },
      { op: "ligar", label: "Ligar / desligar", icone: "fa-solid fa-toggle-on", dica: "Liga todas; se todas já estiverem ligadas, desliga" },
      { op: "recarregar", label: "Recarregar", icone: "fa-solid fa-rotate-left", dica: "Marca como disponíveis de novo" },
      { op: "encerrar", label: "Encerrar", icone: "fa-solid fa-hourglass-end", dica: "Encerra as que estão em curso" },
      { op: "chat", label: "No chat", icone: "fa-solid fa-comment" },
      { op: "apagar", label: "Apagar", icone: "fa-solid fa-trash", quando: "edicao", perigo: true }
    ]
  },
  companheiros: {
    rotulo: ["companheiro selecionado", "companheiros selecionados"],
    linhas: [{ sel: "article.epm-companheiro[data-companheiro]", id: el => el.dataset.companheiro, onde: ":scope > .epm-comp-topo" }],
    existe: (actor, id) => !!flags(actor).companheiros?.[id],
    ops: [
      { op: "descansar", label: "Recuperar tudo", icone: "fa-solid fa-bed", dica: "Enche PV, PM e PE dos marcados" },
      { op: "apagar", label: "Apagar", icone: "fa-solid fa-trash", quando: "edicao", perigo: true }
    ]
  },
  bestiario: {
    rotulo: ["criatura selecionada", "criaturas selecionadas"],
    linhas: [{ sel: "article.epm-criatura[data-criatura]", id: el => el.dataset.criatura, onde: ":scope > .epm-criatura-corpo > .epm-criatura-topo" }],
    existe: (actor, id) => !!flags(actor).bestiario?.[id],
    ops: [
      { op: "encontro", label: "+1 encontro", icone: "fa-solid fa-eye", quando: "edicao" },
      { op: "derrota", label: "+1 derrota", icone: "fa-solid fa-skull", quando: "edicao" },
      { op: "apagar", label: "Tirar do bestiário", icone: "fa-solid fa-trash", quando: "edicao", perigo: true }
    ]
  },
  relacoes: {
    rotulo: ["selecionada", "selecionadas"],
    linhas: [
      { sel: "article.epm-relacao[data-relacao]", id: el => `relacoes:${el.dataset.relacao}`, onde: ":scope .epm-relacao-topo-texto" },
      { sel: "article.epm-faccao[data-faccao]", id: el => `faccoes:${el.dataset.faccao}`, onde: ":scope .epm-relacao-topo-texto" }
    ],
    existe: (actor, id) => { const [g, k] = id.split(":"); return !!flags(actor)[g]?.[k]; },
    ops: [{ op: "apagar", label: "Apagar", icone: "fa-solid fa-trash", quando: "edicao", perigo: true }]
  },
  treinamentos: {
    rotulo: ["selecionado", "selecionados"],
    linhas: [
      { sel: "article.epm-treino[data-secao^='treino-']", id: el => `treinamentos:${el.dataset.secao.slice(7)}`, onde: ":scope > header.epm-treino-topo" },
      { sel: "article.epm-criacao[data-secao^='criacao-']", id: el => `criacoes:${el.dataset.secao.slice(8)}`, onde: ":scope > header.epm-treino-topo" }
    ],
    existe: (actor, id) => { const [g, k] = id.split(":"); return !!flags(actor)[g]?.[k]; },
    ops: [{ op: "apagar", label: "Apagar", icone: "fa-solid fa-trash", perigo: true, dica: "Os PT e as horas gastos não voltam" }]
  },
  producao: {
    rotulo: ["receita selecionada", "receitas selecionadas"],
    linhas: [{ sel: "article.epm-receita[data-receita]", id: el => el.dataset.receita, onde: ":scope > header.epm-receita-topo" }],
    existe: (actor, id) => !!flags(actor).receitas?.[id],
    ops: [{ op: "apagar", label: "Apagar", icone: "fa-solid fa-trash", quando: "edicao", perigo: true }]
  }
};

/** Texto do contador ("3 itens selecionados"). */
export function textoQtd(aba, qtd) {
  const r = ABAS_SELECAO[aba]?.rotulo ?? ["selecionada", "selecionadas"];
  return `<strong>${qtd}</strong> ${qtd === 1 ? r[0] : r[1]}`;
}

/** Ids marcados que ainda existem na ficha. */
export function idsValidos(actor, aba, ids) {
  if (ABAS_PODERES.includes(aba) || !ABAS_SELECAO[aba]) return [...ids].filter(id => actor.items.get(id));
  return [...ids].filter(id => ABAS_SELECAO[aba].existe(actor, id));
}

function botao({ op, label, icone, dica, perigo }, qtd) {
  return `<button type="button" class="epm-botao${perigo ? " perigo" : ""}" data-action="selecaoAcao" data-op="${op}"${qtd ? "" : " disabled"}${dica ? ` title="${escapar(dica)}"` : ""}><i class="${icone}" aria-hidden="true"></i> ${escapar(label)}</button>`;
}

function criar(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/**
 * Põe o botão "Selecionar" no topo de cada aba da tabela e, na aba em seleção, a barra de ações
 * e uma caixinha em cada linha. Pode rodar a cada desenho: limpa o que pôs antes.
 */
export function decorar(sheet) {
  const raiz = sheet.element;
  if (!raiz) return;
  const editavel = sheet.isEditable;
  const edicao = !!sheet._modoEdicao;
  const sel = sheet._selecao;
  for (const [aba, cfg] of Object.entries(ABAS_SELECAO)) {
    const secao = raiz.querySelector(`section.tab[data-group="primary"][data-tab="${aba}"]`);
    if (!secao) continue;
    for (const n of secao.querySelectorAll("[data-epm-sel]")) n.remove();
    for (const n of secao.querySelectorAll(".epm-sel-linha")) n.classList.remove("epm-sel-linha", "selecionado");
    if (!editavel) continue;
    const ativa = sel.aba === aba;
    // Sem nenhuma ação possível agora (ex.: só Apagar, fora do modo edição): nem mostra o botão
    if (!ativa && !cfg.ops.some(o => o.quando !== "edicao" || edicao)) continue;

    // Botão Selecionar: nas ações do topo da aba (ou no próprio topo)
    const topo = secao.querySelector(":scope > header.epm-aba-topo");
    const lugar = topo?.querySelector(".epm-aba-acoes, .epm-treino-botoes") ?? topo;
    const b = criar(`<button type="button" data-epm-sel="1" class="epm-botao epm-sel-botao${ativa ? " ativo" : ""}" data-action="selecionarPoderes" data-aba="${aba}" aria-pressed="${ativa}" title="Marcar vários para agir de uma vez"><i class="fa-solid fa-list-check" aria-hidden="true"></i> ${ativa ? "Sair da seleção" : "Selecionar"}</button>`);
    if (lugar) lugar.prepend(b);
    else secao.prepend(b);
    if (!ativa) continue;

    // Linhas e caixinhas
    for (const l of cfg.linhas) {
      for (const el of secao.querySelectorAll(l.sel)) {
        const id = l.id(el);
        const marcado = sel.ids.has(id);
        el.classList.add("epm-sel-linha");
        el.classList.toggle("selecionado", marcado);
        el.dataset.epmSelId = id;
        const alvo = el.querySelector(l.onde) ?? el;
        const nome = el.querySelector(".epm-item-titulo, .epm-bencao-nome, .epm-comp-nome, .epm-criatura-nome, .epm-relacao-nome, strong, h4, input[type=text]");
        const rot = nome?.value || nome?.textContent?.trim() || "";
        alvo.prepend(criar(`<label class="epm-selecionar" data-epm-sel="1" title="Selecionar (Shift: marca o intervalo)"><input type="checkbox" data-selecionar="${escapar(id)}" ${marcado ? "checked" : ""} aria-label="Selecionar ${escapar(rot)}" /></label>`));
      }
    }

    // Barra de ações
    const qtd = idsValidos(sheet.actor, aba, sel.ids).length;
    const ops = cfg.ops.filter(o => o.quando !== "edicao" || edicao);
    const soEdicao = cfg.ops.filter(o => o.quando === "edicao").map(o => o.label.toLowerCase());
    const barra = criar(`<div class="epm-selecao-barra" data-epm-sel="1" role="toolbar" aria-label="Ações nos selecionados">
      <span class="epm-selecao-qtd" data-aba="${aba}">${textoQtd(aba, qtd)}</span>
      <button type="button" class="epm-link" data-action="selecaoTudo">Marcar todos</button>
      <button type="button" class="epm-link" data-action="selecaoLimpar"${qtd ? "" : " disabled"}>Limpar</button>
      <span class="epm-selecao-acoes">${ops.map(o => botao(o, qtd)).join("")}</span>
      ${!edicao && soEdicao.length ? `<span class="epm-dica">${escapar(soEdicao.join(", ").replace(/^./, c => c.toUpperCase()))}: só no modo edição.</span>` : ""}
    </div>`);
    if (topo) topo.after(barra);
    else secao.prepend(barra);
  }
  ligarCaixinhas(sheet);
}

/** Clique com Shift marca (ou desmarca) todas as caixinhas entre a última e esta. */
export function ligarCaixinhas(sheet) {
  for (const cx of sheet.element.querySelectorAll("input[data-selecionar], input[data-selecionar-poder]")) {
    if (cx.dataset.epmLigado) continue;
    cx.dataset.epmLigado = "1";
    cx.closest("label")?.addEventListener("click", ev => ev.stopPropagation());
    cx.addEventListener("click", ev => {
      const id = cx.dataset.selecionar ?? cx.dataset.selecionarPoder;
      const ultimo = sheet._ultimaCaixa;
      sheet._ultimaCaixa = id;
      if (!ev.shiftKey || !ultimo || ultimo === id) return;
      const todas = [...sheet.element.querySelectorAll("input[data-selecionar], input[data-selecionar-poder]")].filter(c => c.offsetParent !== null);
      const ids = todas.map(c => c.dataset.selecionar ?? c.dataset.selecionarPoder);
      const a = ids.indexOf(ultimo), b = ids.indexOf(id);
      if (a < 0 || b < 0) return;
      for (const x of ids.slice(Math.min(a, b), Math.max(a, b) + 1)) sheet._marcarPoder(x, cx.checked);
    });
  }
}

/** Ids de todas as linhas visíveis da aba em seleção. */
export function idsVisiveis(sheet, aba) {
  const cfg = ABAS_SELECAO[aba];
  const secao = sheet.element.querySelector(`section.tab[data-group="primary"][data-tab="${aba}"]`);
  if (!cfg || !secao) return [];
  return cfg.linhas.flatMap(l => [...secao.querySelectorAll(l.sel)].filter(el => el.offsetParent !== null && !el.hidden).map(l.id));
}

/* -------------------------------------------- */
/*  Ações                                       */
/* -------------------------------------------- */

async function apagarFlags(actor, ids, titulo, nomeDe) {
  const lista = ids.map(id => { const [g, k] = id.includes(":") ? id.split(":") : [null, id]; return { g, k, nome: nomeDe(g, k) }; });
  if (!(await M.confirmar(titulo, `<p>Apagar <strong>${lista.length}</strong>: ${lista.map(x => escapar(x.nome)).join(", ")}?</p>`))) return false;
  const up = {};
  for (const { g, k } of lista) up[`${P}.${g}.-=${k}`] = null;
  await actor.update(up);
  return true;
}

/** Roda a ação da barra. Devolve true quando os ids deixaram de existir (para limpar a seleção). */
export async function executar(sheet, aba, op, ids) {
  const actor = sheet.actor;
  if (!ids.length) { ui.notifications.info("Nada selecionado."); return false; }
  const f = flags(actor);

  if (aba === "inventario") {
    const itens = ids.map(id => actor.items.get(id)).filter(Boolean);
    switch (op) {
      case "usar": {
        const alvo = itens.filter(usavel);
        if (!alvo.length) { ui.notifications.info("Nenhum dos marcados é consumível ou tem cargas."); return false; }
        for (const it of alvo) await M.usarItem(actor, it);
        if (alvo.length < itens.length) ui.notifications.info(`${itens.length - alvo.length} marcado(s) não se usa(m) assim e ficou(aram) de fora.`);
        return false;
      }
      case "equipar": {
        const alvo = itens.filter(equipavel);
        if (!alvo.length) { ui.notifications.info("Nenhum dos marcados é arma ou armadura."); return false; }
        const todos = alvo.every(i => i.system?.equipped);
        await actor.updateEmbeddedDocuments("Item", alvo.map(i => ({ _id: i.id, "system.equipped": !todos })));
        return false;
      }
      case "favoritar": {
        const todos = itens.every(i => i.flags?.[FLAG]?.favorito);
        await actor.updateEmbeddedDocuments("Item", itens.map(i => ({ _id: i.id, [`${P}.favorito`]: !todos })));
        return false;
      }
      case "chat":
        for (const it of itens) await M.cartaoItem(actor, it);
        return false;
      case "mochila": {
        const marcados = new Set(itens.map(i => i.id));
        const mochilas = actor.items.filter(i => eMochila(i) && !marcados.has(i.id));
        const r = await dialogo({
          titulo: "Mover para", ok: "Mover", icone: "fa-solid fa-right-left",
          content: `<p class="epm-dica">${itens.length} item(ns). Mochilas marcadas não entram em outras.</p><label class="epm-campo"><span>Para</span><select name="destino"><option value="">Fora das mochilas</option>${mochilas.map(m => `<option value="${m.id}">${escapar(m.name)}</option>`).join("")}</select></label>`,
          callback: el => ({ destino: el.destino?.value ?? "" })
        });
        if (!r) return false;
        const mover = itens.filter(i => !eMochila(i));
        await actor.updateEmbeddedDocuments("Item", mover.map(i => ({ _id: i.id, "system.container": r.destino || null })));
        return false;
      }
      case "raridade": {
        const r = await dialogo({
          titulo: "Mudar raridade", ok: "Mudar",
          content: `<p class="epm-dica">${itens.length} item(ns).</p><label class="epm-campo"><span>Raridade</span><select name="raridade">${Object.entries(RARIDADES_ITEM).map(([id, x]) => `<option value="${id}">${x.label}</option>`).join("")}</select></label>`,
          callback: el => ({ raridade: el.raridade?.value })
        });
        if (!r?.raridade) return false;
        await actor.updateEmbeddedDocuments("Item", itens.map(i => ({ _id: i.id, [`${P}.raridade`]: r.raridade })));
        return false;
      }
      case "duplicar": {
        await actor.createEmbeddedDocuments("Item", itens.map(i => {
          const d = i.toObject();
          delete d._id;
          d.name = `${i.name} (cópia)`;
          foundry.utils.setProperty(d, `${P}.favorito`, false);
          return d;
        }));
        return false;
      }
      case "apagar": {
        const marcados = new Set(itens.map(i => i.id));
        const dentro = actor.items.filter(i => i.system?.container && marcados.has(i.system.container) && !marcados.has(i.id));
        const extra = dentro.length ? `<p class="epm-dica">Os ${dentro.length} item(ns) de dentro das mochilas apagadas voltam para o inventário.</p>` : "";
        if (!(await M.confirmar("Apagar vários", `<p>Apagar <strong>${itens.length}</strong>: ${itens.map(i => escapar(i.name)).join(", ")}?</p>${extra}`))) return false;
        if (dentro.length) await actor.updateEmbeddedDocuments("Item", dentro.map(i => ({ _id: i.id, "system.container": null })));
        for (const id of marcados) sheet._expandidos?.delete(id);
        await actor.deleteEmbeddedDocuments("Item", [...marcados]);
        return true;
      }
    }
    return false;
  }

  if (aba === "bencaos") {
    const b = id => f.bencaos?.[id] ?? {};
    const nome = id => b(id).nome || (b(id).tipo === "maldicao" ? "Maldição sem nome" : "Bênção sem nome");
    switch (op) {
      case "usar":
        for (const id of ids) await M.usarBencao(actor, id);
        return false;
      case "ligar": {
        const todas = ids.every(id => b(id).ativo);
        await actor.update(Object.fromEntries(ids.map(id => [`${P}.bencaos.${id}.ativo`, !todas])));
        return false;
      }
      case "recarregar":
        await actor.update(Object.fromEntries(ids.map(id => [`${P}.bencaos.${id}.usado`, false])));
        return false;
      case "encerrar": {
        const ativas = ids.filter(id => b(id).ativo);
        if (!ativas.length) { ui.notifications.info("Nenhuma das marcadas está em curso."); return false; }
        for (const id of ativas) await M.terminarBencao(actor, id);
        return false;
      }
      case "chat":
        for (const id of ids) await M.cartaoBencao(actor, id);
        return false;
      case "apagar":
        return apagarFlags(actor, ids.map(id => `bencaos:${id}`), "Apagar várias", (g, k) => nome(k));
    }
    return false;
  }

  if (aba === "companheiros") {
    const c = id => f.companheiros?.[id] ?? {};
    if (op === "descansar") {
      const up = {};
      for (const id of ids) {
        for (const r of ["pv", "pm", "pe"]) {
          const max = maxCompanheiro(f, c(id), r);
          if (max > 0) up[`${P}.companheiros.${id}.${r}.value`] = max;
        }
      }
      if (Object.keys(up).length) await actor.update(up);
      return false;
    }
    if (op === "apagar") return apagarFlags(actor, ids.map(id => `companheiros:${id}`), "Apagar companheiros", (g, k) => c(k).nome || "Sem nome");
    return false;
  }

  if (aba === "bestiario") {
    const c = id => f.bestiario?.[id] ?? {};
    if (op === "encontro" || op === "derrota") {
      const campo = op === "encontro" ? "encontros" : "derrotados";
      await actor.update(Object.fromEntries(ids.map(id => [`${P}.bestiario.${id}.${campo}`, int(c(id)[campo]) + 1])));
      return false;
    }
    if (op === "apagar") return apagarFlags(actor, ids.map(id => `bestiario:${id}`), "Tirar do bestiário", (g, k) => c(k).nome || "Sem nome");
    return false;
  }

  if (aba === "relacoes" && op === "apagar") {
    return apagarFlags(actor, ids, "Apagar várias", (g, k) => f[g]?.[k]?.nome || (g === "faccoes" ? "Facção sem nome" : "Relação sem nome"));
  }
  if (aba === "treinamentos" && op === "apagar") {
    return apagarFlags(actor, ids, "Apagar vários", (g, k) => f[g]?.[k]?.nome || (g === "criacoes" ? "Projeto sem nome" : "Treino sem nome"));
  }
  if (aba === "producao" && op === "apagar") {
    return apagarFlags(actor, ids.map(id => `receitas:${id}`), "Apagar receitas", (g, k) => f.receitas?.[k]?.nome || "Receita sem nome");
  }
  return false;
}


/**
 * "Mover para" de um item: escolhe a mochila (ou fora delas) e, se tiver mais de 1, quantos.
 * Mover só parte separa a pilha; se o destino já tem o mesmo item, soma nele.
 */
export async function moverItemPara(actor, item) {
  if (!item || eMochila(item)) return;
  const mochilas = actor.items.filter(i => eMochila(i));
  const qtd = Math.max(0, Number(item.system?.quantity ?? 1) || 0);
  const atual = item.system?.container ?? "";
  const opcoes = [{ id: "", nome: "Inventário (fora das mochilas)" }, ...mochilas.map(m => ({ id: m.id, nome: m.name }))]
    .filter(o => o.id !== atual);
  if (!opcoes.length) return ui.notifications.info("Não há outro lugar para mover.");
  const r = await dialogo({
    titulo: `Mover ${item.name}`, ok: "Mover", icone: "fa-solid fa-right-left",
    content: `<label class="epm-campo"><span>Para</span><select name="destino">${opcoes.map(o => `<option value="${o.id}">${escapar(o.nome)}</option>`).join("")}</select></label>`
      + (qtd > 1 ? `<label class="epm-campo"><span>Quantos (de ${qtd})</span><input type="number" name="qtd" min="1" max="${qtd}" value="${qtd}" /></label>` : ""),
    callback: el => ({ destino: el.destino?.value ?? "", qtd: el.qtd ? Number(el.qtd.value) : qtd })
  });
  if (!r) return;
  const destino = r.destino || null;
  const n = Math.min(qtd, Math.max(1, Math.floor(r.qtd || qtd)));
  // Se o destino já tem o mesmo item, soma nele
  const igual = actor.items.find(i => i.id !== item.id && i.type === item.type && i.name === item.name && (i.system?.container ?? null) === destino);
  if (qtd <= 1 || n >= qtd) {
    if (!igual) return item.update({ "system.container": destino });
    await igual.update({ "system.quantity": Number(igual.system?.quantity ?? 0) + Math.max(1, qtd) });
    return actor.deleteEmbeddedDocuments("Item", [item.id]);
  }
  // Parte da pilha
  await item.update({ "system.quantity": qtd - n });
  if (igual) return igual.update({ "system.quantity": Number(igual.system?.quantity ?? 0) + n });
  const d = item.toObject();
  delete d._id;
  foundry.utils.setProperty(d, "system.quantity", n);
  foundry.utils.setProperty(d, "system.container", destino);
  return actor.createEmbeddedDocuments("Item", [d]);
}
