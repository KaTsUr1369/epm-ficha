/**
 * Catálogo de talentos (botão "Adicionar da lista" na sub-aba Talentos): categorias, faixas, busca sem acento,
 * filtro "só os que eu cumpro" (requisitos e nível total), cadeia de pré-requisitos e o que cada talento libera.
 * Carregado sob demanda, só dentro do Foundry.
 */
import { FLAG } from "./config.mjs";
import { escapar } from "./helpers.mjs";
import { normTreino, baseRequisitos } from "./treinamentos-lista.mjs";
import {
  CATEGORIAS_TALENTOS, FAIXAS_TALENTO, FREQUENCIAS_TALENTO, TALENTOS_LISTA, REGRAS_TALENTO, talentoModelo, cadeiaTalento,
  textoRequisitosTalento, cumpreTalento, talentosAtivos, situacaoTalentos
} from "./talentos-lista.mjs";

/** O que os requisitos dos talentos precisam saber da ficha. */
export async function baseTalentos(actor) {
  const { estadoAtor } = await import("./mecanicas.mjs");
  const { idArquetipo } = await import("./regras-extras.mjs");
  const { ficha, dados } = estadoAtor(actor);
  const ativos = talentosAtivos(dados);
  const nivelTotal = Math.max(1, Math.floor(Number(ficha.nivelTotal) || 1));
  return {
    ficha, dados,
    base: {
      nivelTotal,
      arquetipos: new Set([idArquetipo(dados.arquetipo), idArquetipo(dados.arquetipo2)].filter(Boolean)),
      talentos: new Set(ativos.map(x => x.modelo?.id).filter(Boolean)),
      treinosConcluidos: baseRequisitos(dados).concluidos,
      escudo: null
    }
  };
}

