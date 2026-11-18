/* ===== Interactive charts for the portfolio =====
   Every number here comes from Given's own project reports and datasets.
   Hover a chart to see the values. Click a legend item to hide or show it. */

const GREEN = '#1E5B3A';
const LIGHT_GREEN = '#8FB39C';
const GOLD = '#C9A227';
const SAND = '#E9CF7A';

Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
Chart.defaults.font.size = 13;
Chart.defaults.color = '#3D4A42';
Chart.defaults.plugins.legend.position = 'bottom';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.maintainAspectRatio = false;

/* Callout labels for doughnut charts: a line from each slice out to its name, value and share. */
function calloutSide(chart) { return Math.max(70, Math.min(130, chart.width * 0.24)); }
function calloutPadding(c) { const s = calloutSide(c.chart); return { left: s, right: s, top: 26, bottom: 26 }; }
const doughnutCallouts = {
  id: 'doughnutCallouts',
  afterDatasetsDraw(chart) {
    if (chart.config.type !== 'doughnut') return;
    const ds = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    const total = ds.data.reduce((a, b) => a + b, 0);
    const fmt = ds.calloutValue || ((v) => String(v));
    const ctx = chart.ctx;
    const maxText = calloutSide(chart) - 26;
    const items = [];
    meta.data.forEach((arc, i) => {
      if (!chart.getDataVisibility(i) || !ds.data[i]) return;
      const a = (arc.startAngle + arc.endAngle) / 2;
      const r = arc.outerRadius;
      const cx = arc.x, cy = arc.y;
      const right = Math.cos(a) >= 0;
      items.push({
        i, right,
        x0: cx + Math.cos(a) * (r + 3), y0: cy + Math.sin(a) * (r + 3),
        x1: cx + Math.cos(a) * (r + 16), y1: cy + Math.sin(a) * (r + 16),
        name: chart.data.labels[i],
        detail: fmt(ds.data[i]) + ' · ' + Math.round(ds.data[i] / total * 100) + '%',
        color: Array.isArray(ds.backgroundColor) ? ds.backgroundColor[i] : ds.backgroundColor
      });
    });
    ctx.save();
    function wrap(text, font) {
      ctx.font = font;
      const words = String(text).split(' '); const lines = []; let line = '';
      words.forEach((w) => {
        const t = line ? line + ' ' + w : w;
        if (ctx.measureText(t).width > maxText && line) { lines.push(line); line = w; } else { line = t; }
      });
      lines.push(line); return lines;
    }
    const nameFont = '600 12px Inter, system-ui, sans-serif';
    const detailFont = '12px Inter, system-ui, sans-serif';
    items.forEach((it) => { it.lines = wrap(it.name, nameFont); it.h = it.lines.length * 15 + 15; it.ty = it.y1; });
    [true, false].forEach((right) => {
      const col = items.filter((it) => it.right === right).sort((a, b) => a.y1 - b.y1);
      for (let k = 1; k < col.length; k++) {
        const prev = col[k - 1], cur = col[k];
        const need = prev.ty + prev.h / 2 + cur.h / 2 + 4;
        if (cur.ty < need) cur.ty = need;
      }
      const bottom = chart.height - 6;
      for (let k = col.length - 1; k >= 0; k--) {
        const cur = col[k];
        const limit = k === col.length - 1 ? bottom - cur.h / 2 : col[k + 1].ty - col[k + 1].h / 2 - cur.h / 2 - 4;
        if (cur.ty > limit) cur.ty = limit;
      }
    });
    items.forEach((it) => {
      const dir = it.right ? 1 : -1;
      const x2 = it.x1 + dir * 12;
      ctx.strokeStyle = it.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(it.x0, it.y0); ctx.lineTo(it.x1, it.ty); ctx.lineTo(x2, it.ty); ctx.stroke();
      ctx.fillStyle = it.color; ctx.beginPath(); ctx.arc(it.x0, it.y0, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = it.right ? 'left' : 'right'; ctx.textBaseline = 'middle';
      const tx = x2 + dir * 5;
      let y = it.ty - it.h / 2 + 8;
      ctx.fillStyle = '#15211A'; ctx.font = nameFont;
      it.lines.forEach((l) => { ctx.fillText(l, tx, y); y += 15; });
      ctx.fillStyle = '#3D4A42'; ctx.font = detailFont; ctx.fillText(it.detail, tx, y);
    });
    ctx.restore();
  }
};
Chart.register(doughnutCallouts);

function mwk(value) {
  return 'MWK ' + Number(value).toLocaleString('en-US');
}

function percentTooltip(context) {
  return context.dataset.label + ': ' + context.parsed.y + '%';
}

function moneyDoughnut(id, labels, values, colors) {
  const el = document.getElementById(id);
  if (!el) return;
  const total = values.reduce((a, b) => a + b, 0);
  new Chart(el, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', calloutValue: mwk }] },
    options: {
      cutout: '62%',
      layout: { padding: calloutPadding },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => c.label + ': ' + mwk(c.parsed) + ' (' + (c.parsed / total * 100).toFixed(1) + '%)'
          }
        }
      }
    }
  });
}

