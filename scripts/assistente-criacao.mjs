/**
 * Criação de personagem guiada (0.8.23, base): um passo a passo para jogador novo.
 * 1. Nome e conceito · 2. Raça · 3. Atributos (16 pontos) · 4. Arquétipo · 5. Perícias (50 pontos) · 6. Kit inicial.
 * Cada passo pode ser pulado e refeito depois na própria ficha. Feito para ser ajustado pela mesa.
 */
import { FLAG, ATRIBUTOS, REGRAS } from "./config.mjs";
import { escapar } from "./helpers.mjs";

const P = `flags.${FLAG}`;
const n = v => Number(v) || 0;

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

/** Confere os pontos de perícia (50 no nível 1, até 5 por perícia). */
export function conferirPericias(valores = {}) {
  const lista = Object.values(valores).map(n);
  const soma = lista.reduce((a, b) => a + b, 0);
  const erros = [];
  if (soma > REGRAS.periciasIniciais) erros.push(`A soma é ${soma}; o limite é ${REGRAS.periciasIniciais}.`);
  if (lista.some(v => v > REGRAS.periciaLimiteInicial)) erros.push(`No nível 1, cada perícia vai até ${REGRAS.periciaLimiteInicial}.`);
  if (lista.some(v => v < 0)) erros.push("Pontos não podem ser negativos.");
  return { soma, restante: REGRAS.periciasIniciais - soma, ok: !erros.length, erros };
}

async function passo(titulo, numero, conteudo, { pular = true, render } = {}) {
  return foundry.applications.api.DialogV2.wait({
    window: { title: `Criação de personagem · ${numero}/6: ${titulo}` }, classes: ["epm-dialogo", "epm-assistente"], rejectClose: false, modal: true, position: { width: 620 },
    content: `<div class="epm-form-060">${conteudo}</div>`, render,
    buttons: [
      { action: "ok", label: "Próximo", icon: "fa-solid fa-arrow-right", default: true, callback: (ev, b) => Object.fromEntries(new FormData(b.form).entries()) },
      ...(pular ? [{ action: "pular", label: "Pular", icon: "fa-solid fa-forward" }] : []),
      { action: "parar", label: "Parar aqui", icon: "fa-solid fa-xmark" }
    ]
  });
}

