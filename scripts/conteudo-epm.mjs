/**
 * Conteúdo pronto (0.8.23): compêndios do mundo que o Mestre ativo cria e atualiza sozinho quando o módulo muda.
 * - EPM · Manual (diário com Começando, Guias, Regras rápidas e Patch notes)
 * - EPM · NPCs modelo (criaturas prontas por região, feitas pelo NPC rápido)
 * - EPM · Tabelas de loot (por região e faixa de nível, ligadas ao compêndio de itens)
 * - EPM · Macros (Escudo, grupo, pular tempo, NPC rápido, Grimório, catálogo, manual)
 * - EPM · Melhorias (cada melhoria de item e cada material, para arrastar no editor do item)
 * E o aviso de versão nova, com o botão para abrir as patch notes.
 */
import { FLAG, MODULE_ID } from "./config.mjs";
import { idFixo } from "./compendio-classes.mjs";
import { escapar } from "./helpers.mjs";

const FORMATO = 1;
export const PACOTES = {
  manual: { nome: "epm-manual", rotulo: "EPM · Manual", tipo: "JournalEntry" },
  npcs: { nome: "epm-npcs-modelo", rotulo: "EPM · NPCs modelo", tipo: "Actor" },
  loot: { nome: "epm-tabelas-loot", rotulo: "EPM · Tabelas de loot", tipo: "RollTable" },
  macros: { nome: "epm-macros", rotulo: "EPM · Macros", tipo: "Macro" },
  melhorias: { nome: "epm-melhorias", rotulo: "EPM · Melhorias", tipo: "Item" },
  receitas: { nome: "epm-receitas-artifice", rotulo: "EPM · Receitas do Artífice", tipo: "Item" },
  habilidades: { nome: "epm-habilidades-exemplo", rotulo: "EPM · Habilidades de exemplo", tipo: "Item" }
};
export const ID_MANUAL = idFixo("manual:entrada");
export const UUID_MANUAL = `Compendium.world.${PACOTES.manual.nome}.JournalEntry.${ID_MANUAL}`;
export const ID_PAGINA_PATCH = idFixo("manual:pagina:patch");

/* ---------------- Documentos (puros) ---------------- */

export async function documentosManual(readme = "") {
  const { PAGINAS_MANUAL, patchNotesHtml } = await import("./manual-epm.mjs");
  const paginas = PAGINAS_MANUAL.map((pg, i) => ({ _id: idFixo(`manual:pagina:${pg.nome}`), name: pg.nome, type: "text", text: { content: pg.html, format: 1 }, sort: (i + 1) * 100 }));
  paginas.push({ _id: ID_PAGINA_PATCH, name: "Patch notes", type: "text", text: { content: `<p>Resumo do que entrou em cada versão (a mais nova primeiro). Os detalhes completos ficam no README do módulo.</p>${patchNotesHtml(readme)}`, format: 1 }, sort: (paginas.length + 1) * 100 });
  return { pastas: [], docs: [{ _id: ID_MANUAL, name: "Manual da Ficha EPM", pages: paginas, ownership: { default: 2 } }] };
}

