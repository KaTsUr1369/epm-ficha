/**
 * Atualiza as fichas e itens que já existem quando o módulo muda (roda no Mestre ativo ao abrir o mundo).
 * Cada passo confere item por item e só mexe no que está desatualizado (pode rodar sempre).
 */
import { FLAG, COR_PADRAO_ANTIGA } from "./config.mjs";

const P = `flags.${FLAG}`;

/** Todos os itens do mundo: soltos e dentro das fichas. */
function todosItens() {
  const out = [...(game.items ?? [])];
  for (const a of game.actors ?? []) out.push(...(a.items ?? []));
  return out;
}

/** Magias importadas pelo leitor antigo (site PF2 SRD): tira o link errado e aponta para o Códex do Vazio. */
async function corrigirMagiasPf2(itens) {
  const { CODEX_URL } = await import("./codex.mjs");
  let n = 0;
  for (const item of itens) {
    const f = item.flags?.[FLAG];
    if (item.type !== "spell" || f?.origemExterna?.site !== "pf2srd" || f?.origemCorrigida) continue;
    const desc = String(item.system?.description?.value ?? "");
    const nova = desc.replace(/<p class="epm-dica">Importada do Codex do Vazio[\s\S]*?<\/p>/, `<p class="epm-dica">Importada de uma versão antiga do módulo, de outro site (não é do Códex do Vazio). Para pegar a versão do <a href="${CODEX_URL}" target="_blank" rel="noopener">Códex do Vazio</a>, use o botão Códex do Vazio na aba Magias.</p>`);
    await item.update({ "system.description.value": nova, [`${P}.origemCorrigida`]: true, [`${P}.origemExterna.url`]: "" });
    n++;
  }
  return n;
}

/** Itens prontos do Escudo (Hydrakariel): versão nova troca formas, efeitos e texto, mantendo equipado e passiva. */
async function atualizarItensProntos(itens) {
  const { itemProntoPorId } = await import("./itens-prontos.mjs");
  let n = 0;
  for (const item of itens) {
    const f = item.flags?.[FLAG];
    const pronto = f?.pronto ? itemProntoPorId(f.pronto) : null;
    if (!pronto) continue;
    const novo = pronto.dados();
    const nf = novo.flags[FLAG];
    if ((f.prontoVersao ?? 1) >= (nf.prontoVersao ?? 1)) continue;
    await item.update({ [`${P}.-=formas`]: null, [`${P}.-=efeitos`]: null });
    await item.update({ [`${P}.formas`]: nf.formas, [`${P}.efeitos`]: nf.efeitos, [`${P}.prontoVersao`]: nf.prontoVersao, "system.description.value": novo.system.description.value });
    n++;
  }
  return n;
}

/** Tipos de dano com nome antigo (Elétrico, Gelo, Trovejante, Pressão, Arcano, Sangue…) viram os da lista nova. */
export function renomearTipoTexto(texto, mapa) {
  let t = String(texto ?? "");
  for (const [velho, novo] of Object.entries(mapa)) {
    t = t.replace(new RegExp(`(^|[^\\p{L}])${velho}(?=$|[^\\p{L}])`, "gu"), `$1${novo}`);
  }
  return t;
}
const CHAVE_TIPO = /^(tipoDano|resTipo|tipoDanoExtra|rdTipo)$/;
const LISTAS_TIPO = ["resistencias", "vulnerabilidades", "imunidades"];
export function trocasTiposDano(flags, mapa, prefixo = P) {
  const upd = {};
  const andar = (o, caminho, dentroLista = false) => {
    if (!o || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o)) {
      const c = `${caminho}.${k}`;
      if (typeof v === "string" && (CHAVE_TIPO.test(k) || dentroLista)) {
        const novo = renomearTipoTexto(v, mapa);
        if (novo !== v) upd[c] = novo;
      } else if (Array.isArray(v) && LISTAS_TIPO.includes(k)) {
        const nova = v.map(x => typeof x === "string" ? renomearTipoTexto(x, mapa) : x);
        if (JSON.stringify(nova) !== JSON.stringify(v)) upd[c] = nova;
      } else if (v && typeof v === "object" && !Array.isArray(v)) andar(v, c);
    }
  };
  andar(flags, prefixo);
  return upd;
}

