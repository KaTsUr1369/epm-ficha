/**
 * Contexto das novas mecânicas para os templates (ctx.novas). Puro: lê só os dados do ator,
 * as regras ligadas e as listas do Mestre (fora do Foundry, tudo desligado e com padrões).
 */
import { FLAG, MOEDAS } from "./config.mjs";
import { int, num } from "./data.mjs";
import {
  regrasLigadas, eventosAfinidade, ACUMULAVEIS, ROTULOS_ACUMULAVEIS, MAX_ACUMULOS, acumulosDe,
  MARCOS_MAESTRIA, tabelaTraumas
} from "./opcionais.mjs";
import { INSPIRACAO_MAX } from "./cooperacao.mjs";
import { lerCriacao, TIPOS_CRIACAO, durabilidadeDe, textoPreco, avaliarRequisitos } from "./oficina.mjs";
import { ESTADOS_JURAMENTO, TIPOS_ANCORA, MAX_ANCORAS } from "./vinculos.mjs";
import { lerFasesChefe, ACOES_ESPECIAIS, DADOS_AURA } from "./opcionais-acoes.mjs";

const nomeDe = uuid => { try { return uuid ? (globalThis.fromUuidSync?.(uuid)?.name ?? "") : ""; } catch { return ""; } };

export function contextoNovas({ actor, dados, ficha, itens = [], edicao = false, editavel = false, isGM = false, ui = {} }) {
  const regras = regrasLigadas();
  const n = { regras, isGM, editavel };

  /* 6. Inspiração */
  const insp = Math.max(0, Math.min(INSPIRACAO_MAX, int(dados.inspiracao)));
  n.inspiracao = {
    valor: insp, max: INSPIRACAO_MAX, pontos: Array.from({ length: INSPIRACAO_MAX }, (_, i) => i < insp),
    armada: !!dados.inspiracaoVantagem && insp > 0, podeArmar: editavel && insp > 0, isGM
  };

  /* 21. Acúmulos (só as acumuláveis ativas) */
  const ativas = new Set((ficha?.condicoesAtivas ?? []).filter(c => c.ativa).map(c => c.id));
  n.acumulos = {};
  n.acumulaveis = [];
  if (regras.acumulos) {
    for (const id of ACUMULAVEIS) {
      if (!ativas.has(id)) continue;
      const q = acumulosDe(dados, id);
      n.acumulos[id] = q;
      n.acumulaveis.push({ id, label: ROTULOS_ACUMULAVEIS[id], n: q, podeMais: editavel && q < MAX_ACUMULOS, podeMenos: editavel && q > 1 });
    }
  }

  /* 9. Afinidade: motivo logo depois de mudar e eventos rápidos do Mestre */
  n.motivoPendente = ui.motivoPendente ?? null;
  n.eventos = isGM ? eventosAfinidade().map((e, i) => ({ ...e, i, texto: `${e.nome} ${e.delta > 0 ? "+" : "−"}${Math.abs(e.delta)}`, positivo: e.delta > 0 })) : [];

  /* 10. Juramentos */
  n.juramentos = Object.entries(dados.juramentos ?? {}).filter(([, j]) => j).map(([id, j]) => ({
    id, texto: j.texto ?? "", quemNome: j.quemNome || nomeDe(j.quem), comNome: j.comNome || nomeDe(j.com), data: j.data ?? "",
    estado: ESTADOS_JURAMENTO[j.estado] ? j.estado : "ativo", estadoLabel: ESTADOS_JURAMENTO[j.estado] ?? "Ativo",
    ativo: (j.estado ?? "ativo") === "ativo", podeCumprir: editavel && (j.estado ?? "ativo") === "ativo", podeQuebrar: isGM && (j.estado ?? "ativo") === "ativo",
    quando: num(j.quando)
  })).sort((a, b) => a.quando - b.quando);

  /* 16. Âncoras */
  if (regras.ancoras) {
    const lista = Object.entries(dados.ancoras ?? {}).filter(([, a]) => a).map(([id, a]) => ({
      id, tipo: a.tipo, tipoLabel: TIPOS_ANCORA[a.tipo] ?? "Âncora", nome: a.nome || "Âncora", usada: !!a.usada, criado: num(a.criado)
    })).sort((a, b) => a.criado - b.criado);
    n.ancoras = { lista, max: MAX_ANCORAS, podeNova: editavel && lista.length < MAX_ANCORAS, vazio: !lista.length };
  }

  /* 17. Traumas */
  if (regras.traumas) {
    n.traumas = Object.entries(dados.traumas ?? {}).filter(([, t]) => t).map(([id, t]) => ({
      id, nome: t.nome || "Trauma", texto: t.texto ?? "", tipo: t.tipo ?? "", fobia: t.tipo === "fobia", gatilho: t.gatilho ?? "", gatilhoPresente: !!t.gatilhoPresente, criado: num(t.criado)
    })).sort((a, b) => a.criado - b.criado);
    n.tabelaTraumas = isGM ? tabelaTraumas() : [];
  }

  /* 18. Maestria */
  if (regras.maestria) {
    n.maestria = Object.entries(dados.maestria ?? {}).filter(([, m]) => m).map(([chave, m]) => {
      const acertos = Math.max(0, int(m.acertos));
      const prox = Object.entries(MARCOS_MAESTRIA).map(([k, v]) => ({ k, v })).find(x => acertos < x.v) ?? null;
      const tec = m.tecnica ? itens.find(i => i.id === m.tecnica) : null;
      return {
        chave, nome: m.nome || chave, acertos, acerto: acertos >= MARCOS_MAESTRIA.acerto, tecnicaLiberada: acertos >= MARCOS_MAESTRIA.tecnica, dano: acertos >= MARCOS_MAESTRIA.dano,
        proximo: prox ? { valor: prox.v, falta: prox.v - acertos, texto: { acerto: "+1 de acerto", tecnica: "técnica própria", dano: "+1 nível de dano" }[prox.k] } : null,
        pct: Math.min(100, Math.round((acertos / MARCOS_MAESTRIA.dano) * 100)),
        tecnica: tec ? { id: tec.id, nome: tec.name, pendente: tec.flags?.[FLAG]?.aprovacao === "pendente" } : null,
        podeTecnica: editavel && acertos >= MARCOS_MAESTRIA.tecnica && !tec
      };
    }).sort((a, b) => b.acertos - a.acertos);
    n.marcosMaestria = MARCOS_MAESTRIA;
  }

  /* 19. Feitos */
  if (regras.feitos) {
    n.feitos = Object.entries(dados.feitos ?? {}).filter(([, f]) => f).map(([id, f]) => ({
      id, nome: f.nome ?? "Feito", descricao: f.descricao ?? "", pev: int(f.pev), titulo: f.titulo ?? "", data: f.data ?? "", quando: num(f.quando)
    })).sort((a, b) => b.quando - a.quando);
  }

  /* 14 e 15. Chefe e Aura de Horror (ficha de NPC, só o Mestre) */
  const eNpc = actor?.type === "npc" || actor?.hasPlayerOwner === false;
  n.npc = isGM && eNpc;
  if (n.npc && regras.chefes) {
    const c = dados.chefe ?? {};
    n.chefe = {
      ativo: !!c.ativo, fases: lerFasesChefe(c).map((f, i) => ({ ...f, n: i + 2, usada: (c.usadas ?? []).includes(f.id) })),
      acoes: Object.entries(ACOES_ESPECIAIS).map(([id, label]) => ({ id, label }))
    };
  }
  if (n.npc && regras.auraHorror) {
    const a = dados.aura ?? {};
    n.aura = {
      dado: DADOS_AURA.includes(a.dado) ? a.dado : "", dt: int(a.dt, 15), dados: DADOS_AURA,
      vistos: (Array.isArray(a.vistos) ? a.vistos : []).map(nomeDe).filter(Boolean)
    };
  }

  /* 7. Criação e 5. treinos */
  const aba = ui.abas?.treinos ?? "treinos";
  n.treinoAba = { treinos: aba === "treinos" ? "active" : "", criacao: aba === "criacao" ? "active" : "" };
  const pericias = (ficha?.pericias ?? []).map(p => ({ id: p.id, nome: p.nome }));
  n.criacoes = Object.entries(dados.criacoes ?? {}).filter(([, c]) => c).map(([id, c]) => {
    const cr = lerCriacao(id, c);
    const materiais = cr.materiais.map(m => {
      const it = itens.find(i => i.id === m.itemId);
      const tem = it ? int(it.system?.quantity, 1) : 0;
      return { ...m, tem, falta: Math.max(0, m.qtd - tem), sumiu: !it };
    });
    const rq = cr.requisitos ? avaliarRequisitos(cr.requisitos, ficha, dados) : null;
    return {
      ...cr, requisitosFaltam: rq?.faltas ?? [], materiais, faltam: materiais.some(m => m.falta > 0), restante: Math.round((cr.horas - cr.feitas) * 10) / 10,
      tipos: Object.entries(TIPOS_CRIACAO).map(([tid, label]) => ({ id: tid, label, selected: tid === cr.tipo })),
      pericias: pericias.map(p => ({ ...p, selected: p.id === cr.pericia })), periciaNome: pericias.find(p => p.id === cr.pericia)?.nome ?? "",
      andamento: cr.estado === "andamento", pronto: cr.estado === "pronto", concluido: cr.estado === "concluido"
    };
  }).sort((a, b) => (a.concluido - b.concluido) || a.criado - b.criado);
  n.requisitos = Object.fromEntries(Object.entries(dados.treinamentos ?? {}).filter(([, t]) => t?.requisitos && t.estado !== "concluido")
    .map(([id, t]) => [id, avaliarRequisitos(t.requisitos, ficha, dados, id)]));
  n.precos = Object.fromEntries(Object.entries(dados.treinamentos ?? {}).filter(([, t]) => t).map(([id, t]) => [id, {
    texto: textoPreco(t), valor: num(t.precoHora), moedas: MOEDAS.filter(m => m.id !== "dr").map(m => ({ id: m.id, label: m.abrev, selected: m.id === (t.precoMoeda || "po") }))
  }]));

  /* 8. Durabilidade (linha do item) */
  n.durabilidade = {};
  for (const it of itens) {
    const d = durabilidadeDe(it);
    if (d === null) continue;
    n.durabilidade[it.id] = { valor: d, quebrado: d === 0, gasto: d < 100, cor: d === 0 ? "#D2544A" : d <= 30 ? "#E0A33A" : "#7FB07A" };
  }
  n.temFerramenta = itens.some(i => i.type === "tool" && durabilidadeDe(i) !== 0);
  return n;
}
