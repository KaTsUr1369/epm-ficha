/**
 * Catálogo de Talentos do EPM (fonte: EPM/talentos.md — 55 talentos em 8 categorias e 4 faixas).
 * Talento = dom ou jeito de lutar escolhido ao subir de nível (não custa PT nem tempo).
 * As regras ainda em confirmação ficam nas constantes do topo, fáceis de mudar.
 */
import { lerRequisitos, normTreino, ATRS, PERICIAS_REQ, TREINAMENTOS_LISTA } from "./treinamentos-lista.mjs";

/* ---------- Regras (decisões para confirmar no doc) ---------- */
/** 1 talento no nível 1 e +1 a cada TALENTO_A_CADA níveis totais (10, 20… 100). */
export const TALENTO_INICIAL = 1;
export const TALENTO_A_CADA = 10;
/** Nível total mínimo de cada faixa. */
export const FAIXAS_TALENTO = {
  comum:    { label: "Comum",    nivel: 1,  cor: "#93A9A3" },
  avancado: { label: "Avançado", nivel: 25, cor: "#5B8DB8" },
  superior: { label: "Superior", nivel: 50, cor: "#9B6BC7" },
  lendario: { label: "Lendário", nivel: 75, cor: "#E3B04B" }
};
export const MAX_LENDARIOS = 1;
/** Robusto: PV máximo por nível total. */
export const ROBUSTO_PV_POR_NIVEL = 2;
/** Sortudo: pontos de Sorte por dia (recarregam no descanso longo). */
export const SORTE_POR_DIA = 3;
/** Sangue Mágico: PV por PM que faltou. */
export const SANGUE_PV_POR_PM = 2;
/** Fúria Controlada: PV temporário = mult × Constituição; dano extra até o fim do combate. */
export const FURIA = { mult: 2, dano: 2 };
/** Presença Marcante / Lenda Viva: afinidade inicial sugerida com NPCs novos. */
export const AFINIDADE_INICIAL = { presencaMarcante: 1, lendaViva: 2 };

export const FREQUENCIAS_TALENTO = {
  livre: "Livre", rodada: "1× por rodada", turno: "1× por turno", cena: "1× por cena", combate: "1× por combate",
  dia: "1× por dia", longo: "1× por descanso longo", semana: "1× por semana", sessao: "1× por sessão"
};

export const CATEGORIAS_TALENTOS = [
  { id: "combate",   label: "Combate",                icone: "fa-solid fa-khanda" },
  { id: "defesa",    label: "Defesa e Resistência",   icone: "fa-solid fa-shield-halved" },
  { id: "mobilidade", label: "Mobilidade",            icone: "fa-solid fa-person-running" },
  { id: "magia",     label: "Magia e Núcleo",         icone: "fa-solid fa-wand-sparkles" },
  { id: "oficio",    label: "Ofício e Criação",       icone: "fa-solid fa-hammer" },
  { id: "social",    label: "Social",                 icone: "fa-solid fa-comments" },
  { id: "sentidos",  label: "Sentidos e Exploração",  icone: "fa-solid fa-binoculars" },
  { id: "mente",     label: "Mente e Alma",           icone: "fa-solid fa-brain" }
];

export const REGRAS_TALENTO = [
  `1 talento no nível 1 e +1 nos níveis totais ${Array.from({ length: 10 }, (_, i) => (i + 1) * TALENTO_A_CADA).join(", ")}. Raças, classes, bênçãos ou o Mestre podem dar talentos extras.`,
  `Faixas pelo nível total: ${Object.values(FAIXAS_TALENTO).map(f => `${f.label} ${f.nivel}`).join(", ")}. No máximo ${MAX_LENDARIOS} talento Lendário.`,
  "Cada talento só pode ser pego uma vez, a não ser que seja repetível (outra escolha a cada vez).",
  "Um talento não acumula com um treinamento de efeito idêntico. Os bônus respeitam o Teto de Bônus (+5 / +8 / +12 / +15).",
  "1× por combate volta no fim do combate; 1× por dia, no descanso longo; 1× por sessão, no Início da sessão (Escudo do Mestre)."
];

