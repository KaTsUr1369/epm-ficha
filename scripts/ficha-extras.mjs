/**
 * Partes da ficha que vieram na 0.6.0 (raça pronta, Sanidade com estados e insanidades, idade opcional,
 * classes do Notion, votos, pactos, talentos, atributos acima de 4, teto de atributo e máximos automáticos).
 * Contas puras, chamadas por calcularFicha (data.mjs). Sem Foundry.
 */
import { efeitosDaRaca } from "./racas.mjs";
import { estadoSanidade } from "./insanidades.mjs";
import {
  bonusAtributosAltos, tetoAtributo, maximoRecurso, idArquetipo, ATRIBUTO_RECURSO_PADRAO, CLASSES_NOTION, valorPorNivel,
  faixaIdade, limiteVotos, TIPOS_PACTO, TAMANHO_EFEITOS, grauNucleo, MARCOS_CORRUPCAO, CONQUISTAS, META_CACADOR
} from "./regras-extras.mjs";

const n = v => Number(v) || 0;
const norm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Níveis por arquétipo da ficha ([{ arquetipo, nivel }]). */
export function niveisArquetipos(d) {
  const out = [];
  const a1 = idArquetipo(d.arquetipo);
  if (a1) out.push({ arquetipo: a1, nivel: Math.max(0, Math.floor(n(d.nivel) || 1)) });
  const a2 = idArquetipo(d.arquetipo2);
  if (a2 && n(d.nivel2) > 0) out.push({ arquetipo: a2, nivel: Math.floor(n(d.nivel2)) });
  return out;
}
const nivelDe = (d, arq) => niveisArquetipos(d).filter(x => x.arquetipo === arq).reduce((s, x) => s + x.nivel, 0);

/** Classe do Notion pelo texto da ficha ("Bárbaro" → barbaro). Só as completas. */
export function idClasse(texto) {
  const t = norm(texto);
  if (t.includes("barbar")) return "barbaro";
  if (t.includes("guardi")) return "guardiao";
  if (t.includes("lutador")) return "lutador";
  return "";
}

/**
 * Efeitos que entram antes das condições (imunidades e condições implicadas) e fontes de efeito
 * (Sanidade, idade, pacto quebrado, classe). `opcoes.idade` = regra opcional ligada no Escudo.
 */
