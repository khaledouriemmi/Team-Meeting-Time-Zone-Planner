const COMMON_ZONES = [
  {label: "San Francisco — America/Los_Angeles", zone: "America/Los_Angeles"},
  {label: "New York — America/New_York", zone: "America/New_York"},
  {label: "São Paulo — America/Sao_Paulo", zone: "America/Sao_Paulo"},
  {label: "London — Europe/London", zone: "Europe/London"},
  {label: "Paris — Europe/Paris", zone: "Europe/Paris"},
  {label: "Tunis — Africa/Tunis", zone: "Africa/Tunis"},
  {label: "Cairo — Africa/Cairo", zone: "Africa/Cairo"},
  {label: "Johannesburg — Africa/Johannesburg", zone: "Africa/Johannesburg"},
  {label: "Dubai — Asia/Dubai", zone: "Asia/Dubai"},
  {label: "Mumbai — Asia/Kolkata", zone: "Asia/Kolkata"},
  {label: "Singapore — Asia/Singapore", zone: "Asia/Singapore"},
  {label: "Hong Kong — Asia/Hong_Kong", zone: "Asia/Hong_Kong"},
  {label: "Shanghai — Asia/Shanghai", zone: "Asia/Shanghai"},
  {label: "Tokyo — Asia/Tokyo", zone: "Asia/Tokyo"},
  {label: "Seoul — Asia/Seoul", zone: "Asia/Seoul"},
  {label: "Sydney — Australia/Sydney", zone: "Australia/Sydney"},
  {label: "Auckland — Pacific/Auckland", zone: "Pacific/Auckland"},
];

const state = {
  zones: [],
  startHour: 9,
  endHour: 17,
};

const tzSelect = document.getElementById('tzSelect');
const tzSearch = document.getElementById('tzSearch');
const addBtn = document.getElementById('addBtn');
const clearBtn = document.getElementById('clearBtn');
const shareBtn = document.getElementById('shareBtn');
const chips = document.getElementById('chips');
const grid = document.getElementById('grid');
const startHourEl = document.getElementById('startHour');
const endHourEl = document.getElementById('endHour');

function refreshSelect(filter = '') {
  tzSelect.innerHTML = '';
  const items = COMMON_ZONES.filter(z => z.label.toLowerCase().includes(filter.toLowerCase()));
  for (const {label, zone} of items) {
    const opt = document.createElement('option');
    opt.value = zone;
    opt.textContent = label;
    tzSelect.appendChild(opt);
  }
}

function saveToHash() {
  const z = state.zones.map(z => encodeURIComponent(z.zone)).join(',');
  const s = `#zones=${z}&wh=${state.startHour}-${state.endHour}`;
  history.replaceState(null, '', s);
}

function loadFromHash() {
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  const zones = (h.get('zones') || '').split(',').filter(Boolean).map(decodeURIComponent);
  const wh = h.get('wh');
  if (wh) {
    const [s, e] = wh.split('-').map(Number);
    if (!Number.isNaN(s) && !Number.isNaN(e)) {
      state.startHour = s;
      state.endHour = e;
      startHourEl.value = s;
      endHourEl.value = e;
    }
  }
  for (const z of zones) {
    const known = COMMON_ZONES.find(c => c.zone === z);
    addZone({ zone: z, label: known ? known.label : z });
  }
}

function addZone(z) {
  if (state.zones.find(x => x.zone === z.zone)) return;
  state.zones.push(z);
  renderChips();
  renderGrid();
  saveToHash();
}

