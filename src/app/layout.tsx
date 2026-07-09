import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOLIM 공수 관리 시스템",
  description: "BOLIM ERP 공수 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
