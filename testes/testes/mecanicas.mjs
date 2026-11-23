/** Executa as mecânicas com um Foundry de mentira e confere os resultados. */
import { registro, respostas, atorFalso } from "../foundry-falso.mjs";
import { criarAurelia } from "../amostra.mjs";
const M = await import("/home/claude/epm-ficha/scripts/mecanicas.mjs");
const { lerAtor } = await import("/home/claude/epm-ficha/scripts/context.mjs");

let falhas = 0;
const ok = (cond, msg) => { if (cond) console.log("ok  ", msg); else { falhas++; console.log("FALHA", msg); } };
const estado = a => lerAtor(a).ficha;
const novo = () => { registro.mensagens.length = 0; registro.avisos.length = 0; return atorFalso(criarAurelia().ator); };

// --- Bênção com duração: Fera Interior (já em curso, 2 turnos) ---
{
  const a = novo();
  respostas.push({ 0: true }); // diálogo de início de turno: aplica o dano de Envenenamento Sistêmico
  const pvAntes = estado(a).recursos.pv;
  await M.novoTurno(a);
  const b1 = a.flags["epm-ficha"].bencaos.b1;
  ok(b1.turnosRestantes === 1 && b1.ativo, "novo turno desconta a duração da bênção (2 → 1)");
  const pv = estado(a).recursos.pv;
  ok(pv.temp < pvAntes.temp && pv.value === pvAntes.value && (pvAntes.temp - pv.temp) === 4, `dano contínuo tira primeiro a vida temporária (temp ${pvAntes.temp}→${pv.temp}, PV ${pvAntes.value}→${pv.value})`);
  ok(registro.mensagens.some(m => String(m.content).includes("Início do turno")), "cartão de início de turno no chat");
  ok(a.flags["epm-ficha"].acoes.padrao === false && a.flags["epm-ficha"].acoes.movimento === true, "ações restauradas e defesa descontada do Movimento");
  respostas.push({ 0: true });
  const pvAntes2 = estado(a).recursos.pv.value;
  await M.novoTurno(a);
  ok(!a.flags["epm-ficha"].bencaos.b1.ativo && a.flags["epm-ficha"].bencaos.b1.turnosRestantes === 0, "duração acabou: Fera Interior desligou");
  const pv2 = estado(a).recursos.pv.value;
  ok(pv2 <= pvAntes2 - 30, `custo final de Fera Interior: −30 PV (${pvAntes2} → ${pv2})`);
}

// --- Usar bênção com uso diário: Coração Imortal (já usada) e recarga no descanso longo ---
{
  const a = novo();
  game.user.isGM = false;
  await M.usarBencao(a, "b2");
  ok(registro.avisos.some(([t, m]) => t === "warn" && m.includes("já foi usada")), "bênção 1/dia já usada é recusada para o jogador");
  game.user.isGM = true;
  a.system.attributes.hp.value = 3;
  respostas.push(true); // confirmar uso pelo Mestre
  await M.usarBencao(a, "b2");
  ok(a.system.attributes.hp.value === 32, `Coração Imortal volta com metade da Vida máxima (3 → ${a.system.attributes.hp.value})`);
  respostas.push({ pv: true, pm: true, pe: true, ps: false, exaustao: true, treino: false });
  await M.descanso(a, "longo");
  ok(a.flags["epm-ficha"].bencaos.b2.usado === false, "descanso longo recarrega bênção 1/dia");
  ok(a.flags["epm-ficha"].exaustao === 1, "descanso longo reduz a exaustão (2 → 1)");
}

// --- Descanso com condições que impedem recuperar ---
{
  const a = novo();
  a.statuses.add("epm-desgastado");
  a.system.attributes.hp.value = 10;
  respostas.push({ pv: true, pm: true, pe: true, ps: false, exaustao: false, treino: false });
  await M.descanso(a, "longo");
  ok(a.system.attributes.hp.value === 10, "Desgastado: não recupera PV no descanso");
  a.statuses.delete("epm-desgastado");
  a.statuses.add("epm-privacao-de-sono");
  await M.descanso(a, "curto");
  ok(registro.avisos.some(([, m]) => m.includes("Sem descanso curto")), "Privação de Sono bloqueia o descanso curto");
}

