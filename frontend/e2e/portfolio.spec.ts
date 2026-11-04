import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage navigation and project details", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: /Xem dự án/ }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await page
    .getByRole("link", { name: /Xem chi tiết/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Coffee Shop Management System",
  );
  await expect(page.getByText("Dữ liệu mẫu").first()).toBeVisible();
});

test("filters and invalid slug", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("link", { name: "FastAPI" }).click();
  await expect(page).toHaveURL(/technology=FastAPI/);
  await expect(
    page.getByRole("heading", { name: "Coffee Shop Management System" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "VoiceMorph Studio" }),
  ).toHaveCount(0);
  const response = await page.goto("/projects/unknown-slug");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Về trang chủ" })).toBeVisible();
});

test("theme persists and the resume action stays absent", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Mở menu" }).click();
  await page.getByRole("button", { name: "Chế độ tối" }).first().click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.goto("/about");
  await expect(page.getByRole("link", { name: "Download CV" })).toHaveCount(0);
});

test("contact validation, provider acceptance and failure", async ({
  page,
}) => {
  await page.route("**/api/contact", async (route) => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: body.message === "Provider failure test" ? 502 : 202,
      contentType: "application/json",
      body:
        body.message === "Provider failure test"
          ? JSON.stringify({ error: "Provider error" })
          : JSON.stringify({ accepted: true }),
    });
  });
  await page.goto("/contact");
  const send = page.getByRole("button", { name: "Gửi lời nhắn" });
  await send.click();
  await expect(page.getByText(/Tên phải có/)).toBeVisible();
  await page.getByLabel("Tên *").fill("Ada");
  await page.getByLabel("Email *").fill("ada@example.com");
  await page.getByLabel("Lời nhắn *").fill("Hello from a browser test.");
  await send.click();
  await expect(page.getByRole("status")).toContainText("đã tiếp nhận");
  await page.getByLabel("Tên *").fill("Ada");
  await page.getByLabel("Email *").fill("ada@example.com");
  await page.getByLabel("Lời nhắn *").fill("Provider failure test");
  await send.click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Provider error" }),
  ).toBeVisible();
});

test("mobile navigation, layout width and reduced motion", async ({
  page,
  isMobile,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Mở menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Điều hướng di động" }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Điều hướng di động" })
      .getByRole("link", { name: "About" })
      .click();
    await expect(page).toHaveURL(/\/about$/);
  }
  for (const path of [
    "/",
    "/projects",
    "/projects/coffee-shop-management-system",
    "/about",
    "/contact",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `${path} has horizontal overflow`,
    ).toBe(true);
  }
  await page.screenshot({
    path: testInfo.outputPath(`contact-${isMobile ? "mobile" : "desktop"}.png`),
    fullPage: true,
  });
});

test("core accessibility rules", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
