// What a build of the app can read to learn whether a newer one exists.
// Absent until the first release, so a reader can tell "none yet" from a broken endpoint.

export const data = {
  permalink: (data) => (data.latest ? "/api/latest.json" : false),
  eleventyExcludeFromCollections: true,
};

export function render({ latest }) {
  if (!latest) return "";
  return JSON.stringify(
    {
      version: latest.version,
      codename: latest.codename,
      stable: latest.stable,
      date: latest.date,
      notes: latest.notes,
      download_url: latest.assets[0].url,
    },
    null,
    2,
  );
}
