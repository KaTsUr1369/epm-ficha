/**
 * Números dos Estilos de Combate e dos treinos automáticos, editáveis pelo Mestre
 * (Configurações → Escolhidos pelo Multiverso → Bônus de estilos e treinos).
 * Sem Foundry no topo: os testes usam os valores padrão.
 */
import { ARQUETIPOS } from "./arquetipos.mjs";

/** Campos editáveis: [grupo, chave, rótulo, tipo ("n" número, "d" dado)]. */
export const CAMPOS_NUMEROS = [
  ["Estilos de Combate", [
    ["estilo.defensivo.defesa", "Combate Defensivo: Defesa (Bloqueio)", "n", 2],
    ["estilo.defensivo.ca", "Combate Defensivo: CA", "n", 1],
    ["estilo.duelista.acertoIsolado", "Duelista: Acerto", "n", 5],
    ["estilo.bebado.acerto", "Bêbado: Acerto", "n", 5],
    ["estilo.bebado.esquiva", "Bêbado: Esquiva", "n", 2],
    ["estilo.bebado.ca", "Bêbado: CA", "n", 2],
    ["estilo.atirador.margem", "Atirador: margem de crítico", "n", 2],
    ["estilo.longo.dano", "Armamento Longo: dano à distância", "d", "1d6"],
    ["estilo.longo.desarmado", "Armamento Longo: dano desarmado", "d", "1d4"],
    ["estilo.dupla.acerto", "Arma Dupla: Acerto", "n", 3],
    ["estilo.dupla.ca", "Arma Dupla: CA", "n", 2]
  ]],
  ["Treinamentos", [
    ["treino.auraIniciante", "Aura Iniciante: multiplicador do Núcleo no dano desarmado", "n", 1],
    ["treino.auraProtecaoRd", "Aura de Proteção: multiplicador do Núcleo na RD", "n", 2],
    ["treino.auraProtecaoCa", "Aura de Proteção: multiplicador do Núcleo na CA", "n", 1],
    ["treino.auraDeslocBase", "Aura de Deslocamento: metros base", "n", 9],
    ["treino.auraDeslocPorPonto", "Aura de Deslocamento: metros por Núcleo acima de 3", "n", 3],
    ["treino.auraDeslocSuperior", "Aura de Deslocamento Superior: metros extras", "n", 9],
    ["treino.fortalecimentoMental", "Fortalecimento Mental: multiplicador do Núcleo", "n", 1],
    ["treino.corredor", "Corredor: deslocamento (m)", "n", 3],
    ["treino.magiaPotente", "Magia Potente: multiplicador da Inteligência", "n", 1],
    ["treino.menteBlindada", "Mente Blindada: bônus de Sanidade", "n", 5],
    ["treino.meditacaoNucleo", "Meditação de Núcleo: PM no descanso curto", "d", "1d6"],
    ["treino.estrategista", "Estrategista: bônus nos testes do plano", "n", 3]
  ]]
];

const PADROES = Object.fromEntries(CAMPOS_NUMEROS.flatMap(([, l]) => l.map(([k, , , v]) => [k, v])));
let atuais = { ...PADROES };

/** Valor atual de um campo (ex.: num("treino.corredor")). */
export const num = chave => atuais[chave] ?? PADROES[chave];
export const padraoNumero = chave => PADROES[chave];

/** Aplica os valores salvos (objeto chave → valor). Valores vazios voltam ao padrão. */
export function aplicarNumeros(salvos = {}) {
  atuais = { ...PADROES };
  for (const [k, v] of Object.entries(salvos ?? {})) {
    if (!(k in PADROES) || v === "" || v === null || v === undefined) continue;
    if (typeof PADROES[k] === "number") { const x = Number(v); if (Number.isFinite(x)) atuais[k] = x; }
    else if (/^[\dd+\-\s]+$/i.test(String(v).trim())) atuais[k] = String(v).trim();
  }
  const E = ARQUETIPOS.combatente.estilos;
  for (const k of Object.keys(PADROES)) {
    if (!k.startsWith("estilo.")) continue;
    const [, est, campo] = k.split(".");
    if (E[est]) E[est][campo] = atuais[k];
  }
  const T = n => atuais[`estilo.${n}`];
  E.defensivo.texto = `Usando Escudo ou Armadura: +${T("defensivo.defesa")} Defesa (Bloqueio) e +${T("defensivo.ca")} CA.`;
  E.duelista.texto = `Enfrentando um inimigo isoladamente: +${T("duelista.acertoIsolado")} Acerto.`;
  E.bebado.texto = `Com a condição Bêbado, as penalidades viram +${T("bebado.acerto")} Acerto, +${T("bebado.esquiva")} Esquiva e +${T("bebado.ca")} CA. Ainda fica Exausto e Desequilibrado depois de 2 horas.`;
  E.atirador.texto = `Atacando com arma à distância, pode abrir mão do modificador de dano para aumentar a margem de crítico em ${T("atirador.margem")}.`;
  E.longo.texto = `Arma à distância Pesada ou Enorme: +${T("longo.dano")} de dano. Também pode atacar corpo a corpo desarmado com +${T("longo.desarmado")} de dano.`;
  E.dupla.texto = `Usando duas ou mais armas: +${T("dupla.acerto")} Acerto e +${T("dupla.ca")} CA.`;
  return atuais;
}
