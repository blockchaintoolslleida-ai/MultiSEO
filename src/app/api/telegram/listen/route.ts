import { getTelegramUpdates } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const botToken = searchParams.get("botToken");

    if (!botToken) {
      return Response.json({ error: "botToken is required" }, { status: 400 });
    }

    const updates = await getTelegramUpdates(botToken);

    return Response.json({ data: { updates } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get updates";
    return Response.json({ error: message }, { status: 500 });
  }
}
