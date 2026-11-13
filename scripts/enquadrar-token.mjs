/**
 * Enquadrar a imagem do token na borda do EPM (anel de runas com chamas), como num editor de foto de celular:
 * um quadrado sobre a imagem, que aumenta ou diminui arrastando as laterais e os cantos e anda segurando o meio.
 * O que fica dentro do quadrado vai para o círculo de dentro da borda (antes das runas); o resto some (PNG transparente).
 * A cor da borda pode ser trocada. O PNG vai para a pasta "Tokens" dos dados do Foundry.
 */
import { fvtt, escapar } from "./helpers.mjs";

export const PASTA_TOKENS = "Tokens";
export const BORDA_TOKEN = "modules/epm-ficha/assets/token-borda.png";
/** Círculo de dentro da borda (antes das runas), em fração do tamanho da imagem da borda (medido no PNG de 256 px). */
export const CIRCULO_BORDA = { cx: 0.5035, cy: 0.4993, r: 0.305 };
const TAMANHO_FINAL = 512;
const PALCO = 340;
const PREVIA = 150;
const MIN_LADO = 24;
const CHAVE_COR = "epm-cor-borda-token";

function carregar(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Não carregou ${src}`));
    img.src = src;
  });
}

/** Borda pintada com a cor escolhida (mantém o claro e o escuro de cada parte; preto continua preto). */
export function bordaColorida(borda, cor) {
  if (!cor) return borda;
  const c = document.createElement("canvas");
  c.width = borda.naturalWidth || borda.width;
  c.height = borda.naturalHeight || borda.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(borda, 0, 0);
  ctx.globalCompositeOperation = "color";
  ctx.fillStyle = cor;
  ctx.fillRect(0, 0, c.width, c.height);
  // um pouco mais de cor nas partes claras (runas e brilho)
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = cor;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(borda, 0, 0);
  return c;
}

/**
 * Desenha o token num canvas de lado `lado`. `recorte` = { x, y, lado } em pixels da imagem original:
 * esse quadrado ocupa o círculo de dentro da borda.
 */
export function desenharToken(ctx, lado, img, borda, recorte, { comBorda = true } = {}) {
  ctx.clearRect(0, 0, lado, lado);
  const c = comBorda ? CIRCULO_BORDA : { cx: 0.5, cy: 0.5, r: 0.5 };
  const cx = c.cx * lado, cy = c.cy * lado, r = c.r * lado;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, recorte.x, recorte.y, recorte.lado, recorte.lado, cx - r, cy - r, 2 * r, 2 * r);
  ctx.restore();
  if (comBorda && borda) ctx.drawImage(borda, 0, 0, lado, lado);
}

/** Ajusta o quadrado para caber na imagem (pura, para teste). */
export function limitarRecorte(q, largura, altura) {
  const ladoMax = Math.min(largura, altura);
  const lado = Math.max(Math.min(MIN_LADO, ladoMax), Math.min(ladoMax, q.lado));
  return { lado, x: Math.min(Math.max(0, q.x), largura - lado), y: Math.min(Math.max(0, q.y), altura - lado) };
}

/**
 * Arrasto de uma alça do quadrado. `alca` = "meio" ou combinação de n/s/l/o (norte, sul, leste, oeste);
 * `dx`, `dy` em pixels da imagem. O lado oposto fica parado e o quadrado continua quadrado (pura, para teste).
 */
export function arrastarRecorte(inicio, alca, dx, dy, largura, altura) {
  if (alca === "meio") return limitarRecorte({ ...inicio, x: inicio.x + dx, y: inicio.y + dy }, largura, altura);
  const leste = alca.includes("l"), oeste = alca.includes("o"), norte = alca.includes("n"), sul = alca.includes("s");
  const dh = leste ? dx : oeste ? -dx : 0;
  const dv = sul ? dy : norte ? -dy : 0;
  const delta = (leste || oeste) && (norte || sul) ? (Math.abs(dh) > Math.abs(dv) ? dh : dv) : (dh || dv);
  const ladoMax = Math.min(largura, altura);
  // fixa o ponto oposto (canto ou meio do lado oposto)
  const fixoX = leste ? inicio.x : oeste ? inicio.x + inicio.lado : inicio.x + inicio.lado / 2;
  const fixoY = sul ? inicio.y : norte ? inicio.y + inicio.lado : inicio.y + inicio.lado / 2;
  let lado = Math.max(MIN_LADO, Math.min(ladoMax, inicio.lado + delta));
  // não deixa passar da borda da imagem pelo lado que cresce
  if (leste) lado = Math.min(lado, largura - fixoX);
  if (oeste) lado = Math.min(lado, fixoX);
  if (sul) lado = Math.min(lado, altura - fixoY);
  if (norte) lado = Math.min(lado, fixoY);
  if (!leste && !oeste) lado = Math.min(lado, 2 * Math.min(fixoX, largura - fixoX));
  if (!norte && !sul) lado = Math.min(lado, 2 * Math.min(fixoY, altura - fixoY));
  const x = leste ? fixoX : oeste ? fixoX - lado : fixoX - lado / 2;
  const y = sul ? fixoY : norte ? fixoY - lado : fixoY - lado / 2;
  return limitarRecorte({ x, y, lado }, largura, altura);
}

/** O Mestre cria a pasta Tokens ao entrar (jogadores podem não ter permissão para criar pastas). */
export async function prepararPastaTokens() {
  if (!game.user?.isGM) return;
  try { await fvtt.FilePicker.createDirectory("data", PASTA_TOKENS, {}); } catch { /* já existe */ }
}

function nomeArquivo(nome) {
  const limpo = String(nome || "token").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase() || "token";
  return `${limpo}-${Date.now().toString(36)}.png`;
}

function corSalva() {
  try { return localStorage.getItem(CHAVE_COR) || ""; } catch { return ""; }
}
function salvarCor(cor) {
  try { if (cor) localStorage.setItem(CHAVE_COR, cor); else localStorage.removeItem(CHAVE_COR); } catch { /* sem armazenamento */ }
}

const ALCAS = ["n", "s", "l", "o", "nl", "no", "sl", "so"];

/**
 * Abre o enquadramento para a imagem `src`. Devolve o caminho do PNG salvo em Tokens/ (ou null se cancelar).
 * "Sem enquadrar" (ou sem permissão de enviar arquivos) devolve a imagem original.
 */
export async function enquadrarToken(src, { nome = "token", titulo = "Enquadrar o token" } = {}) {
  if (!src) return null;
  let img, borda;
  try { [img, borda] = await Promise.all([carregar(src), carregar(BORDA_TOKEN)]); } catch (err) {
    console.warn("EPM |", err);
    ui.notifications.warn("Não deu para abrir a imagem para enquadrar. Ficou a imagem original.");
    return src;
  }
  const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
  const escala = Math.min(PALCO / W, PALCO / H);
  const vw = Math.round(W * escala), vh = Math.round(H * escala);
  const ladoInicial = Math.min(W, H) * 0.9;
  let recorte = limitarRecorte({ x: (W - ladoInicial) / 2, y: (H - ladoInicial) / 2, lado: ladoInicial }, W, H);
  let comBorda = true;
  let cor = corSalva();
  let bordaPintada = bordaColorida(borda, cor);
  let previa = null, caixa = null;

  const atualizar = () => {
    if (caixa) Object.assign(caixa.style, { left: `${recorte.x * escala}px`, top: `${recorte.y * escala}px`, width: `${recorte.lado * escala}px`, height: `${recorte.lado * escala}px` });
    if (previa) desenharToken(previa.getContext("2d"), PREVIA, img, bordaPintada, recorte, { comBorda });
  };

  const r = await fvtt.DialogV2.wait({
    window: { title: titulo, icon: "fa-solid fa-crop-simple" }, classes: ["epm-dialogo", "epm-enquadrar"], rejectClose: false, modal: true,
    position: { width: 560 },
    content: `<div class="epm-enquadrar-corpo">
      <div class="epm-recorte-palco" style="width:${vw}px;height:${vh}px">
        <img src="${escapar(src)}" alt="" draggable="false">
        <div class="epm-recorte-caixa" data-alca="meio" title="Segure no meio para arrastar; puxe as laterais ou os cantos para mudar o tamanho">
          ${ALCAS.map(a => `<span class="epm-recorte-alca alca-${a}" data-alca="${a}"></span>`).join("")}
          <span class="epm-recorte-circulo"></span>
        </div>
      </div>
      <div class="epm-enquadrar-lado">
        <canvas width="${PREVIA}" height="${PREVIA}" data-previa aria-label="Prévia do token"></canvas>
        <label class="epm-campo"><span>Cor da borda</span><input type="color" data-cor value="${escapar(cor || "#3a5ca8")}"></label>
        <label class="epm-check"><input type="checkbox" data-cor-original ${cor ? "" : "checked"}> Cor original</label>
        <label class="epm-check"><input type="checkbox" data-borda checked> Com a borda</label>
        <button type="button" class="epm-link" data-tudo>Pegar a imagem toda</button>
      </div>
      <p class="epm-dica">O que fica dentro do quadrado vai para o círculo do token (o círculo tracejado mostra o que aparece). Segure no meio para arrastar e puxe as laterais ou os cantos para aumentar ou diminuir. O PNG vai para a pasta <strong>${escapar(PASTA_TOKENS)}</strong>.</p>
    </div>`,
    buttons: [
      { action: "ok", label: "Usar no token", icon: "fa-solid fa-check", default: true, callback: () => "ok" },
      { action: "original", label: "Sem enquadrar", icon: "fa-solid fa-image", callback: () => "original" },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ],
    render: (ev, dlg) => {
      const raiz = dlg?.element ?? ev?.target?.element ?? ev?.target;
      const el = raiz?.querySelector ? raiz : document;
      previa = el.querySelector("[data-previa]");
      caixa = el.querySelector(".epm-recorte-caixa");
      if (!caixa) return;
      let arrasto = null;
      caixa.addEventListener("pointerdown", e => {
        e.preventDefault();
        e.stopPropagation();
        arrasto = { alca: e.target.dataset.alca || "meio", x: e.clientX, y: e.clientY, inicio: { ...recorte } };
        caixa.setPointerCapture?.(e.pointerId);
      });
      caixa.addEventListener("pointermove", e => {
        if (!arrasto) return;
        recorte = arrastarRecorte(arrasto.inicio, arrasto.alca, (e.clientX - arrasto.x) / escala, (e.clientY - arrasto.y) / escala, W, H);
        atualizar();
      });
      const soltar = () => { arrasto = null; };
      caixa.addEventListener("pointerup", soltar);
      caixa.addEventListener("pointercancel", soltar);
      el.querySelector(".epm-recorte-palco")?.addEventListener("wheel", e => {
        e.preventDefault();
        const novo = recorte.lado * (e.deltaY < 0 ? 0.94 : 1 / 0.94);
        recorte = limitarRecorte({ x: recorte.x + (recorte.lado - novo) / 2, y: recorte.y + (recorte.lado - novo) / 2, lado: novo }, W, H);
        atualizar();
      }, { passive: false });
      const campoCor = el.querySelector("[data-cor]"), original = el.querySelector("[data-cor-original]");
      const trocarCor = () => {
        cor = original?.checked ? "" : campoCor?.value ?? "";
        bordaPintada = bordaColorida(borda, cor);
        atualizar();
      };
      campoCor?.addEventListener("input", () => { if (original) original.checked = false; trocarCor(); });
      original?.addEventListener("change", trocarCor);
      el.querySelector("[data-borda]")?.addEventListener("change", e => { comBorda = e.target.checked; atualizar(); });
      el.querySelector("[data-tudo]")?.addEventListener("click", () => { recorte = limitarRecorte({ x: 0, y: 0, lado: Math.min(W, H) }, W, H); recorte.x = (W - recorte.lado) / 2; recorte.y = (H - recorte.lado) / 2; atualizar(); });
      atualizar();
    }
  });
  if (r === "original") return src;
  if (r !== "ok") return null;
  salvarCor(cor);

  const final = document.createElement("canvas");
  final.width = final.height = TAMANHO_FINAL;
  desenharToken(final.getContext("2d"), TAMANHO_FINAL, img, bordaPintada, recorte, { comBorda });
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
