/**
 * 🏗️ fables init — Initialize a Fables project
 */

const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, infoBox, log } = require('../ui/components');

function initCommand(program) {
  program
    .command('init')
    .description('🏗️  Initialize Fables in your Flutter project')
    .option('-y, --yes', 'Skip prompts, use defaults')
    .option('-n, --name <name>', 'Project name')
    .action(async (opts) => {
      showBanner();
      log.chapter('Project Initialization');

      const projectDir = process.cwd();
      const fablesDir = path.join(projectDir, '.fables');
      const configPath = path.join(fablesDir, 'fables.yaml');

      // Check if already initialized
      if (await fs.pathExists(configPath)) {
        log.warn('Fables already initialized in this project!');
        log.info('Run ' + chalk.cyan('fables build') + ' to build your app 🚀');
        return;
      }

      // Check if it's a Flutter project
      const pubspecPath = path.join(projectDir, 'pubspec.yaml');
      if (!(await fs.pathExists(pubspecPath))) {
        log.error('No pubspec.yaml found! Are you in a Flutter project directory? 🤔');
        log.info('Run ' + chalk.cyan('flutter create my_app') + ' first, then come back! 📖');
        process.exit(1);
      }

      let config = {};

      if (opts.yes) {
        config = {
          name: opts.name || path.basename(projectDir),
          android: { enabled: true, targets: ['apk', 'aab'] },
          ios: { enabled: true },
          signing: { autoSign: true },
          build: { obfuscate: true, splitDebugInfo: true },
        };
      } else {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: '📖 Project name:',
            default: opts.name || path.basename(projectDir),
          },
          {
            type: 'checkbox',
            name: 'androidTargets',
            message: '🤖 Android build targets:',
            choices: [
              { name: 'APK (universal installable)', value: 'apk', checked: true },
              { name: 'AAB (Play Store bundle)', value: 'aab', checked: true },
              { name: 'Split APKs (per architecture)', value: 'split-apk' },
              { name: 'App Bundle (dynamic delivery)', value: 'dynamic' },
            ],
          },
          {
            type: 'confirm',
            name: 'iosEnabled',
            message: '🍎 Enable iOS builds?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'autoSign',
            message: '🔐 Auto-sign release builds?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'obfuscate',
            message: '🔒 Enable code obfuscation?',
            default: true,
          },
          {
            type: 'list',
            name: 'buildMode',
            message: '⚡ Default build mode:',
            choices: [
              { name: 'Release (optimized, smaller)', value: 'release' },
              { name: 'Profile (performance testing)', value: 'profile' },
              { name: 'Debug (development)', value: 'debug' },
            ],
            default: 'release',
          },
        ]);

        config = {
          name: answers.name,
          version: '0.1.0',
          android: {
            enabled: true,
            targets: answers.androidTargets,
          },
          ios: {
            enabled: answers.iosEnabled,
          },
          signing: {
            autoSign: answers.autoSign,
          },
          build: {
            mode: answers.buildMode,
            obfuscate: answers.obfuscate,
            splitDebugInfo: answers.obfuscate,
          },
        };
      }

      // Create .fables directory
      const sp = spinner('Creating Fables configuration... 📝');
      await fs.ensureDir(fablesDir);

      // Write config
      const yaml = require('yaml');
      await fs.writeFile(configPath, yaml.stringify(config));

      // Create templates directory
      await fs.ensureDir(path.join(fablesDir, 'keystores'));
      await fs.ensureDir(path.join(fablesDir, 'profiles'));

      // Write .gitignore for fables
      const gitignore = `# Fables build artifacts
build/fables/
.fables/keystores/
.fables/profiles/
*.jks
*.keystore
`;
      await fs.writeFile(path.join(fablesDir, '.gitignore'), gitignore);

      successSpinner(sp, 'Fables initialized! 🎉');

      // Show summary
      console.log(
        infoBox(
          '📖 Project Ready!',
          [
            chalk.white('Project: ') + chalk.cyan(config.name),
            chalk.white('Android: ') + chalk.green(config.android.targets.join(', ')),
            chalk.white('iOS:     ') + (config.ios.enabled ? chalk.green('Enabled') : chalk.red('Disabled')),
            chalk.white('Signing: ') + (config.signing.autoSign ? chalk.green('Auto') : chalk.yellow('Manual')),
            chalk.white('Obfuscate: ') + (config.build.obfuscate ? chalk.green('Yes') : chalk.gray('No')),
            '',
            chalk.gray('Config: .fables/fables.yaml'),
            '',
            chalk.hex('#F7C948')('Next steps:'),
            chalk.white('  1. ') + chalk.cyan('fables doctor') + chalk.gray('  — check your environment'),
            chalk.white('  2. ') + chalk.cyan('fables build') + chalk.gray('  — build your app! 🚀'),
          ].join('\n')
        )
      );
    });
}

module.exports = { initCommand };
