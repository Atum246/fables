/**
 * 🎨 Fables CLI Banner & Visual Identity
 *
 * HACKER GREEN THEME 💚🖥️
 */

const chalk = require('chalk');
const gradient = require('gradient-string');
const figlet = require('figlet');

// Fables brand gradient — hacker green matrix vibes 💚🖥️
const fablesGradient = gradient(['#00FF41', '#0DFF00', '#39FF14', '#00FF41']);
const accentGradient = gradient(['#00FF41', '#39FF14']);
const dimGradient = gradient(['#004d00', '#006600']);

function showBanner() {
  const logo = figlet.textSync('FABLES', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  console.log('');
  console.log(fablesGradient(logo));
  console.log(
    chalk.hex('#00FF41')('  ▸ ') +
    chalk.greenBright.bold('Turn Flutter apps into legendary builds') +
    chalk.hex('#00FF41')(' ◂')
  );
  console.log(
    chalk.hex('#003300')('  ── ') +
    chalk.hex('#00FF41')('APK') +
    chalk.hex('#003300')(' · ') +
    chalk.hex('#39FF14')('AAB') +
    chalk.hex('#003300')(' · ') +
    chalk.hex('#0DFF00')('iOS') +
    chalk.hex('#003300')(' ── ') +
    chalk.hex('#008000')('no Android Studio required') +
    chalk.hex('#00FF41')(' ⚡')
  );
  console.log('');
}

function showCompactBanner() {
  console.log(
    chalk.hex('#00FF41')('▸ Fables') +
    chalk.hex('#003300')(' v0.1.0') +
    chalk.hex('#39FF14')(' ✓')
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
