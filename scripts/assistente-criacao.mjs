/**
 * Criação de personagem guiada (reformulada): um passo a passo para jogador novo, já no nível da ficha.
 * 1. Nome, conceito (opcional) e nível · 2. Raça · 3. Atributos (16 pontos) · 4. Arquétipo · 5. Perícias (pelo nível)
 * · 6. Níveis seguintes (Aumentos de Status e escolhas do arquétipo, só acima do nível 1) · 7. Classe (nível 3+) · 8. Kit inicial.
 * Os passos com distribuição só deixam seguir quando a conta fecha. Tudo pode ser refeito depois na própria ficha.
 */
import { FLAG, ATRIBUTOS, REGRAS } from "./config.mjs";
import { escapar } from "./helpers.mjs";
import { tetoAtributo } from "./regras-extras.mjs";
import {
  ARQUETIPOS, maestriasPermitidas, estilosPermitidos, acumuloDeMagias, criacaoDe
} from "./arquetipos.mjs";
import { RECEITAS_ARTIFICE } from "./receitas-artifice.mjs";

const P = `flags.${FLAG}`;
const n = v => Number(v) || 0;
const nivelValido = v => Math.max(1, Math.min(REGRAS.nivelMaxArquetipo, Math.floor(n(v)) || 1));

/** Confere a distribuição dos atributos (16 pontos, máximo 3; um pode ir a 4 se dois ficarem em −1). */
export function conferirAtributos(valores = {}) {
  const lista = Object.keys(ATRIBUTOS).map(id => n(valores[id]));
  const soma = lista.reduce((a, b) => a + b, 0);
  const quatros = lista.filter(v => v >= REGRAS.atributoExcecao).length;
  const negativos = lista.filter(v => v <= REGRAS.atributoMinimoExcecao).length;
  const erros = [];
  if (soma > REGRAS.atributosIniciais) erros.push(`A soma é ${soma}; o limite é ${REGRAS.atributosIniciais}.`);
  if (lista.some(v => v > REGRAS.atributoExcecao)) erros.push(`Nenhum atributo passa de ${REGRAS.atributoExcecao}.`);
  if (quatros > 1 || (quatros === 1 && negativos < 2)) erros.push(`Só um atributo pode ir a ${REGRAS.atributoExcecao}, e só se dois ficarem em ${REGRAS.atributoMinimoExcecao}.`);
  if (lista.some(v => v < REGRAS.atributoMinimoExcecao)) erros.push(`O mínimo é ${REGRAS.atributoMinimoExcecao}.`);
  return { soma, restante: REGRAS.atributosIniciais - soma, ok: !erros.length, erros };
}

/** Pontos de perícia e limite por perícia no nível (50 + 15 a cada 5 níveis; limite 5, 10 no 15, 15 no 35). */
export function periciasDoNivel(nivel = 1, extra = 0) {
  const nv = nivelValido(nivel);
  return {
    total: REGRAS.periciasIniciais + Math.floor(nv / 5) * REGRAS.periciasPorMarco + Math.max(0, n(extra)),
    limite: REGRAS.periciaLimiteInicial + REGRAS.periciaMarcosLimite.filter(m => nv >= m).length * REGRAS.periciaAumentoLimite
  };
}

/** Confere os pontos de perícia no nível (padrão: nível 1 = 50 pontos, até 5 por perícia). */
export function conferirPericias(valores = {}, nivel = 1, extra = 0) {
  const { total, limite } = periciasDoNivel(nivel, extra);
  const lista = Object.values(valores).map(n);
  const soma = lista.reduce((a, b) => a + b, 0);
  const erros = [];
  if (soma > total) erros.push(`A soma é ${soma}; o limite é ${total}.`);
  if (lista.some(v => v > limite)) erros.push(`No nível ${nivelValido(nivel)}, cada perícia vai até ${limite}.`);
  if (lista.some(v => v < 0)) erros.push("Pontos não podem ser negativos.");
  return { soma, total, limite, restante: total - soma, ok: !erros.length, erros };
}

/** Aumentos de Status no nível: 1 em todo nível par e 2 no 50. */
export const aumentosDoNivel = nivel => { const nv = nivelValido(nivel); return Math.floor(nv / 2) + (nv >= 50 ? 1 : 0); };

