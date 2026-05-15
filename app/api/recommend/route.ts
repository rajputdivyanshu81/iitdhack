import { NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { playHistory, currentQueue } = await req.json();

    if (!playHistory || !currentQueue) {
      return NextResponse.json({ error: 'Missing playHistory or currentQueue' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
    
    // Extract JSON from potentially markdown-wrapped response
    const jsonMatch = textResponse.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    const cleanedJson = jsonMatch ? jsonMatch[0] : textResponse;

    try {
      const recommendations = JSON.parse(cleanedJson);
      return NextResponse.json({ recommendations });
    } catch (parseError) {
      console.error('[RecommendAPI] JSON Parse Error:', parseError, 'Raw response:', textResponse);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

  } catch (error) {
    console.error('[RecommendAPI] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
