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
    funcao: "Transforma PE em desempenho físico, ataques adicionais, precisão, proteção e feitos lendários. O centro é o Arsenal de Maestrias: domina várias técnicas na Arma Favorita e as combina durante a luta. Continua podendo usar magia normalmente.",
    recursos: "PE Máximo = PE de Raça + PE de Classe + Constituição. AS em todo nível par (x2 no 50); Perícia a cada 5 níveis. Faixas: 1–10 base • 11–30 competente • 31–50 lendário.",
    progressao: progressao(`1 Arsenal de Maestrias • 2 AS • 3 Classe • 4 AS + Estilo • 5 Ataque Extra + Perícia • 6 AS + Classe • 7 Reflexos • 8 AS • 9 Classe • 10 AS + Fôlego + Perícia • 11 Maestrias etapa 2 • 12 AS + Classe • 13 Ataque Extra 2.0 • 14 AS • 15 Classe + Perícia • 16 AS • 17 Movimento Cauteloso • 18 AS + Classe • 19 Caçador Natural • 20 AS + Perícia • 21 Classe + Maestrias etapa 3 + 2ª Maestria • 22 AS + Fôlego 2.0 • 23 Comando de Campo • 24 AS + Classe • 25 Estilo 2.0 + Perícia • 26 AS • 27 Classe + Ataque Extra 3.0 • 28 AS • 30 AS + Classe + Perícia • 31 Maestrias etapa 4 • 32 AS • 33 Classe • 34 AS • 35 Fôlego 3.0 + Perícia • 36 AS + Classe • 37 Ataque Extra 4.0 • 38 AS • 39 Classe • 40 AS + Herói + Perícia • 41 Maestrias etapa 5 + 3ª Maestria • 42 AS + Classe • 43 Comando 2.0 • 44 AS • 45 Classe + Perícia • 46 AS + Ataque Extra 5.0 • 47 Caçador 2.0 • 48 AS + Classe • 49 Estilo 3.0 • 50 AS x2 + Perícia + Ímpeto Lendário`),
    habilidades: [
      { nivel: 1, nome: "Arsenal de Maestrias", resumo: "Escolha uma Arma Favorita e 1 Maestria nela (+1 Maestria no Nv. 21 e +1 no Nv. 41; não repete). Todas as Maestrias ficam na Arma Favorita e só valem com ela na mão (com permissão do Mestre, podem ser espalhadas por mais de uma arma favorita). Evoluem juntas nas etapas dos níveis 11, 21, 31 e 41. Saque de Arsenal: sacar ou guardar a Arma Favorita é ação livre, sem limite. Cada Maestria com custo em PE vale 1×/turno; Maestrias diferentes podem no mesmo turno. Retreino: a cada Descanso Longo, troque 1 Maestria ou a Arma Favorita. CD de Maestria = 10 + Luta (corpo a corpo) ou Pontaria (distância)." },
      { nivel: 4, nome: "Estilo de Combate", resumo: "Escolha um estilo: Duelista, Bêbado, Arma Dupla, Atirador, Combate Defensivo, Combate com Arma Pesada, Combate com Arma Leve ou Armamento Longo. Bônus de Acerto de estilo contam no Teto de Bônus." },
      { nivel: 5, nome: "Ataque Extra", resumo: "Ao usar a Ação de Ataque, gaste PE para fazer ataques adicionais: até +1 ataque, 6 PE cada. Só pode ativar uma vez por turno." },
      { nivel: 7, nome: "Reflexos de Combate", resumo: "+3 nos testes de Reflexo." },
      { nivel: 10, nome: "Fôlego de Combate", resumo: "1×/cena, Ação Bônus: recupera 2d6 PV." },
      { nivel: 11, nome: "Maestrias — etapa 2", resumo: "Todas as Maestrias evoluem para a etapa 2." },
      { nivel: 13, nome: "Ataque Extra 2.0", resumo: "Até +2 ataques, 6 PE cada." },
      { nivel: 17, nome: "Movimento Cauteloso", resumo: "Vantagem em testes de resistência contra armadilhas. Reflexos de Combate sobe para +5." },
      { nivel: 19, nome: "Caçador Natural", resumo: "12 PE ao entrar em combate (ou Ação Bônus depois): escolha uma Presa perceptível. Contra ela: +5 Acerto, +1 dado de dano nos acertos, ignora a Resistência dela (Imunidade não), +1 na CA e +2 em todas as reações (Bloqueio, Contra-ataque e Esquiva). Dura até o fim do combate; assim que a Presa cair, gaste 2 PE para escolher outra." },
      { nivel: 21, nome: "Maestrias — etapa 3 + 2ª Maestria", resumo: "Todas as Maestrias evoluem para a etapa 3. Aprende uma 2ª Maestria (já na etapa 3)." },
      { nivel: 22, nome: "Fôlego de Combate 2.0", resumo: "Recupera 4d6 PV." },
      { nivel: 23, nome: "Comando de Campo", resumo: "Ignora 1 ponto de Exaustão em combate. 1×/rodada, Ação Bônus e 12 PE: um aliado que possa te ver ou ouvir usa a Reação dele para fazer um ataque ou mover-se até metade do deslocamento sem provocar ataques." },
      { nivel: 25, nome: "Estilo de Combate 2.0", resumo: "Escolha um segundo estilo." },
      { nivel: 27, nome: "Ataque Extra 3.0", resumo: "Até +3 ataques, 6 PE cada." },
      { nivel: 31, nome: "Maestrias — etapa 4", resumo: "Todas as Maestrias evoluem para a etapa 4." },
      { nivel: 35, nome: "Fôlego de Combate 3.0", resumo: "Recupera 6d6 PV e pode ser usado 2×/cena." },
      { nivel: 37, nome: "Ataque Extra 4.0", resumo: "Até +3 ataques, 4 PE cada." },
      { nivel: 40, nome: "Herói", resumo: "1×/rodada, no turno de outra criatura, 20 PE: Ação Lendária imediata (um ataque sem Ataque Extra, mover até seu deslocamento, usar uma habilidade de Combatente de Ação Bônus ou proteger um aliado a até 1,5 m, virando o alvo do ataque). Com metade dos PV ou menos, realiza saltos extraordinários conforme a capacidade física e o cenário." },
      { nivel: 41, nome: "Maestrias — etapa 5 + 3ª Maestria", resumo: "Todas as Maestrias alcançam a evolução máxima. Aprende uma 3ª Maestria." },
      { nivel: 43, nome: "Comando de Campo 2.0", resumo: "Custa 10 PE e o aliado pode atacar e mover. Ao reduzir pessoalmente um inimigo a 0 PV, recupera 5 PE (1×/rodada)." },
      { nivel: 46, nome: "Ataque Extra 5.0", resumo: "Até +5 ataques, 5 PE cada." },
      { nivel: 47, nome: "Caçador Natural 2.0", resumo: "Contra a Presa, a Imunidade dela ao seu dano vira Resistência." },
      { nivel: 49, nome: "Estilo de Combate 3.0", resumo: "Escolha um terceiro estilo." },
      { nivel: 50, nome: "Ímpeto Lendário", resumo: "40 PE; 3 rodadas; 1×/cena. Ataque Extra custa metade (arredonde para cima); +5 Acerto, +2 Bloqueio e +2 Esquiva. 1×/rodada, ao sofrer dano, avança até seu deslocamento em direção ao atacante e ataca se chegar ao alcance. Consciente, efeitos físicos comuns não impedem seu movimento." }
    ],
    /** Ataque Extra: custo POR ataque adicional, até o máximo do nível (1 vez por turno). */
    ataqueExtra: [
      { nivel: 5, custo: 6, ataques: 1 }, { nivel: 13, custo: 6, ataques: 2 }, { nivel: 27, custo: 6, ataques: 3 },
      { nivel: 37, custo: 4, ataques: 3 }, { nivel: 46, custo: 5, ataques: 5 }
    ],
    /** Fôlego de Combate: PV recuperados e usos por cena. */
    folego: [{ nivel: 10, dado: "2d6", usos: 1 }, { nivel: 22, dado: "4d6", usos: 1 }, { nivel: 35, dado: "6d6", usos: 2 }],
    folegoRecurso: "pv",
    /** Reflexos de Combate: +3 (+5 no 17). */
    reflexos: [{ nivel: 7, valor: 3 }, { nivel: 17, valor: 5 }],
    /** Níveis em que as Maestrias mudam de etapa (etapa 1 a 5). */
    etapas: [1, 11, 21, 31, 41],
    /** Arsenal: quantas Maestrias por nível. */
    maestriasPorNivel: [{ nivel: 1, qtd: 1 }, { nivel: 21, qtd: 2 }, { nivel: 41, qtd: 3 }],
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
        texto: "Enquanto segura (equipa) a arma, ganha CA e Bloqueio." },
      leve: { nome: "Arma Leve", quando: "sempre",
        texto: "Nv. 1: reduz a categoria de peso. Nv. 11: pode usar Destreza com a arma. Nv. 21: sacar, guardar ou trocar a arma é ação livre (1×/turno) e +1 Esquiva. Nv. 31: se a arma já usa Destreza naturalmente, +3 de dano. Nv. 41: +5 de dano (total) e +1 Acerto." },
      gemea: { nome: "Gêmea", quando: "antes",
        niveis: [{ nivel: 1, custo: 3, ataques: 1 }, { nivel: 31, custo: 7, ataques: 2 }],
        texto: "Duas armas iguais compartilham a Maestria. Nv. 1: 1×/turno, como Ação Bônus e por 3 PE, ataca com a segunda arma sem somar o modificador ao dano. Nv. 11: soma o modificador. Nv. 21: o Ataque Extra custa 2 PE a menos no total (mín. 3). Nv. 31: o ataque de Ação Bônus pode ser repetido mais uma vez por +4 PE. Nv. 41: o Ataque Extra custa 4 PE a menos no total (mín. 3)." },
      perigosa: { nome: "Arma Perigosa", quando: "sempre", margem: [{ nivel: 1, valor: 1 }, { nivel: 21, valor: 2 }, { nivel: 41, valor: 3 }],
        mult: [{ nivel: 11, valor: 3 }, { nivel: 31, valor: 4 }],
        texto: "Com a arma, o crítico aumenta 1 nível de Perigo (20 → 19). Nv. 21: 2 níveis (20 → 18). Nv. 41: 3 níveis (20 → 17). Ao acertar um crítico, o multiplicador vira ×3 no Nv. 11 e ×4 no Nv. 31. A margem não garante o acerto." },
      esmagador: { nome: "Golpe Esmagador", quando: "acerto", custos: [3, 4, 5, 6, 7], resistencia: "fortitude",
        efeitos: ["empurra 1,5 m", "empurra 3 m ou fica Caído", "empurra 3 m e fica Caído", "empurra 3 m, fica Caído e Desestabilizado até o fim do próximo turno", "empurra 3 m, fica Caído e Desestabilizado até o fim do próximo turno; quem falhar por 5 ou mais também fica Atordoado até o fim do próximo turno"],
        texto: "Ao acertar, gaste PE: o alvo faz Fortitude contra a CD de Maestria. 3 PE: empurra 1,5 m • 4 PE: empurra 3 m ou fica Caído • 5 PE: empurra 3 m e fica Caído • 6 PE: também Desestabilizado até o fim do próximo turno • 7 PE: quem falhar por 5 ou mais também fica Atordoado até o fim do próximo turno." },
      sangrenta: { nome: "Arma Sangrenta", quando: "acerto", custos: [3, 4, 5, 6, 7], dados: ["1d4", "1d6", "1d8", "2d6", "2d8"], resistencia: "fortitude",
        texto: "Ao acertar, gaste PE: o alvo fica Sangrando e perde Vida no início de cada turno dele, até passar em Fortitude contra a CD de Maestria no fim do turno ou ser tratado. 3 PE/1d4 • 4 PE/1d6 • 5 PE/1d8 • 6 PE/2d6 • 7 PE/2d8. Aplicar de novo só renova (não acumula)." },
      sentinela: { nome: "Sentinela", quando: "sempre",
        texto: "Nv. 1: +1 ataque de oportunidade por rodada. Nv. 11: ataque de oportunidade que acerta zera o deslocamento do alvo até o fim do turno. Nv. 21: reação e 4 PE: ataca um inimigo no seu alcance que atacou um aliado. Nv. 31: +2 Acerto em ataques de oportunidade. Nv. 41: +2 ataques de oportunidade por rodada (total)." }
    },
    /** Estilos de Combate (1 no Nv. 4, 2 no Nv. 25, 3 no Nv. 49). */
    estilosPorNivel: [{ nivel: 4, qtd: 1 }, { nivel: 25, qtd: 2 }, { nivel: 49, qtd: 3 }],
    estilos: {
      duelista:  { nome: "Duelista",  texto: "+8 Acerto contra um inimigo que não tenha outros inimigos seus a até 1,5 m dele.", acertoIsolado: 8 },
      bebado:    { nome: "Bêbado", texto: "Com a condição Bêbado: +3 Acerto, +1 Esquiva e +1 CA (no lugar das penalidades). Ainda fica Exausto e Desequilibrado depois de 2 horas.", acerto: 3, esquiva: 1, ca: 1 },
      dupla:     { nome: "Arma Dupla", texto: "Usando duas armas: +2 Acerto e +1 Esquiva.", acerto: 2, esquiva: 1, ca: 0 },
      atirador:  { nome: "Atirador",  texto: "Margem de crítico +1 com armas a distância; ou +4 de margem abrindo mão do atributo no dano. A margem não garante o acerto.", margem: 4, margemSempre: 1 },
      defensivo: { nome: "Combate Defensivo", texto: "Com Escudo ou Armadura: +2 no Bloqueio e +1 na CA.", defesa: 2, ca: 1 },
      pesada:    { nome: "Combate com Arma Pesada", texto: "Com arma Pesada (ou de peso maior): ao acertar um crítico, faz mais um ataque. 1×/turno." },
      leve:      { nome: "Combate com Arma Leve", texto: "Com arma Leve (ou de peso menor): pode rolar de novo os dados de dano que derem 1 ou 2." },
      longo:     { nome: "Armamento Longo", texto: "Com arma a distância Pesada ou Enorme: +1d6 de dano. Também pode atacar corpo a corpo desarmado com ela (coronhada), causando +1d4 de dano.", dano: "1d6", desarmado: "1d4" }
    },
    /** Caçador Natural: custo para marcar, bônus contra a Presa e custo para trocar quando ela cai. */
    cacador: { nivel: 19, custo: 12, acerto: 5, transferir: 2, ca: 1, reacoes: 2, todoAcerto: true,
      etapas: [{ nivel: 19, acerto: 5, esquiva: 2, transferir: 2, todoAcerto: true }, { nivel: 47, acerto: 5, esquiva: 2, transferir: 2, todoAcerto: true, imunidadeVira: true }] },
    impetoAcerto: 5
  },

  conjurador: {
    id: "conjurador", nome: "Conjurador", icone: "fa-solid fa-hat-wizard", cor: "#8A7CE0",
    funcao: "Acumula magias e domina a mana. Qualquer arquétipo pode aprender magias, mas o Conjurador é quem mais conhece e o único que consegue moldar e potencializar as próprias magias. A cada nível aprende uma magia nova de graça. O PE molda as magias (alcance, área, dados extras) e o PM as conjura.",
    recursos: "PE Máximo = PE de Raça + PE de Classe + Constituição. PM Máximo = PM de Raça + PM de Classe + Núcleo. CD de magia = 10 + Arcanismo; acerto = d20 + Arcanismo. AS em todo nível par (x2 no 50); Perícia a cada 5 níveis. Círculos: 1º no Nv. 1 • 2º no 10 • 3º no 19 • 4º no 29 • 5º no 38 • 6º no 45.",
    progressao: progressao(`1 Marcado pela Mana (3 magias e 3 Truques) • 2 AS • 3 Classe • 4 AS • 5 Manipulação Mágica + Perícia • 6 AS + Classe • 7 Olhar de Mana • 8 AS • 9 Classe • 10 AS + Magia 2 + Perícia • 11 Recuperar Mana • 12 AS + Classe • 13 Conjuração Precisa • 14 AS + Canalização • 15 Classe + Magia Assinatura + Perícia • 16 AS • 17 Conjuração Dupla • 18 AS + Classe • 19 Magia 3 • 20 AS + Perícia • 21 Classe + Barreira Arcana • 22 AS + Corpo de Mana • 23 Conjuração Reativa • 24 AS + Classe • 25 Sustentação Mágica + Perícia • 26 AS + Reserva Arcana • 27 Classe • 28 AS • 29 Magia 4 • 30 AS + Classe + Perícia • 31 Manipulação 2.0 • 32 AS • 33 Classe • 34 AS + Domínio de Conjuração • 35 Maestria Elemental + Perícia • 36 AS + Classe • 37 Sobrecarga Mágica • 38 AS + Magia 5 • 39 Classe + 2ª Magia Assinatura • 40 AS + Perícia • 41 Zona de Mana • 42 AS + Classe • 43 Eco Arcano • 44 AS • 45 Classe + Perícia + Magia 6 • 46 AS + Corpo de Mana 2.0 • 48 AS + Classe • 49 Canalização Suprema • 50 AS x2 + Perícia + Zona de Mana 2.0`),
    habilidades: [
      { nivel: 1, nome: "Marcado pela Mana", resumo: "Acúmulo de Magias: começa com 3 magias de 1º círculo e 3 Truques e ganha +1 magia gratuita em todo nível (Nv. 2 ao 50), de qualquer círculo já liberado; +1 Truque nos níveis 10, 20, 30, 40 e 50. A cada Descanso Longo, pode trocar 1 magia por outra do mesmo círculo ou menor. Magias da Classe, de pergaminhos, mestres ou treinamentos somam por fora. Pode detectar magia e perceber a Aura de criaturas, objetos e fenômenos mágicos." },
      { nivel: 5, nome: "Manipulação Mágica", resumo: "Ao conjurar, gaste 5 PE para escolher uma modificação: aumentar alcance; aumentar área em uma categoria; conjurar sem movimentos; ou excluir até 2 criaturas da área. Uma vez por magia." },
      { nivel: 7, nome: "Olhar de Mana", resumo: "Percebe natureza, intensidade, elemento predominante e magias ativas de alvos, objetos e fenômenos mágicos." },
      { nivel: 10, nome: "Magia 2", resumo: "Desbloqueia magias de 2º círculo." },
      { nivel: 11, nome: "Recuperar Mana", resumo: "1×/cena, use uma ação e gaste PE para recuperar PM. Melhora sozinha com o nível: 10 PE → 10 PM (Nv. 11) • 12 PE → 18 PM (Nv. 22) • 15 PE → 25 PM (Nv. 35) • 20 PE → 35 PM (Nv. 43)." },
      { nivel: 13, nome: "Conjuração Precisa", resumo: "Manipulação Mágica pode excluir até 4 criaturas de magias em área." },
      { nivel: 14, nome: "Canalização", resumo: "Use uma ação para canalizar; gaste 8 PE e escolha +1 dado de dano, +1 dado de cura, aumentar a duração ou aumentar o alcance em uma categoria. Conjure até o fim do próximo turno." },
      { nivel: 15, nome: "Magia Assinatura", resumo: "Escolha uma magia conhecida de até 2º círculo: ela custa metade dos PM (arredonda para cima) e é sempre conjurada sem movimentos. No Nv. 39, escolhe uma segunda, de até 4º círculo. Pode trocar a escolha ao subir de nível." },
      { nivel: 17, nome: "Conjuração Dupla", resumo: "Ao conjurar uma magia ou Truque, gaste 10 PE para conjurar outra na mesma ação, pagando os PM das duas. A segunda tem que ser de círculo igual ou menor que a primeira. 1×/rodada." },
      { nivel: 19, nome: "Magia 3", resumo: "Desbloqueia magias de 3º círculo." },
      { nivel: 21, nome: "Barreira Arcana", resumo: "Reação, 1×/rodada, sem gastar ação do próximo turno: ao ser atingido por um ataque ou magia, gaste PM para reduzir o dano em 2 por PM gasto. Máximo de PM por uso = 2 × Núcleo." },
      { nivel: 22, nome: "Corpo de Mana", resumo: "Gaste 6 PM por rodada para flutuar (voo com o seu deslocamento) e andar por paredes e tetos." },
      { nivel: 23, nome: "Conjuração Reativa", resumo: "Gaste 10 PE (mais os PM da magia) para conjurar uma magia ou Truque como reação a uma ação que ela possa afetar diretamente. 1×/rodada." },
      { nivel: 25, nome: "Sustentação Mágica", resumo: "Gaste 8 PE quando a concentração ou sustentação seria interrompida para mantê-la automaticamente." },
      { nivel: 26, nome: "Reserva Arcana", resumo: "+10 PM Máximo. Melhora sozinha: +25 no Nv. 41 e +40 no Nv. 49." },
      { nivel: 29, nome: "Magia 4", resumo: "Desbloqueia magias de 4º círculo." },
      { nivel: 31, nome: "Manipulação Mágica 2.0", resumo: "Pode aplicar 2 modificações ao mesmo tempo por 10 PE." },
      { nivel: 34, nome: "Domínio de Conjuração", resumo: "Escolha uma especialização permanente: Alcance (categoria extra de alcance); Área (categoria extra de área); Controle (exclui +2 alvos de áreas); Sustentação (mantém mais uma magia ao mesmo tempo). Pode trocar a especialização a cada nível que subir." },
      { nivel: 35, nome: "Maestria Elemental", resumo: "Escolha um tipo de dano. Suas magias desse tipo ganham +1 dado de dano e ignoram Resistência a ele (Imunidade continua valendo). Pode trocar o tipo a cada nível que subir." },
      { nivel: 37, nome: "Sobrecarga Mágica", resumo: "Uma vez por magia: 12 PE por +1 dado de dano ou cura, ou 22 PE por +2 dados. Acumula com Canalização." },
      { nivel: 38, nome: "Magia 5", resumo: "Desbloqueia magias de 5º círculo." },
      { nivel: 41, nome: "Zona de Mana", resumo: "1×/cena, sustentada. Ativação: 40 PM + 25 PE; para manter, paga metade a cada turno (20 PM + 13 PE) e termina quando parar de pagar. Cria uma grande zona ao seu redor. Enquanto ativa, move-se no ar, nas paredes, no teto ou no chão; magias podem surgir de qualquer ponto da zona, que também serve como origem; percebe manifestações de mana e o ambiente assume traços da sua magia." },
      { nivel: 43, nome: "Eco Arcano", resumo: "1×/cena, no turno seguinte a conjurar uma magia de até 5º círculo, pode conjurá-la de novo como Ação Bônus sem gastar PM (modificações pagas com PE custam normal)." },
      { nivel: 45, nome: "Magia 6", resumo: "Desbloqueia magias de 6º círculo." },
      { nivel: 46, nome: "Corpo de Mana 2.0", resumo: "O Corpo de Mana não custa mais PM e o deslocamento de voo dobra." },
      { nivel: 49, nome: "Canalização Suprema", resumo: "O bônus da Canalização dobra: +2 dados de dano ou cura, o dobro do aumento de duração ou +2 categorias de alcance." },
      { nivel: 50, nome: "Zona de Mana 2.0", resumo: "A ativação cai para 30 PM + 20 PE e a manutenção para 15 PM + 10 PE por turno. Dentro dela, a primeira modificação paga com PE em cada turno (Manipulação, Canalização ou Sobrecarga) sai de graça." }
    ],
    /** Custo em PM por círculo (0 = Truque). */
    custosMagia: [0, 6, 10, 14, 18, 24, 32],
    /** Nível de Conjurador que libera cada círculo. */
    circulos: { 0: 1, 1: 1, 2: 10, 3: 19, 4: 29, 5: 38, 6: 45 },
    /** Acúmulo de Magias: 3 magias no Nv. 1 e +1 por nível; 3 Truques e +1 nos níveis 10, 20, 30, 40 e 50. */
    acumulo: { magiasIniciais: 3, truquesIniciais: 3, truquesNiveis: [10, 20, 30, 40, 50] },
    /** Origens de magia que NÃO contam no Acúmulo (somam por fora). */
    origensForaAcumulo: ["classe", "raca", "arma", "treinamento", "talento", "transformacao", "maestria", "meme", "pergaminho"],
    truques: [{ nivel: 1, qtd: 3 }, { nivel: 10, qtd: 4 }, { nivel: 20, qtd: 5 }, { nivel: 30, qtd: 6 }, { nivel: 40, qtd: 7 }, { nivel: 50, qtd: 8 }],
    reservaArcana: [{ nivel: 26, pm: 10 }, { nivel: 41, pm: 25 }, { nivel: 49, pm: 40 }],
    recuperarMana: [{ nivel: 11, pe: 10, pm: 10 }, { nivel: 22, pe: 12, pm: 18 }, { nivel: 35, pe: 15, pm: 25 }, { nivel: 43, pe: 20, pm: 35 }],
    manipulacao: {
      nivel: 5, custo: 5, custoDupla: 10, nivelDupla: 31, nivelPrecisa: 13,
      opcoes: ["Aumentar o alcance", "Aumentar a área em uma categoria", "Conjurar sem movimentos", "Excluir criaturas da área"]
    },
    /** Sobrecarga: acumula com Canalização. */
    sobrecarga: { nivel: 37, acumulaCanalizacao: 37, opcoes: [{ nivel: 37, pe: 12, dados: 1 }, { nivel: 37, pe: 22, dados: 2 }] },
    canalizacao: { nivel: 14, pe: 8, suprema: 49 },
    assinatura: [{ nivel: 15, qtd: 1, circuloMax: 2 }, { nivel: 39, qtd: 2, circuloMax: 4 }],
    barreira: { nivel: 21, reducaoPorPm: 2 },
    corpoDeMana: [{ nivel: 22, pm: 6, vooDobro: false }, { nivel: 46, pm: 0, vooDobro: true }],
    maestriaElemental: { nivel: 35 },
    eco: { nivel: 43, circuloMax: 5 },
    dominioNivel: 34,
    zonaDeMana: [{ nivel: 41, pm: 40, pe: 25, manterPm: 20, manterPe: 13, uso: "cena" }, { nivel: 50, pm: 30, pe: 20, manterPm: 15, manterPe: 10, uso: "cena", modGratis: true }],
    dominios: { alcance: "Alcance: categoria extra de alcance", area: "Área: categoria extra de área", controle: "Controle: exclui +2 alvos de áreas", sustentacao: "Sustentação: mantém mais uma magia ao mesmo tempo" }
  },

  artifice: {
    id: "artifice", nome: "Artífice", icone: "fa-solid fa-screwdriver-wrench", cor: "#C9A24E",
    funcao: "Inventa, prepara e monta Projetos: Consumíveis de uso único e Engenhocas que duram algumas cenas antes de precisar de reparo. Planeja no descanso e improvisa no meio da luta, gastando PE para manter as máquinas funcionando. Todo Projeto é de Dano, Cura, Soma ou Proteção.",
    recursos: "Classes: Alquimista, Armadura Viva, Curandeiro, Mecânico de Guerra, Master of Puppets e Caçador. CD de Projeto = 10 + Inteligência + metade do bônus do Ofício (ou Tecnologia) sem o atributo; ataques de Projeto = d20 + Ofício (ou Tecnologia). AS em todo nível par (x2 no 50); Perícia a cada 5 níveis. Faixas: 1–10 base • 11–30 competente • 31–50 lendário.",
    progressao: progressao(`1 Criar Projetos • 2 AS • 3 Subclasse + Sobrecarga • 4 AS • 5 Utensílios + Perícia • 6 AS + Subclasse • 7 Bolsa Automática • 8 AS • 9 Subclasse + Itens Encantados • 10 AS + Perícia • 11 Criar Projetos 2.0 + Modificações Permanentes • 12 AS + Subclasse • 13 Itens Encantados 2.0 • 14 AS • 15 Subclasse + Montagem Ágil + Perícia • 16 AS • 17 Pequeno Autômato • 18 AS + Subclasse • 19 Corpo Modificado • 20 AS + Perícia • 21 Subclasse + Criar Projetos 3.0 • 22 AS • 23 Mudança de Planos • 24 AS + Subclasse • 25 Itens Encantados 3.0 + Perícia • 26 AS • 27 Subclasse • 28 AS • 29 Pequeno Autômato 2.0 • 30 AS + Subclasse + Perícia • 31 Criar Projetos 4.0 + Engenharia Reversa • 32 AS • 33 Subclasse • 34 AS • 35 Linha de Montagem + Modificações 2.0 + Perícia • 36 AS + Subclasse • 37 Itens Encantados 4.0 • 38 AS • 39 Subclasse + Mudança de Planos 2x • 40 AS + Perícia • 41 Criar Projetos 5.0 + Pequeno Autômato 3.0 • 42 AS + Subclasse • 43 Estudo de Espécie • 44 AS • 45 Subclasse + Perícia • 46 AS • 47 Itens Encantados 5.0 • 48 AS + Subclasse • 49 Reconstrução Mecânica • 50 AS x2 + Perícia + Mente Inventora`),
    habilidades: [
      { nivel: 1, nome: "Criar Projetos", resumo: "Reserva de Projetos de Criação = metade da Inteligência (para cima; mín. 1), Grau I, Livro de Projetos com 4 receitas (pelo menos 1 Consumível e 1 Engenhoca; troca 1 receita por Descanso Longo). Consumíveis custam 1 Projeto e duram até ser usados (carrega até 2× seus Projetos). Engenhocas ocupam Projetos enquanto existem e duram cenas (só gastam cena na cena em que são usadas; com 0 ficam Quebradas). A reserva volta no Descanso Longo (menos o que as Engenhocas ocupam) e recupera ¼ (mín. 1) no Descanso Curto. CD de Projeto = 10 + Inteligência + metade do bônus do Ofício sem o atributo (pontos + Outros; ex.: Int 6, Ofício 5 e +3 em Outros → 10 + 6 + 4 = 20). Dá para usar Tecnologia no lugar do Ofício. Ataques = d20 + a perícia. Montagem em Campo: Ação Padrão, gasta 1 Projeto em aberto e monta um Consumível do Livro. Reparo Rápido: Ação Bônus e 5 PE, uma Engenhoca a até 1,5 m recupera 1 cena (1× por cena por Engenhoca)." },
      { nivel: 3, nome: "Sobrecarga", resumo: "Ao ativar uma Engenhoca, ela funciona como 1 Grau acima naquele uso, mas perde 1 cena de Durabilidade. Acima do Grau V: +2 dados no Dano e na Cura, ou +2 na Soma e na Proteção." },
      { nivel: 5, nome: "Utensílios", resumo: "Escolha 3 perícias, exceto Luta e Pontaria. Num teste com uma delas, pode gastar 4 PE para somar +1d4. O dado sobe com os Itens Encantados: +1d6 no 13, +1d8 no 25, +2d6 no 37 e +2d8 no 47." },
      { nivel: 7, nome: "Bolsa Automática", resumo: "1×/turno, sacar um Projeto (Consumível ou Engenhoca portátil) é ação livre. Pegar ou guardar outros itens da mochila usa Ação Bônus em vez de Ação Normal." },
      { nivel: 9, nome: "Itens Encantados", resumo: "Encanta as peças dos Projetos. 1×/turno, um dano causado por Projeto [Dano] ganha +1d4; Projetos [Cura] curam +1; bônus de Projetos [Soma] e [Proteção] ganham +1 (Auxílio). Evolui nos níveis 13, 25, 37 e 47." },
      { nivel: 11, nome: "Criar Projetos 2.0", resumo: "Projetos de Criação = Inteligência; Grau II; Livro com 6 receitas." },
      { nivel: 11, nome: "Modificações Permanentes", resumo: "Instala partes mecânicas em até 2 criaturas (você conta). Cada uma recebe uma parte, com uma opção: Pernas (+2 Atletismo, +2 Acrobacia ou +1,5 m de deslocamento); Braços (+2 Luta, +2 Bloqueio ou +2 Contra-ataque); Olhos (+2 Percepção, +2 Pontaria ou visão no escuro 18 m); Tronco (+2 Fortitude, +2 Esquiva ou RD física 2); Cabeça (+2 Ofício, +2 Intuição ou +2 Investigação). Trocar leva um Descanso Longo." },
      { nivel: 13, nome: "Itens Encantados 2.0", resumo: "Dano +1d6 • Cura +2 • Auxílio +1. Utensílios passa a +1d6." },
      { nivel: 15, nome: "Montagem Ágil", resumo: "A Montagem em Campo passa a usar Ação Bônus: dá para montar e usar no mesmo turno." },
      { nivel: 17, nome: "Pequeno Autômato", resumo: "Cria um autômato pequeno. Usa sua Inteligência e seu Carisma; Força 4, Destreza 5, Constituição 6, Núcleo 2 e os recursos de um autômato básico." },
      { nivel: 19, nome: "Corpo Modificado", resumo: "Após cada Descanso Longo, você e cada criatura com Modificações Permanentes escolhem até 2: vantagem em um tipo de Teste de Resistência; uma proficiência que não possuía; +2 Acerto; ou +3 Dano." },
      { nivel: 21, nome: "Criar Projetos 3.0", resumo: "Projetos de Criação = Inteligência + 2; Grau III; Livro com 8 receitas." },
      { nivel: 23, nome: "Mudança de Planos", resumo: "1×/cena, ao falhar em um teste, gaste 8 PE: a ação usada não é gasta e você pode agir com ela de novo. PE gastos no teste que falhou são perdidos. A partir do Nv. 39, 2×/cena." },
      { nivel: 25, nome: "Itens Encantados 3.0", resumo: "Dano +1d8 • Cura +3 • Auxílio +2. Utensílios passa a +1d8." },
      { nivel: 29, nome: "Pequeno Autômato 2.0", resumo: "O autômato recebe +1 em todos os atributos e +10 PV, PE e PM." },
      { nivel: 31, nome: "Criar Projetos 4.0", resumo: "Projetos de Criação = Inteligência + 4; Grau IV; Livro com 10 receitas." },
      { nivel: 31, nome: "Engenharia Reversa", resumo: "1× por Descanso Longo, examina (Ação Padrão e Ofício contra a CD do efeito, ou 15 + nível da criatura) uma arma, item, armadilha ou parte de uma criatura derrotada. Ganha uma receita temporária que copia um efeito dela, adaptada pelo Mestre a um tipo (Dano, Cura, Soma ou Proteção) e ao seu Grau. A receita fica no Livro, além do limite, até o próximo Descanso Longo." },
      { nivel: 35, nome: "Linha de Montagem", resumo: "1×/turno, a Montagem em Campo é ação livre." },
      { nivel: 35, nome: "Modificações Permanentes 2.0", resumo: "Até 3 criaturas, e os bônus das Modificações sobem para +5 (Pernas +3 m; Olhos: visão no escuro 36 m e +2 Percepção; Tronco: RD física 5)." },
      { nivel: 37, nome: "Itens Encantados 4.0", resumo: "Dano +2d6 • Cura +4 • Auxílio +3. Utensílios passa a +2d6." },
      { nivel: 41, nome: "Criar Projetos 5.0", resumo: "Projetos de Criação = Inteligência + 6; Grau V; Livro com 12 receitas." },
      { nivel: 41, nome: "Pequeno Autômato 3.0", resumo: "O bônus do autômato passa a +2 em todos os atributos e +25 PV, PE e PM." },
      { nivel: 43, nome: "Estudo de Espécie", resumo: "Recebe +2 em Inteligência e pode ultrapassar o máximo normal dela em 2. Ao gastar metade de um descanso estudando um espécime (morto, incapacitado ou voluntário), recebe contra a mesma espécie: Resistência ao principal tipo de dano dela, +1 dado de dano, Vantagem em testes contra ela, +1 PT e 20 PV temporários. Só uma espécie estudada por vez; dura até o próximo descanso ou até cair a 0 PV. Toda espécie estudada fica registrada no Livro de Projetos." },
      { nivel: 47, nome: "Itens Encantados 5.0", resumo: "Dano +2d8 • Cura +5 • Auxílio +4. Utensílios passa a +2d8." },
      { nivel: 49, nome: "Reconstrução Mecânica", resumo: "Com o corpo de uma criatura de espécie registrada no Livro, constrói um servo que obedece ao Artífice e age no turno dele (comando com Ação Bônus). Constructo: o corpo vira metal; mantém Força, Destreza, Constituição e os ataques naturais, ganha RD física 5 e imunidade a Envenenado e a efeitos de mente, e perde magias e Núcleo. Zumbi Robótico: carne com implantes; mantém também as habilidades físicas especiais da espécie (sopro, veneno natural, voo), mas tem metade dos PV. Custo: 30 dias e 50 PEv. Só um servo por vez. Corpo Reserva: pode construir uma réplica robótica de si (45 dias e 80 PEv); se morrer, desperta nela no amanhecer seguinte. Só uma réplica por vez." },
      { nivel: 50, nome: "Mente Inventora", resumo: "Projetos de Criação = Inteligência + 8 e Livro com 14 receitas. A Sobrecarga vira passiva: todas as Engenhocas funcionam sempre 1 Grau acima e não perdem cenas por isso." }
    ],
    /** Criar Projetos: reserva (Inteligência), Grau máximo e tamanho do Livro por nível. */
    criacao: [
      { nivel: 1, projetos: "metade", extra: 0, grau: 1, livro: 4 },
      { nivel: 11, projetos: "int", extra: 0, grau: 2, livro: 6 },
      { nivel: 21, projetos: "int", extra: 2, grau: 3, livro: 8 },
      { nivel: 31, projetos: "int", extra: 4, grau: 4, livro: 10 },
      { nivel: 41, projetos: "int", extra: 6, grau: 5, livro: 12 },
      { nivel: 50, projetos: "int", extra: 8, grau: 5, livro: 14 }
    ],
    /** Valores por Grau (I a V). "Int" = Inteligência do Artífice. */
    graus: [
      { grau: 1, dano: "2d6", cura: "2d4", soma: 3, protecao: 3, aprimoramento: "2d6", cenas: 2, ocupa: 1 },
      { grau: 2, dano: "3d8", cura: "2d8", soma: 4, protecao: 4, aprimoramento: "3d8", cenas: 3, ocupa: 1 },
      { grau: 3, dano: "4d10", cura: "3d10", soma: 6, protecao: 5, aprimoramento: "4d10", cenas: 4, ocupa: 2 },
      { grau: 4, dano: "6d10", cura: "4d12", soma: 8, protecao: 6, aprimoramento: "6d10", cenas: 5, ocupa: 2 },
      { grau: 5, dano: "8d10", cura: "6d12", soma: 10, protecao: 8, aprimoramento: "8d10", cenas: 6, ocupa: 3 }
    ],
    sobrecargaNivel: 3, menteInventora: 50,
    montagem: [{ nivel: 1, acao: "padrao", label: "Ação Padrão" }, { nivel: 15, acao: "bonus", label: "Ação Bônus" }, { nivel: 35, acao: "livre", label: "ação livre (1×/turno)" }],
    reparo: { pe: 5 },
    encantados: [
      { nivel: 9, dano: "1d4", cura: 1, auxilio: 1 },
      { nivel: 13, dano: "1d6", cura: 2, auxilio: 1 },
      { nivel: 25, dano: "1d8", cura: 3, auxilio: 2 },
      { nivel: 37, dano: "2d6", cura: 4, auxilio: 3 },
      { nivel: 47, dano: "2d8", cura: 5, auxilio: 4 }
    ],
    /** Utensílios: 3 perícias; 4 PE por +dado num teste (o dado sobe com os Itens Encantados). */
    utensilios: { nivel: 5, qtd: 3, pe: 4, dados: [{ nivel: 5, dado: "1d4" }, { nivel: 13, dado: "1d6" }, { nivel: 25, dado: "1d8" }, { nivel: 37, dado: "2d6" }, { nivel: 47, dado: "2d8" }], exceto: ["luta", "pontaria"] },
    modificacoes: [{ nivel: 11, criaturas: 2, bonus: 2 }, { nivel: 35, criaturas: 3, bonus: 5 }],
    /** Modificações Permanentes por parte do corpo: [opção, alvo da ficha, valor no 11, valor no 35]. */
    partesModificacao: {
      pernas: { nome: "Pernas", opcoes: [["Atletismo", "pericia.atletismo", 2, 5], ["Acrobacia", "pericia.acrobacia", 2, 5], ["Deslocamento", "deslocamento", 1.5, 3]] },
      bracos: { nome: "Braços", opcoes: [["Luta", "pericia.luta", 2, 5], ["Bloqueio", "defesa.bloqueio", 2, 5], ["Contra-ataque", "defesa.contra", 2, 5]] },
      olhos: { nome: "Olhos", opcoes: [["Percepção", "pericia.percepcao", 2, 5], ["Pontaria", "pericia.pontaria", 2, 5], ["Visão no escuro", "visao", 18, 36]] },
      tronco: { nome: "Tronco", opcoes: [["Fortitude", "pericia.fortitude", 2, 5], ["Esquiva", "defesa.esquiva", 2, 5], ["RD física", "rd", 2, 5]] },
      cabeca: { nome: "Cabeça", opcoes: [["Ofício", "pericia.oficio", 2, 5], ["Intuição", "pericia.intuicao", 2, 5], ["Investigação", "pericia.investigacao", 2, 5]] }
    },
    automato: {
      nivel: 17,
      atributos: { nucleo: 2, forca: 4, destreza: 5, constituicao: 6 },
      melhorias: [{ nivel: 29, atributos: 1, recursos: 10 }, { nivel: 41, atributos: 2, recursos: 25 }]
    },
    subclasses: ["Alquimista", "Armadura Viva", "Curandeiro", "Mecânico de Guerra", "Master of Puppets", "Caçador"]
  }
};
// Ref de cada habilidade: "arquetipo:nivel" (a 2ª do mesmo nível vira "arquetipo:nivel.2", e assim por diante)
for (const [id, a] of Object.entries(ARQUETIPOS)) {
  a.habilidades?.sort((x, y) => x.nivel - y.nivel);
  const vistos = {};
  for (const h of a.habilidades ?? []) { vistos[h.nivel] = (vistos[h.nivel] ?? 0) + 1; h.ref = vistos[h.nivel] > 1 ? `${id}:${h.nivel}.${vistos[h.nivel]}` : `${id}:${h.nivel}`; }
}

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

