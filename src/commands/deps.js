/**
 * 📦 fables deps — Dependency management & auditing
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const { execa } = require('execa');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, log, infoBox, warnBox, createTable } = require('../ui/components');

function depsCommand(program) {
  const cmd = program.command('deps').description('📦 Dependency management');

  // Show dependency tree
  cmd
    .command('list')
    .description('List all dependencies with versions')
    .option('--outdated', 'Show only outdated packages')
    .option('--dev', 'Include dev dependencies')
    .action(async (opts) => {
      showBanner();
      log.chapter('Dependencies 📦');

      const pubspecPath = 'pubspec.yaml';
      if (!(await fs.pathExists(pubspecPath))) {
        log.error('No pubspec.yaml found!');
        process.exit(1);
      }

      const pubspec = yaml.parse(await fs.readFile(pubspecPath, 'utf8'));
      const deps = pubspec.dependencies || {};
      const devDeps = pubspec.dev_dependencies || {};

      const table = createTable(['Package', 'Version', 'Type', 'Status']);

      for (const [name, version] of Object.entries(deps)) {
        if (name === 'flutter' || name === 'sdk') continue;
        const ver = typeof version === 'object' ? version.version || 'path/git' : version;
        table.push([
          chalk.white(name),
          chalk.cyan(ver),
          chalk.green('prod'),
          chalk.gray('—'),
        ]);
      }

      if (opts.dev) {
        for (const [name, version] of Object.entries(devDeps)) {
          if (name === 'flutter_test') continue;
          const ver = typeof version === 'object' ? version.version || 'path/git' : version;
          table.push([
            chalk.white(name),
            chalk.cyan(ver),
            chalk.yellow('dev'),
            chalk.gray('—'),
          ]);
        }
      }

      console.log(table.toString());

      const totalDeps = Object.keys(deps).length - 1; // exclude flutter sdk
      const totalDevDeps = Object.keys(devDeps).length - 1;
      log.info(`Total: ${chalk.cyan(totalDeps)} production + ${chalk.yellow(totalDevDeps)} dev dependencies`);
    });

  // Audit dependencies for issues
  cmd
    .command('audit')
    .description('🔍 Audit dependencies for known issues')
    .action(async () => {
      showBanner();
      log.chapter('Dependency Audit 🔍');

      const sp = spinner('Auditing dependencies... 🔍');
      let issues = [];

      // Check pubspec.yaml
      const pubspecPath = 'pubspec.yaml';
      if (!(await fs.pathExists(pubspecPath))) {
        failSpinner(sp, 'No pubspec.yaml found');
        process.exit(1);
      }

      const pubspec = yaml.parse(await fs.readFile(pubspecPath, 'utf8'));
      const deps = { ...pubspec.dependencies, ...pubspec.dev_dependencies };

      // Check for known problematic patterns
      for (const [name, version] of Object.entries(deps)) {
        if (typeof version === 'string') {
          // Check for unpinned versions
          if (version === 'any') {
            issues.push({ pkg: name, level: 'warn', msg: 'Unpinned version ("any") — consider pinning' });
          }
          // Check for very old SDK constraints
          if (version.includes('>=1.') && !version.includes('>=1.0.0 <2.0.0')) {
            issues.push({ pkg: name, level: 'info', msg: 'Old SDK constraint' });
          }
        }

        // Check for git dependencies (potential supply chain risk)
        if (typeof version === 'object' && version.git) {
          issues.push({
            pkg: name,
            level: 'warn',
            msg: `Git dependency: ${version.git.url || version.git} — verify source`,
          });
        }

        // Check for path dependencies
        if (typeof version === 'object' && version.path) {
          issues.push({
            pkg: name,
            level: 'info',
            msg: `Path dependency: ${version.path}`,
          });
        }
      }

      // Check for flutter_native_splash, flutter_launcher_icons etc
      const recommendedPkgs = {
        'flutter_native_splash': 'Splash screen management',
        'flutter_launcher_icons': 'App icon generation',
        'flutter_linter': 'Lint rules',
      };

      for (const [pkg, desc] of Object.entries(recommendedPkgs)) {
        if (!deps[pkg]) {
          issues.push({ pkg, level: 'info', msg: `Recommended: ${desc}` });
        }
      }

      successSpinner(sp, 'Audit complete!');

      if (issues.length === 0) {
        console.log(infoBox('🎉 All Clear!', chalk.green('No issues found in your dependencies! ✨')));
        return;
      }

      const table = createTable(['Package', 'Level', 'Issue']);
      for (const issue of issues) {
        const levelColor = issue.level === 'warn' ? chalk.yellow : chalk.cyan;
        const levelEmoji = issue.level === 'warn' ? '⚠️' : 'ℹ️';
        table.push([
          chalk.white(issue.pkg),
          levelColor(`${levelEmoji} ${issue.level}`),
          chalk.gray(issue.msg),
        ]);
      }

      console.log(table.toString());

      const warns = issues.filter((i) => i.level === 'warn').length;
      if (warns > 0) {
        console.log(warnBox(`${warns} warning(s) found. Review recommended.`));
      }
    });

  // Update dependencies
  cmd
    .command('update')
    .description('🔄 Update dependencies to latest versions')
    .option('--dry-run', 'Show what would be updated')
    .option('--major', 'Allow major version updates')
    .action(async (opts) => {
      const sp = spinner('Checking for updates... 🔄');

      try {
        const { stdout } = await execa('flutter', ['pub', 'outdated'], { reject: false });
        successSpinner(sp, 'Update check complete');

        console.log(stdout);

        if (!opts.dryRun) {
          const inquirer = require('inquirer');
          const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: 'Apply updates?',
            default: false,
          }]);

          if (confirm) {
            const updateSp = spinner('Updating... 🔄');
            await execa('flutter', ['pub', 'upgrade']);
            successSpinner(updateSp, 'Dependencies updated! 🔄✨');
          }
        }
      } catch (err) {
        failSpinner(sp, 'Update check failed');
        log.error(err.message);
      }
    });

  // Add dependency
  cmd
    .command('add <packages...>')
    .description('➕ Add dependencies')
    .option('--dev', 'Add as dev dependency')
    .action(async (packages, opts) => {
      const args = ['pub', 'add'];
      if (opts.dev) args.push('--dev');
      args.push(...packages);

      const sp = spinner(`Adding ${packages.join(', ')}... ➕`);
      try {
        await execa('flutter', args);
        successSpinner(sp, `Added ${packages.length} package(s)! ➕✨`);
      } catch (err) {
        failSpinner(sp, 'Failed to add packages');
        log.error(err.message);
      }
    });

  // Remove dependency
  cmd
    .command('remove <packages...>')
    .description('➖ Remove dependencies')
    .action(async (packages) => {
      const sp = spinner(`Removing ${packages.join(', ')}... ➖`);
      try {
        await execa('flutter', ['pub', 'remove', ...packages]);
        successSpinner(sp, `Removed ${packages.length} package(s)! ➖✨`);
      } catch (err) {
        failSpinner(sp, 'Failed to remove packages');
        log.error(err.message);
      }
    });
}

module.exports = { depsCommand };
