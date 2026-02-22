import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "도전! 골든별 퀴즈",
  description: "어린이천문대 골든별 문제은행 퀴즈 앱",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 pb-24 pt-4">
          {children}
        </main>
      </body>
    </html>
  );
}
