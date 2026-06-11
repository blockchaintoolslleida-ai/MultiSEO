import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantProvider } from "@/hooks/use-tenant";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MultiSEO — Dashboard",
  description: "Sistema SEO multiempresa con inteligencia artificial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        <TenantProvider>
          <TooltipProvider>
          <AppHeader />
          <div className="flex" style={{ minHeight: "calc(100vh - 60px)" }}>
            <AppSidebar />
            <main className="flex-1 bg-content-bg p-6 overflow-y-auto">
              {children}
            </main>
          </div>
        </TooltipProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
