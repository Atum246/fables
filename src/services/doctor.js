/**
 * 🔍 Doctor Service — Environment checking
 */

const { execa } = require('execa');
const fs = require('fs-extra');
const chalk = require('chalk');
const { log } = require('../ui/components');

async function checkEnvironment(target = 'all') {
  let allOk = true;

  // Flutter is always required
  try {
    await execa('flutter', ['--version']);
  } catch {
    log.error('Flutter SDK not found! 🚫');
    return false;
  }

  // Android checks
  if (target === 'all' || target === 'apk' || target === 'aab') {
    const sdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
    const hasSdk = sdkRoot && (await fs.pathExists(sdkRoot));
    const hasDocker = await checkDocker();

    if (!hasSdk && !hasDocker) {
      log.warn('No Android SDK or Docker found for Android builds');
      allOk = false;
    }
  }

  // iOS checks
  if (target === 'ios' || target === 'all') {
    if (process.platform === 'darwin') {
      try {
        await execa('xcodebuild', ['-version']);
      } catch {
        log.warn('Xcode not found for iOS builds');
        if (target === 'ios') allOk = false;
      }
    } else if (target === 'ios') {
      log.error('iOS builds require macOS 🍎');
      allOk = false;
    }
  }

  return allOk;
}

async function checkDocker() {
  try {
    await execa('docker', ['--version']);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  checkEnvironment,
  checkDocker,
};
