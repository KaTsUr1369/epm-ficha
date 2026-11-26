/**
 * Catálogos do Notion: treinamentos (por categoria), kits iniciais, armas e armaduras por região e propriedades de arma.
 * Só dados (sem Foundry).
 */

/* -------------------------------------------- */
/*  Treinamentos (categorias como no Notion)    */
/* -------------------------------------------- */

import { CATEGORIAS_TREINOS, TREINAMENTOS_LISTA, TREINOS_LEGADO, textoRequisitos } from "./treinamentos-lista.mjs";

/** Categorias do catálogo de treinamentos (EPM/treinamentos.md). */
export const CATEGORIAS_TREINO = CATEGORIAS_TREINOS;

/**
 * Compatível com o formato antigo (nome, tempo, unidade, pt, requisitos, treinador, beneficios, mods, especial),
 * gerado do catálogo novo (scripts/treinamentos-lista.mjs). `modelo` = id do catálogo.
 */
export const TREINAMENTOS_NOTION = [
  ...TREINAMENTOS_LISTA.map(e => ({
    categoria: e.categoria, nome: e.nome, tempo: e.horas, unidade: "horas", pt: e.pt, requisitos: textoRequisitos(e),
    treinador: e.precisaTreinador, beneficios: e.beneficios, mods: e.auto?.mods ?? [], especial: e.auto?.especial ?? "", modelo: e.id
  })),
  // Legado: não aparecem no catálogo, mas os efeitos continuam nas fichas que já têm
  ...TREINOS_LEGADO.map(t => ({ categoria: "legado", nome: t.nome, tempo: 1, unidade: "horas", pt: 0, requisitos: "", treinador: false, beneficios: "", mods: [], especial: t.especial, legado: true }))
];

/* -------------------------------------------- */
/*  Kits iniciais por arquétipo                 */
/* -------------------------------------------- */

/**
 * Kits iniciais (0.9.1): cada vaga é um papel ("armaduraMedia", "corpoLeve"…) que vira um item comum do catálogo
 * (o mesmo do compêndio EPM · Itens), da região de origem do personagem. [papel, tipo de reserva, quantidade]
 */
export const KITS_INICIAIS = {
  combatente: [
    { id: "a", nome: "Kit A", itens: [["armaduraMedia"], ["corpoMedia"], ["distLeve"], ["escudo"], ["aventura"]], moedas: { po: 60 } },
    { id: "b", nome: "Kit B", itens: [["armaduraPesada"], ["corpoPesada"], ["aventura"]], moedas: { po: 25 } },
    { id: "c", nome: "Kit C", itens: [["armaduraLeve"], ["corpoLeve"], ["corpoMedia"], ["distLeve"]], moedas: { po: 120 } }
  ],
  conjurador: [
    { id: "a", nome: "Kit A", itens: [["componentes", 20], ["botanico"], ["grimorio"]], moedas: {} },
    { id: "b", nome: "Kit B", itens: [["foco"], ["runas"], ["grimorio"]], moedas: {} }
  ],
  artifice: [
    { id: "a", nome: "Kit A", itens: [["mecanico"], ["distPesada"], ["armaduraLeve"], ["aventura"]], moedas: { po: 50 } },
    { id: "b", nome: "Kit B", itens: [["mecanico"], ["fogo"], ["armaduraLeve"], ["aventura"]], moedas: { po: 50 } }
  ]
};

