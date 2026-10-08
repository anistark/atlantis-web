// The ground of every page: Atlantis under the water. A city of temples, domed halls, towers and
// aqueducts in three layers of depth, with kelp, schools of fish, jellyfish and a manta moving
// through it, light falling from the surface and snow drifting down. Scrolling the page goes
// deeper, so the city rises as you read.
//
// The city is drawn from a seed, so it is the same on every visit. Everything here is a setting,
// and `sea.set({ fish: 120 })` in the console changes one while the page is open.

const SETTINGS = {
  seed: 1729,
  fish: 54,
  schools: 3,
  jellies: 4,
  manta: true,
  snow: 80,
  bubbles: true,
  rays: 5,
  // How far each layer sinks below the bottom of the screen at the top of the page, as a share of
  // its height. Scrolling to the end of the page raises it all the way.
  sink: 0.3,
};

const canvas = document.querySelector("[data-sea]");
const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* colour, read from the page's own tokens so both themes come out right */

function rgb(value) {
  const text = value.trim();
  if (text.startsWith("#")) {
    let hex = text.slice(1);
    if (hex.length === 3) hex = [...hex].map((char) => char + char).join("");
    const number = parseInt(hex, 16);
    return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
  }
  return (text.match(/[\d.]+/g) ?? [0, 0, 0]).slice(0, 3).map(Number);
}

const mix = (a, b, amount) => a.map((value, i) => Math.round(value + (b[i] - value) * amount));
const rgba = (colour, alpha = 1) => `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, ${alpha})`;

function palette() {
  const style = getComputedStyle(document.documentElement);
  const token = (name) => rgb(style.getPropertyValue(name));
  const light = document.documentElement.dataset.theme === "light";
  const ground = token("--void");
  const lamp = token("--lamp");
  const primary = token("--primary");
  const secondary = token("--secondary");
  // Stone is the ground pushed toward the light: a cold blue at night, deep navy in the summer sea.
  const toward = light ? lamp : mix(secondary, lamp, 0.35);
  return {
    light,
    ground,
    lamp,
    primary,
    secondary,
    stone: (amount) => mix(ground, toward, amount),
  };
}

/* a seeded random, so the city stands where it stood last time */

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (random, [low, high]) => low + random() * (high - low);

/* buildings. Each draws in one flat colour with its base on `base`, and cuts its openings out. */

function cut(c, draw) {
  c.save();
  c.globalCompositeOperation = "destination-out";
  c.beginPath();
  draw();
  c.fill();
  c.restore();
}

function archPath(c, x, bottom, width, height) {
  const radius = width / 2;
  c.moveTo(x, bottom);
  c.lineTo(x, bottom - height + radius);
  c.arc(x + radius, bottom - height + radius, radius, Math.PI, 0);
  c.lineTo(x + width, bottom);
  c.closePath();
}

// A window is a hole in the stone. Some of them have someone home, and those are lit each frame.
function opening(c, x, y, width, height, random, lights, chance) {
  cut(c, () => archPath(c, x, y + height, width, height));
  if (random() < chance) {
    lights.push({
      x,
      y,
      width,
      height,
      phase: random() * Math.PI * 2,
      speed: 0.3 + random() * 0.9,
    });
  }
}

// Time has taken a bite out of most things down here.
function ruin(c, x, top, width, height, random) {
  const left = random() < 0.5;
  const edge = left ? x - 2 : x + width + 2;
  const dir = left ? 1 : -1;
  const bite = width * (0.18 + random() * 0.32);
  const depth = height * (0.2 + random() * 0.4);
  cut(c, () => {
    c.moveTo(edge, top - 4);
    c.lineTo(edge + dir * bite, top - 4);
    c.lineTo(edge + dir * bite * 0.72, top + depth * 0.3);
    c.lineTo(edge + dir * bite * 0.86, top + depth * 0.52);
    c.lineTo(edge + dir * bite * 0.38, top + depth * 0.7);
    c.lineTo(edge + dir * bite * 0.22, top + depth);
    c.lineTo(edge, top + depth);
    c.closePath();
  });
}

