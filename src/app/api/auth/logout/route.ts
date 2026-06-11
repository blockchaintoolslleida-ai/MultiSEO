import { sessionCookieHeader } from "@/lib/auth";

export async function POST() {
  return Response.json(
    { data: { ok: true } },
    {
      headers: {
        "Set-Cookie": sessionCookieHeader("", true),
      },
    }
  );
}
