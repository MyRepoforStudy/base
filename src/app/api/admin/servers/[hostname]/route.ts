import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ hostname: string }> }) {
  const { hostname } = await params;
  await prisma.server.delete({ where: { hostname } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
