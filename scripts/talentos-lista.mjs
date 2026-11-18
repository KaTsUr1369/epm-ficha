/**
 * Os antigos Talentos viraram treinamentos do catálogo (0.8.20).
 * Este arquivo liga a automação deles (bônus fixos, opções no ataque, Sortudo, Escolhido, Robusto, Forja…)
 * aos treinos CONCLUÍDOS da ficha. Os dados ficam em treinos-talentos.mjs.
 */
import { normTreino } from "./treinamentos-lista.mjs";
import { TALENTOS_DADOS } from "./treinos-talentos.mjs";

export {
  ROBUSTO_PV_POR_NIVEL, SORTE_POR_DIA, SANGUE_PV_POR_PM, FURIA, AFINIDADE_INICIAL, FREQUENCIAS_TALENTO, CATEGORIAS_TALENTOS, FAIXAS_TALENTO,
  TALENTOS_DADOS, TREINO_POR_FAIXA
} from "./treinos-talentos.mjs";

const PorId = new Map(TALENTOS_DADOS.map(e => [e.id, e]));
const PorNome = new Map(TALENTOS_DADOS.map(e => [normTreino(e.nome), e]));

/** Dados do antigo talento (com a automação original em auto). */
export const talentoModelo = id => PorId.get(id) ?? null;
/** Pelo nome, ignorando a escolha entre parênteses ("Afinidade Elemental (Fogo)"). */
export const talentoPorNome = nome => PorNome.get(normTreino(String(nome ?? "").replace(/\s*\(.*\)\s*$/, ""))) ?? null;
/** Antigo talento de um treino da ficha (pelo modelo ou pelo nome). */
export const modeloDoTalento = t => talentoModelo(t?.modelo) ?? talentoPorNome(t?.nome);

/** Treinos concluídos que vieram dos talentos: [{ id, t, modelo }]. */
export function talentosAtivos(dados = {}) {
  return Object.entries(dados?.treinamentos ?? {})
    .filter(([, t]) => t && t.estado === "concluido")
    .map(([id, t]) => ({ id, t, modelo: modeloDoTalento(t) }))
    .filter(x => x.modelo);
}

/** A ficha concluiu o treino (antigo talento)? */
export const temTalento = (dados, modeloId) => talentosAtivos(dados).some(x => x.modelo?.id === modeloId);