/**
 * Confere os Aumentos de Status: soma igual ou menor que a do nível e nenhum atributo acima do teto do nível
 * (8 até o 20, 10 no 21, 12 no 31, 15 no 41). `antes` = base + raça de cada atributo.
 */
export function conferirAumentos(aumentos = {}, antes = {}, nivel = 1) {
  const disponivel = aumentosDoNivel(nivel);
  const teto = tetoAtributo(nivelValido(nivel));
  const soma = Object.keys(ATRIBUTOS).reduce((s, id) => s + n(aumentos[id]), 0);
  const erros = [];
  if (soma > disponivel) erros.push(`Aumentos somam ${soma}; no nível ${nivelValido(nivel)} são ${disponivel}.`);
  if (Object.keys(ATRIBUTOS).some(id => n(aumentos[id]) < 0)) erros.push("Aumentos não podem ser negativos.");
  const acima = Object.keys(ATRIBUTOS).filter(id => n(antes[id]) + n(aumentos[id]) > teto).map(id => ATRIBUTOS[id].label);
  if (acima.length) erros.push(`Teto do nível: ${teto} (passou: ${acima.join(", ")}).`);
  return { soma, disponivel, restante: disponivel - soma, teto, ok: !erros.length, erros };
}

/** Diálogo de um passo. `validar(form)` devolve { ok, texto }: o "Próximo" só libera com ok. */
async function passo(titulo, numero, total, conteudo, { pular = true, validar = null, render = null, largura = 620 } = {}) {
  return foundry.applications.api.DialogV2.wait({
    window: { title: `Criação de personagem · ${numero}/${total}: ${titulo}` }, classes: ["epm-dialogo", "epm-assistente"], rejectClose: false, modal: true, position: { width: largura },
    content: `<div class="epm-form-060">${conteudo}</div>`,
    render: (ev, dlg) => {
      const raiz = dlg?.element ?? ev?.target?.element;
      if (!raiz) return;
      render?.(raiz);
      if (!validar) return;
      const ok = raiz.querySelector('button[data-action="ok"]');
      const aviso = raiz.querySelector("[data-resto]");
      const conferir = () => {
        const r = validar(raiz.querySelector("form") ?? raiz);
        if (aviso) { aviso.textContent = r.texto; aviso.classList.toggle("epm-aviso-erro", !r.ok); }
        if (ok) ok.disabled = !r.ok;
      };
      raiz.addEventListener("input", conferir);
      raiz.addEventListener("change", conferir);
      conferir();
    },
    buttons: [
      { action: "ok", label: "Próximo", icon: "fa-solid fa-arrow-right", default: true, callback: (ev, b) => {
        const out = {};
        for (const [k, v] of new FormData(b.form).entries()) { if (k.endsWith("[]")) (out[k.slice(0, -2)] ??= []).push(v); else out[k] = v; }
        return out;
      } },
      ...(pular ? [{ action: "pular", label: "Pular", icon: "fa-solid fa-forward" }] : []),
      { action: "parar", label: "Parar aqui", icon: "fa-solid fa-xmark" }
    ]
  });
}

const valoresDe = (raiz, sel) => Object.fromEntries([...raiz.querySelectorAll(sel)].map(i => [i.name, i.value]));
const parou = r => r === "parar" || r === null;

/** O que cada nível do arquétipo dá (do 2 ao nível escolhido), para o resumo do passo dos níveis. */
function resumoNiveis(arqId, nivel) {
  const a = ARQUETIPOS[arqId];
  if (!a) return "";
  return Array.from({ length: Math.max(0, nivel - 1) }, (_, i) => i + 2).map(nv => `<li><strong>${nv}</strong> ${escapar(a.progressao[nv] ?? "")}</li>`).join("");
}

