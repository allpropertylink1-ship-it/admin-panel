import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS = {
  platformName: "All Property Link",
  platformUrl: "https://allpropertylink.com",
  contactEmail: "info@allpropertylink.com",
  fromName: "All Property Link",
  fromEmail: "noreply@allpropertylink.com",
  replyTo: "info@allpropertylink.com",
  businessNumber: "+254 700 000 000",
  responseTime: "1hour",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await prisma.user.findUnique({
      where: { id: (session.user as { id: string }).id },
      select: { role: true },
    });
    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const auditLog = await prisma.auditLog.findFirst({
      where: { action: "UPDATE_SETTINGS" },
      orderBy: { createdAt: "desc" },
      select: { newData: true },
    });

    const settings = auditLog?.newData as Record<string, string> | null;
    return NextResponse.json({ settings: settings || DEFAULT_SETTINGS });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminId = (session.user as { id: string }).id;
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });
    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await request.json();

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_SETTINGS",
        entityType: "SETTINGS",
        newData: settings,
        userId: adminId,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
