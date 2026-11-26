/**
 * Sistema de Habilidades, Magias e Rituais (0.9.0) e Habilidade Única Inicial (HUI).
 * Regras: EPM/habilidades.md e EPM/patch-unica-inicial.md. Esta parte é pura (testável fora do Foundry):
 * tabelas, contas de Orçamento, custo, CD, PH e horas, conferências, estágios e Ressonância da HUI,
 * o prompt do Mestre e a leitura da resposta colada.
 */

/** Raridades das habilidades. `transcendida` e `transcendidaRessonante` só existem na HUI. */
export const RARIDADES_HAB = {
  comum:    { label: "Comum",    criacao: "Trivial",       limite: null, tecnicas: 1, golpe: "1d6", golpeFixo: 4, proprio: "2d6", buff: "1d4", buffFixo: 2, v: 2, orcamento: 1, custo: 3, sustentada: 2, cd: 0, ph: 5, aprender: 3, horas: 2, dt: 10, ptAprim: 10, circulo: 0, pm: 0, ritualPo: 10 },
  incomum:  { label: "Incomum",  criacao: "Simples",       limite: null, tecnicas: 2, golpe: "2d4", golpeFixo: 5, proprio: "3d6", buff: "1d6", buffFixo: 4, v: 3, orcamento: 2, custo: 5, sustentada: 4, cd: 0, ph: 7, aprender: 4, horas: 4, dt: 13, ptAprim: 10, circulo: 1, pm: 6, ritualPo: 25 },
  rara:     { label: "Rara",     criacao: "Moderada",      limite: null, tecnicas: 3, golpe: "2d8", golpeFixo: 10, proprio: "3d10", buff: "2d4", buffFixo: 5, v: 4, orcamento: 3, custo: 10, sustentada: 6, cd: 0, ph: 10, aprender: 5, horas: 8, dt: 16, ptAprim: 15, circulo: 2, pm: 10, ritualPo: 100 },
  epica:    { label: "Épica",    criacao: "Complexa",      limite: 4, tecnicas: 4, golpe: "3d8", golpeFixo: 15, proprio: "5d10", buff: "2d8", buffFixo: 10, v: 5, orcamento: 5, custo: 15, sustentada: 8, cd: 1, ph: 20, aprender: 10, horas: 16, dt: 20, ptAprim: 20, circulo: 3, pm: 14, ritualPo: 500 },
  lendaria: { label: "Lendária", criacao: "Árdua",         limite: 3, tecnicas: 4, golpe: "2d12 + 7", golpeFixo: 20, proprio: "4d12 + 15", buff: "3d8", buffFixo: 15, v: 6, orcamento: 7, custo: 20, sustentada: 10, cd: 2, ph: 35, aprender: 18, horas: 24, dt: 24, ptAprim: 25, circulo: 4, pm: 18, ritualPo: 2000 },
  mitica:   { label: "Mítica",   criacao: "Extrema",       limite: 2, tecnicas: 5, golpe: "3d10 + 10", golpeFixo: 28, proprio: "8d10 + 10", buff: "2d12 + 7", buffFixo: 20, v: 8, orcamento: 9, custo: 25, sustentada: 12, cd: 3, ph: 42, aprender: 21, horas: 40, dt: 28, ptAprim: 30, circulo: 5, pm: 24, ritualPo: 10000, catalisador: true },
  unica:    { label: "Única",    criacao: "Transcendente", limite: 2, tecnicas: 5, golpe: "4d12 + 14", golpeFixo: 40, proprio: "10d12 + 15", buff: "3d10 + 10", buffFixo: 28, v: 10, orcamento: 12, custo: 35, sustentada: 15, cd: 4, ph: 50, aprender: null, horas: 60, dt: 32, ptAprim: 40, circulo: 6, pm: 32, ritualPo: 50000, catalisador: true, despertar: true },
  transcendida: { label: "Transcendida", hui: true, limite: null, tecnicas: 6, golpe: "5d12 + 20", golpeFixo: 52, proprio: "12d12 + 20", buff: "4d12 + 14", buffFixo: 40, v: 12, orcamento: 15, custo: 40, sustentada: 18, cd: 5 },
  transcendidaRessonante: { label: "Transcendida Ressonante", hui: true, limite: null, tecnicas: 6, golpe: "6d12 + 25", golpeFixo: 64, proprio: "14d12 + 25", buff: "5d12 + 20", buffFixo: 52, v: 14, orcamento: 17, custo: 40, sustentada: 18, cd: 6 }
};
export const ORDEM_RARIDADES = ["comum", "incomum", "rara", "epica", "lendaria", "mitica", "unica", "transcendida", "transcendidaRessonante"];
/** As 7 que o jogador escolhe no criador. */
export const RARIDADES_CRIAVEIS = ORDEM_RARIDADES.slice(0, 7);
export const ordemRaridade = r => Math.max(0, ORDEM_RARIDADES.indexOf(r));
export const maiorRaridade = lista => lista.reduce((m, r) => (ordemRaridade(r) > ordemRaridade(m) ? r : m), "comum");

export const CATEGORIAS = {
  habilidade: { label: "Habilidade", item: "feat" },
  magia: { label: "Magia", item: "spell" },
  ritual: { label: "Ritual", item: "feat" },
  unicaInicial: { label: "Única Inicial", item: "feat" }
};

