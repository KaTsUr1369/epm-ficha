/**
 * Testes das regras puras da 0.4.0 (sem Foundry): moedas, migração, paleta de cores,
 * catálogo de bênçãos/maldições, condições e ícones.
 * Uso: node testes/regras.mjs
 */
import fs from "fs";
import {
  valorEmCobre, pagarMoedas, consolidarMoedas, formatarMoedas, migrarDados, normalizarDados,
  ordenarPorLista, moverNaLista, VERSAO_DADOS, itemAtivo, resumoEfeitoItem
} from "/home/claude/epm-ficha/scripts/data.mjs";
import { paletaDaCor, corDaRoda, posicaoNaRoda, hexParaHsl, normalizarHex } from "/home/claude/epm-ficha/scripts/cores.mjs";
import { CATALOGO, frequenciaDoTexto, duracaoDoTexto, dadosNovaEntrada, automacaoDe, entradaCatalogo } from "/home/claude/epm-ficha/scripts/bencaos.mjs";
import { CONDICOES, COMBINACOES, CORES_PRONTAS, MOEDAS, EXAUSTAO, REVELACOES, ABAS } from "/home/claude/epm-ficha/scripts/config.mjs";
import { CONDICOES_RENOMEADAS } from "/home/claude/epm-ficha/scripts/condicoes.mjs";

let falhas = 0;
function ok(cond, msg) {
  console.log(cond ? "ok  " : "FALHA", msg);
  if (!cond) falhas++;
}

// ---------- Moedas ----------
ok(MOEDAS.map(m => m.id).join() === "pc,pp,po,pl,dr", "moedas em ordem: Cobre, Prata, Ouro, Platina, Dracmas");
ok(valorEmCobre({ dr: 1 }) === 1000000 && valorEmCobre({ pl: 1 }) === 1000, "1 Dracma = 1.000 Platinas = 1.000.000 de cobre");
const troco = pagarMoedas({ dr: 1 }, 1);
ok(troco && valorEmCobre(troco) === 999999, "pagar 1 cobre com 1 Dracma devolve troco certo");
ok(pagarMoedas({ po: 1 }, 101) === null || pagarMoedas({ po: 1 }, 101) === false, "não paga sem dinheiro suficiente");
ok(JSON.stringify(consolidarMoedas({ pc: 1234 })) === JSON.stringify({ dr: 0, pl: 1, po: 2, pp: 3, pc: 4 }), "consolidar 1234 PC = 1 PL, 2 PO, 3 PP, 4 PC");
ok(formatarMoedas(2000500) === "2 DR, 5 PO", "formatar valores grandes em Dracmas");
for (const m of MOEDAS) ok(fs.existsSync(m.img.replace("modules/epm-ficha", "/home/claude/epm-ficha")), `imagem da moeda ${m.label}`);

// ---------- Migração ----------
const upd = migrarDados({ moedas: { kan: 3, dr: 1 }, exaustao: 9 });
ok(upd["moedas.dr"] === 10 && upd["moedas.-=kan"] === null, "migração soma as Joias de Kan às Dracmas (3 por Joia) e apaga o campo antigo");
ok(upd.exaustao === 6, "exaustão acima de 6 volta a 6 (sem coma)");
ok(upd.versao === VERSAO_DADOS && VERSAO_DADOS === 8, `dados marcados com a versão ${VERSAO_DADOS}`);
{
  const m5 = migrarDados({ versao: 4, ca: { base: 10, armadura: 3, bonus: 1 }, pericias: { vontade: { atributos: ["nucleo"] } } });
  ok(m5["ca.bonus"] === 4 && m5["ca.-=armadura"] === null, "0.5.4: armadura manual da CA vai para Outros");
  ok(JSON.stringify(m5["pericias.vontade.atributos"]) === '["autocontrole"]', "0.7.0: Vontade com Núcleo vira só Autocontrole, mesmo na versão 4");
}
ok(Object.keys(migrarDados({ versao: VERSAO_DADOS, moedas: { kan: 1 } })).length === 0, "ficha já migrada não muda");
const lido = normalizarDados({ moedas: { kan: 3, po: 2 }, exaustao: 9 });
ok(lido.moedas.dr === 9 && lido.moedas.po === 2 && !("kan" in lido.moedas), "ficha antiga lida antes de migrar já mostra Dracmas");
ok(lido.exaustao === 6, "exaustão lida é limitada a 6");
ok(Object.values(CONDICOES_RENOMEADAS).every(id => CONDICOES.some(c => c.id === id)), "condições renomeadas apontam para condições existentes");

const migV = migrarDados({ versao: 3, pericias: { vontade: { nome: "Vontade", atributos: ["nucleo"], sugestoes: ["nucleo"] } } });
ok(JSON.stringify(migV["pericias.vontade.atributos"]) === '["autocontrole"]' && JSON.stringify(migV["pericias.vontade.sugestoes"]) === '["autocontrole"]', "Vontade no padrão antigo passa a somar Autocontrole");
const migV2 = migrarDados({ versao: 3, pericias: { vontade: { nome: "Vontade", atributos: ["nucleo", "carisma"] } } });
ok(JSON.stringify(migV2["pericias.vontade.atributos"]) === '["autocontrole"]', "0.7.0: Vontade com Núcleo somado também vira só Autocontrole");
{
  const mr = migrarDados({ versao: 6, pericias: { acrobacia: { nome: "Acrobacia", atributos: ["destreza"] }, vontade: { nome: "Vontade", atributos: ["autocontrole"] } } });
  ok(mr["pericias.reflexos"]?.atributos?.[0] === "destreza" && mr["pericias.fortitude"] && !mr["pericias.vontade"], "0.7.1: ficha antiga ganha Reflexos e Fortitude");
  ok(normalizarDados({ pericias: { acrobacia: { nome: "Acrobacia" } } }).pericias.reflexos?.nome === "Reflexos", "Reflexos aparece mesmo antes de migrar");
}
ok(!("pericias.vontade.atributos" in migrarDados({ versao: 5, pericias: { vontade: { atributos: ["autocontrole", "carisma"] } } })), "Vontade sem Núcleo não muda");
ok(JSON.stringify(normalizarDados({}).pericias.vontade.atributos) === '["autocontrole"]', "ficha nova: Vontade soma Autocontrole");

// ---------- Ordem de abas e categorias ----------
ok(ordenarPorLista(["a", "b", "c", "d"], ["c", "a"]).join() === "c,a,b,d", "ordem salva vem primeiro, novas no fim");
ok(ordenarPorLista(["a", "b"], ["x", "b"]).join() === "b,a", "ids que sumiram são ignorados");
ok(moverNaLista(["a", "b", "c"], "c", "a").join() === "c,a,b", "mover antes de outro");
ok(moverNaLista(["a", "b", "c"], "a", null).join() === "b,c,a", "mover para o fim");
ok(ABAS.some(a => a.id === "personalizacao" && a.soEdicao), "aba Personalizar só no modo edição");

// ---------- Itens ----------
ok(itemAtivo({ type: "weapon", system: { equipped: true } }) && !itemAtivo({ type: "weapon", system: { equipped: false } }), "arma vale equipada");
ok(!itemAtivo({ type: "consumable", system: { quantity: 3 } }), "consumível não dá bônus passivo (só ao usar)");
ok(itemAtivo({ type: "loot", system: { quantity: 1 } }) && !itemAtivo({ type: "loot", system: { quantity: 0 } }), "loot vale enquanto existir");
ok(/1,5/.test(resumoEfeitoItem({ tipo: "mod", alvo: "deslocamento", valor: -1.5 })), "resumo de efeito usa vírgula decimal");

