/**
 * Personalização da ficha: roda de cor (tom e saturação), traço de brilho, hex e cores prontas.
 * A cor aparece na hora (variáveis CSS na janela) e é salva no ator ao soltar o mouse.
 */
import { FLAG, COR_PADRAO, BRILHO_PADRAO } from "./config.mjs";
import { paletaDaCor, corDaRoda, posicaoNaRoda, normalizarHex, hexValido } from "./cores.mjs";

const P = `flags.${FLAG}`;

/** Aplica a paleta de uma cor num elemento (a janela da ficha ou do editor de poderes). */
export function aplicarPaleta(elemento, cor = COR_PADRAO, brilho = BRILHO_PADRAO) {
  if (!elemento) return;
  for (const [nome, valor] of Object.entries(paletaDaCor(cor, brilho))) elemento.style.setProperty(nome, valor);
}

/** Desenha a roda (tom ao redor, saturação do centro para fora) num canvas. */
export function desenharRoda(canvas) {
  const g = canvas?.getContext?.("2d");
  if (!g) return;
  const w = canvas.width, h = canvas.height, r = w / 2;
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - r, dy = y - r, d = Math.hypot(dx, dy) / r;
      const i = (y * w + x) * 4;
      if (d > 1) { img.data[i + 3] = 0; continue; }
      const tom = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
      const a = d * 0.5;
      const k = n => (n + tom / 30) % 12;
      const f = n => 0.5 - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
      img.data[i] = f(0) * 255; img.data[i + 1] = f(8) * 255; img.data[i + 2] = f(4) * 255;
      img.data[i + 3] = d > 0.985 ? Math.round((1 - d) / 0.015 * 255) : 255;
    }
  }
  g.putImageData(img, 0, 0);
}

/**
 * Liga os controles da aba Personalização.
 * @param {HTMLElement} raiz  elemento da ficha
 * @param {Actor} actor
 */
export function ligarPersonalizacao(raiz, actor) {
  const roda = raiz.querySelector("[data-roda-cor]");
  if (!roda || roda.dataset.ligada) return;
  roda.dataset.ligada = "1";
  desenharRoda(roda.querySelector("canvas"));
  const marcador = roda.querySelector(".epm-roda-marcador");
  const brilhoInput = raiz.querySelector("[data-brilho-cor]");
  const hexInput = raiz.querySelector("[data-hex-cor]");
  const amostra = raiz.querySelector(".epm-hex-amostra");
  const atual = () => ({
    cor: normalizarHex(actor.flags?.[FLAG]?.personalizacao?.cor, COR_PADRAO),
    brilho: Number(actor.flags?.[FLAG]?.personalizacao?.brilho ?? BRILHO_PADRAO)
  });
  let estado = atual();

  const mostrar = (cor, brilho) => {
    estado = { cor, brilho };
    aplicarPaleta(raiz, cor, brilho);
    const { angulo, raio } = posicaoNaRoda(cor);
    if (marcador) {
      marcador.style.left = `${50 + Math.cos((angulo - 90) * Math.PI / 180) * raio * 50}%`;
      marcador.style.top = `${50 + Math.sin((angulo - 90) * Math.PI / 180) * raio * 50}%`;
      marcador.style.background = cor;
    }
    if (hexInput && document.activeElement !== hexInput) hexInput.value = cor;
    if (amostra) amostra.style.background = cor;
  };
  const salvar = () => actor.update({ [`${P}.personalizacao.cor`]: estado.cor, [`${P}.personalizacao.brilho`]: estado.brilho });

  const corNoPonto = ev => {
    const caixa = roda.getBoundingClientRect();
    const dx = ev.clientX - (caixa.left + caixa.width / 2);
    const dy = ev.clientY - (caixa.top + caixa.height / 2);
    const raio = Math.min(1, Math.hypot(dx, dy) / (caixa.width / 2));
    const angulo = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
    return corDaRoda(angulo, raio);
  };
  let arrastando = false;
  roda.addEventListener("pointerdown", ev => {
    if (!actor.isOwner) return;
    arrastando = true;
    roda.setPointerCapture?.(ev.pointerId);
    mostrar(corNoPonto(ev), estado.brilho);
  });
  roda.addEventListener("pointermove", ev => { if (arrastando) mostrar(corNoPonto(ev), estado.brilho); });
  const soltar = ev => {
    if (!arrastando) return;
    arrastando = false;
    roda.releasePointerCapture?.(ev.pointerId);
    salvar();
  };
  roda.addEventListener("pointerup", soltar);
  roda.addEventListener("pointercancel", soltar);
  roda.addEventListener("keydown", ev => {
    const passos = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] };
    const p = passos[ev.key];
    if (!p) return;
    ev.preventDefault();
    const { angulo, raio } = posicaoNaRoda(estado.cor);
    mostrar(corDaRoda((angulo + p[0] + 360) % 360, Math.max(0, Math.min(1, raio + p[1]))), estado.brilho);
    clearTimeout(roda._epmTimer);
    roda._epmTimer = setTimeout(salvar, 400);
  });
  brilhoInput?.addEventListener("input", ev => { ev.stopPropagation(); mostrar(estado.cor, Number(brilhoInput.value)); });
  brilhoInput?.addEventListener("change", ev => { ev.stopPropagation(); salvar(); });
  hexInput?.addEventListener("input", ev => {
    ev.stopPropagation();
    if (hexValido(hexInput.value)) mostrar(normalizarHex(hexInput.value), estado.brilho);
  });
  hexInput?.addEventListener("change", ev => {
    ev.stopPropagation();
    if (hexValido(hexInput.value)) { mostrar(normalizarHex(hexInput.value), estado.brilho); salvar(); }
    else hexInput.value = estado.cor;
  });
}
