import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IsThisAScam — Check Suspicious Messages",
  description: "Instantly check if a message is a scam. Supports English, Malay, Chinese and Tamil. Free AI-powered scam detection for Malaysia.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IsThisAScam",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ef4444",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the anti-flash script may add `dark` to <html>
    // before React hydrates, causing a mismatch that is intentional and safe.
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      {/* Anti-flash script: runs synchronously before first paint so the user
          never sees a white flash when they have dark mode enabled.           */}
      <head>
        <script dangerouslySetInnerHTML={{ __html:
          `try{if(localStorage.getItem('itsascam_dark')==='true')document.documentElement.classList.add('dark')}catch(e){}`
        }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}