/** O passo a passo. Devolve true se chegou ao fim. */
export async function assistenteCriacao(actor) {
  if (!actor?.isOwner) return ui.notifications.warn("Esta ficha não é sua.");
  const dados = actor.flags?.[FLAG] ?? {};
  const { estadoAtor } = await import("./mecanicas.mjs");
  let nivel = nivelValido(dados.nivel);
  const passosComNivel = nv => 7 + (nv > 1 ? 1 : 0) + (nv >= 3 ? 1 : 0);

  // 1. Nome, conceito e nível
  let r = await passo("Começo", 1, passosComNivel(nivel), `<p class="epm-dica">Comece pelo básico. Tudo pode ser mudado depois.</p>
    <label class="epm-campo"><span>Nome</span><input type="text" name="nome" value="${escapar(actor.name)}"></label>
    <label class="epm-campo"><span>Conceito (opcional)</span><input type="text" name="conceito" value="${escapar(dados.sobre?.conceito ?? "")}" placeholder="Ex.: Caçadora de relíquias que deve a vida a um dragão"></label>
    <label class="epm-campo" title="O assistente guia os pontos, os Aumentos de Status e as escolhas até este nível"><span>Nível da ficha</span><input type="number" name="nivel" min="1" max="${REGRAS.nivelMaxArquetipo}" value="${nivel}"></label>`, { pular: false });
  if (parou(r)) return false;
  if (r && typeof r === "object") {
    nivel = nivelValido(r.nivel);
    await actor.update({ name: r.nome || actor.name, [`${P}.sobre.conceito`]: String(r.conceito ?? "").trim(), [`${P}.nivel`]: nivel });
  }
  const total = passosComNivel(nivel);

  // 2. Raça
  r = await passo("Raça", 2, total, `<p>A raça dá bônus de atributo, Vida, Mana e Estamina base, deslocamento, tamanho e habilidades raciais.</p>
    <p class="epm-dica">Só 1 Habilidade Única (o Mutante, ou o Mestiço com Mutante, que pegar Compatibilidade à Fera escolhe mais 2). Clique em Próximo para escolher.</p>`);
  if (parou(r)) return false;
  if (r && typeof r === "object") { const { escolherRaca } = await import("./ficha-060.mjs"); await escolherRaca(actor); }

  // 3. Atributos (base)
  const atuais = actor.flags?.[FLAG]?.atributos ?? {};
  const campos = Object.entries(ATRIBUTOS).map(([id, a]) => `<label class="epm-campo"><span>${escapar(a.label)}</span><input type="number" name="${id}" min="${REGRAS.atributoMinimoExcecao}" max="${REGRAS.atributoExcecao}" value="${n(atuais[id]?.base)}" data-atr></label>`).join("");
  r = await passo("Atributos", 3, total, `<p>Distribua <strong>${REGRAS.atributosIniciais} pontos</strong>. Máximo ${REGRAS.atributoMaxInicial} por atributo; um pode ir a ${REGRAS.atributoExcecao} se dois ficarem em ${REGRAS.atributoMinimoExcecao}. O bônus da raça entra à parte${nivel > 1 ? "; os Aumentos de Status vêm no passo dos níveis" : ""}.</p>
    <div class="epm-dialogo-linha epm-assistente-grade">${campos}</div><p class="epm-dica" data-resto></p>`, {
    validar: raiz => {
      const c = conferirAtributos(valoresDe(raiz, "[data-atr]"));
      return { ok: c.ok, texto: c.ok ? `Restam ${c.restante} pontos.` : c.erros.join(" ") };
    }
  });
  if (parou(r)) return false;
  if (r && typeof r === "object") {
    const c = conferirAtributos(r);
    if (c.ok) await actor.update(Object.fromEntries(Object.keys(ATRIBUTOS).map(id => [`${P}.atributos.${id}.base`, n(r[id])])));
  }

  // 4. Arquétipo
  const arqAtual = (await import("./arquetipos.mjs")).idArquetipo(actor.flags?.[FLAG]?.arquetipo) ?? "";
  r = await passo("Arquétipo", 4, total, `<p>O arquétipo define o estilo e libera habilidades por nível. O kit inicial vem dele.</p>
    <label class="epm-campo"><span>Arquétipo</span><select name="arq">${[["combatente", "Combatente: luta, armas e o Arsenal de Maestrias"], ["conjurador", "Conjurador: acumula magias e molda a mana"], ["artifice", "Artífice: Projetos, Consumíveis e Engenhocas"]].map(([id, t]) => `<option value="${id}" ${id === arqAtual ? "selected" : ""}>${t}</option>`).join("")}</select></label>`);
  if (parou(r)) return false;
  if (r && typeof r === "object" && r.arq !== arqAtual) {
    const X = await import("./extras.mjs");
    if (arqAtual) await actor.update({ [`${P}.arquetipo`]: "" });
    await X.definirArquetipo(actor, r.arq);
  }
  const arq = (await import("./arquetipos.mjs")).idArquetipo(actor.flags?.[FLAG]?.arquetipo) ?? "";

  // 5. Perícias (pelo nível)
  let { ficha } = estadoAtor(actor);
  const extraPer = n(actor.flags?.[FLAG]?.pontosPericiaExtra);
  const pn = periciasDoNivel(nivel, extraPer);
  const linhas = ficha.pericias.map(p => `<label class="epm-campo"><span>${escapar(p.nome)}</span><input type="number" name="${p.id}" min="0" max="${pn.limite}" value="${n(p.pontos)}" data-per></label>`).join("");
  r = await passo("Perícias", 5, total, `<p>No nível ${nivel}: <strong>${pn.total} pontos</strong>, até <strong>${pn.limite}</strong> por perícia (o limite sobe para 10 no nível 15 e 15 no 35). Os atributos somam sozinhos.</p>
    <div class="epm-dialogo-linha epm-assistente-grade" style="max-height:380px;overflow-y:auto">${linhas}</div><p class="epm-dica" data-resto></p>`, {
    validar: raiz => { const c = conferirPericias(valoresDe(raiz, "[data-per]"), nivel, extraPer); return { ok: c.ok, texto: c.ok ? `Restam ${c.restante} pontos.` : c.erros.join(" ") }; }
  });
  if (parou(r)) return false;
  if (r && typeof r === "object" && conferirPericias(r, nivel, extraPer).ok) {
    await actor.update(Object.fromEntries(Object.entries(r).filter(([id]) => ficha.periciaPorId[id]).map(([id, v]) => [`${P}.pericias.${id}.pontos`, n(v)])));
  }

  let numero = 6;
  // 6. Níveis seguintes: Aumentos de Status e escolhas do arquétipo
  if (nivel > 1) {
    ({ ficha } = estadoAtor(actor));
    const antes = Object.fromEntries(Object.keys(ATRIBUTOS).map(id => [id, n(ficha.atributos[id]?.base) + n(ficha.atributos[id]?.raca)]));
    const asAtual = Object.fromEntries(Object.keys(ATRIBUTOS).map(id => [id, n(actor.flags?.[FLAG]?.atributos?.[id]?.aumento)]));
    const camposAs = Object.entries(ATRIBUTOS).map(([id, a]) => `<label class="epm-campo"><span>${escapar(a.label)} <em>(${antes[id]})</em></span><input type="number" name="as_${id}" min="0" value="${asAtual[id]}" data-as="${id}"></label>`).join("");
    const opcArq = escolhasDoArquetipo(arq, nivel, actor.flags?.[FLAG] ?? {}, ficha);
    r = await passo(`Níveis 2 a ${nivel}`, numero, total, `
      <p>Aumentos de Status: <strong>${aumentosDoNivel(nivel)}</strong> (1 em todo nível par${nivel >= 50 ? ", 2 no 50" : ""}). Teto de atributo no nível ${nivel}: <strong>${tetoAtributo(nivel)}</strong> (base + raça + aumentos).</p>
      <div class="epm-dialogo-linha epm-assistente-grade">${camposAs}</div><p class="epm-dica" data-resto></p>
      ${opcArq.html}
      ${arq ? `<details class="epm-assistente-niveis"><summary>O que cada nível de ${escapar(ARQUETIPOS[arq].nome)} dá</summary><ul>${resumoNiveis(arq, nivel)}</ul><p class="epm-dica">As habilidades de arquétipo liberadas já entram na sub-aba Arquétipo. Perícia: +15 pontos a cada 5 níveis (já contados no passo anterior).</p></details>` : ""}`, {
      largura: 680,
      validar: raiz => {
        const v = Object.fromEntries([...raiz.querySelectorAll("[data-as]")].map(i => [i.dataset.as, i.value]));
        const c = conferirAumentos(v, antes, nivel);
        const o = opcArq.validar?.(raiz) ?? { ok: true, texto: "" };
        return { ok: c.ok && o.ok, texto: [c.ok ? `Restam ${c.restante} Aumentos.` : c.erros.join(" "), o.texto].filter(Boolean).join(" ") };
      },
      render: opcArq.render
    });
    if (parou(r)) return false;
    if (r && typeof r === "object") {
      const v = Object.fromEntries(Object.keys(ATRIBUTOS).map(id => [id, n(r[`as_${id}`])]));
      if (conferirAumentos(v, antes, nivel).ok) await actor.update(Object.fromEntries(Object.keys(ATRIBUTOS).map(id => [`${P}.atributos.${id}.aumento`, v[id]])));
      await opcArq.salvar?.(actor, r);
    }
    numero++;
  }

  // 7. Classe (nível 3+)
  if (nivel >= 3) {
    r = await passo("Classe", numero, total, `<p>No nível 3 o arquétipo libera a Classe (habilidades nos níveis 3, 6, 9…). Clique em Próximo para escolher entre as classes de ${escapar(ARQUETIPOS[arq]?.nome ?? "seu arquétipo")}.</p>`);
    if (parou(r)) return false;
    if (r && typeof r === "object") { const X = await import("./extras.mjs"); await X.trocarClasse(actor); }
    numero++;
  }

  // 8. Kit inicial (só do arquétipo escolhido)
  r = await passo("Equipamento inicial", numero, total, `<p>Escolha um kit${arq ? ` de ${escapar(ARQUETIPOS[arq].nome)}` : ""} (armas, armadura, kit de aventura e moedas). Os kits dos outros arquétipos ficam travados.</p><p class="epm-dica">Clique em Próximo para ver os kits.</p>`);
  if (r && typeof r === "object") { const { kitInicial } = await import("./ficha-060.mjs"); await kitInicial(actor); }
  numero++;
  // 9. Habilidade Única Inicial (0.9.0): questionário, com "Enviar ao Mestre", "Responder depois" e "Sem HUI"
  if (actor.type === "character" && actor.flags?.[FLAG]?.unicaInicial?.estado !== "ativa") {
    const { questionarioHui } = await import("./habilidades-ui.mjs");
    await questionarioHui(actor, { titulo: `Criação de personagem · ${numero}/${total}: Habilidade Única Inicial` });
  }
  await actor.update({ [`${P}.assistenteFeito`]: true });
  ui.notifications.info(`${actor.name} está pronto no nível ${nivel}! Revise a ficha no modo edição se quiser mudar algo.`);
  return true;
}

