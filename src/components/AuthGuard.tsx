"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-float mb-4">⭐</div>
          <p className="text-slate-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 페이지는 통과
  if (pathname === "/login") {
    if (user) {
      router.push("/");
      return null;
    }
    return <>{children}</>;
  }

  // 미로그인 → 로그인 페이지로
  if (!user) {
    router.push("/login");
    return null;
  }

  return <>{children}</>;
}
