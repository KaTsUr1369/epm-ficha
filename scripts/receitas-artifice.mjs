/**
 * Receitas do Livro de Projetos do Artífice (PDF "Artífice reformulado"). Só dados.
 * valores: um texto por Grau (I a V); "—" = não dá para fabricar nesse Grau.
 * rolar: o que o botão "Usar" faz
 *   ataque  → d20 + Ofício contra a CA e depois o dano (dano: "dano" = Dano do Grau, ou dados próprios por Grau)
 *   area    → rola o dano (sem a Inteligência) e põe o botão de resistência contra a CD de Projeto
 *   resist  → só o teste de resistência contra a CD de Projeto (efeito do Grau)
 *   cura    → rola a cura do Grau (PV) ou recurso: "pe"
 *   nota    → só o cartão com o efeito e o valor
 * Arremessáveis têm alcance de 9 m. O Mestre pode aprovar receitas novas no mesmo padrão.
 */
export const RECEITAS_ARTIFICE = [
  // Consumíveis
  { id: "carga-explosiva", nome: "Carga Explosiva", categoria: "consumivel", tipo: "dano", uso: "Ação Padrão",
    efeito: "Ataque à distância (d20 + Ofício, até 9 m) contra um alvo. Acertou: dano Explosivo.",
    valores: ["2d6 + Int.", "3d8 + Int.", "4d10 + Int.", "6d10 + Int.", "8d10 + Int."], rolar: { modo: "ataque", dano: "dano", tipoDano: "Explosivo" } },
  { id: "granada-fragmentacao", nome: "Granada de Fragmentação", categoria: "consumivel", tipo: "dano", uso: "Ação Padrão",
    efeito: "Raio de 3 m, dano Explosivo. Reflexo contra a CD de Projeto reduz à metade.",
    valores: ["2d6", "3d8", "4d10", "6d10", "8d10"], rolar: { modo: "area", dano: "danoArea", tipoDano: "Explosivo", resistencia: "reflexos", metade: true } },
  { id: "bomba-elemental", nome: "Bomba Elemental", categoria: "consumivel", tipo: "dano", uso: "Ação Padrão",
    efeito: "Raio de 3 m. Ao montar, escolhe Fogo (Em Chamas), Frio (Enregelado), Relâmpago (Eletrizado) ou Água (Molhado). Reflexo contra a CD: quem falha sofre o dano e a condição; quem passa, nada.",
    valores: ["1d6", "2d8", "2d10", "3d10", "4d10"], rolar: { modo: "area", dados: ["1d6", "2d8", "2d10", "3d10", "4d10"], resistencia: "reflexos", escolha: ["Fogo", "Frio", "Relâmpago", "Água"] } },
  { id: "mina-contato", nome: "Mina de Contato", categoria: "consumivel", tipo: "dano", uso: "Ação Padrão (armar em espaço adjacente)",
    efeito: "Escondida (Percepção contra a CD de Projeto para achar) até alguém pisar. Alvo único; Reflexo contra a CD para metade. A partir do Grau II, quem falhar fica Preso.",
    valores: ["2d6 + Int.", "3d8 + Int.", "4d10 + Int.", "6d10 + Int.", "8d10 + Int."], rolar: { modo: "area", dano: "dano", tipoDano: "Explosivo", resistencia: "reflexos", metade: true } },
  { id: "granada-contencao", nome: "Granada de Contenção", categoria: "consumivel", tipo: "cd", uso: "Ação Padrão",
    efeito: "Raio de 3 m. Reflexo contra a CD de Projeto ou fica Preso (escapa com Atletismo contra a CD, como Ação Padrão). Grau III+: também Lento. Grau V: quem falhar por 5 ou mais fica Atordoado até o fim do próximo turno.",
    valores: ["Preso", "Preso", "Preso e Lento", "Preso e Lento", "Preso, Lento e Atordoado"], rolar: { modo: "resist", resistencia: "reflexos" } },
  { id: "pulso-disruptor", nome: "Pulso Disruptor", categoria: "consumivel", tipo: "cd", uso: "Ação Padrão",
    efeito: "Raio de 6 m. Vontade contra a CD de Projeto: quem falha fica Desestabilizado até o fim do próximo turno. Constructos, autômatos e engenhocas inimigas que falham ficam Atordoados por 1 rodada.",
    valores: ["Raio 6 m", "Raio 6 m", "Raio 9 m", "Raio 9 m", "Raio 12 m"], rolar: { modo: "resist", resistencia: "vontade" } },
  { id: "pente-especial", nome: "Pente Especial", categoria: "consumivel", tipo: "dano", uso: "Recarregar a arma",
    efeito: "5 munições com dano extra de um tipo Natural ou Energia, escolhido ao montar (em cada acerto).",
    valores: ["+2d6 + Int.", "+3d8 + Int.", "+4d10 + Int.", "+6d10 + Int.", "+8d10 + Int."], rolar: { modo: "nota", valor: "aprimoramento" } },
  { id: "remendo-campo", nome: "Remendo de Campo", categoria: "consumivel", tipo: "cura", uso: "Ação Padrão, alvo a 1,5 m",
    efeito: "Recupera PV. A cura forte de alvo único continua sendo do Curandeiro.",
    valores: ["2d4 + Int. PV", "2d8 + Int. PV", "3d10 + Int. PV", "4d12 + Int. PV", "6d12 + Int. PV"], rolar: { modo: "cura", recurso: "pv" } },
  { id: "estimulante", nome: "Estimulante", categoria: "consumivel", tipo: "soma", uso: "Ação Bônus, alvo a 1,5 m",
    efeito: "Recupera PE e ganha +1,5 m de deslocamento por 1 minuto.",
    valores: ["2d4 + Int. PE", "2d8 + Int. PE", "3d10 + Int. PE", "4d12 + Int. PE", "6d12 + Int. PE"], rolar: { modo: "cura", recurso: "pe" } },
  { id: "tonico-foco", nome: "Tônico de Foco", categoria: "consumivel", tipo: "soma", uso: "Ação Bônus, alvo a 1,5 m",
    efeito: "Até o fim do próximo turno do alvo, bônus num tipo de teste escolhido (ataque, perícia ou resistência).",
    valores: ["+3", "+4", "+6", "+8", "+10"], rolar: { modo: "nota", valor: "soma" } },
  { id: "placa-emergencia", nome: "Placa de Emergência", categoria: "consumivel", tipo: "protecao", uso: "Reação",
    efeito: "Quando uma criatura a até 1,5 m for atacada, ela ganha bônus na CA contra esse ataque. Não gasta ação do próximo turno.",
    valores: ["+3 CA", "+4 CA", "+5 CA", "+6 CA", "+8 CA"], rolar: { modo: "nota", valor: "protecao" } },
  { id: "granada-fumaca", nome: "Granada de Fumaça", categoria: "consumivel", tipo: "protecao", uso: "Ação Padrão",
    efeito: "Nuvem de 6 m de raio por 1 minuto: ataques que entram, saem ou atravessam a nuvem têm desvantagem. Grau III+: quem começa o turno dentro faz Fortitude contra a CD de Projeto ou fica Cego até sair.",
    valores: ["Raio 6 m", "Raio 6 m", "Raio 9 m", "Raio 9 m", "Raio 12 m"], rolar: { modo: "nota" } },
  // Engenhocas (Durabilidade)
  { id: "arma-projeto", nome: "Arma de Projeto", categoria: "engenhoca", tipo: "dano", uso: "Empunhada pelo portador",
    efeito: "Uma arma inventada (lâmina vibratória, canhão de pulso, besta mecânica, rifle…), corpo a corpo ou a distância, de tipo Físico ou Energia. Dá bônus no teste de ataque. O Artífice ataca com ela usando d20 + Ofício; outros portadores usam Luta ou Pontaria.",
    valores: ["1d8 + atributo; acerto +2", "1d10 + atributo; acerto +2", "1d12 + atributo; acerto +3", "2d8 + atributo; acerto +4", "2d10 + atributo; acerto +5"], rolar: { modo: "nota" }, arma: { dados: ["1d8", "1d10", "1d12", "2d8", "2d10"], acerto: [2, 2, 3, 4, 5] } },
  { id: "afiacao", nome: "Afiação ou Acoplamento", categoria: "engenhoca", tipo: "dano", uso: "Passivo",
    efeito: "Na arma do portador. Afiação: dano extra do tipo da arma. Acoplamento: dano extra de um tipo Natural ou Energia, escolhido ao montar. Vale em todo acerto.",
    valores: ["+2d6 + Int.", "+3d8 + Int.", "+4d10 + Int.", "+6d10 + Int.", "+8d10 + Int."], rolar: { modo: "nota", valor: "aprimoramento" } },
  { id: "torreta", nome: "Torreta Automática", categoria: "engenhoca", tipo: "dano", uso: "Ação Bônus",
    efeito: "Instalada num espaço a até 1,5 m (recolher e reinstalar: Ação Padrão). Ataca a até 18 m com d20 + Ofício, dano Balístico. CA = CD de Projeto; se receber dano igual ou maior que a CD, perde 1 cena.",
    valores: ["1d8", "2d8", "2d10", "3d10", "4d10"], rolar: { modo: "ataque", dados: ["1d8", "2d8", "2d10", "3d10", "4d10"], tipoDano: "Balístico" } },
  { id: "escudo-defletor", nome: "Escudo Defletor", categoria: "engenhoca", tipo: "protecao", uso: "Reação, 1×/rodada",
    efeito: "No braço do portador: bônus na CA contra um ataque. Não gasta ação do próximo turno.",
    valores: ["+3 CA", "+4 CA", "+5 CA", "+6 CA", "+8 CA"], rolar: { modo: "nota", valor: "protecao" } },
  { id: "placas-reforco", nome: "Placas de Reforço", categoria: "engenhoca", tipo: "protecao", uso: "Passivo",
    efeito: "Presas na armadura do portador: RD contra dano físico.",
    valores: ["RD física 3", "RD física 4", "RD física 5", "RD física 6", "RD física 8"], rolar: { modo: "nota" } },
  { id: "traje-modificado", nome: "Traje Modificado", categoria: "engenhoca", tipo: "protecao", uso: "Vestido pelo portador",
    efeito: "Roupa reforçada e cheia de bolsos e ferramentas. Ao montar, escolha: metade da Proteção (arredonda para cima) na CA, na Esquiva e no Bloqueio, somando com armadura e escudo; ou a Soma em uma perícia, exceto Luta e Pontaria. Se a roupa for perdida ou destruída, o Projeto volta.",
    valores: ["+2 (CA, Esquiva e Bloqueio) ou +3 (perícia)", "+2 ou +4", "+3 ou +6", "+3 ou +8", "+4 ou +10"], rolar: { modo: "nota" } },
  { id: "gerador-campo", nome: "Gerador de Campo", categoria: "engenhoca", tipo: "protecao", uso: "Ação Padrão, 1×/cena (Grau III+)", grauMin: 3,
    efeito: "Raio de 3 m centrado no portador por 1 minuto: aliados ganham RD contra uma natureza de dano escolhida (Física, Natural, Mágica ou Tecnológica).",
    valores: ["—", "—", "RD 5", "RD 6", "RD 8"], rolar: { modo: "nota" } },
  { id: "drone-batedor", nome: "Drone Batedor", categoria: "engenhoca", tipo: "soma", uso: "Ação Bônus",
    efeito: "Voa 12 m por turno; o Artífice vê e ouve pelo drone. A partir do Grau II, marca um alvo que o drone veja: 1×/turno, um aliado que ataque esse alvo ganha bônus no acerto. CA = CD de Projeto.",
    valores: ["—", "+2 no acerto", "+3 no acerto", "+4 no acerto", "+5 no acerto"], rolar: { modo: "nota" } }
];

export const receitaPorId = id => RECEITAS_ARTIFICE.find(r => r.id === id) ?? null;

/** Grau mínimo da receita (o primeiro com valor). */
export const grauMinimo = r => Math.max(Number(r?.grauMin) || 1, (r?.valores ?? []).findIndex(v => v && v !== "—") + 1 || 1);

/** Receita escrita pelo jogador ou pelo Mestre, já normalizada. */
export function normalizarReceita(r = {}) {
  const valores = Array.from({ length: 5 }, (_, i) => String(r.valores?.[i] ?? "").trim() || "—");
  return {
    id: String(r.id ?? "").trim(), nome: String(r.nome ?? "Receita").trim() || "Receita",
    categoria: r.categoria === "engenhoca" ? "engenhoca" : "consumivel",
    tipo: ["dano", "cura", "soma", "protecao", "cd"].includes(r.tipo) ? r.tipo : "dano",
    uso: String(r.uso ?? "").trim(), efeito: String(r.efeito ?? "").trim(), valores,
    grauMin: Math.max(1, Math.min(5, Number(r.grauMin) || 1)), rolar: r.rolar ?? { modo: "nota" }, arma: r.arma ?? null, propria: !!r.propria
  };
}
