import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Terrador Control Center",
  description: "Local DM display controller for the Terrador campaign.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
