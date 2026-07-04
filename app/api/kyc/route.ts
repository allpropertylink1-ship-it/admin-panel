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
    const status = searchParams.get("status") || "all"

    const where: Record<string, unknown> = {}

    if (status && status !== "all") {
      where.status = status.toUpperCase()
    }

    const documents = await prisma.kycDocument.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        documentType: true,
        documentNumber: true,
        status: true,
        frontImage: true,
        backImage: true,
        rejectionReason: true,
        verifiedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("KYC API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
