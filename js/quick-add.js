import { allGroups, allMembers, getGroup, addGroup, addMember, addMemberToGroup, markPaid, periodKey } from "./store.js";
import { icon, toast, openSheet, closeSheet } from "./components.js";
import { FREQUENCIES, GROUP_EMOJI } from "./data.js";
import { periodLabel } from "./periods.js";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function openQuickAddSheet() {
  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">Add new</div>
    <div class="sheet-action-item" data-action="group" role="button">
      ${icon("groups")}
      <span>New group</span>
    </div>
    <div class="sheet-action-item" data-action="member" role="button">
      ${icon("person_add")}
      <span>New member</span>
    </div>
    <div class="sheet-action-item" data-action="payment" role="button">
      ${icon("payments")}
      <span>Record a payment</span>
    </div>
  `, {
    onOpen: (el) => {
      el.querySelectorAll("[data-action]").forEach((row) => {
        row.addEventListener("click", () => {
          const action = row.dataset.action;
          closeSheet();
          setTimeout(() => {
            if (action === "group") openGroupForm();
            if (action === "member") openMemberForm();
            if (action === "payment") openPaymentForm();
          }, 180);
        });
      });
    },
  });
}

function dueDayField(frequency, current) {
  if (frequency === "weekly") {
    return `
      <div class="field" id="due-day-field">
        <label>Due day</label>
        <select id="new-group-dueday">${WEEKDAYS.map((d, i) => `<option value="${i}" ${i === current ? "selected" : ""}>${d}</option>`).join("")}</select>
      </div>`;
  }
  return `
    <div class="field" id="due-day-field">
      <label>Due day of month</label>
      <input type="number" id="new-group-dueday" min="1" max="28" value="${current ?? 1}" />
    </div>`;
}

function openGroupForm() {
  let emoji = GROUP_EMOJI[0];
  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">New group</div>
    <div class="field">
      <label>Emoji</label>
      <div class="emoji-picker" id="new-group-emoji-picker">
        ${GROUP_EMOJI.map((e, i) => `<button type="button" class="emoji-opt ${i === 0 ? "active" : ""}" data-emoji="${e}">${e}</button>`).join("")}
      </div>
    </div>
    <div class="field">
      <label>Group name</label>
      <input type="text" id="new-group-name" placeholder="e.g. Wednesday 5-a-side" />
    </div>
    <div class="field">
      <label>Amount per period (&pound;)</label>
      <input type="number" id="new-group-amount" placeholder="10" min="0" step="0.5" />
    </div>
    <div class="field">
      <label>Frequency</label>
      <select id="new-group-freq">${FREQUENCIES.map((f) => `<option value="${f.id}">${f.label}</option>`).join("")}</select>
    </div>
    <div id="due-day-wrap">${dueDayField("monthly", 1)}</div>
    <div class="sheet-actions">
      <button class="btn btn-text" data-close-sheet style="flex:1">Cancel</button>
      <button class="btn btn-filled" id="new-group-save" style="flex:1">Create group</button>
    </div>
  `, {
    onOpen: (el) => {
      el.querySelectorAll("[data-emoji]").forEach((btn) => {
        btn.addEventListener("click", () => {
          emoji = btn.dataset.emoji;
          el.querySelectorAll("[data-emoji]").forEach((b) => b.classList.toggle("active", b === btn));
        });
      });
      const freqSelect = el.querySelector("#new-group-freq");
      freqSelect.addEventListener("change", () => {
        el.querySelector("#due-day-wrap").innerHTML = dueDayField(freqSelect.value, freqSelect.value === "weekly" ? 3 : 1);
      });
      el.querySelector("#new-group-save").addEventListener("click", () => {
        const name = el.querySelector("#new-group-name").value.trim();
        if (!name) return toast("Enter a group name.");
        const amount = Number(el.querySelector("#new-group-amount").value) || 0;
        const frequency = freqSelect.value;
        const dueDay = Number(el.querySelector("#new-group-dueday").value) || (frequency === "weekly" ? 0 : 1);
        const id = addGroup({ name, emoji, amount, frequency, dueDay });
        closeSheet();
        toast("Group created");
        location.hash = `#/groups/${id}`;
      });
    },
  });
}

