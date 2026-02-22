import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = await prisma.userStats.findUnique({ where: { id: 1 } });

  if (!stats?.planStartDate) {
    return NextResponse.json({ started: false, questions: [], dayNumber: 0, totalDays: 24 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const planStart = new Date(stats.planStartDate);
  planStart.setHours(0, 0, 0, 0);

  const dayNumber = Math.floor(
    (today.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  if (dayNumber > 24) {
    return NextResponse.json({ started: true, completed: true, dayNumber: 24, totalDays: 24 });
  }

  const dailyQuestions = await prisma.dailyPlanQuestion.findMany({
    where: { dayNumber },
    include: {
      question: {
        select: {
          id: true,
          course: true,
          month: true,
          topic: true,
          difficulty: true,
          questionNumber: true,
          questionText: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  const solved = dailyQuestions.filter((dq) => dq.solved).length;

  return NextResponse.json({
    started: true,
    dayNumber,
    totalDays: 24,
    totalQuestions: dailyQuestions.length,
    solvedCount: solved,
    questions: dailyQuestions.map((dq) => ({
      ...dq.question,
      solved: dq.solved,
    })),
  });
}

export async function POST() {
  // 24일 플랜 생성
  const existing = await prisma.userStats.findUnique({ where: { id: 1 } });
  if (existing?.planStartDate) {
    return NextResponse.json({ error: "이미 플랜이 시작되었습니다" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 모든 문제를 난이도순으로 가져오기
  const allQuestions = await prisma.question.findMany({
    orderBy: [
      { difficulty: "asc" }, // 하, 상, 중, 최상 (알파벳순이 아닌 커스텀 순서 필요)
      { course: "asc" },
      { month: "asc" },
      { questionNumber: "asc" },
    ],
    select: { id: true, difficulty: true },
  });

  // 난이도별 정렬: 하 → 중 → 상 → 최상
  const diffOrder: Record<string, number> = { "하": 0, "중": 1, "상": 2, "최상": 3 };
  const sorted = allQuestions.sort((a, b) => {
    return (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0);
  });

  // 24일 x 50문제로 배분
  const QUESTIONS_PER_DAY = 50;
  const TOTAL_DAYS = 24;

  // DailyPlan 생성
  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day - 1);

    await prisma.dailyPlan.create({
      data: { dayNumber: day, date },
    });
  }

  // 문제 배정
  for (let i = 0; i < sorted.length; i++) {
    const dayNum = Math.floor(i / QUESTIONS_PER_DAY) + 1;
    if (dayNum > TOTAL_DAYS) break;

    await prisma.dailyPlanQuestion.create({
      data: {
        dayNumber: dayNum,
        questionId: sorted[i].id,
      },
    });
  }

  // planStartDate 설정
  await prisma.userStats.update({
    where: { id: 1 },
    data: { planStartDate: today },
  });

  return NextResponse.json({ success: true, startDate: today });
}
