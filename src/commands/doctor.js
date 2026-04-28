/**
 * 🔍 fables doctor — Check your build environment
 */

const chalk = require('chalk');
const { execa } = require('execa');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, createTable, log, warnBox, infoBox } = require('../ui/components');

const CHECKS = [
  {
    name: 'Flutter SDK',
    emoji: '💙',
    check: async () => {
      try {
        const { stdout } = await execa('flutter', ['--version']);
        const match = stdout.match(/Flutter (\d+\.\d+\.\d+)/);
        return { ok: true, version: match ? match[1] : 'installed' };
      } catch {
        return { ok: false, fix: 'Install Flutter: https://docs.flutter.dev/get-started/install' };
      }
    },
  },
  {
    name: 'Dart SDK',
    emoji: '🎯',
    check: async () => {
      try {
        const { stdout } = await execa('dart', ['--version']);
        const match = stdout.match(/version: (\d+\.\d+\.\d+)/);
        return { ok: true, version: match ? match[1] : 'installed' };
      } catch {
        return { ok: false, fix: 'Comes with Flutter SDK' };
      }
    },
  },
  {
    name: 'Java/JDK',
    emoji: '☕',
    check: async () => {
      try {
        const { stdout } = await execa('java', ['-version'], { reject: false });
        const match = stdout.match(/version "(\d+\.\d+\.\d+)"/);
        return { ok: true, version: match ? match[1] : 'installed' };
      } catch {
        return { ok: false, fix: 'Install JDK 17: https://adoptium.net/' };
      }
    },
  },
  {
    name: 'Android SDK',
    emoji: '🤖',
    check: async () => {
      const sdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
      if (sdkRoot) {
        const fs = require('fs-extra');
        if (await fs.pathExists(sdkRoot)) {
          return { ok: true, version: sdkRoot };
        }
      }
      // Check if Fables can provide it via Docker
      try {
        const { stdout } = await execa('docker', ['--version']);
        return { ok: true, version: 'via Docker 🐳', note: 'Fables will manage Android SDK in Docker' };
      } catch {
        return {
          ok: false,
          fix: 'Set ANDROID_SDK_ROOT or install Docker for auto-management',
        };
      }
    },
  },
  {
    name: 'Build Tools',
    emoji: '🔧',
    check: async () => {
      const sdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
      if (sdkRoot) {
        const fs = require('fs-extra');
        const buildTools = `${sdkRoot}/build-tools`;
        if (await fs.pathExists(buildTools)) {
          return { ok: true, version: 'installed' };
        }
      }
      return { ok: true, version: 'auto-managed by Fables', note: 'Docker-based if needed' };
    },
  },
  {
    name: 'Docker',
    emoji: '🐳',
    check: async () => {
      try {
        const { stdout } = await execa('docker', ['--version']);
        const match = stdout.match(/version (\d+\.\d+\.\d+)/);
        return { ok: true, version: match ? match[1] : 'installed' };
      } catch {
        return { ok: false, fix: 'Install Docker: https://docs.docker.com/get-docker/' };
      }
    },
  },
  {
    name: 'Xcode (macOS)',
    emoji: '🍎',
    check: async () => {
      if (process.platform !== 'darwin') {
        return { ok: true, version: 'skipped (not macOS)', note: 'iOS builds require macOS' };
      }
      try {
        const { stdout } = await execa('xcodebuild', ['-version']);
        const match = stdout.match(/Xcode (\d+\.\d+)/);
        return { ok: true, version: match ? match[1] : 'installed' };
      } catch {
        return { ok: false, fix: 'Install Xcode from the App Store' };
      }
    },
  },
  {
    name: 'CocoaPods',
    emoji: '🍫',
    check: async () => {
      if (process.platform !== 'darwin') {
        return { ok: true, version: 'skipped (not macOS)' };
      }
      try {
        const { stdout } = await execa('pod', ['--version']);
        return { ok: true, version: stdout.trim() };
      } catch {
        return { ok: false, fix: 'Run: sudo gem install cocoapods' };
      }
    },
  },
];

function doctorCommand(program) {
  program
    .command('doctor')
    .description('🔍 Check your build environment')
    .option('-a, --all', 'Check all platforms')
    .option('--fix', 'Attempt to fix issues automatically')
    .action(async (opts) => {
      showBanner();
      log.chapter('Environment Checkup 🔍');

      const table = createTable(['Check', 'Status', 'Version / Details']);
      let allOk = true;
      let issues = [];

      for (const check of CHECKS) {
        const sp = spinner(`Checking ${check.name}...`);

        try {
          const result = await check.check();

          if (result.ok) {
            successSpinner(sp, '');
            table.push([
              check.emoji + ' ' + chalk.white(check.name),
              chalk.green('✅ Ready'),
              chalk.gray(result.version || '') + (result.note ? chalk.yellow(` (${result.note})`) : ''),
            ]);
          } else {
            failSpinner(sp, '');
            allOk = false;
            issues.push({ name: check.name, fix: result.fix });
            table.push([
              check.emoji + ' ' + chalk.white(check.name),
              chalk.red('❌ Missing'),
              chalk.red(result.fix || ''),
            ]);
          }
        } catch (err) {
          failSpinner(sp, '');
          table.push([
            check.emoji + ' ' + chalk.white(check.name),
            chalk.red('❌ Error'),
            chalk.red(err.message),
          ]);
          allOk = false;
        }
      }

      console.log(table.toString());

      if (allOk) {
        console.log(
          infoBox(
            '🎉 All Clear!',
            chalk.green('Your environment is ready to build! 🚀') +
              '\n\n' +
              chalk.white('Run ') +
              chalk.cyan('fables build') +
              chalk.white(' to create your app.')
          )
        );
      } else {
        console.log(
          warnBox(
            chalk.yellow('Some issues found:') +
              '\n\n' +
              issues.map((i) => `  • ${i.name}: ${chalk.cyan(i.fix)}`).join('\n') +
              '\n\n' +
              chalk.white("Don't worry! Fables can use Docker 🐳 to auto-manage missing tools.")
          )
        );
      }
    });
}

module.exports = { doctorCommand, CHECKS };
