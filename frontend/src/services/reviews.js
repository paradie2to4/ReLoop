import api from './api'

export async function fetchReviews(sellerId) {
  const { data } = await api.get('/reviews/', { params: { seller: sellerId } })
  return data
}

export async function createReview(payload) {
  const { data } = await api.post('/reviews/', payload)
  return data
}
