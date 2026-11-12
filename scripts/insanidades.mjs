/**
 * Insanidades (PDF "lista_100_insanidades_RPG_nitro_final", enviado pela usuária em 11/11/2026).
 * Só dados. Temporárias: role 1d100. O PDF não traz os números 41, 61 e 88: caindo neles, rola de novo.
 * `condicoes`: condições da ficha que a insanidade liga enquanto durar (só onde o texto deixa claro).
 * Permanentes: role 1d100 na faixa (o PDF escreve "31-55" para Psicose; aqui ficou 51-55).
 */

const TEMPORARIAS = [
  [1, "Desmaia imediatamente", ["epm-inconsciente"]],
  [2, "Grita sem parar e fica imobilizado.", ["epm-imovel"]],
  [3, "Foge em pânico.", ["epm-fugindo"]],
  [4, "Começa a gargalhar de desespero.", []],
  [5, "Medo incontrolável e paralisia.", ["epm-paralisado"]],
  [6, "Atitude suicida;tenta se matar ou se jogar no perigo que causou a insanidade.", []],
  [7, "Atitude homicida;tenta matar um aliado, que vê como a causa do que está acontecendo.", []],
  [8, "Alucinação horrenda relacionada com a situação.", []],
  [9, "Sem ação e totalmente sugestionável, faz o que os outros mandam, perde vontade própria.", ["epm-dominado"]],
  [10, "Delírio, acha que existem coisas devorando o próprio corpo.", []],
  [11, "Cai no chão e assume posição fetal, ignorando os eventos.", ["epm-caido", "epm-incapacitado"]],
  [12, "Começa a comer algo estranho, terra, morde a própria mão, etc.", []],
  [13, "Arranha a face com as mãos, causando ferimentos.", []],
  [14, "Arranca os cabelos enquanto grita com horror.", []],
  [15, "Machuca os olhos tentando arrancá-los enquanto grita.", []],
  [16, "Começa a falar rápido e coisas sem sentido, logorréia.", []],
  [17, "Chora compulsivamente em desespero.", []],
  [18, "Mania, acha que é poderoso e que pode fazer qualquer coisa.", []],
  [19, "Perde a fala.", ["epm-silenciado"]],
  [20, "Perde a audição.", ["epm-surdo"]],
  [21, "Perde a visão.", ["epm-cego"]],
  [22, "Sente que o corpo está pegando fogo.", []],
  [23, "Sente que tem milhares de insetos por baixo de sua pele.", []],
  [24, "Vê seus aliados como mortos vivos.", []],
  [25, "Tem uma visão da própria morte e acredita que morreu.", []],
  [26, "Bate a cabeça na parede, ou em alguma coisa, pode pegar uma pedra e bate na própria cabeça.", []],
  [27, "Vê seus braços se transformando em tentáculos.", []],
  [28, "Tenta estrangular um aliado.", []],
  [29, "Tenta estrangular a si mesmo.", []],
  [30, "Começa a rezar compulsivamente.", []],
  [31, "Esquece a própria identidade.", ["epm-amnesico"]],
  [32, "Esquece o idioma que fala.", []],
  [33, "Não reconhece nenhum aliado, considera todos como inimigos.", []],
  [34, "Reconhece o inimigo como seu melhor amigo.", []],
  [35, "Olha para seus aliados e acha que eles são um membro de sua família, sua mãe ou pai.", []],
  [36, "Infantilismo, reverte a idade mental para a idade de 3 anos.", []],
  [37, "Perde o movimento dos braços.", []],
  [38, "Perde o movimento das pernas.", ["epm-imovel"]],
  [39, "Não consegue respirar direito, fica tonto e se movimenta lentamente.", ["epm-lento"]],
  [40, "Vomita tudo que tem no estômago.", []],
  [41, null, []],
  [42, "Começa a dar socos no próprio peito para tentar fazer com que o coração pare.", []],
  [43, "Anda em círculos falando compulsivamente.", []],
  [44, "Começa a suar e a piscar sem parar, enquanto o corpo treme incontroladamente.", []],
  [45, "Um tique nervoso incontrolável toma conta de sua face.", []],
  [46, "Abraça a si mesmo, fecha os olhos e grita sem parar que tudo é apenas um pesadelo e que ele vai acordar a qualquer hora.", []],
  [47, "Abraça um aliado e não larga enquanto a insanidade durar, acreditando que se largar o aliado, ele irá morrer.", []],
  [48, "Começa a cantar uma música de infância enquanto chora morrendo de medo.", []],
  [49, "Começa a reviver uma cena da infância com seu pai ou mãe.", []],
  [50, "Tem convulsões e cai no chão com se fosse um ataque epiléptico.", ["epm-caido", "epm-incapacitado"]],
  [51, "Tem amnésia e esquece quem é e o que está fazendo ali.", ["epm-amnesico"]],
  [52, "As pernas tremem sem parar e tem dificuldade de andar ou ficar em pé.", ["epm-lento"]],
  [53, "Escuta as batidas do próprio coração como sons ensurdecedores, coloca as mãos nas orelhas e grita que quer que o próprio coração pare!", []],
  [54, "Vê uma luz forte, de onde uma voz lhe diz que tudo vai estar bem. O personagem não sai do lugar e sorri beatificamente.", []],
  [55, "O personagem grita \"tudo está perdido!\" e se joga no chão berrando e chorando!", ["epm-caido"]],
  [56, "O personagem fecha os olhos e diz \"isso é tudo um sonho!\" e acredita que pode fazer tudo desaparecer com a mente.", []],
  [57, "O personagem olha seus aliados e os vê como monstros horrendos.", []],
  [58, "O personagem acha que tem marimbondos dentro da cabeça tentando sair.", []],
  [59, "O personagem acredita que seus pés estão colados no chão e não consegue tirar os pés de onde está. Ele grita desesperado e quer sair de onde está.", ["epm-imovel"]],
  [60, "O personagem acha que sangue está escorrendo dos seus olhos e ouvidos, em cataratas.", []],
  [61, null, []],
  [62, "A língua do personagem se enrosca em sua boca e o deixa com dificuldade de respirar. Ele cai no chão e entra em convulsão.", ["epm-caido", "epm-incapacitado"]],
  [63, "O personagem olha para sua barriga e vê suas tripas saindo para fora e caindo no chão, ele tenta catar as tripas.", []],
  [64, "O personagem acha que sua mão está possuída por um demônio e quer arrancá-la do braço.", []],
  [65, "O personagem tem uma depressão profunda e acha que vai morrer nesse momento, ele sabe que vai morrer e desiste de tudo.", ["epm-apatico"]],
  [66, "A metade direita do corpo do personagem fica paralisada e sem sentir nada.", ["epm-hemiplegico"]],
  [67, "A metade esquerda do corpo do personagem fica paralisada e sem sentir nada.", ["epm-hemiplegico"]],
  [68, "Todos os sons que o personagem escuta ficam ensurdecedores.", ["epm-sobrecarga-sensorial"]],
  [69, "Todos os cheiros que o personagem sente ficam insuportáveis.", []],
  [70, "Tudo que o personagem vê fica com cores fortíssimas e ele não consegue mais ficar com os olhos abertos.", ["epm-cego"]],
  [71, "O personagem acha que o chão ganha uma consistência líquida e ele sente que está afundando, como em areia movediça.", []],
  [72, "Trava os dentes de medo ao ponto de fazer sangras a gengiva e trincar um dente.", []],
  [73, "Agarra as orelhas e as aperta com força enquanto solta um grito primal!", []],
  [74, "Bate com força na cabeça, várias vezes, falando coisas incoerentes.", []],
  [75, "Começa a conversar com si mesmo, tentando convencer a si mesmo de que não está louco.", []],
  [76, "Cai no chão de joelhos e levanta as mãos para o céu pedindo perdão.", []],
  [77, "Acha que a própria pele está caindo em pedaços, tenta pegar os pedaços e colocar de volta no rosto.", []],
  [78, "O personagem é acometido por dores de cabeça fortíssimas e enlouquecedoras.", []],
  [79, "A visão fica enevoada, ele vê tudo como se fosse em uma neblina forte, esfregando os olhos para ver se consegue clarear a visão.", ["epm-visao-distorcida"]],
  [80, "O personagem começa a falar desesperado em uma língua inventada que ninguém entende.", []],
  [81, "O personagem tem uma acesso de fúria agressiva, e direciona sua raiva para quem estiver por perto.", ["epm-descontrole"]],
  [82, "O personagem urra como um animal enfurecido e morde quem encostar nele, desesperado.", []],
  [83, "Os olhos do personagem começam a girar descontroladamente, deixando-o com vertigo.", ["epm-vertigem"]],
  [84, "O personagem tem uma vertigem fortíssima e vê que está tudo rodando, como se estivesse bêbado.", ["epm-vertigem"]],
  [85, "O personagem vê runas místicas surgindo em todo o seu corpo, cobrindo sua pele, e queimando a cada momento em que aparecem.", []],
  [86, "O personagem vê alguém que morreu em sua família aparecer na distância e acenar para ele. Em seguida ele grita desesperado.", []],
  [87, "O personagem vê insetos saindo de sua própria boca e orelha.", []],
  [88, null, []],
  [89, "O personagem abre a boca e fica gritando porém nenhum som sai de sua boca.", ["epm-silenciado"]],
  [90, "O personagem se desliga do presente e experiência uma memória feliz do passado como se estivesse acontecendo agora, e sorri.", []],
  [91, "O personagem entra em um frenesi de fúria e ataca seus aliados.", ["epm-descontrole"]],
  [92, "O personagem tem uma visão do fim do mundo, com tudo acabando em uma chuva de fogo.", []],
  [93, "O personagem tem uma visão do fim do mundo, com criaturas gigantescas saindo dos mares e devorando a todos.", []],
  [94, "O personagem vê tudo em preto e branco.", []],
  [95, "O personagem sente que o corpo todo está anestesiado, e difícil de mover.", ["epm-lento"]],
  [96, "O personagem sente calafrios horrendos na espinha, que o fazem mover o seu corpo violentamente.", []],
  [97, "O personagem sente fortes choques elétricos saindo do seu cérebro e espalhando pelo corpo, e grita de dor a cada choque.", []],
  [98, "O personagem desmaia e tem visões de estar sendo devorado por criaturas horrendas", ["epm-inconsciente"]],
  [99, "O personagem acredita que é o Chtulhu e começa a alar que irá devorar todas as almas da terra.", []],
  [100, "O personagem ganha uma insanidade de longa duração (role na tabela de Permanentes).", []]
];

