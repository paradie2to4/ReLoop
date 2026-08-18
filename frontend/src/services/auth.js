import api, { tokenStore } from './api'

export async function register(payload) {
  const { data } = await api.post('/auth/register/', payload)
  tokenStore.set(data.access, data.refresh)
  return data.user
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login/', { email, password })
  tokenStore.set(data.access, data.refresh)
  return data.user
}

export function logout() {
  tokenStore.clear()
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me/')
  return data
}

export async function updateProfile(payload) {
  const { data } = await api.patch('/auth/me/', payload)
  return data
}

export async function becomeSeller() {
  const { data } = await api.post('/auth/become-seller/')
  return data
}

export async function fetchPublicSeller(id) {
  const { data } = await api.get(`/auth/users/${id}/`)
  return data
}
