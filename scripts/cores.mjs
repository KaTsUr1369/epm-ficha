/**
 * Cores da Personalização: conversões e a paleta da ficha a partir de uma cor base.
 * Puro (sem Foundry). A cor escolhida na roda define o tom e a saturação dos fundos,
 * painéis e linhas; o "traço" de brilho deixa tudo mais escuro ou mais claro.
 */
import { COR_PADRAO, BRILHO_PADRAO } from "./config.mjs";

const limitar = (v, a, b) => Math.min(b, Math.max(a, v));

export function hexValido(hex) {
  return /^#?[0-9a-f]{6}$/i.test(String(hex ?? "").trim()) || /^#?[0-9a-f]{3}$/i.test(String(hex ?? "").trim());
}

export function normalizarHex(hex, padrao = COR_PADRAO) {
  let h = String(hex ?? "").trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map(c => c + c).join("");
  return /^[0-9a-f]{6}$/i.test(h) ? `#${h.toUpperCase()}` : padrao;
}

export function hexParaRgb(hex) {
  const h = normalizarHex(hex).slice(1);
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

export function rgbParaHex({ r, g, b }) {
  const p = v => Math.round(limitar(v, 0, 255)).toString(16).padStart(2, "0");
  return `#${p(r)}${p(g)}${p(b)}`.toUpperCase();
}

/** RGB (0–255) → HSL (h 0–360, s e l 0–1). */
export function rgbParaHsl({ r, g, b }) {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0));
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return { h: h * 60, s, l };
}

/** HSL (h 0–360, s e l 0–1) → RGB (0–255). */
export function hslParaRgb({ h, s, l }) {
  const hh = ((h % 360) + 360) % 360 / 360;
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const canal = t => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return { r: canal(hh + 1 / 3) * 255, g: canal(hh) * 255, b: canal(hh - 1 / 3) * 255 };
}

export const hexParaHsl = hex => rgbParaHsl(hexParaRgb(hex));
export const hslParaHex = hsl => rgbParaHex(hslParaRgb(hsl));

/** Ponto da roda (ângulo = tom, distância do centro = saturação) → cor hex com luz 50%. */
export function corDaRoda(angulo, raio) {
  return hslParaHex({ h: angulo, s: limitar(raio, 0, 1), l: 0.5 });
}

/** Posição de uma cor na roda: { angulo, raio } (raio 0 a 1). */
export function posicaoNaRoda(hex) {
  const { h, s } = hexParaHsl(hex);
  return { angulo: h, raio: s };
}

/* Degraus de luz e saturação medidos na paleta original (verdete), relativos à cor base. */
const DEGRAUS = {
  "--epm-entrada":     { s: 1.14, l: 0.078, fundo: true },
  "--epm-fundo":       { s: 1.07, l: 0.098, fundo: true },
  "--epm-painel":      { s: 1.04, l: 0.129, fundo: true },
  "--epm-painel-2":    { s: 1.0,  l: 0.165, fundo: true },
  "--epm-brilho":      { s: 1.1,  l: 0.149, fundo: true },
  "--epm-linha":       { s: 0.84, l: 0.231, fundo: true },
  "--epm-linha-forte": { s: 0.79, l: 0.312, fundo: true },
  "--epm-suave":       { s: 0.46, l: 0.657 },
  "--epm-fraco":       { s: 0.37, l: 0.482 }
};

/**
 * As 11 variáveis CSS da ficha para uma cor base e um brilho (0 a 100, padrão 50).
 * A saturação dos fundos é limitada a 70% para o texto continuar legível.
 */
export function paletaDaCor(cor = COR_PADRAO, brilho = BRILHO_PADRAO) {
  const base = normalizarHex(cor);
  const { h, s } = hexParaHsl(base);
  const sat = Math.min(s, 0.7);
  const deslocamento = (limitar(Number(brilho ?? BRILHO_PADRAO) || 0, 0, 100) - 50) / 50 * 0.06;
  const vars = {};
  for (const [nome, d] of Object.entries(DEGRAUS)) {
    const l = limitar(d.l + (d.fundo ? deslocamento : deslocamento * 0.5), 0.02, 0.9);
    vars[nome] = hslParaHex({ h, s: limitar(sat * d.s, 0, 1), l });
  }
  vars["--epm-base"] = base;
  vars["--epm-base-suave"] = `${base}33`;
  return vars;
}

/** Texto "nome: valor;" pronto para o atributo style. */
export function estiloPaleta(cor, brilho) {
  return Object.entries(paletaDaCor(cor, brilho)).map(([k, v]) => `${k}: ${v}`).join("; ");
}
