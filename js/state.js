let state = null;

function createTile() {
  return { building: null, progress: 0, visualProgress: 0, visualSpeed: 0, localInv: {}, transferDir: null, transferTime: 0, disabledUntil: 0 };
}

function createDefaultState() {
  const gridWidth = 3;
  const gridSlots = gridWidth * gridWidth;
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
    storageUsed: { m: 0, e: 0 },
    heat: 0,
    throttleReactor: 0,
    labPriority: 0,
    unlocks: {
      Miner: true, Smelter: true, Assembler: true, Printer: false, Lab: false, Reactor: false, Portal: false,
      ChronoForge: false, Fan: true, CryoPipe: false, VoidRadiator: false, CounterIntel: false,
      BurntTech: false, EchoDust: false, BlueprintConsole: false
    },
    permanent: { upgrades: {} },
    rules: [],
    maxRules: 0,
    upgrades: {},
    storageCap: 600,
    cooling: { fans: 0 },
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
    contract: { active: null, cooldown: 20 },
    boss: { active: null, defeated: [] },
    gameOver: false,
    burnScrap: { active: false, timer: 0 },
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
      fanCoolBonus: 0
    },
    milestoneNext: {
      Scrap: 3, Gears: 6, Circuits: 6, AICores: 6, RealityShards: 6, TimelineInk: 6, Godcoins: 6, EchoDust: 6
    },
    settings: {
      reducedMotion: false,
      colorblind: false,
      shake: true,
      fireworks: true
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
  Object.assign(state, loaded);
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
    disabledUntil: tile.disabledUntil || 0
  }));
  if (state.grid.length < state.gridSlots) {
    const missing = state.gridSlots - state.grid.length;
    for (let i = 0; i < missing; i++) state.grid.push(createTile());
  }
  if (state.grid.length > state.gridSlots) {
    state.grid = state.grid.slice(0, state.gridSlots);
  }
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
  RESOURCE_LIST.forEach(r => {
    state.productionRates[r.key] = normalizeBN(state.productionRates[r.key]);
    state.productionBuffer[r.key] = normalizeBN(state.productionBuffer[r.key]);
    state.totals[r.key] = normalizeBN(state.totals[r.key]);
  });
  state.storageUsed = normalizeBN(state.storageUsed || { m: 0, e: 0 });
  state.audio = Object.assign({ aiCoreCuePlayed: false }, state.audio || {});
  state.settings = Object.assign(state.settings || {}, loaded.settings || {});
  state.permanent = state.permanent || { upgrades: {} };
  state.cooling = Object.assign({ fans: 0 }, state.cooling || {});
  state.upgrades = state.upgrades || {};
  if (typeof state.storageCap !== "number") state.storageCap = 600;
  state.burnScrap = Object.assign({ active: false, timer: 0 }, state.burnScrap || {});
  if (state.selectedBuilding && BUILDINGS[state.selectedBuilding]?.global) {
    state.selectedBuilding = "Miner";
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
      disabledUntil: tile.disabledUntil || 0
    })),
    selectedBuilding: state.selectedBuilding,
    unlocks: state.unlocks,
    permanent: state.permanent,
    rules: state.rules,
    maxRules: state.maxRules,
    upgrades: state.upgrades,
    storageCap: state.storageCap,
    cooling: state.cooling,
    research: state.research,
    achievements: state.achievements,
    stats: state.stats,
    audio: state.audio,
    sabotage: state.sabotage,
    contract: state.contract,
    boss: state.boss,
    gameOver: state.gameOver,
    burnScrap: state.burnScrap,
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
