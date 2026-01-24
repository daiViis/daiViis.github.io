function renderStatus() {
  statusEl.textContent = `Systems steady. ${getStage()}`;
  heatDisplayEl.textContent = `Heat: ${state.heat.toFixed(0)}%`;
  gridStatsEl.textContent = `(${getGridWidth()}x${getGridRows()} | ${state.gridSlots} slots)`;
  blueprintBtn.style.display = state.unlocks.BlueprintConsole ? "inline-flex" : "none";
  const slotCost = { Scrap: 150, Gears: 20 };
  const canBuySlot = state.gridSlots < 144 && canAfford(slotCost);
  if (buySlotBtn) {
    buySlotBtn.disabled = !canBuySlot;
    buySlotBtn.textContent = `Buy Slot (150 Scrap + 20 Gears)`;
  }
  if (fanCounterEl) {
    fanCounterEl.querySelector(".value").textContent = state.cooling?.fans || 0;
  }
  if (heatEdgeEl) {
    const heat = Math.max(0, Math.min(100, state.heat));
    const intensity = heat < 50 ? 0 : Math.min(1, (heat - 50) / 50);
    heatEdgeEl.style.opacity = intensity.toFixed(2);
    heatEdgeEl.style.borderColor = `rgba(248,113,113,${0.3 + intensity * 0.5})`;
    heatEdgeEl.style.boxShadow = `0 0 ${24 + intensity * 30}px rgba(248,113,113,${0.25 + intensity * 0.5})`;
  }
}

function renderGrid() {
  Array.from(gridEl.children).forEach((cell, index) => {
    const tile = state.grid[index];
    cell.innerHTML = "";
    cell.classList.toggle("selected", state.selectedTile === index);
    if (!tile.building) {
      cell.innerHTML = `<div class="label">Empty</div>`;
      cell.title = "Empty tile. Click to build.";
      return;
    }
    const def = BUILDINGS[tile.building];
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = def.name;
    const heat = document.createElement("div");
    heat.className = "heat";
    heat.textContent = def.heat > 0 ? `+${def.heat}` : def.heat;
    const progress = document.createElement("div");
    progress.className = "progress";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = `${Math.min(100, tile.progress * 100)}%`;
    progress.appendChild(bar);
    cell.appendChild(label);
    cell.appendChild(heat);
    cell.appendChild(progress);
    if (tile.transferTime > 0) {
      const transfer = document.createElement("div");
      transfer.className = "transfer";
      transfer.textContent = tile.transferDir === "left" ? "<" : tile.transferDir === "right" ? ">" : tile.transferDir === "up" ? "^" : "v";
      cell.appendChild(transfer);
      tile.transferTime -= 0.1;
    }
    const invText = Object.entries(tile.localInv)
      .filter(([, val]) => bnCmp(val, { m: 0, e: 0 }) > 0)
      .map(([res, val]) => `${res}: ${bnToString(val)}`)
      .join(", ") || "Empty";
    cell.title = `${def.name}\nInputs: ${def.inputs.map(i => `${i.amt} ${i.res}`).join(", ") || "None"}` +
      `\nOutputs: ${def.outputs.map(o => `${o.amt} ${o.res}`).join(", ") || "None"}` +
      `\nSpeed: ${def.speed}/s  Efficiency: ${def.efficiency}` +
      `\nHeat: ${def.heat}` +
      `\nInventory: ${invText}`;
  });
}

