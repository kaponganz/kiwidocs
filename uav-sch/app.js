// KIWI Wiring Editor — app.js

const SVG_NS = 'http://www.w3.org/2000/svg';
const GRID = 10;

function snap(v) { return Math.round(v / GRID) * GRID; }

// port group colors
const GROUP_COLORS = {
  uart: '#4CAF50',
  pwm: '#FF9800',
  power: '#F44336',
  gpio: '#9C27B0',
  i2c: '#00BCD4',
  video: '#2196F3',
  gnd: '#607D8B',
};

const GROUP_NAMES = Object.keys(GROUP_COLORS);

// wire color presets — common wire colors
const WIRE_PRESETS = [
  { color: '#FF0000', label: 'Red' },
  { color: '#000000', label: 'Black' },
  { color: '#FFCC00', label: 'Yellow' },
  { color: '#FFFFFF', label: 'White' },
  { color: '#4CAF50', label: 'Green' },
  { color: '#2196F3', label: 'Blue' },
  { color: '#FF9800', label: 'Orange' },
  { color: '#9C27B0', label: 'Purple' },
];

// board definitions
// sp() scales native image coords to displayed size
function sp(x, y, nativeW, displayW) {
  const s = displayW / nativeW;
  return { x: Math.round(x * s), y: Math.round(y * s) };
}

// helper: spread N ports evenly along an edge
function edgePorts(ids, edge, boardW, boardH) {
  const margin = 20;
  return ids.map((def, i) => {
    const t = (i + 1) / (ids.length + 1);
    let pos;
    if (edge === 'top')    pos = { x: Math.round(margin + t * (boardW - 2 * margin)), y: 8 };
    if (edge === 'bottom') pos = { x: Math.round(margin + t * (boardW - 2 * margin)), y: boardH - 8 };
    if (edge === 'left')   pos = { x: 8, y: Math.round(margin + t * (boardH - 2 * margin)) };
    if (edge === 'right')  pos = { x: boardW - 8, y: Math.round(margin + t * (boardH - 2 * margin)) };
    return { ...def, pos, side: edge };
  });
}

const BOARDS = {
  'kiwif405-12s': {
    name: 'KIWI F405 12S',
    images: { top: 'img/kiwif405-top.png' },
    width: 400,
    height: 407,
    ports: [],
  },

  'kiwih743': {
    name: 'KIWI H743',
    images: { top: 'img/KiwiH743.jpg' },
    width: 400,
    height: 225,  // 1067x600 native, scaled to 400w
    ports: [],
  },

  'kiwih743-wing': {
    name: 'KIWI H743 Wing',
    images: {
      top: 'img/h743-wing-fc.jpg',
      bottom: 'img/h743-wing-fc-bot.jpg',
    },
    width: 400,
    height: 400,  // 640x640 native
    ports: [],
  },
};

// peripheral type definitions
// Lucide icons (24x24 viewbox, ISC license)
// each entry is an array of path strings + optional circles
const DEVICE_ICONS = {
  gps: {
    paths: [
      'm13.5 6.5-3.148-3.148a1.205 1.205 0 0 0-1.704 0L6.352 5.648a1.205 1.205 0 0 0 0 1.704L9.5 10.5',
      'M16.5 7.5 19 5',
      'm17.5 10.5 3.148 3.148a1.205 1.205 0 0 1 0 1.704l-2.296 2.296a1.205 1.205 0 0 1-1.704 0L13.5 14.5',
      'M9 21a6 6 0 0 0-6-6',
      'M9.352 10.648a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l4.296-4.296a1.205 1.205 0 0 0 0-1.704l-2.296-2.296a1.205 1.205 0 0 0-1.704 0z',
    ],
  },
  receiver: {
    paths: [
      'M4.9 16.1C1 12.2 1 5.8 4.9 1.9',
      'M7.8 4.7a6.14 6.14 0 0 0-.8 7.5',
      'M16.2 4.8c2 2 2.26 5.11.8 7.47',
      'M19.1 1.9a9.96 9.96 0 0 1 0 14.1',
      'M9.5 18h5',
      'm8 22 4-11 4 11',
    ],
    circles: [{ cx: 12, cy: 9, r: 2 }],
  },
  vtx: {
    paths: [
      'M4.9 16.1C1 12.2 1 5.8 4.9 1.9',
      'M7.8 4.7a6.14 6.14 0 0 0-.8 7.5',
      'M16.2 4.8c2 2 2.26 5.11.8 7.47',
      'M19.1 1.9a9.96 9.96 0 0 1 0 14.1',
      'M9.5 18h5',
      'm8 22 4-11 4 11',
    ],
    circles: [{ cx: 12, cy: 9, r: 2 }],
  },
  camera: {
    paths: [
      'M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z',
    ],
    circles: [{ cx: 12, cy: 13, r: 3 }],
  },
  esc: {
    paths: [
      'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
    ],
  },
  servo: {
    paths: [
      'M11 10.27 7 3.34', 'm11 13.73-4 6.93',
      'M12 22v-2', 'M12 2v2', 'M14 12h8',
      'm17 20.66-1-1.73', 'm17 3.34-1 1.73',
      'M2 12h2',
      'm20.66 17-1.73-1', 'm20.66 7-1.73 1',
      'm3.34 17 1.73-1', 'm3.34 7 1.73 1',
    ],
    circles: [{ cx: 12, cy: 12, r: 2 }, { cx: 12, cy: 12, r: 8 }],
  },
  compass: {
    paths: [
      'm16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z',
    ],
    circles: [{ cx: 12, cy: 12, r: 10 }],
  },
  telemetry: {
    paths: [
      'M16.247 7.761a6 6 0 0 1 0 8.478',
      'M19.075 4.933a10 10 0 0 1 0 14.134',
      'M4.925 19.067a10 10 0 0 1 0-14.134',
      'M7.753 16.239a6 6 0 0 1 0-8.478',
    ],
    circles: [{ cx: 12, cy: 12, r: 2 }],
  },
  buzzer: {
    paths: [
      'M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z',
      'M16 9a5 5 0 0 1 0 6',
      'M19.364 18.364a9 9 0 0 0 0-12.728',
    ],
  },
  battery: {
    paths: ['M 22 14 L 22 10'],
    rects: [{ x: 2, y: 6, width: 16, height: 12, rx: 2 }],
  },
};

