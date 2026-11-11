/**
 * Arquétipos modelo 0.5 (Combatente, Conjurador e Artífice), dos PDFs revisados.
 * Só dados e contas puras (sem Foundry): a ficha usa para a progressão, os custos e as automações.
 * Ainda vai mudar: para atualizar um número, edite só este arquivo.
 *
 * Nomes de atributo dos PDFs → atributos da ficha: Intelecto = Inteligência, Espírito = Núcleo, Vigor = Constituição.
 */

const INT = "inteligencia";

/** Progressão compacta (nível 1 a 50) a partir do texto "1 X • 2 Y + Z …". */
function progressao(texto) {
  const out = {};
  for (const parte of texto.split("•")) {
    const m = parte.trim().match(/^(\d+)\s+(.+)$/);
    if (m) out[Number(m[1])] = m[2].trim().replace(/\.$/, "");
  }
  return out;
}

export const ARQUETIPOS = {
  combatente: {
    id: "combatente", nome: "Combatente", icone: "fa-solid fa-shield-halved", cor: "#D9775A",
    funcao: "Transforma PE em desempenho físico, ataques adicionais, precisão, proteção e feitos lendários. Continua podendo usar magia normalmente.",
    recursos: "PE Máximo = PE de Raça + PE de Classe + Constituição (Vigor).",
    progressao: progressao(`1 Arma Favorita • 2 AS • 3 Classe • 4 AS + Ataque Extra • 5 Estilo + Perícia • 6 AS + Classe • 7 Reflexos • 8 AS • 9 Classe • 10 AS + Ataque Extra 2.0 + Perícia • 11 Arma Favorita 2.0 • 12 AS + Classe • 13 Movimento Cauteloso • 14 AS • 15 Classe + Perícia • 16 AS • 17 Caçador Natural • 18 AS + Classe • 19 Ataque Extra 3.0 • 20 AS + Perícias • 21 Classe + Arma Favorita 3.0 • 22 AS • 23 Especialista em Campo • 24 AS + Classe • 25 Estilo 2.0 + Perícia • 26 AS • 27 Classe • 28 AS • 29 Ataque Extra 4.0 • 30 AS + Classe + Perícia • 31 Arma Favorita 4.0 • 32 AS • 33 Classe • 34 AS • 35 Perícia • 36 AS + Classe • 37 Ataque Extra 5.0 • 38 AS • 39 Classe • 40 AS + Herói + Perícia • 41 Arma Favorita 5.0 • 42 AS + Classe • 43 Especialista 2.0 • 44 AS • 45 Classe + Perícia • 46 AS • 47 Ataque Extra 6.0 • 48 AS + Classe • 49 Estilo 3.0 • 50 AS x2 + Perícia + Ímpeto Lendário`),
    habilidades: [
      { nivel: 1, nome: "Arma Favorita", resumo: "Escolha uma arma e uma Maestria. Os custos e efeitos crescem nos níveis 1, 11, 21, 31 e 41." },
      { nivel: 4, nome: "Ataque Extra", resumo: "Ao usar a Ação de Ataque, gaste 5 PE para +1 ataque. Só pode ativar uma vez por turno." },
      { nivel: 5, nome: "Estilo de Combate", resumo: "Escolha um estilo: Duelista, Atirador, Arma Dupla, Combate Defensivo, Arma Pesada, Arma Leve, Bêbado ou Armamento Longo." },
      { nivel: 7, nome: "Reflexos de Combate", resumo: "+5 em Testes de Resistência de Destreza." },
      { nivel: 10, nome: "Ataque Extra 2.0", resumo: "10 PE por +2 ataques." },
      { nivel: 11, nome: "Arma Favorita 2.0", resumo: "A Maestria evolui para a etapa 2." },
      { nivel: 13, nome: "Movimento Cauteloso", resumo: "Vantagem em testes de resistência contra armadilhas." },
      { nivel: 17, nome: "Caçador Natural", resumo: "20 PE ao entrar em combate: escolha uma Presa perceptível. Contra ela: +5 Acerto, +1 dado de dano, ignora Resistência ou reduz Imunidade a Resistência, +2 Esquiva, +2 Defesa e +1 CA. Dura até o fim do combate; quando a Presa chega a 0 PV, transfira por 8 PE." },
      { nivel: 19, nome: "Ataque Extra 3.0", resumo: "15 PE por +3 ataques." },
      { nivel: 21, nome: "Arma Favorita 3.0", resumo: "A Maestria evolui para a etapa 3." },
      { nivel: 23, nome: "Especialista em Campo", resumo: "Ignora 1 ponto de Exaustão em combate. Uma vez por rodada, 20 PE concede 1 ação adicional a um aliado perceptível." },
      { nivel: 25, nome: "Estilo de Combate 2.0", resumo: "Escolha um segundo estilo." },
      { nivel: 29, nome: "Ataque Extra 4.0", resumo: "20 PE por +4 ataques." },
      { nivel: 31, nome: "Arma Favorita 4.0", resumo: "A Maestria chega à etapa 4." },
      { nivel: 37, nome: "Ataque Extra 5.0", resumo: "25 PE por +5 ataques." },
      { nivel: 40, nome: "Herói", resumo: "Uma vez por rodada, 25 PE transforma uma ação em Ação Lendária imediata: Atacar, Mover, usar habilidade de Combatente ou proteger aliado ao alcance. Com metade dos PV ou menos, realiza saltos extraordinários conforme a capacidade física e o cenário." },
      { nivel: 41, nome: "Arma Favorita 5.0", resumo: "A Maestria alcança a evolução máxima." },
      { nivel: 43, nome: "Especialista em Campo 2.0", resumo: "Por 35 PE, um aliado recebe 2 ações adicionais. Ao reduzir pessoalmente um inimigo a 0 PV, recupera 5 PE uma vez por rodada." },
      { nivel: 47, nome: "Ataque Extra 6.0", resumo: "30 PE por +6 ataques." },
      { nivel: 49, nome: "Estilo de Combate 3.0", resumo: "Escolha um terceiro estilo." },
      { nivel: 50, nome: "Ímpeto Lendário", resumo: "40 PE; 3 rodadas; 1 vez por cena. Ataque Extra custa 10 PE a menos (mín. 5); +5 Acerto, +3 Defesa e +3 Esquiva. Uma vez por rodada, ao sofrer dano, avança até seu deslocamento em direção ao atacante e ataca se chegar ao alcance. Consciente, efeitos físicos comuns não impedem seu movimento." }
    ],
    ataqueExtra: [
      { nivel: 4, custo: 5, ataques: 1 }, { nivel: 10, custo: 10, ataques: 2 }, { nivel: 19, custo: 15, ataques: 3 },
      { nivel: 29, custo: 20, ataques: 4 }, { nivel: 37, custo: 25, ataques: 5 }, { nivel: 47, custo: 30, ataques: 6 }
    ],
    /** Níveis em que a Maestria muda de etapa (etapa 1 a 5). */
    etapas: [1, 11, 21, 31, 41],
    maestrias: {
      destrutivo: { nome: "Ataque Destrutivo", quando: "acerto", custos: [3, 5, 7, 9, 12], dano: [5, 10, 15, 20, 25],
        texto: "Ao acertar, gaste PE para causar dano adicional." },
      alongado: { nome: "Acerto Alongado", quando: "erro", custos: [4, 6, 8, 10, 12], dano: [5, 10, 15, 20, 25],
        texto: "Ao errar, gaste PE para ainda causar dano; não conta como acerto nem ativa efeitos que exigem acerto." },
      longa: { nome: "Arma Longa", quando: "antes", custos: [5, 5, 5, 5, 5], alcance: [1.5, 3, 4.5, 6, 9],
        texto: "Antes de atacar, gaste 5 PE para aumentar o alcance." },
      certeiro: { nome: "Ataque Certeiro", quando: "antes", custos: [3, 5, 7, 9, 12], acerto: [2, 4, 6, 8, 10],
        texto: "Antes do ataque, gaste PE para ganhar Acerto." },
      protetora: { nome: "Arma Protetora", quando: "sempre", ca: [1, 2, 3, 4, 5],
        texto: "Enquanto segura (equipa) a arma, ganha CA." },
      leve: { nome: "Arma Leve", quando: "sempre",
        texto: "Mantém a redução de categoria de peso. No Nv. 11, pode usar Destreza com a arma. No Nv. 31, se a arma já usa Destreza naturalmente, recebe +3 de dano." },
      gemea: { nome: "Gêmea", quando: "antes", niveis: [{ nivel: 1, custo: 8, ataques: 1 }, { nivel: 21, custo: 14, ataques: 2 }, { nivel: 41, custo: 22, ataques: 3 }],
        texto: "Duas armas iguais compartilham Maestria. Uma vez por turno, após atacar com uma, pode atacar com a outra." },
      perigosa: { nome: "Arma Perigosa", quando: "sempre", margem: [{ nivel: 1, valor: 1 }, { nivel: 21, valor: 2 }, { nivel: 41, valor: 3 }],
        mult: [{ nivel: 11, valor: 3 }, { nivel: 41, valor: 4 }],
        texto: "Margem de crítico +1 (+2 no Nv. 21, +3 no Nv. 41). Multiplicador do crítico ×3 no Nv. 11 e ×4 no Nv. 41." }
    },
    /** Estilos de Combate (1 no Nv. 5, 2 no Nv. 25, 3 no Nv. 49). */
    estilosPorNivel: [{ nivel: 5, qtd: 1 }, { nivel: 25, qtd: 2 }, { nivel: 49, qtd: 3 }],
    estilos: {
      duelista:  { nome: "Duelista",  texto: "+3 Acerto contra um único inimigo isolado.", acertoIsolado: 3 },
      atirador:  { nome: "Atirador",  texto: "Pode abrir mão do modificador de dano da arma para reduzir a margem de crítico em 2.", margem: 2 },
      dupla:     { nome: "Arma Dupla", texto: "Usando duas armas, +2 Acerto e +1 CA.", acerto: 2, ca: 1 },
      defensivo: { nome: "Combate Defensivo", texto: "Mantém o efeito original." },
      pesada:    { nome: "Arma Pesada", texto: "Mantém o efeito original." },
      leve:      { nome: "Arma Leve", texto: "Mantém o efeito original." },
      bebado:    { nome: "Bêbado", texto: "Mantém o efeito original." },
      longo:     { nome: "Armamento Longo", texto: "Mantém o efeito original." }
    },
    cacador: { nivel: 17, custo: 20, acerto: 5, transferir: 8 }
  },

  conjurador: {
    id: "conjurador", nome: "Conjurador", icone: "fa-solid fa-hat-wizard", cor: "#8A7CE0",
    funcao: "Domina a mana, amplia a conjuração e modifica magias usando PE. O arquétipo libera círculos; a quantidade de magias conhecidas depende principalmente da Classe.",
    recursos: "PE Máximo = PE de Raça + PE de Classe + Constituição (Vigor). PM Máximo = PM de Raça + PM de Classe + Núcleo (Espírito).",
    progressao: progressao(`1 Despertar • 2 Magia 1 • 3 Classe • 4 Evolução • 5 Manipulação • 6 Classe • 7 Olhar de Mana • 8 Evolução • 9 Classe • 10 Magia 2 • 11 Recuperar Mana • 12 Classe + Evolução • 13 Conjuração Precisa • 14 Canalização • 15 Classe • 16 Evolução • 17 Conjuração Dupla • 18 Classe • 19 Reserva Arcana • 20 Evolução • 21 Classe • 22 Recuperar Mana 2.0 • 23 Conjuração Reativa • 24 Classe + Evolução • 25 Sustentação • 26 Magia 3 • 27 Classe • 28 Evolução • 29 Reserva Arcana 2.0 • 30 Classe • 31 Manipulação 2.0 • 32 Evolução • 33 Classe • 34 Magia 4 • 35 Recuperar Mana 3.0 • 36 Classe + Evolução • 37 Sobrecarga • 38 Domínio • 39 Classe • 40 Evolução • 41 Reserva Arcana 3.0 • 42 Classe • 43 Magia 5 • 44 Evolução • 45 Classe • 46 Corpo de Mana • 47 Recuperar Mana 4.0 • 48 Classe + Evolução • 49 Magia 6 • 50 Zona de Mana`),
    habilidades: [
      { nivel: 1, nome: "Despertar Mágico", resumo: "Pode conjurar Truques, detectar magia e perceber a Aura de criaturas, objetos e fenômenos mágicos. Começa com 2 Truques; magias adicionais dependem da Classe." },
      { nivel: 2, nome: "Magia 1", resumo: "Desbloqueia magias de 1º círculo e aprende +1 Truque." },
      { nivel: 5, nome: "Manipulação Mágica", resumo: "Ao conjurar, gaste 5 PE para escolher uma modificação: aumentar alcance; aumentar área em uma categoria; conjurar sem movimentos; ou excluir até 2 criaturas da área. Uma vez por magia." },
      { nivel: 7, nome: "Olhar de Mana", resumo: "Percebe natureza, intensidade, elemento predominante e magias ativas de alvos, objetos e fenômenos mágicos." },
      { nivel: 10, nome: "Magia 2", resumo: "Desbloqueia magias de 2º círculo." },
      { nivel: 11, nome: "Recuperar Mana", resumo: "Uma vez por cena, use uma ação e gaste 10 PE para recuperar 10 PM." },
      { nivel: 13, nome: "Conjuração Precisa", resumo: "Manipulação Mágica pode excluir até 4 criaturas de magias em área." },
      { nivel: 14, nome: "Canalização", resumo: "Use uma ação para canalizar; gaste 8 PE e escolha +1 dado de dano, +1 dado de cura, aumentar a duração ou aumentar o alcance em uma categoria. Conjure até o fim do próximo turno." },
      { nivel: 17, nome: "Conjuração Dupla", resumo: "Ao conjurar um Truque, gaste 10 PE para conjurar outro Truque na mesma ação. Uma vez por rodada." },
      { nivel: 19, nome: "Reserva Arcana", resumo: "+10 PM Máximo." },
      { nivel: 22, nome: "Recuperar Mana 2.0", resumo: "Recuperar Mana restaura 18 PM por 12 PE." },
      { nivel: 23, nome: "Conjuração Reativa", resumo: "Gaste 10 PE para conjurar um Truque como reação a uma ação que ele possa afetar diretamente. Uma vez por rodada." },
      { nivel: 25, nome: "Sustentação Mágica", resumo: "Gaste 8 PE quando a concentração ou sustentação seria interrompida para mantê-la automaticamente." },
      { nivel: 26, nome: "Magia 3", resumo: "Desbloqueia magias de 3º círculo." },
      { nivel: 29, nome: "Reserva Arcana 2.0", resumo: "O bônus de Reserva Arcana aumenta para +25 PM Máximo." },
      { nivel: 31, nome: "Manipulação Mágica 2.0", resumo: "Pode aplicar 2 modificações ao mesmo tempo por 10 PE." },
      { nivel: 34, nome: "Magia 4", resumo: "Desbloqueia magias de 4º círculo." },
      { nivel: 35, nome: "Recuperar Mana 3.0", resumo: "Recupera 25 PM por 15 PE." },
      { nivel: 37, nome: "Sobrecarga Mágica", resumo: "Uma vez por magia: 12 PE por +1 dado de dano ou cura; 20 PE por +2 dados; 30 PE por +3 dados." },
      { nivel: 38, nome: "Domínio de Conjuração", resumo: "Escolha uma especialização permanente: Alcance (categoria extra de alcance); Área (categoria extra de área); Controle (exclui +2 alvos de áreas); Sustentação (mantém mais uma magia ao mesmo tempo)." },
      { nivel: 41, nome: "Reserva Arcana 3.0", resumo: "O bônus de Reserva Arcana aumenta para +45 PM Máximo." },
      { nivel: 43, nome: "Magia 5", resumo: "Desbloqueia magias de 5º círculo." },
      { nivel: 46, nome: "Corpo de Mana", resumo: "Gaste 10 PM por rodada para mover-se livremente no ar e andar por paredes e tetos." },
      { nivel: 47, nome: "Recuperar Mana 4.0", resumo: "Recupera 35 PM por 20 PE." },
      { nivel: 49, nome: "Magia 6", resumo: "Desbloqueia magias de 6º círculo." },
      { nivel: 50, nome: "Zona de Mana", resumo: "Ativação: 40 PM + 25 PE. Cria uma grande zona ao redor. Enquanto ativa, move-se no ar, nas paredes, no teto ou no chão; magias podem surgir de qualquer ponto da zona, que também serve como origem; percebe manifestações de mana e o ambiente assume traços da sua magia." }
    ],
    /** Custo em PM por círculo (0 = Truque). */
    custosMagia: [0, 6, 10, 14, 18, 24, 32],
    /** Nível de Conjurador que libera cada círculo. */
    circulos: { 0: 1, 1: 2, 2: 10, 3: 26, 4: 34, 5: 43, 6: 49 },
    truques: [{ nivel: 1, qtd: 2 }, { nivel: 2, qtd: 3 }],
    reservaArcana: [{ nivel: 19, pm: 10 }, { nivel: 29, pm: 25 }, { nivel: 41, pm: 45 }],
    recuperarMana: [{ nivel: 11, pe: 10, pm: 10 }, { nivel: 22, pe: 12, pm: 18 }, { nivel: 35, pe: 15, pm: 25 }, { nivel: 47, pe: 20, pm: 35 }],
    manipulacao: {
      nivel: 5, custo: 5, custoDupla: 10, nivelDupla: 31, nivelPrecisa: 13,
      opcoes: ["Aumentar o alcance", "Aumentar a área em uma categoria", "Conjurar sem movimentos", "Excluir criaturas da área"]
    },
    sobrecarga: { nivel: 37, opcoes: [{ pe: 12, dados: 1 }, { pe: 20, dados: 2 }, { pe: 30, dados: 3 }] },
    dominios: { alcance: "Alcance: categoria extra de alcance", area: "Área: categoria extra de área", controle: "Controle: exclui +2 alvos de áreas", sustentacao: "Sustentação: mantém mais uma magia ao mesmo tempo" }
  },

  artifice: {
    id: "artifice", nome: "Artífice", icone: "fa-solid fa-screwdriver-wrench", cor: "#C9A24E",
    funcao: "Cria projetos, ferramentas, encantamentos, modificações e autômatos. Combina preparação, utilidade e apoio, com efeitos que crescem com o nível.",
    recursos: "Subclasses: Alquimista, Curandeiro, Mecânico de Guerra e Armadura Viva (escolhidas nos níveis de Subclasse).",
    progressao: progressao(`1 Criar Projetos • 2 AS • 3 Subclasse + Livro de Projetos • 4 AS • 5 Utensílios + Perícia • 6 AS + Subclasse • 7 Bolsa Automática • 8 AS • 9 Subclasse + Itens Encantados • 10 AS + Livro de Projetos 2.0 + Perícia • 11 Modificações Permanentes • 12 AS + Subclasse • 13 Criar Projetos 2.0 • 14 AS • 15 Subclasse + Perícia • 16 AS • 17 Pequeno Autômato • 18 AS + Subclasse • 19 Corpo Modificado • 20 AS + Livro de Projetos 3.0 + Perícia • 21 Subclasse • 22 AS • 23 Mudança de Planos • 24 AS + Subclasse • 25 Criar Projetos 3.0 + Perícia • 26 AS • 27 Subclasse • 28 AS • 29 Pequeno Autômato 2.0 • 30 AS + Subclasse + Perícia • 31 Roupas Modificadas • 32 AS • 33 Subclasse • 34 AS • 35 Livro de Projetos 4.0 + Perícia • 36 AS + Subclasse • 37 Criar Projetos 4.0 • 38 AS • 39 Subclasse • 40 AS + Perícia • 41 Pequeno Autômato 3.0 • 42 AS + Subclasse • 43 Estudo das Almas • 44 AS • 45 Subclasse + Livro de Projetos 5.0 + Perícia • 46 AS • 47 Criar Projetos 5.0 • 48 AS + Subclasse • 49 Recriando Almas • 50 AS x2 + Perícia`),
    habilidades: [
      { nivel: 1, nome: "Criar Projetos", resumo: "Pode criar 2 projetos por dia; cada um fica pronto após 1 minuto de produção. Ao ser usado, some e volta depois de 1 hora. Soma e Proteção valem por 1 hora. Os projetos do dia terminam ao fim do dia." },
      { nivel: 3, nome: "Livro de Projetos", resumo: "No fim do dia, pode guardar um projeto. Limite: Nv. 3 = Inteligência (mín. 1); Nv. 10 = 5 + Inteligência; Nv. 20 = 8 + Inteligência; Nv. 35 = 10 + Inteligência; Nv. 45 = 15 + Inteligência." },
      { nivel: 5, nome: "Utensílios", resumo: "Escolha 3 perícias, exceto Luta e Pontaria; recebe +2 nos testes delas." },
      { nivel: 7, nome: "Bolsa Automática", resumo: "Pegar ou guardar item na mochila usa Meia Ação (Ação Bônus), em vez de Ação Normal." },
      { nivel: 9, nome: "Itens Encantados", resumo: "Cria itens mágicos que ajudam ou participam dos projetos." },
      { nivel: 11, nome: "Modificações Permanentes", resumo: "Pode instalar partes mecânicas ou robóticas em aliados; escolha um Acerto ou teste para receber +2." },
      { nivel: 13, nome: "Criar Projetos 2.0", resumo: "Projetos sobem para a etapa 2 (2d6 de dano, 2d4 de cura, +2 de soma, +2 de proteção)." },
      { nivel: 17, nome: "Pequeno Autômato", resumo: "Cria um autômato pequeno. Usa Inteligência e Carisma próprios; Núcleo 9, Força 12, Destreza 14, Constituição 18 e recursos de um autômato básico." },
      { nivel: 19, nome: "Corpo Modificado", resumo: "Uma vez por Descanso Longo, pode ter até 2 modificações: vantagem em um Teste de Resistência, uma proficiência que não possuía, +5 Acerto ou +5 Dano. Pode alterar as escolhas no Descanso Longo." },
      { nivel: 23, nome: "Mudança de Planos", resumo: "Ao falhar em um teste, gaste 2 PE para cancelar a ação sem gastar uma ação no turno nem PE extras." },
      { nivel: 25, nome: "Criar Projetos 3.0", resumo: "Projetos sobem para a etapa 3 (3d8 de dano, 3d6 de cura, +3 de soma, +3 de proteção)." },
      { nivel: 29, nome: "Pequeno Autômato 2.0", resumo: "O autômato recebe +3 em todos os atributos e +15 PV, PE e PM." },
      { nivel: 31, nome: "Roupas Modificadas", resumo: "Após Descanso Longo, escolha: +1 Defesa, +1 Esquiva e +1 CA (acumulam com armadura e escudo); ou proficiência em uma perícia, recebendo +5 se já for proficiente. Se perder ou destruir a roupa, pode fabricar outra com os recursos necessários." },
      { nivel: 37, nome: "Criar Projetos 4.0", resumo: "Projetos sobem para a etapa 4 (4d8 de dano, 4d8 de cura, +5 de soma, +4 de proteção)." },
      { nivel: 41, nome: "Pequeno Autômato 3.0", resumo: "O bônus do autômato aumenta para +6 em todos os atributos e +30 PV, PE e PM." },
      { nivel: 43, nome: "Estudo das Almas", resumo: "Recebe +4 em Núcleo ou Inteligência. Pode remover a alma de mortos, incapacitados (0 PV ou 0 PM) ou voluntários. Ao gastar metade de um descanso estudando uma alma, recebe Resistência, +50% de dano e Vantagem em testes contra a mesma espécie, +1 PT e 30 PV temporários. Dura até o próximo descanso ou cair a 0 PV." },
      { nivel: 47, nome: "Criar Projetos 5.0", resumo: "Projetos sobem para a etapa 5 (8d10 de dano, 5d10 de cura, +10 de soma, +5 de proteção)." },
      { nivel: 49, nome: "Recriando Almas", resumo: "Pode recriar uma alma estudada em corpo sem alma (constructo, zumbi, golem etc.). Ou estuda a própria alma durante todo um Descanso Longo para se replicar. Custo: 30 dias e 50 PEv para outra criatura; 45 dias e 80 PEv para si." }
    ],
    /** Criar Projetos: valores por etapa (Inteligência soma em todos, mínimo 1). */
    projetos: [
      { nivel: 1, dano: "1d6", cura: "1d4", soma: 1, protecao: 1 },
      { nivel: 13, dano: "2d6", cura: "2d4", soma: 2, protecao: 2 },
      { nivel: 25, dano: "3d8", cura: "3d6", soma: 3, protecao: 3 },
      { nivel: 37, dano: "4d8", cura: "4d8", soma: 5, protecao: 4 },
      { nivel: 47, dano: "8d10", cura: "5d10", soma: 10, protecao: 5 }
    ],
    projetosPorDia: 2,
    /** Tempos dos projetos (no relógio do mundo, o mesmo do Simple Calendar). */
    tempoProjeto: { producaoMin: 1, voltaHoras: 1, efeitoHoras: 1 },
    livro: [{ nivel: 3, base: 0 }, { nivel: 10, base: 5 }, { nivel: 20, base: 8 }, { nivel: 35, base: 10 }, { nivel: 45, base: 15 }],
    encantados: [
      { nivel: 9, dano: "1d4", danoInt: false, cura: 1, curaInt: false, auxilio: 1, auxilioInt: false },
      { nivel: 13, dano: "1d6", danoInt: true, cura: 2, curaInt: true, auxilio: 1, auxilioInt: true },
      { nivel: 25, dano: "2d6", danoInt: true, cura: 3, curaInt: true, auxilio: 2, auxilioInt: true },
      { nivel: 37, dano: "3d6", danoInt: true, cura: 4, curaInt: true, auxilio: 4, auxilioInt: true },
      { nivel: 47, dano: "4d8", danoInt: true, cura: 5, curaInt: true, auxilio: 5, auxilioInt: true }
    ],
    utensilios: { nivel: 5, qtd: 3, bonus: 2, exceto: ["luta", "pontaria"] },
    automato: {
      nivel: 17,
      atributos: { nucleo: 9, forca: 12, destreza: 14, constituicao: 18 },
      melhorias: [{ nivel: 29, atributos: 3, recursos: 15 }, { nivel: 41, atributos: 6, recursos: 30 }]
    },
    subclasses: ["Alquimista", "Curandeiro", "Mecânico de Guerra", "Armadura Viva"]
  }
};

