# Google Play Deobfuscation File Upload Guide

**Issue**: Google Play warning about missing deobfuscation file for R8-minified builds  
**Solution**: Upload the `mapping.txt` file to Google Play Console  
**Status**: ✅ Configuration Ready

---

## What is a Deobfuscation File?

When you use R8/ProGuard minification (which we do to prevent VideoViewModule crashes), the build:

1. ✅ **Reduces app size** by minifying code
2. ✅ **Protects code** by obfuscating class/method names
3. ❌ **Breaks crash stack traces** — original names are lost

The `mapping.txt` file maps obfuscated names back to original names so Google Play can decode crash logs.

**Example**:

- Obfuscated: `a.b.c$1 → com.nileflowafrica.LoginScreen`
- Readable: Users see the real class name in crashes

---

## Finding the Mapping File

After each EAS build, the mapping file is located at:

```
Mobileapp/android/app/build/outputs/mapping/release/mapping.txt
```

### Step 1: Locate After Build Completes

```bash
# After running: eas build --platform android

# The file should be at:
ls -la Mobileapp/android/app/build/outputs/mapping/release/mapping.txt
```

### Step 2: Copy for Upload

```bash
# Create a backup before uploading to Play Store
cp Mobileapp/android/app/build/outputs/mapping/release/mapping.txt ./mapping_v1.1.4_build13.txt

# Keep this file for version 1.1.4 (version code 13)
```

---

## Uploading to Google Play Console

### Method 1: Upload via Google Play Console Web UI (Recommended)

1. **Go to Google Play Console**
   - Navigate to: https://play.google.com/console
   - Select Nile Flow app

2. **Go to Release > Production**
   - Click on version **1.1.4** (version code 13)
   - Look for "App Signing" or "Deobfuscation files" section

3. **Upload Mapping File**
   - Click "Upload deobfuscation file" or similar button
   - Select `mapping.txt` from:
     ```
     Mobileapp/android/app/build/outputs/mapping/release/mapping.txt
     ```

4. **Confirm Upload**
   - File should show as "Uploaded"
   - Status changes to ✅

### Method 2: Upload via Google Play API

For automated uploads (if using CI/CD):

```bash
# Using bundletool
bundletool set-obb-apps \
  --obb=Mobileapp/android/app/build/outputs/mapping/release/mapping.txt \
  --app=nile_flow

# Or use Play Console API client library
```

---

## File Format & Validation

### Verify Mapping File Content

```bash
# Check first few lines
head -20 mapping.txt

# Output should look like:
# com.nileflowafrica.screens.LoginScreen -> a.b.c:
#     android.widget.EditText mPasswordField -> a
#     android.widget.Button mLoginButton -> b
#     void onClick(android.view.View) -> onClick
```

### File Size

- Typical size: 500 KB - 2 MB
- If file is empty or very small, build didn't include mapping generation

---

## Troubleshooting

### Mapping File Not Found

**Problem**: `mapping.txt` doesn't exist after build

**Cause**: Minification might not be enabled

**Check**:

```bash
# Verify R8 is enabled in build.gradle
grep -n "minifyEnabled\|enableMinifyInRelease" android/app/build.gradle

# Should show: minifyEnabled enableMinifyInReleaseBuilds
```

**Solution**:

```gradle
// In android/app/build.gradle, release block:
release {
    minifyEnabled true  // Must be true
    proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
}
```

### Google Play Not Accepting File

**Problem**: Upload fails or Play Store says "Invalid format"

**Causes**:

1. Wrong file format (not mapping.txt)
2. File is empty
3. Version code mismatch

**Solution**:

1. Verify file has content: `wc -l mapping.txt` (should be 1000+)
2. Confirm you're uploading for correct version code (13 for v1.1.4)
3. Try downloading from Play Console to see expected format

---

## Automation (Optional)

Add to your build script to auto-copy mapping files:

```bash
#!/bin/bash
# Script: copy-mapping-after-build.sh

BUILD_DATE=$(date +%Y%m%d)
VERSION_CODE=$1

# After EAS build completes
if [ -f "Mobileapp/android/app/build/outputs/mapping/release/mapping.txt" ]; then
  cp Mobileapp/android/app/build/outputs/mapping/release/mapping.txt \
     ./mapping_files/mapping_v${VERSION_CODE}_${BUILD_DATE}.txt
  echo "✓ Mapping file saved for upload"
else
  echo "✗ Mapping file not found!"
  exit 1
fi
```

---

## Play Store Impact

After uploading mapping file:

✅ **Crash Stack Traces** — Human-readable, not obfuscated  
✅ **Better Debugging** — See exact method names where crashes occur  
✅ **Faster Issue Resolution** — Understand root causes faster  
✅ **ANR Analysis** — More detailed ANR stack traces

**Example Before**:

```
java.lang.NullPointerException
  at a.b.c.d (Unknown Source:118)
  at e.f.g (Unknown Source:42)
```

**Example After**:

```
java.lang.NullPointerException
  at com.nileflowafrica.services.PaymentService.processTransaction (PaymentService.kt:118)
  at com.nileflowafrica.screens.CheckoutScreen.onCheckout (CheckoutScreen.kt:42)
```

---

## Version Management

### Keep Mapping Files Per Release

```
mapping_files/
├── mapping_v1.1.3_build11.txt
├── mapping_v1.1.4_build13.txt
└── mapping_v1.2.0_build20.txt
```

Use version + build number to ensure no confusion.

---

## Checklist for Next Release

- [ ] Build completed successfully
- [ ] `mapping.txt` exists at: `Mobileapp/android/app/build/outputs/mapping/release/mapping.txt`
- [ ] File has content (1000+ lines)
- [ ] Copied and backed up to `mapping_files/` folder
- [ ] Uploaded to Google Play Console for version 1.1.4
- [ ] Play Console shows "Deobfuscation file uploaded"
- [ ] Version code matches (13 for v1.1.4)

---

## Reference

- [Google Play Deobfuscation Files](https://developer.android.com/studio/build/shrink-code#decode-stack-trace)
- [R8 Compiler Documentation](https://r8.googlesource.com/r8)
- [ProGuard Manual](https://www.guardsquare.com/manual/configuration/usage)
- [Play Console API - Upload Symbols](https://developer.android.com/studio/build/shrink-code#deploy-deobfuscation-file)

---

**Status**: Ready to implement  
**Next Step**: Locate `mapping.txt` after build and upload to Google Play Console
