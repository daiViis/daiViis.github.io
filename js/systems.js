const POWER_TOGGLE_COOLDOWN_MS = 30000;
const EMERGENCY_SHUTDOWN_MS = 60000;
const EMERGENCY_COOLDOWN_MS = 15 * 60 * 1000;
const FAN_BASE_COST = BUILDINGS.Fan?.cost?.Scrap || 100;
const FAN_COST_STEP = 50;
const FAN_TIER_BASE = 100;
const FAN_OVERCLOCK_MIN_FANS = 6;
const FAN_OVERCLOCK_BASE_COST = 50;
const FAN_OVERCLOCK_COST_STEP = 10;
const FAN_OVERCLOCK_BASE_BONUS = 0.10;
const FAN_OVERCLOCK_TIER_BONUS = 0.02;
const FAN_OVERCLOCK_WASTE_INTERVAL = 15;
const STORAGE_UPGRADE_RESOURCES = ["Scrap", "Gears", "Circuits", "AICores", "RealityShards", "TimelineInk", "Godcoins", "EchoDust", "BurntScrap"];
const STORAGE_UPGRADE_BASE_COST = 120;
const STORAGE_UPGRADE_STEP = 50;
const MINER_TURBO_SPEED_BONUS = 0.03;
const MINER_TURBO_BASE_COST = { Scrap: 50, Gears: 100 };
const MINER_TURBO_COST_STEP = { Scrap: 25, Gears: 150 };
const MINER_TURBO_HEAT_BONUS = 0.015;
const SMELTER_FURNACE_BASE_COST = { Gears: 50, Circuits: 100 };
const SMELTER_FURNACE_COST_STEP = { Gears: 25, Circuits: 150 };
const SMELTER_FURNACE_HEAT_BONUS = 0.005;
const SMELTER_EXTRA_CHANCE_STEP = 0.10;
const SMELTER_MAX_CHANCE = 1;
const SMELTER_BASE_EXTRA_CYCLE_INTERVAL = 10;
const SMELTER_MIN_EXTRA_CYCLE_INTERVAL = 1;
const SMELTER_WASTE_PER_CYCLE = 0.1;
const SMELTER_MAX_CHANCE_LEVEL = 1 + Math.ceil(SMELTER_MAX_CHANCE / SMELTER_EXTRA_CHANCE_STEP);
const SMELTER_MAX_LEVEL = SMELTER_MAX_CHANCE_LEVEL + (SMELTER_BASE_EXTRA_CYCLE_INTERVAL - SMELTER_MIN_EXTRA_CYCLE_INTERVAL);
const ASH_UPGRADE_BASE_COST = 50;
const ASH_UPGRADE_COST_STEP = 25;
const ASH_UPGRADE_SPEED_BONUS = 0.25;
const ASH_UPGRADE_HEAT_BONUS = 0.05;
const FINAL_GODCOIN_TARGET = 1000;
const GRID_DIRT_CLEAN_COST = 500;
const GRID_DIRT_BURNT_AMOUNT = 500;

function getGridWidth() {
  return Math.max(3, Math.min(12, state.gridWidth || 3));
}

function getGridRows() {
  return Math.ceil(state.gridSlots / getGridWidth());
}

function getGridDirtChance() {
  const cap = state.storageCap || 0;
  if (cap <= 0) return 0.01;
  const used = Math.min(cap, bnToNumber(getStorageUsedBn()));
  const freeRatio = Math.max(0, (cap - used) / cap);
  const burntStored = Math.max(0, bnToNumber(state.totals?.BurntScrap || { m: 0, e: 0 }));
  const burntPct = Math.min(1, burntStored / cap);
  return Math.min(1, 0.01 + freeRatio * burntPct);
}

function maybeDirtyGridTile(tile) {
  if (!tile) return false;
  const chance = getGridDirtChance();
  if (Math.random() >= chance) return false;
  tile.dirty = true;
  tile.dirtyBurntScrap = GRID_DIRT_BURNT_AMOUNT;
  return true;
}

function isAutomationUnlocked() {
  return !!state.unlocks.Printer;
}

function syncGridWidth() {
  const target = Math.max(3, Math.min(12, Math.ceil(Math.sqrt(state.gridSlots))));
  state.gridWidth = target;
}

function buildGrid() {
  gridEl.style.gridTemplateColumns = `repeat(${getGridWidth()}, 1fr)`;
  gridEl.innerHTML = "";
  state.grid.forEach((tile, index) => {
    const cell = document.createElement("div");
    cell.className = "tile";
    cell.dataset.index = index;
    const cables = {};
    ["up", "right", "down", "left"].forEach(dir => {
      const line = document.createElement("span");
      line.className = `cable-line ${dir}`;
      line.style.opacity = 0;
      line.style.setProperty("--cable-color", "transparent");
      cables[dir] = line;
      cell.appendChild(line);
    });
    const label = document.createElement("div");
    label.className = "label";
    const heat = document.createElement("div");
    heat.className = "heat";
    const progress = document.createElement("div");
    progress.className = "progress";
    const bar = document.createElement("div");
    bar.className = "bar";
    progress.appendChild(bar);
    const transfer = document.createElement("div");
    transfer.className = "transfer";
    cell.appendChild(label);
    cell.appendChild(heat);
    cell.appendChild(progress);
    cell.appendChild(transfer);
    cell._label = label;
    cell._heat = heat;
    cell._progress = progress;
    cell._bar = bar;
    cell._transfer = transfer;
    cell._cableLines = cables;
    cell.addEventListener("click", () => handleTileClick(index));
    cell.addEventListener("contextmenu", (event) => handleTileContext(index, event));
    gridEl.appendChild(cell);
  });
  buildNeighborCache();
}

function buildNeighborCache() {
  const width = getGridWidth();
  const rows = getGridRows();
  const neighbors = [];
  for (let index = 0; index < state.gridSlots; index++) {
    const x = index % width;
    const y = Math.floor(index / width);
    const list = [];
    if (x > 0) list.push({ index: index - 1, dir: "left" });
    if (x < width - 1 && index + 1 < state.gridSlots) list.push({ index: index + 1, dir: "right" });
    if (y > 0) list.push({ index: index - width, dir: "up" });
    if (y < rows - 1 && index + width < state.gridSlots) list.push({ index: index + width, dir: "down" });
    neighbors[index] = list;
  }
  state.neighbors = neighbors;
}

function getFanCount() {
  return state.cooling?.fans || 0;
}

function getFanLimit() {
  return Math.ceil(state.gridSlots / 3);
}

function getFanCost(fanCount = getFanCount()) {
  const cost = {
    Scrap: FAN_BASE_COST + FAN_COST_STEP * fanCount
  };
  if (fanCount >= 5) cost.Gears = FAN_TIER_BASE + FAN_COST_STEP * (fanCount - 5);
  if (fanCount >= 10) cost.Circuits = FAN_TIER_BASE + FAN_COST_STEP * (fanCount - 10);
  if (fanCount >= 15) cost.AICores = FAN_TIER_BASE + FAN_COST_STEP * (fanCount - 15);
  if (fanCount >= 20) cost.RealityShards = FAN_TIER_BASE + FAN_COST_STEP * (fanCount - 20);
  return cost;
}

function getFanTierIndex(fanCount = getFanCount()) {
  return getFanTierIndexFromCount(fanCount);
}

function getFanTierResource(fanCount = getFanCount()) {
  const tier = getFanTierIndex(fanCount);
  return ["Scrap", "Gears", "Circuits", "AICores", "RealityShards"][tier] || "Scrap";
}

function ensureFanOverclockState() {
  if (typeof state.fanOverclockTier !== "number") state.fanOverclockTier = getFanTierIndex();
  if (typeof state.fanOverclockTierCount !== "number") state.fanOverclockTierCount = 0;
}

function syncFanOverclockTier() {
  ensureFanOverclockState();
  const currentTier = getFanTierIndex();
  if (currentTier > state.fanOverclockTier) {
    state.fanOverclockTier = currentTier;
    state.fanOverclockTierCount = 0;
  }
}

function getFanOverclockBonusPct(fanCount = getFanCount()) {
  const tierIndex = getFanTierIndex(fanCount);
  const tierBonus = Math.max(0, tierIndex - 1);
  return FAN_OVERCLOCK_BASE_BONUS + FAN_OVERCLOCK_TIER_BONUS * tierBonus;
}

