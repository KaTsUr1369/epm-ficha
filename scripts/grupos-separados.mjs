/**
 * Grupos separados (0.8.28): o Mestre divide as fichas do grupo em vários grupos (ex.: "Grupo da Torre" e
 * "Expedição do Norte"). O Escudo do Mestre e o Painel do grupo mostram uma aba por grupo; marcar, dar pontos,
 * descanso e pular tempo valem para o grupo aberto. Cada ficha fica em um grupo só (ou em nenhum).
 * Guardado em escudoGrupo.grupos = [{ id, nome, ids: [atores] }].
 */
import { FLAG } from "./config.mjs";
import { escapar, fvtt } from "./helpers.mjs";

const TODOS = "", SEM = "-sem";

export function lerGrupos(cfg = {}) {
  return (Array.isArray(cfg.grupos) ? cfg.grupos : []).filter(g => g?.id).map(g => ({ id: g.id, nome: g.nome || "Grupo", ids: Array.isArray(g.ids) ? g.ids.filter(Boolean) : [] }));
}
/** Em qual grupo está a ficha ("" = nenhum). */
export const grupoDoAtor = (cfg, id) => lerGrupos(cfg).find(g => g.ids.includes(id))?.id ?? "";

/** Só as fichas do grupo aberto ("" = todos; "-sem" = as que não estão em nenhum). */
export function filtrarGrupo(atores, cfg, ativo = TODOS) {
  const grupos = lerGrupos(cfg);
  if (!ativo || !grupos.length) return atores;
  if (ativo === SEM) { const todos = new Set(grupos.flatMap(g => g.ids)); return atores.filter(a => !todos.has(a.id)); }
  const g = grupos.find(x => x.id === ativo);
  return g ? atores.filter(a => g.ids.includes(a.id)) : atores;
}

/** Abas e opções para o template. `atores` = todos do grupo do Escudo (antes do filtro). */
export function contextoGrupos(cfg, ativo, atores) {
  const grupos = lerGrupos(cfg);
  const valido = !ativo || ativo === SEM || grupos.some(g => g.id === ativo) ? ativo : TODOS;
  const abas = [{ id: TODOS, nome: "Todos", qtd: atores.length, ativo: !valido }];
  if (grupos.length) {
    for (const g of grupos) abas.push({ id: g.id, nome: g.nome, qtd: atores.filter(a => g.ids.includes(a.id)).length, ativo: valido === g.id, editavel: true });
    abas.push({ id: SEM, nome: "Sem grupo", qtd: filtrarGrupo(atores, cfg, SEM).length, ativo: valido === SEM });
  }
  return {
    abas, ativo: valido, temGrupos: grupos.length > 0, grupoAberto: grupos.find(g => g.id === valido) ?? null,
    opcoes: [{ id: "", nome: "Sem grupo" }, ...grupos.map(g => ({ id: g.id, nome: g.nome }))]
  };
}

const ler = () => game.settings.get(FLAG, "escudoGrupo") ?? {};
const salvar = cfg => game.settings.set(FLAG, "escudoGrupo", cfg);
const novoIdGrupo = () => `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

async function pedirNome(titulo, atual = "") {
  const r = await fvtt.DialogV2.wait({
    window: { title: titulo }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<label class="epm-campo"><span>Nome do grupo</span><input type="text" name="nome" value="${escapar(atual)}" placeholder="Ex.: Expedição do Norte" autofocus></label>`,
    buttons: [{ action: "ok", label: "Salvar", icon: "fa-solid fa-check", default: true, callback: (ev, b) => String(b.form.elements.nome.value ?? "").trim() }, { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }]
  });
  return typeof r === "string" && r && r !== "cancelar" ? r : null;
}

/** Cria um grupo; se houver fichas marcadas, elas já entram nele. Devolve o id. */
export async function novoGrupo(marcadosIds = []) {
  const nome = await pedirNome("Novo grupo");
  if (!nome) return null;
  const cfg = { ...ler() };
  const grupos = lerGrupos(cfg).map(g => ({ ...g, ids: g.ids.filter(id => !marcadosIds.includes(id)) }));
  const id = novoIdGrupo();
  grupos.push({ id, nome, ids: [...new Set(marcadosIds)] });
  await salvar({ ...cfg, grupos });
  return id;
}

export async function renomearGrupo(id) {
  const cfg = { ...ler() };
  const grupos = lerGrupos(cfg);
  const g = grupos.find(x => x.id === id);
  if (!g) return;
  const nome = await pedirNome("Renomear grupo", g.nome);
  if (!nome) return;
  g.nome = nome;
  return salvar({ ...cfg, grupos });
}

export async function apagarGrupo(id) {
  const cfg = { ...ler() };
  const g = lerGrupos(cfg).find(x => x.id === id);
  if (!g) return;
  const ok = await fvtt.DialogV2.confirm({ window: { title: "Apagar grupo" }, content: `<p>Apagar o grupo <strong>${escapar(g.nome)}</strong>? As fichas continuam no Escudo, só ficam sem grupo.</p>`, rejectClose: false, modal: true });
  if (!ok) return;
  return salvar({ ...cfg, grupos: lerGrupos(cfg).filter(x => x.id !== id) });
}

/** Põe a ficha num grupo (e tira dos outros). grupoId "" = sem grupo. */
export async function moverParaGrupo(atorId, grupoId) {
  const cfg = { ...ler() };
  const grupos = lerGrupos(cfg).map(g => ({ ...g, ids: g.ids.filter(x => x !== atorId) }));
  const alvo = grupos.find(g => g.id === grupoId);
  if (alvo) alvo.ids.push(atorId);
  return salvar({ ...cfg, grupos });
}

/** Liga o seletor de grupo de cada linha (select[data-grupo-de]). */
export function ligarSeletores(raiz, depois) {
  for (const s of raiz?.querySelectorAll?.("select[data-grupo-de]") ?? []) {
    s.addEventListener("change", async () => { await moverParaGrupo(s.dataset.grupoDe, s.value); depois?.(); });
  }
}
