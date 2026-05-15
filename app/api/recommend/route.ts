import { NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { playHistory, currentQueue } = await req.json();

    if (!playHistory || !currentQueue) {
      return NextResponse.json({ error: 'Missing playHistory or currentQueue' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are a music recommendation engine. 
      The user has recently played these songs: ${playHistory.join(', ')}.
      The current queue contains: ${currentQueue.join(', ')}.
      Recommend 3 new songs that fit this vibe but are not already in the history or queue.
      Return the response as a JSON array of objects with 'title' and 'reason' keys. 
      Do not include markdown blocks, just the raw JSON array.
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    
    try {
      const recommendations = JSON.parse(textResponse);
      return NextResponse.json({ recommendations });
    } catch (parseError) {
      console.error('[RecommendAPI] JSON Parse Error:', parseError);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

  } catch (error) {
    console.error('[RecommendAPI] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