async function renomearTiposDano(itens) {
  const { TIPOS_DANO_ANTIGOS } = await import("./config.mjs");
  let n = 0;
  for (const doc of [...(game.actors ?? []), ...itens]) {
    const f = doc.flags?.[FLAG];
    if (!f || f.tiposDanoV2) continue;
    const upd = trocasTiposDano(f, TIPOS_DANO_ANTIGOS);
    await doc.update({ ...upd, [`${P}.tiposDanoV2`]: true }, { render: false });
    if (Object.keys(upd).length) n++;
  }
  return n;
}

/**
 * Habilidades de arquétipo criadas pelos modelos: acompanham o texto e o nível do livro atual
 * (ex.: Magia 3 do Conjurador passou do nível 26 para o 19). Só mexe se o texto ainda é o do modelo.
 */
export async function sincronizarHabilidadesArquetipo(itens) {
  const { ARQUETIPOS } = await import("./arquetipos.mjs");
  const { escapar } = await import("./helpers.mjs");
  let n = 0;
  for (const item of itens) {
    const ref = item.flags?.[FLAG]?.arquetipoRef;
    if (!ref) continue;
    const [arqId] = String(ref).split(":");
    const a = ARQUETIPOS[arqId];
    const h = a?.habilidades?.find(x => x.nome === item.name);
    if (!h) continue;
    const desc = String(item.system?.description?.value ?? "");
    if (!/\(modelo 0\.5\)/.test(desc)) continue;
    const nova = `<p>${escapar(h.resumo)}</p><p class="epm-dica">${escapar(a.nome)}, nível ${h.nivel} (modelo 0.5).</p>`;
    const novoRef = `${arqId}:${h.nivel}`;
    if (desc === nova && ref === novoRef) continue;
    await item.update({ "system.description.value": nova, [`${P}.arquetipoRef`]: novoRef }, { render: false });
    n++;
  }
  return n;
}

/** Habilidades de arquétipo que mudaram de nome ou saíram nos PDFs balanceados (0.8.20). null = saiu. */
const ARQ_RENOMEADAS_0820 = {
  "Especialista em Campo": "Comando de Campo", "Especialista em Campo 2.0": "Comando de Campo 2.0",
  "Ataque Extra 6.0": null, "Reserva Arcana 2.0": "Reserva Arcana 2.0", "Reserva Arcana 3.0": "Sobrecarga 2.0 e Reserva Arcana 3.0"
};

/** Habilidades de arquétipo que só existem a partir dos PDFs balanceados: entram em quem já usa o modelo. */
const ARQ_NOVAS_0820 = new Set(["Fôlego de Combate", "Fôlego de Combate 2.0", "Fôlego de Combate 3.0", "Comando de Campo", "Comando de Campo 2.0",
  "Caçador Natural 2.0", "Caçador Natural 3.0", "Sobrecarga 2.0 e Reserva Arcana 3.0", "Modificações Permanentes 2.0"]);

/**
 * Arquétipos e classes balanceados (0.8.20), uma vez por ficha:
 * - habilidades de arquétipo renomeadas acompanham; as que saíram somem (só se o texto ainda é o do modelo);
 * - quem já usa as habilidades do modelo ganha as novas liberadas no nível (ex.: Fôlego de Combate, Caçador Natural 2.0);
 * - habilidades de classe pronta acompanham a classe reescrita (pelo nível), com o texto novo; as liberadas que faltam entram.
 */
