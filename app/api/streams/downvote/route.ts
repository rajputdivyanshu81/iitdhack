import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DownvoteSchema = z.object({
  streamId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { streamId } = DownvoteSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Toggle logic for downvote
    const existingDownvote = await db.downvote.findUnique({
      where: {
        userId_streamId: {
          userId: user.id,
          streamId: streamId
        }
      }
    });

    if (existingDownvote) {
      await db.downvote.delete({ where: { id: existingDownvote.id } });
      return NextResponse.json({ message: "Downvote removed" });
    } else {
      // Remove upvote if it exists
      await db.upvote.deleteMany({
        where: { userId: user.id, streamId }
      });
      
      await db.downvote.create({
        data: {
          userId: user.id,
          streamId: streamId
        }
      });
      return NextResponse.json({ message: "Downvoted successfully" });
    }

  } catch (e) {
    return NextResponse.json({ message: "Error downvoting" }, { status: 500 });
  }
}
