import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar, Footer, WhatsAppButton } from '@/components'
import CustomProvider from '@/redux/provider';
import AuthInitializer from '@/components/AuthInitializer';


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
        <CustomProvider>
          <AuthInitializer />
          <NavBar />
          <main className="pt-8">
            {children}
          </main>
          <WhatsAppButton />         
          <Footer />
        </CustomProvider>
      </body>
    </html>
  );
}