/** Quantas Maestrias o Arsenal permite no nível (1 no Nv. 1, 2 no 21, 3 no 41). */
export const maestriasPermitidas = nivel => degrau(ARQUETIPOS.combatente.maestriasPorNivel, nivel)?.qtd ?? 0;

/**
 * Maestrias escolhidas do Arsenal que valem no nível (sem repetir; o excedente fica guardado, mas não vale).
 */
export function maestriasEscolhidas(dados = {}, nivel = null) {
  const n = nivel ?? nivelArquetipo(dados, "combatente");
  const opc = dados.arquetipoOpcoes?.combatente ?? {};
  const lista = Array.isArray(opc.maestrias) ? opc.maestrias : [];
  return [...new Set(lista.filter(m => ARQUETIPOS.combatente.maestrias[m]))].slice(0, maestriasPermitidas(n));
}

/** Regra opcional do Mestre: Maestrias espalhadas por mais de uma arma favorita. */
export function variasArmasFavoritas() {
  try { return !!globalThis.game?.settings?.get("epm-ficha", "regrasOpcionais")?.maestriasVariasArmas; } catch { return false; }
}

/** Tipo de arma de cada Maestria (com a regra opcional, cada uma pode ter o seu; senão, todas na Arma Favorita). */
export function tipoDaMaestria(dados = {}, id) {
  const opc = dados.arquetipoOpcoes?.combatente ?? {};
  const proprio = variasArmasFavoritas() ? String(opc.maestriaTipos?.[id] ?? "").trim() : "";
  return proprio || String(opc.tipoFavorito ?? "").trim();
}