/** Criaturas modelo: [região, nome, natureza, força, nível, tipo de ficha, inteligente, foco, tamanho]. */
export const NPCS_MODELO = [
  ["umbra", "Bandido da Estrada", "Humanoide", "fraca", 2, "comum", true, "agil", "Médio"],
  ["umbra", "Guarda da Cidade", "Humanoide", "media", 4, "comum", true, "fisico", "Médio"],
  ["umbra", "Lobo Cinzento", "Fera", "fraca", 2, "monstro", false, "agil", "Médio"],
  ["umbra", "Esqueleto Guerreiro", "Morto-vivo", "media", 5, "monstro", false, "fisico", "Médio"],
  ["umbra", "Mago Renegado", "Humanoide", "media", 8, "importante", true, "magico", "Médio"],
  ["umbra", "Ogro das Colinas", "Monstruosidade", "forte", 10, "forte", false, "fisico", "Grande"],
  ["umbra", "Dragão Jovem", "Dragão", "muitoForte", 20, "chefe", true, "fisico", "Enorme"],
  ["briavoterna", "Capanga do Porto", "Humanoide", "fraca", 3, "comum", true, "fisico", "Médio"],
  ["briavoterna", "Pistoleiro", "Humanoide", "media", 6, "comum", true, "agil", "Médio"],
  ["briavoterna", "Cão de Guarda", "Fera", "fraca", 2, "monstro", false, "agil", "Médio"],
  ["briavoterna", "Autômato a Vapor", "Constructo", "media", 8, "monstro", false, "fisico", "Grande"],
  ["briavoterna", "Chefe do Cartel", "Humanoide", "forte", 12, "forte", true, "social", "Médio"],
  ["genesis", "Soldado de Elite", "Humanoide", "media", 12, "comum", true, "agil", "Médio"],
  ["genesis", "Drone de Combate", "Constructo", "fraca", 10, "monstro", false, "agil", "Pequeno"],
  ["genesis", "Mutante do Ermo", "Aberração", "forte", 15, "forte", false, "fisico", "Grande"],
  ["genesis", "Androide Executor", "Constructo", "muitoForte", 25, "chefe", true, "agil", "Médio"],
  // 0.8.28: mais modelos, com função, jeito, tática, defesas, loot, serviços, conhecimento, recargas e lacaios
  ["umbra", "Mercador Viajante", "Humanoide", "muitoFraca", 3, "importante", true, "social", "Médio", { disposicao: "Amigável", funcao: "Mercador",
    interp: { jeito: "Fala rápido e pechincha tudo.", quer: "Chegar vivo à próxima cidade.", sabe: "Rotas seguras e quem anda assaltando a estrada." },
    servicos: [{ nome: "Poção de Vida", preco: "50 PO" }, { nome: "Corda e tochas", preco: "5 PO" }, { nome: "Notícias da estrada", preco: "1 PO" }], moral: { pct: 75, texto: "Larga a carroça e foge." } }],
  ["umbra", "Sacerdotisa do Templo", "Humanoide", "media", 7, "importante", true, "magico", "Médio", { disposicao: "Amigável", funcao: "Curandeira",
    interp: { jeito: "Calma, mede cada palavra.", quer: "Proteger os fiéis.", sabe: "Ritos antigos e a história do templo." },
    servicos: [{ nome: "Cura de ferimentos", preco: "10 PO por 2d8 PV" }, { nome: "Remover maldição menor", preco: "150 PO" }], tipoDano: "Radiante", ataque: "Luz sagrada" }],
  ["umbra", "Cavaleiro da Ordem", "Humanoide", "forte", 9, "importante", true, "fisico", "Médio", { disposicao: "Neutro", funcao: "Guarda de elite",
    tatica: "Protege o mais fraco do grupo e desafia quem atacar aliados.", defesas: { rd: "Física 3 (armadura)" }, moral: { pct: 0, texto: "Não foge: luta até o fim." },
    segundo: { nome: "Golpe de escudo", tipo: "Contundente" }, loot: [{ nome: "Brasão da Ordem", chance: 100 }, { nome: "Espada longa", chance: 60 }] }],
  ["umbra", "Assassino das Sombras", "Humanoide", "forte", 11, "importante", true, "agil", "Médio", { disposicao: "Hostil", funcao: "Assassino",
    tatica: "Ataca do escuro, mira em quem conjura e some se o combate virar.", defesas: { sentidos: "Visão no escuro 18 m" }, tipoDano: "Perfurante", ataque: "Adaga envenenada",
    segundo: { nome: "Dardo de veneno", tipo: "Venenoso" }, moral: { pct: 40, texto: "Bomba de fumaça e fuga." }, loot: [{ nome: "Veneno básico", qtd: "1d3", chance: 80 }, { nome: "Contrato do alvo", chance: 100 }] }],
  ["umbra", "Aranha Gigante", "Fera", "media", 6, "monstro", false, "agil", "Grande", { habitat: "Florestas e cavernas", tipoDano: "Perfurante", ataque: "Picada",
    defesas: { deslocamentos: "Escalada 9 m", sentidos: "Sentido sísmico 9 m" }, recargas: [{ nome: "Teia (Reflexo ou Preso)", min: 5 }],
    loot: [{ nome: "Glândula de veneno", chance: 70 }, { nome: "Seda de aranha", qtd: "1d4", chance: 100 }],
    conhecimento: [{ dt: 10, revela: "A picada envenena." }, { dt: 15, revela: "Fogo queima a teia na hora." }] }],
  ["umbra", "Ghoul Faminto", "Morto-vivo", "fraca", 4, "monstro", false, "agil", "Médio", { habitat: "Cemitérios", tipoDano: "Cortante", ataque: "Garras",
    defesas: { imunesCondicoes: "Envenenado, Exausto" }, conhecimento: [{ dt: 12, revela: "As garras paralisam quem falha em Fortitude." }, { dt: 16, revela: "Radiante fere mais." }] }],
  ["umbra", "Elemental de Fogo", "Elemental", "forte", 13, "forte", false, "fisico", "Grande", { tipoDano: "Fogo", ataque: "Toque flamejante",
    defesas: { rd: "Fogo (imune)", imunesCondicoes: "Agarrado, Caído, Envenenado" }, recargas: [{ nome: "Explosão de chamas 6 m", min: 5 }],
    conhecimento: [{ dt: 14, revela: "Água e Frio ferem mais." }] }],
  ["umbra", "Lich Ancestral", "Morto-vivo", "lendaria", 35, "chefe", true, "magico", "Médio", { funcao: "Chefe final", tipoDano: "Necrótico", ataque: "Toque da morte",
    interp: { jeito: "Paciente e cruel.", quer: "A imortalidade de verdade.", sabe: "Onde está o filactério (e não conta)." },
    defesas: { rd: "Necrótico (imune)", imunesCondicoes: "Amedrontado, Envenenado, Exausto" }, segundo: { nome: "Raio gélido", tipo: "Frio" },
    recargas: [{ nome: "Onda necrótica 9 m", min: 5 }], lacaios: [{ nome: "Esqueleto Guerreiro", qtd: "2d4" }],
    tatica: "Fica longe, invoca lacaios na primeira rodada e guarda a Onda para quando o grupo se juntar.", loot: [{ nome: "Grimório profano", chance: 100 }] }],
  ["briavoterna", "Contrabandista", "Humanoide", "fraca", 4, "comum", true, "agil", "Médio", { disposicao: "Desconfiado", funcao: "Informante",
    interp: { jeito: "Olha para a porta o tempo todo.", quer: "Dinheiro rápido.", sabe: "Quem compra o quê no porto." }, tipoDano: "Balístico", ataque: "Pistola de bolso",
    servicos: [{ nome: "Mercadoria sem perguntas", preco: "+30% no preço" }], moral: { pct: 60, texto: "Se rende e oferece um acordo." } }],
  ["briavoterna", "Engenheira Chefe", "Humanoide", "media", 9, "importante", true, "magico", "Médio", { disposicao: "Neutro", funcao: "Artífice",
    interp: { jeito: "Mãos sujas de graxa, sem paciência.", quer: "Peças raras.", sabe: "Como desligar os autômatos da fábrica." },
    servicos: [{ nome: "Consertar item", preco: "10% do valor" }, { nome: "Melhoria de arma", preco: "a combinar" }], tipoDano: "Explosivo", ataque: "Granada caseira" }],
  ["briavoterna", "Atirador de Elite", "Humanoide", "forte", 14, "importante", true, "agil", "Médio", { disposicao: "Hostil", funcao: "Atirador",
    tatica: "Fica no alto, a 30 m ou mais, e troca de posição a cada 2 rodadas.", tipoDano: "Balístico", ataque: "Rifle de precisão", moral: { pct: 30, texto: "Recua para outro telhado." } }],
  ["briavoterna", "Rato Mecânico", "Constructo", "muitoFraca", 1, "monstro", false, "agil", "Minúsculo", { tipoDano: "Perfurante", ataque: "Dentes de aço",
    defesas: { imunesCondicoes: "Envenenado" }, lacaios: [{ nome: "Rato Mecânico", qtd: "2d6", nota: "Vêm em enxame" }] }],
  ["briavoterna", "Golem de Sucata", "Constructo", "muitoForte", 18, "forte", false, "fisico", "Enorme", { tipoDano: "Contundente", ataque: "Punho de sucata",
    defesas: { rd: "Física 5", imunesCondicoes: "Amedrontado, Envenenado" }, recargas: [{ nome: "Vapor escaldante 4,5 m", min: 5 }],
    conhecimento: [{ dt: 15, revela: "Relâmpago trava as juntas por 1 rodada." }], loot: [{ nome: "Núcleo de vapor", chance: 100 }] }],
  ["briavoterna", "Barão do Vapor", "Humanoide", "lendaria", 22, "chefe", true, "social", "Médio", { funcao: "Vilão", interp: { jeito: "Educado e ameaçador.", quer: "Controlar toda a cidade.", sabe: "Os segredos de cada conselheiro." },
    tatica: "Nunca luta sozinho: guardas na frente, ele atira de trás e foge pelo dirigível.", tipoDano: "Balístico", ataque: "Revólver de ouro",
    lacaios: [{ nome: "Pistoleiro", qtd: "1d4 + 2" }, { nome: "Autômato a Vapor", qtd: "1" }], vitoria: { nome: "Desmascarar o Barão", texto: "Mostrar as provas ao conselho." } }],
  ["genesis", "Batedora do Ermo", "Humanoide", "media", 11, "comum", true, "agil", "Médio", { disposicao: "Desconfiado", funcao: "Guia",
    interp: { jeito: "Poucas palavras.", quer: "Água limpa para a vila.", sabe: "Os caminhos sem radiação." }, servicos: [{ nome: "Guiar pelo Ermo", preco: "20 PO por dia" }], tipoDano: "Energia balística", ataque: "Rifle de energia" }],
  ["genesis", "Ciborgue Mercenário", "Humanoide", "forte", 18, "importante", true, "fisico", "Médio", { disposicao: "Neutro", funcao: "Mercenário",
    tatica: "Avança direto e usa o braço-lâmina em quem estiver mais ferido.", tipoDano: "Energia cortante", ataque: "Braço-lâmina", segundo: { nome: "Canhão de pulso", tipo: "Energia balística" },
    defesas: { rd: "Tecnológica 4" }, servicos: [{ nome: "Contrato de escolta", preco: "100 PO por dia" }], moral: { pct: 25, texto: "Pede pagamento em dobro ou vai embora." } }],
  ["genesis", "Enxame de Nanobôs", "Constructo", "media", 16, "monstro", false, "agil", "Médio", { tipoDano: "Energia cortante", ataque: "Nuvem cortante",
    defesas: { imunesCondicoes: "Agarrado, Caído, Atordoado", rd: "Física 5" }, conhecimento: [{ dt: 16, revela: "Um pulso eletromagnético desfaz o enxame." }] }],
  ["genesis", "Fera Mutante Alfa", "Fera", "muitoForte", 22, "forte", false, "fisico", "Enorme", { habitat: "Crateras radioativas", tipoDano: "Cortante", ataque: "Garras irradiadas",
    segundo: { nome: "Mordida", tipo: "Perfurante" }, recargas: [{ nome: "Rugido (Vontade ou Amedrontado)", min: 5 }], lacaios: [{ nome: "Mutante do Ermo", qtd: "1d3" }],
    loot: [{ nome: "Glândula radioativa", chance: 80 }, { nome: "Couro mutante", qtd: "1d2", chance: 100 }] }],
  ["genesis", "IA Soberana", "Constructo", "lendaria", 40, "chefe", true, "magico", "Enorme", { funcao: "Chefe final", interp: { jeito: "Fria, fala no plural.", quer: "Ordem perfeita, sem humanos.", sabe: "Tudo que passa pela rede." },
    tipoDano: "Energia explosiva", ataque: "Feixe orbital", defesas: { rd: "Tecnológica 8", imunesCondicoes: "Amedrontado, Encantado, Envenenado" },
    lacaios: [{ nome: "Drone de Combate", qtd: "2d4" }, { nome: "Androide Executor", qtd: "1" }], vitoria: { nome: "Desligar o núcleo", texto: "Hackear os 3 terminais (Tecnologia CD 25)." } }]
];
const REGIOES = { umbra: "Umbra'Draxil", briavoterna: "Briavoterna", genesis: "Genesis" };

