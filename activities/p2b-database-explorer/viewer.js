import * as pdfjsLib from './vendor/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.mjs';
console.info(`[P2B] PDF.js version ${pdfjsLib.version}`); // the vendor/wasm folder must come from this same version

/* ------------------------------------------------------------------ *
 *  Paths. Change these two lines if your folders differ.              *
 *  viewer.js lives in modules/p2b-datasheets/, so '../../' is the     *
 *  repo root. 'documentPath' values in the JSON are read from there.  *
 * ------------------------------------------------------------------ */
const SITE_ROOT = new URL('../../', import.meta.url);
const METADATA_URL = new URL('docs/tests/p2b-fixtures/mock_datasheet.json', SITE_ROOT);

/* Extra files PDF.js loads on demand. Copy the matching folders from the same
 * pdfjs-dist version as vendor/pdf.mjs into vendor/ (see the notes that came with this file).
 * 'wasm' is REQUIRED for scanned datasheets such as CD4011B: without it PDF.js
 * skips the page image and only the few text items show. */
const PDF_OPTIONS = {
  wasmUrl: new URL('./vendor/wasm/', import.meta.url).href,
  // Optional, improves text for fonts not embedded in a PDF:
  // standardFontDataUrl: new URL('./vendor/standard_fonts/', import.meta.url).href,
  // cMapUrl: new URL('./vendor/cmaps/', import.meta.url).href, cMapPacked: true,
};

const DEFAULT_SCALE = 1.25;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.25;
const RERENDER_DELAY_MS = 60;
const UNAVAILABLE_MSG = 'Datasheet data unavailable';
const DASH = '\u2014';

const $ = (id) => document.getElementById(id);
const els = {
  datasheetSelect: $('datasheet-select'),
  pageSelect: $('page-select'),
  prev: $('prev-btn'),
  next: $('next-btn'),
  currentPage: $('current-page-num'),
  totalPages: $('total-pages'),
  zoomOut: $('zoom-out'),
  zoomIn: $('zoom-in'),
  zoomFit: $('zoom-fit'),
  zoomLabel: $('zoom-label'),
  status: $('status'),
  wrap: $('viewer-wrap'),
  stage: $('page-stage'),
  canvas: $('pdf-canvas'),
  overlay: $('overlay-layer'),
  tooltip: $('tooltip'),
};

const state = {
  metadata: null,
  datasheet: null,
  pdfDoc: null,
  decodersMissing: false, // true when vendor/wasm cannot be fetched
  loadingTask: null, // PDF.js loading task behind pdfDoc; destroy() lives here, not on pdfDoc
  page: null,        // PDF.js page proxy for the page on screen
  pageMeta: null,    // matching entry from the JSON
  pageIndex: 0,
  scale: DEFAULT_SCALE,
  fitWidth: false,
  hotspots: [],      // [{ rec, btn }]
  active: null,      // tooltip currently shown: { rec, btn }
  pinned: null,      // tooltip pinned by click/tap/Enter: { rec, btn }
  renderTask: null,
  renderTimer: null,
  renderToken: 0,
  pageToken: 0,
  loadToken: 0,
};

/* Timing evidence for the tester. In the browser console, read
 * p2bMetrics.tooltip (ms from hover/focus to next paint, target < 100) and
 * p2bMetrics.layout (ms to reposition hotspots after zoom/resize, target < 200). */
window.p2bMetrics = { tooltip: [], layout: [] };
function recordMetric(kind, startedAt) {
  const list = window.p2bMetrics[kind];
  list.push(Math.round((performance.now() - startedAt) * 100) / 100);
  if (list.length > 100) list.shift();
}

/* ------------------------------ helpers ------------------------------ */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
const isBox = (b) => !!b && isNum(b.x) && isNum(b.y) && isNum(b.width) && isNum(b.height)
  && b.x >= 0 && b.y >= 0 && b.width > 0 && b.height > 0;
const area = (rec) => rec.bbox.width * rec.bbox.height;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function showStatus(message) {
  els.status.textContent = message;
  els.status.hidden = !message;
}

/* Missing or malformed data: tell the learner, log the detail, keep the UI alive. */
function fail(message, detail, err) {
  console.error(`[P2B] ${detail}`, err ?? '');
  showStatus(message);
}

