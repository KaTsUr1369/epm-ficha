/**
 * Erros amigáveis (0.8.23): quando algo da ficha EPM falha, um aviso diz o que fazer e um cartão (só para quem viu)
 * traz o erro com o botão "Copiar o erro", para mandar a quem cuida do módulo.
 */
import { MODULE_ID, FLAG } from "./config.mjs";
import { escapar } from "./helpers.mjs";

/** Dica do que fazer pelo texto do erro. */
export function dicaDoErro(msg = "") {
  const m = String(msg);
  if (/permission|permiss|not.*owner|lacks permission|não é dono/i.test(m)) return "Você não tem permissão nessa ficha ou item. Peça ao Mestre para dar a posse (ou faça pelo Mestre).";
  if (/socket|activeGM|Mestre conectado/i.test(m)) return "Essa ação precisa de um Mestre conectado. Tente de novo com o Mestre na sessão.";
  if (/Cannot read propert|undefined|null/i.test(m)) return "Faltou algum dado. Feche e abra a ficha (ou aperte F5). Se repetir, copie o erro e mande.";
  if (/Roll|formula|fórmula|dice/i.test(m)) return "Uma fórmula de dados está inválida. Confira os campos de dano, cura ou bônus.";
  if (/fetch|network|Failed to load/i.test(m)) return "Um arquivo não carregou. Recarregue a página (F5).";
  return "Recarregue a ficha (feche e abra). Se continuar, copie o erro no chat e mande para quem cuida do módulo.";
}

const vistos = new Map();
export function avisarErro(erro, contexto = "") {
  try {
    if (!game.settings.get(MODULE_ID, "errosAmigaveis")) return;
  } catch { /* sem a opção */ }
  const texto = String(erro?.message ?? erro ?? "erro");
  const pilha = String(erro?.stack ?? texto);
  const chave = texto.slice(0, 120);
  const agora = Date.now();
  if (agora - (vistos.get(chave) ?? 0) < 20000) return;
  vistos.set(chave, agora);
  const dica = dicaDoErro(texto);
  ui.notifications?.error(`Ficha EPM: algo deu errado${contexto ? ` (${contexto})` : ""}. ${dica}`, { permanent: false });
  const versao = game.modules?.get(MODULE_ID)?.version ?? "";
  ChatMessage.create({
    whisper: [game.user.id],
    content: `<div class="epm-chat epm-chat-nota epm-erro-cartao" style="--cor:#D2544A"><p><strong><i class="fa-solid fa-triangle-exclamation"></i> Erro na ficha EPM</strong>${contexto ? ` (${escapar(contexto)})` : ""}</p>
      <p>${escapar(dica)}</p>
      <details><summary>Detalhes</summary><pre class="epm-erro-pilha">${escapar(`EPM ${versao}\n${pilha}`).slice(0, 4000)}</pre></details>
      <button type="button" class="epm-botao" data-epm-copiar-erro><i class="fa-solid fa-copy"></i> Copiar o erro</button></div>`,
    flags: { [FLAG]: { erro: true } }
  }).catch(() => null);
}

export function registrarErrosAmigaveis() {
  const doModulo = e => /epm-ficha/.test(String(e?.stack ?? e?.filename ?? ""));
  window.addEventListener("unhandledrejection", ev => { if (doModulo(ev.reason)) avisarErro(ev.reason); });
  window.addEventListener("error", ev => { if (doModulo(ev.error ?? ev)) avisarErro(ev.error ?? ev.message); });
  // Botão "Copiar o erro" do cartão
  document.addEventListener("click", ev => {
    const b = ev.target?.closest?.("[data-epm-copiar-erro]");
    if (!b) return;
    const pre = b.closest(".epm-erro-cartao")?.querySelector(".epm-erro-pilha");
    const txt = pre?.textContent ?? "";
    (navigator.clipboard?.writeText(txt) ?? Promise.reject()).then(() => ui.notifications.info("Erro copiado. É só colar na mensagem."), () => ui.notifications.warn("Não consegui copiar; abra Detalhes e copie à mão."));
  });
}

/** Barra de Vida nos tokens novos (opção do mundo). */
export function registrarBarraToken() {
  Hooks.on("preCreateActor", (actor, dados) => {
    let modo = "nao";
    try { modo = game.settings.get(MODULE_ID, "barraToken"); } catch { return; }
    if (modo === "nao") return;
    const M = CONST.TOKEN_DISPLAY_MODES ?? {};
    const display = modo === "todos" ? M.ALWAYS : modo === "sempre" ? M.OWNER : M.OWNER_HOVER;
    actor.updateSource({ "prototypeToken.displayBars": display, "prototypeToken.bar1.attribute": "attributes.hp" });
  });
}
