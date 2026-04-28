/**
 * 📱 fables run — Run app on connected device/emulator
 */

const chalk = require('chalk');
const { execa } = require('execa');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, log, infoBox, createTable } = require('../ui/components');

function runCommand(program) {
  program
    .command('run')
    .description('📱 Run your Flutter app on a connected device or emulator')
    .option('-d, --device <id>', 'Target device ID')
    .option('--flavor <flavor>', 'Build flavor')
    .option('--debug', 'Run in debug mode', true)
    .option('--profile', 'Run in profile mode')
    .option('--release', 'Run in release mode')
    .option('--dart-define <defines...>', 'Dart defines (KEY=VALUE)')
    .option('--hot', 'Enable hot reload (debug mode)', true)
    .option('--no-hot', 'Disable hot reload')
    .action(async (opts) => {
      showBanner();
      log.chapter('Running App 📱');

      const args = ['run'];

      if (opts.device) args.push('-d', opts.device);
      if (opts.flavor) args.push('--flavor', opts.flavor);
      if (opts.profile) { args.push('--profile'); args.splice(args.indexOf('--debug'), 1); }
      if (opts.release) { args.push('--release'); args.splice(args.indexOf('--debug'), 1); }
      if (opts.dartDefine) {
        for (const d of opts.dartDefine) args.push('--dart-define', d);
      }

      const sp = spinner('Launching app... 🚀');
      try {
        const subprocess = execa('flutter', args, { stdio: 'inherit' });
        successSpinner(sp, 'App launched! 📱');
        log.info('Press ' + chalk.cyan('r') + ' to hot reload, ' + chalk.cyan('R') + ' to hot restart');
        log.info('Press ' + chalk.cyan('q') + ' to quit');
        await subprocess;
      } catch (err) {
        failSpinner(sp, 'Launch failed');
        log.error(err.message);
      }
    });
}

module.exports = { runCommand };
