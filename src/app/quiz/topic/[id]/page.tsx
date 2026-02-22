"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QuizCard from "@/components/QuizCard";
import Link from "next/link";

interface Question {
  id: number;
  course: string;
  month: number;
  topic: string;
  difficulty: string;
  questionNumber: number;
  questionText: string;
}

const COURSE_MAP: Record<string, string> = {
  "1": "체험",
  "2": "탐구",
};

const DIFF_ORDER: Record<string, number> = {
  "하": 0,
  "중": 1,
  "상": 2,
  "최상": 3,
};

const DIFF_COLORS: Record<string, string> = {
  "하": "from-green-600 to-green-500 hover:from-green-500 hover:to-green-400",
  "중": "from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400",
  "상": "from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400",
  "최상": "from-red-600 to-red-500 hover:from-red-500 hover:to-red-400",
  "전체": "from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400",
};

const DIFF_LABELS: Record<string, string> = {
  "하": "쉬운 문제",
  "중": "보통 문제",
  "상": "어려운 문제",
  "최상": "최고 난이도",
  "전체": "하 → 중 → 상 → 최상 순서로 전부!",
};

const TOPICS: Record<string, Record<number, string>> = {
  "체험": {
    1: "겨울철 별자리와 별의 색깔", 2: "우주를 향한 도전", 3: "우주인의 생활",
    4: "봄철 별자리와 별의 밝기", 5: "태양", 6: "태양계",
    7: "여름철 별자리와 별의 크기", 8: "은하수", 9: "달 탐사",
    10: "가을철 별자리와 별의 거리", 11: "사라진 공룡과 소행성", 12: "우주 속의 지구",
  },
  "탐구": {
    1: "별의 밝기와 거리", 2: "우주탐사", 3: "별의 색깔에 담긴 과학",
    4: "별의 일생", 5: "달의 과학", 6: "행성",
    7: "지구과학", 8: "혜성, 유성", 9: "소행성, 왜행성",
    10: "망원경", 11: "성운, 성단, 은하", 12: "은하 분류와 우주론",
  },
};

export default function TopicQuizPage() {
  const params = useParams();
  const id = params.id as string;
  const [courseNum, monthStr] = id.split("-");
  const course = COURSE_MAP[courseNum] || "체험";
  const month = parseInt(monthStr, 10);
  const topicName = TOPICS[course]?.[month] || "";

  const [selectedDiff, setSelectedDiff] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDiff) return;
    setLoading(true);

    // 전체: 모든 난이도, 개별: 특정 난이도만
    const diffParam = selectedDiff === "전체" ? "" : `&difficulty=${encodeURIComponent(selectedDiff)}`;
    fetch(`/api/questions?course=${encodeURIComponent(course)}&month=${month}${diffParam}`)
      .then((r) => r.json())
      .then((data: Question[]) => {
        // 난이도 순서로 정렬 (하 → 중 → 상 → 최상), 같은 난이도 내에서는 문제번호순
        const sorted = data.sort((a, b) => {
          const diffDiff = (DIFF_ORDER[a.difficulty] ?? 99) - (DIFF_ORDER[b.difficulty] ?? 99);
          if (diffDiff !== 0) return diffDiff;
          return a.questionNumber - b.questionNumber;
        });
        setQuestions(sorted);
        setCurrentIdx(0);
        setLoading(false);
      });
  }, [selectedDiff, course, month]);

  const handleAnswer = async (questionId: number, userAnswer: string) => {
    const res = await fetch("/api/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, userAnswer }),
    });
    return res.json();
  };

  // 난이도 선택 화면
  if (!selectedDiff) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Link
            href="/quiz/topic"
            className="text-slate-400 hover:text-slate-300 text-sm"
          >
            ← 주제 목록
          </Link>
          <h1 className="text-xl font-bold mt-3 text-amber-400">
            {course}과정 · {month}월
          </h1>
          <p className="text-slate-300 mt-1">{topicName}</p>
        </div>

        <p className="text-center text-slate-400 text-sm">난이도를 선택하세요</p>

        <div className="space-y-3">
          {["전체", "하", "중", "상", "최상"].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDiff(diff)}
              className={`w-full bg-gradient-to-r ${DIFF_COLORS[diff]} text-white font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-lg flex items-center justify-between`}
            >
              <span>
                {diff === "전체" ? "🌟 전체" : diff}
              </span>
              <span className="text-sm font-normal opacity-80">
                {DIFF_LABELS[diff]}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 로딩
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-float">⭐</div>
      </div>
    );
  }

  // 문제 없음
  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-lg">문제가 없습니다.</p>
        <button
          onClick={() => setSelectedDiff(null)}
          className="mt-4 text-amber-400 hover:text-amber-300 underline"
        >
          ← 난이도 다시 선택
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-xl font-bold">
            {course}과정 · {month}월
          </h1>
          <button
            onClick={() => setSelectedDiff(null)}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-400 px-2.5 py-1 rounded-lg transition-colors"
          >
            🔄 난이도 변경
          </button>
        </div>
        <p className="text-slate-400 text-sm">
          {topicName} · {selectedDiff === "전체" ? "전체 난이도" : `${selectedDiff} 난이도`}
        </p>
      </div>
      <QuizCard
        questionId={currentQ.id}
        questionNumber={currentQ.questionNumber}
        questionText={currentQ.questionText}
        difficulty={currentQ.difficulty}
        topic={currentQ.topic}
        course={currentQ.course}
        month={currentQ.month}
        currentIndex={currentIdx}
        totalCount={questions.length}
        onAnswer={handleAnswer}
        onNext={() => setCurrentIdx((i) => Math.min(i + 1, questions.length - 1))}
        onPrev={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
        hasNext={currentIdx < questions.length - 1}
        hasPrev={currentIdx > 0}
      />
    </div>
  );
}
