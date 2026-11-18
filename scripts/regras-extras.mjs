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
  combatente: { pv: { inicial: 26, dado: "1d10", media: 6 }, pe: { inicial: 21, dado: "1d8", media: 5 }, pm: { inicial: 16, dado: "1d6", media: 4 } },
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
/** Lista de rolagens salva como array ou como objeto {0: 8, 1: 3} (campos do formulário) → array. */
/** Tabela de recursos por arquétipo com os valores trocados pela mesa (flags.recursosAuto.tabela). */
export function tabelaRecursos(ajustes = {}) {
  const out = {};
  for (const [arq, t] of Object.entries(RECURSOS_ARQUETIPO)) {
    out[arq] = {};
    for (const r of ["pv", "pe", "pm"]) {
      const a = ajustes?.[arq]?.[r] ?? {};
      const num = (v, p) => (v === undefined || v === null || String(v).trim() === "" || !Number.isFinite(Number(v)) ? p : Number(v));
      const dado = /^\d*d\d+$/i.test(String(a.dado ?? "").trim()) ? String(a.dado).trim().toLowerCase() : t[r].dado;
      out[arq][r] = { inicial: num(a.inicial, t[r].inicial), dado, media: num(a.media, t[r].media) };
    }
  }
  return out;
}

export function listaRolagens(v) {
  if (Array.isArray(v)) return v;
  if (!v || typeof v !== "object") return [];
  const out = [];
  for (const [k, x] of Object.entries(v)) if (/^\d+$/.test(k)) out[Number(k)] = x;
  return out;
}

