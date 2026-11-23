import { normalizarDados, calcularFicha, efeitosDeItens, pagarMoedas, formatarMoedas, consolidarMoedas } from "/home/claude/epm-ficha/scripts/data.mjs";
import { CONDICOES, COMBINACOES } from "/home/claude/epm-ficha/scripts/config.mjs";
import { CATALOGO, dadosNovaEntrada } from "/home/claude/epm-ficha/scripts/bencaos.mjs";
const dados = normalizarDados({ atributos: { forca: { base: 3 }, destreza: { base: 2 } }, exaustao: 2,
  pericias: { luta: { nome: "Luta", atributos: ["destreza", "forca"], pontos: 4 }, percepcao: { nome: "Percepção", atributos: ["inteligencia"], pontos: 2 } },
  bencaos: { a: dadosNovaEntrada(CATALOGO.find(c => c.id === "m019")), b: { ...dadosNovaEntrada(CATALOGO.find(c => c.id === "b054")), ativo: true } },
  moedas: { kan: 2, po: 5 } });
const itens = efeitosDeItens([{ id: "i1", name: "Cota de malha", type: "equipment", system: { equipped: true }, flags: { "epm-ficha": { efeitos: {
  e1: { tipo: "mod", alvo: "ca", valor: 4 }, e2: { tipo: "desvantagem", em: "pericia.furtividade" }, e3: { tipo: "rd", valor: 2, tipoDano: "Corte" }, e4: { tipo: "mod", alvo: "deslocamento", valor: -1.5 } } } } }]);
const f = calcularFicha({ dados, hp: { value: 30, max: 40 }, statuses: ["epm-rigidez-muscular", "epm-molhado", "epm-aterramento", "epm-enregelado", "epm-colapso-fisico", "epm-vinculo-quebrado"], itens });
console.log("condições ativas:", f.condicoesAtivas.map(c => c.label + (c.automatica ? "*" : "")).join(", "));
console.log("combinações:", f.combinacoes.map(k => k.titulo));
console.log("for", f.atributos.forca.total, "teste", f.atributos.forca.testeMod, "| des teste", f.atributos.destreza.testeMod);
console.log("luta total", f.periciaPorId.luta.total, "testeMod", f.periciaPorId.luta.testeMod, f.periciaPorId.luta.testeFontes.map(x => `${x.fonte}:${x.valor}`).join(" "));
console.log("CA", f.ca.total, "desloc", f.deslocamento.final, f.deslocamento.motivos);
console.log("bloq ações", JSON.stringify(f.bloqueios.acoes));
console.log("vulneraveis", f.vulneraveis);
console.log("bencaos", f.bencaos.map(x => `${x.b.nome} vale=${x.vale} susp=${x.suspensaPor}`));
console.log("moedas", dados.moedas, formatarMoedas(2000500), pagarMoedas({ dr: 1 }, 1), consolidarMoedas({ pc: 1234 }));
console.log("condições", CONDICOES.length, "combinações", COMBINACOES.length);
console.log("desv", JSON.stringify(f.desvantagens));
