function formatTimer(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function isAutomationUnlocked() {
  return !!state.unlocks.Printer;
}

function syncAutomationPanels() {
  if (!mainEl || !rightPanelEl) return;
  const unlocked = isAutomationUnlocked();
  rightPanelEl.style.display = unlocked ? "" : "none";
  mainEl.classList.toggle("automation-locked", !unlocked);
  if (automationAreaEl) automationAreaEl.style.display = unlocked ? "" : "none";
  if (contextAutomationEl) {
    contextAutomationEl.style.display = unlocked ? "" : "none";
    if (!unlocked) contextAutomationEl.innerHTML = "";
  }
}

function updateGameOverCard() {
  if (!gameOverTitleEl || !gameOverLine1El || !gameOverLine2El) return;
  const reason = state.gameOverReason || (state.gameOver ? "storage" : "");
  if (reason === "heat") {
    gameOverTitleEl.textContent = "Heat Critical";
    gameOverLine1El.textContent = "Heat reached 100%. The factory melts down.";
    gameOverLine2El.textContent = "Balance cooling before the core destabilizes.";
  } else {
    gameOverTitleEl.textContent = "Storage Collapse";
    gameOverLine1El.textContent = "Your vaults ruptured. The factory drowns in its own output.";
    gameOverLine2El.textContent = "Expand storage next run. Hoard smarter.";
  }
}

function renderStatus() {
  const lastLog = state.log && state.log.length ? state.log[0] : null;
  if (lastLog && lastLog.icon === "[ERR]") {
    statusEl.textContent = `Error: ${lastLog.text}`;
  } else {
    statusEl.textContent = `Systems steady. ${getStage()}`;
  }
  if (runTimerEl) {
    runTimerEl.textContent = `Time ${formatTimer(state.playTime)}`;
  }
  heatDisplayEl.textContent = `Heat: ${state.heat.toFixed(0)}%`;
  gridStatsEl.textContent = `(${getGridWidth()}x${getGridRows()} | ${state.gridSlots} slots)`;
  blueprintBtn.style.display = state.unlocks.BlueprintConsole ? "inline-flex" : "none";
  if (buySlotBtn) {
    const unlocked = !!state.unlocks.BuySlot;
    buySlotBtn.style.display = unlocked ? "" : "none";
    if (unlocked) {
      const slotCost = { Scrap: 150, Gears: 20 };
      const maxed = state.gridSlots >= 144;
      const canBuySlot = !maxed && canAfford(slotCost);
      const costEl = buySlotBtn.querySelector(".support-cost");
      if (costEl) {
        if (maxed) {
          costEl.innerHTML = `<span class="build-cost small">MAX</span>`;
        } else {
          costEl.innerHTML = `
            <span class="cost-item"><span class="res-icon res-Scrap">S</span><span class="res-amt">150</span></span>
            <span class="cost-item"><span class="res-icon res-Gears">G</span><span class="res-amt">20</span></span>
          `;
        }
      }
      buySlotBtn.disabled = !canBuySlot;
    }
  }
  if (emergencyBtn) {
    const now = Date.now();
    const emergency = state.emergency || {};
    const cooldownRemaining = Math.max(0, (emergency.cooldownUntil || 0) - now);
    const shutdownRemaining = Math.max(0, (emergency.shutdownUntil || 0) - now);
    let valueText = "READY";
    if (shutdownRemaining > 0) {
      valueText = `OFF ${formatTimer(Math.ceil(shutdownRemaining / 1000))}`;
    } else if (cooldownRemaining > 0) {
      valueText = `COOLDOWN ${formatTimer(Math.ceil(cooldownRemaining / 1000))}`;
    }
    const valueEl = emergencyBtn.querySelector(".value");
    if (valueEl) valueEl.textContent = valueText;
    emergencyBtn.disabled = cooldownRemaining > 0;
    emergencyBtn.classList.toggle("cooldown", cooldownRemaining > 0);
  }
  if (fanCounterEl) {
    const fans = state.cooling?.fans || 0;
    const limit = getFanLimit();
    fanCounterEl.querySelector(".value").textContent = `${fans}/${limit}`;
  }
  if (storageCounterEl) {
    const used = getStorageUsedBn();
    storageCounterEl.querySelector(".value").textContent = `${bnToString(used)}/${state.storageCap}`;
  }
  if (heatEdgeEl) {
    const heat = Math.max(0, Math.min(100, state.heat));
    const intensity = heat < 50 ? 0 : Math.min(1, (heat - 50) / 50);
    heatEdgeEl.style.opacity = intensity.toFixed(2);
    heatEdgeEl.style.borderColor = `rgba(248,113,113,${0.3 + intensity * 0.5})`;
    heatEdgeEl.style.boxShadow = `0 0 ${24 + intensity * 30}px rgba(248,113,113,${0.25 + intensity * 0.5})`;
  }
  if (contextMenuEl && contextMenuEl.classList.contains("active")) {
    const index = parseInt(contextMenuEl.dataset.index || "", 10);
    if (Number.isFinite(index)) updateContextMenu(index);
  }
  if (fanContextMenuEl && fanContextMenuEl.classList.contains("active")) {
    updateFanContextMenu();
  }
  syncAutomationPanels();
  if (state.gameOver) updateGameOverCard();
}

function getResourceColor(res) {
  const colors = {
    Scrap: "#a3a3a3",
    Gears: "#f59e0b",
    Circuits: "#38bdf8",
    AICores: "#a855f7",
    RealityShards: "#34d399",
    TimelineInk: "#f472b6",
    Godcoins: "#fbbf24",
    EchoDust: "#22d3ee",
    BurntScrap: "#ef4444",
    Paradox: "#eab308"
  };
  return colors[res] || "";
}

const GRID_BUILDING_KEYS = Object.keys(BUILDINGS).filter(key => !BUILDINGS[key].global);
const ALL_BUILDING_KEYS = Object.keys(BUILDINGS);

function getResourceLabel(key) {
  return RESOURCE_LIST.find(r => r.key === key)?.label || key;
}

function getBuildingLabel(key) {
  return BUILDINGS[key]?.name || key;
}

function buildAutomationValueSpec(type, numberValue, resourceValue, buildingValue) {
  if (type === "number") {
    return { type: "number", value: Number(numberValue) || 0 };
  }
  if (type === "resource-percent") {
    return { type: "resource-percent", resource: resourceValue || "Scrap" };
  }
  if (type === "resource-value") {
    return { type: "resource-value", resource: resourceValue || "Scrap" };
  }
  if (type === "building-count") {
    return { type: "building-count", building: buildingValue || "Miner" };
  }
  if (type === "building-unlock") {
    return { type: "building-unlock", building: buildingValue || "Miner" };
  }
  if (type === "any-building") {
    return { type: "any-building" };
  }
  return { type: "number", value: 0 };
}

function formatAutomationValue(value) {
  if (!value || !value.type) return "0";
  if (value.type === "number") return `${Number(value.value) || 0}`;
  if (value.type === "resource-percent") return `${getResourceLabel(value.resource)} %`;
  if (value.type === "resource-value") return `${getResourceLabel(value.resource)} (exact)`;
  if (value.type === "building-count") {
    const suffix = BUILDINGS[value.building]?.global ? "installed" : "on grid";
    return `${getBuildingLabel(value.building)} ${suffix}`;
  }
  if (value.type === "any-building") return "Any building on grid";
  if (value.type === "building-unlock") return `${getBuildingLabel(value.building)} unlocked`;
  return "0";
}

function formatAutomationAction(action) {
  if (!action) return "No action";
  const actionLabel = {
    "power-off": "Power off",
    "power-on": "Power on",
    "destroy": "Destroy",
    "build": "Build"
  }[action.type] || action.type;
  let target = "";
  if (action.target === "self") target = "this building";
  else if (action.target === "Any") target = "any building";
  else if (action.target) target = getBuildingLabel(action.target);
  return target ? `${actionLabel} ${target}` : actionLabel;
}

function formatAutomationRule(rule) {
  const name = rule.name ? rule.name.trim() : "";
  const left = formatAutomationValue(rule.condition?.left);
  const right = formatAutomationValue(rule.condition?.right);
  const comparator = rule.condition?.comparator || "?";
  const text = `IF ${left} ${comparator} ${right} THEN ${formatAutomationAction(rule.action)}`;
  return { name, text, source: rule.source };
}

function buildComparatorOptions(selected) {
  const comparators = [
    { value: "<", label: "Less (<)" },
    { value: "=", label: "Equal (=)" },
    { value: ">", label: "More (>)" },
    { value: "<=", label: "Less or equal (<=)" },
    { value: ">=", label: "More or equal (>=)" }
  ];
  return comparators.map(c => `<option value="${c.value}" ${c.value === selected ? "selected" : ""}>${c.label}</option>`).join("");
}

function buildResourceOptions(selected) {
  return RESOURCE_LIST.map(r => `<option value="${r.key}" ${r.key === selected ? "selected" : ""}>${r.label}</option>`).join("");
}

function buildBuildingOptions(selected, options = {}) {
  const includeAny = !!options.includeAny;
  const includeSelf = !!options.includeSelf;
  const keys = options.keys || GRID_BUILDING_KEYS;
  const rows = [];
  if (includeSelf) rows.push({ value: "self", label: "This building" });
  if (includeAny) rows.push({ value: "Any", label: "Any building" });
  keys.forEach(key => rows.push({ value: key, label: getBuildingLabel(key) }));
  return rows.map(row => `<option value="${row.value}" ${row.value === selected ? "selected" : ""}>${row.label}</option>`).join("");
}

function getTierConnectionColor(def, neighborDef) {
  if (!def || !neighborDef) return null;
  const outputs = (def.outputs || []).map(o => o.res);
  const inputs = (def.inputs || []).map(i => i.res);
  const neighborOutputs = (neighborDef.outputs || []).map(o => o.res);
  const neighborInputs = (neighborDef.inputs || []).map(i => i.res);
  const forward = outputs.find(res => neighborInputs.includes(res));
  if (forward) return getResourceColor(forward);
  const reverse = neighborOutputs.find(res => inputs.includes(res));
  if (reverse) return getResourceColor(reverse);
  return null;
}

function setCableConnection(map, index, dir, color) {
  if (!map[index][dir]) map[index][dir] = color;
}

function markCableHorizontal(map, startIndex, endIndex, color) {
  for (let idx = startIndex; idx <= endIndex; idx += 1) {
    if (idx === startIndex) {
      setCableConnection(map, idx, "right", color);
    } else if (idx === endIndex) {
      setCableConnection(map, idx, "left", color);
    } else {
      setCableConnection(map, idx, "left", color);
      setCableConnection(map, idx, "right", color);
    }
  }
}

function markCableVertical(map, startIndex, endIndex, width, color) {
  for (let idx = startIndex; idx <= endIndex; idx += width) {
    if (idx === startIndex) {
      setCableConnection(map, idx, "down", color);
    } else if (idx === endIndex) {
      setCableConnection(map, idx, "up", color);
    } else {
      setCableConnection(map, idx, "up", color);
      setCableConnection(map, idx, "down", color);
    }
  }
}

function buildCableMap() {
  const map = state.grid.map(() => ({
    left: null, right: null, up: null, down: null
  }));
  const width = getGridWidth();
  const rows = getGridRows();
  const slots = state.gridSlots || state.grid.length;
  for (let index = 0; index < slots; index++) {
    const tile = state.grid[index];
    if (!tile || !tile.building || isTilePaused(tile)) continue;
    const def = BUILDINGS[tile.building];
    if (!def) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    const rowSlots = Math.min(width, slots - y * width);
    for (let nx = x + 1; nx < rowSlots; nx++) {
      const nIndex = y * width + nx;
      const nTile = state.grid[nIndex];
      if (!nTile) break;
      if (!nTile.building) continue;
      if (isTilePaused(nTile)) break;
      const nDef = BUILDINGS[nTile.building];
      const color = getTierConnectionColor(def, nDef);
      if (color) markCableHorizontal(map, index, nIndex, color);
      break;
    }
    for (let ny = y + 1; ny < rows; ny++) {
      const nIndex = ny * width + x;
      if (nIndex >= slots) break;
      const nTile = state.grid[nIndex];
      if (!nTile) break;
      if (!nTile.building) continue;
      if (isTilePaused(nTile)) break;
      const nDef = BUILDINGS[nTile.building];
      const color = getTierConnectionColor(def, nDef);
      if (color) markCableVertical(map, index, nIndex, width, color);
      break;
    }
  }
  return map;
}

function getDisplayProgress(tile, now) {
  const base = typeof tile.visualProgress === "number" ? tile.visualProgress : tile.progress;
  const speed = typeof tile.visualSpeed === "number" ? tile.visualSpeed : 0;
  const lastTick = state.lastTickAt || 0;
  if (!lastTick || speed <= 0) return Math.max(0, Math.min(1, base));
  const elapsed = Math.max(0, (now - lastTick) / 1000);
  const predicted = base + speed * elapsed;
  if (!Number.isFinite(predicted)) return Math.max(0, Math.min(1, base));
  return Math.max(0, Math.min(0.999, predicted));
}

function ensureTileElements(cell) {
  if (cell._label && cell._heat && cell._progress && cell._bar && cell._transfer && cell._cableLines) return;
  cell.innerHTML = "";
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
}

function renderGrid() {
  const now = performance.now();
  const cableMap = buildCableMap();
  Array.from(gridEl.children).forEach((cell, index) => {
    const tile = state.grid[index];
    if (!tile) return;
    ensureTileElements(cell);
    cell.classList.toggle("selected", state.selectedTile === index);
    const label = cell._label;
    const heat = cell._heat;
    const progress = cell._progress;
    const bar = cell._bar;
    const transfer = cell._transfer;
    const cableLines = cell._cableLines || {};
    const connections = cableMap[index] || {};
    const hasLeft = !!connections.left;
    const hasRight = !!connections.right;
    const hasUp = !!connections.up;
    const hasDown = !!connections.down;
    const applyLine = (dir, active, color, pass) => {
      const line = cableLines[dir];
      if (!line) return;
      if (pass) line.classList.add("pass");
      else line.classList.remove("pass");
      if (active) {
        line.style.opacity = 0.9;
        line.style.setProperty("--cable-color", color || "transparent");
      } else {
        line.style.opacity = 0;
        line.style.setProperty("--cable-color", "transparent");
      }
    };
    const isEmpty = !tile.building;
    const useHPass = isEmpty && hasLeft && hasRight;
    const useVPass = isEmpty && hasUp && hasDown;
    if (useHPass) {
      applyLine("left", true, connections.left || connections.right, true);
      applyLine("right", false, null, false);
    } else {
      applyLine("left", hasLeft, connections.left, false);
      applyLine("right", hasRight, connections.right, false);
    }
    if (useVPass) {
      applyLine("up", true, connections.up || connections.down, true);
      applyLine("down", false, null, false);
    } else {
      applyLine("up", hasUp, connections.up, false);
      applyLine("down", hasDown, connections.down, false);
    }
    if (!tile.building) {
      cell.classList.remove("disabled");
      cell.classList.remove("miner");
      cell.classList.remove("smelter");
      cell.classList.remove("assembler");
      cell.classList.remove("printer");
      cell.classList.remove("lab");
      cell.classList.remove("reactor");
      cell.classList.remove("portal");
      cell.classList.remove("cryo");
      cell.classList.remove("ash-cleaner");
      cell.style.setProperty("--tile-accent", "transparent");
      if (label) label.textContent = "Empty";
      if (heat) heat.textContent = "";
      if (progress) progress.style.display = "none";
      if (bar) bar.style.width = "0%";
      if (transfer) transfer.style.opacity = 0;
      cell.title = "Empty tile. Click to build.";
      return;
    }
    const def = BUILDINGS[tile.building];
    const autoDisabled = !!tile.automationDisabled;
    const disabled = isTilePaused(tile);
    cell.classList.toggle("disabled", disabled);
    cell.classList.toggle("miner", tile.building === "Miner");
    cell.classList.toggle("smelter", tile.building === "Smelter");
    cell.classList.toggle("assembler", tile.building === "Assembler");
    cell.classList.toggle("printer", tile.building === "Printer");
    cell.classList.toggle("lab", tile.building === "Lab");
    cell.classList.toggle("reactor", tile.building === "Reactor");
    cell.classList.toggle("portal", tile.building === "Portal");
    cell.classList.toggle("cryo", tile.building === "CryoPipe");
    cell.classList.toggle("ash-cleaner", tile.building === "AshCleaner");
    const minerLevel = tile.building === "Miner" ? getMinerLevel(tile) : 0;
    const smelterLevel = tile.building === "Smelter" ? getSmelterLevel(tile) : 0;
    const ashLevel = tile.building === "AshCleaner" ? getAshLevel(tile) : 0;
    const outputRes = def.outputs && def.outputs.length ? def.outputs[0].res : null;
    const outputColor = outputRes ? getResourceColor(outputRes)
      : (tile.building === "CryoPipe" ? "#ffffff" : tile.building === "AshCleaner" ? "#ef4444" : "transparent");
    cell.style.setProperty("--tile-accent", outputColor);
    const labelName = tile.building === "Miner"
      ? `${def.name} L${minerLevel}`
      : tile.building === "Smelter"
        ? `${def.name} L${smelterLevel}`
        : tile.building === "AshCleaner"
          ? `${def.name} L${ashLevel}`
          : def.name;
    if (label) label.textContent = disabled ? `${labelName} (${autoDisabled ? "AUTO" : "OFF"})` : labelName;
    const heatValue = disabled ? 0
      : (tile.building === "Miner"
        ? def.heat * getMinerHeatMultiplier(tile)
        : tile.building === "Smelter"
          ? def.heat * getSmelterHeatMultiplier(tile)
          : tile.building === "AshCleaner"
            ? def.heat * getAshHeatMultiplier(tile)
            : def.heat);
    const showHeatValue = (tile.building === "Miner" || tile.building === "Smelter" || tile.building === "AshCleaner")
      ? heatValue.toFixed(2)
      : heatValue;
    if (heat) heat.textContent = disabled ? "OFF" : (heatValue > 0 ? `+${showHeatValue}` : showHeatValue);
    if (progress) progress.style.display = "block";
    if (bar) {
      const displayProgress = getDisplayProgress(tile, now);
      bar.style.width = `${Math.min(100, displayProgress * 100)}%`;
    }
    if (transfer) transfer.style.opacity = 0;
    const invText = Object.entries(tile.localInv)
      .filter(([, val]) => bnCmp(val, { m: 0, e: 0 }) > 0)
      .map(([res, val]) => `${res}: ${bnToString(val)}`)
      .join(", ") || "Empty";
    let statusText = "Online";
    if (autoDisabled) {
      statusText = "AUTO OFF";
    } else if (disabled) {
      const remaining = getTileDisableRemainingMs(tile);
      statusText = remaining > 0 ? `OFF (${Math.ceil(remaining / 1000)}s)` : "OFF (ready)";
    }
    const levelText = tile.building === "Miner"
      ? `\nLevel: ${minerLevel}`
      : tile.building === "Smelter"
        ? `\nLevel: ${smelterLevel}`
        : tile.building === "AshCleaner"
          ? `\nLevel: ${ashLevel}`
          : "";
    cell.title = `${def.name}\nInputs: ${def.inputs.map(i => `${i.amt} ${i.res}`).join(", ") || "None"}` +
      `\nOutputs: ${def.outputs.map(o => `${o.amt} ${o.res}`).join(", ") || "None"}` +
      `\nSpeed: ${def.speed}/s  Efficiency: ${def.efficiency}` +
      `\nHeat: ${showHeatValue}` +
      levelText +
      `\nStatus: ${statusText}` +
      `\nInventory: ${invText}`;
  });
}

function renderPanels() {
  renderResources();
  renderContracts();
  renderBoss();
  if (isAutomationUnlocked()) {
    renderIfChanged("automation", getAutomationRenderKey(), renderAutomation);
  } else {
    renderCache.automation = "";
  }

  if (isTabActive("buildings")) {
    const counts = getBuildingCounts();
    renderIfChanged("buildings", getBuildingsRenderKey(counts), () => renderBuildings(counts));
  }
  if (isTabActive("research")) {
    renderIfChanged("research", getResearchRenderKey(), renderResearch);
  }
  if (isTabActive("achievements")) {
    renderIfChanged("achievements", getAchievementsRenderKey(), renderAchievements);
  }
  if (isTabActive("stats")) {
    renderIfChanged("stats", getStatsRenderKey(), renderStats);
  }
}

let lastStatusRender = 0;
let lastGridRender = 0;
let lastPanelRender = 0;
let lastFrameTime = 0;
const RENDER_INTERVALS = {
  status: 200,
  grid: 140,
  panels: 320
};

function render() {
  try {
    const now = performance.now();
    if (document.hidden) return;
    if (now - lastFrameTime < 12) return;
    lastFrameTime = now;
    if (now - lastStatusRender > RENDER_INTERVALS.status) {
      renderStatus();
      if (gameOverOverlayEl) {
        gameOverOverlayEl.classList.toggle("active", !!state.gameOver);
      }
      if (winOverlayEl) {
        winOverlayEl.classList.toggle("active", !!state.gameWon);
      }
      lastStatusRender = now;
    }
    if (now - lastGridRender > RENDER_INTERVALS.grid) {
      renderGrid();
      lastGridRender = now;
    }
    if (now - lastPanelRender > RENDER_INTERVALS.panels) {
      renderPanels();
      lastPanelRender = now;
    }
  } catch (err) {
    if (console && console.error) console.error("Render error", err);
    if (typeof logCrash === "function") logCrash("render", err);
  } finally {
    requestAnimationFrame(render);
  }
}

function getBuildingTooltip(def) {
  const outputRate = def.outputs.map(o => `${(o.amt * def.efficiency * def.speed).toFixed(2)}/s ${o.res}`).join(", ") || "None";
  return `${def.desc}` +
    `\nInputs: ${def.inputs.map(i => `${i.amt} ${i.res}`).join(", ") || "None"}` +
    `\nOutputs: ${def.outputs.map(o => `${o.amt} ${o.res}`).join(", ") || "None"}` +
    `\nOutput/s: ${outputRate}` +
    `\nSpeed: ${def.speed}/s  Efficiency: ${def.efficiency}` +
    `\nHeat: ${def.heat}`;
}

function renderResources() {
  if (!resourceBarEl) return;
  const colors = {
    Scrap: "#a3a3a3",
    Gears: "#f59e0b",
    Circuits: "#38bdf8",
    AICores: "#a855f7",
    RealityShards: "#34d399",
    TimelineInk: "#f472b6",
    Godcoins: "#fbbf24",
    EchoDust: "#22d3ee",
    BurntScrap: "#ef4444",
    Paradox: "#eab308"
  };
  const entries = [];
  RESOURCE_LIST.forEach(r => {
    if (r.key === "BurntScrap" && !state.unlocks.BurntTech && bnCmp(state.totals.BurntScrap || { m: 0, e: 0 }, { m: 0, e: 0 }) === 0) return;
    if (r.key === "EchoDust" && !state.unlocks.EchoDust && bnCmp(state.totals.EchoDust || { m: 0, e: 0 }, { m: 0, e: 0 }) === 0) return;
    entries.push({
      key: r.key,
      label: r.label,
      amount: state.totals[r.key] || { m: 0, e: 0 },
      rate: state.productionRates[r.key] || { m: 0, e: 0 }
    });
  });
  entries.push({
    key: "Paradox",
    label: "Paradox Tokens",
    amount: state.paradoxTokens || { m: 0, e: 0 },
    rate: { m: 0, e: 0 }
  });
  let maxE = null;
  entries.forEach(e => {
    if (!e.amount || e.amount.m === 0) return;
    if (maxE === null || e.amount.e > maxE) maxE = e.amount.e;
  });
  const weights = entries.map(e => {
    if (!e.amount || e.amount.m === 0 || maxE === null) return 0;
    const power = Math.pow(10, e.amount.e - maxE);
    return e.amount.m * power;
  });
  const totalWeight = weights.reduce((sum, v) => sum + v, 0);
  const distribution = [];
  const segments = entries.map((e, idx) => {
    if (totalWeight <= 0 || weights[idx] <= 0) return "";
    const ratio = weights[idx] / totalWeight;
    const width = (ratio * 100).toFixed(2);
    const amountText = bnToString(e.amount);
    const rateText = e.rate && e.rate.m ? ` (${bnToString(e.rate)}/s)` : "";
    const pctText = (ratio * 100).toFixed(1);
    distribution.push(
      `<span class="dist-item" style="--chip:${colors[e.key] || "#9ca3af"}">${e.label} (${amountText}) ${pctText}%</span>`
    );
    return `<div class=\"resource-seg\" style=\"--chip:${colors[e.key] || "#9ca3af"};width:${width}%\"></div>`;
  }).join("");
  const used = getStorageUsedBn();
  const capValue = state.storageCap || 0;
  const usedNum = bnToNumber(used);
  const ratio = capValue > 0 ? Math.min(1, usedNum / capValue) : 0;
  const widthPct = (ratio * 100).toFixed(1);
  resourceBarEl.innerHTML = `
    <div class="resource-stack" style="width:${widthPct}%">${segments}</div>
    <div class="resource-distribution">${distribution.join(" ")}</div>
  `;
  if (statLineEl) {
    const heatPct = Math.min(100, Math.max(0, state.heat)).toFixed(0);
    statLineEl.innerHTML = `Heat <strong>${heatPct}%</strong>`;
  }
}

function renderBuildings(counts) {
  const thumbs = {
    Miner: "images/miningdrill.webp",
    Smelter: "images/smelter.webp",
    Assembler: "images/assembler.webp",
    Printer: "images/printer.webp",
    Lab: "images/lab.webp",
    Reactor: "images/reactor.webp",
    Portal: "images/portal.webp",
    Fan: "images/fan.webp",
    CryoPipe: "images/cryo.webp",
    AshCleaner: "images/ash.webp"
  };
  const abbrev = {
    Scrap: "S",
    Gears: "G",
    Circuits: "C",
    AICores: "AI",
    RealityShards: "RS",
    TimelineInk: "TI",
    Godcoins: "GC",
    EchoDust: "ED",
    BurntScrap: "BS"
  };
  const resourceSources = {};
  Object.values(BUILDINGS).forEach(def => {
    (def.outputs || []).forEach(output => {
      if (!resourceSources[output.res]) resourceSources[output.res] = [];
      if (!resourceSources[output.res].includes(def.name)) resourceSources[output.res].push(def.name);
    });
  });
  const list = Object.keys(BUILDINGS).filter(key => state.unlocks[key]).map(key => {
    const def = BUILDINGS[key];
    const unlocked = true;
    const count = def.global ? (state.cooling?.fans || 0) : (counts[key] || 0);
    let cost = def.cost || {};
    let costText = Object.entries(cost).map(([res, amt]) => `${amt} ${res}`).join(", ") || "Free";
    let maxed = false;
    let afford = canAfford(cost);
    if (key === "Fan") {
      const limit = getFanLimit();
      maxed = count >= limit;
      if (maxed) {
        costText = `Max ${limit}`;
      } else {
        cost = getFanCost(count);
        costText = Object.entries(cost).map(([res, amt]) => `${amt} ${res}`).join(", ");
        afford = canAfford(cost);
      }
    }
    const costItems = Object.entries(cost || {}).map(([res, amt]) => {
      const sources = resourceSources[res] && resourceSources[res].length
        ? resourceSources[res].join(", ")
        : "Unknown source";
      const title = `${res} (Produced by ${sources})`;
      const label = abbrev[res] || res.slice(0, 2).toUpperCase();
      return `<span class="cost-item" title="${title}">
        <span class="res-icon res-${res}">${label}</span>
        <span class="res-amt">${amt}</span>
      </span>`;
    }).join("");
    let costLine = "";
    if (!unlocked) {
      costLine = `<span class="build-cost small">Locked</span>`;
    } else if (maxed) {
      costLine = `<span class="build-cost small">${costText}</span>`;
    } else if (!Object.keys(cost || {}).length) {
      costLine = `<span class="build-cost small">Free</span>`;
    } else {
      costLine = `<div class="cost-row">${costItems}</div>`;
    }
    const notEnough = unlocked && !maxed && !afford ? `<span class="build-warn small">Not enough material</span>` : "";
    const selected = state.selectedBuilding === key ? "selected" : "";
    const lockedClass = unlocked ? "" : "locked";
    const tooltip = getBuildingTooltip(def);
    const thumb = thumbs[key] || "";
    const thumbClass = thumb ? "has-thumb" : "no-thumb";
    const insuffClass = unlocked && !maxed && !afford ? "insufficient" : "";
    return `<button class="building-btn ${lockedClass} ${selected} ${insuffClass}" data-building="${key}" title="${tooltip}" ${maxed ? "disabled" : ""}>
      <div class="build-card">
        <div class="build-thumb ${thumbClass}" style="${thumb ? `--thumb:url('${thumb}')` : ""}"></div>
        <div class="build-body">
          <div class="build-title">${def.name}</div>
          <div class="build-desc small">${def.desc}</div>
          <div class="build-meta">
            ${costLine}
            ${notEnough}
          </div>
        </div>
        <div class="build-count">x${count}</div>
      </div>
    </button>`;
  }).join("");
  tabContents.buildings.innerHTML = `<div class="buildings-grid">${list}</div>`;
}

function renderResearch() {
  const basicLogisticsContractActive = state.contract?.active?.type === "research"
    && state.contract.active.nodeId === "basic-logistics";
  const html = ["<div class=\"list\">"];
  RESEARCH_NODES.forEach(node => {
    if (node.id === "basic-logistics" && !state.research[node.id] && !basicLogisticsContractActive) return;
    const purchased = state.research[node.id];
    const prereqMet = node.prereq.every(id => state.research[id]);
    const unlockOk = !node.requiresUnlock || state.unlocks[node.requiresUnlock];
    const costText = Object.entries(node.cost).map(([res, amt]) => `${amt} ${res}`).join(", ");
    let label = node.name;
    let meta = purchased ? "Purchased" : `Cost: ${costText}`;
    if (!unlockOk) meta = "Locked by Timeline Reboot";
    if (node.unstable && purchased) {
      const variant = state.research[node.id + "-variant"];
      label += ` (${variant?.name || "??"})`;
      meta = variant?.desc || meta;
    }
    const disabled = (!prereqMet || purchased || !unlockOk) ? "disabled" : "";
    html.push(`<div class="card">
      <div>
        <div><strong>${label}</strong></div>
        <div class="meta">${meta}</div>
      </div>
      <button class="btn secondary" data-research="${node.id}" ${disabled}>${purchased ? "Owned" : "Research"}</button>
    </div>`);
  });
  html.push("</div>");
  tabContents.research.innerHTML = html.join("");
  tabContents.research.querySelectorAll("button[data-research]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (handleResearch(btn.dataset.research)) {
        triggerRewardEffect(btn);
        pulseLatestLog();
      }
    });
  });
}

