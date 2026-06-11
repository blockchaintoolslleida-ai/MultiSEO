"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Send } from "lucide-react";

interface TelegramSettingsProps {
  botToken: string;
  chatId: string;
  onSave: (botToken: string, chatId: string) => Promise<void>;
  onTest: (botToken: string, chatId: string) => Promise<{ ok: boolean; error?: string }>;
}

export function TelegramSettings({
  botToken,
  chatId,
  onSave,
  onTest,
}: TelegramSettingsProps) {
  const [localToken, setLocalToken] = useState(botToken);
  const [localChatId, setLocalChatId] = useState(chatId);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await onSave(localToken, localChatId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!localToken || !localChatId) {
      setTestResult({ ok: false, error: "Token y Chat ID son obligatorios" });
      return;
    }
    setError(null);
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(localToken, localChatId);
      setTestResult(result);
    } catch (err) {
      setTestResult({ ok: false, error: err instanceof Error ? err.message : "Error" });
    } finally {
      setTesting(false);
    }
  };

  const hasConfig = (botToken && chatId) || (localToken && localChatId);

  return (
    <div>
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1">✈️ Telegram Notificaciones</h3>
      <p className="text-[12px] text-gray-400 mb-4">
        Recibe alertas SEO y reportes directamente en tu chat de Telegram
      </p>

      <div
        className={`border rounded-xl p-5 ${
          hasConfig ? "border-blue-200 bg-blue-50/30" : "border-gray-200 bg-white"
        }`}
      >
        <div className="grid grid-cols-[1fr_1fr] gap-4 mb-4">
          <div>
            <label className="text-[12px] font-medium text-gray-600 mb-1 block">
              Bot Token
            </label>
            <input
              type="password"
              placeholder="123456:ABC-DEF1234gh..."
              value={localToken}
              onChange={(e) => setLocalToken(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:border-brand-400"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Crea un bot con @BotFather y pega aquí el token
            </p>
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-600 mb-1 block">
              Chat ID
            </label>
            <input
              placeholder="-100123456789"
              value={localChatId}
              onChange={(e) => setLocalChatId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:border-brand-400"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Usa @userinfobot en Telegram para obtener tu Chat ID
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
          >
            {testing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            {testing ? "Enviando test..." : "Enviar Test"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-[12px] px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Guardar
          </button>

          {testResult && (
            <span
              className={`text-[12px] flex items-center gap-1 ${
                testResult.ok ? "text-green-600" : "text-red-500"
              }`}
            >
              {testResult.ok ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" /> Mensaje enviado
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> {testResult.error}
                </>
              )}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-3 text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