const PERMANENTES = [
  [1, 5, "Pesadelos", []],
  [6, 10, "Ataques de Pânico", []],
  [11, 15, "Delírios", []],
  [16, 20, "Tremores corporais", []],
  [21, 25, "Depressão Profunda", []],
  [26, 30, "Desmaios constantes", []],
  [31, 35, "Acessos de Fúria", []],
  [36, 40, "Catatonia", []],
  [41, 45, "Cegueira", ["epm-cego"]],
  [46, 50, "Esquizofrenia", []],
  [51, 55, "Psicose", []],
  [56, 60, "Múltiplas Personalidades", []],
  [61, 65, "Auto-Mutilação", []],
  [66, 70, "Auto-canibalismo", []],
  [71, 75, "Canibalismo", []],
  [76, 80, "Maníaco-Depressivo Grave", []],
  [81, 85, "Piromania", []],
  [86, 90, "Fobia Gravíssima", []],
  [91, 95, "Role 2 insanidades acima, combinadas", []],
  [96, 100, "Role 3 insanidades acima, combinadas", []]
];

export const INSANIDADES_TEMPORARIAS = TEMPORARIAS.map(([numero, texto, condicoes]) => ({ numero, texto, condicoes, vazia: !texto }));
export const INSANIDADES_PERMANENTES = PERMANENTES.map(([de, ate, nome, condicoes]) => ({ de, ate, nome, condicoes, combinadas: nome.startsWith("Role") ? (nome.includes("3") ? 3 : 2) : 0 }));