function handleResearch(id) {
  const node = RESEARCH_NODES.find(n => n.id === id);
  if (!node) return false;
  if (id === "basic-logistics") {
    const contract = state.contract?.active;
    const allowed = contract && contract.type === "research" && contract.nodeId === "basic-logistics";
    if (!allowed) return false;
  }
  if (state.research[id]) return false;
  if (!node.prereq.every(req => state.research[req])) return false;
  if (node.requiresUnlock && !state.unlocks[node.requiresUnlock]) return false;
  if (!canAfford(node.cost)) return false;
  spendCost(node.cost);
  state.research[id] = true;
  if (node.unstable) {
    const variant = node.variants[Math.floor(Math.random() * node.variants.length)];
    state.research[id + "-variant"] = variant;
    variant.apply(state);
    addLog("[MUTATE]", `Research mutated: ${variant.name}.`);
  } else {
    node.effect(state);
    addLog("[RESEARCH]", `Research complete: ${node.name}.`);
  }
  return true;
}

function renderAchievements() {
  const html = ACHIEVEMENTS.map(a => {
    const unlocked = state.achievements[a.id];
    return `<div class="card"><div><strong>${a.name}</strong><div class="meta">${a.desc}</div></div><div>${unlocked ? "Unlocked" : "Locked"}</div></div>`;
  }).join("");
  tabContents.achievements.innerHTML = `<div class="list">${html}</div>`;
}

