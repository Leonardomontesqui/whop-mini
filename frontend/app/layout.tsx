import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MeProvider } from "@/lib/MeContext";

export const metadata: Metadata = {
  title: "Whop — Join the future of work",
  description: "Find paid tasks. Get paid to do work that interests you.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <MeProvider>{children}</MeProvider>
      </body>
    </html>
  );
}
