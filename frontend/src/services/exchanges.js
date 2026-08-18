import api from './api'

export async function fetchExchanges() {
  const { data } = await api.get('/exchanges/')
  return data
}

export async function createExchange(payload) {
  const { data } = await api.post('/exchanges/', payload)
  return data
}

export async function respondToExchange(id, action) {
  const { data } = await api.patch(`/exchanges/${id}/respond/`, { action })
  return data
}
