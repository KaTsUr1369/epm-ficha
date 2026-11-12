/**
 * Regras do Notion adicionadas na 0.6.0 (só dados e contas puras, sem Foundry):
 * atributos acima de 4, teto de atributo por nível, Vida/Mana/Estamina por arquétipo, votos, pactos,
 * nomeação de criaturas, hierarquia militar, idade (regra opcional), Noção de Vitalidade e as tabelas
 * das classes completas (Bárbaro, Guardião e Lutador).
 */

const degrau = (lista, valor) => {
  let achou = null;
  for (const d of lista) if (valor >= d[0]) achou = d;
  return achou;
};

/* -------------------------------------------- */
/*  Atributos acima de 4                        */
/* -------------------------------------------- */

/** [mínimo, valor]: o maior degrau alcançado vale. */
export const ATRIBUTOS_ACIMA_4 = {
  destreza:     { label: "Deslocamento", unidade: "m", tabela: [[5, 1.5], [7, 3], [9, 4.5], [11, 6], [13, 9], [15, 12]] },
  forca:        { label: "Dano extra", tabela: [[5, ["1d4", 2]], [7, ["1d6", 3]], [9, ["1d8", 4]], [11, ["1d10", 5]], [12, ["2d6", 6]], [13, ["3d6", 8]], [14, ["4d6", 12]], [15, ["10d6", 25]]] },
  constituicao: { label: "RD", tabela: [[5, 1], [7, 2], [9, 3], [11, 4], [12, 5], [13, 6], [14, 10], [15, 15]] },
  carisma:      { label: "Idiomas extras", tabela: [[5, 1], [7, 2], [9, 3], [11, 4], [13, 5], [15, 7]] },
  inteligencia: { label: "Pontos de Treinamento", tabela: [[5, 1], [6, 2], [7, 3], [8, 4], [9, 5], [10, 5], [11, 6], [12, 7], [13, 8], [14, 9], [15, 10]] },
  autocontrole: { label: "RD de Sanidade", tabela: [[5, 1], [8, 2], [11, 3], [14, 5]] },
  nucleo:       { label: "Magias (rascunho do Notion)", tabela: [[5, 4], [7, 6], [9, 8], [11, 11], [13, 14], [15, 18]] }
};

/** Rótulo de cada bônus (para a troca: "Força dá o bônus de Constituição" = RD). */
export const ROTULOS_BONUS_ALTO = {
  destreza: "Deslocamento (Destreza)", forca: "Dano extra (Força)", constituicao: "RD (Constituição)", carisma: "Idiomas extras (Carisma)",
  inteligencia: "PT e horas de treino (Inteligência)", autocontrole: "RD de Sanidade (Autocontrole)", nucleo: "Magias (Núcleo)", nenhum: "Nenhum"
};

/**
 * Bônus de atributos acima de 4 (Notion). `totais` = { forca: 6, ... } (valor final do atributo).
 * `trocas` = { atributo: bônus }: o atributo passa a dar o bônus de outro (com o valor dele). Sem troca, cada um dá o próprio.
 * Se dois atributos derem o mesmo bônus, vale o maior (não soma).
 * Aparência 6+ soma o valor dela nas perícias que usam Carisma (Lábia e as outras).
 */
export function bonusAtributosAltos(totais = {}, trocas = {}) {
  const v = id => Math.floor(Number(totais[id]) || 0);
  const fontes = {};
  const pega = bonus => {
    let melhor = null;
    for (const atr of Object.keys(ATRIBUTOS_ACIMA_4)) {
      const destino = ATRIBUTOS_ACIMA_4[trocas?.[atr]] || trocas?.[atr] === "nenhum" ? trocas[atr] : atr;
      if (destino !== bonus) continue;
      const d = degrau(ATRIBUTOS_ACIMA_4[bonus].tabela, v(atr));
      if (!d) continue;
      const peso = Array.isArray(d[1]) ? d[1][1] : d[1];
      if (!melhor || peso > melhor.peso) melhor = { valor: d[1], peso, atr, nivel: v(atr) };
    }
    if (melhor) fontes[bonus] = melhor.atr;
    return melhor;
  };
  const forca = pega("forca")?.valor;
  const pt = pega("inteligencia");
  const intel = pt?.nivel ?? 0;
  return {
    deslocamento: pega("destreza")?.valor ?? 0,
    danoDesarmado: forca ? forca[0] : "",
    danoArmado: forca ? forca[1] : 0,
    rd: pega("constituicao")?.valor ?? 0,
    idiomasExtras: pega("carisma")?.valor ?? 0,
    ptTreino: pt?.valor ?? 0,
    horasTreino: intel >= 15 ? 3 : intel >= 10 ? 5 : 6,
    phExtra: intel >= 15 ? 2 : 0,
    rdSanidade: pega("autocontrole")?.valor ?? 0,
    magiasNucleo: pega("nucleo")?.valor ?? 0,
    aparenciaCarisma: v("aparencia") >= 6 ? v("aparencia") : 0,
    fontes
  };
}

/* -------------------------------------------- */
/*  Teto de atributo por nível                  */
/* -------------------------------------------- */

/** Do 1º ao 20º nível de arquétipo: 8; 21º: 10; 31º: 12; 41º: 15. Habilidades, treinos e talentos: até +2 no total. */
export const TETO_ATRIBUTO = [[1, 8], [21, 10], [31, 12], [41, 15]];
export const EXTRAS_ATRIBUTO_MAX = 2;
export const tetoAtributo = nivelArquetipo => degrau(TETO_ATRIBUTO, Math.max(1, Math.floor(Number(nivelArquetipo) || 1)))?.[1] ?? 8;

/* -------------------------------------------- */
/*  Vida, Mana e Estamina por arquétipo         */
/* -------------------------------------------- */

