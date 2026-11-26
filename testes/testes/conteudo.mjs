globalThis.foundry = { utils: { randomID: () => "x", mergeObject: (a, b) => Object.assign(a, b), getProperty: (o, p) => p.split(".").reduce((a, k) => a?.[k], o) } };
import fs from "fs";
let falhas = 0; const ok = (c, m) => { console.log(c ? "ok  " : "FALHA", m); if (!c) falhas++; };
const C = await import("/home/claude/epm-ficha/scripts/conteudo-epm.mjs");
const { lerAtor } = await import("/home/claude/epm-ficha/scripts/context.mjs");
const m = await C.documentosManual(fs.readFileSync("/home/claude/epm-ficha/README.md", "utf8"));
const pgs = m.docs[0].pages;
ok(pgs.length === 5 && pgs.at(-1).name === "Patch notes" && /Versão 0\.8\.2/.test(pgs.at(-1).text.content), "Manual: 5 abas, a última é Patch notes com as versões");
const n = await C.documentosNpcs();
ok(n.docs.length === C.NPCS_MODELO.length && n.pastas.length === 3, `NPCs modelo: ${n.docs.length} em 3 regiões`);
{
  const porNome = nome => n.docs.find(d => d.name === nome);
  const merc = porNome("Mercador Viajante"), lich = porNome("Lich Ancestral"), aranha = porNome("Aranha Gigante");
  ok(n.docs.length >= 35, `0.8.28: mais NPCs modelo (${n.docs.length})`);
  ok(merc.flags["epm-ficha"].npc.disposicao === "Amigável" && Object.keys(merc.flags["epm-ficha"].npc.servicos).length === 3 && merc.prototypeToken.disposition === 1, "Mercador: amigável, com serviços e token aliado");
  const atLich = Object.values(lich.flags["epm-ficha"].ataques);
  ok(atLich.filter(a => a.gerado && !/área/i.test(a.nome)).length === 4 && atLich.some(a => /área/i.test(a.nome)) && Object.values(lich.flags["epm-ficha"].npc.lacaios)[0]?.nome === "Esqueleto Guerreiro" && lich.flags["epm-ficha"].npc.tipo === "chefe", `Lich (0.9.0): chefe com 4 ataques (2 Lendárias), área e lacaios (${atLich.length})`);
  ok(Object.values(lich.flags["epm-ficha"].npc.recargas ?? {}).some(r => r.nome === "Ataque em área") && lich.flags["epm-ficha"].npc.custo > 0 && ["comum", "raro", "epico", "lendario"].includes(lich.flags["epm-ficha"].npc.raridade), "modelos com recarga da área, raridade e custo");
  ok(Object.values(aranha.flags["epm-ficha"].npc.recargas)[0]?.min === 5 && Object.values(aranha.flags["epm-ficha"].npc.conhecimento.niveis).length === 2, "Aranha: recarga 5–6 e conhecimento por CD");
  ok(new Set(n.docs.map(d => d._id)).size === n.docs.length, "ids únicos nos NPCs modelo");
  const tipos = new Set(n.docs.map(d => d.flags["epm-ficha"].npc.tipo));
  ok(["comum", "importante", "monstro", "forte", "chefe"].every(t => tipos.has(t)), "NPCs modelo cobrem os 5 tipos de ficha");
}
const bate = n.docs.every(d => { const { ficha } = lerAtor({ ...d, items: [] }); const r = d.flags["epm-ficha"].npc.referencia; return ficha.ca.total === r.ca && ficha.cd.valor === r.cd && ficha.periciaPorId.luta.total === r.acerto; });
ok(bate, "NPCs modelo: CA, CD e acerto batem com a tabela de inimigos");
const l = await C.documentosLoot();
ok(l.docs.length === 12 && l.docs.every(t => t.results.length && t.results.at(-1).range[1] === Number(t.formula.slice(2))), "Tabelas de loot: 12, faixas contínuas até o dado da fórmula");
const me = await C.documentosMelhorias();
ok(me.docs.some(d => d.flags["epm-ficha"].melhoriaDef.material === "mitral") && me.docs.every(d => fs.existsSync(d.img.replace("modules/epm-ficha", "/home/claude/epm-ficha"))), "Melhorias em compêndio: com materiais e ícones que existem");
ok(C.documentosMacros().docs.length >= 8, "Macros prontas");
const A = await import("/home/claude/epm-ficha/scripts/assistente-criacao.mjs");
ok(A.conferirAtributos({ forca: 3, destreza: 3, constituicao: 3, aparencia: 1, carisma: 1, inteligencia: 3, autocontrole: 1, nucleo: 1 }).ok, "criação guiada: 16 pontos válidos");
ok(!A.conferirAtributos({ forca: 4, destreza: 3, constituicao: 3 }).ok && A.conferirAtributos({ forca: 4, carisma: -1, aparencia: -1, destreza: 3 }).ok, "criação guiada: o 4 só com dois em −1");
ok(!A.conferirPericias({ luta: 6 }).ok && A.conferirPericias({ luta: 5, pontaria: 5 }).restante === 40, "criação guiada: perícias até 5 e 50 pontos");
ok(A.periciasDoNivel(14).total === 50 + 2 * 15 && A.periciasDoNivel(14).limite === 5 && A.periciasDoNivel(15).limite === 10 && A.periciasDoNivel(35).limite === 15, "criação guiada: perícias seguem o nível (5 até o 15)");
ok(!A.conferirPericias({ luta: 6 }, 14).ok && A.conferirPericias({ luta: 10 }, 15).ok, "criação guiada: limite por perícia sobe no 15");
ok(A.aumentosDoNivel(1) === 0 && A.aumentosDoNivel(10) === 5 && A.aumentosDoNivel(50) === 26, "criação guiada: Aumentos de Status por nível");
ok(A.conferirAumentos({ forca: 5 }, { forca: 3 }, 10).ok && !A.conferirAumentos({ forca: 5 }, { forca: 4 }, 10).ok && A.conferirAumentos({ forca: 5 }, { forca: 4 }, 21).ok, "criação guiada: Aumentos respeitam o teto do nível");
ok(!A.conferirAumentos({ forca: 3, destreza: 3 }, {}, 10).ok, "criação guiada: Aumentos não passam do disponível");
{
  // 0.8.28: o jogador só vê fichas com jogador; o Mestre vê todas
  const EA = await import("/home/claude/epm-ficha/scripts/escolher-ator.mjs");
  const atores = [{ id: "pj", uuid: "Actor.pj", name: "Aurelia", type: "character", hasPlayerOwner: true },
    { id: "chefe", uuid: "Actor.chefe", name: "Rei Lich", type: "npc", hasPlayerOwner: false },
    { id: "meu", uuid: "Actor.meu", name: "Lobo do Jogador", type: "npc", hasPlayerOwner: false, isOwner: true }];
  const jogador = { isGM: false }, mestre = { isGM: true };
  globalThis.game = { actors: atores, user: jogador };
  const visJ = EA.atoresVisiveis({ usuario: jogador }).map(a => a.id);
  ok(visJ.includes("pj") && visJ.includes("meu") && !visJ.includes("chefe"), "escolher ficha: o jogador não vê o chefe do Mestre");
  ok(EA.atoresVisiveis({ usuario: mestre }).length === 3 && EA.atoresVisiveis({ usuario: mestre, excluir: ["Actor.pj"] }).length === 2, "escolher ficha: o Mestre vê todas (e dá para excluir)");
  delete globalThis.game;
}
const R = await import("/home/claude/epm-ficha/scripts/racas.mjs");
const mut = R.racaPorId("mutante");
if (mut) {
  const fera = mut.unicas.find(u => u.auto?.unicasExtras)?.id;
  const outras = mut.unicas.filter(u => u.id !== fera).map(u => u.id);
  ok(R.conferirUnicas(mut, outras.slice(0, 2)).validas.length === 1 && R.conferirUnicas(mut, outras.slice(0, 2)).passou, "Habilidade Única: só 1");
  ok(R.conferirUnicas(mut, [outras[0], fera, outras[1], outras[2]]).validas.length === 3 && R.conferirUnicas(mut, [outras[0], fera, outras[1], outras[2]]).validas[0] === fera, "Habilidade Única: Compatibilidade à Fera libera mais 2");
}
const outra = R.RACAS.find(r => !r.mestico && r.id !== "mutante" && r.unicas?.length > 1);
if (outra) ok(R.conferirUnicas(outra, outra.unicas.map(u => u.id)).validas.length === 1, "Habilidade Única: outras raças só 1");
ok(R.qtdUnicas({ mestico: true }, ["mutante:fera"]) === 4 && R.qtdUnicas({ mestico: true }, []) === 2, "Mestiço de Mutante com a Fera: +2");
const E = await import("/home/claude/epm-ficha/scripts/erros-amigaveis.mjs");
ok(/permissão/.test(E.dicaDoErro("User lacks permission to update")) && /F5/.test(E.dicaDoErro("Cannot read properties of undefined")), "erros amigáveis: dica certa para cada tipo de erro");
process.exit(falhas ? 1 : 0);
