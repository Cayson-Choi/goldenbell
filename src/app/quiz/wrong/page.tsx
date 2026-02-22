"use client";

import { useEffect, useState } from "react";
import QuizCard from "@/components/QuizCard";
import Link from "next/link";

interface WrongQuestion {
  id: number;
  course: string;
  month: number;
  topic: string;
  difficulty: string;
  questionNumber: number;
  questionText: string;
  wrongCount: number;
}

export default function WrongNotePage() {
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wrong")
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions || []);
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

  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl">🎉</span>
        <p className="text-xl mt-4 font-bold">오답노트가 비어있어요!</p>
        <p className="text-slate-400 mt-2">틀린 문제가 없거나, 모두 다시 맞췄어요!</p>
        <Link
          href="/"
          className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-xl inline-block transition-colors"
        >
          홈으로
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-red-400">❌ 오답노트</h1>
        <p className="text-slate-400 text-sm">{questions.length}문제 · 많이 틀린 순서</p>
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
