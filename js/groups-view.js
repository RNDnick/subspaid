import { allGroups } from "./store.js";
import { icon, groupCard, emptyState } from "./components.js";

export const meta = { title: "Groups" };

export function render(container) {
  const groups = allGroups();
  container.innerHTML = `
    <div style="max-width:640px">
      <div class="search-bar">
        ${icon("search")}
        <input type="search" id="group-search" placeholder="Search groups" />
      </div>
      <div id="groups-list"></div>
    </div>
  `;

  const list = container.querySelector("#groups-list");
  function renderList(query) {
    const q = (query || "").trim().toLowerCase();
    const filtered = groups.filter((g) => !q || g.name.toLowerCase().includes(q));
    list.innerHTML = filtered.length
      ? filtered.map(groupCard).join("")
      : emptyState("groups", "No groups found", "Try a different search, or add one with the + button.");
  }
  renderList("");

  container.querySelector("#group-search").addEventListener("input", (e) => renderList(e.target.value));
}
