const workCategories = {
  Travel: "#2f6f73",
  Meals: "#d05a42",
  Supplies: "#d99b32",
  Mileage: "#547aa5",
  Software: "#7d5ba6",
  Lodging: "#23967f",
  Client: "#8ab17d",
  Other: "#6c757d",
};

const seedExpenses = [
  {
    id: crypto.randomUUID(),
    date: today(),
    description: "Client lunch",
    category: "Meals",
    amount: 64.5,
    status: "Submitted",
  },
  {
    id: crypto.randomUUID(),
    date: today(),
    description: "Project software",
    category: "Software",
    amount: 29,
    status: "Reimbursed",
  },
];

const state = {
  expenses: loadExpenses(),
};

const form = document.querySelector("#workForm");
const dateInput = document.querySelector("#dateInput");
const descriptionInput = document.querySelector("#descriptionInput");
const receiptInput = document.querySelector("#receiptInput");
const categoryInput = document.querySelector("#categoryInput");
const amountInput = document.querySelector("#amountInput");
const statusInput = document.querySelector("#statusInput");
const notesInput = document.querySelector("#notesInput");
const rows = document.querySelector("#workRows");
const emptyState = document.querySelector("#emptyState");
const clearButton = document.querySelector("#clearWorkButton");
const printAllReceipts = document.querySelector("#printAllReceipts");
const receiptPrintArea = document.querySelector("#receiptPrintArea");
const workTotal = document.querySelector("#workTotal");
const reimbursedTotal = document.querySelector("#reimbursedTotal");
const outstandingTotal = document.querySelector("#outstandingTotal");
const chartTotal = document.querySelector("#chartTotal");
const legend = document.querySelector("#workLegend");
const canvas = document.querySelector("#workChart");
const context = canvas.getContext("2d");

dateInput.value = today();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadExpenses() {
  const saved = localStorage.getItem("work-expenses");
  return saved ? JSON.parse(saved) : seedExpenses;
}

function saveExpenses() {
  localStorage.setItem("work-expenses", JSON.stringify(state.expenses));
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function totalsByCategory() {
  return state.expenses.reduce((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + item.amount;
    return totals;
  }, {});
}

function renderRows() {
  rows.innerHTML = "";
  emptyState.hidden = state.expenses.length > 0;

  state.expenses.forEach((item) => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(item.date);

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = item.description;

    const categoryCell = document.createElement("td");
    categoryCell.textContent = item.category;

    const receiptCell = document.createElement("td");
    receiptCell.textContent = item.receiptNumber || "Receipt";

    const amountCell = document.createElement("td");
    amountCell.textContent = money(item.amount);

    const statusCell = document.createElement("td");
    statusCell.textContent = item.status;

    const actionCell = document.createElement("td");
    const printButton = document.createElement("button");
    printButton.className = "edit-button";
    printButton.type = "button";
    printButton.ariaLabel = `Make PDF receipt for ${item.description}`;
    printButton.dataset.id = item.id;
    printButton.textContent = "PDF";

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.ariaLabel = `Delete ${item.description}`;
    deleteButton.dataset.id = item.id;
    deleteButton.textContent = "x";
    actionCell.appendChild(printButton);
    actionCell.appendChild(deleteButton);

    row.append(dateCell, descriptionCell, categoryCell, receiptCell, amountCell, statusCell, actionCell);
    rows.appendChild(row);
  });
}

function renderSummary() {
  const total = state.expenses.reduce((sum, item) => sum + item.amount, 0);
  const reimbursed = state.expenses
    .filter((item) => item.status === "Reimbursed")
    .reduce((sum, item) => sum + item.amount, 0);
  const outstanding = total - reimbursed;

  workTotal.textContent = money(total);
  reimbursedTotal.textContent = money(reimbursed);
  outstandingTotal.textContent = money(outstanding);
  chartTotal.textContent = money(total);
}

function drawChart() {
  const totals = totalsByCategory();
  const slices = Object.entries(totals).filter(([, amount]) => amount > 0);
  const total = slices.reduce((sum, [, amount]) => sum + amount, 0);
  const center = canvas.width / 2;
  const radius = canvas.width / 2 - 14;

  context.clearRect(0, 0, canvas.width, canvas.height);

  if (total === 0) {
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fillStyle = "#d9e0e8";
    context.fill();
    return;
  }

  let startAngle = -Math.PI / 2;
  slices.forEach(([category, amount]) => {
    const sliceAngle = (amount / total) * Math.PI * 2;
    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, radius, startAngle, startAngle + sliceAngle);
    context.closePath();
    context.fillStyle = workCategories[category];
    context.fill();
    startAngle += sliceAngle;
  });
}

function renderLegend() {
  const totals = totalsByCategory();
  legend.innerHTML = "";

  Object.entries(workCategories).forEach(([category, color]) => {
    const amount = totals[category] || 0;
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span class="swatch" style="background:${color}"></span>
      <span>${category}</span>
      <strong>${money(amount)}</strong>
    `;
    legend.appendChild(item);
  });
}

function render() {
  renderRows();
  renderSummary();
  drawChart();
  renderLegend();
}

function receiptNumber(expense, index) {
  const fallbackIndex = state.expenses.findIndex((item) => item.id === expense.id);
  const number = fallbackIndex === -1 ? index + 1 : fallbackIndex + 1;
  return expense.receiptNumber || `WORK-${String(number).padStart(4, "0")}`;
}

function receiptMarkup(expense, index) {
  return `
    <article class="receipt-page">
      <header class="receipt-header">
        <div>
          <p class="eyebrow">Work receipt</p>
          <h2>${escapeHtml(BudgetSettings.budgetTitle())}</h2>
        </div>
        <strong>${escapeHtml(receiptNumber(expense, index))}</strong>
      </header>

      <dl class="receipt-details">
        <div>
          <dt>Date</dt>
          <dd>${formatDate(expense.date)}</dd>
        </div>
        <div>
          <dt>Vendor</dt>
          <dd>${escapeHtml(expense.description)}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>${escapeHtml(expense.category)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>${escapeHtml(expense.status)}</dd>
        </div>
      </dl>

      <div class="receipt-total">
        <span>Total</span>
        <strong>${money(expense.amount)}</strong>
      </div>

      <section class="receipt-notes">
        <h3>Notes</h3>
        <p>${escapeHtml(expense.notes || "No notes added.")}</p>
      </section>
    </article>
  `;
}

function printReceipts(expenses) {
  if (expenses.length === 0) return;

  receiptPrintArea.innerHTML = expenses.map((expense, index) => receiptMarkup(expense, index)).join("");
  window.print();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  state.expenses.unshift({
    id: crypto.randomUUID(),
    date: dateInput.value,
    description: descriptionInput.value.trim(),
    receiptNumber: receiptInput.value.trim(),
    category: categoryInput.value,
    amount: Number(amountInput.value),
    status: statusInput.value,
    notes: notesInput.value.trim(),
  });

  saveExpenses();
  form.reset();
  dateInput.value = today();
  descriptionInput.focus();
  render();
});

rows.addEventListener("click", (event) => {
  if (event.target.matches(".edit-button")) {
    const expense = state.expenses.find((item) => item.id === event.target.dataset.id);
    if (expense) printReceipts([expense]);
    return;
  }

  if (!event.target.matches(".delete-button")) return;

  state.expenses = state.expenses.filter((item) => item.id !== event.target.dataset.id);
  saveExpenses();
  render();
});

printAllReceipts.addEventListener("click", () => {
  printReceipts(state.expenses);
});

clearButton.addEventListener("click", () => {
  state.expenses = [];
  saveExpenses();
  render();
});

render();
