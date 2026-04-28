/**
 * 🔐 fables sign — Manage signing keys & profiles
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, createTable, log, infoBox } = require('../ui/components');

function signCommand(program) {
  const cmd = program.command('sign').description('🔐 Manage signing keys & profiles');

  cmd
    .command('generate')
    .description('Generate a new Android keystore')
    .option('-n, --name <name>', 'Keystore alias name')
    .option('-d, --directory <dir>', 'Output directory', '.fables/keystores')
    .action(async (opts) => {
      showBanner();
      log.chapter('Generate Keystore 🔐');

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'alias',
          message: 'Key alias name:',
          default: opts.name || 'fables-key',
        },
        {
          type: 'input',
          name: 'cn',
          message: 'Your name (CN):',
          default: 'Fables User',
        },
        {
          type: 'input',
          name: 'org',
          message: 'Organization (O):',
          default: '',
        },
        {
          type: 'input',
          name: 'ou',
          message: 'Organizational Unit (OU):',
          default: '',
        },
        {
          type: 'input',
          name: 'city',
          message: 'City (L):',
          default: '',
        },
        {
          type: 'input',
          name: 'state',
          message: 'State (ST):',
          default: '',
        },
        {
          type: 'input',
          name: 'country',
          message: 'Country Code (C):',
          default: 'US',
        },
        {
          type: 'password',
          name: 'password',
          message: 'Keystore password:',
          validate: (input) => input.length >= 6 || 'Password must be at least 6 characters',
        },
      ]);

      const sp = spinner('Generating keystore... 🔑');

      try {
        const outputDir = path.resolve(opts.directory);
        await fs.ensureDir(outputDir);

        const keystorePath = path.join(outputDir, `${answers.alias}.jks`);
        const dname = `CN=${answers.cn}, O=${answers.org || 'N/A'}, OU=${answers.ou || 'N/A'}, L=${answers.city || 'N/A'}, ST=${answers.state || 'N/A'}, C=${answers.country}`;

        const { execa } = require('execa');
        await execa('keytool', [
          '-genkeypair',
          '-v',
          '-keystore', keystorePath,
          '-alias', answers.alias,
          '-keyalg', 'RSA',
          '-keysize', '2048',
          '-validity', '10000',
          '-storepass', answers.password,
          '-keypass', answers.password,
          '-dname', dname,
        ]);

        successSpinner(sp, 'Keystore generated! 🔐');

        // Save signing profile
        const profilePath = path.join('.fables/profiles', `${answers.alias}.json`);
        await fs.ensureDir(path.dirname(profilePath));
        await fs.writeJson(profilePath, {
          alias: answers.alias,
          keystore: path.relative(process.cwd(), keystorePath),
          createdAt: new Date().toISOString(),
          // Don't store password — that's a security no-no 🚫
        }, { spaces: 2 });

        console.log(
          infoBox(
            '🔐 Keystore Created!',
            [
              chalk.white('Path:    ') + chalk.cyan(keystorePath),
              chalk.white('Alias:   ') + chalk.cyan(answers.alias),
              chalk.white('Profile: ') + chalk.cyan(profilePath),
              '',
              chalk.yellow('⚠️  Keep your keystore and password safe!'),
              chalk.gray('You\'ll need them for every release build.'),
              '',
              chalk.hex('#F7C948')('Next: ') + chalk.white('fables build --target apk'),
            ].join('\n')
          )
        );
      } catch (err) {
        failSpinner(sp, 'Failed to generate keystore');
        log.error(err.message);
      }
    });

  cmd
    .command('list')
    .description('List signing profiles')
    .action(async () => {
      const profilesDir = '.fables/profiles';

      if (!(await fs.pathExists(profilesDir))) {
        log.info('No signing profiles found. Run ' + chalk.cyan('fables sign generate') + ' to create one.');
        return;
      }

      const files = await fs.readdir(profilesDir);
      const profiles = [];

      for (const file of files.filter((f) => f.endsWith('.json'))) {
        const profile = await fs.readJson(path.join(profilesDir, file));
        profiles.push(profile);
      }

      if (profiles.length === 0) {
        log.info('No signing profiles found.');
        return;
      }

      const table = createTable(['Alias', 'Keystore', 'Created']);
      for (const p of profiles) {
        table.push([
          chalk.white.bold(p.alias),
          chalk.cyan(p.keystore),
          chalk.gray(p.createdAt),
        ]);
      }

      console.log(table.toString());
    });
}

module.exports = { signCommand };
