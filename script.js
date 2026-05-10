const categories = {
  Housing: "#2f6f73",
  Food: "#d05a42",
  Transportation: "#d99b32",
  Transfer: "#4f6d7a",
  Robinhood: "#547aa5",
  Shopping: "#7d5ba6",
  Entertainment: "#23967f",
  Savings: "#8ab17d",
  Other: "#6c757d",
};

const seedStatements = [
  {
    id: crypto.randomUUID(),
    date: today(),
    description: "Rent",
    category: "Housing",
    amount: 1500,
    card: "Debit Card",
    account: "Chase",
  },
  {
    id: crypto.randomUUID(),
    date: today(),
    description: "Groceries",
    category: "Food",
    amount: 320,
    card: "Credit Card",
    account: "Chase",
  },
  {
    id: crypto.randomUUID(),
    date: today(),
    description: "Transit pass",
    category: "Transportation",
    amount: 88,
    card: "Debit Card",
    account: "SoFi",
  },
  {
    id: crypto.randomUUID(),
    date: today(),
    description: "Robinhood transfer",
    category: "Robinhood",
    amount: 116,
    card: "Credit Card",
    account: "Mission",
  },
];

const state = {
  income: loadMonthlyIncome(),
  statements: loadStatements(),
  editingId: null,
};

const form = document.querySelector("#statementForm");
const incomeInput = document.querySelector("#incomeInput");
const dateInput = document.querySelector("#dateInput");
const descriptionInput = document.querySelector("#descriptionInput");
const categoryInput = document.querySelector("#categoryInput");
const amountInput = document.querySelector("#amountInput");
const cardInput = document.querySelector("#cardInput");
const accountInput = document.querySelector("#accountInput");
const transferToInput = document.querySelector("#transferToInput");
const rows = document.querySelector("#statementRows");
const emptyState = document.querySelector("#emptyState");
const clearButton = document.querySelector("#clearButton");
const spentTotal = document.querySelector("#spentTotal");
const remainingTotal = document.querySelector("#remainingTotal");
const chartTotal = document.querySelector("#chartTotal");
const legend = document.querySelector("#categoryLegend");
const creditTotal = document.querySelector("#creditTotal");
const debitTotal = document.querySelector("#debitTotal");
const creditItems = document.querySelector("#creditItems");
const debitItems = document.querySelector("#debitItems");
const creditEmpty = document.querySelector("#creditEmpty");
const debitEmpty = document.querySelector("#debitEmpty");
const creditDueDate = document.querySelector("#creditDueDate");
const repeatMonthly = document.querySelector("#repeatMonthly");
const paymentDoneButton = document.querySelector("#paymentDoneButton");
const submitButton = form.querySelector(".primary-button");
const subscriptionForm = document.querySelector("#subscriptionForm");
const subscriptionName = document.querySelector("#subscriptionName");
const subscriptionAmount = document.querySelector("#subscriptionAmount");
const subscriptionDate = document.querySelector("#subscriptionDate");
const subscriptionRepeat = document.querySelector("#subscriptionRepeat");
const subscriptionCard = document.querySelector("#subscriptionCard");
const subscriptionAccount = document.querySelector("#subscriptionAccount");
const subscriptionList = document.querySelector("#subscriptionList");
const subscriptionEmpty = document.querySelector("#subscriptionEmpty");
const subscriptionMonthlyTotal = document.querySelector("#subscriptionMonthlyTotal");
const canvas = document.querySelector("#budgetChart");
const context = canvas.getContext("2d");

dateInput.value = today();
subscriptionDate.value = today();
incomeInput.value = state.income;
creditDueDate.value = localStorage.getItem("credit-due-date") || "";
repeatMonthly.checked = localStorage.getItem("credit-repeat-monthly") === "true";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadStatements() {
  const saved = localStorage.getItem("budget-statements");
  const statements = saved ? JSON.parse(saved) : seedStatements;
  return statements.map((item) => ({
    ...item,
    date: item.date || today(),
    card: item.card || "Debit Card",
    account: item.account || "Chase",
    category: normalizeCategory(item.category),
  }));
}