/* -------------------------------------------- */
/*  Contas                                      */
/* -------------------------------------------- */

const norm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Id do arquétipo modelo pelo nome escrito na ficha ("Artífice", "artifice", "Artificie"…). */
export function idArquetipo(nome) {
  const n = norm(nome);
  if (!n) return null;
  if (n.startsWith("combat")) return "combatente";
  if (n.startsWith("conjur")) return "conjurador";
  if (n.startsWith("artif")) return "artifice";
  return null;
}

/** Arquétipos modelo do personagem, com o nível de cada um (o 1º usa "nivel", o 2º "nivel2"). */
export function arquetiposDoPersonagem(dados = {}) {
  const out = [];
  const um = idArquetipo(dados.arquetipo);
  if (um) out.push({ id: um, nivel: Math.max(0, Math.floor(Number(dados.nivel) || 1)), posicao: 1 });
  const dois = String(dados.arquetipo2 ?? "").trim() ? idArquetipo(dados.arquetipo2) : null;
  if (dois && dois !== um) out.push({ id: dois, nivel: Math.max(0, Math.floor(Number(dados.nivel2) || 0)), posicao: 2 });
  return out;
}

/** Nível do personagem num arquétipo modelo (0 se não tem). */
export function nivelArquetipo(dados, id) {
  return arquetiposDoPersonagem(dados).find(a => a.id === id)?.nivel ?? 0;
}

