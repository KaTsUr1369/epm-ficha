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
      try { if (pasta && !(game.actors?.contents ?? []).some(a => (a.folder?.id ?? a.folder) === pasta.id)) await pasta.delete?.(); pasta = null; } catch { /* a pasta fica */ }
    }
  };
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
}
