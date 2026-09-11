// Seed / mock data for the SubsPaid prototype. Everything here is fictional
// demo content used only to populate the app on first run.

import { periodKey, shiftPeriod } from "./periods.js";

export const AVATAR_COLORS = ["#1a73e8", "#188038", "#e37400", "#d93025", "#9334e6", "#00838f"];

export function colorForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export const FREQUENCIES = [
  { id: "monthly", label: "Monthly" },
  { id: "weekly", label: "Weekly" },
];

export const GROUP_EMOJI = ["⚽", "🏏", "🎳", "🃏", "🎯", "🏸", "🏉", "🎱", "🎮", "🍻", "🎤", "🏋️"];

export function seedData() {
  const members = [
    { id: "m1", name: "Callum Hayes", phone: "+44 7700 900111", email: "callum.hayes@example.com" },
    { id: "m2", name: "Priya Shah", phone: "+44 7700 900222", email: "priya.shah@example.com" },
    { id: "m3", name: "Jake Whitfield", phone: "+44 7700 900333", email: "jake.whitfield@example.com" },
    { id: "m4", name: "Sam O'Doherty", phone: "+44 7700 900444", email: "sam.odoherty@example.com" },
    { id: "m5", name: "Ella Marsh", phone: "+44 7700 900555", email: "ella.marsh@example.com" },
    { id: "m6", name: "Tomasz Nowak", phone: "+44 7700 900666", email: "tomasz.nowak@example.com" },
    { id: "m7", name: "Aaliyah Grant", phone: "+44 7700 900777", email: "aaliyah.grant@example.com" },
    { id: "m8", name: "Ben Foxley", phone: "+44 7700 900888", email: "ben.foxley@example.com" },
    { id: "m9", name: "Ruth Callahan", phone: "+44 7700 900999", email: "ruth.callahan@example.com" },
  ];

  const football = { id: "g1", frequency: "monthly" };
  const thisMonth = periodKey(football);
  const lastMonth = shiftPeriod(football, thisMonth, -1);
  const twoMonthsAgo = shiftPeriod(football, thisMonth, -2);

  const quiz = { id: "g2", frequency: "weekly" };
  const thisWeek = periodKey(quiz);
  const lastWeek = shiftPeriod(quiz, thisWeek, -1);
  const twoWeeksAgo = shiftPeriod(quiz, thisWeek, -2);

  const groups = [
    {
      id: "g1",
      name: "Wednesday 5-a-side",
      emoji: "⚽",
      amount: 10,
      frequency: "monthly",
      dueDay: 1,
      memberIds: ["m1", "m2", "m3", "m4", "m5", "m6", "m7"],
      joinedPeriod: {
        m1: twoMonthsAgo,
        m2: twoMonthsAgo,
        m3: twoMonthsAgo,
        m4: twoMonthsAgo,
        m5: lastMonth,
        m6: twoMonthsAgo,
        m7: thisMonth,
      },
    },
    {
      id: "g2",
      name: "Sunday Pub Quiz Kitty",
      emoji: "🍻",
      amount: 2,
      frequency: "weekly",
      dueDay: 0,
      memberIds: ["m2", "m4", "m8", "m9"],
      joinedPeriod: {
        m2: twoWeeksAgo,
        m4: twoWeeksAgo,
        m8: twoWeeksAgo,
        m9: twoWeeksAgo,
      },
    },
  ];

  function pay(id, groupId, memberId, period, amount, daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return { id, groupId, memberId, period, amount, paidAt: d.toISOString() };
  }

  const payments = [
    // Callum — paid the last two months, hasn't paid this month yet
    pay("p1", "g1", "m1", twoMonthsAgo, 10, 58),
    pay("p2", "g1", "m1", lastMonth, 10, 28),
    // Priya — fully paid up
    pay("p3", "g1", "m2", twoMonthsAgo, 10, 55),
    pay("p4", "g1", "m2", lastMonth, 10, 26),
    pay("p5", "g1", "m2", thisMonth, 10, 3),
    // Jake — missed the last two months, owes for both
    pay("p6", "g1", "m3", twoMonthsAgo, 10, 59),
    // Sam — fully paid up
    pay("p7", "g1", "m4", twoMonthsAgo, 10, 54),
    pay("p8", "g1", "m4", lastMonth, 10, 25),
    pay("p9", "g1", "m4", thisMonth, 10, 2),
    // Ella — joined last month, paid then, owes this month
    pay("p10", "g1", "m5", lastMonth, 10, 24),
    // Tomasz — missed last month but is square for this month
    pay("p11", "g1", "m6", twoMonthsAgo, 10, 57),
    pay("p12", "g1", "m6", thisMonth, 10, 4),
    // Aaliyah — brand new this month, not paid yet
    // (no payments)

    // Quiz kitty
    // Priya — fully paid up
    pay("p13", "g2", "m2", twoWeeksAgo, 2, 15),
    pay("p14", "g2", "m2", lastWeek, 2, 8),
    pay("p15", "g2", "m2", thisWeek, 2, 1),
    // Sam — only paid the first week, owes the last two
    pay("p16", "g2", "m4", twoWeeksAgo, 2, 14),
    // Ben — fully paid up
    pay("p17", "g2", "m8", twoWeeksAgo, 2, 15),
    pay("p18", "g2", "m8", lastWeek, 2, 7),
    pay("p19", "g2", "m8", thisWeek, 2, 1),
    // Ruth — hasn't paid in three weeks
    // (no payments)
  ];

  const settings = {
    organiserName: "Nick Williams",
    theme: "system",
    reminderTemplate: "Hi {name}, just a friendly reminder — your {group} subs of £{amount} are due. Thanks! 🙂",
  };

  return { members, groups, payments, settings };
}
