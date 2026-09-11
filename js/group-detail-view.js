import {
  getState, getGroup, getMember, allMembers, addMember, deleteGroup, updateGroup,
  hasPaid, paymentFor, markPaid, markUnpaid, memberOwedTotal, owedPeriodsForMember,
  groupStats, addMemberToGroup, removeMemberFromGroup, periodKey, shiftPeriod,
} from "./store.js";
import { icon, avatar, currency, toast, openSheet, closeSheet, emptyState, telHref, smsHref } from "./components.js";
import { periodLabel, dueDescription, frequencyLabel } from "./periods.js";
import { FREQUENCIES, GROUP_EMOJI } from "./data.js";

export const meta = { title: "Group" };

let viewPeriod = null;

function memberSubtitle(group, memberId) {
  const owed = memberOwedTotal(group, memberId);
  const periods = owedPeriodsForMember(group, memberId).length;
  if (owed <= 0) return `<span class="member-row-sub clear">${icon("check_circle", "sub-icon")} Paid up</span>`;
  return `<span class="member-row-sub owed">${icon("error", "sub-icon")} Owes ${currency(owed)} &middot; ${periods} period${periods === 1 ? "" : "s"}</span>`;
}

function memberRowHtml(group, memberId, period) {
  const m = getMember(memberId);
  if (!m) return "";
  const paid = hasPaid(group.id, memberId, period);
  return `
    <div class="member-row" data-member-row="${m.id}">
      <div class="member-row-tap" data-open-member="${m.id}">
        ${avatar(m.name, m.id, "md")}
        <div class="member-row-body">
          <div class="member-row-name">${m.name}</div>
          ${memberSubtitle(group, m.id)}
        </div>
      </div>
      <button class="paid-pill ${paid ? "paid" : "unpaid"}" data-toggle-paid="${m.id}">
        ${paid ? icon("check") + " Paid" : "Mark paid"}
      </button>
    </div>`;
}

function openEditGroupSheet(group) {
  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">Edit group</div>
    <div class="field">
      <label>Emoji</label>
      <div class="emoji-picker" id="edit-emoji-picker">
        ${GROUP_EMOJI.map((e) => `<button type="button" class="emoji-opt ${e === group.emoji ? "active" : ""}" data-emoji="${e}">${e}</button>`).join("")}
      </div>
    </div>
    <div class="field">
      <label>Group name</label>
      <input type="text" id="edit-group-name" value="${group.name}" />
    </div>
    <div class="field">
      <label>Amount per period (&pound;)</label>
      <input type="number" id="edit-group-amount" value="${group.amount}" min="0" step="0.5" />
    </div>
    <div class="field">
      <label>Frequency</label>
      <select id="edit-group-freq">${FREQUENCIES.map((f) => `<option value="${f.id}" ${f.id === group.frequency ? "selected" : ""}>${f.label}</option>`).join("")}</select>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-outlined btn-danger" id="edit-group-delete">${icon("delete")}</button>
      <button class="btn btn-filled" id="edit-group-save" style="flex:1">Save changes</button>
    </div>
  `, {
    onOpen: (el) => {
      let emoji = group.emoji;
      el.querySelectorAll("[data-emoji]").forEach((btn) => {
        btn.addEventListener("click", () => {
          emoji = btn.dataset.emoji;
          el.querySelectorAll("[data-emoji]").forEach((b) => b.classList.toggle("active", b === btn));
        });
      });
      el.querySelector("#edit-group-save").addEventListener("click", () => {
        const name = el.querySelector("#edit-group-name").value.trim();
        if (!name) return toast("Enter a group name.");
        const amount = Number(el.querySelector("#edit-group-amount").value) || 0;
        const frequency = el.querySelector("#edit-group-freq").value;
        updateGroup(group.id, { name, amount, frequency, emoji });
        closeSheet();
        toast("Group updated");
      });
      el.querySelector("#edit-group-delete").addEventListener("click", () => {
        if (confirm(`Delete "${group.name}"? All its payment records will be removed too.`)) {
          deleteGroup(group.id);
          closeSheet();
          location.hash = "#/groups";
        }
      });
    },
  });
}

function openAddMemberSheet(group) {
  const available = allMembers().filter((m) => !group.memberIds.includes(m.id));
  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">Add member to ${group.name}</div>
    ${
      available.length
        ? `<div class="field">
            <label>Existing member</label>
            <select id="add-existing-member">
              <option value="">Select a member&hellip;</option>
              ${available.map((m) => `<option value="${m.id}">${m.name}</option>`).join("")}
            </select>
          </div>
          <button class="btn btn-tonal btn-block" id="add-existing-btn" style="margin-bottom:20px">Add to group</button>
          <div class="section-title" style="margin-top:0">Or add someone new</div>`
        : ""
    }
    <div class="field">
      <label>Name</label>
      <input type="text" id="new-member-name" placeholder="e.g. Jordan Reyes" />
    </div>
    <div class="field">
      <label>Phone</label>
      <input type="tel" id="new-member-phone" placeholder="+44 7700 900000" />
    </div>
    <div class="sheet-actions">
      <button class="btn btn-text" data-close-sheet style="flex:1">Cancel</button>
      <button class="btn btn-filled" id="new-member-save" style="flex:1">Add new member</button>
    </div>
  `, {
    onOpen: (el) => {
      const existingBtn = el.querySelector("#add-existing-btn");
      if (existingBtn) {
        existingBtn.addEventListener("click", () => {
          const id = el.querySelector("#add-existing-member").value;
          if (!id) return toast("Select a member first.");
          addMemberToGroup(group.id, id);
          closeSheet();
          toast("Member added");
        });
      }
      el.querySelector("#new-member-save").addEventListener("click", () => {
        const name = el.querySelector("#new-member-name").value.trim();
        if (!name) return toast("Enter a name.");
        const phone = el.querySelector("#new-member-phone").value.trim();
        const id = addMember({ name, phone });
        addMemberToGroup(group.id, id);
        closeSheet();
        toast("Member added");
      });
    },
  });
}

