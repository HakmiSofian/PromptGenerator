import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Kit pour Claude Code",
  description:
    "Génère un kit de prompts optimisé pour Claude Code à partir d'une description en langage naturel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 min-h-screen text-slate-800">{children}</body>
    </html>
  );
}
