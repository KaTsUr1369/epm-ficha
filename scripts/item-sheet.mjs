/**
 * Editor de item EPM (armas, armaduras, consumíveis, ferramentas, loot e mochilas), no lugar da janela do D&D 5e:
 * raridade, quantidade, peso, preço em moedas EPM, ataque, armadura, bônus e efeitos e, nas mochilas,
 * capacidade, conteúdo e moedas guardadas.
 */
import { FLAG, CAMINHO, TIPOS_EFEITO_ITEM } from "./config.mjs";
import { novoId, int } from "./data.mjs";
import { lerAtor, montarContextoItem, listaPropriedades } from "./context.mjs";

const listaPropriedadesItem = item => listaPropriedades(item.flags?.["epm-ficha"] ?? {});
import { enriquecer, editorHTML } from "./helpers.mjs";
import { moverMoedasMochila, recarregarArma } from "./mecanicas.mjs";
import { listaPericias } from "./settings.mjs";
import { escolherImagem } from "./imagens.mjs";
import { aplicarPaleta } from "./personalizacao.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const P = `flags.${FLAG}`;

export const TIPOS_EDITOR_ITEM = ["weapon", "equipment", "consumable", "tool", "loot", "container", "backpack"];

const ACOES = ["editarImagem", "adicionarEfeito", "removerEfeito", "guardarMoedas", "pegarMoedas", "tirarItem", "abrirItem", "recarregar", "novoModo", "removerModo", "novaMelhoriaItem", "removerMelhoriaItem", "adicionarPropriedade", "removerPropriedade"];
const despachar = nome => function (evento, alvo) {
  return this[`acao${nome[0].toUpperCase()}${nome.slice(1)}`]?.(evento, alvo);
};

export class EPMItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["epm", "epm-item-janela"],
    position: { width: 620, height: 720 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: Object.fromEntries(ACOES.map(n => [n, despachar(n)]))
  };

  static PARTS = {
    corpo: { template: `${CAMINHO}/item/item.hbs`, scrollable: [""] }
  };

  async _onRender(context, options) {
    await super._onRender(context, options);
    const pers = this.item.actor?.flags?.[FLAG]?.personalizacao;
    if (pers?.cor) aplicarPaleta(this.element, pers.cor, pers.brilho);
  }

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const item = this.item;
    const actor = item.actor ?? null;
    const ficha = actor ? lerAtor(actor, listaPericias()).ficha : null;
    const descricao = item.system?.description?.value ?? "";
    const editores = {
      descricao: editorHTML({
        name: "system.description.value", value: descricao, documentUUID: item.uuid,
        enriched: await enriquecer(descricao, { relativeTo: item, secrets: item.isOwner })
      })
    };
    return Object.assign(base, montarContextoItem({ item, ficha, editores, editavel: this.isEditable }));
  }

  /** Quantidades e campos numéricos chegam como texto; garante números e não deixa moedas negativas. */
  _prepareSubmitData(event, form, formData, updateData) {
    const dados = super._prepareSubmitData(event, form, formData, updateData);
    const moedas = dados?.flags?.[FLAG]?.moedas;
    if (moedas) for (const k of Object.keys(moedas)) moedas[k] = Math.max(0, int(moedas[k]));
    return dados;
  }

  /** Propriedades: guarda a lista (e o texto, que a ficha lê) sem repetir. */
  async _salvarPropriedades(lista) {
    const unicas = [...new Set(lista.map(t => String(t).trim()).filter(Boolean))];
    await this.item.update({ [`${P}.propriedades`]: unicas, [`${P}.propriedadesTexto`]: unicas.join(", ") });
  }

  async acaoAdicionarPropriedade() {
    const sel = this.element.querySelector("[data-nova-propriedade]");
    const livre = this.element.querySelector("[data-propriedade-livre]");
    const novas = [sel?.value, ...String(livre?.value ?? "").split(",")].map(t => String(t ?? "").trim()).filter(Boolean);
    if (!novas.length) return ui.notifications.info("Escolha uma propriedade na lista ou escreva uma.");
    return this._salvarPropriedades([...listaPropriedadesItem(this.item), ...novas]);
  }

  async acaoRemoverPropriedade(ev, alvo) {
    return this._salvarPropriedades(listaPropriedadesItem(this.item).filter(n => n !== alvo.dataset.nome));
  }

  async acaoEditarImagem() {
    const caminho = await escolherImagem({ atual: this.item.img, titulo: `Imagem de ${this.item.name}` });
    if (caminho) await this.item.update({ img: caminho });
  }

  async acaoAdicionarEfeito() {
    const tipoSel = this.element.querySelector("[data-novo-efeito]")?.value;
    const tipo = TIPOS_EFEITO_ITEM[tipoSel] ? tipoSel : "mod";
    const item = this.item;
    await item.update({
      [`${P}.efeitos.${novoId()}`]: {
        tipo, alvo: tipo === "mod" && item.type === "equipment" ? "ca" : "", valor: tipo === "rd" || tipo === "mod" ? 1 : 0,
        tipoDano: "", em: "", recurso: "pv", formula: "", quando: item.type === "weapon" ? "acerto" : "uso", criado: Date.now()
      }
    });
  }

  async acaoNovoModo() {
    await this.item.update({ [`${P}.modos.${novoId()}`]: { nome: "", dano: "", tipoDano: "", pericia: "", bonusAcerto: "", criado: Date.now() } });
  }

  async acaoRemoverModo(ev, alvo) {
    await this.item.update({ [`${P}.modos.-=${alvo.dataset.modo}`]: null });
  }

  async acaoRemoverEfeito(ev, alvo) {
    await this.item.update({ [`${P}.efeitos.-=${alvo.dataset.efeito}`]: null });
  }

  acaoGuardarMoedas() { return moverMoedasMochila(this.item, "guardar"); }
  acaoPegarMoedas() { return moverMoedasMochila(this.item, "pegar"); }

  async acaoTirarItem(ev, alvo) {
    const it = this.item.actor?.items.get(alvo.dataset.itemId);
    if (it) await it.update({ "system.container": null });
    this.render();
  }

  async acaoRecarregar() {
    if (this.item.actor) await recarregarArma(this.item.actor, this.item);
  }

  acaoAbrirItem(ev, alvo) {
    const it = this.item.actor?.items.get(alvo.dataset.itemId);
    if (it) abrirEditorItem(it);
  }
}

/** Abre o editor EPM do item (ou traz para frente se já estiver aberto). */
export function abrirEditorItem(item) {
  if (!TIPOS_EDITOR_ITEM.includes(item?.type)) return item?.sheet?.render(true);
  const aberto = Object.values(item.apps ?? {}).find(a => a instanceof EPMItemSheet);
  if (aberto) {
    aberto.render(true);
    aberto.bringToFront?.();
    return aberto;
  }
  const app = new EPMItemSheet({ document: item });
  app.render(true);
  return app;
}

/* 0.6.0: base das Melhorias de itens */
Object.assign(EPMItemSheet.prototype, {
  acaoNovaMelhoriaItem(ev, alvo) {
    return this.item.update({ [`flags.${FLAG}.melhoriasItem.${foundry.utils.randomID()}`]: { categoria: alvo.dataset.categoria, nome: "", efeito: "", criado: Date.now() } });
  },
  acaoRemoverMelhoriaItem(ev, alvo) {
    return this.item.update({ [`flags.${FLAG}.melhoriasItem.-=${alvo.dataset.id}`]: null });
  }
});
