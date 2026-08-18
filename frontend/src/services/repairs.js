import api from './api'

export async function fetchRepairProviders(params = {}) {
  const { data } = await api.get('/repair-providers/', { params })
  return data
}

export async function fetchRepairRequests() {
  const { data } = await api.get('/repair-requests/')
  return data
}

export async function createRepairRequest(payload) {
  const { data } = await api.post('/repair-requests/', payload)
  return data
}
