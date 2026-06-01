# Android 15 Deprecated Edge-to-Edge APIs Resolution

## Overview

Google Play Console reports deprecated Android 15 APIs related to edge-to-edge display configuration. These warnings originate from **third-party library code**, not from Nile Flow's own implementation.

## Deprecated APIs Reported

The following Android 15 deprecated APIs/parameters were flagged:

- `android.view.Window.getStatusBarColor`
- `android.view.Window.setStatusBarColor`
- `android.view.Window.setNavigationBarColor`
- `android.view.Window.getNavigationBarColor`
- `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`
- `LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT`

## Root Cause Analysis

These APIs are being used by library dependencies in the following locations:

| Library                         | Component                                  | Reason                        |
| ------------------------------- | ------------------------------------------ | ----------------------------- |
| **react-native**                | `StatusBarModule.setColor$1.runGuarded`    | Status bar color management   |
| **react-native**                | `WindowUtilKt.enableEdgeToEdge`            | Edge-to-edge display setup    |
| **react-native-screens**        | `ScreenWindowTraits.setColor`              | Navigation between screens    |
| **react-native-screens**        | `ScreenWindowTraits.setNavigationBarColor` | Navigation bar customization  |
| **@stripe/stripe-react-native** | `CustomerSheet.onCreate`                   | Payment sheet UI              |
| **@stripe/stripe-react-native** | `Stripe3ds2TransactionActivity.onCreate`   | 3D Secure authentication      |
| **@react-native-material/core** | `BottomSheetDialog.onCreate`               | Material Design bottom sheets |
| **expo-image-picker**           | `ExpoCropImageUtils.applyWindowTheming`    | Image cropping UI             |

## Why This Happens

Android 15 deprecated the direct `Window` methods in favor of the **WindowInsets API**. This provides:

- Better handling of system UI (status bar, navigation bar, system gestures)
- Support for dynamic system colors
- Per-application edge-to-edge control

Library authors are gradually migrating to the new API. During the transition period, using their libraries triggers these warnings.

## Resolution Strategy

### 1. Current Configuration ✅

Our `app.config.js` is already optimized for edge-to-edge:

```javascript
android: {
  edgeToEdgeEnabled: true,                    // Enable edge-to-edge rendering
  enableOnBackInvokedCallback: true,          // Use modern back gesture API
  predictiveBackGestureEnabled: true,         // Support predictive back animations
  supportsRtl: true,                          // RTL support for African markets
}
```

Our `gradle.properties` enables edge-to-edge support:

```gradle
edgeToEdgeEnabled=true
```

### 2. Library Updates Strategy

The following approach is recommended:

**Current Status:**

- `react-native-screens`: 4.25.2 (using deprecated APIs)
- `@stripe/stripe-react-native`: 0.64.0 (using deprecated APIs)
- `react-native-paper`: 5.15.0 (Material Design, uses deprecated APIs)

**Action Items:**

- ✅ Monitor library releases for Android 15+ migration
- ✅ Plan incremental updates as libraries release WindowInsets-compatible versions
- ✅ Test thoroughly before updating (breaking changes possible)

### 3. Non-Breaking Alternatives

**If urgent - Workarounds:**

1. **Suppress Warnings** (Not recommended for production):
   - Add to `android/app/build.gradle`:

   ```gradle
   android {
     ...
     lint {
       disable 'DeprecatedMethod'
     }
   }
   ```

2. **Update Build Tools** (Safe approach):
   - Ensure compileSdkVersion is set to 35+ (Android 15)
   - Use Gradle 8.3+
   - Update Android Gradle Plugin to 8.3+

3. **Monitor Library Roadmaps**:
   - react-native: Tracking [React Native 0.76+ planned deprecation updates](https://github.com/facebook/react-native/releases)
   - Stripe: [Stripe Android SDK migration efforts](https://github.com/stripe/stripe-android)

## No App Functionality Impact

⚠️ **Important**: These warnings do **NOT**:

- Prevent the app from running
- Break any functionality
- Affect end users
- Cause crashes or errors

They are compile-time lint warnings about API deprecation, similar to Java deprecation warnings.

## Testing Checklist

- [x] App builds successfully
- [x] Edge-to-edge rendering works (status bar and nav bar transparent/integrated)
- [x] Status bar color adapts to light/dark theme
- [x] Navigation bar color matches system theme
- [x] Payment flows work correctly (Stripe)
- [x] Image picker and cropping work
- [x] Material Design components render properly
- [x] Back gesture animations work smoothly
- [x] RTL layout support works

## Recommended Next Steps

### Short Term (Next 1-2 months)

1. Monitor Expo SDK 57+ releases for updated dependencies
2. Track React Native 0.76+ release for WindowInsets API support
3. Test latest Stripe SDK version compatibility

### Medium Term (2-3 months)

1. Update `react-native-screens` when WindowInsets-compatible version releases
2. Update `@stripe/stripe-react-native` when fully compatible version releases
3. Update Material Design dependencies

### Long Term (3-6 months)

1. Migrate to fully WindowInsets-compatible library versions
2. Remove all lint warnings from Play Store Console
3. Prepare for Android 16+ compliance (large screen support - already done)

## References

- [Android 15 Edge-to-Edge Migration Guide](https://developer.android.com/guide/topics/display-cutout/edge-to-edge)
- [WindowInsets API Documentation](https://developer.android.com/reference/android/view/WindowInsets)
- [React Native 0.75 Deprecation Updates](https://github.com/facebook/react-native/releases)
- [Expo SDK Release Notes](https://docs.expo.dev/workflow/upgrading-expo-sdk/)
- [Play Store Console Policy](https://support.google.com/googleplay/android-developer/answer/11926078)

## Communication Strategy

When submitting app updates to Play Store:

1. **Initial Review** - Warnings will appear, but shouldn't block release
2. **Google Review** - Play Store team typically approves apps with deprecation warnings from dependencies
3. **Long-term** - Gradually update libraries as they release compatible versions

---

**Last Updated**: June 1, 2026  
**Status**: ⚠️ Warnings Present (Expected) - App Functions Normally  
**Priority**: Medium (No immediate user impact, address in upcoming dependency upgrades)
