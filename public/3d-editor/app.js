import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

/* ------------------------------------------------------------------ *
 *  OBJ Studio — a small online 3D editor for .obj files
 * ------------------------------------------------------------------ */

const viewport = document.getElementById('viewport');
const statusText = document.getElementById('statusText');
const objectList = document.getElementById('objectList');

// --- Scene -------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfafafa);

const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 5000);
camera.position.set(6, 5, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

// --- Lighting ----------------------------------------------------------
scene.add(new THREE.HemisphereLight(0xffffff, 0xe5e5e5, 0.9));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(8, 14, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 80;
keyLight.shadow.camera.left = -25;
keyLight.shadow.camera.right = 25;
keyLight.shadow.camera.top = 25;
keyLight.shadow.camera.bottom = -25;
keyLight.shadow.bias = -0.0004;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(-6, 4, -8);
scene.add(fillLight);

// --- Ground / grid -----------------------------------------------------
const grid = new THREE.GridHelper(60, 60, 0xd4d4d4, 0xe5e5e5);
grid.material.opacity = 0.8;
grid.material.transparent = true;
scene.add(grid);

const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.ShadowMaterial({ opacity: 0.28 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.001;
ground.receiveShadow = true;
scene.add(ground);

// --- Controls ----------------------------------------------------------
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.target.set(0, 1, 0);

const transform = new TransformControls(camera, renderer.domElement);
transform.addEventListener('dragging-changed', (e) => { orbit.enabled = !e.value; });
transform.addEventListener('objectChange', () => { if (selected) syncInspectorFromObject(selected); scheduleSave(); });
scene.add(transform);

// --- State -------------------------------------------------------------
const objects = [];          // editable root objects (THREE.Object3D)
let selected = null;
let objCounter = 0;
const defaultCam = { pos: camera.position.clone(), target: orbit.target.clone() };

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// ====================================================================
//  Object management
// ====================================================================

function makeMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x8a8f98, metalness: 0.1, roughness: 0.7, side: THREE.DoubleSide,
  });
}

/** Register a root object into the editable scene. */
function registerObject(root, name) {
  root.name = name || root.name || `Object ${++objCounter}`;
  root.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      if (!c.material || !c.material.isMeshStandardMaterial) c.material = makeMaterial();
      if (!c.geometry.attributes.normal) c.geometry.computeVertexNormals();
    }
  });
  scene.add(root);
  objects.push(root);
  refreshOutliner();
  refreshStats();
  scheduleSave();
  return root;
}

function removeObject(obj) {
  transform.detach();
  if (selected === obj) selected = null;
  scene.remove(obj);
  obj.traverse((c) => {
    if (c.isMesh) {
      c.geometry?.dispose();
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
      else c.material?.dispose();
    }
  });
  const i = objects.indexOf(obj);
  if (i >= 0) objects.splice(i, 1);
  refreshOutliner();
  refreshStats();
  updateInspector();
  scheduleSave();
}

function clearAll() {
  [...objects].forEach(removeObject);
  setStatus('Scene cleared.');
}

// ====================================================================
//  Selection
// ====================================================================

function select(obj) {
  selected = obj || null;
  if (selected) {
    transform.attach(selected);
  } else {
    transform.detach();
  }
  refreshOutliner();
  updateInspector();
}

// Click-to-select in the viewport
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (transform.dragging) return;
  if (e.button !== 0) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(objects, true);
  if (hits.length) {
    // climb to the registered root
    let o = hits[0].object;
    while (o.parent && !objects.includes(o)) o = o.parent;
    select(o);
  } else {
    select(null);
  }
});

// ====================================================================
//  Loading .obj
// ====================================================================

const loader = new OBJLoader();

function loadOBJText(text, name) {
  let group;
  try {
    group = loader.parse(text);
  } catch (err) {
    setStatus(`Failed to parse ${name}: ${err.message}`, true);
    return;
  }
  if (!group.children.length) {
    setStatus(`${name} contained no geometry.`, true);
    return;
  }
  const root = registerObject(group, name.replace(/\.obj$/i, ''));
  normalizeAndPlace(root);
  select(root);
  focusObject(root);
  setStatus(`Imported "${root.name}" (${countTriangles(root).toLocaleString()} triangles).`);
}