/* ---------- Ações (viram habilidade na sub-aba Talentos) ---------- */
const A = (nome, campos) => ({ nome, acao: "livre", custo: { recurso: "nenhum", valor: 0 }, uso: "livre", alcance: "", area: "", alvo: "", duracao: "", teste: { tipo: "nenhum", pericia: "", nd: "" }, dano: { formula: "", tipo: "" }, efeito: "", ...campos });

const T = (id, nome, categoria, faixa, requisitos, beneficio, auto = {}, extra = {}) =>
  ({ id, nome, categoria, faixa, requisitos, beneficio, frequencia: "livre", auto, ...extra });

const LISTA = [
  /* ---------- Combate ---------- */
  T("ambidestria", "Ambidestria", "combate", "comum", "Destreza 3",
    "Empunha duas armas de uma mão ao mesmo tempo, mesmo que não sejam leves, sem penalidade de mão inábil. Saca, guarda ou usa um consumível como ação bônus ou de movimento. Com o treinamento Combate com Duas Armas, o ataque da segunda arma soma o atributo no dano.",
    { especial: "ambidestria" }),
  T("golpePesado", "Golpe Pesado", "combate", "comum", "Força 4",
    "Com uma arma de duas mãos, antes de rolar o ataque, pode aceitar −3 no acerto para ganhar +1 nível de dano.",
    { ataque: { acerto: -3, nivelDano: 1, duasMaos: true, rotulo: "Golpe Pesado: −3 no acerto, +1 nível de dano (arma de duas mãos)" } }),
  T("duelista", "Duelista", "combate", "comum", "Destreza 3",
    "Com uma arma numa mão e a outra livre, +2 no acerto e +2 no Contra-ataque.",
    { ataque: { acerto: 2, rotulo: "Duelista (talento): uma arma e a outra mão livre, +2 no acerto" } }),
  T("lutadorRua", "Lutador de Rua", "combate", "comum", "Força ou Constituição 3",
    "Ataques desarmados ganham +1 nível de dano. Ao acertar um, pode, como ação bônus, forçar o alvo a Fortitude CD 10 + Força; se falhar, fica Preso.",
    { texto: true }),
  T("atiradorPaciente", "Atirador Paciente", "combate", "comum", "3 pontos em Pontaria",
    "Se não se moveu neste turno, os ataques à distância ganham +2 no acerto e +2 no dano.",
    { ataque: { acerto: 2, dano: 2, distancia: true, rotulo: "Atirador Paciente: não se moveu neste turno, +2 no acerto e +2 no dano" } }),
  T("matadorGigantes", "Matador de Gigantes", "combate", "comum", "3 pontos em Luta ou Pontaria",
    "+1 nível de dano contra criaturas de tamanho maior que o seu.",
    { ataque: { nivelDano: 1, rotulo: "Matador de Gigantes: alvo maior que você, +1 nível de dano" } }),
  T("oportunista", "Oportunista", "combate", "comum", "Destreza 3",
    "1 vez por rodada, quando um inimigo no seu alcance fica Caído ou Desprevenido, pode atacá-lo como reação.",
    { texto: true }, { frequencia: "rodada" }),
  T("dancaLaminas", "Dança das Lâminas", "combate", "avancado", "Ambidestria e Combate com Duas Armas",
    "1 vez por turno, se acertar o mesmo alvo com as duas armas, ele fica Desestabilizado até o fim do próximo turno dele.",
    { texto: true }, { frequencia: "turno" }),
  T("executor", "Executor", "combate", "avancado", "5 pontos em Luta",
    "Contra alvos com metade da Vida ou menos, a margem de ameaça cai 1 (ex.: 20 → 19). A margem não garante o acerto.",
    { ataque: { margem: 1, rotulo: "Executor: alvo com metade da Vida ou menos, margem de ameaça −1" } }),
  T("furiaControlada", "Fúria Controlada", "combate", "avancado", "Constituição 5",
    "A primeira vez no combate em que cair para metade da Vida ou menos, ganha 2 × Constituição de PV temporário e +2 no dano até o fim do combate.",
    { especial: "furiaControlada", acoes: [A("Fúria Controlada", { uso: "combate", efeito: "Caiu para metade da Vida ou menos: ganha [[/r 2 * @atr.constituicao]] PV temporários (2 × Constituição) e +2 no dano até o fim do combate. A ficha oferece sozinha na primeira vez do combate." })] },
    { frequencia: "combate" }),
  T("golpeDevastador", "Golpe Devastador", "combate", "superior", "8 pontos em Luta ou Pontaria",
    "1 vez por combate, depois de acertar um ataque, declara que ele é crítico.",
    { acoes: [A("Golpe Devastador", { uso: "combate", efeito: "Depois de acertar um ataque, declara que ele é crítico (multiplique o dano pelo multiplicador de crítico da arma)." })] },
    { frequencia: "combate" }),
  T("tempestadeLaminas", "Tempestade de Lâminas", "combate", "superior", "Destreza ou Força 8",
    "1 vez por combate, ação padrão e 10 PE: faz um ataque corpo a corpo contra cada inimigo no seu alcance.",
    { acoes: [A("Tempestade de Lâminas", { acao: "padrao", uso: "combate", custo: { recurso: "pe", valor: 10 }, area: "inimigos no seu alcance", efeito: "Faz um ataque corpo a corpo contra cada inimigo no seu alcance (um ataque da arma por alvo)." })] },
    { frequencia: "combate" }),
  T("avatarGuerra", "Avatar da Guerra", "combate", "lendario", "arquétipo Combatente e Destreza ou Força 12",
    "1 vez por dia, como ação bônus, por 3 rodadas: ganha uma ação padrão a mais por turno (só para atacar) e não pode ser Abalado nem Apavorado.",
    { acoes: [A("Avatar da Guerra", { acao: "bonus", uso: "dia", duracao: "3 rodadas", efeito: "Por 3 rodadas: uma ação padrão a mais por turno (só para atacar) e não pode ser Abalado nem Apavorado." })] },
    { frequencia: "dia" }),

  /* ---------- Defesa e Resistência ---------- */
  T("robusto", "Robusto", "defesa", "comum", "Constituição 3",
    `PV máximo +${ROBUSTO_PV_POR_NIVEL} por nível total. Quem pega o talento depois ganha os PV dos níveis anteriores também.`,
    { mods: [{ alvo: "recurso.pv", porNivel: ROBUSTO_PV_POR_NIVEL }] }),
  T("teimoso", "Teimoso", "defesa", "comum", "Constituição 3",
    "1 vez por dia, quando um dano o deixaria com 0 PV, fica com 1 PV.",
    { acoes: [A("Teimoso", { acao: "reacao", uso: "dia", efeito: "Um dano o deixaria com 0 PV: fica com 1 PV." })] }, { frequencia: "dia" }),
  T("esquivo", "Esquivo", "defesa", "comum", "Destreza 4",
    "+2 na Esquiva contra ataques à distância. Contra efeitos de área com teste para metade do dano: se passar, não sofre dano; se falhar, sofre metade.",
    { especial: "esquivo" }),
  T("escudoProtetor", "Escudo Protetor", "defesa", "comum", "proficiência com escudo",
    "Quando um aliado a até 1,5 m for atacado, pode usar o seu Bloqueio no lugar da defesa dele. Gasta a ação do seu próximo turno normalmente.",
    { texto: true }),
  T("muralha", "Muralha", "defesa", "avancado", "Constituição 5 e Escudo Protetor",
    "Enquanto empunha um escudo, aliados a até 1,5 m ganham +1 na CA.",
    { texto: true }),
  T("inabalavel", "Inabalável", "defesa", "avancado", "Constituição 5",
    "Não pode ser empurrado nem ficar Caído contra a vontade. Vantagem nos testes contra Atordoado.",
    { texto: true }),
  T("segundoFolego", "Segundo Fôlego", "defesa", "superior", "Constituição 8",
    "1 vez por combate, como ação bônus, recupera 25% da Vida máxima.",
    { acoes: [A("Segundo Fôlego", { acao: "bonus", uso: "combate", efeito: "Recupera 25% da Vida máxima.", dano: { formula: "floor(@recursos.pv.max / 4)", tipo: "Cura" } })] }, { frequencia: "combate" }),
  T("imortalTeimoso", "Imortal Teimoso", "defesa", "lendario", "Teimoso e Constituição 12",
    "1 vez por semana, quando morrer, volta no início do próximo turno com metade da Vida e sem as condições de Dor e colapso.",
    { acoes: [A("Imortal Teimoso", { uso: "semana", efeito: "Morreu: volta no início do próximo turno com metade da Vida e sem as condições de Dor e colapso." })] }, { frequencia: "semana" }),

  /* ---------- Mobilidade ---------- */
  T("pesLeves", "Pés Leves", "mobilidade", "comum", "Destreza 3",
    "Deslocamento +1,5 m. Terreno difícil não reduz o deslocamento.",
    { mods: [{ alvo: "deslocamento", valor: 1.5 }], especial: "pesLeves" }),
  T("acrobata", "Acrobata", "mobilidade", "comum", "2 pontos em Acrobacia",
    "Levantar-se de Caído não gasta movimento. Vantagem nos testes para escapar de Preso e Enredado.",
    { texto: true }),
  T("escorregadio", "Escorregadio", "mobilidade", "comum", "Destreza 4",
    "Depois de atacar uma criatura, não provoca ataque de oportunidade dela até o fim do turno.",
    { texto: true }),
  T("investida", "Investida", "mobilidade", "avancado", "Força 5",
    "Depois de andar pelo menos 6 m em linha reta, o próximo ataque corpo a corpo no turno ganha +1 nível de dano. O alvo faz Fortitude CD 10 + Força; se falhar, fica Caído.",
    { ataque: { nivelDano: 1, corpo: true, investida: true, rotulo: "Investida: andou 6 m em linha reta, +1 nível de dano e Fortitude (CD 10 + Força) ou Caído" } }),
  T("sombraVeloz", "Sombra Veloz", "mobilidade", "superior", "Destreza 8 e Pés Leves",
    "1 vez por combate, por 3 rodadas, ganha uma ação de movimento a mais por turno.",
    { acoes: [A("Sombra Veloz", { uso: "combate", duracao: "3 rodadas", efeito: "Por 3 rodadas: uma ação de movimento a mais por turno." })] }, { frequencia: "combate" }),

  /* ---------- Magia e Núcleo ---------- */
  T("afinidadeElemental", "Afinidade Elemental", "magia", "comum", "Núcleo 3",
    "Escolhe um tipo de dano mágico. As magias desse tipo causam +2 de dano.",
    { escolha: "elemento", afinidade: 2 }, { repetivel: true }),
  T("sangueMagico", "Sangue Mágico", "magia", "comum", "Núcleo 3 e Constituição 2",
    `Quando não tiver PM suficiente para uma magia, paga o que faltar com Vida (${SANGUE_PV_POR_PM} PV por PM).`,
    { especial: "sangueMagico" }),
  T("conjuradorCombate", "Conjurador de Combate", "magia", "comum", "Núcleo 3",
    "Não sofre penalidade ao lançar magias à distância com inimigos ao lado. Vantagem nos testes de Vontade para manter Concentrado ao sofrer dano.",
    { especial: "conjuradorCombate" }),
  T("sensivelMultiverso", "Sensível ao Multiverso", "magia", "comum", "Núcleo 2",
    "Como ação bônus, percebe magias ativas, portais e fendas entre mundos a até 9 m, e de que natureza são.",
    { texto: true }),
  T("magiaPersistente", "Magia Persistente", "magia", "avancado", "Núcleo 5",
    "1 vez por combate, uma magia com duração dura o dobro.",
    { acoes: [A("Magia Persistente", { uso: "combate", efeito: "Uma magia com duração dura o dobro." })] }, { frequencia: "combate" }),
  T("magiaGemea", "Magia Gêmea", "magia", "superior", "Núcleo 8 e 8 pontos em Arcanismo",
    "1 vez por combate, uma magia de alvo único afeta um segundo alvo, pagando +50% dos PM.",
    { acoes: [A("Magia Gêmea", { uso: "combate", efeito: "Uma magia de alvo único afeta um segundo alvo. Pague +50% dos PM da magia." })] }, { frequencia: "combate" }),
  T("sobrecargaDomada", "Sobrecarga Domada", "magia", "superior", "Núcleo 8 e Canal Estável",
    "1 vez por dia, passa automaticamente no teste de Núcleo da Sobrecarga de Núcleo.",
    { acoes: [A("Sobrecarga Domada", { uso: "dia", efeito: "Passa automaticamente no teste de Núcleo da Sobrecarga de Núcleo (ignore o cartão do teste)." })] }, { frequencia: "dia" }),
  T("arquimago", "Arquimago do Multiverso", "magia", "lendario", "arquétipo Conjurador e Núcleo 12",
    "1 vez por dia, lança uma magia conhecida sem custo de PM e com a CD +2.",
    { acoes: [A("Arquimago do Multiverso", { uso: "dia", efeito: "Lança uma magia conhecida sem custo de PM e com a CD +2 (use a magia escolhendo o Mestre liberar o custo, ou devolva os PM)." })] }, { frequencia: "dia" }),

  /* ---------- Ofício e Criação ---------- */
  T("inventorNato", "Inventor Nato", "oficio", "comum", "Inteligência 3",
    "+2 nos testes de Ofício. Os itens que cria começam com +10 de durabilidade.",
    { mods: [{ alvo: "pericia.oficio", valor: 2 }], especial: "inventorNato" }),
  T("maosFirmes", "Mãos Firmes", "oficio", "comum", "Destreza 3",
    "Dá uma poção ou outro consumível a um aliado a até 1,5 m como ação bônus.",
    { especial: "maosFirmes" }),
  T("alquimistaEficiente", "Alquimista Eficiente", "oficio", "comum", "3 pontos em Ofício",
    "Ao fazer poções ou consumíveis, a cada 3 feitos de uma vez, ganha 1 a mais.",
    { especial: "alquimistaEficiente" }),
  T("engenhocaBolso", "Engenhoca de Bolso", "oficio", "avancado", "Inteligência 5 e Inventor Nato",
    "1 vez por descanso longo, monta na hora um item de Ferramentas comum com o que tiver à mão. Ele quebra no fim da cena.",
    { acoes: [A("Engenhoca de Bolso", { uso: "longo", duracao: "a cena", efeito: "Monta na hora um item de Ferramentas comum com o que tiver à mão. Ele quebra no fim da cena." })] }, { frequencia: "longo" }),
  T("obraPrima", "Obra-Prima", "oficio", "superior", "8 pontos em Ofício",
    "Um item que o personagem criou recebe uma Melhoria a mais. Só um item por vez; trocar de item apaga a Melhoria do anterior.",
    { texto: true }),
  T("forjaMultiverso", "Forja do Multiverso", "oficio", "lendario", "arquétipo Artífice e 12 pontos em Ofício",
    "Pode criar itens de uma raridade acima do que o nível dele permitiria.",
    { acoes: [A("Forja do Multiverso", { acao: "passiva", efeito: "Pode criar itens de uma raridade acima do que o nível permitiria (o Mestre confirma)." })] }),

  /* ---------- Social ---------- */
  T("presencaMarcante", "Presença Marcante", "social", "comum", "Aparência 3",
    "NPCs que acabaram de conhecer o personagem começam com afinidade +1 com ele.",
    { especial: "presencaMarcante" }),
  T("vozComando", "Voz de Comando", "social", "comum", "Carisma 3",
    "Como ação bônus, um aliado a até 9 m que o ouvir pode se mover até metade do deslocamento como reação, sem provocar ataques de oportunidade.",
    { acoes: [A("Voz de Comando", { acao: "bonus", alcance: "9 m", alvo: "1 aliado que o ouça", efeito: "O aliado pode se mover até metade do deslocamento como reação, sem provocar ataques de oportunidade." })] }),
  T("labia", "Lábia", "social", "comum", "Carisma 3",
    "1 vez por cena, rola de novo um teste social que falhou (fica o novo resultado).",
    { acoes: [A("Lábia", { uso: "cena", efeito: "Rola de novo um teste social que falhou (fica o novo resultado)." })] }, { frequencia: "cena" }),
  T("inspirador", "Inspirador", "social", "avancado", "Carisma 5 e 3 pontos em Liderança",
    "1 vez por combate, como ação bônus, um aliado que consiga ouvi-lo rola de novo um teste que falhou.",
    { acoes: [A("Inspirador", { acao: "bonus", uso: "combate", alvo: "1 aliado que o ouça", efeito: "O aliado rola de novo um teste que falhou." })] }, { frequencia: "combate" }),
  T("lendaViva", "Lenda Viva", "social", "superior", "Carisma 8",
    "NPCs que conhecem a fama do personagem começam com afinidade +2 e ele tem vantagem nos testes sociais com eles. A fama vale para o bem e para o mal: inimigos também o reconhecem.",
    { especial: "lendaViva" }),

  /* ---------- Sentidos e Exploração ---------- */
  T("olhosAguia", "Olhos de Águia", "sentidos", "comum", "2 pontos em Percepção",
    "+2 em Percepção e enxerga detalhes ao dobro da distância normal.",
    { mods: [{ alvo: "pericia.percepcao", valor: 2 }] }),
  T("alerta", "Alerta", "sentidos", "comum", "Autocontrole 3",
    "Não fica Surpreendido enquanto estiver consciente e ganha +3 na iniciativa.",
    { mods: [{ alvo: "iniciativa", valor: 3 }], imune: ["Surpreendido"] }),
  T("sortudo", "Sortudo", "sentidos", "comum", "—",
    `${SORTE_POR_DIA} pontos de Sorte por dia. Gasta 1 para rolar de novo qualquer d20 seu (fica o resultado que quiser).`,
    { especial: "sortudo" }, { frequencia: "dia" }),
  T("viajanteMundos", "Viajante dos Mundos", "sentidos", "comum", "Inteligência 2",
    "Depois de 1 hora ouvindo um idioma, entende o básico dele. Vantagem para se orientar num mundo ou plano novo.",
    { texto: true }),
  T("cacadorTesouros", "Caçador de Tesouros", "sentidos", "avancado", "4 pontos em Investigação",
    "Encontra passagens secretas e compartimentos escondidos só por passar perto (o Mestre rola em segredo com vantagem).",
    { texto: true }),

  /* ---------- Mente e Alma ---------- */
  T("forcaVontade", "Força de Vontade", "mente", "comum", "Autocontrole 2",
    "PS máximo +10.",
    { mods: [{ alvo: "recurso.ps", valor: 10 }] }),
  T("tatico", "Tático", "mente", "comum", "Inteligência 4",
    "Usa a Inteligência no lugar da Destreza na iniciativa.",
    { especial: "tatico" }),
  T("almaResiliente", "Alma Resiliente", "mente", "avancado", "Autocontrole 5",
    "1 vez por dia, quando rolar na tabela do Insano, rola de novo e escolhe o resultado.",
    { acoes: [A("Alma Resiliente", { uso: "dia", efeito: "Rolou na tabela do Insano: rola de novo e escolhe o resultado." })] }, { frequencia: "dia" }),
  T("vontadeFerro", "Vontade de Ferro", "mente", "superior", "Autocontrole 8 e Mente Blindada",
    "Imune a Dominado.",
    { imune: ["Dominado"] }),
  T("escolhidoMultiverso", "Escolhido do Multiverso", "mente", "lendario", "—",
    "1 vez por sessão, depois de ver a rolagem, transforma um d20 seu ou de um aliado que consiga ver num 20 natural. A margem de ameaça continua não garantindo o acerto: o 20 é o resultado do dado, não um acerto automático.",
    { especial: "escolhido", acoes: [A("Escolhido do Multiverso", { uso: "sessao", efeito: "Depois de ver a rolagem, um d20 seu ou de um aliado que consiga ver vira 20 natural (botão \"Tornar 20 natural\" no cartão). Não garante o acerto." })] },
    { frequencia: "sessao" })
];

