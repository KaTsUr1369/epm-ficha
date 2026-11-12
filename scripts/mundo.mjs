/**
 * Mundo (0.6.0): o que o Mestre controla para a mesa inteira, no Escudo → Mundo.
 * Códigos de recompensa, enquetes, relógios de urgência, regiões (passaporte, idioma, tecnologia e densidade de mana),
 * compêndio do mundo, conhecimento de criaturas, chefes com fases, calculadora de encontro, ficha rápida de NPC
 * e avisos no Discord. Jogadores leem as configurações do mundo e pedem as gravações ao Mestre pelo socket.
 */
import { FLAG, MODULE_ID, ATRIBUTOS } from "./config.mjs";
import { int, num, novoId, normalizarTexto } from "./data.mjs";
import { fvtt, escapar } from "./helpers.mjs";
import { lerMundo, conteudoNotion } from "./settings.mjs";
import { estadoAtor, rolarTeste } from "./mecanicas.mjs";
import { RACAS, racaPorId } from "./racas.mjs";
import { PATENTES, maximoRecurso, faixaPorNivel } from "./regras-extras.mjs";
import { ARMAS_REGIAO, ARMADURAS_REGIAO, REGIOES } from "./catalogos.mjs";

const P = `flags.${FLAG}`;
const CANAL = `module.${MODULE_ID}`;

/* -------------------------------------------- */
/*  Utilitários                                 */
/* -------------------------------------------- */

export const souMestreAtivo = () => !!game.user?.isGM && (!game.users?.activeGM || game.users.activeGM.isSelf);

async function gravar(chave, valor) {
  await game.settings.set(MODULE_ID, chave, valor);
  redesenharEscudo();
}

function redesenharEscudo() {
  for (const app of foundry.applications?.instances?.values?.() ?? []) {
    if (app?.id === "epm-escudo-mestre" && app.rendered) app.render();
  }
}

function redesenharFichas() {
  for (const app of foundry.applications?.instances?.values?.() ?? []) {
    if (app?.document?.documentName === "Actor" && app.rendered) app.render();
  }
}

/** Diálogo com formulário: devolve os campos (nome[] vira lista) ou null. */
export async function formulario(titulo, html, { botao = "Confirmar", largura = 520 } = {}) {
  try {
    const r = await fvtt.DialogV2.wait({
      window: { title: titulo }, classes: ["epm-dialogo", "epm-dialogo-060"], position: { width: largura }, rejectClose: false, modal: true,
      content: `<div class="epm-form-060">${html}</div>`,
      buttons: [
        { action: "ok", label: botao, icon: "fa-solid fa-check", default: true, callback: (ev, b) => {
          const out = {};
          for (const [k, v] of new FormData(b.form).entries()) {
            if (k.endsWith("[]")) (out[k.slice(0, -2)] ??= []).push(v);
            else out[k] = v;
          }
          for (const cx of b.form.querySelectorAll("input[type=checkbox]:not([name$='[]'])")) out[cx.name] = cx.checked;
          return out;
        } },
        { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
      ]
    });
    return r && typeof r === "object" ? r : null;
  } catch (err) {
    console.warn("EPM |", err);
    return null;
  }
}

export const opcoes = (lista, atual = "") => lista.map(([v, l]) => `<option value="${escapar(v)}" ${String(v) === String(atual) ? "selected" : ""}>${escapar(l)}</option>`).join("");
const cartao = (html, cor = "#A47DDB", extra = {}) => ChatMessage.create({ content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:${cor}">${html}</div>`, ...extra });
const personagensDoGrupo = () => game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);

/* -------------------------------------------- */
/*  Socket: jogador pede, Mestre grava          */
/* -------------------------------------------- */

export function registrarSocket() {
  game.socket?.on(CANAL, msg => {
    if (!souMestreAtivo() || !msg?.tipo) return;
    tratarPedido(msg).catch(err => console.error("EPM | pedido do socket", err));
  });
}

/** Faz no Mestre (direto, se for ele; senão pelo socket). */
export async function pedirAoMestre(tipo, dados = {}) {
  const msg = { tipo, dados, userId: game.user.id };
  if (souMestreAtivo()) return tratarPedido(msg);
  if (!game.users?.activeGM) { ui.notifications.warn("Precisa de um Mestre conectado para isso."); return false; }
  game.socket.emit(CANAL, msg);
  return true;
}

async function tratarPedido({ tipo, dados, userId }) {
  if (tipo === "codigoUsado") {
    const cods = foundry.utils.deepClone(lerMundo("codigos", {}));
    if (!cods[dados.id]) return;
    cods[dados.id].usos = { ...(cods[dados.id].usos ?? {}), [dados.chave]: { quem: dados.nome ?? "", quando: Date.now() } };
    return gravar("codigos", cods);
  }
  if (tipo === "codigoGrupo") {
    const c = lerMundo("codigos", {})[dados.id];
    if (!c) return;
    for (const a of personagensDoGrupo()) await aplicarRecompensa(a, c, { silencioso: true });
    await cartao(`<p><strong>Código resgatado para o grupo</strong>: ${escapar(c.codigo)}</p>${textoRecompensa(c)}`, "#C9A24E");
    return tratarPedido({ tipo: "codigoUsado", dados: { id: dados.id, chave: "grupo", nome: dados.nome } });
  }
  if (tipo === "voto") return registrarVoto(dados.messageId, dados.opcao, userId);
  if (tipo === "conhecimento") {
    const mapa = foundry.utils.deepClone(lerMundo("conhecimentoCriaturas", {}));
    if (int(dados.nivel) <= int(mapa[dados.chave]?.nivel)) return;
    mapa[dados.chave] = { nivel: int(dados.nivel), nome: dados.nome ?? dados.chave, por: dados.por ?? "" };
    await gravar("conhecimentoCriaturas", mapa);
    return redesenharFichas();
  }
  if (tipo === "discord") return enviarDiscord(dados.evento, dados.texto);
}

/* -------------------------------------------- */
/*  Avisos no Discord (webhook)                 */
/* -------------------------------------------- */

export const EVENTOS_DISCORD = {
  sessao: "Resumo da sessão (Diário)", nivel: "Subidas de nível", morte: "Quedas a 0 de Vida", bencao: "Bênçãos e maldições ganhas", relogio: "Relógios que encheram"
};

/** Manda uma mensagem para o canal do Discord (só o Mestre ativo envia; jogadores pedem a ele). */
export async function avisarDiscord(evento, texto) {
  const cfg = lerMundo("discord", {});
  if (!cfg?.url || cfg[evento] === false) return;
  return pedirAoMestre("discord", { evento, texto: String(texto ?? "") });
}

async function enviarDiscord(evento, texto) {
  const cfg = lerMundo("discord", {});
  const url = String(cfg?.url ?? "").trim();
  if (!url || cfg[evento] === false) return;
  if (!/^https:\/\/(?:canary\.|ptb\.)?(?:discord|discordapp)\.com\/api\/webhooks\//.test(url)) return console.warn("EPM | Link do webhook do Discord inválido.");
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "Escolhidos pelo Multiverso", content: texto.slice(0, 1900) }) });
  } catch (err) {
    console.warn("EPM | Discord", err);
  }
}

