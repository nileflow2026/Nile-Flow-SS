import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import { SeoHead } from '@shared/seo/SeoHead'
import { ProtectedRoute } from '@api/context/ProtectedRoute'

const HomePage = lazy(() => import('@features/home/pages/HomePage'))
const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'))
const SignupPage = lazy(() => import('@features/auth/pages/SignupPage'))
const ForgotPasswordPage = lazy(() => import('@features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@features/auth/pages/ResetPasswordPage'))
const OAuthCallbackPage = lazy(() => import('@features/auth/pages/OAuthCallbackPage'))
const VerifyEmailPage = lazy(() => import('@features/auth/pages/VerifyEmailPage'))
const ProductListingPage = lazy(() => import('@features/products/pages/ProductListingPage'))
const ProductDetailPage = lazy(() => import('@features/products/pages/ProductDetailPage'))
const SearchPage = lazy(() => import('@features/products/pages/SearchPage'))
const CategoryPage = lazy(() => import('@features/discovery/pages/CategoryPage'))
const CartPage = lazy(() => import('@features/cart/pages/CartPage'))
const CheckoutPage = lazy(() => import('@features/checkout/pages/CheckoutPage'))
const OrdersPage = lazy(() => import('@features/orders/pages/OrdersPage'))
const TrackOrderPage = lazy(() => import('@features/orders/pages/TrackOrderPage'))
const ProfilePage = lazy(() => import('@features/user/pages/ProfilePage'))
const SettingsPage = lazy(() => import('@features/user/pages/SettingsPage'))
const AddressesPage = lazy(() => import('@features/user/pages/AddressesPage'))
const NotificationPage = lazy(() => import('@features/user/pages/NotificationPage'))
const PaymentPage = lazy(() => import('@features/payments/pages/PaymentPage'))
const PaymentSuccessPage = lazy(() => import('@features/payments/pages/PaymentSuccessPage'))
const PaymentCancelledPage = lazy(() => import('@features/payments/pages/PaymentCancelledPage'))
const DealsPage = lazy(() => import('@features/deals/pages/DealsPage'))
const PremiumDealsPage = lazy(() => import('@features/premium/pages/PremiumDealsPage'))
const GroupBuyPage = lazy(() => import('@features/group-buy/pages/GroupBuyPage'))
const CareersPage = lazy(() => import('@features/careers/pages/CareersPage'))
const CancelOrderPage = lazy(() => import('@features/info/pages/CancelOrderPage'))
const AccountDeletionPage = lazy(() => import('@features/user/pages/AccountDeletionPage'))
const TermsPage = lazy(() => import('@features/info/pages/TermsPage'))
const AboutPage = lazy(() => import('@features/info/pages/AboutPage'))
const ContactPage = lazy(() => import('@features/info/pages/ContactPage'))
const HelpCenterPage = lazy(() => import('@features/info/pages/HelpCenterPage'))
const PrivacyPage = lazy(() => import('@features/info/pages/PrivacyPage'))
const ReturnPolicyPage = lazy(() => import('@features/info/pages/ReturnPolicyPage'))
const NotFoundPage = lazy(() => import('@features/not-found/pages/NotFoundPage'))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-6 text-[var(--color-text-secondary)]">
      <p className="text-sm font-medium">Loading Nile Flow experience...</p>
    </div>
  )
}

function withSuspense(element, seoProps) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <SeoHead {...seoProps}>{element}</SeoHead>
    </Suspense>
  )
}