/* ---------- Requisitos estruturados ---------- */
const nomesTreino = new Map(TREINAMENTOS_LISTA.map(e => [normTreino(e.nome), `treino:${e.id}`]));
const nomesTalento = new Map(LISTA.map(e => [normTreino(e.nome), `talento:${e.id}`]));
const ARQ_POR_NOME = { combatente: "combatente", conjurador: "conjurador", artifice: "artifice" };

/** { atributos, pericias, treinos, talentos, arquetipo, escudo, itens } */
export function lerRequisitosTalento(texto) {
  const r = lerRequisitos(texto, new Map([...nomesTreino, ...nomesTalento]));
  const out = { atributos: r.atributos, pericias: r.pericias, treinos: [], talentos: [], arquetipo: "", escudo: false, itens: [] };
  for (const x of r.treinos) {
    const [tipo, id] = String(x).split(":");
    (tipo === "talento" ? out.talentos : out.treinos).push(id);
  }
  for (const i of r.itens) {
    const n = normTreino(i);
    const m = n.match(/^arquetipo (\w+)$/);
    if (m && ARQ_POR_NOME[m[1]]) { out.arquetipo = ARQ_POR_NOME[m[1]]; continue; }
    if (/proficiencia com escudo/.test(n)) { out.escudo = true; continue; }
    out.itens.push(i);
  }
  return out;
}

