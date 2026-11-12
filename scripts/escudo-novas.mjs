/**
 * Escudo do Mestre: regras opcionais, listas do Mestre e botões das novas mecânicas
 * (Inspiração para vários, feitos, Aura de Horror, acúmulos na grade de condições).
 */
import { MODULE_ID, FLAG } from "./config.mjs";
import {
  REGRAS_OPCIONAIS, regrasLigadas, eventosAfinidade, tabelaTraumas, listaFeitos, danoAcumulos,
  TRAUMAS_PADRAO, AUTO_FEITOS, ACUMULAVEIS, DANO_ACUMULO_PADRAO, regra
} from "./opcionais.mjs";

const partes = linha => String(linha).split("|").map(t => t.trim());
const linhas = texto => String(texto ?? "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const slug = t => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Listas em texto (uma linha por item) para os campos do Escudo. */
export function textosListas() {
  return {
    eventos: eventosAfinidade().map(e => `${e.nome} | ${e.delta > 0 ? "+" : ""}${e.delta}`).join("\n"),
    traumas: tabelaTraumas().map(t => `${t.nome} | ${t.texto}`).join("\n"),
    feitos: listaFeitos().map(f => [f.nome, f.descricao, f.pev, f.titulo, f.auto].join(" | ").replace(/( \| )+$/, "")).join("\n"),
    acumulos: ACUMULAVEIS.map(id => danoAcumulos()[id]).join(" | ")
  };
}

/** Lê as listas escritas pelo Mestre. Puro (testável). */
export function lerListas({ eventos = "", traumas = "", feitos = "", acumulos = "" } = {}) {
  const ev = linhas(eventos).map(l => { const [nome, d] = partes(l); return { nome, delta: Math.trunc(Number(String(d ?? "").replace(/[^\d+-]/g, "")) || 0) }; })
    .filter(e => e.nome && e.delta);
  const tr = linhas(traumas).map(l => {
    const [nome, ...resto] = partes(l);
    const padrao = TRAUMAS_PADRAO.find(t => slug(t.nome) === slug(nome));
    return { id: padrao?.id ?? slug(nome), nome, texto: resto.join(" | ") || padrao?.texto || "" };
  }).filter(t => t.nome);
  const fe = linhas(feitos).map(l => {
    const [nome, descricao = "", pev = "0", titulo = "", auto = ""] = partes(l);
    return { id: slug(nome), nome, descricao, pev: Math.max(0, Math.trunc(Number(pev) || 0)), titulo, auto: AUTO_FEITOS[auto] !== undefined ? auto : "" };
  }).filter(f => f.nome);
  const dados = partes(acumulos);
  const ac = Object.fromEntries(ACUMULAVEIS.map((id, i) => [id, /^\d*d\d+/i.test(dados[i] ?? "") ? dados[i] : DANO_ACUMULO_PADRAO[id]]));
  return { eventos: ev, traumas: tr, feitos: fe, acumulos: ac };
}

export function contextoEscudoNovas() {
  const regras = regrasLigadas();
  return {
    regras, lista: REGRAS_OPCIONAIS.map(r => ({ ...r, ligado: !!regras[r.id] })),
    textos: textosListas(), feitos: regras.feitos ? listaFeitos() : []
  };
}

/** Grade de condições do Escudo: aplicar de novo uma acumulável (com todos já nela) soma um acúmulo. */
export async function acumularNoEscudo(atores, id) {
  if (!regra("acumulos") || !ACUMULAVEIS.includes(id)) return false;
  for (const a of atores) await a.toggleStatusEffect(id, { active: true });
  return true;
}

export async function acaoEscudo(app, op, alvo) {
  if (op === "regra") {
    const atual = regrasLigadas();
    return game.settings.set(MODULE_ID, "regrasOpcionais", { ...atual, [alvo.dataset.chave]: !atual[alvo.dataset.chave] });
  }
  if (op === "salvarListas") {
    const raiz = app.element;
    const ler = k => raiz.querySelector(`[data-lista="${k}"]`)?.value;
    const l = lerListas({ eventos: ler("eventos"), traumas: ler("traumas"), feitos: ler("feitos"), acumulos: ler("acumulos") });
    await game.settings.set(MODULE_ID, "eventosAfinidade", l.eventos);
    if (ler("traumas") !== undefined) await game.settings.set(MODULE_ID, "tabelaTraumas", l.traumas);
    if (ler("feitos") !== undefined) await game.settings.set(MODULE_ID, "listaFeitos", l.feitos);
    if (ler("acumulos") !== undefined) await game.settings.set(MODULE_ID, "danoAcumulos", l.acumulos);
    return ui.notifications.info("Listas salvas.");
  }
  const { atores } = app._alvos();
  const fichas = atores.filter(a => a?.flags?.[FLAG]);
  if (op === "inspiracao") {
    if (!fichas.length) return ui.notifications.warn("Marque os personagens.");
    const { darInspiracao } = await import("./cooperacao.mjs");
    return darInspiracao(fichas, 1);
  }
  if (op === "feito") {
    if (!fichas.length) return ui.notifications.warn("Marque os personagens.");
    const id = app.element.querySelector("[data-feito-escolha]")?.value;
    const { darFeito } = await import("./opcionais-acoes.mjs");
    return darFeito(fichas, id);
  }
  if (op === "emboscada") {
    const { emboscada } = await import("./opcionais-acoes.mjs");
    return emboscada(app._grupo());
  }
  if (op === "aura") {
    const criatura = canvas?.tokens?.controlled?.[0]?.actor ?? null;
    if (!criatura) return ui.notifications.warn("Selecione o token da criatura com Aura de Horror.");
    const vendo = fichas.filter(a => a.uuid !== criatura.uuid);
    const lista = vendo.length ? vendo : app._grupo();
    const { auraDeHorror } = await import("./opcionais-acoes.mjs");
    return auraDeHorror(criatura, lista);
  }
}
