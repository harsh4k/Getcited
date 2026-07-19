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

/** Current free-tier models (roster rotates — keep :free suffix only). */
const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";

const FALLBACK_MODELS = (
  process.env.OPENROUTER_FALLBACK_MODELS ||
  [
    "google/gemma-4-31b-it:free",
    "openai/gpt-oss-20b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "meta-llama/llama-3.2-3b-instruct:free",
  ].join(",")
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const MAX_RETRIES = 4;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(res: Response, attempt: number): number {
  const retryAfter = res.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds * 1000);
  }
  // Free tier is ~20 RPM; back off aggressively with jitter
  const base = 3000 * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 1000);
  return Math.min(base + jitter, 60_000);
}

export async function chat({
  model = DEFAULT_MODEL,
  messages,
  temperature = 0.7,
  max_tokens = 2048,
}: ChatOptions): Promise<string> {
  // Only free-tier slugs — never auto-upgrade to paid variants from error messages
  const queue = [model, ...FALLBACK_MODELS.filter((m) => m !== model)].filter((m) =>
    m === "openrouter/free" || m.endsWith(":free")
  );

  if (queue.length === 0) {
    throw new Error("No free OpenRouter models configured. Set OPENROUTER_MODEL to a *:free slug.");
  }

  let lastError = "AI service error. Please try again.";
  let modelIndex = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES + queue.length; attempt++) {
    const activeModel = queue[Math.min(modelIndex, queue.length - 1)];

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://getcited.studio",
        "X-Title": process.env.OPENROUTER_APP_NAME || "Getcited",
      },
      body: JSON.stringify({
        model: activeModel,
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (res.ok) {
      const data: ChatResponse = await res.json();
      return data.choices[0]?.message?.content || "";
    }

    const errBody = await res.text().catch(() => "");

    if (res.status === 402) {
      throw new Error(
        "AI service is temporarily unavailable (free-tier limit reached). Wait and try again, or check your OpenRouter free quota."
      );
    }

    if (res.status === 404) {
      // Model rotated off free tier — try the next free slug
      lastError = `Free model unavailable (${activeModel}). Trying another…`;
      if (modelIndex < queue.length - 1) {
        modelIndex += 1;
        continue;
      }
      throw new Error(
        "No free OpenRouter models are currently available. Check openrouter.ai/models?q=free for updated :free slugs."
      );
    }

    if (res.status === 429) {
      lastError =
        "OpenRouter rate limit hit (free tier is ~20 req/min and ~50/day). Waiting and retrying…";
      if (attempt < MAX_RETRIES + queue.length) {
        await sleep(retryDelayMs(res, attempt));
        continue;
      }
      throw new Error(
        "Too many requests to the free AI tier. Wait a minute and try again."
      );
    }

    lastError = `AI service error (${res.status})${errBody ? `: ${errBody.slice(0, 200)}` : ""}. Please try again.`;
    if (res.status >= 500 && attempt < MAX_RETRIES + queue.length) {
      // Prefer next model on provider outage
      if (modelIndex < queue.length - 1) modelIndex += 1;
      await sleep(retryDelayMs(res, attempt));
      continue;
    }
    throw new Error(lastError);
  }

  throw new Error(lastError);
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
