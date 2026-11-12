/**
 * Escolhidos pelo Multiverso: lista de condições e combinações.
 * Só dados (sem imports), para poder ser lida e testada fora do Foundry.
 *
 * Cada condição tem:
 *  - descricao: o que ela é (texto da lista oficial);
 *  - efeito: a regra escrita, mostrada no cartão;
 *  - efeitos: o que a ficha aplica sozinha. Chaves aceitas:
 *      testes, ataques, distancia, dano, defesa ............ penalidade (número negativo)
 *      atributos { id: n } ................................. penalidade em testes que usam o atributo
 *      pericias { id: n } .................................. penalidade em testes da perícia
 *      desvTestes, desvAtaques, desvAtaquesMagicos, desvIniciativa, desvResistencias, desvDano (true)
 *      desvPericias [ids]
 *      deslocamentoMult .................................... 0,5 = metade; 0 = parado (vale o mais severo)
 *      bloqueiaAcoes [ids], bloqueiaRequisitos [ids], bloqueiaMagias, bloqueiaMana, bloqueiaAtaques
 *      bloqueiaOrigens [ids de origem de habilidade]
 *      implica [ids] ...................................... outras condições que ficam ativas junto
 *      semRecuperar [recursos], recuperacaoMetade [recursos], semDescansoCurto
 *      dot [{ formula, recurso, opcional, seZerar }] ........ perda no início do turno
 *      turno "insano" ...................................... tabela rolada no início do turno
 *      vulneravel [tipos], anulaVulnerabilidade [tipos], suspendeBencaos
 *      mods [{ alvo, valor }] .............................. mesmos alvos das bênçãos
 *      avisos [textos] ..................................... lembretes que aparecem na aba Principal
 */

export const CATEGORIAS_CONDICAO = [
  { id: "basicas",     label: "Básicas",             icone: "fa-solid fa-circle-half-stroke" },
  { id: "esforco",     label: "Esforço e energia",   icone: "fa-solid fa-battery-quarter" },
  { id: "medo",        label: "Medo",                icone: "fa-solid fa-ghost" },
  { id: "imobilizacao",label: "Imobilização",        icone: "fa-solid fa-link" },
  { id: "sentidos",    label: "Sentidos",            icone: "fa-solid fa-eye-low-vision" },
  { id: "ferimentos",  label: "Ferimentos e corpo",  icone: "fa-solid fa-bone" },
  { id: "mente",       label: "Mente",               icone: "fa-solid fa-brain" },
  { id: "dor",         label: "Dor e colapso",       icone: "fa-solid fa-heart-crack" },
  { id: "magia",       label: "Magia e Núcleo",      icone: "fa-solid fa-hat-wizard" },
  { id: "elementos",   label: "Elementos",           icone: "fa-solid fa-droplet" }
];

const TODAS = ["padrao", "bonus", "movimento", "reacao", "livre", "lendaria", "mitica", "arcaica"];
const MESTRE = "Efeito definido pelo Mestre.";

