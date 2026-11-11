/**
 * Produção: forja, alquimia, rituais mágicos e encantamento.
 * Receitas (profissões, dificuldade, ingredientes, ferramentas, resultado), produção no relógio do mundo
 * (4 h por profissão, com Simple Calendar se houver) e um teste por profissão no fim.
 * As contas puras ficam no começo (testáveis fora do Foundry).
 */
import { FLAG, PROFISSOES, DIFICULDADES_PRODUCAO, PRODUCAO, ATRIBUTOS } from "./config.mjs";
import { num, int, novoId, normalizarTexto } from "./data.mjs";
import { escapar } from "./helpers.mjs";
import { agora, somarTempo, textoDuracao } from "./projetos.mjs";

const P = `flags.${FLAG}`;
const TIPOS_INVENTARIO = new Set(["weapon", "equipment", "consumable", "tool", "loot", "container", "backpack"]);

/* ---------------- Contas puras ---------------- */

/** Receita com padrões. */
export function lerReceita(id, r = {}) {
  const profissoes = [...new Set((Array.isArray(r.profissoes) ? r.profissoes : Object.keys(r.profissoes ?? {}).filter(k => r.profissoes[k]))
    .filter(p => PROFISSOES[p]))];
  const dificuldade = DIFICULDADES_PRODUCAO[r.dificuldade] ? r.dificuldade : "baixa";
  const ingredientes = Object.entries(r.ingredientes ?? {}).filter(([, i]) => i)
    .map(([iid, i]) => ({ id: iid, nome: String(i.nome ?? "").trim(), qtd: Math.max(1, int(i.qtd, 1)), criado: num(i.criado) }))
    .sort((a, b) => a.criado - b.criado);
  return {
    id, nome: r.nome || "Receita sem nome", profissoes, dificuldade, cd: DIFICULDADES_PRODUCAO[dificuldade].cd,
    ingredientes, ferramentas: r.ferramentas ?? "", notas: r.notas ?? "",
    resultado: { nome: r.resultado?.nome ?? "", uuid: r.resultado?.uuid ?? "", img: r.resultado?.img ?? "", qtd: Math.max(1, int(r.resultado?.qtd, 1)) },
    horas: profissoes.length * PRODUCAO.horasPorProfissao, criado: num(r.criado)
  };
}

/** Perícia usada pela profissão na ficha: a primeira que existir (id ou nome); se não, Ofício. */
export function periciaDaProfissao(ficha, profId) {
  const prof = PROFISSOES[profId];
  const lista = ficha?.pericias ?? [];
  const achar = chave => lista.find(p => p.id === chave || normalizarTexto(p.nome) === normalizarTexto(chave));
  let per = null;
  for (const c of prof.pericias) { per = achar(c); if (per) break; }
  const reserva = !per;
  if (!per) per = achar("oficio");
  const atr = ficha?.atributos?.[prof.atributo];
  const valorPer = per?.bonusProprio ?? 0;
  const valorAtr = int(atr?.total);
  return {
    periciaId: per?.id ?? "", periciaNome: per?.nome ?? "Ofício", valorPericia: valorPer,
    atributo: prof.atributo, atributoNome: ATRIBUTOS[prof.atributo]?.label ?? prof.atributo, valorAtributo: valorAtr,
    bonus: valorPer + valorAtr, reserva, pedida: prof.pericias[0]
  };
}

/** Itens do inventário somados por nome (sem acento/caixa). */
export function estoquePorNome(itens = []) {
  const m = new Map();
  for (const i of itens) {
    if (!TIPOS_INVENTARIO.has(i.type)) continue;
    const k = normalizarTexto(i.name);
    m.set(k, (m.get(k) ?? 0) + Math.max(0, num(i.system?.quantity ?? 1)));
  }
  return m;
}

/** Ingredientes da receita contra o inventário. */
export function conferirIngredientes(receita, itens = []) {
  const estoque = estoquePorNome(itens);
  const lista = receita.ingredientes.filter(i => i.nome).map(i => {
    const tem = estoque.get(normalizarTexto(i.nome)) ?? 0;
    return { ...i, tem, ok: tem >= i.qtd };
  });
  return { lista, ok: lista.every(i => i.ok), faltam: lista.filter(i => !i.ok) };
}

