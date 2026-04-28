/**
 * 🖥️ fables emulator — Manage Android emulators
 */

const chalk = require('chalk');
const { execa } = require('execa');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, log, infoBox, createTable } = require('../ui/components');

function emulatorCommand(program) {
  const cmd = program.command('emulator').description('🖥️  Manage Android emulators');

  // List emulators
  cmd
    .command('list')
    .description('List available Android emulators')
    .action(async () => {
      const sp = spinner('Scanning emulators... 🖥️');
      try {
        const { stdout } = await execa('emulator', ['-list-avds']);
        const avds = stdout.split('\n').filter((l) => l.trim());
        successSpinner(sp, `Found ${avds.length} emulator(s)`);

        if (avds.length === 0) {
          log.info('No emulators found. Create one with: ' + chalk.cyan('fables emulator create'));
          return;
        }

        const table = createTable(['#', 'AVD Name', 'Status']);
        for (let i = 0; i < avds.length; i++) {
          table.push([chalk.gray(i + 1), chalk.white(avds[i]), chalk.gray('Available')]);
        }
        console.log(table.toString());
      } catch (err) {
        failSpinner(sp, 'Could not list emulators');
        log.error('Android SDK emulator not found');
      }
    });

  // Launch emulator
  cmd
    .command('launch [name]')
    .description('Launch an Android emulator')
    .option('--no-audio', 'Disable audio')
    .option('--gpu <mode>', 'GPU mode (auto, host, swiftshader)', 'auto')
    .option('--cold', 'Cold boot (no snapshot)')
    .action(async (name, opts) => {
      const sp = spinner(`Launching emulator${name ? `: ${name}` : ''}... 🖥️`);
      const args = [];

      if (name) args.push('-avd', name);
      if (opts.noAudio) args.push('-no-audio');
      if (opts.gpu) args.push('-gpu', opts.gpu);
      if (opts.cold) args.push('-no-snapshot-save');

      try {
        const subprocess = execa('emulator', args, { stdio: 'ignore', detached: true });
        subprocess.unref();
        successSpinner(sp, 'Emulator launching! 🖥️✨');
        log.info('It may take a moment to boot up ⏳');
      } catch (err) {
        failSpinner(sp, 'Launch failed');
        log.error(err.message);
      }
    });

  // Create emulator
  cmd
    .command('create')
    .description('Create a new Android emulator')
    .option('-n, --name <name>', 'Emulator name')
    .option('-a, --api <level>', 'API level', '34')
    .option('-d, --device <device>', 'Device profile', 'pixel_7')
    .action(async (opts) => {
      const inquirer = require('inquirer');

      // List available system images
      const sp = spinner('Checking available system images... 📦');
      let images = [];
      try {
        const { stdout } = await execa('sdkmanager', ['--list']);
        const lines = stdout.split('\n');
        images = lines
          .filter((l) => l.includes('system-images') && l.includes('google_apis'))
          .map((l) => l.trim().split(' ')[0]);
      } catch {
        // sdkmanager not available
      }

      successSpinner(sp, `Found ${images.length} system image(s)`);

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: '🖥️  Emulator name:',
          default: opts.name || 'fables_emulator',
        },
        {
          type: 'list',
          name: 'image',
          message: '📱 System image:',
          choices: images.length > 0 ? images : [
            `system-images;android-${opts.api};google_apis;x86_64`,
            `system-images;android-${opts.api};google_apis_playstore;x86_64`,
          ],
        },
        {
          type: 'list',
          name: 'device',
          message: '📱 Device profile:',
          choices: ['pixel_7', 'pixel_7_pro', 'pixel_6', 'pixel_6a', 'pixel_fold', 'pixel_tablet'],
          default: opts.device,
        },
      ]);

      const createSp = spinner('Creating emulator... 🏗️');
      try {
        // Install system image
        await execa('sdkmanager', ['--install', answers.image], { stdio: 'ignore' });

        // Create AVD
        await execa('avdmanager', [
          'create', 'avd',
          '-n', answers.name,
          '-k', answers.image,
          '-d', answers.device,
          '--force',
        ]);

        successSpinner(createSp, `Emulator "${answers.name}" created! 🖥️🎉`);
        log.info('Launch with: ' + chalk.cyan(`fables emulator launch ${answers.name}`));
      } catch (err) {
        failSpinner(createSp, 'Creation failed');
        log.error(err.message);
      }
    });

  // List running emulators
  cmd
    .command('running')
    .description('Show running emulators/devices')
    .action(async () => {
      try {
        const { stdout } = await execa('adb', ['devices', '-l']);
        const devices = stdout
          .split('\n')
          .slice(1)
          .filter((l) => l.trim() && !l.startsWith('*'));

        if (devices.length === 0) {
          log.info('No devices/emulators running');
          return;
        }

        const table = createTable(['ID', 'State', 'Type', 'Info']);
        for (const line of devices) {
          const parts = line.split(/\s+/);
          const id = parts[0];
          const state = parts[1];
          const info = parts.slice(2).join(' ');
          const type = id.includes('emulator') ? '🖥️  Emulator' : '📱 Device';
          table.push([
            chalk.cyan(id),
            state === 'device' ? chalk.green(state) : chalk.yellow(state),
            type,
            chalk.gray(info),
          ]);
        }
        console.log(table.toString());
      } catch {
        log.error('ADB not found');
      }
    });
}

module.exports = { emulatorCommand };