/** [id, nome, categoria, descrição, efeito escrito, efeitos automáticos] */
const LISTA = [
  /* ---------------- Básicas (citadas pela lista) ---------------- */
  ["lento", "Lento", "basicas", "Movimentos mais lentos que o normal.", "Deslocamento reduzido pela metade.", { deslocamentoMult: 0.5 }],
  ["imovel", "Imóvel", "basicas", "Não consegue sair do lugar.", "Deslocamento 0.", { deslocamentoMult: 0 }],
  ["impedido", "Impedido", "basicas", "Algo impede o personagem de se deslocar.", "Deslocamento 0.", { deslocamentoMult: 0 }],
  ["preso", "Preso", "basicas", "Agarrado ou amarrado.", "Não pode se deslocar. Habilidades e magias com requisito gestual ou de movimento ficam bloqueadas.", { deslocamentoMult: 0, bloqueiaRequisitos: ["gestual", "movimento"] }],
  ["caido", "Caído", "basicas", "No chão.", "Rastejando: deslocamento pela metade e desvantagem em ataques.", { deslocamentoMult: 0.5, desvAtaques: true }],
  ["enredado", "Enredado", "basicas", "Enroscado em vinhas, redes, cordas ou raízes.", MESTRE, {}],
  ["atolado", "Atolado", "basicas", "Preso em lama, areia ou terreno que suga.", MESTRE, {}],
  ["paralisado", "Paralisado", "basicas", "O corpo não responde.", "Não pode agir, se mover nem falar.", { deslocamentoMult: 0, bloqueiaAcoes: TODAS, bloqueiaRequisitos: ["verbal", "gestual", "movimento"] }],
  ["desestabilizado", "Desestabilizado", "basicas", "Sem equilíbrio.", MESTRE, {}],
  ["cego", "Cego", "basicas", "Não enxerga.", "Bloqueia o que exige visão. Desvantagem em ataques.", { bloqueiaRequisitos: ["visao"], desvAtaques: true }],
  ["surdo", "Surdo", "basicas", "Não ouve.", "Bloqueia o que exige audição.", { bloqueiaRequisitos: ["audicao"] }],
  ["desorientado", "Desorientado", "basicas", "Perdeu a noção de onde está.", MESTRE, {}],
  ["desprevenido", "Desprevenido", "basicas", "Não está pronto para se defender.", MESTRE, {}],
  ["surpreendido", "Surpreendido", "basicas", "Pego de surpresa.", MESTRE, {}],
  ["silenciado", "Silenciado", "basicas", "Não consegue falar.", "Bloqueia o que tem requisito verbal.", { bloqueiaRequisitos: ["verbal"] }],
  ["apavorado", "Apavorado", "basicas", "Tomado pelo medo.", MESTRE, {}],
  ["abalado", "Abalado", "basicas", "Inseguro e nervoso.", MESTRE, {}],
  ["fugindo", "Fugindo", "basicas", "Só pensa em escapar.", MESTRE, {}],
  ["atordoado", "Atordoado", "basicas", "Zonzo depois de um impacto.", "Não pode agir nem se mover.", { deslocamentoMult: 0, bloqueiaAcoes: ["padrao", "bonus", "movimento", "reacao"] }],
  ["incapacitado", "Incapacitado", "basicas", "Sem condições de agir.", "Não pode realizar ações.", { bloqueiaAcoes: TODAS }],
  ["inconsciente", "Inconsciente", "basicas", "Desacordado.", "Não age, não se move e não percebe o entorno.", { deslocamentoMult: 0, bloqueiaAcoes: TODAS }],
  ["dormindo", "Dormindo", "basicas", "Adormecido.", "Não age nem percebe o entorno. Acorda ao sofrer dano ou ser sacudido.", { deslocamentoMult: 0, bloqueiaAcoes: TODAS }],
  ["indefeso", "Indefeso", "basicas", "Sem como se proteger.", MESTRE, {}],
  ["debilitado", "Debilitado", "basicas", "Corpo enfraquecido.", MESTRE, {}],
  ["fraco", "Fraco", "basicas", "Sem forças.", MESTRE, {}],
  ["vulneravel", "Vulnerável", "basicas", "Exposto a golpes.", MESTRE, {}],
  ["em-chamas", "Em Chamas", "basicas", "Pegando fogo.", MESTRE, {}],
  ["sangrando", "Sangrando", "basicas", "Perdendo sangue.", MESTRE, {}],
  ["envenenado", "Envenenado", "basicas", "Com veneno no corpo.", MESTRE, {}],
  ["enfermo", "Enfermo", "basicas", "Doente.", MESTRE, {}],
  ["confuso", "Confuso", "basicas", "Pensamentos embaralhados.", MESTRE, {}],
  ["alucinado", "Alucinado", "basicas", "Vê e ouve o que não existe.", MESTRE, {}],
  ["dominado", "Dominado", "basicas", "Controlado por outra criatura.", MESTRE, {}],
  ["esmorecido", "Esmorecido", "basicas", "Sem ânimo.", MESTRE, {}],
  ["frustrado", "Frustrado", "basicas", "Abatido pelos fracassos.", MESTRE, {}],
  ["nucleo-selado", "Núcleo Selado", "basicas", "O Núcleo foi lacrado.", MESTRE, {}],
  ["mana-instavel", "Mana Instável", "basicas", "A mana oscila sem controle.", MESTRE, {}],
  ["aura-exposta", "Aura Exposta", "basicas", "A aura fica visível para quem sabe olhar.", MESTRE, {}],
  ["amaldicoado", "Amaldiçoado", "basicas", "Sob uma maldição.", MESTRE, {}],
  ["revelado", "Revelado", "basicas", "Exposto por magia de revelação.", MESTRE, {}],
  ["invisivel", "Invisível", "basicas", "Não pode ser visto sem meios especiais.", "Não pode ser visto sem meios especiais.", {}],
  ["voando", "Voando", "basicas", "Está no ar.", "Está no ar.", {}],
  // 0.6.0: efeitos da árvore elemental (Ar e Sombra); reaproveitam ícones parecidos
  ["flutuando", "Flutuando", "elementos", "Erguido por correntes de ar.", "Fica no ar sem controle: deslocamento 0 até o fim do próximo turno e desvantagem em ataques corpo a corpo.", { deslocamentoMult: 0, avisos: ["Flutuando: desvantagem em ataques corpo a corpo"] }, "voando"],
  ["assustado", "Assustado", "medo", "Sombras tomam a mente.", "Desvantagem no próximo teste ou ataque.", { avisos: ["Assustado: desvantagem no próximo teste ou ataque"] }, "medo-absoluto"],
  ["concentrado", "Concentrado", "basicas", "Mantendo uma habilidade ou magia que exige concentração.", "Mantendo uma habilidade ou magia que exige concentração.", {}],

  /* ---------------- Esforço e energia ---------------- */
  ["exaurido", "Exaurido", "esforco", "Estado de esgotamento extremo causado por esforço físico ou mental prolongado.",
    "Sofre −10 em todos os testes, ataques e dano. Não pode correr ou investir.", { testes: -10, ataques: -10, dano: -10, avisos: ["Não pode correr ou investir"] }],
  ["desgastado", "Desgastado", "esforco", "Estado de desgaste que compromete a recuperação natural das energias do corpo.",
    "Não pode recuperar PV, PE ou PM enquanto estiver sob esta condição.", { semRecuperar: ["pv", "pe", "pm"] }],
  ["esgotado", "Esgotado", "esforco", "Estado em que o personagem não possui energia suficiente para executar todas as suas ações.",
    "Perde sua Ação Bônus e Reação.", { bloqueiaAcoes: ["bonus", "reacao"] }],
  ["extenuado", "Extenuado", "esforco", "Estado de cansaço severo que compromete a mobilidade e a capacidade de reação.",
    "Seu deslocamento é reduzido à metade e sofre −5 na Defesa.", { deslocamentoMult: 0.5, defesa: -5 }],
  ["sobrecarregado-de-mana", "Sobrecarregado de Mana", "esforco", "O Núcleo está acumulando mais energia mágica do que consegue suportar.",
    "Sofre −10 em testes de Núcleo e não pode conjurar magias de Ascensão.", { atributos: { nucleo: -10 }, avisos: ["Não pode conjurar magias de Ascensão"] }],
  ["drenagem-vital", "Drenagem Vital", "esforco", "A energia vital do personagem está sendo continuamente extraída por uma força externa.",
    "Perde 1d10 PV no início de cada turno. A recuperação de PV é reduzida pela metade.", { dot: [{ formula: "1d10", recurso: "pv" }], recuperacaoMetade: ["pv"] }],
  ["drenagem-de-esforco", "Drenagem de Esforço", "esforco", "Os pontos de esforço estão sendo consumidos continuamente por algum efeito.",
    "Perde 1d10 PE no início de cada turno. Caso não possua PE, fica Fraco.", { dot: [{ formula: "1d10", recurso: "pe", seZerar: "epm-fraco" }] }],
  ["privacao-de-sono", "Privação de Sono", "esforco", "O personagem sofre com a ausência prolongada de descanso adequado.",
    "Sofre −5 em todos os testes e não pode realizar descansos curtos.", { testes: -5, semDescansoCurto: true }],
  ["colapso-fisico", "Colapso Físico", "esforco", "O corpo atingiu seu limite e perdeu a capacidade de executar movimentos adequadamente.",
    "Não pode realizar Ações Bônus ou Reações e fica Lento.", { bloqueiaAcoes: ["bonus", "reacao"], implica: ["epm-lento"] }],
  ["colapso-arcano", "Colapso Arcano", "esforco", "O Núcleo perdeu sua estabilidade e não consegue sustentar o funcionamento normal da mana.",
    "Não pode recuperar PM e sofre −10 em testes de Núcleo.", { semRecuperar: ["pm"], atributos: { nucleo: -10 } }],
  ["desajeitado", "Desajeitado", "esforco", "O personagem perdeu parte de sua coordenação motora e precisão de movimentos.",
    "Sofre −5 em testes, ataques e Defesa.", { testes: -5, ataques: -5, defesa: -5 }],
  ["enfraquecido", "Enfraquecido", "esforco", "O personagem está com sua capacidade geral de agir e resistir severamente comprometida.",
    "Sofre −5 em todos os testes, ataques e dano.", { testes: -5, ataques: -5, dano: -5 }],
  ["drenado", "Drenado", "esforco", "O personagem teve parte de sua vitalidade e resistência natural extraídas.",
    "Sofre −5 em testes de Vigor e perde 10 PV máximos.", { atributos: { constituicao: -5 }, mods: [{ alvo: "recurso.pv", valor: -10 }] }],

  /* ---------------- Medo ---------------- */
  ["aterrorizado", "Aterrorizado", "medo", "O personagem está tomado por um terror intenso que compromete sua capacidade de enfrentar ameaças.",
    "Fica Apavorado e não pode realizar Reações.", { implica: ["epm-apavorado"], bloqueiaAcoes: ["reacao"] }],
  ["horrorizado", "Horrorizado", "medo", "O personagem está profundamente assustado com algo que considera uma ameaça terrível.",
    "Não pode se aproximar da fonte do medo e sofre −10 em todos os testes enquanto estiver em sua presença.", { testes: -10, avisos: ["Não pode se aproximar da fonte do medo"] }],
  ["traumatizado", "Traumatizado", "medo", "Uma experiência passada deixou uma marca psicológica que provoca medo intenso diante de situações semelhantes.",
    "Sempre que encontrar a fonte do trauma, fica Abalado. Caso já esteja Abalado, fica Apavorado.", {}],
  ["covarde", "Covarde", "medo", "O personagem perdeu a disposição de enfrentar determinada ameaça.",
    "Não pode realizar ataques contra a fonte do medo e sofre −5 na Defesa enquanto estiver próximo dela.", { defesa: -5, avisos: ["Não pode atacar a fonte do medo"] }],
  ["desesperado", "Desesperado", "medo", "O personagem está tomado pelo desespero e prioriza sua própria sobrevivência acima de qualquer outra coisa.",
    "Deve utilizar suas ações para fugir. Não pode realizar ataques ou conjurar magias ofensivas.", { bloqueiaAtaques: true, avisos: ["Deve usar as ações para fugir"] }],
  ["intimidado", "Intimidado", "medo", "O personagem se sente inferior ou ameaçado pela presença de outra criatura.",
    "Sofre −10 em testes e ataques contra a criatura responsável pelo efeito.", { avisos: ["−10 em testes e ataques contra quem intimidou"] }],
  ["panico", "Pânico", "medo", "O medo tomou completamente o controle das decisões do personagem.",
    "Fica Fugindo e não pode realizar Reações.", { implica: ["epm-fugindo"], bloqueiaAcoes: ["reacao"] }],
  ["terror-sobrenatural", "Terror Sobrenatural", "medo", "O personagem está diante de uma presença cuja natureza sobrenatural provoca um medo extremo.",
    "Fica Apavorado e não pode recuperar PV, PE ou PM enquanto estiver na presença da fonte do medo.", { implica: ["epm-apavorado"], semRecuperar: ["pv", "pe", "pm"] }],
  ["paranoico", "Paranoico", "medo", "O personagem desenvolveu uma desconfiança irracional, passando a enxergar ameaças em situações comuns.",
    "Não consegue distinguir aliados de ameaças. Não pode receber benefícios de habilidades de aliados.", { avisos: ["Não recebe benefícios de habilidades de aliados"] }],
  ["medo-absoluto", "Medo Absoluto", "medo", "O personagem está completamente dominado pelo medo, incapaz de reagir racionalmente à sua fonte.",
    "Fica Incapacitado enquanto estiver diante da fonte do medo.", { implica: ["epm-incapacitado"] }],

  /* ---------------- Imobilização ---------------- */
  ["imobilizado", "Imobilizado", "imobilizacao", "O personagem teve seus movimentos completamente restringidos por uma força externa.",
    "Fica Impedido e não pode realizar ações de movimento.", { implica: ["epm-impedido"], bloqueiaAcoes: ["movimento"] }],
  ["contido", "Contido", "imobilizacao", "O personagem está preso por correntes, cordas, magia ou qualquer outro meio que impeça sua movimentação.",
    "Fica Imóvel e Indefeso. Só pode realizar ações para tentar escapar.", { implica: ["epm-imovel", "epm-indefeso"], avisos: ["Só pode agir para tentar escapar"] }],
  ["aprisionado", "Aprisionado", "imobilizacao", "O personagem está preso em uma estrutura, espaço ou efeito do qual não consegue escapar normalmente.",
    "Fica Imóvel e não pode utilizar habilidades ou magias que permitam deslocamento, teleporte ou fuga.", { implica: ["epm-imovel"], avisos: ["Sem habilidades de deslocamento, teleporte ou fuga"] }],
  ["travado", "Travado", "imobilizacao", "O corpo do personagem perdeu a capacidade de executar determinados movimentos voluntários.",
    "Não pode realizar Reações, Ações Bônus ou ações de movimento.", { bloqueiaAcoes: ["reacao", "bonus", "movimento"] }],
  ["enraizado", "Enraizado", "imobilizacao", "O personagem está preso ao terreno por raízes, vinhas ou forças semelhantes.",
    "Fica Imóvel e não pode ser deslocado por efeitos externos.", { implica: ["epm-imovel"] }],
  ["rigidez-muscular", "Rigidez Muscular", "imobilizacao", "Os músculos perderam sua flexibilidade e capacidade de responder adequadamente aos comandos do corpo.",
    "Sofre −10 em todos os testes de Força e Destreza e fica Lento.", { atributos: { forca: -10, destreza: -10 }, implica: ["epm-lento"] }],
  ["paralisia-total", "Paralisia Total", "imobilizacao", "O sistema nervoso ou a musculatura foi completamente comprometido, impedindo movimentos voluntários.",
    "Fica Paralisado e não pode realizar testes para escapar de outras condições físicas.", { implica: ["epm-paralisado"] }],

  /* ---------------- Sentidos ---------------- */
  ["desorientado-sensorial", "Desorientado Sensorial", "sentidos", "O personagem perdeu a capacidade de interpretar corretamente os estímulos recebidos pelos sentidos.",
    "Sofre −10 em todos os testes de Percepção e fica Desprevenido.", { pericias: { percepcao: -10 }, implica: ["epm-desprevenido"] }],
  ["cegueira-total", "Cegueira Total", "sentidos", "O personagem perdeu completamente a capacidade de enxergar.",
    "Fica Cego e não consegue identificar criaturas ou objetos por visão.", { implica: ["epm-cego"] }],
  ["surdez-total", "Surdez Total", "sentidos", "O personagem perdeu completamente a capacidade de ouvir.",
    "Fica Surdo e não consegue perceber sons ou utilizar habilidades que dependam de audição.", { implica: ["epm-surdo"] }],
  ["privado-de-sentidos", "Privado de Sentidos", "sentidos", "O personagem perdeu a capacidade de perceber o ambiente através de seus sentidos naturais.",
    "Não pode utilizar visão, audição, olfato, paladar ou tato para perceber o ambiente. Fica Desprevenido e Surpreendido contra ameaças que não consiga detectar.",
    { bloqueiaRequisitos: ["visao", "audicao"], implica: ["epm-desprevenido", "epm-surpreendido"] }],
  ["visao-distorcida", "Visão Distorcida", "sentidos", "A percepção visual está comprometida por distorções, ilusões ou alterações na visão.",
    "Sofre desvantagem em todos os ataques e testes de Percepção visual.", { desvAtaques: true, desvPericias: ["percepcao"] }],
  ["vertigem", "Vertigem", "sentidos", "O personagem perdeu a percepção correta de equilíbrio, altura e orientação espacial.",
    "Sofre −10 em testes de Destreza e fica Desestabilizado. Não pode voar ou utilizar deslocamento aéreo.", { atributos: { destreza: -10 }, implica: ["epm-desestabilizado"], avisos: ["Não pode voar"] }],
  ["confusao-espacial", "Confusão Espacial", "sentidos", "O personagem não consegue interpretar corretamente distâncias, direções ou sua posição no ambiente.",
    "Sofre −10 em ataques à distância e testes de Percepção.", { distancia: -10, pericias: { percepcao: -10 } }],
  ["privacao-de-visao", "Privação de Visão", "sentidos", "O personagem está impossibilitado de enxergar determinadas criaturas ou fenômenos, mesmo que consiga perceber o restante do ambiente.",
    "Não consegue perceber criaturas Invisíveis, mesmo quando sua localização é conhecida.", {}],
  ["eco-sensorial", "Eco Sensorial", "sentidos", "O personagem percebe estímulos sensoriais inexistentes, como vozes, movimentos e ruídos.",
    "Sofre desvantagem em testes de Percepção e Iniciativa.", { desvPericias: ["percepcao"], desvIniciativa: true }],
  ["sobrecarga-sensorial", "Sobrecarga Sensorial", "sentidos", "O personagem está recebendo estímulos sensoriais em intensidade superior à sua capacidade de processamento.",
    "Fica Atordoado e sofre −10 em testes de Percepção enquanto estiver exposto ao estímulo responsável.", { implica: ["epm-atordoado"], pericias: { percepcao: -10 } }],

  /* ---------------- Ferimentos e corpo ---------------- */
  ["hemorragia-grave", "Hemorragia Grave", "ferimentos", "O personagem sofre uma perda intensa e contínua de sangue.",
    "Perde 2d6 PV no início de cada turno. Não pode recuperar PV enquanto estiver sob esta condição.", { dot: [{ formula: "2d6", recurso: "pv" }], semRecuperar: ["pv"] }],
  ["fraturado", "Fraturado", "ferimentos", "O personagem possui um ou mais ossos quebrados, comprometendo a região afetada.",
    "Sofre −10 em todos os testes e ataques que dependam da região afetada. Caso seja nas pernas, fica Lento.", { avisos: ["−10 no que depende da região fraturada"] }],
  ["mutilado", "Mutilado", "ferimentos", "O personagem perdeu permanentemente ou temporariamente uma parte do corpo.",
    "Não pode utilizar a região do corpo afetada.", {}],
  ["necrosado", "Necrosado", "ferimentos", "Parte do tecido corporal está sofrendo morte celular, perdendo sua vitalidade e capacidade de funcionamento.",
    "Sofre 1d6 de dano no início de cada turno e não pode recuperar PV por meios convencionais.", { dot: [{ formula: "1d6", recurso: "pv" }], semRecuperar: ["pv"] }],
  ["queimado", "Queimado", "ferimentos", "O personagem sofreu lesões causadas por exposição intensa ao calor ou ao fogo.",
    "Sofre −10 em testes de Destreza e perde 1d6 PV no início de cada turno.", { atributos: { destreza: -10 }, dot: [{ formula: "1d6", recurso: "pv" }] }],
  ["asfixia-grave", "Asfixia Grave", "ferimentos", "O personagem está impossibilitado de respirar adequadamente.",
    "Não pode respirar. Perde 2d6 PV por rodada após esgotar sua capacidade de prender a respiração.", { dot: [{ formula: "2d6", recurso: "pv", opcional: true }] }],
  ["envenenamento-sistemico", "Envenenamento Sistêmico", "ferimentos", "Uma substância tóxica se espalhou pelo organismo, comprometendo seu funcionamento.",
    "Sofre −10 em todos os testes e perde 1d6 PV no início de cada turno.", { testes: -10, dot: [{ formula: "1d6", recurso: "pv" }] }],
  ["deformado", "Deformado", "ferimentos", "O corpo sofreu alterações físicas severas que modificaram sua estrutura natural.",
    "Sofre −10 em testes de Força e Destreza. Não pode utilizar habilidades que dependam da região deformada.", { atributos: { forca: -10, destreza: -10 } }],
  ["hemiplegico", "Hemiplégico", "ferimentos", "O personagem perdeu o controle motor de um dos lados do corpo.",
    "Não pode utilizar um dos lados do corpo. Sofre −10 em testes físicos e fica Lento.", { atributos: { forca: -10, destreza: -10, constituicao: -10 }, implica: ["epm-lento"] }],
  ["choque-traumatico", "Choque Traumático", "ferimentos", "O organismo sofreu um trauma extremo que comprometeu suas funções físicas e mentais.",
    "Fica Debilitado e Incapacitado. Não pode recuperar PV por meios naturais.", { implica: ["epm-debilitado", "epm-incapacitado"], semRecuperar: ["pv"] }],

  /* ---------------- Mente ---------------- */
  ["insano", "Insano", "mente", "O personagem perdeu a capacidade de distinguir adequadamente a realidade de suas próprias percepções.",
    "No início de cada turno, role 1d6: 1-2 perde o turno; 3-4 ataca a criatura mais próxima; 5-6 age normalmente.", { turno: "insano" }],
  ["obnubilado", "Obnubilado", "mente", "O raciocínio está profundamente comprometido, dificultando a compreensão e interpretação de informações.",
    "Sofre −10 em testes de Inteligência e Autocontrole. Não pode utilizar habilidades que exijam raciocínio complexo.", { atributos: { inteligencia: -10, autocontrole: -10 } }],
  ["subjugado", "Subjugado", "mente", "A vontade do personagem foi completamente submetida ao controle de outra criatura.",
    "Fica Dominado e não pode realizar testes para resistir ao controlador enquanto a fonte persistir.", { implica: ["epm-dominado"] }],
  ["apatico", "Apático", "mente", "O personagem perdeu o interesse, a motivação e a capacidade de demonstrar reações emocionais.",
    "Não pode realizar ações ofensivas voluntariamente e sofre −10 em testes de Carisma.", { atributos: { carisma: -10 }, bloqueiaAtaques: true }],
  ["desesperanca", "Desesperança", "mente", "O personagem perdeu a esperança de superar sua situação, acreditando que qualquer esforço será inútil.",
    "Sofre −10 em todos os testes e não pode receber benefícios de Inspiração.", { testes: -10 }],
  ["amnesico", "Amnésico", "mente", "O personagem perdeu parte ou a totalidade de suas memórias.",
    "Não consegue utilizar habilidades que dependam de conhecimentos ou informações armazenadas.", {}],
  ["delirante", "Delirante", "mente", "O personagem apresenta pensamentos e percepções desconexos, confundindo acontecimentos reais.",
    "Não consegue distinguir aliados de inimigos e sofre desvantagem em todos os ataques.", { desvAtaques: true, avisos: ["Não distingue aliados de inimigos"] }],
  ["maniaco", "Maníaco", "mente", "O personagem desenvolveu uma obsessão extrema que domina seus pensamentos e comportamentos.",
    "Deve perseguir e atacar um alvo escolhido pela fonte da condição.", { avisos: ["Persegue e ataca o alvo da obsessão"] }],
  ["subconsciente", "Subconsciente", "mente", "O personagem perdeu o controle consciente sobre suas próprias ações.",
    "Fica Confuso e não pode realizar Reações.", { implica: ["epm-confuso"], bloqueiaAcoes: ["reacao"] }],
  ["quebrado-mentalmente", "Quebrado Mentalmente", "mente", "O personagem sofreu um colapso psicológico profundo, comprometendo sua identidade e estabilidade mental.",
    "Fica Esmorecido, Frustrado e Incapacitado.", { implica: ["epm-esmorecido", "epm-frustrado", "epm-incapacitado"] }],
  ["estupefato", "Estupefato", "mente", "O personagem está com suas capacidades cognitivas e concentração comprometidas.",
    "Sofre −5 em testes de Inteligência, Autocontrole e Núcleo.", { atributos: { inteligencia: -5, autocontrole: -5, nucleo: -5 } }],

  /* ---------------- Dor e colapso ---------------- */
  ["agonia", "Agonia", "dor", "O personagem está submetido a um sofrimento físico ou mental extremo.",
    "Sofre −10 em todos os testes, ataques e dano. Não pode realizar Reações.", { testes: -10, ataques: -10, dano: -10, bloqueiaAcoes: ["reacao"] }],
  ["tormento", "Tormento", "dor", "O personagem está sendo submetido a um sofrimento contínuo provocado por uma força externa.",
    "Sofre 2d6 de dano no início de cada turno e fica Debilitado.", { dot: [{ formula: "2d6", recurso: "pv" }], implica: ["epm-debilitado"] }],
  ["choque", "Choque", "dor", "O organismo sofreu uma reação abrupta diante de um impacto físico, psicológico ou sobrenatural.",
    "Fica Atordoado e Desprevenido. Não pode realizar Reações.", { implica: ["epm-atordoado", "epm-desprevenido"], bloqueiaAcoes: ["reacao"] }],
  ["desfigurado", "Desfigurado", "dor", "O personagem teve sua aparência física severamente alterada por ferimentos ou deformações.",
    "Sofre −10 em testes de Carisma e Percepção.", { atributos: { carisma: -10 }, pericias: { percepcao: -10 } }],
  ["colapso", "Colapso", "dor", "O personagem sofreu uma falha generalizada de suas capacidades físicas e mentais.",
    "Fica Debilitado, Esmorecido e Incapacitado.", { implica: ["epm-debilitado", "epm-esmorecido", "epm-incapacitado"] }],
  ["sofrimento", "Sofrimento", "dor", "O personagem está enfrentando uma condição persistente de dor e desconforto intenso.",
    "Sofre −5 em todos os testes e perde 1d6 PV no início de cada turno.", { testes: -5, dot: [{ formula: "1d6", recurso: "pv" }] }],
  ["descontrole", "Descontrole", "dor", "O personagem perdeu a capacidade de controlar adequadamente suas próprias reações e impulsos.",
    "Sofre −10 em testes de Autocontrole e não consegue controlar adequadamente suas ações.", { atributos: { autocontrole: -10 } }],
  ["agonizante", "Agonizante", "dor", "O personagem está em um estado crítico, próximo de perder completamente suas funções vitais.",
    "Fica Debilitado, Lento e Vulnerável.", { implica: ["epm-debilitado", "epm-lento", "epm-vulneravel"] }],
  ["rendido", "Rendido", "dor", "O personagem desistiu de continuar lutando e se encontra em estado de submissão.",
    "Não pode realizar ações ofensivas ou Reações.", { bloqueiaAtaques: true, bloqueiaAcoes: ["reacao"] }],
  ["morto-vivo-instavel", "Morto-Vivo Instável", "dor", "A existência do morto-vivo está comprometida, fazendo sua estrutura sobrenatural perder estabilidade.",
    "Sofre −10 em todos os testes e perde 1d6 PV no início de cada turno.", { testes: -10, dot: [{ formula: "1d6", recurso: "pv" }] }],

  /* ---------------- Magia e Núcleo ---------------- */
  ["antimagia", "Antimagia", "magia", "O personagem está sob influência de uma força que impede a manifestação de magia ao seu redor ou através dele.",
    "Não pode conjurar magias, utilizar habilidades mágicas ou receber efeitos mágicos.", { bloqueiaMagias: true, avisos: ["Não recebe efeitos mágicos"] }],
  ["silencio-arcano", "Silêncio Arcano", "magia", "A capacidade de produzir ou manipular encantamentos verbais foi magicamente bloqueada.",
    "Não pode conjurar magias ou utilizar habilidades que dependam de componentes verbais.", { bloqueiaRequisitos: ["verbal"] }],
  ["supressao-magica", "Supressão Mágica", "magia", "A energia responsável por sustentar efeitos mágicos foi anulada.",
    "Todos os efeitos mágicos ativos sobre o personagem são encerrados. Não pode receber novos efeitos mágicos.", { avisos: ["Efeitos mágicos sobre você terminam"] }],
  ["vinculo-quebrado", "Vínculo Quebrado", "magia", "Uma conexão sobrenatural que concedia poderes ou estabelecia uma ligação foi rompida.",
    "Perde acesso aos poderes concedidos por pactos, contratos, bênçãos ou vínculos mágicos.", { suspendeBencaos: true }],
  ["distorcao-arcana", "Distorção Arcana", "magia", "A energia mágica do personagem está desordenada e se manifesta de maneira imprevisível.",
    "Sofre −10 em testes de Núcleo e todos os seus ataques mágicos possuem desvantagem.", { atributos: { nucleo: -10 }, desvAtaquesMagicos: true }],
  ["maldicao-profunda", "Maldição Profunda", "magia", "O personagem está sob uma maldição poderosa que interfere diretamente em sua existência.",
    "Sofre −10 em todos os testes e não pode remover condições negativas por meios convencionais.", { testes: -10, avisos: ["Condições negativas não saem por meios convencionais"] }],
  ["bloqueio-de-mana", "Bloqueio de Mana", "magia", "O fluxo de mana foi interrompido, impedindo sua utilização normal.",
    "Não pode recuperar PM e não pode conjurar magias.", { semRecuperar: ["pm"], bloqueiaMagias: true }],
  ["ruptura-espiritual", "Ruptura Espiritual", "magia", "A conexão entre o corpo e sua essência espiritual foi danificada.",
    "Não pode utilizar habilidades que dependam da alma, espírito ou essência vital.", {}],
  ["exposicao-arcana", "Exposição Arcana", "magia", "A aura do personagem está completamente exposta, tornando sua essência mágica vulnerável.",
    "Todos os ataques mágicos contra o personagem possuem vantagem e ele sofre o dobro de dano mágico.", { vulneravel: ["Mágico"], avisos: ["Ataques mágicos contra você têm vantagem"] }],
  ["apagamento", "Apagamento", "magia", "A existência ou identidade sobrenatural do personagem está sendo temporariamente suprimida.",
    "Não pode utilizar habilidades raciais, de arquétipo ou poderes sobrenaturais.", { bloqueiaOrigens: ["raca", "arquetipo"] }],

  /* ---------------- Elementos ---------------- */
  ["molhado", "Molhado", "elementos", "O corpo ou equipamento do personagem está completamente encharcado ou coberto por água.",
    "Recebe o dobro de dano elétrico.", { vulneravel: ["Elétrico"] }],
  ["eletrizado", "Eletrizado", "elementos", "O organismo está carregado de energia elétrica, causando interferência no funcionamento muscular e nervoso.",
    "Sofre −5 em testes de Destreza e não pode realizar Reações.", { atributos: { destreza: -5 }, bloqueiaAcoes: ["reacao"] }],
  ["aterramento", "Aterramento", "elementos", "O personagem está conectado a uma superfície que permite a dissipação segura de cargas elétricas.",
    "Não recebe a vulnerabilidade elétrica de Molhado e impede que a eletricidade conduzida pelo seu corpo alcance outras criaturas.", { anulaVulnerabilidade: ["Elétrico"] }],
  ["enregelado", "Enregelado", "elementos", "O corpo está sendo afetado por frio intenso, comprometendo sua mobilidade e funcionamento muscular.",
    "Fica Lento e sofre −5 em testes de Destreza.", { implica: ["epm-lento"], atributos: { destreza: -5 } }],
  ["congelado", "Congelado", "elementos", "O corpo foi completamente envolvido ou endurecido pelo gelo, impedindo seu funcionamento normal.",
    "Fica Imóvel e Incapacitado. Recebe o dobro de dano contundente. Fogo encerra esta condição.", { implica: ["epm-imovel", "epm-incapacitado"], vulneravel: ["Impacto"] }],
  ["coberto-de-oleo", "Coberto de Óleo", "elementos", "O corpo ou equipamento está revestido por uma substância inflamável e escorregadia.",
    "Recebe o dobro de dano de fogo.", { vulneravel: ["Fogo"] }],
  ["corroido", "Corroído", "elementos", "O corpo ou equipamento está sofrendo deterioração causada por substâncias corrosivas.",
    "Equipamentos metálicos utilizados pelo personagem perdem seus benefícios de Defesa. Caso receba novamente, o equipamento afetado fica Quebrado.", { avisos: ["Armadura metálica não dá Defesa"] }]
];

