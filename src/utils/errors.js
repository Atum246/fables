/**
 * 💥 Error Handler — Graceful error handling for Fables
 */

const chalk = require('chalk');
const { errorBox, log } = require('../ui/components');

function errorHandler(err) {
  // Commander help/version exits — these are normal
  if (err.code === 'EEXIT' || err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
    process.exit(0);
  }

  if (err.code === 'COMMANDER_MISSING_ARGUMENT') {
    console.log(errorBox(`Missing argument: ${err.message}`));
    process.exit(1);
  }

  if (err.code === 'COMMANDER_UNKNOWN_COMMAND') {
    console.log(errorBox(`Unknown command: ${err.message}`));
    log.info('Run ' + chalk.cyan('fables --help') + ' for available commands');
    process.exit(1);
  }

  // Docker errors
  if (err.message?.includes('docker')) {
    console.log(
      errorBox(
        [
          chalk.white('Docker error: ') + chalk.red(err.message),
          '',
          chalk.yellow('Troubleshooting:'),
          chalk.white('  1. Make sure Docker is running'),
          chalk.white('  2. Try: ') + chalk.cyan('docker info'),
          chalk.white('  3. Restart Docker daemon'),
        ].join('\n')
      )
    );
    process.exit(1);
  }

  // Flutter errors
  if (err.message?.includes('flutter')) {
    console.log(
      errorBox(
        [
          chalk.white('Flutter error: ') + chalk.red(err.message),
          '',
          chalk.yellow('Try:'),
          chalk.white('  • ') + chalk.cyan('flutter doctor'),
          chalk.white('  • ') + chalk.cyan('flutter clean'),
          chalk.white('  • ') + chalk.cyan('flutter pub get'),
        ].join('\n')
      )
    );
    process.exit(1);
  }

  // Generic error
  console.log(
    errorBox(
      [
        chalk.red(err.message || 'An unexpected error occurred'),
        '',
        chalk.gray('Stack trace:'),
        chalk.gray(err.stack?.split('\n').slice(0, 5).join('\n')),
        '',
        chalk.yellow('If this persists, open an issue:'),
        chalk.cyan('https://github.com/fables-cli/fables/issues'),
      ].join('\n')
    )
  );

  process.exit(1);
}

// Process-level error handlers
process.on('uncaughtException', (err) => {
  log.error('Uncaught exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  log.error('Unhandled rejection:', err?.message || err);
  process.exit(1);
});

module.exports = { errorHandler };
