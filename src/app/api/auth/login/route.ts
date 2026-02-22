import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { name, password } = await req.json();

  if (!name || !password) {
    return NextResponse.json({ error: "이름과 비밀번호를 입력해주세요" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { name } });
  if (!user) {
    return NextResponse.json({ error: "이름 또는 비밀번호가 틀렸어요" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "이름 또는 비밀번호가 틀렸어요" }, { status: 401 });
  }

  await setSession(user.id);

  return NextResponse.json({ success: true, user: { id: user.id, name: user.name } });
}
