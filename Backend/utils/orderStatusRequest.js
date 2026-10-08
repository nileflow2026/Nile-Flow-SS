"use strict";

function getRequestedOrderStatus(body) {
  const orderStatus = body?.orderStatus ?? body?.status;
  return typeof orderStatus === "string" ? orderStatus.trim() : "";
}

module.exports = { getRequestedOrderStatus };
