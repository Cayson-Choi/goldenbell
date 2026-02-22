"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/quiz/daily", label: "오늘의 퀴즈", icon: "📝" },
  { href: "/quiz/topic", label: "주제별", icon: "📚" },
  { href: "/quiz/wrong", label: "오답노트", icon: "❌" },
  { href: "/badges", label: "뱃지", icon: "🏆" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 z-50">
      <div className="max-w-4xl mx-auto flex justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                isActive
                  ? "text-amber-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
