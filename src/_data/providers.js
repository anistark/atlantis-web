// What the app can run models through, or will. `ready` is what the newest release ships, so
// a provider built but not yet released, or not built yet, reads as soon. The ready ones lead,
// and the rest follow by how widely they are used.
export default [
  {
    name: "Ollama Cloud",
    mark: "ollama",
    ready: true,
    about: "Open models on Ollama's servers, through an API key.",
  },
  {
    name: "OpenAI",
    mark: "openai",
    about: "GPT models, billed to an API key.",
  },
  {
    name: "Anthropic",
    mark: "anthropic",
    about: "Claude models, billed to an API key.",
  },
  {
    name: "Google Gemini",
    mark: "gemini",
    about: "Gemini models, billed to an API key from AI Studio.",
  },
  {
    name: "ChatGPT",
    mark: "openai",
    about: "Sign in with ChatGPT and run on your plan.",
  },
  {
    name: "OpenRouter",
    mark: "openrouter",
    about: "Most labs' models on one key, or sign in to make one.",
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
    name: "Ollama",
    mark: "ollama",
    about: "The models you have pulled, on your own machine. No key.",
  },
  {
    name: "OpenCode Go",
    mark: "opencode",
    about: "Open models on one subscription.",
  },
  {
    name: "OrionPod",
    mark: "orionpod",
    about: "Models running on your own machine, through our own runtime.",
  },
  {
    name: "Bring your own endpoint",
    icon: "globe",
    about:
      "Groq, Together, LM Studio, vLLM or anything else that speaks OpenAI's API, by base URL.",
  },
];
