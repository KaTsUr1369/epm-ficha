globalThis.foundry = { utils: { randomID: () => Math.random().toString(36).slice(2, 18), deepClone: x => structuredClone(x), getProperty: (o, p) => p.split(".").reduce((a, k) => a?.[k], o) } };
globalThis.game = { actors: [] };
const R = await import("/home/claude/epm-ficha/scripts/regras-extras.mjs");
let falhas = 0; const ok = (c, m) => { console.log(c ? "ok  " : "FALHA", m); if (!c) falhas++; };
const it = (id, name, desc, flags) => ({ id, name, system: { description: { value: desc } }, flags: { "epm-ficha": flags } });
const itens = [
  it("a", "Especialista em Campo", "<p>x</p><p>Combatente, nível 23 (modelo 0.5).</p>", { arquetipoRef: "combatente:23" }),
  it("b", "Ataque Extra 6.0", "<p>x (modelo 0.5)</p>", { arquetipoRef: "combatente:50" }),
  it("d", "Ataque Extra 6.0 (minha)", "<p>texto do jogador</p>", { arquetipoRef: "combatente:50" }),
  it("c", "Revestimento Elemental", "<p>y</p><p>Guerreiro Elemental, nível 6.</p>", { classeRef: "guerreiroElemental:revestimento-elemental" })
];
const log = {};
game.actors = [{ flags: { "epm-ficha": { arquetipo: "Combatente", nivel: 30, classe: R.CLASSES_NOTION.guerreiroElemental.nome } }, items: { contents: itens },
  deleteEmbeddedDocuments: async (_, ids) => log.apagar = ids, updateEmbeddedDocuments: async (_, u) => log.upd = u,
  createEmbeddedDocuments: async (_, c) => log.criar = c.map(x => x.name), update: async u => log.flag = u }];
const M = await import("/home/claude/epm-ficha/scripts/migracoes-mundo.mjs");
ok(await M.arquetiposEClasses0820() === 1, "uma ficha migrada");
ok(log.apagar?.join() === "b", "Ataque Extra 6.0 do modelo sai; a escrita pelo jogador fica");
ok(log.upd?.some(u => u.name === "Comando de Campo") && log.upd?.some(u => u.name === "Pele de Mana" && u["flags.epm-ficha.classeRef"] === "guerreiroElemental:pele-de-mana"), "renomeia Especialista em Campo e Revestimento Elemental");
ok(log.criar?.includes("Fôlego de Combate 2.0") && !log.criar?.includes("Arma Favorita"), "só as habilidades novas de arquétipo entram");
ok(log.flag?.["flags.epm-ficha.classes0820"] === true, "marca a ficha para não repetir");
const T = M.trocasValores0820({ ajustesBonus: { "arq-estilo-duelista-acertoisolado": 3, "arq-estilo-dupla-acerto": 5 } });
ok("flags.epm-ficha.ajustesBonus.-=arq-estilo-duelista-acertoisolado" in T && Object.keys(T).length === 1, "ajuste com o padrão antigo volta ao livro; ajuste pessoal fica");
process.exit(falhas ? 1 : 0);
