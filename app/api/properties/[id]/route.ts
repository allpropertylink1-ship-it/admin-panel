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
    const { moderationStatus, isPublished, isFeatured, rejectionReason } = body;

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (moderationStatus) {
      data.moderationStatus = moderationStatus;
      data.reviewedAt = new Date();
      data.reviewedBy = adminId;
      if (moderationStatus === "APPROVED") {
        data.isPublished = true;
        data.publishedAt = property.publishedAt || new Date();
      }
    }
    if (rejectionReason) data.rejectionReason = rejectionReason;
    if (typeof isPublished === "boolean") data.isPublished = isPublished;
    if (typeof isFeatured === "boolean") {
      data.isFeatured = isFeatured;
      data.featuredUntil = isFeatured
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;
    }

    await prisma.property.update({ where: { id }, data });

    if (property.agentId && moderationStatus === "APPROVED") {
      await prisma.notification.create({
        data: {
          userId: property.agentId,
          title: "Property Approved",
          message: `Your listing "${property.title}" has been approved and published.`,
          type: "LISTING_APPROVED",
          link: `/dashboard/listings`,
        },
      });
    }

    if (property.agentId && moderationStatus === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: property.agentId,
          title: "Property Rejected",
          message: `Your listing "${property.title}" was rejected. Reason: ${rejectionReason || "N/A"}`,
          type: "LISTING_REJECTED",
          link: `/dashboard/listings`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
