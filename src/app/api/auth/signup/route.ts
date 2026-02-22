import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSession, initUserData } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { name, password } = await req.json();

  if (!name || !password) {
    return NextResponse.json({ error: "이름과 비밀번호를 입력해주세요" }, { status: 400 });
  }

  if (name.length < 2) {
    return NextResponse.json({ error: "이름은 2글자 이상이어야 해요" }, { status: 400 });
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "비밀번호는 4자리 이상이어야 해요" }, { status: 400 });
  }

  // 중복 확인
  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 이름이에요" }, { status: 409 });
  }

  // 비밀번호 해싱
  const passwordHash = await bcrypt.hash(password, 10);

  // 유저 생성
  const user = await prisma.user.create({
    data: { name, passwordHash },
  });

  // 유저 초기 데이터 생성 (통계, 뱃지)
  await initUserData(user.id);

  // 세션 설정
  await setSession(user.id);

  return NextResponse.json({ success: true, user: { id: user.id, name: user.name } });
}
