// What the app can run models through, in the order its Add provider sheet lists them. `ready`
// is what the newest release ships, so a provider built but not yet released reads as soon.
export default [
  {
    name: "Ollama Cloud",
    mark: "ollama",
    ready: true,
    about: "Open models on Ollama's servers, through an API key.",
  },
  {
    name: "Ollama",
    mark: "ollama",
    about: "The models you have pulled, on your own machine. No key.",
  },
  {
    name: "OpenRouter",
    mark: "openrouter",
    about: "Most labs' models on one key, or sign in to make one.",
  },
  {
    name: "OpenCode Go",
    mark: "opencode",
    about: "Open models on one subscription.",
  },
  {
    name: "OpenAI",
    mark: "openai",
    about: "GPT models, billed to an API key.",
  },
  {
    name: "ChatGPT",
    mark: "openai",
    about: "Sign in with ChatGPT and run on your plan.",
  },
  {
    name: "Anthropic",
    mark: "anthropic",
    about: "Claude models, billed to an API key.",
  },
  {
    name: "OpenAI-compatible",
    icon: "globe",
    about: "Groq, Together, LM Studio, vLLM and the rest, by base URL.",
  },
];
