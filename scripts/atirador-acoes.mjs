/**
 * Atirador Arcano: ações da ficha (criar ou imbuir a Arma Mágica, Starlight Step, circuitos, Sobrecarga Arcana,
 * Câmara de Acúmulo e Magia Aplicada). As regras puras ficam em atirador-arcano.mjs.
 */
import { FLAG, ATRIBUTOS } from "./config.mjs";
import { int } from "./data.mjs";
import { escapar, fvtt } from "./helpers.mjs";
import { estadoAtor, rolarTeste } from "./mecanicas.mjs";
import { custoRecurso } from "./extras.mjs";
import { ITENS_CATALOGO, dadosItemCatalogo, REGIOES_CATALOGO } from "./itens-catalogo.mjs";
import {
  CATEGORIAS_ARMA_MAGICA, CIRCUITOS, CUSTO_CIRCUITO, SOBRECARGAS, CUSTO_SOBRECARGA, MELHORIAS_MAESTRIA, MAX_CARGAS_CAMARA,
  formulaCriacao, custoSangue, categoriaSugerida, usosStarlight, categoriaDoCusto
} from "./atirador-arcano.mjs";

const P = `flags.${FLAG}`;
const COR = "#9C8CF0";

const nota = (actor, html) => ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor }),
  content: `<div class="epm-chat epm-chat-nota" style="--epm-cor-cartao:${COR}">${html}</div>`
});

/** Estado da classe com o Núcleo da ficha (Starlight Step). */
export function atiradorDoAtor(actor) {
  const { ficha, dados } = estadoAtor(actor);
  const aa = ficha.extras?.classe?.atirador;
  if (!aa) return null;
  const max = aa.nivel >= 15 ? usosStarlight(ficha.atributos?.nucleo?.total, aa.nivelPersonagem) : 0;
  return { ...aa, starlight: aa.starlight ? { ...aa.starlight, max, usados: Math.min(max, int(dados.classeEpm?.starlightUsos)) } : null, ficha, dados };
}

/** Armas de disparo do catálogo (as que usam Pontaria). */
export const armasDeDisparo = () => ITENS_CATALOGO.filter(x => x.tipo === "weapon" && x.arma?.pericia === "pontaria" && !/granada|azagaia|dardo/i.test(x.nome));

/** Gasta PM, PE e PV juntos (ou nada, se faltar algum). */
async function pagar(actor, ficha, { pm = 0, pe = 0, pv = 0 }, motivo) {
  const upd = {};
  for (const [rec, v] of [["pm", pm], ["pe", pe]]) {
    if (!v) continue;
    const c = custoRecurso(ficha, rec, v);
    if (!c.ok) { ui.notifications.warn(`${motivo}: faltam ${c.falta} ${rec.toUpperCase()}.`); return false; }
    Object.assign(upd, c.updates);
  }
  if (pv) upd["system.attributes.hp.value"] = Math.max(0, int(actor.system?.attributes?.hp?.value) - pv);
  if (Object.keys(upd).length) await actor.update(upd);
  return true;
}

/**
 * Criar (porte do catálogo, custo em PM ou com sangue) ou imbuir uma arma de disparo do inventário.
 * Só uma Arma Mágica por vez: a anterior criada some; a imbuída anterior volta a ser uma arma comum.
 */
