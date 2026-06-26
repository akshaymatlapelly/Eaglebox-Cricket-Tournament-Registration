import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CricketHub Pro | AI Sports Venue & Tournament Ecosystem",
  description: "Next-gen sports technology platform managing tournaments, live scores, AI scheduling, digital certificate awards, and player career profiles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-[#080a10] text-[#f8fafc] min-h-screen antialiased selection:bg-[#10b981] selection:text-black overflow-x-hidden transition-colors duration-300`}>
        <ThemeProvider>
          <DatabaseProvider>
            <AuthProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AuthProvider>
          </DatabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