/** O passo a passo. Devolve true se chegou ao fim. */
export async function assistenteCriacao(actor) {
  if (!actor?.isOwner) return ui.notifications.warn("Esta ficha não é sua.");
  const dados = actor.flags?.[FLAG] ?? {};
  const { estadoAtor } = await import("./mecanicas.mjs");
  // 1. Nome e conceito
  let r = await passo("Nome e conceito", 1, `<p class="epm-dica">Comece pelo básico. Tudo pode ser mudado depois.</p>
    <label class="epm-campo"><span>Nome</span><input type="text" name="nome" value="${escapar(actor.name)}"></label>
    <label class="epm-campo"><span>Conceito (uma frase)</span><input type="text" name="conceito" value="${escapar(dados.sobre?.conceito ?? "")}" placeholder="Ex.: Caçadora de relíquias que deve a vida a um dragão"></label>`);
  if (r === "parar" || r === null) return false;
  if (r && typeof r === "object") await actor.update({ name: r.nome || actor.name, [`${P}.sobre.conceito`]: r.conceito ?? "" });
  // 2. Raça
  r = await passo("Raça", 2, `<p>A raça dá bônus de atributo, Vida, Mana e Estamina base, deslocamento, tamanho e habilidades raciais.</p><p class="epm-dica">Clique em Próximo para escolher (abre a lista de raças).</p>`);
  if (r === "parar" || r === null) return false;
  if (r && typeof r === "object") { const { escolherRaca } = await import("./ficha-060.mjs"); await escolherRaca(actor); }
  // 3. Atributos
  const atuais = actor.flags?.[FLAG]?.atributos ?? {};
  const campos = Object.entries(ATRIBUTOS).map(([id, a]) => `<label class="epm-campo"><span>${escapar(a.label)}</span><input type="number" name="${id}" min="${REGRAS.atributoMinimoExcecao}" max="${REGRAS.atributoExcecao}" value="${n(atuais[id]?.base)}" data-atr></label>`).join("");
  r = await passo("Atributos", 3, `<p>Distribua <strong>${REGRAS.atributosIniciais} pontos</strong>. Máximo ${REGRAS.atributoMaxInicial} por atributo (um pode ir a ${REGRAS.atributoExcecao} se dois ficarem em ${REGRAS.atributoMinimoExcecao}). O bônus da raça entra à parte.</p>
    <div class="epm-dialogo-linha epm-assistente-grade">${campos}</div><p class="epm-dica" data-resto></p>`, {
    render: (ev, dlg) => {
      const raiz = dlg?.element ?? ev?.target?.element; if (!raiz) return;
      const atualizar = () => {
        const v = Object.fromEntries([...raiz.querySelectorAll("[data-atr]")].map(i => [i.name, i.value]));
        const c = conferirAtributos(v);
        raiz.querySelector("[data-resto]").textContent = c.ok ? `Restam ${c.restante} pontos.` : c.erros.join(" ");
      };
      raiz.querySelectorAll("[data-atr]").forEach(i => i.addEventListener("input", atualizar)); atualizar();
    }
  });
  if (r === "parar" || r === null) return false;
  if (r && typeof r === "object") {
    const c = conferirAtributos(r);
    if (!c.ok) ui.notifications.warn(`Atributos salvos com aviso: ${c.erros.join(" ")}`);
    await actor.update(Object.fromEntries(Object.keys(ATRIBUTOS).map(id => [`${P}.atributos.${id}.base`, n(r[id])])));
  }
  // 4. Arquétipo
  r = await passo("Arquétipo", 4, `<p>O arquétipo define o estilo e libera habilidades por nível.</p>
    <label class="epm-campo"><span>Arquétipo</span><select name="arq"><option value="combatente">Combatente: luta, armas e resistência</option><option value="conjurador">Conjurador: magia e Mana</option><option value="artifice">Artífice: projetos, engenhocas e criação</option></select></label>`);
  if (r === "parar" || r === null) return false;
  if (r && typeof r === "object") { const X = await import("./extras.mjs"); await X.definirArquetipo(actor, r.arq); if (!n(actor.flags?.[FLAG]?.nivel)) await actor.update({ [`${P}.nivel`]: 1 }); }
  // 5. Perícias
  const { ficha } = estadoAtor(actor);
  const linhas = ficha.pericias.map(p => `<label class="epm-campo"><span>${escapar(p.nome)}</span><input type="number" name="${p.id}" min="0" max="${REGRAS.periciaLimiteInicial}" value="${n(p.pontos)}" data-per></label>`).join("");
  r = await passo("Perícias", 5, `<p>Distribua <strong>${REGRAS.periciasIniciais} pontos</strong>, até ${REGRAS.periciaLimiteInicial} por perícia. Os atributos somam sozinhos.</p>
    <div class="epm-dialogo-linha epm-assistente-grade" style="max-height:380px;overflow-y:auto">${linhas}</div><p class="epm-dica" data-resto></p>`, {
    render: (ev, dlg) => {
      const raiz = dlg?.element ?? ev?.target?.element; if (!raiz) return;
      const atualizar = () => {
        const v = Object.fromEntries([...raiz.querySelectorAll("[data-per]")].map(i => [i.name, i.value]));
        const c = conferirPericias(v);
        raiz.querySelector("[data-resto]").textContent = c.ok ? `Restam ${c.restante} pontos.` : c.erros.join(" ");
      };
      raiz.querySelectorAll("[data-per]").forEach(i => i.addEventListener("input", atualizar)); atualizar();
    }
  });
  if (r === "parar" || r === null) return false;
  if (r && typeof r === "object") {
    const c = conferirPericias(r);
    if (!c.ok) ui.notifications.warn(`Perícias salvas com aviso: ${c.erros.join(" ")}`);
    await actor.update(Object.fromEntries(Object.entries(r).filter(([id]) => ficha.periciaPorId[id]).map(([id, v]) => [`${P}.pericias.${id}.pontos`, n(v)])));
  }
  // 6. Kit inicial
  r = await passo("Equipamento inicial", 6, `<p>Escolha um kit do seu arquétipo (armas, armadura, kit de aventura e moedas).</p><p class="epm-dica">Clique em Próximo para ver os kits.</p>`);
  if (r && typeof r === "object") { const { kitInicial } = await import("./ficha-060.mjs"); await kitInicial(actor); }
  await actor.update({ [`${P}.assistenteFeito`]: true });
  ui.notifications.info(`${actor.name} está pronto! Revise a ficha no modo edição se quiser mudar algo.`);
  return true;
}