export async function arquetiposEClasses0820() {
  const { ARQUETIPOS, nivelArquetipo } = await import("./arquetipos.mjs");
  const { CLASSES_NOTION, habilidadesDaClasse } = await import("./regras-extras.mjs");
  const X = await import("./extras.mjs");
  const { escapar } = await import("./helpers.mjs");
  let n = 0;
  for (const a of game.actors ?? []) {
    const f = a.flags?.[FLAG];
    if (!f || f.classes0820) continue;
    const upd = [], apagar = [], criar = [];
    const itens = a.items?.contents ?? [];
    // Arquétipo
    const usaModelo = new Set();
    for (const it of itens) {
      const ref = it.flags?.[FLAG]?.arquetipoRef;
      if (!ref) continue;
      const [arqId] = String(ref).split(":");
      usaModelo.add(arqId);
      const desc = String(it.system?.description?.value ?? "");
      const modelo = /\(modelo 0\.5\)/.test(desc);
      const novo = it.name in ARQ_RENOMEADAS_0820 ? ARQ_RENOMEADAS_0820[it.name] : it.name;
      const h = novo ? ARQUETIPOS[arqId]?.habilidades?.find(x => x.nome === novo) : null;
      // Saiu do livro, ou agora só libera num nível acima do personagem: some (só a do modelo; a escrita pelo jogador fica).
      if (!h || h.nivel > nivelArquetipo(f, arqId)) { if (modelo) apagar.push(it.id); continue; }
      const textoNovo = X.dadosHabilidadeArquetipo(arqId, h).system.description.value;
      if (it.name === h.nome && ref === `${arqId}:${h.nivel}` && (!modelo || desc === textoNovo)) continue;
      upd.push({ _id: it.id, name: h.nome, ...(modelo ? { "system.description.value": textoNovo } : {}), [`${P}.arquetipoRef`]: `${arqId}:${h.nivel}` });
    }
    for (const arqId of usaModelo) {
      const arq = ARQUETIPOS[arqId];
      const nivel = nivelArquetipo(f, arqId);
      const nomes = new Set([...itens.filter(i => !apagar.includes(i.id)).map(i => i.name), ...upd.map(u => u.name)]);
      for (const h of arq?.habilidades ?? []) if (ARQ_NOVAS_0820.has(h.nome) && h.nivel <= nivel && !nomes.has(h.nome)) criar.push(X.dadosHabilidadeArquetipo(arqId, h));
    }
    // Classe
    const cl = X.classeDaFicha(f);
    if (cl && ["guerreiroElemental", "alice", "cacador", "trovador", "bastiao", "guerreiroVazio", "vitalista", "mecanicoGuerra", "atiradorArcano"].includes(cl.id)) {
      const novas = habilidadesDaClasse(cl.id);
      const def = CLASSES_NOTION[cl.id];
      const vistas = new Set();
      for (const it of itens) {
        const ref = it.flags?.[FLAG]?.classeRef;
        if (!ref || ref.split(":")[0] !== cl.id) continue;
        const desc = String(it.system?.description?.value ?? "");
        const nivelVelho = Number(desc.match(/nível (\d+)/)?.[1]) || novas.find(h => h.ref === ref)?.nivel;
        const h = novas.find(x => x.ref === ref) ?? novas.find(x => x.nivel === nivelVelho && !x.caminho);
        if (!h) continue;
        vistas.add(h.ref);
        const modelo = desc.includes(`${escapar(def.nome)}, nível`);
        if (it.name === h.nome && ref === h.ref && !modelo) continue;
        upd.push({ _id: it.id, name: h.nome, [`${P}.classeRef`]: h.ref, ...(modelo ? { "system.description.value": X.dadosHabilidadeClasse(cl.id, h).system.description.value } : {}) });
      }
      const jaTem = new Set([...itens.map(i => i.flags?.[FLAG]?.classeRef).filter(Boolean), ...vistas]);
      const dispensadas = new Set(Array.isArray(f.classeDispensadas) ? f.classeDispensadas : []);
      for (const h of novas) if (h.nivel <= cl.nivel && !h.caminho && !jaTem.has(h.ref) && !dispensadas.has(h.ref)) criar.push(X.dadosHabilidadeClasse(cl.id, h));
    }
    if (apagar.length) await a.deleteEmbeddedDocuments("Item", apagar, { epmMigracao: true });
    if (upd.length) await a.updateEmbeddedDocuments("Item", upd, { render: false });
    if (criar.length) await a.createEmbeddedDocuments("Item", criar, { render: false });
    await a.update({ [`${P}.classes0820`]: true }, { render: false });
    if (apagar.length || upd.length || criar.length) n++;
  }
  return n;
}

