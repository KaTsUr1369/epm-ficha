/** Opções do módulo (Configurações > Configurar opções > Escolhidos pelo Multiverso). */
import { MODULE_ID, PERICIAS_PADRAO } from "./config.mjs";
import { CAMPOS_NUMEROS, aplicarNumeros, padraoNumero } from "./numeros.mjs";
import { registrarOpcionais } from "./opcionais.mjs";

export function registrarAjustes() {
  const reg = (chave, dados) => game.settings.register(MODULE_ID, chave, dados);
  reg("condicoesHud", {
    name: "Condições no HUD do token",
    hint: "Quais condições aparecem ao clicar com o botão direito no token. As especiais do Foundry (morto, invisível…) são mantidas.",
    scope: "world", config: true, type: String, requiresReload: true, default: "substituir",
    choices: { substituir: "Só as condições EPM", adicionar: "EPM junto com as do D&D 5e" }
  });
  reg("condicoesHudTodas", {
    name: "Todas as condições no HUD do token",
    hint: "Desligado: o HUD do token mostra só as 46 condições básicas (Lento, Cego, Caído…). Ligado: mostra as 136. Na ficha todas aparecem sempre.",
    scope: "world", config: true, type: Boolean, requiresReload: true, default: false
  });
  reg("afinidadeSoMestre", {
    name: "Só o Mestre muda a afinidade",
    hint: "Desligado (padrão): jogadores e Mestre mudam a afinidade com qualquer personagem ou NPC (no modo edição). Ligado: só o Mestre muda.",
    scope: "world", config: true, type: Boolean, default: false
  });
  reg("relacaoMutua", {
    name: "Conectar relações nas duas fichas",
    hint: "Ao conectar dois personagens, cria a relação também na ficha do outro (quando quem conecta pode editar as duas).",
    scope: "world", config: true, type: Boolean, default: true
  });
  reg("avisoFichaPadrao", {
    name: "Avisar se a ficha padrão não for a EPM",
    hint: "Ao entrar no mundo, o Mestre recebe um aviso se os personagens estiverem abrindo a ficha do D&D 5e.",
    scope: "world", config: true, type: Boolean, default: true
  });
  reg("modoLimites", {
    name: "Limites de raridade",
    hint: "Épica 4, Lendária 3, Única 2. Separados: habilidades e magias contam cada uma o seu limite. Somados: dividem o mesmo limite.",
    scope: "world", config: true, type: String, default: "separados",
    choices: { separados: "Separados", combinados: "Somados" }
  });
  reg("bloquearLimites", {
    name: "Impedir passar do limite de raridade",
    hint: "Jogadores não conseguem criar ou aprender acima do limite. O Mestre sempre pode, depois de confirmar.",
    scope: "world", config: true, type: Boolean, default: true
  });
  reg("formulaTeste", {
    name: "Dado dos testes",
    hint: "Fórmula base dos testes de atributo, perícia e iniciativa. Com 1dX, vantagem e desvantagem rolam 2dX e ficam com o maior ou o menor.",
    scope: "world", config: true, type: String, default: "1d20"
  });
  reg("marcarAcoes", {
    name: "Marcar ações ao usar poderes",
    hint: "Durante um combate iniciado, usar uma habilidade ou magia marca na ficha a ação que ela gasta.",
    scope: "world", config: true, type: Boolean, default: true
  });
  reg("penalidadeAtaqueExtra", {
    name: "Penalidade do ataque extra",
    hint: "Ataque extra comum (gastando a Ação Bônus ou a de Movimento): quanto sai do acerto desse ataque. O Ataque Extra do Combatente (com PE) não tem penalidade.",
    scope: "world", config: true, type: Number, default: 5, range: { min: 0, max: 20, step: 1 }
  });
  reg("marcadorTurnoEpm", {
    name: "Marcador de turno EPM",
    hint: "Usa o anel roxo do EPM em volta do token de quem está na vez. Só vale se em Combate → Configurar o marcador de turno estiver sem imagem própria.",
    scope: "world", config: true, type: Boolean, default: true, requiresReload: true
  });
  reg("numerosBonus", {
    scope: "world", config: false, type: Object, default: {},
    onChange: v => { aplicarNumeros(v); for (const a of game.actors ?? []) if (a.sheet?.rendered) a.sheet.render(); }
  });
  game.settings.registerMenu(MODULE_ID, "numerosBonusMenu", {
    name: "Bônus de estilos e treinos", label: "Editar números",
    hint: "O Mestre muda os bônus numéricos dos Estilos de Combate e dos treinos automáticos. Campo vazio volta ao padrão.",
    icon: "fa-solid fa-sliders", type: criarEditorNumeros(), restricted: true
  });
  try { aplicarNumeros(game.settings.get(MODULE_ID, "numerosBonus")); } catch (e) { /* ainda sem mundo */ }
  reg("conteudoNotion", {
    name: "Conteúdo extra do Notion", hint: "Ligado no Escudo do Mestre → Ajustes.",
    scope: "world", config: false, type: Object, default: { condicoes: false, danos: false, bencaos: false, idade: false, grauNucleo: false, calculadora: false }
  });
  // 0.6.0: dados do mundo controlados pelo Escudo (lidos por todos; só o Mestre grava, jogadores pedem por socket)
  for (const [chave, padrao] of [["codigos", {}], ["relogios", {}],
    ["compendioMundo", {}], ["conhecimentoCriaturas", {}], ["discord", { url: "", sessao: true, nivel: true, morte: true, bencao: true, relogio: true }]]) {
    reg(chave, { name: chave, scope: "world", config: false, type: typeof padrao === "string" ? String : Object, default: padrao });
  }
  reg("bestiarioAutomatico", {
    name: "Bestiário automático",
    hint: "No fim de cada combate, cada personagem registra no Bestiário as criaturas que enfrentou (pelo nome do token) e conta encontros e derrotas.",
    scope: "world", config: true, type: Boolean, default: true
  });
  reg("paineisRecolhidos", { scope: "client", config: false, type: Array, default: [] });
  reg("escudoNotas", { scope: "world", config: false, type: String, default: "" });
  reg("escudoGrupo", { scope: "world", config: false, type: Object, default: { extras: [], fora: [] } });
  reg("dockConfigurado", { scope: "world", config: false, type: Boolean, default: false });
  reg("migracaoVontade", { scope: "world", config: false, type: Boolean, default: false });
  reg("periciasPadrao", { scope: "world", config: false, type: Array, default: [] });
  // Novas mecânicas: regras opcionais e listas editadas no Escudo do Mestre
  registrarOpcionais(reg);
}