export async function configurarDiscord() {
  const cfg = lerMundo("discord", {});
  const r = await formulario("Avisos no Discord", `
    <p class="epm-dica">No Discord: Configurações do canal → Integrações → Webhooks → Novo webhook → Copiar URL. Só o Mestre envia; o link fica salvo no mundo.</p>
    <label class="epm-campo"><span>Link do webhook</span><input type="text" name="url" value="${escapar(cfg.url ?? "")}" placeholder="https://discord.com/api/webhooks/..."></label>
    ${Object.entries(EVENTOS_DISCORD).map(([id, l]) => `<label class="epm-check"><input type="checkbox" name="${id}" ${cfg[id] !== false ? "checked" : ""}> ${escapar(l)}</label>`).join("")}`, { botao: "Salvar" });
  if (!r) return;
  await gravar("discord", { url: String(r.url ?? "").trim(), ...Object.fromEntries(Object.keys(EVENTOS_DISCORD).map(id => [id, !!r[id]])) });
  ui.notifications.info("Avisos no Discord salvos.");
}

export async function testarDiscord() {
  if (!lerMundo("discord", {})?.url) return ui.notifications.warn("Cole o link do webhook primeiro.");
  await enviarDiscord("teste", "Teste do Escolhidos pelo Multiverso: a ficha está conectada a este canal.");
  ui.notifications.info("Mensagem de teste enviada (confira o canal).");
}

/* -------------------------------------------- */
/*  Códigos de recompensa                       */
/* -------------------------------------------- */

