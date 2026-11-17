/**
 * Janela do Grimório de Magias: busca, filtros (círculo, escola, execução, tipo de dano), detalhes de cada magia,
 * "Adicionar à ficha" (ou "Dar para" no Escudo), "Atualizar as da ficha" e, para o Mestre, "Importar para o mundo".
 * As magias vêm de scripts/grimorio-dados.mjs: não precisa abrir o site nem copiar nada.
 * Carregada sob demanda (import dinâmico), só dentro do Foundry.
 */
import { FLAG } from "./config.mjs";
import { escapar } from "./helpers.mjs";
import { GRIMORIO } from "./grimorio-dados.mjs";
import {
  GRIMORIO_URL, SECOES_GRIMORIO, secaoDe, dadosMagiaGrimorio, descricaoGrimorio, textoBusca, execucaoCurta, tipoExecucao, EXECUCOES,
  tiposDanoGrimorio, iconeGrimorio
} from "./grimorio.mjs";

const PASTA_RAIZ = "EPM · Grimório de Magias";
const semAcento = t => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const porId = new Map(GRIMORIO.magias.map(m => [m.id, m]));
export const magiaGrimorioPorId = id => porId.get(id) ?? null;

/** Ids do grimório que a ficha já tem. */
const idsNaFicha = actor => new Set((actor?.items ?? []).map(i => i.flags?.[FLAG]?.grimorio).filter(Boolean));

/** Cria na ficha as magias marcadas (as que ela já tem ficam de fora). */
export async function adicionarDoGrimorio(actor, ids) {
  if (!actor?.isOwner) return ui.notifications.warn("Você não pode mexer nesta ficha.");
  const tem = idsNaFicha(actor);
  const lista = ids.map(magiaGrimorioPorId).filter(Boolean);
  if (!lista.length) return ui.notifications.warn("Marque pelo menos uma magia.");
  const novas = lista.filter(m => !tem.has(m.id)).map(m => dadosMagiaGrimorio(m));
  if (novas.length) await actor.createEmbeddedDocuments("Item", novas);
  const repetidas = lista.length - novas.length;
  ui.notifications.info(`${actor.name}: ${novas.length} magia(s) do Grimório adicionada(s)${repetidas ? `, ${repetidas} já estava(m) na ficha` : ""}.`);
  return novas.length;
}

/**
 * Atualiza as magias da ficha que vieram do Grimório com o texto atual (descrição, círculo e forma principal).
 * Mantém raridade, favorito, formas extras e o que não vem do Grimório.
 */
export async function atualizarDoGrimorio(actor) {
  if (!actor?.isOwner) return ui.notifications.warn("Você não pode mexer nesta ficha.");
  const upd = [];
  for (const item of actor.items) {
    const m = magiaGrimorioPorId(item.flags?.[FLAG]?.grimorio);
    if (!m) continue;
    const formas = item.flags[FLAG].formas ?? {};
    const principal = Object.entries(formas).sort(([, a], [, b]) => (a?.ordem ?? 0) - (b?.ordem ?? 0))[0]?.[0];
    const novo = dadosMagiaGrimorio(m, { id: () => principal ?? foundry.utils.randomID() });
    const [idForma, forma] = Object.entries(novo.flags[FLAG].formas)[0];
    upd.push({
      _id: item.id, name: novo.name, "system.level": novo.system.level, "system.description.value": novo.system.description.value,
      [`flags.${FLAG}.tema`]: novo.flags[FLAG].tema, [`flags.${FLAG}.formas.${idForma}`]: { ...forma, nome: formas[idForma]?.nome ?? forma.nome }
    });
  }
  if (!upd.length) return ui.notifications.info(`${actor.name} não tem magias do Grimório.`);
  await actor.updateEmbeddedDocuments("Item", upd);
  ui.notifications.info(`${actor.name}: ${upd.length} magia(s) atualizada(s) com o texto atual do Grimório.`);
}

