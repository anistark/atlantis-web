import releases from "./releases.json" with { type: "json" };

export default releases.find((release) => !release.archived) ?? null;