export function fontesDaFicha(d, { opcoes = {}, agora = null } = {}) {
  const out = { imunidades: [], implica: [], fontesEfeito: [], mods: [], rd: [], resistencias: [], vantagensPericia: [], extrasAtaque: { armado: [], desarmado: [], todos: [] }, avisos: [] };

  // Raça pronta (habilidades e únicas escolhidas)
  const raca = efeitosDaRaca(d.racaEscolha);
  out.raca = raca;
  out.imunidades.push(...raca.imunidades);
  out.resistencias.push(...raca.resistencias);
  for (const v of raca.vantagensPericia ?? []) out.vantagensPericia.push(v);
  if (raca.desl) out.mods.push({ alvo: "deslocamento", valor: raca.desl, fonte: `Raça: ${raca.raca?.nome ?? ""}` });
  if (raca.ca) out.mods.push({ alvo: "ca", valor: raca.ca, fonte: `Raça: ${raca.raca?.nome ?? ""}` });
  if (raca.rd) out.rd.push({ valor: raca.rd, tipos: "todos os danos", fonte: `Raça: ${raca.raca?.nome ?? ""}` });

  // Sanidade: estado e insanidades ativas
  const ps = d.recursos?.ps ?? {};
  const estado = estadoSanidade(n(ps.value) + Math.max(0, n(ps.temp)));
  out.sanidade = estado;
  if (estado.mentais) out.fontesEfeito.push({ fonte: `Sanidade: ${estado.label}`, efeitos: { atributos: { inteligencia: estado.mentais, autocontrole: estado.mentais } }, tipo: "sanidade" });
  if (estado.testes) out.fontesEfeito.push({ fonte: `Sanidade: ${estado.label}`, efeitos: { testes: estado.testes }, tipo: "sanidade" });
  for (const ins of Object.values(d.insanidades ?? {})) {
    if (!ins || ins.encerrada) continue;
    for (const id of ins.condicoes ?? []) out.implica.push({ id, motivo: `Insanidade: ${ins.nome || ins.numero}` });
  }

  // Idade (regra opcional)
  if (opcoes.idade) {
    const faixa = faixaIdade(d.sobre?.idade ?? d.idade, d.racaEscolha?.id || "humano");
    out.idade = faixa;
    const f = `Idade: ${faixa?.label ?? ""}`;
    if (faixa?.id === "crianca") {
      for (const a of ["forca", "constituicao", "nucleo"]) out.mods.push({ alvo: `atributo.${a}`, valor: -1, fonte: f });
      out.mods.push({ alvo: "deslocamento", valor: -3, fonte: f });
    } else if (faixa?.id === "adolescente") {
      for (const a of ["forca", "constituicao"]) out.mods.push({ alvo: `atributo.${a}`, valor: -1, fonte: f });
    } else if (faixa?.id === "maduro") {
      out.mods.push({ alvo: "atributo.nucleo", valor: 1, fonte: f });
    } else if (faixa?.id === "idoso") {
      out.mods.push({ alvo: "atributo.nucleo", valor: 2, fonte: f });
    }
  }

  // Pactos quebrados: habilidades bloqueadas até a data definida
  for (const p of Object.values(d.pactos ?? {})) {
    if (!p?.quebrado) continue;
    const ate = n(p.bloqueioAte);
    if (!ate || agora === null || agora < ate) {
      out.fontesEfeito.push({ fonte: `Pacto quebrado: ${p.nome || "sem nome"}`, efeitos: { bloqueiaHabilidades: true }, tipo: "pacto" });
    }
    for (const [alvo, valor] of Object.entries(p.penalidade?.atributos ?? {})) if (n(valor)) out.mods.push({ alvo: `atributo.${alvo}`, valor: -Math.abs(n(valor)), fonte: `Pacto quebrado: ${p.nome || ""}` });
  }

  // Talentos comprados
  for (const t of Object.values(d.talentos ?? {})) {
    if (!t?.comprado) continue;
    for (const m of Object.values(t.mods ?? {})) if (m?.alvo && n(m.valor)) out.mods.push({ alvo: m.alvo, valor: n(m.valor), fonte: `Talento: ${t.nome || "sem nome"}` });
  }

  // Classes completas do Notion
  const classe = idClasse(d.classe);
  const comb = nivelDe(d, "combatente");
  const opc = d.classeEpm ?? {};
  out.classe = { id: classe, nivel: comb };
  if (classe === "barbaro" && comb >= 3) {
    const f = valorPorNivel(CLASSES_NOTION.barbaro.furia.tabela, comb);
    out.classe.furia = f ? { dano: f[1], rd: f[2], ativa: !!opc.furiaAtiva } : null;
    if (f && opc.furiaAtiva) {
      out.mods.push({ alvo: "danoAtaque", valor: f[1], fonte: "Fúria" });
      out.rd.push({ valor: f[2], tipos: "todos os danos", fonte: "Fúria" });
    }
    const crit = valorPorNivel(CLASSES_NOTION.barbaro.critico, comb);
    out.classe.critico = crit ? { mult: crit[1], margem: crit[2], max: crit[3] } : null;
  }
  if (classe === "guardiao" && comb >= 9) {
    const rd = valorPorNivel(CLASSES_NOTION.guardiao.corpoDePedra, comb)?.[1] ?? 0;
    if (rd) out.rd.push({ valor: rd, tipos: "todos os danos", fonte: "Corpo de Pedra" });
    out.classe.corpoDePedra = rd;
  }
  if (classe === "guardiao" && comb >= 6) out.classe.protecao = valorPorNivel(CLASSES_NOTION.guardiao.protecao, comb)?.[1] ?? "";
  if (classe === "lutador" && comb >= 3) {
    const dado = valorPorNivel(CLASSES_NOTION.lutador.porradaFranca, comb)?.[1];
    if (dado) out.extrasAtaque.desarmado.push({ formula: dado, fonte: "Porrada Franca" });
    const maxPos = valorPorNivel(CLASSES_NOTION.lutador.posicoesPorNivel, comb)?.[1] ?? 0;
    const ativas = (opc.posicoes ?? []).slice(0, maxPos);
    out.classe.posicoes = { max: maxPos, ativas };
    for (const id of ativas) {
      const pos = CLASSES_NOTION.lutador.posicoes.find(p => p.id === id);
      if (!pos || pos.nivel > comb) continue;
      if (pos.auto?.dano) out.extrasAtaque.todos.push({ formula: pos.auto.tipo ? `${pos.auto.dano}[${pos.auto.tipo}]` : pos.auto.dano, fonte: pos.nome });
      if (pos.auto?.rd) out.rd.push({ valor: pos.auto.rd, tipos: "todos os danos", fonte: pos.nome });
    }
  }
  if (classe === "barbaro" && comb >= 6) {
    out.classe.protecoes = (opc.protecoes ?? []).slice(0, CLASSES_NOTION.barbaro.protecao.niveis.filter(x => comb >= x).length);
  }

  // Tamanho (modelo da 0.6.0): CA e Furtividade
  const tam = TAMANHO_EFEITOS[d.tamanho || raca.raca?.tamanho];
  if (tam?.ca) out.mods.push({ alvo: "ca", valor: tam.ca, fonte: "Tamanho" });
  if (tam?.furtividade) out.mods.push({ alvo: "pericia.furtividade", valor: tam.furtividade, fonte: "Tamanho" });
  out.tamanho = tam ?? null;

  // Densidade de mana da região (Escudo → Mundo)
  const dens = opcoes.densidade ?? "normal";
  out.densidade = dens;
  if (dens === "nula") out.implica.push({ id: "epm-antimagia", motivo: "Densidade de mana nula" });
  out.custoMagiaPct = dens === "baixa" ? 0.25 : 0;
  out.recuperarManaMult = dens === "alta" ? 1.5 : dens === "baixa" ? 0.5 : 1;

  // Corrupção acumulada (0–100)
  const corr = Math.max(0, Math.min(100, Math.floor(n(d.corrupcao))));
  out.corrupcao = { valor: corr, marcos: MARCOS_CORRUPCAO.map(m => ({ ...m, atingido: corr >= m.valor })) };
  if (corr >= 25) out.implica.push({ id: "epm-mana-instavel", motivo: `Corrupção ${corr}` });

  // Treinos concluídos com efeito especial
  const concluidos = Object.values(d.treinamentos ?? {}).filter(t => t?.estado === "concluido");
  const temEspecial = id => concluidos.some(t => t.especial === id);
  out.menteBlindada = temEspecial("menteBlindada");
  out.meditacaoNucleo = temEspecial("meditacaoNucleo");
  out.memoriaTreinada = temEspecial("memoriaTreinada");
  out.especiaisTreino = [...new Set(concluidos.map(t => t.especial).filter(Boolean))];
  out.tecnologia = Math.max(1, Math.min(3, Math.floor(n(d.tecnologia) || 1) + concluidos.filter(t => t.especial === "familiaridade").length));

  // Títulos: conquistas (contadas pela ficha) e títulos ganhos; só o ativo dá bônus
  const cont = d.conquistas ?? {};
  const abates = {};
  for (const b of Object.values(d.bestiario ?? {})) if (b?.tipo) abates[b.tipo] = (abates[b.tipo] ?? 0) + Math.max(0, Math.floor(n(b.derrotados)));
  const titulos = [];
  for (const c of CONQUISTAS) titulos.push({ id: `c:${c.id}`, nome: c.label, texto: c.bonus, requisito: c.texto, progresso: Math.floor(n(cont[c.conta])), meta: c.meta, liberado: n(cont[c.conta]) >= c.meta, mods: c.mods, sanidade: c.sanidade ?? 0 });
  for (const [tipo, qtd] of Object.entries(abates)) {
    titulos.push({ id: `cacador:${tipo}`, nome: `Caçador de ${tipo}`, texto: `+2 no acerto contra ${tipo} (some no bônus externo do ataque).`, requisito: `Derrotar ${META_CACADOR} criaturas do tipo ${tipo} (Bestiário).`, progresso: qtd, meta: META_CACADOR, liberado: qtd >= META_CACADOR, mods: [], contraTipo: tipo });
  }
  for (const [id, t] of Object.entries(d.titulos ?? {})) if (t) titulos.push({ id: `t:${id}`, nome: t.nome || "Título", texto: t.texto ?? "", requisito: t.origem ?? "", liberado: true, mods: [], proprio: id });
  const ativo = titulos.find(t => t.id === d.tituloAtivo && t.liberado) ?? null;
  out.titulos = { lista: titulos, ativo };
  if (ativo) for (const m of ativo.mods ?? []) out.mods.push({ alvo: m.alvo, valor: m.valor, fonte: `Título: ${ativo.nome}` });

  // Votos e pactos (contagem)
  out.votos = { usados: Object.values(d.votos ?? {}).filter(Boolean).length, limite: limiteVotos(n(d.nivel) + n(d.nivel2)) };
  out.pactos = Object.fromEntries(Object.entries(TIPOS_PACTO).map(([id, t]) => [id, { label: t.label, limite: t.limite, usados: Object.values(d.pactos ?? {}).filter(p => p && p.tipo === id && !p.quebrado).length }]));
  return out;
}

