import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Country Club de Montreal | Golf",
  description: "Reservation des journees de golf",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
