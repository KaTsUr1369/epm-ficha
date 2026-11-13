/**
 * Contexto dos painéis da 0.6.0 (raça, corpo, Sanidade, corrupção, máximos automáticos, classes do Notion,
 * votos e pactos, talentos, catálogos, títulos, relógios, nomeação, conhecimento de criaturas, receio e confiança).
 * Puro: recebe os dados prontos (o que vem das configurações do mundo chega em `mundo`).
 */
import { ATRIBUTOS, RECURSOS, FLAG, CONDICOES } from "./config.mjs";
import { int, num, normalizarTexto } from "./data.mjs";
import { racaPorId, TAMANHOS } from "./racas.mjs";
import { ESTADOS_TOKEN } from "./token-estados.mjs";
import { ESTADOS_SANIDADE } from "./insanidades.mjs";
import { CATEGORIAS_TREINO, TREINAMENTOS_NOTION } from "./catalogos.mjs";
import {
  RECURSOS_ARQUETIPO, ATRIBUTO_RECURSO_PADRAO, CLASSES_NOTION, TIPOS_VOTO, TIPOS_PACTO, PATENTES, REGRAS_HIERARQUIA,
  FAIXAS_NOMEACAO, ROTULOS_BONUS_ALTO, limiteNomeadas, pontosLideranca, ATIVAS_EM_COMBATE, TAMANHO_EFEITOS, valorPorNivel, FAIXAS_IDADE, listaRolagens
} from "./regras-extras.mjs";
import { niveisArquetipos, trocasBonus } from "./ficha-extras.mjs";

export const TIPOS_INSANIDADE = { fobia: "Fobia", compulsao: "Compulsão", paranoia: "Paranoia", alucinacao: "Alucinação", mania: "Mania", outro: "Outro" };
export const INTENSIDADES_INSANIDADE = {
  temporaria: { label: "Temporária", texto: "Até o descanso longo." },
  intensa: { label: "Intensa", texto: "Efeito dobrado por 1d4 dias." },
  permanente: { label: "Permanente", texto: "Até tratar na história." }
};
const sel = (lista, atual) => lista.map(([id, label]) => ({ id, label, selected: String(id) === String(atual) }));