export async function criarArmaMagica(actor) {
  const aa = atiradorDoAtor(actor);
  if (!aa) return ui.notifications.warn("A Arma Mágica é do Atirador Arcano (Conjurador nível 3+).");
  const { ficha } = aa;
  const doInventario = actor.items.filter(i => i.type === "weapon" && !i.flags?.[FLAG]?.armaMagicaCriada && (i.flags?.[FLAG]?.periciaAtaque === "pontaria" || i.flags?.[FLAG]?.armaMagica));
  const liberaGenesis = game.user.isGM;
  const opcoesCat = Object.entries(CATEGORIAS_ARMA_MAGICA).map(([id, c]) => `<option value="${id}">${escapar(c.label)} (${escapar(c.exemplos)})</option>`).join("");
  const porRegiao = Object.keys(REGIOES_CATALOGO).map(r => {
    const lista = armasDeDisparo().filter(x => x.regiao === r);
    if (!lista.length) return "";
    const bloqueada = r === "genesis" && !liberaGenesis;
    return `<optgroup label="${escapar(REGIOES_CATALOGO[r])}${bloqueada ? " (só com o Mestre)" : ""}">${lista.map(x => `<option value="${escapar(x.id)}" data-cat="${categoriaSugerida(x.nome, x.peso)}" ${bloqueada ? "disabled" : ""}>${escapar(x.nome)} · ${escapar(x.arma.dano)} ${escapar(x.arma.tipoDano)}</option>`).join("")}</optgroup>`;
  }).join("");
  const circuitos = aa.circuitos.length;
  const content = `
    <p class="epm-dica">Crie uma arma de disparo com a sua mana (ela usa o dano, o alcance e o funcionamento da arma equivalente) ou imbua uma arma de disparo que você já tem. ${aa.variasArmas ? "O Mestre permitiu mais de uma Arma Mágica: a atual continua." : "Só uma Arma Mágica por vez: a atual deixa de ser."}</p>
    <fieldset class="epm-aquisicao"><legend>Arma</legend>
      <label class="epm-check"><input type="radio" name="modo" value="criar" checked> Criar a partir de uma arma conhecida</label>
      <label class="epm-campo"><span>Arma equivalente</span><select name="catalogo">${porRegiao}</select></label>
      <label class="epm-check"><input type="radio" name="modo" value="imbuir" ${doInventario.length ? "" : "disabled"}> Imbuir uma arma do inventário${doInventario.length ? " (sem custo)" : " (nenhuma arma de disparo no inventário)"}</label>
      ${doInventario.length ? `<label class="epm-campo"><span>Arma do inventário</span><select name="item">${doInventario.map(i => `<option value="${i.id}">${escapar(i.name)}</option>`).join("")}</select></label>` : ""}
      <label class="epm-campo"><span>Porte</span><select name="categoria">${opcoesCat}</select></label>
    </fieldset>
    <fieldset class="epm-aquisicao"><legend>Custo da criação</legend>
      <label class="epm-check"><input type="radio" name="origem" value="foco" checked> Com o Foco Arcano</label>
      <label class="epm-check"><input type="radio" name="origem" value="sangue"> Arma de Sangue: paga também PV (metade do custo em PM); dano metade Balístico, metade Sangue</label>
      ${aa.maestria ? `<p class="epm-rotulo">Maestria Arcana: custa duas categorias abaixo. Instalar também:</p>${MELHORIAS_MAESTRIA.map(m => `<label class="epm-check"><input type="checkbox" name="mel_${m.id}"> ${escapar(m.label)} (+${m.pm} PM)</label>`).join("")}` : ""}
      <p class="epm-dica" data-custo>${circuitos ? `+${circuitos * CUSTO_CIRCUITO} PM dos ${circuitos} circuito(s) instalado(s). ` : ""}Criar leva 1 minuto fora de combate ou uma Ação Padrão em combate. Você precisa conhecer o funcionamento da arma.</p>
    </fieldset>`;
  const escolha = await fvtt.DialogV2.wait({
    window: { title: "Arma Mágica (Atirador Arcano)", icon: "fa-solid fa-crosshairs" }, classes: ["epm-dialogo", "epm-dialogo-arma-magica"], rejectClose: false, modal: true, content,
    position: { width: 520 },
    render: (ev, dlg) => {
      const el = dlg?.element ?? ev?.target?.element;
      const cat = el?.querySelector?.('[name="categoria"]'), sel = el?.querySelector?.('[name="catalogo"]');
      const sugerir = () => { const c = sel?.selectedOptions?.[0]?.dataset?.cat; if (c && cat) cat.value = c; };
      sel?.addEventListener("change", sugerir); sugerir();
    },
    buttons: [
      {
        action: "ok", label: "Pronto", icon: "fa-solid fa-check", default: true,
        callback: (ev, b) => {
          const f = b.form.elements;
          return {
            modo: f.modo.value, catalogo: f.catalogo?.value ?? "", item: f.item?.value ?? "", categoria: f.categoria.value, origem: f.origem.value,
            melhorias: MELHORIAS_MAESTRIA.filter(m => f[`mel_${m.id}`]?.checked).map(m => m.id)
          };
        }
      },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!escolha || typeof escolha !== "object") return null;
  const categoria = CATEGORIAS_ARMA_MAGICA[escolha.categoria] ? escolha.categoria : "pequena";
  // Só uma Arma Mágica por vez, a não ser que o Mestre permita mais (opção no painel da classe)
  const anteriores = aa.variasArmas ? [] : actor.items.filter(i => i.flags?.[FLAG]?.armaMagica);

  if (escolha.modo === "imbuir") {
    const item = actor.items.get(escolha.item);
    if (!item) return ui.notifications.warn("Escolha a arma do inventário.");
    await desfazerAnteriores(actor, anteriores.filter(i => i.id !== item.id));
    await item.update({ [`${P}.armaMagica`]: true, [`${P}.armaMagicaCategoria`]: categoria, [`${P}.armaMagicaCriada`]: false, [`${P}.armaMagicaSangue`]: false });
    return nota(actor, `<p><strong>Arma Mágica:</strong> ${escapar(item.name)} imbuída com mana (${escapar(CATEGORIAS_ARMA_MAGICA[categoria].label)}). Ataques com ela usam Arcanismo + Núcleo.</p>`);
  }

  const x = armasDeDisparo().find(a => a.id === escolha.catalogo);
  if (!x) return ui.notifications.warn("Escolha a arma equivalente.");
  if (x.regiao === "genesis" && !liberaGenesis) return ui.notifications.warn("Armas de Gênesis só com autorização do Mestre.");
  const formula = formulaCriacao(categoria, aa.nivel, { circuitos, melhorias: escolha.melhorias });
  const roll = new Roll(formula);
  await roll.evaluate();
  const pm = roll.total;
  const sangue = escolha.origem === "sangue";
  const s = sangue ? custoSangue(pm, ficha.recursos?.pv?.max) : { pv: 0, atordoa: false };
  if (!(await pagar(actor, ficha, { pm, pv: s.pv }, "Arma Mágica"))) return null;
  await desfazerAnteriores(actor, anteriores);
  const doc = dadosItemCatalogo(x);
  Object.assign(doc.flags[FLAG], {
    armaMagica: true, armaMagicaCategoria: categoria, armaMagicaCriada: true, armaMagicaSangue: sangue,
    armaMagicaMelhorias: escolha.melhorias, ...(sangue ? { tipoDano: "Balístico" } : {})
  });
  doc.name = `${x.nome} (Arma Mágica)`;
  doc.system.equipped = true;
  doc.system.price = { value: 0, denomination: "gp" };
  const [criado] = await actor.createEmbeddedDocuments("Item", [doc]);
  if (s.atordoa) { try { await actor.toggleStatusEffect("epm-atordoado", { active: true }); } catch (err) { console.warn("EPM |", err); } }
  const catCusto = categoriaDoCusto(categoria, aa.nivel);
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `<span class="epm-flavor"><strong>Arma Mágica: ${escapar(criado?.name ?? x.nome)}</strong> (${escapar(CATEGORIAS_ARMA_MAGICA[categoria].label)}${catCusto !== categoria ? `, custo de ${escapar(CATEGORIAS_ARMA_MAGICA[catCusto].label)} pela Maestria Arcana` : ""}): ${pm} PM${sangue ? ` e ${s.pv} PV (Arma de Sangue; dano metade Balístico, metade Sangue)` : ""}${s.atordoa ? ". Pagou mais da metade dos PV máximos: Atordoado por 1 turno" : ""}${escolha.melhorias.length ? `. Melhorias da Maestria: ${escapar(MELHORIAS_MAESTRIA.filter(m => escolha.melhorias.includes(m.id)).map(m => m.label).join(", "))}` : ""}.</span>`
  });
  return criado;
}

