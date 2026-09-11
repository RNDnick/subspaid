import {
  getMember, groupsForMember, getGroup, hasPaid, memberOwedTotal, owedPeriodsForMember,
  allPaymentsForMember, updateMember, deleteMember, periodKey,
} from "./store.js";
import { icon, avatar, currency, formatDate, toast, openSheet, closeSheet, emptyState, telHref, mailHref, smsHref } from "./components.js";
import { periodLabel } from "./periods.js";

export const meta = { title: "Member" };

function groupMiniCard(member, group) {
  const period = periodKey(group);
  const paid = hasPaid(group.id, member.id, period);
  const owed = memberOwedTotal(group, member.id);
  return `
    <a class="card card-tappable" href="#/groups/${group.id}" style="display:flex;align-items:center;gap:12px">
      <span class="group-emoji">${group.emoji || "💷"}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:14.5px;font-weight:500">${group.name}</div>
        <div style="font-size:12.5px;color:var(--on-surface-variant);margin-top:1px">
          ${owed > 0 ? `Owes ${currency(owed)}` : "Paid up"} &middot; ${periodLabel(group, period)}
        </div>
      </div>
      ${paid ? `<span class="chip chip-green">${icon("check", "chip-icon")} Paid</span>` : `<span class="chip chip-amber">Unpaid</span>`}
    </a>`;
}

function openEditMemberSheet(member) {
  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">Edit member</div>
    <div class="field">
      <label>Name</label>
      <input type="text" id="edit-member-name" value="${member.name}" />
    </div>
    <div class="field">
      <label>Phone</label>
      <input type="tel" id="edit-member-phone" value="${member.phone || ""}" />
    </div>
    <div class="field">
      <label>Email</label>
      <input type="email" id="edit-member-email" value="${member.email || ""}" />
    </div>
    <div class="sheet-actions">
      <button class="btn btn-outlined btn-danger" id="edit-member-delete">${icon("delete")}</button>
      <button class="btn btn-filled" id="edit-member-save" style="flex:1">Save changes</button>
    </div>
  `, {
    onOpen: (el) => {
      el.querySelector("#edit-member-save").addEventListener("click", () => {
        const name = el.querySelector("#edit-member-name").value.trim();
        if (!name) return toast("Enter a name.");
        const phone = el.querySelector("#edit-member-phone").value.trim();
        const email = el.querySelector("#edit-member-email").value.trim();
        updateMember(member.id, { name, phone, email });
        closeSheet();
        toast("Member updated");
      });
      el.querySelector("#edit-member-delete").addEventListener("click", () => {
        if (confirm(`Remove ${member.name} completely, including from every group and their payment history?`)) {
          deleteMember(member.id);
          closeSheet();
          location.hash = "#/members";
        }
      });
    },
  });
}

export function render(container, memberId) {
  const member = getMember(memberId);
  if (!member) {
    container.innerHTML = emptyState("error", "Member not found", "They may have been removed.");
    return;
  }
  const groups = groupsForMember(memberId);
  const totalOwed = groups.reduce((sum, g) => sum + memberOwedTotal(g, memberId), 0);
  const history = allPaymentsForMember(memberId);

  container.innerHTML = `
    <div class="detail-header">
      ${avatar(member.name, member.id, "lg")}
      <div class="detail-name">${member.name}</div>
      <div class="detail-sub">${totalOwed > 0 ? `Owes ${currency(totalOwed)} across ${groups.length} group${groups.length === 1 ? "" : "s"}` : "All paid up"}</div>
      <div class="detail-actions">
        ${member.phone ? `<a class="detail-action" href="${telHref(member.phone)}"><span class="icon-circle-btn call">${icon("call")}</span>Call</a>` : ""}
        ${member.phone ? `<a class="detail-action" href="${smsHref(member.phone)}"><span class="icon-circle-btn sms">${icon("sms")}</span>Text</a>` : ""}
        ${member.email ? `<a class="detail-action" href="${mailHref(member.email)}"><span class="icon-circle-btn mail">${icon("mail")}</span>Email</a>` : ""}
        <button class="detail-action" id="edit-member-btn" style="border:none;background:none"><span class="icon-circle-btn">${icon("edit")}</span>Edit</button>
      </div>
    </div>

    <div class="section-title" style="margin-top:8px">Groups</div>
    <div id="member-groups"></div>

    <div class="section-title">Payment history</div>
    <div class="card" id="member-history"></div>
  `;

  container.querySelector("#member-groups").innerHTML = groups.length
    ? groups.map((g) => groupMiniCard(member, g)).join("")
    : emptyState("groups", "Not in any group yet", "Add them to a group from the group's page.");

  container.querySelector("#member-history").innerHTML = history.length
    ? history
        .map((p) => {
          const g = getGroup(p.groupId);
          return `
          <div class="appt-row" style="padding:10px 0">
            <div class="appt-body">
              <div class="appt-title">${g ? g.name : "Unknown group"} &middot; ${g ? periodLabel(g, p.period) : p.period}</div>
              <div class="appt-meta">${formatDate(p.paidAt)}</div>
            </div>
            <div style="font-weight:500">${currency(p.amount)}</div>
          </div>`;
        })
        .join("")
    : `<p style="font-size:13px;color:var(--on-surface-variant)">No payments recorded yet.</p>`;

  container.querySelector("#edit-member-btn").addEventListener("click", () => openEditMemberSheet(member));
}
