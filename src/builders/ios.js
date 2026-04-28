/**
 * 🍎 iOS Builder — IPA generation
 *
 * Builds Flutter apps for iOS using xcodebuild.
 * Requires macOS with Xcode installed.
 */

const { execa } = require('execa');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { spinner, successSpinner, failSpinner, log } = require('../ui/components');

class IOSBuilder {
  constructor(config, opts) {
    this.config = config;
    this.opts = opts;
    this.outputDir = path.resolve(opts.output || 'build/fables');
  }

  async build() {
    // Verify macOS
    if (process.platform !== 'darwin') {
      throw new Error('iOS builds require macOS 🍎');
    }

    const sp = spinner('Building iOS app... 🍎');

    try {
      // Check Xcode
      sp.text = 'Checking Xcode... 🔍';
      try {
        await execa('xcodebuild', ['-version']);
      } catch {
        throw new Error('Xcode not found! Install from App Store 🏪');
      }

      // Flutter pub get
      sp.text = 'Getting dependencies... 📦';
      await execa('flutter', ['pub', 'get']);

      // Clean if requested
      if (this.opts.clean) {
        sp.text = 'Cleaning... 🧹';
        await execa('flutter', ['clean']);
        await execa('flutter', ['pub', 'get']);
      }

      // Build IPA
      sp.text = 'Building IPA... 🔨';
      const buildArgs = ['build', 'ios', '--release', '--no-codesign'];

      if (this.opts.flavor) buildArgs.push('--flavor', this.opts.flavor);
      if (this.config.build?.obfuscate && !this.opts.noObfuscate) {
        buildArgs.push('--obfuscate');
        buildArgs.push('--split-debug-info=build/debug-info');
      }

      if (this.opts.dartDefine) {
        for (const define of this.opts.dartDefine) {
          buildArgs.push('--dart-define', define);
        }
      }

      await execa('flutter', buildArgs);

      // Create IPA using xcodebuild
      sp.text = 'Packaging IPA... 📦';
      const iosDir = 'ios';
      const workspace = await this._findWorkspace(iosDir);
      const scheme = await this._findScheme(iosDir);

      const archivePath = path.join(this.outputDir, 'Runner.xcarchive');
      await fs.ensureDir(this.outputDir);

      // Archive
      await execa('xcodebuild', [
        '-workspace', workspace,
        '-scheme', scheme,
        '-configuration', 'Release',
        '-archivePath', archivePath,
        'archive',
        'CODE_SIGNING_ALLOWED=NO',
      ]);

      // Export IPA
      const exportOptionsPlist = await this._createExportOptions(iosDir);
      await execa('xcodebuild', [
        '-archivePath', archivePath,
        '-exportOptionsPlist', exportOptionsPlist,
        '-exportPath', this.outputDir,
        '-exportArchive',
      ]);

      // Find the IPA
      const ipaPath = path.join(this.outputDir, 'Runner.ipa');
      if (!(await fs.pathExists(ipaPath))) {
        // Look for any IPA in the output dir
        const files = await fs.readdir(this.outputDir);
        const ipaFile = files.find((f) => f.endsWith('.ipa'));
        if (ipaFile) {
          return this._finalize(path.join(this.outputDir, ipaFile), sp);
        }
        throw new Error('IPA not found in output directory');
      }

      return this._finalize(ipaPath, sp);
    } catch (err) {
      failSpinner(sp, 'iOS build failed');
      throw err;
    }
  }

  async _finalize(ipaPath, sp) {
    const stats = await fs.stat(ipaPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    successSpinner(sp, 'iOS build complete! 🍎🎉');
    return {
      path: ipaPath,
      size: `${sizeMB} MB`,
    };
  }

  async _findWorkspace(iosDir) {
    const files = await fs.readdir(iosDir);
    const xcworkspace = files.find((f) => f.endsWith('.xcworkspace'));
    if (xcworkspace) return path.join(iosDir, xcworkspace);
    throw new Error('No .xcworkspace found in ios/ directory');
  }

  async _findScheme(iosDir) {
    // Try to find the scheme
    const files = await fs.readdir(path.join(iosDir, 'Runner.xcodeproj', 'xcshareddata', 'xcschemes'), { recursive: true }).catch(() => []);
    if (files.length > 0) return path.basename(files[0], '.xcscheme');
    return 'Runner';
  }

  async _createExportOptions(iosDir) {
    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>`;

    const plistPath = path.join(this.outputDir, 'ExportOptions.plist');
    await fs.writeFile(plistPath, plistContent);
    return plistPath;
  }
}

module.exports = { IOSBuilder };