export const MODOS_CODIGO = { unico: "Uso único (o primeiro que digitar)", jogador: "Uma vez por jogador", grupo: "Para o grupo todo (um resgate dá para todos)" };
const normCodigo = t => String(t ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const codigoAleatorio = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

function textoRecompensa(c) {
  const partes = [];
  for (const [k, l] of [["pev", "PEv"], ["pt", "PT"], ["ph", "PH"]]) if (int(c[k])) partes.push(`+${int(c[k])} ${l}`);
  if (c.itemNome) partes.push(`item: ${escapar(c.itemNome)}`);
  if (c.titulo) partes.push(`título: ${escapar(c.titulo)}`);
  return `${partes.length ? `<p>${partes.join(" · ")}</p>` : ""}${c.lore ? `<blockquote class="epm-lore">${escapar(c.lore).replace(/\n/g, "<br>")}</blockquote>` : ""}`;
}

export async function novoCodigo(id = null) {
  const cods = foundry.utils.deepClone(lerMundo("codigos", {}));
  const c = id ? cods[id] ?? {} : {};
  const r = await formulario(id ? "Editar código" : "Novo código de recompensa", `
    <label class="epm-campo"><span>Código</span><input type="text" name="codigo" value="${escapar(c.codigo ?? codigoAleatorio())}"></label>
    <label class="epm-campo"><span>Uso</span><select name="modo">${opcoes(Object.entries(MODOS_CODIGO), c.modo ?? "unico")}</select></label>
    <div class="epm-grade-atributos">
      <label class="epm-campo epm-campo-mini"><span>PEv</span><input type="number" name="pev" value="${int(c.pev)}"></label>
      <label class="epm-campo epm-campo-mini"><span>PT</span><input type="number" name="pt" value="${int(c.pt)}"></label>
      <label class="epm-campo epm-campo-mini"><span>PH</span><input type="number" name="ph" value="${int(c.ph)}"></label>
    </div>
    <label class="epm-campo"><span>Item (UUID; arraste um item do mundo aqui ou deixe vazio)</span><input type="text" name="itemUuid" value="${escapar(c.itemUuid ?? "")}" data-soltar-uuid placeholder="Item.xxxxx"></label>
    <label class="epm-campo"><span>Título (opcional)</span><input type="text" name="titulo" value="${escapar(c.titulo ?? "")}" placeholder="Ex.: Guardião da Torre"></label>
    <label class="epm-campo"><span>Bônus do título (texto)</span><input type="text" name="tituloBonus" value="${escapar(c.tituloBonus ?? "")}"></label>
    <label class="epm-campo"><span>Página de lore (aparece no chat de quem resgatar)</span><textarea name="lore" rows="4">${escapar(c.lore ?? "")}</textarea></label>
    <p class="epm-dica">Dica: esconda o código numa imagem, numa inscrição do mapa ou num evento fora da sessão. O jogador digita na ficha (Principal → Resgatar código).</p>`, { botao: "Salvar", largura: 560 });
  if (!r) return;
  const codigo = normCodigo(r.codigo);
  if (!codigo) return ui.notifications.warn("O código precisa ter letras ou números.");
  if (Object.entries(cods).some(([oid, o]) => oid !== id && normCodigo(o.codigo) === codigo)) return ui.notifications.warn("Já existe um código igual.");
  let itemNome = "";
  if (r.itemUuid) { try { itemNome = (await fromUuid(r.itemUuid))?.name ?? ""; } catch { itemNome = ""; } }
  if (r.itemUuid && !itemNome) ui.notifications.warn("Não achei o item desse UUID; o código foi salvo sem item.");
  cods[id ?? novoId()] = {
    codigo, modo: MODOS_CODIGO[r.modo] ? r.modo : "unico", pev: int(r.pev), pt: int(r.pt), ph: int(r.ph),
    itemUuid: itemNome ? r.itemUuid : "", itemNome, titulo: String(r.titulo ?? "").trim(), tituloBonus: String(r.tituloBonus ?? "").trim(),
    lore: String(r.lore ?? ""), usos: c.usos ?? {}, criado: c.criado ?? Date.now()
  };
  return gravar("codigos", cods);
}

export async function apagarCodigo(id) {
  const cods = foundry.utils.deepClone(lerMundo("codigos", {}));
  delete cods[id];
  await game.settings.set(MODULE_ID, "codigos", {});
  return gravar("codigos", cods);
}

async function aplicarRecompensa(actor, c, { silencioso = false } = {}) {
  const dados = actor.flags?.[FLAG] ?? {};
  const upd = {};
  for (const k of ["pev", "pt", "ph"]) if (int(c[k])) upd[`${P}.pontos.${k}`] = int(dados.pontos?.[k]) + int(c[k]);
  if (c.titulo) upd[`${P}.titulos.${novoId()}`] = { nome: c.titulo, texto: c.tituloBonus ?? "", origem: `Código ${c.codigo}`, criado: Date.now() };
  if (Object.keys(upd).length) await actor.update(upd);
  if (c.itemUuid) {
    try {
      const it = await fromUuid(c.itemUuid);
      if (it) await actor.createEmbeddedDocuments("Item", [it.toObject()]);
    } catch (err) { console.warn("EPM | item do código", err); }
  }
  if (!silencioso) {
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#C9A24E"><p><strong>Código resgatado</strong>: ${escapar(c.codigo)}</p>${textoRecompensa(c)}</div>` });
  }
}

/** Jogador digita um código na ficha. */
export async function resgatarCodigo(actor) {
  const r = await formulario("Resgatar código", `<label class="epm-campo"><span>Código</span><input type="text" name="codigo" autofocus></label>`, { botao: "Resgatar" });
  if (!r) return;
  const alvo = normCodigo(r.codigo);
  const entrada = Object.entries(lerMundo("codigos", {})).find(([, c]) => normCodigo(c.codigo) === alvo);
  if (!alvo || !entrada) return ui.notifications.warn("Código inválido.");
  const [id, c] = entrada;
  const usos = c.usos ?? {};
  if (c.modo === "unico" && Object.keys(usos).length) return ui.notifications.warn("Esse código já foi usado.");
  if (c.modo === "grupo" && usos.grupo) return ui.notifications.warn("O grupo já resgatou esse código.");
  if (c.modo === "jogador" && usos[game.user.id]) return ui.notifications.warn("Você já resgatou esse código.");
  if (c.modo === "grupo") return pedirAoMestre("codigoGrupo", { id, nome: actor.name });
  await aplicarRecompensa(actor, c);
  return pedirAoMestre("codigoUsado", { id, chave: c.modo === "jogador" ? game.user.id : "unico", nome: actor.name });
}

/* -------------------------------------------- */
/*  Enquetes do grupo                           */
/* -------------------------------------------- */

function htmlEnquete(e) {
  const total = Object.keys(e.votos ?? {}).length;
  const contagem = e.opcoes.map((_, i) => Object.values(e.votos ?? {}).filter(v => v === i).length);
  const max = Math.max(0, ...contagem);
  const linhas = e.opcoes.map((o, i) => {
    const pct = total ? Math.round((contagem[i] / total) * 100) : 0;
    const venc = !e.aberta && max > 0 && contagem[i] === max;
    return `<li class="epm-enquete-opcao${venc ? " vencedora" : ""}">
      ${e.aberta ? `<button type="button" class="epm-botao epm-botao-mini" data-epm-action="votar" data-opcao="${i}">Votar</button>` : ""}
      <span class="epm-enquete-texto">${escapar(o)}</span><span class="epm-enquete-barra"><span style="width:${pct}%"></span></span><span class="epm-enquete-n">${contagem[i]}</span></li>`;
  }).join("");
  return `<div class="epm-chat epm-chat-enquete" style="--epm-cor-cartao:#7FB4E6">
    <p><strong><i class="fa-solid fa-square-poll-vertical"></i> ${escapar(e.pergunta)}</strong></p>
    <ul class="epm-enquete">${linhas}</ul>
    <p class="epm-dica">${total} voto(s). ${e.aberta ? "Votação aberta: dá para trocar o voto." : "Votação encerrada."}${e.relogioNome ? ` Ligada ao relógio <em>${escapar(e.relogioNome)}</em>.` : ""}</p>
    ${e.aberta ? `<button type="button" class="epm-botao epm-botao-mini epm-so-mestre" data-epm-action="encerrarEnquete">Encerrar (Mestre)</button>` : ""}
  </div>`;
}

export async function novaEnquete() {
  const rel = Object.entries(lerMundo("relogios", {}));
  const r = await formulario("Nova enquete do grupo", `
    <label class="epm-campo"><span>Pergunta</span><input type="text" name="pergunta" placeholder="Para onde o grupo vai?"></label>
    <label class="epm-campo"><span>Opções (uma por linha)</span><textarea name="opcoes" rows="5" placeholder="Pela floresta&#10;Pela estrada&#10;Esperar a noite"></textarea></label>
    ${rel.length ? `<label class="epm-campo"><span>Avançar um relógio ao encerrar (opcional)</span><select name="relogio"><option value="">Nenhum</option>${opcoes(rel.map(([id, x]) => [id, x.nome]))}</select></label>` : ""}`, { botao: "Abrir votação" });
  if (!r) return;
  const lista = String(r.opcoes ?? "").split("\n").map(t => t.trim()).filter(Boolean).slice(0, 10);
  if (!r.pergunta || lista.length < 2) return ui.notifications.warn("Escreva a pergunta e pelo menos 2 opções.");
  const e = { pergunta: String(r.pergunta), opcoes: lista, votos: {}, aberta: true, relogio: r.relogio || "", relogioNome: r.relogio ? lerMundo("relogios", {})[r.relogio]?.nome ?? "" : "" };
  return ChatMessage.create({ content: htmlEnquete(e), flags: { [FLAG]: { enquete: e } } });
}

async function registrarVoto(messageId, opcao, userId) {
  const msg = game.messages.get(messageId);
  const e = foundry.utils.deepClone(msg?.flags?.[FLAG]?.enquete);
  if (!e?.aberta || !e.opcoes[int(opcao)]) return;
  e.votos[userId] = int(opcao);
  return msg.update({ content: htmlEnquete(e), [`flags.${FLAG}.enquete`]: e });
}

async function encerrarEnquete(messageId) {
  const msg = game.messages.get(messageId);
  const e = foundry.utils.deepClone(msg?.flags?.[FLAG]?.enquete);
  if (!e?.aberta) return;
  e.aberta = false;
  await msg.update({ content: htmlEnquete(e), [`flags.${FLAG}.enquete`]: e });
  const cont = e.opcoes.map((_, i) => Object.values(e.votos).filter(v => v === i).length);
  const venc = e.opcoes.filter((_, i) => cont[i] === Math.max(...cont) && cont[i] > 0);
  if (e.relogio && lerMundo("relogios", {})[e.relogio]) {
    const passos = await formulario("Enquete encerrada", `<p>Resultado: <strong>${escapar(venc.join(" / ") || "sem votos")}</strong>.</p>
      <label class="epm-campo"><span>Avançar o relógio "${escapar(e.relogioNome)}" em</span><input type="number" name="n" value="1"></label>`, { botao: "Aplicar" });
    if (passos && int(passos.n)) await avancarRelogio(e.relogio, int(passos.n));
  }
}

/* -------------------------------------------- */
/*  Relógios de Urgência                        */
/* -------------------------------------------- */

export const TAMANHOS_RELOGIO = [4, 6, 8, 12];

/** SVG de um relógio (pizza com N fatias, `atual` preenchidas). */
export function svgRelogio(partes, atual, cor = "#D2544A") {
  const n = Math.max(1, int(partes, 4));
  const r = 20;
  const fatias = Array.from({ length: n }, (_, i) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const [x0, y0, x1, y1] = [22 + r * Math.cos(a0), 22 + r * Math.sin(a0), 22 + r * Math.cos(a1), 22 + r * Math.sin(a1)];
    return `<path d="M22 22 L${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="${i < atual ? cor : "transparent"}" stroke="currentColor" stroke-width="1.2"/>`;
  }).join("");
  return `<svg class="epm-relogio-svg" viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">${fatias}</svg>`;
}