// --- Exaustão 5 e 6 marcam o token ---
{
  const a = novo();
  await M.definirExaustao(a, 5);
  ok(a.statuses.has("epm-incapacitado") && a.statuses.has("epm-inconsciente"), "Exaustão 5 marca Incapacitado e Inconsciente");
  respostas.push(true);
  await M.definirExaustao(a, 6);
  ok(a.statuses.has("dead") && a.flags["epm-ficha"].exaustao === 6, "Exaustão 6 (confirmada) marca Morto");
  await M.definirExaustao(a, 3);
  ok(!a.statuses.has("dead") && !a.statuses.has("epm-incapacitado"), "voltar para 3 tira os status que a exaustão marcou");
}

// --- Combinação Molhado + Enregelado → Congelado ---
{
  const a = novo();
  await M.aplicarCombinacao(a, "molhado-enregelado", "aplicar");
  ok(a.statuses.has("epm-congelado"), "Aplicar combinação liga Congelado");
  const f = estado(a);
  ok(f.condicoes.find(c => c.id === "epm-imovel").automatica && f.deslocamento.final === 0, "Congelado deixa Imóvel (automática) e deslocamento 0");
}

// --- Usar poder com maldição Mana Corrompida (+5 PM em magias) ---
{
  const a = novo();
  const bola = a.items.find(i => i.name === "Bola de Fogo");
  const pmAntes = estado(a).recursos.pm.value;
  await M.usarPoder(a, bola);
  const pm = estado(a).recursos.pm.value;
  ok(pmAntes - pm === 13 - 6 && estado(a).recursos.pm.temp === 0, `Mana Corrompida: Bola de Fogo custa 8 + 5 PM; 6 saem da Mana temporária (${pmAntes} → ${pm})`);
}

// --- Consumível com cura configurada ---
{
  const a = novo();
  a.system.attributes.hp.value = 10;
  const pocao = a.items.find(i => i.name === "Poção de cura maior");
  await M.usarItem(a, pocao);
  ok(a.system.attributes.hp.value > 10 && pocao.system.quantity === 2, `Poção cura (${a.system.attributes.hp.value} PV) e gasta 1 unidade`);
}

// --- Moedas: Imposto da Pobreza some com metade ---
{
  const a = novo();
  respostas.push({ qtd: "10", moeda: "po" });
  await M.operarMoedas(a, "receber");
  ok(a.flags["epm-ficha"].moedas.po === 250, `Imposto da Pobreza: recebe 10 PO e fica com 5 (245 → ${a.flags["epm-ficha"].moedas.po})`);
  respostas.push({ qtd: "1", moeda: "dr" });
  await M.operarMoedas(a, "pagar");
  ok(a.flags["epm-ficha"].moedas.dr === 0, "pagar 1 Dracma");
}

// --- Ataque com penalidades e dano extra ---
{
  const a = novo();
  const katana = a.items.find(i => i.name === "Katana Solar");
  const at = (await import("/home/claude/epm-ficha/scripts/context.mjs")).ataqueDeArma(katana);
  await M.rolarAtaque(a, at, { modo: "normal", comDano: true });
  const msg = registro.mensagens.at(-1);
  ok(String(msg.content).includes("Acertou: +1d4 PV"), "cartão de ataque traz o botão de cura ao acertar");
  ok(msg.rolls.length === 3, "Exaustão 1: dano rolado duas vezes (fica o menor)");
}

