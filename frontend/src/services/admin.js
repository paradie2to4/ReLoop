import api from './api'

export async function fetchSellerDashboard() {
  const { data } = await api.get('/seller/dashboard/')
  return data
}

export async function fetchAdminAnalytics() {
  const { data } = await api.get('/auth/admin/analytics/')
  return data
}

export async function fetchAdminUsers(params = {}) {
  const { data } = await api.get('/auth/admin/users/', { params })
  return data
}

export async function suspendUser(id) {
  const { data } = await api.post(`/auth/admin/users/${id}/suspend/`)
  return data
}

export async function reactivateUser(id) {
  const { data } = await api.post(`/auth/admin/users/${id}/reactivate/`)
  return data
}

export async function fetchAdminCategories() {
  const { data } = await api.get('/categories/')
  return data
}

export async function createCategory(payload) {
  const { data } = await api.post('/categories/', payload)
  return data
}

export async function deleteCategory(id) {
  await api.delete(`/categories/${id}/`)
}

export async function fetchAdminReports(params = {}) {
  const { data } = await api.get('/reports/', { params })
  return data
}
