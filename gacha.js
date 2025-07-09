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

function updateRecentStats(statsArray) {
  // statsArray: array of stats objects
  let html = '<ol style="padding-left: 1.5em;">';
  statsArray.forEach((stats, idx) => {
    html += `<li>
      <ul>
        <li>Target SSR: ${stats["Target SSR"]}</li>
        <li>Off-Target SSR: ${stats["SSR"]}</li>
        <li>SR: ${stats["SR"]}</li>
        <li>R: ${stats["R"]}</li>
        <li>Min batches for 4 Target SSR: ${stats.minBatchesFor4TargetSSR}</li>
      </ul>
    </li>`;
  });
  html += '</ol>';
  document.getElementById("recentStats").innerHTML = html;
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

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
function mode(arr) {
  if (!arr.length) return 0;
  const freq = {};
  arr.forEach(x => { freq[x] = (freq[x] || 0) + 1; });
  let max = 0, modeVal = arr[0];
  for (const k in freq) {
    if (freq[k] > max) {
      max = freq[k];
      modeVal = k;
    }
  }
  return modeVal;
}

function updateAggregateStats() {
  const { totals, minBatchesArr } = aggregateStats(allRuns);
  // Calculate percent for runs with 4 Target SSR
  let percentWith4 = allRuns.length > 0 ? ((minBatchesArr.length / allRuns.length) * 100).toFixed(1) : "0.0";
  document.getElementById("aggregateStats").innerHTML = `
    <ul>
      <li>Total Target SSR: ${totals["Target SSR"]}</li>
      <li>Total SSR: ${totals["SSR"]}</li>
      <li>Total SR: ${totals["SR"]}</li>
      <li>Total R: ${totals["R"]}</li>
      <li>Runs with 4 Target SSR: ${minBatchesArr.length} / ${allRuns.length} (${percentWith4}%)</li>
    </ul>
  `;

  // Hall of Fame section
  let bestBatches = minBatchesArr.length ? Math.min(...minBatchesArr) : "N/A";
  let mostTargetSSR = allRuns.length ? Math.max(...allRuns.map(run => run["Target SSR"])) : "N/A";
  let mostSSR = allRuns.length ? Math.max(...allRuns.map(run => run["SSR"])) : "N/A";
  document.getElementById("hallOfFame").innerHTML = `
    <h3>Hall of Fame</h3>
    <ul>
      <li>Best (min) batches for 4 Target SSR: ${bestBatches}</li>
      <li>Most Target SSR in a run: ${mostTargetSSR}</li>
      <li>Most SSR in a run: ${mostSSR}</li>
    </ul>
  `;

  // Percentiles: show number of Target SSRs achieved by each percentile of ALL runs, and stats for each bucket
  let percentiles = [0, 20, 40, 60, 80, 100];
  let targetSSRCountsAll = allRuns.map(run => run["Target SSR"]);
  let percentileStats = '';
  if (targetSSRCountsAll.length > 0) {
    let sorted = [...targetSSRCountsAll].sort((a, b) => a - b);
    for (let i = 0; i < percentiles.length - 1; ++i) {
      let pStart = percentiles[i];
      let pEnd = percentiles[i+1];
      let startIdx = Math.floor((pStart/100) * sorted.length);
      let endIdx = Math.ceil((pEnd/100) * sorted.length);
      let bucket = sorted.slice(startIdx, endIdx);
      let bucketLabel = `${pStart+1}-${pEnd}th percentile`;
      if (pStart === 0) bucketLabel = `1-${pEnd}th percentile`;
      if (bucket.length === 0) {
        percentileStats += `<li>${bucketLabel}: N/A</li>`;
      } else {
        let m = mode(bucket);
        let med = median(bucket);
        let meanVal = mean(bucket).toFixed(2);
        percentileStats += `<li>${bucketLabel}: MODE=${m}, MEDIAN=${med}, MEAN=${meanVal}</li>`;
      }
    }
  }
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
    // Collect all counts for this rarity
    const allCounts = allRuns.map(run => run[rarity.name]);
    // Compute stats
    const m = mean(allCounts);
    const med = median(allCounts);
    const mo = mode(allCounts);
    // Update stats display
    document.getElementById(`stats-${rarity.id}`).innerHTML =
      `<b>MODE:</b> ${mo} &nbsp; <b>MEDIAN:</b> ${med} &nbsp; <b>MEAN:</b> ${m.toFixed(2)}`;
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
  const runCount = Math.max(1, Math.min(1000, parseInt(document.getElementById("runCount").value) || 1));
  let newRuns = [];
  for (let i = 0; i < runCount; ++i) {
    const runStats = simulateRun();
    allRuns.push(runStats);
    newRuns.push(runStats);
  }
  updateRecentStats(newRuns);
  updateAggregateStats();
  updateRarityCharts();
});

// Initial state: show empty
updateRecentStats([]);
updateAggregateStats();
updateRarityCharts();