function ler(chave, padrao) {
  try {
    const v = game.settings.get(MODULE_ID, chave);
    return v === undefined || v === null || v === "" ? padrao : v;
  } catch {
    return padrao;
  }
}

/** Conteúdo extra do Notion (não oficial), ligado pelo Mestre no Escudo → Ajustes. Lido por todos os clientes. */
export const CONTEUDO_NOTION_PADRAO = { condicoes: false, danos: false, bencaos: false, idade: false, grauNucleo: false, calculadora: false };

/** Lê uma configuração do mundo da 0.6.0 sem quebrar fora do Foundry (testes). */
export function lerMundo(chave, padrao) {
  try { return game.settings.get("epm-ficha", chave) ?? padrao; } catch { return padrao; }
}
export function conteudoNotion(chave) {
  const v = { ...CONTEUDO_NOTION_PADRAO, ...(ler("conteudoNotion", {}) ?? {}) };
  return chave ? !!v[chave] : v;
}

export function ajustes() {
  return {
    marcadorTurnoEpm: ler("marcadorTurnoEpm", true),
    condicoesHud: ler("condicoesHud", "substituir"),
    modoLimites: ler("modoLimites", "separados"),
    bloquearLimites: ler("bloquearLimites", true),
    formulaTeste: ler("formulaTeste", "1d20"),
    marcarAcoes: ler("marcarAcoes", true),
    condicoesHudTodas: ler("condicoesHudTodas", false),
    afinidadeSoMestre: ler("afinidadeSoMestre", false),
    penalidadeAtaqueExtra: ler("penalidadeAtaqueExtra", 5),
    bestiarioAutomatico: ler("bestiarioAutomatico", true),
    relacaoMutua: ler("relacaoMutua", true),
    avisoFichaPadrao: ler("avisoFichaPadrao", true)
  };
}

/** Lista de perícias padrão do mundo (salva pelo Mestre) ou a lista do config.mjs. */
export function listaPericias() {
  const salva = ler("periciasPadrao", null);
  return Array.isArray(salva) && salva.length ? salva : PERICIAS_PADRAO;
}

/**
 * 0.5.2: na lista de perícias padrão salva pelo Mestre, Vontade troca Núcleo por Autocontrole
 * (só se ainda estiver no padrão antigo). Roda uma vez por mundo.
 */
export async function migrarListaPericiasMundo() {
  if (!game.user?.isGM || ler("migracaoVontade", false)) return;
  const salva = ler("periciasPadrao", null);
  if (Array.isArray(salva) && salva.length) {
    const nova = salva.map(e => {
      if (!Array.isArray(e) || e[0] !== "vontade") return e;
      const soNucleo = v => Array.isArray(v) && v.length === 1 && v[0] === "nucleo";
      const [id, nome, possiveis, somados] = e;
      return [id, nome, soNucleo(possiveis) ? ["autocontrole"] : possiveis, soNucleo(somados) || (somados === undefined && soNucleo(possiveis)) ? ["autocontrole"] : somados];
    });
    if (JSON.stringify(nova) !== JSON.stringify(salva)) await game.settings.set(MODULE_ID, "periciasPadrao", nova);
  }
  await game.settings.set(MODULE_ID, "migracaoVontade", true);
}