function renderStats() {
  const stats = state.stats;
  const html = `
    <div class="list">
      <div class="card"><div>Lifetime Scrap</div><div>${bnToString(stats.lifetime.Scrap)}</div></div>
      <div class="card"><div>Lifetime Gears</div><div>${bnToString(stats.lifetime.Gears)}</div></div>
      <div class="card"><div>Lifetime Circuits</div><div>${bnToString(stats.lifetime.Circuits)}</div></div>
      <div class="card"><div>Lifetime AI Cores</div><div>${bnToString(stats.lifetime.AICores)}</div></div>
      <div class="card"><div>Lifetime Reality Shards</div><div>${bnToString(stats.lifetime.RealityShards)}</div></div>
      <div class="card"><div>Lifetime Timeline Ink</div><div>${bnToString(stats.lifetime.TimelineInk)}</div></div>
      <div class="card"><div>Lifetime Godcoins</div><div>${bnToString(stats.lifetime.Godcoins)}</div></div>
      <div class="card"><div>Lifetime Echo Dust</div><div>${bnToString(stats.lifetime.EchoDust)}</div></div>
      <div class="card"><div>Meltdowns</div><div>${stats.meltdowns}</div></div>
      <div class="card"><div>Contracts Completed</div><div>${stats.contractsCompleted}</div></div>
      <div class="card"><div>Best Contract Streak</div><div>${stats.bestContractStreak}</div></div>
      <div class="card"><div>Bosses Defeated</div><div>${stats.bossesDefeated}</div></div>
      <div class="card"><div>Total Prestiges</div><div>${stats.totalPrestiges}</div></div>
      <div class="card"><div>Paradox Tokens</div><div>${bnToString(state.paradoxTokens)}</div></div>
    </div>`;
  tabContents.stats.innerHTML = html + renderPrestigeUpgrades();
}