function groupCheckboxes() {
  const groups = allGroups();
  if (!groups.length) return `<p style="font-size:13px;color:var(--on-surface-variant)">No groups yet — create one first if you'd like to add this person straight away.</p>`;
  return groups
    .map(
      (g) => `
    <label class="settings-row" style="padding:8px 0">
      <input type="checkbox" value="${g.id}" class="new-member-group-check" style="width:18px;height:18px" />
      <span class="settings-row-text" style="margin-left:6px">${g.emoji || "💷"} ${g.name}</span>
    </label>`
    )
    .join("");
}

function openMemberForm() {
  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">New member</div>
    <div class="field">
      <label>Name</label>
      <input type="text" id="new-member-name" placeholder="e.g. Jordan Reyes" />
    </div>
    <div class="field">
      <label>Phone</label>
      <input type="tel" id="new-member-phone" placeholder="+44 7700 900000" />
    </div>
    <div class="field">
      <label>Email</label>
      <input type="email" id="new-member-email" placeholder="name@example.com" />
    </div>
    <div class="field">
      <label>Add to group(s)</label>
      ${groupCheckboxes()}
    </div>
    <div class="sheet-actions">
      <button class="btn btn-text" data-close-sheet style="flex:1">Cancel</button>
      <button class="btn btn-filled" id="new-member-save" style="flex:1">Add member</button>
    </div>
  `, {
    onOpen: (el) => {
      el.querySelector("#new-member-save").addEventListener("click", () => {
        const name = el.querySelector("#new-member-name").value.trim();
        if (!name) return toast("Enter a name.");
        const phone = el.querySelector("#new-member-phone").value.trim();
        const email = el.querySelector("#new-member-email").value.trim();
        const id = addMember({ name, phone, email });
        el.querySelectorAll(".new-member-group-check:checked").forEach((cb) => addMemberToGroup(cb.value, id));
        closeSheet();
        toast("Member added");
        location.hash = `#/members/${id}`;
      });
    },
  });
}

function openPaymentForm() {
  const groups = allGroups();
  if (!groups.length) return toast("Create a group first.");

  function memberOptions(groupId) {
    const g = getGroup(groupId);
    return g.memberIds
      .map((mid) => allMembers().find((m) => m.id === mid))
      .filter(Boolean)
      .map((m) => `<option value="${m.id}">${m.name}</option>`)
      .join("");
  }

  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">Record a payment</div>
    <div class="field">
      <label>Group</label>
      <select id="pay-group">${groups.map((g) => `<option value="${g.id}">${g.emoji || "💷"} ${g.name}</option>`).join("")}</select>
    </div>
    <div class="field">
      <label>Member</label>
      <select id="pay-member">${memberOptions(groups[0].id)}</select>
    </div>
    <div class="field">
      <label>Period</label>
      <select id="pay-period"></select>
    </div>
    <div class="field">
      <label>Amount (&pound;)</label>
      <input type="number" id="pay-amount" min="0" step="0.5" value="${groups[0].amount}" />
    </div>
    <div class="sheet-actions">
      <button class="btn btn-text" data-close-sheet style="flex:1">Cancel</button>
      <button class="btn btn-filled" id="pay-save" style="flex:1">Save payment</button>
    </div>
  `, {
    onOpen: (el) => {
      const groupSelect = el.querySelector("#pay-group");
      const memberSelect = el.querySelector("#pay-member");
      const periodSelect = el.querySelector("#pay-period");
      const amountInput = el.querySelector("#pay-amount");

      function refreshPeriods() {
        const g = getGroup(groupSelect.value);
        const current = periodKey(g);
        periodSelect.innerHTML = `<option value="${current}">${periodLabel(g, current)} (current)</option>`;
        amountInput.value = g.amount;
      }

      groupSelect.addEventListener("change", () => {
        memberSelect.innerHTML = memberOptions(groupSelect.value);
        refreshPeriods();
      });
      refreshPeriods();

      el.querySelector("#pay-save").addEventListener("click", () => {
        if (!memberSelect.value) return toast("This group has no members yet.");
        const amount = Number(amountInput.value) || 0;
        markPaid(groupSelect.value, memberSelect.value, periodSelect.value, amount);
        closeSheet();
        toast("Payment recorded");
      });
    },
  });
}