export const TALENTOS_LISTA = LISTA.map(e => ({ ...e, repetivel: !!e.repetivel, req: lerRequisitosTalento(e.requisitos) }));
for (const e of TALENTOS_LISTA) e.libera = TALENTOS_LISTA.filter(x => x.req.talentos.includes(e.id)).map(x => x.id);

const PorId = new Map(TALENTOS_LISTA.map(e => [e.id, e]));
export const talentoModelo = id => PorId.get(id) ?? null;
export const talentoPorNome = nome => talentoModelo(nomesTalento.get(normTreino(nome))?.split(":")[1]);
/** Modelo de um talento da ficha (pelo id do modelo ou pelo nome). */
export const modeloDoTalento = t => talentoModelo(t?.modelo) ?? talentoPorNome(t?.nome);

/** Cadeia de pré-requisitos (talentos) até ele: ["teimoso", "imortalTeimoso"]. */
export function cadeiaTalento(id, visto = new Set()) {
  const e = talentoModelo(id);
  if (!e || visto.has(id)) return [];
  visto.add(id);
  return [...new Set([...e.req.talentos.flatMap(t => cadeiaTalento(t, visto)), id])];
}

const ARQ_LABEL = { combatente: "Combatente", conjurador: "Conjurador", artifice: "Artífice" };
const nomeTreino = id => TREINAMENTOS_LISTA.find(e => e.id === id)?.nome ?? id;

