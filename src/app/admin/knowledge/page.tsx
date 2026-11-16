'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Citation, KnowledgeDocument } from '@/lib/db/types';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  CheckCircle2,
  Sparkles,
  Layers,
  X,
  FileCode,
} from 'lucide-react';

export default function KnowledgeBasePage() {
  const { currentOrg } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [searchSandboxQuery, setSearchSandboxQuery] = useState<string>('');
  const [sandboxResults, setSandboxResults] = useState<Citation[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [documentsError, setDocumentsError] = useState('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // New Document Upload State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<KnowledgeDocument['category']>('visiting_hours');
  const [newContent, setNewContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocs = async () => {
    if (!currentOrg) return;
    try {
      const res = await fetch(`/api/knowledge?organizationId=${currentOrg.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load knowledge documents');
      setDocuments(data.documents || []);
      setDocumentsError('');
    } catch (error) {
      console.error('Knowledge document request failed:', error);
      setDocumentsError(error instanceof Error ? error.message : 'Unable to load knowledge documents');
    }
  };

  useEffect(() => {
    if (!currentOrg) return;
    const organizationId = currentOrg.id;
    let active = true;
    async function loadDocuments() {
      try {
        const response = await fetch(`/api/knowledge?organizationId=${organizationId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load knowledge documents');
        if (active) {
          setDocuments(data.documents || []);
          setDocumentsError('');
        }
      } catch (error) {
        console.error('Knowledge document request failed:', error);
        if (active) {
          setDocumentsError(error instanceof Error ? error.message : 'Unable to load knowledge documents');
        }
      }
    }
    void loadDocuments();
    return () => {
      active = false;
    };
  }, [currentOrg]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || (!newContent.trim() && !uploadFile) || !currentOrg) return;

    setIsUploading(true);
    setUploadError('');
    try {
      let body: BodyInit;
      const headers = uploadFile ? undefined : { 'Content-Type': 'application/json' };
      if (uploadFile) {
        const formData = new FormData();
        formData.set('title', newTitle.trim());
        formData.set('category', newCategory);
        formData.set('organizationId', currentOrg.id);
        formData.set('file', uploadFile);
        body = formData;
      } else {
        body = JSON.stringify({
          title: newTitle,
          category: newCategory,
          rawContent: newContent,
          organizationId: currentOrg.id,
          filename: `${newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.txt`,
          fileType: 'txt',
        });
      }
      const response = await fetch('/api/knowledge', { method: 'POST', headers, body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to upload the document');
      setShowUploadModal(false);
      setNewTitle('');
      setNewContent('');
      setUploadFile(null);
      await fetchDocs();
    } catch (error) {
      console.error('Knowledge document upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Unable to upload the document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document from the knowledge base?')) return;
    try {
      const res = await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDocs();
        if (selectedDoc?.id === id) setSelectedDoc(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSandboxQuery.trim() || !currentOrg) return;

    setIsSearching(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: searchSandboxQuery,
          organizationId: currentOrg.id,
        }),
      });
      const data = await res.json();
      if (data.ragResult) {
        setSandboxResults(data.ragResult.citations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex bg-slate-100 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Knowledge Base & RAG Indexing</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Approved Organization Documents
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload, inspect chunks, and manage verified documents partitioned strictly for {currentOrg?.name}
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Approved Document
          </button>
        </div>

        {/* Semantic Search Sandbox Tool */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              RAG Retrieval Verification Sandbox
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Test vector retrieval quality and similarity scoring against {currentOrg?.name}&apos;s indexed chunks:
          </p>

          <form onSubmit={handleSearchSandbox} className="flex gap-2">
            <input
              type="text"
              value={searchSandboxQuery}
              onChange={(e) => setSearchSandboxQuery(e.target.value)}
              placeholder="e.g. ICU visiting hours, MRI metal restrictions, or TPA cashless timeline..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all"
            >
              {isSearching ? 'Scoring...' : 'Test Retrieval'}
            </button>
          </form>

          {documentsError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{documentsError}</p>}
          {documents.length === 0 && !documentsError && (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No approved documents are indexed for this organization yet.
            </p>
          )}

          {sandboxResults.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Retrieved Chunks & Confidence:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sandboxResults.map((res, rIdx) => (
                  <div key={rIdx} className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-900">{res.sectionTitle}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {Math.round(res.confidenceScore * 100)}% Match
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{res.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Indexed Healthcare Documents</h3>
            <span className="text-xs font-semibold text-slate-500">
              {documents.length} verified documents
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Document Title</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Chunks</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Uploaded</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Upload a PDF, DOCX, or TXT policy to start your knowledge base.</td></tr>
                ) : documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="line-clamp-1">{doc.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {doc.filename} • {doc.fileSizeKb} KB
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {doc.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                      {doc.chunkCount || doc.chunks?.length || 0} chunks
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Indexed
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Chunks
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Chunk Inspector Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-600 text-white rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1">{selectedDoc.title}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedDoc.chunks?.length || 0} Vectorized Chunks with Overlap & Semantic Tags
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedDoc.chunks?.map((chunk, idx) => (
                <div key={chunk.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-teal-800">
                      Chunk #{idx + 1}: {chunk.sectionTitle}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {chunk.id}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-mono">
                    {chunk.content}
                  </p>
                  {chunk.tags && chunk.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {chunk.tags.map((t, tIdx) => (
                        <span key={tIdx} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Upload Knowledge Document</h3>
                  <p className="text-xs text-slate-500">Add verified policy for {currentOrg?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              {uploadError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{uploadError}</p>}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. ICU Visiting Hours & Sanitization Protocols"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as KnowledgeDocument['category'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="visiting_hours">Visiting Hours & Ward Regulations</option>
                  <option value="admissions">Admission & Registration Procedures</option>
                  <option value="appointments">Outpatient (OPD) Scheduling</option>
                  <option value="billing_insurance">Cashless Insurance & Billing</option>
                  <option value="diagnostics">Radiology & Pathology Instructions</option>
                  <option value="telehealth">Telehealth Services</option>
                  <option value="general_policy">General Administrative Policy</option>
                </select>
              </div>

              <div>
                <label htmlFor="knowledge-file" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Upload document
                </label>
                <input
                  id="knowledge-file"
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={(event) => {
                    setUploadFile(event.target.files?.[0] || null);
                    setUploadError('');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
                <p className="mt-1 text-[11px] text-slate-500">PDF, DOCX, or UTF-8 TXT. Maximum 5 MB; text is indexed in this organization only.</p>
                {uploadFile && <p className="mt-2 text-xs font-medium text-teal-800">Selected: {uploadFile.name}</p>}
                <div className="mt-4">
                  <label htmlFor="knowledge-raw-text" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Or paste document text
                  </label>
                  <textarea
                    id="knowledge-raw-text"
                    rows={5}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    disabled={Boolean(uploadFile)}
                    placeholder="Paste verified administrative guidelines, clauses, and timings..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (!uploadFile && !newContent.trim()) || !newTitle.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  {isUploading ? 'Chunking & Vectorizing...' : 'Upload & Generate Chunks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
