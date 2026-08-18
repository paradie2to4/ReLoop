import api from './api'

export async function fetchWishlist() {
  const { data } = await api.get('/wishlist/')
  return data
}

export async function addToWishlist(productId) {
  const { data } = await api.post('/wishlist/', { product_id: productId })
  return data
}

export async function removeFromWishlist(productId) {
  await api.delete(`/wishlist/${productId}/`)
}