export async function novoRelogio(id = null) {
  const rels = foundry.utils.deepClone(lerMundo("relogios", {}));
  const x = id ? rels[id] ?? {} : {};
  const r = await formulario(id ? "Editar relógio" : "Novo relógio de urgência", `
    <label class="epm-campo"><span>Nome</span><input type="text" name="nome" value="${escapar(x.nome ?? "")}" placeholder="Alarme do castelo"></label>
    <label class="epm-campo"><span>Partes</span><select name="partes">${opcoes(TAMANHOS_RELOGIO.map(t => [t, `${t} partes`]), x.partes ?? 6)}</select></label>
    <label class="epm-check"><input type="checkbox" name="visivel" ${x.visivel !== false ? "checked" : ""}> Visível para os jogadores</label>
    <label class="epm-check"><input type="checkbox" name="aFavor" ${x.aFavor ? "checked" : ""}> A favor do grupo (pesquisa, fuga, conserto)</label>
    <label class="epm-campo"><span>Quando encher (o que acontece)</span><input type="text" name="efeito" value="${escapar(x.efeito ?? "")}" placeholder="Reforços chegam"></label>
    <label class="epm-campo"><span>Dano de Sanidade ao encher (opcional)</span><input type="text" name="sanidade" value="${escapar(x.sanidade ?? "")}" placeholder="1d6"></label>
    <p class="epm-dica">Avança com falha ligada à ameaça (+1), falha crítica (+2), tempo ou barulho.</p>`, { botao: "Salvar" });
  if (!r) return;
  rels[id ?? novoId()] = {
    nome: String(r.nome || "Relógio"), partes: TAMANHOS_RELOGIO.includes(int(r.partes)) ? int(r.partes) : 6, atual: Math.min(int(x.atual), int(r.partes, 6)),
    visivel: !!r.visivel, aFavor: !!r.aFavor, efeito: String(r.efeito ?? ""), sanidade: String(r.sanidade ?? "").trim(), criado: x.criado ?? Date.now()
  };
  await gravar("relogios", rels);
  redesenharFichas();
}

export async function avancarRelogio(id, passos = 1) {
  const rels = foundry.utils.deepClone(lerMundo("relogios", {}));
  const x = rels[id];
  if (!x) return;
  const antes = int(x.atual);
  x.atual = Math.max(0, Math.min(int(x.partes), antes + passos));
  await gravar("relogios", rels);
  redesenharFichas();
  const cor = x.aFavor ? "#5FB38A" : "#D2544A";
  if (x.atual === int(x.partes) && antes < x.atual) {
    const san = x.sanidade ? `<p><button type="button" class="epm-botao epm-botao-mini" data-epm-action="sanidadeCartao" data-formula="${escapar(x.sanidade)}" data-rotulo="${escapar(x.nome)}">Sofrer dano de Sanidade (${escapar(x.sanidade)})</button></p>` : "";
    await cartao(`<div class="epm-relogio-chat">${svgRelogio(x.partes, x.atual, cor)}<div><p><strong>${escapar(x.nome)}</strong> encheu!</p>${x.efeito ? `<p>${escapar(x.efeito)}</p>` : ""}${san}</div></div>`, cor,
      x.visivel ? {} : { whisper: game.users.filter(u => u.isGM).map(u => u.id) });
    await avisarDiscord("relogio", `⏰ O relógio **${x.nome}** encheu!${x.efeito ? ` ${x.efeito}` : ""}`);
  } else if (x.visivel && passos > 0) {
    await cartao(`<div class="epm-relogio-chat">${svgRelogio(x.partes, x.atual, cor)}<p><strong>${escapar(x.nome)}</strong>: ${x.atual} de ${x.partes}.</p></div>`, cor);
  }
}

export async function apagarRelogio(id) {
  const rels = foundry.utils.deepClone(lerMundo("relogios", {}));
  delete rels[id];
  await game.settings.set(MODULE_ID, "relogios", {});
  await gravar("relogios", rels);
  redesenharFichas();
}

/** Relógios visíveis (para a ficha dos jogadores). */
export function relogiosVisiveis(isGM = false) {
  return Object.entries(lerMundo("relogios", {})).filter(([, x]) => x && (x.visivel || isGM)).map(([id, x]) => ({
    id, nome: x.nome, atual: int(x.atual), partes: int(x.partes), aFavor: !!x.aFavor, svg: svgRelogio(x.partes, x.atual, x.aFavor ? "#5FB38A" : "#D2544A"), oculto: !x.visivel
  }));
}

/* -------------------------------------------- */
/*  Regiões: passaporte, tecnologia e mana      */
/* -------------------------------------------- */

export const DENSIDADES = {
  normal: { label: "Normal", texto: "Sem efeito." },
  alta: { label: "Alta", texto: "Recuperar Mana rende 50% a mais." },
  baixa: { label: "Baixa", texto: "Magias custam +25% de PM e Recuperar Mana rende metade." },
  nula: { label: "Nula", texto: "Todos ficam com Antimagia." }
};
export const NIVEIS_TECNOLOGIA = { 1: "1 (Umbra'Draxil)", 2: "2 (Briavoterna)", 3: "3 (Genesis)" };
export const TECNOLOGIA_REGIAO = { umbra: 1, briavoterna: 2, genesis: 3 };

export function densidadeAtual() {
  const d = lerMundo("densidadeMana", "normal");
  return DENSIDADES[d] ? d : "normal";
}

export async function definirDensidade(id) {
  if (!DENSIDADES[id]) return;
  await gravar("densidadeMana", id);
  redesenharFichas();
  return cartao(`<p><strong>Densidade de mana: ${DENSIDADES[id].label}</strong>. ${escapar(DENSIDADES[id].texto)}</p>`, "#4C8EE0");
}

export async function regioesPadrao() {
  const reg = foundry.utils.deepClone(lerMundo("regioes", { lista: {}, atual: "" }));
  reg.lista ??= {};
  for (const [id, nome] of Object.entries(REGIOES)) {
    if (reg.lista[id]) continue;
    reg.lista[id] = { nome, idioma: "Comum", tecnologia: TECNOLOGIA_REGIAO[id] ?? 1, densidade: id === "genesis" ? "baixa" : id === "umbra" ? "alta" : "normal", criado: Date.now() };
  }
  return gravar("regioes", reg);
}

export async function editarRegiao(id = null) {
  const reg = foundry.utils.deepClone(lerMundo("regioes", { lista: {}, atual: "" }));
  reg.lista ??= {};
  const x = id ? reg.lista[id] ?? {} : {};
  const r = await formulario(id ? "Editar região" : "Nova região", `
    <label class="epm-campo"><span>Nome</span><input type="text" name="nome" value="${escapar(x.nome ?? "")}"></label>
    <label class="epm-campo"><span>Mundo (opcional)</span><input type="text" name="mundo" value="${escapar(x.mundo ?? "")}"></label>
    <label class="epm-campo"><span>Idioma comum</span><input type="text" name="idioma" value="${escapar(x.idioma ?? "Comum")}"></label>
    <label class="epm-campo"><span>Tecnologia</span><select name="tecnologia">${opcoes(Object.entries(NIVEIS_TECNOLOGIA), x.tecnologia ?? 1)}</select></label>
    <label class="epm-campo"><span>Densidade de mana</span><select name="densidade">${opcoes(Object.entries(DENSIDADES).map(([d, v]) => [d, v.label]), x.densidade ?? "normal")}</select></label>`, { botao: "Salvar" });
  if (!r) return;
  reg.lista[id ?? novoId()] = { nome: String(r.nome || "Região"), mundo: String(r.mundo ?? ""), idioma: String(r.idioma ?? ""), tecnologia: int(r.tecnologia, 1), densidade: DENSIDADES[r.densidade] ? r.densidade : "normal", criado: x.criado ?? Date.now() };
  return gravar("regioes", reg);
}