function addBurntScrap(amountNumber) {
  const amount = bnFromNumber(amountNumber);
  if (amount.m === 0) return;
  const cap = bnFromNumber(state.storageCap || 0);
  if (!state.storageUsed) state.storageUsed = getStorageUsedBn();
  if (bnCmp(state.storageUsed, cap) >= 0) return;
  let addAmount = amount;
  const room = bnSub(cap, state.storageUsed);
  if (bnCmp(addAmount, room) > 0) addAmount = room;
  const tile = state.grid[0];
  if (!tile) return;
  tile.localInv.BurntScrap = tile.localInv.BurntScrap || { m: 0, e: 0 };
  bnAddInPlace(tile.localInv.BurntScrap, addAmount);
  bnAddInPlace(state.storageUsed, addAmount);
  state.productionBuffer.BurntScrap = state.productionBuffer.BurntScrap || { m: 0, e: 0 };
  bnAddInPlace(state.productionBuffer.BurntScrap, addAmount);
  state.stats.lifetime.BurntScrap = state.stats.lifetime.BurntScrap || { m: 0, e: 0 };
  bnAddInPlace(state.stats.lifetime.BurntScrap, addAmount);
}

function getMinerLevel(tile) {
  if (!tile) return 1;
  return Math.max(1, tile.minerLevel || 1);
}

function getMinerSpeedMultiplier(tile) {
  const level = getMinerLevel(tile);
  return 1 + MINER_TURBO_SPEED_BONUS * Math.max(0, level - 1);
}

function getMinerHeatMultiplier(tile) {
  const level = getMinerLevel(tile);
  return Math.pow(1 + MINER_TURBO_HEAT_BONUS, Math.max(0, level - 1));
}

function getMinerTurboCost(tile) {
  const level = getMinerLevel(tile);
  const cost = {};
  Object.entries(MINER_TURBO_BASE_COST).forEach(([res, amt]) => {
    const step = MINER_TURBO_COST_STEP[res] || 0;
    cost[res] = amt + step * Math.max(0, level - 1);
  });
  return cost;
}

function getSmelterLevel(tile) {
  if (!tile) return 1;
  return Math.max(1, tile.smelterLevel || 1);
}

function getSmelterHeatMultiplier(tile) {
  const level = getSmelterLevel(tile);
  return Math.pow(1 + SMELTER_FURNACE_HEAT_BONUS, Math.max(0, level - 1));
}

function getSmelterFurnaceCost(tile) {
  const level = getSmelterLevel(tile);
  const cost = {};
  Object.entries(SMELTER_FURNACE_BASE_COST).forEach(([res, amt]) => {
    const step = SMELTER_FURNACE_COST_STEP[res] || 0;
    cost[res] = amt + step * Math.max(0, level - 1);
  });
  if (level >= SMELTER_MAX_CHANCE_LEVEL) {
    cost.AICores = 10 * level;
  }
  return cost;
}

function getSmelterExtraChance(tile) {
  const level = getSmelterLevel(tile);
  return Math.min(SMELTER_MAX_CHANCE, SMELTER_EXTRA_CHANCE_STEP * Math.max(0, level - 1));
}

function getSmelterExtraCycleInterval(tile) {
  const level = getSmelterLevel(tile);
  if (level <= SMELTER_MAX_CHANCE_LEVEL) return SMELTER_BASE_EXTRA_CYCLE_INTERVAL;
  const reduction = level - SMELTER_MAX_CHANCE_LEVEL;
  return Math.max(SMELTER_MIN_EXTRA_CYCLE_INTERVAL, SMELTER_BASE_EXTRA_CYCLE_INTERVAL - reduction);
}

function applySmelterCycleEffects(tile) {
  if (!tile || isTilePaused(tile)) return;
  const level = getSmelterLevel(tile);
  const waste = SMELTER_WASTE_PER_CYCLE * level;
  if (waste > 0) addBurntScrap(waste);
  tile.smelterCycleCount = (tile.smelterCycleCount || 0) + 1;
  const interval = getSmelterExtraCycleInterval(tile);
  if (tile.smelterCycleCount < interval) return;
  tile.smelterCycleCount -= interval;
  const chance = getSmelterExtraChance(tile);
  if (chance > 0 && Math.random() < chance) {
    produceOutputs(tile, [{ res: "Gears", amt: 1 }], 1);
  }
}

function getAshLevel(tile) {
  if (!tile) return 1;
  return Math.max(1, tile.ashLevel || 1);
}

function getAshSpeedMultiplier(tile) {
  const level = getAshLevel(tile);
  return 1 + ASH_UPGRADE_SPEED_BONUS * Math.max(0, level - 1);
}

function getAshHeatMultiplier(tile) {
  const level = getAshLevel(tile);
  return Math.pow(1 + ASH_UPGRADE_HEAT_BONUS, Math.max(0, level - 1));
}

function getAshUpgradeCost(tile) {
  const level = getAshLevel(tile);
  return { Circuits: ASH_UPGRADE_BASE_COST + ASH_UPGRADE_COST_STEP * Math.max(0, level - 1) };
}

function updateMinerWaste(tile, dt) {
  if (tile.building !== "Miner" || isTilePaused(tile)) return;
  if (!Number.isFinite(tile.minerWasteTimer)) tile.minerWasteTimer = 0;
  if (!Number.isFinite(tile.minerWasteInterval) || tile.minerWasteInterval <= 0) {
    tile.minerWasteInterval = 10 + Math.random() * 20;
  }
  tile.minerWasteTimer += dt;
  while (tile.minerWasteTimer >= tile.minerWasteInterval) {
    tile.minerWasteTimer -= tile.minerWasteInterval;
    tile.minerWasteInterval = 10 + Math.random() * 20;
    const minerLevel = getMinerLevel(tile);
    const amount = (1 + Math.floor(Math.random() * 3)) * minerLevel;
    addBurntScrap(amount);
    addLog("[MINE]", `Miner dredged ${amount} Burnt Scrap.`);
  }
}

function updateFanOverclockWaste(dt) {
  const bonus = (state.modifiers.fanCoolMultiplier || 1) - 1;
  if (bonus <= 0) return;
  const fanCount = getFanCount();
  if (fanCount <= 0) return;
  state.fanOverclockTimer = (state.fanOverclockTimer || 0) + dt;
  if (state.fanOverclockTimer < FAN_OVERCLOCK_WASTE_INTERVAL) return;
  state.fanOverclockTimer -= FAN_OVERCLOCK_WASTE_INTERVAL;
  const totalUpgrades = getUpgradeLevel("fan-overclock");
  if (totalUpgrades <= 0) return;
  const wasteAmount = fanCount * totalUpgrades * bonus;
  if (wasteAmount > 0) {
    addBurntScrap(wasteAmount);
    addLog("[FAN]", `Overclock waste: +${wasteAmount.toFixed(1)} Burnt Scrap.`);
  }
}

function getFanOverclockCost() {
  syncFanOverclockTier();
  const levelForCost = (state.fanOverclockTierCount || 0) + 1;
  const amount = FAN_OVERCLOCK_BASE_COST + FAN_OVERCLOCK_COST_STEP * levelForCost;
  return { [getFanTierResource()]: amount };
}

function isTileDisabled(tile) {
  return !!(tile && tile.disabledUntil && tile.disabledUntil > 0);
}

function getTileDisableRemainingMs(tile, now = Date.now()) {
  if (!isTileDisabled(tile)) return 0;
  return Math.max(0, tile.disabledUntil - now);
}

function isTilePaused(tile) {
  return isTileDisabled(tile) || !!tile.automationDisabled;
}

function updateContextMenu(index) {
  if (!contextToggleBtn) return;
  const tile = state.grid[index];
  if (!tile || !tile.building) {
    contextToggleBtn.textContent = "Power Toggle";
    contextToggleBtn.disabled = true;
    updateMinerContextMenu(null);
    updateSmelterContextMenu(null);
    updateAshContextMenu(null);
    return;
  }
  updateMinerContextMenu(tile);
  updateSmelterContextMenu(tile);
  updateAshContextMenu(tile);
  if (tile.automationDisabled) {
    contextToggleBtn.textContent = "Auto Disabled";
    contextToggleBtn.disabled = true;
    return;
  }
  if (isTileDisabled(tile)) {
    const remaining = getTileDisableRemainingMs(tile);
    if (remaining > 0) {
      contextToggleBtn.textContent = `Rebooting (${Math.ceil(remaining / 1000)}s)`;
      contextToggleBtn.disabled = true;
    } else {
      contextToggleBtn.textContent = "Power On";
      contextToggleBtn.disabled = false;
    }
    return;
  }
  contextToggleBtn.textContent = "Power Off";
  contextToggleBtn.disabled = false;
}

