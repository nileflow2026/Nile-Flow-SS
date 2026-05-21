/**
 * Nile Flow — Query Invalidation Utilities (Website)
 *
 * Domain-specific cache invalidation functions.
 * Call these after mutations instead of doing ad-hoc invalidateQueries.
 *
 * Usage:
 *   import { useInvalidation } from '@/hooks/api/invalidation';
 *   const { invalidateOrders, invalidatePremiumStatus } = useInvalidation();
 *
 *   // After a successful order cancellation:
 *   invalidateOrders();
 *
 *   // After subscribing to premium:
 *   invalidatePremiumStatus();
 */

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

export const useInvalidation = () => {
  const qc = useQueryClient();

  return {
    // ── Products ─────────────────────────────────────────────────────────────

    invalidateProducts: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all() });
      // Also invalidate home feed since it contains featured products
      qc.invalidateQueries({ queryKey: queryKeys.homeFeed.all() });
    },

    invalidateFeaturedProducts: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.featured() });
      qc.invalidateQueries({ queryKey: queryKeys.homeFeed.all() });
    },

    invalidateProductDetail: (id) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    },

    // ── Orders ───────────────────────────────────────────────────────────────

    invalidateOrders: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all() });
    },

    // ── Premium ──────────────────────────────────────────────────────────────

    invalidatePremiumStatus: () => {
      qc.invalidateQueries({ queryKey: queryKeys.premium.all() });
      // Home feed includes premium status and deals
      qc.invalidateQueries({ queryKey: queryKeys.homeFeed.all() });
    },

    // ── Notifications ─────────────────────────────────────────────────────────

    invalidateNotifications: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },

    // ── User Profile ──────────────────────────────────────────────────────────

    invalidateUserProfile: () => {
      qc.invalidateQueries({ queryKey: queryKeys.user.all() });
    },

    // ── Categories ────────────────────────────────────────────────────────────

    invalidateCategories: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all() });
      qc.invalidateQueries({ queryKey: queryKeys.homeFeed.all() });
    },

    // ── Cart ──────────────────────────────────────────────────────────────────

    invalidateCart: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.all() });
    },

    // ── Nile Miles ────────────────────────────────────────────────────────────

    invalidateNileMiles: () => {
      qc.invalidateQueries({ queryKey: queryKeys.nileMiles.all() });
    },

    // ── Full Reset (use sparingly — e.g., on logout) ───────────────────────────

    invalidateAll: () => {
      qc.clear();
    },

    // ── Auth Logout ───────────────────────────────────────────────────────────

    onLogout: () => {
      // Remove user-specific queries immediately; keep static content
      qc.removeQueries({ queryKey: queryKeys.user.all() });
      qc.removeQueries({ queryKey: queryKeys.orders.all() });
      qc.removeQueries({ queryKey: queryKeys.notifications.all() });
      qc.removeQueries({ queryKey: queryKeys.premium.all() });
      qc.removeQueries({ queryKey: queryKeys.nileMiles.all() });
      qc.removeQueries({ queryKey: queryKeys.cart.all() });
    },
  };
};