function renderPanels() {
  renderResources();
  renderContracts();
  renderBoss();
  renderStory();

  if (isTabActive("buildings")) {
    const counts = getBuildingCounts();
    renderIfChanged("buildings", getBuildingsRenderKey(counts), () => renderBuildings(counts));
  }
  if (isTabActive("research")) {
    renderIfChanged("research", getResearchRenderKey(), renderResearch);
  }
  if (isTabActive("upgrades")) {
    renderIfChanged("upgrades", getUpgradesRenderKey(), renderUpgrades);
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

function render() {
  const now = performance.now();
  if (now - lastStatusRender > 100) {
    renderStatus();
    if (gameOverOverlayEl) {
      gameOverOverlayEl.classList.toggle("active", !!state.gameOver);
    }
    lastStatusRender = now;
  }
  if (now - lastGridRender > 50) {
    renderGrid();
    lastGridRender = now;
  }
  if (now - lastPanelRender > 150) {
    renderPanels();
    lastPanelRender = now;
  }
  requestAnimationFrame(render);
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
  const list = Object.keys(BUILDINGS).map(key => {
    const def = BUILDINGS[key];
    const unlocked = state.unlocks[key];
    const count = def.global ? (state.cooling?.fans || 0) : (counts[key] || 0);
    const costText = Object.entries(def.cost || {}).map(([res, amt]) => `${amt} ${res}`).join(", ") || "Free";
    const selected = state.selectedBuilding === key ? "selected" : "";
    const lockedClass = unlocked ? "" : "locked";
    const tooltip = getBuildingTooltip(def);
    return `<button class="building-btn ${lockedClass} ${selected}" data-building="${key}" title="${tooltip}">
      <span>${def.name} <span class="small">x${count}</span></span>
      <span class="small">${unlocked ? costText : "Locked"}</span>
    </button>`;
  }).join("");
  tabContents.buildings.innerHTML = `<div class="list">${list}</div>`;
}

function renderResearch() {
  const html = ["<div class=\"list\">"];
  RESEARCH_NODES.forEach(node => {
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

function renderUpgrades() {
  const used = getStorageUsedBn();
  const storageInfo = `Storage: ${bnToString(used)} / ${state.storageCap}`;
  const html = ["<div class=\"list\">"];
  const burnStatus = state.burnScrap.active ? "ON" : "OFF";
  html.push(`<div class="card">
    <div>
      <div><strong>Burnt Scrap Purge</strong></div>
      <div class="meta">Consumes 1 Burnt Scrap/sec. Adds +1 heat per building.</div>
    </div>
    <button class="btn secondary" data-burntoggle="1">${burnStatus}</button>
  </div>`);
  html.push(`<div class="card"><strong>Upgrades Bay</strong><div class="meta">${storageInfo}</div></div>`);
  UPGRADE_LIST.forEach(upgrade => {
    const level = state.upgrades?.[upgrade.id] || 0;
    const cost = getUpgradeCost(upgrade);
    const costText = Object.entries(cost).map(([res, amt]) => `${amt} ${res}`).join(", ");
    const afford = canAfford(cost);
    const disabled = (!upgrade.repeatable && level > 0) || !afford;
    html.push(`
      <div class="card">
        <div>
          <div><strong>${upgrade.name}</strong>${upgrade.repeatable ? ` <span class="small">Lv ${level}</span>` : ""}</div>
          <div class="meta">${upgrade.desc}</div>
        </div>
        <button class="btn secondary" data-upgrade="${upgrade.id}" ${disabled ? "disabled" : ""}>
          ${!upgrade.repeatable && level > 0 ? "Owned" : `Buy (${costText})`}
        </button>
      </div>
    `);
  });
  html.push("</div>");
  tabContents.upgrades.innerHTML = html.join("");
  const burnBtn = tabContents.upgrades.querySelector("button[data-burntoggle]");
  if (burnBtn) {
    burnBtn.addEventListener("click", () => {
      toggleBurnScrap();
      renderCache.upgrades = "";
    });
  }
  tabContents.upgrades.querySelectorAll("button[data-upgrade]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (purchaseUpgrade(btn.dataset.upgrade)) {
        triggerRewardEffect(btn);
        pulseLatestLog();
        renderCache.upgrades = "";
      }
    });
  });
}

function handleResearch(id) {
  const node = RESEARCH_NODES.find(n => n.id === id);
  if (!node) return false;
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
  const c = state.contract.active;
  if (!c) {
    contractAreaEl.innerHTML = `<div class="small">No contracts. Awaiting corporate orders.</div>`;
    return;
  }
  const rewardText = c.reward === "grid" ? "+2 grid slots" : "Permanent multiplier";
  if (c.type === "deliver") {
    contractAreaEl.innerHTML = `
      <div class="card">
        <div><strong>Deliver ${c.amount} ${c.resource}</strong></div>
        <div class="small">Time left: ${Math.max(0, Math.floor(c.time))}s</div>
        <div class="progress-bar"><div class="fill" style="width:${(c.progress || 0) * 100}%"></div></div>
        <div class="small">Reward: ${rewardText}</div>
      </div>`;
    return;
  }
  if (c.type === "research") {
    contractAreaEl.innerHTML = `
      <div class="card">
        <div><strong>Research ${c.nodeName}</strong></div>
        <div class="small">Time left: ${Math.max(0, Math.floor(c.time))}s</div>
        <div class="progress-bar"><div class="fill" style="width:${(c.progress || 0) * 100}%"></div></div>
        <div class="small">Reward: ${rewardText}</div>
      </div>`;
    return;
  }
  contractAreaEl.innerHTML = `
    <div class="card">
      <div><strong>Maintain Heat ${c.min}-${c.max}%</strong></div>
      <div class="small">Time left: ${Math.max(0, Math.floor(c.time))}s</div>
      <div class="progress-bar"><div class="fill" style="width:${(c.progressRatio || 0) * 100}%"></div></div>
      <div class="small">Reward: ${rewardText}</div>
    </div>`;
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
  const boss = state.boss.active;
  if (!boss) {
    bossAreaEl.innerHTML = `<div class="small">No boss. For now.</div>`;
    return;
  }
  const hpRatio = Math.max(0, boss.hp / boss.maxHp);
  bossAreaEl.innerHTML = `
    <div class="card">
      <div><strong>${boss.name}</strong></div>
      <div class="small">HP: ${Math.max(0, boss.hp.toFixed(0))}</div>
      <div class="progress-bar"><div class="fill" style="width:${hpRatio * 100}%"></div></div>
      <div class="small">Debuff: ${formatDebuff(boss.debuff)}</div>
      <div class="small">Craft ammo to spike damage.</div>
      <button class="btn secondary" id="craftAmmo">Craft Overclock Chip (20 Gears + 10 Circuits)</button>
      <button class="btn secondary" id="useAmmo">Use Ammo (${state.ammo})</button>
    </div>`;
  const craftBtn = document.getElementById("craftAmmo");
  const useBtn = document.getElementById("useAmmo");
  craftBtn.onclick = () => {
    if (canAfford({ Gears: 20, Circuits: 10 })) {
      spendCost({ Gears: 20, Circuits: 10 });
      state.ammo += 1;
      addLog("[AMMO]", "Overclock Chip crafted.");
    }
  };
  useBtn.onclick = () => {
    if (state.ammo <= 0) return;
    state.ammo -= 1;
    state.ammoBuff = 8;
    addLog("[AMMO]", "Overclock engaged. Boss trembles.");
  };
}

function renderStory() {
  if (!storyAreaEl) return;
  const contract = state.contract.active;
  const guidance = contract?.guide ? `<div class="small">${contract.guide}</div>` : "";
  storyAreaEl.innerHTML = `
    <div><strong>${getStoryBeatTitle()}</strong></div>
    <div class="small">${getStoryBeatText()}</div>
    ${guidance}
  `;
}

function getStoryBeatTitle() {
  if (bnCmp(state.stats.lifetime.Godcoins, bnFromNumber(1)) >= 0) return "The Paradox Bank Opens";
  if (bnCmp(state.stats.lifetime.TimelineInk, bnFromNumber(10)) >= 0) return "Ink for the Chrono Ledger";
  if (bnCmp(state.stats.lifetime.RealityShards, bnFromNumber(10)) >= 0) return "Shards of a Living Planet";
  if (bnCmp(state.stats.lifetime.AICores, bnFromNumber(10)) >= 0) return "Neural Factory Awakens";
  if (bnCmp(state.stats.lifetime.Circuits, bnFromNumber(10)) >= 0) return "The Circuit Dawn";
  return "The First Sparks";
}

function getStoryBeatText() {
  if (bnCmp(state.stats.lifetime.Godcoins, bnFromNumber(1)) >= 0) {
    return "You mint currency that the universe itself must accept. The hyperloop hums in prayer.";
  }
  if (bnCmp(state.stats.lifetime.TimelineInk, bnFromNumber(10)) >= 0) {
    return "Time leaks into the ducts. Every drop of ink writes a new possible reality.";
  }
  if (bnCmp(state.stats.lifetime.RealityShards, bnFromNumber(10)) >= 0) {
    return "The factory is no longer a place. It is an organism wrapped around a planet.";
  }
  if (bnCmp(state.stats.lifetime.AICores, bnFromNumber(10)) >= 0) {
    return "Your machines learned to whisper. They ask for more heat. You comply.";
  }
  if (bnCmp(state.stats.lifetime.Circuits, bnFromNumber(10)) >= 0) {
    return "Circuits bloom like metallic vines. The grid wants to grow.";
  }
  return "Scrap falls like rain. You are the conductor of a new industrial heartbeat.";
}

function applySettings() {
  document.body.classList.toggle("reduced-motion", state.settings.reducedMotion);
  document.body.classList.toggle("colorblind", state.settings.colorblind);
  reducedMotionToggle.checked = state.settings.reducedMotion;
  colorblindToggle.checked = state.settings.colorblind;
  shakeToggle.checked = state.settings.shake;
  fireworksToggle.checked = state.settings.fireworks;
}

function addLog(icon, text) {
  state.log = state.log || [];
  state.log.unshift({ icon, text });
  state.log = state.log.slice(0, 80);
  if (!storyAreaEl) return;
}

function renderTabs() {
  const tabNames = ["buildings", "research", "upgrades", "achievements", "stats"];
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

