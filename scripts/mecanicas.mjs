/**
 * Mecânicas que conversam com o Foundry: rolagens, cartões de chat, uso de habilidades e magias,
 * defesas, descanso, moedas e progressão. A matemática pura fica em data.mjs.
 */
import {
  FLAG, CAMINHO, ACOES, CUSTO_RECURSOS, RARIDADES_PODER, RARIDADES_ITEM, REQUISITOS, MOEDAS, REGRAS,
  custoNivel, ORIGENS_HABILIDADE, CIRCULOS, MELHORIAS, RECURSOS, TIPOS_TESTE, CONDICOES, COMBINACOES,
  EXAUSTAO, EXAUSTAO_MAX, TREINO, UNIDADES_TEMPO, MINIJOGOS, PT_POR_ACERTOS, GATILHOS_BONUS
} from "./config.mjs";
import {
  num, int, novoId, lerPoder, avaliarForma, textoCusto, eSustentada, contarRaridades, situacaoLimite, raridadeItem,
  maxFormula, tetoDano, contarEfeitos, somarFormula, valorEmCobre, pagarMoedas, consolidarMoedas,
  formatarMoedas, formaPadrao, moedaPorId, multiplicarDados, bonusCenaAtivos, limitar, lerEfeitosItem,
  custoEfetivo, condicaoPorId, danoRecebido, municaoDaArma, lerTipoDano, normalizarTexto, nivelHabilidade, montarBonusCena
} from "./data.mjs";
import { lerAtor, dadosRolagemEPM, danoArma, periciaAtaquePadrao, ataqueDeArma, ataqueCustom, modsDoAtaque } from "./context.mjs";
import { automacaoDe, NATUREZAS, RARIDADES_BENCAO, FREQUENCIAS } from "./bencaos.mjs";
import { fvtt, enriquecer, escapar } from "./helpers.mjs";
import { ajustes, listaPericias } from "./settings.mjs";
import { num as numBonus } from "./numeros.mjs";
import { ARQUETIPOS, nivelArquetipo, degrau, efeitoMaestria, estilosEscolhidos, custoMagiaCirculo, eTipoFavorito } from "./arquetipos.mjs";
import { listaPropriedades as listaPropriedadesItem, ataqueDesarmado } from "./context.mjs";
import { EFEITO_ELEMENTO, DANO_EFEITO_ELEMENTO, DT_EFEITO_ELEMENTO } from "./regras-extras.mjs";
import { custoRecurso, turnoTransformacao, destransformar, cliqueChatExtra, registrarBestiario } from "./extras.mjs";
import { htmlDupla, prepararDupla, prepararConjunta, inspiracaoDe, consumirVantagemArmada, gastarInspiracao } from "./cooperacao.mjs";
import { recuperadoNoNovoTurno, encerrarRecuperado } from "./automacoes.mjs";
import { regra, bonusMaestria, subirNivelDano } from "./opcionais.mjs";
import { htmlAtividades, lerAtividade, fimDaReza, fazerAtividade, falhaCritica, fimDesprevenidoDaFalha } from "./opcionais-acoes.mjs";
import { recarregarAncoras } from "./vinculos.mjs";
import { gastarDurabilidade, armaduraEquipada, PERDA_CRITICO, quebrado } from "./oficina.mjs";
import { penalidadeTec, DT_COMPLEXO } from "./tecnologia.mjs";

const P = `flags.${FLAG}`;

/** Manobras do Combatente (Notion: passiva do arquétipo, 1 vez por turno ao atacar). */
export const MANOBRAS = [
  { id: "desarmar", label: "Desarmar", texto: "Se acertar, o alvo deixa cair o que segura (o Mestre decide o teste, se houver)." },
  { id: "derrubar", label: "Derrubar", texto: "Se acertar, o alvo fica Caído." },
  { id: "acerto", label: "Diminuir o acerto", texto: "Se acertar, o alvo tem −1 no acerto até o próximo turno dele." },
  { id: "concentracao", label: "Dificultar a concentração", texto: "Se acertar, o alvo tem desvantagem para manter a concentração." },
  { id: "empurrar", label: "Empurrar 1,5 m", texto: "Se acertar, o alvo é empurrado 1,5 m." }
];
const TIPO_ITEM = {
  weapon: "Arma", consumable: "Consumível", equipment: "Armadura", tool: "Ferramenta",
  container: "Mochila", backpack: "Mochila", loot: "Loot"
};

const comSinal = n => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);

/** Tabela do Insano, rolada no início do turno (1d6). */
const TABELA_INSANO = [
  { ate: 2, texto: "Perde o turno." },
  { ate: 4, texto: "Ataca a criatura mais próxima." },
  { ate: 6, texto: "Age normalmente." }
];
/** Status que a Exaustão 5 marca no token. */
const STATUS_COLAPSO = ["epm-incapacitado", "epm-inconsciente"];
/** Condições que "remove todas as condições negativas" não tira. */
const CONDICOES_NEUTRAS = ["epm-concentrado", "epm-voando", "epm-invisivel", "epm-recuperado"];
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

