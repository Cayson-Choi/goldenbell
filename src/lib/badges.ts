import { prisma } from "./db";

interface BadgeCheck {
  badgeKey: string;
  check: () => Promise<boolean>;
}

export async function checkAndAwardBadges(userId: number): Promise<string[]> {
  const earned: string[] = [];

  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) return earned;

  const totalAttempts = await prisma.attempt.count({ where: { userId } });
  const correctAttempts = await prisma.attempt.count({ where: { userId, isCorrect: true } });

  const checks: BadgeCheck[] = [
    {
      badgeKey: "first_step",
      check: async () => totalAttempts >= 1,
    },
    {
      badgeKey: "combo_10",
      check: async () => stats.maxCombo >= 10,
    },
    {
      badgeKey: "combo_50",
      check: async () => stats.maxCombo >= 50,
    },
    {
      badgeKey: "daily_complete",
      check: async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAttempts = await prisma.attempt.count({
          where: { userId, createdAt: { gte: today } },
        });
        return todayAttempts >= 50;
      },
    },
    {
      badgeKey: "weekly_streak",
      check: async () => stats.consecutiveDays >= 7,
    },
    {
      badgeKey: "golden_star",
      check: async () => {
        const uniqueSolved = await prisma.attempt.groupBy({
          by: ["questionId"],
          where: { userId, isCorrect: true },
        });
        return uniqueSolved.length >= 1199;
      },
    },
    {
      badgeKey: "space_doctor",
      check: async () => {
        if (totalAttempts < 1199) return false;
        return correctAttempts / totalAttempts >= 0.9;
      },
    },
  ];

  // 난이도별 마스터 체크
  const diffBadges: Record<string, { key: string; diff: string; count: number }> = {
    easy_master: { key: "easy_master", diff: "하", count: 180 },
    medium_master: { key: "medium_master", diff: "중", count: 180 },
    hard_master: { key: "hard_master", diff: "상", count: 420 },
    expert_master: { key: "expert_master", diff: "최상", count: 420 },
  };

  for (const [, val] of Object.entries(diffBadges)) {
    checks.push({
      badgeKey: val.key,
      check: async () => {
        const questions = await prisma.question.findMany({
          where: { difficulty: val.diff },
          select: { id: true },
        });
        const qIds = questions.map((q) => q.id);
        const solved = await prisma.attempt.groupBy({
          by: ["questionId"],
          where: { userId, questionId: { in: qIds }, isCorrect: true },
        });
        return solved.length >= val.count;
      },
    });
  }

  for (const { badgeKey, check } of checks) {
    const badge = await prisma.userBadge.findFirst({ where: { userId, badgeKey } });
    if (badge && !badge.earnedAt) {
      const passed = await check();
      if (passed) {
        await prisma.userBadge.update({
          where: { id: badge.id },
          data: { earnedAt: new Date() },
        });
        earned.push(badge.name);
      }
    }
  }

  return earned;
}
