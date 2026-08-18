import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import * as cartService from '../services/cart'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], total: 0 })
      return
    }
    setLoading(true)
    try {
      const data = await cartService.fetchCart()
      setCart(data)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  async function addItem(productId, quantity = 1) {
    await cartService.addCartItem(productId, quantity)
    await refreshCart()
  }

  async function updateItem(itemId, quantity) {
    await cartService.updateCartItem(itemId, quantity)
    await refreshCart()
  }

  async function removeItem(itemId) {
    await cartService.removeCartItem(itemId)
    await refreshCart()
  }

  const value = {
    cart,
    loading,
    itemCount: cart.items?.length || 0,
    addItem,
    updateItem,
    removeItem,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
