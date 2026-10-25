# 0003. Website2 business showcase and live vendor directory

**Date**: 2026-10-25
**Status**: In Progress

## Summary

The home page, business directory, and business profiles will read real vendor data through the Backend API. The Backend will expose only public store details for active vendors, and the Website2 pages will show clear loading, empty, and retry states. The current sample businesses will no longer appear as live listings.

## Context

The existing business showcase uses twelve fictional records and local artwork. The Backend already stores vendor profiles in Appwrite and has a public endpoint for reading one vendor, but that endpoint includes contact details and does not provide a public directory. Vendor records have an `isActive` field controlled by the admin interface. They do not have an approval status.

The Website2 directory needs a safe, paginated read path for live vendor records. It must not expose private vendor fields or make fictional sample content appear real when the API is unavailable. The existing store profile endpoint remains in use by the store page and will not be broadened for directory use.

## Requirements

**User stories**:

* As a shopper, I want to discover active businesses from the home page so that I can explore real marketplace stores.
* As a shopper, I want to browse and filter a directory of active businesses so that I can find a store by category.
* As a shopper, I want to open a business profile and visit its store so that I can learn about the vendor and continue shopping.
* As a vendor, I want only public store details to appear so that private account information remains private.

**Acceptance criteria**:

* **AC-1**: Keep the Businesses section after deals and before featured products. Show up to six active vendors in the home banner rail, ordered newest first, with a `See all businesses` link to `/businesses`. Selecting a banner opens that vendor profile.
* **AC-2**: Replace the twelve static sample records with records loaded from the Backend API. The directory shows live active vendors in pages of 24, newest first, with a `Load more` control when more records are available. Do not show local sample records as a fallback.
* **AC-3**: Keep the public `/businesses` page and its responsive business banner grid. Build the category selector from distinct category values returned for active vendors. Selecting a category requests matching results from the Backend and resets the loaded list. An empty result shows a clear message and a control to return to all categories.
* **AC-4**: Keep the public `/businesses/:businessId` profile route. Use the vendor document ID as the route value. Show the public vendor details and a `Visit store` link to `/store/:vendorId` for an active vendor. A missing or inactive vendor uses the existing not found behavior.
* **AC-5**: Add public read only Backend endpoints for the paginated business directory and one business profile. The directory endpoint returns only active vendor records, using the existing `VENDOR_DATABASE_ID` and `VENDOR_COLLECTION_ID` configuration. It supports a positive page number, a page size capped at 100 with a default of 24, and an optional category filter. The response includes business records, available categories, and pagination details. The profile endpoint returns a record only when the vendor is active.
* **AC-6**: Return only these public fields from the new endpoints: vendor document ID, store name, name fallback, store description, category, public location, city, country, cover image, profile image, and creation date. Never return email, phone, WhatsApp, street address, password, tokens, financial details, or other private fields. Do not change the existing single vendor endpoint used by the store page.
* **AC-7**: Map vendor data consistently. Use `storeName` then `name` for the displayed name, `storeDescription` for the introduction, `category` for the category, and city plus country when present, otherwise the vendor supplied public `location`. Use `coverImage`, then `profileImage`, then `/logo.png` for business artwork. Generate accessible image text from the returned business details.
* **AC-8**: Show explicit loading, empty, and error states. On API failure, show a retry action and do not substitute sample data. If loading more fails, keep already loaded records and allow that page to be retried. If an image fails, use `/logo.png`.
* **AC-9**: Keep category selection, business links, pagination, and retry controls keyboard accessible with clear accessible names. Reuse Website2's shared API client, service pattern, page shell, banner component, and existing design tokens.
* **AC-10**: Keep the directory and profile routes public, canonical, `noindex,follow`, and excluded from the sitemap for this change. A separate search visibility decision is needed before indexing live listings.
* **AC-11**: Do not add database collections, migrations, frontend access to Appwrite, dependencies, or new environment variables. Validate endpoint query parameters and use existing Backend request limiting and error handling patterns.

## Options considered

