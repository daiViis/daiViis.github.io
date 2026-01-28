const AUDIO_CONSENT_KEY = "hhf-audio-consent";
const CRASH_LOG_LIMIT = 50;
let savePending = false;
const bgmEl = document.getElementById("bgm");
const aicoreCueEl = document.getElementById("aicoreCue");
const upgradeCueEl = document.getElementById("upgradeCue");
const BGM_TRACKS = [
  "audio/01.mp3",
  "audio/02.mp3",
  "audio/03.mp3",
  "audio/04.mp3",
  "audio/05.mp3",
  "audio/06.mp3",
  "audio/07.mp3",
  "audio/08.mp3"
];
let bgmIndex = 0;
let resumeBgmAfterCue = false;

function isAudioAllowed() {
  return localStorage.getItem(AUDIO_CONSENT_KEY) === "granted";
}

function isAudioEnabled() {
  return !!(state && state.settings && state.settings.audioEnabled);
}

function getAudioVolume() {
  const volume = state && state.settings ? state.settings.audioVolume : 0.6;
  return Math.max(0, Math.min(1, volume || 0));
}

function setBgmTrack(index) {
  if (!bgmEl || BGM_TRACKS.length === 0) return;
  bgmIndex = (index + BGM_TRACKS.length) % BGM_TRACKS.length;
  if ((bgmEl.getAttribute("src") || "") !== BGM_TRACKS[bgmIndex]) {
    bgmEl.src = BGM_TRACKS[bgmIndex];
    bgmEl.load();
  }
}

function handleBgmEnded() {
  if (!isAudioAllowed() || !isAudioEnabled()) return;
  setBgmTrack(bgmIndex + 1);
  playWithGestureFallback(bgmEl);
}

function syncAudioSettings() {
  const volume = getAudioVolume();
  const active = isAudioAllowed() && isAudioEnabled();
  if (bgmEl) bgmEl.volume = volume;
  if (aicoreCueEl) aicoreCueEl.volume = volume;
  if (upgradeCueEl) upgradeCueEl.volume = volume;
  if (!bgmEl) return;
  if (!active) {
    bgmEl.pause();
    return;
  }
  if (bgmEl.paused) {
    playWithGestureFallback(bgmEl);
  }
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
  if (!bgmEl) return;
  const currentSrc = bgmEl.getAttribute("src") || "";
  const foundIndex = BGM_TRACKS.findIndex(track => track === currentSrc);
  setBgmTrack(foundIndex >= 0 ? foundIndex : 0);
  bgmEl.addEventListener("ended", handleBgmEnded);
  syncAudioSettings();
}

function playAICoreCue() {
  if (!isAudioAllowed() || !isAudioEnabled() || !aicoreCueEl) return;
  resumeBgmAfterCue = !!(bgmEl && !bgmEl.paused);
  if (bgmEl && !bgmEl.paused) bgmEl.pause();
  aicoreCueEl.currentTime = 0;
  playWithGestureFallback(aicoreCueEl);
}

function playUpgradeCue() {
  if (!isAudioAllowed() || !isAudioEnabled() || !upgradeCueEl) return;
  upgradeCueEl.currentTime = 0;
  playWithGestureFallback(upgradeCueEl);
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
if (textSizeSelect) {
  textSizeSelect.addEventListener("change", e => {
    state.settings.textSize = e.target.value;
    applySettings();
  });
}
shakeToggle.addEventListener("change", e => { state.settings.shake = e.target.checked; });
fireworksToggle.addEventListener("change", e => { state.settings.fireworks = e.target.checked; });
if (audioToggle) {
  audioToggle.addEventListener("change", e => {
    state.settings.audioEnabled = e.target.checked;
    syncAudioSettings();
  });
}
if (audioVolume) {
  audioVolume.addEventListener("input", e => {
    state.settings.audioVolume = Math.max(0, Math.min(1, Number(e.target.value) / 100));
    syncAudioSettings();
  });
}
if (headerMenuToggle && headerActionsEl) {
  const setHeaderMenuOpen = (isOpen) => {
    headerActionsEl.classList.toggle("open", isOpen);
    headerMenuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  };
  headerMenuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setHeaderMenuOpen(!headerActionsEl.classList.contains("open"));
  });
}
blueprintBtn.addEventListener("click", () => autoBuild(state.selectedBuilding));
buySlotBtn.addEventListener("click", () => buyGridSlot());
if (emergencyBtn) {
  emergencyBtn.addEventListener("click", () => {
    if (triggerEmergencyShutdown()) {
      pulseLatestLog();
    }
  });
}
document.addEventListener("click", (event) => {
  if (headerActionsEl && headerActionsEl.classList.contains("open")) {
    if (!headerActionsEl.contains(event.target) && !headerMenuToggle?.contains(event.target)) {
      headerActionsEl.classList.remove("open");
      if (headerMenuToggle) headerMenuToggle.setAttribute("aria-expanded", "false");
    }
  }
  if (fanContextMenuEl && fanContextMenuEl.classList.contains("active")) {
    if (!fanContextMenuEl.contains(event.target)) hideFanContextMenu();
  }
  if (storageContextMenuEl && storageContextMenuEl.classList.contains("active")) {
    if (!storageContextMenuEl.contains(event.target)) hideStorageContextMenu();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (headerActionsEl) headerActionsEl.classList.remove("open");
    if (headerMenuToggle) headerMenuToggle.setAttribute("aria-expanded", "false");
    hideFanContextMenu();
    hideStorageContextMenu();
  }
});
if (fanCounterEl) {
  fanCounterEl.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    hideStorageContextMenu();
    updateFanContextMenu();
    showFanContextMenu(event.clientX, event.clientY);
  });
}
if (storageCounterEl) {
  storageCounterEl.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    hideFanContextMenu();
    updateStorageContextMenu();
    showStorageContextMenu(event.clientX, event.clientY);
  });
}
if (fanOverclockBtn) {
  fanOverclockBtn.addEventListener("click", () => {
    if (purchaseFanOverclock()) {
      triggerRewardEffect(fanCounterEl);
    }
    hideFanContextMenu();
  });
}
if (storageUpgradeBtn) {
  storageUpgradeBtn.addEventListener("click", () => {
    if (purchaseUpgrade("storage-silo")) {
      triggerRewardEffect(storageCounterEl);
      updateStorageContextMenu();
    }
    hideStorageContextMenu();
  });
}
gameOverMenuBtn.addEventListener("click", () => {
  window.location.href = "index.html";
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
  if (btn.disabled) return;
  const key = btn.dataset.building;
  if (!state.unlocks[key]) return;
  const def = BUILDINGS[key];
  if (def.global) {
    if (safeRun("buyGlobalSupport", () => buyGlobalSupport(key))) {
      triggerRewardEffect(btn);
    }
    return;
  }
  if (state.settings.autoPlace) {
    setSelectedBuilding(key);
    if (safeRun("autoPlaceBuild", () => autoPlaceBuild(key))) {
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
  if (aicoreCueEl) {
    aicoreCueEl.addEventListener("ended", () => {
      if (!resumeBgmAfterCue) return;
      resumeBgmAfterCue = false;
      syncAudioSettings();
    });
  }
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
