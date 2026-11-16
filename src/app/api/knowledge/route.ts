import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { authorizeRequest } from '@/lib/auth/authorization';
import { chunkDocument } from '@/lib/rag/chunker';
import {
  DocumentExtractionError,
  documentUploadLimits,
  extractDocumentText,
} from '@/lib/documents/extractText';
import type { KnowledgeDocument } from '@/lib/db/types';

const documentCategories: KnowledgeDocument['category'][] = [
  'visiting_hours',
  'admissions',
  'appointments',
  'billing_insurance',
  'diagnostics',
  'telehealth',
  'general_policy',
];

export async function GET(req: NextRequest) {
  const authorization = await authorizeRequest(req, ['super_admin', 'hospital_admin']);
  if (!authorization.authorized) {
    return authorization.response;
  }
  const { user } = authorization;
  const requestedOrg = req.nextUrl.searchParams.get('organizationId');
  const orgId = user.role === 'super_admin' ? requestedOrg || 'all' : user.organizationId;
  const docs = await dbStore.getDocuments(orgId);
  return NextResponse.json({ success: true, documents: docs });
}

export async function POST(req: NextRequest) {
  const authorization = await authorizeRequest(req, ['hospital_admin', 'super_admin']);
  if (!authorization.authorized) {
    return authorization.response;
  }
  const { user } = authorization;

  const contentLength = Number(req.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > documentUploadLimits.maxFileBytes + 64 * 1024) {
    return NextResponse.json({ error: 'Document exceeds the 5 MB upload limit' }, { status: 413 });
  }

  let title = '';
  let category: KnowledgeDocument['category'] = 'general_policy';
  let rawContent = '';
  let filename = '';
  let fileType: KnowledgeDocument['fileType'] = 'txt';
  let fileSizeBytes = 0;
  let requestedOrg = '';

  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      title = typeof form.get('title') === 'string' ? String(form.get('title')).trim() : '';
      category = documentCategories.includes(form.get('category') as KnowledgeDocument['category'])
        ? form.get('category') as KnowledgeDocument['category']
        : 'general_policy';
      requestedOrg = typeof form.get('organizationId') === 'string' ? String(form.get('organizationId')) : '';
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Choose a PDF, DOCX, or TXT document' }, { status: 400 });
      }

      const extracted = await extractDocumentText(file);
      rawContent = extracted.content;
      fileType = extracted.fileType;
      filename = file.name.trim();
      fileSizeBytes = file.size;
    } else {
      const body = await req.json();
      title = typeof body.title === 'string' ? body.title.trim() : '';
      rawContent = typeof body.rawContent === 'string' ? body.rawContent.trim() : '';
      filename = typeof body.filename === 'string' ? body.filename.trim() : '';
      requestedOrg = typeof body.organizationId === 'string' ? body.organizationId : '';
      category = documentCategories.includes(body.category) ? body.category : 'general_policy';
      const requestedFileType = body.fileType;
      fileType = ['pdf', 'txt', 'md', 'doc', 'docx'].includes(requestedFileType) ? requestedFileType : 'txt';
      fileSizeBytes = Buffer.byteLength(rawContent, 'utf8');
      if (fileSizeBytes > documentUploadLimits.maxFileBytes) {
        return NextResponse.json({ error: 'Document exceeds the 5 MB upload limit' }, { status: 413 });
      }
    }

    if (!title || title.length > 200 || !rawContent) {
      return NextResponse.json({ error: 'A title and readable document content are required' }, { status: 400 });
    }
    if (rawContent.length > documentUploadLimits.maxExtractedCharacters) {
      return NextResponse.json({ error: 'Extracted document text exceeds the 2 MB limit' }, { status: 413 });
    }

    const orgId = user.role === 'super_admin' ? requestedOrg : user.organizationId;
    if (!orgId || (user.role !== 'super_admin' && requestedOrg && requestedOrg !== user.organizationId)) {
      return NextResponse.json({ error: 'Invalid organization' }, { status: 403 });
    }
    const org = await dbStore.getOrganizationById(orgId);
    if (!org || !org.activeStatus) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const tempDocId = `doc_${Date.now()}`;
    const chunks = chunkDocument(tempDocId, title, rawContent, { chunkSize: 400, overlap: 60 });
    const newDoc = await dbStore.createDocument({
      organizationId: orgId,
      title,
      category,
      filename: filename || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.${fileType}`,
      fileType,
      fileSizeKb: Math.ceil(fileSizeBytes / 1024),
      uploadedBy: user.userId,
      uploaderName: user.name,
      status: 'indexed',
      chunkCount: chunks.length,
      rawContent,
      chunks,
    });

    await dbStore.addAuditLog({
      organizationId: orgId,
      userId: user.userId,
      userName: user.name,
      userRole: user.role,
      action: 'KNOWLEDGE_DOC_UPLOAD',
      details: `Uploaded and indexed "${title}" with ${chunks.length} chunks.`,
    });

    return NextResponse.json({ success: true, document: newDoc }, { status: 201 });
  } catch (error) {
    if (error instanceof DocumentExtractionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Knowledge document upload failed:', error);
    return NextResponse.json({ error: 'Failed to extract and index the document' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authorization = await authorizeRequest(req, ['hospital_admin', 'super_admin']);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Document id is required' }, { status: 400 });
    }

    const orgId = authorization.user.role === 'super_admin'
      ? searchParams.get('organizationId') || 'all'
      : authorization.user.organizationId;
    const deleted = await dbStore.deleteDocument(id, orgId);

    if (!deleted) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    await dbStore.addAuditLog({
      organizationId: orgId,
      userId: authorization.user.userId,
      userName: authorization.user.name,
      userRole: authorization.user.role,
      action: 'KNOWLEDGE_DOC_DELETE',
      details: `Deleted document ID ${id}`,
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete document', details: String(error) }, { status: 500 });
  }
}
