import api from './api'

export async function fetchProducts(params = {}) {
  const { data } = await api.get('/products/', { params })
  return data
}

export async function fetchProduct(id) {
  const { data } = await api.get(`/products/${id}/`)
  return data
}

export async function createProduct(payload) {
  const { data } = await api.post('/products/', payload)
  return data
}

export async function updateProduct(id, payload) {
  const { data } = await api.patch(`/products/${id}/`, payload)
  return data
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}/`)
}

export async function uploadProductImage(productId, file, isPrimary = false) {
  const form = new FormData()
  form.append('image', file)
  form.append('is_primary', isPrimary)
  const { data } = await api.post(`/products/${productId}/images/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteProductImage(productId, imageId) {
  await api.delete(`/products/${productId}/images/${imageId}`)
}

export async function fetchExchangeRecommendations(productId) {
  const { data } = await api.get(`/products/${productId}/exchange-recommendations/`)
  return data
}

export async function fetchHomeSection(section, params = {}) {
  const { data } = await api.get(`/products/${section}/`, { params })
  return data
}

export async function fetchCategories() {
  const { data } = await api.get('/categories/')
  return data
}
