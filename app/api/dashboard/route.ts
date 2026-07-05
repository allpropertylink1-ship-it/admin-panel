import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      pendingApprovals,
      activeProperties,
      pendingReviews,
      totalInquiries,
      pendingInquiries,
      kycPending,
      totalAgents,
      recentRegistrations,
      recentInquiries,
      userRegistrations,
      topCities,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { accountStatus: "PENDING_APPROVAL", deletedAt: null } }),
      prisma.property.count({ where: { moderationStatus: "APPROVED", isPublished: true, deletedAt: null } }),
      prisma.property.count({ where: { moderationStatus: "PENDING_REVIEW", deletedAt: null } }),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: "PENDING" } }),
      prisma.kycDocument.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { OR: [{ isAgent: true }, { role: "AGENT" }], deletedAt: null } }),
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, firstName: true, lastName: true, email: true, role: true, accountStatus: true, createdAt: true, avatar: true },
      }),
      prisma.inquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, message: true, status: true, createdAt: true },
      }),
      prisma.user.findMany({
        where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.property.groupBy({
        by: ["city"],
        _count: { city: true },
        where: { deletedAt: null },
        orderBy: { _count: { city: "desc" } },
        take: 10,
      }),
    ])

    const registrationsByDay: { date: string; count: number }[] = []
    const cursor = new Date(thirtyDaysAgo)
    while (cursor <= now) {
      const dateStr = cursor.toISOString().slice(0, 10)
      registrationsByDay.push({
        date: dateStr,
        count: userRegistrations.filter((r) => r.createdAt.toISOString().slice(0, 10) === dateStr).length,
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    return NextResponse.json({
      totalUsers,
      pendingApprovals,
      activeProperties,
      pendingReviews,
      totalInquiries,
      pendingInquiries,
      kycPending,
      totalAgents,
      recentRegistrations,
      recentInquiries,
      topCities: topCities.map((c) => ({ city: c.city, count: c._count.city })),
      registrationsByDay,
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
