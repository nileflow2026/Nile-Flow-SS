# Enhancement 01: Seamless Location Acquisition

## 1. Overview

This document proposes an enhancement to the Nile Flow mobile application that allows customers to use their device's current location as their delivery address during account registration.

Instead of having to type their location manually, customers can grant the app permission to access their current location. The app can then detect the location, convert it into a readable address, and allow the customer to review and confirm it.

Once confirmed, the location will be saved to the customer's account as their default delivery location.

## 2. Problem Statement

Currently, customers are required to enter their location manually during account registration.

This process can be inconvenient, time-consuming, and may result in incorrect or incomplete addresses.

Customers may also find it difficult to describe their exact location, especially when they are unfamiliar with the address format.

## 3. Proposed Solution

Introduce a location acquisition feature that allows customers to use their device's GPS to identify their current location during registration.

The proposed feature will:

- Request the customer's permission to access their current location.
- Retrieve the customer's location using GPS when permission is granted.
- Convert the coordinates into a readable address using reverse geocoding, where available.
- Allow the customer to review and edit the detected address.
- Save the address to the customer's account after explicit confirmation.
- Provide manual address entry as an alternative.

The feature will only access location when the customer actively chooses to use it. It will not continuously track the customer's location.

## 4. Proposed Customer Journey

### A. Automatic Location Acquisition

1. The customer begins creating an account.
2. The app explains why location access is needed. For example:

   "Nile Flow would like to access your location to make deliveries easier."

3. The customer chooses to use their current location.
4. The device displays its location permission prompt.
5. If permission is granted, the app retrieves the customer's current GPS coordinates.
6. The coordinates are converted into a readable address where possible.
7. The customer reviews the detected address and can make corrections.
8. The customer confirms the address.
9. The confirmed address is saved to their account as their default delivery location.

The app must not save or use an unconfirmed detected address as the customer's default location.

### B. Manual Location Entry

If the customer declines location permission, GPS is unavailable, or the customer prefers not to use GPS, they should be able to enter their address manually.

The customer can then review and confirm the address before it is saved to their account as their default delivery location.

## 5. Use of Saved Location During Orders

After registration, the saved location will automatically be selected as the customer's default delivery location whenever they place a future order.

The customer should also be able to:

- Use the saved default location during checkout.
- Change the delivery location for an individual order.
- Update their saved default delivery location if they move or need to use another address.

Changing the delivery location for one order should not automatically change the customer's saved default address unless they explicitly choose to update it.

## 6. Proposed Technology

The following technologies are proposed for implementing this feature:

| Technology | Purpose |
|---|---|
| React Native | Mobile application development |
| Expo | Mobile development framework and device API access |
| Expo Location | Accessing the device's foreground location |
| TypeScript | Application development language |
| Reverse Geocoding | Converting GPS coordinates into readable addresses |

The final implementation should be checked against the existing MobileApp project's structure, dependencies, and Expo SDK version before development begins.

## 7. Privacy and Security Considerations

Customer privacy must be considered throughout the implementation.

The proposed feature should follow these principles:

- Request location permission only when the customer chooses to use the feature.
- Explain clearly why location access is required.
- Use foreground location access only.
- Do not track customers continuously or in the background.
- Do not save an automatically detected address before the customer confirms it.
- Allow customers to enter their address manually.
- Protect saved delivery addresses through the application's existing authentication and data protection mechanisms.

## 8. Expected Benefits

The proposed enhancement is expected to:

- Make account registration easier and faster.
- Reduce the effort required to enter delivery addresses.
- Reduce errors caused by manually entered addresses.
- Improve the accuracy of delivery location information where GPS and address data are available.
- Improve the overall customer experience.
- Make future checkout processes more convenient by using the customer's saved default location.

## 9. Implementation Considerations

Before implementation, the following should be considered:

- Confirm compatibility with the existing MobileApp project.
- Determine how the mobile application will communicate with the backend to save, retrieve, and update customer delivery locations.
- Confirm the backend data structure required for storing customer addresses and, where appropriate, location coordinates.
- Handle cases where location permission is denied or GPS is unavailable.
- Account for incomplete or approximate reverse-geocoded addresses.
- Allow additional address details such as estate, building, apartment, floor, landmark, and delivery instructions.
- Ensure customers can review and correct their addresses before saving.

Backend integration details will need to be confirmed with the Nile Flow backend team.

## 10. Scope and Limitations

This enhancement focuses on:

- Location acquisition during account registration.
- Manual address entry as an alternative.
- Customer review and confirmation of delivery addresses.
- Saving a confirmed address as the customer's default delivery location.
- Reusing the saved default location during future orders.
- Allowing customers to change their delivery location at checkout or update their saved default address.

This enhancement does not include:

- Background location tracking.
- Continuous monitoring of customer movements.
- Automatic location changes without customer confirmation.
- Nearby product recommendations based on customer location.

## 11. Testing Requirements

The feature should be tested against the following scenarios:

1. Customer grants location permission and successfully retrieves their location.
2. Customer denies location permission and enters an address manually.
3. GPS is unavailable or location retrieval fails.
4. Reverse geocoding returns an incomplete or approximate address.
5. Customer edits