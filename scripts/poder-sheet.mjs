/**
 * Editor de habilidade ou magia: raridade, formas (cada uma com ação, custo, teste, dano,
 * requisitos e efeito), usos e melhorias compradas com PT.
 */
import { FLAG, CAMINHO } from "./config.mjs";
import { lerPoder, formaPadrao, novoId, int } from "./data.mjs";
import { lerAtor, dadosRolagemEPM, montarContextoPoder } from "./context.mjs";
import { enriquecer, editorHTML, escapar } from "./helpers.mjs";
import { listaPericias } from "./settings.mjs";
import * as M from "./mecanicas.mjs";
import { escolherImagem } from "./imagens.mjs";
import { aplicarPaleta } from "./personalizacao.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const P = `flags.${FLAG}`;

const ACOES_EDITOR = ["novaForma", "excluirForma", "duplicarForma", "moverForma", "aplicarMelhoria", "removerMelhoria", "editarImagem", "novaOpcaoBonus", "removerOpcaoBonus", "subirNivelHab"];
const despachar = nome => function (evento, alvo) {
  return this[`acao${nome[0].toUpperCase()}${nome.slice(1)}`]?.(evento, alvo);
};

export class EPMPoderSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["epm", "epm-poder"],
    position: { width: 700, height: 820 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: Object.fromEntries(ACOES_EDITOR.map(n => [n, despachar(n)]))
  };

  static PARTS = {
    corpo: { template: `${CAMINHO}/item/poder.hbs`, scrollable: [""] }
  };

  /** O editor acompanha a cor da ficha do dono. */
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
    const rolagem = ficha ? dadosRolagemEPM(ficha) : {};
    const p = lerPoder(item);
    const editores = { formas: {} };
    for (const fo of p.formas) {
      editores.formas[fo.id] = editorHTML({
        name: `${P}.formas.${fo.id}.efeito`, value: fo.efeito, documentUUID: item.uuid, compact: true,
        enriched: await enriquecer(fo.efeito, { relativeTo: item, rollData: rolagem })
      });
    }
    const descricao = item.system?.description?.value ?? "";
    editores.descricao = editorHTML({
      name: "system.description.value", value: descricao, documentUUID: item.uuid,
      enriched: await enriquecer(descricao, { relativeTo: item, rollData: rolagem, secrets: item.isOwner })
    });
    return Object.assign(base, montarContextoPoder({ item, ficha, listaPericias: listaPericias(), editores, editavel: this.isEditable }));
  }

  async acaoNovaForma() {
    const formas = lerPoder(this.item).formas;
    const ordem = formas.length ? Math.max(...formas.map(f => f.ordem)) + 1 : 0;
    await this.item.update({ [`${P}.formas.${novoId()}`]: formaPadrao(ordem, `Forma ${formas.length + 1}`) });
  }

  async acaoNovaOpcaoBonus(ev, alvo) {
    const forma = alvo.dataset.forma;
    const n = lerPoder(this.item).formas.find(f => f.id === forma)?.bonus.opcoes.length ?? 0;
    const tipo = ["rd", "ca", "dano", "acerto"][n % 4];
    const valor = { rd: 10, ca: 3, dano: "10", acerto: 3 }[tipo];
    await this.item.update({ [`${P}.formas.${forma}.bonus.opcoes.${novoId()}`]: { tipo, valor, tipoDano: "", criado: Date.now() } });
  }

  /** Sobe 1 nível da habilidade pagando os PH por nível da ficha dona. */
  async acaoSubirNivelHab() {
    const item = this.item;
    const custo = int(item.flags?.[FLAG]?.phPorNivel);
    const nivel = Math.max(1, int(item.flags?.[FLAG]?.nivelHab, 1));
    const actor = item.actor;
    if (actor && custo) {
      const ph = int(actor.flags?.[FLAG]?.pontos?.ph);
      if (ph < custo) return ui.notifications.warn(`Faltam ${custo - ph} PH: subir ${item.name} custa ${custo} e ${actor.name} tem ${ph}.`);
      if (!(await M.confirmar("Subir nível", `<p>Subir <strong>${escapar(item.name)}</strong> para o nível ${nivel + 1} por <strong>${custo} PH</strong>? (${actor.name} tem ${ph}.)</p>`))) return;
      await actor.update({ [`${P}.pontos.ph`]: ph - custo });
    }
    await item.update({ [`${P}.nivelHab`]: nivel + 1 });
    if (actor) await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="epm-chat epm-chat-nota"><p><strong>${escapar(actor.name)}</strong> subiu <strong>${escapar(item.name)}</strong> para o nível ${nivel + 1}${custo ? ` (−${custo} PH)` : ""}.</p></div>` });
  }

  async acaoRemoverOpcaoBonus(ev, alvo) {
    await this.item.update({ [`${P}.formas.${alvo.dataset.forma}.bonus.opcoes.-=${alvo.dataset.opcao}`]: null });
  }

  async acaoExcluirForma(ev, alvo) {
    const forma = lerPoder(this.item).formas.find(f => f.id === alvo.dataset.forma);
    if (!forma) return;
    if (!(await M.confirmar("Excluir forma", `<p>Excluir a forma <strong>${escapar(forma.nome)}</strong>?</p>`))) return;
    await this.item.update({ [`${P}.formas.-=${forma.id}`]: null });
  }

  async acaoDuplicarForma(ev, alvo) {
    const formas = lerPoder(this.item).formas;
    const forma = formas.find(f => f.id === alvo.dataset.forma);
    if (!forma) return;
    const { id: _ignorado, ...dados } = forma;
    const ordem = Math.max(...formas.map(f => f.ordem)) + 1;
    await this.item.update({ [`${P}.formas.${novoId()}`]: { ...dados, nome: `${forma.nome} (cópia)`, ordem } });
  }

  async acaoMoverForma(ev, alvo) {
    const formas = lerPoder(this.item).formas;
    const i = formas.findIndex(f => f.id === alvo.dataset.forma);
    const j = i + int(alvo.dataset.dir);
    if (i < 0 || j < 0 || j >= formas.length) return;
    [formas[i], formas[j]] = [formas[j], formas[i]];
    await this.item.update(Object.fromEntries(formas.map((f, k) => [`${P}.formas.${f.id}.ordem`, k])));
  }

  acaoAplicarMelhoria() {
    const raiz = this.element;
    return M.aplicarMelhoria(this.item, {
      tipo: raiz.querySelector('[data-melhoria="tipo"]')?.value,
      formaId: raiz.querySelector('[data-melhoria="forma"]')?.value,
      nota: raiz.querySelector('[data-melhoria="nota"]')?.value?.trim() ?? ""
    });
  }

  async acaoRemoverMelhoria(ev, alvo) {
    if (!(await M.confirmar("Remover registro", "<p>Remover este registro? O PT gasto não volta e a fórmula de dano não muda.</p>"))) return;
    await this.item.update({ [`${P}.melhorias.-=${alvo.dataset.melhoria}`]: null });
  }

  async acaoEditarImagem() {
    if (!this.isEditable) return;
    const caminho = await escolherImagem({ atual: this.item.img, titulo: `Imagem de ${this.item.name}` });
    if (caminho) await this.item.update({ img: caminho });
  }
}

/** Abre (ou traz para frente) o editor EPM de uma habilidade ou magia. */
export function abrirEditorPoder(item) {
  const aberto = Object.values(item.apps ?? {}).find(a => a instanceof EPMPoderSheet);
  if (aberto) {
    aberto.render(true);
    aberto.bringToFront?.();
    return aberto;
  }
  const app = new EPMPoderSheet({ document: item });
  app.render(true);
  return app;
}
