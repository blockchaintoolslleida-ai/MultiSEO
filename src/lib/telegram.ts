const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    const url = `${TELEGRAM_API}/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

export async function getTelegramUpdates(
  botToken: string,
  offset?: number
): Promise<{ updateId: number; chatId: string; text: string }[]> {
  try {
    const url = `${TELEGRAM_API}/bot${botToken}/getUpdates${offset ? `?offset=${offset}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok || !data.result) return [];

    return data.result.map((u: any) => ({
      updateId: u.update_id,
      chatId: String(u.message?.chat?.id ?? ""),
      text: u.message?.text ?? "",
    }));
  } catch {
    return [];
  }
}

export function formatSEOAlert(kw: { keyword: string; position: number; change: number }): string {
  const emoji = kw.change > 0 ? "🔴" : kw.change < 0 ? "🟢" : "⚪";
  const arrow = kw.change > 0 ? "subió" : kw.change < 0 ? "bajó" : "sin cambios";
  return `${emoji} <b>${kw.keyword}</b>: pos ${kw.position} (${arrow} ${Math.abs(kw.change)})`;
}
