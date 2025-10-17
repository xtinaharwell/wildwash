import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar, Footer, WhatsAppButton } from '@/components'
import ProviderWrapper from './provider';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wild Wash",
  description: "Restore Your House",
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
        <ProviderWrapper>
        <NavBar />
        <main className="pt-8">
          {children}
        </main>
        <WhatsAppButton />         
        <Footer />
        </ProviderWrapper>
      </body>
    </html>
  );
}
