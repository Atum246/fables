/**
 * 🧪 fables test — Run tests with beautiful output
 */

const chalk = require('chalk');
const { execa } = require('execa');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, log, infoBox, createTable } = require('../ui/components');

function testCommand(program) {
  program
    .command('test')
    .description('🧪 Run Flutter tests with beautiful output')
    .option('-t, --test-file <file>', 'Specific test file')
    .option('--unit', 'Run only unit tests')
    .option('--widget', 'Run only widget tests')
    .option('--integration', 'Run integration tests')
    .option('--coverage', 'Generate coverage report')
    .option('--name <pattern>', 'Run tests matching name pattern')
    .option('--reporter <reporter>', 'Test reporter (compact, expanded, json)', 'expanded')
    .option('--concurrency <count>', 'Test concurrency', '4')
    .action(async (opts) => {
      showBanner();
      log.chapter('Running Tests 🧪');

      const args = ['test'];

      if (opts.testFile) args.push(opts.testFile);
      if (opts.unit) args.push('test/unit');
      if (opts.widget) args.push('test/widget');
      if (opts.integration) args.push('integration_test');
      if (opts.coverage) args.push('--coverage');
      if (opts.name) args.push('--name', opts.name);
      if (opts.reporter) args.push('--reporter', opts.reporter);
      if (opts.concurrency) args.push('--concurrency', opts.concurrency);

      const sp = spinner('Running tests... 🧪');
      const startTime = Date.now();

      try {
        const { stdout, stderr } = await execa('flutter', args, { reject: false, all: true });
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        const output = stdout + stderr;

        // Parse results
        const passMatch = output.match(/(\d+) passed/);
        const failMatch = output.match(/(\d+) failed/);
        const skipMatch = output.match(/(\d+) skipped/);
        const errorMatch = output.match(/(\d+) errors/);

        const passed = passMatch ? parseInt(passMatch[1]) : 0;
        const failed = failMatch ? parseInt(failMatch[1]) : 0;
        const skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
        const errors = errorMatch ? parseInt(errorMatch[1]) : 0;

        if (failed > 0 || errors > 0) {
          failSpinner(sp, `${failed} failed, ${passed} passed (${elapsed}s)`);
        } else {
          successSpinner(sp, `All ${passed} tests passed! (${elapsed}s)`);
        }

        // Show results table
        const table = createTable(['Metric', 'Count']);
        table.push(
          [chalk.green('✅ Passed'), chalk.green.bold(passed.toString())],
          [chalk.red('❌ Failed'), failed > 0 ? chalk.red.bold(failed.toString()) : chalk.gray('0')],
          [chalk.yellow('⏭️  Skipped'), skipped > 0 ? chalk.yellow(skipped.toString()) : chalk.gray('0')],
          [chalk.cyan('⏱️  Time'), chalk.cyan(`${elapsed}s`)],
        );

        console.log(table.toString());

        // Show output
        if (failed > 0 || errors > 0) {
          console.log('\n' + chalk.red.bold('═══ Failed Tests ═══'));
          console.log(output);
        }

        // Coverage summary
        if (opts.coverage) {
          const fs = require('fs-extra');
          const lcovPath = 'coverage/lcov.info';
          if (await fs.pathExists(lcovPath)) {
            log.info('Coverage report: ' + chalk.cyan('coverage/lcov.info'));
            log.info('View HTML: ' + chalk.cyan('genhtml coverage/lcov.info -o coverage/html'));
          }
        }

        if (failed > 0 || errors > 0) process.exit(1);
      } catch (err) {
        failSpinner(sp, 'Tests failed');
        log.error(err.message);
        process.exit(1);
      }
    });
}

module.exports = { testCommand };
