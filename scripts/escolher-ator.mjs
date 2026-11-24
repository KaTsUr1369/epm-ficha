/**
 * Escolher personagens num diálogo com busca (0.8.28). Usado em Relações, Mochila compartilhada, Projetos do
 * Artífice e onde mais for preciso escolher uma ficha do mundo.
 * Quem aparece: o Mestre vê todas; o jogador vê só as fichas que têm jogador (e as que ele controla).
 * NPCs e chefes do Mestre nunca aparecem para jogador, nem pelo nome.
 */
import { escapar, fvtt } from "./helpers.mjs";

/** O jogador pode ver esta ficha na lista? */
export function atorVisivel(a, usuario = globalThis.game?.user) {
  if (!a) return false;
  if (usuario?.isGM) return true;
  return !!(a.hasPlayerOwner || a.isOwner);
}

/** Fichas que este usuário pode escolher, em ordem alfabética. `filtro(a)` restringe mais (ex.: só personagens). */
export function atoresVisiveis({ excluir = [], filtro = null, usuario = globalThis.game?.user } = {}) {
  const fora = new Set(excluir);
  return [...(globalThis.game?.actors ?? [])]
    .filter(a => !fora.has(a.uuid) && !fora.has(a.id) && atorVisivel(a, usuario) && (!filtro || filtro(a)))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/** Rótulo curto do tipo da ficha (só o Mestre vê "NPC"). */
const tipoDe = a => a.type === "character" ? (a.hasPlayerOwner ? "Personagem de jogador" : "Personagem") : (globalThis.game?.user?.isGM ? "NPC" : "Ficha");

/**
 * Diálogo de escolha com busca pelo nome (e filtro por tipo, para o Mestre).
 * Devolve { uuids, ids, ...campos do formulário } ou null. `marcados` = ids/uuids já marcados (múltipla escolha).
 */
export async function escolherAtores({ titulo, excluir = [], filtro = null, multiplos = false, dica = "", extra = "", ok = null, marcados = [], largura = 480 } = {}) {
  const lista = atoresVisiveis({ excluir, filtro });
  if (!lista.length) { ui.notifications.info("Não há outros personagens disponíveis."); return null; }
  const jaMarcados = new Set(marcados);
  const gm = !!globalThis.game?.user?.isGM;
  const linhas = lista.map(a => `
    <label class="epm-escolha-ator" data-nome="${escapar(a.name.toLowerCase())}" data-tipo="${a.hasPlayerOwner ? "jogador" : "outros"}">
      <input type="${multiplos ? "checkbox" : "radio"}" name="ator" value="${a.uuid}" ${jaMarcados.has(a.id) || jaMarcados.has(a.uuid) ? "checked" : ""}>
      <img src="${escapar(a.img)}" alt=""><span>${escapar(a.name)}</span>
      <em>${tipoDe(a)}</em>
    </label>`).join("");
  const r = await fvtt.DialogV2.wait({
    window: { title: titulo }, classes: ["epm-dialogo", "epm-dialogo-atores"], rejectClose: false, modal: true,
    position: { width: largura },
    content: `${dica ? `<p class="epm-dica">${dica}</p>` : ""}${extra}
      <div class="epm-busca-ator-linha"><input type="search" class="epm-busca-ator" placeholder="Buscar pelo nome (${lista.length})" aria-label="Buscar personagem">
      ${gm ? `<select class="epm-filtro-ator" aria-label="Mostrar"><option value="">Todos</option><option value="jogador">Só de jogadores</option><option value="outros">NPCs e sem jogador</option></select>` : ""}</div>
      <div class="epm-lista-atores">${linhas}</div><p class="epm-dica epm-sem-resultado" hidden>Nenhum nome encontrado.</p>`,
    render: (ev, arg) => {
      const raiz = arg instanceof HTMLElement ? arg : (arg?.element ?? ev?.target?.element);
      const busca = raiz?.querySelector(".epm-busca-ator");
      const tipo = raiz?.querySelector(".epm-filtro-ator");
      const filtrar = () => {
        const t = (busca?.value ?? "").trim().toLowerCase();
        const k = tipo?.value ?? "";
        let n = 0;
        for (const l of raiz.querySelectorAll(".epm-escolha-ator")) {
          l.hidden = (!!t && !l.dataset.nome.includes(t)) || (!!k && l.dataset.tipo !== k);
          if (!l.hidden) n++;
        }
        const sem = raiz.querySelector(".epm-sem-resultado");
        if (sem) sem.hidden = n > 0;
      };
      busca?.addEventListener("input", filtrar);
      tipo?.addEventListener("change", filtrar);
      setTimeout(() => busca?.focus(), 0);
    },
    buttons: [
      {
        action: "ok", label: ok ?? (multiplos ? "Aplicar" : "Escolher"), icon: "fa-solid fa-check", default: true,
        callback: (ev, b) => {
          const out = {};
          for (const [k, v] of new FormData(b.form).entries()) if (k !== "ator") out[k] = v;
          for (const c of b.form.querySelectorAll('input[type="checkbox"]:not([name="ator"])')) out[c.name] = c.checked;
          const uuids = [...b.form.querySelectorAll('input[name="ator"]:checked')].map(i => i.value);
          return { ...out, uuids, ids: uuids.map(u => u.split(".").pop()) };
        }
      },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  return r && typeof r === "object" ? r : null;
}
