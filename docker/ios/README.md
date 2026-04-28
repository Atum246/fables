# 🍎 Fables iOS Build Notes
#
# iOS builds CANNOT run in Docker — they require macOS with Xcode.
#
# Options for iOS builds:
# 1. Run Fables directly on macOS
# 2. Use a macOS CI runner (GitHub Actions, etc.)
# 3. Use a cloud Mac service (MacStadium, AWS EC2 Mac, etc.)
#
# This directory is a placeholder for future iOS tooling.

# For CI/CD on macOS runners, Fables will:
# 1. Detect Xcode installation
# 2. Run flutter build ios --no-codesign
# 3. Archive with xcodebuild
# 4. Export IPA

# Requirements:
# - macOS 12+ (Monterey or later)
# - Xcode 14+
# - CocoaPods
# - Flutter SDK