/** Último degrau de uma tabela [{ nivel, … }] alcançado no nível dado (ou null). */
export function degrau(tabela = [], nivel = 0) {
  let atual = null;
  for (const t of tabela) if (nivel >= t.nivel) atual = t;
  return atual;
}

/** Próximo degrau ainda não alcançado (ou null). */
export function proximoDegrau(tabela = [], nivel = 0) {
  return tabela.find(t => t.nivel > nivel) ?? null;
}

/** Etapa (1 a 5) da Maestria do Combatente no nível dado (0 = ainda não tem). */
export function etapaMaestria(nivel) {
  return ARQUETIPOS.combatente.etapas.filter(n => nivel >= n).length;
}

/** Quantos Estilos de Combate o Combatente pode ter no nível dado. */
export function estilosPermitidos(nivel) {
  return degrau(ARQUETIPOS.combatente.estilosPorNivel, nivel)?.qtd ?? 0;
}

/** Efeitos da Maestria escolhida na etapa atual (valores prontos para a ficha e o diálogo de ataque). */
export function efeitoMaestria(id, nivel) {
  const m = ARQUETIPOS.combatente.maestrias[id];
  const etapa = etapaMaestria(nivel);
  if (!m || !etapa) return null;
  const i = etapa - 1;
  const out = { id, nome: m.nome, quando: m.quando, etapa, texto: m.texto };
  if (m.custos) out.custo = m.custos[i];
  if (m.dano) out.dano = m.dano[i];
  if (m.acerto) out.acerto = m.acerto[i];
  if (m.alcance) out.alcance = m.alcance[i];
  if (m.ca) out.ca = m.ca[i];
  if (m.niveis) Object.assign(out, degrau(m.niveis, nivel) ?? {});
  if (m.margem) out.margem = degrau(m.margem, nivel)?.valor ?? 0;
  if (m.mult) out.mult = degrau(m.mult, nivel)?.valor ?? 0;
  if (id === "leve") out.dex = nivel >= 11;
  if (id === "leve") out.danoDex = nivel >= 31 ? 3 : 0;
  return out;
}

