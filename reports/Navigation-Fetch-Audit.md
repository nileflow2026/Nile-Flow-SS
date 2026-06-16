# NAVIGATION FETCH AUDIT

## useFocusEffect Inventory

### 1. `BottomTabs.jsx` — useFocusEffect

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| **Screen**     | BottomTabs (all tabs)                                 |
| **Trigger**    | Any tab gains focus                                   |
| **Action**     | Sets `isFocused=true`, on blur sets `isFocused=false` |
| **Calls API?** | No                                                    |
| **Risk**       | 🟢 Safe                                               |

---

### 2. `Explore.jsx` — useFocusEffect

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- | --- | ----------------------------------------- |
| **Screen**     | Explore                                                          |
| **Trigger**    | Explore tab gains focus                                          |
| **Condition**  | Re-fetches if `!lastUpdated                                      |     | Date.now() - lastUpdated > 5 _ 60 _ 1000` |
| **Calls API?** | ✅ `GET /api/customerprofile/fetch-product-mobile`               |
| **How Often?** | Every 5 minutes of focused time                                  |
| **Risk**       | 🟡 Medium — 5-min debounce is reasonable but adds to total reads |

**Code reference**: `Explore.jsx:177-187`

---

### 3. `Cart.jsx` — useFocusEffect

| Field          | Value                                                                                |
| -------------- | ------------------------------------------------------------------------------------ |
| **Screen**     | Cart                                                                                 |
| **Trigger**    | Cart tab gains focus                                                                 |
| **Condition**  | Re-fetches if `cart.length === 0`                                                    |
| **Calls API?** | ✅ `fetchCartItems()` → `GET /api/cart/fetch/${id}`                                  |
| **How Often?** | Every time Cart tab is focused with empty cart                                       |
| **Risk**       | 🟢 Low — only fetches when cart is empty (prevents duplicate fetch when items exist) |

**Code reference**: `Cart.jsx:30-38`

---

### 4. `MyNotificationsScreen.jsx` — useFocusEffect (TWO instances)

#### Instance 1: Mark as read

| Field       | Value                                             |
| ----------- | ------------------------------------------------- |
| **Screen**  | MyNotificationsScreen                             |
| **Trigger** | Screen gains focus                                |
| **Action**  | Calls `POST /api/customernotifications/mark-read` |
| **Risk**    | 🟢 Low (mutation, not read)                       |

#### Instance 2: Refresh notifications list

| Field          | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| **Screen**     | MyNotificationsScreen                                                                  |
| **Trigger**    | Screen gains focus                                                                     |
| **Calls API?** | ✅ `getCustomerNotification()` → `GET /api/customernotifications/customernotification` |
| **How Often?** | EVERY TIME the screen is focused                                                       |
| **Risk**       | 🔴 HIGH — Redundant with mount useEffect                                               |

**Code reference**: `MyNotificationsScreen.jsx:70-80`

**VERDICT**: This is a MAJOR read source. The Notification screen has:

- A mount `useEffect` (line 87-107) that fetches notifications
- A `useFocusEffect` (line 70-80) that ALSO fetches notifications
- This means: mount fetches → blur → focus fetches AGAIN

Each time user switches to Notifications tab, they get a full re-fetch of all notifications.

---

## navigation.addListener Audit

**No instances found** in any screen. The app does not use `navigation.addListener('focus'...)` directly.

---

## Focus/Blur Audit (Indirect via BottomTabs)

**BottomTabs.jsx**: The tab switching mechanism unmounts and remounts tab components via:

```jsx
{
  isFocused && <ActiveComponent />;
}
```

This means EVERY tab switch unmounts the previous tab and remounts the new one, firing ALL their mount effects and useFocusEffects.

**Impact**: Each tab switch triggers a full remount of the destination screen, including all API calls in its useEffect/useFocusEffect.

---

## Screen Fetch Triggers by Severity

| Screen                | Endpoint                                              | Trigger                 | Reads           | Severity  |
| --------------------- | ----------------------------------------------------- | ----------------------- | --------------- | --------- |
| MyNotificationsScreen | `GET /api/customernotifications/customernotification` | Every focus             | 1               | 🔴 HIGH   |
| MyNotificationsScreen | `POST /api/customernotifications/mark-read`           | Every focus             | 0 (write)       | 🟢 Low    |
| Explore               | `GET /api/customerprofile/fetch-product-mobile`       | Every 5 min focus       | 1-5 (paginated) | 🟡 Medium |
| Cart                  | `GET /api/cart/fetch/${id}`                           | Focus (empty cart only) | 1               | 🟢 Low    |
| Home                  | `GET /api/customerprofile/categories`                 | Mount                   | 1               | 🟡 Medium |
| Home                  | `GET /api/customerprofile/fetch-product-mobile`       | FeaturedProducts mount  | 1               | 🟡 Medium |

---

## Navigation Remount Analysis

### BottomTabs Implementation

The tab system uses a conditional render pattern:

```jsx
{
  isFocused && <ActiveComponent />;
}
```

This **destroys and recreates** the active component on every tab switch. This is a critical issue because:

1. All useEffect cleanup functions run on blur
2. All useEffect setup functions run on focus
3. All useFocusEffect callbacks fire on focus
4. All local state is lost

### Impact of Remount Pattern

Each tab switch (Home → Explore → Cart → Notifications → Profile):

- Destroys component tree
- Recreates component tree
- Fires ALL useEffects
- Fires ALL useFocusEffects

### Fix Required

Replace conditional render with a visibility-based approach to prevent remounts.