function updateMinerContextMenu(tile) {
  if (!contextMinerTurbo) return;
  if (!tile || tile.building !== "Miner") {
    contextMinerTurbo.style.display = "none";
    if (contextMinerInfo) {
      contextMinerInfo.textContent = "";
      contextMinerInfo.style.display = "none";
    }
    if (contextMinerCost) {
      contextMinerCost.textContent = "";
      contextMinerCost.style.display = "none";
    }
    return;
  }
  const level = getMinerLevel(tile);
  const speedPct = Math.round((getMinerSpeedMultiplier(tile) - 1) * 100);
  const cost = getMinerTurboCost(tile);
  const costText = Object.entries(cost).map(([res, amt]) => `${amt} ${res}`).join(", ");
  contextMinerTurbo.style.display = "";
  contextMinerTurbo.textContent = `Miner Turbo (L${level + 1})`;
  contextMinerTurbo.disabled = !canAfford(cost);
  if (contextMinerInfo) {
    contextMinerInfo.style.display = "";
    contextMinerInfo.textContent = `Level ${level} | Speed +${speedPct}% | Waste x${level}`;
  }
  if (contextMinerCost) {
    contextMinerCost.style.display = "";
    contextMinerCost.textContent = `Cost: ${costText}`;
  }
}

function updateSmelterContextMenu(tile) {
  if (!contextSmelterFurnace) return;
  if (!tile || tile.building !== "Smelter") {
    contextSmelterFurnace.style.display = "none";
    if (contextSmelterInfo) {
      contextSmelterInfo.textContent = "";
      contextSmelterInfo.style.display = "none";
    }
    if (contextSmelterCost) {
      contextSmelterCost.textContent = "";
      contextSmelterCost.style.display = "none";
    }
    return;
  }
  const level = getSmelterLevel(tile);
  const chancePct = Math.round(getSmelterExtraChance(tile) * 100);
  const heatPct = Math.round((getSmelterHeatMultiplier(tile) - 1) * 100);
  const interval = getSmelterExtraCycleInterval(tile);
  const wastePerCycle = (SMELTER_WASTE_PER_CYCLE * level).toFixed(2);
  const maxed = level >= SMELTER_MAX_LEVEL;
  const cost = maxed ? null : getSmelterFurnaceCost(tile);
  const costText = cost ? Object.entries(cost).map(([res, amt]) => `${amt} ${res}`).join(", ") : "--";
  contextSmelterFurnace.style.display = "";
  contextSmelterFurnace.textContent = maxed ? "Smelter Furnace (Max)" : `Smelter Furnace (L${level + 1})`;
  contextSmelterFurnace.disabled = maxed || !canAfford(cost);
  if (contextSmelterInfo) {
    contextSmelterInfo.style.display = "";
    contextSmelterInfo.textContent = `Level ${level} | Extra ${chancePct}%/${interval} cycles | Heat +${heatPct}% | Waste +${wastePerCycle}/cycle`;
  }
  if (contextSmelterCost) {
    contextSmelterCost.style.display = "";
    contextSmelterCost.textContent = `Cost: ${costText}`;
  }
}

function updateAshContextMenu(tile) {
  if (!contextAshUpgrade) return;
  if (!tile || tile.building !== "AshCleaner") {
    contextAshUpgrade.style.display = "none";
    if (contextAshInfo) {
      contextAshInfo.textContent = "";
      contextAshInfo.style.display = "none";
    }
    if (contextAshCost) {
      contextAshCost.textContent = "";
      contextAshCost.style.display = "none";
    }
    return;
  }
  const level = getAshLevel(tile);
  const speedPct = Math.round((getAshSpeedMultiplier(tile) - 1) * 100);
  const cost = getAshUpgradeCost(tile);
  const costText = Object.entries(cost).map(([res, amt]) => `${amt} ${res}`).join(", ");
  contextAshUpgrade.style.display = "";
  contextAshUpgrade.textContent = `Ash Cleaner Upgrade (L${level + 1})`;
  contextAshUpgrade.disabled = !canAfford(cost);
  if (contextAshInfo) {
    contextAshInfo.style.display = "";
    contextAshInfo.textContent = `Level ${level} | Speed +${speedPct}%`;
  }
  if (contextAshCost) {
    contextAshCost.style.display = "";
    contextAshCost.textContent = `Cost: ${costText}`;
  }
}

function updateFanContextMenu() {
  if (!fanOverclockBtn) return;
  const totalUpgrades = getUpgradeLevel("fan-overclock");
  const bonusPct = getFanOverclockBonusPct();
  if (fanOverclockDesc) {
    fanOverclockDesc.textContent = `Every 15s: +${Math.round(bonusPct * 100)}% Burnt Scrap per fan per upgrade.`;
  }
  if (fanOverclockCount) {
    fanOverclockCount.textContent = `Fan upgrades: ${totalUpgrades}`;
  }
  if (getFanCount() < FAN_OVERCLOCK_MIN_FANS) {
    fanOverclockBtn.textContent = `Fan Overclock (Need ${FAN_OVERCLOCK_MIN_FANS} fans)`;
    fanOverclockBtn.disabled = true;
    if (fanOverclockCost) fanOverclockCost.textContent = "Cost: --";
    return;
  }
  const cost = getFanOverclockCost();
  const costText = Object.entries(cost).map(([res, amt]) => `${amt} ${res}`).join(", ");
  fanOverclockBtn.textContent = "Fan Overclock";
  fanOverclockBtn.disabled = !canAfford(cost);
  if (fanOverclockCost) fanOverclockCost.textContent = `Cost: ${costText}`;
}

function updateStorageContextMenu() {
  if (!storageUpgradeBtn) return;
  const level = getStorageUpgradeLevel();
  const cost = getStorageUpgradeCost(level);
  const costText = Object.entries(cost).map(([res, amt]) => `${amt} ${res}`).join(", ");
  storageUpgradeBtn.textContent = `Storage Upgrade (L${level + 1})`;
  storageUpgradeBtn.disabled = !canAfford(cost);
  if (storageUpgradeCost) storageUpgradeCost.textContent = `Cost: ${costText}`;
  if (storageUpgradeDesc) storageUpgradeDesc.textContent = "Doubles storage capacity.";
  if (storageUpgradeLevel) storageUpgradeLevel.textContent = `Current level: ${level}`;
}

function cloneAutomationRule(rule, source) {
  if (!rule || !rule.condition || !rule.action) return null;
  return {
    id: createAutomationRuleId(),
    name: rule.name || "",
    condition: {
      left: { ...rule.condition.left },
      comparator: rule.condition.comparator,
      right: { ...rule.condition.right }
    },
    action: {
      type: rule.action.type,
      target: rule.action.target
    },
    source: source || rule.source
  };
}

function applyDefaultAutomationRules(tile, buildingKey) {
  if (!tile) return;
  const defaults = (state.buildingRuleDefaults && state.buildingRuleDefaults[buildingKey]) || [];
  tile.automationRules = [];
  defaults.forEach(rule => {
    const cloned = cloneAutomationRule(rule, `default:${buildingKey}`);
    if (cloned) tile.automationRules.push(cloned);
  });
}

function resetTileAutomation(tile) {
  if (!tile) return;
  tile.automationDisabled = false;
  tile.automationRules = [];
}

function handleTileContext(index, event) {
  event.preventDefault();
  const tile = state.grid[index];
  if (!tile.building) return;
  state.selectedTile = index;
  hideFanContextMenu();
  updateContextMenu(index);
  showContextMenu(event.clientX, event.clientY, index);
  if (typeof renderContextAutomation === "function" && isAutomationUnlocked()) {
    renderContextAutomation(index);
  }
}

function handleTileClick(index) {
  const tile = state.grid[index];
  if (tile.building) {
    state.selectedTile = index;
    return;
  }
  if (tile.dirty) {
    const cost = { Scrap: GRID_DIRT_CLEAN_COST };
    if (!canAfford(cost)) {
      addLog("[WARN]", `Grid slot clogged. Clean for ${GRID_DIRT_CLEAN_COST} Scrap.`);
      return;
    }
    spendCost(cost);
    tile.dirty = false;
    const burntAmount = tile.dirtyBurntScrap || GRID_DIRT_BURNT_AMOUNT;
    tile.dirtyBurntScrap = 0;
    addBurntScrap(burntAmount);
    addLog("[GRID]", `Grid slot cleaned. ${burntAmount} Burnt Scrap moved to storage.`);
    triggerBuildEffect(index);
    pulseLatestLog();
    return;
  }
  const buildingKey = state.selectedBuilding;
  if (!buildingKey) return;
  if (!state.unlocks[buildingKey]) return;
  const def = BUILDINGS[buildingKey];
  if (def.global) return;
  if (!canAfford(def.cost)) {
    addLog("[WARN]", "Not enough resources. The floor laughs.");
    return;
  }
  spendCost(def.cost);
  tile.building = buildingKey;
  if (buildingKey === "Portal") {
    state.portalBuilt = true;
  }
  tile.progress = 0;
  tile.disabledUntil = 0;
  tile.minerLevel = 1;
  tile.minerWasteTimer = 0;
  tile.minerWasteInterval = 0;
  tile.smelterLevel = 1;
  tile.smelterCycleCount = 0;
  tile.ashLevel = 1;
  resetTileAutomation(tile);
  applyDefaultAutomationRules(tile, buildingKey);
  addLog("[BUILD]", `Built ${def.name}.`);
  triggerBuildEffect(index);
  pulseLatestLog();
}