/** Resumo de uma linha do que a Maestria faz agora. */
export function textoMaestria(e) {
  if (!e) return "";
  switch (e.id) {
    case "destrutivo": return `Ao acertar: ${e.custo} PE por +${e.dano} de dano.`;
    case "alongado": return `Ao errar: ${e.custo} PE para causar ${e.dano} de dano.`;
    case "longa": return `Antes de atacar: ${e.custo} PE por +${String(e.alcance).replace(".", ",")} m de alcance.`;
    case "certeiro": return `Antes do ataque: ${e.custo} PE por +${e.acerto} de Acerto.`;
    case "protetora": return `+${e.ca} de CA com a arma equipada.`;
    case "leve": return `${e.dex ? "Pode usar Destreza com a arma." : "Redução de categoria de peso."}${e.danoDex ? " +3 de dano se a arma já usa Destreza." : ""}`;
    case "gemea": return `${e.custo} PE por +${e.ataques} ataque${e.ataques > 1 ? "s" : ""} com a arma gêmea (1×/turno).`;
    case "perigosa": return `Margem de crítico +${e.margem}${e.mult ? `, multiplicador ×${e.mult}` : ""}.`;
    default: return e.texto ?? "";
  }
}

/** Tipo da arma (campo "Tipo de arma" do editor). */
export const tipoDaArma = item => String(item?.flags?.["epm-ficha"]?.tipoArma ?? item?.tipoArma ?? "").trim();

