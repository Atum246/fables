#!/usr/bin/env node

/**
 * 📖 Fables — Turn Flutter apps into legendary builds
 *
 * Build APK, AAB & iOS without Android Studio.
 * Just magic. ✨
 */

const { program } = require('commander');
const chalk = require('chalk');
const { showBanner } = require('../src/ui/banner');
const { errorHandler } = require('../src/utils/errors');

// Commands
const { initCommand } = require('../src/commands/init');
const { buildCommand } = require('../src/commands/build');
const { doctorCommand } = require('../src/commands/doctor');
const { signCommand } = require('../src/commands/sign');
const { configCommand } = require('../src/commands/config');
const { analyzeCommand } = require('../src/commands/analyze');
const { deployCommand } = require('../src/commands/deploy');
const { releaseCommand } = require('../src/commands/release');
const { mcpCommand } = require('../src/commands/mcp');
const { ciCommand } = require('../src/commands/ci');
const { cleanCommand } = require('../src/commands/clean');
const { runCommand } = require('../src/commands/run');
const { emulatorCommand } = require('../src/commands/emulator');
const { iconCommand } = require('../src/commands/icon');
const { splashCommand } = require('../src/commands/splash');
const { depsCommand } = require('../src/commands/deps');
const { secretsCommand } = require('../src/commands/secrets');
const { flavorsCommand } = require('../src/commands/flavors');
const { permissionsCommand } = require('../src/commands/permissions');
const { logsCommand } = require('../src/commands/logs');
const { testCommand } = require('../src/commands/test');
const { proguardCommand } = require('../src/commands/proguard');
const { manifestCommand } = require('../src/commands/manifest');
const { i18nCommand } = require('../src/commands/i18n');

// Show banner on help
if (process.argv.length <= 2) {
  showBanner();
}

program
  .name('fables')
  .description('📖 Build Flutter apps to APK, AAB & iOS — no Android Studio needed')
  .version('0.1.0', '-v, --version', 'Show Fables version');

// Register commands
initCommand(program);
buildCommand(program);
doctorCommand(program);
signCommand(program);
configCommand(program);
analyzeCommand(program);
deployCommand(program);
releaseCommand(program);
mcpCommand(program);
ciCommand(program);
cleanCommand(program);
runCommand(program);
emulatorCommand(program);
iconCommand(program);
splashCommand(program);
depsCommand(program);
secretsCommand(program);
flavorsCommand(program);
permissionsCommand(program);
logsCommand(program);
testCommand(program);
proguardCommand(program);
manifestCommand(program);
i18nCommand(program);

// When no args, show help gracefully
if (process.argv.length <= 2) {
  program.outputHelp();
  process.exit(0);
}

program.parse(process.argv);