function countDoughnut(id, labels, values, colors, unit) {
  const el = document.getElementById(id);
  if (!el) return;
  new Chart(el, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', calloutValue: (v) => v + ' ' + unit }] },
    options: {
      cutout: '62%',
      layout: { padding: calloutPadding },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.label + ': ' + c.parsed + ' ' + unit } } }
    }
  });
}

/* ---------- Poultry project ---------- */

/* Pre and post test scores for all 21 participants (names left out for privacy) */
(function () {
  const el = document.getElementById('poultryScores');
  if (!el) return;
  const pre = [54.5, 54.5, 45.5, 45.5, 54.5, 54.5, 54.5, 54.5, 54.5, 54.5, 54.5, 63.6, 63.6, 63.6, 63.6, 63.6, 63.6, 63.6, 63.6, 63.6, 63.6];
  const post = [92.3, 92.3, 76.9, 76.9, 84.6, 84.6, 84.6, 84.6, 84.6, 84.6, 84.6, 92.3, 92.3, 92.3, 92.3, 92.3, 92.3, 92.3, 92.3, 92.3, 92.3];
  const labels = pre.map((_, i) => 'P' + (i + 1));
  new Chart(el, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Before training', data: pre, backgroundColor: LIGHT_GREEN, borderRadius: 4 },
        { label: 'After training', data: post, backgroundColor: GREEN, borderRadius: 4 }
      ]
    },
    options: {
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } }, x: { grid: { display: false } } },
      plugins: { tooltip: { callbacks: { title: (items) => 'Participant ' + items[0].label.slice(1), label: percentTooltip } } }
    }
  });
})();

/* How much of each target was reached */
(function () {
  const el = document.getElementById('poultryTargets');
  if (!el) return;
  const rows = [
    { name: 'Knowledge score', actual: '88.3%', target: '88.3%', pct: 100 },
    { name: 'Chicken house built', actual: '1', target: '1', pct: 100 },
    { name: 'Members trained', actual: '21', target: '35', pct: 60 },
    { name: 'Chicks procured', actual: '120', target: '200', pct: 60 }
  ];
  new Chart(el, {
    type: 'bar',
    data: {
      labels: rows.map((r) => r.name),
      datasets: [{ label: 'Share of target reached', data: rows.map((r) => r.pct), backgroundColor: rows.map((r) => (r.pct === 100 ? GREEN : GOLD)), borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y',
      scales: { x: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } }, y: { grid: { display: false } } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => 'Result ' + rows[c.dataIndex].actual + ' of target ' + rows[c.dataIndex].target + ' (' + c.parsed.x + '%)' } }
      }
    }
  });
})();

/* Budget burn: balance left in the funds tracker after each buying trip */
(function () {
  const el = document.getElementById('poultryBurn');
  if (!el) return;
  const points = [
    { date: '23 Apr 2026', balance: 3500000, note: 'Support received from CorpsAfrica' },
    { date: '4 May 2026', balance: 3080000, note: 'First cement and transport' },
    { date: '19 May 2026', balance: 1768856, note: 'Iron sheets, steel, wire and cement for the house' },
    { date: '31 Jul 2026', balance: 968606, note: '120 Sasso chicks, starter feed and transport from Mzuzu' },
    { date: '5 Aug 2026', balance: 0, note: 'Feed, drinkers, feeders, doors and branding' }
  ];
  new Chart(el, {
    type: 'line',
    data: {
      labels: points.map((p) => p.date),
      datasets: [{
        label: 'Remaining balance',
        data: points.map((p) => p.balance),
        borderColor: GREEN,
        backgroundColor: 'rgba(30, 91, 58, 0.12)',
        fill: true,
        tension: 0.25,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: GOLD
      }]
    },
    options: {
      scales: {
        y: { min: 0, ticks: { callback: (v) => 'MWK ' + (v / 1000000).toFixed(1) + 'M' } },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => 'Remaining: ' + mwk(c.parsed.y),
            afterLabel: (c) => points[c.dataIndex].note
          }
        }
      }
    }
  });
})();

/* Spending by category, from the 41 transactions in the funds tracker */
(function () {
  const el = document.getElementById('poultrySpend');
  if (!el) return;
  const rows = [
    ['Construction materials', 1670000],
    ['Feed', 618250],
    ['Chicks, vitamins and vaccines', 482000],
    ['Transport for procurement', 406000],
    ['Equipment, lighting and heating', 150000],
    ['Branding and visibility', 88606],
    ['Meals on procurement trips', 85144]
  ];
  const total = 3500000;
  new Chart(el, {
    type: 'bar',
    data: {
      labels: rows.map((r) => r[0]),
      datasets: [{ label: 'Amount spent', data: rows.map((r) => r[1]), backgroundColor: [GREEN, GREEN, GREEN, LIGHT_GREEN, LIGHT_GREEN, GOLD, GOLD], borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: { ticks: { callback: (v) => 'MWK ' + (v / 1000000).toFixed(1) + 'M' } },
        y: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => mwk(c.parsed.x) + ' (' + (c.parsed.x / total * 100).toFixed(1) + '% of budget)' } }
      }
    }
  });
})();

