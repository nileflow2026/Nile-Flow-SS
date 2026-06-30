export default [
  {
    path: "/",
    file: "features/home/HomePage.tsx",
  },
  {
    path: "shop",
    file: "features/products/ShopPage.tsx",
  },
  {
    path: "products/:id",
    file: "features/products/ProductDetailPage.tsx",
  },
  {
    path: "categories/:slug",
    file: "features/products/CategoryPage.tsx",
  },
  {
    path: "deals",
    file: "features/products/DealsPage.tsx",
  },
  {
    path: "search",
    file: "features/products/SearchPage.tsx",
  },
  {
    path: "cart",
    file: "features/cart/CartPage.tsx",
  },
  {
    path: "checkout",
    file: "features/checkout/CheckoutPage.tsx",
  },
  {
    path: "payment",
    file: "features/checkout/PaymentPage.tsx",
  },
  {
    path: "payment/success",
    file: "features/checkout/PaymentSuccessPage.tsx",
  },
  {
    path: "payment/cancelled",
    file: "features/checkout/PaymentCancelledPage.tsx",
  },
  {
    path: "sign-in",
    file: "features/auth/SignInPage.tsx",
  },
  {
    path: "sign-up",
    file: "features/auth/SignUpPage.tsx",
  },
  {
    path: "forgot-password",
    file: "features/auth/ForgotPasswordPage.tsx",
  },
  {
    path: "reset-password",
    file: "features/auth/ResetPasswordPage.tsx",
  },
  {
    path: "oauth/callback",
    file: "features/auth/OAuthCallbackPage.tsx",
  },
  {
    path: "premium",
    file: "features/premium/PremiumDealsPage.tsx",
  },
  {
    path: "miles",
    file: "features/miles/MilesPage.tsx",
  },
  {
    path: "redeem",
    file: "features/miles/RedeemPage.tsx",
  },
  {
    path: "group-buying",
    file: "features/group-buying/GroupBuyPage.tsx",
  },
  {
    path: "notifications",
    file: "features/notifications/NotificationsPage.tsx",
  },
  {
    path: "orders",
    file: "features/profile/OrdersPage.tsx",
  },
  {
    path: "orders/:id/track",
    file: "features/profile/TrackOrderPage.tsx",
  },
  {
    path: "orders/:id/cancel",
    file: "features/profile/CancelOrderPage.tsx",
  },
  {
    path: "addresses",
    file: "features/profile/AddressesPage.tsx",
  },
  {
    path: "settings",
    file: "features/profile/SettingsPage.tsx",
  },
  {
    path: "profile",
    file: "features/profile/ProfilePage.tsx",
  },
  {
    path: "discover-africa",
    file: "features/home/DiscoverAfricaPage.tsx",
  },
  {
    path: "marketplace",
    file: "features/home/MarketplaceHubPage.tsx",
  },
  {
    path: "artisans/:id",
    file: "features/home/ArtisanProfilePage.tsx",
  },
  {
    path: "chronicles",
    file: "features/home/AfricanChroniclesPage.tsx",
  },
  {
    path: "featured",
    file: "features/home/FeaturedProductsPage.tsx",
  },
  {
    path: "about",
    file: "features/home/AboutUsPage.tsx",
  },
  {
    path: "contact",
    file: "features/home/ContactPage.tsx",
  },
  {
    path: "help",
    file: "features/home/HelpCenterPage.tsx",
  },
  {
    path: "careers",
    file: "features/home/CareersPage.tsx",
  },
  {
    path: "privacy",
    file: "features/home/PrivacyPolicyPage.tsx",
  },
  {
    path: "terms",
    file: "features/home/TermsOfServicePage.tsx",
  },
  {
    path: "returns",
    file: "features/home/ReturnPolicyPage.tsx",
  },
  {
    path: "report-problem",
    file: "features/home/ReportProblemPage.tsx",
  },
  {
    path: "currency",
    file: "features/home/CurrencyPage.tsx",
  },
  {
    path: "language",
    file: "features/home/LanguagePage.tsx",
  },
  {
    path: "account-deletion",
    file: "features/profile/AccountDeletionPage.tsx",
  },
  {
    path: "subscription-success",
    file: "features/premium/SubscriptionSuccessPage.tsx",
  },
  {
    path: "*",
    file: "features/home/NotFoundPage.tsx",
  },
];