const DEVICE_TYPES = {
  gps:       { name: 'GPS Module',      color: '#E8F5E9', ports: ['TX','RX','VCC','GND'] },
  receiver:  { name: 'RC Receiver',     color: '#FFF3E0', ports: ['SBUS/CRSF','VCC','GND'] },
  vtx:       { name: 'Video TX',        color: '#E3F2FD', ports: ['Video In','SmartAudio','VCC','GND'] },
  camera:    { name: 'FPV Camera',      color: '#FCE4EC', ports: ['Video Out','VCC','GND'] },
  esc:       { name: '4-in-1 ESC',      color: '#FBE9E7', ports: ['M1','M2','M3','M4','Telem','VBAT','GND'] },
  servo:     { name: 'Servo',           color: '#F3E5F5', ports: ['Signal','VCC','GND'] },
  compass:   { name: 'Ext Compass',     color: '#E0F7FA', ports: ['SCL','SDA','VCC','GND'] },
  telemetry: { name: 'Telemetry Radio', color: '#E8EAF6', ports: ['TX','RX','VCC','GND'] },
  buzzer:    { name: 'Buzzer',          color: '#FFF8E1', ports: ['+','GND'] },
  battery:   { name: 'Battery',         color: '#FFEBEE', ports: ['+','-'] },
};

// state
let state = {
  boardId: 'kiwif405-12s',
  boardPos: { x: 0, y: 0 },
  customPorts: [],     // user-added board ports
  portOverrides: {},   // {portId: {x, y}} for moved built-in ports
  components: [],
  wires: [],
};

let nextId = 1;
let nextPortId = 1;
let selectedEl = null;
let wiringSource = null;
let boardSide = 'top';  // 'top' or 'bottom'
let svg, boardGroup, wiresGroup, componentsGroup, waypointsGroup;

// zoom/pan state
let vb = { x: 0, y: 0, w: 0, h: 0 };
let isPanning = false;
let panStart = null;

// init
document.addEventListener('DOMContentLoaded', () => {
  svg = document.getElementById('canvas');
  buildSidebar();
  initCanvas();
  renderBoard();
  bindToolbar();
  bindKeys();
  setupBoardUpload();
  document.getElementById('btn-flip-board').addEventListener('click', flipBoard);
  document.getElementById('wire-color').addEventListener('input', (e) => {
    if (selectedEl && selectedEl.wire) {
      selectedEl.wire.color = e.target.value;
      selectedEl.wire._el.setAttribute('stroke', e.target.value);
    }
  });
  setStatus('Ready — click a device to place, click ports to wire, Shift+click board to add pin');
});