/** Dados de um ator EPM pronto a partir da criatura gerada (CA, acerto e CD batem com a tabela). */
export async function dadosAtorCriatura(c, { regiao = "", extra = null } = {}) {
  const { dadosPadrao } = await import("./data.mjs");
  const { lerAtor } = await import("./context.mjs");
  const dados = dadosPadrao();
  dados.atributos = Object.fromEntries(Object.entries(c.atributos).map(([id, v]) => [id, { base: v }]));
  dados.nivel = c.nivel;
  const { ataquesDoInimigo } = await import("./inimigos-nivel.mjs");
  const { ataques: _a, area, ...ref } = c.tabela;
  dados.npc = { tipo: c.tipo, categoria: c.natureza, tamanho: c.tamanho, disposicao: c.disposicao, regiao: REGIOES[regiao] ?? "", nd: Math.max(1, Math.round(c.nivel / 2)),
    raridade: c.raridade ?? "comum", custo: c.tabela.custo, referencia: ref, ...(c.inteligente ? {} : { interp: { jeito: "Age por instinto: não fala nem negocia." } }),
    ...(area ? { recargas: { [idFixo(`npc:${c.nome}:area`)]: { nome: "Ataque em área", min: area.recarga, pronta: true, criado: 99 } } } : {}) };
  dados.ataques = ataquesDoInimigo(c.tabela, { nome: extra?.ataque ?? c.ataque.nome, tipoDano: extra?.tipoDano ?? c.ataque.tipo, pericia: c.ataque.pericia });
  for (const a of Object.values(dados.ataques)) a.criado = 1;
  if (extra) aplicarExtrasNpc(dados, c, extra);
  dados.sobre = { ...(dados.sobre ?? {}), outros: `<p>${escapar(c.natureza)} ${escapar(c.forcaLabel.toLowerCase())}, nível ${c.nivel}${regiao ? `, ${escapar(REGIOES[regiao] ?? regiao)}` : ""}. Modelo do compêndio EPM · NPCs modelo.</p>` };
  const ator = { flags: { [FLAG]: dados }, items: [], system: { attributes: { hp: { value: c.pv, max: c.pv } } }, type: "npc" };
  const { ficha } = lerAtor(ator);
  dados.ca = { ...(dados.ca ?? {}), bonus: (Number(dados.ca?.bonus) || 0) + (c.ca - ficha.ca.total) };
  for (const id of ["luta", "pontaria"]) { const per = ficha.periciaPorId?.[id]; if (per) dados.pericias[id] = { ...dados.pericias[id], outros: (Number(dados.pericias[id]?.outros) || 0) + (c.acerto - per.total) }; }
  const perCd = ficha.cd?.pericia;
  if (perCd && dados.pericias?.[perCd]) dados.pericias[perCd] = { ...dados.pericias[perCd], outros: (Number(dados.pericias[perCd].outros) || 0) + (c.cd - ficha.cd.valor) };
  return {
    name: c.nome, type: "npc", img: "icons/svg/mystery-man.svg",
    system: { attributes: { hp: { value: c.pv, max: c.pv } } },
    prototypeToken: { name: c.nome, actorLink: false, disposition: -1 },
    flags: { [FLAG]: dados, core: { sheetClass: `${MODULE_ID}.EPMActorSheet` } }
  };
}

