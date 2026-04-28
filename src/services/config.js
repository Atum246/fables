/**
 * ⚙️  Config Service — Load/save Fables configuration
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');

const CONFIG_PATH = '.fables/fables.yaml';

async function loadConfig() {
  const configPath = path.resolve(CONFIG_PATH);

  if (!(await fs.pathExists(configPath))) {
    return null;
  }

  const content = await fs.readFile(configPath, 'utf8');
  return yaml.parse(content);
}

async function saveConfig(config) {
  const configPath = path.resolve(CONFIG_PATH);
  await fs.ensureDir(path.dirname(configPath));
  await fs.writeFile(configPath, yaml.stringify(config));
}

function getConfigPath() {
  return path.resolve(CONFIG_PATH);
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfigPath,
  CONFIG_PATH,
};
