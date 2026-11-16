import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/authorization';

export async function GET(request: NextRequest) {
  const authorization = await authorizeRequest(request, ['hospital_admin', 'super_admin']);
  if (!authorization.authorized) {
    return authorization.response;
  }

  const generationProvider = process.env.OPENAI_API_KEY
    ? 'OpenAI'
    : process.env.GEMINI_API_KEY
      ? 'Google Gemini'
      : 'Evidence-only response mode';

  return NextResponse.json({
    success: true,
    configuration: {
      generationProvider,
      llmConfigured: Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY),
      retrievalMethod: 'Tenant-filtered hybrid text similarity',
      storage: process.env.MONGODB_URI ? 'MongoDB' : 'Development memory store',
    },
  });
}