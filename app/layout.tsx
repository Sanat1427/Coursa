import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import Provider from "./provider";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import { esES, jaJP, hiIN, enUS } from "@clerk/localizations";

export const metadata: Metadata = {
  title: "AI Course Generator - Sketchbook Edition",
  description: "Turn any topic into a complete course in seconds.",
};

const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "iconButton" as const,
  },
  variables: {
    colorPrimary: "#af25f4", // sketch-primary
    colorBackground: "#fdfaf6", // paper background
    colorText: "#1a1a1a",
    fontFamily: '"Patrick Hand", cursive',
    borderRadius: "12px",
  },
  elements: {
    cardBox: "wobbly-border hard-shadow bg-white",
    card: "bg-transparent shadow-none border-none",
    headerTitle: "font-display text-3xl font-bold tracking-tight text-slate-900",
    headerSubtitle: "font-sans text-lg text-slate-600",
    socialButtonsBlockButton: "wobbly-border hard-shadow-sm bg-white text-slate-800 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all",
    formButtonPrimary: "bg-sketch-primary text-white font-display text-lg py-2.5 wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer",
    formFieldInput: "wobbly-border bg-slate-50/50 p-3 text-lg font-sans focus:outline-none focus:ring-0",
    footerActionLink: "text-sketch-primary hover:underline wavy-hover",
    identityPreviewEditButton: "text-sketch-primary",
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("coursa_lang")?.value || "English";

  let localization = enUS;
  if (lang === "Spanish") localization = esES;
  else if (lang === "Japanese") localization = jaJP;
  else if (lang === "Hindi") localization = hiIN;

  return (
    <ClerkProvider appearance={clerkAppearance} localization={localization}>
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

