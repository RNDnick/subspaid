import { getState, allGroups, overallStats } from "./store.js";
import { icon, currency, groupCard, emptyState } from "./components.js";
import { APP_VERSION } from "./version.js";

export const meta = { title: "Home" };

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const TONE_VARS = {
  blue: ["--primary-container", "--on-primary-container"],
  amber: ["--warning-container", "--warning"],
  purple: ["--purple-container", "--purple"],
  green: ["--success-container", "--success"],
};

function statCard(iconName, tone, value, label) {
  const [bg, fg] = TONE_VARS[tone];
  return `
    <div class="stat-card">
      <div class="stat-icon" style="background:var(${bg});color:var(${fg})">${icon(iconName)}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
}

export function render(container) {
  const { settings, groups } = getState();
  const overall = overallStats();
  const sortedGroups = allGroups();

  container.innerHTML = `
    <div class="greeting">${greetingWord()}, ${settings.organiserName.split(" ")[0]}</div>
    <div class="greeting-sub">${groups.length} group${groups.length === 1 ? "" : "s"} &middot; keeping tabs on who's paid</div>

    <div class="stat-grid">
      ${statCard("payments", "green", currency(overall.collected), "Collected this period")}
      ${statCard("account_balance_wallet", "amber", currency(overall.outstanding), "Outstanding")}
      ${statCard("person_off", "blue", overall.owingMembers, "Members who owe")}
      ${statCard("groups", "purple", groups.length, "Groups")}
    </div>

    <div class="section-row">
      <div class="section-title">Your groups</div>
      <a class="btn-text" href="#/groups" style="font-size:13px">View all</a>
    </div>
    <div id="groups-list"></div>

    <p class="version-tag">SubsPaid v${APP_VERSION}</p>
    <footer class="app-footer">subspaid.com</footer>
  `;

  const list = container.querySelector("#groups-list");
  list.innerHTML = sortedGroups.length
    ? sortedGroups.map(groupCard).join("")
    : emptyState("groups", "No groups yet", "Add your first group with the + button — say, your Wednesday five-a-side.");
}
