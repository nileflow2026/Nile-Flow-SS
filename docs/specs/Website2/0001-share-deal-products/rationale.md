# Rationale: Share deal products from Website2

## Context

The Website2 Deals page displays discounted products with a price, original price, discount percentage, and an optional expiry time. Each product already has a detail route that shoppers can open directly.

Shoppers want to tell other people about these offers on WhatsApp and other social platforms. Sharing must not imply that Website2 can post to a shopper's status or profile without their involvement. The shopper chooses a destination and completes the post in the selected app or platform. WhatsApp, X, and Telegram can open with the complete offer message and deal link. Facebook's share dialog receives the deal link and creates its own preview from the linked page.

## Options considered

### Option 1: Add a deal share chooser to each card

Keep the existing deal card and add an accessible chooser with device sharing, direct sharing options for WhatsApp, Facebook, X, and Telegram, and a copy link action.

**Pros**:
- Uses the deal data and route already available on the page.
- Works across devices without requesting social account access.
- Keeps sharing actions available when device sharing is unsupported.
- Provides direct access to several social platforms without restricting shoppers to one network.

**Cons**:
- Some browsers do not support the device share sheet.
- The shopper must finish the action in the selected sharing app.

### Option 2: Use only the device share sheet

Add one action that opens the browser or device share sheet.

**Pros**:
- Requires little interface and uses the browser's available share targets.
- Lets each device offer its own apps and destinations.

**Cons**:
- The share sheet is not supported in every browser.
- Shoppers cannot rely on seeing a direct platform choice or copy option.

### Option 3: Generate a share image for each deal

Create an offer image containing the product and discount, then provide it for status and social sharing.

**Pros**:
- An image can be useful in visual social feeds and statuses.
- The offer details can appear without opening a link.

**Cons**:
- Adds image generation, download, and maintenance work beyond the requested link sharing.
- Image sharing support differs by browser and social app.

## Rationale

The Deals page already provides the offer values and a route for each product. A share chooser can use these sources directly, so its message can match the offer the shopper sees without introducing another product data path.

The device share sheet reaches apps installed on a shopper's device, while direct platform links make common destinations easy to find without suggesting that one network is preferred. Each destination receives the format it supports. Creating an image or social account integrations would add complexity and permissions without being needed to share the offer text and link.
