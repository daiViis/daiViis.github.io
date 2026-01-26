const RESOURCE_LIST = [
  { key: "Scrap", label: "Scrap" },
  { key: "Gears", label: "Gears" },
  { key: "Circuits", label: "Circuits" },
  { key: "AICores", label: "AI Cores" },
  { key: "RealityShards", label: "Reality Shards" },
  { key: "TimelineInk", label: "Timeline Ink" },
  { key: "Godcoins", label: "Godcoins" },
  { key: "EchoDust", label: "Echo Dust" },
  { key: "BurntScrap", label: "Burnt Scrap" }
];
const BUILDINGS = {
  Miner: {
    name: "Miner",
    inputs: [],
    outputs: [{ res: "Scrap", amt: 1 }],
    speed: 1.2,
    efficiency: 1,
    heat: 1,
    glitch: 0,
    cost: { Scrap: 8 },
    desc: "Chews the dirt for Scrap."
  },
  Smelter: {
    name: "Smelter",
    inputs: [{ res: "Scrap", amt: 2 }],
    outputs: [{ res: "Gears", amt: 1 }],
    speed: 0.9,
    efficiency: 1,
    heat: 2,
    glitch: 0,
    cost: { Scrap: 40 },
    desc: "Melts Scrap into angry Gears."
  },
  Assembler: {
    name: "Assembler",
    inputs: [{ res: "Gears", amt: 2 }],
    outputs: [{ res: "Circuits", amt: 1 }],
    speed: 0.7,
    efficiency: 1,
    heat: 2.5,
    glitch: 0,
    cost: { Gears: 18 },
    desc: "Builds Circuits, regrets nothing."
  },
  Printer: {
    name: "Printer",
    inputs: [{ res: "Circuits", amt: 2 }],
    outputs: [{ res: "AICores", amt: 1 }],
    speed: 0.55,
    efficiency: 1,
    heat: 3,
    glitch: 0,
    cost: { Circuits: 14 },
    desc: "Prints AI Cores in neon silence."
  },
  Lab: {
    name: "Lab",
    inputs: [{ res: "AICores", amt: 2 }],
    outputs: [{ res: "RealityShards", amt: 1 }],
    speed: 0.45,
    efficiency: 1,
    heat: 3.5,
    glitch: 0,
    cost: { AICores: 10 },
    desc: "Rewrites physics in the break room."
  },
  Reactor: {
    name: "Reactor",
    inputs: [{ res: "RealityShards", amt: 2 }],
    outputs: [{ res: "TimelineInk", amt: 1 }],
    speed: 0.35,
    efficiency: 1,
    heat: 4,
    glitch: 0,
    cost: { RealityShards: 8 },
    desc: "Brews Timeline Ink with a wink."
  },
  Portal: {
    name: "Portal",
    inputs: [{ res: "TimelineInk", amt: 2 }],
    outputs: [{ res: "Godcoins", amt: 1 }],
    speed: 0.25,
    efficiency: 1,
    heat: 5,
    glitch: 0,
    cost: { TimelineInk: 500 },
    desc: "Spits out currency for gods."
  },
  ChronoForge: {
    name: "Chrono Forge",
    inputs: [{ res: "TimelineInk", amt: 1 }, { res: "Godcoins", amt: 1 }],
    outputs: [{ res: "EchoDust", amt: 1 }],
    speed: 0.2,
    efficiency: 1,
    heat: 6,
    glitch: 0,
    cost: { TimelineInk: 20, Godcoins: 10 },
    desc: "Presses time into Echo Dust."
  },
  Fan: {
    name: "Fan",
    inputs: [],
    outputs: [],
    speed: 0,
    efficiency: 0,
    heat: -2.5,
    glitch: 0,
    cost: { Scrap: 100 },
    global: true,
    support: "cooling",
    cool: 2.5,
    desc: "Blows chill into the abyss."
  },
  CryoPipe: {
    name: "Cryo Pipe",
    inputs: [],
    outputs: [],
    speed: 0,
    efficiency: 0,
    heat: -4,
    glitch: 0,
    cost: { AICores: 30 },
    support: "cooling",
    cool: 4,
    desc: "Siphons entropy into ice."
  },
  VoidRadiator: {
    name: "Void Radiator",
    inputs: [],
    outputs: [],
    speed: 0,
    efficiency: 0,
    heat: -7,
    glitch: 0,
    cost: { Gears: 80, Circuits: 60 },
    support: "cooling",
    cool: 7,
    desc: "Radiates heat into nothing."
  },
  CounterIntel: {
    name: "Counter-Intel",
    inputs: [],
    outputs: [],
    speed: 0,
    efficiency: 0,
    heat: 0,
    glitch: 0,
    cost: { Circuits: 80, Gears: 120 },
    support: "counter",
    desc: "Spies on the spies."
  },
  AshCleaner: {
    name: "Ash Cleaner",
    inputs: [{ res: "BurntScrap", amt: 2 }],
    outputs: [],
    speed: 1,
    efficiency: 1,
    heat: 0.5,
    glitch: 0,
    cost: { Scrap: 80 },
    desc: "Consumes 2 Burnt Scrap/sec. Shuts down when out."
  }
};
const RESEARCH_NODES = [
  { id: "basic-logistics", name: "Basic Logistics", cost: { Scrap: 150 }, prereq: [], effect: s => { s.modifiers.transferBoost += 0.1; s.unlocks.BuySlot = true; } },
  { id: "assembler-unlock", name: "Assembler Doctrine", cost: { Gears: 60 }, prereq: ["basic-logistics"], unstable: true,
    variants: [
      { id: "assembler-speed", name: "Speed Focus", desc: "+25% Assembler speed", apply: s => s.modifiers.assemblerSpeed *= 1.25 },
      { id: "assembler-eff", name: "Efficiency Focus", desc: "-20% Assembler input", apply: s => s.modifiers.assemblerEfficiency *= 1.2 },
      { id: "assembler-chaos", name: "Chaos Focus", desc: "Assemblers randomly double outputs", apply: s => s.modifiers.assemblerChaos = true }
    ]
  },
  { id: "printer-unlock", name: "Printer License", cost: { Circuits: 40 }, prereq: ["assembler-unlock"], effect: s => s.unlocks.Printer = true },
  { id: "lab-unlock", name: "Lab Containment", cost: { AICores: 30 }, prereq: ["printer-unlock"], effect: s => s.unlocks.Lab = true },
  { id: "reactor-unlock", name: "Reactor Etiquette", cost: { RealityShards: 20 }, prereq: ["lab-unlock"], effect: s => s.unlocks.Reactor = true },
  { id: "portal-unlock", name: "Portal Etiquette", cost: { TimelineInk: 15 }, prereq: ["reactor-unlock"], effect: s => s.unlocks.Portal = true },
  { id: "cryo-unlock", name: "Cryo Plumbing", cost: { Gears: 120 }, prereq: ["basic-logistics"], effect: s => s.unlocks.CryoPipe = true }
];
const UPGRADE_LIST = [
  {
    id: "storage-silo",
    name: "Storage Silo",
    desc: "Doubles storage capacity.",
    cost: { Scrap: 120, Gears: 30 },
    repeatable: true,
    effect: s => { s.storageCap *= 2; }
  },
  {
    id: "miner-turbo",
    name: "Miner Turbo",
    desc: "Miners work 15% faster.",
    cost: { Scrap: 200, Gears: 60 },
    repeatable: false,
    effect: s => { s.modifiers.minerSpeed *= 1.15; }
  },
  {
    id: "smelter-furnace",
    name: "Smelter Furnace",
    desc: "Smelters work 12% faster.",
    cost: { Scrap: 300, Gears: 90 },
    repeatable: false,
    effect: s => { s.modifiers.smelterSpeed *= 1.12; }
  },
  {
    id: "fan-overclock",
    name: "Fan Overclock",
    desc: "Requires 6 fans. Overclock via fan menu.",
    cost: { Scrap: 50 },
    repeatable: true,
    minFans: 6,
    effect: s => { s.modifiers.fanCoolMultiplier = (s.modifiers.fanCoolMultiplier || 1); }
  }
];
const PRESTIGE_UPGRADES = [
  { id: "stability-core", name: "Stability Core", cost: 5, desc: "+8% global speed permanently.", apply: s => s.modifiers.globalSpeed *= 1.08 },
  { id: "chrono-forge", name: "Chrono Forge", cost: 6, desc: "Unlocks Chrono Forge building.", apply: s => s.unlocks.ChronoForge = true },
  { id: "echo-spectrum", name: "Echo Spectrum", cost: 8, desc: "Unlocks Echo Dust resource.", apply: s => s.unlocks.EchoDust = true },
  { id: "blueprint-console", name: "Blueprint Console", cost: 5, desc: "Adds a Blueprint button for auto-build.", apply: s => s.unlocks.BlueprintConsole = true }
];
const ACHIEVEMENTS = [
  { id: "first-meltdown", name: "First Meltdown", desc: "The reactor is flirting with disaster.", check: s => s.stats.meltdowns >= 1, reward: s => s.unlocks.BurntTech = true },
  { id: "scrap-1e12", name: "1e12 Scrap", desc: "Auto-blueprinting unlocked.", check: s => bnCmp(s.stats.lifetime.Scrap, bnFromNumber(1e12)) >= 0, reward: s => s.modifiers.autoBlueprint = true },
  { id: "boss-down", name: "Boss Down", desc: "First boss defeated.", check: s => s.stats.bossesDefeated >= 1, reward: s => s.modifiers.globalSpeed *= 1.1 }
];
const BOSSES = [
  { id: "tax-leviathan", name: "Tax Leviathan", resource: "Circuits", threshold: 1e3, hp: 5000, debuff: { speed: 0.85 } },
  { id: "heat-seraph", name: "Heat Seraph", resource: "AICores", threshold: 1e4, hp: 20000, debuff: { heat: 1.2 } },
  { id: "audit-hydra", name: "Audit Hydra", resource: "RealityShards", threshold: 1e5, hp: 90000, debuff: { disable: "Smelter" } },
  { id: "entropy-accountant", name: "Entropy Accountant", resource: "TimelineInk", threshold: 1e6, hp: 350000, debuff: { speed: 0.7 } },
  { id: "patch-notes", name: "The Patch Notes", resource: "Godcoins", threshold: 1e7, hp: 1200000, debuff: { speed: 0.75 } }
];
const TIMELINE_PERKS = [
  { id: "stable", name: "Stable Reality", desc: "Heat grows slower, more consistent.", apply: s => s.modifiers.meltdownResist += 0.15 },
  { id: "chaos", name: "Chaos Engine", desc: "+15% global speed, riskier heat.", apply: s => { s.modifiers.globalSpeed *= 1.15; s.modifiers.meltdownResist = Math.max(0, s.modifiers.meltdownResist - 0.05); } },
  { id: "efficiency", name: "Hyper Efficiency", desc: "Slow start, absurd endgame.", apply: s => { s.modifiers.hyperEfficiency = true; } }
];
const SAVE_KEY = "hyperloop-hellfactory-save";
const TICK_RATE = 0.2;