function formatValue(value, unit) {
  if (value == null || value === '' || value === '-') return DASH;
  const isPlainNumber = /^[+-]?\d*\.?\d+$/.test(String(value));
  return isPlainNumber && unit ? `${value} ${unit}` : String(value);
}

/* Frees a PDF.js document. Cleanup must never be able to stop a datasheet switch. */
function releaseTask(task) {
  try {
    Promise.resolve(task?.destroy?.()).catch(() => {});
  } catch {
    /* ignore */
  }
}

/* Scanned pages need the decoder files in vendor/wasm. Without them PDF.js silently
 * skips the page image, so check once at start-up and say so. */
async function checkDecoderFiles() {
  try {
    const res = await fetch(`${PDF_OPTIONS.wasmUrl}jbig2.wasm`, { method: 'HEAD' });
    state.decodersMissing = !res.ok;
  } catch {
    state.decodersMissing = true;
  }
  if (state.decodersMissing) {
    console.warn(`[P2B] PDF.js decoder files not found at ${PDF_OPTIONS.wasmUrl}. `
      + 'Scanned pages (CD4011B) will draw without their page image. '
      + 'Copy the wasm folder from the matching pdfjs-dist version into vendor/.');
  }
}

const DECODER_NOTICE = 'Scanned pages (such as CD4011B) may look blank: PDF.js decoder files not found in vendor/wasm.';

/* --------------------------- loading data ---------------------------- */

function problem(message, url, status) {
  return Object.assign(new Error(message), { url, status });
}

async function loadMetadata() {
  const url = METADATA_URL.href;
  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw problem(`Network error loading ${url}`, url, 'network');
  }
  if (!response.ok) throw problem(`HTTP ${response.status} loading ${url}`, url, response.status);
  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw problem(`Invalid JSON in ${url}`, url, response.status);
  }
  if (!data || !Array.isArray(data.datasheets) || data.datasheets.length === 0) {
    throw problem(`No datasheets found in ${url}`, url, response.status);
  }
  return data;
}

function populateDatasheetSelect() {
  els.datasheetSelect.replaceChildren();
  for (const ds of state.metadata.datasheets) {
    const opt = el('option', '', `${ds.datasheetId} (${ds.family ?? 'family not set'})`);
    opt.value = ds.datasheetId;
    els.datasheetSelect.append(opt);
  }
}

function clearView() {
  cancelRender();
  dismissAll();
  releaseTask(state.loadingTask);
  state.loadingTask = null;
  state.datasheet = null;
  state.pdfDoc = null;
  state.page = null;
  state.pageMeta = null;
  state.hotspots = [];
  els.overlay.replaceChildren();
  els.canvas.width = 0;
  els.canvas.height = 0;
  els.pageSelect.replaceChildren();
  els.currentPage.textContent = DASH;
  els.totalPages.textContent = DASH;
  els.prev.disabled = true;
  els.next.disabled = true;
}

async function loadDatasheet(datasheetId) {
  const token = ++state.loadToken;
  state.pageToken += 1;
  cancelRender();
  dismissAll();

  const ds = state.metadata.datasheets.find((d) => d.datasheetId === datasheetId);
  if (!ds) {
    clearView();
    fail(UNAVAILABLE_MSG, `Datasheet ${datasheetId} not found in metadata`);
    return;
  }
  els.datasheetSelect.value = ds.datasheetId;
  showStatus(`Loading ${ds.datasheetId}\u2026`);

  const url = new URL(ds.documentPath, SITE_ROOT).href;
  const loadingTask = pdfjsLib.getDocument({ url, ...PDF_OPTIONS });
  let pdfDoc;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (err) {
    releaseTask(loadingTask);
    if (token !== state.loadToken) return;
    clearView();
    fail(UNAVAILABLE_MSG, `Failed to load PDF ${url} (status ${err?.status ?? 'n/a'})`, err);
    return;
  }
  if (token !== state.loadToken) { // the learner picked something else meanwhile
    releaseTask(loadingTask);
    return;
  }

  // Swap datasheet and PDF together so the two can never disagree.
  const previousTask = state.loadingTask;
  state.datasheet = ds;
  state.pdfDoc = pdfDoc;
  state.loadingTask = loadingTask;
  releaseTask(previousTask);
  showStatus(state.decodersMissing ? DECODER_NOTICE : '');

  els.pageSelect.replaceChildren();
  (ds.pages ?? []).forEach((p, idx) => {
    const printed = p.printedPage && String(p.printedPage) !== String(p.pageNumber)
      ? ` (printed page ${p.printedPage})` : '';
    const opt = el('option', '', `Page ${p.pageNumber}${printed}`);
    opt.value = String(idx);
    els.pageSelect.append(opt);
  });
  els.totalPages.textContent = String(pdfDoc.numPages);

  await showPage(0);
}