function openMemberSheet(group, memberId) {
  const m = getMember(memberId);
  if (!m) return;
  const owedPeriods = owedPeriodsForMember(group, memberId);
  const template = getState().settings.reminderTemplate;

  function historyRow(period) {
    const paid = hasPaid(group.id, memberId, period);
    const payment = paymentFor(group.id, memberId, period);
    return `
      <div class="period-row">
        <div class="period-row-label">${periodLabel(group, period)}</div>
        ${
          paid
            ? `<span class="chip chip-green">${icon("check", "chip-icon")} Paid ${payment ? currency(payment.amount) : ""}</span>`
            : `<button class="btn btn-tonal btn-sm" data-mark="${period}">Mark paid</button>`
        }
      </div>`;
  }

  const periods = [];
  let cur = group.joinedPeriod[memberId] || periodKey(group);
  const today = periodKey(group);
  let guard = 0;
  while (cur <= today && guard++ < 24) {
    periods.unshift(cur);
    cur = shiftPeriod(group, cur, 1);
  }
  const recent = periods.slice(0, 6);

  openSheet(`
    <div class="sheet-handle"></div>
    <div class="detail-header" style="padding-top:0">
      ${avatar(m.name, m.id, "lg")}
      <div class="detail-name">${m.name}</div>
      <div class="detail-sub">${m.phone || "No phone number"}</div>
      <div class="detail-actions">
        ${m.phone ? `<a class="detail-action" href="${telHref(m.phone)}"><span class="icon-circle-btn call">${icon("call")}</span>Call</a>` : ""}
        ${m.phone ? `<a class="detail-action" href="${smsHref(m.phone)}"><span class="icon-circle-btn sms">${icon("sms")}</span>Text</a>` : ""}
        ${m.phone && owedPeriods.length ? `<a class="detail-action" id="send-reminder" href="#"><span class="icon-circle-btn map">${icon("notifications")}</span>Remind</a>` : ""}
      </div>
    </div>
    <div class="section-title" style="margin-top:8px">Recent periods</div>
    <div id="period-history">${recent.map(historyRow).join("")}</div>
    <button class="btn btn-text" id="remove-from-group" style="margin-top:16px;color:var(--error)">${icon("person_remove")} Remove from group</button>
  `, {
    onOpen: (el) => {
      el.querySelectorAll("[data-mark]").forEach((btn) => {
        btn.addEventListener("click", () => {
          markPaid(group.id, memberId, btn.dataset.mark, group.amount);
          closeSheet();
          toast("Marked as paid");
        });
      });
      const remindBtn = el.querySelector("#send-reminder");
      if (remindBtn) {
        remindBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const msg = (template || "Hi {name}, your {group} subs of £{amount} are due. Thanks!")
            .replace("{name}", m.name.split(" ")[0])
            .replace("{group}", group.name)
            .replace("{amount}", (owedPeriods.length * group.amount).toFixed(2));
          window.location.href = smsHref(m.phone, msg);
        });
      }
      el.querySelector("#remove-from-group").addEventListener("click", () => {
        if (confirm(`Remove ${m.name} from ${group.name}? Their payment history for this group will be cleared.`)) {
          removeMemberFromGroup(group.id, memberId);
          closeSheet();
          toast("Removed from group");
        }
      });
    },
  });
}