function removeBuilding(index) {
  const tile = state.grid[index];
  if (!tile || !tile.building) return;
  const name = BUILDINGS[tile.building]?.name || tile.building;
  tile.building = null;
  tile.progress = 0;
  tile.disabledUntil = 0;
  tile.minerLevel = 1;
  tile.minerWasteTimer = 0;
  tile.minerWasteInterval = 0;
  tile.smelterLevel = 1;
  tile.smelterCycleCount = 0;
  tile.ashLevel = 1;
  resetTileAutomation(tile);
  tile.localInv = {};
  tile.localInv.BurntScrap = tile.localInv.BurntScrap || { m: 0, e: 0 };
  bnAddInPlace(tile.localInv.BurntScrap, bnFromNumber(50));
  addLog("[REMOVE]", `Demolished ${name}.`);
  triggerBuildEffect(index);
  pulseLatestLog();
}

function toggleBuildingPower(index) {
  const tile = state.grid[index];
  if (!tile || !tile.building) return false;
  const name = BUILDINGS[tile.building]?.name || tile.building;
  const now = Date.now();
  if (isTileDisabled(tile)) {
    if (now < tile.disabledUntil) {
      const remaining = Math.ceil((tile.disabledUntil - now) / 1000);
      addLog("[POWER]", `${name} rebooting. ${remaining}s remaining.`);
      return false;
    }
    tile.disabledUntil = 0;
    addLog("[POWER]", `${name} back online.`);
    return true;
  }
  tile.disabledUntil = now + POWER_TOGGLE_COOLDOWN_MS;
  tile.visualSpeed = 0;
  tile.visualProgress = tile.progress;
  addLog("[POWER]", `${name} powered down. Restart available in 30s.`);
  return true;
}

function triggerEmergencyShutdown() {
  const now = Date.now();
  state.emergency = state.emergency || { cooldownUntil: 0, shutdownUntil: 0 };
  if (state.emergency.cooldownUntil && now < state.emergency.cooldownUntil) {
    const remaining = Math.ceil((state.emergency.cooldownUntil - now) / 1000);
    addLog("[EMERGENCY]", `Emergency cooldown ${remaining}s remaining.`);
    return false;
  }
  let any = false;
  const shutdownUntil = now + EMERGENCY_SHUTDOWN_MS;
  state.grid.forEach(tile => {
    if (!tile || !tile.building) return;
    tile.disabledUntil = Math.max(tile.disabledUntil || 0, shutdownUntil);
    tile.visualSpeed = 0;
    tile.visualProgress = tile.progress;
    any = true;
  });
  state.emergency.shutdownUntil = shutdownUntil;
  state.emergency.cooldownUntil = now + EMERGENCY_COOLDOWN_MS;
  addLog("[EMERGENCY]", any ? "Emergency shutdown engaged. Systems reboot in 60s." : "Emergency shutdown engaged. No buildings online.");
  return true;
}

function purchaseFanOverclock() {
  if (getFanCount() < FAN_OVERCLOCK_MIN_FANS) return false;
  const cost = getFanOverclockCost();
  if (!canAfford(cost)) return false;
  spendCost(cost);
  const bonus = getFanOverclockBonusPct();
  state.modifiers.fanCoolMultiplier = (state.modifiers.fanCoolMultiplier || 1) + bonus;
  state.fanOverclockTierCount = (state.fanOverclockTierCount || 0) + 1;
  state.upgrades["fan-overclock"] = getUpgradeLevel("fan-overclock") + 1;
  addLog("[UPGRADE]", `Fan Overclock applied. Cooling +${Math.round(bonus * 100)}%.`);
  triggerScreenReward("cool");
  pulseLatestLog();
  return true;
}

function upgradeMinerTurbo(index) {
  const tile = state.grid[index];
  if (!tile || tile.building !== "Miner") return false;
  const cost = getMinerTurboCost(tile);
  if (!canAfford(cost)) return false;
  spendCost(cost);
  tile.minerLevel = getMinerLevel(tile) + 1;
  addLog("[UPGRADE]", `Miner turbo upgraded to L${tile.minerLevel}.`);
  triggerScreenReward("good");
  pulseLatestLog();
  return true;
}

function upgradeSmelterFurnace(index) {
  const tile = state.grid[index];
  if (!tile || tile.building !== "Smelter") return false;
  if (getSmelterLevel(tile) >= SMELTER_MAX_LEVEL) return false;
  const cost = getSmelterFurnaceCost(tile);
  if (!canAfford(cost)) return false;
  spendCost(cost);
  tile.smelterLevel = getSmelterLevel(tile) + 1;
  addLog("[UPGRADE]", `Smelter furnace upgraded to L${tile.smelterLevel}.`);
  triggerScreenReward("good");
  pulseLatestLog();
  return true;
}

function upgradeAshCleaner(index) {
  const tile = state.grid[index];
  if (!tile || tile.building !== "AshCleaner") return false;
  const cost = getAshUpgradeCost(tile);
  if (!canAfford(cost)) return false;
  spendCost(cost);
  tile.ashLevel = getAshLevel(tile) + 1;
  addLog("[UPGRADE]", `Ash Cleaner upgraded to L${tile.ashLevel}.`);
  triggerScreenReward("good");
  pulseLatestLog();
  return true;
}

function canAfford(cost) {
  if (!cost) return true;
  for (const [res, amt] of Object.entries(cost)) {
    const available = state.totals[res] || { m: 0, e: 0 };
    if (bnCmp(available, bnFromNumber(amt)) < 0) return false;
  }
  return true;
}

function spendCost(cost) {
  for (const [res, amt] of Object.entries(cost)) {
    consumeResource(res, bnFromNumber(amt));
  }
}

function getUpgradeLevel(id) {
  return state.upgrades[id] || 0;
}

function getStorageUpgradeLevel() {
  return getUpgradeLevel("storage-silo");
}

function getStorageUpgradeCost(level = getStorageUpgradeLevel()) {
  const nextLevel = level + 1;
  const resources = STORAGE_UPGRADE_RESOURCES.slice(0, Math.min(nextLevel, STORAGE_UPGRADE_RESOURCES.length));
  const cost = {};
  resources.forEach((res, idx) => {
    const stagger = Math.max(0, nextLevel - 1 - idx);
    cost[res] = STORAGE_UPGRADE_BASE_COST + STORAGE_UPGRADE_STEP * stagger;
  });
  return cost;
}

function getUpgradeCost(upgrade) {
  if (upgrade.id === "storage-silo") {
    return getStorageUpgradeCost();
  }
  const level = getUpgradeLevel(upgrade.id);
  const multiplier = upgrade.repeatable ? (1 + level) : 1;
  const cost = {};
  Object.entries(upgrade.cost || {}).forEach(([res, amt]) => {
    cost[res] = Math.ceil(amt * multiplier);
  });
  return cost;
}

function purchaseUpgrade(id) {
  if (id === "fan-overclock") return purchaseFanOverclock();
  const upgrade = UPGRADE_LIST.find(u => u.id === id);
  if (!upgrade) return false;
  const level = getUpgradeLevel(id);
  if (!upgrade.repeatable && level > 0) return false;
  if (upgrade.minFans && getFanCount() < upgrade.minFans) return false;
  const cost = getUpgradeCost(upgrade);
  if (!canAfford(cost)) return false;
  spendCost(cost);
  upgrade.effect(state);
  state.upgrades[id] = level + 1;
  addLog("[UPGRADE]", `Upgrade installed: ${upgrade.name}.`);
  triggerScreenReward("good");
  pulseLatestLog();
  return true;
}

function consumeResource(res, amount) {
  let remaining = bnClone(amount);
  for (const tile of state.grid) {
    const inv = tile.localInv[res];
    if (!inv) continue;
    if (bnCmp(inv, remaining) >= 0) {
      tile.localInv[res] = bnSub(inv, remaining);
      const consumed = bnSub(amount, remaining);
      if (state.storageUsed) bnSubInPlace(state.storageUsed, consumed);
      return true;
    }
    remaining = bnSub(remaining, inv);
    tile.localInv[res] = { m: 0, e: 0 };
  }
  const consumed = bnSub(amount, remaining);
  if (state.storageUsed) bnSubInPlace(state.storageUsed, consumed);
  return bnCmp(remaining, { m: 0, e: 0 }) === 0;
}

