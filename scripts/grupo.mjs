/**
 * Painel do grupo (só o Mestre): Vida, Mana, Estamina, Sanidade, CA, Exaustão e condições de todos
 * numa janela só, e "Dar aos marcados" para entregar PEv, PT e PH de uma vez.
 */
import { FLAG, CAMINHO, RECURSOS } from "./config.mjs";
import { int } from "./data.mjs";
import { lerAtor } from "./context.mjs";
import { listaPericias } from "./settings.mjs";
import { escapar } from "./helpers.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;
const P = `flags.${FLAG}`;

export class PainelGrupo extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this._marcados = null;
    this._todos = false;
  }

  static DEFAULT_OPTIONS = {
    id: "epm-painel-grupo",
    classes: ["epm", "epm-grupo"],
    window: { title: "Painel do grupo (EPM)", icon: "fa-solid fa-people-group", resizable: true },
    position: { width: 780, height: 640 },
    actions: {
      abrirFicha: function (ev, alvo) { game.actors.get(alvo.dataset.id)?.sheet?.render(true); },
      darPontos: function () { return this._darPontos(); },
      marcarTodos: function () { this._marcados = new Set(this._atores().map(a => a.id)); this.render(); },
      desmarcarTodos: function () { this._marcados = new Set(); this.render(); }
    }
  };

  static PARTS = { corpo: { template: `${CAMINHO}/grupo.hbs`, scrollable: [".epm-grupo-lista"] } };

  _atores() {
    return game.actors.filter(a => a.type === "character" && (this._todos || a.hasPlayerOwner))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  async _prepareContext() {
    const atores = this._atores();
    if (!this._marcados) this._marcados = new Set(atores.map(a => a.id));
    const lista = atores.map(a => {
      try {
        const { ficha, dados } = lerAtor(a, listaPericias());
        const t = dados.transformacao?.ativa ? dados.transformacoes?.[dados.transformacao.ativa] : null;
        const jogadores = game.users.filter(u => !u.isGM && a.testUserPermission(u, "OWNER")).map(u => u.name);
        return {
          id: a.id, name: a.name, img: a.img, nivel: ficha.nivelTotal, arquetipo: dados.arquetipo || "",
          jogadores: jogadores.join(", "), marcado: this._marcados.has(a.id), transformacao: t ? (t.nome || "Transformado") : "",
          recursos: ["pv", "pm", "pe", "ps"].map(id => {
            const r = ficha.recursos[id];
            return { id, abrev: RECURSOS[id].abrev, label: RECURSOS[id].label, cor: RECURSOS[id].cor, value: r.value, max: r.max, temp: r.temp, pct: r.pct, baixo: r.max > 0 && r.pct <= 0.25 };
          }),
          ca: ficha.ca.total, exaustao: ficha.exaustao.nivel, pontos: ficha.pontos,
          condicoes: ficha.condicoesAtivas.slice(0, 10).map(c => ({ label: c.label, icone: c.icone })),
          maisCondicoes: Math.max(0, ficha.condicoesAtivas.length - 10)
        };
      } catch (err) {
        console.warn("EPM | Painel do grupo:", a.name, err);
        return { id: a.id, name: a.name, img: a.img, erro: true, marcado: this._marcados.has(a.id), recursos: [], condicoes: [] };
      }
    });
    return { atores: lista, vazio: !lista.length, todos: this._todos, marcados: lista.filter(a => a.marcado).length };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const raiz = this.element;
    raiz.querySelectorAll("[data-marcar]").forEach(cb => cb.addEventListener("change", () => {
      if (cb.checked) this._marcados.add(cb.dataset.marcar);
      else this._marcados.delete(cb.dataset.marcar);
      const qtd = raiz.querySelector("[data-qtd-marcados]");
      if (qtd) qtd.textContent = String(this._marcados.size);
    }));
    raiz.querySelector("[data-incluir-todos]")?.addEventListener("change", ev => {
      this._todos = ev.target.checked;
      this._marcados = null;
      this.render();
    });
  }

  async _darPontos() {
    const raiz = this.element;
    const valor = nome => int(raiz.querySelector(`[name="${nome}"]`)?.value);
    const ganho = { pev: valor("pev"), pt: valor("pt"), ph: valor("ph") };
    const motivo = String(raiz.querySelector('[name="motivo"]')?.value ?? "").trim();
    if (!ganho.pev && !ganho.pt && !ganho.ph) return ui.notifications.warn("Escreva quantos PEv, PT ou PH dar.");
    const alvos = [...(this._marcados ?? [])].map(id => game.actors.get(id)).filter(Boolean);
    if (!alvos.length) return ui.notifications.warn("Marque pelo menos um personagem.");
    for (const a of alvos) {
      const pontos = a.flags?.[FLAG]?.pontos ?? {};
      const updates = {};
      for (const k of ["pev", "pt", "ph"]) if (ganho[k]) updates[`${P}.pontos.${k}`] = Math.max(0, int(pontos[k]) + ganho[k]);
      await a.update(updates);
    }
    const partes = [["pev", "PEv"], ["pt", "PT"], ["ph", "PH"]].filter(([k]) => ganho[k]).map(([k, r]) => `${ganho[k] > 0 ? "+" : ""}${ganho[k]} ${r}`);
    await ChatMessage.create({
      content: `<div class="epm-chat epm-chat-nota"><p><strong>O Mestre deu</strong> ${escapar(partes.join(", "))} para ${escapar(alvos.map(a => a.name).join(", "))}.${motivo ? `<br><em>${escapar(motivo)}</em>` : ""}</p></div>`
    });
    for (const nome of ["pev", "pt", "ph"]) { const c = raiz.querySelector(`[name="${nome}"]`); if (c) c.value = "0"; }
    ui.notifications.info(`${partes.join(", ")} para ${alvos.length} personagem(ns).`);
  }
}

let painel = null;
let pendente = null;

/** Abre (ou traz para frente) o Painel do grupo. Só o Mestre. */
export function abrirPainelGrupo() {
  if (!game.user.isGM) return ui.notifications.warn("O Painel do grupo é do Mestre.");
  painel ??= new PainelGrupo();
  return painel.render(true);
}

/** Redesenha o painel aberto quando algo muda nos personagens (com um pequeno atraso para juntar mudanças). */
export function atualizarPainelGrupo() {
  if (!painel?.rendered) return;
  clearTimeout(pendente);
  pendente = setTimeout(() => painel?.rendered && painel.render(), 250);
}

/** Botão "Painel do grupo" no topo da aba de Atores (só o Mestre). */
export function botaoNoDiretorio(app, html) {
  if (!game.user.isGM) return;
  const raiz = html instanceof HTMLElement ? html : html?.[0];
  if (!raiz || raiz.querySelector(".epm-botao-grupo")) return;
  const alvo = raiz.querySelector(".header-actions") ?? raiz.querySelector(".directory-header");
  if (!alvo) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "epm-botao-grupo";
  b.innerHTML = '<i class="fa-solid fa-people-group" aria-hidden="true"></i> Painel do grupo';
  b.addEventListener("click", ev => { ev.preventDefault(); abrirPainelGrupo(); });
  alvo.append(b);
}
