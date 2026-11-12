/**
 * Catálogos do Notion: treinamentos (por categoria), kits iniciais, armas e armaduras por região e propriedades de arma.
 * Só dados (sem Foundry).
 */

/* -------------------------------------------- */
/*  Treinamentos (categorias como no Notion)    */
/* -------------------------------------------- */

export const CATEGORIAS_TREINO = [
  { id: "aura",    label: "Aura",    icone: "fa-solid fa-sun" },
  { id: "fisicos", label: "Físicos", icone: "fa-solid fa-person-running" },
  { id: "arma",    label: "Arma",    icone: "fa-solid fa-khanda" },
  { id: "extras",  label: "Extras",  icone: "fa-solid fa-dice" },
  { id: "magias",  label: "Magias",  icone: "fa-solid fa-hat-wizard" },
  { id: "mental",  label: "Mental",  icone: "fa-solid fa-brain" },
  { id: "outros",  label: "Outros",  icone: "fa-solid fa-dumbbell" }
];

/** Formato igual ao do treinamento da ficha (nome, tempo, unidade, pt, requisitos, treinador, beneficios, mods). */
export const TREINAMENTOS_NOTION = [
  { categoria: "aura", nome: "Aura Iniciante", tempo: 12, unidade: "horas", pt: 2, requisitos: "—", treinador: false,
    beneficios: "Soma sua Aura (Núcleo) em todo ataque corpo a corpo desarmado.", mods: [] },
  { categoria: "aura", nome: "Aura de Deslocamento", tempo: 24, unidade: "horas", pt: 5, requisitos: "3 de Núcleo e Destreza; Aura Iniciante", treinador: false,
    beneficios: "Move 9 m com a Ação Bônus, +3 m para cada ponto de Aura (Núcleo) acima de 3.", mods: [] },
  { categoria: "aura", nome: "Aura de Deslocamento Superior", tempo: 24, unidade: "horas", pt: 5, requisitos: "3 de Núcleo e Destreza; Aura de Deslocamento", treinador: false,
    beneficios: "O movimento de Aura de Deslocamento aumenta em 9 m.", mods: [] },
  { categoria: "aura", nome: "Aura de Proteção", tempo: 24, unidade: "horas", pt: 5, requisitos: "3 de Núcleo e Constituição; Aura Iniciante", treinador: false,
    beneficios: "Recebe 2 × Núcleo de RD. Alternativamente, soma o Núcleo na CA.", mods: [], especial: "auraProtecao" },
  { categoria: "aura", nome: "Aura de Proteção Superior", tempo: 24, unidade: "horas", pt: 5, requisitos: "Aura de Proteção", treinador: false,
    beneficios: "Os dois benefícios da Aura de Proteção valem ao mesmo tempo.", mods: [], especial: "auraProtecaoSuperior" },
  { categoria: "aura", nome: "Fortalecimento Mental por Aura", tempo: 20, unidade: "horas", pt: 3, requisitos: "3 de Núcleo e Autocontrole; Aura Iniciante", treinador: false,
    beneficios: "Soma o Núcleo nos testes de resistência de Autocontrole.", mods: [] },
  { categoria: "fisicos", nome: "Corredor", tempo: 48, unidade: "horas", pt: 5, requisitos: "4 de Destreza", treinador: false,
    beneficios: "Seu deslocamento aumenta em 3 metros e você pode realizar a ação Disparada como Ação Bônus.", mods: [{ alvo: "deslocamento", valor: 3 }] },
  { categoria: "fisicos", nome: "Músculos de Aço", tempo: 36, unidade: "horas", pt: 5, requisitos: "4 de Força ou Constituição", treinador: false,
    beneficios: "A CA troca a Destreza por Força ou Constituição (escolha em Combate → CA).", mods: [] },
  { categoria: "fisicos", nome: "Flash Step", tempo: 1, unidade: "meses", pt: 100, requisitos: "12 de Destreza ou Força, 8 de Núcleo", treinador: true,
    beneficios: "Defina com o Mestre (em branco no Notion).", mods: [] },
  { categoria: "arma", nome: "Sintonização com Arma", tempo: 48, unidade: "horas", pt: 3, requisitos: "3 de Núcleo e proficiência com a arma", treinador: false,
    beneficios: "A arma vira extensão do corpo: o que exige ataque desarmado pode ser usado com ela.", mods: [] },
  { categoria: "arma", nome: "Mira Rápida", tempo: 24, unidade: "horas", pt: 5, requisitos: "Proficiência em armas à distância", treinador: false,
    beneficios: "A ação de Mira pode ser feita como Ação Bônus.", mods: [] },
  { categoria: "arma", nome: "Versatilidade Armada", tempo: 36, unidade: "horas", pt: 5, requisitos: "Proficiência em armas corpo a corpo e 4 de Destreza ou Força", treinador: false,
    beneficios: "Com armas de dois tipos de dano, usa sempre o maior; pode usar seu maior atributo mesmo que a arma diga outro.", mods: [] },
  { categoria: "extras", nome: "Delinquente Briguento", tempo: 5, unidade: "dias", pt: 5, requisitos: "8 de Destreza ou Força e 5 de Constituição", treinador: false,
    beneficios: "Quando uma briga começa por sua causa, seu primeiro ataque da cena causa o dobro de dano.", mods: [] },
  { categoria: "extras", nome: "Apostador Experiente", tempo: 5, unidade: "dias", pt: 5, requisitos: "5 de Intelecto e 3 de Autocontrole", treinador: true,
    beneficios: "Vantagem em testes de Intuição ligados a jogos de azar (descobrir manipulação, ler jogadores, estimar chances).", mods: [] },
  { categoria: "extras", nome: "Estrategista", tempo: 10, unidade: "dias", pt: 15, requisitos: "5 de Intelecto e 5 em Liderança", treinador: false,
    beneficios: "Quem seguir um plano seu recebe +3 em todos os testes enquanto estiver dentro do plano.", mods: [] },
  { categoria: "magias", nome: "Magia Potente", tempo: 48, unidade: "horas", pt: 10, requisitos: "6 de Núcleo e 5 de Intelecto", treinador: false,
    beneficios: "Soma a Inteligência no dano ou na cura das magias (se já somava, soma de novo).", mods: [], especial: "magiaPotente" },
  // Modelos para a categoria Mental (vazia no Notion) e Familiaridade tecnológica (0.6.0, ajustáveis)
  { categoria: "mental", nome: "Mente Blindada", tempo: 24, unidade: "horas", pt: 3, requisitos: "4 de Autocontrole", treinador: false, modelo: true,
    beneficios: "+5 nos testes de Sanidade (o teste de Autocontrole para resistir ao dano de Sanidade).", mods: [], especial: "menteBlindada" },
  { categoria: "mental", nome: "Memória Treinada", tempo: 36, unidade: "horas", pt: 5, requisitos: "5 de Inteligência", treinador: false, modelo: true,
    beneficios: "Uma vez por sessão, relembra os detalhes de uma cena (o Mestre descreve).", mods: [], especial: "memoriaTreinada" },
  { categoria: "mental", nome: "Meditação de Núcleo", tempo: 48, unidade: "horas", pt: 5, requisitos: "4 de Núcleo", treinador: false, modelo: true,
    beneficios: "O descanso curto também recupera 1d6 PM.", mods: [], especial: "meditacaoNucleo" },
  { categoria: "outros", nome: "Familiaridade Tecnológica", tempo: 5, unidade: "dias", pt: 5, requisitos: "Ter usado equipamento da região", treinador: true, modelo: true,
    beneficios: "Sobe 1 nível de tecnologia (Umbra'Draxil 1 → Briavoterna 2 → Genesis 3): o equipamento daquele nível deixa de dar desvantagem.", mods: [], especial: "familiaridade" }
];