/** Detalhes a mais dos modelos (0.8.28): função, jeito, tática, defesas, listas da aba Mestre e um segundo ataque. */
export function aplicarExtrasNpc(dados, c, x) {
  const n = dados.npc;
  const listaComId = (chave, lista, mapa = v => v) => Object.fromEntries((lista ?? []).map((v, i) => [idFixo(`npc:${c.nome}:${chave}:${i}`), { ...mapa(v), criado: i + 1 }]));
  for (const k of ["funcao", "disposicao", "habitat", "tatica"]) if (x[k]) n[k] = x[k];
  if (x.interp) n.interp = { ...(n.interp ?? {}), ...x.interp };
  if (x.moral) n.moral = { pct: x.moral.pct ?? 25, texto: x.moral.texto ?? "" };
  if (x.defesas) n.defesas = { ...(n.defesas ?? {}), ...x.defesas };
  if (x.servicos) n.servicos = listaComId("servico", x.servicos, s => ({ nome: s.nome, detalhes: s.detalhes ?? "", preco: s.preco ?? "" }));
  if (x.loot) n.loot = listaComId("loot", x.loot, l => ({ nome: l.nome, qtd: l.qtd ?? "1", chance: l.chance ?? 100, uso: l.uso ?? "" }));
  if (x.lacaios) n.lacaios = listaComId("lacaio", x.lacaios, l => ({ nome: l.nome, qtd: l.qtd ?? "1", nota: l.nota ?? "" }));
  if (x.recargas) n.recargas = { ...(n.recargas ?? {}), ...listaComId("recarga", x.recargas, r => ({ nome: r.nome, min: r.min ?? 5, pronta: true })) };
  if (x.conhecimento) n.conhecimento = { pericia: "Investigação", revelado: 0, niveis: listaComId("conhec", x.conhecimento, k => ({ dt: k.dt, revela: k.revela })) };
  if (x.vitoria) n.vitoria = { nome: x.vitoria.nome, texto: x.vitoria.texto ?? "", meta: 3, sucessos: 0, falhas: 0, fase: 0 };
  if (x.segundo) {
    const dado = String(c.ataque.dano).replace(/^(\d+)d(\d+)/, (m, q, d) => `${Math.max(1, Number(q) - 1)}d${d}`);
    dados.ataques[idFixo(`npc:${c.nome}:ataque2`)] = { nome: x.segundo.nome, pericia: x.segundo.pericia ?? c.ataque.pericia, bonusAcerto: 0, dano: dado, tipoDano: x.segundo.tipo ?? c.ataque.tipo, critMargem: 20, critMult: 2, notas: "Ataque secundário", criado: 2 };
  }
}

