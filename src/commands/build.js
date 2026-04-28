/**
 * 🚀 fables build — Build Flutter apps to APK, AAB, iOS
 */

const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const yaml = require('yaml');
const { showBanner } = require('../ui/banner');
const {
  spinner,
  successSpinner,
  failSpinner,
  infoBox,
  successBox,
  errorBox,
  createTable,
  progressBar,
  log,
} = require('../ui/components');
const { AndroidBuilder } = require('../builders/android');
const { IOSBuilder } = require('../builders/ios');
const { loadConfig } = require('../services/config');
const { checkEnvironment } = require('../services/doctor');

function buildCommand(program) {
  const cmd = program
    .command('build')
    .description('🚀 Build your Flutter app')
    .option('-t, --target <target>', 'Build target: apk, aab, ios, all', 'all')
    .option('-m, --mode <mode>', 'Build mode: release, profile, debug', 'release')
    .option('--no-sign', 'Skip signing')
    .option('--no-obfuscate', 'Skip obfuscation')
    .option('--split-per-abi', 'Generate per-ABI APKs')
    .option('--flavor <flavor>', 'Build flavor')
    .option('--dart-define <defines...>', 'Dart defines (KEY=VALUE)')
    .option('-o, --output <dir>', 'Output directory', 'build/fables')
    .option('--clean', 'Clean before build')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (opts) => {
      showBanner();
      log.chapter('Building Your App 🏗️');

      // Load config
      const config = await loadConfig();
      if (!config) {
        log.error('No Fables config found! Run ' + chalk.cyan('fables init') + ' first 📖');
        process.exit(1);
      }

      // Environment check
      const envOk = await checkEnvironment(opts.target);
      if (!envOk) {
        log.error('Environment check failed! Run ' + chalk.cyan('fables doctor') + ' for details 🔍');
        process.exit(1);
      }

      // Determine targets
      const targets = resolveTargets(opts.target, config);
      log.info('Targets: ' + targets.map((t) => chalk.cyan(t)).join(', '));
      log.info('Mode: ' + chalk.yellow(opts.mode));

      // Confirmation
      if (!opts.yes) {
        const inquirer = require('inquirer');
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Build ${targets.join(', ')} in ${opts.mode} mode?`,
            default: true,
          },
        ]);
        if (!confirm) {
          log.info('Build cancelled 🚫');
          return;
        }
      }

      const startTime = Date.now();
      const results = [];

      // Clean if requested
      if (opts.clean) {
        const sp = spinner('Cleaning build directory... 🧹');
        await fs.remove(path.resolve(opts.output));
        successSpinner(sp, 'Clean complete!');
      }

      // Build Android targets
      const androidTargets = targets.filter((t) => ['apk', 'aab', 'split-apk'].includes(t));
      if (androidTargets.length > 0) {
        log.chapter('🤖 Android Build');
        const androidBuilder = new AndroidBuilder(config, opts);

        for (const target of androidTargets) {
          try {
            const result = await androidBuilder.build(target);
            results.push({ target, status: 'success', ...result });
            log.success(`${target.toUpperCase()} built: ${chalk.cyan(result.path)}`);
          } catch (err) {
            results.push({ target, status: 'failed', error: err.message });
            log.error(`${target.toUpperCase()} failed: ${err.message}`);
          }
        }
      }

      // Build iOS
      if (targets.includes('ios')) {
        log.chapter('🍎 iOS Build');
        const iosBuilder = new IOSBuilder(config, opts);

        try {
          const result = await iosBuilder.build();
          results.push({ target: 'ios', status: 'success', ...result });
          log.success(`iOS built: ${chalk.cyan(result.path)}`);
        } catch (err) {
          results.push({ target: 'ios', status: 'failed', error: err.message });
          log.error(`iOS failed: ${err.message}`);
        }
      }

      // Show results
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      showBuildResults(results, elapsed);
    });
}

function resolveTargets(target, config) {
  if (target === 'all') {
    const targets = [];
    if (config.android?.enabled !== false) {
      targets.push(...(config.android?.targets || ['apk', 'aab']));
    }
    if (config.ios?.enabled) {
      targets.push('ios');
    }
    return targets;
  }
  return [target];
}

function showBuildResults(results, elapsed) {
  log.chapter('📊 Build Results');

  const table = createTable(['Target', 'Status', 'Size', 'Path']);

  for (const r of results) {
    const status =
      r.status === 'success'
        ? chalk.green('✅ Success')
        : chalk.red('❌ Failed');

    table.push([
      chalk.white.bold(r.target.toUpperCase()),
      status,
      r.size || '—',
      r.path || r.error || '—',
    ]);
  }

  console.log(table.toString());
  console.log(
    infoBox(
      '⏱️  Build Complete!',
      [
        chalk.white('Time:    ') + chalk.cyan(`${elapsed}s`),
        chalk.white('Success: ') + chalk.green(results.filter((r) => r.status === 'success').length),
        chalk.white('Failed:  ') + chalk.red(results.filter((r) => r.status === 'failed').length),
        '',
        chalk.hex('#F7C948')('📖 Fables — legendary builds! ✨'),
      ].join('\n')
    )
  );
}

module.exports = { buildCommand };
