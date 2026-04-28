/**
 * 🛡️ fables proguard — ProGuard/R8 configuration helper
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, log, infoBox, warnBox, createTable } = require('../ui/components');

const COMMON_KEEP_RULES = {
  flutter: {
    rule: `-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }`,
    desc: 'Keep Flutter engine classes',
  },
  firebase: {
    rule: `-keep class com.google.firebase.** { *; }
-keepattributes Signature
-keepattributes *Annotation*`,
    desc: 'Keep Firebase classes',
  },
  gson: {
    rule: `-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }`,
    desc: 'Keep Gson serialization',
  },
  retrofit: {
    rule: `-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}`,
    desc: 'Keep Retrofit interfaces',
  },
  okhttp: {
    rule: `-dontwarn okhttp3.**
-keep class okhttp3.** { *; }`,
    desc: 'Keep OkHttp classes',
  },
  json: {
    rule: `-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}`,
    desc: 'Keep JSON-annotated fields',
  },
  play_core: {
    rule: `-keep class com.google.android.play.core.** { *; }
-dontwarn com.google.android.play.core.**`,
    desc: 'Keep Play Core (for dynamic delivery)',
  },
};

function proguardCommand(program) {
  const cmd = program.command('proguard').description('🛡️ ProGuard/R8 configuration');

  // Show current rules
  cmd
    .command('show')
    .description('Show current ProGuard rules')
    .action(async () => {
      showBanner();
      log.chapter('ProGuard Rules 🛡️');

      const rulesPath = 'android/app/proguard-rules.pro';
      if (!(await fs.pathExists(rulesPath))) {
        log.info('No custom ProGuard rules file found');
        log.info('Default Flutter rules are applied automatically');
        return;
      }

      const content = await fs.readFile(rulesPath, 'utf8');
      console.log(chalk.gray(content));

      const rules = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
      log.info(`Total: ${chalk.cyan(rules.length)} rules`);
    });

  // Add common rules
  cmd
    .command('add <category>')
    .description('Add common ProGuard rules')
    .action(async (category) => {
      const rule = COMMON_KEEP_RULES[category];
      if (!rule) {
        log.error(`Unknown category: ${category}`);
        log.info('Available: ' + Object.keys(COMMON_KEEP_RULES).join(', '));
        process.exit(1);
      }

      const rulesPath = 'android/app/proguard-rules.pro';
      let existing = '';
      if (await fs.pathExists(rulesPath)) {
        existing = await fs.readFile(rulesPath, 'utf8');
      }

      if (existing.includes(rule.rule.substring(0, 50))) {
        log.warn('Rules for this category may already exist');
        return;
      }

      const sp = spinner('Adding ProGuard rules... 🛡️');
      await fs.writeFile(rulesPath, existing + '\n# Fables: ' + rule.desc + '\n' + rule.rule + '\n');
      successSpinner(sp, `Added ${category} rules! 🛡️`);
    });

  // List available rule categories
  cmd
    .command('list')
    .description('List available ProGuard rule categories')
    .action(() => {
      const table = createTable(['Category', 'Description']);
      for (const [name, info] of Object.entries(COMMON_KEEP_RULES)) {
        table.push([chalk.white(name), chalk.gray(info.desc)]);
      }
      console.log(table.toString());
    });

  // Validate rules
  cmd
    .command('validate')
    .description('Check ProGuard configuration for issues')
    .action(async () => {
      showBanner();
      log.chapter('ProGuard Validation 🛡️');

      const rulesPath = 'android/app/proguard-rules.pro';
      const buildGradle = 'android/app/build.gradle';
      const issues = [];

      // Check if minification is enabled
      if (await fs.pathExists(buildGradle)) {
        const gradle = await fs.readFile(buildGradle, 'utf8');

        if (!gradle.includes('minifyEnabled true')) {
          issues.push({ level: 'warn', msg: 'minifyEnabled is not true — R8 shrinking disabled' });
        }

        if (!gradle.includes('shrinkResources true')) {
          issues.push({ level: 'info', msg: 'shrinkResources not enabled — consider for smaller APK' });
        }

        if (gradle.includes('proguard-android-optimize.txt') && !(await fs.pathExists(rulesPath))) {
          issues.push({ level: 'warn', msg: 'Using optimized rules but no custom rules file' });
        }
      }

      // Check rules file
      if (await fs.pathExists(rulesPath)) {
        const rules = await fs.readFile(rulesPath, 'utf8');

        // Check for overly broad keeps
        const broadKeeps = rules.match(/-keep class \*\s*\{.*\*\s*;?\s*\}/g);
        if (broadKeeps) {
          issues.push({
            level: 'warn',
            msg: `Found ${broadKeeps.length} overly broad -keep rules (keeps everything)`,
          });
        }

        // Check for dontwarn
        const dontwarns = rules.match(/-dontwarn .+/g);
        if (dontwarns && dontwarns.length > 10) {
          issues.push({ level: 'info', msg: `Many -dontwarn rules (${dontwarns.length}) — review if all needed` });
        }
      }

      if (issues.length === 0) {
        log.info('No issues found with ProGuard configuration');
      } else {
        const table = createTable(['Level', 'Issue']);
        for (const issue of issues) {
          const emoji = issue.level === 'warn' ? '⚠️' : 'ℹ️';
          table.push([chalk.yellow(emoji + ' ' + issue.level), chalk.white(issue.msg)]);
        }
        console.log(table.toString());
      }
    });
}

module.exports = { proguardCommand };
