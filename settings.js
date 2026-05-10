const settingsForm = document.querySelector("#settingsForm");
const resetSettings = document.querySelector("#resetSettings");
const userNameInput = document.querySelector("#userNameInput");
const chaseNameInput = document.querySelector("#chaseNameInput");
const sofiNameInput = document.querySelector("#sofiNameInput");
const missionNameInput = document.querySelector("#missionNameInput");
const investmentNameInput = document.querySelector("#investmentNameInput");
const settingsMainBank = document.querySelector("#settingsMainBank");
const settingsInvesting = document.querySelector("#settingsInvesting");
const settingsName = document.querySelector("#settingsName");
const savedEmailInput = document.querySelector("#savedEmailInput");
const savedPasswordInput = document.querySelector("#savedPasswordInput");
const revealPasswordForm = document.querySelector("#revealPasswordForm");
const revealPasswordInput = document.querySelector("#revealPasswordInput");
const changePasswordForm = document.querySelector("#changePasswordForm");
const originalPasswordInput = document.querySelector("#originalPasswordInput");
const newPasswordInput = document.querySelector("#newPasswordInput");
const authMessage = document.querySelector("#authMessage");
const logoutButton = document.querySelector("#logoutButton");

function fillForm() {
  const settings = BudgetSettings.loadBudgetSettings();
  userNameInput.value = settings.userName;
  chaseNameInput.value = settings.bankNames.chase;
  sofiNameInput.value = settings.bankNames.sofi;
  missionNameInput.value = settings.bankNames.mission;
  investmentNameInput.value = settings.investmentName;
}

function renderSettingsSummary() {
  const settings = BudgetSettings.loadBudgetSettings();
  BudgetSettings.applyBudgetSettingsToPage();
  settingsMainBank.textContent = settings.bankNames.chase;
  settingsInvesting.textContent = settings.investmentName;
  settingsName.textContent = settings.userName.trim() || "You";
  savedEmailInput.value = settings.auth.email;
  savedPasswordInput.type = "password";
  savedPasswordInput.value = settings.auth.password;
}

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  BudgetSettings.saveBudgetSettings({
    userName: userNameInput.value.trim(),
    bankNames: {
      chase: chaseNameInput.value.trim() || "Chase",
      sofi: sofiNameInput.value.trim() || "SoFi",
      mission: missionNameInput.value.trim() || "Mission",
    },
    investmentName: investmentNameInput.value.trim() || "Robinhood",
  });

  fillForm();
  renderSettingsSummary();
});

resetSettings.addEventListener("click", () => {
  BudgetSettings.saveBudgetSettings({
    ...BudgetSettings.defaultBudgetSettings,
    auth: BudgetSettings.loadBudgetSettings().auth,
  });
  fillForm();
  renderSettingsSummary();
});

revealPasswordForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const settings = BudgetSettings.loadBudgetSettings();
  if (revealPasswordInput.value !== settings.auth.password) {
    authMessage.textContent = "Password does not match.";
    return;
  }

  savedPasswordInput.type = "text";
  authMessage.textContent = "Password revealed.";
  revealPasswordForm.reset();
});

changePasswordForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const settings = BudgetSettings.loadBudgetSettings();
  if (originalPasswordInput.value !== settings.auth.password) {
    authMessage.textContent = "Original password does not match.";
    return;
  }

  if (!newPasswordInput.value) {
    authMessage.textContent = "Enter a new password.";
    return;
  }

  BudgetSettings.saveBudgetSettings({
    auth: {
      email: settings.auth.email,
      password: newPasswordInput.value,
    },
  });

  changePasswordForm.reset();
  authMessage.textContent = "Password changed.";
  renderSettingsSummary();
});

logoutButton.addEventListener("click", () => {
  BudgetSettings.logout();
});

fillForm();
renderSettingsSummary();
