"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DayInfo {
  dayNumber: number;
  total: number;
  solved: number;
  status: "completed" | "in_progress" | "pending" | "empty";
}

interface DayListData {
  started: boolean;
  completedDays: number;
  totalDays: number;
  currentDay: number;
  days: DayInfo[];
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "하", 2: "하", 3: "하", 4: "하",
  5: "중", 6: "중", 7: "중", 8: "중",
  9: "상", 10: "상", 11: "상", 12: "상",
  13: "상", 14: "상", 15: "상", 16: "상",
  17: "최상", 18: "최상", 19: "최상", 20: "최상",
  21: "최상", 22: "최상", 23: "최상", 24: "최상",
};

export default function DaySelectPage() {
  const [data, setData] = useState<DayListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<number | null>(null);
  const router = useRouter();

  const fetchDays = () => {
    fetch("/api/daily?list=true")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDays();
  }, []);

  const handleReset = async (dayNumber: number) => {
    if (!confirm(`Day ${dayNumber}의 풀이 기록을 초기화하고 다시 풀까요?`)) return;
    setResetting(dayNumber);
    await fetch("/api/daily", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayNumber }),
    });
    // 리셋 후 바로 해당 Day로 이동
    router.push(`/quiz/daily?day=${dayNumber}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-float">⭐</div>
      </div>
    );
  }

  if (!data?.started) {
    return (
      <div className="text-center py-20">
        <p className="text-xl mb-4">아직 학습 플랜을 시작하지 않았어요!</p>
        <Link
          href="/"
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-xl text-lg transition-colors inline-block"
        >
          홈에서 시작하기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-amber-400">📅 Day 선택</h1>
        <p className="text-slate-400 text-sm mt-1">
          {data.completedDays} / {data.totalDays}일 완료
        </p>
        <div className="w-full max-w-xs mx-auto bg-slate-700 rounded-full h-2.5 mt-2">
          <div
            className="bg-amber-400 h-2.5 rounded-full transition-all"
            style={{ width: `${(data.completedDays / data.totalDays) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.days.map((day) => {
          const isCompleted = day.status === "completed";
          const isCurrent = day.dayNumber === data.currentDay;
          const isInProgress = day.status === "in_progress";
          const progress = day.total > 0 ? Math.round((day.solved / day.total) * 100) : 0;

          return (
            <div
              key={day.dayNumber}
              className={`relative rounded-xl p-4 border transition-all ${
                isCompleted
                  ? "bg-green-900/20 border-green-500/40"
                  : isCurrent
                  ? "bg-amber-900/20 border-amber-500/50 ring-2 ring-amber-500/30"
                  : isInProgress
                  ? "bg-blue-900/20 border-blue-500/40"
                  : "bg-slate-800/50 border-slate-700"
              }`}
            >
              {/* Day 번호와 상태 */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">
                  {isCompleted && "✅ "}
                  {isCurrent && "▶️ "}
                  {isInProgress && !isCurrent && "📝 "}
                  Day {day.dayNumber}
                </span>
              </div>

              {/* 진행도 */}
              <div className="text-xs text-slate-400 mb-2">
                {day.solved} / {day.total}문제
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isCompleted ? "bg-green-400" : "bg-amber-400"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-2">
                {isCompleted ? (
                  <button
                    onClick={() => handleReset(day.dayNumber)}
                    disabled={resetting === day.dayNumber}
                    className="flex-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {resetting === day.dayNumber ? "초기화 중..." : "🔄 다시 풀기"}
                  </button>
                ) : (
                  <button
                    onClick={() => router.push(`/quiz/daily?day=${day.dayNumber}`)}
                    className={`flex-1 text-xs py-2 rounded-lg transition-colors font-bold ${
                      isCurrent
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-900"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                    }`}
                  >
                    {isCurrent ? "🚀 풀기" : isInProgress ? "이어서 풀기" : "풀기"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/quiz/daily"
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-xl text-lg transition-colors inline-block"
        >
          ▶️ 이어서 풀기 (Day {data.currentDay <= 24 ? data.currentDay : "완료!"})
        </Link>
      </div>
    </div>
  );
}
