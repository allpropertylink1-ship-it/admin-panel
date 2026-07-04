import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const reject = body.reject === true
    const reason = body.reason || ""

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (targetUser.deletedAt) {
      return NextResponse.json({ error: "User is deleted" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        accountStatus: reject ? "REJECTED" : "ACTIVE",
        approvedAt: new Date(),
        approvedBy: admin.id,
      },
    })

    await prisma.notification.create({
      data: {
        userId: id,
        title: reject ? "Account Rejected" : "Account Approved",
        message: reject
          ? `Your account registration has been rejected.${reason ? ` Reason: ${reason}` : ""}`
          : "Your account has been approved. You can now list properties and use all features.",
        type: reject ? "LISTING_REJECTED" : "LISTING_APPROVED",
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Approve user API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
