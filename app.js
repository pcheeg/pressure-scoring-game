const START_SCORE = 41;
const FINISH_SCORE = 180;
const SHIELD_REGEN_VISITS = 5;

const els = {
  statusText: document.getElementById("statusText"),
  modePill: document.getElementById("modePill"),
  shieldWrap: document.getElementById("shieldWrap"),
  shieldPercent: document.getElementById("shieldPercent"),
  shieldFill: document.getElementById("shieldFill"),
  dangerWrap: document.getElementById("dangerWrap"),
  shieldReturnText: document.getElementById("shieldReturnText"),
  requiredScore: document.getElementById("requiredScore"),
  growthText: document.getElementById("growthText"),
  runText: document.getElementById("runText"),
  bestText: document.getElementById("bestText"),
  hitBtn: document.getElementById("hitBtn"),
  missBtn: document.getElementById("missBtn"),
  undoBtn: document.getElementById("undoBtn"),
  boostPanel: document.getElementById("boostPanel"),
  boostBtn: document.getElementById("boostBtn"),
  choicePanel: document.getElementById("choicePanel"),
  stabiliseBtn: document.getElementById("stabiliseBtn"),
  continueBoostBtn: document.getElementById("continueBoostBtn"),
  gameOver: document.getElementById("gameOver"),
  gameOverTitle: document.getElementById("gameOverTitle"),
  gameOverStats: document.getElementById("gameOverStats"),
  restartBtn: document.getElementById("restartBtn"),
  winScreen: document.getElementById("winScreen"),
  winRestartBtn: document.getElementById("winRestartBtn")
};

let history = [];

let state = {
  required: START_SCORE,
  shield: 100,
  mode: "NORMAL",
  growth: 1,
  boostLevel: 0,
  run: 0,
  best: Number(localStorage.getItem("bestRun") || 0),
  gameOver: false,
  won: false,
  choiceAvailable: false
};

function saveHistory() {
  history.push(JSON.stringify(state));
  if (history.length > 100) history.shift();
}

function shieldVisitsRemaining() {
  return Math.ceil((100 - state.shield) / (100 / SHIELD_REGEN_VISITS));
}

function modeName() {
  if (state.mode === "NORMAL") return "NORMAL";
  if (state.boostLevel === 1) return "BOOST";
  return "BOOST" + "+".repeat(state.boostLevel - 1);
}

function render() {
  const hasShield = state.shield >= 100 && state.mode === "NORMAL";

  els.requiredScore.textContent = `${state.required}+`;
  els.growthText.textContent = `+${state.growth}`;
  els.runText.textContent = state.run;
  els.bestText.textContent = state.best;
  els.modePill.textContent = modeName();

  if (hasShield) {
    els.statusText.textContent = "SHIELD";
    els.shieldWrap.classList.remove("hidden");
    els.dangerWrap.classList.add("hidden");
    els.shieldPercent.textContent = `${Math.round(state.shield)}%`;
    els.shieldFill.style.width = `${state.shield}%`;
  } else {
    els.statusText.textContent = "NO ROOM FOR ERROR";
    els.shieldWrap.classList.add("hidden");
    els.dangerWrap.classList.remove("hidden");
    els.shieldReturnText.textContent = `SHIELD IN ${shieldVisitsRemaining()} VISIT${shieldVisitsRemaining() === 1 ? "" : "S"}`;
  }

  els.boostPanel.classList.toggle("hidden", !(state.mode === "NORMAL" && state.shield >= 100 && !state.choiceAvailable));
  els.choicePanel.classList.toggle("hidden", !state.choiceAvailable);
  els.undoBtn.disabled = history.length === 0;
}

function success() {
  if (state.gameOver || state.won) return;
  saveHistory();

  state.run += 1;
  if (state.run > state.best) {
    state.best = state.run;
    localStorage.setItem("bestRun", String(state.best));
  }

  if (state.mode !== "NORMAL") {
    state.shield = Math.min(100, state.shield + (100 / SHIELD_REGEN_VISITS));
    if (state.shield >= 100) {
      state.shield = 100;
      state.choiceAvailable = true;
    }
  } else if (state.shield < 100) {
    state.shield = Math.min(100, state.shield + (100 / SHIELD_REGEN_VISITS));
  }

  if (state.required >= FINISH_SCORE) {
    state.won = true;
    els.winScreen.classList.remove("hidden");
    render();
    return;
  }

  state.required = Math.min(FINISH_SCORE, state.required + state.growth);
  render();
}

function miss() {
  if (state.gameOver || state.won) return;
  saveHistory();

  if (state.mode === "NORMAL" && state.shield >= 100) {
    state.shield = 0;
    render();
    return;
  }

  state.gameOver = true;
  els.gameOverTitle.textContent = "No room for error.";
  els.gameOverStats.textContent = `Run: ${state.run} · Required reached: ${state.required}+`;
  els.gameOver.classList.remove("hidden");
  render();
}

function boost() {
  if (state.mode !== "NORMAL" || state.shield < 100) return;
  saveHistory();

  state.mode = "BOOST";
  state.boostLevel = 1;
  state.growth = 2;
  state.shield = 40; // 3 successful boosted visits restores shield.
  state.choiceAvailable = false;
  render();
}

function stabilise() {
  if (!state.choiceAvailable) return;
  saveHistory();

  state.mode = "NORMAL";
  state.boostLevel = 0;
  state.growth = 1;
  state.shield = 100;
  state.choiceAvailable = false;
  render();
}

function continueBoost() {
  if (!state.choiceAvailable) return;
  saveHistory();

  state.boostLevel += 1;
  state.mode = "BOOST";
  state.growth = state.boostLevel + 1;
  state.shield = 40; // another 3 successful visits until next choice.
  state.choiceAvailable = false;
  render();
}

function undo() {
  const previous = history.pop();
  if (!previous) return;
  state = JSON.parse(previous);
  els.gameOver.classList.add("hidden");
  els.winScreen.classList.add("hidden");
  render();
}

function restart() {
  history = [];
  state = {
    required: START_SCORE,
    shield: 100,
    mode: "NORMAL",
    growth: 1,
    boostLevel: 0,
    run: 0,
    best: Number(localStorage.getItem("bestRun") || 0),
    gameOver: false,
    won: false,
    choiceAvailable: false
  };
  els.gameOver.classList.add("hidden");
  els.winScreen.classList.add("hidden");
  render();
}

els.hitBtn.addEventListener("click", success);
els.missBtn.addEventListener("click", miss);
els.undoBtn.addEventListener("click", undo);
els.boostBtn.addEventListener("click", boost);
els.stabiliseBtn.addEventListener("click", stabilise);
els.continueBoostBtn.addEventListener("click", continueBoost);
els.restartBtn.addEventListener("click", restart);
els.winRestartBtn.addEventListener("click", restart);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

render();
