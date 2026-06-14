const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json({ limit: '10mb' }));

const DATA_FILE = path.join(__dirname, 'submissions.json');
function load() { try { if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); } catch(e){} return []; }
function save(d) { try { fs.writeFileSync(DATA_FILE, JSON.stringify(d,null,2)); } catch(e){} }

app.post('/submit', (req,res) => { const subs=load(); const d=req.body; d.id=Date.now().toString(); d.receivedAt=new Date().toISOString(); d.status='pending'; subs.push(d); save(subs); res.json({success:true}); });
app.get('/submissions', (req,res) => res.json(load()));
app.post('/approve/:id', (req,res) => { const subs=load(); const s=subs.find(s=>s.id===req.params.id); if(s){s.status='approved';s.approvedAt=new Date().toISOString();} save(subs); res.json({success:true}); });
app.post('/query/:id', (req,res) => { const subs=load(); const s=subs.find(s=>s.id===req.params.id); if(s){s.status='queried';} save(subs); res.json({success:true}); });
app.delete('/submissions/:id', (req,res) => { let subs=load(); subs=subs.filter(s=>s.id!==req.params.id); save(subs); res.json({success:true}); });
app.get('/ping', (req,res) => res.send('OK'));

const DRIVER = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>RoadClaim â€” Driver Expenses</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#1a1a1a;--mid:#666;--light:#999;--rule:#e0ddd8;--bg:#f5f3ee;--white:#fff;--accent:#c8392b;--green:#2a7a4b}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--ink);padding-bottom:8rem}
.topbar{background:var(--ink);color:white;padding:1rem 1.25rem;display:flex;align-items:center;gap:0.75rem}
.topbar h1{font-size:1rem;font-weight:600}
.topbar .sub{font-size:0.72rem;color:#888;font-family:'DM Mono',monospace}
.section{max-width:600px;margin:0 auto;padding:1.25rem 1rem 0}
.field-group{margin-bottom:0.9rem}
.field-group label{display:block;font-size:0.72rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--mid);margin-bottom:0.35rem;font-family:'DM Mono',monospace}
.field-group input,.field-group select{width:100%;border:1px solid var(--rule);background:var(--white);padding:0.65rem 0.75rem;font-family:'DM Sans',sans-serif;font-size:0.88rem;color:var(--ink);border-radius:2px}
.field-group input:focus,.field-group select:focus{outline:none;border-color:var(--ink)}
.row-card{background:var(--white);border:1px solid var(--rule);border-radius:2px;margin:0 auto 0.75rem;max-width:600px;overflow:hidden}
.row-head{background:var(--ink);color:white;padding:0.5rem 0.75rem;display:flex;align-items:center;gap:0.5rem;font-size:0.78rem;font-weight:600}
.row-body{padding:0.75rem;display:grid;grid-template-columns:1fr 1fr;gap:0.6rem}
.row-body .full{grid-column:1/-1}
.row-body input,.row-body select{width:100%;border:1px solid var(--rule);background:var(--bg);padding:0.5rem 0.6rem;font-family:'DM Sans',sans-serif;font-size:0.82rem;border-radius:2px}
.sterling-display{font-family:'DM Mono',monospace;font-size:0.9rem;font-weight:600;color:var(--green);padding:0.5rem 0;text-align:right}
.prepaid-row{display:flex;align-items:center;gap:0.5rem;font-size:0.82rem;color:var(--mid)}
.add-btn{display:block;max-width:600px;margin:0.5rem auto;background:none;border:1px dashed var(--rule);color:var(--mid);padding:0.7rem;font-size:0.82rem;cursor:pointer;width:calc(100% - 2rem);border-radius:2px;font-family:'DM Sans',sans-serif}
.total-bar{background:var(--ink);color:white;padding:0.9rem 1.25rem;max-width:600px;margin:1rem auto 0;display:flex;align-items:baseline;gap:0.5rem;border-radius:2px}
.total-label{font-size:0.72rem;color:#aaa;font-family:'DM Mono',monospace}
.total-amount{font-family:'DM Mono',monospace;font-size:1.2rem;font-weight:500}
.bottom-bar{position:fixed;bottom:0;left:0;right:0;background:var(--white);border-top:1px solid var(--rule);padding:0.75rem 1.25rem;display:flex;gap:0.75rem;z-index:100}
@media(min-width:600px){.bottom-bar{max-width:600px;margin:0 auto;left:50%;transform:translateX(-50%);width:600px}}
.btn{font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;border:none;padding:0.75rem 1rem;border-radius:2px;cursor:pointer;flex:1}
.btn-submit{background:var(--accent);color:white}
.modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:200;align-items:center;justify-content:center}
.modal-box{background:var(--white);padding:1.5rem;max-width:500px;width:90%;border-radius:2px}
.modal-box h3{font-size:1rem;font-weight:600;margin-bottom:0.5rem}
.modal-box p{font-size:0.82rem;color:var(--mid);margin-bottom:1rem}
.modal-actions{display:flex;gap:0.75rem}
.btn-cancel{background:#f0ede8;color:var(--mid);border:1px solid var(--rule)}
.btn-confirm{background:var(--accent);color:white}
.success-box{text-align:center;padding:3rem 1rem}
.success-box .tick{font-size:3rem;margin-bottom:1rem}
.status-msg{font-size:0.82rem;color:var(--mid);margin-top:0.5rem;text-align:center}
</style></head><body>
<div class="topbar"><div><h1>RoadClaim</h1><div class="sub">Driver Expenses Form</div></div></div>
<div id="formWrap">
<div class="section">
<div class="field-group"><label>Your name</label><input type="text" id="driverName" placeholder="First and last name"></div>
<div class="field-group"><label>Tour / Artist</label><input type="text" id="tourName" placeholder="e.g. Metallica European Tour"></div>
<div class="field-group"><label>Truck number</label><input type="text" id="truckNo" placeholder="e.g. TRN-04"></div>
<div class="field-group"><label>Date out</label><input type="date" id="dateOut"></div>
<div class="field-group"><label>Return date</label><input type="date" id="dateReturn"></div>
<div class="field-group"><label>Float received (GBP)</label><input type="number" id="floatAmount" placeholder="0.00" step="0.01" oninput="updateTotal()"></div>
</div>
<div id="rows"></div>
<button class="add-btn" onclick="addRow()">+ Add expense</button>
<div class="total-bar"><span class="total-label">Total claimed</span><span class="total-amount" id="grandTotal">Â£0.00</span></div>
</div>
<div class="bottom-bar"><button class="btn btn-submit" onclick="showConfirm()">Submit expenses</button></div>

<div class="modal" id="confirmModal">
<div class="modal-box">
<h3>Submit expenses</h3>
<p>Check your entries are complete. Tap Submit to send.</p>
<div class="modal-actions">
<button class="btn btn-cancel" onclick="hideConfirm()">Back</button>
<button class="btn btn-confirm" onclick="doSubmit()">Submit â†’</button>
</div>
</div>
</div>

<script>
var rowCount=0, rows=[];
fetch('/ping').catch(function(){});

function addRow(){
  rowCount++; var n=rowCount; rows.push(n);
  var div=document.createElement('div'); div.className='row-card'; div.id='row-'+n;
  div.innerHTML='<div class="row-head"><span>Expense '+n+'</span><button onclick="removeRow('+n+')" style="margin-left:auto;background:none;border:none;color:#aaa;cursor:pointer;font-size:1rem">&times;</button></div>'+
  '<div class="row-body">'+
  '<div><label style="font-size:0.68rem;color:#999;display:block;margin-bottom:4px">DATE</label><input type="date" id="date-'+n+'" onchange="autoRate('+n+')"></div>'+
  '<div><label style="font-size:0.68rem;color:#999;display:block;margin-bottom:4px">TYPE</label><select id="type-'+n+'"><option>Fuel</option><option>Toll</option><option>Taxi</option><option>Parking</option><option>Food</option><option>Hotel</option><option>Other</option></select></div>'+
  '<div><label style="font-size:0.68rem;color:#999;display:block;margin-bottom:4px">COUNTRY</label><select id="country-'+n+'" onchange="autoRate('+n+')"><option value="GB">UK</option><option value="DE">Germany</option><option value="FR">France</option><option value="NL">Netherlands</option><option value="BE">Belgium</option><option value="PL">Poland</option><option value="CZ">Czech Republic</option><option value="AT">Austria</option><option value="ES">Spain</option><option value="IT">Italy</option><option value="SE">Sweden</option><option value="NO">Norway</option><option value="DK">Denmark</option><option value="CH">Switzerland</option><option value="PT">Portugal</option><option value="OTHER">Other</option></select></div>'+
  '<div><label style="font-size:0.68rem;color:#999;display:block;margin-bottom:4px">CURRENCY</label><select id="cur-'+n+'" onchange="autoRate('+n+')"><option value="GBP">GBP</option><option value="EUR">EUR</option><option value="PLN">PLN</option><option value="CZK">CZK</option><option value="SEK">SEK</option><option value="NOK">NOK</option><option value="DKK">DKK</option><option value="CHF">CHF</option><option value="USD">USD</option></select></div>'+
  '<div><label style="font-size:0.68rem;color:#999;display:block;margin-bottom:4px">AMOUNT</label><input type="number" id="amt-'+n+'" placeholder="0.00" step="0.01" oninput="calcSterling('+n+')"></div>'+
  '<div><label style="font-size:0.68rem;color:#999;display:block;margin-bottom:4px">RATE</label><input type="number" id="rate-'+n+'" placeholder="auto" step="0.0001" oninput="calcSterling('+n+')"></div>'+
  '<div class="full"><div class="sterling-display" id="sterling-'+n+'">â€”</div></div>'+
  '<div class="full prepaid-row"><input type="checkbox" id="prepaid-'+n+'" onchange="calcSterling('+n+')"> <label for="prepaid-'+n+'">Company prepaid â€” do not reimburse</label></div>'+
  '<div class="full"><label style="font-size:0.68rem;color:#999;display:block;margin-bottom:4px">NOTES</label><input type="text" id="notes-'+n+'" placeholder="Optional"></div>'+
  '</div>';
  document.getElementById('rows').appendChild(div);
}

function removeRow(n){ rows=rows.filter(r=>r!==n); var el=document.getElementById('row-'+n); if(el) el.remove(); updateTotal(); }

var rateCache={};
function autoRate(n){
  var cur=document.getElementById('cur-'+n).value;
  var date=document.getElementById('date-'+n).value;
  if(!cur||cur==='GBP'||!date){calcSterling(n);return;}
  var key=cur+'|'+date;
  if(rateCache[key]!==undefined){document.getElementById('rate-'+n).value=rateCache[key]||'';calcSterling(n);return;}
  fetch('https://api.frankfurter.app/'+date+'?from='+cur+'&to=GBP')
    .then(r=>r.json()).then(d=>{
      var rate=d.rates&&d.rates.GBP?d.rates.GBP:null;
      rateCache[key]=rate;
      if(rate){document.getElementById('rate-'+n).value=rate.toFixed(6);}
      calcSterling(n);
    }).catch(()=>calcSterling(n));
}

function calcSterling(n){
  var cur=document.getElementById('cur-'+n).value;
  var amt=parseFloat(document.getElementById('amt-'+n).value)||0;
  var rate=parseFloat(document.getElementById('rate-'+n).value)||0;
  var prepaid=document.getElementById('prepaid-'+n).checked;
  var el=document.getElementById('sterling-'+n);
  if(prepaid){el.textContent='Prepaid';el.style.color='#999';}
  else if(cur==='GBP'&&amt){el.textContent='Â£'+amt.toFixed(2);el.style.color='var(--green)';}
  else if(amt&&rate){el.textContent='Â£'+(amt*rate).toFixed(2);el.style.color='var(--green)';}
  else{el.textContent='â€”';el.style.color='#999';}
  updateTotal();
}

function updateTotal(){
  var total=0;
  rows.forEach(function(n){
    var prepaid=document.getElementById('prepaid-'+n)&&document.getElementById('prepaid-'+n).checked;
    if(prepaid) return;
    var txt=(document.getElementById('sterling-'+n)||{}).textContent||'';
    var v=parseFloat(txt.replace('Â£',''));
    if(!isNaN(v)) total+=v;
  });
  document.getElementById('grandTotal').textContent='Â£'+total.toFixed(2);
}

function buildData(){
  var data={
    driver:document.getElementById('driverName').value||'Unknown',
    tour:document.getElementById('tourName').value||'Unknown',
    truck:document.getElementById('truckNo').value||'',
    dateOut:document.getElementById('dateOut').value||'',
    dateReturn:document.getElementById('dateReturn').value||'',
    floatReceived:parseFloat(document.getElementById('floatAmount').value)||0,
    submittedAt:new Date().toISOString(),
    rows:[]
  };
  rows.forEach(function(n){
    var prepaid=document.getElementById('prepaid-'+n).checked;
    var sterlingTxt=(document.getElementById('sterling-'+n)||{}).textContent||'';
    data.rows.push({
      n:n,
      date:document.getElementById('date-'+n).value,
      type:document.getElementById('type-'+n).value,
      country:document.getElementById('country-'+n).value,
      currency:document.getElementById('cur-'+n).value,
      amount:document.getElementById('amt-'+n).value,
      rate:document.getElementById('rate-'+n).value,
      sterling:sterlingTxt.replace('Â£',''),
      prepaid:prepaid,
      notes:(document.getElementById('notes-'+n)||{}).value||''
    });
  });
  return data;
}

function showConfirm(){ document.getElementById('confirmModal').style.display='flex'; }
function hideConfirm(){ document.getElementById('confirmModal').style.display='none'; }

function doSubmit(){
  hideConfirm();
  var data=buildData();
  var btn=document.querySelector('.btn-submit');
  btn.textContent='Sending...'; btn.disabled=true;
  fetch('/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
    .then(function(r){return r.json();})
    .then(function(result){
      if(result.success){
        document.getElementById('formWrap').innerHTML='<div class="success-box"><div class="tick">âœ“</div><h2>Submitted</h2><p style="color:#666;font-size:0.85rem;margin-top:0.5rem">Your expenses have been received.</p></div>';
        document.querySelector('.bottom-bar').style.display='none';
      } else { btn.textContent='Submit expenses'; btn.disabled=false; alert('Please try again.'); }
    })
    .catch(function(){
      btn.textContent='Submit expenses'; btn.disabled=false;
      alert('Could not reach server. Please check your connection and try again in a moment.');
    });
}
</script></body></html>`;

const DASHBOARD = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>RoadClaim â€” Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#1a1a1a;--mid:#666;--light:#999;--rule:#e0ddd8;--bg:#f5f3ee;--white:#fff;--accent:#c8392b;--green:#2a7a4b;--blue:#1a5fa8}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--ink);min-height:100vh}
.topbar{background:var(--ink);color:white;padding:1rem 1.5rem;display:flex;align-items:center;gap:1rem}
.topbar h1{font-size:1rem;font-weight:600}
.topbar .sub{font-size:0.68rem;color:#888;font-family:'DM Mono',monospace}
.topbar .version{margin-left:auto;font-family:'DM Mono',monospace;font-size:0.62rem;color:#555}
.main{max-width:1100px;margin:0 auto;padding:1.5rem}
.status-bar{background:#e8f4ee;border:1px solid var(--green);border-radius:2px;padding:0.75rem 1rem;margin-bottom:1.5rem;font-size:0.82rem;color:var(--green);display:flex;align-items:center;gap:1rem}
.summary{background:var(--white);border:1px solid var(--rule);border-radius:2px;padding:1rem;margin-bottom:1.5rem;display:flex;gap:2rem;flex-wrap:wrap}
.summary-item .label{font-size:0.62rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--light);font-family:'DM Mono',monospace;margin-bottom:0.2rem}
.summary-item .value{font-family:'DM Mono',monospace;font-size:1.3rem;font-weight:500}
.sub-count{font-size:0.72rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--mid);font-family:'DM Mono',monospace;margin-bottom:1rem}
.empty{background:var(--white);border:1px solid var(--rule);border-radius:2px;padding:2rem;text-align:center;color:var(--light);font-size:0.85rem}
.submission{background:var(--white);border:1px solid var(--rule);border-radius:2px;margin-bottom:1rem;overflow:hidden}
.sub-header{background:var(--ink);color:white;padding:0.75rem 1rem;display:flex;align-items:baseline;gap:1rem;flex-wrap:wrap}
.sub-driver{font-size:0.95rem;font-weight:600}
.sub-tour{font-size:0.78rem;color:#aaa}
.sub-total{font-family:'DM Mono',monospace;font-size:1.1rem;font-weight:500;margin-left:auto;color:#7dd4a8}
.sub-meta{padding:0.6rem 1rem;background:#f8f7f4;border-bottom:1px solid var(--rule);display:flex;gap:1.5rem;flex-wrap:wrap;font-size:0.72rem;color:var(--mid);font-family:'DM Mono',monospace}
.expense-table{width:100%;border-collapse:collapse;font-size:0.8rem}
.expense-table th{background:#f0ede8;padding:0.5rem 0.75rem;text-align:left;font-size:0.65rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--mid)}
.expense-table td{padding:0.55rem 0.75rem;border-bottom:1px solid var(--rule);vertical-align:top}
.expense-table tr:last-child td{border-bottom:none}
.sterling-cell{font-family:'DM Mono',monospace;font-weight:500;color:var(--green)}
.sub-footer{padding:0.75rem 1rem;border-top:2px solid var(--rule);display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.total-line{font-family:'DM Mono',monospace;font-size:0.85rem;font-weight:500}
.btn{font-family:'DM Sans',sans-serif;font-size:0.72rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;border:1px solid var(--rule);background:none;padding:0.35rem 0.75rem;border-radius:2px;cursor:pointer}
.btn-approve{color:var(--green);border-color:var(--green)}
.btn-query{color:var(--blue);border-color:var(--blue)}
.btn-remove{color:var(--accent);border-color:var(--accent);margin-left:auto}
.status-approved{color:var(--green);font-size:0.72rem;font-weight:600;font-family:'DM Mono',monospace}
.status-queried{color:var(--blue);font-size:0.72rem;font-weight:600;font-family:'DM Mono',monospace}
.status-pending{color:var(--light);font-size:0.72rem;font-family:'DM Mono',monospace}
</style></head><body>
<div class="topbar"><div><h1>RoadClaim</h1><div class="sub">Expenses Dashboard v1.0</div></div><div class="version">â— Live</div></div>
<div class="main">
<div class="status-bar">Submissions arrive automatically. <button class="btn" style="margin-left:auto" onclick="loadSubs()">Refresh</button></div>
<div id="summary" class="summary" style="display:none">
<div class="summary-item"><div class="label">Drivers</div><div class="value" id="sumDrivers">0</div></div>
<div class="summary-item"><div class="label">Total claimed</div><div class="value" id="sumTotal">Â£0.00</div></div>
<div class="summary-item"><div class="label">Pending</div><div class="value" id="sumPending">0</div></div>
<div class="summary-item"><div class="label">Approved</div><div class="value" id="sumApproved">0</div></div>
</div>
<div class="sub-count">Submissions (<span id="subCount">0</span>)</div>
<div id="subList"><div class="empty">No submissions yet. Waiting for drivers to submit.</div></div>
</div>
<script>
var submissions=[];

function loadSubs(){
  fetch('/submissions').then(r=>r.json()).then(function(data){
    submissions=data;
    render();
  }).catch(function(){ console.log('Server not reachable'); });
}

function calcTotal(s){
  var t=0;
  (s.rows||[]).forEach(function(r){
    if(!r.prepaid&&r.sterling){ var v=parseFloat(r.sterling); if(!isNaN(v)) t+=v; }
  });
  return t;
}

function render(){
  var list=document.getElementById('subList');
  var count=document.getElementById('subCount');
  count.textContent=submissions.length;
  if(!submissions.length){ list.innerHTML='<div class="empty">No submissions yet. Waiting for drivers to submit.</div>'; document.getElementById('summary').style.display='none'; return; }
  
  var totalAll=0,pending=0,approved=0;
  submissions.forEach(function(s){ totalAll+=calcTotal(s); if(s.status==='approved') approved++; else pending++; });
  document.getElementById('summary').style.display='flex';
  document.getElementById('sumDrivers').textContent=submissions.length;
  document.getElementById('sumTotal').textContent='Â£'+totalAll.toFixed(2);
  document.getElementById('sumPending').textContent=pending;
  document.getElementById('sumApproved').textContent=approved;

  list.innerHTML='';
  submissions.slice().reverse().forEach(function(s){
    var total=calcTotal(s);
    var fl=s.floatReceived||0;
    var div=document.createElement('div');
    div.className='submission';
    var received=s.receivedAt?new Date(s.receivedAt).toLocaleString('en-GB'):'â€”';
    var rows=(s.rows||[]).map(function(r){
      return '<tr><td>'+(r.date||'â€”')+'</td><td>'+(r.type||'')+'</td><td>'+(r.country||'')+'</td>'+
        '<td>'+(r.amount||'')+' '+(r.currency||'')+'</td>'+
        '<td class="sterling-cell">'+(r.prepaid?'Prepaid':r.sterling?'Â£'+parseFloat(r.sterling).toFixed(2):'â€”')+'</td>'+
        '<td style="color:var(--light)">'+(r.notes||'')+'</td></tr>';
    }).join('');
    var statusHtml='<span class="status-'+s.status+'">'+(s.status||'pending').toUpperCase()+'</span>';
    div.innerHTML=
      '<div class="sub-header"><span class="sub-driver">'+(s.driver||'Unknown')+'</span>'+
      '<span class="sub-tour">'+(s.tour||'â€”')+'</span>'+
      '<span class="sub-total">Â£'+total.toFixed(2)+'</span></div>'+
      '<div class="sub-meta">'+
      '<span>Truck <strong>'+(s.truck||'â€”')+'</strong></span>'+
      '<span>Out <strong>'+(s.dateOut||'â€”')+'</strong></span>'+
      '<span>Return <strong>'+(s.dateReturn||'â€”')+'</strong></span>'+
      '<span>Received <strong>'+received+'</strong></span></div>'+
      '<table class="expense-table"><thead><tr><th>Date</th><th>Type</th><th>Country</th><th>Amount</th><th>Sterling</th><th>Notes</th></tr></thead>'+
      '<tbody>'+rows+'</tbody></table>'+
      '<div class="sub-footer">'+
      '<span class="total-line">Total: Â£'+total.toFixed(2)+(fl>0?' Â· Float: Â£'+fl.toFixed(2)+' Â· Balance: Â£'+(total-fl).toFixed(2):'')+'</span>'+
      statusHtml+
      '<button class="btn btn-approve" onclick="approve(\''+s.id+'\')">âœ“ Approve</button>'+
      '<button class="btn btn-query" onclick="query(\''+s.id+'\')">? Query</button>'+
      '<button class="btn btn-remove" onclick="remove(\''+s.id+'\')">âœ• Remove</button>'+
      '</div>';
    list.appendChild(div);
  });
}

function approve(id){
  fetch('/approve/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})
    .then(function(){ loadSubs(); });
}
function query(id){
  fetch('/query/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})
    .then(function(){ loadSubs(); });
}
function remove(id){
  if(!confirm('Remove this submission?')) return;
  fetch('/submissions/'+id,{method:'DELETE'}).then(function(){ loadSubs(); });
}

loadSubs();
setInterval(loadSubs, 30000);
</script></body></html>`;

app.get('/driver', (req,res) => { res.setHeader('Content-Type','text/html'); res.send(DRIVER); });
app.get('/', (req,res) => { res.setHeader('Content-Type','text/html'); res.send(DASHBOARD); });
app.get('/dashboard', (req,res) => { res.setHeader('Content-Type','text/html'); res.send(DASHBOARD); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('RoadClaim running on port ' + PORT));
