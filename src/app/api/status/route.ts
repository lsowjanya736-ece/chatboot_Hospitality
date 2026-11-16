// src/app/api/status/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';

export async function GET() {
  const provider = process.env.OPENAI_API_KEY
    ? 'openai'
    : process.env.GEMINI_API_KEY
      ? 'gemini'
      : 'evidence-only';
  const hasMongoUri = Boolean(process.env.MONGODB_URI);

  if (!hasMongoUri) {
    const development = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      {
        status: development ? 'ok' : 'unavailable',
        persistence: development ? 'development-memory' : 'mongodb-not-configured',
        answerProvider: provider,
      },
      { status: development ? 200 : 503 }
    );
  }

  try {
    const db = await dbConnect();
    await db.command({ ping: 1 });

    return NextResponse.json({
      status: 'ok',
      persistence: 'mongodb',
      answerProvider: provider,
    });
  } catch (error) {
    console.error('Database health check failed:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json(
      { status: 'unavailable', persistence: 'mongodb', answerProvider: provider },
      { status: 503 }
    );
  }
}
