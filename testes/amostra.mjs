/**
 * Personagens de exemplo para os testes e para a prévia (dados fictícios).
 */
import { CATALOGO, dadosNovaEntrada } from "/home/claude/epm-ficha/scripts/bencaos.mjs";
import { periciasParaObjeto } from "/home/claude/epm-ficha/scripts/data.mjs";

const F = "epm-ficha";
const img = n => `icons/amostra/${n}.svg`;
let seq = 0;
const id = () => `id${String(++seq).padStart(13, "0")}`;

function item(dados) {
  const it = { id: dados.id ?? id(), name: dados.name, type: dados.type, img: dados.img, flags: { [F]: dados.flags ?? {} }, system: dados.system ?? {} };
  it.uuid = `Actor.aurelia.Item.${it.id}`;
  return it;
}

function pericias() {
  const p = periciasParaObjeto();
  const pontos = { arcanismo: 5, conhecimentosmagicos: 5, percepcao: 4, luta: 3, acrobacia: 4, fortitude: 3, furtividade: 2, intuicao: 3, vontade: 4, diplomacia: 2, medicina: 3, historia: 2, pontaria: 3, atletismo: 2 };
  for (const [k, v] of Object.entries(pontos)) if (p[k]) p[k].pontos = v;
  p.arcanismo.outros = 1;
  p.arcanismo.favorita = true;
  p.percepcao.favorita = true;
  return p;
}

function entrada(idCat, extra = {}) {
  const c = CATALOGO.find(x => x.id === idCat);
  let n = 0;
  return { ...dadosNovaEntrada(c, { criado: 1000 + (++seq), novoIdFn: () => `mod${++n}` }), ...extra };
}

export function criarParceiro() {
  return {
    id: "dorian", uuid: "Actor.dorian", name: "Dorian Kael", img: img("dorian"), type: "character",
    flags: { [F]: {
      versao: 3, raca: "Meio-dracônico", arquetipo: "Combatente", classe: "Sentinela", nivel: 6,
      sobre: {
        idade: "31", altura: "1,88 m", olhos: "Âmbar", cabelo: "Azul-escuro", origem: "Porto de Varn", tema: "Tempestade",
        marcaLocal: "Ombro direito", marcaAparencia: "Um raio partido ao meio, que brilha quando ele mente.",
        personalidade: "<p>Fala pouco, observa muito. Leal a quem já provou valor, desconfiado com o resto.</p>",
        objetivos: "<p>Encontrar o navio que levou a irmã dele e descobrir quem pagou pelo sequestro.</p>",
        medos: "<p>Água parada. Perder outra pessoa por hesitar.</p>",
        historia: "<p>Cresceu nas docas de Varn como estivador até a noite da tempestade que levou sua família.</p>",
        revelar: { tracos: "1", aparencia: "1", personalidade: "2", marca: "3", objetivos: "3", medos: "4", historia: "5", outros: "nunca" }
      }
    } },
    system: { attributes: { hp: { value: 52, max: 60, temp: 0 } } },
    statuses: new Set(), items: []
  };
}