/** Efeitos das Maestrias que valem com esta arma na mão (lista vazia se ela não é favorita). */
export function maestriasDaArma(item, dados = {}, nivel = null) {
  const n = nivel ?? nivelArquetipo(dados, "combatente");
  if (!item || !n) return [];
  const tipo = norm(tipoDaArma(item));
  if (!tipo) return [];
  return maestriasEscolhidas(dados, n).filter(id => norm(tipoDaMaestria(dados, id)) === tipo).map(id => efeitoMaestria(id, n, dados)).filter(Boolean);
}

/** CD de Maestria = 10 + Luta (corpo a corpo) ou Pontaria (distância). */
export const cdMaestria = (ficha, distancia = false) => 10 + Math.floor(Number(ficha?.periciaPorId?.[distancia ? "pontaria" : "luta"]?.total) || 0);

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
  if (m.dados) out.dadosSangue = m.dados[i];
  if (m.efeitos) out.efeito = m.efeitos[i];
  if (m.resistencia) out.resistencia = m.resistencia;
  if (id === "sentinela") {
    out.oportunidades = nivel >= 41 ? 2 : 1;
    out.zeraDesl = nivel >= 11;
    out.reacaoAliado = nivel >= 21 ? 4 : 0;
    out.acertoOportunidade = nivel >= 31 ? 2 : 0;
  }
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
  // Ajuste desta ficha (Valores do arquétipo): custo, dano, acerto… (uma chave por Maestria)
  if (dados) for (const campo of ["custo", "dano", "acerto", "alcance", "ca", "defesa", "esquiva", "margem", "mult", "danoDex", "dadosCritico", "descontoAE"]) if (typeof out[campo] === "number") out[campo] = valorPessoal(dados, chaveMaestria(id, campo), out[campo]);
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
    case "perigosa": return `Crítico ${20 - e.margem}–20${e.mult ? ` e multiplicador ×${e.mult}` : ""} (a margem não garante o acerto).`;
    case "esmagador": return `Ao acertar: ${e.custo} PE, Fortitude contra a CD de Maestria ou ${e.efeito}.`;
    case "sangrenta": return `Ao acertar: ${e.custo} PE, Sangrando (${e.dadosSangue} por turno) até passar em Fortitude contra a CD de Maestria.`;
    case "sentinela": return `+${e.oportunidades} ataque${e.oportunidades > 1 ? "s" : ""} de oportunidade por rodada${e.zeraDesl ? "; oportunidade que acerta zera o deslocamento" : ""}${e.reacaoAliado ? `; reação e ${e.reacaoAliado} PE: ataca quem atacou um aliado no seu alcance` : ""}${e.acertoOportunidade ? `; +${e.acertoOportunidade} Acerto nas oportunidades` : ""}.`;
    default: return e.texto ?? "";
  }
}

