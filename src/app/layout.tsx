import type { Metadata } from 'next';

import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { EmergencyBanner } from '@/components/EmergencyBanner';



export const metadata: Metadata = {
  title: 'AI-Powered Multi-Tenant Healthcare Support Agent',
  description:
    'Administrative and service support agent for hospitals, clinics, and telehealth networks with grounded RAG, tenant isolation, and human ticket escalation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          <EmergencyBanner />
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
