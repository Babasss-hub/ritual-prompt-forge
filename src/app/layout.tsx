import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ritual Prompt Forge | AI Prompt Generator on Ritual Chain",
  description:
    "Generate, test, and mint AI prompts on Ritual Chain. Powered by on-chain LLM inference via Ritual's precompile 0x0802.",
  keywords: [
    "Ritual",
    "AI",
    "Prompt",
    "Web3",
    "On-chain",
    "LLM",
    "Precompile",
    "dApp",
  ],
  openGraph: {
    title: "Ritual Prompt Forge",
    description: "AI Prompt Generator on Ritual Chain",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
