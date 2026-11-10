/**
 * Lista oficial de bênçãos e maldições do EPM (100 de cada).
 * Gerado a partir dos textos da Mestre. Para mudar um texto, edite aqui mesmo;
 * a automação (modificadores, duração, custos) fica em bencaos.mjs.
 */
export const LISTA_BENCAOS = {
 "grupos": {
  "bencao": {
   "divina": {
    "descricao": "Manifestações de autoridade divina. Não possuem custo de ativação, mas exigem o cumprimento de suas condições."
   },
   "caotica": {
    "descricao": "Poderes provenientes de forças que não reconhecem as leis naturais. Cada bênção exige um sacrifício real."
   },
   "memetica": {
    "descricao": "Manifestações absurdas da realidade. Embora sejam cômicas, seus efeitos são reais e possuem funcionamento mecânico."
   }
  },
  "maldicao": {
   "divina": {
    "descricao": "Punições impostas por entidades superiores. Não são doenças ou efeitos comuns: são sentenças sobre a existência."
   },
   "caotica": {
    "descricao": "Deformações provocadas pelo caos primordial. Não seguem necessariamente uma lógica e podem transformar o próprio personagem em uma ameaça."
   },
   "memetica": {
    "descricao": "Maldições absurdas que tornam a vida do personagem um verdadeiro desastre. Algumas são pequenas inconveniências; outras são punições terríveis disfarçadas de piada."
   }
  }
 },
 "raridades": {
  "boa": "Efeitos úteis e fortes, com limitações claras.",
  "epica": "Efeitos muito poderosos, capazes de mudar um combate.",
  "lendaria": "Efeitos excepcionais, capazes de alterar acontecimentos e regras da realidade."
 },
 "regras": [
  "Nenhuma bênção exige teste para ativar seus efeitos, desde que a condição seja cumprida.",
  "Efeitos absolutos não podem ser reduzidos por resistências convencionais.",
  "Bênçãos não acumulam efeitos idênticos.",
  "Uma bênção não pode ser ativada enquanto seu efeito anterior ainda estiver ativo, salvo indicação contrária.",
  "Duração, alcance, custos e limitações são definidos individualmente.",
  "Sacrifícios permanentes não podem ser recuperados por meios convencionais."
 ],
 "entradas": [
  {
   "numero": 1,
   "nome": "Olho do Juízo",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Ao observar uma criatura por um turno completo, descobre seus PV atuais, defesas, resistências, imunidades e fraquezas.",
   "condicao": "Manter visão direta durante todo o turno sem sofrer dano."
  },
  {
   "numero": 2,
   "nome": "Trono Inabalável",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Você não pode ser empurrado, derrubado, arrastado ou teleportado contra sua vontade.",
   "condicao": "Estar com os pés apoiados em uma superfície."
  },
  {
   "numero": 3,
   "nome": "Memória Celestial",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Nunca esquece informações, acontecimentos ou conhecimentos que tenha presenciado ou aprendido.",
   "condicao": "Ter percebido a informação originalmente."
  },
  {
   "numero": 4,
   "nome": "Voz da Verdade",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Uma vez por combate, pode fazer uma criatura responder verdadeiramente a uma pergunta direta.",
   "condicao": "A criatura precisa ouvir e compreender a pergunta."
  },
  {
   "numero": 5,
   "nome": "Passos do Além",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Pode atravessar até 3 metros de matéria sólida durante seu movimento.",
   "condicao": "Não pode atacar ou conjurar durante a travessia."
  },
  {
   "numero": 6,
   "nome": "Manto da Providência",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "O primeiro ataque direcionado contra você em cada combate erra automaticamente.",
   "condicao": "Não pode estar inconsciente."
  },
  {
   "numero": 7,
   "nome": "Chama Purificadora",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Remove uma maldição, veneno, doença ou condição negativa de uma criatura.",
   "condicao": "Tocar o alvo. Uma vez por combate."
  },
  {
   "numero": 8,
   "nome": "Espada Celestial",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Seus ataques podem atingir criaturas incorpóreas, espirituais e imateriais, ignorando a intangibilidade.",
   "condicao": "Estar empunhando uma arma."
  },
  {
   "numero": 9,
   "nome": "Vínculo da Vida",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Transfere até metade dos seus PV atuais para uma criatura a até 9 metros.",
   "condicao": "A criatura precisa aceitar a transferência. Uma vez por combate."
  },
  {
   "numero": 10,
   "nome": "Domínio do Silêncio",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Cria uma área de 6 metros de raio onde nenhuma criatura consegue produzir sons.",
   "condicao": "Você também não consegue falar. Dura 2 turnos."
  },
  {
   "numero": 11,
   "nome": "Balança Divina",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Devolve integralmente o último dano recebido ao agressor.",
   "condicao": "Precisa sobreviver ao ataque. Uma vez por combate."
  },
  {
   "numero": 12,
   "nome": "Olhos do Passado",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Observa acontecimentos ocorridos no local durante os últimos 24 horas.",
   "condicao": "Permanecer no local durante um turno completo."
  },
  {
   "numero": 13,
   "nome": "Lâmina do Destino",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Seu próximo ataque acerta automaticamente e causa o dano máximo possível da arma, além de ignorar resistências.",
   "condicao": "Não ter realizado ataques no turno anterior. Uma vez por combate."
  },
  {
   "numero": 14,
   "nome": "Coração Imortal",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Ao atingir 0 PV, retorna imediatamente com metade dos PV máximos.",
   "condicao": "Uma vez por dia."
  },
  {
   "numero": 15,
   "nome": "Correntes do Julgamento",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Prende completamente uma criatura a até 12 metros, impedindo movimento, ataques e conjurações.",
   "condicao": "A criatura precisa ter causado dano a você. Dura 2 turnos."
  },
  {
   "numero": 16,
   "nome": "Decreto da Anulação",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Cancela completamente uma magia, habilidade ou bênção que esteja sendo executada.",
   "condicao": "Precisa perceber a ativação. Uma vez por combate."
  },
  {
   "numero": 17,
   "nome": "Ressurgimento",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Recupera todos os PV e remove todas as condições negativas.",
   "condicao": "Ativada ao atingir 0 PV. Uma vez por dia."
  },
  {
   "numero": 18,
   "nome": "Muralha Celestial",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Cria uma barreira de até 6 metros de largura e 4 metros de altura. Nada consegue atravessá-la por meios convencionais ou sobrenaturais.",
   "condicao": "A barreira permanece por 3 turnos ou até você desfazê-la."
  },
  {
   "numero": 19,
   "nome": "Autoridade Suprema",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Uma criatura deve cumprir uma ordem simples sua, mesmo que normalmente não obedecesse.",
   "condicao": "Precisa olhar diretamente para você e compreender a ordem. Uma vez por combate."
  },
  {
   "numero": 20,
   "nome": "Ruptura do Destino",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Anula completamente um acontecimento que deveria atingir você, incluindo um ataque, uma condição ou um efeito sobrenatural.",
   "condicao": "Uma vez por dia."
  },
  {
   "numero": 21,
   "nome": "Domínio Elemental",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Torna-se completamente imune a um tipo de dano elemental escolhido.",
   "condicao": "O elemento escolhido é permanente."
  },
  {
   "numero": 22,
   "nome": "Último Suspiro",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Impede a morte de até três criaturas em um raio de 9 metros durante 3 turnos. Elas permanecem com pelo menos 1 PV.",
   "condicao": "Você não pode atacar durante a duração."
  },
  {
   "numero": 23,
   "nome": "Olhar da Eternidade",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Enxerga os acontecimentos dos próximos 2 turnos antes que ocorram.",
   "condicao": "Não pode realizar ações enquanto estiver utilizando a visão. Uma vez por combate."
  },
  {
   "numero": 24,
   "nome": "Julgamento Final",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Marca uma criatura. Após 3 turnos, ela morre inevitavelmente.",
   "condicao": "O alvo precisa ter causado dano direto a você. Uma vez por semana."
  },
  {
   "numero": 25,
   "nome": "Voz da Criação",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Declara uma frase de até 10 palavras e transforma seu conteúdo em realidade.",
   "condicao": "Não pode criar entidades superiores, ressuscitar mortos ou eliminar conceitos fundamentais. Uma vez por semana."
  },
  {
   "numero": 26,
   "nome": "Trono dos Eternos",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Durante 3 turnos, você não pode receber dano, sofrer condições negativas ou ser deslocado.",
   "condicao": "Não pode se movimentar voluntariamente durante o efeito. Após a duração, perde todas as ações por 2 turnos."
  },
  {
   "numero": 27,
   "nome": "Lei do Retorno",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Uma criatura que causar sua morte também morrerá imediatamente.",
   "condicao": "Só funciona uma vez. Não pode ser revertida por ressurreição convencional."
  },
  {
   "numero": 28,
   "nome": "Mão da Criação",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Cria um objeto, estrutura ou equipamento não vivo de até 10 metros de dimensão.",
   "condicao": "Precisa conhecer sua composição e funcionamento. Uma vez por dia."
  },
  {
   "numero": 29,
   "nome": "Ressurreição Divina",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Ressuscita completamente uma criatura morta, recuperando seus PV máximos e removendo condições negativas.",
   "condicao": "O corpo precisa existir e a alma não pode ter sido destruída. Uma vez por semana."
  },
  {
   "numero": 30,
   "nome": "Domínio da Existência",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Cria uma área de 15 metros de raio na qual você determina uma lei física simples, como gravidade, direção da queda ou ausência de atrito.",
   "condicao": "Dura 3 turnos. Não pode alterar a vida ou a morte diretamente."
  },
  {
   "numero": 31,
   "nome": "Destino Absoluto",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Escolhe um acontecimento possível que ocorrerá inevitavelmente nas próximas 24 horas.",
   "condicao": "O acontecimento não pode exigir a destruição de um conceito fundamental. Uma vez por semana."
  },
  {
   "numero": 32,
   "nome": "Alma Inviolável",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Torna-se imune a controle mental, possessão, roubo de alma, manipulação de memória e alterações de personalidade.",
   "condicao": "Permanente."
  },
  {
   "numero": 33,
   "nome": "Sol Particular",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Manifesta uma estrela divina de 6 metros de raio. Inimigos dentro da área recebem 10d10 de dano radiante ao final de cada turno.",
   "condicao": "Dura 3 turnos. Você não pode se afastar mais de 30 metros da manifestação."
  },
  {
   "numero": 34,
   "nome": "Autoridade do Primeiro",
   "tipo": "bencao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Uma vez por combate, pode declarar uma ação, habilidade ou magia como impossível de acontecer dentro de um raio de 15 metros durante 3 turnos.",
   "condicao": "A proibição também afeta você e seus aliados."
  },
  {
   "numero": 35,
   "nome": "Rasgo da Realidade",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Teleporta-se instantaneamente para qualquer lugar que consiga enxergar em até 30 metros.",
   "custo": "Perde sua ação de movimento no próximo turno."
  },
  {
   "numero": 36,
   "nome": "Sangue Explosivo",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Pode transformar seu sangue em uma explosão de 3 metros de raio, causando 4d8 de dano.",
   "custo": "Perde 10 PV atuais por ativação."
  },
  {
   "numero": 37,
   "nome": "Fome Infinita",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Seus ataques recuperam metade do dano causado em PV.",
   "custo": "Se passar um turno sem atacar, perde 15 PV."
  },
  {
   "numero": 38,
   "nome": "Pele de Vidro",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Seus ataques ignoram resistências físicas e mágicas.",
   "custo": "Você também perde todas as resistências enquanto a bênção estiver ativa. Dura 3 turnos."
  },
  {
   "numero": 39,
   "nome": "Sombra Devoradora",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Sua sombra realiza um ataque adicional por turno, causando 2d8 de dano.",
   "custo": "Você perde 5 PV sempre que ela ataca."
  },
  {
   "numero": 40,
   "nome": "Corpo Fragmentado",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Divide seu corpo em até três partes independentes, podendo ocupar posições diferentes em até 6 metros.",
   "custo": "Cada parte recebe dano normalmente e você perde sua ação padrão durante a divisão. Dura 2 turnos."
  },
  {
   "numero": 41,
   "nome": "Chamas Famintas",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Seus ataques passam a causar 3d8 de dano adicional de fogo.",
   "custo": "Seus equipamentos carregados também começam a queimar. Dura 3 turnos."
  },
  {
   "numero": 42,
   "nome": "Roubo de Sorte",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Repete um teste próprio que tenha falhado e utiliza o novo resultado.",
   "custo": "O próximo teste realizado por você será considerado uma falha automática."
  },
  {
   "numero": 43,
   "nome": "Olhos do Abismo",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Enxerga criaturas invisíveis, espíritos, ilusões e seres através de paredes.",
   "custo": "Fica completamente cego para a visão convencional durante 3 turnos."
  },
  {
   "numero": 44,
   "nome": "Gravidade Insana",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Multiplica por cinco a gravidade em uma área de 6 metros de raio, impedindo movimentos e deslocamentos convencionais.",
   "custo": "Você também fica preso na área. Dura 2 turnos."
  },
  {
   "numero": 45,
   "nome": "Segundo Coração",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Cria uma reserva adicional de PV igual à metade dos seus PV máximos.",
   "custo": "Ao terminar o efeito, perde permanentemente 10 PV máximos."
  },
  {
   "numero": 46,
   "nome": "Parasita Mágico",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Rouba 20 PM de um conjurador a até 12 metros.",
   "custo": "Perde 10 PM próprios. Uma vez por combate."
  },
  {
   "numero": 47,
   "nome": "Ruína Carmesim",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Duplica todo dano causado por você durante 3 turnos.",
   "custo": "Fica incapaz de realizar ações durante os 2 turnos seguintes."
  },
  {
   "numero": 48,
   "nome": "Abismo Interior",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Absorve completamente todo dano recebido durante um turno.",
   "custo": "Perde permanentemente 20 PV máximos."
  },
  {
   "numero": 49,
   "nome": "Eco da Loucura",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Cria uma cópia com os mesmos atributos e metade dos PV, capaz de realizar uma ação padrão por turno.",
   "custo": "Após 3 turnos, a cópia se torna hostil e ataca você."
  },
  {
   "numero": 50,
   "nome": "Colapso Temporal",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Desfaz todas as ações realizadas por você durante seu último turno, retornando sua posição e recursos ao estado anterior.",
   "custo": "Não pode realizar ações durante os próximos 2 turnos."
  },
  {
   "numero": 51,
   "nome": "Morte Reversa",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Durante 2 turnos, todo dano recebido é convertido em recuperação de PV na mesma quantidade.",
   "custo": "Ao terminar, perde todos os PV recuperados e sofre 10d10 de dano verdadeiro."
  },
  {
   "numero": 52,
   "nome": "Cópia Imperfeita",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Copia uma habilidade de um inimigo e pode utilizá-la uma vez, respeitando suas condições de ativação.",
   "custo": "Perde uma habilidade própria até o próximo descanso."
  },
  {
   "numero": 53,
   "nome": "Ladrão de Tempo",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Impede uma criatura de realizar ações durante um turno.",
   "custo": "Você também perde todas as ações durante o turno seguinte."
  },
  {
   "numero": 54,
   "nome": "Fera Interior",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Recebe +3 em Força, Destreza e Constituição durante 3 turnos.",
   "custo": "Ao terminar, perde 30 PV e fica impedido de conjurar por 2 turnos."
  },
  {
   "numero": 55,
   "nome": "Espelho Cruel",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Devolve integralmente uma habilidade direcionada contra você ao seu usuário original.",
   "custo": "Recebe o próximo ataque sem poder utilizar defesas ou resistências. Uma vez por combate."
  },
  {
   "numero": 56,
   "nome": "Cicatriz Dimensional",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Abre um portal entre dois pontos conhecidos, permitindo a passagem de criaturas e objetos.",
   "custo": "Uma criatura aleatória de outra dimensão atravessa o portal antes que ele se feche."
  },
  {
   "numero": 57,
   "nome": "Devorador de Magia",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Absorve uma magia que esteja sendo conjurada e pode utilizá-la imediatamente sem gastar PM.",
   "custo": "Perde permanentemente uma magia conhecida."
  },
  {
   "numero": 58,
   "nome": "Sacrifício Absoluto",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Realiza um ataque inevitável que mata uma criatura, independentemente de seus PV, resistências e defesas.",
   "custo": "Você morre imediatamente após a execução. Não pode ser ressuscitado por meios convencionais."
  },
  {
   "numero": 59,
   "nome": "Deus por um Instante",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Durante um turno, pode alterar uma lei física em um raio de 30 metros.",
   "custo": "Perde permanentemente 1 ponto de um atributo à escolha do mestre."
  },
  {
   "numero": 60,
   "nome": "Fim Provisório",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Durante 5 turnos, não pode morrer, independentemente do dano recebido.",
   "custo": "Ao terminar, todos os danos acumulados são aplicados simultaneamente."
  },
  {
   "numero": 61,
   "nome": "Vazio Faminto",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Apaga completamente uma criatura ou objeto de até 3 metros, removendo-o da existência.",
   "custo": "Perde permanentemente todas as memórias relacionadas a uma pessoa importante."
  },
  {
   "numero": 62,
   "nome": "Mundo Invertido",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Cria uma dimensão de 20 metros de raio na qual você controla a direção da gravidade e a orientação espacial.",
   "custo": "Ao terminar, perde todos os seus PM e PE atuais."
  },
  {
   "numero": 63,
   "nome": "Alma Dividida",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Cria uma segunda versão de si mesmo com os mesmos atributos e habilidades, mas com personalidade própria.",
   "custo": "A cópia possui consciência independente e pode disputar permanentemente o controle do corpo."
  },
  {
   "numero": 64,
   "nome": "Cemitério das Possibilidades",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Anula completamente uma ação, habilidade ou magia de uma criatura, removendo também seus efeitos já produzidos naquele turno.",
   "custo": "Não pode utilizar a mesma categoria de ação durante 7 dias."
  },
  {
   "numero": 65,
   "nome": "Carne do Apocalipse",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Durante 5 turnos, regenera completamente o corpo ao final de cada turno e recebe +5 em todos os atributos.",
   "custo": "Ao terminar, seus PV máximos são reduzidos à metade e você perde todas as suas ações por 3 turnos."
  },
  {
   "numero": 66,
   "nome": "Coroa do Caos",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Durante 3 turnos, pode utilizar duas ações padrão por turno e todos os seus ataques ignoram resistências.",
   "custo": "Perde permanentemente 1 ponto de Núcleo e 1 ponto de Constituição."
  },
  {
   "numero": 67,
   "nome": "Fim de Tudo",
   "tipo": "bencao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Destrói completamente tudo dentro de uma área de 15 metros de raio, causando 20d10 de dano verdadeiro às criaturas atingidas e destruindo objetos e estruturas convencionais.",
   "custo": "Seus PV são reduzidos a 1, seus atributos recebem -3 até o próximo descanso e você não pode utilizar bênçãos novamente durante 7 dias."
  },
  {
   "numero": 68,
   "nome": "Poder do Chinelo",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Arremessa um chinelo que sempre acerta o alvo escolhido em até 15 metros, causando 2d8 de dano.",
   "condicao": "Precisa estar descalço. O chinelo retorna após o ataque."
  },
  {
   "numero": 69,
   "nome": "Fingir de Morto",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Enquanto estiver deitado e imóvel, criaturas não conseguem reconhecer você como uma ameaça.",
   "condicao": "Não pode atacar, conjurar ou falar. Dura até você se movimentar."
  },
  {
   "numero": 70,
   "nome": "Cadeira Gamer",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Enquanto estiver sentado em uma cadeira, recebe resistência a todos os danos.",
   "condicao": "Levantar remove o efeito imediatamente."
  },
  {
   "numero": 71,
   "nome": "Cachorro Caramelo",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Invoca um cachorro que possui 30 PV e realiza um ataque de 2d6 por turno.",
   "condicao": "Ele obedece apenas a ordens simples e precisa receber comida após o combate."
  },
  {
   "numero": 72,
   "nome": "Modo Econômico",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Sua próxima habilidade custa 0 PE ou PM.",
   "condicao": "Não pode realizar ataques durante o turno em que ativar a bênção."
  },
  {
   "numero": 73,
   "nome": "Dano Emocional",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Um insulto direcionado causa 2d8 de dano à sanidade do alvo.",
   "condicao": "O alvo precisa compreender o insulto. Uma vez por turno."
  },
  {
   "numero": 74,
   "nome": "Escorregão Estratégico",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Ao cair voluntariamente no chão, anula o próximo ataque recebido.",
   "condicao": "Precisa permanecer caído até o início do próximo turno."
  },
  {
   "numero": 75,
   "nome": "Invocação de Geladeira",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Invoca uma geladeira contendo alimentos suficientes para recuperar 20 PV de uma criatura.",
   "condicao": "Uma utilização por criatura. Desaparece após 5 turnos."
  },
  {
   "numero": 76,
   "nome": "Poder da Preguiça",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Pode realizar uma ação de movimento sem sair do lugar, teleportando-se até 3 metros.",
   "condicao": "Precisa estar sentado ou deitado."
  },
  {
   "numero": 77,
   "nome": "Imunidade à Vergonha",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Torna-se imune a efeitos de intimidação, humilhação e constrangimento.",
   "condicao": "Precisa realizar uma dança ridícula antes da ativação. Dura 3 turnos."
  },
  {
   "numero": 78,
   "nome": "O Último a Rir",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Quando receber uma provocação ou insulto, seu próximo ataque causa 4d6 de dano adicional.",
   "condicao": "Precisa rir junto com o agressor."
  },
  {
   "numero": 79,
   "nome": "Mestre do Disfarce",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Transforma-se na aparência de um objeto inanimado de tamanho semelhante ao seu.",
   "condicao": "Não pode se movimentar ou realizar ações enquanto estiver disfarçado."
  },
  {
   "numero": 80,
   "nome": "Protagonista de Anime",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Ao atingir 0 PV, recupera imediatamente todos os PV e recebe +3 em todos os atributos durante 3 turnos.",
   "condicao": "Precisa realizar um discurso dramático antes de recuperar os PV. Uma vez por semana."
  },
  {
   "numero": 81,
   "nome": "Poder da Amizade",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Todos os aliados em até 9 metros recuperam 20 PV e recebem +2 em todos os atributos durante 2 turnos.",
   "condicao": "Precisa declarar publicamente sua amizade com cada aliado afetado. Uma vez por combate."
  },
  {
   "numero": 82,
   "nome": "Controle Remoto",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Escolhe uma criatura em até 9 metros e faz com que ela fique imóvel durante um turno.",
   "condicao": "Precisa dizer \"desliga e liga novamente\". Uma vez por combate."
  },
  {
   "numero": 83,
   "nome": "Mestre do Lag",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Todos os inimigos em até 9 metros repetem exatamente a última ação realizada.",
   "condicao": "Você também precisa repetir sua última ação. Uma vez por combate."
  },
  {
   "numero": 84,
   "nome": "A Mãe Está Chamando",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Teleporta-se instantaneamente para um local seguro que já tenha visitado.",
   "condicao": "Perde todas as ações do próximo turno e não pode retornar ao combate durante esse período."
  },
  {
   "numero": 85,
   "nome": "Advogado do Diabo",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Pode cancelar uma regra ou efeito sobrenatural que esteja afetando você, desde que apresente uma justificativa lógica.",
   "condicao": "O mestre precisa aceitar o argumento. Uma vez por combate."
  },
  {
   "numero": 86,
   "nome": "Propriedade Privada",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Declara um objeto de até 3 metros como propriedade sua. Durante 3 turnos, ninguém além de você consegue tocá-lo ou movê-lo.",
   "condicao": "Precisa colocar uma identificação com seu nome no objeto."
  },
  {
   "numero": 87,
   "nome": "Modo Vilão",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Recebe +4 em Inteligência, Carisma e Núcleo durante 3 turnos.",
   "condicao": "Precisa explicar seu plano maligno em voz alta durante um turno completo."
  },
  {
   "numero": 88,
   "nome": "Mestre do Ctrl+C",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Copia uma habilidade não lendária utilizada por uma criatura e pode executá-la uma vez.",
   "condicao": "Precisa repetir exatamente o nome da habilidade e suas palavras de ativação. Uma vez por combate."
  },
  {
   "numero": 89,
   "nome": "Poder do Spoiler",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Descobre exatamente o que uma criatura fará durante seu próximo turno.",
   "condicao": "Precisa contar a previsão em voz alta antes de ela acontecer."
  },
  {
   "numero": 90,
   "nome": "Protagonismo Absoluto",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Anula completamente um acontecimento que causaria sua morte ou derrota, retornando ao estado em que estava antes do acontecimento.",
   "condicao": "Precisa declarar \"isso não estava no roteiro\". Uma vez por semana."
  },
  {
   "numero": 91,
   "nome": "Imposto de Renda",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Retira metade dos PV atuais, PE atuais ou PM atuais de uma criatura escolhida e transfere para você.",
   "condicao": "Precisa apresentar uma cobrança formal e declarar o motivo do imposto. Uma vez por combate."
  },
  {
   "numero": 92,
   "nome": "O Poder da Conversa",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Obriga uma criatura a interromper qualquer ação hostil e conversar com você durante 3 turnos.",
   "condicao": "Precisa iniciar uma conversa sobre um assunto completamente irrelevante. Uma vez por combate."
  },
  {
   "numero": 93,
   "nome": "Erro de Fabricação",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Ignora completamente uma regra física que esteja afetando você, incluindo gravidade, temperatura, pressão ou deslocamento.",
   "condicao": "Precisa afirmar que nasceu com defeito de fabricação. Dura 3 turnos."
  },
  {
   "numero": 94,
   "nome": "Deus do Banheiro",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Ao entrar em um banheiro, recupera todos os PV, PE e PM.",
   "condicao": "Precisa permanecer dentro do banheiro durante 3 turnos completos. Uma vez por dia."
  },
  {
   "numero": 95,
   "nome": "Administração do Universo",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Pode solicitar uma alteração na realidade, escolhendo um acontecimento, objeto ou regra simples.",
   "condicao": "O mestre precisa aprovar o pedido. A alteração acontece após 3 turnos. Uma vez por semana."
  },
  {
   "numero": 96,
   "nome": "O Escolhido da Profecia",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Quando uma profecia é pronunciada, pode assumir seu papel de protagonista, recebendo +5 em todos os atributos durante 3 turnos.",
   "condicao": "Precisa ser mencionado diretamente na profecia. Uma vez por combate."
  },
  {
   "numero": 97,
   "nome": "Poder do Pix",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Transfere instantaneamente todos os PV, PE ou PM atuais de uma criatura para outra.",
   "condicao": "Precisa conhecer o nome completo das duas criaturas e dizer \"transferência realizada\". Uma vez por semana."
  },
  {
   "numero": 98,
   "nome": "A Força do Ódio",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Ao receber dano suficiente para ficar abaixo de 25% dos PV máximos, recupera todos os PV e recebe +5 em Força e Constituição durante 3 turnos.",
   "condicao": "Precisa declarar o nome de seu maior inimigo. Uma vez por combate."
  },
  {
   "numero": 99,
   "nome": "Quebra da Quarta Parede",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Pode interromper o fluxo do combate por um turno, impedindo que qualquer criatura realize ações. Durante esse período, pode conversar livremente e reorganizar seus equipamentos.",
   "condicao": "Não pode causar dano, recuperar recursos ou alterar posições durante a pausa. Uma vez por combate."
  },
  {
   "numero": 100,
   "nome": "Administrador do Caos",
   "tipo": "bencao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Escolhe uma bênção Boa ou Épica que já tenha presenciado e reproduz seu efeito imediatamente, ignorando sua condição original.",
   "condicao": "Precisa explicar por que tem permissão para utilizar aquele poder. Não pode copiar bênçãos Lendárias. Uma vez por dia."
  },
  {
   "numero": 1,
   "nome": "Olhos Vendados",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Você não consegue enxergar criaturas que não estejam a até 3 metros.",
   "consequencia": "Magias e habilidades que dependem de visão possuem alcance limitado a essa distância."
  },
  {
   "numero": 2,
   "nome": "Língua dos Pecadores",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Você não consegue mentir.",
   "consequencia": "Toda tentativa de mentira é substituída involuntariamente pela verdade."
  },
  {
   "numero": 3,
   "nome": "Peso da Culpa",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Sempre que causar dano a uma criatura inocente, perde 10 PV.",
   "consequencia": "A perda não pode ser reduzida por resistências."
  },
  {
   "numero": 4,
   "nome": "Passos Condenados",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Sua velocidade de movimento é reduzida pela metade.",
   "consequencia": "Não pode ignorar essa penalidade por meios convencionais."
  },
  {
   "numero": 5,
   "nome": "Sono dos Justos",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Precisa dormir pelo menos 10 horas para recuperar recursos completamente.",
   "consequencia": "Descansos menores recuperam apenas metade dos recursos normalmente recuperados."
  },
  {
   "numero": 6,
   "nome": "Voz Quebrada",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Não consegue falar acima de um sussurro.",
   "consequencia": "Habilidades que exigem gritos, discursos ou comandos verbais não podem ser utilizadas."
  },
  {
   "numero": 7,
   "nome": "Marca do Julgamento",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Criaturas divinas conseguem reconhecer sua presença a até 30 metros.",
   "consequencia": "Não consegue ocultar sua existência de entidades divinas."
  },
  {
   "numero": 8,
   "nome": "Mãos Impuras",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Não consegue tocar objetos sagrados sem sofrer 2d6 de dano.",
   "consequencia": "O dano acontece a cada contato."
  },
  {
   "numero": 9,
   "nome": "Memória Fragmentada",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Esquece uma informação importante ao final de cada descanso.",
   "consequencia": "O mestre determina qual memória foi perdida."
  },
  {
   "numero": 10,
   "nome": "Juramento Eterno",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Toda promessa feita voluntariamente se torna obrigatória.",
   "consequencia": "Quebrar uma promessa causa 4d10 de dano verdadeiro."
  },
  {
   "numero": 11,
   "nome": "Coração Frio",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Não consegue receber benefícios de habilidades que dependam de amizade, confiança ou afeto.",
   "consequencia": "Efeitos de suporte emocional não funcionam em você."
  },
  {
   "numero": 12,
   "nome": "Fardo dos Mortos",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "boa",
   "efeito": "Sempre que presenciar a morte de uma criatura, recebe 1d10 de dano à sanidade.",
   "consequencia": "Não pode evitar esse dano."
  },
  {
   "numero": 13,
   "nome": "Condenação da Morte",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Sua recuperação de PV é reduzida à metade.",
   "consequencia": "Ressurreições recuperam apenas 1 PV."
  },
  {
   "numero": 14,
   "nome": "Silêncio Celestial",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Você não consegue conjurar magias.",
   "consequencia": "Nenhuma habilidade convencional consegue remover essa restrição."
  },
  {
   "numero": 15,
   "nome": "Alma Exposta",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Todo dano espiritual e à sanidade recebido por você é duplicado.",
   "consequencia": "Resistências a esses danos não reduzem a duplicação."
  },
  {
   "numero": 16,
   "nome": "Inimigo dos Deuses",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Entidades divinas reconhecem você como uma criatura hostil.",
   "consequencia": "Não pode receber bênçãos divinas enquanto estiver amaldiçoado."
  },
  {
   "numero": 17,
   "nome": "Prisão do Destino",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Não pode se teleportar ou atravessar dimensões.",
   "consequencia": "Toda tentativa de deslocamento dimensional falha."
  },
  {
   "numero": 18,
   "nome": "Sangue Impuro",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Toda cura recebida causa dano na mesma quantidade.",
   "consequencia": "Não pode recuperar PV por meios externos."
  },
  {
   "numero": 19,
   "nome": "Condenação da Fraqueza",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Todos os seus atributos recebem -2.",
   "consequencia": "A penalidade permanece enquanto a maldição existir."
  },
  {
   "numero": 20,
   "nome": "Fim da Esperança",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Não pode receber efeitos que impeçam sua morte.",
   "consequencia": "Imortalidade, proteção contra morte e ressurreição não funcionam em você."
  },
  {
   "numero": 21,
   "nome": "Olhar da Morte",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Sempre que olhar diretamente para uma criatura, ela percebe sua presença.",
   "consequencia": "Você não consegue realizar ataques furtivos contra criaturas conscientes."
  },
  {
   "numero": 22,
   "nome": "Alma Acorrentada",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Sua alma não pode abandonar seu corpo.",
   "consequencia": "Projeção astral, possessão voluntária e transferência de alma são impossíveis."
  },
  {
   "numero": 23,
   "nome": "Rejeição Divina",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "epica",
   "efeito": "Todos os seus ataques contra criaturas divinas causam metade do dano.",
   "consequencia": "Você também não pode receber benefícios de entidades divinas."
  },
  {
   "numero": 24,
   "nome": "Sentença da Mortalidade",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Você não pode ser ressuscitado sob nenhuma circunstância convencional.",
   "consequencia": "Sua morte é definitiva, mesmo que seu corpo permaneça intacto."
  },
  {
   "numero": 25,
   "nome": "Nome Apagado",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Toda criatura que não esteja diretamente ligada a você esquece seu nome após 24 horas.",
   "consequencia": "Registros, profecias e documentos também começam a perder referências à sua identidade."
  },
  {
   "numero": 26,
   "nome": "Existência Condenada",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Todo dano recebido por você ignora resistências, imunidades e reduções.",
   "consequencia": "Não pode receber proteções contra dano."
  },
  {
   "numero": 27,
   "nome": "Rei Sem Trono",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Nenhuma criatura pode reconhecer sua autoridade, liderança ou posição social como legítima.",
   "consequencia": "Habilidades de comando e liderança não funcionam."
  },
  {
   "numero": 28,
   "nome": "Alma Penitente",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Sempre que utilizar uma habilidade, perde 5 PV.",
   "consequencia": "O custo acontece mesmo que a habilidade não produza efeito."
  },
  {
   "numero": 29,
   "nome": "Olhos do Criador",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Você enxerga todas as mortes possíveis de criaturas que observa.",
   "consequencia": "Ao final de cada combate, perde 10 pontos de sanidade."
  },
  {
   "numero": 30,
   "nome": "Oração Sem Resposta",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Nenhuma entidade superior pode ouvir ou responder suas preces.",
   "consequencia": "Não pode receber intervenções, bênçãos ou auxílios divinos."
  },
  {
   "numero": 31,
   "nome": "Prisão da Eternidade",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Você envelhece normalmente, mas não consegue morrer de velhice.",
   "consequencia": "Seu corpo continua sofrendo todos os danos e doenças normalmente."
  },
  {
   "numero": 32,
   "nome": "Julgamento dos Inocentes",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Toda criatura inocente que você matar causa a perda permanente de 5 PV máximos.",
   "consequencia": "A perda não pode ser recuperada."
  },
  {
   "numero": 33,
   "nome": "Maldição do Primeiro Pecado",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Todas as suas bênçãos são permanentemente desativadas.",
   "consequencia": "Não pode adquirir novas bênçãos enquanto a maldição existir."
  },
  {
   "numero": 34,
   "nome": "Condenação Final",
   "tipo": "maldicao",
   "origem": "divina",
   "raridade": "lendaria",
   "efeito": "Ao atingir 0 PV, sua alma é imediatamente aprisionada em uma dimensão inacessível.",
   "consequencia": "Não pode ser ressuscitado enquanto a maldição não for removida."
  },
  {
   "numero": 35,
   "nome": "Sangue Instável",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Sempre que perder PV, sofre 1d4 de dano adicional.",
   "consequencia": "O dano adicional ignora resistências."
  },
  {
   "numero": 36,
   "nome": "Carne Frágil",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Recebe o dobro de dano contundente.",
   "consequencia": "Armaduras não reduzem essa duplicação."
  },
  {
   "numero": 37,
   "nome": "Mana Corrompida",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Toda magia custa 5 PM adicionais.",
   "consequencia": "Caso não possua PM suficientes, sofre 2d8 de dano verdadeiro."
  },
  {
   "numero": 38,
   "nome": "Fome Insaciável",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Precisa consumir alimentos a cada 6 horas.",
   "consequencia": "Ao descumprir, perde 10 PV por hora."
  },
  {
   "numero": 39,
   "nome": "Corpo Descompassado",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Não consegue realizar duas ações consecutivas do mesmo tipo.",
   "consequencia": "Precisa alternar suas ações durante o combate."
  },
  {
   "numero": 40,
   "nome": "Sombra Hostil",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Sua sombra ataca você uma vez a cada combate, causando 3d6 de dano.",
   "consequencia": "O ataque ignora suas defesas."
  },
  {
   "numero": 41,
   "nome": "Pele Podre",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Não pode receber cura por contato físico.",
   "consequencia": "Qualquer criatura que tentar curá-lo sofre 2d6 de dano."
  },
  {
   "numero": 42,
   "nome": "Distorção Espacial",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Seus deslocamentos possuem direções imprevisíveis.",
   "consequencia": "Sempre que se movimentar, o mestre determina a direção final entre as direções possíveis."
  },
  {
   "numero": 43,
   "nome": "Olhos Caóticos",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Você não consegue distinguir ilusões da realidade.",
   "consequencia": "Toda ilusão visual é percebida como verdadeira."
  },
  {
   "numero": 44,
   "nome": "Coração Explosivo",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Sempre que perder mais de 20 PV em um único ataque, sofre 3d8 de dano adicional.",
   "consequencia": "O dano adicional não pode ser evitado."
  },
  {
   "numero": 45,
   "nome": "Corpo Faminto",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Perde 5 PV ao final de cada turno em que não causar dano.",
   "consequencia": "A perda ignora resistências."
  },
  {
   "numero": 46,
   "nome": "Vozes Internas",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "boa",
   "efeito": "Não consegue manter concentração em uma habilidade por mais de 2 turnos.",
   "consequencia": "Efeitos contínuos encerram automaticamente após esse período."
  },
  {
   "numero": 47,
   "nome": "Ruína dos Atributos",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Um atributo escolhido pelo mestre recebe -4.",
   "consequencia": "A penalidade é permanente enquanto a maldição existir."
  },
  {
   "numero": 48,
   "nome": "Devorador de Mana",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Sempre que gastar PM, perde a mesma quantidade em PV.",
   "consequencia": "A perda de PV ignora resistências."
  },
  {
   "numero": 49,
   "nome": "Carne Mutante",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Seu corpo sofre transformações involuntárias a cada descanso.",
   "consequencia": "O mestre escolhe uma alteração física que prejudica suas capacidades."
  },
  {
   "numero": 50,
   "nome": "Colapso Nervoso",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Sempre que sofrer dano, perde sua reação até o próximo turno.",
   "consequencia": "Não pode recuperar a reação por meios convencionais."
  },
  {
   "numero": 51,
   "nome": "Dimensão Quebrada",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Toda vez que se teleportar, existe a possibilidade de chegar a um local aleatório.",
   "consequencia": "O destino é determinado pelo mestre."
  },
  {
   "numero": 52,
   "nome": "Decomposição",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Perde 10 PV máximos a cada descanso.",
   "consequencia": "Quando seus PV máximos chegarem a 1, a maldição começa a consumir sua sanidade."
  },
  {
   "numero": 53,
   "nome": "Alma Fragmentada",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "A cada combate, uma personalidade diferente assume o controle do personagem por um turno.",
   "consequencia": "O mestre determina as ações dessa personalidade."
  },
  {
   "numero": 54,
   "nome": "Praga Ambulante",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Criaturas que permanecerem a até 3 metros de você por um turno recebem 2d8 de dano.",
   "consequencia": "Afeta aliados e inimigos."
  },
  {
   "numero": 55,
   "nome": "Fim da Regeneração",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "Você não pode regenerar PV.",
   "consequencia": "Qualquer efeito de regeneração é anulado."
  },
  {
   "numero": 56,
   "nome": "Instabilidade Temporal",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "No início de cada combate, sua iniciativa é reduzida a zero.",
   "consequencia": "Você sempre age depois das outras criaturas."
  },
  {
   "numero": 57,
   "nome": "Roubo de Identidade",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "epica",
   "efeito": "A cada descanso, perde uma lembrança pessoal.",
   "consequencia": "O mestre determina a memória perdida, podendo afetar conhecimentos, relacionamentos e objetivos."
  },
  {
   "numero": 58,
   "nome": "Vazio Devorador",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Sua existência consome lentamente tudo ao seu redor. Criaturas a até 3 metros perdem 10 PV ao final de cada turno.",
   "consequencia": "Você não consegue desativar o efeito."
  },
  {
   "numero": 59,
   "nome": "Morte em Vida",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Seu corpo não pode recuperar PV, PM ou PE.",
   "consequencia": "Todos os recursos permanecem no estado em que estavam quando a maldição foi recebida."
  },
  {
   "numero": 60,
   "nome": "Corpo do Apocalipse",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Seu corpo causa 10d10 de dano verdadeiro a qualquer criatura que tocar você.",
   "consequencia": "Você também perde 20 PV ao final de cada turno."
  },
  {
   "numero": 61,
   "nome": "Alma Devorada",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Sua alma começa a desaparecer. A cada dia, perde 10 pontos de sanidade.",
   "consequencia": "Ao chegar a 0 de sanidade, sua alma é destruída."
  },
  {
   "numero": 62,
   "nome": "Realidade Hostil",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "O ambiente ao seu redor se torna permanentemente hostil. A cada turno, uma estrutura, objeto ou elemento natural próximo tenta feri-lo.",
   "consequencia": "O mestre determina o efeito ambiental."
  },
  {
   "numero": 63,
   "nome": "Caos Absoluto",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Toda habilidade utilizada por você possui seu efeito invertido.",
   "consequencia": "Curas causam dano, proteções aumentam o dano recebido e melhorias se tornam penalidades."
  },
  {
   "numero": 64,
   "nome": "Imortalidade Condenada",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Você não pode morrer.",
   "consequencia": "Ao atingir 0 PV, permanece consciente e sente integralmente todo dano recebido, sem conseguir agir até recuperar PV."
  },
  {
   "numero": 65,
   "nome": "Fim da Forma",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Seu corpo perde permanentemente sua forma original.",
   "consequencia": "Não pode utilizar equipamentos, armaduras ou armas convencionais."
  },
  {
   "numero": 66,
   "nome": "Devorador de Existências",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Sempre que uma criatura morrer a até 15 metros, você perde permanentemente 1 ponto de um atributo aleatório.",
   "consequencia": "Não existe limite para a perda."
  },
  {
   "numero": 67,
   "nome": "Condenação do Caos",
   "tipo": "maldicao",
   "origem": "caotica",
   "raridade": "lendaria",
   "efeito": "Seu personagem se torna uma criatura hostil controlada pelo mestre.",
   "consequencia": "Você perde permanentemente o controle do personagem até que a maldição seja removida."
  },
  {
   "numero": 68,
   "nome": "Péssimo Timing",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Sempre que tentar falar algo importante, alguém interrompe você.",
   "consequencia": "Não pode completar discursos sem ser interrompido."
  },
  {
   "numero": 69,
   "nome": "Azar de Segunda-feira",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Seu primeiro teste de cada dia sofre -3.",
   "consequencia": "Não importa o dia da semana."
  },
  {
   "numero": 70,
   "nome": "Voz de Pato",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Sua voz sempre soa como um grasnado.",
   "consequencia": "Não consegue utilizar habilidades que dependam de uma voz específica."
  },
  {
   "numero": 71,
   "nome": "Chulé Divino",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Criaturas a até 3 metros de você sofrem -2 em testes de percepção.",
   "consequencia": "Você também sofre -2 em testes sociais."
  },
  {
   "numero": 72,
   "nome": "Wi-Fi Fraco",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Toda comunicação mágica possui alcance reduzido a 3 metros.",
   "consequencia": "Mensagens mágicas podem chegar com palavras trocadas."
  },
  {
   "numero": 73,
   "nome": "Mãos de Manteiga",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Sempre que sofrer dano, precisa realizar um teste para não derrubar o objeto que estiver segurando.",
   "consequencia": "A dificuldade é definida pelo mestre."
  },
  {
   "numero": 74,
   "nome": "Fome de Pedreiro",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Precisa consumir o dobro de alimentos.",
   "consequencia": "Caso não coma, perde 10 PV por hora."
  },
  {
   "numero": 75,
   "nome": "Sono Incontrolável",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Sempre que ficar mais de 3 turnos sem realizar uma ação, adormece.",
   "consequencia": "Acorda apenas ao receber dano ou ser sacudido."
  },
  {
   "numero": 76,
   "nome": "Vergonha Alheia",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Sempre que presenciar alguém fazendo algo constrangedor, perde sua reação.",
   "consequencia": "Não pode evitar a situação."
  },
  {
   "numero": 77,
   "nome": "Maldição do Spoiler",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Sempre que descobrir um segredo, precisa revelá-lo em voz alta.",
   "consequencia": "Não consegue guardar segredos."
  },
  {
   "numero": 78,
   "nome": "Nariz de Palhaço",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Seu nariz faz barulho de buzina sempre que você mente.",
   "consequencia": "Não consegue mentir discretamente."
  },
  {
   "numero": 79,
   "nome": "Passos de Elefante",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "boa",
   "efeito": "Seus movimentos produzem ruídos extremamente altos.",
   "consequencia": "Não pode realizar furtividade."
  },
  {
   "numero": 80,
   "nome": "Protagonista Reverso",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Sempre que um inimigo realizar um ataque contra você, ele recebe +3 no dano.",
   "consequencia": "Você sempre parece ser o alvo principal."
  },
  {
   "numero": 81,
   "nome": "NPC Genérico",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Criaturas desconhecidas esquecem sua existência após 1 minuto.",
   "consequencia": "Não consegue manter relações sociais com desconhecidos sem se reapresentar."
  },
  {
   "numero": 82,
   "nome": "Tutorial Infinito",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Antes de utilizar qualquer habilidade, precisa explicar seu funcionamento em voz alta.",
   "consequencia": "Perde sua ação de movimento durante a explicação."
  },
  {
   "numero": 83,
   "nome": "Imposto da Pobreza",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Sempre que receber dinheiro, metade desaparece.",
   "consequencia": "Não consegue acumular riqueza."
  },
  {
   "numero": 84,
   "nome": "Mãe Chamando",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Uma voz invisível chama seu nome aleatoriamente durante os combates.",
   "consequencia": "Sempre que ouvir a voz, perde sua reação."
  },
  {
   "numero": 85,
   "nome": "Lag Universal",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Todas as suas ações acontecem um turno depois de serem declaradas.",
   "consequencia": "Seus inimigos podem reagir antes da execução."
  },
  {
   "numero": 86,
   "nome": "Cadeira Quebrada",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Sempre que se sentar, a cadeira quebra.",
   "consequencia": "Sofre 2d6 de dano e fica caído."
  },
  {
   "numero": 87,
   "nome": "O Poder da Vergonha",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Sempre que errar um ataque, precisa anunciar em voz alta que errou.",
   "consequencia": "Todos os inimigos próximos recebem +2 em testes contra intimidação realizada por você até o próximo turno."
  },
  {
   "numero": 88,
   "nome": "Alarme Humano",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Você emite um som extremamente alto a cada 10 minutos.",
   "consequencia": "Não pode se esconder de criaturas que dependam de audição."
  },
  {
   "numero": 89,
   "nome": "Conversa Fiada",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Toda vez que tentar conjurar uma magia, precisa falar durante um turno completo sobre um assunto aleatório.",
   "consequencia": "A magia só pode ser conjurada no turno seguinte."
  },
  {
   "numero": 90,
   "nome": "Azar Estatístico",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "epica",
   "efeito": "Sempre que tirar o melhor resultado possível em um dado, precisa repetir a rolagem.",
   "consequencia": "O segundo resultado é obrigatório."
  },
  {
   "numero": 91,
   "nome": "O Conselho Decidiu",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Toda decisão importante tomada por você precisa ser aprovada por um conselho invisível.",
   "consequencia": "O mestre decide se o conselho aprova ou rejeita suas ações."
  },
  {
   "numero": 92,
   "nome": "Proibido Ser Feliz",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Sempre que recuperar PV, perde a mesma quantidade em PM.",
   "consequencia": "Não consegue se beneficiar de curas sem sofrer a troca."
  },
  {
   "numero": 93,
   "nome": "O Roteiro Não Permite",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Sempre que tentar realizar uma ação extremamente conveniente, ela falha automaticamente.",
   "consequencia": "O mestre determina o que é conveniente demais."
  },
  {
   "numero": 94,
   "nome": "O Verdadeiro Inimigo",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Uma criatura aleatória que você encontrar passa a acreditar que você é seu maior rival.",
   "consequencia": "Ela sempre tentará derrotá-lo, mesmo que não exista motivo."
  },
  {
   "numero": 95,
   "nome": "Maldição do Print",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Toda ação constrangedora que você realizar fica registrada em um documento sobrenatural.",
   "consequencia": "Qualquer criatura que ler o documento descobre o acontecimento."
  },
  {
   "numero": 96,
   "nome": "Sem Contexto",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Toda vez que você explicar algo, as criaturas entendem exatamente o contrário.",
   "consequencia": "Não consegue transmitir informações complexas verbalmente."
  },
  {
   "numero": 97,
   "nome": "O Último Sobrevivente",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Sempre que um aliado morrer, você perde metade dos seus PV atuais.",
   "consequencia": "A maldição não pode ser desativada voluntariamente."
  },
  {
   "numero": 98,
   "nome": "Cancelado pelo Universo",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Todas as criaturas que conhecerem você recebem uma razão sobrenatural para desconfiar de suas intenções.",
   "consequencia": "Não pode receber benefícios de habilidades sociais."
  },
  {
   "numero": 99,
   "nome": "A Piada Cósmica",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Sempre que estiver em uma situação de perigo mortal, um acontecimento absurdo acontece e atrapalha você.",
   "consequencia": "O mestre determina o acontecimento, que sempre prejudica sua situação."
  },
  {
   "numero": 100,
   "nome": "Skill Issue",
   "tipo": "maldicao",
   "origem": "memetica",
   "raridade": "lendaria",
   "efeito": "Todos os seus atributos e perícias recebem -3.",
   "consequencia": "Sempre que falhar em um teste, uma voz sobrenatural anuncia \"Skill Issue\" para todos os presentes."
  }
 ]
};