/** Valores que eram o padrão antigo do livro e ficaram gravados na ficha: voltam a seguir o livro novo (0.8.13). */
const ANTIGOS_0813 = {
  tabela: { combatente: { pv: 20, pe: 16, pm: 12 } },
  ajustes: { "arq-estilo-duelista-acertoisolado": 5, "arq-estilo-bebado-acerto": 5, "arq-estilo-bebado-esquiva": 2, "arq-estilo-bebado-ca": 2,
    "arq-estilo-dupla-acerto": 3, "arq-estilo-dupla-ca": 2, "arq-estilo-atirador-margem": 2 },
  numeros: { "estilo.duelista.acertoIsolado": 5, "estilo.bebado.acerto": 5, "estilo.bebado.esquiva": 2, "estilo.bebado.ca": 2,
    "estilo.atirador.margem": 2, "estilo.dupla.acerto": 3, "estilo.dupla.ca": 2 }
};
/** Padrões da 0.8.13 que mudaram nos PDFs balanceados (0.8.20): quem tinha o padrão gravado passa a seguir o livro. */
const ANTIGOS_0820 = {
  ajustes: { "arq-estilo-duelista-acertoisolado": 3, "arq-estilo-dupla-acerto": 2, "arq-estilo-atirador-margem": 4, "arq-estilo-atirador-margemsempre": 1,
    "arq-reflexos-de-combate": 5, "cla-ge-corpo-mente": 5, "cla-ge-efeito-dano": 20, "cla-alice-histeria-acerto": 5 },
  numeros: { "estilo.duelista.acertoIsolado": 3, "estilo.dupla.acerto": 2, "estilo.atirador.margem": 4, "estilo.atirador.margemSempre": 1 }
};
export function trocasValores0820(f = {}) {
  const upd = {};
  for (const [k, velho] of Object.entries(ANTIGOS_0820.ajustes)) {
    const v = f.ajustesBonus?.[k];
    if (v !== undefined && v !== "" && Number(v) === velho) upd[`${P}.ajustesBonus.-=${k}`] = null;
  }
  return upd;
}
async function valores0820() {
  let n = 0;
  for (const a of game.actors ?? []) {
    const f = a.flags?.[FLAG];
    if (!f || f.migrado0820) continue;
    const upd = trocasValores0820(f);
    await a.update({ ...upd, [`${P}.migrado0820`]: true }, { render: false });
    if (Object.keys(upd).length) n++;
  }
  try {
    if (!game.settings.get(FLAG, "numeros0820")) {
      const salvos = { ...(game.settings.get(FLAG, "numerosBonus") ?? {}) };
      let mudou = false;
      for (const [k, velho] of Object.entries(ANTIGOS_0820.numeros)) if (salvos[k] !== undefined && Number(salvos[k]) === velho) { delete salvos[k]; mudou = true; }
      if (mudou) await game.settings.set(FLAG, "numerosBonus", salvos);
      await game.settings.set(FLAG, "numeros0820", true);
    }
  } catch (err) { console.warn("EPM | números 0.8.20", err); }
  return n;
}

export function trocasValoresAntigos(f = {}) {
  const upd = {};
  for (const [arq, recs] of Object.entries(ANTIGOS_0813.tabela)) for (const [r, velho] of Object.entries(recs)) {
    const v = f.recursosAuto?.tabela?.[arq]?.[r]?.inicial;
    if (v !== undefined && v !== "" && Number(v) === velho) upd[`${P}.recursosAuto.tabela.${arq}.${r}.inicial`] = "";
  }
  for (const [k, velho] of Object.entries(ANTIGOS_0813.ajustes)) {
    const v = f.ajustesBonus?.[k];
    if (v !== undefined && v !== "" && Number(v) === velho) upd[`${P}.ajustesBonus.-=${k}`] = null;
  }
  return upd;
}
async function valoresAntigos() {
  let n = 0;
  for (const a of game.actors ?? []) {
    const f = a.flags?.[FLAG];
    if (!f || f.migrado0813) continue;
    const upd = trocasValoresAntigos(f);
    await a.update({ ...upd, [`${P}.migrado0813`]: true }, { render: false });
    if (Object.keys(upd).length) n++;
  }
  try {
    const salvos = { ...(game.settings.get(FLAG, "numerosBonus") ?? {}) };
    let mudou = false;
    for (const [k, velho] of Object.entries(ANTIGOS_0813.numeros)) if (salvos[k] !== undefined && Number(salvos[k]) === velho) { delete salvos[k]; mudou = true; }
    if (mudou) await game.settings.set(FLAG, "numerosBonus", salvos);
  } catch (err) { console.warn("EPM | números dos estilos", err); }
  return n;
}