export const NATUREZAS = {
  fisica:  { label: "Física",  recurso: "pe", atributos: ["forca", "destreza", "constituicao"], cd: "atributo", pericias: ["luta", "pontaria", "atletismo", "acrobacia"], afinidade: "combatente" },
  mistica: { label: "Mística", recurso: "pm", atributos: ["nucleo"], cd: "arcanismo", pericias: ["arcanismo"], afinidade: "conjurador" },
  tecnica: { label: "Técnica", recurso: "pe", atributos: ["inteligencia"], cd: "atributo", pericias: ["oficio", "tecnologia"], afinidade: "artifice" },
  mental:  { label: "Mental",  recurso: "pe", atributos: ["inteligencia", "carisma", "autocontrole", "aparencia"], cd: "atributo", pericias: ["lideranca", "persuasao", "intuicao"], afinidade: "" }
};

export const MODOS = {
  passiva:    { label: "Passiva",    acao: "passiva",   base: "Sempre ligada", efeito: r => `Um benefício de ${r.v}: +${r.v} numa perícia, teste de resistência ou iniciativa; RD ${r.v} contra um grupo de dano; +${5 * r.v} de PV máximo; +${1.5 * Math.floor(r.v / 2)} m de deslocamento; ou +${Math.floor(r.v / 3)} de CA.` },
  golpe:      { label: "Golpe",      acao: "padrao",    base: "Ação Padrão, inclui um ataque com a arma", efeito: r => `+${r.golpe} (ou +${r.golpeFixo}) de dano no ataque.` },
  disparo:    { label: "Disparo",    acao: "padrao",    base: "Ação Padrão, ataque contra a CA, 9 m", efeito: r => `${r.proprio} + atributo de dano num alvo.` },
  explosao:   { label: "Explosão",   acao: "padrao",    base: "Ação Padrão, teste de resistência (passou = metade)", efeito: r => `${r.proprio} + atributo de dano na área (compre a área).` },
  cura:       { label: "Cura",       acao: "padrao",    base: "Ação Padrão, toque", efeito: r => `Cura ${r.golpe} (ou ${r.golpeFixo}) + atributo.` },
  defesa:     { label: "Defesa",     acao: "reacao",    base: "Reação, 1x por rodada", efeito: r => `Reduz o dano de um ataque em ${r.golpe} (ou ${r.golpeFixo}) + atributo.` },
  buff:       { label: "Buff",       acao: "bonus",     base: "Ação Bônus, em si mesmo, até o fim do próximo turno", efeito: r => `+${r.buff} (ou +${r.buffFixo}) de dano por acerto, ou +${Math.floor(r.v / 2)} num número (acerto, manobra, CA ou testes).` },
  suporte:    { label: "Suporte",    acao: "bonus",     base: "Ação Bônus, um aliado a até 9 m", efeito: r => `+${Math.floor(r.v / 2)} no acerto, nos testes ou na CA, ou cura ${r.golpe} (ou ${r.golpeFixo}).` },
  movimento:  { label: "Movimento",  acao: "movimento", base: "Ação de Movimento", efeito: r => `Anda o deslocamento + ${(1.5 * r.v).toString().replace(".", ",")} m.` },
  utilidade:  { label: "Utilidade",  acao: "bonus",     base: "Ação Bônus (ou 1 minuto fora de combate)", efeito: r => `+${r.v} num teste até o início do seu próximo turno, ou uma condição informativa (ex.: Revelado).` }
};

/**
 * Modificadores: gastam Orçamento. `grupo` exclusivo (só um do grupo), `max` repetições, `min` raridade mínima,
 * `area` aumenta o custo de uso em 50%.
 */
