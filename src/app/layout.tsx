import type { Metadata } from "next";
import { Instrument_Serif, Newsreader, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "QR Studio — Encode once. Change anytime.",
  description:
    "An editorial QR design studio. Create beautiful static QR codes, or dynamic QR codes you can edit and measure after every scan.",
  keywords: ["QR code", "dynamic QR", "static QR", "QR analytics", "QR studio"],
  authors: [{ name: "QR Studio" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "QR Studio",
    description: "Make a QR. Make it useful.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrumentSerif.variable} ${newsreader.variable} ${geistSans.variable} font-body antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