/** inicial e dado por nível acima do 1º (média entre parênteses no Notion). */
export const RECURSOS_ARQUETIPO = {
  combatente: { pv: { inicial: 20, dado: "1d10", media: 6 }, pe: { inicial: 16, dado: "1d8", media: 5 }, pm: { inicial: 12, dado: "1d6", media: 4 } },
  conjurador: { pv: { inicial: 12, dado: "1d6", media: 4 }, pe: { inicial: 12, dado: "1d6", media: 4 }, pm: { inicial: 24, dado: "1d12", media: 7 } },
  artifice:   { pv: { inicial: 12, dado: "1d6", media: 4 }, pe: { inicial: 20, dado: "1d10", media: 6 }, pm: { inicial: 16, dado: "1d8", media: 5 } }
};

/** Atributo padrão somado em cada recurso (escolhível na ficha). */
export const ATRIBUTO_RECURSO_PADRAO = { pv: "constituicao", pm: "nucleo", pe: "constituicao" };

/** Id do arquétipo a partir do texto livre da ficha ("Combatente", "artífice"…). */
export function idArquetipo(texto) {
  const t = String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (t.includes("combat")) return "combatente";
  if (t.includes("conjur")) return "conjurador";
  if (t.includes("artif")) return "artifice";
  return "";
}

/**
 * Máximo de um recurso pela regra da 0.6.0:
 *   inicial = raça + inicial do 1º arquétipo + atributo
 *   cada nível a mais (nos dois arquétipos) = dado rolado (ou média) + atributo
 * `niveis` = [{ arquetipo: "combatente", nivel: 5 }, { arquetipo: "conjurador", nivel: 2 }]
 * `rolagens` = { combatente: [8, 3, …], … } (níveis 2+ de cada arquétipo; falta = média)
 */
export function maximoRecurso(recurso, { raca = 0, atributo = 0, niveis = [], rolagens = {}, usarMedia = true, extraFixo = 0, extraPorNivel = 0 } = {}) {
  const partes = [];
  let total = Number(raca) || 0;
  partes.push({ rotulo: "Raça", valor: total });
  const validos = niveis.filter(n => RECURSOS_ARQUETIPO[n.arquetipo] && n.nivel > 0);
  if (!validos.length) {
    total += atributo;
    partes.push({ rotulo: "Atributo", valor: atributo });
    return { total: total + extraFixo, partes };
  }
  const primeiro = validos[0];
  const ini = RECURSOS_ARQUETIPO[primeiro.arquetipo][recurso].inicial;
  total += ini + atributo;
  partes.push({ rotulo: `Inicial (${primeiro.arquetipo})`, valor: ini }, { rotulo: "Atributo (nível 1)", valor: atributo });
  let niveisExtras = 0;
  for (const n of validos) {
    const cfg = RECURSOS_ARQUETIPO[n.arquetipo][recurso];
    const extras = n === primeiro ? n.nivel - 1 : n.nivel;
    const rol = rolagens?.[n.arquetipo] ?? [];
    let soma = 0;
    for (let i = 0; i < extras; i++) {
      const r = Number(rol[n === primeiro ? i : i]);
      soma += !usarMedia && r > 0 ? r : cfg.media;
    }
    if (extras > 0) {
      total += soma + extras * atributo;
      partes.push({ rotulo: `${extras} nível(is) de ${n.arquetipo} (${usarMedia ? "média" : "rolagem"} + atributo)`, valor: soma + extras * atributo });
      niveisExtras += extras;
    }
  }
  if (extraFixo) { total += extraFixo; partes.push({ rotulo: "Outros (raça, únicas)", valor: extraFixo }); }
  if (extraPorNivel) { const v = extraPorNivel * (niveisExtras + 1); total += v; partes.push({ rotulo: "Por nível (raça)", valor: v }); }
  return { total, partes };
}

/* -------------------------------------------- */
/*  Votos e Pactos                              */
/* -------------------------------------------- */

export const TIPOS_VOTO = {
  ativavel: { label: "Ativável", dica: "O jogador escolhe quando usar; o custo é pago na hora." },
  permanente: { label: "Permanente", dica: "Acontece uma vez ou fica ativo para sempre; o custo também é permanente ou muito alto." },
  passivo: { label: "Passivo", dica: "Não conta no limite de votos (ex.: troca de bônus de atributo acima de 4). Só vale com a aprovação do Mestre." }
};
/** Até o nível 20: 3 votos; depois +1 a cada 10 níveis (30: 4, 40: 5, 50: 6). */
export const limiteVotos = nivel => {
  const n = Math.floor(Number(nivel) || 1);
  return n < 30 ? 3 : 3 + Math.floor((n - 20) / 10);
};

export const TIPOS_PACTO = {
  marcados: { label: "Entre Marcados", limite: 4 },
  npc:      { label: "Marcado × NPC", limite: 4 },
  divindade:{ label: "Marcado × Divindade", limite: 3 }
};
export const PENALIDADE_PACTO = "Perde metade da Vida máxima, −20 pontos nos atributos totais e fica com as habilidades bloqueadas pelo tempo que a outra parte definir.";

/* -------------------------------------------- */
/*  Nomeação de criaturas e hierarquia          */
/* -------------------------------------------- */

/** [id, rótulo, nível mín., nível máx., PM, Exaustão, custo de Liderança] */
export const FAIXAS_NOMEACAO = [
  ["fraca", "Fraca", 1, 5, 10, 1, 1],
  ["comum", "Comum", 6, 10, 20, 2, 1],
  ["forte", "Forte", 11, 15, 35, 3, 2],
  ["elite", "Elite", 16, 20, 50, 4, 3],
  ["lendaria", "Lendária", 21, 25, 70, 5, 4],
  ["mitica", "Mítica", 26, 30, 100, 6, 5],
  ["suprema", "Suprema", 31, 40, 130, 6, 5],
  ["divina", "Divina", 41, 50, 160, 6, 5]
].map(([id, label, de, ate, pm, exaustao, lideranca]) => ({ id, label, de, ate, pm, exaustao, lideranca }));

