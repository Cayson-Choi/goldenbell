import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gradeAnswer, getPoints } from "@/lib/grading";
import { checkAndAwardBadges } from "@/lib/badges";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { questionId, userAnswer } = await req.json();

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return NextResponse.json({ error: "문제를 찾을 수 없습니다" }, { status: 404 });
  }

  const isCorrect = userAnswer ? gradeAnswer(userAnswer, question.answer) : false;

  // 첫 시도인지 확인
  const prevAttempts = await prisma.attempt.count({
    where: { questionId },
  });
  const isFirstAttempt = prevAttempts === 0;

  const points = isCorrect ? getPoints(question.difficulty, isFirstAttempt) : 0;

  // 풀이 기록 저장
  await prisma.attempt.create({
    data: {
      questionId,
      userAnswer: userAnswer || "(건너뜀)",
      isCorrect,
      points,
    },
  });

  // 사용자 통계 업데이트
  const stats = await prisma.userStats.findUnique({ where: { id: 1 } });
  const newCombo = isCorrect ? (stats?.currentCombo || 0) + 1 : 0;
  const maxCombo = Math.max(newCombo, stats?.maxCombo || 0);

  // 연속 학습일 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let consecutiveDays = stats?.consecutiveDays || 0;

  if (stats?.lastStudyDate) {
    const lastDate = new Date(stats.lastStudyDate);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      consecutiveDays += 1;
    } else if (diffDays > 1) {
      consecutiveDays = 1;
    }
  } else {
    consecutiveDays = 1;
  }

  await prisma.userStats.upsert({
    where: { id: 1 },
    update: {
      totalPoints: { increment: points },
      currentCombo: newCombo,
      maxCombo,
      consecutiveDays,
      lastStudyDate: new Date(),
    },
    create: {
      id: 1,
      totalPoints: points,
      currentCombo: newCombo,
      maxCombo,
      consecutiveDays,
      lastStudyDate: new Date(),
    },
  });

  // DailyPlanQuestion solved 업데이트
  const planStart = stats?.planStartDate;
  if (planStart) {
    const dayNum = Math.floor(
      (today.getTime() - new Date(planStart).setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24)
    ) + 1;
    await prisma.dailyPlanQuestion.updateMany({
      where: { dayNumber: dayNum, questionId },
      data: { solved: true },
    });
  }

  // 뱃지 체크
  const newBadges = await checkAndAwardBadges();

  // 콤보 보너스 포인트
  let comboBonus = 0;
  if (newCombo === 5) comboBonus = 50;
  else if (newCombo === 10) comboBonus = 100;
  else if (newCombo === 20) comboBonus = 200;
  else if (newCombo === 50) comboBonus = 500;

  if (comboBonus > 0) {
    await prisma.userStats.update({
      where: { id: 1 },
      data: { totalPoints: { increment: comboBonus } },
    });
  }

  return NextResponse.json({
    isCorrect,
    correctAnswer: question.answer,
    points: points + comboBonus,
    combo: newCombo,
    newBadges,
  });
}
