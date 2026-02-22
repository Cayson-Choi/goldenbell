"""
PDF에서 문제 데이터를 추출하여 questions.json으로 저장하는 스크립트
전략: ↸ 정답 패턴을 기준으로 역방향으로 문제번호를 찾아 매칭
"""
import fitz
import re
import json
import sys
import io
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PDF_PATH = "D:/Antigravity/goldenbell/2026도전골든별문제은행.pdf"
OUTPUT_PATH = "D:/Antigravity/goldenbell/data/questions.json"

EXPERIENCE_TOPICS = {
    1: "겨울철 별자리와 별의 색깔",
    2: "우주를 향한 도전",
    3: "우주인의 생활",
    4: "봄철 별자리와 별의 밝기",
    5: "태양",
    6: "태양계",
    7: "여름철 별자리와 별의 크기",
    8: "은하수",
    9: "달 탐사",
    10: "가을철 별자리와 별의 거리",
    11: "사라진 공룡과 소행성",
    12: "우주 속의 지구",
}

EXPLORE_TOPICS = {
    1: "별의 밝기와 거리",
    2: "우주탐사",
    3: "별의 색깔에 담긴 과학",
    4: "별의 일생",
    5: "달의 과학",
    6: "행성",
    7: "지구과학",
    8: "혜성, 유성",
    9: "소행성, 왜행성",
    10: "망원경",
    11: "성운, 성단, 은하",
    12: "은하 분류와 우주론",
}


def extract_full_text(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = ""
    for i in range(doc.page_count):
        full_text += doc[i].get_text() + "\n"
    doc.close()
    return full_text


def find_section_markers(full_text):
    """과정/월/난이도 섹션의 위치를 찾아 정렬된 리스트로 반환"""
    markers = []

    # 체험과정 섹션
    for m in re.finditer(r'(\d{1,2})월\s+.+?\s+체험과정', full_text):
        month = int(m.group(1))
        markers.append({
            'pos': m.start(),
            'course': '체험',
            'month': month,
            'topic': EXPERIENCE_TOPICS.get(month, ''),
        })

    # 탐구과정 섹션
    for m in re.finditer(r'(\d{1,2})월\s+.+?\s+탐구과정', full_text):
        month = int(m.group(1))
        markers.append({
            'pos': m.start(),
            'course': '탐구',
            'month': month,
            'topic': EXPLORE_TOPICS.get(month, ''),
        })

    markers.sort(key=lambda x: x['pos'])

    # 난이도 마커
    diff_markers = []
    for m in re.finditer(r'난이도\s*(하|중|상|최상)\s*[:：]\s*(\d+)\s*문제', full_text):
        diff_markers.append({
            'pos': m.start(),
            'difficulty': m.group(1),
            'expected_count': int(m.group(2)),
        })

    return markers, diff_markers


def get_context_at(pos, section_markers, diff_markers):
    """주어진 위치에서의 과정/월/주제/난이도를 반환"""
    course = None
    month = None
    topic = None
    difficulty = None

    for marker in section_markers:
        if marker['pos'] <= pos:
            course = marker['course']
            month = marker['month']
            topic = marker['topic']
        else:
            break

    for dm in diff_markers:
        if dm['pos'] <= pos:
            difficulty = dm['difficulty']
        else:
            break

    return course, month, topic, difficulty


def parse_questions(full_text):
    section_markers, diff_markers = find_section_markers(full_text)

    # ↸ 정답 패턴을 모두 찾기
    answer_matches = list(re.finditer(r'↸\s*정답\s*[:：]\s*(.+)', full_text))

    questions = []
    for idx, ans_match in enumerate(answer_matches):
        answer = ans_match.group(1).strip()
        ans_pos = ans_match.start()

        # 정답 앞 텍스트에서 문제번호 역추적
        search_start = max(0, ans_pos - 3000)
        before_text = full_text[search_start:ans_pos]

        # 가장 마지막 '숫자. ' 패턴
        q_nums = list(re.finditer(r'(?:^|\n)\s*(\d{1,2})\.\s+', before_text))
        if not q_nums:
            continue

        last_q = q_nums[-1]
        q_num = int(last_q.group(1))

        # 문제 텍스트: 문제번호 시작 ~ 정답 직전
        q_text_abs_start = search_start + last_q.end()
        q_text = full_text[q_text_abs_start:ans_pos].strip()
        # 줄바꿈 정리
        q_text = re.sub(r'\s*\n\s*', ' ', q_text).strip()

        # 과정/월/난이도 컨텍스트
        course, month, topic, difficulty = get_context_at(ans_pos, section_markers, diff_markers)

        if not course or not difficulty:
            continue

        questions.append({
            "id": idx + 1,
            "course": course,
            "month": month,
            "topic": topic,
            "difficulty": difficulty,
            "questionNumber": q_num,
            "questionText": q_text,
            "answer": answer,
        })

    # ID 재부여
    for i, q in enumerate(questions):
        q["id"] = i + 1

    return questions


def validate_questions(questions):
    print(f"\n=== 검증 결과 ===")
    print(f"총 추출 문제 수: {len(questions)}")

    total_expected = 0
    total_actual = 0

    for course_name, topics in [("체험", EXPERIENCE_TOPICS), ("탐구", EXPLORE_TOPICS)]:
        cq = [q for q in questions if q["course"] == course_name]
        print(f"\n{course_name}과정: {len(cq)}문제")

        for month in range(1, 13):
            mq = [q for q in cq if q["month"] == month]
            topic = topics[month]
            diffs = {}
            for q in mq:
                d = q["difficulty"]
                diffs[d] = diffs.get(d, 0) + 1

            if course_name == "체험":
                expected = {"하": 5, "중": 5, "상": 15, "최상": 10}
            else:
                expected = {"하": 10, "중": 10, "상": 20, "최상": 25}

            issues = []
            for d in ["하", "중", "상", "최상"]:
                actual = diffs.get(d, 0)
                exp = expected[d]
                total_expected += exp
                total_actual += actual
                if actual != exp:
                    issues.append(f"{d}:{actual}/{exp}")

            status = " OK" if not issues else f" DIFF: {', '.join(issues)}"
            diff_str = ", ".join(f"{k}:{v}" for k, v in sorted(diffs.items(), key=lambda x: ["하","중","상","최상"].index(x[0]) if x[0] in ["하","중","상","최상"] else 99))
            print(f"  {month:2d}월 {topic}: {len(mq)}문제 ({diff_str}){status}")

    print(f"\n난이도별 총계:")
    for d in ["하", "중", "상", "최상"]:
        dq = [q for q in questions if q["difficulty"] == d]
        print(f"  {d}: {len(dq)}문제")

    print(f"\n기대: {total_expected} / 실제: {total_actual} / 차이: {total_expected - total_actual}")


def main():
    print("PDF에서 텍스트 추출 중...")
    full_text = extract_full_text(PDF_PATH)

    print("문제 파싱 중...")
    questions = parse_questions(full_text)

    validate_questions(questions)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"\n저장 완료: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
