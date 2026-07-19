import { NextResponse } from "next/server";
import { discoverKeywords } from "@/lib/openrouter";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit("ai-keywords", { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.` },
      { status: 429 }
    );
  }

  try {
    const { niche, existingContent } = await req.json();
    if (!niche) {
      return NextResponse.json({ error: "Niche is required" }, { status: 400 });
    }
    const result = await discoverKeywords(niche, existingContent || "");
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Keyword discovery failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