/**
 * Depois dos atributos: bônus de atributos acima de 4 (mods e RD), teto por nível e avisos.
 * `atributos` = { id: { total, base, raca, aumento, outros, mod } }.
 */
export function aposAtributos(d, atributos, { pericias = [] } = {}) {
  const totais = Object.fromEntries(Object.entries(atributos).map(([id, a]) => [id, a.total]));
  const altos = bonusAtributosAltos(totais);
  const mods = [];
  const rd = [];
  if (altos.deslocamento) mods.push({ alvo: "deslocamento", valor: altos.deslocamento, fonte: "Destreza acima de 4" });
  if (altos.rd) rd.push({ valor: altos.rd, tipos: "todos os danos", fonte: "Constituição acima de 4" });
  if (altos.aparenciaCarisma) {
    for (const p of pericias) if ((p.atributos ?? []).includes("carisma")) mods.push({ alvo: `pericia.${p.id}`, valor: altos.aparenciaCarisma, fonte: "Aparência 6+" });
  }
  const extrasAtaque = { armado: [], desarmado: [] };
  if (altos.danoArmado) extrasAtaque.armado.push({ formula: String(altos.danoArmado), fonte: "Força acima de 4" });
  if (altos.danoDesarmado) extrasAtaque.desarmado.push({ formula: altos.danoDesarmado, fonte: "Força acima de 4" });

  // Proteções do Bárbaro que somam atributo na CA, Defesa (Bloqueio) e Esquiva
  if (idClasse(d.classe) === "barbaro") {
    const comb = nivelDe(d, "combatente");
    const qtd = CLASSES_NOTION.barbaro.protecao.niveis.filter(x => comb >= x).length;
    const escolhidas = (d.classeEpm?.protecoes ?? []).slice(0, qtd);
    for (const [id, atr, nome] of [["semArmadura", "constituicao", "Proteção sem Armadura"], ["divina", "nucleo", "Proteção Divina"]]) {
      if (!escolhidas.includes(id)) continue;
      const v = Math.floor(n(totais[atr]));
      if (v) for (const alvo of ["ca", "defesa.bloqueio", "defesa.esquiva"]) mods.push({ alvo, valor: v, fonte: nome });
    }
  }

  // Aura de Proteção (treino): 2 × Núcleo de RD ou Núcleo na CA; a Superior dá os dois
  const concl = Object.values(d.treinamentos ?? {}).filter(t => t?.estado === "concluido");
  const nuc = Math.floor(n(totais.nucleo));
  if (nuc > 0 && concl.some(t => t.especial === "auraProtecao" || t.especial === "auraProtecaoSuperior")) {
    const superior = concl.some(t => t.especial === "auraProtecaoSuperior");
    const naCa = d.auraProtecaoCa === true;
    if (superior || !naCa) rd.push({ valor: 2 * nuc, tipos: "todos os danos", fonte: "Aura de Proteção" });
    if (superior || naCa) mods.push({ alvo: "ca", valor: nuc, fonte: "Aura de Proteção" });
  }
  const grau = grauNucleo(totais.nucleo);

  // Teto: 8 até o nível 20 de arquétipo, 10 no 21, 12 no 31, 15 no 41 (o maior arquétipo manda)
  const maiorNivel = Math.max(1, ...niveisArquetipos(d).map(x => x.nivel), Math.floor(n(d.nivel) || 1));
  const teto = tetoAtributo(maiorNivel);
  const acima = Object.values(atributos).filter(a => a.base + a.raca + a.aumento + a.outros > teto).map(a => a.label);
  const avisos = acima.length ? [`Acima do teto de ${teto} para o nível ${maiorNivel}: ${acima.join(", ")}.`] : [];
  return { altos, mods, rd, extrasAtaque, teto, acima, avisos, grau };
}

