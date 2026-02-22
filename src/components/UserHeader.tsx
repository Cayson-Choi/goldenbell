"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
}

export default function UserHeader() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // 로그인 페이지에서는 숨김
  if (pathname === "/login" || !user) return null;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⭐</span>
          <span className="text-amber-400 font-bold text-sm">도전! 골든별</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-300 text-sm">
            👋 <span className="font-medium text-white">{user.name}</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
