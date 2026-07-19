import { proxyRequest } from "@/lib/proxy";

/** Playwright + DeepGaze can take several minutes on tall pages. */
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await req.json();
  return proxyRequest("/ads/analyze", req, { method: "POST", body });
}
