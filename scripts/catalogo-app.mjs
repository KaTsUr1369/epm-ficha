/**
 * Janela do Catálogo de itens: busca, filtros por categoria e região, quantidade, total em moedas,
 * "pagar com as moedas da ficha" e, para o Mestre, "importar para o mundo" (pasta de Itens).
 * Carregada sob demanda (import dinâmico), só dentro do Foundry.
 */
import { FLAG, RARIDADES_ITEM } from "./config.mjs";
import { int, pagarMoedas, valorEmCobre } from "./data.mjs";
import { escapar } from "./helpers.mjs";
import {
  ITENS_CATALOGO, CATEGORIAS_CATALOGO, REGIOES_CATALOGO, itemCatalogoPorId, resumoCatalogo, precoEmCobre, precoTexto, moedasTexto,
  dadosItemCatalogo, empilha
} from "./itens-catalogo.mjs";
import { imagemPadrao, imagemItem } from "./itens-imagens.mjs";
import { artesSalvas } from "./compendio-itens.mjs";

const imgDe = x => imagemItem(x, artesSalvas());

const P = `flags.${FLAG}`;
const PASTA_RAIZ = "EPM · Catálogo de itens";
const semAcento = t => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Cria os itens escolhidos na ficha (empilhando consumíveis e materiais) e, se pedir, paga com as moedas dela. */
export async function adicionarDoCatalogo(actor, escolhas, { pagar = false } = {}) {
  if (!actor?.isOwner) return ui.notifications.warn("Você não pode mexer nesta ficha.");
  const lista = escolhas.map(({ id, qtd }) => ({ x: itemCatalogoPorId(id), qtd: Math.max(1, int(qtd, 1)) })).filter(e => e.x);
  if (!lista.length) return ui.notifications.warn("Marque pelo menos um item.");
  const total = lista.reduce((s, e) => s + precoEmCobre(e.x) * e.qtd, 0);
  const upd = {};
  if (pagar && total) {
    const novas = pagarMoedas(actor.flags?.[FLAG]?.moedas ?? {}, total);
    if (!novas) return ui.notifications.warn(`Moedas insuficientes: custa ${moedasTexto(total)} e ${actor.name} tem ${moedasTexto(valorEmCobre(actor.flags?.[FLAG]?.moedas ?? {}))}.`);
    upd[`${P}.moedas`] = novas;
  }
  const criar = [];
  const somar = [];
  for (const { x, qtd } of lista) {
    const existente = empilha(x) ? actor.items.find(i => i.flags?.[FLAG]?.catalogo === x.id) : null;
    if (existente) somar.push({ _id: existente.id, "system.quantity": int(existente.system?.quantity, 1) + qtd * (x.pacote || 1) });
    else if (["weapon", "equipment", "container", "tool"].includes(x.tipo)) for (let i = 0; i < qtd; i++) criar.push(dadosItemCatalogo(x, { qtd: 1, flag: FLAG, img: imgDe(x) }));
    else criar.push(dadosItemCatalogo(x, { qtd, flag: FLAG, img: imgDe(x) }));
  }
  if (Object.keys(upd).length) await actor.update(upd);
  if (somar.length) await actor.updateEmbeddedDocuments("Item", somar);
  if (criar.length) await actor.createEmbeddedDocuments("Item", criar);
  const nomes = lista.map(e => `${e.qtd > 1 ? `${e.qtd}× ` : ""}${e.x.nome}`).join(", ");
  if (pagar && total) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="epm-chat epm-chat-nota"><p><strong>${escapar(actor.name)}</strong> comprou ${escapar(nomes)} por <strong>${escapar(moedasTexto(total))}</strong>.</p></div>`
    });
  }
  ui.notifications.info(`${actor.name}: ${nomes}.`);
}

/** Cria (ou completa) a pasta do catálogo no mundo, com uma subpasta por categoria. Só o Mestre. */
export async function importarParaOMundo(ids = null) {
  if (!game.user.isGM) return ui.notifications.warn("Só o Mestre importa para o mundo.");
  const lista = (ids?.length ? ids.map(itemCatalogoPorId).filter(Boolean) : ITENS_CATALOGO);
  const Pasta = foundry.documents?.Folder ?? globalThis.Folder;
  let raiz = game.folders.find(f => f.type === "Item" && f.name === PASTA_RAIZ && !f.folder);
  raiz ??= await Pasta.create({ name: PASTA_RAIZ, type: "Item", color: "#5b3f8c" });
  const pastas = {};
  for (const c of CATEGORIAS_CATALOGO) {
    if (!lista.some(x => x.categoria === c.id)) continue;
    pastas[c.id] = game.folders.find(f => f.type === "Item" && f.name === c.label && f.folder?.id === raiz.id)
      ?? await Pasta.create({ name: c.label, type: "Item", folder: raiz.id });
  }
  const jaTem = new Set(game.items.filter(i => i.flags?.[FLAG]?.catalogo).map(i => i.flags[FLAG].catalogo));
  const docs = lista.filter(x => !jaTem.has(x.id)).map(x => ({ ...dadosItemCatalogo(x, { qtd: 1, flag: FLAG, img: imgDe(x) }), folder: pastas[x.categoria]?.id }));
  if (!docs.length) return ui.notifications.info("Esses itens já estão no mundo.");
  for (let i = 0; i < docs.length; i += 100) await Item.createDocuments(docs.slice(i, i + 100));
  ui.notifications.info(`${docs.length} item(ns) importado(s) para a pasta "${PASTA_RAIZ}".`);
}

let classe = null;
function criarClasse() {
  const { ApplicationV2 } = foundry.applications.api;
  return class CatalogoItens extends ApplicationV2 {
    constructor({ actor = null, destino = "" } = {}) {
      super({ id: `epm-catalogo-${actor?.id ?? "mundo"}` });
      this.actor = actor;
      this.destino = destino;
    }

    static DEFAULT_OPTIONS = {
      classes: ["epm", "epm-catalogo"],
      window: { title: "Catálogo de itens", icon: "fa-solid fa-book-open", resizable: true },
      position: { width: 860, height: 760 }
    };

    get title() { return this.actor ? `Catálogo de itens · ${this.actor.name}` : "Catálogo de itens"; }

    async _renderHTML() {
      const raiz = document.createElement("div");
      raiz.className = "epm-catalogo-corpo";
      const opt = (v, l) => `<option value="${escapar(v)}">${escapar(l)}</option>`;
      const variasRegioes = Object.keys(REGIOES_CATALOGO).length > 1;
      const destinos = this.actor ? [] : game.actors.filter(a => a.isOwner && a.flags?.[FLAG]).sort((a, b) => Number(b.type === "character") - Number(a.type === "character") || a.name.localeCompare(b.name, "pt-BR"));
      const grupos = CATEGORIAS_CATALOGO.map(c => {
        const itens = ITENS_CATALOGO.filter(x => x.categoria === c.id);
        if (!itens.length) return "";
        const linhas = itens.map(x => {
          const r = RARIDADES_ITEM[x.raridade] ?? RARIDADES_ITEM.comum;
          const texto = semAcento(`${x.nome} ${resumoCatalogo(x)} ${REGIOES_CATALOGO[x.regiao] ?? ""}`);
          return `<li class="epm-cat-linha${variasRegioes ? "" : " sem-regiao"}" data-id="${x.id}" data-regiao="${x.regiao}" data-texto="${escapar(texto)}">
            <input type="checkbox" class="epm-cat-marca" aria-label="Marcar ${escapar(x.nome)}">
            <input type="number" class="epm-cat-qtd" min="1" value="1" aria-label="Quantidade" title="Quantidade${x.pacote > 1 ? ` (cada uma vem com ${x.pacote})` : ""}">
            <span class="epm-cat-nome" style="--cor:${r.cor}" title="${escapar(r.label)}"><img class="epm-cat-img" src="${escapar(imgDe(x))}" alt="" loading="lazy">${escapar(x.nome)}${x.pacote > 1 ? ` <small>×${x.pacote}</small>` : ""}</span>
            <span class="epm-cat-resumo">${escapar(resumoCatalogo(x))}</span>
            ${variasRegioes ? `<span class="epm-cat-regiao" title="Nível de tecnologia">${escapar(REGIOES_CATALOGO[x.regiao] ?? "")}</span>` : ""}
            <span class="epm-cat-preco" data-cobre="${precoEmCobre(x)}">${escapar(precoTexto(x))}</span>
            <span class="epm-cat-peso">${Number(x.peso).toLocaleString("pt-BR")} kg</span>
          </li>`;
        }).join("");
        return `<section class="epm-cat-grupo" data-cat="${c.id}"><h4><i class="${c.icone}"></i> ${escapar(c.label)} <small>(${itens.length})</small></h4><ul>${linhas}</ul></section>`;
      }).join("");
      const categorias = CATEGORIAS_CATALOGO.filter(c => ITENS_CATALOGO.some(x => x.categoria === c.id));
      raiz.innerHTML = `
        <div class="epm-cat-filtros">
          <input type="search" class="epm-busca" data-busca placeholder="Buscar item (nome, dano, efeito…)" aria-label="Buscar">
          <select data-filtro-cat aria-label="Categoria">${opt("", "Todas as categorias")}${categorias.map(c => opt(c.id, c.label)).join("")}</select>
          ${variasRegioes ? `<select data-filtro-regiao aria-label="Região">${opt("", "Todas as regiões")}${Object.entries(REGIOES_CATALOGO).map(([k, l]) => opt(k, l)).join("")}</select>` : `<span class="epm-tag" title="Briavoterna e Genesis entram depois da revisão">${escapar(Object.values(REGIOES_CATALOGO).join(", "))}</span>`}
          <label class="epm-check"><input type="checkbox" data-so-marcados> Só os marcados</label>
        </div>
        <div class="epm-cat-lista">${grupos}</div>
        <footer class="epm-cat-rodape">
          <span class="epm-cat-total">Marcados: <strong data-qtd>0</strong> · Total: <strong data-total>0 PC</strong></span>
          ${this.actor ? `<label class="epm-check" title="Desconta o total das moedas da ficha (com troco)"><input type="checkbox" data-pagar> Pagar com as moedas de ${escapar(this.actor.name)}</label>` : ""}
          ${!this.actor && destinos.length ? `<label class="epm-campo epm-cat-destino"><span>Dar para</span><select data-destino>${destinos.map(a => `<option value="${a.id}" ${a.id === this.destino ? "selected" : ""}>${escapar(a.name)}</option>`).join("")}</select></label>` : ""}
          <span class="epm-cat-botoes">
            ${this.actor || destinos.length ? `<button type="button" class="epm-botao epm-botao-forte" data-adicionar><i class="fa-solid fa-plus"></i> ${this.actor ? "Adicionar à ficha" : "Dar"}</button>` : ""}
            ${game.user.isGM ? `<button type="button" class="epm-botao" data-importar title="Cria os itens numa pasta da aba Itens (sem marcar nada: o catálogo inteiro)"><i class="fa-solid fa-folder-plus"></i> Importar para o mundo</button>` : ""}
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
        const cat = r.querySelector("[data-filtro-cat]")?.value ?? "";
        const reg = r.querySelector("[data-filtro-regiao]")?.value ?? "";
        const soMarcados = !!r.querySelector("[data-so-marcados]")?.checked;
        for (const g of r.querySelectorAll(".epm-cat-grupo")) {
          let visiveis = 0;
          for (const li of g.querySelectorAll(".epm-cat-linha")) {
            const ok = (!cat || g.dataset.cat === cat) && (!reg || li.dataset.regiao === reg)
              && (!busca || busca.split(/\s+/).every(t => li.dataset.texto.includes(t)))
              && (!soMarcados || li.querySelector(".epm-cat-marca").checked);
            li.hidden = !ok;
            if (ok) visiveis++;
          }
          g.hidden = !visiveis;
        }
      };
      const totalizar = () => {
        let qtd = 0, cobre = 0;
        for (const li of r.querySelectorAll(".epm-cat-linha")) {
          const marcado = li.querySelector(".epm-cat-marca").checked;
          li.classList.toggle("marcado", marcado);
          if (!marcado) continue;
          const n = Math.max(1, int(li.querySelector(".epm-cat-qtd").value, 1));
          qtd += n;
          cobre += int(li.querySelector(".epm-cat-preco").dataset.cobre) * n;
        }
        r.querySelector("[data-qtd]").textContent = String(qtd);
        r.querySelector("[data-total]").textContent = moedasTexto(cobre);
      };
      r.querySelector("[data-busca]")?.addEventListener("input", filtrar);
      for (const s of r.querySelectorAll("[data-filtro-cat], [data-filtro-regiao], [data-so-marcados]")) s.addEventListener("change", filtrar);
      r.querySelector(".epm-cat-lista")?.addEventListener("change", ev => {
        if (ev.target.matches(".epm-cat-qtd")) ev.target.closest(".epm-cat-linha").querySelector(".epm-cat-marca").checked = true;
        totalizar();
      });
      const escolhas = () => [...r.querySelectorAll(".epm-cat-linha")].filter(li => li.querySelector(".epm-cat-marca").checked)
        .map(li => ({ id: li.dataset.id, qtd: int(li.querySelector(".epm-cat-qtd").value, 1) }));
      const limpar = () => { for (const c of r.querySelectorAll(".epm-cat-marca")) c.checked = false; totalizar(); filtrar(); };
      r.querySelector("[data-adicionar]")?.addEventListener("click", async () => {
        const alvo = this.actor ?? game.actors.get(r.querySelector("[data-destino]")?.value);
        if (!alvo) return ui.notifications.warn("Escolha para quem dar.");
        await adicionarDoCatalogo(alvo, escolhas(), { pagar: !!r.querySelector("[data-pagar]")?.checked });
        limpar();
      });
      r.querySelector("[data-importar]")?.addEventListener("click", async () => {
        const ids = escolhas().map(e => e.id);
        if (!ids.length) {
          const ok = await foundry.applications.api.DialogV2.confirm({
            window: { title: "Importar o catálogo inteiro" },
            content: `<p>Nenhum item marcado. Importar os ${ITENS_CATALOGO.length} itens do catálogo para a pasta <strong>${PASTA_RAIZ}</strong> da aba Itens? Os que já estiverem lá são pulados.</p>`,
            rejectClose: false
          });
          if (!ok) return;
        }
        await importarParaOMundo(ids);
        limpar();
      });
      totalizar();
    }
  };
}

/** Abre o catálogo para uma ficha (ou, sem ficha, para o Mestre dar ou importar). */
const abertas = new Map();
export function abrirCatalogo({ actor = null, destino = "" } = {}) {
  classe ??= criarClasse();
  const chave = actor?.id ?? "mundo";
  const ja = abertas.get(chave);
  if (ja?.rendered) { ja.bringToFront?.(); return ja; }
  const app = new classe({ actor, destino });
  abertas.set(chave, app);
  return app.render(true);
}
