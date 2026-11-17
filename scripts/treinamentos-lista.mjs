/**
 * Catálogo de treinamentos (fonte: doc do Projeto EPM/treinamentos.md, revisado em 16 e 17/11/2026).
 * Só dados e funções puras (sem Foundry).
 *
 * Cada entrada: id, nome, categoria, horas (1 dia = 8 h, 1 semana = 56 h, 1 mês = 240 h), pt, requisitos (texto e
 * estruturado: atributos com "ou", pontos em perícias, treinamentos concluídos, itens), treinador (+ tipo), repetível,
 * benefícios e automação (`auto`):
 *   mods      [{ alvo, valor }]   números fixos que valem ao concluir (deslocamento, Esquiva, iniciativa…)
 *   especial  id                  efeito calculado pela ficha (RD = Constituição, Núcleo no dano, margem da favorita…)
 *   acoes     [forma]             viram uma habilidade (origem Treinamento) com formas, custo e frequência
 *   concluir  "poliglota" | "protagonista"   o que acontece na hora de concluir
 *   texto     true                depende do Mestre ou da cena: fica como texto no cartão
 */

export const HORAS_DIA = 8;
export const HORAS_SEMANA = 56;
export const HORAS_MES = 240;

export const CATEGORIAS_TREINOS = [
  { id: "fisicos", label: "Físicos", icone: "fa-solid fa-person-running", dica: "Melhoram o corpo: deslocamento, defesa, mobilidade e fôlego." },
  { id: "arma", label: "De Arma", icone: "fa-solid fa-khanda", dica: "Mudam como o personagem usa as armas." },
  { id: "aura", label: "De Aura", icone: "fa-solid fa-sun", dica: "Usam o Núcleo (Aura) como força física. Funcionam em cadeia, a partir da Aura Iniciante." },
  { id: "magias", label: "De Magias", icone: "fa-solid fa-hat-wizard", dica: "Melhoram a conjuração." },
  { id: "extras", label: "Extras", icone: "fa-solid fa-dice", dica: "Treinamentos sociais, narrativos e de cotidiano." },
  { id: "oficio", label: "Ofício e Sobrevivência", icone: "fa-solid fa-hammer", dica: "Ligada à Criação de itens, à Durabilidade e às viagens." },
  { id: "mente", label: "Mente e Sanidade", icone: "fa-solid fa-brain", dica: "Protegem contra medo, controle mental e perda de Sanidade (PS)." },
  { id: "furtividade", label: "Furtividade e Infiltração", icone: "fa-solid fa-user-ninja", dica: "Para quem prefere não ser visto." },
  { id: "outros", label: "Outros modelos", icone: "fa-solid fa-dumbbell", dica: "Modelos da ficha que não estão no doc (adaptação tecnológica)." }
];

/** Regras da página "Criação de Treinamento" (aparecem no topo do catálogo). */
export const REGRAS_TREINO = [
  "Uma ação de Treinamento ou Estudo dá 5 PT e leva 6 horas. Conversar ou ter um tutor dá de 1 a 3 PT.",
  "Custo de 1 a 20 PT (o Mestre pode passar disso). Tempo de 6 horas a 1 mês, com 8 h de treino por dia. Os PT são pagos ao começar.",
  "Régua: 2–3 PT bônus pequeno; 5 PT vantagem clara; 10 PT atributo no dano/RD ou efeito com recurso; 15 PT bônus para o grupo; 20+ lendário.",
  "Aura = Núcleo. Liderança é uma perícia de Carisma ou Inteligência. Todos respeitam o Teto de Bônus (+5 / +8 / +12 / +15)."
];

const T = (id, nome, categoria, tempo, pt, requisitos, treinador, beneficios, auto = {}, extra = {}) =>
  ({ id, nome, categoria, tempo, pt, requisitos, treinador, beneficios, auto, ...extra });

/* Formas das ações (viram habilidade ao concluir). nd = DT do teste do alvo. */
const A = (nome, campos) => ({ nome, acao: "padrao", custo: { recurso: "nenhum", valor: 0 }, uso: "livre", alcance: "", area: "", alvo: "", duracao: "", teste: { tipo: "nenhum", pericia: "", nd: "" }, dano: { formula: "", tipo: "" }, efeito: "", ...campos });
const DT_NUCLEO = "10 + @atr.nucleo";

