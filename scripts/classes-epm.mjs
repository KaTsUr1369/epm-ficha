/**
 * Classes do EPM, versão final (0.9.0): textos dos PDFs da conversa de balanceamento (EPM/classes/*).
 * Cada classe: nome, arquétipo, extra (classe extra), descrição (identidade, faz bem, faz mal, precisa de),
 * regras (o que vale para a classe toda, tabelas em texto) e as 16 habilidades nos níveis 3, 6, 9 … 48.
 * Números que a ficha automatiza ficam em campos próprios (ex.: furia, couraca), sempre editáveis em Ajustes.
 */

const faixa = (a, b, c, d, e) => [[3, a], [11, b], [21, c], [31, d], [41, e]];

export const CLASSES_EPM = {
  /* ============================ COMBATENTE ============================ */
  guerreiro: {
    nome: "Guerreiro", arquetipo: "combatente",
    descricao: "O combatente versátil: escolhe na hora se vai ser dano corpo a corpo, dano a distância ou tanque, trocando de Postura conforme a luta pede. Faz tudo na média, nunca melhor que a classe focada nisso, mas é o que mais se adapta e o que domina mais Maestrias. Faz bem: adaptar o papel no meio da luta, cobrir o buraco do grupo, dominar várias armas. Faz mal: superar o especialista de cada papel. Precisa de: um grupo que diga qual papel está faltando.",
    regras: [
      "Posturas: seis, duas de cada estilo. No Nv. 3 aprende uma de cada estilo; no Nv. 6, as outras três. Uma Postura ativa por vez (duas no Nv. 24, três no Nv. 45). Trocar é Ação Bônus 1x/turno (ação livre no Nv. 18). Bônus de Postura contam no Teto de Bônus.",
      "Valores por faixa (3–10 / 11–20 / 21–30 / 31–40 / 41–50): Lâmina (corpo a corpo, dano extra por acerto) +1d4 / +1d6 / +1d8 / +1d10 / +2d6; Investida (+3 m e acerto corpo a corpo) +1 a +5; Mira (acerto a distância e +6 m de alcance) +1 a +5; Rajada (dano extra por acerto a distância) +1d4 / +1d6 / +1d8 / +1d10 / +2d6; Muralha (CA e RD física) +1/RD 2, +2/RD 3, +3/RD 4, +4/RD 5, +5/RD 6; Sentinela (Bloqueio e Contra-ataque; +1 ataque de oportunidade por rodada) +1 a +5."
    ],
    posturas: {
      lamina: { nome: "Lâmina", estilo: "Corpo a corpo", dano: faixa("1d4", "1d6", "1d8", "1d10", "2d6"), quando: "corpo" },
      investida: { nome: "Investida", estilo: "Corpo a corpo", acerto: faixa(1, 2, 3, 4, 5), quando: "corpo" },
      mira: { nome: "Mira", estilo: "Distância", acerto: faixa(1, 2, 3, 4, 5), quando: "distancia" },
      rajada: { nome: "Rajada", estilo: "Distância", dano: faixa("1d4", "1d6", "1d8", "1d10", "2d6"), quando: "distancia" },
      muralha: { nome: "Muralha", estilo: "Tank", ca: faixa(1, 2, 3, 4, 5), rd: faixa(2, 3, 4, 5, 6) },
      sentinela: { nome: "Sentinela", estilo: "Tank", defesa: faixa(1, 2, 3, 4, 5) }
    },
    habilidades: [
      [3, "Treino Versátil", "Aprende 3 Posturas, uma de cada estilo, e proficiência com todas as armas, armaduras e escudos."],
      [6, "Treino de Posturas", "Aprende as outras 3 Posturas (passa a ter as 6)."],
      [9, "Mestre de Armas", "+1 Maestria no Arsenal (além das do arquétipo)."],
      [12, "Leitura de Combate", "Ação Bônus: descobre uma informação de um inimigo que você veja (CA, RD ou uma Resistência, à sua escolha). Pode repetir no mesmo alvo para descobrir outra. Depois da primeira leitura, ganha +2 no acerto contra ele até o fim da cena; o bônus não acumula com novas leituras."],
      [15, "Indomável", "1x por Descanso Curto, rola de novo um teste de resistência que falhou (fica o novo)."],
      [18, "Troca Instantânea", "Trocar de Postura é ação livre 1x/turno, e trocar de arma também."],
      [21, "Surto de Ação", "1x por cena, no fim do seu turno, refaz um turno inteiro: ganha de novo todas as ações e os ataques extras (o que você fez no turno anterior continua valendo)."],
      [24, "Postura Híbrida", "Mantém 2 Posturas ao mesmo tempo."],
      [27, "Mestre de Armas 2.0", "+1 Maestria no Arsenal (máximo de +2 pelo Guerreiro)."],
      [30, "Ritmo de Batalha", "1x/turno, ao trocar de Postura, o primeiro acerto depois da troca causa +1 dado da arma."],
      [33, "Indomável 2.0", "Indomável 2x por Descanso Curto, com +2 no novo teste."],
      [36, "Surto de Ação 2.0", "No turno extra do Surto de Ação, o Ataque Extra custa metade do PE."],
      [39, "Arsenal Afiado", "Suas Maestrias custam 2 PE a menos (mín. 1)."],
      [42, "Veterano", "Não pode ser Surpreendido; +2 na iniciativa; ataques de oportunidade contra você têm desvantagem."],
      [45, "Postura Tripla", "Mantém as 3 Posturas ao mesmo tempo."],
      [48, "Lenda Versátil (capstone)", "1x por Descanso Longo, por 1 minuto: as Posturas usam os valores da faixa acima (acima de 41–50: +1 dado, +1 e RD +2), Surto de Ação 2x na cena e todas as Maestrias custam metade do PE."]
    ]
  },
  lutador: {
    nome: "Lutador", arquetipo: "combatente",
    descricao: "O especialista em combate corpo a corpo desarmado: punhos, chutes, agarrões e técnicas que gastam PE. É rápido, golpeia muitas vezes e controla o inimigo com atordoamentos e quedas. Faz bem: muitos golpes por turno, atordoar, agarrar e derrubar, se mover pelo campo. Faz mal: lutar a distância e enfrentar criaturas que não podem ser agarradas. Precisa de: PE para as técnicas.",
    regras: [
      "Golpe desarmado: usa Força ou Destreza (a maior) no acerto (d20 + Luta) e no dano; o dano sobe pela faixa: 1d6 / 1d8 / 1d10 / 1d12 / 2d8 (3–10 / 11–20 / 21–30 / 31–40 / 41–50).",
      "Defesa sem armadura: sem armadura e sem escudo, CA = 10 + Destreza + Autocontrole.",
      "Luvas, manoplas e soco-inglês contam como desarmado e somam as Melhorias.",
      "CD de Técnica = CD de Maestria (10 + Luta). Golpe Atordoante custa 4 / 4 / 5 / 5 / 6 PE pela faixa."
    ],
    desarmado: faixa("1d6", "1d8", "1d10", "1d12", "2d8"),
    habilidades: [
      [3, "Artes Marciais", "Golpe desarmado pela faixa e defesa sem armadura. 1x/turno, depois de atacar com a Ação de Ataque, faz 1 golpe desarmado com Ação Bônus sem custo."],
      [6, "Rajada de Golpes", "Ação Bônus, 3 PE: 2 golpes desarmados (substitui o golpe grátis daquele turno)."],
      [9, "Golpe Atordoante", "1x/turno, ao acertar um golpe, paga o custo da faixa: Fortitude contra a CD ou o alvo fica Atordoado até o fim do próximo turno dele. Cada criatura só pode ficar Atordoada assim 1x por rodada."],
      [12, "Passos do Vento", "+3 m de deslocamento sem armadura; Ação Bônus, 1 PE: Disparada ou Recuo sem provocar ataques."],
      [15, "Agarrão de Mestre", "Agarrar é ação livre 1x/turno ao acertar; Ação Padrão: arremessa a criatura agarrada a até 6 m (sofre o dano do golpe e fica Caída)."],
      [18, "Desviar Projéteis", "Reação: reduz o dano de um ataque a distância em 1d10 + Destreza + nível de Combatente ÷ 2. Se zerar, pode pegar o projétil."],
      [21, "Corpo de Ferro", "Imune a Envenenado e Doente. RD física igual à metade da Constituição."],
      [24, "Golpe Vibrante", "1x/cena, ao acertar: marca o alvo. Com Ação Bônus, até 1 minuto depois, a vibração explode: 6d10 de Força (Fortitude para metade)."],
      [27, "Combo", "Cada acerto seguido no mesmo alvo no turno dá +1 no acerto do próximo golpe (até +3, dentro do teto)."],
      [30, "Rajada de Golpes 2.0", "A Rajada faz 3 golpes."],
      [33, "Contra-golpe Fluido", "1x/rodada, quando um inimigo erra um ataque corpo a corpo contra você, faz um golpe desarmado nele, sem gastar Reação."],
      [36, "Alma de Diamante", "Proficiência em todos os testes de resistência; 1 PE: rola de novo um teste que falhou."],
      [39, "Golpe Atordoante 2.0", "Quem passar no teste do Golpe Atordoante fica Desestabilizado até o fim do próximo turno."],
      [42, "Passo Fantasma", "Ação Bônus, 3 PE: teleporta-se até 9 m para um lugar que veja."],
      [45, "Punho do Trovão", "1x/cena, Ação Padrão: golpe que atinge todos a até 3 m: 8d10 de Força, Reflexo para metade; quem falhar fica Caído."],
      [48, "Forma Perfeita (capstone)", "1x por Descanso Longo, por 1 minuto: técnicas custam metade do PE, o golpe desarmado usa 2d12, a Rajada faz 4 golpes e você é imune a Atordoado, Caído e Agarrado."]
    ]
  },
  barbaro: {
    nome: "Bárbaro", arquetipo: "combatente",
    descricao: "Meio tanque, meio dano: entra em Fúria e, enquanto ela dura, bate mais forte e aguenta mais. Sem armadura pesada e sem sutileza: força bruta e teimosia. Faz bem: dano corpo a corpo alto e aguentar pancada ao mesmo tempo. Faz mal: furtividade, ataques a distância e resistir a magias mentais (antes do Nv. 42). Precisa de: Fúrias disponíveis; fora da Fúria, é um combatente comum.",
    regras: [
      "Fúria: Ação Bônus. Dura 1 minuto, ou até você terminar um turno sem ter atacado nem sofrido dano. Enquanto dura, gasta PE no início de cada turno seu (custo pela faixa); sem PE para pagar, a Fúria acaba.",
      "Durante a Fúria: dano extra em cada acerto corpo a corpo (fixo, por faixa), RD física, vantagem em testes de Força e Fortitude. Não pode conjurar magias.",
      "Por faixa (3–10 / 11–20 / 21–30 / 31–40 / 41–50): dano +2 / +3 / +4 / +5 / +6; RD física 2 / 4 / 6 / 8 / 10; custo por turno 2 / 3 / 4 / 5 / 6 PE.",
      "Usos por Descanso Longo: 2 (Nv. 3), 3 (Nv. 15), 4 (Nv. 27), 5 (Nv. 39), sem limite (Nv. 48).",
      "Crítico Brutal: dá dados extras da arma no crítico iguais ao multiplicador do crítico. Exemplo: arma de 2d10 com x3 causa 6d10 (crítico normal) + 3d10 (Crítico Brutal). No Nv. 30, o dobro."
    ],
    furia: {
      tabela: [[3, 2, 2, 2], [11, 3, 4, 3], [21, 4, 6, 4], [31, 5, 8, 5], [41, 6, 10, 6]],
      usos: [[3, 2], [15, 3], [27, 4], [39, 5], [48, 999]]
    },
    habilidades: [
      [3, "Fúria", "Ganha a Fúria (2 usos)."],
      [6, "Instinto Perigoso", "Vantagem em Reflexo contra efeitos que você veja; não pode ser Surpreendido em Fúria."],
      [9, "Golpe Imprudente", "No início do seu ataque, escolha: vantagem nos ataques corpo a corpo neste turno, mas inimigos têm vantagem contra você até o seu próximo turno."],
      [12, "Fúria Implacável", "Em Fúria, ao cair a 0 PV, Fortitude CD 10 (+5 a cada vez na mesma cena): passou, fica com 1 PV."],
      [15, "Investida Brutal", "Ao se mover pelo menos 6 m em linha reta antes de atacar, o primeiro acerto do turno derruba (Fortitude contra a CD de Maestria) e causa +1 dado de dano. Fúria: 3 usos."],
      [18, "Crítico Brutal", "Críticos corpo a corpo causam dados extras da arma iguais ao multiplicador do crítico."],
      [21, "Sede de Sangue", "Em Fúria, ao derrubar um inimigo a 0 PV, recupera PV iguais a 2 × Constituição (1x/turno)."],
      [24, "Rugido Intimidador", "Ação Bônus, 1x/cena: inimigos a até 9 m fazem Vontade ou ficam Apavorados até o fim do próximo turno."],
      [27, "Fúria Total", "A RD da Fúria vale contra todo dano, não só físico. Fúria: 4 usos."],
      [30, "Crítico Brutal 2.0", "Os dados extras do Crítico Brutal dobram (2 × o multiplicador)."],
      [33, "Fúria Persistente", "A Fúria só termina se você quiser, cair inconsciente ou não puder pagar o PE."],
      [36, "Pele de Pedra", "Fora da Fúria, RD física igual à metade da RD da Fúria."],
      [39, "Golpe Arrasador", "Em Fúria, o multiplicador de crítico de todos os seus ataques aumenta em +1 (x2 vira x3). Fúria: 5 usos."],
      [42, "Fúria Incontrolável", "Em Fúria, imune a Abalado, Apavorado, Confuso e Dominado."],
      [45, "Gigante Furioso", "Em Fúria, pode ficar Grande (alcance +1,5 m, +1 dado de dano 1x/turno)."],
      [48, "Fúria Primordial (capstone)", "Fúria sem limite de usos; +4 em Força e Constituição (pode passar do máximo). 1x por Descanso Longo, por 1 minuto, a Fúria dá o dobro de dano extra e de RD e não gasta PE."]
    ]
  },
  guardiao: {
    nome: "Guardião", arquetipo: "combatente",
    descricao: "O tanque bruto: existe para defender a si e ao grupo. Puxa a atenção dos inimigos, recebe golpes no lugar dos aliados e quase não cai. Faz bem: aguentar dano, proteger aliados, segurar inimigos perto de si. Faz mal: causar dano e perseguir inimigos que fogem. Precisa de: aliados que causem o dano enquanto ele segura a linha.",
    regras: [
      "Provocação: Ação Bônus, 2 PE. O alvo (a até 9 m) faz Vontade contra a CD de Maestria; se falhar, até o fim do próximo turno dele tem desvantagem para atacar qualquer criatura que não seja você. Provocação em Área: 5 PE.",
      "Guarda: Reação, 2 PE, quando um aliado a até 1,5 m (3 m no Nv. 15; até o seu deslocamento no Nv. 36) é atacado: você vai até ele e vira o alvo do ataque. Não gasta a ação do próximo turno (só a Reação).",
      "Por faixa (3–10 / 11–20 / 21–30 / 31–40 / 41–50): Couraça (RD contra todo dano) 3 / 5 / 7 / 9 / 12; Muralha de Escudo (CA dos aliados ao lado) +1 / +2 / +3 / +4 / +5."
    ],
    couraca: faixa(3, 5, 7, 9, 12),
    muralha: faixa(1, 2, 3, 4, 5),
    habilidades: [
      [3, "Juramento de Proteção", "Ganha Provocação e Guarda. Proficiência com todos os escudos e armaduras pesadas."],
      [6, "Muralha de Escudo", "Com escudo, aliados ao seu lado ganham o bônus de CA da faixa."],
      [9, "Represália", "Reação, 2 PE: quando um inimigo ao seu lado ataca outra criatura, você faz um ataque nele."],
      [12, "Couraça", "RD contra todo dano pela faixa."],
      [15, "Guarda 2.0", "A Guarda alcança aliados a até 3 m (você se move até o lado dele, sem provocar ataques)."],
      [18, "Fortaleza", "Não pode ser empurrado nem derrubado contra a vontade; vantagem contra Atordoado."],
      [21, "Absorver", "Reação, 4 PE, 1x/rodada: metade do dano que um aliado a até 9 m sofreria vem para você (a sua RD vale)."],
      [24, "Zona de Controle", "Inimigos que começam o turno a até 3 m de você tratam essa área como terreno difícil e provocam ataque de oportunidade ao sair dela, mesmo com Recuo."],
      [27, "Provocação em Área", "A Provocação afeta até 3 inimigos a até 9 m."],
      [30, "Inquebrável", "1x por Descanso Longo, ao cair a 0 PV, fica com PV iguais a 4 × Constituição."],
      [33, "Couraça 2.0", "A RD da Couraça também vale para os aliados protegidos pela Muralha de Escudo (ao seu lado) e para quem você protege com a Guarda."],
      [36, "Guarda Total", "O alcance da Guarda passa a ser igual ao seu deslocamento, e ela pode ser usada 2x/rodada (a segunda não gasta Reação, só PE)."],
      [39, "Escudo Refletor", "3 PE, 1x/rodada, quando um ataque erra você ou o aliado protegido, o atacante sofre o dano do seu escudo ou arma + Constituição."],
      [42, "Bastião Final", "Aliados a até 3 m têm vantagem em testes de resistência e +RD igual à metade da Couraça."],
      [45, "Juramento Eterno", "10 PE, 1x/cena, por 1 rodada, aliados a até 9 m não caem abaixo de 1 PV."],
      [48, "Último Muro (capstone)", "20 PE, 1x por Descanso Longo, por 1 minuto: você não cai abaixo de 1 PV, a Couraça dobra, a Guarda e a Provocação não têm limite por rodada e todos os inimigos a até 9 m ficam Provocados por você."]
    ]
  },
  arqueiro: {
    nome: "Arqueiro", arquetipo: "combatente",
    descricao: "O dano a distância: arcos, bestas e armas de arremesso. Aprende Estilos de Tiro e de Caçador, lê os inimigos antes de atirar e, nos níveis altos, solta várias flechas num só disparo. Faz bem: dano a distância, escolher o alvo, derrubar alvos grandes e grupos. Faz mal: lutar de perto e segurar inimigos. Precisa de: uma linha de frente e munição.",
    regras: [
      "Estilos de Tiro (Nv. 3, mais um no 12 e no 27; aprimorados no 21 e maximizados no 39; separados dos Estilos de Combate do arquétipo; contam no Teto de Bônus): Tiro Distante (+10 m de alcance máximo / +20 m / +40 m); Mira Apurada (+2 / +5 / +10 em Pontaria); Disparo Potente (+1 / +2 / +4 dados de dano da arma); Precisão (+1 / +2 / +3 na Margem de Ameaça a distância, e +1 no multiplicador no máximo); Defesa (+1 / +2 / +3 CA).",
      "Estilos do Caçador (Nv. 6, mais um no 18 e no 36): Assassino de Gigantes (1x/turno, +1d8 de dano para cada categoria de tamanho que o alvo tiver acima da sua); Atirador Ardiloso (1x/turno, contra alvo Desprevenido ou flanqueado: +1d6 de dano, +1d6 nos níveis 10, 20, 30 e 40, máximo 5d6); Exterminador de Hordas (quando dois inimigos estiverem lado a lado, um disparo atinge os dois).",
      "Flechas Especiais (Nv. 12; uma por disparo; testes contra a CD de Maestria, 10 + Pontaria): Perfurante 2 PE (atravessa e atinge a criatura atrás, em linha); Explosiva 3 PE (raio de 1,5 m: 1d6 / 2d6 / 3d6 / 4d6 / 5d6 Explosivo, Reflexo para metade); Imobilizante 3 PE (Fortitude ou fica Preso até o fim do próximo turno); Sinalizadora 1 PE (o alvo brilha por 1 minuto: não pode ficar invisível nem escondido)."
    ],
    habilidades: [
      [3, "Estilo de Tiro e Olho de Falcão", "Escolhe o 1º Estilo de Tiro. Alcance das armas a distância +50%; ignora meia cobertura. Mirar: Ação Bônus, +2 no próximo disparo do turno."],
      [6, "Estilo do Caçador", "Escolhe o 1º Estilo do Caçador."],
      [9, "Sentido de Caçador", "Ação Padrão: descobre as Resistências e Imunidades de uma criatura a até 18 m."],
      [12, "Segundo Estilo de Tiro", "Escolhe o 2º Estilo de Tiro e ganha as Flechas Especiais."],
      [15, "Mentalidade de Patrulheiro", "Observando um alvo por 1 minuto fora de combate, descobre os PV máximos, a CA e os atributos dele. Vantagem na iniciativa e contra Apavorado. Terreno difícil não reduz seu deslocamento e você sempre sabe onde fica o norte."],
      [18, "Segundo Estilo do Caçador", "Escolhe o 2º Estilo do Caçador. Recuo Tático: Ação Bônus, move-se metade do deslocamento sem provocar ataques."],
      [21, "Multi-Tiro", "1x/turno, um disparo solta 2 flechas: os dados da arma dobram (só os dados da arma, não os de habilidades). Estilos de Tiro aprimorados."],
      [24, "Chuva de Flechas", "Ação Padrão, 6 PE, 1x/cena: área de 6 m a até o alcance; cada criatura sofre o dano da arma (Reflexo para metade)."],
      [27, "Terceiro Estilo de Tiro", "Escolhe o 3º Estilo de Tiro."],
      [30, "Ricochete", "1x/turno, quando um disparo erra, ricocheteia num segundo alvo a até 6 m do primeiro (novo ataque)."],
      [33, "Multi-Tiro 2.0", "O Multi-Tiro solta 3 flechas (dados da arma ×3)."],
      [36, "Terceiro Estilo do Caçador", "Escolhe o 3º Estilo do Caçador."],
      [39, "Estilos Maximizados", "Os Estilos de Tiro chegam ao valor máximo. Chuva de Flechas 2x/cena."],
      [42, "Multi-Tiro 3.0", "O Multi-Tiro solta 4 flechas (dados da arma ×4)."],
      [45, "Flecha Lendária", "1x/cena: um disparo com +8d10 de dano e todas as Flechas Especiais ao mesmo tempo, sem custo."],
      [48, "Lenda do Arco (capstone)", "1x por Descanso Longo, por 1 minuto: Flechas Especiais sem custo, Multi-Tiro em todos os disparos do turno e alcance sem limite enquanto você enxergar o alvo."]
    ]
  },
  guerreiroElemental: {
    nome: "Guerreiro Elemental", arquetipo: "combatente",
    descricao: "Transforma a mana em poder elemental: fogo, água, ar, terra e suas evoluções fortalecem os ataques, adaptam a luta aos inimigos e controlam o campo. O foco é o combate direto com a Arma Elemental, alternando entre elementos. Faz bem: dano elemental constante, adaptar o elemento à fraqueza do inimigo, resistir a elementos e magias. Faz mal: inimigos imunes a vários elementos (até o Tier 4) e proteger aliados. Precisa de: saber as fraquezas do inimigo (Visão Elemental).",
    regras: [
      "Elemento Principal: fora de combate, escolhe livremente um elemento desbloqueado. Em combate, trocar é ação livre, 1x/turno (2x/turno no Nv. 42), até entre ataques. Define o elemento da Arma Elemental e das habilidades da classe, não o das magias comuns. Os elementos nunca se perdem: cada tier libera as evoluções dos anteriores.",
      "Tiers: T1 (Nv. 3) Fogo, Água, Ar, Terra; T2 (Nv. 12) Raio (Relâmpago, evolução do Fogo) e Gelo (Frio, evolução da Água); T3 (Nv. 27) Som (Sonoro, evolução do Ar) e Pressão (Força, evolução da Terra); T4 (Nv. 39) Fogo Azul, Raio Negro, Ácido, Zero Absoluto, Vendaval, Ruído e Gravidade, cada um ignorando a Imunidade e a Resistência ao elemento de origem e aplicando o efeito dele; Especiais (com o Mestre) Sombra, Necrótico e Radiante.",
      "Efeitos (pela Arma Elemental Superior, Explosão Branca e Domínio Elemental; teste contra a CD de Maestria; duram no máximo 1 rodada; efeitos que tiram ações só 1x/rodada por alvo; dano do efeito 1d6 / 2d6 / 3d6 / 4d6 / 5d6 pela faixa): Fogo Em Chamas; Raio Eletrizado (não atordoa); Água Molhado (deslocamento pela metade e o próximo Relâmpago dobra); Gelo Congelado (não se desloca); Ar Flutuando; Som Surdo; Terra Lento; Pressão/Gravidade Caído; Sombra Assustado; Necrótico Vampirismo (recupera metade do dano Necrótico); Radiante Iluminado (metade do dano Radiante vira PV para aliados, divididos como quiser).",
      "Arma Elemental (dados por acerto): 1d6 (Nv. 3), 1d8 (12), 1d10 (21), 2d8 (27), 2d10 (39), 2d12 (48). Núcleo Vermelho (fixo por acerto, não multiplica no crítico): +5 (3), +10 (12), +15 (21), +20 (30), +25 (39), +30 (48). Margem de Ameaça: +1 (3), +2 (12), +3 (27), +4 (48)."
    ],
    arma: [[3, "1d6"], [12, "1d8"], [21, "1d10"], [27, "2d8"], [39, "2d10"], [48, "2d12"]],
    nucleoVermelho: [[3, 5], [12, 10], [21, 15], [30, 20], [39, 25], [48, 30]],
    margem: [[3, 1], [12, 2], [27, 3], [48, 4]],
    efeitoNivel: 39, efeitoDano: 20,
    elementos: [[3, ["Fogo", "Água", "Ar", "Terra"]], [12, ["Raio", "Gelo"]], [27, ["Som", "Pressão"]], [39, ["Fogo Azul", "Raio Negro", "Ácido", "Zero Absoluto", "Vendaval", "Ruído", "Gravidade"]]],
    habilidades: [
      [3, "Despertar Elemental", "Ganha a Arma Elemental (o Elemento Principal causa os dados extras em todo acerto), o Núcleo Vermelho e o Tier 1."],
      [6, "Pele de Mana", "Sempre tem Resistência a um elemento desbloqueado (não precisa ser o Principal). Pode trocar 1x por combate, com ação livre."],
      [9, "Corpo e Mente Fortificados", "+5 nos testes de ataque e de resistência."],
      [12, "Refinamento Vermelho", "Arma Elemental 1d8, Núcleo Vermelho +10, Margem +2. Libera o Tier 2."],
      [15, "Contra-Ataque Elemental", "1x/rodada, depois de um Contra-ataque bem-sucedido no turno do inimigo, usa o Ataque Extra na hora (pagando o PE). Esse uso não conta: no seu turno, você ainda usa o Ataque Extra normalmente."],
      [18, "Visão Elemental", "Ação Padrão: descobre as Vulnerabilidades, Resistências e Imunidades elementais de uma criatura e vê concentrações de mana e seus elementos."],
      [21, "Refinamento Vermelho II", "Arma Elemental 1d10, Núcleo Vermelho +15."],
      [24, "Fluxo Elemental", "Ao trocar o Elemento Principal, o primeiro acerto depois da troca causa +1 dado da Arma Elemental."],
      [27, "Corpo Elemental", "Ao passar num teste de resistência contra efeito de \"metade do dano\", não sofre dano. Arma Elemental 2d8, Margem +3. Libera o Tier 3."],
      [30, "Refinamento Vermelho III e Refinamento Elemental", "Núcleo Vermelho +20. Pode dividir os dados da Arma Elemental entre dois elementos desbloqueados (ex.: 1d8 Fogo e 1d8 Relâmpago) e aplicar o efeito dos dois."],
      [33, "Núcleo Branco", "Explosão Branca: 1x/turno, ao acertar com a Arma Elemental, os dados dela explodem de novo em todos os outros inimigos a até 1,5 m do alvo (Reflexo para metade) e aplicam o efeito do elemento."],
      [36, "Corpo de Mana", "Resistência a dano mágico e Imunidade a um elemento desbloqueado (troca no descanso)."],
      [39, "Arma Elemental Superior", "Arma Elemental 2d10, Núcleo Vermelho +25. Libera o Tier 4. Ao causar 20 ou mais de dano elemental num ataque, aplica o efeito do elemento (1x/rodada por alvo, com teste)."],
      [42, "Núcleo Transparente", "Troca de Elemento Principal 2x/turno. A Arma Elemental ignora Resistência a qualquer elemento (Imunidade só com o Tier 4)."],
      [45, "Domínio Elemental", "1x/combate, Ação Bônus, 3 rodadas: aura de 3 m do Elemento Principal. Inimigos que começam o turno nela sofrem o dano do efeito e fazem o teste do efeito; aliados nela têm Resistência ao elemento; todo acerto seu aplica o efeito, sem precisar dos 20 de dano."],
      [48, "Refinamento Máximo e Avatar Elemental (capstone)", "Arma Elemental 2d12, Núcleo Vermelho +30, Margem +4. 1x/combate, ação livre, 3 rodadas: a Arma Elemental causa o dobro de dados, com os dados inteiros de dois elementos e os dois efeitos em todo acerto; imune aos dois elementos; ignora Resistências e Imunidades elementais. Só volta depois de um descanso."]
    ]
  },
  alice: {
    nome: "Portadora do País Impossível", arquetipo: "combatente",
    descricao: "Alice: uma combatente ágil e imprevisível que transforma esquivas, armas e a própria realidade em instrumentos de combate. A Faca Vorpal copia formas de armas, e a loucura do País das Maravilhas distorce o campo de batalha. Faz bem: ataques rápidos, esquivas, mobilidade e criatividade com o ambiente. Faz mal: aguentar dano direto e enfrentar inimigos que não podem ser enganados. Precisa de: um Mestre que aceite as Manifestações Impossíveis.",
    regras: [
      "Faca Vorpal: item único que guarda Formas de Arma (3 no Nv. 3, 5 no 21, 6 no 30, 7 no 39). Ao tocar uma arma, copia a forma básica dela (sem encantamentos nem habilidades únicas). A forma não pode superar uma arma comum do seu nível.",
      "Manifestação: alteração temporária do ambiente; o Mestre decide os detalhes. Não causa dano nem prende sozinha.",
      "Histeria: ativa quando os PV caem ao limiar da faixa ou menos: 40 (Nv. 15–20), 60 (21–30), 80 (31–40), 100 (41–50). 1x por combate, 3 rodadas.",
      "Testes contra a CD de Maestria (10 + Luta)."
    ],
    formas: [[3, 3], [21, 5], [30, 6], [39, 7]],
    limiarHisteria: [[15, 40], [21, 60], [31, 80], [41, 100]],
    habilidades: [
      [3, "Faca Vorpal", "Ganha a Faca (3 formas). Corte Vorpal: 1x/turno, ao acertar com a Faca, faz um segundo ataque no mesmo alvo, só com o dano básico da forma."],
      [6, "Esquiva de Borboletas", "Ao usar a Esquiva, vira borboletas e se move até 3 m, atravessando criaturas e espaços pequenos. Se o ataque errar, ataca o agressor com a Faca como ação livre (1x/rodada, sem Corte Vorpal)."],
      [9, "País das Maravilhas", "Ação livre, 3 rodadas: percebe passagens ocultas, objetos e criaturas invisíveis ou escondidas, armadilhas e fraquezas estruturais; vê através de ilusões comuns."],
      [12, "Loucura Criativa", "1x/turno, durante uma ação, cria uma pequena Manifestação Impossível (apoio, passagem estreita, mudar o tamanho de um objeto, desviar um objeto em movimento)."],
      [15, "Fúria da Loucura", "Histeria (ação livre, 3 rodadas, 1x/combate): +5 nos ataques, imune a Apavorado, ataques com a Faca +1d10, ignora redução de deslocamento."],
      [18, "Tamanho Não Importa", "Ação Bônus: Forma Pequena (passa por espaços estreitos, +5 em testes de Destreza, sem armas pesadas) ou Gigante (+1d10 corpo a corpo, destrói obstáculos, deslocamento pela metade)."],
      [21, "Arsenal Expandido", "5 formas; trocar de forma é ação livre 1x/turno."],
      [24, "Imaginação Materializada", "Ação Padrão, 3 rodadas: cria plataforma, parede, armadilha simples, ferramenta ou mecanismo básico (armadilha permite teste de resistência)."],
      [27, "Dança Impossível", "1x/turno, antes ou depois de atacar com a Faca, move-se até 5 m sem ação e sem provocar ataques; ataques de oportunidade contra você têm desvantagem."],
      [30, "Arsenal Distorcido", "6 formas; as novas têm uma habilidade básica (definida com o Mestre). Ao trocar de forma, usa a habilidade dela sem ação, 1x/turno."],
      [33, "Pesadelo Manifestado", "1x/combate, Ação Padrão: uma criatura faz Vontade; se falhar, por até 3 rodadas tem −5 em ataques e testes de resistência e não usa Reações contra você (repete o teste no fim de cada turno)."],
      [36, "Mundo de Cabeça para Baixo", "1x/combate, Ação Padrão, 3 rodadas: muda uma regra numa área (objetos sobem, paredes viram chão, distâncias distorcidas, pequenos ficam pesados, grandes ficam leves). Afeta todos."],
      [39, "Arsenal do Pesadelo", "7 formas, com até duas habilidades. Ataques normais com a Faca causam +2d10 (não o Corte Vorpal)."],
      [42, "País Impossível", "1x/combate, Ação Padrão, 3 rodadas: área distorcida (gravidade limitada, andar em paredes e teto, passagens impossíveis); 1x/rodada, uma Manifestação sem ação; inimigos dentro têm −3 nos testes contra você."],
      [45, "Histeria Absoluta", "Forma verdadeira da Histeria (substitui a normal): ataques com a Faca +2d10, Esquiva como ação livre 1x/rodada, duas Formas de Arma no mesmo turno, troca de forma sem ação, imune a Apavorado, Atordoado e Encantado."],
      [48, "Alice no País Impossível (capstone)", "1x/combate, ação livre, 3 rodadas: a área vira o País Impossível; muda de tamanho como ação livre; duas formas por turno; 1x/rodada, faz um ataque que a acertaria errar; uma vez, ao chegar a 0 PV, fica com 1 PV e se move 5 m. Não recupera PV nem habilidades."]
    ]
  },
  bastiao: {
    nome: "Bastião Inquebrável", arquetipo: "combatente", extra: true,
    descricao: "Uma combatente que abandonou qualquer preocupação com poder ofensivo para alcançar o limite da própria resistência. A força dela não está em derrotar inimigos, mas em continuar de pé quando qualquer outro já teria caído. Não protege o grupo interceptando ataques: simplesmente se recusa a ser derrotada. Faz bem: sobreviver, resistir a condições e controle, segurar a posição. Faz mal: dano e proteger aliados (isso é do Guardião). Precisa de: PE para as reações de defesa.",
    regras: [
      "Corpo Inabalável: 1x/rodada, ao sofrer dano, reduz esse dano (depois de Resistências e Vulnerabilidades) em 1d10 + Constituição (Nv. 6), 2d10 + Con. (12), 3d10 + Con. (27), 4d10 + Con. (33) e 6d10 + Con. no capstone ativo."
    ],
    corpoInabalavel: [[6, "1d10"], [12, "2d10"], [27, "3d10"], [33, "4d10"]],
    habilidades: [
      [3, "Defesa Absoluta", "+1 CA, +20 PV máximos e +2 nos testes de resistência."],
      [6, "Corpo Inabalável", "1x/rodada, reduz o dano sofrido em 1d10 + Constituição."],
      [9, "Resistência Extraordinária", "Vantagem nos testes contra Envenenado, Paralisado, Atordoado, Apavorado, Dormindo e controle mental."],
      [12, "Estrutura Reforçada", "+20 PV máximos, +1 CA. Corpo Inabalável: 2d10 + Constituição."],
      [15, "Imóvel", "Não pode ser derrubada, empurrada ou puxada por efeitos físicos comuns; vantagem contra efeitos sobrenaturais que tentem isso. Teleporte continua funcionando."],
      [18, "Recuperação Defensiva", "1x/rodada, depois de sofrer dano, gasta 8 PE para recuperar 2d10 + Constituição PV."],
      [21, "Adaptação Defensiva", "Reação, 10 PE: ao sofrer dano de um tipo, ganha Resistência a ele até o início do seu próximo turno (uma por vez)."],
      [24, "Fortaleza Mental", "Imune a Dormindo e Apavorado comuns; vantagem contra controle mental e manipulação. Efeitos que a obriguem a abandonar a posição permitem teste de resistência."],
      [27, "Corpo Inquebrável", "Corpo Inabalável: 3d10 + Constituição. Resistência permanente a dano físico (Contundente, Cortante, Perfurante)."],
      [30, "Persistência Absoluta", "Terreno difícil não reduz o deslocamento; efeitos não o reduzem abaixo de 1,5 m; ignora penalidades de dor e exaustão física comum; continua consciente enquanto tiver PV."],
      [33, "Estrutura Colossal", "+30 PV máximos, +1 CA. Corpo Inabalável: 4d10 + Constituição."],
      [36, "Resistência Mágica", "Resistência permanente a dano mágico; vantagem contra magias que causem condições."],
      [39, "Sobrevivência Extrema", "Recuperação Defensiva cura 4d10 + Constituição e encerra uma condição: Envenenado, Sangrando, Cego, Surdo, Apavorado ou Atordoado (ainda 8 PE, 1x/rodada)."],
      [42, "Imortalidade Condicional", "1x/cena, ao cair a 0 PV, gasta 15 PE para ficar com 1 PV (não funciona contra destruição total do corpo ou morte direta)."],
      [45, "Resistência Absoluta", "Reação, 15 PE, 1x/rodada: imune ao tipo de dano que acabou de sofrer até o início do seu próximo turno (não vale contra dano Verdadeiro ou efeitos que ignoram Imunidade)."],
      [48, "O Bastião Intransponível (capstone)", "1x/cena, Ação Bônus, 25 PE e 20 PM, 3 rodadas: +3 CA, +50 PV temporários, Corpo Inabalável 6d10 + Constituição, imune a dano físico comum, a Envenenado, Paralisado, Apavorado e Dormindo; não pode ser empurrada, puxada, derrubada nem ter o deslocamento reduzido; na primeira vez que chegar a 0 PV, fica com 1 PV. Não dá ataques nem protege aliados."]
    ]
  },
  guerreiroVazio: {
    nome: "Guerreiro do Vazio", arquetipo: "combatente", extra: true,
    descricao: "Manifesta ecos de si mesmo, reflexos de existências que poderiam ter sido. Eles reproduzem sua aparência e seus movimentos, deixando-o lutar de várias posições, atravessar o campo num instante e virar várias ameaças. Faz bem: controle de posição, trocar de lugar, atacar de onde o inimigo não espera, proteger com o Eco. Faz mal: dano em área e lutas em espaços pequenos. Precisa de: PE para os ataques e as trocas do Eco.",
    regras: [
      "O Eco: Ação Bônus, cria um Eco num espaço livre que enxergue a até 4,5 m. Aparência igual à sua, 1 PV, usa a sua CA e o seu Bloqueio, imune a condições, copia a arma que você empunha. Não tem PV, PE ou PM próprios. Some se você ficar incapacitado ou criar outro.",
      "Turno do Eco: logo depois do seu turno. Move-se até 9 m (sem passar de 9 m de você) e faz uma Ação Padrão (sem Ação Bônus nem Reação).",
      "Ataque do Eco: 5 PE, um ataque com a arma copiada, usando os seus números. Não usa nem conta para o Ataque Extra e não gera outros ataques.",
      "Atacar através do Eco: no seu turno, seus ataques podem sair da sua posição ou da do Eco, com todas as suas habilidades."
    ],
    habilidades: [
      [3, "Manifestação do Eco", "Cria o Eco (regras da classe)."],
      [6, "Troca de Existência", "Ação Bônus: troca de lugar com o Eco (custa 3 m do deslocamento; não provoca ataques)."],
      [9, "Avatar do Eco", "Ação Padrão: vê e ouve só pelo Eco, que pode ir até 90 m; seu corpo fica parado e você não ataca nem conjura. Até 10 minutos."],
      [12, "Ameaça Projetada", "Com o inimigo entre você e o Eco, o primeiro acerto contra ele na rodada causa +1d8 de Força."],
      [15, "Interposição do Vazio", "Reação, 8 PE: quando você ou um aliado a até 6 m do Eco é alvo de um ataque individual, o Eco aparece ao lado e vira o alvo. Se o ataque acertar, o Eco some e o protegido não sofre dano."],
      [18, "Ruptura Ressonante", "1x/turno, ao acertar de qualquer origem, 6 PE: empurra ou puxa o alvo 1,5 m."],
      [21, "Desencadear Incarnation", "+10 PE no ataque do Eco: +1d10 de Força."],
      [24, "Eco Distante", "Alcance do Eco: 15 m; ele se move até 12 m por turno sem gastar ações. O Avatar do Eco perde o limite de distância."],
      [27, "Troca Perfeita", "A Troca de Existência não gasta deslocamento."],
      [30, "Tiro de Vigília", "A Ação Padrão do Eco pode preparar uma linha de observação de até 18 m: a primeira criatura hostil que cruzar dá +5 no seu primeiro ataque contra ela."],
      [33, "Interposição do Vazio II", "Alcance de 12 m, e o Eco pode se mover 6 m antes de se posicionar."],
      [36, "Desencadear Incarnation II", "O dano extra sobe para 2d10 de Força (ainda 10 PE)."],
      [39, "Segunda Manifestação", "Até 2 Ecos (o segundo custa +5 PE). Um só turno do Eco: só um deles faz a Ação Padrão; um ataque de Eco por rodada."],
      [42, "Ruptura de Retorno", "1x/rodada, quando um Eco é destruído por ataque, você se teleporta até 3 m para o lado de onde ele sumiu (sem ação, sem provocar ataques)."],
      [45, "Cerco das Duas Existências", "Com dois Ecos ao lado do alvo, ao acertar: 8 PE para +2d10 de Força (1x/rodada)."],
      [48, "Legião do Vazio (capstone)", "1x/cena, Ação Bônus, 20 PE, 3 rodadas: até 3 Ecos a até 18 m, cada um se move 12 m; ataques de qualquer Eco; troca de lugar com qualquer um. Um só turno do Eco. Convergência: 1x/rodada, quando o Eco acerta, 5 PE para +2d10 de Força (basta o alvo estar ao lado de dois Ecos)."]
    ]
  },

  /* ============================ CONJURADOR ============================ */
  mago: {
    nome: "Mago", arquetipo: "conjurador",
    descricao: "O estudioso da magia: aprende muito mais magias que qualquer outra classe, guarda tudo num grimório, copia magias que encontra e domina escolas inteiras. Não é o mais forte num único truque; é o que tem a resposta certa para quase toda situação. Faz bem: versatilidade, utilidade fora de combate, desfazer magias inimigas, pergaminhos para o grupo. Faz mal: aguentar dano e lutar de perto. Precisa de: proteção e tempo para estudar.",
    regras: [
      "Magias de Estudo: além do Acúmulo do arquétipo, aprende 2 magias de Estudo em cada nível de classe (3, 6, 9 … 48), de qualquer círculo liberado (32 a mais no Nv. 48, fora das copiadas).",
      "Copiar magias: 1 hora e 25 PO por círculo (Truque: 10 minutos, sem custo) e teste de Arcanismo contra CD 10 + 5 por círculo. Passou, a magia entra no grimório (sem limite). Só copia magias de círculos já liberados.",
      "Grimório físico: é um item. Se for perdido, as magias do Acúmulo e de Estudo continuam; as copiadas precisam ser recopiadas (ou do backup, Nv. 30).",
      "Reescrever: a cada Descanso Longo, pode trocar até 2 magias de Estudo por outras do grimório.",
      "Escolas de Especialização nos níveis 3, 12, 21, 30 e 39 (e todas as 8 no Nv. 48). Magias da escola custam 2 PM a menos (mín. 0) e ganham CD extra pela faixa: +2 (3–20), +3 (21–30), +4 (31–40), +5 (41–50); soma com a Mente Arcana e respeita o Teto de Bônus.",
      "Efeito de cada escola: Abjuração (ao conjurar, PV temporários iguais ao Núcleo); Adivinhação (1x por Descanso Longo, rola 2d20 e guarda os resultados para trocar qualquer d20); Conjuração (1x/turno, depois de conjurar, teleporta-se 3 m); Encantamento (afetados têm −2 no próximo teste de resistência contra você); Evocação (áreas excluem até Núcleo ÷ 2 aliados; dano soma metade do Núcleo uma vez); Ilusão (quem duvida faz o teste com desvantagem); Necromancia (1x/turno, recupera PV iguais à metade do Núcleo ao causar dano); Transmutação (efeitos em aliados duram o dobro; 1x por Descanso Longo, transforma um objeto pequeno não mágico por 1 hora)."
    ],
    habilidades: [
      [3, "Estudo Arcano", "Ganha o Grimório do Mago (2 magias de Estudo) e a cópia de magias. Escolhe a 1ª Escola de Especialização. Mente Arcana: todas as suas magias têm CD +1 (+2 no Nv. 27, +3 no Nv. 42)."],
      [6, "Memória Arcana", "+2 magias de Estudo. 1x por Descanso Longo, ao terminar um Descanso Curto, recupera PM iguais a 3 × Núcleo."],
      [9, "Magia Adaptável", "+2 magias de Estudo. 1x/turno, paga 2 PM para trocar o tipo de dano de uma magia por outro Natural ou Mágico (ex.: Fogo → Frio)."],
      [12, "Pergaminhos", "+2 magias de Estudo. No Descanso Longo, escreve pergaminhos (metade do Núcleo, para baixo) de magias do grimório de até 2º círculo (até 4º no Nv. 30). Qualquer pessoa usa, com a sua CD e o seu acerto, sem gastar PM. Somem no próximo Descanso Longo. Escolhe a 2ª Escola de Especialização."],
      [15, "Neutralizador", "+2 magias de Estudo. Seus testes de neutralização (incluindo a magia Contramágica) somam metade do Núcleo, e a Contramágica custa metade dos PM."],
      [18, "Mente Dividida", "+2 magias de Estudo. Pode manter 2 magias de concentração ao mesmo tempo (com Domínio de Conjuração: Sustentação, 3)."],
      [21, "Terceira Escola", "+2 magias de Estudo. Escolhe a 3ª Escola de Especialização."],
      [24, "Domínio de Círculo", "+2 magias de Estudo. Escolha 1 magia de 1º e 1 de 2º círculo do grimório: cada uma pode ser conjurada sem PM 1x/cena. Pode trocar a escolha no Descanso Longo."],
      [27, "Magia Rápida", "+2 magias de Estudo. 1x/cena, conjura uma magia de Ação Padrão como Ação Bônus. Mente Arcana: CD +2."],
      [30, "Biblioteca Viva", "+2 magias de Estudo. Pode conjurar uma magia que não conhece direto de um pergaminho ou grimório que esteja segurando, pagando +50% dos PM (sem gastar o pergaminho). Guarda um backup mental do grimório. Escolhe a 4ª Escola de Especialização."],
      [33, "Potência Arcana", "+2 magias de Estudo. Magias das suas Escolas de Especialização causam +1 dado de dano ou de cura."],
      [36, "Magia Penetrante", "+2 magias de Estudo. Magias das suas Escolas de Especialização ignoram Resistência ao dano delas (Imunidade continua valendo)."],
      [39, "Domínio de Círculo 2.0", "+2 magias de Estudo. Escolha também 1 magia de 3º e 1 de 4º círculo para o Domínio de Círculo. Escolhe a 5ª Escola de Especialização."],
      [42, "Fluxo Ininterrupto", "+2 magias de Estudo. Quando uma magia sua erra todos os alvos ou todos passam no teste, recupera metade dos PM dela. Magia Rápida 2x/cena. Mente Arcana: CD +3."],
      [45, "Arquimago", "+2 magias de Estudo. Escolha 1 magia de 5º círculo do grimório: conjura sem PM 1x/cena."],
      [48, "Grande Arquimago (capstone)", "+2 magias de Estudo. Domina todas as 8 escolas (especialização em todas). 1x por Descanso Longo, por 1 minuto: suas magias custam metade dos PM, e você pode conjurar 2 magias de Ação Padrão por turno (a segunda usa a Ação Bônus). 1x por semana, conjura uma magia de 6º círculo do grimório sem PM."]
    ]
  },
  clerigo: {
    nome: "Clérigo", arquetipo: "conjurador",
    descricao: "Tira o poder da fé: magias divinas e radiantes, cura em área e suporte com bênçãos e maldições. Cura menos por pessoa que o Curandeiro, mas cura várias de uma vez. Dano Necrótico só pelo Domínio da Morte. Faz bem: curar o grupo, buffs e debuffs, enfrentar mortos-vivos e criaturas das trevas. Faz mal: dano alto num único alvo e furtividade. Precisa de: uma linha de frente, porque as auras têm alcance curto.",
    regras: [
      "Pontos de Fé (PF): no Clérigo, os PM se chamam PF. Só muda o nome: máximo, recuperação e tudo do arquétipo que usa PM funcionam igual.",
      "Por faixa (3–10 / 11–20 / 21–30 / 31–40 / 41–50): Canalizar Divindade custa 6 / 10 / 14 / 18 / 24 PF; Prece Restauradora (cada aliado) 2d6 / 3d6 / 4d8 / 5d10 / 6d10 + Núcleo; Luz Sagrada (Radiante) 2d8 / 3d10 / 5d10 / 6d10 / 8d10; Bênção / Maldição +2/−2, +3/−3, +4/−4, +5/−5, +6/−6. Testes contra a CD de magia.",
      "Domínios (2 no Nv. 3, mais 2 no Nv. 48; efeitos nos níveis 3 / 15 / 27 / 45): Luz (+1 dado Radiante / Clarão: Reação 1x/cena, quem te atacar faz Vontade ou fica Ofuscado / Luz Sagrada +3 m de raio e ignora cobertura / Radiante com crítico 19–20 e mortos-vivos vulneráveis); Vida (curas +Núcleo / estabiliza a até 9 m com ação livre 1x/turno / cura acima do máximo vira PV temporários até metade / 1x/cena a Prece cura o máximo dos dados); Ordem (Bênção e Maldição +1 / Comando: Ação Bônus, 6 PF, Vontade ou perde a próxima Ação de Movimento / Maldição +1 alvo / 1x/cena o Comando tira a próxima Ação Padrão); Morte (magias de dano podem causar Necrótico / 1x/turno metade do Necrótico vira PV / Necrótico ignora Resistência / Ceifar: não Chefe com 10% dos PV ou menos faz Fortitude ou cai a 0); Proteção (+1 CA e a Bênção dá RD 2 / Guarda: Reação, aliado a até 3 m ganha RD igual ao Núcleo contra um ataque / Aura de Proteção 9 m / 1x/cena por 1 rodada aliados na aura não caem abaixo de 1 PV); Tempestade (dano pode ser Relâmpago ou Sonoro com +1 dado / Reação ao ser atingido corpo a corpo: 2d8 Relâmpago / Luz Sagrada de Relâmpago empurra 3 m / 1x/cena uma magia de Relâmpago causa o máximo); Guerra (armas marciais e armaduras médias, +1 no acerto com armas / Bênção dá +1d6 nos acertos com arma 1x/turno / ao conjurar com Ação Padrão, 1 ataque com arma como Ação Bônus / 1x/cena por 1 rodada crítico com 18+); Conhecimento (+2 em duas perícias de Inteligência / Ação Padrão, 6 PF: lê pensamentos superficiais / +1 magia em cada círculo liberado fora do Acúmulo / 1x por dia, uma pergunta ao deus com resposta verdadeira)."
    ],
    habilidades: [
      [3, "Voto Divino", "Os PM viram PF. Escolhe 2 Domínios. Canalizar Divindade (Ação Padrão, custo da faixa): Prece Restauradora (aliados a até 9 m se curam) ou Luz Sagrada (raio de 3 m a até 18 m; Vontade para metade)."],
      [6, "Bênção", "Ação Bônus, 6 PF: até 3 aliados ganham o bônus da faixa em ataques e testes de resistência por 1 minuto."],
      [9, "Maldição Divina", "Ação Bônus, 6 PF: um inimigo faz Vontade ou sofre a penalidade da faixa em ataques e testes de resistência por 1 minuto."],
      [12, "Magias de Domínio", "Aprende 1 magia de cada um dos seus Domínios em cada círculo liberado, de graça e fora do Acúmulo."],
      [15, "Aura de Proteção", "Aliados a até 3 m somam metade do seu Núcleo nos testes de resistência. Domínios: 2º efeito."],
      [18, "Graça Ampliada", "Magias de cura de alvo único afetam +1 aliado. A Prece Restauradora cura +1 dado."],
      [21, "Expulsar", "Canalizar Divindade: mortos-vivos e criaturas infernais a até 9 m fazem Vontade ou ficam Apavorados por 1 minuto; os de nível 10 ou mais abaixo do seu são destruídos."],
      [24, "Luz que Queima", "Seu dano Radiante ignora Resistência, e mortos-vivos sofrem +1 dado."],
      [27, "Devoção", "Canalizar Divindade custa 25% menos PF (arredonda para cima). Domínios: 3º efeito."],
      [30, "Reerguer", "Ação Bônus, 6 PF: um aliado fazendo testes de morte troca uma falha por um sucesso e recebe uma Prece Restauradora."],
      [33, "Aura Sagrada", "No início do seu turno, aliados a até 3 m recuperam PV iguais ao seu Núcleo."],
      [36, "Bênção Maior", "A Bênção afeta até 6 aliados e pode ser lançada com ação livre 1x/turno."],
      [39, "Ressurreição", "1x por semana, traz de volta um aliado morto até duas cenas atrás, com metade dos PV."],
      [42, "Julgamento", "1x/cena: Luz Sagrada num raio de 9 m. Os aliados nessa área recuperam metade do dano total causado, dividido entre eles."],
      [45, "Domínio Supremo", "Domínios: efeito final."],
      [48, "Avatar Divino (capstone)", "Ganha mais 2 Domínios, com todos os efeitos. 1x por Descanso Longo, por 1 minuto: asas (voo de 18 m), a Aura Sagrada cura 2d10 + Núcleo e alcança 9 m, o dano Radiante ganha +2 dados e a Ressurreição pode ser usada mais uma vez nesse minuto."]
    ]
  },
  invocador: {
    nome: "Invocador", arquetipo: "conjurador",
    descricao: "Controla o campo de batalha trazendo criaturas de outros planos: várias criaturas menores para cercar, bloquear e atrapalhar, ou uma única criatura forte, o Campeão. Faz bem: controle de campo (bloquear, cercar, proteger, prender), ocupar o mapa, ter um aliado forte a mais. Faz mal: dano direto próprio; perde força quando as invocações caem. Precisa de: PM para invocar de novo e espaço para posicionar as criaturas.",
    regras: [
      "Limite de Invocações ao mesmo tempo: 1 (Nv. 3), 2 (15), 3 (33), 3 + 2 temporárias no capstone. O Campeão ocupa todo o limite.",
      "Invocar: Ação Padrão, pagando PM pelo custo do círculo da faixa (6 / 10 / 14 / 18 / 24 PM). A criatura surge a até 18 m e fica até o fim da cena, até cair ou até ser dispensada (ação livre).",
      "Comando: com uma Ação Bônus, todas as invocações se movem e agem (todas podem atacar). Atacam com d20 + Arcanismo, somam metade do seu Núcleo no dano e usam a CD de magia. CA = CD de magia.",
      "Criaturas por Patamar (I 3–10 / II 11–20 / III 21–30 / IV 31–40 / V 41–50): Espírito (PV 20 / 45 / 80 / 120 / 160; 1d10 / 2d8 / 2d10 / 3d10 / 4d10 Força até 18 m; voa 12 m; Ajudar dá vantagem a um aliado a até 9 m; atravessa paredes finas); Fera (PV 35 / 80 / 140 / 210 / 280; 1d10 / 2d8 / 3d8 / 4d8 / 4d10 físico; 12 m; ao acertar, Fortitude ou agarrado ou derrubado); Guardião (PV 50 / 110 / 190 / 280 / 380; 1d8 / 2d6 / 2d8 / 3d8 / 4d8 Contundente; RD 3 / 5 / 6 / 8 / 10; Reação: vira o alvo de um ataque contra aliado a até 3 m); Elemental (Nv. 12; PV — / 90 / 160 / 240 / 320; — / 2d8 / 3d8 / 4d8 / 4d10 do elemento; aplica Em Chamas, Enregelado, Eletrizado ou Molhado; 1x/cena explosão de 3 m); Campeão (Nv. 9; PV 90 / 180 / 320 / 480 / 650; 2d10 / 3d10 / 4d10 / 5d10 / 6d10; Grande, CA +2; 2 ataques por Comando no Nv. 30)."
    ],
    limite: [[3, 1], [15, 2], [33, 3]],
    habilidades: [
      [3, "Pacto de Invocação", "Invocar e Comando, com 1 invocação por vez. Pode invocar Espírito, Fera e Guardião."],
      [6, "Elo Sensorial", "Ação livre: vê e ouve pelos sentidos de uma invocação. 1x/turno, Ação Bônus: troca de lugar com uma invocação a até 18 m."],
      [9, "Campeão", "Pode invocar o Campeão."],
      [12, "Elementais", "Pode invocar Elementais."],
      [15, "Invocação Rápida", "Limite de 2 invocações. 1x/turno, invocar pode ser feito com Ação Bônus (pagando os PM)."],
      [18, "Círculo de Contenção", "Ação Padrão, 10 PM: círculo de 3 m de raio a até 18 m por 1 minuto. Inimigos que entram ou começam o turno dentro fazem Vontade ou ficam Presos até o fim do próximo turno (quem passa fica Lento). Suas invocações dentro ganham +2 CA."],
      [21, "Aprimorar Invocação", "Ao invocar, escolha um traço extra: Asas (voo 12 m), Couraça (+RD 3), Fúria (+1 dado no dano) ou Agilidade (+6 m e +2 Esquiva). No Nv. 39, dois traços."],
      [24, "Vínculo Vital", "Reação: metade de um dano que você sofreria vai para uma invocação a até 9 m."],
      [27, "Portal", "Ação Padrão, 14 PM: abre dois portais ligados a até 18 m por 1 minuto. Aliados e invocações que entram num saem do outro (custa 1,5 m de movimento)."],
      [30, "Campeão Ascendido", "O Campeão faz 2 ataques por Comando e ganha uma Ação Lendária: 1x/rodada, no turno de outra criatura, move-se até o deslocamento ou protege um aliado ao lado (vira o alvo do ataque)."],
      [33, "Terceiro Elo e Explosão de Elo", "Limite de 3 invocações. Reação: dispensa uma invocação, que explode num raio de 3 m com o dano do ataque dela + 2 dados (Reflexo para metade)."],
      [36, "Vínculo Duradouro", "As invocações ficam até o próximo Descanso Longo, em vez de sumirem no fim da cena."],
      [39, "Senhor dos Planos", "1x/cena, invocar não custa PM. As invocações usam o Patamar acima do seu (acima do V: +1 dado e +25% de PV). Aprimorar Invocação passa a dar dois traços."],
      [42, "Comando Supremo", "As invocações passam a agir sozinhas no turno delas (iniciativa logo depois da sua), sem precisar de Comando; a Ação Bônus fica livre."],
      [45, "Titã", "1x por Descanso Longo, Ação Padrão: invoca um Titã (Enorme) por 1 minuto, sem ocupar o limite nem gastar PM: PV 600, CA = CD de magia + 4, 2 ataques de 6d10 por turno e imune a Caído, Agarrado e Preso."],
      [48, "Mestre dos Pactos (capstone)", "1x por Descanso Longo, por 1 minuto: +2 invocações temporárias além do limite, todas sobem 1 Patamar e invocar vira ação livre (1x/turno)."]
    ]
  },
  xama: {
    nome: "Xamã", arquetipo: "conjurador",
    descricao: "O conjurador da natureza e dos animais. Assume formas de feras e de elementais, chama a força de um espírito totem para o grupo e transforma o terreno a seu favor. O Invocador chama criaturas; o Xamã vira a criatura. Faz bem: trocar de papel no meio da luta, controle de terreno, buffs de totem, sobrevivência e exploração. Faz mal: dano mágico concentrado e ambientes sem natureza. Precisa de: usos de Forma Animal e PM para alternar entre forma e magia.",
    regras: [
      "Forma Animal: 2 usos (Nv. 3), 3 (15), 4 (27), 5 (39), sem limite (48); voltam no Descanso Curto ou Longo. Assumir é Ação Bônus; dura até 1 hora, até sair (ação livre) ou até os PV da forma acabarem. A forma tem PV próprios que levam o dano primeiro; o que sobrar passa para os seus PV.",
      "Na forma: mantém Inteligência, Autocontrole, Núcleo, perícias e PM. Ataca com d20 + Luta usando Núcleo; o dano soma o Núcleo. Não conjura até o Nv. 18 (Magia Selvagem). Equipamentos se fundem à forma.",
      "Formas (PV I / II / III / IV / V; ataques): Fera Ágil (15 / 40 / 80 / 130 / 190; 2 ataques 1d8 / 1d10 / 2d6 / 2d8 / 2d10; 12 m, +2 Esquiva, vantagem para seguir rastros); Fera Brutal (25 / 60 / 120 / 190 / 270; 1 ataque 1d12 / 2d8 / 3d8 / 3d10 / 4d10; RD 2 a 6; ao acertar, Fortitude ou agarrado); Fera Alada (10 / 30 / 60 / 100 / 150; 1 ataque 1d6 / 1d8 / 2d6 / 2d8 / 3d8; voo 18 m, +5 Percepção); Fera Aquática (20 / 50 / 100 / 160 / 230; 1 ataque 1d10 / 2d6 / 2d10 / 3d10 / 4d10; nada 18 m, respira na água, nuvem de tinta 1x/forma); Forma Elemental (Nv. 27; 140 / 220 / 300; 2 ataques 2d8 / 2d10 / 3d10 do elemento; imune ao elemento, RD física 5); Fera Colossal (Nv. 30; 300 / 420; 2 ataques 4d8 / 5d8; Enorme, alcance 3 m).",
      "Espíritos Totem (Nv. 6; Ação Bônus, 6 PM: aura de 6 m por 1 minuto; 2 totens no Nv. 39): Urso (RD igual à metade do Núcleo); Lobo (+2 no acerto contra inimigos ao lado de outro aliado, +4 no Nv. 24); Águia (+3 m, não podem ser Surpreendidos, +2 Percepção); Serpente (acertos +1d4 Venenoso, +1d8 no Nv. 24); Cervo (no início do seu turno, aliados recuperam metade do Núcleo em PV)."
    ],
    formaAnimal: [[3, 2], [15, 3], [27, 4], [39, 5], [48, 999]],
    habilidades: [
      [3, "Forma Animal", "Ganha a Forma Animal (2 usos) com as Feras Ágil, Brutal, Alada e Aquática. Fala com animais."],
      [6, "Espírito Totem", "Escolhe um Espírito Totem."],
      [9, "Chamado da Terra", "Ação Padrão, 10 PM: raízes num raio de 6 m a até 18 m por 1 minuto. Terreno difícil para inimigos; quem entra ou começa o turno dentro faz Reflexo ou fica Preso até o fim do próximo turno."],
      [12, "Comunhão", "Fala com plantas, não deixa rastros na natureza e, 1x por dia, pergunta à terra o que passou por ali nas últimas 24 horas."],
      [15, "Bálsamo da Floresta", "Ação Bônus, 6 PM: até 3 aliados a até 9 m regeneram PV iguais ao Núcleo no início dos próximos 3 turnos deles. Forma Animal: 3 usos."],
      [18, "Magia Selvagem", "Pode conjurar magias na Forma Animal. Trocar de forma (sem sair) custa só a Ação Bônus, sem gastar uso."],
      [21, "Pele de Casca", "Fora da Forma Animal, ganha +2 CA e RD física igual à metade do Núcleo."],
      [24, "Totem Desperto", "Os totens ficam mais fortes e a aura pode ser ativada com ação livre 1x/cena."],
      [27, "Forma Elemental", "Libera a Forma Elemental. Forma Animal: 4 usos."],
      [30, "Fera Colossal", "Libera a Fera Colossal."],
      [33, "Tempestade Primordial", "1x/cena, Ação Padrão: tempestade num raio de 12 m a até 36 m por 3 rodadas. Inimigos dentro sofrem 4d10 Relâmpago por turno (Reflexo para metade), têm desvantagem em ataques a distância e terreno difícil."],
      [36, "Instinto Selvagem", "Na Forma Animal, os ataques da forma ganham +1 dado, e você tem vantagem em testes de Fortitude."],
      [39, "Totem Duplo", "Mantém 2 Espíritos Totem ao mesmo tempo. Forma Animal: 5 usos."],
      [42, "Mil Formas", "1x/turno, trocar de forma é ação livre. Ao sair de uma forma com PV sobrando, ganha metade deles como PV temporários."],
      [45, "Avatar da Natureza", "1x por Descanso Longo, por 1 minuto: assume uma Forma Primordial (escolha uma forma qualquer): os PV da forma dobram, os ataques ganham +2 dados e todos os totens que você conhece ficam ativos."],
      [48, "Arquidruida (capstone)", "Forma Animal sem limite de usos. Na forma, suas magias de até 4º círculo custam metade dos PM. Você não envelhece mais e, 1x por semana, pode fazer um Ritual da natureza sem materiais."]
    ]
  },
  magoGuerra: {
    nome: "Mago de Guerra", arquetipo: "conjurador",
    descricao: "Luta corpo a corpo com a espada e usa a magia para se fortalecer e se manter de pé. Ele mesmo se protege, se cura e encanta a lâmina, então precisa pouco do grupo. O Guerreiro Elemental imbui a arma com elementos; o Mago de Guerra é um conjurador que aprendeu a lutar. Faz bem: linha de frente sem depender de cura, dano corpo a corpo constante, misturar ataque e magia. Faz mal: ajudar aliados e controle de área. Precisa de: PM; sem eles, os buffs e o sifão param.",
    regras: [
      "Lâmina Vinculada: uma arma corpo a corpo do catálogo (é um item e aceita Melhorias). Com ela, os ataques usam d20 + Luta com Núcleo no lugar de Força ou Destreza, e o dano soma o Núcleo. Pode conjurar com a arma na mão.",
      "Bônus de habilidade respeitam o Teto de Bônus. Dados de bônus se multiplicam no crítico; bônus fixos não.",
      "Por faixa (3–10 / 11–20 / 21–30 / 31–40 / 41–50): Ataque Arcano (1x/turno) +1d6 / +1d8 / +1d10 / +2d8 / +2d10; Lâmina Encantada (por acerto) — / +1d6 / +1d8 / +1d10 / +2d6; Armadura de Mana PV temporários 2d8 / 3d10 / 5d10 / 6d10 / 8d10 + Núcleo e CA +2 / +3 / +4 / +5 / +6; custo da faixa 6 / 10 / 14 / 18 / 24 PM."
    ],
    ataqueArcano: faixa("1d6", "1d8", "1d10", "2d8", "2d10"),
    laminaEncantada: faixa("", "1d6", "1d8", "1d10", "2d6"),
    armaduraMana: { pv: faixa("2d8", "3d10", "5d10", "6d10", "8d10"), ca: faixa(2, 3, 4, 5, 6), custo: faixa(6, 10, 14, 18, 24) },
    habilidades: [
      [3, "Lâmina Vinculada", "Vincula a arma (ataque e dano com Núcleo). Proficiência em armaduras médias. Ataque Arcano: 1x/turno, ao acertar com a Lâmina, paga 2 PM e soma o dado da faixa como dano de Força."],
      [6, "Armadura de Mana", "Ação Bônus, custo da faixa: ganha os PV temporários e o bônus de CA da faixa por 1 minuto."],
      [9, "Golpe Conjurado", "Ação Padrão: ataca com a Lâmina e conjura um Truque na mesma ação (alvo ou ponto de origem pode ser o alvo do ataque)."],
      [12, "Sifão Arcano", "1x/turno, ao acertar com a Lâmina, recupera PV iguais ao Núcleo e 2 PM."],
      [15, "Ataque Extra Arcano", "Ao usar a Ação de Ataque com a Lâmina, paga 4 PM para fazer +1 ataque (1x/turno)."],
      [18, "Lâmina Encantada", "Ação Bônus, custo da faixa, 1 minuto: escolha Fogo, Frio, Relâmpago, Força ou Radiante; cada acerto com a Lâmina causa o dado da faixa desse tipo."],
      [21, "Golpe Conjurado 2.0", "O Golpe Conjurado pode usar magias de até 2º círculo (pagando os PM)."],
      [24, "Guarda Arcana", "Reação, 4 PM, sem gastar ação do próximo turno: bônus na CA igual à metade do Núcleo contra um ataque."],
      [27, "Lâmina Viva", "A Lâmina pode ser arremessada até 18 m como ataque (Luta com Núcleo) e volta para a sua mão no fim do turno."],
      [30, "Sifão Arcano 2.0", "O Sifão cura o dobro (2 × Núcleo). Ao derrubar um inimigo a 0 PV, recupera PM iguais ao custo da faixa."],
      [33, "Ataque Extra Arcano 2.0", "Pode pagar 4 PM por ataque para fazer até +2 ataques."],
      [36, "Forma de Batalha", "1x/cena, Ação Bônus, 3 rodadas: fica Grande, a Lâmina ganha 3 m de alcance, o Ataque Arcano vale em todo acerto e você ganha RD igual à metade do Núcleo."],
      [39, "Golpe Conjurado 3.0", "O Golpe Conjurado pode usar magias de até 4º círculo, e o alvo do ataque tem desvantagem no teste de resistência contra essa magia."],
      [42, "Lâmina Contra-feitiço", "Reação, 1x/rodada: quando uma magia te atinge, faça um ataque com a Lâmina contra quem conjurou (se estiver no alcance); se acertar, você sofre só metade do dano da magia."],
      [45, "Último Bastião", "1x por Descanso Longo, ao cair a 0 PV, fica com 2 × Núcleo de PV, e a Armadura de Mana da faixa é ativada na hora, sem custo."],
      [48, "Avatar da Lâmina (capstone)", "1x por Descanso Longo, por 1 minuto: buffs que você lança em si mesmo não custam PM; o Golpe Conjurado aceita magias de até 5º círculo; seus ataques com a Lâmina ganham +2 dados; o Sifão cura metade do dano causado (1x/turno)."]
    ]
  },
  trovador: {
    nome: "Trovador", arquetipo: "conjurador",
    descricao: "Transforma a própria expressão artística em poder mágico. O foco de conjuração é a ferramenta da expressão (música, poesia, canto, dança, pintura, histórias, discursos, atuação…); a escolha muda só a aparência das habilidades. Não luta de frente: fortalece aliados, enfraquece inimigos e manipula o campo. Faz bem: buffs e debuffs, atrapalhar magias inimigas, manter o grupo de pé nos momentos decisivos. Faz mal: dano direto e cura forte. Precisa de: aliados que causem dano e aproveitem os bônus.",
    regras: [
      "Inspiração: com uma Ação Bônus, dá um Dado de Inspiração a um aliado que perceba sua expressão. Depois de rolar, ele pode gastar o dado e somar o resultado. Cada aliado só pode ter 1 dado seu por vez.",
      "Aliados com o dado ao mesmo tempo: 1 (Nv. 3), 2 (21), 3 (30), 4 (39), sem limite (48). Dado: 1d8 (3), 1d10 (12), 1d12 (21), 2d8 (30), 2d10 (39), 2d12 (48).",
      "O Dado de Inspiração entra no Teto de Bônus pelo valor rolado (o que passar é cortado). Usado em dano ou cura (Nv. 39), soma direto, fora do teto.",
      "Testes de conjuração = teste de magia (d20 + Arcanismo)."
    ],
    inspiracao: [[3, "1d8"], [12, "1d10"], [21, "1d12"], [30, "2d8"], [39, "2d10"], [48, "2d12"]],
    inspiracaoAliados: [[3, 1], [21, 2], [30, 3], [39, 4], [48, 99]],
    inspiracaoCusto: 0,
    habilidades: [
      [3, "Primeiro Verso", "Escolhe a Expressão Artística e recebe a Inspiração. Quando o aliado gasta o seu dado num teste de ataque, de resistência ou de perícia, também soma um bônus fixo igual aos seus pontos na perícia Performance (sem o atributo, com os outros bônus da perícia)."],
      [6, "Palavra Desmoralizante", "Ação Bônus: um inimigo que perceba sua expressão tem desvantagem no próximo teste de ataque ou de resistência até o início do seu próximo turno. Um inimigo por vez."],
      [9, "Conjuração Inspirada", "1x/turno, uma magia sua que fortaleça, cure ou proteja um aliado, ou que imponha condição a um inimigo, afeta um segundo alvo no alcance com metade do valor (arredonda para cima) ou com a condição durando no máximo 1 rodada."],
      [12, "Inspiração Aprimorada", "Dado 1d10. Quando o aliado gasta o dado, escolhe um extra: Coragem (PV temporários iguais ao resultado), Precisão (soma de novo metade do resultado no ataque, dentro do teto) ou Resistência (RD igual ao resultado contra o próximo dano)."],
      [15, "Refrão Persistente", "Quando uma magia sua que fortalece um aliado termina, ele mantém metade de um bônus numérico dela por mais 1 rodada. Se a magia não dava bônus numérico, ele ganha +3 no próximo teste de resistência até o fim do próximo turno."],
      [18, "Contraponto", "Reação, 1x/rodada: quando uma criatura que você perceba conjura uma magia, faça um teste de magia contra o dela. Se vencer, escolha: Enfraquecer (dano ou cura pela metade), Distorcer (alcance pela metade) ou Silenciar (duração de buff ou debuff pela metade)."],
      [21, "Inspiração Superior", "Dado 1d12. Pode manter Inspiração em até 2 aliados ao mesmo tempo. O aliado pode usar o dado num teste de ataque e no dano desse mesmo ataque ao mesmo tempo (o resultado soma nos dois), ou num teste de resistência."],
      [24, "Grande Performance", "1x/combate, Ação Padrão, 3 rodadas: até 3 aliados que te percebam ganham +3 em ataques, testes de resistência e testes de magia (+4 a partir do Nv. 31). Você precisa continuar consciente e se expressando."],
      [27, "Ruína da Confiança", "Quando um inimigo falha num teste de resistência causado por você, escolha um: desvantagem no próximo ataque, no próximo teste de resistência ou no próximo teste de magia; ou causa 20% menos dano até o início do seu próximo turno. Um efeito por criatura por vez."],
      [30, "Inspiração Magistral", "Dado 2d8. Até 3 aliados. 1x/rodada, se o aliado gastar o dado e ainda assim falhar, recupera o dado."],
      [33, "Obra Viva", "Ação Padrão, 3 rodadas, área de 9 m ao seu redor (uma Obra por vez). Escolha: Esperança (aliados +6 em testes de resistência e recuperam 2d6 + Núcleo PV no início do turno); Guerra (aliados +6 em ataques e testes de magia); Desespero (inimigos −6 em ataques e testes de resistência); Silêncio (inimigos com desvantagem em testes de magia)."],
      [36, "Mestre da Conjuração", "Magias cujo efeito principal é buff, debuff, cura ou proteção custam 25% menos PM (arredonda para cima). Numa magia de alvo único dessas, pague +50% do custo original para afetar um segundo alvo com o efeito completo."],
      [39, "Inspiração Lendária", "Dado 2d10. Até 4 aliados. O dado também pode somar em testes de magia, na cura feita ou no dano de uma magia (direto no resultado)."],
      [42, "Magnum Opus", "1x/combate, Ação Padrão, 3 rodadas: aliados que te percebem ganham 1 Dado de Inspiração no início do turno e vantagem em testes de resistência; inimigos têm desvantagem nos testes de resistência contra suas magias; buffs de alvo único afetam até 3 aliados e debuffs de alvo único até 2 inimigos; 1x/rodada, como Reação, um aliado que falhou num teste de resistência rola de novo com vantagem."],
      [45, "Autor do Destino", "3 Versos do Destino por combate. Reação, depois de uma rolagem de uma criatura que te percebe: Vitória (aliado rola de novo e fica o melhor); Tragédia (inimigo rola de novo e fica o pior); Fracasso (inimigo que passou num teste contra sua magia rola de novo e fica o novo); Sobrevivência (aliado que cairia a 0 PV fica com 1 PV; 1x por combate). Um Verso por criatura por rodada."],
      [48, "Lenda Imortal (capstone)", "Dado 2d12; Inspiração sem limite de aliados. 1x por descanso, ação livre, 3 rodadas, Última Obra: buffs e debuffs custam metade dos PM; buffs de alvo único afetam todos os aliados que te percebem e debuffs até 3 inimigos; aliados têm vantagem em ataques, testes de resistência e de magia; inimigos têm desvantagem nos testes contra suas magias; cada aliado ganha 1d12 de Inspiração no início do turno; 1x/rodada, impede um aliado de cair a 0 PV (fica com 1), sem gastar Reação; Obra Viva e Grande Performance podem ficar ativas juntas sem gastar ações."]
    ]
  },
  vitalista: {
    nome: "Vitalista", arquetipo: "conjurador", extra: true,
    descricao: "Domina a energia que sustenta a existência: fecha ferimentos, purifica, devolve o fôlego e impede que companheiros sucumbam. Faz bem: manter o grupo vivo. Faz mal: causar dano, fortalecer ataques, controlar o campo; é frágil de perto. Precisa de: alguém que o proteja e alguém que termine as lutas.",
    toque: [[3, "2d8"], [12, "3d8"], [21, "4d8"], [30, "5d8"], [39, "6d10"]],
    protecaoVital: [[6, "1d10"], [12, "2d10"], [21, "3d10"], [30, "4d10"], [39, "5d10"]],
    regras: [
      "Toque Restaurador (Ação Padrão, 8 PE, toque, 1x/turno): 2d8 / 3d8 / 4d8 / 5d8 / 6d10 + Núcleo PV (Nv. 3 / 12 / 21 / 30 / 39), sem passar do máximo.",
      "Proteção Vital (Ação Bônus, 5 PE, até 9 m): 1d10 / 2d10 / 3d10 / 4d10 / 5d10 + Núcleo PV temporários por 3 rodadas (Nv. 6 / 12 / 21 / 30 / 39). PV temporários não acumulam; fica o maior."
    ],
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
  atiradorArcano: {
    nome: "Atirador Arcano", arquetipo: "conjurador",
    descricao: "Especialista em armas de longo alcance que usa mana para criar, aprimorar e manipular projéteis. Diferente de outros conjuradores, concentra o conhecimento numa única Arma Mágica e a desenvolve na jornada. Faz bem: dano concentrado e consistente a distância, posicionamento, atingir alvos protegidos. Faz mal: apoiar o grupo (não tem a versatilidade do Trovador). Precisa de: tempo para se posicionar e preparar o disparo.",
    regras: [
      "Arma Mágica: uma arma de disparo criada ou imbuída com mana (custo pelo porte: Pequena 1d20 PM, Média 3d20, Grande 5d20 + 10, Especial 9d20 + 50). Munição de Mana por disparo: 3 / 5 / 9 / 20 PM. Arma de Sangue: paga também PV iguais à metade do custo.",
      "Ataques com a Arma Mágica usam Arcanismo + Núcleo (Disparo Fortificado). Posição Tática, Circuitos Balísticos, Sobrecarga Arcana, Câmara de Acúmulo e Starlight Step ficam no painel da classe."
    ],
    habilidades: [
      [3, "Arma Mágica", "Crie ou imbua uma arma de longo alcance com sua mana (só uma arma criada ativa por vez, a não ser que o Mestre permita mais). Criar custa, pelo porte: Pequena (pistolas, bestas de pulso, arcos curtos) 1d20 PM; Média (escopetas, metralhadoras, bestas, arcos longos) 3d20 PM; Grande (rifles de precisão, metralhadoras pesadas) 5d20 + 10 PM; Especial (bazucas, miniguns, armas excepcionais) 9d20 + 50 PM. 1 minuto fora de combate ou Ação Padrão em combate. A arma usa o dano, o alcance e o funcionamento de uma arma equivalente do sistema, sem inventar estatísticas. Você precisa conhecer o funcionamento da arma; Armas de Gênesis só com autorização do Mestre. O Foco Arcano pode assumir a forma de uma arma de fogo ou de disparo. Melhorias com efeitos idênticos não acumulam (fica o maior). Arma de Sangue: sem Foco Arcano, crie com o próprio sangue: paga também PV iguais à metade do custo em PM (arredondado para cima); se passar da metade dos PV máximos, fica Atordoado por 1 turno; o dano se divide igualmente entre Balístico e Sangue. Munição de Mana: troque a munição por projéteis de mana, por disparo: Pequena 3 PM, Média 5 PM, Grande 9 PM, Especial 20 PM. Munição comum continua valendo; os disparos contam como da Arma Mágica enquanto ela estiver imbuída."],
      [3, "Disparo Fortificado", "Com a Arma Mágica, use Arcanismo no lugar de Pontaria nos testes de ataque: o teste passa a ser Arcanismo + Núcleo. Não acumula com outra habilidade que troque Pontaria por Arcanismo (sem segundo bônus de Núcleo)."],
      [6, "Posição Tática I", "Em posição vantajosa (terreno elevado, linha de visão privilegiada, visão ampla do campo, alvo desprevenido ou vantagem no ataque; o Mestre decide), sua Margem de Ameaça aumenta em 1 (o 20 natural vira 19–20)."],
      [9, "Magia Aplicada", "Em testes de perícia sobre mecanismos, tecnologia, armamentos, trajetórias, circuitos ou sistemas arcanos, gaste 2 PM e 2 PE para usar Núcleo no lugar do atributo-base da perícia. O Mestre decide se faz sentido; não vale em testes sociais nem em tarefas sem aplicação técnica ou mágica."],
      [12, "Posição Tática II", "Em posição vantajosa, gaste 4 PE antes do disparo: naquele ataque a Margem de Ameaça aumenta 2 no total e o Multiplicador de Crítico recebe +2. Não acumula com fontes do mesmo efeito além desses valores."],
      [15, "Starlight Step", "Ao terminar seu deslocamento, use uma Ação Livre para se teleportar até 1,5 m, sem provocar Ataques de Oportunidade. Usos por Descanso Longo: Núcleo ÷ 2 (para cima) + nível do personagem ÷ 10 (só o inteiro). Ex.: nível 15 e Núcleo 4 → 3 usos. Não atravessa paredes nem barreiras completamente fechadas."],
      [18, "Circuitos Balísticos I", "Instale 1 circuito na Arma Mágica (cada circuito instalado soma 5 PM ao custo de criar ou reconfigurar a arma; sem repetir): Mira Estabilizada (+2 nos ataques com a arma); Acelerador (+6 m de alcance); Núcleo Ressonante (1×/turno, ao acertar, gaste 3 PM para +1d8 do mesmo tipo da arma); Ricochete (1×/turno, ao acertar, gaste 3 PM para atingir outro inimigo a até 3 m do alvo com 1d8 de dano arcano). Efeitos idênticos de outros equipamentos, encantamentos ou modificações não acumulam."],
      [21, "Câmara de Acúmulo", "Se terminar o turno sem se deslocar e sem atacar, acumula 1 Carga de Mana na arma (máximo 2). Ao disparar, consuma cargas: +1d10 de dano por carga. As cargas se perdem se você se deslocar, for teleportado ou a cena terminar sem usá-las."],
      [24, "Circuitos Balísticos II", "Até 2 circuitos diferentes ao mesmo tempo, com as regras do nível 18."],
      [27, "Sobrecarga Arcana", "Ação Bônus, 6 PM e 4 PE: ative uma configuração por 3 rodadas (só uma por vez): Acelerador de Mana (+3 nos ataques com a arma); Amplificador (o primeiro disparo que acertar em cada turno causa +2d8); Fragmentador (1×/turno, ao acertar, parte do projétil atinge outra criatura a até 1,5 m do alvo com 1d8 de dano arcano). Não acumula com circuitos de benefício idêntico."],
      [30, "Circuitos Balísticos III", "Até 3 circuitos diferentes ao mesmo tempo na Arma Mágica."],
      [33, "Disparo Espiral", "1×/turno, ao disparar, gaste 20 PM para curvar a trajetória: o disparo ignora cobertura parcial, se você identificar a localização do alvo e existir uma trajetória possível. Não atinge criaturas em locais completamente fechados."],
      [36, "Disparo Fortificado II", "Nos ataques com a Arma Mágica, some também sua Pontaria: Arcanismo + Núcleo + Pontaria. O mesmo valor não é somado duas vezes se outra habilidade já o adicionar."],
      [39, "Posição Tática III", "Em posição vantajosa: Margem de Ameaça aumentada em 3 no total e +3 dados de dano do mesmo tipo da arma, 1×/turno. Usando o nível 12, o Multiplicador de Crítico continua +2. Estes valores substituem os anteriores (não somam)."],
      [42, "Disparo Fortificado III", "Disparo Potencializado: ao disparar com a Arma Mágica, gaste 10 PE para somar seu Núcleo ao dano final daquele ataque. Starlight Step Aprimorado: o alcance do teleporte passa a ser igual ao seu deslocamento; cada uso aprimorado custa 10 PE, além de gastar um uso."],
      [45, "Disparo Espiral Aprimorado", "O Disparo Espiral ignora cobertura de qualquer tipo, desde que exista alguma abertura (fresta, janela, passagem estreita) e o Mestre considere a trajetória possível. Continua sem atravessar locais completamente fechados. Custo: 20 PM, 1×/turno."],
      [48, "Maestria Arcana", "Criação Aprimorada: criar a arma custa duas categorias abaixo (mínimo Pequena; ex.: Especial custa como Média). Ao criar ou reconfigurar, pode instalar 3 Modificações (10 PM), 2 Encantamentos (14 PM), 1 Maldição (20 PM) e 1 Bênção (20 PM), 64 PM no total, conhecendo e cumprindo os requisitos de cada uma; ficam na arma enquanto ela existir (recriar paga de novo). Efeitos idênticos não acumulam. Posição Tática Absoluta: em posição vantajosa, gaste 10 PE por disparo: Margem de Ameaça +7 no total (crítico em 13+), Multiplicador de Crítico +4 e +5 dados de dano do mesmo tipo da arma, 1×/turno. Substitui os bônus anteriores de Posição Tática."]
    ]
  },

  /* ============================ ARTÍFICE ============================ */
  alquimista: {
    nome: "Alquimista", arquetipo: "artifice",
    descricao: "Transforma reagentes em poções, venenos, elixires e injetáveis. Desgasta inimigos com ácido, fogo e toxinas, controla a área com gases e deixa os aliados mais fortes, rápidos e resistentes. A cura dele é fraca e dividida no tempo. Faz bem: dano contínuo e em área, condições (Corroído, Em Chamas, Envenenado, Dormindo), buffs físicos nos aliados. Faz mal: cura forte de alvo único e dano instantâneo grande num alvo só. Precisa de: uma linha de frente que segure os inimigos enquanto ele arremessa e aplica.",
    regras: [
      "Reagentes: recurso próprio, separado dos Projetos de Criação. Máximo: metade da Inteligência (Nv. 3, para cima, mín. 1), Inteligência (12), Inteligência + 2 (24), + 4 (36), + 6 (48). Doses por Reagente: 2 (3), 3 (18), 4 (36). Receitas no Grimório Alquímico: 2 (3), 3 (18), 4 (27), 5 (36), 6 (45).",
      "Recuperação: voltam ao máximo no Descanso Longo e recuperam ¼ (mín. 1) no Descanso Curto (metade a partir do Nv. 21). Não acumulam entre dias.",
      "Preparar: no descanso, cada Reagente gasto vira doses de uma receita do Grimório. Em aberto: Reagentes não gastos viram doses na luta com as ações da Montagem em Campo (Ação Padrão; Ação Bônus no Nv. 15; livre 1x/turno no 35).",
      "Grau e CD: as receitas usam o Grau máximo do arquétipo e a CD de Projeto. Carrega no máximo 3× os Reagentes em doses.",
      "Um alvo pode estar sob 1 Elixir e 1 Injetável ao mesmo tempo (2 de cada a partir do Nv. 39). Injetáveis: Ação Bônus, em você ou num aliado a até 1,5 m. Rebote: quando um Injetável com Rebote acaba, −2 nos testes de Força, Destreza e Constituição até o fim do próximo turno (o Nv. 24 remove).",
      "Frascos (Ação Padrão até 9 m; I / II / III / IV / V): Frasco Ácido (raio 1,5 m, Reflexo para metade, Corroído; 2d6 / 3d8 / 4d10 / 6d10 / 8d10 Ácido; −1 / −2 / −2 / −3 / −4 CA); Coquetel Inflamável (raio 1,5 m, Em Chamas; 1d6 / 2d8 / 2d10 / 3d10 / 4d10 Fogo); Veneno de Lâmina (Ação Bônus na arma, 3 acertos, Envenenado no 1º; +1d6 / +1d8 / +1d10 / +2d8 / +2d10 Venenoso); Nuvem Tóxica (raio 3 m, 1 minuto; 1d6 a 5d6 Venenoso, Fortitude para metade); Frasco de Fraqueza (−2 a −6 nos ataques por 1 rodada); Gás Sonífero (Vontade ou Dormindo por 1 rodada; raio 3 / 3 / 4,5 / 4,5 / 6 m).",
      "Elixires (1 minuto): Pele de Pedra (RD física 3 / 4 / 5 / 6 / 8); Elixir de Reflexos (+3 / +4 / +6 / +8 / +10 em Reflexo e Esquiva, +1,5 m); Elixir de Fúria (1x/turno +1d6 a +5d6); Elixir de Clareza (+3 a +10 em Vontade, remove Abalado e Confuso).",
      "Injetáveis (1 minuto): Adrenalina (+3 m, +3 a +10 em Atletismo e Acrobacia; Rebote); Hipertrofia (+2 a +6 no dano corpo a corpo e testes de Força; Rebote); Analgésica (PV temporários 2d6 / 3d8 / 4d10 / 6d10 / 8d10; imune a Abalado); Soro de Mira (+2 a +6 no acerto a distância); Estimulante Neural (Grau III+, uma Ação de Movimento ou Bônus extra por turno por 1 minuto, 1x/cena por alvo; Rebote).",
      "Cura fraca: Tônico Regenerativo (1d4 / 1d6 / 1d8 / 2d6 / 2d8 + Int. no início de cada turno por 3 rodadas); Antídoto Universal (remove Envenenado, Doente e Corroído e cura 1d6 a 5d6 + Int.)."
    ],
    reagentes: [[3, "metade"], [12, 0], [24, 2], [36, 4], [48, 6]],
    habilidades: [
      [3, "Alquimia de Campo", "Ganha os Reagentes e o Grimório Alquímico com 2 receitas; cada Reagente rende 2 doses. Arremessar Frasco: Ação Padrão, alcance 9 m."],
      [6, "Mãos de Boticário", "Dar ou beber uma poção vira Ação Bônus. 1x/rodada, um aliado a até 1,5 m pode beber uma dose sua como Reação."],
      [9, "Mistura", "Junta 2 receitas num frasco, que faz os dois efeitos. Custa 2 Reagentes e rende 1 dose."],
      [12, "Catalisador", "Reagentes passam a ser iguais à Inteligência. 1x/turno, um frasco seu ganha +1 dado ou +1,5 m de raio."],
      [15, "Toxicologia", "Imune a Envenenado. Seus venenos ignoram Resistência a Venenoso."],
      [18, "Alquimia de Campo 2.0", "3 doses por Reagente e +1 receita no Grimório."],
      [21, "Laboratório Ambulante", "O Descanso Curto recupera metade dos Reagentes (em vez de ¼)."],
      [24, "Dose Calibrada", "Reagentes = Inteligência + 2. Os Injetáveis que você aplica não causam Rebote."],
      [27, "Mistura 2.0", "Uma Mistura custa 1 Reagente e rende 2 doses. +1 receita."],
      [30, "Transmutação", "1x/cena, ação livre: transforma uma dose que você carrega em outra receita do mesmo Grau."],
      [33, "Reação em Cadeia", "1x/turno, quando um frasco derruba um inimigo a 0 PV, ele estoura de novo com metade do efeito."],
      [36, "Toxicologia 2.0", "Reagentes = Inteligência + 4; 4 doses por Reagente; +1 receita. Seus venenos tratam Imunidade a Venenoso como Resistência."],
      [39, "Elixir Maior", "Elixires e Injetáveis dados por você duram a cena inteira, e um alvo pode ter 2 de cada."],
      [42, "Bombardeio", "1x/cena, com uma Ação Padrão arremessa até 3 frascos em pontos diferentes."],
      [45, "Mistura 3.0", "Uma Mistura pode juntar até 3 receitas. +1 receita."],
      [48, "Pedra Filosofal (capstone)", "Reagentes = Inteligência + 6. 1x por Descanso Longo, ativa a Pedra por 1 cena: 1 frasco, Elixir ou Injetável por turno não gasta Reagente e sai 1 Grau acima do seu máximo. Ao ativar, você e os aliados a até 9 m perdem Envenenado, Doente e Corroído."]
    ]
  },
  armaduraViva: {
    nome: "Armadura Viva", arquetipo: "artifice",
    descricao: "O Artífice que melhora o próprio corpo. Em vez de criar coisas para os aliados, embute armas, motores e sistemas em si mesma e vira um ciborgue que faz várias coisas ao mesmo tempo. Os Implantes são equipamentos inteiros e só servem para ela. Faz bem: lutar na linha de frente, se adaptar trocando de modo e agir várias vezes no mesmo turno. Faz mal: ajudar aliados. Precisa de: cura de fora quando o Sistema de Reparo não dá conta.",
    regras: [
      "Bateria: recurso próprio, separado dos Projetos. Carga máxima: metade da Inteligência (para baixo, mín. 1) no Nv. 3; + 2 (15); + 4 (27); + 6 (39); + 8 (48). Recarga: 1 por turno (2 a partir do Nv. 30). Por combate: começa cheia em cada combate; fora de combate, fica sempre cheia.",
      "Espaços de implante: 2 (Nv. 3), 4 (9), 5 (15), 6 (21), 8 (27), 10 (36), 12 (42), todos (48). Instalar ou trocar 1 implante leva um Descanso Longo. Implantes são itens do inventário e aceitam Melhorias de itens. Usam o Grau máximo do arquétipo e a CD de Projeto; bônus contam no Teto de Bônus.",
      "Implantes (I / II / III / IV / V): Braços: Arma Embutida (passivo; uma arma de verdade no braço, sai e entra sem ação; d20 + Luta, dano da arma + Inteligência); Canhão de Pulso (Ação Bônus, 1 Carga, 1x/turno; até 18 m, d20 + Pontaria; 2d6 / 3d8 / 4d10 / 6d10 / 8d10 + Int. de Energia); Braço Hidráulico (+3 / +4 / +6 / +8 / +10 em Força e Atletismo; vantagem para agarrar e empurrar). Pernas: Propulsores (+3 / +3 / +4,5 / +4,5 / +6 m; 1 Carga para voar até o fim do turno); Amortecedores (+3 a +10 em Acrobacia; sem dano de queda). Olhos: Visor Tático (Percepção +3 a +10; 1 Carga para marcar um alvo, acerto +2 / +2 / +3 / +4 / +5); Visão Térmica (18 / 18 / 24 / 24 / 36 m). Tronco: Placas Subdérmicas (RD física 3 / 4 / 5 / 6 / 8); Gerador de Escudo (Ação Bônus, 2 Cargas: PV temp. 2d4 / 2d8 / 3d10 / 4d12 / 6d12 + Int.; ou Reação, 1 Carga: RD 2 / 2 / 3 / 3 / 4). Cabeça: Coprocessador (+3 a +10 em Investigação e Ofício; 1 Carga para rerrolar um teste de Inteligência); Interface Neural (comanda Engenhocas e o Autômato com ação livre; +1 / +2 / +2 / +3 / +4 nos ataques deles). Coluna: Reator (+2 / +2 / +3 / +3 / +4 Cargas); Sistema de Reparo (Ação Bônus, 2 Cargas: 2d4 / 2d8 / 3d10 / 4d12 / 6d12 + Int.)."
    ],
    bateria: [[3, 0], [15, 2], [27, 4], [39, 6], [48, 8]],
    habilidades: [
      [3, "Corpo Mecânico", "Ganha a Bateria e 2 espaços de implante."],
      [6, "Multitarefa", "1x/turno, ativa um implante de Ação Bônus como ação livre."],
      [9, "Expansão I", "4 espaços de implante. Imune a Sangrando e não precisa respirar."],
      [12, "Modos de Combate", "Ação livre, 1x/turno, para escolher um modo: Assalto (1x/turno, +2 dados no dano de um implante); Bastião (+2 CA e −1,5 m de deslocamento); Velocidade (+3 m e +2 Esquiva)."],
      [15, "Expansão II", "5 espaços; Bateria = metade da Inteligência + 2."],
      [18, "Sobrecarga de Sistema", "2 Cargas: um implante funciona 1 Grau acima naquele uso (acima do V: +2 dados ou +2 de bônus)."],
      [21, "Integração", "6 espaços. Engenhocas do arquétipo podem ser instaladas no corpo como implantes: ocupam 1 espaço em vez de Projetos e não gastam cenas."],
      [24, "Blindagem Total", "Imune a Envenenado e Doente; RD contra todo dano igual à metade da Proteção."],
      [27, "Expansão III", "8 espaços; Bateria = metade da Inteligência + 4."],
      [30, "Núcleo Reforçado", "Recupera 2 Cargas por turno."],
      [33, "Modo Duplo", "Pode manter 2 modos ao mesmo tempo."],
      [36, "Expansão IV", "10 espaços."],
      [39, "Protocolo de Emergência", "1x por Descanso Longo, ao cair a 0 PV, fica com PV iguais à cura do Grau V (6d12 + Int.) e com a Bateria cheia. Bateria = metade da Inteligência + 6."],
      [42, "Sobrecarga 2.0", "12 espaços. A Sobrecarga de Sistema custa 1 Carga."],
      [45, "Arsenal Embutido", "1x/cena, Ação Padrão: ativa todos os implantes de ataque de uma vez, sem gastar Carga."],
      [48, "Forma Definitiva (capstone)", "Todos os implantes instalados ao mesmo tempo; Bateria = metade da Inteligência + 8. 1x por Descanso Longo, por 1 minuto: fica um tamanho maior, todos os implantes funcionam 1 Grau acima, não gasta Carga e fica imune a Caído, Agarrado e Preso."]
    ]
  },
  cacador: {
    nome: "Caçador", arquetipo: "artifice",
    descricao: "A Oficina de Sangue: transforma ferimentos em oportunidade. Dispara para abrir a guarda, avança para o Ataque Visceral e usa ferramentas letais para dominar a caçada. Mistura uma pistola de Balas de Mercúrio, uma arma corpo a corpo que muda de forma, cura ao revidar (Rally) e as Hunter Tools. Faz bem: pressão constante num alvo, janelas de dano enorme (Visceral), se manter de pé trocando golpes. Faz mal: proteger aliados e controle prolongado de área. Precisa de: quem segure os outros inimigos enquanto ele caça um alvo.",
    regras: [
      "Balas de Mercúrio: capacidade igual à Inteligência (mín. 3), separada dos Projetos. Voltam ao máximo no Descanso Longo e recuperam ¼ (mín. 1) no Descanso Curto. Bala de Sangue: 1x/turno, Ação Bônus, perde PV iguais a 10% do máximo (mín. 5) e cria 1 Bala.",
      "Pontos de Impacto: cada disparo da Pistola com Ação Bônus (ou disparos extras de habilidades, como o Tiro Duplo) que acerta aplica 1 ponto; disparos com Ação Padrão não aplicam. Com 3 pontos, o alvo fica Atordoado até o início do próximo turno dele e os pontos saem; só 1 vez por criatura por combate (o Mestre pode mudar para chefes).",
      "Ataques pela Inteligência: com a Pistola, a Arma de Oficina e as Hunter Tools, d20 + Pontaria com Inteligência (no lugar de Destreza) e d20 + Luta com Inteligência (no lugar de Força); o dano soma a Inteligência. Hunter Tools usam a CD de Projeto.",
      "Cura: nenhuma habilidade recupera mais PV do que você perdeu, nem passa do máximo; curas que usam a mesma perda não acumulam. Crítico: bônus em dados se multiplicam; fixos não.",
      "Armas da Oficina (Compacta / Estendida): Serra-Cutelo (1d8 Cortante 19/x2 Leve / 1d10 Cortante 20/x3 alcance 3 m; +1 dado contra Bestas); Bengala-Chicote (1d6 Perfurante 19/x2 Acuidade / 1d6 Cortante 20/x2 alcance 4,5 m, até 2 alvos adjacentes); Machado do Caçador (1d10 Cortante 20/x3 / 1d12 Pesada Duas Mãos 3 m, metade do dano em outra criatura a 1,5 m); Lança-Serra (1d8 Cortante 19/x2 / 1d10 Perfurante 20/x3 3 m, ataques de oportunidade ao entrar no alcance); Espada Sagrada (1d8 Cortante 19/x2 Versátil / 2d6 19/x3 Pesada Duas Mãos, pode ser Radiante); Lâminas Gêmeas (1d8 Perfurante 18/x2 Acuidade / 2 × 1d6 Cortante 19/x2 Leve Dupla); Martelo-Fornalha (1d8 Cortante 19/x2 / 2d6 Contundente 20/x3, Fortitude ou Caído); Foice Funerária (1d8 Cortante 19/x2 Acuidade / 1d12 19/x3 Duas Mãos 3 m, +1 Ponto de Impacto 1x/turno).",
      "Hunter Tools (1x por descanso de graça; depois pagando Balas): Olho Negro (27; 1 criatura até 24 m, ataque: 4d10 Força, vantagem contra voadores; 2 Balas); Luvas do Executor (27; até 3 criaturas até 18 m, 2d8 Força cada; 2 Balas); Rugido da Besta (27; a até 3 m, Fortitude: 4d8 Força e empurra 3 m; 2 Balas); Tiny Tonitrus (36; linha de 12 m, Reflexo: 6d10 Relâmpago; 3 Balas); Coração do Cosmos (36; até 4 criaturas até 18 m, 4d10 Força cada; 3 Balas); Chamado Além (45; até 6 criaturas até 24 m, Vontade: 6d10 Força, depois ataque extra contra até 3 com +3d10; 5 Balas, 1x/descanso)."
    ],
    pistola: [[3, "2d8"], [30, "3d10"], [48, "4d10"]],
    balasMin: 3,
    municaoOficina: [[12, 3], [24, 4], [36, 5], [48, 6]],
    habilidades: [
      [3, "Arsenal do Caçador", "Recebe a Pistola do Caçador (não precisa comprar): alcance 18 m, 2d8 Perfurante, dispara com Ação Bônus ou Ação Padrão, gastando 1 Bala. Não faz vários disparos na mesma ação. Só o disparo de Ação Bônus aplica Pontos de Impacto. Ganha as Balas de Mercúrio e os Pontos de Impacto."],
      [6, "Rally", "Quando uma criatura te causa dano, o Rally contra ela dura até o fim do seu próximo turno. Cada acerto seu nela recupera 1d10 + Constituição de PV, até o total perdido naquele dano. Dano de outras criaturas não aumenta esse Rally."],
      [9, "Arma de Transformação", "Escolha uma arma da tabela de Armas da Oficina (é um item e aceita Melhorias). Ação livre, 1x/turno, troca de forma: Compacta (+1 na Margem de Ameaça) ou Estendida (+1d8 de dano corpo a corpo). O tipo de dano não muda."],
      [12, "Munição de Oficina", "Após cada descanso, prepara usos de munição especial (3; 4 no Nv. 24; 5 no 36; 6 no 48). Cada disparo consome um uso no lugar da bala. Incendiária: +2d8 Fogo. Serrilhada: +2d8 físico (+3d8 contra Bestas). Explosiva: 2d8 de Força no alvo e em quem estiver a até 1,5 m dele."],
      [15, "Frasco de Sangue", "3 Frascos por descanso. Ação Bônus: você recupera 4d8 + nível de Artífice em PV. Não encerra o Rally."],
      [18, "Ataque Visceral", "Contra uma criatura Atordoada pelos seus Pontos de Impacto, Ação Padrão: 6d10 Perfurante e você recupera 2d8 PV. O ataque encerra o Atordoamento. Só funciona em alvo Atordoado."],
      [21, "Sangue na Oficina", "Ao usar um Frasco, escolha um efeito: Fortalecido (próximo ataque +2d8), Acelerado (+3 m até o fim do turno), Restaurador (recupera 2d8 PE) ou Fervente (+3 no próximo ataque contra alvo com condição)."],
      [24, "Oficina de Combate", "Ação Bônus, 1x/turno: Recarregar (+2 Balas), Modificar (troca a munição especial do próximo disparo), Afiar (próximo ataque corpo a corpo +2d8) ou Pressurizar (próximo disparo +1 na Margem)."],
      [27, "Ferramentas do Caçador", "Aprende Olho Negro, Luvas do Executor e Rugido da Besta (Hunter Tools)."],
      [30, "Munição de Mercúrio Refinada", "A Pistola passa a 3d10. Tiro Duplo: gasta 2 Balas num disparo de 6d10 Perfurante (conta como um disparo; aplica no máximo 3 Pontos de Impacto)."],
      [33, "Cinza de Medula", "3x por descanso, Ação Bônus: o próximo disparo até o fim do próximo turno causa +4d10 (+6d10 contra alvo Atordoado). É gasta mesmo se errar."],
      [36, "Ferramenta do Cosmos", "Aprende Tiny Tonitrus e Coração do Cosmos."],
      [39, "Sangue de Caçador", "Quando o Rally cura, também recupera 1d8 PE ou 1 Bala. O Ataque Visceral cura mais metade dos PV perdidos desde o início do Rally atual (arredonda para baixo, sem passar da perda)."],
      [42, "Pesadelo do Caçador", "1x/combate, Ação Padrão, 3 rodadas: usa uma Hunter Tool como Ação Bônus 1x/turno; as Hunter Tools causam +2d8 e aplicam 1 Ponto de Impacto (sem novo Atordoamento num alvo já Atordoado por você neste combate). Pode usar duas Hunter Tools diferentes no mesmo turno, respeitando os limites."],
      [45, "Chamado Além", "Aprende a Hunter Tool Chamado Além."],
      [48, "O Último Caçador (capstone)", "1x por descanso, ação livre, 3 rodadas: a Pistola causa 4d10; ataques com armas +2d10; disparos aplicam +2 Pontos de Impacto; o Rally vale contra qualquer criatura que te feriu (um por vez); Visceral +4d10; Hunter Tools custam 2 Balas a menos (mín. 0); 1x/turno, usa uma Hunter Tool e ataca com arma no mesmo turno. O Visceral recupera todos os PV perdidos desde o início do Rally atual (substitui o Sangue de Caçador)."]
    ]
  },
  curandeiro: {
    nome: "Curandeiro", arquetipo: "artifice",
    descricao: "O curador principal dos Artífices: faz poções de cura fortes de alvo único, trata condições, reanima quem está morrendo e prepara remédios que protegem o aliado na hora certa. A cura em área com magia é do Clérigo; a cura fraca e dividida no tempo, do Alquimista. Faz bem: tirar um aliado do limite com uma dose, curar condições, segurar quem está nos testes de morte, buffs de proteção. Faz mal: dano e curar vários aliados ao mesmo tempo. Precisa de: aliados que o protejam.",
    regras: [
      "Remédios: recurso próprio, separado dos Projetos. Máximo: Inteligência (Nv. 3), + 2 (12), + 4 (24), + 6 (36), + 8 (48). Doses por Remédio: 2 (Restauradora 1) no Nv. 3; 3 no Nv. 18; 4 (Restauradora 2) no Nv. 36. Receitas no Formulário Médico: 4 (3), 5 (9), 6 (15), 7 (21), 8 (27), 9 (33), 10 (39), 11 (45), todas (48); a Poção Restauradora e o Reanimador estão sempre no Formulário e não contam.",
      "Recuperação: voltam ao máximo no Descanso Longo e recuperam metade no Descanso Curto. Preparar no descanso ou em aberto, com as ações da Montagem em Campo. Carrega no máximo 4× os Remédios em doses.",
      "Usar: dar uma dose é Ação Padrão num aliado a até 1,5 m (Ação Bônus e arremesso a partir do Nv. 6). Bônus de remédios contam no Teto de Bônus. Usam o Grau máximo do arquétipo e a CD de Projeto.",
      "Cura (I / II / III / IV / V): Poção Restauradora (2d8 / 4d8 / 6d10 / 8d12 / 12d12 + Int.); Atadura Médica (para Sangrando; 1d8 a 5d8 + Int.); Sutura (10 minutos; remove Lesionado e Fraturado; 2d6 / 4d6 / 6d6 / 8d6 / 10d6 + Int.); Reanimador (Ação Bônus num aliado fazendo testes de morte: transforma 1 falha em sucesso, 2 a partir do Nv. 36; não traz mortos de volta).",
      "Tratamento: Antídoto (remove Envenenado e Doente; Resistência a Venenoso por 1 hora); Sais Estimulantes (remove Atordoado, Dormindo e Inconsciente, não a 0 PV); Colírio (remove Cego e Ofuscado; visão no escuro 18 / 18 / 36 m do Grau III); Calmante (remove Abalado, Apavorado, Assustado e Confuso; +3 a +10 em Vontade); Gel Térmico (remove Em Chamas e Enregelado; RD 3 a 8 contra Fogo e Frio).",
      "Proteção: Painkiller (RD contra todo dano 3 / 4 / 5 / 6 / 8 por 1 minuto); Coagulante (imune a Sangrando; com metade dos PV ou menos regenera 2 / 3 / 4 / 6 / 8 + Int. por turno); Soro de Vigor (+3 a +10 em Fortitude e ignora 1 nível de Exaustão); Adrenalina de Emergência (só com um quarto dos PV ou menos: +3 a +10 no acerto e +3 m); Kit de Campo (+3 a +10 em Medicina por 1 hora). Outras: Seringa Sedativa (ataque, Fortitude ou Lento; do Grau IV, falhar por 5 deixa Dormindo); Placebo Tático (rerrola a próxima falha em Vontade na cena)."
    ],
    remedios: [[3, 0], [12, 2], [24, 4], [36, 6], [48, 8]],
    habilidades: [
      [3, "Medicina de Campo", "Ganha os Remédios e o Formulário Médico (Restauradora, Reanimador e 4 receitas). Diagnóstico: sempre vê os PV e as condições dos aliados que enxerga."],
      [6, "Mão Firme", "Dar uma dose vira Ação Bônus, e dá para arremessar a dose num aliado a até 9 m (estoura nele, sem teste)."],
      [9, "Remédio Específico", "+1 receita. Cada Poção Restauradora também remove 1 condição: Envenenado, Doente, Sangrando, Em Chamas, Abalado ou Cego."],
      [12, "Dose Concentrada", "Remédios = Inteligência + 2. 1x/turno, uma cura sua ganha +1 dado."],
      [15, "Triagem", "+1 receita. 1x/rodada, como Reação, quando um aliado a até 9 m sofre dano ou começa a fazer testes de morte, arremessa uma dose nele."],
      [18, "Estabilizar", "3 doses por Remédio. A Restauradora num aliado a 0 PV cura +50%, e quem você tocar fica Estável na hora."],
      [21, "Regeneração Prolongada", "+1 receita. Depois de uma cura sua, o alvo regenera PV iguais à Inteligência no início dos próximos 3 turnos dele."],
      [24, "Protocolo de Reanimação", "Remédios = Inteligência + 4. O Reanimador também cura PV iguais à Atadura do seu Grau e o alvo pode se levantar na hora."],
      [27, "Cura Excedente", "+1 receita. A cura que passar do máximo vira PV temporários (até metade da cura)."],
      [30, "Vacina", "Uma dose pode também dar Resistência a um tipo de dano escolhido por 1 minuto."],
      [33, "Dose Dupla", "+1 receita. Gasta 2 Remédios numa dose de cura: o dobro dos dados."],
      [36, "Reanimação 2.0", "Remédios = Inteligência + 6; 4 doses por Remédio (Restauradora: 2). O Reanimador transforma até 2 falhas em sucessos."],
      [39, "Milagre Químico", "+1 receita. 1x/cena, uma cura sua usa o valor máximo dos dados."],
      [42, "Plantão", "No início de cada combate, os aliados que você enxerga ganham PV temporários iguais a 2 × Inteligência."],
      [45, "Panaceia", "+1 receita. 1x/cena, uma dose remove todas as condições do alvo e cura normalmente."],
      [48, "Elixir da Vida (capstone)", "Remédios = Inteligência + 8; conhece todas as receitas. 1x por semana, traz de volta à vida um aliado que morreu até duas cenas atrás, com todos os PV e sem penalidade (é a única forma da classe de trazer um morto de volta). Também 1x por Descanso Longo, por 1 cena: 1 dose por turno não gasta Remédio."]
    ]
  },
  masterPuppets: {
    nome: "Master of Puppets", arquetipo: "artifice",
    descricao: "Monta um enxame de pequenos robôs, as Marionetes, e comanda todos de uma vez. Não repete o arquétipo (um Autômato e Engenhocas fixas) nem o Mecânico de Guerra (mechas pilotados): a força dele é a quantidade, a posição e, no fim, o controle de outras criaturas. Faz bem: ocupar o mapa (cercar, bloquear, explorar), dano em enxame, proteger aliados com Escudeiros. Faz mal: enfrentar dano em área, que destrói muitas Marionetes de uma vez; sozinho é frágil. Precisa de: aliados que segurem quem tem ataques em área.",
    regras: [
      "Marionetes: recurso próprio, separado dos Projetos. Quantidade: metade da Inteligência (Nv. 3, para baixo, mín. 2), Inteligência (9), + 2 (24), + 4 (33), + 6 (45). PV de cada pelo Grau do arquétipo: 5 / 15 / 30 / 45 / 60.",
      "Ficha da Marionete: Pequena, CA igual à CD de Projeto, deslocamento 9 m, testes de resistência com o seu bônus de Ofício. As destruídas são refeitas no Descanso Curto ou Longo (ou com a Reconstrução Rápida).",
      "Comando: com uma Ação Bônus, todas as Marionetes se movem até o deslocamento e fazem a mesma ação.",
      "Ataque em Enxame: as Marionetes ao lado de um alvo fazem um único ataque (d20 + Ofício). Acertou: 1 dado por Marionete participante, Contundente ou Perfurante (1d4 / 1d6 / 1d8 / 1d10 / 1d12 pelo Grau; no crítico os dados se multiplicam). Sem limite fixo: o limite é o espaço ao redor do alvo (8 para Médio, 12 para Grande, 16 para Enorme). Efeitos usam a CD de Projeto.",
      "Chassis (Nv. 6; trocar leva um Descanso Curto): Soldado (conta como 2 no Ataque em Enxame); Escudeiro (Reação: +2 CA num aliado ao lado contra um ataque); Batedor (+3 m; você vê e ouve por ela); Operário (+2 por Operário em testes de Ofício, até a Soma do Grau; carrega 50 kg); Kamikaze (explode num raio de 1,5 m com 2d6 / 3d8 / 4d10 / 6d10 / 8d10, Reflexo para metade; é destruída)."
    ],
    marionetes: [[3, "metade"], [9, 0], [24, 2], [33, 4], [45, 6]],
    dadoEnxame: ["1d4", "1d6", "1d8", "1d10", "1d12"],
    habilidades: [
      [3, "Oficina de Marionetes", "Ganha as Marionetes, o Comando e o Ataque em Enxame."],
      [6, "Chassis", "Cada Marionete recebe um chassi (Soldado, Escudeiro, Batedor, Operário ou Kamikaze)."],
      [9, "Linha de Montagem", "Marionetes = Inteligência."],
      [12, "Fios de Comando", "O Comando pode dividir as Marionetes em 2 grupos com ações diferentes."],
      [15, "Reconstrução Rápida", "Ação Padrão e 3 PE: reconstrói 1 Marionete destruída com metade dos PV (1x por rodada)."],
      [18, "Muralha de Marionetes", "Um aliado ao lado de 2 ou mais Escudeiros ganha +2 CA."],
      [21, "Marionete Mestra", "Você pode usar Consumíveis e ativar Engenhocas do arquétipo a partir de uma Marionete, como se estivesse no lugar dela."],
      [24, "Produção em Série", "Marionetes = Inteligência + 2. No início de cada combate, ganha 2 Marionetes temporárias, que somem no fim da cena."],
      [27, "Rede Neural", "As Marionetes compartilham os sentidos, e você usa a sua Percepção a partir de qualquer uma."],
      [30, "Autonomia", "No seu turno, um grupo de Marionetes faz uma ação simples (mover, Ataque em Enxame ou Escudeiro) sem precisar de Comando."],
      [33, "Blindagem de Série", "Marionetes = Inteligência + 4. Elas ganham RD física igual à Proteção do Grau (3 / 4 / 5 / 6 / 8)."],
      [36, "Enxame Assassino", "O Ataque em Enxame tem crítico em 19–20 e deixa o alvo Desestabilizado até o fim do próximo turno."],
      [39, "Exército Coordenado", "Dá para usar o Comando 2x por turno: uma com Ação Bônus e outra com Ação Padrão."],
      [42, "Marionete Viva", "1x por cena, Ação Padrão: uma criatura a até 18 m faz Vontade contra a CD de Projeto. Se falhar, fica Dominada por 1 rodada e você decide a próxima ação dela. Chefes têm vantagem no teste."],
      [45, "Exército de Aço", "Marionetes = Inteligência + 6. Elas começam cada combate com PV cheios."],
      [48, "Master of Puppets (capstone)", "1x por Descanso Longo, por 1 minuto: ganha Marionetes extras iguais à Inteligência, o dado do enxame sobe para 2d12 e a Marionete Viva pode ser usada 1x por rodada."]
    ]
  },
  mecanicoGuerra: {
    nome: "Mecânico de Guerra", arquetipo: "artifice",
    descricao: "Constrói um mecha: uma armadura gigante que ele pilota por dentro ou controla à distância. A Armadura Viva melhora o próprio corpo e o Master of Puppets faz muitos robôs pequenos; o Mecânico tem um único robô grande, resistente e cheio de módulos, que cresce com ele. Faz bem: aguentar muito dano, ocupar espaço, proteger aliados ao lado do mecha e dano pesado. Faz mal: furtividade e lugares apertados. Precisa de: tempo e Energia para reparar o mecha.",
    regras: [
      "O Mecha: Mk-I Grande 9 m, 2 módulos (Nv. 3); 3 módulos (9); Mk-II Grande, 4 módulos (15); Mk-III Enorme 12 m, 5 módulos (24); Mk-IV Enorme, 6 módulos (33); Mk-V Colossal 15 m, 8 módulos (45); Colosso, todos os módulos (48). É um item e aceita Melhorias de itens.",
      "PV do mecha: 15 × nível de Artífice. CA igual à CD de Projeto. Blindagem: RD contra todo dano igual à Proteção do Grau (3 / 4 / 5 / 6 / 8), somando com Placas Pesadas e os modos de defesa.",
      "Ataques do mecha usam d20 + Tecnologia. Punho Hidráulico (sempre instalado, sem Energia): 1d10 / 2d8 / 2d10 / 3d10 / 4d10 + Inteligência, Contundente.",
      "Pilotando por dentro, suas ações são as do mecha; o dano vai para o mecha. Controle Remoto (Nv. 6): a até 36 m, age com a sua Ação Bônus. Modo Maleta: ao chegar a 0 PV, o mecha vira uma maleta (Pequena, 10 kg) e o piloto sai ileso; recolher ou abrir de propósito é Ação Padrão (Ação Bônus no Nv. 15). Conserto: Descanso Longo volta com todos os PV; Descanso Curto, metade. Trocar 1 módulo leva um Descanso Longo.",
      "Energia: recurso próprio, separado dos Projetos. Máximo: Inteligência (Nv. 3), + 2 (15), + 4 (27), + 6 (39), + 8 (48). Volta toda no Descanso Longo; o Curto devolve metade. Pilotar, mover, o Punho e módulos passivos não gastam; sem Energia, só os módulos ativos param.",
      "Módulos (I / II / III / IV / V; testes contra a CD de Projeto): Canhão de Ombro (Ação Bônus, 1 Energia, 1x/turno; até 36 m; 2d6 / 3d8 / 4d10 / 6d10 / 8d10 + Int. Balístico); Lança-chamas (Ação Padrão, 2 Energia; cone 4,5 m, Reflexo para metade, Em Chamas; 2d6 a 8d10 Fogo); Salva de Mísseis (Ação Padrão, 3 Energia; raio 3 m até 36 m; 2d6 a 8d10 Explosivo); Serra Rotatória (passivo; Punho +1d6 / +1d8 / +1d10 / +2d8 / +2d10 Cortante); Garra (passivo, agarrar com vantagem; 1 Energia arremessa a 6 m); Escudo de Energia (Ação Bônus, 2 Energia; PV temp. 2d10+5 / 3d10+5 / 4d10+10 / 5d10+10 / 6d10+15); Placas Pesadas (passivo; RD +3 / +4 / +5 / +6 / +8; −1,5 m); Campo Defletor (Reação, 1 Energia; CA +3 / +4 / +5 / +6 / +8 contra um ataque); Propulsores (passivo +3 m; 1 Energia para voar)."
    ],
    energia: [[3, 0], [15, 2], [27, 4], [39, 6], [48, 8]],
    habilidades: [
      [3, "Mecha Mk-I", "Ganha o mecha (Grande, 2 módulos, Punho Hidráulico), a Energia e o Modo Maleta."],
      [6, "Controle Remoto", "Comanda o mecha a até 36 m com a Ação Bônus."],
      [9, "Oficina de Campo", "+1 módulo (3). No Descanso Curto, o mecha recupera metade dos PV."],
      [12, "Blindagem Reativa", "Reação, 1 Energia: a RD do mecha dobra contra um ataque."],
      [15, "Mk-II", "+1 módulo (4); o Punho ganha alcance de 3 m; abrir ou recolher a maleta vira Ação Bônus. Energia = Inteligência + 2."],
      [18, "Pisotear", "Ao passar pelo espaço de criaturas menores, elas fazem Reflexo ou ficam Caídas e sofrem o dano do Punho."],
      [21, "Reator Sobrecarregado", "2 Energia: um módulo funciona 1 Grau acima naquele uso (acima do V: +2 dados ou +2 de bônus)."],
      [24, "Mk-III", "O mecha fica Enorme, com 12 m de deslocamento, e ganha +1 módulo (5)."],
      [27, "Cobertura", "Aliados ao lado do mecha têm meia cobertura. Energia = Inteligência + 4."],
      [30, "Modo Fortaleza", "Ação Bônus, 1 Energia por rodada: o mecha não se move, ganha +2 CA e RD extra igual à Proteção, e o Canhão de Ombro faz 1 ataque a mais por turno (sem Energia extra)."],
      [33, "Mk-IV", "+1 módulo (6). Reparo de Emergência: 1x por combate, Ação Padrão e 3 Energia, o mecha sai da maleta com um quarto dos PV."],
      [36, "Arsenal Pesado", "Pode ativar 2 módulos diferentes de Ação Padrão no mesmo turno, pagando a Energia dos dois."],
      [39, "Copiloto", "Um aliado pode embarcar e usar 1 módulo por turno, no turno dele (a Energia sai da sua). Energia = Inteligência + 6."],
      [42, "Núcleo Instável", "1x por Descanso Longo: o mecha explode num raio de 6 m (8d10 Explosivo, Reflexo para metade) e vira maleta. O piloto sai ileso."],
      [45, "Mk-V", "O mecha fica Colossal, com 15 m de deslocamento, e ganha +2 módulos (8)."],
      [48, "Colosso (capstone)", "Todos os módulos instalados; Energia = Inteligência + 8. 1x por Descanso Longo, por 1 minuto: os módulos não gastam Energia, o Escudo de Energia dá o dobro de PV temporários e o mecha é imune a Caído, Agarrado e Preso."]
    ]
  }
};
