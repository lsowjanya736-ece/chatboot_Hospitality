import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { processRagQuery } from '@/lib/rag/ragEngine';
import { authorizeRequest } from '@/lib/auth/authorization';

export async function POST(req: NextRequest) {
  try {
    const authorization = await authorizeRequest(req, ['patient']);
    if (!authorization.authorized) {
      return authorization.response;
    }
    const { user } = authorization;
    const body = await req.json();
    const { conversationId } = body;
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message || message.length > 5_000) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const verifiedOrgId = user.organizationId;
    const userId = user.userId;
    const userName = user.name;
    const org = await dbStore.getOrganizationById(verifiedOrgId);
    if (!org || !org.activeStatus) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // 1. Get or create conversation session
    let convId = conversationId;
    if (typeof convId !== 'string' || !convId) {
      const title = message.length > 40 ? message.substring(0, 40) + '...' : message;
      const newConv = await dbStore.createConversation({
        organizationId: verifiedOrgId,
        userId,
        userName,
        title,
        status: 'active',
        lastMessageSnippet: message,
      });
      convId = newConv.id;
    } else {
      const conversation = await dbStore.getConversationById(convId, verifiedOrgId);
      if (!conversation || conversation.userId !== userId) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    }

    // 2. Persist user message
    await dbStore.addMessage({
      conversationId: convId,
      organizationId: verifiedOrgId,
      senderRole: 'patient',
      senderName: userName,
      content: message,
    });

    // 3. Process RAG query with strict tenant knowledge isolation
    const ragResult = await processRagQuery(message, verifiedOrgId);

    // 4. Handle automatic or requested ticket escalation if low confidence / unresolved
    let createdTicketId: string | undefined;
    if (ragResult.suggestTicketCreation) {
      const newTicket = await dbStore.createTicket({
        organizationId: verifiedOrgId,
        organizationName: org.name,
        userId,
        userName,
        userEmail: user.email,
        subject: `Unresolved Inquiry: ${message.substring(0, 50)}...`,
        description: `Automated escalation from AI Chatbot: The patient inquired regarding: "${message}". The AI could not find verified approved policy documents (Confidence: ${ragResult.confidence}). A human support agent is requested to intervene.`,
        category: 'General Inquiry',
        priority: 'medium',
        status: 'open',
        sourceConversationId: convId,
        unresolvedAiQuery: message,
      });

      createdTicketId = newTicket.id;

      // Update conversation status
      const conv = await dbStore.getConversationById(convId, verifiedOrgId);
      if (conv) {
        await dbStore.updateConversation(convId, { status: 'escalated' }, verifiedOrgId);
      }

      // Append notice to the answer
      ragResult.answer += `\n\n📌 **Support Ticket Created:** #**${newTicket.id}** has been automatically logged and routed to our support team for review. You can track this in your **Ticket Tracking** portal.`;
    }

    // 5. Persist assistant response
    const assistantMsg = await dbStore.addMessage({
      conversationId: convId,
      organizationId: verifiedOrgId,
      senderRole: 'assistant',
      senderName: 'Healthcare AI Support',
      content: ragResult.answer,
      citations: ragResult.citations,
      confidence: ragResult.confidence,
      isFallback: ragResult.isFallback,
      isDemoSample: ragResult.isDemoSample,
      isEmergencyAlert: ragResult.isEmergencyAlert,
      escalatedToTicketId: createdTicketId,
    });

    return NextResponse.json({
      success: true,
      conversationId: convId,
      message: assistantMsg,
      ragResult,
      createdTicketId,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process the support message. Please try again.' },
      { status: 500 }
    );
  }
}
