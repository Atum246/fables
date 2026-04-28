/**
 * 🍦 fables flavors — Manage build flavors/environments
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, log, infoBox, createTable } = require('../ui/components');

function flavorsCommand(program) {
  const cmd = program.command('flavors').description('🍦 Manage build flavors');

  // List flavors
  cmd
    .command('list')
    .description('List configured flavors')
    .action(async () => {
      showBanner();
      log.chapter('Build Flavors 🍦');

      const config = await loadFlavorsConfig();
      if (!config || !config.flavors || config.flavors.length === 0) {
        log.info('No flavors configured. Run ' + chalk.cyan('fables flavors init'));
        return;
      }

      const table = createTable(['Flavor', 'App Name', 'Bundle ID', 'Env']);
      for (const f of config.flavors) {
        table.push([
          chalk.white.bold(f.name),
          chalk.cyan(f.appName || '—'),
          chalk.gray(f.bundleId || '—'),
          chalk.yellow(f.environment || '—'),
        ]);
      }

      console.log(table.toString());
    });

  // Init flavors
  cmd
    .command('init')
    .description('Initialize build flavors')
    .action(async () => {
      showBanner();
      log.chapter('Initialize Flavors 🍦');

      const inquirer = require('inquirer');
      const { flavors } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'flavors',
        message: 'Select flavors to create:',
        choices: [
          { name: '🟢 Development (dev)', value: 'dev', checked: true },
          { name: '🟡 Staging (staging)', value: 'staging', checked: true },
          { name: '🔴 Production (prod)', value: 'prod', checked: true },
        ],
      }]);

      const configs = [];
      for (const flavor of flavors) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'appName',
            message: `App name for ${flavor}:`,
            default: `My App ${flavor.charAt(0).toUpperCase() + flavor.slice(1)}`,
          },
          {
            type: 'input',
            name: 'bundleId',
            message: `Bundle ID for ${flavor}:`,
            default: `com.example.app.${flavor}`,
          },
        ]);

        configs.push({
          name: flavor,
          appName: answers.appName,
          bundleId: answers.bundleId,
          environment: flavor,
        });
      }

      // Save to fables config
      const sp = spinner('Writing flavor configuration... 🍦');
      const configPath = '.fables/fables.yaml';
      let config = {};
      if (await fs.pathExists(configPath)) {
        config = yaml.parse(await fs.readFile(configPath, 'utf8'));
      }

      config.flavors = configs;
      await fs.writeFile(configPath, yaml.stringify(config));

      // Generate Android product flavors
      await generateAndroidFlavors(configs);

      // Generate .env files for each flavor
      await generateFlavorEnvFiles(configs);

      successSpinner(sp, 'Flavors configured! 🍦🎉');

      console.log(
        infoBox(
          '🍦 Flavors Ready!',
          [
            chalk.white('Count: ') + chalk.cyan(configs.length),
            '',
            ...configs.map((f) =>
              chalk.white('  ✅ ') + chalk.cyan(f.name) + chalk.gray(` — ${f.appName} (${f.bundleId})`)
            ),
            '',
            chalk.hex('#F7C948')('Build with flavor:'),
            chalk.cyan('  fables build --target apk --flavor prod'),
          ].join('\n')
        )
      );
    });

  // Build a specific flavor
  cmd
    .command('build <flavor>')
    .description('Build a specific flavor')
    .option('-t, --target <target>', 'Build target', 'apk')
    .action(async (flavor, opts) => {
      log.info(`Building flavor: ${chalk.cyan(flavor)}`);

      const { execa } = require('execa');
      const args = ['build', opts.target, '--flavor', flavor, '--yes'];

      try {
        const { stdout } = await execa('fables', args, { stdio: 'inherit' });
      } catch (err) {
        log.error('Build failed: ' + err.message);
      }
    });
}

async function loadFlavorsConfig() {
  const configPath = '.fables/fables.yaml';
  if (!(await fs.pathExists(configPath))) return null;
  return yaml.parse(await fs.readFile(configPath, 'utf8'));
}

async function generateAndroidFlavors(flavors) {
  const gradlePath = 'android/app/build.gradle';
  if (!(await fs.pathExists(gradlePath))) return;

  let gradle = await fs.readFile(gradlePath, 'utf8');

  // Add product flavors if not present
  const flavorBlock = `
    flavorDimensions "environment"
    productFlavors {
${flavors.map((f) => `        ${f.name} {
            dimension "environment"
            applicationIdSuffix ".${f.name}"
            versionNameSuffix "-${f.name}"
            resValue "string", "app_name", "${f.appName}"
        }`).join('\n')}
    }
`;

  if (!gradle.includes('productFlavors')) {
    // Insert before the closing of android block
    gradle = gradle.replace(/(\n\})\s*$/, flavorBlock + '$1');
    await fs.writeFile(gradlePath, gradle);
  }
}

async function generateFlavorEnvFiles(flavors) {
  for (const flavor of flavors) {
    const envPath = `.fables/secrets/${flavor.name}.env`;
    if (!(await fs.pathExists(envPath))) {
      await fs.ensureDir(path.dirname(envPath));
      await fs.writeFile(envPath, `# ${flavor.name.toUpperCase()} Environment
API_BASE_URL=https://api-${flavor.name}.example.com
APP_NAME=${flavor.appName}
ENVIRONMENT=${flavor.environment}
`);
    }
  }
}

module.exports = { flavorsCommand };
