/**
 * 🤖 Android Builder — APK, AAB, Split APKs
 *
 * Builds Flutter apps for Android using the local SDK
 * or Docker-managed SDK when Android Studio isn't installed.
 */

const { execa } = require('execa');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { spinner, successSpinner, failSpinner, log, progressBar } = require('../ui/components');
const { findAndroidSdk, ensureAndroidSdk } = require('../services/android-sdk');
const { signApk } = require('../services/signing');

class AndroidBuilder {
  constructor(config, opts) {
    this.config = config;
    this.opts = opts;
    this.outputDir = path.resolve(opts.output || 'build/fables');
  }

  async build(target) {
    const sp = spinner(`Building ${target.toUpperCase()}... 🤖`);

    try {
      // Ensure Android SDK is available
      const sdkPath = await ensureAndroidSdk();

      // Clean flutter build if requested
      if (this.opts.clean) {
        await execa('flutter', ['clean']);
      }

      // Run flutter pub get
      sp.text = 'Getting dependencies... 📦';
      await execa('flutter', ['pub', 'get']);

      // Build based on target
      let buildArgs;
      let outputPath;

      switch (target) {
        case 'apk':
          buildArgs = this._buildApkArgs();
          outputPath = await this._executeBuild(sp, buildArgs);
          break;

        case 'aab':
          buildArgs = this._buildAabArgs();
          outputPath = await this._executeBuild(sp, buildArgs);
          break;

        case 'split-apk':
          buildArgs = this._buildSplitApkArgs();
          outputPath = await this._executeBuild(sp, buildArgs);
          break;

        default:
          throw new Error(`Unknown Android target: ${target}`);
      }

      // Copy to output directory
      sp.text = 'Copying artifacts... 📋';
      await fs.ensureDir(this.outputDir);

      const outputFile = path.join(this.outputDir, path.basename(outputPath));
      await fs.copy(outputPath, outputFile);

      // Get file size
      const stats = await fs.stat(outputFile);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Sign if release mode and signing is configured
      if (this.opts.mode === 'release' && this.opts.sign !== false && this.config.signing?.autoSign) {
        sp.text = 'Signing build... 🔐';
        try {
          await signApk(outputFile);
        } catch (err) {
          log.warn(`Signing skipped: ${err.message}`);
        }
      }

      successSpinner(sp, `${target.toUpperCase()} built successfully! 🎉`);

      return {
        path: outputFile,
        size: `${sizeMB} MB`,
        target,
      };
    } catch (err) {
      failSpinner(sp, `${target.toUpperCase()} build failed`);
      throw err;
    }
  }

  _buildApkArgs() {
    const args = ['build', 'apk', '--release'];

    if (this.opts.mode === 'debug') args.splice(2, 1, '--debug');
    if (this.opts.mode === 'profile') args.splice(2, 1, '--profile');

    if (this.opts.splitPerAbi) args.push('--split-per-abi');
    if (this.opts.flavor) args.push('--flavor', this.opts.flavor);
    if (this.opts.noObfuscate) {
      // skip obfuscation
    } else if (this.config.build?.obfuscate) {
      args.push('--obfuscate');
      args.push('--split-debug-info=build/debug-info');
    }

    this._addDartDefines(args);
    return args;
  }

  _buildAabArgs() {
    const args = ['build', 'appbundle', '--release'];

    if (this.opts.flavor) args.push('--flavor', this.opts.flavor);
    if (this.config.build?.obfuscate && !this.opts.noObfuscate) {
      args.push('--obfuscate');
      args.push('--split-debug-info=build/debug-info');
    }

    this._addDartDefines(args);
    return args;
  }

  _buildSplitApkArgs() {
    const args = ['build', 'apk', '--release', '--split-per-abi'];

    if (this.opts.flavor) args.push('--flavor', this.opts.flavor);
    if (this.config.build?.obfuscate && !this.opts.noObfuscate) {
      args.push('--obfuscate');
      args.push('--split-debug-info=build/debug-info');
    }

    this._addDartDefines(args);
    return args;
  }

  _addDartDefines(args) {
    if (this.opts.dartDefine) {
      for (const define of this.opts.dartDefine) {
        args.push('--dart-define', define);
      }
    }
  }

  async _executeBuild(sp, args) {
    sp.text = `Running: flutter ${args.join(' ')} 🔨`;

    const { stdout, stderr } = await execa('flutter', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      all: true,
    });

    // Parse output path from Flutter's output
    const outputMatch = (stdout + stderr).match(/Built\s+(.+?\.(?:apk|aab))/i);
    if (outputMatch) {
      return outputMatch[1].trim();
    }

    // Fallback: look in standard build directories
    const possiblePaths = [
      'build/app/outputs/flutter-apk/app-release.apk',
      'build/app/outputs/bundle/release/app-release.aab',
      'build/app/outputs/flutter-apk/app-debug.apk',
      'build/app/outputs/flutter-apk/app-profile.apk',
    ];

    for (const p of possiblePaths) {
      if (await fs.pathExists(p)) {
        return p;
      }
    }

    throw new Error('Could not find build output. Check Flutter output for errors.');
  }
}

module.exports = { AndroidBuilder };