/** Cria (ou completa) a pasta do Grimório na aba Itens, com uma subpasta por círculo. Só o Mestre. */
export async function importarGrimorioParaOMundo(ids = null) {
  if (!game.user.isGM) return ui.notifications.warn("Só o Mestre importa para o mundo.");
  const lista = ids?.length ? ids.map(magiaGrimorioPorId).filter(Boolean) : GRIMORIO.magias;
  const Pasta = foundry.documents?.Folder ?? globalThis.Folder;
  let raiz = game.folders.find(f => f.type === "Item" && f.name === PASTA_RAIZ && !f.folder);
  raiz ??= await Pasta.create({ name: PASTA_RAIZ, type: "Item", color: "#6D3FA9" });
  const pastas = {};
  for (const [ordem, s] of SECOES_GRIMORIO.entries()) {
    if (!lista.some(m => secaoDe(m) === s.id)) continue;
    pastas[s.id] = game.folders.find(f => f.type === "Item" && f.name === s.label && f.folder?.id === raiz.id)
      ?? await Pasta.create({ name: s.label, type: "Item", folder: raiz.id, sort: ordem * 10 });
  }
  const jaTem = new Set(game.items.map(i => i.flags?.[FLAG]?.grimorio).filter(Boolean));
  const docs = lista.filter(m => !jaTem.has(m.id)).map(m => ({ ...dadosMagiaGrimorio(m), folder: pastas[secaoDe(m)]?.id }));
  if (!docs.length) return ui.notifications.info("Essas magias já estão no mundo.");
  for (let i = 0; i < docs.length; i += 100) await Item.createDocuments(docs.slice(i, i + 100));
  ui.notifications.info(`${docs.length} magia(s) importada(s) para a pasta "${PASTA_RAIZ}".`);
}

/** Tipos de dano que aparecem no grimório (para o filtro). */
const tiposDe = new Map(GRIMORIO.magias.map(m => [m.id, tiposDanoGrimorio(m)]));
const ESCOLAS = [...new Set(GRIMORIO.magias.map(m => m.escola))].sort((a, b) => a.localeCompare(b, "pt-BR"));
const TIPOS = [...new Set([...tiposDe.values()].flat())].sort((a, b) => a.localeCompare(b, "pt-BR"));

