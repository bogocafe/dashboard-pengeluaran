const categories = [
  "Ayam / KG", "Cabe Merah", "Cabe Hijau", "Cabe Rawit", "Bawang", "Sawi", "Sop/pre", "Terong",
  "Timun", "Tempe", "Kol", "Tomat", "Lemon", "Krupuk", "Rokok", "Listrik", "Minuman",
  "Bawang Goreng", "Telur", "Rempah", "Gula Aren"
];

function makeInitialRows() {
  return Array.from({ length: 31 }, (_, i) => ({
    date: `${i + 1} Mei 2026`,
    values: Object.fromEntries(categories.map(c => [c, 0]))
  }));
}

let rows = JSON.parse(localStorage.getItem("bogoExpenseRows") || "null") || makeInitialRows();

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 2600);
}

function rupiah(num) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num || 0);
}

function parseMoney(value) {
  if (typeof value === "number") return value;
  return Number(String(value).replace(/[^0-9]/g, "")) || 0;
}

function rowTotal(row) {
  return categories.reduce((sum, cat) => sum + parseMoney(row.values[cat]), 0);
}

function saveLocal() {
  localStorage.setItem("bogoExpenseRows", JSON.stringify(rows));
  updateSummary();
  renderChart();
}

function saveApiUrl() {
  const url = document.getElementById("apiUrl").value.trim();
  localStorage.setItem("bogoApiUrl", url);
  toast("URL Google Sheets disimpan.");
}

function getApiUrl() {
  return localStorage.getItem("bogoApiUrl") || "";
}

function renderTable() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const catFilter = document.getElementById("categoryFilter").value;
  const visibleCategories = catFilter === "all" ? categories : [catFilter];
  const table = document.getElementById("expenseTable");

  let html = `<thead><tr><th>Tanggal</th>${visibleCategories.map(c => `<th>${c}</th>`).join("")}<th>Total</th><th>Aksi</th></tr></thead><tbody>`;

  rows.forEach((row, rowIndex) => {
    const matches = row.date.toLowerCase().includes(search) || categories.some(c => c.toLowerCase().includes(search));
    if (!matches) return;

    html += `<tr><td contenteditable="true" onblur="updateDate(${rowIndex}, this.innerText)">${row.date}</td>`;
    visibleCategories.forEach(cat => {
      const value = parseMoney(row.values[cat]);
      html += `<td><input class="money-input" value="${value ? value : ""}" placeholder="0" oninput="updateValue(${rowIndex}, '${cat}', this.value)" /></td>`;
    });
    html += `<td class="total-cell" id="total-${rowIndex}">${rupiah(rowTotal(row))}</td>
      <td><div class="actions">
        <button class="icon-btn" onclick="clearRow(${rowIndex})">Bersih</button>
        <button class="icon-btn" onclick="deleteRow(${rowIndex})">Hapus</button>
      </div></td></tr>`;
  });

  html += `</tbody>`;
  table.innerHTML = html;
  updateSummary();
}

function updateDate(rowIndex, value) {
  rows[rowIndex].date = value.trim() || rows[rowIndex].date;
  saveLocal();
}

function updateValue(rowIndex, cat, value) {
  rows[rowIndex].values[cat] = parseMoney(value);
  const totalEl = document.getElementById(`total-${rowIndex}`);
  if (totalEl) totalEl.textContent = rupiah(rowTotal(rows[rowIndex]));
  saveLocal();
}

function updateSummary() {
  const totals = rows.map(rowTotal);
  const monthTotal = totals.reduce((a, b) => a + b, 0);
  const highest = Math.max(...totals, 0);
  const filled = totals.filter(t => t > 0).length;

  document.getElementById("monthTotal").textContent = rupiah(monthTotal);
  document.getElementById("highestDay").textContent = rupiah(highest);
  document.getElementById("avgDaily").textContent = rupiah(filled ? monthTotal / filled : 0);
  document.getElementById("filledDays").textContent = `${filled} Hari`;
}

function renderChart() {
  const chart = document.getElementById("dailyChart");
  const totals = rows.map(rowTotal);
  const max = Math.max(...totals, 1);

  chart.innerHTML = rows.map((row, i) => {
    const h = Math.max((totals[i] / max) * 200, totals[i] ? 8 : 2);
    return `<div class="bar" style="height:${h}px" data-label="${row.date}: ${rupiah(totals[i])}"></div>`;
  }).join("");

  const summary = categories
    .map(cat => ({ cat, total: rows.reduce((sum, row) => sum + parseMoney(row.values[cat]), 0) }))
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  document.getElementById("categorySummary").innerHTML = summary.length
    ? summary.map(item => `<div class="category-row"><span>${item.cat}</span><strong>${rupiah(item.total)}</strong></div>`).join("")
    : `<p style="color:var(--muted)">Belum ada pengeluaran.</p>`;
}

function addRow() {
  rows.push({ date: "Tanggal Baru", values: Object.fromEntries(categories.map(c => [c, 0])) });
  saveLocal();
  renderTable();
}

function clearRow(index) {
  if (!confirm("Bersihkan semua pengeluaran di tanggal ini?")) return;
  rows[index].values = Object.fromEntries(categories.map(c => [c, 0]));
  saveLocal();
  renderTable();
}

function deleteRow(index) {
  if (!confirm("Hapus baris tanggal ini?")) return;
  rows.splice(index, 1);
  saveLocal();
  renderTable();
}

function exportCSV() {
  const header = ["Tanggal", ...categories, "Total"];
  const lines = [header.join(",")];
  rows.forEach(row => lines.push([row.date, ...categories.map(c => parseMoney(row.values[c])), rowTotal(row)].join(",")));
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pengeluaran-bogo-cafe.csv";
  a.click();
}

async function loadFromSheet() {
  const url = getApiUrl();
  if (!url) return toast("Tempel URL Google Apps Script dulu.");

  try {
    toast("Mengambil data...");
    const res = await fetch(url + "?action=read");
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Gagal membaca data.");
    rows = data.rows && data.rows.length ? data.rows : makeInitialRows();
    saveLocal();
    renderTable();
    toast("Data berhasil diambil dari Google Sheets.");
  } catch (err) {
    toast("Gagal ambil data. Cek URL/deploy Apps Script.");
    console.error(err);
  }
}

async function saveToSheet() {
  const url = getApiUrl();

  try {
    toast("Menyimpan data...");
    const res = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "write", rows })
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Gagal menyimpan data.");
    toast("Data berhasil disimpan ke Google Sheets.");
  } catch (err) {
    toast("Gagal simpan. Cek URL/deploy Apps Script.");
    console.error(err);
  }
}

function initFilters() {
  document.getElementById("apiUrl").value = getApiUrl();

  const select = document.getElementById("categoryFilter");
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

initFilters();
renderTable();
renderChart();
