import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ServerProvider } from "@/lib/ServerContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Discord Clone",
  description: "Полнофункциональный клон Discord с современными технологиями",
  icons: {
    icon: '/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServerProvider>
          {children}
        </ServerProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#36393f',
              color: '#dcddde',
              border: '1px solid #202225',
            },
          }}
        />
      </body>
    </html>
  );
}