function normalizeCategory(category) {
  if (category === "Health") return "Shopping";
  if (category === "Utilities") return "Robinhood";
  return category;
}

function normalizeAccountName(accountName) {
  return String(accountName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function accountNameMatches(key, account, kind) {
  return key === normalizeAccountName(BudgetSettings.accountLabel(account, kind));
}

function loadMonthlyIncome() {
  return Number(localStorage.getItem("monthly-income")) || 0;
}

function saveStatements() {
  localStorage.setItem("budget-statements", JSON.stringify(state.statements));
}

function loadSubscriptions() {
  return JSON.parse(localStorage.getItem("subscriptions") || "[]");
}

function saveSubscriptions(subscriptions) {
  localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
}

function saveSpendingHistory(statements) {
  if (statements.length === 0) return;

  const history = JSON.parse(localStorage.getItem("spending-history") || "[]");
  const paidAt = today();
  const archived = statements.map((statement) => ({
    ...statement,
    historyId: crypto.randomUUID(),
    paidAt,
  }));

  localStorage.setItem("spending-history", JSON.stringify([...archived, ...history]));
}

function loadHoldings() {
  const defaults = {
    chase: { checking: 0, savings: 0 },
    sofi: { checking: 0, savings: 0 },
    mission: { checking: 0, savings: 0 },
    robinhood: { holding: 0 },
  };
  const saved = localStorage.getItem("account-holdings");
  if (!saved) return defaults;

  const parsed = JSON.parse(saved);
  return Object.keys(defaults).reduce((holdings, account) => {
    holdings[account] = { ...defaults[account], ...(parsed[account] || {}) };
    return holdings;
  }, {});
}

function saveHoldings(holdings) {
  localStorage.setItem("account-holdings", JSON.stringify(holdings));
}

function accountDestination(accountName) {
  const key = normalizeAccountName(accountName);
  const settings = BudgetSettings.loadBudgetSettings();
  const destinations = {
    chase: { account: "chase", kind: "checking" },
    "chase checking": { account: "chase", kind: "checking" },
    "chase savings": { account: "chase", kind: "savings" },
    sofi: { account: "sofi", kind: "checking" },
    "sofi checking": { account: "sofi", kind: "checking" },
    "sofi savings": { account: "sofi", kind: "savings" },
    mission: { account: "mission", kind: "checking" },
    "mission checking": { account: "mission", kind: "checking" },
    "mission savings": { account: "mission", kind: "savings" },
    robinhood: { account: "robinhood", kind: "holding" },
  };

  for (const account of ["chase", "sofi", "mission"]) {
    if (key === normalizeAccountName(settings.bankNames[account])) {
      return { account, kind: "checking" };
    }

    for (const kind of ["checking", "savings"]) {
      if (accountNameMatches(key, account, kind)) return { account, kind };
    }
  }

  if (accountNameMatches(key, "robinhood", "holding")) {
    return { account: "robinhood", kind: "holding" };
  }

  return destinations[key] || null;
}

function changeHolding(holdings, destination, amount) {
  if (!destination) return;
  holdings[destination.account][destination.kind] += amount;
}

function applyDebitImpact(statement, direction) {
  if (statement.card !== "Debit Card") return;

  const holdings = loadHoldings();
  const destination = accountDestination(statement.account);
  changeHolding(holdings, destination, direction * statement.amount);
  saveHoldings(holdings);
}

function applyTransferImpact(statement, direction) {
  if (statement.category !== "Robinhood" && statement.category !== "Transfer") return;

  const holdings = loadHoldings();
  const source = accountDestination(statement.account);
  const destination = accountDestination(statement.transferTo || "Robinhood");

  changeHolding(holdings, source, -direction * statement.amount);
  changeHolding(holdings, destination, direction * statement.amount);
  saveHoldings(holdings);
}

function applyStatementImpact(statement, direction) {
  if (statement.category === "Robinhood" || statement.category === "Transfer") {
    applyTransferImpact(statement, direction);
    return;
  }

  applyDebitImpact(statement, -direction);
}

function payCreditCardFromChase() {
  const creditAmount = state.statements
    .filter(
      (statement) =>
        statement.card === "Credit Card" &&
        statement.category !== "Robinhood" &&
        statement.category !== "Transfer",
    )
    .reduce((sum, statement) => sum + statement.amount, 0);

  const holdings = loadHoldings();
  holdings.chase.checking -= creditAmount;
  saveHoldings(holdings);
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

function nextMonthlyDate(value) {
  if (!value) return "";

  const date = new Date(`${value}T12:00:00`);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function dateFromValue(value) {
  return new Date(`${value}T12:00:00`);
}

function dateValue(date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(value, amount) {
  const source = dateFromValue(value);
  const target = new Date(source);
  const day = source.getDate();

  target.setDate(1);
  target.setMonth(target.getMonth() + amount);
  target.setDate(Math.min(day, new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
  return dateValue(target);
}

function addYears(value, amount) {
  const source = dateFromValue(value);
  const target = new Date(source);
  const day = source.getDate();

  target.setDate(1);
  target.setFullYear(target.getFullYear() + amount);
  target.setDate(Math.min(day, new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
  return dateValue(target);
}

function nextSubscriptionDate(subscription) {
  if (subscription.repeat === "Weekly") {
    const date = dateFromValue(subscription.date);
    date.setDate(date.getDate() + 7);
    return dateValue(date);
  }

  if (subscription.repeat === "Yearly") return addYears(subscription.date, 1);
  return addMonths(subscription.date, 1);
}

function statementFromSubscription(subscription) {
  return {
    id: crypto.randomUUID(),
    date: subscription.date,
    description: subscription.name,
    category: "Other",
    amount: Number(subscription.amount),
    card: subscription.card,
    account: subscription.account,
    transferTo: subscription.transferTo || "",
    subscriptionId: subscription.id,
  };
}

function processDueSubscriptions() {
  const currentDate = today();
  const subscriptions = loadSubscriptions();
  let didUpdateSubscriptions = false;
  let didAddStatements = false;

  const updatedSubscriptions = subscriptions.map((subscription) => {
    if (!subscription.date || subscription.date > currentDate) return subscription;

    const updated = { ...subscription };
    let guard = 0;

    while (updated.date && updated.date <= currentDate && guard < 120) {
      const statement = statementFromSubscription(updated);
      state.statements.unshift(statement);
      applyStatementImpact(statement, 1);
      updated.date = nextSubscriptionDate(updated);
      didAddStatements = true;
      didUpdateSubscriptions = true;
      guard += 1;
    }

    return updated;
  });

  if (didAddStatements) saveStatements();
  if (didUpdateSubscriptions) saveSubscriptions(updatedSubscriptions);
}

function totalsByCategory() {
  return state.statements.reduce((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + item.amount;
    return totals;
  }, {});
}

function renderRows() {
  rows.innerHTML = "";
  emptyState.hidden = state.statements.length > 0;

  state.statements.forEach((item) => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(item.date);

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = item.description;

    const categoryCell = document.createElement("td");
    categoryCell.textContent = displayCategory(item.category);

    const amountCell = document.createElement("td");
    amountCell.textContent = money(item.amount);

    const cardCell = document.createElement("td");
    cardCell.textContent = item.card;

    const accountCell = document.createElement("td");
    accountCell.textContent = item.transferTo ? `${item.account} -> ${item.transferTo}` : item.account;

    const actionCell = document.createElement("td");
    const editButton = document.createElement("button");
    editButton.className = "edit-button";
    editButton.type = "button";
    editButton.ariaLabel = `Edit ${item.description}`;
    editButton.dataset.id = item.id;
    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.ariaLabel = `Delete ${item.description}`;
    deleteButton.dataset.id = item.id;
    deleteButton.textContent = "x";
    actionCell.appendChild(editButton);
    actionCell.appendChild(deleteButton);

    row.append(dateCell, descriptionCell, categoryCell, amountCell, cardCell, accountCell, actionCell);
    rows.appendChild(row);
  });
}

function displayCategory(category) {
  return category === "Robinhood" ? BudgetSettings.loadBudgetSettings().investmentName : category;
}

function statementFromForm(id = crypto.randomUUID()) {
  return {
    id,
    date: dateInput.value,
    description: descriptionInput.value.trim(),
    category: categoryInput.value,
    amount: Number(amountInput.value),
    card: cardInput.value,
    account: accountInput.value,
    transferTo: transferToInput.value.trim(),
  };
}

function setFormMode(mode) {
  submitButton.textContent = mode === "edit" ? "Save" : "Add";
}

function resetForm() {
  form.reset();
  dateInput.value = today();
  state.editingId = null;
  setFormMode("add");
}

function startEditing(statement) {
  state.editingId = statement.id;
  dateInput.value = statement.date;
  descriptionInput.value = statement.description;
  categoryInput.value = statement.category;
  amountInput.value = statement.amount;
  cardInput.value = statement.card;
  accountInput.value = statement.account;
  transferToInput.value = statement.transferTo || "";
  setFormMode("edit");
  descriptionInput.focus();
}

function renderSummary() {
  const spent = state.statements.reduce((sum, item) => sum + item.amount, 0);
  const remaining = state.income - spent;

  spentTotal.textContent = money(spent);
  remainingTotal.textContent = money(remaining);
  chartTotal.textContent = money(spent);
  remainingTotal.style.color = remaining < 0 ? "#b33f2f" : "#20242b";
}

function renderCardSection(cardName, totalElement, listElement, emptyElement) {
  const cardStatements = state.statements.filter((item) => item.card === cardName);
  const total = cardStatements.reduce((sum, item) => sum + item.amount, 0);

  totalElement.textContent = money(total);
  listElement.innerHTML = "";
  emptyElement.hidden = cardStatements.length > 0;

  cardStatements.slice(0, 5).forEach((item) => {
    const row = document.createElement("div");
    row.className = "card-item";

    const description = document.createElement("span");
    description.textContent = `${item.description} · ${displayCategory(item.category)} · ${item.account}`;

    const amount = document.createElement("strong");
    amount.textContent = money(item.amount);

    row.append(description, amount);
    listElement.appendChild(row);
  });
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
    context.fillStyle = categories[category];
    context.fill();
    startAngle += sliceAngle;
  });
}

function renderLegend() {
  const totals = totalsByCategory();
  legend.innerHTML = "";

  Object.entries(categories).forEach(([category, color]) => {
    const amount = totals[category] || 0;
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span class="swatch" style="background:${color}"></span>
      <span>${displayCategory(category)}</span>
      <strong>${money(amount)}</strong>
    `;
    legend.appendChild(item);
  });
}

function render() {
  BudgetSettings.applyBudgetSettingsToPage();
  renderAccountControls();
  renderRows();
  renderSummary();
  renderCardSection("Credit Card", creditTotal, creditItems, creditEmpty);
  renderCardSection("Debit Card", debitTotal, debitItems, debitEmpty);
  renderSubscriptions();
  drawChart();
  renderLegend();
}

function fillSelect(select, labels, selectedValue = select.value) {
  select.innerHTML = "";

  labels.forEach((label) => {
    const option = document.createElement("option");
    option.textContent = label;
    select.appendChild(option);
  });

  select.value = selectedValue;
  if (!select.value) select.selectedIndex = 0;
}

function renderAccountControls() {
  const accountLabels = BudgetSettings.plainAccountOptions(true);
  const bankLabels = BudgetSettings.plainAccountOptions(false).map((label) => label.replace(/ (checking|savings)$/, ""));
  const uniqueBankLabels = [...new Set(bankLabels), BudgetSettings.loadBudgetSettings().investmentName];

  fillSelect(accountInput, accountLabels);
  fillSelect(subscriptionAccount, uniqueBankLabels);

  const currentTransferTo = transferToInput.value;
  const accountOptions = document.querySelector("#accountOptions");
  accountOptions.innerHTML = "";
  accountLabels.forEach((label) => {
    const option = document.createElement("option");
    option.value = label;
    accountOptions.appendChild(option);
  });
  transferToInput.value = currentTransferTo;
}

function monthlySubscriptionAmount(subscription) {
  if (subscription.repeat === "Weekly") return subscription.amount * 52 / 12;
  if (subscription.repeat === "Yearly") return subscription.amount / 12;
  return subscription.amount;
}

function renderSubscriptions() {
  const subscriptions = loadSubscriptions();
  subscriptionList.innerHTML = "";
  subscriptionEmpty.hidden = subscriptions.length > 0;

  const monthlyTotal = subscriptions.reduce(
    (sum, subscription) => sum + monthlySubscriptionAmount(subscription),
    0,
  );
  subscriptionMonthlyTotal.textContent = money(monthlyTotal);

  subscriptions.forEach((subscription) => {
    const item = document.createElement("div");
    item.className = "subscription-item";

    const detail = document.createElement("div");
    const name = document.createElement("strong");
    const meta = document.createElement("span");
    const amount = document.createElement("strong");
    const deleteButton = document.createElement("button");

    name.textContent = subscription.name;
    const dateText = subscription.date ? ` · ${formatDate(subscription.date)}` : "";
    meta.textContent = `${subscription.repeat}${dateText} · ${subscription.card} · ${subscription.account}`;
    amount.textContent = money(subscription.amount);
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.id = subscription.id;
    deleteButton.setAttribute("aria-label", `Delete ${subscription.name}`);
    deleteButton.textContent = "x";

    detail.append(name, meta);
    item.append(detail, amount, deleteButton);
    subscriptionList.appendChild(item);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (state.editingId) {
    const index = state.statements.findIndex((item) => item.id === state.editingId);
    if (index !== -1) {
      const previousStatement = state.statements[index];
      const updatedStatement = statementFromForm(state.editingId);

      applyStatementImpact(previousStatement, -1);
      applyStatementImpact(updatedStatement, 1);
      state.statements[index] = updatedStatement;
    }
  } else {
    const statement = statementFromForm();
    state.statements.unshift(statement);
    applyStatementImpact(statement, 1);
  }

  saveStatements();
  resetForm();
  descriptionInput.focus();
  render();
});

subscriptionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const subscriptions = loadSubscriptions();
  subscriptions.unshift({
    id: crypto.randomUUID(),
    name: subscriptionName.value.trim(),
    amount: Number(subscriptionAmount.value),
    date: subscriptionDate.value,
    repeat: subscriptionRepeat.value,
    card: subscriptionCard.value,
    account: subscriptionAccount.value,
  });

  saveSubscriptions(subscriptions);
  subscriptionForm.reset();
  subscriptionDate.value = today();
  subscriptionName.focus();
  processDueSubscriptions();
  render();
});

subscriptionList.addEventListener("click", (event) => {
  if (!event.target.matches(".delete-button")) return;

  const subscriptions = loadSubscriptions().filter(
    (subscription) => subscription.id !== event.target.dataset.id,
  );
  saveSubscriptions(subscriptions);
  render();
});

rows.addEventListener("click", (event) => {
  if (event.target.matches(".edit-button")) {
    const statement = state.statements.find((item) => item.id === event.target.dataset.id);
    if (statement) {
      startEditing(statement);
    }
    return;
  }

  if (!event.target.matches(".delete-button")) return;

  const statement = state.statements.find((item) => item.id === event.target.dataset.id);
  if (statement) {
    applyStatementImpact(statement, -1);
  }

  state.statements = state.statements.filter((item) => item.id !== event.target.dataset.id);
  saveStatements();
  render();
});

clearButton.addEventListener("click", () => {
  state.statements.forEach((statement) => applyStatementImpact(statement, -1));
  state.statements = [];
  resetForm();
  saveStatements();
  render();
});

creditDueDate.addEventListener("input", () => {
  localStorage.setItem("credit-due-date", creditDueDate.value);
});

repeatMonthly.addEventListener("change", () => {
  localStorage.setItem("credit-repeat-monthly", String(repeatMonthly.checked));
});

paymentDoneButton.addEventListener("click", () => {
  payCreditCardFromChase();
  saveSpendingHistory(state.statements);
  state.statements = [];
  saveStatements();
  if (repeatMonthly.checked) {
    creditDueDate.value = nextMonthlyDate(creditDueDate.value);
    localStorage.setItem("credit-due-date", creditDueDate.value);
  }
  render();
});

processDueSubscriptions();
render();
