import { seedData } from "./data.js";
import { periodKey, shiftPeriod, periodsBetween } from "./periods.js";

const STORAGE_KEY = "subspaid.state.v1";

// Backfills fields added after a user's state was first saved, so older
// localStorage data doesn't break when the schema grows.
function migrate(state) {
  state.settings.reminderTemplate ||= "Hi {name}, just a friendly reminder — your {group} subs of £{amount} are due. Thanks! 🙂";
  state.groups.forEach((g) => (g.joinedPeriod ||= {}));
  return state;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn("Failed to load state, reseeding.", e);
  }
  const fresh = seedData();
  save(fresh);
  return fresh;
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save state.", e);
  }
}

let state = load();
const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function update(mutator) {
  mutator(state);
  save(state);
  listeners.forEach((fn) => fn(state));
}

export function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function resetDemoData() {
  state = seedData();
  save(state);
  listeners.forEach((fn) => fn(state));
}

// --- Members ---

export function getMember(id) {
  return state.members.find((m) => m.id === id);
}

export function allMembers() {
  return state.members.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function groupsForMember(memberId) {
  return state.groups.filter((g) => g.memberIds.includes(memberId));
}

export function addMember({ name, phone, email }) {
  const id = uid("m");
  update((s) => s.members.push({ id, name, phone: phone || "", email: email || "" }));
  return id;
}

export function updateMember(id, fields) {
  update((s) => {
    const m = s.members.find((x) => x.id === id);
    if (m) Object.assign(m, fields);
  });
}

export function deleteMember(id) {
  update((s) => {
    s.members = s.members.filter((m) => m.id !== id);
    s.groups.forEach((g) => {
      g.memberIds = g.memberIds.filter((mid) => mid !== id);
      delete g.joinedPeriod[id];
    });
    s.payments = s.payments.filter((p) => p.memberId !== id);
  });
}

// --- Groups ---

export function getGroup(id) {
  return state.groups.find((g) => g.id === id);
}

export function allGroups() {
  return state.groups.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function addGroup({ name, emoji, amount, frequency, dueDay }) {
  const id = uid("g");
  update((s) => s.groups.push({ id, name, emoji, amount, frequency, dueDay, memberIds: [], joinedPeriod: {} }));
  return id;
}

export function updateGroup(id, fields) {
  update((s) => {
    const g = s.groups.find((x) => x.id === id);
    if (g) Object.assign(g, fields);
  });
}

export function deleteGroup(id) {
  update((s) => {
    s.groups = s.groups.filter((g) => g.id !== id);
    s.payments = s.payments.filter((p) => p.groupId !== id);
  });
}

export function addMemberToGroup(groupId, memberId, joinedPeriod) {
  update((s) => {
    const g = s.groups.find((x) => x.id === groupId);
    if (!g || g.memberIds.includes(memberId)) return;
    g.memberIds.push(memberId);
    g.joinedPeriod[memberId] = joinedPeriod || periodKey(g);
  });
}

export function removeMemberFromGroup(groupId, memberId) {
  update((s) => {
    const g = s.groups.find((x) => x.id === groupId);
    if (!g) return;
    g.memberIds = g.memberIds.filter((id) => id !== memberId);
    delete g.joinedPeriod[memberId];
    s.payments = s.payments.filter((p) => !(p.groupId === groupId && p.memberId === memberId));
  });
}

// --- Payments ---

export function paymentFor(groupId, memberId, period) {
  return state.payments.find((p) => p.groupId === groupId && p.memberId === memberId && p.period === period);
}

export function hasPaid(groupId, memberId, period) {
  return !!paymentFor(groupId, memberId, period);
}

export function paymentHistoryFor(groupId, memberId) {
  return state.payments
    .filter((p) => p.groupId === groupId && p.memberId === memberId)
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
}

export function allPaymentsForMember(memberId) {
  return state.payments
    .filter((p) => p.memberId === memberId)
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
}

export function markPaid(groupId, memberId, period, amount) {
  update((s) => {
    const existing = s.payments.find((p) => p.groupId === groupId && p.memberId === memberId && p.period === period);
    if (existing) {
      existing.amount = amount;
      existing.paidAt = new Date().toISOString();
    } else {
      s.payments.push({ id: uid("p"), groupId, memberId, period, amount, paidAt: new Date().toISOString() });
    }
  });
}

export function markUnpaid(groupId, memberId, period) {
  update((s) => {
    s.payments = s.payments.filter((p) => !(p.groupId === groupId && p.memberId === memberId && p.period === period));
  });
}

// --- Period-aware selectors ---

export { periodKey, shiftPeriod, periodsBetween };

export function owedPeriodsForMember(group, memberId, uptoKey = periodKey(group)) {
  const joined = group.joinedPeriod[memberId] || uptoKey;
  if (joined > uptoKey) return [];
  return periodsBetween(group, joined, uptoKey).filter((p) => !hasPaid(group.id, memberId, p));
}

export function memberOwedTotal(group, memberId) {
  return owedPeriodsForMember(group, memberId).length * group.amount;
}

export function groupStats(group, period = periodKey(group)) {
  const members = group.memberIds.map(getMember).filter(Boolean);
  const paidCount = members.filter((m) => hasPaid(group.id, m.id, period)).length;
  const collected = state.payments
    .filter((p) => p.groupId === group.id && p.period === period)
    .reduce((sum, p) => sum + p.amount, 0);
  const outstanding = members.reduce((sum, m) => sum + memberOwedTotal(group, m.id), 0);
  return { total: members.length, paidCount, collected, outstanding };
}

export function overallStats() {
  let collected = 0;
  let outstanding = 0;
  const owingMembers = new Set();
  state.groups.forEach((g) => {
    const stats = groupStats(g);
    collected += stats.collected;
    g.memberIds.forEach((mid) => {
      if (memberOwedTotal(g, mid) > 0) owingMembers.add(mid);
    });
  });
  state.groups.forEach((g) => {
    g.memberIds.forEach((mid) => {
      outstanding += memberOwedTotal(g, mid);
    });
  });
  return { collected, outstanding, owingMembers: owingMembers.size };
}
