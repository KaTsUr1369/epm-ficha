/**
 * Atirador Arcano (classe de Artífice): regras puras (sem Foundry) da Arma Mágica, Posição Tática,
 * Circuitos Balísticos, Câmara de Acúmulo, Sobrecarga Arcana e Starlight Step.
 * As ações (criar a arma, gastar usos, ligar circuitos) ficam em atirador-acoes.mjs.
 */

export const ID_ATIRADOR = "atiradorArcano";

/** Porte da arma: custo de criação (PM) e da Munição de Mana por disparo. */
export const CATEGORIAS_ARMA_MAGICA = {
  pequena: { label: "Pequena", exemplos: "pistolas, bestas de pulso, arcos curtos", custo: "1d20", municao: 3, ordem: 0 },
  media: { label: "Média", exemplos: "escopetas, metralhadoras, bestas, arcos longos", custo: "3d20", municao: 5, ordem: 1 },
  grande: { label: "Grande", exemplos: "rifles de precisão, metralhadoras pesadas", custo: "5d20 + 10", municao: 9, ordem: 2 },
  especial: { label: "Especial", exemplos: "bazucas, miniguns, armas excepcionais", custo: "9d20 + 50", municao: 20, ordem: 3 }
};
const ORDEM_CATEGORIAS = ["pequena", "media", "grande", "especial"];

export const CIRCUITOS = {
  mira: { nome: "Mira Estabilizada", texto: "+2 nos testes de ataque com a arma.", acerto: 2 },
  acelerador: { nome: "Acelerador", texto: "+6 m de alcance.", alcance: 6 },
  ressonante: { nome: "Núcleo Ressonante", texto: "1×/turno, ao acertar: 3 PM para +1d8 do mesmo tipo da arma.", pm: 3 },
  ricochete: { nome: "Ricochete", texto: "1×/turno, ao acertar: 3 PM para atingir outro inimigo a até 3 m do alvo com 1d8 de dano arcano.", pm: 3 }
};
export const CUSTO_CIRCUITO = 5;

export const SOBRECARGAS = {
  acelerador: { nome: "Acelerador de Mana", texto: "+3 nos testes de ataque com a arma.", acerto: 3 },
  amplificador: { nome: "Amplificador", texto: "O primeiro disparo que acertar em cada turno causa +2d8." },
  fragmentador: { nome: "Fragmentador", texto: "1×/turno, ao acertar: outra criatura a até 1,5 m do alvo sofre 1d8 de dano arcano." }
};
export const CUSTO_SOBRECARGA = { pm: 6, pe: 4, rodadas: 3 };

/** Maestria Arcana (Nv. 48): melhorias instaladas ao criar ou reconfigurar a arma. */
export const MELHORIAS_MAESTRIA = [
  { id: "modificacoes", label: "3 Modificações", pm: 10 },
  { id: "encantamentos", label: "2 Encantamentos", pm: 14 },
  { id: "maldicao", label: "1 Maldição", pm: 20 },
  { id: "bencao", label: "1 Bênção", pm: 20 }
];

export const MAX_CARGAS_CAMARA = 2;

/** Quantos circuitos cabem na arma no nível da classe. */
export const maxCircuitos = nivel => (nivel >= 30 ? 3 : nivel >= 24 ? 2 : nivel >= 18 ? 1 : 0);

/** Usos do Starlight Step por Descanso Longo: Núcleo ÷ 2 (para cima) + nível do personagem ÷ 10 (inteiro). */
export const usosStarlight = (nucleo, nivelPersonagem) => Math.max(0, Math.ceil((Number(nucleo) || 0) / 2) + Math.floor((Number(nivelPersonagem) || 0) / 10));

/** Categoria do custo de criação: a Maestria Arcana (48) desce duas categorias, no mínimo Pequena. */
export function categoriaDoCusto(categoria, nivel) {
  const i = Math.max(0, ORDEM_CATEGORIAS.indexOf(categoria));
  return ORDEM_CATEGORIAS[nivel >= 48 ? Math.max(0, i - 2) : i];
}

/** Fórmula do custo de criação (PM): porte (com a Maestria) + 5 PM por circuito instalado + melhorias da Maestria. */
export function formulaCriacao(categoria, nivel, { circuitos = 0, melhorias = [] } = {}) {
  const cat = CATEGORIAS_ARMA_MAGICA[categoriaDoCusto(categoria, nivel)] ?? CATEGORIAS_ARMA_MAGICA.pequena;
  const extra = circuitos * CUSTO_CIRCUITO + MELHORIAS_MAESTRIA.filter(m => melhorias.includes(m.id)).reduce((s, m) => s + m.pm, 0);
  return extra ? `${cat.custo} + ${extra}` : cat.custo;
}

