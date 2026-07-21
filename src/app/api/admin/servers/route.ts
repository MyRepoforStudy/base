import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLinuxHosts } from "@/lib/zabbix";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [records, hosts] = await Promise.all([
      prisma.server.findMany({ orderBy: { hostname: "asc" } }),
      getLinuxHosts(),
    ]);
    return NextResponse.json({ records, knownHostnames: hosts.map((h) => h.host).sort() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load CMDB records" },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { hostname, environment, datacenter, virtual, vendor, model, supportEnd, notes } = body;

  if (!hostname || typeof hostname !== "string") {
    return NextResponse.json({ error: "hostname is required" }, { status: 400 });
  }

  try {
    const record = await prisma.server.upsert({
      where: { hostname },
      create: {
        hostname,
        environment,
        datacenter,
        virtual: Boolean(virtual),
        vendor: vendor || null,
        model: model || null,
        supportEnd: supportEnd ? new Date(supportEnd) : null,
        notes: notes || null,
      },
      update: {
        environment,
        datacenter,
        virtual: Boolean(virtual),
        vendor: vendor || null,
        model: model || null,
        supportEnd: supportEnd ? new Date(supportEnd) : null,
        notes: notes || null,
      },
    });
    return NextResponse.json({ record });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save record" },
      { status: 502 }
    );
  }
}
