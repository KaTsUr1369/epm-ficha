import { TREINAMENTOS_NOTION } from "./catalogos.mjs";
import { bonusDaRessonancia } from "./ressonancia.mjs";
import { ARQUETIPOS, estilosEscolhidos, nivelArquetipo, valorPessoal } from "./arquetipos.mjs";
import { NIVEIS_REGIAO, idRegiao } from "./tecnologia.mjs";
import { talentosAtivos, SORTE_POR_DIA } from "./talentos-lista.mjs";
/**
 * Partes da ficha que vieram na 0.6.0 (raça pronta, Sanidade com estados e insanidades, idade opcional,
 * classes do Notion, votos, pactos, talentos, atributos acima de 4, teto de atributo e máximos automáticos).
 * Contas puras, chamadas por calcularFicha (data.mjs). Sem Foundry.
 */
import { num as numBonus } from "./numeros.mjs";
import { estadoAtirador, ID_ATIRADOR } from "./atirador-arcano.mjs";
import { efeitosDaRaca } from "./racas.mjs";
import { estadoSanidade } from "./insanidades.mjs";
import { efeitosDosTraumas, dotsDeAcumulos, DANO_ACUMULO_PADRAO, ROTULOS_ACUMULAVEIS } from "./opcionais.mjs";
import {
  bonusAtributosAltos, tetoAtributo, maximoRecurso, tabelaRecursos, idArquetipo, ATRIBUTO_RECURSO_PADRAO, CLASSES_EPM, valorPorNivel, tipoDoElemento,
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
  const acerto = k => k.startsWith("acerto");
  for (const [k, l] of Object.entries(out.extrasAtaque)) for (const x of l) if (x.origem === "classe") ajustarBonus(d, x, acerto(k) ? `${k}.${x.fonte}` : `dano.${k}`, acerto(k) ? undefined : "formula");
  out.mods = out.mods.filter(m => m.origem !== "classe" || n(m.valor));
  out.rd = out.rd.filter(r => r.origem !== "classe" || n(r.valor));
  for (const k of Object.keys(out.extrasAtaque)) out.extrasAtaque[k] = out.extrasAtaque[k].filter(x => x.origem !== "classe" || (acerto(k) ? n(x.valor) : x.formula && x.formula !== "0"));
}

/** Atirador Arcano da ficha: { nivel } da classe (nível de Conjurador) ou null. */
export function atiradorDaFicha(d = {}) {
  if (idClasse(d?.classe) !== ID_ATIRADOR) return null;
  const nivel = nivelDe(d, "conjurador");
  return nivel >= 3 ? { nivel } : null;
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
  if (t.includes("atirador arcano") || t.includes("arcane gunner")) return "atiradorArcano";
  if (t.includes("cacador") || t.includes("hunter")) return "cacador";
  if (t.includes("trovador") || t.includes("trovoador") || t.includes("bardo")) return "trovador";
  if (t.includes("bastiao") || t.includes("inquebravel")) return "bastiao";
  if (t.includes("vazio")) return "guerreiroVazio";
  if (t.includes("vitalista")) return "vitalista";
  if (t.includes("mecanico")) return "mecanicoGuerra";
  if (t.includes("arqueiro")) return "arqueiro";
  if (t.includes("mago de guerra") || t.includes("magoguerra")) return "magoGuerra";
  if (t.includes("mago")) return "mago";
  if (t.includes("clerigo")) return "clerigo";
  if (t.includes("invocador")) return "invocador";
  if (t.includes("xama")) return "xama";
  if (t.includes("alquimista")) return "alquimista";
  if (t.includes("armadura viva")) return "armaduraViva";
  if (t.includes("curandeiro")) return "curandeiro";
  if (t.includes("puppets") || t.includes("marionet")) return "masterPuppets";
  if (t.includes("guerreiro")) return "guerreiro";
  return "";
}

/**
 * Efeitos que entram antes das condições (imunidades e condições implicadas) e fontes de efeito
 * (Sanidade, idade, pacto quebrado, classe). `opcoes.idade` = regra opcional ligada no Escudo.
 */