/** A arma é do tipo favorito do Combatente? (compara sem acento e sem maiúsculas) */
export function eTipoFavorito(item, dados = {}) {
  const fav = norm(dados.arquetipoOpcoes?.combatente?.tipoFavorito);
  return !!fav && norm(tipoDaArma(item)) === fav;
}

/** Valor de Inteligência para as fórmulas do Artífice (mínimo 1). */
export const intMin1 = valor => Math.max(1, Math.floor(Number(valor) || 0));

/** Projetos do Artífice no nível dado, com a Inteligência já somada. */
export function projetosDoNivel(nivel, inteligencia = 0) {
  const t = degrau(ARQUETIPOS.artifice.projetos, nivel);
  if (!t) return null;
  const i = intMin1(inteligencia);
  return {
    etapa: ARQUETIPOS.artifice.projetos.indexOf(t) + 1,
    dano: `${t.dano} + ${i}`, cura: `${t.cura} + ${i}`, soma: t.soma + i, protecao: t.protecao,
    proximo: proximoDegrau(ARQUETIPOS.artifice.projetos, nivel)?.nivel ?? null
  };
}

/** Limite do Livro de Projetos (0 se ainda não tem). */
export function limiteLivro(nivel, inteligencia = 0) {
  const t = degrau(ARQUETIPOS.artifice.livro, nivel);
  return t ? t.base + intMin1(inteligencia) : 0;
}