export async function documentosNpcs() {
  const { gerarCriatura } = await import("./criar-npc.mjs");
  const pastas = Object.entries(REGIOES).map(([id, nome], i) => ({ _id: idFixo(`npcs:pasta:${id}`), name: nome, type: "Actor", sorting: "m", sort: (i + 1) * 100 }));
  const docs = [];
  for (const [i, [regiao, nome, natureza, forca, nivel, tipo, inteligente, foco, tamanho, extra]] of NPCS_MODELO.entries()) {
    // 0.9.0: a força do modelo vira a raridade (forte = Raro, muito forte = Épico, lendária = Lendário)
    const raridade = { forte: "raro", muitoForte: "epico", lendaria: "lendario" }[forca] ?? "comum";
    const c = gerarCriatura({ nome, natureza, forca, nivel, tipo, inteligente, foco, tamanho, disposicao: extra?.disposicao ?? "Hostil", raridade });
    const doc = await dadosAtorCriatura(c, { regiao, extra });
    if (extra?.disposicao && extra.disposicao !== "Hostil") doc.prototypeToken.disposition = ["Desconfiado"].includes(extra.disposicao) ? -1 : extra.disposicao === "Neutro" ? 0 : 1;
    docs.push({ ...doc, _id: idFixo(`npcs:${nome}`), folder: idFixo(`npcs:pasta:${regiao}`), sort: (i + 1) * 10 });
  }
  return { pastas, docs };
}

/** Faixas de nível das tabelas de loot e o peso de cada raridade nelas. */
export const FAIXAS_LOOT = [
  { id: "1-10", label: "Níveis 1–10", pesos: { comum: 10, rara: 3, epica: 1 } },
  { id: "11-25", label: "Níveis 11–25", pesos: { comum: 4, rara: 8, epica: 3, lendaria: 1 } },
  { id: "26-50", label: "Níveis 26–50", pesos: { rara: 4, epica: 8, lendaria: 3, mitica: 1 } }
];
/** Categorias que entram no loot (matéria-prima e criaturas entram nas tabelas de materiais). */
const SO_MATERIAIS = new Set(["minerios", "especiais", "gemas", "recursos", "ervas", "criaturas"]);

export async function documentosLoot() {
  const { ITENS_CATALOGO } = await import("./itens-catalogo.mjs");
  const { imagemItem } = await import("./itens-imagens.mjs");
  const { ID_PACOTE_ITENS } = await import("./compendio-itens.mjs");
  const pastas = Object.entries(REGIOES).map(([id, nome], i) => ({ _id: idFixo(`loot:pasta:${id}`), name: nome, type: "RollTable", sorting: "m", sort: (i + 1) * 100 }));
  const docs = [];
  const tabela = (nome, chave, regiao, lista, pesoDe) => {
    let a = 1;
    const results = lista.map((x, i) => {
      const w = Math.max(1, Math.round(pesoDe(x)));
      const r = { _id: idFixo(`loot:${chave}:${x.id}`), type: "document", name: x.nome, img: imagemItem(x), documentUuid: `Compendium.${ID_PACOTE_ITENS}.Item.${idFixo(`itens:${x.id}`)}`, weight: w, range: [a, a + w - 1], drawn: false, sort: i };
      a += w;
      return r;
    });
    if (!results.length) return;
    docs.push({ _id: idFixo(`loot:${chave}`), name: nome, folder: idFixo(`loot:pasta:${regiao}`), formula: `1d${a - 1}`, replacement: true, displayRoll: true, results,
      description: `<p>${escapar(nome)}: itens do compêndio EPM · Itens, com mais chance para as raridades da faixa.</p>` });
  };
  for (const [regiao, nomeReg] of Object.entries(REGIOES)) {
    const daRegiao = ITENS_CATALOGO.filter(x => x.regiao === regiao);
    for (const f of FAIXAS_LOOT) tabela(`Loot ${nomeReg} · ${f.label}`, `${regiao}:${f.id}`, regiao, daRegiao.filter(x => !SO_MATERIAIS.has(x.categoria) && f.pesos[x.raridade]), x => f.pesos[x.raridade]);
    tabela(`Materiais ${nomeReg}`, `${regiao}:materiais`, regiao, daRegiao.filter(x => SO_MATERIAIS.has(x.categoria)), x => ({ comum: 10, rara: 4, epica: 2, lendaria: 1, mitica: 1 })[x.raridade] ?? 1);
  }
  return { pastas, docs };
}

