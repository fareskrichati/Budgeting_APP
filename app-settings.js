const defaultBudgetSettings = {
  userName: "",
  bankNames: {
    chase: "Chase",
    sofi: "SoFi",
    mission: "Mission",
  },
  investmentName: "Robinhood",
  auth: {
    email: "",
    password: "",
  },
};

function loadBudgetSettings() {
  const saved = JSON.parse(localStorage.getItem("budget-settings") || "{}");
  return {
    ...defaultBudgetSettings,
    ...saved,
    bankNames: {
      ...defaultBudgetSettings.bankNames,
      ...(saved.bankNames || {}),
    },
    auth: {
      ...defaultBudgetSettings.auth,
      ...(saved.auth || {}),
    },
  };
}

function saveBudgetSettings(settings) {
  const current = loadBudgetSettings();
  localStorage.setItem(
    "budget-settings",
    JSON.stringify({
      ...current,
      ...settings,
      bankNames: {
        ...current.bankNames,
        ...(settings.bankNames || {}),
      },
      auth: {
        ...current.auth,
        ...(settings.auth || {}),
      },
    }),
  );
}

function loginPath() {
  return "login.html";
}

function hasLogin() {
  const auth = loadBudgetSettings().auth;
  return Boolean(auth.email && auth.password);
}

function isLoggedIn() {
  return localStorage.getItem("budget-authenticated") === "true";
}

function setLoggedIn(value) {
  localStorage.setItem("budget-authenticated", String(value));
}

function logout() {
  setLoggedIn(false);
  window.location.href = loginPath();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requireLogin() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  if (page === loginPath()) return;
  if (!isLoggedIn()) window.location.href = loginPath();
}

function budgetTitle() {
  const settings = loadBudgetSettings();
  const name = settings.userName.trim();
  return name ? `${name} Budgeting` : "Budget Desk";
}

function accountLabel(account, kind) {
  const settings = loadBudgetSettings();
  if (account === "robinhood") return settings.investmentName;
  return `${settings.bankNames[account]} ${kind}`;
}

function accountOptions(includeInvestment = false) {
  const settings = loadBudgetSettings();
  const options = Object.entries(settings.bankNames).flatMap(([account, label]) => [
    { value: `${account}:checking`, label: `${label} checking` },
    { value: `${account}:savings`, label: `${label} savings` },
  ]);

  if (includeInvestment) {
    options.push({ value: "robinhood:holding", label: settings.investmentName });
  }

  return options;
}

function plainAccountOptions(includeInvestment = false) {
  return accountOptions(includeInvestment).map((option) => option.label);
}

function applyBudgetSettingsToPage() {
  const settings = loadBudgetSettings();
  document.querySelectorAll("[data-budget-title]").forEach((element) => {
    element.textContent = budgetTitle();
  });

  if (document.title.includes("Budget") || document.querySelector("[data-budget-title]")) {
    document.title = budgetTitle();
  }

  document.querySelectorAll("[data-investment-label]").forEach((element) => {
    element.textContent = settings.investmentName;
  });

  document.querySelectorAll("[data-bank-label]").forEach((element) => {
    element.textContent = settings.bankNames[element.dataset.bankLabel];
  });

  document.querySelectorAll("[data-bank-credit-label]").forEach((element) => {
    const bank = settings.bankNames[element.dataset.bankCreditLabel];
    element.textContent = `${bank} Credit Card`;
  });
}

window.BudgetSettings = {
  accountLabel,
  accountOptions,
  applyBudgetSettingsToPage,
  budgetTitle,
  defaultBudgetSettings,
  loadBudgetSettings,
  logout,
  plainAccountOptions,
  requireLogin,
  saveBudgetSettings,
  setLoggedIn,
  hasLogin,
  isLoggedIn,
  validEmail,
};

requireLogin();
applyBudgetSettingsToPage();
