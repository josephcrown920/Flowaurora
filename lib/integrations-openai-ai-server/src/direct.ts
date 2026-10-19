import OpenAI from "openai";

/**
 * Creates a direct OpenAI client for deployments that provide their own
 * OPENAI_API_KEY. This is separate from the Replit-managed proxy client.
 */
export function createDirectOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for direct OpenAI access.");
  }

  return new OpenAI({ apiKey });
}
