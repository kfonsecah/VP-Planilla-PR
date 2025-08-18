// SIN "use client"

import ClientLayout from "@/layouts/main";
import "@/styles/globals.css";

export const metadata = {
  title: {
    default: "VP Planillas",
    template: "%s | VP Planillas",
  },
  description: "Sistema integral de gestión de nómina y recursos humanos",
  icons: {
    icon: "/logo.ico",
    shortcut: "/logo.ico",
    apple: "/logo.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Aquí metemos el ClientLayout */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
