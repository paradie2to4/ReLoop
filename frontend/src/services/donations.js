import api from './api'

export async function fetchDonations() {
  const { data } = await api.get('/donations/')
  return data
}

export async function requestDonation(payload) {
  const { data } = await api.post('/donations/', payload)
  return data
}

export async function respondToDonation(id, action) {
  const { data } = await api.patch(`/donations/${id}/respond/`, { action })
  return data
}