/** Condições que existiam na 0.2.4 com outro nome (migração das fichas). */
export const CONDICOES_RENOMEADAS = {
  "epm-amedrontado": "epm-apavorado",
  "epm-queimando": "epm-em-chamas",
  "epm-eletrocutado": "epm-eletrizado"
};

export const CONDICOES_DADOS = LISTA.map(([slug, label, categoria, descricao, efeito, efeitos, iconeSlug]) => ({
  id: `epm-${slug}`, slug, label, categoria, descricao, efeito, efeitos: efeitos ?? {}, ...(iconeSlug ? { iconeSlug } : {})
}));

/**
 * Condições NÃO oficiais, tiradas da página "Condições" do Notion (só as que não existem na lista oficial).
 * Ficam numa aba à parte e só aparecem quando o Mestre liga "Condições do Notion" no Escudo (Ajustes).
 * `icone`: reaproveita um ícone parecido da lista oficial (não há arte própria).
 */
export const CATEGORIA_NOTION = { id: "notion", label: "Não oficiais (Notion)", icone: "fa-solid fa-book-bookmark", extra: true };
const LISTA_NOTION = [
  ["exausto", "Exausto", "exaurido", "Fadiga extrema.", "Fica Debilitado, Lento, com Postura Aberta e Núcleo Sobrecarregado. Se ficar Exausto de novo, fica Inconsciente.",
    { implica: ["epm-debilitado", "epm-lento", "epm-n-postura-aberta", "epm-n-nucleo-sobrecarregado"], avisos: ["Exausto de novo: fica Inconsciente"] }],
  ["fatigado", "Fatigado", "desgastado", "Cansaço acumulado.", "Fica Fraco e com Postura Aberta. Se ficar Fatigado de novo, torna-se Exausto.",
    { implica: ["epm-fraco", "epm-n-postura-aberta"], avisos: ["Fatigado de novo: torna-se Exausto"] }],
  ["nucleo-frustrado", "Núcleo Frustrado", "nucleo-selado", "O Núcleo resiste ao controle.", "−5 em testes de Núcleo.", { atributos: { nucleo: -5 } }],
  ["nucleo-sobrecarregado", "Núcleo Sobrecarregado", "sobrecarregado-de-mana", "O Núcleo passou do limite.", "−10 em testes de Núcleo.", { atributos: { nucleo: -10 } }],
  ["amedrontado", "Amedrontado", "covarde", "Medo de uma fonte específica.", "Desvantagem em todos os testes enquanto a fonte do medo estiver na sua linha de visão.",
    { desvTestes: true, avisos: ["Só enquanto a fonte do medo estiver à vista"] }],
  ["pasmo", "Pasmo", "estupefato", "Atônito.", "Não pode realizar ações.", { bloqueiaAcoes: ["padrao", "bonus", "movimento", "reacao"] }],
  ["agarrado", "Agarrado", "contido", "Seguro por outra criatura.", "−3 em testes físicos, só ataca com armas leves e fica Imóvel. Ataques à distância contra você têm 50% de chance de atingir a criatura errada.",
    { atributos: { forca: -3, destreza: -3, constituicao: -3 }, implica: ["epm-imovel"], avisos: ["Só ataca com armas leves", "Ataques à distância contra você: 50% de atingir quem agarra"] }],
  ["ofuscado", "Ofuscado", "privacao-de-visao", "Visão atrapalhada por luz ou brilho.", "Desvantagem em testes de ataque e de Percepção.", { desvAtaques: true, desvPericias: ["percepcao"] }],
  ["asfixiado", "Asfixiado", "asfixia-grave", "Sem conseguir respirar.", "Prende a respiração por rodadas iguais ao Constituição; depois, Fortitude por rodada (CD 5, +5 a cada teste). Se falhar, desmaia e perde 2d6 de Vida por rodada até respirar.",
    { dot: [{ formula: "2d6", recurso: "pv", opcional: true, rotulo: "Asfixia (depois de falhar na Fortitude)" }], avisos: ["Prende a respiração por rodadas = Constituição; depois Fortitude CD 5 (+5 por teste)"] }],
  ["doente", "Doente", "enfermo", "Sob efeito de uma doença.", "O efeito depende da doença (definido pelo Mestre).", { avisos: ["Efeito da doença: ver com o Mestre"] }],
  ["enjoado", "Enjoado", "vertigem", "Náusea forte.", "Só pode realizar uma ação por turno (Padrão ou Movimento); Bônus, Livre e ações Lendárias ou acima não.",
    { acoesMax: 1, bloqueiaAcoes: ["bonus", "livre", "lendaria", "mitica", "arcaica"] }],
  ["machucado", "Machucado", "fraturado", "Ferido.", "Tem menos da metade dos pontos de Vida totais.", {}],
  ["morrendo", "Morrendo", "agonizante", "À beira da morte.", "Está com 0 pontos de Vida.", { avisos: ["Com 0 de Vida"] }],
  ["postura-aberta", "Postura Aberta", "desprevenido", "Guarda baixa.", "−5 na Defesa.", { defesa: -5 }],
  ["sobrecarregado", "Sobrecarregado", "atolado", "Carga acima do limite.", "Penalidade de armadura −5 e deslocamento −3 m.",
    { pericias: { acrobacia: -5, atletismo: -5, furtividade: -5 }, mods: [{ alvo: "deslocamento", valor: -3 }] }],
  ["alquebrado", "Alquebrado", "drenagem-de-esforco", "Espírito abatido.", "Os custos de Mana e Estamina aumentam em +1.", { custoExtra: 1 }],
  ["fascinado", "Fascinado", "obnubilado", "Concentrado em algo.", "Não pode agir além de observar o fascínio; −10 em Percepção para o resto. Qualquer ação hostil contra você anula a condição; sacudir você tira dela (Ação Padrão).",
    { bloqueiaAcoes: ["padrao", "bonus", "movimento", "reacao"], pericias: { percepcao: -10 }, avisos: ["Ação hostil contra você encerra a condição"] }],
  ["enfeiticado", "Enfeitiçado", "dominado", "Sob encanto de alguém.", "Não pode atacar quem o enfeitiçou nem mirá-lo com efeitos nocivos. Quem enfeitiçou tem vantagem em testes sociais com você.",
    { avisos: ["Não ataca quem enfeitiçou", "Quem enfeitiçou tem vantagem em testes sociais com você"] }],
  ["petrificado", "Petrificado", "rigidez-muscular", "Transformado em pedra.", "Fica Inconsciente e recebe RD 20 contra dano.", { implica: ["epm-inconsciente"], rd: 20 }],
  ["desequilibrado", "Desequilibrado", "desestabilizado", "Sem firmeza (exemplo da magia Bolha de Mana).", "−3 na Defesa e nos ataques.", { defesa: -3, ataques: -3 }]
];
export const CONDICOES_NOTION_DADOS = LISTA_NOTION.map(([slug, label, iconeSlug, descricao, efeito, efeitos]) => ({
  id: `epm-n-${slug}`, slug: `n-${slug}`, iconeSlug, label, categoria: "notion", extra: true, descricao, efeito, efeitos: efeitos ?? {}
}));

