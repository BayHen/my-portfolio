import test from "node:test";
import assert from "node:assert/strict";
import { projects, getProjectBySlug } from "../src/content/projects/index.ts";
import { getResumeHref } from "../src/lib/resume.ts";
import {
  validateContact,
  getContactConfig,
  sendContactEmail,
  allowContactAttempt,
} from "../src/lib/contact.ts";
import { motionSettings } from "../src/lib/motion-settings.ts";

test("project content is addressable and placeholders remain explicit", () => {
  assert.equal(
    getProjectBySlug("coffee-shop-management-system")?.title,
    "Coffee Shop Management System",
  );
  assert.equal(getProjectBySlug("missing"), undefined);
  assert.ok(
    projects.every(
      (project) => project.placeholder && project.status === "Ý tưởng mẫu",
    ),
  );
});

test("resume action requires a PDF URL", () => {
  assert.equal(getResumeHref(undefined), null);
  assert.equal(getResumeHref("javascript:alert(1)"), null);
  assert.equal(getResumeHref("/resume.pdf"), "/resume.pdf");
  assert.equal(
    getResumeHref("https://example.com/cv.pdf"),
    "https://example.com/cv.pdf",
  );
});

test("contact validation enforces required fields and length limits", () => {
  assert.ok(
    validateContact({ name: "A", email: "bad", message: "short" }).errors.name,
  );
  assert.ok(
    validateContact({
      name: "Ada",
      email: "ada@example.com",
      message: "x".repeat(5001),
    }).errors.message,
  );
  assert.deepEqual(
    validateContact({
      name: " Ada ",
      email: "ada@example.com",
      message: "Hello from a test.",
    }).value?.name,
    "Ada",
  );
  assert.equal(getContactConfig({}), null);
});

test("provider acceptance requires HTTP success and an ID", async () => {
  const input = {
    name: "Ada",
    email: "ada@example.com",
    message: "Hello from a test.",
  };
  const config = {
    apiKey: "test",
    from: "sender@example.com",
    to: "owner@example.com",
  };
  const accepted = await sendContactEmail(
    input,
    config,
    async (_url, options) => {
      assert.match(options.headers.Authorization, /^Bearer test$/);
      assert.equal(JSON.parse(options.body).reply_to, input.email);
      return new Response(JSON.stringify({ id: "provider-id" }), {
        status: 200,
      });
    },
  );
  assert.equal(accepted.accepted, true);
  assert.equal(
    (
      await sendContactEmail(
        input,
        config,
        async () => new Response("error", { status: 422 }),
      )
    ).accepted,
    false,
  );
  assert.equal(
    (
      await sendContactEmail(
        input,
        config,
        async () => new Response("{}", { status: 200 }),
      )
    ).accepted,
    false,
  );
});

test("rate limit blocks a sixth attempt in the window", () => {
  const key = `test-${crypto.randomUUID()}`;
  for (let i = 0; i < 5; i++)
    assert.equal(allowContactAttempt(key, 1000), true);
  assert.equal(allowContactAttempt(key, 1000), false);
  assert.equal(allowContactAttempt(key, 601001), true);
});

test("reduced motion removes entrance movement", () => {
  assert.equal(motionSettings(true).initial, false);
  assert.equal(motionSettings(true).transition.duration, 0);
  assert.deepEqual(motionSettings(false).initial, { opacity: 0, y: 16 });
});
