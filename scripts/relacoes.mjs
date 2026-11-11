/**
 * Relações entre personagens: conectar fichas, revelar o background pela afinidade
 * e a "Relação múltipla" do Mestre (mudar a afinidade de vários de uma vez).
 */
import { FLAG, AFINIDADE, TIPOS_RELACAO, TEXTOS_SOBRE } from "./config.mjs";
import { int, novoId, normalizarDados } from "./data.mjs";
import { conteudoRevelacoes } from "./context.mjs";
import { fvtt, enriquecer, escapar } from "./helpers.mjs";
import { ajustes } from "./settings.mjs";

const P = `flags.${FLAG}`;

/** Ator de uma relação, sem esperar (fromUuidSync), ou null. */
export function atorDaRelacao(uuid) {
  if (!uuid) return null;
  try {
    const doc = fromUuidSync(uuid);
    return doc?.documentName === "Actor" ? doc : null;
  } catch {
    return null;
  }
}

/**
 * Dados do parceiro para a aba Relações: nome e imagem atuais e o conteúdo de cada parte
 * do background (com o HTML já enriquecido). Só lê o que o próprio Foundry já entregou.
 */
export async function dadosDoParceiro(uuid) {
  const ator = atorDaRelacao(uuid);
  if (!ator) return null;
  const dados = normalizarDados(ator.flags?.[FLAG] ?? {});
  const ricos = {};
  for (const t of TEXTOS_SOBRE) {
    const valor = dados.sobre?.[t.id] ?? "";
    ricos[t.id] = valor ? await enriquecer(valor, { relativeTo: ator, secrets: false }) : "";
  }
  return { uuid: ator.uuid, name: ator.name, img: ator.img, dados, revelacoes: conteudoRevelacoes(dados, ricos), jogador: eDeJogador(ator) };
}

const temRelacao = (actor, uuid) => Object.values(actor.flags?.[FLAG]?.relacoes ?? {}).some(r => r?.uuid === uuid);

function novaEntrada(ator, tipo = "aliado", afinidade = 0) {
  return { nome: ator.name, img: ator.img, uuid: ator.uuid, tipo, afinidade, notas: "", criado: Date.now() };
}

/** Pode guardar dados EPM neste ator? (personagens e NPCs do dnd5e) */
const usaFichaEPM = ator => ["character", "npc"].includes(ator?.type);

/**
 * Cria a relação de `actor` com `outro`. Se quem está usando pode editar o outro ator
 * (e a opção estiver ligada), cria também a relação de volta.
 */
export async function conectar(actor, outro, { tipo = "aliado" } = {}) {
  if (!outro || outro.uuid === actor.uuid) return false;
  if (temRelacao(actor, outro.uuid)) {
    ui.notifications.info(`${outro.name} já está nas relações.`);
    return false;
  }
  await actor.update({ [`${P}.relacoes.${novoId()}`]: novaEntrada(outro, tipo) });
  if (ajustes().relacaoMutua && usaFichaEPM(outro) && outro.isOwner && !temRelacao(outro, actor.uuid)) {
    await outro.update({ [`${P}.relacoes.${novoId()}`]: novaEntrada(actor, tipo) });
    ui.notifications.info(`${actor.name} e ${outro.name} agora estão conectados nas duas fichas.`);
  }
  return true;
}

