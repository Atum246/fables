/**
 * 🔧 fables ci — CI/CD template generation
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, log, infoBox, createTable } = require('../ui/components');

const TEMPLATES = {
  github: {
    name: 'GitHub Actions',
    file: '.github/workflows/fables-build.yml',
    content: `name: 📖 Fables Build

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      target:
        description: 'Build target (apk, aab, ios, all)'
        default: 'all'
        type: choice
        options: [apk, aab, ios, all]

jobs:
  build-android:
    name: 🤖 Android Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.x'
          channel: 'stable'

      - name: Install Fables
        run: npm install -g fables

      - name: Initialize Fables
        run: fables init -y

      - name: Build APK
        run: fables build --target apk --yes

      - name: Build AAB
        run: fables build --target aab --yes

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: release-apk
          path: build/fables/*.apk

      - name: Upload AAB
        uses: actions/upload-artifact@v4
        with:
          name: release-aab
          path: build/fables/*.aab

  build-ios:
    name: 🍎 iOS Build
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.x'
          channel: 'stable'

      - name: Install Fables
        run: npm install -g fables

      - name: Initialize Fables
        run: fables init -y

      - name: Build iOS
        run: fables build --target ios --yes

      - name: Upload IPA
        uses: actions/upload-artifact@v4
        with:
          name: release-ipa
          path: build/fables/*.ipa

  analyze:
    name: 📊 Size Analysis
    runs-on: ubuntu-latest
    needs: build-android
    steps:
      - uses: actions/checkout@v4

      - name: Download APK
        uses: actions/download-artifact@v4
        with:
          name: release-apk

      - name: Install Fables
        run: npm install -g fables

      - name: Analyze
        run: fables analyze *.apk --deep
`,
  },

  gitlab: {
    name: 'GitLab CI',
    file: '.gitlab-ci.yml',
    content: `# 📖 Fables GitLab CI

stages:
  - build
  - analyze

variables:
  FLUTTER_VERSION: "stable"

build-android:
  stage: build
  image: ghcr.io/cirruslabs/flutter:stable
  before_script:
    - npm install -g fables
    - fables init -y
  script:
    - fables build --target apk --yes
    - fables build --target aab --yes
  artifacts:
    paths:
      - build/fables/
    expire_in: 7 days
  tags:
    - docker

build-ios:
  stage: build
  tags:
    - macos
  before_script:
    - npm install -g fables
    - fables init -y
  script:
    - fables build --target ios --yes
  artifacts:
    paths:
      - build/fables/
    expire_in: 7 days

analyze:
  stage: analyze
  image: ghcr.io/cirruslabs/flutter:stable
  needs: [build-android]
  before_script:
    - npm install -g fables
  script:
    - fables analyze build/fables/app-release.apk --deep
`,
  },

  circleci: {
    name: 'CircleCI',
    file: '.circleci/config.yml',
    content: `# 📖 Fables CircleCI

version: 2.1

jobs:
  build-android:
    docker:
      - image: ghcr.io/cirruslabs/flutter:stable
    steps:
      - checkout
      - run: npm install -g fables
      - run: fables init -y
      - run: fables build --target apk --yes
      - run: fables build --target aab --yes
      - store_artifacts:
          path: build/fables/
      - persist_to_workspace:
          root: .
          paths: [build/fables/]

  analyze:
    docker:
      - image: ghcr.io/cirruslabs/flutter:stable
    steps:
      - checkout
      - attach_workspace:
          at: .
      - run: npm install -g fables
      - run: fables analyze build/fables/app-release.apk --deep

workflows:
  build-and-analyze:
    jobs:
      - build-android
      - analyze:
          requires: [build-android]
`,
  },

  bitbucket: {
    name: 'Bitbucket Pipelines',
    file: 'bitbucket-pipelines.yml',
    content: `# 📖 Fables Bitbucket Pipelines

image: ghcr.io/cirruslabs/flutter:stable

pipelines:
  branches:
    main:
      - step:
          name: 🤖 Build Android
          caches:
            - node
          script:
            - npm install -g fables
            - fables init -y
            - fables build --target apk --yes
            - fables build --target aab --yes
          artifacts:
            - build/fables/**
      - step:
          name: 📊 Analyze
          caches:
            - node
          script:
            - npm install -g fables
            - fables analyze build/fables/app-release.apk --deep

  pull-requests:
    '**':
      - step:
          name: 🤖 Build & Test
          caches:
            - node
          script:
            - npm install -g fables
            - fables init -y
            - fables build --target apk --yes
`,
  },
};

function ciCommand(program) {
  const cmd = program.command('ci').description('🔧 CI/CD integration');

  // Generate CI config
  cmd
    .command('generate <platform>')
    .description('Generate CI/CD config for: github, gitlab, circleci, bitbucket')
    .option('--android', 'Include Android build', true)
    .option('--ios', 'Include iOS build', true)
    .option('--analyze', 'Include size analysis', true)
    .action(async (platform, opts) => {
      showBanner();
      log.chapter(`CI/CD Setup for ${platform} 🔧`);

      const template = TEMPLATES[platform.toLowerCase()];
      if (!template) {
        log.error(`Unknown platform: ${platform}`);
        log.info('Supported: github, gitlab, circleci, bitbucket');
        process.exit(1);
      }

      const sp = spinner(`Generating ${template.name} config... 📝`);
      await fs.ensureDir(path.dirname(template.file));
      await fs.writeFile(template.file, template.content);
      successSpinner(sp, `Written to ${chalk.cyan(template.file)}! 🎉`);

      console.log(
        infoBox(
          `🔧 ${template.name} Ready!`,
          [
            chalk.white('File: ') + chalk.cyan(template.file),
            '',
            chalk.hex('#F7C948')('Features:'),
            opts.android ? chalk.white('  ✅ Android build (APK + AAB)') : chalk.gray('  ⬜ Android build'),
            opts.ios ? chalk.white('  ✅ iOS build') : chalk.gray('  ⬜ iOS build'),
            opts.analyze ? chalk.white('  ✅ Size analysis') : chalk.gray('  ⬜ Size analysis'),
            '',
            chalk.gray('Commit and push to trigger builds! 🚀'),
          ].join('\n')
        )
      );
    });

  // List platforms
  cmd
    .command('list')
    .description('List supported CI/CD platforms')
    .action(() => {
      const table = createTable(['Platform', 'Config File']);
      for (const [key, tpl] of Object.entries(TEMPLATES)) {
        table.push([chalk.white(tpl.name), chalk.cyan(tpl.file)]);
      }
      console.log(table.toString());
    });
}

module.exports = { ciCommand };
