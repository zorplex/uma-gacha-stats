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
  let showRainbow = false;
  statsArray.forEach((stats, idx) => {
    let targetSSR = stats["Target SSR"];
    let targetSSRHtml = targetSSR > 0
      ? `<span class="rainbow-text">${targetSSR}</span>`
      : `${targetSSR}`;
    if (targetSSR > 0) showRainbow = true;
    html += `<li>
      <ul>
        <li>Target SSR: ${targetSSRHtml}</li>
        <li>Off-Target SSR: ${stats["SSR"]}</li>
        <li>SR: ${stats["SR"]}</li>
        <li>R: ${stats["R"]}</li>
        <li>Min batches for 4 Target SSR: ${stats.minBatchesFor4TargetSSR}</li>
      </ul>
    </li>`;
  });
  html += '</ol>';
  document.getElementById("recentStats").innerHTML = html;
  // Show/hide SUCCESS banner
  const banner = document.getElementById("successBanner");
  if (showRainbow) {
    // Allow multiple floating SUCCESS! messages at once
    const floatId = `successFloat_${Date.now()}_${Math.floor(Math.random()*10000)}`;
    const floatDiv = document.createElement('span');
    floatDiv.className = 'rainbow-success';
    floatDiv.id = floatId;
    floatDiv.textContent = 'SUCCESS!';
    banner.appendChild(floatDiv);
    // Animate float and fade out
    floatDiv.style.opacity = '1';
    floatDiv.style.transform = 'translateY(0)';
    floatDiv.style.transition = 'opacity 1.2s linear, transform 1.2s cubic-bezier(0.4,0,0.2,1)';
    setTimeout(() => {
      floatDiv.style.opacity = '0';
      floatDiv.style.transform = 'translateY(-60px)';
    }, 1200); // stay visible for 1.2s before fading
    setTimeout(() => {
      if (floatDiv.parentNode) floatDiv.parentNode.removeChild(floatDiv);
    }, 2500); // total time: 2.5s
  }
  // If not showRainbow and no floating messages, clear banner
  if (!showRainbow && banner.childElementCount === 0) {
    banner.innerHTML = '';
  }
  // Particle effect if Target SSR was pulled
  if (showRainbow) triggerRainbowParticles();
}