export const faixaPorNivel = nivel => FAIXAS_NOMEACAO.find(f => nivel >= f.de && nivel <= f.ate) ?? FAIXAS_NOMEACAO.at(-1);

/**
 * Custo de nomear uma criatura (ou várias iguais, até 5 por ritual: soma a mana, +1 exaustão no fim).
 * Jogador acima do nível da criatura: −2 PM por nível e −1 exaustão a cada 3 níveis (mín. 5 PM e 1 exaustão).
 * Sem mana: cada 10 PM que faltam viram +1 exaustão (sobrecarga).
 */
export function custoNomeacao({ nivelCriatura = 1, nivelJogador = 1, quantidade = 1, pmAtual = Infinity } = {}) {
  const faixa = faixaPorNivel(Math.max(1, nivelCriatura));
  const acima = Math.max(0, nivelJogador - nivelCriatura);
  const pmUm = Math.max(5, faixa.pm - 2 * acima);
  const exUm = Math.max(1, faixa.exaustao - Math.floor(acima / 3));
  const qtd = Math.min(5, Math.max(1, Math.floor(quantidade)));
  const pm = pmUm * qtd;
  let exaustao = exUm + (qtd > 1 ? 1 : 0);
  const falta = Math.max(0, pm - (Number.isFinite(pmAtual) ? pmAtual : pm));
  const sobrecarga = Math.ceil(falta / 10);
  exaustao += sobrecarga;
  return { faixa, pm, pmPago: pm - falta, falta, exaustao, sobrecarga, quantidade: qtd };
}

/** 5 criaturas a cada 5 níveis do jogador; Liderança: 5 + 5 a cada 5 níveis; 3 ativas em combate. */
export const limiteNomeadas = nivel => 5 * Math.max(1, Math.ceil(Math.max(1, nivel) / 5));
export const pontosLideranca = nivel => 5 + 5 * Math.floor(Math.max(0, nivel) / 5);
export const ATIVAS_EM_COMBATE = 3;

export const PATENTES = [
  { id: "soldado",   label: "Soldado",          comanda: "—",                       bonus: "Nenhum individual; recebe os bônus dos superiores." },
  { id: "capitao",   label: "Capitão",          comanda: "até 5 soldados",          bonus: "Soldados sob comando: +1 em ataques e +1 em testes de resistência." },
  { id: "tenente",   label: "Tenente",          comanda: "até 2 Capitães (10)",     bonus: "Todas as unidades abaixo: +1 de dano e +1 de deslocamento." },
  { id: "comandante",label: "Comandante",       comanda: "até 2 Tenentes (20)",     bonus: "Todas as unidades: +2 em testes de moral; ignoram penalidades leves (medo, pressão)." },
  { id: "general",   label: "General",          comanda: "até 2 Comandantes (40)",  bonus: "Todas as unidades: +2 de ataque e +2 de defesa." },
  { id: "supremo",   label: "General Supremo",  comanda: "todo o exército",         bonus: "Todas as criaturas: +2 em todos os atributos principais e vantagem em testes de grupo." }
];
export const REGRAS_HIERARQUIA = [
  "Se um líder cair, as unidades abaixo perdem os bônus e sofrem −1 em testes por 1 turno.",
  "Sem líder, as criaturas fazem teste de Autocontrole; se falharem, ficam desorganizadas ou fogem.",
  "Combate em massa: 5 criaturas = 1 unidade, que ataca junto e tem vida compartilhada."
];

/* -------------------------------------------- */
/*  Idade (regra opcional)                      */
/* -------------------------------------------- */

