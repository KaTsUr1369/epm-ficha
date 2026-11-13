/**
 * Enquadrar a imagem do token na borda do EPM (anel de runas com chamas), como num editor de foto de celular:
 * um quadrado sobre a imagem, que aumenta ou diminui arrastando as laterais e os cantos e anda segurando o meio.
 * O que fica dentro do quadrado vai para o círculo de dentro da borda (antes das runas); o resto some (PNG transparente).
 * As 3 partes da borda (anel, chamas e runas) podem mudar de cor. O PNG vai para a pasta "Tokens" dos dados do Foundry.
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

/** As 3 camadas da borda que podem mudar de cor. */
export const CAMADAS_BORDA = [
  { id: "anel", label: "Principal (anel)" },
  { id: "chamas", label: "Secundária (chamas)" },
  { id: "runas", label: "Terciária (runas)" }
];

const hexRgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h ?? "")); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

/**
 * Peso de cada camada num pixel da borda (pura, para teste). As runas (e o brilho das estrelas) são os pixels
 * claros da faixa do anel; o anel é o azul e o que fica perto do círculo; as chamas são o resto (escuro, de fora).
 * `rel` = distância ao centro em fração do lado da imagem.
 */
export function pesoCamadas(R, G, B, rel) {
  const L = 0.3 * R + 0.59 * G + 0.11 * B;
  const naFaixa = rel >= 0.309 && rel <= 0.414;
  const runa = naFaixa ? Math.min(1, Math.max(0, (L - 55) / 40)) : 0;
  const anel = (B - R > 10 || rel < 0.375) ? 1 - runa : 0;
  return { runas: runa, anel, chamas: 1 - runa - anel, L };
}

/**
 * Borda com até 3 cores: { anel, chamas, runas } em hex ("" = cor original da camada). Cada camada mantém o claro e
 * o escuro do desenho (o pixel mais claro da camada fica na cor escolhida; o escuro, numa versão escura dela).
 * Aceita uma cor só (texto) para pintar tudo, como antes.
 */
export function bordaColorida(borda, cores) {
  if (typeof cores === "string") cores = cores ? { anel: cores, chamas: cores, runas: cores } : {};
  const rgb = Object.fromEntries(CAMADAS_BORDA.map(c => [c.id, hexRgb(cores?.[c.id])]));
  if (!Object.values(rgb).some(Boolean)) return borda;
  const w = borda.naturalWidth || borda.width, h = borda.naturalHeight || borda.height;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(borda, 0, 0);
  const dados = ctx.getImageData(0, 0, w, h);
  const px = dados.data;
  const cx = CIRCULO_BORDA.cx * w, cy = CIRCULO_BORDA.cy * h;
  // 1ª passada: brilho de referência de cada camada (o mais claro dela)
  const pesos = new Array(w * h);
  const ref = { anel: 1, chamas: 1, runas: 1 };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = (y * w + x) * 4;
    if (px[k + 3] < 8) continue;
    const p = pesoCamadas(px[k], px[k + 1], px[k + 2], Math.hypot(x - cx, y - cy) / w);
    pesos[y * w + x] = p;
    for (const id of ["anel", "chamas", "runas"]) if (p[id] > 0.5) ref[id] = Math.max(ref[id], p.L);
  }
  // 2ª passada: pinta cada camada que tem cor
  const BASE = 0.22;
  for (let i = 0; i < pesos.length; i++) {
    const p = pesos[i];
    if (!p) continue;
    const k = i * 4;
    const orig = [px[k], px[k + 1], px[k + 2]];
    const novo = [0, 0, 0];
    for (const id of ["anel", "chamas", "runas"]) {
      const w8 = p[id];
      if (!w8) continue;
      const cor = rgb[id];
      const luz = BASE + (1 - BASE) * Math.min(1, p.L / ref[id]);
      for (let ch = 0; ch < 3; ch++) novo[ch] += w8 * (cor ? cor[ch] * luz : orig[ch]);
    }
    px[k] = Math.round(novo[0]); px[k + 1] = Math.round(novo[1]); px[k + 2] = Math.round(novo[2]);
  }
  ctx.putImageData(dados, 0, 0);
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

function coresSalvas() {
  try {
    const t = localStorage.getItem(CHAVE_COR) || "";
    if (!t) return {};
    if (t.startsWith("#")) return { anel: t, chamas: t, runas: t };
    return JSON.parse(t) ?? {};
  } catch { return {}; }
}
function salvarCores(cores) {
  try { localStorage.setItem(CHAVE_COR, JSON.stringify(cores ?? {})); } catch { /* sem armazenamento */ }
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
  const cores = { anel: "", chamas: "", runas: "", ...coresSalvas() };
  let bordaPintada = bordaColorida(borda, cores);
  const PADRAO = { anel: "#1c3a7a", chamas: "#2a2a2a", runas: "#dfe6f2" };
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
        <fieldset class="epm-cores-borda"><legend>Cores da borda</legend>
          ${CAMADAS_BORDA.map(c => `<div class="epm-cor-camada"><label class="epm-campo"><span>${escapar(c.label)}</span><input type="color" data-cor="${c.id}" value="${escapar(cores[c.id] || PADRAO[c.id])}"></label>
            <button type="button" class="epm-icone-botao" data-cor-original="${c.id}" title="Voltar à cor original desta parte" ${cores[c.id] ? "" : "disabled"}><i class="fa-solid fa-rotate-left"></i></button></div>`).join("")}
        </fieldset>
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
      let espera = 0;
      const repintar = () => {
        cancelAnimationFrame(espera);
        espera = requestAnimationFrame(() => { bordaPintada = bordaColorida(borda, cores); atualizar(); });
      };
      for (const campo of el.querySelectorAll("input[data-cor]")) {
        campo.addEventListener("input", () => {
          cores[campo.dataset.cor] = campo.value;
          const b = el.querySelector(`[data-cor-original="${campo.dataset.cor}"]`);
          if (b) b.disabled = false;
          repintar();
        });
      }
      for (const b of el.querySelectorAll("[data-cor-original]")) {
        b.addEventListener("click", () => {
          cores[b.dataset.corOriginal] = "";
          b.disabled = true;
          const campo = el.querySelector(`input[data-cor="${b.dataset.corOriginal}"]`);
          if (campo) campo.value = PADRAO[b.dataset.corOriginal];
          repintar();
        });
      }
      el.querySelector("[data-borda]")?.addEventListener("change", e => { comBorda = e.target.checked; atualizar(); });
      el.querySelector("[data-tudo]")?.addEventListener("click", () => { recorte = limitarRecorte({ x: 0, y: 0, lado: Math.min(W, H) }, W, H); recorte.x = (W - recorte.lado) / 2; recorte.y = (H - recorte.lado) / 2; atualizar(); });
      atualizar();
    }
  });
  if (r === "original") return src;
  if (r !== "ok") return null;
  salvarCores(cores);

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
