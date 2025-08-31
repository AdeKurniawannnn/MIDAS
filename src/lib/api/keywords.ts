/**
 * Client-side API wrapper for keywords operations
 * This is a wrapper around the consolidated API routes
 */

export const createKeyword = async (keywordData: any) => {
  const response = await fetch('/api/keywords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(keywordData),
  })
  return response.json()
}

export const updateKeyword = async (id: string, keywordData: any) => {
  const response = await fetch(`/api/keywords?action=update&id=${id}`, {
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(keywordData),
  })
  return response.json()
}

export const deleteKeyword = async (id: string) => {
  const response = await fetch(`/api/keywords?action=delete&id=${id}`, {
    method: 'DELETE',
  })
  return response.json()
}

export const bulkOperation = async (action: string, ids: string[], data?: any) => {
  const response = await fetch(`/api/keywords?action=bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ids, data }),
  })
  return response.json()
}