function buildSidebar() {
  const boardList = document.getElementById('board-list');
  for (const [id, b] of Object.entries(BOARDS)) {
    const el = document.createElement('div');
    el.className = 'palette-item';
    el.innerHTML = `<span class="palette-swatch" style="background:#0d9488"></span>${b.name}`;
    el.onclick = () => selectBoard(id);
    boardList.appendChild(el);
  }

  const deviceList = document.getElementById('device-list');
  for (const [id, d] of Object.entries(DEVICE_TYPES)) {
    const el = document.createElement('div');
    el.className = 'palette-item';
    el.innerHTML = `<span class="palette-swatch" style="background:${d.color}; border:1px solid rgba(0,0,0,0.15)"></span>${d.name}`;
    el.onclick = () => addComponent(id);
    deviceList.appendChild(el);
  }

  // wire color presets
  const presets = document.getElementById('color-presets');
  const picker = document.getElementById('wire-color');
  for (const p of WIRE_PRESETS) {
    const swatch = document.createElement('div');
    swatch.className = 'color-preset';
    swatch.style.background = p.color;
    swatch.title = p.label;
    if (p.color === '#FFFFFF') swatch.classList.add('color-preset-light');
    swatch.onclick = () => {
      picker.value = p.color;
      // highlight active
      presets.querySelectorAll('.color-preset').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      // update selected wire if any
      if (selectedEl && selectedEl.wire) {
        selectedEl.wire.color = p.color;
        selectedEl.wire._el.setAttribute('stroke', p.color);
      }
    };
    presets.appendChild(swatch);
  }
  // select first preset
  presets.querySelector('.color-preset').classList.add('active');
}

function selectBoard(id) {
  state.boardId = id;
  boardSide = 'top';
  clearAll();
  renderBoard();
}

function updateFlipButton(board) {
  const btn = document.getElementById('btn-flip-board');
  const hasBottom = board.images && board.images.bottom;
  btn.style.display = hasBottom ? 'block' : 'none';
  btn.textContent = boardSide === 'top' ? 'Show Bottom' : 'Show Top';
}

function flipBoard() {
  boardSide = boardSide === 'top' ? 'bottom' : 'top';
  renderBoard();
  rerenderWires();
  setStatus(`Showing ${boardSide} side`);
}

// upload a custom board image
function setupBoardUpload() {
  document.getElementById('btn-upload-board').addEventListener('click', () => {
    document.getElementById('board-image-input').click();
  });

  document.getElementById('board-image-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // scale to max 500px width
        const maxW = 500;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const name = file.name.replace(/\.[^.]+$/, '');
        const id = 'custom-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-');

        BOARDS[id] = {
          name: name,
          images: { top: ev.target.result },
          width: w,
          height: h,
          ports: [],
        };

        // add to sidebar
        const boardList = document.getElementById('board-list');
        const el = document.createElement('div');
        el.className = 'palette-item';
        el.innerHTML = `<span class="palette-swatch" style="background:#0d9488"></span>${name}`;
        el.onclick = () => selectBoard(id);
        boardList.appendChild(el);

        // switch to it
        selectBoard(id);
        setStatus(`Board "${name}" loaded (${w}x${h}) — Shift+click to add ports`);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
}

function initCanvas() {
  // set initial viewBox to match element size
  const rect = svg.getBoundingClientRect();
  vb = { x: 0, y: 0, w: rect.width, h: rect.height };
  applyViewBox();

  boardGroup = createSvgEl('g', { id: 'board-layer' });
  wiresGroup = createSvgEl('g', { id: 'wires-layer' });
  waypointsGroup = createSvgEl('g', { id: 'waypoints-layer' });
  componentsGroup = createSvgEl('g', { id: 'components-layer' });
  svg.appendChild(boardGroup);
  svg.appendChild(wiresGroup);
  svg.appendChild(waypointsGroup);
  svg.appendChild(componentsGroup);

  svg.addEventListener('pointerdown', (e) => {
    // middle mouse button → pan
    if (e.button === 1) {
      e.preventDefault();
      isPanning = true;
      panStart = { x: e.clientX, y: e.clientY, vbx: vb.x, vby: vb.y };
      svg.setPointerCapture(e.pointerId);
      return;
    }
    if (e.target === svg) {
      deselect();
      cancelWiring();
    }
  });

  svg.addEventListener('pointermove', (e) => {
    if (!isPanning) return;
    // convert pixel delta to viewBox delta
    const rect = svg.getBoundingClientRect();
    const sx = vb.w / rect.width;
    const sy = vb.h / rect.height;
    vb.x = panStart.vbx - (e.clientX - panStart.x) * sx;
    vb.y = panStart.vby - (e.clientY - panStart.y) * sy;
    applyViewBox();
  });

  svg.addEventListener('pointerup', (e) => {
    if (isPanning) {
      isPanning = false;
      panStart = null;
    }
  });

  // zoom toward cursor on scroll
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
    // cursor position in viewBox coords
    const rect = svg.getBoundingClientRect();
    const mx = vb.x + (e.clientX - rect.left) / rect.width * vb.w;
    const my = vb.y + (e.clientY - rect.top) / rect.height * vb.h;
    // scale around cursor
    vb.x = mx - (mx - vb.x) * zoomFactor;
    vb.y = my - (my - vb.y) * zoomFactor;
    vb.w *= zoomFactor;
    vb.h *= zoomFactor;
    applyViewBox();
  }, { passive: false });

  // prevent middle-click paste/scroll
  svg.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
}

