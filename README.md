<div align="center">

<img src="src/assets/app-icon.png" width="120" alt="Atlantis">

# ATLANTIS WEB

**The website for [Atlantis](https://atlantis.orionpod.com), and where its builds are released.**

</div>

---

## How releases get here

The app lives in a private repo. Its `just publish` does the release end to end:

1. tags the app repo with `v<version>`
2. creates a GitHub release here with the DMG attached, a pre-release when the version has a suffix like `-beta.1`
3. deletes all but the newest three releases here, with their tags
4. writes the release into `src/_data/releases.json` and marks the ones no longer hosted as archived
5. commits `release: v<version>` and pushes `main`

The push runs `.github/workflows/deploy.yml`, which builds the site and deploys it to GitHub Pages. `src/_data/releases.json` is written by that script, so it is not edited by hand.

## What reads the release list

|                               |                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/_data/latest.js`         | the newest release still hosted, used by the hero and the download section                       |
| `src/download.njk`            | one card per release, with the changelog parsed from the app's `CHANGELOG.md`                    |
| `src/api/latest.json.11ty.js` | `/api/latest.json`, for an app build checking for an update. Not written until the first release |
| `src/llms.njk`                | `/llms.txt`                                                                                      |

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

`src/_data/site.js` holds the name, the address and the Google Analytics id. With the id empty the site loads no analytics, and the privacy page says so.
