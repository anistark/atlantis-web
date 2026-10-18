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

const join = (items, word) =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} ${word} ${items.at(-1)}` : items[0];
const only = list.length === 1;

export default {
  list,
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
