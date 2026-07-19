import { z } from "zod";
import { proxyRequest } from "@/lib/proxy";

const saveAdsSchema = z.object({
  url: z.string().trim().min(1),
  ads: z.record(z.string(), z.unknown()),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = saveAdsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
  return proxyRequest(`/audits/${id}/pages/ads`, req, {
    method: "POST",
    body: parsed.data,
  });
}
