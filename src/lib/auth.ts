import { cookies } from "next/headers";
import { prisma } from "./db";

const SESSION_COOKIE = "goldenbell_session";

export async function getSession(): Promise<{ userId: number } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return null;

  try {
    const userId = parseInt(session.value);
    if (isNaN(userId)) return null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    return { userId: user.id };
  } catch {
    return null;
  }
}

export async function setSession(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, String(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30일
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// 뱃지 초기 생성 (회원가입 시)
const DEFAULT_BADGES = [
  { badgeKey: "first_step", name: "첫 발걸음", description: "첫 문제를 풀었어요!" },
  { badgeKey: "easy_master", name: "하 마스터", description: "하 난이도 전체 정답" },
  { badgeKey: "medium_master", name: "중 마스터", description: "중 난이도 전체 정답" },
  { badgeKey: "hard_master", name: "상 마스터", description: "상 난이도 전체 정답" },
  { badgeKey: "expert_master", name: "최상 마스터", description: "최상 난이도 전체 정답" },
  { badgeKey: "combo_10", name: "10콤보", description: "연속 10문제 정답!" },
  { badgeKey: "combo_50", name: "50콤보", description: "연속 50문제 정답!" },
  { badgeKey: "daily_complete", name: "일일 완주", description: "하루 50문제 완료!" },
  { badgeKey: "weekly_streak", name: "주간 완주", description: "7일 연속 학습!" },
  { badgeKey: "golden_star", name: "골든별 마스터", description: "전체 1,200문제 완료!" },
  { badgeKey: "space_doctor", name: "우주 박사", description: "정답률 90% 이상!" },
];

export async function initUserData(userId: number) {
  // UserStats 생성
  await prisma.userStats.create({
    data: { userId },
  });

  // 뱃지 생성
  for (const badge of DEFAULT_BADGES) {
    await prisma.userBadge.create({
      data: { userId, ...badge },
    });
  }
}
