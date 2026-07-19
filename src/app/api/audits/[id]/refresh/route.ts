import { proxyRequest } from "@/lib/proxy";

/** Crawl + diff can take a while on large sites. */
export const maxDuration = 300;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(`/audits/${id}/refresh`, req, { method: "POST", body: {} });
}
