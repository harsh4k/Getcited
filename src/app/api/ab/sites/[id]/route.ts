import { proxyRequest } from "@/lib/proxy";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(`/ab/sites/${id}`, req, { method: "GET" });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  return proxyRequest(`/ab/sites/${id}`, req, { method: "PATCH", body });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(`/ab/sites/${id}`, req, { method: "DELETE" });
}
