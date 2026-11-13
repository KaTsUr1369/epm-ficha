import { TREINAMENTOS_NOTION } from "./catalogos.mjs";
import { ARQUETIPOS, estilosEscolhidos, nivelArquetipo } from "./arquetipos.mjs";
import { NIVEIS_REGIAO, idRegiao } from "./tecnologia.mjs";
/**
 * Partes da ficha que vieram na 0.6.0 (raça pronta, Sanidade com estados e insanidades, idade opcional,
 * classes do Notion, votos, pactos, talentos, atributos acima de 4, teto de atributo e máximos automáticos).
 * Contas puras, chamadas por calcularFicha (data.mjs). Sem Foundry.
 */
import { num as numBonus } from "./numeros.mjs";
import { efeitosDaRaca } from "./racas.mjs";
import { estadoSanidade } from "./insanidades.mjs";
import { efeitosDosTraumas, dotsDeAcumulos, DANO_ACUMULO_PADRAO, ROTULOS_ACUMULAVEIS } from "./opcionais.mjs";
import {
  bonusAtributosAltos, tetoAtributo, maximoRecurso, tabelaRecursos, idArquetipo, ATRIBUTO_RECURSO_PADRAO, CLASSES_NOTION, valorPorNivel,
  faixaIdade, FAIXAS_IDADE, limiteVotos, TIPOS_PACTO, TAMANHO_EFEITOS, grauNucleo, MARCOS_CORRUPCAO, CONQUISTAS, META_CACADOR
} from "./regras-extras.mjs";

const n = v => Number(v) || 0;
const norm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Lista dos bônus ajustáveis do cálculo em andamento (o cálculo da ficha é síncrono). */
let coletorAjustes = null;
export function iniciarAjustes() { coletorAjustes = []; }
export function terminarAjustes() { const l = coletorAjustes ?? []; coletorAjustes = null; return l; }

