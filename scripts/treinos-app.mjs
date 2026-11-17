/**
 * Catálogo de treinamentos (botão "Adicionar da lista" na aba Treinamentos): categorias, busca sem acento,
 * filtro "só os que eu cumpro", cadeia de pré-requisitos e o que cada treino libera.
 * Carregado sob demanda, só dentro do Foundry.
 */
import { FLAG } from "./config.mjs";
import { escapar } from "./helpers.mjs";
import {
  CATEGORIAS_TREINOS, TREINAMENTOS_LISTA, REGRAS_TREINO, treinoModelo, cadeiaTreino, textoRequisitos, cumpreRequisitos, baseRequisitos, normTreino
} from "./treinamentos-lista.mjs";

const semAcento = t => normTreino(t);
const tempoCurto = h => h >= 240 && h % 240 === 0 ? `${h / 240} ${h === 240 ? "mês" : "meses"}` : h >= 56 && h % 56 === 0 ? `${h / 56} semana${h === 56 ? "" : "s"}` : h >= 24 && h % 8 === 0 && h > 48 ? `${h / 8} dias` : `${h} h`;
const ROTULO_ESTADO = { planejado: "planejado", andamento: "em andamento", concluido: "concluído" };

/** Treinos da ficha por modelo: { id: estado }. */
function naFicha(actor) {
  const out = {};
  for (const t of Object.values(actor?.flags?.[FLAG]?.treinamentos ?? {})) {
    if (!t) continue;
    const id = t.modelo || TREINAMENTOS_LISTA.find(e => normTreino(e.nome) === normTreino(t.nome))?.id;
    if (!id) continue;
    if (!out[id] || t.estado === "concluido" || (t.estado === "andamento" && out[id] === "planejado")) out[id] = t.estado ?? "planejado";
  }
  return out;
}