/**
 * Combinações: valem quando as duas condições estão marcadas diretamente.
 * aplicar: condições que o botão liga; remover: condições que o botão desliga;
 * efeitos: entram na ficha sozinhos enquanto as duas estiverem ativas.
 */
export const COMBINACOES = [
  { id: "molhado-eletrizado", condicoes: ["epm-molhado", "epm-eletrizado"], titulo: "Molhado + Eletricidade",
    texto: "A eletricidade atinge todas as criaturas Molhadas em contato com a mesma fonte de água." },
  { id: "molhado-enregelado", condicoes: ["epm-molhado", "epm-enregelado"], titulo: "Molhado + Enregelado",
    texto: "A água no corpo congela rapidamente: fica Congelado.", aplicar: ["epm-congelado"] },
  { id: "molhado-chamas", condicoes: ["epm-molhado", "epm-em-chamas"], titulo: "Molhado + Em Chamas",
    texto: "A água apaga as chamas e pode criar uma área de vapor que obscurece a visão. Remove Molhado e Em Chamas.", remover: ["epm-molhado", "epm-em-chamas"] },
  { id: "molhado-aterramento", condicoes: ["epm-molhado", "epm-aterramento"], titulo: "Molhado + Aterramento",
    texto: "A carga elétrica se dissipa pelo solo: anula a vulnerabilidade elétrica de Molhado." },
  { id: "oleo-chamas", condicoes: ["epm-coberto-de-oleo", "epm-em-chamas"], titulo: "Coberto de Óleo + Em Chamas",
    texto: "O óleo entra em combustão e intensifica o incêndio: recebe o dobro de dano de fogo." },
  { id: "enregelado-lento", condicoes: ["epm-enregelado", "epm-lento"], titulo: "Enregelado + Lento",
    texto: "O frio intensifica a perda de mobilidade: fica Impedido.", aplicar: ["epm-impedido"] },
  { id: "atolado-enredado", condicoes: ["epm-atolado", "epm-enredado"], titulo: "Atolado + Enredado",
    texto: "O terreno e os materiais prendem completamente o personagem: fica Contido.", aplicar: ["epm-contido"] },
  { id: "enredado-chamas", condicoes: ["epm-enredado", "epm-em-chamas"], titulo: "Enredado + Em Chamas",
    texto: "O fogo pode consumir o que prende o personagem: encerra Enredado se o material for destruído.", remover: ["epm-enredado"] },
  { id: "sangrando-hemorragia", condicoes: ["epm-sangrando", "epm-hemorragia-grave"], titulo: "Sangrando + Hemorragia Grave",
    texto: "A perda de sangue se intensifica: os danos recorrentes se acumulam." },
  { id: "hemorragia-drenado", condicoes: ["epm-hemorragia-grave", "epm-drenado"], titulo: "Hemorragia Grave + Drenado",
    texto: "A perda de PV e de PV máximos acontece normalmente pelas duas condições." },
  { id: "envenenado-enfermo", condicoes: ["epm-envenenado", "epm-enfermo"], titulo: "Envenenado + Enfermo",
    texto: "O veneno agrava a doença: −10 em todos os testes.", efeitos: { testes: -10 } },
  { id: "fraturado-desajeitado", condicoes: ["epm-fraturado", "epm-desajeitado"], titulo: "Fraturado + Desajeitado",
    texto: "A lesão compromete ainda mais a coordenação: −10 em testes de Destreza.", efeitos: { atributos: { destreza: -10 } } },
  { id: "cego-surdo", condicoes: ["epm-cego", "epm-surdo"], titulo: "Cego + Surdo",
    texto: "Sem os dois principais sentidos: fica Privado de Sentidos.", aplicar: ["epm-privado-de-sentidos"] },
  { id: "cego-desorientado", condicoes: ["epm-cego", "epm-desorientado"], titulo: "Cego + Desorientado",
    texto: "Não consegue localizar ameaças: fica Desprevenido e Surpreendido.", aplicar: ["epm-desprevenido", "epm-surpreendido"] },
  { id: "abalado-apavorado", condicoes: ["epm-abalado", "epm-apavorado"], titulo: "Abalado + Apavorado",
    texto: "O medo vira fuga: fica Fugindo.", aplicar: ["epm-fugindo"] },
  { id: "apavorado-dominado", condicoes: ["epm-apavorado", "epm-dominado"], titulo: "Apavorado + Dominado",
    texto: "O controle externo prevalece sobre o medo: Dominado decide as ações enquanto durar." },
  { id: "confuso-alucinado", condicoes: ["epm-confuso", "epm-alucinado"], titulo: "Confuso + Alucinado",
    texto: "Realidade e percepção se misturam de vez: fica Insano.", aplicar: ["epm-insano"] },
  { id: "esmorecido-frustrado", condicoes: ["epm-esmorecido", "epm-frustrado"], titulo: "Esmorecido + Frustrado",
    texto: "O desgaste mental se intensifica: fica Quebrado Mentalmente.", aplicar: ["epm-quebrado-mentalmente"] },
  { id: "atordoado-desprevenido", condicoes: ["epm-atordoado", "epm-desprevenido"], titulo: "Atordoado + Desprevenido",
    texto: "Incapaz de reagir a ameaças: fica em Choque.", aplicar: ["epm-choque"] },
  { id: "debilitado-fraco", condicoes: ["epm-debilitado", "epm-fraco"], titulo: "Debilitado + Fraco",
    texto: "O corpo para de funcionar direito: fica Incapacitado.", aplicar: ["epm-incapacitado"] },
  { id: "drenado-colapso-arcano", condicoes: ["epm-drenado", "epm-colapso-arcano"], titulo: "Drenado + Colapso Arcano",
    texto: "A falha do Núcleo piora: fica com Núcleo Selado.", aplicar: ["epm-nucleo-selado"] },
  { id: "sobrecarregado-instavel", condicoes: ["epm-sobrecarregado-de-mana", "epm-mana-instavel"], titulo: "Núcleo Sobrecarregado + Mana Instável",
    texto: "O excesso de energia aumenta a instabilidade: fica com Distorção Arcana.", aplicar: ["epm-distorcao-arcana"] },
  { id: "selado-bloqueio", condicoes: ["epm-nucleo-selado", "epm-bloqueio-de-mana"], titulo: "Núcleo Selado + Bloqueio de Mana",
    texto: "O fluxo mágico para por completo: não pode usar habilidades que dependam de mana.", efeitos: { bloqueiaMana: true } },
  { id: "aura-exposicao", condicoes: ["epm-aura-exposta", "epm-exposicao-arcana"], titulo: "Aura Exposta + Exposição Arcana",
    texto: "A localização mágica do personagem pode ser percebida facilmente e ele sofre os efeitos das duas condições." },
  { id: "amaldicoado-profunda", condicoes: ["epm-amaldicoado", "epm-maldicao-profunda"], titulo: "Amaldiçoado + Maldição Profunda",
    texto: "A maldição se fortalece: não pode ser removida por meios convencionais." },
  { id: "invisivel-revelado", condicoes: ["epm-invisivel", "epm-revelado"], titulo: "Invisível + Revelado",
    texto: "Invisível deixa de ocultar o personagem da fonte de Revelado." }
];