function renderPrestigeUpgrades() {
  const upgrades = PRESTIGE_UPGRADES.map(u => {
    const owned = state.permanent.upgrades[u.id];
    const afford = bnCmp(state.paradoxTokens, bnFromNumber(u.cost)) >= 0;
    return `<div class="card">
      <div>
        <div><strong>${u.name}</strong></div>
        <div class="meta">${u.desc}</div>
      </div>
      <button class="btn secondary" data-prestige="${u.id}" ${owned || !afford ? "disabled" : ""}>${owned ? "Owned" : `Buy (${u.cost})`}</button>
    </div>`;
  }).join("");
  return `<div class="list"><div class="card"><strong>Paradox Vault</strong><span class="small">Permanent upgrades unlocked by Timeline Reboot.</span></div>${upgrades}</div>`;
}

function renderContracts() {
  if (!contractAreaEl) return;
  const tutorial = state.contract?.tutorial || [];
  const hasTutorial = tutorial.some(c => c && !c.completed);
  if (hasTutorial) {
    const rows = tutorial.map(c => {
      if (!c) return "";
      const progress = Math.min(1, (c.progress || 0) / (c.count || 1));
      const rewardText = c.rewardSlots ? `+${c.rewardSlots} slots` : "";
      const status = c.completed ? "Done" : `${c.progress || 0}/${c.count}`;
      return `
        <div class="contract-line">
          <span class="contract-title">${c.title}</span>
          <span class="contract-progress">${status}</span>
          <span class="contract-reward">${rewardText}</span>
        </div>
        <div class="contract-bar"><div class="fill" style="width:${progress * 100}%"></div></div>
      `;
    }).join("");
    contractAreaEl.innerHTML = `<div class="contract-stack">${rows}</div>`;
    return;
  }
  const c = state.contract.active;
  if (!c) {
    contractAreaEl.innerHTML = `<div class="contract-empty small">No contracts.</div>`;
    return;
  }
  if (c.type === "final") {
    const amount = c.amount || 1000;
    const progress = Math.min(1, c.progress || 0);
    const current = Math.min(amount, c.current || 0);
    contractAreaEl.innerHTML = `
      <div class="contract-line">
        <span class="contract-title">Final Contract: Produce ${amount} Godcoins</span>
        <span class="contract-progress">${current}/${amount}</span>
        <span class="contract-reward">Victory</span>
      </div>
      <div class="contract-bar"><div class="fill" style="width:${progress * 100}%"></div></div>
    `;
    return;
  }
  const rewardText = c.reward === "grid" ? "+2 grid slots" : "Permanent multiplier";
  if (c.type === "deliver") {
    contractAreaEl.innerHTML = `
      <div class="contract-line">
        <span class="contract-title">Deliver ${c.amount} ${c.resource}</span>
        <span class="contract-progress">${Math.round((c.progress || 0) * 100)}%</span>
        <span class="contract-reward">${rewardText}</span>
      </div>
      <div class="contract-bar"><div class="fill" style="width:${(c.progress || 0) * 100}%"></div></div>
    `;
    return;
  }
  if (c.type === "research") {
    contractAreaEl.innerHTML = `
      <div class="contract-line">
        <span class="contract-title">Research ${c.nodeName}</span>
        <span class="contract-progress">${Math.round((c.progress || 0) * 100)}%</span>
        <span class="contract-reward">${rewardText}</span>
      </div>
      <div class="contract-bar"><div class="fill" style="width:${(c.progress || 0) * 100}%"></div></div>
    `;
    return;
  }
  contractAreaEl.innerHTML = `
    <div class="contract-line">
      <span class="contract-title">Maintain Heat ${c.min}-${c.max}%</span>
      <span class="contract-progress">${Math.round((c.progressRatio || 0) * 100)}%</span>
      <span class="contract-reward">${rewardText}</span>
    </div>
    <div class="contract-bar"><div class="fill" style="width:${(c.progressRatio || 0) * 100}%"></div></div>
  `;
}

