/**
 * Mecânicas que conversam com o Foundry: rolagens, cartões de chat, uso de habilidades e magias,
 * defesas, descanso, moedas e progressão. A matemática pura fica em data.mjs.
 */
import {
  FLAG, CAMINHO, ACOES, CUSTO_RECURSOS, RARIDADES_PODER, RARIDADES_ITEM, REQUISITOS, MOEDAS, REGRAS,
  custoNivel, ORIGENS_HABILIDADE, CIRCULOS, MELHORIAS, RECURSOS, TIPOS_TESTE
} from "./config.mjs";
import {
  num, int, novoId, lerPoder, avaliarForma, textoCusto, contarRaridades, situacaoLimite, raridadeItem,
  maxFormula, tetoDano, contarEfeitos, somarFormula, valorEmCobre, pagarMoedas, consolidarMoedas,
  formatarMoedas, formaPadrao, moedaPorId, multiplicarDados, bonusCenaAtivos, limitar
} from "./data.mjs";
import { lerAtor, dadosRolagemEPM, danoArma, periciaAtaquePadrao, ataqueDeArma, ataqueCustom } from "./context.mjs";
import { fvtt, enriquecer, escapar } from "./helpers.mjs";
import { ajustes, listaPericias } from "./settings.mjs";

const P = `flags.${FLAG}`;
const TIPO_ITEM = {
  weapon: "Arma", consumable: "Consumível", equipment: "Armadura", tool: "Ferramenta",
  container: "Mochila", backpack: "Mochila", loot: "Loot"
};

const comSinal = n => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);
const sinalCurto = n => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "+0");
const falar = actor => ChatMessage.getSpeaker({ actor });

export function estadoAtor(actor) {
  return lerAtor(actor, listaPericias());
}

/** Dados de rolagem: os do dnd5e mais os do EPM (@atr.forca, @per.luta, @nivel…). */
export function dadosRolagem(actor, ficha = null) {
  const f = ficha ?? estadoAtor(actor).ficha;
  let base = {};
  try { base = actor?.getRollData?.() ?? {}; } catch { base = {}; }
  return { ...base, ...dadosRolagemEPM(f) };
}

export function formulaD20({ vantagem = false, desvantagem = false } = {}) {
  const base = String(ajustes().formulaTeste || "1d20").trim();
  if (vantagem === desvantagem) return base;
  const m = /^1d(\d+)$/i.exec(base);
  if (!m) return base;
  return `2d${m[1]}${vantagem ? "kh" : "kl"}`;
}

export function notaResistencia(ficha) {
  const fontes = ficha.desvantagens.resistencias;
  return fontes.length ? `se for teste de resistência: desvantagem (${fontes.join(", ")})` : "";
}

export function poderesDoAtor(actor) {
  return actor.items
    .filter(i => i.type === "feat" || i.type === "spell")
    .map(i => ({ tipo: i.type === "spell" ? "magia" : "habilidade", raridade: lerPoder(i).raridade }));
}

/* -------------------------------------------- */
/*  Diálogos genéricos                          */
/* -------------------------------------------- */

export async function confirmar(titulo, html) {
  try {
    const r = await fvtt.DialogV2.confirm({ window: { title: titulo }, content: html, rejectClose: false, modal: true });
    return r === true;
  } catch (err) {
    console.warn("EPM |", err);
    return false;
  }
}

