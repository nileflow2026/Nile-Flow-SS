function evaluateReturn(url) {
  const parsed = new URL(url);
  const status = parsed.searchParams.get("status");
  const orderId = parsed.searchParams.get("orderId") || parsed.searchParams.get("order_id") || "demo-order";
  if (status === "cancelled") {
    return { outcome: "cancelled", orderId, message: "Payment Cancelled - Your order has been cancelled and you have been returned to the app." };
  }
  return { outcome: "success", orderId, message: "Payment Successful - Your payment was completed and you have been returned to the app." };
}
["nileflowapp://pesapal-return?status=success&orderId=ORD-1001","nileflowapp://pesapal-return?status=cancelled&orderId=ORD-1001","nileflowapp://pesapal-return?orderId=ORD-1001"].forEach((url) => {
  console.log(url);
  console.log(JSON.stringify(evaluateReturn(url)));
});
