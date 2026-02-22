import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const course = searchParams.get("course");
  const month = searchParams.get("month");
  const difficulty = searchParams.get("difficulty");
  const topic = searchParams.get("topic");

  const where: Record<string, unknown> = {};
  if (course) where.course = course;
  if (month) where.month = parseInt(month);
  if (difficulty) where.difficulty = difficulty;
  if (topic) where.topic = topic;

  const questions = await prisma.question.findMany({
    where,
    orderBy: [{ month: "asc" }, { questionNumber: "asc" }],
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

  return NextResponse.json(questions);
}
