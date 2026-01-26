let state = null;

function createAutomationRuleId() {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function createTile() {
  return {
    building: null,
    progress: 0,
    visualProgress: 0,
    visualSpeed: 0,
    localInv: {},
    transferDir: null,
    transferTime: 0,
    disabledUntil: 0,
    minerWasteTimer: 0,
    minerWasteInterval: 0,
    minerLevel: 1,
    smelterLevel: 1,
    smelterCycleCount: 0,
    ashLevel: 1,
    automationDisabled: false,
    automationRules: []
  };
}

function getFanTierIndexFromCount(count) {
  if (count >= 20) return 4;
  if (count >= 15) return 3;
  if (count >= 10) return 2;
  if (count >= 5) return 1;
  return 0;
}

function createTutorialContracts() {
  return [
    {
      id: "tutorial-miner",
      type: "build",
      building: "Miner",
      count: 3,
      rewardSlots: 1,
      title: "Build 3x Miner",
      completed: false,
      progress: 0
    },
    {
      id: "tutorial-fan",
      type: "build",
      building: "Fan",
      count: 1,
      rewardSlots: 2,
      title: "Build 1x Fan",
      completed: false,
      progress: 0
    },
    {
      id: "tutorial-smelter",
      type: "build",
      building: "Smelter",
      count: 1,
      rewardSlots: 3,
      title: "Build 1x Smelter",
      completed: false,
      progress: 0
    }
  ];
}

function isValidResourceKey(key) {
  return RESOURCE_LIST.some(r => r.key === key);
}

function isValidBuildingKey(key) {
  return !!BUILDINGS[key];
}

function normalizeComparator(value) {
  const map = {
    "<": "<",
    "<=": "<=",
    ">": ">",
    ">=": ">=",
    "=": "=",
    "==": "="
  };
  return map[value] || ">";
}

function normalizeAutomationValue(value, fallback) {
  const base = fallback || { type: "number", value: 0 };
  if (!value || typeof value !== "object") return { ...base };
  const type = value.type || base.type;
  const defaultResource = RESOURCE_LIST[0]?.key || "Scrap";
  const defaultBuilding = isValidBuildingKey("Miner") ? "Miner" : (Object.keys(BUILDINGS)[0] || "Miner");
  if (type === "number") {
    return { type: "number", value: Number(value.value) || Number(base.value) || 0 };
  }
  if (type === "resource-percent" || type === "resource-value") {
    const resource = isValidResourceKey(value.resource) ? value.resource : (base.resource || defaultResource);
    return { type, resource };
  }
  if (type === "building-count" || type === "building-unlock") {
    const building = isValidBuildingKey(value.building) ? value.building : (base.building || defaultBuilding);
    return { type, building };
  }
  if (type === "any-building") {
    return { type };
  }
  return { ...base };
}

function normalizeAutomationAction(action) {
  const defaultBuilding = isValidBuildingKey("Miner") ? "Miner" : (Object.keys(BUILDINGS)[0] || "Miner");
  if (!action) {
    return { type: "power-off", target: defaultBuilding };
  }
  if (typeof action === "string") {
    if (action === "stop-miners") return { type: "power-off", target: "Miner" };
    return { type: action, target: defaultBuilding };
  }
  const type = action.type || action.action || "power-off";
  if (type === "stop-miners") return { type: "power-off", target: "Miner" };
  let target = action.target;
  if (target === "self" || target === "Any") {
    return { type, target };
  }
  if (!isValidBuildingKey(target)) {
    target = defaultBuilding;
  }
  return { type, target };
}

function normalizeAutomationRule(rule) {
  if (!rule || typeof rule !== "object") return null;
  if (rule.condition && rule.action) {
    const left = normalizeAutomationValue(rule.condition.left, { type: "resource-percent", resource: "Scrap" });
    const right = normalizeAutomationValue(rule.condition.right, { type: "number", value: 0 });
    const comparator = normalizeComparator(rule.condition.comparator || rule.comparator);
    const action = normalizeAutomationAction(rule.action);
    return {
      id: typeof rule.id === "string" ? rule.id : createAutomationRuleId(),
      name: typeof rule.name === "string" ? rule.name : "",
      condition: { left, comparator, right },
      action,
      source: rule.source
    };
  }
  if (rule.resource) {
    const comparator = normalizeComparator(rule.comparator);
    const left = normalizeAutomationValue({ type: "resource-percent", resource: rule.resource }, { type: "resource-percent", resource: "Scrap" });
    const right = normalizeAutomationValue({ type: "number", value: Number(rule.threshold) || 0 }, { type: "number", value: 0 });
    const action = rule.action === "stop-miners"
      ? { type: "power-off", target: "Miner" }
      : normalizeAutomationAction(rule.action);
    return {
      id: typeof rule.id === "string" ? rule.id : createAutomationRuleId(),
      name: typeof rule.name === "string" ? rule.name : "",
      condition: { left, comparator, right },
      action,
      source: rule.source
    };
  }
  return null;
}

function normalizeAutomationRules(rules) {
  return (rules || []).map(normalizeAutomationRule).filter(Boolean);
}

function createDefaultState() {
  const gridWidth = 3;
  const gridSlots = 3;
  const grid = Array.from({ length: gridSlots }, () => createTile());
  grid[0].building = "Miner";
  const lifetime = {};
  RESOURCE_LIST.forEach(r => { lifetime[r.key] = { m: 0, e: 0 }; });
  return {
    version: 1,
    gridWidth,
    gridSlots,
    grid,
    selectedBuilding: "Miner",
    totals: {},
    productionRates: {},
    productionBuffer: {},
    productionTimer: 0,
    lastTickAt: 0,
    playTime: 0,
    storageUsed: { m: 0, e: 0 },
    heat: 0,
    throttleReactor: 0,
    labPriority: 0,
    unlocks: {
      Miner: true, Smelter: true, Assembler: true, Printer: false, Lab: false, Reactor: false, Portal: false,
      ChronoForge: false, Fan: true, CryoPipe: false, VoidRadiator: false, CounterIntel: false,
      AshCleaner: true, BurntTech: false, EchoDust: false, BlueprintConsole: false, BuySlot: false
    },
    permanent: { upgrades: {} },
    rules: [],
    buildingRuleDefaults: {},
    maxRules: 0,
    upgrades: {},
    storageCap: 600,
    cooling: { fans: 0 },
    fanOverclockTier: 0,
    fanOverclockTierCount: 0,
    fanOverclockTimer: 0,
    research: {},
    achievements: {},
    stats: {
      meltdowns: 0,
      contractsCompleted: 0,
      bestContractStreak: 0,
      currentStreak: 0,
      bossesDefeated: 0,
      lifetime,
      totalPrestiges: 0
    },
    audio: {
      aiCoreCuePlayed: false
    },
    sabotage: { active: [], cooldown: 90 },
    contract: { active: null, cooldown: 20, tutorial: createTutorialContracts(), final: null },
    boss: { active: null, defeated: [] },
    gameOver: false,
    gameOverReason: null,
    gameWon: false,
    portalBuilt: false,
    emergency: { cooldownUntil: 0, shutdownUntil: 0 },
    ammo: 0,
    ammoBuff: 0,
    paradoxTokens: { m: 0, e: 0 },
    modifiers: {
      globalSpeed: 1,
      efficiency: 1,
      transferBoost: 0,
      minerSpeed: 1,
      smelterSpeed: 1,
      assemblerSpeed: 1,
      assemblerEfficiency: 1,
      assemblerChaos: false,
      autoBlueprint: false,
      hyperEfficiency: false,
      meltdownResist: 0,
      fanCoolBonus: 0,
      fanCoolMultiplier: 1
    },
    milestoneNext: {
      Scrap: 3, Gears: 6, Circuits: 6, AICores: 6, RealityShards: 6, TimelineInk: 6, Godcoins: 6, EchoDust: 6
    },
    settings: {
      reducedMotion: false,
      colorblind: false,
      shake: true,
      fireworks: true,
      audioEnabled: true,
      audioVolume: 0.6,
      textSize: "normal"
    },
    perk: null
  };
}

function normalizeBN(obj) {
  if (!obj) return { m: 0, e: 0 };
  if (typeof obj === "number") return bnFromNumber(obj);
  if (typeof obj.m === "number" && typeof obj.e === "number") return bnNormalize({ m: obj.m, e: obj.e });
  return { m: 0, e: 0 };
}

function normalizeLocalInv(inv) {
  const next = {};
  Object.entries(inv || {}).forEach(([key, val]) => {
    next[key] = normalizeBN(val);
  });
  return next;
}

function rehydrateState(loaded) {
  state = createDefaultState();
  if (!loaded) return;
  const defaultUnlocks = state.unlocks;
  Object.assign(state, loaded);
  state.unlocks = Object.assign(defaultUnlocks, state.unlocks || {});
  const legacySize = loaded.gridSize || 0;
  state.gridSlots = loaded.gridSlots || (loaded.grid ? loaded.grid.length : 0) || (legacySize ? legacySize * legacySize : state.gridSlots);
  state.gridWidth = loaded.gridWidth || legacySize || Math.ceil(Math.sqrt(state.gridSlots));
  state.grid = (loaded.grid || []).map(tile => ({
    building: BUILDINGS[tile.building] ? tile.building : null,
    progress: tile.progress || 0,
    visualProgress: tile.progress || 0,
    visualSpeed: 0,
    localInv: normalizeLocalInv(tile.localInv),
    transferDir: null,
    transferTime: 0,
    disabledUntil: tile.disabledUntil || 0,
    minerWasteTimer: tile.minerWasteTimer || 0,
    minerWasteInterval: tile.minerWasteInterval || 0,
    minerLevel: Math.max(1, tile.minerLevel || 1),
    smelterLevel: Math.max(1, tile.smelterLevel || 1),
    smelterCycleCount: tile.smelterCycleCount || 0,
    ashLevel: Math.max(1, tile.ashLevel || 1),
    automationDisabled: false,
    automationRules: normalizeAutomationRules(tile.automationRules || [])
  }));
  if (state.grid.length < state.gridSlots) {
    const missing = state.gridSlots - state.grid.length;
    for (let i = 0; i < missing; i++) state.grid.push(createTile());
  }
  if (state.grid.length > state.gridSlots) {
    state.grid = state.grid.slice(0, state.gridSlots);
  }
  if (typeof state.portalBuilt !== "boolean") {
    state.portalBuilt = state.grid.some(tile => tile.building === "Portal");
  }
  state.rules = normalizeAutomationRules(state.rules);
  state.buildingRuleDefaults = state.buildingRuleDefaults || {};
  Object.keys(state.buildingRuleDefaults).forEach(key => {
    if (!isValidBuildingKey(key)) {
      delete state.buildingRuleDefaults[key];
    } else {
      state.buildingRuleDefaults[key] = normalizeAutomationRules(state.buildingRuleDefaults[key]);
    }
  });
  state.stats = state.stats || {};
  state.stats.lifetime = state.stats.lifetime || {};
  RESOURCE_LIST.forEach(r => {
    state.stats.lifetime[r.key] = normalizeBN(state.stats.lifetime[r.key]);
  });
  state.paradoxTokens = normalizeBN(state.paradoxTokens || { m: 0, e: 0 });
  state.productionRates = state.productionRates || {};
  state.productionBuffer = state.productionBuffer || {};
  state.totals = state.totals || {};
  if (typeof state.lastTickAt !== "number") state.lastTickAt = 0;
  if (typeof state.playTime !== "number") state.playTime = 0;
  RESOURCE_LIST.forEach(r => {
    state.productionRates[r.key] = normalizeBN(state.productionRates[r.key]);
    state.productionBuffer[r.key] = normalizeBN(state.productionBuffer[r.key]);
    state.totals[r.key] = normalizeBN(state.totals[r.key]);
  });
  state.storageUsed = normalizeBN(state.storageUsed || { m: 0, e: 0 });
  state.audio = Object.assign({ aiCoreCuePlayed: false }, state.audio || {});
  state.settings = Object.assign(state.settings || {}, loaded.settings || {});
  if (!state.settings.textSize || !["small", "normal", "large"].includes(state.settings.textSize)) {
    state.settings.textSize = "normal";
  }
  state.permanent = state.permanent || { upgrades: {} };
  state.cooling = Object.assign({ fans: 0 }, state.cooling || {});
  const fanTier = getFanTierIndexFromCount(state.cooling?.fans || 0);
  if (typeof state.fanOverclockTier !== "number") state.fanOverclockTier = fanTier;
  if (typeof state.fanOverclockTierCount !== "number") state.fanOverclockTierCount = 0;
  if (typeof state.fanOverclockTimer !== "number") state.fanOverclockTimer = 0;
  if (state.fanOverclockTier < fanTier) {
    state.fanOverclockTier = fanTier;
    state.fanOverclockTierCount = 0;
  }
  if (!state.modifiers || typeof state.modifiers !== "object") state.modifiers = {};
  if (typeof state.modifiers.fanCoolMultiplier !== "number") state.modifiers.fanCoolMultiplier = 1;
  if (typeof state.gameWon !== "boolean") state.gameWon = false;
  if (typeof state.gameOverReason !== "string") {
    state.gameOverReason = state.gameOver ? "storage" : null;
  }
  state.upgrades = state.upgrades || {};
  if (typeof state.storageCap !== "number") state.storageCap = 600;
  state.emergency = Object.assign({ cooldownUntil: 0, shutdownUntil: 0 }, state.emergency || {});
  state.emergency.cooldownUntil = Number(state.emergency.cooldownUntil) || 0;
  state.emergency.shutdownUntil = Number(state.emergency.shutdownUntil) || 0;
  state.contract = Object.assign({ active: null, cooldown: 20, tutorial: [], final: null }, state.contract || {});
  if (!Array.isArray(state.contract.tutorial)) state.contract.tutorial = [];
  if (state.contract.tutorial.length === 0 && (state.stats.contractsCompleted || 0) === 0) {
    state.contract.tutorial = createTutorialContracts();
  }
  if (state.selectedBuilding && BUILDINGS[state.selectedBuilding]?.global) {
    state.selectedBuilding = "Miner";
  }
  state.research = state.research || {};
  if (state.research["basic-logistics"]) {
    state.unlocks.BuySlot = true;
  }
  applySettings();
}

function createSavePayload() {
  return {
    version: state.version,
    gridWidth: state.gridWidth,
    gridSlots: state.gridSlots,
    grid: state.grid.map(tile => ({
      building: tile.building,
      progress: tile.progress,
      localInv: tile.localInv,
      disabledUntil: tile.disabledUntil || 0,
      minerWasteTimer: tile.minerWasteTimer || 0,
      minerWasteInterval: tile.minerWasteInterval || 0,
      minerLevel: tile.minerLevel || 1,
      smelterLevel: tile.smelterLevel || 1,
      smelterCycleCount: tile.smelterCycleCount || 0,
      ashLevel: tile.ashLevel || 1,
      automationRules: tile.automationRules || []
    })),
    selectedBuilding: state.selectedBuilding,
    unlocks: state.unlocks,
    permanent: state.permanent,
    rules: state.rules,
    buildingRuleDefaults: state.buildingRuleDefaults,
    maxRules: state.maxRules,
    upgrades: state.upgrades,
    storageCap: state.storageCap,
    cooling: state.cooling,
    fanOverclockTier: state.fanOverclockTier,
    fanOverclockTierCount: state.fanOverclockTierCount,
    fanOverclockTimer: state.fanOverclockTimer,
    research: state.research,
    achievements: state.achievements,
    stats: state.stats,
    playTime: state.playTime,
    audio: state.audio,
    sabotage: state.sabotage,
    contract: state.contract,
    boss: state.boss,
    gameOver: state.gameOver,
    gameOverReason: state.gameOverReason,
    gameWon: state.gameWon,
    portalBuilt: state.portalBuilt,
    emergency: state.emergency,
    ammo: state.ammo,
    ammoBuff: state.ammoBuff,
    paradoxTokens: state.paradoxTokens,
    modifiers: state.modifiers,
    milestoneNext: state.milestoneNext,
    settings: state.settings,
    perk: state.perk
  };
}

function saveGame() {
  const start = performance.now();
  const payload = createSavePayload();
  const json = JSON.stringify(payload);
  localStorage.setItem(SAVE_KEY, json);
  const elapsed = performance.now() - start;
  if (elapsed > 50) {
    addLog("[SAVE]", `Save took ${elapsed.toFixed(1)}ms (${Math.round(json.length / 1024)}kb).`);
  } else {
    addLog("[SAVE]", "Factory brain archived.");
  }
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    rehydrateState(JSON.parse(raw));
    addLog("[LOAD]", "Memory core reloaded.");
    return true;
  } catch {
    rehydrateState(null);
  }
  return false;
}

function applyPermanentUpgrades() {
  PRESTIGE_UPGRADES.forEach(upgrade => {
    if (state.permanent.upgrades[upgrade.id]) {
      upgrade.apply(state);
    }
  });
}

function purchasePrestigeUpgrade(id) {
  const upgrade = PRESTIGE_UPGRADES.find(u => u.id === id);
  if (!upgrade || state.permanent.upgrades[id]) return false;
  const cost = bnFromNumber(upgrade.cost);
  if (bnCmp(state.paradoxTokens, cost) < 0) return false;
  bnSubInPlace(state.paradoxTokens, cost);
  state.permanent.upgrades[id] = true;
  upgrade.apply(state);
  addLog("[PARADOX]", `Permanent upgrade installed: ${upgrade.name}.`);
  return true;
}