/** Tipo da arma (campo "Tipo de arma" do editor). */
export const tipoDaArma = item => String(item?.flags?.["epm-ficha"]?.tipoArma ?? item?.tipoArma ?? "").trim();

/** A arma é do tipo favorito do Combatente? (compara sem acento e sem maiúsculas; com a regra opcional, vale o tipo de qualquer Maestria) */
export function eTipoFavorito(item, dados = {}) {
  const t = norm(tipoDaArma(item));
  if (!t) return false;
  const fav = norm(dados.arquetipoOpcoes?.combatente?.tipoFavorito);
  if (fav && t === fav) return true;
  if (!variasArmasFavoritas()) return false;
  return Object.values(dados.arquetipoOpcoes?.combatente?.maestriaTipos ?? {}).some(x => norm(x) === t);
}

/** Valor de Inteligência para as fórmulas do Artífice (mínimo 0, inteiro). */
export const intArtifice = valor => Math.max(0, Math.floor(Number(valor) || 0));
/** Compatibilidade: mínimo 1 (usado em textos antigos). */
export const intMin1 = valor => Math.max(1, Math.floor(Number(valor) || 0));

const ROMANOS = ["", "I", "II", "III", "IV", "V", "VI", "VII"];
export const grauRomano = g => ROMANOS[Math.max(0, Math.min(7, Math.floor(Number(g) || 0)))] || String(g);

