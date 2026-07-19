import { proxyRequest } from "@/lib/proxy";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  return proxyRequest(`/ab/experiments/${id}/status`, req, {
    method: "POST",
    body,
  });
}
