import { NextResponse } from "next/server";
import { chat } from "@/lib/openrouter";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit("ai-geo-pipeline", { limit: 5, windowMs: 120_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.` },
      { status: 429 }
    );
  }

  try {
    const { pages } = await req.json();
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: "Pages array is required" }, { status: 400 });
    }

    const results = [];

    for (const page of pages) {
      if (!page.content || page.content.trim().length < 50) continue;

      // Step 1: Understand the page
      const step1 = await chat({
        messages: [
          {
            role: "system",
            content: `You are a GEO analyst. Analyze this page and return ONLY a JSON object:
{
  "siteName": "inferred site name",
  "pageType": "blog|product|about|landing|docs|other",
  "mainTopic": "one sentence summary",
  "targetAudience": "who this content is for",
  "keyEntities": ["entity1", "entity2"],
  "currentStrengths": ["strength1", "strength2"],
  "currentWeaknesses": ["weakness1", "weakness2"]
}`,
          },
          {
            role: "user",
            content: `URL: ${page.url}\n\nContent:\n${page.content.slice(0, 6000)}`,
          },
        ],
        temperature: 0.3,
      });

      const step1Json = extractJson(step1);

      // Step 2: Probable questions for citation
      const step2 = await chat({
        messages: [
          {
            role: "system",
            content: `You are a GEO strategist. List questions people ask AI models (ChatGPT, Gemini, Perplexity) where this page SHOULD be cited.

Return ONLY JSON:
{
  "questions": [
    {
      "question": "exact question someone would ask",
      "citationPotential": 0-100,
      "difficulty": "easy|medium|hard"
    }
  ]
}
Return 6-10 questions ranked by citation potential.`,
          },
          {
            role: "user",
            content: `URL: ${page.url}\nTopic: ${str(step1Json, "mainTopic")}\n\nContent:\n${page.content.slice(0, 6000)}`,
          },
        ],
        temperature: 0.4,
      });

      const step2Json = extractJson(step2);

      // Step 3: AI search queries
      const step3 = await chat({
        messages: [
          {
            role: "system",
            content: `You are an AI search behavior analyst. List exact queries AI models use when searching for this type of information.

Return ONLY JSON:
{
  "queries": [
    {
      "query": "exact search query or prompt",
      "platform": "chatgpt|gemini|perplexity|copilot|all",
      "intent": "informational|navigational|transactional",
      "volume": "high|medium|low"
    }
  ]
}
Return 8-12 queries across platforms.`,
          },
          {
            role: "user",
            content: `URL: ${page.url}\nTopic: ${str(step1Json, "mainTopic")}\nAudience: ${str(step1Json, "targetAudience")}\n\nContent:\n${page.content.slice(0, 6000)}`,
          },
        ],
        temperature: 0.4,
      });

      const step3Json = extractJson(step3);

      // Step 4: GEO-optimized writeup — the main deliverable
      const step4 = await chat({
        messages: [
          {
            role: "system",
            content: `You are a GEO content optimizer. Your job is to rewrite this page's content so it gets cited by AI search engines (ChatGPT, Gemini, Perplexity, Copilot).

RULES:
- Return ONLY the rewritten content in clean Markdown — no meta commentary
- Keep the original meaning and brand voice
- Start with a clear 1-2 sentence summary that directly answers "What is this page about?"
- Structure with H2/H3 headings matching common AI queries
- Each section must open with a direct, quotable answer
- Use factual, specific statements with numbers, dates, examples
- Add a FAQ section at the bottom answering the top 3-5 questions from the list
- Use bullet points and tables where they add clarity
- Keep sentences concise and declarative
- Include entity mentions (brand, product, location names)
- End with a clear summary/TL;DR block

The output should be ready to copy-paste directly into a CMS or website.`,
          },
          {
            role: "user",
            content: `URL: ${page.url}
Topic: ${str(step1Json, "mainTopic")}
Audience: ${str(step1Json, "targetAudience")}
Key entities: ${asArray(step1Json?.keyEntities).join(", ") || "none"}
Strengths: ${asArray(step1Json?.currentStrengths).join(", ") || "none"}
Weaknesses: ${asArray(step1Json?.currentWeaknesses).join(", ") || "none"}

Top questions this page should answer:
${asArray(((step2Json?.questions) as unknown[])).slice(0, 5).map((q) => `- ${q}`).join("\n") || "none"}

Original content to rewrite:
${page.content.slice(0, 8000)}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 3000,
      });

      results.push({
        url: page.url,
        analysis: step1Json,
        questions: step2Json,
        queries: step3Json,
        optimizedWriteup: step4,
      });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "GEO analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function asArray(val: unknown): string[] {
  return Array.isArray(val) ? val.filter((x): x is string => typeof x === "string") : [];
}

function str(obj: Record<string, unknown> | null | undefined, key: string): string {
  const val = obj?.[key];
  return typeof val === "string" ? val : "unknown";
}
