import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { groupFromModelData, ModelFileLoader } from "../../../src/features/editor/lib/ModelFileLoader.ts";
import { prepareModelImport, modelFilesFromDrop } from "../../../src/features/editor/lib/modelImport.ts";
import { hasSourceAppearance, materialLibraries, sourcePhysicalMaterial } from "../../../src/features/editor/lib/modelMaterials.ts";

// FileLoader's browser progress events are also used by this real HTTP reload test.
globalThis.ProgressEvent ??= class extends Event {
  constructor(type, options) { super(type); Object.assign(this, options); }
};

const OBJ = `mtllib colours.mtl
v 0 0 0
v 10 0 0
v 10 10 0
v 0 10 0
o Body
usemtl Red
f 1 2 3
o Cap
usemtl Blue
f 1 3 4
`;
const MTL = "newmtl Red\nKd 1 0 0\nNs 32\nd 0.5\nnewmtl Blue\nKd 0 0 1\n";
const ASCII_STL = "solid Part\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 10 0 0\nvertex 0 10 0\nendloop\nendfacet\nendsolid Part\n";

test("OBJ + MTL retains authored part order, material names, colour and opacity", () => {
  const root = groupFromModelData(OBJ, "obj", MTL);
  assert.deepEqual(root.children.map(mesh => mesh.name), ["Body", "Cap"]);
  assert.deepEqual(root.children.map(mesh => mesh.material.name), ["Red", "Blue"]);
  assert.deepEqual(root.children.map(mesh => mesh.material.color.getHexString()), ["ff0000", "0000ff"]);
  assert.equal(root.children[0].material.opacity, 0.5);
  assert.equal(hasSourceAppearance(root), true);
  const material = sourcePhysicalMaterial(root.children[0].material, false, [{colorHex:"#00ff00",metalness:0,roughness:0.6}]);
  assert.equal(material.color.getHexString(), "ff0000");
  assert.equal(material.opacity, 0.5);
  assert.equal(material.userData.shaderPatch.zones.length, 1);
});

test("flat usemtl segments still retain their individual colours and source order", () => {
  const root = groupFromModelData(OBJ.replace(/^o .*\n/gm, "") + "usemtl Red\nf 1 2 4\n", "obj", MTL);
  assert.deepEqual(root.children.map(mesh => mesh.material.color.getHexString()), ["ff0000", "0000ff", "ff0000"]);
  assert.equal(root.children.reduce((count,mesh)=>count+mesh.geometry.getAttribute("position").count/3,0),3);
});

test("ASCII and binary STL are usable meshes; Magics vertex colours and alpha survive", () => {
  const ascii = groupFromModelData(ASCII_STL, "stl");
  assert.equal(ascii.children[0].geometry.getAttribute("position").count, 3);
  assert.equal(hasSourceAppearance(ascii), false);
  const binary = new ArrayBuffer(134);
  const bytes = new Uint8Array(binary);
  bytes.set(new TextEncoder().encode("COLOR="));
  bytes.set([255,0,0,128],6);
  const data = new DataView(binary);
  data.setUint32(80,1,true);
  const triangle = [0,0,1, 0,0,0, 10,0,0, 0,10,0];
  triangle.forEach((value,index)=>data.setFloat32(84+index*4,value,true));
  data.setUint16(132,0x8000,true);
  const root = groupFromModelData(binary, "stl");
  assert.equal(hasSourceAppearance(root),true);
  assert.equal(root.children[0].geometry.getAttribute("color").getX(0),1);
  assert.equal(root.children[0].geometry.getAttribute("color").getY(0),0);
  assert.equal(root.children[0].material.vertexColors,true);
  assert.equal(root.children[0].material.opacity,128/255);
});

test("empty, degenerate and non-finite models are rejected before replacing a valid model", () => {
  assert.throws(()=>groupFromModelData("solid Empty\nendsolid Empty", "stl"));
  assert.throws(()=>groupFromModelData("v 0 0 0\nv 0 0 0\nv 0 0 0\nf 1 2 3", "obj"),/surface/);
  assert.throws(()=>groupFromModelData("v NaN 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3", "obj"),/coordinates/);
});