async function desfazerAnteriores(actor, itens) {
  const apagar = itens.filter(i => i.flags?.[FLAG]?.armaMagicaCriada).map(i => i.id);
  const voltar = itens.filter(i => !i.flags?.[FLAG]?.armaMagicaCriada);
  if (apagar.length) await actor.deleteEmbeddedDocuments("Item", apagar);
  for (const i of voltar) await i.update({ [`${P}.armaMagica`]: false });
}

/** Starlight Step: Ação Livre depois do deslocamento. Aprimorado (Nv. 42): alcance = deslocamento, +10 PE. */
export async function starlightStep(actor, { aprimorado = false } = {}) {
  const aa = atiradorDoAtor(actor);
  if (!aa?.starlight) return ui.notifications.warn("Starlight Step libera no nível 15 do Atirador Arcano.");
  const { max, usados } = aa.starlight;
  if (usados >= max) return ui.notifications.warn(`Starlight Step: os ${max} usos deste descanso longo já foram.`);
  if (aprimorado && !aa.starlight.aprimorado) return;
  if (aprimorado && !(await pagar(actor, aa.ficha, { pe: 10 }, "Starlight Step Aprimorado"))) return;
  await actor.update({ [`${P}.classeEpm.starlightUsos`]: usados + 1 });
  const alcance = aprimorado ? `até o seu deslocamento (${String(aa.ficha.deslocamento?.final ?? "").replace(".", ",")} m)` : "até 1,5 m";
  return nota(actor, `<p><strong>Starlight Step${aprimorado ? " Aprimorado" : ""}</strong> (Ação Livre): teleporta ${escapar(alcance)} depois do deslocamento, sem provocar Ataques de Oportunidade. Não atravessa paredes nem barreiras fechadas. ${usados + 1}/${max} neste descanso${aprimorado ? " · 10 PE" : ""}.</p>`);
}

