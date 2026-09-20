# Pesapal API 3.0 setup

The Website2 checkout uses Pesapal's server-side API 3.0 flow:

1. The backend creates a pending order and requests a Pesapal payment URL.
2. The customer is redirected to Pesapal.
3. Pesapal redirects to `FRONTEND_URL/payment/success?orderId=<Appwrite order id>`.
4. The success page calls the authenticated status endpoint until the backend verifies the transaction.
5. Pesapal also calls the IPN endpoint for asynchronous status updates.

## Backend environment

Add these variables to `Backend/.env`:

```env
PESAPAL_CONSUMER_KEY=your_consumer_key
PESAPAL_CONSUMER_SECRET=your_consumer_secret
PESAPAL_ENVIRONMENT=sandbox
PESAPAL_NOTIFICATION_ID=registered-ipn-guid
```

Use `production` for live payments. Keep the consumer key and secret on the backend only; do not add them to Website2 `VITE_` variables.

## IPN registration

Register this public HTTPS URL with Pesapal as a `GET` or `POST` IPN URL:

```text
https://<backend-host>/api/payments/pesapal/ipn
```

Copy the returned notification GUID into `PESAPAL_NOTIFICATION_ID`. Localhost is not reachable by Pesapal; use a deployed backend or an HTTPS tunnel during development.

## Appwrite order attributes

Run this once against the same Appwrite project used by the backend before testing checkout:

```bash
node scripts/setup-pesapal-order-attributes.js
```

The script creates optional `pesapalTrackingId`, `pesapalMerchantReference`, `pesapalPaymentMethod`, and `paymentReference` attributes when they are missing.

The payment callback and cancellation URLs are generated from `FRONTEND_URL`. Pesapal callbacks do not contain payment status, so the backend always verifies the amount, currency, and final status using `GetTransactionStatus` before marking an order paid.
