const defaultHoldings = {
  chase: { checking: 0, savings: 0 },
  sofi: { checking: 0, savings: 0 },
  mission: { checking: 0, savings: 0 },
  robinhood: { holding: 0 },
};

const state = {
  holdings: loadHoldings(),
};

const form = document.querySelector("#accountsForm");
const paycheckForm = document.querySelector("#paycheckForm");
const extraMoneyForm = document.querySelector("#extraMoneyForm");
const moneySource = document.querySelector("#moneySource");
const extraMoneyAccount = document.querySelector("#extraMoneyAccount");
const extraMoneyAmount = document.querySelector("#extraMoneyAmount");
const paycheckAmount = document.querySelector("#paycheckAmount");
const firstSplitAccount = document.querySelector("#firstSplitAccount");
const secondSplitAccount = document.querySelector("#secondSplitAccount");
const firstSplitPercent = document.querySelector("#firstSplitPercent");
const secondSplitPercent = document.querySelector("#secondSplitPercent");
const firstSplitLabel = document.querySelector("#firstSplitLabel");
const secondSplitLabel = document.querySelector("#secondSplitLabel");
const firstSplitAmount = document.querySelector("#firstSplitAmount");
const secondSplitAmount = document.querySelector("#secondSplitAmount");
const resetButton = document.querySelector("#resetAccounts");
const totalCash = document.querySelector("#totalCash");
const checkingTotal = document.querySelector("#checkingTotal");
const savingsTotal = document.querySelector("#savingsTotal");
const investmentTotal = document.querySelector("#investmentTotal");
const monthlyIncomeTotal = document.querySelector("#monthlyIncomeTotal");

function loadHoldings() {
  const saved = localStorage.getItem("account-holdings");
  if (!saved) return cloneHoldings(defaultHoldings);

  const parsed = JSON.parse(saved);
  return Object.keys(defaultHoldings).reduce((holdings, account) => {
    holdings[account] = { ...defaultHoldings[account], ...(parsed[account] || {}) };
    return holdings;
  }, {});
}

function loadPaycheckSplit() {
  const saved = localStorage.getItem("paycheck-split");
  if (!saved) {
    return defaultPaycheckSplit();
  }

  const split = JSON.parse(saved);
  const isPreviousDefault =
    split.firstAccount === "chase:checking" &&
    split.firstPercent === 60 &&
    split.secondAccount === "sofi:checking" &&
    split.secondPercent === 40;

  return isPreviousDefault ? defaultPaycheckSplit() : split;
}

function saveHoldings() {
  localStorage.setItem("account-holdings", JSON.stringify(state.holdings));
}

function saveMonthlyIncome(twoWeekPay) {
  localStorage.setItem("monthly-income", String(twoWeekPay * 2));
}

