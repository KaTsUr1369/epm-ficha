/**
 * Manual EPM (0.8.23): o diário "Manual da Ficha EPM" no compêndio "EPM · Manual", com as abas Começando,
 * Guia do jogador, Guia do Mestre, Regras rápidas e Patch notes (resumo de cada versão, lido do README).
 * Só dados e contas puras aqui; quem grava é conteudo-epm.mjs.
 */

const p = t => `<p>${t}</p>`;
const ul = itens => `<ul>${itens.map(i => `<li>${i}</li>`).join("")}</ul>`;
const h = (n, t) => `<h${n}>${t}</h${n}>`;

export const PAGINAS_MANUAL = [
  {
    nome: "Começando",
    html: [
      p("A ficha <strong>Escolhidos pelo Multiverso</strong> troca a ficha do D&D 5e pela ficha do EPM: atributos, perícias, recursos, arquétipo, classe, treinos, itens e tudo o que a mesa usa. Os dados ficam na própria ficha; a Vida usa a barra do token do Foundry."),
      h(2, "Primeiros passos"),
      ul([
        "<strong>Abrir a ficha:</strong> clique duas vezes no personagem na aba Atores.",
        "<strong>Modo edição:</strong> o botão de lápis no topo libera os campos (atributos, pontos de perícia, criar itens, reordenar abas). Fora dele a ficha fica limpa para jogar.",
        "<strong>Abas:</strong> ficam à esquerda. No modo edição dá para arrastar e mudar a ordem.",
        "<strong>Buscar na ficha inteira:</strong> o campo embaixo das abas acha perícia, item, habilidade, magia, treino, receita ou relação; clique no resultado e a ficha vai até ele.",
        "<strong>Atalhos:</strong> arraste o botão de uma perícia, de um ataque ou de uma habilidade para a barra de macros.",
        "<strong>Caixas de texto:</strong> salvam sozinhas enquanto você escreve."
      ]),
      h(2, "Onde está cada coisa"),
      ul([
        "<strong>Principal:</strong> atributos, perícias, recursos (Vida, Mana, Estamina, Sanidade), CA, defesas e deslocamento.",
        "<strong>Combate:</strong> ataques, defesas, ações do turno e botões rápidos.",
        "<strong>Inventário:</strong> itens por categoria e raridade, mochilas, moedas e peso.",
        "<strong>Habilidades, Arquétipo e Magias:</strong> poderes, a árvore do arquétipo, a classe e o grimório.",
        "<strong>Treinamentos:</strong> treinos (inclusive os antigos talentos), Oficina e criações.",
        "<strong>Sobre, Anotações, Relações, Bênçãos, Companheiros, Bestiário, Produção:</strong> a história, o diário de sessões, as pessoas e o resto da vida do personagem."
      ])
    ].join("")
  },
  {
    nome: "Guia do jogador",
    html: [
      h(2, "Rolar e atacar"),
      ul([
        "<strong>Perícia:</strong> clique no d20 da perícia. Shift dá vantagem; Ctrl dá desvantagem.",
        "<strong>Ataque:</strong> botão Atacar na arma (Inventário ou Combate). O diálogo deixa escolher vantagem, bônus, Ataque Extra e opções do arquétipo; o cartão mostra acerto, dano e crítico.",
        "<strong>Defesa:</strong> ao ser atacado, o cartão traz Esquiva (Reflexos), Bloqueio (Fortitude) e Contra-ataque (Luta).",
        "<strong>Habilidade ou magia:</strong> botão Usar. O custo (PM, PE, PS ou Vida) sai sozinho."
      ]),
      h(2, "Recursos e descanso"),
      ul([
        "Vida, Mana, Estamina e Sanidade ficam no topo da aba Principal. Os máximos são calculados pela raça, atributos e níveis.",
        "Descanso curto e longo ficam na aba Principal; o Pular tempo (relógio) faz o tempo passar para treinos, criações, produções e melhorias."
      ]),
      h(2, "Treinos, criações e produção"),
      ul([
        "<strong>Treinamentos:</strong> escolha no catálogo, pague os PT e treine as horas (até 8 h por dia, divididas com criações e melhorias).",
        "<strong>Oficina:</strong> crie itens com materiais e teste no fim.",
        "<strong>Produção:</strong> receitas de Forja, Alquimia, Ritual e Encantamento (4 h por profissão, um teste por profissão no fim)."
      ]),
      h(2, "Melhorias de itens"),
      ul([
        "No editor do item (lápis no item), seção <strong>Melhorias</strong>: Modificações 3, Encantamentos 2 (3 com o Pergaminho), Maldições 3 e Bênçãos 2.",
        "<strong>Adicionar:</strong> escolha na lista. Para <strong>fazer</strong>, escolha seu Ofício e o atributo; são 3 etapas, cada uma com um teste. Para <strong>comprar</strong>, paga com as moedas da ficha.",
        "Pré-requisitos e efeitos automáticos aparecem no próprio item; uma melhoria desligada mostra o motivo.",
        "<strong>Nome do item (Nomeação):</strong> dá um nome próprio ao item."
      ]),
      h(2, "Mochilas compartilhadas"),
      p("No editor da mochila, marque com quem ela é compartilhada. Os outros veem o conteúdo no Inventário e podem pegar ou guardar itens (botão ou arrastando)."),
      h(2, "Se algo der errado"),
      p("Aparece um aviso dizendo o que fazer e um cartão no chat (só para você) com o botão <strong>Copiar o erro</strong>. Cole o erro na mensagem para quem cuida do módulo.")
    ].join("")
  },
  {
    nome: "Guia do Mestre",
    html: [
      h(2, "Escudo do Mestre"),
      ul([
        "Abra pela aba Atores ou pelo Carousel Combat Tracker. Tem grupo, condições, itens para dar, códigos, relógios, enquetes, testes e as regras opcionais.",
        "Solte uma ficha no Escudo para pôr no grupo; solte um item para dar a quem está em \"Dar para\" (ou às fichas marcadas).",
        "<strong>Pular tempo (grupo):</strong> avança o relógio do mundo (e o Simple Calendar) e o tempo das fichas marcadas."
      ]),
      h(2, "NPCs"),
      ul([
        "<strong>NPC rápido</strong> (aba Atores ou Escudo): tipo de ficha, força da criatura, nível, natureza, foco, tamanho, disposição e se é inteligente. A ficha já nasce com atributos, Vida, CA, acerto, CD e um ataque.",
        "<strong>Preencher pelo nível</strong> (aba Mestre da ficha do NPC): ajusta CA, acerto, CD e Vida pela tabela de inimigos.",
        "O compêndio <strong>EPM · NPCs modelo</strong> tem criaturas prontas por região."
      ]),
      h(2, "Itens e tesouros"),
      ul([
        "Compêndios <strong>EPM · Itens</strong> (catálogo), <strong>EPM · Tabelas de loot</strong> (por região e faixa de nível) e <strong>EPM · Melhorias</strong> (arraste uma melhoria para o editor de um item).",
        "Maldições e Bênçãos de item só o Mestre adiciona. Feitos exigidos por uma melhoria o Mestre marca no item.",
        "Com o Item Piles, lojas e baús usam as moedas EPM."
      ]),
      h(2, "Regras opcionais"),
      p("No Escudo → Ajustes: falha crítica com tabela, chefes com fases, aura de horror, âncoras, traumas, domínio de arma, feitos, purificação, acúmulos, atividades de descanso, Teto de Bônus, Títulos de itens e durabilidade."),
      h(2, "Configurações do módulo"),
      ul(["Barra de Vida nos tokens novos (opcional).", "Avisos de erro da ficha.", "Item Piles com as moedas EPM.", "Números das regras (Ajustar bônus) por mundo e por ficha."])
    ].join("")
  },
  {
    nome: "Regras rápidas",
    html: [
      h(2, "Testes"),
      ul([
        "Teste = 1d20 + perícia (pontos + atributos somados + outros) contra a DT.",
        "CD das habilidades = 10 + Núcleo + Arcanismo (dá para trocar o atributo e a perícia na ficha).",
        "Crítico padrão: 20/×2; a margem e o multiplicador mudam com arma, arquétipo, classe e melhorias.",
        "Teto de Bônus das habilidades num mesmo teste: +5 (Nv. 1–10), +8 (11–30), +12 (31–50), +15 (51+). Itens, Bênçãos e Maldições ficam fora."
      ]),
      h(2, "Produção (Ofícios)"),
      ul([
        "Dificuldade Baixa CD 15, Média CD 25, Superior CD 35.",
        "4 horas por profissão. Precisa da receita, dos ingredientes e das ferramentas. O teste é no fim.",
        "Falha: perde os materiais. Falha crítica: perde os materiais e pode haver acidente ou produto defeituoso.",
        "Forja: +3 Pontos de Estrutura no equipamento (cada ponto segura uma perda de durabilidade)."
      ]),
      h(2, "Melhorias de itens"),
      ul([
        "Fazer: Modificação DT 35/50/70 (8 h); Encantamento DT 30/45/70 (24 h); 3 etapas, cada uma com teste.",
        "Comprar: Modificação 200/800/3.000 PO; Encantamento 1.000/4.000 PO (o 3º pede o Pergaminho, à parte); loja de armas +50%; consumíveis e munição 1/5 por lote.",
        "Material Especial ocupa 1 vaga de Modificação. Trocar: preço do novo − metade do anterior."
      ]),
      h(2, "Tempo"),
      ul(["Treino, criação e melhorias dividem 8 h por dia.", "6 h de treino = 5 PT."])
    ].join("")
  }
];

