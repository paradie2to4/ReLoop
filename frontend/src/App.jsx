import { Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import ProductDetail from './pages/ProductDetail'
import SellItem from './pages/SellItem'
import EditProduct from './pages/EditProduct'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import SellerProfile from './pages/SellerProfile'
import BecomeSeller from './pages/BecomeSeller'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Wishlist from './pages/Wishlist'
import Messages from './pages/Messages'
import ExchangeRequests from './pages/ExchangeRequests'
import DonationRequests from './pages/DonationRequests'
import RepairProviders from './pages/RepairProviders'
import RepairRequests from './pages/RepairRequests'
import ImpactDashboard from './pages/ImpactDashboard'
import Notifications from './pages/Notifications'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/sellers/:id" element={<SellerProfile />} />
        <Route path="/repair-providers" element={<RepairProviders />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/become-seller" element={<BecomeSeller />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Messages />} />
          <Route path="/exchange-requests" element={<ExchangeRequests />} />
          <Route path="/donation-requests" element={<DonationRequests />} />
          <Route path="/repair-requests" element={<RepairRequests />} />
          <Route path="/impact" element={<ImpactDashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/products/:id/edit" element={<EditProduct />} />
        </Route>

        <Route element={<ProtectedRoute requireSeller />}>
          <Route path="/sell" element={<SellItem />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
        </Route>

        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
