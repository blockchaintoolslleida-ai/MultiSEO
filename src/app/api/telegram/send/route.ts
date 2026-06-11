import { sendTelegramMessage, formatSEOAlert } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { botToken, chatId, message, alerts } = body;

    // Two modes: direct message or formatted alerts
    if (message) {
      if (!botToken || !chatId) {
        return Response.json(
          { error: "botToken and chatId are required" },
          { status: 400 }
        );
      }
      const ok = await sendTelegramMessage(botToken, chatId, message);
      return Response.json({ data: { sent: ok } });
    }

    if (alerts && Array.isArray(alerts)) {
      if (!botToken || !chatId) {
        return Response.json(
          { error: "botToken and chatId are required" },
          { status: 400 }
        );
      }

      const formatted = alerts
        .map((a) => formatSEOAlert(a))
        .join("\n");

      const ok = await sendTelegramMessage(
        botToken,
        chatId,
        `📊 <b>SEO Alerts</b>\n\n${formatted}`
      );

      return Response.json({ data: { sent: ok } });
    }

    return Response.json(
      { error: "Either message or alerts array is required" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram send failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