export async function apagarRegiao(id) {
  const reg = foundry.utils.deepClone(lerMundo("regioes", { lista: {}, atual: "" }));
  delete reg.lista?.[id];
  if (reg.atual === id) reg.atual = "";
  await game.settings.set(MODULE_ID, "regioes", { lista: {}, atual: "" });
  return gravar("regioes", reg);
}

/** Viagem: troca a região atual, a densidade de mana e carimba o passaporte do grupo. */
export async function viajarPara(id) {
  const reg = foundry.utils.deepClone(lerMundo("regioes", { lista: {}, atual: "" }));
  const x = reg.lista?.[id];
  if (!x) return;
  reg.atual = id;
  await gravar("regioes", reg);
  await game.settings.set(MODULE_ID, "densidadeMana", x.densidade ?? "normal");
  for (const a of personagensDoGrupo()) {
    if (a.flags?.[FLAG]?.passaporte?.[id]) continue;
    await a.update({ [`${P}.passaporte.${id}`]: { nome: x.nome, mundo: x.mundo ?? "", quando: new Date().toISOString().slice(0, 10) } });
  }
  redesenharFichas();
  return cartao(`<p><strong>Chegada: ${escapar(x.nome)}</strong>${x.mundo ? ` (${escapar(x.mundo)})` : ""}</p>
    <p>Idioma comum: ${escapar(x.idioma || "—")} · Tecnologia ${int(x.tecnologia, 1)} · Mana ${escapar(DENSIDADES[x.densidade]?.label ?? "Normal")} (${escapar(DENSIDADES[x.densidade]?.texto ?? "")})</p>`, "#5FB38A");
}

export function regiaoAtual() {
  const reg = lerMundo("regioes", { lista: {}, atual: "" });
  return reg?.lista?.[reg?.atual] ? { id: reg.atual, ...reg.lista[reg.atual] } : null;
}

/* -------------------------------------------- */
/*  Compêndio do mundo                          */
/* -------------------------------------------- */

/** Partes da ficha que podem ir para o compêndio do mundo (chave em flags.epm-ficha). */
export const TIPOS_COMPENDIO = {
  treinamentos: { label: "Treinamentos", icone: "fa-solid fa-dumbbell" },
  bencaos: { label: "Bênçãos e maldições", icone: "fa-solid fa-hand-sparkles" },
  receitas: { label: "Receitas", icone: "fa-solid fa-flask" },
  bestiario: { label: "Criaturas", icone: "fa-solid fa-dragon" },
  talentos: { label: "Talentos", icone: "fa-solid fa-star" }
};
const CAMPOS_PESSOAIS = ["estado", "horasFeitas", "usado", "turnosRestantes", "encontros", "derrotados", "comprado", "ativo", "compendio"];

/** Mestre: manda uma entrada de uma ficha para o compêndio (cria ou atualiza a versão). */
export async function enviarAoCompendio(actor, tipo, id) {
  if (!game.user.isGM) return ui.notifications.warn("Só o Mestre cadastra no compêndio do mundo.");
  if (!TIPOS_COMPENDIO[tipo]) return;
  const original = actor.flags?.[FLAG]?.[tipo]?.[id];
  if (!original) return;
  const comp = foundry.utils.deepClone(lerMundo("compendioMundo", {}));
  comp[tipo] ??= {};
  const ligado = original.compendio?.id && comp[tipo][original.compendio.id] ? original.compendio.id : null;
  const cid = ligado ?? novoId();
  const dados = foundry.utils.deepClone(original);
  for (const k of CAMPOS_PESSOAIS) delete dados[k];
  const versao = Date.now();
  comp[tipo][cid] = { nome: dados.nome || "Sem nome", dados, versao };
  await gravar("compendioMundo", comp);
  await actor.update({ [`${P}.${tipo}.${id}.compendio`]: { id: cid, versao } });
  ui.notifications.info(`${dados.nome || "Entrada"} ${ligado ? "atualizada" : "cadastrada"} no compêndio do mundo.`);
  redesenharFichas();
}

/** Pega uma entrada do compêndio para a ficha. */
export async function pegarDoCompendio(actor, tipo) {
  const lista = Object.entries(lerMundo("compendioMundo", {})?.[tipo] ?? {});
  if (!lista.length) return ui.notifications.info(`O compêndio do mundo não tem ${TIPOS_COMPENDIO[tipo]?.label.toLowerCase() ?? "entradas"} ainda.`);
  const r = await formulario(`Compêndio do mundo: ${TIPOS_COMPENDIO[tipo].label}`, `<label class="epm-campo"><span>Entrada</span><select name="id">${opcoes(lista.sort((a, b) => a[1].nome.localeCompare(b[1].nome, "pt-BR")).map(([id, e]) => [id, e.nome]))}</select></label>`, { botao: "Adicionar" });
  if (!r) return;
  const e = lerMundo("compendioMundo", {})[tipo][r.id];
  if (!e) return;
  const novo = { ...foundry.utils.deepClone(e.dados), compendio: { id: r.id, versao: e.versao }, criado: Date.now() };
  if (tipo === "treinamentos") Object.assign(novo, { estado: "planejado", horasFeitas: 0 });
  if (tipo === "bestiario") Object.assign(novo, { encontros: 0, derrotados: 0 });
  if (tipo === "bencaos") Object.assign(novo, { ativo: true, usado: false, turnosRestantes: 0 });
  await actor.update({ [`${P}.${tipo}.${novoId()}`]: novo });
}

/** Atualiza a entrada da ficha com a versão nova do compêndio (mantém o progresso pessoal). */
export async function atualizarDoCompendio(actor, tipo, id) {
  const atual = actor.flags?.[FLAG]?.[tipo]?.[id];
  const e = lerMundo("compendioMundo", {})?.[tipo]?.[atual?.compendio?.id];
  if (!atual || !e) return;
  const pessoais = Object.fromEntries(CAMPOS_PESSOAIS.filter(k => k in atual && k !== "compendio").map(k => [k, atual[k]]));
  await actor.update({ [`${P}.${tipo}.-=${id}`]: null });
  await actor.update({ [`${P}.${tipo}.${id}`]: { ...foundry.utils.deepClone(e.dados), ...pessoais, compendio: { id: atual.compendio.id, versao: e.versao }, criado: atual.criado ?? Date.now() } });
  ui.notifications.info(`${e.nome}: atualizado com o compêndio.`);
}

