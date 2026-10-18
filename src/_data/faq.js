import platforms from "./platforms.js";

const others = [
  platforms.windows && "a Windows 10 or 11 PC",
  platforms.linux && "a Linux machine on x64",
].filter(Boolean);
const machines = ["A Mac, Apple Silicon or Intel", ...others].join(", or ");

const updating = [
  "On a Mac, download it and drag it over the old app in Applications. macOS treats the new build as a new app, so it asks for Open Anyway again, and the keychain asks once more for each provider key.",
  platforms.windows && "On Windows, run the new installer over the old one.",
  platforms.linux &&
    "On Linux, install the new package the way you installed the first, or swap the old AppImage for the new one.",
].filter(Boolean);

export default [
  {
    question: "What does Atlantis need to run?",
    answer: `${machines}, and a model to talk to. Atlantis speaks to hosted models, so it needs an Ollama Cloud key or an endpoint you add by hand.`,
  },
  {
    question: "What is an agent here?",
    answer:
      "A folder with a `SOUL.md` at its root. The file says who the agent is, what it is for and which tools it should not use, and the agent is told all of it on every turn. Skills live beside it in the same folder.",
  },
  {
    question: "Can an agent touch files outside its folder?",
    answer:
      "No. Every path a tool is given is resolved against the agent's home, through symlinks too, and a path that lands outside is refused. Nothing under `.git` is written, and no tool runs a command.",
  },
  {
    question: "Where are my keys and my data kept?",
    answer: `Keys are in ${platforms.keychain}. The roster, settings, conversations and logbook are in the app's data folder on your ${platforms.machine}. The Storage tab in Tron shows each part and can clean it.`,
  },
  {
    question: "Does Atlantis send anything about me anywhere?",
    answer:
      "No. It talks to the model provider you set up, and to the web only when an agent's tool fetches a page or a file, a link in a message is drawn as a card, you browse AgentHub, Dr. House runs its checks, or it asks this site whether a newer build is out as it opens. None of these carry anything about you.",
  },
  {
    question: "macOS says it cannot open Atlantis. What now?",
    answer:
      "Open System Settings, then Privacy and Security, and press Open Anyway beside the message about Atlantis. It is needed once, the first time the app is opened.",
  },
  ...(platforms.windows
    ? [
        {
          question: "Windows says it protected my PC. What now?",
          answer:
            "Press More info, then Run anyway. The installer is not signed yet, so SmartScreen does not know it. It is needed once, when you install.",
        },
      ]
    : []),
  ...(platforms.linux
    ? [
        {
          question: "The AppImage does not start. What now?",
          answer:
            "Make it executable with `chmod +x`, then run it. It needs FUSE 2, which Ubuntu 24.04 and newer leave out: `sudo apt install libfuse2t64`. Or install the `.deb` or the `.rpm` instead, which need neither.",
        },
      ]
    : []),
  {
    question: "How do I update?",
    answer: platforms.only
      ? "Atlantis checks this site as it opens. When a newer build is out, Update shows at the foot of the left sidebar and opens that release here. Download it and drag it over the old app in Applications. Your agents, conversations and keys stay where they are. macOS treats the new build as a new app, so it asks for Open Anyway again, and the keychain asks once more for each provider key."
      : `Atlantis checks this site as it opens. When a newer build is out, Update shows at the foot of the left sidebar and opens that release here. Your agents, conversations and keys stay where they are. ${updating.join(" ")}`,
  },
  {
    question: "Is it free?",
    answer:
      "Yes. No account, no subscription and no tiers. You pay your model provider for what you use.",
  },
];
