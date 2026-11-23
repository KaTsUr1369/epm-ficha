/**
 * Melhorias de itens: ações no Foundry (adicionar, comprar, fazer em 3 etapas, trocar material, pergaminho, feito).
 */
import { FLAG, TREINO } from "./config.mjs";
import { num, int, pagarMoedas, formatarMoedas } from "./data.mjs";
import { escapar, fvtt } from "./helpers.mjs";
import {
  estadoMelhorias, podeAdicionar, opcoesParaAdicionar, novaEntrada, precoMelhoria, precoTrocaMaterial, dtMelhoria, custoFazerPO,
  precoMaterialPO, lerMelhorias, nomeDaEntrada, perfilItem, TIPOS_MELHORIA, MATERIAIS, HORAS_MELHORIA, ETAPAS_MELHORIA,
  MATERIAL_UNIDADES_PESADO, PERGAMINHO, melhoriaPorId, bonusDeFerramentas
} from "./melhorias.mjs";

const P = `flags.${FLAG}`;
const COBRE_PO = 100;
const LOTE_CONSUMIVEL = 5;
const ELEMENTOS = ["Fogo", "Frio", "Ácido", "Relâmpago", "Trovejante", "Venenoso", "Força", "Psíquico", "Sonoro"];
const CONDICOES_GRACA = ["Apavorado", "Envenenado", "Sangrando", "Atordoado", "Em Chamas"];
const TIPOS_REVESTIDA = ["Cortante", "Perfurante", "Contundente", "Balístico", "Fogo", "Frio", "Ácido", "Venenoso", "Relâmpago", "Energia", "Explosivo"];

async function nota(actor, html, cor = "#8E7CC3") {
  return ChatMessage.create({ speaker: actor ? ChatMessage.getSpeaker({ actor }) : undefined, content: `<div class="epm-chat epm-chat-nota" style="--cor: ${cor}">${html}</div>` });
}
const mestre = () => !!game.user?.isGM;
const op = (lista, atual = "") => lista.map(v => `<option value="${escapar(v)}" ${v === atual ? "selected" : ""}>${escapar(v)}</option>`).join("");

/* ---------------- Ofício e atributo (o jogador escolhe) ---------------- */

