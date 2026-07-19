import { proxyRequest } from "@/lib/proxy";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const res = await proxyRequest(`/ab/config/${encodeURIComponent(key)}`, req, { method: "GET" });
  const headers = new Headers(res.headers);
  Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
