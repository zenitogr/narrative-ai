import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AppManager from "@/components/AppManager";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemePicker } from "@/components/ThemePicker";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Narrative AI",
  description: "A story-driven suggestion engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppManager>
            <div className="flex">
              <Sidebar />
              <main className="flex-1 p-4">{children}</main>
              <div className="absolute top-4 right-4">
                <ThemePicker />
              </div>
            </div>
          </AppManager>
        </ThemeProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