function savePaycheckSplit() {
  localStorage.setItem(
    "paycheck-split",
    JSON.stringify({
      firstAccount: firstSplitAccount.value,
      firstPercent: Number(firstSplitPercent.value) || 0,
      secondAccount: secondSplitAccount.value,
      secondPercent: Number(secondSplitPercent.value) || 0,
    }),
  );
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function accountTotal(account) {
  return Object.values(state.holdings[account]).reduce((sum, value) => sum + value, 0);
}

function cloneHoldings(holdings) {
  return JSON.parse(JSON.stringify(holdings));
}

function defaultPaycheckSplit() {
  return {
    firstAccount: "chase:checking",
    firstPercent: 60,
    secondAccount: "sofi:savings",
    secondPercent: 40,
  };
}

function splitDestination(value) {
  const [account, kind] = value.split(":");
  return { account, kind };
}

function splitLabel(value) {
  const { account, kind } = splitDestination(value);
  return BudgetSettings.accountLabel(account, kind);
}

function saveMoneyLog(entry) {
  const log = JSON.parse(localStorage.getItem("extra-money-log") || "[]");
  localStorage.setItem("extra-money-log", JSON.stringify([entry, ...log]));
}

function renderInputs() {
  form.querySelectorAll("input[data-account]").forEach((input) => {
    const account = input.dataset.account;
    const kind = input.dataset.kind;
    input.value = state.holdings[account][kind] || "";
  });
}

function renderTotals() {
  const checking = Object.values(state.holdings).reduce((sum, account) => sum + (account.checking || 0), 0);
  const savings = Object.values(state.holdings).reduce((sum, account) => sum + (account.savings || 0), 0);
  const investments = state.holdings.robinhood.holding || 0;

  totalCash.textContent = money(checking + savings + investments);
  checkingTotal.textContent = money(checking);
  savingsTotal.textContent = money(savings);
  investmentTotal.textContent = money(investments);
  monthlyIncomeTotal.textContent = money(Number(localStorage.getItem("monthly-income")) || 0);

  Object.keys(defaultHoldings).forEach((account) => {
    const total = document.querySelector(`#${account}Total`);
    total.textContent = money(accountTotal(account));
  });
}

function fillAccountSelect(select, includeInvestment = false, selectedValue = select.value) {
  select.innerHTML = "";

  BudgetSettings.accountOptions(includeInvestment).forEach((option) => {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.label;
    select.appendChild(item);
  });

  select.value = selectedValue;
  if (!select.value) select.selectedIndex = 0;
}

function renderAccountOptions() {
  fillAccountSelect(firstSplitAccount);
  fillAccountSelect(secondSplitAccount);
  fillAccountSelect(extraMoneyAccount, true);
}

function renderPaycheckPreview() {
  const amount = Number(paycheckAmount.value) || 0;
  const firstRate = (Number(firstSplitPercent.value) || 0) / 100;
  const secondRate = (Number(secondSplitPercent.value) || 0) / 100;

  firstSplitLabel.textContent = splitLabel(firstSplitAccount.value);
  secondSplitLabel.textContent = splitLabel(secondSplitAccount.value);
  firstSplitAmount.textContent = money(amount * firstRate);
  secondSplitAmount.textContent = money(amount * secondRate);
}

function render() {
  BudgetSettings.applyBudgetSettingsToPage();
  renderAccountOptions();
  renderInputs();
  renderTotals();
  renderPaycheckPreview();
}

function renderPaycheckSplitInputs() {
  const split = loadPaycheckSplit();
  firstSplitAccount.value = split.firstAccount || "chase:checking";
  firstSplitPercent.value = split.firstPercent ?? split.chase ?? 60;
  secondSplitAccount.value = split.secondAccount || "sofi:savings";
  secondSplitPercent.value = split.secondPercent ?? split.sofi ?? 40;
}

form.addEventListener("input", (event) => {
  const input = event.target;
  if (!input.matches("input[data-account]")) return;

  const account = input.dataset.account;
  const kind = input.dataset.kind;
  state.holdings[account][kind] = Number(input.value) || 0;

  saveHoldings();
  renderTotals();
});

paycheckAmount.addEventListener("input", renderPaycheckPreview);

paycheckForm.addEventListener("input", (event) => {
  if (
    !event.target.matches(
      "#firstSplitAccount, #secondSplitAccount, #firstSplitPercent, #secondSplitPercent",
    )
  ) {
    return;
  }

  savePaycheckSplit();
  renderPaycheckPreview();
});

paycheckForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(paycheckAmount.value) || 0;
  const firstDestination = splitDestination(firstSplitAccount.value);
  const secondDestination = splitDestination(secondSplitAccount.value);

  state.holdings[firstDestination.account][firstDestination.kind] +=
    amount * ((Number(firstSplitPercent.value) || 0) / 100);
  state.holdings[secondDestination.account][secondDestination.kind] +=
    amount * ((Number(secondSplitPercent.value) || 0) / 100);

  savePaycheckSplit();
  saveMonthlyIncome(amount);
  saveHoldings();
  paycheckAmount.value = "";
  render();
});

extraMoneyForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(extraMoneyAmount.value) || 0;
  const destination = splitDestination(extraMoneyAccount.value);

  state.holdings[destination.account][destination.kind] += amount;
  saveHoldings();
  saveMoneyLog({
    id: crypto.randomUUID(),
    source: moneySource.value.trim(),
    destination: extraMoneyAccount.value,
    amount,
    date: new Date().toISOString().slice(0, 10),
  });

  extraMoneyForm.reset();
  render();
});

resetButton.addEventListener("click", () => {
  state.holdings = cloneHoldings(defaultHoldings);
  saveHoldings();
  render();
});

renderPaycheckSplitInputs();
renderAccountOptions();
render();
