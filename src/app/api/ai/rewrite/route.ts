import { NextResponse } from "next/server";
import { rewriteForAI } from "@/lib/openrouter";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit("ai-rewrite", { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.` },
      { status: 429 }
    );
  }

  try {
    const { content, instructions } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    const rewritten = await rewriteForAI(content, instructions || "");
    return NextResponse.json({ success: true, data: { rewritten } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rewrite failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
