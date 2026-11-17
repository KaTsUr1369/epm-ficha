/**
 * O que acontece quando um treinamento do catálogo é concluído (ou deixa de estar concluído):
 *  - ações com custo viram uma habilidade (aba Habilidades → Geral, origem "Treinamento") com formas, custo e frequência;
 *  - Poliglota abre a escolha de idioma; Protagonista avisa o Mestre (1 Inspiração em cada "Início da sessão");
 *  - se o treino volta a não estar concluído (esquecido num Ritual do Vazio, por exemplo), a habilidade sai.
 * E a ligação de treinos antigos ao modelo de mesmo nome (sem perder horas nem estado).
 */
import { FLAG } from "./config.mjs";
import { novoId, formaPadrao } from "./data.mjs";
import { escapar } from "./helpers.mjs";
import { treinoModelo, modeloPorNome, normTreino, horasDoTexto, TREINAMENTOS_LISTA } from "./treinamentos-lista.mjs";

const P = `flags.${FLAG}`;
const COR = "#4E9A8B";
const modeloDe = t => treinoModelo(t?.modelo) ?? modeloPorNome(t?.nome);
const nota = (actor, html, whisper = null) => ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor }), ...(whisper ? { whisper } : {}),
  content: `<div class="epm-chat epm-chat-nota epm-chat-treino" style="--epm-cor-cartao:${COR}">${html}</div>`
});

/** Dados do item de habilidade de um treino (formas vindas do catálogo). */
export function dadosHabilidadeTreino(e, idTreino) {
  const formas = {};
  (e.auto?.acoes ?? []).forEach((a, ordem) => {
    formas[novoId()] = { ...formaPadrao(ordem, a.nome), ...a, ordem, nome: a.nome, custo: { ...a.custo }, teste: { ...a.teste }, dano: { ...a.dano } };
  });
  return {
    name: e.nome, type: "feat", img: "icons/svg/upgrade.svg",
    system: { description: { value: `<p>${escapar(e.beneficios)}</p><p class="epm-dica">Treinamento (${escapar(e.nome)}).</p>` } },
    flags: { [FLAG]: { origem: "treinamento", raridade: "comum", foraDoLimite: true, treinoRef: idTreino, treinoModelo: e.id, formas } }
  };
}

/** Aplica (ou desfaz) a conclusão dos treinos da ficha. Idempotente. */
export async function aplicarConclusoes(actor, { perguntar = true, avisar = true } = {}) {
  if (!actor?.isOwner) return [];
  const treinos = actor.flags?.[FLAG]?.treinamentos ?? {};
  const itens = actor.items?.contents ?? actor.items ?? [];
  const feitos = [];
  const upd = {};
  const criar = [];
  const apagar = [];
  for (const [id, t] of Object.entries(treinos)) {
    if (!t) continue;
    const e = modeloDe(t);
    const concluido = t.estado === "concluido";
    const temItem = itens.find(i => i.flags?.[FLAG]?.treinoRef === id);
    if (concluido && !t.aplicado) {
      if (e?.auto?.acoes?.length && !temItem) { criar.push(dadosHabilidadeTreino(e, id)); feitos.push(`${e.nome}: habilidade na aba Habilidades`); }
      upd[`${P}.treinamentos.${id}.aplicado`] = true;
      if (e?.auto?.concluir === "poliglota" && perguntar) await escolherIdioma(actor, t);
      if (e?.auto?.concluir === "protagonista" && avisar) await avisarProtagonista(actor);
    } else if (!concluido && t.aplicado) {
      if (temItem) apagar.push(temItem.id);
      upd[`${P}.treinamentos.${id}.aplicado`] = false;
    }
  }
  // Habilidade de treino que perdeu o treino (apagado)
  for (const i of itens) {
    const ref = i.flags?.[FLAG]?.treinoRef;
    if (ref && !treinos[ref] && !apagar.includes(i.id)) apagar.push(i.id);
  }
  if (criar.length) await actor.createEmbeddedDocuments("Item", criar);
  if (apagar.length) await actor.deleteEmbeddedDocuments("Item", apagar);
  if (Object.keys(upd).length) await actor.update(upd);
  if (feitos.length && avisar) await nota(actor, `<p><i class="fa-solid fa-dumbbell" aria-hidden="true"></i> <strong>${escapar(actor.name)}</strong>: ${feitos.map(escapar).join("; ")}.</p>`);
  return feitos;
}

/** Poliglota: escolhe o idioma aprendido. */
async function escolherIdioma(actor, t) {
  const { catalogoIdiomas, adicionarIdioma } = await import("./idiomas.mjs");
  const { formulario } = await import("./mundo.mjs");
  let opcoes = [];
  try { opcoes = catalogoIdiomas().map(l => l.label); } catch { opcoes = []; }
  const r = await formulario("Poliglota: idioma novo", `
    <p class="epm-dica">${escapar(actor.name)} concluiu Poliglota e aprende 1 idioma.</p>
    <label class="epm-campo"><span>Idioma</span><select name="idioma"><option value="">—</option>${opcoes.map(o => `<option value="${escapar(o)}">${escapar(o)}</option>`).join("")}</select></label>
    <label class="epm-campo"><span>ou outro</span><input type="text" name="outro"></label>`, { botao: "Aprender" });
  const idioma = String(r?.outro ?? "").trim() || String(r?.idioma ?? "").trim();
  if (!idioma) return ui.notifications.info("Sem idioma escolhido: adicione na aba Sobre quando decidir.");
  await adicionarIdioma(actor, idioma);
  return nota(actor, `<p><i class="fa-solid fa-language" aria-hidden="true"></i> <strong>${escapar(actor.name)}</strong> aprendeu <strong>${escapar(idioma)}</strong> (Poliglota).</p>`);
}

