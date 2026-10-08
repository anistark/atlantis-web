const root = document.documentElement;
const toggle = document.querySelector("[data-theme-toggle]");

function label() {
  const light = root.dataset.theme === "light";
  toggle?.setAttribute(
    "aria-label",
    light ? "Switch to the dark theme" : "Switch to the light theme",
  );
}

label();
toggle?.addEventListener("click", () => {
  const light = root.dataset.theme !== "light";
  if (light) root.dataset.theme = "light";
  else delete root.dataset.theme;
  try {
    localStorage.setItem("theme", light ? "light" : "dark");
  } catch {}
  label();
});

// The house on the home page. Every few seconds one agent gets up and goes to another room, and
// the logbook says why. It runs only while the stage is on screen, and not at all with reduced
// motion, where the house keeps the positions it was drawn with.
const house = document.querySelector("[data-house]");
const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (house && !still) {
  const rooms = {
    study: {
      state: "working",
      seats: [
        [68, 104],
        [168, 104],
        [268, 104],
        [68, 190],
        [168, 190],
        [268, 190],
      ],
    },
    garage: {
      state: "working",
      seats: [
        [182, 324],
        [270, 324],
        [226, 284],
        [226, 366],
      ],
    },
    kitchen: {
      state: "idle",
      seats: [
        [396, 116],
        [464, 116],
        [430, 150],
      ],
    },
    game: {
      state: "idle",
      seats: [
        [570, 96],
        [718, 96],
        [620, 207],
        [690, 207],
      ],
    },
    records: {
      state: "idle",
      seats: [
        [520, 372],
        [660, 372],
      ],
    },
  };
  const work = {
    scribe: [
      "edit_file chapters/03.md",
      "write_file notes/outline.md",
      "read_file drafts/intro.md",
    ],
    scout: [
      'web_search "local model benchmarks"',
      "fetch_page arxiv.org/abs/2410.01",
      "download_file papers/survey.pdf",
    ],
    ledger: ["read_file books/october.csv", "edit_file books/summary.md", 'search_files "invoice"'],
    atlas: ['search_files "TODO"', "download_file maps/coast.pdf", "read_file routes/plan.md"],
    echo: ["read_file inbox/today.md", "write_file replies/draft.md", "edit_file replies/draft.md"],
  };
  const done = {
    scribe: "chapter 3",
    scout: "the reading list",
    ledger: "the October summary",
    atlas: "the coast map",
    echo: "your replies",
  };

  const agents = [...house.querySelectorAll("[data-agent]")].map((element) => {
    const [x, y] = element.style.transform.match(/-?[\d.]+/g).map(Number);
    const room = Object.keys(rooms).find((name) =>
      rooms[name].seats.some(([sx, sy]) => sx === x && sy === y),
    );
    return { element, name: element.dataset.agent, room, seat: [x, y] };
  });
  const log = house.querySelector("[data-house-log]");
  const status = house.querySelector("[data-house-status]");
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  let minutes = 9 * 60 + 38;
  let last = null;

  function says(agent) {
    if (agent.room === "study") return pick(work[agent.name]);
    if (agent.room === "garage") return "joined the debate in the garage";
    if (agent.room === "kitchen")
      return `took a break in the kitchen after ${30 + Math.floor(Math.random() * 60)}k tokens`;
    if (agent.room === "game") return "got bored and went to the game room";
    return `sent you a notification, ${done[agent.name]} is ready`;
  }

  function step() {
    const agent = pick(agents.filter((each) => each !== last));
    const taken = new Set(agents.map((each) => each.seat.join()));
    const options = Object.keys(rooms).filter(
      (name) => name !== agent.room && rooms[name].seats.some((seat) => !taken.has(seat.join())),
    );
    const room = pick(options);
    const seat = pick(rooms[room].seats.filter((each) => !taken.has(each.join())));
    Object.assign(agent, { room, seat });
    last = agent;

    const state = rooms[room].state;
    agent.element.dataset.state = state;
    agent.element.style.transform = `translate(${seat[0]}px, ${seat[1]}px)`;

    minutes += 1 + Math.floor(Math.random() * 3);
    const time = `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    const line = document.createElement("li");
    line.innerHTML = `<span class="log-time">${time}</span><span><span class="log-who" data-state="${state}">${agent.name}</span> </span>`;
    line.lastChild.append(says(agent));
    log.prepend(line);
    while (log.children.length > 8) log.lastElementChild.remove();

    const working = agents.filter((each) => rooms[each.room].state === "working").length;
    status.textContent = `${agents.length} agents, ${working} working`;
  }

  let timer = null;
  new IntersectionObserver(([entry]) => {
    clearInterval(timer);
    if (entry.isIntersecting) timer = setInterval(step, 2600);
  }).observe(house);
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-download]");
  if (link && typeof window.gtag === "function") {
    window.gtag("event", "download", { version: link.dataset.download });
  }
});
