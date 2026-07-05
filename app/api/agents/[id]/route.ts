import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminId = (session.user as { id: string }).id;
    const admin = await prisma.user.findUnique({
      where: { id: adminId }, select: { role: true },
    });
    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { accountStatus } = body;

    if (!accountStatus) {
      return NextResponse.json({ error: "accountStatus is required" }, { status: 400 });
    }

    const validStatuses = ["ACTIVE", "SUSPENDED", "PENDING_APPROVAL", "REJECTED"];
    if (!validStatuses.includes(accountStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: {
        accountStatus,
        lockedUntil: accountStatus === "SUSPENDED" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
