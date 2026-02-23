"use client";

import { useState, useRef, useEffect } from "react";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

interface QuizCardProps {
  questionId: number;
  questionNumber: number;
  questionText: string;
  difficulty: string;
  topic: string;
  course: string;
  month: number;
  currentIndex: number;
  totalCount: number;
  onAnswer: (questionId: number, userAnswer: string) => Promise<{
    isCorrect: boolean;
    correctAnswer: string;
    points: number;
    combo: number;
    newBadges: string[];
  }>;
  onNext: () => void;
  onPrev: () => void;
  onComplete?: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  "하": "bg-green-500",
  "중": "bg-blue-500",
  "상": "bg-orange-500",
  "최상": "bg-red-500",
};

export default function QuizCard({
  questionId,
  questionNumber,
  questionText,
  difficulty,
  topic,
  course,
  month,
  currentIndex,
  totalCount,
  onAnswer,
  onNext,
  onPrev,
  onComplete,
  hasNext,
  hasPrev,
}: QuizCardProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    points: number;
    combo: number;
    newBadges: string[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 문제 변경 시 초기화
  useEffect(() => {
    setUserAnswer("");
    setResult(null);
    setExplanation(null);
    setIsExplaining(false);
    inputRef.current?.focus();
  }, [questionId]);

  const handleSubmit = async () => {
    if (!userAnswer.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await onAnswer(questionId, userAnswer.trim());
      setResult(res);
      if (res.isCorrect) playCorrectSound();
      else playWrongSound();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const res = await onAnswer(questionId, "");
      setResult(res);
      playWrongSound();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExplain = async () => {
    if (isExplaining || explanation) return;
    setIsExplaining(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          questionText,
          answer: result?.correctAnswer || "",
          userAnswer: userAnswer.trim(),
          isCorrect: result?.isCorrect || false,
          course,
          month,
          topic,
          difficulty,
        }),
      });
      const data = await res.json();
      const text = (data.explanation || data.error || "해설을 불러올 수 없습니다.")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "");
      setExplanation(text);
    } catch {
      setExplanation("해설을 불러올 수 없습니다.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (result) {
        if (hasNext) onNext();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <div className="animate-slide-up">
      {/* 출처 태그 */}
      <div className="bg-slate-700/50 rounded-lg px-3 py-2 mb-4 text-xs text-slate-300 flex flex-wrap items-center gap-1.5">
        <span className="bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded">{course}과정</span>
        <span className="text-slate-500">·</span>
        <span className="bg-slate-600/50 px-2 py-0.5 rounded">{month}월</span>
        <span className="text-slate-500">·</span>
        <span className="bg-slate-600/50 px-2 py-0.5 rounded">{topic}</span>
        <span className="text-slate-500">·</span>
        <span className={`${DIFFICULTY_COLORS[difficulty]} text-white px-2 py-0.5 rounded font-bold`}>{difficulty}</span>
        <span className="text-slate-500">·</span>
        <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">{questionNumber}번</span>
        <span className="ml-auto text-slate-400 font-mono">{currentIndex + 1} / {totalCount}</span>
      </div>

      {/* 진행 바 */}
      <div className="w-full bg-slate-700 rounded-full h-1.5 mb-6">
        <div
          className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
        />
      </div>

      {/* 문제 카드 */}
      <div className="bg-slate-800/80 rounded-2xl p-6 mb-6 border border-slate-700">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{questionText}</p>
      </div>

      {/* 결과 표시 */}
      {result && (
        <div
          className={`rounded-2xl p-5 mb-4 border ${
            result.isCorrect
              ? "bg-green-900/30 border-green-500/50"
              : "bg-red-900/30 border-red-500/50"
          } animate-slide-up`}
        >
          {result.isCorrect ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl animate-celebrate">⭐</span>
                <span className="text-green-400 text-xl font-bold">정답!</span>
                <span className="text-amber-400 font-bold">+{result.points}pt</span>
                {result.combo > 1 && (
                  <span className="text-amber-300 text-sm animate-combo-glow px-2 py-0.5 rounded-full">
                    {result.combo}콤보!
                  </span>
                )}
              </div>
              {result.newBadges.length > 0 && (
                <div className="mt-2 text-amber-300">
                  🏆 새 뱃지: {result.newBadges.join(", ")}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">😢</span>
                <span className="text-red-400 text-xl font-bold">아쉬워요!</span>
              </div>
              <p className="text-slate-300">
                정답: <span className="text-white font-bold">{result.correctAnswer}</span>
              </p>
              <p className="text-slate-400 text-sm mt-1">다음에 다시 도전해보자!</p>
            </div>
          )}
        </div>
      )}

      {/* AI 해설 */}
      {result && (
        <div className="mb-6">
          {!explanation && !isExplaining && (
            <button
              onClick={handleExplain}
              className="w-full bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>🤖</span>
              <span>AI 해설 보기</span>
            </button>
          )}
          {isExplaining && (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 text-center">
              <div className="inline-block animate-spin text-xl mb-2">🤖</div>
              <p className="text-purple-300 text-sm">AI가 해설을 작성하고 있어요...</p>
            </div>
          )}
          {explanation && (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <span>🤖</span>
                <span className="text-purple-300 font-bold text-sm">AI 해설</span>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 입력 영역 */}
      {!result ? (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="정답을 입력하세요..."
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-5 py-4 text-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            disabled={isSubmitting}
            autoComplete="off"
          />
          <div className="flex gap-3">
            {hasPrev && (
              <button
                onClick={onPrev}
                className="px-5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3.5 rounded-xl transition-colors"
              >
                ←
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || isSubmitting}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:text-slate-400 text-slate-900 font-bold py-3.5 rounded-xl text-lg transition-colors"
            >
              정답 확인
            </button>
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="px-6 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3.5 rounded-xl transition-colors"
            >
              모르겠어요
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          {hasPrev && (
            <button
              onClick={onPrev}
              className="px-5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3.5 rounded-xl transition-colors"
            >
              ←
            </button>
          )}
          {hasNext ? (
            <button
              onClick={onNext}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3.5 rounded-xl text-lg transition-colors"
            >
              다음 문제 →
            </button>
          ) : (
            <button
              onClick={() => onComplete ? onComplete() : (window.location.href = "/")}
              className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold py-3.5 rounded-xl text-lg transition-colors"
            >
              완료! 🎉
            </button>
          )}
        </div>
      )}
    </div>
  );
}
