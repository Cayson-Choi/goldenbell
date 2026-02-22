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

export default function TopicQuizPage() {
  const params = useParams();
  const id = params.id as string; // e.g. "1-3" (체험-3월)
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const [courseNum, monthStr] = id.split("-");
  const course = COURSE_MAP[courseNum] || "체험";
  const month = parseInt(monthStr, 10);

  useEffect(() => {
    fetch(`/api/questions?course=${encodeURIComponent(course)}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      });
  }, [course, month]);

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
        <p className="text-slate-400 text-lg">문제가 없습니다.</p>
        <Link
          href="/quiz/topic"
          className="mt-4 text-amber-400 hover:text-amber-300 underline inline-block"
        >
          ← 주제 목록으로
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-xl font-bold">
            {currentQ.course}과정 · {currentQ.month}월
          </h1>
          <Link
            href="/quiz/topic"
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-400 px-2.5 py-1 rounded-lg transition-colors"
          >
            📚 주제 목록
          </Link>
        </div>
        <p className="text-slate-400">{currentQ.topic}</p>
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