/** Quantas entradas da ficha têm versão mais nova no compêndio: { tipo: Set(ids) }. */
export function atualizacoesPendentes(dados) {
  const comp = lerMundo("compendioMundo", {}) ?? {};
  const out = {};
  for (const tipo of Object.keys(TIPOS_COMPENDIO)) {
    out[tipo] = new Set(Object.entries(dados?.[tipo] ?? {}).filter(([, x]) => {
      const e = comp[tipo]?.[x?.compendio?.id];
      return e && int(e.versao) > int(x.compendio.versao);
    }).map(([id]) => id));
  }
  return out;
}

export async function apagarDoCompendio(tipo, id) {
  const comp = foundry.utils.deepClone(lerMundo("compendioMundo", {}));
  delete comp?.[tipo]?.[id];
  await game.settings.set(MODULE_ID, "compendioMundo", {});
  return gravar("compendioMundo", comp);
}

/* -------------------------------------------- */
/*  Conhecimento de criaturas                   */
/* -------------------------------------------- */

export const NIVEIS_CONHECIMENTO = [
  { nivel: 0, dt: 0, label: "Nome e tipo" },
  { nivel: 1, dt: 15, label: "Resistências e imunidades" },
  { nivel: 2, dt: 25, label: "Fraquezas e nível de dano" },
  { nivel: 3, dt: 35, label: "Habilidades e lore" }
];
export const chaveCriatura = nome => normalizarTexto(nome).replace(/\s+/g, "-");
export const conhecimentoDe = nome => int(lerMundo("conhecimentoCriaturas", {})?.[chaveCriatura(nome)]?.nivel);

/** Teste para estudar uma criatura do Bestiário; o que descobre vale para o grupo todo. */
export async function estudarCriatura(actor, id) {
  const b = actor.flags?.[FLAG]?.bestiario?.[id];
  if (!b?.nome) return ui.notifications.warn("Dê um nome à criatura primeiro.");
  const { ficha } = estadoAtor(actor);
  const opc = ["investigacao", "conhecimentosMagicos", "sobrevivencia"].map(pid => ficha.periciaPorId[pid] ?? ficha.pericias.find(p => normalizarTexto(p.nome).replace(/\s/g, "") === normalizarTexto(pid))).filter(Boolean);
  const r = await formulario(`Estudar: ${b.nome}`, `<label class="epm-campo"><span>Perícia</span><select name="pericia">${opcoes(opc.map(p => [p.id, `${p.nome} (${p.total >= 0 ? "+" : ""}${p.total})`]))}</select></label>
    <p class="epm-dica">DT 15: resistências e imunidades · DT 25: fraquezas e nível de dano · DT 35: habilidades e lore. O que descobrir fica para o grupo.</p>`, { botao: "Rolar" });
  if (!r) return;
  const per = ficha.periciaPorId[r.pericia];
  const t = await rolarTeste(actor, { rotulo: `Estudar ${b.nome} (${per?.nome ?? ""})`, bonus: per?.total ?? 0 });
  if (!t) return;
  const nivel = NIVEIS_CONHECIMENTO.filter(x => x.nivel > 0 && t.total >= x.dt).reduce((m, x) => Math.max(m, x.nivel), 0);
  if (!nivel) return ui.notifications.info("Não descobriu nada novo.");
  await revelarDaFichaLigada(actor, id, nivel);
  await pedirAoMestre("conhecimento", { chave: chaveCriatura(b.nome), nivel, nome: b.nome, por: actor.name });
  ui.notifications.info(`${b.nome}: ${NIVEIS_CONHECIMENTO[nivel].label} (para o grupo).`);
}

/** Se a criatura do Bestiário estiver ligada a uma ficha, copia o que o nível revela. */
async function revelarDaFichaLigada(actor, id, nivel) {
  const b = actor.flags?.[FLAG]?.bestiario?.[id];
  if (!b?.uuid) return;
  let alvo = null;
  try { alvo = await fromUuid(b.uuid); } catch { alvo = null; }
  const d = alvo?.flags?.[FLAG];
  if (!d) return;
  const upd = {};
  const mesclar = (campo, lista) => { const atual = new Set(b[campo] ?? []); for (const x of lista ?? []) atual.add(x); upd[`${P}.bestiario.${id}.${campo}`] = [...atual]; };
  if (nivel >= 1) { mesclar("resistencias", d.resistencias); mesclar("imunidades", d.imunidades); }
  if (nivel >= 2) mesclar("fraquezas", d.vulnerabilidades);
  if (nivel >= 3) {
    const habs = alvo.items.filter(i => i.type === "feat" || i.type === "spell").map(i => i.name);
    if (habs.length) upd[`${P}.bestiario.${id}.notas`] = `${b.notas ? `${b.notas}\n` : ""}Habilidades: ${habs.join(", ")}`;
  }
  if (Object.keys(upd).length) await actor.update(upd);
}

/* -------------------------------------------- */
/*  Chefes com fases                            */
/* -------------------------------------------- */

export async function configurarChefe(actor) {
  if (!actor) return ui.notifications.warn("Selecione o token do chefe.");
  const c = actor.flags?.[FLAG]?.chefe ?? {};
  const fase = (n, pct) => `<fieldset class="epm-aquisicao"><legend>Fase ${n} (${pct}% da Vida)</legend>
    <label class="epm-campo"><span>Nova defesa</span><input type="text" name="defesa${n}" value="${escapar(c.fases?.[n - 1]?.defesa ?? "")}" placeholder="Resistência a Fogo"></label>
    <label class="epm-campo"><span>Nova ação</span><input type="text" name="acao${n}" value="${escapar(c.fases?.[n - 1]?.acao ?? "")}"></label>
    <label class="epm-campo"><span>Dano de Sanidade se revelar a forma verdadeira (opcional)</span><input type="text" name="sanidade${n}" value="${escapar(c.fases?.[n - 1]?.sanidade ?? "")}" placeholder="2d6"></label></fieldset>`;
  const r = await formulario(`Chefe: ${actor.name}`, `
    <label class="epm-check"><input type="checkbox" name="ativo" ${c.ativo !== false ? "checked" : ""}> É chefe (o Escudo avisa as fases)</label>
    ${fase(2, 66)}${fase(3, 33)}
    <label class="epm-campo"><span>Ação de Covil (iniciativa 20, uma vez por rodada)</span><input type="text" name="covil" value="${escapar(c.covil ?? "")}"></label>`, { botao: "Salvar", largura: 560 });
  if (!r) return;
  await actor.update({ [`${P}.chefe`]: {
    ativo: !!r.ativo, covil: String(r.covil ?? ""), faseAtual: int(c.faseAtual, 1),
    fases: [2, 3].map(n => ({ pct: n === 2 ? 66 : 33, defesa: String(r[`defesa${n}`] ?? ""), acao: String(r[`acao${n}`] ?? ""), sanidade: String(r[`sanidade${n}`] ?? "").trim() }))
  } });
}

