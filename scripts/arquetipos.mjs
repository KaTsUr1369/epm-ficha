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
    recursos: "PE Máximo = PE de Raça + PE de Classe + Constituição (Vigor). Faixas: 1–10 base • 11–30 competente • 31–50 lendário.",
    progressao: progressao(`1 Arma Favorita • 2 AS • 3 Classe • 4 AS + Estilo • 5 Ataque Extra + Perícia • 6 AS + Classe • 7 Reflexos • 8 AS • 9 Classe • 10 AS + Fôlego + Perícia • 11 Arma Favorita 2.0 • 12 AS + Classe • 13 Ataque Extra 2.0 • 14 AS • 15 Classe + Perícia • 16 AS • 17 Movimento Cauteloso • 18 AS + Classe • 19 Caçador Natural • 20 AS + Perícias • 21 Classe + Arma Favorita 3.0 • 22 AS + Fôlego 2.0 • 23 Comando de Campo • 24 AS + Classe • 25 Estilo 2.0 + Perícia • 26 AS • 27 Classe + Ataque Extra 3.0 • 28 AS • 29 Caçador 2.0 • 30 AS + Classe + Perícia • 31 Arma Favorita 4.0 • 32 AS • 33 Classe • 34 AS • 35 Fôlego 3.0 + Perícia • 36 AS + Classe • 37 Ataque Extra 4.0 • 38 AS • 39 Classe • 40 AS + Herói + Perícia • 41 Arma Favorita 5.0 • 42 AS + Classe • 43 Comando 2.0 • 44 AS • 45 Classe + Perícia • 46 AS + Ataque Extra 5.0 • 47 Caçador 3.0 • 48 AS + Classe • 49 Estilo 3.0 • 50 AS x2 + Perícia + Ímpeto Lendário`),
    habilidades: [
      { nivel: 1, nome: "Arma Favorita", resumo: "Escolha uma arma e uma Maestria. A Maestria evolui nos níveis 11, 21, 31 e 41. Maestrias com custo em PE só podem ser ativadas uma vez por turno." },
      { nivel: 4, nome: "Estilo de Combate", resumo: "Escolha um estilo: Duelista, Atirador, Arma Dupla, Combate Defensivo, Arma Pesada, Arma Leve, Bêbado ou Armamento Longo. Novos estilos nos níveis 25 e 49." },
      { nivel: 5, nome: "Ataque Extra", resumo: "Ao usar a Ação de Ataque, gaste PE para fazer ataques adicionais: até +1 ataque, 6 PE cada. Só pode ativar uma vez por turno." },
      { nivel: 7, nome: "Reflexos de Combate", resumo: "+3 em Testes de Resistência de Destreza (Reflexos)." },
      { nivel: 10, nome: "Fôlego de Combate", resumo: "1 vez por cena, Ação Bônus: recupera 2d6 PE." },
      { nivel: 11, nome: "Arma Favorita 2.0", resumo: "A Maestria evolui para a etapa 2." },
      { nivel: 13, nome: "Ataque Extra 2.0", resumo: "Até +2 ataques, 6 PE cada." },
      { nivel: 17, nome: "Movimento Cauteloso", resumo: "Vantagem em testes de resistência contra armadilhas. Reflexos de Combate sobe para +5." },
      { nivel: 19, nome: "Caçador Natural", resumo: "12 PE ao entrar em combate (ou Ação Bônus depois): escolha uma Presa perceptível. Contra ela: +3 Acerto, ignora a Resistência dela (Imunidade não) e +1 CA. Uma vez por turno, um acerto nela causa +1 dado de dano. Dura até o fim do combate; quando a Presa chega a 0 PV, transfira por 6 PE." },
      { nivel: 21, nome: "Arma Favorita 3.0", resumo: "A Maestria evolui para a etapa 3." },
      { nivel: 22, nome: "Fôlego de Combate 2.0", resumo: "Recupera 4d6 PE." },
      { nivel: 23, nome: "Comando de Campo", resumo: "Ignora 1 ponto de Exaustão em combate. Uma vez por rodada, Ação Bônus e 12 PE: um aliado que possa te ver ou ouvir usa a Reação dele para fazer um ataque ou mover-se até metade do deslocamento sem provocar ataques." },
      { nivel: 25, nome: "Estilo de Combate 2.0", resumo: "Escolha um segundo estilo." },
      { nivel: 27, nome: "Ataque Extra 3.0", resumo: "Até +3 ataques, 6 PE cada." },
      { nivel: 29, nome: "Caçador Natural 2.0", resumo: "Contra a Presa: +4 Acerto e +1 Esquiva; o +1 dado vale em todo acerto; transferir a Presa é grátis." },
      { nivel: 31, nome: "Arma Favorita 4.0", resumo: "A Maestria evolui para a etapa 4." },
      { nivel: 35, nome: "Fôlego de Combate 3.0", resumo: "Recupera 6d6 PE e pode ser usado 2 vezes por cena." },
      { nivel: 37, nome: "Ataque Extra 4.0", resumo: "Até +3 ataques, 4 PE cada." },
      { nivel: 40, nome: "Herói", resumo: "Uma vez por rodada, no turno de outra criatura, 20 PE: Ação Lendária imediata (um ataque sem Ataque Extra, mover até seu deslocamento, usar uma habilidade de Combatente de Ação Bônus ou proteger um aliado a até 1,5 m, virando o alvo do ataque). Com metade dos PV ou menos, realiza saltos extraordinários conforme a capacidade física e o cenário." },
      { nivel: 41, nome: "Arma Favorita 5.0", resumo: "A Maestria alcança a evolução máxima." },
      { nivel: 43, nome: "Comando de Campo 2.0", resumo: "Custa 10 PE e o aliado pode atacar e mover. Ao reduzir pessoalmente um inimigo a 0 PV, recupera 5 PE (uma vez por rodada)." },
      { nivel: 46, nome: "Ataque Extra 5.0", resumo: "Até +5 ataques, 5 PE cada." },
      { nivel: 47, nome: "Caçador Natural 3.0", resumo: "Contra a Presa: +5 Acerto; a Imunidade dela ao seu dano vira Resistência." },
      { nivel: 49, nome: "Estilo de Combate 3.0", resumo: "Escolha um terceiro estilo." },
      { nivel: 50, nome: "Ímpeto Lendário", resumo: "40 PE; 3 rodadas; 1 vez por cena. Ataque Extra custa metade (arredonde para cima); +3 Acerto, +2 Defesa e +2 Esquiva. Uma vez por rodada, ao sofrer dano, avança até seu deslocamento em direção ao atacante e ataca se chegar ao alcance. Consciente, efeitos físicos comuns não impedem seu movimento." }
    ],
    /** Ataque Extra: custo POR ataque adicional, até o máximo do nível (1 vez por turno). */
    ataqueExtra: [
      { nivel: 5, custo: 6, ataques: 1 }, { nivel: 13, custo: 6, ataques: 2 }, { nivel: 27, custo: 6, ataques: 3 },
      { nivel: 37, custo: 4, ataques: 3 }, { nivel: 46, custo: 5, ataques: 5 }
    ],
    /** Fôlego de Combate: PE recuperados e usos por cena. */
    folego: [{ nivel: 10, dado: "2d6", usos: 1 }, { nivel: 22, dado: "4d6", usos: 1 }, { nivel: 35, dado: "6d6", usos: 2 }],
    /** Reflexos de Combate: +3 (+5 no 17). */
    reflexos: [{ nivel: 7, valor: 3 }, { nivel: 17, valor: 5 }],
    /** Níveis em que a Maestria muda de etapa (etapa 1 a 5). */
    etapas: [1, 11, 21, 31, 41],
    maestrias: {
      destrutivo: { nome: "Ataque Destrutivo", quando: "acerto", custos: [3, 4, 6, 8, 10], dano: [3, 6, 10, 15, 20],
        texto: "Ao acertar, gaste PE para causar dano adicional." },
      alongado: { nome: "Acerto Alongado", quando: "erro", custos: [4, 5, 7, 9, 11], dano: [3, 6, 10, 15, 20],
        texto: "Ao errar, gaste PE para ainda causar dano; não conta como acerto nem ativa efeitos que exigem acerto." },
      longa: { nome: "Arma Longa", quando: "antes", custos: [4, 3, 3, 4, 4], alcance: [1.5, 1.5, 3, 4.5, 6],
        texto: "Antes de atacar, gaste PE para aumentar o alcance." },
      certeiro: { nome: "Ataque Certeiro", quando: "antes", custos: [2, 3, 4, 5, 6], acerto: [1, 2, 3, 4, 5],
        texto: "Antes do ataque, gaste PE para ganhar Acerto." },
      protetora: { nome: "Arma Protetora", quando: "sempre", ca: [1, 1, 2, 2, 3], defesa: [0, 1, 1, 2, 2],
        texto: "Enquanto segura (equipa) a arma, ganha CA e Defesa." },
      leve: { nome: "Arma Leve", quando: "sempre",
        texto: "Nv. 1: reduz a categoria de peso. Nv. 11: pode usar Destreza com a arma. Nv. 21: sacar, guardar ou trocar a arma é ação livre (1×/turno) e +1 Esquiva. Nv. 31: se a arma já usa Destreza naturalmente, +3 de dano. Nv. 41: +5 de dano (total) e +1 Acerto." },
      gemea: { nome: "Gêmea", quando: "antes",
        niveis: [{ nivel: 1, custo: 3, ataques: 1 }, { nivel: 31, custo: 7, ataques: 2 }],
        texto: "Duas armas iguais compartilham a Maestria. Nv. 1: 1×/turno, como Ação Bônus e por 3 PE, ataca com a segunda arma sem somar o modificador ao dano. Nv. 11: soma o modificador. Nv. 21: o Ataque Extra custa 2 PE a menos no total (mín. 3). Nv. 31: o ataque de Ação Bônus pode ser repetido mais uma vez por +4 PE. Nv. 41: o Ataque Extra custa 4 PE a menos no total (mín. 3)." },
      perigosa: { nome: "Arma Perigosa", quando: "sempre", margem: [{ nivel: 1, valor: 1 }, { nivel: 21, valor: 2 }],
        mult: [{ nivel: 31, valor: 3 }], dadosCritico: [{ nivel: 11, valor: 1 }, { nivel: 41, valor: 2 }],
        texto: "Nv. 1: margem de crítico +1. Nv. 11: o crítico causa +1 dado de dano. Nv. 21: margem +2. Nv. 31: multiplicador do crítico ×3. Nv. 41: o crítico causa +2 dados de dano (em vez de +1)." }
    },
    /** Estilos de Combate (1 no Nv. 4, 2 no Nv. 25, 3 no Nv. 49). */
    estilosPorNivel: [{ nivel: 4, qtd: 1 }, { nivel: 25, qtd: 2 }, { nivel: 49, qtd: 3 }],
    estilos: {
      defensivo: { nome: "Combate Defensivo", texto: "Usando Escudo ou Armadura: +2 Defesa (Bloqueio) e +1 CA.", defesa: 2, ca: 1 },
      pesada:    { nome: "Combate com Arma Pesada", texto: "Crítico com arma Pesada ou maior: pode fazer +1 ataque, uma vez por turno." },
      leve:      { nome: "Combate com Arma Leve", texto: "Com arma Leve ou menor, 1 ou 2 num dado de dano: rola aquele dado de novo." },
      duelista:  { nome: "Duelista",  texto: "+2 Acerto contra um inimigo que não tenha outros inimigos seus a até 1,5 m dele.", acertoIsolado: 2 },
      bebado:    { nome: "Bêbado", texto: "Com a condição Bêbado, as penalidades viram +3 Acerto, +1 Esquiva e +1 CA. Ainda fica Exausto e Desequilibrado depois de 2 horas.", acerto: 3, esquiva: 1, ca: 1 },
      atirador:  { nome: "Atirador",  texto: "Pode abrir mão do modificador de dano da arma para reduzir a margem de crítico em 2.", margem: 2, margemSempre: 0 },
      longo:     { nome: "Armamento Longo", texto: "Arma à distância Pesada ou Enorme: +1d6 de dano. Também pode atacar corpo a corpo desarmado com +1d4 de dano.", dano: "1d6", desarmado: "1d4" },
      dupla:     { nome: "Arma Dupla", texto: "Usando duas armas: +1 Acerto e +1 Esquiva.", acerto: 1, esquiva: 1, ca: 0 }
    },
    /** Caçador Natural em 3 etapas: custo para marcar, Acerto contra a Presa, Esquiva extra e custo para transferir. */
    cacador: { nivel: 19, custo: 12, acerto: 3, transferir: 6, ca: 1,
      etapas: [{ nivel: 19, acerto: 3, esquiva: 0, transferir: 6, todoAcerto: false }, { nivel: 29, acerto: 4, esquiva: 1, transferir: 0, todoAcerto: true }, { nivel: 47, acerto: 5, esquiva: 1, transferir: 0, todoAcerto: true, imunidadeVira: true }] }
  },

  conjurador: {
    id: "conjurador", nome: "Conjurador", icone: "fa-solid fa-hat-wizard", cor: "#8A7CE0",
    funcao: "Domina a mana, amplia a conjuração e modifica magias usando PE. O arquétipo libera círculos; a quantidade de magias conhecidas depende principalmente da Classe.",
    recursos: "PE Máximo = PE de Raça + PE de Classe + Constituição (Vigor). PM Máximo = PM de Raça + PM de Classe + Núcleo (Espírito).",
    progressao: progressao(`1 Despertar • 2 Magia 1 • 3 Classe • 4 Evolução • 5 Manipulação • 6 Classe • 7 Olhar de Mana • 8 Evolução • 9 Classe • 10 Magia 2 • 11 Recuperar Mana • 12 Classe + Evolução • 13 Conjuração Precisa • 14 Canalização • 15 Classe • 16 Evolução • 17 Conjuração Dupla • 18 Classe • 19 Magia 3 • 20 Evolução • 21 Classe • 22 Recuperar Mana 2.0 • 23 Conjuração Reativa • 24 Classe + Evolução • 25 Sustentação • 26 Reserva Arcana • 27 Classe • 28 Evolução • 29 Magia 4 • 30 Classe • 31 Manipulação 2.0 • 32 Evolução • 33 Classe • 34 Domínio • 35 Recuperar Mana 3.0 • 36 Classe + Evolução • 37 Sobrecarga • 38 Magia 5 • 39 Classe • 40 Evolução • 41 Reserva Arcana 2.0 • 42 Classe • 43 Recuperar Mana 4.0 • 44 Evolução • 45 Classe • 46 Corpo de Mana • 47 Magia 6 • 48 Classe + Evolução • 49 Sobrecarga 2.0 + Reserva Arcana 3.0 • 50 Zona de Mana`),
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
      { nivel: 19, nome: "Magia 3", resumo: "Desbloqueia magias de 3º círculo." },
      { nivel: 22, nome: "Recuperar Mana 2.0", resumo: "Recupera 18 PM por 12 PE." },
      { nivel: 23, nome: "Conjuração Reativa", resumo: "Gaste 10 PE para conjurar um Truque como reação a uma ação que ele possa afetar diretamente. Uma vez por rodada." },
      { nivel: 25, nome: "Sustentação Mágica", resumo: "Gaste 8 PE quando a concentração ou sustentação seria interrompida para mantê-la automaticamente." },
      { nivel: 26, nome: "Reserva Arcana", resumo: "+10 PM Máximo." },
      { nivel: 29, nome: "Magia 4", resumo: "Desbloqueia magias de 4º círculo." },
      { nivel: 31, nome: "Manipulação Mágica 2.0", resumo: "Pode aplicar 2 modificações ao mesmo tempo por 10 PE." },
      { nivel: 34, nome: "Domínio de Conjuração", resumo: "Escolha uma especialização permanente: Alcance (categoria extra de alcance); Área (categoria extra de área); Controle (exclui +2 alvos de áreas); Sustentação (mantém mais uma magia ao mesmo tempo)." },
      { nivel: 35, nome: "Recuperar Mana 3.0", resumo: "Recupera 25 PM por 15 PE." },
      { nivel: 37, nome: "Sobrecarga Mágica", resumo: "Uma vez por magia: 12 PE por +1 dado de dano ou cura, ou 22 PE por +2 dados. Não acumula com Canalização." },
      { nivel: 38, nome: "Magia 5", resumo: "Desbloqueia magias de 5º círculo." },
      { nivel: 41, nome: "Reserva Arcana 2.0", resumo: "O bônus de Reserva Arcana aumenta para +25 PM Máximo." },
      { nivel: 43, nome: "Recuperar Mana 4.0", resumo: "Recupera 35 PM por 20 PE." },
      { nivel: 46, nome: "Corpo de Mana", resumo: "Gaste 10 PM por rodada para mover-se livremente no ar e andar por paredes e tetos." },
      { nivel: 47, nome: "Magia 6", resumo: "Desbloqueia magias de 6º círculo." },
      { nivel: 49, nome: "Sobrecarga 2.0 e Reserva Arcana 3.0", resumo: "A Sobrecarga libera +3 dados por 32 PE e passa a acumular com Canalização. A Reserva Arcana sobe para +40 PM Máximo." },
      { nivel: 50, nome: "Zona de Mana", resumo: "1 vez por cena. Ativação: 40 PM + 25 PE; dura 5 rodadas. Cria uma grande zona ao seu redor. Enquanto ativa, move-se no ar, nas paredes, no teto ou no chão; magias podem surgir de qualquer ponto da zona, que também serve como origem; percebe manifestações de mana e o ambiente assume traços da sua magia." }
    ],
    /** Custo em PM por círculo (0 = Truque). */
    custosMagia: [0, 6, 10, 14, 18, 24, 32],
    /** Nível de Conjurador que libera cada círculo. */
    circulos: { 0: 1, 1: 2, 2: 10, 3: 19, 4: 29, 5: 38, 6: 47 },
    truques: [{ nivel: 1, qtd: 2 }, { nivel: 2, qtd: 3 }],
    reservaArcana: [{ nivel: 26, pm: 10 }, { nivel: 41, pm: 25 }, { nivel: 49, pm: 40 }],
    recuperarMana: [{ nivel: 11, pe: 10, pm: 10 }, { nivel: 22, pe: 12, pm: 18 }, { nivel: 35, pe: 15, pm: 25 }, { nivel: 43, pe: 20, pm: 35 }],
    manipulacao: {
      nivel: 5, custo: 5, custoDupla: 10, nivelDupla: 31, nivelPrecisa: 13,
      opcoes: ["Aumentar o alcance", "Aumentar a área em uma categoria", "Conjurar sem movimentos", "Excluir criaturas da área"]
    },
    /** Sobrecarga: opções liberadas por nível (no 49 passa a acumular com Canalização). */
    sobrecarga: { nivel: 37, acumulaCanalizacao: 49, opcoes: [{ nivel: 37, pe: 12, dados: 1 }, { nivel: 37, pe: 22, dados: 2 }, { nivel: 49, pe: 32, dados: 3 }] },
    dominioNivel: 34,
    zonaDeMana: { nivel: 50, pm: 40, pe: 25, rodadas: 5, uso: "cena" },
    dominios: { alcance: "Alcance: categoria extra de alcance", area: "Área: categoria extra de área", controle: "Controle: exclui +2 alvos de áreas", sustentacao: "Sustentação: mantém mais uma magia ao mesmo tempo" }
  },

  artifice: {
    id: "artifice", nome: "Artífice", icone: "fa-solid fa-screwdriver-wrench", cor: "#C9A24E",
    funcao: "Cria projetos, ferramentas, encantamentos, modificações e autômatos. Combina preparação, utilidade e apoio, com efeitos que crescem com o nível.",
    recursos: "Subclasses: Alquimista, Curandeiro, Mecânico de Guerra e Armadura Viva (escolhidas nos níveis de Subclasse). Faixas: 1–10 base • 11–30 competente • 31–50 lendário.",
    progressao: progressao(`1 Criar Projetos • 2 AS • 3 Subclasse + Livro de Projetos • 4 AS • 5 Utensílios + Perícia • 6 AS + Subclasse • 7 Bolsa Automática • 8 AS • 9 Subclasse + Itens Encantados • 10 AS + Livro 2.0 + Perícia • 11 Modificações Permanentes • 12 AS + Subclasse • 13 Criar Projetos 2.0 • 14 AS • 15 Subclasse + Perícia • 16 AS • 17 Pequeno Autômato • 18 AS + Subclasse • 19 Corpo Modificado • 20 AS + Livro 3.0 + Perícia • 21 Subclasse • 22 AS • 23 Mudança de Planos • 24 AS + Subclasse • 25 Criar Projetos 3.0 + Perícia • 26 AS • 27 Subclasse • 28 AS • 29 Pequeno Autômato 2.0 • 30 AS + Subclasse + Perícia • 31 Roupas Modificadas • 32 AS • 33 Subclasse • 34 AS • 35 Livro 4.0 + Modificações 2.0 + Perícia • 36 AS + Subclasse • 37 Criar Projetos 4.0 • 38 AS • 39 Subclasse + Mudança de Planos 2x • 40 AS + Perícia • 41 Pequeno Autômato 3.0 • 42 AS + Subclasse • 43 Estudo das Almas • 44 AS • 45 Subclasse + Livro 5.0 + Perícia • 46 AS • 47 Criar Projetos 5.0 • 48 AS + Subclasse • 49 Recriando Almas • 50 AS x2 + Perícia`),
    habilidades: [
      { nivel: 1, nome: "Criar Projetos", resumo: "Pode criar 2 projetos por dia (3 a partir do Nv. 25; 4 a partir do Nv. 47). Cada um fica pronto após 1 minuto de produção e fica inativo depois de 1 hora. Os projetos do dia acabam no fim do dia. Inteligência (Intelecto) conta com mínimo 1. Nv. 1: Dano 2d6 + Int, Cura 2d4 + Int, Soma +2, Proteção +2." },
      { nivel: 3, nome: "Livro de Projetos", resumo: "No fim do dia, pode guardar projetos daquele dia para que não expirem. Limite guardado: Nv. 3 = 2; Nv. 10 = 3; Nv. 20 = 4; Nv. 35 = 5; Nv. 45 = 6." },
      { nivel: 5, nome: "Utensílios", resumo: "Escolha 3 perícias, exceto Luta e Pontaria; recebe +2 nos testes delas." },
      { nivel: 7, nome: "Bolsa Automática", resumo: "Pegar ou guardar um item na mochila usa Meia Ação (Ação Bônus) em vez de Ação Normal." },
      { nivel: 9, nome: "Itens Encantados", resumo: "Cria itens mágicos que ajudam ou participam dos projetos. Dano: Nv. 9 1d4; 13 1d6; 25 1d8; 37 2d6; 47 2d8. Cura: +1; +2; +3; +4; +5. Auxílio: +1; +1; +2; +3; +4 (nos mesmos níveis)." },
      { nivel: 11, nome: "Modificações Permanentes", resumo: "Pode instalar partes mecânicas ou robóticas em até 2 criaturas (você conta). Cada uma escolhe um Acerto ou tipo de teste e recebe +1." },
      { nivel: 13, nome: "Criar Projetos 2.0", resumo: "Projetos evoluem: Dano 3d8 + Int, Cura 2d8 + Int, Soma +3, Proteção +2." },
      { nivel: 17, nome: "Pequeno Autômato", resumo: "Cria um autômato pequeno. Usa sua Inteligência e Carisma; Núcleo 9, Força 12, Destreza 14, Constituição 18 e recursos de um autômato básico." },
      { nivel: 19, nome: "Corpo Modificado", resumo: "Após cada Descanso Longo, escolha até 2: vantagem em um tipo de Teste de Resistência; uma proficiência que não possuía; +2 Acerto; ou +3 Dano." },
      { nivel: 23, nome: "Mudança de Planos", resumo: "1 vez por cena, ao falhar em um teste, gaste 8 PE: a ação usada não é gasta e você pode agir com ela de novo. PE gastos no teste que falhou são perdidos. A partir do Nv. 39, 2 vezes por cena." },
      { nivel: 25, nome: "Criar Projetos 3.0", resumo: "Projetos evoluem e passam a ser 3 por dia: Dano 4d10 + Int, Cura 3d10 + Int, Soma +4, Proteção +3." },
      { nivel: 29, nome: "Pequeno Autômato 2.0", resumo: "O autômato recebe +2 em todos os atributos e +10 PV, PE e PM." },
      { nivel: 31, nome: "Roupas Modificadas", resumo: "Após Descanso Longo, escolha: +1 Defesa, +1 Esquiva e +1 CA (acumulam com armadura e escudo); ou proficiência em uma perícia, recebendo +5 se já for proficiente. Se perder ou destruir a roupa, pode fabricar outra com os recursos necessários." },
      { nivel: 35, nome: "Modificações Permanentes 2.0", resumo: "Até 3 criaturas e o bônus passa a +2." },
      { nivel: 37, nome: "Criar Projetos 4.0", resumo: "Projetos evoluem: Dano 6d10 + Int, Cura 4d12 + Int, Soma +5, Proteção +3." },
      { nivel: 41, nome: "Pequeno Autômato 3.0", resumo: "O bônus do autômato aumenta para +4 em todos os atributos e +25 PV, PE e PM." },
      { nivel: 43, nome: "Estudo das Almas", resumo: "Recebe +2 em Núcleo ou Inteligência e pode passar do máximo normal desse atributo em 2. Pode remover a alma de mortos, incapacitados (0 PV ou 0 PM) ou voluntários. Ao gastar metade de um descanso estudando uma alma, recebe contra a mesma espécie: Resistência ao principal tipo de dano dela, +1 dado de dano, Vantagem em testes contra ela, +1 PT e 20 PV temporários. Só uma espécie estudada por vez; dura até o próximo descanso ou até cair a 0 PV." },
      { nivel: 47, nome: "Criar Projetos 5.0", resumo: "Projetos chegam ao máximo e passam a ser 4 por dia: Dano 8d10 + Int, Cura 6d12 + Int, Soma +6, Proteção +4." },
      { nivel: 49, nome: "Recriando Almas", resumo: "Pode recriar uma alma estudada em um corpo sem alma (constructo, zumbi, golem etc.). Também pode estudar a própria alma durante todo um Descanso Longo para criar uma réplica de si. Custo: 30 dias e 50 PEv para outra criatura; 45 dias e 80 PEv para si. Só pode existir uma réplica sua por vez." }
    ],
    /** Criar Projetos: valores por etapa. A Inteligência (mín. 1) soma só no Dano e na Cura. */
    projetos: [
      { nivel: 1, dano: "2d6", cura: "2d4", soma: 2, protecao: 2 },
      { nivel: 13, dano: "3d8", cura: "2d8", soma: 3, protecao: 2 },
      { nivel: 25, dano: "4d10", cura: "3d10", soma: 4, protecao: 3 },
      { nivel: 37, dano: "6d10", cura: "4d12", soma: 5, protecao: 3 },
      { nivel: 47, dano: "8d10", cura: "6d12", soma: 6, protecao: 4 }
    ],
    projetosPorDia: 2,
    /** Projetos por dia por nível (zeram no descanso longo). */
    projetosPorDiaNivel: [{ nivel: 1, qtd: 2 }, { nivel: 25, qtd: 3 }, { nivel: 47, qtd: 4 }],
    /** Tempos dos projetos (no relógio do mundo, o mesmo do Simple Calendar). */
    tempoProjeto: { producaoMin: 1, voltaHoras: 1, efeitoHoras: 1 },
    /** Livro de Projetos: limite fixo (sem somar a Inteligência). */
    livro: [{ nivel: 3, base: 2 }, { nivel: 10, base: 3 }, { nivel: 20, base: 4 }, { nivel: 35, base: 5 }, { nivel: 45, base: 6 }],
    encantados: [
      { nivel: 9, dano: "1d4", danoInt: false, cura: 1, curaInt: false, auxilio: 1, auxilioInt: false },
      { nivel: 13, dano: "1d6", danoInt: false, cura: 2, curaInt: false, auxilio: 1, auxilioInt: false },
      { nivel: 25, dano: "1d8", danoInt: false, cura: 3, curaInt: false, auxilio: 2, auxilioInt: false },
      { nivel: 37, dano: "2d6", danoInt: false, cura: 4, curaInt: false, auxilio: 3, auxilioInt: false },
      { nivel: 47, dano: "2d8", danoInt: false, cura: 5, curaInt: false, auxilio: 4, auxilioInt: false }
    ],
    utensilios: { nivel: 5, qtd: 3, bonus: 2, exceto: ["luta", "pontaria"] },
    modificacoes: [{ nivel: 11, criaturas: 2, bonus: 1 }, { nivel: 35, criaturas: 3, bonus: 2 }],
    automato: {
      nivel: 17,
      atributos: { nucleo: 9, forca: 12, destreza: 14, constituicao: 18 },
      melhorias: [{ nivel: 29, atributos: 2, recursos: 10 }, { nivel: 41, atributos: 4, recursos: 25 }]
    },
    subclasses: ["Alquimista", "Curandeiro", "Mecânico de Guerra", "Armadura Viva"]
  }
};
for (const a of Object.values(ARQUETIPOS)) a.habilidades?.sort((x, y) => x.nivel - y.nivel);

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
export function efeitoMaestria(id, nivel, dados = null) {
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
  if (m.defesa) out.defesa = m.defesa[i];
  if (m.niveis) Object.assign(out, degrau(m.niveis, nivel) ?? {});
  if (m.margem) out.margem = degrau(m.margem, nivel)?.valor ?? 0;
  if (m.mult) out.mult = degrau(m.mult, nivel)?.valor ?? 0;
  if (m.dadosCritico) out.dadosCritico = degrau(m.dadosCritico, nivel)?.valor ?? 0;
  if (id === "leve") {
    out.dex = nivel >= 11;
    out.esquiva = nivel >= 21 ? 1 : 0;
    out.danoDex = nivel >= 41 ? 5 : nivel >= 31 ? 3 : 0;
    out.acerto = nivel >= 41 ? 1 : 0;
  }
  if (id === "gemea") {
    out.semMod = nivel < 11;
    out.descontoAE = nivel >= 41 ? 4 : nivel >= 21 ? 2 : 0;
  }
  // Ajuste desta ficha (Valores do arquétipo): custo, dano, acerto…
  if (dados) for (const campo of ["custo", "dano", "acerto", "alcance", "ca", "defesa", "esquiva", "margem", "mult", "danoDex", "dadosCritico", "descontoAE"]) if (typeof out[campo] === "number") out[campo] = valorPessoal(dados, `arq-maestria-${campo}`, out[campo]);
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
    case "protetora": return `+${e.ca} de CA${e.defesa ? ` e +${e.defesa} de Defesa` : ""} com a arma equipada.`;
    case "leve": return `${e.dex ? "Pode usar Destreza com a arma." : "Redução de categoria de peso."}${e.esquiva ? ` Sacar, guardar ou trocar é ação livre (1×/turno) e +${e.esquiva} Esquiva.` : ""}${e.danoDex ? ` +${e.danoDex} de dano se a arma já usa Destreza.` : ""}${e.acerto ? ` +${e.acerto} de Acerto.` : ""}`;
    case "gemea": return `Ação Bônus, ${e.custo} PE: +${e.ataques} ataque${e.ataques > 1 ? "s" : ""} com a segunda arma (1×/turno)${e.semMod ? ", sem somar o modificador ao dano" : ""}.${e.descontoAE ? ` Ataque Extra custa ${e.descontoAE} PE a menos no total (mín. 3).` : ""}`;
    case "perigosa": return `Margem de crítico +${e.margem}${e.mult ? `, multiplicador ×${e.mult}` : ""}${e.dadosCritico ? `, o crítico causa +${e.dadosCritico} dado${e.dadosCritico > 1 ? "s" : ""} de dano` : ""}.`;
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
/** Chaves dos valores ajustáveis dos projetos (Ajustar bônus do arquétipo). */
export const AJUSTES_PROJETO = {
  dano: "artifice-projetos-dano", cura: "artifice-projetos-cura", soma: "artifice-projetos-soma",
  protecao: "artifice-projetos-protecao", porDia: "artifice-projetos-por-dia", livro: "artifice-livro-de-projetos"
};

/** Texto do livro com "Int" no lugar da Inteligência (o que aparece como padrão no campo). */
export function projetosPadraoTexto(nivel) {
  const t = degrau(ARQUETIPOS.artifice.projetos, nivel);
  const l = degrau(ARQUETIPOS.artifice.livro, nivel);
  if (!t) return null;
  return {
    dano: `${t.dano} + Int`, cura: `${t.cura} + Int`, soma: String(t.soma), protecao: String(t.protecao),
    porDia: String(degrau(ARQUETIPOS.artifice.projetosPorDiaNivel, nivel)?.qtd ?? ARQUETIPOS.artifice.projetosPorDia), livro: l ? String(l.base) : ""
  };
}

/** Troca "Int", "Inteligência" ou "@int" pelo valor. */
const comInt = (texto, i) => String(texto ?? "").replace(/@int\b|\binteligên?cia\b|\binteligencia\b|\bint\b/gi, String(i));
/** Conta simples (só números e + − × ÷ parênteses); senão null. */
function conta(texto) {
  const t = String(texto ?? "").replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
  if (!t || !/^[\d+\-*/().]+$/.test(t)) return null;
  try { const v = Function(`"use strict"; return (${t});`)(); return Number.isFinite(v) ? Math.floor(v) : null; } catch { return null; }
}
/** Fórmula de dados com a Inteligência já trocada e os sinais arrumados ("2d8 + 3"). */
const formulaLimpa = t => String(t).replace(/\s*([+-])\s*/g, " $1 ").replace(/\s+/g, " ").trim();

/**
 * Valores dos projetos no nível. `ajustes` = flags.ajustesBonus (a mesa pode trocar dano, cura, soma, proteção,
 * projetos por dia e o limite do Livro, usando "Int" para a Inteligência: "2d8 + Int", "2 + Int", "3").
 */
export function projetosDoNivel(nivel, inteligencia = 0, ajustes = {}) {
  const t = degrau(ARQUETIPOS.artifice.projetos, nivel);
  if (!t) return null;
  const i = intMin1(inteligencia);
  const ov = chave => { const v = ajustes?.[AJUSTES_PROJETO[chave]]; return v !== undefined && v !== null && String(v).trim() !== "" ? String(v).trim() : null; };
  const num = (chave, padrao) => { const v = ov(chave); if (v === null) return padrao; const c = conta(comInt(v, i)); return c ?? padrao; };
  const dano = ov("dano") ? formulaLimpa(comInt(ov("dano"), i)) : `${t.dano} + ${i}`;
  const cura = ov("cura") ? formulaLimpa(comInt(ov("cura"), i)) : `${t.cura} + ${i}`;
  return {
    etapa: ARQUETIPOS.artifice.projetos.indexOf(t) + 1,
    dano, cura, soma: num("soma", t.soma), protecao: num("protecao", t.protecao),
    porDia: Math.max(0, num("porDia", degrau(ARQUETIPOS.artifice.projetosPorDiaNivel, nivel)?.qtd ?? ARQUETIPOS.artifice.projetosPorDia)),
    ajustado: Object.keys(AJUSTES_PROJETO).filter(k => ov(k) !== null && k !== "livro"),
    proximo: proximoDegrau(ARQUETIPOS.artifice.projetos, nivel)?.nivel ?? null
  };
}

/** Limite do Livro de Projetos (0 se ainda não tem). */
export function limiteLivro(nivel, inteligencia = 0, ajustes = {}) {
  const t = degrau(ARQUETIPOS.artifice.livro, nivel);
  if (!t) return 0;
  const v = ajustes?.[AJUSTES_PROJETO.livro];
  if (v !== undefined && v !== null && String(v).trim() !== "") {
    const c = conta(comInt(v, intMin1(inteligencia)));
    if (c !== null) return Math.max(0, c);
  }
  return t.base;
}

/** Bônus do Pequeno Autômato (2.0 e 3.0) no nível dado. */
export function bonusAutomato(nivel) {
  return degrau(ARQUETIPOS.artifice.automato.melhorias, nivel) ?? { atributos: 0, recursos: 0 };
}

/** Bônus de PM máximo da Reserva Arcana. */
export function reservaArcana(nivel, dados = null) {
  const pm = degrau(ARQUETIPOS.conjurador.reservaArcana, nivel)?.pm ?? 0;
  return dados && pm ? Math.max(0, valorPessoal(dados, "arq-reserva-arcana", pm)) : pm;
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
export function modsDeArquetipo(dados = {}, armasEquipadas = [], agora = null, itensAtivos = armasEquipadas, statuses = []) {
  const out = [];
  if (agora !== null) out.push(...modsDeProjetos(dados, agora));
  const opc = dados.arquetipoOpcoes ?? {};
  const conj = nivelArquetipo(dados, "conjurador");
  if (conj) {
    const pm = reservaArcana(conj, dados);
    if (pm) out.push({ alvo: "recurso.pm", valor: pm, fonte: "Reserva Arcana (Conjurador)" });
  }
  const art = nivelArquetipo(dados, "artifice");
  if (art >= ARQUETIPOS.artifice.utensilios.nivel) {
    const lista = (Array.isArray(opc.artifice?.utensilios) ? opc.artifice.utensilios : [])
      .filter(p => p && !ARQUETIPOS.artifice.utensilios.exceto.includes(p)).slice(0, ARQUETIPOS.artifice.utensilios.qtd);
    const bonusUt = valorPessoal(dados, "arq-utensilios-bonus", ARQUETIPOS.artifice.utensilios.bonus);
    for (const p of lista) out.push({ alvo: `pericia.${p}`, valor: bonusUt, fonte: "Utensílios (Artífice)" });
  }
  const comb = nivelArquetipo(dados, "combatente");
  if (comb) {
    const m = efeitoMaestria(opc.combatente?.maestria, comb, dados);
    const comFavorita = armasEquipadas.some(a => eTipoFavorito(a, dados));
    if (m?.id === "protetora" && comFavorita) {
      out.push({ alvo: "ca", valor: m.ca, fonte: "Arma Protetora (Combatente)" });
      if (m.defesa) out.push({ alvo: "defesa.bloqueio", valor: m.defesa, fonte: "Arma Protetora (Combatente)" });
    }
    if (m?.id === "leve" && comFavorita && m.esquiva) out.push({ alvo: "defesa.esquiva", valor: m.esquiva, fonte: "Arma Leve (Combatente)" });
    const refl = degrau(ARQUETIPOS.combatente.reflexos, comb)?.valor;
    if (refl) out.push({ alvo: "pericia.reflexos", valor: valorPessoal(dados, "arq-reflexos-de-combate", refl), fonte: "Reflexos de Combate" });
    const estilos = estilosEscolhidos(dados, comb);
    if (estilos.includes("dupla") && armasEquipadas.length >= 2) {
      if (estiloVal(dados, "dupla", "ca")) out.push({ alvo: "ca", valor: estiloVal(dados, "dupla", "ca"), fonte: "Arma Dupla (Combatente)" });
      if (estiloVal(dados, "dupla", "esquiva")) out.push({ alvo: "defesa.esquiva", valor: estiloVal(dados, "dupla", "esquiva"), fonte: "Arma Dupla (Combatente)" });
    }
    const E = ARQUETIPOS.combatente.estilos;
    if (estilos.includes("defensivo") && itensAtivos.some(i => i.armadura > 0 || i.escudo)) {
      out.push({ alvo: "ca", valor: estiloVal(dados, "defensivo", "ca"), fonte: "Combate Defensivo" }, { alvo: "defesa.bloqueio", valor: estiloVal(dados, "defensivo", "defesa"), fonte: "Combate Defensivo" });
    }
    if (estilos.includes("bebado") && statuses.includes("epm-bebado")) {
      out.push({ alvo: "acerto", valor: estiloVal(dados, "bebado", "acerto"), fonte: "Bêbado (estilo)" }, { alvo: "defesa.esquiva", valor: estiloVal(dados, "bebado", "esquiva"), fonte: "Bêbado (estilo)" }, { alvo: "ca", valor: estiloVal(dados, "bebado", "ca"), fonte: "Bêbado (estilo)" });
    }
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
        icone: TIPOS_PROJETO[p.tipo].icone, estado, apagado: !!p.apagado, usado: voltaEm > 0, faltam: estado === "producao" ? prontoEm - agora : (estado === "recarga" ? voltaEm - agora : 0) };
    });
}

