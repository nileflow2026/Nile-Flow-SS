/**
 * App Router
 *
 * Central application routing configuration.
 * Uses lazy loading for route-based code splitting.
 */

import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from '@auth/routeGuards'
import Loader from '@shared/ui/loader/Loader'

// ── Eager-loaded auth pages ───────────────────────────────────
// Auth pages are eagerly loaded to avoid race conditions between
// lazy Suspense resolution and AuthProvider initialization
// (requestIdleCallback + async init). This eliminates the
// "Invalid hook call" / "useContext on null" error on first visit.
import LoginPage from '@features/auth/pages/LoginPage'
import SignupPage from '@features/auth/pages/SignupPage'
import ForgotPasswordPage from '@features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from '@features/auth/pages/ResetPasswordPage'

// ── Lazy-loaded pages ─────────────────────────────────────────
const HomePage = lazy(() => import('@features/home/pages/HomePage'))
const VerifyEmailPage = lazy(() => import('@features/auth/pages/VerifyEmailPage'))
const OAuthCallbackPage = lazy(() => import('@features/auth/pages/OAuthCallbackPage'))
const CartPage = lazy(() => import('@features/cart/pages/CartPage'))
const CheckoutPage = lazy(() => import('@features/checkout/pages/CheckoutPage'))
const OrdersPage = lazy(() => import('@features/orders/pages/OrdersPage'))
const TrackOrderPage = lazy(() => import('@features/orders/pages/TrackOrderPage'))
const ProfilePage = lazy(() => import('@features/user/pages/ProfilePage'))
const AddressesPage = lazy(() => import('@features/user/pages/AddressesPage'))
const SettingsPage = lazy(() => import('@features/user/pages/SettingsPage'))
const NotificationPage = lazy(() => import('@features/user/pages/NotificationPage'))
const AccountDeletionPage = lazy(() => import('@features/user/pages/AccountDeletionPage'))
const ProductListingPage = lazy(() => import('@features/products/pages/ProductListingPage'))
const FeaturedProductsPage = lazy(() => import('@features/products/pages/FeaturedProductsPage'))
const ProductDetailPage = lazy(() => import('@features/products/pages/ProductDetailPage'))
const SearchPage = lazy(() => import('@features/products/pages/SearchPage'))
const StorePage = lazy(() => import('@features/store/pages/StorePage'))
const PremiumDealsPage = lazy(() => import('@features/premium/pages/PremiumDealsPage'))
const DealsPage = lazy(() => import('@features/deals/pages/DealsPage'))
const CategoryPage = lazy(() => import('@features/discovery/pages/CategoryPage'))
const GroupBuyPage = lazy(() => import('@features/group-buy/pages/GroupBuyPage'))
const PaymentPage = lazy(() => import('@features/payments/pages/PaymentPage'))
const PaymentSuccessPage = lazy(() => import('@features/payments/pages/PaymentSuccessPage'))
const PaymentCancelledPage = lazy(() => import('@features/payments/pages/PaymentCancelledPage'))
const AboutPage = lazy(() => import('@features/info/pages/AboutPage'))
const ContactPage = lazy(() => import('@features/info/pages/ContactPage'))
const HelpCenterPage = lazy(() => import('@features/info/pages/HelpCenterPage'))
const PrivacyPage = lazy(() => import('@features/info/pages/PrivacyPage'))
const ReturnPolicyPage = lazy(() => import('@features/info/pages/ReturnPolicyPage'))
const TermsPage = lazy(() => import('@features/info/pages/TermsPage'))
const CancelOrderPage = lazy(() => import('@features/info/pages/CancelOrderPage'))
const CareersPage = lazy(() => import('@features/careers/pages/CareersPage'))
const NotFoundPage = lazy(() => import('@features/not-found/pages/NotFoundPage'))
const LandingPage = lazy(() => import('@features/home/pages/LandingPage'))

function SuspenseLoader({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
          <Loader label="Loading…" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

export default function AppRouter() {
  return (
    <SuspenseLoader>
      <Routes>
        {/* ── Public Routes ─────────────────────────────────── */} 
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/Landing" element={<LandingPage />} />
        <Route path="/products" element={<ProductListingPage />} />
        <Route path="/featured-products" element={<FeaturedProductsPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/store/:vendorId" element={<StorePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/premium-deals" element={<PremiumDealsPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/group-buy" element={<GroupBuyPage />} />

        {/* ── Info Routes ───────────────────────────────────── */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/return-policy" element={<ReturnPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/careers" element={<CareersPage />} />

        {/* ── Guest-only Routes ─────────────────────────────── */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* ── Protected Routes ──────────────────────────────── */}
        <Route path="/checkout" element={<ProtectedRoute requireAuth><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute requireAuth><OrdersPage /></ProtectedRoute>} />
        <Route path="/track-order/:orderId" element={<ProtectedRoute requireAuth><TrackOrderPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute requireAuth><ProfilePage /></ProtectedRoute>} />
        <Route path="/addresses" element={<ProtectedRoute requireAuth><AddressesPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute requireAuth><SettingsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute requireAuth><NotificationPage /></ProtectedRoute>} />
        <Route path="/account-deletion" element={<ProtectedRoute requireAuth><AccountDeletionPage /></ProtectedRoute>} />
        <Route path="/cancel-order" element={<ProtectedRoute requireAuth><CancelOrderPage /></ProtectedRoute>} />

        {/* ── Payment Routes ────────────────────────────────── */}
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancelled" element={<PaymentCancelledPage />} />

        {/* ── 404 ───────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SuspenseLoader>
  )
}
