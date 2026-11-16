import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/authorization';
import { dbStore } from '@/lib/db/storage';
import { calculateHybridSimilarity } from '@/lib/rag/embeddings';

export async function POST(request: NextRequest) {
  const authorization = await authorizeRequest(request, ['super_admin', 'hospital_admin', 'support_agent']);
  if (!authorization.authorized) {
    return authorization.response;
  }

  try {
    const body = await request.json();
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    if (!query || query.length > 500) {
      return NextResponse.json({ error: 'Enter a search query of 1–500 characters' }, { status: 400 });
    }

    const requestedOrganization = typeof body.organizationId === 'string' ? body.organizationId : '';
    const organizationId = authorization.user.role === 'super_admin'
      ? requestedOrganization
      : authorization.user.organizationId;
    if (!organizationId || organizationId === 'all') {
      return NextResponse.json({ error: 'Choose one organization to search' }, { status: 400 });
    }
    if (
      authorization.user.role !== 'super_admin' &&
      requestedOrganization &&
      requestedOrganization !== authorization.user.organizationId
    ) {
      return NextResponse.json({ error: 'Invalid organization' }, { status: 403 });
    }

    const documents = await dbStore.getDocuments(organizationId);
    const results = documents
      .filter((document) => document.status === 'indexed')
      .flatMap((document) => document.chunks)
      .map((chunk) => ({
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        sectionTitle: chunk.sectionTitle,
        excerpt: chunk.content.slice(0, 240),
        confidenceScore: calculateHybridSimilarity(query, chunk.content, chunk.tags, chunk.sectionTitle),
      }))
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 10);

    return NextResponse.json({ success: true, organizationId, results });
  } catch (error) {
    console.error('Tenant knowledge search failed:', error);
    return NextResponse.json({ error: 'Unable to search the organization knowledge base' }, { status: 500 });
  }
}