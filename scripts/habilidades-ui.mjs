/**
 * Criador de habilidades, magias e rituais (0.9.0), projetos na sub-aba Criação dos Treinamentos
 * e a Habilidade Única Inicial (questionário, lado do Mestre, criador por peso, estágios e Ressonância).
 * As contas ficam em habilidades-sistema.mjs (puras).
 */
import { FLAG } from "./config.mjs";
import { int, formaPadrao, novoId } from "./data.mjs";
import { escapar } from "./helpers.mjs";
import * as S from "./habilidades-sistema.mjs";
import { HABILIDADES_EXEMPLO } from "./habilidades-exemplos.mjs";

const P = `flags.${FLAG}`;
const fvtt = () => foundry.applications.api;
const M = () => import("./mecanicas.mjs");

/* ------------------------------------------------------------ */
/*  Dados da ficha                                              */
/* ------------------------------------------------------------ */

const arquetiposDe = dados => [dados?.arquetipo, dados?.arquetipo2].map(a => String(a ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase())
  .map(a => a.includes("combat") ? "combatente" : a.includes("conjur") ? "conjurador" : a.includes("artif") ? "artifice" : "").filter(Boolean);

/** Nível total da ficha (os dois arquétipos). */
export function nivelTotalDe(dados = {}) {
  const n1 = Math.max(1, int(dados.nivel, 1));
  const n2 = String(dados.arquetipo2 ?? "").trim() ? Math.max(0, int(dados.nivel2)) : 0;
  return n1 + n2;
}

/** Poderes da ficha no formato das contas de limite. */
function poderesDe(actor) {
  return (actor.items?.contents ?? [...(actor.items ?? [])]).filter(i => i.type === "feat" || i.type === "spell").map(i => {
    const f = i.flags?.[FLAG] ?? {};
    return { raridade: f.raridade ?? "comum", foraDoLimite: !!f.foraDoLimite, hui: !!f.hui };
  });
}

/* ------------------------------------------------------------ */
/*  Item a partir da receita                                    */
/* ------------------------------------------------------------ */

const ACAO_MOD = { acaoBonus: "bonus", acaoMovimento: "movimento", acaoLivre: "livre" };
const USO_RESTR = { porCena: "combate", porDia: "dia", porSessao: "sessao" };
/** Raridade da ficha (RARIDADES_PODER) para as raridades só da HUI. */
const raridadeFicha = r => (r === "transcendida" || r === "transcendidaRessonante" ? "unica" : r);

/** Forma (técnica) do item, com o custo, a ação, o uso e os números da raridade. */
export function formaDaTecnica(t, i, { categoria = "habilidade", natureza = "fisica", numeros = null, custoRaridade = null } = {}) {
  const tt = { ...t, raridade: custoRaridade ?? t.raridade };
  const c = S.contaTecnica(tt, { categoria, numeros });
  const forma = formaPadrao(i, t.nome || `Técnica ${i + 1}`);
  const modo = S.MODOS[t.modo] ? t.modo : "utilidade";
  forma.acao = Object.keys(t.mods ?? {}).map(k => ACAO_MOD[k]).find(Boolean) ?? S.MODOS[modo].acao;
  const recurso = S.recursoDe(natureza, categoria);
  if (modo !== "passiva" && recurso !== "po" && c.custo) forma.custo = { recurso, valor: c.custo };
  if (c.sustentada && recurso !== "po") forma.porTurno = { recurso, valor: c.sustentadaPorTurno };
  const freq = Object.keys(t.restricoes ?? {}).map(k => USO_RESTR[k]).find(Boolean);
  if (freq) forma.uso = freq;
  if (modo === "disparo" || modo === "explosao") forma.dano = { formula: c.potencia ? S.RARIDADES_HAB[c.numeros].proprio.replace(/\s/g, "") : "", tipo: "" };
  if (modo === "explosao") forma.teste = { tipo: "resistencia", pericia: "reflexos", nd: "" };
  const detalhes = [
    `${S.MODOS[modo].label} ${c.label}${c.numeros !== c.raridade ? ` (números ${S.RARIDADES_HAB[c.numeros].label})` : ""}`,
    c.efeitoBase,
    `Orçamento ${c.gasto} de ${c.total}`,
    recurso === "po" ? `Materiais: ${c.custo} PO` : "",
    c.cdBonus ? `CD +${c.cdBonus} da raridade` : ""
  ].filter(Boolean).join(" · ");
  forma.efeito = `${t.efeito ? `<p>${escapar(t.efeito)}</p>` : ""}<p class="epm-dica">${escapar(detalhes)}</p>`;
  forma.tecnica = { raridade: t.raridade, modo, peso: t.peso ?? "" };
  return forma;
}

/** Dados do item (feat/spell) da habilidade criada. `hui` = { estagio, ressonante, final }. */
export function dadosItemDaReceita(h, { hui = null } = {}) {
  const categoria = S.CATEGORIAS[h.categoria] ? h.categoria : "habilidade";
  const natureza = categoria === "magia" ? "mistica" : (S.NATUREZAS[h.natureza] ? h.natureza : "fisica");
  const tecnicas = (h.tecnicas ?? []).map(t => {
    if (!hui) return t;
    const r = S.raridadeHui(t.peso, hui.estagio, hui);
    return { ...t, raridade: r.custo, _numeros: r.numeros };
  });
  const formas = {};
  tecnicas.forEach((t, i) => { formas[novoId()] = formaDaTecnica(t, i, { categoria: categoria === "unicaInicial" ? "habilidade" : categoria, natureza, numeros: t._numeros ?? null }); });
  const raridade = raridadeFicha(S.maiorRaridade(tecnicas.map(t => t._numeros ?? t.raridade)));
  const passiva = tecnicas.length > 0 && tecnicas.every(t => t.modo === "passiva");
  const receita = { ...h, categoria, natureza, tecnicas: (h.tecnicas ?? []).map(t => ({ ...t })) };
  const descricao = [h.descricao ? `<p>${escapar(h.descricao)}</p>` : "", h.tema ? `<p><strong>Tema:</strong> ${escapar(h.tema)}</p>` : "",
    `<p class="epm-dica">${escapar(hui ? `Única Inicial · Estágio ${S.estagio(hui.estagio).romano}` : `${S.CATEGORIAS[categoria].label} ${S.RARIDADES_HAB[raridade]?.label ?? ""} · ${S.NATUREZAS[natureza].label}`)} · ${tecnicas.length} técnica(s).</p>`].join("");
  const eMagia = categoria === "magia";
  return {
    name: h.nome || (eMagia ? "Nova magia" : "Nova habilidade"), type: eMagia ? "spell" : "feat",
    img: eMagia ? "icons/svg/lightning.svg" : hui ? "icons/svg/sun.svg" : categoria === "ritual" ? "icons/svg/book.svg" : "icons/svg/upgrade.svg",
    system: { description: { value: descricao }, ...(eMagia ? { level: S.RARIDADES_HAB[raridade]?.circulo ?? 0 } : {}) },
    flags: { [FLAG]: {
      raridade, passiva, tipoHab: h.tipo ?? "", tema: h.tema ?? "", origem: hui ? "unicaInicial" : categoria === "ritual" ? "ritual" : "criada",
      foraDoLimite: !!hui, hui: !!hui, receita, formas, usos: { valor: 0, max: 0, recarga: "nenhuma" }
    } }
  };
}

/* ------------------------------------------------------------ */
/*  Criador (diálogo)                                           */
/* ------------------------------------------------------------ */

const opc = (lista, atual) => lista.map(([v, l]) => `<option value="${escapar(v)}" ${String(v) === String(atual) ? "selected" : ""}>${escapar(l)}</option>`).join("");

function htmlTecnica(t, i, { hui, categoria }) {
  const rarOpcoes = hui ? opc(Object.entries(S.PESOS_HUI).map(([id, p]) => [id, `${p.label} · ${p.peso}`]), t.peso || "regular")
    : opc(S.RARIDADES_CRIAVEIS.map(r => [r, S.RARIDADES_HAB[r].label]), t.raridade || "comum");
  const mods = S.MODIFICADORES.map(m => {
    const v = int(t.mods?.[m.id] === true ? 1 : t.mods?.[m.id]);
    return m.max ? `<label class="epm-criador-mod" title="Até ${m.max}"><input type="number" min="0" max="${m.max}" data-mod="${m.id}" value="${v}"> ${escapar(m.nome)} <em>(${m.custo})</em>${m.min ? ` <small>${S.RARIDADES_HAB[m.min].label}+</small>` : ""}</label>`
      : `<label class="epm-criador-mod"><input type="checkbox" data-mod="${m.id}" ${v ? "checked" : ""}> ${escapar(m.nome)} <em>(${m.custo})</em>${m.min ? ` <small>${S.RARIDADES_HAB[m.min].label}+</small>` : ""}</label>`;
  }).join("");
  const restr = S.RESTRICOES.map(r => `<label class="epm-criador-mod"><input type="checkbox" data-restr="${r.id}" ${t.restricoes?.[r.id] ? "checked" : ""}> ${escapar(r.nome)} <em>(+${r.valor})</em></label>`).join("");
  return `<article class="epm-criador-tecnica" data-i="${i}">
    <header><strong>Técnica ${i + 1}</strong><span class="epm-criador-conta" data-conta="${i}"></span><button type="button" class="epm-icone-botao perigo" data-remover="${i}" title="Tirar a técnica"><i class="fa-solid fa-trash"></i></button></header>
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Nome</span><input type="text" data-campo="nome" value="${escapar(t.nome ?? "")}"></label>
      <label class="epm-campo"><span>${hui ? "Peso" : "Raridade"}</span><select data-campo="${hui ? "peso" : "raridade"}" data-recriar>${rarOpcoes}</select></label>
      <label class="epm-campo"><span>Modo</span><select data-campo="modo">${opc(Object.entries(S.MODOS).map(([id, m]) => [id, m.label]), t.modo || "golpe")}</select></label>
      <label class="epm-campo" title="Vazio = o custo calculado. Outro valor precisa da aprovação do Mestre."><span>Custo proposto</span><input type="number" min="0" data-campo="custoProposto" value="${t.custoProposto ?? ""}" placeholder="calculado"></label>
    </div>
    <label class="epm-campo"><span>Efeito (texto da técnica)</span><textarea data-campo="efeito" rows="2">${escapar(t.efeito ?? "")}</textarea></label>
    <p class="epm-dica" data-base="${i}"></p>
    <details><summary>Modificadores (gastam Orçamento)</summary><div class="epm-criador-mods">${mods}</div></details>
    <details><summary>Restrições (devolvem Orçamento, até metade)</summary><div class="epm-criador-mods">${restr}</div></details>
  </article>`;
}

function lerTecnicas(raiz) {
  return [...raiz.querySelectorAll(".epm-criador-tecnica")].map(el => {
    const t = { mods: {}, restricoes: {} };
    for (const c of el.querySelectorAll("[data-campo]")) t[c.dataset.campo] = c.value;
    for (const m of el.querySelectorAll("[data-mod]")) { const v = m.type === "checkbox" ? (m.checked ? 1 : 0) : int(m.value); if (v) t.mods[m.dataset.mod] = v; }
    for (const r of el.querySelectorAll("[data-restr]")) if (r.checked) t.restricoes[r.dataset.restr] = 1;
    if (t.custoProposto === "") delete t.custoProposto;
    return t;
  });
}

function lerCabecalho(raiz) {
  const v = n => raiz.querySelector(`[name="${n}"]`)?.value ?? "";
  return { categoria: v("categoria"), natureza: v("natureza"), nome: v("nome").trim(), tipo: v("tipo").trim(), tema: v("tema").trim(), descricao: v("descricao").trim() };
}

/**
 * Abre o criador. opções: { categoria, receita, modo: "criar"|"evoluir"|"novaTecnica"|"remodelar"|"aprender"|"hui", item, hui: { estagio, ressonante, final }, unicas }.
 * Devolve { receita, conta } ou null.
 */
export async function abrirCriador(actor, { categoria = "habilidade", receita = null, modo = "criar", item = null, hui = null, unicas = [] } = {}) {
  const dados = actor?.flags?.[FLAG] ?? {};
  const arquetipos = arquetiposDe(dados);
  const eHui = modo === "hui";
  const base = receita ? foundry.utils.deepClone(receita) : { categoria: eHui ? "unicaInicial" : categoria, natureza: categoria === "magia" ? "mistica" : "fisica", tecnicas: [{ nome: "", raridade: "comum", modo: categoria === "magia" ? "disparo" : "golpe", peso: "regular" }] };
  if (eHui) base.categoria = "unicaInicial";
  const antes = modo === "evoluir" && receita ? foundry.utils.deepClone(receita) : null;
  const estagioHui = hui?.estagio ?? 1;
  const limites = S.contarLimites(actor ? poderesDe(actor) : []);
  const ph = int(dados.pontos?.ph);
  const exemplos = HABILIDADES_EXEMPLO.filter(e => eHui || e.categoria === base.categoria || modo === "aprender");
  const titulo = { criar: `Criar ${S.CATEGORIAS[base.categoria]?.label.toLowerCase() ?? "habilidade"}`, evoluir: "Evoluir", novaTecnica: "Nova técnica", remodelar: "Remodelar", aprender: "Aprender", hui: "Habilidade Única Inicial" }[modo] ?? "Criar";
  const content = `<div class="epm-criador" data-modo="${modo}">
    ${eHui ? `<p class="epm-dica">Modo Única Inicial: cada técnica escolhe o peso; a raridade sai do peso, do estágio (${escapar(S.estagio(estagioHui).romano)} · ${escapar(S.estagio(estagioHui).nome)}) e da Ressonância. Sem PH, horas nem teste.</p><p class="epm-criador-peso" data-peso></p>`
      : `<div class="epm-dialogo-linha">
      ${modo === "criar" || modo === "aprender" ? `<label class="epm-campo"><span>Partir de um exemplo</span><select name="exemplo"><option value="">—</option>${opc(exemplos.map((e, i) => [String(HABILIDADES_EXEMPLO.indexOf(e)), `${e.nome} (${S.CATEGORIAS[e.categoria].label} ${S.RARIDADES_HAB[S.maiorRaridade(e.tecnicas.map(t => t.raridade))].label})`]), "")}</select></label>` : ""}
      <label class="epm-campo"><span>Categoria</span><select name="categoria" data-recriar ${modo !== "criar" ? "disabled" : ""}>${opc([["habilidade", "Habilidade"], ["magia", "Magia"], ["ritual", "Ritual"]], base.categoria)}</select></label>
      <label class="epm-campo"><span>Natureza</span><select name="natureza">${opc(Object.entries(S.NATUREZAS).map(([id, x]) => [id, x.label]), base.natureza)}</select></label>
    </div>`}
    <div class="epm-dialogo-linha">
      <label class="epm-campo"><span>Nome</span><input type="text" name="nome" value="${escapar(base.nome ?? "")}"></label>
      <label class="epm-campo"><span>Tipo</span><input type="text" name="tipo" value="${escapar(base.tipo ?? "")}" placeholder="Ofensiva, Suporte…"></label>
      <label class="epm-campo"><span>Tema</span><input type="text" name="tema" value="${escapar(base.tema ?? "")}"></label>
    </div>
    ${eHui ? `<input type="hidden" name="categoria" value="unicaInicial"><label class="epm-campo"><span>Natureza</span><select name="natureza">${opc(Object.entries(S.NATUREZAS).map(([id, x]) => [id, x.label]), base.natureza)}</select></label>` : ""}
    <label class="epm-campo"><span>Descrição</span><textarea name="descricao" rows="2">${escapar(base.descricao ?? "")}</textarea></label>
    <div class="epm-criador-tecnicas" data-tecnicas></div>
    <button type="button" class="epm-botao" data-adicionar><i class="fa-solid fa-plus"></i> Técnica</button>
    <div class="epm-criador-resumo" data-resumo></div>
  </div>`;
  let estado = base;
  const r = await fvtt().DialogV2.wait({
    window: { title: titulo }, classes: ["epm-dialogo", "epm-dialogo-060", "epm-criador-dialogo"], position: { width: 760 }, rejectClose: false, modal: true, content,
    render: (ev, dlg) => {
      const raiz = dlg?.element ?? ev?.target?.element;
      if (!raiz) return;
      const caixa = raiz.querySelector("[data-tecnicas]");
      const resumo = raiz.querySelector("[data-resumo]");
      const ok = raiz.querySelector('button[data-action="ok"]');
      const desenhar = () => {
        const cab = lerCabecalho(raiz);
        caixa.innerHTML = estado.tecnicas.map((t, i) => htmlTecnica(t, i, { hui: eHui, categoria: cab.categoria })).join("");
        conferir();
      };
      const conferir = () => {
        const cab = lerCabecalho(raiz);
        estado = { ...estado, ...cab, tecnicas: lerTecnicas(raiz) };
        const erros = [], linhas = [];
        if (!cab.nome) erros.push("Dê um nome.");
        if (eHui) {
          const v = S.validarHui(estado.tecnicas, estagioHui);
          const pesoEl = raiz.querySelector("[data-peso]");
          if (pesoEl) { pesoEl.textContent = v.texto; pesoEl.classList.toggle("epm-aviso-erro", !v.ok); }
          erros.push(...v.erros);
          estado.tecnicas.forEach((t, i) => {
            const rr = S.raridadeHui(t.peso, estagioHui, hui ?? {});
            const c = S.contaTecnica({ ...t, raridade: rr.custo }, { numeros: rr.numeros });
            const el = raiz.querySelector(`[data-conta="${i}"]`);
            if (el) el.textContent = `${S.RARIDADES_HAB[rr.numeros].label}${rr.numeros !== rr.custo ? ` (custo ${S.RARIDADES_HAB[rr.custo].label})` : ""} · Orçamento ${c.gasto}/${c.total} · ${c.custo} ${S.recursoDe(cab.natureza).toUpperCase()}`;
            const b = raiz.querySelector(`[data-base="${i}"]`); if (b) b.textContent = c.efeitoBase;
            c.erros.forEach(e => erros.push(`${t.nome || `Técnica ${i + 1}`}: ${e}`));
          });
          for (const a of S.repetidasHui(estado, unicas)) linhas.push(`⚠ ${a}`);
        } else {
          const conta = S.contaHabilidade(estado, { arquetipos, modo: modo === "remodelar" ? "criar" : modo, antes });
          erros.push(...conta.erros);
          estado.tecnicas.forEach((t, i) => {
            const c = conta.tecnicas[i];
            const el = raiz.querySelector(`[data-conta="${i}"]`);
            if (el && c) el.textContent = `${c.label} · Orçamento ${c.gasto}/${c.total}${c.restricao ? ` (restrições +${c.restricao})` : ""} · ${c.custo} ${S.recursoDe(cab.natureza, cab.categoria).toUpperCase()}${c.sustentada ? ` + ${c.sustentadaPorTurno}/turno` : ""}${c.custoProposto !== null ? " (proposto)" : ""}`;
            const b = raiz.querySelector(`[data-base="${i}"]`); if (b && c) b.textContent = c.efeitoBase;
          });
          const lim = limites[conta.raridade];
          const contaLimite = modo === "criar" || modo === "aprender";
          if (contaLimite && lim?.cheio) erros.push(`${conta.label}: limite de ${lim.limite} na ficha (habilidades e magias somadas).`);
          if (modo !== "remodelar") {
            linhas.push(`${S.CATEGORIAS[conta.categoria].label} ${conta.label}${conta.circulo !== null ? ` · ${conta.circulo ? `${conta.circulo}º círculo` : "Truque"}` : ""} · ${conta.ph} PH · ${conta.horas} h de treino · teste DT ${conta.dt}${conta.afinidade ? " (afinidade: −25% de horas, +2 no teste)" : ""}`);
            if (conta.ph > ph) linhas.push(`⚠ Você tem ${ph} PH: os PH só saem no sucesso do teste, mas precisam estar lá.`);
            if (conta.catalisador) linhas.push("Precisa de um Catalisador marcado pelo Mestre (Mítica e Única).");
            if (conta.despertar) linhas.push("Única: o Mestre aprova o nome e o conceito (Despertar).");
          } else linhas.push("Remodelar: 5 PT e um descanso longo; a raridade não muda.");
          if (estado.tecnicas.some(t => t.custoProposto !== undefined)) linhas.push("Custo proposto diferente do calculado: o Mestre aprova.");
        }
        resumo.innerHTML = `${linhas.map(l => `<p>${escapar(l)}</p>`).join("")}${erros.length ? `<ul class="epm-aviso-erro">${erros.map(e => `<li>${escapar(e)}</li>`).join("")}</ul>` : ""}`;
        if (ok) ok.disabled = erros.length > 0;
      };
      raiz.addEventListener("input", ev2 => { if (!ev2.target.closest("[data-recriar]") && ev2.target.name !== "exemplo") conferir(); });
      raiz.addEventListener("change", ev2 => {
        if (ev2.target.name === "exemplo") {
          const ex = HABILIDADES_EXEMPLO[int(ev2.target.value, -1)];
          if (ex) {
            estado = foundry.utils.deepClone(ex);
            for (const k of ["nome", "tipo", "tema", "descricao", "natureza", "categoria"]) { const el = raiz.querySelector(`[name="${k}"]`); if (el && estado[k] !== undefined) el.value = estado[k]; }
            desenhar();
          }
          return;
        }
        if (ev2.target.closest("[data-recriar]")) { estado = { ...estado, tecnicas: lerTecnicas(raiz) }; desenhar(); }
      });
      raiz.addEventListener("click", ev2 => {
        const rem = ev2.target.closest("[data-remover]");
        if (rem) { estado = { ...estado, tecnicas: lerTecnicas(raiz).filter((_, i) => i !== int(rem.dataset.remover)) }; desenhar(); }
        if (ev2.target.closest("[data-adicionar]")) { estado = { ...estado, tecnicas: [...lerTecnicas(raiz), { nome: "", raridade: "comum", modo: "utilidade", peso: "leve" }] }; desenhar(); }
      });
      desenhar();
    },
    buttons: [
      { action: "ok", label: eHui ? "Concluir a HUI" : modo === "remodelar" ? "Remodelar (5 PT)" : modo === "criar" || modo === "aprender" ? "Criar o projeto" : "Criar o projeto", icon: "fa-solid fa-check", default: true,
        callback: (ev, b) => { const raiz = b.form ?? b; return { ...estado, ...lerCabecalho(raiz), tecnicas: lerTecnicas(raiz) }; } },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || typeof r !== "object") return null;
  const receitaFinal = { ...r, categoria: eHui ? "unicaInicial" : r.categoria || base.categoria };
  const conta = eHui ? null : S.contaHabilidade(receitaFinal, { arquetipos, modo: modo === "remodelar" ? "criar" : modo, antes });
  return { receita: receitaFinal, conta };
}

/* ------------------------------------------------------------ */
/*  Projetos (sub-aba Criação dos Treinamentos)                 */
/* ------------------------------------------------------------ */

const hoje = () => {
  const t = Number(globalThis.game?.time?.worldTime) || 0;
  return `d${Math.floor(t / 86400)}`;
};

/** Botão "Criar" da aba: abre o criador e grava o projeto. */
export async function criarHabilidade(actor, categoria = "habilidade") {
  const r = await abrirCriador(actor, { categoria });
  if (!r) return null;
  return gravarProjeto(actor, r.receita, r.conta, { modo: "criar" });
}

export async function gravarProjeto(actor, receita, conta, { modo = "criar", itemId = "" } = {}) {
  const dados = actor.flags?.[FLAG] ?? {};
  const natureza = receita.categoria === "magia" ? "mistica" : receita.natureza;
  const pericia = periciaDoTeste(natureza, dados);
  const id = novoId();
  await actor.update({ [`${P}.habProjetos.${id}`]: {
    nome: receita.nome, modo, itemId, receita, ph: conta.ph, horas: conta.horas, horasFeitas: 0, dt: conta.dt, bonus: conta.bonusTeste, pericia,
    estado: conta.horas > 0 ? "andamento" : "pronto", ultimoTeste: "", criado: Date.now(),
    catalisador: conta.catalisador ? "pendente" : "", despertar: conta.despertar ? "pendente" : ""
  } });
  ui.notifications.info(`Projeto "${receita.nome}" na sub-aba Criação dos Treinamentos: ${conta.horas} h e teste DT ${conta.dt}.`);
  return id;
}

/** Perícia do teste de criação pela natureza (a maior que a ficha tiver). */
export function periciaDoTeste(natureza, dados = {}) {
  const ids = S.NATUREZAS[natureza]?.pericias ?? ["arcanismo"];
  const per = dados.pericias ?? {};
  const candidatos = Object.keys(per).filter(k => ids.some(i => k === i || k.startsWith(i)));
  return candidatos[0] ?? ids[0];
}

/** Projetos para a sub-aba Criação. */
export function contextoProjetosHab(dados = {}, { editavel = false } = {}) {
  const dia = hoje();
  return Object.entries(dados.habProjetos ?? {}).filter(([, p]) => p).map(([id, p]) => {
    const horas = Math.max(0, int(p.horas)), feitas = Math.min(horas, Math.max(0, Number(p.horasFeitas) || 0));
    const estado = ["andamento", "pronto", "concluido"].includes(p.estado) ? p.estado : feitas >= horas ? "pronto" : "andamento";
    const raridade = S.maiorRaridade((p.receita?.tecnicas ?? []).map(t => t.raridade));
    return {
      id, nome: p.nome || "Projeto", modo: p.modo ?? "criar", modoLabel: { criar: "Criar", aprender: "Aprender", evoluir: "Evoluir", novaTecnica: "Nova técnica" }[p.modo] ?? "Criar",
      categoria: S.CATEGORIAS[p.receita?.categoria]?.label ?? "Habilidade", raridadeLabel: S.RARIDADES_HAB[raridade]?.label ?? "", ph: int(p.ph), horas, feitas, pct: horas ? Math.round((feitas / horas) * 100) : 100,
      dt: int(p.dt, 10), estado, andamento: estado === "andamento", pronto: estado === "pronto", concluido: estado === "concluido",
      testouHoje: p.ultimoTeste === dia, catalisador: p.catalisador === "pendente", despertar: p.despertar === "pendente", editavel, criado: Number(p.criado) || 0
    };
  }).sort((a, b) => (a.concluido - b.concluido) || a.criado - b.criado);
}

export async function trabalharProjetoHab(actor, id) {
  const p = actor.flags?.[FLAG]?.habProjetos?.[id];
  if (!p || p.estado === "concluido") return;
  const { horasLivres } = await M();
  const { TREINO } = await import("./config.mjs");
  const livres = horasLivres(actor);
  const falta = Math.max(0, int(p.horas) - (Number(p.horasFeitas) || 0));
  const max = Math.min(livres, Math.ceil(falta));
  if (max <= 0) return ui.notifications.warn("Sem horas livres hoje (treinos e criação dividem as 8 h do dia).");
  const r = await fvtt().DialogV2.wait({
    window: { title: `Treinar: ${p.nome}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>Faltam ${falta} h. Você tem ${livres} h livres hoje.</p><label class="epm-campo"><span>Horas</span><input type="number" name="horas" min="1" max="${max}" value="${max}"></label>`,
    buttons: [{ action: "ok", label: "Treinar", icon: "fa-solid fa-dumbbell", default: true, callback: (ev, b) => int(b.form.elements.horas.value) }, { action: "cancelar", label: "Cancelar" }]
  });
  const horas = Math.max(0, Math.min(max, int(r)));
  if (!horas) return;
  const feitas = Math.min(int(p.horas), (Number(p.horasFeitas) || 0) + horas);
  await actor.update({ [`${P}.habProjetos.${id}.horasFeitas`]: feitas, [`${P}.habProjetos.${id}.estado`]: feitas >= int(p.horas) ? "pronto" : "andamento",
    [`${P}.treinoDia.horas`]: (TREINO?.horasDia ?? 8) - livres + horas });
}

/** Teste de criação: 1 por dia; falhou, não perde PH nem horas; passou, paga os PH e a habilidade entra na ficha. */
export async function testarProjetoHab(actor, id) {
  const p = actor.flags?.[FLAG]?.habProjetos?.[id];
  if (!p) return;
  if (p.estado !== "pronto") return ui.notifications.warn("Termine as horas do projeto antes do teste.");
  if (p.ultimoTeste === hoje() && !game.user.isGM) return ui.notifications.warn("Um teste por dia: tente de novo amanhã.");
  if ((p.catalisador === "pendente" || p.despertar === "pendente") && !game.user.isGM) return ui.notifications.warn("Falta o Mestre marcar o Catalisador ou aprovar o Despertar.");
  const { estadoAtor, rolarTeste } = await M();
  const { ficha } = estadoAtor(actor);
  if (int(p.ph) > ficha.pontos.ph) return ui.notifications.warn(`Faltam ${int(p.ph) - ficha.pontos.ph} PH para pagar no sucesso.`);
  const per = ficha.periciaPorId?.[p.pericia];
  const bonus = (per?.testeTotal ?? 0) + int(p.bonus);
  const roll = await rolarTeste(actor, { rotulo: `${p.modo === "aprender" ? "Aprender" : "Criar"} ${p.nome} (${per?.nome ?? p.pericia} DT ${p.dt})${p.bonus ? ` · afinidade +${p.bonus}` : ""}`, bonus,
    desvantagens: [...(ficha.desvantagens?.testes ?? []), ...(per?.desvantagem ?? [])], vantagens: [...(ficha.vantagens?.testes ?? []), ...(per?.vantagem ?? [])], penalidades: per?.testeFontes ?? [] });
  if (!roll) return;
  if (roll.total < int(p.dt)) {
    await actor.update({ [`${P}.habProjetos.${id}.ultimoTeste`]: hoje() });
    return nota(actor, `<p><strong>${escapar(actor.name)}</strong> falhou em <strong>${escapar(p.nome)}</strong> (${roll.total} contra DT ${p.dt}). Não perde PH nem horas; tenta de novo amanhã.</p>`);
  }
  // Passou por 10 ou mais: +1 de Orçamento numa técnica (a primeira)
  const receita = foundry.utils.deepClone(p.receita);
  if (roll.total >= int(p.dt) + 10 && receita.tecnicas?.[0]) receita.tecnicas[0].bonusTeste = 1;
  const item = p.itemId ? actor.items.get(p.itemId) : null;
  if (item && (p.modo === "evoluir" || p.modo === "novaTecnica")) {
    const novo = dadosItemDaReceita(receita);
    await item.update({ name: novo.name, [`${P}.formas`]: null }, { render: false });
    await item.update({ [`${P}.raridade`]: novo.flags[FLAG].raridade, [`${P}.receita`]: novo.flags[FLAG].receita, [`${P}.formas`]: novo.flags[FLAG].formas, "system.description.value": novo.system.description.value });
  } else await actor.createEmbeddedDocuments("Item", [dadosItemDaReceita(receita)]);
  await actor.update({ [`${P}.pontos.ph`]: ficha.pontos.ph - int(p.ph), [`${P}.habProjetos.${id}.estado`]: "concluido", [`${P}.habProjetos.${id}.ultimoTeste`]: hoje() });
  return nota(actor, `<p><strong>${escapar(actor.name)}</strong> ${p.modo === "aprender" ? "aprendeu" : p.modo === "evoluir" ? "evoluiu" : "criou"} <strong>${escapar(p.nome)}</strong> (${roll.total} contra DT ${p.dt}) por ${p.ph} PH.${roll.total >= int(p.dt) + 10 ? " Passou por 10: +1 de Orçamento na primeira técnica." : ""}</p>`);
}

async function nota(actor, html, cor = "#A47DDB") {
  return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:${cor}">${html}</div>` });
}

/** Menu da habilidade criada: Aprimorar, Evoluir, Nova técnica e Remodelar. */
export async function menuHabilidade(actor, item) {
  const f = item.flags?.[FLAG] ?? {};
  if (!f.receita) return ui.notifications.warn("Esta habilidade não tem receita do criador (foi feita à mão).");
  if (f.hui) return ui.notifications.info("A Habilidade Única Inicial evolui sozinha pelo nível; o Mestre remodela pelo criador da HUI.");
  const r = await fvtt().DialogV2.wait({
    window: { title: item.name }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p class="epm-dica">Aprimorar gasta PT (até metade do Orçamento de cada técnica; 2 h, sem teste). Evoluir e Nova técnica viram projeto na sub-aba Criação. Remodelar custa 5 PT e um descanso longo.</p>`,
    buttons: [
      { action: "aprimorar", label: "Aprimorar", icon: "fa-solid fa-arrow-up" }, { action: "evoluir", label: "Evoluir", icon: "fa-solid fa-angles-up" },
      { action: "novaTecnica", label: "Nova técnica", icon: "fa-solid fa-plus" }, { action: "remodelar", label: "Remodelar", icon: "fa-solid fa-shuffle" },
      { action: "cancelar", label: "Cancelar" }
    ]
  });
  if (r === "aprimorar") return aprimorarHabilidade(actor, item);
  if (r === "evoluir" || r === "novaTecnica" || r === "remodelar") {
    const receita = foundry.utils.deepClone(f.receita);
    if (r === "novaTecnica") receita.tecnicas.push({ nome: "", raridade: "comum", modo: "utilidade" });
    const out = await abrirCriador(actor, { receita, modo: r, item });
    if (!out) return;
    if (r === "remodelar") {
      const pt = int(actor.flags?.[FLAG]?.pontos?.pt);
      if (pt < 5) return ui.notifications.warn("Remodelar custa 5 PT.");
      const novo = dadosItemDaReceita({ ...out.receita, tecnicas: out.receita.tecnicas.map((t, i) => ({ ...t, raridade: f.receita.tecnicas[i]?.raridade ?? t.raridade })) });
      await item.update({ [`${P}.formas`]: null }, { render: false });
      await item.update({ name: novo.name, [`${P}.receita`]: novo.flags[FLAG].receita, [`${P}.formas`]: novo.flags[FLAG].formas, "system.description.value": novo.system.description.value });
      await actor.update({ [`${P}.pontos.pt`]: pt - 5 });
      return nota(actor, `<p><strong>${escapar(actor.name)}</strong> remodelou <strong>${escapar(item.name)}</strong> (5 PT; vale depois do próximo descanso longo).</p>`);
    }
    return gravarProjeto(actor, out.receita, out.conta, { modo: r, itemId: item.id });
  }
}

/** Aprimorar: PT por +1 de Orçamento numa técnica (até metade), ou 40 PT para −20% no custo (uma vez). */
export async function aprimorarHabilidade(actor, item) {
  const f = item.flags?.[FLAG] ?? {};
  const receita = foundry.utils.deepClone(f.receita);
  const pt = int(actor.flags?.[FLAG]?.pontos?.pt);
  const linhas = receita.tecnicas.map((t, i) => {
    const R = S.RARIDADES_HAB[t.raridade] ?? S.RARIDADES_HAB.comum;
    const teto = Math.floor(S.orcamentoBase(t.raridade, receita.categoria) / 2);
    return `<option value="o${i}" ${int(t.aprimorado) >= teto ? "disabled" : ""}>${escapar(t.nome || `Técnica ${i + 1}`)}: +1 de Orçamento (${R.ptAprim} PT; ${int(t.aprimorado)} de ${teto})</option>
      <option value="c${i}" ${t.desconto ? "disabled" : ""}>${escapar(t.nome || `Técnica ${i + 1}`)}: −20% no custo de uso (40 PT, uma vez)</option>`;
  }).join("");
  const r = await fvtt().DialogV2.wait({
    window: { title: `Aprimorar ${item.name}` }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>Você tem ${pt} PT. Cada compra leva 2 h de treino, sem teste.</p><label class="epm-campo"><span>Compra</span><select name="compra">${linhas}</select></label>`,
    buttons: [{ action: "ok", label: "Comprar", default: true, callback: (ev, b) => b.form.elements.compra.value }, { action: "cancelar", label: "Cancelar" }]
  });
  if (!r || r === "cancelar") return;
  const i = int(r.slice(1));
  const t = receita.tecnicas[i];
  const custo = r[0] === "o" ? (S.RARIDADES_HAB[t.raridade]?.ptAprim ?? 10) : 40;
  if (custo > pt) return ui.notifications.warn(`Faltam ${custo - pt} PT.`);
  const { horasLivres } = await M();
  if (horasLivres(actor) < 2 && !game.user.isGM) return ui.notifications.warn("Aprimorar leva 2 h de treino: sem horas livres hoje.");
  if (r[0] === "o") t.aprimorado = int(t.aprimorado) + 1; else t.desconto = true;
  const novo = dadosItemDaReceita(receita);
  await item.update({ [`${P}.formas`]: null }, { render: false });
  await item.update({ [`${P}.receita`]: novo.flags[FLAG].receita, [`${P}.formas`]: novo.flags[FLAG].formas });
  await actor.update({ [`${P}.pontos.pt`]: pt - custo, [`${P}.treinoDia.horas`]: int(actor.flags?.[FLAG]?.treinoDia?.horas) + 2 });
  return nota(actor, `<p><strong>${escapar(actor.name)}</strong> aprimorou <strong>${escapar(item.name)}</strong> (${custo} PT, 2 h).</p>`);
}

/* ------------------------------------------------------------ */
/*  Habilidade Única Inicial                                    */
/* ------------------------------------------------------------ */

export function permiteSemHui() {
  try { return game.settings.get(FLAG, "permitirSemHui") !== false; } catch { return true; }
}

/** Questionário (fim da criação guiada ou "Continuar Criação de Habilidade Única Inicial"). */
export async function questionarioHui(actor, { titulo = "Habilidade Única Inicial" } = {}) {
  const u = actor.flags?.[FLAG]?.unicaInicial ?? {};
  const resp = u.respostas ?? {};
  const perguntas = S.PERGUNTAS_HUI.map((p, i) => p.aberta
    ? `<label class="epm-campo"><span>${i + 1}) ${escapar(p.texto)}</span><input type="text" name="${p.id}" value="${escapar(resp[p.id] ?? "")}"></label>`
    : `<fieldset class="epm-hui-pergunta"><legend>${i + 1}) ${escapar(p.texto)}</legend>${p.opcoes.map((o, k) => `<label class="epm-check"><input type="radio" name="${p.id}" value="${"ABCDEF"[k]}" ${resp[p.id] === "ABCDEF"[k] ? "checked" : ""}> ${"ABCDEF"[k]}) ${escapar(o)}</label>`).join("")}</fieldset>`).join("");
  const r = await fvtt().DialogV2.wait({
    window: { title: titulo }, classes: ["epm-dialogo", "epm-dialogo-060", "epm-hui-dialogo"], position: { width: 620 }, rejectClose: false, modal: true,
    content: `<div class="epm-form-060"><p class="epm-dica">Responda pensando no personagem. Não há resposta certa: o Mestre monta a sua Habilidade Única Inicial a partir delas. A 6ª é a mais importante.</p>${perguntas}</div>`,
    buttons: [
      { action: "enviar", label: "Enviar ao Mestre", icon: "fa-solid fa-paper-plane", default: true, callback: (ev, b) => ({ acao: "enviar", respostas: Object.fromEntries(new FormData(b.form).entries()) }) },
      { action: "depois", label: "Responder depois", icon: "fa-solid fa-clock", callback: (ev, b) => ({ acao: "depois", respostas: Object.fromEntries(new FormData(b.form).entries()) }) },
      ...(permiteSemHui() ? [{ action: "nenhuma", label: "Sem Habilidade Única Inicial", icon: "fa-solid fa-ban", callback: () => ({ acao: "nenhuma" }) }] : [])
    ]
  });
  if (!r || typeof r !== "object") return null;
  if (r.acao === "nenhuma") { await actor.update({ [`${P}.unicaInicial.estado`]: "nenhuma" }); return "nenhuma"; }
  const respostas = { ...resp, ...r.respostas };
  if (r.acao === "depois") { await actor.update({ [`${P}.unicaInicial.estado`]: "pendente", [`${P}.unicaInicial.respostas`]: respostas }); return "pendente"; }
  if (!S.respostasCompletas(respostas)) {
    ui.notifications.warn("Responda as 6 perguntas para enviar ao Mestre (ficou guardado; continue depois).");
    await actor.update({ [`${P}.unicaInicial.estado`]: "pendente", [`${P}.unicaInicial.respostas`]: respostas });
    return "pendente";
  }
  await actor.update({ [`${P}.unicaInicial.estado`]: "respondida", [`${P}.unicaInicial.respostas`]: respostas });
  await cartaoMestreHui(actor);
  return "respondida";
}

/** Cartão só para o Mestre com as respostas, os significados e os botões. */
export async function cartaoMestreHui(actor) {
  const u = actor.flags?.[FLAG]?.unicaInicial ?? {};
  const linhas = S.textoRespostas(u.respostas).map((t, i) => `<li>${escapar(t)} <em class="epm-dica">— ${escapar(S.PERGUNTAS_HUI[i].significado)}</em></li>`).join("");
  return ChatMessage.create({
    whisper: [...(game.users ?? [])].filter(x => x.isGM).map(x => x.id), speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="epm-chat epm-chat-nota epm-hui-cartao" style="--epm-cor-cartao:#F0CF62"><p><strong>${escapar(actor.name)}</strong> respondeu o questionário da Habilidade Única Inicial.</p><ol>${linhas}</ol>
      <div class="epm-hui-botoes epm-so-mestre"><button type="button" data-hui-acao="prompt" data-ator="${actor.uuid}"><i class="fa-solid fa-copy"></i> Copiar prompt</button>
      <button type="button" data-hui-acao="colar" data-ator="${actor.uuid}"><i class="fa-solid fa-paste"></i> Colar resposta</button>
      <button type="button" data-hui-acao="montar" data-ator="${actor.uuid}"><i class="fa-solid fa-wand-magic-sparkles"></i> Montar no criador</button></div></div>`
  });
}

/** Únicas e HUIs dos atores do mundo (para o prompt e para o aviso de repetição). */
export function unicasDoMundo({ exceto = "" } = {}) {
  const out = [];
  for (const a of game.actors ?? []) for (const i of a.items ?? []) {
    const f = i.flags?.[FLAG] ?? {};
    if (i.uuid === exceto || !(f.hui || f.raridade === "unica")) continue;
    const texto = String(i.system?.description?.value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
    out.push({ nome: i.name, tema: f.tema ?? "", efeitos: texto, tecnicas: Object.values(f.formas ?? {}).map(fo => fo?.nome).filter(Boolean) });
  }
  return out;
}

export function promptDoAtor(actor) {
  const d = actor.flags?.[FLAG] ?? {};
  const atr = Object.entries(d.atributos ?? {}).map(([k, v]) => [k, int(v?.base) + int(v?.bonus)]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(", ");
  return S.promptHui({ respostas: d.unicaInicial?.respostas ?? {}, nome: actor.name, raca: d.raca ?? "", arquetipo: [d.arquetipo, d.arquetipo2].filter(Boolean).join(" / "), atributos: atr, unicas: unicasDoMundo() });
}

async function copiar(texto, titulo = "Copiar") {
  try { await navigator.clipboard.writeText(texto); ui.notifications.info("Copiado para a área de transferência."); return true; }
  catch {
    await fvtt().DialogV2.wait({ window: { title: titulo }, classes: ["epm-dialogo"], position: { width: 640 }, rejectClose: false,
      content: `<textarea readonly rows="16" style="width:100%">${escapar(texto)}</textarea>`, buttons: [{ action: "ok", label: "Fechar" }] });
    return false;
  }
}

/** "Colar resposta": lê o texto e abre o criador já preenchido (o Mestre confere e conclui). */
export async function colarRespostaHui(actor, texto = null) {
  let t = texto;
  if (t === null) {
    t = await fvtt().DialogV2.wait({ window: { title: `Colar resposta · ${actor.name}` }, classes: ["epm-dialogo"], position: { width: 640 }, rejectClose: false, modal: true,
      content: `<p class="epm-dica">Cole a habilidade no formato do prompt (NOME, TIPO, TEMA, DESCRIÇÃO, e TÉCNICA/EFEITO para cada técnica) ou o texto do site com as partes numeradas.</p><textarea name="texto" rows="14" style="width:100%"></textarea>`,
      buttons: [{ action: "ok", label: "Ler", default: true, callback: (ev, b) => b.form.elements.texto.value }, { action: "cancelar", label: "Cancelar" }] });
    if (!t || t === "cancelar") return null;
  }
  let lida = S.lerRespostaHui(t);
  if (!lida?.tecnicas?.length) {
    try {
      const { lerHabilidadeTexto } = await import("./habilidade-texto.mjs");
      const h = lerHabilidadeTexto(t);
      lida = { nome: h?.nome ?? "", tipo: h?.tipo ?? "", tema: h?.tema ?? "", descricao: "", tecnicas: (h?.partes ?? h?.formas ?? []).map(p => {
        const custo = Number(String(p.custo ?? p.custoTexto ?? "").match(/\d+/)?.[0]) || 0;
        return { nome: p.nome ?? "", peso: custo >= 15 ? "suprema" : custo >= 10 ? "regular" : "leve", modo: "utilidade", efeito: String(p.efeito ?? p.texto ?? "").replace(/<[^>]+>/g, " ").trim(), custoProposto: custo || null };
      }) };
    } catch { /* sem leitura alternativa */ }
  }
  if (!lida?.tecnicas?.length) { ui.notifications.warn("Não consegui ler as técnicas do texto."); return null; }
  return montarHui(actor, { receita: { categoria: "unicaInicial", natureza: "fisica", ...lida, tecnicas: lida.tecnicas.map(x => ({ ...x, peso: x.peso || "regular", mods: {}, restricoes: {} })) } });
}

/** Criador no modo Única Inicial; ao concluir, a habilidade entra na ficha e o estado vira "ativa". */
export async function montarHui(actor, { receita = null } = {}) {
  if (!game.user.isGM) return ui.notifications.warn("Só o Mestre monta a Habilidade Única Inicial.");
  const d = actor.flags?.[FLAG] ?? {};
  const u = S.lerHui(d.unicaInicial, nivelTotalDe(d));
  const atual = u.itemId ? actor.items.get(u.itemId) : null;
  const base = receita ?? atual?.flags?.[FLAG]?.receita ?? null;
  const out = await abrirCriador(actor, { modo: "hui", receita: base, hui: { estagio: u.estagio, ressonante: u.ressonante, final: u.final }, unicas: unicasDoMundo({ exceto: atual?.uuid ?? "" }) });
  if (!out) return null;
  return concluirHui(actor, out.receita);
}

export async function concluirHui(actor, receita) {
  const d = actor.flags?.[FLAG] ?? {};
  const nivel = nivelTotalDe(d);
  const u0 = d.unicaInicial ?? {};
  const est = u0.estado === "ativa" && u0.estagio ? int(u0.estagio, 1) : S.estagioDoNivel(nivel).n;
  const v = S.validarHui(receita.tecnicas, est);
  if (!v.ok) { ui.notifications.error(v.erros.join(" ")); return null; }
  const hui = { estagio: est, ressonante: !!u0.ressonante, final: !!u0.final };
  const dadosItem = dadosItemDaReceita({ ...receita, categoria: "unicaInicial" }, { hui });
  const atual = u0.itemId ? actor.items.get(u0.itemId) : null;
  let itemId = atual?.id;
  if (atual) {
    await atual.update({ [`${P}.formas`]: null }, { render: false });
    await atual.update({ name: dadosItem.name, [`${P}.formas`]: dadosItem.flags[FLAG].formas, [`${P}.receita`]: dadosItem.flags[FLAG].receita, [`${P}.raridade`]: dadosItem.flags[FLAG].raridade, "system.description.value": dadosItem.system.description.value });
  } else {
    const [novo] = await actor.createEmbeddedDocuments("Item", [dadosItem]);
    itemId = novo?.id;
  }
  const primeira = u0.estado !== "ativa";
  await actor.update({ [`${P}.unicaInicial.estado`]: "ativa", [`${P}.unicaInicial.itemId`]: itemId, [`${P}.unicaInicial.estagio`]: est,
    ...(primeira ? { [`${P}.unicaInicial.usos`]: 0, [`${P}.unicaInicial.historico`]: [{ estagio: est, nivel, quando: Date.now(), texto: "Recebida" }] } : {}) });
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#F0CF62"><p><i class="fa-solid fa-sun"></i> <strong>${escapar(actor.name)}</strong> ${primeira ? "despertou" : "teve ajustada"} a Habilidade Única Inicial <strong>${escapar(dadosItem.name)}</strong> (Estágio ${S.estagio(est).romano} · ${S.estagio(est).nome}).</p></div>` });
  return actor.items.get(itemId);
}

/** Recalcula os números da HUI (estágio, Ressonância). */
export async function recalcularHui(actor) {
  const d = actor.flags?.[FLAG] ?? {};
  const u = d.unicaInicial ?? {};
  const item = u.itemId ? actor.items.get(u.itemId) : null;
  if (!item?.flags?.[FLAG]?.receita) return null;
  const dadosItem = dadosItemDaReceita(item.flags[FLAG].receita, { hui: { estagio: int(u.estagio, 1), ressonante: !!u.ressonante, final: !!u.final } });
  await item.update({ [`${P}.formas`]: null }, { render: false });
  return item.update({ [`${P}.formas`]: dadosItem.flags[FLAG].formas, [`${P}.raridade`]: dadosItem.flags[FLAG].raridade, "system.description.value": dadosItem.system.description.value });
}

/** Uso de uma técnica ativa (chamado pelo usarPoder). */
export async function contarUsoHui(actor, item, forma) {
  if (!item?.flags?.[FLAG]?.hui) return null;
  const d = actor.flags?.[FLAG] ?? {};
  const combateId = game.combat?.started && game.combat.combatants?.some?.(c => c.actor?.id === actor.id) ? game.combat.id : "";
  const r = S.registrarUsoHui(d.unicaInicial, { combateId, nivelTotal: nivelTotalDe(d), passiva: forma?.acao === "passiva" });
  if (!r.contou) { if (r.motivo === "limite") ui.notifications.info("HUI: já contou 3 usos neste combate."); return r; }
  const upd = { [`${P}.unicaInicial.usos`]: r.usos, [`${P}.unicaInicial.ressonante`]: r.ressonante, [`${P}.unicaInicial.final`]: r.final };
  for (const [k, v] of Object.entries(r.usosCombate)) upd[`${P}.unicaInicial.usosCombate.${k}`] = v;
  await actor.update(upd);
  if (r.ressoou) {
    await recalcularHui(actor);
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#F0CF62"><p><i class="fa-solid fa-wave-square"></i> A habilidade de <strong>${escapar(actor.name)}</strong> ressoa${r.final ? " para sempre (Ressonância final)" : ""}: as técnicas usam os números do ${r.final ? "Transcendido" : "próximo estágio"} com o custo atual, e os bônus fixos passam do Teto em até +3. O Orçamento a mais se gasta no criador.</p></div>` });
  }
  return r;
}

/** Nível mudou: sobe (ou desce) o estágio, zera usos e a Ressonância e manda o cartão. */
export async function conferirEstagioHui(actor) {
  const d = actor.flags?.[FLAG] ?? {};
  const u = d.unicaInicial;
  if (!u || u.estado !== "ativa") return null;
  const m = S.mudarEstagioHui(u, nivelTotalDe(d));
  if (!m) return null;
  const historico = [...(Array.isArray(u.historico) ? u.historico : []), { estagio: m.estagio, nivel: nivelTotalDe(d), quando: Date.now(), texto: m.subiu ? "Despertou" : "Voltou (correção de nível)" }];
  await actor.update({ [`${P}.unicaInicial.estagio`]: m.estagio, [`${P}.unicaInicial.usos`]: 0, [`${P}.unicaInicial.ressonante`]: false, [`${P}.unicaInicial.final`]: m.final, [`${P}.unicaInicial.historico`]: historico });
  await recalcularHui(actor);
  const e = S.estagio(m.estagio);
  if (m.subiu) await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:#F0CF62"><p><i class="fa-solid fa-sun"></i> <strong>${escapar(actor.name)}</strong> despertou o Estágio ${e.romano} · ${e.nome} da Habilidade Única Inicial. O Orçamento novo se gasta no criador${m.estagio === 6 ? " (+2 de peso e +1 técnica)" : ""}, e dá para reescrever um efeito, sem teste, PH nem horas.</p></div>` });
  return m;
}

/** Ações do Mestre: +1/−1 uso, marcar sem HUI ou pendente. */
export async function ajustarHui(actor, op) {
  if (!game.user.isGM) return;
  const d = actor.flags?.[FLAG] ?? {};
  const u = S.lerHui(d.unicaInicial, nivelTotalDe(d));
  if (op === "mais" || op === "menos") {
    const usos = Math.max(0, u.usos + (op === "mais" ? 1 : -1));
    const ressonante = u.estagio < 6 && usos >= u.meta;
    const final = u.estagio === 6 && usos >= u.meta;
    await actor.update({ [`${P}.unicaInicial.usos`]: usos, [`${P}.unicaInicial.ressonante`]: ressonante, [`${P}.unicaInicial.final`]: final });
    if (ressonante !== u.ressonante || final !== u.final) await recalcularHui(actor);
    return { usos, ressonante, final };
  }
  if (op === "nenhuma" || op === "pendente") return actor.update({ [`${P}.unicaInicial.estado`]: op });
}

/** Contexto para a seção Única da aba Habilidades. */
export function contextoHui(dados = {}, { tipo = "character", isGM = false, editavel = false, itens = [] } = {}) {
  if (tipo !== "character") return null;
  const u = S.lerHui(dados.unicaInicial, nivelTotalDe(dados));
  if (u.estado === "nenhuma") return isGM ? { nenhuma: true, isGM } : null;
  const item = itens.find?.(i => i.id === u.itemId);
  const tecnicas = item?.flags?.[FLAG]?.receita?.tecnicas ?? [];
  const v = tecnicas.length ? S.validarHui(tecnicas, u.estagio) : null;
  return {
    ...u, isGM, editavel, pendente: u.estado === "pendente", respondida: u.estado === "respondida", ativa: u.estado === "ativa",
    peso: v ? `${v.peso} de ${v.limite.peso}` : "", usosTexto: `${u.usos} de ${u.meta} usos para a ${u.estagio === 6 ? "Ressonância final" : "Ressonância"}`,
    proximoTexto: u.proximo ? `Estágio ${u.proximo.romano} no nível ${u.proximo.nivel}` : "Estágio máximo"
  };
}

/* ------------------------------------------------------------ */
/*  Ganchos                                                     */
/* ------------------------------------------------------------ */

export function registrarHabilidadesSistema() {
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    const el = html?.[0] ?? html;
    el?.querySelectorAll?.("[data-hui-acao]").forEach(b => b.addEventListener("click", async ev => {
      ev.preventDefault();
      const actor = await fromUuid(b.dataset.ator);
      if (!actor) return;
      if (b.dataset.huiAcao === "prompt") return copiar(promptDoAtor(actor), "Prompt da HUI");
      if (b.dataset.huiAcao === "colar") return colarRespostaHui(actor);
      if (b.dataset.huiAcao === "montar") return montarHui(actor);
    }));
  });
  Hooks.on("updateActor", (actor, mudou) => {
    const souGM = game.user?.isGM && (!game.users?.activeGM || game.users.activeGM.isSelf);
    const f = mudou?.flags?.[FLAG];
    if (!souGM || !f || (f.nivel === undefined && f.nivel2 === undefined && f.arquetipo2 === undefined)) return;
    conferirEstagioHui(actor).catch(err => console.warn("EPM | estágio da HUI", err));
  });
}

export { copiar };
