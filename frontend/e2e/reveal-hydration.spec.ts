import { test, expect } from "@playwright/test";

test("Reveal hydrates with normal and reduced motion", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|server rendered/i.test(message.text())
    )
      errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".reveal").first()).toHaveCSS("opacity", "1");
  expect(errors).toEqual([]);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".reveal").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".reveal").first()).toHaveCSS("transform", "none");
  expect(errors).toEqual([]);
});
