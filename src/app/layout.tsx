import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Lab / Playground",
  description: "Лаборатория инженерных инструментов и экспериментов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.27/dist/katex.min.css"
          integrity="sha384-GY3TgeK54s9RKn0weMOOJGOBMTnQrFlptoBNKKedGEv5XEvsbbhR0P1B3datMYpS"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