function applyViewBox() {
  svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
}

// render board image + all port dots (built-in + custom)
function renderBoard() {
  boardGroup.innerHTML = '';
  const board = BOARDS[state.boardId];
  if (!board) return;

  const bx = vb.x + (vb.w - board.width) / 2;
  const by = vb.y + (vb.h - board.height) / 2;
  state.boardPos = { x: bx, y: by };

  const g = createSvgEl('g', { transform: `translate(${bx},${by})`, id: 'board-g' });

  // resolve image: support both old `image` and new `images` format
  const imageSrc = board.images
    ? (board.images[boardSide] || board.images.top)
    : board.image;
  // update flip button visibility
  updateFlipButton(board);

  const img = createSvgEl('image', {
    href: imageSrc,
    width: board.width,
    height: board.height,
  });
  // shift+click on board image to add custom port
  img.addEventListener('pointerdown', (e) => {
    if (e.shiftKey) {
      e.stopPropagation();
      const pt = svgPoint(e);
      const localX = pt.x - state.boardPos.x;
      const localY = pt.y - state.boardPos.y;
      showAddPortDialog(localX, localY);
    }
  });
  g.appendChild(img);

  // render built-in ports
  for (const port of board.ports) {
    renderPortDot(g, port, `board.${port.id}`);
  }
  // render custom ports
  for (const port of state.customPorts) {
    renderPortDot(g, port, `board.${port.id}`);
  }

  boardGroup.appendChild(g);
}

function renderPortDot(parentG, port, fullId) {
  const color = GROUP_COLORS[port.group] || '#999';
  const dot = createSvgEl('circle', {
    cx: port.pos.x, cy: port.pos.y, r: 5,
    fill: color, class: 'port-dot',
    'data-port-id': fullId,
  });
  const title = createSvgEl('title');
  title.textContent = port.label;
  dot.appendChild(title);

  // label element
  const labelPos = portLabelOffset(port);
  const label = createSvgEl('text', {
    x: labelPos.x, y: labelPos.y, class: 'port-label',
    'text-anchor': labelPos.anchor,
    'dominant-baseline': labelPos.baseline,
  });
  label.textContent = port.label;

  // Shift+drag to reposition port, normal click to wire
  let portDragging = false;
  dot.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (e.shiftKey) {
      portDragging = true;
      dot.setPointerCapture(e.pointerId);
      setStatus(`Moving port "${port.label}" — release to place`);
      // track moved ports so we save their overrides
      if (!state.portOverrides) state.portOverrides = {};
      return;
    }
    handlePortClick(fullId, dot);
  });
  dot.addEventListener('pointermove', (e) => {
    if (!portDragging) return;
    const pt = svgPoint(e);
    const localX = pt.x - state.boardPos.x;
    const localY = pt.y - state.boardPos.y;
    port.pos.x = Math.round(localX);
    port.pos.y = Math.round(localY);
    dot.setAttribute('cx', port.pos.x);
    dot.setAttribute('cy', port.pos.y);
    // update label position
    const lp = portLabelOffset(port);
    label.setAttribute('x', lp.x);
    label.setAttribute('y', lp.y);
    label.setAttribute('text-anchor', lp.anchor);
    label.setAttribute('dominant-baseline', lp.baseline);
    // update connected wires
    updateAllWires();
  });
  dot.addEventListener('pointerup', () => {
    if (portDragging) {
      portDragging = false;
      // record override
      if (!state.portOverrides) state.portOverrides = {};
      state.portOverrides[port.id] = { x: port.pos.x, y: port.pos.y };
      // auto-detect side
      const board = BOARDS[state.boardId];
      port.side = detectSide(port.pos, board);
      setStatus(`Port "${port.label}" moved to (${port.pos.x}, ${port.pos.y})`);
    }
  });

  parentG.appendChild(dot);
  parentG.appendChild(label);
}

function portLabelOffset(port) {
  let x = port.pos.x, y = port.pos.y, anchor = 'middle', baseline = 'central';
  if (port.side === 'top')         { y -= 10; baseline = 'auto'; }
  else if (port.side === 'bottom') { y += 14; baseline = 'hanging'; }
  else if (port.side === 'left')   { x -= 10; anchor = 'end'; }
  else if (port.side === 'right')  { x += 10; anchor = 'start'; }
  return { x, y, anchor, baseline };
}

function detectSide(pos, board) {
  const margin = 40;
  if (pos.y < margin) return 'top';
  if (pos.y > board.height - margin) return 'bottom';
  if (pos.x < margin) return 'left';
  if (pos.x > board.width - margin) return 'right';
  return 'top';
}

