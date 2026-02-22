import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { questionId, questionText, answer, userAnswer, isCorrect, course, month, topic, difficulty } = await request.json();

  if (!questionText || !answer) {
    return NextResponse.json({ error: "문제와 정답이 필요합니다" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v3.2";

  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다" }, { status: 500 });
  }

  const currentId = questionId || 0;

  // 1. 같은 주제(과정+월)의 다른 문제들
  const sameTopicQuestions = await prisma.question.findMany({
    where: {
      course: course || undefined,
      month: month ? Number(month) : undefined,
      id: { not: currentId },
    },
    select: {
      id: true, course: true, month: true, topic: true,
      questionNumber: true, difficulty: true, questionText: true, answer: true,
    },
  });

  // 2. 전체 DB에서 정답이 같거나 비슷한 문제 (정답 텍스트 포함)
  const similarAnswerQuestions = await prisma.question.findMany({
    where: {
      id: { not: currentId },
      answer: { contains: answer },
    },
    select: {
      id: true, course: true, month: true, topic: true,
      questionNumber: true, difficulty: true, questionText: true, answer: true,
    },
  });

  // 3. 전체 DB에서 문제 텍스트에 정답 키워드가 포함된 문제
  const answerInTextQuestions = await prisma.question.findMany({
    where: {
      id: { not: currentId },
      questionText: { contains: answer },
    },
    select: {
      id: true, course: true, month: true, topic: true,
      questionNumber: true, difficulty: true, questionText: true, answer: true,
    },
  });

  // 4. 정답에서 핵심 키워드 추출 (2글자 이상 단어) 후 해당 키워드가 정답인 다른 문제
  const keywords = answer
    .replace(/[,\s()（）]/g, " ")
    .split(" ")
    .filter((w: string) => w.length >= 2);

  let keywordQuestions: typeof sameTopicQuestions = [];
  if (keywords.length > 0) {
    const keywordResults = await Promise.all(
      keywords.slice(0, 3).map((kw: string) =>
        prisma.question.findMany({
          where: {
            id: { not: currentId },
            OR: [
              { answer: { contains: kw } },
              { questionText: { contains: kw } },
            ],
          },
          select: {
            id: true, course: true, month: true, topic: true,
            questionNumber: true, difficulty: true, questionText: true, answer: true,
          },
        })
      )
    );
    keywordQuestions = keywordResults.flat();
  }

  // 합치고 중복 제거, 최대 40개로 제한
  const allRelated = new Map<number, typeof sameTopicQuestions[0]>();
  for (const q of [...sameTopicQuestions, ...similarAnswerQuestions, ...answerInTextQuestions, ...keywordQuestions]) {
    if (!allRelated.has(q.id)) {
      allRelated.set(q.id, q);
    }
  }
  const relatedList = Array.from(allRelated.values()).slice(0, 40);

  // 관련 문제 목록을 텍스트로 변환
  const relatedQuestionsText = relatedList
    .map((q) => `[${q.course}${q.month}월 ${q.difficulty} ${q.questionNumber}번] ${q.questionText} → 정답: ${q.answer}`)
    .join("\n");

  const systemPrompt = `너는 초등학생에게 천문학 퀴즈를 도와주는 선생님이야.

절대 규칙:
- 아래 제공된 [관련 문제 목록]에 있는 정보만 사용해서 해설해.
- 문제 목록에 없는 외부 지식은 절대 추가하지 마.
- 지어내거나 추측하지 마.
- 제공된 문제들 중에서 지금 문제와 헷갈릴 수 있는 문제가 있으면 비교해서 알려줘.
- 다른 주제에 있는 문제라도 헷갈릴 수 있으면 반드시 알려줘.
- 초등학교 4학년이 이해할 수 있게 쉽게 말해줘.`;

  const userPrompt = `[지금 푼 문제]
과정: ${course || ""}과정 / ${month || ""}월 / 주제: ${topic || ""} / 난이도: ${difficulty || ""}
문제: ${questionText}
정답: ${answer}
${userAnswer ? `학생의 답: ${userAnswer}` : "학생이 답을 못 적었어요."}
${isCorrect ? "→ 정답을 맞혔어요!" : "→ 틀렸어요."}

[전체 문제은행에서 찾은 관련 문제들 (${relatedList.length}개)]
${relatedQuestionsText}

위 정보만을 바탕으로 해설해줘:
1. 정답이 "${answer}"인 이유를 간단히 설명 (위 문제 목록 내용 기반으로만)
2. 위 관련 문제 중 이 문제와 헷갈릴 수 있는 문제가 있다면 "⚠️ 헷갈리지 마세요!" 로 비교 정리 (어떤 과정 몇월 문제인지도 알려줘)
3. 헷갈릴 문제가 없으면 2번은 생략
4. 간결하게 (3~6문장)
5. 한국어로`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 700,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenRouter error:", err);
      return NextResponse.json({ error: "AI 서비스 오류" }, { status: 502 });
    }

    const data = await res.json();
    const explanation = data.choices?.[0]?.message?.content || "해설을 생성할 수 없습니다.";

    return NextResponse.json({ explanation });
  } catch (e) {
    console.error("Explain API error:", e);
    return NextResponse.json({ error: "AI 서비스 연결 실패" }, { status: 502 });
  }
}
