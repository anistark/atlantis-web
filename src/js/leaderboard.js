// The leaderboard's two views. The filters above scope both: the table hides a row that does not
// match, and the graph fades its bubble. The graph sets every ranked model as a bubble with its
// name inside, at the height of its index score, in a column for how many sources back it.
// Bubbles that would overlap push apart, mostly sideways, so each one rests within a fraction of a
// point of its score, and then floats there. The graph takes the card's width and a set height, so
// it never scrolls inside. A card shows on hover, a tap and keyboard focus. Every value the graph
// shows is also in the table, which is the page without this script.

const SVG = "http://www.w3.org/2000/svg";
const VIEW_KEY = "leaderboard-view";

const tools = document.querySelector("[data-leaderboard-tools]");
const find = tools.querySelector("[data-leaderboard-find]");
const labButton = tools.querySelector("[data-lab-button]");
const labSummary = tools.querySelector("[data-lab-summary]");
const labList = tools.querySelector("#lab-list");
const labBoxes = [...tools.querySelectorAll("[data-lab]")];
const labClear = tools.querySelector("[data-lab-clear]");
const openOnly = tools.querySelector("[data-leaderboard-open]");
const count = tools.querySelector("[data-leaderboard-count]");
const switches = [...tools.querySelectorAll("[data-view-button]")];
const views = [...document.querySelectorAll("[data-view]")];
const rows = [...document.querySelectorAll(".leaderboard tbody tr")];

const plot = document.querySelector("[data-graph]");
const tip = plot.querySelector("[data-graph-tip]");
const note = document.querySelector("[data-graph-note]");
const said = document.querySelector("[data-graph-said]");
const flameTemplate = document.querySelector("[data-flame-template]");

const models = JSON.parse(document.querySelector("[data-leaderboard-data]").textContent).map(
  (model, at) => ({ ...model, at }),
);
const ranked = models.filter((model) => model.index !== null);

let view = "table";
let focused = -1;
let drawn = null;
let hiding = 0;

/* filters */

function matches(model) {
  const term = find.value.trim().toLowerCase();
  return (
    (!term || model.name.toLowerCase().includes(term)) &&
    (!labs.size || labs.has(model.maker)) &&
    (!openOnly.checked || model.open === true)
  );
}

function apply() {
  let shown = 0;
  for (const row of rows) {
    const show = matches(models[Number(row.dataset.at)]);
    row.hidden = !show;
    if (show) shown += 1;
  }
  count.textContent = shown === rows.length ? "" : `${shown} of ${rows.length} models`;
  if (view === "graph") draw();
}

for (const control of [find, openOnly]) control.addEventListener("input", apply);

/* the labs */

// The labs ticked. None is every lab, which is how the page opens.
let labs = new Set();

function pickLabs() {
  labs = new Set(labBoxes.filter((box) => box.checked).map((box) => box.value));
  const names = [...labs];
  labSummary.textContent =
    names.length === 0 ? "All labs" : names.length <= 2 ? names.join(", ") : `${names.length} labs`;
  labButton.dataset.picked = String(names.length > 0);
  apply();
}

function openLabs(open) {
  labList.hidden = !open;
  labButton.setAttribute("aria-expanded", String(open));
}

for (const box of labBoxes) box.addEventListener("change", pickLabs);
labButton.addEventListener("click", () => openLabs(labList.hidden));
labClear.addEventListener("click", () => {
  for (const box of labBoxes) box.checked = false;
  pickLabs();
  labButton.focus();
  openLabs(false);
});
// The list closes on a click anywhere else, and on Escape, handing focus back to its button.
document.addEventListener("pointerdown", (event) => {
  if (!labList.hidden && !event.target.closest("[data-lab-picker]")) openLabs(false);
});
labList.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  openLabs(false);
  labButton.focus();
});

/* the switches */

