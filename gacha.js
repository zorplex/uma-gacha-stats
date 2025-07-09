const RATES = [
  { name: "Target SSR", rate: 0.0075, id: "TargetSSR" },
  { name: "SSR", rate: 0.0225, id: "SSR" },
  { name: "SR", rate: 0.1575, id: "SR" },
  { name: "R", rate: 0.8125, id: "R" }
];

const BATCH_SIZE = 10;
const MAX_BATCHES = 20;
const MAX_DRAWS = BATCH_SIZE * MAX_BATCHES;

let allRuns = [];
let rarityCharts = {};

function simulateRun() {
  let counts = { "Target SSR": 0, "SSR": 0, "SR": 0, "R": 0 };
  let targetSSRCount = 0;
  let minBatchesFor4TargetSSR = null;

  for (let batch = 1; batch <= MAX_BATCHES; batch++) {
    for (let i = 0; i < BATCH_SIZE; i++) {
      let roll = Math.random();
      let cumulative = 0;
      for (let rarity of RATES) {
        cumulative += rarity.rate;
        if (roll < cumulative) {
          counts[rarity.name]++;
          if (rarity.name === "Target SSR") {
            targetSSRCount++;
            if (targetSSRCount === 4 && minBatchesFor4TargetSSR === null) {
              minBatchesFor4TargetSSR = batch;
            }
          }
          break;
        }
      }
    }
  }
  if (minBatchesFor4TargetSSR === null) minBatchesFor4TargetSSR = "Not achieved";
  return { ...counts, minBatchesFor4TargetSSR };
}

function updateRecentStats(stats) {
  document.getElementById("recentStats").innerHTML = `
    <ul>
      <li>Target SSR: ${stats["Target SSR"]}</li>
      <li>SSR: ${stats["SSR"]}</li>
      <li>SR: ${stats["SR"]}</li>
      <li>R: ${stats["R"]}</li>
      <li>Min batches for 4 Target SSR: ${stats.minBatchesFor4TargetSSR}</li>
    </ul>
  `;
}

function aggregateStats(runs) {
  const totals = { "Target SSR": 0, "SSR": 0, "SR": 0, "R": 0 };
  const minBatchesArr = [];
  for (const run of runs) {
    totals["Target SSR"] += run["Target SSR"];
    totals["SSR"] += run["SSR"];
    totals["SR"] += run["SR"];
    totals["R"] += run["R"];
    if (typeof run.minBatchesFor4TargetSSR === "number") {
      minBatchesArr.push(run.minBatchesFor4TargetSSR);
    }
  }
  return { totals, minBatchesArr };
}

function percentile(arr, p) {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[idx];
}

function updateAggregateStats() {
  const { totals, minBatchesArr } = aggregateStats(allRuns);
  document.getElementById("aggregateStats").innerHTML = `
    <ul>
      <li>Total Target SSR: ${totals["Target SSR"]}</li>
      <li>Total SSR: ${totals["SSR"]}</li>
      <li>Total SR: ${totals["SR"]}</li>
      <li>Total R: ${totals["R"]}</li>
      <li>Runs with 4 Target SSR: ${minBatchesArr.length} / ${allRuns.length}</li>
      <li>Best (min) batches for 4 Target SSR: ${minBatchesArr.length ? Math.min(...minBatchesArr) : "N/A"}</li>
    </ul>
  `;

  // Percentiles
  let percentiles = [20, 40, 60, 80, 100];
  let percentileStats = percentiles.map(p => {
    let val = percentile(minBatchesArr, p);
    return `<li>${p}th percentile: ${val !== null ? val : "N/A"} batches</li>`;
  }).join("");
  document.getElementById("percentileStats").innerHTML = `<ul>${percentileStats}</ul>`;
}

// Returns a histogram: { countValue: number of runs with that count }
function getRarityHistogram(rarityName) {
  const hist = {};
  for (const run of allRuns) {
    const count = run[rarityName];
    hist[count] = (hist[count] || 0) + 1;
  }
  return hist;
}

function updateRarityCharts() {
  for (const rarity of RATES) {
    const hist = getRarityHistogram(rarity.name);
    const xs = Object.keys(hist).map(Number).sort((a, b) => a - b);
    const ys = xs.map(x => hist[x]);
    const ctx = document.getElementById(`chart-${rarity.id}`).getContext("2d");
    if (!rarityCharts[rarity.id]) {
      rarityCharts[rarity.id] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: xs,
          datasets: [{
            label: `Runs`,
            data: ys,
            backgroundColor: rarity.name === "Target SSR" ? "#FFD700"
                            : rarity.name === "SSR" ? "#C0C0C0"
                            : rarity.name === "SR" ? "#8A2BE2"
                            : "#A9A9A9"
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: `${rarity.name} count in run`, font: { size: 10 } }, ticks: { font: { size: 10 } } },
            y: { title: { display: true, text: "Runs", font: { size: 10 } }, beginAtZero: true, ticks: { font: { size: 10 } } }
          },
          responsive: false,
          maintainAspectRatio: false
        }
      });
    } else {
      rarityCharts[rarity.id].data.labels = xs;
      rarityCharts[rarity.id].data.datasets[0].data = ys;
      rarityCharts[rarity.id].update();
    }
  }
}

document.getElementById("runBtn").addEventListener("click", () => {
  const runStats = simulateRun();
  allRuns.push(runStats);
  updateRecentStats(runStats);
  updateAggregateStats();
  updateRarityCharts();
});

// Initial state
updateRecentStats({ "Target SSR": 0, "SSR": 0, "SR": 0, "R": 0, minBatchesFor4TargetSSR: "N/A" });
updateAggregateStats();
updateRarityCharts();