export { INT as ATRIBUTO_INTELECTO };


/* -------------------------------------------- */
/*  Valores do arquétipo ajustados por ficha     */
/* -------------------------------------------- */

const vazio = v => v === undefined || v === null || String(v).trim() === "";
/**
 * Valor de um número do arquetipo trocado só nesta ficha (flags.ajustesBonus[chave]).
 * Número: aceita conta simples ("2 + 3"); dado: texto ("2d8"). Vazio = valor do livro (ou do Mestre).
 */
export function valorPessoal(dados, chave, padrao) {
  const v = dados?.ajustesBonus?.[chave];
  if (vazio(v)) return padrao;
  if (typeof padrao === "number") { const c = conta(v); return c ?? padrao; }
  return String(v).trim();
}
export const chaveEstilo = (est, campo) => `arq-estilo-${est}-${campo}`.toLowerCase();
/** Número de um Estilo de Combate (Duelista, Arma Dupla…) para esta ficha. */
export const estiloVal = (dados, est, campo) => valorPessoal(dados, chaveEstilo(est, campo), ARQUETIPOS.combatente.estilos[est]?.[campo]);

/** Campos numéricos (ou de dado) de cada estilo, para a lista de ajustes. */
const CAMPOS_ESTILO = { defensivo: { defesa: "Defesa (Bloqueio)", ca: "CA" }, duelista: { acertoIsolado: "Acerto contra inimigo isolado" },
  bebado: { acerto: "Acerto", esquiva: "Esquiva", ca: "CA" }, atirador: { margemSempre: "Margem de crítico (sempre)", margem: "Margem abrindo mão do atributo" },
  longo: { dano: "Dano à distância", desarmado: "Dano desarmado" }, dupla: { acerto: "Acerto", esquiva: "Esquiva", ca: "CA" } };
