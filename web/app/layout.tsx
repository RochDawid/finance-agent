import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { WSProvider } from "@/lib/providers/ws-provider";
import { ConfigProvider } from "@/lib/providers/config-provider";
import { Toaster } from "sileo";
import { AppShell } from "@/components/layout/app-shell";
import "sileo/styles.css";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Finance Agent",
  description: "AI-powered financial trading signals and analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <QueryProvider>
            <ConfigProvider>
              <WSProvider>
                <Toaster position="bottom-right" options={{ roundness: 14 }} />
                <AppShell>{children}</AppShell>
              </WSProvider>
            </ConfigProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
