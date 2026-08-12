// ===== API Configuration =====
const API_URL = '/api/records';

// ===== Load Records from Server =====
async function loadRecords() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    console.log(`📂 Loaded ${data.length} records from server`);
    return data;
  } catch (e) {
    console.error('❌ Failed to load records:', e.message);
    return [];
  }
}

// ===== Save All Records to Server =====
async function persistRecords() {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records)
    });
    if (!res.ok) throw new Error('Save failed');
    const result = await res.json();
    console.log(`💾 Saved ${result.count} records to server`);
  } catch (e) {
    console.error('❌ Save error:', e.message);
    alert('❌ Failed to save data! Please check the server.');
  }
}

// ===== Top Search Bar =====
function topSearch(val) {
  const q = val.trim().toLowerCase();
  if (!q) return;
  goPage('records');
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.value = val;
    recordsPage = 1;
    renderList();
  }
}

// ===== Global Variables =====
let records = [];
let currentId = null;
let installRows = [];

// ===== Re-Auth Variables =====
let pendingEditId = null;
let pendingDeleteId = null;
let pendingAction = null; // 'edit' or 'delete'

// ===== Field IDs =====
const fieldIds = [
  'accountNo', 'deliveryDate', 'buyerFather', 'buyerName', 'buyerPhone',
  'buyerCnic', 'buyerSign', 'buyerAddress', 'guarantorName', 'guarantorFather',
  'guarantorSign', 'guarantorPhone', 'guarantorCnic', 'guarantorAddress',
  'witnessName', 'witnessSign', 'witnessPhone', 'itemDetail', 'engineNo',
  'chassisNo', 'regNo', 'model', 'color', 'totalAmount', 'advanceAmount',
  'remainingAmount', 'remarks'
];

// ===== Page Navigation =====
function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.side-link').forEach(b =>
    b.classList.toggle('active', b.dataset.page === name)
  );
  if (name === 'records') renderList();
  if (name === 'home') updateStats();
  if (name === 'reports') {
    loadRecords().then(data => {
      records = data;
      renderReports();
    });
  }
}

// ===== Installment Table =====
function addInstallmentRow(data) {
  const row = data || {
    sr: installRows.length + 1,
    date: '', total: '', received: '',
    remaining: '', signature: '', detail: ''
  };
  installRows.push(row);
  renderInstallTable();
}