export const MODIFICADORES = [
  { id: "alcance9", grupo: "alcance", nome: "Alcance 9 m", custo: 1 },
  { id: "alcance18", grupo: "alcance", nome: "Alcance 18 m", custo: 2 },
  { id: "alcance36", grupo: "alcance", nome: "Alcance 36 m", custo: 3 },
  { id: "area1", grupo: "area", nome: "Área nível 1 (cone 4,5 m, linha 9 m ou 1,5 m ao redor)", custo: 2, area: true },
  { id: "area2", grupo: "area", nome: "Área nível 2 (esfera 3 m, cone 9 m ou aliados a 9 m)", custo: 3, area: true },
  { id: "area3", grupo: "area", nome: "Área nível 3 (esfera 6 m ou linha 18 m)", custo: 4, area: true },
  { id: "area4", grupo: "area", nome: "Área nível 4 (esfera 9 m)", custo: 5, area: true },
  { id: "seletiva", nome: "Área seletiva", custo: 1 },
  { id: "alvoExtra", nome: "Alvo extra sem área", custo: 2, max: 2 },
  { id: "condLeve", nome: "Condição leve", custo: 1, max: 3 },
  { id: "condMedia", nome: "Condição média", custo: 2, max: 2 },
  { id: "condForte", nome: "Condição forte", custo: 4, min: "epica" },
  { id: "dominado", nome: "Dominado", custo: 6, min: "mitica" },
  { id: "critMedia", nome: "Condição média só no crítico", custo: 1 },
  { id: "critForte", nome: "Condição forte só no crítico", custo: 2 },
  { id: "rodadaExtra", nome: "Condição +1 rodada", custo: 1 },
  { id: "rodadaForte", nome: "Condição forte +1 rodada", custo: 2 },
  { id: "removerLeve", nome: "Remover condição leve", custo: 1 },
  { id: "removerMedia", nome: "Remover condição média", custo: 2 },
  { id: "removerForte", nome: "Remover condição forte", custo: 3 },
  { id: "acaoBonus", grupo: "acao", nome: "Ação: Padrão → Bônus", custo: 2 },
  { id: "acaoMovimento", grupo: "acao", nome: "Ação: Bônus → Movimento", custo: 1 },
  { id: "acaoLivre", grupo: "acao", nome: "Ação Livre", custo: 4, min: "lendaria" },
  { id: "dur3", grupo: "duracao", nome: "Duração 2 ou 3 rodadas", custo: 1 },
  { id: "dur1min", grupo: "duracao", nome: "Duração 1 minuto", custo: 2 },
  { id: "durCena", grupo: "duracao", nome: "Duração da cena", custo: 3 },
  { id: "durFora", grupo: "duracao", nome: "10 minutos ou 1 hora fora de combate", custo: 2 },
  { id: "sustentada", grupo: "duracao", nome: "Sustentada (paga por turno)", custo: 1, sustentada: true },
  { id: "tipoDano", nome: "Escolher o tipo de dano ao usar", custo: 1 },
  { id: "ignorarRd", nome: "Ignorar 5 de RD", custo: 1, max: 2 },
  { id: "condicional", nome: "Bônus condicional (Potência da raridade seguinte)", custo: 1, max: 2 },
  { id: "ignorarRes", nome: "Ignorar Resistência", custo: 3, min: "epica" },
  { id: "verdadeiro", nome: "Dano Verdadeiro", custo: 5, min: "mitica" },
  { id: "margem", nome: "Margem de crítico +1", custo: 2 },
  { id: "golpeDuplo", nome: "O Golpe vale para 2 ataques no turno", custo: 3 },
  { id: "vantagem", nome: "Vantagem", custo: 2 },
  { id: "desvantagemAlvo", nome: "Desvantagem no teste do alvo", custo: 3 },
  { id: "empurrar", nome: "Empurrar ou puxar 3 m", custo: 1, max: 2 },
  { id: "deslocamento", nome: "Deslocamento +3 m enquanto durar", custo: 1 },
  { id: "teleporte", nome: "Teletransporte de 9 m", custo: 2 },
  { id: "voo", nome: "Voo", custo: 3 },
  { id: "protegeAliado", nome: "Também protege um aliado a 1,5 m", custo: 2 },
  { id: "desvantagemAtaques", nome: "Ataques contra você com desvantagem", custo: 3 },
  { id: "invisivel", nome: "Invisível", custo: 5, min: "lendaria" },
  { id: "beneficioExtra", nome: "Benefício extra do modo", custo: 2, max: 2 },
  { id: "gatilho", nome: "Gatilho automático", custo: 3 },
  { id: "efeitoMenor", nome: "Efeito menor", custo: 1, max: 3 }
];
export const MODIFICADOR = Object.fromEntries(MODIFICADORES.map(m => [m.id, m]));

/** Restrições: devolvem Orçamento (até metade, para cima), nunca PT nem PH. */
export const RESTRICOES = [
  { id: "porCena", grupo: "freq", nome: "1x por cena ou combate", valor: 1 },
  { id: "porDia", grupo: "freq", nome: "1x por dia", valor: 2 },
  { id: "porSessao", grupo: "freq", nome: "1x por sessão", valor: 3 },
  { id: "condicaoUso", nome: "Condição de uso (ex.: só o primeiro acerto da rodada)", valor: 1 },
  { id: "acaoLenta", nome: "Ação mais lenta", valor: 1 },
  { id: "concentracao", nome: "Concentração", valor: 1 },
  { id: "terminaGatilho", nome: "Termina com um gatilho", valor: 1 },
  { id: "colateralLeve", nome: "Efeito colateral leve", valor: 1 },
  { id: "colateralPesado", nome: "Efeito colateral pesado", valor: 2 },
  { id: "sacrificio", nome: "Sacrifício (paga com 2 PV ou 1 PS por ponto de custo)", valor: 1 }
];
export const RESTRICAO = Object.fromEntries(RESTRICOES.map(r => [r.id, r]));

/* ------------------------------------------------------------ */
/*  Contas de uma técnica e de uma habilidade                   */
/* ------------------------------------------------------------ */

const n = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const qtd = (obj, id) => Math.max(0, Math.floor(n(obj?.[id] === true ? 1 : obj?.[id])));

/** Orçamento base da técnica (ritual +2). */
export function orcamentoBase(raridade, categoria = "habilidade") {
  return (RARIDADES_HAB[raridade]?.orcamento ?? 1) + (categoria === "ritual" ? 2 : 0);
}

/**
 * Conta de uma técnica: { raridade, modo, mods: {id: qtd}, restricoes: {id: qtd}, aprimorado, bonusTeste, custoProposto }.
 * `numeros` troca a raridade dos números (HUI Ressonante: números do próximo estágio, custo do atual).
 */
