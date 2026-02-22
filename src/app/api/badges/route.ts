import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const badges = await prisma.badge.findMany({
    orderBy: { id: "asc" },
  });

  return NextResponse.json(badges);
}