function renderInstallTable() {
  const body = document.getElementById('installBody');
  body.innerHTML = '';
  installRows.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${row.sr ?? idx + 1}" onchange="installRows[${idx}].sr=this.value"></td>
      <td><input type="date" value="${row.date || ''}" onchange="installRows[${idx}].date=this.value"></td>
      <td><input value="${row.total || ''}" onchange="installRows[${idx}].total=this.value"></td>
      <td><input value="${row.received || ''}" onchange="installRows[${idx}].received=this.value"></td>
      <td><input value="${row.remaining || ''}" onchange="installRows[${idx}].remaining=this.value"></td>
      <td><input value="${row.signature || ''}" onchange="installRows[${idx}].signature=this.value"></td>
      <td><input value="${row.detail || ''}" onchange="installRows[${idx}].detail=this.value"></td>
      <td class="row-actions"><button onclick="removeInstallRow(${idx})">✕</button></td>
    `;
    body.appendChild(tr);
  });
}

function removeInstallRow(idx) {
  installRows.splice(idx, 1);
  renderInstallTable();
}

// ===== Form Collect & Fill =====
function collectForm() {
  const obj = {};
  fieldIds.forEach(id => obj[id] = document.getElementById(id).value);
  obj.installments = installRows;
  return obj;
}

function fillForm(obj) {
  fieldIds.forEach(id => document.getElementById(id).value = obj[id] || '');
  installRows = (obj.installments || []).map(r => ({ ...r }));
  renderInstallTable();
}

function newRecord() {
  currentId = null;
  fieldIds.forEach(id => document.getElementById(id).value = '');
  installRows = [];
  renderInstallTable();
}

// ===== Export All Records as JSON File =====
function exportAllJson() {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `classic_motors_records_${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== Import Records from JSON File =====
function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) {
        alert('Invalid file format — expected a JSON array of records.');
        return;
      }
      // Fix missing id aur savedAt
      data.forEach(rec => {
        if (!rec.id) rec.id = 'rec_' + Date.now() + Math.random();
        // ✅ savedAt missing ho toh aaj ki date add karo
        if (!rec.savedAt) rec.savedAt = new Date().toISOString();
      });
      records = records.concat(data);
      await persistRecords();
      recordsPage = 1;
      renderList();
      updateStats();
      alert(`✅ Imported ${data.length} record(s) successfully!`);
    } catch (err) {
      alert('Error reading file: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ===== Payment Status Helpers =====
function markFullyPaid() {
  document.getElementById('remainingAmount').value = 'OK';
}

function isFullyPaid(val) {
  if (val === undefined || val === null || val === '') return false;
  if (typeof val === 'string' && val.trim().toUpperCase() === 'OK') return true;
  return parseFloat(val) <= 0;
}

function formatRemaining(val) {
  if (val === undefined || val === null || val === '') return '—';
  if (isFullyPaid(val)) return '✅ OK';
  const n = Number(val);
  return isNaN(n) ? val : n.toLocaleString();
}

// ===== Save Record =====
async function saveRecord() {
  const data = collectForm();
  if (!data.buyerName) {
    alert('Please enter the Buyer Name.');
    return;
  }
  if (currentId) {
    const idx = records.findIndex(r => r.id === currentId);
    records[idx] = { ...data, id: currentId, savedAt: records[idx].savedAt };
  } else {
    currentId = 'rec_' + Date.now();
    records.push({ ...data, id: currentId, savedAt: new Date().toISOString() });
  }
  await persistRecords();
  alert('✅ Record saved successfully!');
  newRecord();
  renderList();
  updateStats();
}

// ===== Re-Auth Modal Open Helper =====
function openReauthModal(action, id) {
  pendingAction = action;

  if (action === 'edit') {
    pendingEditId = id;
    pendingDeleteId = null;
    document.getElementById('reauthTitle').textContent = '✏️ Confirm Login to Edit';
    document.getElementById('reauthSubtitle').textContent = 'Please re-enter your credentials to edit this record.';
  } else if (action === 'delete') {
    pendingDeleteId = id;
    pendingEditId = null;
    document.getElementById('reauthTitle').textContent = '🗑️ Confirm Login to Delete';
    document.getElementById('reauthSubtitle').textContent = 'Please re-enter your credentials to delete this record.';
  }

  document.getElementById('reauthUser').value = '';
  document.getElementById('reauthPass').value = '';
  document.getElementById('reauthError').textContent = '';
  document.getElementById('reauthModal').classList.add('show');
}

// ===== Request Edit (Re-Auth Required) =====
function requestEdit(id) {
  openReauthModal('edit', id);
}

// ===== Request Delete (Re-Auth Required) =====
function requestDelete(id, ev) {
  ev.stopPropagation();
  openReauthModal('delete', id);
}

// ===== Cancel Re-Auth =====
function cancelReauth() {
  pendingEditId = null;
  pendingDeleteId = null;
  pendingAction = null;
  document.getElementById('reauthModal').classList.remove('show');
}

// ===== Confirm Re-Auth =====
function confirmReauth() {
  const u = document.getElementById('reauthUser').value.trim();
  const p = document.getElementById('reauthPass').value;

  if (checkCredentials(u, p)) {
    document.getElementById('reauthModal').classList.remove('show');

    if (pendingAction === 'edit') {
      const id = pendingEditId;
      pendingEditId = null;
      pendingAction = null;
      openRecordForEdit(id);

    } else if (pendingAction === 'delete') {
      const id = pendingDeleteId;
      pendingDeleteId = null;
      pendingAction = null;
      confirmDeleteRecord(id);
    }

  } else {
    document.getElementById('reauthError').textContent = '❌ Invalid username or password.';
  }
}

// ===== Open Record For Edit =====
function openRecordForEdit(id) {
  const rec = records.find(r => r.id === id);
  if (!rec) return;
  currentId = id;
  fillForm(rec);
  goPage('entry');
}

// ===== Confirm Delete Record (After Re-Auth) =====
async function confirmDeleteRecord(id) {
  if (!confirm('⚠️ Are you sure you want to delete this record? This cannot be undone!')) return;
  records = records.filter(r => r.id !== id);
  await persistRecords();
  renderList();
  updateStats();
  alert('🗑️ Record deleted successfully!');
}

// ===== Records List Pagination =====
let recordsPage = 1;
const RECORDS_PER_PAGE = 8;

function renderList() {
  const q = (document.getElementById('searchBox')?.value || '').trim().toLowerCase();
  const container = document.getElementById('recordsList');
  if (!container) return;

  const filtered = records.filter(r =>
    !q ||
    (r.buyerName || '').toLowerCase().includes(q) ||
    (r.buyerCnic || '').toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No records found yet. Create a new entry to get started.</div>';
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / RECORDS_PER_PAGE));
  if (recordsPage > totalPages) recordsPage = totalPages;
  const start = (recordsPage - 1) * RECORDS_PER_PAGE;
  const pageItems = filtered.slice(start, start + RECORDS_PER_PAGE);

  let html = pageItems.map(r => `
    <div class="record-card">
      <div class="info">
        <b>${r.buyerName || '—'}</b>
        <span>
          CNIC: ${r.buyerCnic || '—'} |
          Phone: ${r.buyerPhone || '—'} |
          Model: ${r.model || '—'} |
          Balance: ${formatRemaining(r.remainingAmount)}
        </span>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="action btn-outline" style="padding:7px 14px;"
          onclick="requestEdit('${r.id}')">✏️ Edit</button>
        <button class="action btn-gold" style="padding:7px 14px;"
          onclick="downloadRecordPdf('${r.id}')">⬇ Download</button>
        <button class="action" style="padding:7px 14px; background:var(--danger); color:#fff;"
          onclick="requestDelete('${r.id}', event)">🗑️ Delete</button>
      </div>
    </div>
  `).join('');

  if (totalPages > 1) {
    html += `
      <div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-top:16px;">
        <button class="action btn-outline" style="padding:6px 14px;"
          onclick="changeRecordsPage(-1)" ${recordsPage === 1 ? 'disabled' : ''}>‹ Prev</button>
        <span style="font-size:13px; color:#666;">Page ${recordsPage} of ${totalPages}</span>
        <button class="action btn-outline" style="padding:6px 14px;"
          onclick="changeRecordsPage(1)" ${recordsPage === totalPages ? 'disabled' : ''}>Next ›</button>
      </div>`;
  }

  container.innerHTML = html;
}

function changeRecordsPage(delta) {
  recordsPage += delta;
  renderList();
}

// ===== Chart Instances =====
let chartTrendInstance = null;
let chartPaymentInstance = null;
let chartModelsInstance = null;
let chartSalesPendingInstance = null;

// ===== Dashboard Stats =====
function updateStats() {
  document.getElementById('statTotal').textContent = records.length;

  const today = new Date().toDateString();
  document.getElementById('statToday').textContent = records.filter(r =>
    r.savedAt && new Date(r.savedAt).toDateString() === today
  ).length;

  const totalAmt = records.reduce((s, r) => s + (parseFloat(r.totalAmount) || 0), 0);
  const pendingAmt = records.reduce((s, r) =>
    s + (isFullyPaid(r.remainingAmount) ? 0 : (parseFloat(r.remainingAmount) || 0)), 0
  );

  document.getElementById('statAmount').textContent = totalAmt.toLocaleString();
  document.getElementById('statPending').textContent = pendingAmt.toLocaleString();

  // Unique Items (itemDetail se)
const uniqueModels = new Set(
  records.map(r => (r.itemDetail || '').trim()).filter(Boolean)
);
document.getElementById('statModels').textContent = uniqueModels.size;

  renderTrendChart();
  renderPaymentChart();
  renderRecentTable();

  const dateEl = document.getElementById('topDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
  }
}

// ===== Trend Chart =====
function renderTrendChart() {
  const canvas = document.getElementById('chartTrend');
  if (!canvas || typeof Chart === 'undefined') return;

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: d.getFullYear() + '-' + d.getMonth(),
      label: d.toLocaleDateString('en-US', { month: 'short' })
    });
  }

  const counts = months.map(m => records.filter(r => {
    // ✅ savedAt missing ho toh skip karo
    if (!r.savedAt) return false;
    const d = new Date(r.savedAt);
    // ✅ Invalid date check
    if (isNaN(d.getTime())) return false;
    return (d.getFullYear() + '-' + d.getMonth()) === m.key;
  }).length);

  // ✅ Agar sab 0 hain toh bhi chart theek dikhaye
  const maxVal = Math.max(...counts, 1);

  if (chartTrendInstance) chartTrendInstance.destroy();
  chartTrendInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [{
        label: 'Records',
        data: counts,
        borderColor: '#2f6fed',
        backgroundColor: 'rgba(47,111,237,.12)',
        fill: true,
        tension: .35,
        pointRadius: 4,
        pointBackgroundColor: '#2f6fed'
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          max: maxVal + 1,
          ticks: { precision: 0, stepSize: 1 }
        }
      }
    }
  });
}
// ===== Payment Status Chart =====
function renderPaymentChart() {
  const canvas = document.getElementById('chartPayment');
  if (!canvas || typeof Chart === 'undefined') return;

  const fullyPaid = records.filter(r => isFullyPaid(r.remainingAmount) && r.totalAmount).length;
  const pending = records.length - fullyPaid;

  if (chartPaymentInstance) chartPaymentInstance.destroy();
  chartPaymentInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Fully Paid', 'Pending Balance'],
      datasets: [{
        data: [fullyPaid, pending],
        backgroundColor: ['#2f7d4f', '#e0a11c']
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      cutout: '65%'
    }
  });

  const legend = document.getElementById('paymentLegend');
  if (legend) {
    legend.innerHTML = `
      <div class="legend-row">
        <span class="dot-lbl"><span class="swatch" style="background:#2f7d4f;"></span>Fully Paid</span>
        <b>${fullyPaid}</b>
      </div>
      <div class="legend-row">
        <span class="dot-lbl"><span class="swatch" style="background:#e0a11c;"></span>Pending Balance</span>
        <b>${pending}</b>
      </div>
    `;
  }
}

