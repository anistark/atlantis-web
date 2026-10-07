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

const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.dataset.shown = "true";
      reveal.unobserve(entry.target);
    }
  },
  { rootMargin: "0px 0px -40px 0px" },
);
document.querySelectorAll(".reveal").forEach((element) => reveal.observe(element));

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-download]");
  if (link && typeof window.gtag === "function") {
    window.gtag("event", "download", { version: link.dataset.download });
  }
});