async function avisarProtagonista(actor) {
  const gms = [...(game.users ?? [])].filter(u => u.isGM).map(u => u.id);
  return nota(actor, `<p><i class="fa-solid fa-star" aria-hidden="true"></i> <strong>${escapar(actor.name)}</strong> concluiu <strong>Protagonista</strong>: começa cada sessão com 1 Inspiração de Tema.
    Use <strong>Início da sessão</strong> no Escudo do Mestre para dar a Inspiração.</p>`, gms);
}

/** Escudo: marca o início da sessão. Quem tem Protagonista ganha 1 Inspiração de Tema. */
export async function inicioDaSessao() {
  if (!game.user?.isGM) return;
  const { darInspiracao } = await import("./cooperacao.mjs");
  const { especiaisDaFicha } = await import("./treinamentos-lista.mjs");
  const protagonistas = game.actors.filter(a => a.flags?.[FLAG] && especiaisDaFicha(a.flags[FLAG]).has("protagonista"));
  if (protagonistas.length) await darInspiracao(protagonistas, 1);
  await ChatMessage.create({ content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#E8C547"><p><i class="fa-solid fa-flag-checkered" aria-hidden="true"></i> <strong>Começou a sessão.</strong>${protagonistas.length ? ` Protagonista: +1 Inspiração para ${escapar(protagonistas.map(a => a.name).join(", "))}.` : ""}</p></div>` });
  return protagonistas.length;
}

/* -------------------------------------------- */
/*  Ligar treinos antigos ao modelo             */
/* -------------------------------------------- */

/** Números do treino da ficha × do modelo: [{ campo, ficha, modelo }] (vazio = iguais). */
export function diferencasDoModelo(t, e) {
  const unidade = { horas: 1, dias: 8, semanas: 56, meses: 240 }[t?.unidade] ?? 1;
  const horasFicha = Math.round((Number(t?.tempo) || 0) * unidade);
  const dif = [];
  if (horasFicha && horasFicha !== e.horas) dif.push({ campo: "tempo", ficha: `${horasFicha} h`, modelo: `${e.horas} h` });
  if (t?.pt !== undefined && t.pt !== "" && Number(t.pt) !== e.pt) dif.push({ campo: "PT", ficha: String(t.pt), modelo: String(e.pt) });
  return dif;
}

/**
 * Migração: treinos com o mesmo nome de um modelo ganham o modelo (horas e estado ficam).
 * Números iguais: liga sozinho. Diferentes: marca `modeloPendente` e a ficha pede confirmação.
 */
export function trocasLigacaoModelos(dados = {}) {
  const upd = {};
  for (const [id, t] of Object.entries(dados.treinamentos ?? {})) {
    if (!t || t.modelo || t.modeloPendente) continue;
    const e = modeloPorNome(t.nome);
    if (!e) continue;
    if (diferencasDoModelo(t, e).length) upd[`${P}.treinamentos.${id}.modeloPendente`] = e.id;
    else {
      upd[`${P}.treinamentos.${id}.modelo`] = e.id;
      if (!t.especial && e.auto?.especial) upd[`${P}.treinamentos.${id}.especial`] = e.auto.especial;
    }
  }
  return upd;
}

/** Botão "Ligar ao modelo" (treino com números diferentes): confirma e usa os números do catálogo, sem perder horas nem estado. */
export async function confirmarLigacao(actor, id) {
  const t = actor.flags?.[FLAG]?.treinamentos?.[id];
  const e = treinoModelo(t?.modeloPendente) ?? modeloPorNome(t?.nome);
  if (!t || !e) return;
  const dif = diferencasDoModelo(t, e);
  const { confirmar } = await import("./mecanicas.mjs");
  const ok = await confirmar("Ligar ao modelo", `<p><strong>${escapar(t.nome)}</strong> tem números diferentes do catálogo:</p>
    <ul>${dif.map(d => `<li>${escapar(d.campo)}: na ficha ${escapar(d.ficha)}, no catálogo ${escapar(d.modelo)}</li>`).join("") || "<li>nenhuma diferença</li>"}</ul>
    <p>Ligar ao modelo e usar os números do catálogo? As horas feitas e o estado continuam.</p>`);
  if (!ok) return;
  const upd = { [`${P}.treinamentos.${id}.modelo`]: e.id, [`${P}.treinamentos.${id}.-=modeloPendente`]: null,
    [`${P}.treinamentos.${id}.tempo`]: e.horas, [`${P}.treinamentos.${id}.unidade`]: "horas", [`${P}.treinamentos.${id}.pt`]: e.pt };
  if (!t.especial && e.auto?.especial) upd[`${P}.treinamentos.${id}.especial`] = e.auto.especial;
  await actor.update(upd);
  ui.notifications.info(`"${t.nome}" ligado ao modelo com os números do catálogo.`);
}

/** Hook: depois de mudar os treinos (no cliente de quem mudou), aplica as conclusões. */
export function registrarConclusoes() {
  Hooks.on("updateActor", (ator, mud, _o, userId) => {
    if (userId !== game.user?.id) return;
    if (!foundry.utils.hasProperty(mud, `flags.${FLAG}.treinamentos`)) return;
    aplicarConclusoes(ator).catch(err => console.warn("EPM | conclusão de treino", err));
  });
}

export { TREINAMENTOS_LISTA, horasDoTexto, normTreino };