const LISTA = [
  /* ---------- Físicos ---------- */
  T("corredor", "Corredor", "fisicos", "48 h", 5, "Destreza 4", "✗", "Deslocamento +3 m e a ação Disparada como ação bônus.", { mods: [{ alvo: "deslocamento", valor: 3 }], especial: "corredor" }),
  T("velocista", "Velocista", "fisicos", "48 h", 10, "Destreza 6 e Corredor", "✓", "Deslocamento +3 m (além do Corredor), e a Disparada não provoca ataques de oportunidade.", { mods: [{ alvo: "deslocamento", valor: 3 }], especial: "velocista" }),
  T("musculosAco", "Músculos de Aço", "fisicos", "36 h", 5, "Força ou Constituição 4", "✗", "A CA passa a usar Força ou Constituição no lugar da Destreza.", { especial: "musculosAco" }),
  T("saltoAtletico", "Salto Atlético", "fisicos", "12 h", 2, "Força 3", "✗", "A distância e a altura dos saltos dobram, e o personagem salta parado como se tivesse corrido.", { especial: "saltoAtletico" }),
  T("quedaControlada", "Queda Controlada", "fisicos", "12 h", 2, "Destreza 3", "✗", "Reduz o dano de queda em 5 × Destreza e não fica Caído em quedas de até 9 m.", { especial: "quedaControlada" }),
  T("escalador", "Escalador", "fisicos", "24 h", 3, "Força ou Destreza 3", "✗", "Deslocamento de escalada igual ao deslocamento normal; não fica Desprevenido enquanto escala.", { especial: "escalador" }),
  T("nadador", "Nadador", "fisicos", "24 h", 3, "Força ou Constituição 3", "✗", "Deslocamento de natação igual ao deslocamento normal; segura o fôlego por Constituição × 2 minutos (mínimo 2).", { especial: "nadador" }),
  T("resistenciaClima", "Resistência ao Clima", "fisicos", "24 h", 3, "Constituição 3", "✗", "Vantagem nos testes contra o calor e o frio do ambiente.", { especial: "resistenciaClima" }),
  T("marchaForcada", "Marcha Forçada", "fisicos", "3 dias", 3, "Constituição 3", "✗", "Viaja até 4 horas a mais por dia sem ganhar Exaustão.", { especial: "marchaForcada" }),
  T("reflexosTreinados", "Reflexos Treinados", "fisicos", "36 h", 5, "Destreza 4", "✗", "+2 na Esquiva e +2 na iniciativa.", { mods: [{ alvo: "defesa.esquiva", valor: 2 }, { alvo: "iniciativa", valor: 2 }] }),
  T("folegoBatalha", "Fôlego de Batalha", "fisicos", "36 h", 5, "Constituição 4", "✗", "1 vez por combate, como ação bônus, recupera 2 × Constituição de PE.", {
    acoes: [A("Fôlego de Batalha", { acao: "bonus", uso: "combate", efeito: "Recupera [[/r 2 * @atr.constituicao]] de Estamina (2 × Constituição)." })]
  }),
  T("peleCalejada", "Pele Calejada", "fisicos", "36 h", 5, "Constituição 4", "✗", "RD 2 contra dano físico.", { especial: "peleCalejada" }),
  T("peleDePedra", "Pele de Pedra", "fisicos", "48 h", 10, "Constituição 6 e Pele Calejada", "✓", "A RD contra dano físico passa a ser igual à Constituição (substitui a RD 2 da Pele Calejada).", { especial: "peleDePedra" }),
  T("flashStep", "Flash Step", "fisicos", "1 mês", 100, "Destreza ou Força 12, Núcleo 8", "✓",
    "O personagem se move tão rápido que some e reaparece. Custa 10 PE e pode ser usado 1 vez por turno. Como ação bônus: teleporta até 18 m para um ponto que consiga ver, +3 m para cada ponto de Núcleo acima de 8; não provoca ataques de oportunidade e atravessa criaturas no caminho. Como reação, quando for alvo de um ataque, antes da rolagem: faz o mesmo movimento; se sair do alcance ou da linha de visão do atacante, o ataque erra (não conta como Esquiva e não gasta ação do próximo turno). Golpe relâmpago: o primeiro ataque depois de um Flash Step, no mesmo turno ou no seguinte, ganha +1 nível de dano, e o alvo fica Desprevenido contra esse ataque.", {
      acoes: [
        A("Teleporte", { acao: "bonus", custo: { recurso: "pe", valor: 10 }, uso: "turno", alcance: "18 m + 3 m por ponto de Núcleo acima de 8", efeito: "Teleporta até [[/r 18 + 3 * max(0, @atr.nucleo - 8)]] m para um ponto que consiga ver. Não provoca ataques de oportunidade e atravessa criaturas. Golpe relâmpago: o primeiro ataque depois disso, neste turno ou no seguinte, ganha +1 nível de dano e o alvo fica Desprevenido contra ele." }),
        A("Esquivar sumindo", { acao: "reacao", custo: { recurso: "pe", valor: 10 }, uso: "turno", efeito: "Quando for alvo de um ataque, antes da rolagem: faz o mesmo movimento do Teleporte. Se sair do alcance ou da linha de visão do atacante, o ataque erra. Não conta como Esquiva e não gasta ação do próximo turno." })
      ]
    }),

  /* ---------- De Arma ---------- */
  T("sintonizacao", "Sintonização com Arma", "arma", "48 h", 3, "Núcleo 3 e proficiência com a arma", "✗", "A arma vira extensão do corpo. Habilidades e efeitos que exigem ataque desarmado funcionam com ela.", { especial: "sintonizacao" }),
  T("miraRapida", "Mira Rápida", "arma", "24 h", 5, "proficiência com armas à distância", "✗", "A ação de Mira pode ser feita como ação bônus.", { especial: "miraRapida" }),
  T("versatilidade", "Versatilidade Armada", "arma", "36 h", 5, "proficiência com armas corpo a corpo e Destreza ou Força 4", "✗", "Com armas de dois tipos de dano, usa sempre o maior, e pode usar o maior atributo mesmo que a arma diga outro.", { especial: "versatilidade" }),
  T("saqueRapido", "Saque Rápido", "arma", "12 h", 2, "Destreza 3", "✗", "1 vez por turno, saca, guarda ou troca de arma sem gastar ação.", { especial: "saqueRapido" }),
  T("armasImprovisadas", "Armas Improvisadas", "arma", "12 h", 2, "—", "✗", "Proficiência com armas improvisadas (cadeira, garrafa, cano…), que causam 1d6 + atributo de dano.", { especial: "armasImprovisadas" }),
  T("recargaVeloz", "Recarga Veloz", "arma", "12 h", 2, "proficiência com armas de fogo ou bestas", "✗", "1 vez por turno, recarrega uma arma de fogo ou besta sem gastar ação.", { especial: "recargaVeloz" }),
  T("arremessador", "Arremessador", "arma", "24 h", 3, "Força ou Destreza 3", "✗", "Armas leves corpo a corpo podem ser arremessadas (alcance 6/18 m), usando Luta ou Pontaria.", { especial: "arremessador" }),
  T("guardaFirme", "Guarda Firme", "arma", "24 h", 5, "proficiência com escudo e Constituição 3", "✗", "+2 no Bloqueio com escudo. 1 vez por combate, o Bloqueio não gasta a ação do próximo turno.", {
    especial: "guardaFirme",
    acoes: [A("Guarda Firme", { acao: "reacao", uso: "combate", efeito: "Este Bloqueio não gasta a ação do próximo turno." })]
  }),
  T("desarmar", "Desarmar", "arma", "24 h", 5, "3 pontos em Luta", "✗", "Ao acertar um ataque corpo a corpo, pode trocar o dano por um teste de Luta contra Luta ou Fortitude do alvo (ele escolhe). Se vencer, a arma do alvo cai a 3 m.", {
    acoes: [A("Desarmar", { acao: "livre", teste: { tipo: "pericia", pericia: "luta", nd: "" }, efeito: "Depois de acertar um ataque corpo a corpo, troca o dano por este teste de Luta contra Luta ou Fortitude do alvo (ele escolhe). Se vencer, a arma do alvo cai a 3 m." })]
  }),
  T("derrubar", "Derrubar", "arma", "24 h", 5, "Força 4", "✗", "Ao acertar um ataque corpo a corpo, pode trocar o dano por um teste de Luta contra Acrobacia ou Fortitude do alvo (ele escolhe). Se vencer, o alvo fica Caído. Só funciona em alvos de até um tamanho maior.", {
    acoes: [A("Derrubar", { acao: "livre", teste: { tipo: "pericia", pericia: "luta", nd: "" }, efeito: "Depois de acertar um ataque corpo a corpo, troca o dano por este teste de Luta contra Acrobacia ou Fortitude do alvo (ele escolhe). Se vencer, o alvo fica Caído. Só em alvos de até um tamanho maior." })]
  }),
  T("tiroCerteiro", "Tiro Certeiro", "arma", "36 h", 5, "proficiência com armas à distância e 4 pontos em Pontaria", "✗", "Ignora a penalidade de acerto por distância no alcance longo.", { especial: "tiroCerteiro" }),
  T("duasArmas", "Combate com Duas Armas", "arma", "36 h", 5, "proficiência com armas corpo a corpo e Destreza 4", "✗", "Depois de atacar com a arma principal, pode atacar com uma arma leve na outra mão como ação bônus. O dano desse ataque não soma atributo.", { especial: "duasArmas" }),
  T("dominioFavorita", "Domínio da Favorita", "arma", "48 h", 10, "5 pontos em Luta ou Pontaria e ter uma arma favorita", "✓", "A margem de ameaça da arma favorita cai 1 (ex.: 20 → 19). A margem de ameaça continua não garantindo o acerto.", { especial: "dominioFavorita" }),
  T("disparoDuplo", "Disparo Duplo", "arma", "48 h", 10, "5 pontos em Pontaria e Mira Rápida", "✓", "1 vez por turno, num ataque à distância, dispara duas vezes. Cada disparo tem −3 no acerto e gasta 1 munição.", {
    acoes: [A("Disparo Duplo", { acao: "livre", uso: "turno", efeito: "Neste ataque à distância, dispara duas vezes: cada disparo tem −3 no acerto e gasta 1 munição." })]
  }),
  T("estudoExotica", "Estudo de Arma Exótica", "arma", "5 dias", 10, "ter a arma Exótica", "✓ (alguém da região de origem da arma)", "Reduz em 2 os pontos de Luta ou Pontaria exigidos para liberar a Maestria dessa arma.", { especial: "estudoExotica" }, { repetivel: true }),
  T("trocarFavorita", "Trocar arma favorita", "arma", "1 semana", 10, "ter uma arma favorita", "✗", "Troca a arma favorita por outra (1 semana de treino, 8 h por dia). Ao concluir, a ficha troca sozinha e avisa no chat.", { especial: "trocarFavorita" }, { repetivel: true }),

  /* ---------- De Aura ---------- */
  T("auraIniciante", "Aura Iniciante", "aura", "12 h", 2, "—", "✗", "Soma o Núcleo nos ataques corpo a corpo desarmados.", { especial: "auraIniciante" }),
  T("auraDeslocamento", "Aura de Deslocamento", "aura", "24 h", 5, "Núcleo 3, Destreza 3 e Aura Iniciante", "✗", "Move 9 m com a ação bônus, +3 m para cada ponto de Núcleo acima de 3.", { especial: "auraDeslocamento" }),
  T("auraDeslocamentoSuperior", "Aura de Deslocamento Superior", "aura", "24 h", 5, "Núcleo 3, Destreza 3 e Aura de Deslocamento", "✗", "O movimento da Aura de Deslocamento aumenta em 9 m.", { especial: "auraDeslocamentoSuperior" }),
  T("pesAura", "Pés de Aura", "aura", "24 h", 5, "Núcleo 4 e Aura de Deslocamento", "✗", "Durante o movimento da Aura de Deslocamento, corre sobre água e paredes verticais. Se terminar o movimento num lugar desses, cai ou afunda.", { especial: "pesAura" }),
  T("auraProtecao", "Aura de Proteção", "aura", "24 h", 5, "Núcleo 3, Constituição 3 e Aura Iniciante", "✗", "Recebe 2 × Núcleo de RD ou soma o Núcleo na CA.", { especial: "auraProtecao" }),
  T("auraProtecaoSuperior", "Aura de Proteção Superior", "aura", "24 h", 10, "Núcleo 5 e Aura de Proteção", "✗", "Os dois benefícios da Aura de Proteção valem ao mesmo tempo.", { especial: "auraProtecaoSuperior" }),
  T("fortalecimentoMental", "Fortalecimento Mental por Aura", "aura", "20 h", 3, "Núcleo 3, Autocontrole 3 e Aura Iniciante", "✗", "Soma o Núcleo nos testes de resistência de Autocontrole.", { especial: "fortalecimentoMental" }),
  T("auraIntimidadora", "Aura Intimidadora", "aura", "20 h", 3, "Núcleo 3, Carisma 2 e Aura Iniciante", "✗", "Ação bônus, 3 PM. Um alvo a até 9 m faz Vontade CD 10 + Núcleo. Se falhar, fica Abalado até o fim do próximo turno dele.", {
    acoes: [A("Aura Intimidadora", { acao: "bonus", custo: { recurso: "pm", valor: 3 }, alcance: "9 m", alvo: "1 criatura", teste: { tipo: "resistencia", pericia: "vontade", nd: DT_NUCLEO }, efeito: "Se falhar na Vontade, fica Abalado até o fim do próximo turno dele." })]
  }),
  T("sentirAura", "Sentir Aura", "aura", "20 h", 3, "Núcleo 3 e Aura Iniciante", "✗", "Como ação bônus, por 1 minuto, percebe criaturas com Núcleo num raio de 3 m × Núcleo, mesmo Invisíveis ou atrás de paredes finas.", {
    acoes: [A("Sentir Aura", { acao: "bonus", duracao: "1 minuto", area: "raio de 3 m × Núcleo", efeito: "Percebe criaturas com Núcleo num raio de [[/r 3 * @atr.nucleo]] m, mesmo Invisíveis ou atrás de paredes finas." })]
  }),
  T("ocultarAura", "Ocultar Aura", "aura", "20 h", 3, "Autocontrole 3 e Sentir Aura", "✗", "Some para quem sente aura e soma o Núcleo em Furtividade contra essas criaturas.", { especial: "ocultarAura" }),
  T("auraCortante", "Aura Cortante", "aura", "24 h", 5, "Núcleo 3 e Aura Iniciante", "✗", "O bônus da Aura Iniciante vale também com armas corpo a corpo.", { especial: "auraCortante" }),
  T("auraRecuperacao", "Aura de Recuperação", "aura", "24 h", 5, "Núcleo 4, Constituição 3 e Aura Iniciante", "✗", "No descanso curto, recupera Núcleo de PV e Núcleo de PE a mais.", { especial: "auraRecuperacao" }),
  T("punhoAura", "Punho de Aura", "aura", "36 h", 10, "Núcleo 5 e Aura Iniciante", "✓", "Com 3 PM, faz um ataque desarmado à distância (até 9 m) usando Luta, com o bônus da Aura Iniciante.", {
    acoes: [A("Punho de Aura", { acao: "padrao", custo: { recurso: "pm", valor: 3 }, alcance: "9 m", alvo: "1 criatura", teste: { tipo: "ataque", pericia: "luta", nd: "" }, dano: { formula: "@atr.nucleo", tipo: "" }, efeito: "Ataque desarmado à distância usando Luta, com o bônus da Aura Iniciante (Núcleo) no dano, além do dano desarmado normal." })]
  }),
  T("explosaoAura", "Explosão de Aura", "aura", "36 h", 10, "Núcleo 5 e Aura Iniciante", "✓", "Ação padrão, 10 PM. Criaturas a até 3 m fazem Fortitude CD 10 + Núcleo. Se falhar, sofre 2d6 + Núcleo de dano (tipo da aura do personagem) e é empurrada 3 m. Se passar, sofre metade e não é empurrada.", {
    acoes: [A("Explosão de Aura", { acao: "padrao", custo: { recurso: "pm", valor: 10 }, area: "3 m ao redor", alvo: "criaturas na área", teste: { tipo: "resistencia", pericia: "fortitude", nd: DT_NUCLEO }, dano: { formula: "2d6 + @atr.nucleo", tipo: "" }, efeito: "Quem falhar sofre o dano (tipo da aura do personagem) e é empurrado 3 m. Quem passar sofre metade e não é empurrado." })]
  }),
  T("seloAura", "Selo de Aura", "aura", "48 h", 10, "Núcleo 6 e Sentir Aura", "✓", "1 vez por combate, ao acertar um ataque desarmado, gasta 10 PM. O alvo faz Vontade CD 10 + Núcleo. Se falhar, fica com Núcleo Selado até o fim do próximo turno dele.", {
    acoes: [A("Selo de Aura", { acao: "livre", custo: { recurso: "pm", valor: 10 }, uso: "combate", alvo: "a criatura atingida", teste: { tipo: "resistencia", pericia: "vontade", nd: DT_NUCLEO }, efeito: "Depois de acertar um ataque desarmado. Se falhar na Vontade, o alvo fica com Núcleo Selado até o fim do próximo turno dele." })]
  }),
  T("auraCompartilhada", "Aura Compartilhada", "aura", "48 h", 15, "Núcleo 6, Carisma 3 e Aura de Proteção", "✓", "Ação bônus, 5 PM. Um aliado a até 3 m recebe metade do benefício da sua Aura de Proteção até o seu próximo turno.", {
    acoes: [A("Aura Compartilhada", { acao: "bonus", custo: { recurso: "pm", valor: 5 }, alcance: "3 m", alvo: "1 aliado", duracao: "até o seu próximo turno", efeito: "O aliado recebe metade do benefício da sua Aura de Proteção (RD [[/r @atr.nucleo]] ou CA +[[/r floor(@atr.nucleo / 2)]])." })]
  }),

  /* ---------- De Magias ---------- */
  T("magiaPotente", "Magia Potente", "magias", "48 h", 10, "Núcleo 6 e Inteligência 5", "✗", "Soma a Inteligência no dano ou na cura das magias. Se a magia já soma Inteligência, soma de novo (Inteligência × 2).", { especial: "magiaPotente" }),
  T("ritualista", "Ritualista", "magias", "3 dias", 3, "Inteligência 3", "✗", "Fora de combate, lança uma magia como ritual: leva 10 minutos a mais e custa metade dos PM (arredondado para cima).", { especial: "ritualista" }),
  T("leitorMagia", "Leitor de Magia", "magias", "20 h", 3, "Inteligência 3", "✗", "Como reação, teste de Arcanismo (CD da magia) para identificar uma magia que está sendo lançada. Se passar, ganha +2 nos testes para resistir a ela.", {
    acoes: [A("Leitor de Magia", { acao: "reacao", teste: { tipo: "pericia", pericia: "arcanismo", nd: "" }, efeito: "Contra a CD da magia que está sendo lançada. Se passar, identifica a magia e ganha +2 nos testes para resistir a ela." })]
  }),
  T("menteConcentrada", "Mente Concentrada", "magias", "24 h", 5, "Autocontrole 3", "✗", "+3 nos testes de Vontade para manter Concentrado.", { especial: "menteConcentrada" }),
  T("alcanceAmpliado", "Alcance Ampliado", "magias", "24 h", 5, "Núcleo 4", "✗", "Magias com alcance de 9 m ou mais ganham +50% de alcance.", { especial: "alcanceAmpliado" }),
  T("reservaMana", "Reserva de Mana", "magias", "36 h", 5, "Núcleo 4", "✗", "PM máximo aumenta em Núcleo.", { especial: "reservaMana" }),
  T("canalEstavel", "Canal Estável", "magias", "36 h", 5, "Núcleo 5", "✗", "O teste de Núcleo DT 15 da Sobrecarga de Núcleo é feito com vantagem.", { especial: "canalEstavel" }),
  T("conjuracaoSutil", "Conjuração Sutil", "magias", "36 h", 5, "Núcleo 4 e Destreza 3", "✗", "Escolhe 2 magias conhecidas; cada uma perde o componente verbal ou o gestual.", { especial: "conjuracaoSutil" }, { repetivel: true }),
  T("magiaAmpliada", "Magia Ampliada", "magias", "36 h", 5, "Núcleo 5", "✗", "1 vez por combate, uma magia de área tem a área aumentada em 3 m.", {
    acoes: [A("Magia Ampliada", { acao: "livre", uso: "combate", efeito: "A próxima magia de área tem a área aumentada em 3 m." })]
  }),
  T("economiaArcana", "Economia Arcana", "magias", "48 h", 10, "Inteligência 5 e 5 pontos em Arcanismo", "✓", "1 vez por turno, reduz em 2 o custo de PM de uma magia (mínimo 1).", {
    acoes: [A("Economia Arcana", { acao: "livre", uso: "turno", efeito: "A próxima magia deste turno custa 2 PM a menos (mínimo 1). Use antes de lançar." })]
  }),
  T("conjuracaoRapida", "Conjuração Rápida", "magias", "48 h", 10, "Núcleo 6", "✓", "1 vez por combate, lança como ação bônus uma magia de ação padrão, pagando +5 PM.", {
    acoes: [A("Conjuração Rápida", { acao: "bonus", custo: { recurso: "pm", valor: 5 }, uso: "combate", efeito: "Lança como ação bônus uma magia de ação padrão (estes 5 PM são o extra; a magia cobra o próprio custo)." })]
  }),
  T("contramagiaInstintiva", "Contramagia Instintiva", "magias", "48 h", 10, "5 pontos em Arcanismo e Leitor de Magia", "✓", "1 vez por combate, como reação a uma magia lançada a até 18 m, gasta PM igual ao custo dela e faz um teste de Arcanismo contra a CD do conjurador. Se vencer, a magia é anulada.", {
    acoes: [A("Contramagia Instintiva", { acao: "reacao", uso: "combate", alcance: "18 m", teste: { tipo: "pericia", pericia: "arcanismo", nd: "" }, efeito: "Gasta PM igual ao custo da magia (desconte na mão) e testa Arcanismo contra a CD do conjurador. Se vencer, a magia é anulada." })]
  }),

  /* ---------- Extras ---------- */
  T("delinquente", "Delinquente Briguento", "extras", "5 dias", 5, "Destreza ou Força 8 e Constituição 5", "✗", "Quando uma briga começa por causa do personagem (provocação ou imprudência), o primeiro ataque dele na cena causa o dobro de dano.", { especial: "delinquente", texto: true }),
  T("apostador", "Apostador Experiente", "extras", "5 dias", 5, "Inteligência 5 e Autocontrole 3", "✓", "O personagem sabe ler mesas de jogo e pessoas que apostam. Vantagem em testes de Intuição ligados a jogos de azar. +3 para perceber trapaça ou manipulação num jogo e para estimar as chances de uma situação arriscada.", { especial: "apostador" }),
  T("estrategista", "Estrategista", "extras", "10 dias", 15, "Inteligência 5 e 5 pontos em Liderança", "✗", "Quem segue um plano feito pelo personagem recebe +3 em todos os testes enquanto estiver dentro do plano. O bônus some se a pessoa abandonar o plano ou se os acontecimentos se desviarem muito dele.", { especial: "estrategista", texto: true }),
  T("sonoLeve", "Sono Leve", "extras", "24 h", 2, "Autocontrole 2", "✗", "Não fica Surpreendido enquanto Dormindo e acorda com qualquer barulho.", { especial: "sonoLeve" }),
  T("ator", "Ator", "extras", "3 dias", 3, "Carisma 3 e Aparência 2", "✗", "Vantagem em testes de disfarce e para se passar por outra pessoa.", { especial: "ator" }),
  T("poliglota", "Poliglota", "extras", "5 dias", 3, "Inteligência 3", "✓ (alguém que fale o idioma)", "Aprende 1 idioma novo.", { concluir: "poliglota" }, { repetivel: true }),
  T("leituraCorporal", "Leitura Corporal", "extras", "3 dias", 5, "Autocontrole 3", "✗", "Vantagem em Intuição para perceber mentiras e intenções escondidas.", { especial: "leituraCorporal" }),
  T("negociante", "Negociante", "extras", "5 dias", 5, "Carisma 4", "✓ (um comerciante)", "Compra 10% mais barato e vende 10% mais caro com NPCs comerciantes.", { especial: "negociante" }),
  T("redeContatos", "Rede de Contatos", "extras", "5 dias", 5, "Carisma 4", "✗", "1 vez por sessão, numa cidade que já visitou, encontra um contato que dá uma informação, abrigo ou um favor pequeno. O Mestre decide quem é o contato.", {
    texto: true, acoes: [A("Rede de Contatos", { acao: "livre", uso: "cena", efeito: "1 vez por sessão, numa cidade que já visitou: encontra um contato que dá uma informação, abrigo ou um favor pequeno. O Mestre decide quem é o contato." })]
  }),
  T("discursoGuerra", "Discurso de Guerra", "extras", "5 dias", 10, "Carisma 5 e 3 pontos em Liderança", "✗", "1 vez por combate, como ação padrão, aliados a até 9 m que ouvirem ganham 2 × Carisma de PV temporário.", {
    acoes: [A("Discurso de Guerra", { acao: "padrao", uso: "combate", area: "9 m", alvo: "aliados que ouvirem", efeito: "Cada aliado ganha [[/r 2 * @atr.carisma]] de Vida temporária (2 × Carisma)." })]
  }),
  T("mentor", "Mentor", "extras", "10 dias", 10, "Inteligência 4", "✗", "Pode ser o treinador de qualquer treinamento que já concluiu. Quem treina com ele ganha +1 PT por dia de treino juntos.", { especial: "mentor" }),
  T("protagonista", "Protagonista", "extras", "10 dias", 15, "Carisma 5", "✗", "Começa cada sessão com 1 Inspiração de Tema.", { especial: "protagonista", concluir: "protagonista" }),

  /* ---------- Ofício e Sobrevivência ---------- */
  T("forrageador", "Forrageador", "oficio", "24 h", 2, "—", "✗", "Em viagem, encontra comida e água para Constituição + 2 pessoas sem teste, fora de terreno hostil.", { especial: "forrageador" }),
  T("coletorMateriais", "Coletor de Materiais", "oficio", "24 h", 3, "Inteligência 2", "✗", "Ao derrotar uma criatura, faz um teste de Ofício DT 12 para tirar dela materiais de Criação (couro, ossos, glândulas…). O Mestre define o que sai.", {
    texto: true, acoes: [A("Coletar materiais", { acao: "padrao", teste: { tipo: "pericia", pericia: "oficio", nd: "" }, efeito: "Numa criatura derrotada: Ofício DT 12. Se passar, tira materiais de Criação (couro, ossos, glândulas…). O Mestre define o que sai." })]
  }),
  T("cozinheiroCampo", "Cozinheiro de Campo", "oficio", "24 h", 3, "2 pontos em Ofício", "✗", "Uma refeição feita no descanso longo dá 5 PV temporários para até 6 pessoas, até o próximo descanso longo.", { especial: "cozinheiroCampo" }),
  T("primeirosSocorros", "Primeiros Socorros", "oficio", "24 h", 3, "Inteligência 2", "✗", "Ação padrão, com um item de Ferramentas. Remove Sangrando e cura 1d6 + Inteligência de PV, 1 vez por descanso para cada alvo.", {
    acoes: [A("Primeiros Socorros", { acao: "padrao", alcance: "toque", alvo: "1 criatura", dano: { formula: "1d6 + @atr.inteligencia", tipo: "cura" }, efeito: "Precisa de um item de Ferramentas. Remove Sangrando e cura o valor rolado. 1 vez por descanso para cada alvo." })]
  }),
  T("reparoCampo", "Reparo de Campo", "oficio", "24 h", 3, "2 pontos em Ofício", "✗", "Consertar leva 1 minuto em vez de 10 e recupera 75 de durabilidade em vez de 50.", { especial: "reparoCampo" }),
  T("rastreador", "Rastreador", "oficio", "3 dias", 5, "Inteligência 3", "✗", "Vantagem para seguir rastros e descobre o número e o tipo das criaturas que os deixaram.", { especial: "rastreador" }),
  T("armadilheiro", "Armadilheiro", "oficio", "3 dias", 5, "Destreza 3 e 2 pontos em Ofício", "✗", "Monta uma armadilha em 1 minuto, com um item de Ferramentas. Quem pisar faz Acrobacia CD 10 + Inteligência. Se falhar, sofre 2d6 de dano e fica Preso.", {
    acoes: [A("Montar armadilha", { acao: "padrao", duracao: "1 minuto para montar", teste: { tipo: "resistencia", pericia: "acrobacia", nd: "10 + @atr.inteligencia" }, dano: { formula: "2d6", tipo: "" }, efeito: "Precisa de um item de Ferramentas. Quem pisar faz Acrobacia; se falhar, sofre o dano e fica Preso." })]
  }),
  T("envenenador", "Envenenador", "oficio", "3 dias", 5, "Inteligência 3 e 2 pontos em Ofício", "✓", "Aplica veneno numa arma como ação bônus, e os venenos que cria têm CD +2.", { especial: "envenenador" }),
  T("armeiro", "Armeiro", "oficio", "5 dias", 5, "3 pontos em Ofício", "✓", "As armas e armaduras que o personagem mantém perdem 5 de durabilidade em vez de 10 nos críticos e falhas críticas.", { especial: "armeiro" }),
  T("mestreArtesao", "Mestre Artesão", "oficio", "10 dias", 10, "5 pontos em Ofício", "✓", "Os projetos de Criação levam 25% menos horas e o teste da Criação ganha +2.", { especial: "mestreArtesao" }),

  /* ---------- Mente e Sanidade ---------- */
  T("menteFria", "Mente Fria", "mente", "24 h", 3, "Autocontrole 3", "✗", "1 vez por combate, rola de novo um teste de Vontade que falhou (fica o novo resultado).", { especial: "menteFria" }),
  T("meditacaoProfunda", "Meditação Profunda", "mente", "24 h", 3, "Autocontrole 3", "✗", "Um descanso curto meditando recupera Autocontrole de PS.", { especial: "meditacaoProfunda" }),
  T("memoriaEidetica", "Memória Eidética", "mente", "3 dias", 5, "Inteligência 4", "✗", "Lembra com perfeição tudo o que viu ou leu no último mês e tem vantagem em Investigação para comparar detalhes.", { especial: "memoriaEidetica" }),
  T("menteBlindada", "Mente Blindada", "mente", "36 h", 5, "Autocontrole 4", "✗", "+3 nos testes contra Apavorado, Abalado, Confuso e Dominado.", { especial: "menteBlindada" }),
  T("coragemContagiante", "Coragem Contagiante", "mente", "36 h", 5, "Autocontrole 4 e Carisma 3", "✗", "Aliados a até 9 m que consigam ver o personagem ganham +2 nos testes contra Apavorado.", { especial: "coragemContagiante" }),
  T("resistenciaHorror", "Resistência ao Horror", "mente", "36 h", 5, "Autocontrole 4", "✗", "Perdas de PS por ver horrores diminuem em Autocontrole (mínimo 1).", { especial: "resistenciaHorror" }),
  T("focoInabalavel", "Foco Inabalável", "mente", "48 h", 10, "Autocontrole 6 e Mente Blindada", "✓", "Imune a Abalado.", { especial: "focoInabalavel", imune: ["epm-abalado"] }),
  T("ancoraSanidade", "Âncora de Sanidade", "mente", "48 h", 10, "Autocontrole 5", "✓", "1 vez por dia, quando for perder PS, perde só metade.", {
    acoes: [A("Âncora de Sanidade", { acao: "livre", uso: "dia", efeito: "Quando for perder Sanidade: perde só metade (arredondada para baixo)." })]
  }),
  T("palacioMental", "Palácio Mental", "mente", "48 h", 10, "Inteligência 5, Autocontrole 5 e Memória Eidética", "✓", "Imune a Confuso e vantagem contra leitura de mente e efeitos que mudam memórias.", { especial: "palacioMental", imune: ["epm-confuso"] }),

  /* ---------- Furtividade e Infiltração ---------- */
  T("passosSilenciosos", "Passos Silenciosos", "furtividade", "24 h", 3, "Destreza 3", "✗", "Anda no deslocamento normal sem penalidade em Furtividade.", { especial: "passosSilenciosos" }),
  T("arrombador", "Arrombador", "furtividade", "24 h", 3, "Destreza 3", "✗", "+3 nos testes para abrir fechaduras e desarmar armadilhas, que levam metade do tempo.", { especial: "arrombador" }),
  T("sombra", "Sombra", "furtividade", "5 dias", 5, "Destreza 4 e Passos Silenciosos", "✗", "Pode se esconder como ação bônus.", { especial: "sombra" }),
  T("ataqueFurtivo", "Ataque Furtivo", "furtividade", "48 h", 10, "Destreza 5 e 4 pontos em Furtividade", "✓", "1 vez por turno, um ataque contra um alvo Desprevenido ou Surpreendido ganha +1 nível de dano.", {
    acoes: [A("Ataque Furtivo", { acao: "livre", uso: "turno", efeito: "Este ataque contra um alvo Desprevenido ou Surpreendido ganha +1 nível de dano." })]
  }),

  /* ---------- Outros modelos da ficha ---------- */
  T("adaptacao2", "Adaptação tecnológica: nível 2", "outros", "48 h", 5, "—", "✗", "Passa a dominar a tecnologia de Briavoterna (nível 2): armas, itens e proteções de lá deixam de ter penalidade.", { especial: "adaptacao2" }),
  T("adaptacao3", "Adaptação tecnológica: nível 3", "outros", "1 semana", 10, "nível de tecnologia 2", "✗", "Passa a dominar a tecnologia de Genesis (nível 3). Precisa já dominar o nível 2 (origem em Briavoterna ou a adaptação ao nível 2).", { especial: "adaptacao3" })
];

