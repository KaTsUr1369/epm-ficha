/**
 * Mapa mental das Anotações: cartões arrastáveis ligados por linhas, com zoom e navegação.
 * Componente de DOM puro; a ficha recebe as mudanças por `salvar(updates)` com caminhos
 * relativos à página ("nos.<id>.x", "conexoes.-=<id>"…).
 */
import { CORES_NO } from "./config.mjs";
import { novoId, num } from "./data.mjs";

const SVGNS = "http://www.w3.org/2000/svg";
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2.5;
const DESLOC = 5000;

function el(tag, classe) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  return e;
}

function botao(acao, icone, texto, titulo) {
  const b = el("button");
  b.type = "button";
  b.dataset.mapa = acao;
  b.title = titulo;
  b.setAttribute("aria-label", titulo);
  b.innerHTML = `<i class="fa-solid ${icone}" aria-hidden="true"></i>${texto ? `<span>${texto}</span>` : ""}`;
  return b;
}

function curva(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const c = Math.abs(dx) * 0.45 * Math.sign(dx || 1);
    return `M ${a.x} ${a.y} C ${a.x + c} ${a.y}, ${b.x - c} ${b.y}, ${b.x} ${b.y}`;
  }
  const c = Math.abs(dy) * 0.45 * Math.sign(dy || 1);
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + c}, ${b.x} ${b.y - c}, ${b.x} ${b.y}`;
}

export class MapaMental {
  constructor(raiz, { pagina = {}, vista = null, selecao = null, editavel = false, salvar, aoMudarEstado, aoOcupar } = {}) {
    this.raiz = raiz;
    this.editavel = editavel;
    this.nos = structuredClone(pagina?.nos ?? {});
    this.conexoes = structuredClone(pagina?.conexoes ?? {});
    for (const [id, n] of Object.entries(this.nos)) if (!n) delete this.nos[id];
    for (const [id, c] of Object.entries(this.conexoes)) if (!c || !this.nos[c.de] || !this.nos[c.para]) delete this.conexoes[id];
    this.vista = { x: 60, y: 60, zoom: 1, ...(vista ?? {}) };
    this.selecao = selecao && ((selecao.tipo === "no" && this.nos[selecao.id]) || (selecao.tipo === "conexao" && this.conexoes[selecao.id])) ? selecao : null;
    this.salvar = salvar ?? (async () => {});
    this.aoMudarEstado = aoMudarEstado ?? (() => {});
    this.aoOcupar = aoOcupar ?? (() => {});
    this.modo = null;
    this.controle = new AbortController();
    this.montar();
  }

  destruir() {
    this.controle.abort();
    this.observador?.disconnect();
  }

  montar() {
    const { signal } = this.controle;
    this.raiz.replaceChildren();
    const barra = el("div", "epm-mapa-barra");
    if (this.editavel) barra.append(botao("novo", "fa-plus", "Cartão", "Novo cartão (ou dois cliques no fundo)"));
    barra.append(botao("enquadrar", "fa-expand", "", "Enquadrar todos os cartões"));
    barra.append(botao("menos", "fa-magnifying-glass-minus", "", "Diminuir zoom"));
    this.rotuloZoom = el("span", "epm-mapa-zoom");
    barra.append(this.rotuloZoom);
    barra.append(botao("mais", "fa-magnifying-glass-plus", "", "Aumentar zoom"));
    if (this.editavel) {
      this.paleta = el("div", "epm-mapa-paleta");
      for (const cor of CORES_NO) {
        const b = el("button", "epm-mapa-cor");
        b.type = "button";
        b.dataset.cor = cor;
        b.style.setProperty("--cor", cor);
        b.title = "Cor do cartão";
        b.setAttribute("aria-label", "Cor do cartão");
        this.paleta.append(b);
      }
      barra.append(this.paleta);
      this.botaoExcluir = botao("excluir", "fa-trash", "", "Excluir seleção (Delete)");
      barra.append(this.botaoExcluir);
    }
    const ajuda = el("span", "epm-mapa-ajuda");
    ajuda.textContent = this.editavel
      ? "Dois cliques criam um cartão. Arraste a alça dourada até outro cartão para ligar, ou até o vazio para criar um ligado."
      : "Somente leitura.";
    barra.append(ajuda);

    this.area = el("div", "epm-mapa-area");
    this.area.tabIndex = 0;
    this.area.setAttribute("aria-label", "Mapa mental");
    this.mundo = el("div", "epm-mapa-mundo");
    this.svg = document.createElementNS(SVGNS, "svg");
    this.svg.classList.add("epm-mapa-linhas");
    this.svg.setAttribute("width", String(DESLOC * 2));
    this.svg.setAttribute("height", String(DESLOC * 2));
    this.grupo = document.createElementNS(SVGNS, "g");
    this.grupo.setAttribute("transform", `translate(${DESLOC} ${DESLOC})`);
    this.svg.append(this.grupo);
    this.camadaNos = el("div", "epm-mapa-nos");
    this.mundo.append(this.svg, this.camadaNos);
    this.vazio = el("p", "epm-mapa-vazio");
    this.vazio.textContent = this.editavel ? "Dê dois cliques para criar o primeiro cartão." : "Mapa vazio.";
    this.area.append(this.mundo, this.vazio);
    this.raiz.append(barra, this.area);

    barra.addEventListener("click", ev => this.#onBarra(ev), { signal });
    this.area.addEventListener("pointerdown", ev => this.#onPointerDown(ev), { signal });
    this.area.addEventListener("pointermove", ev => this.#onPointerMove(ev), { signal });
    this.area.addEventListener("pointerup", ev => this.#onPointerUp(ev), { signal });
    this.area.addEventListener("pointercancel", ev => this.#onPointerUp(ev), { signal });
    this.area.addEventListener("dblclick", ev => this.#onDuploClique(ev), { signal });
    this.area.addEventListener("wheel", ev => this.#onRoda(ev), { signal, passive: false });
    this.area.addEventListener("keydown", ev => this.#onTecla(ev), { signal });
    if (typeof ResizeObserver !== "undefined") {
      this.observador = new ResizeObserver(() => this.desenharLinhas());
      this.observador.observe(this.area);
    }
    this.desenharNos();
    this.aplicarVista();
  }

  /* ---------- Desenho ---------- */

  desenharNos() {
    this.camadaNos.replaceChildren();
    for (const [id, n] of Object.entries(this.nos)) {
      const d = el("div", "epm-no");
      d.dataset.no = id;
      d.style.left = `${num(n.x)}px`;
      d.style.top = `${num(n.y)}px`;
      d.style.setProperty("--cor", n.cor || CORES_NO[0]);
      const t = el("div", "epm-no-texto");
      t.textContent = n.texto || "Cartão vazio";
      t.classList.toggle("vazio", !n.texto);
      d.append(t);
      if (this.editavel) {
        const a = el("span", "epm-no-alca");
        a.title = "Arraste até outro cartão para ligar";
        d.append(a);
      }
      this.camadaNos.append(d);
    }
    this.vazio.hidden = Object.keys(this.nos).length > 0;
    this.desenharLinhas();
  }

  #centro(id) {
    const n = this.nos[id];
    const e = this.camadaNos.querySelector(`[data-no="${id}"]`);
    const w = e?.offsetWidth || 140;
    const h = e?.offsetHeight || 38;
    return { x: num(n?.x) + w / 2, y: num(n?.y) + h / 2 };
  }

  desenharLinhas() {
    if (!this.grupo) return;
    this.grupo.querySelectorAll("[data-conexao]").forEach(e => e.remove());
    for (const [cid, c] of Object.entries(this.conexoes)) {
      if (!this.nos[c.de] || !this.nos[c.para]) continue;
      const d = curva(this.#centro(c.de), this.#centro(c.para));
      const g = document.createElementNS(SVGNS, "g");
      g.dataset.conexao = cid;
      g.classList.add("epm-mapa-conexao");
      for (const classe of ["epm-mapa-hit", "epm-mapa-linha"]) {
        const p = document.createElementNS(SVGNS, "path");
        p.setAttribute("d", d);
        p.classList.add(classe);
        g.append(p);
      }
      this.grupo.prepend(g);
    }
    this.atualizarSelecao();
  }

  aplicarVista() {
    const { x, y, zoom } = this.vista;
    this.mundo.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    this.area.style.backgroundPosition = `${x}px ${y}px`;
    this.area.style.backgroundSize = `${24 * zoom}px ${24 * zoom}px`;
    if (this.rotuloZoom) this.rotuloZoom.textContent = `${Math.round(zoom * 100)}%`;
  }

  atualizarSelecao() {
    const s = this.selecao;
    this.camadaNos?.querySelectorAll(".epm-no").forEach(e => e.classList.toggle("selecionado", s?.tipo === "no" && e.dataset.no === s.id));
    this.grupo?.querySelectorAll("[data-conexao]").forEach(e => e.classList.toggle("selecionado", s?.tipo === "conexao" && e.dataset.conexao === s.id));
    if (this.paleta) this.paleta.hidden = s?.tipo !== "no";
    if (this.botaoExcluir) this.botaoExcluir.disabled = !s;
  }

  selecionar(s) {
    this.selecao = s;
    this.atualizarSelecao();
    this.aoMudarEstado({ selecao: s });
  }

  /* ---------- Operações ---------- */

  async criarNo(x, y, { ligarDe = null, editar = true } = {}) {
    if (!this.editavel) return;
    const id = novoId();
    const cor = ligarDe ? (this.nos[ligarDe]?.cor ?? CORES_NO[0]) : CORES_NO[0];
    this.nos[id] = { x: Math.round(x), y: Math.round(y), texto: "", cor };
    const updates = { [`nos.${id}`]: this.nos[id] };
    if (ligarDe && this.nos[ligarDe]) {
      const cid = novoId();
      this.conexoes[cid] = { de: ligarDe, para: id };
      updates[`conexoes.${cid}`] = this.conexoes[cid];
    }
    this.desenharNos();
    this.selecionar({ tipo: "no", id });
    if (editar) this.editarNo(id);
    await this.salvar(updates);
  }

  async ligar(de, para) {
    if (!this.editavel || de === para) return;
    const existe = Object.values(this.conexoes).some(c => (c.de === de && c.para === para) || (c.de === para && c.para === de));
    if (existe) return;
    const cid = novoId();
    this.conexoes[cid] = { de, para };
    this.desenharLinhas();
    await this.salvar({ [`conexoes.${cid}`]: this.conexoes[cid] });
  }

  async excluirSelecao() {
    const s = this.selecao;
    if (!s || !this.editavel) return;
    const updates = {};
    if (s.tipo === "no") {
      delete this.nos[s.id];
      updates[`nos.-=${s.id}`] = null;
      for (const [cid, c] of Object.entries(this.conexoes)) {
        if (c.de === s.id || c.para === s.id) {
          delete this.conexoes[cid];
          updates[`conexoes.-=${cid}`] = null;
        }
      }
    } else {
      delete this.conexoes[s.id];
      updates[`conexoes.-=${s.id}`] = null;
    }
    this.selecionar(null);
    this.desenharNos();
    await this.salvar(updates);
  }

  async pintar(cor) {
    const s = this.selecao;
    if (s?.tipo !== "no" || !this.nos[s.id]) return;
    this.nos[s.id].cor = cor;
    this.camadaNos.querySelector(`[data-no="${s.id}"]`)?.style.setProperty("--cor", cor);
    await this.salvar({ [`nos.${s.id}.cor`]: cor });
  }

  editarNo(id) {
    if (!this.editavel) return;
    const elNo = this.camadaNos.querySelector(`[data-no="${id}"]`);
    if (!elNo || elNo.querySelector(".epm-no-editor")) return;
    this.aoOcupar(true);
    const textoEl = elNo.querySelector(".epm-no-texto");
    const ta = el("textarea", "epm-no-editor");
    ta.value = this.nos[id]?.texto ?? "";
    ta.rows = Math.max(2, ta.value.split("\n").length);
    ta.setAttribute("aria-label", "Texto do cartão");
    textoEl.replaceWith(ta);
    elNo.classList.add("editando");
    ta.focus();
    ta.select();
    let terminou = false;
    const terminar = async gravar => {
      if (terminou) return;
      terminou = true;
      const novo = ta.value.replace(/\s+$/, "");
      const mudou = gravar && this.nos[id] && novo !== (this.nos[id].texto ?? "");
      if (mudou) this.nos[id].texto = novo;
      const t = el("div", "epm-no-texto");
      t.textContent = this.nos[id]?.texto || "Cartão vazio";
      t.classList.toggle("vazio", !this.nos[id]?.texto);
      ta.replaceWith(t);
      elNo.classList.remove("editando");
      this.desenharLinhas();
      try {
        if (mudou) await this.salvar({ [`nos.${id}.texto`]: novo });
      } finally {
        this.aoOcupar(false);
      }
    };
    ta.addEventListener("keydown", ev => {
      ev.stopPropagation();
      if (ev.key === "Escape") { ev.preventDefault(); terminar(false); }
      else if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); terminar(true); }
    });
    ta.addEventListener("input", () => { ta.rows = Math.max(2, ta.value.split("\n").length); });
    ta.addEventListener("blur", () => terminar(true));
    ta.addEventListener("pointerdown", ev => ev.stopPropagation());
  }

  zoomEm(fator, cx, cy) {
    const z0 = this.vista.zoom;
    const z1 = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z0 * fator));
    if (z1 === z0) return;
    this.vista.x = cx - (cx - this.vista.x) * (z1 / z0);
    this.vista.y = cy - (cy - this.vista.y) * (z1 / z0);
    this.vista.zoom = z1;
    this.aplicarVista();
    this.aoMudarEstado({ vista: { ...this.vista } });
  }

  enquadrar() {
    const r = this.area.getBoundingClientRect();
    const ids = Object.keys(this.nos);
    if (!ids.length || !r.width) {
      this.vista = { x: 60, y: 60, zoom: 1 };
    } else {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const id of ids) {
        const n = this.nos[id];
        const e = this.camadaNos.querySelector(`[data-no="${id}"]`);
        x0 = Math.min(x0, num(n.x));
        y0 = Math.min(y0, num(n.y));
        x1 = Math.max(x1, num(n.x) + (e?.offsetWidth || 140));
        y1 = Math.max(y1, num(n.y) + (e?.offsetHeight || 38));
      }
      const margem = 60;
      const zoom = Math.min(1.5, Math.max(ZOOM_MIN, Math.min(r.width / (x1 - x0 + margem * 2), r.height / (y1 - y0 + margem * 2))));
      this.vista = { zoom, x: (r.width - (x1 - x0) * zoom) / 2 - x0 * zoom, y: (r.height - (y1 - y0) * zoom) / 2 - y0 * zoom };
    }
    this.aplicarVista();
    this.aoMudarEstado({ vista: { ...this.vista } });
  }

  /* ---------- Eventos ---------- */

  #pontoMundo(ev) {
    const r = this.area.getBoundingClientRect();
    return { x: (ev.clientX - r.left - this.vista.x) / this.vista.zoom, y: (ev.clientY - r.top - this.vista.y) / this.vista.zoom };
  }

  #capturar(ev) {
    try { this.area.setPointerCapture(ev.pointerId); } catch { /* ok */ }
  }

  #onBarra(ev) {
    const b = ev.target.closest("button");
    if (!b) return;
    if (b.dataset.cor) return this.pintar(b.dataset.cor);
    const r = this.area.getBoundingClientRect();
    switch (b.dataset.mapa) {
      case "novo": {
        const p = { x: (r.width / 2 - this.vista.x) / this.vista.zoom, y: (r.height / 2 - this.vista.y) / this.vista.zoom };
        return this.criarNo(p.x - 70 + Math.random() * 30, p.y - 20 + Math.random() * 30);
      }
      case "enquadrar": return this.enquadrar();
      case "menos": return this.zoomEm(1 / 1.2, r.width / 2, r.height / 2);
      case "mais": return this.zoomEm(1.2, r.width / 2, r.height / 2);
      case "excluir": return this.excluirSelecao();
    }
  }

  #onPointerDown(ev) {
    if (ev.button !== 0 || ev.target.closest(".epm-no-editor")) return;
    this.area.focus({ preventScroll: true });
    const alca = ev.target.closest(".epm-no-alca");
    const no = ev.target.closest(".epm-no");
    const linha = ev.target.closest("[data-conexao]");
    if (alca && this.editavel) {
      ev.preventDefault();
      const de = alca.closest(".epm-no").dataset.no;
      this.temp = document.createElementNS(SVGNS, "path");
      this.temp.classList.add("epm-mapa-temp");
      this.grupo.append(this.temp);
      this.modo = { tipo: "ligar", de, pointerId: ev.pointerId };
      this.#capturar(ev);
      this.aoOcupar(true);
      return;
    }
    if (no) {
      ev.preventDefault();
      const id = no.dataset.no;
      this.selecionar({ tipo: "no", id });
      if (this.editavel) {
        const p = this.#pontoMundo(ev);
        this.modo = { tipo: "arrastar", id, dx: p.x - num(this.nos[id].x), dy: p.y - num(this.nos[id].y), x0: ev.clientX, y0: ev.clientY, moveu: false, pointerId: ev.pointerId };
      }
      return;
    }
    if (linha) {
      ev.preventDefault();
      this.selecionar({ tipo: "conexao", id: linha.dataset.conexao });
      return;
    }
    if (this.selecao) this.selecionar(null);
    this.modo = { tipo: "pan", x0: ev.clientX, y0: ev.clientY, vx: this.vista.x, vy: this.vista.y, pointerId: ev.pointerId };
    this.#capturar(ev);
    this.aoOcupar(true);
  }

  #onPointerMove(ev) {
    const m = this.modo;
    if (!m || ev.pointerId !== m.pointerId) return;
    if (m.tipo === "pan") {
      this.vista.x = m.vx + (ev.clientX - m.x0);
      this.vista.y = m.vy + (ev.clientY - m.y0);
      this.aplicarVista();
    } else if (m.tipo === "arrastar") {
      if (!m.moveu) {
        if (Math.hypot(ev.clientX - m.x0, ev.clientY - m.y0) < 4) return;
        m.moveu = true;
        this.#capturar(ev);
        this.aoOcupar(true);
      }
      const p = this.#pontoMundo(ev);
      const n = this.nos[m.id];
      n.x = Math.round(p.x - m.dx);
      n.y = Math.round(p.y - m.dy);
      const e = this.camadaNos.querySelector(`[data-no="${m.id}"]`);
      if (e) { e.style.left = `${n.x}px`; e.style.top = `${n.y}px`; }
      this.desenharLinhas();
    } else if (m.tipo === "ligar") {
      this.temp?.setAttribute("d", curva(this.#centro(m.de), this.#pontoMundo(ev)));
      const alvo = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.(".epm-no");
      this.camadaNos.querySelectorAll(".alvo").forEach(e => e.classList.remove("alvo"));
      if (alvo && alvo.dataset.no !== m.de) alvo.classList.add("alvo");
    }
  }

  async #onPointerUp(ev) {
    const m = this.modo;
    if (!m || ev.pointerId !== m.pointerId) return;
    this.modo = null;
    try { this.area.releasePointerCapture(ev.pointerId); } catch { /* ok */ }
    if (m.tipo === "arrastar" && !m.moveu) return;
    try {
      if (m.tipo === "pan") {
        this.aoMudarEstado({ vista: { ...this.vista } });
      } else if (m.tipo === "arrastar") {
        const n = this.nos[m.id];
        await this.salvar({ [`nos.${m.id}.x`]: n.x, [`nos.${m.id}.y`]: n.y });
      } else if (m.tipo === "ligar") {
        this.temp?.remove();
        this.temp = null;
        this.camadaNos.querySelectorAll(".alvo").forEach(e => e.classList.remove("alvo"));
        const sob = document.elementFromPoint(ev.clientX, ev.clientY);
        const alvo = sob?.closest?.(".epm-no");
        if (alvo && alvo.dataset.no !== m.de) await this.ligar(m.de, alvo.dataset.no);
        else if (!alvo && sob && this.area.contains(sob)) {
          const p = this.#pontoMundo(ev);
          await this.criarNo(p.x - 20, p.y - 19, { ligarDe: m.de });
        }
      }
    } finally {
      this.aoOcupar(false);
    }
  }

  #onDuploClique(ev) {
    if (!this.editavel || ev.target.closest(".epm-no-editor")) return;
    const no = ev.target.closest(".epm-no");
    if (no) return this.editarNo(no.dataset.no);
    if (ev.target.closest("[data-conexao]")) return;
    const p = this.#pontoMundo(ev);
    this.criarNo(p.x - 70, p.y - 19);
  }

  #onRoda(ev) {
    ev.preventDefault();
    const r = this.area.getBoundingClientRect();
    this.zoomEm(ev.deltaY < 0 ? 1.1 : 1 / 1.1, ev.clientX - r.left, ev.clientY - r.top);
  }

  #onTecla(ev) {
    if (ev.target !== this.area) return;
    if ((ev.key === "Delete" || ev.key === "Backspace") && this.selecao) {
      ev.preventDefault();
      this.excluirSelecao();
    } else if (ev.key === "Escape" && this.selecao) {
      this.selecionar(null);
    } else if (ev.key === "Enter" && this.selecao?.tipo === "no") {
      ev.preventDefault();
      this.editarNo(this.selecao.id);
    }
  }
}
