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
const heatDisplayEl = document.getElementById("heatDisplay");
const gridStatsEl = document.getElementById("gridStats");
const statusEl = document.getElementById("status");
const storyAreaEl = document.getElementById("storyArea");
const floatingLayer = document.getElementById("floatingLayer");
const fireworksLayer = document.getElementById("fireworksLayer");
const heatEdgeEl = document.getElementById("heatEdge");
const fanCounterEl = document.getElementById("fanCounter");
const automationAreaEl = document.getElementById("automationArea");
const contextMenuEl = document.getElementById("contextMenu");
const contextToggleBtn = document.getElementById("contextToggle");
const contextRemoveBtn = document.getElementById("contextRemove");
const contextAutomationEl = document.getElementById("contextAutomation");
const fanContextMenuEl = document.getElementById("fanContextMenu");
const fanOverclockBtn = document.getElementById("fanOverclock");
const fanOverclockCost = document.getElementById("fanOverclockCost");
const fanOverclockDesc = document.getElementById("fanOverclockDesc");
const fanOverclockCount = document.getElementById("fanOverclockCount");
const contextMinerTurbo = document.getElementById("contextMinerTurbo");
const contextMinerInfo = document.getElementById("contextMinerInfo");
const contextMinerCost = document.getElementById("contextMinerCost");
const contextSmelterFurnace = document.getElementById("contextSmelterFurnace");
const contextSmelterInfo = document.getElementById("contextSmelterInfo");
const contextSmelterCost = document.getElementById("contextSmelterCost");
const contextAshUpgrade = document.getElementById("contextAshUpgrade");
const contextAshInfo = document.getElementById("contextAshInfo");
const contextAshCost = document.getElementById("contextAshCost");
const gameOverOverlayEl = document.getElementById("gameOverOverlay");
const gameOverMenuBtn = document.getElementById("gameOverMenu");
const gameOverRestartBtn = document.getElementById("gameOverRestart");
const winOverlayEl = document.getElementById("winOverlay");
const winMenuBtn = document.getElementById("winMenu");
const prestigeBtn = document.getElementById("prestigeBtn");
const saveBtn = document.getElementById("saveBtn");
const reducedMotionToggle = document.getElementById("reducedMotion");
const colorblindToggle = document.getElementById("colorblind");
const shakeToggle = document.getElementById("shakeToggle");
const fireworksToggle = document.getElementById("fireworksToggle");
const audioToggle = document.getElementById("audioToggle");
const audioVolume = document.getElementById("audioVolume");
const blueprintBtn = document.getElementById("blueprintBtn");
const buySlotBtn = document.getElementById("buySlotBtn");
const prestigeOverlay = document.getElementById("prestigeOverlay");
const perkOptionsEl = document.getElementById("perkOptions");
const renderCache = {
  buildings: "",
  research: "",
  upgrades: "",
  achievements: "",
  stats: "",
  automation: ""
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
  const totalsKey = RESOURCE_LIST.map(r => bnToString(state.totals[r.key] || { m: 0, e: 0 })).join("|");
  return `${state.selectedBuilding}|${getUnlocksKey()}|${countKey}|${state.gridSlots}|${totalsKey}`;
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
  return `${base}|${state.storageCap}|${state.cooling?.fans || 0}`;
}

function getAchievementsRenderKey() {
  return Object.keys(state.achievements).sort().join("|");
}

function getStatsRenderKey() {
  const s = state.stats;
  const lifeKey = RESOURCE_LIST.map(r => bnToString(s.lifetime[r.key] || { m: 0, e: 0 })).join("|");
  return `${lifeKey}|${s.meltdowns}|${s.contractsCompleted}|${s.bestContractStreak}|${s.bossesDefeated}|${s.totalPrestiges}|${bnToString(state.paradoxTokens)}`;
}

function getAutomationRenderKey() {
  const ruleKey = (rule) => {
    if (!rule) return "";
    const left = rule.condition?.left || {};
    const right = rule.condition?.right || {};
    const action = rule.action || {};
    return [
      rule.id,
      rule.name,
      left.type,
      left.resource || left.building || left.value || "",
      rule.condition?.comparator || "",
      right.type,
      right.resource || right.building || right.value || "",
      action.type || "",
      action.target || "",
      rule.source || ""
    ].join(":");
  };
  const rulesKey = (state.rules || []).map(ruleKey).join("|");
  const defaults = state.buildingRuleDefaults || {};
  const defaultsKey = Object.keys(defaults).sort().map(key => {
    const list = defaults[key] || [];
    return `${key}:${list.map(ruleKey).join(",")}`;
  }).join("|");
  return `${rulesKey}|${defaultsKey}|${state.maxRules || 0}`;
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
  const storyEl = typeof storyAreaEl !== "undefined"
    ? storyAreaEl
    : document.getElementById("storyArea");
  if (storyEl) {
    pulseElement(storyEl, "btn-reward", 600);
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

function showFanContextMenu(x, y) {
  if (!fanContextMenuEl) return;
  fanContextMenuEl.style.left = `${x}px`;
  fanContextMenuEl.style.top = `${y}px`;
  fanContextMenuEl.classList.add("active");
}

function hideFanContextMenu() {
  if (!fanContextMenuEl) return;
  fanContextMenuEl.classList.remove("active");
}
