import latest from "./latest.js";

// Whether the home page offers the download. Until v1 ships it keeps the early access waitlist,
// and builds stay on /download/ for the app's update check to open.
export default Boolean(latest) && Number(latest.version.split(".")[0]) >= 1;
