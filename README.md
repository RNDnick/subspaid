# SubsPaid

A mobile-first tool for anyone who organises a group and collects regular
subs — five-a-side football, a pub quiz kitty, a book club, a five-a-side
league. Add your group, add the people in it, and mark off who's paid each
week or month instead of chasing it all from memory or a scrap of paper.

This is a **static, front-end-only prototype**: everything runs in the
browser and data is stored in `localStorage`, so it resets if you clear site
data or open it on a different device/browser. There's no backend, no
accounts, and no real payment processing — see "What's mocked" below.

## Features

- **Groups** — set a name, emoji, amount, and whether it's collected weekly
  or monthly. Each group tracks its own billing period independently.
- **Period switcher** — step back and forward through past and current
  weeks/months on a group's page, with a running paid/unpaid count and total
  collected for whichever period you're looking at.
- **Members** — a searchable list of everyone across all your groups, each
  with one-tap **Call** and **Text** buttons that hand off to your phone's
  own dialer and messages app, plus their group memberships and full
  payment history.
- **Arrears tracking** — if someone misses a period, it carries forward
  automatically: their row shows how much they owe and across how many
  periods, right up until it's marked paid.
- **One-tap reminders** — a "Remind" button on anyone who owes builds a
  text message from a template you set in Settings (with their name, the
  group, and the amount filled in) and opens it straight in your messages
  app.
- **Record a payment** from the **+** button on any screen — pick the group,
  member, and period, and it's logged with a timestamp.
- **Settings** — your name, the reminder message template, light/dark/system
  theme, and a reset-to-demo-data button.

Design follows Material 3, styled to match Google's own apps (Gmail/Calendar
blue, Roboto, Material Symbols icons), with a bottom nav bar on mobile that
becomes a left nav rail past 900px wide.

## What's mocked

- **Payments** — "recording a payment" just logs that it happened in this
  browser's `localStorage`. There's no card processing, bank transfer, or
  real money movement of any kind.
- **Reminders** — the "Remind" button opens a pre-filled text message in
  your own messaging app for you to review and send; SubsPaid never sends
  anything on its own.
- **Data** — seeded with a couple of fictional demo groups and members on
  first load. No backend, no multi-device sync, no real authentication.

## Running it locally

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

Then open `http://localhost:8942`.

## Using it on your phone

This is plain HTML/CSS/JS with no build step, so it's hosted directly on
GitHub Pages at subspaid.com — open it on your phone and use "Add to Home
Screen" for an app-like icon.