/** Papel do kit → id do item comum no catálogo, por região (Genesis usa os de Briavoterna: não tem itens comuns). */
export const ITENS_KIT = {
  umbra: {
    armaduraLeve: "armaduras.couro-batido", armaduraMedia: "armaduras.cota-de-malha", armaduraPesada: "armaduras.armadura-de-talas", escudo: "escudos.escudo-redondo",
    corpoLeve: "armas.espada-curta", corpoMedia: "armas.espada-longa", corpoPesada: "armas.montante",
    distLeve: "armas.arco-curto", distPesada: "armas.besta", fogo: "armas.besta-de-mao",
    aventura: "aventura.kit-de-aventura", mecanico: "ferramentas.kit-mecanico", botanico: "ferramentas.kit-botanico",
    componentes: "conjuracao.componentes-magicos", grimorio: "conjuracao.grimorio", foco: "conjuracao.foco-arcano-cristal", runas: "conjuracao.livro-de-runas"
  },
  briavoterna: {
    armaduraLeve: "armaduras.colete-balistico", armaduraMedia: "armaduras.armadura-tatica", armaduraPesada: "armaduras.traje-militar-pesado", escudo: "escudos.escudo-policial",
    corpoLeve: "armas.faca-tatica", corpoMedia: "armas.taco", corpoPesada: "armas.motosserra",
    distLeve: "armas.pistola", distPesada: "armas.rifle-de-caca", fogo: "armas.revolver",
    aventura: "aventura.kit-de-sobrevivencia", mecanico: "ferramentas.kit-mecanico", botanico: "ferramentas.kit-botanico",
    componentes: "conjuracao.componentes-magicos", grimorio: "conjuracao.grimorio", foco: "conjuracao.foco-arcano-cristal", runas: "conjuracao.livro-de-runas"
  }
};

/** Região dos itens do kit pela origem/tecnologia do personagem. */
export function regiaoKit(regiao = "") { return regiao === "briavoterna" || regiao === "genesis" ? "briavoterna" : "umbra"; }

/* -------------------------------------------- */
/*  Propriedades de arma (Notion)               */
/* -------------------------------------------- */

export const PROPRIEDADES_ARMA = {
  "Acuidade": "Pode atacar usando Agilidade (Destreza).",
  "Leve": "Fácil de usar e rápida em combate.",
  "Pesada": "Difícil de manusear sem força suficiente.",
  "Duas Mãos": "Precisa das duas mãos para usar.",
  "Versátil": "Pode ser usada com uma ou duas mãos.",
  "Arremessável": "Pode ser lançada contra inimigos.",
  "Longo Alcance": "Funciona bem a grandes distâncias.",
  "Curto Alcance": "Melhor para combate próximo.",
  "Silenciosa": "Produz pouco ou nenhum som.",
  "Automática": "Pode dar 3 tiros por ação.",
  "Semiautomática": "Pode dar 2 tiros por ação.",
  "Explosiva": "Causa dano em área.",
  "Área": "Afeta vários inimigos próximos.",
  "Perfurante": "Especializada em atravessar armaduras.",
  "Sangramento": "Pode causar dano contínuo.",
  "Atordoante": "Chance de deixar o inimigo atordoado.",
  "Anti-Blindagem": "Mais eficaz contra armaduras pesadas.",
  "Anti-Veículo": "Projetada para destruir veículos.",
  "Alta Precisão": "Aumenta a chance de acerto.",
  "Mira Estável": "Penalidade menor em tiros longos.",
  "Recarga Lenta": "Demora para recarregar.",
  "Recarga Rápida": "Recarrega rapidamente.",
  "Ocultável": "Fácil de esconder.",
  "Grande": "Difícil de transportar ou esconder.",
  "Energia": "Usa energia como fonte de dano.",
  "Plasma": "Dano térmico extremamente alto.",
  "EMP": "Desativa dispositivos eletrônicos.",
  "Ionizante": "Afeta máquinas e robôs.",
  "Superaquecimento": "Pode falhar se usada demais.",
  "Disparo Rápido": "Permite múltiplos ataques por turno.",
  "Disparo Lento": "Demora mais de um turno para atacar.",
  "Espalhamento": "O tiro se divide e atinge área maior.",
  "Penetração": "Atravessa múltiplos alvos.",
  "Gauss": "Disparo eletromagnético de alta velocidade.",
  "Antimatéria": "Extremamente destrutiva.",
  "Corrosiva": "Diminui lentamente a redução de dano de armaduras.",
  "Tóxica": "Envenena o alvo.",
  "Congelante": "Reduz o movimento do inimigo.",
  "Incendiária": "Pode colocar o alvo em chamas.",
  "Instável": "Poderosa, mas com risco de falha.",
  "Lendária": "Propriedade rara e poderosa.",
  "Experimental": "Tecnologia nova e imprevisível.",
  "Dupla": "Permite lutar com duas armas sem desvantagem, uma vez por rodada.",
  "Exótica": "Tem uma Maestria, liberada quando o personagem domina a arma: 10 pontos na perícia da arma (15 se a arma for de outra região) ou se for a arma favorita."
};

