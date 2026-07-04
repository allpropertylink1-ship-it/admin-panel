import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    const where: Record<string, unknown> = {
      OR: [{ isAgent: true }, { role: "AGENT" }],
      deletedAt: null,
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { companyName: { contains: search, mode: "insensitive" } },
            { agencyName: { contains: search, mode: "insensitive" } },
          ],
        },
      ]
    }

    const agents = await prisma.user.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        accountStatus: true,
        kycStatus: true,
        isAgent: true,
        companyName: true,
        agencyName: true,
        agentLicense: true,
        category: true,
        specialties: true,
        location: true,
        city: true,
        avatar: true,
        createdAt: true,
        approvedAt: true,
        lastLogin: true,
        _count: { select: { properties: true } },
      },
    })

    return NextResponse.json({ agents })
  } catch (error) {
    console.error("Agents API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
