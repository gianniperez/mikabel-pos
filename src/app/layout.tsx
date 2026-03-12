import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
import { AppProvider } from "@/providers/AppProvider";
import { Toaster } from "sonner";
import { OfflineBanner } from "@/components/OfflineBanner/OfflineBanner";

export const viewport: Viewport = {
  themeColor: "#3543A2",
};

export const metadata: Metadata = {
  title: "Mikabel POS",
  description:
    "Punto de Venta y Gestión de Inventario para el Minimarket Mikabel.",
  openGraph: {
    title: "Mikabel POS",
    description:
      "Punto de Venta y Gestión de Inventario para el Minimarket Mikabel.",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mikabel",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable}`}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        <OfflineBanner />
        <AppProvider>{children}</AppProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