/** PV da Arma de Sangue: metade do custo final em PM, para cima. Atordoa se passar da metade dos PV máximos. */
export function custoSangue(pm, pvMax) {
  const pv = Math.ceil((Number(pm) || 0) / 2);
  return { pv, atordoa: pv > (Number(pvMax) || 0) / 2 };
}

/** Porte sugerido pelo peso e pelo nome da arma do catálogo. */
export function categoriaSugerida(nome = "", peso = 0) {
  const t = String(nome).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/bazuca|minigun|lanca-?misseis|canhao|lanca-chamas/.test(t)) return "especial";
  if (/rifle de precisao|sniper|pesad|anti-?material/.test(t)) return "grande";
  if (/pistola|revolver|besta de pulso|arco curto|garrucha|derringer/.test(t)) return "pequena";
  const p = Number(peso) || 0;
  return p <= 1.5 ? "pequena" : p <= 5 ? "media" : p <= 9 ? "grande" : "especial";
}

/**
 * Posição Tática no nível: margem, multiplicador e dados extras.
 * `gasto`: "" (só a posição), "tatica2" (4 PE, Nv. 12) ou "absoluta" (10 PE, Nv. 48).
 */
export function posicaoTatica(nivel, gasto = "") {
  if (nivel < 6) return null;
  if (gasto === "absoluta" && nivel >= 48) return { margem: 7, mult: 4, dados: 5, pe: 10, nome: "Posição Tática Absoluta" };
  const base = nivel >= 39 ? { margem: 3, dados: 3 } : { margem: 1, dados: 0 };
  if (gasto === "tatica2" && nivel >= 12) return { margem: Math.max(base.margem, 2), mult: 2, dados: base.dados, pe: 4, nome: "Posição Tática II" };
  return { margem: base.margem, mult: 0, dados: base.dados, pe: 0, nome: nivel >= 39 ? "Posição Tática III" : "Posição Tática I" };
}

/** Faces do primeiro dado da fórmula de dano ("2d10 + 3" → 10); padrão 8. */
export function facesDaArma(dano) {
  return Number(/\d*d(\d+)/.exec(String(dano ?? ""))?.[1]) || 8;
}

/**
 * Estado da classe para a ficha. `opc` = flags classeEpm; `nucleo` e `nivelPersonagem` para o Starlight Step.
 */
export function estadoAtirador(nivel, opc = {}, { nucleo = 0, nivelPersonagem = 0 } = {}) {
  if (nivel < 3) return null;
  const max = maxCircuitos(nivel);
  const circuitos = (Array.isArray(opc.circuitos) ? opc.circuitos : []).filter(id => CIRCUITOS[id]).slice(0, max);
  const sobrecarga = nivel >= 27 && SOBRECARGAS[opc.sobrecarga] ? opc.sobrecarga : "";
  const starMax = nivel >= 15 ? usosStarlight(nucleo, nivelPersonagem) : 0;
  const acertoFontes = [];
  if (circuitos.includes("mira")) acertoFontes.push({ valor: CIRCUITOS.mira.acerto, fonte: "Mira Estabilizada (circuito)" });
  // Não acumula com circuito de benefício idêntico: o Acelerador de Mana (+3) cobre a Mira (+2)
  if (sobrecarga === "acelerador") {
    const i = acertoFontes.findIndex(f => f.fonte.startsWith("Mira"));
    if (i >= 0) acertoFontes.splice(i, 1);
    acertoFontes.push({ valor: SOBRECARGAS.acelerador.acerto, fonte: "Acelerador de Mana (Sobrecarga)" });
  }
  return {
    nivel, arcanismo: true, pontaria: nivel >= 36,
    circuitos, maxCircuitos: max, sobrecarga, sobrecargaRodadas: Math.max(0, Number(opc.sobrecargaRodadas) || 0),
    cargas: nivel >= 21 ? Math.min(MAX_CARGAS_CAMARA, Math.max(0, Number(opc.cargas) || 0)) : 0, camara: nivel >= 21,
    starlight: nivel >= 15 ? { max: starMax, usados: Math.min(starMax, Math.max(0, Number(opc.starlightUsos) || 0)), aprimorado: nivel >= 42 } : null,
    magiaAplicada: nivel >= 9, espiral: nivel >= 33 ? (nivel >= 45 ? "aprimorado" : "normal") : "", potencializado: nivel >= 42, maestria: nivel >= 48,
    alcanceExtra: circuitos.includes("acelerador") ? CIRCUITOS.acelerador.alcance : 0,
    acertoFontes
  };
}