function renderAutomation() {
  if (!automationAreaEl) return;
  const rules = state.rules || [];
  state.buildingRuleDefaults = state.buildingRuleDefaults || {};
  const maxed = state.maxRules && rules.length >= state.maxRules;
  const resourceOptions = buildResourceOptions("Scrap");
  const buildingOptions = buildBuildingOptions("Miner", { keys: ALL_BUILDING_KEYS });
  const scopeBuildingOptions = buildBuildingOptions(GRID_BUILDING_KEYS[0] || "Miner", { keys: GRID_BUILDING_KEYS });
  const comparatorOptions = buildComparatorOptions(">");
  const leftTypeOptions = [
    { value: "resource-percent", label: "Resource % of storage" },
    { value: "resource-value", label: "Resource amount (exact)" },
    { value: "number", label: "Number" },
    { value: "building-count", label: "Building count (grid)" },
    { value: "any-building", label: "Any building on grid" },
    { value: "building-unlock", label: "Building unlocked" }
  ].map(opt => `<option value="${opt.value}" ${opt.value === "resource-percent" ? "selected" : ""}>${opt.label}</option>`).join("");
  const rightTypeOptions = [
    { value: "number", label: "Number" },
    { value: "resource-percent", label: "Resource % of storage" },
    { value: "resource-value", label: "Resource amount (exact)" }
  ].map(opt => `<option value="${opt.value}" ${opt.value === "number" ? "selected" : ""}>${opt.label}</option>`).join("");
  const actionOptions = [
    { value: "power-off", label: "Power off" },
    { value: "power-on", label: "Power on" },
    { value: "destroy", label: "Destroy" },
    { value: "build", label: "Build" }
  ].map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("");
  const ruleRows = rules.map(rule => {
    const formatted = formatAutomationRule(rule);
    const nameText = formatted.name || "Rule";
    const name = `<div class="rule-name">${nameText}</div>`;
    return `<div class="automation-rule">
      <div class="rule-main">
        ${name}
        <div class="rule-text">${formatted.text}</div>
      </div>
      <button class="btn secondary" data-rule-remove="${rule.id}" data-rule-scope="global">Remove</button>
    </div>`;
  }).join("") || `<div class="small">No factory rules.</div>`;
  const defaultGroups = Object.entries(state.buildingRuleDefaults)
    .filter(([, list]) => Array.isArray(list) && list.length > 0)
    .map(([buildingKey, list]) => {
      const groupRows = list.map(rule => {
        const formatted = formatAutomationRule(rule);
        const nameText = formatted.name || "Rule";
        const name = `<div class="rule-name">${nameText}</div>`;
        return `<div class="automation-rule">
          <div class="rule-main">
            ${name}
            <div class="rule-text">${formatted.text}</div>
          </div>
          <button class="btn secondary" data-rule-remove="${rule.id}" data-rule-scope="default" data-rule-building="${buildingKey}">Remove</button>
        </div>`;
      }).join("");
      return `<div class="automation-group">
        <div class="automation-group-title">${getBuildingLabel(buildingKey)}</div>
        <div class="automation-list">${groupRows}</div>
      </div>`;
    }).join("") || `<div class="small">No building default rules.</div>`;
  automationAreaEl.innerHTML = `
    <div class="automation-form">
      <div class="automation-row">
        <input id="autoRuleName" type="text" placeholder="Rule name (optional)" />
        <select id="autoScope">
          <option value="global" selected>Factory rule</option>
          <option value="default">Building default</option>
        </select>
        <span class="auto-field" data-scope-field="building">
          <select id="autoScopeBuilding">${scopeBuildingOptions}</select>
        </span>
      </div>
      <div class="automation-row">
        <span class="small">IF</span>
        <select id="autoLeftType">${leftTypeOptions}</select>
        <span class="auto-field" data-left-field="number">
          <input id="autoLeftNumber" type="number" value="0" step="0.1" />
        </span>
        <span class="auto-field" data-left-field="resource">
          <select id="autoLeftResource">${resourceOptions}</select>
        </span>
        <span class="auto-field" data-left-field="building">
          <select id="autoLeftBuilding">${buildingOptions}</select>
        </span>
        <select id="autoComparator">${comparatorOptions}</select>
        <select id="autoRightType">${rightTypeOptions}</select>
        <span class="auto-field" data-right-field="number">
          <input id="autoRightNumber" type="number" value="80" step="0.1" />
        </span>
        <span class="auto-field" data-right-field="resource">
          <select id="autoRightResource">${resourceOptions}</select>
        </span>
      </div>
      <div class="automation-row">
        <span class="small">THEN</span>
        <select id="autoActionType">${actionOptions}</select>
        <select id="autoActionTarget"></select>
        <button class="btn secondary" id="autoAdd">Add Rule</button>
      </div>
      <div class="small">Resource % uses storage capacity. Unlock checks use 1=unlocked, 0=locked.</div>
      ${maxed ? `<div class="small warn">Factory rule limit reached.</div>` : ""}
    </div>
    <div class="automation-section">
      <div class="automation-section-title">Factory Rules ${state.maxRules ? `(${rules.length}/${state.maxRules})` : `(${rules.length})`}</div>
      <div class="automation-list">${ruleRows}</div>
    </div>
    <div class="automation-section">
      <div class="automation-section-title">Building Defaults</div>
      <div class="small">Applied when a new building of that type is placed.</div>
      <div class="automation-defaults">${defaultGroups}</div>
    </div>
  `;
  const addBtn = automationAreaEl.querySelector("#autoAdd");
  const scopeEl = automationAreaEl.querySelector("#autoScope");
  const scopeBuildingWrap = automationAreaEl.querySelector("[data-scope-field=\"building\"]");
  const leftTypeEl = automationAreaEl.querySelector("#autoLeftType");
  const rightTypeEl = automationAreaEl.querySelector("#autoRightType");
  const leftNumberWrap = automationAreaEl.querySelector("[data-left-field=\"number\"]");
  const leftResourceWrap = automationAreaEl.querySelector("[data-left-field=\"resource\"]");
  const leftBuildingWrap = automationAreaEl.querySelector("[data-left-field=\"building\"]");
  const rightNumberWrap = automationAreaEl.querySelector("[data-right-field=\"number\"]");
  const rightResourceWrap = automationAreaEl.querySelector("[data-right-field=\"resource\"]");
  const actionTypeEl = automationAreaEl.querySelector("#autoActionType");
  const actionTargetEl = automationAreaEl.querySelector("#autoActionTarget");
  const syncActionTargets = () => {
    const scope = scopeEl?.value || "global";
    const actionType = actionTypeEl?.value || "power-off";
    const includeSelf = scope === "default";
    const includeAny = actionType !== "build";
    let selected = actionTargetEl?.value;
    const allowed = new Set();
    if (includeSelf) allowed.add("self");
    if (includeAny) allowed.add("Any");
    GRID_BUILDING_KEYS.forEach(key => allowed.add(key));
    if (!allowed.has(selected)) {
      selected = includeSelf ? "self" : (GRID_BUILDING_KEYS[0] || "Miner");
    }
    if (actionTargetEl) {
      actionTargetEl.innerHTML = buildBuildingOptions(selected, {
        includeAny,
        includeSelf,
        keys: GRID_BUILDING_KEYS
      });
    }
  };
  const syncForm = () => {
    const leftType = leftTypeEl?.value || "resource-percent";
    const rightType = rightTypeEl?.value || "number";
    if (leftNumberWrap) leftNumberWrap.style.display = leftType === "number" ? "" : "none";
    if (leftResourceWrap) leftResourceWrap.style.display = (leftType === "resource-percent" || leftType === "resource-value") ? "" : "none";
    if (leftBuildingWrap) leftBuildingWrap.style.display = (leftType === "building-count" || leftType === "building-unlock") ? "" : "none";
    if (rightNumberWrap) rightNumberWrap.style.display = rightType === "number" ? "" : "none";
    if (rightResourceWrap) rightResourceWrap.style.display = (rightType === "resource-percent" || rightType === "resource-value") ? "" : "none";
    if (scopeBuildingWrap) scopeBuildingWrap.style.display = scopeEl?.value === "default" ? "" : "none";
    if (addBtn) addBtn.disabled = !!maxed && scopeEl?.value === "global";
    syncActionTargets();
  };
  if (scopeEl) scopeEl.addEventListener("change", syncForm);
  if (leftTypeEl) leftTypeEl.addEventListener("change", syncForm);
  if (rightTypeEl) rightTypeEl.addEventListener("change", syncForm);
  if (actionTypeEl) actionTypeEl.addEventListener("change", syncForm);
  syncForm();
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const scope = scopeEl?.value || "global";
      if (scope === "global" && maxed) return;
      const name = automationAreaEl.querySelector("#autoRuleName")?.value?.trim() || "";
      const leftType = leftTypeEl?.value || "resource-percent";
      const rightType = rightTypeEl?.value || "number";
      const comparator = automationAreaEl.querySelector("#autoComparator")?.value || ">";
      const leftSpec = buildAutomationValueSpec(
        leftType,
        automationAreaEl.querySelector("#autoLeftNumber")?.value,
        automationAreaEl.querySelector("#autoLeftResource")?.value,
        automationAreaEl.querySelector("#autoLeftBuilding")?.value
      );
      const rightSpec = buildAutomationValueSpec(
        rightType,
        automationAreaEl.querySelector("#autoRightNumber")?.value,
        automationAreaEl.querySelector("#autoRightResource")?.value,
        null
      );
      const actionType = actionTypeEl?.value || "power-off";
      const actionTarget = actionTargetEl?.value || (GRID_BUILDING_KEYS[0] || "Miner");
      const rule = {
        id: createAutomationRuleId(),
        name,
        condition: { left: leftSpec, comparator, right: rightSpec },
        action: { type: actionType, target: actionTarget }
      };
      if (scope === "default") {
        const buildingKey = automationAreaEl.querySelector("#autoScopeBuilding")?.value || (GRID_BUILDING_KEYS[0] || "Miner");
        state.buildingRuleDefaults = state.buildingRuleDefaults || {};
        state.buildingRuleDefaults[buildingKey] = state.buildingRuleDefaults[buildingKey] || [];
        state.buildingRuleDefaults[buildingKey].push(rule);
      } else {
        state.rules = state.rules || [];
        state.rules.push(rule);
      }
      renderCache.automation = "";
    });
  }
  automationAreaEl.querySelectorAll("button[data-rule-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.ruleRemove;
      const scope = btn.dataset.ruleScope || "global";
      if (scope === "default") {
        const buildingKey = btn.dataset.ruleBuilding;
        if (buildingKey && state.buildingRuleDefaults?.[buildingKey]) {
          state.buildingRuleDefaults[buildingKey] = state.buildingRuleDefaults[buildingKey].filter(rule => rule.id !== id);
          if (state.buildingRuleDefaults[buildingKey].length === 0) {
            delete state.buildingRuleDefaults[buildingKey];
          }
        }
      } else {
        state.rules = (state.rules || []).filter(rule => rule.id !== id);
      }
      renderCache.automation = "";
    });
  });
}

