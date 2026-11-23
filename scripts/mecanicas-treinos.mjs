/**
 * Treinamentos (horas do dia, PT, minijogos, treino em grupo) e moedas guardadas em mochilas.
 * Separado de mecanicas.mjs na 0.8.23; mecanicas.mjs reexporta tudo, então quem importa de lá continua funcionando.
 */
import { MOEDAS, UNIDADES_TEMPO, FLAG, TREINO, MINIJOGOS, PT_POR_ACERTOS } from "./config.mjs";
import { especiaisDaFicha } from "./treinamentos-lista.mjs";
import { num, limitar, int } from "./data.mjs";
import { escapar, fvtt } from "./helpers.mjs";
import { confirmar, estadoAtor, falar } from "./mecanicas.mjs";

const P = `flags.${FLAG}`;

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
  // Mentor (treino): quem treina junto com um Mentor ganha +1 PT por dia de treino
  const { especiaisDaFicha, MENTOR_PT_POR_DIA } = await import("./treinamentos-lista.mjs");
  const mentores = comQuem.map(u => { try { return fromUuidSync(u); } catch { return null; } })
    .filter(a => a?.flags?.[FLAG] && especiaisDaFicha(a.flags[FLAG]).has("mentor"));
  const ptMentor = mentores.length ? MENTOR_PT_POR_DIA * Math.max(1, Math.round(horas / TREINO.horasDia)) : 0;
  await actor.update({
    ...pago.updates,
    ...(ptMentor ? { [`${P}.pontos.pt`]: int(estadoAtor(actor).ficha.pontos.pt) + ptMentor } : {}),
    [`${P}.treinamentos.${id}.horasFeitas`]: agora, [`${P}.treinoDia.horas`]: usadas + horas,
    ...(concluiu ? { [`${P}.treinamentos.${id}.estado`]: "concluido" } : {})
  });
  const nomes = comQuem.map(u => { try { return fromUuidSync(u)?.name; } catch { return null; } }).filter(Boolean);
  const extra = [
    nomes.length ? `Treinou com ${nomes.join(", ")}: +25% (${horas} h contam ${ganho} h).` : "",
    ptMentor ? `Mentor (${mentores.map(a => a.name).join(", ")}): +${ptMentor} PT.` : "",
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
