const gridEl = document.getElementById("grid");
const tabsEl = document.getElementById("tabs");
const resourceBarEl = document.getElementById("resourceBar");
const statLineEl = document.getElementById("statLine");
const tabContents = {
  buildings: document.getElementById("tab-buildings"),
  research: document.getElementById("tab-research"),
  upgrades: document.getElementById("tab-upgrades"),
  achievements: document.getElementById("tab-achievements"),
  stats: document.getElementById("tab-stats")
};
const contractAreaEl = document.getElementById("contractArea");
const bossAreaEl = document.getElementById("bossArea");
const storyAreaEl = document.getElementById("storyArea");
const heatDisplayEl = document.getElementById("heatDisplay");
const gridStatsEl = document.getElementById("gridStats");
const statusEl = document.getElementById("status");
const floatingLayer = document.getElementById("floatingLayer");
const fireworksLayer = document.getElementById("fireworksLayer");
const heatEdgeEl = document.getElementById("heatEdge");
const fanCounterEl = document.getElementById("fanCounter");
const contextMenuEl = document.getElementById("contextMenu");
const contextRemoveBtn = document.getElementById("contextRemove");
const gameOverOverlayEl = document.getElementById("gameOverOverlay");
const gameOverMenuBtn = document.getElementById("gameOverMenu");
const gameOverRestartBtn = document.getElementById("gameOverRestart");
const prestigeBtn = document.getElementById("prestigeBtn");
const saveBtn = document.getElementById("saveBtn");
const reducedMotionToggle = document.getElementById("reducedMotion");
const colorblindToggle = document.getElementById("colorblind");
const shakeToggle = document.getElementById("shakeToggle");
const fireworksToggle = document.getElementById("fireworksToggle");
const blueprintBtn = document.getElementById("blueprintBtn");
const buySlotBtn = document.getElementById("buySlotBtn");
const prestigeOverlay = document.getElementById("prestigeOverlay");
const perkOptionsEl = document.getElementById("perkOptions");
const renderCache = {
  buildings: "",
  research: "",
  upgrades: "",
  achievements: "",
  stats: ""
};

function renderIfChanged(section, key, renderFn) {
  if (renderCache[section] === key) return;
  renderCache[section] = key;
  renderFn();
}

function isTabActive(name) {
  return tabContents[name].classList.contains("active");
}

function getBuildingCounts() {
  const counts = {};
  Object.keys(BUILDINGS).forEach(key => { counts[key] = 0; });
  state.grid.forEach(tile => {
    if (tile.building) counts[tile.building] += 1;
  });
  return counts;
}

function getUnlocksKey() {
  return Object.keys(BUILDINGS).map(key => state.unlocks[key] ? "1" : "0").join("");
}

function getBuildingsRenderKey(counts) {
  const countKey = Object.keys(BUILDINGS).map(key => {
    if (BUILDINGS[key].global) return state.cooling?.fans || 0;
    return counts[key] || 0;
  }).join(",");
  return `${state.selectedBuilding}|${getUnlocksKey()}|${countKey}`;
}

function getResearchRenderKey() {
  const base = Object.keys(state.research).sort().map(id => {
    const variant = state.research[id + "-variant"];
    return variant ? `${id}:${variant.id}` : id;
  }).join("|");
  return `${base}|${getUnlocksKey()}`;
}

function getUpgradesRenderKey() {
  const base = Object.keys(state.upgrades || {}).sort().map(id => `${id}:${state.upgrades[id]}`).join("|");
  return `${base}|${state.storageCap}`;
}

function getAchievementsRenderKey() {
  return Object.keys(state.achievements).sort().join("|");
}

function getStatsRenderKey() {
  const s = state.stats;
  const lifeKey = RESOURCE_LIST.map(r => bnToString(s.lifetime[r.key] || { m: 0, e: 0 })).join("|");
  return `${lifeKey}|${s.meltdowns}|${s.contractsCompleted}|${s.bestContractStreak}|${s.bossesDefeated}|${s.totalPrestiges}|${bnToString(state.paradoxTokens)}`;
}

function setSelectedBuilding(key) {
  if (state.selectedBuilding === key) return;
  state.selectedBuilding = key;
  renderCache.buildings = "";
}

function pulseElement(el, className, duration = 600) {
  if (!el || state.settings.reducedMotion) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), duration);
}

function rewardBurstAt(x, y, variant = "good") {
  if (state.settings.reducedMotion) return;
  const ring = document.createElement("div");
  ring.className = "reward-ring";
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  floatingLayer.appendChild(ring);

  const burst = document.createElement("div");
  burst.className = `reward-burst ${variant}`;
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  for (let i = 0; i < 8; i++) {
    const spark = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 8;
    const distance = 18 + Math.random() * 10;
    spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    burst.appendChild(spark);
  }
  floatingLayer.appendChild(burst);
  setTimeout(() => ring.remove(), 800);
  setTimeout(() => burst.remove(), 800);
}

function rewardBurstOnElement(el, variant = "good") {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  rewardBurstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, variant);
}

function triggerBuildEffect(index) {
  const cell = gridEl.children[index];
  if (!cell) return;
  pulseElement(cell, "build-anim", 500);
  rewardBurstOnElement(cell, "cool");
}

function triggerRewardEffect(el) {
  rewardBurstOnElement(el, "good");
  pulseElement(el, "btn-reward", 600);
}

function triggerScreenReward(variant = "good") {
  rewardBurstAt(window.innerWidth / 2, window.innerHeight / 2, variant);
}

function pulseLatestLog() {
  if (storyAreaEl) {
    pulseElement(storyAreaEl, "btn-reward", 600);
  } else if (statusEl) {
    pulseElement(statusEl, "btn-reward", 600);
  }
}

function showContextMenu(x, y, index) {
  if (!contextMenuEl) return;
  contextMenuEl.style.left = `${x}px`;
  contextMenuEl.style.top = `${y}px`;
  contextMenuEl.dataset.index = index;
  contextMenuEl.classList.add("active");
}

function hideContextMenu() {
  if (!contextMenuEl) return;
  contextMenuEl.classList.remove("active");
  contextMenuEl.dataset.index = "";
}