/** Treinos de versões antigas que saíram do doc: continuam valendo nas fichas que já têm, mas não aparecem no catálogo. */
export const TREINOS_LEGADO = [
  { nome: "Memória Treinada", especial: "memoriaTreinada" },
  { nome: "Meditação de Núcleo", especial: "meditacaoNucleo" }
];

/* -------------------------------------------- */
/*  Leitura dos textos (tempo e requisitos)      */
/* -------------------------------------------- */

export const normTreino = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** "48 h" → 48; "3 dias" → 24; "1 semana" → 56; "1 mês" → 240. */
export function horasDoTexto(texto) {
  const t = normTreino(texto);
  const n = Number(t.match(/[\d.,]+/)?.[0]?.replace(",", ".")) || 1;
  if (/mes|meses/.test(t)) return Math.round(n * HORAS_MES);
  if (/semana/.test(t)) return Math.round(n * HORAS_SEMANA);
  if (/dia/.test(t)) return Math.round(n * HORAS_DIA);
  return Math.round(n);
}

export const ATRS = { forca: "Força", destreza: "Destreza", constituicao: "Constituição", aparencia: "Aparência", carisma: "Carisma", inteligencia: "Inteligência", autocontrole: "Autocontrole", nucleo: "Núcleo" };
const ATR_POR_NOME = Object.fromEntries(Object.entries(ATRS).map(([id, l]) => [normTreino(l), id]));
export const PERICIAS_REQ = { luta: "Luta", pontaria: "Pontaria", arcanismo: "Arcanismo", lideranca: "Liderança", oficio: "Ofício", furtividade: "Furtividade", acrobacia: "Acrobacia", percepcao: "Percepção", investigacao: "Investigação" };
const PER_POR_NOME = Object.fromEntries(Object.entries(PERICIAS_REQ).map(([id, l]) => [normTreino(l), id]));

