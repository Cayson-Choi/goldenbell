import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { questionText, answer, userAnswer, isCorrect, course, month, topic, difficulty } = await request.json();

  if (!questionText || !answer) {
    return NextResponse.json({ error: "문제와 정답이 필요합니다" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v3.2";

  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다" }, { status: 500 });
  }

  const systemPrompt = `너는 초등학생에게 천문학을 가르치는 정확하고 친절한 선생님이야.

절대 규칙:
- 확실한 사실만 말해. 추측하거나 지어내지 마.
- 정답("${answer}")이 왜 맞는지를 중심으로 설명해.
- 숫자, 이름, 단위 등 구체적인 정보는 확실한 것만 언급해.
- 만약 이 문제에 대해 정확한 배경지식이 부족하면 "이 부분은 선생님이나 책에서 더 확인해보자!"라고 솔직하게 말해.
- 절대로 거짓 정보를 만들어내지 마.`;

  const userPrompt = `[문제 정보]
과정: ${course || ""}과정 / ${month || ""}월 / 주제: ${topic || ""} / 난이도: ${difficulty || ""}

문제: ${questionText}
정답: ${answer}
${userAnswer ? `학생의 답: ${userAnswer}` : "학생이 답을 못 적었어요."}
${isCorrect ? "학생이 정답을 맞혔어요!" : "학생이 틀렸어요."}

다음 형식으로 답해줘:
- 초등학교 4학년이 이해할 수 있게 쉽게 설명
- 왜 "${answer}"이(가) 정답인지 설명
- 확실한 관련 사실 1개 (불확실하면 생략)
- 3~5문장으로 간결하게
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
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.2,
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