/**
 * Criar Projetos no nível: reserva de Projetos de Criação (pela Inteligência), Grau máximo e tamanho do Livro.
 * `ajustes` = flags.ajustesBonus (a mesa pode trocar a reserva e o Livro: "artifice-projetos", "artifice-livro").
 */
export function criacaoDe(nivel, inteligencia = 0, ajustes = {}) {
  const t = degrau(ARQUETIPOS.artifice.criacao, nivel);
  if (!t) return null;
  const i = intArtifice(inteligencia);
  let projetos = t.projetos === "metade" ? Math.max(1, Math.ceil(i / 2)) : Math.max(1, i + t.extra);
  let livro = t.livro;
  const ov = k => { const v = ajustes?.[k]; return v === undefined || v === null || String(v).trim() === "" ? null : conta(comInt(v, i)); };
  if (ov("artifice-projetos") !== null) projetos = Math.max(0, ov("artifice-projetos"));
  if (ov("artifice-livro") !== null) livro = Math.max(0, ov("artifice-livro"));
  const prox = proximoDegrau(ARQUETIPOS.artifice.criacao, nivel);
  return { projetos, grauMax: t.grau, livro, carregar: projetos * 2, etapa: ARQUETIPOS.artifice.criacao.indexOf(t) + 1, proximo: prox?.nivel ?? null,
    formula: t.projetos === "metade" ? "metade da Inteligência (mín. 1)" : `Inteligência${t.extra ? ` + ${t.extra}` : ""}` };
}

