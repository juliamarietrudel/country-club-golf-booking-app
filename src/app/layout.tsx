import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Country Club de Montréal | Golf",
  description: "Réservation des journées de golf",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