/**
 * 0.7.0: Vontade é só Autocontrole. Tira o Núcleo da lista do mundo e migra todas as fichas EPM
 * (personagens e NPCs), mesmo as que ninguém abriu. Roda no Mestre ativo.
 */
export async function migrarVontadeAutocontrole() {
  if (!game.user?.isGM || (game.users?.activeGM && !game.users.activeGM.isSelf)) return;
  const salva = ler("periciasPadrao", null);
  if (Array.isArray(salva) && salva.length) {
    const nova = salva.map(e => (Array.isArray(e) && e[0] === "vontade" ? [e[0], e[1], ["autocontrole"], ["autocontrole"], ...e.slice(4)] : e));
    if (JSON.stringify(nova) !== JSON.stringify(salva)) await game.settings.set(MODULE_ID, "periciasPadrao", nova);
  }
  const { migrarDados, VERSAO_DADOS } = await import("./data.mjs");
  for (const a of game.actors ?? []) {
    const bruto = a.flags?.[MODULE_ID];
    if (!bruto || Number(bruto.versao) >= VERSAO_DADOS) continue;
    const upd = Object.fromEntries(Object.entries(migrarDados(bruto)).map(([k, v]) => [`flags.${MODULE_ID}.${k}`, v]));
    if (Object.keys(upd).length) await a.update(upd).catch(err => console.warn("EPM | migração", a.name, err));
  }
}

/** 0.6.5: a lista de perícias salva pelo Mestre ganha Reflexos (Teste de Resistência). */
export async function migrarReflexosMundo() {
  if (!game.user?.isGM) return;
  const salva = ler("periciasPadrao", null);
  if (Array.isArray(salva) && salva.length && !salva.some(e => Array.isArray(e) && e[0] === "reflexos")) {
    await game.settings.set(MODULE_ID, "periciasPadrao", [...salva, ["reflexos", "Reflexos", ["destreza"]]]);
  }
}

export function salvarListaPericias(lista) {
  return game.settings.set(MODULE_ID, "periciasPadrao", lista);
}

/** Janela do Mestre com os números editáveis. */
const criarEditorNumeros = () => class EditorNumeros extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "epm-numeros-bonus", tag: "form", classes: ["epm-numeros"],
    window: { title: "Bônus de estilos e treinos", icon: "fa-solid fa-sliders", resizable: true },
    position: { width: 520, height: 640 },
    form: { handler: salvarNumeros, closeOnSubmit: true }
  };
  async _renderHTML() {
    const salvos = game.settings.get(MODULE_ID, "numerosBonus") ?? {};
    const esc = foundry.utils.escapeHTML ?? (x => String(x));
    const grupos = CAMPOS_NUMEROS.map(([titulo, campos]) => `<fieldset><legend>${titulo}</legend>${campos.map(([k, rot, tipo]) =>
      `<div class="form-group"><label>${esc(rot)}</label><input type="${tipo === "n" ? "number" : "text"}" ${tipo === "n" ? 'step="any"' : ""} name="${k}" value="${esc(salvos[k] ?? "")}" placeholder="${esc(padraoNumero(k))}"></div>`).join("")}</fieldset>`).join("");
    const div = document.createElement("div");
    div.style.cssText = "overflow-y:auto;padding:0.5rem;height:100%";
    div.innerHTML = `<p class="hint">Deixe em branco para usar o padrão (mostrado em cinza). Dados aceitam fórmulas como 1d8 ou 2d6+1.</p>${grupos}
      <footer class="form-footer"><button type="button" data-action="padrao"><i class="fa-solid fa-rotate-left"></i> Restaurar padrões</button>
      <button type="submit"><i class="fa-solid fa-floppy-disk"></i> Salvar</button></footer>`;
    div.querySelector('[data-action="padrao"]').addEventListener("click", () => div.querySelectorAll("input").forEach(i => { i.value = ""; }));
    return div;
  }
  _replaceHTML(result, content) { content.replaceChildren(result); }
};
async function salvarNumeros(event, form, formData) {
    const dados = {};
    for (const [k, v] of Object.entries(formData.object)) if (v !== "" && v !== null) dados[k] = v;
    await game.settings.set(MODULE_ID, "numerosBonus", dados);
    ui.notifications.info("Bônus de estilos e treinos salvos.");
}
