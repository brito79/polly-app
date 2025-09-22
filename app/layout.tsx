import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polly - Create and Share Polls",
  description: "Create engaging polls and gather opinions from your community with Polly.",
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
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <ConditionalFooter />
          </div>
          <Toaster position="top-right" toastOptions={{
            success: {
              style: {
                background: '#10B981',
                color: 'white',
              },
              iconTheme: {
                primary: 'white',
                secondary: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
                color: 'white',
              },
            }
          }} />
        </AuthProvider>
      </body>
    </html>
  );
}
