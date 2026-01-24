function getGridWidth() {
  return Math.max(3, Math.min(12, state.gridWidth || 3));
}

function getGridRows() {
  return Math.ceil(state.gridSlots / getGridWidth());
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
    cell.addEventListener("click", () => handleTileClick(index));
    cell.addEventListener("contextmenu", (event) => handleTileContext(index, event));
    gridEl.appendChild(cell);
  });
}

function handleTileContext(index, event) {
  event.preventDefault();
  const tile = state.grid[index];
  if (!tile.building) return;
  state.selectedTile = index;
  showContextMenu(event.clientX, event.clientY, index);
}

function handleTileClick(index) {
  const tile = state.grid[index];
  if (tile.building) {
    state.selectedTile = index;
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
  tile.progress = 0;
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
  tile.localInv = {};
  tile.localInv.BurntScrap = tile.localInv.BurntScrap || { m: 0, e: 0 };
  bnAddInPlace(tile.localInv.BurntScrap, bnFromNumber(50));
  addLog("[REMOVE]", `Demolished ${name}.`);
  triggerBuildEffect(index);
  pulseLatestLog();
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

function getUpgradeCost(upgrade) {
  const level = getUpgradeLevel(upgrade.id);
  const multiplier = upgrade.repeatable ? (1 + level) : 1;
  const cost = {};
  Object.entries(upgrade.cost || {}).forEach(([res, amt]) => {
    cost[res] = Math.ceil(amt * multiplier);
  });
  return cost;
}

function purchaseUpgrade(id) {
  const upgrade = UPGRADE_LIST.find(u => u.id === id);
  if (!upgrade) return false;
  const level = getUpgradeLevel(id);
  if (!upgrade.repeatable && level > 0) return false;
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

function toggleBurnScrap() {
  state.burnScrap.active = !state.burnScrap.active;
  addLog("[BURN]", state.burnScrap.active ? "Burnt Scrap purge engaged." : "Burnt Scrap purge halted.");
  pulseLatestLog();
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
  state.grid.forEach((tile, index) => {
    if (!tile.building) return;
    for (const [res, amt] of Object.entries(tile.localInv)) {
      if (bnCmp(amt, { m: 0, e: 0 }) <= 0) continue;
      const neighbors = getNeighbors(index);
      for (const neighbor of neighbors) {
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
    }
  });
}

function reverseDir(dir) {
  return { left: "right", right: "left", up: "down", down: "up" }[dir];
}

function updateBurntScrap(dt) {
  if (!state.burnScrap.active) return;
  state.burnScrap.timer += dt;
  if (state.burnScrap.timer < 1) return;
  state.burnScrap.timer = 0;
  const have = state.totals.BurntScrap || { m: 0, e: 0 };
  if (bnCmp(have, bnFromNumber(1)) < 0) return;
  if (!consumeResource("BurntScrap", bnFromNumber(1))) return;
  const buildingCount = state.grid.reduce((acc, tile) => acc + (tile.building ? 1 : 0), 0);
  state.heat = Math.min(100, state.heat + buildingCount);
  addLog("[BURN]", `Purge consumes 1 Burnt Scrap. Heat +${buildingCount}.`);
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
    state.gameOver = true;
    addLog("[FAIL]", "Storage collapsed. Game over.");
    return true;
  }
  return false;
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
  const fanCool = (BUILDINGS.Fan?.cool || 2) + (state.modifiers.fanCoolBonus || 0);
  const fanBonus = (state.cooling?.fans || 0) * fanCool;
  state.grid.forEach(tile => {
    if (!tile.building) return;
    const def = BUILDINGS[tile.building];
    heatDelta += def.heat;
    if (def.support === "cooling" && !def.global) cooling += def.cool;
    if (def.support === "counter") counterCount += 1;
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

function applyContracts(dt) {
  state.contract.cooldown -= dt;
  if (!state.contract.active && state.contract.cooldown <= 0) {
    state.contract.active = generateContract();
    state.contract.cooldown = 60;
  }
  if (state.contract.active) {
    const c = state.contract.active;
    c.time -= dt;
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
    if (c.time <= 0) {
      addLog("[FAIL]", "Contract expired. The board snickers.");
      state.stats.currentStreak = 0;
      state.contract.active = null;
    }
  }
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
  if (c.reward === "grid" && state.gridSlots < 144) {
    expandGrid(2);
    addLog("[CONTRACT]", "Contract complete: +2 grid slots.");
  } else {
    state.modifiers.globalSpeed *= 1.05;
    addLog("[CONTRACT]", "Contract complete: permanent multiplier applied.");
  }
  triggerScreenReward("good");
  pulseLatestLog();
  state.stats.contractsCompleted += 1;
  state.stats.currentStreak += 1;
  state.stats.bestContractStreak = Math.max(state.stats.bestContractStreak, state.stats.currentStreak);
  state.contract.active = null;
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
  if (state.gridSlots >= maxSlots) return false;
  const cost = { Scrap: 150, Gears: 20 };
  if (!canAfford(cost)) return false;
  spendCost(cost);
  state.gridSlots = Math.min(maxSlots, state.gridSlots + 1);
  state.grid.push(createTile());
  syncGridWidth();
  buildGrid();
  addLog("[GRID]", "Purchased +1 grid slot.");
  triggerBuildEffect(state.grid.length - 1);
  triggerScreenReward("good");
  pulseLatestLog();
  return true;
}

function buyGlobalSupport(key) {
  const def = BUILDINGS[key];
  if (!def || !def.global) return false;
  if (!canAfford(def.cost)) return false;
  spendCost(def.cost);
  if (key === "Fan") {
    state.cooling.fans += 1;
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
  if (!state.boss.active) {
    const nextBoss = BOSSES.find(b => !state.boss.defeated.includes(b.id) && bnCmp(state.stats.lifetime[b.resource], bnFromNumber(b.threshold)) >= 0);
    if (nextBoss) {
      state.boss.active = {
        id: nextBoss.id,
        name: nextBoss.name,
        resource: nextBoss.resource,
        hp: nextBoss.hp,
        maxHp: nextBoss.hp,
        debuff: nextBoss.debuff
      };
      addLog("[BOSS]", `${nextBoss.name} emerges. ${nextBoss.resource} is now ammunition.`);
      if (state.settings.shake && !state.settings.reducedMotion) triggerShake();
    }
  }
  if (state.boss.active) {
    const boss = state.boss.active;
    const rate = state.productionRates[boss.resource] || { m: 0, e: 0 };
    const dps = bnToNumber(rate) * (state.ammoBuff > 0 ? 3 : 1);
    boss.hp -= dps * dt;
    if (state.ammoBuff > 0) state.ammoBuff -= dt;
    if (boss.hp <= 0) {
      addLog("[BOSS]", `${boss.name} defeated. Debuff shattered.`);
      state.boss.defeated.push(boss.id);
      state.boss.active = null;
      state.stats.bossesDefeated += 1;
      triggerScreenReward("cool");
      pulseLatestLog();
    }
  }
}

function autoBuild(target) {
  if (!state.unlocks[target]) return;
  const def = BUILDINGS[target];
  if (!canAfford(def.cost)) return;
  const emptyTiles = state.grid.map((t, i) => t.building ? null : i).filter(i => i !== null);
  if (!emptyTiles.length) return;
  const index = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
  spendCost(def.cost);
  state.grid[index].building = target;
  addLog("[RULE]", `Auto-built ${def.name}.`);
  triggerBuildEffect(index);
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

function tick(dt) {
  if (state.gameOver) return;
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

  state.grid.forEach(tile => {
    if (!tile.building) return;
    const def = BUILDINGS[tile.building];
    if (auditDisable && auditDisable.disable === tile.building) return;
    if (bossDebuff.disable && bossDebuff.disable === tile.building) return;
    let speed = def.speed * state.modifiers.globalSpeed * heatMultiplier * sabotageSpeed * bossDebuff.speed;
    if (state.modifiers.hyperEfficiency) {
      speed *= state.stats.lifetime.Godcoins.m > 0 ? 1.4 : 0.8;
    }
    if (tile.building === "Assembler") speed *= state.modifiers.assemblerSpeed;
    if (tile.building === "Miner") speed *= state.modifiers.minerSpeed;
    if (tile.building === "Smelter") speed *= state.modifiers.smelterSpeed;
    if (tile.building === "Reactor" && state.throttleReactor > 0) speed *= 0.6;
    if (tile.building === "Lab" && state.labPriority > 0) speed *= 1.2;

    if (def.support) return;
    if (def.inputs.length > 0 && !hasInputs(tile, def.inputs, tile.building === "Assembler" ? state.modifiers.assemblerEfficiency : 1)) return;

    tile.progress += speed * effectiveDt;
    while (tile.progress >= 1) {
      const efficiency = def.efficiency * state.modifiers.efficiency;
      if (def.inputs.length > 0) {
        const inputMod = tile.building === "Assembler" ? state.modifiers.assemblerEfficiency : 1;
        if (!hasInputs(tile, def.inputs, inputMod)) break;
        consumeInputs(tile, def.inputs, inputMod);
      }
      let outputEfficiency = efficiency;
      if (tile.building === "Assembler" && state.modifiers.assemblerChaos && Math.random() < 0.2) outputEfficiency *= 2;
      produceOutputs(tile, def.outputs, outputEfficiency);
      tile.progress -= 1;
    }
  });

  transferResources();
  computeTotals();
  updateBurntScrap(effectiveDt);
  computeTotals();
  if (checkStorageCap()) return;
  updateHeatAndGlitch(effectiveDt, bossDebuff);
  maybeMeltdown();
  applySabotage(effectiveDt);
  applyContracts(effectiveDt);
  updateBoss(effectiveDt);
  applyAchievements();
  handleAutoBlueprint();
  updateProductionRates(effectiveDt);
  checkMilestones();
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
    const threshold = bnFromNumber(Math.pow(10, thresholdExp));
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
