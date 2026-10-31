// Real browser upload/edit/save/reload coverage. Owns and removes its QA product/files.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const OBJ = "mtllib colours.mtl\nv -10 -10 0\nv 10 -10 0\nv 10 10 0\nv -10 10 0\nvt 0 0\nvt 1 0\nvt 1 1\nvt 0 1\no Body\nusemtl Red\nf 1/1 2/2 3/3\no Cap\nusemtl Blue\nf 1/1 3/3 4/4\n";
const MTL = "newmtl Red\nKd 1 0 0\nNs 10\nnewmtl Blue\nKd 0 0 1\nNs 10\nmap_Kd white.png\n";
const STL = "solid Test\nfacet normal 0 0 1\nouter loop\nvertex -10 -10 0\nvertex 10 -10 0\nvertex 0 10 0\nendloop\nendfacet\nendsolid Test\n";
const binarySTL = () => {
  const buffer = Buffer.alloc(134);
  buffer.writeUInt32LE(1,80);
  [0,0,1,-10,-10,0,10,-10,0,0,10,0].forEach((value,index)=>buffer.writeFloatLE(value,84+index*4));
  return buffer;
};
const payload = (name, text, mimeType = "text/plain") => ({ name, mimeType, buffer: Buffer.from(text) });
const checked = (result) => { if (result.error) throw result.error; return result.data; };
async function poll(fn, message) {
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) { if (await fn()) return; await new Promise(resolve => setTimeout(resolve, 250)); }
  throw new Error(message);
}

