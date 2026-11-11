/** Opções do módulo (Configurações > Configurar opções > Escolhidos pelo Multiverso). */
import { MODULE_ID, PERICIAS_PADRAO } from "./config.mjs";

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
    hint: "Desligado: o HUD do token mostra só as 43 condições básicas (Lento, Cego, Caído…). Ligado: mostra as 131. Na ficha todas aparecem sempre.",
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
}

function ler(chave, padrao) {
  try {
    const v = game.settings.get(MODULE_ID, chave);
    return v === undefined || v === null || v === "" ? padrao : v;
  } catch {
    return padrao;
  }
}

export function ajustes() {
  return {
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

export function salvarListaPericias(lista) {
  return game.settings.set(MODULE_ID, "periciasPadrao", lista);
}
