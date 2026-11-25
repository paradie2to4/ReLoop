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

export async function fetchMomoConfig() {
  const { data } = await api.get('/payments/momo/config/')
  return data
}

export async function payWithMomo(id, phone) {
  const { data } = await api.post(`/orders/${id}/momo/pay/`, { phone })
  return data
}

export async function checkMomoStatus(id) {
  const { data } = await api.get(`/orders/${id}/momo/status/`)
  return data
}

export async function cancelOrder(id) {
  const { data } = await api.post(`/orders/${id}/cancel/`)
  return data
}

export async function updateOrderStatus(id, payload) {
  const { data } = await api.patch(`/orders/${id}/status/`, payload)
  return data
}