const CAMPOS_MAESTRIA = { custo: "Custo (PE)", dano: "Dano", acerto: "Acerto", alcance: "Alcance (m)", ca: "CA", defesa: "Defesa (Bloqueio)", esquiva: "Esquiva", danoDex: "Dano com Destreza", margem: "Margem", mult: "Multiplicador", dadosCritico: "Dados extras no crítico", descontoAE: "Desconto no Ataque Extra (PE)" };

/**
 * Ataque Extra do Combatente nesta ficha: custo POR ataque e máximo de ataques (ajustáveis),
 * mais o desconto da Maestria Gêmea (2 PE no Nv. 21, 4 PE no Nv. 41, no total, mínimo 3).
 */
export function ataqueExtraDe(nivel, dados = {}) {
  const ae = degrau(ARQUETIPOS.combatente.ataqueExtra, nivel);
  if (!ae) return null;
  const opc = dados?.arquetipoOpcoes?.combatente ?? {};
  const gem = opc.maestria === "gemea" ? efeitoMaestria("gemea", nivel, dados) : null;
  const desconto = Math.max(0, gem?.descontoAE ?? 0);
  return {
    ...ae, custo: Math.max(0, valorPessoal(dados, "arq-ataque-extra-custo", ae.custo)), ataques: Math.max(0, valorPessoal(dados, "arq-ataque-extra-ataques", ae.ataques)), desconto,
    /** PE para n ataques adicionais. */
    custoDe(n) { const bruto = Math.max(0, n) * this.custo; return n > 0 ? Math.max(Math.min(3, bruto), bruto - this.desconto) : 0; }
  };
}
/** Fôlego de Combate (Combatente 10/22/35): dado de PE e usos por cena. */
export function folegoDe(nivel, dados = {}) {
  const f = degrau(ARQUETIPOS.combatente.folego, nivel);
  if (!f) return null;
  return { ...f, dado: valorPessoal(dados, "arq-folego-dado", f.dado), usos: Math.max(0, valorPessoal(dados, "arq-folego-usos", f.usos)) };
}
/** Quantas vezes o Fôlego de Combate já foi usado nesta cena (marcas "arq-folego-N" nos usos por cena). */
export const usosFolego = dados => Object.entries(dados?.usosFormas ?? {}).filter(([k, v]) => k.startsWith("arq-folego-") && v).length;
/** Caçador Natural nesta ficha (etapa do nível + ajustes): custo, acerto, esquiva, transferir. */
export function cacadorDe(nivel, dados = {}) {
  const c = ARQUETIPOS.combatente.cacador;
  const e = degrau(c.etapas, nivel);
  if (!e) return null;
  return {
    nivel: c.nivel, ca: c.ca, todoAcerto: e.todoAcerto, imunidadeVira: !!e.imunidadeVira,
    custo: Math.max(0, valorPessoal(dados, "arq-cacador-custo", c.custo)),
    acerto: valorPessoal(dados, "arq-cacador-acerto", e.acerto),
    esquiva: valorPessoal(dados, "arq-cacador-esquiva", e.esquiva),
    transferir: Math.max(0, valorPessoal(dados, "arq-cacador-transferir", e.transferir))
  };
}
/** Opções da Sobrecarga Mágica liberadas no nível. */
export const sobrecargaDe = nivel => ARQUETIPOS.conjurador.sobrecarga.opcoes.filter(o => nivel >= o.nivel);
/** Recuperar Mana do Conjurador nesta ficha. */
export function recuperarManaDe(nivel, dados = {}) {
  const r = degrau(ARQUETIPOS.conjurador.recuperarMana, nivel);
  if (!r) return null;
  return { ...r, pe: Math.max(0, valorPessoal(dados, "arq-recuperar-mana-pe", r.pe)), pm: Math.max(0, valorPessoal(dados, "arq-recuperar-mana-pm", r.pm)) };
}

