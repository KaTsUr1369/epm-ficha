/**
 * Imagens personalizadas: enviar do computador do jogador ou escolher nos arquivos do Foundry.
 * Enviar exige a permissão "Enviar arquivos" (Configurações > Permissões do usuário).
 */
import { fvtt } from "./helpers.mjs";

export const PASTA_IMAGENS = "epm-ficha-imagens";
const AVISO_PERMISSAO = 'Sem permissão para arquivos. O Mestre libera em Configurações > Configurar permissões: "Usar navegador de arquivos" e "Enviar arquivos".';

function selecionarArquivo(accept) {
  return new Promise(resolve => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null), { once: true });
    input.addEventListener("cancel", () => resolve(null), { once: true });
    input.click();
  });
}

function nomeSeguro(nome) {
  const limpo = String(nome ?? "imagem").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").toLowerCase();
  return `${Date.now().toString(36)}-${limpo}`.slice(0, 90);
}

/** O Mestre cria a pasta de imagens ao entrar no mundo (jogadores podem não ter permissão para criar pastas). */
export async function prepararPastaImagens() {
  if (!game.user.isGM) return;
  try { await fvtt.FilePicker.createDirectory("data", PASTA_IMAGENS, {}); } catch { /* já existe */ }
}

export async function enviarDoComputador() {
  if (!game.user.can("FILES_UPLOAD")) {
    ui.notifications.warn(AVISO_PERMISSAO);
    return null;
  }
  const arquivo = await selecionarArquivo("image/png,image/jpeg,image/webp,image/gif");
  if (!arquivo) return null;
  if (!arquivo.type.startsWith("image/")) {
    ui.notifications.warn("Escolha um arquivo de imagem (PNG, JPEG, WEBP ou GIF).");
    return null;
  }
  const FP = fvtt.FilePicker;
  try { await FP.createDirectory("data", PASTA_IMAGENS, {}); } catch { /* já existe ou sem permissão */ }
  try {
    const resposta = await FP.upload("data", PASTA_IMAGENS, new File([arquivo], nomeSeguro(arquivo.name), { type: arquivo.type }), {}, { notify: false });
    const caminho = resposta?.path;
    if (!caminho) throw new Error(resposta?.message ?? "upload sem caminho");
    ui.notifications.info("Imagem enviada.");
    return caminho;
  } catch (err) {
    console.warn("EPM | Falha ao enviar imagem", err);
    ui.notifications.error(`Não foi possível enviar a imagem. Confira a permissão "Enviar arquivos" e se a pasta ${PASTA_IMAGENS} existe nos dados do Foundry.`);
    return null;
  }
}

function navegarArquivos(atual) {
  return new Promise(resolve => {
    const FP = fvtt.FilePicker;
    new FP({ type: "image", current: atual, callback: caminho => resolve(caminho) }).render(true);
  });
}

/** Pergunta a origem da imagem e devolve o caminho escolhido (ou null). */
export async function escolherImagem({ atual = "", titulo = "Escolher imagem" } = {}) {
  const podeEnviar = game.user.can("FILES_UPLOAD");
  const podeNavegar = game.user.can("FILES_BROWSE");
  if (!podeEnviar && !podeNavegar) {
    ui.notifications.warn(AVISO_PERMISSAO);
    return null;
  }
  const origem = await fvtt.DialogV2.wait({
    window: { title: titulo }, classes: ["epm-dialogo"], rejectClose: false, modal: true,
    content: `<p>De onde vem a imagem?</p>${podeEnviar ? "" : '<p class="epm-dica">Enviar do computador precisa da permissão "Enviar arquivos".</p>'}`,
    buttons: [
      { action: "pc", label: "Do meu computador", icon: "fa-solid fa-upload", default: podeEnviar, callback: () => "pc" },
      { action: "foundry", label: "Dos arquivos do Foundry", icon: "fa-solid fa-folder-open", default: !podeEnviar, callback: () => "foundry" },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (origem === "pc") return enviarDoComputador();
  if (origem === "foundry") {
    if (!podeNavegar) { ui.notifications.warn(AVISO_PERMISSAO); return null; }
    return navegarArquivos(atual);
  }
  return null;
}

export function verImagem(src, titulo = "") {
  if (!src) return;
  try {
    const IP = foundry.applications?.apps?.ImagePopout;
    if (IP) return new IP({ src, window: { title: titulo } }).render(true);
    return new globalThis.ImagePopout(src, { title: titulo }).render(true);
  } catch (err) {
    console.warn("EPM |", err);
    window.open(src, "_blank");
  }
}
