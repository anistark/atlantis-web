import markdownIt from "markdown-it";

const markdown = markdownIt({ html: false, linkify: true });

export default function (eleventyConfig) {
  for (const path of ["src/assets", "src/css", "src/js", "src/CNAME", "src/robots.txt"]) {
    eleventyConfig.addPassthroughCopy(path);
  }

  // Changelog lines are Markdown, written for the repo. Inline only, so a line stays a line.
  eleventyConfig.addFilter("inline", (text) => markdown.renderInline(text ?? ""));

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
}
