/**
 * Um Foundry de mentira, só o suficiente para executar mecanicas.mjs em Node.
 * Diálogos respondem com o que estiver na fila `respostas` (ou com a ação padrão).
 */
import { prepararHandlebars } from "./harness.mjs";

export const registro = { mensagens: [], avisos: [], dialogos: [] };
export const respostas = [];

function setProperty(obj, caminho, valor) {
  const partes = caminho.split(".");
  let o = obj;
  for (let i = 0; i < partes.length - 1; i++) o = (o[partes[i]] ??= {});
  const ultima = partes.at(-1);
  if (ultima.startsWith("-=")) delete o[ultima.slice(2)];
  else o[ultima] = valor;
}
function getProperty(obj, caminho) { return caminho.split(".").reduce((o, k) => o?.[k], obj); }

let seq = 0;
globalThis.foundry = {
  utils: {
    randomID: () => `r${String(++seq).padStart(15, "0")}`,
    setProperty, getProperty,
    deepClone: x => structuredClone(x),
    flattenObject: (o, p = "", out = {}) => {
      for (const [k, v] of Object.entries(o ?? {})) {
        if (v && typeof v === "object" && !Array.isArray(v)) globalThis.foundry.utils.flattenObject(v, `${p}${k}.`, out);
        else out[`${p}${k}`] = v;
      }
      return out;
    },
    mergeObject: (a, b) => Object.assign(a, b)
  },
  applications: {
    api: {
      DialogV2: {
        wait: async cfg => {
          registro.dialogos.push(cfg.window?.title);
          if (respostas.length) {
            const r = respostas.shift();
            return typeof r === "function" ? r(cfg) : r;
          }
          const padrao = cfg.buttons?.find(b => b.default) ?? cfg.buttons?.[0];
          return padrao?.action ?? null;
        },
        confirm: async () => (respostas.length ? respostas.shift() : true)
      }
    },
    handlebars: {
      renderTemplate: async (caminho, dados) => {
        const H = prepararHandlebars();
        const fs = await import("fs");
        const arq = caminho.replace("modules/epm-ficha/templates/", "/home/claude/epm-ficha/templates/");
        return H.compile(fs.readFileSync(arq, "utf8"))(dados);
      }
    },
    ux: { TextEditor: { implementation: { enrichHTML: async h => h } } }
  }
};

const ajustesPadrao = { condicoesHud: "substituir", modoLimites: "separados", bloquearLimites: true, formulaTeste: "1d20", marcarAcoes: true,
  condicoesHudTodas: false, afinidadeSoMestre: true, relacaoMutua: true, avisoFichaPadrao: true, periciasPadrao: [], reacaoAntesDoAcerto: false };
globalThis.game = {
  user: { isGM: true, id: "gm" },
  settings: { get: (m, k) => (m === "core" ? "roll" : ajustesPadrao[k]), set: async () => {} },
  modules: new Map(), combat: null, i18n: { localize: x => x }, actors: { contents: [] }
};
globalThis.ui = { notifications: { info: m => registro.avisos.push(["info", m]), warn: m => registro.avisos.push(["warn", m]), error: m => registro.avisos.push(["erro", m]) } };
globalThis.CONFIG = { sounds: {}, statusEffects: [], specialStatusEffects: { DEFEATED: "dead" } };

/** Roll de mentira: entende NdX, números, + - * / e parênteses. Dados rolam "na média para cima". */
class RollFalso {
  constructor(formula) { this.formula = String(formula); this.dice = []; }
  static replaceFormulaData(f, dados) { return String(f).replace(/@([\w.]+)/g, (_, c) => String(getProperty(dados, c) ?? 0)); }
  async evaluate() {
    let expr = this.formula.replace(/(\d*)d(\d+)(k[hl]\d*)?/g, (_, n, f, k) => {
      const qtd = n === "" ? 1 : Number(n);
      const vals = Array.from({ length: qtd }, () => Math.ceil(Number(f) / 2) + 1 > Number(f) ? Number(f) : Math.ceil(Number(f) / 2) + 1);
      this.dice.push({ total: vals.reduce((a, b) => a + b, 0) });
      return String(k ? Math.max(...vals) : vals.reduce((a, b) => a + b, 0));
    });
    if (!/^[\d\s+\-*/().]+$/.test(expr)) throw new Error(`fórmula inválida: ${this.formula} → ${expr}`);
    this.total = Function(`return (${expr})`)();
    return this;
  }
  async render() { return `<div class="dice-roll">${this.formula} = ${this.total}</div>`; }
  async toMessage(m) { registro.mensagens.push({ ...m, roll: this }); }
}
globalThis.Roll = RollFalso;
globalThis.ChatMessage = {
  create: async m => { registro.mensagens.push(m); return m; },
  getSpeaker: () => ({ alias: "x" }), applyRollMode: () => {}, getSpeakerActor: () => null
};

/** Ator de mentira a partir de um objeto de exemplo (amostra.mjs). */
export function atorFalso(base) {
  const ator = base;
  ator.isOwner = true;
  ator.effects = { contents: [] };
  ator.update = async updates => {
    for (const [k, v] of Object.entries(updates)) setProperty(ator, k, v);
    return ator;
  };
  ator.toggleStatusEffect = async (id, { active } = {}) => {
    const ligar = active ?? !ator.statuses.has(id);
    if (ligar) ator.statuses.add(id); else ator.statuses.delete(id);
    return true;
  };
  for (const it of ator.items) {
    it.actor = ator;
    it.update = async updates => { for (const [k, v] of Object.entries(updates)) setProperty(it, k, v); return it; };
  }
  ator.items.get = id => ator.items.find(i => i.id === id);
  return ator;
}