export function contaTecnica(t = {}, { categoria = "habilidade", numeros = null } = {}) {
  const rar = RARIDADES_HAB[t.raridade] ? t.raridade : "comum";
  const rarNum = RARIDADES_HAB[numeros] ? numeros : rar;
  const R = RARIDADES_HAB[rarNum];
  const base = orcamentoBase(rarNum, categoria);
  const erros = [];
  let gasto = 0, area = false, sustentada = false;
  const grupos = {};
  for (const [id, v] of Object.entries(t.mods ?? {})) {
    const m = MODIFICADOR[id];
    const vezes = qtd(t.mods, id);
    if (!m || !vezes) continue;
    if (m.max && vezes > m.max) erros.push(`${m.nome}: no máximo ${m.max}.`);
    if (m.min && ordemRaridade(rarNum) < ordemRaridade(m.min)) erros.push(`${m.nome}: só a partir de ${RARIDADES_HAB[m.min].label}.`);
    if (m.grupo) { if (grupos[m.grupo]) erros.push(`Só um modificador de ${m.grupo === "area" ? "área" : m.grupo === "acao" ? "ação" : m.grupo === "duracao" ? "duração" : m.grupo}.`); grupos[m.grupo] = true; }
    gasto += m.custo * Math.min(vezes, m.max ?? vezes);
    if (m.area) area = true;
    if (m.sustentada) sustentada = true;
  }
  let devolve = 0;
  const gruposR = {};
  for (const id of Object.keys(t.restricoes ?? {})) {
    const r = RESTRICAO[id];
    if (!r || !qtd(t.restricoes, id)) continue;
    if (r.grupo) { if (gruposR[r.grupo]) erros.push("Só uma restrição de frequência."); gruposR[r.grupo] = true; }
    devolve += r.valor;
  }
  const tetoRestricao = Math.ceil(base / 2);
  const restricao = Math.min(devolve, tetoRestricao);
  const aprimorado = Math.min(Math.max(0, Math.floor(n(t.aprimorado))), Math.floor(base / 2));
  const total = base + restricao + aprimorado + Math.max(0, Math.floor(n(t.bonusTeste)));
  if (gasto > total) erros.push(`Orçamento estourado: ${gasto} de ${total}.`);
  // Custo de uso pela raridade da técnica (na Ressonância continua o do estágio atual)
  const RC = RARIDADES_HAB[rar];
  const base_ = categoria === "magia" ? RC.pm : categoria === "ritual" ? RC.ritualPo : RC.custo;
  let custo = area ? Math.ceil(base_ * 1.5) : base_;
  if (t.desconto) custo = Math.ceil(custo * 0.8);
  const proposto = t.custoProposto !== undefined && t.custoProposto !== null && String(t.custoProposto).trim() !== "" ? Math.max(0, Math.floor(n(t.custoProposto))) : null;
  return {
    raridade: rar, numeros: rarNum, label: R.label, base, gasto, total, restricao, devolve, tetoRestricao, aprimorado, sobra: total - gasto,
    custo: proposto ?? custo, custoCalculado: custo, custoProposto: proposto, area, sustentada, sustentadaPorTurno: sustentada ? RC.sustentada : 0,
    potencia: { golpe: R.golpe, golpeFixo: R.golpeFixo, proprio: R.proprio, buff: R.buff, buffFixo: R.buffFixo, v: R.v },
    efeitoBase: MODOS[t.modo]?.efeito?.(R) ?? "", cdBonus: R.cd, erros
  };
}

/** Recurso pago pela natureza e categoria. */
export function recursoDe(natureza = "fisica", categoria = "habilidade") {
  if (categoria === "magia") return "pm";
  if (categoria === "ritual") return "po";
  return NATUREZAS[natureza]?.recurso ?? "pe";
}

/** Afinidade: natureza do arquétipo (Combatente Física, Conjurador Mística, Artífice Técnica). */
export function temAfinidade(natureza, arquetipos = []) {
  const a = NATUREZAS[natureza]?.afinidade;
  return !!a && arquetipos.includes(a);
}

/**
 * Conta da habilidade inteira: raridade (a maior técnica), técnicas permitidas, PH, horas, DT e erros.
 * `modo`: "criar" | "aprender" | "evoluir" | "novaTecnica". `antes` (evoluir): receita anterior.
 */