const norm = t => String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** Ofícios da ficha: perícias "Ofício (…)" ou com id oficio… (uma pessoa pode ter 0, 1 ou vários). */
export function oficiosDaFicha(ficha) {
  return (ficha?.pericias ?? []).filter(p => /^oficio/.test(norm(p.nome)) || /^oficio/.test(p.id));
}
/** Ofício sugerido: o que tiver a palavra (Ferreiro, Encantador); senão o primeiro. */
export function oficioSugerido(ficha, palavra) {
  const l = oficiosDaFicha(ficha);
  return l.find(p => norm(p.nome).includes(norm(palavra))) ?? l[0] ?? null;
}
const ROT_ATR = { forca: "Força", destreza: "Destreza", constituicao: "Constituição", aparencia: "Aparência", carisma: "Carisma", inteligencia: "Inteligência", autocontrole: "Autocontrole", nucleo: "Núcleo" };
/** Campos do teste: qual Ofício e qual atributo (o jogador decide). */
function camposOficio(ficha, palavra, atual = {}) {
  const l = oficiosDaFicha(ficha);
  const sug = atual.oficio ? l.find(p => p.id === atual.oficio) : oficioSugerido(ficha, palavra);
  const ops = l.length ? l.map(p => `<option value="${p.id}" ${p.id === sug?.id ? "selected" : ""}>${escapar(p.nome)} (${p.bonusProprio >= 0 ? "+" : ""}${p.bonusProprio})</option>`).join("") : `<option value="">Sem Ofício (+0)</option>`;
  const atrs = Object.entries(ROT_ATR).map(([id, l2]) => `<option value="${id}" ${id === (atual.atributo || "inteligencia") ? "selected" : ""}>${l2} (${ficha?.atributos?.[id]?.total ?? 0})</option>`).join("");
  return `<div class="epm-dialogo-linha"><label class="epm-campo"><span>Ofício (${escapar(palavra)})</span><select name="oficio">${ops}</select></label>
    <label class="epm-campo"><span>Atributo</span><select name="atributo">${atrs}</select></label></div>`;
}
/** Teste: 1d20 + Ofício + atributo escolhidos. */
async function rolarOficio(actor, { oficio = "", atributo = "inteligencia" } = {}, rotulo = "", dt = 0) {
  const { estadoAtor, formulaD20 } = await import("./mecanicas.mjs");
  const { ficha } = estadoAtor(actor);
  const per = ficha.periciaPorId?.[oficio] ?? null;
  const vPer = int(per?.bonusProprio);
  const vAtr = int(ficha.atributos?.[atributo]?.total);
  const ferr = bonusDeFerramentas(actor);
  const roll = await new Roll(`${formulaD20()} + ${vPer} + ${vAtr}${ferr.bonus ? ` + ${ferr.bonus}` : ""}`).evaluate();
  await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<span class="epm-flavor"><strong>${rotulo}</strong> (DT ${dt}; ${escapar(per?.nome ?? "sem Ofício")} + ${escapar(ROT_ATR[atributo] ?? atributo)}${ferr.bonus ? ` + ${escapar(ferr.nome)} ${ferr.bonus}` : ""})</span>` });
  return roll;
}

/** Campo do que se escolhe ao fazer (elemento, tipo de dano, perícia, material…). */
function campoEscolha(def, item, materialPronto = "") {
  switch (def.escolha) {
    case "elemento": return `<label class="epm-campo"><span>Elemento</span><select name="escolha">${op(ELEMENTOS)}</select></label>`;
    case "tipoDano": return `<label class="epm-campo"><span>Tipo de dano</span><select name="escolha">${op(TIPOS_REVESTIDA)}</select></label>`;
    case "condicao": return `<label class="epm-campo"><span>Condição</span><select name="escolha">${op(CONDICOES_GRACA)}</select></label>`;
    case "pericia": {
      const pers = Object.entries(item.parent?.flags?.[FLAG]?.pericias ?? {}).map(([id, p]) => p?.nome || id);
      const lista = pers.length ? pers : ["Diplomacia", "Lábia", "Liderança", "Intimidação", "Performance", "Empatia", "Psicologia"];
      return `<label class="epm-campo"><span>Perícia</span><select name="escolha">${op(lista.sort((a, b) => a.localeCompare(b, "pt-BR")))}</select></label>`;
    }
    case "material": {
      const p = perfilItem(item);
      const col = p.arma || p.municao ? "arma" : p.protecao ? "protecao" : "outros";
      const ops = Object.entries(MATERIAIS).filter(([, m]) => m[col]).map(([id, m]) => `<option value="${id}" ${id === materialPronto ? "selected" : ""}>${escapar(m.nome)} (${precoMaterialPO(id).toLocaleString("pt-BR")} PO): ${escapar(m[col].texto)}</option>`).join("");
      return `<label class="epm-campo"><span>Material</span><select name="material">${ops}</select></label>
        <label class="epm-campo"><span>Escolha do material (ex.: elemento do dragão)</span><input type="text" name="escolha" placeholder="só para Osso de Dragão"></label>`;
    }
    case "texto": return `<label class="epm-campo"><span>Escolha ao fazer</span><input type="text" name="escolha" placeholder="ex.: frio, floresta, a magia…"></label>`;
    default: return "";
  }
}

/** Diálogo com a lista filtrada pelo tipo do item, com busca. Devolve a definição escolhida. */
async function escolherDaLista(item, tipo) {
  const gm = mestre();
  const lista = opcoesParaAdicionar(item, tipo, { mestre: gm });
  if (!lista.length) { ui.notifications.info(`Nenhum(a) ${TIPOS_MELHORIA[tipo].label} serve para este item.`); return null; }
  const linhas = lista.map(m => `<label class="epm-melhoria-opcao${m.ok ? "" : " bloqueada"}" data-busca="${escapar(`${m.nome} ${m.textoCompleto}`.toLowerCase())}">
      <input type="radio" name="melhoria" value="${m.id}" ${m.ok ? "" : "disabled"}>
      <span><strong>${escapar(m.nome)}</strong>${m.temPre ? ` <em class="epm-tag">pré-requisito</em>` : ""}<br><span class="epm-dica">${escapar(m.textoCompleto)}</span>
      ${m.ok ? "" : `<br><span class="epm-alerta-texto">${escapar(m.motivo)}</span>`}</span></label>`).join("");
  const r = await fvtt.DialogV2.wait({
    window: { title: `${TIPOS_MELHORIA[tipo].label}: ${item.name}` }, classes: ["epm-dialogo", "epm-dialogo-melhorias"], rejectClose: false, modal: true,
    position: { width: 560 },
    content: `<input type="search" class="epm-busca-melhoria" placeholder="Buscar melhoria…" autocomplete="off">
      <div class="epm-melhorias-opcoes" style="max-height: 420px; overflow-y: auto;">${linhas}</div>`,
    render: (ev, dialog) => {
      const raiz = dialog.element ?? ev?.target?.element;
      const busca = raiz?.querySelector(".epm-busca-melhoria");
      busca?.addEventListener("input", () => {
        const t = busca.value.trim().toLowerCase();
        for (const el of raiz.querySelectorAll(".epm-melhoria-opcao")) el.hidden = !!t && !el.dataset.busca.includes(t);
      });
    },
    buttons: [
      { action: "ok", label: "Escolher", icon: "fa-solid fa-check", default: true, callback: (ev, b) => b.form?.elements?.melhoria?.value ?? "" },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || r === "cancelar") return null;
  return melhoriaPorId(r, tipo);
}

/** Adicionar uma melhoria: escolhe na lista, depois Fazer, Comprar ou (Mestre) só adicionar. */
export async function dialogoAdicionarMelhoria(item, tipo, { def: defPronta = null, material: materialPronto = "" } = {}) {
  if (!item?.isOwner) return ui.notifications.warn("Este item não é seu.");
  const gm = mestre();
  if (["maldicao", "bencao"].includes(tipo) && !gm) return ui.notifications.warn("Maldições e Bênçãos só o Mestre adiciona.");
  if (item.flags?.[FLAG]?.fazendoMelhoria) return ui.notifications.warn("Este item já tem uma melhoria sendo feita. Termine ou desista dela antes.");
  const def = defPronta ?? await escolherDaLista(item, tipo);
  if (!def) return;
  const actor = item.parent;
  const forja = tipo === "modificacao" && bonusDeFerramentas(actor).forja;
  const pode = podeAdicionar(item, def, { mestre: gm, forja });
  if (!pode.ok) return ui.notifications.warn(pode.motivo);
  const p = pode.estado.perfil;
  const fazivel = ["modificacao", "encantamento"].includes(tipo);
  if (pode.extraForja) { const okF = await fvtt.DialogV2.confirm({ window: { title: "Forja dos Deuses" }, content: `<p>As 3 vagas de Modificação estão cheias. Com a Forja dos Deuses, esta Modificação (feita com ela) não conta no limite: o item passa a ter 4. Isso vale 1 vez por item.</p>`, rejectClose: false, modal: true }); if (!okF) return; }
  const lojaPadrao = p.arma || p.municao;
  const sai = pode.consome.map(uid => nomeDaEntrada(pode.estado.entradas.find(e => e.uid === uid))).filter(Boolean);
  const dt = dtMelhoria(tipo, pode.vaga);
  const custoTexto = fazivel ? `Fazendo: Ofício (${tipo === "modificacao" ? "Ferreiro" : "Encantador"}) + o atributo que você escolher, DT ${dt}, ${HORAS_MELHORIA[tipo]} h em 3 etapas, material = metade do preço da vaga.` : "";
  let fichaAtor = null;
  if (fazivel && actor) { const { estadoAtor } = await import("./mecanicas.mjs"); fichaAtor = estadoAtor(actor).ficha; }
  const content = `<p><strong>${escapar(def.nome)}</strong> (${TIPOS_MELHORIA[tipo].label}, ${pode.vaga}ª vaga)${sai.length ? `. Sai do item: <strong>${escapar(sai.join(", "))}</strong>` : ""}.</p>
    <p class="epm-dica">${escapar(def.custo ? `${def.beneficio}. Custo: ${def.custo}` : def.texto)}</p>
    ${campoEscolha(def, item, materialPronto)}
    ${def.pre?.feito ? `<p class="epm-dica">Feito exigido: ${escapar(def.pre.feito)}. Só funciona depois que o Mestre marcar o feito no item.</p>` : ""}
    ${p.lote ? `<p class="epm-dica">${["maldicao", "bencao"].includes(tipo) ? "Bênção e Maldição valem para 1 unidade: ela é separada da pilha." : `Vale para o lote (${p.municao ? "o pacote de munição" : `até ${LOTE_CONSUMIVEL} unidades`}); o preço é 1/5.`}</p>` : ""}
    ${custoTexto ? `<p class="epm-dica">${custoTexto}</p>${fichaAtor ? camposOficio(fichaAtor, tipo === "modificacao" ? "Ferreiro" : "Encantador") : ""}` : ""}
    ${["modificacao", "encantamento"].includes(tipo) ? `<label class="epm-check"><input type="checkbox" name="loja" ${lojaPadrao ? "checked" : ""}> Comprar numa loja de armas (+50%)</label>` : ""}`;
  const botoes = [];
  if (fazivel && actor) botoes.push({ action: "fazer", label: "Fazer", icon: "fa-solid fa-hammer", default: true });
  if (["modificacao", "encantamento"].includes(tipo) && actor && !pode.extraForja) botoes.push({ action: "comprar", label: "Comprar", icon: "fa-solid fa-coins" });
  if (gm) botoes.push({ action: "mestre", label: "Adicionar (Mestre)", icon: "fa-solid fa-crown", default: !botoes.length });
  botoes.push({ action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" });
  const form = await fvtt.DialogV2.wait({
    window: { title: `Adicionar ${TIPOS_MELHORIA[tipo].label}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true, position: { width: 520 }, content,
    buttons: botoes.map(b => ({ ...b, callback: b.action === "cancelar" ? undefined : (ev, btn) => { const el = btn.form?.elements ?? {}; return { acao: b.action, escolha: el.escolha?.value ?? "", material: el.material?.value ?? "", loja: !!el.loja?.checked, oficio: el.oficio?.value ?? "", atributo: el.atributo?.value ?? "" }; } }))
  });
  if (!form || typeof form !== "object" || !form.acao) return;
  form.escolha = String(form.escolha ?? ""); form.material = form.material ?? ""; form.loja = !!form.loja;
  const acao = form.acao;
  if (materialPronto && !MATERIAIS[form.material]) form.material = materialPronto;
  if (def.id === "material-especial" && !MATERIAIS[form.material]) return ui.notifications.warn("Escolha o material.");
  if (def.escolha && def.escolha !== "material" && !form.escolha.trim() && def.escolha !== "texto") return ui.notifications.warn("Faça a escolha da melhoria.");
  if (acao === "fazer") return comecarFazer(item, def, pode, form);
  if (acao === "comprar") return comprar(item, def, pode, form);
  return aplicarMelhoria(item, def, pode, { ...form, origem: "mestre" });
}

