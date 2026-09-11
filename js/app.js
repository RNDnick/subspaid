import { getState, subscribe } from "./store.js";
import { icon } from "./components.js";
import { openQuickAddSheet } from "./quick-add.js";

import * as DashboardView from "./dashboard-view.js";
import * as GroupsView from "./groups-view.js";
import * as GroupDetailView from "./group-detail-view.js";
import * as MembersView from "./members-view.js";
import * as MemberDetailView from "./member-detail-view.js";
import * as SettingsView from "./settings-view.js";

const NAV_ITEMS = [
  { path: "#/", icon: "home", label: "Home" },
  { path: "#/groups", icon: "groups", label: "Groups" },
  { path: "#/members", icon: "person", label: "Members" },
];

const ROUTES = [
  { pattern: /^#\/$/, view: DashboardView, section: "#/" },
  { pattern: /^#\/groups$/, view: GroupsView, section: "#/groups" },
  { pattern: /^#\/groups\/([\w]+)$/, view: GroupDetailView, section: "#/groups" },
  { pattern: /^#\/members$/, view: MembersView, section: "#/members" },
  { pattern: /^#\/members\/([\w]+)$/, view: MemberDetailView, section: "#/members" },
  { pattern: /^#\/settings$/, view: SettingsView, section: "#/settings" },
];

const root = document.getElementById("app-root");

function applyTheme() {
  const { theme } = getState().settings;
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function shellHtml() {
  const { settings } = getState();
  const initial = (settings.organiserName || "S")[0].toUpperCase();
  return `
    <nav class="bottom-nav">
      <div class="nav-brand desktop-only">
        <div class="topbar-logo">${initial}</div>
        <div>
          <div class="nav-brand-title">SubsPaid</div>
          <div class="nav-brand-sub">${settings.organiserName}</div>
        </div>
      </div>
      ${NAV_ITEMS.map(
        (item) => `
        <a class="nav-item" data-path="${item.path}" href="${item.path}">
          ${icon(item.icon)}
          <span>${item.label}</span>
        </a>`
      ).join("")}
      <a class="nav-item desktop-only" data-path="#/settings" href="#/settings">
        ${icon("settings")}
        <span>Settings</span>
      </a>
    </nav>
    <div class="app-body">
      <header class="topbar">
        <span class="topbar-title" id="topbar-title">SubsPaid</span>
        <a class="topbar-icon-btn mobile-only" href="#/settings" aria-label="Settings">${icon("settings")}</a>
      </header>
      <main class="main-content" id="main-content"></main>
      <button class="fab" id="fab-btn" aria-label="Add new">${icon("add")}</button>
    </div>
  `;
}

function renderShellOnce() {
  root.innerHTML = shellHtml();
  document.getElementById("fab-btn").addEventListener("click", openQuickAddSheet);
}

function currentRoute() {
  const hash = location.hash || "#/";
  for (const route of ROUTES) {
    const match = hash.match(route.pattern);
    if (match) return { route, params: match.slice(1) };
  }
  return { route: ROUTES[0], params: [] };
}

function updateNavActive(section) {
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.path === section);
  });
}

function renderView() {
  const { route, params } = currentRoute();
  document.getElementById("topbar-title").textContent = route.view.meta.title;
  updateNavActive(route.section);
  const container = document.getElementById("main-content");
  container.innerHTML = "";
  route.view.render(container, ...params);
  window.scrollTo({ top: 0 });
}

function boot() {
  applyTheme();
  renderShellOnce();
  renderView();
  window.addEventListener("hashchange", renderView);
  subscribe(() => {
    applyTheme();
    renderView();
  });
}

boot();