### Option 1: Keep the local sample directory

Continue to use the twelve fictional businesses and add live data in a later phase.

**Pros**:

* No Backend work is needed now.
* Existing artwork and ordering stay unchanged.

**Cons**:

* The directory does not show current vendors.
* Sample records can be mistaken for active businesses if mixed with live data.

### Option 2: Reuse and extend the existing public vendor profile endpoint

Add directory listing behavior to the existing endpoint and reuse its vendor response shape.

**Pros**:

* Fewer Backend routes and service functions.
* The store page already uses the endpoint for a vendor profile.

**Cons**:

* Its current response includes contact fields and is not a safe directory contract.
* Changing its response could affect the existing store page.
* It does not currently filter inactive vendors.

### Option 3: Add separate sanitized business read endpoints

Add a paginated public directory endpoint and a public business profile endpoint with an explicit field allowlist.

**Pros**:

* The public response contains only the information needed by the directory.
* Existing store page behavior stays unchanged.
* Active filtering and pagination are enforced by the Backend.

**Cons**:

* Adds a small, separate Backend API surface to maintain.
* The Backend and Website2 changes need to be deployed in order.

## Decision

**Chosen option**: Option 3: Add separate sanitized business read endpoints

Use the existing Appwrite vendor collection through the Backend, and expose live business records through new public read only endpoints. Include vendors when `isActive` is true. The vendor data has no approval status, so do not add a new approval field or workflow.

## Rationale

The current vendor collection and admin controls already use `isActive` to represent whether a vendor is active. Adding an approval model would expand this integration into a separate administrative workflow. A dedicated Backend projection is safer than reusing the current single vendor response, which includes contact information and serves a different store page.

The Website2 API client already centralizes network requests and error handling. Using it keeps credentials and Appwrite access on the Backend and gives the directory a clear error path. Keeping search exclusion in place avoids implying that dynamic client rendered pages are ready for search indexing.

## Feature design

**Data model sketch**:

