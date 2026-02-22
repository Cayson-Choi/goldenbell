"use client";

import { useEffect, useState } from "react";
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
  solved: boolean;
}

interface DailyData {
  started: boolean;
  dayNumber: number;
  totalDays: number;
  totalQuestions: number;
  solvedCount: number;
  questions: Question[];
}

export default function DailyQuizPage() {
  const [data, setData] = useState<DailyData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/daily")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        // 아직 안 푼 첫 번째 문제로 이동
        if (d.questions) {
          const firstUnsolved = d.questions.findIndex((q: Question) => !q.solved);
          if (firstUnsolved >= 0) setCurrentIdx(firstUnsolved);
        }
        setLoading(false);
      });
  }, []);

  const handleAnswer = async (questionId: number, userAnswer: string) => {
    const res = await fetch("/api/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, userAnswer }),
    });
    return res.json();
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

  if (!data.questions || data.questions.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl">🎉</span>
        <p className="text-xl mt-4 font-bold">오늘의 퀴즈를 모두 풀었어요!</p>
        <Link
          href="/"
          className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-xl text-lg transition-colors inline-block"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const currentQ = data.questions[currentIdx];

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-amber-400">
          Day {data.dayNumber} 오늘의 퀴즈
        </h1>
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
        totalCount={data.questions.length}
        onAnswer={handleAnswer}
        onNext={() => setCurrentIdx((i) => Math.min(i + 1, data.questions.length - 1))}
        onPrev={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
        hasNext={currentIdx < data.questions.length - 1}
        hasPrev={currentIdx > 0}
      />
    </div>
  );
}