/** Catálogo de treinamentos (0.8.17): liga os treinos antigos ao modelo e cria as habilidades dos já concluídos. */
async function ligarTreinosAoCatalogo() {
  const { trocasLigacaoModelos, aplicarConclusoes } = await import("./treinos-conclusao.mjs");
  let n = 0;
  for (const a of game.actors ?? []) {
    const f = a.flags?.[FLAG];
    if (!f || f.treinosCatalogoV1) continue;
    const upd = trocasLigacaoModelos(f);
    await a.update({ ...upd, [`${P}.treinosCatalogoV1`]: true }, { render: false });
    await aplicarConclusoes(a, { perguntar: false, avisar: false });
    if (Object.keys(upd).length) n++;
  }
  return n;
}

/**
 * Talentos viraram treinamentos (0.8.20). Cada talento da ficha vira um treino do catálogo:
 * concluído se estava valendo, planejado se estava desligado ou não tinha sido comprado (PEv antigo).
 * Talentos feitos à mão viram treinos à mão. As habilidades antigas (origem Talento) saem e voltam como de Treinamento.
 */
export function trocasTalentosParaTreinos(f = {}, { talentoPorNome, talentoModelo, treinoCatalogo }) {
  const up = {};
  const treinos = Object.values(f.treinamentos ?? {}).filter(Boolean);
  let i = 0;
  for (const [tid, t] of Object.entries(f.talentos ?? {})) {
    if (!t) continue;
    const ativo = !t.inativo && (!("comprado" in t) || !!t.comprado || !!t.versao);
    const tal = talentoModelo(t.modelo) ?? talentoPorNome(t.nome);
    const id = `tal${tid}`.slice(0, 16);
    const base = { estado: ativo ? "concluido" : "planejado", criado: Number(t.criado) || Date.now() + i++, mods: {} };
    if (tal) {
      const e = treinoCatalogo(tal.id);
      if (treinos.some(x => x.modelo === tal.id && (!tal.repetivel || (x.escolha ?? "") === (t.escolha ?? "")))) continue;
      up[`${P}.treinamentos.${id}`] = {
        ...base, nome: t.escolha ? `${tal.nome} (${t.escolha})` : tal.nome, categoria: e?.categoria ?? "extras", tempo: e?.tempo ?? 24, unidade: "horas",
        pt: e?.pt ?? 5, requisitos: e?.requisitos ?? "", treinador: !!e?.treinador, repetivel: !!tal.repetivel, beneficios: tal.beneficio,
        especial: "", modelo: tal.id, horasFeitas: ativo ? (e?.tempo ?? 24) : 0, ...(t.escolha ? { escolha: t.escolha } : {})
      };
    } else {
      const mods = {};
      for (const [mid, m] of Object.entries(t.mods ?? {})) if (m?.alvo) mods[mid] = { alvo: m.alvo, valor: Number(m.valor) || 0 };
      up[`${P}.treinamentos.${id}`] = {
        ...base, mods, nome: t.nome || "Treino (era talento)", categoria: "extras", tempo: 1, unidade: "horas", pt: 0, requisitos: "",
        treinador: false, beneficios: t.descricao ?? "", especial: "", modelo: "", horasFeitas: ativo ? 1 : 0
      };
    }
  }
  if (f.talentos) up[`${P}.-=talentos`] = null;
  if ("talentosExtras" in f) up[`${P}.-=talentosExtras`] = null;
  return up;
}

