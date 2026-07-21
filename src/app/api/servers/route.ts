import { NextResponse } from "next/server";
import { getMergedServers } from "@/lib/servers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const servers = await getMergedServers();
    return NextResponse.json({ servers, syncedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load servers" },
      { status: 502 }
    );
  }
}