function getNeighbors(index) {
  if (state.neighbors && state.neighbors[index]) return state.neighbors[index];
  const width = getGridWidth();
  const rows = getGridRows();
  const x = index % width;
  const y = Math.floor(index / width);
  const neighbors = [];
  if (x > 0) neighbors.push({ index: index - 1, dir: "left" });
  if (x < width - 1 && index + 1 < state.gridSlots) neighbors.push({ index: index + 1, dir: "right" });
  if (y > 0) neighbors.push({ index: index - width, dir: "up" });
  if (y < rows - 1 && index + width < state.gridSlots) neighbors.push({ index: index + width, dir: "down" });
  return neighbors;
}

function wantsResource(tile, res) {
  if (!tile.building) return false;
  const def = BUILDINGS[tile.building];
  return def.inputs.some(i => i.res === res);
}

function hasInputs(tile, inputs, modifier = 1) {
  return inputs.every(input => {
    const need = bnFromNumber(input.amt / modifier);
    const available = state.totals[input.res] || { m: 0, e: 0 };
    return bnCmp(available, need) >= 0;
  });
}

function consumeInputs(tile, inputs, modifier = 1) {
  inputs.forEach(input => {
    const need = bnFromNumber(input.amt / modifier);
    consumeResource(input.res, need);
  });
}

function getStorageUsedBn() {
  if (state.storageUsed) return bnClone(state.storageUsed);
  let total = { m: 0, e: 0 };
  state.grid.forEach(tile => {
    Object.values(tile.localInv).forEach(val => {
      if (val) total = bnAdd(total, val);
    });
  });
  return total;
}

function produceOutputs(tile, outputs, efficiency = 1) {
  outputs.forEach(output => {
    let amount = bnFromNumber(output.amt * efficiency);
    const cap = bnFromNumber(state.storageCap || 0);
    if (!state.storageUsed) state.storageUsed = getStorageUsedBn();
    if (bnCmp(state.storageUsed, cap) >= 0) return;
    const room = bnSub(cap, state.storageUsed);
    if (bnCmp(amount, room) > 0) amount = room;
    tile.localInv[output.res] = tile.localInv[output.res] || { m: 0, e: 0 };
    bnAddInPlace(tile.localInv[output.res], amount);
    bnAddInPlace(state.storageUsed, amount);
    bnAddInPlace(state.productionBuffer[output.res], amount);
    bnAddInPlace(state.stats.lifetime[output.res], amount);
    if (!state.settings.reducedMotion && Math.random() < 0.15) {
      spawnFloatOnTile(tile, `+${bnToString(amount)}`);
    }
  });
}

function spawnFloatOnTile(tile, text) {
  const index = state.grid.indexOf(tile);
  const cell = gridEl.children[index];
  if (!cell) return;
  const rect = cell.getBoundingClientRect();
  const float = document.createElement("div");
  float.className = "float";
  float.textContent = text;
  float.style.left = `${rect.left + rect.width / 2}px`;
  float.style.top = `${rect.top}px`;
  floatingLayer.appendChild(float);
  setTimeout(() => float.remove(), 1000);
}

function transferResources() {
  const frameStart = performance.now();
  const budgetMs = 4;
  for (let index = 0; index < state.grid.length; index++) {
    const tile = state.grid[index];
    if (!tile.building) continue;
    const entries = Object.entries(tile.localInv);
    for (let i = 0; i < entries.length; i++) {
      const res = entries[i][0];
      const amt = entries[i][1];
      if (bnCmp(amt, { m: 0, e: 0 }) <= 0) continue;
      const neighbors = getNeighbors(index);
      for (let n = 0; n < neighbors.length; n++) {
        const neighbor = neighbors[n];
        const targetTile = state.grid[neighbor.index];
        if (!targetTile.building || !wantsResource(targetTile, res)) continue;
        const transferAmt = bnFromNumber(1 + state.modifiers.transferBoost);
        if (bnCmp(tile.localInv[res], transferAmt) < 0) continue;
        tile.localInv[res] = bnSub(tile.localInv[res], transferAmt);
        targetTile.localInv[res] = targetTile.localInv[res] || { m: 0, e: 0 };
        bnAddInPlace(targetTile.localInv[res], transferAmt);
        tile.transferDir = neighbor.dir;
        tile.transferTime = 0.2;
        targetTile.transferDir = reverseDir(neighbor.dir);
        targetTile.transferTime = 0.2;
      }
      if (performance.now() - frameStart > budgetMs) {
        state.perfDrops = (state.perfDrops || 0) + 1;
        return;
      }
    }
  }
}

function reverseDir(dir) {
  return { left: "right", right: "left", up: "down", down: "up" }[dir];
}

function computeTotals() {
  const totals = {};
  let used = { m: 0, e: 0 };
  RESOURCE_LIST.forEach(r => { totals[r.key] = { m: 0, e: 0 }; });
  state.grid.forEach(tile => {
    for (const [res, amt] of Object.entries(tile.localInv)) {
      if (!totals[res]) totals[res] = { m: 0, e: 0 };
      bnAddInPlace(totals[res], amt);
      used = bnAdd(used, amt);
    }
  });
  state.totals = totals;
  state.storageUsed = used;
}

function checkStorageCap() {
  const cap = state.storageCap || 0;
  if (cap <= 0) return false;
  const used = getStorageUsedBn();
  if (bnCmp(used, bnFromNumber(cap)) >= 0) {
    state.gameOverReason = "storage";
    state.gameOver = true;
    addLog("[FAIL]", "Storage collapsed. Game over.");
    return true;
  }
  return false;
}

function checkHeatGameOver() {
  if (state.gameOver) return true;
  if (state.heat < 100) return false;
  state.gameOverReason = "heat";
  state.gameOver = true;
  addLog("[FAIL]", "Heat reached 100%. Game over.");
  return true;
}

function getBossDebuff() {
  if (!state.boss.active) return { speed: 1, heat: 1, disable: null };
  const debuff = state.boss.active.debuff || {};
  return {
    speed: debuff.speed || 1,
    heat: debuff.heat || 1,
    disable: debuff.disable || null
  };
}

function updateHeatAndGlitch(dt, debuff) {
  let heatDelta = 0;
  let cooling = 0;
  let counterCount = 0;
  const fanCoolBase = (BUILDINGS.Fan?.cool || 2) + (state.modifiers.fanCoolBonus || 0);
  const fanCool = fanCoolBase * (state.modifiers.fanCoolMultiplier || 1);
  const fanBonus = (state.cooling?.fans || 0) * fanCool;
  state.grid.forEach(tile => {
    if (!tile.building || isTilePaused(tile)) return;
    const def = BUILDINGS[tile.building];
    heatDelta += def.heat;
    if (def.support === "cooling" && !def.global) cooling += def.cool;
    if (def.support === "counter") counterCount += 1;
    if (tile.building === "Miner") heatDelta += def.heat * (getMinerHeatMultiplier(tile) - 1);
    if (tile.building === "Smelter") heatDelta += def.heat * (getSmelterHeatMultiplier(tile) - 1);
    if (tile.building === "AshCleaner") heatDelta += def.heat * (getAshHeatMultiplier(tile) - 1);
  });
  heatDelta -= (cooling + fanBonus);
  heatDelta *= debuff.heat;
  state.heat = Math.max(0, Math.min(100, state.heat + heatDelta * dt * 0.4));
  state.sabotage.counterIntel = counterCount;
}

function maybeMeltdown() {
  if (state.heat < 70) return;
  const resist = Math.min(0.8, state.modifiers.meltdownResist);
  const chance = ((state.heat - 70) / 30) * 0.03 * (1 - resist);
  if (Math.random() < chance) {
    const destroyed = 1 + Math.floor(Math.random() * 3);
    let destroyedCount = 0;
    for (let i = 0; i < destroyed; i++) {
      const candidates = state.grid.filter(tile => tile.building);
      if (!candidates.length) break;
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      target.building = null;
      target.progress = 0;
      target.localInv = {};
      target.disabledUntil = 0;
      destroyedCount += 1;
    }
    const burnt = bnFromNumber(destroyedCount * 5);
    state.grid[0].localInv.BurntScrap = state.grid[0].localInv.BurntScrap || { m: 0, e: 0 };
    bnAddInPlace(state.grid[0].localInv.BurntScrap, burnt);
    state.stats.meltdowns += 1;
    addLog("[MELT]", `Meltdown! ${destroyedCount} tiles vaporized. Burnt Scrap oozes out.`);
    if (state.settings.shake && !state.settings.reducedMotion) triggerShake();
  }
}