// dialog to add a custom port on the board
function showAddPortDialog(localX, localY) {
  const label = prompt('New port label (e.g. "5V", "GND", "BUZZER"):');
  if (!label || !label.trim()) return;

  const groupChoice = prompt(
    `Port group? (${GROUP_NAMES.join(', ')}):`,
    'gpio'
  );
  if (!groupChoice || !GROUP_COLORS[groupChoice]) {
    alert('Invalid group. Use one of: ' + GROUP_NAMES.join(', '));
    return;
  }

  // determine side based on position
  const board = BOARDS[state.boardId];
  let side = 'top';
  const margin = 40;
  if (localY < margin) side = 'top';
  else if (localY > board.height - margin) side = 'bottom';
  else if (localX < margin) side = 'left';
  else if (localX > board.width - margin) side = 'right';
  else side = 'top'; // interior pin

  const id = `custom-${nextPortId++}`;
  const port = {
    id,
    label: label.trim(),
    group: groupChoice,
    pos: { x: Math.round(localX), y: Math.round(localY) },
    side,
    custom: true,
  };
  state.customPorts.push(port);

  // re-render to show new port
  renderBoard();
  rerenderWires();
  setStatus(`Added port "${port.label}" — click to wire`);
}

// get absolute position of a port
function getPortPos(portId) {
  const [owner, pid] = portId.split('.');
  if (owner === 'board') {
    const board = BOARDS[state.boardId];
    // check built-in ports
    let port = board.ports.find(p => p.id === pid);
    // check custom ports
    if (!port) port = state.customPorts.find(p => p.id === pid);
    if (!port) return null;
    return { x: state.boardPos.x + port.pos.x, y: state.boardPos.y + port.pos.y };
  }
  const comp = state.components.find(c => c.id === owner);
  if (!comp) return null;
  const portDef = comp._portPositions?.[pid];
  if (!portDef) return null;
  return { x: comp.position.x + portDef.x, y: comp.position.y + portDef.y };
}

// add a component
function addComponent(typeId) {
  const def = DEVICE_TYPES[typeId];
  if (!def) return;

  const id = `${typeId}${nextId++}`;
  const board = BOARDS[state.boardId];
  const rect = svg.getBoundingClientRect();
  const bx = state.boardPos.x + board.width / 2;
  const by = state.boardPos.y + board.height / 2;
  const angle = Math.random() * Math.PI * 2;
  const dist = board.width * 0.7 + Math.random() * 80;

  const comp = {
    id, type: typeId, label: def.name,
    position: {
      x: snap(Math.max(20, Math.min(rect.width - 140, bx + Math.cos(angle) * dist - 60))),
      y: snap(Math.max(20, Math.min(rect.height - 60, by + Math.sin(angle) * dist - 30))),
    },
  };
  state.components.push(comp);
  renderComponent(comp);
  setStatus(`Placed ${def.name} — drag to position, click ports to wire`);
}

function renderComponent(comp) {
  const def = DEVICE_TYPES[comp.type];
  if (!def) return;

  const portCount = def.ports.length;
  const portSpacing = GRID; // one grid cell per port
  const iconExtra = DEVICE_ICONS[comp.type] ? 26 : 0;
  const labelW = comp.label.length * 7.5 + 30 + iconExtra;
  const portsW = (portCount - 1) * portSpacing + GRID * 2;
  const w = snap(Math.max(labelW, portsW, GRID * 5));
  const h = GRID * 3; // 60px — 3 grid cells tall

  const portPositions = {};
  const startX = snap((w - (portCount - 1) * portSpacing) / 2);
  def.ports.forEach((pName, i) => {
    const pid = pName.toLowerCase().replace(/[^a-z0-9]/g, '');
    portPositions[pid] = { x: startX + i * portSpacing, y: h };
  });
  comp._portPositions = portPositions;

  const g = createSvgEl('g', {
    class: 'component-group',
    transform: `translate(${comp.position.x},${comp.position.y})`,
    'data-comp-id': comp.id,
  });

  const rect = createSvgEl('rect', {
    width: w, height: h, fill: def.color, class: 'component-rect',
  });
  g.appendChild(rect);

  // icon + label
  const iconDef = DEVICE_ICONS[comp.type];
  const hasIcon = !!iconDef;
  const iconSize = 20;
  const iconGap = 5;
  // rough text width for centering icon+label group
  const textW = comp.label.length * 7;
  const totalW = hasIcon ? iconSize + iconGap + textW : textW;
  const labelX0 = (w - totalW) / 2;

  if (hasIcon) {
    const scale = iconSize / 24;
    const iconG = createSvgEl('g', {
      transform: `translate(${labelX0},${18 - iconSize / 2 - 1}) scale(${scale})`,
      fill: 'none', stroke: '#64748b', 'stroke-width': '2',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    });
    if (iconDef.paths) {
      for (const d of iconDef.paths) {
        iconG.appendChild(createSvgEl('path', { d }));
      }
    }
    if (iconDef.circles) {
      for (const c of iconDef.circles) {
        iconG.appendChild(createSvgEl('circle', { cx: c.cx, cy: c.cy, r: c.r }));
      }
    }
    if (iconDef.rects) {
      for (const r of iconDef.rects) {
        iconG.appendChild(createSvgEl('rect', { x: r.x, y: r.y, width: r.width, height: r.height, rx: r.rx || 0 }));
      }
    }
    g.appendChild(iconG);
  }

  const label = createSvgEl('text', {
    x: hasIcon ? labelX0 + iconSize + iconGap : w / 2,
    y: 18,
    class: 'component-label',
    'text-anchor': hasIcon ? 'start' : 'middle',
  });
  label.textContent = comp.label;
  g.appendChild(label);

  for (const [pid, pos] of Object.entries(portPositions)) {
    const portName = def.ports.find(p => p.toLowerCase().replace(/[^a-z0-9]/g, '') === pid) || pid;
    const dot = createSvgEl('circle', {
      cx: pos.x, cy: pos.y, r: 5, fill: '#64748b', class: 'port-dot',
      'data-port-id': `${comp.id}.${pid}`,
    });
    const title = createSvgEl('title');
    title.textContent = portName;
    dot.appendChild(title);
    dot.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      handlePortClick(`${comp.id}.${pid}`, dot);
    });
    g.appendChild(dot);

    const pl = createSvgEl('text', {
      x: pos.x, y: pos.y + 13, class: 'port-label',
      'text-anchor': 'middle', 'dominant-baseline': 'hanging',
    });
    pl.textContent = portName;
    g.appendChild(pl);
  }

  comp._el = g;
  comp._width = w;
  comp._height = h;

  setupDrag(g, comp);
  g.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('port-dot')) return;
    select(g, comp);
  });
  g.addEventListener('dblclick', (e) => {
    e.preventDefault();
    const newLabel = prompt('Rename component:', comp.label);
    if (newLabel && newLabel.trim()) {
      comp.label = newLabel.trim();
      label.textContent = comp.label;
    }
  });

  componentsGroup.appendChild(g);
}

