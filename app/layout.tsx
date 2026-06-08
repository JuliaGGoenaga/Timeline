import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas Cronológico Universal",
  description: "Plataforma interactiva para explorar la historia universal a través del tiempo, el espacio y las relaciones culturales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="h-full bg-zinc-950 text-white">{children}</body>
    </html>
  );
}
