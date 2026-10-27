import latest from "./latest.js";

// Whether the newest hosted build is an alpha, which every release below 1.0 is. It is offered to
// download all the same, with a word that it is early and a list to hear when Atlantis goes live.
export default Boolean(latest) && Number(latest.version.split(".")[0]) < 1;
