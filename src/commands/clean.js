/**
 * 🧹 fables clean — Clean build artifacts
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { spinner, successSpinner, log, infoBox } = require('../ui/components');

function cleanCommand(program) {
  program
    .command('clean')
    .description('🧹 Clean build artifacts & caches')
    .option('--all', 'Deep clean (including .fables cache)')
    .option('--flutter', 'Also run flutter clean')
    .action(async (opts) => {
      const sp = spinner('Cleaning build artifacts... 🧹');
      let cleaned = 0;

      const targets = [
        'build/fables',
        'build/app',
        'build/ios',
      ];

      if (opts.all) {
        targets.push('.fables/cache');
      }

      for (const target of targets) {
        if (await fs.pathExists(target)) {
          await fs.remove(target);
          cleaned++;
        }
      }

      if (opts.flutter) {
        try {
          const { execa } = require('execa');
          await execa('flutter', ['clean']);
          cleaned++;
        } catch {
          // Flutter not available
        }
      }

      successSpinner(sp, `Cleaned ${cleaned} target(s)! 🧹✨`);

      console.log(
        infoBox(
          '🧹 Clean Complete!',
          [
            chalk.white('Removed: ') + chalk.cyan(`${cleaned} items`),
            '',
            opts.all
              ? chalk.green('Deep clean performed! 🧹💨')
              : chalk.gray('Use --all for deep clean including cache'),
          ].join('\n')
        )
      );
    });
}

module.exports = { cleanCommand };