function temple(c, x, base, width, height, random) {
  const step = height * 0.045;
  for (let i = 0; i < 3; i++) {
    c.fillRect(x + i * width * 0.025, base - step * (i + 1), width - i * width * 0.05, step + 0.5);
  }
  const floor = base - step * 3;
  const inset = width * 0.08;
  const shaft = height * 0.58;
  const count = Math.max(4, Math.min(10, Math.round(width / (height * 0.14))));
  const thick = (width - inset * 2) / (count * 1.9);
  const gap = (width - inset * 2 - thick) / (count - 1);
  for (let i = 0; i < count; i++) {
    const cx = x + inset + i * gap;
    if (random() < 0.22) {
      const left = shaft * (0.25 + random() * 0.5);
      c.beginPath();
      c.moveTo(cx, floor);
      c.lineTo(cx, floor - left);
      c.lineTo(cx + thick * 0.4, floor - left - thick * 0.6);
      c.lineTo(cx + thick * 0.7, floor - left + thick * 0.2);
      c.lineTo(cx + thick, floor - left - thick * 0.3);
      c.lineTo(cx + thick, floor);
      c.fill();
      continue;
    }
    c.fillRect(cx, floor - shaft, thick, shaft);
    c.fillRect(cx - thick * 0.2, floor - shaft, thick * 1.4, thick * 0.35);
  }
  const top = floor - shaft;
  const beam = height * 0.08;
  const roof = height * 0.2;
  c.fillRect(x + inset * 0.5, top - beam, width - inset, beam);
  c.beginPath();
  c.moveTo(x + inset * 0.3, top - beam);
  c.lineTo(x + width / 2, top - beam - roof);
  c.lineTo(x + width - inset * 0.3, top - beam);
  c.fill();
  if (random() < 0.7)
    ruin(
      c,
      x + inset * 0.3,
      top - beam - roof,
      width - inset * 0.6,
      roof + beam + shaft * 0.3,
      random,
    );
}

function domed(c, x, base, width, height, random, lights, chance) {
  const body = height * 0.48;
  const drumWidth = width * 0.62;
  const drum = height * 0.1;
  const dome = Math.min(height * 0.34, drumWidth * 0.62);
  c.fillRect(x, base - body, width, body);
  c.fillRect(x + (width - drumWidth) / 2, base - body - drum, drumWidth, drum);
  c.beginPath();
  c.ellipse(x + width / 2, base - body - drum, drumWidth / 2, dome, 0, Math.PI, Math.PI * 2);
  c.fill();
  c.fillRect(x + width / 2 - 1, base - body - drum - dome - height * 0.07, 2, height * 0.07 + 1);
  const count = Math.max(2, Math.round(width / (height * 0.18)));
  const pane = width / (count * 2.2);
  const start = x + (width - (count * pane + (count - 1) * pane * 1.2)) / 2;
  for (let i = 0; i < count; i++) {
    opening(
      c,
      start + i * pane * 2.2,
      base - body * 0.72,
      pane,
      body * 0.42,
      random,
      lights,
      chance,
    );
  }
  if (random() < 0.4)
    ruin(c, x + (width - drumWidth) / 2, base - body - drum - dome, drumWidth, dome * 0.9, random);
}

function trident(c, cx, top, size) {
  c.fillRect(cx - 1, top - size, 2, size);
  c.fillRect(cx - size * 0.22, top - size, size * 0.44, 2);
  for (const dx of [-0.22, 0, 0.22]) {
    const px = cx + dx * size;
    const reach = dx === 0 ? size * 0.42 : size * 0.3;
    c.beginPath();
    c.moveTo(px - 1.2, top - size);
    c.lineTo(px, top - size - reach);
    c.lineTo(px + 1.2, top - size);
    c.fill();
  }
}

function tower(c, x, base, width, height, random, lights, chance, layer) {
  c.fillRect(x, base - height, width, height);
  let top = base - height;
  if (random() < 0.5) {
    const count = Math.max(3, Math.round(width / 8));
    const merlon = width / (count * 2 - 1);
    for (let i = 0; i < count; i++)
      c.fillRect(x + i * merlon * 2, top - merlon * 1.2, merlon, merlon * 1.2 + 0.5);
    top -= merlon * 1.2;
  } else {
    c.beginPath();
    c.moveTo(x - width * 0.12, top);
    c.lineTo(x + width / 2, top - width * 1.3);
    c.lineTo(x + width * 1.12, top);
    c.fill();
    top -= width * 1.3;
  }
  const slit = width * 0.2;
  for (let y = base - height + width * 0.6; y < base - width; y += width * 1.1) {
    opening(c, x + width / 2 - slit / 2, y, slit, slit * 2.2, random, lights, chance);
  }
  // One tower in the middle distance still carries the old god's trident.
  if (layer.trident && !layer.trident.placed && x > layer.width * 0.55) {
    layer.trident.placed = true;
    trident(c, x + width / 2, top, height * 0.28);
  } else if (random() < 0.35) {
    ruin(c, x, base - height - width, width, height * 0.3, random);
  }
}

