/**
 * 📋 fables permissions — Manage app permissions
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const { showBanner } = require('../ui/banner');
const { log, infoBox, warnBox, createTable, spinner, successSpinner } = require('../ui/components');

const COMMON_PERMISSIONS = {
  // Android
  'android.permission.CAMERA': { desc: 'Camera access', emoji: '📷' },
  'android.permission.RECORD_AUDIO': { desc: 'Microphone', emoji: '🎤' },
  'android.permission.ACCESS_FINE_LOCATION': { desc: 'Precise location', emoji: '📍' },
  'android.permission.ACCESS_COARSE_LOCATION': { desc: 'Approximate location', emoji: '📍' },
  'android.permission.READ_EXTERNAL_STORAGE': { desc: 'Read storage', emoji: '📂' },
  'android.permission.WRITE_EXTERNAL_STORAGE': { desc: 'Write storage', emoji: '📂' },
  'android.permission.READ_MEDIA_IMAGES': { desc: 'Read photos', emoji: '🖼️' },
  'android.permission.READ_MEDIA_VIDEO': { desc: 'Read videos', emoji: '🎬' },
  'android.permission.INTERNET': { desc: 'Internet access', emoji: '🌐' },
  'android.permission.ACCESS_NETWORK_STATE': { desc: 'Network state', emoji: '📶' },
  'android.permission.BLUETOOTH': { desc: 'Bluetooth', emoji: '🔵' },
  'android.permission.NFC': { desc: 'NFC', emoji: '📡' },
  'android.permission.VIBRATE': { desc: 'Vibrate', emoji: '📳' },
  'android.permission.USE_BIOMETRIC': { desc: 'Biometric auth', emoji: '🔐' },
  'android.permission.USE_FINGERPRINT': { desc: 'Fingerprint', emoji: '👆' },
  'android.permission.POST_NOTIFICATIONS': { desc: 'Notifications', emoji: '🔔' },
  'android.permission.SCHEDULE_EXACT_ALARM': { desc: 'Exact alarms', emoji: '⏰' },
  'android.permission.CALL_PHONE': { desc: 'Phone calls', emoji: '📞' },
  'android.permission.READ_CONTACTS': { desc: 'Read contacts', emoji: '👥' },
  'android.permission.ACTIVITY_RECOGNITION': { desc: 'Activity recognition', emoji: '🏃' },
};

function permissionsCommand(program) {
  const cmd = program.command('permissions').description('📋 Manage app permissions');

  // List current permissions
  cmd
    .command('list')
    .description('Show current app permissions')
    .action(async () => {
      showBanner();
      log.chapter('App Permissions 📋');

      const manifestPath = 'android/app/src/main/AndroidManifest.xml';
      if (!(await fs.pathExists(manifestPath))) {
        log.error('AndroidManifest.xml not found!');
        process.exit(1);
      }

      const content = await fs.readFile(manifestPath, 'utf8');
      const permissionRegex = /android\.permission\.([A-Z_]+)/g;
      const found = [];
      let match;

      while ((match = permissionRegex.exec(content)) !== null) {
        const full = `android.permission.${match[1]}`;
        const info = COMMON_PERMISSIONS[full];
        found.push({
          name: full,
          desc: info?.desc || 'Custom permission',
          emoji: info?.emoji || '📋',
        });
      }

      if (found.length === 0) {
        log.info('No permissions declared');
        return;
      }

      const table = createTable(['Permission', 'Description', 'Category']);
      for (const p of found) {
        table.push([
          chalk.white(p.name.replace('android.permission.', '')),
          chalk.cyan(`${p.emoji} ${p.desc}`),
          chalk.gray('Android'),
        ]);
      }

      console.log(table.toString());
      log.info(`Total: ${chalk.cyan(found.length)} permission(s)`);
    });

  // Add permission
  cmd
    .command('add <permission>')
    .description('Add a permission to AndroidManifest.xml')
    .action(async (permission) => {
      const manifestPath = 'android/app/src/main/AndroidManifest.xml';
      if (!(await fs.pathExists(manifestPath))) {
        log.error('AndroidManifest.xml not found!');
        process.exit(1);
      }

      let content = await fs.readFile(manifestPath, 'utf8');
      const fullPerm = permission.includes('.') ? permission : `android.permission.${permission}`;

      if (content.includes(fullPerm)) {
        log.warn(`Permission already exists: ${chalk.cyan(fullPerm)}`);
        return;
      }

      // Insert before </manifest>
      content = content.replace('</manifest>', `    <uses-permission android:name="${fullPerm}"/>\n</manifest>`);
      await fs.writeFile(manifestPath, content);

      const info = COMMON_PERMISSIONS[fullPerm];
      log.success(`Added: ${info?.emoji || '📋'} ${chalk.cyan(fullPerm)} — ${info?.desc || 'Custom'}`);
    });

  // Remove permission
  cmd
    .command('remove <permission>')
    .description('Remove a permission from AndroidManifest.xml')
    .action(async (permission) => {
      const manifestPath = 'android/app/src/main/AndroidManifest.xml';
      if (!(await fs.pathExists(manifestPath))) {
        log.error('AndroidManifest.xml not found!');
        process.exit(1);
      }

      let content = await fs.readFile(manifestPath, 'utf8');
      const fullPerm = permission.includes('.') ? permission : `android.permission.${permission}`;
      const regex = new RegExp(`\\s*<uses-permission android:name="${fullPerm.replace('.', '\\.')}"/>`, 'g');

      if (!regex.test(content)) {
        log.warn(`Permission not found: ${chalk.cyan(fullPerm)}`);
        return;
      }

      content = content.replace(regex, '');
      await fs.writeFile(manifestPath, content);
      log.success(`Removed: ${chalk.cyan(fullPerm)}`);
    });

  // Suggest permissions based on dependencies
  cmd
    .command('suggest')
    .description('Suggest permissions based on your dependencies')
    .action(async () => {
      showBanner();
      log.chapter('Permission Suggestions 📋');

      const pubspecPath = 'pubspec.yaml';
      if (!(await fs.pathExists(pubspecPath))) {
        log.error('No pubspec.yaml found!');
        process.exit(1);
      }

      const yaml = require('yaml');
      const pubspec = yaml.parse(await fs.readFile(pubspecPath, 'utf8'));
      const deps = Object.keys({ ...pubspec.dependencies, ...pubspec.dev_dependencies });

      const suggestions = [];

      const permissionMap = {
        'camera': ['CAMERA'],
        'image_picker': ['CAMERA', 'READ_EXTERNAL_STORAGE'],
        'geolocator': ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
        'location': ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
        'permission_handler': ['CAMERA', 'ACCESS_FINE_LOCATION', 'RECORD_AUDIO'],
        'record': ['RECORD_AUDIO', 'CAMERA'],
        'audio_players': ['INTERNET'],
        'connectivity_plus': ['ACCESS_NETWORK_STATE', 'INTERNET'],
        'network_info_plus': ['ACCESS_NETWORK_STATE'],
        'bluetooth_plus': ['BLUETOOTH'],
        'nfc_manager': ['NFC'],
        'vibration': ['VIBRATE'],
        'local_auth': ['USE_BIOMETRIC', 'USE_FINGERPRINT'],
        'flutter_contacts': ['READ_CONTACTS'],
        'url_launcher': ['INTERNET'],
        'firebase_messaging': ['POST_NOTIFICATIONS', 'INTERNET'],
        'health': ['ACTIVITY_RECOGNITION'],
      };

      for (const dep of deps) {
        if (permissionMap[dep]) {
          for (const perm of permissionMap[dep]) {
            suggestions.push({
              package: dep,
              permission: `android.permission.${perm}`,
              desc: COMMON_PERMISSIONS[`android.permission.${perm}`]?.desc || perm,
            });
          }
        }
      }

      if (suggestions.length === 0) {
        log.info('No permission suggestions based on current dependencies');
        return;
      }

      const table = createTable(['Package', 'Suggested Permission', 'Description']);
      for (const s of suggestions) {
        table.push([
          chalk.white(s.package),
          chalk.cyan(s.permission.replace('android.permission.', '')),
          chalk.gray(s.desc),
        ]);
      }

      console.log(table.toString());
      log.info('Add with: ' + chalk.cyan('fables permissions add <permission>'));
    });
}

module.exports = { permissionsCommand };