export const appRoutes = [
  {
    path: '/',
    element: withSuspense(<HomePage />, {
      title: 'African Commerce, Fintech & AI Marketplace',
      description:
        'Explore Nile Flow for trusted shopping, digital payments, modern retail discovery, and AI-powered commerce across Africa.',
      keywords: ['African marketplace', 'ecommerce Africa', 'fintech Kenya', 'AI commerce'],
      canonical: '/',
      breadcrumbs: [{ label: 'Home', href: '/' }],
    }),
  },
  {
    path: '/login',
    element: withSuspense(
      <ProtectedRoute guestOnly>
        <LoginPage />
      </ProtectedRoute>,
      {
        title: 'Sign in to Nile Flow',
        description: 'Access your Nile Flow account to manage orders, saved favorites, and premium benefits.',
        canonical: '/login',
        robots: 'noindex,nofollow',
        breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Sign in', href: '/login' }],
      },
    ),
  },
  {
    path: '/products',
    element: withSuspense(<ProductListingPage />, {
      title: 'Shop Products in Africa',
      description: 'Browse curated products, essentials, and premium picks from Nile Flow’s growing African commerce marketplace.',
      canonical: '/products',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }],
    }),
  },
  {
    path: '/products/:productId',
    element: withSuspense(<ProductDetailPage />, {
      title: 'Product Details',
      description: 'View detailed product information, pricing, availability, and merchant information on Nile Flow.',
      canonical: '/products/:productId',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: 'Product', href: '/products/:productId' }],
    }),
  },
  {
    path: '/cart',
    element: withSuspense(<CartPage />, {
      title: 'Your Cart',
      description: 'Review your selected items, quantities, and delivery choices before checkout on Nile Flow.',
      canonical: '/cart',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }],
    }),
  },
  {
    path: '/checkout',
    element: withSuspense(<CheckoutPage />, {
      title: 'Secure Checkout',
      description: 'Complete your order securely with trusted payment options, delivery selection, and order confirmation.',
      canonical: '/checkout',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Checkout', href: '/checkout' }],
    }),
  },
  {
    path: '/about',
    element: withSuspense(<AboutPage />, {
      title: 'About Nile Flow',
      description: 'Learn about Nile Flow’s mission, values, and the people building trusted African commerce experiences.',
      canonical: '/about',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }],
    }),
  },
  {
    path: '/contact',
    element: withSuspense(<ContactPage />, {
      title: 'Contact Nile Flow',
      description: 'Get in touch for support, merchant enquiries, partnerships, and general questions.',
      canonical: '/contact',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Contact', href: '/contact' }],
    }),
  },
  {
    path: '/signup',
    element: withSuspense(
      <ProtectedRoute guestOnly>
        <SignupPage />
      </ProtectedRoute>,
      {
        title: 'Create Account',
        description: 'Join Nile Flow for seamless shopping and order tracking.',
        canonical: '/signup',
        robots: 'noindex,nofollow',
        breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Sign up', href: '/signup' }],
      },
    ),
  },
  {
    path: '/forgot-password',
    element: withSuspense(<ForgotPasswordPage />, {
      title: 'Forgot Password',
      description: 'Reset your Nile Flow account password.',
      canonical: '/forgot-password',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Forgot Password', href: '/forgot-password' }],
    }),
  },
  {
    path: '/reset-password/:token',
    element: withSuspense(<ResetPasswordPage />, {
      title: 'Reset Password',
      description: 'Set a new password for your Nile Flow account.',
      canonical: '/reset-password/:token',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Reset Password', href: '/reset-password' }],
    }),
  },
  {
    path: '/auth/callback',
    element: withSuspense(<OAuthCallbackPage />, {
      title: 'Completing Sign In',
      description: 'Processing your OAuth sign-in.',
      canonical: '/auth/callback',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Auth', href: '/auth/callback' }],
    }),
  },
  {
    path: '/verify-email',
    element: withSuspense(<VerifyEmailPage />, {
      title: 'Verify Your Email',
      description: 'Enter the verification code sent to your email to activate your Nile Flow account.',
      canonical: '/verify-email',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Verify Email', href: '/verify-email' }],
    }),
  },
  {
    path: '/search',
    element: withSuspense(<SearchPage />, {
      title: 'Search Products',
      description: 'Find products on Nile Flow.',
      canonical: '/search',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Search', href: '/search' }],
    }),
  },
  {
    path: '/category/:categorySlug',
    element: withSuspense(<CategoryPage />, {
      title: 'Category',
      description: 'Browse products by category.',
      canonical: '/category/:categorySlug',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Category', href: '/category/:categorySlug' }],
    }),
  },
  {
    path: '/orders',
    element: withSuspense(<OrdersPage />, {
      title: 'Your Orders',
      description: 'View your order history on Nile Flow.',
      canonical: '/orders',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Orders', href: '/orders' }],
    }),
  },
  {
    path: '/track-order/:orderId',
    element: withSuspense(<TrackOrderPage />, {
      title: 'Track Order',
      description: 'Track your Nile Flow order in real-time.',
      canonical: '/track-order/:orderId',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Track Order', href: '/track-order/:orderId' }],
    }),
  },
  {
    path: '/profile',
    element: withSuspense(<ProfilePage />, {
      title: 'Your Profile',
      description: 'Manage your Nile Flow account information.',
      canonical: '/profile',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Profile', href: '/profile' }],
    }),
  },
  {
    path: '/settings',
    element: withSuspense(<SettingsPage />, {
      title: 'Account Settings',
      description: 'Customize your Nile Flow preferences.',
      canonical: '/settings',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Settings', href: '/settings' }],
    }),
  },
  {
    path: '/addresses',
    element: withSuspense(<AddressesPage />, {
      title: 'Saved Addresses',
      description: 'Manage your delivery addresses on Nile Flow.',
      canonical: '/addresses',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Addresses', href: '/addresses' }],
    }),
  },
  {
    path: '/notifications',
    element: withSuspense(<NotificationPage />, {
      title: 'Notifications',
      description: 'View your Nile Flow notifications.',
      canonical: '/notifications',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Notifications', href: '/notifications' }],
    }),
  },
  {
    path: '/payment',
    element: withSuspense(<PaymentPage />, {
      title: 'Payment',
      description: 'Complete your Nile Flow order payment.',
      canonical: '/payment',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Payment', href: '/payment' }],
    }),
  },
  {
    path: '/payment/success',
    element: withSuspense(<PaymentSuccessPage />, {
      title: 'Payment Successful',
      description: 'Your Nile Flow payment was successful.',
      canonical: '/payment/success',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Payment', href: '/payment' }, { label: 'Success', href: '/payment/success' }],
    }),
  },
  {
    path: '/payment/cancelled',
    element: withSuspense(<PaymentCancelledPage />, {
      title: 'Payment Cancelled',
      description: 'Your Nile Flow payment was cancelled.',
      canonical: '/payment/cancelled',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Payment', href: '/payment' }, { label: 'Cancelled', href: '/payment/cancelled' }],
    }),
  },
  {
    path: '/deals',
    element: withSuspense(<DealsPage />, {
      title: 'Flash Deals',
      description: 'Limited-time deals on African products on Nile Flow.',
      canonical: '/deals',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Deals', href: '/deals' }],
    }),
  },
  {
    path: '/premium-deals',
    element: withSuspense(<PremiumDealsPage />, {
      title: 'Premium Deals',
      description: 'Exclusive Nile Flow Premium member deals.',
      canonical: '/premium-deals',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Premium Deals', href: '/premium-deals' }],
    }),
  },
  {
    path: '/group-buy',
    element: withSuspense(<GroupBuyPage />, {
      title: 'Group Buying',
      description: 'Save more with Nile Flow group buying.',
      canonical: '/group-buy',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Group Buy', href: '/group-buy' }],
    }),
  },
  {
    path: '/careers',
    element: withSuspense(<CareersPage />, {
      title: 'Careers at Nile Flow',
      description: 'Join the Nile Flow team.',
      canonical: '/careers',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Careers', href: '/careers' }],
    }),
  },
  {
    path: '/cancel-order',
    element: withSuspense(<CancelOrderPage />, {
      title: 'Cancel Order',
      description: 'Request cancellation of your Nile Flow order.',
      canonical: '/cancel-order',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Cancel Order', href: '/cancel-order' }],
    }),
  },
  {
    path: '/account-deletion',
    element: withSuspense(<AccountDeletionPage />, {
      title: 'Delete Account & Data',
      description: 'Permanently remove your Nile Flow account and all associated personal data. GDPR and Play Store compliant.',
      canonical: '/account-deletion',
      robots: 'noindex,nofollow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Delete Account', href: '/account-deletion' }],
    }),
  },
  {
    path: '/terms',
    element: withSuspense(<TermsPage />, {
      title: 'Terms of Service',
      description: 'Nile Flow Terms of Service and conditions.',
      canonical: '/terms',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Terms', href: '/terms' }],
    }),
  },
  {
    path: '/help-center',
    element: withSuspense(<HelpCenterPage />, {
      title: 'Help Center',
      description: 'Find answers to common questions about shopping, payments, delivery, and account support.',
      canonical: '/help-center',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Help Center', href: '/help-center' }],
    }),
  },
  {
    path: '/privacy',
    element: withSuspense(<PrivacyPage />, {
      title: 'Privacy Policy',
      description: 'Review how Nile Flow handles your data and privacy preferences in a transparent, straightforward way.',
      canonical: '/privacy',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Privacy', href: '/privacy' }],
    }),
  },
  {
    path: '/return-policy',
    element: withSuspense(<ReturnPolicyPage />, {
      title: 'Return Policy',
      description: 'Learn how Nile Flow handles returns, refunds, and support for eligible orders.',
      canonical: '/return-policy',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Return Policy', href: '/return-policy' }],
    }),
  },
  {
    path: '*',
    element: withSuspense(<NotFoundPage />, {
      title: 'Page Not Found',
      description: 'The page you requested could not be found. Return to Nile Flow’s home page to continue exploring.',
      canonical: '/404',
      robots: 'noindex,follow',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Not Found', href: '/404' }],
    }),
  },
]
