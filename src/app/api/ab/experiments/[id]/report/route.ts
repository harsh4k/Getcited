import { proxyRequest } from "@/lib/proxy";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(`/ab/experiments/${id}/report`, req, { method: "GET" });
}
