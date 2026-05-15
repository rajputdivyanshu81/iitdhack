import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([^&=%\?]{11})/;

const CreateStreamSchema = z.object({
  url: z.string().url(),
  creatorId: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Visitors can add songs, so we don't strictly need a session for POST,
    // but the host (creator) must exist.
    
    const body = await req.json();
    const { url, creatorId } = CreateStreamSchema.parse(body);

    const targetUserId = creatorId; // If provided, add to that room
    
    if (!targetUserId && !session?.user?.email) {
       return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const isYt = url.match(YT_REGEX);
    if (!isYt) {
      return NextResponse.json({ message: "Invalid YouTube URL" }, { status: 400 });
    }

    const videoId = isYt[5];
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    const data = await res.json();

    let user;
    if (targetUserId) {
        user = await db.user.findUnique({ where: { id: targetUserId } });
    } else if (session?.user?.email) {
        user = await db.user.findUnique({ where: { email: session.user.email } });
    }

    if (!user) {
      return NextResponse.json({ message: "Target user not found" }, { status: 404 });
    }

    const stream = await db.stream.create({
      data: {
        userId: user.id,
        url: url,
        extractedId: videoId,
        title: data.title || "Unknown Title",
        smallImg: data.thumbnail_url || "",
        bigImg: data.thumbnail_url || "",
        type: "Youtube",
      }
    });

    return NextResponse.json({
      message: "Added to queue",
      id: stream.id
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error adding to queue" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    
    if (!creatorId) {
      return NextResponse.json({ message: "Missing creatorId" }, { status: 400 });
    }

    const streams = await db.stream.findMany({
      where: {
        userId: creatorId,
        played: false
      },
      include: {
        _count: {
          select: { 
            upvotes: true,
            downvotes: true
          }
        }
      }
    });

    const sortedStreams = streams.map(s => ({
      ...s,
      upvotes: s._count.upvotes,
      downvotes: s._count.downvotes,
      score: s._count.upvotes - s._count.downvotes
    })).sort((a, b) => b.score - a.score);

    return NextResponse.json({
      streams: sortedStreams
    });
  } catch (e) {
    return NextResponse.json({ message: "Error fetching queue" }, { status: 500 });
  }
}