/** Bônus do Pequeno Autômato (2.0 e 3.0) no nível dado. */
export function bonusAutomato(nivel) {
  return degrau(ARQUETIPOS.artifice.automato.melhorias, nivel) ?? { atributos: 0, recursos: 0 };
}

/** Bônus de PM máximo da Reserva Arcana. */
export function reservaArcana(nivel) {
  return degrau(ARQUETIPOS.conjurador.reservaArcana, nivel)?.pm ?? 0;
}

/** Custo de PM sugerido para uma magia do círculo (Conjurador). */
export function custoMagiaCirculo(circulo) {
  const c = ARQUETIPOS.conjurador.custosMagia;
  return c[Math.max(0, Math.min(c.length - 1, Math.floor(Number(circulo) || 0)))];
}

/** O círculo já está liberado para o Conjurador deste nível? */
export function circuloLiberado(circulo, nivel) {
  const req = ARQUETIPOS.conjurador.circulos[circulo];
  return req === undefined ? nivel >= 50 : nivel >= req;
}

/**
 * Mods automáticos dos arquétipos para calcularFicha: Reserva Arcana (PM máx), Utensílios (+2 nas 3 perícias),
 * Arma Protetora (CA com uma arma do tipo favorito equipada) e Arma Dupla (CA com duas armas equipadas).
 * @param {object} dados       flags da ficha (normalizadas)
 * @param {object[]} armasEquipadas  [{ id }] armas equipadas
 */
