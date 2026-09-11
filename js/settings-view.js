import { getState, update, resetDemoData } from "./store.js";
import { icon, toast } from "./components.js";
import { APP_VERSION } from "./version.js";

export const meta = { title: "Settings" };

export function render(container) {
  const { settings } = getState();

  container.innerHTML = `
    <div class="section-title" style="margin-top:0">Your profile</div>
    <div class="card">
      <div class="field" style="margin-bottom:0">
        <label>Your name</label>
        <input type="text" id="settings-name" value="${settings.organiserName}" />
      </div>
    </div>

    <div class="section-title">Payment reminders</div>
    <div class="card">
      <div class="field" style="margin-bottom:0">
        <label>Text message template</label>
        <textarea id="settings-template" rows="3">${settings.reminderTemplate}</textarea>
      </div>
      <p style="font-size:12px;color:var(--on-surface-variant);margin-top:8px">
        Use <code>{name}</code>, <code>{group}</code> and <code>{amount}</code> — they're filled in automatically when you tap "Remind" on someone who owes.
      </p>
    </div>

    <div class="section-title">Appearance</div>
    <div class="card">
      <div class="settings-row" style="border:none;padding-top:4px">
        <div class="settings-row-text">
          <div class="settings-row-title">Theme</div>
        </div>
      </div>
      <div class="segmented">
        <button data-theme="system" class="${settings.theme === "system" ? "active" : ""}">System</button>
        <button data-theme="light" class="${settings.theme === "light" ? "active" : ""}">Light</button>
        <button data-theme="dark" class="${settings.theme === "dark" ? "active" : ""}">Dark</button>
      </div>
    </div>

    <div class="section-title">Data</div>
    <div class="card">
      <button class="btn btn-outlined btn-danger btn-block" id="reset-demo">${icon("restart_alt")} Reset demo data</button>
    </div>

    <p class="version-tag">SubsPaid v${APP_VERSION}</p>
    <footer class="app-footer">subspaid.com</footer>
  `;

  const nameInput = container.querySelector("#settings-name");
  nameInput.addEventListener("blur", () => {
    update((s) => (s.settings.organiserName = nameInput.value.trim() || s.settings.organiserName));
    toast("Profile updated");
  });

  const templateInput = container.querySelector("#settings-template");
  templateInput.addEventListener("blur", () => {
    update((s) => (s.settings.reminderTemplate = templateInput.value.trim() || s.settings.reminderTemplate));
    toast("Reminder template updated");
  });

  container.querySelectorAll("[data-theme]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => (s.settings.theme = btn.dataset.theme));
    });
  });

  container.querySelector("#reset-demo").addEventListener("click", () => {
    if (confirm("Reset all data back to the original demo content? This can't be undone.")) {
      resetDemoData();
      toast("Demo data reset");
    }
  });
}
