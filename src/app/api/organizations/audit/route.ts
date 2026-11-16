import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/authorization';
import { dbStore } from '@/lib/db/storage';
import { processRagQuery } from '@/lib/rag/ragEngine';

export async function POST(request: NextRequest) {
  const authorization = await authorizeRequest(request, ['super_admin']);
  if (!authorization.authorized) {
    return authorization.response;
  }

  try {
    const body = await request.json();
    const organizationA = typeof body.organizationA === 'string' ? body.organizationA : '';
    const organizationB = typeof body.organizationB === 'string' ? body.organizationB : '';
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    if (!organizationA || !organizationB || organizationA === organizationB || !query || query.length > 500) {
      return NextResponse.json({ error: 'Choose two different organizations and enter a query of 1–500 characters' }, { status: 400 });
    }

    const [orgA, orgB] = await Promise.all([
      dbStore.getOrganizationById(organizationA),
      dbStore.getOrganizationById(organizationB),
    ]);
    if (!orgA || !orgB) {
      return NextResponse.json({ error: 'One or both organizations were not found' }, { status: 404 });
    }

    const [resultA, resultB] = await Promise.all([
      processRagQuery(query, organizationA),
      processRagQuery(query, organizationB),
    ]);
    const [documentsA, documentsB] = await Promise.all([
      Promise.all(resultA.citations.map((citation) => dbStore.getDocumentById(citation.documentId, organizationA))),
      Promise.all(resultB.citations.map((citation) => dbStore.getDocumentById(citation.documentId, organizationB))),
    ]);
    const passed =
      resultA.citations.length > 0 &&
      resultB.citations.length > 0 &&
      documentsA.every(Boolean) &&
      documentsB.every(Boolean) &&
      resultA.citations.every((citation) => documentsB.every((document) => document?.id !== citation.documentId)) &&
      resultB.citations.every((citation) => documentsA.every((document) => document?.id !== citation.documentId));

    await dbStore.addAuditLog({
      organizationId: 'all',
      userId: authorization.user.userId,
      userName: authorization.user.name,
      userRole: authorization.user.role,
      action: 'TENANT_ISOLATION_AUDIT',
      details: `Isolation audit for ${organizationA} and ${organizationB}: ${passed ? 'passed' : 'failed'}`,
    });

    return NextResponse.json({
      success: true,
      passed,
      auditedAt: new Date().toISOString(),
      orgA: { id: organizationA, citations: resultA.citations, confidence: resultA.confidence },
      orgB: { id: organizationB, citations: resultB.citations, confidence: resultB.confidence },
    });
  } catch (error) {
    console.error('Tenant isolation audit failed:', error);
    return NextResponse.json({ error: 'Unable to run the tenant isolation audit' }, { status: 500 });
  }
}