/** Instala ou tira um circuito. Instalar é reconfigurar a arma: 5 PM por circuito. */
export async function alternarCircuito(actor, id) {
  const aa = atiradorDoAtor(actor);
  if (!aa || !CIRCUITOS[id]) return;
  const lista = [...aa.circuitos];
  const i = lista.indexOf(id);
  if (i >= 0) lista.splice(i, 1);
  else {
    if (lista.length >= aa.maxCircuitos) return ui.notifications.warn(`No seu nível: até ${aa.maxCircuitos} circuito${aa.maxCircuitos > 1 ? "s" : ""}.`);
    if (!(await pagar(actor, aa.ficha, { pm: CUSTO_CIRCUITO }, `Circuito ${CIRCUITOS[id].nome}`))) return;
    lista.push(id);
    await nota(actor, `<p><strong>Circuito instalado:</strong> ${escapar(CIRCUITOS[id].nome)}. ${escapar(CIRCUITOS[id].texto)} (${CUSTO_CIRCUITO} PM)</p>`);
  }
  return actor.update({ [`${P}.classeEpm.circuitos`]: lista });
}

/** Sobrecarga Arcana: Ação Bônus, 6 PM e 4 PE, 3 rodadas; uma configuração por vez. */
export async function sobrecargaArcana(actor, id) {
  const aa = atiradorDoAtor(actor);
  if (!aa || aa.nivel < 27) return;
  if (!id || aa.sobrecarga === id) return actor.update({ [`${P}.classeEpm.sobrecarga`]: "" });
  if (!SOBRECARGAS[id]) return;
  if (aa.dados.acoes?.bonus) return ui.notifications.warn("Sobrecarga Arcana usa a Ação Bônus, que já foi gasta.");
  if (!(await pagar(actor, aa.ficha, { pm: CUSTO_SOBRECARGA.pm, pe: CUSTO_SOBRECARGA.pe }, "Sobrecarga Arcana"))) return;
  await actor.update({ [`${P}.classeEpm.sobrecarga`]: id, [`${P}.acoes.bonus`]: true });
  return nota(actor, `<p><strong>Sobrecarga Arcana: ${escapar(SOBRECARGAS[id].nome)}</strong> por ${CUSTO_SOBRECARGA.rodadas} rodadas. ${escapar(SOBRECARGAS[id].texto)} (Ação Bônus, ${CUSTO_SOBRECARGA.pm} PM e ${CUSTO_SOBRECARGA.pe} PE)</p>`);
}

/** Câmara de Acúmulo: +1 carga no fim do turno parado e sem atacar (máx. 2); −1 para tirar. */
export async function cargaCamara(actor, delta = 1) {
  const aa = atiradorDoAtor(actor);
  if (!aa?.camara) return;
  const novo = Math.max(0, Math.min(MAX_CARGAS_CAMARA, aa.cargas + delta));
  return actor.update({ [`${P}.classeEpm.cargas`]: novo });
}

/** Magia Aplicada: 2 PM e 2 PE para usar Núcleo no lugar do atributo-base numa perícia técnica. */
export async function magiaAplicada(actor) {
  const aa = atiradorDoAtor(actor);
  if (!aa?.magiaAplicada) return;
  const pericias = aa.ficha.pericias ?? [];
  const id = await fvtt.DialogV2.wait({
    window: { title: "Magia Aplicada" }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p class="epm-dica">Testes sobre mecanismos, tecnologia, armamentos, trajetórias, circuitos ou sistemas arcanos (o Mestre decide). Não vale para testes sociais.</p>
      <label class="epm-campo"><span>Perícia</span><select name="pericia">${pericias.map(p => `<option value="${escapar(p.id)}" ${p.id === "tecnologia" ? "selected" : ""}>${escapar(p.nome)} (${escapar(p.atributoAbrev)})</option>`).join("")}</select></label>`,
    buttons: [
      { action: "ok", label: "Rolar (2 PM e 2 PE)", icon: "fa-solid fa-dice-d20", default: true, callback: (ev, b) => b.form.elements.pericia.value },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  const per = pericias.find(p => p.id === id);
  if (!per) return;
  if (!(await pagar(actor, aa.ficha, { pm: 2, pe: 2 }, "Magia Aplicada"))) return;
  const nucleo = int(aa.ficha.atributos?.nucleo?.total);
  return rolarTeste(actor, {
    rotulo: `${per.nome} com Núcleo (Magia Aplicada)`, bonus: per.bonusProprio + nucleo + int(per.testeMod),
    desvantagens: per.desvantagem, vantagens: per.vantagem, nota: `${ATRIBUTOS.nucleo?.abrev ?? "Núcleo"} ${nucleo} no lugar de ${per.atributoAbrev} · 2 PM e 2 PE`
  });
}


/** O Mestre libera (ou não) mais de uma Arma Mágica ao mesmo tempo nesta ficha. */
export async function variasArmasMagicas(actor) {
  if (!game.user.isGM) return ui.notifications.warn("Só o Mestre libera mais de uma Arma Mágica.");
  const atual = !!actor.flags?.[FLAG]?.classeEpm?.variasArmas;
  return actor.update({ [`${P}.classeEpm.variasArmas`]: !atual });
}
