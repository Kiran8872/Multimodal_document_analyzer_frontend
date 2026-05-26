import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeftRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileSearch,
  FileText,
  HelpCircle,
  Key,
  Layers3,
  Loader2,
  MessageSquareText,
  Search,
  Send,
  Tag,
  TextSearch,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Card from './ui/Card';
import {
  cleanText,
  computeStats,
  getDocumentSize,
  getDocumentText,
  getEntities,
  getKeywordFrequency,
  getKeywords,
  getReadableTitle,
  getReadingTime,
  getSentiment,
  getTopics,
} from '../utils/documentInsights';

const TABS = ['Overview', 'Extracted Text', 'Entities', 'Insights', 'Compare'];

function Dashboard({
  document,
  documents,
  loadingDocument,
  searchQuery,
  chatInput,
  chatMessages,
  chatLoading,
  compareOpen,
  comparing,
  compareResult,
  onSearchChange,
  onAskQuestion,
  onChatInputChange,
  onExport,
  onCompare,
  onCompareWith,
  onCloseCompare,
}) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [assistantOpen, setAssistantOpen] = useState(true);

  if (loadingDocument) {
    return (
      <main className="flex min-w-0 flex-1 items-center justify-center bg-[#07090d] text-slate-400">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-sky-400" />
        Loading document workspace...
      </main>
    );
  }

  if (!document) {
    return (
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#07090d]">
        <header className="flex min-h-[74px] items-center justify-between border-b border-[#1f2937] bg-[#0b0f15] px-4 md:px-6">
          <div>
            <h1 className="text-xl font-semibold text-white">ClarityDocs AI</h1>
            <p className="text-sm text-slate-500">Document intelligence workspace</p>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="max-w-xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/10 text-sky-300">
              <FileSearch className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-white">Start with a document</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Upload or select a file from the library to inspect extracted text, entities, insights, comparisons, and Q&A.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  const text = getDocumentText(document);
  const analysis = document.analysis || {};
  const stats = computeStats(text);
  const keywords = getKeywords(document, 12);
  const topics = getTopics(document);
  const entities = getEntities(document);
  const sentiment = getSentiment(document);
  const keywordData = getKeywordFrequency(document, 10);
  const summary = cleanText(analysis.summary || analysis.detailedSummary || text.slice(0, 520));

  const suggestedQuestions = buildSuggestedQuestions(document, keywords);

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#07090d]">
      <TopBar
        documents={documents}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onCompare={onCompare}
        onExport={onExport}
        onToggleAssistant={() => setAssistantOpen((current) => !current)}
      />

      <div className="flex min-h-0 flex-1">
        <section className="custom-scrollbar-real min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1320px] space-y-5 px-4 py-5 md:px-6">
            <DocumentHeader document={document} text={text} stats={stats} />

            <div className="sticky top-0 z-10 -mx-4 border-y border-[#1f2937] bg-[#07090d]/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6">
              <div className="custom-scrollbar-real flex gap-2 overflow-x-auto">
                {TABS.map((tab) => (
                  <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                    {tab}
                  </TabButton>
                ))}
              </div>
            </div>

            {activeTab === 'Overview' && (
              <OverviewPanel
                document={document}
                summary={summary}
                keywords={keywords}
                keywordData={keywordData}
                stats={stats}
                searchQuery={searchQuery}
              />
            )}

            {activeTab === 'Extracted Text' && (
              <ExtractedTextPanel text={text} searchQuery={searchQuery} />
            )}

            {activeTab === 'Entities' && (
              <EntitiesPanel entities={entities} keywordData={keywordData} />
            )}

            {activeTab === 'Insights' && (
              <InsightsPanel
                analysis={analysis}
                topics={topics}
                sentiment={sentiment}
                suggestedQuestions={suggestedQuestions}
              />
            )}

            {activeTab === 'Compare' && (
              <ComparePanel
                document={document}
                documents={documents}
                comparing={comparing}
                compareResult={compareResult}
                onCompareWith={onCompareWith}
              />
            )}

          </div>
        </section>

        <aside className="hidden min-h-0 w-[370px] flex-shrink-0 border-l border-[#1f2937] bg-[#0b0f15] xl:block 2xl:w-[410px]">
          <AssistantPanel
            chatInput={chatInput}
            chatMessages={chatMessages}
            chatLoading={chatLoading}
            suggestedQuestions={suggestedQuestions}
            text={text}
            onAskQuestion={onAskQuestion}
            onChatInputChange={onChatInputChange}
          />
        </aside>
      </div>

      {assistantOpen && (
        <div className="fixed bottom-0 right-0 top-0 z-40 w-[min(420px,calc(100vw-86px))] border-l border-[#1f2937] bg-[#0b0f15] shadow-[0_0_80px_rgba(0,0,0,0.55)] xl:hidden">
          <AssistantPanel
            chatInput={chatInput}
            chatMessages={chatMessages}
            chatLoading={chatLoading}
            suggestedQuestions={suggestedQuestions}
            text={text}
            onAskQuestion={onAskQuestion}
            onChatInputChange={onChatInputChange}
            onClose={() => setAssistantOpen(false)}
          />
        </div>
      )}

      {compareOpen && (
        <CompareDialog
          currentDocument={document}
          documents={documents}
          comparing={comparing}
          onClose={onCloseCompare}
          onCompare={onCompareWith}
        />
      )}
    </main>
  );
}

