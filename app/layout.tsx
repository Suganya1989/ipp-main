import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indian Prison Portal",
  description: "Indian Prison Portal - Comprehensive resource hub for prison-related information, research, and reform initiatives",
  icons: {
    icon: [
      { url: '/ipp-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/ipp-logo.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: '/ipp-logo.png',
    shortcut: '/ipp-logo.png'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/ipp-logo.png" type="image/png" />
        <link rel="shortcut icon" href="/ipp-logo.png" type="image/png" />
      </head>
      <body
        className={`${geistSans.className} ${geistMono.variable} antialiased`}
        cz-shortcut-listen="true"
      >
        <Header />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