export function contaHabilidade(h = {}, { arquetipos = [], modo = "criar", antes = null } = {}) {
  const categoria = CATEGORIAS[h.categoria] ? h.categoria : "habilidade";
  const tecnicas = (h.tecnicas ?? []).filter(Boolean);
  const contas = tecnicas.map(t => contaTecnica(t, { categoria }));
  const raridade = maiorRaridade(tecnicas.map(t => t.raridade));
  const R = RARIDADES_HAB[raridade];
  const erros = [];
  if (!tecnicas.length) erros.push("Monte pelo menos uma técnica.");
  if (tecnicas.length > R.tecnicas) erros.push(`${R.label}: no máximo ${R.tecnicas} técnica(s).`);
  if (categoria === "magia" && h.natureza && h.natureza !== "mistica") erros.push("Magia é sempre Mística.");
  contas.forEach((c, i) => c.erros.forEach(e => erros.push(`${tecnicas[i].nome || `Técnica ${i + 1}`}: ${e}`)));
  const afinidade = temAfinidade(categoria === "magia" ? "mistica" : h.natureza, arquetipos);
  // Principal = a da maior raridade; as outras pagam metade
  const iPrincipal = tecnicas.findIndex(t => t.raridade === raridade);
  const custoDe = (t, i) => {
    const r = RARIDADES_HAB[t.raridade] ?? RARIDADES_HAB.comum;
    const ph = modo === "aprender" ? (r.aprender ?? 0) : r.ph;
    const horas = modo === "aprender" ? r.horas / 2 : r.horas;
    return i === iPrincipal ? { ph, horas } : { ph: Math.ceil(ph / 2), horas: horas / 2 };
  };
  let ph = 0, horas = 0;
  tecnicas.forEach((t, i) => { const c = custoDe(t, i); ph += c.ph; horas += c.horas; });
  if (modo === "evoluir" && antes) {
    const a = contaHabilidade(antes, { arquetipos, modo: "criar" });
    ph = Math.max(0, ph - a.ph); horas = Math.max(0, horas - a.horasSemAfinidade);
  }
  if (modo === "novaTecnica") {
    const nova = tecnicas[tecnicas.length - 1];
    const r = RARIDADES_HAB[nova?.raridade] ?? RARIDADES_HAB.comum;
    ph = Math.ceil(r.ph / 2); horas = r.horas / 2;
  }
  if (modo === "aprender" && raridade === "unica") erros.push("Única não pode ser aprendida.");
  const horasSemAfinidade = horas;
  if (afinidade) horas = horas * 0.75;
  const dt = R.dt - (modo === "aprender" ? 5 : 0);
  return {
    categoria, raridade, label: R.label, tecnicas: contas, ph, horas: Math.ceil(horas), horasSemAfinidade, dt, afinidade, bonusTeste: afinidade ? 2 : 0,
    catalisador: !!R.catalisador && modo !== "aprender", despertar: !!R.despertar, erros, ok: !erros.length,
    circulo: categoria === "magia" ? R.circulo : null, limite: R.limite
  };
}

/** CD de uma técnica: 10 + atributo (Mística: 10 + Arcanismo) + bônus da raridade. */
export function cdTecnica({ natureza = "fisica", atributo = 0, arcanismo = 0, raridade = "comum", numeros = null } = {}) {
  const R = RARIDADES_HAB[numeros] ?? RARIDADES_HAB[raridade] ?? RARIDADES_HAB.comum;
  return 10 + (natureza === "mistica" ? n(arcanismo) : n(atributo)) + R.cd;
}

/** Limites por raridade (habilidades e magias juntas); a HUI e o que está fora do limite não contam. */
export function contarLimites(poderes = []) {
  const usados = Object.fromEntries(RARIDADES_CRIAVEIS.map(r => [r, 0]));
  for (const p of poderes) if (!p.foraDoLimite && !p.hui && usados[p.raridade] !== undefined) usados[p.raridade]++;
  return Object.fromEntries(RARIDADES_CRIAVEIS.map(r => [r, { usados: usados[r], limite: RARIDADES_HAB[r].limite, cheio: RARIDADES_HAB[r].limite !== null && usados[r] >= RARIDADES_HAB[r].limite }]));
}

/* ------------------------------------------------------------ */
/*  Habilidade Única Inicial                                    */
/* ------------------------------------------------------------ */

export const PESOS_HUI = { leve: { label: "Leve", peso: 1 }, regular: { label: "Regular", peso: 2 }, suprema: { label: "Suprema", peso: 3 } };
export const ESTAGIOS_HUI = [
  { n: 1, romano: "I", nome: "Centelha", nivel: 1, leve: "incomum", regular: "rara", suprema: "epica", usos: 10 },
  { n: 2, romano: "II", nome: "Eco", nivel: 10, leve: "rara", regular: "epica", suprema: "lendaria", usos: 15 },
  { n: 3, romano: "III", nome: "Desperta", nivel: 20, leve: "epica", regular: "lendaria", suprema: "mitica", usos: 20 },
  { n: 4, romano: "IV", nome: "Ascensão", nivel: 30, leve: "lendaria", regular: "mitica", suprema: "unica", usos: 25 },
  { n: 5, romano: "V", nome: "Plena", nivel: 40, leve: "mitica", regular: "unica", suprema: "unica", usos: 30 },
  { n: 6, romano: "VI", nome: "Transcendente", nivel: 50, leve: "transcendida", regular: "transcendida", suprema: "transcendida", usos: 40 }
];
export const USOS_POR_COMBATE_HUI = 3;
export const ESTADOS_HUI = { pendente: "Pendente", respondida: "Aguardando o Mestre", ativa: "Ativa", nenhuma: "Sem HUI" };

export function estagioDoNivel(nivel) {
  const nv = Math.max(1, Math.floor(n(nivel) || 1));
  return [...ESTAGIOS_HUI].reverse().find(e => nv >= e.nivel) ?? ESTAGIOS_HUI[0];
}
export const estagio = num => ESTAGIOS_HUI[Math.max(1, Math.min(6, Math.floor(n(num) || 1))) - 1];