// --- Dano vai para o alvo marcado, não para o atacante, e não soma o acerto ---
{
  const a = novo();
  const alvo = novo();
  alvo.uuid = "Actor.alvo"; alvo.name = "Goblin"; alvo.isOwner = true;
  alvo.system.attributes.hp = { value: 30, max: 30, temp: 0 };
  globalThis.fromUuidSync = u => (u === alvo.uuid ? alvo : u === a.uuid ? a : null);
  game.user.targets = new Set([{ actor: alvo }]);
  const katana = a.items.find(i => i.name === "Katana Solar");
  const at = (await import("/home/claude/epm-ficha/scripts/context.mjs")).ataqueDeArma(katana);
  const vidaAtacante = a.system.attributes.hp.value;
  await M.rolarAtaque(a, at, { modo: "normal", comDano: true });
  const msg = registro.mensagens.at(-1);
  const m = String(msg.content).match(/data-epm-action="dano" data-valor="(\d+)" data-alvos="([^"]+)"/);
  ok(m && m[2] === alvo.uuid, "botão Aplicar dano aponta para o alvo marcado");
  const valorDano = Math.max(0, Math.round(msg.rolls[1].total < msg.rolls[2].total ? msg.rolls[1].total : msg.rolls[2].total));
  ok(m && Number(m[1]) === Math.max(0, Math.round(msg.rolls.find((r, i) => i > 0 && Math.round(r.total) === Number(m[1]))?.total ?? -1)), `valor do botão é só o dano (${m?.[1]}), sem o acerto (${msg.rolls[0].total})`);
  const { danoRecebido } = await import("/home/claude/epm-ficha/scripts/data.mjs");
  const esperado = danoRecebido(estado(alvo), Number(m[1]), "").final;
  await M.aplicarDanoDoCartao(a, { dataset: { valor: m[1], alvos: m[2] } });
  ok(alvo.system.attributes.hp.value === 30 - esperado, `alvo perde ${esperado} PV de ${m[1]} (RD do Vigor alto conta) (${alvo.system.attributes.hp.value})`);
  ok(a.system.attributes.hp.value === vidaAtacante, "atacante não perde vida");
  game.user.targets = new Set();
  void valorDano;
}

// --- CA = 10 + Destreza + armadura + outros; atributo escolhível ---
{
  const a = novo();
  const { lerAtor } = await import("/home/claude/epm-ficha/scripts/context.mjs");
  const f = lerAtor(a).ficha;
  const des = f.atributos.destreza.total;
  ok(f.ca.total - f.ca.mod - f.ca.penal === 10 + des + 2 + 1, `CA = 10 + DES (${des}) + armadura 2 + outros 1 (${f.ca.total - f.ca.mod - f.ca.penal})`);
  a.flags["epm-ficha"].ca.atributo = "constituicao";
  const f2 = lerAtor(a).ficha;
  ok(f2.ca.atributoValor === f2.atributos.constituicao.total, "CA pode usar outro atributo");
}

// --- Treinamentos ---
{
  const a = novo();
  const { lerAtor } = await import("/home/claude/epm-ficha/scripts/context.mjs");
  const f = lerAtor(a).ficha;
  ok(f.periciaPorId.luta.fontes.some(x => /Esgrima Rúnica/.test(x.fonte)), "treinamento concluído soma o modificador (Luta +2)");
  ok(!f.deslocamento.fontes.some(x => /Corredor/.test(x.fonte)), "treinamento em andamento ainda não vale");
  ok(M.horasLivres(a) === 6, `horas livres hoje: 8 − 2 = ${M.horasLivres(a)}`);
  await M.treinarHoras(a, "t1", 6);
  ok(a.flags["epm-ficha"].treinamentos.t1.horasFeitas === 26 && M.horasLivres(a) === 0, "treinar 6 h avança o treino e gasta as horas do dia");
  await M.treinarHoras(a, "t1", 5);
  ok(a.flags["epm-ficha"].treinamentos.t1.horasFeitas === 26, "sem horas livres não treina");
  a.flags["epm-ficha"].treinoDia.horas = 0;
  a.flags["epm-ficha"].treinamentos.t1.horasFeitas = 44;
  await M.treinarHoras(a, "t1", 8);
  ok(a.flags["epm-ficha"].treinamentos.t1.estado === "concluido" && a.flags["epm-ficha"].treinamentos.t1.horasFeitas === 48, "ao completar 48 h o Corredor fica concluído (só usa as 4 h que faltavam)");
  ok(lerAtor(a).ficha.deslocamento.fontes.some(x => /Corredor/.test(x.fonte)), "Corredor concluído soma +3 m de deslocamento");
  const ptAntes = a.flags["epm-ficha"].pontos.pt;
  await M.resultadoMinijogo(a, "mira", 4);
  ok(a.flags["epm-ficha"].pontos.pt === ptAntes + 2, "minijogo com 4 acertos dá +2 PT");
  await M.comecarTreinamento(a, "t3");
  ok(a.flags["epm-ficha"].treinamentos.t3.estado === "planejado", "sem PT suficientes não começa o Flash Step (100 PT)");
}