async function talentosParaTreinos() {
  const TL = await import("./talentos-lista.mjs");
  const { TREINAMENTOS_NOTION } = await import("./catalogos.mjs");
  const { aplicarConclusoes } = await import("./treinos-conclusao.mjs");
  const treinoCatalogo = id => TREINAMENTOS_NOTION.find(x => x.modelo === id);
  let n = 0;
  for (const a of game.actors ?? []) {
    const f = a.flags?.[FLAG];
    if (!f || f.talentosTreinosV1) continue;
    const upd = trocasTalentosParaTreinos(f, { ...TL, treinoCatalogo });
    const velhos = (a.items?.contents ?? []).filter(i => i.flags?.[FLAG]?.talentoRef).map(i => i.id);
    if (velhos.length) await a.deleteEmbeddedDocuments("Item", velhos);
    await a.update({ ...upd, [`${P}.talentosTreinosV1`]: true }, { render: false });
    if (Object.keys(upd).length) { await aplicarConclusoes(a, { perguntar: false, avisar: false }); n++; }
  }
  return n;
}

/**
 * Base antiga das Melhorias de itens (0.6.0: nome e efeito livres por categoria) → formato da 0.8.21.
 * Nome igual a uma melhoria da lista (que sirva no item) vira ela; o resto fica como melhoria escrita à mão, com o texto antigo.
 * Títulos vão para o campo "Título da arma" (o primeiro) ou para a descrição.
 */
export function trocasMelhoriasAntigas(item, { melhoriaPorNome } = {}) {
  const f = item.flags?.[FLAG] ?? {};
  const antigas = Object.entries(f.melhoriasItem ?? {}).filter(([, m]) => m && typeof m === "object");
  if (!antigas.length && !f.melhoriasItem) return null;
  const up = { [`${P}.-=melhoriasItem`]: null };
  let titulo = String(f.titulo ?? "").trim();
  const extras = [];
  antigas.sort(([, a], [, b]) => Number(a.criado ?? 0) - Number(b.criado ?? 0)).forEach(([id, m], i) => {
    const nome = String(m.nome ?? "").trim();
    const texto = String(m.efeito ?? "").trim();
    if (!nome && !texto) return;
    if (m.categoria === "titulo") {
      if (!titulo) { titulo = nome || texto; up[`${P}.titulo`] = titulo; } else extras.push(`<p><strong>Título:</strong> ${nome}${texto ? `: ${texto}` : ""}</p>`);
      return;
    }
    const tipos = m.categoria === "maldicaoBencao" ? ["maldicao", "bencao"] : [m.categoria === "encantamento" ? "encantamento" : "modificacao"];
    const def = tipos.map(t => melhoriaPorNome?.(nome, t, item)).find(Boolean);
    up[`${P}.melhoriasDoItem.${id}`] = def
      ? { id: def.id, tipo: def.tipo, escolha: "", origem: "migrada", consumiu: [], criado: Number(m.criado) || Date.now() + i }
      : { id: `manual-${id}`, tipo: tipos[0], manual: { nome: nome || "Melhoria", texto }, origem: "migrada", consumiu: [], criado: Number(m.criado) || Date.now() + i };
  });
  if (extras.length) up["system.description.value"] = `${item.system?.description?.value ?? ""}${extras.join("")}`;
  return up;
}

async function melhoriasAntigas(itens) {
  const { MELHORIAS_ITEM } = await import("./melhorias-lista.mjs");
  const { perfilItem, melhoriaServe } = await import("./melhorias.mjs");
  const norm = t => String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const melhoriaPorNome = (nome, tipo, item) => {
    const p = perfilItem(item);
    const cands = MELHORIAS_ITEM.filter(m => m.tipo === tipo && norm(m.nome) === norm(nome));
    return cands.find(m => melhoriaServe(m, p)) ?? null;
  };
  let n = 0;
  for (const item of itens) {
    if (!item.flags?.[FLAG]?.melhoriasItem) continue;
    const up = trocasMelhoriasAntigas(item, { melhoriaPorNome });
    if (!up) continue;
    await item.update(up, { render: false });
    n++;
  }
  return n;
}

/**
 * 0.8.25: o tema "Atlas do Multiverso" virou o padrão. Fichas que ficaram na cor padrão antiga (verdete) passam
 * para o Atlas; quem escolheu outra cor continua com ela (o verdete segue nas cores prontas).
 */
