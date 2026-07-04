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

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      where: { accountStatus: "PENDING_APPROVAL", deletedAt: null },
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
        companyName: true,
        contactPerson: true,
        category: true,
        specialties: true,
        location: true,
        estateSubLocation: true,
        website: true,
        refereeName: true,
        refereePhone: true,
        refereeLocation: true,
        aplRepName: true,
        aplRepPhone: true,
        avatar: true,
        createdAt: true,
        kycDocuments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            documentType: true,
            documentNumber: true,
            status: true,
            frontImage: true,
            backImage: true,
            rejectionReason: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Pending users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
