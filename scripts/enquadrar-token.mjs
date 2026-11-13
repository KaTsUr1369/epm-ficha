/**
 * Enquadrar a imagem do token na borda do EPM (anel de runas com chamas).
 * O jogador arrasta e dá zoom na imagem; ela fica só dentro do círculo antes das runas e a borda vai por cima.
 * Tudo que fica fora da borda (e das chamas) sai transparente. O PNG vai para a pasta "Tokens" dos dados do Foundry.
 */
import { fvtt, escapar } from "./helpers.mjs";

export const PASTA_TOKENS = "Tokens";
export const BORDA_TOKEN = "modules/epm-ficha/assets/token-borda.png";
/** Círculo de dentro da borda (antes das runas), em fração do tamanho da imagem da borda (medido no PNG de 256 px). */
export const CIRCULO_BORDA = { cx: 0.5035, cy: 0.4993, r: 0.305 };
const TAMANHO_FINAL = 512;
const TAMANHO_PREVIA = 300;

function carregar(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Não carregou ${src}`));
    img.src = src;
  });
}

/**
 * Desenha o token num canvas de lado `lado`. `vista` = { zoom, dx, dy } em frações do lado (dx/dy deslocam o centro
 * da imagem a partir do centro do círculo).
 */
export function desenharToken(ctx, lado, img, borda, vista, { comBorda = true } = {}) {
  ctx.clearRect(0, 0, lado, lado);
  const c = comBorda ? CIRCULO_BORDA : { cx: 0.5, cy: 0.5, r: 0.5 };
  const cx = c.cx * lado, cy = c.cy * lado, r = c.r * lado;
  // tamanho base: a imagem cobre o círculo (lado menor = diâmetro), depois o zoom
  const base = (2 * r) / Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const s = base * vista.zoom;
  const w = (img.naturalWidth || img.width) * s, h = (img.naturalHeight || img.height) * s;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, cx - w / 2 + vista.dx * lado, cy - h / 2 + vista.dy * lado, w, h);
  ctx.restore();
  if (comBorda && borda) ctx.drawImage(borda, 0, 0, lado, lado);
}

/** Pede a criação da pasta Tokens (o Mestre cria ao entrar; jogadores podem não ter permissão). */
export async function prepararPastaTokens() {
  if (!game.user?.isGM) return;
  try { await fvtt.FilePicker.createDirectory("data", PASTA_TOKENS, {}); } catch { /* já existe */ }
}

function nomeArquivo(nome) {
  const limpo = String(nome || "token").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase() || "token";
  return `${limpo}-${Date.now().toString(36)}.png`;
}

/**
 * Abre o enquadramento para a imagem `src`. Devolve o caminho do PNG salvo em Tokens/ (ou null se cancelar).
 * Sem permissão de enviar arquivos, devolve a imagem original.
 */
export async function enquadrarToken(src, { nome = "token", titulo = "Enquadrar o token" } = {}) {
  if (!src) return null;
  let img, borda;
  try { [img, borda] = await Promise.all([carregar(src), carregar(BORDA_TOKEN)]); } catch (err) {
    console.warn("EPM |", err);
    ui.notifications.warn("Não deu para abrir a imagem para enquadrar. Ficou a imagem original.");
    return src;
  }
  const vista = { zoom: 1, dx: 0, dy: 0 };
  let comBorda = true;
  let canvas = null;
  const redesenhar = () => { if (canvas) desenharToken(canvas.getContext("2d"), TAMANHO_PREVIA, img, borda, vista, { comBorda }); };

  const r = await fvtt.DialogV2.wait({
    window: { title: titulo, icon: "fa-solid fa-crop-simple" }, classes: ["epm-dialogo", "epm-enquadrar"], rejectClose: false, modal: true,
    position: { width: 380 },
    content: `<div class="epm-enquadrar-corpo">
      <canvas width="${TAMANHO_PREVIA}" height="${TAMANHO_PREVIA}" data-previa title="Arraste para mover; roda do mouse para zoom" aria-label="Prévia do token"></canvas>
      <label class="epm-campo"><span>Zoom</span><input type="range" min="0.5" max="4" step="0.01" value="1" data-zoom></label>
      <div class="epm-enquadrar-linha">
        <label class="epm-check"><input type="checkbox" data-borda checked> Com a borda do EPM</label>
        <button type="button" class="epm-link" data-centralizar>Centralizar</button>
      </div>
      <p class="epm-dica">Arraste a imagem e use a roda do mouse (ou o zoom) até o rosto ficar dentro do círculo. O que fica fora da borda some. O PNG vai para a pasta <strong>${escapar(PASTA_TOKENS)}</strong> do Foundry.</p>
    </div>`,
    buttons: [
      { action: "ok", label: "Usar no token", icon: "fa-solid fa-check", default: true, callback: () => "ok" },
      { action: "original", label: "Sem enquadrar", icon: "fa-solid fa-image", callback: () => "original" },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ],
    render: (ev, dlg) => {
      const raiz = dlg?.element ?? ev?.target?.element ?? ev?.target;
      const el = raiz?.querySelector ? raiz : document;
      canvas = el.querySelector("[data-previa]");
      const zoom = el.querySelector("[data-zoom]");
      if (!canvas) return;
      let arrasto = null;
      canvas.addEventListener("pointerdown", e => { arrasto = { x: e.clientX, y: e.clientY, dx: vista.dx, dy: vista.dy }; canvas.setPointerCapture?.(e.pointerId); });
      canvas.addEventListener("pointermove", e => {
        if (!arrasto) return;
        vista.dx = arrasto.dx + (e.clientX - arrasto.x) / TAMANHO_PREVIA;
        vista.dy = arrasto.dy + (e.clientY - arrasto.y) / TAMANHO_PREVIA;
        redesenhar();
      });
      const soltar = () => { arrasto = null; };
      canvas.addEventListener("pointerup", soltar);
      canvas.addEventListener("pointercancel", soltar);
      canvas.addEventListener("wheel", e => {
        e.preventDefault();
        vista.zoom = Math.min(4, Math.max(0.5, vista.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
        if (zoom) zoom.value = String(vista.zoom);
        redesenhar();
      }, { passive: false });
      zoom?.addEventListener("input", () => { vista.zoom = Number(zoom.value) || 1; redesenhar(); });
      el.querySelector("[data-borda]")?.addEventListener("change", e => { comBorda = e.target.checked; redesenhar(); });
      el.querySelector("[data-centralizar]")?.addEventListener("click", () => { Object.assign(vista, { zoom: 1, dx: 0, dy: 0 }); if (zoom) zoom.value = "1"; redesenhar(); });
      redesenhar();
    }
  });
  if (r === "original") return src;
  if (r !== "ok") return null;

  const final = document.createElement("canvas");
  final.width = final.height = TAMANHO_FINAL;
  desenharToken(final.getContext("2d"), TAMANHO_FINAL, img, borda, vista, { comBorda });
  let blob;
  try { blob = await new Promise((res, rej) => final.toBlob(b => (b ? res(b) : rej(new Error("toBlob vazio"))), "image/png")); } catch (err) {
    console.warn("EPM |", err);
    ui.notifications.warn("Não deu para gerar o PNG (a imagem pode vir de outro site). Ficou a imagem original.");
    return src;
  }
  if (!game.user.can("FILES_UPLOAD")) {
    ui.notifications.warn('Para salvar o token enquadrado é preciso a permissão "Enviar arquivos" (o Mestre libera). Ficou a imagem original.');
    return src;
  }
  const FP = fvtt.FilePicker;
  try { await FP.createDirectory("data", PASTA_TOKENS, {}); } catch { /* já existe ou sem permissão */ }
  try {
    const resposta = await FP.upload("data", PASTA_TOKENS, new File([blob], nomeArquivo(nome), { type: "image/png" }), {}, { notify: false });
    if (!resposta?.path) throw new Error(resposta?.message ?? "upload sem caminho");
    ui.notifications.info(`Token salvo em ${PASTA_TOKENS}/.`);
    return resposta.path;
  } catch (err) {
    console.warn("EPM | Falha ao salvar o token", err);
    ui.notifications.error(`Não deu para salvar o token na pasta ${PASTA_TOKENS}. Confira a permissão "Enviar arquivos".`);
    return src;
  }
}
