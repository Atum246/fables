/**
 * ⚙️  fables config — Manage project configuration
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const yaml = require('yaml');
const { loadConfig, saveConfig } = require('../services/config');
const { log, createTable, infoBox } = require('../ui/components');

function configCommand(program) {
  const cmd = program.command('config').description('⚙️  Manage Fables configuration');

  cmd
    .command('show')
    .description('Show current configuration')
    .action(async () => {
      const config = await loadConfig();
      if (!config) {
        log.error('No config found! Run ' + chalk.cyan('fables init') + ' first.');
        return;
      }

      console.log(
        infoBox(
          '⚙️  Configuration',
          yaml.stringify(config),
          { borderColor: 'yellow' }
        )
      );
    });

  cmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key, value) => {
      const config = await loadConfig();
      if (!config) {
        log.error('No config found! Run ' + chalk.cyan('fables init') + ' first.');
        return;
      }

      // Support nested keys like "android.targets"
      const keys = key.split('.');
      let obj = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }

      // Parse value types
      let parsedValue = value;
      if (value === 'true') parsedValue = true;
      else if (value === 'false') parsedValue = false;
      else if (!isNaN(value) && value.trim() !== '') parsedValue = Number(value);
      else if ((value.startsWith('[') && value.endsWith(']')) || (value.startsWith('{') && value.endsWith('}'))) {
        try { parsedValue = JSON.parse(value); } catch { /* keep as string */ }
      }

      obj[keys[keys.length - 1]] = parsedValue;
      await saveConfig(config);

      log.success(`${chalk.cyan(key)} set to ${chalk.yellow(JSON.stringify(parsedValue))} ✅`);
    });

  cmd
    .command('path')
    .description('Show config file path')
    .action(() => {
      log.info('Config: ' + chalk.cyan('.fables/fables.yaml'));
    });
}

module.exports = { configCommand };
