import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import {
  askQuestion,
  compareDocuments,
  deleteDocument,
  getDocument,
  getDocuments,
  getStatus,
  uploadDocument,
} from './services/api';
import { buildReport, cleanText, compareDocumentsLocally } from './utils/documentInsights';

const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'jpg', 'jpeg', 'png'];
const ANALYSIS_OPTIONS = [
  'OCR for scanned docs',
  'Auto-summarization',
  'Named Entity Recognition',
  'Sentiment Analysis',
];

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [notice, setNotice] = useState(null);
  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [options, setOptions] = useState(() =>
    ANALYSIS_OPTIONS.reduce((acc, option) => ({ ...acc, [option]: true }), {})
  );
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
    loadStatus();
  }, []);

  useEffect(() => {
    if (!notice || notice.type === 'error') return undefined;
    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (selectedDocId) {
      loadDocument(selectedDocId);
    } else {
      setSelectedDocument(null);
    }
  }, [selectedDocId]);

  async function loadDocuments(preferredId) {
    try {
      setLoadingDocuments(true);
      const response = await getDocuments();
      const nextDocuments = response.documents || [];
      setDocuments(nextDocuments);
      if (preferredId) {
        setSelectedDocId(preferredId);
      } else if (!selectedDocId && nextDocuments.length > 0) {
        setSelectedDocId(nextDocuments[0]._id);
      } else if (nextDocuments.length === 0) {
        setSelectedDocId(null);
        setSelectedDocument(null);
      }
    } catch (error) {
      setDocuments([]);
      setSelectedDocId(null);
      setSelectedDocument(null);
      showNotice(error.message || 'Failed to load documents.', 'error');
    } finally {
      setLoadingDocuments(false);
    }
  }

  async function loadStatus() {
    try {
      const status = await getStatus();
      setRuntimeStatus(status);
    } catch {
      setRuntimeStatus({ status: 'offline', ai: { provider: 'unknown' }, storage: { mode: 'unknown' } });
    }
  }

  async function loadDocument(id) {
    try {
      setLoadingDocument(true);
      const response = await getDocument(id);
      setSelectedDocument(response.document);
      setCompareResult(null);
      setChatMessages(
        (response.document.chatHistory || [])
          .map((message) => ({
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: message.content || message.message || '',
          }))
          .filter((message) => message.content)
      );
    } catch (error) {
      setSelectedDocument(null);
      showNotice(error.message || 'Failed to load document.', 'error');
    } finally {
      setLoadingDocument(false);
    }
  }

  function stageFiles(fileList) {
    const files = Array.from(fileList || []);
    const accepted = [];
    const rejected = [];

    files.forEach((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (!ACCEPTED_EXTENSIONS.includes(extension)) {
        rejected.push(`${file.name}: unsupported file type`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        rejected.push(`${file.name}: exceeds 10MB limit`);
        return;
      }

      accepted.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        size: file.size,
        status: 'ready',
      });
    });

    if (accepted.length > 0) {
      setStagedFiles((current) => [...accepted, ...current]);
      showNotice(`${accepted.length} file${accepted.length === 1 ? '' : 's'} ready to analyze.`, 'success');
    }

    if (rejected.length > 0) {
      showNotice(rejected.join(' | '), 'error');
    }
  }

  async function analyzeStagedFiles() {
    if (stagedFiles.length === 0 || analyzing) return;
    setAnalyzing(true);
    let lastDocumentId = null;
    let failedCount = 0;

    for (const staged of stagedFiles.filter((item) => item.status !== 'processing')) {
      setStagedFiles((current) =>
        current.map((item) => (item.id === staged.id ? { ...item, error: '', status: 'processing' } : item))
      );
      try {
      const response = await uploadDocument(staged.file);
        lastDocumentId = response.document._id;
        setDocuments((current) => [response.document, ...current.filter((doc) => doc._id !== response.document._id)]);
        setStagedFiles((current) => current.filter((item) => item.id !== staged.id));
      } catch (error) {
        failedCount += 1;
        setStagedFiles((current) =>
          current.map((item) =>
            item.id === staged.id
              ? { ...item, error: error.message || 'Upload failed', status: 'failed' }
              : item
          )
        );
      }
    }

    setAnalyzing(false);
    if (lastDocumentId) {
      setSelectedDocId(lastDocumentId);
      loadDocuments(lastDocumentId);
      loadStatus();
      showNotice('Document analysis completed.', 'success');
    }

    if (failedCount > 0) {
      showNotice(`${failedCount} file${failedCount === 1 ? '' : 's'} failed to upload.`, 'error');
    }
  }

  async function removeDocument(id) {
    const confirmed = window.confirm('Delete this document?');
    if (!confirmed) return;
    try {
      await deleteDocument(id);
      const remainingDocuments = documents.filter((doc) => doc._id !== id);
      setDocuments(remainingDocuments);
      if (selectedDocId === id) {
        setSelectedDocId(remainingDocuments[0]?._id || null);
      }
      loadStatus();
      showNotice('Document deleted.', 'success');
    } catch (error) {
      showNotice(error.message || 'Failed to delete document.', 'error');
    }
  }

  async function handleAskQuestion(question) {
    const value = cleanText(question);
    if (!selectedDocId || !value || chatLoading) return;
    setChatMessages((current) => [...current, { role: 'user', content: value }]);
    setChatLoading(true);
    try {
      const response = await askQuestion(selectedDocId, value);
      setChatMessages((current) => [...current, { role: 'assistant', content: response.answer || 'No answer returned.' }]);
    } catch (error) {
      const message = error.message || 'Failed to answer.';
      setChatMessages((current) => [...current, { role: 'assistant', content: message }]);
      showNotice(message, 'error');
    } finally {
      setChatInput('');
      setChatLoading(false);
    }
  }

  function exportDocument() {
    if (!selectedDocument) return;
    const report = buildReport(selectedDocument);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedDocument.originalName || 'document'}-analysis.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotice('Report exported.', 'success');
  }

  function openCompare() {
    if (!selectedDocId || documents.length < 2) {
      showNotice('Upload at least two documents to compare.', 'error');
      return;
    }
    setCompareOpen(true);
  }

  async function runCompare(targetDocumentId) {
    if (!selectedDocId || documents.length < 2 || comparing) return;
    const other = documents.find((document) => document._id === targetDocumentId)
      || documents.find((document) => document._id !== selectedDocId);
    if (!other) return;

    setComparing(true);
    try {
      const response = await compareDocuments(selectedDocId, other._id);
      setCompareResult({
        ...response.comparison,
        document1: response.document1,
        document2: response.document2,
      });
      setCompareOpen(false);
      showNotice('Comparison ready.', 'success');
    } catch (error) {
      try {
        const [left, right] = await Promise.all([getDocument(selectedDocId), getDocument(other._id)]);
        setCompareResult({
          ...compareDocumentsLocally(left.document, right.document),
          document1: left.document,
          document2: right.document,
        });
        setCompareOpen(false);
        showNotice('Comparison ready using local fallback.', 'success');
      } catch {
        showNotice(error.message || 'Failed to compare documents.', 'error');
      }
    } finally {
      setComparing(false);
    }
  }

  function showNotice(message, type = 'info') {
    setNotice({ message, type });
  }

  return (
    <div className="flex h-screen w-full min-w-0 overflow-hidden bg-[#07090d] font-sans text-white">
      {notice && (
        <div
          className={`fixed right-4 top-4 z-[80] flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[0_18px_55px_rgba(0,0,0,0.32)] backdrop-blur-sm ${
            notice.type === 'error'
              ? 'border-red-400/40 bg-red-950/90 text-red-100'
              : 'border-sky-400/30 bg-[#0f1720]/95 text-gray-100'
          }`}
          role="status"
        >
          <span className="leading-6">{notice.message}</span>
          <button
            type="button"
            className="mt-0.5 rounded-lg p-1 text-current opacity-70 transition hover:bg-white/10 hover:opacity-100"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <Sidebar
        documents={documents}
        selectedDocId={selectedDocId}
        stagedFiles={stagedFiles}
        dragActive={dragActive}
        loading={loadingDocuments}
        analyzing={analyzing}
        options={options}
        fileInputRef={fileInputRef}
        onStageFiles={stageFiles}
        onAnalyze={analyzeStagedFiles}
        onClearStaged={() => setStagedFiles([])}
        onSelectDocument={setSelectedDocId}
        onRemoveDocument={removeDocument}
        onRemoveStaged={(id) => setStagedFiles((current) => current.filter((item) => item.id !== id))}
        onSetDragActive={setDragActive}
        onToggleOption={(option) => setOptions((current) => ({ ...current, [option]: !current[option] }))}
      />
      <Dashboard
        document={selectedDocument}
        documents={documents}
        loadingDocument={loadingDocument}
        searchQuery={searchQuery}
        chatInput={chatInput}
        chatMessages={chatMessages}
        chatLoading={chatLoading}
        compareOpen={compareOpen}
        comparing={comparing}
        compareResult={compareResult}
        runtimeStatus={runtimeStatus}
        onSearchChange={setSearchQuery}
        onAskQuestion={handleAskQuestion}
        onChatInputChange={setChatInput}
        onExport={exportDocument}
        onCompare={openCompare}
        onCompareWith={runCompare}
        onCloseCompare={() => setCompareOpen(false)}
      />
    </div>
  );
}

export default App;
