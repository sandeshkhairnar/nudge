import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/components/global/notification-provider";
import { KeepAlive } from "@/components/global/KeepAlive";
import { GlobalPresence } from "@/components/global/GlobalPresence";
import { QueryProvider } from "@/components/global/QueryProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

import { PwaRegistrar } from "@/components/global/PwaRegistrar";

import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Nudge — The tool that actually moves your team forward",
  description:
    "Nudge watches your work, finds what's stalling, and sends the one message that unsticks it. No noise. Just momentum.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nudge",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} antialiased`}
      >
        <PwaRegistrar />
        <QueryProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
          <GlobalPresence />
          <KeepAlive />
          <Toaster position="top-right" richColors closeButton />
        </QueryProvider>
      </body>
    </html>
  );
}
