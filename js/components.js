import { colorForId } from "./data.js";
import { groupStats, periodKey } from "./store.js";
import { periodLabel, frequencyLabel } from "./periods.js";

export function icon(name, cls = "") {
  return `<span class="material-symbols-outlined icon ${cls}">${name}</span>`;
}

export function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export function avatar(name, id, size = "md") {
  const bg = colorForId(id || name);
  return `<span class="avatar avatar-${size}" style="background:${bg}">${initials(name)}</span>`;
}

export function currency(value) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(value);
}

export function formatDate(iso, opts = {}) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...opts });
}

export function daysAgo(iso) {
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export function telHref(phone) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export function mailHref(email, subject = "") {
  return subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
}

export function smsHref(phone, body = "") {
  const num = phone.replace(/\s+/g, "");
  return body ? `sms:${num}?&body=${encodeURIComponent(body)}` : `sms:${num}`;
}

export function statusChip(label, tone = "neutral") {
  return `<span class="chip chip-${tone}">${label}</span>`;
}

export function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 2400);
}

let sheetBackdrop = null;

export function openSheet(html, { onOpen } = {}) {
  closeSheet();
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `<div class="sheet" role="dialog">${html}</div>`;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeSheet();
  });
  document.body.appendChild(backdrop);
  sheetBackdrop = backdrop;
  requestAnimationFrame(() => backdrop.classList.add("show"));
  const closeEls = backdrop.querySelectorAll("[data-close-sheet]");
  closeEls.forEach((el) => el.addEventListener("click", closeSheet));
  if (onOpen) onOpen(backdrop);
  return backdrop;
}

export function closeSheet() {
  if (!sheetBackdrop) return;
  sheetBackdrop.classList.remove("show");
  const el = sheetBackdrop;
  setTimeout(() => el.remove(), 200);
  sheetBackdrop = null;
}

export function emptyState(iconName, title, subtitle) {
  return `
    <div class="empty-state">
      ${icon(iconName, "empty-icon")}
      <p class="empty-title">${title}</p>
      <p class="empty-subtitle">${subtitle}</p>
    </div>`;
}

export function groupCard(group) {
  const stats = groupStats(group);
  const pct = stats.total ? Math.round((stats.paidCount / stats.total) * 100) : 0;
  const freqShort = frequencyLabel(group).toLowerCase().replace("ly", "");
  return `
    <a class="card card-tappable group-card" href="#/groups/${group.id}">
      <div class="group-card-top">
        <div class="group-card-name"><span class="group-emoji">${group.emoji || "💷"}</span> ${group.name}</div>
        <div class="group-card-amount">${currency(group.amount)}<span class="group-card-freq">/${freqShort}</span></div>
      </div>
      <div class="group-card-sub">${periodLabel(group, periodKey(group))} &middot; ${stats.paidCount}/${stats.total} paid</div>
      <div class="job-progress"><div class="job-progress-bar" style="width:${pct}%"></div></div>
      ${stats.outstanding > 0 ? `<div class="group-card-owed">${icon("error")} ${currency(stats.outstanding)} outstanding</div>` : `<div class="group-card-owed paid-up">${icon("check_circle")} Everyone's paid up</div>`}
    </a>`;
}

export function quickActions(member, { compact = false } = {}) {
  const callLabel = compact ? "" : `<span>Call</span>`;
  const textLabel = compact ? "" : `<span>Text</span>`;
  const call = member.phone ? `<a class="quick-action call" href="${telHref(member.phone)}" aria-label="Call ${member.name}">${icon("call")}${callLabel}</a>` : "";
  const text = member.phone ? `<a class="quick-action sms" href="${smsHref(member.phone)}" aria-label="Text ${member.name}">${icon("sms")}${textLabel}</a>` : "";
  return `<div class="quick-actions" onclick="event.stopPropagation()">${call}${text}</div>`;
}
