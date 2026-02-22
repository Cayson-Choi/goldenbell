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

async function main() {
  console.log("시딩 시작...");

  // 기존 문제 데이터 삭제
  await prisma.dailyPlanQuestion.deleteMany();
  await prisma.dailyPlan.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.question.deleteMany();

  // questions.json 로드
  const dataPath = path.join(__dirname, "../data/questions.json");
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const questions: QuestionData[] = JSON.parse(rawData);

  console.log(`문제 ${questions.length}개 로드...`);

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
  console.log("시딩 완료! (뱃지/통계는 회원가입 시 자동 생성됩니다)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