| Entity | Fields | Source and constraints |
|---|---|---|
| `PublicBusiness` | `id`, `storeName`, `name`, `storeDescription`, `category`, `location`, `city`, `country`, `coverImage`, `profileImage`, `createdAt` | Projected from a vendor document. Optional values may be absent. Only active vendors are returned. |
| `BusinessPage` | `businesses`, `categories`, `page`, `limit`, `total`, `totalPages` | Returned by the directory endpoint. `limit` defaults to 24 and cannot exceed 100. |

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/customerprofile/businesses` | GET | `page`, `limit`, optional `category` | Public businesses, category values, pagination details | Public | 400 invalid query, 500 read failure |
| `/api/customerprofile/businesses/:businessId` | GET | Vendor document ID | One active public business | Public | 404 missing or inactive vendor, 500 read failure |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Render home business rail | Up to six newest active vendors | First page from the business directory endpoint |
| Render directory list | Active vendor records and page totals | Directory endpoint response |
| Render category selector | Category options | Distinct categories in the directory endpoint response |
| Filter directory | Businesses matching a category | Optional `category` parameter sent to the directory endpoint |
| Order business records | Newest first | Appwrite `$createdAt` descending |
| Render profile | Business name, description, category, location, and ID | Public vendor projection from the profile endpoint |
| Render business name | `storeName` or fallback `name` | Public vendor projection |
| Render location | City and country when present, otherwise public location | Public vendor projection; never the street address field |
| Render business artwork | Cover image, profile image fallback, then `/logo.png` | `coverImage`, `profileImage`, Website2 public asset |
| Render store link | `/store/:vendorId` | Active vendor document ID |
| Render image alternative text | Name, category, location, description, and business context | Public vendor projection |
| Render API failure | Error message and retry control | Failed endpoint request |
| Render unavailable profile | Existing not found page | Profile endpoint 404 |
| Render page metadata | Canonical URL and `noindex,follow` | Existing `SeoHead` behavior and business route |

**Key invariants**:

* Only vendor documents with `isActive: true` are returned.
* The Backend response uses an explicit allowlist and never includes private vendor fields.
* Website2 does not call Appwrite directly.
* No fictional sample record is shown as a fallback for live data.
* A failed request remains an error state, not an empty success state.
* Directory pages contain at most 100 records per response and load more only when another page exists.
* Live business pages remain excluded from indexing and the sitemap until search visibility is separately approved.

**Security model**:

The directory and profile endpoints are public, read only endpoints. They use the Backend's Appwrite service credentials and return only an explicit public field allowlist. They do not expose contact fields, street address, authentication data, financial data, or vendor write operations. The Backend filters inactive vendors before returning any business data.

**Configuration required**:

No new configuration is required. The Backend uses the existing `VENDOR_DATABASE_ID` and `VENDOR_COLLECTION_ID` values.

**Critical test scenarios**:

* Happy path: a signed out shopper sees active vendors on the home page, loads the directory, filters by a returned category, opens a profile, and visits its store, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, and **AC-7**.
* Failure case: Backend errors show retry, an empty category shows the reset control, an inactive profile is not found, and broken images use `/logo.png`, verifies **AC-3**, **AC-4**, and **AC-8**.
* Auth and permission: a public request returns only allowlisted fields, including no contact, address, password, token, or financial fields, verifies **AC-5**, **AC-6**, and **AC-11**.
* Pagination: a page returns no more than the requested capped limit, ordering is newest first, and loading another page does not duplicate records, verifies **AC-2**, **AC-5**, and **AC-8**.

## Migration plan

**Strategy**: Deploy the Backend endpoint before Website2 uses it. No database migration is required.

**Phases**:

1. Deploy and verify the public read only endpoints against active vendor records.
2. Deploy Website2 with the directory service, loading and retry states, and live profile mapping.
3. Confirm that inactive vendors and private fields are not returned before announcing the live directory.

**Rollback**: If the Website2 release fails, roll back Website2 to the prior labeled sample experience. The new Backend read endpoints can remain deployed because they are additive and read only.

**Risks**: Deploying Website2 before the Backend endpoints will show request errors. Vendor records with missing optional public fields will have less profile detail and will use the image fallback when necessary.

## Build plan

1. Add validated, paginated Backend directory and profile endpoints using an explicit public field projection and active filtering. Keep the existing store profile endpoint unchanged, satisfies **AC-5**, **AC-6**, and **AC-11**.
2. Add the Website2 business API service and map the response into the existing banner, directory, and profile views. Remove sample records from the live experience, satisfies **AC-2**, **AC-4**, and **AC-7**.
3. Connect the home rail and directory to the API, including newest first ordering, live category selection, pagination, and empty states, satisfies **AC-1**, **AC-2**, and **AC-3**.
4. Add loading, retry, pagination failure, missing profile, and image fallback states, satisfies **AC-4** and **AC-8**.
5. Preserve keyboard access, current canonical metadata, `noindex,follow`, and sitemap exclusion, satisfies **AC-9** and **AC-10**.
6. Add Backend and Website2 tests for active filtering, response allowlists, pagination, category filtering, profile lookup, loading and failure behavior, image fallback, and route metadata, satisfies **AC-1** through **AC-11**.

## Consequences

**Positive**:

* Shoppers see the current active vendor collection without a Website2 code release for each listing.
* The Backend remains the only layer with Appwrite access.
* Private vendor fields stay outside the directory API contract.

**Negative / tradeoffs**:

* The Website2 pages depend on Backend availability and must show retry states during outages.
* Real vendor records may not have every optional profile field or image.
* The Backend and Website2 deployments must be coordinated.

**Neutral**:

* The six home banners now reflect the newest active vendors rather than a curated static order.
* The directory remains excluded from search until a separate indexing and sitemap decision.
* Existing sample SVG assets may be retained for a future demo, but they are not used as live listing data.

## Follow-up

* [ ] Decide whether to make live business pages indexable and add dynamic sitemap coverage.
* [ ] Confirm that vendor category values are maintained consistently by the vendor onboarding flow.
