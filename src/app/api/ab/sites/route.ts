import { proxyRequest } from "@/lib/proxy";

export async function GET(req: Request) {
  return proxyRequest("/ab/sites", req, { method: "GET" });
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyRequest("/ab/sites", req, { method: "POST", body });
}
