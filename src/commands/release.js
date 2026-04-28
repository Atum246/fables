/**
 * 🔄 fables release — Version management & release automation
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const semver = require('semver');
const { execa } = require('execa');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, createTable, log, infoBox, warnBox } = require('../ui/components');

function releaseCommand(program) {
  const cmd = program.command('release').description('🔄 Version management & releases');

  // Bump version
  cmd
    .command('bump <type>')
    .description('Bump version (major|minor|patch|build)')
    .option('--tag', 'Create git tag')
    .option('--changelog', 'Generate changelog')
    .action(async (type, opts) => {
      showBanner();
      log.chapter('Version Bump 🔄');

      if (!['major', 'minor', 'patch', 'build'].includes(type)) {
        log.error('Invalid bump type! Use: major, minor, patch, or build');
        process.exit(1);
      }

      // Read pubspec.yaml
      const pubspecPath = 'pubspec.yaml';
      if (!(await fs.pathExists(pubspecPath))) {
        log.error('No pubspec.yaml found!');
        process.exit(1);
      }

      const pubspec = yaml.parse(await fs.readFile(pubspecPath, 'utf8'));
      const currentVersion = pubspec.version || '0.0.1';
      const [version, build] = currentVersion.split('+');

      let newVersion;
      let newBuild;

      if (type === 'build') {
        newVersion = version;
        newBuild = parseInt(build || '0') + 1;
      } else {
        newVersion = semver.inc(version, type);
        newBuild = build ? parseInt(build) + 1 : 1;
      }

      const fullVersion = `${newVersion}+${newBuild}`;

      // Update pubspec.yaml
      const sp = spinner('Updating pubspec.yaml... 📝');
      pubspec.version = fullVersion;
      await fs.writeFile(pubspecPath, yaml.stringify(pubspec));
      successSpinner(sp, `Version: ${chalk.cyan(currentVersion)} → ${chalk.green(fullVersion)}`);

      // Update Fables config
      const fablesConfig = '.fables/fables.yaml';
      if (await fs.pathExists(fablesConfig)) {
        const config = yaml.parse(await fs.readFile(fablesConfig, 'utf8'));
        config.version = newVersion;
        await fs.writeFile(fablesConfig, yaml.stringify(config));
      }

      // Build number in Android
      const buildGradle = 'android/app/build.gradle';
      if (await fs.pathExists(buildGradle)) {
        let gradle = await fs.readFile(buildGradle, 'utf8');
        gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${newBuild}`);
        gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${newVersion}"`);
        await fs.writeFile(buildGradle, gradle);
        log.info('Updated android/app/build.gradle');
      }

      // Build number in iOS
      const iosPlist = 'ios/Runner/Info.plist';
      if (await fs.pathExists(iosPlist)) {
        let plist = await fs.readFile(iosPlist, 'utf8');
        plist = plist.replace(
          /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
          `$1${newVersion}$2`
        );
        plist = plist.replace(
          /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
          `$1${newBuild}$2`
        );
        await fs.writeFile(iosPlist, plist);
        log.info('Updated ios/Runner/Info.plist');
      }

      // Create git tag
      if (opts.tag) {
        const tagSpinner = spinner('Creating git tag... 🏷️');
        try {
          await execa('git', ['add', '-A']);
          await execa('git', ['commit', '-m', `chore: bump version to ${fullVersion}`]);
          await execa('git', ['tag', `-a`, `v${newVersion}`, '-m', `Release v${newVersion}`]);
          successSpinner(tagSpinner, `Tagged: v${newVersion} 🏷️`);
        } catch (err) {
          failSpinner(tagSpinner, 'Git tag failed');
          log.warn(err.message);
        }
      }

      // Generate changelog
      if (opts.changelog) {
        await generateChangelog(newVersion);
      }

      console.log(
        infoBox(
          '🔄 Version Bumped!',
          [
            chalk.white('Previous: ') + chalk.gray(currentVersion),
            chalk.white('New:      ') + chalk.green(fullVersion),
            chalk.white('Type:     ') + chalk.yellow(type),
            '',
            chalk.hex('#F7C948')('Next steps:'),
            chalk.white('  1. ') + chalk.cyan('fables build') + chalk.gray('  — build release'),
            chalk.white('  2. ') + chalk.cyan('fables release publish') + chalk.gray(' — publish'),
          ].join('\n')
        )
      );
    });

  // Generate changelog
  cmd
    .command('changelog')
    .description('📝 Generate changelog from git history')
    .option('--since <tag>', 'Since tag')
    .action(async (opts) => {
      showBanner();
      await generateChangelog('latest', opts.since);
    });

  // Current version
  cmd
    .command('version')
    .description('🏷️  Show current version')
    .action(async () => {
      const pubspecPath = 'pubspec.yaml';
      if (await fs.pathExists(pubspecPath)) {
        const pubspec = yaml.parse(await fs.readFile(pubspecPath, 'utf8'));
        const version = pubspec.version || 'unknown';
        log.info('Version: ' + chalk.cyan.bold(version));

        const [ver, build] = version.split('+');
        const table = createTable(['Component', 'Value']);
        table.push(
          ['🏷️  Version', chalk.white(ver)],
          ['🔢 Build', chalk.cyan(build || '0')],
          ['📱 Android', chalk.gray('versionCode: ' + (build || '0'))],
          ['🍎 iOS', chalk.gray('CFBundleVersion: ' + (build || '0'))],
        );
        console.log(table.toString());
      }
    });
}

async function generateChangelog(version, sinceTag) {
  const sp = spinner('Generating changelog... 📝');

  try {
    let since = sinceTag;
    if (!since) {
      try {
        const { stdout } = await execa('git', ['describe', '--tags', '--abbrev=0']);
        since = stdout.trim();
      } catch {
        since = '';
      }
    }

    const gitArgs = ['log', '--pretty=format:%h %s', '--no-merges'];
    if (since) gitArgs.push(`${since}..HEAD`);

    const { stdout } = await execa('git', gitArgs);
    const commits = stdout.split('\n').filter((l) => l.trim());

    successSpinner(sp, 'Changelog generated!');

    if (commits.length === 0) {
      log.info('No commits since last tag');
      return;
    }

    // Categorize commits
    const categories = {
      '🚀 Features': [],
      '🐛 Bug Fixes': [],
      '📝 Documentation': [],
      '🔧 Maintenance': [],
      '💥 Breaking': [],
      '📦 Other': [],
    };

    for (const commit of commits) {
      const msg = commit.substring(8); // Remove hash
      if (msg.startsWith('feat:') || msg.startsWith('feature:')) {
        categories['🚀 Features'].push(commit);
      } else if (msg.startsWith('fix:')) {
        categories['🐛 Bug Fixes'].push(commit);
      } else if (msg.startsWith('docs:')) {
        categories['📝 Documentation'].push(commit);
      } else if (msg.startsWith('chore:') || msg.startsWith('refactor:')) {
        categories['🔧 Maintenance'].push(commit);
      } else if (msg.startsWith('BREAKING:') || msg.includes('BREAKING CHANGE')) {
        categories['💥 Breaking'].push(commit);
      } else {
        categories['📦 Other'].push(commit);
      }
    }

    // Build changelog
    let changelog = `## ${version}\n\n`;
    for (const [cat, items] of Object.entries(categories)) {
      if (items.length > 0) {
        changelog += `### ${cat}\n`;
        for (const item of items) {
          changelog += `- ${item}\n`;
        }
        changelog += '\n';
      }
    }

    // Write to CHANGELOG.md
    const changelogPath = 'CHANGELOG.md';
    let existing = '';
    if (await fs.pathExists(changelogPath)) {
      existing = await fs.readFile(changelogPath, 'utf8');
    }

    await fs.writeFile(changelogPath, changelog + '\n' + existing);
    log.success('Written to ' + chalk.cyan('CHANGELOG.md'));
    console.log('\n' + changelog);
  } catch (err) {
    failSpinner(sp, 'Changelog generation failed');
    log.warn(err.message);
  }
}

module.exports = { releaseCommand };
