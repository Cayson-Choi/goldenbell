import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface QuestionData {
  id: number;
  course: string;
  month: number;
  topic: string;
  difficulty: string;
  questionNumber: number;
  questionText: string;
  answer: string;
}

const BADGES = [
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

async function main() {
  console.log("시딩 시작...");

  // 기존 데이터 삭제
  await prisma.dailyPlanQuestion.deleteMany();
  await prisma.dailyPlan.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.userStats.deleteMany();

  // questions.json 로드
  const dataPath = path.join(__dirname, "../data/questions.json");
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const questions: QuestionData[] = JSON.parse(rawData);

  console.log(`문제 ${questions.length}개 로드...`);

  // 문제 일괄 삽입
  for (const q of questions) {
    await prisma.question.create({
      data: {
        course: q.course,
        month: q.month,
        topic: q.topic,
        difficulty: q.difficulty,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        answer: q.answer,
      },
    });
  }

  console.log(`문제 ${questions.length}개 시딩 완료`);

  // 뱃지 시딩
  for (const badge of BADGES) {
    await prisma.badge.create({ data: badge });
  }
  console.log(`뱃지 ${BADGES.length}개 시딩 완료`);

  // UserStats 초기화
  await prisma.userStats.create({ data: { id: 1 } });
  console.log("사용자 통계 초기화 완료");

  console.log("시딩 완료!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