/* ---------------------------- page display --------------------------- */

async function showPage(index) {
  const ds = state.datasheet;
  if (!ds || !state.pdfDoc || !ds.pages?.[index]) return;

  const token = ++state.pageToken;
  dismissAll();
  cancelRender();

  const pageMeta = ds.pages[index];
  let page;
  try {
    page = await state.pdfDoc.getPage(pageMeta.pageNumber);
  } catch (err) {
    if (token !== state.pageToken) return;
    fail(UNAVAILABLE_MSG, `Failed to open page ${pageMeta.pageNumber} of ${ds.documentPath}`, err);
    return;
  }
  if (token !== state.pageToken) return;

  state.pageIndex = index;
  state.page = page;
  state.pageMeta = pageMeta;
  if (state.fitWidth) state.scale = fitScale();

  els.currentPage.textContent = String(pageMeta.pageNumber);
  els.pageSelect.value = String(index);
  els.prev.disabled = index <= 0;
  els.next.disabled = index >= ds.pages.length - 1;

  applyGeometry();      // size the canvas box and overlay
  buildHotspots(pageMeta);
  await renderCanvas(); // draw the PDF page itself
}

/* Sets the on-screen size and repositions hotspots. Synchronous, so hotspots
 * follow a zoom immediately while the canvas re-renders in the background. */
function applyGeometry() {
  if (!state.page) return;
  const { width, height } = state.page.getViewport({ scale: state.scale });
  for (const node of [els.canvas, els.overlay]) {
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
  }
  els.zoomLabel.textContent = `${Math.round(state.scale * 100)}%`;
  layoutHotspots();
}

function cancelRender() {
  state.renderToken += 1;
  clearTimeout(state.renderTimer);
  if (state.renderTask) state.renderTask.cancel();
}

function scheduleCanvasRender() {
  clearTimeout(state.renderTimer);
  state.renderTimer = setTimeout(renderCanvas, RERENDER_DELAY_MS);
}

async function renderCanvas() {
  const page = state.page;
  if (!page) return;
  const token = ++state.renderToken;

  const previous = state.renderTask;
  if (previous) {
    previous.cancel();
    try { await previous.promise; } catch { /* cancelled, expected */ }
  }
  if (token !== state.renderToken || page !== state.page) return; // superseded

  const viewport = page.getViewport({ scale: state.scale });
  const dpr = window.devicePixelRatio || 1;
  const canvas = els.canvas;
  canvas.width = Math.floor(viewport.width * dpr);   // sharp on high-DPI screens
  canvas.height = Math.floor(viewport.height * dpr);
  const params = { canvasContext: canvas.getContext('2d'), viewport };
  if (dpr !== 1) params.transform = [dpr, 0, 0, dpr, 0, 0];

  const task = page.render(params);
  state.renderTask = task;
  try {
    await task.promise;
  } catch (err) {
    if (err?.name === 'RenderingCancelledException') return;
    fail(UNAVAILABLE_MSG, `Failed to render page ${page.pageNumber}`, err);
  } finally {
    if (state.renderTask === task) state.renderTask = null;
  }
}

/* -------------------------------- zoom ------------------------------- */

function fitScale() {
  if (!state.page) return state.scale;
  const pageWidth = state.page.getViewport({ scale: 1 }).width;
  const available = els.wrap.clientWidth - 24; // matches 12px padding each side
  return clamp(available / pageWidth, MIN_SCALE, MAX_SCALE);
}

function setScale(next) {
  if (!state.page) return;
  state.scale = clamp(Math.round(next * 100) / 100, MIN_SCALE, MAX_SCALE);
  applyGeometry();
  scheduleCanvasRender();
}

/* ------------------------------ hotspots ----------------------------- */

