import { proxyRequest } from "@/lib/proxy";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const res = await proxyRequest("/ab/collect", req, { method: "POST", body });
  const headers = new Headers(res.headers);
  Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