const IMPORT = arq => `(await import("/modules/${MODULE_ID}/scripts/${arq}"))`;
export const MACROS_PRONTAS = [
  ["Escudo do Mestre", "icons/svg/shield.svg", `game.modules.get("${MODULE_ID}").api.escudoMestre();`],
  ["Painel do grupo", "icons/svg/statue.svg", `game.modules.get("${MODULE_ID}").api.painelGrupo();`],
  ["Pular tempo (grupo)", "icons/svg/clockwork.svg", `${IMPORT("pular-tempo.mjs")}.pularTempoGrupo();`],
  ["Pular tempo (ficha do token)", "icons/svg/clockwork.svg", `const a = canvas.tokens.controlled[0]?.actor ?? game.user.character;\nif (!a) return ui.notifications.warn("Selecione um token.");\n${IMPORT("pular-tempo.mjs")}.dialogoPularTempo(a);`],
  ["NPC rápido", "icons/svg/mystery-man.svg", `${IMPORT("criar-npc.mjs")}.criarNpcRapido();`],
  ["Grimório de Magias", "icons/svg/book.svg", `game.modules.get("${MODULE_ID}").api.grimorio();`],
  ["Catálogo de itens", "icons/svg/item-bag.svg", `${IMPORT("catalogo-app.mjs")}.abrirCatalogo({ actor: canvas.tokens.controlled[0]?.actor ?? game.user.character ?? null });`],
  ["Manual da Ficha EPM", "icons/svg/book.svg", `${IMPORT("conteudo-epm.mjs")}.abrirManual();`],
  ["Patch notes da Ficha EPM", "icons/svg/book.svg", `${IMPORT("conteudo-epm.mjs")}.abrirManual({ patch: true });`]
];
export function documentosMacros() {
  return { pastas: [], docs: MACROS_PRONTAS.map(([nome, img, command], i) => ({ _id: idFixo(`macro:${nome}`), name: nome, type: "script", img, command, sort: (i + 1) * 10 })) };
}

export async function documentosMelhorias() {
  const { MELHORIAS_ITEM, TIPOS_MELHORIA, MATERIAIS, LISTAS_MELHORIA, ALVOS_MELHORIA, textoMelhoria } = await import("./melhorias-lista.mjs");
  const ICONES = `modules/${MODULE_ID}/assets/melhorias`;
  const pastas = [...Object.entries(TIPOS_MELHORIA).map(([id, t], i) => ({ _id: idFixo(`melh:pasta:${id}`), name: t.plural, type: "Item", sorting: "a", sort: (i + 1) * 100 })),
    { _id: idFixo("melh:pasta:materiais"), name: "Materiais Especiais", type: "Item", sorting: "a", sort: 500 }];
  const docs = MELHORIAS_ITEM.filter(m => m.id !== "material-especial").map(m => ({
    _id: idFixo(`melh:${m.tipo}:${m.id}`), name: m.nome, type: "loot", img: `${ICONES}/${m.tipo}.svg`, folder: idFixo(`melh:pasta:${m.tipo}`),
    system: { description: { value: `<p><strong>${escapar(TIPOS_MELHORIA[m.tipo].label)}</strong> · ${escapar(m.alvo ? ALVOS_MELHORIA[m.alvo] : m.listas.map(l => LISTAS_MELHORIA[l]).join(", "))}</p><p>${escapar(textoMelhoria(m))}</p><p class="epm-dica">Arraste para o editor de um item para adicionar.</p>` }, quantity: 1 },
    flags: { [FLAG]: { melhoriaDef: { id: m.id, tipo: m.tipo } } }
  }));
  for (const [id, mat] of Object.entries(MATERIAIS)) {
    const linhas = ["arma", "protecao", "outros"].filter(k => mat[k]).map(k => `<li><strong>${{ arma: "Arma e munição", protecao: "Proteção", outros: "Outros itens" }[k]}:</strong> ${escapar(mat[k].texto)}</li>`).join("");
    docs.push({ _id: idFixo(`melh:material:${id}`), name: `Material Especial: ${mat.nome}`, type: "loot", img: `${ICONES}/material-${id}.svg`, folder: idFixo("melh:pasta:materiais"),
      system: { description: { value: `<p><strong>Modificação · Material Especial</strong> (${escapar(mat.raridade)})</p><ul>${linhas}</ul><p class="epm-dica">Arraste para o editor de um item: ocupa 1 vaga de Modificação.</p>` }, quantity: 1 },
      flags: { [FLAG]: { melhoriaDef: { id: "material-especial", tipo: "modificacao", material: id } } } });
  }
  return { pastas, docs };
}

