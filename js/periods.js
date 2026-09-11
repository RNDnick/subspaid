// Period-key maths shared by seed data and the store. A "period" is one
// billing cycle for a group — a calendar month ("2026-09") for a monthly
// group, or the Monday of a week ("2026-09-07") for a weekly one. Keys sort
// correctly as plain strings, which is all the UI needs.

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Formats a Date as a local (not UTC) YYYY-MM-DD key — Date#toISOString
// converts to UTC first, which silently shifts the date by a day for any
// timezone ahead of UTC (e.g. British Summer Time).
function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function periodKey(group, date = new Date()) {
  const d = new Date(date);
  if (group.frequency === "weekly") {
    const day = (d.getDay() + 6) % 7; // 0 = Monday
    d.setDate(d.getDate() - day);
    return localDateKey(d);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftPeriod(group, key, delta) {
  if (group.frequency === "weekly") {
    const [y, m, day] = key.split("-").map(Number);
    const d = new Date(y, m - 1, day + delta * 7);
    return localDateKey(d);
  }
  let [y, m] = key.split("-").map(Number);
  m += delta;
  while (m < 1) { m += 12; y -= 1; }
  while (m > 12) { m -= 12; y += 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function periodLabel(group, key) {
  if (group.frequency === "weekly") {
    const start = new Date(`${key}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const opts = { day: "numeric", month: "short" };
    return `${start.toLocaleDateString("en-GB", opts)} – ${end.toLocaleDateString("en-GB", opts)}`;
  }
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function periodsBetween(group, fromKey, toKey) {
  const list = [];
  let cur = fromKey;
  let guard = 0;
  while (guard++ < 500) {
    list.push(cur);
    if (cur === toKey) break;
    cur = shiftPeriod(group, cur, 1);
  }
  return list;
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function dueDescription(group) {
  return group.frequency === "weekly" ? `Due every ${WEEKDAYS[group.dueDay]}` : `Due the ${ordinal(group.dueDay)} of the month`;
}

export function frequencyLabel(group) {
  return group.frequency === "weekly" ? "Weekly" : "Monthly";
}
