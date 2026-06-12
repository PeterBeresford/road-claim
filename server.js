const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));

const DATA_FILE = path.join(__dirname, 'submissions.json');

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch(e) {}
  return [];
}

function save(data) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); } catch(e) {}
}

// â”€â”€ API ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.post('/submit', (req, res) => {
  const subs = load();
  const data = req.body;
  data.id = Date.now().toString();
  data.receivedAt = new Date().toISOString();
  data.status = 'pending';
  subs.push(data);
  save(subs);
  res.json({ success: true, id: data.id });
});

app.get('/submissions', (req, res) => {
  res.json(load());
});

app.post('/approve/:id', (req, res) => {
  const subs = load();
  const sub = subs.find(s => s.id === req.params.id);
  if (sub) { sub.status = 'approved'; sub.approvedAt = new Date().toISOString(); }
  save(subs);
  res.json({ success: true });
});

app.post('/query/:id', (req, res) => {
  const subs = load();
  const sub = subs.find(s => s.id === req.params.id);
  if (sub) { sub.status = 'queried'; sub.queryNote = req.body.note || ''; }
  save(subs);
  res.json({ success: true });
});

app.delete('/submissions/:id', (req, res) => {
  let subs = load();
  subs = subs.filter(s => s.id !== req.params.id);
  save(subs);
  res.json({ success: true });
});

// â”€â”€ HTML PAGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


