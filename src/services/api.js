const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function parseJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function requestJson(url, options = {}, fallbackError = 'Request failed') {
  const response = await fetch(url, options);
  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const message = payload?.error || payload?.message || fallbackError;
    throw new Error(message);
  }

  return payload;
}

// Upload a document
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  return requestJson(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  }, 'Failed to upload document');
}

// Get all documents
export async function getDocuments(limit = 50, skip = 0) {
  return requestJson(`${API_BASE}/documents?limit=${limit}&skip=${skip}`, {}, 'Failed to fetch documents');
}

// Get single document
export async function getDocument(id) {
  return requestJson(`${API_BASE}/documents/${id}`, {}, 'Failed to fetch document');
}

// Delete a document
export async function deleteDocument(id) {
  return requestJson(`${API_BASE}/documents/${id}`, {
    method: 'DELETE'
  }, 'Failed to delete document');
}

// Ask a question about a document
export async function askQuestion(id, question) {
  return requestJson(`${API_BASE}/documents/${id}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question })
  }, 'Failed to get answer');
}

// Compare two documents
export async function compareDocuments(docId1, docId2) {
  return requestJson(`${API_BASE}/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ docId1, docId2 })
  }, 'Failed to compare documents');
}

// Generate study plan
export async function generateStudyPlan(id) {
  return requestJson(`${API_BASE}/documents/${id}/study-plan`, {
    method: 'POST'
  }, 'Failed to generate study plan');
}

// Check API health
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Get runtime status
export async function getStatus() {
  return requestJson(`${API_BASE}/status`, {}, 'Failed to fetch app status');
}
