import { allMembers, groupsForMember, memberOwedTotal } from "./store.js";
import { icon, avatar, currency, quickActions, emptyState } from "./components.js";

export const meta = { title: "Members" };

function totalOwed(member) {
  return groupsForMember(member.id).reduce((sum, g) => sum + memberOwedTotal(g, member.id), 0);
}

function subtitle(member) {
  const groups = groupsForMember(member.id);
  if (!groups.length) return "Not in any group yet";
  const owed = totalOwed(member);
  const groupNames = groups.map((g) => g.name).join(", ");
  return owed > 0 ? `Owes ${currency(owed)} &middot; ${groupNames}` : groupNames;
}

function rowHtml(member) {
  return `
    <a class="contact-row" href="#/members/${member.id}">
      ${avatar(member.name, member.id, "md")}
      <div class="contact-row-body">
        <div class="contact-row-name">${member.name}</div>
        <div class="contact-row-sub">${subtitle(member)}</div>
      </div>
      ${quickActions(member, { compact: true })}
    </a>`;
}

export function render(container) {
  const members = allMembers();
  container.innerHTML = `
    <div style="max-width:640px">
      <div class="search-bar">
        ${icon("search")}
        <input type="search" id="member-search" placeholder="Search members" />
      </div>
      <div class="card" id="members-list" style="padding:0 16px"></div>
    </div>
  `;

  const list = container.querySelector("#members-list");
  function renderList(query) {
    const q = (query || "").trim().toLowerCase();
    const filtered = members.filter((m) => !q || m.name.toLowerCase().includes(q) || (m.phone || "").includes(q));
    list.innerHTML = filtered.length ? filtered.map(rowHtml).join("") : emptyState("person_search", "No members found", "Try a different search, or add one with the + button.");
  }
  renderList("");

  container.querySelector("#member-search").addEventListener("input", (e) => renderList(e.target.value));
}
