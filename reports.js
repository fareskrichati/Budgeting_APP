const personalColor = "#1f7a6b";
const workColor = "#7d5ba6";

const viewDate = new Date();
viewDate.setDate(1);

const monthTotal = document.querySelector("#monthTotal");
const personalTotal = document.querySelector("#personalTotal");
const workTotal = document.querySelector("#workTotal");
const calendarTitle = document.querySelector("#calendarTitle");
const calendarGrid = document.querySelector("#calendarGrid");
const prevMonth = document.querySelector("#prevMonth");
const nextMonth = document.querySelector("#nextMonth");
const todayButton = document.querySelector("#todayButton");
const canvas = document.querySelector("#dailyChart");
const context = canvas.getContext("2d");

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function loadItems() {
  const personal = JSON.parse(localStorage.getItem("budget-statements") || "[]").map((item) => ({
    id: item.id,
    date: item.date || today(),
    description: item.description,
    category: normalizeCategory(item.category),
    amount: item.amount,
    source: "Personal",
  }));

  const personalHistory = JSON.parse(localStorage.getItem("spending-history") || "[]").map((item) => ({
    id: item.historyId || item.id,
    date: item.date || today(),
    description: item.description,
    category: normalizeCategory(item.category),
    amount: item.amount,
    source: "Personal",
  }));

  const work = JSON.parse(localStorage.getItem("work-expenses") || "[]").map((item) => ({
    id: item.id,
    date: item.date || today(),
    description: item.description,
    category: item.category,
    amount: item.amount,
    source: "Work",
  }));

  return [...personal, ...personalHistory, ...work].filter((item) => item.date && Number(item.amount) > 0);
}

function normalizeCategory(category) {
  if (category === "Health") return "Shopping";
  if (category === "Utilities") return "Robinhood";
  return category;
}

function displayCategory(category) {
  return category === "Robinhood" ? BudgetSettings.loadBudgetSettings().investmentName : category;
}

function monthBounds() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  return {
    year,
    month,
    first: new Date(year, month, 1),
    days: new Date(year, month + 1, 0).getDate(),
  };
}

function itemsForMonth() {
  const { year, month } = monthBounds();
  return loadItems().filter((item) => {
    const itemDate = new Date(`${item.date}T12:00:00`);
    return itemDate.getFullYear() === year && itemDate.getMonth() === month;
  });
}

function renderSummary(items) {
  const personal = items
    .filter((item) => item.source === "Personal")
    .reduce((sum, item) => sum + item.amount, 0);
  const work = items.filter((item) => item.source === "Work").reduce((sum, item) => sum + item.amount, 0);

  personalTotal.textContent = money(personal);
  workTotal.textContent = money(work);
  monthTotal.textContent = money(personal + work);
}

function renderCalendar(items) {
  const { year, month, first, days } = monthBounds();
  const firstDay = first.getDay();
  const cells = Math.ceil((firstDay + days) / 7) * 7;
  const byDate = groupByDate(items);

  calendarTitle.textContent = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(first);

  calendarGrid.innerHTML = "";

  for (let index = 0; index < cells; index += 1) {
    const dayNumber = index - firstDay + 1;
    const cellDate = new Date(year, month, dayNumber);
    const key = dateKey(cellDate);
    const dayItems = byDate[key] || [];
    const total = dayItems.reduce((sum, item) => sum + item.amount, 0);
    const day = document.createElement("div");
    day.className = "calendar-day";

    if (cellDate.getMonth() !== month) {
      day.classList.add("muted");
    }

    if (key === today()) {
      day.classList.add("today");
    }

    const header = document.createElement("div");
    header.className = "calendar-date";
    header.innerHTML = `<span>${cellDate.getDate()}</span><span class="calendar-total">${total ? money(total) : ""}</span>`;
    day.appendChild(header);

    dayItems.slice(0, 3).forEach((item) => {
      const entry = document.createElement("div");
      entry.className = `calendar-item ${item.source === "Work" ? "work" : "personal"}`;

      const label = document.createElement("span");
      label.textContent = `${item.source}: ${item.description} · ${displayCategory(item.category)}`;

      const amount = document.createElement("strong");
      amount.textContent = money(item.amount);

      entry.append(label, amount);
      day.appendChild(entry);
    });

    if (dayItems.length > 3) {
      const more = document.createElement("span");
      more.className = "calendar-total";
      more.textContent = `+${dayItems.length - 3} more`;
      day.appendChild(more);
    }

    calendarGrid.appendChild(day);
  }
}

function groupByDate(items) {
  return items.reduce((grouped, item) => {
    grouped[item.date] = grouped[item.date] || [];
    grouped[item.date].push(item);
    return grouped;
  }, {});
}

function dailyTotals(items) {
  const { days } = monthBounds();
  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    return items.reduce(
      (totals, item) => {
        const itemDay = new Date(`${item.date}T12:00:00`).getDate();
        if (itemDay !== day) return totals;

        if (item.source === "Work") {
          totals.work += item.amount;
        } else {
          totals.personal += item.amount;
        }

        return totals;
      },
      { day, personal: 0, work: 0 },
    );
  });
}

function drawGraph(items) {
  const data = dailyTotals(items);
  const padding = { top: 28, right: 22, bottom: 42, left: 58 };
  const plotWidth = canvas.width - padding.left - padding.right;
  const plotHeight = canvas.height - padding.top - padding.bottom;
  const maxValue = Math.max(...data.map((item) => item.personal + item.work), 1);
  const barSlot = plotWidth / data.length;
  const barWidth = Math.max(7, Math.min(22, barSlot * 0.52));

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#fbfcfd";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "#d9e0e8";
  context.lineWidth = 1;
  context.font = "12px system-ui, sans-serif";
  context.fillStyle = "#637083";

  for (let line = 0; line <= 4; line += 1) {
    const y = padding.top + (plotHeight / 4) * line;
    const value = maxValue - (maxValue / 4) * line;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(canvas.width - padding.right, y);
    context.stroke();
    context.fillText(money(value), 8, y + 4);
  }

  data.forEach((item, index) => {
    const x = padding.left + index * barSlot + (barSlot - barWidth) / 2;
    const personalHeight = (item.personal / maxValue) * plotHeight;
    const workHeight = (item.work / maxValue) * plotHeight;
    const baseY = padding.top + plotHeight;

    context.fillStyle = personalColor;
    context.fillRect(x, baseY - personalHeight, barWidth, personalHeight);

    context.fillStyle = workColor;
    context.fillRect(x, baseY - personalHeight - workHeight, barWidth, workHeight);

    if (item.day === 1 || item.day % 5 === 0 || item.day === data.length) {
      context.fillStyle = "#637083";
      context.textAlign = "center";
      context.fillText(String(item.day), x + barWidth / 2, canvas.height - 15);
      context.textAlign = "left";
    }
  });
}

function render() {
  const items = itemsForMonth();
  renderSummary(items);
  renderCalendar(items);
  drawGraph(items);
}

prevMonth.addEventListener("click", () => {
  viewDate.setMonth(viewDate.getMonth() - 1);
  render();
});

nextMonth.addEventListener("click", () => {
  viewDate.setMonth(viewDate.getMonth() + 1);
  render();
});

todayButton.addEventListener("click", () => {
  viewDate.setTime(new Date().getTime());
  viewDate.setDate(1);
  render();
});

render();
