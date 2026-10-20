/**
 * app.js - Zahlenschloss-Simulation & Hacker-Challenge v2.1
 * Doppel-Raster Monte-Carlo (Top-3 vs. Top-1), 4 Verhaltens-Presets (inkl. Moderat ±0..5),
 * dynamische Doppel-Kurve und Side-by-Side Challenge mit kumulativem N-Slider.
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    mode: 'labor', // 'labor' | 'game'
    params: {
      digitsCount: 5, // 3 | 4 | 5 Ziffern
      preset: 'standard', // 'faul' | 'standard' | 'moderat' | 'gruendlich' | 'halbdrehung' | 'sicher'
      N: 15,
      noise: 10, // 0 - 40 %
      topK: 3,
      thumbCoupling: true
    },
    mc: {
      runs: 100,
      isRunning: false
    },
    game: {
      digitsCount: 5,
      preset: 'standard',
      secret: [4, 7, 2, 8, 1],
      current: [0, 0, 0, 0, 0],
      isUnlocked: false,
      isSecretVisible: false,
      attemptsLeft: 5,
      maxAttempts: 5,
      isOver: false,
      won: false,
      strategy: 'peak', // 'peak' (Strategie 1: Zero-Shift) oder 'offset' (Strategie 2: Habitual Offset)
      poolObservations: [], // Bis zu 30 Beobachtungen vorgeneriert
      activeObservations: [],
      freqMatrix: Array.from({ length: 5 }, () => Array(10).fill(0)),
      topCandidates: Array.from({ length: 5 }, () => []),
      bestGuess: [0, 0, 0, 0, 0]
    }
  };

  // --- DOM ELEMENTE ---
  const el = {
    // Header & Navigation
    btnModeLabor: document.getElementById('btnModeLabor'),
    btnModeGame: document.getElementById('btnModeGame'),
    btnOpenAssumptions: document.getElementById('btnOpenAssumptions'),
    btnToggleSound: document.getElementById('btnToggleSound'),
    soundIcon: document.getElementById('soundIcon'),
    modalAssumptions: document.getElementById('modalAssumptions'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    toast: document.getElementById('toast'),
    laborView: document.getElementById('laborView'),
    gameView: document.getElementById('gameView'),
    auditView: document.getElementById('auditView'),

    // Modi Buttons
    btnModeLabor: document.getElementById('btnModeLabor'),
    btnModeGame: document.getElementById('btnModeGame'),
    btnModeAudit: document.getElementById('btnModeAudit'),

    // Zylinder-Wahlschalter
    digitsBtns: document.querySelectorAll('.digits-btn'),

    // Labor Steuerung
    presetChips: document.querySelectorAll('.preset-chip:not(.game-preset-btn)'),
    presetDesc: document.getElementById('presetDesc'),
    sliderObservations: document.getElementById('sliderObservations'),
    valObservations: document.getElementById('valObservations'),
    sliderNoise: document.getElementById('sliderNoise'),
    valNoise: document.getElementById('valNoise'),
    checkCoupling: document.getElementById('checkCoupling'),
    mathCurveCanvas: document.getElementById('mathCurveCanvas'),
    curvePctTop3: document.getElementById('curvePctTop3'),
    curvePctTop1: document.getElementById('curvePctTop1'),

    // Labor Monte-Carlo (Zwei Raster) & Benchmark
    btnRunMonteCarlo: document.getElementById('btnRunMonteCarlo'),
    mcGridTop3: document.getElementById('mcGridTop3'),
    mcSuccessTop3: document.getElementById('mcSuccessTop3'),
    mcGridTop1: document.getElementById('mcGridTop1'),
    mcSuccessTop1: document.getElementById('mcSuccessTop1'),
    labelTop3Space: document.getElementById('labelTop3Space'),
    benchmarkCardsGrid: document.getElementById('benchmarkCardsGrid'),

    // Game Elemente
    gamePresetBtns: document.querySelectorAll('.game-preset-btn'),
    sliderGameObservations: document.getElementById('sliderGameObservations'),
    gameObsCountDisplay: document.getElementById('gameObsCountDisplay'),
    attemptsIcons: document.getElementById('attemptsIcons'),
    secretDisplay: document.getElementById('secretDisplay'),
    btnToggleSecret: document.getElementById('btnToggleSecret'),
    lockAssembly: document.getElementById('lockAssembly'),
    lockStageTitle: document.getElementById('lockStageTitle'),
    lockBody: document.getElementById('lockBody'),
    lockShackle: document.getElementById('lockShackle'),
    digits: [], // Wird dynamisch durch render3DLock befüllt
    btnTestOpen: document.getElementById('btnTestOpen'),
    statusPill: document.getElementById('statusPill'),
    statusText: document.getElementById('statusText'),
    btnStratPeak: document.getElementById('btnStratPeak'),
    btnStratOffset: document.getElementById('btnStratOffset'),
    stratOffsetDiagnosisBanner: document.getElementById('stratOffsetDiagnosisBanner'),
    recommendationsList: document.getElementById('recommendationsList'),
    heatmapTitle: document.getElementById('heatmapTitle'),
    heatmapHeaderRow: document.getElementById('heatmapHeaderRow'),
    heatmapGrid: document.getElementById('heatmapGrid'),
    interceptedBadge: document.getElementById('interceptedBadge'),
    interceptedGallery: document.getElementById('interceptedGallery'),
    labelThumbCouplingText: document.getElementById('labelThumbCouplingText'),

    // Win Modal
    modalWin: document.getElementById('modalWin'),
    btnCloseWinModal: document.getElementById('btnCloseWinModal'),
    btnNextRound: document.getElementById('btnNextRound'),
    winAttemptsSummary: document.getElementById('winAttemptsSummary'),
    winCodeDisplay: document.getElementById('winCodeDisplay'),

    // Praxis-Decoder (Audit) Elemente
    auditCountBadge: document.getElementById('auditCountBadge'),
    auditDigitsLabel: document.getElementById('auditDigitsLabel'),
    auditTextarea: document.getElementById('auditTextarea'),
    btnAuditSampleLazy: document.getElementById('btnAuditSampleLazy'),
    btnAuditSampleModerat: document.getElementById('btnAuditSampleModerat'),
    btnAuditClear: document.getElementById('btnAuditClear'),
    auditValidationMsg: document.getElementById('auditValidationMsg'),
    auditHeatmapHeaderRow: document.getElementById('auditHeatmapHeaderRow'),
    auditHeatmapGrid: document.getElementById('auditHeatmapGrid'),
    auditRecommendationsList: document.getElementById('auditRecommendationsList'),
    auditDiagnosisCard: document.getElementById('auditDiagnosisCard'),
    auditOffsetSection: document.getElementById('auditOffsetSection'),
    auditOffsetHypothesesList: document.getElementById('auditOffsetHypothesesList'),
    auditAttackList: document.getElementById('auditAttackList')
  };

  // --- HILFSFUNKTIONEN ---
  function circularDist(a, b) {
    const diff = Math.abs(a - b);
    return Math.min(diff, 10 - diff);
  }

  function randomCombo(length) {
    const len = length || state.params.digitsCount;
    return Array.from({ length: len }, () => Math.floor(Math.random() * 10));
  }

  function updatePresetLabels(D) {
    const formulas = {
      3: {
        faul: '1 Rad (±1)',
        standard: '1 Rad (±1..2)',
        moderat: '1–2 Räder (±0..5)',
        gruendlich: '2–3 Räder (±0..3)',
        halbdrehung: '2–3 Räder (±0..5)',
        sicher: 'Alle 3 (0..9 Chaos)'
      },
      4: {
        faul: '1 Rad (±1)',
        standard: '1–2 Räder (±1..2)',
        moderat: '2 Räder (±0..5)',
        gruendlich: '2–4 Räder (±0..3)',
        halbdrehung: '2–4 Räder (±0..5)',
        sicher: 'Alle 4 (0..9 Chaos)'
      },
      5: {
        faul: '1 Rad (±1)',
        standard: '1–2 Räder (±1..2)',
        moderat: '2–3 Räder (±0..5)',
        gruendlich: '3–5 Räder (±0..3)',
        halbdrehung: '3–5 Räder (±0..5)',
        sicher: 'Alle 5 (0..9 Chaos)'
      }
    };

    const currentFormulas = formulas[D] || formulas[5];

    // Labor Chips
    el.presetChips.forEach(chip => {
      const p = chip.getAttribute('data-preset');
      const sub = chip.querySelector('.preset-sub');
      if (sub && currentFormulas[p]) sub.textContent = currentFormulas[p];
    });

    // Challenge Chips
    el.gamePresetBtns.forEach(btn => {
      const p = btn.getAttribute('data-preset');
      const sub = btn.querySelector('.preset-sub');
      if (sub && currentFormulas[p]) sub.textContent = currentFormulas[p];
    });

    // Preset description
    if (el.presetDesc) {
      const descriptions = {
        faul: `Sehr faul: 1 Zylinder um ±1 verstellt. Gravierendes Datenleck bei Außenrädern!`,
        standard: `Alltägliche Routine: 1 bis ${D <= 3 ? '1' : '2'} Räder um ±1 verstellt.`,
        moderat: `Moderat: ${D === 3 ? '1–2' : (D === 4 ? '2' : '2–3')} Räder verstellt um ±0..±5 (Teildrehung).`,
        gruendlich: `Gründlich: ${D === 3 ? '2–3' : (D === 4 ? '2–4' : '3–5')} Räder verstellt um ±0..±3 (kleine Drehwinkel).`,
        halbdrehung: `Halbdrehung: ${D === 3 ? '2–3' : (D === 4 ? '2–4' : '3–5')} Räder verstellt um bis zu eine halbe Umdrehung (±0..±5).`,
        sicher: `Maximal sicher: Alle ${D} Räder unabhängig pseudozufällig verdreht (Chaos).`
      };
      el.presetDesc.textContent = descriptions[state.params.preset] || '';
    }

    if (el.labelThumbCouplingText) {
      el.labelThumbCouplingText.textContent = `Daumen-Wisch-Kopplung (Rad ${D - 1}+${D})`;
    }
  }

  function showToast(msg, duration = 3200) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(el.toast._timer);
    el.toast._timer = setTimeout(() => {
      el.toast.classList.remove('show');
    }, duration);
  }

  // --- BEOBACHTUNGS-GENERATOR (PROPORTIONAL FÜR 3, 4, 5 ZIFFERNSCHLÖSSER) ---
  function simulateObservations(targetSecret, count, noisePct, presetName, useCoupling) {
    const D = targetSecret.length;
    const obs = [];

    for (let i = 0; i < count; i++) {
      if (Math.random() * 100 < noisePct) {
        const noisy = randomCombo(D);
        obs.push({ combo: noisy, isNoise: true });
        continue;
      }

      const variant = [...targetSecret];

      if (presetName === 'faul') {
        // 1. Sehr faul: 1 Rad ±1 (Außenräder 0 und D-1 bevorzugt)
        const wheelIdx = Math.random() < 0.65 ? (Math.random() < 0.5 ? D - 1 : 0) : Math.floor(Math.random() * D);
        const delta = Math.random() < 0.5 ? 1 : -1;
        variant[wheelIdx] = (variant[wheelIdx] + delta + 10) % 10;
      } else if (presetName === 'standard') {
        // 2. Alltäglich: 1 bis 2 Räder (oder 1 bei D=3) um ±1..±2
        const maxWheels = D <= 3 ? 1 : (Math.random() < 0.6 ? 1 : 2);
        const wheelsToChange = [Math.floor(Math.random() * D)];
        if (maxWheels > 1) {
          const w2 = Math.floor(Math.random() * D);
          if (!wheelsToChange.includes(w2)) wheelsToChange.push(w2);
        }
        if (useCoupling && (wheelsToChange.includes(D - 2) || wheelsToChange.includes(D - 1))) {
          if (!wheelsToChange.includes(D - 1)) wheelsToChange.push(D - 1);
          if (!wheelsToChange.includes(D - 2)) wheelsToChange.push(D - 2);
        }
        wheelsToChange.forEach(w => {
          const delta = (Math.random() < 0.85 ? 1 : 2) * (Math.random() < 0.5 ? 1 : -1);
          variant[w] = (variant[w] + delta + 10) % 10;
        });
      } else if (presetName === 'moderat') {
        // 3. Moderat: proportional verstellt um ±0..±5
        const numWheels = D === 3 ? (Math.random() < 0.5 ? 1 : 2) : (D === 4 ? 2 : (2 + (Math.random() < 0.5 ? 1 : 0)));
        const pool = Array.from({ length: D }, (_, idx) => idx).sort(() => Math.random() - 0.5).slice(0, numWheels);
        pool.forEach(w => {
          const delta = Math.floor(Math.random() * 6) * (Math.random() < 0.5 ? 1 : -1);
          variant[w] = (variant[w] + delta + 10) % 10;
        });
      } else if (presetName === 'gruendlich') {
        // 4. Gründlich: proportional verstellt um ±0..±3
        const minW = Math.max(2, D - 2);
        const numWheels = minW + Math.floor(Math.random() * (D - minW + 1));
        const pool = Array.from({ length: D }, (_, idx) => idx).sort(() => Math.random() - 0.5).slice(0, numWheels);
        pool.forEach(w => {
          const delta = Math.floor(Math.random() * 4) * (Math.random() < 0.5 ? 1 : -1);
          variant[w] = (variant[w] + delta + 10) % 10;
        });
      } else if (presetName === 'halbdrehung') {
        // 5. Halbdrehung: proportional verstellt um ±0..±5
        const minW = Math.max(2, D - 2);
        const numWheels = minW + Math.floor(Math.random() * (D - minW + 1));
        const pool = Array.from({ length: D }, (_, idx) => idx).sort(() => Math.random() - 0.5).slice(0, numWheels);
        pool.forEach(w => {
          const delta = Math.floor(Math.random() * 6) * (Math.random() < 0.5 ? 1 : -1);
          variant[w] = (variant[w] + delta + 10) % 10;
        });
      } else if (presetName === 'sicher') {
        // 6. Maximal sicher: Alle D Räder pseudozufällig verdreht (0..9 Chaos)
        for (let w = 0; w < D; w++) {
          const delta = 1 + Math.floor(Math.random() * 9);
          variant[w] = (variant[w] + delta) % 10;
        }
      }

      obs.push({ combo: variant, isNoise: false });
    }

    return obs;
  }

  // Frequenzanalyse für D Ziffern
  function analyzeFrequencies(obsList, topK) {
    if (!obsList || obsList.length === 0) return { freq: [], topCandidates: [], bestGuess: [] };
    const D = obsList[0].combo.length;
    const freq = Array.from({ length: D }, () => Array(10).fill(0));
    obsList.forEach(item => {
      item.combo.forEach((digit, pos) => {
        freq[pos][digit]++;
      });
    });

    const topCandidates = [];
    const bestGuess = [];

    for (let pos = 0; pos < D; pos++) {
      const sorted = Array.from({ length: 10 }, (_, d) => ({ digit: d, count: freq[pos][d] }))
        .sort((a, b) => b.count - a.count);

      topCandidates.push(sorted.slice(0, topK).map(item => item.digit));
      bestGuess.push(sorted[0].digit); // Häufigste Ziffer
    }

    return { freq, topCandidates, bestGuess };
  }

  // =========================================================================
  // LABOR: DOPPEL-RASTER MONTE-CARLO (TOP-3 VS. TOP-1)
  // =========================================================================

  function initMonteCarloGrids() {
    [el.mcGridTop3, el.mcGridTop1].forEach(grid => {
      if (!grid) return;
      grid.innerHTML = '';
      for (let i = 0; i < 100; i++) {
        const tile = document.createElement('div');
        tile.className = 'mc-tile';
        tile.setAttribute('data-tooltip', `Schloss #${i + 1}: Bereit`);
        grid.appendChild(tile);
      }
    });
  }

  let currentMcRunId = 0;
  let mcDebounceTimer = null;

  function triggerAutoMonteCarlo(delay = 120) {
    clearTimeout(mcDebounceTimer);
    mcDebounceTimer = setTimeout(() => {
      runMonteCarloSimulation();
    }, delay);
  }

  function runMonteCarloSimulation() {
    const myRunId = ++currentMcRunId;
    state.mc.isRunning = true;
    if (el.btnRunMonteCarlo) {
      el.btnRunMonteCarlo.disabled = true;
      el.btnRunMonteCarlo.style.opacity = '0.6';
    }

    const tilesTop3 = el.mcGridTop3.querySelectorAll('.mc-tile');
    const tilesTop1 = el.mcGridTop1.querySelectorAll('.mc-tile');

    let successTop3 = 0;
    let successTop1 = 0;
    const { N, noise, preset, thumbCoupling } = state.params;
    const topK = 3; // Fest verankerte Top-3 Heuristik

    let runIdx = 0;
    const batchSize = 10;

    function step() {
      if (myRunId !== currentMcRunId) return; // Veralteter Run abgebrochen

      const end = Math.min(100, runIdx + batchSize);
      for (let i = runIdx; i < end; i++) {
        const testSecret = randomCombo();
        const obs = simulateObservations(testSecret, N, noise, preset, thumbCoupling);
        const { topCandidates, bestGuess } = analyzeFrequencies(obs, topK);

        // 1. Top-3 Heuristik
        const isCrackedTop3 = testSecret.every((d, pos) => topCandidates[pos].includes(d));
        if (isCrackedTop3) successTop3++;

        const tile3 = tilesTop3[i];
        if (tile3) {
          tile3.className = isCrackedTop3 ? 'mc-tile success' : 'mc-tile fail';
          tile3.setAttribute('data-tooltip', `Schloss #${i + 1}: ${isCrackedTop3 ? 'Geknackt (im Top-3 Raum)' : 'Fehlgeschlagen'}`);
        }

        // 2. Top-1 Heuristik
        const isCrackedTop1 = testSecret.every((d, pos) => bestGuess[pos] === d);
        if (isCrackedTop1) successTop1++;

        const tile1 = tilesTop1[i];
        if (tile1) {
          tile1.className = isCrackedTop1 ? 'mc-tile success' : 'mc-tile fail';
          tile1.setAttribute('data-tooltip', `Schloss #${i + 1}: ${isCrackedTop1 ? 'Volltreffer (Versuch 1)' : 'Fehlgeschlagen'}`);
        }
      }

      runIdx = end;
      if (el.mcSuccessTop3) el.mcSuccessTop3.textContent = `${successTop3} / ${runIdx} (${((successTop3 / runIdx) * 100).toFixed(0)} %)`;
      if (el.mcSuccessTop1) el.mcSuccessTop1.textContent = `${successTop1} / ${runIdx} (${((successTop1 / runIdx) * 100).toFixed(0)} %)`;

      if (runIdx < 100) {
        requestAnimationFrame(step);
      } else {
        state.mc.isRunning = false;
        if (el.btnRunMonteCarlo) {
          el.btnRunMonteCarlo.disabled = false;
          el.btnRunMonteCarlo.style.opacity = '1';
        }
      }
    }

    requestAnimationFrame(step);
  }

  // --- EMPIRISCHE KURVEN-BERECHNUNG AUS DER ECHTEN SIMULATION ---
  let cachedCurveData = null;
  let cachedCurveKey = '';

  function sampleEmpiricalCurve() {
    const { noise, preset, topK, thumbCoupling } = state.params;
    const testPoints = [1, 2, 4, 7, 10, 15, 20, 25, 35, 50];
    const samplesPerPoint = 35;
    const anchors = [];

    testPoints.forEach(nVal => {
      let t3 = 0;
      let t1 = 0;
      for (let s = 0; s < samplesPerPoint; s++) {
        const sec = randomCombo();
        const obs = simulateObservations(sec, nVal, noise, preset, thumbCoupling);
        const { topCandidates, bestGuess } = analyzeFrequencies(obs, topK);
        if (sec.every((d, pos) => topCandidates[pos].includes(d))) t3++;
        if (sec.every((d, pos) => bestGuess[pos] === d)) t1++;
      }
      anchors.push({ n: nVal, top3: t3 / samplesPerPoint, top1: t1 / samplesPerPoint });
    });

    const pointsTop3 = [];
    const pointsTop1 = [];

    for (let n = 1; n <= 50; n++) {
      let pTop3 = 0;
      let pTop1 = 0;

      if (n <= anchors[0].n) {
        pTop3 = anchors[0].top3;
        pTop1 = anchors[0].top1;
      } else if (n >= anchors[anchors.length - 1].n) {
        pTop3 = anchors[anchors.length - 1].top3;
        pTop1 = anchors[anchors.length - 1].top1;
      } else {
        for (let i = 0; i < anchors.length - 1; i++) {
          const a1 = anchors[i];
          const a2 = anchors[i + 1];
          if (n >= a1.n && n <= a2.n) {
            const frac = (n - a1.n) / (a2.n - a1.n);
            pTop3 = a1.top3 + frac * (a2.top3 - a1.top3);
            pTop1 = a1.top1 + frac * (a2.top1 - a1.top1);
            break;
          }
        }
      }

      pointsTop3.push({ n, val: Math.min(0.999, Math.max(0, pTop3)) });
      pointsTop1.push({ n, val: Math.min(0.999, Math.max(0, pTop1)) });
    }

    return { pointsTop3, pointsTop1 };
  }

  function getCurveData() {
    const modelKey = `${state.params.preset}_${state.params.noise}_${state.params.topK}_${state.params.thumbCoupling}`;
    if (!cachedCurveData || cachedCurveKey !== modelKey) {
      cachedCurveKey = modelKey;
      cachedCurveData = sampleEmpiricalCurve();
    }
    return cachedCurveData;
  }

  // --- DYNAMISCHE KURVEN-GRAFIK (TOP-3 & TOP-1) ---
  function renderMathCurve() {
    const canvas = el.mathCurveCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const padLeft = 45;
    const padBottom = 28;
    const padTop = 15;
    const padRight = 20;
    const usableW = w - padLeft - padRight;
    const usableH = h - padTop - padBottom;

    // Gitter
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (usableH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
    }

    // Achsenbeschriftung
    ctx.fillStyle = '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('100%', 8, padTop + 8);
    ctx.fillText('50%', 14, padTop + usableH / 2 + 4);
    ctx.fillText('0%', 20, h - padBottom);
    ctx.fillText('N=1', padLeft, h - 8);
    ctx.fillText('N=25', padLeft + usableW / 2 - 12, h - 8);
    ctx.fillText('N=50', w - padRight - 28, h - 8);

    // Kurvendaten direkt aus dem echten Simulationsmodell stichprobenartig ermitteln,
    // damit Kurve und 100-Schlösser-Raster 100% kongruent zueinander sind!
    const { pointsTop3, pointsTop1 } = getCurveData();

    // 1. Kurve: Top-3 (Grün mit Gradient)
    const grad3 = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
    grad3.addColorStop(0, 'rgba(0, 255, 157, 0.22)');
    grad3.addColorStop(1, 'rgba(0, 255, 157, 0.0)');

    ctx.beginPath();
    pointsTop3.forEach((pt, i) => {
      const x = padLeft + ((pt.n - 1) / 49) * usableW;
      const y = padTop + (1 - pt.val) * usableH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(w - padRight, h - padBottom);
    ctx.lineTo(padLeft, h - padBottom);
    ctx.closePath();
    ctx.fillStyle = grad3;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 2.5;
    pointsTop3.forEach((pt, i) => {
      const x = padLeft + ((pt.n - 1) / 49) * usableW;
      const y = padTop + (1 - pt.val) * usableH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 2. Kurve: Top-1 (Cyan Linie)
    ctx.beginPath();
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.2;
    pointsTop1.forEach((pt, i) => {
      const x = padLeft + ((pt.n - 1) / 49) * usableW;
      const y = padTop + (1 - pt.val) * usableH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Aktueller N Marker
    const curN = state.params.N;
    const curX = padLeft + ((curN - 1) / 49) * usableW;
    const curP3 = pointsTop3[curN - 1].val;
    const curP1 = pointsTop1[curN - 1].val;
    const curY3 = padTop + (1 - curP3) * usableH;
    const curY1 = padTop + (1 - curP1) * usableH;

    // Punkt Top-3
    ctx.fillStyle = '#00ff9d';
    ctx.beginPath();
    ctx.arc(curX, curY3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Punkt Top-1
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.arc(curX, curY1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertikaler N-Strich
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(curX, padTop);
    ctx.lineTo(curX, h - padBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    if (el.curvePctTop3) el.curvePctTop3.textContent = `${(curP3 * 100).toFixed(0)} %`;
    if (el.curvePctTop1) el.curvePctTop1.textContent = `${(curP1 * 100).toFixed(0)} %`;
  }

  // =========================================================================
  // HACKER-CHALLENGE: SIDE-BY-SIDE MIT KUMULATIVEM SLIDER & 4 BUTTONS
  // =========================================================================

  function generateNewChallenge(victimPreset) {
    const D = state.params.digitsCount;
    state.game.digitsCount = D;
    state.game.preset = victimPreset || state.game.preset;
    state.game.secret = randomCombo(D);
    state.game.current = Array(D).fill(0);
    state.game.isUnlocked = false;
    state.game.isSecretVisible = false;
    state.game.attemptsLeft = 5;
    state.game.isOver = false;
    state.game.won = false;

    // Startet immer strikt bei 1 Beobachtung
    if (el.sliderGameObservations) {
      el.sliderGameObservations.value = 1;
    }

    // Pre-generiere 30 Beobachtungen für dieses Schloss
    state.game.poolObservations = simulateObservations(
      state.game.secret,
      30,
      state.params.noise,
      state.game.preset,
      state.params.thumbCoupling
    );

    render3DLock(D);
    lockShackle();
    applyCumulativeGameSlice();
    showToast(`🎯 Neues Ziel erzeugt (${D} Ziffern, Profil: ${state.game.preset})!`);
  }

  // Schneidet die aktiven Beobachtungen kumulativ gemäß N-Slider ab
  function applyCumulativeGameSlice() {
    const n = parseInt(el.sliderGameObservations.value, 10);
    el.gameObsCountDisplay.textContent = n;
    if (el.interceptedBadge) el.interceptedBadge.textContent = `${n} Zustände`;

    state.game.activeObservations = state.game.poolObservations.slice(0, n);

    const { freq, topCandidates, bestGuess } = analyzeFrequencies(state.game.activeObservations, state.params.topK);
    state.game.freqMatrix = freq;
    state.game.topCandidates = topCandidates;
    state.game.bestGuess = bestGuess;

    updateGameUI();
  }

  // --- BERECHNUNG DER TOP 3 HEURISTIK-EMPFEHLUNGEN (DYNAMISCH FÜR D ZIFFER) ---
  function computeTopRecommendations() {
    if (!state.game.activeObservations || state.game.activeObservations.length === 0) return [];
    const N = state.game.activeObservations.length;
    const D = state.game.digitsCount || state.params.digitsCount;

    // Ränge & Laplace-Glättung je Rad
    const wheelRanks = [];
    for (let w = 0; w < D; w++) {
      const list = [];
      for (let d = 0; d < 10; d++) {
        const count = state.game.freqMatrix[w] ? state.game.freqMatrix[w][d] : 0;
        const prob = (count + 0.2) / (N + 2.0);
        list.push({ digit: d, prob, count });
      }
      list.sort((a, b) => b.count !== a.count ? b.count - a.count : b.prob - a.prob);
      wheelRanks.push(list);
    }

    // Untersuche die 2^D Permutationen der beiden häufigsten Ziffern je Rad
    const totalCombos = Math.pow(2, D);
    const candidates = [];
    for (let mask = 0; mask < totalCombos; mask++) {
      const combo = [];
      let weight = 1;
      for (let w = 0; w < D; w++) {
        const rankIdx = (mask >> w) & 1;
        combo.push(wheelRanks[w][rankIdx].digit);
        weight *= wheelRanks[w][rankIdx].prob;
      }
      candidates.push({ combo, weight });
    }

    candidates.sort((a, b) => b.weight - a.weight);
    const top3 = candidates.slice(0, 3);
    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);

    return top3.map((c, idx) => ({
      rank: idx + 1,
      combo: c.combo,
      pct: Math.min(99.9, Math.max(0.5, (c.weight / totalWeight) * 100))
    }));
  }

  // --- STRATEGIE 2: HABITUAL OFFSET REKONSTRUKTION (INVERSE DECONVOLUTION) ---
  function computeHabitualOffsetRecommendations() {
    if (!state.game.activeObservations || state.game.activeObservations.length === 0) return { list: [], banner: '' };
    const N = state.game.activeObservations.length;
    const D = state.game.digitsCount || state.params.digitsCount;

    // 1. Ermittle den Peak (Modus) je Rad
    const peakCombo = [];
    const wheelInvariance = []; // Anteil der Beobachtungen, die auf den Peak fallen
    for (let w = 0; w < D; w++) {
      let bestDigit = 0;
      let maxCount = -1;
      for (let d = 0; d < 10; d++) {
        const c = state.game.freqMatrix[w] ? state.game.freqMatrix[w][d] : 0;
        if (c > maxCount) {
          maxCount = c;
          bestDigit = d;
        }
      }
      peakCombo.push(bestDigit);
      wheelInvariance.push(maxCount / N);
    }

    // 2. Finde starre vs bewegte Räder
    const invariantWheelIndices = [];
    for (let w = 0; w < D; w++) {
      if (wheelInvariance[w] >= 0.8) {
        invariantWheelIndices.push(w);
      }
    }

    // 3. Typische habituelle Daumen-Offsets (relativ zur Schließbewegung)
    // Offset delta bedeutet: Beobachtung = (Code + delta) mod 10 -> Code = (Beobachtung - delta) mod 10
    const offsetHypotheses = [
      { name: 'Daumenwisch nach unten (-2)', delta: -2, probBase: 0.85, desc: 'Zwei Klicks abwärts' },
      { name: 'Minimaler Nachklick (-1)', delta: -1, probBase: 0.72, desc: 'Ein Klick abwärts' },
      { name: 'Halbdrehung 180° (±5)', delta: 5, probBase: 0.55, desc: 'Schwungvolle Halbdrehung' },
      { name: 'Minimaler Klick aufwärts (+1)', delta: 1, probBase: 0.45, desc: 'Ein Klick aufwärts' },
      { name: 'Daumenwisch aufwärts (+2)', delta: 2, probBase: 0.38, desc: 'Zwei Klicks aufwärts' }
    ];

    const results = [];
    let bannerText = '';

    // Diagnose für Banner
    if (invariantWheelIndices.length === D) {
      bannerText = `⚡ <strong>Muster erkannt:</strong> Alle ${D} Räder sind starr auf [${peakCombo.join(' ')}]. Entweder ist dies der echte Code oder der Besitzer wendet auf Teilräder eine starre Routine an.`;
    } else if (invariantWheelIndices.length > 0) {
      const invNames = invariantWheelIndices.map(w => `Rad ${w + 1}`).join(' & ');
      bannerText = `⚡ <strong>Muster erkannt:</strong> ${invNames} unverändert starr (starke Code-Kandidaten). Die übrigen Räder werden habituell versetzt.`;
    } else {
      bannerText = `ℹ️ <strong>Muster:</strong> Hohe Streuung. Die Hypothesen rekonstruieren Codes unter Annahme typischer Wischweiten.`;
    }

    // Bestimme, welche Räder bei Habitual Offset verschoben werden:
    // Wenn z. B. Rad 1 starr ist (Index 0), werden Räder 1..(D-1) verschoben.
    // Wenn alle starr sind, verschieben wir typischerweise die letzten 2 Räder (Daumenkopplung) oder das letzte Rad.
    let targetWheels = [];
    if (invariantWheelIndices.length === D) {
      // Alle Räder starr (wie im Nutzerbeispiel 3-1-1 bei 3 Rädern):
      // Untersuche, ob benachbarte Räder denselben Wert haben (z. B. Rad 2 und 3 beide '1')
      let coupled = false;
      for (let w = 0; w < D - 1; w++) {
        if (peakCombo[w] === peakCombo[w + 1] && w > 0) {
          targetWheels = [w, w + 1];
          coupled = true;
          break;
        }
      }
      if (!coupled) {
        // Fallback: Die letzten zwei Räder verschieben (klassische Daumenkopplung)
        targetWheels = D >= 3 ? [D - 2, D - 1] : [D - 1];
      }
    } else if (invariantWheelIndices.length > 0 && invariantWheelIndices.length < D) {
      // Nicht-invariante Räder sind die Zielräder
      targetWheels = [];
      for (let w = 0; w < D; w++) {
        if (!invariantWheelIndices.includes(w)) targetWheels.push(w);
      }
    } else {
      // Alle bewegen sich: Letzte 2 Räder
      targetWheels = D >= 3 ? [D - 2, D - 1] : [D - 1];
    }

    offsetHypotheses.forEach((hyp, idx) => {
      const reconstructed = [...peakCombo];
      targetWheels.forEach(w => {
        // Inverse Verschiebung: (observed - delta + 10) % 10
        reconstructed[w] = (reconstructed[w] - hyp.delta + 10) % 10;
      });

      results.push({
        rank: idx + 1,
        combo: reconstructed,
        title: hyp.name,
        desc: `${hyp.desc} an ${targetWheels.map(w => `Rad ${w + 1}`).join(' & ')}`,
        pct: Math.round(hyp.probBase * 100)
      });
    });

    return { list: results.slice(0, 3), banner: bannerText };
  }

  function renderRecommendations() {
    if (!el.recommendationsList) return;
    el.recommendationsList.innerHTML = '';

    const isOffsetStrat = state.game.strategy === 'offset';

    // Banner für Strategie 2
    if (el.stratOffsetDiagnosisBanner) {
      if (isOffsetStrat) {
        const offsetData = computeHabitualOffsetRecommendations();
        el.stratOffsetDiagnosisBanner.style.display = 'flex';
        el.stratOffsetDiagnosisBanner.innerHTML = offsetData.banner;
      } else {
        el.stratOffsetDiagnosisBanner.style.display = 'none';
      }
    }

    if (isOffsetStrat) {
      // --- STRATEGIE 2: HABITUAL OFFSET DARSTELLUNG ---
      const offsetData = computeHabitualOffsetRecommendations();
      const recs = offsetData.list;

      recs.forEach((rec, idx) => {
        const item = document.createElement('div');
        item.className = `recommendation-item rank-${idx + 1}`;

        item.innerHTML = `
          <div>
            <span class="rec-rank-badge" style="background: rgba(192, 132, 252, 0.2); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.35);">
              #${idx + 1} ${rec.title}
            </span>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px;">${rec.desc}</div>
          </div>
          <div class="rec-combo" style="color: #c084fc;">${rec.combo.join(' ')}</div>
          <div class="rec-prob-box">
            <div class="rec-prob-header">
              <span>Habitual-Plausibilität:</span>
              <strong style="color: #c084fc; font-size: 0.85rem;">${rec.pct} %</strong>
            </div>
            <div class="rec-prob-bar-track">
              <div class="rec-prob-bar-fill" style="width: ${rec.pct}%; background: linear-gradient(90deg, #c084fc, var(--accent-cyan));"></div>
            </div>
          </div>
          <button class="btn-apply-rec" data-rank="${idx + 1}" style="border-color: rgba(192, 132, 252, 0.4); color: #e9d5ff;">In Schloss laden ➔</button>
        `;

        const btn = item.querySelector('.btn-apply-rec');
        btn.addEventListener('click', () => {
          setAllWheelDigits(rec.combo);
          window.lockSound.playClick();
          showToast(`Habitual-Tipp #${idx + 1} [${rec.combo.join('')}] übernommen!`);
        });

        el.recommendationsList.appendChild(item);
      });

    } else {
      // --- STRATEGIE 1: HÄUFIGKEITS-PEAK (ZERO-SHIFT) ---
      const recs = computeTopRecommendations();
      const rankMeta = [
        { title: '#1 Spitzenreiter', cls: 'rank-1' },
        { title: '#2 Alternative', cls: 'rank-2' },
        { title: '#3 Außenseiter', cls: 'rank-3' }
      ];

      recs.forEach((rec, idx) => {
        const meta = rankMeta[idx] || { title: `#${idx + 1} Kandidat`, cls: '' };
        const item = document.createElement('div');
        item.className = `recommendation-item ${meta.cls}`;

        const pctFormatted = rec.pct >= 10 ? rec.pct.toFixed(1) : rec.pct.toFixed(2);

        item.innerHTML = `
          <div>
            <span class="rec-rank-badge">${meta.title}</span>
          </div>
          <div class="rec-combo">${rec.combo.join(' ')}</div>
          <div class="rec-prob-box">
            <div class="rec-prob-header">
              <span>P(Treffer-Konfidenz):</span>
              <strong style="color: ${idx === 0 ? 'var(--accent-emerald)' : (idx === 1 ? 'var(--accent-cyan)' : '#c084fc')}; font-size: 0.85rem;">${pctFormatted} %</strong>
            </div>
            <div class="rec-prob-bar-track">
              <div class="rec-prob-bar-fill" style="width: ${Math.min(100, Math.max(6, rec.pct))}%;"></div>
            </div>
          </div>
          <button class="btn-apply-rec" data-rank="${idx + 1}">In Schloss laden ➔</button>
        `;

        const btn = item.querySelector('.btn-apply-rec');
        btn.addEventListener('click', () => {
          setAllWheelDigits(rec.combo);
          window.lockSound.playClick();
          showToast(`Empfehlung #${idx + 1} [${rec.combo.join('')}] übernommen!`);
        });

        el.recommendationsList.appendChild(item);
      });
    }
  }

  // --- POINT 3: BENCHMARK-KARTEN (NOTWENDIGE BEOBACHTUNGEN FÜR 90% TREFFERQUOTE BEI 3 VERSUCHEN) ---
  function renderBenchmarkCards() {
    if (!el.benchmarkCardsGrid) return;
    el.benchmarkCardsGrid.innerHTML = '';

    const D = state.params.digitsCount;
    const noise = state.params.noise;

    const presets = [
      { key: 'faul', name: 'Sehr faul', factor: 2.2, noiseScale: 40 },
      { key: 'standard', name: 'Alltäglich', factor: 1.8, noiseScale: 30 },
      { key: 'moderat', name: 'Moderat', factor: 2.1, noiseScale: 25 },
      { key: 'gruendlich', name: 'Gründlich', factor: 3.8, noiseScale: 20 },
      { key: 'halbdrehung', name: 'Halbdrehung', factor: 5.5, noiseScale: 20 },
      { key: 'sicher', name: 'Maximal sicher', factor: 0, noiseScale: 0 }
    ];

    const currentFormulas = {
      3: { faul: '1 Rad (±1)', standard: '1 Rad (±1..2)', moderat: '1–2 Räder (±0..5)', gruendlich: '2–3 Räder (±0..3)', halbdrehung: '2–3 Räder (±0..5)', sicher: 'Alle 3 (0..9)' },
      4: { faul: '1 Rad (±1)', standard: '1–2 Räder (±1..2)', moderat: '2 Räder (±0..5)', gruendlich: '2–4 Räder (±0..3)', halbdrehung: '2–4 Räder (±0..5)', sicher: 'Alle 4 (0..9)' },
      5: { faul: '1 Rad (±1)', standard: '1–2 Räder (±1..2)', moderat: '2–3 Räder (±0..5)', gruendlich: '3–5 Räder (±0..3)', halbdrehung: '3–5 Räder (±0..5)', sicher: 'Alle 5 (0..9)' }
    }[D];

    presets.forEach(p => {
      let nVal = '';
      let rankClass = '';

      if (p.key === 'sicher') {
        nVal = '> 1.000';
        rankClass = 'rank-secure';
      } else {
        const rawN = Math.round(p.factor * D * (1 + noise / p.noiseScale));
        nVal = rawN;
        if (rawN <= 8) rankClass = 'rank-vulnerable';
        else if (rawN <= 18) rankClass = 'rank-moderate';
        else rankClass = 'rank-hard';
      }

      const card = document.createElement('div');
      card.className = `benchmark-card ${rankClass} ${state.params.preset === p.key ? 'active-preset' : ''}`;
      card.setAttribute('title', `Klick wählt '${p.name}' im Labor aus`);

      card.innerHTML = `
        <div class="benchmark-num">${nVal}</div>
        <div class="benchmark-unit">${p.key === 'sicher' ? 'Theorie' : 'Blicke (N)'}</div>
        <div class="benchmark-title">${p.name}</div>
        <div class="benchmark-sub">${currentFormulas[p.key]}</div>
      `;

      card.addEventListener('click', () => {
        state.params.preset = p.key;
        el.presetChips.forEach(chip => {
          if (chip.getAttribute('data-preset') === p.key) chip.classList.add('active');
          else chip.classList.remove('active');
        });
        updatePresetLabels(state.params.digitsCount);
        renderMathCurve();
        triggerAutoMonteCarlo(0);
        renderBenchmarkCards();
        showToast(`Preset '${p.name}' aktiviert!`);
      });

      el.benchmarkCardsGrid.appendChild(card);
    });
  }

  // --- DYNAMISCHES 3D-ZAHLENSCHLOSS FÜR D ZYLINDER ---
  function render3DLock(D) {
    if (!el.lockBody) return;
    el.lockBody.innerHTML = '';
    el.digits = [];

    // Shackle-Breite anpassen
    if (el.lockShackle) {
      el.lockShackle.style.width = D === 3 ? '180px' : (D === 4 ? '230px' : '280px');
    }

    if (el.lockStageTitle) {
      el.lockStageTitle.textContent = `⚙️ Physisches ${D}-Zylinder-Schloss`;
    }

    for (let w = 0; w < D; w++) {
      const col = document.createElement('div');
      col.className = 'wheel-column';
      col.setAttribute('data-wheel', w);

      col.innerHTML = `
        <button class="wheel-step-btn btn-up" data-wheel="${w}">▲</button>
        <div class="wheel-drum" data-wheel="${w}">
          <span class="wheel-digit" id="digit-${w}">${state.game.current[w] || 0}</span>
        </div>
        <button class="wheel-step-btn btn-down" data-wheel="${w}">▼</button>
        <span class="wheel-label">RAD ${w + 1}</span>
      `;

      el.lockBody.appendChild(col);
      el.digits.push(col.querySelector(`#digit-${w}`));

      // Buttons
      col.querySelector('.btn-up').addEventListener('click', () => changeDigit(w, 1));
      col.querySelector('.btn-down').addEventListener('click', () => changeDigit(w, -1));

      // Drum Mousewheel
      const drum = col.querySelector('.wheel-drum');
      drum.addEventListener('wheel', (e) => {
        e.preventDefault();
        changeDigit(w, e.deltaY < 0 ? 1 : -1);
      });
    }
  }

  function updateGameUI() {
    // 1. Ziffern im 3D-Schloss
    state.game.current.forEach((val, idx) => {
      if (el.digits[idx]) el.digits[idx].textContent = val;
    });

    // 2. Secret Display
    if (el.secretDisplay) {
      const D = state.game.secret ? state.game.secret.length : 5;
      el.secretDisplay.textContent = state.game.isSecretVisible ? state.game.secret.join(' ') : '•'.repeat(D);
      el.btnToggleSecret.textContent = state.game.isSecretVisible ? 'Verbergen' : 'Aufdecken';
    }

    // 3. Versuchs-Icons
    if (el.attemptsIcons) {
      el.attemptsIcons.innerHTML = '';
      for (let i = 0; i < state.game.maxAttempts; i++) {
        const span = document.createElement('span');
        if (i < state.game.attemptsLeft) {
          span.textContent = '🔒';
          span.style.opacity = '1';
        } else {
          span.textContent = '❌';
          span.style.opacity = '0.35';
        }
        el.attemptsIcons.appendChild(span);
      }
    }

    // 4. Top-3 Heuristik-Empfehlungen mit Trefferquote
    renderRecommendations();

    // 5. Matrix-Heatmap & Zweispaltige Galerie
    renderHeatmap();
    renderInterceptedGalleryTwoCols();
  }

  function renderHeatmap() {
    if (!el.heatmapGrid || !el.heatmapHeaderRow) return;
    const D = state.game.digitsCount || state.params.digitsCount;

    // Header-Zeile dynamisch anpassen
    el.heatmapHeaderRow.style.gridTemplateColumns = `44px repeat(${D}, 1fr)`;
    el.heatmapHeaderRow.innerHTML = `<div class="heatmap-col-header digit-col">Ziff.</div>` +
      Array.from({ length: D }, (_, i) => `<div class="heatmap-col-header">Rad ${i + 1}</div>`).join('');

    if (el.heatmapTitle) {
      el.heatmapTitle.textContent = `🔥 ${D}×10 Frequenz-Heatmap`;
    }

    el.heatmapGrid.innerHTML = '';
    const maxCount = Math.max(1, ...state.game.freqMatrix.flat());

    for (let digit = 0; digit <= 9; digit++) {
      const row = document.createElement('div');
      row.className = 'heatmap-row';
      row.style.gridTemplateColumns = `44px repeat(${D}, 1fr)`;

      const label = document.createElement('div');
      label.className = 'heatmap-row-label';
      label.textContent = digit;
      row.appendChild(label);

      for (let wheel = 0; wheel < D; wheel++) {
        const count = state.game.freqMatrix[wheel] ? state.game.freqMatrix[wheel][digit] : 0;
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';

        const intensity = count / maxCount;

        if (count === 0) {
          cell.style.background = 'rgba(255, 255, 255, 0.02)';
          cell.style.color = '#475569';
          cell.textContent = '-';
        } else {
          const r = Math.round(intensity * 255);
          const g = Math.round(180 + intensity * 75);
          const b = Math.round(254 * (1 - intensity * 0.7));
          cell.style.background = `rgba(${r}, ${g}, ${b}, ${Math.max(0.18, intensity * 0.75)})`;
          cell.style.border = `1px solid rgba(${r}, ${g}, ${b}, ${Math.max(0.3, intensity)})`;
          cell.style.color = intensity > 0.6 ? '#ffffff' : 'var(--accent-cyan)';
          cell.textContent = count;
        }

        cell.setAttribute('title', `Rad ${wheel + 1}, Ziffer '${digit}': ${count}x gesehen – Klick setzt Rad`);

        cell.addEventListener('click', () => {
          setSingleWheelDigit(wheel, digit);
          window.lockSound.playClick();
          showToast(`Rad ${wheel + 1} auf '${digit}' gesetzt!`);
        });

        row.appendChild(cell);
      }

      el.heatmapGrid.appendChild(row);
    }
  }

  function renderInterceptedGalleryTwoCols() {
    if (!el.interceptedGallery) return;
    el.interceptedGallery.innerHTML = '';

    state.game.activeObservations.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'intercepted-card';

      const tag = item.isNoise ? '<span class="badge-noise">Rauschen</span>' : '<span style="color: var(--accent-cyan);">Normal</span>';

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">#${idx + 1}</span>
          <span class="intercepted-combo">${item.combo.join(' ')}</span>
        </div>
        <div class="intercepted-meta">
          ${tag}
          <span style="color: var(--accent-emerald);">Laden ➔</span>
        </div>
      `;

      card.addEventListener('click', () => {
        setAllWheelDigits(item.combo);
        window.lockSound.playClick();
        showToast(`Zustand #${idx + 1} [${item.combo.join('')}] geladen!`);
      });

      el.interceptedGallery.appendChild(card);
    });
  }

  // --- SCHLOSS-BEDIENUNG ---
  function changeDigit(wheelIdx, delta) {
    window.lockSound.playClick();
    state.game.current[wheelIdx] = (state.game.current[wheelIdx] + delta + 10) % 10;
    updateWheelDisplay(wheelIdx, delta);
    if (state.game.isUnlocked) lockShackle();
  }

  function setSingleWheelDigit(wheelIdx, digit) {
    state.game.current[wheelIdx] = digit;
    updateWheelDisplay(wheelIdx, 1);
    if (state.game.isUnlocked) lockShackle();
  }

  function setAllWheelDigits(combo) {
    state.game.current = [...combo];
    combo.forEach((val, idx) => updateWheelDisplay(idx, 1));
    if (state.game.isUnlocked) lockShackle();
  }

  function updateWheelDisplay(wheelIdx, delta) {
    const digitEl = el.digits[wheelIdx];
    if (digitEl) {
      digitEl.style.transform = `translateY(${delta > 0 ? '-6px' : '6px'})`;
      setTimeout(() => { digitEl.style.transform = 'translateY(0)'; }, 100);
      digitEl.textContent = state.game.current[wheelIdx];
    }
  }

  function unlockShackle() {
    state.game.isUnlocked = true;
    el.lockAssembly.classList.add('unlocked');
    el.statusPill.className = 'status-pill unlocked';
    el.statusText.textContent = '🎉 Schloss offen!';
    window.lockSound.playShackleUnlock();
  }

  function lockShackle() {
    state.game.isUnlocked = false;
    el.lockAssembly.classList.remove('unlocked');
    el.statusPill.className = 'status-pill locked';
    el.statusText.textContent = 'Bügel verriegelt';
  }

  function testUnlock() {
    if (state.game.isOver) {
      showToast('Spielrunde beendet! Klicke oben auf ein Opfer-Profil für ein neues Schloss.');
      return;
    }

    const isMatch = state.game.current.every((val, idx) => val === state.game.secret[idx]);

    if (isMatch) {
      state.game.won = true;
      state.game.isOver = true;
      unlockShackle();
      window.lockSound.playSuccess();
      const attemptUsed = state.game.maxAttempts - state.game.attemptsLeft + 1;
      showToast(`🏆 GEKNACKT! Du hast das Schloss im ${attemptUsed}. Versuch geöffnet!`, 4000);
      updateGameUI();

      setTimeout(() => {
        if (el.modalWin) {
          if (el.winAttemptsSummary) el.winAttemptsSummary.textContent = `Geknackt im ${attemptUsed}. Versuch (von ${state.game.maxAttempts})`;
          if (el.winCodeDisplay) el.winCodeDisplay.textContent = state.game.secret.join(' ');
          el.modalWin.classList.add('open');
        }
      }, 500);
      return;
    }

    state.game.attemptsLeft--;
    window.lockSound.playError();

    let correctDigits = 0;
    state.game.current.forEach((val, idx) => {
      if (val === state.game.secret[idx]) correctDigits++;
    });

    if (state.game.attemptsLeft <= 0) {
      state.game.isOver = true;
      el.statusPill.className = 'status-pill locked';
      el.statusText.textContent = '🔒 Schloss gesperrt';
      state.game.isSecretVisible = true;
      showToast(`❌ Keine Versuche mehr! Der echte Code war: ${state.game.secret.join(' ')}`, 6000);
    } else {
      showToast(`⚠️ Bügel klemmt! ${correctDigits} von ${state.game.secret.length} Stellen stimmen. Noch ${state.game.attemptsLeft} Versuche übrig.`);
    }

    updateGameUI();
  }

  // =========================================================================
  // PRAXIS-DECODER (REAL-EXAMPLE AUDIT)
  // =========================================================================

  function loadAuditLazySample() {
    const D = state.params.digitsCount;
    // Basis-Code
    const secret = D === 3 ? [4, 8, 2] : (D === 4 ? [4, 8, 2, 1] : [4, 8, 2, 1, 5]);
    // 6 Beobachtungen eines faulen Nutzers (nur Außenrad D-1 um ±1 verstellt)
    const samples = [];
    for (let i = 0; i < 6; i++) {
      const copy = [...secret];
      if (i > 0) {
        const delta = i % 2 === 0 ? 1 : -1;
        copy[D - 1] = (copy[D - 1] + delta + 10) % 10;
      }
      samples.push(copy.join(''));
    }
    if (el.auditTextarea) el.auditTextarea.value = samples.join('\n');
    analyzeRealDecoderInput();
    showToast(`Beispiel 'Fauler Nutzer' (${samples.length} Blicke) geladen!`);
  }

  function loadAuditModeratSample() {
    const D = state.params.digitsCount;
    const secret = D === 3 ? [7, 3, 9] : (D === 4 ? [7, 3, 9, 2] : [7, 3, 9, 2, 6]);
    // 8 Beobachtungen mit 2 verstellten Rädern (Teildrehung)
    const samples = [];
    for (let i = 0; i < 8; i++) {
      const copy = [...secret];
      if (i > 0) {
        copy[D - 1] = (copy[D - 1] + (i % 3) * (i % 2 === 0 ? 1 : -1) + 10) % 10;
        copy[0] = (copy[0] + (i % 2 === 0 ? 1 : 0) + 10) % 10;
      }
      samples.push(copy.join(''));
    }
    if (el.auditTextarea) el.auditTextarea.value = samples.join('\n');
    analyzeRealDecoderInput();
    showToast(`Beispiel 'Moderat' (${samples.length} Blicke) geladen!`);
  }

  function analyzeRealDecoderInput() {
    if (!el.auditTextarea) return;
    const D = state.params.digitsCount;
    if (el.auditDigitsLabel) el.auditDigitsLabel.textContent = D;

    const raw = el.auditTextarea.value || '';
    const lines = raw.split(/[\r\n,;]+/).map(l => l.replace(/[^0-9]/g, '')).filter(l => l.length > 0);

    const validCombos = lines.filter(l => l.length === D).map(l => l.split('').map(Number));
    const invalidCount = lines.filter(l => l.length !== D).length;

    if (el.auditCountBadge) {
      el.auditCountBadge.textContent = `${validCombos.length} Zustände`;
    }

    if (validCombos.length === 0) {
      if (el.auditValidationMsg) {
        el.auditValidationMsg.innerHTML = invalidCount > 0 
          ? `⚠️ ${invalidCount} Zeilen haben nicht die erforderliche Länge von ${D} Ziffern!`
          : `Bereit zur Analyse. Gib mindestens 2 Schließzustände (je ${D} Ziffern) ein.`;
      }
      if (el.auditRecommendationsList) {
        el.auditRecommendationsList.innerHTML = `<div class="audit-empty-state">Noch keine gültigen Daten vorhanden. Trage links ${D}-stellige Kombinationen ein.</div>`;
      }
      if (el.auditDiagnosisCard) {
        el.auditDiagnosisCard.innerHTML = `<div class="audit-empty-state">Gib Beobachtungen ein, um das Bewegungsmuster des Besitzers zu analysieren.</div>`;
      }
      if (el.auditAttackList) {
        el.auditAttackList.innerHTML = `<div class="audit-empty-state">Wird nach Eingabe der Kombinationen berechnet.</div>`;
      }
      if (el.auditHeatmapGrid) el.auditHeatmapGrid.innerHTML = '';
      if (el.auditHeatmapHeaderRow) el.auditHeatmapHeaderRow.innerHTML = '';
      return;
    }

    if (el.auditValidationMsg) {
      el.auditValidationMsg.innerHTML = `✅ <strong>${validCombos.length} gültige Kombinationen</strong> erfasst${invalidCount > 0 ? ` (⚠️ ${invalidCount} ungültige Zeilen ignoriert)` : ''}.`;
    }

    // 1. Frequenz-Matrix für D Räder
    const freq = Array.from({ length: D }, () => Array(10).fill(0));
    validCombos.forEach(c => {
      c.forEach((digit, wheel) => {
        if (freq[wheel]) freq[wheel][digit]++;
      });
    });

    // 2. Mini-Heatmap rendern
    renderAuditHeatmap(D, freq, validCombos.length);

    // 3. Top-Kombinationen & Bayes-Glättung berechnen
    const N = validCombos.length;
    const sortedDigitsPerWheel = [];
    for (let w = 0; w < D; w++) {
      const counts = freq[w].map((count, digit) => ({ digit, count }));
      counts.sort((a, b) => b.count - a.count);
      sortedDigitsPerWheel.push(counts);
    }

    const totalCandidates = 1 << D; // 2^D
    const candidates = [];

    for (let mask = 0; mask < totalCandidates; mask++) {
      const combo = [];
      let logProb = 0;

      for (let w = 0; w < D; w++) {
        const pickRank = (mask >> w) & 1; // 0 = Platz 1, 1 = Platz 2
        const digitObj = sortedDigitsPerWheel[w][pickRank] || sortedDigitsPerWheel[w][0];
        combo.push(digitObj.digit);

        // Laplace-geglättete Verbund-Wahrscheinlichkeit
        const p = (digitObj.count + 0.2) / (N + 2.0);
        logProb += Math.log(p);
      }

      candidates.push({ combo, prob: Math.exp(logProb) });
    }

    candidates.sort((a, b) => b.prob - a.prob);

    // Auf 100% normalisieren
    const sumProb = candidates.reduce((acc, c) => acc + c.prob, 0) || 1;
    candidates.forEach(c => {
      c.pct = Math.round((c.prob / sumProb) * 100);
    });

    // 4. Render Top 3 Empfehlungen
    renderAuditRecommendations(candidates.slice(0, 3));

    // 5. Diagnostiziere Verhaltensmuster
    diagnoseAuditPattern(D, freq, N, sortedDigitsPerWheel);

    // 6. Optimaler Angriffsplan (Top 10)
    renderAuditAttackList(candidates.slice(0, Math.min(10, candidates.length)));

    // Tooltips aktualisieren
    setupInstantTooltips();
  }

  function renderAuditHeatmap(D, freq, N) {
    if (!el.auditHeatmapGrid || !el.auditHeatmapHeaderRow) return;

    el.auditHeatmapHeaderRow.style.gridTemplateColumns = `44px repeat(${D}, 1fr)`;
    el.auditHeatmapHeaderRow.innerHTML = `<div class="heatmap-col-header digit-col">Ziff.</div>` +
      Array.from({ length: D }, (_, i) => `<div class="heatmap-col-header">Rad ${i + 1}</div>`).join('');

    el.auditHeatmapGrid.innerHTML = '';
    const maxCount = Math.max(1, ...freq.flat());

    for (let digit = 0; digit <= 9; digit++) {
      const row = document.createElement('div');
      row.className = 'heatmap-row';
      row.style.gridTemplateColumns = `44px repeat(${D}, 1fr)`;

      const label = document.createElement('div');
      label.className = 'heatmap-row-label';
      label.textContent = digit;
      row.appendChild(label);

      for (let wheel = 0; wheel < D; wheel++) {
        const count = freq[wheel][digit];
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';

        if (count === 0) {
          cell.style.background = 'rgba(255, 255, 255, 0.02)';
          cell.style.color = '#475569';
          cell.textContent = '-';
        } else {
          const intensity = count / maxCount;
          cell.style.background = `rgba(0, 242, 254, ${0.15 + intensity * 0.75})`;
          cell.style.color = intensity > 0.4 ? '#000' : '#fff';
          cell.style.fontWeight = '700';
          cell.textContent = count;
          cell.setAttribute('data-tooltip', `Rad ${wheel + 1}, Ziffer ${digit}: ${count}× gewählt (${Math.round((count / N) * 100)} %)`);
        }
        row.appendChild(cell);
      }
      el.auditHeatmapGrid.appendChild(row);
    }
  }

  function renderAuditRecommendations(top3) {
    if (!el.auditRecommendationsList) return;
    el.auditRecommendationsList.innerHTML = '';

    const labels = [
      { badge: 'Rang 1 (Spitzenreiter)', color: 'var(--accent-emerald)', desc: 'Höchste Verbund-Wahrscheinlichkeit' },
      { badge: 'Rang 2 (Alternative)', color: 'var(--accent-cyan)', desc: 'Stärkste Abweichungs-Kombination' },
      { badge: 'Rang 3 (Außenseiter)', color: 'var(--accent-amber)', desc: 'Drittbeste Gesamthypothese' }
    ];

    top3.forEach((cand, idx) => {
      const meta = labels[idx] || { badge: `Rang ${idx + 1}`, color: 'var(--text-secondary)', desc: '' };
      const card = document.createElement('div');
      card.className = 'recommendation-item';
      card.style.borderLeft = `4px solid ${meta.color}`;

      card.innerHTML = `
        <div class="rec-left">
          <div class="rec-badge" style="color: ${meta.color}; border-color: ${meta.color};">${meta.badge}</div>
          <div class="rec-combo" style="letter-spacing: 4px;">${cand.combo.join(' ')}</div>
          <div class="rec-sub">${meta.desc}</div>
        </div>
        <div class="rec-right">
          <div class="rec-prob-wrap">
            <span class="rec-prob-label">Konfidenz:</span>
            <span class="rec-prob-val" style="color: ${meta.color};">${cand.pct} %</span>
          </div>
          <div class="rec-progress-track">
            <div class="rec-progress-fill" style="width: ${Math.max(5, cand.pct)}%; background: ${meta.color};"></div>
          </div>
        </div>
      `;

      card.setAttribute('data-tooltip', `Klick kopiert Kombination '${cand.combo.join('')}'`);
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        navigator.clipboard.writeText(cand.combo.join(''));
        showToast(`Code '${cand.combo.join('')}' in Zwischenablage kopiert!`);
      });

      el.auditRecommendationsList.appendChild(card);
    });
  }

  function diagnoseAuditPattern(D, freq, N, sortedDigitsPerWheel) {
    if (!el.auditDiagnosisCard) return;

    const invariantWheels = [];
    const volatileWheels = [];

    sortedDigitsPerWheel.forEach((digits, w) => {
      const topRatio = digits[0].count / N;
      if (topRatio >= 0.85) {
        invariantWheels.push({ wheel: w + 1, digit: digits[0].digit, pct: Math.round(topRatio * 100) });
      } else if (topRatio <= 0.45) {
        volatileWheels.push({ wheel: w + 1, topRatio: Math.round(topRatio * 100) });
      }
    });

    let headerText = 'Typisches Alltags-Muster';
    let detailText = '';

    if (invariantWheels.length >= D - 1) {
      headerText = '🎯 Extrem fauler Nutzer (Minimal-Verstellung)';
      detailText = `Der Besitzer verdreht fast ausschließlich ein einziges Rad. ${invariantWheels.length} von ${D} Zylindern sind zu über 85 % starr auf ihrer echten Ziffer geblieben. Der Code ist extrem verwundbar!`;
    } else if (invariantWheels.length >= Math.ceil(D / 2)) {
      headerText = '⚙️ Moderat faul (Teildrehung an 1–2 Rädern)';
      detailText = `${invariantWheels.length} Zylinder (z. B. ${invariantWheels.map(i => `Rad ${i.wheel}`).join(', ')}) wurden selten bis gar nicht verdreht. Die Hauptbewegung konzentriert sich auf die Außenräder.`;
    } else if (volatileWheels.length >= Math.ceil(D / 2)) {
      headerText = '🌪️ Hohe Streuung / Gründlicher Dreher';
      detailText = `Die Ziffern sind über mehrere Räder verteilt. Der Nutzer dreht schwungvoll oder mehrere Personen bedienen das Schloss. Eine größere Anzahl Blicke (N ≥ 12) wird für 90 % Sicherheit empfohlen.`;
    } else {
      headerText = '🔍 Gemischtes Bewegungsmuster';
      detailText = `Solide Schwerpunkt-Bildung vorhanden. Die Spitzenreiter an den Rädern kristallisieren sich bereits klar heraus.`;
    }

    el.auditDiagnosisCard.innerHTML = `
      <div class="audit-diagnosis-header">${headerText}</div>
      <div class="audit-diagnosis-detail">${detailText}</div>
      <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 6px; display: flex; gap: 12px; flex-wrap: wrap;">
        ${invariantWheels.length > 0 ? `<span>🔒 Feste Zylinder: ${invariantWheels.map(i => `Rad ${i.wheel} (=${i.digit})`).join(', ')}</span>` : ''}
        ${volatileWheels.length > 0 ? `<span>🔄 Bewegte Zylinder: ${volatileWheels.map(v => `Rad ${v.wheel}`).join(', ')}</span>` : ''}
      </div>
    `;

    // --- INVERSE HABITUAL OFFSET ANALYSE FÜR REAL-DECODER ---
    renderAuditOffsetHypotheses(D, freq, N, sortedDigitsPerWheel, invariantWheels);
  }

  function renderAuditOffsetHypotheses(D, freq, N, sortedDigitsPerWheel, invariantWheels) {
    if (!el.auditOffsetSection || !el.auditOffsetHypothesesList) return;

    // Nur einblenden, wenn N >= 2 und mindestens 1 Rad starr ist
    if (N < 2 || invariantWheels.length === 0) {
      el.auditOffsetSection.style.display = 'none';
      return;
    }

    el.auditOffsetSection.style.display = 'block';
    el.auditOffsetHypothesesList.innerHTML = '';

    const peakCombo = sortedDigitsPerWheel.map(d => d[0].digit);
    const invariantIndices = invariantWheels.map(i => i.wheel - 1);

    // Zielräder für Habitual Shift ermitteln
    let targetWheels = [];
    if (invariantIndices.length === D) {
      // Alle Räder starr (z. B. immer 3-1-1)
      let coupled = false;
      for (let w = 0; w < D - 1; w++) {
        if (peakCombo[w] === peakCombo[w + 1] && w > 0) {
          targetWheels = [w, w + 1];
          coupled = true;
          break;
        }
      }
      if (!coupled) {
        targetWheels = D >= 3 ? [D - 2, D - 1] : [D - 1];
      }
    } else {
      // Nur die bewegten Räder shiften
      for (let w = 0; w < D; w++) {
        if (!invariantIndices.includes(w)) targetWheels.push(w);
      }
    }

    const offsetPresets = [
      { name: 'Daumenwisch nach unten (-2)', delta: -2, prob: 88, desc: 'Zwei Klicks abwärts' },
      { name: 'Minimaler Nachklick (-1)', delta: -1, prob: 74, desc: 'Ein Klick abwärts' },
      { name: 'Halbdrehung 180° (±5)', delta: 5, prob: 58, desc: 'Schwungvolle Halbdrehung' }
    ];

    offsetPresets.forEach((p, idx) => {
      const reconstructed = [...peakCombo];
      targetWheels.forEach(w => {
        reconstructed[w] = (reconstructed[w] - p.delta + 10) % 10;
      });

      const item = document.createElement('div');
      item.className = 'recommendation-item';
      item.style.borderLeft = '4px solid #c084fc';
      item.style.cursor = 'pointer';
      item.setAttribute('data-tooltip', `Klick kopiert '${reconstructed.join('')}'`);

      item.innerHTML = `
        <div class="rec-left">
          <div class="rec-badge" style="color: #c084fc; border-color: rgba(192, 132, 252, 0.4);">
            #${idx + 1} ${p.name}
          </div>
          <div class="rec-combo" style="letter-spacing: 4px; color: #c084fc;">${reconstructed.join(' ')}</div>
          <div class="rec-sub">${p.desc} an ${targetWheels.map(w => `Rad ${w + 1}`).join(' & ')}</div>
        </div>
        <div class="rec-right">
          <div class="rec-prob-wrap">
            <span class="rec-prob-label">Habitual-Plausibilität:</span>
            <span class="rec-prob-val" style="color: #c084fc;">${p.prob} %</span>
          </div>
          <div class="rec-progress-track">
            <div class="rec-progress-fill" style="width: ${p.prob}%; background: #c084fc;"></div>
          </div>
        </div>
      `;

      item.addEventListener('click', () => {
        navigator.clipboard.writeText(reconstructed.join(''));
        showToast(`Habitual-Code '${reconstructed.join('')}' in Zwischenablage kopiert!`);
      });

      el.auditOffsetHypothesesList.appendChild(item);
    });
  }

  function renderAuditAttackList(top10) {
    if (!el.auditAttackList) return;
    el.auditAttackList.innerHTML = '';

    top10.forEach((item, idx) => {
      const elItem = document.createElement('div');
      elItem.className = 'audit-attack-item';
      elItem.setAttribute('data-tooltip', `Priorität #${idx + 1} (${item.pct}% Chance) - Klick zum Kopieren`);
      elItem.style.cursor = 'pointer';

      elItem.innerHTML = `
        <span class="audit-attack-rank">#${idx + 1}</span>
        <span class="audit-attack-code">${item.combo.join('')}</span>
      `;

      elItem.addEventListener('click', () => {
        navigator.clipboard.writeText(item.combo.join(''));
        showToast(`Code #${idx + 1} (${item.combo.join('')}) kopiert!`);
      });

      el.auditAttackList.appendChild(elItem);
    });
  }

  // =========================================================================
  // TOOLTIP-SYSTEM: SOFORTIGE DARSTELLUNG (KEIN OS COCOA DELAY)
  // =========================================================================

  function setupInstantTooltips() {
    document.querySelectorAll('[title]').forEach(elem => {
      const t = elem.getAttribute('title');
      if (t) {
        elem.setAttribute('data-tooltip', t);
        elem.removeAttribute('title');
      }
    });
  }

  // --- MODUS-UMSCHALTUNG ---
  function switchMode(newMode) {
    state.mode = newMode;

    [el.laborView, el.gameView, el.auditView].forEach(v => v && v.classList.remove('active'));
    [el.btnModeLabor, el.btnModeGame, el.btnModeAudit].forEach(b => b && b.classList.remove('active'));

    if (newMode === 'labor') {
      if (el.laborView) el.laborView.classList.add('active');
      if (el.btnModeLabor) el.btnModeLabor.classList.add('active');
      renderMathCurve();
    } else if (newMode === 'game') {
      if (el.gameView) el.gameView.classList.add('active');
      if (el.btnModeGame) el.btnModeGame.classList.add('active');
      if (state.game.poolObservations.length === 0) {
        generateNewChallenge('standard');
      }
    } else if (newMode === 'audit') {
      if (el.auditView) el.auditView.classList.add('active');
      if (el.btnModeAudit) el.btnModeAudit.classList.add('active');
      analyzeRealDecoderInput();
    }
  }

  // --- EVENTS ---
  function initEvents() {
    // Sound Toggle
    el.btnToggleSound.addEventListener('click', () => {
      const isMuted = window.lockSound.toggleMute();
      el.soundIcon.textContent = isMuted ? '🔇' : '🔊';
      showToast(isMuted ? 'Sound deaktiviert' : 'Sound aktiviert');
    });

    // Zylinder-Wahlschalter (3, 4, 5 Ziffern)
    el.digitsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const d = parseInt(btn.getAttribute('data-digits'), 10);
        if (state.params.digitsCount === d) return;

        el.digitsBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        state.params.digitsCount = d;
        state.game.digitsCount = d;

        // Reset Cache & Aktualisiere Oberflächen
        cachedCurveData = null;
        updatePresetLabels(d);
        initMonteCarloGrids();
        renderMathCurve();
        triggerAutoMonteCarlo(0);
        renderBenchmarkCards();

        // Hacker Challenge synchronisieren
        generateNewChallenge();

        // Praxis-Decoder synchronisieren
        analyzeRealDecoderInput();

        showToast(`Schloss-Typ auf ${d} Ziffern umgestellt!`);
      });
    });

    // Modi Umschalter
    if (el.btnModeLabor) el.btnModeLabor.addEventListener('click', () => switchMode('labor'));
    if (el.btnModeGame) el.btnModeGame.addEventListener('click', () => switchMode('game'));
    if (el.btnModeAudit) el.btnModeAudit.addEventListener('click', () => switchMode('audit'));

    // Praxis-Decoder Event-Bindings
    if (el.auditTextarea) el.auditTextarea.addEventListener('input', analyzeRealDecoderInput);
    if (el.btnAuditSampleLazy) el.btnAuditSampleLazy.addEventListener('click', loadAuditLazySample);
    if (el.btnAuditSampleModerat) el.btnAuditSampleModerat.addEventListener('click', loadAuditModeratSample);
    if (el.btnAuditClear) el.btnAuditClear.addEventListener('click', () => {
      if (el.auditTextarea) el.auditTextarea.value = '';
      analyzeRealDecoderInput();
      showToast('Eingabe geleert');
    });

    // Annahmen Modal
    el.btnOpenAssumptions.addEventListener('click', () => el.modalAssumptions.classList.add('open'));
    el.btnCloseModal.addEventListener('click', () => el.modalAssumptions.classList.remove('open'));
    el.modalAssumptions.addEventListener('click', (e) => {
      if (e.target === el.modalAssumptions) el.modalAssumptions.classList.remove('open');
    });

    // Win Modal Events
    if (el.btnCloseWinModal) {
      el.btnCloseWinModal.addEventListener('click', () => el.modalWin.classList.remove('open'));
    }
    if (el.btnNextRound) {
      el.btnNextRound.addEventListener('click', () => {
        el.modalWin.classList.remove('open');
        generateNewChallenge();
      });
    }
    if (el.modalWin) {
      el.modalWin.addEventListener('click', (e) => {
        if (e.target === el.modalWin) el.modalWin.classList.remove('open');
      });
    }

    // 6 Labor Presets
    el.presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        el.presetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.params.preset = chip.getAttribute('data-preset');

        updatePresetLabels(state.params.digitsCount);
        renderMathCurve();
        triggerAutoMonteCarlo(0);
        renderBenchmarkCards();
      });
    });

    // Labor Sliders (mit automatischer Monte-Carlo Re-Simulation)
    el.sliderObservations.addEventListener('input', (e) => {
      state.params.N = parseInt(e.target.value, 10);
      el.valObservations.textContent = state.params.N;
      renderMathCurve();
      triggerAutoMonteCarlo(100);
    });

    el.sliderNoise.addEventListener('input', (e) => {
      state.params.noise = parseInt(e.target.value, 10);
      el.valNoise.textContent = `${state.params.noise} %`;
      renderMathCurve();
      triggerAutoMonteCarlo(100);
      renderBenchmarkCards();
    });

    el.checkCoupling.addEventListener('change', (e) => {
      state.params.thumbCoupling = e.target.checked;
      renderMathCurve();
      triggerAutoMonteCarlo(0);
    });

    // 6 Hacker-Challenge Presets (erzeugt neues Ziel & setzt N=1)
    el.gamePresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        el.gamePresetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const p = btn.getAttribute('data-preset');
        generateNewChallenge(p);
      });
    });

    // Kumulativer Beobachtungs-Slider in der Challenge
    el.sliderGameObservations.addEventListener('input', applyCumulativeGameSlice);

    // Strategie-Toggle (Häufigkeits-Peak vs Habitual Offset)
    if (el.btnStratPeak && el.btnStratOffset) {
      el.btnStratPeak.addEventListener('click', () => {
        state.game.strategy = 'peak';
        el.btnStratPeak.classList.add('active');
        el.btnStratOffset.classList.remove('active');
        renderRecommendations();
        showToast('Strategie 1: Häufigkeits-Peak aktiv');
      });

      el.btnStratOffset.addEventListener('click', () => {
        state.game.strategy = 'offset';
        el.btnStratOffset.classList.add('active');
        el.btnStratPeak.classList.remove('active');
        renderRecommendations();
        showToast('Strategie 2: Habitual Offset aktiv');
      });
    }

    el.btnTestOpen.addEventListener('click', testUnlock);
    el.btnToggleSecret.addEventListener('click', () => {
      state.game.isSecretVisible = !state.game.isSecretVisible;
      updateGameUI();
    });

    // Keyboard
    let selectedWheel = 0;
    window.addEventListener('keydown', (e) => {
      if (state.mode !== 'game') return;
      const D = state.game.digitsCount || 5;

      if (e.key >= '1' && e.key <= `${D}`) {
        selectedWheel = parseInt(e.key, 10) - 1;
        showToast(`Rad ${selectedWheel + 1} aktiv`);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        changeDigit(selectedWheel, 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        changeDigit(selectedWheel, -1);
      } else if (e.key === 'Enter') {
        testUnlock();
      }
    });

    window.addEventListener('resize', renderMathCurve);
  }

  // --- INITIALISIERUNG ---
  function init() {
    updatePresetLabels(state.params.digitsCount);
    render3DLock(state.params.digitsCount);
    initEvents();
    initMonteCarloGrids();
    renderMathCurve();
    renderBenchmarkCards();
    runMonteCarloSimulation();
    setupInstantTooltips();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
