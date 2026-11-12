/**
 * Raças do Notion (página RAÇAS + DLC "Estrelas do Vazio"). Só dados e contas puras (sem Foundry).
 *
 * Nomes antigos do Notion → atributos da ficha: Vigor = Constituição, Espírito/Aura = Núcleo,
 * Intelecto = Inteligência, Manipulação = Carisma.
 *
 * aumento:
 *   fixos { atributo: n } ........ bônus fixo
 *   escolhas [{ valor, grupos, exceto, qtd }] ... "+1 em um atributo da categoria X" (grupos vazios = qualquer)
 *   pontos n ..................... Mestiço: distribui n pontos (máx. +2 por atributo)
 * recursos { pv, pm, pe } ....... Vida, Mana e Energia (Estamina) base da raça
 * habilidades / unicas [{ id, nome, texto, auto }]: `auto` é o que a ficha aplica sozinha:
 *   desl (m), voo/nado/escalada/escavacao ("igual" = deslocamento), visao (m), resistencias [], imunidades [],
 *   imuneCondicoes [], pm, pv, pvPorNivel, ca, rd, pt, ph, idiomas, periciaPontos, atributo { grupo, valor }
 * As Habilidades Únicas: escolhe 1 (Mestiço: 2, uma de cada raça; Compatibilidade à Fera: +2).
 */

