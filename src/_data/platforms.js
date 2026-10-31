import latest from "./latest.js";

// What the newest hosted release ships for, so no page names a build that is not out. macOS
// until a release carries more.
const ORDER = ["macOS", "Windows", "Linux"];
const KEYCHAINS = {
  macOS: "the macOS keychain",
  Windows: "Windows Credential Manager",
  Linux: "the Secret Service on Linux",
};

const shipped = new Set(latest?.assets.map((asset) => asset.os));
const list = ORDER.filter((os) => shipped.has(os));
if (!list.length) list.push("macOS");

const only = list.length === 1;

const join = (items, word) =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} ${word} ${items.at(-1)}` : items[0];

// The newest release's packages a card per platform, for the home page. A platform with more
// than one package, Linux's AppImage, .deb and .rpm, offers them in a dialog.
const MARKS = { macOS: "apple", Windows: "windows", Linux: "linux" };
const builds = list
  .map((os) => {
    const assets = latest?.assets.filter((asset) => asset.os === os) ?? [];
    const arches = [...new Set(assets.map((asset) => asset.arch))];
    const kinds = assets.map((asset) => asset.filename.split(".").pop());
    return {
      os,
      id: os.toLowerCase(),
      mark: MARKS[os],
      assets,
      arch: arches.join(", "),
      kinds: join(kinds, "or"),
    };
  })
  .filter((build) => build.assets.length > 0);

export default {
  list,
  builds,
  names: join(list, "and"),
  others: join(
    list.filter((os) => os !== "macOS"),
    "and",
  ),
  only,
  windows: list.includes("Windows"),
  linux: list.includes("Linux"),
  machine: only && list[0] === "macOS" ? "Mac" : "computer",
  keychain: join(
    list.map((os) => KEYCHAINS[os]),
    "or",
  ),
};