/* -------------------------------------------- */
/*  Armas e armaduras por região                */
/* -------------------------------------------- */

export const REGIOES = { umbra: "Umbra'Draxil", briavoterna: "Briavoterna", genesis: "Genesis" };

/** [nome, dano, crítico, alcance, tipo de dano, propriedades, perícia] — crítico "19/x3": margem 19, ×3. */
const ARMAS = {
  umbra: [
    ["Adaga", "1d4", "20/x3", "Corpo a corpo", "Perfurante", ["Acuidade", "Leve", "Arremessável", "Ocultável"], "luta"],
    ["Espada Curta", "1d6", "18", "Corpo a corpo", "Cortante", ["Acuidade", "Leve"], "luta"],
    ["Espada Longa", "1d8", "19", "Corpo a corpo", "Cortante", ["Versátil", "Acuidade"], "luta"],
    ["Espada Bastarda", "1d10", "19", "Corpo a corpo", "Cortante", ["Duas Mãos"], "luta"],
    ["Montante", "2d6", "19", "Corpo a corpo", "Cortante", ["Pesada", "Duas Mãos"], "luta"],
    ["Machado de Mão", "1d6", "19/x3", "Corpo a corpo", "Cortante", ["Arremessável", "Leve"], "luta"],
    ["Machado de Batalha", "1d10", "x3", "Corpo a corpo", "Cortante", ["Pesada", "Duas Mãos"], "luta"],
    ["Maça", "1d8", "18", "Corpo a corpo", "Contundente", ["Pesada"], "luta"],
    ["Martelo de Guerra", "1d10", "x3", "Corpo a corpo", "Contundente", ["Pesada", "Duas Mãos"], "luta"],
    ["Lança", "1d8", "18", "Curto", "Perfurante", ["Arremessável", "Acuidade", "Duas Mãos"], "luta"],
    ["Alabarda", "1d10", "19", "Curto", "Cortante, Perfurante", ["Acuidade", "Duas Mãos"], "luta"],
    ["Arco Curto", "1d6", "19", "Médio", "Perfurante", ["Longo Alcance", "Duas Mãos"], "pontaria"],
    ["Arco Longo", "1d8", "19/x3", "Longo", "Perfurante", ["Longo Alcance", "Duas Mãos"], "pontaria"],
    ["Besta", "1d10", "x3", "Longo", "Perfurante", ["Longo Alcance", "Duas Mãos", "Pesada"], "pontaria"]
  ],
  briavoterna: [
    ["Faca Tática", "1d4", "19", "Corpo a corpo", "Perfurante", ["Acuidade", "Leve", "Arremessável", "Ocultável"], "luta"],
    ["Pistola", "2d6", "18", "Distância", "Balístico", ["Curto Alcance", "Perfurante", "Recarga Rápida", "Ocultável", "Silenciosa"], "pontaria"],
    ["Revólver", "2d8", "19/x3", "Curto", "Balístico", ["Perfurante", "Recarga Lenta", "Ocultável"], "pontaria"],
    ["Submetralhadora", "2d6", "19", "Distância", "Balístico", ["Automática", "Curto Alcance", "Perfurante"], "pontaria"],
    ["Rifle de Assalto", "2d10", "x3", "Distância", "Balístico", [], "pontaria"],
    ["Rifle de Precisão", "3d10", "19/x3", "Longo", "Balístico", [], "pontaria"],
    ["Escopeta", "3d6", "18/x3", "Distância", "Balístico", [], "pontaria"],
    ["Metralhadora", "3d8", "x4", "Distância", "Balístico", [], "pontaria"],
    ["Granada", "4d6", "", "Arremesso", "Cortante, Perfurante", ["Explosiva"], "pontaria"],
    ["Lança-Foguetes", "6d10", "x4", "Distância", "Explosivo", [], "pontaria"]
  ],
  genesis: [
    ["Lâmina de Energia", "2d8", "18/x3", "Corpo a corpo", "Energia cortante", [], "luta"],
    ["Katana Plasma", "2d10", "18/x3", "Corpo a corpo", "Energia cortante", [], "luta"],
    ["Pistola Laser", "2d8", "18/x3", "Distância", "Energia balística", [], "pontaria"],
    ["Rifle Laser", "3d10", "19/x4", "Distância", "Energia balística", [], "pontaria"],
    ["Rifle de Plasma", "4d10", "18/x4", "Distância", "Energia balística", [], "pontaria"],
    ["Canhão Gauss", "4d10", "20/x5", "Distância", "Energia explosiva", [], "pontaria"],
    ["Lança-Plasma", "5d10", "x4", "Distância", "Energia explosiva", [], "pontaria"],
    ["Granada EMP", "", "", "Arremesso", "Energia explosiva", [], "pontaria"],
    ["Rifle Antimatéria", "6d10", "x5", "Distância", "Energia balística", [], "pontaria"],
    ["Canhão Orbital", "10d10", "x6", "Distância", "Energia explosiva", [], "pontaria"]
  ]
};

