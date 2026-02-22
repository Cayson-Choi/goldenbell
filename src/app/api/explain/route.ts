import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { questionText, answer, userAnswer, isCorrect } = await request.json();

  if (!questionText || !answer) {
    return NextResponse.json({ error: "문제와 정답이 필요합니다" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v3.2";

  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다" }, { status: 500 });
  }

  const prompt = `너는 초등학생에게 천문학을 가르치는 친절한 선생님이야. 아래 퀴즈 문제에 대해 해설을 해줘.

문제: ${questionText}
정답: ${answer}
${userAnswer ? `학생의 답: ${userAnswer}` : "학생이 답을 못 적었어요."}
${isCorrect ? "학생이 정답을 맞혔어요!" : "학생이 틀렸어요."}

다음 규칙을 지켜줘:
- 초등학교 4학년이 이해할 수 있게 쉽게 설명해줘
- 왜 그 답이 정답인지 설명해줘
- 관련된 재미있는 사실을 1개 알려줘
- 3~5문장으로 간결하게 해줘
- 한국어로 답해줘`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
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
