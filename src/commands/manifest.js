/**
 * 📄 fables manifest — AndroidManifest.xml viewer & editor
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const { showBanner } = require('../ui/banner');
const { log, infoBox, createTable, spinner, successSpinner } = require('../ui/components');

function manifestCommand(program) {
  const cmd = program.command('manifest').description('📄 AndroidManifest.xml management');

  // Show manifest summary
  cmd
    .command('show')
    .description('Show AndroidManifest.xml summary')
    .action(async () => {
      showBanner();
      log.chapter('AndroidManifest.xml 📄');

      const manifestPath = 'android/app/src/main/AndroidManifest.xml';
      if (!(await fs.pathExists(manifestPath))) {
        log.error('AndroidManifest.xml not found!');
        process.exit(1);
      }

      const content = await fs.readFile(manifestPath, 'utf8');

      // Parse key information
      const packageMatch = content.match(/package="([^"]+)"/);
      const versionMatch = content.match(/android:versionName="([^"]+)"/);
      const versionCodeMatch = content.match(/android:versionCode="([^"]+)"/);
      const minSdkMatch = content.match(/android:minSdkVersion="([^"]+)"/);
      const targetSdkMatch = content.match(/android:targetSdkVersion="([^"]+)"/);
      const debuggable = content.match(/android:debuggable="([^"]+)"/);
      const usesCleartext = content.match(/android:usesCleartextTraffic="([^"]+)"/);

      const table = createTable(['Property', 'Value']);
      if (packageMatch) table.push(['📦 Package', chalk.cyan(packageMatch[1])]);
      if (versionMatch) table.push(['🏷️  Version', chalk.white(versionMatch[1])]);
      if (versionCodeMatch) table.push(['🔢 Version Code', chalk.yellow(versionCodeMatch[1])]);
      if (debuggable) table.push(['🐛 Debuggable', debuggable[1] === 'true' ? chalk.red('Yes ⚠️') : chalk.green('No')]);
      if (usesCleartext) table.push(['🌐 Cleartext', usesCleartext[1] === 'true' ? chalk.yellow('Allowed') : chalk.green('Blocked')]);

      console.log(table.toString());

      // Show permissions
      const permissions = content.match(/android\.permission\.\w+/g) || [];
      if (permissions.length > 0) {
        log.info(`Permissions: ${chalk.cyan(permissions.length)}`);
        for (const p of permissions) {
          console.log(chalk.gray(`  • ${p.replace('android.permission.', '')}`));
        }
      }

      // Show activities
      const activities = content.match(/android:name="[^"]*Activity[^"]*"/g) || [];
      if (activities.length > 0) {
        log.info(`Activities: ${chalk.cyan(activities.length)}`);
        for (const a of activities) {
          const name = a.match(/android:name="([^"]+)"/)[1];
          console.log(chalk.gray(`  • ${name}`));
        }
      }
    });

  // Validate manifest
  cmd
    .command('validate')
    .description('Validate AndroidManifest.xml')
    .action(async () => {
      const manifestPath = 'android/app/src/main/AndroidManifest.xml';
      if (!(await fs.pathExists(manifestPath))) {
        log.error('AndroidManifest.xml not found!');
        process.exit(1);
      }

      const content = await fs.readFile(manifestPath, 'utf8');
      const issues = [];

      // Check for common issues
      if (!content.includes('package=')) {
        issues.push({ level: 'error', msg: 'Missing package attribute' });
      }

      if (content.includes('android:debuggable="true"')) {
        issues.push({ level: 'warn', msg: 'Debug mode enabled — disable for release!' });
      }

      if (content.includes('android:usesCleartextTraffic="true"')) {
        issues.push({ level: 'warn', msg: 'Cleartext traffic allowed — security risk' });
      }

      if (!content.includes('android:allowBackup')) {
        issues.push({ level: 'info', msg: 'allowBackup not set — defaults to true' });
      }

      if (!content.includes('android:networkSecurityConfig')) {
        issues.push({ level: 'info', msg: 'No network security config — consider adding for production' });
      }

      if (issues.length === 0) {
        log.success('Manifest looks good! ✅');
      } else {
        for (const issue of issues) {
          const fn = issue.level === 'error' ? log.error : issue.level === 'warn' ? log.warn : log.info;
          fn(issue.msg);
        }
      }
    });

  // Set a manifest attribute
  cmd
    .command('set <attribute> <value>')
    .description('Set a manifest attribute')
    .action(async (attribute, value) => {
      const manifestPath = 'android/app/src/main/AndroidManifest.xml';
      if (!(await fs.pathExists(manifestPath))) {
        log.error('AndroidManifest.xml not found!');
        process.exit(1);
      }

      let content = await fs.readFile(manifestPath, 'utf8');
      const attrName = `android:${attribute}`;
      const regex = new RegExp(`${attrName}="[^"]*"`);

      if (regex.test(content)) {
        content = content.replace(regex, `${attrName}="${value}"`);
      } else {
        // Add to <application> or <manifest>
        content = content.replace(/<application/, `<application ${attrName}="${value}"`);
      }

      await fs.writeFile(manifestPath, content);
      log.success(`${chalk.cyan(attrName)} set to ${chalk.yellow(value)} ✅`);
    });
}

module.exports = { manifestCommand };
