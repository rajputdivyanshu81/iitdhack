import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const { streamId } = await req.json();

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Mark stream as played
    await db.stream.update({
      where: {
        id: streamId,
        userId: user.id // Security: Only the host can mark as played
      },
      data: {
        played: true,
        active: false
      }
    });

    return NextResponse.json({ message: "Stream marked as played" });

  } catch (e) {
    return NextResponse.json({ message: "Error updating stream" }, { status: 500 });
  }
}