export const RACAS = [
  {
    id: "humano", nome: "Humano", tamanho: "medio", altura: "1,50 a 2,50 m", deslocamento: 9,
    idade: { adulta: "16 a 18 anos", maxima: "120 anos" },
    recursos: { pv: 14, pm: 14, pe: 14 },
    aumento: { escolhas: [{ valor: 1, qtd: 5, categoriasDiferentes: true }], texto: "+1 em 5 atributos, cada um de categorias diferentes" },
    habilidades: [
      { id: "versatil", nome: "Versátil", texto: "Você inicia com 10 PT para usar como quiser.", auto: { pt: 10 } }
    ],
    unicas: [
      { id: "variante", nome: "Variante", texto: "Em vez de +1 em 5 atributos, recebe +2 em dois atributos quaisquer e +2 PH.", auto: { ph: 2, trocaAumento: { escolhas: [{ valor: 2, qtd: 2 }], texto: "+2 em dois atributos quaisquer" } } },
      { id: "amigo", nome: "Amigo de Todos", texto: "Sabe +1 idioma e recebe +2 pontos de perícia (mantendo o limite).", auto: { idiomas: 1, periciaPontos: 2 } },
      { id: "conhecimento", nome: "Conhecimento Extra", texto: "+1 ponto em um atributo da categoria Mentais.", auto: { atributo: { grupos: ["mentais"], valor: 1 } } },
      { id: "fisico", nome: "Físico Perfeito", texto: "Uma vez por descanso, com a Ação Bônus, regenera 5 PE e 5 PM.", auto: { poder: { acao: "bonus", recarga: "descanso" } } }
    ]
  },
  {
    id: "elfo", nome: "Elfo", tamanho: "medio", altura: "1,50 a 2,50 m", deslocamento: 12,
    idade: { adulta: "18 a 21 anos", maxima: "2.000 anos" },
    recursos: { pv: 6, pm: 12, pe: 24 },
    aumento: { fixos: { destreza: 2 }, escolhas: [{ valor: 2, grupos: ["mentais"] }], texto: "+2 em Destreza e +2 em um atributo Mental" },
    habilidades: [
      { id: "visao", nome: "Visão no Escuro", texto: "Enxerga 18 metros no escuro.", auto: { visao: 18 } },
      { id: "floresta", nome: "Dádiva da Floresta", texto: "Não precisa dormir em área de vegetação fechada. Em floresta, vantagem em testes de resistência contra encantamento." }
    ],
    unicas: [
      { id: "negro", nome: "Elfos Negros", texto: "Vantagem em todos os testes no escuro; desvantagem em claridade plena." },
      { id: "floresta2", nome: "Elfos da Floresta", texto: "Move +3 metros.", auto: { desl: 3 } },
      { id: "puro", nome: "Elfos Sangue Puro", texto: "+10 PM.", auto: { pm: 10 } },
      { id: "orelhas", nome: "Orelhas Sensíveis", texto: "Vantagem em testes de Percepção ligados à audição." }
    ]
  },
  {
    id: "anao", nome: "Anão", tamanho: "pequeno", altura: "1,00 a 1,50 m", deslocamento: 6,
    idade: { adulta: "16 a 18 anos", maxima: "250 anos" },
    recursos: { pv: 24, pm: 6, pe: 12 },
    aumento: { fixos: { constituicao: 2 }, escolhas: [{ valor: 1, grupos: ["fisicos"], exceto: ["constituicao"] }, { valor: 1, grupos: ["mistico"] }],
      texto: "+2 em Constituição, +1 em um atributo Físico (menos Constituição) e +1 em um Místico" },
    habilidades: [
      { id: "resistencia", nome: "Resistência Anã", texto: "Resistência a todo dano físico não mágico (queda, cortante, contusão e perfurante).", auto: { resistencias: ["Físicos (Natural)", "Queda"] } },
      { id: "temperamento", nome: "Temperamento Explosivo", texto: "Fica irritado e causa +2 de dano em todo ataque corpo a corpo." }
    ],
    unicas: [
      { id: "pes", nome: "Pés Rápidos", texto: "+3 de deslocamento.", auto: { desl: 3 } },
      { id: "pelos", nome: "Pelos Resistentes", texto: "Resistência a dano de Frio e de Fogo.", auto: { resistencias: ["Gelo", "Fogo"] } },
      { id: "pele", nome: "Pele Rígida", texto: "Todo ataque contra você causa −2 de dano.", auto: { rd: 2 } },
      { id: "forca", nome: "Força Anã", texto: "Vantagem em testes de resistência de Constituição." }
    ]
  },
  {
    id: "meio-dragao", nome: "Meio-Dragão", tamanho: "medio", altura: "1,50 a 2,50 m", deslocamento: 9,
    idade: { adulta: "20 anos", maxima: "1.500 anos" },
    recursos: { pv: 20, pm: 12, pe: 10 },
    aumento: { fixos: { constituicao: 2, nucleo: 1 }, escolhas: [{ valor: 1, grupos: ["fisicos", "mentais", "sociais"], exceto: ["constituicao", "nucleo"] }],
      texto: "+2 em Constituição, +1 em Espírito (Núcleo) e +1 em um atributo Físico, Mental ou Social" },
    habilidades: [
      { id: "escamas", nome: "Escamas", texto: "Resistência a dano Cortante e Perfurante.", auto: { resistencias: ["Cortante", "Perfurante"] } },
      { id: "bafo", nome: "Bafo de Dragão", texto: "Ação Padrão e 2 PM: 1d10 + Núcleo de dano, à escolha entre Ácido, Raio, Fogo, Gelo, Sombra, Radiante e Venenoso.",
        auto: { poder: { acao: "padrao", custo: { recurso: "pm", valor: 2 }, dano: "1d10 + @atr.nucleo", tipoDano: "Fogo" } } }
    ],
    unicas: [
      { id: "elementais", nome: "Escamas Elementais", texto: "Imunidade ao tipo de dano do seu Bafo de Dragão." },
      { id: "metalicas", nome: "Escamas Metálicas", texto: "Imunidade a dano Cortante.", auto: { imunidades: ["Cortante"] } },
      { id: "protetoras", nome: "Escamas Protetoras", texto: "+2 em Fortitude ao se defender e +1 na CA contra ataques à distância." },
      { id: "armas", nome: "Armas Naturais", texto: "Garras e presas: 1d8 + Destreza ou Força de dano ao acertar." },
      { id: "aquatico", nome: "Dragão Aquático", texto: "Nada com o mesmo deslocamento da terra.", auto: { nado: "igual" } },
      { id: "aereo", nome: "Dragão Aéreo", texto: "Voa com o mesmo deslocamento da terra e não sofre dano de queda.", auto: { voo: "igual", imunidades: ["Queda"] } },
      { id: "terrestre", nome: "Dragão Terrestre", texto: "+3 de deslocamento.", auto: { desl: 3 } },
      { id: "escavador", nome: "Escavador", texto: "Escava com o mesmo deslocamento comum.", auto: { escavacao: "igual" } },
      { id: "cobra", nome: "Dragão Cobra", texto: "Passa por onde seres pequenos passam e causa +1d4 de Veneno no ataque desarmado corpo a corpo." }
    ]
  },
  {
    id: "goblin", nome: "Goblin", tamanho: "pequeno", altura: "1,00 a 1,50 m", deslocamento: 9,
    idade: { adulta: "14 anos", maxima: "80 anos" },
    recursos: { pv: 6, pm: 12, pe: 24 },
    aumento: { fixos: { destreza: 2, carisma: 1 }, escolhas: [{ valor: 1, grupos: ["mentais"] }], texto: "+2 em Destreza, +1 em Manipulação (Carisma) e +1 em um atributo Mental" },
    habilidades: [
      { id: "esperto", nome: "Esperto", texto: "Gaste 2 PE para receber +5 num teste de perícia em que tenha proficiência.", auto: { poder: { acao: "livre", custo: { recurso: "pe", valor: 2 } } } },
      { id: "charlatao", nome: "Charlatão", texto: "Vantagem em testes de Lábia.", auto: { vantagemPericias: ["labia"] } }
    ],
    unicas: [
      { id: "pes", nome: "Pés Ágeis", texto: "+3 de deslocamento.", auto: { desl: 3 } },
      { id: "malandro", nome: "Pequeno Malandro", texto: "Vantagem em testes de Crime.", auto: { vantagemPericias: ["crime"] } },
      { id: "miniatura", nome: "Miniatura", texto: "Esconde-se até em arbustos pequenos: pode testar Furtividade em qualquer lugar que não seja completamente aberto." },
      { id: "ouvidos", nome: "Ouvidos Curiosos", texto: "Vantagem em testes de Percepção ligados à audição." },
      { id: "magricelo", nome: "Magricelo", texto: "Passa por onde seres minúsculos passam e tem +1 na CA.", auto: { ca: 1 } }
    ]
  },
  {
    id: "demonio", nome: "Demônio", tamanho: "medio", altura: "1,50 a 2,50 m", deslocamento: 9,
    idade: { adulta: "50 anos", maxima: "desconhecida" },
    recursos: { pv: 12, pm: 20, pe: 10 },
    aumento: { fixos: { nucleo: 2 }, escolhas: [{ valor: 1, grupos: ["fisicos"] }, { valor: 1, grupos: ["sociais", "mentais"] }],
      texto: "+2 em Aura (Núcleo), +1 em um atributo Físico e +1 em um Social ou Mental" },
    habilidades: [
      { id: "pele", nome: "Pele Demoníaca", texto: "Resistência a dano de Fogo.", auto: { resistencias: ["Fogo"] } },
      { id: "chamas", nome: "Pele em Chamas", texto: "+1d4 de dano de Fogo ao fazer um ataque corpo a corpo." }
    ],
    unicas: [
      { id: "variante", nome: "Variante", texto: "Em vez do aumento da raça: +2 num atributo Social, +2 num Físico ou Místico e +1 em Aura (Núcleo). Também recebe +2 PH.",
        auto: { ph: 2, trocaAumento: { fixos: { nucleo: 1 }, escolhas: [{ valor: 2, grupos: ["sociais"] }, { valor: 2, grupos: ["fisicos", "mistico"] }], texto: "+2 Social, +2 Físico ou Místico e +1 Núcleo" } } },
      { id: "sabedoria", nome: "Sabedoria Antiga", texto: "Uma vez por descanso, lembra um conhecimento escondido da sua raça.", auto: { poder: { acao: "livre", recarga: "descanso" } } },
      { id: "brasa", nome: "Brasa Infernal", texto: "Ação Padrão e 2 PM: ataque à distância de 1d10 + Núcleo de dano de Fogo.", auto: { poder: { acao: "padrao", custo: { recurso: "pm", valor: 2 }, dano: "1d10 + @atr.nucleo", tipoDano: "Fogo" } } },
      { id: "lava", nome: "Pele de Lava", texto: "Resistência a dano Cortante, Contundente e Perfurante.", auto: { resistencias: ["Cortante", "Contundente", "Perfurante"] } },
      { id: "armas", nome: "Armas Naturais", texto: "+1d6 de dano Cortante, Contundente ou Perfurante no ataque desarmado corpo a corpo." }
    ]
  },
  {
    id: "anjo", nome: "Anjo", tamanho: "medio", altura: "1,50 a 2,50 m", deslocamento: 9,
    idade: { adulta: "já nascem adultos", maxima: "não têm" },
    recursos: { pv: 12, pm: 20, pe: 10 },
    aumento: { fixos: { nucleo: 2 }, escolhas: [{ valor: 1, grupos: ["fisicos"] }, { valor: 1, grupos: ["sociais"] }], texto: "+2 em Espírito (Núcleo), +1 em um Físico e +1 em um Social" },
    habilidades: [
      { id: "dadiva", nome: "Dádiva dos Deuses", texto: "Duas vezes por dia, recebe +1 em algum atributo por 1 hora.", auto: { poder: { acao: "livre", usos: 2, recarga: "dia" } } },
      { id: "voo", nome: "Voo", texto: "Voa com o mesmo deslocamento comum.", auto: { voo: "igual" } }
    ],
    unicas: [
      { id: "aura", nome: "Aura Protetiva", texto: "Uma vez por combate, com a Reação, protege um aliado ou a si de um ataque.", auto: { poder: { acao: "reacao", recarga: "combate" } } },
      { id: "sangue", nome: "Sangue Divino", texto: "Causa 1d4 de dano em si para curar 2d6 de Vida de alguém.", auto: { poder: { acao: "padrao", cura: "2d6" } } },
      { id: "vida", nome: "Dádiva da Vida", texto: "Ao cair a 0 de Vida, uma vez por descanso longo, volta com 5 PV.", auto: { poder: { acao: "livre", recarga: "descanso" } } },
      { id: "morte", nome: "Dádiva da Morte", texto: "Ao vencer alguém, +1d4 de dano nos próximos ataques; acumula até +6d4 e zera no fim do combate." }
    ]
  },
  {
    id: "automato", nome: "Autômato", tamanho: "medio", altura: "1,50 a 2,50 m", deslocamento: 9,
    idade: { adulta: "não têm idade (são robôs)", maxima: "—" },
    recursos: { pv: 14, pm: 14, pe: 14 },
    aumento: { fixos: { inteligencia: 2, constituicao: 1 }, escolhas: [{ valor: 1, grupos: ["fisicos"], exceto: ["constituicao"] }], texto: "+2 em Intelecto (Inteligência), +1 em Constituição e +1 em um Físico (menos Constituição)" },
    habilidades: [
      { id: "idioma", nome: "Idioma Alterado", texto: "Fala Humano como idioma principal; um Artífice que conheça suas configurações pode trocá-lo pelo dele." },
      { id: "coracao", nome: "Coração de Robô", texto: "Não pode ser enfeitiçado, amedrontado, irritado ou surpreso. Imunidade a dano Psíquico.",
        auto: { imunidades: ["Psíquico", "Apavorado", "Amedrontado", "Enfeitiçado", "Surpreendido"] } },
      { id: "carregado", nome: "Carregado", texto: "Não precisa dormir nem desligar enquanto tiver energia." }
    ],
    unicas: [
      { id: "membros", nome: "Membros Metálicos", texto: "+2 em Fortitude ao se defender e +1 na CA.", auto: { ca: 1 } },
      { id: "bateria", nome: "Bateria Recarregável", texto: "Ao sofrer ataque de Raio, recebe Energia ou Vida em vez de dano." },
      { id: "espioes", nome: "Membros Espiões", texto: "Solta um membro e o controla, ouvindo ou vendo por ele." },
      { id: "consertos", nome: "Pequenos Consertos", texto: "Não recupera PV normalmente; com a Ação Bônus, cura 1d10 (no máximo a Vida toda por descanso longo).", auto: { poder: { acao: "bonus", cura: "1d10" } } },
      { id: "infra", nome: "Visão Infravermelha", texto: "Vê qualquer ser, mesmo invisível; vantagem em Percepção ou Investigação para achar quem está escondido." }
    ]
  },
  {
    id: "meio-gigante", nome: "Meio-Gigante", tamanho: "grande", altura: "2,50 a 4,00 m", deslocamento: 9,
    idade: { adulta: "15 anos", maxima: "300 anos" },
    recursos: { pv: 24, pm: 6, pe: 12 },
    aumento: { fixos: { forca: 2, constituicao: 1 }, escolhas: [{ valor: 1, grupos: ["mistico"] }], texto: "+2 em Força, +1 em Constituição e +1 em um Místico" },
    habilidades: [
      { id: "resistencia", nome: "Resistência de Gigante", texto: "Resistência a todo dano físico não mágico (queda, cortante, contusão e perfurante).", auto: { resistencias: ["Físicos (Natural)", "Queda"] } },
      { id: "corpo", nome: "Corpo Destruidor", texto: "+1d4 de dano em todo ataque corpo a corpo." }
    ],
    unicas: [
      { id: "vida", nome: "Vida de Gigante", texto: "+10 de Vida e +1 por nível.", auto: { pv: 10, pvPorNivel: 1 } },
      { id: "passos", nome: "Passos Grandes", texto: "+3 m de deslocamento.", auto: { desl: 3 } },
      { id: "braco", nome: "Braço de Aço", texto: "O ataque desarmado causa +1d6 de dano." },
      { id: "vento", nome: "Cabeça de Vento", texto: "Imune a dano Psíquico.", auto: { imunidades: ["Psíquico"] } },
      { id: "maior", nome: "Braço Maior", texto: "Vantagem para agarrar e consegue agarrar seres maiores (Gigante, Enorme ou Colossal)." }
    ]
  },
  {
    id: "mutante", nome: "Mutante", tamanho: "medio", altura: "1,50 a 2,50 m", deslocamento: 12,
    idade: { adulta: "14 a 18 anos", maxima: "150 anos" },
    recursos: { pv: 20, pm: 10, pe: 12 },
    aumento: { escolhas: [{ valor: 2, grupos: ["fisicos"] }, { valor: 1, grupos: ["fisicos", "sociais"], diferente: true }, { valor: 1, grupos: ["mentais"] }],
      texto: "+2 em um Físico, +1 em um Físico ou Social (outro) e +1 em um Mental" },
    habilidades: [
      { id: "animal", nome: "Transformar em Animal", texto: "Forma meio animal: arma natural que causa +1d6 no ataque desarmado corpo a corpo." },
      { id: "pele", nome: "Pele Animal", texto: "Imunidade a dano Cortante e Perfurante não mágicos.", auto: { imunidades: ["Cortante (Natural)", "Perfurante (Natural)"] } }
    ],
    unicas: [
      { id: "agil", nome: "Ágil", texto: "Vantagem em testes de Reflexo." },
      { id: "veloz", nome: "Veloz", texto: "+3 de deslocamento.", auto: { desl: 3 } },
      { id: "corpulento", nome: "Corpulento", texto: "+10 de Vida e +1 por nível.", auto: { pv: 10, pvPorNivel: 1 } },
      { id: "salto", nome: "Salto", texto: "Salta 12 metros normalmente." },
      { id: "escalador", nome: "Escalador", texto: "Escala com o mesmo deslocamento comum.", auto: { escalada: "igual" } },
      { id: "voo", nome: "Voo", texto: "Voa com o mesmo deslocamento comum.", auto: { voo: "igual" } },
      { id: "nadador", nome: "Nadador", texto: "Nada com o mesmo deslocamento comum.", auto: { nado: "igual" } },
      { id: "venenoso", nome: "Venenoso", texto: "Quem o ataca corpo a corpo sofre 1d4 de Veneno; se morder, fica Envenenado." },
      { id: "peconha", nome: "Peçonha", texto: "Ao morder: Fortitude CD 15 + Constituição; se o alvo falhar, +1d6 de Veneno e fica Envenenado." },
      { id: "fera", nome: "Compatibilidade à Fera", texto: "Perde Pele Animal, mas recebe 2 Habilidades Únicas extras.", auto: { unicasExtras: 2, perdeHabilidade: "pele" } }
    ]
  },
  {
    id: "mestico", nome: "Mestiço", tamanho: "medio", altura: "1,50 a 2,50 m", deslocamento: 9,
    idade: { adulta: "média das duas raças", maxima: "média das duas raças" },
    recursos: { pv: 14, pm: 14, pe: 14 },
    aumento: { pontos: 4, texto: "4 pontos: +2/+2, +2/+1/+1 ou +1 em 4 atributos" },
    mestico: true,
    texto: "Escolhe duas raças: recebe uma característica passiva e uma habilidade de uma delas, e duas Habilidades Únicas (uma de cada raça).",
    habilidades: [],
    unicas: []
  },
  {
    id: "entretenimento", nome: "Entretenimento Divino", dlc: true, tamanho: "varia", altura: "varia", deslocamento: 9,
    deslocamentoOpcoes: [6, 9, 12],
    idade: { adulta: "a idade não importa", maxima: "—" },
    recursos: { pv: 14, pm: 14, pe: 14 },
    aumento: { escolhas: [{ valor: 2 }, { valor: 1, qtd: 2, categoriasDiferentes: true }], texto: "+2 em um atributo e +1 em dois atributos de categorias diferentes" },
    habilidades: [
      { id: "show", nome: "Show Divino (passiva)", texto: "Observado por uma Divindade (o Mestre decide quando), recebe vantagem em todos os testes." },
      { id: "besta", nome: "Transformação Bestial", texto: "Após um gatilho, Autocontrole DT 25: se falhar, vira uma besta descontrolada que ataca qualquer alvo próximo. Pode se transformar por vontade (DT 20): passando, controla a besta.",
        auto: { poder: { acao: "livre" } } }
    ],
    unicas: [
      { id: "amalgama", nome: "Amálgama", texto: "Escolha uma passiva ou habilidade de outra raça." }
    ],
    caminhos: [
      { id: "hercules", nome: "Caminho de Hércules", meta: 12, texto: "Derrote 12 criaturas enviadas por Deuses, mais fortes que você: recebe uma bênção divina (escolha do Mestre)." },
      { id: "odysseus", nome: "Caminho de Odysseus", meta: 6, texto: "Passe por desafios divinos para conquistar um objetivo próprio: bênção divina." },
      { id: "leonidas", nome: "Caminho de Leônidas", meta: 1, texto: "Lidere e vença uma guerra em desvantagem numérica: bênção divina." },
      { id: "sisifo", nome: "Caminho de Sísifo", meta: 7, texto: "Questione os Deuses: bênção caótica." },
      { id: "daniel", nome: "Caminho de Daniel", meta: 7, texto: "Siga as ordens do seu Deus sem questionar: bênção divina (o Mestre decide)." },
      { id: "davi", nome: "Caminho de Davi", meta: 1, texto: "Derrote uma criatura 4× maior que você: recompensa." },
      { id: "horus", nome: "Caminho de Hórus", meta: 1, texto: "Busque vingança por alguém importante para você." },
      { id: "qin", nome: "Caminho de Qin Shihuang", meta: 3000, texto: "Torne-se líder de 3 mil pessoas." },
      { id: "wukong", nome: "Caminho de Sun Wukong (extra)", meta: 8, texto: "Complete TODOS os caminhos 2× mais difíceis: recompensa (repetível)." }
    ]
  },
  {
    id: "vampiro", nome: "Vampiro", dlc: true, tamanho: "medio", altura: "médio", deslocamento: 9,
    idade: { adulta: "variável", maxima: "variável" },
    recursos: { pv: 6, pm: 12, pe: 24 },
    aumento: { escolhas: [{ valor: 2 }, { valor: 1, qtd: 2, categoriasDiferentes: true }], texto: "+2 em um atributo e +1 em dois atributos de categorias diferentes" },
    habilidades: [
      { id: "morcego", nome: "Transformação", texto: "Com a Ação Bônus, vira um morcego e ganha 10 m de voo.", auto: { poder: { acao: "bonus" } } },
      { id: "sangue", nome: "Recuperação de Sangue", texto: "Bebendo 200 ml de sangue, recupera 1d8 de Vida.", auto: { poder: { acao: "padrao", cura: "1d8" } } }
    ],
    unicas: [
      { id: "charme", nome: "Charme Vampírico", texto: "Vantagem em testes de persuasão ou manipulação (Diplomacia e Lábia).", auto: { vantagemPericias: ["diplomacia", "labia"] } },
      { id: "instintos", nome: "Instintos Aguçados", texto: "Vantagem em testes de Investigação e Percepção.", auto: { vantagemPericias: ["investigacao", "percepcao"] } }
    ]
  }
];

