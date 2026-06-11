import type { ShareOfVoiceItem } from "@/lib/geo/types";

interface Props {
  data: ShareOfVoiceItem[];
}

export function ShareOfVoiceChart({ data }: Props) {
  const maxMentions = Math.max(...data.map((d) => d.mentions), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Share of Voice en IA
      </h3>
      {data.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">
          Sin datos. Ejecuta un escaneo GEO.
        </p>
      ) : (
        <div className="space-y-2.5">
          {data.map((item) => (
            <div key={item.domain}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span
                  className={`font-medium ${
                    item.isTarget ? "text-brand-600" : "text-gray-600"
                  }`}
                >
                  {item.domain} {item.isTarget ? "(tú)" : ""}
                </span>
                <span className="text-gray-400">
                  {item.mentions} menciones ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    item.isTarget ? "bg-brand-500" : "bg-gray-300"
                  }`}
                  style={{ width: `${(item.mentions / maxMentions) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