let classe = null;
function criarClasse() {
  const { ApplicationV2 } = foundry.applications.api;
  return class CatalogoTalentos extends ApplicationV2 {
    constructor({ actor }) {
      super({ id: `epm-talentos-${actor?.id ?? "x"}` });
      this.actor = actor;
      this.categoria = "";
      this.faixa = "";
      this.soCumpro = false;
    }

    static DEFAULT_OPTIONS = {
      classes: ["epm", "epm-catalogo", "epm-treinos-catalogo", "epm-talentos-catalogo"],
      window: { title: "Catálogo de talentos", icon: "fa-solid fa-star", resizable: true },
      position: { width: 880, height: 760 }
    };

    get title() { return `Talentos · ${this.actor?.name ?? ""}`; }

    async _renderHTML() {
      const raiz = document.createElement("div");
      raiz.className = "epm-catalogo-corpo";
      const { ficha, dados, base } = await baseTalentos(this.actor);
      const sit = situacaoTalentos(dados, base.nivelTotal);
      const grupos = CATEGORIAS_TALENTOS.map(cat => {
        const lista = TALENTOS_LISTA.filter(e => e.categoria === cat.id);
        if (!lista.length) return "";
        const linhas = lista.map(e => {
          const rq = cumpreTalento(e, ficha, base);
          const naFicha = base.talentos.has(e.id);
          const bloqueado = naFicha && !e.repetivel;
          const fx = FAIXAS_TALENTO[e.faixa];
          const cadeia = cadeiaTalento(e.id);
          const libera = (e.libera ?? []).map(id => talentoModelo(id)?.nome).filter(Boolean);
          const auto = [
            e.auto?.mods?.length || e.auto?.especial || e.auto?.imune?.length || e.auto?.escolha ? "efeito automático" : "",
            e.auto?.ataque ? "opção no diálogo de ataque" : "",
            e.auto?.acoes?.length ? "vira habilidade na sub-aba Talentos" : "",
            e.auto?.texto ? "o Mestre decide na cena" : ""
          ].filter(Boolean);
          return `<li class="epm-tre-linha${rq.ok ? " cumpre" : " falta"}${naFicha ? " na-ficha" : ""}" data-id="${e.id}" data-cumpre="${rq.ok ? 1 : 0}" data-faixa="${e.faixa}"
              data-texto="${escapar(normTreino(`${e.nome} ${e.beneficio} ${textoRequisitosTalento(e)} ${cat.label} ${fx?.label ?? ""}`))}">
            <input type="checkbox" class="epm-cat-marca" aria-label="Marcar ${escapar(e.nome)}" ${bloqueado ? `disabled title="Já está na ficha"` : ""}>
            <button type="button" class="epm-gri-nome" data-abrir aria-expanded="false">${escapar(e.nome)}${e.repetivel ? ' <span class="epm-tag">repetível</span>' : ""}${naFicha ? ' <span class="epm-tag">na ficha</span>' : ""}</button>
            <span class="epm-tre-num epm-tal-faixa" style="--cor:${fx?.cor ?? "#93A9A3"}" title="Nível total mínimo ${fx?.nivel ?? 1}">${escapar(fx?.label ?? "")}</span>
            <span class="epm-tre-num" title="Frequência">${escapar(e.frequencia !== "livre" ? FREQUENCIAS_TALENTO[e.frequencia] ?? "" : "")}</span>
            <span class="epm-tre-req ${rq.ok ? "ok" : "falta"}" title="${escapar(rq.ok ? `Cumpre: ${rq.cumpridos.join(", ") || "sem requisitos"}` : `Falta: ${rq.faltas.join("; ")}`)}"><i class="fa-solid ${rq.ok ? "fa-check" : "fa-xmark"}" aria-hidden="true"></i> ${escapar(textoRequisitosTalento(e))}</span>
            <span></span>
            <div class="epm-gri-detalhe" hidden>
              <p>${escapar(e.beneficio)}</p>
              ${cadeia.length > 1 ? `<p class="epm-dica"><strong>Cadeia:</strong> ${cadeia.map(id => escapar(talentoModelo(id)?.nome ?? id)).join(" → ")}</p>` : ""}
              ${libera.length ? `<p class="epm-dica"><strong>Libera:</strong> ${libera.map(escapar).join(", ")}</p>` : ""}
              ${rq.faltas.length ? `<p class="epm-requisito-falta"><i class="fa-solid fa-xmark" aria-hidden="true"></i> Falta: ${escapar(rq.faltas.join("; "))}</p>` : ""}
              ${rq.manuais.length ? `<p class="epm-dica">Confira com o Mestre: ${escapar(rq.manuais.join("; "))}</p>` : ""}
              ${auto.length ? `<p class="epm-dica">Na ficha: ${escapar(auto.join(", "))}.</p>` : ""}
              <button type="button" class="epm-botao epm-botao-mini" data-adicionar-um="${e.id}" ${bloqueado ? "disabled" : ""}><i class="fa-solid fa-plus"></i> Adicionar</button>
            </div>
          </li>`;
        }).join("");
        return `<section class="epm-cat-grupo" data-categoria="${cat.id}"><h4><i class="${cat.icone}" aria-hidden="true"></i> ${escapar(cat.label)} <small>(${lista.length})</small></h4><ul>${linhas}</ul></section>`;
      }).join("");
      const chips = [{ id: "", label: "Todas" }, ...CATEGORIAS_TALENTOS].map(c =>
        `<button type="button" class="epm-gri-chip${c.id === this.categoria ? " ativo" : ""}" data-cat-chip="${c.id}" aria-pressed="${c.id === this.categoria}">${escapar(c.label)}</button>`).join("");
      const faixas = [["", "Todas as faixas"], ...Object.entries(FAIXAS_TALENTO).map(([k, f]) => [k, `${f.label} (nível ${f.nivel})`])]
        .map(([k, l]) => `<option value="${k}" ${k === this.faixa ? "selected" : ""}>${escapar(l)}</option>`).join("");
      raiz.innerHTML = `
        <details class="epm-tre-regras"><summary>Regras dos talentos</summary><ul>${REGRAS_TALENTO.map(r => `<li>${escapar(r)}</li>`).join("")}</ul></details>
        <p class="epm-dica epm-tal-situacao">Nível total ${base.nivelTotal}: <strong>${sit.usados} de ${sit.disponiveis}</strong> talentos${sit.livres ? ` (${sit.livres} livre${sit.livres > 1 ? "s" : ""})` : ""}.${sit.avisos.length ? ` <span class="epm-requisito-falta">${escapar(sit.avisos.join(" "))}</span>` : ""}</p>
        <div class="epm-cat-filtros">
          <input type="search" class="epm-busca" data-busca placeholder="Buscar talento (nome, efeito, requisito…)" aria-label="Buscar">
          <select data-faixa aria-label="Faixa">${faixas}</select>
          <label class="epm-check"><input type="checkbox" data-so-cumpro ${this.soCumpro ? "checked" : ""}> Só os que eu cumpro</label>
        </div>
        <div class="epm-gri-chips" role="group" aria-label="Categoria">${chips}</div>
        <div class="epm-cat-lista">${grupos}<p class="epm-dica epm-gri-vazio" hidden>Nenhum talento com esses filtros.</p></div>
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
        const busca = normTreino(r.querySelector("[data-busca]")?.value);
        this.soCumpro = !!r.querySelector("[data-so-cumpro]")?.checked;
        this.faixa = r.querySelector("[data-faixa]")?.value ?? "";
        let total = 0;
        for (const g of r.querySelectorAll(".epm-cat-grupo")) {
          let visiveis = 0;
          const catOk = !this.categoria || g.dataset.categoria === this.categoria;
          for (const li of g.querySelectorAll(".epm-tre-linha")) {
            const ok = catOk && (!this.faixa || li.dataset.faixa === this.faixa) && (!this.soCumpro || li.dataset.cumpre === "1")
              && (!busca || busca.split(/\s+/).every(t => li.dataset.texto.includes(t)));
            li.hidden = !ok;
            if (ok) visiveis++;
          }
          g.hidden = !visiveis;
          total += visiveis;
        }
        r.querySelector(".epm-gri-vazio").hidden = total > 0;
      };
      const contar = () => {
        r.querySelector("[data-qtd]").textContent = String([...r.querySelectorAll(".epm-tre-linha .epm-cat-marca")].filter(c => c.checked).length);
      };
      r.querySelector("[data-busca]")?.addEventListener("input", filtrar);
      r.querySelector("[data-so-cumpro]")?.addEventListener("change", filtrar);
      r.querySelector("[data-faixa]")?.addEventListener("change", filtrar);
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
        const { adicionarTalento } = await import("./talentos.mjs");
        let n = 0;
        for (const id of ids) if (await adicionarTalento(this.actor, id, { silencioso: true })) n++;
        if (n) ui.notifications.info(`${this.actor.name}: ${n} talento(s) adicionado(s).`);
        const { dados } = await baseTalentos(this.actor);
        const { estadoAtor } = await import("./mecanicas.mjs");
        const sit = situacaoTalentos(dados, Math.max(1, Math.floor(Number(estadoAtor(this.actor).ficha.nivelTotal) || 1)));
        for (const a of sit.avisos) ui.notifications.warn(a);
        this.render();
      };
      for (const b of r.querySelectorAll("[data-adicionar-um]")) b.addEventListener("click", () => adicionar([b.dataset.adicionarUm]));
      r.querySelector("[data-adicionar]")?.addEventListener("click", () => {
        const ids = [...r.querySelectorAll(".epm-tre-linha")].filter(li => li.querySelector(".epm-cat-marca").checked).map(li => li.dataset.id);
        if (!ids.length) return ui.notifications.warn("Marque pelo menos um talento.");
        return adicionar(ids);
      });
      filtrar();
    }
  };
}

/** Abre o catálogo para uma ficha. */
export function abrirCatalogoTalentos(actor) {
  classe ??= criarClasse();
  const app = new classe({ actor });
  app.render(true);
  return app;
}

export { FLAG };