/**
 * Valores de um Grau (1 a 5; acima de 5 só com a Sobrecarga: +2 dados no Dano e na Cura, +2 na Soma e na Proteção).
 * Dano, Cura e Aprimoramento já com a Inteligência somada ("2d6 + 3").
 */
export function valoresDoGrau(grau, inteligencia = 0) {
  const G = ARQUETIPOS.artifice.graus;
  const g = Math.max(1, Math.floor(Number(grau) || 1));
  const base = G[Math.min(5, g) - 1];
  const i = intArtifice(inteligencia);
  const extra = Math.max(0, g - 5);
  const maisDados = f => extra ? f.replace(/^(\d+)d/, (m, n) => `${Number(n) + 2 * extra}d`) : f;
  const comI = f => (i ? `${f} + ${i}` : f);
  return {
    grau: g, romano: grauRomano(g), dano: comI(maisDados(base.dano)), danoArea: maisDados(base.dano), cura: comI(maisDados(base.cura)),
    soma: base.soma + 2 * extra, protecao: base.protecao + 2 * extra, aprimoramento: comI(maisDados(base.aprimoramento)),
    cenas: base.cenas, ocupa: base.ocupa
  };
}

/** Itens Encantados no nível (dano, cura, auxílio) ou null. */
export const encantadosDe = nivel => degrau(ARQUETIPOS.artifice.encantados, nivel);
/** Dado dos Utensílios no nível (ou null). */
export const dadoUtensilios = nivel => degrau(ARQUETIPOS.artifice.utensilios.dados, nivel)?.dado ?? null;
/** Ação da Montagem em Campo no nível. */
export const montagemDe = nivel => degrau(ARQUETIPOS.artifice.montagem, nivel);
/** Modificações Permanentes no nível: { criaturas, bonus } ou null. */
export const modificacoesDe = nivel => degrau(ARQUETIPOS.artifice.modificacoes, nivel);

