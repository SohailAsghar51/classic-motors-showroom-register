const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'records.json');

// ===== Middleware Setup =====
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname)); // Serves HTML/CSS/JS files

// ===== Auto-create data/ folder and records.json if not exists =====
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
  console.log('📁 data/ folder created');
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  console.log('📄 records.json created');
}

// ===== ROUTES =====

// ✅ GET — Load all records
app.get('/api/records', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    console.log(`📂 Records loaded: ${parsed.length} records`);
    res.json(parsed);
  } catch (e) {
    console.error('❌ Load error:', e.message);
    res.json([]);
  }
});

// ✅ POST — Save all records
app.post('/api/records', (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid data — array expected' });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
    console.log(`💾 Records saved: ${records.length} records`);
    res.json({ success: true, count: records.length });
  } catch (e) {
    console.error('❌ Save error:', e.message);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// ✅ DELETE — Delete a single record by ID
app.delete('/api/records/:id', (req, res) => {
  try {
    const id = req.params.id;
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    let records = JSON.parse(data);
    const before = records.length;
    records = records.filter(r => r.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
    console.log(`🗑️ Record deleted: ${id} (${before - records.length} removed)`);
    res.json({ success: true, remaining: records.length });
  } catch (e) {
    console.error('❌ Delete error:', e.message);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// ✅ GET — Fetch a single record by ID
app.get('/api/records/:id', (req, res) => {
  try {
    const id = req.params.id;
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const records = JSON.parse(data);
    const record = records.find(r => r.id === id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(record);
  } catch (e) {
    console.error('❌ Fetch error:', e.message);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// ✅ GET — Download JSON backup file
app.get('/api/backup', (req, res) => {
  try {
    const stamp = new Date().toISOString().slice(0, 10);
    res.download(DATA_FILE, `classic_motors_backup_${stamp}.json`);
    console.log(`⬇️ Backup downloaded: ${stamp}`);
  } catch (e) {
    console.error('❌ Backup error:', e.message);
    res.status(500).json({ error: 'Backup failed' });
  }
});

// Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve login.html
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});
// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🏍️  Classic Motors Showroom Server     ║');
  console.log('║   ✅  Running at http://localhost:3000   ║');
  console.log('║   📄  Data: data/records.json            ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});