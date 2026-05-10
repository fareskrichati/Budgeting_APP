const defaultState = {
  hourlyRateOne: 0,
  hourlyRateTwo: 0,
  withholdingRate: 15,
  periodStart: today(),
  hoursOne: Array.from({ length: 14 }, () => 0),
  hoursTwo: Array.from({ length: 14 }, () => 0),
};

const state = loadState();

const form = document.querySelector("#paycheckCalculatorForm");
const hourlyRateOne = document.querySelector("#hourlyRateOne");
const hourlyRateTwo = document.querySelector("#hourlyRateTwo");
const withholdingRate = document.querySelector("#withholdingRate");
const periodStart = document.querySelector("#periodStart");
const periodEnd = document.querySelector("#periodEnd");
const hoursGridOne = document.querySelector("#hoursGridOne");
const hoursGridTwo = document.querySelector("#hoursGridTwo");
const clearButton = document.querySelector("#clearPaycheck");
const totalHours = document.querySelector("#totalHours");
const rateOnePay = document.querySelector("#rateOnePay");
const rateTwoPay = document.querySelector("#rateTwoPay");
const grossPay = document.querySelector("#grossPay");
const withheldAmount = document.querySelector("#withheldAmount");
const takeHomePay = document.querySelector("#takeHomePay");

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function loadState() {
  const saved = localStorage.getItem("paycheck-calculator");
  if (!saved) return { ...defaultState };

  const parsed = JSON.parse(saved);
  return {
    ...defaultState,
    ...parsed,
    hourlyRateOne: parsed.hourlyRateOne ?? parsed.hourlyRate ?? 0,
    hourlyRateTwo: parsed.hourlyRateTwo ?? 0,
    hoursOne: parsed.hoursOne || parsed.hours || defaultState.hoursOne,
    hoursTwo: parsed.hoursTwo || defaultState.hoursTwo,
  };
}

function saveState() {
  localStorage.setItem("paycheck-calculator", JSON.stringify(state));
}

function formatInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatLabelDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function addDays(value, days) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return formatInputDate(date);
}

function renderSettings() {
  hourlyRateOne.value = state.hourlyRateOne || "";
  hourlyRateTwo.value = state.hourlyRateTwo || "";
  withholdingRate.value = state.withholdingRate;
  periodStart.value = state.periodStart;
  periodEnd.value = addDays(state.periodStart, 13);
}

function renderHoursGrid(grid, hours, rateName) {
  grid.innerHTML = "";

  hours.forEach((value, index) => {
    const date = addDays(state.periodStart, index);
    const label = document.createElement("label");
    label.className = "field hour-day";
    label.innerHTML = `
      <span>${formatLabelDate(date)}</span>
      <input data-rate="${rateName}" data-index="${index}" type="number" min="0" step="0.25" value="${value || ""}" placeholder="0" />
    `;
    grid.appendChild(label);
  });
}

function sumHours(hours) {
  return hours.reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function renderTotals() {
  const totalOne = sumHours(state.hoursOne);
  const totalTwo = sumHours(state.hoursTwo);
  const payOne = totalOne * state.hourlyRateOne;
  const payTwo = totalTwo * state.hourlyRateTwo;
  const gross = payOne + payTwo;
  const withheld = gross * ((Number(state.withholdingRate) || 0) / 100);

  totalHours.textContent = (totalOne + totalTwo).toFixed(2);
  rateOnePay.textContent = money(payOne);
  rateTwoPay.textContent = money(payTwo);
  grossPay.textContent = money(gross);
  withheldAmount.textContent = money(withheld);
  takeHomePay.textContent = money(gross - withheld);
}

function render() {
  renderSettings();
  renderHoursGrid(hoursGridOne, state.hoursOne, "one");
  renderHoursGrid(hoursGridTwo, state.hoursTwo, "two");
  renderTotals();
}

form.addEventListener("input", (event) => {
  if (event.target === hourlyRateOne) {
    state.hourlyRateOne = Number(hourlyRateOne.value) || 0;
  }

  if (event.target === hourlyRateTwo) {
    state.hourlyRateTwo = Number(hourlyRateTwo.value) || 0;
  }

  if (event.target === withholdingRate) {
    state.withholdingRate = Number(withholdingRate.value) || 0;
  }

  if (event.target === periodStart) {
    state.periodStart = periodStart.value || today();
  }

  saveState();
  render();
});

document.addEventListener("input", (event) => {
  if (!event.target.matches("input[data-rate][data-index]")) return;

  const hours = event.target.dataset.rate === "one" ? state.hoursOne : state.hoursTwo;
  hours[Number(event.target.dataset.index)] = Number(event.target.value) || 0;
  saveState();
  renderTotals();
});

clearButton.addEventListener("click", () => {
  state.hoursOne = Array.from({ length: 14 }, () => 0);
  state.hoursTwo = Array.from({ length: 14 }, () => 0);
  saveState();
  render();
});

render();
