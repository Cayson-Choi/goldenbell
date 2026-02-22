import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  // 틀린 문제 중 아직 정답을 못 맞춘 문제
  // 1. 모든 오답 기록이 있는 문제 찾기
  // 2. 그 중 나중에 정답을 맞추지 못한 문제만 필터

  const wrongQuestionIds = await prisma.$queryRaw<{ questionId: number; wrongCount: number }[]>`
    SELECT a."questionId", COUNT(*) as "wrongCount"
    FROM "Attempt" a
    WHERE a."isCorrect" = false
    AND a."questionId" NOT IN (
      SELECT DISTINCT a2."questionId"
      FROM "Attempt" a2
      WHERE a2."isCorrect" = true
      AND a2."createdAt" > (
        SELECT MAX(a3."createdAt")
        FROM "Attempt" a3
        WHERE a3."questionId" = a2."questionId"
        AND a3."isCorrect" = false
      )
    )
    GROUP BY a."questionId"
    ORDER BY COUNT(*) DESC
  `;

  if (wrongQuestionIds.length === 0) {
    return NextResponse.json({ questions: [], count: 0 });
  }

  const questions = await prisma.question.findMany({
    where: {
      id: { in: wrongQuestionIds.map((w) => w.questionId) },
    },
    select: {
      id: true,
      course: true,
      month: true,
      topic: true,
      difficulty: true,
      questionNumber: true,
      questionText: true,
    },
  });

  // wrongCount 매핑
  const wrongMap = new Map(wrongQuestionIds.map((w) => [w.questionId, Number(w.wrongCount)]));
  const result = questions
    .map((q) => ({ ...q, wrongCount: wrongMap.get(q.id) || 0 }))
    .sort((a, b) => b.wrongCount - a.wrongCount);

  return NextResponse.json({ questions: result, count: result.length });
}
