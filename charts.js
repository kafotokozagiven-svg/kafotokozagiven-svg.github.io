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

/* Phones: keep labels straight, wrap long names, and use a key under doughnuts instead of callout lines. */
const SMALL = window.innerWidth < 640;
function wrapLabel(text, max) {
  const words = String(text).split(' '); const lines = []; let line = '';
  words.forEach((w) => { const t = line ? line + ' ' + w : w; if (t.length > max && line) { lines.push(line); line = w; } else { line = t; } });
  lines.push(line); return lines.length > 1 ? lines : lines[0];
}
if (SMALL) {
  Chart.defaults.scale.ticks.maxRotation = 0;
  Chart.defaults.scales.category.ticks.callback = function (v) { return wrapLabel(this.getLabelForValue(v), 16); };
  Chart.defaults.scales.linear.ticks.maxTicksLimit = 4;
}
function doughnutLegend(fmt) {
  return {
    display: false,
    position: 'bottom',
    labels: {
      usePointStyle: true, padding: 14, boxWidth: 10,
      generateLabels(chart) {
        const ds = chart.data.datasets[0];
        const total = ds.data.reduce((a, b) => a + b, 0);
        return Chart.overrides.doughnut.plugins.legend.labels.generateLabels(chart).map((l) => {
          l.text = l.text + ': ' + fmt(ds.data[l.index]) + ' (' + Math.round(ds.data[l.index] / total * 100) + '%)';
          return l;
        });
      }
    }
  };
}

/* Callout labels for doughnut charts: a line from each slice out to its name, value and share. */
function calloutSide(chart) { return Math.max(70, Math.min(130, chart.width * 0.24)); }
function calloutPadding(c) { if (SMALL) return { left: 8, right: 8, top: 70, bottom: 70 }; const s = calloutSide(c.chart); return { left: s, right: s, top: 26, bottom: 26 }; }
/* Phones: small labels above and below the ring, each with a short line to its slice. */
function shortMwk(v) { return v >= 1000000 ? 'MWK ' + (v / 1000000).toFixed(1).replace('.0', '') + 'M' : 'MWK ' + Math.round(v / 1000) + 'K'; }
function drawSmallCallouts(chart) {
  const ds = chart.data.datasets[0];
  const meta = chart.getDatasetMeta(0);
  const total = ds.data.reduce((a, b) => a + b, 0);
  const fmt = ds.calloutShort || ds.calloutValue || ((v) => String(v));
  const ctx = chart.ctx; const W = chart.width;
  const nameFont = '600 10.5px Inter, system-ui, sans-serif';
  const detailFont = '10px Inter, system-ui, sans-serif';
  const maxW = 100, gap = 8;
  function wrap(text) {
    ctx.font = nameFont;
    const words = String(text).split(' '); const lines = []; let line = '';
    words.forEach((w) => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else { line = t; } });
    lines.push(line); return lines;
  }
  const items = [];
  meta.data.forEach((arc, i) => {
    if (!chart.getDataVisibility(i) || !ds.data[i]) return;
    const a = (arc.startAngle + arc.endAngle) / 2;
    const lines = wrap(chart.data.labels[i]);
    const detail = fmt(ds.data[i]) + ' · ' + Math.round(ds.data[i] / total * 100) + '%';
    ctx.font = nameFont; let w = Math.max.apply(null, lines.map((l) => ctx.measureText(l).width));
    ctx.font = detailFont; w = Math.max(w, ctx.measureText(detail).width);
    items.push({
      s: Math.sin(a), top: Math.sin(a) < 0, lines, detail, w, h: lines.length * 13 + 12,
      x0: arc.x + Math.cos(a) * (arc.outerRadius + 2), y0: arc.y + Math.sin(a) * (arc.outerRadius + 2),
      cy: arc.y, r: arc.outerRadius,
      color: Array.isArray(ds.backgroundColor) ? ds.backgroundColor[i] : ds.backgroundColor
    });
  });
  const width = (band) => band.reduce((t, it) => t + it.w + gap, 0);
  for (let n = 0; n < items.length; n++) {
    const topB = items.filter((it) => it.top), botB = items.filter((it) => !it.top);
    const [full, other] = width(topB) > width(botB) ? [topB, botB] : [botB, topB];
    if (width(full) <= W - 8 || full.length < 2) break;
    const mover = full.slice().sort((a, b) => Math.abs(a.s) - Math.abs(b.s))[0];
    if (width(other) + mover.w + gap > W - 8) break;
    mover.top = !mover.top;
  }
  [true, false].forEach((top) => {
    const band = items.filter((it) => it.top === top).sort((a, b) => a.x0 - b.x0);
    band.forEach((it) => { it.x = Math.min(Math.max(it.x0, it.w / 2 + 4), W - it.w / 2 - 4); });
    for (let k = 1; k < band.length; k++) {
      const need = band[k - 1].x + band[k - 1].w / 2 + band[k].w / 2 + gap;
      if (band[k].x < need) band[k].x = need;
    }
    for (let k = band.length - 1; k >= 0; k--) {
      const cur = band[k];
      const limit = k === band.length - 1 ? W - cur.w / 2 - 4 : band[k + 1].x - band[k + 1].w / 2 - cur.w / 2 - gap;
      if (cur.x > limit) cur.x = limit;
    }
  });
  ctx.save();
  items.forEach((it) => {
    const edge = it.top ? it.cy - it.r - 10 : it.cy + it.r + 10;
    const blockTop = it.top ? edge - it.h : edge;
    const ax = Math.min(Math.max(it.x0, it.x - it.w / 2), it.x + it.w / 2);
    ctx.strokeStyle = it.color; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(it.x0, it.y0); ctx.lineTo(ax, it.top ? edge + 2 : edge - 2); ctx.stroke();
    ctx.fillStyle = it.color; ctx.beginPath(); ctx.arc(it.x0, it.y0, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let y = blockTop + 7;
    ctx.fillStyle = '#15211A'; ctx.font = nameFont;
    it.lines.forEach((l) => { ctx.fillText(l, it.x, y); y += 13; });
    ctx.fillStyle = '#3D4A42'; ctx.font = detailFont; ctx.fillText(it.detail, it.x, y);
  });
  ctx.restore();
}

const doughnutCallouts = {
  id: 'doughnutCallouts',
  afterDatasetsDraw(chart) {
    if (chart.config.type !== 'doughnut') return;
    if (SMALL) { drawSmallCallouts(chart); return; }
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
    data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', calloutValue: mwk, calloutShort: shortMwk }] },
    options: {
      cutout: '62%',
      layout: { padding: calloutPadding },
      plugins: {
        legend: doughnutLegend(mwk),
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
      plugins: { legend: doughnutLegend((v) => v + ' ' + unit), tooltip: { callbacks: { label: (c) => c.label + ': ' + c.parsed + ' ' + unit } } }
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
