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
    hint: "A afinidade revela partes do background dos outros personagens. Ligado: jogadores veem o medidor, mas só o Mestre muda.",
    scope: "world", config: true, type: Boolean, default: true
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
  reg("paineisRecolhidos", { scope: "client", config: false, type: Array, default: [] });
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
    afinidadeSoMestre: ler("afinidadeSoMestre", true),
    relacaoMutua: ler("relacaoMutua", true),
    avisoFichaPadrao: ler("avisoFichaPadrao", true)
  };
}

/** Lista de perícias padrão do mundo (salva pelo Mestre) ou a lista do config.mjs. */
export function listaPericias() {
  const salva = ler("periciasPadrao", null);
  return Array.isArray(salva) && salva.length ? salva : PERICIAS_PADRAO;
}

export function salvarListaPericias(lista) {
  return game.settings.set(MODULE_ID, "periciasPadrao", lista);
}