function renderContextAutomation(index) {
  if (!contextAutomationEl) return;
  if (!isAutomationUnlocked()) {
    contextAutomationEl.innerHTML = "";
    return;
  }
  const tile = state.grid[index];
  if (!tile || !tile.building) {
    contextAutomationEl.innerHTML = "";
    return;
  }
  tile.automationRules = Array.isArray(tile.automationRules) ? tile.automationRules : [];
  const rules = tile.automationRules;
  const resourceOptions = buildResourceOptions("Scrap");
  const buildingOptions = buildBuildingOptions("Miner", { keys: ALL_BUILDING_KEYS });
  const comparatorOptions = buildComparatorOptions(">");
  const leftTypeOptions = [
    { value: "resource-percent", label: "Resource % of storage" },
    { value: "resource-value", label: "Resource amount (exact)" },
    { value: "number", label: "Number" },
    { value: "building-count", label: "Building count (grid)" },
    { value: "any-building", label: "Any building on grid" },
    { value: "building-unlock", label: "Building unlocked" }
  ].map(opt => `<option value="${opt.value}" ${opt.value === "resource-percent" ? "selected" : ""}>${opt.label}</option>`).join("");
  const rightTypeOptions = [
    { value: "number", label: "Number" },
    { value: "resource-percent", label: "Resource % of storage" },
    { value: "resource-value", label: "Resource amount (exact)" }
  ].map(opt => `<option value="${opt.value}" ${opt.value === "number" ? "selected" : ""}>${opt.label}</option>`).join("");
  const actionOptions = [
    { value: "power-off", label: "Power off" },
    { value: "power-on", label: "Power on" },
    { value: "destroy", label: "Destroy" },
    { value: "build", label: "Build" }
  ].map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("");
  const ruleRows = rules.map(rule => {
    const formatted = formatAutomationRule(rule);
    const tag = formatted.source && String(formatted.source).startsWith("default:") ? `<span class="rule-tag">Default</span>` : "";
    const nameText = formatted.name || "Rule";
    const name = `<div class="rule-name">${nameText}${tag}</div>`;
    return `<div class="automation-rule compact">
      <div class="rule-main">
        ${name}
        <div class="rule-text">${formatted.text}</div>
      </div>
      <button class="btn secondary" data-ctx-rule-remove="${rule.id}">Remove</button>
    </div>`;
  }).join("") || `<div class="small">No automation rules.</div>`;
  contextAutomationEl.innerHTML = `
    <div class="context-automation-title">Automation</div>
    <div class="automation-list">${ruleRows}</div>
    <div class="automation-form compact">
      <div class="automation-row">
        <input id="ctxRuleName" type="text" placeholder="Rule name (optional)" />
      </div>
      <div class="automation-row">
        <span class="small">IF</span>
        <select id="ctxLeftType">${leftTypeOptions}</select>
        <span class="auto-field" data-left-field="number">
          <input id="ctxLeftNumber" type="number" value="0" step="0.1" />
        </span>
        <span class="auto-field" data-left-field="resource">
          <select id="ctxLeftResource">${resourceOptions}</select>
        </span>
        <span class="auto-field" data-left-field="building">
          <select id="ctxLeftBuilding">${buildingOptions}</select>
        </span>
        <select id="ctxComparator">${comparatorOptions}</select>
        <select id="ctxRightType">${rightTypeOptions}</select>
        <span class="auto-field" data-right-field="number">
          <input id="ctxRightNumber" type="number" value="80" step="0.1" />
        </span>
        <span class="auto-field" data-right-field="resource">
          <select id="ctxRightResource">${resourceOptions}</select>
        </span>
      </div>
      <div class="automation-row">
        <span class="small">THEN</span>
        <select id="ctxActionType">${actionOptions}</select>
        <button class="btn secondary" id="ctxAddRule">Add Rule</button>
      </div>
      <div class="small">Targets this building.</div>
    </div>
  `;
  const leftTypeEl = contextAutomationEl.querySelector("#ctxLeftType");
  const rightTypeEl = contextAutomationEl.querySelector("#ctxRightType");
  const leftNumberWrap = contextAutomationEl.querySelector("[data-left-field=\"number\"]");
  const leftResourceWrap = contextAutomationEl.querySelector("[data-left-field=\"resource\"]");
  const leftBuildingWrap = contextAutomationEl.querySelector("[data-left-field=\"building\"]");
  const rightNumberWrap = contextAutomationEl.querySelector("[data-right-field=\"number\"]");
  const rightResourceWrap = contextAutomationEl.querySelector("[data-right-field=\"resource\"]");
  const syncForm = () => {
    const leftType = leftTypeEl?.value || "resource-percent";
    const rightType = rightTypeEl?.value || "number";
    if (leftNumberWrap) leftNumberWrap.style.display = leftType === "number" ? "" : "none";
    if (leftResourceWrap) leftResourceWrap.style.display = (leftType === "resource-percent" || leftType === "resource-value") ? "" : "none";
    if (leftBuildingWrap) leftBuildingWrap.style.display = (leftType === "building-count" || leftType === "building-unlock") ? "" : "none";
    if (rightNumberWrap) rightNumberWrap.style.display = rightType === "number" ? "" : "none";
    if (rightResourceWrap) rightResourceWrap.style.display = (rightType === "resource-percent" || rightType === "resource-value") ? "" : "none";
  };
  if (leftTypeEl) leftTypeEl.addEventListener("change", syncForm);
  if (rightTypeEl) rightTypeEl.addEventListener("change", syncForm);
  syncForm();
  const addBtn = contextAutomationEl.querySelector("#ctxAddRule");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const name = contextAutomationEl.querySelector("#ctxRuleName")?.value?.trim() || "";
      const leftType = leftTypeEl?.value || "resource-percent";
      const rightType = rightTypeEl?.value || "number";
      const comparator = contextAutomationEl.querySelector("#ctxComparator")?.value || ">";
      const leftSpec = buildAutomationValueSpec(
        leftType,
        contextAutomationEl.querySelector("#ctxLeftNumber")?.value,
        contextAutomationEl.querySelector("#ctxLeftResource")?.value,
        contextAutomationEl.querySelector("#ctxLeftBuilding")?.value
      );
      const rightSpec = buildAutomationValueSpec(
        rightType,
        contextAutomationEl.querySelector("#ctxRightNumber")?.value,
        contextAutomationEl.querySelector("#ctxRightResource")?.value,
        null
      );
      const actionType = contextAutomationEl.querySelector("#ctxActionType")?.value || "power-off";
      const rule = {
        id: createAutomationRuleId(),
        name,
        condition: { left: leftSpec, comparator, right: rightSpec },
        action: { type: actionType, target: "self" }
      };
      tile.automationRules.push(rule);
      renderContextAutomation(index);
    });
  }
  contextAutomationEl.querySelectorAll("button[data-ctx-rule-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.ctxRuleRemove;
      tile.automationRules = tile.automationRules.filter(rule => rule.id !== id);
      renderContextAutomation(index);
    });
  });
}

