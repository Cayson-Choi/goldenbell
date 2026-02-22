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
  completed?: boolean;
  dayNumber: number;
  totalDays: number;
  completedDays?: number;
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

  const handleDayComplete = () => {
    // Day 완료 → 데이터 리프레시 (다음 Day or 완료 화면)
    setLoading(true);
    fetch("/api/daily")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setCurrentIdx(0);
        setLoading(false);
      });
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

  // 모든 24일 완료
  if (data?.completed) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl">🏆</span>
        <p className="text-2xl mt-4 font-bold text-amber-400">
          축하해요! 모든 문제를 다 풀었어요!
        </p>
        <p className="text-slate-400 mt-2">24일 학습을 모두 완료했습니다!</p>
        <Link
          href="/"
          className="mt-6 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-xl text-lg transition-colors inline-block"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  // 현재 Day의 모든 문제를 풀었을 때 → 다음 Day로!
  const allSolved = data.questions && data.questions.length > 0 && data.questions.every((q) => q.solved);
  if (allSolved) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl">🎉</span>
        <p className="text-2xl mt-4 font-bold text-amber-400">
          Day {data.dayNumber} 완료!
        </p>
        <p className="text-slate-300 mt-2">
          {data.totalQuestions}문제를 모두 풀었어요! 대단해요! 👏
        </p>
        <div className="mt-4 text-sm text-slate-400">
          전체 진행: {(data.completedDays || 0) + 1} / {data.totalDays}일 완료
        </div>
        <div className="w-full max-w-xs mx-auto bg-slate-700 rounded-full h-3 mt-3">
          <div
            className="bg-amber-400 h-3 rounded-full transition-all"
            style={{ width: `${(((data.completedDays || 0) + 1) / data.totalDays) * 100}%` }}
          />
        </div>
        {data.dayNumber < data.totalDays ? (
          <button
            onClick={() => {
              setLoading(true);
              fetch("/api/daily")
                .then((r) => r.json())
                .then((d) => {
                  setData(d);
                  setCurrentIdx(0);
                  setLoading(false);
                });
            }}
            className="mt-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold py-4 px-10 rounded-xl text-lg transition-all shadow-lg shadow-amber-500/30 inline-block"
          >
            🚀 Day {data.dayNumber + 1} 시작하기!
          </button>
        ) : (
          <Link
            href="/"
            className="mt-8 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-xl text-lg transition-colors inline-block"
          >
            홈으로 돌아가기
          </Link>
        )}
        <div className="mt-4">
          <Link href="/" className="text-slate-400 hover:text-slate-300 text-sm underline">
            나중에 하기 → 홈으로
          </Link>
        </div>
      </div>
    );
  }

  if (!data.questions || data.questions.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl">❓</span>
        <p className="text-xl mt-4 font-bold">문제를 불러올 수 없어요</p>
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
          Day {data.dayNumber} / {data.totalDays} 오늘의 퀴즈
        </h1>
        {(data.completedDays || 0) > 0 && (
          <p className="text-slate-400 text-sm mt-1">
            ✅ {data.completedDays}일 완료
          </p>
        )}
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
        onComplete={handleDayComplete}
        hasNext={currentIdx < data.questions.length - 1}
        hasPrev={currentIdx > 0}
      />
    </div>
  );
}
