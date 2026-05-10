const loginForm = document.querySelector("#loginForm");
const loginEmail = document.querySelector("#loginEmail");
const loginPassword = document.querySelector("#loginPassword");
const loginMessage = document.querySelector("#loginMessage");
const loginButton = document.querySelector("#loginButton");

function renderLoginMode() {
  loginButton.textContent = BudgetSettings.hasLogin() ? "Unlock" : "Create login";
  loginMessage.textContent = BudgetSettings.hasLogin()
    ? "Enter your saved email and password."
    : "Create your login with a valid email.";
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  const settings = BudgetSettings.loadBudgetSettings();

  if (!BudgetSettings.validEmail(email)) {
    loginMessage.textContent = "Please use a valid email address.";
    return;
  }

  if (!password) {
    loginMessage.textContent = "Please enter a password.";
    return;
  }

  if (!BudgetSettings.hasLogin()) {
    BudgetSettings.saveBudgetSettings({
      auth: {
        email,
        password,
      },
    });
    BudgetSettings.setLoggedIn(true);
    window.location.href = "index.html";
    return;
  }

  if (email === settings.auth.email && password === settings.auth.password) {
    BudgetSettings.setLoggedIn(true);
    window.location.href = "index.html";
    return;
  }

  loginMessage.textContent = "Email or password does not match.";
});

renderLoginMode();