function setupDrag(g, comp) {
  let dragging = false;
  let startMouse, startPos;

  g.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('port-dot')) return;
    dragging = true;
    g.classList.add('dragging');
    startMouse = svgPoint(e);
    startPos = { ...comp.position };
    g.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  g.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const pt = svgPoint(e);
    comp.position.x = snap(startPos.x + (pt.x - startMouse.x));
    comp.position.y = snap(startPos.y + (pt.y - startMouse.y));
    g.setAttribute('transform', `translate(${comp.position.x},${comp.position.y})`);
    updateAllWires();
  });
  g.addEventListener('pointerup', () => {
    dragging = false;
    g.classList.remove('dragging');
  });
}

// wiring
function handlePortClick(portId, dotEl) {
  if (!wiringSource) {
    wiringSource = { portId, dotEl };
    dotEl.classList.add('active');
    setStatus(`Wiring from ${portId} — click target port or ESC to cancel`);
  } else {
    if (wiringSource.portId === portId) { cancelWiring(); return; }
    const color = document.getElementById('wire-color').value;
    const wire = {
      from: wiringSource.portId,
      to: portId,
      color,
      label: '',
      waypoints: [],  // [{x,y}, ...] intermediate bend points
    };
    state.wires.push(wire);
    renderWire(wire);
    wiringSource.dotEl.classList.remove('active');
    wiringSource = null;
    setStatus('Wire connected — double-click wire to add bend point');
  }
}

function cancelWiring() {
  if (wiringSource) {
    wiringSource.dotEl.classList.remove('active');
    wiringSource = null;
    setStatus('Wiring cancelled');
  }
}

// build polyline points string from wire
function wirePoints(wire) {
  const from = getPortPos(wire.from);
  const to = getPortPos(wire.to);
  if (!from || !to) return null;
  const pts = [from, ...(wire.waypoints || []), to];
  return pts.map(p => `${p.x},${p.y}`).join(' ');
}

function renderWire(wire) {
  const pts = wirePoints(wire);
  if (!pts) return;

  const line = createSvgEl('polyline', {
    points: pts,
    stroke: wire.color,
    class: 'wire',
    'data-wire-from': wire.from,
    'data-wire-to': wire.to,
  });

  line.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    select(line, null, wire);
  });

  // double-click to add waypoint
  line.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    const pt = svgPoint(e);
    addWaypoint(wire, pt.x, pt.y);
  });

  wire._el = line;
  wiresGroup.appendChild(line);
  renderWaypointHandles(wire);
}