function atoresVisiveis(excluir = []) {
  return (game.actors?.contents ?? [])
    .filter(a => !excluir.includes(a.uuid) && (game.user.isGM || a.testUserPermission(game.user, "LIMITED")))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/** Diálogo para escolher um ou mais personagens (com busca). */
async function escolherAtores({ titulo, excluir = [], multiplos = false, dica = "", extra = "" }) {
  const lista = atoresVisiveis(excluir);
  if (!lista.length) {
    ui.notifications.info("Não há outros personagens disponíveis.");
    return null;
  }
  const linhas = lista.map(a => `
    <label class="epm-escolha-ator" data-nome="${escapar(a.name.toLowerCase())}">
      <input type="${multiplos ? "checkbox" : "radio"}" name="ator" value="${a.uuid}">
      <img src="${escapar(a.img)}" alt=""><span>${escapar(a.name)}</span>
      <em>${a.type === "character" ? "Personagem" : "NPC"}${a.hasPlayerOwner ? ", de jogador" : ""}</em>
    </label>`).join("");
  const r = await fvtt.DialogV2.wait({
    window: { title: titulo }, classes: ["epm-dialogo", "epm-dialogo-atores"], rejectClose: false, modal: true,
    position: { width: 460 },
    content: `${dica ? `<p class="epm-dica">${dica}</p>` : ""}${extra}
      <input type="search" class="epm-busca-ator" placeholder="Buscar pelo nome" aria-label="Buscar">
      <div class="epm-lista-atores">${linhas}</div>`,
    render: (ev, arg) => {
      const raiz = arg instanceof HTMLElement ? arg : (arg?.element ?? ev?.target?.element);
      const busca = raiz?.querySelector(".epm-busca-ator");
      busca?.addEventListener("input", () => {
        const t = busca.value.trim().toLowerCase();
        for (const l of raiz.querySelectorAll(".epm-escolha-ator")) l.hidden = !!t && !l.dataset.nome.includes(t);
      });
    },
    buttons: [
      {
        action: "ok", label: multiplos ? "Aplicar" : "Conectar", icon: "fa-solid fa-check", default: true,
        callback: (ev, b) => {
          const f = b.form.elements;
          const marcados = [...b.form.querySelectorAll('input[name="ator"]:checked')].map(i => i.value);
          return { uuids: marcados, delta: f.delta?.value, tipo: f.tipo?.value, origem: f.origem?.value, mutua: !!f.mutua?.checked };
        }
      },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  return r && typeof r === "object" ? r : null;
}

export async function dialogoConectar(actor) {
  const excluir = [actor.uuid, ...Object.values(actor.flags?.[FLAG]?.relacoes ?? {}).map(r => r?.uuid).filter(Boolean)];
  const r = await escolherAtores({
    titulo: `Conectar a ${actor.name}`, excluir,
    dica: "Nome e imagem passam a vir da ficha escolhida. Conforme a afinidade sobe, partes do background dela são reveladas."
  });
  const uuid = r?.uuids?.[0];
  if (!uuid) return;
  const outro = atorDaRelacao(uuid);
  if (outro) await conectar(actor, outro);
}

/**
 * Relação múltipla (Mestre): `origem` muda a afinidade com vários personagens de uma vez
 * (ex.: um NPC ganha +1 com o grupo todo). Cria a relação onde ela não existe.
 */
export async function relacaoMultipla(origemPadrao = null) {
  if (!game.user.isGM) return ui.notifications.warn("Só o Mestre usa a relação múltipla.");
  const todos = atoresVisiveis();
  const opcoes = todos.map(a => `<option value="${a.uuid}" ${a.uuid === origemPadrao?.uuid ? "selected" : ""}>${escapar(a.name)}</option>`).join("");
  const tipos = Object.entries(TIPOS_RELACAO).map(([id, l]) => `<option value="${id}">${escapar(l)}</option>`).join("");
  const extra = `
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Quem</span><select name="origem">${opcoes}</select></label>
      <label class="epm-campo"><span>Afinidade (+ ou −)</span><input type="number" name="delta" value="1" step="1"></label>
    </div>
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Tipo, se a relação for nova</span><select name="tipo">${tipos}</select></label>
      <label class="epm-check"><input type="checkbox" name="mutua" checked> Mudar também na ficha de quem</label>
    </div>
    <p class="epm-dica">Marque com quem a afinidade muda:</p>`;
  const r = await escolherAtores({ titulo: "Relação múltipla", multiplos: true, extra });
  if (!r?.uuids?.length) return;
  const origem = atorDaRelacao(r.origem);
  if (!origem) return ui.notifications.warn("Escolha quem muda a relação.");
  const delta = int(r.delta);
  const alvos = r.uuids.map(atorDaRelacao).filter(a => a && a.uuid !== origem.uuid);
  const nomes = [];
  for (const alvo of alvos) {
    await mudarAfinidade(alvo, origem, delta, r.tipo);
    if (r.mutua && usaFichaEPM(origem)) await mudarAfinidade(origem, alvo, delta, r.tipo);
    nomes.push(alvo.name);
  }
  if (!nomes.length) return;
  return ChatMessage.create({
    whisper: [game.user.id],
    content: `<div class="epm-chat epm-chat-nota"><p><strong>Relação múltipla</strong>: ${escapar(origem.name)} ${delta >= 0 ? "+" : "−"}${Math.abs(delta)} de afinidade com ${escapar(nomes.join(", "))}.</p></div>`
  });
}

/** Soma `delta` à afinidade de `ator` com `com` (cria a relação se não existir). */
export async function mudarAfinidade(ator, com, delta, tipo = "aliado") {
  if (!usaFichaEPM(ator)) return;
  const relacoes = ator.flags?.[FLAG]?.relacoes ?? {};
  const existente = Object.entries(relacoes).find(([, x]) => x?.uuid === com.uuid);
  const limitarAf = v => Math.max(AFINIDADE.min, Math.min(AFINIDADE.max, v));
  if (existente) {
    return ator.update({ [`${P}.relacoes.${existente[0]}.afinidade`]: limitarAf(int(existente[1].afinidade) + delta) });
  }
  return ator.update({ [`${P}.relacoes.${novoId()}`]: novaEntrada(com, TIPOS_RELACAO[tipo] ? tipo : "aliado", limitarAf(delta)) });
}

/** Personagem de jogador? (afinidade entre jogadores é decidida por eles; com NPCs, só pelo Mestre) */
export function eDeJogador(ator) {
  return !!ator && ator.type === "character" && !!ator.hasPlayerOwner;
}
