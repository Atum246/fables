/**
 * 🔐 Signing Service — APK/AAB signing
 */

const { execa } = require('execa');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { log, spinner, successSpinner, failSpinner } = require('../ui/components');

async function signApk(apkPath) {
  // Find signing profile
  const profilesDir = '.fables/profiles';

  if (!(await fs.pathExists(profilesDir))) {
    throw new Error('No signing profiles found. Run: fables sign generate');
  }

  const files = await fs.readdir(profilesDir);
  const profileFiles = files.filter((f) => f.endsWith('.json'));

  if (profileFiles.length === 0) {
    throw new Error('No signing profiles found. Run: fables sign generate');
  }

  // Use the first profile (or let user choose)
  const profilePath = path.join(profilesDir, profileFiles[0]);
  const profile = await fs.readJson(profilePath);

  const keystorePath = path.resolve(profile.keystore);
  if (!(await fs.pathExists(keystorePath))) {
    throw new Error(`Keystore not found: ${keystorePath}`);
  }

  // Check if apksigner is available
  const sdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  let apksigner = 'apksigner';

  if (sdkRoot) {
    // Find latest build-tools
    const buildToolsDir = path.join(sdkRoot, 'build-tools');
    if (await fs.pathExists(buildToolsDir)) {
      const versions = await fs.readdir(buildToolsDir);
      versions.sort().reverse();
      if (versions.length > 0) {
        const candidate = path.join(buildToolsDir, versions[0], 'apksigner');
        if (await fs.pathExists(candidate)) {
          apksigner = candidate;
        }
      }
    }
  }

  // Sign the APK
  const sp = spinner('Signing APK... 🔐');

  try {
    await execa(apksigner, [
      'sign',
      '--ks', keystorePath,
      '--ks-key-alias', profile.alias,
      '--ks-pass', 'pass:fables',  // TODO: prompt for password
      apkPath,
    ]);

    successSpinner(sp, 'APK signed! 🔐✅');
  } catch (err) {
    failSpinner(sp, 'Signing failed');
    throw err;
  }
}

async function verifyApk(apkPath) {
  try {
    const { stdout } = await execa('apksigner', ['verify', '--verbose', apkPath]);
    return { valid: true, details: stdout };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = {
  signApk,
  verifyApk,
};