/** Grava a melhoria no item (consome a exigida; separa 1 unidade ou o lote nos consumíveis). */
export async function aplicarMelhoria(item, def, pode, { escolha = "", material = "", origem = "" } = {}) {
  let alvo = item;
  const p = pode.estado.perfil;
  const qtd = num(item.system?.quantity, 1);
  const separar = p.lote && (["maldicao", "bencao"].includes(def.tipo) ? qtd > 1 : (!p.municao && qtd > LOTE_CONSUMIVEL));
  if (separar && item.parent) {
    const leva = ["maldicao", "bencao"].includes(def.tipo) ? 1 : LOTE_CONSUMIVEL;
    const copia = item.toObject();
    delete copia._id;
    copia.system.quantity = leva;
    const [novo] = await item.parent.createEmbeddedDocuments("Item", [copia]);
    await item.update({ "system.quantity": qtd - leva });
    alvo = novo;
  }
  const consumidas = pode.estado.entradas.filter(e => pode.consome.includes(e.uid));
  const up = {};
  for (const e of consumidas) up[`${P}.melhoriasDoItem.-=${e.uid}`] = null;
  // Bênção Caída: a bênção fica, selada (o efeito continua e a vaga não volta)
  if (def.pre?.bencao) {
    const b = pode.estado.entradas.find(e => e.tipo === "bencao" && !e.selada);
    if (b) up[`${P}.melhoriasDoItem.${b.uid}.selada`] = true;
  }
  up[`${P}.melhoriasDoItem.${foundry.utils.randomID()}`] = novaEntrada(def, { escolha, material, origem, consumiu: consumidas.map(e => ({ id: e.id, tipo: e.tipo, escolha: e.escolha })) });
  await alvo.update(up);
  const est = estadoMelhorias(alvo, { dados: alvo.parent?.flags?.[FLAG] });
  const titulo = est.titulos.length ? ` O item agora é ${est.titulos.join(" e ")}.` : "";
  await nota(alvo.parent, `<p><i class="fa-solid fa-gem" aria-hidden="true"></i> <strong>${escapar(alvo.name)}</strong> recebeu <strong>${escapar(def.nome)}</strong>${material ? ` (${escapar(MATERIAIS[material]?.nome ?? "")})` : ""}.${consumidas.length ? ` Saiu: ${escapar(consumidas.map(nomeDaEntrada).join(", "))}.` : ""}${titulo}</p>`);
  return alvo;
}