function aqueduct(c, x, base, width, height, random) {
  const body = height * 0.62;
  c.fillRect(x, base - body, width, body);
  const count = Math.max(2, Math.round(width / (body * 0.55)));
  const bay = width / count;
  for (let i = 0; i < count; i++)
    cut(c, () => archPath(c, x + i * bay + bay * 0.18, base + 1, bay * 0.64, body * 0.74));
  if (random() < 0.6) {
    const upper = height * 0.32;
    const span = width * (0.5 + random() * 0.4);
    c.fillRect(x, base - body - upper, span, upper);
    const small = Math.max(2, Math.round(span / (upper * 0.7)));
    const smallBay = span / small;
    for (let i = 0; i < small; i++) {
      cut(c, () =>
        archPath(
          c,
          x + i * smallBay + smallBay * 0.22,
          base - body - upper * 0.12,
          smallBay * 0.56,
          upper * 0.62,
        ),
      );
    }
  }
  ruin(c, x, base - height, width, height * 0.7, random);
}

function ziggurat(c, x, base, width, height, random, lights, chance) {
  const tiers = 4 + Math.floor(random() * 3);
  const rise = (height * 0.82) / tiers;
  for (let i = 0; i < tiers; i++) {
    const span = width * (1 - i / (tiers + 1));
    c.fillRect(x + (width - span) / 2, base - rise * (i + 1), span, rise + 0.5);
  }
  const shrine = width * 0.16;
  const top = base - rise * tiers;
  c.fillRect(x + width / 2 - shrine / 2, top - height * 0.16, shrine, height * 0.16 + 0.5);
  opening(
    c,
    x + width / 2 - shrine * 0.18,
    top - height * 0.11,
    shrine * 0.36,
    height * 0.11,
    random,
    lights,
    chance,
  );
}

function house(c, x, base, width, height, random, lights, chance) {
  const body = height * (0.6 + random() * 0.2);
  c.fillRect(x, base - body, width, body);
  if (random() < 0.6) {
    c.beginPath();
    c.moveTo(x - width * 0.08, base - body);
    c.lineTo(x + width / 2, base - height);
    c.lineTo(x + width * 1.08, base - body);
    c.fill();
  } else {
    c.fillRect(x - width * 0.04, base - body - height * 0.06, width * 1.08, height * 0.06);
  }
  cut(c, () => archPath(c, x + width * 0.4, base + 1, width * 0.2, body * 0.45));
  const pane = width * 0.16;
  for (const along of [0.16, 0.68])
    opening(c, x + width * along, base - body * 0.85, pane, body * 0.26, random, lights, chance);
}

function column(c, x, base, width, height, random) {
  c.fillRect(x - width * 0.2, base - width * 0.4, width * 1.4, width * 0.4);
  c.beginPath();
  c.moveTo(x, base);
  c.lineTo(x, base - height);
  c.lineTo(x + width * 0.3, base - height - width * 0.5);
  c.lineTo(x + width * 0.55, base - height + width * 0.15);
  c.lineTo(x + width * 0.8, base - height - width * 0.25);
  c.lineTo(x + width, base - height + width * 0.1);
  c.lineTo(x + width, base);
  c.fill();
  // Fluting, as thin cuts down the shaft.
  for (let i = 1; i < 4; i++) {
    cut(c, () =>
      c.rect(x + (width * i) / 4 - 0.6, base - height + width, 1.2, height - width * 1.6),
    );
  }
  if (random() < 0.5) {
    c.save();
    c.translate(x + width * 1.5, base - width * 0.35);
    c.rotate(-0.08 + random() * 0.16);
    c.fillRect(0, -width * 0.45, height * 0.35, width * 0.9);
    c.restore();
  }
}

function rock(c, x, base, width, height) {
  c.beginPath();
  c.ellipse(x + width / 2, base, width / 2, height, 0, Math.PI, Math.PI * 2);
  c.fill();
}

