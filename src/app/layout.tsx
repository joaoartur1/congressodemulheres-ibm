import type { Metadata } from "next";
import { Cormorant_Garamond, Open_Sans } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Doce Presença — Congresso de Mulheres 2026",
  description:
    "Congresso de Mulheres 2026 · Igreja Batista Missionária · 28, 29 e 30 de Agosto · Lions Clube, Santa Inês - MA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-creme text-texto">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
