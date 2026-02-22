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

  if (!stats?.planStartDate) {
    return NextResponse.json({ started: false, questions: [], dayNumber: 0, totalDays: 24 });
  }

  // 진행도 기반: 첫 번째 미완료 Day를 찾기
  // 각 Day별 풀이 현황 조회
  const allDayQuestions = await prisma.dailyPlanQuestion.findMany({
    where: { userId: session.userId },
    select: { dayNumber: true, solved: true },
  });

  // Day별 완료 여부 계산
  const dayStats: Record<number, { total: number; solved: number }> = {};
  for (const dq of allDayQuestions) {
    if (!dayStats[dq.dayNumber]) {
      dayStats[dq.dayNumber] = { total: 0, solved: 0 };
    }
    dayStats[dq.dayNumber].total++;
    if (dq.solved) dayStats[dq.dayNumber].solved++;
  }

  // 첫 번째 미완료 Day 찾기 (1~24)
  let dayNumber = 0;
  let completedDays = 0;
  for (let d = 1; d <= 24; d++) {
    const ds = dayStats[d];
    if (ds && ds.solved >= ds.total) {
      completedDays++;
    } else {
      dayNumber = d;
      break;
    }
  }

  // 모든 Day 완료
  if (dayNumber === 0) {
    return NextResponse.json({
      started: true,
      completed: true,
      dayNumber: 24,
      totalDays: 24,
      completedDays: 24,
    });
  }

  const dailyQuestions = await prisma.dailyPlanQuestion.findMany({
    where: { dayNumber, userId: session.userId },
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
    completedDays,
    totalQuestions: dailyQuestions.length,
    solvedCount: solved,
    questions: dailyQuestions.map((dq) => ({
      ...dq.question,
      solved: dq.solved,
    })),
  });
}

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  // 24일 플랜 생성
  const existing = await prisma.userStats.findUnique({ where: { userId: session.userId } });
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
      data: { dayNumber: day, date, userId: session.userId },
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
        userId: session.userId,
      },
    });
  }

  // planStartDate 설정
  await prisma.userStats.update({
    where: { userId: session.userId },
    data: { planStartDate: today },
  });

  return NextResponse.json({ success: true, startDate: today });
}
