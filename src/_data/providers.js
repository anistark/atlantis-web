// What the app can run models through, or will. `ready` is what the newest release ships, so
// a provider built but not yet released, or not built yet, reads as soon. Four to a row: the
// ready ones fill the first two, the hosted labs ahead of the routers, your own machine and
// your own endpoint, and the ones still to come take the third.
export default [
  {
    name: "Ollama Cloud",
    mark: "ollama",
    ready: true,
    about: "Open models on Ollama's servers, through an API key.",
  },
  {
    name: "Anthropic",
    mark: "anthropic",
    ready: true,
    about: "Claude models, billed to an API key.",
  },
  {
    name: "OpenAI",
    mark: "openai",
    ready: true,
    about: "GPT models, billed to an API key.",
  },
  {
    name: "ChatGPT",
    mark: "openai",
    ready: true,
    about: "Sign in with ChatGPT and run on your plan.",
  },
  {
    name: "OpenRouter",
    mark: "openrouter",
    ready: true,
    about: "Most labs' models on one key, or sign in to make one.",
  },
  {
    name: "OpenCode Go",
    mark: "opencode",
    ready: true,
    about: "Open models on one subscription.",
  },
  {
    name: "Ollama",
    mark: "ollama",
    ready: true,
    about: "The models you have pulled, on your own machine. No key.",
  },
  {
    name: "Bring your own endpoint",
    icon: "globe",
    ready: true,
    about:
      "Groq, Together, LM Studio, vLLM or anything else that speaks OpenAI's API, by base URL.",
  },
  {
    name: "Google Gemini",
    mark: "gemini",
    about: "Gemini models, billed to an API key from AI Studio.",
  },
  {
    name: "xAI",
    mark: "xai",
    about: "Grok models, billed to an API key.",
  },
  {
    name: "DeepSeek",
    mark: "deepseek",
    about: "DeepSeek models from the source, billed to an API key.",
  },
  {
    name: "OrionPod",
    mark: "orionpod",
    about: "Models running on your own machine, through our own runtime.",
  },
];
