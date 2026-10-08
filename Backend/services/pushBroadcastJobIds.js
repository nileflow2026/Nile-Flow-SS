"use strict";

function campaignPageJobId(campaignId, cursor) {
  return `push-broadcast-${campaignId}-page-${cursor || "start"}`;
}

function campaignDeliveryJobId(deliveryId, manualRetryCount) {
  return `push-broadcast-delivery-${deliveryId}-${manualRetryCount}`;
}

module.exports = {
  campaignDeliveryJobId,
  campaignPageJobId,
};
