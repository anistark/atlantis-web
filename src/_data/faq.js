export default [
  {
    question: "What does Atlantis need to run?",
    answer:
      "A Mac, Apple Silicon or Intel, and a model to talk to. Atlantis speaks to hosted models, so it needs an Ollama Cloud key or an endpoint you add by hand.",
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
    answer:
      "Keys are in the macOS keychain. The roster, settings, conversations and logbook are in the app's data folder on your Mac. The Storage tab in Tron shows each part and can clean it.",
  },
  {
    question: "Does Atlantis send anything about me anywhere?",
    answer:
      "No. It talks to the model provider you set up, and to the web only when an agent's tool fetches a page or a file, or a link in a message is drawn as a card.",
  },
  {
    question: "macOS says it cannot open Atlantis. What now?",
    answer:
      "Open System Settings, then Privacy and Security, and press Open Anyway beside the message about Atlantis. It is needed once, the first time the app is opened.",
  },
  {
    question: "Is it free?",
    answer:
      "Yes. No account, no subscription and no tiers. You pay your model provider for what you use.",
  },
];
