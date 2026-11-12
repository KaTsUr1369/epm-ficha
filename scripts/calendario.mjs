/** Data do mundo pelo Simple Calendar (vazio se ele não estiver ativo). Sem imports: pode ser usado por qualquer módulo. */
export function dataDoMundo() {
  const api = globalThis.SimpleCalendar?.api;
  if (!api) return "";
  try {
    const t = api.timestamp?.() ?? globalThis.game?.time?.worldTime;
    const d = api.timestampToDate?.(t);
    if (d?.display?.date) return String(d.display.date);
    if (d) return `${d.day + 1}/${d.month + 1}/${d.year}`;
  } catch { /* sem calendário */ }
  return "";
}
