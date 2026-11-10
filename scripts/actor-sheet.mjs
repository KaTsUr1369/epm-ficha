/**
 * Ficha de personagem EPM (ApplicationV2), registrada para atores "character" do dnd5e.
 * Os dados ficam em actor.flags["epm-ficha"]; a Vida usa system.attributes.hp do dnd5e.
 */
import { FLAG, CAMINHO, TIPOS_IGNORADOS, CONDICOES, TEXTOS_SOBRE, PERICIAS_OBSOLETAS } from "./config.mjs";
import { num, int, slug, novoId, normalizarTexto, periciasParaLista, periciasParaObjeto, migrarPericias, atributosDaPericia, entradaPericia } from "./data.mjs";
import { montarContexto, lerAtor } from "./context.mjs";
import { fvtt, enriquecer, editorHTML, dadosDeArraste, escapar } from "./helpers.mjs";
import { ajustes, listaPericias, salvarListaPericias } from "./settings.mjs";
import * as M from "./mecanicas.mjs";
import { MapaMental } from "./mind-map.mjs";
import { abrirEditorPoder } from "./poder-sheet.mjs";
import { escolherImagem, verImagem } from "./imagens.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const P = `flags.${FLAG}`;

const ACOES_FICHA = [
  "aba", "irAba", "alternarEdicao", "editarImagem", "imagemItem", "imagemSobre", "removerImagemSobre", "verImagem",
  "ajustarRecurso", "rolarAtributo", "rolarPericia", "rolarIniciativa", "alternarAtributoPericia", "adicionarPericia", "removerPericia", "sincronizarPericias", "salvarPericiasPadrao",
  "defesa", "alternarAcao", "novoTurno", "exaustao", "exaustaoMais", "rolarComa", "acordarComa", "descanso",
  "converter", "subirNivel", "moedas", "filtroRaridade",
  "criarItem", "expandirItem", "quantidade", "equiparItem", "favoritar", "chatItem", "editarItem", "excluirItem",
  "usarItem", "atacar", "danoArma", "novoAtaque", "excluirAtaque", "novoBonusCena", "excluirBonusCena", "alternarTemp",
  "novoPoder", "usarPoder", "editarPoder", "duplicarPoder",
  "novaPagina", "renomearPagina", "excluirPagina", "moverPagina",
  "alternarCondicao", "removerTag",
  "novaBencao", "excluirBencao", "adicionarMod", "removerMod",
  "novaRelacao", "excluirRelacao", "abrirRelacao"
];
const despachar = nome => function (evento, alvo) {
  return this[`acao${nome[0].toUpperCase()}${nome.slice(1)}`]?.(evento, alvo);
};

/** A atualização mexeu só nas anotações? (para redesenhar só aquela aba) */
function soAnotacoes(dados) {
  if (!dados || typeof dados !== "object") return false;
  const chaves = Object.keys(foundry.utils.flattenObject(dados)).filter(k => k !== "_id" && !k.startsWith("_stats"));
  return chaves.length > 0 && chaves.every(k => k.startsWith(`${P}.notas.`));
}