const KINDS = {
  temple: { draw: temple, height: [0.5, 0.75], aspect: [1.1, 1.6] },
  domed: { draw: domed, height: [0.5, 0.8], aspect: [0.7, 1.1] },
  tower: { draw: tower, height: [0.6, 1], aspect: [0.16, 0.26] },
  house: { draw: house, height: [0.25, 0.42], aspect: [0.6, 1] },
  aqueduct: { draw: aqueduct, height: [0.35, 0.55], aspect: [1.3, 2.2] },
  ziggurat: { draw: ziggurat, height: [0.45, 0.7], aspect: [1, 1.4] },
  column: { draw: column, height: [0.5, 0.95], aspect: [0.09, 0.14] },
  rock: { draw: rock, height: [0.03, 0.07], aspect: [4, 8] },
};

// Far to near. Heights are shares of the screen, the rest are shares of the layer's height.
const LAYERS = [
  {
    height: 0.64,
    stone: [0.06, 0.12],
    sway: 0.004,
    gap: [-0.05, 0.06],
    lit: 0.12,
    kinds: { tower: 3, domed: 2, ziggurat: 1.2, temple: 1, house: 1.4 },
  },
  {
    height: 0.42,
    stone: [0.1, 0.19],
    sway: 0.01,
    gap: [0.03, 0.16],
    lit: 0.3,
    trident: true,
    kinds: { house: 3, domed: 1.5, temple: 1.6, tower: 1.5, aqueduct: 1.2, ziggurat: 0.6 },
  },
  {
    height: 0.34,
    stone: [0.16, 0.24],
    sway: 0.018,
    gap: [0.08, 0.36],
    lit: 0,
    edges: true,
    kelp: true,
    kinds: { column: 3, aqueduct: 0.8, rock: 2 },
  },
];

function pick(random, weights) {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;
  for (const [name, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return name;
  }
  return Object.keys(weights)[0];
}

function buildLayer(spec, index, view, colours, ratio) {
  const random = seeded(SETTINGS.seed + index * 101);
  const width = Math.ceil(view.width * 1.08);
  const height = Math.ceil(view.height * spec.height);
  const element = document.createElement("canvas");
  element.width = Math.ceil(width * ratio);
  element.height = Math.ceil(height * ratio);
  const c = element.getContext("2d");
  c.scale(ratio, ratio);
  c.fillStyle = "#000";

  const shiftA = random() * 10;
  const shiftB = random() * 10;
  const floor = (x) =>
    height -
    height * 0.08 * (0.7 + 0.3 * Math.sin(x * 0.006 + shiftA) + 0.2 * Math.sin(x * 0.017 + shiftB));
  const lights = [];
  const layer = { ...spec, width, trident: spec.trident ? { placed: false } : null };

  let x = -random() * height * 0.3;
  while (x < width) {
    let kind = pick(random, spec.kinds);
    // The near layer frames the page. Its middle stays low so the reading stays clear.
    if (spec.edges && x > width * 0.22 && x < width * 0.74) kind = "rock";
    const shape = KINDS[kind];
    const tall = height * between(random, shape.height);
    const wide = tall * between(random, shape.aspect);
    const base = floor(x + wide / 2) + tall * 0.02;
    shape.draw(c, x, base, wide, tall, random, lights, spec.lit, layer);
    x += wide + height * between(random, spec.gap);
  }

  c.beginPath();
  c.moveTo(0, height);
  for (let gx = 0; gx <= width; gx += 12) c.lineTo(gx, floor(gx));
  c.lineTo(width, height);
  c.fill();

  // Light falls from above, so the tops of things catch more of it than their feet.
  const shade = c.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, rgba(colours.stone(spec.stone[1])));
  shade.addColorStop(1, rgba(colours.stone(spec.stone[0])));
  c.globalCompositeOperation = "source-in";
  c.fillStyle = shade;
  c.fillRect(0, 0, width, height);

  const kelp = [];
  if (spec.kelp) {
    for (let kx = 0; kx < width; kx += 14 + random() * 30) {
      const edge = Math.min(kx, width - kx) / width;
      if (random() < edge * 2.2) continue;
      kelp.push({
        x: kx,
        y: floor(kx) + 4,
        length: height * (0.25 + random() * 0.55) * (edge < 0.2 ? 1 : 0.45),
        phase: random() * Math.PI * 2,
        thick: 2 + random() * 2.5,
      });
    }
  }

  return { spec, element, width, height, lights, kelp, floor, x: 0, y: 0 };
}

/* the living things */