/* -------------------------------------------- */
/*  Kits iniciais por arquétipo                 */
/* -------------------------------------------- */

/** Itens genéricos (o jogador troca pelas armas/armaduras de verdade depois). */
export const KITS_INICIAIS = {
  combatente: [
    { id: "a", nome: "Kit A", itens: [["Armadura Média", "equipment"], ["Arma Corpo a Corpo Média", "weapon"], ["Arma à Distância Leve", "weapon"], ["Escudo", "equipment"], ["Kit de Aventura", "loot"]], moedas: { po: 60 } },
    { id: "b", nome: "Kit B", itens: [["Armadura Pesada", "equipment"], ["Arma Corpo a Corpo Pesada", "weapon"], ["Kit de Aventura", "loot"]], moedas: { po: 25 } },
    { id: "c", nome: "Kit C", itens: [["Armadura Leve", "equipment"], ["Arma Corpo a Corpo Leve", "weapon"], ["Arma Corpo a Corpo Média", "weapon"], ["Arma à Distância Leve", "weapon"]], moedas: { po: 120 } }
  ],
  conjurador: [
    { id: "a", nome: "Kit A", itens: [["Componentes Mágicos", "consumable", 20], ["Kit Botânico", "tool"], ["Grimório", "loot"]], moedas: {} },
    { id: "b", nome: "Kit B", itens: [["Foco Arcano", "loot"], ["Livro de Runas", "loot"], ["Grimório", "loot"]], moedas: {} }
  ],
  artifice: [
    { id: "a", nome: "Kit A", itens: [["Kit Mecânico", "tool"], ["Arma à Distância Pesada", "weapon"], ["Armadura Leve", "equipment"], ["Kit de Aventura", "loot"]], moedas: { po: 50 } },
    { id: "b", nome: "Kit B", itens: [["Kit Mecânico", "tool"], ["Arma de Fogo", "weapon"], ["Armadura Leve", "equipment"], ["Kit de Aventura", "loot"]], moedas: { po: 50 } }
  ]
};

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
  "Experimental": "Tecnologia nova e imprevisível."
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
