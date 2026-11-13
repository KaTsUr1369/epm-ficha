/**
 * Novas mecânicas: treinos, criação e conserto.
 *   5. Treinamentos: treino em grupo (+25% nas horas, afinidade +2) e treinador NPC com preço por hora.
 *   7. Criação de itens: sub-aba Criação em Treinamentos, com as mesmas 8 h por dia dos treinos.
 *   8. Durabilidade: 0 a 100 em armas, armaduras e ferramentas; quebra em 0; conserto com ferramenta.
 */
import { FLAG, MOEDAS, TREINO, CATEGORIAS_ITEM } from "./config.mjs";
import { num, int, pagarMoedas, formatarMoedas, valorEmCobre } from "./data.mjs";
import { fvtt, escapar } from "./helpers.mjs";
import { afinidadeEntre } from "./cooperacao.mjs";

const P = `flags.${FLAG}`;
const M = () => import("./mecanicas.mjs");
const falar = a => ChatMessage.getSpeaker({ actor: a });
const nota = (ator, html, cor = "#A47DDB") => ChatMessage.create({ speaker: falar(ator), content: `<div class="epm-chat epm-chat-nota epm-chat-treino" style="--epm-cor-cartao:${cor}">${html}</div>` });

/* -------------------------------------------- */
/*  8. Durabilidade                             */
/* -------------------------------------------- */

export const TIPOS_DURAVEIS = ["weapon", "equipment", "tool"];
export const PERDA_CRITICO = 10;
export const CONSERTO = { dt: 12, minutos: 10, recupera: 50 };

/** Durabilidade do item (100 se nunca mudou) ou null se o tipo não tem durabilidade. */
export function durabilidadeDe(item) {
  if (!TIPOS_DURAVEIS.includes(item?.type)) return null;
  const v = item.flags?.[FLAG]?.durabilidade;
  return v === undefined || v === null || v === "" ? 100 : Math.max(0, Math.min(100, int(v)));
}
export const quebrado = item => durabilidadeDe(item) === 0;

/** Tira durabilidade (devolve o texto do que aconteceu ou ""). */
export async function gastarDurabilidade(item, quanto = PERDA_CRITICO, motivo = "") {
  const atual = durabilidadeDe(item);
  if (atual === null || atual === 0 || !item.isOwner) return "";
  const novo = Math.max(0, atual - quanto);
  await item.update({ [`${P}.durabilidade`]: novo });
  return novo === 0 ? `${item.name} quebrou${motivo ? ` (${motivo})` : ""}: perde os efeitos até ser consertado.` : `${item.name}: durabilidade ${atual} → ${novo}${motivo ? ` (${motivo})` : ""}.`;
}

/** Armadura que sofre o crítico: a equipada com mais CA (escudos só se não houver armadura). */
export function armaduraEquipada(ator) {
  const eq = (ator?.items ?? []).filter(i => i.type === "equipment" && i.system?.equipped && durabilidadeDe(i) !== null && !quebrado(i));
  const eEscudo = i => /escudo/i.test(`${i.name} ${i.flags?.[FLAG]?.tipoArma ?? ""}`) || i.system?.type?.value === "shield";
  const lista = eq.filter(i => !eEscudo(i)).length ? eq.filter(i => !eEscudo(i)) : eq;
  return lista.sort((a, b) => int(b.flags?.[FLAG]?.armadura) - int(a.flags?.[FLAG]?.armadura))[0] ?? null;
}

