import api from './api'

export async function createReport(payload) {
  const { data } = await api.post('/reports/', payload)
  return data
}

export async function fetchReports() {
  const { data } = await api.get('/reports/')
  return data
}
