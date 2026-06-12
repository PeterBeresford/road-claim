const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

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

// Driver submits expenses
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

// Dashboard reads all submissions
app.get('/submissions', (req, res) => {
  res.json(load());
});

// Dashboard approves a submission
app.post('/approve/:id', (req, res) => {
  const subs = load();
  const sub = subs.find(s => s.id === req.params.id);
  if (sub) {
    sub.status = 'approved';
    sub.approvedAt = new Date().toISOString();
    sub.approvedAmount = req.body.approvedAmount || null;
  }
  save(subs);
  res.json({ success: true });
});

// Dashboard queries a submission
app.post('/query/:id', (req, res) => {
  const subs = load();
  const sub = subs.find(s => s.id === req.params.id);
  if (sub) { sub.status = 'queried'; sub.queryNote = req.body.note || ''; }
  save(subs);
  res.json({ success: true });
});

// Dashboard removes a submission
app.delete('/submissions/:id', (req, res) => {
  let subs = load();
  subs = subs.filter(s => s.id !== req.params.id);
  save(subs);
  res.json({ success: true });
});

// Redirect root to dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('RoadClaim server running on port ' + PORT));