/** Preço total em PO para comprar (com material e lote). */
function precoCompra(def, pode, form) {
  const p = pode.estado.perfil;
  const precoMat = def.id === "material-especial" ? precoMaterialPO(form.material) * unidadesMaterial(p) : 0;
  return precoMelhoria(def, pode.vaga, { lojaArmas: form.loja, lote: p.lote, precoMaterial: precoMat });
}
const unidadesMaterial = p => (p.armadura === "pesada" || p.tipoEscudo === "pesado") ? MATERIAL_UNIDADES_PESADO : 1;

async function pagar(actor, po, motivo) {
  const cobre = Math.round(num(po) * COBRE_PO);
  if (!cobre) return true;
  const novas = pagarMoedas(actor.flags?.[FLAG]?.moedas ?? {}, cobre);
  if (!novas) { ui.notifications.warn(`Dinheiro insuficiente: ${motivo} custa ${formatarMoedas(cobre)}.`); return false; }
  await actor.update(Object.fromEntries(Object.entries(novas).map(([k, v]) => [`${P}.moedas.${k}`, v])));
  return true;
}

async function comprar(item, def, pode, form) {
  const actor = item.parent;
  const po = precoCompra(def, pode, form);
  const ok = await fvtt.DialogV2.confirm({ window: { title: "Comprar melhoria" }, content: `<p>Comprar <strong>${escapar(def.nome)}</strong> para ${escapar(item.name)} por <strong>${formatarMoedas(Math.round(po * COBRE_PO))}</strong>?</p>`, rejectClose: false, modal: true });
  if (!ok) return;
  if (!(await pagar(actor, po, def.nome))) return;
  const alvo = await aplicarMelhoria(item, def, pode, { ...form, origem: "comprada" });
  await nota(actor, `<p class="epm-dica">Pagou ${formatarMoedas(Math.round(po * COBRE_PO))} por ${escapar(def.nome)} (${escapar(alvo?.name ?? item.name)}).</p>`, "#C9A24E");
}