function hotspotLabel(rec) {
  return rec.kind === 'figure'
    ? `${rec.figureNumber ?? 'Figure'}: ${rec.title ?? ''}`
    : `${rec.symbol ?? rec.id}: ${rec.name ?? ''}`;
}

function buildHotspots(pageMeta) {
  els.overlay.replaceChildren();
  state.hotspots = [];

  const records = [...(pageMeta.parameters ?? []), ...(pageMeta.figures ?? [])].filter((rec) => {
    if (isBox(rec.bbox)) return true;
    console.warn(`[P2B] Skipping ${rec.id ?? 'a record'}: invalid bbox`, rec.bbox);
    return false;
  });

  // Smaller boxes stack on top so they stay clickable inside larger ones.
  const stacking = new Map([...records].sort((a, b) => area(b) - area(a)).map((rec, i) => [rec, i + 1]));
  // Tab order follows reading order.
  records.sort((a, b) => a.bbox.y - b.bbox.y || a.bbox.x - b.bbox.x);

  for (const rec of records) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `hotspot hotspot--${rec.kind === 'figure' ? 'figure' : 'parameter'}`;
    btn.dataset.id = rec.id;
    btn.style.zIndex = String(stacking.get(rec));
    btn.setAttribute('aria-label', hotspotLabel(rec));
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('mouseenter', () => openTooltip(rec, btn));
    btn.addEventListener('focus', () => openTooltip(rec, btn));
    btn.addEventListener('mouseleave', restoreTooltip);
    btn.addEventListener('blur', restoreTooltip);
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      togglePin(rec, btn);
    });
    els.overlay.append(btn);
    state.hotspots.push({ rec, btn });
  }
  layoutHotspots();
}

/* Bounding boxes in the JSON are unscaled PDF points measured from the
 * top-left of the page, so on screen: position = value * current scale. */
function layoutHotspots() {
  const startedAt = performance.now();
  const s = state.scale;
  for (const { rec, btn } of state.hotspots) {
    const b = rec.bbox;
    btn.style.left = `${b.x * s}px`;
    btn.style.top = `${b.y * s}px`;
    btn.style.width = `${b.width * s}px`;
    btn.style.height = `${b.height * s}px`;
  }
  if (state.active) positionTooltip();
  requestAnimationFrame(() => recordMetric('layout', startedAt));
}

/* ------------------------------ tooltips ----------------------------- */

function labelled(label, text) {
  const p = el('p', 'tip-text');
  p.append(el('strong', '', `${label}: `), document.createTextNode(text));
  return p;
}

function valueTable(rec) {
  const rows = rec.variants?.length ? rec.variants : [{ condition: '', ...rec.valueRange }];
  const unit = rec.valueRange?.unit ?? '';
  const hasCondition = rows.some((r) => r.condition);

  const table = el('table', 'tip-values');
  const headRow = table.createTHead().insertRow();
  for (const h of [...(hasCondition ? ['Condition'] : []), 'Min', 'Typ', 'Max']) {
    const th = el('th', '', h);
    th.scope = 'col';
    headRow.append(th);
  }
  const body = table.createTBody();
  for (const r of rows) {
    const tr = body.insertRow();
    if (hasCondition) {
      const th = el('th', '', r.condition ?? '');
      th.scope = 'row';
      tr.append(th);
    }
    for (const key of ['min', 'typ', 'max']) tr.append(el('td', '', formatValue(r[key], unit)));
  }
  return table;
}

function sourceLine() {
  const ds = state.datasheet;
  const pm = state.pageMeta;
  const printed = pm.printedPage && String(pm.printedPage) !== String(pm.pageNumber)
    ? ` (printed page ${pm.printedPage})` : '';
  return `Source: ${ds.datasheetId}, revision ${ds.datasheetRevision}, page ${pm.pageNumber}${printed}`;
}

