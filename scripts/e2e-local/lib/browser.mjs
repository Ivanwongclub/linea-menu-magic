// Browser-side helpers handed to scenarios.
export function helpers(page, base) {
  return {
    /** The cookie banner is a fixed z-[200] overlay on every route and intercepts clicks. */
    async dismissCookies() {
      const accept = page.getByRole("button", { name: /accept all/i });
      if (await accept.count()) await accept.first().click();
    },

    async login(editor) {
      await page.goto(`${base}/admin/login`, { waitUntil: "networkidle" });
      await this.dismissCookies();
      await page.fill("#email", editor.email);
      await page.fill("#password", editor.password);
      await page.click("button[type=submit]");
      await page.waitForURL(/\/admin\/products$/, { timeout: 20000 });
    },

    async openProduct(id) {
      await page.goto(`${base}/admin/products/${id}`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Identity" }).waitFor({ timeout: 20000 });
    },

    /** Waits for a sonner toast matching `re`, returns its text. */
    async waitForToast(re, timeout = 10000) {
      const toast = page.locator("[data-sonner-toast]", { hasText: re });
      await toast.first().waitFor({ timeout });
      return (await toast.first().innerText()).trim();
    },

    async toasts() {
      return page.locator("[data-sonner-toast]").allInnerTexts();
    },

    /**
     * Runs `action` and waits for a NEW toast matching `re` — one more than
     * were on screen before. Use this when the same message can already be
     * showing from a previous step (sonner keeps toasts ~4s).
     */
    async expectToast(re, action, timeout = 15000) {
      const src = re.source;
      const flags = re.flags;
      const countMatching = () =>
        page.evaluate(
          ([s, f]) => [...document.querySelectorAll("[data-sonner-toast]")].filter((el) => new RegExp(s, f).test(el.textContent || "")).length,
          [src, flags],
        );
      const before = await countMatching();
      await action();
      await page.waitForFunction(
        ([s, f, n]) => [...document.querySelectorAll("[data-sonner-toast]")].filter((el) => new RegExp(s, f).test(el.textContent || "")).length > n,
        [src, flags, before],
        { timeout },
      );
    },

    /** Radix Select: click the trigger, then the option. */
    async selectOption(triggerLocator, optionName) {
      await triggerLocator.click();
      await page.getByRole("option", { name: optionName }).click();
    },

    /**
     * Dialogs in the CMS close only on a successful write, so this is a more
     * reliable "the save landed" signal than a toast (sonner keeps toasts
     * for ~4s, so a wait can match the previous action's toast).
     */
    async waitForDialogClosed(timeout = 15000) {
      await page.getByRole("dialog").waitFor({ state: "detached", timeout });
    },

    /**
     * dnd-kit keyboard reorder: Space picks up, arrows move, Space drops.
     * Lets pending refetches settle first — dnd-kit cancels a drag if the
     * sortable item list changes underneath it.
     */
    async keyboardReorder(handleLocator, direction = "up", steps = 1) {
      // "up"/"down" for vertical lists, "left"/"right" for grids (dnd-kit
      // moves to the nearest item in the arrow's direction).
      const key = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" }[direction];
      await page.waitForLoadState("networkidle");
      await handleLocator.scrollIntoViewIfNeeded();
      await handleLocator.focus();
      await page.keyboard.press("Space");
      await page.waitForTimeout(250);
      for (let i = 0; i < steps; i++) {
        await page.keyboard.press(key);
        await page.waitForTimeout(250);
      }
      await page.keyboard.press("Space");
      await page.waitForTimeout(250);
    },
  };
}
