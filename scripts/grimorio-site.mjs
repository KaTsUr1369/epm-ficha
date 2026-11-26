/**
 * Grimório do Multiverso dentro do Foundry (0.9.3): o site (GitHub Pages) aberto numa janela.
 *  - Arrastar um cartão do site (magia, ritual, habilidade de exemplo ou a habilidade montada no criador) para a ficha
 *    adiciona na ficha (o drop chega em actor-sheet._onDrop com { type: "EPMGrimorio", … }).
 *  - Clicar em "Adicionar à ficha" no site manda uma mensagem (postMessage) para o Foundry, que adiciona na ficha
 *    de quem abriu a janela (ou no token selecionado / personagem atribuído).
 * Formato do que vem do site:
 *   { type: "EPMGrimorio", kind: "magia", id, nome }                       magia ou ritual do Grimório
 *   { type: "EPMGrimorio", kind: "exemplo", nome, receita }                 habilidade de exemplo (aprender)
 *   { type: "EPMGrimorio", kind: "criada", nome, receita, registro }        montada no criador do site (vira projeto)
 */
import { FLAG } from "./config.mjs";
import { escapar } from "./helpers.mjs";
import { normalizarTexto } from "./data.mjs";
import { GRIMORIO_URL } from "./grimorio.mjs";

export function urlSite() {
  try { return String(game.settings.get(FLAG, "grimorioSite") || GRIMORIO_URL); } catch { return GRIMORIO_URL; }
}
const origemSite = () => { try { return new URL(urlSite()).origin; } catch { return ""; } };

/** Ficha que recebe quando a janela não foi aberta por uma ficha. */
function alvoPadrao() {
  return canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
}

/** Adiciona na ficha o que veio do site (arrastado ou clicado). */
export async function adicionarDoSite(actor, d = {}) {
  if (!actor) return ui.notifications.warn("Abra o Grimório pela ficha, selecione o seu token ou tenha um personagem atribuído.");
  if (!actor.isOwner) return ui.notifications.warn(`Você não pode mexer na ficha de ${actor.name}.`);
  if (d.kind === "magia" && d.id) {
    const G = await import("./grimorio-app.mjs");
    if (!G.magiaGrimorioPorId(d.id)) return ui.notifications.warn(`"${d.nome ?? d.id}" não está no Grimório desta versão do módulo.`);
    return G.adicionarDoGrimorio(actor, [d.id]);
  }
  const H = await import("./habilidades-ui.mjs");
  let receita = d.receita ?? null;
  if (d.kind === "exemplo") {
    const { HABILIDADES_EXEMPLO } = await import("./habilidades-exemplos.mjs");
    receita = HABILIDADES_EXEMPLO.find(h => normalizarTexto(h.nome) === normalizarTexto(d.nome)) ?? receita;
  }
  if (receita?.tecnicas?.length) {
    if (receita.categoria === "unicaInicial") {
      if (!game.user.isGM) return ui.notifications.warn("A Habilidade Única Inicial é montada pelo Mestre (questionário na aba Habilidades).");
      return H.montarHui(actor, { receita });
    }
    if (d.kind === "criada") {
      // Criada no site: abre o criador da ficha com a receita (o jogador confere e vira projeto, com PH e horas)
      const r = await H.abrirCriador(actor, { categoria: receita.categoria, receita });
      if (!r) return null;
      return H.gravarProjeto(actor, r.receita, r.conta, { modo: "criar" });
    }
    const data = H.dadosItemDaReceita(receita);
    const temp = new Item.implementation(data);
    const M = await import("./mecanicas.mjs");
    return M.aprenderPorArraste(actor, temp);
  }
  if (d.registro) {
    const T = await import("./habilidade-texto.mjs");
    const [criado] = await actor.createEmbeddedDocuments("Item", [T.dadosHabilidadeTexto(d.registro)]);
    if (criado) ui.notifications.info(`${actor.name}: ${criado.name} adicionada pelo texto do Grimório.`);
    return criado;
  }
  return ui.notifications.warn("Não reconheci o que veio do Grimório do Multiverso.");
}

/* ------------------------------------------------------------ */
/*  Janela com o site                                           */
/* ------------------------------------------------------------ */

const abertas = new Set();
let classe = null;
function criarClasse() {
  const { ApplicationV2 } = foundry.applications.api;
  return class GrimorioSite extends ApplicationV2 {
    constructor({ actor = null, aba = "habilidades" } = {}) {
      super({ id: `epm-grimorio-site-${actor?.id ?? "geral"}` });
      this.actor = actor;
      this.aba = aba;
    }

    static DEFAULT_OPTIONS = {
      classes: ["epm", "epm-grimorio-site"],
      window: { title: "Grimório do Multiverso", icon: "fa-solid fa-book-skull", resizable: true },
      position: { width: 1180, height: 860 }
    };

    get title() { return this.actor ? `Grimório do Multiverso · ${this.actor.name}` : "Grimório do Multiverso"; }

    async _renderHTML() {
      const raiz = document.createElement("div");
      raiz.className = "epm-grimorio-site-corpo";
      const url = new URL(urlSite());
      url.searchParams.set("foundry", "1");
      if (this.actor) url.searchParams.set("ficha", this.actor.name);
      url.hash = this.aba;
      raiz.innerHTML = `
        <iframe src="${escapar(url.href)}" title="Grimório do Multiverso" allow="clipboard-write" referrerpolicy="no-referrer"></iframe>
        <p class="epm-dica epm-grimorio-site-rodape">
          Arraste um cartão para a ficha${this.actor ? ` de <strong>${escapar(this.actor.name)}</strong>` : ""} ou clique em <strong>Adicionar à ficha</strong>.
          ${this.actor ? "" : "Sem ficha aberta, vai para o token selecionado ou para o seu personagem."}
          <a class="epm-link" href="${escapar(urlSite())}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir no navegador</a>
        </p>`;
      return raiz;
    }

    _replaceHTML(result, content) { content.replaceChildren(result); }

    _onRender(context, options) {
      super._onRender?.(context, options);
      this.iframe = this.element.querySelector("iframe");
      abertas.add(this);
    }

    _onClose(options) {
      abertas.delete(this);
      return super._onClose?.(options);
    }
  };
}

/** Mensagens do site ("Adicionar à ficha"): só aceitas do endereço configurado. */
async function aoMensagem(ev) {
  const d = ev.data;
  if (!d || d.type !== "EPMGrimorio" || ev.origin !== origemSite()) return;
  const app = [...abertas].find(a => a.iframe?.contentWindow === ev.source);
  const actor = app?.actor ?? alvoPadrao();
  let ok = false;
  try { ok = !!(await adicionarDoSite(actor, d)); } catch (err) { console.error("EPM | Grimório do Multiverso", err); }
  try {
    ev.source?.postMessage({ type: "EPMGrimorioResposta", ok, texto: ok ? `${d.nome ?? "Pronto"} → ${actor?.name ?? ""}` : "Veja o aviso no Foundry." }, ev.origin);
  } catch { /* a janela pode ter fechado */ }
}
let ouvindo = false;

/** Abre o site numa janela do Foundry (por ficha, ou geral para o Mestre). */
export function abrirSiteGrimorio({ actor = null, aba = "habilidades" } = {}) {
  if (!ouvindo) { window.addEventListener("message", aoMensagem); ouvindo = true; }
  classe ??= criarClasse();
  const ja = [...abertas].find(a => (a.actor?.id ?? null) === (actor?.id ?? null));
  if (ja?.rendered) { ja.bringToFront?.(); return ja; }
  return new classe({ actor, aba }).render(true);
}
