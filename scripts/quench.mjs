/**
 * Testes do EPM no Quench (0.8.29): só carregam quando o módulo Quench está ativo (gancho "quenchReady").
 * Rodam no Foundry de verdade: criam fichas e itens temporários (nome começando com "[Teste EPM]", na pasta
 * "EPM · Testes (Quench)"), conferem e apagam tudo no fim. Rode como Mestre, de preferência num mundo de teste.
 *
 * Lotes:
 *  - epm-ficha.regras       contas puras (criação guiada, CD de Projeto, Habilidade Única, grupos, quem vê quais fichas)
 *  - epm-ficha.ficha        cria um personagem, abre a ficha e confere as abas e os números
 *  - epm-ficha.mochila      mochila compartilhada: pegar, guardar, passar e quem saiu não pega
 *  - epm-ficha.artifice     Projetos enviados (Afiação na arma de outro, Torreta no inventário) e Recolher
 *  - epm-ficha.npc          NPC rápido na pasta automática e NPCs modelo no compêndio
 *  - epm-ficha.grupos       grupos separados no Escudo (salva e restaura a configuração)
 *  - epm-ficha.combate      dano com Vida temporária, cura, consumível, condição na ficha, Engenhoca gastando cena
 *  - epm-ficha.compendios   os compêndios do EPM existem, têm conteúdo e ficam na pasta do EPM
 *  - epm-ficha.dialogos     fluxos com janelas, respondidas sozinhas: criação guiada, raça (Mutante com a Fera),
 *                           kit inicial, subir de nível, descanso, grupos, mochila, Projetos, Relações e NPC rápido
 *  - epm-ficha.catalogos    listas do sistema (bênçãos, condições, raças, kits, receitas, NPCs modelo, migrações)
 *
 * Padrão: toda mecânica nova ganha testes aqui (contas puras em "regras", o resto em um lote próprio).
 */
import { FLAG, MODULE_ID } from "./config.mjs";

export const PREFIXO = "[Teste EPM]";
export const PASTA_TESTES = "EPM · Testes (Quench)";
const espera = ms => new Promise(r => setTimeout(r, ms));
const itensDe = ator => ator?.items?.contents ?? [...(ator?.items ?? [])];

export function registrarQuench() {
  Hooks.on("quenchReady", quench => {
    try { registrarLotes(quench); } catch (err) { console.error("EPM | testes do Quench", err); }
  });
}

/** Cria e apaga as fichas de teste (e as mensagens que elas geram no chat). */
function ajudante() {
  const criados = [];
  const inicio = Date.now();
  let pasta = null;
  // Pastas de atores que já existiam (as criadas pelos testes, como "NPCs rápidos", saem no fim se ficarem vazias)
  const pastasAntes = new Set((game.folders?.contents ?? [...(game.folders ?? [])]).map(f => f.id));
  return {
    async pasta() {
      if (pasta) return pasta;
      pasta = game.folders?.find?.(f => f.type === "Actor" && f.name === PASTA_TESTES)
        ?? await Folder.create({ name: PASTA_TESTES, type: "Actor", color: "#555555" });
      return pasta;
    },
    async ator(nome, dados = {}) {
      const folder = (await this.pasta())?.id ?? null;
      const a = await Actor.create({
        name: `${PREFIXO} ${nome}`, type: dados.type ?? "character", folder,
        flags: { [FLAG]: dados.flags ?? {}, core: { sheetClass: `${MODULE_ID}.EPMActorSheet` } }, ...(dados.system ? { system: dados.system } : {})
      });
      criados.push(a);
      return a;
    },
    registrar(doc) { if (doc) criados.push(doc); return doc; },
    async limpar() {
      for (const a of criados.splice(0)) { try { if (game.actors.get(a.id)) await a.delete(); } catch (err) { console.warn("EPM | limpar teste", err); } }
      try {
        const msgs = (game.messages?.contents ?? []).filter(m => (m.timestamp ?? 0) >= inicio && String(m.content ?? "").includes("Teste EPM")).map(m => m.id);
        if (msgs.length && globalThis.ChatMessage?.deleteDocuments) await ChatMessage.deleteDocuments(msgs);
      } catch (err) { console.warn("EPM | limpar mensagens", err); }
      try {
        const novas = (game.folders?.contents ?? [...(game.folders ?? [])]).filter(f => f.type === "Actor" && !pastasAntes.has(f.id));
        const usada = id => (game.actors?.contents ?? []).some(a => (a.folder?.id ?? a.folder) === id) || (game.folders?.contents ?? []).some(f => (f.folder?.id ?? f.folder) === id);
        // Subpastas primeiro, depois as de cima
        for (let volta = 0; volta < 3; volta++) for (const f of novas) if (game.folders.get(f.id) && !usada(f.id)) await f.delete?.();
        pasta = null;
      } catch { /* as pastas ficam */ }
    }
  };
}

/**
 * Responde sozinho às janelas (DialogV2.wait/confirm/prompt) durante `fn`. Cada resposta é um valor ou uma
 * função (cfg) => valor; `padrao` preenche o formulário com o que já vem marcado. Devolve os títulos vistos.
 */
export async function comRespostas(respostas, fn) {
  const D = foundry.applications.api.DialogV2;
  const orig = { wait: D.wait, confirm: D.confirm, prompt: D.prompt };
  const fila = [...respostas];
  const titulos = [];
  const proximo = cfg => {
    titulos.push(cfg?.window?.title ?? "");
    if (!fila.length) return null;
    const r = fila.shift();
    return typeof r === "function" ? r(cfg) : r;
  };
  D.wait = async cfg => proximo(cfg);
  D.confirm = async cfg => { const r = proximo(cfg); return r === null ? false : r; };
  D.prompt = async cfg => proximo(cfg);
  try { const resultado = await fn(); return { resultado, titulos, sobrou: fila.length }; }
  finally { D.wait = orig.wait; D.confirm = orig.confirm; D.prompt = orig.prompt; }
}

