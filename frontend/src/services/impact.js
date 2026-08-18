import api from './api'

export async function fetchImpactDashboard() {
  const { data } = await api.get('/impact/')
  return data
}