// ===== Recent Records Table =====
function renderRecentTable() {
  const body = document.getElementById('recentBody');
  if (!body) return;

  const recent = [...records]
    .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0))
    .slice(0, 5);

  if (recent.length === 0) {
    body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:20px;">No records yet</td></tr>';
    return;
  }

  body.innerHTML = recent.map(r => `
    <tr>
      <td>${r.buyerName || '—'}</td>
      <td>${r.model || '—'}</td>
      <td>${r.buyerPhone || '—'}</td>
      <td>${r.totalAmount ? Number(r.totalAmount).toLocaleString() : '—'}</td>
      <td>${r.savedAt ? new Date(r.savedAt).toLocaleDateString() : '—'}</td>
    </tr>
  `).join('');
}

// ===== Reports =====
let currentReportFilter = 'all';

function renderReports() {
  const total = records.length;
  const fullyPaid = records.filter(r =>
    isFullyPaid(r.remainingAmount) && r.totalAmount
  ).length;
  const partial = total - fullyPaid;
  const avgSale = total
    ? Math.round(records.reduce((s, r) =>
        s + (parseFloat(r.totalAmount) || 0), 0) / total)
    : 0;

  document.getElementById('rTotal').textContent = total;
  document.getElementById('rFullyPaid').textContent = fullyPaid;
  document.getElementById('rPartial').textContent = partial;
  document.getElementById('rAvgSale').textContent = avgSale.toLocaleString();

  renderModelsChart();
  renderSalesPendingChart();

  const badge = document.getElementById('filterCountBadge');
  if (badge) {
    const paidCount = records.filter(r =>
      isFullyPaid(r.remainingAmount) && r.totalAmount
    ).length;
    const pendingCount = records.filter(r =>
      !isFullyPaid(r.remainingAmount)
    ).length;

    if (currentReportFilter === 'all') {
      badge.textContent = `Total: ${records.length}`;
      badge.style.background = 'var(--navy)';
    } else if (currentReportFilter === 'paid') {
      badge.textContent = `✅ Paid: ${paidCount}`;
      badge.style.background = '#2f7d4f';
    } else if (currentReportFilter === 'pending') {
      badge.textContent = `⏳ Pending: ${pendingCount}`;
      badge.style.background = '#b8860b';
    }
  }

  setReportFilter(currentReportFilter);
}

