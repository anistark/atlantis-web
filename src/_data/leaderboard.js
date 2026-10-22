// The model leaderboard: `matrix.json`, the published scores the refresh skill gathers, with the
// rating worked out the way the app works it out in `crates/atlantis-core/src/power.rs`. A
// rating is the model's share of the best score any model has today, out of 10, rounded and
// never under 1. A model with no score is unranked, 0. The two have to agree, so a change to
// the formula is made in both places.
import matrix from "./matrix.json" with { type: "json" };

const MAX = 10;

// Each maker's own site, and the hosts that are theirs, so a model's own page among its sources
// can be told from a leaderboard's or a blog's.
const MAKERS = {
  Anthropic: { site: "https://www.anthropic.com", hosts: ["anthropic.com"] },
  OpenAI: { site: "https://openai.com", hosts: ["openai.com"] },
  Google: {
    site: "https://deepmind.google",
    hosts: ["deepmind.google", "blog.google", "ai.google.dev", "cloud.google.com"],
  },
  xAI: { site: "https://x.ai", hosts: ["x.ai"] },
  DeepSeek: { site: "https://www.deepseek.com", hosts: ["deepseek.com"] },
  "Alibaba Qwen": { site: "https://qwen.ai", hosts: ["qwen.ai", "qwenlm.github.io"] },
  "Moonshot AI": { site: "https://www.moonshot.ai", hosts: ["moonshot.ai"] },
  "Z.ai": { site: "https://z.ai", hosts: ["z.ai"] },
  MiniMax: { site: "https://www.minimax.io", hosts: ["minimax.io"] },
  Mistral: { site: "https://mistral.ai", hosts: ["mistral.ai"] },
  Meta: { site: "https://ai.meta.com", hosts: ["ai.meta.com", "llama.com"] },
  NVIDIA: { site: "https://www.nvidia.com/en-us/ai/", hosts: ["nvidia.com"] },
  Microsoft: { site: "https://azure.microsoft.com/en-us/products/phi", hosts: ["microsoft.com"] },
};

function hostOf(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}

// The page that says most about a model, from its sources: its maker's own, then its model card
// on Hugging Face, then its page on Artificial Analysis, then its first source that is about it
// rather than a leaderboard of everything.
function about(model) {
  const own = MAKERS[model.maker]?.hosts ?? [];
  const sources = model.sources;
  return (
    sources.find((url) =>
      own.some((host) => hostOf(url) === host || hostOf(url).endsWith(`.${host}`)),
    ) ??
    sources.find((url) => hostOf(url) === "huggingface.co") ??
    sources.find((url) => url.startsWith("https://artificialanalysis.ai/models/")) ??
    sources.find((url) => !url.includes("leaderboard")) ??
    null
  );
}

function rate(index) {
  if (index === null) return 0;
  return Math.min(MAX, Math.max(1, Math.round((index * MAX) / matrix.top)));
}

// The colour a rating burns in on the page, the app's five bands.
function flame(rating) {
  if (rating >= 10) return "mono";
  if (rating === 9) return "blue";
  if (rating >= 7) return "red";
  if (rating >= 4) return "green";
  return "yellow";
}

// The version a Terminal-Bench figure was run on, and whether the model's maker ran it. The
// notes in the matrix say more, harness and all, which is more than a table cell can carry.
function terminalBench(model) {
  const said = model.terminalBenchVersion ?? "";
  const version = said.match(/^\d+(\.\d+)?/)?.[0] ?? null;
  return { version, maker: /vendor/i.test(said) && !/AA-run|independent/i.test(said) };
}

// An effort setting is worth showing only when it names one.
const EFFORTS = ["max", "xhigh", "high", "medium", "low", "reasoning", "non-reasoning"];

function effort(model) {
  const said = (model.effort ?? "").toLowerCase();
  return EFFORTS.find((word) => said === word || said.startsWith(`${word} `)) ?? null;
}

// Strongest first, by the score rather than the rounded rating so ties inside a rating keep
// their order. Two models on the same score go newest first, by release date, and then by
// name. Unranked last.
const models = matrix.models
  .map((model) => {
    const rating = rate(model.index);
    return {
      ...model,
      rating,
      flame: flame(rating),
      makerSite: MAKERS[model.maker]?.site ?? null,
      about: about(model),
      effort: effort(model),
      terminalBench: { score: model.terminalBench, ...terminalBench(model) },
    };
  })
  .sort(
    (a, b) =>
      (b.index ?? -1) - (a.index ?? -1) ||
      (b.released ?? "").localeCompare(a.released ?? "") ||
      a.name.localeCompare(b.name),
  );

// The labs behind the models, with how many models each has here, for the filter: the most
// models first, and labs with as many in name order.
const labs = [...new Set(models.map((model) => model.maker))]
  .map((name) => ({ name, count: models.filter((model) => model.maker === name).length }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

const updated = new Date(`${matrix.updated}T00:00:00Z`).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default {
  ...matrix,
  max: MAX,
  updatedText: updated,
  models,
  labs,
  ranked: models.filter((model) => model.rating > 0).length,
  best: models.filter((model) => model.index === matrix.top && !model.estimate),
  // The scale, low to high, each band as many steps wide as the ratings it holds, and said as
  // what a model there can be trusted with.
  bands: [
    {
      flame: "yellow",
      range: "1 to 3",
      from: 1,
      span: 3,
      says: "Everyday chores: summaries, short drafts, quick answers",
    },
    {
      flame: "green",
      range: "4 to 6",
      from: 4,
      span: 3,
      says: "Day-to-day work: writing, simple code, looking things up with tools",
    },
    {
      flame: "red",
      range: "7 to 8",
      from: 7,
      span: 2,
      says: "Real projects: multi-step coding, deep research, agents on their own",
    },
    { flame: "blue", range: "9", from: 9, span: 1, says: "Long, hard tasks alone" },
    { flame: "mono", range: "10", from: 10, span: 1, says: "The hardest problems" },
  ],
};
