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

saveBtn.addEventListener("click", saveGame);
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
  if (purchasePrestigeUpgrade(btn.dataset.prestige)) {
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
    if (buyGlobalSupport(key)) {
      triggerRewardEffect(btn);
    }
    return;
  }
  setSelectedBuilding(key);
});

function init() {
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
  setInterval(() => tick(TICK_RATE), TICK_RATE * 1000);
  setInterval(saveGame, 10000);
  requestAnimationFrame(render);
}

init();