function removeZone(zone) {
  state.zones = state.zones.filter(z => z.zone !== zone);
  renderChips();
  renderGrid();
  saveToHash();
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function renderChips() {
  chips.innerHTML = '';
  for (const z of state.zones) {
    const chip = document.createElement('span');
    chip.className = 'tz-chip';
    chip.innerHTML = `<strong>${escapeHtml(displayCity(z.label))}</strong><span class="sub">${escapeHtml(z.zone)}</span><span class="x" title="Remove">✕</span>`;
    chip.querySelector('.x').addEventListener('click', () => removeZone(z.zone));
    chips.appendChild(chip);
  }
}

function displayCity(label) {
  return label.split(' — ')[0];
}

function renderGrid() {
  grid.innerHTML = '';
  const hours = Array.from({length: 24}, (_, i) => i);

  const headCity = div('cell head city');
  headCity.textContent = 'City / Hour';
  grid.appendChild(headCity);
  
  const nowUTC = new Date();
  const nowHourUTC = nowUTC.getUTCHours();
  
  for (const h of hours) {
    const cell = div('cell head');
    cell.textContent = `${String(h).padStart(2, '0')}:00 UTC`;
    if (h === nowHourUTC) cell.classList.add('now');
    grid.appendChild(cell);
  }

  const overlapCols = new Set();
  for (const h of hours) {
    if (state.zones.length === 0) continue;
    let allIn = true;
    for (const z of state.zones) {
      const localHour = localHourForUTC(h, z.zone);
      if (!inWork(localHour)) {
        allIn = false;
        break;
      }
    }
    if (allIn) overlapCols.add(h);
  }

  for (const z of state.zones) {
    const cityCell = div('cell city');
    const nowLocal = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: z.zone
    });
    cityCell.innerHTML = `<div style="display:flex; align-items:baseline; justify-content:space-between; gap:8px">
      <div><strong>${escapeHtml(displayCity(z.label))}</strong>
      <div class="sub">${escapeHtml(z.zone)}</div></div>
      <div class="sub">now ${nowLocal}</div></div>`;
    grid.appendChild(cityCell);

    for (const h of hours) {
      const cell = div('cell');
      const lh = localHourForUTC(h, z.zone);
      cell.textContent = `${String(lh).padStart(2, '0')}:00`;
      if (inWork(lh)) cell.classList.add('work');
      if (h === nowHourUTC) cell.classList.add('now');
      if (overlapCols.has(h)) cell.classList.add('overlap');
      grid.appendChild(cell);
    }
  }
}

function localHourForUTC(utcHour, zone) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, 0, 0));
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', hour12: false }).formatToParts(d);
  const hh = parseInt(parts.find(p => p.type === 'hour').value, 10);
  return hh;
}

function inWork(h) {
  let s = state.startHour, e = state.endHour;
  if (e <= s) {
    return (h >= s || h < e);
  }
  return h >= s && h < e;
}

function div(cls) {
  const el = document.createElement('div');
  el.className = cls;
  return el;
}

function escapeHtml(s) {
  return s.replace(/[&<>"]+/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[c]));
}

// Event Listeners
tzSearch.addEventListener('input', (e) => refreshSelect(e.target.value));

addBtn.addEventListener('click', () => {
  const zone = tzSelect.value;
  if (!zone) return;
  const known = COMMON_ZONES.find(c => c.zone === zone);
  addZone({ zone, label: known ? known.label : zone });
});

clearBtn.addEventListener('click', () => {
  state.zones = [];
  renderChips();
  renderGrid();
  saveToHash();
});

shareBtn.addEventListener('click', async () => {
  saveToHash();
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    shareBtn.textContent = 'Link copied!';
    setTimeout(() => shareBtn.textContent = 'Share', 1200);
  } catch (e) {
    alert(url);
  }
});

startHourEl.addEventListener('change', () => {
  state.startHour = clamp(parseInt(startHourEl.value), 0, 23);
  renderGrid();
  saveToHash();
});

endHourEl.addEventListener('change', () => {
  state.endHour = clamp(parseInt(endHourEl.value), 1, 24);
  renderGrid();
  saveToHash();
});

// Initialize
refreshSelect('');
loadFromHash();

if (state.zones.length === 0) {
  addZone(COMMON_ZONES.find(z => z.zone === 'Europe/Paris'));
  addZone(COMMON_ZONES.find(z => z.zone === 'America/New_York'));
}

setInterval(() => renderGrid(), 60000);