// --- Moedas na mochila ---
{
  const a = novo();
  const { transferirMoedas } = M;
  const mochila = a.items.find(i => i.type === "container");
  const po = a.flags["epm-ficha"].moedas.po;
  await transferirMoedas(a, mochila, "po", 5, "guardar");
  ok(a.flags["epm-ficha"].moedas.po === po - 5 && mochila.flags["epm-ficha"].moedas.po === 45, "guardar 5 PO na mochila");
  await transferirMoedas(a, mochila, "dr", 2, "pegar");
  ok(mochila.flags["epm-ficha"].moedas.dr === 1, "não pega mais do que há na mochila");
}

// --- Recursos temporários (Estamina, Mana, Sanidade) ---
{
  const a = novo();
  a.flags["epm-ficha"].recursos.pe.temp = 3;
  const { lerAtor } = await import("/home/claude/epm-ficha/scripts/context.mjs");
  const f = lerAtor(a).ficha;
  ok(f.recursos.pe.temp === 3, "Estamina temporária é lida");
  const perda = M.calcularPerda(f, "pe", 5);
  ok(perda.updates["flags.epm-ficha.recursos.pe.temp"] === 0 && perda.novo === f.recursos.pe.value - 2, `perder 5 PE gasta 3 da temporária e 2 da normal (${perda.novo})`);
}

// --- Iniciativa usa penalidade de Destreza ---
{
  const a = novo();
  await M.rolarIniciativa(a, null);
  const m = registro.mensagens.at(-1);
  ok(/Exaustão 2/.test(m.flavor ?? "") && /Enregelado/.test(m.flavor ?? ""), "iniciativa mostra as penalidades de Destreza");
}

// --- Fim de combate: Olhos do Criador e recarga 1/combate ---
{
  const a = novo();
  a.flags["epm-ficha"].bencaos.m9 = { catalogo: "m029", nome: "Olhos do Criador", tipo: "maldicao", ativo: true, mods: {} };
  a.flags["epm-ficha"].bencaos.b9 = { catalogo: "b011", nome: "Balança Divina", tipo: "bencao", ativo: true, usado: true, mods: {} };
  const ps = estado(a).recursos.ps.value;
  await M.fimDeCombate({ combatants: [{ actor: a }] });
  ok(estado(a).recursos.ps.value === ps - 10, "Olhos do Criador: −10 PS no fim do combate");
  ok(a.flags["epm-ficha"].bencaos.b9.usado === false, "bênção 1/combate recarrega no fim do combate");
}

// --- 0.6.7: consumíveis que removem condição, dão bônus pela cena e curam ---
{
  const a = novo();
  const criar = (name, flags) => {
    const it = { id: `it${Math.random().toString(36).slice(2, 8)}`, name, type: "consumable", system: { quantity: 2, description: { value: "" } }, flags: { "epm-ficha": flags }, actor: a };
    it.update = async u => { for (const [k, v] of Object.entries(u)) { const partes = k.split("."); let o = it; for (const p of partes.slice(0, -1)) o = o[p] ??= {}; o[partes.at(-1)] = v; } return it; };
    a.items.push(it);
    return it;
  };
  const antidoto = criar("Antídoto", { removeCondicoes: ["envenenado"] });
  a.statuses.add("epm-envenenado");
  await M.usarItem(a, antidoto);
  ok(!a.statuses.has("epm-envenenado") && antidoto.system.quantity === 1, "consumível remove Envenenado e gasta 1");
  const agil = criar("Poção de Agilidade", { bonusUso: { texto: "+2 CA e +3 m", ca: 2, deslocamento: 3 } });
  await M.usarItem(a, agil);
  const bonus = Object.values(a.flags["epm-ficha"].bonusCena ?? {}).find(b => b?.origem === agil.id);
  ok(bonus?.ca === 2 && bonus?.deslocamento === 3 && bonus?.cena === true, "consumível cria bônus de cena (+2 CA, +3 m)");
  const vida = criar("Poção de Vida", { efeitos: { c1: { tipo: "cura", recurso: "pv", formula: "2d8 + 4", quando: "uso" } } });
  a.system.attributes.hp.value = 1;
  await M.usarItem(a, vida);
  ok(a.system.attributes.hp.value >= 7, `consumível de cura recupera 2d8 + 4 (1 → ${a.system.attributes.hp.value})`);
}

console.log(falhas ? `\n${falhas} falha(s)` : "\nmecânicas ok");
process.exit(falhas ? 1 : 0);
