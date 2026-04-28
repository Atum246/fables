/**
 * 🎭 Fables UI Kit — Beautiful terminal components
 */

const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const Table = require('cli-table3');
const cliProgress = require('cli-progress');

// ═══════════════════════════════════════
//  SPINNERS 🌀
// ═══════════════════════════════════════

function spinner(text, opts = {}) {
  return ora({
    text: chalk.white(text),
    spinner: {
      interval: 80,
      frames: ['📖', '📗', '📘', '📙', '📕'],
    },
    color: 'yellow',
    ...opts,
  });
}

function successSpinner(sp, text) {
  sp.succeed(chalk.green('✅ ') + chalk.white(text));
}

function failSpinner(sp, text) {
  sp.fail(chalk.red('❌ ') + chalk.white(text));
}

// ═══════════════════════════════════════
//  BOXES 📦
// ═══════════════════════════════════════

function infoBox(title, content, opts = {}) {
  const boxContent = chalk.white.bold(title) + '\n\n' + content;
  return boxen(boxContent, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    title: '📖 Fables',
    titleAlignment: 'center',
    ...opts,
  });
}

function successBox(content) {
  return boxen(chalk.green.bold('🎉 Success!\n\n') + chalk.white(content), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green',
  });
}

function errorBox(content) {
  return boxen(chalk.red.bold('💥 Oops!\n\n') + chalk.white(content), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'red',
  });
}

function warnBox(content) {
  return boxen(chalk.yellow.bold('⚠️  Heads Up!\n\n') + chalk.white(content), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'yellow',
  });
}

// ═══════════════════════════════════════
//  TABLES 📊
// ═══════════════════════════════════════

function createTable(headers, opts = {}) {
  return new Table({
    head: headers.map((h) => chalk.cyan.bold(h)),
    style: {
      head: [],
      border: ['gray'],
      'padding-left': 1,
      'padding-right': 1,
    },
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '╭',
      'top-right': '╮',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '╰',
      'bottom-right': '╯',
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
      chalk.hex('#F7C948')('📖 {bar}') +
      chalk.white(' {percentage}% | ') +
      chalk.cyan('{value}/{total}') +
      chalk.gray(' | {stage}'),
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
  info: (...args) => console.log(chalk.cyan('ℹ️ '), ...args),
  success: (...args) => console.log(chalk.green('✅'), ...args),
  warn: (...args) => console.log(chalk.yellow('⚠️ '), ...args),
  error: (...args) => console.log(chalk.red('❌'), ...args),
  step: (num, total, ...args) =>
    console.log(chalk.hex('#F7C948')(`[${num}/${total}]`), ...args),
  chapter: (title) => {
    console.log('');
    console.log(chalk.hex('#F7C948').bold(`═══ 📖 ${title} ═══`));
    console.log('');
  },
  divider: () => console.log(chalk.gray('─'.repeat(50))),
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