/** Lê o formulário da janela como se o usuário só clicasse em confirmar (valores já preenchidos). */
export function respostaPadrao(cfg, mais = {}) {
  const raiz = new DOMParser().parseFromString(`<form>${cfg?.content ?? ""}</form>`, "text/html").querySelector("form");
  const out = {};
  for (const el of raiz.querySelectorAll("input[name], select[name], textarea[name]")) {
    const nome = el.name;
    const lista = nome.endsWith("[]");
    const chave = lista ? nome.slice(0, -2) : nome;
    if (el.type === "checkbox") { if (lista) { if (el.checked) (out[chave] ??= []).push(el.value); else out[chave] ??= []; } else out[chave] = el.checked; continue; }
    if (el.type === "radio") { if (el.checked) out[chave] = el.value; continue; }
    const v = el.tagName === "SELECT" ? (el.querySelector("option[selected]:not([disabled])") ?? el.querySelector("option:not([disabled])"))?.value ?? "" : el.value;
    if (lista) (out[chave] ??= []).push(v); else out[chave] = v;
  }
  return { ...out, ...mais };
}

/** Pula o lote quem não é Mestre (os testes criam e apagam fichas). */
function soMestre(ctx) {
  ctx.before(function () { if (!game.user?.isGM) this.skip(); });
}

