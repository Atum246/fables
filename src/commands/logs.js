/**
 * 📜 fables logs — View device logs with filtering
 */

const chalk = require('chalk');
const { execa } = require('execa');
const { showBanner } = require('../ui/banner');
const { log, createTable } = require('../ui/components');

function logsCommand(program) {
  program
    .command('logs')
    .description('📜 View device logs with smart filtering')
    .option('-d, --device <id>', 'Target device')
    .option('-f, --filter <tag>', 'Filter by tag')
    .option('-l, --level <level>', 'Log level: V/D/I/W/E', 'V')
    .option('-s, --search <text>', 'Search log text')
    .option('--flutter', 'Show only Flutter/Dart logs')
    .option('--clear', 'Clear logcat first')
    .option('-n, --lines <count>', 'Number of lines', '100')
    .action(async (opts) => {
      showBanner();
      log.chapter('Device Logs 📜');

      const args = ['logcat', '-d', '-v', 'time'];

      if (opts.device) args.unshift('-s', opts.device);
      if (opts.clear) await execa('adb', ['logcat', '-c'], { reject: false });

      // Build filter
      const filters = [];

      // Log level filter
      const levelMap = { V: 'Verbose', D: 'Debug', I: 'Info', W: 'Warn', E: 'Error' };
      if (opts.level !== 'V') {
        filters.push(`*:${opts.level}`);
      }

      // Flutter-specific filter
      if (opts.flutter) {
        filters.push('flutter:V', 'dart:V', 'FlutterEngine:V');
      }

      // Tag filter
      if (opts.filter) {
        filters.push(`${opts.filter}:V`);
      }

      if (filters.length > 0) {
        args.push(...filters);
      }

      try {
        const { stdout } = await execa('adb', args, { reject: false });
        let lines = stdout.split('\n').filter((l) => l.trim());

        // Search filter
        if (opts.search) {
          const searchLower = opts.search.toLowerCase();
          lines = lines.filter((l) => l.toLowerCase().includes(searchLower));
        }

        // Limit lines
        const limit = parseInt(opts.lines);
        if (lines.length > limit) {
          lines = lines.slice(-limit);
        }

        // Colorize output
        for (const line of lines) {
          let colored = line;

          // Color by log level
          if (line.includes(' V ')) colored = chalk.gray(line);
          else if (line.includes(' D ')) colored = chalk.white(line);
          else if (line.includes(' I ')) colored = chalk.cyan(line);
          else if (line.includes(' W ')) colored = chalk.yellow(line);
          else if (line.includes(' E ')) colored = chalk.red(line);
          else if (line.includes(' F ')) colored = chalk.red.bold(line);

          // Highlight Flutter lines
          if (line.includes('flutter') || line.includes('Flutter')) {
            colored = chalk.hex('#00B4D8')(line);
          }

          console.log(colored);
        }

        if (lines.length === 0) {
          log.info('No logs matching your filters');
          log.info('Try: ' + chalk.cyan('fables logs --flutter'));
        } else {
          log.info(`Showing ${chalk.cyan(lines.length)} log entries`);
        }
      } catch (err) {
        log.error('ADB not found or device not connected');
        log.info('Run ' + chalk.cyan('fables emulator running') + ' to check devices');
      }
    });
}

module.exports = { logsCommand };
