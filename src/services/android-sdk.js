/**
 * 🤖 Android SDK Service — Auto-detect or manage Android SDK
 *
 * Fables can work with:
 * 1. Locally installed Android SDK (from Android Studio)
 * 2. Docker-managed SDK (no Android Studio needed!)
 * 3. Auto-download minimal SDK
 */

const { execa } = require('execa');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { log, spinner, successSpinner, failSpinner } = require('../ui/components');

const ANDROID_SDK_PATHS = [
  // macOS
  path.join(process.env.HOME || '', 'Library/Android/sdk'),
  // Linux
  path.join(process.env.HOME || '', 'Android/Sdk'),
  path.join(process.env.HOME || '', 'android-sdk'),
  // Windows
  path.join(process.env.LOCALAPPDATA || '', 'Android/Sdk'),
  // Common custom locations
  '/opt/android-sdk',
  '/usr/local/android-sdk',
];

async function findAndroidSdk() {
  // Check environment variables first
  const envPaths = [
    process.env.ANDROID_SDK_ROOT,
    process.env.ANDROID_HOME,
  ].filter(Boolean);

  for (const sdkPath of envPaths) {
    if (await fs.pathExists(sdkPath)) {
      return sdkPath;
    }
  }

  // Check common paths
  for (const sdkPath of ANDROID_SDK_PATHS) {
    if (await fs.pathExists(sdkPath)) {
      return sdkPath;
    }
  }

  // Check if flutter has its own
  try {
    const { stdout } = await execa('flutter', ['doctor', '-v']);
    const match = stdout.match(/Android SDK at (.+)/);
    if (match && await fs.pathExists(match[1].trim())) {
      return match[1].trim();
    }
  } catch {
    // Flutter not available
  }

  return null;
}

async function ensureAndroidSdk() {
  const sdkPath = await findAndroidSdk();

  if (sdkPath) {
    log.info(`Android SDK found: ${chalk.cyan(sdkPath)} 🤖`);
    return sdkPath;
  }

  // No SDK found — check Docker
  log.warn('Android SDK not found locally');
  log.info('Checking Docker for managed SDK... 🐳');

  try {
    await execa('docker', ['--version']);

    // Check if Fables SDK container exists
    const { stdout } = await execa('docker', ['images', '-q', 'fables/android-sdk']);
    if (stdout.trim()) {
      log.success('Using Fables Docker-managed Android SDK 🐳🤖');
      return 'docker://fables/android-sdk';
    }

    // Pull and set up
    const sp = spinner('Setting up Docker Android SDK (first time may take a few minutes)... 🐳📥');
    await execa('docker', ['pull', 'fables/android-sdk:latest']).catch(async () => {
      // Build our own if pull fails
      sp.text = 'Building Fables Android SDK container... 🏗️';
      await buildDockerSdk();
    });
    successSpinner(sp, 'Docker Android SDK ready! 🐳✅');

    return 'docker://fables/android-sdk';
  } catch {
    // No Docker either
    log.error('Neither Android SDK nor Docker found! 😱');
    log.info('');
    log.info('Options:');
    log.info('  1. Install Android Studio: https://developer.android.com/studio');
    log.info('  2. Install Docker: https://docs.docker.com/get-docker/');
    log.info('  3. Set ANDROID_SDK_ROOT to your SDK path');
    log.info('');
    log.info('Fables recommends Docker for a lightweight setup! 🐳');
    throw new Error('Android SDK not available');
  }
}

async function buildDockerSdk() {
  const dockerDir = path.join(__dirname, '../../docker/android');
  if (await fs.pathExists(path.join(dockerDir, 'Dockerfile'))) {
    await execa('docker', ['build', '-t', 'fables/android-sdk', dockerDir]);
  } else {
    throw new Error('Docker build files not found');
  }
}

async function runInDocker(command, args, opts = {}) {
  const dockerArgs = [
    'run', '--rm',
    '-v', `${process.cwd()}:/workspace`,
    '-w', '/workspace',
    '-e', 'ANDROID_HOME=/opt/android-sdk',
    'fables/android-sdk',
    command,
    ...args,
  ];

  return execa('docker', dockerArgs, opts);
}

module.exports = {
  findAndroidSdk,
  ensureAndroidSdk,
  runInDocker,
};
