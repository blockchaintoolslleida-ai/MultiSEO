# Settings Page — Spec

> **Status:** Approved | **Stack:** Next.js 16, React 19, SQLite + Drizzle ORM, Tailwind 4

**Goal:** Settings page at `/settings` to manage GEO provider API keys, enable/disable providers, test connections, manage GSC OAuth, and configure Telegram notifications.

---

## 1. APIs

### `GET /api/tenants/[id]/settings`
Returns tenant settings with masked keys:
```json
{
  "data": {
    "geoProviderKeys": { "deepseek": "sk-...***", "chatgpt": "" },
    "geoEnabledProviders": ["deepseek"],
    "deepseekApiKey": "sk-...***",
    "gscConnected": true,
    "gscSiteUrl": "sc_domain:example.com",
    "telegramBotToken": "123:***",
    "telegramChatId": "-456"
  }
}
```
Masking: if key length ≤ 8, return `"***"`. Otherwise `key.slice(0,4) + "***" + key.slice(-2)`.

### `PATCH /api/tenants/[id]/settings`
Body accepts any subset of: `geoProviderKeys`, `geoEnabledProviders`, `deepseekApiKey`, `telegramBotToken`, `telegramChatId`. Merges with existing values. Returns updated masked settings.

### `POST /api/geo/test`
Body: `{ provider: "deepseek", apiKey: "sk-..." }`. Tests connectivity by calling the provider's API with a simple query. Returns `{ ok: true, latency: 1200 }` or `{ ok: false, error: "..." }`.

### `POST /api/gsc/disconnect`
Body: `{ tenantId }`. Sets `gscRefreshToken=null, gscAccessToken=null, gscConnected=0`. Returns `{ data: { disconnected: true } }`.

### `POST /api/telegram/test`
Body: `{ tenantId, botToken, chatId }`. Calls `https://api.telegram.org/bot{token}/sendMessage`. Returns `{ ok: true }` or `{ ok: false, error: "..." }`.

---

## 2. Components

### `ProviderKeysManager` (`src/components/settings/provider-keys-manager.tsx`)
- 5 provider cards in responsive grid (grid-cols-3 desktop)
- Each card: icon, name, enable/disable toggle, API key input (password field with show/hide), Test + Save buttons, status badge
- Props: `keys: Record<string,string>`, `enabled: string[]`, `onSave: (provider, key, enabled) => void`, `onTest: (provider, key) => void`

### `GSCConnectionCard` (`src/components/settings/gsc-connection-card.tsx`)
- Single card showing GSC status
- Connected: green badge, site URL, Disconnect + Reconnect buttons
- Disconnected: gray badge, Connect button (opens OAuth popup)
- Props: `connected: boolean`, `siteUrl: string`, `tenantId: string`, `onDisconnect: () => void`

### `TelegramSettings` (`src/components/settings/telegram-settings.tsx`)
- Card with bot token input, chat ID input, Test + Save buttons, status badge
- Props: `botToken: string`, `chatId: string`, `onSave: (botToken, chatId) => void`, `onTest: (botToken, chatId) => void`

---

## 3. Page (`src/app/settings/page.tsx`)
- "use client", useTenant, breadcrumb
- 3 sections stacked vertically: Proveedores IA, GSC, Telegram
- Loading/error states

---

## 4. Provider Config

```typescript
const PROVIDER_INFO: Record<string, { name: string; icon: string; description: string }> = {
  deepseek: { name: "DeepSeek", icon: "🧠", description: "Modelo de lenguaje chino. Principal para GEO." },
  chatgpt: { name: "ChatGPT", icon: "🤖", description: "OpenAI GPT-4o. Cobertura global." },
  perplexity: { name: "Perplexity", icon: "🔍", description: "Motor de búsqueda con IA. Bueno para visibilidad en search." },
  google: { name: "Google AI", icon: "🇬", description: "Google AI Overviews. Search Generative Experience." },
  copilot: { name: "Copilot", icon: "💬", description: "Microsoft Copilot / Bing Chat." },
};
```