export class EPMActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  constructor(options = {}) {
    super(options);
    this._abas = { primary: "principal", magias: "0", notas: null };
    this._expandidos = new Set();
    this._filtroRaridades = new Set();
    this._modoEdicao = null;
    this._ajustesRecurso = {};
    this._tempAberto = false;
    this._focarTemp = false;
    this._estadoMapas = {};
    this._mapas = [];
    this._mapaOcupado = false;
    this._notasPendente = false;
  }

  static DEFAULT_OPTIONS = {
    classes: ["epm", "epm-ficha"],
    position: { width: 1000, height: 860 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: Object.fromEntries(ACOES_FICHA.map(n => [n, despachar(n)]))
  };

  static PARTS = {
    erro: { template: `${CAMINHO}/actor/erro.hbs` },
    header: { template: `${CAMINHO}/actor/header.hbs` },
    nav: { template: `${CAMINHO}/actor/nav.hbs` },
    principal: { template: `${CAMINHO}/actor/principal.hbs`, scrollable: [""] },
    combate: { template: `${CAMINHO}/actor/combate.hbs`, scrollable: [""] },
    inventario: { template: `${CAMINHO}/actor/inventario.hbs`, scrollable: [""] },
    habilidades: { template: `${CAMINHO}/actor/habilidades.hbs`, scrollable: [""] },
    magias: { template: `${CAMINHO}/actor/magias.hbs`, scrollable: [""] },
    sobre: { template: `${CAMINHO}/actor/sobre.hbs`, scrollable: [""] },
    anotacoes: { template: `${CAMINHO}/actor/anotacoes.hbs`, scrollable: [""] },
    condicoes: { template: `${CAMINHO}/actor/condicoes.hbs`, scrollable: [""] },
    bencaos: { template: `${CAMINHO}/actor/bencaos.hbs`, scrollable: [""] },
    relacoes: { template: `${CAMINHO}/actor/relacoes.hbs`, scrollable: [""] }
  };

  /* -------------------------------------------- */
  /*  Renderização                                */
  /* -------------------------------------------- */

  _visaoLimitada() {
    return !game.user.isGM && !this.actor.testUserPermission(game.user, "OBSERVER");
  }

  _estado() {
    return lerAtor(this.actor, listaPericias());
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (!Array.isArray(options.parts)) options.parts = Object.keys(this.constructor.PARTS);
    if (this._visaoLimitada()) {
      options.parts = options.parts.filter(p => p === "erro" || p === "header" || p === "sobre");
      return;
    }
    if (options.isFirstRender) return;
    if (options.renderContext === "updateActor" && soAnotacoes(options.renderData)) {
      options.parts = options.parts.filter(p => p === "anotacoes");
    }
    if (this._mapaOcupado && options.parts.includes("anotacoes")) {
      options.parts = options.parts.filter(p => p !== "anotacoes");
      this._notasPendente = true;
    }
  }

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    try {
      const actor = this.actor;
      const bruto = actor.flags?.[FLAG] ?? {};
      const segredos = actor.isOwner;
      if (this._modoEdicao === null) {
        const distribuidos = Object.values(bruto.atributos ?? {}).reduce((soma, a) => soma + Math.abs(int(a?.base)), 0);
        this._modoEdicao = this.isEditable && distribuidos === 0;
      }
      const enriquecidos = { itens: {}, sobre: {} };
      for (const id of [...this._expandidos]) {
        const item = actor.items.get(id);
        if (!item) { this._expandidos.delete(id); continue; }
        enriquecidos.itens[id] = await enriquecer(item.system?.description?.value ?? "", { relativeTo: item, secrets: item.isOwner });
      }
      const editores = { sobre: {}, notas: {} };
      for (const t of TEXTOS_SOBRE) {
        const valor = bruto.sobre?.[t.id] ?? "";
        enriquecidos.sobre[t.id] = await enriquecer(valor, { relativeTo: actor, secrets: segredos });
        editores.sobre[t.id] = editorHTML({ name: `${P}.sobre.${t.id}`, value: valor, documentUUID: actor.uuid, enriched: enriquecidos.sobre[t.id] });
      }
      for (const [pid, pagina] of Object.entries(bruto.notas?.paginas ?? {})) {
        if (!pagina || pagina.tipo === "mapa") continue;
        editores.notas[pid] = editorHTML({
          name: `${P}.notas.paginas.${pid}.texto`, value: pagina.texto ?? "", documentUUID: actor.uuid,
          enriched: await enriquecer(pagina.texto ?? "", { relativeTo: actor, secrets: segredos })
        });
      }
      const contexto = montarContexto({
        actor,
        itens: actor.items.contents,
        ui: {
          abas: this._abas, expandidos: this._expandidos, filtroRaridades: this._filtroRaridades,
          edicao: this._modoEdicao, tempAberto: this._tempAberto, limitado: this._visaoLimitada()
        },
        ajustes: { modoLimites: ajustes().modoLimites, listaPericias: listaPericias() },
        usuario: { isGM: game.user.isGM },
        enriquecidos, editores,
        editavel: this.isEditable
      });
      return Object.assign(base, contexto);
    } catch (err) {
      return Object.assign(base, this._contextoDeErro(err, "montar os dados"));
    }
  }

  /** Contexto mínimo para a ficha abrir mostrando o erro em vez de não abrir. */
  _contextoDeErro(err, etapa) {
    console.error(`EPM | Erro ao ${etapa} da ficha de ${this.actor?.name}`, err);
    ui.notifications.error(`Ficha EPM de ${this.actor?.name}: erro ao ${etapa}. A mensagem aparece no topo da ficha e no console (F12).`);
    return {
      actor: { id: this.actor?.id, uuid: this.actor?.uuid, name: this.actor?.name, img: this.actor?.img },
      editavel: false, edicao: false, abas: [], cls: {},
      erroFicha: `${err?.name ?? "Erro"}: ${err?.message ?? err}`,
      erroPilha: String(err?.stack ?? "").split("\n").slice(0, 5).join("\n")
    };
  }

  /** Se algum template falhar, abre só o aviso de erro em vez de não abrir nada. */
  async _renderHTML(context, options) {
    try {
      return await super._renderHTML(context, options);
    } catch (err) {
      Object.assign(context, this._contextoDeErro(err, "desenhar"));
      return super._renderHTML(context, { ...options, parts: ["erro"] });
    }
  }

  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    this._ligarEventos();
    this._inicializarDados();
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.classList.toggle("epm-limitado", this._visaoLimitada());
    if (options.isFirstRender || options.parts?.includes("anotacoes")) {
      try { this._montarMapas(); } catch (err) { console.error("EPM | Falha ao montar o mapa mental", err); }
    }
    if (this._focarTemp) {
      this._focarTemp = false;
      const campo = this.element.querySelector('[data-recurso-valor="temp"]');
      campo?.focus();
      campo?.select();
    }
  }

  async _onClose(options) {
    for (const m of this._mapas) m.destruir();
    this._mapas = [];
    return super._onClose(options);
  }

  /** Grava a lista de perícias em fichas novas e traz fichas da 0.1 para a lista oficial. */
  async _inicializarDados() {
    try {
      await this._prepararDadosIniciais();
    } catch (err) {
      console.error(`EPM | Falha ao preparar os dados de ${this.actor.name}`, err);
      ui.notifications.warn(`Ficha EPM de ${this.actor.name}: não consegui preparar os dados iniciais. Detalhes no console (F12).`);
    }
  }

  async _prepararDadosIniciais() {
    if (!this.actor.isOwner) return;
    const bruto = this.actor.flags?.[FLAG] ?? {};
    if (!bruto.pericias) {
      await this.actor.update({ [`${P}.pericias`]: periciasParaObjeto(listaPericias()), [`${P}.versao`]: 2 });
      return;
    }
    if (int(bruto.versao) < 2) {
      const mudancas = migrarPericias(bruto.pericias, listaPericias(), PERICIAS_OBSOLETAS);
      const updates = Object.fromEntries(Object.entries(mudancas).map(([k, v]) => [`${P}.pericias.${k}`, v]));
      updates[`${P}.versao`] = 2;
      await this.actor.update(updates);
      ui.notifications.info(`${this.actor.name}: perícias atualizadas para a lista oficial.`);
    }
  }

  /* -------------------------------------------- */
  /*  Eventos (delegados no elemento raiz)        */
  /* -------------------------------------------- */

  _ligarEventos() {
    const raiz = this.element;
    raiz.addEventListener("change", ev => this._onMudancaLocal(ev), { capture: true });
    raiz.addEventListener("keydown", ev => this._onTeclaLocal(ev), { capture: true });
    raiz.addEventListener("dragstart", ev => this._onArrastarItem(ev));
    if (!("_onDrop" in ActorSheetV2.prototype)) {
      raiz.addEventListener("dragover", ev => ev.preventDefault());
      raiz.addEventListener("drop", ev => this._onDrop(ev));
    }
  }

  _onMudancaLocal(ev) {
    const alvo = ev.target;
    if (alvo.closest?.(".epm-mapa")) { ev.stopPropagation(); return; }
    if (alvo.dataset?.recursoValor) { ev.stopPropagation(); return this._mudarRecurso(alvo); }
    if (alvo.dataset?.itemCampo) { ev.stopPropagation(); return this._mudarCampoItem(alvo); }
    if (alvo.dataset?.tagCampo) { ev.stopPropagation(); return this._adicionarTag(alvo); }
  }

  _onTeclaLocal(ev) {
    const alvo = ev.target;
    if (ev.key === "Escape" && alvo.dataset?.recursoValor === "temp") {
      ev.preventDefault();
      ev.stopPropagation();
      this._tempAberto = false;
      return this.render({ parts: ["header"] });
    }
    if (ev.key !== "Enter") return;
    if (alvo.dataset?.recursoValor === "temp") {
      ev.preventDefault();
      ev.stopPropagation();
      this._tempAberto = false;
      return this._mudarRecurso(alvo).then(() => this.render({ parts: ["header"] }));
    }
    if (alvo.dataset?.tagCampo) { ev.preventDefault(); ev.stopPropagation(); return this._adicionarTag(alvo); }
    if (alvo.dataset?.recursoValor) { ev.preventDefault(); ev.stopPropagation(); return this._mudarRecurso(alvo); }
  }

  /** Aceita "25", "+5", "-3" ou "=10" nos campos de recurso. */
  async _mudarRecurso(input) {
    const id = input.dataset.recursoValor;
    if (this._ajustesRecurso[id]) {
      clearTimeout(this._ajustesRecurso[id].timer);
      delete this._ajustesRecurso[id];
    }
    const r = this._infoRecurso(id);
    if (!r) return;
    const bruto = String(input.value).trim().replace(",", ".").replace("−", "-").replace(/\s+/g, "");
    let novo;
    if (/^[+-]\d+(\.\d+)?$/.test(bruto)) novo = r.value + Number(bruto);
    else if (/^=?\d+(\.\d+)?$/.test(bruto)) novo = Number(bruto.replace("=", ""));
    else { input.value = r.value; return; }
    novo = Math.max(0, Math.round(novo));
    if (r.max > 0) novo = Math.min(novo, r.max);
    input.value = novo;
    if (novo === r.value) return;
    await this.actor.update({ [r.caminho]: novo });
  }

  /** Valor, máximo e caminho de um recurso ("temp" é a vida temporária, sem máximo). */
  _infoRecurso(id) {
    const recursos = this._estado().ficha.recursos;
    if (id === "temp") return { value: recursos.pv.temp, max: 0, caminho: "system.attributes.hp.temp" };
    const r = recursos[id];
    if (!r) return null;
    return { value: r.value, max: r.max, caminho: id === "pv" ? "system.attributes.hp.value" : `${P}.recursos.${id}.value` };
  }

  async _mudarCampoItem(el) {
    const item = this.actor.items.get(el.dataset.itemId);
    if (!item) return;
    let valor = el.type === "checkbox" ? el.checked : el.value;
    if (el.type === "number") valor = num(valor);
    await item.update({ [el.dataset.itemCampo]: valor });
  }

  async _adicionarTag(input) {
    const campo = input.dataset.tagCampo;
    const valor = input.value.trim();
    input.value = "";
    if (!valor) return;
    const atual = Array.isArray(this.actor.flags?.[FLAG]?.[campo]) ? [...this.actor.flags[FLAG][campo]] : [];
    if (atual.some(v => normalizarTexto(v) === normalizarTexto(valor))) return;
    atual.push(valor);
    await this.actor.update({ [`${P}.${campo}`]: atual });
  }

  _onArrastarItem(ev) {
    const li = ev.target.closest?.("[data-item-id][draggable]");
    if (!li) return;
    const item = this.actor.items.get(li.dataset.itemId);
    if (item) ev.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
  }

  async _onDrop(event) {
    event.preventDefault?.();
    if (!this.isEditable) return;
    const dados = dadosDeArraste(event);
    if (dados?.type === "Item") return this._soltarItem(dados);
    if (dados?.type === "Actor") return this._soltarAtor(dados);
  }

  async _soltarItem(dados) {
    const item = await Item.implementation.fromDropData(dados);
    if (!item || item.parent?.uuid === this.actor.uuid) return;
    if (TIPOS_IGNORADOS.includes(item.type)) {
      return ui.notifications.warn(`Itens do tipo "${item.type}" não são usados na ficha EPM.`);
    }
    if (item.type === "feat" || item.type === "spell") return M.aprenderPorArraste(this.actor, item);
    const data = item.toObject();
    for (const k of ["_id", "folder", "sort", "ownership", "_stats"]) delete data[k];
    return this.actor.createEmbeddedDocuments("Item", [data]);
  }

  async _soltarAtor(dados) {
    if (this._abas.primary !== "relacoes") {
      return ui.notifications.info("Para criar uma relação, solte o personagem na aba Relações.");
    }
    const ator = await Actor.implementation.fromDropData(dados);
    if (!ator || ator.uuid === this.actor.uuid) return;
    const existe = Object.values(this.actor.flags?.[FLAG]?.relacoes ?? {}).some(r => r?.uuid === ator.uuid);
    if (existe) return ui.notifications.info(`${ator.name} já está nas relações.`);
    await this.actor.update({
      [`${P}.relacoes.${novoId()}`]: { nome: ator.name, img: ator.img, uuid: ator.uuid, tipo: "aliado", afinidade: 0, notas: "", criado: Date.now() }
    });
  }

  /* -------------------------------------------- */
  /*  Abas e mapas mentais                        */
  /* -------------------------------------------- */

  _mudarAba(grupo, aba) {
    if (!grupo || !aba) return;
    this._abas[grupo] = aba;
    for (const el of this.element.querySelectorAll(`[data-group="${grupo}"][data-tab]`)) {
      const ativo = el.dataset.tab === aba;
      el.classList.toggle("active", ativo);
      if (el.tagName === "BUTTON") el.setAttribute("aria-pressed", String(ativo));
    }
    if (grupo === "notas" || aba === "anotacoes") requestAnimationFrame(() => this._mapas.forEach(m => m.desenharLinhas()));
  }

  _montarMapas() {
    for (const m of this._mapas) m.destruir();
    this._mapas = [];
    const paginas = this.actor.flags?.[FLAG]?.notas?.paginas ?? {};
    for (const el of this.element.querySelectorAll(".epm-mapa[data-pagina]")) {
      const pid = el.dataset.pagina;
      const estado = (this._estadoMapas[pid] ??= {});
      this._mapas.push(new MapaMental(el, {
        pagina: paginas[pid] ?? {},
        vista: estado.vista, selecao: estado.selecao,
        editavel: this.isEditable,
        salvar: updates => this._salvarMapa(pid, updates),
        aoMudarEstado: mudanca => Object.assign(estado, mudanca),
        aoOcupar: ocupado => this._definirMapaOcupado(ocupado)
      }));
    }
  }

  _salvarMapa(pid, updates) {
    const base = `${P}.notas.paginas.${pid}.`;
    return this.actor.update(Object.fromEntries(Object.entries(updates).map(([k, v]) => [base + k, v])));
  }

  _definirMapaOcupado(ocupado) {
    this._mapaOcupado = ocupado;
    if (!ocupado && this._notasPendente) {
      this._notasPendente = false;
      this.render({ parts: ["anotacoes"] });
    }
  }

  _item(alvo) {
    const id = alvo?.dataset?.itemId ?? alvo?.closest?.("[data-item-id]")?.dataset.itemId;
    return id ? this.actor.items.get(id) : null;
  }

  /* -------------------------------------------- */
  /*  Ações                                       */
  /* -------------------------------------------- */

  acaoAba(ev, alvo) { this._mudarAba(alvo.dataset.group, alvo.dataset.tab); }
  acaoIrAba(ev, alvo) { this._mudarAba("primary", alvo.dataset.tab); }

  /**
   * Setas « ‹ › » dos recursos. Cliques seguidos se acumulam na tela e são gravados
   * juntos depois de uma pausa curta, para nenhum clique se perder.
   */
  acaoAjustarRecurso(ev, alvo) {
    if (!this.isEditable) return;
    const id = alvo.dataset.recurso;
    const r = this._infoRecurso(id);
    if (!r) return;
    const pendente = this._ajustesRecurso[id];
    let novo = Math.max(0, (pendente ? pendente.valor : r.value) + int(alvo.dataset.delta));
    if (r.max > 0) novo = Math.min(novo, r.max);
    const input = this.element.querySelector(`[data-recurso-valor="${id}"]`);
    if (input) input.value = novo;
    const barra = input?.closest(".epm-recurso")?.querySelector(".epm-barra:not(.epm-barra-temp) span");
    if (barra && r.max > 0 && id !== "temp") barra.style.width = `${Math.round(Math.min(1, novo / r.max) * 100)}%`;
    if (pendente) clearTimeout(pendente.timer);
    const timer = setTimeout(async () => {
      delete this._ajustesRecurso[id];
      if (novo === this._infoRecurso(id)?.value) return;
      await this.actor.update({ [r.caminho]: novo });
    }, 350);
    this._ajustesRecurso[id] = { valor: novo, timer };
  }

  acaoAlternarEdicao() {
    if (!this.isEditable) return;
    this._modoEdicao = !this._modoEdicao;
    this.render();
  }

  async acaoEditarImagem() {
    if (!this.isEditable) return;
    const caminho = await escolherImagem({ atual: this.actor.img, titulo: "Retrato" });
    if (caminho) await this.actor.update({ img: caminho });
  }

  async acaoImagemItem(ev, alvo) {
    const item = this._item(alvo);
    if (!item || !this.isEditable) return;
    const caminho = await escolherImagem({ atual: item.img, titulo: `Imagem de ${item.name}` });
    if (caminho) await item.update({ img: caminho });
  }

  async acaoImagemSobre(ev, alvo) {
    if (!this.isEditable) return;
    const campo = alvo.dataset.campo;
    const caminho = await escolherImagem({ atual: this.actor.flags?.[FLAG]?.sobre?.[campo] ?? "", titulo: campo === "imagemMarca" ? "Imagem da Marca" : "Aparência" });
    if (caminho) await this.actor.update({ [`${P}.sobre.${campo}`]: caminho });
  }

  async acaoRemoverImagemSobre(ev, alvo) {
    await this.actor.update({ [`${P}.sobre.${alvo.dataset.campo}`]: "" });
  }

  acaoVerImagem(ev, alvo) { verImagem(alvo.dataset.src, alvo.dataset.titulo); }

  acaoRolarAtributo(ev, alvo) {
    const { ficha } = this._estado();
    const a = ficha.atributos[alvo.dataset.atributo];
    if (!a) return;
    return M.rolarTeste(this.actor, { rotulo: `Teste de ${a.label}`, bonus: a.total, evento: ev, desvantagens: ficha.desvantagens.testes, nota: M.notaResistencia(ficha) });
  }

  acaoRolarPericia(ev, alvo) {
    const { ficha } = this._estado();
    const p = ficha.periciaPorId[alvo.dataset.pericia];
    if (!p) return;
    return M.rolarTeste(this.actor, { rotulo: `Teste de ${p.nome}`, bonus: p.total, evento: ev, desvantagens: ficha.desvantagens.testes, nota: M.notaResistencia(ficha) });
  }

  acaoRolarIniciativa(ev) { return M.rolarIniciativa(this.actor, ev); }

  async acaoAlternarAtributoPericia(ev, alvo) {
    const { pericia, atributo } = alvo.dataset;
    const p = this.actor.flags?.[FLAG]?.pericias?.[pericia];
    if (!p) return;
    const atuais = atributosDaPericia(p);
    const novos = atuais.includes(atributo) ? atuais.filter(a => a !== atributo) : [...atuais, atributo];
    await this.actor.update({ [`${P}.pericias.${pericia}.atributos`]: novos });
  }

  async acaoAdicionarPericia() {
    const nome = await M.perguntarTexto("Nova perícia", "Nome da perícia", "", "Adicionar");
    if (!nome) return;
    const atuais = this.actor.flags?.[FLAG]?.pericias ?? {};
    let id = slug(nome) || novoId();
    while (atuais[id]) id = `${slug(nome) || "pericia"}${Math.floor(Math.random() * 1000)}`;
    await this.actor.update({ [`${P}.pericias.${id}`]: { nome, atributos: [], sugestoes: [], pontos: 0, outros: 0 } });
  }

  async acaoRemoverPericia(ev, alvo) {
    const id = alvo.dataset.pericia;
    const nome = this._estado().ficha.periciaPorId[id]?.nome ?? id;
    if (!(await M.confirmar("Remover perícia", `<p>Remover <strong>${escapar(nome)}</strong> desta ficha?</p>`))) return;
    await this.actor.update({ [`${P}.pericias.-=${id}`]: null });
  }

  async acaoSincronizarPericias() {
    const atuais = this.actor.flags?.[FLAG]?.pericias ?? {};
    const updates = {};
    for (const entrada of listaPericias()) {
      const { id, nome, atributos, sugestoes } = entradaPericia(entrada);
      if (id && !atuais[id]) updates[`${P}.pericias.${id}`] = { nome, atributos, sugestoes, pontos: 0, outros: 0 };
    }
    const n = Object.keys(updates).length;
    if (!n) return ui.notifications.info("Esta ficha já tem todas as perícias da lista padrão.");
    await this.actor.update(updates);
    ui.notifications.info(`${n} perícia(s) adicionada(s).`);
  }

  async acaoSalvarPericiasPadrao() {
    if (!game.user.isGM) return;
    const lista = periciasParaLista(this.actor.flags?.[FLAG]?.pericias);
    if (!lista.length) return;
    if (!(await M.confirmar("Lista padrão de perícias", `<p>Salvar as ${lista.length} perícias desta ficha como padrão do mundo?</p><p class="epm-dica">Fichas novas usam essa lista. As existentes podem usar "Trazer do padrão".</p>`))) return;
    await salvarListaPericias(lista);
    ui.notifications.info("Lista de perícias salva como padrão do mundo.");
  }

  acaoDefesa(ev, alvo) { return M.usarDefesa(this.actor, alvo.dataset.defesa); }

  async acaoAlternarAcao(ev, alvo) {
    const id = alvo.dataset.acao;
    await this.actor.update({ [`${P}.acoes.${id}`]: !this.actor.flags?.[FLAG]?.acoes?.[id] });
  }

  acaoNovoTurno() { return M.novoTurno(this.actor); }

  async acaoExaustao(ev, alvo) {
    const n = int(alvo.dataset.nivel);
    const atual = this._estado().ficha.exaustao.nivel;
    await this.actor.update({ [`${P}.exaustao`]: atual === n ? n - 1 : n });
  }

  async acaoExaustaoMais() {
    await this.actor.update({ [`${P}.exaustao`]: this._estado().ficha.exaustao.nivel + 1 });
  }

  acaoRolarComa() {
    return M.rolarFormula(this.actor, this._estado().ficha.exaustao.formulaComa, "Dias em coma");
  }

  async acaoAcordarComa() {
    await this.actor.update({ [`${P}.exaustao`]: 3 });
    ui.notifications.info(`${this.actor.name} acordou do coma com Exaustão 3.`);
  }

  acaoDescanso(ev, alvo) { return M.descanso(this.actor, alvo.dataset.tipo); }
  acaoConverter(ev, alvo) { return M.converterPontos(this.actor, alvo.dataset.de, ev.shiftKey); }
  acaoSubirNivel(ev, alvo) { return M.subirNivel(this.actor, int(alvo.dataset.arquetipo, 1)); }
  acaoMoedas(ev, alvo) { return M.operarMoedas(this.actor, alvo.dataset.operacao); }

  acaoFiltroRaridade(ev, alvo) {
    const r = alvo.dataset.raridade;
    if (!r) this._filtroRaridades.clear();
    else if (this._filtroRaridades.has(r)) this._filtroRaridades.delete(r);
    else this._filtroRaridades.add(r);
    this.render({ parts: ["inventario"] });
  }

  async acaoCriarItem(ev, alvo) {
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{ name: alvo.dataset.nome || "Novo item", type: alvo.dataset.tipo }]);
    item?.sheet?.render(true);
  }

  acaoExpandirItem(ev, alvo) {
    const id = alvo.dataset.itemId;
    if (this._expandidos.has(id)) this._expandidos.delete(id);
    else this._expandidos.add(id);
    const tipo = this.actor.items.get(id)?.type;
    this.render({ parts: [tipo === "spell" ? "magias" : tipo === "feat" ? "habilidades" : "inventario"] });
  }

  async acaoQuantidade(ev, alvo) {
    const item = this._item(alvo);
    if (!item) return;
    const delta = int(alvo.dataset.delta) * (ev.shiftKey ? 5 : 1);
    await item.update({ "system.quantity": Math.max(0, num(item.system?.quantity, 1) + delta) });
  }

  async acaoEquiparItem(ev, alvo) {
    const item = this._item(alvo);
    if (item) await item.update({ "system.equipped": !item.system?.equipped });
  }

  async acaoFavoritar(ev, alvo) {
    const item = this._item(alvo);
    if (item) await item.update({ [`flags.${FLAG}.favorito`]: !item.flags?.[FLAG]?.favorito });
  }

  acaoChatItem(ev, alvo) {
    const item = this._item(alvo);
    if (item) return M.cartaoItem(this.actor, item);
  }

  acaoEditarItem(ev, alvo) { this._item(alvo)?.sheet?.render(true); }

  async acaoExcluirItem(ev, alvo) {
    const item = this._item(alvo);
    if (!item) return;
    if (!(await M.confirmar("Excluir", `<p>Excluir <strong>${escapar(item.name)}</strong>?</p>`))) return;
    this._expandidos.delete(item.id);
    await item.delete();
  }

  acaoUsarItem(ev, alvo) {
    const item = this._item(alvo);
    if (item) return M.usarItem(this.actor, item);
  }

  acaoAtacar(ev, alvo) { return M.dialogoAtaque(this.actor, alvo.dataset.tipo, alvo.dataset.ref); }

  async acaoNovoAtaque() {
    await this.actor.update({
      [`${P}.ataques.${novoId()}`]: { nome: "Novo ataque", pericia: "luta", bonusAcerto: 0, dano: "1d6", tipoDano: "", critMargem: 20, critMult: 2, notas: "", criado: Date.now() }
    });
  }

  async acaoExcluirAtaque(ev, alvo) {
    const nome = this.actor.flags?.[FLAG]?.ataques?.[alvo.dataset.ref]?.nome || "este ataque";
    if (!(await M.confirmar("Excluir ataque", `<p>Excluir <strong>${escapar(nome)}</strong>?</p>`))) return;
    await this.actor.update({ [`${P}.ataques.-=${alvo.dataset.ref}`]: null });
  }

  async acaoNovoBonusCena() {
    await this.actor.update({ [`${P}.bonusCena.${novoId()}`]: { nome: "", ativo: false, acerto: 0, dano: "", criado: Date.now() } });
  }

  async acaoExcluirBonusCena(ev, alvo) {
    await this.actor.update({ [`${P}.bonusCena.-=${alvo.dataset.ref}`]: null });
  }

  acaoAlternarTemp() {
    if (!this.isEditable) return;
    this._tempAberto = !this._tempAberto;
    this._focarTemp = this._tempAberto;
    this.render({ parts: ["header"] });
  }

  acaoDanoArma(ev, alvo) {
    const item = this._item(alvo);
    if (item) return M.danoDeArma(this.actor, item);
  }

  async acaoNovoPoder(ev, alvo) {
    const tipo = alvo.dataset.tipo === "magia" ? "magia" : "habilidade";
    const circulo = tipo === "magia" ? Math.min(6, Math.max(0, int(this._abas.magias, 0))) : 0;
    const item = await M.dialogoNovoPoder(this.actor, tipo, circulo);
    if (item) abrirEditorPoder(item);
  }

  acaoUsarPoder(ev, alvo) {
    const item = this._item(alvo);
    if (item) return M.usarPoder(this.actor, item, { evento: ev });
  }

  acaoEditarPoder(ev, alvo) {
    const item = this._item(alvo);
    if (item) abrirEditorPoder(item);
  }

  async acaoDuplicarPoder(ev, alvo) {
    const item = this._item(alvo);
    if (!item) return;
    const data = item.toObject();
    delete data._id;
    data.name = `${item.name} (variante)`;
    foundry.utils.setProperty(data, `flags.${FLAG}.favorito`, false);
    const [novo] = await this.actor.createEmbeddedDocuments("Item", [data]);
    if (novo) abrirEditorPoder(novo);
  }

  _paginasOrdenadas() {
    return Object.entries(this.actor.flags?.[FLAG]?.notas?.paginas ?? {})
      .filter(([, p]) => p)
      .map(([id, p]) => ({ id, ordem: num(p.ordem), nome: p.nome ?? "" }))
      .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"));
  }

  async acaoNovaPagina() {
    const r = await fvtt.DialogV2.wait({
      window: { title: "Nova página" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
      content: `<label class="epm-campo"><span>Nome</span><input type="text" name="nome" value="Nova página" autofocus></label>
        <fieldset class="epm-aquisicao"><legend>Tipo</legend>
          <label class="epm-check"><input type="radio" name="tipo" value="texto" checked> Texto livre</label>
          <label class="epm-check"><input type="radio" name="tipo" value="mapa"> Mapa mental</label>
        </fieldset>`,
      buttons: [
        { action: "ok", label: "Criar", icon: "fa-solid fa-check", default: true, callback: (e, b) => ({ nome: b.form.elements.nome.value.trim(), tipo: b.form.elements.tipo.value }) },
        { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
      ]
    });
    if (!r || typeof r !== "object") return;
    const paginas = this._paginasOrdenadas();
    const id = novoId();
    this._abas.notas = id;
    await this.actor.update({
      [`${P}.notas.paginas.${id}`]: {
        nome: r.nome || "Sem título", tipo: r.tipo === "mapa" ? "mapa" : "texto",
        ordem: paginas.length ? paginas[paginas.length - 1].ordem + 1 : 0, texto: "", nos: {}, conexoes: {}
      }
    });
  }

  async acaoRenomearPagina(ev, alvo) {
    const id = alvo.dataset.pagina;
    const atual = this.actor.flags?.[FLAG]?.notas?.paginas?.[id]?.nome ?? "";
    const nome = await M.perguntarTexto("Renomear página", "Nome", atual);
    if (nome) await this.actor.update({ [`${P}.notas.paginas.${id}.nome`]: nome });
  }

  async acaoExcluirPagina(ev, alvo) {
    const id = alvo.dataset.pagina;
    const nome = this.actor.flags?.[FLAG]?.notas?.paginas?.[id]?.nome ?? "esta página";
    if (!(await M.confirmar("Excluir página", `<p>Excluir <strong>${escapar(nome)}</strong> e tudo o que há nela?</p>`))) return;
    if (this._abas.notas === id) this._abas.notas = null;
    delete this._estadoMapas[id];
    await this.actor.update({ [`${P}.notas.paginas.-=${id}`]: null });
  }

  async acaoMoverPagina(ev, alvo) {
    const lista = this._paginasOrdenadas();
    const i = lista.findIndex(p => p.id === alvo.dataset.pagina);
    const j = i + int(alvo.dataset.dir);
    if (i < 0 || j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    await this.actor.update(Object.fromEntries(lista.map((p, k) => [`${P}.notas.paginas.${p.id}.ordem`, k])));
  }

  async acaoAlternarCondicao(ev, alvo) {
    const id = alvo.dataset.condicao;
    const cond = CONDICOES.find(c => c.id === id);
    if (!cond) return;
    const ativa = this.actor.statuses?.has(id);
    if (!ativa && this._estado().ficha.condicoes.find(c => c.id === id)?.imune) {
      ui.notifications.info(`${this.actor.name} é imune a ${cond.label}: a condição fica marcada, mas sem efeito.`);
    }
    try {
      await this.actor.toggleStatusEffect(id, { active: !ativa });
    } catch (err) {
      console.error("EPM |", err);
      ui.notifications.error(`Não foi possível alternar ${cond.label}. Recarregue o mundo para registrar as condições do módulo.`);
    }
  }

  async acaoRemoverTag(ev, alvo) {
    const campo = alvo.dataset.campo;
    const lista = (this.actor.flags?.[FLAG]?.[campo] ?? []).filter(v => v !== alvo.dataset.valor);
    await this.actor.update({ [`${P}.${campo}`]: lista });
  }

  async acaoNovaBencao(ev, alvo) {
    const tipo = alvo.dataset.tipo === "maldicao" ? "maldicao" : "bencao";
    await this.actor.update({
      [`${P}.bencaos.${novoId()}`]: { nome: "", tipo, ativo: true, origem: "", descricao: "", mods: {}, criado: Date.now() }
    });
  }

  async acaoExcluirBencao(ev, alvo) {
    const id = alvo.dataset.bencao;
    const b = this.actor.flags?.[FLAG]?.bencaos?.[id];
    const nome = b?.nome || (b?.tipo === "maldicao" ? "esta maldição" : "esta bênção");
    if (!(await M.confirmar("Excluir", `<p>Excluir <strong>${escapar(nome)}</strong>?</p>`))) return;
    await this.actor.update({ [`${P}.bencaos.-=${id}`]: null });
  }

  async acaoAdicionarMod(ev, alvo) {
    await this.actor.update({ [`${P}.bencaos.${alvo.dataset.bencao}.mods.${novoId()}`]: { alvo: "", valor: 1 } });
  }

  async acaoRemoverMod(ev, alvo) {
    await this.actor.update({ [`${P}.bencaos.${alvo.dataset.bencao}.mods.-=${alvo.dataset.mod}`]: null });
  }

  async acaoNovaRelacao() {
    await this.actor.update({
      [`${P}.relacoes.${novoId()}`]: { nome: "", img: "", uuid: "", tipo: "aliado", afinidade: 0, notas: "", criado: Date.now() }
    });
  }

  async acaoExcluirRelacao(ev, alvo) {
    const id = alvo.dataset.relacao;
    const nome = this.actor.flags?.[FLAG]?.relacoes?.[id]?.nome || "esta relação";
    if (!(await M.confirmar("Excluir relação", `<p>Excluir <strong>${escapar(nome)}</strong>?</p>`))) return;
    await this.actor.update({ [`${P}.relacoes.-=${id}`]: null });
  }

  async acaoAbrirRelacao(ev, alvo) {
    const doc = alvo.dataset.uuid ? await fromUuid(alvo.dataset.uuid) : null;
    if (doc?.sheet) doc.sheet.render(true);
    else ui.notifications.warn("Personagem não encontrado. Ele pode ter sido apagado.");
  }
}