/**
 * Requisitos estruturados a partir do texto do doc:
 * { atributos: [{ ids, min }], pericias: [{ ids, min }], treinos: [id], itens: [texto], tecnologia }
 */
export function lerRequisitos(texto, porNome = new Map()) {
  const out = { atributos: [], pericias: [], treinos: [], itens: [], tecnologia: 0 };
  const t = String(texto ?? "").trim();
  if (!t || t === "—" || t === "-") return out;
  // separa por vírgula e pelo " e " final (sem quebrar "Força ou Constituição 4")
  const partes = t.split(/,\s*|\s+e\s+/).map(x => x.trim()).filter(Boolean);
  for (const parte of partes) {
    const n = normTreino(parte);
    let m = n.match(/^((?:[a-z]+)(?:\s+ou\s+[a-z]+)*)\s+(\d+)$/);
    if (m && m[1].split(/\s+ou\s+/).every(x => ATR_POR_NOME[x])) { out.atributos.push({ ids: m[1].split(/\s+ou\s+/).map(x => ATR_POR_NOME[x]), min: Number(m[2]) }); continue; }
    m = n.match(/^(\d+)\s+pontos?\s+em\s+([a-z]+(?:\s+ou\s+[a-z]+)*)$/);
    if (m && m[2].split(/\s+ou\s+/).every(x => PER_POR_NOME[x])) { out.pericias.push({ ids: m[2].split(/\s+ou\s+/).map(x => PER_POR_NOME[x]), min: Number(m[1]) }); continue; }
    m = n.match(/^nivel de tecnologia (\d+)$/);
    if (m) { out.tecnologia = Number(m[1]); continue; }
    const treino = porNome.get(n);
    if (treino) { out.treinos.push(treino); continue; }
    out.itens.push(parte);
  }
  return out;
}