const inline = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>");

/**
 * Patch notes resumidas: cada "## Novidades da X" do README, só com o primeiro nível de cada lista
 * (o resumo; os detalhes ficam no README). Mais nova primeiro.
 */
export function patchNotesHtml(readme, { max = 30 } = {}) {
  const partes = String(readme ?? "").split(/^## Novidades da /m).slice(1, max + 1);
  if (!partes.length) return "<p>Sem patch notes.</p>";
  return partes.map(bloco => {
    const [versao, ...resto] = bloco.split("\n");
    // Primeiro nível; quando o item só abre uma sublista ("Melhorias:"), junta os títulos dos filhos
    const lis = [];
    for (const l of resto) {
      if (/^- /.test(l)) lis.push({ texto: l.slice(2), filhos: [] });
      else if (/^\s{2,}- /.test(l) && lis.length) {
        const t = l.trim().slice(2);
        const rot = t.match(/^\*\*(.+?)\*\*/)?.[1] ?? t.split(/[.:]/)[0];
        lis.at(-1).filhos.push(rot.replace(/:$/, ""));
      }
    }
    const itens = lis.map(x => {
      const soTitulo = /:\**\s*$/.test(x.texto.trim()) || /\*\*$/.test(x.texto.trim());
      return `<li>${inline(x.texto)}${soTitulo && x.filhos.length ? ` ${inline(x.filhos.join("; "))}.` : ""}</li>`;
    }).join("");
    return `<h2>Versão ${inline(versao.trim())}</h2>${itens ? `<ul>${itens}</ul>` : ""}`;
  }).join("");
}
