import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { WSProvider } from "@/lib/providers/ws-provider";
import { ConfigProvider } from "@/lib/providers/config-provider";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const inter = Inter({
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <WSProvider>
            <ConfigProvider>
              <AppShell>{children}</AppShell>
            </ConfigProvider>
          </WSProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