const porNome = new Map(LISTA.map(e => [normTreino(e.nome), e.id]));

/** O catálogo pronto: com horas, requisitos estruturados, tipo de treinador e cadeia (quem libera quem). */
export const TREINAMENTOS_LISTA = LISTA.map(e => {
  const treinadorTxt = String(e.treinador);
  return {
    ...e, horas: horasDoTexto(e.tempo),
    req: lerRequisitos(e.requisitos, porNome),
    precisaTreinador: treinadorTxt.startsWith("✓"),
    tipoTreinador: treinadorTxt.match(/\((.*)\)/)?.[1] ?? "",
    repetivel: !!e.repetivel
  };
});
for (const e of TREINAMENTOS_LISTA) e.libera = TREINAMENTOS_LISTA.filter(x => x.req.treinos.includes(e.id)).map(x => x.id);

const PorId = new Map(TREINAMENTOS_LISTA.map(e => [e.id, e]));
export const treinoModelo = id => PorId.get(id) ?? null;
/** Modelo pelo nome (fichas antigas). */
export const modeloPorNome = nome => treinoModelo(porNome.get(normTreino(nome)));

/** Cadeia de pré-requisitos acima de um treino (do mais básico para ele): ["auraIniciante", "auraProtecao", "auraProtecaoSuperior"]. */
export function cadeiaTreino(id, visto = new Set()) {
  const e = treinoModelo(id);
  if (!e || visto.has(id)) return [];
  visto.add(id);
  const acima = e.req.treinos.flatMap(t => cadeiaTreino(t, visto));
  return [...new Set([...acima, id])];
}

