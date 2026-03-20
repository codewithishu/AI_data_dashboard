const API = 'https://ai-data-dashboard-wtk4.onrender.com/api';

let currentData = null;
let currentColumns = null;
let currentStats = null;
let myChart = null;

// ==================
// FILE UPLOAD
// ==================

document.getElementById('csv-file').addEventListener('change', async (e) => {
  console.log('1. File input changed!');
  const file = e.target.files[0];
  console.log('2. File:', file);
  if (!file) return;

  const msg = document.getElementById('upload-message');
  msg.textContent = '⏳ Uploading and analyzing...';
  msg.className = 'message';

  const formData = new FormData();
  formData.append('file', file);
  console.log('3. Sending to:', `${API}/upload`);

  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    });
    console.log('4. Response status:', res.status);

    const data = await res.json();
    console.log('5. Response data:', data);

    if (!res.ok) {
      msg.textContent = data.message;
      return;
    }

    currentData = data.data;
    currentColumns = data.columns;
    currentStats = data.stats;

    msg.textContent = `✅ Successfully loaded ${data.totalRows} rows!`;
    msg.className = 'message success';

    renderSummaryCards(data.stats, data.totalRows);
    renderTable(data.data, data.columns);
    populateChartColumns(data.columns, data.stats);

    document.getElementById('stats-section').style.display = 'block';

  } catch (err) {
    console.log('ERROR:', err);
    msg.textContent = 'Something went wrong. Try again!';
  }
});

// ==================
// SUMMARY CARDS
// ==================

function renderSummaryCards(stats, totalRows) {
  const container = document.getElementById('summary-cards');

  let html = `
    <div class="stat-card">
      <h4>Total Rows</h4>
      <div class="stat-value">${totalRows}</div>
      <div class="stat-label">records in dataset</div>
    </div>
    <div class="stat-card">
      <h4>Total Columns</h4>
      <div class="stat-value">${Object.keys(stats).length}</div>
      <div class="stat-label">numeric columns</div>
    </div>
  `;

  Object.entries(stats).forEach(([col, s]) => {
    html += `
      <div class="stat-card">
        <h4>${col}</h4>
        <div class="stat-value">${s.mean}</div>
        <div class="stat-label">avg | max: ${s.max} | min: ${s.min}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ==================
// DATA TABLE
// ==================

function renderTable(data, columns) {
  const table = document.getElementById('data-table');
  const preview = data.slice(0, 10);

  let html = '<thead><tr>';
  columns.forEach(col => {
    html += `<th>${col}</th>`;
  });
  html += '</tr></thead><tbody>';

  preview.forEach(row => {
    html += '<tr>';
    columns.forEach(col => {
      html += `<td>${row[col] !== null && row[col] !== undefined ? row[col] : '-'}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody>';
  table.innerHTML = html;
}

// ==================
// CHARTS
// ==================

function populateChartColumns(columns, stats) {
  const select = document.getElementById('chart-column');
  select.innerHTML = '';

  const numericCols = Object.keys(stats);
  numericCols.forEach(col => {
    select.innerHTML += `<option value="${col}">${col}</option>`;
  });
}

function generateChart() {
  const column = document.getElementById('chart-column').value;
  const chartType = document.getElementById('chart-type').value;

  if (!currentData || !column) return;

  const labels = currentData.slice(0, 15).map((row, i) => `Row ${i + 1}`);
  const values = currentData.slice(0, 15).map(row => row[column]);

  if (myChart) myChart.destroy();

  const ctx = document.getElementById('myChart').getContext('2d');

  const colors = [
    '#6c63ff', '#f093fb', '#f5576c', '#2ed573',
    '#ffa502', '#1e90ff', '#ff6b81', '#a29bfe',
    '#fd79a8', '#00cec9', '#fdcb6e', '#e17055',
    '#74b9ff', '#55efc4', '#636e72'
  ];

  myChart = new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: column,
        data: values,
        backgroundColor: chartType === 'line' ? 'rgba(108, 99, 255, 0.2)' : colors,
        borderColor: chartType === 'line' ? '#6c63ff' : colors,
        borderWidth: 2,
        fill: chartType === 'line',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: `${column} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`
        }
      }
    }
  });
}

// ==================
// AI INSIGHTS
// ==================

async function getAIInsights() {
  if (!currentData || !currentColumns || !currentStats) return;

  const aiBox = document.getElementById('ai-box');
  const aiText = document.getElementById('ai-text');

  aiBox.style.display = 'block';
  aiText.textContent = '🤖 Analyzing your data...';

  try {
    const res = await fetch(`${API}/ai/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columns: currentColumns,
        stats: currentStats,
        totalRows: currentData.length,
        sampleData: currentData.slice(0, 5)
      })
    });

    const data = await res.json();
    aiText.textContent = data.insights;

  } catch (err) {
    aiText.textContent = 'Something went wrong. Try again!';
    console.error(err);
  }
}