/** Entrada da tabela temporária para um resultado de 1d100 (null nos números que faltam no PDF). */
export function insanidadeTemporaria(numero) {
  const e = INSANIDADES_TEMPORARIAS.find(i => i.numero === Number(numero));
  return e && !e.vazia ? e : null;
}

/** Entrada da tabela permanente para um resultado de 1d100. */
export function insanidadePermanente(numero) {
  const n = Number(numero);
  return INSANIDADES_PERMANENTES.find(i => n >= i.de && n <= i.ate) ?? null;
}

/**
 * Estados da Sanidade (Notion): 75–100 Estável, 50–74 Abalado (−1 em testes mentais), 25–49 Instável (−2 em testes mentais,
 * insanidade temporária se falhar na Vontade ao sofrer dano), 1–24 Quebrado (−3 em testes, insanidade automática ao sofrer dano),
 * 0 Colapso (uma insanidade permanente obrigatória).
 */
export const ESTADOS_SANIDADE = [
  { id: "estavel",  label: "Estável",  min: 75, mentais: 0,  testes: 0,  texto: "Sem efeitos." },
  { id: "abalado",  label: "Abalado",  min: 50, mentais: -1, testes: 0,  texto: "−1 em testes mentais e emocionais." },
  { id: "instavel", label: "Instável", min: 25, mentais: -2, testes: 0,  texto: "−2 em testes mentais. Ao sofrer dano de Sanidade: teste de Vontade; se falhar, ganha uma insanidade temporária." },
  { id: "quebrado", label: "Quebrado", min: 1,  mentais: 0,  testes: -3, texto: "−3 em testes. Ao sofrer dano de Sanidade: insanidade temporária automática; teste de Vontade (falha: mais intensa; falha crítica: pode virar permanente)." },
  { id: "colapso",  label: "Colapso",  min: 0,  mentais: 0,  testes: -3, texto: "Ruptura total: uma insanidade permanente obrigatória." }
];

export function estadoSanidade(valor) {
  const v = Math.max(0, Math.floor(Number(valor) || 0));
  return ESTADOS_SANIDADE.find(e => v >= e.min) ?? ESTADOS_SANIDADE.at(-1);
}

/** Recuperação (Notion: deve ser narrativa, não automática; os botões só sugerem a rolagem). */
export const RECUPERACAO_SANIDADE = [
  { id: "descanso", label: "Descanso seguro", formula: "1d6 + 4", faixa: "+5 a +10" },
  { id: "conversa", label: "Conversa ou apoio emocional", formula: "1d5", faixa: "+1 a +5" },
  { id: "trauma",   label: "Resolver um trauma", formula: "1d16 + 9", faixa: "+10 a +25" }
];