let classe = null;
function criarClasse() {
  const { ApplicationV2 } = foundry.applications.api;
  return class GrimorioMagias extends ApplicationV2 {
    constructor({ actor = null, destino = "" } = {}) {
      super({ id: `epm-grimorio-${actor?.id ?? "mundo"}` });
      this.actor = actor;
      this.destino = destino;
      this.secao = "";
    }

    static DEFAULT_OPTIONS = {
      classes: ["epm", "epm-catalogo", "epm-grimorio"],
      window: { title: "Grimório de Magias", icon: "fa-solid fa-book-skull", resizable: true },
      position: { width: 900, height: 780 }
    };

    get title() { return this.actor ? `Grimório de Magias · ${this.actor.name}` : "Grimório de Magias"; }

    async _renderHTML() {
      const raiz = document.createElement("div");
      raiz.className = "epm-catalogo-corpo";
      const opt = (v, l) => `<option value="${escapar(v)}">${escapar(l)}</option>`;
      const tem = idsNaFicha(this.actor);
      const destinos = this.actor ? [] : game.actors.filter(a => a.isOwner && a.flags?.[FLAG])
        .sort((a, b) => Number(b.type === "character") - Number(a.type === "character") || a.name.localeCompare(b.name, "pt-BR"));
      const grupos = SECOES_GRIMORIO.map(s => {
        const magias = GRIMORIO.magias.filter(m => secaoDe(m) === s.id);
        if (!magias.length) return "";
        const linhas = magias.map(m => {
          const c = m.campos ?? {};
          const pm = Number(c["Custo PM"]) || 0;
          const custo = m.tipo === "ritual" ? (c["Custo"] ? "Materiais" : "—") : pm ? `${pm} PM` : "0 PM";
          return `<li class="epm-gri-linha${tem.has(m.id) ? " na-ficha" : ""}" data-id="${m.id}" data-escola="${escapar(m.escola)}"
              data-exec="${tipoExecucao(c["Execução"])}" data-dano="|${escapar((tiposDe.get(m.id) ?? []).join("|"))}|" data-texto="${escapar(textoBusca(m))}">
            <input type="checkbox" class="epm-cat-marca" aria-label="Marcar ${escapar(m.nome)}" ${tem.has(m.id) ? "disabled title=\"Já está na ficha\"" : ""}>
            <button type="button" class="epm-gri-nome" data-abrir aria-expanded="false"><img class="epm-cat-img" src="${iconeGrimorio(m)}" alt="">${escapar(m.nome)}${tem.has(m.id) ? ' <span class="epm-tag">na ficha</span>' : ""}</button>
            <span class="epm-gri-escola">${escapar(m.escola)}</span>
            <span class="epm-gri-exec" title="${escapar(c["Execução"] ?? "")}">${escapar(execucaoCurta(c["Execução"]))}</span>
            <span class="epm-gri-alcance" title="Alcance">${escapar(c["Alcance"] ?? "")}</span>
            <span class="epm-gri-custo">${escapar(custo)}</span>
            <div class="epm-gri-detalhe" hidden></div>
          </li>`;
        }).join("");
        return `<section class="epm-cat-grupo" data-secao="${s.id}"><h4>${escapar(s.label)} <small>(${magias.length})</small></h4><ul>${linhas}</ul></section>`;
      }).join("");
      const chips = [{ id: "", label: "Todas" }, ...SECOES_GRIMORIO].map(s =>
        `<button type="button" class="epm-gri-chip${s.id === this.secao ? " ativo" : ""}" data-secao-chip="${s.id}" aria-pressed="${s.id === this.secao}">${escapar(s.id ? s.label.replace(" Círculo", "") : s.label)}</button>`).join("");
      raiz.innerHTML = `
        <div class="epm-cat-filtros">
          <input type="search" class="epm-busca" data-busca placeholder="Buscar magia (nome, efeito, condição…)" aria-label="Buscar">
          <select data-filtro-escola aria-label="Escola">${opt("", "Todas as escolas")}${ESCOLAS.map(e => opt(e, e)).join("")}</select>
          <select data-filtro-exec aria-label="Execução">${opt("", "Todas as execuções")}${Object.entries(EXECUCOES).map(([k, l]) => opt(k, l)).join("")}</select>
          <select data-filtro-dano aria-label="Tipo de dano">${opt("", "Qualquer dano")}${TIPOS.map(t => opt(t, t)).join("")}</select>
          <label class="epm-check"><input type="checkbox" data-so-marcados> Só as marcadas</label>
        </div>
        <div class="epm-gri-chips" role="group" aria-label="Círculo">${chips}</div>
        <div class="epm-cat-lista">${grupos}<p class="epm-dica epm-gri-vazio" hidden>Nenhuma magia com esses filtros.</p></div>
        <footer class="epm-cat-rodape">
          <span class="epm-cat-total">Marcadas: <strong data-qtd>0</strong></span>
          ${!this.actor && destinos.length ? `<label class="epm-campo epm-cat-destino"><span>Dar para</span><select data-destino>${destinos.map(a => `<option value="${a.id}" ${a.id === this.destino ? "selected" : ""}>${escapar(a.name)}</option>`).join("")}</select></label>` : ""}
          <a class="epm-link" href="${GRIMORIO_URL}" target="_blank" rel="noopener" title="As mesmas magias, no site"><i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir o site</a>
          <span class="epm-cat-botoes">
            ${this.actor && tem.size ? `<button type="button" class="epm-botao" data-atualizar title="Reescreve as magias que vieram do Grimório com o texto atual (raridade, favorito e formas extras ficam)"><i class="fa-solid fa-rotate"></i> Atualizar as da ficha</button>` : ""}
            ${this.actor || destinos.length ? `<button type="button" class="epm-botao epm-botao-forte" data-adicionar><i class="fa-solid fa-plus"></i> ${this.actor ? "Adicionar à ficha" : "Dar"}</button>` : ""}
            ${game.user.isGM ? `<button type="button" class="epm-botao" data-importar title="Cria as magias numa pasta da aba Itens (sem marcar nada: o grimório inteiro)"><i class="fa-solid fa-folder-plus"></i> Importar para o mundo</button>` : ""}
          </span>
        </footer>`;
      return raiz;
    }

    _replaceHTML(result, content) { content.replaceChildren(result); }

    _onRender(context, options) {
      super._onRender?.(context, options);
      const r = this.element;
      const filtrar = () => {
        const busca = semAcento(r.querySelector("[data-busca]")?.value).trim();
        const escola = r.querySelector("[data-filtro-escola]")?.value ?? "";
        const exec = r.querySelector("[data-filtro-exec]")?.value ?? "";
        const dano = r.querySelector("[data-filtro-dano]")?.value ?? "";
        const soMarcados = !!r.querySelector("[data-so-marcados]")?.checked;
        let total = 0;
        for (const g of r.querySelectorAll(".epm-cat-grupo")) {
          let visiveis = 0;
          const secaoOk = !this.secao || g.dataset.secao === this.secao;
          for (const li of g.querySelectorAll(".epm-gri-linha")) {
            const ok = secaoOk && (!escola || li.dataset.escola === escola) && (!exec || li.dataset.exec === exec) && (!dano || li.dataset.dano.includes(`|${dano}|`))
              && (!busca || busca.split(/\s+/).every(t => li.dataset.texto.includes(t)))
              && (!soMarcados || li.querySelector(".epm-cat-marca").checked);
            li.hidden = !ok;
            if (ok) visiveis++;
          }
          g.hidden = !visiveis;
          total += visiveis;
        }
        r.querySelector(".epm-gri-vazio").hidden = total > 0;
      };
      const contar = () => {
        let qtd = 0;
        for (const li of r.querySelectorAll(".epm-gri-linha")) {
          const marcado = li.querySelector(".epm-cat-marca").checked;
          li.classList.toggle("marcado", marcado);
          if (marcado) qtd++;
        }
        r.querySelector("[data-qtd]").textContent = String(qtd);
      };
      r.querySelector("[data-busca]")?.addEventListener("input", filtrar);
      for (const s of r.querySelectorAll("[data-filtro-escola], [data-filtro-exec], [data-filtro-dano], [data-so-marcados]")) s.addEventListener("change", filtrar);
      for (const b of r.querySelectorAll("[data-secao-chip]")) b.addEventListener("click", () => {
        this.secao = b.dataset.secaoChip;
        for (const x of r.querySelectorAll("[data-secao-chip]")) { x.classList.toggle("ativo", x === b); x.setAttribute("aria-pressed", String(x === b)); }
        filtrar();
      });
      const lista = r.querySelector(".epm-cat-lista");
      lista?.addEventListener("change", contar);
      lista?.addEventListener("click", ev => {
        const botao = ev.target.closest("[data-abrir]");
        if (!botao) return;
        const li = botao.closest(".epm-gri-linha");
        const det = li.querySelector(".epm-gri-detalhe");
        if (!det.innerHTML) det.innerHTML = descricaoGrimorio(magiaGrimorioPorId(li.dataset.id));
        det.hidden = !det.hidden;
        botao.setAttribute("aria-expanded", String(!det.hidden));
        li.classList.toggle("aberta", !det.hidden);
      });
      const marcadas = () => [...r.querySelectorAll(".epm-gri-linha")].filter(li => li.querySelector(".epm-cat-marca").checked).map(li => li.dataset.id);
      r.querySelector("[data-adicionar]")?.addEventListener("click", async () => {
        const alvo = this.actor ?? game.actors.get(r.querySelector("[data-destino]")?.value);
        if (!alvo) return ui.notifications.warn("Escolha para quem dar.");
        const n = await adicionarDoGrimorio(alvo, marcadas());
        if (n !== undefined) this.render();
      });
      r.querySelector("[data-atualizar]")?.addEventListener("click", () => atualizarDoGrimorio(this.actor));
      r.querySelector("[data-importar]")?.addEventListener("click", async () => {
        const ids = marcadas();
        if (!ids.length) {
          const ok = await foundry.applications.api.DialogV2.confirm({
            window: { title: "Importar o grimório inteiro" },
            content: `<p>Nenhuma magia marcada. Importar as ${GRIMORIO.magias.length} magias do Grimório para a pasta <strong>${PASTA_RAIZ}</strong> da aba Itens? As que já estiverem lá são puladas.</p>`,
            rejectClose: false
          });
          if (!ok) return;
        }
        await importarGrimorioParaOMundo(ids);
      });
      filtrar();
      contar();
    }
  };
}

/** Abre o Grimório para uma ficha (ou, sem ficha, para o Mestre dar ou importar). */
const abertas = new Map();
export function abrirGrimorio({ actor = null, destino = "" } = {}) {
  classe ??= criarClasse();
  const chave = actor?.id ?? "mundo";
  const ja = abertas.get(chave);
  if (ja?.rendered) { ja.bringToFront?.(); return ja; }
  const app = new classe({ actor, destino });
  abertas.set(chave, app);
  return app.render(true);
}