/** updateActor (só no Mestre ativo): quando a Vida do chefe passa de 66% ou 33%, anuncia a nova fase. */
export async function verificarFaseChefe(actor) {
  if (!souMestreAtivo()) return;
  const c = actor.flags?.[FLAG]?.chefe;
  if (!c?.ativo) return;
  const hp = actor.system?.attributes?.hp ?? {};
  const pct = int(hp.max) > 0 ? (int(hp.value) / int(hp.max)) * 100 : 100;
  let fase = 1;
  for (const [i, f] of (c.fases ?? []).entries()) if (pct <= f.pct) fase = i + 2;
  const atual = int(c.faseAtual, 1);
  if (fase === atual) return;
  await actor.update({ [`${P}.chefe.faseAtual`]: fase });
  if (fase < atual) return;
  const f = c.fases?.[fase - 2] ?? {};
  const san = f.sanidade ? `<p><button type="button" class="epm-botao epm-botao-mini" data-epm-action="sanidadeCartao" data-formula="${escapar(f.sanidade)}" data-rotulo="${escapar(actor.name)}: forma verdadeira">Dano de Sanidade (${escapar(f.sanidade)})</button></p>` : "";
  await cartao(`<p><strong>${escapar(actor.name)} muda de fase!</strong> (fase ${fase})</p>${f.defesa ? `<p>Nova defesa: ${escapar(f.defesa)}</p>` : ""}${f.acao ? `<p>Nova ação: ${escapar(f.acao)}</p>` : ""}${san}`, "#D2544A");
}

/** Início de rodada: lembra o Mestre das Ações de Covil dos chefes do combate. */
export async function lembrarCovil(combate) {
  if (!souMestreAtivo() || !combate?.started) return;
  const chefes = (combate.combatants ?? []).map(c => c.actor).filter(a => a?.flags?.[FLAG]?.chefe?.ativo && a.flags[FLAG].chefe.covil);
  for (const a of chefes) {
    await cartao(`<p><strong>Ação de Covil</strong> (iniciativa 20) — ${escapar(a.name)}: ${escapar(a.flags[FLAG].chefe.covil)}</p>`, "#B0479A", { whisper: game.users.filter(u => u.isGM).map(u => u.id) });
  }
}

/* -------------------------------------------- */
/*  Calculadora de encontro                     */
/* -------------------------------------------- */

/** ND total, dificuldade e PEv de cada personagem (5 × ND por criatura, +2 por nível de diferença acima dele). */
export function calcularEncontro(criaturas = [], niveis = []) {
  const lista = criaturas.filter(c => num(c.nd) > 0 && int(c.qtd, 1) > 0);
  const ndTotal = lista.reduce((s, c) => s + num(c.nd) * int(c.qtd, 1), 0);
  const somaNiveis = niveis.reduce((s, n) => s + Math.max(1, int(n)), 0) || 1;
  const razao = ndTotal / somaNiveis;
  const dificuldade = !ndTotal ? "—" : razao < 0.5 ? "Fácil" : razao < 1 ? "Médio" : razao < 1.5 ? "Difícil" : "Mortal";
  const pev = niveis.map(n => lista.reduce((s, c) => s + int(c.qtd, 1) * (5 * num(c.nd) + 2 * Math.max(0, Math.ceil(num(c.nd)) - int(n))), 0));
  return { ndTotal, dificuldade, razao, pev };
}

/* -------------------------------------------- */
/*  Ficha rápida de NPC                         */
/* -------------------------------------------- */

const ATRIBUTOS_ARQ = {
  combatente: { forca: 3, destreza: 2, constituicao: 3, aparencia: 0, carisma: 0, inteligencia: 0, autocontrole: 1, nucleo: 0 },
  conjurador: { forca: 0, destreza: 1, constituicao: 1, aparencia: 1, carisma: 1, inteligencia: 3, autocontrole: 2, nucleo: 3 },
  artifice: { forca: 1, destreza: 3, constituicao: 2, aparencia: 0, carisma: 1, inteligencia: 3, autocontrole: 1, nucleo: 0 }
};

/** Gera os números do NPC (puro). */
export function gerarNpc({ raca = "humano", arquetipo = "combatente", nivel = 1, patente = "soldado", regiao = "umbra", nome = "" } = {}) {
  const rc = racaPorId(raca) ?? RACAS[0];
  const arq = ATRIBUTOS_ARQ[arquetipo] ? arquetipo : "combatente";
  const n = Math.max(1, Math.min(50, int(nivel, 1)));
  const atr = { ...ATRIBUTOS_ARQ[arq] };
  for (const [id, v] of Object.entries(rc.aumento?.fixos ?? {})) atr[id] += v;
  const bonusNivel = Math.floor(n / 2);
  const ordem = Object.entries(atr).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  for (let i = 0; i < bonusNivel; i++) atr[ordem[i % 3]] += 1;
  const pIdx = Math.max(0, PATENTES.findIndex(p => p.id === patente));
  for (const id of Object.keys(atr)) atr[id] += Math.floor(pIdx / 2);
  const recursos = {};
  for (const r of ["pv", "pm", "pe"]) {
    const attr = r === "pm" ? atr.nucleo : atr.constituicao;
    recursos[r] = maximoRecurso(r, { raca: rc.recursos?.[r] ?? 10, atributo: attr, niveis: [{ arquetipo: arq, nivel: n }], usarMedia: true }).total;
  }
  const armas = ARMAS_REGIAO[regiao] ?? ARMAS_REGIAO.umbra;
  const armaduras = ARMADURAS_REGIAO[regiao] ?? ARMADURAS_REGIAO.umbra;
  const media = a => [...String(a?.dano ?? "").matchAll(/(\d*)d(\d+)/g)].reduce((t, m) => t + (Number(m[1] || 1) * (Number(m[2]) + 1)) / 2, 0);
  const melhor = lista => [...lista].sort((a, b) => media(b) - media(a))[0];
  const arma = arq === "artifice" ? (melhor(armas.filter(a => a.pericia === "pontaria")) ?? armas[0])
    : arq === "conjurador" ? (armas.find(a => /cajado|adaga|bast/i.test(a.nome)) ?? melhor(armas) ?? armas[0])
    : (() => { const cac = melhor(armas.filter(a => a.pericia === "luta" && a.dano)); return cac && media(cac) >= 4.5 ? cac : (melhor(armas.filter(a => a.dano && !/granada|foguete/i.test(a.nome))) ?? armas[0]); })();
  const armadura = arq === "combatente" ? (armaduras.find(a => a.tipo === "media") ?? armaduras[0]) : (armaduras.find(a => a.tipo === "leve") ?? armaduras[0]);
  const ca = 10 + atr.destreza + int(armadura?.defesa);
  const atrAtaque = arma?.pericia === "pontaria" ? atr.destreza : atr.forca;
  const acerto = atrAtaque + Math.ceil(n / 4) + pIdx;
  const danoBase = String(arma?.dano || "1d6").split("+")[0].trim() || "1d6";
  const nd = Math.max(1, Math.round(n / 2 + pIdx));
  return {
    nome: nome || `${PATENTES[pIdx]?.label ?? "Soldado"} ${rc.nome}`, raca: rc.nome, arquetipo: arq, nivel: n, patente: PATENTES[pIdx]?.label ?? "Soldado",
    regiao: REGIOES[regiao] ?? regiao, atributos: atr, recursos, ca, deslocamento: rc.deslocamento ?? 9,
    ataque: { nome: arma?.nome ?? "Ataque", acerto, dano: `${danoBase} + ${atrAtaque}`, tipo: arma?.tipoDano ?? "Contundente" },
    armadura: armadura?.nome ?? "", nd, faixa: faixaPorNivel(n)?.label ?? ""
  };
}