export function fontesDaFicha(d, { opcoes = {}, agora = null, statuses = [] } = {}) {
  const regras = opcoes.regras ?? {};
  const out = { imunidades: [], implica: [], fontesEfeito: [], mods: [], rd: [], resistencias: [], vantagensPericia: [], extrasAtaque: { armado: [], desarmado: [], todos: [], corpo: [], distancia: [], acertoCorpo: [], acertoDist: [] }, avisos: [] };

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
  // Ressonância de Alma: bônus permanentes dos Rituais do Vazio
  const resso = bonusDaRessonancia(d);
  out.mods.push(...resso.mods);
  out.vantagensPericia.push(...resso.vantagensPericia);
  out.vantagemTestes = [...(out.vantagemTestes ?? []), ...resso.vantagemTestes];

  // Sanidade: estado e insanidades ativas
  const ps = d.recursos?.ps ?? {};
  // Sanidade máxima 0 = não usa Sanidade (monstros, construtos): sem estado nem penalidade
  const semSanidade = ps.max !== undefined && ps.max !== "" && n(ps.max) <= 0;
  const estado = estadoSanidade(semSanidade ? 100 : n(ps.value) + Math.max(0, n(ps.temp)));
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

  // Treinos que vieram dos antigos Talentos (concluídos): bônus fixos, imunidades e efeitos especiais
  {
    const nivelTotal = Math.max(1, Math.floor(n(d.nivel) || 1)) + (String(d.arquetipo2 ?? "").trim() ? Math.max(0, Math.floor(n(d.nivel2))) : 0);
    const esp = new Set();
    out.afinidades = [];
    out.talentosInfo = [];
    for (const { t, modelo } of talentosAtivos(d)) {
      const fonte = `Treino: ${t.nome || modelo?.nome || "sem nome"}`;
      if (!modelo) continue;
      for (const m of modelo.auto?.mods ?? []) {
        const valor = m.porNivel ? m.porNivel * nivelTotal : n(m.valor);
        if (valor) out.mods.push({ alvo: m.alvo, valor, fonte });
      }
      for (const im of modelo.auto?.imune ?? []) out.imunidades.push({ tipo: im, fonte: modelo.nome });
      if (modelo.auto?.especial) esp.add(modelo.auto.especial);
      if (modelo.auto?.escolha === "elemento" && t.escolha) out.afinidades.push({ tipo: t.escolha, valor: n(modelo.auto.afinidade) || 2, fonte: modelo.nome });
    }
    out.especiaisTalento = [...esp];
    const INFO_TALENTO = {
      ambidestria: "Ambidestria: duas armas de uma mão sem penalidade de mão inábil; consumível como ação bônus ou de movimento." + (especiaisConcluidos(d).has("duasArmas") ? " Com Combate com Duas Armas, o ataque da segunda arma soma o atributo no dano (marque \"Ataque da segunda arma\" no diálogo de ataque)." : ""),
      esquivo: "Esquivo: +2 na Esquiva contra ataques à distância; área com teste para metade: passou, sem dano; falhou, metade.",
      pesLeves: "Pés Leves: terreno difícil não reduz o deslocamento (+1,5 m já somado).",
      sangueMagico: "Sangue Mágico: sem PM suficiente, paga o resto com Vida (2 PV por PM), sem o teste da Sobrecarga.",
      conjuradorCombate: "Conjurador de Combate: sem penalidade com inimigos ao lado; vantagem na Vontade para manter Concentrado.",
      inventorNato: "Inventor Nato: os itens que cria começam com +10 de durabilidade (+2 em Ofício já somado).",
      maosFirmes: "Mãos Firmes: dá uma poção ou consumível a um aliado a até 1,5 m como ação bônus.",
      alquimistaEficiente: "Alquimista Eficiente: a cada 3 consumíveis feitos de uma vez, ganha 1 a mais.",
      presencaMarcante: "Presença Marcante: NPCs novos começam com afinidade +1 (a ficha sugere ao Mestre ao conectar).",
      lendaViva: "Lenda Viva: NPCs que conhecem sua fama começam com afinidade +2; vantagem nos testes sociais com eles.",
      sortudo: `Sortudo: ${Math.max(0, SORTE_POR_DIA - Math.floor(n(d.sorte?.usados)))} de ${SORTE_POR_DIA} pontos de Sorte hoje; botão "Rerrolar" nos seus testes. Voltam no descanso longo.`,
      tatico: "Tático: a iniciativa usa a Inteligência no lugar da Destreza (já entra na ficha).",
      forja: "Forja do Multiverso: na Criação, o limite de raridade sobe uma (cada raridade pede o nível da de baixo).",
      furiaControlada: "Fúria Controlada: a ficha oferece sozinha na primeira vez do combate em metade da Vida ou menos.",
      escolhido: "Escolhido do Multiverso: botão \"Tornar 20 natural\" nos testes (seus e dos aliados), 1× por sessão."
    };
    for (const id of esp) if (INFO_TALENTO[id]) out.talentosInfo.push(INFO_TALENTO[id]);
    for (const a of out.afinidades) out.talentosInfo.push(`Afinidade Elemental: magias de ${a.tipo} causam +${a.valor} de dano (já entra no cartão).`);
  }

  // Classes completas do Notion (tudo o que entra aqui fica marcado como bônus da classe, ajustável na ficha)
  const marcaClasse = { mods: out.mods.length, rd: out.rd.length, ...Object.fromEntries(Object.entries(out.extrasAtaque).map(([k, l]) => [k, l.length])) };
  const classe = idClasse(d.classe);
  const comb = nivelDe(d, CLASSES_EPM[classe]?.arquetipo ?? "combatente");
  const opc = d.classeEpm ?? {};
  out.classe = { id: classe, nivel: comb, arquetipo: CLASSES_EPM[classe]?.arquetipo ?? "combatente" };
  const faixaDe = (tab) => valorPorNivel(tab, comb)?.[1];
  const intMais = (tab) => { const v = valorPorNivel(tab, comb)?.[1]; return v === undefined ? "" : v === "metade" ? "metade da Inteligência (mín. 2)" : v ? `Inteligência + ${v}` : "Inteligência"; };
  if (classe === "guerreiro" && comb >= 3) {
    const def = CLASSES_EPM.guerreiro;
    const max = valorPessoal(d, "cla-guerreiro-posturas", 1 + (comb >= 24 ? 1 : 0) + (comb >= 45 ? 1 : 0));
    const ativas = (opc.posturas ?? []).filter(id => def.posturas[id]).slice(0, Math.max(0, max));
    out.classe.posturas = { max, ativas };
    for (const id of ativas) {
      const p = def.posturas[id]; const fonte = `Postura: ${p.nome}`;
      if (p.dano) out.extrasAtaque[p.quando === "distancia" ? "distancia" : "corpo"].push({ formula: faixaDe(p.dano), fonte });
      if (p.acerto) out.extrasAtaque[p.quando === "distancia" ? "acertoDist" : "acertoCorpo"].push({ valor: faixaDe(p.acerto), fonte });
      if (p.ca) out.mods.push({ alvo: "ca", valor: faixaDe(p.ca), fonte });
      if (p.rd) out.rd.push({ valor: faixaDe(p.rd), tipos: "Contundente, Cortante, Perfurante", fonte });
      if (p.defesa) out.mods.push({ alvo: "defesa.bloqueio", valor: faixaDe(p.defesa), fonte });
    }
  }
  if (classe === "guerreiroElemental" && comb >= 3) {
    const def = CLASSES_EPM.guerreiroElemental;
    const dado = valorPessoal(d, "cla-ge-arma-elemental", faixaDe(def.arma));
    const nucleo = valorPessoal(d, "cla-ge-nucleo-dano", faixaDe(def.nucleoVermelho) ?? 0);
    const margem = valorPessoal(d, "cla-ge-nucleo-margem", faixaDe(def.margem) ?? 0);
    const liberados = def.elementos.filter(([nv]) => nv <= comb).flatMap(([, l]) => l);
    const elemento = liberados.includes(opc.elemento) ? opc.elemento : liberados[0];
    const tipo = elemento ? `[${tipoDoElemento(elemento)}]` : "";
    if (dado) out.extrasAtaque.todos.push({ formula: `${dado}${tipo}`, fonte: "Arma Elemental" });
    // Núcleo Vermelho: fixo em cada acerto, não multiplica no crítico (opção no diálogo de ataque)
    out.classe.elemental = { dado, nucleo, bonus: nucleo, margem, elemento, tipo: elemento ? tipoDoElemento(elemento) : "", liberados };
    out.classe.elemental.efeitoNivel = def.efeitoNivel;
    out.classe.elemental.efeitoDano = valorPessoal(d, "cla-ge-efeito-dano", def.efeitoDano);
    out.classe.elemental.efeitoDt = valorPessoal(d, "cla-ge-efeito-dt", 20);
    if (comb >= 9) { const cmf = valorPessoal(d, "cla-ge-corpo-mente", 5); for (const alvo of ["acerto", "pericia.fortitude", "pericia.reflexos", "pericia.vontade"]) out.mods.push({ alvo, valor: cmf, fonte: "Corpo e Mente Fortificados" }); }
  }
  if (classe === "alice" && comb >= 3) {
    out.classe.formas = valorPessoal(d, "cla-alice-formas", faixaDe(CLASSES_EPM.alice.formas) ?? 3);
    const danoHist = valorPessoal(d, "cla-alice-histeria-dano", comb >= 45 ? "2d10" : "1d10");
    const acertoHist = valorPessoal(d, "cla-alice-histeria-acerto", 5);
    if (opc.histeria && comb >= 15) {
      out.mods.push({ alvo: "acerto", valor: acertoHist, fonte: "Histeria" });
      out.extrasAtaque.todos.push({ formula: danoHist, fonte: comb >= 45 ? "Histeria Absoluta (Faca)" : "Histeria (Faca)" });
    }
    if (comb >= 39) out.extrasAtaque.todos.push({ formula: valorPessoal(d, "cla-alice-pesadelo", "2d10"), fonte: "Arsenal do Pesadelo (Faca, não no Corte Vorpal)" });
    out.classe.histeria = comb >= 15 ? { ativa: !!opc.histeria, dano: danoHist, limiar: `${valorPessoal(d, "cla-alice-limiar", faixaDe(CLASSES_EPM.alice.limiarHisteria) ?? 40)} PV`, acerto: acertoHist } : null;
  }
  if (classe === "cacador" && comb >= 3) {
    out.classe.pistola = valorPessoal(d, "cla-cacador-pistola", faixaDe(CLASSES_EPM.cacador.pistola));
    out.classe.balas = "Inteligência (mín. 3)";
    if (comb >= 12) out.classe.municaoOficina = valorPessoal(d, "cla-cacador-municao", faixaDe(CLASSES_EPM.cacador.municaoOficina) ?? 3);
  }
  if (classe === "trovador" && comb >= 3) {
    out.classe.inspiracao = valorPessoal(d, "cla-trovador-inspiracao", faixaDe(CLASSES_EPM.trovador.inspiracao));
    out.classe.inspiracaoAliados = valorPessoal(d, "cla-trovador-aliados", faixaDe(CLASSES_EPM.trovador.inspiracaoAliados) ?? 1);
    out.classe.inspiracaoCusto = Math.max(0, valorPessoal(d, "cla-trovador-custo", CLASSES_EPM.trovador.inspiracaoCusto));
  }
  if (classe === "bastiao" && comb >= 3) {
    const pv = 20 + (comb >= 12 ? 20 : 0) + (comb >= 33 ? 30 : 0);
    out.mods.push({ alvo: "recurso.pv", valor: valorPessoal(d, "cla-bastiao-pv", pv), fonte: "Defesa Absoluta / Estrutura" });
    const tr = valorPessoal(d, "cla-bastiao-tr", 2);
    for (const alvo of ["pericia.fortitude", "pericia.reflexos", "pericia.vontade"]) out.mods.push({ alvo, valor: tr, fonte: "Defesa Absoluta" });
    const ca = valorPessoal(d, "cla-bastiao-ca", 1 + (comb >= 12 ? 1 : 0) + (comb >= 33 ? 1 : 0));
    if (ca) out.mods.push({ alvo: "ca", valor: ca, fonte: "Defesa Absoluta / Estrutura" });
    if (comb >= 27) out.resistencias.push(...["Contundente", "Cortante", "Perfurante"].map(tipo => ({ tipo, fonte: "Corpo Inquebrável" })));
    const dado = faixaDe(CLASSES_EPM.bastiao.corpoInabalavel);
    out.classe.corpoInabalavel = comb >= 6 ? valorPessoal(d, "cla-bastiao-corpo", dado ? `${dado} + @atr.constituicao` : "") : "";
  }
  if (classe === "masterPuppets" && comb >= 3) {
    const def = CLASSES_EPM.masterPuppets;
    const grau = Math.min(4, Math.floor((Math.max(3, comb) - 1) / 10));
    out.classe.marionetes = { qtd: intMais(def.marionetes), pv: [5, 15, 30, 45, 60][grau], dado: valorPessoal(d, "cla-mop-dado", def.dadoEnxame[grau]), rd: comb >= 33 ? [3, 4, 5, 6, 8][grau] : 0 };
  }
  if (classe === "mecanicoGuerra" && comb >= 3) {
    const grau = Math.min(4, Math.floor((Math.max(3, comb) - 1) / 10));
    const modelo = comb >= 48 ? ["Colosso", "Colossal", "15 m", "todos"] : comb >= 45 ? ["Mk-V", "Colossal", "15 m", 8] : comb >= 33 ? ["Mk-IV", "Enorme", "12 m", 6] : comb >= 24 ? ["Mk-III", "Enorme", "12 m", 5] : comb >= 15 ? ["Mk-II", "Grande", "9 m", 4] : ["Mk-I", "Grande", "9 m", comb >= 9 ? 3 : 2];
    out.classe.mecha = { modelo: modelo[0], tamanho: modelo[1], desl: modelo[2], modulos: modelo[3], pv: valorPessoal(d, "cla-mecanico-pv", 15 * comb), rd: [3, 4, 5, 6, 8][grau], punho: valorPessoal(d, "cla-mecanico-punho", ["1d10", "2d8", "2d10", "3d10", "4d10"][grau]), energia: intMais(CLASSES_EPM.mecanicoGuerra.energia) };
  }
  if (classe === "atiradorArcano" && comb >= 3) {
    // Starlight Step: o Núcleo entra depois, onde a ficha já tem os atributos (contexto e ações)
    const nivelTotal = Math.max(1, Math.floor(n(d.nivel) || 1)) + (String(d.arquetipo2 ?? "").trim() ? Math.max(0, Math.floor(n(d.nivel2))) : 0);
    out.classe.atirador = { ...estadoAtirador(comb, opc, { nucleo: 0, nivelPersonagem: nivelTotal }), nivelPersonagem: nivelTotal };
  }
  if (classe === "vitalista" && comb >= 3) {
    out.classe.toque = valorPessoal(d, "cla-vitalista-toque", faixaDe(CLASSES_EPM.vitalista.toque) ?? "");
    out.classe.protecaoVital = comb >= 6 ? valorPessoal(d, "cla-vitalista-protecao", faixaDe(CLASSES_EPM.vitalista.protecaoVital) ?? "") : "";
  }
  if (classe === "barbaro" && comb >= 3) {
    const f0 = valorPorNivel(CLASSES_EPM.barbaro.furia.tabela, comb);
    const usosPadrao = faixaDe(CLASSES_EPM.barbaro.furia.usos) ?? 2;
    const f = f0 ? { dano: valorPessoal(d, "cla-barbaro-furia-dano", f0[1]), rd: valorPessoal(d, "cla-barbaro-furia-rd", f0[2]), custo: valorPessoal(d, "cla-barbaro-furia-custo", f0[3]) } : null;
    const fisico = comb < 27;
    out.classe.furia = f ? { ...f, fisico, ativa: !!opc.furiaAtiva, usosMax: Math.max(0, valorPessoal(d, "cla-barbaro-furia-usos", usosPadrao)), semLimite: usosPadrao >= 999 } : null;
    if (f && opc.furiaAtiva) {
      out.extrasAtaque.corpo.push({ formula: String(f.dano), fonte: "Fúria (corpo a corpo)" });
      out.rd.push({ valor: f.rd, tipos: fisico ? "Contundente, Cortante, Perfurante" : "todos os danos", fonte: "Fúria" });
    } else if (f && comb >= 36) out.rd.push({ valor: Math.floor(f.rd / 2), tipos: "Contundente, Cortante, Perfurante", fonte: "Pele de Pedra" });
    if (comb >= 18) out.classe.critico = `Crítico Brutal: no crítico corpo a corpo, +${comb >= 30 ? "2 × " : ""}o multiplicador em dados da arma${comb >= 39 ? "; em Fúria, multiplicador +1" : ""}.`;
  }
  if (classe === "guardiao" && comb >= 3) {
    const rd = comb >= 12 ? valorPessoal(d, "cla-guardiao-couraca", faixaDe(CLASSES_EPM.guardiao.couraca) ?? 0) : 0;
    if (rd) out.rd.push({ valor: rd, tipos: "todos os danos", fonte: "Couraça" });
    out.classe.couraca = rd;
    out.classe.muralha = comb >= 6 ? valorPessoal(d, "cla-guardiao-muralha", faixaDe(CLASSES_EPM.guardiao.muralha) ?? 1) : 0;
  }
  if (classe === "lutador" && comb >= 3) {
    const dado = valorPessoal(d, "cla-lutador-desarmado", faixaDe(CLASSES_EPM.lutador.desarmado));
    if (dado) out.extrasAtaque.desarmado.push({ formula: dado, fonte: "Artes Marciais" });
    out.classe.desarmado = dado;
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
  // Imunidades de treinos (Foco Inabalável, Palácio Mental)
  if (temEspecial("focoInabalavel")) out.imunidades.push({ tipo: "Abalado", fonte: "Foco Inabalável" });
  if (temEspecial("palacioMental")) out.imunidades.push({ tipo: "Confuso", fonte: "Palácio Mental" });
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

  // Aura de Proteção (treino): 2 × Núcleo de RD ou Núcleo na CA; a Superior dá os dois
  const esp = especiaisConcluidos(d);
  const nuc = Math.floor(n(totais.nucleo));
  // Aura Iniciante: soma o Núcleo em todo ataque corpo a corpo desarmado (vale para armas que contam como desarmadas)
  if (nuc && esp.has("auraIniciante")) extrasAtaque.desarmado.push({ formula: String(Math.floor(nuc * numBonus("treino.auraIniciante"))), fonte: "Aura Iniciante" });
  if (nuc > 0 && (esp.has("auraProtecao") || esp.has("auraProtecaoSuperior"))) {
    const superior = esp.has("auraProtecaoSuperior");
    const naCa = escolhaTreino(d, "auraProtecao") === "ca";
    if (superior || !naCa) rd.push({ valor: Math.floor(numBonus("treino.auraProtecaoRd") * nuc), tipos: "todos os danos", fonte: "Aura de Proteção" });
    if (superior || naCa) mods.push({ alvo: "ca", valor: Math.floor(numBonus("treino.auraProtecaoCa") * nuc), fonte: "Aura de Proteção" });
  }
  // Pele Calejada (RD 2 físico) e Pele de Pedra (RD físico = Constituição, no lugar da Calejada)
  if (esp.has("peleDePedra")) { const con = Math.floor(n(totais.constituicao)); if (con > 0) rd.push({ valor: con, tipos: "dano físico", fonte: "Pele de Pedra" }); }
  else if (esp.has("peleCalejada")) rd.push({ valor: 2, tipos: "dano físico", fonte: "Pele Calejada" });
  // Reserva de Mana: PM máximo + Núcleo
  if (esp.has("reservaMana") && nuc) mods.push({ alvo: "recurso.pm", valor: nuc, fonte: "Reserva de Mana" });
  // Aura Cortante: o Núcleo da Aura Iniciante vale também com armas corpo a corpo
  if (nuc && esp.has("auraIniciante") && esp.has("auraCortante")) extrasAtaque.armado.push({ formula: String(Math.floor(nuc * numBonus("treino.auraIniciante"))), fonte: "Aura Cortante" });
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
  if (esp.has("sintonizacao")) treinosInfo.push(escolhaTreino(d, "sintonizacao") ? "Sintonização com Arma: a arma escolhida conta como ataque desarmado." : "Sintonização com Arma: escolha a arma no treino (aba Treinos) ou na aba Combate.");
  if (esp.has("versatilidade")) treinosInfo.push("Versatilidade Armada: usa o maior tipo de dano e o maior atributo nas armas.");
  if (esp.has("delinquente")) treinosInfo.push("Delinquente Briguento: primeiro ataque da briga que você começou causa o dobro de dano.");
  if (esp.has("apostador")) treinosInfo.push("Apostador Experiente: vantagem em Intuição ligada a jogos de azar.");
  if (esp.has("estrategista")) treinosInfo.push(`Estrategista: quem segue seu plano tem +${numBonus("treino.estrategista")} nos testes.`);
  if (esp.has("musculosAco")) treinosInfo.push("Músculos de Aço: a CA pode usar Força ou Constituição no lugar da Destreza (Combate → CA).");
  // Catálogo de treinamentos (17/11): o que depende da cena aparece como lembrete
  const con = Math.floor(n(totais.constituicao)), des = Math.floor(n(totais.destreza)), aut = Math.floor(n(totais.autocontrole));
  const INFO = {
    velocista: "Velocista: a Disparada não provoca ataques de oportunidade.",
    saltoAtletico: "Salto Atlético: saltos com o dobro de distância e altura; salta parado como se tivesse corrido.",
    quedaControlada: `Queda Controlada: −${5 * des} no dano de queda (5 × Destreza); não fica Caído em quedas de até 9 m.`,
    escalador: "Escalador: escalada igual ao deslocamento e não fica Desprevenido escalando.",
    nadador: `Nadador: natação igual ao deslocamento; segura o fôlego por ${Math.max(2, con * 2)} minutos.`,
    resistenciaClima: "Resistência ao Clima: vantagem contra o calor e o frio do ambiente.",
    marchaForcada: "Marcha Forçada: viaja até 4 h a mais por dia sem Exaustão.",
    peleCalejada: esp.has("peleDePedra") ? "" : "Pele Calejada: RD 2 contra dano físico.",
    peleDePedra: `Pele de Pedra: RD ${con} (Constituição) contra dano físico.`,
    saqueRapido: "Saque Rápido: 1 vez por turno, saca, guarda ou troca de arma sem gastar ação.",
    armasImprovisadas: "Armas Improvisadas: proficiência; causam 1d6 + atributo.",
    recargaVeloz: "Recarga Veloz: 1 vez por turno, recarrega arma de fogo ou besta sem gastar ação.",
    arremessador: "Arremessador: armas leves corpo a corpo podem ser arremessadas (6/18 m), com Luta ou Pontaria.",
    guardaFirme: "Guarda Firme: +2 no Bloqueio com escudo (já somado); 1 vez por combate o Bloqueio não gasta ação (habilidade).",
    tiroCerteiro: "Tiro Certeiro: sem penalidade de acerto no alcance longo.",
    duasArmas: "Combate com Duas Armas: ataque extra com a arma leve da outra mão como ação bônus, sem atributo no dano.",
    dominioFavorita: "Domínio da Favorita: margem de ameaça da arma favorita −1 (já entra no ataque; a margem não garante o acerto).",
    estudoExotica: "Estudo de Arma Exótica: −2 pontos para liberar a Maestria da arma estudada (já conta).",
    pesAura: "Pés de Aura: corre sobre água e paredes durante a Aura de Deslocamento.",
    ocultarAura: `Ocultar Aura: some para quem sente aura e soma +${nuc} (Núcleo) em Furtividade contra essas criaturas.`,
    auraCortante: "Aura Cortante: o Núcleo da Aura Iniciante vale também com armas corpo a corpo (já entra no dano).",
    auraRecuperacao: `Aura de Recuperação: o descanso curto recupera +${nuc} PV e +${nuc} PE (automático).`,
    ritualista: "Ritualista: fora de combate, lança uma magia como ritual (+10 minutos, metade dos PM).",
    menteConcentrada: "Mente Concentrada: +3 nos testes de Vontade para manter Concentrado.",
    alcanceAmpliado: "Alcance Ampliado: magias com alcance de 9 m ou mais ganham +50% de alcance.",
    reservaMana: `Reserva de Mana: PM máximo +${nuc} (Núcleo, já somado).`,
    canalEstavel: "Canal Estável: o teste de Núcleo da Sobrecarga é feito com vantagem (automático).",
    conjuracaoSutil: "Conjuração Sutil: as magias escolhidas perdem o componente verbal ou o gestual.",
    sonoLeve: "Sono Leve: não fica Surpreendido Dormindo e acorda com qualquer barulho.",
    ator: "Ator: vantagem em disfarce e para se passar por outra pessoa.",
    leituraCorporal: "Leitura Corporal: vantagem em Intuição para perceber mentiras e intenções.",
    negociante: "Negociante: compra 10% mais barato e vende 10% mais caro com NPCs comerciantes.",
    mentor: "Mentor: pode treinar os outros nos treinamentos que já concluiu; quem treina junto ganha +1 PT por dia.",
    protagonista: "Protagonista: começa cada sessão com 1 Inspiração de Tema (o Mestre dá ao marcar o início da sessão).",
    forrageador: `Forrageador: em viagem, comida e água para ${con + 2} pessoas sem teste, fora de terreno hostil.`,
    cozinheiroCampo: "Cozinheiro de Campo: refeição no descanso longo dá 5 PV temporários para até 6 pessoas.",
    reparoCampo: "Reparo de Campo: consertar leva 1 minuto e recupera 75 de durabilidade (automático).",
    rastreador: "Rastreador: vantagem para seguir rastros; descobre número e tipo das criaturas.",
    envenenador: "Envenenador: aplica veneno como ação bônus; seus venenos têm CD +2.",
    armeiro: "Armeiro: suas armas e armaduras perdem 5 de durabilidade (em vez de 10) em críticos e falhas críticas (automático).",
    mestreArtesao: "Mestre Artesão: Criação com 25% menos horas e +2 no teste (automático).",
    menteFria: "Mente Fria: 1 vez por combate, rola de novo uma Vontade que falhou (a ficha pergunta).",
    meditacaoProfunda: `Meditação Profunda: o descanso curto recupera +${aut} PS (automático).`,
    memoriaEidetica: "Memória Eidética: lembra tudo do último mês; vantagem em Investigação para comparar detalhes.",
    menteBlindada: "Mente Blindada: +3 nos testes contra Apavorado, Abalado, Confuso e Dominado.",
    coragemContagiante: "Coragem Contagiante: aliados a até 9 m que te veem ganham +2 contra Apavorado.",
    resistenciaHorror: `Resistência ao Horror: perdas de PS por horrores diminuem ${aut} (mínimo 1).`,
    focoInabalavel: "Foco Inabalável: imune a Abalado.",
    palacioMental: "Palácio Mental: imune a Confuso; vantagem contra leitura de mente e efeitos de memória.",
    passosSilenciosos: "Passos Silenciosos: deslocamento normal sem penalidade em Furtividade.",
    arrombador: "Arrombador: +3 para abrir fechaduras e desarmar armadilhas, na metade do tempo.",
    sombra: "Sombra: pode se esconder como ação bônus."
  };
  for (const [id, txt] of Object.entries(INFO)) if (txt && esp.has(id)) treinosInfo.push(txt);
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

/**
 * Treinos que dão uma coisa OU outra: o personagem escolhe (e pode trocar quando quiser).
 * `superadoPor`: com esse treino concluído os dois valem juntos e a escolha some.
 */
export const ESCOLHAS_TREINO = {
  auraProtecao: { titulo: "Aura de Proteção", opcoes: { rd: "RD (2 × Núcleo)", ca: "CA (+ Núcleo)" }, padrao: "rd", superadoPor: "auraProtecaoSuperior" },
  // As opções são as armas da ficha (a escolhida conta como ataque desarmado sozinha)
  sintonizacao: { titulo: "Sintonização com Arma", opcoes: null, padrao: "" }
};
/** Opção escolhida de um treino com escolha (fichas antigas: auraProtecaoCa). */
export function escolhaTreino(d, especial) {
  const e = ESCOLHAS_TREINO[especial];
  if (!e) return "";
  if (!e.opcoes) return String(d?.escolhasTreino?.[especial] ?? "");
  let v = d?.escolhasTreino?.[especial];
  if (v === undefined && especial === "auraProtecao" && d?.auraProtecaoCa === true) v = "ca";
  return e.opcoes[v] ? v : e.padrao;
}
/** Escolhas que valem agora para a ficha: [{ especial, titulo, opcoes: [{ id, label, ativa }] }]. */
export function escolhasTreinoAtivas(d, armas = []) {
  const esp = especiaisConcluidos(d);
  return Object.entries(ESCOLHAS_TREINO).filter(([id, e]) => esp.has(id) && !(e.superadoPor && esp.has(e.superadoPor)))
    .map(([id, e]) => {
      const opcoes = e.opcoes ?? Object.fromEntries(armas.map(a => [a.id, a.nome]));
      return { especial: id, titulo: e.titulo, vazio: !Object.keys(opcoes).length, opcoes: Object.entries(opcoes).map(([oid, label]) => ({ id: oid, label, ativa: oid === escolhaTreino(d, id) })) };
    });
}
/** A arma está sintonizada (treino concluído e escolhida)? Conta como ataque desarmado. */
export function armaSintonizada(d, itemId) {
  return !!itemId && especiaisConcluidos(d).has("sintonizacao") && escolhaTreino(d, "sintonizacao") === itemId;
}

export function especialDoTreino(t) {
  if (t?.especial) return t.especial;
  if (t?.modelo) { const e = TREINAMENTOS_NOTION.find(x => x.modelo === t.modelo); if (e) return e.especial ?? ""; }
  const nome = norm(t?.nome);
  if (nome.includes("familiaridade tecnologica")) return "familiaridade";
  return TREINAMENTOS_NOTION.find(x => norm(x.nome) === nome)?.especial ?? "";
}
const especiaisConcluidos = d => new Set(Object.values(d?.treinamentos ?? {}).filter(t => t?.estado === "concluido").map(especialDoTreino).filter(Boolean));

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
  // Treinos Escalador e Nadador: escalada e natação iguais ao deslocamento normal
  const espM = especiaisConcluidos(d);
  if (espM.has("escalador") || espM.has("nadador")) raca = { ...(raca ?? {}), ...(espM.has("escalador") ? { escalada: "igual" } : {}), ...(espM.has("nadador") ? { nado: "igual" } : {}) };
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


/**
 * Números da classe que esta ficha pode trocar (lista "Valores da classe nesta ficha"):
 * [{ chave, fonte, rotulo, padrao, formula, atual }]. Só o que a classe já liberou no nível.
 */
export function valoresAjustaveisClasse(d = {}) {
  const classe = idClasse(d.classe);
  const def = CLASSES_EPM[classe];
  if (!def) return [];
  const comb = nivelDe(d, def.arquetipo ?? "combatente");
  const out = [];
  const add = (chave, fonte, rotulo, padrao) => {
    if (padrao === undefined || padrao === null || padrao === "") return;
    out.push({ chave, fonte, rotulo, padrao: String(padrao), formula: typeof padrao !== "number", origem: "classe", atual: d.ajustesBonus?.[chave] ?? "" });
  };
  const nv = (tabela, i = 1) => valorPorNivel(tabela, comb)?.[i];
  if (classe === "guerreiro" && comb >= 3) add("cla-guerreiro-posturas", "Posturas", "Ativas ao mesmo tempo", 1 + (comb >= 24 ? 1 : 0) + (comb >= 45 ? 1 : 0));
  if (classe === "guerreiroElemental" && comb >= 3) {
    add("cla-ge-arma-elemental", "Arma Elemental", "Dado de dano", nv(def.arma));
    add("cla-ge-nucleo-dano", "Núcleo Vermelho", "Dano fixo por acerto", nv(def.nucleoVermelho));
    add("cla-ge-nucleo-margem", "Arma Elemental", "Margem de ameaça", nv(def.margem));
    if (comb >= def.efeitoNivel) { add("cla-ge-efeito-dano", "Efeito do elemento", "Dano mínimo para aplicar", def.efeitoDano); add("cla-ge-efeito-dt", "Efeito do elemento", "DT da Fortitude", 20); }
    if (comb >= 9) add("cla-ge-corpo-mente", "Corpo e Mente Fortificados", "Ataques e testes de resistência", 5);
  }
  if (classe === "alice" && comb >= 3) {
    add("cla-alice-formas", "Formas", "Quantidade", nv(def.formas) ?? 3);
    if (comb >= 15) { add("cla-alice-limiar", "Histeria", "Limiar de PV", nv(def.limiarHisteria)); add("cla-alice-histeria-acerto", "Histeria", "Acerto", 5); add("cla-alice-histeria-dano", "Histeria", "Dano da faca", comb >= 45 ? "2d10" : "1d10"); }
    if (comb >= 39) add("cla-alice-pesadelo", "Arsenal do Pesadelo", "Dano da faca", "2d10");
  }
  if (classe === "cacador" && comb >= 3) { add("cla-cacador-pistola", "Pistola do Caçador", "Dano", nv(def.pistola)); if (comb >= 12) add("cla-cacador-municao", "Munição de Oficina", "Usos por descanso", nv(def.municaoOficina)); }
  if (classe === "trovador" && comb >= 3) {
    add("cla-trovador-inspiracao", "Inspiração", "Dado", nv(def.inspiracao));
    add("cla-trovador-custo", "Inspiração", "Custo (PE)", def.inspiracaoCusto);
    add("cla-trovador-aliados", "Inspiração", "Aliados ao mesmo tempo", nv(def.inspiracaoAliados));
  }
  if (classe === "bastiao" && comb >= 3) {
    add("cla-bastiao-pv", "Defesa Absoluta / Estrutura", "PV máximos", 20 + (comb >= 12 ? 20 : 0) + (comb >= 33 ? 30 : 0));
    add("cla-bastiao-tr", "Defesa Absoluta", "Testes de Resistência", 2);
    add("cla-bastiao-ca", "Defesa Absoluta / Estrutura", "CA", 1 + (comb >= 12 ? 1 : 0) + (comb >= 33 ? 1 : 0));
    if (comb >= 6) add("cla-bastiao-corpo", "Corpo Inabalável", "Redução de dano", `${nv(def.corpoInabalavel)} + @atr.constituicao`);
  }
  if (classe === "masterPuppets" && comb >= 3) add("cla-mop-dado", "Ataque em Enxame", "Dado por Marionete", def.dadoEnxame[Math.min(4, Math.floor((comb - 1) / 10))]);
  if (classe === "mecanicoGuerra" && comb >= 3) {
    add("cla-mecanico-pv", "Mecha", "PV", 15 * comb);
    add("cla-mecanico-punho", "Punho Hidráulico", "Dano", ["1d10", "2d8", "2d10", "3d10", "4d10"][Math.min(4, Math.floor((comb - 1) / 10))]);
  }
  if (classe === "vitalista" && comb >= 3) {
    add("cla-vitalista-toque", "Toque Restaurador", "Cura (+ Núcleo)", nv(def.toque));
    if (comb >= 6) add("cla-vitalista-protecao", "Proteção Vital", "PV temporários (+ Núcleo)", nv(def.protecaoVital));
  }
  if (classe === "barbaro" && comb >= 3) {
    const f = valorPorNivel(def.furia.tabela, comb);
    if (f) { add("cla-barbaro-furia-dano", "Fúria", "Dano por acerto", f[1]); add("cla-barbaro-furia-rd", "Fúria", "RD", f[2]); add("cla-barbaro-furia-custo", "Fúria", "PE por turno", f[3]); }
    const u = nv(def.furia.usos); if (u < 999) add("cla-barbaro-furia-usos", "Fúria", "Usos por descanso", u);
  }
  if (classe === "guardiao") {
    if (comb >= 6) add("cla-guardiao-muralha", "Muralha de Escudo", "CA dos aliados", nv(def.muralha));
    if (comb >= 12) add("cla-guardiao-couraca", "Couraça", "RD", nv(def.couraca));
  }
  if (classe === "lutador" && comb >= 3) add("cla-lutador-desarmado", "Artes Marciais", "Dano desarmado", nv(def.desarmado));
  return out;
}