/** Requisitos em texto curto ("Destreza 6 · Corredor · treinador"). */
export function textoRequisitos(e) {
  const r = e.req;
  const partes = [
    ...r.atributos.map(a => `${a.ids.map(i => ATRS[i]).join(" ou ")} ${a.min}`),
    ...r.pericias.map(p => `${p.min} pontos em ${p.ids.map(i => PERICIAS_REQ[i]).join(" ou ")}`),
    ...r.treinos.map(t => treinoModelo(t)?.nome ?? t),
    ...(r.tecnologia ? [`nível de tecnologia ${r.tecnologia}`] : []),
    ...r.itens
  ];
  return partes.join(", ") || "—";
}

/**
 * Confere os requisitos estruturados com a ficha.
 * ficha: { atributos: { id: { total } }, periciaPorId: { id: { pontos } }, extras: { tecnologia } };
 * concluidos: Set de ids de modelo (e nomes normalizados) já concluídos; temFavorita / armasExoticas para os itens.
 * Devolve { ok, faltas[], cumpridos[], manuais[] }. Itens que a ficha não sabe conferir ficam em "manuais" (não bloqueiam).
 */
export function cumpreRequisitos(e, ficha, { concluidos = new Set(), temFavorita = false, temExotica = false } = {}) {
  const out = { cumpridos: [], faltas: [], manuais: [] };
  const r = e?.req ?? { atributos: [], pericias: [], treinos: [], itens: [] };
  for (const a of r.atributos) {
    const vals = a.ids.map(i => ({ i, v: Number(ficha?.atributos?.[i]?.total) || 0 }));
    const bom = vals.find(x => x.v >= a.min);
    const rot = `${a.ids.map(i => ATRS[i]).join(" ou ")} ${a.min}`;
    (bom ? out.cumpridos : out.faltas).push(bom ? `${ATRS[bom.i]} ${bom.v}` : `${rot} (tem ${vals.map(x => x.v).join("/")})`);
  }
  for (const p of r.pericias) {
    const vals = p.ids.map(i => ({ i, v: Number(ficha?.periciaPorId?.[i]?.pontos) || 0 }));
    const bom = vals.find(x => x.v >= p.min);
    const rot = `${p.min} pontos em ${p.ids.map(i => PERICIAS_REQ[i]).join(" ou ")}`;
    (bom ? out.cumpridos : out.faltas).push(bom ? `${PERICIAS_REQ[bom.i]} ${bom.v} pontos` : `${rot} (tem ${vals.map(x => x.v).join("/")})`);
  }
  for (const t of r.treinos) {
    const nome = treinoModelo(t)?.nome ?? t;
    (concluidos.has(t) || concluidos.has(normTreino(nome)) ? out.cumpridos : out.faltas).push(concluidos.has(t) || concluidos.has(normTreino(nome)) ? nome : `concluir ${nome}`);
  }
  if (r.tecnologia) {
    const tem = Number(ficha?.extras?.tecnologia) || 1;
    (tem >= r.tecnologia ? out.cumpridos : out.faltas).push(tem >= r.tecnologia ? `tecnologia ${tem}` : `nível de tecnologia ${r.tecnologia} (tem ${tem})`);
  }
  for (const i of r.itens) {
    const n = normTreino(i);
    if (/arma favorita/.test(n)) (temFavorita ? out.cumpridos : out.faltas).push(temFavorita ? "arma favorita" : "ter uma arma favorita");
    else if (/exotica/.test(n)) (temExotica ? out.cumpridos : out.faltas).push(temExotica ? "arma Exótica" : "ter a arma Exótica");
    else out.manuais.push(i);
  }
  return { ...out, ok: !out.faltas.length };
}