export function maximoRecurso(recurso, { raca = 0, atributo = 0, niveis = [], rolagens = {}, usarMedia = true, extraFixo = 0, extraPorNivel = 0, ajuste = 0, modo = "", tabela = RECURSOS_ARQUETIPO } = {}) {
  const partes = [];
  let total = Number(raca) || 0;
  partes.push({ rotulo: "Raça", valor: total });
  const validos = niveis.filter(n => tabela[n.arquetipo] && n.nivel > 0);
  if (!validos.length) {
    total += atributo;
    partes.push({ rotulo: "Atributo", valor: atributo });
    return { total: total + extraFixo, partes };
  }
  const primeiro = validos[0];
  const ini = tabela[primeiro.arquetipo][recurso].inicial;
  total += ini + atributo;
  partes.push({ rotulo: `Inicial (${primeiro.arquetipo})`, valor: ini }, { rotulo: "Atributo (nível 1)", valor: atributo });
  let niveisExtras = 0;
  for (const n of validos) {
    const cfg = tabela[n.arquetipo][recurso];
    const extras = n === primeiro ? n.nivel - 1 : n.nivel;
    const rol = listaRolagens(rolagens?.[n.arquetipo]);
    let soma = 0;
    for (let i = 0; i < extras; i++) {
      const r = Number(rol[n === primeiro ? i : i]);
      soma += !usarMedia && r > 0 ? r : cfg.media;
    }
    if (extras > 0) {
      total += soma + extras * atributo;
      partes.push({ rotulo: `${extras} nível(is) de ${n.arquetipo} (${usarMedia ? "média" : modo === "manual" ? "valores digitados" : "rolagem"} + atributo)`, valor: soma + extras * atributo });
      niveisExtras += extras;
    }
  }
  if (extraFixo) { total += extraFixo; partes.push({ rotulo: "Outros (raça, únicas)", valor: extraFixo }); }
  if (extraPorNivel) { const v = extraPorNivel * (niveisExtras + 1); total += v; partes.push({ rotulo: "Por nível (raça)", valor: v }); }
  if (Number(ajuste)) { total += Number(ajuste); partes.push({ rotulo: "Ajuste manual", valor: Number(ajuste) }); }
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
    nome: "Guerreiro Elemental", arquetipo: "combatente",
    descricao: "Transforma a mana em poder elemental: troca de elemento para explorar fraquezas e furar resistências. Faz bem: dano constante e adaptável. Faz mal: defender aliados, curar, controlar muitos inimigos. Precisa de: alguém que segure a linha e alguém que cure ou fortaleça.",
    // Arma Elemental (dado extra em todo ataque com arma) e Núcleo Vermelho (fixo, só no primeiro acerto do turno, não multiplica no crítico)
    armaElemental: [[3, "1d4"], [12, "1d6"], [27, "1d8"], [39, "1d10"]],
    nucleoVermelho: [[3, 2], [12, 4], [21, 6], [30, 9], [39, 12], [48, 15]],
    margem: [[12, 1], [39, 2]],
    efeitoNivel: 39, efeitoDano: 15,
    elementos: [[3, ["Fogo", "Água", "Ar", "Terra"]], [12, ["Raio", "Gelo"]], [27, ["Som", "Pressão"]], [39, ["Fogo Azul", "Raio Negro", "Ácido", "Zero Absoluto", "Vendaval", "Ruído", "Gravidade", "Abalo Sísmico"]]],
    habilidades: [
      [3, "Despertar Elemental", "Arma Elemental: seus ataques com arma causam dano extra do Elemento Principal (+1d4; 1d6 no 12, 1d8 no 27, 1d10 no 39; os dados não dobram no crítico). Núcleo Vermelho: o primeiro acerto de cada turno causa dano elemental fixo extra (+2; +4 no 12, +6 no 21, +9 no 30, +12 no 39, +15 no 48; não multiplica no crítico). Desbloqueia Fogo, Água, Ar e Terra. Fora de combate escolhe o Elemento Principal livremente; em combate, trocar custa uma Ação Bônus (1×/turno). O Elemento Principal não muda o elemento das magias comuns."],
      [6, "Pele de Mana", "Escolha um elemento desbloqueado e receba Resistência ao dano dele. Pode trocar a escolha após um descanso."],
      [9, "Corpo e Mente Fortificados", "+2 em Testes de Resistência."],
      [12, "Refinamento Vermelho", "Núcleo Vermelho +4; Arma Elemental +1d6. Seus ataques com Arma Elemental recebem +1 na Margem de Ameaça. Desbloqueia Raio e Gelo."],
      [15, "Contra-Ataque Elemental", "Quando realizar um Contra-Ataque bem-sucedido, pode fazer imediatamente um ataque adicional com a Arma Elemental (não usa Ataque Extra). 1×/rodada."],
      [18, "Visão Elemental", "Ação Padrão: descubra Vulnerabilidades, Resistências e Imunidades elementais de uma criatura que consiga ver. Enxerga concentrações de mana e os elementos nelas, salvo se protegidas por efeitos que ocultem ou distorçam mana."],
      [21, "Refinamento Vermelho II", "Núcleo Vermelho +6."],
      [24, "Fluxo Elemental", "Ao gastar a Ação Bônus para trocar o Elemento Principal, o primeiro ataque que acertar naquele turno causa um dado extra da Arma Elemental. 1×/turno."],
      [27, "Corpo Elemental", "Quando passar num Teste de Resistência contra um efeito de dano elemental que causaria metade do dano, não sofre dano. Arma Elemental +1d8. Desbloqueia Som e Pressão."],
      [30, "Refinamento Vermelho III e Refinamento Elemental", "Núcleo Vermelho +9. Pode dividir os dados da Arma Elemental entre dois elementos desbloqueados (não aumenta o dano total; resistências contam separado para cada parte)."],
      [33, "Núcleo Branco", "A primeira habilidade de classe ou magia elemental que custe mana em cada turno custa 25% menos (arredonde para cima, mínimo 1)."],
      [36, "Essência Elemental", "Você tem Resistência ao dano do seu Elemento Principal atual (muda junto com ele). Pele de Mana passa a cobrir 2 elementos."],
      [39, "Refinamento Vermelho IV e Arma Elemental Superior", "Núcleo Vermelho +12; Arma Elemental +1d10; Margem de Ameaça +2 com Arma Elemental. Desbloqueia Fogo Azul, Raio Negro, Ácido, Zero Absoluto, Vendaval, Ruído, Gravidade e Abalo Sísmico. Quando um ataque com Arma Elemental for crítico ou causar 15+ de dano elemental, pode tentar aplicar o efeito do elemento (Tabela 1.2). 1×/rodada por alvo; o alvo faz o Teste de Resistência apropriado."],
      [42, "Transcendência", "Trocar o Elemento Principal não exige mais Ação Bônus (1×/turno, inclusive entre ataques). Sua Arma Elemental ignora Resistência ao elemento usado (não Imunidade, salvo elementos superiores)."],
      [45, "Domínio Elemental", "1×/combate, Ação Bônus, 3 rodadas: dois Elementos Principais ao mesmo tempo, troca livre, e a Arma Elemental pode dividir o dano entre eles (mesmo total). Identifica na hora Vulnerabilidades aos elementos usados. 1×/turno pode tentar aplicar o efeito da Tabela 1.2 sem precisar do crítico ou dos 15 de dano. Não prolonga controles com aplicações seguidas."],
      [48, "Refinamento Máximo e Avatar Elemental", "Núcleo Vermelho +15. Avatar Elemental: 1× por descanso, Ação Livre, 3 rodadas. A Arma Elemental causa o dobro de dados; usa dois Elementos Principais; imune ao dano desses dois elementos; ignora Resistências elementais; 1×/turno uma habilidade de classe ou magia elemental custa metade da mana."]
    ]
  },
  alice: {
    nome: "Portadora do País Impossível", arquetipo: "combatente",
    descricao: "Alice: ataques rápidos com esquivas e efeitos que distorcem o ambiente, com a Faca Vorpal. Faz bem: mobilidade, evasão, exploração e soluções criativas. Faz mal: aguentar dano direto, curar, proteger os outros. Precisa de: alguém que segure os inimigos parados e alguém que cure quando a esquiva falhar.",
    formas: [[3, 3], [21, 5], [30, 6], [39, 7]],
    habilidades: [
      [3, "Faca Vorpal", "Item único com espaço para 3 Formas de Arma. Ao tocar uma arma, a Faca absorve a forma dela sem destruir a original (copia as características básicas, não encantamentos nem habilidades únicas; nenhuma forma supera uma arma comum do seu nível). Corte Vorpal: 1×/turno, ao acertar com a Faca, gaste 3 PE para um segundo ataque contra o mesmo alvo, causando só o dado da forma ativa (sem modificador nem bônus)."],
      [6, "Esquiva de Borboletas", "Ao realizar uma Esquiva, vira borboletas e se desloca até 3 m, atravessando criaturas e espaços pequenos. Se a Esquiva fizer um ataque errar, gaste 4 PE para atacar o agressor com a Faca como Ação Livre (1×/rodada; não ativa Corte Vorpal)."],
      [9, "País das Maravilhas", "Ação Livre, 3 rodadas: percebe passagens ocultas, objetos invisíveis, armadilhas, criaturas escondidas, fraquezas estruturais e o que não pertence à realidade. Vê através de ilusões comuns, não das excepcionais."],
      [12, "Loucura Criativa", "1×/turno, durante uma ação, cria uma pequena Manifestação Impossível: um apoio, uma passagem estreita, mudar o tamanho ou a direção de um objeto. Não causa dano, não prende criaturas, não cria objetos valiosos nem substitui magias."],
      [15, "Fúria da Loucura", "Com um quarto dos PV máximos ou menos, entra em Histeria como Ação Livre (1×/combate, 3 rodadas): +3 Acerto, não pode ser Amedrontada, ataques com a Faca causam +1d10 e ignora reduções de deslocamento. Termina se ficar inconsciente."],
      [18, "Tamanho Não Importa", "Ação Bônus: Forma Pequena (passa por espaços minúsculos, +3 em testes de Destreza, percebe passagens ocultas; sem armas pesadas) ou Gigante (+1d8 de dano corpo a corpo, destrói obstáculos; deslocamento pela metade). Dura até trocar."],
      [21, "Faca Vorpal: Arsenal Expandido", "A Faca comporta 5 formas. 1×/turno troca a forma ativa como Ação Livre."],
      [24, "Imaginação Materializada", "Ação Padrão, 3 rodadas: cria uma plataforma, parede, armadilha simples, ferramenta ou mecanismo básico. Armadilhas permitem Teste de Resistência. Não causa dano, não é mágico e não surge dentro de criaturas."],
      [27, "Dança Impossível", "1×/turno, antes ou depois de um ataque com a Faca, move-se até 5 m sem ação e sem provocar Ataques de Oportunidade. Ataques de Oportunidade contra você têm Desvantagem."],
      [30, "Faca Vorpal: Arsenal Distorcido", "A Faca comporta 6 formas; as novas podem ter uma habilidade básica (definida pelo Mestre, com limite claro). Ao trocar de forma, 1×/turno, pode usar essa habilidade sem gastar ação."],
      [33, "Pesadelo Manifestado", "1×/combate, Ação Padrão: uma criatura visível faz Teste de Resistência Mental. Falha: até 3 rodadas com −5 em Ataque e TR e sem Reações contra você (repete o teste no fim de cada turno). Sucesso: imune pelo resto do combate."],
      [36, "Mundo de Cabeça para Baixo", "1×/combate, Ação Padrão, 3 rodadas: escolha uma regra para a área (objetos caem para cima; paredes viram chão; distâncias distorcidas; pequenos ficam pesados; grandes ficam leves). Afeta todos igualmente; não causa dano nem impede ações por completo."],
      [39, "Faca Vorpal: Arsenal do Pesadelo", "A Faca comporta 7 formas; as novas podem ter até duas habilidades. Ataques normais com a Faca causam +1d10 (não vale para o Corte Vorpal)."],
      [42, "País Impossível", "1×/combate, Ação Padrão, 3 rodadas: área distorcida onde você altera a gravidade de forma limitada, anda em paredes e tetos, muda o tamanho de objetos e cria passagens impossíveis. 1×/rodada, Manifestação Impossível sem ação. Inimigos na área: −3 em Ataque e TR contra suas habilidades."],
      [45, "Histeria Absoluta", "Ao ativar Histeria, pode escolher sua forma verdadeira (substitui os bônus da Histeria normal): ataques com a Faca +2d10, uma Esquiva como Ação Livre por rodada, duas Formas de Arma diferentes no mesmo turno e troca sem ação. Imune a Amedrontada, Atordoada e Encantada. Mesma condição de ativação e 1×/combate."],
      [48, "Alice no País Impossível", "1×/combate, Ação Livre, 3 rodadas: a área vira o País Impossível. Altera a gravidade (limites do Mestre), anda em qualquer superfície, atravessa pequenos espaços e troca entre Pequena, Normal e Gigante como Ação Livre. Pode usar duas Formas no mesmo turno e trocar entre todas sem ação. 1×/rodada, quando um ataque a acertaria, vira borboletas e o ataque erra. Ao terminar, as manifestações somem e você volta ao tamanho Normal."]
    ]
  },
  bastiao: {
    nome: "Bastião Inquebrável", arquetipo: "combatente", extra: true,
    descricao: "Abandonou o poder ofensivo para alcançar o limite da própria resistência: não cai e trava o espaço (Âncora Viva). Faz bem: segurar uma passagem, aguentar pressão, travar o caminho até os aliados frágeis. Faz mal: causar dano, perseguir, proteger quem está longe. Precisa de: alguém que cause dano e alguém que lide com ameaças à distância.",
    corpoInabalavel: [[6, "1d6"], [12, "1d6 + @atr.constituicao"], [21, "2d6 + @atr.constituicao"], [33, "3d6 + @atr.constituicao"], [45, "4d6 + @atr.constituicao"]],
    habilidades: [
      [3, "Defesa Absoluta", "+1 PV máximo por nível de personagem (inclui os níveis já ganhos e cresce a cada nível). Recebe +1 em Testes de Resistência."],
      [6, "Corpo Inabalável", "Uma vez por rodada, quando sofrer dano, reduz esse dano em 1d6. A redução acontece depois de resistências e vulnerabilidades. Evolui nos níveis 12, 21, 33, 45 e 48."],
      [9, "Âncora Viva", "Criaturas hostis do seu tamanho ou menores não podem atravessar o seu espaço. A área a até 1,5 m de você é terreno difícil para criaturas hostis. Escolha 2 entre envenenamento, paralisia, atordoamento, medo, sono forçado e controle mental: você tem vantagem em Testes de Resistência contra elas."],
      [12, "Estrutura Reforçada", "Recebe +1 CA. A redução de Corpo Inabalável aumenta para 1d6 + Constituição."],
      [15, "Imóvel", "Não pode ser derrubada, empurrada ou puxada por efeitos físicos comuns. Vantagem em Testes de Resistência contra efeitos sobrenaturais que tentem deslocá-la ou derrubá-la. Teletransporte e efeitos que alteram diretamente sua posição continuam funcionando."],
      [18, "Recuperação Defensiva", "Uma vez por rodada, ao sofrer dano estando com metade dos PV ou menos, pode gastar 8 PE para recuperar 2d8 + Constituição PV (sem passar do máximo)."],
      [21, "Adaptação Defensiva", "Ao sofrer dano de um tipo, use sua Reação e gaste 10 PE para ter resistência àquele tipo até o início do seu próximo turno. Só uma resistência adquirida assim por vez. A redução de Corpo Inabalável aumenta para 2d6 + Constituição."],
      [24, "Fortaleza Mental", "Imune a sono forçado e a medo comum. Vantagem contra todas as condições da Âncora Viva, manipulação emocional e efeitos que alterem seu comportamento. Efeitos que a obrigariam a abandonar voluntariamente uma posição ou objetivo permitem um Teste de Resistência."],
      [27, "Corpo Inquebrável", "Enquanto estiver com metade dos PV ou menos, tem resistência a dano contundente, cortante e perfurante (não acumula com outras resistências iguais)."],
      [30, "Persistência Absoluta", "Terreno difícil não reduz seu deslocamento, e efeitos externos não o reduzem abaixo de 1,5 m. Ignora penalidades de dor, exaustão física comum e ferimentos superficiais; continua consciente enquanto tiver PV. A área da Âncora Viva aumenta para 3 m."],
      [33, "Estrutura Colossal", "Recebe +1 CA. A redução de Corpo Inabalável aumenta para 3d6 + Constituição."],
      [36, "Vontade de Ferro", "Vantagem em Testes de Resistência contra magias e efeitos sobrenaturais que causem condições debilitantes. Adaptação Defensiva passa a custar 6 PE, e você pode manter até 2 resistências adquiridas ao mesmo tempo."],
      [39, "Sobrevivência Extrema", "Recuperação Defensiva passa a recuperar 3d8 + Constituição PV e também encerra em você uma destas condições: envenenada, sangrando, cega, surda, amedrontada ou atordoada."],
      [42, "Imortalidade Condicional", "Uma vez por cena, quando seus PV forem reduzidos a 0, gaste 15 PE para ficar com 1 PV. Não funciona contra efeitos que destruam o corpo ou determinem a morte sem considerar PV."],
      [45, "Resistência Absoluta", "Uma vez por cena, ao receber dano, use sua Reação e gaste 20 PE para ficar imune àquele tipo de dano até o início do seu próximo turno (não vale contra dano verdadeiro). A redução de Corpo Inabalável aumenta para 4d6 + Constituição."],
      [48, "A Fortaleza Intransponível", "Uma vez por cena, Ação Bônus, 25 PE + 20 PM, por 3 rodadas: +2 CA e +40 PV temporários; redução de Corpo Inabalável 6d6 + Constituição; resistência a todos os tipos de dano; imune a envenenamento, paralisia, medo e sono forçado; não pode ser deslocada. A Âncora Viva cobre 6 m, e criaturas hostis dentro dela não podem se afastar de você voluntariamente (ainda podem atacar quem quiserem). Não concede ataques nem ações adicionais."]
    ]
  },
  guerreiroVazio: {
    nome: "Guerreiro do Vazio", arquetipo: "combatente", extra: true,
    descricao: "Manifesta Ecos de si mesmo, reflexos de existências que nunca chegaram a existir, e luta de várias posições. Faz bem: flanquear, atacar de onde o inimigo não espera, reposicionar inimigos e salvar um aliado com o Eco. Faz mal: aguentar dano (o Eco tem 1 PV) e causar dano concentrado alto. Precisa de: alguém na linha de frente e alguém que cause dano pesado nas aberturas.",
    habilidades: [
      [3, "Manifestação do Eco", "Ação Bônus: cria um Eco num espaço desocupado visível a até 4,5 m. Ele tem sua aparência, 1 PV, usa sua CA e Defesa, é imune a condições e copia a arma que você porta (sem itens próprios nem PV, PE ou PM). Desaparece se você ficar incapacitado ou criar outro. Turno do Eco: logo após o seu turno, ele se move até 9 m (sem passar de 9 m de você) e faz uma Ação Padrão simples; não tem Ação Bônus nem Reação. Ataque do Eco: 5 PE, um único ataque com seus atributos, sem somar modificador de atributo ao dano e sem habilidades de dano extra; não usa nem conta para Ataque Extra. Ataques através do Eco: no seu turno, pode usar sua posição ou a do Eco como origem dos seus ataques."],
      [6, "Troca de Existência", "Com um Eco ativo, Ação Bônus: troque de lugar com ele. Gasta 3 m do seu deslocamento, não provoca Ataques de Oportunidade e exige o espaço livre."],
      [9, "Avatar do Eco", "Ação Padrão: enxerga e ouve só pelo Eco, que pode se afastar até 90 m. Seu corpo fica parado e sem perceber o entorno, e você não ataca nem conjura. Dura até 10 minutos ou até você encerrar."],
      [12, "Ameaça Projetada", "Com você e o Eco em lados opostos de uma criatura, o primeiro acerto contra ela em cada rodada causa +1d8 de Força (seu ou do Eco). 1×/rodada. O ataque do Eco passa a somar seu modificador de atributo ao dano."],
      [15, "Interposição do Vazio", "Quando você ou um aliado a até 6 m do Eco for alvo de um ataque individual com teste de ataque, use a Reação e gaste 8 PE: antes da rolagem, teleporte o Eco para perto do alvo e o ataque passa a mirar o Eco. Se acertar, o Eco é destruído e ninguém recebe aquele dano. Não funciona contra áreas ou efeitos sem teste de ataque."],
      [18, "Ruptura Ressonante", "1×/turno, ao acertar um ataque originado de você ou do Eco, gaste 6 PE para empurrar o alvo ou puxá-lo 1,5 m em direção ao Eco, sem provocar Ataques de Oportunidade."],
      [21, "Desencadear Incarnation", "Quando o Eco atacar no turno dele, gaste 8 PE a mais para somar +2d8 de Força. Não concede ataque extra."],
      [24, "Eco Distante", "Alcance do Eco aumenta de 9 para 15 m e ele se move até 12 m por turno sem gastar ação. O Avatar do Eco deixa de ter limite de distância."],
      [27, "Troca Perfeita", "Troca de Existência deixa de gastar deslocamento."],
      [30, "Tiro de Vigília", "No turno do Eco, a Ação Padrão dele pode marcar uma linha de até 18 m. A primeira criatura hostil que atravessá-la até o próximo turno do Eco fica exposta: seu primeiro ataque contra ela recebe +5 Acerto."],
      [33, "Interposição do Vazio II", "Alcance da Interposição sobe para 12 m do Eco, e o Eco pode se deslocar até 6 m antes de se posicionar. Custo e Reação continuam iguais."],
      [36, "Desencadear Incarnation II", "O bônus de Desencadear Incarnation aumenta para +4d8 de Força (custo 10 PE)."],
      [39, "Segunda Manifestação", "Pode manter até dois Ecos (o segundo custa +5 PE). Ambos têm 1 PV, usam suas defesas, movem 12 m e servem de origem para seus ataques, a até 15 m de você. Ainda existe um turno do Eco por rodada: um deles faz a Ação Padrão, o outro só se move. Continua sendo um ataque de Eco por rodada."],
      [42, "Ruptura de Retorno", "1×/rodada, quando um Eco for destruído por um ataque, teleporte-se até 3 m para um espaço adjacente ao local onde ele sumiu, sem ação e sem provocar Ataques de Oportunidade."],
      [45, "Cerco das Duas Existências", "Com dois Ecos ativos e uma criatura a até 1,5 m de ambos, ao acertá-la (você ou um Eco) gaste 8 PE para causar +2d10 de Força. 1×/rodada."],
      [48, "Legião do Vazio", "1×/cena, Ação Bônus, 20 PE, 3 rodadas: até três Ecos, a até 18 m, movendo 12 m; ataques podem sair de qualquer um; Troca de Existência funciona com todos. Continua um único turno de Eco com uma Ação Padrão por rodada. Convergência do Vazio: 1×/rodada, quando o Eco acertar no turno dele, gaste 5 PE para +2d10 de Força. O Cerco das Duas Existências passa a exigir só dois dos Ecos perto do alvo."]
    ]
  },
  vitalista: {
    nome: "Vitalista", arquetipo: "conjurador", extra: true,
    descricao: "Domina a energia que sustenta a existência: fecha ferimentos, purifica, devolve o fôlego e impede que companheiros sucumbam. Faz bem: manter o grupo vivo. Faz mal: causar dano, fortalecer ataques, controlar o campo; é frágil de perto. Precisa de: alguém que o proteja e alguém que termine as lutas.",
    toque: [[3, "2d8"], [12, "3d8"], [21, "4d8"], [30, "5d8"], [39, "6d10"]],
    protecaoVital: [[6, "1d10"], [12, "2d10"], [21, "3d10"], [30, "4d10"], [39, "5d10"]],
    habilidades: [
      [3, "Toque Restaurador", "Ação Padrão: toque uma criatura e gaste 8 PE para recuperar 2d8 + Núcleo PV (sem passar do máximo). 1×/turno."],
      [6, "Proteção Vital", "Ação Bônus, 5 PE: uma criatura a até 9 m recebe 1d10 + Núcleo PV temporários por 3 rodadas. PV temporários não acumulam; fica o maior."],
      [9, "Purificação", "Ação Padrão, toque, 8 PE: encerra uma condição entre envenenada, sangrando, cega, surda ou amedrontada. Não remove maldições, transformações nem controle mental."],
      [12, "Restauração Aprimorada", "Toque Restaurador: 3d8 + Núcleo. Proteção Vital: 2d10 + Núcleo."],
      [15, "Excedente Vital", "Quando sua cura passar do máximo de PV do alvo, metade do excedente (arredondado para baixo) vira PV temporários, até 20 por uso."],
      [18, "Intervenção Vital", "Quando uma criatura a até 9 m sofrer dano, use a Reação e gaste 10 PE para reduzir o dano em 2d10 + Núcleo (depois de resistências)."],
      [21, "Restauração Superior", "Toque Restaurador: 4d8 + Núcleo. Proteção Vital: 3d10 + Núcleo."],
      [24, "Transfusão Vital", "Ação Bônus, 8 PE: uma criatura a até 12 m recupera 2d6 PE e perde 1 nível de Exaustão. Uma vez por rodada; cada criatura só recebe 1× por cena. No nível 39 passa a recuperar 4d6 PE."],
      [27, "Onda Restauradora", "1×/combate, Ação Padrão, 15 PE: criaturas escolhidas num raio de 6 m recuperam 3d8 + Núcleo PV. Não afeta inimigos, mortos-vivos ou construtos sem energia vital."],
      [30, "Purificação Avançada", "Purificação também encerra paralisia e atordoamento. Toque Restaurador: 5d8 + Núcleo. Proteção Vital: 4d10 + Núcleo."],
      [33, "Vínculo Restaurador", "Quando curar uma criatura, outro aliado a até 6 m dela recupera 2d10 PV. 1×/rodada; não ativa a si mesmo."],
      [36, "Fortalecimento Integral", "Ação Padrão, 12 PE: uma criatura a até 12 m recebe Resistência a um tipo de dano à sua escolha (físico ou um elemento) por 3 rodadas. Só um por criatura."],
      [39, "Restauração Magistral", "Toque Restaurador: 6d10 + Núcleo. Proteção Vital: 5d10 + Núcleo. Onda Restauradora: 5d10 + Núcleo. Transfusão Vital: 4d6 PE."],
      [42, "Recusa da Morte", "1×/cena, quando um aliado a até 12 m cair a 0 PV, use a Reação e gaste 15 PE: ele fica com 1 PV e recupera 4d10 + Núcleo. Não funciona contra destruição do corpo ou morte independente de PV."],
      [45, "Campo de Restauração", "1×/combate, Ação Padrão, 15 PE, raio de 9 m por 3 rodadas: aliados recuperam 2d10 + Núcleo no início dos turnos deles; 1×/rodada você encerra sem ação, num aliado na área, uma condição que a Purificação remova. Não cura inimigos, mortos-vivos ou construtos."],
      [48, "Fonte da Vida", "1×/cena, Ação Padrão, 25 PE + 20 PM, 3 rodadas: aliados a até 18 m recuperam 3d10 + Núcleo no início dos turnos; suas curas recuperam o dobro; 1×/rodada encerra uma condição removível por Purificação de cada aliado no alcance; uma vez durante o efeito, um aliado que cair a 0 PV fica com 1 PV e recupera 6d10 + Núcleo. Não ressuscita, não reconstrói corpos nem restaura membros."]
    ]
  },
  trovador: {
    nome: "Trovador", arquetipo: "conjurador",
    descricao: "Transforma a expressão (música, poesia, canto, dança, pintura, histórias, discursos, atuação…) em poder mágico: fortalece aliados, enfraquece inimigos e manipula o campo. Faz bem: multiplicar o grupo. Faz mal: causar dano e curar diretamente; sozinho, faz pouco. Precisa de: aliados que acertem e aguentem.",
    inspiracao: [[3, "1d6"], [12, "1d8"], [21, "1d10"], [30, "2d6"], [39, "2d8"], [48, "2d12"]],
    inspiracaoAliados: [[3, 1], [21, 2], [30, 3], [39, 4], [48, 99]],
    inspiracaoCusto: 3,
    habilidades: [
      [3, "Primeiro Verso", "Inspiração: Ação Bônus e 3 PE: um aliado que perceba sua expressão recebe um Dado de Inspiração e pode somá-lo depois de rolar. Cada personagem tem no máximo 1 dado seu por vez. Escala: 1d6 (Nv. 3), 1d8 (12), 1d10 (21), 2d6 (30), 2d8 (39), 2d12 (48). Quando um aliado usa seu dado num Teste de Ataque e acerta, o ataque causa +1d4 de dano."],
      [6, "Palavra Desmoralizante", "Ação Bônus, 4 PE: um inimigo que perceba sua expressão recebe Desvantagem no próximo Teste de Ataque ou de Resistência até o início do seu próximo turno. Um inimigo por vez."],
      [9, "Conjuração Inspirada", "1×/turno, ao conjurar uma magia que fortaleça, proteja ou cure um aliado, ou que imponha condição a um inimigo, pague metade do custo em PM a mais para escolher um segundo alvo no alcance. Ele recebe metade dos números (arredondado para cima), ou a condição por no máximo 1 rodada."],
      [12, "Inspiração Aprimorada", "Dado: 1d8. Ao gastar o dado, o aliado escolhe: Coragem (PV temporários iguais ao resultado), Precisão (soma de novo metade do resultado ao ataque) ou Resistência (reduz o próximo dano sofrido no valor do resultado)."],
      [15, "Refrão Persistente", "Quando uma magia sua de fortalecimento terminar, o aliado mantém metade de um dos bônus numéricos por mais 1 rodada. Se não houver bônus numérico, recebe +3 no próximo Teste de Resistência até o fim do próximo turno dele."],
      [18, "Contraponto", "1×/rodada, Reação, 8 PE: quando uma criatura perceptível conjurar, faça Teste de Conjuração contra o dela. Se vencer: Enfraquecer (dano ou cura pela metade), Distorcer (alcance pela metade) ou Silenciar (duração de buff ou debuff pela metade)."],
      [21, "Inspiração Superior", "Dado: 1d10. Pode manter Inspiração em 2 aliados ao mesmo tempo."],
      [24, "Grande Performance", "1×/combate, Ação Padrão, 3 rodadas: até 3 aliados que percebam você recebem +3 em Ataque, Resistência e Conjuração. Você precisa continuar consciente e se expressando."],
      [27, "Ruína da Confiança", "Quando um inimigo falhar num TR provocado por você, escolha: Dúvida (Desvantagem no próximo Ataque), Hesitação (no próximo TR), Desordem (no próximo Teste de Conjuração) ou Fraqueza (causa 20% menos dano até seu próximo turno). Um efeito por criatura."],
      [30, "Inspiração Magistral", "Dado: 2d6, que o aliado pode usar juntos ou separados. Até 3 aliados. Se um aliado gastar os dois dados juntos e ainda falhar, recupera 1 deles (1×/rodada)."],
      [33, "Obra Viva", "1×/combate, Ação Padrão, 15 PM, 3 rodadas, área ao seu redor. Escolha: Esperança (aliados +4 em TR), Guerra (aliados +4 em Ataque e Conjuração), Desespero (inimigos −4 em Ataque e TR) ou Silêncio (inimigos com Desvantagem em Conjuração). Uma Obra por vez."],
      [36, "Mestre da Conjuração", "Magias cujo efeito principal seja buff ou debuff custam 25% menos PM (arredonde para cima). O segundo alvo da Conjuração Inspirada passa a receber o efeito completo."],
      [39, "Inspiração Lendária", "Dado: 2d8. Até 4 aliados. O dado também pode ser somado à cura feita ou ao dano de uma magia."],
      [42, "Magnum Opus", "1×/combate, Ação Padrão, 3 rodadas: todo aliado que perceba você recebe 1 Dado de Inspiração no início do turno dele; aliados com Vantagem em TR; inimigos com Desvantagem em TR contra suas magias; seus buffs de alvo único afetam até 3 aliados e debuffs até 2 inimigos."],
      [45, "Autor do Destino", "3 Versos do Destino por combate. Depois de uma rolagem de criatura que perceba você, gaste 1 como Reação: Vitória (aliado rola de novo e fica com o melhor), Tragédia (inimigo rola de novo e fica com o pior), Clímax (o próximo Dado de Inspiração do aliado sai no máximo) ou Fracasso (inimigo que passou num TR contra sua magia refaz o teste). Um Verso por criatura por rodada."],
      [48, "Lenda Imortal", "Dado: 2d12. Sem limite de aliados com Inspiração, desde que percebam você ao recebê-la. Última Obra: 1× por descanso, Ação Livre, 3 rodadas: buffs e debuffs custam metade dos PM; buffs de alvo único afetam até 4 aliados e debuffs até 3 inimigos; aliados com Vantagem em TR; inimigos com Desvantagem em TR contra suas magias; Obra Viva e Grande Performance podem ficar ativas juntas."]
    ]
  },
  mecanicoGuerra: {
    nome: "Mecânico de Guerra", arquetipo: "artifice",
    descricao: "Transforma o corpo numa máquina de guerra (Chassi de Guerra): placas, hidráulica, estabilização e um escudo frontal integrado. Faz bem: proteger os outros, interceptar golpes e provocar inimigos. Faz mal: causar dano e se defender de áreas. Precisa de: alguém que cause dano enquanto ele segura a atenção. O Chassi acompanha a armadura e não pode ser removido ou desarmado em combate por meios convencionais.",
    placas: [[3, 2], [12, 4], [27, 6], [36, 8]],
    escudoCerco: [[6, "1d10 + 3"], [12, "1d10 + 5"], [27, "2d10 + 5"], [36, "2d10 + 8"]],
    habilidades: [
      [3, "Blindagem de Guerra", "Com o Chassi: +2 Defesa e +1 CA (sem acumular com fontes iguais; fica o maior). Placas Reforçadas: a primeira vez que sofrer dano em cada rodada, reduz em 2 (depois de resistências)."],
      [6, "Escudo de Cerco", "Quando você ou um aliado logo atrás de você, a até 1,5 m, for atingido por um ataque individual, use a Reação e gaste 5 PE. Se for um aliado, o ataque passa para você com o mesmo resultado. Se o ataque passar sua Defesa, você reduz o dano em 1d10 + 3; se não passar, não sofre dano. Não funciona contra área e não se combina com outra redução do Chassi no mesmo ataque."],
      [9, "Protocolo de Ameaça", "Ao acertar uma criatura, gaste 5 PE: até o início do seu próximo turno, enquanto ela perceber você a até 12 m, sofre −2 em ataques contra quem não for você. Uma criatura por vez; não a obriga a atacar você."],
      [12, "Blindagem Reforçada", "Placas Reforçadas: 4. Escudo de Cerco: 1d10 + 5."],
      [15, "Escudo Móvel", "O Escudo de Cerco passa a proteger um aliado adjacente em qualquer direção, e como parte da Reação você pode se mover 1,5 m antes de interceptar (sem provocar Ataques de Oportunidade)."],
      [18, "Acumulador Cinético", "1×/rodada, ao reduzir dano com Blindagem ou Escudo, ganha 1 Carga Cinética (máx. 3, somem no fim do combate). Ao usar o Escudo de Cerco, pode gastar cargas para +1d6 de redução cada."],
      [21, "Descarga Hidráulica", "Ação Padrão, 8 PE, 1 a 3 cargas: inimigos a até 3 m fazem TR de Força. Falha: 1 carga empurra 1,5 m; 2 cargas, 3 m; 3 cargas, 3 m e Caídos. Não causa dano."],
      [24, "Cobertura de Companhia", "Com o Chassi, aliados logo atrás de você, a até 3 m, recebem +1 Defesa contra ataques vindos da direção que você protege."],
      [27, "Blindagem Pesada", "Placas Reforçadas: 6. Escudo de Cerco: 2d10 + 5."],
      [30, "Marcha de Cerco", "Com o Chassi: terreno difícil não reduz seu deslocamento; atravessa aliados sem custo; vantagem para romper portas e barreiras comuns. 1×/turno, após andar 3 m em linha reta e parar ao lado de uma criatura, gaste 5 PE para tentar empurrá-la 1,5 m (TR de Força evita). Sem dano."],
      [33, "Protocolo de Ameaça II", "Até duas Ameaças Prioritárias (8 PE no total). Penalidade sobe para −4."],
      [36, "Blindagem Reativa", "Placas Reforçadas: 8. Escudo de Cerco: 2d10 + 8."],
      [39, "Acumulador Cinético II", "Máximo de 5 cargas; cada carga gasta no Escudo vale 1d8. Continua 1 carga por rodada."],
      [42, "Muralha Hidráulica", "Ação Bônus, 10 PE, 3 rodadas: Cobertura de Companhia alcança aliados atrás de você a até 6 m e o bônus sobe para +2 Defesa; o Protocolo de Ameaça é aplicado sem custo a toda criatura que você acertar."],
      [45, "Protocolo de Sacrifício", "1×/cena, quando um aliado a até 9 m for atingido por um ataque que o deixaria a 0 PV, use a Reação e gaste 15 PE: mova-se até ficar ao lado dele (se houver caminho) e o ataque passa para você, com o mesmo resultado. Você pode aplicar as reduções do Chassi. Não funciona contra área."],
      [48, "Colosso de Guerra", "1×/cena, Ação Bônus, 20 PE + 15 PM, 3 rodadas: Blindagem Absoluta (Placas Reforçadas sobem para 12); Fortaleza Viva (Cobertura de Companhia para todos os aliados atrás de você a até 6 m, com +3 Defesa); Protocolo de Guerra (todos os inimigos que você perceba a até 12 m ficam sob Protocolo de Ameaça, −4); Escudo Aprimorado (Escudo de Cerco reduz 3d10 + 10; continua 1×/rodada com a Reação). Não concede ataques, ações extras nem imunidade a dano."]
    ]
  },
  cacador: {
    nome: "Caçador", arquetipo: "artifice",
    descricao: "Transformou a oficina em arsenal de caça (inspirado em Bloodborne): pistola de mercúrio, arma de transformação, frascos de sangue e ferramentas. O ciclo é receber dano → atacar → recuperar → abrir o inimigo → Visceral. Faz bem: dano explosivo nas aberturas e ferramentas em área. Faz mal: proteger, sustentar o grupo e lutar sem balas. Precisa de: alguém que segure os inimigos e alguém que cure.",
    pistola: [[3, "1d8"], [30, "2d8"]],
    balas: [[3, 5], [21, 8], [39, 10]],
    habilidades: [
      [3, "Arsenal do Caçador", "Balas de Mercúrio: 5 por descanso (8 no Nv. 21, 10 no Nv. 39); disparos e Ferramentas gastam balas. Pistola do Caçador (item da subclasse): alcance 18 m, 1d8 Perfurante, Ação Bônus, 1 bala; não serve para ataques múltiplos na mesma ação. Tiro de Impacto: ao acertar com a Pistola, cause 1 Ponto de Impacto; com 3, a criatura fica Atordoada até o início do próximo turno dela e os pontos zeram. Uma vez por criatura por combate (Chefes e criaturas enormes podem ter outro limite, definido pelo Mestre)."],
      [6, "Rally", "Ao sofrer dano de uma criatura, entra em Rally até o fim do seu próximo turno. 1×/turno, ao acertá-la, recupera 1d10 + Constituição PV, limitado ao dano que iniciou o Rally. Se não acertar até o fim do próximo turno, o Rally acaba."],
      [9, "Arma de Transformação", "Sua arma principal tem duas formas e troca 1×/turno como Ação Livre: Compacta (+1 Margem de Ameaça) ou Estendida (+1d6 de dano e mais alcance). O tipo de dano não muda."],
      [12, "Munição de Oficina", "Num descanso, prepare 3 munições especiais, com 3 usos no total: Incendiária (+2d6 Fogo), Serrilhada (+2d6 físico; +3d6 contra Bestas) ou Explosiva (2d6 de Força em todos a até 1,5 m do alvo)."],
      [15, "Frasco de Sangue", "3 Frascos por descanso. Ação Bônus: recupera 2d8 + Inteligência PV (sem passar do máximo). Beber não encerra o Rally."],
      [18, "Ataque Visceral", "Ação Padrão, só contra uma criatura Atordoada por Pontos de Impacto: dano da arma + 4d8 Perfurante, e você recupera 2d8 PV. Depois disso, a criatura fica imune ao seu Visceral até o início do seu próximo turno."],
      [21, "Sangue na Oficina", "Ao usar um Frasco, escolha um: Fortalecido (próximo ataque +2d8), Acelerado (+3 m de deslocamento no turno), Restaurador (recupera 2d6 PE) ou Fervente (+3 no próximo ataque contra criatura sob condição)."],
      [24, "Oficina de Combate", "1×/turno, Ação Bônus: Recarregar (recupera 2 balas, 1×/cena), Modificar (troca a munição preparada), Afiar (próximo corpo a corpo +2d6) ou Pressurizar (próximo disparo +1 Margem de Ameaça)."],
      [27, "Ferramentas do Caçador", "Olho Negro (Ação Padrão, 2 balas): projétil até 24 m, 4d8 de Força, vantagem contra voadores. Luvas do Executor (Ação Padrão, 2 balas): até 3 criaturas a 18 m sofrem 2d8 de Força cada (uma por criatura). Rugido da Besta (Ação Padrão, 2 balas): criaturas a até 3 m fazem TR; falha, 4d8 de Força e empurradas 3 m; sucesso, metade e não são empurradas."],
      [30, "Munição de Mercúrio Refinada", "Pistola: 2d8. Pode carregar duas balas de uma vez e disparar um Tiro Duplo de 4d8 (gasta as duas). O Tiro Duplo gera no máximo 1 Ponto de Impacto."],
      [33, "Cinza de Medula", "2 usos por descanso. Ação Bônus: o próximo disparo causa +4d8, ou +6d8 se acertar uma criatura Atordoada."],
      [36, "Ferramentas do Cosmos", "Tiny Tonitrus (Ação Padrão, 3 balas): linha de 12 m, TR; falha, 6d8 de Relâmpago; sucesso, metade. Coração do Cosmos (Ação Padrão, 3 balas): até 4 criaturas a 18 m sofrem 4d8 de Força cada."],
      [39, "Sangue de Caçador", "Ao recuperar PV pelo Rally, também recupera 2d6 PE ou 1 bala. O Ataque Visceral passa a recuperar 4d8 PV."],
      [42, "Pesadelo do Caçador", "1×/combate, Ação Padrão, 3 rodadas: pode usar uma Ferramenta como Ação Bônus; Ferramentas causam +2d8 e cada dano delas gera 1 Ponto de Impacto."],
      [45, "Chamado Além", "1× por descanso, Ação Padrão, 7 balas: até 6 criaturas a 24 m sofrem 6d8 de Força cada. Depois, role o ataque de novo contra até 3 delas; acerto causa +2d8 (uma vez por criatura)."],
      [48, "O Último Caçador", "1× por descanso, Ação Livre, 3 rodadas (Última Caçada): Pistola 3d8; ataques de arma +1d8; disparos geram +1 Ponto de Impacto; Rally ativa contra qualquer criatura que tenha te ferido; Visceral +4d8; Ferramentas custam 1 bala a menos; pode usar uma Ferramenta e um ataque de arma no mesmo turno. Uma vez durante a Última Caçada, um Visceral recupera todos os PV perdidos desde que ela começou."]
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
  fogo: "epm-queimado", raio: "epm-eletrizado", relampago: "epm-eletrizado", agua: "epm-molhado", gelo: "epm-enregelado", frio: "epm-enregelado", sonoro: "epm-surdo",
  terra: "epm-lento", forca: "epm-caido", gravidade: "epm-caido", radiante: "epm-revelado", ar: "epm-flutuando", sombra: "epm-assustado", necrotico: "drenar"
};
/** Elemento do Guerreiro Elemental → tipo de dano da ficha. */
export const TIPO_DO_ELEMENTO = {
  "Raio": "Relâmpago", "Gelo": "Frio", "Som": "Sonoro", "Pressão": "Força", "Gravidade": "Força", "Fogo Azul": "Fogo", "Raio Negro": "Relâmpago",
  "Zero Absoluto": "Frio", "Vendaval": "Ar", "Ruído": "Sonoro", "Abalo Sísmico": "Terra"
};
export const tipoDoElemento = el => TIPO_DO_ELEMENTO[el] ?? el;
export const DANO_EFEITO_ELEMENTO = 15;
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