/** Troca "Int", "Inteligência" ou "@int" pelo valor. */
const comInt = (texto, i) => String(texto ?? "").replace(/@int\b|\binteligên?cia\b|\binteligencia\b|\bint\b/gi, String(i));
/** Conta simples (só números e + − × ÷ parênteses); senão null. */
function conta(texto) {
  const t = String(texto ?? "").replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
  if (!t || !/^[\d+\-*/().]+$/.test(t)) return null;
  try { const v = Function(`"use strict"; return (${t});`)(); return Number.isFinite(v) ? Math.floor(v) : null; } catch { return null; }
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

/** Acúmulo de Magias do Conjurador no nível: { magias, truques } (só o Acúmulo; Classe e pergaminhos somam por fora). */
export function acumuloDeMagias(nivel) {
  const c = ARQUETIPOS.conjurador.acumulo;
  if (!nivel) return { magias: 0, truques: 0 };
  return { magias: c.magiasIniciais + Math.max(0, Math.min(50, nivel) - 1), truques: c.truquesIniciais + c.truquesNiveis.filter(n => nivel >= n).length };
}

/** A magia conta no Acúmulo? (Classe, raça, pergaminho, treinamento… somam por fora) */
export const contaNoAcumulo = poder => !ARQUETIPOS.conjurador.origensForaAcumulo.includes(String(poder?.origem ?? ""));

/** Magias Assinatura permitidas no nível: { qtd, circuloMax } (ou null). */
export const assinaturaDe = nivel => degrau(ARQUETIPOS.conjurador.assinatura, nivel);
/** Corpo de Mana no nível: { pm, vooDobro } (ou null). */
export const corpoDeManaDe = nivel => degrau(ARQUETIPOS.conjurador.corpoDeMana, nivel);
/** Zona de Mana no nível: ativação e manutenção (ou null). */
export const zonaDeManaDe = nivel => degrau(ARQUETIPOS.conjurador.zonaDeMana, nivel);

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
  const opc = dados.arquetipoOpcoes ?? {};
  const conj = nivelArquetipo(dados, "conjurador");
  if (conj) {
    const pm = reservaArcana(conj, dados);
    if (pm) out.push({ alvo: "recurso.pm", valor: pm, fonte: "Reserva Arcana (Conjurador)" });
  }
  // Modificações Permanentes do próprio Artífice (Nv. 11; +5 no 35): uma parte do corpo com uma opção
  const art = nivelArquetipo(dados, "artifice");
  const modP = modificacoesDe(art);
  const escolhaMod = opc.artifice?.modificacao ?? {};
  const parte = modP ? ARQUETIPOS.artifice.partesModificacao[escolhaMod.parte] : null;
  const op = parte?.opcoes?.[Math.max(0, Math.floor(Number(escolhaMod.opcao) || 0))];
  if (op && op[1] !== "visao") {
    const valor = art >= 35 ? op[3] : op[2];
    out.push({ alvo: op[1], valor, fonte: `Modificação Permanente (${parte.nome}: ${op[0]})` });
  }
  const comb = nivelArquetipo(dados, "combatente");
  if (comb) {
    // Maestrias que valem com alguma arma favorita equipada (cada uma conta uma vez)
    const ativas = new Map();
    for (const a of armasEquipadas) for (const m of maestriasDaArma(a, dados, comb)) ativas.set(m.id, m);
    const prot = ativas.get("protetora");
    if (prot) {
      out.push({ alvo: "ca", valor: prot.ca, fonte: "Arma Protetora (Combatente)" });
      if (prot.defesa) out.push({ alvo: "defesa.bloqueio", valor: prot.defesa, fonte: "Arma Protetora (Combatente)" });
    }
    const lev = ativas.get("leve");
    if (lev?.esquiva) out.push({ alvo: "defesa.esquiva", valor: lev.esquiva, fonte: "Arma Leve (Combatente)" });
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

/** Tipos de Projeto do Artífice. */
export const TIPOS_PROJETO = {
  dano: { label: "Dano", icone: "fa-solid fa-bomb" },
  cura: { label: "Cura", icone: "fa-solid fa-kit-medical" },
  soma: { label: "Soma", icone: "fa-solid fa-plus" },
  protecao: { label: "Proteção", icone: "fa-solid fa-shield-halved" },
  cd: { label: "CD", icone: "fa-solid fa-bullseye" }
};

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
/** Chave do ajuste de um número de uma Maestria nesta ficha (uma por Maestria do Arsenal). */
export const chaveMaestria = (id, campo) => `arq-maestria-${id}-${campo}`.toLowerCase();
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
  const gem = maestriasEscolhidas(dados, nivel).includes("gemea") ? efeitoMaestria("gemea", nivel, dados) : null;
  const desconto = Math.max(0, gem?.descontoAE ?? 0);
  return {
    ...ae, custo: Math.max(0, valorPessoal(dados, "arq-ataque-extra-custo", ae.custo)), ataques: Math.max(0, valorPessoal(dados, "arq-ataque-extra-ataques", ae.ataques)), desconto,
    /** PE para n ataques adicionais. */
    custoDe(n) { const bruto = Math.max(0, n) * this.custo; return n > 0 ? Math.max(Math.min(3, bruto), bruto - this.desconto) : 0; }
  };
}
/** Fôlego de Combate (Combatente 10/22/35): dado de PV recuperados e usos por cena. */
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
    nivel: c.nivel, ca: c.ca, reacoes: c.reacoes ?? 0, todoAcerto: e.todoAcerto, imunidadeVira: !!e.imunidadeVira,
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
    for (const mId of maestriasEscolhidas(dados, comb)) {
      const m = efeitoMaestria(mId, comb);
      if (m) for (const [campo, rot] of Object.entries(CAMPOS_MAESTRIA)) if (typeof m[campo] === "number" && (!["margem", "mult", "defesa", "esquiva", "danoDex", "dadosCritico", "descontoAE"].includes(campo) || m[campo]) && !(m.id === "leve" && campo === "acerto" && !m[campo])) add(chaveMaestria(mId, campo), `Maestria: ${m.nome}`, rot, m[campo]);
    }
    const refl = degrau(ARQUETIPOS.combatente.reflexos, comb)?.valor;
    if (refl) add("arq-reflexos-de-combate", "Reflexos de Combate", "Reflexos", refl);
    const fol = degrau(ARQUETIPOS.combatente.folego, comb);
    if (fol) { add("arq-folego-dado", "Fôlego de Combate", "PV recuperados", fol.dado); add("arq-folego-usos", "Fôlego de Combate", "Usos por cena", fol.usos); }
    const cac = degrau(ARQUETIPOS.combatente.cacador.etapas, comb);
    if (cac) {
      add("arq-cacador-custo", "Caçador Natural", "Custo (PE)", ARQUETIPOS.combatente.cacador.custo);
      add("arq-cacador-acerto", "Caçador Natural", "Acerto contra a Presa", cac.acerto);
      if (cac.esquiva) add("arq-cacador-esquiva", "Caçador Natural", "Reações contra a Presa (Bloqueio, Contra-ataque e Esquiva)", cac.esquiva);
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
    const t = degrau(ARQUETIPOS.artifice.criacao, art);
    if (t) {
      out.push({ chave: "artifice-projetos", fonte: "Criar Projetos", rotulo: 'Projetos de Criação · "Int" = Inteligência', padrao: t.projetos === "metade" ? "metade da Int (mín. 1)" : `Int${t.extra ? ` + ${t.extra}` : ""}`, formula: true, origem: "arquetipo", atual: dados.ajustesBonus?.["artifice-projetos"] ?? "" });
      out.push({ chave: "artifice-livro", fonte: "Criar Projetos", rotulo: "Livro de Projetos (receitas)", padrao: String(t.livro), formula: true, origem: "arquetipo", atual: dados.ajustesBonus?.["artifice-livro"] ?? "" });
    }
  }
  return out;
}
