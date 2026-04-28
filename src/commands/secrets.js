/**
 * 🔐 fables secrets — Manage environment variables & secrets
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, log, infoBox, warnBox, createTable } = require('../ui/components');

const SECRETS_DIR = '.fables/secrets';
const ENV_FILE = '.env';

function secretsCommand(program) {
  const cmd = program.command('secrets').description('🔐 Manage secrets & environment variables');

  // List secrets
  cmd
    .command('list')
    .description('List configured secrets (names only)')
    .action(async () => {
      const secretsDir = path.resolve(SECRETS_DIR);
      if (!(await fs.pathExists(secretsDir))) {
        log.info('No secrets configured. Run ' + chalk.cyan('fables secrets init'));
        return;
      }

      const files = await fs.readdir(secretsDir);
      const envFiles = files.filter((f) => f.endsWith('.env'));

      if (envFiles.length === 0) {
        log.info('No secret files found');
        return;
      }

      const table = createTable(['Environment', 'Variables', 'File']);
      for (const file of envFiles) {
        const content = await fs.readFile(path.join(secretsDir, file), 'utf8');
        const vars = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
        table.push([
          chalk.white(file.replace('.env', '')),
          chalk.cyan(vars.length),
          chalk.gray(path.join(SECRETS_DIR, file)),
        ]);
      }

      console.log(table.toString());
    });

  // Init secrets
  cmd
    .command('init')
    .description('Initialize secrets management')
    .action(async () => {
      const sp = spinner('Setting up secrets... 🔐');
      await fs.ensureDir(SECRETS_DIR);

      // Create template .env files
      const envs = ['development', 'staging', 'production'];
      for (const env of envs) {
        const envPath = path.join(SECRETS_DIR, `${env}.env`);
        if (!(await fs.pathExists(envPath))) {
          await fs.writeFile(envPath, `# ${env.toUpperCase()} Environment Variables
# ⚠️  Do NOT commit this file!

# API Configuration
API_BASE_URL=https://api-${env}.example.com
API_KEY=your_api_key_here

# Feature Flags
ENABLE_ANALYTICS=false
ENABLE_CRASH_REPORTING=false

# App Config
APP_NAME=My App (${env})
DEBUG_MODE=${env === 'production' ? 'false' : 'true'}
`);
        }
      }

      // Update .gitignore
      const gitignorePath = '.gitignore';
      let gitignore = '';
      if (await fs.pathExists(gitignorePath)) {
        gitignore = await fs.readFile(gitignorePath, 'utf8');
      }

      const entries = ['.fables/secrets/', '.env', '.env.*', '*.env'];
      for (const entry of entries) {
        if (!gitignore.includes(entry)) {
          gitignore += `\n${entry}`;
        }
      }
      await fs.writeFile(gitignorePath, gitignore);

      successSpinner(sp, 'Secrets initialized! 🔐');

      console.log(
        infoBox(
          '🔐 Secrets Ready!',
          [
            chalk.white('Directory: ') + chalk.cyan(SECRETS_DIR),
            '',
            chalk.hex('#F7C948')('Environments:'),
            ...envs.map((e) => chalk.white('  ✅ ') + chalk.cyan(e + '.env')),
            '',
            chalk.yellow('⚠️  Secrets are gitignored — never commit them!'),
            '',
            chalk.hex('#F7C948')('Next steps:'),
            chalk.white('  1. Edit .env files with your secrets'),
            chalk.white('  2. ') + chalk.cyan('fables secrets load production') + chalk.gray(' — inject into build'),
          ].join('\n')
        )
      );
    });

  // Set a secret
  cmd
    .command('set <key> <value>')
    .description('Set a secret value')
    .option('-e, --env <environment>', 'Environment', 'development')
    .action(async (key, value, opts) => {
      const envPath = path.join(SECRETS_DIR, `${opts.env}.env`);

      if (!(await fs.pathExists(envPath))) {
        log.error(`Environment "${opts.env}" not found. Run ${chalk.cyan('fables secrets init')}`);
        process.exit(1);
      }

      let content = await fs.readFile(envPath, 'utf8');
      const regex = new RegExp(`^${key}=.*$`, 'm');

      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }

      await fs.writeFile(envPath, content);
      log.success(`${chalk.cyan(key)} set in ${chalk.yellow(opts.env)} ✅`);
    });

  // Load secrets into build
  cmd
    .command('load <environment>')
    .description('Load secrets as dart-defines for builds')
    .option('--export', 'Export as shell environment variables')
    .action(async (env, opts) => {
      const envPath = path.join(SECRETS_DIR, `${env}.env`);

      if (!(await fs.pathExists(envPath))) {
        log.error(`Environment "${env}" not found`);
        process.exit(1);
      }

      const content = await fs.readFile(envPath, 'utf8');
      const vars = content
        .split('\n')
        .filter((l) => l.trim() && !l.startsWith('#'))
        .map((l) => {
          const [key, ...rest] = l.split('=');
          return { key: key.trim(), value: rest.join('=').trim() };
        });

      const table = createTable(['Key', 'Value', 'Dart Define']);
      const dartDefines = [];

      for (const { key, value } of vars) {
        const encoded = Buffer.from(value).toString('base64');
        const dartDefine = `--dart-define=${key}=${value}`;
        dartDefines.push(dartDefine);

        const masked = value.length > 8
          ? value.substring(0, 4) + '****' + value.substring(value.length - 4)
          : '****';

        table.push([chalk.cyan(key), chalk.gray(masked), chalk.white(dartDefine)]);
      }

      console.log(table.toString());

      if (opts.export) {
        console.log('\n' + chalk.hex('#F7C948')('Export commands:'));
        for (const { key, value } of vars) {
          console.log(chalk.cyan(`export ${key}="${value}"`));
        }
      }

      console.log(
        infoBox(
          '🔐 Secrets Loaded',
          [
            chalk.white('Environment: ') + chalk.cyan(env),
            chalk.white('Variables:   ') + chalk.cyan(vars.length),
            '',
            chalk.hex('#F7C948')('Use in build:'),
            chalk.cyan(`  fables build --target apk --dart-define ${vars.map((v) => `${v.key}=${v.value}`).join(' --dart-define ')}`),
          ].join('\n')
        )
      );
    });

  // Generate encryption key
  cmd
    .command('keygen')
    .description('Generate a secure encryption key')
    .option('-l, --length <bytes>', 'Key length in bytes', '32')
    .action((opts) => {
      const key = crypto.randomBytes(parseInt(opts.length)).toString('hex');
      log.success('Generated key: ' + chalk.cyan(key));
      log.warn('Store this securely — it won\'t be shown again!');
    });
}

module.exports = { secretsCommand };
