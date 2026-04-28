/**
 * 🌍 fables i18n — Internationalization helpers
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, log, infoBox, createTable } = require('../ui/components');

function i18nCommand(program) {
  const cmd = program.command('i18n').description('🌍 Internationalization helpers');

  // List supported locales
  cmd
    .command('list')
    .description('List configured locales')
    .action(async () => {
      showBanner();
      log.chapter('Localization 🌍');

      const arbDir = 'lib/l10n';
      if (!(await fs.pathExists(arbDir))) {
        log.info('No localization directory found');
        log.info('Initialize with: ' + chalk.cyan('fables i18n init'));
        return;
      }

      const files = (await fs.readdir(arbDir)).filter((f) => f.endsWith('.arb'));

      if (files.length === 0) {
        log.info('No .arb files found');
        return;
      }

      const table = createTable(['Locale', 'File', 'Strings', 'Missing']);
      for (const file of files) {
        const content = JSON.parse(await fs.readFile(path.join(arbDir, file), 'utf8'));
        const strings = Object.keys(content).filter((k) => !k.startsWith('@'));
        const missing = strings.filter((k) => !content[k] || content[k] === '').length;

        const locale = file.replace('intl_', '').replace('.arb', '');
        table.push([
          chalk.white.bold(locale),
          chalk.gray(file),
          chalk.cyan(strings.length),
          missing > 0 ? chalk.red(missing) : chalk.green('0'),
        ]);
      }

      console.log(table.toString());
    });

  // Init i18n
  cmd
    .command('init')
    .description('Initialize internationalization')
    .option('--locales <locales>', 'Comma-separated locale codes', 'en,es,fr,de,ja,zh')
    .action(async (opts) => {
      const sp = spinner('Setting up i18n... 🌍');

      const arbDir = 'lib/l10n';
      await fs.ensureDir(arbDir);

      const locales = opts.locales.split(',').map((l) => l.trim());

      // Create l10n.yaml config
      await fs.writeFile('l10n.yaml', yaml.stringify({
        'arb-dir': arbDir,
        'template-arb-file': `intl_${locales[0]}.arb`,
        'output-localization-file': `app_localizations.dart`,
        'nullable-getter': false,
        'synthetic-package': false,
        'output-dir': 'lib/l10n/generated',
      }));

      // Create template ARB files
      const templateStrings = {
        '@@locale': locales[0],
        'appTitle': 'My App',
        '@appTitle': { description: 'The application title' },
        'welcome': 'Welcome',
        '@welcome': { description: 'Welcome message' },
        'settings': 'Settings',
        '@settings': { description: 'Settings page title' },
        'logout': 'Logout',
        '@logout': { description: 'Logout button text' },
        'login': 'Login',
        '@login': { description: 'Login button text' },
        'cancel': 'Cancel',
        '@cancel': { description: 'Cancel button' },
        'confirm': 'Confirm',
        '@confirm': { description: 'Confirm button' },
        'error': 'Error',
        '@error': { description: 'Error message title' },
        'retry': 'Retry',
        '@retry': { description: 'Retry button' },
        'loading': 'Loading...',
        '@loading': { description: 'Loading indicator text' },
      };

      for (const locale of locales) {
        const arbPath = path.join(arbDir, `intl_${locale}.arb`);

        if (!(await fs.pathExists(arbPath))) {
          const content = { '@@locale': locale };

          for (const [key, value] of Object.entries(templateStrings)) {
            if (key.startsWith('@@')) continue;
            if (key.startsWith('@')) {
              content[key] = value;
            } else {
              content[key] = locale === locales[0] ? value : `[${locale}] ${value}`;
            }
          }

          await fs.writeFile(arbPath, JSON.stringify(content, null, 2));
        }
      }

      successSpinner(sp, 'i18n initialized! 🌍');

      console.log(
        infoBox(
          '🌍 Localization Ready!',
          [
            chalk.white('Config:  ') + chalk.cyan('l10n.yaml'),
            chalk.white('Locales: ') + chalk.cyan(locales.join(', ')),
            chalk.white('Strings: ') + chalk.cyan(Object.keys(templateStrings).filter((k) => !k.startsWith('@')).length + ' template'),
            '',
            chalk.hex('#F7C948')('Next steps:'),
            chalk.white('  1. Edit .arb files with translations'),
            chalk.white('  2. ') + chalk.cyan('flutter gen-l10n') + chalk.gray(' — generate Dart code'),
            chalk.white('  3. Use ') + chalk.cyan('AppLocalizations.of(context)!.appTitle') + chalk.gray(' in code'),
          ].join('\n')
        )
      );
    });

  // Extract strings from code
  cmd
    .command('extract')
    .description('Extract hardcoded strings from Dart code')
    .action(async () => {
      showBanner();
      log.chapter('String Extraction 🌍');

      const libDir = 'lib';
      if (!(await fs.pathExists(libDir))) {
        log.error('No lib/ directory found');
        process.exit(1);
      }

      const sp = spinner('Scanning Dart files... 🔍');
      const strings = new Map();

      async function scanDir(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            await scanDir(fullPath);
          } else if (entry.name.endsWith('.dart')) {
            const content = await fs.readFile(fullPath, 'utf8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];

              // Find string literals
              const singleQuoteStrings = line.match(/'([^'\\]|\\.)*'/g) || [];
              const doubleQuoteStrings = line.match(/"([^"\\]|\\.)*"/g) || [];

              for (const str of [...singleQuoteStrings, ...doubleQuoteStrings]) {
                const unquoted = str.slice(1, -1);

                // Skip obvious non-translatable strings
                if (
                  unquoted.length < 2 ||
                  unquoted.startsWith('http') ||
                  unquoted.startsWith('assets/') ||
                  unquoted.startsWith('lib/') ||
                  unquoted.startsWith('package:') ||
                  unquoted.match(/^[A-Z_]+$/) || // Constants
                  unquoted.match(/^\d+$/) || // Numbers
                  unquoted.match(/^[a-z_]+$/i) || // camelCase/snake_case identifiers
                  unquoted.includes('://') ||
                  unquoted.includes('.dart')
                ) continue;

                if (!strings.has(unquoted)) {
                  strings.set(unquoted, {
                    file: fullPath,
                    line: i + 1,
                    count: 0,
                  });
                }
                strings.get(unquoted).count++;
              }
            }
          }
        }
      }

      await scanDir(libDir);
      successSpinner(sp, `Found ${strings.size} potential strings`);

      if (strings.size === 0) {
        log.info('No translatable strings found');
        return;
      }

      const table = createTable(['String', 'Occurrences', 'Location']);
      const sorted = [...strings.entries()].sort((a, b) => b[1].count - a[1].count);

      for (const [str, info] of sorted.slice(0, 50)) {
        table.push([
          chalk.white(str.length > 40 ? str.substring(0, 37) + '...' : str),
          chalk.cyan(info.count),
          chalk.gray(`${path.relative(process.cwd(), info.file)}:${info.line}`),
        ]);
      }

      console.log(table.toString());

      if (strings.size > 50) {
        log.info(`... and ${strings.size - 50} more`);
      }

      log.info('Add to .arb files: ' + chalk.cyan('fables i18n init'));
    });

  // Validate translations
  cmd
    .command('validate')
    .description('Check for missing/inconsistent translations')
    .action(async () => {
      showBanner();
      log.chapter('Translation Validation 🌍');

      const arbDir = 'lib/l10n';
      if (!(await fs.pathExists(arbDir))) {
        log.error('No l10n directory found');
        process.exit(1);
      }

      const files = (await fs.readdir(arbDir)).filter((f) => f.endsWith('.arb'));
      if (files.length < 2) {
        log.info('Need at least 2 locale files to compare');
        return;
      }

      // Load all translations
      const locales = {};
      for (const file of files) {
        const locale = file.replace('intl_', '').replace('.arb', '');
        locales[locale] = JSON.parse(await fs.readFile(path.join(arbDir, file), 'utf8'));
      }

      // Find all keys
      const allKeys = new Set();
      for (const strings of Object.values(locales)) {
        for (const key of Object.keys(strings)) {
          if (!key.startsWith('@')) allKeys.add(key);
        }
      }

      // Check for missing translations
      const issues = [];
      for (const [locale, strings] of Object.entries(locales)) {
        for (const key of allKeys) {
          if (key === '@@locale') continue;
          if (!strings[key] || strings[key] === '') {
            issues.push({ locale, key, type: 'missing' });
          } else if (strings[key].startsWith(`[${locale}]`)) {
            issues.push({ locale, key, type: 'untranslated' });
          }
        }
      }

      if (issues.length === 0) {
        log.success('All translations complete! ✅');
      } else {
        const table = createTable(['Locale', 'Key', 'Issue']);
        for (const issue of issues.slice(0, 50)) {
          const emoji = issue.type === 'missing' ? '❌' : '⚠️';
          table.push([
            chalk.white(issue.locale),
            chalk.cyan(issue.key),
            chalk.yellow(`${emoji} ${issue.type}`),
          ]);
        }
        console.log(table.toString());
        log.warn(`${issues.length} issue(s) found`);
      }
    });
}

module.exports = { i18nCommand };
