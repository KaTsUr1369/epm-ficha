/**
 * Escudo do Mestre: janela do Mestre para conduzir o combate, aplicar dano, cura e condições,
 * dar itens e moedas, pedir testes ao grupo e consultar as regras. Só o Mestre abre.
 */
import { FLAG, CAMINHO, MOEDAS, RECURSOS, COR_PADRAO, BRILHO_PADRAO, SUGESTOES, TRANSFORMACOES_PRONTAS } from "./config.mjs";
import { int, num, danoRecebido } from "./data.mjs";
import { escapar } from "./helpers.mjs";
import { aplicarPaleta } from "./personalizacao.mjs";
import { listaPericias, conteudoNotion } from "./settings.mjs";
import { contextoEscudoNovas, acumularNoEscudo } from "./escudo-novas.mjs";
import { montarEscudo } from "./escudo-contexto.mjs";
import {
  estadoAtor, calcularPerda, calcularRecuperacao, novoTurno, descanso, definirExaustao, formulaD20
} from "./mecanicas.mjs";
import { lerAtor } from "./context.mjs";
import * as mundo from "./mundo.mjs";
import { lerMundo } from "./settings.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const P = `flags.${FLAG}`;
let escudo = null;
let pendente = null;

const acao = nome => function (ev, alvo) { return this[`_${nome}`](ev, alvo); };
const ACOES = [
  "trocarAba", "abrirFicha", "focarToken", "comecarCombate", "encerrarCombate", "proximoTurno", "turnoAnterior", "rolarIniciativaNpcs",
  "novoTurnoAtual", "alternarDerrotado", "aplicarRapido", "marcarTodos", "limparMarcados", "darPontos", "descansoGrupo",
  "relacaoMultipla", "alternarCondicao", "removerCondicao", "exaustao", "darItem", "darMoedas", "darTransformacao", "rolarTestes", "rolarLivre", "abrirItem",
  "adicionarAoGrupo", "tirarDoGrupo", "restaurarGrupo", "alternarNotion", "mundo", "novasMestre"
];