function buildTooltipContent(rec) {
  const frag = document.createDocumentFragment();
  if (rec.kind === 'figure') {
    frag.append(el('p', 'tip-title', `${rec.figureNumber ?? 'Figure'}: ${rec.title ?? ''}`));
    if (rec.description) frag.append(el('p', 'tip-text', rec.description));
  } else {
    frag.append(el('p', 'tip-title', `${rec.symbol ?? rec.id}: ${rec.name ?? ''}`));
    if (rec.description) frag.append(el('p', 'tip-text', rec.description));
    if (rec.valueRange || rec.variants?.length) frag.append(valueTable(rec));
    if (rec.testConditions) frag.append(labelled('Test conditions', rec.testConditions));
    if (rec.notes) frag.append(labelled('Note', rec.notes));
  }
  frag.append(el('p', 'tip-source', sourceLine()));
  return frag;
}

function openTooltip(rec, btn) {
  const startedAt = performance.now();
  if (state.active && state.active.btn !== btn) state.active.btn.removeAttribute('aria-describedby');
  els.tooltip.replaceChildren(buildTooltipContent(rec));
  els.tooltip.hidden = false;
  state.active = { rec, btn };
  btn.setAttribute('aria-describedby', els.tooltip.id);
  positionTooltip();
  requestAnimationFrame(() => recordMetric('tooltip', startedAt));
}

function positionTooltip() {
  const { btn } = state.active;
  const tip = els.tooltip;
  const stageW = els.stage.clientWidth;
  const stageH = els.stage.clientHeight;
  const gap = 6;
  const w = tip.offsetWidth;
  const h = tip.offsetHeight;

  let left = btn.offsetLeft;
  if (left + w > stageW - 4) left = stageW - w - 4;
  left = Math.max(4, left);

  let top = btn.offsetTop + btn.offsetHeight + gap;           // below the hotspot
  if (top + h > stageH - 4 && btn.offsetTop - h - gap >= 4) { // no room: go above
    top = btn.offsetTop - h - gap;
  }
  top = Math.max(4, top);

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function closeTooltip() {
  if (state.active) state.active.btn.removeAttribute('aria-describedby');
  state.active = null;
  els.tooltip.hidden = true;
}

function unpin() {
  if (state.pinned) state.pinned.btn.setAttribute('aria-pressed', 'false');
  state.pinned = null;
}

function dismissAll() {
  unpin();
  closeTooltip();
}

/* Leaving a hotspot hides its tooltip, unless another hotspot is pinned. */
function restoreTooltip() {
  if (state.pinned) openTooltip(state.pinned.rec, state.pinned.btn);
  else closeTooltip();
}

function togglePin(rec, btn) {
  if (state.pinned && state.pinned.btn === btn) {
    dismissAll();
    return;
  }
  unpin();
  state.pinned = { rec, btn };
  btn.setAttribute('aria-pressed', 'true');
  openTooltip(rec, btn);
}

/* ------------------------------- events ------------------------------ */

const run = (promise) => promise.catch((err) => fail(UNAVAILABLE_MSG, 'Unexpected viewer error', err));

els.prev.addEventListener('click', () => run(showPage(state.pageIndex - 1)));
els.next.addEventListener('click', () => run(showPage(state.pageIndex + 1)));
els.pageSelect.addEventListener('change', (e) => run(showPage(Number(e.target.value))));
els.datasheetSelect.addEventListener('change', (e) => run(loadDatasheet(e.target.value)));

els.zoomIn.addEventListener('click', () => { state.fitWidth = false; setScale(state.scale + ZOOM_STEP); });
els.zoomOut.addEventListener('click', () => { state.fitWidth = false; setScale(state.scale - ZOOM_STEP); });
els.zoomFit.addEventListener('click', () => { state.fitWidth = true; setScale(fitScale()); });

document.addEventListener('click', dismissAll);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dismissAll(); });

if (typeof ResizeObserver !== 'undefined') {
  let lastWidth = els.wrap.clientWidth;
  new ResizeObserver(() => {
    const width = els.wrap.clientWidth;
    if (width === lastWidth) return;
    lastWidth = width;
    if (state.fitWidth) setScale(fitScale());
  }).observe(els.wrap);
}

/* -------------------------------- start ------------------------------ */

async function init() {
  try {
    state.metadata = await loadMetadata();
  } catch (err) {
    clearView();
    fail(UNAVAILABLE_MSG, err.message, err);
    return;
  }
  populateDatasheetSelect();
  await checkDecoderFiles();
  await loadDatasheet(state.metadata.datasheets[0].datasheetId);
}

init().catch((err) => fail(UNAVAILABLE_MSG, 'Unexpected viewer error', err));