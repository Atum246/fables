/**
 * 🎭 Fables UI Kit — HACKER GREEN THEME 💚🖥️
 */

const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const Table = require('cli-table3');
const cliProgress = require('cli-progress');

// ═══════════════════════════════════════
//  SPINNERS 📖 (book pages flip)
// ═══════════════════════════════════════

function spinner(text, opts = {}) {
  return ora({
    text: chalk.green(text),
    spinner: {
      interval: 80,
      frames: ['▸', '▹', '▸', '▹', '▸', '▹'],
    },
    color: 'green',
    ...opts,
  });
}

function successSpinner(sp, text) {
  sp.succeed(chalk.hex('#00FF41')('✓ ') + chalk.white(text));
}

function failSpinner(sp, text) {
  sp.fail(chalk.red('✗ ') + chalk.white(text));
}

// ═══════════════════════════════════════
//  BOXES 📦
// ═══════════════════════════════════════

function infoBox(title, content, opts = {}) {
  const boxContent = chalk.greenBright.bold(title) + '\n\n' + content;
  return boxen(boxContent, {
    padding: 1,
    margin: 1,
    borderStyle: 'single',
    borderColor: 'green',
    title: '▸ Fables',
    titleAlignment: 'center',
    ...opts,
  });
}

function successBox(content) {
  return boxen(chalk.hex('#00FF41').bold('✓ SUCCESS\n\n') + chalk.white(content), {
    padding: 1,
    margin: 1,
    borderStyle: 'single',
    borderColor: 'green',
  });
}

function errorBox(content) {
  return boxen(chalk.red.bold('✗ ERROR\n\n') + chalk.white(content), {
    padding: 1,
    margin: 1,
    borderStyle: 'single',
    borderColor: 'red',
  });
}

function warnBox(content) {
  return boxen(chalk.yellow.bold('⚠ WARNING\n\n') + chalk.white(content), {
    padding: 1,
    margin: 1,
    borderStyle: 'single',
    borderColor: 'yellow',
  });
}

// ═══════════════════════════════════════
//  TABLES 📊
// ═══════════════════════════════════════

function createTable(headers, opts = {}) {
  return new Table({
    head: headers.map((h) => chalk.hex('#00FF41').bold(h)),
    style: {
      head: [],
      border: ['green'],
      'padding-left': 1,
      'padding-right': 1,
    },
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
    ...opts,
  });
}

// ═══════════════════════════════════════
//  PROGRESS BARS 📊
// ═══════════════════════════════════════

function progressBar(label, total) {
  const bar = new cliProgress.SingleBar({
    format:
      chalk.hex('#00FF41')('▸ {bar}') +
      chalk.white(' {percentage}% | ') +
      chalk.green('{value}/{total}') +
      chalk.hex('#003300')(' | {stage}'),
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true,
  });

  bar.start(total, 0, { stage: label });
  return bar;
}

// ═══════════════════════════════════════
//  LOG HELPERS 📝
// ═══════════════════════════════════════

const log = {
  info: (...args) => console.log(chalk.hex('#00FF41')('▸'), ...args),
  success: (...args) => console.log(chalk.hex('#39FF14')('✓'), ...args),
  warn: (...args) => console.log(chalk.yellow('⚠'), ...args),
  error: (...args) => console.log(chalk.red('✗'), ...args),
  step: (num, total, ...args) =>
    console.log(chalk.hex('#00FF41')(`[${num}/${total}]`), ...args),
  chapter: (title) => {
    console.log('');
    console.log(chalk.hex('#00FF41').bold(`═══ ▸ ${title} ═══`));
    console.log('');
  },
  divider: () => console.log(chalk.hex('#003300')('─'.repeat(50))),
};

module.exports = {
  spinner,
  successSpinner,
  failSpinner,
  infoBox,
  successBox,
  errorBox,
  warnBox,
  createTable,
  progressBar,
  log,
};
