import { useCallback } from "react";
import { usePostHog } from "posthog-react-native";
import {
  trackConversion as trackLegacyConversion,
  trackEvent as trackLegacyEvent,
  trackPageView as trackLegacyPageView,
} from "../utils/analytics";

export default function useAnalytics() {
  const posthog = usePostHog();

  const trackEvent = useCallback(
    (eventName, eventData = {}) => {
      try {
        if (__DEV__) {
          console.log("📊 PostHog Event:", eventName, eventData);
        }

        if (posthog?.capture) {
          posthog.capture(eventName, eventData);
        }

        trackLegacyEvent(eventName, eventData);
      } catch (error) {
        console.warn("Analytics tracking failed", error);
      }
    },
    [posthog],
  );

  const trackPageView = useCallback(
    (pageName, pageUrl) => {
      trackEvent("page_view", {
        page_title: pageName,
        page_location: pageUrl,
      });
      trackLegacyPageView(pageName, pageUrl);
    },
    [trackEvent],
  );

  const trackConversion = useCallback(
    (conversionType, value, currency = "KES") => {
      trackEvent("conversion", {
        conversion_type: conversionType,
        value,
        currency,
      });
      trackLegacyConversion(conversionType, value, currency);
    },
    [trackEvent],
  );

  const trackPremiumEvent = {
    viewPremiumPage: () =>
      trackEvent("premium_page_view", {
        event_category: "premium",
        event_label: "subscription_page",
      }),
    clickUpgrade: (source) =>
      trackEvent("premium_upgrade_click", {
        event_category: "premium",
        event_label: "upgrade_button",
        source,
      }),
    initiateSubscription: (paymentMethod) =>
      trackEvent("premium_subscription_initiated", {
        event_category: "premium",
        event_label: "payment_started",
        payment_method: paymentMethod,
      }),
    subscriptionSuccess: (paymentMethod, amount) =>
      trackEvent("premium_subscription_success", {
        event_category: "premium",
        event_label: "subscription_completed",
        payment_method: paymentMethod,
        value: amount,
        currency: "KES",
      }),
    subscriptionFailed: (paymentMethod, errorMessage) =>
      trackEvent("premium_subscription_failed", {
        event_category: "premium",
        event_label: "payment_failed",
        payment_method: paymentMethod,
        error_message: errorMessage,
      }),
    viewMonthlySummary: (totalSavings, netSavings) =>
      trackEvent("premium_summary_view", {
        event_category: "premium",
        event_label: "monthly_summary",
        total_savings: totalSavings,
        net_savings: netSavings,
      }),
    refreshSummary: () =>
      trackEvent("premium_summary_refresh", {
        event_category: "premium",
        event_label: "manual_refresh",
      }),
    shareSavings: (platform, totalSavings) =>
      trackEvent("premium_share_savings", {
        event_category: "premium",
        event_label: "social_share",
        platform,
        total_savings: totalSavings,
      }),
    orderWithDiscount: (orderTotal, discountAmount, discountPercentage) =>
      trackEvent("premium_order_placed", {
        event_category: "premium",
        event_label: "order_with_discount",
        order_value: orderTotal,
        discount_amount: discountAmount,
        discount_percentage: discountPercentage,
      }),
    earnBonusMiles: (baseMiles, bonusMiles, totalMiles) =>
      trackEvent("premium_miles_earned", {
        event_category: "premium",
        event_label: "miles_bonus",
        base_miles: baseMiles,
        bonus_miles: bonusMiles,
        total_miles: totalMiles,
      }),
    freeDelivery: (orderTotal, deliverySavings) =>
      trackEvent("premium_free_delivery", {
        event_category: "premium",
        event_label: "shipping_waived",
        order_value: orderTotal,
        delivery_savings: deliverySavings,
      }),
    viewPremiumDeals: () =>
      trackEvent("premium_deals_view", {
        event_category: "premium",
        event_label: "exclusive_deals",
      }),
    cancelSubscription: (reason) =>
      trackEvent("premium_subscription_cancelled", {
        event_category: "premium",
        event_label: "churn",
        cancellation_reason: reason,
      }),
    renewSubscription: (paymentMethod) =>
      trackEvent("premium_subscription_renewed", {
        event_category: "premium",
        event_label: "renewal",
        payment_method: paymentMethod,
      }),
  };

  return {
    posthog,
    trackEvent,
    trackPageView,
    trackConversion,
    trackPremiumEvent,
  };
}