/* ---------------- Fazer em 3 etapas ---------------- */

async function comecarFazer(item, def, pode, form) {
  const p = pode.estado.perfil;
  const horas = HORAS_MELHORIA[def.tipo];
  const custo = custoFazerPO(def, pode.vaga, { lote: p.lote, precoMaterial: def.id === "material-especial" ? precoMaterialPO(form.material) * unidadesMaterial(p) : 0 });
  await item.update({ [`${P}.fazendoMelhoria`]: {
    id: def.id, tipo: def.tipo, escolha: form.escolha, material: form.material, vaga: pode.vaga, dt: dtMelhoria(def.tipo, pode.vaga),
    horasEtapa: horas / ETAPAS_MELHORIA, feitasEtapa: 0, acertos: 0, falhas: 0, custoEtapaPO: Math.round((custo / ETAPAS_MELHORIA) * 100) / 100, pagoPO: 0,
    etapaPaga: false, consome: pode.consome, extraForja: !!pode.extraForja, inicio: Date.now(), oficio: form.oficio ?? "", atributo: form.atributo || "inteligencia"
  } });
  ui.notifications.info(`${def.nome}: trabalho começado em ${item.name}. Trabalhe nas etapas pela seção Melhorias do item.`);
}

/** 2.6667 → "2 h 40 min". */
export function textoHoras(h) {
  const min = Math.round(num(h) * 60);
  const hh = Math.floor(min / 60), mm = min % 60;
  return hh && mm ? `${hh} h ${mm} min` : hh ? `${hh} h` : `${mm} min`;
}

/** Estado do trabalho para o editor. */
export function lerFazendo(item) {
  const fz = item?.flags?.[FLAG]?.fazendoMelhoria;
  if (!fz || typeof fz !== "object") return null;
  const def = melhoriaPorId(fz.id, fz.tipo);
  const horasEtapa = num(fz.horasEtapa);
  const feitas = Math.min(horasEtapa, num(fz.feitasEtapa));
  return {
    ...fz, nome: def?.nome ?? fz.id, def, etapa: int(fz.acertos) + 1, acertos: int(fz.acertos), horasEtapa, feitasEtapa: Math.round(feitas * 100) / 100,
    prontaParaTeste: feitas >= horasEtapa - 1e-6, pct: Math.round((int(fz.acertos) / ETAPAS_MELHORIA) * 100),
    horasTexto: `${textoHoras(feitas)} de ${textoHoras(horasEtapa)}`, custoEtapaTexto: `${num(fz.custoEtapaPO).toLocaleString("pt-BR")} PO`
  };
}

