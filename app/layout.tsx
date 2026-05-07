import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EC HTML Generator",
  description: "楽天市場・Yahooショッピング用の商品ページHTML自動生成ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
