import api from './api'

export async function checkout(payload) {
  const { data } = await api.post('/orders/', payload)
  return data
}

export async function fetchOrders() {
  const { data } = await api.get('/orders/')
  return data
}

export async function fetchOrder(id) {
  const { data } = await api.get(`/orders/${id}/`)
  return data
}

export async function updateOrderStatus(id, payload) {
  const { data } = await api.patch(`/orders/${id}/status/`, payload)
  return data
}
