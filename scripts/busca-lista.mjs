/**
 * Barra de pesquisa das listas longas da ficha (perícias, treinamentos, magias, habilidades, inventário…).
 * Filtra na hora, sem redesenhar; o termo fica guardado por lista e volta depois de cada render.
 *
 * Marcação: <input type="search" data-busca-lista="chave">, dentro da aba. A chave diz o que filtrar (LISTAS).
 * Cada item usa data-busca (texto já normalizado, com a descrição) ou, sem ele, o próprio texto visível.
 */
import { normalizarTexto } from "./data.mjs";

/** itens: o que some; grupos: some quando fica sem item (de dentro para fora); subabas: mostra todas ao buscar. */
export const LISTAS = {
  pericias: { itens: ".epm-lista-pericias > li", grupos: [".epm-painel.epm-pericias"] },
  treinos: { itens: ".epm-treino", grupos: [".epm-treino-divisao", ".epm-treino-grupo"], abrir: ".epm-treino-divisao" },
  magias: { itens: "li.epm-poder", grupos: [".epm-circulo"], subabas: true },
  habilidades: { itens: "li.epm-poder", grupos: [".epm-secao-poder", ".epm-arq-painel", ".epm-classe-painel", ".epm-transformacoes", ".epm-subaba-habilidades"], subabas: true },
  arqclasse: { itens: "li.epm-poder", grupos: [".epm-secao-poder", ".epm-subaba-arqclasse > .epm-painel", ".epm-subaba-arqclasse"], subabas: true },
  inventario: { itens: "li.epm-item, .epm-mochila", grupos: [".epm-grupo-raridade", ".epm-categoria", ".epm-mochilas-area"] },
  receitas: { itens: ".epm-receita, .epm-producao-linha", grupos: [".epm-producoes"] },
  relacoes: { itens: ".epm-relacao, .epm-faccao", grupos: [".epm-pasta-relacao", ".epm-faccoes"] },
  diario: { itens: ".epm-sessao", grupos: [] }
};

/** Texto de busca de um item: o data-busca dele ou o que aparece na tela. */
export function textoDoItem(el) {
  return normalizarTexto(`${el.dataset?.busca ?? ""} ${el.textContent ?? ""}`).replace(/\s+/g, " ");
}

/** Termo casa com o texto: todas as palavras precisam aparecer (em qualquer ordem). */
export function casa(texto, termo) {
  const palavras = normalizarTexto(termo).split(/\s+/).filter(Boolean);
  return !palavras.length || palavras.every(p => texto.includes(p));
}

/** Filtra a lista de um campo de busca. Devolve quantos itens ficaram à vista. */
export function filtrarLista(input) {
  const chave = input?.dataset?.buscaLista;
  const cfg = LISTAS[chave];
  if (!cfg) return 0;
  const escopo = input.closest("[data-busca-escopo]") ?? input.closest(".tab.epm-aba") ?? input.closest("form, .window-content");
  if (!escopo) return 0;
  const termo = input.value ?? "";
  const ativo = !!normalizarTexto(termo);
  escopo.classList.toggle("epm-buscando", ativo);
  let visiveis = 0;
  const itens = [...escopo.querySelectorAll(cfg.itens)].filter(el => !el.closest(".epm-busca-ignorar"));
  for (const el of itens) {
    const ok = !ativo || casa(textoDoItem(el), termo);
    el.classList.toggle("epm-busca-oculto", !ok);
    if (ok) visiveis++;
  }
  // Grupo sem nada à vista some (a mochila casa também pelos itens guardados nela)
  for (const g of cfg.grupos) {
    for (const el of escopo.querySelectorAll(g)) {
      if (el.contains(input)) continue;
      const tem = !ativo || [...el.querySelectorAll(cfg.itens)].some(i => !i.classList.contains("epm-busca-oculto"));
      el.classList.toggle("epm-busca-oculto", !tem);
      if (ativo && tem && cfg.abrir && el.matches(cfg.abrir) && "open" in el) el.open = true;
    }
  }
  const vazio = escopo.querySelector(`.epm-busca-vazia[data-busca-de="${chave}"]`);
  if (vazio) vazio.hidden = !ativo || visiveis > 0;
  const qtd = input.closest(".epm-busca")?.querySelector("[data-busca-qtd]");
  if (qtd) qtd.textContent = ativo ? `${visiveis} ${visiveis === 1 ? "resultado" : "resultados"}` : "";
  return visiveis;
}

/** Liga os campos de busca da ficha e reaplica os termos guardados (chamar no _onRender). */
export function ligarBuscas(raiz, termos) {
  if (!raiz) return;
  for (const input of raiz.querySelectorAll("input[data-busca-lista]")) {
    const chave = input.dataset.buscaLista;
    if (termos[chave] && input.value !== termos[chave]) input.value = termos[chave];
    if (input.dataset.buscaLigada) { filtrarLista(input); continue; }
    input.dataset.buscaLigada = "1";
    input.addEventListener("input", ev => { ev.stopPropagation(); termos[chave] = input.value; filtrarLista(input); });
    input.addEventListener("change", ev => ev.stopPropagation());
    input.addEventListener("keydown", ev => {
      if (ev.key === "Enter") { ev.preventDefault(); ev.stopPropagation(); }
      if (ev.key === "Escape" && input.value) { ev.preventDefault(); ev.stopPropagation(); input.value = ""; termos[chave] = ""; filtrarLista(input); }
    });
    if (input.value) filtrarLista(input);
  }
}
