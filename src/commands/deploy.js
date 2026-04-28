/**
 * 📱 fables deploy — Deploy to connected devices
 */

const chalk = require('chalk');
const { execa } = require('execa');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, createTable, log, infoBox } = require('../ui/components');

function deployCommand(program) {
  program
    .command('deploy [apk]')
    .description('📱 Deploy APK to connected Android device')
    .option('-d, --device <id>', 'Target device ID')
    .option('--uninstall-first', 'Uninstall existing app first')
    .option('--debug', 'Install as debug build')
    .action(async (apkPath, opts) => {
      showBanner();
      log.chapter('Device Deployment 📱');

      // List connected devices
      const sp = spinner('Scanning for devices... 📡');
      let devices;

      try {
        const { stdout } = await execa('adb', ['devices', '-l']);
        devices = stdout
          .split('\n')
          .slice(1)
          .filter((l) => l.trim() && !l.startsWith('*'))
          .map((line) => {
            const parts = line.split(/\s+/);
            return {
              id: parts[0],
              state: parts[1],
              info: parts.slice(2).join(' '),
            };
          });
      } catch {
        failSpinner(sp, 'ADB not found! Install Android SDK platform-tools');
        process.exit(1);
      }

      if (devices.length === 0) {
        failSpinner(sp, 'No devices found!');
        log.info('Connect a device via USB or start an emulator');
        log.info('Run ' + chalk.cyan('adb devices') + ' to verify');
        process.exit(1);
      }

      successSpinner(sp, `Found ${devices.length} device(s)!`);

      // Show devices
      const table = createTable(['ID', 'State', 'Info']);
      for (const d of devices) {
        const stateColor = d.state === 'device' ? chalk.green : chalk.yellow;
        table.push([chalk.cyan(d.id), stateColor(d.state), chalk.gray(d.info)]);
      }
      console.log(table.toString());

      // Find APK if not specified
      if (!apkPath) {
        const candidates = [
          'build/fables/app-release.apk',
          'build/app/outputs/flutter-apk/app-release.apk',
          'build/app/outputs/flutter-apk/app-debug.apk',
        ];
        for (const c of candidates) {
          const fs = require('fs-extra');
          if (await fs.pathExists(c)) {
            apkPath = c;
            break;
          }
        }
      }

      if (!apkPath) {
        log.error('No APK found! Run ' + chalk.cyan('fables build --target apk') + ' first');
        process.exit(1);
      }

      // Select device
      let deviceId = opts.device;
      if (!deviceId && devices.length > 1) {
        const inquirer = require('inquirer');
        const { selected } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selected',
            message: '📱 Select device:',
            choices: devices.map((d) => ({
              name: `${d.id} (${d.info || d.state})`,
              value: d.id,
            })),
          },
        ]);
        deviceId = selected;
      }

      const deviceArgs = deviceId ? ['-s', deviceId] : [];

      // Uninstall if requested
      if (opts.uninstallFirst) {
        const unSpinner = spinner('Uninstalling existing app... 🗑️');
        try {
          // Get package name from APK
          const { stdout } = await execa('aapt2', ['dump', 'badging', apkPath], { reject: false });
          const pkgMatch = stdout.match(/package: name='([^']+)'/);
          if (pkgMatch) {
            await execa('adb', [...deviceArgs, 'uninstall', pkgMatch[1]], { reject: false });
            successSpinner(unSpinner, 'Uninstalled!');
          }
        } catch {
          failSpinner(unSpinner, 'Uninstall failed (may not be installed)');
        }
      }

      // Install APK
      const installSpinner = spinner(`Installing ${chalk.cyan(path.basename(apkPath))}... 📲`);
      try {
        const installArgs = [...deviceArgs, 'install', '-r'];
        if (opts.debug) installArgs.push('-d');
        installArgs.push(apkPath);

        await execa('adb', installArgs);
        successSpinner(installSpinner, 'Installed successfully! 🎉');

        console.log(
          infoBox(
            '📱 Deployed!',
            [
              chalk.white('APK:    ') + chalk.cyan(apkPath),
              chalk.white('Device: ') + chalk.cyan(deviceId || devices[0].id),
              '',
              chalk.hex('#F7C948')('📖 Fables — delivered to device! ✨'),
            ].join('\n')
          )
        );
      } catch (err) {
        failSpinner(installSpinner, 'Installation failed');
        log.error(err.message);
        process.exit(1);
      }
    });
}

module.exports = { deployCommand };
