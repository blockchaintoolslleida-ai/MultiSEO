export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { botToken, chatId } = body;

    if (!botToken || !chatId) {
      return Response.json({ error: "botToken and chatId are required" }, { status: 400 });
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ *MultiSEO:* Configuración de Telegram completada.\n\nRecibirás notificaciones SEO aquí.",
        parse_mode: "Markdown",
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return Response.json({
        data: { ok: false, error: data.description || `HTTP ${res.status}` },
      });
    }

    return Response.json({ data: { ok: true } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Test failed";
    return Response.json({ data: { ok: false, error: msg } });
  }
}
