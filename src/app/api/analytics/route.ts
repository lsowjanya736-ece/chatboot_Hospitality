import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { authorizeRequest } from '@/lib/auth/authorization';

export async function GET(req: NextRequest) {
  const authorization = await authorizeRequest(req, ['super_admin', 'hospital_admin']);
  if (!authorization.authorized) {
    return authorization.response;
  }
  const { user } = authorization;
  const requestedOrg = req.nextUrl.searchParams.get('organizationId');
  const orgId = user.role === 'super_admin'
    ? requestedOrg || 'all'
    : user.organizationId;

  const analytics = await dbStore.getAnalytics(orgId);
  const auditLogs = await dbStore.getAuditLogs(orgId);
  const platformMetrics = user.role === 'super_admin' && orgId === 'all'
    ? await (async () => {
        const [organizations, users, tickets, conversations, documents] = await Promise.all([
          dbStore.getOrganizations(),
          dbStore.getUsers('all'),
          dbStore.getTickets('all'),
          dbStore.getConversations('all'),
          dbStore.getDocuments('all'),
        ]);
        const activeOrganizations = organizations.filter((organization) => organization.activeStatus);
        return {
          totalTenants: organizations.length,
          activeTenants: activeOrganizations.length,
          totalUsers: users.length,
          totalTickets: tickets.length,
          totalConversations: conversations.length,
          totalKnowledgeChunks: documents.reduce((total, document) => total + document.chunkCount, 0),
          averageSlaHours: activeOrganizations.length > 0
            ? Number((activeOrganizations.reduce((total, organization) => total + organization.slaHours, 0) / activeOrganizations.length).toFixed(1))
            : 0,
        };
      })()
    : undefined;

  return NextResponse.json({
    success: true,
    analytics,
    auditLogs: auditLogs.slice(0, 10),
    platformMetrics,
  });
}
