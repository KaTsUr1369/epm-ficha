/**
 * Ficha de personagem EPM (ApplicationV2), registrada para atores "character" do dnd5e.
 * Os dados ficam em actor.flags["epm-ficha"]; a Vida usa system.attributes.hp do dnd5e.
 */
import {
  FLAG, CAMINHO, TIPOS_IGNORADOS, CONDICOES, TEXTOS_SOBRE, PERICIAS_OBSOLETAS, ABAS, CATEGORIAS_ITEM,
  CATEGORIA_MOCHILAS, COMBINACOES, CONDICOES_RENOMEADAS, COR_PADRAO, BRILHO_PADRAO, TIPOS_EFEITO_ITEM,
  MODULE_ID, SUBABAS_HABILIDADE, EXEMPLOS_TREINAMENTO
} from "./config.mjs";
import {
  num, int, slug, novoId, normalizarTexto, periciasParaLista, periciasParaObjeto, migrarPericias, atributosDaPericia,
  entradaPericia, migrarDados, VERSAO_DADOS, ordenarPorLista, moverNaLista
} from "./data.mjs";
import { montarContexto, lerAtor, visualDaFicha } from "./context.mjs";
import * as X from "./extras.mjs";
import * as PJ from "./projetos.mjs";
import * as PR from "./producao.mjs";
import { fvtt, enriquecer, editorHTML, dadosDeArraste, escapar } from "./helpers.mjs";
import { ajustes, listaPericias, salvarListaPericias, lerMundo } from "./settings.mjs";
import * as mundo from "./mundo.mjs";
import { NOMES_ACOES_060, METODOS_060 } from "./ficha-060.mjs";
import * as M from "./mecanicas.mjs";
import { MapaMental } from "./mind-map.mjs";
import { abrirEditorPoder } from "./poder-sheet.mjs";
import { escolherImagem, verImagem } from "./imagens.mjs";
import { catalogoIdiomas, polyglotAtivo, adicionarIdioma, removerIdioma, migrarIdiomas } from "./idiomas.mjs";
import { dadosDoParceiro, dialogoConectar, relacaoMultipla, conectar } from "./relacoes.mjs";
import { aplicarPaleta, ligarPersonalizacao } from "./personalizacao.mjs";
import { CATALOGO, entradaCatalogo, dadosNovaEntrada } from "./bencaos.mjs";
import { jogarMinijogo } from "./minijogos.mjs";
import { abrirEditorItem } from "./item-sheet.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const P = `flags.${FLAG}`;
const TIPO_ABA = "application/x-epm-aba";
const TIPO_CATEGORIA = "application/x-epm-categoria";