export function render(container, groupId) {
  const group = getGroup(groupId);
  if (!group) {
    container.innerHTML = emptyState("error", "Group not found", "It may have been deleted.");
    return;
  }
  if (!viewPeriod || viewPeriod.groupId !== groupId) {
    viewPeriod = { groupId, key: periodKey(group) };
  }

  function draw() {
    const period = viewPeriod.key;
    const stats = groupStats(group, period);
    const members = group.memberIds.slice().sort((a, b) => getMember(a).name.localeCompare(getMember(b).name));

    container.innerHTML = `
      <div class="group-detail-header">
        <div class="group-detail-title"><span class="group-emoji-lg">${group.emoji || "💷"}</span>
          <div>
            <div class="detail-name" style="font-size:20px">${group.name}</div>
            <div class="detail-sub">${currency(group.amount)} &middot; ${frequencyLabel(group)} &middot; ${dueDescription(group)}</div>
          </div>
        </div>
        <button class="topbar-icon-btn" id="edit-group-btn" aria-label="Edit group">${icon("edit")}</button>
      </div>

      <div class="period-switcher">
        <button class="icon-circle-btn" id="period-prev" aria-label="Previous period">${icon("chevron_left")}</button>
        <div class="period-switcher-label">${periodLabel(group, period)}</div>
        <button class="icon-circle-btn" id="period-next" aria-label="Next period">${icon("chevron_right")}</button>
      </div>
      <div class="period-summary">${stats.paidCount}/${stats.total} paid &middot; ${currency(stats.collected)} collected this period</div>

      <div class="section-row">
        <div class="section-title" style="margin:16px 0 10px">Members</div>
        <button class="btn btn-text" id="add-member-btn" style="font-size:13px">${icon("person_add")} Add</button>
      </div>
      <div id="members-list"></div>
    `;

    const list = container.querySelector("#members-list");
    list.innerHTML = members.length
      ? members.map((mid) => memberRowHtml(group, mid, period)).join("")
      : emptyState("group_add", "No members yet", "Add players or friends to start tracking their subs.");

    container.querySelector("#period-prev").addEventListener("click", () => {
      viewPeriod.key = shiftPeriod(group, viewPeriod.key, -1);
      draw();
    });
    container.querySelector("#period-next").addEventListener("click", () => {
      viewPeriod.key = shiftPeriod(group, viewPeriod.key, 1);
      draw();
    });
    container.querySelector("#edit-group-btn").addEventListener("click", () => openEditGroupSheet(group));
    container.querySelector("#add-member-btn").addEventListener("click", () => openAddMemberSheet(group));

    list.querySelectorAll("[data-toggle-paid]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const memberId = btn.dataset.togglePaid;
        if (hasPaid(group.id, memberId, period)) {
          markUnpaid(group.id, memberId, period);
          toast("Marked as unpaid");
        } else {
          markPaid(group.id, memberId, period, group.amount);
          toast("Marked as paid");
        }
      });
    });

    list.querySelectorAll("[data-open-member]").forEach((row) => {
      row.addEventListener("click", () => openMemberSheet(group, row.dataset.openMember));
    });
  }

  draw();
}
