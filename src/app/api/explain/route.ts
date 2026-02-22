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

  const systemPrompt = `너는 초등학교 4학년에게 천문학 퀴즈를 도와주는 친절한 선생님이야.

핵심 규칙:
- 아래 [관련 문제 목록]의 정보를 참고하되, 정답이 왜 맞는지는 자연스럽게 한 줄로 설명해도 돼.
- 단, 문제 목록에 없는 숫자, 날짜, 이름 등 구체적 사실은 절대 지어내지 마.
- 확실하지 않으면 말하지 마.

헷갈림 비교 규칙 (매우 중요):
- 비교는 "답의 유형이 같은 문제"끼리만 해. (사람↔사람, 별이름↔별이름, 숫자↔숫자 등)
- 답의 유형이 다르면 절대 비교하지 마. (사람 이름 vs 우주선 이름 vs 직업 이름 → 비교 안 함)
- 진짜로 시험에서 헷갈릴 만한 것만 비교해. 억지 비교는 하지 마.
- 헷갈릴 문제가 없으면 비교 부분은 아예 생략해.`;

  const userPrompt = `[지금 푼 문제]
${course || ""}과정 ${month || ""}월 "${topic || ""}" / 난이도: ${difficulty || ""}
문제: ${questionText}
정답: ${answer}
${userAnswer ? `학생의 답: ${userAnswer}` : "학생이 답을 못 적었어요."}
${isCorrect ? "→ 맞혔어요!" : "→ 틀렸어요."}

[관련 문제 목록 (참고용)]
${relatedQuestionsText}

해설 형식:
1. 정답이 "${answer}"인 이유를 초등학생이 이해하도록 자연스럽게 1~2문장으로 설명해줘.
2. 위 문제 목록에서 답의 유형이 같아서 진짜 헷갈릴 수 있는 문제가 있을 때만 "⚠️ 헷갈리지 마세요!"로 짧게 비교해줘. (예: 사람이름끼리, 별이름끼리)
3. 헷갈릴 게 없으면 2번은 생략.
4. 전체 3~5문장. 한국어로.`;

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