// render draggable handles for wire waypoints
function renderWaypointHandles(wire) {
  // clear old handles
  if (wire._wpHandles) {
    wire._wpHandles.forEach(h => h.remove());
  }
  wire._wpHandles = [];

  if (!wire.waypoints || wire.waypoints.length === 0) return;

  wire.waypoints.forEach((wp, idx) => {
    const handle = createSvgEl('circle', {
      cx: wp.x, cy: wp.y, r: 5,
      fill: wire.color, stroke: '#fff', 'stroke-width': 2,
      class: 'waypoint-handle',
      cursor: 'grab',
    });

    let dragging = false, startMouse;

    handle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      dragging = true;
      startMouse = svgPoint(e);
      handle.setPointerCapture(e.pointerId);
      select(wire._el, null, wire);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const pt = svgPoint(e);
      wp.x = snap(pt.x);
      wp.y = snap(pt.y);
      handle.setAttribute('cx', wp.x);
      handle.setAttribute('cy', wp.y);
      updateWire(wire);
    });
    handle.addEventListener('pointerup', () => { dragging = false; });

    // double-click waypoint handle to remove it
    handle.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      wire.waypoints.splice(idx, 1);
      updateWire(wire);
      renderWaypointHandles(wire);
      setStatus('Waypoint removed');
    });

    waypointsGroup.appendChild(handle);
    wire._wpHandles.push(handle);
  });
}

function addWaypoint(wire, x, y) {
  if (!wire.waypoints) wire.waypoints = [];

  // insert waypoint at the closest segment
  const from = getPortPos(wire.from);
  const to = getPortPos(wire.to);
  if (!from || !to) return;

  const allPts = [from, ...wire.waypoints, to];
  let bestIdx = 0, bestDist = Infinity;

  for (let i = 0; i < allPts.length - 1; i++) {
    const d = distToSegment({ x, y }, allPts[i], allPts[i + 1]);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }

  wire.waypoints.splice(bestIdx, 0, { x: snap(x), y: snap(y) });
  updateWire(wire);
  renderWaypointHandles(wire);
  setStatus('Waypoint added — drag to bend, double-click to remove');
}

function updateWire(wire) {
  if (!wire._el) return;
  const pts = wirePoints(wire);
  if (pts) wire._el.setAttribute('points', pts);
}

function updateAllWires() {
  for (const wire of state.wires) {
    updateWire(wire);
    // also update waypoint handle positions (waypoints are absolute coords, no update needed)
  }
}

function rerenderWires() {
  wiresGroup.innerHTML = '';
  waypointsGroup.innerHTML = '';
  for (const wire of state.wires) {
    renderWire(wire);
  }
}

// selection
function select(el, comp, wire) {
  deselect();
  el.classList.add('selected');
  selectedEl = { el, comp, wire };
  // sync color picker to selected wire
  if (wire) {
    document.getElementById('wire-color').value = wire.color;
  }
}

function deselect() {
  if (selectedEl) {
    selectedEl.el.classList.remove('selected');
    selectedEl = null;
  }
}

// keyboard
function bindKeys() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cancelWiring();
      deselect();
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (document.activeElement.tagName === 'INPUT') return;
      e.preventDefault();
      deleteSelected();
    }
  });
}

function deleteSelected() {
  if (!selectedEl) return;

  if (selectedEl.wire) {
    const wire = selectedEl.wire;
    if (wire._el) wire._el.remove();
    if (wire._wpHandles) wire._wpHandles.forEach(h => h.remove());
    state.wires = state.wires.filter(w => w !== wire);
    setStatus('Wire deleted');
  } else if (selectedEl.comp) {
    const comp = selectedEl.comp;
    const toRemove = state.wires.filter(w =>
      w.from.startsWith(comp.id + '.') || w.to.startsWith(comp.id + '.')
    );
    for (const wire of toRemove) {
      if (wire._el) wire._el.remove();
      if (wire._wpHandles) wire._wpHandles.forEach(h => h.remove());
    }
    state.wires = state.wires.filter(w => !toRemove.includes(w));
    if (comp._el) comp._el.remove();
    state.components = state.components.filter(c => c !== comp);
    setStatus(`Deleted ${comp.label}`);
  }
  selectedEl = null;
}

