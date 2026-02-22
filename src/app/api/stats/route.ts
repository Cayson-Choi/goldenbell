import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const stats = await prisma.userStats.findUnique({ where: { userId: session.userId } });

  const totalQuestions = await prisma.question.count();
  const totalAttempts = await prisma.attempt.count({ where: { userId: session.userId } });
  const correctAttempts = await prisma.attempt.count({ where: { userId: session.userId, isCorrect: true } });

  // 고유 정답 문제 수
  const uniqueCorrect = await prisma.attempt.groupBy({
    by: ["questionId"],
    where: { userId: session.userId, isCorrect: true },
  });

  // 고유 풀이 문제 수
  const uniqueAttempted = await prisma.attempt.groupBy({
    by: ["questionId"],
    where: { userId: session.userId },
  });

  // 난이도별 통계
  const diffStats = [];
  for (const diff of ["하", "중", "상", "최상"]) {
    const total = await prisma.question.count({ where: { difficulty: diff } });
    const qIds = await prisma.question.findMany({
      where: { difficulty: diff },
      select: { id: true },
    });
    const ids = qIds.map((q) => q.id);
    const solved = await prisma.attempt.groupBy({
      by: ["questionId"],
      where: { userId: session.userId, questionId: { in: ids }, isCorrect: true },
    });
    diffStats.push({ difficulty: diff, total, solved: solved.length });
  }

  // 오답 문제 수
  const wrongCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT a."questionId") as count
    FROM "Attempt" a
    WHERE a."isCorrect" = false
    AND a."userId" = ${session.userId}
    AND a."questionId" NOT IN (
      SELECT DISTINCT a2."questionId"
      FROM "Attempt" a2
      WHERE a2."isCorrect" = true
      AND a2."userId" = ${session.userId}
    )
  `;

  return NextResponse.json({
    totalPoints: stats?.totalPoints || 0,
    currentCombo: stats?.currentCombo || 0,
    maxCombo: stats?.maxCombo || 0,
    consecutiveDays: stats?.consecutiveDays || 0,
    totalQuestions,
    totalAttempts,
    correctAttempts,
    uniqueCorrect: uniqueCorrect.length,
    uniqueAttempted: uniqueAttempted.length,
    accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
    difficultyStats: diffStats,
    wrongCount: Number(wrongCount[0]?.count || 0),
    planStartDate: stats?.planStartDate,
  });
}
