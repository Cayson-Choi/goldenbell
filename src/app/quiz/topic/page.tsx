"use client";

import Link from "next/link";

const TOPICS = {
  체험: [
    { month: 1, name: "겨울철 별자리와 별의 색깔" },
    { month: 2, name: "우주를 향한 도전" },
    { month: 3, name: "우주인의 생활" },
    { month: 4, name: "봄철 별자리와 별의 밝기" },
    { month: 5, name: "태양" },
    { month: 6, name: "태양계" },
    { month: 7, name: "여름철 별자리와 별의 크기" },
    { month: 8, name: "은하수" },
    { month: 9, name: "달 탐사" },
    { month: 10, name: "가을철 별자리와 별의 거리" },
    { month: 11, name: "사라진 공룡과 소행성" },
    { month: 12, name: "우주 속의 지구" },
  ],
  탐구: [
    { month: 1, name: "별의 밝기와 거리" },
    { month: 2, name: "우주탐사" },
    { month: 3, name: "별의 색깔에 담긴 과학" },
    { month: 4, name: "별의 일생" },
    { month: 5, name: "달의 과학" },
    { month: 6, name: "행성" },
    { month: 7, name: "지구과학" },
    { month: 8, name: "혜성, 유성" },
    { month: 9, name: "소행성, 왜행성" },
    { month: 10, name: "망원경" },
    { month: 11, name: "성운, 성단, 은하" },
    { month: 12, name: "외부은하" },
  ],
};

export default function TopicPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">📚 주제별 풀기</h1>

      {(["체험", "탐구"] as const).map((course) => (
        <div key={course}>
          <h2 className="text-lg font-bold mb-3 text-amber-400">{course}과정</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TOPICS[course].map((t) => (
              <Link
                key={`${course}-${t.month}`}
                href={`/quiz/topic/${course === "체험" ? 1 : 2}-${t.month}`}
                className="bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-xl p-3 transition-colors flex items-center gap-3"
              >
                <span className="text-slate-400 text-sm font-mono w-8">{t.month}월</span>
                <span className="text-slate-200 text-sm">{t.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