function TopBar({ documents, searchQuery, onSearchChange, onCompare, onExport, onToggleAssistant }) {
  return (
    <header className="flex min-h-[64px] items-center border-b border-[#1f2937] bg-[#0b0f15] px-4 py-3 md:px-6">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <div className="flex h-10 min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-[#263142] bg-[#10151d] px-3 text-slate-500 transition focus-within:border-sky-400/70 md:max-w-[420px]">
          <Search className="h-4 w-4" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            placeholder="Search in document..."
          />
        </div>
        <button
          type="button"
          onClick={onToggleAssistant}
          title="Open assistant"
          aria-label="Open assistant"
          className="flex h-10 items-center gap-2 rounded-lg border border-[#263142] bg-[#10151d] px-3 text-sm font-medium text-slate-300 transition hover:border-sky-400/60 hover:text-white xl:hidden"
        >
          <Bot className="h-4 w-4 text-sky-400" />
          <span className="hidden sm:inline">Assistant</span>
        </button>
        {documents.length >= 2 && (
          <IconButton label="Compare documents" onClick={onCompare}>
            <ArrowLeftRight className="h-4 w-4" />
          </IconButton>
        )}
        <IconButton label="Download report" onClick={onExport}>
          <Download className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  );
}

function DocumentHeader({ document, text, stats }) {
  const details = [
    ['Type', String(document.fileType || 'doc').toUpperCase()],
    ['Size', getDocumentSize(document)],
    ['Pages', document.pageCount || 1],
    ['Reading', getReadingTime(text)],
    ['Words', Number(stats.words).toLocaleString()],
  ];

  return (
    <Card noPadding>
      <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-sky-300">
            <FileText className="h-4 w-4" />
            Active document
          </div>
          <h2 className="truncate text-2xl font-semibold text-white">{document.originalName || getReadableTitle(document)}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {cleanText(document.analysis?.title || document.analysis?.documentType || 'Ready for inspection')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5 xl:min-w-[520px]">
          {details.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[#1f2937] bg-[#0b0f15] px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</div>
              <div className="mt-1 truncate font-mono text-sm font-semibold text-slate-100">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function OverviewPanel({ document, summary, keywords, keywordData, stats, searchQuery }) {
  const points = (document.analysis?.keyPoints || []).slice(0, 6);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <div className="space-y-5">
        <Panel title="Summary" icon={FileSearch}>
          <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
            {summary ? renderHighlightedText(summary, searchQuery) : 'No summary available.'}
          </p>
        </Panel>

        <Panel title="Key Points" icon={CheckCircle2}>
          <div className="space-y-3">
            {points.length ? points.map((point, index) => (
              <div key={index} className="flex gap-3 rounded-lg border border-[#1f2937] bg-[#0b0f15] p-3 text-sm leading-6 text-slate-300">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-400/10 text-xs font-semibold text-sky-300">{index + 1}</span>
                <span>{cleanText(point)}</span>
              </div>
            )) : <EmptyLine>No key points detected.</EmptyLine>}
          </div>
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel title="Document Signals" icon={BarChart3}>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Words" value={stats.words} />
            <Metric label="Characters" value={stats.characters} />
            <Metric label="Sentences" value={stats.sentences} />
            <Metric label="Paragraphs" value={stats.paragraphs} />
          </div>
        </Panel>

        <Panel title="Keyword Frequency" icon={Key}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={keywordData}>
              <CartesianGrid stroke="#1f2937" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} angle={-22} textAnchor="end" height={58} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: 'rgba(14,165,233,0.08)' }}
                contentStyle={{ background: '#10151d', border: '1px solid #263142', borderRadius: 8, color: '#fff' }}
              />
              <Bar dataKey="value" fill="#38bdf8" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <PillCloud items={keywords} />
        </Panel>
      </div>
    </div>
  );
}

function ExtractedTextPanel({ text, searchQuery }) {
  return (
    <Panel title="Extracted Text" icon={TextSearch} className="min-h-[560px]">
      <div className="custom-scrollbar-real max-h-[68vh] overflow-y-auto rounded-lg border border-[#1f2937] bg-[#090d13] p-5">
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-300">
          {text ? renderHighlightedText(text, searchQuery) : 'No extracted text available.'}
        </pre>
      </div>
    </Panel>
  );
}

function EntitiesPanel({ entities, keywordData }) {
  const counts = entities.reduce((acc, entity) => {
    acc[entity.type] = (acc[entity.type] || 0) + 1;
    return acc;
  }, {});
  const max = Math.max(...Object.values(counts), 1);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Panel title="Detected Entities" icon={Tag}>
        <div className="overflow-hidden rounded-lg border border-[#1f2937]">
          <div className="grid grid-cols-[1fr_140px] bg-[#0b0f15] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <span>Value</span>
            <span>Type</span>
          </div>
          {entities.length ? entities.map((entity, index) => (
            <div key={`${entity.type}-${entity.value}-${index}`} className="grid grid-cols-[1fr_140px] border-t border-[#1f2937] px-4 py-3 text-sm">
              <span className="truncate text-slate-200">{entity.value}</span>
              <span className="text-sky-300">{entity.type}</span>
            </div>
          )) : <div className="border-t border-[#1f2937] px-4 py-6 text-sm text-slate-500">No entities detected.</div>}
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel title="Entity Distribution" icon={BarChart3}>
          <div className="space-y-4">
            {Object.entries(counts).length ? Object.entries(counts).map(([label, value]) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-sm text-slate-400">
                  <span>{label}</span>
                  <span className="font-mono">{value}</span>
                </div>
                <div className="h-2 rounded-full bg-[#1f2937]">
                  <div className="h-2 rounded-full bg-sky-400" style={{ width: `${(value / max) * 100}%` }} />
                </div>
              </div>
            )) : <EmptyLine>No entity distribution yet.</EmptyLine>}
          </div>
        </Panel>

        <Panel title="Top Terms" icon={Key}>
          <PillCloud items={keywordData.map((item) => item.label)} />
        </Panel>
      </div>
    </div>
  );
}

