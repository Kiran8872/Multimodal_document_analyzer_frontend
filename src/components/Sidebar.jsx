import { motion } from 'motion/react';
import {
  Check,
  CloudUpload,
  FileText,
  Layers3,
  Loader2,
  SlidersHorizontal,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { formatBytes, getDocumentSize } from '../utils/documentInsights';

const OPTIONS = [
  'OCR for scanned docs',
  'Auto-summarization',
  'Named Entity Recognition',
  'Sentiment Analysis',
];

function Sidebar({
  documents,
  selectedDocId,
  stagedFiles,
  dragActive,
  loading,
  analyzing,
  options,
  fileInputRef,
  onStageFiles,
  onAnalyze,
  onClearStaged,
  onSelectDocument,
  onRemoveDocument,
  onRemoveStaged,
  onSetDragActive,
  onToggleOption,
}) {
  const readyCount = stagedFiles.filter((file) => file.status !== 'processing').length;

  function handleDrop(event) {
    event.preventDefault();
    onSetDragActive(false);
    onStageFiles(event.dataTransfer.files);
  }

  return (
    <aside
      className="flex h-screen w-[78px] flex-shrink-0 flex-col border-r border-[#1f2937] bg-[#0b0f15] md:w-[282px] xl:w-[316px]"
    >
      <div className="flex h-[74px] items-center justify-center gap-3 border-b border-[#1f2937] px-2 md:justify-start md:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/10 text-sky-300 shadow-[0_0_18px_rgba(14,165,233,0.12)]">
            <Layers3 className="h-5 w-5" />
          </div>
          <div className="hidden min-w-0 md:block">
            <div className="truncate text-lg font-bold tracking-tight text-white">ClarityDocs AI</div>
            <div className="text-xs text-slate-500">Document intelligence workspace</div>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar-real flex-1 overflow-y-auto px-2 py-5 md:px-3 xl:px-3.5">
        <SectionLabel icon={Upload}>Upload Document</SectionLabel>

        <label
          className={`group mt-4 flex h-[64px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-[#0f1720]/70 px-2 text-center transition-all duration-200 md:h-[154px] ${
            dragActive
              ? 'scale-[1.01] border-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.16)]'
              : 'border-[#263142] hover:scale-[1.01] hover:border-sky-400/70'
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            onSetDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            onSetDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            onSetDragActive(false);
          }}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(event) => onStageFiles(event.target.files)}
          />
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-300 md:h-12 md:w-12"
          >
            <CloudUpload className="h-6 w-6 md:h-7 md:w-7 xl:h-8 xl:w-8" />
          </motion.div>
          <p className="mt-4 hidden text-sm font-semibold text-white md:block xl:mt-5 xl:text-base">Drag & drop files here</p>
          <p className="mt-2 hidden text-sm text-gray-500 md:block">or click to browse</p>
          <p className="mt-4 hidden text-xs uppercase tracking-wider text-gray-500 md:block">PDF, DOCX, TXT, PNG, JPG</p>
        </label>

        <div className="mt-4 space-y-2">
          {stagedFiles.map((item) => (
            <FileItem
              key={item.id}
              active={false}
              name={item.name}
              size={formatBytes(item.size)}
              status={item.status}
              error={item.error}
              onRemove={() => onRemoveStaged(item.id)}
            />
          ))}

          {loading ? (
            <div className="rounded-lg border border-[#1f2937] bg-[#10151d] p-3 text-sm text-slate-400">
              Loading documents...
            </div>
          ) : documents.length === 0 && stagedFiles.length === 0 ? (
            <div className="rounded-lg border border-[#1f2937] bg-[#10151d] p-3 text-sm text-slate-500">
              No files yet.
            </div>
          ) : (
            documents.map((document) => (
              <FileItem
                key={document._id}
                active={document._id === selectedDocId}
                name={document.originalName}
                size={getDocumentSize(document)}
                onSelect={() => onSelectDocument(document._id)}
                onRemove={() => onRemoveDocument(document._id, document.originalName)}
              />
            ))
          )}
        </div>

        <div className="mt-6 hidden border-t border-[#1f2937] pt-5 md:block">
          <SectionLabel icon={SlidersHorizontal}>Analysis Options</SectionLabel>
          <div className="mt-4 space-y-3">
            {OPTIONS.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={options[option]}
                  onChange={() => onToggleOption(option)}
                />
                <motion.span
                  animate={{
                    backgroundColor: options[option] ? '#0ea5e9' : '#10151d',
                    borderColor: options[option] ? '#38bdf8' : '#334155',
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded-md border shadow-[0_0_8px_rgba(14,165,233,0.12)]"
                >
                  {options[option] && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </motion.span>
                {option}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-[#1f2937] px-2 py-4 md:px-3 xl:px-3.5">
        <button
          type="button"
          disabled={readyCount === 0 || analyzing}
          onClick={onAnalyze}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 text-sm font-semibold text-slate-950 shadow-[0_0_18px_rgba(14,165,233,0.18)] transition-all duration-200 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          <span className="hidden md:inline">Analyze Document</span>
        </button>
        <button
          type="button"
          disabled={stagedFiles.length === 0 || analyzing}
          onClick={onClearStaged}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#263142] bg-[#10151d] text-sm font-medium text-slate-400 transition-all duration-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden md:inline">Clear All</span>
        </button>
      </div>
    </aside>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 md:justify-start">
      <Icon className="h-4 w-4 text-sky-400" />
      <span className="hidden md:inline">{children}</span>
    </div>
  );
}

function FileItem({ active, name, size, status, error, onSelect, onRemove }) {
  const failed = status === 'failed';

  return (
    <motion.div
      whileHover={{ x: 2 }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (onSelect && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`relative flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-lg border px-2 transition-all duration-200 md:justify-start md:px-3 ${
        active
          ? 'border-sky-400/60 bg-[#12202b] shadow-[0_0_18px_rgba(14,165,233,0.12)]'
          : 'border-[#1f2937] bg-[#10151d]/85 hover:border-[#334155]'
      }`}
      title={name}
    >
      {active && <span className="absolute left-0 top-0 h-full w-1 bg-sky-400" />}
      <FileText className={`h-5 w-5 flex-shrink-0 ${failed ? 'text-red-300' : 'text-sky-400'}`} />
      <div className="hidden min-w-0 flex-1 md:block">
        <div className="truncate text-sm font-semibold text-gray-100">{name}</div>
        <div className={`truncate font-mono text-xs ${failed ? 'text-red-300' : 'text-slate-500'}`}>
          {status === 'processing' ? 'processing...' : failed ? error || 'failed' : size}
        </div>
      </div>
      {status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-sky-400" />}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove?.();
        }}
        className="hidden rounded-lg p-1 text-gray-500 transition-colors hover:bg-white/5 hover:text-white md:block"
        aria-label={`Remove ${name}`}
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export default Sidebar;