// ---------- Cores ----------
const hex = /^#[0-9A-F]{6}$/i;
for (const pronta of CORES_PRONTAS) {
  const c = pronta.cor;
  const p = paletaDaCor(c, 50);
  const valores = Object.values(p);
  ok(valores.length === 11 && valores.every(v => /^#[0-9A-F]{6}([0-9A-F]{2})?$/i.test(v)), `paleta "${c}" completa e válida`);
  ok(hexParaHsl(p["--epm-fundo"]).l < hexParaHsl(p["--epm-painel"]).l, `paleta "${c}": fundo mais escuro que o painel`);
}
const escuro = paletaDaCor("#5D9F98", 0), claro = paletaDaCor("#5D9F98", 100);
ok(hexParaHsl(escuro["--epm-painel"]).l < hexParaHsl(claro["--epm-painel"]).l, "traço de brilho clareia a ficha");
const roda = corDaRoda(0, 1);
ok(hex.test(roda) && hexParaHsl(roda).h < 1 || hexParaHsl(roda).h > 359, "topo da roda é vermelho");
const pos = posicaoNaRoda("#FF0000");
ok(Math.abs(pos.raio - 1) < 0.02, "vermelho puro fica na borda da roda");
ok(normalizarHex("abc") === "#AABBCC" || normalizarHex("abc") === "#aabbcc", "hex curto é aceito");

// ---------- Catálogo de bênçãos e maldições ----------
const ben = CATALOGO.filter(c => c.tipo === "bencao" && !c.extra), mal = CATALOGO.filter(c => c.tipo === "maldicao" && !c.extra);
ok(ben.length === 100 && mal.length === 100, "100 bênçãos e 100 maldições");
ok(new Set(CATALOGO.map(c => c.id)).size === 219, "ids únicos no catálogo (200 oficiais + 19 extras do Notion)");
ok(CATALOGO.filter(c => c.extra).length === 19 && CATALOGO.filter(c => c.extra && c.tipo === "maldicao").every(c => c.beneficio), "extras do Notion: 7 bênçãos + 12 maldições com benefício");
for (const lista of [ben, mal]) {
  const por = {};
  for (const c of lista) por[c.natureza] = (por[c.natureza] ?? 0) + 1;
  ok(por.divina === 34 && por.caotica === 33 && por.memetica === 33, `${lista[0].tipo}: 34 divinas, 33 caóticas, 33 meméticas`);
}
ok(CATALOGO.filter(c => !c.extra).every(c => c.nome && c.efeito && ["boa", "epica", "lendaria"].includes(c.raridade)), "toda entrada oficial tem nome, efeito e raridade");
ok(frequenciaDoTexto("Uma vez por combate.") === "combate", "frequência: uma vez por combate");
ok(frequenciaDoTexto("Uma vez por dia.") === "dia", "frequência: uma vez por dia");
ok(duracaoDoTexto("Dura 3 turnos.") === 3 && duracaoDoTexto("durante 2 turnos") === 2, "duração em turnos lida do texto");
let seq = 0;
const novoIdFn = () => `id${seq++}`;
const fera = dadosNovaEntrada(entradaCatalogo("b054"), { novoIdFn });
ok(fera.ativo === false && automacaoDe(fera).duracao === 3, "bênção com duração começa desligada (liga ao usar)");
ok(Object.keys(fera.mods).length === 3, "Fera Interior traz +3 em Força, Destreza e Constituição");
const mana = dadosNovaEntrada(entradaCatalogo("m037"), { novoIdFn });
ok(mana.ativo === true, "maldição entra ligada");
ok(automacaoDe(fera)?.aoTerminar?.pv === -30, "Fera Interior: perde 30 PV ao terminar");
ok(automacaoDe(mana)?.efeitos?.custoExtraMagia === 5, "Mana Corrompida: magias custam +5 PM");
ok(automacaoDe(dadosNovaEntrada(entradaCatalogo("m083")))?.efeitos?.metadeDinheiro === true, "Imposto da Pobreza: metade do dinheiro some");

// ---------- Condições ----------
ok(CONDICOES.filter(c => !c.extra).length === 136 && CONDICOES.filter(c => c.extra).length === 20, "136 condições oficiais (131 + Flutuando, Assustado, Bêbado, Lesionado e Recuperado) + 20 do Notion");
ok(new Set(CONDICOES.map(c => c.id)).size === 156, "ids de condição únicos");
ok(CONDICOES.filter(c => c.categoria === "basicas").length === 46, "46 condições básicas (com Bêbado, Lesionado e Recuperado)");
const faltandoIcone = CONDICOES.filter(c => !fs.existsSync(`/home/claude/epm-ficha/assets/condicoes/${c.iconeSlug ?? c.slug}.svg`));
ok(!faltandoIcone.length, "toda condição tem ícone" + (faltandoIcone.length ? `: faltam ${faltandoIcone.map(c => c.slug)}` : ""));
const svgs = fs.readdirSync("/home/claude/epm-ficha/assets/condicoes").filter(f => f.endsWith(".svg"));
ok(svgs.length === 133, "nenhum ícone sobrando na pasta");
const creditos = fs.readFileSync("/home/claude/epm-ficha/assets/condicoes/CREDITOS.md", "utf8");
ok(CONDICOES.every(c => creditos.includes(`| ${c.iconeSlug ?? c.slug}.svg |`)), "todo ícone tem crédito em CREDITOS.md");
const ids = new Set(CONDICOES.map(c => c.id));
ok(COMBINACOES.length === 26, "26 combinações");
ok(COMBINACOES.every(k => k.condicoes.every(id => ids.has(id)) && (k.aplicar ?? []).every(id => ids.has(id)) && (k.remover ?? []).every(id => ids.has(id))),
  "combinações só usam condições existentes");
const implicadas = CONDICOES.flatMap(c => c.efeitos?.implica ?? []);
ok(implicadas.every(id => ids.has(id)), "condições automáticas (implica) existem");
ok(EXAUSTAO.length === 6 && EXAUSTAO[5].label?.includes("Morte") || EXAUSTAO.at(-1).nome?.includes("Morte"), "exaustão vai até 6 (Morte)");
ok(REVELACOES.find(r => r.id === "historia")?.padrao === 5 || REVELACOES.find(r => r.id === "historia")?.nivel === 5, "História do background abre na afinidade 5 por padrão");

// 0.5.4: arquétipos modelo
{
  const A = await import("/home/claude/epm-ficha/scripts/arquetipos.mjs");
  ok(A.idArquetipo("Artificie") === "artifice" && A.idArquetipo("Combatente") === "combatente" && A.idArquetipo("Bardo") === null, "reconhece os arquétipos pelo nome (até \"Artificie\")");
  ok(A.nivelArquetipo({ arquetipo: "Arcanista", arquetipo2: "Conjurador", nivel: 5, nivel2: 19 }, "conjurador") === 19, "nível do segundo arquétipo");
  const ef = A.efeitoMaestria("certeiro", 11);
  ok(ef.etapa === 2 && ef.custo === 3 && ef.acerto === 2, "Ataque Certeiro na etapa 2: 3 PE por +2 (balanceado)");
  const per = A.efeitoMaestria("perigosa", 41), per11 = A.efeitoMaestria("perigosa", 11), per21 = A.efeitoMaestria("perigosa", 21);
  ok(per.margem === 3 && per.mult === 4 && per11.margem === 1 && per11.mult === 3 && per21.margem === 2 && A.efeitoMaestria("perigosa", 1).mult === 0, "Arma Perigosa nova: crítico 19/18/17 (1/21/41) e ×3/×4 (11/31)");
  ok(A.reservaArcana(26) === 10 && A.reservaArcana(41) === 25 && A.reservaArcana(49) === 40 && A.reservaArcana(25) === 0, "Reserva Arcana: +10 no 26, +25 no 41, +40 no 49");
  ok(A.custoMagiaCirculo(3) === 14 && A.circuloLiberado(1, 1) && A.circuloLiberado(3, 18) === false && A.circuloLiberado(3, 19) && !A.circuloLiberado(6, 44) && A.circuloLiberado(6, 45), "círculos novos: 1º no Nv. 1, 3º no 19, 6º no 45");
  const ac1 = A.acumuloDeMagias(1), ac10 = A.acumuloDeMagias(10), ac50 = A.acumuloDeMagias(50);
  ok(ac1.magias === 3 && ac1.truques === 3 && ac10.magias === 12 && ac10.truques === 4 && ac50.magias === 52 && ac50.truques === 8, "Acúmulo de Magias: 3/3 no Nv. 1, 12/4 no 10, 52/8 no 50");
  ok(A.contaNoAcumulo({ origem: "" }) && A.contaNoAcumulo({ origem: "arquetipo" }) && !A.contaNoAcumulo({ origem: "classe" }) && !A.contaNoAcumulo({ origem: "pergaminho" }), "Classe e pergaminho somam por fora do Acúmulo");
  ok(A.assinaturaDe(14) === null && A.assinaturaDe(15).qtd === 1 && A.assinaturaDe(39).circuloMax === 4 && A.corpoDeManaDe(22).pm === 6 && A.corpoDeManaDe(46).pm === 0 && A.zonaDeManaDe(41).manterPm === 20 && A.zonaDeManaDe(50).pm === 30, "Magia Assinatura, Corpo de Mana (22/46) e Zona de Mana (41/50)");
  const c1 = A.criacaoDe(1, 5), c11 = A.criacaoDe(11, 5), c50 = A.criacaoDe(50, 5), c0 = A.criacaoDe(1, 0);
  ok(c1.projetos === 3 && c1.grauMax === 1 && c1.livro === 4 && c11.projetos === 5 && c11.grauMax === 2 && c50.projetos === 13 && c50.livro === 14 && c0.projetos === 1, "Projetos de Criação: metade da Int (mín. 1) no 1, Int no 11, Int + 8 no 50");
  const g1 = A.valoresDoGrau(1, 3), g5 = A.valoresDoGrau(5, 3), g6 = A.valoresDoGrau(6, 3);
  ok(g1.dano === "2d6 + 3" && g1.cenas === 2 && g1.ocupa === 1 && g5.cura === "6d12 + 3" && g5.ocupa === 3 && g6.dano === "10d10 + 3" && g6.soma === 12, "Graus I–V (e acima do V pela Sobrecarga: +2 dados, +2)");
  const mods = A.modsDeArquetipo({ arquetipo: "Conjurador", nivel: 26, arquetipo2: "Artífice", nivel2: 11, arquetipoOpcoes: { artifice: { utensilios: ["medicina"], modificacao: { parte: "pernas", opcao: 0 } } } });
  ok(mods.some(m => m.alvo === "recurso.pm" && m.valor === 10), "Reserva Arcana entra como PM máximo");
  ok(!mods.some(m => m.alvo === "pericia.medicina") && mods.some(m => m.alvo === "pericia.atletismo" && m.valor === 2), "Utensílios não é mais bônus fixo; Modificação Permanente (Pernas: Atletismo +2)");
  const { visualDaFicha } = await import("/home/claude/epm-ficha/scripts/context.mjs");
  const v = visualDaFicha({ moldura: "dourada", fonte: "antiga", escala: 112, fundo: "worlds/x/fundo.webp", fundoVeu: 60 });
  ok(v.escala === 110 && v.classes.includes("epm-moldura-dourada") && v.classes.includes("epm-com-fundo") && v.vars["--epm-fundo-veu"] === "60%", "visual: escala em passos de 5, moldura, fundo e véu");
}
{
  const A = await import("/home/claude/epm-ficha/scripts/arquetipos.mjs");
  const dadosT = { arquetipo: "Combatente", nivel: 11, arquetipoOpcoes: { combatente: { tipoFavorito: "espada longa", maestrias: ["protetora", "certeiro"] } } };
  ok(A.eTipoFavorito({ flags: { "epm-ficha": { tipoArma: "Espada Longa" } } }, dadosT) && !A.eTipoFavorito({ flags: { "epm-ficha": { tipoArma: "Machado" } } }, dadosT), "Arma Favorita vale pelo tipo da arma (sem maiúsculas)");
  const ca = A.modsDeArquetipo(dadosT, [{ id: "x", tipoArma: "Espada longa" }]).find(m => m.alvo === "ca");
  const def11 = A.modsDeArquetipo(dadosT, [{ id: "x", tipoArma: "Espada longa" }]).find(m => m.alvo === "defesa.bloqueio");
  ok(ca?.valor === 1 && def11?.valor === 1, "Arma Protetora: +1 CA e +1 Defesa com uma espada longa equipada no nível 11");
  ok(!A.modsDeArquetipo(dadosT, [{ id: "y", tipoArma: "Machado" }]).some(m => m.alvo === "ca"), "Arma Protetora não vale para outro tipo");
  ok(A.maestriasEscolhidas(dadosT).join() === "protetora" && A.maestriasEscolhidas({ ...dadosT, nivel: 21 }).join() === "protetora,certeiro" && A.maestriasPermitidas(41) === 3, "Arsenal: 1 Maestria até o 20, 2 no 21, 3 no 41");
  const esm = A.efeitoMaestria("esmagador", 41), sang = A.efeitoMaestria("sangrenta", 21), sen = A.efeitoMaestria("sentinela", 41);
  ok(esm.custo === 7 && /Atordoado/.test(esm.efeito) && sang.custo === 5 && sang.dadosSangue === "1d8" && sen.oportunidades === 2 && sen.acertoOportunidade === 2, "Maestrias novas: Golpe Esmagador, Arma Sangrenta e Sentinela");
  ok(A.cdMaestria({ periciaPorId: { luta: { total: 7 }, pontaria: { total: 3 } } }) === 17 && A.cdMaestria({ periciaPorId: { pontaria: { total: 3 } } }, true) === 13, "CD de Maestria = 10 + Luta ou Pontaria");
  const cac = A.cacadorDe(19), cac47 = A.cacadorDe(47);
  ok(cac.acerto === 5 && cac.transferir === 2 && cac.esquiva === 2 && !cac.imunidadeVira && cac47.imunidadeVira, "Caçador Natural: +5 Acerto, +2 nas reações, troca por 2 PE; 2.0 no 47");
  ok(A.folegoDe(10).dado === "2d6" && A.ARQUETIPOS.combatente.folegoRecurso === "pv", "Fôlego de Combate recupera PV");
  const M = await import("/home/claude/epm-ficha/scripts/migracoes-mundo.mjs");
  const t = M.trocasArquetipos0827({ arquetipoOpcoes: { combatente: { maestria: "destrutivo" } }, ajustesBonus: { "arq-maestria-custo": 2, "arq-estilo-duelista-acertoisolado": 2, "artifice-projetos-dano": "3d8" }, projetos: { a: {} } });
  ok(t["flags.epm-ficha.arquetipoOpcoes.combatente.maestrias"]?.join() === "destrutivo" && t["flags.epm-ficha.ajustesBonus.arq-maestria-destrutivo-custo"] === 2 && "flags.epm-ficha.ajustesBonus.-=arq-estilo-duelista-acertoisolado" in t && "flags.epm-ficha.ajustesBonus.-=artifice-projetos-dano" in t && "flags.epm-ficha.-=projetos" in t, "migração: Maestria vira Arsenal, ajustes por Maestria, estilo antigo volta ao livro, projetos antigos saem");
}
{
  const R = await import("/home/claude/epm-ficha/scripts/receitas-artifice.mjs");
  ok(R.RECEITAS_ARTIFICE.filter(r => r.categoria === "consumivel").length === 12 && R.RECEITAS_ARTIFICE.filter(r => r.categoria === "engenhoca").length === 8 && R.RECEITAS_ARTIFICE.every(r => r.valores.length === 5), "receitas do PDF: 12 Consumíveis e 8 Engenhocas, com valores por Grau");
  ok(R.grauMinimo(R.receitaPorId("gerador-campo")) === 3 && R.grauMinimo(R.receitaPorId("drone-batedor")) === 2 && R.grauMinimo(R.receitaPorId("carga-explosiva")) === 1, "Grau mínimo: Gerador de Campo III, Drone II");
}
{
  const { calcularFicha, normalizarDados, danoRecebido, tipoCobre } = await import("/home/claude/epm-ficha/scripts/data.mjs");
  const dados = normalizarDados({ rd: { a: { tipo: "Fogo", valor: 3 }, b: { tipo: "", valor: 2 }, c: { tipo: "Gelo", valor: 0 } }, resistencias: ["Fogo"], imunidades: ["Veneno"] });
  const f = calcularFicha({ dados });
  ok(f.tags.reducoes.length === 2, "RD da ficha: entram só as com valor");
  ok(danoRecebido(f, 20, "Fogo").final === 5, "Fogo 20: resistência → 10, depois RD 3 + 2 → 5");
  ok(danoRecebido(f, 10, "Corte").final === 8, "Corte 10: só a RD geral (2) → 8");
  ok(danoRecebido(f, 10, "Veneno").final === 0, "imune a Veneno → 0");
  ok(danoRecebido(f, 1, "Corte").final === 0, "RD não deixa o dano negativo");
  const fv = calcularFicha({ dados: normalizarDados({ vulnerabilidades: ["Corrupção", "Fogo"], resistencias: ["Fogo"], rd: { a: { tipo: "", valor: 1 } } }) });
  ok(danoRecebido(fv, 10, "corrupcao").final === 19, "Corrupção vulnerável: 10 ×2 = 20, RD 1 → 19");
  ok(danoRecebido(fv, 10, "Fogo").final === 9, "vulnerável e resistente: uma anula a outra (10 − RD 1 = 9)");
  const { SUGESTOES } = await import("/home/claude/epm-ficha/scripts/config.mjs");
  ok(SUGESTOES.dano.includes("Corrupção"), "tipo de dano Corrupção nas sugestões");
  ok(tipoCobre("Fogo, Gelo", "gelo") && !tipoCobre("Fogo", "Gelo") && tipoCobre("todos os danos", ""), "tipo da RD: lista e 'todos os danos'");
}
{
  const { calcularFicha, normalizarDados, danoRecebido, tipoCobre, rotuloTipoDano } = await import("/home/claude/epm-ficha/scripts/data.mjs");
  const { TIPOS_DANO } = await import("/home/claude/epm-ficha/scripts/config.mjs");
  ok(TIPOS_DANO.filter(t => !t.extra).length === 26, "26 tipos de dano nas 4 naturezas (com Espiritual, Temporal e Corrupção)");
  ok(TIPOS_DANO.filter(t => t.extra).length === 1, "só Queda fica como não oficial");
  ok(tipoCobre("Físico não mágico", "Cortante") && !tipoCobre("Físico não mágico", "Cortante (Mágico)"), "'físico não mágico' = Físicos (Natural)");
  ok(tipoCobre("Relâmpago", "Raio") && tipoCobre("Obscuro", "Sombra") && tipoCobre("Venoso", "Veneno") && tipoCobre("Contusão", "Contundente"), "nomes antigos das raças");
  ok(tipoCobre("Corte", "Cortante") && tipoCobre("Elementais", "Gelo") && tipoCobre("Trevas", "Sombra"), "nomes antigos e grupos valem");
  ok(!tipoCobre("Fogo", "Fogo (Verdadeiro)") && tipoCobre("Fogo (Límbico)", "Fogo (Verdadeiro)"), "nível: resistência Natural não segura Verdadeiro; Límbico segura");
  const f = calcularFicha({ dados: normalizarDados({ resistencias: ["Fogo"], rd: { a: { tipo: "Todos os danos (Mágico)", valor: 2 } }, vulnerabilidades: ["Raio"] }) });
  ok(danoRecebido(f, 20, "Fogo").final === 8, "Fogo Natural 20: metade 10, RD 2 → 8");
  ok(danoRecebido(f, 20, "Fogo (Mágico)").final === 18, "Fogo Mágico 20: passa a resistência Natural, RD Mágica 2 → 18");
  ok(danoRecebido(f, 20, "Fogo (Verdadeiro)").final === 20, "Fogo Verdadeiro: passa tudo");
  ok(danoRecebido(f, 10, "Raio (Arcaico)").final === 20, "vulnerabilidade vale em qualquer nível");
  ok(rotuloTipoDano("fogo (magico)") === "Fogo (Mágico)", "rótulo do tipo com nível");
  const g = calcularFicha({ dados: normalizarDados({ resistencias: ["Fogo (Verdadeiro)", "Corrupção"], vulnerabilidades: ["Gelo ×3", "Fogo"] }) });
  ok(danoRecebido(g, 20, "Fogo").final === 10, "escada: Fogo Natural x resistência Verdadeiro + vulnerável → anulado vira metade");
  ok(danoRecebido(calcularFicha({ dados: normalizarDados({ resistencias: ["Fogo (Verdadeiro)"] }) }), 20, "Fogo (Mágico)").final === 0, "escada: nível abaixo da resistência é anulado");
  ok(danoRecebido(calcularFicha({ dados: normalizarDados({ resistencias: ["Fogo (Verdadeiro)"] }) }), 20, "Fogo (Verdadeiro)").final === 10, "escada: mesmo nível, metade");
  ok(danoRecebido(calcularFicha({ dados: normalizarDados({ resistencias: ["Fogo (Verdadeiro)"] }) }), 20, "Fogo (Límbico)").final === 20, "escada: nível acima passa");
  ok(danoRecebido(g, 10, "Gelo (Arcaico)").final === 30, "vulnerabilidade ×3");
  ok(danoRecebido(g, 20, "Corrupção (Arcaico)").final === 10, "Corrupção: resistência sempre metade");
  ok(rotuloTipoDano("Gelo x3") === "Frio ×3", "rótulo com ×3 (Gelo vira Frio)");
  ok(tipoCobre("Corrupção", "Corrupção (Arcaico)") && tipoCobre("Corrupção", "Corrupção"), "Corrupção não tem níveis");
  const { SUGESTOES } = await import("/home/claude/epm-ficha/scripts/config.mjs");
  ok(SUGESTOES.dano.length === 30 && SUGESTOES.danoExtra.length === 1, "sugestões: 26 tipos + 4 naturezas; Queda à parte");
  {
    const D = await import("/home/claude/epm-ficha/scripts/data.mjs");
    const l = D.lerTipoDano("dano natural (Verdadeiro)");
    ok(l.grupos.has("naturais") && l.nivelLabel === "Verdadeiro", "natureza inteira com nível");
    const r = D.calcularFicha({ dados: D.normalizarDados({ resistencias: ["Dano natural"] }) });
    ok(D.danoRecebido(r, 20, "Relâmpago").final === 10 && D.danoRecebido(r, 20, "Cortante").final === 20, "resistência a dano natural vale para Relâmpago e não para Cortante");
    ok(D.danoRecebido(r, 20, "Elétrico").final === 10, "nome antigo Elétrico = Relâmpago");
    const M = await import("/home/claude/epm-ficha/scripts/migracoes-mundo.mjs");
    const { TIPOS_DANO_ANTIGOS } = await import("/home/claude/epm-ficha/scripts/config.mjs");
    const u = M.trocasTiposDano({ tipoDano: "Gélido", resistencias: ["Trovejante"] }, TIPOS_DANO_ANTIGOS);
    ok(u["flags.epm-ficha.tipoDano"] === "Frio" && u["flags.epm-ficha.resistencias"][0] === "Sonoro", "migração renomeia tipos antigos");
    // Teto de Bônus
    ok(D.tetoDeBonus(1) === 5 && D.tetoDeBonus(11) === 8 && D.tetoDeBonus(31) === 12 && D.tetoDeBonus(60) === 15, "faixas do teto");
    const dados = D.normalizarDados({ nivel: 3, arquetipo: "Combatente", bonusCena: { a: { ativo: true, nome: "Bênção do guerreiro", testes: 4 }, b: { ativo: true, nome: "Grito", testes: 3 }, c: { ativo: true, nome: "Poção", testes: 2, origemTipo: "item" } } });
    const f = D.calcularFicha({ dados });
    const per = f.periciaPorId.luta;
    const semTeto = D.calcularFicha({ dados, opcoes: { tetoBonus: false } }).periciaPorId.luta;
    ok(per.testeTotal === semTeto.testeTotal - 2 && per.testeFontes.some(x => /Teto de Bônus \+5/.test(x.fonte)), `teto +5 corta 2 de 7 de habilidade e deixa o item (${per.testeTotal} vs ${semTeto.testeTotal})`);
    ok(D.corteTetoAtaque(f, "luta", { extraPos: 6 }) === -1, "ataque: +6 de habilidade na rolagem passa 1 do teto");
    const A = await import("/home/claude/epm-ficha/scripts/arquetipos.mjs");
    const f50 = D.calcularFicha({ dados: D.normalizarDados({ nivel: 50, arquetipo: "Conjurador" }) });
    ok(f50.pontosAtributo.aumentoDisponivel === 26, `AS: 1 por nível par e 2 no 50 (${f50.pontosAtributo.aumentoDisponivel})`);
    ok(A.ARQUETIPOS.combatente.estilos.duelista.acertoIsolado === 8 && A.ARQUETIPOS.combatente.estilos.dupla.acerto === 2 && A.ARQUETIPOS.combatente.estilos.atirador.margem === 4 && A.ARQUETIPOS.combatente.estilos.atirador.margemSempre === 1, "estilos reformulados: Duelista +8, Arma Dupla +2, Atirador +1 (ou +4)");
    const I = await import("/home/claude/epm-ficha/scripts/inimigos-nivel.mjs");
    const i1 = I.inimigoPorNivel(1, "chefe"), i12 = I.inimigoPorNivel(12, "monstro"), il = I.inimigoPorNivel(50, "lacaio");
    ok(i1.ca === 20 && i1.pv === 227 && i1.dano === 26 && i1.ataques.length === 4 && i1.ataques.filter(a => a.lendaria).length === 2 && i1.area?.alvos === 3, "inimigo (0.9.0): Chefe nível 1 = CA 20, 227 PV, 26 de dano em 4 ataques (2 Lendárias) e área");
    ok(i12.ca === 24 && i12.pv === 174 && i12.ataques.length === 2 && !i12.area, `inimigo: Monstro nível 12 direto da tabela, 2 ataques (${i12.ca}/${i12.pv})`);
    ok(il.ca === 40 && il.pv === 277 && il.acerto === 36 && il.dano === 182 && il.ataques.length === 1, "lacaio usa CA/acerto do Monstro e a própria Vida e dano");
    ok(I.formulaD8(25) === "2d8 + 16" && I.dividirDano(50, 2).join() === "25,25" && I.dividirDano(31, 3).join() === "11,10,10", "dano em d8 (25 → 2d8 + 16) e divisão por ataques");
    const r6 = I.inimigoPorNivel(6, "monstro", { raridade: "epico" }), p40 = I.inimigoPorNivel(40, "forte", { poder: "equipado" }), p10 = I.inimigoPorNivel(10, "forte", { poder: "equipado" });
    ok(r6.ca === 23 && r6.acerto === 16 && r6.cd === 22 && r6.pv === Math.round(99 * 1.6) && r6.dano === 80 && r6.custo === 2, "raridade Épica: +2 CA/acerto/CD, ×1,6 PV e dano, custo ×2");
    ok(p40.pv === Math.round(1506 * 1.1) && p10.pv === Math.round(283 * 1.2) && p40.ca === 41, "poder Equipado: ×1,2 até o 30 e ×1,1 depois; não mexe na CA");
    ok(I.inimigoPorNivel(2, "lacaio", { raridade: "raro" }).dano === 8.2 && I.inimigoPorNivel(60, "monstro").projecao && !I.inimigoPorNivel(50, "monstro").projecao && I.inimigoPorNivel(500, "monstro").nivel === 100, "lacaio com 1 casa; 51+ é projeção; nível vai até 100");
    const o = I.orcamentoEncontro([I.custoInimigo("chefe"), I.custoInimigo("lacaio", "raro")], 4);
    ok(o.custo === 4.38 && o.etiqueta === "Justo" && I.orcamentoEncontro([1, 1], 4).etiqueta === "Fácil" && I.orcamentoEncontro([4, 2], 4).etiqueta === "Difícil", "orçamento: 60% fácil, 120% justo, acima difícil");
    ok(I.custoDoNpc({ tipo: "chefe", raridade: "lendario" }) === 12 && I.custoDoNpc({ tipo: "comum" }) === 0.25 && I.custoDoNpc({ custo: 3, tipo: "chefe" }) === 3, "custo do NPC pelo tipo e raridade, ou o editado pelo Mestre");
  }
}
{
  const D = await import("/home/claude/epm-ficha/scripts/data.mjs");
  const b = D.normalizarBonusSituacional({ gatilho: "dano", escolha: "rolar", opcoes: { a: { tipo: "rd", valor: 10, criado: 1 }, b: { tipo: "ca", valor: 3, criado: 2 }, c: { tipo: "dano", valor: "10", criado: 3 }, d: { tipo: "acerto", valor: 3, criado: 4 }, x: { tipo: "nada" } } });
  ok(b.opcoes.length === 4 && b.gatilho === "dano" && b.escolha === "rolar", "bônus situacional: 4 opções, gatilho ao sofrer dano, rola o dado");
  ok(b.opcoes.map(o => o.texto).join(" | ") === "+10 de RD | +3 de CA | +10 de dano | +3 no teste de ataque", "textos das opções do Sentido de sobrevivência");
  const dados = D.normalizarDados({ bonusCena: { s: { nome: "Sentido", ativo: true, ca: 3, rd: 10, cena: true }, o: { nome: "Desligado", ativo: false, ca: 5 } } });
  const f0 = D.calcularFicha({ dados: D.normalizarDados({}) }), f1 = D.calcularFicha({ dados });
  ok(f1.ca.total - f0.ca.total === 3, "bônus de cena ligado soma na CA (o desligado não)");
  ok(D.danoRecebido(f1, 25, "Cortante").final === 15, "bônus de cena com +10 de RD reduz o dano");
}
{
  const PR = await import("/home/claude/epm-ficha/scripts/producao.mjs");
  const r = PR.lerReceita("r1", { nome: "Espada", profissoes: ["forja", "encantamento"], dificuldade: "media", ingredientes: { a: { nome: "Lingote de ferro", qtd: 3 } } });
  ok(r.cd === 25 && r.horas === 8, "receita Forja + Encantamento: CD 25 (média) e 8 h");
  const ing = PR.conferirIngredientes(r, [{ name: "lingote de ferro", type: "loot", system: { quantity: 2 } }, { name: "Lingote de Ferro", type: "loot", system: { quantity: 1 } }]);
  ok(ing.ok && ing.lista[0].tem === 3, "ingredientes somados por nome (sem caixa)");
  ok(!PR.conferirIngredientes(r, []).ok, "falta ingrediente");
  ok(PR.avaliarTestes([{ total: 26, cd: 25, natural: 12 }, { total: 30, cd: 25, natural: 15 }]).sucesso, "todos os testes passam: sucesso");
  ok(!PR.avaliarTestes([{ total: 26, cd: 25, natural: 12 }, { total: 20, cd: 25, natural: 5 }]).sucesso, "um teste falha: produção perdida");
  ok(PR.avaliarTestes([{ total: 40, cd: 25, natural: 1 }]).critica, "1 natural: falha crítica");
  const ficha = { pericias: [{ id: "oficio", nome: "Ofício", bonusProprio: 2 }, { id: "arcanismo", nome: "Arcanismo", bonusProprio: 5 }], atributos: { forca: { total: 4 }, nucleo: { total: 3 } } };
  const pf = PR.periciaDaProfissao(ficha, "forja"), pe = PR.periciaDaProfissao(ficha, "encantamento");
  ok(pf.reserva && pf.periciaNome === "Ofício" && pf.bonus === 6, "Forja sem Ferraria na ficha usa Ofício + Força");
  ok(!pe.reserva && pe.bonus === 8, "Encantamento: Arcanismo + Núcleo");
  const e = PR.estadoProducao({ inicio: 0, fim: 100, estado: "andamento" }, 50);
  ok(e.fase === "andamento" && e.pct === 50 && PR.estadoProducao({ inicio: 0, fim: 100, estado: "andamento" }, 100).fase === "pronta", "produção: andamento e pronta");
  ok(PR.etapaAtual(["forja", "alquimia"], 75).profLabel === "Alquimia", "etapa atual segue o tempo");
}
{
  const C = await import("/home/claude/epm-ficha/scripts/context.mjs");
  const lanca = { id: "lanca", name: "Lança", img: "", type: "weapon", system: { equipped: true }, flags: { "epm-ficha": {
    dano: "1d6 + @atr.forca", tipoDano: "Perfurante", periciaAtaque: "luta", bonusAcerto: 1, modoNome: "Ponta",
    modos: { m1: { nome: "Cabo", dano: "1d4", tipoDano: "Contundente", pericia: "", bonusAcerto: "", criado: 1 } } } } };
  const todos = C.ataquesDaArma(lanca);
  ok(todos.length === 2 && todos[0].nome === "Lança · Ponta" && todos[1].nome === "Lança · Cabo", "lança: dois ataques (ponta e cabo)");
  ok(todos[1].dano === "1d4" && todos[1].tipoDano === "Contundente" && todos[1].periciaId === "luta" && todos[1].bonusAcerto === 1 && todos[1].ref === "lanca:m1", "modo herda perícia e acerto da arma quando vazios");
  ok(C.ataqueDeArma(lanca, "m1").tipoDano === "Contundente" && C.ataqueDeArma(lanca).tipoDano === "Perfurante", "ataque escolhe o modo pelo id");
  const espada = { id: "e", name: "Espada", type: "weapon", system: {}, flags: { "epm-ficha": { dano: "1d8", tipoDano: "Cortante" } } };
  ok(C.ataquesDaArma(espada).length === 1 && C.ataqueDeArma(espada).nome === "Espada", "arma sem modos fica igual");
}
{
  const { municaoDaArma } = await import("/home/claude/epm-ficha/scripts/data.mjs");
  ok(!municaoDaArma({}).usa, "arma sem munição");
  ok(municaoDaArma({ municao: "x" }).tipo === "unitario" && municaoDaArma({ pente: { max: 12, atual: 5 } }).pente.max === 12, "armas antigas: munição ligada = unitário, pente > 0 = pente");
  ok(!municaoDaArma({ usaMunicao: false, municao: "x", pente: { max: 6 } }).usa, "checkbox desmarcada: não gasta nada");
  const pe = municaoDaArma({ usaMunicao: true, municaoTipo: "pente" });
  ok(pe.pente.max === 6 && pe.pente.atual === 0, "pente novo começa com 6 de tamanho e vazio");
  ok(municaoDaArma({ usaMunicao: true, municaoTipo: "unitario", pente: { max: 8 } }).pente === null, "unitário ignora o pente");
}

// ---------- 0.6.0 ----------
{
  const R = await import("/home/claude/epm-ficha/scripts/regras-extras.mjs");
  const Mu = await import("/home/claude/epm-ficha/scripts/mundo.mjs");
  const Ra = await import("/home/claude/epm-ficha/scripts/racas.mjs");
  const I = await import("/home/claude/epm-ficha/scripts/insanidades.mjs");
  const { municaoDaArma, calcularFicha, normalizarDados } = await import("/home/claude/epm-ficha/scripts/data.mjs");
  const { criarAurelia } = await import("/home/claude/dev/amostra.mjs");
  const F = "epm-ficha";
  ok(municaoDaArma({ usaMunicao: true, municaoTipo: "pacote" }).tipo === "pacote", "munição em pacote");
  ok(R.faixaIdade("24 anos", "humano")?.id === "jovem" && R.faixaIdade("") === null && R.faixaIdade("1.200 anos", "elfo")?.id !== "crianca", "idade lida do texto (1.200 = 1200)");
  const enc = Mu.calcularEncontro([{ nd: 3, qtd: 2 }], [5, 2]);
  ok(enc.ndTotal === 6 && enc.pev[0] === 30 && enc.pev[1] === 34, "calculadora: 5 × ND, +2 por nível de diferença");
  const npc = Mu.gerarNpc({ raca: "anao", arquetipo: "combatente", nivel: 10, patente: "capitao", regiao: "umbra" });
  ok(npc.recursos.pv > 20 && npc.ca >= 10 && npc.ataque.nome, "ficha rápida de NPC gera Vida, CA e ataque");
  ok(Ra.RACAS.every(r => (r.aumento?.escolhas ?? []).every(e => (e.grupos ?? []).every(g => ["fisicos", "sociais", "mentais", "mistico"].includes(g)))), "grupos de atributo das raças existem");
  ok(I.insanidadeTemporaria(41) === null && I.insanidadeTemporaria(39)?.condicoes.includes("epm-lento"), "insanidade 41 refaz; 39 deixa Lento");
  ok(R.grauNucleo(6).id === "intenso" && R.grauNucleo(3).id === "moderado" && R.grauNucleo(1).id === "fraco", "grau do Núcleo");
  const aur = criarAurelia().ator.flags[F];
  aur.corrupcao = 30; aur.tamanho = "grande";
  const fx = calcularFicha({ dados: normalizarDados(aur), hp: { value: 10, max: 20 }, statuses: new Set() });
  ok(fx.condicoesAtivas.some(c => c.id === "epm-mana-instavel"), "corrupção 25+ dá Mana Instável");
  const ag = normalizarDados({ ...aur, sobre: { ...aur.sobre, idade: "900" }, raca: "Humano", faixaIdade: "adulto" });
  const fi = calcularFicha({ dados: ag, hp: { value: 10, max: 20 }, statuses: new Set(), opcoes: { idade: true } });
  ok(fi.extras.idade?.id === "adulto", "fase de vida escolhida à mão vence a idade em anos");
  ok(fx.extras.tamanho?.ca === -1, "tamanho Grande: CA −1");
  aur.corrupcao = 30; aur.corrupcaoMax = 200;
  const fc = calcularFicha({ dados: normalizarDados(aur), hp: { value: 10, max: 20 }, statuses: new Set() });
  const RX = await import("/home/claude/epm-ficha/scripts/regras-extras.mjs");
  const tr = RX.bonusAtributosAltos({ forca: 7, constituicao: 5 }, { forca: "constituicao", constituicao: "forca" });
  ok(tr.rd === 2 && tr.danoArmado === 2, "troca Força ⇄ Constituição: Força 7 dá RD 2, Constituição 5 dá +2 de dano");
  const FX = await import("/home/claude/epm-ficha/scripts/ficha-extras.mjs");
  const semAprov = FX.trocasBonus({ votos: { v: { nome: "x" } }, trocasBonus: { t: { a: "forca", b: "constituicao", voto: "v" } } });
  ok(!Object.keys(semAprov.mapa).length, "troca sem voto aprovado não vale");
  ok(fc.extras.corrupcao.max === 200 && fc.extras.corrupcao.marcos[0].limite === 50 && !fc.condicoesAtivas.some(c => c.id === "epm-mana-instavel"), "máximo de corrupção 200: Mana Instável só em 50");
}
{
  // Classes prontas: só as do arquétipo, habilidades por nível e por caminho
  const RC = await import("/home/claude/epm-ficha/scripts/regras-extras.mjs");
  const FC = await import("/home/claude/epm-ficha/scripts/ficha-extras.mjs");
  const doArq = id => RC.classesDoArquetipo(id).map(c => c.id).join();
  ok(doArq("combatente") === "guerreiro,lutador,barbaro,guardiao,arqueiro,guerreiroElemental,alice,bastiao,guerreiroVazio" && doArq("conjurador") === "mago,clerigo,invocador,xama,magoGuerra,trovador,vitalista,atiradorArcano" && doArq("artifice") === "alquimista,armaduraViva,cacador,curandeiro,masterPuppets,mecanicoGuerra",
    `classes por arquétipo (${doArq("combatente")} | ${doArq("conjurador")} | ${doArq("artifice")})`);
  {
    const AA = await import("/home/claude/epm-ficha/scripts/atirador-arcano.mjs");
    ok(FC.idClasse("Atirador Arcano") === "atiradorArcano" && FC.atiradorDaFicha({ classe: "Atirador Arcano", arquetipo: "Conjurador", nivel: 20 })?.nivel === 20 && !FC.atiradorDaFicha({ classe: "Atirador Arcano", arquetipo: "Conjurador", nivel: 2 }) && !FC.atiradorDaFicha({ classe: "Atirador Arcano", arquetipo: "Artífice", nivel: 20 }), "Atirador Arcano: classe de Conjurador (o nível é o de Conjurador)");
    ok(AA.usosStarlight(4, 15) === 3 && AA.usosStarlight(5, 9) === 3, "Starlight Step: Núcleo ÷ 2 para cima + nível ÷ 10 (exemplo do livro: Nv. 15, Núcleo 4 → 3)");
    ok(AA.formulaCriacao("especial", 20) === "9d20 + 50" && AA.formulaCriacao("especial", 48) === "3d20" && AA.formulaCriacao("media", 48) === "1d20" && AA.formulaCriacao("pequena", 18, { circuitos: 2 }) === "1d20 + 10", "custo de criação: porte, Maestria (−2 categorias, mínimo Pequena) e +5 PM por circuito");
    ok(AA.formulaCriacao("pequena", 48, { melhorias: ["modificacoes", "encantamentos", "maldicao", "bencao"] }) === "1d20 + 64", "Maestria Arcana: as 4 melhorias somam 64 PM");
    const s1 = AA.custoSangue(23, 40), s2 = AA.custoSangue(41, 40);
    ok(s1.pv === 12 && !s1.atordoa && s2.pv === 21 && s2.atordoa, "Arma de Sangue: metade do custo em PV (para cima); atordoa se passar da metade dos PV máximos");
    const p6 = AA.posicaoTatica(6), p12 = AA.posicaoTatica(12, "tatica2"), p39 = AA.posicaoTatica(39), p39b = AA.posicaoTatica(39, "tatica2"), p48 = AA.posicaoTatica(48, "absoluta");
    ok(!AA.posicaoTatica(5) && p6.margem === 1 && p12.margem === 2 && p12.mult === 2 && p12.pe === 4 && p39.margem === 3 && p39.dados === 3 && p39b.margem === 3 && p39b.mult === 2 && p48.margem === 7 && p48.mult === 4 && p48.dados === 5 && p48.pe === 10, "Posição Tática I, II, III e Absoluta (substituem, não somam)");
    const e30 = AA.estadoAtirador(30, { circuitos: ["mira", "acelerador", "ricochete", "ressonante"], sobrecarga: "acelerador" });
    ok(e30.circuitos.length === 3 && e30.maxCircuitos === 3 && e30.alcanceExtra === 6 && e30.acertoFontes.reduce((t, f) => t + f.valor, 0) === 5, "circuitos até o limite do nível; Acelerador de Mana (+3) acumula com a Mira (+2)");
    ok(AA.maxCircuitos(17) === 0 && AA.maxCircuitos(18) === 1 && AA.maxCircuitos(24) === 2 && AA.maxCircuitos(30) === 3 && AA.categoriaSugerida("Pistola") === "pequena" && AA.categoriaSugerida("Rifle de Precisão") === "grande", "limite de circuitos e porte sugerido");
    {
      // 0.9.0: automação das versões finais das classes
      const F = (classe, arq, nivel, classeEpm = {}) => FC.fontesDaFicha({ classe, arquetipo: arq, nivel, classeEpm });
      const b = F("Bárbaro", "Combatente", 12, { furiaAtiva: true });
      ok(b.classe.furia.dano === 3 && b.classe.furia.rd === 4 && b.classe.furia.custo === 3 && b.classe.furia.usosMax === 2 && b.classe.furia.fisico && b.rd.some(r => r.fonte === "Fúria" && r.valor === 4 && /Cortante/.test(r.tipos)), "Bárbaro 12 em Fúria: +3 dano, RD 4 física, 3 PE/turno, 2 usos");
      ok(F("Bárbaro", "Combatente", 48).classe.furia.semLimite && F("Bárbaro", "Combatente", 30, { furiaAtiva: true }).rd.some(r => r.fonte === "Fúria" && r.tipos === "todos os danos"), "Bárbaro: Fúria sem limite no 48; RD contra todo dano no 27+");
      ok(F("Bárbaro", "Combatente", 36).rd.some(r => r.fonte === "Pele de Pedra" && r.valor === 4), "Pele de Pedra: metade da RD fora da Fúria");
      const g = F("Guardião", "Combatente", 12);
      ok(g.rd.some(r => r.fonte === "Couraça" && r.valor === 5) && g.classe.muralha === 2 && !F("Guardião", "Combatente", 9).rd.some(r => r.fonte === "Couraça"), "Guardião: Couraça RD 5 no 12 (nada antes), Muralha +2");
      const bas = F("Bastião Inquebrável", "Combatente", 33);
      ok(bas.mods.find(m => m.alvo === "recurso.pv")?.valor === 70 && bas.mods.find(m => m.alvo === "ca")?.valor === 3 && bas.classe.corpoInabalavel === "4d10 + @atr.constituicao" && bas.resistencias.some(r => r.tipo === "Cortante"), "Bastião 33: +70 PV, +3 CA, Corpo Inabalável 4d10 + Con, resistência física");
      ok(F("Lutador", "Combatente", 21).extrasAtaque.desarmado.some(x => x.formula === "1d10" && x.fonte === "Artes Marciais"), "Lutador 21: golpe desarmado 1d10");
      const ge = F("Guerreiro Elemental", "Combatente", 27, { elemento: "Som" });
      ok(ge.classe.elemental.dado === "2d8" && ge.classe.elemental.nucleo === 15 && ge.classe.elemental.margem === 3 && ge.classe.elemental.elemento === "Som" && ge.mods.some(m => m.alvo === "acerto" && m.valor === 5), "Elemental 27: 2d8, Núcleo +15, margem +3, Som liberado, +5 Corpo e Mente");
      const gu = F("Guerreiro", "Combatente", 24, { posturas: ["lamina", "muralha", "mira"] });
      ok(gu.classe.posturas.ativas.join() === "lamina,muralha" && gu.extrasAtaque.corpo.some(x => x.formula === "1d8") && gu.mods.some(m => m.alvo === "ca" && m.valor === 3) && gu.rd.some(r => r.valor === 4), "Guerreiro 24: 2 Posturas ativas (Lâmina 1d8, Muralha +3 CA / RD 4)");
      ok(F("Guerreiro", "Combatente", 11, { posturas: ["mira"] }).extrasAtaque.acertoDist.some(x => x.valor === 2), "Postura Mira: +2 só a distância no 11");
      const al = F("Portadora do País Impossível", "Combatente", 21, { histeria: true });
      ok(al.classe.formas === 5 && al.classe.histeria.limiar === "60 PV" && al.mods.some(m => m.fonte === "Histeria" && m.valor === 5), "Alice 21: 5 formas, Histeria com 60 PV, +5 acerto");
      ok(F("Trovador", "Conjurador", 30).classe.inspiracao === "2d8" && F("Trovador", "Conjurador", 30).classe.inspiracaoAliados === 3, "Trovador 30: 2d8 em 3 aliados");
      ok(F("Caçador", "Artífice", 30).classe.pistola === "3d10" && F("Caçador", "Artífice", 24).classe.municaoOficina === 4, "Caçador: Pistola 3d10 no 30, Munição de Oficina 4 no 24");
      const mg = F("Mecânico de Guerra", "Artífice", 24).classe.mecha;
      ok(mg.modelo === "Mk-III" && mg.tamanho === "Enorme" && mg.modulos === 5 && mg.pv === 360 && mg.rd === 5 && mg.punho === "2d10" && mg.energia === "Inteligência + 2", "Mecânico 24: Mk-III Enorme, 5 módulos, 360 PV, RD 5, Punho 2d10");
      const mp = F("Master of Puppets", "Artífice", 33).classe.marionetes;
      ok(mp.qtd === "Inteligência + 4" && mp.pv === 45 && mp.dado === "1d10" && mp.rd === 6, "Master of Puppets 33: Int + 4 Marionetes, 45 PV, 1d10, RD 6");
      ok(["Guerreiro", "Arqueiro", "Mago", "Mago de Guerra", "Clérigo", "Xamã", "Invocador", "Alquimista", "Armadura Viva", "Curandeiro", "Master of Puppets", "Guerreiro do Vazio"].every(n => RC.CLASSES_EPM[FC.idClasse(n)]?.nome === n), "todas as classes novas reconhecidas pelo nome");
    }
    const ex = FC.fontesDaFicha({ classe: "Atirador Arcano", arquetipo: "Conjurador", nivel: 36, classeEpm: { circuitos: ["mira"] } });
    ok(ex.classe?.atirador?.pontaria && ex.classe.atirador.acertoFontes[0]?.valor === 2, "Nv. 36: Disparo Fortificado II soma Pontaria; Mira Estabilizada +2");
  }
  const ids = Object.keys(RC.CLASSES_EPM);
  ok(ids.every(id => RC.CLASSES_EPM[id].descricao && RC.habilidadesDaClasse(id).length), "toda classe pronta tem descrição e habilidades");
  ok(ids.every(id => FC.idClasse(RC.CLASSES_EPM[id].nome) === id) && !FC.idClasse("Arcanista"), "o nome gravado na ficha volta para a mesma classe (e classe escrita à mão fica livre)");
  ok(ids.every(id => { const r = RC.habilidadesDaClasse(id).map(h => h.ref); return new Set(r).size === r.length && r.every(x => new RegExp(`^${id}:[a-z0-9-]+$`).test(x)); }), "refs das habilidades únicas e sem acento");
  ok(ids.every(id => RC.habilidadesDaClasse(id).every(h => !h.caminho || RC.CLASSES_EPM[id].caminhos?.[h.caminho])), "todo caminho usado nas habilidades existe na classe");
  ok(RC.habilidadesLiberadas("barbaro", 7).map(h => h.nome).join() === "Fúria,Instinto Perigoso", "Bárbaro nível 7: Fúria e Instinto Perigoso (versão final, sem caminhos)");
  ok(ids.every(id => RC.CLASSES_EPM[id].habilidades.length >= 16 && (RC.CLASSES_EPM[id].regras ?? []).length), "versões finais: 16 habilidades (3 a 48) e regras em toda classe");
  ok(RC.habilidadesLiberadas("trovador", 2).length === 0 && RC.habilidadesLiberadas("trovador", 50).length === 16, "Trovador: nada antes do nível 3, as 16 no 50");
  {
    const novas = ["guerreiroElemental", "alice", "cacador", "trovador", "bastiao", "guerreiroVazio", "vitalista", "mecanicoGuerra"];
    ok(novas.every(id => RC.habilidadesDaClasse(id).length === 16 && RC.habilidadesLiberadas(id, 2).length === 0), "classes balanceadas: 16 habilidades cada, a primeira no nível 3");
    const AA = await import("/home/claude/epm-ficha/scripts/arquetipos.mjs");
    const ae = AA.ataqueExtraDe(27);
    ok(ae && ae.custoDe(1) > 0 && ae.custoDe(2) >= ae.custoDe(1), `Ataque Extra no 27: custo cresce com a quantidade (${ae?.custoDe(1)}/${ae?.custoDe(2)})`);
    ok(!AA.cacadorDe(18) && AA.cacadorDe(19)?.custo === 12, "Caçador Natural: nada no 18, 12 PE no 19");
    ok(RC.tipoDoElemento("Raio") && RC.tipoDoElemento("Gelo"), "elementos da classe viram tipos de dano do sistema");
  }
}
{
  // Novas mecânicas: contas puras
  const O = await import("/home/claude/epm-ficha/scripts/opcionais.mjs");
  const E = await import("/home/claude/epm-ficha/scripts/escudo-novas.mjs");
  const OF = await import("/home/claude/epm-ficha/scripts/oficina.mjs");
  ok(O.subirNivelDano("Cortante") === "Cortante (Mágico)" && O.subirNivelDano("Fogo (Mágico)") === "Fogo (Verdadeiro)" && O.subirNivelDano("Fogo (Arcaico)") === "Fogo (Arcaico)", "+1 nível de dano");
  ok(O.multiplicarDadosFormula("1d4", 3) === "3d4" && O.multiplicarDadosFormula("2d6 + 1", 2) === "4d6 + 1", "acúmulos multiplicam os dados");
  ok(O.dotsDeAcumulos({ acumulos: { "epm-sangrando": 3 } }, ["epm-sangrando"])[0].efeitos.dot[0].formula === "3d4", "Sangrando ×3 = 3d4 no Novo turno");
  ok(JSON.stringify(O.fasesCruzadas([{ limiar: 50 }, { limiar: 25 }], 60, 20)) === "[0,1]" && O.fasesCruzadas([{ limiar: 50 }], 40, 30).length === 0, "fases do chefe: só ao cruzar o limiar para baixo");
  const b = O.bonusMaestria({ maestria: { "espada longa": { acertos: 500 } } }, "Espada Longa");
  ok(b.acerto === 1 && b.tecnica && b.nivelDano === 1 && O.bonusMaestria({}, "Arco").acerto === 0, "marcos da Maestria (50/200/500)");
  const t = O.efeitosDosTraumas({ traumas: { a: { tipo: "hipervigilancia", nome: "Hipervigilância" }, b: { tipo: "fobia", nome: "Fobia", gatilhoPresente: true } } });
  ok(t.mods.some(m => m.alvo === "iniciativa" && m.valor === 2) && t.fontes.some(f => f.efeitos.desvTestes), "traumas viram efeitos na ficha");
  const l = E.lerListas({ eventos: "Salvou a vida | +1\nTraição | -2\nsem valor", traumas: "Tique | -2 em Furtividade\nMedo do escuro | desvantagem no escuro", feitos: "Primeiro sangue | Primeiro inimigo | 3 | Sangue Novo | chefe", acumulos: "1d6 | 1d4 | 2d6" });
  ok(l.eventos.length === 2 && l.eventos[1].delta === -2 && l.traumas[0].id === "tique" && l.traumas[1].id === "medo-do-escuro" && l.feitos[0].pev === 3 && l.feitos[0].auto === "chefe" && l.acumulos["epm-em-chamas"] === "2d6", "listas do Mestre lidas do texto");
  ok(OF.metadeMaterial(1) === 1 && OF.metadeMaterial(5) === 3 && OF.lerCriacao("x", { horas: 4, horasFeitas: 4 }).estado === "pronto", "criação: metade dos materiais e estado pronto");
  ok(OF.precoTreinoCobre({ precoHora: 2, precoMoeda: "pp" }) === 20 && OF.pagarTreinador({ moedas: { po: 0 } }, { precoHora: 1, precoMoeda: "po" }, 3) === null, "treinador cobra por hora (sem dinheiro, nada)");
}

// ---------- Níveis de tecnologia (item 23) ----------
{
  const T = await import("/home/claude/epm-ficha/scripts/tecnologia.mjs");
  const { nivelTecPersonagem } = await import("/home/claude/epm-ficha/scripts/ficha-extras.mjs");
  const { efeitosDeItens, avaliarRequisitos } = { ...(await import("/home/claude/epm-ficha/scripts/data.mjs")), ...(await import("/home/claude/epm-ficha/scripts/oficina.mjs")) };
  const item = (type, f = {}, extra = {}) => ({ id: type, name: type, type, system: { equipped: true, quantity: 1 }, flags: { "epm-ficha": f }, ...extra });
  ok(nivelTecPersonagem({ regiaoOrigem: "umbra" }) === 1 && nivelTecPersonagem({ regiaoOrigem: "genesis" }) === 3 && nivelTecPersonagem({ tecnologia: 2 }) === 2, "nível de tecnologia pela região de origem (sem ela, o campo antigo)");
  const t = (esp, estado = "concluido") => ({ nome: "x", especial: esp, estado });
  ok(nivelTecPersonagem({ regiaoOrigem: "umbra", treinamentos: { a: t("adaptacao2") } }) === 2, "Adaptação nível 2 concluída sobe para 2");
  ok(nivelTecPersonagem({ regiaoOrigem: "umbra", treinamentos: { a: t("adaptacao3") } }) === 1, "Adaptação nível 3 sem a do 2 não vale (em ordem)");
  ok(nivelTecPersonagem({ regiaoOrigem: "umbra", treinamentos: { a: t("adaptacao3"), b: t("adaptacao2") } }) === 3, "Adaptações 2 e 3 concluídas: nível 3");
  ok(nivelTecPersonagem({ regiaoOrigem: "umbra", adaptacaoTec: "3" }) === 3 && nivelTecPersonagem({ regiaoOrigem: "umbra", adaptacaoTec: "0", treinamentos: { a: t("adaptacao2") } }) === 1, "o Mestre dá ou tira a adaptação na mão");
  ok(T.penalidadeTec(item("weapon", { regiao: "umbra" }), 1) === null, "item do mesmo nível: sem penalidade");
  const p1 = T.penalidadeTec(item("weapon", { regiao: "briavoterna" }), 1);
  ok(p1?.desvantagem && !p1.penal && !p1.complexo, "arma 1 nível acima: desvantagem");
  const p2 = T.penalidadeTec(item("weapon", { regiao: "genesis", complexo: true }), 1);
  ok(p2?.desvantagem && p2.penal === -5 && p2.complexo, "arma 2 níveis acima: desvantagem, −5 e teste se for complexa");
  ok(T.penalidadeTec(item("weapon", { regiao: "briavoterna", complexo: true }), 1)?.complexo === false, "complexo só pede teste 2 níveis acima");
  const arm = item("equipment", { regiao: "genesis", armadura: 7, efeitos: { a: { tipo: "rd", tipoDano: "Balístico", valor: 10 }, b: { tipo: "mod", alvo: "deslocamento", valor: -3 } } });
  const [semPen] = efeitosDeItens([arm], { nivelTec: 3 });
  const [comPen] = efeitosDeItens([arm], { nivelTec: 1 });
  const [umAcima] = efeitosDeItens([arm], { nivelTec: 2 });
  ok(semPen.armadura === 7 && semPen.efeitos.length === 2, "armadura do nível do personagem: CA e propriedades normais");
  ok(comPen.armadura === 2 && comPen.efeitos.length === 1 && comPen.efeitos[0].valor === -3, "armadura 2 níveis acima: −5 na CA, perde a RD e mantém a penalidade");
  ok(umAcima.armadura === 5, "armadura 1 nível acima: −2 na CA");
  ok(avaliarRequisitos("nível de tecnologia 2", { extras: { tecnologia: 1 } }, {}).ok === false && avaliarRequisitos("nível de tecnologia 2", { extras: { tecnologia: 2 } }, {}).ok, "requisito \"nível de tecnologia 2\" (Adaptação nível 3)");
}
{
  // 0.8.28: CD de Projeto e Projetos instalados
  const PJ = await import("/home/claude/epm-ficha/scripts/projetos.mjs");
  ok(PJ.cdDeProjeto(6, { pontos: 5, outros: 3, mod: 0 }) === 20, "CD de Projeto: 10 + Int 6 + (5 + 3)/2 = 20");
  ok(PJ.cdDeProjeto(6, { bonusProprio: 9 }) === 20 && PJ.cdDeProjeto(0, null) === 10, "CD de Projeto arredonda a metade para baixo");
  const af = PJ.efeitoInstalado("afiacao", 2, 4, { modo: "acoplamento", tipoDano: "Fogo" });
  ok(af.tipo === "danoExtra" && af.formula === "3d8 + 4" && af.tipoDano === "Fogo", "Afiação Grau II (Acoplamento Fogo): +3d8 + Int");
  ok(PJ.efeitoInstalado("afiacao", 6, 3).formula === "10d10 + 3", "Afiação acima do Grau V: +2 dados");
  ok(PJ.efeitoInstalado("placas-reforco", 3, 0).valor === 5 && PJ.efeitoInstalado("torreta", 1, 0) === null, "Placas de Reforço Grau III: RD física 5; Torreta não se instala");
}
{
  // 0.9.0: sistema de habilidades e Habilidade Única Inicial
  const S = await import("/home/claude/epm-ficha/scripts/habilidades-sistema.mjs");
  const { HABILIDADES_EXEMPLO: E } = await import("/home/claude/epm-ficha/scripts/habilidades-exemplos.mjs");
  ok(E.length === 32 && E.every(h => S.contaHabilidade(h).ok), "os 31 exemplos + o Legado do Errante fecham o Orçamento");
  const legado = S.contaHabilidade(E.find(h => h.nome === "O Legado do Errante"), { arquetipos: ["combatente"] });
  ok(legado.ph === 34 && legado.horas === 20 && legado.dt === 20 && legado.raridade === "epica" && legado.bonusTeste === 2, "Legado do Errante: 34 PH, 26 h (20 com afinidade), DT 20");
  ok(S.contaHabilidade(E.find(h => h.nome === "O Legado do Errante")).horas === 26, "sem afinidade: 26 h");
  const desafio = S.contaTecnica({ raridade: "rara", modo: "buff", mods: { alcance18: 1, dur3: 1, condicional: 2 }, restricoes: { acaoLenta: 1, condicaoUso: 1, terminaGatilho: 1 } });
  ok(desafio.total === 5 && desafio.restricao === 2 && desafio.gasto === 5 && desafio.custo === 10, "restrição devolve até metade (Rara +2)");
  ok(S.contaTecnica({ raridade: "epica", mods: { area1: 1 } }).custo === 23 && S.contaTecnica({ raridade: "lendaria", mods: { area3: 1 } }, { categoria: "magia" }).custo === 27, "área: +50% no uso (PE e PM)");
  ok(S.contaTecnica({ raridade: "rara", mods: { condForte: 1 } }).erros.some(e => /Épica/.test(e)) && S.contaTecnica({ raridade: "comum", mods: { alcance9: 1, alcance18: 1 } }).erros.length >= 1, "bloqueia condição forte abaixo da Épica e dois alcances");
  ok(S.contaHabilidade({ tecnicas: [{ raridade: "comum" }, { raridade: "comum" }] }).erros.some(e => /técnica/.test(e)), "Comum tem 1 técnica só");
  ok(S.contaHabilidade({ categoria: "ritual", tecnicas: [{ raridade: "comum", mods: { efeitoMenor: 3 } }] }).ok && S.contaTecnica({ raridade: "comum" }, { categoria: "ritual" }).custo === 10, "ritual: +2 de Orçamento e materiais em PO");
  ok(S.contaHabilidade({ tecnicas: [{ raridade: "unica" }] }, { modo: "aprender" }).erros.some(e => /aprendida/.test(e)), "Única não pode ser aprendida");
  const lim = S.contarLimites([{ raridade: "epica" }, { raridade: "epica" }, { raridade: "epica" }, { raridade: "epica" }, { raridade: "unica", hui: true }, { raridade: "mitica", foraDoLimite: true }]);
  ok(lim.epica.cheio && lim.unica.usados === 0 && lim.mitica.usados === 0, "limites: Épica 4; HUI e fora do limite não contam");
  ok(S.validarHui([{ peso: "suprema" }, { peso: "regular" }, { peso: "regular" }, { peso: "regular" }, { peso: "leve" }]).ok && !S.validarHui([{ peso: "suprema" }, { peso: "regular" }, { peso: "regular" }, { peso: "regular" }, { peso: "regular" }]).ok, "HUI: peso 10 passa, 11 bloqueia");
  ok(!S.validarHui([{ peso: "suprema" }, { peso: "suprema" }]).ok && !S.validarHui(Array(6).fill({ peso: "leve" })).ok && S.validarHui(Array(6).fill({ peso: "leve" }), 6).ok, "HUI: 2 Supremas bloqueia; 6 técnicas só no Estágio VI");
  ok(S.validarHui([{ peso: "leve" }, { peso: "regular" }, { peso: "regular" }, { peso: "suprema" }]).peso === 8, "Legado como HUI: peso 8 de 10, sem passivo");
  ok([1, 10, 20, 30, 40, 50].map(n => S.estagioDoNivel(n).n).join() === "1,2,3,4,5,6" && S.estagioDoNivel(9).n === 1 && S.estagioDoNivel(49).n === 5, "estágios nos níveis 1, 10, 20, 30, 40 e 50");
  ok(S.raridadeHui("leve", 1).custo === "incomum" && S.raridadeHui("suprema", 4).custo === "unica" && S.raridadeHui("regular", 5).custo === "unica" && S.raridadeHui("suprema", 6).custo === "transcendida" && S.raridadeHui("leve", 6).custo === "transcendida", "raridade pelo peso e estágio (V; VI tudo Transcendida)");
  const rr = S.raridadeHui("suprema", 1, { ressonante: true });
  ok(rr.custo === "epica" && rr.numeros === "lendaria" && S.contaTecnica({ raridade: rr.custo, modo: "golpe" }, { numeros: rr.numeros }).custo === 15, "Ressonante: números do próximo estágio, custo do atual");
  ok(S.raridadeHui("suprema", 6, { final: true }).numeros === "transcendidaRessonante" && S.raridadeHui("leve", 6, { final: true }).numeros === "transcendida" && S.RARIDADES_HAB.transcendidaRessonante.golpeFixo === 64, "Ressonância final: Transcendida Ressonante (64) na Suprema");
  const r1 = S.registrarUsoHui({ estado: "ativa", estagio: 1, usos: 9 }, { combateId: "c1" });
  ok(r1.contou && r1.usos === 10 && r1.ressonante && r1.ressoou, "10 usos no Estágio I: Ressonante");
  ok(!S.registrarUsoHui({ estado: "ativa", estagio: 1, usos: 9, usosCombate: { c1: 3 } }, { combateId: "c1" }).contou && !S.registrarUsoHui({ estado: "ativa" }, { passiva: true }).contou, "máximo de 3 por combate; passiva não conta");
  const m = S.mudarEstagioHui({ estagio: 1, usos: 12, ressonante: true }, 10);
  ok(m.estagio === 2 && m.usos === 0 && !m.ressonante && S.mudarEstagioHui({ estagio: 2 }, 5).estagio === 1, "subir de estágio zera usos e Ressonância; nível baixo volta");
  ok(S.registrarUsoHui({ estado: "ativa", estagio: 6, usos: 39 }).final && S.mudarEstagioHui({ estagio: 6, final: true }, 50) === null, "Estágio VI: 40 usos dão a Ressonância final, que fica");
  const pr = S.promptHui({ respostas: { q1: "A", q6: "liberdade" }, nome: "Kael", unicas: [{ nome: "Coração de Ferro", tema: "proteção" }] });
  ok(/Kael/.test(pr) && /A\) Resolveria diretamente/.test(pr) && /Coração de Ferro/.test(pr) && /TÉCNICA:/.test(pr), "prompt preenchido com respostas, personagem e Únicas do mundo");
  const lida = S.lerRespostaHui("NOME: Eco da Liberdade\nTIPO: Ofensiva\nTEMA: liberdade\nDESCRIÇÃO: Ninguém prende.\nTÉCNICA: Corte Livre | Regular | Golpe | 10 PE | Ação Padrão | — | livre\nEFEITO: +2d8 de dano.\nTÉCNICA: Grito | Suprema | Explosão | 15 PE | Ação Padrão | — | 1x por combate\nEFEITO: 5d10 em área.");
  ok(lida.nome === "Eco da Liberdade" && lida.tecnicas.length === 2 && lida.tecnicas[1].peso === "suprema" && lida.tecnicas[1].modo === "explosao" && lida.tecnicas[0].custoProposto === 10, "Colar resposta: lê nome, técnicas, peso, modo e custo");
  ok(S.repetidasHui({ nome: "Coração de Ferro", tecnicas: [] }, [{ nome: "Coração de Ferro" }]).length === 1, "avisa nome igual ao de outra Única");
  ok(S.respostasCompletas({ q1: "A", q2: "B", q3: "C", q4: "D", q5: "E", q6: "x" }) && !S.respostasCompletas({ q1: "A" }), "questionário completo só com as 6");
  const MM = await import("/home/claude/epm-ficha/scripts/migracoes-mundo.mjs");
  ok(MM.trocasHui090({ nivel: 25 })["flags.epm-ficha.unicaInicial"].estagio === 3 && MM.trocasHui090({}, "npc")["flags.epm-ficha.unicaInicial"].estado === "nenhuma" && !Object.keys(MM.trocasHui090({ unicaInicial: { estado: "ativa" } })).length, "migração: personagem pendente no estágio do nível, NPC sem HUI");
}

console.log(falhas ? `\n${falhas} falha(s)` : "\nregras ok");
process.exit(falhas ? 1 : 0);
