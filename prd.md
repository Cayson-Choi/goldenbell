# PRD: 도전! 골든별 퀴즈 웹앱

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 도전! 골든별 퀴즈 |
| 대상 사용자 | 초등학교 4학년 |
| 목표 | 1,200문제를 24일 내 완주 (하루 50문제), 반복 학습으로 암기 |
| 문제 출처 | 2026 도전 골든별 문제은행 (어린이천문대) |
| 배포 | Vercel |
| 저장소 | GitHub (https://github.com/Cayson-Choi/goldenbell.git) |

## 2. 문제 데이터 구조

### 2.1 전체 규모
- **총 문제 수**: 1,200문제
- **과정**: 체험과정 (12개월) + 탐구과정 (12개월) = 24개 주제
- **24일 완주 계획**: 하루 50문제

### 2.2 과정별 구성

#### 체험과정 (12개 주제, 주제당 35문제 = 420문제)

| 월 | 주제 | 하(5) | 중(5) | 상(15) | 최상(10) |
|----|------|-------|-------|--------|----------|
| 1월 | 겨울철 별자리와 별의 색깔 | 5 | 5 | 15 | 10 |
| 2월 | 우주를 향한 도전 | 5 | 5 | 15 | 10 |
| 3월 | 우주인의 생활 | 5 | 5 | 15 | 10 |
| 4월 | 봄철 별자리와 별의 밝기 | 5 | 5 | 15 | 10 |
| 5월 | 태양 | 5 | 5 | 15 | 10 |
| 6월 | 태양계 | 5 | 5 | 15 | 10 |
| 7월 | 여름철 별자리와 별의 크기 | 5 | 5 | 15 | 10 |
| 8월 | 은하수 | 5 | 5 | 15 | 10 |
| 9월 | 달 탐사 | 5 | 5 | 15 | 10 |
| 10월 | 가을철 별자리와 별의 거리 | 5 | 5 | 15 | 10 |
| 11월 | 사라진 공룡과 소행성 | 5 | 5 | 15 | 10 |
| 12월 | 우주 속의 지구 | 5 | 5 | 15 | 10 |

#### 탐구과정 (12개 주제, 주제당 65문제 = 780문제)

| 월 | 주제 | 하(10) | 중(10) | 상(20) | 최상(25) |
|----|------|--------|--------|--------|----------|
| 1월 | 별의 밝기와 거리 | 10 | 10 | 20 | 25 |
| 2월 | 우주탐사 | 10 | 10 | 20 | 25 |
| 3월 | 별의 색깔에 담긴 과학 | 10 | 10 | 20 | 25 |
| 4월 | 별의 일생 | 10 | 10 | 20 | 25 |
| 5월 | 달의 과학 | 10 | 10 | 20 | 25 |
| 6월 | 행성 | 10 | 10 | 20 | 25 |
| 7월 | 지구과학 | 10 | 10 | 20 | 25 |
| 8월 | 혜성, 유성 | 10 | 10 | 20 | 25 |
| 9월 | 소행성, 왜행성 | 10 | 10 | 20 | 25 |
| 10월 | 망원경 | 10 | 10 | 20 | 25 |
| 11월 | 성운, 성단, 은하 | 10 | 10 | 20 | 25 |
| 12월 | 은하 분류와 우주론 | 10 | 10 | 20 | 25 |

### 2.3 난이도별 총계

| 난이도 | 문제 수 | 비중 |
|--------|---------|------|
| 하 | 180 | 15% |
| 중 | 180 | 15% |
| 상 | 420 | 35% |
| 최상 | 420 | 35% |
| **합계** | **1,200** | **100%** |

### 2.4 문제 데이터 스키마

```
Question {
  id: number              // 고유 ID (1~1200)
  course: string          // "체험" | "탐구"
  month: number           // 1~12
  topic: string           // 주제명 (예: "겨울철 별자리와 별의 색깔")
  difficulty: string      // "하" | "중" | "상" | "최상"
  questionNumber: number  // 해당 난이도 내 문제 번호
  questionText: string    // 문제 본문
  answer: string          // 정답
}
```

## 3. 기술 스택

| 분류 | 기술 | 선택 이유 |
|------|------|-----------|
| Framework | Next.js 14 (App Router) | React 기반, SSR/API Routes 내장 |
| Language | TypeScript | 타입 안전성 |
| Styling | Tailwind CSS | 빠른 UI 개발, 반응형 지원 |
| DB | Vercel Postgres (Neon) + Prisma ORM | Vercel 서버리스 환경 호환, 무료 티어 제공 |
| 상태관리 | Zustand | 경량, 간단한 API |
| 배포 | Vercel | GitHub 연동 자동 배포 |
| 패키지 매니저 | npm | 기본 제공 |

## 4. 핵심 기능

### 4.1 퀴즈 풀기 (메인)
- 문제가 화면에 표시됨
- 사용자가 텍스트 입력으로 정답 작성
- "정답 확인" 버튼 클릭 시 채점
  - 정답: 정답 표시 + 포인트 획득 + 다음 문제로
  - 오답: 정답 공개 + 오답노트에 자동 추가
- 채점 로직: 정답 문자열과 비교 (공백/조사 등 유연하게 처리)
- 문제 간 넘기기 (이전/다음) 지원
- "모르겠어요" 버튼으로 정답 확인 후 넘기기

### 4.2 오답노트
- 틀린 문제 자동 수집
- 오답노트에서 재풀이 가능
- 정답 맞추면 오답노트에서 제거 (또는 "완료" 처리)
- 오답 횟수 기록 (많이 틀린 순으로 정렬 가능)

### 4.3 하루 50문제 자동배분 (24일 플랜)
- Day 1~24까지 자동으로 50문제씩 배정
- 배분 전략: 난이도 순서대로 (하 → 중 → 상 → 최상)
  - Day 1~4: 하 난이도 위주 (180문제 / ~4일)
  - Day 5~8: 중 난이도 위주 (180문제 / ~4일)
  - Day 9~16: 상 난이도 (420문제 / ~8일)
  - Day 17~24: 최상 난이도 (420문제 / ~8일)
- 오늘의 진행 상황 표시 (예: 32/50 완료)
- 오늘 못 푼 문제는 다음 날로 이월

### 4.4 게임 요소
- **포인트 시스템**
  - 난이도별 차등 포인트: 하(10pt), 중(20pt), 상(30pt), 최상(50pt)
  - 첫 시도 정답 시 보너스 +10pt
- **연속 정답 콤보**
  - 연속으로 맞출 때마다 콤보 카운터 증가
  - 5콤보, 10콤보 등 달성 시 보너스 포인트
- **뱃지 시스템**
  - "첫 발걸음": 첫 문제 풀기
  - "하 마스터": 하 난이도 전체 정답
  - "중 마스터": 중 난이도 전체 정답
  - "상 마스터": 상 난이도 전체 정답
  - "최상 마스터": 최상 난이도 전체 정답
  - "10콤보": 연속 10문제 정답
  - "50콤보": 연속 50문제 정답
  - "일일 완주": 하루 50문제 완료
  - "주간 완주": 7일 연속 학습
  - "골든별 마스터": 전체 1,200문제 완료
  - "우주 박사": 전체 1,200문제 정답률 90% 이상
  - 월별 주제 뱃지 (24개): 각 주제 전문제 정답
- **진행률 시각화**
  - 전체 진행 프로그레스 바
  - 난이도별 도넛 차트
  - 일별 학습량 캘린더 히트맵

### 4.5 대시보드 (홈)
- 오늘의 학습 현황: 50문제 중 N문제 완료
- 전체 진행률: 1,200문제 중 N문제 완료 (%)
- 정답률 표시
- 최근 획득 뱃지
- 오답노트 문제 수
- "오늘의 퀴즈 시작" 버튼

## 5. 페이지 구성

```
/                    → 홈 (대시보드)
/quiz/daily          → 오늘의 50문제
/quiz/topic          → 주제 선택 화면
/quiz/topic/[id]     → 선택한 주제의 퀴즈
/quiz/difficulty     → 난이도 선택 화면
/quiz/difficulty/[d] → 선택한 난이도의 퀴즈
/quiz/wrong          → 오답노트 퀴즈
/stats               → 상세 통계
/badges              → 뱃지 컬렉션
```

## 6. DB 스키마 (Prisma)

```prisma
model Question {
  id             Int       @id @default(autoincrement())
  course         String    // "체험" | "탐구"
  month          Int       // 1~12
  topic          String    // 주제명
  difficulty     String    // "하" | "중" | "상" | "최상"
  questionNumber Int       // 난이도 내 번호
  questionText   String    // 문제 본문
  answer         String    // 정답
  attempts       Attempt[]
}

model Attempt {
  id         Int      @id @default(autoincrement())
  questionId Int
  question   Question @relation(fields: [questionId], references: [id])
  userAnswer String   // 사용자 입력 답
  isCorrect  Boolean  // 정답 여부
  createdAt  DateTime @default(now())
}

model DailyPlan {
  id         Int      @id @default(autoincrement())
  dayNumber  Int      @unique // 1~24
  date       DateTime // 실제 날짜
  completed  Boolean  @default(false)
}

model DailyPlanQuestion {
  id         Int @id @default(autoincrement())
  dayNumber  Int
  questionId Int
  solved     Boolean @default(false)
}

model Badge {
  id        Int      @id @default(autoincrement())
  badgeKey  String   @unique // 뱃지 식별자
  name      String   // 표시 이름
  earnedAt  DateTime? // 획득 시간 (null이면 미획득)
}

model UserStats {
  id              Int @id @default(1)
  totalPoints     Int @default(0)
  currentCombo    Int @default(0)
  maxCombo        Int @default(0)
  consecutiveDays Int @default(0)
  lastStudyDate   DateTime?
}
```

## 7. API 설계

```
GET  /api/questions                → 전체 문제 목록 (필터: course, month, difficulty)
GET  /api/questions/[id]           → 문제 상세

GET  /api/daily                    → 오늘의 50문제
POST /api/daily/start              → 24일 플랜 시작 (seed 생성)

POST /api/attempt                  → 풀이 제출 { questionId, userAnswer }
                                     → 응답: { isCorrect, correctAnswer, points, combo }

GET  /api/wrong                    → 오답 문제 목록
GET  /api/stats                    → 사용자 통계
GET  /api/badges                   → 뱃지 목록 + 획득 여부
```

## 8. UI/UX 가이드라인

### 8.1 디자인 원칙
- 초등학생 대상이므로 **큰 글씨, 명확한 버튼, 밝은 색상**
- 우주/별 테마: 네이비, 골드, 화이트 기본 색상
- 정답 시 축하 애니메이션 (별 반짝임 등)
- 오답 시 격려 메시지 ("아깝다! 다음에 다시 도전해보자!")

### 8.2 반응형
- 모바일, 태블릿, 데스크탑 모두 지원
- 터치 친화적 버튼 크기 (최소 44px)

### 8.3 접근성
- 큰 폰트 기본 (본문 18px 이상)
- 높은 대비 색상
- 키보드 네비게이션 지원 (Enter로 정답 제출)

## 9. 채점 로직

정답 비교 시 유연하게 처리:
- 앞뒤 공백 제거 (trim)
- 쉼표로 구분된 복수 정답 처리 (예: "벨카, 스트렐카")
  - 순서 무관하게 모두 포함하면 정답
- 괄호 안 부가 설명 제거 후 비교
- "자리" 접미사 유연 처리 (예: "황소자리" = "황소 자리")

## 10. 24일 학습 플랜 상세

| 구간 | 일차 | 난이도 | 문제 수 | 누적 |
|------|------|--------|---------|------|
| 1구간 | Day 1~4 | 하 위주 | 50 x 4 = 200 | 200 |
| 2구간 | Day 5~8 | 중 위주 | 50 x 4 = 200 | 400 |
| 3구간 | Day 9~16 | 상 위주 | 50 x 8 = 400 | 800 |
| 4구간 | Day 17~24 | 최상 위주 | 50 x 8 = 400 | 1,200 |

- 하(180) + 중(20) → 4일간 소화
- 중(160) + 상(40) → 4일간 소화
- 상(380) + 최상(20) → 8일간 소화
- 최상(400) → 8일간 소화

## 11. 프로젝트 디렉토리 구조

```
goldenbell/
├── prd.md                          # 이 문서
├── 2026도전골든별문제은행.pdf         # 원본 PDF
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # 루트 레이아웃
│   ├── page.tsx                    # 홈 (대시보드)
│   ├── quiz/
│   │   ├── daily/page.tsx          # 오늘의 50문제
│   │   ├── topic/page.tsx          # 주제 선택
│   │   ├── topic/[id]/page.tsx     # 주제별 퀴즈
│   │   ├── difficulty/page.tsx     # 난이도 선택
│   │   ├── difficulty/[d]/page.tsx # 난이도별 퀴즈
│   │   └── wrong/page.tsx          # 오답노트
│   ├── stats/page.tsx              # 상세 통계
│   ├── badges/page.tsx             # 뱃지 컬렉션
│   └── api/                        # API Routes
│       ├── questions/route.ts
│       ├── daily/route.ts
│       ├── attempt/route.ts
│       ├── wrong/route.ts
│       ├── stats/route.ts
│       └── badges/route.ts
├── components/                     # 공통 컴포넌트
│   ├── QuizCard.tsx                # 문제 카드
│   ├── AnswerInput.tsx             # 정답 입력
│   ├── ResultModal.tsx             # 채점 결과 모달
│   ├── ProgressBar.tsx             # 진행률 바
│   ├── ComboCounter.tsx            # 콤보 카운터
│   ├── BadgeCard.tsx               # 뱃지 카드
│   └── Navigation.tsx              # 네비게이션
├── lib/
│   ├── db.ts                       # Prisma 클라이언트
│   ├── grading.ts                  # 채점 로직
│   ├── points.ts                   # 포인트 계산
│   └── badges.ts                   # 뱃지 체크 로직
├── prisma/
│   ├── schema.prisma               # DB 스키마
│   └── seed.ts                     # 문제 데이터 시딩
├── scripts/
│   └── extract-questions.py        # PDF → JSON 변환 스크립트
├── data/
│   └── questions.json              # 추출된 문제 데이터
├── public/
│   └── badges/                     # 뱃지 이미지
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 12. 구현 순서

### Phase 1: 데이터 준비
1. PDF에서 문제 추출 (Python 스크립트)
2. JSON 데이터 검증 (1,200문제 확인)
3. Prisma 스키마 정의 + DB 시딩

### Phase 2: 핵심 기능
4. Next.js 프로젝트 세팅
5. 퀴즈 풀기 UI + 채점 API
6. 24일 학습 플랜 + 오늘의 50문제

### Phase 3: 학습 보조
7. 오답노트 기능
8. 대시보드 (진행률, 통계)

### Phase 4: 게임 요소
9. 포인트 + 콤보 시스템
10. 뱃지 시스템
11. 축하 애니메이션

### Phase 5: 배포
12. GitHub 저장소 생성 + 푸시
13. Vercel 프로젝트 연결 + Vercel Postgres DB 생성
14. 환경변수 설정 (DATABASE_URL 등)
15. Prisma migrate + DB 시딩 (프로덕션)

### Phase 6: 마무리
16. UI 다듬기 + 반응형
17. 테스트 + 버그 수정
