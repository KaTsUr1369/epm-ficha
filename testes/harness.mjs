/**
 * Renderiza os templates da ficha fora do Foundry (Handlebars 4.7 + helpers do módulo).
 * Os helpers do Foundry (e nomes comuns de outros módulos) são registrados para FALHAR se forem
 * chamados: assim um campo escrito sem "this." que colida com um helper quebra o teste.
 */
import { createRequire } from "module";
import fs from "fs";
import { registrarHelpers } from "/home/claude/epm-ficha/scripts/helpers.mjs";
import { montarContexto, conteudoRevelacoes } from "/home/claude/epm-ficha/scripts/context.mjs";
import { normalizarDados } from "/home/claude/epm-ficha/scripts/data.mjs";

const require = createRequire(import.meta.url);
export const Handlebars = require("/home/claude/ext/handlebars/handlebars.js");
const RAIZ = "/home/claude/epm-ficha/templates";

/** Helpers do Foundry v13 e nomes genéricos que outros módulos costumam registrar. */
export const HELPERS_PERIGOSOS = [
  "checked", "disabled", "colorPicker", "concat", "editor", "filePicker", "formGroup", "formField", "formInput", "ifThen",
  "localize", "numberFormat", "numberInput", "object", "radioBoxes", "rangePicker", "select", "selectOptions", "timeSince",
  "eq", "ne", "lt", "lte", "gt", "gte", "and", "or", "not", "json", "times", "math", "add", "subtract", "multiply", "divide",
  "abs", "ceil", "floor", "round", "sum", "default", "is", "isnt", "contains", "length", "lowercase", "uppercase", "capitalize",
  "join", "split", "first", "last", "after", "before", "sort", "reverse", "stringify", "parse", "raw", "markdown", "date",
  "range", "repeat", "inArray", "filter", "map", "pluck", "any", "every", "some", "keys", "values", "array", "replace",
  "truncate", "trim", "ellipsis", "url", "escape", "css", "img", "icon", "svg", "html", "text", "title", "name", "value",
  "type", "label", "id", "nome", "valor", "tipo", "descricao", "efeito", "efeitos", "cor", "dica", "texto", "fonte", "fontes",
  "ativo", "ativa", "total", "imagem", "conteudo", "opcoes", "grupos", "itens", "nivel", "max", "min", "pct", "dano",
  "acerto", "custo", "condicao", "busca", "resumo", "selected", "favorito", "img", "uuid", "notas", "mods", "lista",
  "dnd5e-numberFormat", "dnd5e-dataset", "dnd5e-groupedSelectOptions", "dnd5e-itemContext", "dnd5e-linkForUuid",
  "numberFormatAbbreviated", "getProperty", "setProperty", "dataset", "linkForUuid", "concealSection"
];

let preparado = false;
export function prepararHandlebars() {
  if (preparado) return Handlebars;
  for (const nome of HELPERS_PERIGOSOS) {
    Handlebars.registerHelper(nome, function () { throw new Error(`Template chamou o helper "${nome}" sem querer (use this.${nome})`); });
  }
  registrarHelpers(Handlebars);
  const partials = {
    "epm-item-linha": "partials/item-linha.hbs",
    "epm-poder-linha": "partials/poder-linha.hbs",
    "epm-busca": "partials/busca.hbs",
    "epm-exaustao": "partials/exaustao.hbs",
    "epm-bencao": "partials/bencao.hbs",
    "epm-arquetipo-painel": "partials/arquetipo-painel.hbs",
    "epm-classe-painel": "partials/classe-painel.hbs",
    "epm-novas": "partials/novas.hbs",
    "epm-transformacoes": "partials/transformacoes.hbs",
    "epm-historico": "partials/historico.hbs",
    "epm-painel-060": "partials/painel-060.hbs"
  };
  for (const [nome, arq] of Object.entries(partials)) Handlebars.registerPartial(nome, fs.readFileSync(`${RAIZ}/${arq}`, "utf8"));
  preparado = true;
  return Handlebars;
}

const cache = new Map();
export function renderizar(arquivo, ctx) {
  prepararHandlebars();
  if (!cache.has(arquivo)) cache.set(arquivo, Handlebars.compile(fs.readFileSync(`${RAIZ}/${arquivo}`, "utf8")));
  return cache.get(arquivo)(ctx, { allowProtoPropertiesByDefault: true });
}

export const PARTES = ["erro", "header", "nav", "principal", "combate", "inventario", "habilidades", "arqclasse", "magias", "treinamentos", "sobre", "anotacoes", "condicoes", "bencaos", "relacoes", "companheiros", "bestiario", "producao", "personalizacao"];

/** Contexto completo da ficha para um ator de exemplo. */
export function contextoDe(ator, { parceiros = [], ui = {}, ajustes = {}, usuario = { isGM: true }, editavel = true, idiomas = { catalogo: [], polyglot: false }, mundo060 = {} } = {}) {
  const porUuid = uuid => {
    const p = parceiros.find(x => x.uuid === uuid);
    if (!p) return null;
    const dados = normalizarDados(p.flags?.["epm-ficha"] ?? {});
    const ricos = Object.fromEntries(["aparencia", "personalidade", "objetivos", "medos", "historia", "outros"].map(k => [k, dados.sobre?.[k] ?? ""]));
    return { uuid: p.uuid, name: p.name, img: p.img, dados, revelacoes: conteudoRevelacoes(dados, ricos), jogador: true };
  };
  const enriquecidos = { itens: {}, sobre: {} };
  for (const k of ["historia", "aparencia", "personalidade", "objetivos", "medos", "outros"]) enriquecidos.sobre[k] = ator.flags["epm-ficha"]?.sobre?.[k] ?? "";
  const editores = { sobre: {}, notas: {}, arqclasse: {} };
  enriquecidos.arqclasse = {};
  for (const k of ["arquetipo", "classe"]) {
    enriquecidos.arqclasse[k] = ator.flags["epm-ficha"]?.arqclasse?.[k]?.notas ?? "";
    editores.arqclasse[k] = `<div class="editor-simulado"><div class="editor-content">${enriquecidos.arqclasse[k] || "<p></p>"}</div></div>`;
  }
  for (const k of Object.keys(enriquecidos.sobre)) editores.sobre[k] = `<div class="editor-simulado"><div class="editor-content">${enriquecidos.sobre[k] || "<p></p>"}</div></div>`;
  return montarContexto({
    actor: ator, itens: ator.items.contents ?? ator.items,
    ui: { abas: { primary: "principal", magias: "0" }, expandidos: new Set(), filtroRaridades: new Set(), ...ui },
    ajustes: { modoLimites: "separados", afinidadeSoMestre: true, ...ajustes },
    usuario, enriquecidos, editores, editavel, idiomas, atores: { porUuid }, mundo060
  });
}

/** HTML de todas as partes (na ordem do Foundry). */
export function renderizarPartes(ctx) {
  return PARTES.map(p => renderizar(`actor/${p}.hbs`, ctx)).join("\n");
}
