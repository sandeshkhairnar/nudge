import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/components/global/notification-provider";
import { KeepAlive } from "@/components/global/KeepAlive";
import { GlobalPresence } from "@/components/global/GlobalPresence";
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

export const metadata: Metadata = {
  title: "Nudge — The tool that actually moves your team forward",
  description:
    "Nudge watches your work, finds what's stalling, and sends the one message that unsticks it. No noise. Just momentum.",
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
        <NotificationProvider>
          {children}
        </NotificationProvider>
        <GlobalPresence />
        <KeepAlive />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