function InsightsPanel({ analysis, topics, sentiment, suggestedQuestions }) {
  const actionItems = (analysis.actionItems || []).slice(0, 5);

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Panel title="Topics" icon={Layers3}>
        <PillCloud items={topics} />
      </Panel>

      <Panel title="Sentiment" icon={MessageSquareText}>
        <div className="text-2xl font-semibold text-white">{sentiment.label}</div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#1f2937]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(4, sentiment.score)}%` }}
            transition={{ duration: 0.7 }}
            className="h-full rounded-full bg-sky-400"
          />
        </div>
        <div className="mt-3 font-mono text-sm text-slate-500">{sentiment.score}% confidence signal</div>
      </Panel>

      <Panel title="Suggested Questions" icon={HelpCircle}>
        <div className="space-y-2">
          {suggestedQuestions.map((question) => (
            <div key={question} className="rounded-lg border border-[#1f2937] bg-[#0b0f15] p-3 text-sm text-slate-300">
              {question}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Action Items" icon={CheckCircle2} className="xl:col-span-3">
        <div className="grid gap-3 md:grid-cols-2">
          {actionItems.length ? actionItems.map((item, index) => (
            <div key={index} className="rounded-lg border border-[#1f2937] bg-[#0b0f15] p-3 text-sm text-slate-300">
              {cleanText(item)}
            </div>
          )) : <EmptyLine>No action items detected.</EmptyLine>}
        </div>
      </Panel>
    </div>
  );
}

function ComparePanel({ document, documents, comparing, compareResult, onCompareWith }) {
  const candidates = documents.filter((item) => item._id !== document?._id);

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel title="Choose Document" icon={ArrowLeftRight}>
        <div className="space-y-2">
          {candidates.length ? candidates.map((candidate) => (
            <button
              key={candidate._id}
              type="button"
              disabled={comparing}
              onClick={() => onCompareWith(candidate._id)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#1f2937] bg-[#0b0f15] p-3 text-left transition hover:border-sky-400/60 disabled:cursor-wait disabled:opacity-60"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-100">{candidate.originalName}</div>
                <div className="mt-1 text-xs text-slate-500">{String(candidate.fileType || 'doc').toUpperCase()} / {candidate.fileSize}</div>
              </div>
              {comparing ? <Loader2 className="h-4 w-4 animate-spin text-sky-400" /> : <ArrowLeftRight className="h-4 w-4 text-sky-400" />}
            </button>
          )) : <EmptyLine>Upload another document to compare.</EmptyLine>}
        </div>
      </Panel>

      <Panel title="Comparison Result" icon={FileSearch}>
        {compareResult ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-[#1f2937] bg-[#0b0f15] p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Summary</div>
              <div className="mt-2 text-sm leading-6 text-slate-200">{compareResult.comparisonSummary || 'Comparison complete.'}</div>
            </div>
            <ResultColumn title="Similarities" items={compareResult.similarities || []} />
            <ResultColumn title="Differences" items={compareResult.differences || []} />
            {compareResult.recommendation && (
              <div className="rounded-lg border border-[#1f2937] bg-[#0b0f15] p-4 text-sm leading-6 text-slate-300">
                <span className="font-semibold text-white">Recommendation: </span>{compareResult.recommendation}
              </div>
            )}
          </div>
        ) : (
          <EmptyLine>Select a document on the left to generate a comparison.</EmptyLine>
        )}
      </Panel>
    </div>
  );
}

function AssistantPanel({ chatInput, chatMessages, chatLoading, suggestedQuestions, text, onAskQuestion, onChatInputChange, onClose }) {
  return (
    <div className="flex h-full min-h-[520px] flex-col">
      <div className="border-b border-[#1f2937] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-300">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Ask this document</h2>
              <p className="text-xs text-slate-500">Answers use extracted text when AI is unavailable.</p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {suggestedQuestions.slice(0, 3).map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onAskQuestion(question)}
              className="rounded-full border border-[#263142] bg-[#10151d] px-3 py-1.5 text-xs text-slate-300 transition hover:border-sky-400/60 hover:text-white"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="custom-scrollbar-real flex-1 space-y-3 overflow-y-auto p-4">
        {chatMessages.length ? chatMessages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-lg border px-3 py-2 text-sm leading-6 ${
              message.role === 'user'
                ? 'border-sky-400/30 bg-sky-400/10 text-sky-50'
                : 'border-[#263142] bg-[#10151d] text-slate-300'
            }`}
            >
              {message.content}
              {message.role !== 'user' && (
                <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                  <Copy className="h-3 w-3" />
                  Source: extracted text, {Math.min(text.length, 10000).toLocaleString()} chars scanned
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="rounded-lg border border-dashed border-[#263142] bg-[#10151d]/60 p-4 text-sm leading-6 text-slate-500">
            Ask for a summary, dates, amounts, responsibilities, contradictions, or anything buried in the text.
          </div>
        )}
      </div>

      <form
        className="border-t border-[#1f2937] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          onAskQuestion(chatInput);
        }}
      >
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(event) => onChatInputChange(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-[#263142] bg-[#10151d] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400/70"
            placeholder="Ask a question..."
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || chatLoading}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Ask question"
          >
            {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

function CompareDialog({ currentDocument, documents, comparing, onClose, onCompare }) {
  const candidates = documents.filter((item) => item._id !== currentDocument?._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-[#263142] bg-[#10151d] shadow-[0_28px_80px_rgba(0,0,0,0.52)]">
        <div className="flex items-center justify-between border-b border-[#1f2937] px-5 py-4">
          <div>
            <h2 className="font-semibold text-white">Compare Documents</h2>
            <p className="mt-1 text-sm text-slate-500">Choose a saved document to compare with the current file.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white" aria-label="Close compare dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="custom-scrollbar-real max-h-[420px] space-y-3 overflow-y-auto p-4">
          {candidates.map((candidate) => (
            <button
              key={candidate._id}
              type="button"
              disabled={comparing}
              onClick={() => onCompare(candidate._id)}
              className="flex w-full items-center justify-between gap-4 rounded-lg border border-[#1f2937] bg-[#0b0f15] p-4 text-left transition hover:border-sky-400/60 disabled:cursor-wait disabled:opacity-70"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-100">{candidate.originalName}</div>
                <div className="mt-1 text-sm text-slate-500">{String(candidate.fileType || 'doc').toUpperCase()} / {candidate.fileSize}</div>
              </div>
              {comparing ? <Loader2 className="h-5 w-5 animate-spin text-sky-400" /> : <ArrowLeftRight className="h-5 w-5 text-sky-400" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children, className = '' }) {
  return (
    <Card noPadding className={className}>
      <div className="flex h-12 items-center gap-3 border-b border-[#1f2937] px-4">
        <Icon className="h-4 w-4 text-sky-400" />
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? 'bg-sky-400 text-slate-950' : 'text-slate-400 hover:bg-[#10151d] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function IconButton({ label, children, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#263142] bg-[#10151d] text-slate-300 transition hover:border-sky-400/60 hover:text-white"
    >
      {children}
    </button>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-[#1f2937] bg-[#0b0f15] p-3">
      <div className="font-mono text-xl font-semibold text-sky-300">{Number(value).toLocaleString()}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</div>
    </div>
  );
}

function PillCloud({ items }) {
  if (!items.length) return <EmptyLine>No data available.</EmptyLine>;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-[#263142] bg-[#0b0f15] px-3 py-1.5 text-xs font-medium text-slate-300">
          {item}
        </span>
      ))}
    </div>
  );
}

function ResultColumn({ title, items }) {
  return (
    <div>
      <h3 className="font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length ? items.map((item, index) => (
          <div key={index} className="rounded-lg border border-[#1f2937] bg-[#0b0f15] p-3 text-sm leading-6 text-slate-300">
            {item}
          </div>
        )) : <EmptyLine>No items found.</EmptyLine>}
      </div>
    </div>
  );
}

function EmptyLine({ children }) {
  return <div className="rounded-lg border border-dashed border-[#263142] bg-[#0b0f15] p-4 text-sm text-slate-500">{children}</div>;
}

function buildSuggestedQuestions(document, keywords) {
  const possible = (document?.analysis?.possibleQuestions || [])
    .map((item) => cleanText(item))
    .filter(Boolean);

  const fallback = [
    'Summarize this document.',
    'What dates or amounts are mentioned?',
    keywords[0] ? `What does this say about ${keywords[0]}?` : 'What are the main points?',
    'List any action items.',
  ];

  return [...possible, ...fallback]
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, 5);
}

function renderHighlightedText(text, query) {
  const value = String(text || '');
  const trimmed = cleanText(query);
  if (!trimmed) return value;

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value.split(new RegExp(`(${escaped})`, 'gi')).map((part, index) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark key={index} className="rounded bg-sky-400/20 px-1 py-0.5 text-sky-50">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

export default Dashboard;
