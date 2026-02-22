"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalPoints: number;
  currentCombo: number;
  maxCombo: number;
  consecutiveDays: number;
  totalQuestions: number;
  uniqueCorrect: number;
  uniqueAttempted: number;
  accuracy: number;
  wrongCount: number;
  difficultyStats: { difficulty: string; total: number; solved: number }[];
  planStartDate: string | null;
}

interface DailyData {
  started: boolean;
  dayNumber: number;
  totalDays: number;
  totalQuestions?: number;
  solvedCount?: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/daily").then((r) => r.json()),
    ]).then(([s, d]) => {
      setStats(s);
      setDaily(d);
      setLoading(false);
    });
  }, []);

  const startPlan = async () => {
    const res = await fetch("/api/daily", { method: "POST" });
    if (res.ok) {
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl animate-float mb-4">⭐</div>
          <p className="text-slate-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold">
          <span className="text-amber-400">도전!</span> 골든별 퀴즈
        </h1>
        <p className="text-slate-400 mt-1">어린이천문대 문제은행 1,199문제</p>
      </div>

      {/* 포인트 & 콤보 */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-slate-700">
            <p className="text-amber-400 text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
            <p className="text-slate-400 text-xs mt-1">포인트</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-slate-700">
            <p className="text-orange-400 text-2xl font-bold">{stats.maxCombo}</p>
            <p className="text-slate-400 text-xs mt-1">최대 콤보</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-slate-700">
            <p className="text-blue-400 text-2xl font-bold">{stats.consecutiveDays}일</p>
            <p className="text-slate-400 text-xs mt-1">연속 학습</p>
          </div>
        </div>
      )}

      {/* 전체 진행률 */}
      {stats && (
        <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-300 font-medium">전체 진행률</span>
            <span className="text-amber-400 font-bold">
              {stats.uniqueCorrect} / {stats.totalQuestions}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(stats.uniqueCorrect / stats.totalQuestions) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-slate-400">
            <span>정답률: {stats.accuracy}%</span>
            <span>{Math.round((stats.uniqueCorrect / stats.totalQuestions) * 100)}% 완료</span>
          </div>
        </div>
      )}

      {/* 오늘의 학습 */}
      {daily && (
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-xl p-5 border border-indigo-500/30">
          {!daily.started ? (
            <div className="text-center">
              <p className="text-xl font-bold mb-2">24일 학습 플랜</p>
              <p className="text-slate-300 mb-4">매일 50문제씩, 24일이면 모든 문제를 풀 수 있어요!</p>
              <button
                onClick={startPlan}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-xl text-lg transition-colors"
              >
                학습 시작하기! 🚀
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold">
                  Day {daily.dayNumber} / {daily.totalDays}
                </span>
                <span className="text-amber-400 font-medium">
                  {daily.solvedCount || 0} / {daily.totalQuestions || 50} 완료
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-400 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${((daily.solvedCount || 0) / (daily.totalQuestions || 50)) * 100}%`,
                  }}
                />
              </div>
              <Link
                href="/quiz/daily"
                className="block text-center bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl text-lg transition-colors"
              >
                오늘의 퀴즈 시작! 📝
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 난이도별 현황 */}
      {stats && (
        <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700">
          <h2 className="text-lg font-bold mb-3">난이도별 현황</h2>
          <div className="space-y-3">
            {stats.difficultyStats.map((ds) => {
              const colors: Record<string, string> = {
                "하": "from-green-500 to-green-400",
                "중": "from-blue-500 to-blue-400",
                "상": "from-orange-500 to-orange-400",
                "최상": "from-red-500 to-red-400",
              };
              const pct = ds.total > 0 ? (ds.solved / ds.total) * 100 : 0;
              return (
                <div key={ds.difficulty}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{ds.difficulty} 난이도</span>
                    <span className="text-slate-400">
                      {ds.solved}/{ds.total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`bg-gradient-to-r ${colors[ds.difficulty]} h-2 rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 퀵 액션 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/quiz/topic"
          className="bg-slate-800/60 hover:bg-slate-700/60 rounded-xl p-4 border border-slate-700 text-center transition-colors"
        >
          <span className="text-2xl">📚</span>
          <p className="text-sm mt-1 text-slate-300">주제별 풀기</p>
        </Link>
        <Link
          href="/quiz/wrong"
          className="bg-slate-800/60 hover:bg-slate-700/60 rounded-xl p-4 border border-slate-700 text-center transition-colors"
        >
          <span className="text-2xl">❌</span>
          <p className="text-sm mt-1 text-slate-300">
            오답노트 {stats?.wrongCount ? `(${stats.wrongCount})` : ""}
          </p>
        </Link>
      </div>
    </div>
  );
}