export function modsDeArquetipo(dados = {}, armasEquipadas = [], agora = null) {
  const out = [];
  if (agora !== null) out.push(...modsDeProjetos(dados, agora));
  const opc = dados.arquetipoOpcoes ?? {};
  const conj = nivelArquetipo(dados, "conjurador");
  if (conj) {
    const pm = reservaArcana(conj);
    if (pm) out.push({ alvo: "recurso.pm", valor: pm, fonte: "Reserva Arcana (Conjurador)" });
  }
  const art = nivelArquetipo(dados, "artifice");
  if (art >= ARQUETIPOS.artifice.utensilios.nivel) {
    const lista = (Array.isArray(opc.artifice?.utensilios) ? opc.artifice.utensilios : [])
      .filter(p => p && !ARQUETIPOS.artifice.utensilios.exceto.includes(p)).slice(0, ARQUETIPOS.artifice.utensilios.qtd);
    for (const p of lista) out.push({ alvo: `pericia.${p}`, valor: ARQUETIPOS.artifice.utensilios.bonus, fonte: "Utensílios (Artífice)" });
  }
  const comb = nivelArquetipo(dados, "combatente");
  if (comb) {
    const m = efeitoMaestria(opc.combatente?.maestria, comb);
    if (m?.id === "protetora" && armasEquipadas.some(a => eTipoFavorito(a, dados))) out.push({ alvo: "ca", valor: m.ca, fonte: "Arma Protetora (Combatente)" });
    const estilos = estilosEscolhidos(dados, comb);
    if (estilos.includes("dupla") && armasEquipadas.length >= 2) out.push({ alvo: "ca", valor: ARQUETIPOS.combatente.estilos.dupla.ca, fonte: "Arma Dupla (Combatente)" });
  }
  return out;
}