/** Limites de composição do estágio: peso 10 e 5 técnicas (12 e 6 no VI), 1 Suprema. */
export function limitesHui(numEstagio = 1) {
  return numEstagio >= 6 ? { peso: 12, tecnicas: 6, supremas: 1 } : { peso: 10, tecnicas: 5, supremas: 1 };
}

/** Confere a composição: [{ peso: "leve"|"regular"|"suprema" }]. */
export function validarHui(tecnicas = [], numEstagio = 1) {
  const lim = limitesHui(numEstagio);
  const peso = tecnicas.reduce((s, t) => s + (PESOS_HUI[t.peso]?.peso ?? 0), 0);
  const supremas = tecnicas.filter(t => t.peso === "suprema").length;
  const erros = [];
  if (!tecnicas.length) erros.push("Monte pelo menos uma técnica.");
  if (tecnicas.some(t => !PESOS_HUI[t.peso])) erros.push("Toda técnica precisa de um peso (Leve, Regular ou Suprema).");
  if (peso > lim.peso) erros.push(`Peso ${peso} passa do limite de ${lim.peso}.`);
  if (supremas > lim.supremas) erros.push(`Só ${lim.supremas} técnica Suprema.`);
  if (tecnicas.length > lim.tecnicas) erros.push(`No máximo ${lim.tecnicas} técnicas.`);
  return { ok: !erros.length, erros, peso, supremas, limite: lim, texto: `peso ${peso} de ${lim.peso} · ${supremas} de ${lim.supremas} Suprema · ${tecnicas.length} de ${lim.tecnicas} técnicas` };
}

/**
 * Raridade de uma técnica da HUI pelo peso, estágio e Ressonância.
 * Devolve { custo, numeros }: o custo de uso segue o estágio atual; os números, o próximo (Ressonante).
 * Ressonância final (VI): Suprema Transcendida Ressonante, as outras Transcendida.
 */
export function raridadeHui(peso = "leve", numEstagio = 1, { ressonante = false, final = false } = {}) {
  const e = estagio(numEstagio);
  const custo = e[peso] ?? e.leve;
  if (e.n === 6 && final) return { custo, numeros: peso === "suprema" ? "transcendidaRessonante" : "transcendida" };
  if (ressonante && e.n < 6) return { custo, numeros: estagio(e.n + 1)[peso] ?? custo };
  return { custo, numeros: custo };
}

/** Estado da HUI normalizado (flags.epm-ficha.unicaInicial). */
export function lerHui(u = {}, nivelTotal = 1) {
  const estado = ESTADOS_HUI[u.estado] ? u.estado : "pendente";
  const est = estagio(u.estagio || estagioDoNivel(nivelTotal).n);
  const usos = Math.max(0, Math.floor(n(u.usos)));
  const prox = est.n < 6 ? estagio(est.n + 1) : null;
  return {
    estado, estadoLabel: ESTADOS_HUI[estado], respostas: u.respostas ?? {}, estagio: est.n, estagioInfo: est, usos, meta: est.usos,
    ressonante: !!u.ressonante, final: !!u.final, itemId: u.itemId ?? "", historico: Array.isArray(u.historico) ? u.historico : [],
    usosCombate: u.usosCombate ?? {}, proximo: prox, pct: Math.min(100, Math.round((usos / est.usos) * 100)),
    selo: `Única Inicial · Estágio ${est.romano} · ${est.nome}${u.final ? " · Ressonância final" : u.ressonante ? " · Ressonante" : ""}`
  };
}

/**
 * Conta 1 uso de técnica ativa (até 3 por combate). Devolve as mudanças { usos, usosCombate, ressonante, final, ressoou }.
 * `combateId` vazio = fora de combate (só o Mestre ajusta à mão).
 */
export function registrarUsoHui(u = {}, { combateId = "", nivelTotal = 1, passiva = false } = {}) {
  const h = lerHui(u, nivelTotal);
  if (h.estado !== "ativa" || passiva) return { contou: false, motivo: passiva ? "passiva" : "inativa" };
  const noCombate = combateId ? Math.floor(n(h.usosCombate?.[combateId])) : 0;
  if (combateId && noCombate >= USOS_POR_COMBATE_HUI) return { contou: false, motivo: "limite" };
  const usos = h.usos + 1;
  const out = { contou: true, usos, usosCombate: combateId ? { [combateId]: noCombate + 1 } : {}, ressonante: h.ressonante, final: h.final, ressoou: false };
  if (usos >= h.meta) {
    if (h.estagio === 6 && !h.final) { out.final = true; out.ressoou = true; }
    else if (h.estagio < 6 && !h.ressonante) { out.ressonante = true; out.ressoou = true; }
  }
  return out;
}

/** Mudanças ao trocar de estágio pelo nível: zera usos e a Ressonância (a final do VI fica). */
export function mudarEstagioHui(u = {}, nivelTotal = 1) {
  const atual = Math.floor(n(u.estagio)) || 1;
  const novo = estagioDoNivel(nivelTotal).n;
  if (novo === atual) return null;
  return { estagio: novo, usos: 0, ressonante: false, final: novo === 6 ? !!u.final && atual === 6 : false, subiu: novo > atual, de: atual };
}

