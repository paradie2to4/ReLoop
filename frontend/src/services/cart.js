import api from './api'

export async function fetchCart() {
  const { data } = await api.get('/cart/')
  return data
}

export async function addCartItem(productId, quantity = 1) {
  const { data } = await api.post('/cart/items/', { product_id: productId, quantity })
  return data
}

export async function updateCartItem(itemId, quantity) {
  const { data } = await api.patch(`/cart/items/${itemId}/`, { quantity })
  return data
}

export async function removeCartItem(itemId) {
  await api.delete(`/cart/items/${itemId}/`)
}