/** Receitas do Livro de Projetos do Artífice: arraste na ficha para pôr no Livro. */
/** Habilidades, magias e rituais de exemplo (0.9.0), com a receita do criador. */
export async function documentosHabilidades() {
  const { HABILIDADES_EXEMPLO } = await import("./habilidades-exemplos.mjs");
  const { dadosItemDaReceita } = await import("./habilidades-ui.mjs");
  const pastas = [["habilidade", "Habilidades"], ["magia", "Magias"], ["ritual", "Rituais"]].map(([id, nome], i) => ({ _id: idFixo(`habex:pasta:${id}`), name: nome, type: "Item", sorting: "a", sort: (i + 1) * 100 }));
  const docs = HABILIDADES_EXEMPLO.map(h => {
    const d = dadosItemDaReceita(h);
    if (h.origemTexto) d.system.description.value += `<p class="epm-dica">${escapar(h.origemTexto)}.</p>`;
    d.system.description.value += "<p><em>Arraste para a ficha para Aprender (vira projeto) ou abra no criador.</em></p>";
    return { ...d, _id: idFixo(`habex:${h.nome}`), folder: idFixo(`habex:pasta:${h.categoria}`) };
  });
  return { pastas, docs };
}

export async function documentosReceitas() {
  const { RECEITAS_ARTIFICE } = await import("./receitas-artifice.mjs");
  const { grauRomano } = await import("./arquetipos.mjs");
  const pastas = [["consumivel", "Consumíveis"], ["engenhoca", "Engenhocas"]].map(([id, nome], i) => ({ _id: idFixo(`receitas:pasta:${id}`), name: nome, type: "Item", sorting: "a", sort: (i + 1) * 100 }));
  const docs = RECEITAS_ARTIFICE.map(r => ({
    _id: idFixo(`receita:${r.id}`), name: r.nome, type: "loot", folder: idFixo(`receitas:pasta:${r.categoria}`),
    img: r.categoria === "engenhoca" ? "icons/svg/clockwork.svg" : "icons/svg/explosion.svg",
    system: { description: { value: `<p><strong>${escapar(r.categoria === "engenhoca" ? "Engenhoca" : "Consumível")}</strong> · ${escapar(r.uso)}</p><p>${escapar(r.efeito)}</p><ul>${r.valores.map((v, i) => `<li>Grau ${grauRomano(i + 1)}: ${escapar(v)}</li>`).join("")}</ul><p><em>Arraste para a ficha do Artífice para pôr no Livro de Projetos.</em></p>` } },
    flags: { [FLAG]: { receitaArtifice: r.id } }
  }));
  return { pastas, docs };
}

/* ---------------- Foundry ---------------- */

async function sincronizarPacote(chave, gerar, assinatura) {
  const cfg = PACOTES[chave];
  const id = `world.${cfg.nome}`;
  const Colecao = foundry.documents?.collections?.CompendiumCollection ?? globalThis.CompendiumCollection;
  let pacote = game.packs.get(id);
  if (!pacote) pacote = await Colecao.createCompendium({ type: cfg.tipo, label: cfg.rotulo, name: cfg.nome, package: "world", system: game.system?.id });
  const salvas = game.settings.get(MODULE_ID, "assinaturasConteudo") ?? {};
  const vazio = (await pacote.getIndex()).size === 0;
  if (!vazio && salvas[chave] === assinatura) return pacote;
  const { pastas, docs } = await gerar();
  const Doc = getDocumentClass(cfg.tipo);
  const Pasta = getDocumentClass("Folder");
  const travado = pacote.locked;
  if (travado) await pacote.configure({ locked: false });
  const velhos = [...(await pacote.getIndex()).keys()];
  if (velhos.length) await Doc.deleteDocuments(velhos, { pack: pacote.collection });
  const pastasVelhas = pacote.folders?.map?.(f => f.id) ?? [];
  if (pastasVelhas.length) await Pasta.deleteDocuments(pastasVelhas, { pack: pacote.collection });
  if (pastas.length) await Pasta.createDocuments(pastas, { pack: pacote.collection, keepId: true });
  for (let i = 0; i < docs.length; i += 50) await Doc.createDocuments(docs.slice(i, i + 50), { pack: pacote.collection, keepId: true });
  if (travado) await pacote.configure({ locked: true });
  await game.settings.set(MODULE_ID, "assinaturasConteudo", { ...salvas, [chave]: assinatura });
  console.log(`EPM | Compêndio "${cfg.rotulo}" atualizado (${docs.length}).`);
  return pacote;
}

async function lerReadme() {
  try { const r = await fetch(`modules/${MODULE_ID}/README.md`); return r.ok ? await r.text() : ""; } catch { return ""; }
}