moneyDoughnut(
  'poultryResources',
  ['CorpsAfrica', 'Community cash', 'Community in kind', 'Member of Parliament (in kind)'],
  [3500000, 1449000, 1020000, 460000],
  [GREEN, GOLD, SAND, LIGHT_GREEN]
);

/* ---------- Ighembe classroom project ---------- */

moneyDoughnut(
  'ighembeResources',
  ['FOMA UK', 'Community cash', 'Community in kind'],
  [2824600, 500000, 620000],
  [GREEN, GOLD, SAND]
);

(function () {
  const el = document.getElementById('ighembeBeneficiaries');
  if (!el) return;
  new Chart(el, {
    type: 'bar',
    data: {
      labels: ['Learners', 'Teachers'],
      datasets: [
        { label: 'Female', data: [167, 5], backgroundColor: GOLD, borderRadius: 4 },
        { label: 'Male', data: [168, 12], backgroundColor: GREEN, borderRadius: 4 }
      ]
    },
    options: {
      scales: { x: { grid: { display: false } } },
      plugins: { tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + c.parsed.y } } }
    }
  });
})();

/* FOMA support by category, from the itemised final budget */
(function () {
  const el = document.getElementById('ighembeSpend');
  if (!el) return;
  const rows = [
    ['Cement and lime', 1321000],
    ['Doors, frames and fittings', 522400],
    ['Paint and painting tools', 503000],
    ['Transport and loading', 233200],
    ['Skilled labour and moulder', 215000],
    ['Meals on buying trips', 30000]
  ];
  const total = 2824600;
  new Chart(el, {
    type: 'bar',
    data: {
      labels: rows.map((r) => r[0]),
      datasets: [{ label: 'Amount spent', data: rows.map((r) => r[1]), backgroundColor: [GREEN, GREEN, GREEN, LIGHT_GREEN, LIGHT_GREEN, GOLD], borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y',
      scales: { x: { ticks: { callback: (v) => 'MWK ' + (v / 1000000).toFixed(1) + 'M' } }, y: { grid: { display: false } } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => mwk(c.parsed.x) + ' (' + (c.parsed.x / total * 100).toFixed(1) + '% of FOMA support)' } }
      }
    }
  });
})();

/* Planned against actual unit price for every item whose price changed */
(function () {
  const el = document.getElementById('ighembePrices');
  if (!el) return;
  const rows = [
    ['Cement (50 kg bag)', 42000, 35000],
    ['Ndola lime', 50000, 48000],
    ['Paint (20 L)', 150000, 155000],
    ['Paint roller', 7500, 8000],
    ['Loading and off-loading', 10000, 12600],
    ['Breeze block moulder', 50000, 65000],
    ['Moulding labour', 15000, 20000],
    ['Transport to town', 5000, 7000],
    ['Wood screws', 100, 150],
    ['Plastic buckets', 3000, 5000],
    ['Skilled labour (community cash)', 200000, 500000]
  ];
  const change = rows.map((r) => Math.round((r[2] - r[1]) / r[1] * 1000) / 10);
  new Chart(el, {
    type: 'bar',
    data: {
      labels: rows.map((r) => r[0]),
      datasets: [{ label: 'Price change', data: change, backgroundColor: change.map((v) => (v < 0 ? GREEN : GOLD)), borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y',
      scales: { x: { ticks: { callback: (v) => (v > 0 ? '+' : '') + v + '%' } }, y: { grid: { display: false }, ticks: { font: { size: 12 } } } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => {
              const r = rows[c.dataIndex];
              return 'Planned ' + mwk(r[1]) + ', paid ' + mwk(r[2]) + ' (' + (c.parsed.x > 0 ? '+' : '') + c.parsed.x + '%)';
            }
          }
        }
      }
    }
  });
})();

/* ---------- Goat pass-on scheme ---------- */

countDoughnut('goatGender', ['Women', 'Men'], [25, 5], [GOLD, GREEN], 'beneficiaries');

moneyDoughnut('goatResources', ['CorpsAfrica', 'Community contribution'], [300000, 129000], [GREEN, GOLD]);

/* ---------- Training ---------- */

(function () {
  const el = document.getElementById('trainingScores');
  if (!el) return;
  new Chart(el, {
    type: 'bar',
    data: {
      labels: ['Poultry (21 participants)', 'Kitchen gardens (19 participants)'],
      datasets: [
        { label: 'Before training', data: [57.1, 41.0], backgroundColor: LIGHT_GREEN, borderRadius: 4 },
        { label: 'After training', data: [88.3, 89.4], backgroundColor: GREEN, borderRadius: 4 }
      ]
    },
    options: {
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } }, x: { grid: { display: false } } },
      plugins: { tooltip: { callbacks: { label: percentTooltip } } }
    }
  });
})();

countDoughnut(
  'trainingThemes',
  ['Farming, food and trades', 'Business and money', 'Life skills and health', 'Leadership and projects'],
  [13, 5, 5, 3],
  [GREEN, GOLD, LIGHT_GREEN, SAND],
  'topics'
);
