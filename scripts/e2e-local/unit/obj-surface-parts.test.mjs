import { test } from "node:test";
import assert from "node:assert/strict";
import { Box3, BufferAttribute, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { parseObjSurfaceParts, splitFlatObjMaterialParts } from "../../../src/features/editor/lib/objSurfaceParts.ts";

const vertices = `v 0 0 0
v 2 0 0
v 0 3 0
v 0 0 4
vt 0 0
vt 1 0
vt 0 1
vt 1 1
vn 0 0 1
vn 1 0 0
`;
const faces = `usemtl 金属
f 1/1/1 2/2/1 3/3/1
usemtl PBR材质
f 1/1/2 3/3/2 4/4/2
usemtl 金属
f 2/2/1 3/3/1 4/4/1
`;
const bounds = (root) => {
  const box = new Box3().setFromObject(root);
  return [box.min.toArray(), box.max.toArray()];
};
const faceCount = (root) => root.children.reduce((sum, mesh) => sum + (mesh.geometry.index?.count ?? mesh.geometry.getAttribute("position").count) / 3, 0);
const triangles = (root) => root.children.flatMap((mesh) => {
  const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
  const attributeNames = Object.keys(geometry.attributes).sort();
  return Array.from({ length: geometry.getAttribute("position").count / 3 }, (_, face) => JSON.stringify(attributeNames.map((name) => {
    const attribute = geometry.getAttribute(name);
    return [name, Array.from(attribute.array.slice(face * 3 * attribute.itemSize, (face + 1) * 3 * attribute.itemSize))];
  })));
});

test("flat material ranges become distinct source segments in original face order, without losing triangles or attributes", () => {
  const source = new OBJLoader().parse(vertices + faces);
  const sourceValues = Object.fromEntries(Object.entries(source.children[0].geometry.attributes).map(([name, attribute]) => [name, Array.from(attribute.array)]));
  const parsed = parseObjSurfaceParts(vertices + faces);
  assert.deepEqual(parsed.children.map((mesh) => mesh.name), ["金属 · 1", "PBR材质", "金属 · 2"]);
  assert.deepEqual(parsed.children.map((mesh) => mesh.geometry.getAttribute("position").count / 3), [1, 1, 1]);
  assert.equal(faceCount(parsed), faceCount(source));
  assert.deepEqual(bounds(parsed), bounds(source));
  assert.deepEqual(triangles(parsed), triangles(source), "position, normal, UV and triangle order remain identical");
  for (const [name, attribute] of Object.entries(source.children[0].geometry.attributes)) assert.deepEqual(Array.from(attribute.array), sourceValues[name]);
  assert.equal(source.children.length, 1, "source group is not mutated");
  assert.deepEqual(parseObjSurfaceParts(vertices + faces).children.map((mesh) => mesh.name), parsed.children.map((mesh) => mesh.name), "part indices are deterministic");
});

test("successive source segments with one reused material remain separate and get stable suffixes", () => {
  const repeated = Array.from({ length: 5 }, () => "usemtl 金属\nf 1 2 3\n").join("");
  const parsed = parseObjSurfaceParts(vertices + repeated);
  assert.deepEqual(parsed.children.map((mesh) => mesh.name), ["金属 · 1", "金属 · 2", "金属 · 3", "金属 · 4", "金属 · 5"]);
  assert.equal(faceCount(parsed), 5);
});

test("authored o/g boundaries and order stay intact even when an object has multiple materials", () => {
  const text = vertices + "o Body\n" + faces + "g Face\nusemtl 金属\nf 1 2 3\ng Clasp\nf 1 3 4\n";
  const source = new OBJLoader().parse(text);
  const parsed = parseObjSurfaceParts(text);
  assert.deepEqual(parsed.children.map((mesh) => mesh.name), ["Body", "Face", "Clasp"]);
  assert.deepEqual(triangles(parsed), triangles(source));
  assert.deepEqual(bounds(parsed), bounds(source));
});

test("a flat file with one source segment honestly remains one part", () => {
  const text = vertices + "usemtl 金属\nf 1 2 3\nf 1 3 4\n";
  const source = new OBJLoader().parse(text);
  assert.equal(splitFlatObjMaterialParts(source, false), source);
  assert.equal(parseObjSurfaceParts(text).children.length, 1);
});

test("unnamed/default material ranges are not interpreted as reliable part boundaries", () => {
  for (const name of ["", "default", "DefaultMaterial"]) {
    const source = new OBJLoader().parse(vertices + `usemtl ${name}\nf 1 2 3\nusemtl 金属\nf 1 3 4\n`);
    assert.equal(splitFlatObjMaterialParts(source, false), source);
    assert.equal(source.children.length, 1);
  }
});

test("empty source ranges are ignored without changing segment order or attributes", () => {
  const source = new OBJLoader().parse(vertices + faces);
  const geometry = source.children[0].geometry;
  geometry.groups.splice(0, 0, { start: 0, count: 0, materialIndex: 999 });
  geometry.groups.splice(2, 0, { start: 3, count: 0, materialIndex: 999 });
  geometry.groups.push({ start: 9, count: 0, materialIndex: 999 });
  const parsed = splitFlatObjMaterialParts(source, false);
  assert.deepEqual(parsed.children.map((mesh) => mesh.name), ["金属 · 1", "PBR材质", "金属 · 2"]);
  assert.deepEqual(triangles(parsed), triangles(source));
  assert.deepEqual(bounds(parsed), bounds(source));
});

test("repeated-name suffixes do not collide with an original material name", () => {
  const text = vertices + faces + "usemtl 金属 · 1\nf 1 2 4\n";
  const parsed = parseObjSurfaceParts(text);
  assert.equal(new Set(parsed.children.map((mesh) => mesh.name)).size, 4);
  assert.deepEqual(parsed.children.map((mesh) => mesh.userData.objMaterialName), ["金属", "PBR材质", "金属", "金属 · 1"]);
  assert.deepEqual(triangles(parsed), triangles(new OBJLoader().parse(text)));
});

test("indexed geometry is split with exact vertex attributes, bounds and face count", () => {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4], 3));
  geometry.setAttribute("normal", new Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0], 3));
  geometry.setAttribute("uv", new Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
  geometry.setAttribute("color", new BufferAttribute(new Uint8Array([0, 128, 255, 64, 32, 16, 255, 0, 128, 128, 255, 0]), 3, true));
  geometry.setIndex([0, 1, 2, 0, 2, 3, 1, 2, 3]);
  geometry.addGroup(0, 3, 0);
  geometry.addGroup(3, 3, 1);
  geometry.addGroup(6, 3, 0);
  const materials = ["Metal", "Stone"].map((name) => Object.assign(new MeshBasicMaterial(), { name }));
  const source = new Group();
  source.add(new Mesh(geometry, materials));
  const parsed = splitFlatObjMaterialParts(source, false);
  assert.deepEqual(parsed.children.map((mesh) => mesh.name), ["Metal · 1", "Stone", "Metal · 2"]);
  assert.deepEqual(triangles(parsed), triangles(source));
  assert.deepEqual(bounds(parsed), bounds(source));
  assert.equal(faceCount(parsed), 3);
  assert.equal(source.children[0].geometry, geometry);
  assert.deepEqual(Array.from(geometry.index.array), [0, 1, 2, 0, 2, 3, 1, 2, 3]);
  for (const mesh of parsed.children) {
    assert.equal(mesh.geometry.getAttribute("color").normalized, true);
    assert.ok(mesh.geometry.getAttribute("color").array instanceof Uint8Array);
  }
});

test("Rhino trailing point, line and freeform records cannot turn mesh faces into Points or Lines", () => {
  const surfaceOnly = parseObjSurfaceParts(vertices + faces);
  for (const tail of ["p 4\n", "l 1 4\n", "parm u 0 1\n", "p 1\nl 2 4\n", "cstype bspline\ndeg 1\ncurv 0 1 1 4\nparm u 0 1\nend\np 4\n"]) {
    const parsed = parseObjSurfaceParts(vertices + faces + tail);
    assert.ok(parsed.children.every((child) => child.isMesh));
    assert.deepEqual(triangles(parsed), triangles(surfaceOnly));
    assert.deepEqual(bounds(parsed), bounds(surfaceOnly));
    assert.equal(faceCount(parsed), 3);
  }
});

test("auxiliary-only OBJ is rejected instead of offering invalid surface bounds", () => {
  assert.throws(() => parseObjSurfaceParts(vertices + "p 1\nl 1 4\n"), /no surface faces/);
});