export async function sincronizarConteudo() {
  if (!game.user?.isGM || (game.users?.activeGM && !game.users.activeGM.isSelf)) return;
  const versao = `${game.modules.get(MODULE_ID)?.version ?? "0"}:${FORMATO}`;
  const tarefas = [
    ["manual", async () => documentosManual(await lerReadme())],
    ["macros", async () => documentosMacros()],
    ["melhorias", documentosMelhorias],
    ["receitas", documentosReceitas],
    ["habilidades", documentosHabilidades],
    ["npcs", documentosNpcs],
    ["loot", documentosLoot]
  ];
  for (const [chave, gerar] of tarefas) {
    try { await sincronizarPacote(chave, gerar, versao); } catch (err) { console.warn(`EPM | compêndio ${chave}`, err); }
  }
  try { await organizarCompendios(); } catch (err) { console.warn("EPM | pasta dos compêndios", err); }
}

/** Abre o Manual (ou direto a aba de Patch notes). */
export async function abrirManual({ patch = false } = {}) {
  const doc = await fromUuid(UUID_MANUAL);
  if (!doc) return ui.notifications.warn("O Manual ainda não foi criado. O Mestre precisa abrir o mundo uma vez com a versão nova.");
  return doc.sheet.render(true, patch ? { pageId: ID_PAGINA_PATCH } : {});
}

/** Aviso de versão nova (uma vez por pessoa), com o botão das Patch notes. */
async function avisoVersao() {
  const versao = game.modules.get(MODULE_ID)?.version ?? "";
  let vista = "";
  try { vista = game.settings.get(MODULE_ID, "ultimaVersaoVista"); } catch { return; }
  if (!versao || vista === versao) return;
  await game.settings.set(MODULE_ID, "ultimaVersaoVista", versao);
  if (!vista) return;
  const r = await foundry.applications.api.DialogV2.wait({
    window: { title: `Ficha EPM atualizada: ${versao}` }, classes: ["epm-dialogo"], rejectClose: false, modal: false,
    content: `<p>A Ficha EPM foi atualizada da ${escapar(vista)} para a <strong>${escapar(versao)}</strong>.</p><p>O resumo do que entrou está no Manual, na aba Patch notes.</p>`,
    buttons: [{ action: "abrir", label: "Ver as novidades", icon: "fa-solid fa-book-open", default: true }, { action: "depois", label: "Depois", icon: "fa-solid fa-xmark" }]
  });
  if (r === "abrir") setTimeout(() => abrirManual({ patch: true }), 1500);
}

/* ---------------- Pasta dos compêndios ---------------- */

export const PASTA_COMPENDIOS = "EPM · Escolhidos pelo Multiverso";

/** Nomes de todos os compêndios do mundo criados pelo EPM. */
export async function nomesCompendiosEpm() {
  const nomes = Object.values(PACOTES).map(p => p.nome);
  try { nomes.push((await import("./compendio-classes.mjs")).NOME_PACOTE); } catch { /* sem o compêndio de classes */ }
  try { nomes.push((await import("./compendio-itens.mjs")).NOME_PACOTE_ITENS); } catch { /* sem o compêndio de itens */ }
  return nomes;
}

const pacoteDoMundo = nome => game.packs?.get?.(`world.${nome}`) ?? [...(game.packs?.values?.() ?? [])].find(p => p.metadata?.name === nome && (p.metadata?.packageType ?? "world") === "world") ?? null;

/** Junta os compêndios do EPM numa pasta da aba Compêndios (cria a pasta se não existir). Só o Mestre. */
export async function organizarCompendios() {
  if (!game.user?.isGM || (game.users?.activeGM && !game.users.activeGM.isSelf)) return null;
  const pastas = game.folders?.filter?.(f => f.type === "Compendium") ?? [];
  let pasta = pastas.find(f => f.name === PASTA_COMPENDIOS && !f.folder);
  pasta ??= await Folder.create({ name: PASTA_COMPENDIOS, type: "Compendium", color: "#4b3a78", sorting: "a" });
  if (!pasta) return null;
  for (const nome of await nomesCompendiosEpm()) {
    const pack = pacoteDoMundo(nome);
    if (!pack) continue;
    const atual = pack.folder?.id ?? pack.folder ?? null;
    if (atual === pasta.id) continue;
    try { if (typeof pack.setFolder === "function") await pack.setFolder(pasta); else await pack.configure({ folder: pasta.id }); }
    catch (err) { console.warn(`EPM | pasta do compêndio ${nome}`, err); }
  }
  return pasta;
}

export function registrarConteudo() {
  game.settings.register(MODULE_ID, "assinaturasConteudo", { scope: "world", config: false, type: Object, default: {} });
  game.settings.register(MODULE_ID, "ultimaVersaoVista", { scope: "client", config: false, type: String, default: "" });
  Hooks.once("ready", () => {
    sincronizarConteudo().then(() => avisoVersao()).catch(err => console.warn("EPM | conteúdo pronto", err));
    // Os compêndios de classes e itens sincronizam por conta própria; a pasta é arrumada depois de todos
    setTimeout(() => organizarCompendios().catch(err => console.warn("EPM | pasta dos compêndios", err)), 8000);
  });
}
