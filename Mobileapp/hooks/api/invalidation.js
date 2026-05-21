/**
 * Nile Flow — Query Invalidation Utilities (Mobileapp)
 *
 * Mirrors Website/src/hooks/api/invalidation.js.
 */

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

export const useInvalidation = () => {
  const qc = useQueryClient();

  return {
    invalidateProducts: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all() });
      qc.invalidateQueries({ queryKey: queryKeys.homeFeed.all() });
    },

    invalidateProductDetail: (id) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    },

    invalidateOrders: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all() });
    },

    invalidatePremiumStatus: () => {
      qc.invalidateQueries({ queryKey: queryKeys.premium.all() });
      qc.invalidateQueries({ queryKey: queryKeys.homeFeed.all() });
    },

    invalidateNotifications: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },

    invalidateUserProfile: () => {
      qc.invalidateQueries({ queryKey: queryKeys.user.all() });
    },

    invalidateCart: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.all() });
    },

    invalidateNileMiles: () => {
      qc.invalidateQueries({ queryKey: queryKeys.nileMiles.all() });
    },

    onLogout: () => {
      qc.removeQueries({ queryKey: queryKeys.user.all() });
      qc.removeQueries({ queryKey: queryKeys.orders.all() });
      qc.removeQueries({ queryKey: queryKeys.notifications.all() });
      qc.removeQueries({ queryKey: queryKeys.premium.all() });
      qc.removeQueries({ queryKey: queryKeys.nileMiles.all() });
      qc.removeQueries({ queryKey: queryKeys.cart.all() });
    },
  };
};
