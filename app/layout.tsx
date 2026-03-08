import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import Provider from "./provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AI Course Generator - Sketchbook Edition",
  description: "Turn any topic into a complete course in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">
          <Provider>
            {children}
            <Toaster position="top-center" richColors />
          </Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
