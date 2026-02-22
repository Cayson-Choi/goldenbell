/**
 * 채점 로직
 * - 공백/조사 유연 처리
 * - 복수 정답(쉼표 구분) 순서 무관
 * - 괄호 부가설명 무시
 */

function normalize(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, "")           // 모든 공백 제거
    .replace(/[()（）]/g, "")       // 괄호 제거
    .replace(/\./g, "")            // 마침표 제거
    .toLowerCase();
}

function removeParenthetical(text: string): string {
  // "답 (참고 : xxx)" 같은 부가설명 제거
  return text.replace(/\s*[\(（].*?[\)）]\s*/g, "").trim();
}

export function gradeAnswer(userAnswer: string, correctAnswer: string): boolean {
  const cleanCorrect = removeParenthetical(correctAnswer);

  // 쉼표로 구분된 복수 정답인지 확인
  const hasComma = cleanCorrect.includes(",") || cleanCorrect.includes("，");

  if (hasComma) {
    // 복수 정답: 모든 항목이 포함되어야 정답
    const correctParts = cleanCorrect
      .split(/[,，]/)
      .map((p) => normalize(p))
      .filter((p) => p.length > 0);

    const userParts = userAnswer
      .split(/[,，\s]+/)
      .map((p) => normalize(p))
      .filter((p) => p.length > 0);

    // 모든 정답 항목이 사용자 답변에 포함되는지 확인
    return correctParts.every((cp) =>
      userParts.some((up) => up.includes(cp) || cp.includes(up))
    );
  }

  // 단일 정답
  const normalUser = normalize(userAnswer);
  const normalCorrect = normalize(cleanCorrect);

  if (normalUser === normalCorrect) return true;

  // "자리" 접미사 유연 처리
  if (
    normalCorrect.endsWith("자리") &&
    normalUser + "자리" === normalCorrect
  )
    return true;
  if (
    normalUser.endsWith("자리") &&
    normalCorrect + "자리" === normalUser
  )
    return true;

  return false;
}

export function getPoints(difficulty: string, isFirstAttempt: boolean): number {
  const base: Record<string, number> = {
    "하": 10,
    "중": 20,
    "상": 30,
    "최상": 50,
  };
  const points = base[difficulty] || 10;
  return isFirstAttempt ? points + 10 : points;
}