export function registrarLotes(quench) {
  /* ------------------------------------------------------------ */
  quench.registerBatch(`${MODULE_ID}.regras`, ctx => {
    const { describe, it, assert } = ctx;
    describe("Criação guiada", () => {
      it("atributos: 16 pontos, o 4 só com dois em −1", async () => {
        const A = await import("./assistente-criacao.mjs");
        assert.isTrue(A.conferirAtributos({ forca: 3, destreza: 3, constituicao: 3, aparencia: 1, carisma: 1, inteligencia: 3, autocontrole: 1, nucleo: 1 }).ok);
        assert.isFalse(A.conferirAtributos({ forca: 4, destreza: 3 }).ok);
        assert.isTrue(A.conferirAtributos({ forca: 4, carisma: -1, aparencia: -1, destreza: 3 }).ok);
      });
      it("perícias pelo nível: 5 por perícia até o 15", async () => {
        const A = await import("./assistente-criacao.mjs");
        assert.equal(A.periciasDoNivel(14).total, 80);
        assert.equal(A.periciasDoNivel(14).limite, 5);
        assert.equal(A.periciasDoNivel(15).limite, 10);
        assert.isFalse(A.conferirPericias({ luta: 6 }, 14).ok);
      });
      it("Aumentos de Status respeitam o teto do nível", async () => {
        const A = await import("./assistente-criacao.mjs");
        assert.equal(A.aumentosDoNivel(10), 5);
        assert.isTrue(A.conferirAumentos({ forca: 5 }, { forca: 3 }, 10).ok);
        assert.isFalse(A.conferirAumentos({ forca: 5 }, { forca: 4 }, 10).ok);
      });
    });
    describe("Habilidade Única", () => {
      it("só 1; Compatibilidade à Fera libera mais 2", async () => {
        const R = await import("./racas.mjs");
        const mut = R.racaPorId("mutante");
        assert.ok(mut, "raça Mutante existe");
        const fera = mut.unicas.find(u => u.auto?.unicasExtras)?.id;
        const outras = mut.unicas.filter(u => u.id !== fera).map(u => u.id);
        assert.equal(R.conferirUnicas(mut, outras.slice(0, 2)).validas.length, 1);
        assert.equal(R.conferirUnicas(mut, [outras[0], fera, outras[1], outras[2]]).validas.length, 3);
      });
    });
    describe("Artífice", () => {
      it("CD de Projeto = 10 + Int + metade do bônus sem atributo", async () => {
        const PJ = await import("./projetos.mjs");
        assert.equal(PJ.cdDeProjeto(6, { pontos: 5, outros: 3, mod: 0 }), 20);
        assert.equal(PJ.cdDeProjeto(6, { bonusProprio: 9 }), 20);
      });
      it("Afiação vira dano extra; Placas viram RD", async () => {
        const PJ = await import("./projetos.mjs");
        const af = PJ.efeitoInstalado("afiacao", 2, 4, { modo: "acoplamento", tipoDano: "Fogo" });
        assert.equal(af.formula, "3d8 + 4");
        assert.equal(af.tipoDano, "Fogo");
        assert.equal(PJ.efeitoInstalado("placas-reforco", 3, 0).valor, 5);
      });
    });
    describe("Arquétipos", () => {
      it("Arsenal: 1, 2 e 3 Maestrias (níveis 1, 21 e 41)", async () => {
        const A = await import("./arquetipos.mjs");
        assert.equal(A.maestriasPermitidas(1), 1);
        assert.equal(A.maestriasPermitidas(21), 2);
        assert.equal(A.maestriasPermitidas(41), 3);
      });
      it("Acúmulo do Conjurador cresce com o nível", async () => {
        const A = await import("./arquetipos.mjs");
        assert.equal(A.acumuloDeMagias(1).magias, 3);
        assert.equal(A.acumuloDeMagias(10).magias, 12);
        assert.isAtLeast(A.acumuloDeMagias(10).truques, A.acumuloDeMagias(1).truques);
      });
      it("Artífice: Grau V e Livro de 14 receitas no nível 50", async () => {
        const A = await import("./arquetipos.mjs");
        assert.equal(A.criacaoDe(1, 4).grauMax, 1);
        assert.equal(A.criacaoDe(50, 4).grauMax, 5);
        assert.equal(A.criacaoDe(50, 4).livro, 14);
      });
      it("20 receitas; Gerador de Campo pede Grau III", async () => {
        const R = await import("./receitas-artifice.mjs");
        assert.equal(R.RECEITAS_ARTIFICE.length, 20);
        assert.equal(R.grauMinimo(R.receitaPorId("gerador-campo")), 3);
      });
      it("Teto de atributo: 8, 10, 12 e 15", async () => {
        const { tetoAtributo } = await import("./regras-extras.mjs");
        assert.deepEqual([1, 21, 31, 41].map(tetoAtributo), [8, 10, 12, 15]);
      });
    });
    describe("Mais contas", () => {
      it("atributo abaixo de −1 e perícia negativa são recusados", async () => {
        const A = await import("./assistente-criacao.mjs");
        assert.isFalse(A.conferirAtributos({ forca: -2 }).ok);
        assert.isFalse(A.conferirPericias({ luta: -1 }).ok);
        assert.equal(A.conferirPericias({ luta: 5, pontaria: 5 }).restante, 40);
      });
      it("Aumentos não passam do disponível", async () => {
        const A = await import("./assistente-criacao.mjs");
        assert.isFalse(A.conferirAumentos({ forca: 3, destreza: 3 }, {}, 10).ok);
        assert.equal(A.aumentosDoNivel(50), 26);
      });
      it("Mestiço: 2 Únicas, 4 com Mutante e a Fera", async () => {
        const R = await import("./racas.mjs");
        assert.equal(R.qtdUnicas({ mestico: true }, []), 2);
        assert.equal(R.qtdUnicas({ mestico: true }, ["mutante:fera"]), 4);
      });
      it("Estilos de Combate pelo nível", async () => {
        const A = await import("./arquetipos.mjs");
        assert.deepEqual([1, 5, 30].map(A.estilosPermitidos), [0, 1, 2]);
      });
      it("Placas acima do Grau V: +2 na RD por Grau", async () => {
        const PJ = await import("./projetos.mjs");
        assert.equal(PJ.efeitoInstalado("placas-reforco", 6, 0).valor, 10);
      });
      it("cores: hex curto, sem # e inválido", async () => {
        const C = await import("./cores.mjs");
        assert.equal(C.normalizarHex("#abc"), "#AABBCC");
        assert.equal(C.normalizarHex("ABCDEF"), "#ABCDEF");
        assert.ok(/^#[0-9A-F]{6}$/.test(C.normalizarHex("xyz")), "cai na cor padrão");
      });
      it("lista de fichas: o excluído não aparece", async () => {
        const EA = await import("./escolher-ator.mjs");
        const vis = EA.atoresVisiveis({ excluir: [game.actors.contents[0]?.uuid].filter(Boolean), usuario: { isGM: true } });
        assert.equal(vis.length, Math.max(0, game.actors.contents.length - 1));
      });
    });
    describe("Dano", () => {
      it("somar dados da arma e tirar o atributo da fórmula", async () => {
        const M = await import("./mecanicas.mjs");
        assert.equal(M.somarDadosDaArma("2d10 + 4", 1), "2d10 + 4 + 1d10");
        assert.equal(M.semModificadorDeDano("1d8 + @atr.forca"), "1d8");
      });
    });
    describe("Quem vê quais fichas", () => {
      it("o jogador não vê NPCs do Mestre; o Mestre vê todos", async () => {
        const EA = await import("./escolher-ator.mjs");
        const pj = { id: "pj", uuid: "x.pj", name: "A", hasPlayerOwner: true };
        const chefe = { id: "c", uuid: "x.c", name: "B", hasPlayerOwner: false, isOwner: false };
        assert.isTrue(EA.atorVisivel(pj, { isGM: false }));
        assert.isFalse(EA.atorVisivel(chefe, { isGM: false }));
        assert.isTrue(EA.atorVisivel(chefe, { isGM: true }));
      });
    });
  }, { displayName: "EPM: regras (sem criar nada)" });

  /* ------------------------------------------------------------ */
  quench.registerBatch(`${MODULE_ID}.ficha`, ctx => {
    const { describe, it, assert, after } = ctx;
    const h = ajudante();
    describe("Ficha de personagem", () => {
      soMestre(ctx);
      after(() => h.limpar());
      let ator;
      it("cria um personagem com a ficha EPM", async () => {
        ator = await h.ator("Personagem", { flags: { nivel: 5, arquetipo: "Combatente" } });
        assert.ok(ator, "ator criado");
        assert.equal(ator.flags?.[FLAG]?.nivel, 5);
      });
      it("calcula a ficha (atributos, perícias, CA, recursos)", async () => {
        const { estadoAtor } = await import("./mecanicas.mjs");
        const { ficha } = estadoAtor(ator);
        assert.ok(ficha.periciaPorId?.luta, "tem a perícia Luta");
        assert.isAtLeast(Number(ficha.ca?.total) || 0, 1);
        assert.ok(ficha.recursos?.pv, "tem Vida");
      });
      it("abre a ficha e mostra as abas", async function () {
        this.timeout?.(8000);
        await ator.sheet.render(true);
        let el = null;
        for (let i = 0; i < 40 && !(el = ator.sheet.element?.querySelector?.(".epm-nav-item")); i++) await espera(100);
        assert.ok(el, "a barra de abas apareceu");
        assert.isAtLeast(ator.sheet.element.querySelectorAll(".epm-nav-item").length, 8);
        await espera(300);
        await ator.sheet.close?.();
      });
    });
  }, { displayName: "EPM: ficha de personagem" });

  /* ------------------------------------------------------------ */
  quench.registerBatch(`${MODULE_ID}.mochila`, ctx => {
    const { describe, it, assert, after } = ctx;
    const h = ajudante();
    describe("Mochila compartilhada", () => {
      soMestre(ctx);
      after(() => h.limpar());
      let dono, membro, bau, sacola;
      const corda = () => itensDe(dono).find(i => i.name === `${PREFIXO} Corda`);
      it("prepara as fichas e as mochilas", async () => {
        const MC = await import("./mochila-compartilhada.mjs");
        dono = await h.ator("Dono"); membro = await h.ator("Membro");
        [bau, sacola] = await dono.createEmbeddedDocuments("Item", [{ name: `${PREFIXO} Baú`, type: "container" }, { name: `${PREFIXO} Sacola`, type: "container" }]);
        await dono.createEmbeddedDocuments("Item", [{ name: `${PREFIXO} Corda`, type: "loot", system: { quantity: 3, container: bau.id } }]);
        await MC.alternarMembro(bau, membro.id); await MC.alternarMembro(sacola, membro.id);
        assert.equal(MC.contextoCompartilhadas(membro).length, 2);
      });
      it("pegar 1 corda para o inventário do membro", async () => {
        const MC = await import("./mochila-compartilhada.mjs");
        assert.isTrue(await MC.executarTroca({ op: "pegar", membroId: membro.id, donoId: dono.id, mochilaId: bau.id, itemId: corda().id, qtd: 1 }));
        assert.equal(itensDe(membro).find(i => i.name === `${PREFIXO} Corda`)?.system?.quantity, 1);
        assert.equal(corda().system.quantity, 2);
      });
      it("passar as cordas do Baú para a Sacola", async () => {
        const MC = await import("./mochila-compartilhada.mjs");
        assert.isTrue(await MC.executarTroca({ op: "passar", membroId: membro.id, donoId: dono.id, mochilaId: bau.id, itemId: corda().id, qtd: 2, paraDonoId: dono.id, paraMochilaId: sacola.id }));
        assert.equal(corda().system.container, sacola.id);
      });
      it("guardar de volta empilha na mochila", async () => {
        const MC = await import("./mochila-compartilhada.mjs");
        const minha = itensDe(membro).find(i => i.name === `${PREFIXO} Corda`);
        assert.isTrue(await MC.executarTroca({ op: "guardar", membroId: membro.id, donoId: dono.id, mochilaId: sacola.id, itemId: minha.id, qtd: 1 }));
        assert.equal(corda().system.quantity, 3);
        assert.notOk(itensDe(membro).some(i => i.name === `${PREFIXO} Corda`));
      });
      it("quem saiu do compartilhamento não pega mais", async () => {
        const MC = await import("./mochila-compartilhada.mjs");
        await MC.alternarMembro(sacola, membro.id);
        assert.isFalse(await MC.executarTroca({ op: "pegar", membroId: membro.id, donoId: dono.id, mochilaId: sacola.id, itemId: corda().id, qtd: 1 }));
      });
    });
  }, { displayName: "EPM: mochila compartilhada" });

  /* ------------------------------------------------------------ */
  quench.registerBatch(`${MODULE_ID}.artifice`, ctx => {
    const { describe, it, assert, after } = ctx;
    const h = ajudante();
    describe("Projetos do Artífice em outras fichas", () => {
      soMestre(ctx);
      after(() => h.limpar());
      let art, aliado, espada, afiacao, torreta;
      const eng = (receita, nome) => ({ name: `${PREFIXO} ${nome}`, type: "equipment", flags: { [FLAG]: { projeto: { receita, nome, categoria: "engenhoca", tipo: "dano", grau: 2, cenas: 3, cenasMax: 3, ocupa: 1 } } } });
      it("Artífice nível 12: CD com Ofício e com Tecnologia", async () => {
        const PJ = await import("./projetos.mjs");
        art = await h.ator("Artífice", { flags: { arquetipo: "Artífice", nivel: 12, pericias: { oficio: { pontos: 5, outros: 3 } } } });
        aliado = await h.ator("Aliado");
        const est = PJ.estadoArtifice(art);
        assert.ok(est, "é Artífice");
        assert.equal(est.cd, 10 + est.intel + Math.floor(est.bonusPericia / 2));
        await art.update({ [`flags.${FLAG}.arquetipoOpcoes.artifice.periciaProjeto`]: "tecnologia" });
        assert.equal(PJ.estadoArtifice(art).periciaProjeto, "tecnologia");
      });
      it("Afiação instalada na arma do aliado", async () => {
        const PJ = await import("./projetos.mjs");
        [espada] = await aliado.createEmbeddedDocuments("Item", [{ name: `${PREFIXO} Espada`, type: "weapon", system: { equipped: true } }]);
        [afiacao, torreta] = await art.createEmbeddedDocuments("Item", [eng("afiacao", "Afiação"), eng("torreta", "Torreta")]);
        const ocupados = PJ.estadoArtifice(art).ocupados;
        assert.isTrue(await PJ.executarEnvio({ artificeId: art.id, itemId: afiacao.id, alvoId: aliado.id, alvoItemId: espada.id, modo: "acoplamento", tipoDano: "Fogo" }));
        const efs = Object.values(aliado.items.get(espada.id).flags?.[FLAG]?.efeitos ?? {});
        assert.ok(efs.some(e => e.tipo === "danoExtra" && e.tipoDano === "Fogo"), "dano extra de Fogo na espada");
        assert.equal(PJ.estadoArtifice(art).ocupados, ocupados, "continua ocupando a reserva");
      });
      it("Torreta vai para o inventário do aliado", async () => {
        const PJ = await import("./projetos.mjs");
        assert.isTrue(await PJ.executarEnvio({ artificeId: art.id, itemId: torreta.id, alvoId: aliado.id }));
        assert.ok(itensDe(aliado).some(i => i.flags?.[FLAG]?.projeto?.artificeId === art.id));
      });
      it("Recolher devolve tudo ao Artífice", async () => {
        const PJ = await import("./projetos.mjs");
        for (const id of Object.keys(art.flags?.[FLAG]?.projetosEnviados ?? {})) await PJ.executarRecolher({ artificeId: art.id, enviadoId: id });
        assert.equal(Object.keys(art.flags?.[FLAG]?.projetosEnviados ?? {}).length, 0);
        assert.equal(Object.keys(aliado.items.get(espada.id).flags?.[FLAG]?.efeitos ?? {}).length, 0);
        assert.equal(itensDe(art).filter(i => i.flags?.[FLAG]?.projeto).length, 2);
      });
    });
  }, { displayName: "EPM: Projetos do Artífice" });

  /* ------------------------------------------------------------ */
  quench.registerBatch(`${MODULE_ID}.npc`, ctx => {
    const { describe, it, assert, after } = ctx;
    const h = ajudante();
    describe("NPCs", () => {
      soMestre(ctx);
      after(() => h.limpar());
      it("NPC rápido vai para a pasta \"NPCs rápidos\" (subpasta da natureza)", async () => {
        const C = await import("./criar-npc.mjs");
        const c = C.gerarCriatura({ nome: `${PREFIXO} Lobo`, natureza: "Fera", forca: "fraca", nivel: 3, tipo: "monstro" });
        const folder = await C.pastaNpcRapido("Fera");
        const ator = h.registrar(await C.criarAtorDaCriatura(c, { folder }));
        assert.ok(ator, "NPC criado");
        const pasta = game.folders.get(ator.folder?.id ?? ator.folder);
        assert.equal(pasta?.name, "Fera");
        assert.equal(game.folders.get(pasta.folder?.id ?? pasta.folder)?.name, C.PASTA_NPC);
        assert.equal(await C.pastaNpcRapido("Fera"), folder, "não duplica a pasta");
      });
      it("compêndio de NPCs modelo tem os 35 modelos", async () => {
        const C = await import("./conteudo-epm.mjs");
        const nome = C.PACOTES?.npcs?.nome ?? "epm-npcs-modelo";
        const pack = game.packs.get(`world.${nome}`) ?? [...(game.packs?.values?.() ?? [])].find(p => p.metadata?.name === nome);
        assert.ok(pack, "compêndio EPM · NPCs modelo existe");
        const indice = await pack.getIndex();
        assert.isAtLeast(indice.size ?? indice.length ?? 0, C.NPCS_MODELO.length);
      });
    });
  }, { displayName: "EPM: NPCs" });

  /* ------------------------------------------------------------ */
  quench.registerBatch(`${MODULE_ID}.grupos`, ctx => {
    const { describe, it, assert, after, before } = ctx;
    const h = ajudante();
    let antes = null;
    describe("Grupos separados", () => {
      soMestre(ctx);
      before(() => { antes = foundry.utils.deepClone(game.settings.get(FLAG, "escudoGrupo") ?? {}); });
      after(async () => { if (antes) await game.settings.set(FLAG, "escudoGrupo", antes); await h.limpar(); });
      it("põe uma ficha num grupo e filtra por ele", async () => {
        const GS = await import("./grupos-separados.mjs");
        const a = await h.ator("Explorador"), b = await h.ator("Guarda");
        await game.settings.set(FLAG, "escudoGrupo", { ...(antes ?? {}), grupos: [{ id: "gteste", nome: `${PREFIXO} Grupo`, ids: [] }] });
        await GS.moverParaGrupo(a.id, "gteste");
        const cfg = game.settings.get(FLAG, "escudoGrupo");
        assert.equal(GS.grupoDoAtor(cfg, a.id), "gteste");
        assert.deepEqual(GS.filtrarGrupo([a, b], cfg, "gteste").map(x => x.id), [a.id]);
        assert.deepEqual(GS.filtrarGrupo([a, b], cfg, "-sem").map(x => x.id), [b.id]);
      });
    });
  }, { displayName: "EPM: grupos separados" });

  /* ------------------------------------------------------------ */
  quench.registerBatch(`${MODULE_ID}.combate`, ctx => {
    const { describe, it, assert, after } = ctx;
    const h = ajudante();
    describe("Combate e recursos", () => {
      soMestre(ctx);
      after(() => h.limpar());
      let ator;
      it("dano tira primeiro da Vida temporária", async () => {
        const M = await import("./mecanicas.mjs");
        ator = await h.ator("Lutador", { flags: { nivel: 5, arquetipo: "Combatente" } });
        await ator.update({ "system.attributes.hp.value": 20, "system.attributes.hp.temp": 5 });
        const { ficha } = M.estadoAtor(ator);
        const r = M.calcularPerda(ficha, "pv", 8);
        assert.equal(r.doTemp, 5);
        assert.equal(r.novo, 17);
      });
      it("cura não passa do máximo", async () => {
        const M = await import("./mecanicas.mjs");
        const { ficha } = M.estadoAtor(ator);
        const r = M.calcularRecuperacao(ficha, "pv", 99999);
        assert.equal(r.updates["system.attributes.hp.value"], ficha.recursos.pv.max);
      });
      it("usar um consumível gasta 1", async () => {
        const M = await import("./mecanicas.mjs");
        const [pocao] = await ator.createEmbeddedDocuments("Item", [{ name: `${PREFIXO} Poção`, type: "consumable", system: { quantity: 3 } }]);
        await M.usarItem(ator, pocao);
        assert.equal(ator.items.get(pocao.id)?.system?.quantity, 2);
      });
      it("condição ligada aparece na ficha", async () => {
        const M = await import("./mecanicas.mjs");
        await ator.toggleStatusEffect("epm-caido", { active: true });
        assert.ok(M.estadoAtor(ator).ficha.condicoesAtivas.some(c => c.id === "epm-caido"), "Caído ativo");
        await ator.toggleStatusEffect("epm-caido", { active: false });
        assert.notOk(M.estadoAtor(ator).ficha.condicoesAtivas.some(c => c.id === "epm-caido" && !c.automatica), "Caído desligado");
      });
      it("Engenhoca gasta 1 cena só na primeira ativação da cena", async () => {
        const PJ = await import("./projetos.mjs");
        const art = await h.ator("Artífice da Torreta", { flags: { arquetipo: "Artífice", nivel: 5 } });
        const [tor] = await art.createEmbeddedDocuments("Item", [{ name: `${PREFIXO} Torreta`, type: "equipment", flags: { [FLAG]: { projeto: { receita: "torreta", nome: "Torreta", categoria: "engenhoca", tipo: "dano", grau: 1, cenas: 3, cenasMax: 3, ocupa: 1 } } } }]);
        await PJ.usarProjeto(art, tor.id);
        assert.equal(art.items.get(tor.id).flags[FLAG].projeto.cenas, 2);
        await PJ.usarProjeto(art, tor.id);
        assert.equal(art.items.get(tor.id).flags[FLAG].projeto.cenas, 2, "segunda ativação na mesma cena não gasta");
      });
    });
  }, { displayName: "EPM: combate e recursos" });

  /* ------------------------------------------------------------ */
  quench.registerBatch(`${MODULE_ID}.compendios`, ctx => {
    const { describe, it, assert } = ctx;
    describe("Compêndios do EPM", () => {
      it("Manual, NPCs, loot, macros, melhorias e receitas existem e têm conteúdo", async () => {
        const { PACOTES } = await import("./conteudo-epm.mjs");
        const faltam = [];
        for (const cfg of Object.values(PACOTES)) {
          const pack = game.packs.get(`world.${cfg.nome}`) ?? [...(game.packs?.values?.() ?? [])].find(p => p.metadata?.name === cfg.nome);
          const qtd = pack ? ((await pack.getIndex()).size ?? 0) : 0;
          if (!qtd) faltam.push(cfg.rotulo);
        }
        assert.deepEqual(faltam, [], `vazios ou ausentes: ${faltam.join(", ")}`);
      });
      it("ficam todos na pasta do EPM na aba Compêndios", async () => {
        const C = await import("./conteudo-epm.mjs");
        if (game.user?.isGM) await C.organizarCompendios();
        const fora = [];
        for (const nome of await C.nomesCompendiosEpm()) {
          const pack = game.packs.get(`world.${nome}`) ?? [...(game.packs?.values?.() ?? [])].find(p => p.metadata?.name === nome);
          if (!pack) continue;
          const pasta = pack.folder?.name ?? game.folders?.get?.(pack.folder)?.name;
          if (pasta !== C.PASTA_COMPENDIOS) fora.push(pack.metadata?.label ?? nome);
        }
        assert.deepEqual(fora, [], `fora da pasta: ${fora.join(", ")}`);
      });
    });
  }, { displayName: "EPM: compêndios" });

  /* ------------------------------------------------------------ */
  quench.registerBatch(`${MODULE_ID}.dialogos`, ctx => {
    const { describe, it, assert, after } = ctx;
    const h = ajudante();
    describe("Fluxos com janelas (respondidas sozinhas)", () => {
      soMestre(ctx);
      after(() => h.limpar());

      it("criação guiada no nível 4: nível, atributos, perícias, Aumentos, Arsenal e kit do Combatente", async function () {
        this.timeout?.(20000);
        const AC = await import("./assistente-criacao.mjs");
        const ator = await h.ator("Recruta");
        const atr = { forca: 3, destreza: 3, constituicao: 3, aparencia: 1, carisma: 1, inteligencia: 3, autocontrole: 1, nucleo: 1 };
        const { titulos } = await comRespostas([
          cfg => respostaPadrao(cfg, { nome: ator.name, conceito: "", nivel: "4" }),
          "pular",
          cfg => respostaPadrao(cfg, Object.fromEntries(Object.entries(atr).map(([k, v]) => [k, String(v)]))),
          { arq: "combatente" },
          cfg => respostaPadrao(cfg, { luta: "5" }),
          cfg => respostaPadrao(cfg, { as_forca: "2", tipoFavorito: "Machado", maestrias: ["certeiro"], estilos: [] }),
          "pular",
          { ok: 1 },
          { kit: "combatente:a" }
        ], () => AC.assistenteCriacao(ator));
        const d = ator.flags[FLAG];
        assert.equal(titulos.length, 9, `janelas: ${titulos.join(" | ")}`);
        assert.equal(d.nivel, 4);
        assert.equal(d.atributos.forca.base, 3);
        assert.equal(d.atributos.forca.aumento, 2);
        assert.equal(d.pericias.luta.pontos, 5);
        assert.ok(/Combatente/.test(d.arquetipo), `arquétipo: ${d.arquetipo}`);
        assert.deepEqual(d.arquetipoOpcoes.combatente.maestrias, ["certeiro"]);
        assert.isAtLeast(itensDe(ator).filter(i => ["weapon", "equipment"].includes(i.type)).length, 1, "o kit criou itens");
      });

      it("kit inicial: o de outro arquétipo é recusado", async () => {
        const F6 = await import("./ficha-060.mjs");
        const ator = await h.ator("Mago Novo", { flags: { arquetipo: "Conjurador", nivel: 1 } });
        const antes = itensDe(ator).length;
        await comRespostas([{ kit: "combatente:a" }], () => F6.kitInicial(ator));
        assert.equal(itensDe(ator).length, antes);
        await comRespostas([{ kit: "conjurador:a" }], () => F6.kitInicial(ator));
        assert.isAtLeast(itensDe(ator).length, antes + 1);
      });

      it("raça Mutante com Compatibilidade à Fera escolhe 3 Habilidades Únicas", async () => {
        const F6 = await import("./ficha-060.mjs");
        const R = await import("./racas.mjs");
        const mut = R.racaPorId("mutante");
        const fera = mut.unicas.find(u => u.auto?.unicasExtras).id;
        const outras = mut.unicas.filter(u => u.id !== fera && !u.auto?.amalgama && !u.auto?.trocaAumento).map(u => u.id);
        const ator = await h.ator("Mutante");
        await comRespostas([{ raca: "mutante" }, { unicas: [fera, outras[0], outras[1]] }, cfg => respostaPadrao(cfg), cfg => respostaPadrao(cfg)], () => F6.escolherRaca(ator));
        const esc = ator.flags[FLAG].racaEscolha;
        assert.equal(esc?.id, "mutante");
        assert.equal(esc.unicas.length, 3);
        assert.ok(esc.unicas.includes(fera), "a Fera fica");
      });

      it("raça comum: duas Únicas marcadas viram uma", async () => {
        const F6 = await import("./ficha-060.mjs");
        const R = await import("./racas.mjs");
        const raca = R.RACAS.find(r => !r.mestico && r.id !== "mutante" && r.unicas?.length > 2 && !r.unicas.some(u => u.auto?.unicasExtras || u.auto?.amalgama));
        const ator = await h.ator("Humano");
        await comRespostas([{ raca: raca.id }, { unicas: raca.unicas.slice(0, 2).map(u => u.id) }, cfg => respostaPadrao(cfg), cfg => respostaPadrao(cfg)], () => F6.escolherRaca(ator));
        assert.equal(ator.flags[FLAG].racaEscolha?.unicas?.length, 1);
      });

      it("subir de nível gasta os PEv", async () => {
        const M = await import("./mecanicas.mjs");
        const { custoNivel } = await import("./config.mjs");
        const ator = await h.ator("Veterano", { flags: { arquetipo: "Combatente", nivel: 5, pontos: { pev: 100 } } });
        await comRespostas([true], () => M.subirNivel(ator));
        assert.equal(ator.flags[FLAG].nivel, 6);
        assert.equal(ator.flags[FLAG].pontos.pev, 100 - custoNivel(6));
      });

      it("subir de nível sem PEv não muda nada", async () => {
        const M = await import("./mecanicas.mjs");
        const ator = await h.ator("Sem PEv", { flags: { arquetipo: "Combatente", nivel: 5, pontos: { pev: 0 } } });
        await comRespostas([true], () => M.subirNivel(ator));
        assert.equal(ator.flags[FLAG].nivel, 5);
      });

      it("descanso longo enche Mana e Estamina", async () => {
        const M = await import("./mecanicas.mjs");
        const ator = await h.ator("Cansado", { flags: { arquetipo: "Conjurador", nivel: 5 } });
        const r0 = M.estadoAtor(ator).ficha.recursos;
        await ator.update({ [`flags.${FLAG}.recursos.pm.value`]: 0, [`flags.${FLAG}.recursos.pe.value`]: 0 });
        await comRespostas([{ pv: true, pm: true, pe: true, ps: false, exaustao: false, treino: false, atividade: null }], () => M.descanso(ator, "longo"));
        const r = M.estadoAtor(ator).ficha.recursos;
        assert.equal(r.pm.value, r0.pm.max);
        assert.equal(r.pe.value, r0.pe.max);
      });

      it("grupos: criar, renomear e apagar pelo Escudo", async () => {
        const GS = await import("./grupos-separados.mjs");
        const antes = foundry.utils.deepClone(game.settings.get(FLAG, "escudoGrupo") ?? {});
        try {
          const a = await h.ator("Batedor");
          const { resultado: id } = await comRespostas([`${PREFIXO} Vanguarda`], () => GS.novoGrupo([a.id]));
          assert.ok(id, "grupo criado");
          assert.equal(GS.grupoDoAtor(game.settings.get(FLAG, "escudoGrupo"), a.id), id);
          await comRespostas([`${PREFIXO} Retaguarda`], () => GS.renomearGrupo(id));
          assert.equal(GS.lerGrupos(game.settings.get(FLAG, "escudoGrupo")).find(g => g.id === id)?.nome, `${PREFIXO} Retaguarda`);
          await comRespostas([true], () => GS.apagarGrupo(id));
          assert.notOk(GS.lerGrupos(game.settings.get(FLAG, "escudoGrupo")).some(g => g.id === id));
        } finally { await game.settings.set(FLAG, "escudoGrupo", antes); }
      });

      it("mochila: compartilhar pela lista com busca e Mover para a mochila do membro", async () => {
        const MC = await import("./mochila-compartilhada.mjs");
        const dono = await h.ator("Carregador"), membro = await h.ator("Companheiro");
        const [bau] = await dono.createEmbeddedDocuments("Item", [{ name: `${PREFIXO} Baú`, type: "container" }]);
        const [tocha] = await dono.createEmbeddedDocuments("Item", [{ name: `${PREFIXO} Tocha`, type: "loot", system: { quantity: 4, container: bau.id } }]);
        const [alforje] = await membro.createEmbeddedDocuments("Item", [{ name: `${PREFIXO} Alforje`, type: "container" }]);
        await comRespostas([{ uuids: [membro.uuid], ids: [membro.id] }], () => MC.escolherMembros(bau));
        assert.deepEqual(MC.membrosDe(dono.items.get(bau.id)), [membro.id]);
        await comRespostas([{ destino: `minha:${alforje.id}`, qtd: 3 }], () => MC.moverDaCompartilhada(membro, dono.id, bau.id, tocha.id));
        assert.equal(itensDe(membro).find(i => i.name === `${PREFIXO} Tocha`)?.system?.container, alforje.id);
        assert.equal(dono.items.get(tocha.id)?.system?.quantity, 1);
      });

      it("Mover para do inventário guarda na mochila compartilhada", async () => {
        const MC = await import("./mochila-compartilhada.mjs");
        const Sel = await import("./selecao.mjs");
        const dono = await h.ator("Mula"), membro = await h.ator("Viajante");
        const [bau] = await dono.createEmbeddedDocuments("Item", [{ name: `${PREFIXO} Arca`, type: "container" }]);
        await MC.alternarMembro(bau, membro.id);
        const [pedra] = await membro.createEmbeddedDocuments("Item", [{ name: `${PREFIXO} Pedra`, type: "loot", system: { quantity: 2 } }]);
        await comRespostas([{ destino: `comp:${dono.id}:${bau.id}`, qtd: 2 }], () => Sel.moverItemPara(membro, pedra));
        assert.ok(itensDe(dono).some(i => i.name === `${PREFIXO} Pedra` && i.system?.container === bau.id));
        assert.notOk(itensDe(membro).some(i => i.name === `${PREFIXO} Pedra`));
      });

      it("Artífice: fabricar, enviar pela lista e desmontar", async () => {
        const PJ = await import("./projetos.mjs");
        const art = await h.ator("Inventora", { flags: { arquetipo: "Artífice", nivel: 5, artificeLivro: { l1: { receita: "torreta" }, l2: { receita: "carga-explosiva" } } } });
        const amigo = await h.ator("Amigo");
        const livro = PJ.estadoArtifice(art).livro;
        const torreta = livro.find(r => r.id === "torreta");
        const { resultado: item } = await comRespostas([{ grau: 1, variante: "", portador: art.name }], () => PJ.fabricarProjeto(art, torreta.chave));
        assert.ok(item, "Torreta fabricada");
        assert.equal(PJ.estadoArtifice(art).engenhocas.length, 1);
        await comRespostas([{ uuids: [amigo.uuid], ids: [amigo.id] }], () => PJ.enviarProjeto(art, item.id));
        assert.ok(itensDe(amigo).some(i => i.flags?.[FLAG]?.projeto?.receita === "torreta"));
        const enviado = Object.keys(art.flags[FLAG].projetosEnviados ?? {})[0];
        await PJ.recolherProjeto(art, enviado);
        const volta = PJ.estadoArtifice(art).engenhocas[0];
        await comRespostas([true], () => PJ.desmontarEngenhoca(art, volta.id));
        assert.equal(PJ.estadoArtifice(art).engenhocas.length, 0);
        const carga = livro.find(r => r.id === "carga-explosiva");
        await comRespostas([{ grau: 1, variante: "", portador: "" }], () => PJ.fabricarProjeto(art, carga.chave));
        assert.equal(PJ.estadoArtifice(art).consumiveis.length, 1);
        assert.equal(PJ.estadoArtifice(art).gastos, 1);
      });

      it("Relações: conectar pela lista com busca", async () => {
        const Rel = await import("./relacoes.mjs");
        const a = await h.ator("Amiga"), b = await h.ator("Parceiro");
        await comRespostas([{ uuids: [b.uuid], ids: [b.id] }], () => Rel.dialogoConectar(a));
        assert.ok(Object.values(a.flags[FLAG].relacoes ?? {}).some(r => r?.uuid === b.uuid));
      });

      it("NPC rápido: 2 fichas na pasta \"NPCs rápidos\"", async () => {
        const C = await import("./criar-npc.mjs");
        const { resultado } = await comRespostas([cfg => respostaPadrao(cfg, { nome: `${PREFIXO} Goblin`, qtd: "2", natureza: "Humanoide", pasta: true, abrir: false })], () => C.criarNpcRapido());
        for (const a of resultado ?? []) h.registrar(a);
        assert.equal(resultado?.length, 2);
        assert.ok(resultado.every(a => a.name.startsWith(`${PREFIXO} Goblin`)));
        const pasta = game.folders.get(resultado[0].folder?.id ?? resultado[0].folder);
        assert.equal(pasta?.name, "Humanoide");
      });
    });
  }, { displayName: "EPM: fluxos com janelas" });

  /* ------------------------------------------------------------ */
  quench.registerBatch(`${MODULE_ID}.catalogos`, ctx => {
    const { describe, it, assert } = ctx;
    describe("Listas do sistema", () => {
      it("Bênçãos e Maldições: 219 entradas, com nome e natureza", async () => {
        const B = await import("./bencaos.mjs");
        assert.isAtLeast(B.CATALOGO.length, 200);
        assert.ok(B.CATALOGO.every(e => e.nome && e.natureza));
      });
      it("Condições: todas com id, nome e ícone; combinações apontam para condições que existem", async () => {
        const { CONDICOES } = await import("./config.mjs");
        const C = await import("./condicoes.mjs");
        assert.isAtLeast(CONDICOES.length, 100);
        assert.ok(CONDICOES.every(c => c.id && c.label && c.icone), "id, label e ícone");
        assert.equal(new Set(CONDICOES.map(c => c.id)).size, CONDICOES.length, "ids únicos");
        assert.isAtLeast(C.COMBINACOES.length, 10);
      });
      it("Raças: todas com habilidades e Únicas", async () => {
        const R = await import("./racas.mjs");
        assert.isAtLeast(R.RACAS.length, 10);
        assert.ok(R.RACAS.filter(r => !r.mestico).every(r => Array.isArray(r.unicas) && r.unicas.length), "Únicas em todas");
      });
      it("Kits iniciais: os 3 arquétipos, com itens", async () => {
        const { KITS_INICIAIS } = await import("./catalogos.mjs");
        assert.deepEqual(Object.keys(KITS_INICIAIS).sort(), ["artifice", "combatente", "conjurador"]);
        assert.ok(Object.values(KITS_INICIAIS).flat().every(k => k.itens?.length), "todo kit tem itens");
      });
      it("Receitas do Artífice: 5 valores por receita e categorias certas", async () => {
        const R = await import("./receitas-artifice.mjs");
        assert.ok(R.RECEITAS_ARTIFICE.every(r => r.valores?.length === 5 && ["consumivel", "engenhoca"].includes(r.categoria)));
        assert.equal(R.RECEITAS_ARTIFICE.filter(r => r.categoria === "engenhoca").length, 8);
      });
      it("NPCs modelo: ids únicos, os 5 tipos e números batendo com a tabela", async () => {
        const C = await import("./conteudo-epm.mjs");
        const { lerAtor } = await import("./context.mjs");
        const n = await C.documentosNpcs();
        assert.equal(new Set(n.docs.map(d => d._id)).size, n.docs.length);
        assert.ok(["comum", "importante", "monstro", "forte", "chefe"].every(t => n.docs.some(d => d.flags[FLAG].npc.tipo === t)));
        const errados = n.docs.filter(d => { const { ficha } = lerAtor({ ...d, items: [] }); return ficha.ca.total !== d.flags[FLAG].npc.referencia.ca; }).map(d => d.name);
        assert.deepEqual(errados, []);
      });
      it("NPC rápido: força maior dá mais Vida e CA; dano vira fórmula", async () => {
        const N = await import("./criar-npc.mjs");
        const fraca = N.gerarCriatura({ forca: "fraca", nivel: 10 }), forte = N.gerarCriatura({ forca: "muitoForte", nivel: 10 });
        assert.isAtLeast(forte.pv, fraca.pv + 1);
        assert.isAtLeast(forte.ca, fraca.ca);
        assert.equal(N.formulaDoDano(12), "2d6 + 5");
        assert.deepEqual(N.distribuir(10, { a: 1, b: 1, c: 2 }), { a: 2, b: 2, c: 6 });
      });
      it("Migração dos arquétipos (0.8.27): a Maestria única vira lista", async () => {
        const MM = await import("./migracoes-mundo.mjs");
        const up = MM.trocasArquetipos0827({ arquetipoOpcoes: { combatente: { maestria: "certeiro" } }, ajustesBonus: { "arq-maestria-custo": 3 } });
        assert.deepEqual(up[`flags.${FLAG}.arquetipoOpcoes.combatente.maestrias`], ["certeiro"]);
        assert.equal(up[`flags.${FLAG}.ajustesBonus.arq-maestria-certeiro-custo`], 3);
      });
      it("Custo de nível: 2 × (nível − 1) PEv", async () => {
        const { custoNivel } = await import("./config.mjs");
        assert.deepEqual([2, 6, 50].map(custoNivel), [2, 10, 98]);
      });
      it("Grupos: abas Todos, cada grupo e Sem grupo", async () => {
        const GS = await import("./grupos-separados.mjs");
        const cfg = { grupos: [{ id: "g1", nome: "A", ids: ["x"] }] };
        const c = GS.contextoGrupos(cfg, "g1", [{ id: "x" }, { id: "y" }]);
        assert.deepEqual(c.abas.map(a => [a.nome, a.qtd]), [["Todos", 2], ["A", 1], ["Sem grupo", 1]]);
      });
      it("Criação guiada: Conjurador e Artífice mostram as escolhas do nível", async () => {
        const AC = await import("./assistente-criacao.mjs");
        assert.ok(/Acúmulo/.test(AC.escolhasDoArquetipo("conjurador", 10, {}).html));
        assert.ok(/Livro de Projetos/.test(AC.escolhasDoArquetipo("artifice", 10, {}, { atributos: {}, pericias: [] }).html));
      });
    });
  }, { displayName: "EPM: listas e catálogos" });
}