/** Teste d20 + bônus. Shift = vantagem, Ctrl/Cmd = desvantagem; desvantagens e vantagens da ficha entram sozinhas. */
export async function rolarTeste(actor, { rotulo, bonus = 0, evento = null, desvantagens = [], vantagens = [], nota = "", penalidades = [] } = {}) {
  // Inspiração de Tema: "próximo teste com vantagem" armado na ficha gasta 1 Inspiração
  if (await consumirVantagemArmada(actor)) vantagens = [...vantagens, "Inspiração"];
  const vantagem = !!evento?.shiftKey || vantagens.length > 0;
  const desvantagem = !!(evento?.ctrlKey || evento?.metaKey) || desvantagens.length > 0;
  const roll = new Roll(`${formulaD20({ vantagem, desvantagem })} ${comSinal(int(bonus))}`, dadosRolagem(actor));
  await roll.evaluate();
  const partes = [];
  if (vantagem && desvantagem) partes.push(`vantagem${vantagens.length ? ` (${vantagens.join(", ")})` : ""} e desvantagem se anulam`);
  else if (vantagem) partes.push(vantagens.length ? `com vantagem (${vantagens.join(", ")})` : "com vantagem");
  else if (desvantagem) partes.push(desvantagens.length ? `com desvantagem (${desvantagens.join(", ")})` : "com desvantagem");
  const pen = penalidades.filter(p => p.valor);
  if (pen.length) partes.push(pen.map(p => `${sinalCurto(p.valor)} ${p.fonte}`).join(", "));
  if (nota) partes.push(nota);
  await roll.toMessage({
    speaker: falar(actor),
    flavor: `<span class="epm-flavor"><strong>${escapar(rotulo)}</strong>${partes.length ? `<em>${escapar(partes.join("; "))}</em>` : ""}</span>`,
    flags: { [FLAG]: { tipo: "teste", rotulo, formula: roll.formula, total: roll.total, actorUuid: actor?.uuid ?? "" } }
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
  const at = ataqueDeArma(item);
  const per = ficha.periciaPorId[at.periciaId];
  const m = modsDoAtaque(at, ficha);
  return rolarTeste(actor, {
    rotulo: `Ataque: ${item.name}${per ? ` (${per.nome})` : ""}`,
    bonus: (per?.total ?? 0) + at.bonusAcerto + m.acerto, evento,
    desvantagens: ficha.desvantagens.ataques, vantagens: ficha.vantagens.ataques, penalidades: m.acertoFontes
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

export async function cartaoItem(actor, item, { avisos = [], linhas = [] } = {}) {
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
    img: item.img, nome: item.name, tipoLabel, raridadeLabel, raridadeCor, circuloLabel, texto, botoes, avisos, linhas
  }, { tipo: "item", itemUuid: item.uuid });
}

/** Consumível: gasta 1 unidade e aplica as curas e recuperações configuradas no item. */
/**
 * Item complexo 2 níveis de tecnologia acima: antes do primeiro uso, teste de Tecnologia DT 20.
 * Passou, o personagem aprendeu a usar aquele item (fica marcado nele); falhou, não usa desta vez.
 */
export async function liberarComplexo(actor, item, ficha = null) {
  if (item.flags?.[FLAG]?.tecEntendido) return true;
  ficha ??= estadoAtor(actor).ficha;
  const per = ficha.periciaPorId?.tecnologia;
  const roll = await rolarTeste(actor, {
    rotulo: `Entender ${item.name} (Tecnologia DT ${DT_COMPLEXO})`, bonus: per?.testeTotal ?? 0,
    desvantagens: [...ficha.desvantagens.testes, ...(per?.desvantagem ?? [])], vantagens: [...ficha.vantagens.testes, ...(per?.vantagem ?? [])], penalidades: per?.testeFontes ?? []
  });
  if (!roll) return false;
  if (roll.total >= DT_COMPLEXO) {
    await item.update({ [`flags.${FLAG}.tecEntendido`]: true });
    ui.notifications.info(`${actor.name} entendeu como usar ${item.name}.`);
    return true;
  }
  ui.notifications.warn(`${actor.name} não entendeu como usar ${item.name} (${roll.total} contra DT ${DT_COMPLEXO}). Pode tentar de novo.`);
  return false;
}

export async function usarItem(actor, item) {
  const tecUso = penalidadeTec(item, estadoAtor(actor).ficha.extras?.tecnologia ?? 1);
  if (tecUso?.complexo && !(await liberarComplexo(actor, item))) return null;
  const qtd = num(item.system?.quantity, 1);
  const cargas = item.flags?.[FLAG]?.cargas;
  const avisos = [];
  if (int(cargas?.max) > 0) {
    const valor = int(cargas.valor);
    if (valor <= 0) return ui.notifications.warn(`${item.name} está sem cargas.`);
    await item.update({ [`flags.${FLAG}.cargas.valor`]: valor - 1 });
    avisos.push(`Gastou 1 carga. Restam ${valor - 1} de ${int(cargas.max)}.`);
  } else {
    if (qtd <= 0) return ui.notifications.warn(`${item.name} acabou.`);
    await item.update({ "system.quantity": qtd - 1 });
    avisos.push(`Usou 1. Restam ${qtd - 1}.`);
  }
  const curas = lerEfeitosItem(item).filter(e => e.tipo === "cura" && e.quando === "uso" && e.formula);
  if (curas.length) {
    for (const c of curas) {
      const { ficha } = estadoAtor(actor);
      let roll;
      try {
        roll = new Roll(Roll.replaceFormulaData(c.formula, dadosRolagem(actor, ficha), { missing: "0" }));
        await roll.evaluate();
      } catch (err) {
        console.warn("EPM |", err);
        avisos.push(`Não consegui rolar "${c.formula}".`);
        continue;
      }
      const rec = calcularRecuperacao(ficha, c.recurso, roll.total);
      if (Object.keys(rec.updates).length) await actor.update(rec.updates);
      avisos.push(`${c.formula} = ${roll.total}. ${rec.texto}`);
    }
  }
  // 0.6.7: consumíveis do catálogo removem e aplicam condições e dão bônus pela cena
  const fx = item.flags?.[FLAG] ?? {};
  const nomeCond = id => CONDICOES.find(c => c.id === id)?.label ?? id;
  const removidas = [];
  for (const id of Array.isArray(fx.removeCondicoes) ? fx.removeCondicoes : []) {
    if (!actor.statuses?.has(`epm-${id}`)) continue;
    try { await actor.toggleStatusEffect(`epm-${id}`, { active: false }); removidas.push(nomeCond(id)); } catch (err) { console.warn("EPM |", err); }
  }
  if (removidas.length) avisos.push(`Removeu: ${removidas.join(", ")}.`);
  const aplicadas = [];
  for (const id of Array.isArray(fx.aplicaCondicoes) ? fx.aplicaCondicoes : []) {
    if (actor.statuses?.has(`epm-${id}`)) continue;
    try { await actor.toggleStatusEffect(`epm-${id}`, { active: true }); aplicadas.push(nomeCond(id)); } catch (err) { console.warn("EPM |", err); }
  }
  if (aplicadas.length) avisos.push(`Agora está: ${aplicadas.join(", ")}.`);
  if (fx.bonusUso && typeof fx.bonusUso === "object") {
    const b = fx.bonusUso;
    const atuais = actor.flags?.[FLAG]?.bonusCena ?? {};
    const upd = {};
    for (const [id, x] of Object.entries(atuais)) if (x?.origem === item.id) upd[`${P}.bonusCena.-=${id}`] = null;
    upd[`${P}.bonusCena.${novoId()}`] = {
      nome: `${item.name}: ${b.texto || "bônus"}`, ativo: true, acerto: int(b.acerto), dano: String(b.dano ?? ""), ca: int(b.ca),
      rd: int(b.rd), rdTipo: String(b.rdTipo ?? ""), resTipo: String(b.resTipo ?? ""), testes: int(b.testes), deslocamento: num(b.deslocamento), origem: item.id, cena: true, criado: Date.now()
    };
    await actor.update(upd);
    avisos.push(`${b.texto || "Bônus"} pela cena (aba Combate → Bônus de cena).`);
  }
  if (tecUso && !tecUso.protecao) avisos.push(`${tecUso.fonte}: os testes com o item têm desvantagem${tecUso.penal ? ` e ${tecUso.penal}` : ""}.`);
  return cartaoItem(actor, item, { avisos });
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
  const aviso = acao !== "reacao" && ficha.acoes.esgotadas
    ? `Limite de ${ficha.acoes.limite} ação por turno (${ficha.acoes.limiteFontes.join(", ")}).` : null;
  await actor.update({ [`${P}.acoes.${acao}`]: true });
  return aviso;
}

export async function usarPoder(actor, item, { evento = null, automatico = false, formaId = "", conjunta = false, ativar = false } = {}) {
  const { ficha, dados } = estadoAtor(actor);
  const p = lerPoder(item);
  // Técnica de Maestria: só depois que o Mestre aprovar
  if (item.flags?.[FLAG]?.aprovacao === "pendente" && !game.user.isGM) return ui.notifications.warn(`${item.name} ainda espera a aprovação do Mestre.`);
  if (p.origem === "transformacao" && p.transformacao && dados.transformacoes?.[p.transformacao] && dados.transformacao?.ativa !== p.transformacao) {
    const nomeT = dados.transformacoes[p.transformacao].nome || "a transformação";
    if (!game.user.isGM) return ui.notifications.warn(`${item.name} só pode ser usada transformado em ${nomeT}.`);
    if (!(await confirmar("Habilidade de transformação", `<p><strong>${escapar(item.name)}</strong> é de ${escapar(nomeT)}, que não está ativa.</p><p>Usar mesmo assim?</p>`))) return null;
  }
  const rolagem = dadosRolagemEPM(ficha);
  const poder = { tipo: p.tipo, origem: p.origem };
  let forma = null;
  if (formaId) forma = p.formas.find(f => f.id === formaId) ?? null;
  if (forma) { /* já escolhida (gatilho automático) */ } else if (p.formas.length === 1) forma = p.formas[0];
  else if (p.formas.length > 1) {
    forma = await escolherForma(item, p, ficha, rolagem);
    if (!forma) return null;
  }
  const avisos = [];
  const nome = `${item.name}${forma && p.formas.length > 1 ? ` (${forma.nome})` : ""}`;
  const av = forma ? avaliarForma(forma, ficha, { raridade: p.raridade, melhorias: p.melhorias, dadosRolagem: rolagem, poder }) : null;
  if (av?.bloqueada) {
    if (!game.user.isGM) return ui.notifications.warn(`${nome} está bloqueada por: ${av.motivos.join(", ")}.`);
    if (!(await confirmar("Forma bloqueada", `<p><strong>${escapar(nome)}</strong> está bloqueada por ${escapar(av.motivos.join(", "))}.</p><p>Usar mesmo assim?</p>`))) return null;
    avisos.push(`Usada apesar de: ${av.motivos.join(", ")}.`);
  }
  const updates = {};
  let custo = forma ? custoEfetivo(forma, ficha, p.tipo) : { recurso: "nenhum", valor: 0, extra: 0 };
  let pvPerdidos = 0;
  // Magia conjunta: o parceiro confirma e paga a parte dele da Mana; a CD vira a maior + 2
  let conj = null;
  if (conjunta) {
    if (p.tipo !== "magia") { ui.notifications.warn("Magia conjunta é só para magias."); return null; }
    conj = await prepararConjunta(actor, nome, forma, custo.recurso === "pm" ? custo.valor : 0, ficha);
    if (!conj) return null;
    if (custo.recurso === "pm") custo = { ...custo, valor: Math.max(0, custo.valor - conj.parteParceiro) };
    avisos.push(conj.nota);
  }
  let sobrecarga = null;
  if (custo.recurso !== "nenhum" && custo.valor > 0) {
    const rec = custo.recurso;
    // Estamina, Mana e Sanidade temporárias pagam primeiro (a Vida temporária só absorve dano)
    const tempDisp = rec === "pv" ? 0 : (ficha.recursos[rec]?.temp ?? 0);
    const doTemp = Math.min(tempDisp, custo.valor);
    const atual = (ficha.recursos[rec]?.value ?? 0) + doTemp;
    const sigla = CUSTO_RECURSOS[rec]?.sigla ?? rec.toUpperCase();
    if (custo.extra) avisos.push(`+${custo.extra} ${sigla} por ${ficha.especiais.custoExtraMagia.fontes.join(", ")}.`);
    if (atual < custo.valor) {
      if (automatico) return null;
      if (rec === "pm") {
        // Sobrecarga de Núcleo: a Mana que tiver vai primeiro; o resto sai em PV (dobro) ou PS
        sobrecarga = await escolherSobrecarga(actor, ficha, custo.valor, atual, nome);
        if (!sobrecarga) return null;
        if (sobrecarga.via === "mestre") { avisos.push(`${sigla} insuficiente (o Mestre liberou).`); sobrecarga = null; }
      } else {
        if (!(await confirmar("Recurso insuficiente", `<p>Custa <strong>${custo.valor} ${sigla}</strong> e você tem ${atual}.</p><p>Usar mesmo assim? O recurso vai a 0.</p>`))) return null;
        avisos.push(`${sigla} insuficiente.`);
      }
    }
    updates[rec === "pv" ? "system.attributes.hp.value" : `${P}.recursos.${rec}.value`] = Math.max(0, atual - custo.valor);
    if (doTemp) {
      updates[`${P}.recursos.${rec}.temp`] = tempDisp - doTemp;
      avisos.push(`${doTemp} ${sigla} saíram da reserva temporária.`);
    }
    if (rec === "pm" && ficha.especiais.pvPorPm.length) {
      pvPerdidos += Math.min(atual, custo.valor);
      avisos.push(`−${Math.min(atual, custo.valor)} PV por ${ficha.especiais.pvPorPm.join(", ")}.`);
    }
  }
  if (p.tipo === "habilidade" && ficha.especiais.pvPorHabilidade.valor) {
    pvPerdidos += ficha.especiais.pvPorHabilidade.valor;
    avisos.push(`−${ficha.especiais.pvPorHabilidade.valor} PV por ${ficha.especiais.pvPorHabilidade.fontes.join(", ")}.`);
  }
  if (sobrecarga?.via === "pv") {
    pvPerdidos += sobrecarga.falta * 2;
    avisos.push(`Sobrecarga de Núcleo: faltaram ${sobrecarga.falta} PM, pagos com ${sobrecarga.falta * 2} PV.`);
  }
  if (sobrecarga?.via === "ps") {
    Object.assign(updates, calcularPerda(ficha, "ps", sobrecarga.falta).updates);
    avisos.push(`Sobrecarga de Núcleo: faltaram ${sobrecarga.falta} PM, pagos com ${sobrecarga.falta} PS.`);
  }
  if (pvPerdidos) {
    const base = updates["system.attributes.hp.value"] ?? ficha.recursos.pv.value;
    updates["system.attributes.hp.value"] = Math.max(0, base - pvPerdidos);
  }
  if (eSustentada(forma)) {
    updates[`${P}.sustentadas.${item.id}`] = { nome, recurso: forma.porTurno.recurso, valor: forma.porTurno.valor, forma: forma.id };
    avisos.push(`Sustentada: ${forma.porTurno.valor} ${CUSTO_RECURSOS[forma.porTurno.recurso]?.sigla ?? ""} no começo de cada turno até encerrar.`);
  }
  if (Object.keys(updates).length) await actor.update(updates, { epmCusto: true });
  // Interruptor: com bônus de cena ou sustentação o estado vem deles (some sozinho no fim da cena); sem isso, fica marcada
  if (ativar) {
    if (!forma?.bonus?.opcoes?.length && !eSustentada(forma)) await item.update({ [`${P}.ativa`]: true });
    avisos.push("Ativa (desligue no interruptor da habilidade).");
  }
  if (forma) {
    const aviso = await marcarAcao(actor, forma.acao, ficha);
    if (aviso) avisos.push(aviso);
  }
  if (automatico) avisos.unshift(`Ativada sozinha: ${(GATILHOS_BONUS[automatico] ?? GATILHOS_BONUS.dano).replace(/ \(automático\)$/, "").toLowerCase()}.`);
  const fichaCartao = conj ? { ...ficha, cd: { ...ficha.cd, valor: conj.cd } } : ficha;
  const msg = await cartaoPoder(actor, item, p, forma, { avisos, ficha: fichaCartao, rolagem, custo });
  if (forma?.bonus?.opcoes?.length) await escolherBonusSituacional(actor, item, forma, { nome });
  if (sobrecarga) await testeSobrecarga(actor);
  return msg;
}

/** Sobrecarga de Núcleo: escolhe pagar a Mana que falta com o dobro em PV ou o mesmo em PS. */
async function escolherSobrecarga(actor, ficha, custo, tem, nome) {
  const falta = Math.max(0, custo - tem);
  const bloqueio = [...(ficha.bloqueios?.mana ?? []), ...(actor.statuses?.has("epm-nucleo-selado") ? ["Núcleo Selado"] : [])];
  if (bloqueio.length) { ui.notifications.warn(`Faltam ${falta} PM e a Mana está bloqueada (${bloqueio.join(", ")}): não dá para sobrecarregar o Núcleo.`); return null; }
  const pv = ficha.recursos.pv.value;
  const ps = ficha.recursos.ps.value + Math.max(0, ficha.recursos.ps.temp ?? 0);
  const r = await fvtt.DialogV2.wait({
    window: { title: `Sobrecarga de Núcleo: ${nome}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>Custa <strong>${custo} PM</strong> e você tem <strong>${tem}</strong>.</p>
      <p><strong>Sobrecarga de Núcleo</strong>: a Mana que você tem vai primeiro e os <strong>${falta} PM</strong> que faltam saem em <strong>${falta * 2} PV</strong> (você tem ${pv}) ou <strong>${falta} PS</strong> (você tem ${ps}).</p>
      <p class="epm-dica">Depois vem um teste de Núcleo DT 15. Se falhar, fica com Mana Instável.</p>`,
    buttons: [
      { action: "pv", label: `${falta * 2} PV`, icon: "fa-solid fa-heart", default: true },
      { action: "ps", label: `${falta} PS`, icon: "fa-solid fa-brain" },
      ...(game.user.isGM ? [{ action: "mestre", label: "Sem pagar (Mestre)", icon: "fa-solid fa-crown" }] : []),
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!["pv", "ps", "mestre"].includes(r)) return null;
  return { via: r, falta };
}

/** Teste de Núcleo DT 15 depois da Sobrecarga (cartão com botão de rolar): falhou, Mana Instável. */
async function testeSobrecarga(actor) {
  const { pedirTeste } = await import("./automacoes.mjs");
  return pedirTeste(actor, { tipo: "sobrecarga", alvo: "atributo:nucleo", dt: 15, motivo: "Usou Sobrecarga de Núcleo. Se falhar, fica com Mana Instável." });
}

/* -------------------------------------------- */
/*  Bônus situacionais (pela cena)              */
/* -------------------------------------------- */

/**
 * Escolhe (ou rola) uma das opções de bônus da forma e grava como Bônus de cena ligado.
 * Um bônus por habilidade: usar de novo troca o anterior.
 */
export async function escolherBonusSituacional(actor, item, forma, { nome = item.name } = {}) {
  const opcoes = forma.bonus.opcoes;
  const n = opcoes.length;
  let escolhida = null;
  let rolagemTexto = "";
  const rolar = async () => {
    const r = await new Roll(`1d${n}`).evaluate();
    rolagemTexto = `d${n} = ${r.total}`;
    return opcoes[r.total - 1];
  };
  if (forma.bonus.escolha === "todas") {
    await aplicarBonusSituacional(actor, item, opcoes, nome);
    const nivel = nivelHabilidade(item);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="epm-chat epm-chat-nota" style="--cor: #8FB3E0"><p><strong>${escapar(nome)}</strong>${nivel > 1 ? ` (nível ${nivel})` : ""}: ${escapar(opcoes.map(o => o.texto).join("; "))} pela cena.</p><p class="epm-dica">Já está somado na ficha (aba Combate → Bônus de cena). Some no fim do combate.</p></div>`
    });
    return opcoes;
  }
  if (forma.bonus.escolha === "rolar") escolhida = await rolar();
  else {
    const botoes = opcoes.map((o, i) => ({ action: `o${i}`, label: `${i + 1}. ${o.texto}`, callback: () => i }));
    botoes.push({ action: "rolar", label: `Rolar d${n}`, icon: "fa-solid fa-dice", callback: () => "rolar" });
    const r = await fvtt.DialogV2.wait({
      window: { title: `${nome}: bônus pela cena` }, classes: ["epm-dialogo", "epm-dialogo-bonus"], rejectClose: false, modal: true,
      content: `<p class="epm-dica">Escolha o efeito que mais faz sentido para a ameaça, ou role d${n}.</p>`, buttons: botoes
    });
    if (r === "rolar") escolhida = await rolar();
    else if (Number.isInteger(r)) escolhida = opcoes[r];
  }
  if (!escolhida) return null;
  await aplicarBonusSituacional(actor, item, escolhida, nome);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="epm-chat epm-chat-nota" style="--cor: #8FB3E0"><p><strong>${escapar(nome)}</strong>: ${escapar(escolhida.texto)} pela cena${rolagemTexto ? ` <em>(${rolagemTexto})</em>` : ""}.</p><p class="epm-dica">Já está somado na ficha (aba Combate → Bônus de cena). Some no fim do combate.</p></div>`
  });
  return escolhida;
}

export async function aplicarBonusSituacional(actor, item, o, nome = item.name) {
  const atuais = actor.flags?.[FLAG]?.bonusCena ?? {};
  const updates = {};
  for (const [id, b] of Object.entries(atuais)) if (b?.origem === item.id) updates[`${P}.bonusCena.-=${id}`] = null;
  if (Object.keys(updates).length) await actor.update(updates);
  const lista = Array.isArray(o) ? o : [o];
  const nivel = nivelHabilidade(item);
  const texto = lista.map(x => x.texto).join("; ");
  const b = montarBonusCena(lista, nivel, { nome: `${nome}${nivel > 1 ? ` (nv ${nivel})` : ""}: ${texto}`, origem: item.id, criado: Date.now() });
  return actor.update({ [`${P}.bonusCena.${novoId()}`]: b });
}

/** Ao sofrer dano: dispara as formas com gatilho "dano" que ainda não estão valendo nesta cena. */
const gatilhosRodando = new Set();
export async function gatilhosAoSofrerDano(actor) {
  if (gatilhosRodando.has(actor.uuid)) return;
  gatilhosRodando.add(actor.uuid);
  try {
    await dispararGatilhos(actor, "dano");
    const hp = actor.system?.attributes?.hp ?? {};
    const pct = int(hp.max) > 0 ? int(hp.value) / int(hp.max) : 1;
    if (pct <= 0.5) await dispararGatilhos(actor, "vida50");
    if (pct <= 0.25) await dispararGatilhos(actor, "vida25");
  } finally { gatilhosRodando.delete(actor.uuid); }
}

/**
 * Ativação condicional: dispara as formas com o gatilho que ainda não estão valendo nesta cena
 * (cada habilidade entra uma vez por cena; o bônus some no fim do combate).
 */
export async function dispararGatilhos(actor, gatilho = "dano") {
  const ativosPor = new Set(Object.values(actor.flags?.[FLAG]?.bonusCena ?? {}).filter(b => b?.ativo && b.origem).map(b => b.origem));
  // (antes usava poderesDoAtor, que devolve só tipo e raridade: o gatilho nunca disparava)
  for (const item of actor.items.filter(i => i.type === "feat" || i.type === "spell")) {
    if (ativosPor.has(item.id)) continue;
    const forma = lerPoder(item).formas.find(f => f.bonus?.gatilho === gatilho && f.bonus.opcoes.length);
    if (!forma) continue;
    await usarPoder(actor, item, { automatico: gatilho, formaId: forma.id });
  }
}

/** A habilidade está ligada? (interruptor, bônus de cena dela valendo ou sustentada) */
export function habilidadeAtiva(actor, item) {
  const f = actor.flags?.[FLAG] ?? {};
  return !!item?.flags?.[FLAG]?.ativa || !!f.sustentadas?.[item?.id]
    || Object.values(f.bonusCena ?? {}).some(b => b?.ativo && b.origem === item?.id);
}

/**
 * Interruptor da habilidade. Ligar = usar (paga o custo, aplica o bônus) e marcar como ativa;
 * passivas e habilidades sem forma só ligam. Desligar tira o bônus de cena e a sustentação dela.
 */
export async function alternarHabilidade(actor, item) {
  if (!item) return;
  if (habilidadeAtiva(actor, item)) {
    const f = actor.flags?.[FLAG] ?? {};
    const upd = {};
    for (const [id, b] of Object.entries(f.bonusCena ?? {})) if (b?.origem === item.id) upd[`${P}.bonusCena.-=${id}`] = null;
    if (f.sustentadas?.[item.id]) upd[`${P}.sustentadas.-=${item.id}`] = null;
    if (Object.keys(upd).length) await actor.update(upd);
    await item.update({ [`${P}.ativa`]: false });
    ui.notifications.info(`${item.name} desativada.`);
    return false;
  }
  const p = lerPoder(item);
  if (p.passiva || !p.formas.length) {
    await item.update({ [`${P}.ativa`]: true });
    ui.notifications.info(`${item.name} ativada.`);
    return true;
  }
  await usarPoder(actor, item, { ativar: true });
  return habilidadeAtiva(actor, actor.items.get(item.id));
}

/** Remove os bônus "pela cena" (fim do combate ou descanso). */
export function limparBonusDaCena(dados) {
  const up = {};
  for (const [id, b] of Object.entries(dados?.bonusCena ?? {})) if (b?.cena) up[`${P}.bonusCena.-=${id}`] = null;
  return up;
}

async function cartaoPoder(actor, item, p, forma, { avisos, ficha, rolagem, custo = null }) {
  const r = RARIDADES_PODER[p.raridade];
  const linhas = [];
  const botoes = [];
  const requisitos = [];
  if (forma) {
    linhas.push({ rotulo: "Ação", valor: ACOES[forma.acao]?.label ?? forma.acao });
    linhas.push({ rotulo: "Custo", valor: textoCusto(forma, custo?.extra ?? 0) });
    if (eSustentada(forma)) linhas.push({ rotulo: "Por turno", valor: `${forma.porTurno.valor} ${CUSTO_RECURSOS[forma.porTurno.recurso]?.sigla ?? ""} (sustentada)` });
    for (const [campo, rotulo] of [["alcance", "Alcance"], ["area", "Área"], ["alvo", "Alvo"], ["duracao", "Duração"]]) {
      if (forma[campo]) linhas.push({ rotulo, valor: forma[campo] });
    }
    const per = ficha.periciaPorId[forma.teste.pericia];
    if (forma.teste.tipo === "resistencia") {
      linhas.push({ rotulo: "Resistência", valor: `${per?.nome ?? "teste do alvo"} contra DT ${ficha.cd.valor}` });
      // Cada alvo marcado (ou quem clicar) rola a perícia pedida contra a DT; gasta a Reação
      const alvosRes = [...(game.user?.targets ?? [])].map(t => t.actor).filter(a => a && a.uuid !== actor.uuid && a.flags?.[FLAG]);
      const perRes = forma.teste.pericia || "vontade";
      if (alvosRes.length) {
        for (const a of alvosRes) botoes.push({ acao: "resistir", pericia: perRes, dt: ficha.cd.valor, defensor: a.uuid, rotulo: `Resistência: ${item.name}`,
          label: `${a.name} resiste (${per?.nome ?? perRes}, DT ${ficha.cd.valor})`, icone: "fa-solid fa-shield-heart" });
      } else {
        botoes.push({ acao: "resistir", pericia: perRes, dt: ficha.cd.valor, rotulo: `Resistência: ${item.name}`,
          label: `Resistir (${per?.nome ?? perRes}, DT ${ficha.cd.valor})`, icone: "fa-solid fa-shield-heart" });
      }
    } else if ((forma.teste.tipo === "ataque" || forma.teste.tipo === "pericia") && per) {
      const ataque = forma.teste.tipo === "ataque";
      const bonus = ataque ? per.total + ficha.ataquesGerais.penal : per.testeTotal;
      botoes.push({
        acao: "teste", pericia: per.id, tipo: forma.teste.tipo, magico: ataque && p.tipo === "magia",
        rotulo: `${ataque ? "Ataque" : `Teste de ${per.nome}`}: ${item.name}`,
        label: `${ataque ? "Atacar" : per.nome} (${sinalCurto(bonus)})`, icone: "fa-solid fa-dice-d20"
      });
    }
    if (forma.dano.formula) {
      const cura = /cura/i.test(forma.dano.tipo);
      const potente = p.tipo === "magia" && ficha.extras?.magiaPotente ? ficha.extras.magiaPotente : 0;
      const formulaDano = potente ? `${forma.dano.formula} + ${potente}` : forma.dano.formula;
      botoes.push({
        acao: "formula", formula: formulaDano,
        rotulo: `${cura ? "Cura" : "Dano"}: ${item.name}${forma.dano.tipo && !cura ? ` (${forma.dano.tipo})` : ""}`,
        label: `${cura ? "Cura" : "Dano"} ${formulaDano}${potente ? " (Magia Potente)" : ""}`, icone: cura ? "fa-solid fa-heart" : "fa-solid fa-burst"
      });
    }
    for (const [k, ligado] of Object.entries(forma.requisitos)) if (ligado) requisitos.push(REQUISITOS[k]?.label ?? k);
    // Conjurador: Manipulação Mágica (Nv. 5) e Sobrecarga Mágica (Nv. 37) direto do cartão da magia
    const nivelConj = p.tipo === "magia" ? nivelArquetipo(actor.flags?.[FLAG] ?? {}, "conjurador") : 0;
    const cfgC = ARQUETIPOS.conjurador;
    if (nivelConj >= cfgC.manipulacao.nivel) {
      botoes.push({ acao: "manipulacao", rotulo: "Manipulação Mágica", label: `Manipulação (${cfgC.manipulacao.custo} PE)`, icone: "fa-solid fa-wand-magic-sparkles" });
    }
    if (nivelConj >= cfgC.sobrecarga.nivel && forma.dano.formula) {
      const dado = String(forma.dano.formula).match(/\d*d\d+/i)?.[0] ?? "1d6";
      botoes.push({ acao: "sobrecarga", formula: dado.replace(/^\d*/, "1"), rotulo: "Sobrecarga Mágica", label: "Sobrecarga (12+ PE)", icone: "fa-solid fa-bolt" });
    }
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
    // Conjurador: magia nova já vem com o custo do círculo (Truque 0, 1º 6, 2º 10 … PM)
    if (tipo === "magia" && nivelArquetipo(actor.flags?.[FLAG] ?? {}, "conjurador")) {
      const pm = custoMagiaCirculo(int(extra));
      if (pm) forma.custo = { recurso: "pm", valor: pm };
    }
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

export async function dialogoNovoPoder(actor, tipo, circulo = 0, { origem = "" } = {}) {
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
    : `<option value="">Sem origem</option>${Object.entries(ORIGENS_HABILIDADE).map(([id, l]) => `<option value="${id}" ${id === origem ? "selected" : ""}>${l}</option>`).join("")}`;
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

/**
 * Novo turno: restaura as ações (descontando as defesas), conta a duração das bênçãos,
 * aplica o dano contínuo das condições e rola a tabela de Insano.
 */
export async function novoTurno(actor) {
  const { ficha, dados } = estadoAtor(actor);
  const divida = Math.min(ficha.acoes.defesas, 3);
  const usadas = { padrao: false, bonus: false, movimento: false };
  ["movimento", "bonus", "padrao"].slice(0, divida).forEach(a => { usadas[a] = true; });
  const updates = {
    [`${P}.acoes.padrao`]: usadas.padrao, [`${P}.acoes.bonus`]: usadas.bonus, [`${P}.acoes.movimento`]: usadas.movimento,
    [`${P}.acoes.reacao`]: false, [`${P}.acoes.defesas`]: 0,
    [`${P}.usos.ataqueExtraTurno`]: false, [`${P}.usos.gemeaTurno`]: false,
    [`${P}.usos.manobraTurno`]: false, [`${P}.acoes.convertida`]: "", [`${P}.acoes.extra`]: false
  };
  const transf = turnoTransformacao(dados);
  Object.assign(updates, transf.updates);
  // Recuperado: vale durante este turno e acaba no próximo
  const recup = recuperadoNoNovoTurno(dados);
  Object.assign(updates, recup.updates);
  const notasSust = [];
  {
    const sust = Object.entries(dados.sustentadas ?? {}).filter(([, s]) => s && int(s.valor) > 0 && CUSTO_RECURSOS[s.recurso] && s.recurso !== "nenhum");
    const porRec = {};
    for (const [sid, s] of sust) {
      const ja = porRec[s.recurso] ?? 0;
      const c = custoRecurso(ficha, s.recurso, ja + int(s.valor));
      if (c.ok) { porRec[s.recurso] = ja + int(s.valor); notasSust.push(`${s.nome}: −${int(s.valor)} ${CUSTO_RECURSOS[s.recurso].sigla}`); }
      else { updates[`${P}.sustentadas.-=${sid}`] = null; notasSust.push(`${s.nome} terminou: faltou ${CUSTO_RECURSOS[s.recurso].sigla}`); }
    }
    // Transformação com custo por turno: paga de novo; sem o recurso, acaba
    const tid = dados.transformacao?.ativa;
    const tr = tid ? dados.transformacoes?.[tid] : null;
    const recT = tr?.custoPorTurno && CUSTO_RECURSOS[tr.custo?.recurso] && tr.custo.recurso !== "nenhum" ? tr.custo.recurso : null;
    if (recT && int(tr.custo.valor) > 0 && !transf.terminou) {
      const ja = porRec[recT] ?? 0;
      if (custoRecurso(ficha, recT, ja + int(tr.custo.valor)).ok) { porRec[recT] = ja + int(tr.custo.valor); notasSust.push(`${tr.nome}: −${int(tr.custo.valor)} ${CUSTO_RECURSOS[recT].sigla}`); }
      else { transf.terminou = true; notasSust.push(`${tr.nome} terminou: faltou ${CUSTO_RECURSOS[recT].sigla}`); }
    }
    for (const [rec, total] of Object.entries(porRec)) Object.assign(updates, custoRecurso(ficha, rec, total).updates);
  }
  const lendaria = dados.acoes?.lendaria;
  if (int(lendaria?.max) > 0) updates[`${P}.acoes.lendaria.value`] = int(lendaria.max);
  // Bênçãos: duração e usos "por turno"
  const terminadas = [];
  for (const [id, b] of Object.entries(dados.bencaos ?? {})) {
    if (!b || typeof b !== "object") continue;
    const auto = automacaoDe(b);
    if (auto.frequencia === "turno" && b.usado) updates[`${P}.bencaos.${id}.usado`] = false;
    const restantes = int(b.turnosRestantes);
    if (restantes > 0) {
      updates[`${P}.bencaos.${id}.turnosRestantes`] = restantes - 1;
      if (restantes - 1 <= 0) { updates[`${P}.bencaos.${id}.ativo`] = false; terminadas.push(id); }
    }
  }
  await actor.update(updates);
  if (recup.encerrar) await encerrarRecuperado(actor);
  await fimDesprevenidoDaFalha(actor);
  if (divida) ui.notifications.info(`Novo turno: ${divida} ação(ões) já gasta(s) com defesas.`);
  for (const id of terminadas) await terminarBencao(actor, id, { porDuracao: true });
  if (transf.terminou) await destransformar(actor, { porDuracao: true });
  if (notasSust.length) await ChatMessage.create({ speaker: falar(actor), content: `<div class="epm-chat epm-chat-nota"><p><strong>Sustentadas</strong>: ${notasSust.map(escapar).join("; ")}.</p></div>` });
  // Armaduras que drenam Estamina por turno (Genesis, Notion)
  const drenoArmadura = actor.items.filter(i => i.type === "equipment" && i.system?.equipped)
    .map(i => ({ nome: i.name, pe: int(i.flags?.[FLAG]?.estaminaPorTurno) })).filter(x => x.pe > 0);
  if (drenoArmadura.length) {
    const totalPe = drenoArmadura.reduce((t, x) => t + x.pe, 0);
    const perda = calcularPerda(estadoAtor(actor).ficha, "pe", totalPe);
    await actor.update(perda.updates);
    await ChatMessage.create({ speaker: falar(actor), content: `<div class="epm-chat epm-chat-nota"><p><strong>Armadura</strong>: −${totalPe} PE (${escapar(drenoArmadura.map(x => x.nome).join(", "))}).</p></div>` });
  }
  await efeitosDeInicioDeTurno(actor);
}

export async function rolarIniciativa(actor, evento) {
  const { ficha } = estadoAtor(actor);
  const combatente = game.combat?.combatants.find(c => c.actor?.uuid === actor.uuid);
  if (ficha.iniciativa.zero.length) {
    if (combatente) {
      try { await combatente.update({ initiative: 0 }); } catch (err) { console.warn("EPM |", err); }
    }
    return ChatMessage.create({
      speaker: falar(actor),
      content: `<div class="epm-chat epm-chat-nota"><p><strong>Iniciativa 0</strong>: ${escapar(ficha.iniciativa.zero.join(", "))}. Age depois das outras criaturas.</p></div>`
    });
  }
  const roll = await rolarTeste(actor, {
    rotulo: `Iniciativa (${ficha.iniciativa.fonte})`, bonus: ficha.iniciativa.testeTotal, evento,
    desvantagens: ficha.desvantagens.iniciativa, penalidades: ficha.iniciativa.testeFontes
  });
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
        if (ficha.iniciativa.zero.length) return new Roll("0");
        const desvantagem = ficha.desvantagens.iniciativa.length > 0;
        return new Roll(`${formulaD20({ desvantagem })} ${comSinal(ficha.iniciativa.testeTotal)}`, dadosRolagem(actor, ficha));
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
  const { ficha, dados } = estadoAtor(actor);
  const rec = ficha.recursos;
  if (!longo && ficha.recuperacao.semDescansoCurto.length) {
    return ui.notifications.warn(`Sem descanso curto: ${ficha.recuperacao.semDescansoCurto.join(", ")}.`);
  }
  const metadeCurto = !longo ? ficha.recuperacao.descansoCurtoMetade : [];
  const linha = (nome, r, marcado) => {
    const bloqueio = r.semRecuperar.length ? ` <em class="epm-dica">(não recupera: ${escapar(r.semRecuperar.join(", "))})</em>` : "";
    const metade = r.recuperaMetade.length || metadeCurto.length ? ` <em class="epm-dica">(recupera metade: ${escapar([...r.recuperaMetade, ...metadeCurto].join(", "))})</em>` : "";
    return `<label class="epm-check"><input type="checkbox" name="${nome}" ${marcado && !r.semRecuperar.length ? "checked" : ""} ${r.semRecuperar.length ? "disabled" : ""}> Recuperar ${r.label} (${r.value} de ${r.max})${bloqueio}${metade}</label>`;
  };
  const n = ficha.exaustao.nivel;
  const avisosExtras = [];
  if (ficha.especiais.pvMaxPorDescanso.valor) avisosExtras.push(`${ficha.especiais.pvMaxPorDescanso.valor} PV máximos (${ficha.especiais.pvMaxPorDescanso.fontes.join(", ")})`);
  if (longo && ficha.especiais.psPorDescansoLongo.valor) avisosExtras.push(`−${ficha.especiais.psPorDescansoLongo.valor} PS (${ficha.especiais.psPorDescansoLongo.fontes.join(", ")})`);
  if (ficha.especiais.pmPorPv.length) avisosExtras.push(`Recuperar PV tira o mesmo em PM (${ficha.especiais.pmPorPv.join(", ")})`);
  const content = `
    <p class="epm-dica">Marque o que acontece neste ${longo ? "descanso longo" : "descanso curto"}.</p>
    ${linha("pv", rec.pv, longo)}
    ${linha("pm", rec.pm, longo)}
    ${linha("pe", rec.pe, longo)}
    ${linha("ps", rec.ps, false)}
    ${longo && n > 0 ? `<label class="epm-check"><input type="checkbox" name="exaustao" checked> Reduzir a Exaustão de ${n} para ${n - 1}</label>` : ""}
    ${longo && regra("descanso") ? htmlAtividades(actor, REGRAS.ptPorTreino) : `<label class="epm-check"><input type="checkbox" name="treino"> Treinou durante o descanso (+${REGRAS.ptPorTreino} PT)</label>`}
    ${avisosExtras.length ? `<p class="epm-dica">Também acontece: ${escapar(avisosExtras.join("; "))}.</p>` : ""}`;
  const escolha = await fvtt.DialogV2.wait({
    window: { title: longo ? "Descanso longo" : "Descanso curto" }, classes: ["epm-dialogo"], rejectClose: false, modal: true, content,
    buttons: [
      {
        action: "ok", label: "Descansar", icon: longo ? "fa-solid fa-bed" : "fa-solid fa-mug-hot", default: true,
        callback: (ev, b) => ({ ...Object.fromEntries(["pv", "pm", "pe", "ps", "exaustao", "treino"].map(k => [k, !!b.form.elements[k]?.checked])), atividade: longo && regra("descanso") ? lerAtividade(b.form) : null })
      },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!escolha || typeof escolha !== "object") return;
  const updates = { ...limparBonusDaCena(actor.flags?.[FLAG]) };
  const feitos = [];
  let ganhoPv = 0;
  for (const id of ["pv", "pm", "pe", "ps"]) {
    if (!escolha[id]) continue;
    let falta = Math.max(0, rec[id].max - rec[id].value);
    if (metadeCurto.length) falta = Math.floor(falta / 2);
    const r = calcularRecuperacao(ficha, id, falta, { trocaPm: false });
    Object.assign(updates, r.updates);
    if (id === "pv") ganhoPv = r.ganho;
    if (r.texto) feitos.push(r.texto);
  }
  if (ganhoPv && ficha.especiais.pmPorPv.length) {
    const pmAtual = updates[`${P}.recursos.pm.value`] ?? rec.pm.value;
    updates[`${P}.recursos.pm.value`] = Math.max(0, pmAtual - ganhoPv);
    feitos.push(`−${ganhoPv} PM (${ficha.especiais.pmPorPv.join(", ")})`);
  }
  if (escolha.exaustao && n > 0) { updates[`${P}.exaustao`] = n - 1; feitos.push(`Exaustão ${n} → ${n - 1}`); }
  if (escolha.treino) { updates[`${P}.pontos.pt`] = ficha.pontos.pt + REGRAS.ptPorTreino; feitos.push(`+${REGRAS.ptPorTreino} PT de treino`); }
  if (longo) {
    // Novas mecânicas: a reza anterior acaba, as âncoras recarregam e a atividade do descanso acontece
    Object.assign(updates, fimDaReza(dados), recarregarAncoras(dados));
    if (escolha.atividade?.atividade) {
      const psTempBase = updates[`${P}.recursos.ps.temp`] ?? Math.max(0, num(dados.recursos?.ps?.temp));
      const at = await fazerAtividade(actor, escolha.atividade, { ptTreino: REGRAS.ptPorTreino, pontosPt: ficha.pontos.pt, psTempBase });
      Object.assign(updates, at.updates);
      feitos.push(...at.textos);
    }
  }
  if (longo) updates[`${P}.treinoDia.horas`] = 0;
  if (longo) Object.assign(updates, { [`${P}.acoes.padrao`]: false, [`${P}.acoes.bonus`]: false, [`${P}.acoes.movimento`]: false, [`${P}.acoes.reacao`]: false, [`${P}.acoes.defesas`]: 0 });
  // Bênçãos de uso diário recarregam; maldições de descanso (Decomposição, Alma Devorada)
  for (const [bid, b] of Object.entries(dados.bencaos ?? {})) {
    if (!b || typeof b !== "object") continue;
    const auto = automacaoDe(b);
    if (longo && auto.frequencia === "dia" && b.usado) updates[`${P}.bencaos.${bid}.usado`] = false;
    const sit = ficha.bencaos.find(x => x.id === bid);
    if (!sit?.vale) continue;
    const decomp = num(auto.efeitos.pvMaxPorDescanso);
    if (decomp) {
      const atual = Object.entries(b.permanentes ?? {}).find(([, m]) => m?.alvo === "recurso.pv");
      if (atual) updates[`${P}.bencaos.${bid}.permanentes.${atual[0]}.valor`] = num(atual[1].valor) + decomp;
      else updates[`${P}.bencaos.${bid}.permanentes.${novoId()}`] = { alvo: "recurso.pv", valor: decomp };
      feitos.push(`${decomp} PV máximos (${b.nome})`);
    }
  }
  if (longo && ficha.especiais.psPorDescansoLongo.valor) {
    const base = updates[`${P}.recursos.ps.value`] ?? rec.ps.value;
    updates[`${P}.recursos.ps.value`] = Math.max(0, base - ficha.especiais.psPorDescansoLongo.valor);
    feitos.push(`−${ficha.especiais.psPorDescansoLongo.valor} PS (${ficha.especiais.psPorDescansoLongo.fontes.join(", ")})`);
  }
  if (int(dados.classeEpm?.furiaUsos)) updates[`${P}.classeEpm.furiaUsos`] = 0;
  // 0.6.0: Meditação de Núcleo (descanso curto +1d6 PM) e insanidades temporárias que acabam no descanso longo
  if (!longo && ficha.extras?.meditacaoNucleo) {
    const rol = new Roll(String(numBonus("treino.meditacaoNucleo")));
    await rol.evaluate();
    const base = updates[`${P}.recursos.pm.value`] ?? ficha.recursos.pm.value;
    updates[`${P}.recursos.pm.value`] = Math.min(ficha.recursos.pm.max, base + rol.total);
    feitos.push(`Meditação de Núcleo: +${rol.total} PM`);
  }
  if (longo) {
    for (const [iid, ins] of Object.entries(dados.insanidades ?? {})) {
      if (ins && !ins.encerrada && ins.tipo === "temporaria" && (ins.intensidade ?? (ins.intensa ? "intensa" : "temporaria")) === "temporaria") {
        updates[`${P}.insanidades.${iid}.encerrada`] = true;
        feitos.push(`Insanidade encerrada: ${ins.nome}`);
      }
    }
  }
  if (dados.usos?.recuperarMana) updates[`${P}.usos.recuperarMana`] = false;
  const recargas = longo ? ["curto", "longo", "dia"] : ["curto"];
  const recarregados = await recarregarCargas(actor, recargas);
  if (recarregados.length) feitos.push(`cargas recarregadas: ${recarregados.join(", ")}`);
  if (Object.keys(updates).length) await actor.update(updates);
  if (escolha.exaustao && n > 0) await sincronizarStatusExaustao(actor, n - 1);
  if (longo && actor.statuses?.has("epm-lesionado")) {
    try { await actor.toggleStatusEffect("epm-lesionado", { active: false }); feitos.push("Lesionado saiu"); } catch (err) { console.warn("EPM |", err); }
  }
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
  import("./mundo.mjs").then(m => m.avisarDiscord("nivel", `⬆️ **${actor.name}** subiu para o nível ${novo} de ${nome}.`)).catch(() => null);
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
  const { dados, ficha } = estadoAtor(actor);
  if (operacao === "consolidar") {
    const total = valorEmCobre(dados.moedas);
    if (!(await confirmar("Consolidar moedas", `<p>Trocar suas moedas pelo menor número de moedas de maior valor?</p><p><strong>${formatarMoedas(total)}</strong></p>`))) return;
    return actor.update({ [`${P}.moedas`]: consolidarMoedas(dados.moedas) });
  }
  const receber = operacao === "receber";
  const opcoes = MOEDAS.map(m => `<option value="${m.id}" ${m.id === "po" ? "selected" : ""}>${m.label}</option>`).join("");
  const metade = receber && ficha.especiais.metadeDinheiro.length;
  const r = await fvtt.DialogV2.wait({
    window: { title: receber ? "Receber moedas" : "Pagar" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<div class="epm-dialogo-linha">
        <label class="epm-campo"><span>Quantidade</span><input type="number" name="qtd" min="1" step="1" value="1" autofocus></label>
        <label class="epm-campo"><span>Moeda</span><select name="moeda">${opcoes}</select></label>
      </div>
      ${receber ? "" : `<p class="epm-dica">O troco é calculado sozinho. Você tem ${formatarMoedas(valorEmCobre(dados.moedas))}.</p>`}
      ${metade ? `<p class="epm-dica">Metade do que receber some (${escapar(ficha.especiais.metadeDinheiro.join(", "))}).</p>` : ""}`,
    buttons: [
      { action: "ok", label: receber ? "Receber" : "Pagar", icon: receber ? "fa-solid fa-plus" : "fa-solid fa-minus", default: true, callback: (ev, b) => ({ qtd: b.form.elements.qtd.value, moeda: b.form.elements.moeda.value }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object") return;
  const moeda = moedaPorId(r.moeda);
  let qtd = Math.max(0, Math.floor(num(r.qtd)));
  if (!moeda || !qtd) return;
  if (receber) {
    if (metade) {
      const perdido = Math.ceil(qtd / 2);
      qtd -= perdido;
      ui.notifications.info(`${perdido} ${moeda.label} sumiram (${ficha.especiais.metadeDinheiro.join(", ")}).`);
    }
    return actor.update({ [`${P}.moedas.${moeda.id}`]: int(dados.moedas[moeda.id]) + qtd });
  }
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

/** Depois de um ataque de habilidade ou magia: cartão com as defesas de cada alvo EPM marcado (sem dano conhecido). */
export async function cartaoDefesas(atacante, acerto, rotulo) {
  const alvos = [...(game.user?.targets ?? [])].map(t => t.actor).filter(a => a && a.uuid !== atacante?.uuid && a.flags?.[FLAG]);
  if (!alvos.length) return null;
  const content = await fvtt.renderTemplate(`${CAMINHO}/chat/ataque.hbs`, {
    actorUuid: atacante.uuid, img: "", nome: `Defesa: ${rotulo}`, periciaNome: `acerto ${acerto}`, modo: "",
    htmlAtaque: `<div class="dice-roll"><div class="dice-result"><h4 class="dice-total">${acerto}</h4></div></div>`, htmlDano: "",
    critico: false, mult: 2, tipoDano: "", notas: ["O dano da habilidade é rolado à parte: o resultado da defesa diz quanto dele o alvo recebe."], botoes: [],
    cor: "#93A9A3", defensores: alvos.map(a => ({ uuid: a.uuid, nome: a.name })), acertoTotal: acerto, danoValor: 0
  });
  return ChatMessage.create({ speaker: falar(atacante), content, flags: { [FLAG]: { tipo: "ataque" } } });
}

let chatLigado = false;
/**
 * Botão "Aplicar dano" do cartão de ataque: aplica só o total do dano (nunca o do acerto)
 * nos alvos marcados no momento do ataque ou, se não havia, nos alvos marcados agora.
 * O atacante nunca recebe o dano por estar selecionado.
 */
export async function aplicarDanoDoCartao(atacante, botao) {
  const valor = Math.max(0, int(botao.dataset.valor));
  let alvos = (botao.dataset.alvos ?? "").split(",").filter(Boolean).map(u => fromUuidSync(u)).filter(Boolean);
  if (!alvos.length) alvos = [...(game.user?.targets ?? [])].map(t => t.actor).filter(Boolean);
  alvos = alvos.filter(a => a.uuid !== atacante?.uuid);
  if (!alvos.length) return ui.notifications.warn("Marque o alvo (tecla T ou clique com o botão direito no token → alvo) e clique de novo.");
  const semPermissao = alvos.filter(a => !a.isOwner);
  if (semPermissao.length) return ui.notifications.warn(`Só o Mestre aplica dano em ${semPermissao.map(a => a.name).join(", ")}. Ele pode clicar neste mesmo botão no chat.`);
  const tipoDano = botao.dataset.tipoDano ?? "";
  const partes = [];
  for (const alvo of alvos) {
    const hp = alvo.system?.attributes?.hp;
    if (!hp) continue;
    // Fichas EPM: imunidade, RD e resistência entram sozinhas
    const calc = alvo.flags?.[FLAG] ? danoRecebido(estadoAtor(alvo).ficha, valor, tipoDano) : { final: valor, passos: [] };
    let resto = calc.final;
    const temp = int(hp.temp);
    const usaTemp = Math.min(temp, resto);
    resto -= usaTemp;
    await alvo.update({ "system.attributes.hp.temp": temp - usaTemp, "system.attributes.hp.value": Math.max(0, int(hp.value) - resto) });
    partes.push(`${alvo.name} ${calc.final}${calc.passos.length ? ` (${calc.passos.join("; ")})` : ""}`);
    await somarCorrupcao(alvo, calc.final, tipoDano);
    // Durabilidade: sofrer um acerto crítico tira 10 da armadura equipada
    if (botao.dataset.critico) {
      const arm = armaduraEquipada(alvo);
      const t = arm ? await gastarDurabilidade(arm, PERDA_CRITICO, "acerto crítico") : "";
      if (t) partes.push(t);
    }
  }
  ui.notifications.info(`Dano de ${valor}${tipoDano ? ` ${tipoDano}` : ""}: ${partes.join(", ")}.`);
  // Maestria (regra opcional): o dano aplicado pelo cartão conta como acerto
  if (botao.dataset.tipoArma && atacante) {
    const msg = game.messages.get(botao.closest("[data-message-id]")?.dataset.messageId);
    const { contarAcertoMaestria } = await import("./opcionais-acoes.mjs");
    await contarAcertoMaestria(atacante, botao.dataset.tipoArma, msg);
  }
}

/**
 * Corrupção acumulada (0.6.0): cada 10 de dano de Corrupção sofrido soma 1 ponto (0 a 100).
 * Avisa no chat quando passa de um marco (25 Mana Instável, 50 maldição caótica, 75 mutação, 100 perdido).
 */
export async function somarCorrupcao(alvo, dano, tipoDano) {
  if (!alvo?.flags?.[FLAG] || !alvo.isOwner) return;
  if (![...(lerTipoDano(tipoDano ?? "").tipos ?? [])].includes("corrupcao")) return;
  const pontos = Math.floor(Math.max(0, int(dano)) / 10);
  if (!pontos) return;
  const max = Math.max(1, Math.min(1000, int(alvo.flags[FLAG].corrupcaoMax) || 100));
  const antes = int(alvo.flags[FLAG].corrupcao);
  const depois = Math.min(max, antes + pontos);
  await alvo.update({ [`${P}.corrupcao`]: depois });
  const { MARCOS_CORRUPCAO } = await import("./regras-extras.mjs");
  const marcos = MARCOS_CORRUPCAO.map(m => ({ ...m, limite: Math.max(1, Math.round((m.valor / 100) * max)) })).filter(m => antes < m.limite && depois >= m.limite);
  await ChatMessage.create({ speaker: falar(alvo), content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#6B3FA0"><p><strong>Corrupção</strong>: ${antes} → ${depois} de ${max}.</p>${marcos.map(m => `<p><strong>${m.limite}: ${escapar(m.label)}</strong>. ${escapar(m.texto)}</p>`).join("")}</div>` });
}

/** Tira do menu do chat as opções de dano do D&D 5e nos cartões EPM (elas somavam acerto + dano e usavam o token selecionado). */
export function filtrarMenuChat(_app, opcoes) {
  if (!Array.isArray(opcoes)) return;
  const eEPM = li => {
    const el = li?.[0] ?? li;
    const id = el?.dataset?.messageId ?? el?.closest?.("[data-message-id]")?.dataset?.messageId;
    return !!game.messages?.get(id)?.flags?.[FLAG];
  };
  for (const o of opcoes) {
    if (!/ChatContext(Damage|Healing|TempHP|DoubleDamage|HalfDamage)/i.test(o?.name ?? "")) continue;
    const original = o.condition;
    o.condition = li => !eEPM(li) && (typeof original === "function" ? original(li) : original ?? true);
  }
}

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
    const { epmAction: acao, formula, rotulo, pericia, tipo, recurso, magico } = botao.dataset;
    if (await cliqueChatExtra(acao, actor, botao)) return;
    if (acao === "formula") return rolarFormula(actor, formula, rotulo || "Rolagem");
    if (acao === "teste") {
      if (!actor) return ui.notifications.warn("Não encontrei o personagem deste cartão.");
      const { ficha } = estadoAtor(actor);
      const per = ficha.periciaPorId[pericia];
      if (tipo === "ataque") {
        const desvantagens = [...ficha.desvantagens.ataques, ...(magico ? ficha.desvantagens.ataquesMagicos : [])];
        const roll = await rolarTeste(actor, { rotulo: rotulo || "Ataque", bonus: (per?.total ?? 0) + ficha.ataquesGerais.penal, evento: ev, desvantagens, vantagens: ficha.vantagens.ataques, penalidades: ficha.ataquesGerais.fontes });
        if (roll) await cartaoDefesas(actor, roll.total, rotulo || "Ataque");
        return roll;
      }
      return rolarTeste(actor, { rotulo: rotulo || "Teste", bonus: per?.testeTotal ?? 0, evento: ev, desvantagens: [...ficha.desvantagens.testes, ...(per?.desvantagem ?? [])], vantagens: [...ficha.vantagens.testes, ...(per?.vantagem ?? [])], penalidades: per?.testeFontes ?? [] });
    }
    if (acao === "dano") return aplicarDanoDoCartao(actor, botao);
    if (acao === "cura") {
      if (!actor) return ui.notifications.warn("Não encontrei o personagem deste cartão.");
      if (!actor.isOwner) return ui.notifications.warn("Só o dono do personagem aplica a cura.");
      const roll = await rolarFormula(actor, formula, rotulo || "Cura");
      if (!roll) return;
      const { ficha } = estadoAtor(actor);
      const r = calcularRecuperacao(ficha, recurso || "pv", roll.total, { fonte: formula });
      if (Object.keys(r.updates).length) await actor.update(r.updates);
      if (r.texto) ui.notifications.info(`${actor.name}: ${r.texto}`);
    }
  });
}

export { TIPOS_TESTE };

/* -------------------------------------------- */
/*  Ataques com crítico e bônus                 */
/* -------------------------------------------- */

export function fonteAtaque(actor, tipo, ref) {
  if (tipo === "arma") {
    const [itemId, modo = ""] = String(ref).split(":");
    const item = actor.items.get(itemId);
    return item ? ataqueDeArma(item, modo) : null;
  }
  const dados = actor.flags?.[FLAG]?.ataques?.[ref];
  return dados ? ataqueCustom(ref, dados) : null;
}

/** Diálogo antes do ataque: modo, bônus externos, crítico, ataques adicionais, Maestria, Estilo, Presa, munição e cargas. */
export async function dialogoAtaque(actor, tipo, ref, { oportunidade = false, contra = false } = {}) {
  let at = fonteAtaque(actor, tipo, ref);
  if (!at) return null;
  const { ficha, dados } = estadoAtor(actor);
  if (ficha.ataquesGerais.bloqueados.length) {
    const texto = `Não pode atacar: ${ficha.ataquesGerais.bloqueados.join(", ")}.`;
    if (!game.user.isGM) return ui.notifications.warn(texto);
    if (!(await confirmar("Ataque bloqueado", `<p>${escapar(texto)}</p><p>Atacar mesmo assim?</p>`))) return null;
  }
  if (oportunidade && dados.acoes?.reacao) return ui.notifications.warn("A Reação já foi usada neste turno.");
  const cena = bonusCenaAtivos(dados);
  const per = ficha.periciaPorId[at.periciaId];
  const m = modsDoAtaque(at, ficha);
  const acerto = (per?.total ?? 0) + at.bonusAcerto + cena.acerto + m.acerto;
  // Níveis de tecnologia (item 23): arma acima do nível do personagem dá desvantagem; 2 acima, −5 e, se complexa, Tecnologia DT 20
  const itemTec = tipo === "arma" ? actor.items.get(String(ref).split(":")[0]) : null;
  const tec = itemTec ? penalidadeTec(itemTec, ficha.extras?.tecnologia ?? 1) : null;
  if (tec?.complexo && !(await liberarComplexo(actor, itemTec, ficha))) return null;
  const desv = tec ? [...ficha.desvantagens.ataques, tec.fonte] : ficha.desvantagens.ataques;
  const vant = ficha.vantagens.ataques;
  const padrao = desv.length && !vant.length ? "desvantagem" : vant.length && !desv.length ? "vantagem" : "normal";
  const radio = (valor, rotulo) => `<label class="epm-check"><input type="radio" name="modo" value="${valor}" ${valor === padrao ? "checked" : ""}> ${rotulo}</label>`;
  const notas = [];
  if (m.acertoFontes.length) notas.push(`Acerto: ${m.acertoFontes.map(f => `${sinalCurto(f.valor)} ${f.fonte}`).join(", ")}`);
  if (m.dano) notas.push(`Dano: ${sinalCurto(m.dano)}`);
  if (m.danoExtra.length) notas.push(`Dano extra: ${m.danoExtra.join(" + ")}`);
  if (m.danoMult > 1) notas.push(`Dano ×${m.danoMult} (${ficha.ataquesGerais.danoMult.fontes.join(", ")})`);
  if (ficha.desvantagens.dano.length) notas.push(`Dano com desvantagem (${ficha.desvantagens.dano.join(", ")})`);
  if (ficha.extras?.titulos?.ativo?.contraTipo) notas.push(`Título ${ficha.extras.titulos.ativo.nome}: +2 no acerto contra ${ficha.extras.titulos.ativo.contraTipo} (some no bônus externo)`);
  if (tec) notas.push(tec.texto);
  if (itemTec && quebrado(itemTec)) notas.push("Arma quebrada: sem os bônus e efeitos dela até ser consertada");

  // Arquétipos, munição e cargas
  const item = tipo === "arma" ? actor.items.get(String(ref).split(":")[0]) : null;
  const fi = item?.flags?.[FLAG] ?? {};
  const comb = nivelArquetipo(dados, "combatente");
  const opc = dados.arquetipoOpcoes?.combatente ?? {};
  const favorita = !!item && eTipoFavorito(item, dados);
  const ef = favorita ? efeitoMaestria(opc.maestria, comb) : null;
  const ae = degrau(ARQUETIPOS.combatente.ataqueExtra, comb);
  const estilos = estilosEscolhidos(dados, comb);
  const armasEquipadas = actor.items.filter(i => i.type === "weapon" && i.system?.equipped).length;
  const presa = comb >= ARQUETIPOS.combatente.cacador.nivel ? (dados.usos?.presa ?? "") : "";
  const penalExtra = Math.abs(int(ajustes().penalidadeAtaqueExtra ?? 5));
  const peDisp = ficha.recursos.pe.value + Math.max(0, ficha.recursos.pe.temp ?? 0);
  const md = municaoDaArma(fi);
  const municao = md.itemId ? actor.items.get(md.itemId) : null;
  const porAtaque = md.porAtaque;
  const cargas = int(fi.cargas?.max) > 0 ? { valor: int(fi.cargas.valor), max: int(fi.cargas.max) } : null;
  let margemPadrao = at.critMargem;
  let multPadrao = at.critMult;
  if (ef?.id === "perigosa") {
    margemPadrao = Math.max(2, at.critMargem - (ef.margem ?? 0));
    multPadrao = Math.max(at.critMult, ef.mult || 0);
    notas.push(`Arma Perigosa: crítico ${margemPadrao < 20 ? `${margemPadrao}–20` : "20"}/×${multPadrao}`);
  }
  // Crítico Brutal (Bárbaro do Notion): margem mínima e +multiplicador até o máximo da tabela
  const brutal = ficha.extras?.classe?.critico;
  if (brutal) {
    margemPadrao = Math.min(margemPadrao, brutal.margem);
    multPadrao = Math.min(multPadrao + brutal.mult, Math.max(multPadrao, brutal.max));
    notas.push(`Crítico Brutal: crítico ${margemPadrao < 20 ? `${margemPadrao}–20` : "20"}/×${multPadrao}`);
  }
  // Núcleo Vermelho (Guerreiro Elemental): + Margem de Ameaça
  const nucVerm = ficha.extras?.classe?.elemental?.margem;
  if (nucVerm) {
    margemPadrao = Math.max(2, margemPadrao - nucVerm);
    notas.push(`Núcleo Vermelho: margem de ameaça +${nucVerm} (crítico ${margemPadrao}–20)`);
  }
  // Bônus de cena com margem de ameaça (ex.: Instinto Assassino)
  if (cena.margem) {
    margemPadrao = Math.max(2, margemPadrao - cena.margem);
    notas.push(`Bônus de cena: margem de ameaça −${cena.margem} (crítico ${margemPadrao}–20)`);
  }
  const acoesLivres = ["bonus", "movimento"].filter(a => !dados.acoes?.[a] && !ficha.bloqueios.acoes?.[a]?.length);
  const chk = (nome, rotulo, { desabilitado = false, dica = "" } = {}) =>
    `<label class="epm-check"${dica ? ` title="${escapar(dica)}"` : ""}><input type="checkbox" name="${nome}" ${desabilitado ? "disabled" : ""}> ${rotulo}</label>`;
  const extras = [];
  if (!oportunidade && !contra) {
    extras.push(`<label class="epm-check epm-check-linha"><input type="checkbox" name="extraComum" ${acoesLivres.length ? "" : "disabled"}> Ataque extra: gasta a
      <select name="extraAcao" ${acoesLivres.length ? "" : "disabled"}>${acoesLivres.map(a => `<option value="${a}">${a === "bonus" ? "Ação Bônus" : "Ação de Movimento"}</option>`).join("") || "<option>sem ação livre</option>"}</select>
      (−${penalExtra} no acerto)</label>`);
    if (ae) {
      const usado = !!dados.usos?.ataqueExtraTurno;
      extras.push(chk("extraComb", `Ataque Extra (Combatente): ${ae.custo} PE → +${ae.ataques} ataque${ae.ataques > 1 ? "s" : ""}${usado ? " <em>(já usado neste turno)</em>" : ""}`,
        { desabilitado: usado || peDisp < ae.custo, dica: "Uma vez por turno" }));
    }
    if (ef?.id === "gemea") {
      const usado = !!dados.usos?.gemeaTurno;
      extras.push(chk("gemea", `Gêmea: ${ef.custo} PE → +${ef.ataques} ataque${ef.ataques > 1 ? "s" : ""} com a arma gêmea${usado ? " <em>(já usado)</em>" : ""}`, { desabilitado: usado || peDisp < ef.custo }));
    }
  }
  const opcoesArq = [];
  if (ef?.id === "certeiro") opcoesArq.push(chk("certeiro", `Ataque Certeiro: ${ef.custo} PE → +${ef.acerto} de Acerto`, { desabilitado: peDisp < ef.custo }));
  if (ef?.id === "longa") opcoesArq.push(chk("longa", `Arma Longa: ${ef.custo} PE → +${String(ef.alcance).replace(".", ",")} m de alcance`, { desabilitado: peDisp < ef.custo }));
  if (ef?.id === "leve" && ef.danoDex) notas.push("Arma Leve: +3 de dano se a arma já usa Destreza (some no bônus externo)");
  if (estilos.includes("duelista")) opcoesArq.push(chk("duelista", `Duelista: alvo é um único inimigo isolado (+${ARQUETIPOS.combatente.estilos.duelista.acertoIsolado})`));
  if (estilos.includes("atirador")) opcoesArq.push(chk("atirador", `Atirador: abrir mão do modificador de dano para reduzir a margem de crítico em ${ARQUETIPOS.combatente.estilos.atirador.margem}`));
  if (estilos.includes("dupla") && armasEquipadas >= 2) notas.push(`Arma Dupla: +${ARQUETIPOS.combatente.estilos.dupla.acerto} de Acerto (duas armas equipadas)`);
  if (presa) opcoesArq.push(chk("presa", `Contra a Presa (${escapar(presa)}): +${ARQUETIPOS.combatente.cacador.acerto} de Acerto e +1 dado de dano`));
  // Manobra do Combatente (Notion): 1 vez por turno, ao atacar
  const manobraUsada = !!dados.usos?.manobraTurno;
  if (comb > 0 && !oportunidade) {
    opcoesArq.push(`<label class="epm-campo"${manobraUsada ? ' title="Já usada neste turno"' : ""}><span>Manobra (1 por turno)${manobraUsada ? " <em>(já usada)</em>" : ""}</span>
      <select name="manobra" ${manobraUsada ? "disabled" : ""}><option value="">Nenhuma</option>${MANOBRAS.map(x => `<option value="${x.id}">${escapar(x.label)}</option>`).join("")}</select></label>`);
  }
  const avisosRecurso = [];
  const pacoteAberto = md.tipo === "pacote" && !!dados.usos?.pacotes?.[item?.id];
  if (md.usa && md.tipo === "pacote") avisosRecurso.push(pacoteAberto ? "Pacote de munição aberto neste combate: não gasta" : "Pacote: este ataque abre 1 pacote, que dura o combate");
  const penteInfo = md.pente ? `Pente: ${md.pente.atual} de ${md.pente.max} (${porAtaque} por ataque)` : "";
  if (penteInfo) avisosRecurso.push(penteInfo);
  if (md.usa && !md.pente && !md.itemId) avisosRecurso.push("Esta arma gasta munição, mas nenhuma foi escolhida no editor da arma.");
  if (md.usa && md.itemId && !penteInfo) avisosRecurso.push(municao ? `Munição: ${escapar(municao.name)} ×${num(municao.system?.quantity, 0)} (${porAtaque} por ataque)` : "A munição ligada a esta arma não foi encontrada.");
  if (cargas) avisosRecurso.push(`Cargas: ${cargas.valor} de ${cargas.max} (1 por ataque)`);
  const content = `
    ${oportunidade ? `<p class="epm-aviso">Ataque de oportunidade: gasta a Reação. Só 1 golpe simples, sem ataque extra nem ação bônus.</p>` : ""}
    ${contra ? `<p class="epm-aviso">Contra-ataque: a ação já foi paga pela defesa. Um ataque contra quem errou.</p>` : ""}
    <p class="epm-dica">${escapar(per?.nome ?? "Sem perícia")} ${sinalCurto(acerto)} no acerto${at.dano ? `, dano ${escapar(at.dano)}` : ""}${cena.nomes.length ? `. Bônus de cena: ${escapar(cena.nomes.join(", "))}` : ""}.</p>
    ${notas.length ? `<p class="epm-dica">${escapar(notas.join(". "))}.</p>` : ""}
    ${avisosRecurso.length ? `<p class="epm-dica epm-dialogo-recursos"><i class="fa-solid fa-box-archive" aria-hidden="true"></i> ${avisosRecurso.join(". ")}.</p>` : ""}
    <fieldset class="epm-aquisicao"><legend>Rolagem</legend>
      <div class="epm-dialogo-linha epm-dialogo-tres">${radio("normal", "Normal")}${radio("vantagem", "Vantagem")}${radio("desvantagem", "Desvantagem")}</div>
      ${desv.length ? `<p class="epm-dica">Pedem desvantagem: ${escapar(desv.join(", "))}.</p>` : ""}
      ${vant.length ? `<p class="epm-dica">Dão vantagem: ${escapar(vant.join(", "))}.</p>` : ""}
      ${inspiracaoDe(actor) >= 1 ? `<label class="epm-check"><input type="checkbox" name="inspiracao" ${dados.inspiracaoVantagem ? "checked" : ""}> Gastar 1 Inspiração: vantagem (tem ${inspiracaoDe(actor)})</label>` : ""}
    </fieldset>
    ${extras.length ? `<fieldset class="epm-aquisicao"><legend>Ataques adicionais</legend>${extras.join("")}</fieldset>` : ""}
    ${!oportunidade && !contra ? htmlDupla(actor) : ""}
    ${opcoesArq.length ? `<fieldset class="epm-aquisicao"><legend>${ef ? `Maestria e estilo` : "Estilo e Presa"}</legend>${opcoesArq.join("")}</fieldset>` : ""}
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Bônus externo no acerto</span><input type="text" name="extraAcerto" placeholder="2 ou 1d4"></label>
      <label class="epm-campo"><span>Bônus externo no dano</span><input type="text" name="extraDano" placeholder="3 ou 1d6"></label>
    </div>
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Margem de crítico (d20 ≥)</span><input type="number" name="margem" min="2" max="20" value="${margemPadrao}"></label>
      <label class="epm-campo"><span>Multiplicador de crítico</span><input type="number" name="mult" min="2" value="${multPadrao}"></label>
    </div>
    <label class="epm-check"><input type="checkbox" name="comDano" ${at.dano || cena.dano.length ? "checked" : ""}> Rolar o dano junto</label>`;
  const marcado = (f, nome) => !!f[nome]?.checked && !f[nome]?.disabled;
  const escolha = await fvtt.DialogV2.wait({
    window: { title: `${oportunidade ? "Ataque de oportunidade" : contra ? "Contra-ataque" : "Atacar"}: ${at.nome}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true, content,
    buttons: [
      {
        action: "rolar", label: "Rolar", icon: "fa-solid fa-dice-d20", default: true,
        callback: (ev, b) => {
          const f = b.form.elements;
          return {
            modo: f.modo.value, extraAcerto: f.extraAcerto.value.trim(), extraDano: f.extraDano.value.trim(), margem: f.margem.value, mult: f.mult.value, comDano: f.comDano.checked,
            extraComum: marcado(f, "extraComum"), extraAcao: f.extraAcao?.value ?? "", extraComb: marcado(f, "extraComb"), gemea: marcado(f, "gemea"),
            manobra: f.manobra && !f.manobra.disabled ? f.manobra.value : "", certeiro: marcado(f, "certeiro"), longa: marcado(f, "longa"), duelista: marcado(f, "duelista"), atirador: marcado(f, "atirador"), presa: marcado(f, "presa"),
            dupla: marcado(f, "dupla") ? (f.duplaParceiro?.value ?? "") : "", inspiracao: marcado(f, "inspiracao")
          };
        }
      },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!escolha || typeof escolha !== "object") return null;

  // Ataque em dupla: confirmação do parceiro antes de gastar qualquer coisa (um ataque só)
  let dupla = null;
  if (escolha.dupla) {
    dupla = await prepararDupla(actor, at, escolha.dupla);
    if (!dupla) return null;
    escolha.extraComum = false; escolha.extraComb = false; escolha.gemea = false;
  }
  // Inspiração: gasta 1 e rola com vantagem
  let inspirado = false;
  if (escolha.inspiracao) {
    inspirado = await gastarInspiracao(actor);
    if (inspirado) {
      escolha.modo = escolha.modo === "desvantagem" ? "normal" : "vantagem";
      if (dados.inspiracaoVantagem) await actor.update({ [`${P}.inspiracaoVantagem`]: false });
    }
  }

  // Quantos ataques e o que cada escolha custa
  const extrasComuns = escolha.extraComum ? 1 : 0;
  const extrasComb = escolha.extraComb && ae ? ae.ataques : 0;
  const extrasGemea = escolha.gemea && ef?.id === "gemea" ? ef.ataques : 0;
  const total = 1 + extrasComuns + extrasComb + extrasGemea;
  const updates = {};
  const gastos = [];
  let pe = 0;
  if (oportunidade) { updates[`${P}.acoes.reacao`] = true; gastos.push("Reação"); }
  if (dupla) { updates[`${P}.acoes.padrao`] = true; gastos.push("Ação Padrão (dupla)"); }
  if (extrasComuns) {
    if (!acoesLivres.includes(escolha.extraAcao)) return ui.notifications.warn("A ação escolhida para o ataque extra já foi usada.");
    updates[`${P}.acoes.${escolha.extraAcao}`] = true;
    gastos.push(escolha.extraAcao === "bonus" ? "Ação Bônus" : "Ação de Movimento");
  }
  if (extrasComb) { pe += ae.custo; updates[`${P}.usos.ataqueExtraTurno`] = true; }
  if (extrasGemea) { pe += ef.custo; updates[`${P}.usos.gemeaTurno`] = true; }
  if (escolha.certeiro && ef?.id === "certeiro") pe += ef.custo;
  if (escolha.longa && ef?.id === "longa") pe += ef.custo;
  if (pe) {
    const c = custoRecurso(ficha, "pe", pe);
    if (!c.ok) return ui.notifications.warn(`Faltam ${c.falta} PE para essas opções (${pe} PE).`);
    Object.assign(updates, c.updates);
    gastos.push(`${pe} PE`);
  }
  const mudancasItens = [];
  const pente = md.pente;
  if (pente) {
    // Arma de fogo: os tiros saem do pente; recarregar puxa da munição ligada
    const precisa = total * porAtaque;
    if (pente.atual < precisa) return ui.notifications.warn(`${item.name}: pente com ${pente.atual} de ${pente.max} (precisa de ${precisa}). Recarregue.`);
    mudancasItens.push({ _id: item.id, [`flags.${FLAG}.pente.atual`]: pente.atual - precisa });
    gastos.push(`${precisa} tiro${precisa > 1 ? "s" : ""} (pente ${pente.atual - precisa}/${pente.max})`);
  } else if (md.usa && md.tipo === "pacote") {
    if (!pacoteAberto) {
      if (!md.itemId) return ui.notifications.warn(`${item.name} gasta munição: escolha qual no editor da arma.`);
      const tem = municao ? num(municao.system?.quantity, 0) : 0;
      if (tem < 1) return ui.notifications.warn(`Sem pacotes de munição${municao ? ` (${municao.name})` : ""}.`);
      mudancasItens.push({ _id: municao.id, "system.quantity": tem - 1 });
      updates[`${P}.usos.pacotes.${item.id}`] = true;
      gastos.push(`1 pacote de ${municao.name} (dura o combate)`);
    }
  } else if (md.usa) {
    const precisa = total * porAtaque;
    if (!md.itemId) return ui.notifications.warn(`${item.name} gasta munição: escolha qual no editor da arma.`);
    const tem = municao ? num(municao.system?.quantity, 0) : 0;
    if (tem < precisa) return ui.notifications.warn(`Munição insuficiente: precisa de ${precisa}${municao ? ` ${municao.name}` : ""} e tem ${tem}.`);
    mudancasItens.push({ _id: municao.id, "system.quantity": tem - precisa });
    gastos.push(`${precisa} ${municao.name}`);
  }
  if (cargas) {
    if (cargas.valor < total) return ui.notifications.warn(`${item.name}: cargas insuficientes (${cargas.valor} de ${total}).`);
    mudancasItens.push({ _id: item.id, [`flags.${FLAG}.cargas.valor`]: cargas.valor - total });
    gastos.push(`${total} carga${total > 1 ? "s" : ""}`);
  }
  const manobra = MANOBRAS.find(x => x.id === escolha.manobra);
  if (manobra) updates[`${P}.usos.manobraTurno`] = true;
  if (Object.keys(updates).length) await actor.update(updates);
  if (mudancasItens.length) await actor.updateEmbeddedDocuments("Item", mudancasItens);

  // Bônus que valem para todos os ataques desta rodada
  const bonusFontes = [];
  if (escolha.certeiro && ef?.id === "certeiro") bonusFontes.push({ valor: ef.acerto, fonte: "Ataque Certeiro" });
  if (escolha.duelista) bonusFontes.push({ valor: ARQUETIPOS.combatente.estilos.duelista.acertoIsolado, fonte: "Duelista" });
  if (estilos.includes("dupla") && armasEquipadas >= 2) bonusFontes.push({ valor: ARQUETIPOS.combatente.estilos.dupla.acerto, fonte: "Arma Dupla" });
  if (escolha.presa) bonusFontes.push({ valor: ARQUETIPOS.combatente.cacador.acerto, fonte: `Presa (${presa})` });
  if (tec?.penal) bonusFontes.push({ valor: tec.penal, fonte: tec.fonte });
  const base = {
    ...escolha, bonusFontes, dadosExtra: escolha.presa ? 1 : 0, semModDano: !!escolha.atirador, margemBonus: escolha.atirador ? ARQUETIPOS.combatente.estilos.atirador.margem : 0,
    maestria: favorita && ef && ["destrutivo", "alongado"].includes(ef.id) ? ef : null,
    notasExtra: [
      ...(gastos.length ? [`Gastou: ${gastos.join(", ")}.`] : []),
      ...(escolha.longa && ef?.id === "longa" ? [`Arma Longa: +${String(ef.alcance).replace(".", ",")} m de alcance.`] : []),
      ...(oportunidade ? ["Ataque de oportunidade (Reação)."] : []),
      ...(manobra ? [`Manobra: ${manobra.label}. ${manobra.texto}`] : []),
      ...(contra ? ["Contra-ataque (pago com a defesa)."] : [])
    ]
  };
  // Estilos que mexem no dano: Arma Leve (rola de novo 1 e 2), Armamento Longo (+1d6 / desarmado +1d4), Arma Pesada (nota)
  const props = (item ? [...listaPropriedadesItem(fi), ...[...(item.system?.properties ?? [])]] : []).map(p => normalizarTexto(p));
  const ePesada = props.some(p => ["pesada", "enorme", "hvy"].includes(p));
  const eLeve = props.some(p => ["leve", "lgt", "light"].includes(p));
  const aDistancia = at.periciaId === "pontaria" || /pontaria/.test(String(at.pericia ?? ""));
  const E = ARQUETIPOS.combatente.estilos;
  if (estilos.includes("leve") && eLeve && at.dano) at = { ...at, dano: String(at.dano).replace(/(\d*)d(\d+)(?![\dr])/g, "$1d$2ro<=2") };
  const extrasEstilo = [];
  if (estilos.includes("longo") && aDistancia && ePesada) extrasEstilo.push(E.longo.dano);
  const temLongaPesada = actor.items.some(i => i.type === "weapon" && i.system?.equipped && [...listaPropriedadesItem(i.flags?.[FLAG] ?? {}), ...[...(i.system?.properties ?? [])]].map(normalizarTexto).some(p => ["pesada", "enorme", "hvy"].includes(p)) && (i.flags?.[FLAG]?.periciaAtaque === "pontaria"));
  if (estilos.includes("longo") && ataqueDesarmado(at) && temLongaPesada) extrasEstilo.push(E.longo.desarmado);
  if (extrasEstilo.length) base.extraDano = [base.extraDano, ...extrasEstilo].filter(Boolean).join(" + ");
  if (estilos.includes("pesada") && ePesada) base.notasExtra.push("Combate com Arma Pesada: se este ataque for crítico, pode fazer +1 ataque (uma vez por turno).");
  if (estilos.includes("leve") && eLeve) base.notasExtra.push("Combate com Arma Leve: dados de dano com 1 ou 2 já foram rolados de novo.");
  if (extrasEstilo.length) base.notasExtra.push(`Armamento Longo: +${extrasEstilo.join(" + ")} de dano.`);
  // Maestria de arma (regra opcional): +1 de acerto com 50 acertos, +1 nível de dano com 500
  const tipoArma = item ? String(item.flags?.[FLAG]?.tipoArma ?? "").trim() : "";
  if (tipoArma && regra("maestria")) {
    const bm = bonusMaestria(dados, tipoArma);
    if (bm.acerto) base.bonusFontes.push({ valor: bm.acerto, fonte: `Domínio de arma (${tipoArma})` });
    if (bm.nivelDano) { at = { ...at, tipoDano: subirNivelDano(at.tipoDano) }; base.notasExtra.push(`Domínio de arma (${tipoArma}, ${bm.acertos} acertos): +1 nível de dano.`); }
  }
  base.tipoArma = tipoArma;
  if (dupla) {
    at = { ...at, dano: [at.dano, dupla.danoParceiro].filter(Boolean).join(" + "), tipoDano: subirNivelDano(at.tipoDano || dupla.tipoDanoParceiro || "") };
    base.bonusFontes.push(...dupla.bonusFontes);
    base.notasExtra.push(...dupla.notas);
    base.comDano = base.comDano || !!at.dano;
  }
  if (inspirado) base.notasExtra.push("Inspiração de Tema: vantagem (−1 Inspiração).");
  const msg = await rolarAtaque(actor, at, { ...base, rotulo: dupla ? `Em dupla com ${dupla.parceiro.name}` : oportunidade ? "Oportunidade" : contra ? "Contra-ataque" : "" });
  const extrasRolar = [
    ...Array.from({ length: extrasComuns }, () => ({ rotulo: "Ataque extra", penalidade: -penalExtra })),
    ...Array.from({ length: extrasComb }, (_, i) => ({ rotulo: `Ataque Extra ${i + 1}/${extrasComb}` })),
    ...Array.from({ length: extrasGemea }, (_, i) => ({ rotulo: `Gêmea ${i + 1}/${extrasGemea}` }))
  ];
  for (const x of extrasRolar) await rolarAtaque(actor, at, { ...base, ...x, notasExtra: [] });
  return msg;
}

/** Encerra uma habilidade ou magia sustentada (para de gastar por turno). */
export async function encerrarSustentada(actor, id) {
  const s = actor.flags?.[FLAG]?.sustentadas?.[id];
  if (!s) return;
  await actor.update({ [`${P}.sustentadas.-=${id}`]: null });
  return ChatMessage.create({ speaker: falar(actor), content: `<div class="epm-chat epm-chat-nota"><p><strong>${escapar(actor.name)}</strong> encerra ${escapar(s.nome)}.</p></div>` });
}

/** Recarrega o pente de uma arma de fogo com a munição ligada (ou enche, se a arma não tiver munição ligada). */
export async function recarregarArma(actor, item) {
  const fi = item?.flags?.[FLAG] ?? {};
  const md = municaoDaArma(fi);
  if (!md.pente) return ui.notifications.warn(`${item?.name ?? "A arma"} não usa pente.`);
  const max = md.pente.max;
  const atual = md.pente.atual;
  const falta = max - atual;
  if (falta <= 0) return ui.notifications.info(`${item.name}: pente já está cheio (${max}).`);
  const mun = md.itemId ? actor.items.get(md.itemId) : null;
  let entra = falta;
  if (md.itemId) {
    const tem = mun ? num(mun.system?.quantity, 0) : 0;
    if (tem <= 0) return ui.notifications.warn(`Sem munição para recarregar ${item.name}.`);
    entra = Math.min(falta, tem);
    await mun.update({ "system.quantity": tem - entra });
  }
  await item.update({ [`flags.${FLAG}.pente.atual`]: atual + entra });
  // Recarregar gasta a ação escolhida no editor da arma (depende da arma)
  const acao = ACOES[fi.recargaAcao] ? fi.recargaAcao : "padrao";
  const aviso = await marcarAcao(actor, acao, estadoAtor(actor).ficha);
  return ChatMessage.create({ speaker: falar(actor), content: `<div class="epm-chat epm-chat-nota"><p><strong>${escapar(actor.name)}</strong> recarrega ${escapar(item.name)} (${ACOES[acao].label}): pente ${atual + entra}/${max}${mun ? ` (sobram ${num(mun.system?.quantity, 0)} ${escapar(mun.name)})` : ""}.</p>${aviso ? `<p class="epm-chat-aviso">${escapar(aviso)}</p>` : ""}</div>` });
}

/** Remove o modificador de atributo da fórmula de dano (Estilo Atirador). */
export function semModificadorDeDano(formula) {
  return String(formula ?? "").replace(/\s*[+-]\s*@atr\.[a-z]+/gi, "").trim();
}

/** Soma N dados do mesmo tipo do primeiro dado da fórmula ("2d10 + 4" com 1 → "2d10 + 4 + 1d10"). */
export function somarDadosDaArma(formula, n) {
  const lados = String(formula ?? "").match(/\d*d(\d+)/i)?.[1];
  return n > 0 && lados ? `${formula} + ${n}d${lados}` : formula;
}

/**
 * Rola acerto e dano num só cartão. No crítico, os dados do ataque são multiplicados (2d10 ×3 = 6d10).
 * Entram também as penalidades das condições, o dano extra de bênçãos e itens, a desvantagem no dano
 * (Exaustão 1), o multiplicador de dano (Ruína Carmesim) e, vindo do diálogo, ataques extras, Maestria,
 * Estilo e Presa.
 */
export async function rolarAtaque(actor, at, {
  modo = "normal", extraAcerto = "", extraDano = "", margem, mult, comDano = true,
  bonusFontes = [], penalidade = 0, dadosExtra = 0, semModDano = false, margemBonus = 0, rotulo = "", maestria = null, notasExtra = [], tipoArma = ""
} = {}) {
  const { ficha, dados } = estadoAtor(actor);
  const cena = bonusCenaAtivos(dados);
  const per = ficha.periciaPorId[at.periciaId];
  const m = modsDoAtaque(at, ficha);
  const rd = dadosRolagem(actor, ficha);
  const d20 = formulaD20({ vantagem: modo === "vantagem", desvantagem: modo === "desvantagem" });
  const bonusArq = bonusFontes.reduce((s, b) => s + int(b.valor), 0);
  const partesAcerto = [d20, per?.total ?? 0, at.bonusAcerto, cena.acerto, m.acerto, bonusArq, int(penalidade)].map(String).filter(x => x !== "0");
  if (extraAcerto) partesAcerto.push(extraAcerto);
  let atk;
  try {
    atk = new Roll(Roll.replaceFormulaData(partesAcerto.join(" + ").replace(/\+ -/g, "- "), rd, { missing: "0" }));
    await atk.evaluate();
  } catch (err) {
    console.warn("EPM |", err);
    return ui.notifications.error("Não consegui rolar o acerto. Confira o bônus externo.");
  }
  // Sem o diálogo (margem não veio), a margem dos bônus de cena entra aqui
  const margemCena = margem === undefined || margem === null || margem === "" ? cena.margem : 0;
  const margemFinal = limitar(int(margem, at.critMargem) - int(margemBonus) - margemCena, 2, 20);
  const multFinal = Math.max(2, int(mult, at.critMult));
  const natural = atk.dice[0]?.total ?? 0;
  const critico = natural >= margemFinal;
  // Ativação condicional "ao acertar um crítico" (depois do cartão do ataque)
  if (critico) setTimeout(() => dispararGatilhos(actor, "critico").catch(err => console.warn("EPM | gatilho de crítico", err)), 50);
  const falhaCrit = (atk.dice[0]?.results ?? []).filter(r => r.active !== false).some(r => r.result === 1) && natural === 1;
  let dmg = null;
  let dmgDescartado = null;
  const notas = [];
  if (comDano) {
    let danoArmaFormula = semModDano ? semModificadorDeDano(at.dano) : at.dano;
    danoArmaFormula = somarDadosDaArma(danoArmaFormula, int(dadosExtra));
    const base = danoArmaFormula ? (critico ? multiplicarDados(danoArmaFormula, multFinal) : danoArmaFormula) : "";
    const partesDano = [base, ...cena.dano, ...m.danoExtra, extraDano].filter(Boolean);
    if (m.dano) partesDano.push(String(m.dano));
    if (partesDano.length) {
      let formula = partesDano.join(" + ").replace(/\+ -/g, "- ");
      if (m.danoMult > 1) formula = `(${formula}) * ${m.danoMult}`;
      try {
        dmg = new Roll(Roll.replaceFormulaData(formula, rd, { missing: "0" }));
        await dmg.evaluate();
        if (ficha.desvantagens.dano.length) {
          const outro = new Roll(Roll.replaceFormulaData(formula, rd, { missing: "0" }));
          await outro.evaluate();
          if (outro.total < dmg.total) { dmgDescartado = dmg; dmg = outro; } else dmgDescartado = outro;
          notas.push(`Dano com desvantagem (${ficha.desvantagens.dano.join(", ")}): rolou ${dmgDescartado.total} e ${dmg.total}, ficou o menor.`);
        }
        if (dmg.total < 0) notas.push("O dano ficou abaixo de 0: conta como 0.");
      } catch (err) {
        console.warn("EPM |", err);
        ui.notifications.error("Não consegui rolar o dano. Confira as fórmulas.");
        dmg = null;
      }
    }
  }
  if (m.acertoFontes.length) notas.push(`Acerto: ${m.acertoFontes.map(f => `${sinalCurto(f.valor)} ${f.fonte}`).join(", ")}.`);
  if (bonusFontes.length) notas.push(`Acerto: ${bonusFontes.map(f => `${sinalCurto(int(f.valor))} ${f.fonte}`).join(", ")}.`);
  if (penalidade) notas.push(`Ataque extra: ${sinalCurto(int(penalidade))} no acerto.`);
  if (dadosExtra) notas.push(`+${dadosExtra} dado de dano (Presa).`);
  if (semModDano) notas.push(`Atirador: sem o modificador de dano, margem de crítico −${ARQUETIPOS.combatente.estilos.atirador.margem}.`);
  if (m.dano) notas.push(`Dano ${sinalCurto(m.dano)}: ${m.danoFontes.map(f => f.fonte).join(", ")}.`);
  if (m.danoMult > 1) notas.push(`Dano ×${m.danoMult}: ${ficha.ataquesGerais.danoMult.fontes.join(", ")}.`);
  if (cena.nomes.length) notas.push(`Bônus de cena: ${cena.nomes.join(", ")}.`);
  if (extraAcerto) notas.push(`Bônus externo no acerto: ${extraAcerto}.`);
  if (extraDano) notas.push(`Bônus externo no dano: ${extraDano}.`);
  if (margemFinal !== at.critMargem || multFinal !== at.critMult) notas.push(`Crítico ajustado para ${margemFinal < 20 ? `${margemFinal}–20` : "20"}/×${multFinal}.`);
  notas.push(...notasExtra);
  const botoes = (at.curas ?? []).map(c => ({
    acao: "cura", formula: c.formula, recurso: c.recurso, rotulo: `${at.nome}: cura ao acertar`,
    label: `Acertou: +${c.formula} ${RECURSOS[c.recurso]?.abrev ?? "PV"}`, icone: "fa-solid fa-heart"
  }));
  // Dano vai só para os alvos marcados (nunca para o atacante por estar selecionado)
  const alvos = [...(game.user?.targets ?? [])].map(t => t.actor).filter(a => a && a.uuid !== actor.uuid);
  if (dmg) {
    const valor = Math.max(0, Math.round(dmg.total));
    botoes.unshift({
      acao: "dano", valor, alvos: alvos.map(a => a.uuid).join(","), tipoDano: at.tipoDano ?? "", critico: critico ? "1" : "", tipoArma: tipoArma || "",
      rotulo: `${at.nome}: dano`, icone: "fa-solid fa-burst",
      label: alvos.length ? `Aplicar ${valor} de dano em ${alvos.map(a => a.name).join(", ")}` : `Aplicar ${valor} de dano no alvo`
    });
  }
  // Manobra Derrubar: botão para deixar o alvo Caído
  if (notasExtra.some(t => String(t).startsWith("Manobra: Derrubar"))) {
    botoes.push({ acao: "condicaoAlvo", condicao: "epm-caido", rotulo: "Manobra", label: "Acertou? Alvo fica Caído", icone: "fa-solid fa-person-falling" });
  }
  // Árvore elemental (Guerreiro Elemental): golpe com 20+ de dano de um elemento aplica o efeito (Fortitude DT 20)
  if (dmg && /elemental/i.test(String(dados.classe ?? ""))) {
    const valorEl = Math.max(0, Math.round(dmg.total));
    const tipoEl = [...(lerTipoDano(at.tipoDano ?? "").tipos ?? [])][0] ?? normalizarTexto(at.tipoDano ?? "").replace(/\s+/g, "");
    const efeito = EFEITO_ELEMENTO[tipoEl] ?? (/gravidade/i.test(at.tipoDano ?? "") ? EFEITO_ELEMENTO.gravidade : null);
    if (efeito && valorEl >= DANO_EFEITO_ELEMENTO) {
      if (efeito === "drenar") notas.push(`Necrótico ${valorEl}: recupera ${Math.floor(valorEl / 2)} de Vida (metade do dano).`);
      else {
        const cond = CONDICOES.find(c => c.id === efeito);
        notas.push(`Golpe elemental (${valorEl} de dano): o alvo faz Fortitude DT ${DT_EFEITO_ELEMENTO}; se falhar, fica ${cond?.label ?? efeito}.`);
        botoes.push({ acao: "condicaoAlvo", condicao: efeito, rotulo: "Efeito elemental", label: `Falhou na Fortitude: ${cond?.label ?? efeito}`, icone: "fa-solid fa-fire" });
      }
    }
  }
  if (critico && actor.isOwner) actor.update({ [`${P}.conquistas.criticos`]: int(dados.conquistas?.criticos) + 1 }).catch(() => null);
  // Durabilidade: falha crítica tira 10 da arma usada
  if (falhaCrit && at.tipo === "arma") {
    const itemArma = actor.items.get(at.id);
    const t = itemArma ? await gastarDurabilidade(itemArma, PERDA_CRITICO, "falha crítica") : "";
    if (t) notas.push(t);
  }
  // Maestria de arma (regra opcional): botão "Acertou" conta o acerto para o tipo da arma
  if (tipoArma && regra("maestria")) {
    botoes.push({ acao: "maestriaAcerto", tipoArma, rotulo: "Domínio", label: `Acertou (Domínio: ${tipoArma})`, icone: "fa-solid fa-medal" });
  }
  // Maestria do Combatente depois de saber se acertou: Ataque Destrutivo (acertou) ou Acerto Alongado (errou)
  if (maestria?.id === "destrutivo") {
    botoes.push({ acao: "destrutivo", alvos: alvos.map(a => a.uuid).join(","), tipoDano: at.tipoDano ?? "", custo: maestria.custo, rotulo: maestria.nome,
      label: `Acertou? Destrutivo: ${maestria.custo} PE, +${maestria.dano}`, icone: "fa-solid fa-hammer" });
  }
  if (maestria?.id === "alongado") {
    botoes.push({ acao: "alongado", alvos: alvos.map(a => a.uuid).join(","), tipoDano: at.tipoDano ?? "", custo: maestria.custo, rotulo: maestria.nome,
      label: `Errou? Alongado: ${maestria.custo} PE, ${maestria.dano} de dano`, icone: "fa-solid fa-arrows-left-right" });
  }
  const rotulos = { normal: "", vantagem: "com vantagem", desvantagem: "com desvantagem" };
  // Cada alvo com ficha EPM escolhe a defesa (Esquiva, Bloqueio ou Contra-ataque) direto no cartão
  const defensores = alvos.filter(a => a.flags?.[FLAG]).map(a => ({ uuid: a.uuid, nome: a.name }));
  const content = await fvtt.renderTemplate(`${CAMINHO}/chat/ataque.hbs`, {
    actorUuid: actor.uuid, img: at.img, nome: rotulo ? `${at.nome} · ${rotulo}` : at.nome, periciaNome: per?.nome ?? "sem perícia",
    modo: rotulos[modo] ?? "", htmlAtaque: await atk.render(), htmlDano: dmg ? await dmg.render() : "",
    critico, mult: multFinal, tipoDano: at.tipoDano, notas, botoes, cor: critico ? "#E8C547" : "#D3A85E",
    defensores, acertoTotal: atk.total, danoValor: dmg ? Math.max(0, Math.round(dmg.total)) : 0, tipoArma: regra("maestria") ? tipoArma : ""
  });
  const mensagem = { speaker: falar(actor), content, rolls: [atk, dmg, dmgDescartado].filter(Boolean), sound: CONFIG.sounds?.dice, flags: { [FLAG]: { tipo: "ataque", tipoArma: tipoArma || "", atacante: actor.uuid } } };
  try { ChatMessage.applyRollMode(mensagem, game.settings.get("core", "rollMode")); } catch { /* modo padrão */ }
  const criada = await ChatMessage.create(mensagem);
  if (falhaCrit) await falhaCritica(actor, at);
  return criada;
}

export async function definirVidaTemp(actor) {
  const atual = num(actor.system?.attributes?.hp?.temp);
  const valor = await perguntarTexto("Vida temporária", "Vida temporária (0 remove)", atual ? String(atual) : "", "Aplicar");
  if (valor === null) return;
  await actor.update({ "system.attributes.hp.temp": Math.max(0, Math.floor(num(valor))) });
}

/** Teste de atributo com as penalidades das condições. */
export async function rolarAtributo(actor, id, evento) {
  const { ficha } = estadoAtor(actor);
  const a = ficha.atributos[id];
  if (!a) return null;
  return rolarTeste(actor, {
    rotulo: `Teste de ${a.label}`, bonus: a.testeTotal, evento,
    desvantagens: ficha.desvantagens.testes, vantagens: ficha.vantagens.testes,
    nota: notaResistencia(ficha), penalidades: a.testeFontes
  });
}

/** Teste de perícia com penalidades, vantagem/desvantagem por perícia e bloqueios. */
export async function rolarPericia(actor, id, evento) {
  const { ficha } = estadoAtor(actor);
  const p = ficha.periciaPorId[id];
  if (!p) return null;
  if (p.bloqueada.length) {
    if (!game.user.isGM) return ui.notifications.warn(`${p.nome} está bloqueada por: ${p.bloqueada.join(", ")}.`);
    if (!(await confirmar("Perícia bloqueada", `<p><strong>${escapar(p.nome)}</strong> está bloqueada por ${escapar(p.bloqueada.join(", "))}.</p><p>Rolar mesmo assim?</p>`))) return null;
  }
  return rolarTeste(actor, {
    rotulo: `Teste de ${p.nome}`, bonus: p.testeTotal, evento,
    desvantagens: [...ficha.desvantagens.testes, ...p.desvantagem], vantagens: [...ficha.vantagens.testes, ...p.vantagem],
    nota: notaResistencia(ficha), penalidades: p.testeFontes
  });
}

/**
 * Recupera um recurso respeitando as condições (Desgastado, Drenagem Vital…) e as maldições
 * (Proibido Ser Feliz tira PM ao recuperar PV). Devolve { updates, texto, ganho }.
 */
export function calcularRecuperacao(ficha, recurso, quantidade, { fonte = "", trocaPm = true } = {}) {
  const r = ficha.recursos[recurso];
  const updates = {};
  if (!r) return { updates, texto: "", ganho: 0 };
  const sigla = RECURSOS[recurso]?.abrev ?? recurso.toUpperCase();
  if (r.semRecuperar.length) return { updates, texto: `${sigla}: não recupera (${r.semRecuperar.join(", ")})`, ganho: 0 };
  let qtd = Math.max(0, Math.floor(num(quantidade)));
  const notas = [];
  if (r.recuperaMetade.length) { qtd = Math.floor(qtd / 2); notas.push(`metade por ${r.recuperaMetade.join(", ")}`); }
  const novo = r.max > 0 ? Math.min(r.max, r.value + qtd) : r.value + qtd;
  const ganho = Math.max(0, novo - r.value);
  updates[recurso === "pv" ? "system.attributes.hp.value" : `${P}.recursos.${recurso}.value`] = novo;
  if (trocaPm && recurso === "pv" && ganho > 0 && ficha.especiais.pmPorPv.length) {
    const pm = ficha.recursos.pm;
    updates[`${P}.recursos.pm.value`] = Math.max(0, pm.value - ganho);
    notas.push(`−${ganho} PM por ${ficha.especiais.pmPorPv.join(", ")}`);
  }
  return { updates, ganho, texto: `${sigla} +${ganho}${fonte ? ` (${fonte})` : ""}${notas.length ? `; ${notas.join("; ")}` : ""}` };
}

/** Aplica dano a PV (vida temporária primeiro) ou tira de outro recurso. */
export function calcularPerda(ficha, recurso, quantidade) {
  const qtd = Math.max(0, Math.floor(num(quantidade)));
  if (recurso === "pv") {
    const pv = ficha.recursos.pv;
    const doTemp = Math.min(pv.temp, qtd);
    const resto = qtd - doTemp;
    return {
      updates: { "system.attributes.hp.temp": pv.temp - doTemp, "system.attributes.hp.value": Math.max(0, pv.value - resto) },
      novo: Math.max(0, pv.value - resto), doTemp
    };
  }
  const r = ficha.recursos[recurso];
  const temp = Math.max(0, r?.temp ?? 0);
  const doTemp = Math.min(temp, qtd);
  const novo = Math.max(0, (r?.value ?? 0) - (qtd - doTemp));
  const updates = { [`${P}.recursos.${recurso}.value`]: novo };
  if (doTemp) updates[`${P}.recursos.${recurso}.temp`] = temp - doTemp;
  return { updates, novo, doTemp };
}

/** Dano contínuo (Hemorragia, Queimado, Drenagem…) e tabela de Insano no início do turno. */
export async function efeitosDeInicioDeTurno(actor) {
  let { ficha } = estadoAtor(actor);
  const dots = ficha.dots;
  const insano = ficha.turnoEfeitos.filter(t => t.tipo === "insano");
  if (!dots.length && !insano.length) return null;
  let escolhidos = dots.map((d, i) => ({ ...d, i, ligado: !d.opcional }));
  if (dots.length) {
    const linhas = escolhidos.map(d => `<label class="epm-check"><input type="checkbox" name="d${d.i}" ${d.ligado ? "checked" : ""}> <strong>${escapar(d.rotulo)}</strong>: −${escapar(d.formula)} ${RECURSOS[d.recurso]?.abrev ?? "PV"}${d.opcional ? ` <em>(só se valer agora)</em>` : ""}</label>`).join("");
    const r = await fvtt.DialogV2.wait({
      window: { title: `Início do turno: ${actor.name}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
      content: `<p class="epm-dica">Marque o que acontece neste início de turno.</p>${linhas}`,
      buttons: [
        { action: "ok", label: "Aplicar", icon: "fa-solid fa-check", default: true, callback: (ev, b) => Object.fromEntries(escolhidos.map(d => [d.i, !!b.form.elements[`d${d.i}`]?.checked])) },
        { action: "pular", label: "Pular", icon: "fa-solid fa-forward" }
      ]
    });
    escolhidos = escolhidos.filter(d => r && typeof r === "object" && r[d.i]);
  }
  const linhas = [];
  const rolls = [];
  for (const d of escolhidos) {
    let roll;
    try {
      roll = new Roll(Roll.replaceFormulaData(String(d.formula), dadosRolagem(actor, ficha), { missing: "0" }));
      await roll.evaluate();
    } catch (err) {
      console.warn("EPM |", err);
      continue;
    }
    rolls.push(roll);
    const perda = calcularPerda(ficha, d.recurso, roll.total);
    await actor.update(perda.updates);
    ({ ficha } = estadoAtor(actor));
    const sigla = RECURSOS[d.recurso]?.abrev ?? "PV";
    linhas.push(`<li><strong>${escapar(d.rotulo)}</strong>: −${roll.total} ${sigla}${perda.doTemp ? ` (${perda.doTemp} da vida temporária)` : ""}</li>`);
    if (d.seZerar && perda.novo <= 0 && !actor.statuses?.has(d.seZerar)) {
      try { await actor.toggleStatusEffect(d.seZerar, { active: true }); } catch (err) { console.warn("EPM |", err); }
      linhas.push(`<li>Ficou <strong>${escapar(condicaoPorId(d.seZerar)?.label ?? d.seZerar)}</strong> (${sigla} zerou).</li>`);
    }
  }
  for (const t of insano) {
    const roll = new Roll("1d6");
    await roll.evaluate();
    rolls.push(roll);
    const res = TABELA_INSANO.find(x => roll.total <= x.ate);
    linhas.push(`<li><strong>${escapar(t.fonte)}</strong> (1d6 = ${roll.total}): ${escapar(res.texto)}</li>`);
  }
  if (!linhas.length) return null;
  const mensagem = {
    speaker: falar(actor), rolls, sound: CONFIG.sounds?.dice,
    content: `<div class="epm-chat epm-chat-nota" style="--cor: #E05A4E"><p><strong>Início do turno</strong></p><ul>${linhas.join("")}</ul></div>`
  };
  return ChatMessage.create(mensagem);
}

/** Liga ou desliga no token os status da exaustão (5: Incapacitado e Inconsciente; 6: Morto). */
export async function sincronizarStatusExaustao(actor, nivel) {
  const marcados = Array.isArray(actor.flags?.[FLAG]?.statusExaustao) ? actor.flags[FLAG].statusExaustao : [];
  const querer = new Set(nivel >= 5 ? STATUS_COLAPSO : []);
  const morto = CONFIG.specialStatusEffects?.DEFEATED ?? "dead";
  if (nivel >= EXAUSTAO_MAX) querer.add(morto);
  const novos = [];
  for (const id of querer) {
    if (!actor.statuses?.has(id)) {
      try { await actor.toggleStatusEffect(id, { active: true, overlay: id === morto }); novos.push(id); }
      catch (err) { console.warn("EPM |", err); }
    } else if (marcados.includes(id)) novos.push(id);
  }
  for (const id of marcados) {
    if (querer.has(id)) continue;
    try { if (actor.statuses?.has(id)) await actor.toggleStatusEffect(id, { active: false }); } catch (err) { console.warn("EPM |", err); }
  }
  await actor.update({ [`${P}.statusExaustao`]: novos });
}

/** Muda a exaustão (6 pede confirmação, porque é a morte do personagem). */
export async function definirExaustao(actor, nivel) {
  const n = limitar(int(nivel), 0, EXAUSTAO_MAX);
  if (n >= EXAUSTAO_MAX && int(actor.flags?.[FLAG]?.exaustao) < EXAUSTAO_MAX) {
    const ok = await confirmar("Exaustão 6", `<p>Exaustão 6 é a <strong>morte</strong> de ${escapar(actor.name)}.</p><p>Confirmar? O token fica marcado como morto.</p>`);
    if (!ok) return null;
  }
  await actor.update({ [`${P}.exaustao`]: n });
  await sincronizarStatusExaustao(actor, n);
  const e = EXAUSTAO.find(x => x.nivel === n);
  if (n >= 5) {
    await ChatMessage.create({
      speaker: falar(actor),
      content: `<div class="epm-chat epm-chat-nota" style="--cor: #E05A4E"><p><strong>Exaustão ${n}: ${escapar(e?.nome ?? "")}</strong>. ${escapar(e?.texto ?? "")}.</p></div>`
    });
  }
  return n;
}

export async function aplicarCombinacao(actor, id, modo = "aplicar") {
  const k = COMBINACOES.find(x => x.id === id);
  if (!k) return;
  const lista = modo === "remover" ? (k.remover ?? []) : (k.aplicar ?? []);
  const nomes = [];
  for (const cid of lista) {
    const ativa = actor.statuses?.has(cid);
    if (modo === "remover" ? !ativa : ativa) continue;
    try {
      await actor.toggleStatusEffect(cid, { active: modo !== "remover" });
      nomes.push(condicaoPorId(cid)?.label ?? cid);
    } catch (err) { console.warn("EPM |", err); }
  }
  if (!nomes.length) return;
  return ChatMessage.create({
    speaker: falar(actor),
    content: `<div class="epm-chat epm-chat-nota" style="--cor: #B48CE0"><p><strong>${escapar(k.titulo)}</strong>: ${escapar(k.texto)}</p><p>${modo === "remover" ? "Removido" : "Aplicado"}: ${escapar(nomes.join(", "))}.</p></div>`
  });
}

export async function removerCondicoesNegativas(actor) {
  const ids = CONDICOES.map(c => c.id).filter(id => actor.statuses?.has(id) && !CONDICOES_NEUTRAS.includes(id));
  for (const id of ids) {
    try { await actor.toggleStatusEffect(id, { active: false }); } catch (err) { console.warn("EPM |", err); }
  }
  return ids.length;
}

function rotuloRecurso(k) { return RECURSOS[k]?.abrev ?? k.toUpperCase(); }

/** Calcula as mudanças de recursos de aoUsar/aoTerminar ({ pv: "max" | "metade" | "zero" | ±n }). */
function mudancasRecursos(ficha, regras = {}) {
  const updates = {};
  const textos = [];
  for (const k of ["pv", "pm", "pe", "ps"]) {
    const v = regras[k];
    if (v === undefined) continue;
    const r = ficha.recursos[k];
    const caminho = k === "pv" ? "system.attributes.hp.value" : `${P}.recursos.${k}.value`;
    let novo;
    if (v === "max") novo = r.max;
    else if (v === "metade") novo = Math.max(r.value, Math.floor(r.max / 2));
    else if (v === "zero") novo = 0;
    else novo = Math.max(0, r.value + num(v));
    if (num(v) > 0 || v === "max" || v === "metade") {
      if (r.semRecuperar.length) { textos.push(`${rotuloRecurso(k)}: não recupera (${r.semRecuperar.join(", ")})`); continue; }
    }
    updates[caminho] = r.max > 0 ? Math.min(novo, Math.max(r.max, r.value)) : novo;
    textos.push(`${rotuloRecurso(k)} ${r.value} → ${updates[caminho]}`);
  }
  if (regras.pvDefinir !== undefined) {
    updates["system.attributes.hp.value"] = int(regras.pvDefinir);
    textos.push(`PV → ${int(regras.pvDefinir)}`);
  }
  if (regras.temp === "metadeMax") {
    const temp = Math.max(ficha.recursos.pv.temp, Math.floor(ficha.recursos.pv.max / 2));
    updates["system.attributes.hp.temp"] = temp;
    textos.push(`Vida temporária ${temp}`);
  }
  return { updates, textos };
}

export async function cartaoBencao(actor, id, { titulo = "", linhasExtra = [], avisos = [] } = {}) {
  const b = actor.flags?.[FLAG]?.bencaos?.[id];
  if (!b) return null;
  const auto = automacaoDe(b);
  const tipo = b.tipo === "maldicao" ? "Maldição" : "Bênção";
  const natureza = NATUREZAS[b.natureza ?? auto.catalogo?.natureza]?.label ?? "";
  const rar = RARIDADES_BENCAO[b.raridade ?? auto.catalogo?.raridade];
  const linhas = [];
  if (b.condicao) linhas.push({ rotulo: "Condição", valor: b.condicao });
  if (b.custo) linhas.push({ rotulo: "Custo", valor: b.custo });
  if (b.consequencia) linhas.push({ rotulo: "Consequência", valor: b.consequencia });
  if (auto.frequencia !== "livre") linhas.push({ rotulo: "Usos", valor: FREQUENCIAS[auto.frequencia]?.label ?? "" });
  if (auto.duracao) linhas.push({ rotulo: "Duração", valor: `${auto.duracao} turnos` });
  linhas.push(...linhasExtra);
  return enviarCartao(actor, {
    img: b.tipo === "maldicao" ? "icons/svg/skull.svg" : "icons/svg/angel.svg",
    nome: titulo || b.nome || tipo, tipoLabel: [tipo, natureza].filter(Boolean).join(" "),
    raridadeLabel: rar?.label ?? "", raridadeCor: rar?.cor ?? (b.tipo === "maldicao" ? "#B48CE0" : "#E8C46A"),
    texto: b.descricao ? `<p>${escapar(b.descricao)}</p>` : "", linhas, avisos
  }, { tipo: "bencao", bencao: id });
}

/** "Usar" uma bênção: confere o limite de usos, aplica os efeitos imediatos e liga a duração. */
export async function usarBencao(actor, id) {
  const b = actor.flags?.[FLAG]?.bencaos?.[id];
  if (!b) return null;
  const auto = automacaoDe(b);
  if (b.usado && auto.frequencia !== "livre") {
    const texto = `${b.nome || "Esta bênção"} já foi usada (${FREQUENCIAS[auto.frequencia]?.label ?? ""}).`;
    if (!game.user.isGM) return ui.notifications.warn(texto);
    if (!(await confirmar("Já usada", `<p>${escapar(texto)}</p><p>Usar mesmo assim?</p>`))) return null;
  }
  const { ficha } = estadoAtor(actor);
  const sit = ficha.bencaos.find(x => x.id === id);
  if (sit?.suspensaPor?.length) {
    const texto = `${b.nome} está suspensa por ${sit.suspensaPor.join(", ")}.`;
    if (!game.user.isGM) return ui.notifications.warn(texto);
    if (!(await confirmar("Bênção suspensa", `<p>${escapar(texto)}</p><p>Usar mesmo assim?</p>`))) return null;
  }
  const u = auto.aoUsar ?? {};
  const { updates, textos } = mudancasRecursos(ficha, u);
  if (auto.frequencia !== "livre") updates[`${P}.bencaos.${id}.usado`] = true;
  if (auto.duracao) {
    updates[`${P}.bencaos.${id}.ativo`] = true;
    updates[`${P}.bencaos.${id}.turnosRestantes`] = auto.duracao;
    textos.push(`Ativa por ${auto.duracao} turnos`);
  }
  for (const m of u.permanentes ?? []) {
    const atuais = Object.entries(b.permanentes ?? {});
    const igual = atuais.find(([, x]) => x?.alvo === m.alvo);
    if (igual) updates[`${P}.bencaos.${id}.permanentes.${igual[0]}.valor`] = num(igual[1].valor) + m.valor;
    else updates[`${P}.bencaos.${id}.permanentes.${novoId()}`] = { alvo: m.alvo, valor: m.valor };
    textos.push(`${m.alvo.split(".").pop()} ${sinalCurto(m.valor)} para sempre`);
  }
  if (Object.keys(updates).length) await actor.update(updates);
  if (u.removerCondicoes) {
    const n = await removerCondicoesNegativas(actor);
    textos.push(n ? `${n} condição(ões) removida(s)` : "Nenhuma condição para remover");
  }
  for (const cid of u.condicoes ?? []) {
    if (actor.statuses?.has(cid)) continue;
    try { await actor.toggleStatusEffect(cid, { active: true }); textos.push(`Ficou ${condicaoPorId(cid)?.label ?? cid}`); }
    catch (err) { console.warn("EPM |", err); }
  }
  return cartaoBencao(actor, id, { avisos: textos });
}

/** Termina uma bênção (duração acabou ou o jogador encerrou) e aplica o custo final. */
export async function terminarBencao(actor, id, { porDuracao = false } = {}) {
  const b = actor.flags?.[FLAG]?.bencaos?.[id];
  if (!b) return null;
  const auto = automacaoDe(b);
  const { ficha } = estadoAtor(actor);
  const t = auto.aoTerminar ?? {};
  const { updates, textos } = mudancasRecursos(ficha, t);
  updates[`${P}.bencaos.${id}.ativo`] = false;
  updates[`${P}.bencaos.${id}.turnosRestantes`] = 0;
  await actor.update(updates);
  if (t.rolar) {
    try {
      const roll = new Roll(t.rolar);
      await roll.evaluate();
      await roll.toMessage({ speaker: falar(actor), flavor: `<span class="epm-flavor"><strong>${escapar(b.nome)}: fim</strong></span>` });
      textos.push(`Rolou ${t.rolar} = ${roll.total}`);
    } catch (err) { console.warn("EPM |", err); }
  }
  if (t.texto) textos.push(t.texto);
  if (!textos.length && !porDuracao) return null;
  return cartaoBencao(actor, id, { titulo: `${b.nome}: terminou`, avisos: textos.length ? textos : ["O efeito terminou."] });
}

/**
 * Chamado quando um combate termina (só no Mestre): recarrega os usos "por combate"
 * e aplica as maldições de fim de combate (Olhos do Criador).
 */
/** Recarrega as cargas dos itens do personagem com recarga nos períodos dados. Devolve os nomes. */
export async function recarregarCargas(actor, periodos = []) {
  const mudancas = [];
  const nomes = [];
  for (const it of actor.items ?? []) {
    const c = it.flags?.[FLAG]?.cargas;
    if (!c || int(c.max) <= 0 || !periodos.includes(c.recarga) || int(c.valor) >= int(c.max)) continue;
    mudancas.push({ _id: it.id, [`flags.${FLAG}.cargas.valor`]: int(c.max) });
    nomes.push(it.name);
  }
  if (mudancas.length) await actor.updateEmbeddedDocuments("Item", mudancas);
  return nomes;
}

export async function fimDeCombate(combate) {
  if (!game.user.isGM) return;
  const ativo = game.users?.activeGM;
  if (ativo && !ativo.isSelf) return;
  if (ajustes().bestiarioAutomatico) {
    try { await registrarBestiario(combate); } catch (err) { console.warn("EPM | Bestiário automático", err); }
  }
  const atores = new Set();
  for (const c of combate?.combatants ?? []) if (c.actor) atores.add(c.actor);
  for (const actor of atores) {
    const dados = actor.flags?.[FLAG];
    if (!dados) continue;
    await recarregarCargas(actor, ["combate"]);
    const updates = {};
    if (dados.usos?.recuperarMana) updates[`${P}.usos.recuperarMana`] = false;
    if (dados.usos?.presa) updates[`${P}.usos.presa`] = "";
    // 0.6.0: Fúria dura 1 cena; Projeto Ágil e pacotes de munição valem por combate
    if (dados.classeEpm?.furiaAtiva) updates[`${P}.classeEpm.furiaAtiva`] = false;
    if (dados.usos?.projetoAgil) updates[`${P}.usos.projetoAgil`] = false;
    if (dados.usos?.pacotes && Object.keys(dados.usos.pacotes).length) updates[`${P}.usos.-=pacotes`] = null;
    Object.assign(updates, limparBonusDaCena(dados));
    for (const [id, b] of Object.entries(dados.bencaos ?? {})) {
      if (!b || typeof b !== "object") continue;
      if (automacaoDe(b).frequencia === "combate" && b.usado) updates[`${P}.bencaos.${id}.usado`] = false;
    }
    const { ficha } = estadoAtor(actor);
    const perda = ficha.especiais.psFimCombate.valor;
    if (perda) updates[`${P}.recursos.ps.value`] = Math.max(0, ficha.recursos.ps.value - perda);
    if (Object.keys(updates).length) await actor.update(updates);
    if (perda) {
      await ChatMessage.create({
        speaker: falar(actor),
        content: `<div class="epm-chat epm-chat-nota" style="--cor: #B48CE0"><p>Fim do combate: −${perda} PS (${escapar(ficha.especiais.psFimCombate.fontes.join(", "))}).</p></div>`
      });
    }
  }
}


/* -------------------------------------------- */
/*  Treinamentos                                */
/* -------------------------------------------- */

const notaChat = (actor, html) => ChatMessage.create({ speaker: falar(actor), content: `<div class="epm-chat epm-chat-nota epm-chat-treino">${html}</div>` });

/** Horas de treino ainda livres hoje. */
export function horasLivres(actor) {
  const usadas = Math.max(0, num(actor.flags?.[FLAG]?.treinoDia?.horas));
  return Math.max(0, TREINO.horasDia - usadas);
}

/** Ação de Treinamento ou Estudo: 6 horas → 5 PT. */
export async function treinoGanharPT(actor, { grupo = null } = {}) {
  const { parceirosTreino, BONUS_TREINO_GRUPO } = await import("./oficina.mjs");
  const livres = horasLivres(actor);
  // Inteligência acima de 4 (Notion): ação de treino mais curta, PT e PH extras
  const altos = estadoAtor(actor).ficha.extras?.altos ?? {};
  const horas = Math.min(TREINO.acao.horas, int(altos.horasTreino) || TREINO.acao.horas);
  const ptBase = TREINO.acao.pt + Math.max(0, int(altos.ptTreino));
  const ph = Math.max(0, int(altos.phExtra));
  // Treino em grupo: 25% menos tempo e 25% mais PT (arredondado para cima)
  const horasGrupo = Math.round(horas * (2 - BONUS_TREINO_GRUPO) * 10) / 10;
  const ptGrupo = Math.ceil(ptBase * BONUS_TREINO_GRUPO);
  const hTxt = h => String(h).replace(".", ",");
  if (livres < horasGrupo) return ui.notifications.warn(`Faltam horas de treino hoje: precisa de ${horas} h (ou ${hTxt(horasGrupo)} h em grupo) e restam ${livres} h.`);
  const texto = pt => `${pt} PT${ph ? ` e ${ph} PH` : ""}`;
  const parceiros = Array.isArray(grupo) ? [] : parceirosTreino(actor);
  const r = await fvtt.DialogV2.wait({
    window: { title: "Treinar ou estudar" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>${Array.isArray(grupo) ? hTxt(horasGrupo) : horas} horas de treino ou estudo valem <strong>${texto(Array.isArray(grupo) ? ptGrupo : ptBase)}</strong>${Array.isArray(grupo) ? " (treino em grupo)" : ""}.${horas < TREINO.acao.horas || ptBase > TREINO.acao.pt || ph ? " <span class=\"epm-dica\">(Inteligência acima de 4)</span>" : ""}</p>
      <label class="epm-campo"><span>O que fez (opcional)</span><input type="text" name="oque" placeholder="Treino de esgrima, estudo de runas…"></label>
      ${parceiros.length ? `<fieldset class="epm-aquisicao"><legend>Treino em grupo: ${hTxt(horasGrupo)} h e ${texto(ptGrupo)}</legend>${parceiros.map(pc => `<label class="epm-check"><input type="checkbox" name="p_${escapar(pc.uuid)}" value="${escapar(pc.uuid)}"> ${escapar(pc.nome)} (afinidade ${pc.afinidade >= 0 ? "+" : ""}${pc.afinidade})</label>`).join("")}
        <p class="epm-dica">Em grupo: 25% menos tempo e 25% mais PT. Quem treinou junto registra na própria ficha pelo botão do cartão.</p></fieldset>` : ""}`,
    buttons: [
      { action: "ok", label: "Treinar", icon: "fa-solid fa-check", default: true, callback: (e, b) => ({ oque: b.form.elements.oque.value.trim(), parceiros: [...b.form.querySelectorAll("input[name^='p_']:checked")].map(x => x.value) }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object") return;
  const comQuem = Array.isArray(grupo) ? grupo : (r.parceiros ?? []);
  const pt = comQuem.length ? ptGrupo : ptBase;
  const gasto = comQuem.length ? horasGrupo : horas;
  if (livres < gasto) return ui.notifications.warn(`Faltam horas de treino hoje: precisa de ${hTxt(gasto)} h e restam ${livres} h.`);
  const { ficha } = estadoAtor(actor);
  const usadas = TREINO.horasDia - livres;
  const upd = { [`${P}.pontos.pt`]: ficha.pontos.pt + pt, [`${P}.treinoDia.horas`]: usadas + gasto };
  if (ph) upd[`${P}.pontos.ph`] = ficha.pontos.ph + ph;
  await actor.update(upd);
  const nome = u => { try { return fromUuidSync(u)?.name ?? ""; } catch { return ""; } };
  const nomes = comQuem.map(nome).filter(Boolean);
  const botoes = Array.isArray(grupo) ? "" : comQuem.filter(nome).map(u => `<button type="button" class="epm-botao epm-botao-mini" data-epm-action="treinoPtGrupo" data-parceiro="${escapar(u)}" data-de="${escapar(actor.uuid)}"><i class="fa-solid fa-dumbbell"></i> ${escapar(nome(u))}: registrar o meu</button>`).join("");
  return notaChat(actor, `<p><strong>${escapar(actor.name)}</strong> ${r.oque ? `fez: ${escapar(r.oque)}` : "treinou ou estudou"} (${hTxt(gasto)} h): <strong>+${texto(pt)}</strong>.${nomes.length ? `<br><span class="epm-dica">Treino em grupo com ${escapar(nomes.join(", "))}: ${horas} → ${hTxt(gasto)} h e ${ptBase} → ${pt} PT.</span>` : ""}</p>${botoes ? `<p>${botoes}</p>` : ""}`);
}

/** Conversa ou tutor: 1 a 3 PT, conforme o tempo (não gasta horas de treino). */
export async function treinoConversa(actor) {
  const opcoes = Array.from({ length: TREINO.conversa.max - TREINO.conversa.min + 1 }, (_, i) => TREINO.conversa.min + i);
  const r = await fvtt.DialogV2.wait({
    window: { title: "Conversa ou tutor" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>Conversar com alguém ou ter um tutor sobre um assunto dá de ${TREINO.conversa.min} a ${TREINO.conversa.max} PT, dependendo de quanto tempo passou.</p>
      <div class="epm-dialogo-linha">
        <label class="epm-campo"><span>PT</span><select name="pt">${opcoes.map(v => `<option value="${v}">${v} PT</option>`).join("")}</select></label>
        <label class="epm-campo"><span>Com quem / sobre o quê</span><input type="text" name="sobre" placeholder="Mestre Orin, história de Aster…"></label>
      </div>`,
    buttons: [
      { action: "ok", label: "Receber", icon: "fa-solid fa-check", default: true, callback: (e, b) => ({ pt: int(b.form.elements.pt.value), sobre: b.form.elements.sobre.value.trim() }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object" || !r.pt) return;
  const pt = limitar(r.pt, TREINO.conversa.min, TREINO.conversa.max);
  const { ficha } = estadoAtor(actor);
  await actor.update({ [`${P}.pontos.pt`]: ficha.pontos.pt + pt });
  return notaChat(actor, `<p><strong>${escapar(actor.name)}</strong> aprendeu numa conversa${r.sobre ? ` (${escapar(r.sobre)})` : ""}: <strong>+${pt} PT</strong>.</p>`);
}

/** Começar um treinamento: paga os PT (pede confirmação dos requisitos e do treinador). */
export async function comecarTreinamento(actor, id) {
  const t = actor.flags?.[FLAG]?.treinamentos?.[id];
  if (!t) return;
  const pt = Math.max(0, int(t.pt));
  const { ficha } = estadoAtor(actor);
  if (pt > ficha.pontos.pt) return ui.notifications.warn(`Faltam ${pt - ficha.pontos.pt} PT: custa ${pt} e você tem ${ficha.pontos.pt}.`);
  // Requisitos: atributo, perícia e outro treinamento a ficha confere sozinha; treinador o jogador ou o Mestre confirma
  const { avaliarRequisitos } = await import("./oficina.mjs");
  const av = avaliarRequisitos(t.requisitos, ficha, actor.flags[FLAG], id);
  if (!av.ok && !game.user.isGM) return ui.notifications.warn(`Falta para começar ${t.nome || "o treinamento"}: ${av.faltas.join("; ")}.`);
  const manuais = [...av.manuais, ...(t.treinador ? ["Precisa de treinador"] : [])];
  if (!av.ok || manuais.length) {
    const linhas = [
      av.cumpridos.length ? `<p><i class="fa-solid fa-check" aria-hidden="true"></i> Cumpre: ${escapar(av.cumpridos.join("; "))}.</p>` : "",
      av.faltas.length ? `<p><i class="fa-solid fa-xmark" aria-hidden="true"></i> Falta: ${escapar(av.faltas.join("; "))} (o Mestre pode liberar).</p>` : "",
      manuais.length ? `<p><i class="fa-solid fa-user-check" aria-hidden="true"></i> Confirme: ${escapar(manuais.join("; "))}.</p>` : ""
    ].join("");
    if (!(await confirmar(`Começar ${t.nome || "treinamento"}`, `${linhas}<p>Começar? Serão gastos ${pt} PT.</p>`))) return;
  }
  await actor.update({ [`${P}.pontos.pt`]: ficha.pontos.pt - pt, [`${P}.treinamentos.${id}.estado`]: "andamento", [`${P}.treinamentos.${id}.horasFeitas`]: 0 });
  return notaChat(actor, `<p><strong>${escapar(actor.name)}</strong> começou o treinamento <strong>${escapar(t.nome || "sem nome")}</strong> (−${pt} PT).</p>`);
}

/** Horas totais de um treinamento, em horas de treino. */
export function horasDoTreino(t) {
  const u = UNIDADES_TEMPO[t?.unidade] ?? UNIDADES_TEMPO.horas;
  return Math.max(1, Math.round(Math.max(0, num(t?.tempo)) * u.horas));
}

/**
 * Registra horas num treinamento em andamento (limitado às horas livres do dia).
 * Treino em grupo (parceiros com afinidade +2): as horas contam 25% a mais. Treinador NPC com preço por hora:
 * a ficha paga com as moedas (troco automático); sem dinheiro, as horas não são registradas.
 */
export async function treinarHoras(actor, id, horasPedidas = null, { grupo = null } = {}) {
  const { parceirosTreino, pagarTreinador, textoPreco, BONUS_TREINO_GRUPO } = await import("./oficina.mjs");
  const t = actor.flags?.[FLAG]?.treinamentos?.[id];
  if (!t || t.estado !== "andamento") return;
  const total = horasDoTreino(t);
  const feitas = Math.max(0, num(t.horasFeitas));
  const livres = horasLivres(actor);
  const maximo = Math.min(livres, Math.ceil(total - feitas));
  if (maximo <= 0) return ui.notifications.warn("Sem horas de treino livres hoje.");
  let horas = horasPedidas;
  let comQuem = Array.isArray(grupo) ? grupo : [];
  const preco = textoPreco(t);
  if (horas === null) {
    const parceiros = parceirosTreino(actor);
    const r = await fvtt.DialogV2.wait({
      window: { title: `Treinar: ${t.nome || "treinamento"}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
      content: `<p>Faltam ${Math.round((total - feitas) * 10) / 10} h para concluir. Você tem ${livres} h de treino livres hoje.</p>
        <label class="epm-campo"><span>Horas</span><input type="number" name="horas" min="1" max="${maximo}" value="${maximo}"></label>
        ${preco ? `<p class="epm-dica"><i class="fa-solid fa-coins" aria-hidden="true"></i> Treinador: ${escapar(preco)} (a ficha paga com as moedas; sem dinheiro, as horas não entram).</p>` : ""}
        ${parceiros.length ? `<fieldset class="epm-aquisicao"><legend>Treino em grupo (+25% nas horas)</legend>${parceiros.map(pc => `<label class="epm-check"><input type="checkbox" name="p_${escapar(pc.uuid)}" value="${escapar(pc.uuid)}"> ${escapar(pc.nome)} (afinidade ${pc.afinidade >= 0 ? "+" : ""}${pc.afinidade})</label>`).join("")}
          <p class="epm-dica">Quem treinou junto registra as horas na própria ficha pelo botão do cartão, também com +25%.</p></fieldset>` : ""}`,
      buttons: [
        { action: "ok", label: "Treinar", icon: "fa-solid fa-dumbbell", default: true, callback: (e, b) => ({ horas: num(b.form.elements.horas.value), parceiros: [...b.form.querySelectorAll("input[name^='p_']:checked")].map(x => x.value) }) },
        { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
      ]
    });
    if (!r || typeof r !== "object") return;
    horas = r.horas;
    comQuem = r.parceiros ?? [];
  }
  horas = limitar(Math.round(num(horas)), 0, maximo);
  if (!horas) return;
  const pago = pagarTreinador(actor.flags[FLAG], t, horas);
  if (!pago) return ui.notifications.warn(`Sem dinheiro para pagar o treinador (${preco}): as horas não foram registradas.`);
  const ganho = comQuem.length ? Math.round(horas * BONUS_TREINO_GRUPO * 10) / 10 : horas;
  const agora = Math.min(total, Math.round((feitas + ganho) * 10) / 10);
  const concluiu = agora >= total;
  const usadas = TREINO.horasDia - livres;
  await actor.update({
    ...pago.updates,
    [`${P}.treinamentos.${id}.horasFeitas`]: agora, [`${P}.treinoDia.horas`]: usadas + horas,
    ...(concluiu ? { [`${P}.treinamentos.${id}.estado`]: "concluido" } : {})
  });
  const nomes = comQuem.map(u => { try { return fromUuidSync(u)?.name; } catch { return null; } }).filter(Boolean);
  const extra = [
    nomes.length ? `Treinou com ${nomes.join(", ")}: +25% (${horas} h contam ${ganho} h).` : "",
    pago.texto ? `${pago.texto[0].toUpperCase()}${pago.texto.slice(1)}.` : ""
  ].filter(Boolean).map(x => `<br><span class="epm-dica">${escapar(x)}</span>`).join("");
  const botoes = Array.isArray(grupo) ? "" : comQuem.map(u => {
    const nome = (() => { try { return fromUuidSync(u)?.name ?? ""; } catch { return ""; } })();
    return nome ? `<button type="button" class="epm-botao epm-botao-mini" data-epm-action="treinoEmGrupo" data-parceiro="${escapar(u)}" data-horas="${horas}" data-de="${escapar(actor.uuid)}"><i class="fa-solid fa-dumbbell"></i> ${escapar(nome)}: registrar no meu treino</button>` : "";
  }).join("");
  return notaChat(actor, concluiu
    ? `<p><strong>${escapar(actor.name)}</strong> concluiu <strong>${escapar(t.nome || "o treinamento")}</strong>!${t.beneficios ? `<br>${escapar(t.beneficios)}` : ""}${extra}</p>${botoes ? `<p>${botoes}</p>` : ""}`
    : `<p><strong>${escapar(actor.name)}</strong> treinou ${horas} h em <strong>${escapar(t.nome || "treinamento")}</strong> (${agora} de ${total} h).${extra}</p>${botoes ? `<p>${botoes}</p>` : ""}`);
}

/** Resultado de um minijogo de treino rápido: usa 1 h do dia e dá PT conforme os acertos. */
export async function resultadoMinijogo(actor, jogo, acertos, rodadas = 5) {
  const livres = horasLivres(actor);
  if (livres < TREINO.minijogo.horas) return ui.notifications.warn("Sem horas de treino livres hoje.");
  const a = limitar(int(acertos), 0, rodadas);
  const pt = PT_POR_ACERTOS[Math.min(a, PT_POR_ACERTOS.length - 1)] ?? 0;
  const { ficha } = estadoAtor(actor);
  const usadas = TREINO.horasDia - livres;
  await actor.update({ [`${P}.treinoDia.horas`]: usadas + TREINO.minijogo.horas, ...(pt ? { [`${P}.pontos.pt`]: ficha.pontos.pt + pt } : {}) });
  const nome = MINIJOGOS[jogo]?.label ?? "Treino rápido";
  // Lesão: 0 acertos deixa Lesionado (−2 em Força, Destreza e Constituição até o próximo descanso longo)
  const lesao = a === 0;
  if (lesao) { try { if (!actor.statuses?.has("epm-lesionado")) await actor.toggleStatusEffect("epm-lesionado", { active: true }); } catch (err) { console.warn("EPM |", err); } }
  await notaChat(actor, `<p><strong>${escapar(actor.name)}</strong> fez um treino rápido (<em>${escapar(nome)}</em>): ${a} de ${rodadas} acertos, <strong>${pt ? `+${pt} PT` : "nenhum PT desta vez"}</strong>.</p>${lesao ? "<p><strong>Lesionado</strong>: −2 nos testes de Força, Destreza e Constituição até o próximo descanso longo.</p>" : ""}`);
  return pt;
}

/* -------------------------------------------- */
/*  Moedas guardadas em mochilas                */
/* -------------------------------------------- */

/**
 * Passa moedas entre a carteira do personagem e uma mochila (mesma moeda, sem troco).
 * `direcao`: "guardar" (carteira → mochila) ou "pegar" (mochila → carteira).
 */
export async function moverMoedasMochila(mochila, direcao) {
  const actor = mochila?.actor;
  if (!actor) return ui.notifications.warn("A mochila precisa estar num personagem.");
  const carteira = actor.flags?.[FLAG]?.moedas ?? {};
  const dentro = mochila.flags?.[FLAG]?.moedas ?? {};
  const origem = direcao === "guardar" ? carteira : dentro;
  const opcoes = MOEDAS.map(m => `<option value="${m.id}">${m.label} (${int(origem[m.id])})</option>`).join("");
  const r = await fvtt.DialogV2.wait({
    window: { title: direcao === "guardar" ? `Guardar em ${mochila.name}` : `Pegar de ${mochila.name}` },
    classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Quantidade</span><input type="number" name="qtd" min="1" value="1" autofocus></label>
      <label class="epm-campo"><span>Moeda</span><select name="moeda">${opcoes}</select></label></div>`,
    buttons: [
      { action: "ok", label: direcao === "guardar" ? "Guardar" : "Pegar", icon: "fa-solid fa-check", default: true,
        callback: (e, b) => ({ qtd: int(b.form.elements.qtd.value), moeda: b.form.elements.moeda.value }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object" || r.qtd <= 0) return;
  return transferirMoedas(actor, mochila, r.moeda, r.qtd, direcao);
}

/** Transferência sem diálogo (usada pelo diálogo e pelos testes). */
export async function transferirMoedas(actor, mochila, moeda, qtd, direcao) {
  const m = MOEDAS.find(x => x.id === moeda);
  if (!m) return;
  const carteira = int(actor.flags?.[FLAG]?.moedas?.[moeda]);
  const dentro = int(mochila.flags?.[FLAG]?.moedas?.[moeda]);
  const temNaOrigem = direcao === "guardar" ? carteira : dentro;
  if (qtd > temNaOrigem) return ui.notifications.warn(`Só há ${temNaOrigem} ${m.label} ${direcao === "guardar" ? "na carteira" : "na mochila"}.`);
  const delta = direcao === "guardar" ? qtd : -qtd;
  await actor.update({ [`${P}.moedas.${moeda}`]: carteira - delta });
  await mochila.update({ [`${P}.moedas.${moeda}`]: dentro + delta });
  ui.notifications.info(`${qtd} ${m.label} ${direcao === "guardar" ? `guardadas em ${mochila.name}` : `de ${mochila.name} para a carteira`}.`);
}