/** Chave estável de um bônus ajustável (fonte + alvo), sem pontos (vira caminho de flag). */
export const chaveAjuste = (fonte, alvo) => `${fonte}@${alvo}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Bônus de classe e arquétipo com o valor trocado pela mesa (flags.ajustesBonus[chave]).
 * Número para mods e RD; fórmula para dano extra. Vazio = valor do livro. 0 desliga.
 */
export function ajustarBonus(d, item, alvo, campo = "valor") {
  const chave = chaveAjuste(item.fonte, alvo);
  const padrao = item[campo];
  const ov = d.ajustesBonus?.[chave];
  const temOv = ov !== undefined && ov !== null && String(ov).trim() !== "";
  if (temOv) item[campo] = campo === "formula" ? String(ov).trim() : n(ov);
  coletorAjustes?.push({ chave, origem: item.origem, fonte: item.fonte, alvo, campo, padrao, valor: item[campo], alterado: temOv && String(item[campo]) !== String(padrao) });
  return item;
}

/** Condições que um bônus extra pode exigir (lista para o seletor). */
export function condicoesBonusExtra(d = {}) {
  const out = [{ id: "sempre", label: "Sempre" }];
  for (const [id, e] of Object.entries(ARQUETIPOS.combatente.estilos)) out.push({ id: `estilo:${id}`, label: `Estilo: ${e.nome}`, grupo: "Combatente" });
  for (const [id, m] of Object.entries(ARQUETIPOS.combatente.maestrias)) out.push({ id: `maestria:${id}`, label: `Maestria: ${m.nome}`, grupo: "Combatente" });
  out.push({ id: "classe:furia", label: "Fúria ligada (Bárbaro)", grupo: "Classe" });
  out.push({ id: "classe:histeria", label: "Histeria ligada (Alice)", grupo: "Classe" });
  return out;
}

/** O bônus extra vale agora? */
export function condicaoBonusExtra(d, cond) {
  const [tipo, id] = String(cond || "sempre").split(":");
  if (tipo === "sempre") return true;
  if (tipo === "estilo") return estilosEscolhidos(d).includes(id);
  if (tipo === "maestria") return nivelArquetipo(d, "combatente") > 0 && d.arquetipoOpcoes?.combatente?.maestria === id;
  if (tipo === "classe" && id === "furia") return idClasse(d.classe) === "barbaro" && !!d.classeEpm?.furiaAtiva;
  if (tipo === "classe" && id === "histeria") return idClasse(d.classe) === "alice" && !!d.classeEpm?.histeria;
  return false;
}

/** Bônus extras criados pela mesa no arquétipo ou na classe (flags.bonusExtras). */
function aplicarBonusExtras(d, out) {
  for (const b of Object.values(d.bonusExtras ?? {})) {
    if (!b || !condicaoBonusExtra(d, b.condicao)) continue;
    const fonte = `${b.nome || "Bônus extra"}${b.origem === "classe" ? " (classe)" : " (arquétipo)"}`;
    if (b.alvo === "rd") { if (n(b.valor)) out.rd.push({ valor: n(b.valor), tipos: String(b.rdTipo ?? "").trim() || "todos os danos", fonte }); continue; }
    if (b.alvo === "danoExtra") { if (String(b.formula ?? "").trim()) out.extrasAtaque.todos.push({ formula: String(b.formula).trim(), fonte }); continue; }
    if (b.alvo && n(b.valor)) out.mods.push({ alvo: b.alvo, valor: n(b.valor), fonte });
  }
}

function aplicarAjustesBonus(d, out) {
  for (const m of out.mods) if (m.origem === "classe") ajustarBonus(d, m, m.alvo);
  for (const r of out.rd) if (r.origem === "classe") ajustarBonus(d, r, `rd.${r.tipos ?? ""}`);
  for (const [k, l] of Object.entries(out.extrasAtaque)) for (const x of l) if (x.origem === "classe") ajustarBonus(d, x, `dano.${k}`, "formula");
  out.mods = out.mods.filter(m => m.origem !== "classe" || n(m.valor));
  out.rd = out.rd.filter(r => r.origem !== "classe" || n(r.valor));
  for (const k of Object.keys(out.extrasAtaque)) out.extrasAtaque[k] = out.extrasAtaque[k].filter(x => x.origem !== "classe" || (x.formula && x.formula !== "0"));
}

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
  if (t.includes("elemental")) return "guerreiroElemental";
  if (t.includes("alice") || t.includes("portadora") || t.includes("pais impossivel")) return "alice";
  if (t.includes("cacador") || t.includes("hunter")) return "cacador";
  if (t.includes("trovador") || t.includes("trovoador") || t.includes("bardo")) return "trovador";
  return "";
}

/**
 * Efeitos que entram antes das condições (imunidades e condições implicadas) e fontes de efeito
 * (Sanidade, idade, pacto quebrado, classe). `opcoes.idade` = regra opcional ligada no Escudo.
 */
export function fontesDaFicha(d, { opcoes = {}, agora = null, statuses = [] } = {}) {
  const regras = opcoes.regras ?? {};
  const out = { imunidades: [], implica: [], fontesEfeito: [], mods: [], rd: [], resistencias: [], vantagensPericia: [], extrasAtaque: { armado: [], desarmado: [], todos: [], corpo: [] }, avisos: [] };

  // Raça pronta (habilidades e únicas escolhidas)
  const raca = efeitosDaRaca(d.racaEscolha, Array.isArray(d.racaAtivas) ? d.racaAtivas : []);
  out.raca = raca;
  out.imunidades.push(...raca.imunidades);
  out.resistencias.push(...raca.resistencias);
  for (const v of raca.vantagemPericias ?? []) out.vantagensPericia.push(v);
  for (const m of raca.mods) out.mods.push(m);
  out.extrasAtaque.desarmado.push(...raca.danoDesarmado);
  (out.extrasAtaque.corpo ??= []).push(...raca.danoCorpo);
  out.vantagemTestes = raca.vantagemTestes;
  out.desvantagemTestes = raca.desvantagemTestes;
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
    // Raça: a escolhida em "Escolher raça" ou, sem ela, a do texto da ficha (Anão, Elfo…). Raça sem tabela de idade: sem efeito.
    const racaTexto = norm(d.raca);
    const racaIdade = d.racaEscolha?.id || [["anao", "ana"], ["elfo", "elf"], ["goblin", "goblin"], ["meio-dragao", "drac"], ["meio-gigante", "gigant"], ["mutante", "mutant"], ["demonio", "demon"], ["humano", "human"]]
      .find(([, t]) => racaTexto.includes(t))?.[0] || "";
    // A pessoa pode escolher a fase de vida (geração) à mão em Sobre; senão, vem da idade e da raça
    const faixa = FAIXAS_IDADE.find(f => f.id === d.faixaIdade) ?? faixaIdade(d.sobre?.idade ?? d.idade, racaIdade);
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

  // Classes completas do Notion (tudo o que entra aqui fica marcado como bônus da classe, ajustável na ficha)
  const marcaClasse = { mods: out.mods.length, rd: out.rd.length, ...Object.fromEntries(Object.entries(out.extrasAtaque).map(([k, l]) => [k, l.length])) };
  const classe = idClasse(d.classe);
  const comb = nivelDe(d, CLASSES_NOTION[classe]?.arquetipo ?? "combatente");
  const opc = d.classeEpm ?? {};
  out.classe = { id: classe, nivel: comb, arquetipo: CLASSES_NOTION[classe]?.arquetipo ?? "combatente" };
  if (classe === "guerreiroElemental" && comb >= 3) {
    const def = CLASSES_NOTION.guerreiroElemental;
    const dado = valorPorNivel(def.armaElemental, comb)?.[1];
    const verm = valorPorNivel(def.nucleoVermelho, comb);
    const liberados = def.elementos.filter(([nv]) => nv <= comb).flatMap(([, l]) => l);
    const elemento = liberados.includes(opc.elemento) ? opc.elemento : liberados[0];
    const tipo = elemento ? `[${elemento}]` : "";
    if (dado) out.extrasAtaque.todos.push({ formula: `${dado}${tipo}`, fonte: "Arma Elemental" });
    if (verm) out.extrasAtaque.todos.push({ formula: `${verm[1]}${tipo}`, fonte: "Núcleo Vermelho" });
    out.classe.elemental = { dado, bonus: verm?.[1] ?? 0, margem: verm?.[2] ?? 0, elemento, liberados };
    if (comb >= 9) for (const alvo of ["acerto", "pericia.fortitude", "pericia.reflexos", "pericia.vontade"]) out.mods.push({ alvo, valor: 5, fonte: "Corpo e Mente Fortificados" });
  }
  if (classe === "alice" && comb >= 3) {
    out.classe.formas = valorPorNivel(CLASSES_NOTION.alice.formas, comb)?.[1] ?? 3;
    if (opc.histeria && comb >= 15) {
      out.mods.push({ alvo: "acerto", valor: 5, fonte: "Histeria" });
      out.extrasAtaque.todos.push({ formula: comb >= 45 ? "4d12" : "2d10", fonte: comb >= 45 ? "Histeria Absoluta (Faca)" : "Histeria (Faca)" });
    }
    out.classe.histeria = comb >= 15 ? { ativa: !!opc.histeria, dano: comb >= 45 ? "4d12" : "2d10" } : null;
  }
  if (classe === "cacador" && comb >= 3) out.classe.pistola = valorPorNivel(CLASSES_NOTION.cacador.pistola, comb)?.[1];
  if (classe === "trovador" && comb >= 3) out.classe.inspiracao = valorPorNivel(CLASSES_NOTION.trovador.inspiracao, comb)?.[1];
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

  for (const m of out.mods.slice(marcaClasse.mods)) m.origem = "classe";
  for (const r of out.rd.slice(marcaClasse.rd)) r.origem = "classe";
  for (const [k, l] of Object.entries(out.extrasAtaque)) for (const x of l.slice(marcaClasse[k] ?? 0)) x.origem = "classe";
  aplicarAjustesBonus(d, out);
  aplicarBonusExtras(d, out);

  // Tamanho (modelo da 0.6.0): CA e Furtividade
  const tam = TAMANHO_EFEITOS[d.tamanho || raca.raca?.tamanho];
  if (tam?.ca) out.mods.push({ alvo: "ca", valor: tam.ca, fonte: "Tamanho" });
  if (tam?.furtividade) out.mods.push({ alvo: "pericia.furtividade", valor: tam.furtividade, fonte: "Tamanho" });
  out.tamanho = tam ?? null;

  // Corrupção acumulada (0–100)
  // O máximo (quanto a pessoa resiste) é ajustável pelo Mestre; os marcos acompanham a proporção (25%, 50%, 75%, 100%)
  const corrMax = Math.max(1, Math.min(1000, Math.floor(n(d.corrupcaoMax)) || 100));
  const corr = Math.max(0, Math.min(corrMax, Math.floor(n(d.corrupcao))));
  const marcos = MARCOS_CORRUPCAO.map(m => { const limite = Math.max(1, Math.round((m.valor / 100) * corrMax)); return { ...m, limite, atingido: corr >= limite }; });
  out.corrupcao = { valor: corr, max: corrMax, pct: Math.round((corr / corrMax) * 100), marcos };
  if (marcos[0].atingido) out.implica.push({ id: "epm-mana-instavel", motivo: `Corrupção ${corr}/${corrMax}` });

  // Treinos concluídos com efeito especial
  const concluidos = Object.values(d.treinamentos ?? {}).filter(t => t?.estado === "concluido");
  const espSet = especiaisConcluidos(d);
  const temEspecial = id => espSet.has(id);
  out.menteBlindada = temEspecial("menteBlindada");
  out.meditacaoNucleo = temEspecial("meditacaoNucleo");
  out.memoriaTreinada = temEspecial("memoriaTreinada");
  out.especiaisTreino = [...espSet];
  out.tecnologia = nivelTecPersonagem(d);
  out.regiaoOrigem = idRegiao(d.regiaoOrigem);

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
  // Feitos (regra opcional 19): o título do feito entra na lista de títulos
  if (regras.feitos) for (const [id, f] of Object.entries(d.feitos ?? {})) if (f?.titulo) titulos.push({ id: `f:${id}`, nome: f.titulo, texto: f.descricao ?? "", requisito: `Feito: ${f.nome ?? ""}`, liberado: true, mods: [], feito: id });
  const ativo = titulos.find(t => t.id === d.tituloAtivo && t.liberado) ?? null;
  out.titulos = { lista: titulos, ativo };
  if (ativo) for (const m of ativo.mods ?? []) out.mods.push({ alvo: m.alvo, valor: m.valor, fonte: `Título: ${ativo.nome}` });

  // Novas mecânicas: traumas (17) e acúmulos de condições (21), só com a regra ligada
  if (regras.traumas) {
    const t = efeitosDosTraumas(d);
    out.fontesEfeito.push(...t.fontes);
    out.mods.push(...t.mods);
  }
  if (regras.acumulos) out.fontesEfeito.push(...dotsDeAcumulos(d, statuses, opcoes.danoAcumulos ?? DANO_ACUMULO_PADRAO, ROTULOS_ACUMULAVEIS));

  // Votos e pactos (contagem)
  out.votos = { usados: Object.values(d.votos ?? {}).filter(v => v && v.tipo !== "passivo").length, limite: limiteVotos(n(d.nivel) + n(d.nivel2)) };
  out.pactos = Object.fromEntries(Object.entries(TIPOS_PACTO).map(([id, t]) => [id, { label: t.label, limite: t.limite, usados: Object.values(d.pactos ?? {}).filter(p => p && p.tipo === id && !p.quebrado).length }]));
  return out;
}

/**
 * Depois dos atributos: bônus de atributos acima de 4 (mods e RD), teto por nível e avisos.
 * `atributos` = { id: { total, base, raca, aumento, outros, mod } }.
 */
export function aposAtributos(d, atributos, { pericias = [] } = {}) {
  const totais = Object.fromEntries(Object.entries(atributos).map(([id, a]) => [id, a.total]));
  const altos = bonusAtributosAltos(totais, trocasAtivas(d));
  const de = bonus => `${({ destreza: "Destreza", forca: "Força", constituicao: "Constituição", carisma: "Carisma", inteligencia: "Inteligência", autocontrole: "Autocontrole", nucleo: "Núcleo", aparencia: "Aparência" })[altos.fontes?.[bonus]] ?? "Atributo"} acima de 4`;
  const mods = [];
  const rd = [];
  if (altos.deslocamento) mods.push({ alvo: "deslocamento", valor: altos.deslocamento, fonte: de("destreza") });
  if (altos.rd) rd.push({ valor: altos.rd, tipos: "todos os danos", fonte: de("constituicao") });
  if (altos.aparenciaCarisma) {
    // Vale para toda perícia que tem Carisma na BASE (lista indicada), mesmo que o jogador troque o atributo somado
    for (const p of pericias) if ((Array.isArray(p.sugestoes) && p.sugestoes.length ? p.sugestoes : p.atributos ?? []).includes("carisma")) mods.push({ alvo: `pericia.${p.id}`, valor: altos.aparenciaCarisma, fonte: "Aparência 6+" });
  }
  const extrasAtaque = { armado: [], desarmado: [] };
  if (altos.danoArmado) extrasAtaque.armado.push({ formula: String(altos.danoArmado), fonte: de("forca") });
  if (altos.danoDesarmado) extrasAtaque.desarmado.push({ formula: altos.danoDesarmado, fonte: de("forca") });

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
  const esp = especiaisConcluidos(d);
  const nuc = Math.floor(n(totais.nucleo));
  // Aura Iniciante: soma o Núcleo em todo ataque corpo a corpo desarmado (vale para armas que contam como desarmadas)
  if (nuc && esp.has("auraIniciante")) extrasAtaque.desarmado.push({ formula: String(Math.floor(nuc * numBonus("treino.auraIniciante"))), fonte: "Aura Iniciante" });
  if (nuc > 0 && (esp.has("auraProtecao") || esp.has("auraProtecaoSuperior"))) {
    const superior = esp.has("auraProtecaoSuperior");
    const naCa = d.auraProtecaoCa === true;
    if (superior || !naCa) rd.push({ valor: Math.floor(numBonus("treino.auraProtecaoRd") * nuc), tipos: "todos os danos", fonte: "Aura de Proteção" });
    if (superior || naCa) mods.push({ alvo: "ca", valor: Math.floor(numBonus("treino.auraProtecaoCa") * nuc), fonte: "Aura de Proteção" });
  }
  const grau = grauNucleo(totais.nucleo);

  // Teto: 8 até o nível 20 de arquétipo, 10 no 21, 12 no 31, 15 no 41 (o maior arquétipo manda)
  const maiorNivel = Math.max(1, ...niveisArquetipos(d).map(x => x.nivel), Math.floor(n(d.nivel) || 1));
  const teto = tetoAtributo(maiorNivel);
  const acima = Object.values(atributos).filter(a => a.base + a.raca + a.aumento + a.outros > teto).map(a => a.label);
  const avisos = acima.length ? [`Acima do teto de ${teto} para o nível ${maiorNivel}: ${acima.join(", ")}.`] : [];
  // Aura de Deslocamento: 9 m com Ação Bônus (+3 m por ponto de Núcleo acima de 3; Superior +9 m)
  const treinosInfo = [];
  if (esp.has("auraDeslocamento") || esp.has("auraDeslocamentoSuperior")) {
    const m = numBonus("treino.auraDeslocBase") + numBonus("treino.auraDeslocPorPonto") * Math.max(0, nuc - 3) + (esp.has("auraDeslocamentoSuperior") ? numBonus("treino.auraDeslocSuperior") : 0);
    treinosInfo.push(`Aura de Deslocamento: move ${m} m com a Ação Bônus.`);
  }
  if (esp.has("fortalecimentoMental")) treinosInfo.push(`Fortalecimento Mental por Aura: +${Math.floor(nuc * numBonus("treino.fortalecimentoMental"))} (Núcleo) nos testes de resistência de Autocontrole.`);
  if (esp.has("magiaPotente")) treinosInfo.push(`Magia Potente: +${Math.floor(n(totais.inteligencia) * numBonus("treino.magiaPotente"))} (Inteligência) no dano e na cura das magias.`);
  if (esp.has("corredor")) treinosInfo.push(`Corredor: +${numBonus("treino.corredor")} m de deslocamento e Disparada como Ação Bônus.`);
  if (esp.has("miraRapida")) treinosInfo.push("Mira Rápida: Mira como Ação Bônus.");
  if (esp.has("sintonizacao")) treinosInfo.push("Sintonização com Arma: marque a arma como \"conta como ataque desarmado\" no editor dela.");
  if (esp.has("versatilidade")) treinosInfo.push("Versatilidade Armada: usa o maior tipo de dano e o maior atributo nas armas.");
  if (esp.has("delinquente")) treinosInfo.push("Delinquente Briguento: primeiro ataque da briga que você começou causa o dobro de dano.");
  if (esp.has("apostador")) treinosInfo.push("Apostador Experiente: vantagem em Intuição ligada a jogos de azar.");
  if (esp.has("estrategista")) treinosInfo.push(`Estrategista: quem segue seu plano tem +${numBonus("treino.estrategista")} nos testes.`);
  if (esp.has("musculosAco")) treinosInfo.push("Músculos de Aço: a CA pode usar Força ou Constituição no lugar da Destreza (Combate → CA).");
  return { altos, mods, rd, extrasAtaque, teto, acima, avisos, grau, treinosInfo, magiaPotente: esp.has("magiaPotente") ? Math.floor(n(totais.inteligencia) * numBonus("treino.magiaPotente")) : 0, fortalecimentoMental: esp.has("fortalecimentoMental") ? Math.floor(nuc * numBonus("treino.fortalecimentoMental")) : 0 };
}

/**
 * Trocas de bônus de atributo acima de 4: A dá o bônus de B e B dá o de A (é troca, nunca repete).
 * Só valem com um voto aprovado pelo Mestre. Devolve { atributo: bônus } e a lista com o estado de cada troca.
 */
export function trocasBonus(d) {
  const lista = [];
  const usados = new Set();
  const mapa = {};
  for (const [id, t] of Object.entries(d.trocasBonus ?? {})) {
    if (!t?.a || !t?.b || t.a === t.b) continue;
    const voto = d.votos?.[t.voto];
    const aprovado = !!voto?.aprovado;
    const conflito = usados.has(t.a) || usados.has(t.b);
    const ativa = aprovado && !conflito;
    if (ativa) { mapa[t.a] = t.b; mapa[t.b] = t.a; usados.add(t.a); usados.add(t.b); }
    lista.push({ id, a: t.a, b: t.b, voto: t.voto ?? "", votoNome: voto?.nome ?? "", aprovado, conflito, ativa });
  }
  return { mapa, lista };
}
const trocasAtivas = d => trocasBonus(d).mapa;

/** Efeito especial de um treino: o gravado nele ou, para treinos antigos, o do catálogo do Notion pelo nome. */
/**
 * Nível de tecnologia que o personagem domina (1 a 3): a região de origem (aba Sobre; sem ela, o campo antigo
 * "tecnologia"), mais as adaptações concluídas. O Mestre pode forçar: adaptacaoTec "0" = sem adaptação, "2"/"3" = adaptado.
 */
export function nivelTecPersonagem(d = {}) {
  const origem = NIVEIS_REGIAO[idRegiao(d.regiaoOrigem)];
  const base = origem ?? Math.max(1, Math.floor(Number(d.tecnologia) || 1));
  const forcado = String(d.adaptacaoTec ?? "");
  if (forcado === "0") return Math.min(3, base);
  if (forcado === "2" || forcado === "3") return Math.min(3, Math.max(base, Number(forcado)));
  const concluidos = Object.values(d.treinamentos ?? {}).filter(t => t?.estado === "concluido");
  let nivel = base + concluidos.filter(t => especialDoTreino(t) === "familiaridade").length;
  const feitos = new Set(concluidos.map(especialDoTreino));
  if (feitos.has("adaptacao2")) nivel = Math.max(nivel, 2);
  if (feitos.has("adaptacao3") && nivel >= 2) nivel = Math.max(nivel, 3);
  return Math.max(1, Math.min(3, nivel));
}

export function especialDoTreino(t) {
  if (t?.especial) return t.especial;
  const nome = norm(t?.nome);
  if (nome.includes("familiaridade tecnologica")) return "familiaridade";
  return TREINAMENTOS_NOTION.find(x => norm(x.nome) === nome)?.especial ?? "";
}
const especiaisConcluidos = d => new Set(Object.values(d.treinamentos ?? {}).filter(t => t?.estado === "concluido").map(especialDoTreino).filter(Boolean));

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
    // Total do atributo, com bônus de nível, habilidade, magia, bênção, item, transformação…
    const atributo = attr === "nenhum" || !a ? 0 : Math.floor(n(a.total ?? (n(a.base) + n(a.raca) + n(a.aumento) + n(a.outros))));
    const extraFixo = r === "pv" ? n(raca?.pv) : r === "pm" ? n(raca?.pm) : 0;
    const extraPorNivel = r === "pv" ? n(raca?.pvPorNivel) : 0;
    out[r] = maximoRecurso(r, {
      raca: n(base[r] ?? cfg.racaBase?.[r]), atributo, niveis,
      rolagens: Object.fromEntries(Object.entries(cfg.rolagens ?? {}).map(([arq, v]) => [arq, v?.[r] ?? []])),
      usarMedia: !["rolagem", "manual"].includes(cfg.modo), modo: cfg.modo, extraFixo, extraPorNivel, ajuste: Math.trunc(n(cfg.ajuste?.[r])),
      tabela: tabelaRecursos(cfg.tabela)
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