export function textoRequisitosTalento(e) {
  const r = e.req;
  const partes = [
    ...(r.arquetipo ? [`arquétipo ${ARQ_LABEL[r.arquetipo]}`] : []),
    ...r.atributos.map(a => `${a.ids.map(i => ATRS[i]).join(" ou ")} ${a.min}`),
    ...r.pericias.map(p => `${p.min} pontos em ${p.ids.map(i => PERICIAS_REQ[i]).join(" ou ")}`),
    ...r.talentos.map(t => talentoModelo(t)?.nome ?? t),
    ...r.treinos.map(t => `treino ${nomeTreino(t)}`),
    ...(r.escudo ? ["proficiência com escudo"] : []),
    ...r.itens
  ];
  return partes.join(", ") || "—";
}

/** Quantos talentos o nível dá. */
export function talentosDoNivel(nivelTotal) {
  const n = Math.max(0, Math.floor(Number(nivelTotal) || 0));
  if (n < 1) return 0;
  return TALENTO_INICIAL + Math.floor(Math.min(n, 100) / TALENTO_A_CADA);
}

/** Faixas liberadas pelo nível total. */
export const faixaLiberada = (faixa, nivelTotal) => (Number(nivelTotal) || 0) >= (FAIXAS_TALENTO[faixa]?.nivel ?? 1);

