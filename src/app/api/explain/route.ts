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

  const systemPrompt = `너는 초등학교 4학년에게 천문학과 우주 퀴즈를 도와주는 친절한 선생님이야.

규칙:
- 정답이 왜 맞는지 네가 아는 지식으로 자연스럽고 쉽게 설명해줘.
- 초등학교 4학년도 이해할 수 있게 쉬운 말로 해줘.
- 확실하지 않은 사실은 절대 지어내지 마.
- 2~3문장으로 간결하게. 한국어로.`;

  const userPrompt = `문제: ${questionText}
정답: ${answer}
${userAnswer ? `학생의 답: ${userAnswer}` : "학생이 답을 못 적었어요."}
${isCorrect ? "→ 맞혔어요!" : "→ 틀렸어요."}

정답이 "${answer}"인 이유를 초등학생이 이해하도록 2~3문장으로 쉽게 설명해줘.`;

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