function makeFish(view, random) {
  const fish = [];
  const count = Math.round(SETTINGS.fish * Math.min(1, Math.max(0.4, view.width / 1440)));
  const schools = Array.from({ length: SETTINGS.schools }, (_, i) => ({
    dir: i % 2 ? -1 : 1,
    depth: 0.25 + random() * 0.75,
    tint: i % 3,
    scale: 0.7 + random() * 0.6,
  }));
  for (let i = 0; i < count; i++) {
    const school = i % schools.length;
    const home = schools[school];
    fish.push({
      school,
      x: random() * view.width,
      y: view.height * (0.2 + school * 0.22) + (random() - 0.5) * 80,
      vx: home.dir * (0.6 + random() * 0.4),
      vy: (random() - 0.5) * 0.2,
      depth: Math.min(1, Math.max(0.1, home.depth + (random() - 0.5) * 0.2)),
      phase: random() * Math.PI * 2,
    });
  }
  return { fish, schools };
}

function makeJellies(view, random) {
  const count = view.width < 640 ? Math.ceil(SETTINGS.jellies / 2) : SETTINGS.jellies;
  return Array.from({ length: count }, (_, i) => ({
    x: view.width * (0.1 + random() * 0.8),
    y: view.height * (0.15 + random() * 0.8),
    size: 9 + random() * 13,
    phase: random() * Math.PI * 2,
    pace: 0.7 + random() * 0.6,
    tone: i % 2,
  }));
}

function makeSnow(view, random) {
  return Array.from({ length: SETTINGS.snow }, () => ({
    x: random() * view.width,
    y: random() * view.height,
    size: 0.6 + random() * 1.4,
    fall: 0.08 + random() * 0.22,
    phase: random() * Math.PI * 2,
    alpha: 0.1 + random() * 0.25,
  }));
}

/* the scene */

