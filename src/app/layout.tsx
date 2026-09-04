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
  title: "Mr.QR — Dynamic QR Studio | Encode once. Change anytime.",
  description:
    "Mr.QR is an editorial, high-performance dynamic QR studio. Create beautiful custom QR codes you can redirect, edit, and analyze after every scan.",
  keywords: ["Mr.QR", "Mr QR", "dynamic QR", "static QR", "QR analytics", "QR studio"],
  authors: [{ name: "Mr.QR" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Mr.QR — Dynamic QR Platform",
    description: "Encode once. Change anytime. Measure every scan.",
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