/* ---------------- Questionário e prompt ---------------- */

export const PERGUNTAS_HUI = [
  { id: "q1", texto: "Diante de um grande perigo, o que faria?", significado: "Como o personagem reage aos problemas",
    opcoes: ["Resolveria diretamente.", "Esperaria para entender melhor a situação.", "Protegeria pessoas importantes.", "Colocaria a situação a meu favor.", "Tentaria entender a situação."] },
  { id: "q2", texto: "Escolha uma frase.", significado: "A motivação emocional",
    opcoes: ["\"Não vou aceitar perder.\"", "\"Não vou deixar isso acontecer novamente.\"", "\"Quero descobrir a verdade.\"", "\"Quero fazer as coisas do meu próprio jeito.\"", "\"Preciso ir além dos meus limites.\"", "\"Quero mudar as coisas.\""] },
  { id: "q3", texto: "O que mais combina com o personagem?", significado: "A principal característica",
    opcoes: ["Força.", "Liberdade.", "Segurança.", "Conhecimento.", "Controle.", "Adaptação."] },
  { id: "q4", texto: "Escolha uma situação.", significado: "Onde ele quer mostrar o seu potencial",
    opcoes: ["Sozinho contra vários inimigos.", "Uma pessoa importante está em perigo.", "Enfrentar alguém muito mais poderoso.", "Descobrir algo desconhecido.", "Ser impedido de fazer algo que deseja.", "Ter tempo para se preparar."] },
  { id: "q5", texto: "O que sacrificaria para conseguir o que deseja?", significado: "O preço que aceita pagar",
    opcoes: ["Força.", "Tempo.", "Energia.", "Liberdade.", "Arriscaria tudo.", "Não sacrificaria nada."] },
  { id: "q6", texto: "Complete: \"Acima de qualquer coisa, meu personagem deseja __________.\"", significado: "O tema e a identidade da habilidade (a resposta mais importante)", aberta: true }
];
const LETRAS = "ABCDEF";

/** Respostas em texto ("A) Resolveria diretamente."). */
export function textoRespostas(respostas = {}) {
  return PERGUNTAS_HUI.map((p, i) => {
    const r = respostas[p.id];
    if (p.aberta) return `${i + 1}) ${p.texto} ${String(r ?? "").trim() || "(sem resposta)"}`;
    const k = LETRAS.indexOf(String(r ?? "").toUpperCase());
    return `${i + 1}) ${p.texto} ${k >= 0 ? `${LETRAS[k]}) ${p.opcoes[k]}` : "(sem resposta)"}`;
  });
}
export const respostasCompletas = (r = {}) => PERGUNTAS_HUI.every(p => p.aberta ? String(r[p.id] ?? "").trim() : LETRAS.slice(0, p.opcoes.length).includes(String(r[p.id] ?? "").toUpperCase()));

/** Prompt da seção 7 do patch, preenchido. `unicas`: [{ nome, tema, efeitos }]. */
export function promptHui({ respostas = {}, nome = "", raca = "", arquetipo = "", atributos = "", unicas = [] } = {}) {
  const lista = unicas.length ? unicas.map(u => `- ${u.nome}${u.tema ? ` (tema: ${u.tema})` : ""}${u.efeitos ? `: ${u.efeitos}` : ""}`).join("\n") : "- (nenhuma registrada no mundo)";
  return `Crie uma Habilidade Única Inicial para o RPG Escolhidos pelo Multiverso utilizando as respostas do questionário abaixo.

Interprete todas as respostas em conjunto. A resposta aberta define principalmente o tema e a identidade da habilidade; as demais ajudam a determinar sua manifestação e mecânica.

Respostas:
${textoRespostas(respostas).join("\n")}
Personagem: ${nome || "(sem nome)"}, ${raca || "(raça)"}, ${arquetipo || "(arquétipo)"}, ${atributos || "(atributos principais)"}

A habilidade tem composição livre, com até 5 técnicas e peso total até 10. Cada técnica é:
- Leve (peso 1, raridade Incomum, cerca de 5 PE);
- Regular (peso 2, raridade Rara, cerca de 10 PE);
- Suprema (peso 3, raridade Épica, cerca de 15 PE, normalmente 1x por combate; no máximo 1).
Um efeito passivo é opcional e conta como Leve ou Regular. Use os números do Estágio I das regras de habilidades do EPM (Potência, V e Orçamento de cada raridade): Incomum 2d4 (5), V 3, Orçamento 2; Rara 2d8 (10), V 4, Orçamento 3; Épica 3d8 (15), V 5, Orçamento 5.

Regras obrigatórias:
- Nenhum efeito pode repetir outro da própria habilidade.
- Nenhum efeito pode ser igual ou minimamente semelhante às outras Habilidades Únicas existentes (lista abaixo).
- Não transforme regras básicas do sistema em poderes.
- Não crie habilidades excessivamente situacionais.
- Todos os efeitos devem ter funções diferentes.
- A habilidade precisa ter utilidade em situações comuns.
- Mantenha o mesmo patamar de poder das demais.

Utilize custos em PE proporcionais ao efeito, considerando ações, alcance, duração, frequência e impacto. O tema não precisa ser interpretado literalmente: procure mecânicas criativas que representem o personagem.

Únicas que já existem no mundo:
${lista}

Antes de entregar, revise todas as habilidades existentes para evitar repetições. Se encontrar alguma semelhança, refaça o efeito. Entregue a habilidade pronta para a ficha, exatamente neste formato (uma linha por campo; repita TÉCNICA e EFEITO para cada técnica), e depois uma avaliação breve de balanceamento:

NOME: (nome da habilidade)
TIPO: (ex.: Ofensiva / Suporte)
TEMA: (tema em poucas palavras)
DESCRIÇÃO: (um parágrafo)
TÉCNICA: (nome) | (Leve, Regular ou Suprema) | (modo: Golpe, Disparo, Explosão, Cura, Defesa, Buff, Suporte, Movimento, Utilidade ou Passiva) | (custo, ex.: 10 PE) | (ação) | (duração) | (uso, ex.: 1x por combate)
EFEITO: (o efeito completo da técnica)`;
}

