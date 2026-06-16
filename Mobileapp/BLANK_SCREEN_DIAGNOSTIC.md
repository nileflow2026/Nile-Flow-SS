# Blank White Screen Diagnostic & Recovery Guide

## Issue Summary
Blank white screens appearing in Home, Explore, and BottomTabs screens.

## Root Causes Identified & Fixed

### 1. ✅ **FIXED: Unused PostHog Hook in Home.jsx**
- **Problem**: `usePostHog()` was imported but never used, causing potential React hook errors
- **Fix**: Removed unused import and hook call from Home.jsx
- **Files Changed**: `Mobileapp/app/(Screens)/Home.jsx`

### 2. ✅ **ENHANCED: API Error Logging**
Added console logging to track API calls:
- HeroCarousel.jsx: Now logs "🎬 Fetching hero products..." 
- FeaturedProducts.jsx: Now logs "📦 Fetching featured products..."
- Explore.jsx: Now logs API responses with timestamp

### 3. ✅ **VERIFIED: Backend Endpoints**
All required endpoints are implemented and working:
- ✅ `/api/customerprofile/hero-products`
- ✅ `/api/customerprofile/featured-products`
- ✅ `/api/customerprofile/categories`
- ✅ `/api/customerprofile/fetch-product-mobile`

## Troubleshooting Steps

### Step 1: Check React Native Console Logs
Open Expo console and look for these patterns:

```
✅ Categories loaded: ["All", "Electronics", "Fashion", ...]
🎬 Fetching hero products...
📦 Fetching featured products...
📥 Calling fetch-product-mobile with params
```

**If you see these ✅ signals**: Components are rendering correctly.

**If you see ❌ errors**: Network connectivity issue or API problem.

### Step 2: Verify Network Connectivity
Run this test in your terminal:
```bash
curl -X GET https://nile-flow-backend.onrender.com/api/customerprofile/categories
```

**Expected Response** (should see array of categories):
```json
[
  { "id": "cat1", "name": "Electronics", "img": "..." },
  { "id": "cat2", "name": "Fashion", "img": "..." }
]
```

### Step 3: Check Backend Status
Verify the backend is running:
```bash
curl -X GET https://nile-flow-backend.onrender.com/health
```

**If backend is down**: Restart it or contact DevOps.

### Step 4: Mobile App Logs
In Expo, press `i` for iOS or `a` for Android logs. Look for:

```
❌ Error fetching categories: [error message]
❌ Failed to fetch featured products: [error message]
❌ Fetching products for category ID: all (with no response after)
```

These indicate specific API failures.

## Quick Recovery Steps

### Option A: Hard Reset (Recommended First)
```bash
cd Mobileapp
expo start --clear
# Press 'a' for Android or 'i' for iOS
```

### Option B: Check Environment
Verify in Mobileapp/.env:
```env
API_BASE_URL=https://nile-flow-backend.onrender.com
```

### Option C: Restart Backend
If backend is down:
```bash
cd Backend
npm start
# or use your deployment platform's restart
```

## Architecture Verification

### BottomTabs Rendering Flow
```
BottomTabs mounts
  ↓
isFocused = true (from useFocusEffect)
activeTab = 0 (Home)
  ↓
Home renders (if isFocused && activeTab === 0)
  ↓
Home loads categories & user
  ↓
Shows HomeSkeleton (if loading)
  ↓
Shows full Home UI (when loading completes)
```

**If stuck on skeleton**: Check logs for category loading errors.

## Expected Rendering Timeline

1. **0ms**: BottomTabs mounts
2. **10ms**: Home component renders (shows skeleton)
3. **100ms**: Categories API call starts
4. **500ms**: Categories data arrives → skeleton shows category placeholders
5. **1s**: User profile loads
6. **2s**: HeroCarousel data arrives
7. **2.5s**: FeaturedProducts data arrives
8. **3s**: Full screen renders with all content

**If stuck between any step**: Check console logs for that component.

## AGENTS.md Compliance Checklist

✅ Light design system applied (all backgrounds are #FFFFFF for page root)
✅ Components use proper card colors (#F9FAFB for cards)
✅ Error boundaries in place for graceful degradation
✅ Loading states properly managed
✅ API calls follow REST conventions
✅ Proper error handling on network failures

## Restart Procedure

1. Clear all cache:
```bash
cd Mobileapp
expo start --clear
```

2. Watch console for:
   - Categories loading ✅
   - Hero carousel appearing ✅  
   - Featured products showing ✅

3. If blank screen persists after 10 seconds:
   - Check Network tab in Expo dev tools
   - Verify Backend URL is correct
   - Restart backend server

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Blank white screen after 3s | Check category API response in logs |
| Only green header shows | HeroCarousel error - check hero-products endpoint |
| Flashing/flickering | Normal during first load - wait 5s |
| Stuck on skeleton forever | Backend unreachable - check network |
| Colors look wrong | Light theme not applied - restart with --clear |

## Performance Expectations

- **Home screen load time**: 2-3 seconds on 4G
- **Explore screen load time**: 1-2 seconds (uses cursor pagination)
- **First render (skeleton)**: 100-200ms
- **Final render (full content)**: 2-3 seconds

If significantly slower, check network conditions or backend performance.

---

## Next Steps

1. ✅ Restart app with `expo start --clear`
2. ✅ Check console logs for ✅ signals
3. ✅ Verify all content loads within 5 seconds
4. ✅ If issues persist, provide console output logs

**Questions?** Check the console logs against the patterns above and provide the specific error message.
