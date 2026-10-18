import OpenAI from "openai";

/**
 * Creates an OpenRouter client for deployments outside Replit that provide
 * their own OPENROUTER_API_KEY. This stays separate from the Replit-managed
 * proxy client so importing the direct client never requires Replit env vars.
 */
export function createDirectOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required for direct OpenRouter access.");
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
}