let classe = null;
function criarClasse() {
  const { ApplicationV2 } = foundry.applications.api;
  return class CatalogoTreinos extends ApplicationV2 {
    constructor({ actor }) {
      super({ id: `epm-treinos-${actor?.id ?? "x"}` });
      this.actor = actor;
      this.categoria = "";
      this.soCumpro = false;
    }

    static DEFAULT_OPTIONS = {
      classes: ["epm", "epm-catalogo", "epm-treinos-catalogo"],
      window: { title: "Catálogo de treinamentos", icon: "fa-solid fa-dumbbell", resizable: true },
      position: { width: 880, height: 760 }
    };

    get title() { return `Treinamentos · ${this.actor?.name ?? ""}`; }

    async _renderHTML() {
      const raiz = document.createElement("div");
      raiz.className = "epm-catalogo-corpo";
      const { estadoAtor } = await import("./mecanicas.mjs");
      const { ficha, dados } = estadoAtor(this.actor);
      const { maestriaDoItem } = await import("./maestria-exotica.mjs");
      const base = baseRequisitos(dados, { temExotica: this.actor.items.some(i => i.type === "weapon" && !!maestriaDoItem(i)) });
      const tem = naFicha(this.actor);
      const grupos = CATEGORIAS_TREINOS.map(cat => {
        const lista = TREINAMENTOS_LISTA.filter(e => e.categoria === cat.id);
        if (!lista.length) return "";
        const linhas = lista.map(e => {
          const rq = cumpreRequisitos(e, ficha, base);
          const estado = tem[e.id];
          const cadeia = cadeiaTreino(e.id);
          const libera = e.libera.map(id => treinoModelo(id)?.nome).filter(Boolean);
          const bloqueado = !!estado && !e.repetivel;
          const auto = [e.auto?.mods?.length || e.auto?.especial ? "efeito automático" : "", e.auto?.acoes?.length ? "vira habilidade" : "", e.auto?.texto ? "o Mestre decide" : ""].filter(Boolean);
          return `<li class="epm-tre-linha${rq.ok ? " cumpre" : " falta"}${estado ? " na-ficha" : ""}" data-id="${e.id}" data-cumpre="${rq.ok ? 1 : 0}"
              data-texto="${escapar(semAcento(`${e.nome} ${e.beneficios} ${textoRequisitos(e)} ${cat.label}`))}">
            <input type="checkbox" class="epm-cat-marca" aria-label="Marcar ${escapar(e.nome)}" ${bloqueado ? `disabled title="Já está na ficha"` : ""}>
            <button type="button" class="epm-gri-nome" data-abrir aria-expanded="false">${escapar(e.nome)}${e.repetivel ? ' <span class="epm-tag">repetível</span>' : ""}${estado ? ` <span class="epm-tag">${ROTULO_ESTADO[estado] ?? estado}</span>` : ""}</button>
            <span class="epm-tre-num" title="Tempo">${escapar(tempoCurto(e.horas))}</span>
            <span class="epm-tre-num" title="Pontos de Treinamento">${e.pt} PT</span>
            <span class="epm-tre-req ${rq.ok ? "ok" : "falta"}" title="${escapar(rq.ok ? `Cumpre: ${rq.cumpridos.join(", ") || "sem requisitos"}` : `Falta: ${rq.faltas.join("; ")}`)}"><i class="fa-solid ${rq.ok ? "fa-check" : "fa-xmark"}" aria-hidden="true"></i> ${escapar(textoRequisitos(e))}</span>
            <span class="epm-tre-treinador" title="${escapar(e.tipoTreinador || (e.precisaTreinador ? "Precisa de treinador" : "Não precisa de treinador"))}">${e.precisaTreinador ? '<i class="fa-solid fa-chalkboard-user" aria-hidden="true"></i>' : ""}</span>
            <div class="epm-gri-detalhe" hidden>
              <p>${escapar(e.beneficios)}</p>
              ${cadeia.length > 1 ? `<p class="epm-dica"><strong>Cadeia:</strong> ${cadeia.map(id => escapar(treinoModelo(id)?.nome ?? id)).join(" → ")}</p>` : ""}
              ${libera.length ? `<p class="epm-dica"><strong>Libera:</strong> ${libera.map(escapar).join(", ")}</p>` : ""}
              ${rq.faltas.length ? `<p class="epm-requisito-falta"><i class="fa-solid fa-xmark" aria-hidden="true"></i> Falta: ${escapar(rq.faltas.join("; "))}</p>` : ""}
              ${rq.manuais.length ? `<p class="epm-dica">Confira com o Mestre: ${escapar(rq.manuais.join("; "))}</p>` : ""}
              ${e.precisaTreinador ? `<p class="epm-dica">Precisa de treinador${e.tipoTreinador ? ` (${escapar(e.tipoTreinador)})` : ""}.</p>` : ""}
              ${auto.length ? `<p class="epm-dica">Na ficha: ${escapar(auto.join(", "))}.</p>` : ""}
              <button type="button" class="epm-botao epm-botao-mini" data-adicionar-um="${e.id}" ${bloqueado ? "disabled" : ""}><i class="fa-solid fa-plus"></i> Adicionar</button>
            </div>
          </li>`;
        }).join("");
        return `<section class="epm-cat-grupo" data-categoria="${cat.id}"><h4><i class="${cat.icone}" aria-hidden="true"></i> ${escapar(cat.label)} <small>(${lista.length})</small></h4><p class="epm-dica">${escapar(cat.dica)}</p><ul>${linhas}</ul></section>`;
      }).join("");
      const chips = [{ id: "", label: "Todas" }, ...CATEGORIAS_TREINOS].map(c =>
        `<button type="button" class="epm-gri-chip${c.id === this.categoria ? " ativo" : ""}" data-cat-chip="${c.id}" aria-pressed="${c.id === this.categoria}">${escapar(c.label)}</button>`).join("");
      raiz.innerHTML = `
        <details class="epm-tre-regras"><summary>Regras de treinamento</summary><ul>${REGRAS_TREINO.map(r => `<li>${escapar(r)}</li>`).join("")}</ul></details>
        <div class="epm-cat-filtros">
          <input type="search" class="epm-busca" data-busca placeholder="Buscar treinamento (nome, efeito, requisito…)" aria-label="Buscar">
          <label class="epm-check"><input type="checkbox" data-so-cumpro ${this.soCumpro ? "checked" : ""}> Só os que eu cumpro</label>
        </div>
        <div class="epm-gri-chips" role="group" aria-label="Categoria">${chips}</div>
        <div class="epm-cat-lista">${grupos}<p class="epm-dica epm-gri-vazio" hidden>Nenhum treinamento com esses filtros.</p></div>
        <footer class="epm-cat-rodape">
          <span class="epm-cat-total">Marcados: <strong data-qtd>0</strong></span>
          <span class="epm-cat-botoes"><button type="button" class="epm-botao epm-botao-forte" data-adicionar><i class="fa-solid fa-plus"></i> Adicionar à ficha</button></span>
        </footer>`;
      return raiz;
    }

    _replaceHTML(result, content) { content.replaceChildren(result); }

    _onRender(context, options) {
      super._onRender?.(context, options);
      const r = this.element;
      const filtrar = () => {
        const busca = semAcento(r.querySelector("[data-busca]")?.value);
        this.soCumpro = !!r.querySelector("[data-so-cumpro]")?.checked;
        let total = 0;
        for (const g of r.querySelectorAll(".epm-cat-grupo")) {
          let visiveis = 0;
          const catOk = !this.categoria || g.dataset.categoria === this.categoria;
          for (const li of g.querySelectorAll(".epm-tre-linha")) {
            const ok = catOk && (!this.soCumpro || li.dataset.cumpre === "1") && (!busca || busca.split(/\s+/).every(t => li.dataset.texto.includes(t)));
            li.hidden = !ok;
            if (ok) visiveis++;
          }
          g.hidden = !visiveis;
          total += visiveis;
        }
        r.querySelector(".epm-gri-vazio").hidden = total > 0;
      };
      const contar = () => {
        const qtd = [...r.querySelectorAll(".epm-tre-linha .epm-cat-marca")].filter(c => c.checked).length;
        r.querySelector("[data-qtd]").textContent = String(qtd);
      };
      r.querySelector("[data-busca]")?.addEventListener("input", filtrar);
      r.querySelector("[data-so-cumpro]")?.addEventListener("change", filtrar);
      for (const b of r.querySelectorAll("[data-cat-chip]")) b.addEventListener("click", () => {
        this.categoria = b.dataset.catChip;
        for (const x of r.querySelectorAll("[data-cat-chip]")) { x.classList.toggle("ativo", x === b); x.setAttribute("aria-pressed", String(x === b)); }
        filtrar();
      });
      r.querySelector(".epm-cat-lista")?.addEventListener("change", contar);
      for (const b of r.querySelectorAll("[data-abrir]")) b.addEventListener("click", () => {
        const det = b.closest("li").querySelector(".epm-gri-detalhe");
        det.hidden = !det.hidden;
        b.setAttribute("aria-expanded", String(!det.hidden));
      });
      const adicionar = async ids => {
        const { treinoDoCatalogo } = await import("./ficha-060.mjs");
        let n = 0;
        for (const id of ids) if (await treinoDoCatalogo(this.actor, id, { silencioso: true })) n++;
        if (n) ui.notifications.info(`${this.actor.name}: ${n} treinamento(s) adicionado(s) (planejados).`);
        this.render();
      };
      for (const b of r.querySelectorAll("[data-adicionar-um]")) b.addEventListener("click", () => adicionar([b.dataset.adicionarUm]));
      r.querySelector("[data-adicionar]")?.addEventListener("click", () => {
        const ids = [...r.querySelectorAll(".epm-tre-linha")].filter(li => li.querySelector(".epm-cat-marca").checked).map(li => li.dataset.id);
        if (!ids.length) return ui.notifications.warn("Marque pelo menos um treinamento.");
        return adicionar(ids);
      });
      filtrar();
    }
  };
}

/** Abre o catálogo para uma ficha. */
export function abrirCatalogoTreinos(actor) {
  classe ??= criarClasse();
  const app = new classe({ actor });
  app.render(true);
  return app;
}
