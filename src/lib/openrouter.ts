const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface ChatChoice {
  message: { role: string; content: string };
  finish_reason: string;
}

interface ChatResponse {
  id: string;
  choices: ChatChoice[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

const DEFAULT_MODEL = "openrouter/free";

export async function chat({ model = DEFAULT_MODEL, messages, temperature = 0.7, max_tokens = 2048 }: ChatOptions): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://getcited.studio",
      "X-Title": process.env.OPENROUTER_APP_NAME || "Getcited",
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens }),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 402) {
      throw new Error("AI service is temporarily unavailable (free tier limit reached). Please try again in a few minutes.");
    }
    if (res.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    throw new Error(`AI service error (${res.status}). Please try again.`);
  }

  const data: ChatResponse = await res.json();
  return data.choices[0]?.message?.content || "";
}

export async function analyzeForGEO(pageContent: string, url: string) {
  const system = `You are Getcited's scoring engine. Analyze the page content for AI-citation friendliness.
Return JSON with:
{
  "geoScore": number (0-100),
  "subscores": {
    "entityClarity": number,
    "citationFriendliness": number,
    "schemaValidity": number,
    "factualDensity": number,
    "structure": number,
    "sourceCredibility": number
  },
  "issues": [{ "title": string, "impact": "high"|"medium"|"low", "fix": string }],
  "summary": string
}`;

  const response = await chat({
    messages: [
      { role: "system", content: system },
      { role: "user", content: `URL: ${url}\n\nPage content:\n${pageContent.slice(0, 8000)}` },
    ],
    temperature: 0.3,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse GEO analysis");
  return JSON.parse(jsonMatch[0]);
}

export async function rewriteForAI(content: string, instructions: string) {
  const response = await chat({
    messages: [
      {
        role: "system",
        content: `You are an AI content optimizer. Rewrite content to be more citation-friendly for AI models like ChatGPT, Gemini, and Perplexity.
Rules:
- Keep the original meaning
- Add clear entity mentions
- Structure with headings and lists
- Include direct answers near the top
- Use factual, quotable statements
- Return the rewritten content in markdown`,
      },
      {
        role: "user",
        content: `Original content:\n${content}\n\nAdditional instructions: ${instructions}`,
      },
    ],
    temperature: 0.5,
  });
  return response;
}

export async function discoverKeywords(niche: string, existingContent: string) {
  const system = `You are a keyword researcher for AI search optimization.
Return JSON with:
{
  "keywords": [{
    "keyword": string,
    "citationPotential": number (0-100),
    "competition": "low"|"medium"|"high",
    "isGap": boolean,
    "reason": string
  }]
}
Focus on questions and queries people ask AI models.`;

  const response = await chat({
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `Niche: ${niche}\nExisting content topics: ${existingContent.slice(0, 3000)}`,
      },
    ],
    temperature: 0.4,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse keywords");
  return JSON.parse(jsonMatch[0]);
}

export async function simulateAIAnswer(question: string, content: string) {
  const response = await chat({
    messages: [
      {
        role: "system",
        content: `You are simulating how an AI assistant (like ChatGPT) would answer a question.
Based on the provided content, generate:
{
  "answer": string (how AI would answer),
  "citedSources": [{ "title": string, "url": string, "relevance": number }],
  "citationProbability": number (0-100, how likely this content would be cited),
  "gaps": [string] (what's missing that would improve citation chances)
}`,
      },
      {
        role: "user",
        content: `Question: ${question}\n\nSource content:\n${content.slice(0, 6000)}`,
      },
    ],
    temperature: 0.4,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse simulation");
  return JSON.parse(jsonMatch[0]);
}
