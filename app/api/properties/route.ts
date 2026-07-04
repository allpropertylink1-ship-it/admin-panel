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
    const status = searchParams.get("status") || ""
    const type = searchParams.get("type") || ""
    const city = searchParams.get("city") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))

    const where: Record<string, unknown> = { deletedAt: null }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.moderationStatus = status
    }

    if (type) {
      where.propertyType = type
    }

    if (city) {
      where.city = city
    }

    const [properties, total, cities] = await Promise.all([
      prisma.property.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          currency: true,
          propertyType: true,
          status: true,
          moderationStatus: true,
          city: true,
          region: true,
          country: true,
          bedrooms: true,
          bathrooms: true,
          area: true,
          isPublished: true,
          isFeatured: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          images: true,
          agent: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
        },
      }),
      prisma.property.count({ where: where as any }),
      prisma.property.findMany({
        where: { deletedAt: null },
        select: { city: true },
        distinct: ["city"],
        orderBy: { city: "asc" },
      }),
    ])

    return NextResponse.json({
      properties,
      cities: cities.map((c) => c.city).filter(Boolean),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Properties API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
