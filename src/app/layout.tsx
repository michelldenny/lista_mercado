import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartList Pro Cloud",
  description: "Gerenciador de lista de compras inteligente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen pb-32 bg-slate-50 text-slate-900 selection:bg-emerald-100 antialiased">
        {children}
      </body>
    </html>
  );
}
