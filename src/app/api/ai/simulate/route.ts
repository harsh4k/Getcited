import { NextResponse } from "next/server";
import { simulateAIAnswer } from "@/lib/openrouter";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit("ai-simulate", { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.` },
      { status: 429 }
    );
  }

  try {
    const { question, content } = await req.json();
    if (!question || !content) {
      return NextResponse.json(
        { error: "Question and content are required" },
        { status: 400 }
      );
    }
    const result = await simulateAIAnswer(question, content);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