/**
 * Tudo o que esta ficha pode trocar no arquétipo (para a lista "Valores do arquétipo"):
 * [{ chave, fonte, rotulo, padrao, formula }]. Só o que vale no nível e nas escolhas atuais.
 */
export function valoresAjustaveisArquetipo(dados = {}) {
  const out = [];
  const add = (chave, fonte, rotulo, padrao) => out.push({ chave, fonte, rotulo, padrao: String(padrao), formula: typeof padrao !== "number", origem: "arquetipo", atual: dados.ajustesBonus?.[chave] ?? "" });
  const comb = nivelArquetipo(dados, "combatente");
  if (comb) {
    const E = ARQUETIPOS.combatente.estilos;
    for (const est of estilosEscolhidos(dados, comb)) for (const [campo, rot] of Object.entries(CAMPOS_ESTILO[est] ?? {})) add(chaveEstilo(est, campo), E[est].nome, rot, E[est][campo]);
    const ae = degrau(ARQUETIPOS.combatente.ataqueExtra, comb);
    if (ae) { add("arq-ataque-extra-custo", "Ataque Extra", "Custo por ataque (PE)", ae.custo); add("arq-ataque-extra-ataques", "Ataque Extra", "Máximo de ataques", ae.ataques); }
    const mId = dados.arquetipoOpcoes?.combatente?.maestria;
    const m = mId ? efeitoMaestria(mId, comb) : null;
    if (m) for (const [campo, rot] of Object.entries(CAMPOS_MAESTRIA)) if (typeof m[campo] === "number" && (!["margem", "mult", "defesa", "esquiva", "danoDex", "dadosCritico", "descontoAE"].includes(campo) || m[campo]) && !(m.id === "leve" && campo === "acerto" && !m[campo])) add(`arq-maestria-${campo}`, `Maestria: ${m.nome}`, rot, m[campo]);
    const refl = degrau(ARQUETIPOS.combatente.reflexos, comb)?.valor;
    if (refl) add("arq-reflexos-de-combate", "Reflexos de Combate", "Reflexos", refl);
    const fol = degrau(ARQUETIPOS.combatente.folego, comb);
    if (fol) { add("arq-folego-dado", "Fôlego de Combate", "PE recuperados", fol.dado); add("arq-folego-usos", "Fôlego de Combate", "Usos por cena", fol.usos); }
    const cac = degrau(ARQUETIPOS.combatente.cacador.etapas, comb);
    if (cac) {
      add("arq-cacador-custo", "Caçador Natural", "Custo (PE)", ARQUETIPOS.combatente.cacador.custo);
      add("arq-cacador-acerto", "Caçador Natural", "Acerto contra a Presa", cac.acerto);
      if (cac.esquiva) add("arq-cacador-esquiva", "Caçador Natural", "Esquiva contra a Presa", cac.esquiva);
      add("arq-cacador-transferir", "Caçador Natural", "Transferir a Presa (PE)", cac.transferir);
    }
  }
  const conj = nivelArquetipo(dados, "conjurador");
  if (conj) {
    const res = reservaArcana(conj);
    if (res) add("arq-reserva-arcana", "Reserva Arcana", "PM máximo", res);
    const rec = degrau(ARQUETIPOS.conjurador.recuperarMana, conj);
    if (rec) { add("arq-recuperar-mana-pe", "Recuperar Mana", "Custo (PE)", rec.pe); add("arq-recuperar-mana-pm", "Recuperar Mana", "Mana recuperada", rec.pm); }
  }
  const art = nivelArquetipo(dados, "artifice");
  if (art) {
    const pt = projetosPadraoTexto(art);
    if (pt) {
      const rot = { dano: "Dano", cura: "Cura", soma: "Soma (testes)", protecao: "Proteção (CA)", porDia: "Projetos por dia", livro: "Livro de Projetos (limite)" };
      for (const k of Object.keys(AJUSTES_PROJETO)) if (pt[k]) out.push({ chave: AJUSTES_PROJETO[k], fonte: "Projetos", rotulo: /Int/.test(pt[k]) ? `${rot[k]} · "Int" = Inteligência` : rot[k], padrao: pt[k], formula: true, origem: "arquetipo", atual: dados.ajustesBonus?.[AJUSTES_PROJETO[k]] ?? "" });
    }
    if (art >= ARQUETIPOS.artifice.utensilios.nivel) add("arq-utensilios-bonus", "Utensílios", "Bônus nas perícias", ARQUETIPOS.artifice.utensilios.bonus);
  }
  return out;
}
