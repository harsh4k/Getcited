import { supabaseServer } from "@/lib/supabase/server";

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:5001";

export async function proxyRequest(
  path: string,
  req: Request,
  opts?: { method?: string; body?: unknown }
) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  // Forward cookies from browser to Flask
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  // Identify the Supabase user to Flask. Flask trusts this header only because
  // it binds to 127.0.0.1 and is reached exclusively through this proxy.
  try {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();
    if (data.user?.email) headers.set("x-user-email", data.user.email);
  } catch {
    // No session — Flask will answer 401 with a clean JSON error
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND}${path}`, {
      method: opts?.method || "POST",
      headers,
      body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    return Response.json(
      { error: `Backend is not reachable at ${BACKEND}. Start the Flask server and try again.` },
      { status: 502 }
    );
  }

  // Forward Set-Cookie from Flask back to browser
  const setCookie = res.headers.get("set-cookie");
  const data = await res
    .json()
    .catch(() => ({ error: `Backend returned an invalid response (${res.status})` }));

  return Response.json(data, {
    status: res.status,
    headers: setCookie ? { "set-cookie": setCookie } : undefined,
  });
}
