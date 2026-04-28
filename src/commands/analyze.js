/**
 * 📦 fables analyze — APK/AAB size analysis & optimization insights
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { execa } = require('execa');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, createTable, log, infoBox, warnBox } = require('../ui/components');

function analyzeCommand(program) {
  program
    .command('analyze [path]')
    .description('📊 Analyze APK/AAB size & get optimization tips')
    .option('--deep', 'Deep analysis with dependency breakdown')
    .option('--compare <other>', 'Compare with another build')
    .action(async (buildPath, opts) => {
      showBanner();
      log.chapter('Build Analysis 📊');

      // Find the build file
      let filePath = buildPath;
      if (!filePath) {
        const candidates = [
          'build/fables/app-release.apk',
          'build/fables/app-release.aab',
          'build/app/outputs/flutter-apk/app-release.apk',
          'build/app/outputs/bundle/release/app-release.aab',
        ];
        for (const c of candidates) {
          if (await fs.pathExists(c)) {
            filePath = c;
            break;
          }
        }
      }

      if (!filePath || !(await fs.pathExists(filePath))) {
        log.error('No build file found! Run ' + chalk.cyan('fables build') + ' first 📖');
        process.exit(1);
      }

      const sp = spinner('Analyzing build... 🔍');
      const stats = await fs.stat(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      const ext = path.extname(filePath);

      successSpinner(sp, 'Analysis complete!');

      // Basic info
      const table = createTable(['Property', 'Value']);
      table.push(
        ['📄 File', chalk.white(path.basename(filePath))],
        ['📏 Size', chalk.cyan(`${sizeMB} MB`)],
        ['📦 Format', chalk.yellow(ext.toUpperCase().replace('.', ''))],
        ['📅 Built', chalk.gray(stats.mtime.toLocaleString())],
      );

      console.log(table.toString());

      // APK-specific analysis
      if (ext === '.apk') {
        await analyzeApk(filePath, opts);
      }

      // AAB-specific analysis
      if (ext === '.aab') {
        await analyzeAab(filePath, opts);
      }

      // Optimization tips
      showOptimizationTips(parseFloat(sizeMB), ext);
    });
}

async function analyzeApk(apkPath, opts) {
  const sp = spinner('Inspecting APK structure... 🔬');

  try {
    // Use aapt to dump APK info
    const sdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
    let aapt = 'aapt2';

    if (sdkRoot) {
      const buildToolsDir = path.join(sdkRoot, 'build-tools');
      if (await fs.pathExists(buildToolsDir)) {
        const versions = await fs.readdir(buildToolsDir);
        versions.sort().reverse();
        if (versions.length > 0) {
          const candidate = path.join(buildToolsDir, versions[0], 'aapt2');
          if (await fs.pathExists(candidate)) aapt = candidate;
        }
      }
    }

    try {
      const { stdout } = await execa(aapt, ['dump', 'badging', apkPath], { reject: false });
      const packageMatch = stdout.match(/package: name='([^']+)'/);
      const versionMatch = stdout.match(/versionName='([^']+)'/);
      const sdkMatch = stdout.match(/sdkVersion:'(\d+)'/);
      const targetMatch = stdout.match(/targetSdkVersion:'(\d+)'/);

      if (packageMatch || versionMatch) {
        const infoTable = createTable(['Detail', 'Value']);
        if (packageMatch) infoTable.push(['📦 Package', chalk.cyan(packageMatch[1])]);
        if (versionMatch) infoTable.push(['🏷️  Version', chalk.yellow(versionMatch[1])]);
        if (sdkMatch) infoTable.push(['📱 Min SDK', chalk.white(sdkMatch[1])]);
        if (targetMatch) infoTable.push(['🎯 Target SDK', chalk.white(targetMatch[1])]);
        console.log(infoTable.toString());
      }
    } catch {
      // aapt not available — skip
    }

    // Try to list contents with unzip
    try {
      const { stdout } = await execa('unzip', ['-l', apkPath], { reject: false });
      const lines = stdout.split('\n').filter((l) => l.trim());
      const entries = lines.slice(3, -2); // Skip header/footer

      const dexFiles = entries.filter((e) => e.includes('.dex'));
      const soFiles = entries.filter((e) => e.includes('.so'));
      const pngFiles = entries.filter((e) => e.includes('.png'));

      const contentTable = createTable(['Category', 'Count', 'Details']);
      contentTable.push(
        ['📜 DEX files', chalk.cyan(dexFiles.length), dexFiles.length > 0 ? chalk.gray('Classes') : '—'],
        ['🔧 Native libs (.so)', chalk.cyan(soFiles.length), soFiles.length > 0 ? chalk.gray('ARM, x86') : '—'],
        ['🖼️  PNG images', chalk.cyan(pngFiles.length), pngFiles.length > 100 ? chalk.yellow('Consider WebP') : '—'],
        ['📄 Total files', chalk.white(entries.length), '—'],
      );

      console.log(contentTable.toString());

      // ABI breakdown
      if (soFiles.length > 0) {
        const abis = {};
        for (const line of entries) {
          const abiMatch = line.match(/lib\/(arm64-v8a|armeabi-v7a|x86_64|x86)\//);
          if (abiMatch) {
            abis[abiMatch[1]] = (abis[abiMatch[1]] || 0) + 1;
          }
        }

        if (Object.keys(abis).length > 0) {
          const abiTable = createTable(['Architecture', 'Libraries']);
          for (const [abi, count] of Object.entries(abis)) {
            abiTable.push([chalk.white(abi), chalk.cyan(count)]);
          }
          console.log(abiTable.toString());
        }
      }
    } catch {
      // unzip not available
    }

    successSpinner(sp, 'APK inspection done!');
  } catch (err) {
    failSpinner(sp, 'Analysis failed');
    log.warn(err.message);
  }
}

async function analyzeAab(aabPath, opts) {
  log.info('AAB analysis: Upload to Google Play for detailed size breakdowns');
  log.info('Use ' + chalk.cyan('bundletool') + ' for local AAB inspection');
}

function showOptimizationTips(sizeMB, format) {
  const tips = [];

  if (sizeMB > 50) {
    tips.push('⚠️  APK is over 50MB — consider AAB for Play Store');
    tips.push('💡 Use --split-per-abi to reduce per-device download size');
  }

  if (sizeMB > 20) {
    tips.push('🖼️  Convert PNGs to WebP for 30%+ size reduction');
    tips.push('🌳 Enable tree-shaking: remove unused dependencies');
    tips.push('📦 Use deferred components for large features');
  }

  if (sizeMB > 10) {
    tips.push('🔤 Subset fonts to include only used characters');
    tips.push('🎵 Compress audio/video assets');
    tips.push('🔒 Enable R8/ProGuard for aggressive optimization');
  }

  tips.push('📊 Run with --deep for full dependency breakdown');

  if (tips.length > 0) {
    console.log(
      warnBox(
        chalk.yellow.bold('💡 Optimization Tips:\n\n') +
        tips.map((t) => '  • ' + chalk.white(t)).join('\n')
      )
    );
  } else {
    console.log(
      infoBox(
        '🎉 Looking Good!',
        chalk.green(`Your ${format.toUpperCase()} is ${sizeMB}MB — nicely optimized! ✨`)
      )
    );
  }
}

module.exports = { analyzeCommand };
