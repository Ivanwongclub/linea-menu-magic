// M4 Step 0: a placeholder seed can be published from the editor after a
// confirmation, while bulk actions in the list keep skipping seeds.
import assert from "node:assert/strict";

export default async function ({ page, admin, editor, base, h }) {
  const { data: seed } = await admin.from("products").select("id, name").eq("slug", "sample-hook-and-loop").single();
  await admin.from("products").update({ item_code: "E2E-SEED-001", status: "draft", is_public: false }).eq("id", seed.id);

  await h.login(editor);

  /* ---- bulk publish still skips seeds ---- */
  await page.getByPlaceholder("Name or item code").fill("E2E-SEED-001");
  await page.getByRole("checkbox", { name: `Select ${seed.name}` }).waitFor();
  await page.getByRole("checkbox", { name: `Select ${seed.name}` }).click();
  await page.getByRole("button", { name: "Publish" }).click();
  const skipped = await h.waitForToast(/placeholder seeds stay draft/);
  let { data: row } = await admin.from("products").select("status, is_public").eq("id", seed.id).single();
  assert.deepEqual([row.status, row.is_public], ["draft", false], "bulk left the seed alone");

  /* ---- editor: Publish is offered, confirms, then publishes ---- */
  await h.openProduct(seed.id);
  await page.getByTestId("seed-hint").waitFor();
  const publish = page.getByRole("button", { name: "Publish", exact: true });
  assert.ok(await publish.isVisible(), "Publish is offered on a seed");
  await publish.click();
  await page.getByTestId("seed-publish-dialog").waitFor();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByTestId("seed-publish-dialog").waitFor({ state: "detached" });
  ({ data: row } = await admin.from("products").select("status").eq("id", seed.id).single());
  assert.equal(row.status, "draft", "cancel publishes nothing");

  await publish.click();
  await page.getByTestId("seed-publish-dialog").waitFor();
  await page.getByRole("button", { name: "Publish it" }).click();
  await h.waitForToast(/^Published\.$/);
  ({ data: row } = await admin.from("products").select("status, is_public").eq("id", seed.id).single());
  assert.deepEqual([row.status, row.is_public], ["active", true], "confirmed publish went through");

  await admin.from("products").update({ item_code: null, status: "draft", is_public: false }).eq("id", seed.id);
  return { bulkSkipped: skipped, editorPublished: row };
}
