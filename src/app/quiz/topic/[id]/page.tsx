"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QuizCard from "@/components/QuizCard";

interface Question {
  id: number;
  course: string;
  month: number;
  topic: string;
  difficulty: string;
  questionNumber: number;
  questionText: string;
}

export default function TopicQuizPage() {
  const params = useParams();
  const id = params.id as string; // e.g. "체험-1"
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const [course, month] = id.split("-");
    fetch(`/api/questions?course=${encodeURIComponent(course)}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      });
  }, [id]);

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
    return <div className="text-center py-20 text-slate-400">문제가 없습니다.</div>;
  }

  const currentQ = questions[currentIdx];

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">
          {currentQ.course}과정 · {currentQ.month}월
        </h1>
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