export function trocasTemaAtlas(f = {}) {
  const cor = String(f.personalizacao?.cor ?? "").trim().toUpperCase();
  return cor === COR_PADRAO_ANTIGA ? { [`${P}.personalizacao.-=cor`]: null } : {};
}
async function temaAtlas() {
  let n = 0;
  for (const a of game.actors ?? []) {
    const f = a.flags?.[FLAG];
    if (!f || f.migrado0825) continue;
    const upd = trocasTemaAtlas(f);
    await a.update({ ...upd, [`${P}.migrado0825`]: true }, { render: false });
    if (Object.keys(upd).length) n++;
  }
  return n;
}

/** 0.8.26: o Atirador Arcano passou de Artífice para Conjurador. Avisa o Mestre das fichas sem Conjurador. */
function avisoAtiradorArcano() {
  const nomes = (game.actors ?? []).filter(a => {
    const f = a.flags?.[FLAG];
    return f && /atirador arcano/i.test(String(f.classe ?? "")) && ![f.arquetipo, f.arquetipo2].some(x => /conjurador/i.test(String(x ?? "")));
  }).map(a => a.name);
  if (nomes.length) ui.notifications.warn(`EPM: o Atirador Arcano agora é classe de Conjurador. Ajuste o arquétipo de: ${nomes.join(", ")}.`, { permanent: true });
  return nomes.length;
}

export async function migrarMundo() {
  if (!game.user?.isGM || (game.users?.activeGM && !game.users.activeGM.isSelf)) return;
  const itens = todosItens();
  const feitos = [];
  try { const n = await corrigirMagiasPf2(itens); if (n) feitos.push(`${n} magia(s) com o link antigo corrigidas`); } catch (err) { console.warn("EPM | migração das magias", err); }
  try { const n = await atualizarItensProntos(itens); if (n) feitos.push(`${n} item(ns) pronto(s) atualizado(s)`); } catch (err) { console.warn("EPM | migração dos itens prontos", err); }
  try { const n = await renomearTiposDano(itens); if (n) feitos.push(`${n} ficha(s)/item(ns) com tipos de dano renomeados`); } catch (err) { console.warn("EPM | migração dos tipos de dano", err); }
  try { const n = await sincronizarHabilidadesArquetipo(itens); if (n) feitos.push(`${n} habilidade(s) de arquétipo com o texto e o nível do livro atual`); } catch (err) { console.warn("EPM | habilidades de arquétipo", err); }
  try { const n = await ligarTreinosAoCatalogo(); if (n) feitos.push(`${n} ficha(s) com treinos ligados ao catálogo`); } catch (err) { console.warn("EPM | treinos do catálogo", err); }
  try { const n = await talentosParaTreinos(); if (n) feitos.push(`${n} ficha(s) com os talentos passados para Treinamentos`); } catch (err) { console.warn("EPM | talentos para treinos", err); }
  try { const n = await arquetiposEClasses0820(); if (n) feitos.push(`${n} ficha(s) com o arquétipo e a classe balanceados`); } catch (err) { console.warn("EPM | arquétipos e classes 0.8.20", err); }
  try { const n = await valores0820(); if (n) feitos.push(`${n} ficha(s) com números padrão antigos de estilos e classes atualizados`); } catch (err) { console.warn("EPM | valores 0.8.20", err); }
  try { const n = await melhoriasAntigas(itens); if (n) feitos.push(`${n} item(ns) com as melhorias antigas no formato novo`); } catch (err) { console.warn("EPM | melhorias antigas", err); }
  try { const n = await valoresAntigos(); if (n) feitos.push(`${n} ficha(s) com valores antigos do livro atualizados`); } catch (err) { console.warn("EPM | valores antigos", err); }
  try { const n = await temaAtlas(); if (n) feitos.push(`${n} ficha(s) passaram para o visual Atlas`); } catch (err) { console.warn("EPM | tema Atlas", err); }
  try { avisoAtiradorArcano(); } catch (err) { console.warn("EPM | aviso do Atirador Arcano", err); }
  if (feitos.length) ui.notifications.info(`EPM: fichas antigas atualizadas (${feitos.join("; ")}).`);
  return feitos;
}
