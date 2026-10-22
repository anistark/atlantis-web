---
name: refresh-leaderboard
description: Refresh the public model leaderboard at /leaderboard/ from the latest published benchmarks, and carry the same scores into the Atlantis app's power ratings. Use when asked to refresh, update or re-run the leaderboard, when a new model ships and should be rated, or when the Artificial Analysis Intelligence Index has a new version. Run by hand, from time to time.
---

# Refresh the model leaderboard

The leaderboard rates every model Atlantis can run out of 10. The site and the app must give
every model the same rating, so a refresh changes both:

| What                      | Where                                                                    |
| ------------------------- | ------------------------------------------------------------------------ |
| The scores                | `src/_data/matrix.json` in this repo                                     |
| The formula, for the page | `src/_data/leaderboard.js` in this repo                                  |
| The page                  | `src/leaderboard.njk` in this repo                                       |
| The app's copy            | `crates/atlantis-core/src/power.rs` in `../atlantis`, `SCORES` and `TOP` |

## The rating

A model's rating is `round(10 × index / top)`, never under 1, where `index` is its score on the
Artificial Analysis Intelligence Index and `top` is the highest score of any model available
today, private or public. A model with no independent index score is unranked, 0. Nothing else
moves the rating. The other columns are context.

The scale's words, what a model in each band can be trusted with, are `bands` in
`leaderboard.js` and `POWER_MEANS` in the app's `src/models.tsx`, and change together too.

The formula lives in `leaderboard.js` and in `power.rs`. Do not change it in one without the other,
and do not change it at all unless the person asks.

## Steps

1. **Read what is there.** Open `src/_data/matrix.json` and note `updated`, `indexVersion`, `top`
   and which models are listed. Open `../atlantis/crates/atlantis-core/src/power.rs` and note
   `TOP` and `SCORES`. If `../atlantis` is not there, ask where the app repo is.

2. **Research.** Use the `deep-research` skill when it is available, otherwise spawn researchers
   in parallel, one per group of makers: Anthropic, OpenAI, Google and xAI, the Chinese open
   labs (DeepSeek, Qwen, Kimi, GLM, MiniMax), and the rest (Mistral, Meta, NVIDIA, Microsoft),
   plus one on the leaderboards themselves. Ask each for, per model, as of today:
   - the Artificial Analysis Intelligence Index score, its version and the effort it was run at
     (artificialanalysis.ai model pages and leaderboard)
   - LMArena text Elo, Terminal-Bench with its version, SWE-bench Pro and Verified, Humanity's
     Last Exam, GPQA Diamond
   - release date, whether the weights are open, and a source URL for every figure
   - whether each figure is independent or the maker's own
     Cover every model already in `matrix.json`, every model that has shipped since `updated`, and
     every model id in `SCORES` in `power.rs`, since those are what people run in the app.

3. **Check the index version first.** If Artificial Analysis has moved to a new version, the
   scale has moved: re-read every model's score on the new version, set `indexVersion`, and never
   mix scores from two versions. A model that has no score on the new version becomes unranked
   until it gets one.

4. **Write `src/_data/matrix.json`.** Keep its shape:

   ```json
   {
     "updated": "YYYY-MM-DD",
     "index": "Artificial Analysis Intelligence Index",
     "indexVersion": "v4.3.2",
     "indexUrl": "https://artificialanalysis.ai/leaderboards/models",
     "top": 58,
     "models": [
       {
         "name": "Claude Opus 5.5",
         "maker": "Anthropic",
         "released": "2026-09-22",
         "open": false,
         "access": "public",
         "index": 58,
         "estimate": false,
         "effort": "max",
         "arena": 1519,
         "terminalBench": 59.6,
         "terminalBenchVersion": "4.0 (AA)",
         "swePro": 89.9,
         "sweVerified": null,
         "hle": 64.4,
         "gpqa": null,
         "sources": ["https://..."]
       }
     ]
   }
   ```

   - `access` is `public` for a model anyone can use, through an API, an app or a paid plan,
     and `restricted` for one held to a vetted program, with `accessNote` saying which. A
     restricted model keeps its rating and is greyed out in the table and drawn as a dashed
     outline on the graph. Check each one again: a restricted model often opens up.
   - `released` is the date the model became generally available, `YYYY-MM-DD`, or `YYYY-MM`
     when only the month is known, or `null`. It is shown in the table and the graph's card, and
     breaks a tie between two models on the same score, newest first.
   - `index` is the independent index score at the best effort the model is generally available
     at, or `null`. Never guess one, and never use a maker's own figure for it.
   - `estimate: true` only for a model with no independent score that has a stated, sourced way
     to place it, the way Claude Mythos is Fable's score lifted by the published gap between the
     two. Say how in the page's "Where to be careful" list.
   - `top` is the highest `index` of any model available today. An estimate can tie it, never
     set it.
   - `terminalBenchVersion` starts with the version number. Add `vendor` when the maker ran it.
   - Other columns are `null` when nobody publishes them. Every model keeps its `sources`.
   - Leave out models that have not shipped.

5. **Carry the scores into the app.** In `power.rs`, set `TOP` and update `SCORES` to match:
   one entry per model, keyed by the start of its identifier in plain form (lowercase, the part
   after the last `/`, with `.`, `_`, `:` and spaces as `-`). Add the spellings people run it
   under, an Ollama tag and an API id where they differ. Update the date and index version in
   the module comment. Then, in `../atlantis`:

   ```sh
   cargo test -p atlantis-core power
   ```

   `every_model_configured_here_is_ranked` lists the models the person runs; keep it passing, or
   say which model lost its score and why. Add a line under `### Changed` in the app's
   `CHANGELOG.md` when ratings moved.

6. **Check the site.** Run `pnpm format`, then `just check`, then serve `_site` and look at
   `/leaderboard/` at desktop and phone widths in both themes, in both the table and the graph.
   The page must not scroll sideways. Only the table scrolls inside its card, never the graph.
   On the graph, hover a few bubbles and point at the card's flames, zoom in and drag about,
   tick a couple of labs, and check that no bubbles sit on top of each other.

7. **Report.** Say what changed: new models, ratings that moved, a new index version or a new
   top, and anything left unranked. Do not commit or push unless the person says so. A push to
   `main` here deploys the site publicly.
