# 0001 · Mobile deal cart pricing

**Status**: Assumed
**Date**: 2026-10-04
**Authorized by**: Anthony, during /develop

## Owed decision
Confirm the authoritative source and validity window for a deal price during cart and payment processing, including the behavior for an expired or inactive deal.

## Assumption built on
The backend deals collection is authoritative for a deal price. A deal is current when its document has `isDeal` or `isFlash`, `active` is not false, and `dealEndTime` is in the future. A `premiumDeal` also requires an active Premium subscription. The backend revalidates the deal when adding it to the cart and when creating payment or order totals. Expired, inactive, deleted, mismatched, or unauthorized deals are rejected with a clear error; they are not silently repriced as regular products. If a deal price changed since the cart was last refreshed, checkout asks the user to refresh and review the current price before continuing. The client may identify a deal, but never supplies a trusted price. Deal amounts use the existing KES base currency and server currency conversion.

## Code area
`Mobileapp/app/(Screens)/DealDetails.jsx`, `Mobileapp/Context/CartContext_NEW.js`, `Mobileapp/app/(Screens)/Cart.jsx`, `Backend/controllers/UserControllers/cartController.js`, `Backend/utils/serverPricing.js`, payment and order pricing callers.

## Requirements
- A user can add an active deal to their cart and see the deal price and savings.
- The backend verifies deal identity, product association, active state, and end time.
- Cart and payment totals are recalculated on the server using current deal records.
- Expired or invalid deals cannot be charged at their former deal price.

## Ratify
This decision was recorded by /develop, not deliberated. Run `/architect Mobileapp deal cart pricing` to deliberate and ratify it. Until then it stays flagged as an owed decision; it does not block marking the feature `done`.