/**
 * Confere os requisitos com a ficha.
 * base: { nivelTotal, arquetipos: Set, talentos: Set (ids), treinosConcluidos: Set (ids), escudo: bool|null }
 */
export function cumpreTalento(e, ficha, base = {}) {
  const out = { cumpridos: [], faltas: [], manuais: [] };
  const r = e?.req;
  if (!r) return { ...out, ok: true };
  const nivel = Number(base.nivelTotal) || 0;
  const fx = FAIXAS_TALENTO[e.faixa];
  if (fx) (nivel >= fx.nivel ? out.cumpridos : out.faltas).push(nivel >= fx.nivel ? `nível ${nivel}` : `nível total ${fx.nivel} (tem ${nivel})`);
  if (r.arquetipo) {
    const tem = base.arquetipos?.has?.(r.arquetipo);
    (tem ? out.cumpridos : out.faltas).push(tem ? `arquétipo ${ARQ_LABEL[r.arquetipo]}` : `arquétipo ${ARQ_LABEL[r.arquetipo]}`);
  }
  for (const a of r.atributos) {
    const vals = a.ids.map(i => ({ i, v: Number(ficha?.atributos?.[i]?.total) || 0 }));
    const bom = vals.find(x => x.v >= a.min);
    (bom ? out.cumpridos : out.faltas).push(bom ? `${ATRS[bom.i]} ${bom.v}` : `${a.ids.map(i => ATRS[i]).join(" ou ")} ${a.min} (tem ${vals.map(x => x.v).join("/")})`);
  }
  for (const p of r.pericias) {
    const vals = p.ids.map(i => ({ i, v: Number(ficha?.periciaPorId?.[i]?.pontos) || 0 }));
    const bom = vals.find(x => x.v >= p.min);
    (bom ? out.cumpridos : out.faltas).push(bom ? `${PERICIAS_REQ[bom.i]} ${bom.v} pontos` : `${p.min} pontos em ${p.ids.map(i => PERICIAS_REQ[i]).join(" ou ")} (tem ${vals.map(x => x.v).join("/")})`);
  }
  for (const t of r.talentos) {
    const nome = talentoModelo(t)?.nome ?? t;
    (base.talentos?.has?.(t) ? out.cumpridos : out.faltas).push(base.talentos?.has?.(t) ? nome : `talento ${nome}`);
  }
  for (const t of r.treinos) {
    const nome = nomeTreino(t);
    (base.treinosConcluidos?.has?.(t) ? out.cumpridos : out.faltas).push(base.treinosConcluidos?.has?.(t) ? nome : `concluir o treino ${nome}`);
  }
  if (r.escudo) {
    if (base.escudo === true) out.cumpridos.push("escudo");
    else out.manuais.push("proficiência com escudo");
  }
  out.manuais.push(...r.itens);
  return { ...out, ok: !out.faltas.length };
}