export const TAMANHOS = {
  minusculo: "Minúsculo", pequeno: "Pequeno", medio: "Médio", grande: "Grande", enorme: "Enorme", colossal: "Colossal", varia: "Varia"
};

export const racaPorId = id => RACAS.find(r => r.id === id) ?? null;

/** Habilidades Únicas que a raça deixa escolher (1, ou 1 + extras de Compatibilidade à Fera). */
export function qtdUnicas(raca, escolhidas = []) {
  if (!raca) return 0;
  if (raca.mestico) return 2;
  const extras = (raca.unicas ?? []).filter(u => escolhidas.includes(u.id)).reduce((s, u) => s + (u.auto?.unicasExtras ?? 0), 0);
  return 1 + extras;
}

/**
 * Efeitos automáticos da raça escolhida (habilidades + únicas marcadas), somados.
 * `escolha` = dados.racaEscolha { id, unicas: [ids], mestico: { a, b, habilidades: [ "raca:id" ], unicas: ["raca:id"] } }
 */
export function efeitosDaRaca(escolha) {
  const raca = racaPorId(escolha?.id);
  const out = { raca, desl: 0, voo: null, nado: null, escalada: null, escavacao: null, visao: 0, resistencias: [], imunidades: [], pm: 0, pv: 0, pvPorNivel: 0, ca: 0, rd: 0, vantagemPericias: [], habilidades: [] };
  if (!raca) return out;
  const lista = [];
  if (raca.mestico) {
    for (const ref of [...(escolha?.mestico?.habilidades ?? []), ...(escolha?.mestico?.unicas ?? [])]) {
      const [rid, hid] = String(ref).split(":");
      const r = racaPorId(rid);
      const h = [...(r?.habilidades ?? []), ...(r?.unicas ?? [])].find(x => x.id === hid);
      if (h) lista.push({ ...h, origem: r.nome });
    }
  } else {
    const unicas = escolha?.unicas ?? [];
    const perde = new Set(raca.unicas.filter(u => unicas.includes(u.id)).map(u => u.auto?.perdeHabilidade).filter(Boolean));
    for (const h of raca.habilidades) if (!perde.has(h.id)) lista.push({ ...h, origem: raca.nome });
    for (const u of raca.unicas) if (unicas.includes(u.id)) lista.push({ ...u, origem: raca.nome, unica: true });
  }
  for (const h of lista) {
    const a = h.auto ?? {};
    out.habilidades.push(h);
    out.desl += Number(a.desl) || 0;
    for (const k of ["voo", "nado", "escalada", "escavacao"]) if (a[k]) out[k] = a[k];
    out.visao = Math.max(out.visao, Number(a.visao) || 0);
    out.resistencias.push(...(a.resistencias ?? []).map(t => ({ tipo: t, fonte: h.nome })));
    out.imunidades.push(...(a.imunidades ?? []).map(t => ({ tipo: t, fonte: h.nome })));
    out.vantagemPericias.push(...(a.vantagemPericias ?? []).map(p => ({ pericia: p, fonte: h.nome })));
    for (const k of ["pm", "pv", "pvPorNivel", "ca", "rd"]) out[k] += Number(a[k]) || 0;
  }
  return out;
}
