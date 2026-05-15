import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const UpvoteSchema = z.object({
  streamId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { streamId } = UpvoteSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Upsert upvote (if exists, delete it; if not, create it - toggle logic)
    const existingUpvote = await db.upvote.findUnique({
      where: {
        userId_streamId: {
          userId: user.id,
          streamId: streamId
        }
      }
    });

    if (existingUpvote) {
      await db.upvote.delete({
        where: { id: existingUpvote.id }
      });
      return NextResponse.json({ message: "Upvote removed" });
    } else {
      await db.upvote.create({
        data: {
          userId: user.id,
          streamId: streamId
        }
      });
      return NextResponse.json({ message: "Upvoted successfully" });
    }

  } catch (e) {
    return NextResponse.json({ message: "Error upvoting" }, { status: 500 });
  }
}
