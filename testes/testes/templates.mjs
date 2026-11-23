import { contextoDe, renderizarPartes, renderizar } from "../harness.mjs";
import { criarAurelia, criarParceiro, IDIOMAS_POLYGLOT } from "../amostra.mjs";
let falhas = 0;
const caso = (nome, fn) => { try { fn(); console.log("ok  ", nome); } catch (e) { falhas++; console.log("FALHA", nome, "\n   ", e.message.split("\n").slice(0, 4).join("\n    ")); } };
for (const edicao of [false, true]) {
  for (const aba of ["principal", "combate", "inventario", "habilidades", "arqclasse", "magias", "treinamentos", "sobre", "anotacoes", "condicoes", "bencaos", "relacoes", "personalizacao"]) {
    caso(`renderiza ${aba} (edição ${edicao})`, () => {
      const { ator, parceiro } = criarAurelia({ edicao });
      const ctx = contextoDe(ator, { parceiros: [parceiro], ui: { edicao, abas: { primary: aba }, bencaos: { aberto: aba === "bencaos" }, relacoesAbertas: new Set(["r1"]), expandidos: new Set(ator.items.map(i => i.id)) }, idiomas: { catalogo: IDIOMAS_POLYGLOT, polyglot: true } });
      const html = renderizarPartes(ctx);
      if (html.includes("[object Object]")) throw new Error("[object Object] no HTML");
      if (/undefined/.test(html.replace(/data-[a-z-]+="undefined"/g, ""))) {
        const i = html.search(/undefined/);
        throw new Error("'undefined' no HTML: …" + html.slice(Math.max(0, i - 120), i + 40));
      }
    });
  }
}
caso("editor de item EPM renderiza todos os tipos", async () => {});
{
  const { montarContextoItem } = await import("/home/claude/epm-ficha/scripts/context.mjs");
  const { ator } = criarAurelia({ edicao: true });
  for (const it of ator.items) {
    if (!["weapon", "equipment", "consumable", "tool", "loot", "container"].includes(it.type)) continue;
    it.actor = ator;
    caso(`editor de item: ${it.name} (${it.type})`, () => {
      const html = renderizar("item/item.hbs", montarContextoItem({ item: it, ficha: null, editores: { descricao: "<p>desc</p>" }, editavel: true }));
      if (/undefined|\[object Object\]/.test(html.replace(/data-[a-z-]+="undefined"/g, ""))) throw new Error("valor faltando no HTML");
      if (it.type === "container" && !html.includes('name="flags.epm-ficha.moedas.po" value="40"')) throw new Error("moedas da mochila não aparecem");
    });
  }
}
caso("ficha vazia (ator novo) renderiza", () => {
  const ator = { id: "x", uuid: "Actor.x", name: "Novo", img: "icons/svg/mystery-man.svg", flags: {}, system: { attributes: { hp: { value: 0, max: 0 } } }, statuses: new Set(), items: [] };
  ator.items.contents = [];
  renderizarPartes(contextoDe(ator, { ui: { edicao: true } }));
});
caso("chat: cartao e ataque", () => {
  renderizar("chat/cartao.hbs", { actorUuid: "a", img: "x", nome: "Teste", linhas: [{ rotulo: "A", valor: "B" }], requisitos: [], avisos: ["x"], botoes: [{ acao: "formula", formula: "1d6", rotulo: "r", label: "l", icone: "i" }] });
  renderizar("chat/ataque.hbs", { actorUuid: "a", nome: "x", periciaNome: "Luta", htmlAtaque: "", htmlDano: "", notas: ["n"], botoes: [{ acao: "cura", formula: "1d4", recurso: "pv", rotulo: "r", label: "l", icone: "i" }] });
});
console.log(falhas ? `\n${falhas} falha(s)` : "\ntodos os templates ok");
process.exit(falhas ? 1 : 0);