function applySabotage(dt) {
  state.sabotage.cooldown -= dt;
  state.sabotage.active = state.sabotage.active.filter(event => {
    event.time -= dt;
    return event.time > 0;
  });
  if (state.sabotage.cooldown <= 0) {
    const counterIntel = state.sabotage.counterIntel || 0;
    const chance = Math.max(0.1, 0.35 - counterIntel * 0.05);
    if (Math.random() < chance) {
      const event = spawnSabotage(counterIntel);
      state.sabotage.active.push(event);
      state.sabotage.cooldown = 80 + Math.random() * 40;
    }
  }
}

function spawnSabotage(counterIntel) {
  const types = ["power", "audit", "tax"];
  const type = types[Math.floor(Math.random() * types.length)];
  if (counterIntel > 0 && Math.random() < 0.3) {
    addLog("[COUNTER]", "Counter-Intel flips sabotage into a bonus.");
    return { type: "bonus", time: 12, speed: 1.2 };
  }
  if (type === "power") {
    addLog("[SAB]", "Power cut! Machines wheeze.");
    return { type: "power", time: 15, speed: 0.6 };
  }
  if (type === "audit") {
    const target = ["Smelter", "Assembler", "Printer"][Math.floor(Math.random() * 3)];
    addLog("[SAB]", `Audit disables ${target}s.`);
    return { type: "audit", time: 20, disable: target };
  }
  addLog("[SAB]", "Resource tax imposed. The suits feast.");
  return { type: "tax", time: 1, steal: 0.1 };
}

function getResourcePercent(res) {
  const cap = state.storageCap || 0;
  if (cap <= 0) return 0;
  const total = state.totals[res] || { m: 0, e: 0 };
  return (bnToNumber(total) / cap) * 100;
}

function checkPortalWin() {
  if (!state.gameWon) return false;
  if (winOverlayEl) winOverlayEl.classList.add("active");
  return true;
}

function buildAutomationSnapshot() {
  const buildingIndexMap = {};
  const buildingCounts = {};
  const allIndices = [];
  let totalBuildings = 0;
  state.grid.forEach((tile, index) => {
    if (!tile || !tile.building) return;
    totalBuildings += 1;
    allIndices.push(index);
    if (!buildingIndexMap[tile.building]) buildingIndexMap[tile.building] = [];
    buildingIndexMap[tile.building].push(index);
  });
  Object.keys(buildingIndexMap).forEach(key => {
    buildingCounts[key] = buildingIndexMap[key].length;
  });
  return { buildingIndexMap, buildingCounts, totalBuildings, allIndices };
}

function resolveAutomationValue(value, snapshot) {
  if (!value || typeof value !== "object") return 0;
  switch (value.type) {
    case "number":
      return Number(value.value) || 0;
    case "resource-percent":
      return getResourcePercent(value.resource);
    case "resource-value":
      return bnToNumber(state.totals[value.resource] || { m: 0, e: 0 });
    case "building-count":
      if (BUILDINGS[value.building]?.global) return state.cooling?.fans || 0;
      return snapshot.buildingCounts[value.building] || 0;
    case "any-building":
      return snapshot.totalBuildings > 0 ? 1 : 0;
    case "building-unlock":
      return state.unlocks[value.building] ? 1 : 0;
    default:
      return 0;
  }
}

function compareAutomationValues(left, comparator, right) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  switch (comparator) {
    case "<": return left < right;
    case "<=": return left <= right;
    case ">": return left > right;
    case ">=": return left >= right;
    case "=": return Math.abs(left - right) <= 0.0001;
    default: return false;
  }
}

function evaluateAutomationRule(rule, snapshot) {
  if (!rule || !rule.condition) return false;
  const left = resolveAutomationValue(rule.condition.left, snapshot);
  const right = resolveAutomationValue(rule.condition.right, snapshot);
  return compareAutomationValues(left, rule.condition.comparator, right);
}

function getAutomationTargets(action, snapshot, tileIndex) {
  if (!action) return [];
  if (action.target === "self") {
    if (!Number.isFinite(tileIndex)) return [];
    const tile = state.grid[tileIndex];
    if (!tile || !tile.building) return [];
    return [tileIndex];
  }
  if (action.target === "Any") return snapshot.allIndices;
  return snapshot.buildingIndexMap[action.target] || [];
}

function getAutomationBuildTarget(action, tileIndex) {
  if (!action) return null;
  if (action.target === "self") {
    const tile = state.grid[tileIndex];
    return tile && tile.building ? tile.building : null;
  }
  return action.target;
}

function applyAutomation() {
  if (!isAutomationUnlocked()) {
    state.grid.forEach(tile => {
      if (tile) tile.automationDisabled = false;
    });
    return;
  }
  const rules = state.rules || [];
  const snapshot = buildAutomationSnapshot();
  const powerState = {};
  const destroyTargets = new Set();
  const buildTargets = [];
  let order = 0;
  const markPower = (indices, disabled) => {
    indices.forEach(index => {
      if (!powerState[index] || order >= powerState[index].order) {
        powerState[index] = { disabled, order };
      }
    });
  };
  const handleRule = (rule, tileIndex) => {
    if (!rule || !rule.action) {
      order += 1;
      return;
    }
    if (!evaluateAutomationRule(rule, snapshot)) {
      order += 1;
      return;
    }
    const type = rule.action.type;
    if (type === "power-off" || type === "power-on") {
      const targets = getAutomationTargets(rule.action, snapshot, tileIndex);
      markPower(targets, type === "power-off");
    } else if (type === "destroy") {
      const targets = getAutomationTargets(rule.action, snapshot, tileIndex);
      targets.forEach(index => destroyTargets.add(index));
    } else if (type === "build") {
      const target = getAutomationBuildTarget(rule.action, tileIndex);
      if (target && BUILDINGS[target] && !BUILDINGS[target].global) buildTargets.push(target);
    }
    order += 1;
  };
  rules.forEach(rule => handleRule(rule, null));
  state.grid.forEach((tile, index) => {
    const localRules = tile.automationRules || [];
    localRules.forEach(rule => handleRule(rule, index));
  });
  state.grid.forEach((tile, index) => {
    if (!tile) return;
    const entry = powerState[index];
    tile.automationDisabled = entry ? entry.disabled : false;
  });
  destroyTargets.forEach(index => {
    if (state.grid[index] && state.grid[index].building) {
      removeBuilding(index);
    }
  });
  buildTargets.forEach(target => autoBuild(target));
}

function ensureFinalContract() {
  if (!state.portalBuilt || state.gameWon) return false;
  const have = bnToNumber(state.stats.lifetime.Godcoins || { m: 0, e: 0 });
  const current = Math.min(FINAL_GODCOIN_TARGET, Math.floor(have));
  const progress = Math.min(1, current / FINAL_GODCOIN_TARGET);
  const finalContract = state.contract.final || {
    type: "final",
    resource: "Godcoins",
    amount: FINAL_GODCOIN_TARGET,
    progress: 0,
    current: 0
  };
  finalContract.amount = FINAL_GODCOIN_TARGET;
  finalContract.current = current;
  finalContract.progress = progress;
  state.contract.final = finalContract;
  state.contract.active = finalContract;
  if (progress >= 1) {
    state.gameWon = true;
    addLog("[WIN]", "1000 Godcoins minted. The portal crowns your run.");
    if (winOverlayEl) winOverlayEl.classList.add("active");
  }
  return true;
}

function applyContracts(dt) {
  if (processTutorialContracts()) return;
  if (ensureFinalContract()) return;
  state.contract.cooldown -= dt;
  if (!state.contract.active && state.contract.cooldown <= 0) {
    state.contract.active = generateContract();
    state.contract.cooldown = 60;
  }
  if (state.contract.active) {
    const c = state.contract.active;
    if (c.type === "deliver") {
      const have = state.totals[c.resource] || { m: 0, e: 0 };
      c.progress = Math.min(1, bnToNumber(have) / c.amount);
      if (bnCmp(have, bnFromNumber(c.amount)) >= 0) {
        completeContract();
      }
    }
    if (c.type === "research") {
      c.progress = state.research[c.nodeId] ? 1 : 0;
      if (c.progress >= 1) completeContract();
    }
    if (c.type === "heat") {
      if (state.heat >= c.min && state.heat <= c.max) c.progress += dt;
      c.progressRatio = Math.min(1, c.progress / c.duration);
      if (c.progress >= c.duration) completeContract();
    }
  }
}

function getContractBuildCount(target) {
  if (target === "Fan") return state.cooling?.fans || 0;
  return state.grid.reduce((sum, tile) => sum + (tile.building === target ? 1 : 0), 0);
}

