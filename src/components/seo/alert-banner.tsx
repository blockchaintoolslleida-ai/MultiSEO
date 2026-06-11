import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  message: string;
  className?: string;
}

export function AlertBanner({ message, className }: AlertBannerProps) {
  return (
    <div className={`flex items-center gap-2 p-3 bg-danger-light border border-red-200 rounded-lg text-[12.5px] font-medium text-red-800 ${className || ""}`}>
      <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
      {message}
    </div>
  );
}