const DRIVER_FORM = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="theme-color" content="#1a1a1a">
<title>RoadClaim â€” Driver Expenses</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #1a1a1a; --mid: #666; --light: #999; --rule: #e0ddd8;
    --bg: #f5f3ee; --white: #fff; --accent: #c8392b; --accent-light: #fdf0ee;
    --green: #2a7a4b; --green-light: #e8f4ee; --blue: #1a5fa8;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--ink); min-height: 100vh; padding-bottom: 6rem; }

  .app-header { background: var(--ink); color: white; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem; position: sticky; top: 0; z-index: 100; }
  .app-title { font-size: 1rem; font-weight: 600; }
  .app-sub { font-size: 0.68rem; color: #888; font-family: 'DM Mono', monospace; letter-spacing: 0.08em; }
  .app-version { font-family: 'DM Mono', monospace; font-size: 0.62rem; color: #555; margin-left: auto; }

  .section { background: var(--white); border-bottom: 1px solid var(--rule); padding: 1.25rem; margin-bottom: 0.5rem; }
  .section-title { font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent); margin-bottom: 1rem; }

  .field-group { margin-bottom: 1rem; }
  .field-group:last-child { margin-bottom: 0; }
  .field-group label { display: block; font-size: 0.72rem; font-weight: 600; color: var(--mid); margin-bottom: 0.35rem; letter-spacing: 0.04em; text-transform: uppercase; }
  .field-group input, .field-group select, .field-group textarea { width: 100%; border: 1px solid var(--rule); background: var(--bg); color: var(--ink); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; padding: 0.6rem 0.75rem; border-radius: 2px; -webkit-appearance: none; }
  .field-group input:focus, .field-group select:focus { outline: none; border-color: var(--ink); background: var(--white); }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

  .currency-bar { background: #f0ede8; padding: 0.6rem 1.25rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; border-bottom: 1px solid var(--rule); }
  .currency-bar .clabel { font-size: 0.58rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--light); }
  .currency-pill { font-family: 'DM Mono', monospace; font-size: 0.7rem; background: var(--ink); color: white; padding: 0.15rem 0.6rem; border-radius: 2px; }

  .expense-row { background: var(--white); border: 1px solid var(--rule); margin: 0 1.25rem 0.75rem; border-radius: 2px; }
  .expense-row.prepaid-row { background: var(--green-light); border-color: #b2d8c0; }
  .row-header { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f8f7f4; border-bottom: 1px solid var(--rule); }
  .row-num { font-family: 'DM Mono', monospace; font-size: 0.65rem; color: var(--light); flex-shrink: 0; }
  .row-sterling { font-family: 'DM Mono', monospace; font-size: 0.85rem; font-weight: 500; margin-left: auto; color: var(--green); }
  .row-sterling.is-prepaid { color: var(--light); font-style: italic; font-size: 0.72rem; }
  .row-body { padding: 0.75rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
  .row-body .full { grid-column: 1 / -1; }
  .row-body label { display: block; font-size: 0.62rem; font-weight: 600; color: var(--light); margin-bottom: 0.2rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .row-body input, .row-body select { width: 100%; border: 1px solid var(--rule); background: var(--bg); color: var(--ink); font-family: 'DM Sans', sans-serif; font-size: 0.85rem; padding: 0.45rem 0.6rem; border-radius: 2px; -webkit-appearance: none; }
  .row-body input:focus, .row-body select:focus { outline: none; border-color: var(--ink); background: white; }
  .row-footer { padding: 0.5rem 0.75rem; border-top: 1px solid var(--rule); display: flex; align-items: center; gap: 0.75rem; }
  .prepaid-toggle { display: flex; align-items: center; gap: 0.5rem; }
  .prepaid-toggle label { font-size: 0.72rem; color: var(--mid); }
  .toggle-switch { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; inset: 0; background: var(--rule); border-radius: 20px; transition: 0.2s; cursor: pointer; }
  .toggle-slider::before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: 0.2s; }
  input:checked + .toggle-slider { background: var(--green); }
  input:checked + .toggle-slider::before { transform: translateX(16px); }
  .btn-del { margin-left: auto; background: none; border: none; color: var(--light); font-size: 1.1rem; cursor: pointer; padding: 0.2rem 0.4rem; line-height: 1; }
  .btn-del:hover { color: var(--accent); }

  .rate-row { display: flex; gap: 0.5rem; align-items: flex-end; }
  .rate-row input { flex: 1; }
  .btn-fetch { font-family: 'DM Mono', monospace; font-size: 0.65rem; background: var(--ink); color: white; border: none; padding: 0.45rem 0.65rem; border-radius: 2px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .btn-fetch:active { opacity: 0.8; }

  .total-bar { background: var(--ink); color: white; padding: 0.9rem 1.25rem; position: sticky; bottom: 5rem; z-index: 50; display: flex; align-items: baseline; gap: 0.5rem; }
  .total-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #888; }
  .total-amount { font-family: 'DM Mono', monospace; font-size: 1.4rem; font-weight: 500; }
  .total-note { font-size: 0.62rem; color: #666; margin-left: auto; font-style: italic; }

  .bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--white); border-top: 1px solid var(--rule); padding: 0.75rem 1.25rem; display: flex; gap: 0.75rem; z-index: 100; }
  .btn { font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; border: none; padding: 0.75rem 1.1rem; border-radius: 2px; cursor: pointer; }
  .btn-add { background: #f0ede8; color: var(--ink); border: 1px solid var(--rule); flex: 1; }
  .btn-submit { background: var(--accent); color: white; flex: 2; }
  .btn-submit:active { opacity: 0.9; }

  .submit-confirm { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; align-items: flex-end; }
  .submit-confirm.show { display: flex; }
  .confirm-box { background: var(--white); width: 100%; padding: 1.5rem 1.25rem; border-radius: 8px 8px 0 0; }
  .confirm-box h3 { font-size: 1rem; margin-bottom: 0.5rem; }
  .confirm-box p { font-size: 0.82rem; color: var(--mid); margin-bottom: 1rem; line-height: 1.5; }
  .confirm-summary { background: var(--bg); padding: 0.75rem; border-radius: 2px; font-size: 0.8rem; line-height: 1.7; margin-bottom: 1rem; font-family: 'DM Mono', monospace; }
  .confirm-actions { display: flex; gap: 0.75rem; }
  .btn-cancel { background: #f0ede8; color: var(--ink); flex: 1; }
  .btn-confirm { background: var(--accent); color: white; flex: 2; }

  .hint { font-size: 0.72rem; color: var(--mid); margin-top: 0.4rem; line-height: 1.4; }

  @media (min-width: 600px) {
    .section, .currency-bar { max-width: 600px; margin-left: auto; margin-right: auto; }
    .expense-row { max-width: 600px; margin-left: auto; margin-right: auto; }
    .total-bar, .bottom-bar { max-width: 600px; margin: 0 auto; }
    .bottom-bar { left: 50%; transform: translateX(-50%); width: 600px; }
  }
</style>
</head>
<body>

<div class="app-header">
  <div>
    <div class="app-title">RoadClaim</div>
    <div class="app-sub">Driver Expenses</div>
  </div>
  <div class="app-version">v1.8</div>
</div>

<!-- DRIVER INFO -->
<div class="section">
  <div class="section-title">Driver</div>
  <div class="field-group"><label>Your name</label><input type="text" id="driverName" placeholder="First and last name" autocomplete="name"></div>
  <div class="two-col">
    <div class="field-group"><label>Tour / production</label><input type="text" id="tourName" placeholder="e.g. The Neighbourhood"></div>
    <div class="field-group"><label>Truck / vehicle</label><input type="text" id="truckNo" placeholder="e.g. TC-04"></div>
  </div>
  <div class="two-col">
    <div class="field-group"><label>Date out</label><input type="date" id="dateOut"></div>
    <div class="field-group"><label>Date return</label><input type="date" id="dateReturn"></div>
  </div>
  <div class="field-group"><label>Float received (Â£)</label><input type="number" id="floatAmount" placeholder="0.00" step="0.01" min="0" inputmode="decimal">
  <div class="hint">Cash advance given before departure. Leave blank if none.</div></div>
</div>

<!-- EXPENSES -->
<div class="section" style="padding-bottom:0.5rem">
  <div class="section-title">Expenses</div>
  <p class="hint" style="margin-bottom:1rem">Add one row per expense. Use the currency where you spent â€” sterling converts automatically.</p>
</div>

<div class="currency-bar">
  <span class="clabel">Currencies used</span>
  <span id="currencyPills" style="color:var(--light);font-size:0.72rem;font-style:italic">none yet</span>
</div>

<div id="expenseRows"></div>

<div style="padding:0.75rem 1.25rem 5rem">
  <button class="btn btn-add" onclick="addRow()" style="width:100%;padding:0.85rem">+ Add expense row</button>
</div>

<!-- TOTAL BAR -->
<div class="total-bar">
  <span class="total-label">Total claimed</span>
  <span class="total-amount" id="grandTotal">Â£0.00</span>
  <span class="total-note" id="floatNote"></span>
</div>

<!-- BOTTOM BAR -->
<div class="bottom-bar">
  <button class="btn btn-submit" onclick="showSubmitConfirm()">Submit expenses â†’</button>
</div>

<!-- CONFIRM OVERLAY -->
<div class="submit-confirm" id="submitConfirm">
  <div class="confirm-box">
    <h3>Ready to submit?</h3>
    <p>Check the summary below. When you tap <strong>Submit</strong>, your expenses will be sent directly to the dashboard.</p>
    <div class="confirm-summary" id="confirmSummary"></div>
    <div class="confirm-actions">
      <button class="btn btn-cancel" onclick="hideSubmitConfirm()">Back</button>
      <button class="btn btn-confirm" onclick="confirmSubmit()">Submit â†’</button>
      <button class="btn btn-confirm" style="background:#2a7a4b" onclick="downloadJSON()">Download file â†’</button>
    </div>
  </div>
</div>

<script>
  // â”€â”€ CONFIGURATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var SUBMIT_EMAIL = 'psberesford@yahoo.co.uk'; // â† change this before sending to drivers
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  var TYPES = ['Taxi','Train','Metro / Local bus','Meals','Hotel','Ferry','Fuel','Tolls','Parking','Other'];
  var rowCount = 0;
  var rows = [];

  function addRow() {
    rowCount++;
    var n = rowCount;
    rows.push(n);
    var div = document.createElement('div');
    div.className = 'expense-row';
    div.id = 'row-' + n;
    div.innerHTML =
      '<div class="row-header">' +
        '<span class="row-num">#' + n + '</span>' +
        '<select id="type-' + n + '" style="border:none;background:transparent;font-family:DM Sans,sans-serif;font-size:0.82rem;font-weight:600;color:var(--ink);padding:0;max-width:120px" onchange="onTypeChange(' + n + ')">' +
          TYPES.map(function(t,i){ return '<option'+(i===0?' selected':'')+'>'+t+'</option>'; }).join('') +
        '</select>' +
        '<span class="row-sterling" id="sterling-' + n + '">â€”</span>' +
        '<button class="btn-del" onclick="deleteRow(' + n + ')" title="Remove">âœ•</button>' +
      '</div>' +
      '<div class="row-body">' +
        '<div><label>Date</label><input type="date" id="date-' + n + '"></div>' +
        '<div><label>Country</label><input type="text" id="country-' + n + '" placeholder="e.g. PL" maxlength="3" oninput="onCountryInput(' + n + ')"></div>' +
        '<div class="full"><label>Description (optional)</label><input type="text" id="notes-' + n + '" placeholder="e.g. Motorway toll A4"></div>' +
        '<div><label>Amount</label><input type="number" id="amt-' + n + '" placeholder="0.00" step="0.01" min="0" inputmode="decimal" oninput="calcRow(' + n + ')"></div>' +
        '<div><label>Currency</label><input type="text" id="cur-' + n + '" placeholder="GBP" maxlength="3" style="text-transform:uppercase" oninput="calcRow(' + n + ');updateCurrencies()"></div>' +
        '<div class="full"><label>Rate to GBP <span style="font-weight:400;text-transform:none">(auto-fetched)</span></label>' +
          '<div class="rate-row"><input type="number" id="rate-' + n + '" placeholder="1.00" step="0.0001" min="0" inputmode="decimal" oninput="calcRow(' + n + ')"><button class="btn-fetch" onclick="autoFetchRate(' + n + ')">Fetch</button></div></div>' +
      '</div>' +
      '<div class="row-footer">' +
        '<div class="prepaid-toggle">' +
          '<label class="toggle-switch"><input type="checkbox" id="prepaid-' + n + '" onchange="onPrepaidChange(' + n + ')"><span class="toggle-slider"></span></label>' +
          '<label for="prepaid-' + n + '">Company prepaid â€” record only</label>' +
        '</div>' +
      '</div>';
    document.getElementById('expenseRows').appendChild(div);
    setTimeout(function(){ div.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  }

  function deleteRow(n) {
    var el = document.getElementById('row-' + n);
    if (el) el.remove();
    rows = rows.filter(function(r){ return r !== n; });
    updateTotal(); updateCurrencies();
  }

  function onTypeChange(n) {
    var type = document.getElementById('type-' + n).value;
    if (type === 'Fuel' || type === 'Tolls' || type === 'Parking') {
      var c = document.getElementById('country-' + n);
      if (!c.value) c.focus();
    }
  }

  function onCountryInput(n) {
    var v = document.getElementById('country-' + n).value.toUpperCase();
    document.getElementById('country-' + n).value = v;
    var MAP = { GB:'GBP',US:'USD',DE:'EUR',FR:'EUR',IT:'EUR',ES:'EUR',PL:'PLN',CZ:'CZK',CH:'CHF',SE:'SEK',NO:'NOK',DK:'DKK',NL:'EUR',BE:'EUR',AT:'EUR' };
    if (v.length === 2 && MAP[v]) {
      document.getElementById('cur-' + n).value = MAP[v];
      updateCurrencies();
      autoFetchRate(n);
    }
  }

  // Fallback rates (approximate â€” updated April 2026)
  var FALLBACK_RATES = {
    EUR:0.856, CHF:0.894, PLN:0.197, CZK:0.034, SEK:0.074,
    NOK:0.072, DKK:0.115, HUF:0.0021, HRK:0.113, RON:0.172,
    USD:0.792, CAD:0.578, AUD:0.502, JPY:0.0053
  };

  function autoFetchRate(n) {
    var cur = (document.getElementById('cur-' + n).value || '').toUpperCase().trim();
    if (!cur || cur === 'GBP') {
      document.getElementById('rate-' + n).value = '1';
      clearRateNote(n); calcRow(n); return;
    }
    var cell = document.getElementById('sterling-' + n);
    cell.textContent = 'â³';
    fetch('https://api.frankfurter.app/latest?from=' + cur + '&to=GBP')
      .then(function(r){ return r.ok ? r.json() : Promise.reject('status ' + r.status); })
      .then(function(d){
        if (d.rates && d.rates.GBP) {
          document.getElementById('rate-' + n).value = d.rates.GBP.toFixed(6);
          setRateNote(n, 'Live rate âœ“', false);
          calcRow(n);
        } else { throw new Error('no rate'); }
      })
      .catch(function(){
        // API failed â€” use fallback
        if (FALLBACK_RATES[cur]) {
          document.getElementById('rate-' + n).value = FALLBACK_RATES[cur].toFixed(6);
          setRateNote(n, 'âš  Approx rate â€” check manually', true);
          calcRow(n);
        } else {
          cell.textContent = 'â€”';
          setRateNote(n, 'âš  Unknown currency â€” enter rate manually', true);
        }
      });
  }

  function setRateNote(n, msg, isWarn) {
    var id = 'ratenote-' + n;
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.style.cssText = 'font-size:0.68rem;margin-top:0.25rem;';
      var rateRow = document.getElementById('rate-' + n);
      if (rateRow && rateRow.parentNode) rateRow.parentNode.appendChild(el);
    }
    el.textContent = msg;
    el.style.color = isWarn ? 'var(--accent)' : 'var(--green)';
  }

  function clearRateNote(n) {
    var el = document.getElementById('ratenote-' + n);
    if (el) el.textContent = '';
  }

  function onPrepaidChange(n) {
    var prepaid = document.getElementById('prepaid-' + n).checked;
    var row = document.getElementById('row-' + n);
    var cell = document.getElementById('sterling-' + n);
    if (prepaid) {
      row.classList.add('prepaid-row');
      cell.textContent = 'prepaid'; cell.classList.add('is-prepaid');
      ['amt-','rate-','cur-'].forEach(function(p){ var el=document.getElementById(p+n); if(el){el.disabled=true;el.style.opacity='0.4';} });
    } else {
      row.classList.remove('prepaid-row');
      cell.classList.remove('is-prepaid');
      ['amt-','rate-','cur-'].forEach(function(p){ var el=document.getElementById(p+n); if(el){el.disabled=false;el.style.opacity='1';} });
      calcRow(n);
    }
    updateTotal();
  }

  function calcRow(n) {
    if (document.getElementById('prepaid-' + n) && document.getElementById('prepaid-' + n).checked) return;
    var amt = parseFloat(document.getElementById('amt-' + n).value) || 0;
    var rate = parseFloat(document.getElementById('rate-' + n).value) || 1;
    var cur = (document.getElementById('cur-' + n).value || 'GBP').toUpperCase().trim();
    var cell = document.getElementById('sterling-' + n);
    if (cur === 'GBP') rate = 1;
    if (amt > 0) { cell.textContent = 'Â£' + (amt * rate).toFixed(2); cell.classList.remove('is-prepaid'); }
    else { cell.textContent = 'â€”'; }
    updateTotal();
  }

  function updateTotal() {
    var total = 0;
    rows.forEach(function(n){
      var cell = document.getElementById('sterling-' + n);
      if (cell && !cell.classList.contains('is-prepaid') && cell.textContent !== 'â€”' && cell.textContent !== 'â³') {
        total += parseFloat(cell.textContent.replace('Â£','')) || 0;
      }
    });
    document.getElementById('grandTotal').textContent = 'Â£' + total.toFixed(2);
    var fl = parseFloat(document.getElementById('floatAmount').value) || 0;
    var note = document.getElementById('floatNote');
    if (fl > 0) {
      var bal = total - fl;
      note.textContent = bal >= 0 ? '(float Â£'+fl.toFixed(2)+' â€” balance due Â£'+bal.toFixed(2)+')' : '(float Â£'+fl.toFixed(2)+' â€” overspend Â£'+Math.abs(bal).toFixed(2)+')';
    } else { note.textContent = ''; }
  }

  function updateCurrencies() {
    var seen = [];
    rows.forEach(function(n){
      var cur = (document.getElementById('cur-' + n) || {}).value;
      var pb = document.getElementById('prepaid-' + n);
      if (cur && !(pb && pb.checked) && seen.indexOf(cur.toUpperCase()) < 0) seen.push(cur.toUpperCase());
    });
    var c = document.getElementById('currencyPills');
    c.innerHTML = seen.length === 0
      ? '<span style="color:var(--light);font-size:0.72rem;font-style:italic">none yet</span>'
      : seen.map(function(s){ return '<span class="currency-pill">'+s+'</span>'; }).join(' ');
  }

  function buildData() {
    var data = {
      version: '1.8',
      submittedAt: new Date().toISOString(),
      driver: document.getElementById('driverName').value,
      tour: document.getElementById('tourName').value,
      truck: document.getElementById('truckNo').value,
      dateOut: document.getElementById('dateOut').value,
      dateReturn: document.getElementById('dateReturn').value,
      floatReceived: parseFloat(document.getElementById('floatAmount').value) || 0,
      rows: []
    };
    rows.forEach(function(n){
      var row = document.getElementById('row-' + n);
      if (!row) return;
      var prepaid = document.getElementById('prepaid-' + n).checked;
      var sCell = document.getElementById('sterling-' + n);
      data.rows.push({
        n: n,
        date: document.getElementById('date-' + n).value,
        type: document.getElementById('type-' + n).value,
        country: document.getElementById('country-' + n).value,
        currency: document.getElementById('cur-' + n).value,
        amount: document.getElementById('amt-' + n).value,
        rate: document.getElementById('rate-' + n).value,
        sterling: prepaid ? 'prepaid' : (sCell ? sCell.textContent : ''),
        prepaid: prepaid,
        notes: document.getElementById('notes-' + n) ? document.getElementById('notes-' + n).value : ''
      });
    });
    return data;
  }

  function showSubmitConfirm() {
    // Check for any rows with missing rates
    var missing = [];
    rows.forEach(function(n){
      var prepaid = document.getElementById('prepaid-' + n);
      if (prepaid && prepaid.checked) return;
      var cur = (document.getElementById('cur-' + n).value || '').toUpperCase().trim();
      var rate = document.getElementById('rate-' + n).value;
      var amt = document.getElementById('amt-' + n).value;
      if (amt && cur && cur !== 'GBP' && !rate) missing.push(n);
    });
    if (missing.length > 0) {
      alert('Row' + (missing.length > 1 ? 's ' : ' ') + missing.join(', ') +
        ' have foreign currency amounts but no exchange rate.\\n\\nTap the Fetch button on those rows, or enter the rate manually.');
      return;
    }
    var driver = document.getElementById('driverName').value || 'Not entered';
    var tour = document.getElementById('tourName').value || 'Not entered';
    var dateOut = document.getElementById('dateOut').value || 'â€”';
    var dateRet = document.getElementById('dateReturn').value || 'â€”';
    var total = document.getElementById('grandTotal').textContent;
    var fl = parseFloat(document.getElementById('floatAmount').value) || 0;
    document.getElementById('confirmSummary').innerHTML =
      'Driver: ' + driver + '\\n' +
      'Tour:   ' + tour + '\\n' +
      'Dates:  ' + dateOut + ' â†’ ' + dateRet + '\\n' +
      (fl > 0 ? 'Float:  Â£' + fl.toFixed(2) + '\\n' : '') +
      'Total:  ' + total;
    document.getElementById('submitConfirm').classList.add('show');
  }

  function hideSubmitConfirm() {
    document.getElementById('submitConfirm').classList.remove('show');
  }

  function downloadJSON() {
    hideSubmitConfirm();
    var data = buildData();
    if (!data) return;
    var filename = 'roadclaim-' + (data.driver||'driver').toLowerCase().replace(/\\s+/g,'-') + '-' + (data.tour||'tour').toLowerCase().replace(/\\s+/g,'-') + '.json';
    var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
  }

  function confirmSubmit() {
    hideSubmitConfirm();
    var data = buildData();
    if (!data) return;

    // Show sending message
    var btn = document.querySelector('.btn-submit');
    if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }

    fetch('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function(r) { return r.json(); })
    .then(function(result) {
      if (result.success) {
        document.querySelector('.form-wrap').innerHTML =
          '<div style="text-align:center;padding:3rem 1rem">' +
          '<div style="font-size:2.5rem;margin-bottom:1rem">âœ“</div>' +
          '<h2 style="font-size:1.2rem;font-weight:600;margin-bottom:0.5rem">Expenses submitted</h2>' +
          '<p style="font-size:0.85rem;color:#666">Your submission has been received. You will be notified when it is approved.</p>' +
          '</div>';
      } else {
        alert('Submission failed. Please try again.');
        if (btn) { btn.textContent = 'Submit expenses â†’'; btn.disabled = false; }
      }
    })
    .catch(function() {
      alert('Could not reach the server. Please check your connection and try again.');
      if (btn) { btn.textContent = 'Submit expenses â†’'; btn.disabled = false; }
    });
  }

  document.getElementById('floatAmount').addEventListener('input', updateTotal);

  // Start with 3 rows
  for (var i = 0; i < 3; i++) addRow();
</script>
</body>
</html>
`;

const DASHBOARD = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Transam â€” Accounts Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #1a1a1a; --mid: #666; --light: #999; --rule: #e0ddd8;
    --bg: #f0ede8; --white: #fff; --accent: #c8392b; --accent-light: #fdf0ee;
    --green: #2a7a4b; --green-light: #e8f4ee;
    --amber: #b97100; --amber-light: #fdf3e0;
    --red: #c8392b; --red-light: #fdf0ee;
    --blue: #1a5fa8; --blue-light: #e8f0fb;
    --purple: #6b3fa0; --purple-light: #f0ebfa;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--ink); min-height: 100vh; padding: 0; }

  /* TOP BAR */
  .topbar { background: var(--ink); color: white; padding: 1.25rem 2.5rem; display: flex; align-items: baseline; gap: 1.5rem; }
  .topbar-title { font-family: 'DM Mono', monospace; font-size: 0.85rem; letter-spacing: 0.18em; text-transform: uppercase; color: #aaa; }
  .topbar-name { font-size: 1.15rem; font-weight: 600; color: white; }
  .topbar-version { font-family: 'DM Mono', monospace; font-size: 0.65rem; color: #555; margin-left: auto; }

  /* TABS */
  .tabs { background: #222; display: flex; gap: 0; border-bottom: 2px solid var(--accent); }
  .tab { font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.75rem 1.75rem; cursor: pointer; color: #888; border: none; background: transparent; transition: all 0.15s; border-bottom: 2px solid transparent; margin-bottom: -2px; }
  .tab:hover { color: #ccc; }
  .tab.active { color: white; border-bottom-color: var(--accent); }

  /* CONTENT */
  .tab-content { display: none; padding: 2rem 2.5rem; max-width: 1300px; }
  .tab-content.active { display: block; }

  /* PANELS */
  .panel { background: var(--white); border: 1px solid var(--rule); margin-bottom: 1.5rem; }
  .panel-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .panel-title { font-family: 'DM Mono', monospace; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; }
  .panel-body { padding: 1.5rem; }
  .badge { font-family: 'DM Mono', monospace; font-size: 0.68rem; padding: 0.15rem 0.65rem; border-radius: 2px; font-weight: 500; }
  .badge-red { background: var(--red); color: white; }
  .badge-amber { background: var(--amber); color: white; }
  .badge-green { background: var(--green); color: white; }
  .badge-blue { background: var(--blue); color: white; }
  .badge-purple { background: var(--purple); color: white; }
  .badge-grey { background: #888; color: white; }

  /* FORM GRID */
  .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem 2rem; }
  .form-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem 2rem; }
  .field-group { display: flex; flex-direction: column; gap: 0.3rem; }
  .field-group label { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: var(--light); }
  .field-group input, .field-group select { font-family: 'DM Sans', sans-serif; font-size: 0.9rem; border: none; border-bottom: 1.5px solid var(--rule); padding: 0.35rem 0; background: transparent; color: var(--ink); outline: none; transition: border-color 0.15s; width: 100%; }
  .field-group input:focus, .field-group select:focus { border-bottom-color: var(--blue); }

  /* STAT CARDS */
  .stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
  .stat-card { background: var(--white); border: 1px solid var(--rule); padding: 1.1rem 1.25rem; }
  .stat-label { font-size: 0.6rem; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: var(--light); margin-bottom: 0.35rem; }
  .stat-value { font-family: 'DM Mono', monospace; font-size: 1.4rem; font-weight: 500; }
  .stat-value.green { color: var(--green); }
  .stat-value.red { color: var(--red); }
  .stat-value.amber { color: var(--amber); }
  .stat-value.blue { color: var(--blue); }

  /* DROP ZONE */
  .drop-zone { border: 2px dashed var(--rule); background: #fafaf8; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 1.5rem; }
  .drop-zone:hover, .drop-zone.drag-over { border-color: var(--blue); background: var(--blue-light); }
  .drop-zone input[type=file] { display: none; }
  .drop-zone h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.3rem; }
  .drop-zone p { font-size: 0.78rem; color: var(--mid); }

  /* TABLES */
  table.dash-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  table.dash-table thead tr { background: var(--ink); color: white; }
  table.dash-table thead th { font-family: 'DM Mono', monospace; font-size: 0.58rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.65rem 0.7rem; text-align: left; white-space: nowrap; }
  table.dash-table thead th.r { text-align: right; }
  table.dash-table tbody tr { border-bottom: 1px solid var(--rule); transition: background 0.1s; }
  table.dash-table tbody tr:nth-child(even) { background: #fafaf8; }
  table.dash-table tbody td { padding: 0.6rem 0.7rem; vertical-align: middle; }
  table.dash-table tbody td.r { text-align: right; font-family: 'DM Mono', monospace; }
  table.dash-table tfoot tr { background: var(--ink); color: white; }
  table.dash-table tfoot td { padding: 0.75rem 0.7rem; font-family: 'DM Mono', monospace; font-size: 0.8rem; }
  table.dash-table tfoot td.r { text-align: right; font-weight: 600; }

  /* STATUS BUTTONS */
  .status-btn { font-family: 'DM Sans', sans-serif; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; padding: 0.25rem 0.65rem; border: none; cursor: pointer; border-radius: 2px; transition: all 0.15s; margin-right: 0.25rem; }
  .status-btn.approve { background: var(--green-light); color: var(--green); }
  .status-btn.approve:hover, .status-btn.approve.active { background: var(--green); color: white; }
  .status-btn.query { background: var(--amber-light); color: var(--amber); }
  .status-btn.query:hover, .status-btn.query.active { background: var(--amber); color: white; }

  /* FLOAT TABLE */
  .float-row-input { font-family: 'DM Sans', sans-serif; font-size: 0.8rem; border: none; border-bottom: 1px solid var(--rule); padding: 0.25rem 0.35rem; background: transparent; color: var(--ink); outline: none; width: 100%; }
  .float-row-input:focus { border-bottom-color: var(--blue); background: var(--blue-light); }

  /* ANOMALY */
  .anomaly-item { display: grid; grid-template-columns: auto 1fr auto; gap: 0.75rem; align-items: start; padding: 0.8rem 1rem; margin-bottom: 0.4rem; border-left: 3px solid; }
  .anomaly-item.high { background: var(--red-light); border-color: var(--red); }
  .anomaly-item.medium { background: var(--amber-light); border-color: var(--amber); }
  .anomaly-item .detail h4 { font-size: 0.8rem; font-weight: 600; margin-bottom: 0.15rem; }
  .anomaly-item .detail p { font-size: 0.73rem; color: var(--mid); }
  .anomaly-item .pct { font-family: 'DM Mono', monospace; font-size: 0.8rem; font-weight: 500; text-align: right; }
  .anomaly-item.high .pct { color: var(--red); }
  .anomaly-item.medium .pct { color: var(--amber); }

  /* REPORT */
  .report-page { background: white; border: 1px solid var(--rule); padding: 3rem; max-width: 820px; margin: 0 auto; font-size: 0.85rem; line-height: 1.6; }
  .report-letterhead { border-bottom: 3px solid var(--ink); padding-bottom: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; }
  .report-company { font-family: 'DM Mono', monospace; font-size: 1.1rem; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; }
  .report-doc-type { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--mid); }
  .report-meta { text-align: right; font-size: 0.78rem; color: var(--mid); line-height: 1.8; }
  .report-section { margin-bottom: 2rem; }
  .report-section h3 { font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--mid); border-bottom: 1px solid var(--rule); padding-bottom: 0.4rem; margin-bottom: 1rem; }
  table.report-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
  table.report-table thead tr { background: var(--ink); color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  table.report-table thead th { font-family: 'DM Mono', monospace; font-size: 0.6rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.55rem 0.7rem; text-align: left; }
  table.report-table thead th.r { text-align: right; }
  table.report-table tbody tr { border-bottom: 1px solid var(--rule); }
  table.report-table tbody td { padding: 0.55rem 0.7rem; }
  table.report-table tbody td.r { text-align: right; font-family: 'DM Mono', monospace; }
  table.report-table tfoot tr { border-top: 2px solid var(--ink); }
  table.report-table tfoot td { padding: 0.6rem 0.7rem; font-weight: 600; font-family: 'DM Mono', monospace; }
  table.report-table tfoot td.r { text-align: right; }
  .report-flags { margin-top: 0.5rem; font-size: 0.75rem; color: var(--red); }
  .report-signoff { margin-top: 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
  .signoff-block { border-top: 1px solid var(--ink); padding-top: 0.5rem; }
  .signoff-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mid); }
  .signoff-space { height: 2.5rem; }

  /* BUTTONS */
  .btn { font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; padding: 0.55rem 1.25rem; border: none; cursor: pointer; transition: all 0.15s; }
  .btn-ink { background: var(--ink); color: white; }
  .btn-ink:hover { background: #333; }
  .btn-blue { background: var(--blue); color: white; }
  .btn-blue:hover { background: #154d8a; }
  .btn-red { background: var(--accent); color: white; }
  .btn-red:hover { background: #a82e22; }
  .btn-green { background: var(--green); color: white; }
  .btn-green:hover { background: #1e5c38; }
  .btn-ghost { background: transparent; color: var(--mid); border: 1px solid var(--rule); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  .btn-row { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; margin-top: 1rem; }

  .cell-high { color: var(--red); font-weight: 700; }
  .cell-amber { color: var(--amber); font-weight: 600; }
  .cell-green { color: var(--green); }
  .owed { color: var(--red); font-weight: 700; }
  .credit { color: var(--green); font-weight: 600; }
  .settled { color: var(--light); }

  .empty-state { text-align: center; padding: 3rem; color: var(--light); font-size: 0.85rem; }

  /* PASSWORD OVERLAY */
  .pw-overlay { position: fixed; inset: 0; background: var(--ink); z-index: 999; display: flex; align-items: center; justify-content: center; }
  .pw-box { background: var(--white); padding: 3rem; max-width: 380px; width: 100%; text-align: center; }
  .pw-box .pw-logo { font-family: 'DM Mono', monospace; font-size: 1.1rem; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 0.5rem; }
  .pw-box .pw-sub { font-size: 0.75rem; color: var(--light); margin-bottom: 2rem; letter-spacing: 0.08em; text-transform: uppercase; }
  .pw-box input { font-family: 'DM Sans', sans-serif; font-size: 1rem; width: 100%; border: none; border-bottom: 2px solid var(--rule); padding: 0.5rem 0; text-align: center; letter-spacing: 0.2em; outline: none; margin-bottom: 1.5rem; background: transparent; }
  .pw-box input:focus { border-bottom-color: var(--blue); }
  .pw-error { color: var(--red); font-size: 0.78rem; margin-top: -1rem; margin-bottom: 1rem; display: none; }

  /* APPROVER BAR */
  .approver-bar { background: var(--green-light); border-bottom: 1px solid #b2d8c0; padding: 0.6rem 2.5rem; display: flex; align-items: center; gap: 1rem; font-size: 0.78rem; }
  .approver-bar label { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--green); }
  .approver-bar select { font-family: 'DM Sans', sans-serif; font-size: 0.82rem; border: none; border-bottom: 1px solid #b2d8c0; background: transparent; color: var(--ink); outline: none; padding: 0.2rem 0; }
  .approver-bar .session-note { margin-left: auto; font-size: 0.68rem; color: var(--green); font-style: italic; }

  @media print {
    body { background: white; }
    .topbar, .tabs, .tab-content:not(#tab-report) { display: none !important; }
    #tab-report { display: block !important; padding: 0; }
    .btn-row, .panel-header button { display: none; }
    .report-page { border: none; padding: 2rem; max-width: 100%; }
  }
</style>
</head>
<body>

<!-- PASSWORD OVERLAY -->
<div class="pw-overlay" id="pwOverlay">
  <div class="pw-box">
    <div class="pw-logo">Accounts Dashboard</div>
    <div class="pw-sub">Authorised access only</div>
    <input type="password" id="pwInput" placeholder="Enter password" onkeydown="if(event.key==='Enter')checkPassword()">
    <div class="pw-error" id="pwError">Incorrect password. Please try again.</div>
    <button class="btn btn-ink" style="width:100%" onclick="checkPassword()">Enter</button>
  </div>
</div>

<!-- APPROVER BAR -->
<div class="approver-bar" id="approverBar" style="display:none">
  <label>Signed in as</label>
  <select id="approverSelect">
    <option value="">â€” select approver â€”</option>
    <option value="Leigh Harrington">Leigh Harrington (Accounts)</option>
    <option value="Deputy Accounts">Deputy (Accounts)</option>
  </select>
  <span class="session-note" id="sessionNote"></span>
</div>

<div class="topbar">
  <div class="topbar-title">Transam</div>
  <div class="topbar-name">Dashboard v1.0</div>
  <div class="topbar-version">v1.1</div>
</div>

<div class="tabs">
  <button class="tab active" onclick="showTab('setup')">1. Tour Setup</button>
  <button class="tab" onclick="showTab('submissions')">2. Submissions</button>
  <button class="tab" onclick="showTab('floats')">3. Float Reconciliation</button>
  <button class="tab" onclick="showTab('anomalies')">4. Anomalies</button>
  <button class="tab" onclick="showTab('report')">5. Summary Report</button>
</div>

<!-- TAB 1: SETUP -->
<div class="tab-content active" id="tab-setup">
  <div class="panel">
    <div class="panel-header"><div class="panel-title">Tour Information</div></div>
    <div class="panel-body">
      <div class="form-grid">
        <div class="field-group"><label>Tour / Artist Name</label><input type="text" id="s-tour" placeholder="e.g. Bruno Mars World Tour 2026" oninput="updateReport()"></div>
        <div class="field-group"><label>Promoter / Client</label><input type="text" id="s-promoter" placeholder="e.g. Live Nation" oninput="updateReport()"></div>
        <div class="field-group"><label>Transport Company</label><input type="text" id="s-company" value="Transam" oninput="updateReport()"></div>
        <div class="field-group"><label>Tour Start Date</label><input type="date" id="s-start" oninput="updateReport()"></div>
        <div class="field-group"><label>Tour End Date</label><input type="date" id="s-end" oninput="updateReport()"></div>
        <div class="field-group"><label>Accounts Reference</label><input type="text" id="s-ref" placeholder="e.g. TRN-2026-047" oninput="updateReport()"></div>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-header">
      <div class="panel-title">Driver Float Register</div>
      <span class="badge badge-blue" id="float-count-badge">0 drivers</span>
    </div>
    <div class="panel-body">
      <p style="font-size:0.78rem;color:var(--mid);margin-bottom:1rem;">Enter each driver and the float issued before departure. Leave float at 0 if no float was issued.</p>
      <table class="dash-table" id="floatRegisterTable">
        <thead>
          <tr>
            <th>#</th>
            <th>Driver Name</th>
            <th>Role</th>
            <th class="r">Float Currency</th>
            <th class="r">Float Issued (Â£)</th>
            <th style="width:36px"></th>
          </tr>
        </thead>
        <tbody id="floatRegisterBody"></tbody>
      </table>
      <div class="btn-row">
        <button class="btn btn-ink" onclick="addFloatRow()">+ Add Driver</button>
      </div>
    </div>
  </div>
</div>

<!-- TAB 2: SUBMISSIONS -->
<div class="tab-content" id="tab-submissions">
  <div class="stats-row" id="statsRow">
    <div class="stat-card"><div class="stat-label">Submissions</div><div class="stat-value blue" id="stat-subs">0</div></div>
    <div class="stat-card"><div class="stat-label">Approved</div><div class="stat-value green" id="stat-approved">0</div></div>
    <div class="stat-card"><div class="stat-label">Returned</div><div class="stat-value amber" id="stat-queried">0</div></div>
    <div class="stat-card"><div class="stat-label">Total Claimed</div><div class="stat-value" id="stat-total">Â£0.00</div></div>
    <div class="stat-card"><div class="stat-label">Anomalies</div><div class="stat-value red" id="stat-anomalies">0</div></div>
  </div>

  <div style="background:#f0f7f0;border:1px solid #2a7a4b;border-radius:2px;padding:1rem 1.25rem;margin-bottom:1.5rem;font-size:0.82rem;color:#2a7a4b;display:flex;align-items:center;gap:1rem;">
    <span>â— Live â€” submissions arrive automatically. Dashboard refreshes every 30 seconds.</span>
    <button onclick="loadFromServer()" style="margin-left:auto;background:none;border:1px solid #2a7a4b;color:#2a7a4b;font-size:0.75rem;padding:0.3rem 0.7rem;border-radius:2px;cursor:pointer;">Refresh now</button>
  </div>

  <div class="panel">
    <div class="panel-header">
      <div class="panel-title">Received Submissions</div>
      <span class="badge badge-blue" id="sub-count-badge">0 files</span>
    </div>
    <div id="submissionsBody">
      <div class="empty-state">No files loaded yet. Drop files above to begin.</div>
    </div>
  </div>
</div>

<!-- TAB 3: FLOAT RECONCILIATION -->
<div class="tab-content" id="tab-floats">
  <div class="panel">
    <div class="panel-header">
      <div class="panel-title">Float Reconciliation</div>
      <span class="badge badge-purple">Per Driver</span>
    </div>
    <div class="panel-body" id="floatReconBody">
      <div class="empty-state">Load submissions and complete the float register to see reconciliation.</div>
    </div>
  </div>
</div>

<!-- TAB 4: ANOMALIES -->
<div class="tab-content" id="tab-anomalies">
  <div class="panel">
    <div class="panel-header">
      <div class="panel-title">Flagged Anomalies</div>
      <span class="badge badge-red" id="anomaly-badge">0</span>
    </div>
    <div class="panel-body" id="anomalyBody">
      <div class="empty-state">No submissions loaded yet.</div>
    </div>
    <div style="padding:0 1.5rem 1rem;font-size:0.72rem;color:var(--light);font-style:italic;">
      Flagged when a driver's total or category spend is 60%+ above the group average (red = 100%+), or when an FX conversion rate differs from the Frankfurter historical rate by more than 3% (amber) or 10% (red). Hover a rate cell for submitted vs actual values.
    </div>
  </div>
</div>

<!-- TAB 5: REPORT -->
<div class="tab-content" id="tab-report">
  <div class="btn-row" style="margin-bottom:1.5rem">
    <button class="btn btn-red" onclick="window.print()">Print / Save PDF</button>
    <button class="btn btn-ghost" onclick="updateReport()">Refresh Report</button>
  </div>
  <div class="report-page" id="reportPage">
    <div class="report-letterhead">
      <div>
        <div class="report-company" id="r-company">Transam</div>
        <div class="report-doc-type">Tour Expense Summary â€” Confidential</div>
      </div>
      <div class="report-meta" id="r-meta">â€”</div>
    </div>

    <div class="report-section">
      <h3>Tour Details</h3>
      <table class="report-table" id="r-tour-table">
        <tbody>
          <tr><td style="width:200px;color:var(--mid)">Artist / Tour</td><td id="r-tour">â€”</td></tr>
          <tr><td style="color:var(--mid)">Promoter / Client</td><td id="r-promoter">â€”</td></tr>
          <tr><td style="color:var(--mid)">Tour Dates</td><td id="r-dates">â€”</td></tr>
          <tr><td style="color:var(--mid)">Reference</td><td id="r-ref">â€”</td></tr>
          <tr><td style="color:var(--mid)">Drivers on Tour</td><td id="r-drivers">â€”</td></tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h3>Expense Summary by Driver</h3>
      <div id="r-driver-table"><p style="color:var(--light);font-size:0.8rem;">No submissions loaded.</p></div>
    </div>

    <div class="report-section">
      <h3>Float Reconciliation</h3>
      <div id="r-float-table"><p style="color:var(--light);font-size:0.8rem;">No float data entered.</p></div>
    </div>

    <div class="report-section" id="r-anomaly-section">
      <h3>Anomalies Noted</h3>
      <div id="r-anomaly-content"><p style="color:var(--light);font-size:0.8rem;">None.</p></div>
    </div>

    <div class="report-section">
      <h3>Totals</h3>
      <table class="report-table">
        <tbody>
          <tr><td style="width:280px;color:var(--mid)">Total Expenses Claimed</td><td class="r" id="r-total-claimed">Â£0.00</td></tr>
          <tr><td style="color:var(--mid)">Total Floats Issued</td><td class="r" id="r-total-floats">Â£0.00</td></tr>
          <tr><td style="color:var(--mid)">Net Reimbursement Required</td><td class="r" id="r-net" style="font-weight:700">Â£0.00</td></tr>
        </tbody>
      </table>
    </div>

    <div class="report-signoff">
      <div class="signoff-block">
        <div class="signoff-label">Prepared by (Accounts)</div>
        <div style="margin-top:0.5rem;font-size:0.88rem;font-weight:600" id="r-signoff-name">â€”</div>
        <div style="margin-top:0.25rem;font-size:0.78rem;color:var(--mid)" id="r-signoff-date">â€”</div>
      </div>
      <div class="signoff-block">
        <div class="signoff-label">Report Status</div>
        <div style="margin-top:0.5rem;font-size:0.88rem;font-weight:600" id="r-signoff-status">â€”</div>
        <div style="margin-top:0.25rem;font-size:0.78rem;color:var(--mid)" id="r-signoff-ref">â€”</div>
      </div>
    </div>
  </div>
</div>

<script>
  var submissions = [];
  var floatRowCount = 0;
  var approvalStatus = {};
  var rateCache = {};
  var ratePending = {};

  // Load submissions from server on page open
  function loadFromServer() {
    fetch('/submissions')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        submissions = data;
        submissions.forEach(function(s) {
          var key = s.driver + '|' + (s.receivedAt || s.submittedAt || '');
          if (!approvalStatus[key]) approvalStatus[key] = s.status || 'pending';
        });
        renderAll();
        prefetchRates();
      })
      .catch(function() { console.log('Could not load submissions from server.'); });
  }

  // Auto-refresh every 30 seconds
  setInterval(loadFromServer, 30000);
  loadFromServer();

  function showTab(name) {
    document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.remove('active'); });
    document.querySelectorAll('.tab').forEach(function(el) { el.classList.remove('active'); });
    document.getElementById('tab-' + name).classList.add('active');
    var tabs = document.querySelectorAll('.tab');
    var map = ['setup','submissions','floats','anomalies','report'];
    tabs[map.indexOf(name)].classList.add('active');
    if (name === 'report') updateReport();
  }

  // DRAG AND DROP
  var dz = document.getElementById('dropZone');
  dz.addEventListener('dragover', function(e) { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', function() { dz.classList.remove('drag-over'); });
  dz.addEventListener('drop', function(e) { e.preventDefault(); dz.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });

  function handleFiles(files) {
    var pending = files.length;
    Array.prototype.forEach.call(files, function(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var data = JSON.parse(e.target.result);
          var key = data.driver + '|' + (data.receivedAt||data.submittedAt||'');
          if (!submissions.find(function(s) { return s.driver + '|' + (s.receivedAt||s.submittedAt||'') === key; })) {
            submissions.push(data);
            if (!approvalStatus[key]) approvalStatus[key] = 'pending';
          }
        } catch(err) {
          alert('Could not read: ' + file.name);
        }
        pending--;
        if (pending === 0) { renderAll(); prefetchRates(); }
      };
      reader.readAsText(file);
    });
  }

  function gbpVal(row) {
    if (row.prepaid) return 0;
    return parseFloat((row.sterling || '').replace('Â£','')) || 0;
  }

  function driverTotal(d) {
    return (d.rows || []).reduce(function(s, r) { return s + gbpVal(r); }, 0);
  }

  function catTotals(d) {
    var cats = {};
    (d.rows || []).forEach(function(r) {
      if (r.prepaid) return;
      var t = r.type || 'Other';
      var v = gbpVal(r);
      if (v > 0) cats[t] = (cats[t] || 0) + v;
    });
    return cats;
  }

  // â”€â”€ LIVE RATE INFRASTRUCTURE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // Fetch the actual GBP rate for currency on ISO date (YYYY-MM-DD).
  // Returns a Promise<number|null>. Results are cached; in-flight requests are
  // deduplicated so the same currency/date never fires twice.
  function fetchRate(currency, date) {
    var key = currency + '|' + date;
    if (key in rateCache) return Promise.resolve(rateCache[key]);
    if (ratePending[key]) return ratePending[key];
    var url = 'https://api.frankfurter.app/' + date + '?from=' + encodeURIComponent(currency) + '&to=GBP';
    var p = fetch(url)
      .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function(data) {
        var rate = (data.rates && data.rates.GBP != null) ? data.rates.GBP : null;
        rateCache[key] = rate;
        delete ratePending[key];
        return rate;
      })
      .catch(function() {
        rateCache[key] = null;
        delete ratePending[key];
        return null;
      });
    ratePending[key] = p;
    return p;
  }

  // Compare a row's implied conversion rate against the fetched actual rate.
  // Returns { pct, actual, submitted } if the discrepancy exceeds 3%, else null.
  // Silently returns null for GBP rows, prepaid rows, or rows with no cached rate yet.
  function rateFlag(row) {
    if (row.prepaid) return null;
    var currency = (row.currency || '').replace(/\\s/g, '');
    if (!currency || currency === 'GBP' || currency === 'Â£') return null;
    var amount  = parseFloat((row.amount  || '').replace(/[^0-9.\\-]/g, '')) || 0;
    var sterling = parseFloat((row.sterling || '').replace(/[^0-9.\\-]/g, '')) || 0;
    if (!amount || !sterling) return null;
    var submittedRate = sterling / amount;  // GBP per 1 unit of foreign currency
    var key = currency + '|' + (row.date || '');
    var actualRate = rateCache[key];
    if (actualRate === undefined || actualRate === null) return null;
    var pct = Math.abs(submittedRate - actualRate) / actualRate;
    if (pct < 0.03) return null;  // â‰¤ 3% tolerance â€” rounding / mid-day spread
    return { pct: pct, actual: actualRate, submitted: submittedRate };
  }

  // Pre-fetch every unique currency/date pair across all loaded submissions.
  // Resolves when all requests settle, then re-renders so flags appear.
  function prefetchRates() {
    var promises = [];
    submissions.forEach(function(d) {
      (d.rows || []).forEach(function(r) {
        if (r.prepaid) return;
        var currency = (r.currency || '').replace(/\\s/g, '');
        if (!currency || currency === 'GBP' || currency === 'Â£') return;
        var date = (r.date || '').trim();
        if (!date || !/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) return;
        promises.push(fetchRate(currency, date));
      });
    });
    if (!promises.length) return;
    Promise.all(promises).then(function() { renderAll(); });
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function renderAll() {
    renderSubmissions();
    renderAnomalies();
    renderFloatRecon();
    updateStats();
  }

  function updateStats() {
    var approved = 0, queried = 0;
    submissions.forEach(function(s) {
      var key = s.driver + '|' + (s.receivedAt||s.submittedAt||'');
      if (approvalStatus[key] === 'approved') approved++;
      if (approvalStatus[key] === 'queried') queried++;
    });
    var total = submissions.reduce(function(s, d) { return s + driverTotal(d); }, 0);
    document.getElementById('stat-subs').textContent = submissions.length;
    document.getElementById('stat-approved').textContent = approved;
    document.getElementById('stat-queried').textContent = queried;
    document.getElementById('stat-total').textContent = 'Â£' + total.toFixed(2);
    document.getElementById('sub-count-badge').textContent = submissions.length + ' file' + (submissions.length !== 1 ? 's' : '');
  }

  function renderSubmissions() {
    var body = document.getElementById('submissionsBody');
    if (submissions.length === 0) {
      body.innerHTML = '<div class="empty-state">No files loaded yet.</div>';
      return;
    }
    var html = '';
    submissions.forEach(function(d) {
      var key = d.driver + '|' + d.exportedAt;
      var status = approvalStatus[key] || 'pending';
      var total = driverTotal(d);
      var prepaidCount = (d.rows || []).filter(function(r) { return r.prepaid; }).length;
      var claimedCount = (d.rows || []).filter(function(r) { return !r.prepaid && gbpVal(r) > 0; }).length;
      var statusBadge = status === 'approved' ? '<span class="badge badge-green">Approved</span>' :
                        status === 'queried'  ? '<span class="badge badge-amber">Returned</span>' :
                        '<span class="badge badge-grey">Pending</span>';
      html += '<div style="border-bottom:1px solid var(--rule);padding:1rem 1.5rem;">';
      html += '<div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">';
      html += '<div style="flex:1;min-width:200px"><strong>' + (d.driver || 'â€”') + '</strong>';
      html += '<span style="font-size:0.75rem;color:var(--mid);margin-left:0.75rem">' + (d.tour || 'â€”') + '</span></div>';
      html += '<div style="font-family:\\'DM Mono\\',monospace;font-size:0.82rem">' + claimedCount + ' rows Â· ' + prepaidCount + ' prepaid</div>';
      html += '<div style="font-family:\\'DM Mono\\',monospace;font-size:0.95rem;font-weight:600;color:var(--green)">Â£' + total.toFixed(2) + '</div>';
      html += statusBadge;
      html += '<button class="status-btn approve' + (status==='approved'?' active':'') + '" onclick="setStatus(\\'' + key + '\\',\\'approved\\')">âœ“ Approve</button>';
      html += '<button class="status-btn query' + (status==='queried'?' active':'') + '" onclick="setStatus(\\'' + key + '\\',\\'queried\\')">? Query</button>';
      html += '</div>';
      // Row detail (collapsed)
      html += '<div style="margin-top:0.75rem;overflow-x:auto">';
      html += '<table class="dash-table"><thead><tr><th>#</th><th>Date</th><th>From</th><th>To</th><th>Type</th><th>Country</th><th class="r">Currency</th><th class="r">Amount</th><th class="r">Sterling</th><th class="r">Rate check</th><th>Notes</th></tr></thead><tbody>';
      (d.rows || []).forEach(function(r) {
        if (!r.from && !r.to && !r.amount) return;
        var prepaidStyle = r.prepaid ? 'style="color:var(--light);font-style:italic"' : '';
        html += '<tr ' + prepaidStyle + '>';
        html += '<td>' + r.n + '</td><td>' + (r.date||'') + '</td><td>' + (r.from||'') + '</td><td>' + (r.to||'') + '</td>';
        html += '<td>' + (r.type||'') + '</td><td>' + (r.country||'') + '</td>';
        html += '<td class="r">' + (r.prepaid ? 'â€”' : (r.currency||'')) + '</td>';
        html += '<td class="r">' + (r.prepaid ? 'â€”' : (r.amount||'')) + '</td>';
        html += '<td class="r">' + (r.prepaid ? 'prepaid' : (r.sterling||'â€”')) + '</td>';
        var rflag = rateFlag(r);
        if (r.prepaid || !r.currency || r.currency === 'GBP') {
          html += '<td></td>';
        } else if (rflag) {
          var rfColor = rflag.pct > 0.10 ? 'var(--red)' : 'var(--amber)';
          html += '<td class="r" style="font-size:0.7rem;color:' + rfColor + ';white-space:nowrap" title="Submitted: ' + rflag.submitted.toFixed(4) + ' Â· Actual: ' + rflag.actual.toFixed(4) + '">âš  ' + Math.round(rflag.pct * 100) + '% off</td>';
        } else if (rateCache[(r.currency||'').replace(/\\s/g,'') + '|' + (r.date||'')] !== undefined) {
          html += '<td class="r" style="font-size:0.7rem;color:var(--green)">âœ“</td>';
        } else {
          html += '<td class="r" style="font-size:0.68rem;color:var(--light)">â€¦</td>';
        }
        html += '<td style="font-size:0.73rem;color:var(--mid)">' + (r.notes||'') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div></div>';
    });
    body.innerHTML = html;
    updateStats();
  }

  function setStatus(key, status) {
    var sub = submissions.find(function(s) { return (s.driver + '|' + (s.receivedAt||s.submittedAt||'')) === key; });
    if (!sub) return;
    var endpoint = status === 'approved' ? '/approve/' + sub.id : '/query/' + sub.id;
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: '' })
    })
    .then(function() { loadFromServer(); })
    .catch(function() { alert('Could not update status. Check server connection.'); });
  }

  function removeSubmission(id) {
    if (!confirm('Remove this submission?')) return;
    fetch('/submissions/' + id, { method: 'DELETE' })
      .then(function() { loadFromServer(); })
      .catch(function() { alert('Could not remove submission.'); });
  }

  function renderAnomalies() {
    var anomalies = [];
    var totals = submissions.map(driverTotal);
    var grandAvg = totals.length > 0 ? totals.reduce(function(a,b){return a+b;},0) / totals.length : 0;

    submissions.forEach(function(d, i) {
      var t = totals[i];
      var pct = grandAvg > 0 ? (t - grandAvg) / grandAvg : 0;
      if (pct > 1.0) anomalies.push({ level:'high', driver:d.driver, type:'Total claim', detail:'Â£'+t.toFixed(2)+' vs avg Â£'+grandAvg.toFixed(2), pct:pct });
      else if (pct > 0.6) anomalies.push({ level:'medium', driver:d.driver, type:'Total claim', detail:'Â£'+t.toFixed(2)+' vs avg Â£'+grandAvg.toFixed(2), pct:pct });
    });

    var allCats = [];
    submissions.forEach(function(d) { Object.keys(catTotals(d)).forEach(function(c) { if (allCats.indexOf(c)<0) allCats.push(c); }); });
    allCats.forEach(function(cat) {
      var vals = submissions.map(function(d) { return catTotals(d)[cat] || 0; });
      var nonZero = vals.filter(function(v) { return v > 0; });
      if (nonZero.length < 2) return;
      var avg = nonZero.reduce(function(a,b){return a+b;},0) / nonZero.length;
      submissions.forEach(function(d, i) {
        var v = vals[i];
        if (!v) return;
        var pct = avg > 0 ? (v - avg) / avg : 0;
        if (pct > 1.0) anomalies.push({ level:'high', driver:d.driver, type:cat, detail:'Â£'+v.toFixed(2)+' vs avg Â£'+avg.toFixed(2)+' ('+nonZero.length+' drivers)', pct:pct });
        else if (pct > 0.6) anomalies.push({ level:'medium', driver:d.driver, type:cat, detail:'Â£'+v.toFixed(2)+' vs avg Â£'+avg.toFixed(2)+' ('+nonZero.length+' drivers)', pct:pct });
      });
    });

    // Rate discrepancies â€” compare driver's implied conversion rate vs live historical rate
    submissions.forEach(function(d) {
      (d.rows || []).forEach(function(r) {
        var flag = rateFlag(r);
        if (!flag) return;
        var level = flag.pct > 0.10 ? 'high' : 'medium';
        anomalies.push({
          level: level,
          driver: d.driver,
          type: 'FX rate discrepancy',
          detail: (r.currency || '') + ' on ' + (r.date || '') +
                  ' â€” submitted ' + flag.submitted.toFixed(4) +
                  ' GBP/' + (r.currency || '') +
                  ', actual ' + flag.actual.toFixed(4),
          pct: flag.pct
        });
      });
    });

    anomalies.sort(function(a,b) { return b.pct - a.pct; });
    document.getElementById('stat-anomalies').textContent = anomalies.length;
    document.getElementById('anomaly-badge').textContent = anomalies.length;

    var body = document.getElementById('anomalyBody');
    if (anomalies.length === 0) {
      body.innerHTML = '<div class="empty-state">No anomalies detected.</div>';
    } else {
      body.innerHTML = anomalies.map(function(a) {
        return '<div class="anomaly-item ' + a.level + '">' +
          '<div>' + (a.level==='high'?'ðŸ”´':'ðŸŸ¡') + '</div>' +
          '<div class="detail"><h4>' + a.driver + ' â€” ' + a.type + '</h4>' +
          '<p>' + a.detail + ' Â· ' + Math.round(a.pct*100) + '% above average</p></div>' +
          '<div class="pct">+' + Math.round(a.pct*100) + '%</div></div>';
      }).join('');
    }
  }

  // FLOAT REGISTER
  function addFloatRow(name, role, amount) {
    floatRowCount++;
    var n = floatRowCount;
    var tbody = document.getElementById('floatRegisterBody');
    var tr = document.createElement('tr');
    tr.id = 'float-row-' + n;
    tr.innerHTML =
      '<td style="color:var(--light);font-family:\\'DM Mono\\',monospace;font-size:0.7rem;padding:0.5rem 0.7rem">' + n + '</td>' +
      '<td><input class="float-row-input" type="text" id="fn-'+n+'" placeholder="Driver name" value="'+(name||'')+'" oninput="renderFloatRecon()"></td>' +
      '<td><select class="float-row-input" id="fr-'+n+'" onchange="renderFloatRecon()">' +
        '<option value="driver">Driver</option><option value="lead">Lead Driver</option>' +
      '</select></td>' +
      '<td><input class="float-row-input" type="text" id="fc-'+n+'" value="GBP" style="text-align:right;width:60px" oninput="renderFloatRecon()"></td>' +
      '<td><input class="float-row-input" type="number" step="0.01" id="fa-'+n+'" placeholder="0.00" value="'+(amount||'')+'" style="text-align:right" oninput="renderFloatRecon()"></td>' +
      '<td><button class="row-del" onclick="removeFloatRow('+n+')" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:1rem;padding:0.3rem">&times;</button></td>';
    tbody.appendChild(tr);
    document.getElementById('float-count-badge').textContent = floatRowCount + ' driver' + (floatRowCount!==1?'s':'');
    renderFloatRecon();
  }

  function removeFloatRow(n) {
    var el = document.getElementById('float-row-' + n);
    if (el) el.remove();
    renderFloatRecon();
  }

  function getFloatData() {
    var result = [];
    for (var i = 1; i <= floatRowCount; i++) {
      var nameEl   = document.getElementById('fn-' + i);
      var amtEl    = document.getElementById('fa-' + i);
      var roleEl   = document.getElementById('fr-' + i);
      if (!nameEl) continue;
      result.push({
        name: nameEl.value,
        role: roleEl ? roleEl.value : 'driver',
        float: parseFloat(amtEl ? amtEl.value : 0) || 0
      });
    }
    return result;
  }

  function renderFloatRecon() {
    var floats = getFloatData();
    var body = document.getElementById('floatReconBody');
    if (floats.length === 0 && submissions.length === 0) {
      body.innerHTML = '<div class="empty-state">Add drivers in Tour Setup and load submissions to see reconciliation.</div>';
      return;
    }

    // Match float entries to submissions
    var rows = [];
    floats.forEach(function(f) {
      var sub = submissions.find(function(s) {
        return s.driver && f.name && s.driver.toLowerCase().trim() === f.name.toLowerCase().trim();
      });
      var claimed = sub ? driverTotal(sub) : null;
      var balance = claimed !== null ? f.float - claimed : null;
      rows.push({ name: f.name, role: f.role, float: f.float, claimed: claimed, balance: balance });
    });

    // Also add any submissions not in the float register
    submissions.forEach(function(s) {
      var found = floats.find(function(f) {
        return f.name && s.driver && f.name.toLowerCase().trim() === s.driver.toLowerCase().trim();
      });
      if (!found) {
        var claimed = driverTotal(s);
        rows.push({ name: s.driver, role: 'driver', float: 0, claimed: claimed, balance: -claimed });
      }
    });

    var totalFloats = rows.reduce(function(s,r){return s+r.float;},0);
    var totalClaimed = rows.reduce(function(s,r){return s+(r.claimed||0);},0);
    var totalBalance = totalFloats - totalClaimed;

    var html = '<table class="dash-table"><thead><tr>' +
      '<th>Driver</th><th>Role</th><th class="r">Float Issued</th>' +
      '<th class="r">Expenses Claimed</th><th class="r">Balance</th><th>Status</th>' +
      '</tr></thead><tbody>';

    rows.forEach(function(r) {
      var balanceStr = r.balance !== null ? (r.balance >= 0 ? 'Â£'+r.balance.toFixed(2) : '-Â£'+Math.abs(r.balance).toFixed(2)) : 'â€”';
      var balanceCls = r.balance === null ? '' : r.balance > 0 ? 'credit' : r.balance < 0 ? 'owed' : 'settled';
      var statusStr = r.balance === null ? 'â³ Awaiting submission' :
                      r.balance > 0.005 ? 'â†© Driver owes Â£'+r.balance.toFixed(2) :
                      r.balance < -0.005 ? 'â†’ Owe driver Â£'+Math.abs(r.balance).toFixed(2) :
                      'âœ… Settled';
      html += '<tr><td><strong>' + r.name + '</strong></td>' +
        '<td style="font-size:0.75rem;color:var(--mid)">' + (r.role==='lead'?'Lead Driver':'Driver') + '</td>' +
        '<td class="r">Â£' + r.float.toFixed(2) + '</td>' +
        '<td class="r">' + (r.claimed !== null ? 'Â£'+r.claimed.toFixed(2) : 'â€”') + '</td>' +
        '<td class="r ' + balanceCls + '">' + balanceStr + '</td>' +
        '<td style="font-size:0.75rem">' + statusStr + '</td></tr>';
    });

    html += '</tbody><tfoot><tr>' +
      '<td colspan="2" style="color:#aaa;font-size:0.65rem;letter-spacing:0.1em;text-transform:uppercase">Totals</td>' +
      '<td class="r">Â£' + totalFloats.toFixed(2) + '</td>' +
      '<td class="r">Â£' + totalClaimed.toFixed(2) + '</td>' +
      '<td class="r ' + (totalBalance >= 0 ? 'credit' : 'owed') + '">Â£' + Math.abs(totalBalance).toFixed(2) + '</td>' +
      '<td></td></tr></tfoot></table>';

    body.innerHTML = html;
  }

  function updateReport() {
    var tour = document.getElementById('s-tour').value || 'â€”';
    var promoter = document.getElementById('s-promoter').value || 'â€”';
    var company = document.getElementById('s-company').value || 'Transam';
    var start = document.getElementById('s-start').value || 'â€”';
    var end = document.getElementById('s-end').value || 'â€”';
    var ref = document.getElementById('s-ref').value || 'â€”';

    document.getElementById('r-company').textContent = company;
    document.getElementById('r-meta').innerHTML = 'Generated: ' + new Date().toLocaleDateString('en-GB') + '<br>Reference: ' + ref;
    document.getElementById('r-tour').textContent = tour;
    document.getElementById('r-promoter').textContent = promoter;
    document.getElementById('r-dates').textContent = start + ' to ' + end;
    document.getElementById('r-ref').textContent = ref;
    document.getElementById('r-drivers').textContent = submissions.length + ' driver' + (submissions.length!==1?'s':'');

    // Driver table
    var totalClaimed = 0;
    if (submissions.length === 0) {
      document.getElementById('r-driver-table').innerHTML = '<p style="color:var(--light);font-size:0.8rem">No submissions loaded.</p>';
    } else {
      var html = '<table class="report-table"><thead><tr><th>Driver</th><th>Date Out</th><th>Date Return</th><th class="r">Rows</th><th class="r">Prepaid Legs</th><th class="r">Total Claimed</th><th>Status</th></tr></thead><tbody>';
      submissions.forEach(function(d) {
        var key = d.driver + '|' + d.exportedAt;
        var t = driverTotal(d);
        totalClaimed += t;
        var prepaid = (d.rows||[]).filter(function(r){return r.prepaid;}).length;
        var claimed = (d.rows||[]).filter(function(r){return !r.prepaid&&gbpVal(r)>0;}).length;
        var status = approvalStatus[key] || 'pending';
        html += '<tr><td><strong>' + (d.driver||'â€”') + '</strong></td>' +
          '<td>' + (d.dateOut||'â€”') + '</td><td>' + (d.dateReturn||'â€”') + '</td>' +
          '<td class="r">' + claimed + '</td><td class="r">' + prepaid + '</td>' +
          '<td class="r">Â£' + t.toFixed(2) + '</td>' +
          '<td style="text-transform:capitalize;font-size:0.78rem">' + status + '</td></tr>';
      });
      html += '</tbody><tfoot><tr><td colspan="5">Total</td><td class="r">Â£' + totalClaimed.toFixed(2) + '</td><td></td></tr></tfoot></table>';
      document.getElementById('r-driver-table').innerHTML = html;
    }
    document.getElementById('r-total-claimed').textContent = 'Â£' + totalClaimed.toFixed(2);

    // Float table
    var floats = getFloatData();
    var totalFloats = floats.reduce(function(s,f){return s+f.float;},0);
    document.getElementById('r-total-floats').textContent = 'Â£' + totalFloats.toFixed(2);
    document.getElementById('r-net').textContent = 'Â£' + Math.max(0, totalClaimed - totalFloats).toFixed(2);

    if (floats.length === 0) {
      document.getElementById('r-float-table').innerHTML = '<p style="color:var(--light);font-size:0.8rem">No float data entered.</p>';
    } else {
      var fhtml = '<table class="report-table"><thead><tr><th>Driver</th><th>Role</th><th class="r">Float Issued</th><th class="r">Claimed</th><th class="r">Balance</th></tr></thead><tbody>';
      floats.forEach(function(f) {
        var sub = submissions.find(function(s){ return s.driver && s.driver.toLowerCase().trim()===f.name.toLowerCase().trim(); });
        var claimed = sub ? driverTotal(sub) : null;
        var balance = claimed !== null ? f.float - claimed : null;
        fhtml += '<tr><td>' + f.name + '</td><td>' + (f.role==='lead'?'Lead Driver':'Driver') + '</td>' +
          '<td class="r">Â£' + f.float.toFixed(2) + '</td>' +
          '<td class="r">' + (claimed!==null?'Â£'+claimed.toFixed(2):'awaiting') + '</td>' +
          '<td class="r">' + (balance!==null?(balance>=0?'Â£'+balance.toFixed(2)+' to return':'-Â£'+Math.abs(balance).toFixed(2)+' owed'):'â€”') + '</td></tr>';
      });
      fhtml += '</tbody></table>';
      document.getElementById('r-float-table').innerHTML = fhtml;
    }

    // Anomalies in report
    var anomCount = parseInt(document.getElementById('anomaly-badge').textContent) || 0;
    if (anomCount === 0) {
      document.getElementById('r-anomaly-content').innerHTML = '<p style="font-size:0.82rem">No statistical anomalies detected across submitted expense forms.</p>';
    } else {
      document.getElementById('r-anomaly-content').innerHTML = '<p style="font-size:0.82rem;color:var(--red)">' + anomCount + ' anomaly/anomalies flagged. See Anomalies tab for full detail. These have been noted for review.</p>';
    }
  }

  // Init with a few float rows
  addFloatRow('', 'driver', 0);
  addFloatRow('', 'driver', 0);

  // PASSWORD
  var DASHBOARD_PASSWORD = 'dashboard2026';
  function checkPassword() {
    var val = document.getElementById('pwInput').value;
    if (val === DASHBOARD_PASSWORD) {
      document.getElementById('pwOverlay').style.display = 'none';
      document.getElementById('approverBar').style.display = 'flex';
    } else {
      document.getElementById('pwError').style.display = 'block';
      document.getElementById('pwInput').value = '';
      document.getElementById('pwInput').focus();
    }
  }

  // APPROVER
  document.getElementById('approverSelect').addEventListener('change', function() {
    var name = this.value;
    var note = name ? 'Session started ' + new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'}) + ' Â· ' + new Date().toLocaleDateString('en-GB') : '';
    document.getElementById('sessionNote').textContent = note;
    updateReport();
  });

  // Update signoff in report
  var _origUpdateReport = updateReport;
  updateReport = function() {
    _origUpdateReport();
    var approver = document.getElementById('approverSelect') ? document.getElementById('approverSelect').value : '';
    var approved = 0, total = submissions.length;
    submissions.forEach(function(s) {
      var key = s.driver + '|' + (s.receivedAt||s.submittedAt||'');
      if (approvalStatus[key] === 'approved') approved++;
    });
    document.getElementById('r-signoff-name').textContent = approver || 'â€” not signed in â€”';
    document.getElementById('r-signoff-date').textContent = approver ? 'Signed: ' + new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'long',year:'numeric'}) + ' at ' + new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '';
    document.getElementById('r-signoff-status').textContent = approved === total && total > 0 ? 'âœ… All submissions approved' : approved + ' of ' + total + ' approved';
    document.getElementById('r-signoff-ref').textContent = document.getElementById('s-ref') ? 'Ref: ' + (document.getElementById('s-ref').value || 'â€”') : '';
  };

  // Focus password field on load
  setTimeout(function() { document.getElementById('pwInput').focus(); }, 100);
</script>
</body>
</html>
`;

app.get('/driver', (req, res) => { res.setHeader('Content-Type','text/html'); res.send(DRIVER_FORM); });
app.get('/dashboard', (req, res) => { res.setHeader('Content-Type','text/html'); res.send(DASHBOARD); });
app.get('/', (req, res) => { res.setHeader('Content-Type','text/html'); res.send(DASHBOARD); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('RoadClaim server running on port ' + PORT));