/** Scale very large/small imports into a sane range and sit them on the floor. */
function normalizeAndPlace(root) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0 && (maxDim > 40 || maxDim < 0.4)) {
    const s = 5 / maxDim;
    root.scale.multiplyScalar(s);
  }
  dropToFloor(root);
  centerHorizontally(root);
}

function readFiles(fileList) {
  const files = [...fileList].filter((f) => /\.obj$/i.test(f.name));
  if (!files.length) { setStatus('No .obj files found in selection.', true); return; }
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => loadOBJText(reader.result, file.name);
    reader.onerror = () => setStatus(`Could not read ${file.name}.`, true);
    reader.readAsText(file);
  });
}

// File input
document.getElementById('fileInput').addEventListener('change', (e) => {
  readFiles(e.target.files);
  e.target.value = '';
});

// Drag & drop
const dropOverlay = document.getElementById('dropOverlay');
let dragDepth = 0;
window.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; dropOverlay.classList.remove('hidden'); });
window.addEventListener('dragover', (e) => { e.preventDefault(); });
window.addEventListener('dragleave', (e) => { e.preventDefault(); if (--dragDepth <= 0) { dragDepth = 0; dropOverlay.classList.add('hidden'); } });
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  dropOverlay.classList.add('hidden');
  if (e.dataTransfer?.files?.length) readFiles(e.dataTransfer.files);
});

// ====================================================================
//  Exporting
// ====================================================================

const exporter = new OBJExporter();