/** Vida, Mana e Estamina máximas automáticas (quando ligadas na ficha). */
export function maximosAutomaticos(d, atributos, raca) {
  const cfg = d.recursosAuto ?? {};
  if (!cfg.ativo) return null;
  const niveis = niveisArquetipos(d);
  const base = raca?.raca?.recursos ?? cfg.racaBase ?? {};
  const out = {};
  for (const r of ["pv", "pm", "pe"]) {
    const attr = cfg.atributos?.[r] ?? ATRIBUTO_RECURSO_PADRAO[r];
    const a = atributos[attr];
    const atributo = attr === "nenhum" || !a ? 0 : Math.floor(n(a.base) + n(a.raca) + n(a.aumento) + n(a.outros));
    const extraFixo = r === "pv" ? n(raca?.pv) : r === "pm" ? n(raca?.pm) : 0;
    const extraPorNivel = r === "pv" ? n(raca?.pvPorNivel) : 0;
    out[r] = maximoRecurso(r, {
      raca: n(base[r] ?? cfg.racaBase?.[r]), atributo, niveis,
      rolagens: Object.fromEntries(Object.entries(cfg.rolagens ?? {}).map(([arq, v]) => [arq, v?.[r] ?? []])),
      usarMedia: cfg.modo !== "rolagem", extraFixo, extraPorNivel
    });
    out[r].atributo = attr;
  }
  return out;
}

/** Movimentos (terrestre, voo, nado, escalada, escavação) e sentidos. "igual" = deslocamento final. */
export function movimentosESentidos(d, deslocamentoFinal, raca) {
  const m = d.movimentos ?? {};
  const val = (manual, daRaca) => {
    if (n(manual) > 0) return n(manual);
    if (daRaca === "igual") return deslocamentoFinal;
    return n(daRaca);
  };
  const movimentos = [
    { id: "voo", label: "Voo", valor: val(m.voo, raca?.voo) },
    { id: "nado", label: "Natação", valor: val(m.nado, raca?.nado) },
    { id: "escalada", label: "Escalada", valor: val(m.escalada, raca?.escalada) },
    { id: "escavacao", label: "Escavação", valor: val(m.escavacao, raca?.escavacao) }
  ];
  const visao = Math.max(n(d.sentidos?.visaoEscuro), n(raca?.visao));
  return {
    tamanho: d.tamanho || raca?.raca?.tamanho || "",
    movimentos, temMovimentos: movimentos.some(x => x.valor > 0),
    sentidos: { visaoEscuro: visao, outros: String(d.sentidos?.outros ?? "") }
  };
}