function formatDebuff(debuff) {
  if (!debuff) return "None";
  const parts = [];
  if (debuff.speed) parts.push(`Speed x${debuff.speed}`);
  if (debuff.heat) parts.push(`Heat x${debuff.heat}`);
  if (debuff.disable) parts.push(`Disable ${debuff.disable}`);
  return parts.join(", ") || "None";
}

function renderBoss() {
  if (!bossAreaEl) return;
  bossAreaEl.innerHTML = `<div class="small">No bosses configured.</div>`;
}


function applySettings() {
  document.body.classList.toggle("reduced-motion", state.settings.reducedMotion);
  document.body.classList.toggle("colorblind", state.settings.colorblind);
  document.body.classList.toggle("text-size-small", state.settings.textSize === "small");
  document.body.classList.toggle("text-size-large", state.settings.textSize === "large");
  reducedMotionToggle.checked = state.settings.reducedMotion;
  colorblindToggle.checked = state.settings.colorblind;
  if (textSizeSelect) textSizeSelect.value = state.settings.textSize || "normal";
  shakeToggle.checked = state.settings.shake;
  fireworksToggle.checked = state.settings.fireworks;
  if (audioToggle) audioToggle.checked = !!state.settings.audioEnabled;
  if (audioVolume) audioVolume.value = Math.round((state.settings.audioVolume || 0) * 100);
  if (typeof syncAudioSettings === "function") syncAudioSettings();
}

function addLog(icon, text) {
  state.log = state.log || [];
  state.log.unshift({ icon, text });
  state.log = state.log.slice(0, 80);
}

function renderTabs() {
  const tabNames = ["buildings", "research", "achievements", "stats"];
  tabsEl.innerHTML = tabNames.map(name => `<button class="tab-btn" data-tab="${name}">${name}</button>`).join("");
  tabsEl.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });
  activateTab("buildings");
}

function activateTab(name) {
  Object.keys(tabContents).forEach(tab => {
    tabContents[tab].classList.toggle("active", tab === name);
  });
  tabsEl.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
  renderCache[name] = "";
}

function showPrestigeOverlay() {
  perkOptionsEl.innerHTML = TIMELINE_PERKS.map(perk => `
    <div class="perk" data-perk="${perk.id}">
      <strong>${perk.name}</strong>
      <div class="small">${perk.desc}</div>
    </div>`).join("");
  perkOptionsEl.querySelectorAll(".perk").forEach(card => {
    card.addEventListener("click", () => {
      performPrestige(card.dataset.perk);
      prestigeOverlay.classList.remove("active");
    });
  });
  prestigeOverlay.classList.add("active");
}

