import markdownIt from "markdown-it";

const markdown = markdownIt({ html: false, linkify: true });

export default function (eleventyConfig) {
  for (const path of ["src/assets", "src/css", "src/js", "src/CNAME", "src/robots.txt"]) {
    eleventyConfig.addPassthroughCopy(path);
  }

  // Changelog lines are Markdown, written for the repo. Inline only, so a line stays a line.
  eleventyConfig.addFilter("inline", (text) => markdown.renderInline(text ?? ""));

  // What the leaderboard's script needs of each model, in table order, and nothing more.
  eleventyConfig.addFilter("graphable", (models) =>
    models.map(
      ({
        name,
        maker,
        makerSite,
        about,
        released,
        open,
        access,
        index,
        estimate,
        rating,
        flame,
        sources,
      }) => ({
        name,
        maker,
        makerSite,
        about,
        released,
        open,
        access,
        index,
        estimate,
        rating,
        flame,
        sources: sources.length,
      }),
    ),
  );

  // A source as the site it is on, which is what a reader scans a list of links for.
  eleventyConfig.addFilter("host", (url) => new URL(url).hostname.replace(/^www\./, ""));

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
}