function setReportFilter(filter) {
  currentReportFilter = filter;

  const paidCard = document.getElementById('paidTableCard');
  const pendingCard = document.getElementById('pendingTableCard');
  const badge = document.getElementById('filterCountBadge');

  const dropdown = document.getElementById('reportFilterDropdown');
  if (dropdown) dropdown.value = filter;

  if (filter === 'all') {
    if (paidCard) paidCard.style.display = 'block';
    if (pendingCard) pendingCard.style.display = 'block';
  } else if (filter === 'paid') {
    if (paidCard) paidCard.style.display = 'block';
    if (pendingCard) pendingCard.style.display = 'none';
  } else if (filter === 'pending') {
    if (paidCard) paidCard.style.display = 'none';
    if (pendingCard) pendingCard.style.display = 'block';
  }

  if (badge) {
    const paidCount = records.filter(r =>
      isFullyPaid(r.remainingAmount) && r.totalAmount
    ).length;
    const pendingCount = records.filter(r =>
      !isFullyPaid(r.remainingAmount)
    ).length;

    if (filter === 'all') {
      badge.textContent = `Total: ${records.length}`;
      badge.style.background = 'var(--navy)';
    } else if (filter === 'paid') {
      badge.textContent = `✅ Paid: ${paidCount}`;
      badge.style.background = '#2f7d4f';
    } else if (filter === 'pending') {
      badge.textContent = `⏳ Pending: ${pendingCount}`;
      badge.style.background = '#b8860b';
    }
  }

  renderPaidTable();
  renderPendingTable();
}

