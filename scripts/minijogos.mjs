/**
 * Minijogos do treino rápido (aba Treinamentos). Cada jogo tem 5 rodadas e devolve o número de acertos
 * (ou null se o jogador fechar antes de começar). Funcionam com teclado ou mouse.
 *
 *  - Sequência (Reflexos): repita as setas mostradas antes do tempo acabar.
 *  - Na mira (Foco): pare o marcador dentro da faixa verde, que diminui a cada rodada.
 *  - Explosão (Força): aperte Espaço (ou clique) o mais rápido possível para encher a barra a tempo.
 */
import { MINIJOGOS, PT_POR_ACERTOS } from "./config.mjs";

const RODADAS = 5;
const SETAS = { ArrowUp: "fa-arrow-up", ArrowDown: "fa-arrow-down", ArrowLeft: "fa-arrow-left", ArrowRight: "fa-arrow-right" };
const esperar = ms => new Promise(r => setTimeout(r, ms));

/** Abre o minijogo `id` e resolve com os acertos (0 a 5) ou null se fechado antes de jogar. */
export function jogarMinijogo(id) {
  const jogo = MINIJOGOS[id] ? id : "sequencia";
  return new Promise(resolve => {
    const raiz = document.createElement("div");
    raiz.className = "epm-minijogo-fundo";
    raiz.innerHTML = `
      <div class="epm-minijogo" role="dialog" aria-label="Treino rápido: ${MINIJOGOS[jogo].label}" tabindex="-1">
        <header><i class="${MINIJOGOS[jogo].icone}" aria-hidden="true"></i><h2>${MINIJOGOS[jogo].label}</h2>
          <button type="button" class="epm-minijogo-fechar" title="Sair" aria-label="Sair"><i class="fa-solid fa-xmark"></i></button></header>
        <p class="epm-minijogo-dica">${MINIJOGOS[jogo].dica}</p>
        <ol class="epm-minijogo-rodadas">${Array.from({ length: RODADAS }, () => "<li></li>").join("")}</ol>
        <div class="epm-minijogo-area"></div>
        <div class="epm-minijogo-tempo"><span></span></div>
        <footer><button type="button" class="epm-minijogo-acao">Começar</button></footer>
      </div>`;
    document.body.append(raiz);
    const caixa = raiz.querySelector(".epm-minijogo");
    const area = raiz.querySelector(".epm-minijogo-area");
    const barraTempo = raiz.querySelector(".epm-minijogo-tempo span");
    const acao = raiz.querySelector(".epm-minijogo-acao");
    const marcas = [...raiz.querySelectorAll(".epm-minijogo-rodadas li")];
    let jogando = false;
    let terminou = false;
    let ouvinte = null;
    let acertos = 0;
    const fechar = valor => {
      terminou = true;
      if (ouvinte) document.removeEventListener("keydown", ouvinte, true);
      raiz.remove();
      resolve(valor);
    };
    raiz.querySelector(".epm-minijogo-fechar").addEventListener("click", () => fechar(jogando ? acertos : null));
    caixa.focus();

    /** Uma rodada: devolve true/false. `entrada(tecla|clique)` recebe os eventos. */
    const rodada = (n) => new Promise(fim => {
      let acabou = false;
      const terminar = ok => {
        if (acabou) return;
        acabou = true;
        cancelAnimationFrame(quadro);
        clearTimeout(limite);
        fim(ok);
      };
      let quadro = 0;
      let limite = 0;
      const animarTempo = (ms) => {
        const t0 = performance.now();
        const passo = () => {
          const f = Math.min(1, (performance.now() - t0) / ms);
          barraTempo.style.width = `${(1 - f) * 100}%`;
          if (f < 1 && !acabou) quadro = requestAnimationFrame(passo);
        };
        quadro = requestAnimationFrame(passo);
        limite = setTimeout(() => terminar(false), ms);
      };

      if (jogo === "sequencia") {
        const tamanho = [3, 3, 4, 4, 5][n] ?? 5;
        const teclas = Object.keys(SETAS);
        const alvo = Array.from({ length: tamanho }, () => teclas[Math.floor(Math.random() * teclas.length)]);
        let pos = 0;
        area.innerHTML = `<div class="epm-mj-setas">${alvo.map(t => `<span><i class="fa-solid ${SETAS[t]}"></i></span>`).join("")}</div>
          <div class="epm-mj-pad">${teclas.map(t => `<button type="button" data-tecla="${t}" aria-label="${t}"><i class="fa-solid ${SETAS[t]}"></i></button>`).join("")}</div>`;
        const casas = [...area.querySelectorAll(".epm-mj-setas span")];
        const apertar = tecla => {
          if (acabou || !SETAS[tecla]) return;
          if (tecla === alvo[pos]) {
            casas[pos].classList.add("ok");
            pos += 1;
            if (pos >= alvo.length) terminar(true);
          } else {
            casas[pos]?.classList.add("erro");
            terminar(false);
          }
        };
        area.querySelectorAll("[data-tecla]").forEach(b => b.addEventListener("click", () => apertar(b.dataset.tecla)));
        ouvinte = ev => { if (SETAS[ev.key]) { ev.preventDefault(); ev.stopPropagation(); apertar(ev.key); } };
        animarTempo(2200 + tamanho * 550);
      } else if (jogo === "mira") {
        const largura = [30, 25, 20, 16, 13][n] ?? 13;
        const inicio = 10 + Math.random() * (80 - largura);
        const velocidade = [55, 65, 75, 90, 105][n] ?? 105; // % da barra por segundo
        area.innerHTML = `<div class="epm-mj-trilho" role="button" tabindex="0" aria-label="Parar o marcador">
          <span class="epm-mj-zona" style="left: ${inicio}%; width: ${largura}%"></span><span class="epm-mj-marcador"></span></div>
          <p class="epm-dica">Espaço ou clique para parar.</p>`;
        const marcador = area.querySelector(".epm-mj-marcador");
        let x = 0;
        let dir = 1;
        let ultimo = performance.now();
        const mover = agora => {
          if (acabou) return;
          x += dir * velocidade * ((agora - ultimo) / 1000);
          ultimo = agora;
          if (x >= 100) { x = 100; dir = -1; }
          if (x <= 0) { x = 0; dir = 1; }
          marcador.style.left = `${x}%`;
          quadro = requestAnimationFrame(mover);
        };
        quadro = requestAnimationFrame(mover);
        const parar = () => {
          if (acabou) return;
          const ok = x >= inicio && x <= inicio + largura;
          marcador.classList.add(ok ? "ok" : "erro");
          terminar(ok);
        };
        area.querySelector(".epm-mj-trilho").addEventListener("click", parar);
        ouvinte = ev => { if (ev.code === "Space" || ev.key === " " || ev.key === "Enter") { ev.preventDefault(); ev.stopPropagation(); parar(); } };
        barraTempo.style.width = "100%";
        limite = setTimeout(() => terminar(false), 6000);
      } else {
        const meta = [10, 11, 12, 13, 14][n] ?? 14;
        let toques = 0;
        area.innerHTML = `<div class="epm-mj-forca"><span></span></div>
          <button type="button" class="epm-mj-socar"><i class="fa-solid fa-hand-fist"></i> Apertar</button>
          <p class="epm-dica">Espaço ou clique: ${meta} vezes antes do tempo acabar.</p>`;
        const enche = area.querySelector(".epm-mj-forca span");
        const socar = () => {
          if (acabou) return;
          toques += 1;
          enche.style.width = `${Math.min(100, (toques / meta) * 100)}%`;
          if (toques >= meta) terminar(true);
        };
        area.querySelector(".epm-mj-socar").addEventListener("click", socar);
        ouvinte = ev => { if ((ev.code === "Space" || ev.key === " ") && !ev.repeat) { ev.preventDefault(); ev.stopPropagation(); socar(); } };
        animarTempo(2600);
      }
      document.addEventListener("keydown", ouvinte, true);
    }).finally(() => {
      if (ouvinte) document.removeEventListener("keydown", ouvinte, true);
      ouvinte = null;
    });

    acao.addEventListener("click", async () => {
      if (acao.dataset.fim) return fechar(acertos);
      if (jogando) return;
      jogando = true;
      acao.disabled = true;
      acao.textContent = "…";
      for (let n = 0; n < RODADAS && !terminou; n++) {
        marcas[n].classList.add("atual");
        acao.textContent = `Rodada ${n + 1} de ${RODADAS}`;
        const ok = await rodada(n);
        if (terminou) return;
        marcas[n].classList.remove("atual");
        marcas[n].classList.add(ok ? "ok" : "erro");
        if (ok) acertos += 1;
        await esperar(650);
      }
      if (terminou) return;
      const pt = PT_POR_ACERTOS[acertos] ?? 0;
      area.innerHTML = `<div class="epm-mj-resultado"><strong>${acertos} de ${RODADAS}</strong><span>${pt ? `+${pt} PT` : "Nenhum PT desta vez"}</span></div>`;
      barraTempo.style.width = "0%";
      acao.disabled = false;
      acao.dataset.fim = "1";
      acao.textContent = "Concluir";
      acao.focus();
    });
    acao.focus();
  });
}
