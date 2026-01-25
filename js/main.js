const AUDIO_CONSENT_KEY = "hhf-audio-consent";
const CRASH_LOG_LIMIT = 50;
let savePending = false;
const bgmEl = document.getElementById("bgm");
const aicoreCueEl = document.getElementById("aicoreCue");

function isAudioAllowed() {
  return localStorage.getItem(AUDIO_CONSENT_KEY) === "granted";
}

function playWithGestureFallback(audioEl) {
  if (!audioEl) return;
  const playPromise = audioEl.play();
  if (playPromise && playPromise.catch) {
    playPromise.catch(() => {
      const resume = () => {
        audioEl.play().catch(() => {});
      };
      document.addEventListener("click", resume, { once: true });
      document.addEventListener("keydown", resume, { once: true });
    });
  }
}

function initAudio() {
  if (!isAudioAllowed()) return;
  if (bgmEl) bgmEl.volume = 0.6;
  playWithGestureFallback(bgmEl);
}

function playAICoreCue() {
  if (!isAudioAllowed() || !aicoreCueEl) return;
  if (bgmEl && !bgmEl.paused) {
    bgmEl.pause();
  }
  aicoreCueEl.currentTime = 0;
  playWithGestureFallback(aicoreCueEl);
}

function logCrash(context, error) {
  const errMsg = error && error.message ? error.message : String(error || "Unknown error");
  const entry = { icon: "[ERR]", text: `${context}: ${errMsg}` };
  if (state) {
    state.log = state.log || [];
    state.log.unshift(entry);
    state.log = state.log.slice(0, CRASH_LOG_LIMIT);
  }
  if (console && console.error) console.error(context, error);
}

function safeRun(context, fn) {
  try {
    return fn();
  } catch (err) {
    logCrash(context, err);
    return null;
  }
}

function scheduleSave(reason) {
  if (savePending) return;
  savePending = true;
  const run = () => {
    savePending = false;
    safeRun(`saveGame:${reason}`, saveGame);
  };
  if (window.requestIdleCallback) {
    window.requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 0);
  }
}

function calculatePrestigeGain() {
  const total = state.stats.lifetime.Godcoins.m > 0 ? state.stats.lifetime.Godcoins : state.stats.lifetime.Scrap;
  const log10 = total.m === 0 ? 0 : total.e + Math.log10(total.m);
  return Math.max(0, Math.floor(log10 - 6));
}

function performPrestige(perkId) {
  const gain = calculatePrestigeGain();
  const carryTokens = bnAdd(state.paradoxTokens, bnFromNumber(gain));
  const keepSettings = state.settings;
  const keepPermanent = state.permanent;
  state = createDefaultState();
  state.paradoxTokens = carryTokens;
  state.settings = keepSettings;
  state.permanent = keepPermanent;
  state.stats.totalPrestiges += 1;
  state.perk = perkId;
  applyPermanentUpgrades();
  applyPerks();
  buildGrid();
  computeTotals();
  addLog("[REBOOT]", "Timeline rebooted. Reality rewritten.");
}

saveBtn.addEventListener("click", () => scheduleSave("manual"));
prestigeBtn.addEventListener("click", () => showPrestigeOverlay());
reducedMotionToggle.addEventListener("change", e => { state.settings.reducedMotion = e.target.checked; applySettings(); });
colorblindToggle.addEventListener("change", e => { state.settings.colorblind = e.target.checked; applySettings(); });
shakeToggle.addEventListener("change", e => { state.settings.shake = e.target.checked; });
fireworksToggle.addEventListener("change", e => { state.settings.fireworks = e.target.checked; });
blueprintBtn.addEventListener("click", () => autoBuild(state.selectedBuilding));
buySlotBtn.addEventListener("click", () => buyGridSlot());
document.addEventListener("click", (event) => {
  if (contextMenuEl && contextMenuEl.classList.contains("active")) {
    if (!contextMenuEl.contains(event.target)) hideContextMenu();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideContextMenu();
});
contextRemoveBtn.addEventListener("click", () => {
  const index = parseInt(contextMenuEl.dataset.index || "", 10);
  if (Number.isFinite(index)) {
    removeBuilding(index);
  }
  hideContextMenu();
});
gameOverMenuBtn.addEventListener("click", () => {
  window.location.href = "menu.html";
});
gameOverRestartBtn.addEventListener("click", () => {
  localStorage.removeItem(SAVE_KEY);
  window.location.href = "index.html";
});

tabContents.stats.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-prestige]");
  if (!btn) return;
  if (safeRun("purchasePrestigeUpgrade", () => purchasePrestigeUpgrade(btn.dataset.prestige))) {
    triggerRewardEffect(btn);
    pulseLatestLog();
  }
});

tabContents.buildings.addEventListener("pointerdown", (event) => {
  const btn = event.target.closest(".building-btn");
  if (!btn) return;
  const key = btn.dataset.building;
  if (!state.unlocks[key]) return;
  const def = BUILDINGS[key];
  if (def.global) {
    if (safeRun("buyGlobalSupport", () => buyGlobalSupport(key))) {
      triggerRewardEffect(btn);
    }
    return;
  }
  setSelectedBuilding(key);
});

function init() {
  window.addEventListener("error", (event) => {
    logCrash("window.onerror", event.error || event.message || "Unknown error");
  });
  window.addEventListener("unhandledrejection", (event) => {
    logCrash("unhandledrejection", event.reason || "Unknown rejection");
  });
  state = createDefaultState();
  const loaded = loadGame();
  if (!loaded) {
    applyPermanentUpgrades();
    applyPerks();
  }
  if (state.gameOver) {
    applySettings();
    renderTabs();
    buildGrid();
    computeTotals();
    requestAnimationFrame(render);
    return;
  }
  syncGridWidth();
  buildGrid();
  renderTabs();
  computeTotals();
  applySettings();
  initAudio();
  let lastTime = performance.now();
  let accumulator = 0;
  function gameLoop(now) {
    const delta = Math.min(1, (now - lastTime) / 1000);
    lastTime = now;
    accumulator += delta;
    let steps = 0;
    const maxSteps = 5;
    while (accumulator >= TICK_RATE && steps < maxSteps) {
      safeRun("tick", () => tick(TICK_RATE));
      accumulator -= TICK_RATE;
      steps += 1;
    }
    if (steps === maxSteps) {
      accumulator = 0;
    }
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
  setInterval(() => scheduleSave("auto"), 10000);
  requestAnimationFrame(render);
}

init();