function start() {
  const c = canvas.getContext("2d");
  const random = seeded(SETTINGS.seed);
  const view = { width: 0, height: 0 };
  let ratio = 1;
  let colours = palette();
  let layers = [];
  let school = { fish: [], schools: [] };
  let jellies = [];
  let snow = [];
  let bubbles = [];
  let manta = null;
  let depth = 0;
  let pointer = null;
  let frame = 0;
  let last = 0;
  let clock = 0;

  function scrollDepth() {
    const room = document.documentElement.scrollHeight - innerHeight;
    return room > 0 ? Math.min(1, Math.max(0, scrollY / room)) : 1;
  }

  function build() {
    view.width = innerWidth;
    view.height = innerHeight;
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(view.width * ratio);
    canvas.height = Math.round(view.height * ratio);
    colours = palette();
    layers = LAYERS.map((spec, i) => buildLayer(spec, i, view, colours, ratio));
    const life = seeded(SETTINGS.seed + 7);
    school = makeFish(view, life);
    jellies = makeJellies(view, life);
    snow = makeSnow(view, life);
    bubbles = [];
    manta = SETTINGS.manta ? { x: -300, y: view.height * 0.32, dir: 1, wait: 6, phase: 0 } : null;
    depth = still ? 0.6 : scrollDepth();
  }

  function place(time) {
    layers.forEach((layer, i) => {
      const drift = Math.sin(time * 0.07 + i * 1.7) * layer.spec.sway * view.width;
      layer.x = -(layer.width - view.width) / 2 + drift;
      layer.y =
        view.height - layer.height + layer.height * SETTINGS.sink * (1 - depth) * (0.6 + i * 0.3);
    });
  }

  /* update */

  function swim(step, time) {
    const { fish, schools } = school;
    const top = view.height * 0.1;
    const bottom = view.height * 0.9;
    for (const one of fish) {
      let ax = 0;
      let ay = 0;
      let cx = 0;
      let cy = 0;
      let mx = 0;
      let my = 0;
      let near = 0;
      for (const other of fish) {
        if (other === one || other.school !== one.school) continue;
        const dx = other.x - one.x;
        const dy = other.y - one.y;
        const far = dx * dx + dy * dy;
        if (far > 120 * 120) continue;
        near++;
        cx += other.x;
        cy += other.y;
        mx += other.vx;
        my += other.vy;
        if (far < 26 * 26) {
          const d = Math.sqrt(far) || 1;
          ax -= (dx / d) * 0.06;
          ay -= (dy / d) * 0.06;
        }
      }
      if (near) {
        ax += (cx / near - one.x) * 0.0005 + (mx / near - one.vx) * 0.03;
        ay += (cy / near - one.y) * 0.0005 + (my / near - one.vy) * 0.03;
      }
      ax += schools[one.school].dir * 0.004;
      ay += Math.sin(time * 0.4 + one.phase) * 0.004;
      if (one.y < top) ay += (top - one.y) * 0.0006;
      if (one.y > bottom) ay -= (one.y - bottom) * 0.0006;
      if (pointer) {
        const dx = one.x - pointer.x;
        const dy = one.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < 150 && d > 0) {
          ax += (dx / d) * 0.3 * (1 - d / 150);
          ay += (dy / d) * 0.3 * (1 - d / 150);
        }
      }
      one.vx += ax * step;
      one.vy += ay * step;
      const fastest = 0.9 + one.depth * 0.9;
      const speed = Math.hypot(one.vx, one.vy);
      const limit = Math.min(fastest, Math.max(0.35, speed));
      one.vx = (one.vx / (speed || 1)) * limit;
      one.vy = (one.vy / (speed || 1)) * limit;
      one.x += one.vx * step;
      one.y += one.vy * step;
      if (one.x > view.width + 80) one.x = -80;
      if (one.x < -80) one.x = view.width + 80;
    }
    // Now and then a school turns back the way it came.
    for (const each of schools) if (random() < 0.0004 * step) each.dir *= -1;
  }

  function drift(step, time) {
    for (const jelly of jellies) {
      const pulse = Math.sin(time * 1.6 * jelly.pace + jelly.phase);
      jelly.y -= (0.08 + 0.3 * Math.max(0, -pulse)) * step * jelly.pace;
      jelly.x += Math.sin(time * 0.2 + jelly.phase) * 0.12 * step;
      if (jelly.y < -jelly.size * 5) {
        jelly.y = view.height + jelly.size * 3;
        jelly.x = view.width * (0.1 + random() * 0.8);
      }
    }
    for (const flake of snow) {
      flake.y += flake.fall * step;
      flake.x += Math.sin(time * 0.3 + flake.phase) * 0.08 * step;
      if (flake.y > view.height + 4) {
        flake.y = -4;
        flake.x = random() * view.width;
      }
    }
    if (SETTINGS.bubbles) {
      if (random() < 0.035 * step && bubbles.length < 50) {
        const layer = layers[1 + Math.floor(random() * 2)];
        const lx = random() * layer.width;
        const count = 1 + Math.floor(random() * 4);
        for (let i = 0; i < count; i++) {
          bubbles.push({
            x: layer.x + lx + (random() - 0.5) * 6,
            y: layer.y + layer.floor(lx) - i * 9,
            size: 1.2 + random() * 2.6,
            rise: 0.5 + random() * 0.7,
            phase: random() * Math.PI * 2,
          });
        }
      }
      for (const bubble of bubbles) {
        bubble.y -= bubble.rise * step;
        bubble.x += Math.sin(time * 3 + bubble.phase) * 0.25 * step;
      }
      bubbles = bubbles.filter((bubble) => bubble.y > -10);
    }
    if (manta) {
      if (manta.wait > 0) {
        manta.wait -= step / 60;
        if (manta.wait <= 0) {
          manta.dir = random() < 0.5 ? 1 : -1;
          manta.x = manta.dir > 0 ? -260 : view.width + 260;
          manta.y = view.height * (0.18 + random() * 0.3);
        }
      } else {
        manta.x += manta.dir * 0.55 * step;
        manta.y += Math.sin(time * 0.4) * 0.12 * step;
        manta.phase += 0.035 * step;
        if (manta.x < -300 || manta.x > view.width + 300) manta.wait = 25 + random() * 30;
      }
    }
  }

  /* draw */

  function rays(time) {
    const fade = 1 - depth * 0.65;
    const colour = colours.light ? [255, 255, 255] : mix(colours.secondary, colours.lamp, 0.5);
    const strength = colours.light ? 0.28 : 0.065;
    for (let i = 0; i < SETTINGS.rays; i++) {
      const centre =
        view.width * ((i + 0.5) / SETTINGS.rays) +
        Math.sin(time * 0.05 + i * 2.1) * view.width * 0.06;
      const top = 40 + 50 * Math.sin(i * 3.3) ** 2;
      const lean = view.width * 0.12;
      const glow = strength * fade * (0.55 + 0.45 * Math.sin(time * 0.35 + i * 1.9));
      const shine = c.createLinearGradient(0, 0, 0, view.height * 0.95);
      shine.addColorStop(0, rgba(colour, glow));
      shine.addColorStop(1, rgba(colour, 0));
      c.fillStyle = shine;
      c.beginPath();
      c.moveTo(centre - top / 2, 0);
      c.lineTo(centre + top / 2, 0);
      c.lineTo(centre + lean + top * 2.2, view.height * 0.95);
      c.lineTo(centre + lean - top * 2.2, view.height * 0.95);
      c.closePath();
      c.fill();
    }
  }

  function windows(layer, time, strength) {
    const lit = colours.light ? colours.primary : mix(colours.primary, colours.lamp, 0.25);
    for (const light of layer.lights) {
      const glow =
        (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * light.speed + light.phase))) * strength;
      const x = layer.x + light.x;
      const y = layer.y + light.y;
      c.fillStyle = rgba(lit, glow * 0.1);
      c.fillRect(x - 3, y - 3, light.width + 6, light.height + 6);
      c.fillStyle = rgba(lit, glow * 0.42);
      c.fillRect(x, y + light.width * 0.3, light.width, light.height - light.width * 0.3);
    }
  }

  function kelp(layer, time) {
    const colour = mix(
      colours.stone(layer.spec.stone[1]),
      colours.primary,
      colours.light ? 0.18 : 0.22,
    );
    c.strokeStyle = rgba(colour, 0.95);
    c.lineCap = "round";
    for (const strand of layer.kelp) {
      const parts = 9;
      let x = layer.x + strand.x;
      let y = layer.y + strand.y;
      let angle = -Math.PI / 2;
      c.lineWidth = strand.thick;
      c.beginPath();
      c.moveTo(x, y);
      for (let i = 1; i <= parts; i++) {
        angle =
          -Math.PI / 2 + Math.sin(time * 0.8 + strand.phase + i * 0.45) * 0.14 * (i / parts) * 3;
        x += Math.cos(angle) * (strand.length / parts);
        y += Math.sin(angle) * (strand.length / parts);
        c.lineTo(x, y);
      }
      c.stroke();
    }
  }

  function fishes(time) {
    const { fish, schools } = school;
    const tints = [colours.lamp, colours.secondary, colours.primary];
    for (const one of fish) {
      const home = schools[one.school];
      const size = (7 + one.depth * 12) * home.scale;
      const base = mix(
        colours.ground,
        colours.lamp,
        colours.light ? 0.35 + one.depth * 0.25 : 0.3 + one.depth * 0.3,
      );
      const colour = mix(base, tints[home.tint], 0.3);
      c.fillStyle = rgba(colour, 0.18 + one.depth * 0.3);
      c.save();
      c.translate(one.x, one.y);
      c.rotate(Math.atan2(one.vy, one.vx));
      c.beginPath();
      c.ellipse(0, 0, size * 0.5, size * 0.17, 0, 0, Math.PI * 2);
      c.fill();
      c.translate(-size * 0.42, 0);
      c.rotate(Math.sin(time * 9 + one.phase) * 0.35);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-size * 0.28, -size * 0.17);
      c.lineTo(-size * 0.28, size * 0.17);
      c.closePath();
      c.fill();
      c.restore();
    }
  }

  function jellyfish(time) {
    for (const jelly of jellies) {
      const colour = jelly.tone ? colours.secondary : colours.primary;
      const pulse = Math.sin(time * 1.6 * jelly.pace + jelly.phase);
      const wide = jelly.size * (1 + 0.14 * pulse);
      const tall = jelly.size * 0.8 * (1 - 0.1 * pulse);
      const halo = c.createRadialGradient(jelly.x, jelly.y, 0, jelly.x, jelly.y, jelly.size * 3);
      halo.addColorStop(0, rgba(colour, colours.light ? 0.08 : 0.16));
      halo.addColorStop(1, rgba(colour, 0));
      c.fillStyle = halo;
      c.fillRect(
        jelly.x - jelly.size * 3,
        jelly.y - jelly.size * 3,
        jelly.size * 6,
        jelly.size * 6,
      );

      c.strokeStyle = rgba(colour, 0.3);
      c.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const tx = jelly.x - wide * 0.6 + (wide * 1.2 * i) / 4;
        const reach = jelly.size * (2 + (i % 2) * 0.8);
        c.beginPath();
        c.moveTo(tx, jelly.y);
        c.quadraticCurveTo(
          tx + Math.sin(time * 1.8 + i + jelly.phase) * jelly.size * 0.5,
          jelly.y + reach * 0.5,
          tx + Math.sin(time * 1.3 + i * 1.7 + jelly.phase) * jelly.size * 0.7,
          jelly.y + reach,
        );
        c.stroke();
      }

      c.beginPath();
      c.ellipse(jelly.x, jelly.y, wide, tall, 0, Math.PI, Math.PI * 2);
      const scallops = 4;
      for (let i = 0; i < scallops; i++) {
        const from = jelly.x + wide - (wide * 2 * i) / scallops;
        const to = from - (wide * 2) / scallops;
        c.quadraticCurveTo((from + to) / 2, jelly.y + jelly.size * 0.18, to, jelly.y);
      }
      c.fillStyle = rgba(colour, colours.light ? 0.16 : 0.22);
      c.strokeStyle = rgba(colour, 0.55);
      c.fill();
      c.stroke();
    }
  }

  function ray() {
    if (!manta || manta.wait > 0) return;
    const length = 70;
    const flap = Math.sin(manta.phase) * 0.35;
    const span = length * 1.1;
    c.save();
    c.translate(manta.x, manta.y);
    c.scale(manta.dir, 1);
    c.fillStyle = rgba(colours.stone(colours.light ? 0.2 : 0.2), 0.75);
    c.beginPath();
    c.moveTo(length * 0.45, 0);
    c.quadraticCurveTo(
      length * 0.25,
      -span * (0.55 + flap * 0.3),
      -length * 0.12,
      -span * (1 + flap),
    );
    c.quadraticCurveTo(-length * 0.08, -span * 0.35, -length * 0.38, 0);
    c.quadraticCurveTo(-length * 0.08, span * 0.35, -length * 0.12, span * (1 + flap));
    c.quadraticCurveTo(length * 0.25, span * (0.55 + flap * 0.3), length * 0.45, 0);
    c.fill();
    c.strokeStyle = c.fillStyle;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-length * 0.36, 0);
    c.quadraticCurveTo(-length * 0.8, Math.sin(manta.phase * 0.7) * 6, -length * 1.2, 0);
    c.stroke();
    c.restore();
  }

  function draw(time) {
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.clearRect(0, 0, view.width, view.height);
    place(time);
    const [far, middle, near] = layers;

    c.drawImage(far.element, far.x, far.y, far.width, far.height);
    windows(far, time, 0.5);
    ray();
    rays(time);
    c.drawImage(middle.element, middle.x, middle.y, middle.width, middle.height);
    windows(middle, time, 0.9);
    jellyfish(time);
    fishes(time);
    c.drawImage(near.element, near.x, near.y, near.width, near.height);
    kelp(near, time);

    const flake = colours.light ? colours.lamp : mix(colours.lamp, colours.secondary, 0.3);
    for (const one of snow) {
      c.fillStyle = rgba(flake, one.alpha * (colours.light ? 0.6 : 1));
      c.fillRect(one.x, one.y, one.size, one.size);
    }
    c.strokeStyle = rgba(colours.light ? colours.secondary : colours.lamp, 0.35);
    c.lineWidth = 1;
    for (const bubble of bubbles) {
      c.beginPath();
      c.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      c.stroke();
    }
  }

  function tick(now) {
    const step = last ? Math.min(3, (now - last) / 16.67) : 1;
    last = now;
    clock += step / 60;
    depth += (scrollDepth() - depth) * Math.min(1, 0.08 * step);
    swim(step, clock);
    drift(step, clock);
    draw(clock);
    frame = requestAnimationFrame(tick);
  }

  function run() {
    cancelAnimationFrame(frame);
    if (still) {
      draw(0);
      return;
    }
    last = 0;
    if (!document.hidden) frame = requestAnimationFrame(tick);
  }

  build();
  run();

  // A phone's address bar changes the height as it scrolls, so only a real change rebuilds.
  let pending = 0;
  addEventListener("resize", () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      if (innerWidth === view.width && Math.abs(innerHeight - view.height) < 140) return;
      build();
      run();
    }, 200);
  });
  document.addEventListener("visibilitychange", run);
  new MutationObserver(() => {
    colours = palette();
    layers = LAYERS.map((spec, i) => buildLayer(spec, i, view, colours, ratio));
    if (still) draw(0);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  addEventListener("pointermove", (event) => {
    pointer = { x: event.clientX, y: event.clientY };
  });
  document.addEventListener("pointerleave", () => {
    pointer = null;
  });

  window.sea = {
    settings: SETTINGS,
    set(changes) {
      Object.assign(SETTINGS, changes);
      build();
      run();
    },
  };
}

if (canvas) start();
