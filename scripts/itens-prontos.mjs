/**
 * Itens prontos do Escudo do Mestre: itens únicos com formas (poderes que se escolhe ao usar).
 * O Mestre dá só para quem deve ter. Só dados.
 */
import { FLAG, ASSETS } from "./config.mjs";
import { formaPadrao } from "./data.mjs";

const p = (...linhas) => linhas.map(l => `<p>${l}</p>`).join("");

/** Forma no formato das formas de habilidade. */
function forma(ordem, nome, o = {}) {
  const base = formaPadrao(ordem, nome);
  return {
    ...base, acao: o.acao ?? "padrao", uso: o.uso ?? "livre",
    alcance: o.alcance ?? "", area: o.area ?? "", duracao: o.duracao ?? "",
    dano: { formula: o.dano ?? "", tipo: o.tipoDano ?? "" },
    efeito: o.efeito ?? "",
    ...(o.bonus ? { bonus: { gatilho: "uso", escolha: "todas", duracao: "cena", ...o.bonus, opcoes: Object.fromEntries((o.bonus.opcoes ?? []).map((op, i) => [`op${i}`, { criado: i + 1, ...op }])) } } : {})
  };
}

export const ITENS_PRONTOS = [
  {
    id: "hydrakariel",
    nome: "Hydrakariel, Trono das Sete Cabeças",
    resumo: "Cajado mítico com as cabeças de uma Hidra primordial: regeneração, resistências e uma forma por cabeça.",
    dados: () => ({
      name: "Hydrakariel, Trono das Sete Cabeças",
      type: "weapon",
      img: `${ASSETS}/itens/armas-corpo.svg`,
      system: {
        description: {
          value: p(
            "<em>“Uma cabeça prevê. Outra devora. Outra destrói. E quando a última desperta, até os deuses aprendem a temer aquilo que não pode morrer.”</em>",
            "Cajado mítico forjado a partir da essência primordial de uma Hidra ancestral. Suas serpentes metálicas representam suas cabeças, enquanto os cristais azuis armazenam o poder regenerativo e destrutivo da criatura.",
            "Dizem que o cajado não foi criado para controlar uma Hidra. Ele foi criado para que seu portador se tornasse uma.",
            "<strong>Essência da Hidra (passiva).</strong> Regeneração mítica: no início de cada turno em combate, recupera 10 + 2 × nível de Vida. Resistência a dano Venenoso e Ácido. Corpo adaptável: depois de sofrer um tipo de dano, resistência a ele até o início do próximo turno (não vale contra dano Arcaico).",
            "<em>Use o botão Formas para escolher a cabeça.</em>"
          )
        },
        quantity: 1, weight: { value: 2, units: "kg" }, equipped: false
      },
      flags: {
        [FLAG]: {
          raridade: "mitica",
          dano: "1d6", tipoDano: "Contundente", periciaAtaque: "luta", alcanceCat: "corpo", tipoArma: "Cajado",
          critMargem: 20, critMult: 2,
          efeitos: {
            hyres1: { tipo: "resistencia", tipoDano: "Venenoso", criado: 1 },
            hyres2: { tipo: "resistencia", tipoDano: "Ácido", criado: 2 },
            hyreg: { tipo: "cura", recurso: "pv", formula: "10 + 2 * @nivel", quando: "turno", criado: 3 }
          },
          formas: {
            hyEssen: forma(0, "Essência da Hidra", { acao: "passiva", bonus: { gatilho: "dano", escolha: "todas", duracao: "turno", opcoes: [{ tipo: "resistencia", valor: "@tipoDano", exceto: "Arcaico" }] }, efeito: p(
              "<strong>Regeneração mítica:</strong> no início de cada turno em combate, recupera 10 + 2 × nível de Vida (automático no Novo turno, com o cajado equipado e a passiva ligada).",
              "<strong>Resistência monstruosa:</strong> resistência a dano Venenoso e Ácido.",
              "<strong>Corpo adaptável (automático):</strong> depois de sofrer um tipo de dano, recebe resistência a esse tipo até o início do próximo turno. Não funciona contra dano Arcaico.") }),
            hySobre: forma(1, "Sobrevivência da Hidra", { acao: "reacao", uso: "combate", area: "18 m ao redor", dano: "15d12", tipoDano: "Venenoso", bonus: { gatilho: "zeroPv", salvaVida: true, opcoes: [] }, efeito: p(
              "<strong>Automático:</strong> quando chegaria a 0 PV, fica com 1 PV e libera uma onda de energia: 15d12 de dano Venenoso ao redor, em 18 metros. Uma vez por combate.") }),
            hyC1: forma(2, "Cabeça 1: Devoradora", { acao: "livre", uso: "turno", bonus: { opcoes: [{ tipo: "cura", valor: "floor(@dano / 4)", recurso: "pv", maximo: 50 }] }, efeito: p(
              "Ao causar dano com uma magia, recupera Vida igual a um quarto do dano causado, até 50 PV. Ao usar, a ficha pergunta o dano e cura sozinha.") }),
            hyC2: forma(3, "Cabeça 2: Veneno Primordial", { acao: "livre", uso: "turno", duracao: "3 turnos", bonus: { opcoes: [{ tipo: "danoTurno", valor: "30", tipoDano: "Venenoso", turnos: 3 }] }, efeito: p(
              "Uma magia que cause dano aplica veneno primordial no alvo marcado: 30 de dano Venenoso no início de cada turno dele, durante 3 turnos (automático). Não se acumula.") }),
            hyC3: forma(4, "Cabeça 3: Tempestade", { acao: "padrao", alcance: "18 m", area: "6 m de raio", dano: "12d12", tipoDano: "Relâmpago", efeito: p(
              "Libera uma descarga em até 18 metros: 12d12 de dano de Relâmpago numa área de 6 metros de raio.") }),
            hyC4: forma(5, "Cabeça 4: Corrosão", { acao: "livre", duracao: "2 turnos", bonus: { opcoes: [{ tipo: "ca", valor: 5, debuff: true, noAlvo: true, turnos: 2 }] }, efeito: p(
              "Uma magia ignora resistências comuns a dano Ácido. Os alvos marcados sofrem −5 na CA por 2 turnos (automático). Não reduz a CA abaixo de 0 nem afeta imunidades absolutas.") }),
            hyC5: forma(6, "Cabeça 5: Guardiã", { acao: "bonus", duracao: "até o início do seu próximo turno", bonus: { opcoes: [{ tipo: "barreira", valor: "150" }] }, efeito: p(
              "Cria uma barreira que absorve 150 de dano (Vida temporária, automático). Dura até o início do seu próximo turno ou até ser destruída.") }),
            hyC6: forma(7, "Cabeça 6: Espectral", { acao: "movimento", uso: "combate", alcance: "36 m", efeito: p(
              "Sempre: enxerga criaturas invisíveis e detecta presenças mágicas em até 36 metros.",
              "Uma vez por combate: atravessa criaturas e objetos não mágicos durante um movimento.") }),
            hyC7: forma(8, "Cabeça 7: Aniquiladora", { acao: "livre", uso: "turno", dano: "8d12", tipoDano: "Força", efeito: p(
              "Ao conjurar uma magia ofensiva, adiciona 8d12 de dano de Força (role pelo cartão).") }),
            hyC8: forma(9, "Cabeça 8: Renascimento", { acao: "padrao", uso: "longo", bonus: { opcoes: [{ tipo: "cura", valor: "floor(@pvMax / 2)", recurso: "pv" }, { tipo: "limparCondicoes" }] }, efeito: p(
              "Recupera metade dos PV máximos e encerra as condições negativas que afetem o corpo (automático), desde que não sejam de origem Arcaica.") }),
            hyRegen: forma(10, "Regeneração de Cabeças", { acao: "reacao", uso: "combate", bonus: { gatilho: "dano", danoMinimo: 100, escolha: "escolher", duracao: "cena", opcoes: [
              { tipo: "resistencia", valor: "@tipoDano" },
              { tipo: "nota", valor: "Multiplicação: a próxima magia ofensiva atinge um alvo adicional dentro do alcance" },
              { tipo: "cura", valor: "floor(@dano * 0.25)", recurso: "pv", maximo: 150 }
            ] }, efeito: p(
              "<strong>Automático:</strong> quando sofre um ataque que causa pelo menos 100 de dano, uma das cabeças desperta e você escolhe (não muda até o fim do combate):",
              "<strong>Adaptação:</strong> resistência ao tipo de dano que despertou a cabeça até o fim do combate.",
              "<strong>Multiplicação:</strong> a próxima magia ofensiva atinge um alvo adicional dentro do alcance.",
              "<strong>Devorar:</strong> recupera PV iguais a 25% do dano recebido nesse ataque, até 150 PV.") })
          },
          prontoVersao: 2,
          pronto: "hydrakariel"
        }
      }
    })
  }
];

export const itemProntoPorId = id => ITENS_PRONTOS.find(x => x.id === id) ?? null;