/** Efeitos especiais dos treinamentos concluídos de uma ficha (pelo modelo, pelo campo especial ou pelo nome). */
export function especiaisDaFicha(dados = {}) {
  const out = new Set();
  for (const t of Object.values(dados?.treinamentos ?? {})) {
    if (t?.estado !== "concluido") continue;
    const esp = t.especial || treinoModelo(t.modelo)?.auto?.especial || modeloPorNome(t.nome)?.auto?.especial || TREINOS_LEGADO.find(x => normTreino(x.nome) === normTreino(t.nome))?.especial;
    if (esp) out.add(esp);
  }
  return out;
}
export const MENTOR_PT_POR_DIA = 1;
export const ARTESAO = { horas: 0.75, teste: 2 };
export const REPARO_CAMPO = { minutos: 1, recupera: 75 };
export const ARMEIRO_PERDA = 5;
export const ESTUDO_EXOTICA_REDUZ = 2;

/** O que a ficha já tem para conferir requisitos: treinos concluídos (ids e nomes), favorita e arma Exótica. */
export function baseRequisitos(dados = {}, { temExotica = false } = {}) {
  const concluidos = new Set();
  for (const t of Object.values(dados?.treinamentos ?? {})) {
    if (t?.estado !== "concluido") continue;
    const id = t.modelo || modeloPorNome(t.nome)?.id;
    if (id) concluidos.add(id);
    concluidos.add(normTreino(t.nome));
  }
  const temFavorita = Object.values(dados?.armasFavoritas ?? {}).some(v => v && (v.catalogo || v.nome)) || !!dados?.arquetipoOpcoes?.combatente?.tipoFavorito;
  return { concluidos, temFavorita, temExotica };
}