function remember(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function recall(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function show(next) {
  view = next;
  for (const button of switches) {
    button.setAttribute("aria-pressed", String(button.dataset.viewButton === next));
  }
  for (const panel of views) panel.hidden = panel.dataset.view !== next;
  remember(VIEW_KEY, next);
  if (next === "graph") draw();
}

for (const button of switches) {
  button.addEventListener("click", () => show(button.dataset.viewButton));
}

/* the graph */

function seriesOf(model) {
  if (model.access === "restricted") return "restricted";
  if (model.open === true) return "open";
  if (model.open === false) return "closed";
  return "unknown";
}

function node(name, attributes = {}, parent = null) {
  const element = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (parent) parent.append(element);
  return element;
}

let measure = null;

function textWidth(text, font) {
  measure ??= document.createElement("canvas").getContext("2d");
  measure.font = font;
  return measure.measureText(text).width;
}

// A name as lines that fit a bubble, a word at a time, at most three, and the radius of the
// smallest bubble that holds them with a little water around the words.
function wrap(name, font, type) {
  const most = 70;
  const lines = [];
  for (const word of name.split(" ")) {
    const last = lines.at(-1);
    if (last !== undefined && textWidth(`${last} ${word}`, font) <= most) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  while (lines.length > 3) lines.splice(-2, 2, `${lines.at(-2)} ${lines.at(-1)}`);
  const wide = Math.max(...lines.map((line) => textWidth(line, font)));
  const tall = lines.length * type.line;
  return { lines, r: Math.max(20, Math.hypot(wide / 2, tall / 2) + 6) };
}

// Where each bubble settles. It is pulled hard toward the height of its score and gently toward
// the middle of its column, and pushed off any bubble it overlaps, more sideways than up or down.
// Several models share a score exactly, so the height cannot be held to the pixel, but it stays
// within a fraction of a point, and the card says the score.
function settle(bubbles, bounds) {
  const gap = 3;
  for (let round = 0; round < 1600; round += 1) {
    // The pull eases as the rounds go, so the last of them only clear what still overlaps.
    const pull = Math.max(0, 1 - round / 700);
    for (const bubble of bubbles) {
      bubble.x += (bubble.x0 - bubble.x) * 0.02 * pull;
      bubble.cy += (bubble.y0 - bubble.cy) * 0.3 * pull;
    }
    let crossed = 0;
    for (let one = 0; one < bubbles.length; one += 1) {
      const a = bubbles[one];
      for (let two = one + 1; two < bubbles.length; two += 1) {
        const b = bubbles[two];
        const apart = away(a, b, gap, one);
        if (!apart) continue;
        crossed += 1;
        a.x -= apart.x / 2;
        b.x += apart.x / 2;
        a.cy -= apart.y / 2;
        b.cy += apart.y / 2;
      }
    }
    for (const bubble of bubbles) keepInside(bubble, bounds);
    if (!crossed && round > 700) break;
  }
}

// How far two bubbles overlap, as the push that would part them, leaning sideways, since a bubble
// moving up or down moves off its score. Nothing when they are clear of each other.
function away(a, b, gap, turn) {
  const dx = b.x - a.x;
  const dy = b.cy - a.cy;
  const distance = Math.hypot(dx, dy);
  const overlap = a.r + b.r + gap - distance;
  if (overlap <= 0) return null;
  let ux = distance > 0.01 ? dx / distance : turn % 2 ? 1 : -1;
  let uy = distance > 0.01 ? (dy / distance) * 0.4 : 0;
  const length = Math.hypot(ux, uy) || 1;
  ux /= length;
  uy /= length;
  return { x: ux * overlap, y: uy * overlap };
}

function keepInside(bubble, bounds) {
  bubble.x = Math.min(Math.max(bubble.x, bounds.left + bubble.r), bounds.right - bubble.r);
  bubble.cy = Math.min(Math.max(bubble.cy, bounds.top + bubble.r), bounds.bottom - bubble.r);
}

/* the floating */

// The field drifts like things under water: each bubble wanders on its own current, is drawn back
// toward where it settled, which is at its score's level, and bumps off a neighbour it touches.
// It never strays more than `reach` up or down from there, so it always reads at its level. The bubble being pointed at holds still. Nothing moves for a reader who asks for
// reduced motion, while the graph is off screen, or while the tab is hidden.
const still = matchMedia("(prefers-reduced-motion: reduce)");
let remembered = null;
let onScreen = false;
let running = false;

function moving() {
  return view === "graph" && onScreen && !document.hidden && !still.matches && drawn !== null;
}

function wake() {
  if (running || !moving()) return;
  running = true;
  requestAnimationFrame(step);
}

function step() {
  if (!moving()) {
    running = false;
    return;
  }
  const { all, bounds, reach, pinned } = drawn;
  const gap = 4;

  for (const bubble of all) {
    if (bubble === pinned) continue;
    bubble.phase += bubble.turn;
    bubble.vx += Math.cos(bubble.phase) * 0.009 + (bubble.hx - bubble.x) * 0.002;
    bubble.vy += Math.sin(bubble.phase * 1.7) * 0.006 + (bubble.hy - bubble.cy) * 0.008;
  }

  // Touching bubbles ease apart at once and each takes a little of the push as a soft bounce.
  for (let one = 0; one < all.length; one += 1) {
    const a = all[one];
    for (let two = one + 1; two < all.length; two += 1) {
      const b = all[two];
      const apart = away(a, b, gap, one);
      if (!apart) continue;
      const share = a === pinned ? [0, 1] : b === pinned ? [1, 0] : [0.5, 0.5];
      const length = Math.hypot(apart.x, apart.y) || 1;
      a.x -= apart.x * share[0];
      b.x += apart.x * share[1];
      a.cy -= apart.y * share[0];
      b.cy += apart.y * share[1];
      a.vx -= (apart.x / length) * 0.03 * share[0];
      b.vx += (apart.x / length) * 0.03 * share[1];
      a.vy -= (apart.y / length) * 0.03 * share[0];
      b.vy += (apart.y / length) * 0.03 * share[1];
    }
  }

  for (const bubble of all) {
    if (bubble === pinned) continue;
    bubble.vx *= 0.94;
    bubble.vy *= 0.9;
    const speed = Math.hypot(bubble.vx, bubble.vy);
    if (speed > 0.35) {
      bubble.vx *= 0.35 / speed;
      bubble.vy *= 0.35 / speed;
    }
    bubble.x += bubble.vx;
    bubble.cy += bubble.vy;
    const left = bounds.left + bubble.r;
    const right = bounds.right - bubble.r;
    if (bubble.x < left || bubble.x > right) {
      bubble.x = Math.min(Math.max(bubble.x, left), right);
      bubble.vx *= -0.5;
    }
    const low = bubble.hy - reach;
    const high = bubble.hy + reach;
    if (bubble.cy < low || bubble.cy > high) {
      bubble.cy = Math.min(Math.max(bubble.cy, low), high);
      bubble.vy *= -0.5;
    }
    bubble.place.setAttribute(
      "transform",
      `translate(${bubble.x.toFixed(1)} ${bubble.cy.toFixed(1)})`,
    );
  }

  requestAnimationFrame(step);
}

new IntersectionObserver(([entry]) => {
  onScreen = entry.isIntersecting;
  wake();
}).observe(plot);
document.addEventListener("visibilitychange", wake);
still.addEventListener("change", wake);

// The field is laid out once, full size, in a world larger than the card, and shown scaled down
// so all of it fits: the bubbles small, the names small. Zooming in scales it up around the
// pointer, so a part of it can be read with its bubbles large, and dragging moves around it. The
// axes are drawn over the world, along the card's edges, so the scores and the counts of sources
// stay in sight wherever the view is.
const FIT = 0.55;
const DEEPEST = 5;
const FOOT = 40;

function draw() {
  const width = plot.clientWidth;
  if (!width) return;
  lastWidth = width;

  const type = { size: 10.5, line: 12.5 };
  const font = `500 ${type.size}px ${getComputedStyle(plot).fontFamily}`;

  // The world, at full size. On a narrow card it keeps a width its bubbles fit side by side in,
  // and the card shows it smaller still.
  const worldWidth = Math.max(width / FIT, 1300);
  const fit = width / worldWidth;
  const span = 1200;
  const edge = { top: 22, bottom: 14, left: 52, right: 14 };
  const worldHeight = edge.top + span + edge.bottom;
  const height = Math.round(worldHeight * fit) + FOOT;
  const room = worldWidth - edge.left - edge.right;
  // The index runs 0 to 80: room over the best model for the next ones, without a sea of empty
  // scale above them.
  const top = 80;
  const y = (score) => edge.top + (1 - score / top) * span;

  // A column for each count of sources, fewest first, each as wide as its share of the models
  // and a little more, so a crowded column has the room it needs and an empty-ish one still shows.
  const counts = [...new Set(ranked.map((model) => model.sources))].sort((a, b) => a - b);
  const share = (sources) => ranked.filter((model) => model.sources === sources).length + 4;
  const total = counts.reduce((sum, sources) => sum + share(sources), 0);
  let at = edge.left;
  const columns = counts.map((sources) => {
    const column = { sources, start: at, width: (room * share(sources)) / total };
    column.centre = at + column.width / 2;
    at += column.width;
    return column;
  });

  const all = ranked.map((model) => {
    const column = columns.find((one) => one.sources === model.sources);
    const x0 = column.centre;
    const y0 = y(model.index);
    const { lines, r } = wrap(model.name, font, type);
    return {
      model,
      column,
      lines,
      r,
      w: r * 2,
      x0,
      y0,
      x: x0 + (((model.at * 37) % 21) - 10),
      cy: y0,
    };
  });
  const bounds = {
    left: edge.left,
    right: worldWidth - edge.right,
    top: edge.top,
    bottom: edge.top + span,
  };

  // Where each bubble rests: where it was a moment ago when the graph is only being redrawn for a
  // filter, or where a settled layout puts it. Either way it is held to its level from here on.
  const kept = remembered?.width === width ? remembered.at : null;
  if (kept) {
    for (const bubble of all) Object.assign(bubble, kept.get(bubble.model.at));
  } else {
    settle(all, bounds);
  }
  // Each bubble floats about the place it settled, which is clear of its neighbours and within a
  // fraction of a point of its score, and never strays more than `reach` from it.
  const reach = 6;
  for (const bubble of all) {
    bubble.hx ??= bubble.x;
    bubble.hy ??= bubble.cy;
    bubble.vx ??= 0;
    bubble.vy ??= 0;
    // Each bubble wanders on its own slow current, so the field moves like water and not in step.
    bubble.phase ??= (bubble.model.at * 2.399) % (Math.PI * 2);
    bubble.turn ??= 0.004 + ((bubble.model.at * 7) % 11) / 2400;
  }

  // A redraw starts with nothing pointed at, since the bubble the card described may be gone.
  tip.hidden = true;
  const old = plot.querySelector("svg");
  const hadFocus = old !== null && document.activeElement === old;
  old?.remove();
  const svg = node("svg", {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    class: "graph-svg",
    tabindex: "0",
    role: "group",
    "aria-label":
      "Index score by number of sources. Use the arrow keys to move between models, and plus and minus to zoom.",
  });
  plot.prepend(svg);

  // One skin per series. Each gradient carries the series itself, so its stops read that
  // series' colour off the tokens and follow the theme.
  const defs = node("defs", {}, svg);
  for (const series of ["closed", "open", "unknown", "restricted"]) {
    const skin = node(
      "radialGradient",
      {
        id: `bubble-${series}`,
        "data-series": series,
        cx: "50%",
        cy: "50%",
        r: "50%",
        fx: "40%",
        fy: "36%",
      },
      defs,
    );
    for (const [offset, strength] of [
      [0, 0.03],
      [0.6, 0.08],
      [0.86, 0.24],
      [1, 0.5],
    ]) {
      node("stop", { offset, class: "bubble-stop", style: `--strength: ${strength}` }, skin);
    }
  }
  node("clipPath", { id: "graph-window" }, defs).append(
    node("rect", { x: 0, y: 0, width, height: height - FOOT }),
  );

  // The world: grid and bubbles, moved and scaled as one.
  const frame = node("g", { "clip-path": "url(#graph-window)" }, svg);
  const world = node("g", { class: "graph-world" }, frame);
  const grid = node("g", { class: "graph-grid" }, world);
  const levels = [];
  for (let score = 0; score <= top; score += 10) levels.push(score);
  for (const score of levels) {
    node("line", { x1: edge.left, x2: worldWidth - edge.right, y1: y(score), y2: y(score) }, grid);
  }
  for (const column of columns.slice(1)) {
    node(
      "line",
      {
        x1: column.start,
        x2: column.start,
        y1: edge.top,
        y2: edge.top + span,
        class: "graph-lane-rule",
      },
      grid,
    );
  }

  // Faded first, so every matching bubble paints over every faded one.
  const bubbles = node("g", { class: "graph-bubbles" }, world);
  const painted = [...all].sort((a, b) => Number(matches(a.model)) - Number(matches(b.model)));
  const marks = new Map();
  for (const bubble of painted) {
    const { model } = bubble;
    bubble.place = node("g", { transform: `translate(${bubble.x} ${bubble.cy})` }, bubbles);
    const mark = node(
      "g",
      { class: "bubble", "data-series": seriesOf(model), "data-faded": String(!matches(model)) },
      bubble.place,
    );
    // The skin: clear in the middle, the series colour gathering toward the rim, the way a
    // bubble in water shows its colour at the edge. The sphere is all it needs to read as one.
    node(
      "circle",
      { r: bubble.r, class: "bubble-body", fill: `url(#bubble-${seriesOf(model)})` },
      mark,
    );
    const name = node("text", { class: "bubble-name", style: `font-size: ${type.size}px` }, mark);
    const first = -((bubble.lines.length - 1) * type.line) / 2;
    for (const [row, line] of bubble.lines.entries()) {
      const part = node("tspan", { x: 0, y: (first + row * type.line).toFixed(1) }, name);
      part.textContent = line;
    }
    if (matches(model)) {
      mark.addEventListener("pointerenter", () => {
        if (!lens.dragging) point(bubble);
      });
      mark.addEventListener("pointerleave", soon);
      mark.addEventListener("click", () => {
        if (!lens.moved) point(bubble);
      });
    }
    marks.set(model, mark);
  }

  // The axes, over the world and along the card's edges, placed by `look`.
  const axes = node("g", { class: "graph-axes" }, svg);
  const marksY = levels.map((score) => {
    const label = node("text", { x: 8, class: "graph-axis-y" }, axes);
    label.textContent = String(score);
    return { label, y: y(score) };
  });
  const marksX = columns.map((column) => {
    const label = node("text", { y: height - FOOT + 18, class: "graph-axis-x" }, axes);
    label.textContent = String(column.sources);
    return { label, x: column.start + column.width / 2 };
  });
  const indexName = node("text", { x: 8, y: 14, class: "graph-axis-name graph-axis-pinned" }, axes);
  indexName.textContent = "Index";
  const sourcesName = node(
    "text",
    { x: width / 2, y: height - 4, class: "graph-axis-name graph-axis-foot" },
    axes,
  );
  sourcesName.textContent = "Sources";

  // The keyboard walks the matching bubbles column by column, strongest first.
  const ordered = columns.flatMap((column) =>
    all
      .filter((bubble) => matches(bubble.model) && bubble.column === column)
      .sort((a, b) => b.model.index - a.model.index),
  );

  const keptView = drawn?.view && remembered?.width === width ? drawn.view : null;
  drawn = {
    svg,
    world,
    marksY,
    marksX,
    walk: ordered,
    marks,
    width,
    windowHeight: height - FOOT,
    worldWidth,
    worldHeight,
    fit,
    all,
    bounds,
    reach,
    pinned: null,
    view: keptView ?? { k: fit, x: 0, y: 0 },
  };
  remembered = { width, at: new Map(all.map((bubble) => [bubble.model.at, bubble])) };
  look();
  wake();
  focused = Math.min(focused, ordered.length - 1);

  const unranked = models.length - ranked.length;
  note.textContent = unranked
    ? `${unranked} models have no independent score yet, so they are in the table only.`
    : "";

  svg.addEventListener("keydown", keys);
  // A card on focus only when the keyboard brought it, not a click or a drag.
  svg.addEventListener("focus", () => {
    if (!svg.matches(":focus-visible")) return;
    if (focused < 0 && drawn.walk.length) focused = 0;
    point(drawn.walk[focused] ?? null, true);
  });
  svg.addEventListener("blur", () => point(null));
  svg.addEventListener("wheel", wheel, { passive: false });
  svg.addEventListener("pointerdown", grab);
  svg.addEventListener("pointermove", drag);
  svg.addEventListener("pointerup", drop);
  svg.addEventListener("pointercancel", drop);
  svg.addEventListener("dblclick", (event) => {
    const [sx, sy] = local(event);
    zoom(2, sx, sy);
  });
  if (hadFocus) svg.focus();
}

/* the lens: zoom and pan */

const lens = { pointers: new Map(), dragging: false, moved: false, spread: 0 };

// Keep the view on the world: never smaller than the whole of it, never deeper than `DEEPEST`
// times that, and never panned past its edges.
function hold(view) {
  const { fit, width, windowHeight, worldWidth, worldHeight } = drawn;
  view.k = Math.min(Math.max(view.k, fit), fit * DEEPEST);
  view.x = Math.min(0, Math.max(width - worldWidth * view.k, view.x));
  view.y = Math.min(0, Math.max(windowHeight - worldHeight * view.k, view.y));
  return view;
}

// Draw the view: the world moved and scaled, the axes placed along the edges, and the card kept
// beside its bubble.
function look() {
  const { world, view, marksY, marksX, width, windowHeight } = drawn;
  hold(view);
  world.setAttribute(
    "transform",
    `translate(${view.x.toFixed(2)} ${view.y.toFixed(2)}) scale(${view.k.toFixed(4)})`,
  );
  for (const mark of marksY) {
    const sy = view.y + mark.y * view.k;
    mark.label.setAttribute("y", sy.toFixed(1));
    mark.label.setAttribute("visibility", sy < 6 || sy > windowHeight - 4 ? "hidden" : "visible");
  }
  for (const mark of marksX) {
    const sx = view.x + mark.x * view.k;
    mark.label.setAttribute("x", sx.toFixed(1));
    mark.label.setAttribute("visibility", sx < 16 || sx > width - 8 ? "hidden" : "visible");
  }
  drawn.svg.dataset.zoomed = String(view.k > drawn.fit * 1.01);
  for (const button of zoomButtons) {
    const deeper = button.dataset.zoom === "in";
    button.disabled =
      button.dataset.zoom === "fit"
        ? view.k <= drawn.fit * 1.01
        : deeper
          ? view.k >= drawn.fit * DEEPEST * 0.99
          : view.k <= drawn.fit * 1.01;
  }
  if (drawn.pinned && !tip.hidden) place(drawn.pinned);
}

function zoom(factor, sx, sy) {
  const view = drawn.view;
  const k = Math.min(Math.max(view.k * factor, drawn.fit), drawn.fit * DEEPEST);
  const wx = (sx - view.x) / view.k;
  const wy = (sy - view.y) / view.k;
  view.x = sx - wx * k;
  view.y = sy - wy * k;
  view.k = k;
  look();
}

function local(event) {
  const box = drawn.svg.getBoundingClientRect();
  return [event.clientX - box.left, event.clientY - box.top];
}

// A trackpad pinch arrives as a wheel with Ctrl held, and so does Ctrl or Cmd with a scroll. A
// plain scroll is left to the page, so the graph never traps it.
function wheel(event) {
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  const [sx, sy] = local(event);
  zoom(Math.exp(-event.deltaY * 0.01), sx, sy);
}

function grab(event) {
  lens.pointers.set(event.pointerId, local(event));
  lens.moved = false;
  if (lens.pointers.size === 2) {
    const [a, b] = [...lens.pointers.values()];
    lens.spread = Math.hypot(a[0] - b[0], a[1] - b[1]);
  }
}

function drag(event) {
  const was = lens.pointers.get(event.pointerId);
  if (!was) return;
  const now = local(event);
  lens.pointers.set(event.pointerId, now);
  if (lens.pointers.size === 2) {
    // Two fingers pinch around the point between them.
    const [a, b] = [...lens.pointers.values()];
    const spread = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (lens.spread) zoom(spread / lens.spread, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    lens.spread = spread;
    lens.moved = true;
    return;
  }
  const dx = now[0] - was[0];
  const dy = now[1] - was[1];
  if (!lens.dragging && Math.hypot(dx, dy) < 3) return;
  if (!lens.dragging) {
    lens.dragging = true;
    drawn.svg.setPointerCapture(event.pointerId);
    point(null);
  }
  lens.moved = true;
  drawn.view.x += dx;
  drawn.view.y += dy;
  look();
}

function drop(event) {
  lens.pointers.delete(event.pointerId);
  if (lens.pointers.size < 2) lens.spread = 0;
  if (!lens.pointers.size) lens.dragging = false;
}

const zoomButtons = [...document.querySelectorAll("[data-zoom]")];
for (const button of zoomButtons) {
  button.addEventListener("click", () => {
    if (!drawn) return;
    const centre = [drawn.width / 2, drawn.windowHeight / 2];
    if (button.dataset.zoom === "fit") {
      drawn.view = { k: drawn.fit, x: 0, y: 0 };
      look();
    } else {
      zoom(button.dataset.zoom === "in" ? 1.6 : 1 / 1.6, ...centre);
    }
  });
}

function keys(event) {
  const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
  if (event.key === "Escape") {
    point(null);
    return;
  }
  if (event.key === "+" || event.key === "=" || event.key === "-") {
    event.preventDefault();
    zoom(event.key === "-" ? 1 / 1.6 : 1.6, drawn.width / 2, drawn.windowHeight / 2);
    return;
  }
  if (!move || !drawn.walk.length) return;
  event.preventDefault();
  focused = Math.max(0, Math.min(drawn.walk.length - 1, focused + move));
  const bubble = drawn.walk[focused];
  // Zoomed in, the view follows the keyboard to the bubble it reached.
  const { view } = drawn;
  const sx = view.x + bubble.x * view.k;
  const sy = view.y + bubble.cy * view.k;
  if (sx < 40 || sx > drawn.width - 40 || sy < 30 || sy > drawn.windowHeight - 30) {
    view.x += drawn.width / 2 - sx;
    view.y += drawn.windowHeight / 2 - sy;
    look();
  }
  point(bubble, true);
  drawn.svg.scrollIntoView({ block: "nearest" });
}

// The card stays while the pointer crosses from a bubble onto it, so its flames can be pointed at.
function soon() {
  clearTimeout(hiding);
  hiding = setTimeout(() => point(null), 160);
}

tip.addEventListener("pointerenter", () => clearTimeout(hiding));
tip.addEventListener("pointerleave", soon);

function element(tag, className, text) {
  const made = document.createElement(tag);
  if (className) made.className = className;
  if (text !== undefined) made.textContent = text;
  return made;
}

// A link out, in a new tab, or the words alone when there is nowhere to go.
function linkOrText(text, url, className, label) {
  if (!url) return element("span", className, text);
  const link = element("a", className, text);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.title = label;
  link.append(element("span", "tip-out", " \u2197"));
  link.lastChild.setAttribute("aria-hidden", "true");
  return link;
}

const ago = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const fullDay = new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeZone: "UTC" });
const fullMonth = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// When a model came out, said the way a person would, "Released 2 months ago", with the exact
// date on hover. A date is a day and not a moment, so it is read in UTC, where it was written,
// and the hover says so.
function whenOut(released) {
  const found = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(released ?? "");
  if (!found) return null;
  const day = found[3] ? Number(found[3]) : 15;
  const date = Date.UTC(Number(found[1]), Number(found[2]) - 1, day);
  const days = Math.round((date - Date.now()) / 86_400_000);
  let words;
  if (Math.abs(days) < 1) words = "today";
  else if (Math.abs(days) < 45) words = ago.format(days, "day");
  else if (Math.abs(days) < 548) words = ago.format(Math.round(days / 30.44), "month");
  else words = ago.format(Math.round(days / 365.25), "year");
  const time = element("time", "tip-when", `Released ${words}`);
  time.dateTime = found[0];
  time.title = found[3] ? `${fullDay.format(date)}, UTC` : fullMonth.format(date);
  return time;
}

function point(bubble, announce = false) {
  clearTimeout(hiding);
  for (const mark of drawn.marks.values()) mark.removeAttribute("data-active");
  if (!bubble) {
    tip.hidden = true;
    drawn.pinned = null;
    return;
  }

  const { model } = bubble;
  drawn.pinned = bubble;
  drawn.marks.get(model)?.setAttribute("data-active", "true");

  // Built with textContent, since the names and links come from a data file. Each line of the card
  // has its thing on the left and what is said about it on the right: the model and its lab, each a
  // link out when there is somewhere to go, then its weights and when it came out, then its power
  // and its index.
  tip.replaceChildren();
  const head = element("div", "tip-head");
  head.append(
    linkOrText(model.name, model.about, "tip-name", `About ${model.name}`),
    linkOrText(model.maker, model.makerSite, "tip-maker", `${model.maker}'s site`),
  );

  const facts = element("div", "tip-facts");
  const weights = {
    open: "Open weights",
    closed: "Closed weights",
    unknown: "Weights not stated",
    restricted: "Not public",
  };
  const pill = element("span", "tip-pill", weights[seriesOf(model)]);
  pill.dataset.series = seriesOf(model);
  facts.append(pill);
  const when = whenOut(model.released);
  if (when) facts.append(when);

  const foot = element("div", "tip-foot");
  const power = element("span", "tip-power power");
  power.dataset.flame = model.flame;
  power.dataset.of = `${model.rating}/10`;
  power.setAttribute("aria-label", `Power ${model.rating}/10`);
  for (let at = 0; at < model.rating; at += 1) {
    power.append(flameTemplate.content.firstElementChild.cloneNode(true));
  }
  // The number alone, since the card is about the index. The word is in its title and in what a
  // screen reader hears.
  const index = element("span", "tip-index", String(model.index));
  const indexWords = `Index ${model.index}${model.estimate ? ", estimated" : ""}`;
  index.title = indexWords;
  index.setAttribute("aria-label", indexWords);
  if (model.estimate) index.append(element("span", "tip-estimate", " est."));
  foot.append(power, index);

  tip.append(head, facts, foot);
  tip.hidden = false;
  place(bubble);

  if (announce) {
    said.textContent = `${model.name}, ${model.maker}, index ${model.index}, power ${model.rating}/10.`;
  }
}

// The card beside its bubble, where the bubble is on screen at the current zoom, on whichever
// side has room, and kept inside the plot.
function place(bubble) {
  const { view } = drawn;
  const sx = view.x + bubble.x * view.k;
  const sy = view.y + bubble.cy * view.k;
  const r = bubble.r * view.k;
  const gap = 12;
  const edge = 8;
  const wide = tip.offsetWidth;
  const tall = tip.offsetHeight;
  // Right of the bubble when it fits, else left of it, else wherever it is wholly inside the plot.
  let left = sx + r + gap;
  if (left + wide > drawn.width - edge) left = sx - r - gap - wide;
  left = Math.min(Math.max(edge, left), drawn.width - edge - wide);
  const top = Math.min(Math.max(edge, sy - tall / 2), drawn.windowHeight - edge - tall);
  tip.style.left = `${Math.max(0, left)}px`;
  tip.style.top = `${Math.max(0, top)}px`;
}

// Redrawn when the card's width changes, and only then, so a redraw never takes focus or the card
// away for nothing.
let lastWidth = 0;
new ResizeObserver(() => {
  if (view !== "graph" || plot.clientWidth === lastWidth) return;
  draw();
}).observe(plot);

// The intro's first clause stands alone, the rest a click away on its ellipsis. Once open it
// stays open, and the reader carries on from where the words now go on.
const leadMore = document.querySelector("[data-lead-more]");
const leadToggle = document.querySelector("[data-lead-toggle]");
if (leadMore && leadToggle) {
  leadMore.hidden = true;
  leadToggle.hidden = false;
  leadToggle.addEventListener("click", () => {
    leadMore.hidden = false;
    leadToggle.remove();
    leadMore.focus({ preventScroll: true });
  });
}

tools.hidden = false;
show(recall(VIEW_KEY) === "graph" ? "graph" : "table");
apply();
