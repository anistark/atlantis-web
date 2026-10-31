<div align="center">

<img src="src/assets/app-icon.png" width="120" alt="Atlantis">

# ATLANTIS WEB

**The website for [Atlantis](https://atlantis.orionpod.com), and where its builds are released.**

</div>

---

## How releases get here

The app lives in a private repo. Its `just release beta` (or `alpha`, `stable`, `patch`) sets the next version, commits and tags it there, creates a draft release here with the notes picked for it, and starts `.github/workflows/release.yml`, which:

1. checks the tag out with the `ATLANTIS_DEPLOY_KEY` secret, a read-only deploy key on the app's repo, and builds it on macOS, Ubuntu 22.04 and Windows, running `just ci` on Ubuntu first
2. attaches the universal DMG, the `.deb`, `.rpm` and AppImage, and the Windows installer to the draft
3. once every build has attached its packages, publishes the release, a pre-release when the version has a suffix like `-beta.1`
4. deletes all but the newest three releases here, with their tags, keeping the newest stable one past them
5. writes the release into `src/_data/releases.json`, an asset per file with the DMG first, and marks the ones no longer hosted as archived
6. commits `release: v<version>`, pushes `main` and starts `.github/workflows/deploy.yml`, since a push with the workflow's token starts no workflow on its own

The deploy builds the site and deploys it to GitHub Pages. `src/_data/releases.json` is written by the workflow, so it is not edited by hand. If a build fails the release stays a draft and nothing public changes. Runs here are free because this repo is public, and their logs are public too.

## What reads the release list

|                               |                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/_data/latest.js`         | the newest release still hosted, used by the hero and the download section                                                           |
| `src/_data/platforms.js`      | the platforms the newest release ships for. Every page names only those, so the site says macOS until a release carries more         |
| `src/download.njk`            | one card per release, with the changelog parsed from the app's `CHANGELOG.md`                                                        |
| `src/api/latest.json.11ty.js` | `/api/latest.json`, which every app build reads as it opens to learn whether a newer one is out. Not written until the first release |
| `src/llms.njk`                | `/llms.txt`                                                                                                                          |

`/api/latest.json` is a contract with every build already installed. The app reads `version` and `codename`, and links to `/download/#v<version>`, the id `src/_includes/release.njk` gives each release card. A test in the app's `crates/atlantis-core/src/updates.rs` holds a copy of the file's fields, so renaming one, or changing the card's id, means changing the app first and leaving the old field in place until the builds that read it are gone.

## Model leaderboard

`/leaderboard/` rates every model Atlantis can run out of 10, linked from the footer. A rating is a model's share of the best score any model has today on the Artificial Analysis Intelligence Index, so 10 is the strongest model available and an open model that scores like it rates like it. The app shows the same rating beside every model, from its own copy of the scores in `crates/atlantis-core/src/power.rs`.

|                            |                                                                       |
| -------------------------- | --------------------------------------------------------------------- |
| `src/_data/matrix.json`    | the scores, with every other published benchmark and its sources      |
| `src/_data/leaderboard.js` | the rating, worked out the way `power.rs` works it out, and the order |
| `src/leaderboard.njk`      | the page                                                              |
| `src/js/leaderboard.js`    | the filters, the graph and table tabs, and the graph itself           |

The page shows the scores as a graph, with the table on a tab beside it. A search box, a list to tick any number of labs from, and an open-weights switch filter both. The graph is one view that never scrolls inside: every ranked model is a bubble with its name inside, drawn like a bubble under water, a sphere clear in the middle with its colour at the rim, at the height of its index score on a 0 to 80 scale, which leaves room over the best model for the next, in a column for the number of sources behind it. Several models share a score exactly, so overlapping bubbles are pushed apart, sideways first, and each one settles within a fraction of a point of its score, which the card on hover gives exactly. The field is laid out full size and shown scaled down so all of it fits. Pinching, Ctrl or Cmd with a scroll, a double click, or the zoom buttons scale it up around a point, up to five times, and dragging moves around it, with the axes held along the edges. A plain scroll is left to the page. The bubbles float, each on its own slow current, bumping softly off a neighbour and held within a few pixels of its level. The one being pointed at holds still, and nothing moves for a reader who asks for reduced motion, while the graph is off screen or while the tab is hidden. The two series colours are checked for colour-blind separation and contrast against the graph's ground in both themes. A model held to a vetted program, like Claude Mythos, is greyed out in the table and dashed on the graph.

It is refreshed by hand with the `refresh-leaderboard` skill in `.claude/skills/`, which gathers the latest published scores, rewrites `matrix.json` and carries the same scores into the app.

## Develop

Needs [Node 22](https://nodejs.org), [pnpm](https://pnpm.io) and [just](https://github.com/casey/just).

```sh
pnpm install
just dev
```

|              |                                               |
| ------------ | --------------------------------------------- |
| `just dev`   | serve with live reload on `localhost:8080`    |
| `just build` | build into `_site`, the way the workflow does |
| `just check` | prettier check, then build                    |

## Look

The site uses the app's own visual system. The accent and glass tokens at the top of `src/css/style.css` are copied from the app's `src/styles.css`, with a green that marks what is ready and a blue for what is working. The ground is the site's own: the deep sea in the dark theme and a light blue summer sea in the light one, each lighter at the surface (`--shallows`) and darker below (`--void`). The marks in `src/_includes/icons.njk` are the app's icons. The ground behind every page is `src/js/sea.js`, a sunken city drawn on a canvas from a seed, with fish, jellyfish and a manta moving through it. Its settings sit at the top of the file, and `sea.set({ fish: 120 })` in the browser console tries one live. When the app's palette moves, copy the tokens across.

`src/assets/og.png` is the hero at 1200 by 630, taken from the built site.

## Settings

`src/_data/site.js` holds the name, the address, the Google Analytics id and the Kit form id. With the id empty the site loads no analytics, and the privacy page says so. `kit` is the id of the [Kit](https://kit.com) form behind the list to hear when Atlantis goes live. While the newest build is an alpha, below 1.0, it shows under the download as Get notified, and before the first release it shows in its place. With it empty the list does not show.
