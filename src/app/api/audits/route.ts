import { z } from "zod";
import { proxyRequest } from "@/lib/proxy";

const createAuditSchema = z.object({
  url: z.string().trim().min(1, "URL is required"),
});

export async function GET(req: Request) {
  return proxyRequest("/audits", req, { method: "GET" });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = createAuditSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
  return proxyRequest("/audits", req, { method: "POST", body: parsed.data });
}

export async function DELETE(req: Request) {
  return proxyRequest("/audits", req, { method: "DELETE" });
}