export function contexto060({ dados = {}, ficha, edicao = false, editavel = false, isGM = false, mundo = {}, opcoesNotion = {} }) {
  const ex = ficha.extras ?? {};
  const v = {};

  /* Raça e corpo */
  const raca = racaPorId(dados.racaEscolha?.id);
  const corpo = ex.corpo ?? {};
  const tam = TAMANHO_EFEITOS[corpo.tamanho] ?? null;
  v.tokens = {
    estados: ESTADOS_TOKEN.map(e => ({ ...e, img: dados.tokensEstado?.[e.id] ?? "" })),
    transformacoes: Object.entries(dados.transformacoes ?? {}).filter(([, t]) => t).map(([id, t]) => ({ id, nome: t.nome || "Transformação", img: t.img ?? "", troca: !!t.trocarToken })),
    escolha: dados.tokenFixo ? `Fixado: ${ESTADOS_TOKEN.find(e => e.id === dados.tokenFixo)?.label ?? `Transformação ${dados.transformacoes?.[String(dados.tokenFixo).replace("transf:", "")]?.nome ?? ""}`}`
      : dados.tokenEscolha ? (ESTADOS_TOKEN.find(e => e.id === dados.tokenEscolha)?.label ?? `Transformado: ${dados.transformacoes?.[String(dados.tokenEscolha).replace("transf:", "")]?.nome ?? ""}`) : "Automático"
  };
  v.raca = {
    escolhida: !!raca, nome: dados.raca || raca?.nome || "", info: raca ? `${TAMANHOS[raca.tamanho] ?? raca.tamanho} · ${raca.altura} · adulto ${raca.idade?.adulta}, até ${raca.idade?.maxima}` : "",
    ativaveis: ex.raca?.ativaveis ?? [],
    habilidades: (ex.raca?.habilidades ?? []).map(h => ({ nome: h.nome, texto: h.texto, unica: !!h.unica, origem: h.origem })),
    caminhos: (raca?.caminhos ?? []).map(c => {
      const valor = Math.max(0, int(dados.caminhos?.[c.id]));
      return { ...c, valor, pct: Math.min(100, Math.round((valor / Math.max(1, c.meta)) * 100)), completo: valor >= c.meta };
    }),
    recursos: raca?.recursos ? `Vida ${raca.recursos.pv} · Mana ${raca.recursos.pm} · Estamina ${raca.recursos.pe}` : ""
  };
  v.corpo = {
    tamanho: corpo.tamanho, tamanhoLabel: TAMANHOS[corpo.tamanho] ?? "—", tamanhos: sel(Object.entries(TAMANHOS), corpo.tamanho),
    efeitoTamanho: tam ? [tam.ca ? `CA ${tam.ca > 0 ? "+" : ""}${tam.ca}` : "", tam.furtividade ? `Furtividade ${tam.furtividade > 0 ? "+" : ""}${tam.furtividade}` : "", `alcance ${tam.alcance}`, `carga ×${String(tam.carga).replace(".", ",")}`].filter(Boolean).join(" · ") : "",
    movimentos: (corpo.movimentos ?? []).map(m => ({ ...m, campo: `flags.${FLAG}.movimentos.${m.id}`, manual: num(dados.movimentos?.[m.id]) })),
    temMovimentos: !!corpo.temMovimentos, visao: corpo.sentidos?.visaoEscuro ?? 0, visaoManual: num(dados.sentidos?.visaoEscuro), outros: corpo.sentidos?.outros ?? ""
  };

  /* Idade (regra opcional) */
  v.idade = opcoesNotion.idade ? { faixa: ex.idade, faixas: FAIXAS_IDADE } : null;

  /* Grau do Núcleo (opção do Mestre + cada ficha escolhe mostrar) */
  v.grau = opcoesNotion.grauNucleo && ex.grau ? { ...ex.grau, mostrar: dados.mostrarGrau !== false } : null;

  /* Atributos acima de 4 e teto */
  const altos = ex.altos ?? {};
  const fonte = bonus => ATRIBUTOS[altos.fontes?.[bonus]]?.label ?? "";
  const linhas = [];
  if (altos.deslocamento) linhas.push(`${fonte("destreza")}: +${altos.deslocamento} m de deslocamento`);
  if (altos.danoArmado) linhas.push(`${fonte("forca")}: +${altos.danoArmado} de dano com armas corpo a corpo`);
  if (altos.danoDesarmado) linhas.push(`${fonte("forca")}: +${altos.danoDesarmado} de dano desarmado`);
  if (altos.rd) linhas.push(`${fonte("constituicao")}: RD ${altos.rd}`);
  if (altos.idiomasExtras) linhas.push(`${fonte("carisma")}: +${altos.idiomasExtras} idioma(s)`);
  if (altos.ptTreino) linhas.push(`${fonte("inteligencia")}: +${altos.ptTreino} PT por ação de treino`);
  if (altos.phExtra) linhas.push(`${fonte("inteligencia")}: +${altos.phExtra} PH por ação de treino`);
  if (altos.rdSanidade) linhas.push(`${fonte("autocontrole")}: RD de Sanidade ${altos.rdSanidade}`);
  if (altos.magiasNucleo) linhas.push(`${fonte("nucleo")}: +${altos.magiasNucleo} magia(s) conhecida(s)`);
  if (altos.aparenciaCarisma) linhas.push(`Aparência: +${altos.aparenciaCarisma} nas perícias com Carisma na base`);
  const tb = trocasBonus(dados);
  const nomeBonus = id => ROTULOS_BONUS_ALTO[id] ?? id;
  v.altos = {
    linhas, tem: linhas.length > 0, teto: ex.teto ?? 8,
    trocas: tb.lista.map(t => ({
      ...t, aLabel: ATRIBUTOS[t.a]?.label ?? t.a, bLabel: ATRIBUTOS[t.b]?.label ?? t.b,
      texto: `${ATRIBUTOS[t.a]?.label ?? t.a} dá ${nomeBonus(t.b)}; ${ATRIBUTOS[t.b]?.label ?? t.b} dá ${nomeBonus(t.a)}`,
      estado: t.ativa ? "ativa" : t.conflito ? "atributo já trocado em outra troca" : t.voto ? "esperando o Mestre aprovar o voto" : "sem voto ligado"
    }))
  };
  v.altos.temTroca = v.altos.trocas.length > 0;

  /* Máximos automáticos */
  const auto = dados.recursosAuto ?? {};
  // Valores de cada nível (rolados ou digitados à mão), por arquétipo e recurso
  const niveisRec = niveisArquetipos(dados);
  const porNivel = niveisRec.map((nv, idx) => {
    const extras = idx === 0 ? nv.nivel - 1 : nv.nivel;
    const cfgArq = RECURSOS_ARQUETIPO[nv.arquetipo];
    if (!cfgArq || extras <= 0) return null;
    return {
      arquetipo: nv.arquetipo, label: `${nv.arquetipo[0].toUpperCase()}${nv.arquetipo.slice(1)}`,
      niveis: Array.from({ length: extras }, (_, i) => ({ n: (idx === 0 ? 2 : 1) + i })),
      recursos: ["pv", "pe", "pm"].map(r => {
        const lista = listaRolagens(auto.rolagens?.[nv.arquetipo]?.[r]);
        return {
          id: r, label: RECURSOS[r].abrev ?? r.toUpperCase(), dado: cfgArq[r].dado, media: cfgArq[r].media,
          valores: Array.from({ length: extras }, (_, i) => ({ i, valor: Number(lista[i]) > 0 ? Number(lista[i]) : "" }))
        };
      })
    };
  }).filter(Boolean);
  v.recursosAuto = {
    ativo: !!auto.ativo, modo: ["rolagem", "manual"].includes(auto.modo) ? auto.modo : "media",
    porNivel, temPorNivel: porNivel.length > 0,
    ajuste: { pv: int(auto.ajuste?.pv), pe: int(auto.ajuste?.pe), pm: int(auto.ajuste?.pm) },
    linhas: ["pv", "pe", "pm"].map(r => {
      const calc = ex.recursosAuto?.[r];
      const attr = auto.atributos?.[r] ?? ATRIBUTO_RECURSO_PADRAO[r];
      return {
        id: r, label: RECURSOS[r].label, total: calc?.total ?? null, partes: (calc?.partes ?? []).map(p => `${p.rotulo}: ${p.valor}`).join(" · "),
        opcoes: [...Object.entries(ATRIBUTOS).map(([id, a]) => [id, a.label]), ["nenhum", "Nenhum"]].map(([id, label]) => ({ id, label, selected: id === attr }))
      };
    }),
    tabela: Object.entries(RECURSOS_ARQUETIPO).map(([arq, t]) => `${arq[0].toUpperCase()}${arq.slice(1)}: Vida ${t.pv.inicial} + ${t.pv.dado}(${t.pv.media}), Estamina ${t.pe.inicial} + ${t.pe.dado}(${t.pe.media}), Mana ${t.pm.inicial} + ${t.pm.dado}(${t.pm.media})`)
  };

  /* Sanidade, insanidades e corrupção */
  const san = ex.sanidade ?? ESTADOS_SANIDADE[0];
  v.sanidade = {
    estado: san, valor: ficha.recursos?.ps?.value ?? 0, max: ficha.recursos?.ps?.max ?? 100,
    estados: ESTADOS_SANIDADE.map(e => ({ ...e, atual: e.id === san.id })),
    insanidades: Object.entries(dados.insanidades ?? {}).filter(([, i]) => i).map(([id, i]) => {
      const intensidade = INTENSIDADES_INSANIDADE[i.intensidade] ? i.intensidade : i.tipo === "permanente" ? "permanente" : i.intensa ? "intensa" : "temporaria";
      return {
        id, nome: i.nome || "Insanidade", texto: i.texto ?? "", motivo: i.motivo ?? "", encerrada: !!i.encerrada,
        tipoInsanidade: i.categoria ?? "", tipoLabel: TIPOS_INSANIDADE[i.categoria] ?? "", gatilho: i.gatilho ?? "", efeito: i.efeito ?? "",
        intensidade, intensidadeLabel: INTENSIDADES_INSANIDADE[intensidade].label, intensidadeTexto: INTENSIDADES_INSANIDADE[intensidade].texto,
        condicoes: (i.condicoes ?? []).map(cid => CONDICOES.find(c => c.id === cid)?.label ?? cid).join(", "),
        condicoesDica: (i.condicoes ?? []).map(cid => { const c = CONDICOES.find(x => x.id === cid); return c ? `${c.label}: ${c.efeito}` : cid; }).join("\n"), criado: num(i.criado),
        tipos: sel(Object.entries(TIPOS_INSANIDADE), i.categoria ?? ""), intensidades: sel(Object.entries(INTENSIDADES_INSANIDADE).map(([k, x]) => [k, x.label]), intensidade)
      };
    }).sort((a, b) => Number(a.encerrada) - Number(b.encerrada) || b.criado - a.criado),
    menteBlindada: !!ex.menteBlindada
  };
  v.sanidade.temInsanidades = v.sanidade.insanidades.length > 0;
  v.corrupcao = ex.corrupcao ? { ...ex.corrupcao, tem: ex.corrupcao.valor > 0 || isGM } : null;

  /* Classe do Notion */
  const cl = ex.classe ?? {};
  const c = {};
  if (cl.id) {
    const def = CLASSES_NOTION[cl.id];
    c.id = cl.id; c.nome = def?.nome ?? cl.id; c.nivel = cl.nivel;
    c.arquetipoLabel = { combatente: "Combatente", conjurador: "Conjurador", artifice: "Artífice" }[def?.arquetipo ?? "combatente"] ?? "Combatente";
    if (cl.elemental) {
      const e = cl.elemental;
      c.elemental = { ...e, texto: `Arma Elemental: +${e.dado ?? "—"} e Núcleo Vermelho +${e.bonus} de dano elemental (${e.elemento ?? "sem elemento"}) · margem de ameaça +${e.margem}`,
        opcoes: e.liberados.map(x => ({ id: x, label: x, selected: x === e.elemento })) };
    }
    if (cl.formas) c.formas = `Faca Vorpal: ${cl.formas} formas de arma`;
    if (cl.histeria) c.histeria = cl.histeria;
    if (cl.pistola) c.pistola = `Pistola do Caçador: ${cl.pistola} Perfurante, 18 m, Ação Bônus + 1 Bala de Mercúrio`;
    if (cl.inspiracao) c.inspiracao = `Dado de Inspiração: ${cl.inspiracao} (+5 quando usado em Ataque, Resistência ou Perícia)`;
    if (cl.furia) c.furia = { ...cl.furia, usos: int(dados.classeEpm?.furiaUsos), max: CLASSES_NOTION.barbaro.furia.usos };
    if (cl.critico) c.critico = `Crítico Brutal: ${cl.critico.margem < 20 ? `margem ${cl.critico.margem}–20, ` : ""}multiplicador +${cl.critico.mult} (até ×${cl.critico.max})`;
    if (cl.id === "barbaro" && cl.nivel >= 6) {
      const max = CLASSES_NOTION.barbaro.protecao.niveis.filter(x => cl.nivel >= x).length;
      const escolhidas = dados.classeEpm?.protecoes ?? [];
      c.protecoes = { max, opcoes: CLASSES_NOTION.barbaro.protecao.opcoes.map(([id, nome, texto]) => ({ id, nome, texto, ativo: escolhidas.includes(id) })) };
    }
    if (cl.corpoDePedra) c.corpoDePedra = `Corpo de Pedra: RD ${cl.corpoDePedra}`;
    if (cl.protecao) c.protecaoGuardiao = `Proteção (ao defender um aliado): ${cl.protecao}`;
    if (cl.id === "lutador" && cl.nivel >= 3) {
      c.porradaFranca = `Porrada Franca: +${valorPorNivel(CLASSES_NOTION.lutador.porradaFranca, cl.nivel)?.[1] ?? "—"} nos ataques desarmados`;
      if (cl.posicoes?.max) {
        c.posicoes = { max: cl.posicoes.max, opcoes: CLASSES_NOTION.lutador.posicoes.filter(p => p.nivel <= cl.nivel).map(p => ({ id: p.id, nome: p.nome, texto: p.texto, ativo: (cl.posicoes.ativas ?? []).includes(p.id) })) };
      }
    }
  }
  v.classe = cl.id ? c : null;
  v.classeElemental = /elemental/i.test(String(dados.classe ?? ""));

  /* Turno: conversão da Ação Padrão */
  v.turno = { convertida: dados.acoes?.convertida ?? "", padraoLivre: !dados.acoes?.padrao, completaLivre: !dados.acoes?.padrao && !dados.acoes?.movimento };

  /* Tecnologia */
  {
    const bruto = dados;
    const temOrigem = !!String(bruto.regiaoOrigem ?? "");
    v.tecnologia = {
      nivel: ex.tecnologia ?? 1, temOrigem, base: Math.max(1, int(dados.tecnologia, 1)),
      opcoes: sel([[1, "1 (Umbra'Draxil)"], [2, "2 (Briavoterna)"], [3, "3 (Genesis)"]], Math.max(1, int(dados.tecnologia, 1))),
      adaptacao: sel([["", "Automática (treinos)"], ["0", "Sem adaptação"], ["2", "Adaptado ao nível 2"], ["3", "Adaptado ao nível 3"]], String(bruto.adaptacaoTec ?? ""))
    };
  }

  /* Votos e pactos */
  v.votos = {
    limite: ex.votos?.limite ?? 3, usados: ex.votos?.usados ?? 0,
    lista: Object.entries(dados.votos ?? {}).filter(([, x]) => x).map(([id, x]) => ({
      id, nome: x.nome ?? "", tipo: x.tipo ?? "ativavel", tipoLabel: TIPOS_VOTO[x.tipo]?.label ?? "Ativável", custo: x.custo ?? "", efeito: x.efeito ?? "", usado: !!x.usado, aprovado: !!x.aprovado,
      tipos: sel(Object.entries(TIPOS_VOTO).map(([k, t]) => [k, t.label]), x.tipo ?? "ativavel"), criado: num(x.criado)
    })).sort((a, b) => a.criado - b.criado)
  };
  v.votos.excedido = v.votos.usados > v.votos.limite;
  v.pactos = {
    tipos: Object.entries(ex.pactos ?? {}).map(([id, t]) => ({ id, ...t, excedido: t.usados > t.limite })),
    lista: Object.entries(dados.pactos ?? {}).filter(([, x]) => x).map(([id, x]) => ({
      id, nome: x.nome ?? "", tipo: x.tipo ?? "npc", tipoLabel: TIPOS_PACTO[x.tipo]?.label ?? "", com: x.com ?? "", clausulas: x.clausulas ?? "", beneficios: x.beneficios ?? "",
      quebrado: !!x.quebrado, cumprido: !!x.cumprido, penalidade: Object.entries(x.penalidade?.atributos ?? {}).map(([a, n]) => `−${n} ${ATRIBUTOS[a]?.abrev ?? a}`).join(", "),
      tipos: sel(Object.entries(TIPOS_PACTO).map(([k, t]) => [k, t.label]), x.tipo ?? "npc"), criado: num(x.criado)
    })).sort((a, b) => a.criado - b.criado)
  };

  /* Talentos */
  v.talentos = {
    pev: ficha.pontos?.pev ?? 0,
    lista: Object.entries(dados.talentos ?? {}).filter(([, t]) => t).map(([id, t]) => ({
      id, nome: t.nome ?? "", custo: int(t.custo), descricao: t.descricao ?? "", comprado: !!t.comprado, semPev: int(t.custo) > (ficha.pontos?.pev ?? 0),
      mods: Object.entries(t.mods ?? {}).filter(([, m]) => m).map(([mid, m]) => ({ id: mid, alvo: m.alvo, valor: num(m.valor) })), criado: num(t.criado)
    })).sort((a, b) => a.criado - b.criado)
  };

  /* Catálogo de treinos do Notion por categoria */
  v.catalogoTreinos = CATEGORIAS_TREINO.map(cat => ({
    ...cat, itens: TREINAMENTOS_NOTION.map((t, indice) => ({ ...t, indice })).filter(t => t.categoria === cat.id)
      .map(t => ({ indice: t.indice, nome: t.nome, resumo: `${t.tempo} ${t.unidade} · ${t.pt} PT · ${t.requisitos}`, beneficios: t.beneficios, modelo: !!t.modelo }))
  })).filter(cat => cat.itens.length);
  v.categoriasTreino = CATEGORIAS_TREINO;

  /* Títulos e conquistas */
  const tit = ex.titulos ?? { lista: [], ativo: null };
  v.titulos = {
    ativo: tit.ativo, lista: tit.lista.map(t => ({ ...t, selected: tit.ativo?.id === t.id, pct: t.meta ? Math.min(100, Math.round((num(t.progresso) / t.meta) * 100)) : 100 })),
    liberados: tit.lista.filter(t => t.liberado).map(t => ({ id: t.id, nome: t.nome, selected: tit.ativo?.id === t.id })),
    contadores: { criticos: int(dados.conquistas?.criticos), colapsos: int(dados.conquistas?.colapsos), pactosCumpridos: int(dados.conquistas?.pactosCumpridos) }
  };

  /* Relógios visíveis e região */
  v.relogios = mundo.relogios ?? [];
  v.compendio = mundo.compendio ?? null;
  v.treinosInfo = ex.treinosInfo ?? [];

  /* Companheiros: nomeação, liderança e hierarquia */
  const nivelTotal = ficha.nivelTotal ?? 1;
  const nomeadas = Object.values(dados.companheiros ?? {}).filter(x => x?.nomeada);
  v.lideranca = {
    nomeadas: nomeadas.length, limite: limiteNomeadas(nivelTotal), pontos: pontosLideranca(nivelTotal), ativas: ATIVAS_EM_COMBATE,
    faixas: FAIXAS_NOMEACAO.map(f => `${f.label} (nível ${f.de}–${f.ate}): ${f.pm} PM, ${f.exaustao} Exaustão`),
    patentes: PATENTES, regras: REGRAS_HIERARQUIA,
    companheiros: Object.entries(dados.companheiros ?? {}).filter(([, x]) => x).map(([id, x]) => ({
      id, nome: x.nome || "Companheiro", nomeada: !!x.nomeada, faixa: FAIXAS_NOMEACAO.find(f => f.id === x.faixa)?.label ?? "",
      quantidade: int(x.quantidade, 1), ativo: !!x.ativoCombate, patentes: sel(PATENTES.map(p => [p.id, p.label]), x.patente ?? ""),
      receio: int(x.receio), confianca: int(x.confianca), moral: int(x.confianca) - int(x.receio)
    }))
  };
  v.lideranca.excedido = v.lideranca.nomeadas > v.lideranca.limite;
  v.lideranca.ativosExcedido = v.lideranca.companheiros.filter(x => x.ativo).length > ATIVAS_EM_COMBATE;

  /* Bestiário: conhecimento compartilhado e ficha de criatura */
  const conh = mundo.conhecimento ?? {};
  v.criaturas = Object.entries(dados.bestiario ?? {}).filter(([, b]) => b).map(([id, b]) => {
    const chave = normalizarTexto(b.nome ?? "").replace(/\s+/g, "-");
    const nivel = int(conh[chave]?.nivel);
    return {
      id, nome: b.nome || "Criatura", nivel, nivelLabel: ["Nome e tipo", "Resistências e imunidades", "Fraquezas e nível de dano", "Habilidades e lore"][nivel],
      campos: CAMPOS_CRIATURA.map(([campo, label, tipo]) => ({ campo, label, tipo, valor: b[campo] ?? "", nome: `flags.${FLAG}.bestiario.${id}.${campo}`, area: tipo === "area" })),
      presenca: b.presenca ?? "", nd: num(b.nd), pev: num(b.nd) * 5
    };
  });

  return v;
}