const MODO_POR_NOME = Object.fromEntries(Object.entries(MODOS).map(([id, m]) => [m.label.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(), id]));
const semAcento = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Lê a resposta colada (o formato do prompt, ou JSON). Devolve { nome, tipo, tema, descricao, tecnicas[] } ou null. */
export function lerRespostaHui(texto = "") {
  const bruto = String(texto ?? "").trim();
  if (!bruto) return null;
  const jsonIni = bruto.indexOf("{");
  if (jsonIni >= 0 && /"tecnicas"\s*:/.test(bruto)) {
    try {
      const j = JSON.parse(bruto.slice(jsonIni, bruto.lastIndexOf("}") + 1));
      return normalizarHuiLida({ nome: j.nome, tipo: j.tipo, tema: j.tema, descricao: j.descricao, tecnicas: j.tecnicas ?? [] });
    } catch { /* segue para o formato de linhas */ }
  }
  const out = { nome: "", tipo: "", tema: "", descricao: "", tecnicas: [] };
  let atual = null;
  for (const linha of bruto.split(/\r?\n/)) {
    const m = linha.replace(/^[\s*#>-]+/, "").replace(/\*\*/g, "").match(/^([A-Za-zÀ-ÿ]+)\s*:\s*(.*)$/);
    if (!m) { if (atual && atual.efeito && linha.trim()) atual.efeito += `\n${linha.trim()}`; else if (!atual && out.descricao && linha.trim() && !/^avalia/i.test(semAcento(linha))) out.descricao += ` ${linha.trim()}`; continue; }
    const chave = semAcento(m[1]);
    const valor = m[2].trim();
    if (chave === "nome") out.nome = valor;
    else if (chave === "tipo") out.tipo = valor;
    else if (chave === "tema") out.tema = valor;
    else if (chave === "descricao") out.descricao = valor;
    else if (chave === "tecnica") {
      const [nome, peso, modo, custo, acao, duracao, uso] = valor.split("|").map(x => x.trim());
      atual = { nome, peso, modo, custo, acao, duracao, uso, efeito: "" };
      out.tecnicas.push(atual);
    } else if (chave === "efeito" && atual) atual.efeito = valor;
    else if (/^avalia/.test(chave)) atual = null;
  }
  return out.nome || out.tecnicas.length ? normalizarHuiLida(out) : null;
}

function normalizarHuiLida(h) {
  const peso = p => { const t = semAcento(p); return t.startsWith("sup") ? "suprema" : t.startsWith("reg") ? "regular" : t.startsWith("lev") ? "leve" : ""; };
  return {
    nome: String(h.nome ?? "").trim(), tipo: String(h.tipo ?? "").trim(), tema: String(h.tema ?? "").trim(), descricao: String(h.descricao ?? "").trim(),
    tecnicas: (h.tecnicas ?? []).map(t => ({
      nome: String(t.nome ?? "").trim(), peso: peso(t.peso), modo: MODO_POR_NOME[semAcento(t.modo)] ?? (semAcento(t.modo).startsWith("passiv") ? "passiva" : "utilidade"),
      custoTexto: String(t.custo ?? "").trim(), custoProposto: Number(String(t.custo ?? "").match(/\d+/)?.[0]) || null,
      acao: String(t.acao ?? "").trim(), duracao: String(t.duracao ?? "").trim(), uso: String(t.uso ?? "").trim(), efeito: String(t.efeito ?? "").trim()
    }))
  };
}

/** Nomes ou temas iguais aos de outras Únicas do mundo (aviso do criador). */
export function repetidasHui(h = {}, unicas = []) {
  const nomes = new Set(unicas.flatMap(u => [u.nome, ...(u.tecnicas ?? [])]).map(semAcento).filter(Boolean));
  const temas = new Set(unicas.map(u => semAcento(u.tema)).filter(Boolean));
  const out = [];
  if (nomes.has(semAcento(h.nome))) out.push(`O nome "${h.nome}" já é de outra Única.`);
  if (h.tema && temas.has(semAcento(h.tema))) out.push(`O tema "${h.tema}" já é de outra Única.`);
  for (const t of h.tecnicas ?? []) if (t.nome && nomes.has(semAcento(t.nome))) out.push(`A técnica "${t.nome}" tem o nome de outra Única.`);
  return out;
}
