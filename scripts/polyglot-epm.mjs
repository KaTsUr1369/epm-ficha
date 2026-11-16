/**
 * Polyglot com os idiomas do EPM: registra um provedor de idiomas próprio, então o seletor do chat
 * e a lista da ficha mostram só os idiomas do sistema (os do D&D 5e somem).
 * O personagem fala o que está no campo de idiomas da ficha (system.traits.languages), pela chave
 * ou pelo nome escrito; as chaves antigas do D&D 5e (common, elvish…) são traduzidas.
 */
import { MODULE_ID, IDIOMAS_EPM, IDIOMAS_PROIBIDOS } from "./config.mjs";

const slug = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Fonte de cada idioma (quando o Polyglot tem a fonte; senão a padrão). */
const FONTES = {
  comum: "Thorass", draconico: "Iokharic", anao: "Dethek", elfico: "Espruar", mecanico: "Pulsian", infernal: "Infernal",
  celestial: "Celestial", gigantico: "Dethek", silvestre: "Rellanic", runico: "Olde Thorass", goblin: "Dethek",
  serpentino: "Ophidian", "linguagem-das-ruas": "Thorass", "linguagem-de-sinais": "Thorass",
  abissal: "Barazhad", carmesim: "Infernal", primordial: "Olde Espruar", astral: "Celestial", titanico: "Dethek"
};
/** Chaves do D&D 5e que já podem estar nas fichas. */
const CHAVES_DND5E = {
  common: "comum", draconic: "draconico", dwarvish: "anao", elvish: "elfico", infernal: "infernal", celestial: "celestial",
  giant: "gigantico", sylvan: "silvestre", goblin: "goblin", sign: "linguagem-de-sinais", cant: "linguagem-das-ruas",
  abyssal: "abissal", primordial: "primordial"
};

/** Idiomas do EPM: { chave: rótulo }. */
export function idiomasPolyglot() {
  return Object.fromEntries([...IDIOMAS_EPM, ...IDIOMAS_PROIBIDOS].map(n => [slug(n), n]));
}

/** Chave EPM de um valor do campo de idiomas (chave nossa, chave do D&D 5e ou nome escrito). */
export function chaveIdioma(valor) {
  const s = slug(valor);
  const nossos = idiomasPolyglot();
  if (nossos[s]) return s;
  if (CHAVES_DND5E[String(valor ?? "").toLowerCase()]) return CHAVES_DND5E[String(valor).toLowerCase()];
  return Object.keys(nossos).find(k => slug(nossos[k]) === s) ?? "";
}

/** Chaves que o personagem fala, lidas do campo de idiomas da ficha. */
export function idiomasDoAtor(actor) {
  const langs = actor?.system?.traits?.languages ?? {};
  const valores = langs.value instanceof Set ? [...langs.value] : Array.isArray(langs.value) ? langs.value : [];
  const custom = String(langs.custom ?? "").split(/[;,]/).map(t => t.trim()).filter(Boolean);
  return new Set([...valores, ...custom].map(chaveIdioma).filter(Boolean));
}

export function registrarPolyglot() {
  Hooks.once("polyglot.init", LanguageProvider => {
    class ProvedorEPM extends LanguageProvider {
      languages = Object.fromEntries(Object.entries(idiomasPolyglot()).map(([k, label]) => [k, { label, font: FONTES[k] ?? "Thorass", rng: "default" }]));

      get defaultLanguage() { return "comum"; }

      async getLanguages() {
        let ajuste = {};
        try { ajuste = game.settings.get("polyglot", "Languages") ?? {}; } catch { ajuste = {}; }
        const fontes = this.fonts ?? LanguageProvider.fonts ?? {};
        const langs = {};
        for (const [k, label] of Object.entries(idiomasPolyglot())) {
          const fonte = ajuste[k]?.font ?? FONTES[k];
          langs[k] = { label, font: fonte && (!Object.keys(fontes).length || fontes[fonte]) ? fonte : (this.defaultFont ?? "Thorass"), rng: ajuste[k]?.rng ?? "default" };
        }
        this.languages = langs;
      }

      getUserLanguages(actor) {
        return [idiomasDoAtor(actor), new Set()];
      }
    }
    try { game.polyglot.api.registerModule(MODULE_ID, ProvedorEPM); }
    catch (err) { console.warn("EPM | Polyglot: não consegui registrar os idiomas do EPM", err); }
  });

  // O Mestre deixa o provedor do EPM escolhido no Polyglot (uma vez; se trocar depois, fica a escolha dele)
  Hooks.once("ready", async () => {
    if (!game.modules?.get("polyglot")?.active || !game.user?.isGM) return;
    const id = `module.${MODULE_ID}`;
    try {
      const ja = game.settings.get(MODULE_ID, "polyglotEscolhido");
      const atual = game.settings.get("polyglot", "languageProvider");
      if (!ja && atual !== id) await game.settings.set("polyglot", "languageProvider", id);
      if (!ja) await game.settings.set(MODULE_ID, "polyglotEscolhido", true);
      game.polyglot?.api?.updateProvider?.();
    } catch (err) { console.warn("EPM | Polyglot: escolha o provedor \"Escolhidos pelo Multiverso\" nas configurações do Polyglot", err); }
  });
}
