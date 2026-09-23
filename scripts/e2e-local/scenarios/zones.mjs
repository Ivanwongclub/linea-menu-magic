// Phase 6b R2/R3/R7 — zones: a second finish on part of the same blank, the
// two-tone axis-design §2 said would need CAD masks.
//
//   1. A plane dragged along the model's height: gold above it, the button's
//      own nickel below, read off the screen on both sides.
//   2. A zone made of one of the model's parts: exactly that part's faces.
//   3. A painted zone: a 1 mm brush covers the region it was dragged over.
//   4. Zones are exclusive — an overlap is reported and the strip says so.
//   5. The recipe records each zone, and the spec sheet reads as one sentence.
import assert from "node:assert/strict";
import {
  LAYER_PAINT,
  LAYER_PLATED,
  chroma,
  colourAt,
  colourAtScreen,
  hueDistance,
  labOfHex,
  openEditorFor,
  projectPoint,
  stageAppearance,
  waitForRecipe,
} from "../lib/appearance.mjs";

const BRUSH_MM = 1;
/** Matt black enamel: a mirror finish's highlight would drown any hue test. */
const BRUSH_PAINT = "CYC-0112";

export default async function ({ page, base, admin, editor, h }) {
  const { product, finishes, restore } = await stageAppearance(admin, "sample-eyelets-rivets", "e2e-zones.obj");
  let domeRestore = null;
  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await h.login(editor);
    await page.setViewportSize({ width: 1280, height: 900 });
    const designId = await openEditorFor(page, base, product);
    const viewport = page.getByTestId("editor-viewport");
    const canvas = viewport.locator("canvas").first();
    const faceZ = Number(await viewport.getAttribute("data-face-z"));
    const zonesData = async () => JSON.parse((await viewport.getAttribute("data-zones")) ?? "[]");

    // E2 U1/U3: adding or touching a zone selects it, so the row under test is
    // the selected one — never "the last row".
    const zoneRow = () => page.locator('[data-testid="zone-row"][data-selected="true"]');

    /** A zone starts plated; a paint colour needs the mode switched first. */
    const setZoneMode = async (mode) => {
      await zoneRow().getByTestId("appearance-mode").click();
      await page.getByRole("option", { name: new RegExp(mode, "i") }).click();
      await page.waitForTimeout(500);
    };
    const pickZoneFinish = async (cycCode, mode = "Plated finish") => {
      await setZoneMode(mode);
      await zoneRow().getByTestId("appearance-choose").click();
      const swatch = page.getByTestId("appearance-picker").locator(`[data-testid="finish-swatch"][data-code="${cycCode}"]`);
      await swatch.waitFor({ timeout: 20000 });
      await swatch.click();
      await swatch.waitFor({ state: "detached", timeout: 20000 });
      await page.waitForTimeout(1200);
    };
    const addZone = async (method) => {
      await page.getByTestId("add-zone").click();
      await page.getByTestId(`add-zone-${method}`).click();
      await zoneRow().waitFor({ timeout: 10000 });
      await page.waitForTimeout(600);
    };

    /* ---- 1. a plane along the model's height (R2) ---- */
    await addZone("plane");
    await pickZoneFinish(LAYER_PLATED);
    const planeRecipe = await waitForRecipe(page, admin, designId, (r) => (r.zones ?? []).length === 1 && r.zones[0].appearance.finish_id === finishes[LAYER_PLATED].id, "plane zone stored");
    assert.equal(planeRecipe.zones[0].method, "plane");
    assert.equal(planeRecipe.zones[0].plane.axis, "y", "height is the face frame's Y");
    assert.equal(planeRecipe.recipe_version, 3, "R3: zones are an optional field of v3");
    out.plane = planeRecipe.zones[0].plane;

    const [planeZone] = await zonesData();
    assert.ok(planeZone.faces > 0, "the plane covers part of the model");
    await page.waitForTimeout(800);
    const above = await colourAt(page, canvas, { x: 0, y: 2, z: faceZ });
    const below = await colourAt(page, canvas, { x: 0, y: -2, z: faceZ });
    const goldLab = labOfHex(finishes[LAYER_PLATED].base_color_hex);
    assert.ok(hueDistance(above.lab, goldLab) <= 30, `above the plane is the zone's gold: ${JSON.stringify(above.rgb)}`);
    assert.ok(chroma(below.lab) < chroma(above.lab) - 5, `below it is still the button's nickel: ${JSON.stringify(below.rgb)} vs ${JSON.stringify(above.rgb)}`);
    out.planePixels = { above: above.rgb, below: below.rgb };

    /* ---- 2. a zone made of one of the model's parts (R2) ---- */
    await zoneRow().getByTestId("zone-delete").click();
    await addZone("groups");
    const parts = JSON.parse(await viewport.getAttribute("data-parts"));
    const biggest = [...parts].sort((a, b) => b.faces - a.faces)[0];
    await page.locator(`[data-testid="zone-part"][data-index="${biggest.index}"]`).click();
    await pickZoneFinish(LAYER_PAINT, "Paint colour");
    const groupRecipe = await waitForRecipe(page, admin, designId, (r) => (r.zones ?? [])[0]?.method === "groups" && (r.zones[0].groups ?? []).length === 1, "part zone stored");
    assert.deepEqual(groupRecipe.zones[0].groups, [biggest.index]);
    const [groupZone] = await zonesData();
    assert.equal(groupZone.faces, biggest.faces, "the zone is exactly that part's faces");
    out.partZone = { part: biggest.name, faces: groupZone.faces };

    /* ---- 3. a painted zone (R2) ---- */
    // On the calibration dome: a 1 mm brush leaves a 2 mm mark, and reading one
    // needs a surface without the Polo's lettering or its centre hole in the
    // way. The zone rendering itself is what steps 1 and 2 just read off a part.
    await zoneRow().getByTestId("zone-delete").click();
    const dome = await stageAppearance(admin, "sample-d-rings-o-rings", "e2e-zones-dome.obj", { model: "dome" });
    domeRestore = dome.restore;
    const domeDesign = await openEditorFor(page, base, dome.product);
    const domeCanvas = page.getByTestId("editor-viewport").locator("canvas").first();
    const domeFaceZ = Number(await viewport.getAttribute("data-face-z"));
    await addZone("paint");
    await page.getByTestId("zone-brush-input").fill(String(BRUSH_MM));
    await page.getByTestId("zone-brush-input").blur();
    await pickZoneFinish(BRUSH_PAINT, "Paint colour");

    const at = (x, y) => projectPoint(page, domeCanvas, { x, y, z: domeFaceZ });
    const press = await at(0, 0);
    const before = await colourAtScreen(page, domeCanvas, press);
    const beside = await at(4, 0);
    const besideBefore = await colourAtScreen(page, domeCanvas, beside);

    await page.mouse.move(press.x, press.y);
    await page.mouse.down();
    await page.mouse.up();
    const paintRecipe = await waitForRecipe(page, admin, domeDesign, (r) => ((r.zones ?? [])[0]?.faces ?? []).length > 0, "painted faces stored");
    assert.equal(paintRecipe.zones[0].method, "paint");
    assert.equal(paintRecipe.zones[0].faces.length % 2, 0, "R3: faces are stored as a run list");
    await page.waitForTimeout(1500);

    // Matt black on bright nickel: a lightness drop no highlight can fake.
    const isPaint = (sample, was) => sample.lab[0] < was.lab[0] - 25;
    const after = await colourAtScreen(page, domeCanvas, press);
    assert.ok(isPaint(after, before), `the brush painted where it was pressed: ${JSON.stringify(before.rgb)} -> ${JSON.stringify(after.rgb)}`);

    const ring = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const point = await at(Math.cos(angle) * BRUSH_MM * 0.6, Math.sin(angle) * BRUSH_MM * 0.6);
      ring.push(await colourAtScreen(page, domeCanvas, point));
    }
    const covered = ring.filter((sample) => isPaint(sample, before)).length;
    assert.ok(covered / ring.length >= 0.9, `the ${BRUSH_MM} mm brush covered ${covered}/${ring.length} of its own footprint`);

    const besideAfter = await colourAtScreen(page, domeCanvas, beside);
    assert.ok(!isPaint(besideAfter, besideBefore), `the brush painted only where it was pressed: ${JSON.stringify(besideAfter.rgb)}`);
    out.painted = { runs: paintRecipe.zones[0].faces.length / 2, covered: `${covered}/${ring.length}` };

    /* ---- 4. zones are exclusive, and an overlap is said out loud (R2) ---- */
    await addZone("plane");
    await zoneRow().getByTestId("zone-side").locator('[data-value="above"]').click();
    await page.getByTestId("zone-plane-input").fill("-10");
    await page.getByTestId("zone-plane-input").blur();
    await pickZoneFinish(LAYER_PLATED);
    await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-zone-overlaps") ?? "[]").length > 0, null, {
      timeout: 20000,
    });
    const overlapWarning = page.locator('[data-testid="manufacturing-warning"][data-kind="zoneOverlap"]');
    await overlapWarning.waitFor({ timeout: 20000 });
    const overlapText = (await overlapWarning.innerText()).trim();
    assert.match(overlapText, /overlaps/, overlapText);
    out.overlap = overlapText;

    /* ---- 5. the spec sheet's sentence (R3) ---- */
    const sentence = await viewport.getAttribute("data-zone-sentence");
    assert.match(sentence, /: /, `the zones read as a sentence: ${sentence}`);
    assert.equal(sentence.split(";").length, 2, sentence);
    out.sentence = sentence;

    return out;
  } finally {
    await admin.from("designs").delete().eq("owner_id", editor.userId);
    if (domeRestore) await domeRestore();
    await restore();
  }
}
