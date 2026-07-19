import { proxyRequest } from "@/lib/proxy";

export async function POST(req: Request) {
  const body = await req.json();
  return proxyRequest("/ads/analyze", req, { method: "POST", body });
}