function processTutorialContracts() {
  const tutorial = state.contract?.tutorial;
  if (!Array.isArray(tutorial) || tutorial.length === 0) return false;
  let anyActive = false;
  tutorial.forEach(contract => {
    if (!contract || contract.completed) return;
    anyActive = true;
    if (contract.type !== "build") return;
    const count = getContractBuildCount(contract.building);
    contract.progress = Math.min(contract.count, count);
    if (count >= contract.count) {
      contract.completed = true;
      expandGrid(contract.rewardSlots || 0);
      addLog("[CONTRACT]", `Tutorial complete: ${contract.title}. +${contract.rewardSlots || 0} grid slots.`);
      triggerScreenReward("good");
      pulseLatestLog();
      state.stats.contractsCompleted += 1;
      state.stats.currentStreak += 1;
      state.stats.bestContractStreak = Math.max(state.stats.bestContractStreak, state.stats.currentStreak);
    }
  });
  return anyActive;
}

function generateContract() {
  const maxGrid = 12;
  const resource = getContractResource();
  const amount = getContractAmount(resource);
  const time = 80 + Math.ceil(state.gridSlots / 3) * 6;
  const maxSlots = maxGrid * maxGrid;
  const preferGrid = state.gridSlots < 25 || Math.random() < 0.6;
  const reward = state.gridSlots < maxSlots && preferGrid ? "grid" : "multiplier";
  const nextResearch = getNextResearchTarget();
  if (nextResearch && (state.stats.contractsCompleted < 4 || Math.random() < 0.5)) {
    return {
      type: "research",
      nodeId: nextResearch.id,
      nodeName: nextResearch.name,
      time: 160,
      progress: 0,
      reward,
      guide: `Research "${nextResearch.name}" to keep the factory evolving.`
    };
  }
  if (reward === "grid") {
    return { type: "deliver", resource, amount, time, progress: 0, reward, guide: "Deliver resources to expand your grid." };
  }
  return {
    type: "heat",
    min: 30,
    max: 70,
    duration: 60,
    progress: 0,
    time,
    reward,
    guide: "Stabilize heat bands to earn a permanent multiplier."
  };
}

function getNextResearchTarget() {
  return RESEARCH_NODES.find(node => {
    if (state.research[node.id]) return false;
    if (!node.prereq.every(req => state.research[req])) return false;
    if (node.requiresUnlock && !state.unlocks[node.requiresUnlock]) return false;
    return true;
  });
}

function completeContract() {
  const c = state.contract.active;
  if (!c) return;
  state.contract.active = null;
  state.contract.cooldown = 60;
  if (c.reward === "grid" && state.gridSlots < 144) {
    expandGrid(2);
    addLog("[CONTRACT]", "Contract complete: +2 grid slots.");
  } else {
    state.modifiers.globalSpeed *= 1.05;
    addLog("[CONTRACT]", "Contract complete: permanent multiplier applied.");
  }
  state.stats.contractsCompleted += 1;
  state.stats.currentStreak += 1;
  state.stats.bestContractStreak = Math.max(state.stats.bestContractStreak, state.stats.currentStreak);
  triggerScreenReward("good");
  pulseLatestLog();
}

function expandGrid(add) {
  const maxSlots = 144;
  state.gridSlots = Math.min(maxSlots, state.gridSlots + add);
  while (state.grid.length < state.gridSlots) state.grid.push(createTile());
  if (state.grid.length > state.gridSlots) state.grid = state.grid.slice(0, state.gridSlots);
  syncGridWidth();
  buildGrid();
}

function buyGridSlot() {
  const maxSlots = 144;
  if (!state.unlocks.BuySlot) {
    addLog("[WARN]", "Basic Logistics required to buy grid slots.");
    return false;
  }
  if (state.gridSlots >= maxSlots) return false;
  const cost = { Scrap: 150, Gears: 20 };
  if (!canAfford(cost)) return false;
  spendCost(cost);
  state.gridSlots = Math.min(maxSlots, state.gridSlots + 1);
  const tile = createTile();
  const dirtied = maybeDirtyGridTile(tile);
  state.grid.push(tile);
  syncGridWidth();
  buildGrid();
  addLog("[GRID]", "Purchased +1 grid slot.");
  if (dirtied) {
    addLog("[GRID]", `New grid slot clogged with ${GRID_DIRT_BURNT_AMOUNT} Burnt Scrap. Clean for ${GRID_DIRT_CLEAN_COST} Scrap.`);
  }
  triggerBuildEffect(state.grid.length - 1);
  triggerScreenReward("good");
  pulseLatestLog();
  return true;
}

function buyGlobalSupport(key) {
  const def = BUILDINGS[key];
  if (!def || !def.global) return false;
  if (key === "Fan") {
    const fanCount = getFanCount();
    const limit = getFanLimit();
    if (fanCount >= limit) {
      addLog("[WARN]", `Fan limit reached (${limit}). Expand the grid to add more.`);
      return false;
    }
    const cost = getFanCost(fanCount);
    if (!canAfford(cost)) return false;
    spendCost(cost);
    state.cooling.fans += 1;
    syncFanOverclockTier();
  } else {
    if (!canAfford(def.cost)) return false;
    spendCost(def.cost);
  }
  addLog("[SUPPORT]", `${def.name} installed off-grid.`);
  triggerScreenReward("cool");
  pulseLatestLog();
  return true;
}

function getContractResource() {
  const pool = ["Scrap", "Gears", "Circuits", "AICores", "RealityShards", "TimelineInk", "Godcoins"];
  const available = pool.filter(res => bnCmp(state.stats.lifetime[res] || { m: 0, e: 0 }, bnFromNumber(1)) >= 0);
  if (available.length === 0) return "Scrap";
  return available[Math.floor(Math.random() * available.length)];
}

function getContractAmount(resource) {
  const total = state.totals[resource] || { m: 0, e: 0 };
  if (total.m === 0) return 100;
  const log10 = total.e + Math.log10(total.m);
  const tier = Math.max(2, Math.floor(log10) - 2);
  const base = Math.pow(10, tier);
  const scaled = base * Math.max(1, state.gridSlots / 9);
  return Math.round(Math.max(50, scaled));
}

function updateBoss(dt) {
  if (state.boss.active) {
    state.boss.active = null;
  }
}

function autoBuild(target, options = {}) {
  if (!state.unlocks[target]) return;
  const def = BUILDINGS[target];
  if (def.global) return;
  if (!canAfford(def.cost)) return;
  const emptyTiles = state.grid
    .map((t, i) => (!t.building && !t.dirty ? i : null))
    .filter(i => i !== null);
  if (!emptyTiles.length) return;
  const mode = options.mode || "random";
  const index = mode === "first" ? emptyTiles[0] : emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
  spendCost(def.cost);
  state.grid[index].building = target;
  if (target === "Portal") {
    state.portalBuilt = true;
  }
  state.grid[index].progress = 0;
  state.grid[index].disabledUntil = 0;
  state.grid[index].minerLevel = 1;
  state.grid[index].minerWasteTimer = 0;
  state.grid[index].minerWasteInterval = 0;
  state.grid[index].smelterLevel = 1;
  state.grid[index].smelterCycleCount = 0;
  state.grid[index].ashLevel = 1;
  resetTileAutomation(state.grid[index]);
  applyDefaultAutomationRules(state.grid[index], target);
  const logTag = options.logTag || "[RULE]";
  const logMessage = options.logMessage || `Auto-built ${def.name}.`;
  addLog(logTag, logMessage);
  triggerBuildEffect(index);
  if (options.pulse) pulseLatestLog();
  return true;
}

function autoPlaceBuild(target) {
  return autoBuild(target, {
    mode: "first",
    logTag: "[AUTO]",
    logMessage: `Auto-placed ${BUILDINGS[target]?.name || target}.`,
    pulse: true
  });
}

function applyAchievements() {
  ACHIEVEMENTS.forEach(achievement => {
    if (state.achievements[achievement.id]) return;
    if (achievement.check(state)) {
      state.achievements[achievement.id] = true;
      achievement.reward(state);
      addLog("[ACH]", `Achievement unlocked: ${achievement.name}.`);
    }
  });
}

function applyPerks() {
  if (!state.perk) return;
  const perk = TIMELINE_PERKS.find(p => p.id === state.perk);
  if (perk) perk.apply(state);
}

function checkAICoreCue() {
  if (!state.audio || state.audio.aiCoreCuePlayed) return;
  if (bnCmp(state.stats.lifetime.AICores, bnFromNumber(1)) < 0) return;
  state.audio.aiCoreCuePlayed = true;
  if (typeof playAICoreCue === "function") playAICoreCue();
}