/** Estilos de Combate escolhidos que valem no nível atual (o excedente é ignorado). */
export function estilosEscolhidos(dados = {}, nivel = null) {
  const n = nivel ?? nivelArquetipo(dados, "combatente");
  const lista = Array.isArray(dados.arquetipoOpcoes?.combatente?.estilos) ? dados.arquetipoOpcoes.combatente.estilos : [];
  return [...new Set(lista.filter(e => ARQUETIPOS.combatente.estilos[e]))].slice(0, estilosPermitidos(n));
}

/** Tipos de projeto do Artífice. */
export const TIPOS_PROJETO = {
  dano: { label: "Dano", icone: "fa-solid fa-bomb" },
  cura: { label: "Cura", icone: "fa-solid fa-kit-medical" },
  soma: { label: "Soma", icone: "fa-solid fa-plus" },
  protecao: { label: "Proteção", icone: "fa-solid fa-shield-halved" }
};

/** Efeitos de Soma (testes) e Proteção (CA) de projetos ainda valendo no momento `agora`. */
export function efeitosProjetoValendo(dados = {}, agora = 0) {
  return Object.entries(dados.projetosEfeitos ?? {})
    .filter(([, e]) => e && (e.tipo === "soma" || e.tipo === "protecao") && Number(e.ate) > agora)
    .map(([id, e]) => ({ id, ...e }));
}

/** Mods dos projetos ativos: Soma vai em todos os testes, Proteção na CA. */
export function modsDeProjetos(dados = {}, agora = 0) {
  return efeitosProjetoValendo(dados, agora).map(e => ({
    alvo: e.tipo === "soma" ? "testes" : "ca", valor: Math.floor(Number(e.valor) || 0), fonte: `Projeto: ${e.nome || TIPOS_PROJETO[e.tipo].label}`
  }));
}

/**
 * Estado dos projetos do dia: em produção, pronto ou recarregando (usado, volta depois de 1 hora).
 * Projetos de outro dia não contam (terminam ao fim do dia).
 */
export function estadoProjetos(dados = {}, agora = 0, dia = "") {
  return Object.entries(dados.projetos ?? {})
    .filter(([, p]) => p && TIPOS_PROJETO[p.tipo] && p.dia === dia)
    .map(([id, p]) => {
      const prontoEm = Number(p.prontoEm) || 0;
      const voltaEm = Number(p.voltaEm) || 0;
      const estado = agora < prontoEm ? "producao" : (agora < voltaEm ? "recarga" : "pronto");
      return { id, nome: p.nome || TIPOS_PROJETO[p.tipo].label, tipo: p.tipo, tipoLabel: TIPOS_PROJETO[p.tipo].label,
        icone: TIPOS_PROJETO[p.tipo].icone, estado, apagado: !!p.apagado, faltam: estado === "producao" ? prontoEm - agora : (estado === "recarga" ? voltaEm - agora : 0) };
    });
}

export { INT as ATRIBUTO_INTELECTO };
