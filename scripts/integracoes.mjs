/**
 * Integrações com outros módulos (0.8.22). Cada uma só liga se o módulo estiver ativo.
 * - Item Piles: lojas, baús e trocas usam as moedas EPM (flags.epm-ficha.moedas).
 * - Simple Calendar Reborn: o relógio dos treinos e projetos já usa a API "SimpleCalendar.api" (a mesma do Reborn).
 * - Carousel Combat Tracker (combat-tracker-dock): ver integracao-dock.mjs.
 * - Polyglot: ver polyglot-epm.mjs.
 */
import { MODULE_ID, FLAG, MOEDAS } from "./config.mjs";

const ativo = id => !!game.modules?.get(id)?.active;

/** Moedas EPM no formato do Item Piles (o Ouro é a principal). */
export function moedasItemPiles() {
  const ouro = MOEDAS.find(m => m.id === "po")?.valor ?? 100;
  return MOEDAS.map(m => ({
    type: "attribute", name: m.label, img: m.img, abbreviation: `{#} ${m.abrev}`,
    data: { path: `flags.${FLAG}.moedas.${m.id}` }, primary: m.id === "po", exchangeRate: m.valor / ouro
  }));
}

async function integrarItemPiles() {
  const api = game.itempiles?.API;
  if (!api || !game.user?.isGM || game.users?.activeGM?.id !== game.user.id) return;
  if (!game.settings.get(MODULE_ID, "itemPilesMoedas")) return;
  const novas = moedasItemPiles();
  const atuais = api.CURRENCIES ?? [];
  const iguais = atuais.length === novas.length && novas.every(n => atuais.some(a => a?.data?.path === n.data.path && Number(a.exchangeRate) === n.exchangeRate));
  if (iguais) return;
  try {
    await api.setCurrencies(novas);
    if (api.setSecondaryCurrencies) await api.setSecondaryCurrencies([]);
    ui.notifications.info("EPM: o Item Piles agora usa as moedas da ficha EPM.");
  } catch (err) { console.warn("EPM | Item Piles", err); }
}

export function registrarIntegracoes() {
  Hooks.once("item-piles-ready", () => integrarItemPiles().catch(err => console.warn("EPM | Item Piles", err)));
  Hooks.once("ready", () => {
    if (ativo("item-piles") && game.itempiles?.API) integrarItemPiles().catch(err => console.warn("EPM | Item Piles", err));
  });
}
