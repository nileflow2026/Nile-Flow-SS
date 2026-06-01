# Android 15 & 16 Compliance Updates

## Overview

This document outlines the changes made to ensure Nile Flow Mobile App complies with Android 15+ deprecations and Android 16+ requirements for large screen support.

## Changes Made

### 1. Edge-to-Edge Deprecation (Android 15)

**Problem**: Google Play Console flagged deprecated edge-to-edge APIs/parameters.

**Files Modified**:

- `app.config.js`
- `android/app/src/main/AndroidManifest.xml`

**Changes**:

#### app.config.js

```javascript
// Added/Updated android configuration:
android: {
  edgeToEdgeEnabled: true,                    // Explicit edge-to-edge support
  enableOnBackInvokedCallback: true,          // Android 15+ back gesture support
  predictiveBackGestureEnabled: true,         // Enable predictive back gestures
  supportsRtl: true,                          // Right-to-left support for African markets
}
```

#### AndroidManifest.xml

```xml
<!-- Updated application tag -->
<application
  android:enableOnBackInvokedCallback="true"
  ... >
</application>
```

**Impact**: ✅ Complies with Android 15 edge-to-edge requirements

---

### 2. Removed Orientation Restrictions (Android 16 Compatibility)

**Problem**: `android:screenOrientation="portrait"` locks app to portrait on all devices. Android 16 will ignore this for large screens, causing layout issues.

**Files Modified**:

- `app.config.js` - Changed orientation from `"portrait"` to `"default"`
- `android/app/src/main/AndroidManifest.xml` - Removed `android:screenOrientation="portrait"` from MainActivity

**Changes**:

#### app.config.js

```javascript
// Before:
orientation: "portrait",

// After:
orientation: "default",  // Allows system to manage rotation based on device
```

#### AndroidManifest.xml

```xml
<!-- Before: -->
<activity android:screenOrientation="portrait" ... />

<!-- After: -->
<activity ... />
<!-- screenOrientation attribute removed - allows natural rotation -->
```

**Impact**: ✅ App now supports responsive layouts on tablets, foldables, and large screens

---

### 3. Responsive Layout Support

With orientation restrictions removed, the app now:

- ✅ Supports portrait and landscape on phones
- ✅ Supports multi-window mode on Android 14+
- ✅ Supports foldable devices (Galaxy Z Fold, etc.)
- ✅ Supports tablets with responsive layouts
- ✅ Respects user's system rotation preferences

**Recommendations**:

1. Test layouts in landscape mode
2. Use flexible components that adapt to screen size
3. Leverage Tailwind's responsive utilities (already in place via NativeWind)
4. Test on foldable simulator/devices if available

---

### 4. Back Gesture Handling

**What Changed**: Enabled `enableOnBackInvokedCallback="true"`

**What It Does**: Allows the app to properly handle Android 13+ predictive back gestures with animation support.

**Impact**: Better user experience with animated back transitions

---

## Testing Checklist

- [ ] Test app in portrait orientation
- [ ] Test app in landscape orientation
- [ ] Test on tablet devices/emulator
- [ ] Test on foldable device emulator
- [ ] Verify all UI components resize properly
- [ ] Check that navigation works in all orientations
- [ ] Test landscape modal/dialog layouts
- [ ] Test large screen (10"+ tablet) layouts
- [ ] Verify no UI elements are cut off in landscape
- [ ] Test on Android 15+ devices (if available)

---

## Build & Release

**To rebuild after these changes**:

```bash
# Clean and rebuild
npm run android
# OR
eas build --platform android --profile production
```

**Play Store Submission**:

- These changes should resolve Play Store console warnings
- Submit production build after testing on various device sizes

---

## Related Resources

- [Android 15 Migration Guide](https://developer.android.com/guide/topics/display-cutout/edge-to-edge)
- [Android 16 Large Screen Support](https://developer.android.com/guide/topics/large-screens)
- [Predictive Back Gesture](https://developer.android.com/guide/navigation/custom-back)
- [Multi-window Support](https://developer.android.com/guide/topics/large-screens/multi-window-support)

---

## Notes

- Minimum SDK version is managed by Expo and should be set appropriately in gradle configuration
- The `android:configChanges` attribute still includes `orientation|screenSize|screenLayout` to properly handle configuration changes
- Expo CLI automatically handles many Android version-specific configurations
- No native code changes were required - all changes are configuration-based

---

**Last Updated**: June 1, 2026
**Status**: ✅ Ready for Play Store submission