export class EscudoMestre extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this._aba = "combate";
    this._marcados = new Set();
    this._ui = { buscaCond: "", buscaItem: "", tipoItem: "", alvoItem: "", testes: null };
  }

  static DEFAULT_OPTIONS = {
    id: "epm-escudo-mestre",
    classes: ["epm", "epm-escudo"],
    window: { title: "Escudo do Mestre (EPM)", icon: "fa-solid fa-shield", resizable: true },
    position: { width: 940, height: 760 },
    actions: Object.fromEntries(ACOES.map(n => [n, acao(n)]))
  };

  static PARTS = { corpo: { template: `${CAMINHO}/escudo.hbs`, scrollable: [".epm-escudo-conteudo"] } };

  /* ---------- Dados ---------- */

  /** Configuração do grupo: fichas adicionadas à mão e personagens de jogador tirados. */
  _cfgGrupo() {
    const c = game.settings.get(FLAG, "escudoGrupo") ?? {};
    return { extras: Array.isArray(c.extras) ? c.extras : [], fora: Array.isArray(c.fora) ? c.fora : [] };
  }

  /** Grupo = personagens de jogador (menos os tirados) + qualquer ficha adicionada. */
  _grupo() {
    const { extras, fora } = this._cfgGrupo();
    const base = game.actors.filter(a => a.type === "character" && a.hasPlayerOwner && !fora.includes(a.id));
    const mais = extras.map(id => game.actors.get(id)).filter(a => a && !base.includes(a));
    return [...base, ...mais].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  async _salvarGrupo(cfg) {
    await game.settings.set(FLAG, "escudoGrupo", cfg);
    this.render();
  }

  async _incluirNoGrupo(actor) {
    if (!actor || actor.pack) return ui.notifications.warn("Só fichas do mundo (da aba Atores) entram no grupo.");
    const cfg = this._cfgGrupo();
    cfg.fora = cfg.fora.filter(id => id !== actor.id);
    if (!(actor.type === "character" && actor.hasPlayerOwner) && !cfg.extras.includes(actor.id)) cfg.extras.push(actor.id);
    await this._salvarGrupo(cfg);
    ui.notifications.info(`${actor.name} entrou no grupo do Escudo.`);
  }

  async _adicionarAoGrupo() {
    const dentro = new Set(this._grupo().map(a => a.id));
    const opcoes = game.actors.filter(a => !dentro.has(a.id)).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (!opcoes.length) return ui.notifications.info("Todas as fichas do mundo já estão no grupo.");
    const tipo = a => a.hasPlayerOwner ? "jogador" : (a.type === "npc" ? "NPC" : "sem jogador");
    const id = await foundry.applications.api.DialogV2.wait({
      window: { title: "Adicionar ficha ao grupo" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
      content: `<p class="epm-dica">Qualquer ficha do mundo: NPC, aliado, montaria, invocação… Também dá para arrastar da aba Atores para esta aba.</p>
        <label class="epm-campo"><span>Ficha</span><select name="ator">${opcoes.map(a => `<option value="${a.id}">${escapar(a.name)} (${tipo(a)})</option>`).join("")}</select></label>`,
      buttons: [
        { action: "ok", label: "Adicionar", icon: "fa-solid fa-user-plus", default: true, callback: (ev, b) => b.form?.elements?.ator?.value ?? null },
        { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
      ]
    });
    if (id && id !== "cancelar") await this._incluirNoGrupo(game.actors.get(id));
  }

  async _tirarDoGrupo(ev, alvo) {
    const actor = game.actors.get(alvo.dataset.id);
    if (!actor) return;
    const cfg = this._cfgGrupo();
    cfg.extras = cfg.extras.filter(id => id !== actor.id);
    if (actor.type === "character" && actor.hasPlayerOwner && !cfg.fora.includes(actor.id)) cfg.fora.push(actor.id);
    this._marcados.delete(actor.uuid);
    await this._salvarGrupo(cfg);
  }

  async _restaurarGrupo() {
    this._marcados.clear();
    await this._salvarGrupo({ extras: [], fora: [] });
  }

  /** Alvos das ações rápidas: marcados no escudo; se nenhum, os tokens selecionados na cena. */
  _alvos() {
    const marcados = [...this._marcados].map(u => fromUuidSync(u)).filter(Boolean);
    if (marcados.length) return { atores: marcados, origem: "marcados no escudo" };
    const tokens = (canvas?.tokens?.controlled ?? []).map(t => t.actor).filter(Boolean);
    return { atores: [...new Set(tokens)], origem: "tokens selecionados" };
  }

  async _prepareContext() {
    const c = game.combat;
    const combate = c ? {
      iniciado: c.started, rodada: c.round,
      linhas: (c.turns ?? []).map(t => ({
        id: t.id, actor: t.actor, name: t.name, img: t.img ?? t.token?.texture?.src, initiative: t.initiative,
        defeated: t.isDefeated ?? t.defeated, oculto: t.hidden, atual: c.combatant?.id === t.id
      }))
    } : null;
    const alvos = this._alvos();
    // Estado de cada condição nos alvos: "todos" ou "alguns"
    const condicoesDosAlvos = {};
    if (alvos.atores.length) {
      const contagem = {};
      for (const a of alvos.atores) for (const s of a.statuses ?? []) contagem[s] = (contagem[s] ?? 0) + 1;
      for (const [id, n] of Object.entries(contagem)) condicoesDosAlvos[id] = n === alvos.atores.length ? "todos" : "alguns";
    }
    let pericias = [];
    try { pericias = listaPericias().map(p => ({ id: p.id, nome: p.nome, selected: p.id === (this._ui.periciaTeste ?? "percepcao") })); } catch { pericias = []; }
    const ctx = montarEscudo({
      aba: this._aba, combate, grupo: this._grupo(),
      itensMundo: game.items.contents.map(i => ({ id: i.id, uuid: i.uuid, name: i.name, img: i.img, type: i.type })),
      ui: { ...this._ui, marcados: this._marcados, nomesAlvos: alvos.atores.map(a => a.name), origemAlvos: alvos.origem,
        condicoesDosAlvos, pericias, notas: game.settings.get(FLAG, "escudoNotas") ?? "", notion: conteudoNotion(),
        grupoAjustado: (() => { const c = this._cfgGrupo(); return c.extras.length + c.fora.length > 0; })() }
    });
    ctx.dtTeste = this._ui.dtTeste ?? 15;
    ctx.novasMestre = contextoEscudoNovas();
    ctx.mundo = this._contextoMundo();
    ctx.tiposDano = conteudoNotion("danos") ? [...SUGESTOES.dano, ...SUGESTOES.danoExtra] : (SUGESTOES.dano ?? []);
    return ctx;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    aplicarPaleta(this.element, COR_PADRAO, BRILHO_PADRAO);
    const raiz = this.element;
    // Seções <details> abertas continuam abertas ao redesenhar
    this._detalhes ??= new Set();
    const chave = d => `${this._aba}|${(d.querySelector(":scope > summary")?.textContent ?? "").replace(/[\d()]/g, "").replace(/\s+/g, " ").trim()}`;
    raiz.querySelectorAll("details").forEach(d => {
      if (this._detalhes.has(chave(d))) d.open = true;
      d.addEventListener("toggle", () => { if (d.open) this._detalhes.add(chave(d)); else this._detalhes.delete(chave(d)); });
    });
    const zona = raiz.querySelector("[data-soltar-grupo]");
    if (zona) {
      zona.addEventListener("dragover", ev => { ev.preventDefault(); zona.classList.add("soltando"); });
      zona.addEventListener("dragleave", () => zona.classList.remove("soltando"));
      zona.addEventListener("drop", async ev => {
        ev.preventDefault();
        zona.classList.remove("soltando");
        let dados;
        try { dados = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
        if (dados?.type !== "Actor") return ui.notifications.warn("Arraste uma ficha (ator) da aba Atores.");
        const actor = await fromUuid(dados.uuid);
        await this._incluirNoGrupo(actor);
      });
    }
    raiz.querySelectorAll("[data-marcar]").forEach(cx => cx.addEventListener("change", () => {
      if (cx.checked) this._marcados.add(cx.dataset.marcar); else this._marcados.delete(cx.dataset.marcar);
      this.render();
    }));
    raiz.querySelectorAll("[data-iniciativa]").forEach(inp => inp.addEventListener("change", async () => {
      const comb = game.combat?.combatants.get(inp.dataset.iniciativa);
      if (comb) await comb.update({ initiative: inp.value === "" ? null : num(inp.value) });
    }));
    const busca = (sel, chave) => {
      const el = raiz.querySelector(sel);
      if (!el) return;
      el.addEventListener("input", () => {
        this._ui[chave] = el.value;
        clearTimeout(this._buscaTimer);
        this._buscaTimer = setTimeout(() => this.render().then(() => {
          const novo = this.element.querySelector(sel);
          novo?.focus();
          novo?.setSelectionRange?.(novo.value.length, novo.value.length);
        }), 250);
      });
    };
    busca("[data-busca-cond]", "buscaCond");
    busca("[data-busca-item]", "buscaItem");
    raiz.querySelector("[data-tipo-item]")?.addEventListener("change", ev => { this._ui.tipoItem = ev.target.value; this.render(); });
    raiz.querySelector("[data-destino-item]")?.addEventListener("change", ev => { this._ui.alvoItem = ev.target.value; });
    raiz.querySelector("[data-pericia-teste]")?.addEventListener("change", ev => { this._ui.periciaTeste = ev.target.value; });
    raiz.querySelector("[data-dt-teste]")?.addEventListener("change", ev => { this._ui.dtTeste = int(ev.target.value); });
    raiz.querySelector("[data-notas]")?.addEventListener("change", ev => game.settings.set(FLAG, "escudoNotas", ev.target.value));
    // Itens do mundo podem ser arrastados direto para uma ficha
    raiz.querySelectorAll("[data-item-uuid]").forEach(el => el.addEventListener("dragstart", ev => {
      ev.dataTransfer.setData("text/plain", JSON.stringify({ type: "Item", uuid: el.dataset.itemUuid }));
    }));
  }

  _valor(sel) { return this.element.querySelector(sel)?.value ?? ""; }

  /* ---------- Mundo (0.6.0) ---------- */

  _contextoMundo() {
    const comp = lerMundo("compendioMundo", {}) ?? {};
    const calc = this._ui.calc ?? [{ nd: "", qtd: 1 }, { nd: "", qtd: 1 }, { nd: "", qtd: 1 }];
    const grupo = this._grupo();
    const niveis = grupo.map(a => { try { return lerAtor(a).ficha.nivelTotal; } catch { return 1; } });
    const resultado = mundo.calcularEncontro(calc, niveis);
    const discord = lerMundo("discord", {}) ?? {};
    const token = canvas?.tokens?.controlled?.[0]?.actor ?? null;
    return {
      relogios: mundo.relogiosVisiveis(true),
      codigos: Object.entries(lerMundo("codigos", {}) ?? {}).map(([id, c]) => ({
        id, ...c, modoLabel: mundo.MODOS_CODIGO[c.modo] ?? "", usos: Object.values(c.usos ?? {}).map(u => u.quem).filter(Boolean).join(", "),
        esgotado: (c.modo === "unico" && Object.keys(c.usos ?? {}).length > 0) || (c.modo === "grupo" && !!c.usos?.grupo)
      })).sort((a, b) => (b.criado ?? 0) - (a.criado ?? 0)),
      compendio: Object.entries(mundo.TIPOS_COMPENDIO).map(([tipo, t]) => ({ tipo, ...t, itens: Object.entries(comp[tipo] ?? {}).map(([id, e]) => ({ id, nome: e.nome, quando: new Date(e.versao).toLocaleDateString("pt-BR") })) })),
      calculadora: conteudoNotion("calculadora") ? { linhas: calc.map((l, i) => ({ i, ...l })), ...resultado, grupo: grupo.map((a, i) => ({ nome: a.name, nivel: niveis[i], pev: resultado.pev[i] })) } : null,
      discord: { ligado: !!discord.url, eventos: Object.entries(mundo.EVENTOS_DISCORD).filter(([id]) => discord[id] !== false).map(([, l]) => l).join(", ") },
      chefe: token ? { nome: token.name, ativo: !!token.flags?.[FLAG]?.chefe?.ativo, fase: token.flags?.[FLAG]?.chefe?.faseAtual ?? 1 } : null
    };
  }

  async _mundo(ev, alvo) {
    if (!game.user.isGM) return;
    const { op, id } = alvo.dataset;
    const ops = {
      novoRelogio: () => mundo.novoRelogio(), editarRelogio: () => mundo.novoRelogio(id), apagarRelogio: () => mundo.apagarRelogio(id),
      relogioMais: () => mundo.avancarRelogio(id, 1), relogioMenos: () => mundo.avancarRelogio(id, -1),
      novoCodigo: () => mundo.novoCodigo(), editarCodigo: () => mundo.novoCodigo(id), apagarCodigo: () => mundo.apagarCodigo(id),
      enquete: () => mundo.novaEnquete(), npc: () => mundo.fichaRapidaNpc(), discord: () => mundo.configurarDiscord(), testarDiscord: () => mundo.testarDiscord(),
      apagarCompendio: () => mundo.apagarDoCompendio(alvo.dataset.tipo, id),
      chefe: () => mundo.configurarChefe(canvas?.tokens?.controlled?.[0]?.actor ?? null),
      calcular: () => {
        const linhas = [...this.element.querySelectorAll("[data-calc-linha]")].map(l => ({ nd: l.querySelector("[data-calc-nd]")?.value ?? "", qtd: int(l.querySelector("[data-calc-qtd]")?.value, 1) }));
        this._ui.calc = [...linhas.filter(l => l.nd !== ""), { nd: "", qtd: 1 }];
        this.render();
      }
    };
    await ops[op]?.();
    this.render();
  }

  /* ---------- Navegação e fichas ---------- */

  _trocarAba(ev, alvo) { this._aba = alvo.dataset.tab; this.render(); }

  /** Liga/desliga um conteúdo extra do Notion (configuração privada do Mestre) e redesenha as fichas abertas. */
  /** Novas mecânicas: regras opcionais, listas, Inspiração, feitos e Aura de Horror. */
  async _novasMestre(ev, alvo) {
    if (!game.user.isGM) return;
    const N = await import("./escudo-novas.mjs");
    await N.acaoEscudo(this, alvo.dataset.op, alvo);
    this.render();
  }

  async _alternarNotion(ev, alvo) {
    if (!game.user.isGM) return;
    const chave = alvo.dataset.chave;
    const atual = conteudoNotion();
    await game.settings.set(FLAG, "conteudoNotion", { ...atual, [chave]: !atual[chave] });
    for (const app of foundry.applications.instances?.values?.() ?? []) {
      if (app?.document?.documentName === "Actor" && app.rendered) app.render();
    }
    if (chave === "condicoes") ui.notifications.info("Condições do Notion: recarregue (F5) para atualizar o HUD do token.");
    this.render();
  }
  _abrirFicha(ev, alvo) { fromUuidSync(alvo.dataset.uuid)?.sheet?.render(true); }
  _abrirItem(ev, alvo) { fromUuidSync(alvo.dataset.uuid)?.sheet?.render(true); }
  _focarToken(ev, alvo) {
    const comb = game.combat?.combatants.get(alvo.dataset.combatente);
    const t = comb?.token?.object;
    if (t) { t.control({ releaseOthers: true }); canvas.animatePan({ x: t.center.x, y: t.center.y }); }
  }

  /* ---------- Combate ---------- */

  async _comecarCombate() {
    if (!game.combat) return ui.notifications.warn("Crie um combate no Combat Tracker (adicione os tokens).");
    return game.combat.startCombat();
  }
  async _encerrarCombate() { return game.combat?.endCombat(); }
  async _proximoTurno() { return game.combat?.nextTurn(); }
  async _turnoAnterior() { return game.combat?.previousTurn(); }
  async _rolarIniciativaNpcs() { return game.combat?.rollNPC(); }
  async _novoTurnoAtual() {
    const a = game.combat?.combatant?.actor;
    if (!a) return ui.notifications.warn("Ninguém no turno agora.");
    return novoTurno(a);
  }
  async _alternarDerrotado(ev, alvo) {
    const comb = game.combat?.combatants.get(alvo.dataset.combatente);
    if (comb) await comb.update({ defeated: !comb.defeated });
  }

  /** Dano, cura ou temporário rápido nos alvos. */
  async _aplicarRapido(ev, alvo) {
    const tipo = alvo.dataset.tipo;
    const valor = Math.max(0, int(this._valor("[data-rapido-valor]")));
    const recurso = this._valor("[data-rapido-recurso]") || "pv";
    if (!valor) return ui.notifications.warn("Escreva um valor.");
    const { atores, origem } = this._alvos();
    if (!atores.length) return ui.notifications.warn("Marque alguém no escudo ou selecione tokens na cena.");
    const linhas = [];
    const tipoDano = this._valor("[data-rapido-tipo]") || "";
    for (const a of atores) {
      const { ficha } = estadoAtor(a);
      let updates = {};
      let nome = a.name;
      if (tipo === "dano") {
        // Dano de PV: imunidade, RD e resistência do alvo entram sozinhas
        const calc = recurso === "pv" && a.flags?.[FLAG] ? danoRecebido(ficha, valor, tipoDano) : { final: valor, passos: [] };
        if (calc.passos.length) nome = `${a.name} ${calc.final} (${calc.passos.join("; ")})`;
        updates = calc.final ? calcularPerda(ficha, recurso, calc.final).updates : {};
      }
      else if (tipo === "cura") updates = calcularRecuperacao(ficha, recurso, valor, { fonte: "Mestre", trocaPm: false }).updates;
      else if (tipo === "temp") updates = recurso === "pv" ? { "system.attributes.hp.temp": Math.max(int(a.system?.attributes?.hp?.temp), valor) } : { [`${P}.recursos.${recurso}.temp`]: valor };
      if (Object.keys(updates).length) await a.update(updates);
      linhas.push(nome);
    }
    const rot = { dano: "perdem", cura: "recuperam", temp: "recebem temporário de" }[tipo];
    ui.notifications.info(`${linhas.join(", ")} ${rot} ${valor} ${RECURSOS[recurso]?.abrev ?? recurso} (${origem}).`);
  }

  /* ---------- Grupo ---------- */

  _marcarTodos(ev, alvo) {
    const lista = alvo.dataset.de === "combate" ? (game.combat?.turns ?? []).map(t => t.actor?.uuid) : this._grupo().map(a => a.uuid);
    for (const u of lista.filter(Boolean)) this._marcados.add(u);
    this.render();
  }
  _limparMarcados() { this._marcados.clear(); this.render(); }

  async _darPontos() {
    const v = { pev: int(this._valor("[data-dar=pev]")), pt: int(this._valor("[data-dar=pt]")), ph: int(this._valor("[data-dar=ph]")) };
    const motivo = this._valor("[data-dar=motivo]").trim();
    if (!v.pev && !v.pt && !v.ph) return ui.notifications.warn("Escreva quanto dar.");
    const atores = this._alvos().atores.filter(a => a.type === "character");
    if (!atores.length) return ui.notifications.warn("Marque os personagens.");
    for (const a of atores) {
      const pontos = lerAtor(a).ficha.pontos;
      const u = {};
      for (const k of ["pev", "pt", "ph"]) if (v[k]) u[`${P}.pontos.${k}`] = Math.max(0, int(pontos[k]) + v[k]);
      await a.update(u);
    }
    const partes = [["pev", "PEv"], ["pt", "PT"], ["ph", "PH"]].filter(([k]) => v[k]).map(([k, r]) => `${v[k] > 0 ? "+" : ""}${v[k]} ${r}`);
    return ChatMessage.create({ content: `<div class="epm-chat epm-chat-nota"><p><strong>O Mestre deu</strong> ${partes.join(", ")} para ${atores.map(a => escapar(a.name)).join(", ")}${motivo ? ` (${escapar(motivo)})` : ""}.</p></div>` });
  }

  async _descansoGrupo(ev, alvo) {
    const atores = this._alvos().atores.filter(a => a.flags?.[FLAG]);
    if (!atores.length) return ui.notifications.warn("Marque os personagens.");
    for (const a of atores) await descanso(a, alvo.dataset.tipo);
  }

  _relacaoMultipla() { return game.modules.get(FLAG)?.api?.relacaoMultipla?.(); }

  /* ---------- Condições ---------- */

  async _alternarCondicao(ev, alvo) {
    const id = alvo.dataset.id;
    const { atores } = this._alvos();
    if (!atores.length) return ui.notifications.warn("Marque alguém no escudo ou selecione tokens na cena.");
    const todos = atores.every(a => a.statuses?.has(id));
    if (todos && await acumularNoEscudo(atores, id)) return this.render();
    for (const a of atores) await a.toggleStatusEffect(id, { active: !todos });
    this.render();
  }
  async _removerCondicao(ev, alvo) {
    const a = fromUuidSync(alvo.dataset.uuid);
    if (a) await a.toggleStatusEffect(alvo.dataset.id, { active: false });
  }
  async _exaustao(ev, alvo) {
    const { atores } = this._alvos();
    for (const a of atores.filter(x => x.flags?.[FLAG])) {
      const atual = lerAtor(a).ficha.exaustao.nivel;
      await definirExaustao(a, Math.max(0, Math.min(6, atual + int(alvo.dataset.delta))));
    }
  }

  /* ---------- Itens e moedas ---------- */

  async _darItem(ev, alvo) {
    const destino = game.actors.get(this._valor("[data-destino-item]") || this._ui.alvoItem);
    const item = fromUuidSync(alvo.dataset.uuid);
    if (!destino || !item) return ui.notifications.warn("Escolha para quem dar.");
    const dados = item.toObject();
    delete dados._id;
    await destino.createEmbeddedDocuments("Item", [dados]);
    ui.notifications.info(`${item.name} foi para ${destino.name}.`);
  }

  async _darTransformacao(ev, alvo) {
    const destino = game.actors.get(this._valor("[data-destino-item]") || this._ui.alvoItem);
    const t = TRANSFORMACOES_PRONTAS.find(x => x.id === alvo.dataset.id);
    if (!destino || !t) return ui.notifications.warn("Escolha para quem dar.");
    const { mods, ...resto } = t;
    delete resto.id;
    const novoId = () => foundry.utils.randomID();
    await destino.update({ [`${P}.transformacoes.${novoId()}`]: {
      ...resto, img: "", trocarToken: false, criado: Date.now(),
      mods: Object.fromEntries(mods.map(m => [novoId(), { ...m }]))
    } });
    ui.notifications.info(`${t.nome} foi para ${destino.name} (aba Habilidades → Transformações).`);
  }

  async _darMoedas() {
    const destino = game.actors.get(this._valor("[data-destino-item]") || this._ui.alvoItem);
    if (!destino) return ui.notifications.warn("Escolha para quem dar.");
    const atual = destino.flags?.[FLAG]?.moedas ?? {};
    const u = {};
    const partes = [];
    for (const m of MOEDAS) {
      const v = int(this._valor(`[data-moeda="${m.id}"]`));
      if (!v) continue;
      u[`${P}.moedas.${m.id}`] = Math.max(0, int(atual[m.id]) + v);
      partes.push(`${v} ${m.abrev}`);
    }
    if (!partes.length) return ui.notifications.warn("Escreva quantas moedas.");
    await destino.update(u);
    ui.notifications.info(`${destino.name} recebeu ${partes.join(", ")}.`);
  }

  /* ---------- Testes ---------- */

  async _rolarTestes(ev, alvo) {
    const pericia = this._valor("[data-pericia-teste]") || "percepcao";
    const dt = int(this._valor("[data-dt-teste]"), 15);
    const oculto = alvo.dataset.oculto === "1";
    const atores = this._alvos().atores.filter(a => a.flags?.[FLAG]);
    if (!atores.length) return ui.notifications.warn("Marque os personagens (aba Grupo ou Combate).");
    const resultados = [];
    for (const a of atores) {
      const { ficha } = lerAtor(a);
      const per = ficha.periciaPorId[pericia];
      const r = new Roll(`${formulaD20()} + ${per?.testeTotal ?? 0}`.replace("+ -", "- "));
      await r.evaluate();
      resultados.push({ nome: a.name, img: a.img, total: r.total, natural: r.dice[0]?.total ?? 0, passou: r.total >= dt, pericia: per?.nome ?? pericia });
    }
    resultados.sort((x, y) => y.total - x.total);
    this._ui.testes = { pericia: resultados[0]?.pericia ?? pericia, dt, oculto, resultados, passaram: resultados.filter(r => r.passou).length };
    this._ui.periciaTeste = pericia;
    this._ui.dtTeste = dt;
    const linhas = resultados.map(r => `<li>${escapar(r.nome)}: <strong>${r.total}</strong> ${r.passou ? "✔" : "✘"}</li>`).join("");
    await ChatMessage.create({
      content: `<div class="epm-chat epm-chat-nota"><p><strong>Teste de ${escapar(this._ui.testes.pericia)}</strong> (DT ${dt})</p><ul>${linhas}</ul></div>`,
      whisper: oculto ? game.users.filter(u => u.isGM).map(u => u.id) : []
    });
    this.render();
  }

  async _rolarLivre(ev, alvo) {
    const formula = this._valor("[data-formula-livre]").trim();
    if (!formula) return;
    try {
      const r = new Roll(formula);
      await r.evaluate();
      await r.toMessage({ flavor: "Escudo do Mestre" }, { rollMode: alvo.dataset.oculto === "1" ? "gmroll" : "publicroll" });
    } catch { ui.notifications.error("Fórmula inválida."); }
  }
}

export function abrirEscudo() {
  if (!game.user.isGM) return ui.notifications.warn("O Escudo do Mestre é só do Mestre.");
  escudo ??= new EscudoMestre();
  return escudo.render(true);
}

/** Redesenha o escudo aberto (com atraso para juntar mudanças). */
export function atualizarEscudo() {
  if (!escudo?.rendered) return;
  clearTimeout(pendente);
  pendente = setTimeout(() => escudo?.rendered && escudo.render(), 300);
}

/** Botão "Escudo do Mestre" na aba Atores e no Combat Tracker. */
export function botaoEscudo(app, html) {
  if (!game.user.isGM) return;
  const raiz = html instanceof HTMLElement ? html : html?.[0];
  if (!raiz || raiz.querySelector(".epm-botao-escudo")) return;
  const alvo = raiz.querySelector(".header-actions") ?? raiz.querySelector(".directory-header") ?? raiz.querySelector(".combat-tracker-header") ?? raiz.querySelector("header");
  if (!alvo) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "epm-botao-escudo";
  b.innerHTML = '<i class="fa-solid fa-shield" aria-hidden="true"></i> Escudo do Mestre';
  b.addEventListener("click", ev => { ev.preventDefault(); abrirEscudo(); });
  alvo.append(b);
}