/** Conserto: ferramenta no inventário, 1 hora do dia, teste de perícia DT 12 (o jogador escolhe), +25. */
export async function consertarItem(ator, item) {
  const atual = durabilidadeDe(item);
  if (atual === null) return;
  if (atual >= 100) return ui.notifications.info(`${item.name} está inteiro.`);
  const ferramentas = ator.items.filter(i => i.type === "tool" && i.id !== item.id && !quebrado(i));
  if (!ferramentas.length) return ui.notifications.warn(`Para consertar precisa de um item da categoria ${CATEGORIAS_ITEM.find(c => c.id === "ferramentas")?.label ?? "Ferramentas"} no inventário.`);
  const { estadoAtor, rolarTeste } = await M();
  const { ficha } = estadoAtor(ator);
  // Teste de Ofício (com a especialidade que o personagem tiver); sem Ofício na ficha, escolhe outra perícia
  const oficios = ficha.pericias.filter(p => /^oficio/.test(p.id) || /^of[ií]cio/i.test(p.nome));
  const pericias = oficios.length ? oficios : ficha.pericias;
  const sugestao = pericias.slice().sort((a, b) => b.testeTotal - a.testeTotal)[0]?.id;
  const r = await fvtt.DialogV2.wait({
    window: { title: `Consertar: ${item.name}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>Durabilidade ${atual} de 100. Leva <strong>${CONSERTO.minutos} minutos</strong> e pede um teste de <strong>Ofício DT ${CONSERTO.dt}</strong>. O sucesso recupera ${CONSERTO.recupera}.</p>
      <div class="epm-dialogo-linha">
        <label class="epm-campo"><span>Ferramenta</span><select name="ferramenta">${ferramentas.map(f => `<option value="${f.id}">${escapar(f.name)}</option>`).join("")}</select></label>
        <label class="epm-campo"><span>${oficios.length ? "Ofício" : "Perícia (sem Ofício na ficha)"}</span><select name="pericia">${pericias.map(p => `<option value="${escapar(p.id)}" ${p.id === sugestao ? "selected" : ""}>${escapar(p.nome)} (${p.testeTotal >= 0 ? "+" : ""}${p.testeTotal})</option>`).join("")}</select></label>
      </div>`,
    buttons: [
      { action: "ok", label: "Consertar", icon: "fa-solid fa-screwdriver-wrench", default: true, callback: (ev, b) => ({ pericia: b.form.elements.pericia.value, ferramenta: b.form.elements.ferramenta.value }) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object") return;
  const per = ficha.periciaPorId[r.pericia];
  const roll = await rolarTeste(ator, {
    rotulo: `Consertar ${item.name} (${per?.nome ?? "perícia"} DT ${CONSERTO.dt})`, bonus: per?.testeTotal ?? 0,
    desvantagens: [...ficha.desvantagens.testes, ...(per?.desvantagem ?? [])], vantagens: [...ficha.vantagens.testes, ...(per?.vantagem ?? [])], penalidades: per?.testeFontes ?? []
  });
  if (!roll) return;
  const ferr = ator.items.get(r.ferramenta)?.name ?? "ferramenta";
  if (roll.total >= CONSERTO.dt) {
    const novo = Math.min(100, atual + CONSERTO.recupera);
    await item.update({ [`${P}.durabilidade`]: novo });
    return nota(ator, `<p><i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> consertou <strong>${escapar(item.name)}</strong> com ${escapar(ferr)} (${CONSERTO.minutos} min): durabilidade ${atual} → <strong>${novo}</strong>.</p>`, "#7A8C99");
  }
  return nota(ator, `<p><i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> tentou consertar <strong>${escapar(item.name)}</strong> (${CONSERTO.minutos} min), mas não conseguiu (${roll.total} contra DT ${CONSERTO.dt}).</p>`, "#7A8C99");
}

/* -------------------------------------------- */
/*  5. Treinos: grupo e treinador NPC           */
/* -------------------------------------------- */

export const AFINIDADE_TREINO_GRUPO = 2;
export const BONUS_TREINO_GRUPO = 1.25;

/** Parceiros de treino: relações ligadas com afinidade +2 ou mais (o menor valor das duas fichas). */
export function parceirosTreino(ator) {
  const out = [];
  for (const r of Object.values(ator?.flags?.[FLAG]?.relacoes ?? {})) {
    if (!r?.uuid) continue;
    let outro = null;
    try { outro = fromUuidSync(r.uuid); } catch { outro = null; }
    if (outro?.documentName !== "Actor" || outro.uuid === ator.uuid) continue;
    const af = afinidadeEntre(ator, outro);
    if (af !== null && af >= AFINIDADE_TREINO_GRUPO) out.push({ uuid: outro.uuid, nome: outro.name, afinidade: af });
  }
  return out.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Preço do treinador por hora, em cobre (0 = sem treinador pago). */
export function precoTreinoCobre(t) {
  const moeda = MOEDAS.find(m => m.id === t?.precoMoeda) ?? MOEDAS.find(m => m.id === "po");
  return Math.max(0, Math.round(num(t?.precoHora) * moeda.valor));
}
export function textoPreco(t) {
  const c = precoTreinoCobre(t);
  return c ? `${formatarMoedas(c)} por hora` : "";
}

/** Paga o treinador: devolve { updates, texto } ou null se não tiver dinheiro. */
export function pagarTreinador(dados, t, horas) {
  const custo = precoTreinoCobre(t) * Math.max(0, num(horas));
  if (!custo) return { updates: {}, texto: "" };
  const novas = pagarMoedas(dados.moedas, custo);
  if (!novas) return null;
  return { updates: Object.fromEntries(Object.entries(novas).map(([k, v]) => [`${P}.moedas.${k}`, v])), texto: `pagou ${formatarMoedas(custo)} ao treinador`, custo };
}

/** Botão do cartão de treino em grupo: o parceiro registra as mesmas horas num treino dele, com +25%. */
export async function registrarTreinoEmGrupo(parceiro, horas, deUuid) {
  if (!parceiro?.isOwner) return ui.notifications.warn("Esse personagem não é seu.");
  const emAndamento = Object.entries(parceiro.flags?.[FLAG]?.treinamentos ?? {}).filter(([, t]) => t?.estado === "andamento");
  if (!emAndamento.length) return ui.notifications.warn(`${parceiro.name} não tem treinamento em andamento.`);
  let id = emAndamento[0][0];
  if (emAndamento.length > 1) {
    const r = await fvtt.DialogV2.wait({
      window: { title: "Treino em grupo" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
      content: `<label class="epm-campo"><span>Em qual treinamento</span><select name="treino">${emAndamento.map(([tid, t]) => `<option value="${tid}">${escapar(t.nome || "Treinamento")}</option>`).join("")}</select></label>`,
      buttons: [{ action: "ok", label: "Registrar", icon: "fa-solid fa-dumbbell", default: true, callback: (ev, b) => ({ treino: b.form.elements.treino.value }) }, { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
    });
    if (!r || typeof r !== "object") return;
    id = r.treino;
  }
  const { treinarHoras } = await M();
  return treinarHoras(parceiro, id, horas, { grupo: deUuid ? [deUuid] : [] });
}

/* -------------------------------------------- */
/*  7. Criação de itens                         */
/* -------------------------------------------- */

export const TIPOS_CRIACAO = { weapon: "Arma", equipment: "Armadura ou escudo", consumable: "Consumível", tool: "Ferramenta", loot: "Loot" };

/** Projeto de criação com padrões. */
export function lerCriacao(id, c = {}) {
  const materiais = Object.entries(c.materiais ?? {}).filter(([, m]) => m)
    .map(([mid, m]) => ({ id: mid, itemId: m.itemId ?? "", nome: m.nome ?? "Material", img: m.img ?? "", qtd: Math.max(1, int(m.qtd, 1)), criado: num(m.criado) }))
    .sort((a, b) => a.criado - b.criado);
  const horas = Math.max(1, int(c.horas, 6));
  const feitas = Math.max(0, Math.min(horas, num(c.horasFeitas)));
  const estado = ["andamento", "pronto", "concluido"].includes(c.estado) ? c.estado : (feitas >= horas ? "pronto" : "andamento");
  return {
    id, nome: c.nome || "Projeto sem nome", nomeBruto: c.nome ?? "", tipo: TIPOS_CRIACAO[c.tipo] ? c.tipo : "loot", efeitos: c.efeitos ?? "",
    modelo: c.modelo?.uuid ? { uuid: c.modelo.uuid, nome: c.modelo.nome ?? "", img: c.modelo.img ?? "" } : null,
    materiais, horas, feitas, pct: Math.round((feitas / horas) * 100), pericia: c.pericia ?? "", dt: Math.max(1, int(c.dt, 15)), estado, criado: num(c.criado), requisitos: c.requisitos ?? ""
  };
}

/** Quanto de cada material a falha gasta (metade, arredondando para cima). */
export const metadeMaterial = qtd => Math.ceil(Math.max(0, int(qtd)) / 2);

export async function novaCriacao(ator) {
  const oficio = Object.keys(ator.flags?.[FLAG]?.pericias ?? {}).find(id => /^oficio/.test(id)) ?? "";
  return ator.update({ [`${P}.criacoes.${foundry.utils.randomID()}`]: { nome: "", tipo: "loot", horas: 6, horasFeitas: 0, dt: 15, pericia: oficio, requisitos: "", estado: "andamento", materiais: {}, criado: Date.now() } });
}

/** Item arrastado para o projeto: vira o modelo ou um material. */
export async function soltarNaCriacao(ator, id, zona, item) {
  if (!item || !ator.flags?.[FLAG]?.criacoes?.[id]) return;
  if (zona === "modelo") {
    const tipo = TIPOS_CRIACAO[item.type] ? item.type : undefined;
    return ator.update({ [`${P}.criacoes.${id}.modelo`]: { uuid: item.uuid, nome: item.name, img: item.img }, ...(tipo ? { [`${P}.criacoes.${id}.tipo`]: tipo } : {}),
      ...(!ator.flags[FLAG].criacoes[id].nome ? { [`${P}.criacoes.${id}.nome`]: item.name } : {}) });
  }
  if (item.parent?.uuid !== ator.uuid) return ui.notifications.warn("Os materiais vêm do inventário deste personagem.");
  const ja = Object.entries(ator.flags[FLAG].criacoes[id].materiais ?? {}).find(([, m]) => m?.itemId === item.id);
  if (ja) return ator.update({ [`${P}.criacoes.${id}.materiais.${ja[0]}.qtd`]: int(ja[1].qtd, 1) + 1 });
  return ator.update({ [`${P}.criacoes.${id}.materiais.${foundry.utils.randomID()}`]: { itemId: item.id, nome: item.name, img: item.img, qtd: 1, criado: Date.now() } });
}

/** Trabalhar no projeto: horas do mesmo limite diário dos treinos. */
export async function trabalharCriacao(ator, id) {
  const bruto = ator.flags?.[FLAG]?.criacoes?.[id];
  if (!bruto) return;
  const c = lerCriacao(id, bruto);
  if (c.estado !== "andamento") return;
  const { horasLivres, estadoAtor } = await M();
  if (c.requisitos) {
    const av = avaliarRequisitos(c.requisitos, estadoAtor(ator).ficha, ator.flags[FLAG]);
    if (!av.ok && !game.user.isGM) return ui.notifications.warn(`Falta para criar ${c.nome}: ${av.faltas.join("; ")}.`);
  }
  const livres = horasLivres(ator);
  const maximo = Math.min(livres, Math.ceil(c.horas - c.feitas));
  if (maximo <= 0) return ui.notifications.warn("Sem horas livres hoje (treinos e criação dividem as 8 h do dia).");
  const r = await fvtt.DialogV2.wait({
    window: { title: `Criar: ${c.nome}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>Faltam ${Math.round((c.horas - c.feitas) * 10) / 10} h. Você tem ${livres} h livres hoje (treinos e criação dividem as ${TREINO.horasDia} h).</p>
      <label class="epm-campo"><span>Horas</span><input type="number" name="horas" min="1" max="${maximo}" value="${maximo}"></label>`,
    buttons: [{ action: "ok", label: "Trabalhar", icon: "fa-solid fa-hammer", default: true, callback: (ev, b) => ({ horas: num(b.form.elements.horas.value) }) }, { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
  });
  if (!r || typeof r !== "object") return;
  const horas = Math.max(0, Math.min(maximo, Math.round(r.horas)));
  if (!horas) return;
  const feitas = Math.min(c.horas, c.feitas + horas);
  const pronto = feitas >= c.horas;
  await ator.update({ [`${P}.criacoes.${id}.horasFeitas`]: feitas, [`${P}.criacoes.${id}.estado`]: pronto ? "pronto" : "andamento", [`${P}.treinoDia.horas`]: TREINO.horasDia - livres + horas });
  return nota(ator, `<p><i class="fa-solid fa-hammer" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> trabalhou ${horas} h em <strong>${escapar(c.nome)}</strong> (${feitas} de ${c.horas} h).${pronto ? " Pronto para o teste." : ""}</p>`, "#B9894B");
}

/** Materiais que faltam no inventário (nome e quanto falta). */
export function materiaisFaltando(ator, c) {
  return c.materiais.map(m => {
    const it = ator.items.get(m.itemId);
    const tem = it ? int(it.system?.quantity, 1) : 0;
    return { ...m, tem, falta: Math.max(0, m.qtd - tem) };
  }).filter(m => m.falta > 0);
}

async function gastarMateriais(ator, c, fracao) {
  const upd = [];
  const apagar = [];
  const textos = [];
  for (const m of c.materiais) {
    const it = ator.items.get(m.itemId);
    if (!it) continue;
    const gasto = fracao === "metade" ? metadeMaterial(m.qtd) : m.qtd;
    if (!gasto) continue;
    const resta = int(it.system?.quantity, 1) - gasto;
    if (resta <= 0) apagar.push(it.id); else upd.push({ _id: it.id, "system.quantity": resta });
    textos.push(`${gasto} ${it.name}`);
  }
  if (upd.length) await ator.updateEmbeddedDocuments("Item", upd);
  if (apagar.length) await ator.deleteEmbeddedDocuments("Item", apagar);
  return textos;
}

/** Teste da perícia no fim: sucesso cria o item e gasta os materiais; falha gasta metade e pede metade das horas. */
export async function testarCriacao(ator, id) {
  const bruto = ator.flags?.[FLAG]?.criacoes?.[id];
  if (!bruto) return;
  const c = lerCriacao(id, bruto);
  if (c.estado !== "pronto") return ui.notifications.warn("Termine as horas do projeto antes do teste.");
  const faltando = materiaisFaltando(ator, c);
  if (faltando.length) return ui.notifications.warn(`Faltam materiais: ${faltando.map(m => `${m.falta} ${m.nome}`).join(", ")}.`);
  const { estadoAtor, rolarTeste } = await M();
  const { ficha } = estadoAtor(ator);
  const per = ficha.periciaPorId[c.pericia];
  if (!per) return ui.notifications.warn("Escolha a perícia do projeto.");
  const roll = await rolarTeste(ator, {
    rotulo: `Criar ${c.nome} (${per.nome} DT ${c.dt})`, bonus: per.testeTotal ?? 0,
    desvantagens: [...ficha.desvantagens.testes, ...(per.desvantagem ?? [])], vantagens: [...ficha.vantagens.testes, ...(per.vantagem ?? [])], penalidades: per.testeFontes ?? []
  });
  if (!roll) return;
  if (roll.total >= c.dt) {
    let dadosItem = null;
    if (c.modelo?.uuid) {
      try { const mod = await fromUuid(c.modelo.uuid); dadosItem = mod?.toObject?.() ?? null; } catch { dadosItem = null; }
    }
    if (dadosItem) {
      delete dadosItem._id;
      dadosItem.name = c.nomeBruto || dadosItem.name;
      foundry.utils.setProperty(dadosItem, "system.quantity", 1);
      if (c.efeitos) foundry.utils.setProperty(dadosItem, "system.description.value", `${foundry.utils.getProperty(dadosItem, "system.description.value") ?? ""}<p>${escapar(c.efeitos)}</p>`);
    } else {
      dadosItem = { name: c.nome, type: c.tipo, img: "icons/svg/item-bag.svg", system: { quantity: 1, description: { value: c.efeitos ? `<p>${escapar(c.efeitos)}</p>` : "" } } };
    }
    foundry.utils.setProperty(dadosItem, `flags.${FLAG}.criadoPor`, ator.name);
    const gastos = await gastarMateriais(ator, c, "tudo");
    await ator.createEmbeddedDocuments("Item", [dadosItem]);
    await ator.update({ [`${P}.criacoes.${id}.estado`]: "concluido" });
    return nota(ator, `<p><i class="fa-solid fa-hammer" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> criou <strong>${escapar(dadosItem.name)}</strong> (${roll.total} contra DT ${c.dt}).${gastos.length ? ` Gastou: ${escapar(gastos.join(", "))}.` : ""}</p>`, "#B9894B");
  }
  const gastos = await gastarMateriais(ator, c, "metade");
  const novasFeitas = Math.max(0, c.horas - Math.ceil(c.horas / 2));
  await ator.update({ [`${P}.criacoes.${id}.estado`]: "andamento", [`${P}.criacoes.${id}.horasFeitas`]: novasFeitas });
  return nota(ator, `<p><i class="fa-solid fa-hammer" aria-hidden="true"></i> <strong>${escapar(ator.name)}</strong> falhou em <strong>${escapar(c.nome)}</strong> (${roll.total} contra DT ${c.dt}).${gastos.length ? ` Perdeu metade dos materiais: ${escapar(gastos.join(", "))}.` : ""} Faltam ${c.horas - novasFeitas} h de trabalho.</p>`, "#B9894B");
}

export { valorEmCobre };

/* -------------------------------------------- */
/*  5. Requisitos automáticos                   */
/* -------------------------------------------- */

const norm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Confere o texto de requisitos ("12 de Destreza ou Força, 8 Núcleo, Atletismo 5, Treinamento: Corredor").
 * Atributo: valor total ≥ número. Perícia: total da perícia ≥ número. Treinamento: outro treinamento concluído.
 * Treinador/tutor e o que não der para ler ficam para o jogador ou o Mestre confirmar.
 * Devolve { ok, cumpridos[], faltas[], manuais[] }.
 */
export function avaliarRequisitos(texto, ficha, dados, ignorarId = "") {
  const out = { cumpridos: [], faltas: [], manuais: [] };
  const partes = String(texto ?? "").split(/[,;\n]|\s\/\s|\s+e\s+(?=\d|treinamento)/i).map(t => t.trim()).filter(Boolean);
  const atributos = Object.values(ficha?.atributos ?? {});
  const pericias = ficha?.pericias ?? [];
  const treinos = Object.entries(dados?.treinamentos ?? {}).filter(([id, t]) => t && id !== ignorarId);
  for (const parte of partes) {
    const n = norm(parte);
    if (/treinador|tutor|mestre/.test(n) && !/\d/.test(n)) { out.manuais.push(parte); continue; }
    const treinoNome = n.replace(/^(treinamento|treino)\s*:?\s*/, "");
    const treino = treinos.find(([, t]) => t.nome && norm(t.nome) === treinoNome);
    if (treino && (/^(treinamento|treino)/.test(n) || !/\d/.test(n))) {
      (treino[1].estado === "concluido" ? out.cumpridos : out.faltas).push(treino[1].estado === "concluido" ? `Treinamento ${treino[1].nome}` : `concluir o treinamento ${treino[1].nome}`);
      continue;
    }
    const num = Number(n.match(/(\d+)/)?.[1]);
    if (!Number.isFinite(num)) { out.manuais.push(parte); continue; }
    if (/nivel de tecnologia|tecnologia nivel/.test(n)) {
      const tem = Number(ficha?.extras?.tecnologia) || 1;
      if (tem >= num) out.cumpridos.push(`nível de tecnologia ${tem} (precisa ${num})`);
      else out.faltas.push(`nível de tecnologia ${num} (tem ${tem})`);
      continue;
    }
    const attrs = atributos.filter(a => new RegExp(`\\b(${norm(a.label)}|${norm(a.abrev)})\\b`).test(n));
    if (attrs.length) {
      const bom = attrs.find(a => a.total >= num);
      if (bom) out.cumpridos.push(`${bom.label} ${bom.total} (precisa ${num})`);
      else out.faltas.push(`${attrs.map(a => a.label).join(" ou ")} ${num} (tem ${attrs.map(a => a.total).join("/")})`);
      continue;
    }
    const pers = pericias.filter(p => n.includes(norm(p.nome)));
    if (pers.length) {
      const bom = pers.find(p => p.total >= num);
      if (bom) out.cumpridos.push(`${bom.nome} ${bom.total} (precisa ${num})`);
      else out.faltas.push(`${pers.map(p => p.nome).join(" ou ")} ${num} (tem ${pers.map(p => p.total).join("/")})`);
      continue;
    }
    out.manuais.push(parte);
  }
  return { ...out, ok: !out.faltas.length };
}
