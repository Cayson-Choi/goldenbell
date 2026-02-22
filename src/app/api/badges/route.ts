import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const badges = await prisma.userBadge.findMany({
    where: { userId: session.userId },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(badges);
}