const ACOES_FICHA = [
  "aba", "irAba", "alternarEdicao", "editarImagem", "imagemItem", "imagemSobre", "removerImagemSobre", "verImagem",
  "ajustarRecurso", "rolarAtributo", "rolarPericia", "rolarIniciativa", "alternarAtributoPericia", "adicionarPericia", "removerPericia", "sincronizarPericias", "salvarPericiasPadrao",
  "defesa", "alternarAcao", "novoTurno", "exaustao", "descanso",
  "converter", "subirNivel", "moedas", "filtroRaridade",
  "criarItem", "expandirItem", "quantidade", "equiparItem", "favoritar", "chatItem", "editarItem", "excluirItem",
  "usarItem", "atacar", "danoArma", "novoAtaque", "excluirAtaque", "novoBonusCena", "excluirBonusCena", "alternarTemp",
  "abrirMochila", "tirarDaMochila", "moverCategoria", "restaurarOrdemCategorias", "adicionarEfeitoItem", "removerEfeitoItem",
  "novoPoder", "usarPoder", "editarPoder", "duplicarPoder",
  "novaPagina", "renomearPagina", "excluirPagina", "moverPagina",
  "alternarCondicao", "soAtivas", "aplicarCombinacao", "removerCombinacao", "removerTag", "removerIdioma",
  "novaBencao", "excluirBencao", "adicionarMod", "removerMod", "abrirCatalogo", "tipoCatalogo", "adicionarDoCatalogo",
  "usarBencao", "encerrarBencao", "recarregarBencao", "chatBencao",
  "novaRelacao", "excluirRelacao", "abrirRelacao", "conectarRelacao", "relacaoMultipla", "ajustarAfinidade", "abrirBackground",
  "corPronta", "corPadrao", "moverAba", "restaurarOrdemAbas", "alternarAbaOpcional",
  "favoritarPericia", "favoritasNoTopo", "recolherPainel",
  "treinoGanharPT", "treinoConversa", "novoTreinamento", "exemploTreinamento", "excluirTreinamento", "comecarTreinamento",
  "treinarHoras", "adicionarModTreino", "removerModTreino", "minijogo", "guardarMoedasMochila", "pegarMoedasMochila",
  // 0.5.4
  "selecionarPoderes", "selecaoTudo", "selecaoLimpar", "selecaoAcao",
  "novaTransformacao", "excluirTransformacao", "transformar", "imagemTransformacao", "adicionarModTransf", "removerModTransf",
  "adicionarHabilidadeArq", "alternarEstilo", "alternarUtensilio", "recuperarMana", "cacadorNatural",
  "novoCompanheiro", "excluirCompanheiro", "imagemCompanheiro", "ajustarCompanheiro", "novoAtaqueCompanheiro", "excluirAtaqueCompanheiro",
  "rolarAtaqueCompanheiro", "abrirLigado", "criarAutomato",
  "novaCriatura", "excluirCriatura", "imagemCriatura", "contarCriatura",
  "novaSessao", "excluirSessao", "somarSessao",
  "novaFaccao", "excluirFaccao", "imagemFaccao", "ajustarReputacao",
  "ataqueOportunidade", "atrasarTurno", "ressonancia", "pularHoras",
  "imagemFundo", "removerFundo", "visualPadrao", "tocarMusica", "recarregarArma", "encerrarSustentada",
  "novaRd", "removerRd",
  "novaReceita", "apagarReceita", "alternarProfissao", "novoIngrediente", "removerIngrediente", "ligarResultado",
  "produzir", "testarProducao", "terminarProducao", "apagarProducao",
  "criarProjeto", "usarProjeto", "apagarProjeto", "guardarProjeto", "apagarDoLivro", "encerrarEfeitoProjeto",
  // 0.6.0
  ...NOMES_ACOES_060
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
    this._abas = { primary: "principal", magias: "0", habilidades: "geral", arqclasse: "arquetipo", condicoes: "oficiais", notas: null };
    this._expandidos = new Set();
    this._filtroRaridades = new Set();
    this._modoEdicao = null;
    this._ajustesRecurso = {};
    this._tempAberto = null;
    this._focarTemp = false;
    this._estadoMapas = {};
    this._mapas = [];
    this._mapaOcupado = false;
    this._notasPendente = false;
    this._condicoesUi = { busca: "", soAtivas: false, abertas: null };
    this._bencaosUi = { aberto: false, busca: "", tipo: "bencao" };
    this._relacoesAbertas = new Set();
    this._mochilasFechadas = new Set();
    this._arrasto = null;
    this._selecao = { aba: null, ids: new Set() };
    this._barrasAntes = null;
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
    arqclasse: { template: `${CAMINHO}/actor/arqclasse.hbs`, scrollable: [""] },
    magias: { template: `${CAMINHO}/actor/magias.hbs`, scrollable: [""] },
    treinamentos: { template: `${CAMINHO}/actor/treinamentos.hbs`, scrollable: [""] },
    sobre: { template: `${CAMINHO}/actor/sobre.hbs`, scrollable: [""] },
    anotacoes: { template: `${CAMINHO}/actor/anotacoes.hbs`, scrollable: [""] },
    condicoes: { template: `${CAMINHO}/actor/condicoes.hbs`, scrollable: [""] },
    bencaos: { template: `${CAMINHO}/actor/bencaos.hbs`, scrollable: [""] },
    relacoes: { template: `${CAMINHO}/actor/relacoes.hbs`, scrollable: [""] },
    companheiros: { template: `${CAMINHO}/actor/companheiros.hbs`, scrollable: [""] },
    bestiario: { template: `${CAMINHO}/actor/bestiario.hbs`, scrollable: [""] },
    producao: { template: `${CAMINHO}/actor/producao.hbs`, scrollable: [""] },
    personalizacao: { template: `${CAMINHO}/actor/personalizacao.hbs`, scrollable: [""] }
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
      const editores = { sobre: {}, notas: {}, arqclasse: {} };
      enriquecidos.arqclasse = {};
      for (const id of ["arquetipo", "classe"]) {
        const valor = bruto.arqclasse?.[id]?.notas ?? "";
        enriquecidos.arqclasse[id] = await enriquecer(valor, { relativeTo: actor, secrets: segredos });
        editores.arqclasse[id] = editorHTML({ name: `${P}.arqclasse.${id}.notas`, value: valor, documentUUID: actor.uuid, enriched: enriquecidos.arqclasse[id] });
      }
      for (const t of TEXTOS_SOBRE) {
        const valor = bruto.sobre?.[t.id] ?? "";
        enriquecidos.sobre[t.id] = await enriquecer(valor, { relativeTo: actor, secrets: segredos });
        editores.sobre[t.id] = editorHTML({ name: `${P}.sobre.${t.id}`, value: valor, documentUUID: actor.uuid, enriched: enriquecidos.sobre[t.id] });
      }
      if (segredos || game.user.isGM) {
        const valor = bruto.sobre?.segredos ?? "";
        enriquecidos.sobre.segredos = await enriquecer(valor, { relativeTo: actor, secrets: true });
        editores.sobre.segredos = editorHTML({ name: `${P}.sobre.segredos`, value: valor, documentUUID: actor.uuid, enriched: enriquecidos.sobre.segredos });
      }
      for (const [pid, pagina] of Object.entries(bruto.notas?.paginas ?? {})) {
        if (!pagina || pagina.tipo === "mapa") continue;
        editores.notas[pid] = editorHTML({
          name: `${P}.notas.paginas.${pid}.texto`, value: pagina.texto ?? "", documentUUID: actor.uuid,
          enriched: await enriquecer(pagina.texto ?? "", { relativeTo: actor, secrets: segredos })
        });
      }
      // Parceiros das relações (nome, imagem e background atuais)
      const parceiros = new Map();
      for (const r of Object.values(bruto.relacoes ?? {})) {
        if (!r?.uuid || parceiros.has(r.uuid)) continue;
        try { parceiros.set(r.uuid, await dadosDoParceiro(r.uuid)); } catch (err) { console.warn("EPM |", err); }
      }
      const cfg = ajustes();
      const contexto = montarContexto({
        actor,
        itens: actor.items.contents,
        ui: {
          abas: this._abas, expandidos: this._expandidos, filtroRaridades: this._filtroRaridades,
          edicao: this._modoEdicao, tempAberto: this._tempAberto, limitado: this._visaoLimitada(),
          condicoes: this._condicoesUi, bencaos: this._bencaosUi, relacoesAbertas: this._relacoesAbertas,
          mochilasFechadas: this._mochilasFechadas, selecao: this._selecao
        },
        ajustes: { modoLimites: cfg.modoLimites, listaPericias: listaPericias(), afinidadeSoMestre: cfg.afinidadeSoMestre },
        usuario: { isGM: game.user.isGM, dono: actor.isOwner },
        enriquecidos, editores,
        editavel: this.isEditable,
        idiomas: { catalogo: catalogoIdiomas(), polyglot: polyglotAtivo() },
        atores: { porUuid: uuid => parceiros.get(uuid) ?? null },
        mundo060: (() => {
          const den = mundo.densidadeAtual();
          const pend = mundo.atualizacoesPendentes(bruto);
          const pendentes = Object.entries(pend).flatMap(([tipo, ids]) => [...ids].map(id => ({ tipo, id, nome: bruto?.[tipo]?.[id]?.nome || "Sem nome", tipoLabel: mundo.TIPOS_COMPENDIO[tipo].label })));
          const comp = lerMundo("compendioMundo", {}) ?? {};
          return { relogios: mundo.relogiosVisiveis(game.user.isGM), regiao: mundo.regiaoAtual(), densidade: { id: den, ...mundo.DENSIDADES[den] }, conhecimento: lerMundo("conhecimentoCriaturas", {}),
            compendio: { pendentes, tipos: Object.entries(mundo.TIPOS_COMPENDIO).map(([tipo, t]) => ({ tipo, ...t, qtd: Object.keys(comp[tipo] ?? {}).length })) } };
        })()
      });
      if (!contexto.abas.some(a => a.id === this._abas.primary)) this._abas.primary = contexto.abaAtual;
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
    const pers = this.actor.flags?.[FLAG]?.personalizacao ?? {};
    aplicarPaleta(this.element, pers.cor ?? COR_PADRAO, pers.brilho ?? BRILHO_PADRAO);
    try { this._aplicarVisual(pers); } catch (err) { console.error("EPM | Falha no visual da ficha", err); }
    if (options.isFirstRender || options.parts?.includes("header")) {
      try { this._animarBarras(); } catch (err) { console.error("EPM | Falha ao animar as barras", err); }
    }
    if (options.isFirstRender || options.parts?.includes("bestiario")) this._filtrarBestiario();
    if (options.isFirstRender || options.parts?.includes("anotacoes")) {
      try { this._montarMapas(); } catch (err) { console.error("EPM | Falha ao montar o mapa mental", err); }
    }
    if (options.isFirstRender || options.parts?.includes("personalizacao")) {
      try { ligarPersonalizacao(this.element, this.actor); } catch (err) { console.error("EPM | Falha na personalização", err); }
    }
    if (options.isFirstRender || options.parts?.includes("condicoes")) this._filtrarCondicoes();
    if (options.isFirstRender || options.parts?.includes("bencaos")) this._filtrarCatalogo();
    try { this._ligarRecolher(); } catch (err) { console.error("EPM | Falha ao preparar os painéis recolhíveis", err); }
    if (this._focarTemp) {
      this._focarTemp = false;
      const campo = this.element.querySelector('[data-recurso-valor^="temp"]');
      campo?.focus();
      campo?.select();
    }
  }

  async _onClose(options) {
    for (const m of this._mapas) m.destruir();
    this._mapas = [];
    this._barrasAntes = null;
    this._selecao = { aba: null, ids: new Set() };
    return super._onClose(options);
  }

  /** Grava a lista de perícias em fichas novas e traz fichas antigas para o formato atual. */
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
      await this.actor.update({ [`${P}.pericias`]: periciasParaObjeto(listaPericias()), [`${P}.versao`]: VERSAO_DADOS });
      return;
    }
    if (int(bruto.versao) < 2) {
      const mudancas = migrarPericias(bruto.pericias, listaPericias(), PERICIAS_OBSOLETAS);
      const updates = Object.fromEntries(Object.entries(mudancas).map(([k, v]) => [`${P}.pericias.${k}`, v]));
      updates[`${P}.versao`] = 2;
      await this.actor.update(updates);
      ui.notifications.info(`${this.actor.name}: perícias atualizadas para a lista oficial.`);
    }
    if (int(this.actor.flags?.[FLAG]?.versao) < VERSAO_DADOS) await this._migrarPara3();
  }

  /** Migração para os dados atuais: Kan vira Dracmas, idiomas no campo do dnd5e, condições renomeadas, Vontade com Autocontrole. */
  async _migrarPara3() {
    const bruto = this.actor.flags?.[FLAG] ?? {};
    const updates = Object.fromEntries(Object.entries(migrarDados(bruto)).map(([k, v]) => [`${P}.${k}`, v]));
    Object.assign(updates, migrarIdiomas(this.actor) ?? {});
    await this.actor.update(updates);
    for (const efeito of this.actor.effects?.contents ?? []) {
      const antigos = [...(efeito.statuses ?? [])].filter(s => CONDICOES_RENOMEADAS[s]);
      if (!antigos.length) continue;
      try {
        await efeito.delete();
        for (const s of antigos) if (!this.actor.statuses?.has(CONDICOES_RENOMEADAS[s])) await this.actor.toggleStatusEffect(CONDICOES_RENOMEADAS[s], { active: true });
      } catch (err) { console.warn("EPM | Migração de condição", err); }
    }
    console.log(`EPM | ${this.actor.name} migrado para os dados da versão ${VERSAO_DADOS}`);
  }

  /* -------------------------------------------- */
  /*  Eventos (delegados no elemento raiz)        */
  /* -------------------------------------------- */

  _ligarEventos() {
    const raiz = this.element;
    raiz.addEventListener("change", ev => this._onMudancaLocal(ev), { capture: true });
    raiz.addEventListener("keydown", ev => this._onTeclaLocal(ev), { capture: true });
    raiz.addEventListener("input", ev => this._onDigitar(ev), { capture: true });
    raiz.addEventListener("toggle", ev => this._onAbrirCategoria(ev), { capture: true });
    raiz.addEventListener("dragstart", ev => this._onArrastarItem(ev));
    raiz.addEventListener("dragover", ev => this._onArrastarSobre(ev), { capture: true });
    raiz.addEventListener("dragleave", ev => this._onArrastarFora(ev), { capture: true });
    raiz.addEventListener("dragend", () => this._limparArrasto());
    raiz.addEventListener("drop", ev => this._onSoltarReordenar(ev), { capture: true });
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
    if (alvo.dataset?.idiomaInput) { ev.stopPropagation(); return this._adicionarIdioma(alvo); }
    if (alvo.dataset?.selecionarPoder) { ev.stopPropagation(); return this._marcarPoder(alvo.dataset.selecionarPoder, alvo.checked); }
    if (alvo.dataset?.buscaCondicao || alvo.dataset?.buscaCatalogo || alvo.dataset?.novoEfeito || alvo.dataset?.buscaBestiario) { ev.stopPropagation(); return; }
    // Brilho e hex da Personalização: os próprios campos tratam (e param o evento) — não parar aqui.
  }

  _onTeclaLocal(ev) {
    const alvo = ev.target;
    const eTemp = String(alvo.dataset?.recursoValor ?? "").startsWith("temp");
    if (ev.key === "Escape" && eTemp) {
      ev.preventDefault();
      ev.stopPropagation();
      this._tempAberto = null;
      return this.render({ parts: ["header"] });
    }
    if (ev.key !== "Enter") return;
    if (eTemp) {
      ev.preventDefault();
      ev.stopPropagation();
      this._tempAberto = null;
      return this._mudarRecurso(alvo).then(() => this.render({ parts: ["header"] }));
    }
    if (alvo.dataset?.tagCampo) { ev.preventDefault(); ev.stopPropagation(); return this._adicionarTag(alvo); }
    if (alvo.dataset?.idiomaInput) { ev.preventDefault(); ev.stopPropagation(); return this._adicionarIdioma(alvo); }
    if (alvo.dataset?.hexCor !== undefined) { ev.preventDefault(); alvo.blur(); return; }
    if (alvo.dataset?.buscaCondicao || alvo.dataset?.buscaCatalogo || alvo.dataset?.buscaBestiario !== undefined) { ev.preventDefault(); ev.stopPropagation(); return; }
    if (alvo.dataset?.recursoValor) { ev.preventDefault(); ev.stopPropagation(); return this._mudarRecurso(alvo); }
  }

  /** Busca das condições e do catálogo: filtra na hora, sem redesenhar a ficha. */
  _onDigitar(ev) {
    const alvo = ev.target;
    if (alvo.dataset?.buscaCondicao) {
      ev.stopPropagation();
      this._condicoesUi.busca = alvo.value;
      this._filtrarCondicoes();
    } else if (alvo.dataset?.buscaCatalogo) {
      ev.stopPropagation();
      this._bencaosUi.busca = alvo.value;
      this._filtrarCatalogo();
    } else if (alvo.dataset?.buscaBestiario !== undefined) {
      ev.stopPropagation();
      this._buscaBestiario = alvo.value;
      this._filtrarBestiario();
    }
  }

  _filtrarCondicoes() {
    const aba = this.element?.querySelector(".epm-condicoes");
    if (!aba) return;
    const termo = normalizarTexto(this._condicoesUi.busca);
    let visiveis = 0;
    for (const cat of aba.querySelectorAll(".epm-categoria-condicao")) {
      let naCategoria = 0;
      let ativas = 0;
      for (const c of cat.querySelectorAll(".epm-condicao")) {
        const ok = !termo || c.dataset.busca.includes(termo);
        c.hidden = !ok;
        if (ok) naCategoria++;
        if (c.classList.contains("ativa") || c.classList.contains("automatica")) ativas++;
      }
      cat.hidden = !naCategoria;
      cat.classList.toggle("sem-ativas", !ativas);
      if (termo && naCategoria) cat.open = true;
      visiveis += naCategoria;
    }
    const vazio = aba.querySelector(".epm-busca-vazia");
    if (vazio) vazio.hidden = visiveis > 0;
  }

  _filtrarCatalogo() {
    const cat = this.element?.querySelector(".epm-catalogo");
    if (!cat) return;
    const termo = normalizarTexto(this._bencaosUi.busca);
    let total = 0;
    for (const grupo of cat.querySelectorAll(".epm-catalogo-grupo")) {
      let noGrupo = 0;
      for (const r of grupo.querySelectorAll(".epm-catalogo-raridade")) {
        let naRaridade = 0;
        for (const it of r.querySelectorAll(".epm-catalogo-item")) {
          const ok = !termo || it.dataset.busca.includes(termo);
          it.hidden = !ok;
          if (ok) naRaridade++;
        }
        r.hidden = !naRaridade;
        noGrupo += naRaridade;
      }
      grupo.hidden = !noGrupo;
      total += noGrupo;
    }
    const vazio = cat.querySelector(".epm-busca-vazia");
    if (vazio) vazio.hidden = total > 0;
  }

  /** Lembra quais categorias de condição estão abertas. */
  _onAbrirCategoria(ev) {
    const det = ev.target;
    if (!det?.matches?.(".epm-categoria-condicao")) return;
    if (!this._condicoesUi.abertas) {
      this._condicoesUi.abertas = new Set([...this.element.querySelectorAll(".epm-categoria-condicao[open]")].map(d => d.dataset.categoriaCondicao));
    }
    if (det.open) this._condicoesUi.abertas.add(det.dataset.categoriaCondicao);
    else this._condicoesUi.abertas.delete(det.dataset.categoriaCondicao);
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
    if (id.startsWith("temp-")) {
      const rid = id.slice(5);
      if (!recursos[rid]) return null;
      return { value: recursos[rid].temp ?? 0, max: 0, caminho: `${P}.recursos.${rid}.temp` };
    }
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
    const salvo = foundry.utils.getProperty(this.actor.flags?.[FLAG] ?? {}, campo);
    const atual = Array.isArray(salvo) ? [...salvo] : [];
    if (atual.some(v => normalizarTexto(v) === normalizarTexto(valor))) return;
    atual.push(valor);
    await this.actor.update({ [`${P}.${campo}`]: atual });
  }

  async _adicionarIdioma(input) {
    const valor = input.value.trim();
    input.value = "";
    if (valor) await adicionarIdioma(this.actor, valor);
  }

  /* -------------------------------------------- */
  /*  Arrastar: itens, mochilas, abas, categorias */
  /* -------------------------------------------- */

  _onArrastarItem(ev) {
    const aba = ev.target.closest?.("[data-aba-id][draggable]");
    if (aba && this._modoEdicao) {
      ev.dataTransfer.setData(TIPO_ABA, aba.dataset.abaId);
      ev.dataTransfer.effectAllowed = "move";
      this._arrasto = { tipo: "aba", id: aba.dataset.abaId };
      aba.classList.add("arrastando");
      return;
    }
    const cat = ev.target.closest?.("[data-categoria-id][draggable]");
    if (cat && this._modoEdicao) {
      ev.dataTransfer.setData(TIPO_CATEGORIA, cat.dataset.categoriaId);
      ev.dataTransfer.effectAllowed = "move";
      this._arrasto = { tipo: "categoria", id: cat.dataset.categoriaId };
      cat.closest(".epm-categoria")?.classList.add("arrastando");
      return;
    }
    const li = ev.target.closest?.("[data-item-id][draggable]");
    if (!li) return;
    const item = this.actor.items.get(li.dataset.itemId);
    if (!item) return;
    this._arrasto = { tipo: "item", id: item.id };
    ev.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
  }

  _limparArrasto() {
    this._arrasto = null;
    for (const el of this.element.querySelectorAll(".arrastando, .alvo-antes, .alvo-depois, .epm-soltar-aqui")) {
      el.classList.remove("arrastando", "alvo-antes", "alvo-depois", "epm-soltar-aqui");
    }
  }

  /** Mostra onde a aba, a categoria ou o item vai cair. */
  _onArrastarSobre(ev) {
    const tipos = [...(ev.dataTransfer?.types ?? [])];
    const marcar = (alvo, seletor) => {
      for (const el of this.element.querySelectorAll(seletor)) if (el !== alvo) el.classList.remove("alvo-antes", "alvo-depois");
      if (!alvo) return;
      const caixa = alvo.getBoundingClientRect();
      const antes = ev.clientY < caixa.top + caixa.height / 2;
      alvo.classList.toggle("alvo-antes", antes);
      alvo.classList.toggle("alvo-depois", !antes);
    };
    if (tipos.includes(TIPO_ABA)) {
      ev.preventDefault();
      marcar(ev.target.closest?.(".epm-nav-item"), ".epm-nav-item");
      return;
    }
    if (tipos.includes(TIPO_CATEGORIA)) {
      ev.preventDefault();
      marcar(ev.target.closest?.(".epm-categoria"), ".epm-categoria");
      return;
    }
    const mochila = ev.target.closest?.("[data-container-id]");
    for (const el of this.element.querySelectorAll(".epm-soltar-aqui")) if (el !== mochila) el.classList.remove("epm-soltar-aqui");
    if (mochila && this._arrasto?.id !== mochila.dataset.containerId) mochila.classList.add("epm-soltar-aqui");
  }

  _onArrastarFora(ev) {
    if (ev.target?.classList?.contains("epm-soltar-aqui") && !ev.target.contains(ev.relatedTarget)) ev.target.classList.remove("epm-soltar-aqui");
  }

  /** Solta uma aba ou categoria (reordenar). Itens e atores seguem para _onDrop. */
  async _onSoltarReordenar(ev) {
    const tipos = [...(ev.dataTransfer?.types ?? [])];
    const eAba = tipos.includes(TIPO_ABA);
    const eCategoria = tipos.includes(TIPO_CATEGORIA);
    if (!eAba && !eCategoria) {
      this.element.querySelectorAll(".epm-soltar-aqui").forEach(el => el.classList.remove("epm-soltar-aqui"));
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    const id = ev.dataTransfer.getData(eAba ? TIPO_ABA : TIPO_CATEGORIA);
    const alvo = eAba ? ev.target.closest?.(".epm-nav-item") : ev.target.closest?.(".epm-categoria");
    this._limparArrasto();
    if (!alvo || !this.isEditable) return;
    const alvoId = eAba ? alvo.dataset.abaId : alvo.dataset.categoria;
    if (!alvoId || alvoId === id) return;
    const caixa = alvo.getBoundingClientRect();
    const antes = ev.clientY < caixa.top + caixa.height / 2;
    const ids = eAba ? ABAS.map(a => a.id) : CATEGORIAS_ITEM.map(c => c.id);
    const salvo = eAba ? this.actor.flags?.[FLAG]?.ui?.ordemAbas : this.actor.flags?.[FLAG]?.ui?.ordemCategorias;
    const atual = ordenarPorLista(ids, salvo);
    const semId = atual.filter(x => x !== id);
    const i = semId.indexOf(alvoId);
    const antesDe = antes ? alvoId : (semId[i + 1] ?? null);
    const nova = moverNaLista(atual, id, antesDe);
    await this.actor.update({ [`${P}.ui.${eAba ? "ordemAbas" : "ordemCategorias"}`]: nova });
  }

  async _onDrop(event) {
    event.preventDefault?.();
    if (!this.isEditable) return;
    const tipos = [...(event.dataTransfer?.types ?? [])];
    if (tipos.includes(TIPO_ABA) || tipos.includes(TIPO_CATEGORIA)) return;
    const dados = dadosDeArraste(event);
    this._limparArrasto();
    if (dados?.type === "Item") return this._soltarItem(dados, event);
    if (dados?.type === "Actor") return this._soltarAtor(dados);
  }

  async _soltarItem(dados, event = null) {
    const item = await Item.implementation.fromDropData(dados);
    if (!item) return;
    const mochilaId = event?.target?.closest?.("[data-container-id]")?.dataset.containerId ?? null;
    const mochila = mochilaId ? this.actor.items.get(mochilaId) : null;
    if (item.parent?.uuid === this.actor.uuid) {
      if (mochila && mochila.id !== item.id) {
        if (CATEGORIA_MOCHILAS.tipos.includes(item.type)) return ui.notifications.info("Mochilas não vão dentro de outras mochilas nesta ficha.");
        if (item.system?.container === mochila.id) return;
        await item.update({ "system.container": mochila.id });
        return ui.notifications.info(`${item.name} foi para ${mochila.name}.`);
      }
      if (!mochila && item.system?.container && event?.target?.closest?.('[data-zona-inventario="geral"]')) {
        return item.update({ "system.container": null });
      }
      return;
    }
    if (TIPOS_IGNORADOS.includes(item.type)) {
      return ui.notifications.warn(`Itens do tipo "${item.type}" não são usados na ficha EPM.`);
    }
    if (item.type === "feat" || item.type === "spell") return M.aprenderPorArraste(this.actor, item);
    const data = item.toObject();
    for (const k of ["_id", "folder", "sort", "ownership", "_stats"]) delete data[k];
    if (data.system) data.system.container = mochila && !CATEGORIA_MOCHILAS.tipos.includes(item.type) ? mochila.id : null;
    return this.actor.createEmbeddedDocuments("Item", [data]);
  }

  async _soltarAtor(dados) {
    const aba = this._abas.primary;
    if (!["relacoes", "companheiros", "bestiario"].includes(aba)) {
      return ui.notifications.info("Solte o personagem na aba Relações (relação), Companheiros ou Bestiário.");
    }
    const ator = await Actor.implementation.fromDropData(dados);
    if (!ator || ator.uuid === this.actor.uuid) return;
    if (aba === "companheiros") {
      const hp = ator.system?.attributes?.hp ?? {};
      return this.actor.update({ [`${P}.companheiros.${novoId()}`]: X.novoCompanheiro({
        nome: ator.name, img: ator.img, uuid: ator.uuid, pv: { value: int(hp.value, 10), max: int(hp.max, 10) },
        ca: int(ator.system?.attributes?.ac?.value, 10)
      }) });
    }
    if (aba === "bestiario") {
      return this.actor.update({ [`${P}.bestiario.${novoId()}`]: {
        nome: ator.prototypeToken?.name || ator.name, img: ator.img, uuid: ator.uuid, tipo: "", local: "",
        fraquezas: [], resistencias: [], imunidades: [], notas: "", encontros: 1, derrotados: 0, criado: Date.now()
      } });
    }
    return conectar(this.actor, ator);
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
    if (barra && r.max > 0 && !id.startsWith("temp")) {
      barra.style.width = `${Math.round(Math.min(1, novo / r.max) * 100)}%`;
      if (this._barrasAntes?.[id]) this._barrasAntes[id].p = Math.round(Math.min(1, novo / r.max) * 100);
    }
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
    if (!this._modoEdicao && ABAS.find(a => a.id === this._abas.primary)?.soEdicao) this._abas.primary = "principal";
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

  acaoRolarAtributo(ev, alvo) { return M.rolarAtributo(this.actor, alvo.dataset.atributo, ev); }
  acaoRolarPericia(ev, alvo) { return M.rolarPericia(this.actor, alvo.dataset.pericia, ev); }
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
    const usada = !!this.actor.flags?.[FLAG]?.acoes?.[id];
    if (!usada) {
      const { ficha } = this._estado();
      const bloqueio = ficha.bloqueios.acoes[id] ?? [];
      if (bloqueio.length) ui.notifications.warn(`${id === "reacao" ? "Reação" : "Ação"} bloqueada por: ${bloqueio.join(", ")}.`);
      else if (id !== "reacao" && ficha.acoes.esgotadas) ui.notifications.warn(`Limite de ${ficha.acoes.limite} ação por turno (${ficha.acoes.limiteFontes.join(", ")}).`);
    }
    await this.actor.update({ [`${P}.acoes.${id}`]: !usada });
  }

  acaoNovoTurno() { return M.novoTurno(this.actor); }

  async acaoExaustao(ev, alvo) {
    const n = int(alvo.dataset.nivel);
    const atual = this._estado().ficha.exaustao.nivel;
    return M.definirExaustao(this.actor, atual === n ? n - 1 : n);
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

  acaoEditarItem(ev, alvo) {
    const item = this._item(alvo);
    if (item) abrirEditorItem(item);
  }

  acaoGuardarMoedasMochila(ev, alvo) {
    const item = this._item(alvo);
    if (item) return M.moverMoedasMochila(item, "guardar");
  }

  acaoPegarMoedasMochila(ev, alvo) {
    const item = this._item(alvo);
    if (item) return M.moverMoedasMochila(item, "pegar");
  }

  async acaoExcluirItem(ev, alvo) {
    const item = this._item(alvo);
    if (!item) return;
    const dentro = CATEGORIA_MOCHILAS.tipos.includes(item.type) ? this.actor.items.filter(i => i.system?.container === item.id) : [];
    const extra = dentro.length ? `<p class="epm-dica">Os ${dentro.length} item(ns) de dentro voltam para o inventário.</p>` : "";
    if (!(await M.confirmar("Excluir", `<p>Excluir <strong>${escapar(item.name)}</strong>?</p>${extra}`))) return;
    if (dentro.length) await this.actor.updateEmbeddedDocuments("Item", dentro.map(i => ({ _id: i.id, "system.container": null })));
    this._expandidos.delete(item.id);
    await item.delete();
  }

  acaoUsarItem(ev, alvo) {
    const item = this._item(alvo);
    if (item) return M.usarItem(this.actor, item);
  }

  acaoAbrirMochila(ev, alvo) {
    const id = alvo.dataset.itemId;
    if (this._mochilasFechadas.has(id)) this._mochilasFechadas.delete(id);
    else this._mochilasFechadas.add(id);
    this.render({ parts: ["inventario"] });
  }

  async acaoTirarDaMochila(ev, alvo) {
    const item = this._item(alvo);
    if (item) await item.update({ "system.container": null });
  }

  async acaoMoverCategoria(ev, alvo) {
    const atual = ordenarPorLista(CATEGORIAS_ITEM.map(c => c.id), this.actor.flags?.[FLAG]?.ui?.ordemCategorias);
    const i = atual.indexOf(alvo.dataset.categoria);
    const j = i + int(alvo.dataset.dir);
    if (i < 0 || j < 0 || j >= atual.length) return;
    [atual[i], atual[j]] = [atual[j], atual[i]];
    await this.actor.update({ [`${P}.ui.ordemCategorias`]: atual });
  }

  async acaoRestaurarOrdemCategorias() {
    await this.actor.update({ [`${P}.ui.ordemCategorias`]: [] });
  }

  async acaoAdicionarEfeitoItem(ev, alvo) {
    const item = this._item(alvo);
    if (!item) return;
    const select = this.element.querySelector(`[data-novo-efeito="${item.id}"]`);
    const tipo = TIPOS_EFEITO_ITEM[select?.value] ? select.value : "mod";
    await item.update({
      [`flags.${FLAG}.efeitos.${novoId()}`]: {
        tipo, alvo: tipo === "mod" && item.type === "equipment" ? "ca" : "", valor: tipo === "rd" ? 1 : (tipo === "mod" ? 1 : 0),
        tipoDano: "", em: "", recurso: "pv", formula: "", quando: item.type === "weapon" ? "acerto" : "uso", criado: Date.now()
      }
    });
  }

  async acaoRemoverEfeitoItem(ev, alvo) {
    const item = this._item(alvo);
    if (item) await item.update({ [`flags.${FLAG}.efeitos.-=${alvo.dataset.efeito}`]: null });
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

  acaoAlternarTemp(ev, alvo) {
    if (!this.isEditable) return;
    const rid = alvo?.dataset?.recurso || "pv";
    this._tempAberto = this._tempAberto === rid ? null : rid;
    this._focarTemp = !!this._tempAberto;
    this.render({ parts: ["header"] });
  }

  acaoDanoArma(ev, alvo) {
    const item = this._item(alvo);
    if (item) return M.danoDeArma(this.actor, item);
  }

  async acaoNovoPoder(ev, alvo) {
    const tipo = alvo.dataset.tipo === "magia" ? "magia" : "habilidade";
    const circulo = tipo === "magia" ? Math.min(6, Math.max(0, int(this._abas.magias, 0))) : 0;
    const sub = SUBABAS_HABILIDADE.find(s => s.id === this._abas.habilidades);
    const origem = alvo.dataset.origem ?? (tipo === "habilidade" ? sub?.origem ?? "" : "");
    const item = await M.dialogoNovoPoder(this.actor, tipo, circulo, { origem });
    if (item && alvo.dataset.transformacao) await item.update({ [`flags.${FLAG}.origem`]: "transformacao", [`flags.${FLAG}.transformacao`]: alvo.dataset.transformacao });
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

  /* ---------- Condições ---------- */

  async acaoAlternarCondicao(ev, alvo) {
    const id = alvo.dataset.condicao;
    const cond = CONDICOES.find(c => c.id === id);
    if (!cond) return;
    const ativa = this.actor.statuses?.has(id);
    const info = this._estado().ficha.condicoes.find(c => c.id === id);
    if (!ativa && info?.imune) {
      ui.notifications.info(`${this.actor.name} é imune a ${cond.label}: a condição fica marcada, mas sem efeito.`);
    }
    if (!ativa && info?.automatica) {
      ui.notifications.info(`${cond.label} já está valendo por causa de ${info.porQue.join(", ")}. Agora fica marcada também por conta própria.`);
    }
    try {
      await this.actor.toggleStatusEffect(id, { active: !ativa });
    } catch (err) {
      console.error("EPM |", err);
      ui.notifications.error(`Não foi possível alternar ${cond.label}. Recarregue o mundo para registrar as condições do módulo.`);
    }
  }

  acaoSoAtivas() {
    this._condicoesUi.soAtivas = !this._condicoesUi.soAtivas;
    this.render({ parts: ["condicoes"] });
  }

  acaoAplicarCombinacao(ev, alvo) { return M.aplicarCombinacao(this.actor, alvo.dataset.combinacao, "aplicar"); }
  acaoRemoverCombinacao(ev, alvo) {
    if (!COMBINACOES.some(k => k.id === alvo.dataset.combinacao)) return;
    return M.aplicarCombinacao(this.actor, alvo.dataset.combinacao, "remover");
  }

  async acaoRemoverTag(ev, alvo) {
    const campo = alvo.dataset.campo;
    const salvo = foundry.utils.getProperty(this.actor.flags?.[FLAG] ?? {}, campo);
    const lista = (Array.isArray(salvo) ? salvo : []).filter(v => v !== alvo.dataset.valor);
    await this.actor.update({ [`${P}.${campo}`]: lista });
  }

  acaoRemoverIdioma(ev, alvo) {
    return removerIdioma(this.actor, { chave: alvo.dataset.chave, rotulo: alvo.dataset.rotulo });
  }

  /* ---------- Bênçãos e maldições ---------- */

  async acaoNovaBencao(ev, alvo) {
    const tipo = alvo.dataset.tipo === "maldicao" ? "maldicao" : "bencao";
    await this.actor.update({
      [`${P}.bencaos.${novoId()}`]: { nome: "", tipo, ativo: true, origem: "", descricao: "", mods: {}, frequencia: "livre", duracao: 0, usado: false, turnosRestantes: 0, criado: Date.now() }
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

  acaoAbrirCatalogo() {
    this._bencaosUi.aberto = !this._bencaosUi.aberto;
    this.render({ parts: ["bencaos"] });
  }

  acaoTipoCatalogo(ev, alvo) {
    this._bencaosUi.tipo = alvo.dataset.tipo === "maldicao" ? "maldicao" : "bencao";
    this.render({ parts: ["bencaos"] });
  }

  async acaoAdicionarDoCatalogo(ev, alvo) {
    const c = entradaCatalogo(alvo.dataset.catalogo);
    if (!c) return;
    const ja = Object.values(this.actor.flags?.[FLAG]?.bencaos ?? {}).some(b => b?.catalogo === c.id);
    if (ja && !(await M.confirmar("Já está na ficha", `<p><strong>${escapar(c.nome)}</strong> já está na ficha. Adicionar outra vez?</p>`))) return;
    let escolha = "";
    if (c.escolha) {
      escolha = await M.perguntarTexto(c.nome, `${c.escolha.rotulo} (${c.escolha.sugestoes.join(", ")})`, c.escolha.sugestoes[0] ?? "", "Adicionar");
      if (escolha === null) return;
    }
    await this.actor.update({ [`${P}.bencaos.${novoId()}`]: dadosNovaEntrada(c, { escolha, novoIdFn: novoId }) });
    ui.notifications.info(`${c.nome} adicionada à ficha de ${this.actor.name}.`);
    import("./mundo.mjs").then(m => m.avisarDiscord("bencao", `${c.tipo === "maldicao" ? "💀" : "✨"} **${this.actor.name}** recebeu ${c.tipo === "maldicao" ? "a maldição" : "a bênção"} **${c.nome}**.`)).catch(() => null);
  }

  acaoUsarBencao(ev, alvo) { return M.usarBencao(this.actor, alvo.dataset.bencao); }
  acaoEncerrarBencao(ev, alvo) { return M.terminarBencao(this.actor, alvo.dataset.bencao); }
  acaoChatBencao(ev, alvo) { return M.cartaoBencao(this.actor, alvo.dataset.bencao); }
  async acaoRecarregarBencao(ev, alvo) {
    await this.actor.update({ [`${P}.bencaos.${alvo.dataset.bencao}.usado`]: false });
  }

  /* ---------- Relações ---------- */

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

  acaoConectarRelacao() { return dialogoConectar(this.actor); }
  acaoRelacaoMultipla() { return relacaoMultipla(this.actor); }

  async acaoAjustarAfinidade(ev, alvo) {
    if (!this.isEditable || !this._modoEdicao) return;
    const id = alvo.dataset.relacao;
    if (!game.user.isGM && ajustes().afinidadeSoMestre) return ui.notifications.info("Neste mundo a afinidade é definida pelo Mestre.");
    await X.ajustarAfinidade(this.actor, id, int(alvo.dataset.delta));
  }

  acaoAbrirBackground(ev, alvo) {
    const id = alvo.dataset.relacao;
    if (this._relacoesAbertas.has(id)) this._relacoesAbertas.delete(id);
    else this._relacoesAbertas.add(id);
    this.render({ parts: ["relacoes"] });
  }

  /* ---------- 0.5.4: visual, barras e bestiário ---------- */

  /** Moldura, letra, tamanho e imagem de fundo escolhidos em Personalizar. */
  _aplicarVisual(pers = {}) {
    const el = this.element;
    if (!el) return;
    const v = visualDaFicha(pers);
    for (const c of [...el.classList]) if (/^epm-moldura-|^epm-com-fundo$|^epm-escalada$/.test(c)) el.classList.remove(c);
    el.classList.add(...v.classes);
    for (const nome of ["--epm-display", "--epm-ui", "--epm-escala", "--epm-fundo-img", "--epm-fundo-veu"]) {
      if (v.vars[nome]) el.style.setProperty(nome, v.vars[nome]);
      else el.style.removeProperty(nome);
    }
  }

  /** Barras e anéis dos recursos deslizam do valor antigo para o novo; o temporário desce até sumir. */
  _animarBarras() {
    const raiz = this.element;
    if (!raiz) return;
    const reduzir = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const antes = this._barrasAntes;
    const agora = {};
    const largura = el => (el ? parseFloat(el.style.width) || 0 : 0);
    const curva = { duration: 650, easing: "cubic-bezier(.2,.75,.25,1)" };
    const animar = (el, de, para) => {
      if (!el?.animate || Math.abs(de - para) < 0.1) return;
      el.animate([{ width: `${de}%` }, { width: `${para}%` }], curva);
    };
    for (const rec of raiz.querySelectorAll(".epm-recurso[data-recurso]")) {
      const id = rec.dataset.recurso;
      const principal = rec.querySelector(".epm-barra:not(.epm-barra-temp) > span");
      const tempEl = rec.querySelector(".epm-barra-temp:not(.epm-barra-fantasma) > span");
      agora[id] = { p: largura(principal), t: largura(tempEl), cor: tempEl?.style.background || "" };
      const ant = antes?.[id];
      if (!ant || reduzir) continue;
      if (!agora[id].cor) agora[id].cor = ant.cor;
      if (principal && agora[id].p < ant.p - 0.1 && principal.parentElement) {
        // Rastro claro do que foi perdido: fica um instante e desce junto
        const rastro = document.createElement("span");
        rastro.className = "epm-barra-rastro";
        rastro.style.left = `${agora[id].p}%`;
        rastro.style.width = `${ant.p - agora[id].p}%`;
        principal.parentElement.append(rastro);
        const w = `${ant.p - agora[id].p}%`;
        rastro.animate([{ width: w, opacity: 0.9 }, { width: w, opacity: 0.9, offset: 0.3 }, { width: "0%", opacity: 0.3 }], { duration: 950, easing: "ease-in" })
          .finished.then(() => rastro.remove(), () => rastro.remove());
      }
      animar(principal, ant.p, agora[id].p);
      if (tempEl) animar(tempEl, ant.t, agora[id].t);
      else if (ant.t > 0 && principal?.parentElement) {
        const barra = document.createElement("div");
        barra.className = "epm-barra epm-barra-temp epm-barra-fantasma";
        barra.setAttribute("aria-hidden", "true");
        const span = document.createElement("span");
        span.style.width = "0%";
        if (ant.cor) span.style.background = ant.cor;
        barra.append(span);
        principal.parentElement.after(barra);
        span.animate([{ width: `${ant.t}%` }, { width: "0%" }], curva).finished
          .then(() => barra.animate([{ opacity: 1, height: "4px" }, { opacity: 0, height: "0px" }], { duration: 220 }).finished)
          .then(() => barra.remove(), () => barra.remove());
      }
    }
    raiz.querySelectorAll(".epm-anel").forEach((anel, i) => {
      const dash = anel.getAttribute("stroke-dasharray") ?? "";
      agora[`anel${i}`] = dash;
      const ant = antes?.[`anel${i}`];
      if (!ant || reduzir || ant === dash || !anel.animate) return;
      anel.animate([{ strokeDasharray: ant }, { strokeDasharray: dash }], curva);
    });
    this._barrasAntes = agora;
  }

  _filtrarBestiario() {
    const aba = this.element?.querySelector(".epm-bestiario");
    if (!aba) return;
    const termo = normalizarTexto(this._buscaBestiario ?? "");
    let visiveis = 0;
    for (const c of aba.querySelectorAll(".epm-criatura")) {
      const ok = !termo || (c.dataset.busca ?? "").includes(termo);
      c.hidden = !ok;
      if (ok) visiveis++;
    }
    const vazio = aba.querySelector(".epm-busca-vazia");
    if (vazio) vazio.hidden = visiveis > 0 || !aba.querySelector(".epm-criatura");
  }

  /* ---------- Seleção de várias habilidades ou magias ---------- */

  /** Marca ou desmarca uma linha sem redesenhar a aba (contador e botões mudam na hora). */
  _marcarPoder(id, marcado) {
    if (marcado) this._selecao.ids.add(id);
    else this._selecao.ids.delete(id);
    const raiz = this.element;
    for (const li of raiz.querySelectorAll(`.epm-poder[data-item-id="${id}"]`)) li.classList.toggle("selecionado", marcado);
    for (const cx of raiz.querySelectorAll(`[data-selecionar-poder="${id}"]`)) cx.checked = marcado;
    const qtd = [...this._selecao.ids].filter(x => this.actor.items.get(x)).length;
    for (const barra of raiz.querySelectorAll(".epm-selecao-barra")) {
      const rotulo = barra.querySelector(".epm-selecao-qtd");
      if (rotulo) rotulo.innerHTML = `<strong>${qtd}</strong> selecionada${qtd === 1 ? "" : "s"}`;
      for (const b of barra.querySelectorAll('[data-action="selecaoAcao"], [data-action="selecaoLimpar"]')) b.disabled = !qtd;
    }
  }

  acaoSelecionarPoderes(ev, alvo) {
    const aba = alvo.dataset.aba === "magias" ? "magias" : "habilidades";
    if (this._selecao.aba === aba) this._selecao = { aba: null, ids: new Set() };
    else this._selecao = { aba, ids: new Set() };
    this.render({ parts: ["habilidades", "magias", "arqclasse"] });
  }

  acaoSelecaoTudo(ev, alvo) {
    const aba = this._selecao.aba;
    if (!aba) return;
    const secao = this.element.querySelector(`.epm-${aba} .tab.active[data-group="${aba}"]`) ?? this.element.querySelector(`.epm-${aba}`);
    for (const li of secao?.querySelectorAll("[data-item-id].epm-poder") ?? []) this._selecao.ids.add(li.dataset.itemId);
    this.render({ parts: [aba] });
  }

  acaoSelecaoLimpar() {
    this._selecao.ids.clear();
    this.render({ parts: [this._selecao.aba ?? "habilidades"] });
  }

  async acaoSelecaoAcao(ev, alvo) {
    const ids = [...this._selecao.ids].filter(id => this.actor.items.get(id));
    const op = alvo.dataset.op;
    await X.acaoEmMassa(this.actor, ids, op);
    if (op === "apagar") this._selecao.ids.clear();
    this.render({ parts: [this._selecao.aba ?? "habilidades"] });
  }

  /* ---------- Transformações ---------- */

  async acaoNovaTransformacao() {
    await this.actor.update({ [`${P}.transformacoes.${novoId()}`]: {
      nome: "", img: "", descricao: "", custo: { recurso: "nenhum", valor: 0 }, duracao: 0, mods: {}, trocarToken: false, criado: Date.now()
    } });
    if (!this._modoEdicao) { this._modoEdicao = true; this.render(); }
  }

  async acaoExcluirTransformacao(ev, alvo) {
    const id = alvo.dataset.transformacao;
    const t = this.actor.flags?.[FLAG]?.transformacoes?.[id];
    if (!(await M.confirmar("Excluir transformação", `<p>Excluir <strong>${escapar(t?.nome || "esta transformação")}</strong>? As habilidades dela ficam na sub-aba, sem vínculo.</p>`))) return;
    if (this.actor.flags?.[FLAG]?.transformacao?.ativa === id) await X.destransformar(this.actor, { silencioso: true });
    await this.actor.update({ [`${P}.transformacoes.-=${id}`]: null });
  }

  acaoTransformar(ev, alvo) { return X.transformar(this.actor, alvo.dataset.transformacao); }

  async acaoImagemTransformacao(ev, alvo) {
    const id = alvo.dataset.transformacao;
    const caminho = await escolherImagem({ atual: this.actor.flags?.[FLAG]?.transformacoes?.[id]?.img ?? "", titulo: "Imagem da transformação" });
    if (caminho) await this.actor.update({ [`${P}.transformacoes.${id}.img`]: caminho });
  }

  async acaoAdicionarModTransf(ev, alvo) {
    await this.actor.update({ [`${P}.transformacoes.${alvo.dataset.transformacao}.mods.${novoId()}`]: { alvo: "", valor: 1 } });
  }

  async acaoRemoverModTransf(ev, alvo) {
    await this.actor.update({ [`${P}.transformacoes.${alvo.dataset.transformacao}.mods.-=${alvo.dataset.mod}`]: null });
  }

  /* ---------- Arquétipos modelo ---------- */

  acaoAdicionarHabilidadeArq(ev, alvo) { return X.adicionarHabilidadesArquetipo(this.actor, alvo.dataset.ref); }

  async acaoAlternarEstilo(ev, alvo) {
    const atual = this.actor.flags?.[FLAG]?.arquetipoOpcoes?.combatente?.estilos;
    const lista = Array.isArray(atual) ? [...atual] : [];
    const id = alvo.dataset.estilo;
    const i = lista.indexOf(id);
    if (i >= 0) lista.splice(i, 1); else lista.push(id);
    await this.actor.update({ [`${P}.arquetipoOpcoes.combatente.estilos`]: lista });
  }

  async acaoAlternarUtensilio(ev, alvo) {
    const atual = this.actor.flags?.[FLAG]?.arquetipoOpcoes?.artifice?.utensilios;
    const lista = Array.isArray(atual) ? [...atual] : [];
    const id = alvo.dataset.pericia;
    const i = lista.indexOf(id);
    if (i >= 0) lista.splice(i, 1); else if (lista.length < 3) lista.push(id);
    await this.actor.update({ [`${P}.arquetipoOpcoes.artifice.utensilios`]: lista });
  }

  acaoRecuperarMana() { return X.recuperarMana(this.actor); }

  /* ---------- Produção ---------- */

  async acaoNovaReceita() {
    await this.actor.update({ [`${P}.receitas.${novoId()}`]: PR.novaReceita() });
    if (!this._modoEdicao) { this._modoEdicao = true; this.render(); }
  }
  async acaoApagarReceita(ev, alvo) {
    const r = this.actor.flags?.[FLAG]?.receitas?.[alvo.dataset.receita];
    if (!(await M.confirmar("Apagar receita", `<p>Apagar <strong>${escapar(r?.nome || "esta receita")}</strong>?</p>`))) return;
    return this.actor.update({ [`${P}.receitas.-=${alvo.dataset.receita}`]: null });
  }
  acaoAlternarProfissao(ev, alvo) { return PR.alternarProfissao(this.actor, alvo.dataset.receita, alvo.dataset.profissao); }
  acaoNovoIngrediente(ev, alvo) {
    return this.actor.update({ [`${P}.receitas.${alvo.dataset.receita}.ingredientes.${novoId()}`]: { nome: "", qtd: 1, criado: Date.now() } });
  }
  acaoRemoverIngrediente(ev, alvo) {
    return this.actor.update({ [`${P}.receitas.${alvo.dataset.receita}.ingredientes.-=${alvo.dataset.ingrediente}`]: null });
  }
  acaoLigarResultado(ev, alvo) { return PR.escolherResultado(this.actor, alvo.dataset.receita); }
  acaoProduzir(ev, alvo) { return PR.produzir(this.actor, alvo.dataset.receita); }
  acaoTestarProducao(ev, alvo) { return PR.testarProducao(this.actor, alvo.dataset.producao); }
  acaoTerminarProducao(ev, alvo) { return PR.terminarAgora(this.actor, alvo.dataset.producao); }
  async acaoApagarProducao(ev, alvo) {
    if (!(await M.confirmar("Apagar produção", "<p>Apagar esta produção da lista? Os ingredientes gastos não voltam.</p>"))) return;
    return this.actor.update({ [`${P}.producoes.-=${alvo.dataset.producao}`]: null });
  }

  /* ---------- RD (aba Combate) ---------- */

  acaoNovaRd() { return this.actor.update({ [`${P}.rd.${novoId()}`]: { tipo: "", valor: 1, criado: Date.now() } }); }
  acaoRemoverRd(ev, alvo) { return this.actor.update({ [`${P}.rd.-=${alvo.dataset.rd}`]: null }); }

  /* ---------- Projetos do Artífice ---------- */

  acaoCriarProjeto() { return PJ.criarProjeto(this.actor); }
  acaoUsarProjeto(ev, alvo) { return PJ.usarProjeto(this.actor, alvo.dataset.projeto); }
  async acaoApagarProjeto(ev, alvo) {
    if (!(await M.confirmar("Apagar projeto", "<p>Apagar este projeto? Ele continua contando no limite do dia.</p>"))) return;
    return PJ.apagarProjeto(this.actor, alvo.dataset.projeto);
  }
  acaoGuardarProjeto(ev, alvo) { return PJ.guardarNoLivro(this.actor, alvo.dataset.projeto); }
  acaoApagarDoLivro(ev, alvo) { return PJ.apagarDoLivro(this.actor, alvo.dataset.livro); }
  acaoEncerrarEfeitoProjeto(ev, alvo) { return PJ.encerrarEfeitoProjeto(this.actor, alvo.dataset.efeito); }
  acaoCacadorNatural() { return X.cacadorNatural(this.actor); }

  /* ---------- Companheiros ---------- */

  async acaoNovoCompanheiro() {
    await this.actor.update({ [`${P}.companheiros.${novoId()}`]: X.novoCompanheiro() });
    if (!this._modoEdicao) { this._modoEdicao = true; this.render(); }
  }

  acaoCriarAutomato() { return X.criarAutomato(this.actor); }

  async acaoExcluirCompanheiro(ev, alvo) {
    const id = alvo.dataset.companheiro;
    const c = this.actor.flags?.[FLAG]?.companheiros?.[id];
    if (!(await M.confirmar("Excluir companheiro", `<p>Excluir <strong>${escapar(c?.nome || "este companheiro")}</strong>?</p>`))) return;
    await this.actor.update({ [`${P}.companheiros.-=${id}`]: null });
  }

  async acaoImagemCompanheiro(ev, alvo) {
    const id = alvo.dataset.companheiro;
    const caminho = await escolherImagem({ atual: this.actor.flags?.[FLAG]?.companheiros?.[id]?.img ?? "", titulo: "Imagem do companheiro" });
    if (caminho) await this.actor.update({ [`${P}.companheiros.${id}.img`]: caminho });
  }

  async acaoAjustarCompanheiro(ev, alvo) {
    if (!this.isEditable) return;
    const { companheiro: id, recurso } = alvo.dataset;
    const dados = this.actor.flags?.[FLAG] ?? {};
    const c = dados.companheiros?.[id];
    if (!c) return;
    const max = X.maxCompanheiro(dados, c, recurso);
    const novo = Math.max(0, int(c[recurso]?.value) + int(alvo.dataset.delta) * (ev.shiftKey ? 5 : 1));
    await this.actor.update({ [`${P}.companheiros.${id}.${recurso}.value`]: max > 0 ? Math.min(novo, max) : novo });
  }

  async acaoNovoAtaqueCompanheiro(ev, alvo) {
    await this.actor.update({ [`${P}.companheiros.${alvo.dataset.companheiro}.ataques.${novoId()}`]: { nome: "Ataque", acerto: 0, dano: "1d6", tipoDano: "", criado: Date.now() } });
  }

  async acaoExcluirAtaqueCompanheiro(ev, alvo) {
    await this.actor.update({ [`${P}.companheiros.${alvo.dataset.companheiro}.ataques.-=${alvo.dataset.ataque}`]: null });
  }

  acaoRolarAtaqueCompanheiro(ev, alvo) { return X.rolarAtaqueCompanheiro(this.actor, alvo.dataset.companheiro, alvo.dataset.ataque); }

  async acaoAbrirLigado(ev, alvo) {
    const doc = alvo.dataset.uuid ? await fromUuid(alvo.dataset.uuid) : null;
    if (doc?.sheet && doc.testUserPermission?.(game.user, "OBSERVER")) doc.sheet.render(true);
    else ui.notifications.warn("Não encontrei a ficha ligada (ou você não tem permissão para vê-la).");
  }

  /* ---------- Bestiário ---------- */

  async acaoNovaCriatura() {
    await this.actor.update({ [`${P}.bestiario.${novoId()}`]: {
      nome: "", img: "", uuid: "", tipo: "", local: "", fraquezas: [], resistencias: [], imunidades: [], notas: "", encontros: 1, derrotados: 0, criado: Date.now()
    } });
    if (!this._modoEdicao) { this._modoEdicao = true; this.render(); }
  }

  async acaoExcluirCriatura(ev, alvo) {
    const id = alvo.dataset.criatura;
    const b = this.actor.flags?.[FLAG]?.bestiario?.[id];
    if (!(await M.confirmar("Tirar do bestiário", `<p>Tirar <strong>${escapar(b?.nome || "esta criatura")}</strong> do bestiário?</p>`))) return;
    await this.actor.update({ [`${P}.bestiario.-=${id}`]: null });
  }

  async acaoImagemCriatura(ev, alvo) {
    const id = alvo.dataset.criatura;
    const caminho = await escolherImagem({ atual: this.actor.flags?.[FLAG]?.bestiario?.[id]?.img ?? "", titulo: "Imagem da criatura" });
    if (caminho) await this.actor.update({ [`${P}.bestiario.${id}.img`]: caminho });
  }

  async acaoContarCriatura(ev, alvo) {
    const { criatura: id, campo } = alvo.dataset;
    if (!["encontros", "derrotados"].includes(campo)) return;
    const atual = int(this.actor.flags?.[FLAG]?.bestiario?.[id]?.[campo]);
    await this.actor.update({ [`${P}.bestiario.${id}.${campo}`]: Math.max(0, atual + int(alvo.dataset.delta)) });
  }

  /* ---------- Diário de sessões ---------- */

  async acaoNovaSessao() {
    await X.novaSessao(this.actor);
    this._abas.notas = "diario";
    if (!this._modoEdicao) { this._modoEdicao = true; this.render(); }
  }

  async acaoExcluirSessao(ev, alvo) {
    const id = alvo.dataset.sessao;
    if (!(await M.confirmar("Excluir sessão", "<p>Excluir esta entrada do diário?</p>"))) return;
    await this.actor.update({ [`${P}.diario.-=${id}`]: null });
  }

  acaoSomarSessao(ev, alvo) { return X.somarSessao(this.actor, alvo.dataset.sessao); }

  /* ---------- Facções ---------- */

  async acaoNovaFaccao() {
    await this.actor.update({ [`${P}.faccoes.${novoId()}`]: { nome: "", img: "", reputacao: 0, notas: "", criado: Date.now() } });
    if (!this._modoEdicao) { this._modoEdicao = true; this.render(); }
  }

  async acaoExcluirFaccao(ev, alvo) {
    const id = alvo.dataset.faccao;
    const f = this.actor.flags?.[FLAG]?.faccoes?.[id];
    if (!(await M.confirmar("Excluir facção", `<p>Excluir <strong>${escapar(f?.nome || "esta facção")}</strong>?</p>`))) return;
    await this.actor.update({ [`${P}.faccoes.-=${id}`]: null });
  }

  async acaoImagemFaccao(ev, alvo) {
    const id = alvo.dataset.faccao;
    const caminho = await escolherImagem({ atual: this.actor.flags?.[FLAG]?.faccoes?.[id]?.img ?? "", titulo: "Brasão da facção" });
    if (caminho) await this.actor.update({ [`${P}.faccoes.${id}.img`]: caminho });
  }

  async acaoAjustarReputacao(ev, alvo) {
    if (!this.isEditable || !this._modoEdicao) return;
    if (!game.user.isGM && ajustes().afinidadeSoMestre) return ui.notifications.info("Neste mundo a reputação é definida pelo Mestre.");
    await X.ajustarReputacao(this.actor, alvo.dataset.faccao, int(alvo.dataset.delta));
  }

  /* ---------- Combate, treino, Ressonância e música ---------- */

  acaoAtaqueOportunidade() { return X.ataqueDeOportunidade(this.actor); }
  acaoAtrasarTurno() { return X.atrasarTurno(this.actor); }
  acaoRecarregarArma(ev, alvo) {
    const item = this.actor.items.get(alvo.dataset.itemId ?? alvo.closest("[data-item-id]")?.dataset.itemId);
    if (item) return M.recarregarArma(this.actor, item);
  }
  acaoEncerrarSustentada(ev, alvo) { return M.encerrarSustentada(this.actor, alvo.dataset.sustentada); }
  acaoRessonancia() { return X.ressonanciaDeAlma(this.actor); }
  acaoPularHoras() { return X.pularHoras(this.actor); }

  acaoTocarMusica(ev, alvo) {
    const url = alvo.dataset.url;
    if (url && /^https?:\/\//i.test(url)) window.open(url, "_blank", "noopener");
  }

  /* ---------- Personalização: fundo e visual ---------- */

  async acaoImagemFundo() {
    const caminho = await escolherImagem({ atual: this.actor.flags?.[FLAG]?.personalizacao?.fundo ?? "", titulo: "Imagem de fundo da ficha" });
    if (caminho) await this.actor.update({ [`${P}.personalizacao.fundo`]: caminho });
  }

  async acaoRemoverFundo() {
    await this.actor.update({ [`${P}.personalizacao.fundo`]: "" });
  }

  async acaoVisualPadrao() {
    await this.actor.update({
      [`${P}.personalizacao.fundo`]: "", [`${P}.personalizacao.fundoVeu`]: 70, [`${P}.personalizacao.moldura`]: "astrolabio",
      [`${P}.personalizacao.fonte`]: "classica", [`${P}.personalizacao.escala`]: 100
    });
  }

  /* ---------- Personalização ---------- */

  async acaoCorPronta(ev, alvo) {
    await this.actor.update({ [`${P}.personalizacao.cor`]: alvo.dataset.cor });
  }

  async acaoCorPadrao() {
    await this.actor.update({ [`${P}.personalizacao.cor`]: COR_PADRAO, [`${P}.personalizacao.brilho`]: BRILHO_PADRAO });
  }

  async acaoMoverAba(ev, alvo) {
    const atual = ordenarPorLista(ABAS.map(a => a.id), this.actor.flags?.[FLAG]?.ui?.ordemAbas);
    const i = atual.indexOf(alvo.dataset.aba);
    const j = i + int(alvo.dataset.dir);
    if (i < 0 || j < 0 || j >= atual.length) return;
    [atual[i], atual[j]] = [atual[j], atual[i]];
    await this.actor.update({ [`${P}.ui.ordemAbas`]: atual });
  }

  async acaoRestaurarOrdemAbas() {
    await this.actor.update({ [`${P}.ui.ordemAbas`]: [] });
  }

  async acaoAlternarAbaOpcional(ev, alvo) {
    const id = alvo.dataset.aba;
    const aba = ABAS.find(a => a.id === id);
    if (!aba || aba.id === "principal" || aba.soEdicao) return;
    const pers = this.actor.flags?.[FLAG]?.personalizacao ?? {};
    if (aba.opcional) return this.actor.update({ [`${P}.personalizacao.abasExtras.${id}`]: !pers.abasExtras?.[id] });
    return this.actor.update({ [`${P}.personalizacao.abasOcultas.${id}`]: !pers.abasOcultas?.[id] });
  }

  async acaoFavoritarPericia(ev, alvo) {
    const id = alvo.dataset.pericia;
    if (!id || !this.isEditable) return;
    const atual = !!this.actor.flags?.[FLAG]?.pericias?.[id]?.favorita;
    await this.actor.update({ [`${P}.pericias.${id}.favorita`]: !atual });
  }

  /* ---------- Treinamentos ---------- */

  acaoTreinoGanharPT() { return M.treinoGanharPT(this.actor); }
  acaoTreinoConversa() { return M.treinoConversa(this.actor); }
  acaoComecarTreinamento(ev, alvo) { return M.comecarTreinamento(this.actor, alvo.dataset.treino); }
  acaoTreinarHoras(ev, alvo) { return M.treinarHoras(this.actor, alvo.dataset.treino); }

  async acaoNovoTreinamento() {
    const id = novoId();
    await this.actor.update({ [`${P}.treinamentos.${id}`]: {
      nome: "", tempo: 6, unidade: "horas", pt: 1, requisitos: "", treinador: false, beneficios: "",
      estado: "planejado", horasFeitas: 0, mods: {}, criado: Date.now()
    } });
    if (!this._modoEdicao) { this._modoEdicao = true; this.render(); }
  }

  async acaoExemploTreinamento(ev, alvo) {
    const e = EXEMPLOS_TREINAMENTO[int(alvo.dataset.indice)];
    if (!e) return;
    const mods = Object.fromEntries(e.mods.map(m => [novoId(), { ...m }]));
    await this.actor.update({ [`${P}.treinamentos.${novoId()}`]: {
      nome: e.nome, tempo: e.tempo, unidade: e.unidade, pt: e.pt, requisitos: e.requisitos, treinador: e.treinador,
      beneficios: e.beneficios, estado: "planejado", horasFeitas: 0, mods, criado: Date.now()
    } });
  }

  async acaoExcluirTreinamento(ev, alvo) {
    const id = alvo.dataset.treino;
    const t = this.actor.flags?.[FLAG]?.treinamentos?.[id];
    if (!t) return;
    if (!(await M.confirmar("Excluir treinamento", `<p>Excluir <strong>${escapar(t.nome || "este treinamento")}</strong>? Os PT gastos não voltam.</p>`))) return;
    await this.actor.update({ [`${P}.treinamentos.-=${id}`]: null });
  }

  async acaoAdicionarModTreino(ev, alvo) {
    await this.actor.update({ [`${P}.treinamentos.${alvo.dataset.treino}.mods.${novoId()}`]: { alvo: "", valor: 1 } });
  }

  async acaoRemoverModTreino(ev, alvo) {
    await this.actor.update({ [`${P}.treinamentos.${alvo.dataset.treino}.mods.-=${alvo.dataset.mod}`]: null });
  }

  async acaoMinijogo(ev, alvo) {
    if (M.horasLivres(this.actor) < 1) return ui.notifications.warn("Sem horas de treino livres hoje.");
    const acertos = await jogarMinijogo(alvo.dataset.jogo);
    if (acertos === null) return;
    return M.resultadoMinijogo(this.actor, alvo.dataset.jogo, acertos);
  }

  async acaoFavoritasNoTopo() {
    if (!this.isEditable) return;
    const atual = !!this.actor.flags?.[FLAG]?.ui?.periciasFavoritasTopo;
    await this.actor.update({ [`${P}.ui.periciasFavoritasTopo`]: !atual });
  }

  /* -------------------------------------------- */
  /*  Painéis recolhíveis (seta no título)        */
  /* -------------------------------------------- */

  /** Lista de painéis recolhidos deste usuário (vale para todas as fichas). */
  _lerRecolhidos() {
    if (!this._recolhidos) {
      let salvo = [];
      try { salvo = game.settings.get(MODULE_ID, "paineisRecolhidos") ?? []; } catch { salvo = []; }
      this._recolhidos = new Set(Array.isArray(salvo) ? salvo : []);
    }
    return this._recolhidos;
  }

  /** Chave estável de um painel: aba + identificação do bloco + título. */
  _chavePainel(cabeca) {
    const bloco = cabeca.parentElement;
    const aba = cabeca.closest(".epm-aba")?.dataset.tab ?? "";
    const id = bloco.dataset.secao ?? bloco.dataset.categoria ?? cabeca.dataset.categoriaId ?? "";
    const titulo = cabeca.querySelector("h3, h4")?.textContent.trim().replace(/\s+/g, " ") ?? "";
    return `${aba}|${id}|${titulo}`;
  }

  _ligarRecolher() {
    const recolhidos = this._lerRecolhidos();
    const seletor = ".epm-painel > header.epm-painel-titulo, .epm-secao-poder > header.epm-secao-titulo, section > header.epm-categoria-titulo";
    for (const cabeca of this.element.querySelectorAll(seletor)) {
      if (cabeca.closest(".epm-circulo")) continue;
      const bloco = cabeca.parentElement;
      const chave = this._chavePainel(cabeca);
      const fechado = recolhidos.has(chave);
      bloco.classList.add("epm-recolhivel");
      bloco.classList.toggle("recolhido", fechado);
      let botao = cabeca.querySelector(":scope > .epm-recolher");
      if (!botao) {
        botao = document.createElement("button");
        botao.type = "button";
        botao.className = "epm-recolher";
        botao.dataset.action = "recolherPainel";
        botao.innerHTML = '<i class="fa-solid fa-chevron-up" aria-hidden="true"></i>';
        cabeca.append(botao);
      }
      botao.dataset.chave = chave;
      botao.title = fechado ? "Abrir" : "Recolher";
      botao.setAttribute("aria-expanded", String(!fechado));
    }
  }

  async acaoRecolherPainel(ev, alvo) {
    ev?.stopPropagation?.();
    const chave = alvo.dataset.chave;
    if (!chave) return;
    const recolhidos = this._lerRecolhidos();
    const fechar = !recolhidos.has(chave);
    if (fechar) recolhidos.add(chave); else recolhidos.delete(chave);
    const bloco = alvo.closest(".epm-recolhivel");
    bloco?.classList.toggle("recolhido", fechar);
    alvo.title = fechar ? "Abrir" : "Recolher";
    alvo.setAttribute("aria-expanded", String(!fechar));
    try { await game.settings.set(MODULE_ID, "paineisRecolhidos", [...recolhidos]); } catch (err) { console.warn("EPM |", err); }
  }
}

/** Catálogo exposto para macros (game.modules.get("epm-ficha").api.catalogoBencaos). */
export const catalogoBencaos = CATALOGO;

/* Ações da 0.6.0 (ficha-060.mjs) */
Object.assign(EPMActorSheet.prototype, METODOS_060);