/**
 * Escolhas do arquétipo até o nível (campos do passo dos níveis): Combatente (Arma Favorita, Maestrias, Estilos),
 * Conjurador (quantas magias e Truques escolher) e Artífice (receitas do Livro, Utensílios).
 */
export function escolhasDoArquetipo(arq, nivel, dados = {}, ficha = null) {
  const caixa = (nome, valor, label, marcado, dica = "") => `<label class="epm-check" ${dica ? `title="${escapar(dica)}"` : ""}><input type="checkbox" name="${nome}[]" value="${escapar(valor)}" ${marcado ? "checked" : ""}> ${escapar(label)}</label>`;
  const contar = (raiz, nome) => raiz.querySelectorAll(`input[name="${nome}[]"]:checked`).length;
  const travar = (raiz, nome, max) => {
    const cx = [...raiz.querySelectorAll(`input[name="${nome}[]"]`)];
    const upd = () => { const m = cx.filter(c => c.checked).length; cx.forEach(c => { c.disabled = !c.checked && m >= max; }); };
    cx.forEach(c => c.addEventListener("change", upd)); upd();
  };
  if (arq === "combatente") {
    const cfg = ARQUETIPOS.combatente;
    const opc = dados.arquetipoOpcoes?.combatente ?? {};
    const maxM = maestriasPermitidas(nivel), maxE = estilosPermitidos(nivel);
    const html = `<fieldset class="epm-aquisicao"><legend>Arsenal de Maestrias</legend>
      <label class="epm-campo"><span>Arma Favorita (tipo de arma)</span><input type="text" name="tipoFavorito" value="${escapar(opc.tipoFavorito ?? "")}" placeholder="Espada longa, Pistola…"></label>
      <p class="epm-dica">${maxM} Maestria${maxM > 1 ? "s" : ""} no nível ${nivel}.</p>
      <div class="epm-chips-check">${Object.entries(cfg.maestrias).map(([id, m]) => caixa("maestrias", id, m.nome, (opc.maestrias ?? []).includes(id), m.texto)).join("")}</div></fieldset>
      ${maxE ? `<fieldset class="epm-aquisicao"><legend>Estilo de Combate (${maxE})</legend><div class="epm-chips-check">${Object.entries(cfg.estilos).map(([id, e]) => caixa("estilos", id, e.nome, (opc.estilos ?? []).includes(id), e.texto)).join("")}</div></fieldset>` : ""}`;
    return {
      html,
      render: raiz => { travar(raiz, "maestrias", maxM); if (maxE) travar(raiz, "estilos", maxE); },
      validar: raiz => {
        const m = contar(raiz, "maestrias"), e = contar(raiz, "estilos");
        const falta = [m < maxM ? `${maxM - m} Maestria(s)` : "", maxE && e < maxE ? `${maxE - e} Estilo(s)` : ""].filter(Boolean);
        return { ok: true, texto: falta.length ? `Falta escolher: ${falta.join(" e ")} (dá para escolher depois na ficha).` : "" };
      },
      salvar: (actor, r) => actor.update({
        [`${P}.arquetipoOpcoes.combatente.tipoFavorito`]: String(r.tipoFavorito ?? "").trim(),
        [`${P}.arquetipoOpcoes.combatente.maestrias`]: (r.maestrias ?? []).slice(0, maxM),
        [`${P}.arquetipoOpcoes.combatente.estilos`]: (r.estilos ?? []).slice(0, maxE)
      })
    };
  }
  if (arq === "conjurador") {
    const ac = acumuloDeMagias(nivel);
    return { html: `<fieldset class="epm-aquisicao"><legend>Acúmulo de Magias</legend><p>No nível ${nivel}: <strong>${ac.magias} magias</strong> (de qualquer círculo já liberado) e <strong>${ac.truques} Truques</strong>. Depois do assistente, abra o Grimório na aba Magias para escolher; a aba mostra quantas faltam.</p></fieldset>` };
  }
  if (arq === "artifice") {
    const intel = n(ficha?.atributos?.inteligencia?.total);
    const cri = criacaoDe(nivel, intel, dados.ajustesBonus);
    const cfg = ARQUETIPOS.artifice;
    const temUt = nivel >= cfg.utensilios.nivel;
    const pericias = (ficha?.pericias ?? []).filter(p => !cfg.utensilios.exceto.includes(p.id));
    const html = `<fieldset class="epm-aquisicao"><legend>Livro de Projetos (${cri.livro} receitas)</legend>
      <p class="epm-dica">Pelo menos 1 Consumível e 1 Engenhoca. Projetos de Criação: ${cri.projetos}; Grau máximo ${["", "I", "II", "III", "IV", "V"][cri.grauMax]}.</p>
      <div class="epm-chips-check">${RECEITAS_ARTIFICE.map(r => caixa("receitas", r.id, `${r.nome} (${r.categoria === "engenhoca" ? "Engenhoca" : "Consumível"})`, false, r.efeito)).join("")}</div></fieldset>
      ${temUt ? `<fieldset class="epm-aquisicao"><legend>Utensílios (3 perícias, exceto Luta e Pontaria)</legend><div class="epm-chips-check">${pericias.map(p => caixa("utensilios", p.id, p.nome, (dados.arquetipoOpcoes?.artifice?.utensilios ?? []).includes(p.id))).join("")}</div></fieldset>` : ""}`;
    return {
      html,
      render: raiz => { travar(raiz, "receitas", cri.livro); if (temUt) travar(raiz, "utensilios", 3); },
      validar: raiz => {
        const marc = [...raiz.querySelectorAll('input[name="receitas[]"]:checked')].map(c => RECEITAS_ARTIFICE.find(r => r.id === c.value));
        if (!marc.length) return { ok: true, texto: "Escolha as receitas agora ou depois, na sub-aba Arquétipo." };
        const ok = marc.some(r => r?.categoria === "consumivel") && marc.some(r => r?.categoria === "engenhoca");
        return { ok, texto: ok ? "" : "O Livro precisa de pelo menos 1 Consumível e 1 Engenhoca." };
      },
      salvar: async (actor, r) => {
        const upd = {};
        const ja = new Set(Object.values(actor.flags?.[FLAG]?.artificeLivro ?? {}).map(l => l?.receita).filter(Boolean));
        const livres = Math.max(0, cri.livro - ja.size);
        (r.receitas ?? []).filter(id => !ja.has(id)).slice(0, livres).forEach((id, i) => { upd[`${P}.artificeLivro.assist${Date.now().toString(36)}${i}`] = { receita: id }; });
        if (temUt) upd[`${P}.arquetipoOpcoes.artifice.utensilios`] = (r.utensilios ?? []).slice(0, 3);
        if (Object.keys(upd).length) await actor.update(upd);
      }
    };
  }
  return { html: "" };
}
