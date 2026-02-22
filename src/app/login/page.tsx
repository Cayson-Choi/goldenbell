"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "문제가 발생했어요");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("서버 연결에 실패했어요");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 animate-float">⭐</div>
          <h1 className="text-3xl font-bold">
            <span className="text-amber-400">도전!</span> 골든별
          </h1>
          <p className="text-slate-400 mt-2">
            {isSignup ? "새로운 우주 탐험가 등록" : "우주 탐험을 계속하자!"}
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-3.5 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "4자리 이상" : "비밀번호"}
              className="w-full bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-3.5 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              required
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-xl px-4 py-3 text-red-400 text-sm animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 text-slate-900 font-bold py-3.5 rounded-xl text-lg transition-colors"
          >
            {loading ? "잠깐만..." : isSignup ? "가입하기 🚀" : "로그인 ⭐"}
          </button>
        </form>

        {/* 전환 */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="text-slate-400 hover:text-amber-400 text-sm transition-colors"
          >
            {isSignup
              ? "이미 계정이 있어요? 로그인하기"
              : "처음이에요? 가입하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