// --- Rainbow Particle Effect ---
function triggerRainbowParticles() {
  // Create a new canvas for each effect instance
  const baseCanvas = document.getElementById('rainbow-particles');
  if (!baseCanvas) return;
  // Clone the base canvas for a new effect
  const canvas = baseCanvas.cloneNode(false);
  canvas.removeAttribute('id');
  canvas.style.display = 'block';
  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = 9999;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const colors = ['#ff00cc', '#3333ff', '#00ffcc', '#ffff00', '#ff6600', '#ff00cc'];
  const particles = [];
  const count = 80;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2.5;
  for (let i = 0; i < count; ++i) {
    const angle = Math.random() * 2 * Math.PI;
    const speed = 12 + Math.random() * 10;
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 60 + Math.random() * 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1.0,
      gravity: 0.45 + Math.random() * 0.15,
      exploded: false
    });
  }
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      if (p.alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.25, p.color);
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }
  function update() {
    for (const p of particles) {
      if (frame > 18) {
        p.vy += p.gravity;
        p.vx *= 0.985;
        p.vy *= 0.985;
      } else {
        p.vx *= 0.98;
        p.vy *= 0.98;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (frame > 18) {
        p.alpha -= 0.012 + Math.random() * 0.012;
      } else {
        p.alpha -= 0.004 + Math.random() * 0.004;
      }
      if (p.y + p.r > canvas.height) {
        p.y = canvas.height - p.r;
        p.vy *= -0.2 * (0.5 + Math.random() * 0.5);
        p.vx *= 0.7;
      }
      if (p.alpha < 0) p.alpha = 0;
    }
  }
  function animate() {
    draw();
    update();
    frame++;
    if (frame < 120 && particles.some(p => p.alpha > 0.05)) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  animate();
}

function aggregateStats(runs) {
  const totals = { "Target SSR": 0, "SSR": 0, "SR": 0, "R": 0 };
  const minBatchesArr = [];
  for (const run of runs) {
    totals["Target SSR"] += run["Target SSR"];
    totals["SSR"] += run["SSR"];
    totals["SR"] += run["SR"];
    totals["R"] += run["R"];
    // For 3 Target SSR, we need to estimate the batch in which the 3rd was obtained
    if (run["Target SSR"] >= 3) {
      // Simulate the run again to find the batch where the 3rd Target SSR was obtained
      let count = 0;
      let foundBatch = null;
      let batch = 1;
      outer: for (; batch <= 20; ++batch) {
        for (let i = 0; i < 10; ++i) {
          let roll = Math.random();
          let cumulative = 0;
          for (let rarity of RATES) {
            cumulative += rarity.rate;
            if (roll < cumulative) {
              if (rarity.name === "Target SSR") {
                count++;
                if (count === 3) {
                  foundBatch = batch;
                  break outer;
                }
              }
              break;
            }
          }
        }
      }
      minBatchesArr.push(foundBatch !== null ? foundBatch : "N/A");
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
  // Calculate percent for runs with 3 Target SSR
  let percentWith3 = allRuns.length > 0 ? ((minBatchesArr.length / allRuns.length) * 100).toFixed(1) : "0.0";
  // Calculate total pulls
  let totalPulls = allRuns.length * MAX_DRAWS;
  let percentTargetSSR = totalPulls > 0 ? ((totals["Target SSR"] / totalPulls) * 100).toFixed(2) : "0.00";
  let percentSSR = totalPulls > 0 ? ((totals["SSR"] / totalPulls) * 100).toFixed(2) : "0.00";
  let percentSR = totalPulls > 0 ? ((totals["SR"] / totalPulls) * 100).toFixed(2) : "0.00";
  let percentR = totalPulls > 0 ? ((totals["R"] / totalPulls) * 100).toFixed(2) : "0.00";
  document.getElementById("aggregateStats").innerHTML = `
    <ul>
      <li>Total Target SSR: ${totals["Target SSR"]} (${percentTargetSSR}%)</li>
      <li>Total SSR: ${totals["SSR"]} (${percentSSR}%)</li>
      <li>Total SR: ${totals["SR"]} (${percentSR}%)</li>
      <li>Total R: ${totals["R"]} (${percentR}%)</li>
      <li>Runs with 3 Target SSR: ${minBatchesArr.length} / ${allRuns.length} (${percentWith3}%)</li>
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


// Hall of Shame data
let shameBatchCounts = [];
let shameChart = null;

function simulateShameRun() {
  // Pull batches until 3 Target SSR are hit, record total batches needed
  let count = 0;
  let batch = 0;
  while (count < 3) {
    batch++;
    // Pitty mechanic: every 20th batch after the first 20, increase Target SSR count by 1
    if (batch > 21 && (batch - 1) % 20 === 0) {
      count++;
      if (count >= 3) break;
    }
    for (let i = 0; i < 10; ++i) {
      let roll = Math.random();
      let cumulative = 0;
      for (let rarity of RATES) {
        cumulative += rarity.rate;
        if (roll < cumulative) {
          if (rarity.name === "Target SSR") {
            count++;
          }
          break;
        }
      }
    }
  }
  return batch;
}

function updateShameChart() {
  // Only show runs that took more than 20 batches
  const over20 = shameBatchCounts.filter(x => x > 20);
  const hist = {};
  over20.forEach(x => { hist[x] = (hist[x] || 0) + 1; });
  const xs = Object.keys(hist).map(Number).sort((a, b) => a - b);
  const ys = xs.map(x => hist[x]);
  const ctx = document.getElementById("shameChart").getContext("2d");
  if (!shameChart) {
    shameChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: xs,
        datasets: [{
          label: 'Runs needing >20 batches for 3 Target SSR',
          data: ys,
          backgroundColor: '#e57373'
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Batches needed' }, ticks: { font: { size: 10 } } },
          y: { title: { display: true, text: 'Runs' }, beginAtZero: true, ticks: { font: { size: 10 } } }
        },
        responsive: false,
        maintainAspectRatio: false
      }
    });
  } else {
    shameChart.data.labels = xs;
    shameChart.data.datasets[0].data = ys;
    shameChart.update();
  }
}

function updateShameStats() {
  if (shameBatchCounts.length === 0) {
    document.getElementById("shameStats").innerHTML = '<i>No data yet.</i>';
    return;
  }
  // Percentile buckets with MODE, MEDIAN, MEAN
  let percentiles = [0, 20, 40, 60, 80, 100];
  let sorted = [...shameBatchCounts].sort((a, b) => a - b);
  let percentileStats = '';
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
  let maxBatch = Math.max(...shameBatchCounts);
  document.getElementById("shameStats").innerHTML = `
    <ul>
      <li>Highest batch count to get 3 Target SSR: ${maxBatch}</li>
      ${percentileStats}
    </ul>
  `;
}

document.getElementById("runBtn").addEventListener("click", () => {
  const runCount = Math.max(1, Math.min(1000000, parseInt(document.getElementById("runCount").value) || 1));
  let newRuns = [];
  let newShame = [];
  for (let i = 0; i < runCount; ++i) {
    const runStats = simulateRun();
    allRuns.push(runStats);
    newRuns.push(runStats);
    // Hall of Shame
    newShame.push(simulateShameRun());
  }
  shameBatchCounts.push(...newShame);
  updateRecentStats(newRuns);
  updateAggregateStats();
  updateRarityCharts();
  updateShameChart();
  updateShameStats();
});

// Add Reset button handler
document.getElementById("resetBtn").addEventListener("click", () => {
  // Clear all data
  allRuns = [];

  // Destroy all rarity charts if they exist
  for (const key in rarityCharts) {
    if (rarityCharts[key]) {
      rarityCharts[key].destroy();
      rarityCharts[key] = null;
    }
  }
  rarityCharts = {};

  // Destroy shame chart if it exists
  if (shameChart) {
    shameChart.destroy();
    shameChart = null;
  }
  shameBatchCounts = [];

  // Reset UI to initial state
  updateRecentStats([]);
  updateAggregateStats();
  updateRarityCharts();
  updateShameChart();
  updateShameStats();
});

// Initial state: show empty
updateRecentStats([]);
updateAggregateStats();
updateRarityCharts();
updateShameChart();
updateShameStats();