/** Resultado dos testes: sucesso se todos passam; falha crítica se algum d20 natural for 1. */
export function avaliarTestes(testes = []) {
  const critica = testes.some(t => t.natural === 1);
  const sucesso = testes.length > 0 && testes.every(t => t.total >= t.cd) && !critica;
  return { sucesso, critica, falhou: !sucesso };
}

/** Estado de uma produção no momento `t`. */
export function estadoProducao(p, t) {
  const inicio = num(p.inicio);
  const fim = num(p.fim);
  if (p.estado === "concluida" || p.estado === "falhou") return { fase: p.estado, pct: 100, falta: 0 };
  const pronto = t >= fim;
  const pct = fim > inicio ? Math.max(0, Math.min(100, Math.round(((t - inicio) / (fim - inicio)) * 100))) : 100;
  return { fase: pronto ? "pronta" : "andamento", pct: pronto ? 100 : pct, falta: Math.max(0, fim - t) };
}

/** Em que profissão e etapa a produção está (o tempo é dividido igualmente entre profissões e etapas). */
export function etapaAtual(profissoes, pct) {
  if (!profissoes.length) return null;
  const porProf = 100 / profissoes.length;
  const idx = Math.min(profissoes.length - 1, Math.floor(pct / porProf));
  const prof = PROFISSOES[profissoes[idx]];
  const dentro = (pct - idx * porProf) / porProf;
  const e = Math.min(prof.etapas.length - 1, Math.floor(dentro * prof.etapas.length));
  return { profissao: profissoes[idx], profLabel: prof.label, etapa: e, etapaNome: prof.etapas[e][0], etapaTexto: prof.etapas[e][1] };
}

/* ---------------- Contexto da aba ---------------- */

export function contextoProducao({ dados, ficha, itens = [], edicao = false, editavel = false }) {
  const t = agora();
  const receitas = Object.entries(dados.receitas ?? {}).filter(([, r]) => r && typeof r === "object")
    .map(([id, r]) => lerReceita(id, r)).sort((a, b) => a.criado - b.criado);
  const ctx = {
    receitas: receitas.map(r => {
      const ing = conferirIngredientes(r, itens);
      return {
        ...r, ing: ing.lista, ingOk: ing.ok, semProfissao: !r.profissoes.length,
        difLabel: DIFICULDADES_PRODUCAO[r.dificuldade].label, horasTexto: `${r.horas} h`, testes: r.profissoes.length,
        profs: r.profissoes.map(p => {
          const per = periciaDaProfissao(ficha, p);
          return { id: p, ...PROFISSOES[p], ...per, etapasLista: PROFISSOES[p].etapas.map(([nome, texto]) => ({ nome, texto })) };
        }),
        opcoesProf: Object.entries(PROFISSOES).map(([id, x]) => ({ id, label: x.label, icone: x.icone, marcada: r.profissoes.includes(id) })),
        opcoesDif: Object.entries(DIFICULDADES_PRODUCAO).map(([id, x]) => ({ id, label: `${x.label} (CD ${x.cd})`, selected: id === r.dificuldade })),
        podeProduzir: editavel && r.profissoes.length > 0
      };
    }),
    producoes: Object.entries(dados.producoes ?? {}).filter(([, p]) => p && typeof p === "object")
      .map(([id, p]) => {
        const e = estadoProducao(p, t);
        const profs = Array.isArray(p.profissoes) ? p.profissoes.filter(x => PROFISSOES[x]) : [];
        const et = e.fase === "andamento" ? etapaAtual(profs, e.pct) : null;
        return {
          id, nome: p.nome || "Produção", profsTexto: profs.map(x => PROFISSOES[x].label).join(" + "), cd: int(p.cd), ...e,
          andamento: e.fase === "andamento", pronta: e.fase === "pronta", concluida: e.fase === "concluida", falhou: e.fase === "falhou",
          critica: !!p.critica, faltaTexto: e.falta ? textoDuracao(e.falta) : "", etapa: et, testes: Array.isArray(p.testes) ? p.testes : [],
          resultadoNome: p.resultadoNome ?? "", criado: num(p.criado)
        };
      })
      .sort((a, b) => (a.andamento || a.pronta ? 0 : 1) - (b.andamento || b.pronta ? 0 : 1) || b.criado - a.criado),
    profissoesRef: Object.entries(PROFISSOES).map(([id, x]) => ({ id, ...x, etapasLista: x.etapas.map(([nome, texto]) => ({ nome, texto })), per: periciaDaProfissao(ficha, id) })),
    combinacoes: [
      ["Forja + Alquimia", 8, 2], ["Forja + Encantamento", 8, 2], ["Alquimia + Ritual", 8, 2], ["Forja + Alquimia + Encantamento", 12, 3]
    ].map(([nome, h, n]) => ({ nome, horas: h, testes: n })),
    dificuldades: Object.values(DIFICULDADES_PRODUCAO),
    edicao, editavel
  };
  ctx.vazio = !ctx.receitas.length;
  ctx.temProducoes = ctx.producoes.length > 0;
  return ctx;
}