function exportOBJ() {
  const target = selected || (objects.length ? wrapAll() : null);
  if (!target) { setStatus('Nothing to export.', true); return; }
  const text = exporter.parse(target);
  const baseName = (selected ? selected.name : 'scene').replace(/\s+/g, '_');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}.obj`;
  a.click();
  URL.revokeObjectURL(url);
  setStatus(`Exported ${baseName}.obj`);
}

/** Temporary group holding all objects, for "export everything". */
function wrapAll() {
  const g = new THREE.Group();
  objects.forEach((o) => g.add(o.clone()));
  return g;
}

// ====================================================================
//  Transform helpers
// ====================================================================

function dropToFloor(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  if (box.isEmpty()) return;
  obj.position.y -= box.min.y;
}

function centerHorizontally(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
}

function focusObject(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
  const dist = radius / Math.sin((camera.fov / 2) * Math.PI / 180) * 1.6;
  const dir = new THREE.Vector3(1, 0.7, 1).normalize();
  camera.position.copy(center).add(dir.multiplyScalar(dist));
  orbit.target.copy(center);
  orbit.update();
}

function resetCamera() {
  camera.position.copy(defaultCam.pos);
  orbit.target.copy(defaultCam.target);
  orbit.update();
}

function countTriangles(obj) {
  let tris = 0;
  obj.traverse((c) => {
    if (c.isMesh && c.geometry) {
      const g = c.geometry;
      tris += g.index ? g.index.count / 3 : (g.attributes.position?.count || 0) / 3;
    }
  });
  return Math.round(tris);
}

// ====================================================================
//  UI: Outliner
// ====================================================================

function refreshOutliner() {
  objectList.innerHTML = '';
  if (!objects.length) {
    objectList.innerHTML = '<li class="muted" style="cursor:default">No objects yet.</li>';
    return;
  }
  objects.forEach((obj) => {
    const li = document.createElement('li');
    if (obj === selected) li.classList.add('selected');
    if (!obj.visible) li.classList.add('hidden-obj');

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = obj.name;
    li.appendChild(name);

    const vis = document.createElement('span');
    vis.className = 'vis';
    vis.textContent = obj.visible ? '👁' : '🚫';
    vis.title = 'Toggle visibility';
    vis.addEventListener('click', (e) => {
      e.stopPropagation();
      obj.visible = !obj.visible;
      if (!obj.visible && selected === obj) transform.detach();
      else if (obj.visible && selected === obj) transform.attach(obj);
      refreshOutliner();
      scheduleSave();
    });
    li.appendChild(vis);

    li.addEventListener('click', () => select(obj));
    objectList.appendChild(li);
  });
}

function refreshStats() {
  const stats = document.getElementById('stats');
  if (!objects.length) { stats.textContent = 'No objects loaded.'; return; }
  const tris = objects.reduce((s, o) => s + countTriangles(o), 0);
  stats.innerHTML =
    `Objects: <b>${objects.length}</b><br>` +
    `Triangles: <b>${tris.toLocaleString()}</b>`;
}

// ====================================================================
//  UI: Inspector
// ====================================================================

const $ = (id) => document.getElementById(id);
const inspFields = ['posX','posY','posZ','rotX','rotY','rotZ','sclX','sclY','sclZ'];

function updateInspector() {
  const has = !!selected;
  $('noSel').classList.toggle('hidden', has);
  $('props').classList.toggle('hidden', !has);
  if (!has) return;
  syncInspectorFromObject(selected);

  // appearance from first mesh
  const mat = firstMaterial(selected);
  if (mat) {
    $('propColor').value = '#' + mat.color.getHexString();
    $('propMetal').value = mat.metalness ?? 0.1;
    $('propRough').value = mat.roughness ?? 0.7;
    $('propWire').checked = !!mat.wireframe;
    $('propFlat').checked = !!mat.flatShading;
  }
  $('propName').value = selected.name;
  updateTexStatus();
}

function syncInspectorFromObject(obj) {
  $('posX').value = round(obj.position.x);
  $('posY').value = round(obj.position.y);
  $('posZ').value = round(obj.position.z);
  $('rotX').value = round(THREE.MathUtils.radToDeg(obj.rotation.x));
  $('rotY').value = round(THREE.MathUtils.radToDeg(obj.rotation.y));
  $('rotZ').value = round(THREE.MathUtils.radToDeg(obj.rotation.z));
  $('sclX').value = round(obj.scale.x);
  $('sclY').value = round(obj.scale.y);
  $('sclZ').value = round(obj.scale.z);
}

function applyInspectorToObject() {
  if (!selected) return;
  selected.position.set(+$('posX').value || 0, +$('posY').value || 0, +$('posZ').value || 0);
  selected.rotation.set(
    THREE.MathUtils.degToRad(+$('rotX').value || 0),
    THREE.MathUtils.degToRad(+$('rotY').value || 0),
    THREE.MathUtils.degToRad(+$('rotZ').value || 0),
  );
  const sx = +$('sclX').value, sy = +$('sclY').value, sz = +$('sclZ').value;
  selected.scale.set(sx || 0.0001, sy || 0.0001, sz || 0.0001);
  scheduleSave();
}

inspFields.forEach((id) => $(id).addEventListener('input', applyInspectorToObject));

$('propName').addEventListener('input', () => {
  if (!selected) return;
  selected.name = $('propName').value || selected.name;
  refreshOutliner();
  scheduleSave();
});

function firstMaterial(obj) {
  let m = null;
  obj.traverse((c) => { if (!m && c.isMesh) m = Array.isArray(c.material) ? c.material[0] : c.material; });
  return m;
}

function eachMaterial(obj, fn) {
  obj.traverse((c) => {
    if (c.isMesh) (Array.isArray(c.material) ? c.material : [c.material]).forEach(fn);
  });
}

$('propColor').addEventListener('input', () => {
  if (selected) { eachMaterial(selected, (m) => m.color.set($('propColor').value)); scheduleSave(); }
});
$('propMetal').addEventListener('input', () => {
  if (selected) { eachMaterial(selected, (m) => { m.metalness = +$('propMetal').value; }); scheduleSave(); }
});
$('propRough').addEventListener('input', () => {
  if (selected) { eachMaterial(selected, (m) => { m.roughness = +$('propRough').value; }); scheduleSave(); }
});
$('propWire').addEventListener('change', () => {
  if (selected) { eachMaterial(selected, (m) => { m.wireframe = $('propWire').checked; }); scheduleSave(); }
});
$('propFlat').addEventListener('change', () => {
  if (selected) { eachMaterial(selected, (m) => { m.flatShading = $('propFlat').checked; m.needsUpdate = true; }); scheduleSave(); }
});

// Inspector action buttons
$('centerBtn').addEventListener('click', () => { if (selected) { centerHorizontally(selected); syncInspectorFromObject(selected); } });
$('dropFloorBtn').addEventListener('click', () => { if (selected) { dropToFloor(selected); syncInspectorFromObject(selected); } });
$('deleteBtn').addEventListener('click', () => { if (selected) removeObject(selected); });
$('duplicateBtn').addEventListener('click', duplicateSelected);

function duplicateSelected() {
  if (!selected) return;
  const clone = selected.clone(true);
  // clone materials so edits are independent
  clone.traverse((c) => {
    if (c.isMesh) c.material = Array.isArray(c.material) ? c.material.map((m) => m.clone()) : c.material.clone();
  });
  clone.position.x += 1.5;
  registerObject(clone, selected.name + ' copy');
  select(clone);
  setStatus(`Duplicated "${selected.name}".`);
}

function round(v) { return Math.round(v * 1000) / 1000; }

// ====================================================================
//  Primitive
// ====================================================================

function addCube() {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), makeMaterial());
  const root = new THREE.Group();
  root.add(mesh);
  registerObject(root, `Cube ${++objCounter}`);
  dropToFloor(root);
  select(root);
  setStatus('Added a cube.');
}

// ====================================================================
//  Toolbar
// ====================================================================

document.querySelectorAll('.tool[data-mode]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool[data-mode]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    transform.setMode(btn.dataset.mode);
  });
});

const spaceBtn = $('spaceBtn');
spaceBtn.addEventListener('click', () => {
  const next = transform.space === 'local' ? 'world' : 'local';
  transform.setSpace(next);
  spaceBtn.textContent = next === 'world' ? 'World' : 'Local';
});

let snapOn = false;
const snapBtn = $('snapBtn');
snapBtn.addEventListener('click', () => {
  snapOn = !snapOn;
  transform.setTranslationSnap(snapOn ? 0.5 : null);
  transform.setRotationSnap(snapOn ? THREE.MathUtils.degToRad(15) : null);
  transform.setScaleSnap(snapOn ? 0.1 : null);
  snapBtn.textContent = snapOn ? 'Snap: On' : 'Snap: Off';
});

$('focusBtn').addEventListener('click', () => { if (selected) focusObject(selected); });
$('resetCamBtn').addEventListener('click', resetCamera);
$('gridBtn').addEventListener('click', () => { grid.visible = !grid.visible; });

$('exportBtn').addEventListener('click', exportOBJ);
$('addCubeBtn').addEventListener('click', addCube);
$('clearBtn').addEventListener('click', () => {
  if (objects.length && confirm('Remove all objects from the scene?')) clearAll();
});

// ====================================================================
//  Keyboard shortcuts
// ====================================================================

window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
  const setMode = (mode) => {
    transform.setMode(mode);
    document.querySelectorAll('.tool[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  };
  switch (e.key.toLowerCase()) {
    case 'w': setMode('translate'); break;
    case 'e': setMode('rotate'); break;
    case 'r': setMode('scale'); break;
    case 'f': if (selected) focusObject(selected); break;
    case 'delete': case 'backspace': if (selected) removeObject(selected); break;
    case 'escape': select(null); break;
    case 'd': if ((e.ctrlKey || e.metaKey)) { e.preventDefault(); duplicateSelected(); } break;
  }
});

// ====================================================================
//  Status + render loop
// ====================================================================

let statusTimer = null;
function setStatus(msg, isError = false) {
  statusText.textContent = msg;
  statusText.style.color = isError ? 'var(--danger)' : 'var(--ok)';
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { statusText.style.color = 'var(--muted)'; }, 4000);
}

function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h || 1;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function animate() {
  requestAnimationFrame(animate);
  orbit.update();
  renderer.render(scene, camera);
}
animate();

// ====================================================================
//  Texture editor
// ====================================================================

const texCanvas = $('texCanvas');
const texCtx = texCanvas.getContext('2d');
const TEX = texCanvas.width; // 512

// Paint a neutral starting canvas.
function fillCanvas(color) {
  texCtx.fillStyle = color;
  texCtx.fillRect(0, 0, TEX, TEX);
}
fillCanvas('#9aa0aa');

// --- Texture status in the inspector ---------------------------------
function selectionHasTexture() {
  let textured = false;
  if (selected) eachMaterial(selected, (m) => { if (m.map) textured = true; });
  return textured;
}

function updateTexStatus() {
  const el = $('texStatus');
  if (!el) return;
  el.textContent = selectionHasTexture() ? 'Texture applied.' : 'No texture.';
}

// --- Open / close ----------------------------------------------------
const texModal = $('texModal');

function openTextureEditor() {
  if (!selected) { setStatus('Select an object first.', true); return; }
  $('texTarget').textContent = `— ${selected.name}`;
  // Seed the canvas from the object's current texture, if any.
  const mat = firstMaterial(selected);
  if (mat && mat.map && mat.map.image) {
    try {
      texCtx.clearRect(0, 0, TEX, TEX);
      texCtx.drawImage(mat.map.image, 0, 0, TEX, TEX);
    } catch { /* tainted/empty image — keep current canvas */ }
    if (mat.map.repeat) { $('texRepX').value = round(mat.map.repeat.x); $('texRepY').value = round(mat.map.repeat.y); }
    if (mat.map.offset) { $('texOffX').value = round(mat.map.offset.x); $('texOffY').value = round(mat.map.offset.y); }
    $('texRot').value = round(THREE.MathUtils.radToDeg(mat.map.rotation || 0));
  }
  texModal.classList.remove('hidden');
}

function closeTextureEditor() { texModal.classList.add('hidden'); }

$('openTexBtn').addEventListener('click', openTextureEditor);
$('texCloseBtn').addEventListener('click', closeTextureEditor);
texModal.addEventListener('pointerdown', (e) => { if (e.target === texModal) closeTextureEditor(); });

$('removeTexBtn').addEventListener('click', () => {
  if (!selected) return;
  eachMaterial(selected, (m) => { if (m.map) { m.map.dispose(); m.map = null; m.needsUpdate = true; } });
  updateTexStatus();
  scheduleSave();
  setStatus('Texture removed.');
});

// --- Painting --------------------------------------------------------
let painting = false;
let eraser = false;
const brushColor = $('brushColor');
const brushSize = $('brushSize');

$('eraserBtn').addEventListener('click', (e) => {
  eraser = !eraser;
  e.currentTarget.classList.toggle('active', eraser);
});

function canvasPos(e) {
  const rect = texCanvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * TEX,
    y: ((e.clientY - rect.top) / rect.height) * TEX,
  };
}

function paintDot(p) {
  texCtx.beginPath();
  texCtx.fillStyle = eraser ? $('genColorB').value : brushColor.value;
  texCtx.arc(p.x, p.y, (+brushSize.value) * (TEX / texCanvas.clientWidth) / 2, 0, Math.PI * 2);
  texCtx.fill();
}

texCanvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  texCanvas.setPointerCapture(e.pointerId);
  painting = true;
  paintDot(canvasPos(e));
});
texCanvas.addEventListener('pointermove', (e) => {
  if (!painting) return;
  paintDot(canvasPos(e));
});
texCanvas.addEventListener('pointerup', () => { painting = false; });
texCanvas.addEventListener('pointerleave', () => { painting = false; });

// --- Procedural patterns ---------------------------------------------
function drawPattern(kind) {
  const a = $('genColorA').value;
  const b = $('genColorB').value;
  const n = Math.max(1, +$('patScale').value); // cells across
  const cell = TEX / n;

  fillCanvas(b);
  texCtx.fillStyle = a;

  switch (kind) {
    case 'solid':
      fillCanvas(a);
      break;
    case 'checker':
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++)
          if ((x + y) % 2 === 0) texCtx.fillRect(x * cell, y * cell, cell, cell);
      break;
    case 'stripes':
      for (let x = 0; x < n; x += 2) texCtx.fillRect(x * cell, 0, cell, TEX);
      break;
    case 'dots':
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          texCtx.beginPath();
          texCtx.arc((x + 0.5) * cell, (y + 0.5) * cell, cell * 0.3, 0, Math.PI * 2);
          texCtx.fill();
        }
      break;
    case 'gradient': {
      const g = texCtx.createLinearGradient(0, 0, TEX, TEX);
      g.addColorStop(0, a); g.addColorStop(1, b);
      texCtx.fillStyle = g; texCtx.fillRect(0, 0, TEX, TEX);
      break;
    }
    case 'noise': {
      const img = texCtx.createImageData(TEX, TEX);
      const ca = hexToRgb(a), cb = hexToRgb(b);
      for (let i = 0; i < img.data.length; i += 4) {
        const t = pseudoNoise(i) ;
        img.data[i]     = ca.r + (cb.r - ca.r) * t;
        img.data[i + 1] = ca.g + (cb.g - ca.g) * t;
        img.data[i + 2] = ca.b + (cb.b - ca.b) * t;
        img.data[i + 3] = 255;
      }
      texCtx.putImageData(img, 0, 0);
      break;
    }
    case 'grid':
      texCtx.strokeStyle = a; texCtx.lineWidth = Math.max(1, cell * 0.04);
      for (let i = 0; i <= n; i++) {
        texCtx.beginPath(); texCtx.moveTo(i * cell, 0); texCtx.lineTo(i * cell, TEX); texCtx.stroke();
        texCtx.beginPath(); texCtx.moveTo(0, i * cell); texCtx.lineTo(TEX, i * cell); texCtx.stroke();
      }
      break;
    case 'brick': {
      const bh = cell, bw = cell * 2;
      texCtx.fillStyle = a;
      for (let row = 0, y = 0; y < TEX; y += bh, row++) {
        const shift = (row % 2) * (bw / 2);
        for (let x = -bw; x < TEX; x += bw) {
          texCtx.fillRect(x + shift + 2, y + 2, bw - 4, bh - 4);
        }
      }
      break;
    }
  }
}

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}
// Deterministic value-noise so it survives a reload without Math.random.
function pseudoNoise(i) {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

document.querySelectorAll('.pattern-grid [data-pattern]').forEach((btn) => {
  btn.addEventListener('click', () => drawPattern(btn.dataset.pattern));
});

// --- Image import ----------------------------------------------------
$('texImgInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    texCtx.clearRect(0, 0, TEX, TEX);
    texCtx.drawImage(img, 0, 0, TEX, TEX);
    URL.revokeObjectURL(img.src);
  };
  img.onerror = () => setStatus('Could not load image.', true);
  img.src = URL.createObjectURL(file);
});

$('texClearBtn').addEventListener('click', () => fillCanvas($('genColorB').value));

// --- Apply to object -------------------------------------------------
function readMapping() {
  return {
    repX: +$('texRepX').value || 1,
    repY: +$('texRepY').value || 1,
    offX: +$('texOffX').value || 0,
    offY: +$('texOffY').value || 0,
    rot: THREE.MathUtils.degToRad(+$('texRot').value || 0),
  };
}

function applyTexture() {
  if (!selected) { setStatus('Select an object first.', true); return; }
  // Snapshot the working canvas so each object owns an independent texture.
  const snap = document.createElement('canvas');
  snap.width = TEX; snap.height = TEX;
  snap.getContext('2d').drawImage(texCanvas, 0, 0);

  const tex = new THREE.CanvasTexture(snap);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.center.set(0.5, 0.5);
  const m = readMapping();
  tex.repeat.set(m.repX, m.repY);
  tex.offset.set(m.offX, m.offY);
  tex.rotation = m.rot;

  eachMaterial(selected, (mat) => {
    if (mat.map) mat.map.dispose();
    mat.map = tex;
    // Let the texture show in full colour rather than tinted by the base colour.
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  });
  $('propColor').value = '#ffffff';
  updateTexStatus();
  scheduleSave();
  setStatus(`Texture applied to "${selected.name}".`);
}

$('texApplyBtn').addEventListener('click', applyTexture);

// Live-update mapping on the selected object's existing texture.
['texRepX', 'texRepY', 'texOffX', 'texOffY', 'texRot'].forEach((id) => {
  $(id).addEventListener('input', () => {
    if (!selected) return;
    const m = readMapping();
    eachMaterial(selected, (mat) => {
      if (!mat.map) return;
      mat.map.center.set(0.5, 0.5);
      mat.map.repeat.set(m.repX, m.repY);
      mat.map.offset.set(m.offX, m.offY);
      mat.map.rotation = m.rot;
      mat.map.needsUpdate = true;
    });
    scheduleSave();
  });
});

// Close the modal with Escape.
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !texModal.classList.contains('hidden')) {
    e.stopPropagation();
    closeTextureEditor();
  }
}, true);

// ====================================================================
//  Persistence (IndexedDB) — scene survives a page close/reopen
// ====================================================================
//
//  Each editable root is serialized with Object3D.toJSON(), which captures
//  geometry, transforms, materials AND the canvas textures (as data URLs).
//  ObjectLoader rebuilds them on the next visit.

const DB_NAME = 'objstudio';
const STORE = 'scene';
const KEY = 'current';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let saveTimer = null;
let restoring = false;

/** Debounced save — coalesces bursts of edits (e.g. dragging) into one write. */
function scheduleSave() {
  if (restoring) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveScene, 400);
}

async function saveScene() {
  try {
    const docs = objects.map((o) => o.toJSON());
    await idbSet(docs);
  } catch (err) {
    console.warn('Could not cache scene:', err);
  }
}

const objLoader = new THREE.ObjectLoader();

async function restoreScene() {
  let docs;
  try { docs = await idbGet(); } catch { return; }
  if (!Array.isArray(docs) || !docs.length) return;

  restoring = true;
  for (const doc of docs) {
    try {
      const obj = await objLoader.parseAsync(doc);
      registerObject(obj, obj.name);
    } catch (err) {
      console.warn('Skipped an object that failed to restore:', err);
    }
  }
  restoring = false;

  refreshOutliner();
  refreshStats();
  if (objects.length) {
    setStatus(`Restored ${objects.length} object(s) from your last session.`);
  }
}

// Flush any pending save synchronously on the way out.
window.addEventListener('beforeunload', () => { if (saveTimer) saveScene(); });

// Init UI
refreshOutliner();
refreshStats();
updateInspector();
setStatus('Ready. Import an .obj file to begin.');

// Bring back whatever was open last time.
restoreScene();

// ---- URL param autoload (model=<url>&name=<label>) -------------------
(async function autoloadFromQuery() {
  try {
    const params = new URLSearchParams(location.search);
    const modelUrl = params.get('model');
    const label = params.get('name');
    if (modelUrl) {
      setStatus(`Loading ${label || 'model'}...`);
      const res = await fetch(modelUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const fileName = (label ? label.replace(/\s+/g, '_') : 'model') + '.obj';
      loadOBJText(text, fileName);
    }
  } catch (err) {
    setStatus(`Failed to load model: ${err.message}`, true);
  }
  try { window.parent && window.parent.postMessage({ type: 'editor-ready' }, '*'); } catch (_) {}
})();