// ===== Fully Paid Table =====
function renderPaidTable() {
  const body = document.getElementById('paidTableBody');
  if (!body) return;

  const paidRecords = records.filter(r =>
    isFullyPaid(r.remainingAmount) && r.totalAmount
  );

  if (paidRecords.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color:#999; padding:20px;">
          No fully paid records found.
        </td>
      </tr>`;
    return;
  }

  body.innerHTML = paidRecords.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><b>${r.buyerName || '—'}</b></td>
      <td>${r.itemDetail || '—'}</td>
      <td>${r.totalAmount ? Number(r.totalAmount).toLocaleString() : '—'}</td>
      <td>${r.advanceAmount ? Number(r.advanceAmount).toLocaleString() : '—'}</td>
      <td>✅ OK</td>
      <td><span class="badge green">Fully Paid</span></td>
    </tr>
  `).join('');
}

// ===== Pending Table =====
function renderPendingTable() {
  const body = document.getElementById('pendingTableBody');
  if (!body) return;

  const pendingRecords = records.filter(r =>
    !isFullyPaid(r.remainingAmount)
  );

  if (pendingRecords.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; color:#999; padding:20px;">
          No pending records found.
        </td>
      </tr>`;
    return;
  }

  body.innerHTML = pendingRecords.map((r, i) => {
    const remarks = r.remarks || '';
    const timeDisplay = remarks
      ? `<span style="
            background:#fdf3e0;
            color:#b8860b;
            padding:3px 10px;
            border-radius:20px;
            font-size:12px;
            font-weight:600;
            font-family:'Jameel Noori Nastaleeq','Noto Naskh Arabic',serif;
            direction:rtl;
            display:inline-block;
          ">${remarks}</span>`
      : '<span style="color:#ccc;">—</span>';

    return `
      <tr>
        <td>${i + 1}</td>
        <td><b>${r.buyerName || '—'}</b></td>
        <td>${r.itemDetail || '—'}</td>
        <td>${r.totalAmount ? Number(r.totalAmount).toLocaleString() : '—'}</td>
        <td>${r.advanceAmount ? Number(r.advanceAmount).toLocaleString() : '—'}</td>
        <td style="color:var(--danger); font-weight:600;">
          ${formatRemaining(r.remainingAmount)}
        </td>
        <td>${timeDisplay}</td>
        <td><span class="badge amber">⏳ Pending</span></td>
      </tr>
    `;
  }).join('');
}
// ===== Top Models Chart =====
// ===== Top Items Sold Chart (Item Detail) =====
function renderModelsChart() {
  const canvas = document.getElementById('chartModels');
  if (!canvas || typeof Chart === 'undefined') return;

  const counts = {};
  records.forEach(r => {
    const m = (r.itemDetail || 'Unknown').trim() || 'Unknown'; // ← model ki jagah itemDetail
    counts[m] = (counts[m] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  if (chartModelsInstance) chartModelsInstance.destroy();
  chartModelsInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: entries.map(e => e[0]),
      datasets: [{
        label: 'Units Sold',
        data: entries.map(e => e[1]),
        backgroundColor: '#2f6fed',
        borderRadius: 6
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}
// ===== Sales vs Pending Chart =====
function renderSalesPendingChart() {
  const canvas = document.getElementById('chartSalesPending');
  if (!canvas || typeof Chart === 'undefined') return;

  const recent = records.slice(-8);
  if (chartSalesPendingInstance) chartSalesPendingInstance.destroy();
  chartSalesPendingInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: recent.map(r => (r.buyerName || '—').split(' ')[0]),
      datasets: [
        {
          label: 'Total',
          data: recent.map(r => parseFloat(r.totalAmount) || 0),
          backgroundColor: '#2f6fed'
        },
        {
          label: 'Pending',
          data: recent.map(r =>
            isFullyPaid(r.remainingAmount) ? 0 : (parseFloat(r.remainingAmount) || 0)
          ),
          backgroundColor: '#e0a11c'
        }
      ]
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// ===== Print / PDF =====
function populatePrintSheetFrom(data, installments) {
  fieldIds.forEach(id => {
    const target = document.getElementById('p_' + id);
    if (target) target.textContent = data[id] || '';
  });

  const body = document.getElementById('p_installBody');
  body.innerHTML = '';
  (installments || []).forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.sr ?? idx + 1}</td>
      <td>${row.date || ''}</td>
      <td>${row.total || ''}</td>
      <td>${row.received || ''}</td>
      <td>${row.remaining || ''}</td>
      <td>${row.signature || ''}</td>
      <td>${row.detail || ''}</td>
    `;
    body.appendChild(tr);
  });

  const minRows = 5;
  for (let i = (installments || []).length; i < minRows; i++) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>&nbsp;</td>'.repeat(7);
    body.appendChild(tr);
  }
}

function printNow() {
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('16px "Jameel Noori Nastaleeq"')
      .then(() => document.fonts.ready)
      .then(() => window.print());
  } else {
    window.print();
  }
}

function downloadPdf() {
  saveRecord();
  const data = collectForm();
  populatePrintSheetFrom(data, installRows);
  printNow();
}

function downloadRecordPdf(id) {
  const rec = records.find(r => r.id === id);
  if (!rec) return;
  populatePrintSheetFrom(rec, rec.installments);
  printNow();
}

// ===== Fix missing savedAt in existing records =====
async function fixMissingSavedAt() {
  let changed = false;
  records.forEach(rec => {
    if (!rec.savedAt || isNaN(new Date(rec.savedAt).getTime())) {
      rec.savedAt = new Date().toISOString();
      changed = true;
    }
  });
  if (changed) {
    await persistRecords();
    console.log('✅ Fixed missing savedAt dates');
  }
}

// ===== Initialize App =====
async function initApp() {
  requireLogin();
  records = await loadRecords();
  await fixMissingSavedAt(); // ← Fix missing dates
  addInstallmentRow();
  renderList();
  updateStats();
  renderReports();
}