export async function perguntarTexto(titulo, rotulo, valor = "", botao = "Salvar") {
  const r = await fvtt.DialogV2.wait({
    window: { title: titulo }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<label class="epm-campo"><span>${escapar(rotulo)}</span><input type="text" name="valor" value="${escapar(valor)}" autofocus></label>`,
    buttons: [
      { action: "ok", label: botao, icon: "fa-solid fa-check", default: true, callback: (ev, b) => ({ valor: b.form.elements.valor.value }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object") return null;
  return String(r.valor ?? "").trim();
}

/** Raiz HTML de um diálogo no callback `render` (v12 passa o elemento, v13 passa o diálogo). */
function raizDialogo(evento, arg) {
  if (arg instanceof HTMLElement) return arg;
  if (arg?.element instanceof HTMLElement) return arg.element;
  if (evento?.target?.element instanceof HTMLElement) return evento.target.element;
  return null;
}

/* -------------------------------------------- */
/*  Rolagens                                    */
/* -------------------------------------------- */

/** Teste d20 + bônus. Shift = vantagem, Ctrl/Cmd = desvantagem; desvantagens da ficha entram sozinhas. */
export async function rolarTeste(actor, { rotulo, bonus = 0, evento = null, desvantagens = [], nota = "" } = {}) {
  const vantagem = !!evento?.shiftKey;
  const desvantagem = !!(evento?.ctrlKey || evento?.metaKey) || desvantagens.length > 0;
  const roll = new Roll(`${formulaD20({ vantagem, desvantagem })} ${comSinal(int(bonus))}`, dadosRolagem(actor));
  await roll.evaluate();
  const partes = [];
  if (vantagem && desvantagem) partes.push("vantagem e desvantagem se anulam");
  else if (vantagem) partes.push("com vantagem");
  else if (desvantagem) partes.push(desvantagens.length ? `com desvantagem (${desvantagens.join(", ")})` : "com desvantagem");
  if (nota) partes.push(nota);
  await roll.toMessage({
    speaker: falar(actor),
    flavor: `<span class="epm-flavor"><strong>${escapar(rotulo)}</strong>${partes.length ? `<em>${escapar(partes.join("; "))}</em>` : ""}</span>`
  });
  return roll;
}

export async function rolarFormula(actor, formula, rotulo) {
  if (!formula) return null;
  const dados = actor ? dadosRolagem(actor) : {};
  let roll;
  try {
    roll = new Roll(Roll.replaceFormulaData(String(formula), dados, { missing: "0" }));
    await roll.evaluate();
  } catch (err) {
    console.warn("EPM |", err);
    ui.notifications.error(`Não consegui rolar "${formula}". Confira a fórmula.`);
    return null;
  }
  await roll.toMessage({ speaker: falar(actor), flavor: `<span class="epm-flavor"><strong>${escapar(rotulo)}</strong></span>` });
  return roll;
}

export async function atacarComArma(actor, item, evento) {
  const { ficha } = estadoAtor(actor);
  const id = periciaAtaquePadrao(item);
  const per = ficha.periciaPorId[id];
  return rolarTeste(actor, {
    rotulo: `Ataque: ${item.name}${per ? ` (${per.nome})` : ""}`,
    bonus: per?.total ?? 0, evento, desvantagens: ficha.desvantagens.ataques
  });
}

export async function danoDeArma(actor, item) {
  const formula = danoArma(item);
  if (!formula) return ui.notifications.warn(`${item.name} não tem dano definido. Abra os detalhes do item para escrever a fórmula.`);
  return rolarFormula(actor, formula, `Dano: ${item.name}`);
}

/* -------------------------------------------- */
/*  Cartões de chat                             */
/* -------------------------------------------- */

async function enviarCartao(actor, dados, flags = {}) {
  const content = await fvtt.renderTemplate(`${CAMINHO}/chat/cartao.hbs`, {
    actorUuid: actor?.uuid ?? "", linhas: [], requisitos: [], avisos: [], botoes: [], ...dados
  });
  return ChatMessage.create({ speaker: falar(actor), content, flags: { [FLAG]: flags } });
}

export async function cartaoItem(actor, item, { avisos = [] } = {}) {
  const { ficha } = estadoAtor(actor);
  const rolagem = dadosRolagem(actor, ficha);
  let raridadeLabel, raridadeCor, tipoLabel, circuloLabel = "";
  if (item.type === "feat" || item.type === "spell") {
    const p = lerPoder(item);
    const r = RARIDADES_PODER[p.raridade];
    raridadeLabel = r.label; raridadeCor = r.cor;
    tipoLabel = p.tipo === "magia" ? "Magia" : "Habilidade";
    if (p.tipo === "magia") circuloLabel = CIRCULOS.find(c => c.nivel === p.circulo)?.label ?? `${p.circulo}º Círculo`;
  } else {
    const r = RARIDADES_ITEM[raridadeItem(item)];
    raridadeLabel = r.label; raridadeCor = r.cor;
    tipoLabel = TIPO_ITEM[item.type] ?? "Item";
  }
  const texto = await enriquecer(item.system?.description?.value ?? "", { relativeTo: item, rollData: rolagem });
  const botoes = [];
  if (item.type === "weapon") {
    const per = ficha.periciaPorId[periciaAtaquePadrao(item)];
    if (per) botoes.push({ acao: "teste", pericia: per.id, tipo: "ataque", rotulo: `Ataque: ${item.name}`, label: `Atacar (${sinalCurto(per.total)})`, icone: "fa-solid fa-dice-d20" });
  }
  const formula = item.type === "weapon" ? danoArma(item) : (item.flags?.[FLAG]?.formula ?? "");
  if (formula) botoes.push({ acao: "formula", formula, rotulo: `${item.type === "weapon" ? "Dano" : "Rolagem"}: ${item.name}`, label: formula, icone: "fa-solid fa-dice" });
  return enviarCartao(actor, {
    img: item.img, nome: item.name, tipoLabel, raridadeLabel, raridadeCor, circuloLabel, texto, botoes, avisos
  }, { tipo: "item", itemUuid: item.uuid });
}

export async function usarItem(actor, item) {
  const qtd = num(item.system?.quantity, 1);
  if (qtd <= 0) return ui.notifications.warn(`${item.name} acabou.`);
  await item.update({ "system.quantity": qtd - 1 });
  return cartaoItem(actor, item, { avisos: [`Usou 1. Restam ${qtd - 1}.`] });
}

/* -------------------------------------------- */
/*  Habilidades e magias                        */
/* -------------------------------------------- */

async function escolherForma(item, p, ficha, rolagem) {
  const opcoes = p.formas.map(f => ({ f, av: avaliarForma(f, ficha, { raridade: p.raridade, melhorias: p.melhorias, dadosRolagem: rolagem }) }));
  const gm = game.user.isGM;
  const primeira = opcoes.find(o => !o.av.bloqueada) ?? (gm ? opcoes[0] : null);
  const html = opcoes.map(({ f, av }) => {
    const desab = av.bloqueada && !gm;
    const meta = [ACOES[f.acao]?.curto ?? f.acao, textoCusto(f), f.dano.formula].filter(Boolean).join(", ");
    return `<label class="epm-opcao-forma${av.bloqueada ? " bloqueada" : ""}">
      <input type="radio" name="forma" value="${f.id}" ${primeira?.f.id === f.id ? "checked" : ""} ${desab ? "disabled" : ""}>
      <span class="epm-opcao-nome">${escapar(f.nome)}</span>
      <span class="epm-opcao-meta">${escapar(meta)}</span>
      ${av.bloqueada ? `<span class="epm-opcao-bloqueio">Bloqueada: ${escapar(av.motivos.join(", "))}</span>` : ""}
      ${av.semRecurso ? `<span class="epm-opcao-bloqueio">Recurso insuficiente</span>` : ""}
    </label>`;
  }).join("");
  const r = await fvtt.DialogV2.wait({
    window: { title: `Usar ${item.name}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<div class="epm-opcoes-forma">${html}</div>`,
    buttons: [
      { action: "usar", label: "Usar", icon: "fa-solid fa-bolt", default: true, callback: (ev, b) => ({ forma: b.form.elements.forma?.value ?? "" }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object") return null;
  return p.formas.find(f => f.id === r.forma) ?? null;
}

/** Marca na ficha a ação gasta, se o personagem estiver num combate iniciado. */
async function marcarAcao(actor, acao, ficha) {
  if (!ajustes().marcarAcoes || !["padrao", "bonus", "movimento", "reacao"].includes(acao)) return null;
  const combate = game.combat;
  if (!combate?.started) return null;
  const naLuta = combate.combatants.some(c => c.actor?.uuid === actor.uuid);
  if (!naLuta) return null;
  if (ficha.acoes[acao]) return `${ACOES[acao].label} já estava usada neste turno.`;
  await actor.update({ [`${P}.acoes.${acao}`]: true });
  return null;
}

export async function usarPoder(actor, item, { evento = null } = {}) {
  const { ficha } = estadoAtor(actor);
  const p = lerPoder(item);
  const rolagem = dadosRolagemEPM(ficha);
  let forma = null;
  if (p.formas.length === 1) forma = p.formas[0];
  else if (p.formas.length > 1) {
    forma = await escolherForma(item, p, ficha, rolagem);
    if (!forma) return null;
  }
  const avisos = [];
  const nome = `${item.name}${forma && p.formas.length > 1 ? ` (${forma.nome})` : ""}`;
  const av = forma ? avaliarForma(forma, ficha, { raridade: p.raridade, melhorias: p.melhorias, dadosRolagem: rolagem }) : null;
  if (av?.bloqueada) {
    if (!game.user.isGM) return ui.notifications.warn(`${nome} está bloqueada por: ${av.motivos.join(", ")}.`);
    if (!(await confirmar("Forma bloqueada", `<p><strong>${escapar(nome)}</strong> está bloqueada por ${escapar(av.motivos.join(", "))}.</p><p>Usar mesmo assim?</p>`))) return null;
    avisos.push(`Usada apesar de: ${av.motivos.join(", ")}.`);
  }
  const updates = {};
  if (forma && forma.custo.recurso !== "nenhum" && forma.custo.valor > 0) {
    const rec = forma.custo.recurso;
    const atual = ficha.recursos[rec]?.value ?? 0;
    if (atual < forma.custo.valor) {
      const sigla = CUSTO_RECURSOS[rec]?.sigla ?? rec.toUpperCase();
      if (!(await confirmar("Recurso insuficiente", `<p>Custa <strong>${forma.custo.valor} ${sigla}</strong> e você tem ${atual}.</p><p>Usar mesmo assim? O recurso vai a 0.</p>`))) return null;
      avisos.push(`${sigla} insuficiente.`);
    }
    const novo = Math.max(0, atual - forma.custo.valor);
    updates[rec === "pv" ? "system.attributes.hp.value" : `${P}.recursos.${rec}.value`] = novo;
  }
  if (Object.keys(updates).length) await actor.update(updates);
  if (forma) {
    const aviso = await marcarAcao(actor, forma.acao, ficha);
    if (aviso) avisos.push(aviso);
  }
  return cartaoPoder(actor, item, p, forma, { avisos, ficha, rolagem });
}

async function cartaoPoder(actor, item, p, forma, { avisos, ficha, rolagem }) {
  const r = RARIDADES_PODER[p.raridade];
  const linhas = [];
  const botoes = [];
  const requisitos = [];
  if (forma) {
    linhas.push({ rotulo: "Ação", valor: ACOES[forma.acao]?.label ?? forma.acao });
    linhas.push({ rotulo: "Custo", valor: textoCusto(forma) });
    for (const [campo, rotulo] of [["alcance", "Alcance"], ["area", "Área"], ["alvo", "Alvo"], ["duracao", "Duração"]]) {
      if (forma[campo]) linhas.push({ rotulo, valor: forma[campo] });
    }
    const per = ficha.periciaPorId[forma.teste.pericia];
    if (forma.teste.tipo === "resistencia") {
      linhas.push({ rotulo: "Resistência", valor: `${per?.nome ?? "teste do alvo"} contra CD ${ficha.cd.valor}` });
    } else if ((forma.teste.tipo === "ataque" || forma.teste.tipo === "pericia") && per) {
      const ataque = forma.teste.tipo === "ataque";
      botoes.push({
        acao: "teste", pericia: per.id, tipo: forma.teste.tipo,
        rotulo: `${ataque ? "Ataque" : `Teste de ${per.nome}`}: ${item.name}`,
        label: `${ataque ? "Atacar" : per.nome} (${sinalCurto(per.total)})`, icone: "fa-solid fa-dice-d20"
      });
    }
    if (forma.dano.formula) {
      const cura = /cura/i.test(forma.dano.tipo);
      botoes.push({
        acao: "formula", formula: forma.dano.formula,
        rotulo: `${cura ? "Cura" : "Dano"}: ${item.name}${forma.dano.tipo && !cura ? ` (${forma.dano.tipo})` : ""}`,
        label: `${cura ? "Cura" : "Dano"} ${forma.dano.formula}`, icone: cura ? "fa-solid fa-heart" : "fa-solid fa-burst"
      });
    }
    for (const [k, ligado] of Object.entries(forma.requisitos)) if (ligado) requisitos.push(REQUISITOS[k]?.label ?? k);
  }
  const fonte = forma?.efeito || item.system?.description?.value || "";
  const texto = await enriquecer(fonte, { relativeTo: item, rollData: rolagem });
  return enviarCartao(actor, {
    img: item.img, nome: item.name,
    tipoLabel: p.tipo === "magia" ? "Magia" : "Habilidade",
    raridadeLabel: r.label, raridadeCor: r.cor,
    circuloLabel: p.tipo === "magia" ? (CIRCULOS.find(c => c.nivel === p.circulo)?.label ?? `${p.circulo}º Círculo`) : "",
    formaNome: forma && p.formas.length > 1 ? forma.nome : "",
    linhas, botoes, requisitos, texto, avisos
  }, { tipo: "poder", itemUuid: item.uuid, formaId: forma?.id ?? null });
}

/* -------------------------------------------- */
/*  Criar e aprender habilidades e magias       */
/* -------------------------------------------- */

export async function criarPoder(actor, { tipo, nome = "", raridade = "comum", extra = "", passiva = false, aquisicao = "gratis", dadosBase = null }) {
  const { ficha } = estadoAtor(actor);
  const cfg = ajustes();
  const r = RARIDADES_PODER[raridade] ?? RARIDADES_PODER.comum;
  const custo = aquisicao === "criar" ? r.criar : aquisicao === "aprender" ? r.aprender : 0;
  const lim = situacaoLimite(contarRaridades(poderesDoAtor(actor)), tipo, raridade, cfg.modoLimites, 1);
  if (lim.excedido) {
    const texto = `${tipo === "magia" ? "Magias" : "Habilidades"} ${r.label}: limite de ${lim.limite}${cfg.modoLimites === "combinados" ? ", somando habilidades e magias" : ""}.`;
    if (cfg.bloquearLimites && !game.user.isGM) {
      ui.notifications.error(`${texto} Fale com o Mestre.`);
      return null;
    }
    if (!(await confirmar("Acima do limite", `<p>${escapar(texto)}</p><p>Adicionar mesmo assim?</p>`))) return null;
  }
  if (custo > ficha.pontos.ph) {
    ui.notifications.error(`Faltam ${custo - ficha.pontos.ph} PH: custa ${custo} e você tem ${ficha.pontos.ph}.`);
    return null;
  }
  let data;
  if (dadosBase) {
    data = foundry.utils.deepClone(dadosBase);
    for (const k of ["_id", "folder", "sort", "ownership", "_stats"]) delete data[k];
  } else {
    const forma = formaPadrao(0, passiva ? "Passiva" : "Padrão");
    if (passiva) forma.acao = "passiva";
    data = {
      name: nome || (tipo === "magia" ? "Nova magia" : "Nova habilidade"),
      type: tipo === "magia" ? "spell" : "feat",
      img: tipo === "magia" ? "icons/svg/lightning.svg" : "icons/svg/upgrade.svg",
      system: tipo === "magia" ? { level: Math.min(9, Math.max(0, int(extra))) } : {},
      flags: { [FLAG]: { formas: { [novoId()]: forma }, usos: { valor: 0, max: 0, recarga: "nenhuma" } } }
    };
  }
  foundry.utils.setProperty(data, `flags.${FLAG}.raridade`, raridade);
  if (tipo !== "magia") {
    if (passiva) foundry.utils.setProperty(data, `flags.${FLAG}.passiva`, true);
    if (extra) foundry.utils.setProperty(data, `flags.${FLAG}.origem`, extra);
  }
  const [criado] = await actor.createEmbeddedDocuments("Item", [data]);
  if (!criado) return null;
  if (custo) await actor.update({ [`${P}.pontos.ph`]: ficha.pontos.ph - custo });
  if (aquisicao !== "gratis") {
    const verbo = aquisicao === "criar" ? "Criou" : "Aprendeu";
    await ChatMessage.create({
      speaker: falar(actor),
      content: `<div class="epm-chat epm-chat-nota" style="--cor: ${r.cor}"><p>${verbo} <strong>${escapar(criado.name)}</strong> (${tipo === "magia" ? "magia" : "habilidade"} ${r.label})${custo ? ` por ${custo} PH` : ""}.</p></div>`
    });
  }
  return criado;
}

export async function dialogoNovoPoder(actor, tipo, circulo = 0) {
  const { ficha } = estadoAtor(actor);
  const cfg = ajustes();
  const eMagia = tipo === "magia";
  const contagem = contarRaridades(poderesDoAtor(actor));
  const opcoesRaridade = Object.entries(RARIDADES_PODER).map(([id, r]) => {
    const lim = situacaoLimite(contagem, tipo, id, cfg.modoLimites);
    return `<option value="${id}">${r.label}${lim.limite !== null ? ` (${lim.usados} de ${lim.limite})` : ""}</option>`;
  }).join("");
  const opcoesExtra = eMagia
    ? CIRCULOS.map(c => `<option value="${c.nivel}" ${c.nivel === circulo ? "selected" : ""}>${c.label}</option>`).join("")
    : `<option value="">Sem origem</option>${Object.entries(ORIGENS_HABILIDADE).map(([id, l]) => `<option value="${id}">${l}</option>`).join("")}`;
  const c = RARIDADES_PODER.comum;
  const content = `
    <label class="epm-campo"><span>Nome</span><input type="text" name="nome" value="${eMagia ? "Nova magia" : "Nova habilidade"}" autofocus></label>
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Raridade</span><select name="raridade">${opcoesRaridade}</select></label>
      <label class="epm-campo"><span>${eMagia ? "Círculo" : "Origem"}</span><select name="extra">${opcoesExtra}</select></label>
    </div>
    ${eMagia ? "" : `<label class="epm-check"><input type="checkbox" name="passiva"> Passiva</label>`}
    <fieldset class="epm-aquisicao"><legend>Como foi obtida</legend>
      <label class="epm-check"><input type="radio" name="aquisicao" value="criar" checked> Criar <span data-custo="criar">(${c.criar} PH)</span></label>
      <label class="epm-check"><input type="radio" name="aquisicao" value="aprender"> Aprender de grimório, mestre ou ensinamento <span data-custo="aprender">(${c.aprender} PH)</span></label>
      <label class="epm-check"><input type="radio" name="aquisicao" value="gratis"> Sem custo: concedida pela classe, raça ou Mestre</label>
    </fieldset>
    <p class="epm-dica">Você tem ${ficha.pontos.ph} PH.</p>`;
  const atualizar = raiz => {
    const r = RARIDADES_PODER[raiz.querySelector('[name="raridade"]')?.value] ?? c;
    const criar = raiz.querySelector('[data-custo="criar"]');
    const aprender = raiz.querySelector('[data-custo="aprender"]');
    if (criar) criar.textContent = `(${r.criar} PH)`;
    if (aprender) aprender.textContent = `(${r.aprender} PH)`;
  };
  const escolha = await fvtt.DialogV2.wait({
    window: { title: eMagia ? "Nova magia" : "Nova habilidade" }, classes: ["epm-dialogo"], rejectClose: false, modal: true, content,
    render: (evento, arg) => {
      const raiz = raizDialogo(evento, arg);
      if (!raiz) return;
      atualizar(raiz);
      raiz.querySelector('[name="raridade"]')?.addEventListener("change", () => atualizar(raiz));
    },
    buttons: [
      {
        action: "ok", label: "Criar", icon: "fa-solid fa-check", default: true,
        callback: (ev, b) => {
          const f = b.form.elements;
          return { nome: f.nome.value.trim(), raridade: f.raridade.value, extra: f.extra.value, passiva: !!f.passiva?.checked, aquisicao: f.aquisicao.value };
        }
      },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!escolha || typeof escolha !== "object") return null;
  return criarPoder(actor, { tipo, ...escolha });
}

/** Habilidade ou magia arrastada para a ficha: pergunta se é "aprender" (paga PH) ou sem custo. */
export async function aprenderPorArraste(actor, itemOrigem) {
  const tipo = itemOrigem.type === "spell" ? "magia" : "habilidade";
  const p = lerPoder(itemOrigem);
  const r = RARIDADES_PODER[p.raridade];
  const escolha = await fvtt.DialogV2.wait({
    window: { title: `Adicionar ${itemOrigem.name}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>${tipo === "magia" ? "Magia" : "Habilidade"} <strong>${escapar(itemOrigem.name)}</strong>, raridade ${r.label}.</p>
      <p class="epm-dica">Aprender algo que já existe custa ${r.aprender} PH. Use "sem custo" para o que a classe, a raça ou o Mestre concedem.</p>`,
    buttons: [
      { action: "aprender", label: `Aprender (${r.aprender} PH)`, icon: "fa-solid fa-book-open", default: true, callback: () => ({ aquisicao: "aprender" }) },
      { action: "gratis", label: "Sem custo", icon: "fa-solid fa-gift", callback: () => ({ aquisicao: "gratis" }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!escolha || typeof escolha !== "object") return null;
  return criarPoder(actor, { tipo, raridade: p.raridade, aquisicao: escolha.aquisicao, dadosBase: itemOrigem.toObject(), passiva: p.passiva });
}

/** Compra de melhoria com PT, respeitando o teto de dano e de efeitos da raridade. */
export async function aplicarMelhoria(item, { tipo, formaId, nota = "" }) {
  const m = MELHORIAS.find(x => x.id === tipo);
  if (!m) return null;
  const actor = item.actor ?? null;
  const p = lerPoder(item);
  const r = RARIDADES_PODER[p.raridade];
  const forma = p.formas.find(f => f.id === formaId) ?? p.formas[0] ?? null;
  const updates = {};
  if ((m.dano || m.efeito || m.de) && !forma) return ui.notifications.warn("Crie uma forma antes de comprar essa melhoria.");
  if (m.dano) {
    const nova = somarFormula(forma.dano.formula, m.dano);
    const maximo = maxFormula(nova, actor ? dadosRolagem(actor) : {});
    const teto = tetoDano(p.raridade);
    if (maximo !== null && teto !== null && maximo > teto) {
      return ui.notifications.error(`Com essa melhoria o dano máximo iria a ${maximo}, acima do teto ${r.label} (${r.danoMax} = ${teto}).`);
    }
    updates[`${P}.formas.${forma.id}.dano.formula`] = nova;
  }
  if (m.efeito && contarEfeitos(p.melhorias, forma.id) + 1 > r.efeitos) {
    return ui.notifications.error(`A raridade ${r.label} permite ${r.efeitos} efeito(s) adicional(is) por ativação.`);
  }
  if (m.de) {
    if (forma.acao !== m.de) return ui.notifications.warn(`Essa melhoria troca ${ACOES[m.de].label} por ${ACOES[m.para].label}, mas a forma usa ${ACOES[forma.acao].label}.`);
    updates[`${P}.formas.${forma.id}.acao`] = m.para;
  }
  let pt = null;
  if (actor) {
    pt = estadoAtor(actor).ficha.pontos.pt;
    if (pt < m.custo) return ui.notifications.error(`Faltam ${m.custo - pt} PT: custa ${m.custo} e você tem ${pt}.`);
  }
  const ok = await confirmar("Aplicar melhoria", `<p><strong>${escapar(m.label)}</strong>${forma ? ` na forma <strong>${escapar(forma.nome)}</strong>` : ""} por <strong>${m.custo} PT</strong>?</p>${actor ? "" : `<p class="epm-dica">O item não está numa ficha: nenhum PT será descontado.</p>`}`);
  if (!ok) return null;
  updates[`${P}.melhorias.${novoId()}`] = {
    tipo: m.id, label: m.label, custo: m.custo, forma: forma?.id ?? "", formaNome: forma?.nome ?? "",
    efeito: !!m.efeito, nota, data: Date.now()
  };
  await item.update(updates);
  if (actor) await actor.update({ [`${P}.pontos.pt`]: pt - m.custo });
  return true;
}

/* -------------------------------------------- */
/*  Combate                                     */
/* -------------------------------------------- */

export async function usarDefesa(actor, id) {
  const { ficha } = estadoAtor(actor);
  const def = ficha.defesas.find(d => d.id === id);
  if (!def) return null;
  const pendentes = ficha.acoes.defesas;
  if (pendentes >= REGRAS.maxDefesasPorRodada) {
    return ui.notifications.warn("As 3 ações do próximo turno já foram gastas em defesas.");
  }
  await actor.update({ [`${P}.acoes.defesas`]: pendentes + 1 });
  const total = pendentes + 1;
  return ChatMessage.create({
    speaker: falar(actor),
    content: `<div class="epm-chat epm-chat-defesa">
      <header class="epm-chat-topo"><i class="${def.icone}" aria-hidden="true"></i><div class="epm-chat-titulos"><h3>${def.label}: ${def.valor}</h3>
      <span class="epm-chat-sub">CA ${ficha.ca.total} + ${escapar(def.periciaNome)} ${def.periciaTotal}</span></div></header>
      <p class="epm-chat-texto">${escapar(def.descricao)}</p>
      <p class="epm-chat-aviso">Gasta 1 ação do próximo turno (${total} de 3).${total >= 3 ? " Começará o próximo turno sem ações." : ""}</p>
    </div>`
  });
}

export async function novoTurno(actor) {
  const { ficha, dados } = estadoAtor(actor);
  const divida = Math.min(ficha.acoes.defesas, 3);
  const usadas = { padrao: false, bonus: false, movimento: false };
  ["movimento", "bonus", "padrao"].slice(0, divida).forEach(a => { usadas[a] = true; });
  const updates = {
    [`${P}.acoes.padrao`]: usadas.padrao, [`${P}.acoes.bonus`]: usadas.bonus, [`${P}.acoes.movimento`]: usadas.movimento,
    [`${P}.acoes.reacao`]: false, [`${P}.acoes.defesas`]: 0
  };
  const lendaria = dados.acoes?.lendaria;
  if (int(lendaria?.max) > 0) updates[`${P}.acoes.lendaria.value`] = int(lendaria.max);
  await actor.update(updates);
  if (divida) ui.notifications.info(`Novo turno: ${divida} ação(ões) já gasta(s) com defesas.`);
}

export async function rolarIniciativa(actor, evento) {
  const { ficha } = estadoAtor(actor);
  const roll = await rolarTeste(actor, {
    rotulo: `Iniciativa (${ficha.iniciativa.fonte})`, bonus: ficha.iniciativa.total, evento, desvantagens: ficha.desvantagens.testes
  });
  const combatente = game.combat?.combatants.find(c => c.actor?.uuid === actor.uuid);
  if (combatente && roll) {
    try { await combatente.update({ initiative: roll.total }); }
    catch (err) {
      console.warn("EPM |", err);
      ui.notifications.warn("Não foi possível registrar a iniciativa no combate. Peça ao Mestre.");
    }
  }
  return roll;
}

/** Faz o rolar iniciativa do Combat Tracker usar a fórmula EPM para quem usa a ficha EPM. */
export function integrarIniciativa(ClasseFicha) {
  const Cls = CONFIG.Combatant?.documentClass;
  if (!Cls?.prototype?.getInitiativeRoll) return;
  const original = Cls.prototype.getInitiativeRoll;
  Cls.prototype.getInitiativeRoll = function (formula) {
    try {
      const actor = this.actor;
      if (actor && usaFicha(actor, ClasseFicha)) {
        const { ficha } = estadoAtor(actor);
        const desvantagem = ficha.desvantagens.testes.length > 0;
        return new Roll(`${formulaD20({ desvantagem })} ${comSinal(ficha.iniciativa.total)}`, dadosRolagem(actor, ficha));
      }
    } catch (err) {
      console.warn("EPM | Iniciativa EPM falhou; usando a do sistema", err);
    }
    return original.call(this, formula);
  };
}

function usaFicha(actor, ClasseFicha) {
  try {
    const C = actor._getSheetClass?.();
    if (C) return C === ClasseFicha || C.prototype instanceof ClasseFicha;
  } catch { /* segue */ }
  return actor.sheet instanceof ClasseFicha;
}

/* -------------------------------------------- */
/*  Descanso, progressão e moedas               */
/* -------------------------------------------- */

export async function descanso(actor, tipo) {
  const longo = tipo === "longo";
  const { ficha } = estadoAtor(actor);
  const rec = ficha.recursos;
  const linha = (nome, rotulo, marcado) => `<label class="epm-check"><input type="checkbox" name="${nome}" ${marcado ? "checked" : ""}> ${rotulo}</label>`;
  const n = ficha.exaustao.nivel;
  const content = `
    <p class="epm-dica">Marque o que acontece neste ${longo ? "descanso longo" : "descanso curto"}.</p>
    ${linha("pv", `Recuperar toda a Vida (${rec.pv.value} de ${rec.pv.max})`, longo)}
    ${linha("pm", `Recuperar toda a Mana (${rec.pm.value} de ${rec.pm.max})`, longo)}
    ${linha("pe", `Recuperar toda a Estamina (${rec.pe.value} de ${rec.pe.max})`, longo)}
    ${linha("ps", `Recuperar toda a Sanidade (${rec.ps.value} de ${rec.ps.max})`, false)}
    ${longo && n > 0 ? linha("exaustao", `Reduzir a Exaustão de ${n} para ${n - 1}`, true) : ""}
    ${linha("treino", `Treinou durante o descanso (+${REGRAS.ptPorTreino} PT)`, false)}`;
  const escolha = await fvtt.DialogV2.wait({
    window: { title: longo ? "Descanso longo" : "Descanso curto" }, classes: ["epm-dialogo"], rejectClose: false, modal: true, content,
    buttons: [
      {
        action: "ok", label: "Descansar", icon: longo ? "fa-solid fa-bed" : "fa-solid fa-mug-hot", default: true,
        callback: (ev, b) => Object.fromEntries(["pv", "pm", "pe", "ps", "exaustao", "treino"].map(k => [k, !!b.form.elements[k]?.checked]))
      },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!escolha || typeof escolha !== "object") return;
  const updates = {};
  const feitos = [];
  if (escolha.pv) { updates["system.attributes.hp.value"] = rec.pv.max; feitos.push("Vida cheia"); }
  for (const id of ["pm", "pe", "ps"]) {
    if (escolha[id]) { updates[`${P}.recursos.${id}.value`] = rec[id].max; feitos.push(`${RECURSOS[id].label} cheia`); }
  }
  if (escolha.exaustao && n > 0) { updates[`${P}.exaustao`] = n - 1; feitos.push(`Exaustão ${n} → ${n - 1}`); }
  if (escolha.treino) { updates[`${P}.pontos.pt`] = ficha.pontos.pt + REGRAS.ptPorTreino; feitos.push(`+${REGRAS.ptPorTreino} PT de treino`); }
  if (longo) Object.assign(updates, { [`${P}.acoes.padrao`]: false, [`${P}.acoes.bonus`]: false, [`${P}.acoes.movimento`]: false, [`${P}.acoes.reacao`]: false, [`${P}.acoes.defesas`]: 0 });
  if (Object.keys(updates).length) await actor.update(updates);
  return ChatMessage.create({
    speaker: falar(actor),
    content: `<div class="epm-chat epm-chat-nota"><p><strong>${longo ? "Descanso longo" : "Descanso curto"}</strong>${feitos.length ? `: ${escapar(feitos.join(", "))}.` : "."}</p></div>`
  });
}

export async function subirNivel(actor, arquetipo = 1) {
  const { ficha, dados } = estadoAtor(actor);
  const prog = ficha.progressao;
  const segundo = arquetipo === 2;
  const atual = segundo ? prog.nivel2 : prog.nivel1;
  const novo = atual + 1;
  const custo = custoNivel(novo);
  const nome = (segundo ? dados.arquetipo2 : dados.arquetipo) || "Arquétipo";
  if (novo > REGRAS.nivelMaxArquetipo) return ui.notifications.warn(`${nome} já está no nível máximo (${REGRAS.nivelMaxArquetipo}).`);
  if (prog.nivelTotal + 1 > REGRAS.nivelMaxTotal) return ui.notifications.warn(`O personagem já tem ${REGRAS.nivelMaxTotal} níveis no total.`);
  if (ficha.pontos.pev < custo) return ui.notifications.warn(`Faltam ${custo - ficha.pontos.pev} PEv: custa ${custo}.`);
  const total = prog.nivelTotal + 1;
  const ganhos = [];
  if (total % 2 === 0) ganhos.push("+1 ponto de atributo");
  if (total % 5 === 0) ganhos.push("+15 pontos de perícia e limite por perícia +5");
  if (novo === 2 && /conjurador/i.test(nome)) ganhos.push("Conjurador: +1 truque e magias de 1º círculo liberadas");
  const lista = ganhos.length ? `<ul>${ganhos.map(g => `<li>${g}</li>`).join("")}</ul>` : "";
  const ok = await confirmar("Subir de nível", `<p>${escapar(nome)}: nível ${atual} para <strong>${novo}</strong> por <strong>${custo} PEv</strong> (você tem ${ficha.pontos.pev}).</p>${lista}<p class="epm-dica">Depois, atualize Vida, Mana e Esforço conforme o arquétipo.</p>`);
  if (!ok) return;
  await actor.update({ [`${P}.${segundo ? "nivel2" : "nivel"}`]: novo, [`${P}.pontos.pev`]: ficha.pontos.pev - custo });
  return ChatMessage.create({
    speaker: falar(actor),
    content: `<div class="epm-chat epm-chat-nota"><p><strong>${escapar(nome)}</strong> subiu para o nível ${novo} (−${custo} PEv). Nível total ${total}.</p>${lista}</div>`
  });
}

export async function converterPontos(actor, de, tudo = false) {
  const { ficha } = estadoAtor(actor);
  const taxa = de === "pt" ? REGRAS.ptPorPh : REGRAS.pevPorPh;
  const sigla = de === "pt" ? "PT" : "PEv";
  const tem = ficha.pontos[de];
  const vezes = tudo ? Math.floor(tem / taxa) : Math.min(1, Math.floor(tem / taxa));
  if (!vezes) return ui.notifications.warn(`São precisos ${taxa} ${sigla} para 1 PH.`);
  await actor.update({ [`${P}.pontos.${de}`]: tem - vezes * taxa, [`${P}.pontos.ph`]: ficha.pontos.ph + vezes });
  ui.notifications.info(`${vezes * taxa} ${sigla} viraram ${vezes} PH.`);
}

export async function operarMoedas(actor, operacao) {
  const { dados } = estadoAtor(actor);
  if (operacao === "consolidar") {
    const total = valorEmCobre(dados.moedas);
    if (!(await confirmar("Consolidar moedas", `<p>Trocar suas moedas pelo menor número de moedas de maior valor?</p><p><strong>${formatarMoedas(total)}</strong></p>`))) return;
    return actor.update({ [`${P}.moedas`]: consolidarMoedas(dados.moedas) });
  }
  const receber = operacao === "receber";
  const opcoes = MOEDAS.map(m => `<option value="${m.id}" ${m.id === "po" ? "selected" : ""}>${m.label}</option>`).join("");
  const r = await fvtt.DialogV2.wait({
    window: { title: receber ? "Receber moedas" : "Pagar" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<div class="epm-dialogo-linha">
        <label class="epm-campo"><span>Quantidade</span><input type="number" name="qtd" min="1" step="1" value="1" autofocus></label>
        <label class="epm-campo"><span>Moeda</span><select name="moeda">${opcoes}</select></label>
      </div>
      ${receber ? "" : `<p class="epm-dica">O troco é calculado sozinho. Você tem ${formatarMoedas(valorEmCobre(dados.moedas))}.</p>`}`,
    buttons: [
      { action: "ok", label: receber ? "Receber" : "Pagar", icon: receber ? "fa-solid fa-plus" : "fa-solid fa-minus", default: true, callback: (ev, b) => ({ qtd: b.form.elements.qtd.value, moeda: b.form.elements.moeda.value }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object") return;
  const moeda = moedaPorId(r.moeda);
  const qtd = Math.max(0, Math.floor(num(r.qtd)));
  if (!moeda || !qtd) return;
  if (receber) return actor.update({ [`${P}.moedas.${moeda.id}`]: int(dados.moedas[moeda.id]) + qtd });
  const novas = pagarMoedas(dados.moedas, qtd * moeda.valor);
  if (!novas) return ui.notifications.warn(`Dinheiro insuficiente: você tem ${formatarMoedas(valorEmCobre(dados.moedas))}.`);
  await actor.update({ [`${P}.moedas`]: novas });
  ui.notifications.info(`Pagou ${qtd} ${moeda.label}. Restam ${formatarMoedas(valorEmCobre(novas))}.`);
}

/* -------------------------------------------- */
/*  Botões dos cartões de chat                  */
/* -------------------------------------------- */

async function atorDoCartao(cartao) {
  const uuid = cartao?.dataset.actorUuid;
  if (uuid) {
    try { const a = await fromUuid(uuid); if (a) return a; } catch { /* segue */ }
  }
  const id = cartao?.closest("[data-message-id]")?.dataset.messageId;
  const msg = id ? game.messages.get(id) : null;
  return msg ? ChatMessage.getSpeakerActor(msg.speaker) : null;
}

let chatLigado = false;
export function registrarChat() {
  if (chatLigado) return;
  chatLigado = true;
  document.addEventListener("click", async ev => {
    const botao = ev.target.closest?.(".epm-chat [data-epm-action]");
    if (!botao) return;
    ev.preventDefault();
    ev.stopPropagation();
    const cartao = botao.closest(".epm-chat");
    const actor = await atorDoCartao(cartao);
    const { epmAction: acao, formula, rotulo, pericia, tipo } = botao.dataset;
    if (acao === "formula") return rolarFormula(actor, formula, rotulo || "Rolagem");
    if (acao === "teste") {
      if (!actor) return ui.notifications.warn("Não encontrei o personagem deste cartão.");
      const { ficha } = estadoAtor(actor);
      const per = ficha.periciaPorId[pericia];
      const desvantagens = tipo === "ataque" ? ficha.desvantagens.ataques : ficha.desvantagens.testes;
      return rolarTeste(actor, { rotulo: rotulo || "Teste", bonus: per?.total ?? 0, evento: ev, desvantagens });
    }
  });
}

export { TIPOS_TESTE };

/* -------------------------------------------- */
/*  Ataques com crítico e bônus                 */
/* -------------------------------------------- */

export function fonteAtaque(actor, tipo, ref) {
  if (tipo === "arma") {
    const item = actor.items.get(ref);
    return item ? ataqueDeArma(item) : null;
  }
  const dados = actor.flags?.[FLAG]?.ataques?.[ref];
  return dados ? ataqueCustom(ref, dados) : null;
}

/** Diálogo antes do ataque: normal/vantagem/desvantagem, bônus externos e ajuste de crítico. */
export async function dialogoAtaque(actor, tipo, ref) {
  const at = fonteAtaque(actor, tipo, ref);
  if (!at) return null;
  const { ficha, dados } = estadoAtor(actor);
  const cena = bonusCenaAtivos(dados);
  const per = ficha.periciaPorId[at.periciaId];
  const acerto = (per?.total ?? 0) + at.bonusAcerto + cena.acerto;
  const desv = ficha.desvantagens.ataques;
  const padrao = desv.length ? "desvantagem" : "normal";
  const radio = (valor, rotulo) => `<label class="epm-check"><input type="radio" name="modo" value="${valor}" ${valor === padrao ? "checked" : ""}> ${rotulo}</label>`;
  const content = `
    <p class="epm-dica">${escapar(per?.nome ?? "Sem perícia")} ${sinalCurto(acerto)} no acerto${at.dano ? `, dano ${escapar(at.dano)}` : ""}${cena.nomes.length ? `. Bônus de cena: ${escapar(cena.nomes.join(", "))}` : ""}.</p>
    <fieldset class="epm-aquisicao"><legend>Rolagem</legend>
      <div class="epm-dialogo-linha epm-dialogo-tres">${radio("normal", "Normal")}${radio("vantagem", "Vantagem")}${radio("desvantagem", "Desvantagem")}</div>
      ${desv.length ? `<p class="epm-dica">Condições pedem desvantagem: ${escapar(desv.join(", "))}.</p>` : ""}
    </fieldset>
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Bônus externo no acerto</span><input type="text" name="extraAcerto" placeholder="2 ou 1d4"></label>
      <label class="epm-campo"><span>Bônus externo no dano</span><input type="text" name="extraDano" placeholder="3 ou 1d6"></label>
    </div>
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Margem de crítico (d20 ≥)</span><input type="number" name="margem" min="2" max="20" value="${at.critMargem}"></label>
      <label class="epm-campo"><span>Multiplicador de crítico</span><input type="number" name="mult" min="2" value="${at.critMult}"></label>
    </div>
    <label class="epm-check"><input type="checkbox" name="comDano" ${at.dano || cena.dano.length ? "checked" : ""}> Rolar o dano junto</label>`;
  const escolha = await fvtt.DialogV2.wait({
    window: { title: `Atacar: ${at.nome}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true, content,
    buttons: [
      {
        action: "rolar", label: "Rolar", icon: "fa-solid fa-dice-d20", default: true,
        callback: (ev, b) => {
          const f = b.form.elements;
          return { modo: f.modo.value, extraAcerto: f.extraAcerto.value.trim(), extraDano: f.extraDano.value.trim(), margem: f.margem.value, mult: f.mult.value, comDano: f.comDano.checked };
        }
      },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!escolha || typeof escolha !== "object") return null;
  return rolarAtaque(actor, at, escolha);
}

/** Rola acerto e dano num só cartão. No crítico, os dados do ataque são multiplicados (2d10 ×3 = 6d10). */
export async function rolarAtaque(actor, at, { modo = "normal", extraAcerto = "", extraDano = "", margem, mult, comDano = true } = {}) {
  const { ficha, dados } = estadoAtor(actor);
  const cena = bonusCenaAtivos(dados);
  const per = ficha.periciaPorId[at.periciaId];
  const rd = dadosRolagem(actor, ficha);
  const d20 = formulaD20({ vantagem: modo === "vantagem", desvantagem: modo === "desvantagem" });
  const partesAcerto = [d20, per?.total ?? 0, at.bonusAcerto, cena.acerto].map(String).filter(x => x !== "0");
  if (extraAcerto) partesAcerto.push(extraAcerto);
  let atk;
  try {
    atk = new Roll(Roll.replaceFormulaData(partesAcerto.join(" + "), rd, { missing: "0" }));
    await atk.evaluate();
  } catch (err) {
    console.warn("EPM |", err);
    return ui.notifications.error("Não consegui rolar o acerto. Confira o bônus externo.");
  }
  const margemFinal = limitar(int(margem, at.critMargem), 2, 20);
  const multFinal = Math.max(2, int(mult, at.critMult));
  const natural = atk.dice[0]?.total ?? 0;
  const critico = natural >= margemFinal;
  let dmg = null;
  if (comDano) {
    const base = at.dano ? (critico ? multiplicarDados(at.dano, multFinal) : at.dano) : "";
    const partesDano = [base, ...cena.dano, extraDano].filter(Boolean);
    if (partesDano.length) {
      try {
        dmg = new Roll(Roll.replaceFormulaData(partesDano.join(" + "), rd, { missing: "0" }));
        await dmg.evaluate();
      } catch (err) {
        console.warn("EPM |", err);
        ui.notifications.error("Não consegui rolar o dano. Confira as fórmulas.");
        dmg = null;
      }
    }
  }
  const notas = [];
  if (cena.nomes.length) notas.push(`Bônus de cena: ${cena.nomes.join(", ")}.`);
  if (extraAcerto) notas.push(`Bônus externo no acerto: ${extraAcerto}.`);
  if (extraDano) notas.push(`Bônus externo no dano: ${extraDano}.`);
  if (margemFinal !== at.critMargem || multFinal !== at.critMult) notas.push(`Crítico ajustado para ${margemFinal < 20 ? `${margemFinal}–20` : "20"}/×${multFinal}.`);
  const rotulos = { normal: "", vantagem: "com vantagem", desvantagem: "com desvantagem" };
  const content = await fvtt.renderTemplate(`${CAMINHO}/chat/ataque.hbs`, {
    actorUuid: actor.uuid, img: at.img, nome: at.nome, periciaNome: per?.nome ?? "sem perícia",
    modo: rotulos[modo] ?? "", htmlAtaque: await atk.render(), htmlDano: dmg ? await dmg.render() : "",
    critico, mult: multFinal, tipoDano: at.tipoDano, notas, cor: critico ? "#E8C547" : "#D3A85E"
  });
  const mensagem = { speaker: falar(actor), content, rolls: [atk, dmg].filter(Boolean), sound: CONFIG.sounds?.dice, flags: { [FLAG]: { tipo: "ataque" } } };
  try { ChatMessage.applyRollMode(mensagem, game.settings.get("core", "rollMode")); } catch { /* modo padrão */ }
  return ChatMessage.create(mensagem);
}

export async function definirVidaTemp(actor) {
  const atual = num(actor.system?.attributes?.hp?.temp);
  const valor = await perguntarTexto("Vida temporária", "Vida temporária (0 remove)", atual ? String(atual) : "", "Aplicar");
  if (valor === null) return;
  await actor.update({ "system.attributes.hp.temp": Math.max(0, Math.floor(num(valor))) });
}