export const FAIXAS_IDADE = [
  { id: "crianca", label: "Criança", humano: "9 a 12", efeitos: ["−1 em Força, Constituição e Núcleo (máximo 2 em cada até crescer ou treinar).", "−3 m de deslocamento e tamanho Pequeno.", "Só 1 habilidade de raça até crescer ou treinar."] },
  { id: "adolescente", label: "Adolescente", humano: "13 a 17", efeitos: ["−1 em Força e Constituição (sem o teto de 2).", "+15 pontos de perícia iniciais."] },
  { id: "jovem", label: "Jovem", humano: "18 a 27", efeitos: ["Sem vantagens nem desvantagens."] },
  { id: "adulto", label: "Adulto", humano: "28 a 50", efeitos: ["Vivido: +1 no poder de classe (Arma Favorita: +1 estilo; Magia: +1 espaço; Criação: +1 espaço).", "Escolha 1 desvantagem de idade."] },
  { id: "maduro", label: "Maduro", humano: "51 a 80", efeitos: ["Começa 1 nível à frente e recebe +1 de Núcleo extra (fora do limite).", "Escolha 1 desvantagem de idade."] },
  { id: "idoso", label: "Idoso", humano: "81 a 120", efeitos: ["Nos AS não pode aumentar atributos físicos.", "Começa 2 níveis à frente e recebe +2 de Núcleo extra (fora do limite).", "Escolha 1 desvantagem de idade."] }
];
/** Faixas por raça (Notion). Anjos e Autômatos escolhem a faixa que quiserem. */
export const IDADE_POR_RACA = {
  humano: ["9-12", "13-17", "18-27", "28-50", "51-80", "81-120"],
  anao: ["10-25", "27-35", "37-56", "58-104", "106-166", "168-250"],
  demonio: ["10-50", "51-100", "101-1000", "1001-2100", "2125-3333", "3375-5000"],
  elfo: ["20-200", "201-283", "300-450", "451-833", "850-1333", "1334-2000"],
  goblin: ["6-8", "9-11", "12-18", "19-33", "34-53", "54-80"],
  "meio-dragao": ["50-150", "151-212", "225-349", "350-625", "630-1000", "1001-1500"],
  "meio-gigante": ["22-30", "31-42", "45-69", "70-125", "127-200", "202-300"],
  mutante: ["11-15", "16-21", "22-33", "34-62", "63-100", "101-150"]
};
/** Faixa de idade pela idade em anos e pela raça (padrão: tabela humana). */
export function faixaIdade(anos, racaId = "humano") {
  // "1.200 anos", "1 200" e "1200" valem 1200 (antes o ponto cortava e virava 1 = Criança)
  const bruto = String(anos ?? "").match(/\d[\d.\s]*/)?.[0] ?? "";
  const n = Number(bruto.replace(/[.\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  const tabela = IDADE_POR_RACA[racaId];
  if (!tabela) return null;
  let idx = -1;
  tabela.forEach((f, i) => { const de = Number(f.split("-")[0]); if (n >= de) idx = i; });
  return idx >= 0 ? FAIXAS_IDADE[idx] : FAIXAS_IDADE[0];
}

/* -------------------------------------------- */
/*  Noção de Vitalidade                         */
/* -------------------------------------------- */

/** 5 PE: o Mestre diz a vida dos alvos em palavras (Notion: 100% Intocado, 75% Ferido, 50% Machucado, 25% No Limite). */
export function nocaoVitalidade(atual, max) {
  const p = max > 0 ? (atual / max) * 100 : 0;
  if (p >= 100) return "Intocado";
  if (p > 50) return "Ferido";
  if (p > 25) return "Machucado";
  return "No Limite";
}

/* -------------------------------------------- */
/*  Classes completas (Notion)                  */
/* -------------------------------------------- */

export const CLASSES_NOTION = {
  barbaro: {
    nome: "Bárbaro", arquetipo: "combatente", descricao: "Combatente da Fúria: dano extra, RD e críticos brutais. Pode seguir o Caminho do Escudo.",
    caminhos: { escudo: "Caminho do Escudo" },
    habilidades: [
      [3, "Fúria", "Entra em Fúria por 1 cena, 2 vezes por descanso: +1 de dano e RD 3 (+2 e RD 6 no 12, +3 e RD 9 no 21, +5 e RD 12 no 30, +10 e RD 15 no 39, +15 e RD 20 no 48). O botão fica no painel da classe, na aba Combate."],
      [6, "Proteção de Bárbaro", "Escolhe 1 proteção (mais 1 no 24 e no 42): Proteção sem Armadura, Proteção Divina, Escudo Humano, Pele de Espinhos, Escudo Maior ou Escudo de Espinho. A escolha fica no painel da classe, na aba Combate."],
      [9, "Crítico Brutal", "+1 no multiplicador de crítico (máx. 4×). Sobe com o nível: margem 19 no 15 e 18 no 33, até +5× (máx. 10×) no 45."],
      [3, "Mestre dos Escudos", "Caminho do Escudo: +1 nos bônus de todo escudo que estiver segurando.", { caminho: "escudo" }],
      [18, "Avanço", "Caminho do Escudo: com escudo, a Disparada dá +5 de CA e causa 5 + Força de dano Contundente a quem você passar rente ou acertar numa Investida.", { caminho: "escudo" }],
      [33, "Escudo Lanceiro", "Caminho do Escudo: ganha o Escudo de Espinho da Proteção de Bárbaro, com +1 dado durante o Avanço; se já tinha, ele causa +2d8 em vez de +1d6.", { caminho: "escudo" }],
      [48, "Escudo Inquebrável", "Caminho do Escudo: ao cair a 0 PV, faz um teste de Constituição DT 10 para ficar de pé com 5 PV. A DT sobe 5 a cada uso e volta ao normal no descanso longo.", { caminho: "escudo" }]
    ],
    furia: { usos: 2, duracao: "1 cena", tabela: [[3, 1, 3], [12, 2, 6], [21, 3, 9], [30, 5, 12], [39, 10, 15], [48, 15, 20]] },
    protecao: { niveis: [6, 24, 42], opcoes: [
      ["semArmadura", "Proteção sem Armadura", "Soma a Constituição na CA, na Defesa e na Esquiva."],
      ["divina", "Proteção Divina", "Soma a Aura (Núcleo) na CA, na Defesa e na Esquiva."],
      ["escudoHumano", "Escudo Humano", "Ao lado de um aliado alvo de ataque, pode se colocar na frente e receber o ataque."],
      ["espinhos", "Pele de Espinhos", "Ao receber ataque corpo a corpo, causa 1d4 + Constituição de dano no atacante."],
      ["escudoMaior", "Escudo Maior", "Com escudo: metade do dano de habilidades que pedem teste; nada se passar."],
      ["escudoEspinho", "Escudo de Espinho", "Com escudo: ataque desarmado corpo a corpo com +1d6 Perfurante."]
    ] },
    critico: [[9, 1, 20, 4], [15, 1, 19, 5], [18, 2, 19, 6], [27, 3, 19, 7], [33, 3, 18, 8], [36, 4, 18, 9], [45, 5, 18, 10]]
  },
  guardiao: {
    nome: "Guardião", arquetipo: "combatente", descricao: "Protege os aliados: armaduras pesadas sem desvantagem, Proteção com a Reação e Corpo de Pedra.",
    habilidades: [
      [3, "Armadurado", "Proficiência em Armaduras Médias e Pesadas e não sofre as desvantagens das Armaduras Pesadas."],
      [6, "Proteção", "Reação: entra na frente de um ataque contra um aliado a até 6 m e recebe RD 1d3 + Constituição + 1 (2d4 + 2 no 12, 3d6 + 3 no 18, 4d8 + 4 no 24, 5d10 + 5 no 36, 10d12 + 10 no 48). Se zerar o dano, recupera 2 PE (5 PE no 30; a partir do 42 não precisa zerar)."],
      [9, "Corpo de Pedra", "RD 3 contra todo dano (6 no 15, 9 no 21, 12 no 27, 15 no 33, 20 no 39)."],
      [45, "Resistir à Morte", "Ao cair a 0 PV, faz um teste de Constituição DT 10 para ficar de pé com 5 PV. A DT sobe 5 a cada uso e volta ao normal no descanso longo."]
    ],
    corpoDePedra: [[9, 3], [15, 6], [21, 9], [27, 12], [33, 15], [39, 20]],
    protecao: [[6, "1d3 + @atr.constituicao + 1"], [12, "2d4 + @atr.constituicao + 2"], [18, "3d6 + @atr.constituicao + 3"], [24, "4d8 + @atr.constituicao + 4"], [36, "5d10 + @atr.constituicao + 5"], [48, "10d12 + @atr.constituicao + 10"]]
  },
  lutador: {
    nome: "Lutador", arquetipo: "combatente", descricao: "Luta desarmado: Porrada Franca, Braço de Aço e Posições de Combate. Pode seguir o Punho de Aço.",
    caminhos: { punhoAco: "Punho de Aço" },
    habilidades: [
      [3, "Porrada Franca", "O ataque desarmado corpo a corpo vira sua Arma Favorita e causa +1d4 (1d6 no 12, 1d8 no 21, 1d10 no 30, 1d12 no 39, 2d6 no 48). Pode usar Destreza no lugar de Força. No 48, cada acerto seguido soma +2d8 (ou 1d6 na Mana ou Estamina do alvo), voltando a zero ao errar."],
      [6, "Braço de Aço", "Desarmado e sem armadura, soma metade da Força ou da Destreza na Defesa e na CA (inteira no 15). No 24, quem você agarra sofre 1d10 Contundente por turno (2d6 no 33, 4d6 no 42) e você tem vantagem nos ataques desarmados contra ele."],
      [9, "Posição de Combate", "Entra numa posição (2 no 27, 3 no 45): Poderoso, Descuidado, Ágil, Protetor e Punho de Ferro; no 27, Ginga, Respiração de Aço, Lobo, Tigre e Macaco; no 45, Dragão Cromático e Dragão de Lata. A escolha fica no painel da classe, na aba Combate."],
      [18, "Lutador Resiliente", "Gasta PE para recuperar Vida (1 PE vira 2 PV). Sem PE, uma vez por descanso longo, usa uma habilidade ignorando o custo de PE."],
      [36, "Recuperação por Round", "No início de cada turno recupera 3d10 PV e pode fazer um teste de Constituição DT 20: sucesso recupera +25 PV, falha perde 1d10 PV."],
      [3, "Mão Pesada", "Punho de Aço: ataques desarmados causam +1 dado de dano (+5 dados no 33).", { caminho: "punhoAco" }],
      [18, "Braço de Titânio", "Punho de Aço: o Braço de Aço também dá +4 de CA e +1 de Defesa.", { caminho: "punhoAco" }],
      [48, "Porrada Metálica", "Punho de Aço: cada acerto seguido da Porrada Franca soma +3d8 em vez de +2d8.", { caminho: "punhoAco" }]
    ],
    porradaFranca: [[3, "1d4"], [12, "1d6"], [21, "1d8"], [30, "1d10"], [39, "1d12"], [48, "2d6"]],
    posicoesPorNivel: [[9, 1], [27, 2], [45, 3]],
    posicoes: [
      ["poderoso", "Poderoso", 9, "Seus ataques causam +1d6 de dano.", { dano: "1d6" }],
      ["descuidado", "Descuidado", 9, "Vantagem nos seus ataques, mas os ataques contra você também têm vantagem.", {}],
      ["agil", "Ágil", 9, "Vantagem nos testes de Esquiva.", {}],
      ["protetor", "Protetor", 9, "Com a Reação, faz o teste de Defesa no lugar de um aliado a até 1,5 m.", {}],
      ["punhoFerro", "Punho de Ferro", 9, "Ignora resistências e meia imunidade (combina com Caçador Natural).", {}],
      ["ginga", "Ginga", 27, "+5 de Acerto e +10 de Esquiva, ou o contrário.", {}],
      ["respiracao", "Respiração de Aço", 27, "5 de resistência a dano (RD 5).", { rd: 5 }],
      ["lobo", "Posição do Lobo", 27, "Seus ataques causam +1d8 Perfurante.", { dano: "1d8", tipo: "Perfurante" }],
      ["tigre", "Posição do Tigre", 27, "Seus ataques causam +1d8 Cortante.", { dano: "1d8", tipo: "Cortante" }],
      ["macaco", "Posição do Macaco", 27, "Seus ataques causam +1d8 Contundente.", { dano: "1d8", tipo: "Contundente" }],
      ["cromatico", "Posição do Dragão Cromático", 45, "Seus ataques causam +2d6 de Fogo, Gelo, Ácido ou Raio.", { dano: "2d6", tipo: "Fogo" }],
      ["lata", "Posição do Dragão de Lata", 45, "Seus ataques causam +1d12 de Força.", { dano: "1d12", tipo: "Força" }]
    ].map(([id, nome, nivel, texto, auto]) => ({ id, nome, nivel, texto, auto }))
  },
  guerreiroElemental: {
    nome: "Guerreiro Elemental", arquetipo: "combatente", descricao: "Arma Elemental e Núcleo Vermelho: dano, crítico e efeitos de um elemento que evolui com o nível.",
    armaElemental: [[3, "1d8"], [12, "1d10"], [27, "2d10"], [39, "4d12"]],
    nucleoVermelho: [[3, 5, 1], [12, 10, 2], [21, 15, 3], [30, 20, 4], [39, 25, 5], [48, 30, 6]],
    elementos: [[3, ["Fogo", "Água", "Ar", "Terra"]], [12, ["Raio", "Gelo", "Som", "Pressão"]], [27, ["Gravidade"]], [39, ["Fogo Azul", "Raio Negro", "Ácido", "Zero Absoluto", "Vendaval", "Ruído"]]],
    habilidades: [
      [3, "Despertar Elemental", "Arma Elemental: seus ataques causam dano extra do Elemento Principal (1d8; 1d10 no 12, 2d10 no 27, 4d12 no 39). Núcleo Vermelho: +5 de dano elemental e +1 de Margem de Ameaça (+5/+1 a cada 9 níveis, até +30/+6 no 48). Com 20+ de dano elemental num ataque, pode aplicar o efeito do elemento (Tabela 1.2), uma vez por rodada por alvo."],
      [6, "Revestimento Elemental", "Resistência a um elemento desbloqueado (não precisa ser o principal). Troca após um descanso."],
      [9, "Corpo e Mente Fortificados", "+5 em Testes de Ataque e +5 em Testes de Resistência."],
      [12, "Refinamento Vermelho", "+10 de dano elemental e +2 de Margem. Arma Elemental 1d10; libera Raio, Gelo, Som e Pressão."],
      [15, "Contra-Ataque Elemental", "Após um Contra-Ataque bem-sucedido, pode usar o Ataque Extra do Combatente (uma vez por rodada)."],
      [18, "Visão Elemental", "Ação Padrão: descobre vulnerabilidades, resistências e imunidades elementais de uma criatura e enxerga concentrações de mana."],
      [21, "Refinamento Vermelho II", "+15 de dano elemental e +3 de Margem."],
      [24, "Fluxo Elemental", "Ao trocar o Elemento Principal com a Ação Bônus, o primeiro ataque que acertar no turno causa +1 dado da Arma Elemental."],
      [27, "Corpo Elemental", "Passar num Teste de Resistência de \"metade do dano\" anula o dano. Arma Elemental 2d10; libera Gravidade."],
      [30, "Refinamento Elemental", "Divide os dados da Arma Elemental entre dois elementos desbloqueados. Núcleo Vermelho: +20 de dano e +4 de Margem."],
      [33, "Núcleo Branco", "A primeira habilidade de classe ou magia elemental com custo de mana no turno custa metade (mínimo 1)."],
      [36, "Corpo de Mana", "Resistência a dano mágico e Imunidade a um elemento desbloqueado (troca após descanso)."],
      [39, "Arma Elemental Superior", "Arma Elemental 4d12; libera Fogo Azul, Raio Negro, Ácido, Zero Absoluto, Vendaval e Ruído (ignoram imunidade ao elemento). Núcleo Vermelho: +25 e +5 de Margem."],
      [42, "Transcendência", "Troca o Elemento Principal sem gastar ação (uma vez por turno) e a Arma Elemental ignora Resistência ao elemento."],
      [45, "Domínio Elemental", "Ação Bônus, 1 vez por combate, 3 rodadas: dois Elementos Principais e aplica o efeito do elemento sem precisar de 20 de dano (uma vez por turno)."],
      [48, "Avatar Elemental", "Ação Livre, 1 vez por combate, 3 rodadas: dobro de dados da Arma Elemental em dois elementos, imunidade a eles, ignora Resistências e uma habilidade de mana a custo 0 por turno. Núcleo Vermelho: +30 e +6 de Margem."]
    ]
  },
  alice: {
    nome: "Portadora do País Impossível", arquetipo: "combatente", descricao: "A Faca Vorpal que copia armas, a Histeria e as manifestações impossíveis do País das Maravilhas.",
    formas: [[3, 3], [21, 5], [30, 6], [39, 7]],
    habilidades: [
      [3, "Faca Vorpal", "Item único que absorve a forma de armas tocadas (3 formas; o Mestre define dano e alcance). Corte Vorpal: uma vez por turno, ao acertar com a Faca, faz um segundo ataque no mesmo alvo só com o dano básico."],
      [6, "Esquiva de Borboletas", "Ao Esquivar, vira borboletas e se move até 3 m atravessando criaturas. Se o ataque errar, ataca o agressor com a Faca como Ação Livre (uma vez por rodada)."],
      [9, "País das Maravilhas", "Ação Livre, 3 rodadas: percebe passagens, objetos e criaturas ocultas, armadilhas, fraquezas e ilusões comuns."],
      [12, "Loucura Criativa", "Uma vez por turno, cria uma pequena Manifestação Impossível (apoio, passagem, mudar tamanho ou direção de um objeto). Não causa dano nem prende."],
      [15, "Fúria da Loucura", "Com 10 PV ou menos, entra em Histeria (Ação Livre, 1 vez por combate, 3 rodadas): +5 de Acerto, imune a Amedrontada, +2d10 de dano com a Faca e ignora redução de deslocamento."],
      [18, "Tamanho Não Importa", "Ação Bônus: Forma Pequena (+5 em Destreza, passa por frestas, sem armas pesadas) ou Gigante (+1d10 de dano corpo a corpo, quebra obstáculos, metade do deslocamento)."],
      [21, "Arsenal Expandido", "A Faca guarda 5 formas e troca a forma ativa como Ação Livre uma vez por turno."],
      [24, "Imaginação Materializada", "Ação Padrão: cria por 3 rodadas uma plataforma, parede, armadilha simples ou ferramenta (sem dano direto)."],
      [27, "Dança Impossível", "Uma vez por turno, antes ou depois de atacar com a Faca, move até 5 m sem ação e sem provocar. Ataques de oportunidade contra você têm desvantagem."],
      [30, "Arsenal Distorcido", "6 formas; as novas têm uma habilidade básica, que pode ser usada sem ação ao trocar para elas (uma vez por turno)."],
      [33, "Pesadelo Manifestado", "Ação Padrão, 1 vez por combate: uma criatura faz Teste Mental; na falha, −5 em Ataque e Resistência e sem Reações contra você por até 3 rodadas."],
      [36, "Mundo de Cabeça para Baixo", "Ação Padrão, 1 vez por combate: muda uma regra do ambiente ao redor por 3 rodadas (afeta todos)."],
      [39, "Arsenal do Pesadelo", "7 formas, as novas com até duas habilidades. Ataques normais com a Faca causam +2d10 de dano (não vale no Corte Vorpal)."],
      [42, "País Impossível", "Ação Padrão, 1 vez por combate: área distorcida por 3 rodadas; uma Manifestação por rodada sem ação e inimigos na área com −3 contra suas habilidades."],
      [45, "Histeria Absoluta", "A Histeria pode virar a forma verdadeira: +4d12 de dano com a Faca, Esquiva como Ação Livre uma vez por rodada, duas formas no mesmo turno e imune a Amedrontada, Atordoada e Encantada."],
      [48, "Alice no País Impossível", "Ação Livre, 1 vez por combate, 3 rodadas: anda em qualquer superfície, troca de tamanho e formas livremente, faz um ataque errar uma vez por rodada e fica com 1 PV uma vez ao cair a 0."]
    ]
  },
  cacador: {
    nome: "Caçador", arquetipo: "artifice", descricao: "Pistola do Caçador, Rally, munições da Oficina e as Ferramentas do Caçador.",
    pistola: [[3, "2d8"], [30, "3d10"]],
    habilidades: [
      [3, "Arsenal do Caçador", "Pistola do Caçador: 18 m, 2d8 Perfurante, dispara com Ação Bônus gastando 1 Bala de Mercúrio. Tiro de Impacto: cada acerto dá 1 Ponto de Impacto; com 3, o alvo fica Atordoado até o início do turno dele (uma vez por criatura por combate)."],
      [6, "Rally", "Quem te causar dano ativa o Rally até o fim do seu próximo turno: cada acerto nele recupera 1d10 + Constituição de PV, até o que você perdeu."],
      [9, "Arma de Transformação", "Arma de Oficina com duas formas (troca com Ação Livre, uma vez por turno): Compacta +1 de Margem de Ameaça; Estendida +1d8 de dano corpo a corpo."],
      [12, "Munição de Oficina", "3 usos por descanso: Incendiária (+2d8 Fogo), Serrilhada (+2d8; +3d8 contra Bestas) ou Explosiva (2d8 de Força a até 1,5 m do alvo)."],
      [15, "Frasco de Sangue", "3 por descanso. Ação Bônus: recupera 4d8 + nível de Artífice em PV."],
      [18, "Ataque Visceral", "Ação Padrão contra alvo Atordoado pelos Pontos de Impacto: 6d10 Perfurante e recupera 2d8 PV. Encerra o Atordoamento."],
      [21, "Sangue na Oficina", "Ao usar um Frasco, escolha: próximo ataque +2d8 de dano, +3 m de deslocamento, recuperar 2d8 PE ou +3 no próximo ataque contra alvo com condição."],
      [24, "Oficina de Combate", "Ação Bônus, uma vez por turno: recarregar 2 Balas, trocar a munição preparada, Afiar (+2d8 no próximo corpo a corpo) ou Pressurizar (+1 de Margem no próximo disparo)."],
      [27, "Ferramentas do Caçador", "Hunter Tools (1 vez por descanso cada): Olho Negro (24 m, 4d10 Arcano), Luvas do Executor (até 3 alvos, 2d8 Arcano), Rugido da Besta (3 m, 4d8 de Força e empurra 3 m)."],
      [30, "Munição de Mercúrio Refinada", "Pistola 3d10. Carrega 2 Balas e pode gastar as duas num Tiro Duplo de 6d10."],
      [33, "Cinza de Medula", "3 por descanso. Ação Bônus: o próximo disparo causa +4d10 (+6d10 contra Atordoado)."],
      [36, "Ferramenta do Cosmos", "Tiny Tonitrus (linha de 12 m, 6d10 Trovejante) e Coração do Cosmos (até 4 alvos, 4d10 Arcano), 1 vez por descanso cada."],
      [39, "Sangue de Caçador", "Rally também recupera 1d8 PE ou 1 Bala. Ataque Visceral recupera metade dos PV perdidos desde o início do Rally."],
      [42, "Pesadelo do Caçador", "Ação Padrão, 1 vez por combate, 3 rodadas: Hunter Tool como Ação Bônus, +2d8 de dano nelas e cada uma aplica 1 Ponto de Impacto."],
      [45, "Chamado Além", "Ação Padrão, 1 vez por descanso, 5 Balas: até 6 criaturas a 24 m fazem teste (6d10 Arcano, metade no sucesso); depois ataca até 3 delas por +3d10."],
      [48, "O Último Caçador", "Ação Livre, 1 vez por combate, 3 rodadas: Pistola 4d10, +2d10 nas armas, +2 Pontos de Impacto por disparo, Rally contra qualquer agressor, Visceral +4d10 e Hunter Tools custam 2 Balas a menos."]
    ]
  },
  trovador: {
    nome: "Trovador", arquetipo: "conjurador", descricao: "Transforma a expressão artística em magia: inspira aliados e enfraquece inimigos.",
    inspiracao: [[3, "1d8"], [12, "1d10"], [21, "2d8"], [30, "2d10"], [39, "3d10"], [48, "4d12"]],
    habilidades: [
      [3, "Primeiro Verso", "Escolha sua Expressão Artística (música, poesia, dança, pintura…). Inspiração: com uma Ação Bônus, dá um Dado de Inspiração a um aliado que perceba sua expressão (1 por aliado). Ele soma o dado depois de uma rolagem; se for Ataque, Resistência ou Perícia, também recebe +5."],
      [6, "Palavra Desmoralizante", "Ação Bônus: um inimigo que perceba sua expressão tem desvantagem no próximo Ataque ou Teste de Resistência até o início do seu próximo turno (um inimigo por vez)."],
      [9, "Conjuração Inspirada", "Magia que fortalece, cura ou protege um aliado, ou impõe condição a um inimigo, pode pegar um segundo alvo com metade do valor (para cima) ou condição por no máximo 1 rodada. Uma vez por turno."],
      [12, "Inspiração Aprimorada", "Dado 1d10. Ao gastar o dado, o aliado escolhe: Coragem (Vida Temporária igual ao dado), Precisão (soma de novo metade do dado no Ataque) ou Resistência (RD igual ao dado contra o próximo dano)."],
      [15, "Refrão Persistente", "Quando uma magia sua que fortalece um aliado termina, ele mantém metade de um bônus numérico dela por mais 1 rodada. Sem bônus numérico: +5 no próximo Teste de Resistência até o fim do próximo turno."]
    ]
  }
};

/** Valor da tabela pelo nível ([nível, ...valores]); null antes do primeiro nível. */
export const valorPorNivel = (tabela, nivel) => degrau(tabela ?? [], Math.floor(Number(nivel) || 0));

/* -------------------------------------------- */
/*  0.6.0 (lista 37–61)                         */
/* -------------------------------------------- */

/** Tamanho (modelo): CA, Furtividade, alcance corpo a corpo e multiplicador de carga. */
export const TAMANHO_EFEITOS = {
  minusculo: { ca: 2, furtividade: 10, alcance: "mesmo espaço", carga: 0.25, ordem: 0 },
  pequeno: { ca: 1, furtividade: 5, alcance: "1,5 m", carga: 0.5, ordem: 1 },
  medio: { ca: 0, furtividade: 0, alcance: "1,5 m", carga: 1, ordem: 2 },
  grande: { ca: -1, furtividade: -5, alcance: "3 m", carga: 2, ordem: 3 },
  enorme: { ca: -2, furtividade: -10, alcance: "4,5 m", carga: 4, ordem: 4 },
  colossal: { ca: -4, furtividade: -20, alcance: "9 m", carga: 8, ordem: 5 }
};

/** Grau do Núcleo (Olhar de Mana): informação e requisito, sem bônus próprio. */
export function grauNucleo(nucleo) {
  const v = Math.floor(Number(nucleo) || 0);
  if (v >= 6) return { id: "intenso", label: "Intenso", cor: "#B48CE0" };
  if (v >= 3) return { id: "moderado", label: "Moderado", cor: "#4C8EE0" };
  return { id: "fraco", label: "Fraco", cor: "#8FA3B8" };
}

/** Corrupção acumulada: cada 10 de dano de Corrupção = 1 ponto (0 a 100). */
export const MARCOS_CORRUPCAO = [
  { valor: 25, label: "Mana Instável", texto: "Fica com Mana Instável enquanto estiver com 25 ou mais." },
  { valor: 50, label: "Maldição caótica", texto: "Recebe uma maldição caótica Boa sorteada (o Mestre sorteia)." },
  { valor: 75, label: "Mutação", texto: "Uma mutação com efeito colateral (o Mestre decide)." },
  { valor: 100, label: "Perdido", texto: "Vira criatura do Mestre, a menos que faça um Pacto." }
];
export const pontosCorrupcao = dano => Math.floor(Math.max(0, Number(dano) || 0) / 10);

/**
 * Conquistas que dão título (contadas pela ficha). `mods` valem só com o título ativo.
 * Abates por tipo vêm do Bestiário (derrotados somados por tipo).
 */
export const CONQUISTAS = [
  { id: "criticos", label: "Carrasco", texto: "25 acertos críticos.", conta: "criticos", meta: 25, bonus: "+1 de dano nos ataques.", mods: [{ alvo: "danoAtaque", valor: 1 }] },
  { id: "colapsos", label: "Mente de Aço", texto: "Sobreviveu a um colapso de Sanidade.", conta: "colapsos", meta: 1, bonus: "+2 nos testes de Sanidade.", mods: [], sanidade: 2 },
  { id: "pactos", label: "Palavra de Ferro", texto: "Cumpriu 3 pactos.", conta: "pactosCumpridos", meta: 3, bonus: "+2 em Diplomacia.", mods: [{ alvo: "pericia.diplomacia", valor: 2 }] }
];
export const META_CACADOR = 10;

/** Árvore elemental (Guerreiro Elemental): evoluções e o efeito de um golpe com 20+ de dano (Fortitude DT 20). */
export const EVOLUCOES_ELEMENTO = {
  fogo: ["Raio", "Fogo Azul / Raio Negro"], agua: ["Gelo", "Ácido / Zero Absoluto"], ar: ["Sonoro", "Vendaval / Ruído"], terra: ["Força", "Gravidade"]
};
export const EFEITO_ELEMENTO = {
  fogo: "epm-queimado", raio: "epm-eletrizado", agua: "epm-molhado", gelo: "epm-enregelado", sonoro: "epm-surdo",
  terra: "epm-atordoado", gravidade: "epm-caido", radiante: "epm-revelado", ar: "epm-flutuando", sombra: "epm-assustado", necrotico: "drenar"
};
export const DANO_EFEITO_ELEMENTO = 20;
export const DT_EFEITO_ELEMENTO = 20;

/* -------------------------------------------- */
/*  Escolha de classe                           */
/* -------------------------------------------- */

const slugHabilidade = t => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Habilidades de uma classe pronta: [{ ref, nivel, nome, texto, caminho }], na ordem de nível. */
export function habilidadesDaClasse(id) {
  const c = CLASSES_NOTION[id];
  return (c?.habilidades ?? [])
    .map(([nivel, nome, texto, extra = {}]) => ({ ref: `${id}:${slugHabilidade(nome)}`, nivel, nome, texto, caminho: extra.caminho ?? "" }))
    .sort((a, b) => a.nivel - b.nivel);
}

/** Classes prontas de um arquétipo ("combatente", "conjurador" ou "artifice"). */
export function classesDoArquetipo(arqId) {
  return Object.entries(CLASSES_NOTION).filter(([, c]) => (c.arquetipo ?? "combatente") === arqId).map(([id, c]) => ({ id, ...c }));
}

/** Habilidades liberadas no nível (e nos caminhos escolhidos). */
export function habilidadesLiberadas(id, nivel, caminhos = []) {
  return habilidadesDaClasse(id).filter(h => h.nivel <= nivel && (!h.caminho || caminhos.includes(h.caminho)));
}