/* ---------------- Ações (Foundry) ---------------- */

async function nota(actor, html, cor = "#C98A4B") {
  return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="epm-chat epm-chat-nota" style="--cor: ${cor}">${html}</div>` });
}

export function novaReceita() {
  return { nome: "Nova receita", profissoes: ["forja"], dificuldade: "baixa", ingredientes: {}, ferramentas: "", notas: "", resultado: { nome: "", uuid: "", img: "", qtd: 1 }, criado: Date.now() };
}

/** Liga/desliga uma profissão na receita. */
export async function alternarProfissao(actor, receitaId, prof) {
  const r = lerReceita(receitaId, actor.flags?.[FLAG]?.receitas?.[receitaId]);
  const lista = r.profissoes.includes(prof) ? r.profissoes.filter(p => p !== prof) : [...r.profissoes, prof];
  return actor.update({ [`${P}.receitas.${receitaId}.profissoes`]: lista });
}

/** Escolhe o item resultado (do inventário ou do mundo). */
export async function escolherResultado(actor, receitaId) {
  const doAtor = actor.items.filter(i => TIPOS_INVENTARIO.has(i.type));
  const doMundo = game.items.filter(i => TIPOS_INVENTARIO.has(i.type));
  const op = (lista, rot) => lista.length ? `<optgroup label="${rot}">${lista.map(i => `<option value="${i.uuid}">${escapar(i.name)}</option>`).join("")}</optgroup>` : "";
  const uuid = await foundry.applications.api.DialogV2.wait({
    window: { title: "Item que a receita produz" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p class="epm-dica">No sucesso, uma cópia deste item entra no inventário. Sem item, a ficha cria um item simples com o nome do resultado.</p>
      <label class="epm-campo"><span>Item</span><select name="uuid"><option value="">— nenhum —</option>${op(doAtor, "Inventário")}${op(doMundo, "Itens do mundo")}</select></label>`,
    buttons: [
      { action: "ok", label: "Usar", icon: "fa-solid fa-link", default: true, callback: (ev, b) => b.form?.elements?.uuid?.value ?? "" },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (uuid === null || uuid === "cancelar" || uuid === undefined) return;
  const item = uuid ? await fromUuid(uuid) : null;
  return actor.update({
    [`${P}.receitas.${receitaId}.resultado.uuid`]: item?.uuid ?? "",
    [`${P}.receitas.${receitaId}.resultado.img`]: item?.img ?? "",
    ...(item ? { [`${P}.receitas.${receitaId}.resultado.nome`]: item.name } : {})
  });
}

/** Começa a produção: confere e gasta os ingredientes e marca o fim no relógio do mundo. */
export async function produzir(actor, receitaId) {
  const dados = actor.flags?.[FLAG] ?? {};
  const r = lerReceita(receitaId, dados.receitas?.[receitaId]);
  if (!r.profissoes.length) return ui.notifications.warn("Marque ao menos uma profissão na receita.");
  const itens = actor.items.contents ?? [...actor.items];
  const ing = conferirIngredientes(r, itens);
  const falta = ing.faltam.map(i => `${i.nome} (tem ${i.tem} de ${i.qtd})`).join(", ");
  const perguntas = `
    <p><strong>${escapar(r.nome)}</strong>: ${r.profissoes.map(p => PROFISSOES[p].label).join(" + ")} · CD ${r.cd} · ${r.horas} h · ${r.profissoes.length} teste(s) no fim.</p>
    ${ing.lista.length ? `<p>Ingredientes (saem do inventário agora): ${ing.lista.map(i => `${escapar(i.nome)} ×${i.qtd}`).join(", ")}.</p>` : `<p class="epm-dica">A receita não lista ingredientes.</p>`}
    ${falta ? `<p class="epm-alerta-texto">Faltam: ${escapar(falta)}.</p>` : ""}
    ${r.ferramentas ? `<label class="epm-check"><input type="checkbox" name="ferramentas" checked> Tenho as ferramentas: ${escapar(r.ferramentas)}</label>` : ""}
    <label class="epm-check"><input type="checkbox" name="receita" checked> Conheço a receita</label>`;
  const ok = await foundry.applications.api.DialogV2.wait({
    window: { title: "Começar a produção" }, classes: ["epm-dialogo"], rejectClose: false, modal: true, content: perguntas,
    buttons: [
      { action: "ok", label: falta ? "Produzir mesmo assim (Mestre)" : "Começar", icon: "fa-solid fa-fire", default: true,
        callback: (ev, b) => ({ ferramentas: b.form?.elements?.ferramentas ? b.form.elements.ferramentas.checked : true, receita: b.form?.elements?.receita?.checked }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!ok || typeof ok !== "object") return;
  if (!ok.receita || !ok.ferramentas) return ui.notifications.warn("É preciso conhecer a receita e ter as ferramentas adequadas.");
  if (falta && !game.user.isGM) return ui.notifications.warn(`Faltam ingredientes: ${falta}.`);
  // Gasta os ingredientes
  for (const i of ing.lista) {
    let resta = Math.min(i.qtd, i.tem);
    for (const it of itens.filter(x => TIPOS_INVENTARIO.has(x.type) && normalizarTexto(x.name) === normalizarTexto(i.nome))) {
      if (resta <= 0) break;
      const q = Math.max(0, num(it.system?.quantity ?? 1));
      const usa = Math.min(q, resta);
      resta -= usa;
      if (q - usa <= 0) await it.delete(); else await it.update({ "system.quantity": q - usa });
    }
  }
  const t = agora();
  const id = novoId();
  await actor.update({
    [`${P}.producoes.${id}`]: {
      receita: receitaId, nome: r.nome, profissoes: r.profissoes, cd: r.cd, inicio: t, fim: somarTempo(t, { horas: r.horas }),
      estado: "andamento", resultadoNome: r.resultado.nome || r.nome, criado: Date.now()
    }
  });
  await limparHistorico(actor);
  return nota(actor, `<p><strong>Produção iniciada:</strong> ${escapar(r.nome)} (${r.profissoes.map(p => PROFISSOES[p].label).join(" + ")}). Fica pronta em ${r.horas} h; os testes são feitos no fim.</p>${ing.lista.length ? `<p class="epm-dica">Gastou: ${ing.lista.map(i => `${escapar(i.nome)} ×${i.qtd}`).join(", ")}.</p>` : ""}`);
}

/** Pula o tempo da produção (timeskip ou o Mestre decidiu). */
export async function terminarAgora(actor, id) {
  return actor.update({ [`${P}.producoes.${id}.fim`]: agora() });
}

/** Testes no fim: um por profissão (1d20 + perícia + atributo contra a CD). */
export async function testarProducao(actor, id) {
  const dados = actor.flags?.[FLAG] ?? {};
  const p = dados.producoes?.[id];
  if (!p) return;
  if (estadoProducao(p, agora()).fase !== "pronta") return ui.notifications.warn("A produção ainda não terminou.");
  const { estadoAtor, formulaD20 } = await import("./mecanicas.mjs");
  const { ficha } = estadoAtor(actor);
  const testes = [];
  for (const prof of p.profissoes ?? []) {
    const per = periciaDaProfissao(ficha, prof);
    const roll = await new Roll(`${formulaD20()} + ${per.valorPericia} + ${per.valorAtributo}`).evaluate();
    const natural = roll.dice?.[0]?.results?.find(x => x.active !== false)?.result ?? roll.dice?.[0]?.total ?? 0;
    testes.push({ prof, label: PROFISSOES[prof].label, total: roll.total, natural, cd: int(p.cd), passou: roll.total >= int(p.cd) && natural !== 1,
      formula: `${per.periciaNome} ${per.valorPericia >= 0 ? "+" : ""}${per.valorPericia}, ${per.atributoNome} ${per.valorAtributo >= 0 ? "+" : ""}${per.valorAtributo}` });
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<span class="epm-flavor"><strong>${escapar(p.nome)}: ${PROFISSOES[prof].label}</strong> (CD ${int(p.cd)}; ${escapar(per.periciaNome)} + ${escapar(per.atributoNome)})</span>` });
  }
  const r = avaliarTestes(testes);
  const updates = { [`${P}.producoes.${id}.estado`]: r.sucesso ? "concluida" : "falhou", [`${P}.producoes.${id}.testes`]: testes, [`${P}.producoes.${id}.critica`]: r.critica };
  await actor.update(updates);
  if (r.sucesso) {
    const receita = lerReceita(p.receita, dados.receitas?.[p.receita] ?? { nome: p.nome });
    const criado = await criarResultado(actor, receita, p);
    return nota(actor, `<p><strong>${escapar(p.nome)}: produção concluída!</strong> ${escapar(criado)} entrou no inventário.</p>${(p.profissoes ?? []).includes("forja") ? `<p class="epm-dica">Forja: +${PROFISSOES.forja.estrutura} Pontos de Estrutura, além das propriedades da receita.</p>` : ""}`, "#6FBF73");
  }
  if (r.critica) {
    const acidente = await new Roll("1d2").evaluate();
    const texto = acidente.total === 1 ? "Acidente durante o processo (o Mestre define o efeito)." : "Saiu um produto defeituoso (o Mestre define o defeito).";
    return nota(actor, `<p><strong>${escapar(p.nome)}: falha crítica.</strong> Os materiais foram perdidos. ${texto}</p>`, "#D2544A");
  }
  return nota(actor, `<p><strong>${escapar(p.nome)}: falhou.</strong> Os materiais foram consumidos e a produção se perdeu.</p>`, "#D2544A");
}

async function criarResultado(actor, receita, p) {
  const qtd = receita.resultado.qtd;
  let dadosItem = null;
  if (receita.resultado.uuid) {
    try { const base = await fromUuid(receita.resultado.uuid); if (base) dadosItem = base.toObject(); } catch { /* segue */ }
  }
  if (!dadosItem) dadosItem = { name: receita.resultado.nome || receita.nome, type: "loot", img: receita.resultado.img || "icons/svg/item-bag.svg", system: {} };
  delete dadosItem._id;
  dadosItem.system = { ...(dadosItem.system ?? {}), quantity: qtd };
  dadosItem.flags = { ...(dadosItem.flags ?? {}), [FLAG]: { ...(dadosItem.flags?.[FLAG] ?? {}), produzidoPor: actor.name, receita: receita.nome } };
  if ((p.profissoes ?? []).includes("forja")) {
    dadosItem.flags[FLAG].pontosEstrutura = int(dadosItem.flags[FLAG].pontosEstrutura) + PROFISSOES.forja.estrutura;
  }
  await actor.createEmbeddedDocuments("Item", [dadosItem]);
  return `${dadosItem.name}${qtd > 1 ? ` ×${qtd}` : ""}`;
}

/** Guarda só as últimas produções terminadas. */
async function limparHistorico(actor) {
  const lista = Object.entries(actor.flags?.[FLAG]?.producoes ?? {}).filter(([, p]) => p && (p.estado === "concluida" || p.estado === "falhou"))
    .sort(([, a], [, b]) => num(b.criado) - num(a.criado));
  const sobra = lista.slice(PRODUCAO.historico);
  if (sobra.length) await actor.update(Object.fromEntries(sobra.map(([id]) => [`${P}.producoes.-=${id}`, null])));
}
