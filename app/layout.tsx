import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "./components/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Celine Hair Braiding",
  description: "Hair braiding services with online booking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
          <SiteHeader />
          <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
          <footer className="border-t border-black/5 py-10 text-sm text-zinc-600 dark:border-white/10 dark:text-zinc-400">
            <div className="mx-auto max-w-5xl px-4">
              © {new Date().getFullYear()} Celine Hair Braiding. All rights reserved.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
