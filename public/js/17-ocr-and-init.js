// ========== OCR (Tesseract.js – loaded only when the user requests OCR) ==========
let tesseractLoadPromise = null;

function ensureTesseractLoaded() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractLoadPromise) return tesseractLoadPromise;
  tesseractLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.onload = () => window.Tesseract
      ? resolve(window.Tesseract)
      : reject(new Error('Tesseract loaded without exposing its API.'));
    script.onerror = () => reject(new Error('Could not load Tesseract.js. Check your internet connection.'));
    document.head.appendChild(script);
  }).catch(error => {
    tesseractLoadPromise = null;
    throw error;
  });
  return tesseractLoadPromise;
}

async function runOCR(ev) {
  const file = ev.target.files?.[0];
  ev.target.value = '';
  if (!file) return;
  const status = document.getElementById('ocrStatus');
  const rawEl = document.getElementById('ocrRaw');
  const matchEl = document.getElementById('ocrMatches');
  status.textContent = 'Reading image in browser (not uploaded)… 0%';
  rawEl.style.display = 'none';
  matchEl.innerHTML = '';
  status.textContent = 'Loading private, in-browser OCR engine…';
  try {
    await ensureTesseractLoaded();
  } catch (error) {
    status.textContent = error.message;
    return;
  }

  // Object URL only in memory – never sent to a server
  const url = URL.createObjectURL(file);
  try {
    const result = await window.Tesseract.recognize(url, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text' && m.progress != null) {
          status.textContent = 'OCR progress: ' + Math.round(m.progress * 100) + '% (private, in-browser)';
        }
      }
    });
    const text = result.data.text || '';
    rawEl.textContent = text;
    rawEl.style.display = 'block';
    status.textContent = 'Done. Image discarded from memory. Matching heroes…';

    // Match known hero names (case-insensitive)
    const found = [];
    const lower = text.toLowerCase();
    HEROES.forEach(h => {
      if (lower.includes(h.name.toLowerCase())) {
        // try to find a nearby power number
        const re = new RegExp(h.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^\\d]{0,40}([\\d,]{4,})', 'i');
        const m = text.match(re);
        let power = h.power;
        if (m) {
          const n = +m[1].replace(/,/g, '');
          if (n > 10000 && n < 50000000) power = n;
        }
        found.push({ ...h, power });
      }
    });

    // Also pick large power-looking numbers for display
    const powers = [...text.matchAll(/\b(\d{1,3}(?:,\d{3}){1,2}|\d{6,8})\b/g)].map(m => +m[1].replace(/,/g, '')).filter(n => n > 50000);

    if (found.length === 0) {
      matchEl.innerHTML = '<p class="muted">No known hero names detected. OCR is imperfect on game UI (small fonts, effects). You can still use the raw text above or add heroes manually.</p>';
    } else {
      matchEl.innerHTML = '<p><strong>Detected heroes:</strong></p>' +
        found.map(h => {
          const L = {Warrior:'W',Tactical:'T',Assault:'A'}[h.faction]||'?';
          return `<span class="hero-chip selected" data-name="${h.name}" data-power="${h.power}">${L} ${h.name} · ${Number(h.power).toLocaleString()}</span>`;
        }).join('') +
        '<div style="margin-top:8px"><button class="green" onclick="applyOCRMatches()">Add detected to roster</button></div>';
      window._ocrFound = found;
    }
    if (powers.length) {
      matchEl.innerHTML += '<p class="muted" style="margin-top:6px">Numbers seen: ' + powers.slice(0, 8).map(n => n.toLocaleString()).join(', ') + '</p>';
    }
  } catch (e) {
    status.textContent = 'OCR failed: ' + e.message;
  } finally {
    URL.revokeObjectURL(url); // discard image from memory
  }
}

function applyOCRMatches() {
  const found = window._ocrFound || [];
  if (!found.length) return;
  found.forEach(h => addHeroRow(h));
  showSuggestions();
  updateStats();
  syncAllTabs();
  alert('Added ' + found.length + ' heroes from OCR. Data synced to other tabs. Adjust stars/power if needed, then Save.');
}

// ========== INIT ==========
const savedMode = localStorage.getItem('zr_mode') || 'basic';
setMode(savedMode);
document.getElementById('rosterList').innerHTML = '';
document.getElementById('username').value = '';
if (document.getElementById('ingameName')) document.getElementById('ingameName').value = '';
if (document.getElementById('profileDesc')) document.getElementById('profileDesc').value = '';
document.getElementById('hospital').value = 5000;
if (document.getElementById('saveDate')) document.getElementById('saveDate').value = '';
fillFormationSelects();
updateStats();
updateTierPreview();
updateCommandStrip();
loadFighter();
const tierSel = document.getElementById('troopTier');
if (tierSel) tierSel.addEventListener('change', updateTierPreview);
loadFromHash();
// clocks: restore saved offset/mode, detect TZ, VS day from SERVER
(function initClocks() {
  const savedOff = localStorage.getItem('zr_server_offset');
  const savedMode = localStorage.getItem('zr_time_mode');
  if (savedOff != null) {
    const t = document.getElementById('serverOffsetTop');
    const p = document.getElementById('serverOffset');
    if (t) t.value = savedOff;
    if (p) p.value = savedOff;
  }
  if (savedMode) {
    const t = document.getElementById('timeModeTop');
    const p = document.getElementById('timeMode');
    if (t) t.value = savedMode;
    if (p) p.value = savedMode;
  } else {
    const t = document.getElementById('timeModeTop');
    if (t) t.value = 'server';
  }
  detectTimezone();
  updateClocks();
  const d = getGuideDay();
  const fVs = document.getElementById('fVsDay');
  if (fVs) fVs.value = String(d);
  updateCommandStrip();
  highlightVsDay();
  const bg = localStorage.getItem('zr_bg_preset') || 'none';
  const preset = document.querySelector('.bg-preset[data-bg="' + bg + '"]');
  if (preset) pickBgPreset(preset);
  if (localStorage.getItem('zr_compact') === '1') document.body.classList.add('compact');
  const sd = localStorage.getItem('zr_saveDate');
  if (sd && document.getElementById('saveInd')) document.getElementById('saveInd').textContent = 'Saved · ' + sd;
})();