test("bundle rewrites only resource references and preserves original source bytes", async () => {
  const obj = new File([OBJ],"sample.obj");
  const mtl = new File([MTL+"map_Kd -s 2 2 1 textures/blue.png\n"],"colours.mtl");
  const image = new File([new Uint8Array([1,2,3])],"blue.png",{type:"image/png"});
  const bundle = await prepareModelImport([obj,mtl,image]);
  try {
    assert.deepEqual(bundle.warnings,[]);
    assert.equal(await bundle.uploads.find(file=>file.name==="source.obj").body.text(),OBJ);
    assert.equal(await bundle.uploads.find(file=>file.name==="source-0.mtl").body.text(),await mtl.text());
    assert.match(await bundle.model.text(),/^mtllib materials.mtl\n/);
    assert.match(bundle.materialText,/map_Kd -s 2 2 1 blob:/);
    assert.match(await bundle.uploads.find(file=>file.name==="materials.mtl").body.text(),/map_Kd -s 2 2 1 texture-0.png/);
    assert.deepEqual(new Uint8Array(await bundle.uploads.find(file=>file.name==="texture-0.png").body.arrayBuffer()),new Uint8Array([1,2,3]));
  } finally { bundle.resourceUrls.forEach(url=>URL.revokeObjectURL(url)); }
});

test("missing MTL or texture reports a warning and keeps geometry or diffuse colour", async () => {
  const file = new File([OBJ],"sample.obj");
  const missing = await prepareModelImport([file]);
  assert.match(missing.warnings.join(),/Missing MTL/);
  const textured = await prepareModelImport([file,new File([MTL+"map_Kd absent.png\n"],"colours.mtl")]);
  assert.match(textured.warnings.join(),/Missing texture/);
  assert.ok(!textured.materialText.includes("map_Kd"));
  assert.equal(groupFromModelData(await textured.model.text(),"obj",textured.materialText).children[1].material.color.getHexString(),"0000ff");
  await assert.rejects(prepareModelImport([file,new File([OBJ],"other.obj")]),/one OBJ/);
});

test("MTL filenames with spaces and multiple library declarations resolve", () => {
  assert.deepEqual(materialLibraries("mtllib my colours.mtl\n",["my colours.mtl"]),["my colours.mtl"]);
  assert.deepEqual(materialLibraries("mtllib red.mtl blue.mtl\nmtllib red.mtl"),["red.mtl","blue.mtl"]);
});

test("folder-relative textures resolve exactly even when another folder reuses a basename", async () => {
  const file=(content,name,path)=>{const result=new File([content],name);Object.defineProperty(result,'webkitRelativePath',{value:path});return result;};
  const obj=file(OBJ.replace('colours.mtl','materials/colours.mtl'),'model.obj','Export/model.obj');
  const mtl=file(MTL+'map_Kd ../textures/blue.png\n','colours.mtl','Export/materials/colours.mtl');
  const image=file('correct','blue.png','Export/textures/blue.png');
  const other=file('wrong','blue.png','Export/other/blue.png');
  const bundle=await prepareModelImport([obj,mtl,image,other]);
  try {
    assert.deepEqual(bundle.warnings,[]);
    assert.equal(await bundle.uploads.find(file=>file.name==='texture-0.png').body.text(),'correct');
  } finally {bundle.resourceUrls.forEach(url=>URL.revokeObjectURL(url));}
});

test("directory drops traverse entries and retain relative paths for material resolution", async () => {
  const leaf=(path,text)=>({isFile:true,isDirectory:false,fullPath:path,file:done=>done(new File([text],path.split('/').pop()))});
  const directory=(path,children)=>({isFile:false,isDirectory:true,fullPath:path,createReader(){let index=0;return{readEntries:done=>done(index<children.length?[children[index++]]:[])}}});
  const root=directory('/Export',[leaf('/Export/model.obj',OBJ.replace('colours.mtl','materials/colours.mtl')),directory('/Export/materials',[leaf('/Export/materials/colours.mtl',MTL)])]);
  const files=await modelFilesFromDrop({items:[{webkitGetAsEntry:()=>root}],files:[]});
  assert.deepEqual(files.map(file=>file.webkitRelativePath),['Export/model.obj','Export/materials/colours.mtl']);
  const bundle=await prepareModelImport(files);
  assert.deepEqual(bundle.warnings,[]);
});

test("stored OBJ reload resolves its MTL beside the geometry rather than using a local hint", async () => {
  const requests=[];
  const server=createServer((req,res)=>{
    requests.push(req.url);
    if(req.url==="/model.obj")res.end(OBJ);
    else if(req.url==="/colours.mtl")res.end(MTL);
    else {res.statusCode=404;res.end();}
  });
  server.listen(0,"127.0.0.1");
  await once(server,"listening");
  try {
    const loader=new ModelFileLoader();
    loader.materialTextHint="newmtl Red\nKd 0 1 0\n";
    const root=await loader.loadAsync(`http://127.0.0.1:${server.address().port}/model.obj`);
    assert.equal(root.children[0].material.color.getHexString(),"ff0000");
    assert.ok(requests.includes("/colours.mtl"));
  } finally {server.close();server.closeAllConnections();}
});
