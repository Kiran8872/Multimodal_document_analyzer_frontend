const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'because',
  'before',
  'being',
  'between',
  'could',
  'document',
  'documents',
  'from',
  'have',
  'into',
  'more',
  'other',
  'should',
  'than',
  'that',
  'their',
  'there',
  'these',
  'this',
  'through',
  'with',
  'would',
]);

const POSITIVE_WORDS = new Set([
  'accurate',
  'benefit',
  'clear',
  'effective',
  'excellent',
  'growth',
  'improve',
  'improved',
  'positive',
  'success',
  'strong',
  'valuable',
]);

const NEGATIVE_WORDS = new Set([
  'challenge',
  'challenges',
  'concern',
  'decline',
  'error',
  'failed',
  'failure',
  'issue',
  'limitation',
  'limitations',
  'negative',
  'problem',
  'risk',
  'weak',
]);

export function cleanText(value) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .replace(/\uFEFF/g, '')
    .replace(/ï»¿/g, '')
    .replace(/ï¿½/g, '')
    .replace(/�/g, '')
    .replace(/[\u0001-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getReadableTitle(document) {
  const primary = document?.analysis?.title || document?.originalName || 'Untitled document';
  const cleaned = cleanText(primary);

  if (!cleaned || cleaned.length > 140 || looksCorrupted(cleaned)) {
    return document?.originalName || 'Untitled document';
  }

  return cleaned;
}

export function formatBytes(bytes) {
  if (typeof bytes !== 'number') return bytes || 'Unknown size';
  if (bytes === 0) return '0 Bytes';

  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${Number((bytes / 1024 ** index).toFixed(1))} ${units[index]}`;
}

export function getDocumentSize(document) {
  return document?.fileSize || formatBytes(document?.fileSizeBytes);
}

export function getDocumentText(document) {
  return String(document?.extractedText || '')
    .replace(/\u0000/g, '')
    .replace(/\uFEFF/g, '')
    .replace(/ï»¿/g, '')
    .replace(/ï¿½/g, '')
    .replace(/�/g, '');
}

export function computeStats(text) {
  const value = String(text || '');
  const words = value.match(/[A-Za-z0-9'$-]+/g) || [];
  const sentences = value.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
  const paragraphs = value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);

  return {
    words: words.length,
    characters: value.length,
    sentences: sentences.length || (value ? 1 : 0),
    paragraphs: paragraphs.length || (value ? 1 : 0),
  };
}

export function getReadingTime(text) {
  const words = computeStats(text).words;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return minutes === 1 ? 'Less than 1 min' : `${minutes} min read`;
}

export function getKeywords(document, limit = 10) {
  const fromAnalysis = normalizeStringArray(document?.analysis?.keywords);
  if (fromAnalysis.length > 0) return fromAnalysis.slice(0, limit);

  const counts = countWords(getDocumentText(document));
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function getTopics(document) {
  const explicit = normalizeStringArray(document?.analysis?.topics);
  if (explicit.length > 0) return explicit.slice(0, 6);
  return getKeywords(document, 6);
}

export function getEntities(document) {
  const analysis = document?.analysis || {};
  const people = normalizeStringArray(analysis.people).map((value) => ({ type: 'Person', value }));
  const dates = normalizeStringArray(analysis.dates).map((value) => ({ type: 'Date', value }));
  const amounts = normalizeStringArray(analysis.amounts).map((value) => ({ type: 'Amount', value }));
  const terms = normalizeStringArray((analysis.importantTerms || []).map((item) => item?.term)).map((value) => ({
    type: 'Term',
    value,
  }));

  return [...people, ...dates, ...amounts, ...terms].filter((item) => item.value);
}

export function getKeywordFrequency(document, limit = 10) {
  const text = getDocumentText(document);
  const counts = countWords(text);
  const analysisKeywords = getKeywords(document, limit);
  const entries = analysisKeywords
    .map((keyword) => [keyword, counts[keyword.toLowerCase()] || countKeyword(text, keyword)])
    .filter(([, count]) => count > 0);

  if (entries.length > 0) {
    return entries.slice(0, limit).map(([label, value]) => ({ label, value }));
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

export function getEntityDistribution(document) {
  const entities = getEntities(document);
  const distribution = entities.reduce((acc, entity) => {
    acc[entity.type] = (acc[entity.type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(distribution).map(([label, value]) => ({ label, value }));
}

export function getSentiment(document) {
  const analysis = document?.analysis || {};
  if (analysis.sentiment) {
    return {
      label: cleanText(analysis.sentiment),
      score: normalizeScore(analysis.sentimentScore),
    };
  }

  const words = (getDocumentText(document).toLowerCase().match(/[a-z']+/g) || []).filter((word) => word.length > 2);
  const positives = words.filter((word) => POSITIVE_WORDS.has(word)).length;
  const negatives = words.filter((word) => NEGATIVE_WORDS.has(word)).length;
  const totalSignals = positives + negatives;

  if (totalSignals === 0) {
    return { label: 'Neutral', score: 2.6 };
  }

  const balance = positives - negatives;
  const label = balance > 1 ? 'Positive' : balance < -1 ? 'Negative' : 'Neutral';
  const score = Math.min(100, Math.max(2.6, (totalSignals / Math.max(words.length, 1)) * 100));
  return { label, score: Number(score.toFixed(1)) };
}

export function buildReport(document) {
  const analysis = document?.analysis || {};
  const keywords = getKeywords(document, 20);
  const entities = getEntities(document);
  const stats = computeStats(getDocumentText(document));

  return [
    getReadableTitle(document),
    '',
    `File: ${document?.originalName || 'Unknown'}`,
    `Type: ${(document?.fileType || 'document').toUpperCase()}`,
    `Size: ${getDocumentSize(document)}`,
    `Pages: ${document?.pageCount || 1}`,
    '',
    'SUMMARY',
    cleanText(analysis.summary || analysis.detailedSummary || 'No summary available.'),
    '',
    'KEY POINTS',
    ...(analysis.keyPoints?.length ? analysis.keyPoints.map((point, index) => `${index + 1}. ${cleanText(point)}`) : ['No key points available.']),
    '',
    'KEYWORDS',
    keywords.join(', ') || 'No keywords available.',
    '',
    'ENTITIES',
    entities.length ? entities.map((entity) => `${entity.type}: ${entity.value}`).join('\n') : 'No entities detected.',
    '',
    'TEXT STATISTICS',
    `Words: ${stats.words}`,
    `Characters: ${stats.characters}`,
    `Sentences: ${stats.sentences}`,
    `Paragraphs: ${stats.paragraphs}`,
    '',
    'EXTRACTED TEXT',
    getDocumentText(document) || 'No extracted text available.',
  ].join('\n');
}

export function compareDocumentsLocally(left, right) {
  const leftKeywords = new Set(getKeywords(left, 20).map((item) => item.toLowerCase()));
  const rightKeywords = new Set(getKeywords(right, 20).map((item) => item.toLowerCase()));
  const common = [...leftKeywords].filter((item) => rightKeywords.has(item));
  const leftStats = computeStats(getDocumentText(left));
  const rightStats = computeStats(getDocumentText(right));
  const sameType = left?.fileType === right?.fileType;

  return {
    similarities: [
      sameType ? `Both documents are ${String(left?.fileType || 'document').toUpperCase()} files.` : null,
      common.length ? `Shared themes include ${common.slice(0, 5).join(', ')}.` : null,
      Math.abs(leftStats.words - rightStats.words) < 250 ? 'The documents have similar text length.' : null,
    ].filter(Boolean),
    differences: [
      !sameType ? `File types differ: ${String(left?.fileType || 'unknown').toUpperCase()} vs ${String(right?.fileType || 'unknown').toUpperCase()}.` : null,
      leftStats.words !== rightStats.words ? `${left?.originalName || 'Document 1'} has ${leftStats.words} words; ${right?.originalName || 'Document 2'} has ${rightStats.words} words.` : null,
      common.length === 0 ? 'No shared top keywords were detected.' : null,
    ].filter(Boolean),
    recommendation: 'Use the AI comparison endpoint when available for deeper semantic judgment.',
    comparisonSummary: `${common.length} shared keyword signals found across the selected documents.`,
  };
}

function normalizeStringArray(value) {
  return (Array.isArray(value) ? value : [])
    .map((item) => cleanText(item))
    .filter(Boolean)
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index);
}

function countWords(text) {
  return (String(text || '').toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || [])
    .filter((word) => !STOP_WORDS.has(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
}

function countKeyword(text, keyword) {
  if (!keyword) return 0;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = String(text || '').match(new RegExp(`\\b${escaped}\\b`, 'gi'));
  return matches?.length || 0;
}

function normalizeScore(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return 2.6;
  return Math.min(100, Math.max(0, numeric));
}

function looksCorrupted(text) {
  const suspicious = (text.match(/[\u0000-\u001F\u007F�]/g) || []).length;
  return suspicious / Math.max(text.length, 1) > 0.02;
}