/** Trabalha na etapa: paga o 1/3 do material (uma vez por tentativa) e gasta horas do dia (o mesmo limite dos treinos). */
export async function trabalharMelhoria(item) {
  const actor = item.parent;
  const fz = lerFazendo(item);
  if (!fz || !actor) return;
  if (fz.prontaParaTeste) return testarEtapa(item);
  const { horasLivres } = await import("./mecanicas.mjs");
  const livres = horasLivres(actor);
  const falta = Math.round((fz.horasEtapa - fz.feitasEtapa) * 100) / 100;
  const maximo = Math.min(livres, falta);
  if (maximo <= 0) return ui.notifications.warn(`Sem horas livres hoje (treinos, criações e melhorias dividem as ${TREINO.horasDia} h do dia).`);
  const r = await fvtt.DialogV2.wait({
    window: { title: `${fz.nome}: etapa ${fz.etapa} de ${ETAPAS_MELHORIA}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>Faltam ${textoHoras(falta)} nesta etapa. Você tem ${livres} h livres hoje.</p>${fz.etapaPaga ? "" : `<p>O material desta etapa custa <strong>${fz.custoEtapaTexto}</strong> (pago agora).</p>`}
      <label class="epm-campo"><span>Horas</span><input type="number" name="horas" min="0.5" step="0.5" max="${maximo}" value="${maximo}"></label>`,
    buttons: [{ action: "ok", label: "Trabalhar", icon: "fa-solid fa-hammer", default: true, callback: (ev, b) => ({ horas: num(b.form.elements.horas.value) }) }, { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
  });
  if (!r || typeof r !== "object") return;
  const horas = Math.max(0, Math.min(maximo, r.horas));
  if (!horas) return;
  if (!fz.etapaPaga && !(await pagar(actor, fz.custoEtapaPO, `o material da etapa de ${fz.nome}`))) return;
  const feitas = Math.min(fz.horasEtapa, fz.feitasEtapa + horas);
  await item.update({ [`${P}.fazendoMelhoria.feitasEtapa`]: feitas, [`${P}.fazendoMelhoria.etapaPaga`]: true, [`${P}.fazendoMelhoria.pagoPO`]: num(fz.pagoPO) + (fz.etapaPaga ? 0 : num(fz.custoEtapaPO)) });
  await actor.update({ [`${P}.treinoDia.horas`]: TREINO.horasDia - livres + horas });
  const pronta = feitas >= fz.horasEtapa - 1e-6;
  await nota(actor, `<p><i class="fa-solid fa-hammer" aria-hidden="true"></i> ${escapar(actor.name)} trabalhou ${horas} h em <strong>${escapar(fz.nome)}</strong> (${escapar(item.name)}), etapa ${fz.etapa} de ${ETAPAS_MELHORIA}.${pronta ? " Pronta para o teste." : ""}</p>`, "#B9894B");
  if (pronta) return testarEtapa(item);
}

/** Teste da etapa na DT da vaga. 3 acertos = melhoria pronta. Falha: perde o tempo e o custo da etapa e repete. */
export async function testarEtapa(item) {
  const actor = item.parent;
  const fz = lerFazendo(item);
  if (!fz || !actor || !fz.prontaParaTeste) return;
  const roll = await rolarOficio(actor, fz, `${escapar(fz.nome)}: etapa ${fz.etapa} de ${ETAPAS_MELHORIA}`, fz.dt);
  if (roll.total < fz.dt) {
    await item.update({ [`${P}.fazendoMelhoria.feitasEtapa`]: 0, [`${P}.fazendoMelhoria.etapaPaga`]: false, [`${P}.fazendoMelhoria.falhas`]: int(fz.falhas) + 1 });
    return nota(actor, `<p><strong>${escapar(fz.nome)}</strong>: a etapa ${fz.etapa} falhou (${roll.total} contra DT ${fz.dt}). Perdeu o tempo e o material dela; repita a etapa. Os acertos anteriores ficam.</p>`, "#D2544A");
  }
  const acertos = fz.acertos + 1;
  if (acertos < ETAPAS_MELHORIA) {
    await item.update({ [`${P}.fazendoMelhoria.acertos`]: acertos, [`${P}.fazendoMelhoria.feitasEtapa`]: 0, [`${P}.fazendoMelhoria.etapaPaga`]: false });
    return nota(actor, `<p><strong>${escapar(fz.nome)}</strong>: etapa ${fz.etapa} feita (${roll.total} contra DT ${fz.dt}). ${acertos} de ${ETAPAS_MELHORIA} acertos.</p>`, "#6FBF73");
  }
  // Pronta: confere de novo as vagas (o item pode ter mudado no meio) e aplica
  await item.update({ [`${P}.-=fazendoMelhoria`]: null });
  const def = fz.def;
  const pode = podeAdicionar(item, def, { mestre: true, forja: !!fz.extraForja });
  if (!pode.ok) return nota(actor, `<p><strong>${escapar(fz.nome)}</strong> ficou pronta, mas não coube no item: ${escapar(pode.motivo)}</p>`, "#D2544A");
  if (pode.extraForja) await item.update({ [`${P}.modExtraForja`]: true });
  await aplicarMelhoria(item, def, pode, { escolha: fz.escolha, material: fz.material, origem: "feita" });
}

/**
 * Pular tempo: as horas andam pelas etapas; cada etapa cheia paga o material (ou sai de graça, se marcado) e faz o teste sozinha
 * com o Ofício e o atributo escolhidos ao começar. Devolve o texto do que aconteceu.
 */
export async function avancarMelhoriaComTempo(item, horas, { gratis = false } = {}) {
  const actor = item.parent;
  let resto = num(horas);
  const textos = [];
  for (let guarda = 0; guarda < 20 && resto > 1e-6; guarda++) {
    const fz = lerFazendo(item);
    if (!fz) break;
    if (!fz.etapaPaga && !gratis) {
      if (!(await pagar(actor, fz.custoEtapaPO, `o material da etapa de ${fz.nome}`))) { textos.push(`${fz.nome}: parou (sem dinheiro para o material)`); break; }
      await item.update({ [`${P}.fazendoMelhoria.etapaPaga`]: true, [`${P}.fazendoMelhoria.pagoPO`]: num(fz.pagoPO) + num(fz.custoEtapaPO) });
    } else if (!fz.etapaPaga) await item.update({ [`${P}.fazendoMelhoria.etapaPaga`]: true });
    const falta = fz.horasEtapa - fz.feitasEtapa;
    const usa = Math.min(falta, resto);
    resto -= usa;
    await item.update({ [`${P}.fazendoMelhoria.feitasEtapa`]: fz.feitasEtapa + usa });
    if (fz.feitasEtapa + usa < fz.horasEtapa - 1e-6) { textos.push(`${fz.nome}: etapa ${fz.etapa} em andamento`); break; }
    await testarEtapa(item);
  }
  return textos;
}

export async function desistirMelhoria(item) {
  const fz = lerFazendo(item);
  if (!fz) return;
  const ok = await fvtt.DialogV2.confirm({ window: { title: "Desistir da melhoria" }, content: `<p>Desistir de <strong>${escapar(fz.nome)}</strong>? O material já pago (${num(fz.pagoPO).toLocaleString("pt-BR")} PO) não volta.</p>`, rejectClose: false, modal: true });
  if (ok) return item.update({ [`${P}.-=fazendoMelhoria`]: null });
}

/* ---------------- Outras ações ---------------- */

export async function removerMelhoria(item, uid) {
  const est = estadoMelhorias(item);
  const e = est.entradas.find(x => x.uid === uid);
  if (!e) return;
  if (["maldicao", "bencao"].includes(e.tipo) && !mestre()) return ui.notifications.warn("Só o Mestre tira Maldições e Bênçãos.");
  if (e.selada) return ui.notifications.warn("A Bênção selada pela Bênção Caída não sai do item.");
  const ok = await fvtt.DialogV2.confirm({ window: { title: "Tirar melhoria" }, content: `<p>Tirar <strong>${escapar(e.nome)}</strong> de ${escapar(item.name)}? A vaga fica livre; o que foi pago não volta.</p>`, rejectClose: false, modal: true });
  if (!ok) return;
  return item.update({ [`${P}.melhoriasDoItem.-=${uid}`]: null });
}

/** Trocar de material: preço do novo − metade do anterior (mínimo 0), sem pagar a vaga, com o teste da vaga. */
export async function trocarMaterial(item, uid) {
  const actor = item.parent;
  const est = estadoMelhorias(item);
  const e = est.entradas.find(x => x.uid === uid);
  if (!e || e.id !== "material-especial") return;
  const p = est.perfil;
  const col = p.arma || p.municao ? "arma" : p.protecao ? "protecao" : "outros";
  const uni = unidadesMaterial(p);
  const vaga = Math.max(1, est.entradas.filter(x => x.tipo === "modificacao").findIndex(x => x.uid === uid) + 1);
  const dt = dtMelhoria("modificacao", vaga);
  const ops = Object.entries(MATERIAIS).filter(([id, m]) => m[col] && id !== e.material)
    .map(([id, m]) => `<option value="${id}">${escapar(m.nome)}: ${precoTrocaMaterial(precoMaterialPO(id) * uni, precoMaterialPO(e.material) * uni).toLocaleString("pt-BR")} PO</option>`).join("");
  const form = await fvtt.DialogV2.wait({
    window: { title: `Trocar material: ${item.name}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>Agora: <strong>${escapar(MATERIAIS[e.material]?.nome ?? "—")}</strong>. O preço é o do novo menos metade do anterior; a vaga não é paga de novo. Teste da vaga: Forja, DT ${dt}.</p>
      <label class="epm-campo"><span>Novo material</span><select name="material">${ops}</select></label>
      <label class="epm-campo"><span>Escolha do material</span><input type="text" name="escolha" value="${escapar(e.escolha)}" placeholder="só para Osso de Dragão"></label>
      ${actor ? camposOficio((await import("./mecanicas.mjs")).estadoAtor(actor).ficha, "Ferreiro") : ""}
      <p class="epm-dica">Melhorias que pedem o material antigo param de funcionar.</p>`,
    buttons: [
      { action: "ok", label: "Trocar", icon: "fa-solid fa-right-left", default: true, callback: (ev, b) => ({ acao: "ok", material: b.form.elements.material.value, escolha: b.form.elements.escolha.value, oficio: b.form.elements.oficio?.value ?? "", atributo: b.form.elements.atributo?.value ?? "inteligencia" }) },
      ...(mestre() ? [{ action: "mestre", label: "Trocar sem teste (Mestre)", icon: "fa-solid fa-crown", callback: (ev, b) => ({ acao: "mestre", material: b.form.elements.material.value, escolha: b.form.elements.escolha.value }) }] : []),
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!form || typeof form !== "object" || !MATERIAIS[form.material]) return;
  if (form.acao === "ok" && actor) {
    const po = precoTrocaMaterial(precoMaterialPO(form.material) * uni, precoMaterialPO(e.material) * uni);
    if (!(await pagar(actor, po, "a troca de material"))) return;
    const roll = await rolarOficio(actor, form, `Trocar material de ${escapar(item.name)}`, dt);
    if (roll.total < dt) return nota(actor, `<p>A troca de material de <strong>${escapar(item.name)}</strong> falhou (${roll.total} contra DT ${dt}). O pagamento foi perdido.</p>`, "#D2544A");
  }
  await item.update({ [`${P}.melhoriasDoItem.${uid}.material`]: form.material, [`${P}.melhoriasDoItem.${uid}.escolha`]: form.escolha ?? "" });
  return nota(actor, `<p><strong>${escapar(item.name)}</strong> agora é de ${escapar(MATERIAIS[form.material]?.nome ?? "")}.</p>`);
}

/** Feito exigido por uma melhoria: só o Mestre marca. */
export async function marcarFeito(item, id, valor) {
  if (!mestre()) return ui.notifications.warn("Só o Mestre marca os feitos.");
  return item.update({ [`${P}.feitosMelhoria.${id}`]: !!valor });
}

/** Imbuir o Pergaminho de Encantamento: identificar (Conhecimentos Mágicos DT 35) e imbuir (Arcanismo DT 70). Libera a 3ª vaga. */
export async function imbuirPergaminho(item) {
  const actor = item.parent;
  if (!actor) return ui.notifications.warn("O item precisa estar numa ficha.");
  if (item.flags?.[FLAG]?.pergaminhoEncantamento) return;
  const perg = actor.items.find(i => i.flags?.[FLAG]?.catalogo === PERGAMINHO.catalogo || /pergaminho de encantamento/i.test(i.name));
  if (!perg && !mestre()) return ui.notifications.warn("Precisa de um Pergaminho de Encantamento no inventário.");
  const { estadoAtor, formulaD20 } = await import("./mecanicas.mjs");
  const { ficha } = estadoAtor(actor);
  for (const [etapa, cfg] of [["Identificar", PERGAMINHO.identificar], ["Imbuir", PERGAMINHO.imbuir]]) {
    const per = ficha.periciaPorId?.[cfg.pericia];
    const roll = await new Roll(`${formulaD20()} + ${int(per?.testeTotal ?? per?.total)}`).evaluate();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<span class="epm-flavor"><strong>Pergaminho de Encantamento: ${etapa}</strong> (${escapar(per?.nome ?? cfg.pericia)}, DT ${cfg.dt})</span>` });
    if (roll.total < cfg.dt) return nota(actor, `<p>${etapa} o Pergaminho de Encantamento falhou (${roll.total} contra DT ${cfg.dt}). ${etapa === "Imbuir" ? "Pode tentar de novo." : ""}</p>`, "#D2544A");
  }
  if (perg) { const q = num(perg.system?.quantity, 1); if (q > 1) await perg.update({ "system.quantity": q - 1 }); else await perg.delete(); }
  await item.update({ [`${P}.pergaminhoEncantamento`]: true });
  return nota(actor, `<p><strong>${escapar(item.name)}</strong> recebeu o Pergaminho de Encantamento: agora tem 3 vagas de Encantamento.</p>`, "#6FBF73");
}

export { lerMelhorias };
