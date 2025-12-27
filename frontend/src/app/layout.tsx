import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EssayFlow AI - Transform Assignments into Humanized Essays",
  description: "Upload your university assignment and get a professionally written, humanized academic essay. AI-powered essay generation with undetectable output.",
  keywords: ["essay generator", "AI writing", "academic essay", "humanized essay", "assignment help"],
  authors: [{ name: "EssayFlow AI" }],
  openGraph: {
    title: "EssayFlow AI - Transform Assignments into Humanized Essays",
    description: "Upload your university assignment and get a professionally written, humanized academic essay.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
