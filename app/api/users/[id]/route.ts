import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        phoneVerified: true,
        avatar: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        lastLogin: true,
        lastActivity: true,
        twoFactorEnabled: true,
        location: true,
        propertyInterest: true,
        isAgent: true,
        agentLicense: true,
        agencyName: true,
        notificationPrefs: true,
        onboardingComplete: true,
        kycStatus: true,
        accountStatus: true,
        approvedAt: true,
        approvedBy: true,
        companyName: true,
        contactPerson: true,
        category: true,
        specialties: true,
        website: true,
        estateSubLocation: true,
        aplRepName: true,
        aplRepPhone: true,
        refereeName: true,
        refereePhone: true,
        refereeLocation: true,
        dateOfBirth: true,
        gender: true,
        nationality: true,
        address: true,
        city: true,
        postalCode: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
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
            verifiedAt: true,
            createdAt: true,
          },
        },
        _count: { select: { properties: true, inquiries: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("User detail API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