/** Lê "19/x3", "x4", "18", "20|x5". */
export function lerCritico(texto) {
  const t = String(texto ?? "").replace(/\s/g, "").toLowerCase();
  if (!t || t === "-") return { margem: 20, mult: 2 };
  const m = t.match(/^(\d{2})?[/|]?(?:x(\d))?$/);
  return { margem: Number(m?.[1]) || 20, mult: Number(m?.[2]) || 2 };
}

export const ARMAS_REGIAO = Object.fromEntries(Object.entries(ARMAS).map(([regiao, lista]) => [regiao, lista.map(([nome, dano, crit, alcance, tipoDano, propriedades, pericia]) => {
  const c = lerCritico(crit);
  return { regiao, nome, dano, critMargem: c.margem, critMult: c.mult, alcance, tipoDano, propriedades, pericia };
})]));

/**
 * Armaduras: [nome, tipo, defesa, desvantagem, habilidade especial, efeitos automáticos].
 * Efeitos no formato dos itens da ficha. O que depende de situação (ex.: "+1 em Pontaria com armas de Briavoterna") fica no texto.
 */
const mod = (alvo, valor) => ({ tipo: "mod", alvo, valor });
const rd = (tipoDano, valor) => ({ tipo: "rd", tipoDano, valor });
const res = tipoDano => ({ tipo: "resistencia", tipoDano });
const imu = tipoDano => ({ tipo: "imunidade", tipoDano });
const ARMADURAS = {
  umbra: [
    ["Armadura de Couro", "leve", 1, "Nenhuma", "+2 em Furtividade", [mod("pericia.furtividade", 2)]],
    ["Gambeson", "leve", 2, "Nenhuma", "", []],
    ["Gambeson Reforçado", "leve", 3, "Nenhuma", "", []],
    ["Cota de Malha", "media", 4, "−1 em Furtividade", "RD 5 contra corte", [mod("pericia.furtividade", -1), rd("Cortante", 5)]],
    ["Brigandina", "media", 5, "Nenhuma", "", []],
    ["Armadura de Placas", "pesada", 6, "−3 m de deslocamento e −3 em Furtividade", "RD 10 contra dano físico", [mod("deslocamento", -3), mod("pericia.furtividade", -3), rd("Físicos", 10)]],
    ["Armadura de Cavaleiro Real", "pesada", 7, "−3 m de deslocamento e −5 em Furtividade", "+3 no Bloqueio", [mod("deslocamento", -3), mod("pericia.furtividade", -5), mod("defesa.bloqueio", 3)]],
    ["Armadura de Cavaleiro Sagrado", "pesada", 7, "−1,5 m de deslocamento e −5 em Furtividade", "Resistência contra magia necrótica", [mod("deslocamento", -1.5), mod("pericia.furtividade", -5), res("Necrótico")]],
    ["Armadura do Campeão", "pesada", 8, "−5 m de deslocamento", "+1 em Força e Constituição; resistência a dano físico", [mod("deslocamento", -5), mod("atributo.forca", 1), mod("atributo.constituicao", 1), res("Físicos")]],
    ["Armadura Dracônica", "pesada", 9, "−4 m de deslocamento", "+2 em Força e Constituição; resistência a dano mágico e físico; imunidade a Fogo", [mod("deslocamento", -4), mod("atributo.forca", 2), mod("atributo.constituicao", 2), res("Físicos"), res("Força"), imu("Fogo")]]
  ],
  briavoterna: [
    ["Colete Balístico", "leve", 3, "Nenhuma", "RD 7 contra balístico", [rd("Balístico", 7)]],
    ["Colete Kevlar Avançado", "leve", 4, "Nenhuma", "RD 3 contra balístico; +1 em Pontaria com armas de Briavoterna", [rd("Balístico", 3)]],
    ["Armadura Tática", "media", 5, "Nenhuma", "+2 em Pontaria com armas de Briavoterna", []],
    ["Armadura Antimotim", "media", 5, "−3 m de deslocamento", "RD 5 contra físico e RD 5 contra balístico", [mod("deslocamento", -3), rd("Físicos", 5), rd("Balístico", 5)]],
    ["Traje Militar Pesado", "pesada", 6, "−3 m de deslocamento e −5 em Furtividade", "RD 5 contra balístico; resistência a explosivo", [mod("deslocamento", -3), mod("pericia.furtividade", -5), rd("Balístico", 5), res("Explosivo")]],
    ["Exotraje de Combate", "pesada", 7, "Nenhuma", "+4 em Pontaria e Furtividade; RD 10 contra físico e balístico; +3 m de deslocamento", [mod("pericia.pontaria", 4), mod("pericia.furtividade", 4), rd("Físicos, Balístico", 10), mod("deslocamento", 3)]],
    ["Armadura de Assalto", "pesada", 9, "−5 em Furtividade", "Resistência a balístico; RD 15 contra físico; visão noturna", [mod("pericia.furtividade", -5), res("Balístico"), rd("Físicos", 15)]]
  ],
  genesis: [
    ["Traje de Invisibilidade", "leve", 4, "Nenhuma", "+5 em Furtividade", [mod("pericia.furtividade", 5)]],
    ["Armadura de Nano-fibra", "leve", 5, "Nenhuma", "+3 m de deslocamento", [mod("deslocamento", 3)]],
    ["Armadura Energética", "media", 7, "Nenhuma", "Escudo de energia portátil", []],
    ["Armadura de Combate Orbital", "media", 7, "−3 m de deslocamento", "Resistência a radiação", [mod("deslocamento", -3)]],
    ["Armadura de Combate Espacial", "pesada", 8, "−5 m de deslocamento", "Sobrevive no vácuo", [mod("deslocamento", -5)]],
    ["Exoesqueleto de Batalha", "pesada", 9, "−5 de Estamina por turno", "+5 em testes de atributos físicos; +3 m de deslocamento; salto igual ao deslocamento", [mod("deslocamento", 3)], 5],
    ["Armadura de Plasma", "pesada", 10, "−10 de Estamina por turno", "Resistência a dano", [res("Todos os danos")], 10]
  ]
};

export const TIPOS_ARMADURA = { leve: "Leve", media: "Média", pesada: "Pesada" };

export const ARMADURAS_REGIAO = Object.fromEntries(Object.entries(ARMADURAS).map(([regiao, lista]) => [regiao, lista.map(([nome, tipo, defesa, desvantagem, especial, efeitos, estaminaPorTurno]) =>
  ({ regiao, nome, tipo, defesa, desvantagem, especial, efeitos, estaminaPorTurno: estaminaPorTurno ?? 0 }))]));