export default async function ({ page, base, admin, editor, h }) {
  const slug = `qa-model-import-${randomUUID()}`;
  const product = checked(await admin.from("products").insert({ name: "QA model import", slug, item_code: slug, status: "active", is_public: true }).select("id").single());
  const viewport = page.getByTestId("editor-viewport");
  const parts = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]");
  const zones = async () => JSON.parse(await viewport.getAttribute("data-zones") || "[]");
  const currentProduct = async () => checked(await admin.from("products").select("model_storage_path,model_scale_status,model_raw_bounds").eq("id", product.id).single());
  const files = [payload("coloured.obj", OBJ, "model/obj"), payload("colours.mtl", MTL), {name:"white.png",mimeType:"image/png",buffer:await sharp({create:{width:2,height:2,channels:3,background:"#ffffff"}}).png().toBuffer()}];
  const report = {};
  let completed = false;
  const importFolder = mkdtempSync(join(tmpdir(), "linea-model-import-"));
  mkdirSync(join(importFolder,"materials")); mkdirSync(join(importFolder,"textures"));
  const folderOBJ = OBJ.replace("mtllib colours.mtl", "mtllib materials/colours.mtl");
  writeFileSync(join(importFolder,"coloured.obj"),folderOBJ);
  writeFileSync(join(importFolder,"materials","colours.mtl"),MTL.replace("white.png","../textures/white.png"));
  writeFileSync(join(importFolder,"textures","white.png"),files[2].buffer);
  try {
    checked(await admin.from("product_size_variants").insert({product_id:product.id,size_primary_mm:20,is_default:true,sort_order:0}));
    await h.login(editor);
    await h.openProduct(product.id);
    await h.expectToast(/3D model uploaded/i, () => page.getByTestId("model-folder-input").setInputFiles(importFolder));
    const stored = await currentProduct();
    assert.match(stored.model_storage_path,/\/model\.obj$/);
    assert.equal(stored.model_raw_bounds.primary_raw,20);
    const folder=stored.model_storage_path.slice(0,stored.model_storage_path.lastIndexOf("/"));
    const saved=checked(await admin.storage.from("product-models").list(folder));
    for(const name of ["model.obj","materials.mtl","texture-0.png","source.obj","source-0.mtl"])assert.ok(saved.some(file=>file.name===name),name);
    assert.equal(await checked(await admin.storage.from("product-models").download(`${folder}/source.obj`)).text(),folderOBJ);
    await h.expectToast(/surface/i,()=>page.getByTestId("model-input").setInputFiles(payload("invalid.obj","v 0 0 0\nv 0 0 0\nv 0 0 0\nf 1 2 3","model/obj")));
    assert.equal((await currentProduct()).model_storage_path,stored.model_storage_path);
    await page.getByTestId("model-scale-confirm-button").click();
    await h.waitForToast(/Scale confirmed/i);
    report.cms="OBJ/MTL/texture folder uploaded with relative subdirectories, original bytes retained, invalid replacement refused, scale confirmed";

    await page.goto(`${base}/designer-studio/editor/new?product=${slug}`,{waitUntil:"networkidle"});
    await page.waitForURL(/\/editor\/[0-9a-f-]{36}$/,{timeout:30000});
    const designId=page.url().split("/").pop();
    await poll(async()=> (await parts()).length===2 && (await parts())[1].renderedMaterials?.[0]?.textured,"source model did not render");
    assert.deepEqual((await parts()).map(part=>part.name),["Body","Cap"]);
    assert.deepEqual((await parts()).map(part=>part.renderedMaterials[0].colour),["#ff0000","#0000ff"]);
    assert.equal(await page.getByTestId("local-model-source").getAttribute("aria-pressed"),"true");
    mkdirSync("reports/deployment",{recursive:true});
    const png=await viewport.locator("canvas").screenshot({path:"reports/deployment/model-import-original.png"});
    const pixels=await sharp(png).removeAlpha().raw().toBuffer();
    let red=0,blue=0;
    for(let i=0;i<pixels.length;i+=3){const [r,g,b]=pixels.subarray(i,i+3);if(r>40&&r>g*1.8&&r>b*1.8)red++;if(b>40&&b>g*1.8&&b>r*1.8)blue++;}
    assert.ok(red>100&&blue>100,`canvas must actually show both colours: ${red}/${blue}`);
    report.render={parts:2,materials:["Red","Blue"],texture:true,redPixels:red,bluePixels:blue};
    await page.getByTestId("parts-toggle").click();
    const body=page.getByTestId("part-row").filter({has:page.locator('[data-testid="part-select"]',{hasText:"Body"})});
    await body.getByTestId("part-visibility").click();
    await poll(async()=>await viewport.getAttribute("data-model-mesh-count")==="1","part hide failed");
    await page.getByTestId("undo").click();
    await poll(async()=>await viewport.getAttribute("data-model-mesh-count")==="2","part undo failed");
    await body.getByTestId("part-select").click();
    await page.getByTestId("part-colour-swatch").nth(1).click();
    await poll(async()=> (await zones())[0]?.colourHex==="#FFFFFF"&&(await zones())[0]?.faces===1,"part colour zone failed");
    assert.equal((await zones())[0].faces,1);
    assert.equal((await parts())[1].renderedMaterials[0].colour,"#0000ff");
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("QA");
    await page.getByTestId("text-layer-content").blur();
    await poll(async()=>Number(await viewport.getAttribute("data-glyph-count"))===2,"text did not render");
    await page.getByTestId("output-toggle").click();
    await page.getByTestId("version-label-input").fill("Import QA");
    await page.getByTestId("version-save").click();
    await page.getByTestId("version-row").first().waitFor();
    await poll(async()=>{
      const design=checked(await admin.from("designs").select("draft_recipe").eq("id",designId).single());
      return design.draft_recipe?.zones?.length===1&&design.draft_recipe.layers?.[0]?.content?.value==="QA";
    },"model edits were not autosaved");
    await page.reload({waitUntil:"networkidle"});
    await poll(async()=> (await zones()).length===1&&Number(await viewport.getAttribute("data-glyph-count"))===2,"saved model edits did not reload");
    assert.equal((await parts())[1].renderedMaterials[0].colour,"#0000ff");
    await page.screenshot({path:"reports/deployment/model-import-edited.png"});
    report.editing="hide/show, per-part colour, text, undo, autosave, named version and page reload passed";

    await page.getByTestId("view-open-model-input").setInputFiles(files);
    await page.getByTestId("local-model-banner").waitFor();
    await poll(async()=> (await parts()).length===2&&(await parts())[0].renderedMaterials[0].colour==="#ff0000","local MTL did not render");
    assert.equal((await zones()).length,0,"another model must not inherit the catalogue's face masks");
    await page.getByTestId("local-model-colour").click();
    await poll(async()=> (await parts()).every(part=>part.renderedMaterials[0].colour==="#111111"),"base colour override failed");
    await page.getByTestId("undo").click();
    await poll(async()=> (await parts())[0].renderedMaterials[0].colour==="#ff0000","undo did not restore original materials");
    await page.getByTestId("view-open-folder-input").setInputFiles(importFolder);
    await poll(async()=> (await parts()).length===2&&(await parts())[1].renderedMaterials[0].textured,"local folder texture did not resolve");
    await page.getByTestId("view-open-model-input").setInputFiles(payload("part.stl",STL,"model/stl"));
    await poll(async()=> (await parts()).length===1&&(await parts())[0].name==="STL","local STL did not render");
    assert.equal(Number(await viewport.getAttribute("data-model-size-mm")),20);
    await page.getByTestId("local-model-colour").click();
    await page.getByTestId("colour-swatch").nth(1).click();
    await poll(async()=> (await parts())[0].renderedMaterials[0].colour==="#ffffff","STL colour edit failed");
    await page.getByTestId("view-fit").click();
    await page.getByTestId("view-reset").click();
    await h.expectToast(/surface/i,()=>page.getByTestId("view-open-model-input").setInputFiles(payload("bad.stl","solid Empty\nendsolid Empty","model/stl")));
    assert.equal((await parts())[0].name,"STL");
    report.local="OBJ+MTL+texture and STL import, colour override, original-material undo, correct dimensions, fit/reset and invalid-file protection passed";

    await h.openProduct(product.id);
    await h.expectToast(/3D model uploaded/i,()=>page.getByTestId("model-input").setInputFiles({name:"cms.stl",mimeType:"model/stl",buffer:binarySTL()}));
    assert.match((await currentProduct()).model_storage_path,/\/model\.stl$/);
    assert.equal((await currentProduct()).model_scale_status,"unconfirmed");
    assert.equal(checked(await admin.storage.from("product-models").list(folder)).length,0);
    await page.getByTestId("model-scale-confirm-button").click();
    await h.waitForToast(/Scale confirmed/i);
    await page.goto(`${base}/designer-studio/editor/new?product=${slug}`,{waitUntil:"networkidle"});
    await poll(async()=> (await parts()).length===1&&(await parts())[0].name==="STL","stored STL did not reopen");
    report.stl="Binary STL CMS upload, recalibration, old bundle cleanup and editor reopen passed";
    completed = true;
    return report;
  } finally {
    if (!completed) {
      mkdirSync("reports/deployment", {recursive:true});
      console.error(JSON.stringify({lastUrl:page.url(),toasts:await page.locator("[data-sonner-toast]").allInnerTexts(),body:(await page.locator("body").innerText()).slice(-3000)}));
      await page.screenshot({path:"reports/deployment/model-import-last-step.png"}).catch(()=>{});
    }
    await page.goto("about:blank");
    checked(await admin.from("designs").delete().eq("product_id",product.id));
    const root=`models/${product.id}`;
    for(const directory of checked(await admin.storage.from("product-models").list(root)) ?? []){
      const prefix=`${root}/${directory.name}`;
      const entries=checked(await admin.storage.from("product-models").list(prefix)) ?? [];
      if(entries.length)checked(await admin.storage.from("product-models").remove(entries.filter(entry=>entry.id).map(entry=>`${prefix}/${entry.name}`)));
    }
    checked(await admin.from("products").update({model_scale_reference_variant_id:null}).eq("id",product.id));
    checked(await admin.from("product_size_variants").delete().eq("product_id",product.id));
    checked(await admin.from("products").delete().eq("id",product.id));
    rmSync(importFolder,{recursive:true,force:true});
  }
}