/** Campos da ficha de criatura (o banco Criaturas do Notion está vazio: modelo da 0.6.0). */
export const CAMPOS_CRIATURA = [
  ["tamanho", "Tamanho", "texto"], ["regiao", "Região", "texto"], ["nd", "ND", "numero"], ["nomeacao", "Grau de Nomeação", "texto"],
  ["pvTexto", "Vida / Mana / Estamina", "texto"], ["defesasCa", "CA / Esquiva / Bloqueio", "texto"], ["deslocamentoTexto", "Deslocamentos", "texto"],
  ["atributosTexto", "Atributos e perícias", "area"], ["defesasTexto", "Defesas por tipo e nível", "area"], ["acoes", "Ações (Padrão, Bônus, Reação, Lendária)", "area"],
  ["presenca", "Presença (dano de Sanidade)", "texto"], ["moral", "Moral", "texto"], ["ingredientes", "Ingredientes (Produção)", "area"]
];

/** Exemplo do Notion-modelo: Lobo de Cinzas. */
export const EXEMPLO_CRIATURA = {
  nome: "Lobo de Cinzas", tipo: "Fera", local: "Umbra'Draxil", tamanho: "Médio", regiao: "Umbra'Draxil", nd: 3, nomeacao: "Fraca",
  pvTexto: "Vida 38", defesasCa: "CA 14", deslocamentoTexto: "12 m",
  acoes: "Mordida +9: 1d10 + 4 Perfurante e 1d6 Fogo.\nUivo em Brasa (Ação Bônus, 1×/combate): lobos aliados ganham +2 no acerto por 2 turnos.",
  resistencias: ["Fogo"], fraquezas: ["Água", "Gelo"], imunidades: [], moral: "Foge com metade da Vida se o alfa cair.",
  ingredientes: "Presas em Brasa (Alquimia), Pele Cinzenta (Forja)", presenca: ""
};