/** Diálogo: gera o NPC e põe em Companheiros ou no Bestiário de uma ficha (ou mostra no chat). */
export async function fichaRapidaNpc(actorDestino = null) {
  const atores = game.actors.filter(a => a.flags?.[FLAG] || a.type === "character").sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const r = await formulario("Ficha rápida de NPC", `
    <label class="epm-campo"><span>Nome (opcional)</span><input type="text" name="nome"></label>
    <label class="epm-campo"><span>Raça</span><select name="raca">${opcoes(RACAS.filter(x => !x.mestico).map(x => [x.id, x.nome]))}</select></label>
    <label class="epm-campo"><span>Arquétipo</span><select name="arquetipo">${opcoes([["combatente", "Combatente"], ["conjurador", "Conjurador"], ["artifice", "Artífice"]])}</select></label>
    <label class="epm-campo"><span>Nível</span><input type="number" name="nivel" value="5" min="1" max="50"></label>
    <label class="epm-campo"><span>Posto</span><select name="patente">${opcoes(PATENTES.map(p => [p.id, p.label]))}</select></label>
    <label class="epm-campo"><span>Região (armas e armaduras)</span><select name="regiao">${opcoes(Object.entries(REGIOES))}</select></label>
    <label class="epm-campo"><span>Destino</span><select name="destino"><option value="chat">Só mostrar no chat</option>${atores.map(a => `<optgroup label="${escapar(a.name)}"><option value="comp:${a.id}" ${actorDestino?.id === a.id ? "selected" : ""}>Companheiros de ${escapar(a.name)}</option><option value="best:${a.id}">Bestiário de ${escapar(a.name)}</option></optgroup>`).join("")}</select></label>`, { botao: "Gerar", largura: 560 });
  if (!r) return;
  const npc = gerarNpc(r);
  const atrTexto = Object.entries(npc.atributos).map(([id, v]) => `${ATRIBUTOS[id]?.abrev ?? id} ${v}`).join(", ");
  const resumo = `${npc.raca} ${npc.arquetipo} nível ${npc.nivel} (${npc.patente}, ${npc.regiao}). ND ${npc.nd}. ${atrTexto}. ${npc.armadura ? `Armadura: ${npc.armadura}.` : ""}`;
  const [tipo, id] = String(r.destino).split(":");
  const destino = id ? game.actors.get(id) : null;
  if (destino && tipo === "comp") {
    await destino.update({ [`${P}.companheiros.${novoId()}`]: {
      nome: npc.nome, tipo: "aliado", img: "", uuid: "", pv: { value: npc.recursos.pv, max: npc.recursos.pv }, pm: { value: npc.recursos.pm, max: npc.recursos.pm },
      pe: { value: npc.recursos.pe, max: npc.recursos.pe }, ca: npc.ca, deslocamento: npc.deslocamento, atributos: npc.atributos,
      ataques: { [novoId()]: { nome: npc.ataque.nome, acerto: npc.ataque.acerto, dano: npc.ataque.dano, tipoDano: npc.ataque.tipo } },
      habilidades: "", notas: resumo, patente: r.patente, nivelCriatura: npc.nivel, automato: false, criado: Date.now()
    } });
  } else if (destino && tipo === "best") {
    await destino.update({ [`${P}.bestiario.${novoId()}`]: {
      nome: npc.nome, img: "", uuid: "", tipo: npc.raca, local: npc.regiao, fraquezas: [], resistencias: [], imunidades: [], notas: resumo,
      encontros: 0, derrotados: 0, nd: npc.nd, pv: npc.recursos.pv, ca: npc.ca, deslocamentoTexto: `${npc.deslocamento} m`,
      acoes: `${npc.ataque.nome} +${npc.ataque.acerto}: ${npc.ataque.dano} ${npc.ataque.tipo}`, criado: Date.now()
    } });
  }
  await cartao(`<p><strong>${escapar(npc.nome)}</strong> — ${escapar(resumo)}</p><p>Vida ${npc.recursos.pv} · Mana ${npc.recursos.pm} · Estamina ${npc.recursos.pe} · CA ${npc.ca} · ${npc.deslocamento} m</p>
    <p>${escapar(npc.ataque.nome)} +${npc.ataque.acerto}: ${escapar(npc.ataque.dano)} ${escapar(npc.ataque.tipo)}</p>${destino ? `<p class="epm-dica">Salvo em ${tipo === "comp" ? "Companheiros" : "Bestiário"} de ${escapar(destino.name)}.</p>` : ""}`,
    "#7FB4E6", { whisper: game.users.filter(u => u.isGM).map(u => u.id) });
}

/* -------------------------------------------- */
/*  Botões de chat da 0.6.0                     */
/* -------------------------------------------- */

/** Personagem de quem clicou: token selecionado ou o personagem do usuário. */
const meuPersonagem = () => canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;

export async function cliqueChat060(acao, actor, botao) {
  const msgId = botao.closest("[data-message-id]")?.dataset.messageId;
  if (acao === "votar") { await pedirAoMestre("voto", { messageId: msgId, opcao: int(botao.dataset.opcao) }); return true; }
  if (acao === "encerrarEnquete") {
    if (!game.user.isGM) { ui.notifications.warn("Só o Mestre encerra a votação."); return true; }
    await encerrarEnquete(msgId);
    return true;
  }
  if (acao === "sanidadeCartao") {
    const alvo = meuPersonagem();
    if (!alvo?.isOwner) { ui.notifications.warn("Selecione o seu token (ou tenha um personagem atribuído)."); return true; }
    const { danoSanidade } = await import("./ficha-060.mjs");
    await danoSanidade(alvo, { formula: botao.dataset.formula, motivo: botao.dataset.rotulo });
    return true;
  }
  if (acao === "condicaoAlvo") {
    const alvos = [...(game.user?.targets ?? [])].map(t => t.actor).filter(Boolean);
    if (!alvos.length) { ui.notifications.warn("Marque o alvo (tecla T) e clique de novo."); return true; }
    const id = botao.dataset.condicao;
    for (const a of alvos) {
      if (!a.isOwner) { ui.notifications.warn(`Só o Mestre (ou o dono) aplica condições em ${a.name}.`); continue; }
      if (!a.statuses?.has(id)) await a.toggleStatusEffect(id, { active: true });
    }
    return true;
  }
  return false;
}

/** Mostra o botão "Encerrar" das enquetes só para o Mestre. */
export function ocultarBotoesDeMestre(_msg, html) {
  if (game.user?.isGM) return;
  const el = html?.[0] ?? html;
  el?.querySelectorAll?.(".epm-so-mestre").forEach(b => b.remove());
}

export { conteudoNotion };