/** Talentos ativos de uma ficha (dados = flags epm-ficha): [{ id, t, modelo }]. */
export function talentosAtivos(dados = {}) {
  return Object.entries(dados?.talentos ?? {})
    .filter(([, t]) => t && !t.inativo)
    .map(([id, t]) => ({ id, t, modelo: modeloDoTalento(t) }));
}

/** A ficha tem o talento (pelo modelo)? */
export const temTalento = (dados, modeloId) => talentosAtivos(dados).some(x => x.modelo?.id === modeloId);

/** Situação dos talentos: usados, disponíveis, Lendários e avisos (não bloqueiam). */
export function situacaoTalentos(dados = {}, nivelTotal = 1) {
  const ativos = talentosAtivos(dados);
  const extras = Math.max(0, Math.floor(Number(dados?.talentosExtras) || 0));
  const doNivel = talentosDoNivel(nivelTotal);
  const disponiveis = doNivel + extras;
  const usados = ativos.length;
  const lendarios = ativos.filter(x => (x.t.faixa || x.modelo?.faixa) === "lendario").length;
  const avisos = [];
  if (usados > disponiveis) avisos.push(`${usados} talentos e o nível ${nivelTotal} dá ${disponiveis} (${doNivel} do nível${extras ? ` + ${extras} extras` : ""}).`);
  if (lendarios > MAX_LENDARIOS) avisos.push(`${lendarios} talentos Lendários: o máximo é ${MAX_LENDARIOS}.`);
  for (const x of ativos) {
    const fx = x.t.faixa || x.modelo?.faixa;
    if (fx && !faixaLiberada(fx, nivelTotal)) avisos.push(`${x.t.nome || x.modelo?.nome}: faixa ${FAIXAS_TALENTO[fx].label} pede nível total ${FAIXAS_TALENTO[fx].nivel}.`);
  }
  const contagem = new Map();
  for (const x of ativos) if (x.modelo && !x.modelo.repetivel) contagem.set(x.modelo.id, (contagem.get(x.modelo.id) ?? 0) + 1);
  for (const [id, q] of contagem) if (q > 1) avisos.push(`${talentoModelo(id).nome} está ${q} vezes (não é repetível).`);
  return { usados, disponiveis, doNivel, extras, lendarios, avisos, livres: Math.max(0, disponiveis - usados) };
}
