/**
 * Testes da 0.9.3 (sem Foundry): automação pelo texto, condições da forma e padronização das habilidades existentes.
 * Uso: node testes/testes/automacao.mjs
 */
import { lerAutomacao, automatizarForma, receitaDoPoder, condicoesDoTexto, VERSAO_PADRONIZACAO } from "/home/claude/epm-ficha/scripts/habilidade-auto.mjs";
import { formaPadrao, normalizarForma } from "/home/claude/epm-ficha/scripts/data.mjs";
import { planoPadronizacao } from "/home/claude/epm-ficha/scripts/habilidades-padrao.mjs";
import { FLAG } from "/home/claude/epm-ficha/scripts/config.mjs";

let falhas = 0;
function ok(cond, msg) { console.log(cond ? "ok  " : "FALHA", msg); if (!cond) falhas++; }

const CORTE = "Um corte que viaja até 9 m: ataque com a arma, +2d8 (ou +10) de dano. O alvo faz Fortitude CD 10 + Força; se falhar, fica Lento e Fraco até o fim do próximo turno dele. 1x por combate.";
const BOLA = "Esfera de 6 m a até 18 m. Reflexo CD 10 + Arcanismo + 2: 4d12 + 15 + Núcleo de dano de Fogo; quem falha fica Em Chamas, quem passa sofre metade.";

// ---------- Leitura ----------
const a = lerAutomacao(CORTE, { modo: "golpe" });
ok(a.alcance === "9 m", "alcance lido do texto");
ok(a.teste?.tipo === "resistencia" && a.teste.pericia === "fortitude" && /@atr\.forca/.test(a.teste.nd), "teste de Fortitude com DT 10 + Força");
ok(a.dano?.formula?.includes("2d8"), "dano 2d8");
ok(a.condicoes?.includes("epm-lento") && a.condicoes?.includes("epm-fraco"), "condições Lento e Fraco");
ok(a.uso === "combate", "1x por combate vira uso por combate");
const b = lerAutomacao(BOLA, { modo: "explosao" });
ok(/4d12/.test(b.dano?.formula ?? "") && /@atr\.nucleo/.test(b.dano.formula), "dano 4d12 + 15 + Núcleo");
ok(b.teste?.pericia === "reflexos", "explosão: Reflexo");
ok(b.area, "área lida (esfera)");
ok(lerAutomacao("Ação Padrão, até 9 m, 10 PM: Cura 2d8 + Núcleo em até dois aliados.").dano?.tipo === "Cura", "cura reconhecida");
ok(!condicoesDoTexto("Um estalo: não fica Cego enquanto puder ouvir. Se ficar Surdo, perde a passiva.").length, "não fica / se ficar não viram condição aplicada");
ok(!lerAutomacao("Reduz o dano recebido em 5 por 1 minuto.").dano?.formula, "\"reduz o dano\" não vira rolagem");

// ---------- Só preenche o vazio ----------
const f0 = formaPadrao(0, "Corte");
const { forma, campos } = automatizarForma(f0, CORTE, { modo: "golpe" });
ok(campos.length > 0 && forma.condicoes.length === 2, "forma vazia é preenchida");
const fEscrita = { ...formaPadrao(0, "Corte"), alcance: "3 m", dano: { formula: "1d4", tipo: "Corte" } };
const r2 = automatizarForma(fEscrita, CORTE, { modo: "golpe" }).forma;
ok(r2.alcance === "3 m" && r2.dano.formula === "1d4", "o que o jogador escreveu não é apagado");

// ---------- Condições na forma normalizada ----------
ok(JSON.stringify(normalizarForma("x", { condicoes: ["epm-lento", 3, "", null] }).condicoes) === '["epm-lento"]', "normalizarForma guarda só ids de condição");
ok(Array.isArray(normalizarForma("x", {}).condicoes), "forma antiga ganha lista vazia de condições");

// ---------- Receita ----------
const rec = receitaDoPoder({ tipoItem: "feat", nome: "Corte", raridade: "rara", formas: [{ ...forma, efeito: CORTE }] });
ok(rec.padronizada && rec.categoria === "habilidade" && rec.tecnicas.length === 1, "receita do poder montada");
ok(rec.tecnicas[0].raridade === "rara" && rec.tecnicas[0].modo, "técnica com raridade e modo");
ok(rec.tecnicas[0].mods?.condMedia || rec.tecnicas[0].mods?.condLeve || Object.keys(rec.tecnicas[0].mods ?? {}).length, "modificadores saem do efeito");
ok(receitaDoPoder({ tipoItem: "spell", nome: "Bola", raridade: "rara", formas: [{ ...formaPadrao(0, "Bola"), efeito: BOLA }] }).categoria === "magia", "spell vira magia");

// ---------- Plano de padronização ----------
const itemFeito = (flags, type = "feat") => ({ type, name: "Corte", system: { description: { value: "" } },
  flags: { [FLAG]: { formas: { f1: { ...formaPadrao(0, "Corte"), efeito: `<p>${CORTE}</p>` } }, ...flags } } });
const p1 = planoPadronizacao(itemFeito({ origem: "criada", raridade: "rara" }));
ok(p1 && p1.upd[`flags.${FLAG}.padronizada`] === VERSAO_PADRONIZACAO, "plano marca a versão da padronização");
ok(p1.upd[`flags.${FLAG}.formas.f1.condicoes`]?.length === 2, "plano preenche as condições da forma");
ok(p1.upd[`flags.${FLAG}.receita`], "habilidade feita à mão ganha receita");
ok(!planoPadronizacao(itemFeito({ origem: "classe" })).upd[`flags.${FLAG}.receita`], "habilidade de classe não ganha receita (só automação)");
ok(!planoPadronizacao(itemFeito({ grimorio: "bola-de-fogo" }, "spell")).upd[`flags.${FLAG}.receita`], "magia do Grimório não ganha receita");
ok(!planoPadronizacao(itemFeito({ hui: { estagio: 1 } })).upd[`flags.${FLAG}.receita`], "HUI não ganha receita");
ok(planoPadronizacao(itemFeito({ padronizada: VERSAO_PADRONIZACAO })) === null, "migração não refaz o que já está padronizado");
ok(planoPadronizacao(itemFeito({ padronizada: VERSAO_PADRONIZACAO }), { forcar: true }), "\"Automatizar pelo texto\" refaz quando pedido");
ok(planoPadronizacao({ type: "weapon", flags: {} }) === null, "armas ficam de fora");

console.log(falhas ? `\n${falhas} falha(s)` : "\nautomação ok");
process.exit(falhas ? 1 : 0);
