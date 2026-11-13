/**
 * Acesso às APIs do Foundry pelos caminhos novos (v13) com recuo para os antigos (v12),
 * e helpers de Handlebars usados pelos templates.
 */

export const fvtt = {
  get TextEditor() {
    return foundry.applications?.ux?.TextEditor?.implementation ?? globalThis.TextEditor;
  },
  get FilePicker() {
    return foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
  },
  get DialogV2() {
    return foundry.applications.api.DialogV2;
  },
  get DocumentSheetConfig() {
    return foundry.applications?.apps?.DocumentSheetConfig ?? globalThis.DocumentSheetConfig;
  },
  loadTemplates(arg) {
    const fn = foundry.applications?.handlebars?.loadTemplates ?? globalThis.loadTemplates;
    return fn(arg);
  },
  renderTemplate(caminho, dados) {
    const fn = foundry.applications?.handlebars?.renderTemplate ?? globalThis.renderTemplate;
    return fn(caminho, dados);
  }
};

export function escapar(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Enriquecimento de HTML (links @UUID, rolagens inline…). */
export async function enriquecer(html, { relativeTo, rollData, secrets = false } = {}) {
  if (!html) return "";
  try {
    return await fvtt.TextEditor.enrichHTML(html, { relativeTo, rollData, secrets });
  } catch (err) {
    console.warn("EPM | Falha ao enriquecer texto", err);
    return html;
  }
}

/**
 * HTML de um editor de texto rico (ProseMirror) ligado a um campo do formulário.
 * Usa o construtor oficial do Foundry; se não existir, cai para <textarea>.
 */
export function editorHTML({ name, value = "", enriched = "", documentUUID, toggled = false, compact = false, height }) {
  const PM = foundry.applications?.elements?.HTMLProseMirrorElement;
  if (PM?.create) {
    try {
      const config = { name, value: value ?? "", enriched: enriched ?? "", toggled, compact };
      if (documentUUID) config.documentUUID = documentUUID;
      if (height) config.height = height;
      const el = PM.create(config);
      if (!el.hasAttribute("name")) el.setAttribute("name", name);
      if (!el.hasAttribute("value")) el.setAttribute("value", value ?? "");
      if (toggled && enriched && !el.innerHTML) el.innerHTML = enriched;
      return el.outerHTML;
    } catch (err) {
      console.warn("EPM | Editor de texto rico indisponível, usando caixa simples", err);
    }
  }
  return `<textarea class="epm-texto-simples" name="${escapar(name)}" rows="6">${escapar(value)}</textarea>`;
}

/**
 * Textos ricos sempre abertos: ao mudar, salva só aquele campo, sem redesenhar a janela
 * (o redesenho recriava o editor, piscava a tela e tirava o cursor do lugar).
 * Liga uma vez por janela; o elemento raiz de uma ApplicationV2 sobrevive aos redesenhos.
 */
export function ligarTextoRico(app, documento = () => app.document) {
  const raiz = app.element;
  if (!raiz || raiz.dataset.epmTextoRico) return;
  raiz.dataset.epmTextoRico = "1";
  raiz.addEventListener("change", ev => {
    const el = ev.target?.closest?.("prose-mirror");
    if (!el) return;
    ev.stopPropagation();
    ev.stopImmediatePropagation?.();
    const nome = el.name || el.getAttribute("name");
    const doc = documento();
    if (!nome || !doc?.isOwner) return;
    const valor = el.value ?? "";
    if (foundry.utils.getProperty(doc, nome) === valor) return;
    doc.update({ [nome]: valor }, { render: false, epmTextoRico: true }).catch(err => console.warn("EPM | Falha ao salvar o texto", err));
  }, { capture: true });
}

/** Lê os dados de arrastar-e-soltar de um evento. */
export function dadosDeArraste(event) {
  try {
    const TE = fvtt.TextEditor;
    if (TE?.getDragEventData) return TE.getDragEventData(event);
  } catch { /* segue para o recuo */ }
  try {
    return JSON.parse(event.dataTransfer?.getData("text/plain") ?? "{}");
  } catch {
    return {};
  }
}

export function registrarHelpers(H) {
  H.registerHelper("epmEq", (a, b) => a === b);
  H.registerHelper("epmNe", (a, b) => a !== b);
  H.registerHelper("epmOr", (...args) => args.slice(0, -1).some(Boolean));
  H.registerHelper("epmAnd", (...args) => args.slice(0, -1).every(Boolean));
  H.registerHelper("epmNot", v => !v);
  H.registerHelper("epmChecked", v => (v ? "checked" : ""));
  H.registerHelper("epmSelected", (a, b) => (String(a) === String(b) ? "selected" : ""));
  H.registerHelper("epmSinal", n => {
    const v = Number(n) || 0;
    return v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0";
  });
  H.registerHelper("epmPct", v => `${Math.round((Number(v) || 0) * 100)}%`);
  H.registerHelper("epmJoin", (arr, sep) => (Array.isArray(arr) ? arr.join(typeof sep === "string" ? sep : ", ") : ""));
  H.registerHelper("epmNumero", v => (Number(v) || 0).toLocaleString("pt-BR"));
  H.registerHelper("epmMenor", (a, b) => Number(a) < Number(b));
}
