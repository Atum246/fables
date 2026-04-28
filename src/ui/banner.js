/**
 * 🎨 Fables CLI Banner & Visual Identity
 */

const chalk = require('chalk');
const gradient = require('gradient-string');
const figlet = require('figlet');

// Fables brand gradient — warm storybook tones 📖✨
const fablesGradient = gradient(['#FF6B35', '#F7C948', '#FF6B35']);
const accentGradient = gradient(['#00D4AA', '#00B4D8']);

function showBanner() {
  const logo = figlet.textSync('FABLES', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  console.log('');
  console.log(fablesGradient(logo));
  console.log(
    chalk.hex('#F7C948')('  📖 ') +
    chalk.white.bold('Turn Flutter apps into legendary builds') +
    chalk.hex('#F7C948')(' ✨')
  );
  console.log(
    chalk.gray('  ') +
    chalk.hex('#00D4AA')('APK') +
    chalk.gray(' · ') +
    chalk.hex('#00B4D8')('AAB') +
    chalk.gray(' · ') +
    chalk.hex('#FF6B35')('iOS') +
    chalk.gray(' — no Android Studio required 🚀')
  );
  console.log('');
}

function showCompactBanner() {
  console.log(
    chalk.hex('#F7C948')('📖 Fables') +
    chalk.gray(' v0.1.0') +
    chalk.hex('#00D4AA')(' ✨')
  );
}

function brandColor(text) {
  return fablesGradient(text);
}

function accentColor(text) {
  return accentGradient(text);
}

module.exports = {
  showBanner,
  showCompactBanner,
  brandColor,
  accentColor,
  fablesGradient,
  accentGradient,
};