// toolbar
function bindToolbar() {
  document.getElementById('btn-new').addEventListener('click', () => {
    if (state.components.length > 0 || state.wires.length > 0) {
      if (!confirm('Clear current diagram?')) return;
    }
    clearAll();
    renderBoard();
    setStatus('New diagram');
  });

  document.getElementById('btn-save').addEventListener('click', saveDiagram);

  document.getElementById('btn-open').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });

  document.getElementById('file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        loadDiagram(ev.target.result);
        setStatus(`Loaded ${file.name}`);
      } catch (err) {
        alert('Failed to load YAML: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}

function saveDiagram() {
  const board = BOARDS[state.boardId];
  // if it's a custom-uploaded board, save its image data URL
  const isCustomBoard = state.boardId.startsWith('custom-');
  const data = {
    name: 'My Diagram',
    board: state.boardId,
    board_position: { x: Math.round(state.boardPos.x), y: Math.round(state.boardPos.y) },
    ...(isCustomBoard && board ? {
      board_image: board.images ? board.images.top : board.image,
      board_size: { width: board.width, height: board.height },
      board_name: board.name,
    } : {}),
    port_overrides: state.portOverrides && Object.keys(state.portOverrides).length > 0
      ? state.portOverrides : undefined,
    custom_ports: state.customPorts.map(p => ({
      id: p.id, label: p.label, group: p.group,
      position: { x: p.pos.x, y: p.pos.y },
      side: p.side,
    })),
    components: state.components.map(c => ({
      id: c.id, type: c.type, label: c.label,
      position: { x: Math.round(c.position.x), y: Math.round(c.position.y) },
    })),
    wires: state.wires.map(w => ({
      from: w.from, to: w.to, color: w.color,
      label: w.label || undefined,
      waypoints: w.waypoints && w.waypoints.length > 0
        ? w.waypoints.map(wp => ({ x: Math.round(wp.x), y: Math.round(wp.y) }))
        : undefined,
    })),
  };

  const yaml = jsyaml.dump(data, { lineWidth: 120 });
  const blob = new Blob([yaml], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'diagram.yaml';
  a.click();
  URL.revokeObjectURL(url);
  setStatus('Diagram saved');
}

function loadDiagram(yamlStr) {
  const data = jsyaml.load(yamlStr);
  clearAll();

  state.boardId = data.board || 'kiwif405-12s';

  // restore custom board if needed
  if (data.board_image && !BOARDS[state.boardId]) {
    BOARDS[state.boardId] = {
      name: data.board_name || state.boardId,
      images: { top: data.board_image },
      width: data.board_size?.width || 400,
      height: data.board_size?.height || 400,
      ports: [],
    };
    // add to sidebar
    const boardList = document.getElementById('board-list');
    const el = document.createElement('div');
    el.className = 'palette-item';
    const name = data.board_name || state.boardId;
    el.innerHTML = `<span class="palette-swatch" style="background:#0d9488"></span>${name}`;
    el.onclick = () => selectBoard(state.boardId);
    boardList.appendChild(el);
  }

  // apply port position overrides
  if (data.port_overrides) {
    state.portOverrides = data.port_overrides;
    const board = BOARDS[state.boardId];
    if (board) {
      for (const [pid, pos] of Object.entries(data.port_overrides)) {
        const port = board.ports.find(p => p.id === pid);
        if (port) {
          port.pos.x = pos.x;
          port.pos.y = pos.y;
          port.side = detectSide(port.pos, board);
        }
      }
    }
  }

  // load custom ports
  if (data.custom_ports) {
    for (const p of data.custom_ports) {
      state.customPorts.push({
        id: p.id, label: p.label, group: p.group,
        pos: { x: p.position.x, y: p.position.y },
        side: p.side, custom: true,
      });
      const num = parseInt(p.id.replace(/\D/g, ''), 10);
      if (num >= nextPortId) nextPortId = num + 1;
    }
  }

  renderBoard();

  if (data.components) {
    for (const c of data.components) {
      const comp = {
        id: c.id, type: c.type, label: c.label,
        position: { x: c.position.x, y: c.position.y },
      };
      const num = parseInt(c.id.replace(/\D/g, ''), 10);
      if (num >= nextId) nextId = num + 1;
      state.components.push(comp);
      renderComponent(comp);
    }
  }

  if (data.wires) {
    for (const w of data.wires) {
      const wire = {
        from: w.from, to: w.to,
        color: w.color || '#4CAF50',
        label: w.label || '',
        waypoints: (w.waypoints || []).map(wp => ({ x: wp.x, y: wp.y })),
      };
      state.wires.push(wire);
      renderWire(wire);
    }
  }
}

function clearAll() {
  wiresGroup.innerHTML = '';
  waypointsGroup.innerHTML = '';
  componentsGroup.innerHTML = '';
  boardGroup.innerHTML = '';
  state.components = [];
  state.wires = [];
  state.customPorts = [];
  state.portOverrides = {};
  selectedEl = null;
  wiringSource = null;
}

// helpers
function createSvgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
  }
  return el;
}

function svgPoint(e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function setStatus(msg) {
  document.getElementById('status-bar').textContent = msg;
}

// distance from point to line segment (for waypoint insertion)
function distToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

window.addEventListener('resize', () => {
  // adjust viewBox to match new aspect ratio, keeping center
  const rect = svg.getBoundingClientRect();
  if (rect.width && rect.height) {
    const scale = vb.w / (rect.width || 1); // current zoom level
    const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
    vb.w = rect.width * scale;
    vb.h = rect.height * scale;
    vb.x = cx - vb.w / 2;
    vb.y = cy - vb.h / 2;
    applyViewBox();
  }
});
