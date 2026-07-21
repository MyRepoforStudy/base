import { NextResponse } from "next/server";
import { getMergedServers } from "@/lib/servers";
import { describeError } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const servers = await getMergedServers();
    return NextResponse.json({ servers, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error("GET /api/servers failed:", error);
    return NextResponse.json({ error: describeError(error) }, { status: 502 });
  }
}