function tick(dt) {
  if (state.gameOver) return;
  if (checkPortalWin()) return;
  state.playTime = (state.playTime || 0) + dt;
  const frameStart = performance.now();
  const budgetMs = 8;
  const outOfTime = () => performance.now() - frameStart > budgetMs;
  state.lastTickAt = performance.now();
  const effectiveDt = dt;
  state.throttleReactor = Math.max(0, state.throttleReactor - effectiveDt);
  state.labPriority = Math.max(0, state.labPriority - effectiveDt);

  const sabotageSpeed = state.sabotage.active.reduce((acc, event) => {
    if (event.type === "power") return acc * event.speed;
    if (event.type === "bonus") return acc * event.speed;
    return acc;
  }, 1);
  const auditDisable = state.sabotage.active.find(event => event.type === "audit");
  if (state.sabotage.active.some(e => e.type === "tax")) {
    RESOURCE_LIST.forEach(r => {
      if (r.key === "BurntScrap") return;
      const total = state.totals[r.key];
      if (bnCmp(total, { m: 0, e: 0 }) > 0) {
        consumeResource(r.key, bnMulNum(total, 0.1));
      }
    });
    state.sabotage.active = state.sabotage.active.filter(e => e.type !== "tax");
  }

  state.productionBuffer = state.productionBuffer || {};
  RESOURCE_LIST.forEach(r => {
    state.productionBuffer[r.key] = state.productionBuffer[r.key] || { m: 0, e: 0 };
  });

  const heatMultiplier = 1 + Math.min(state.heat, 60) / 60 * 0.5;
  const bossDebuff = getBossDebuff();

  for (let i = 0; i < state.grid.length; i++) {
    const tile = state.grid[i];
    if (!tile.building) {
      tile.visualSpeed = 0;
      tile.visualProgress = 0;
      if (outOfTime()) break;
      continue;
    }
    updateMinerWaste(tile, effectiveDt);
    const def = BUILDINGS[tile.building];
    if (isTilePaused(tile)) {
      tile.visualSpeed = 0;
      tile.visualProgress = tile.progress;
      if (outOfTime()) break;
      continue;
    }
    if (auditDisable && auditDisable.disable === tile.building) {
      tile.visualSpeed = 0;
      tile.visualProgress = tile.progress;
      if (outOfTime()) break;
      continue;
    }
    if (bossDebuff.disable && bossDebuff.disable === tile.building) {
      tile.visualSpeed = 0;
      tile.visualProgress = tile.progress;
      if (outOfTime()) break;
      continue;
    }
    let speed = def.speed * state.modifiers.globalSpeed * heatMultiplier * sabotageSpeed * bossDebuff.speed;
    if (state.modifiers.hyperEfficiency) {
      speed *= state.stats.lifetime.Godcoins.m > 0 ? 1.4 : 0.8;
    }
    if (tile.building === "Assembler") speed *= state.modifiers.assemblerSpeed;
    if (tile.building === "Miner") speed *= state.modifiers.minerSpeed * getMinerSpeedMultiplier(tile);
    if (tile.building === "Smelter") speed *= state.modifiers.smelterSpeed;
    if (tile.building === "AshCleaner") speed *= getAshSpeedMultiplier(tile);
    if (tile.building === "Reactor" && state.throttleReactor > 0) speed *= 0.6;
    if (tile.building === "Lab" && state.labPriority > 0) speed *= 1.2;

    if (!Number.isFinite(speed) || speed <= 0) {
      tile.visualSpeed = 0;
      tile.visualProgress = tile.progress;
      if (outOfTime()) break;
      continue;
    }
    if (def.support) {
      tile.visualSpeed = 0;
      tile.visualProgress = tile.progress;
      if (outOfTime()) break;
      continue;
    }
    if (def.inputs.length > 0 && !hasInputs(tile, def.inputs, tile.building === "Assembler" ? state.modifiers.assemblerEfficiency : 1)) {
      if (tile.building === "AshCleaner" && !isTilePaused(tile)) {
        tile.disabledUntil = Date.now() + POWER_TOGGLE_COOLDOWN_MS;
        addLog("[ASH]", "Ash Cleaner shut down: no Burnt Scrap.");
      }
      tile.visualSpeed = 0;
      tile.visualProgress = tile.progress;
      if (outOfTime()) break;
      continue;
    }

    tile.visualSpeed = speed;
    tile.progress += speed * effectiveDt;
    if (!Number.isFinite(tile.progress) || tile.progress <= 0) {
      tile.progress = 0;
      tile.visualProgress = 0;
      if (outOfTime()) break;
      continue;
    }
    const efficiency = def.efficiency * state.modifiers.efficiency;
    const cycles = Math.floor(tile.progress);
    if (cycles > 0 && def.inputs.length === 0) {
      produceOutputs(tile, def.outputs, efficiency * cycles);
      tile.progress -= cycles;
      tile.visualProgress = tile.progress;
      if (outOfTime()) break;
      continue;
    }
    const maxCycles = 500;
    let cycleCount = 0;
    while (tile.progress >= 1 && cycleCount < maxCycles) {
      if (def.inputs.length > 0) {
        const inputMod = tile.building === "Assembler" ? state.modifiers.assemblerEfficiency : 1;
        if (!hasInputs(tile, def.inputs, inputMod)) break;
        consumeInputs(tile, def.inputs, inputMod);
      }
      let outputEfficiency = efficiency;
      if (tile.building === "Assembler" && state.modifiers.assemblerChaos && Math.random() < 0.2) outputEfficiency *= 2;
      produceOutputs(tile, def.outputs, outputEfficiency);
      if (tile.building === "Smelter") applySmelterCycleEffects(tile);
      tile.progress -= 1;
      cycleCount += 1;
    }
    if (cycleCount === maxCycles && tile.progress >= 1) {
      tile.progress = tile.progress % 1;
    }
    tile.visualProgress = tile.progress;
    if (outOfTime()) break;
  }

  if (outOfTime()) {
    state.perfDrops = (state.perfDrops || 0) + 1;
    return;
  }

  transferResources();
  if (outOfTime()) {
    state.perfDrops = (state.perfDrops || 0) + 1;
    return;
  }
  computeTotals();
  applyAutomation();
  if (checkHeatGameOver()) return;
  if (checkStorageCap()) return;
  updateHeatAndGlitch(effectiveDt, bossDebuff);
  if (checkHeatGameOver()) return;
  maybeMeltdown();
  applySabotage(effectiveDt);
  applyContracts(effectiveDt);
  updateBoss(effectiveDt);
  applyAchievements();
  checkAICoreCue();
  handleAutoBlueprint();
  updateProductionRates(effectiveDt);
  checkMilestones();
  updateFanOverclockWaste(effectiveDt);
}

function updateProductionRates(dt) {
  state.productionTimer += dt;
  if (state.productionTimer >= 1) {
    RESOURCE_LIST.forEach(r => {
      const total = state.productionBuffer[r.key] || { m: 0, e: 0 };
      state.productionRates[r.key] = bnDivNum(total, state.productionTimer);
      state.productionBuffer[r.key] = { m: 0, e: 0 };
    });
    state.productionTimer = 0;
  }
}

function handleAutoBlueprint() {
  if (!state.modifiers.autoBlueprint) return;
  if (Math.random() < 0.1) autoBuild("Miner");
}

function checkMilestones() {
  if (!state.settings.fireworks) return;
  RESOURCE_LIST.forEach(r => {
    if (r.key === "EchoDust" && !state.unlocks.EchoDust) return;
    if (!state.milestoneNext[r.key]) return;
    const total = state.totals[r.key];
    const thresholdExp = state.milestoneNext[r.key];
    const threshold = bnPow10(thresholdExp);
    if (bnCmp(total, threshold) >= 0) {
      spawnFirework();
      state.milestoneNext[r.key] += 3;
    }
  });
}

function spawnFirework() {
  if (state.settings.reducedMotion) return;
  const firework = document.createElement("div");
  firework.className = "firework";
  firework.style.left = `${Math.random() * window.innerWidth}px`;
  firework.style.top = `${Math.random() * window.innerHeight * 0.5}px`;
  fireworksLayer.appendChild(firework);
  setTimeout(() => firework.remove(), 1000);
}

function triggerShake() {
  if (state.settings.reducedMotion) return;
  document.body.classList.add("shake");
  setTimeout(() => document.body.classList.remove("shake"), 350);
}

function getStage() {
  if (bnCmp(state.stats.lifetime.Godcoins, bnFromNumber(1e3)) >= 0) return "Factory is a paradox engine.";
  if (bnCmp(state.stats.lifetime.TimelineInk, bnFromNumber(1e4)) >= 0) return "Factory is a simulation within a simulation.";
  if (bnCmp(state.stats.lifetime.RealityShards, bnFromNumber(1e4)) >= 0) return "Factory became a planet-scale organism.";
  if (bnCmp(state.stats.lifetime.AICores, bnFromNumber(1e4)) >= 0) return "Factory grew neural tendrils.";
  return "Factory is awake and hungry.";
}