export function criarAurelia({ edicao = false, cor = null } = {}) {
  seq = 0;
  const mochila = item({ name: "Mochila de couro", type: "container", img: img("backpack"), system: { quantity: 1, weight: { value: 2 }, capacity: { weight: { value: 30 } } }, flags: { raridade: "comum", moedas: { po: 40, pp: 15, dr: 1 } } });
  const itens = [
    item({ name: "Katana Solar", type: "weapon", img: img("katana"), system: { equipped: true, quantity: 1, weight: { value: 3 } },
      flags: { raridade: "lendaria", favorito: true, dano: "2d10 + @atr.forca", tipoDano: "Corte", critMargem: 19, critMult: 3, periciaAtaque: "luta",
        efeitos: { e1: { tipo: "danoExtra", formula: "1d6", tipoDano: "Fogo", criado: 1 }, e2: { tipo: "cura", recurso: "pv", formula: "1d4", quando: "acerto", criado: 2 } } } }),
    item({ name: "Arco do Vento Norte", type: "weapon", img: img("bow"), system: { equipped: false, quantity: 1, weight: { value: 1 } }, flags: { raridade: "rara", dano: "1d8", periciaAtaque: "pontaria" } }),
    item({ name: "Cota de malha élfica", type: "equipment", img: img("chain-mail"), system: { equipped: true, quantity: 1, weight: { value: 8 } },
      flags: { raridade: "epica", efeitos: {
        a: { tipo: "mod", alvo: "ca", valor: 4, criado: 1 }, b: { tipo: "rd", valor: 2, tipoDano: "Corte, Perfuração", criado: 2 },
        c: { tipo: "desvantagem", em: "pericia.furtividade", criado: 3 }, d: { tipo: "mod", alvo: "deslocamento", valor: -1.5, criado: 4 } } } }),
    item({ name: "Anel do Foco Astral", type: "equipment", img: img("ring"), system: { equipped: true, quantity: 1, weight: { value: 0 } },
      flags: { raridade: "mitica", efeitos: { a: { tipo: "mod", alvo: "pericia.arcanismo", valor: 2, criado: 1 }, b: { tipo: "resistencia", tipoDano: "Psíquico", criado: 2 } } } }),
    item({ name: "Poção de cura maior", type: "consumable", img: img("potion"), system: { quantity: 3, weight: { value: 0.5 } },
      flags: { raridade: "rara", favorito: true, efeitos: { a: { tipo: "cura", recurso: "pv", formula: "4d4 + 4", quando: "uso", criado: 1 } } } }),
    item({ name: "Elixir de mana", type: "consumable", img: img("mana"), system: { quantity: 2, weight: { value: 0.5 } },
      flags: { raridade: "comum", efeitos: { a: { tipo: "cura", recurso: "pm", formula: "2d6", quando: "uso", criado: 1 } } } }),
    item({ name: "Kit de herbalismo", type: "tool", img: img("herbs"), system: { quantity: 1, weight: { value: 1.5 } }, flags: { raridade: "comum" } }),
    item({ name: "Gema bruta", type: "loot", img: img("gem"), system: { quantity: 4, weight: { value: 0.1 } }, flags: { raridade: "epica" } }),
    mochila,
    item({ name: "Corda de seda (15 m)", type: "loot", img: img("rope"), system: { quantity: 1, weight: { value: 1 }, container: mochila.id }, flags: { raridade: "comum" } }),
    item({ name: "Tocha", type: "consumable", img: img("torch"), system: { quantity: 5, weight: { value: 0.5 }, container: mochila.id }, flags: { raridade: "comum" } }),
    item({ name: "Ferramentas de ladrão", type: "tool", img: img("toolbox"), system: { quantity: 1, weight: { value: 1 }, container: mochila.id }, flags: { raridade: "rara" } }),
    // Habilidades e magias
    item({ name: "Lâmina Rúnica", type: "feat", img: img("sword-spin"), flags: { raridade: "rara", origem: "classe", favorito: true,
      formas: { f1: { nome: "Corte", ordem: 0, acao: "padrao", custo: { recurso: "pe", valor: 4 }, teste: { tipo: "ataque", pericia: "luta" }, dano: { formula: "2d8", tipo: "Corte" }, requisitos: { arma: true } },
                f2: { nome: "Investida", ordem: 1, acao: "bonus", custo: { recurso: "pe", valor: 6 }, teste: { tipo: "ataque", pericia: "luta" }, dano: { formula: "2d6", tipo: "Impacto" }, requisitos: { movimento: true } } } } }),
    item({ name: "Olho do Véu", type: "feat", img: img("eye"), flags: { raridade: "epica", origem: "raca",
      formas: { f1: { nome: "Padrão", ordem: 0, acao: "bonus", custo: { recurso: "pm", valor: 5 }, requisitos: { visao: true, concentracao: true } } } } }),
    item({ name: "Canal de Mana", type: "feat", img: img("eye"), flags: { raridade: "comum", origem: "arquetipo", passiva: true, formas: { f1: { nome: "Passiva", acao: "passiva" } } } }),
    item({ name: "Foco do Conjurador", type: "feat", img: img("ice"), flags: { raridade: "comum", origem: "arquetipo",
      formas: { f1: { nome: "Padrão", ordem: 0, acao: "bonus", custo: { recurso: "pm", valor: 2 } } } } }),
    item({ name: "Pele de Pedra", type: "feat", img: img("shield"), flags: { raridade: "comum", passiva: true, formas: { f1: { nome: "Passiva", acao: "passiva" } } } }),
    item({ name: "Seta de Gelo", type: "spell", img: img("ice"), system: { level: 0 }, flags: { raridade: "comum",
      formas: { f1: { nome: "Padrão", acao: "padrao", custo: { recurso: "pm", valor: 1 }, teste: { tipo: "ataque", pericia: "arcanismo" }, dano: { formula: "1d8", tipo: "Gelo" }, requisitos: { gestual: true } } } } }),
    item({ name: "Bola de Fogo", type: "spell", img: img("fireball"), system: { level: 0 }, flags: { raridade: "rara",
      formas: { f1: { nome: "Padrão", acao: "padrao", custo: { recurso: "pm", valor: 8 }, teste: { tipo: "resistencia", pericia: "acrobacia" }, dano: { formula: "3d8", tipo: "Fogo" }, requisitos: { verbal: true, gestual: true } } } } })
  ];
  const parceiro = criarParceiro();
  const ator = {
    id: "aurelia", uuid: "Actor.aurelia", name: "Aurelia Venn", img: img("aurelia"), type: "character",
    flags: { [F]: {
      versao: 3, raca: "Humana Astral", arquetipo: "Conjurador", classe: "Arcanista", nivel: 7,
      pontos: { pt: 23, pev: 14, ph: 6 },
      recursos: { pm: { value: 31, max: 48, temp: 6 }, pe: { value: 18, max: 30, temp: 4 }, ps: { value: 82, max: 100, temp: 10 } },
      atributos: {
        forca: { base: 1 }, destreza: { base: 2, raca: 1 }, constituicao: { base: 2 }, aparencia: { base: 2 },
        carisma: { base: 2 }, inteligencia: { base: 3, aumento: 1 }, autocontrole: { base: 2, aumento: 1 }, nucleo: { base: 3, aumento: 1, raca: 1 }
      },
      pericias: pericias(),
      ca: { base: 10, atributo: "destreza", armadura: 2, bonus: 1 }, deslocamento: { base: 9 },
      treinoDia: { horas: 2 },
      treinamentos: {
        t1: { nome: "Corredor", tempo: 48, unidade: "horas", pt: 5, requisitos: "4 de Destreza", treinador: false, beneficios: "Seu deslocamento aumenta em 3 metros e você pode realizar a ação Disparada como ação bônus.", estado: "andamento", horasFeitas: 20, mods: { m1: { alvo: "deslocamento", valor: 3 } }, criado: 1 },
        t2: { nome: "Esgrima Rúnica", tempo: 3, unidade: "dias", pt: 8, requisitos: "3 de Força", treinador: true, beneficios: "+2 em Luta.", estado: "concluido", horasFeitas: 24, mods: { m1: { alvo: "pericia.luta", valor: 2 } }, criado: 2 },
        t3: { nome: "Flash Step", tempo: 1, unidade: "meses", pt: 100, requisitos: "12 de Destreza ou Força, 8 de Núcleo", treinador: true, beneficios: "Defina com o Mestre.", estado: "planejado", horasFeitas: 0, mods: {}, criado: 3 }
      },
      exaustao: 2,
      acoes: { padrao: true, bonus: false, movimento: false, reacao: false, defesas: 1 },
      moedas: { pc: 37, pp: 12, po: 245, pl: 3, dr: 1 },
      idiomas: [], resistencias: ["Gelo"], imunidades: [], vulnerabilidades: [],
      espacos: { habilidades: 4, magias: 3, truques: 3 },
      sobre: {
        idade: "27", altura: "1,70 m", peso: "58 kg", olhos: "Violeta", cabelo: "Lilás", pele: "Clara", genero: "Feminino", origem: "Torre de Aster", tema: "Estrelas",
        marcaLocal: "Palma da mão esquerda", marcaAparencia: "Uma constelação de sete pontos que pulsa quando a mana passa de 30.",
        personalidade: "<p>Curiosa, teimosa e incapaz de ignorar um enigma.</p>",
        historia: "<p>Aprendiz expulsa da Torre de Aster por ler o grimório proibido do 6º Círculo.</p>"
      },
      bencaos: {
        b1: entrada("b054", { ativo: true, turnosRestantes: 2, usado: false }),
        b2: entrada("b014", { usado: true }),
        b3: entrada("b032"),
        m1: entrada("m037"),
        m2: entrada("m083")
      },
      relacoes: {
        r1: { nome: "Dorian Kael", img: "", uuid: "Actor.dorian", tipo: "aliado", afinidade: 3, notas: "Me tirou de um naufrágio. Devo uma.", criado: 1 },
        r2: { nome: "Velha Marta", img: "", uuid: "", tipo: "mentor", afinidade: 4, notas: "Herbalista que me ensinou as primeiras runas.", criado: 2 }
      },
      ataques: { a1: { nome: "Toque Gélido", pericia: "arcanismo", bonusAcerto: 0, dano: "1d10 + @atr.nucleo", tipoDano: "Gelo", critMargem: 20, critMult: 2, notas: "toque", criado: 1 } },
      bonusCena: { c1: { nome: "Aura do Foco", ativo: true, acerto: 1, dano: "1d4", criado: 1 } },
      personalizacao: cor ? { cor, brilho: 50 } : undefined,
      arqclasse: { arquetipo: { notas: "<p>Conjurador: PM vem do Núcleo. A cada 5 níveis, +1 magia conhecida.</p>" }, classe: { notas: "<p>Arcanista da Torre de Aster. Estuda runas de gelo.</p>" } },
      ui: { ordemAbas: [], ordemCategorias: [], periciasFavoritasTopo: true }
    } },
    system: { attributes: { hp: { value: 34, max: 44, temp: 5 } }, traits: { languages: { value: new Set(["common", "elvish", "celestial"]), custom: "Língua das Sombras" } } },
    _source: { system: { attributes: { hp: { max: 44 } } } },
    statuses: new Set(["epm-molhado", "epm-enregelado", "epm-envenenamento-sistemico", "epm-colapso-fisico", "epm-concentrado"]),
    items: itens
  };
  ator.items.contents = itens;
  if (!cor) ator.flags[F].personalizacao = { abasExtras: { arqclasse: true } };
  else ator.flags[F].personalizacao.abasExtras = { arqclasse: true };
  return { ator, parceiro, itens };
}

/** Lista de idiomas no formato que a ficha recebe (como se viesse do Polyglot). */
export const IDIOMAS_POLYGLOT = [
  { key: "common", label: "Comum" }, { key: "elvish", label: "Élfico" }, { key: "dwarvish", label: "Anão" },
  { key: "draconic", label: "Dracônico" }, { key: "celestial", label: "Celestial" }, { key: "abyssal", label: "Abissal" },
  { key: "infernal", label: "Infernal" }, { key: "sylvan", label: "Silvestre" }, { key: "primordial", label: "Primordial" }
];
