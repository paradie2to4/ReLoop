import api from './api'

export async function fetchConversations() {
  const { data } = await api.get('/conversations/')
  return data
}

export async function fetchConversation(id) {
  const { data } = await api.get(`/conversations/${id}/`)
  return data
}

export async function startConversation(payload) {
  const { data } = await api.post('/conversations/', payload)
  return data
}

export async function sendMessage(conversationId, text) {
  const { data } = await api.post('/messages/', { conversation: conversationId, text })
  return data
}
