/**
 * 🎨 fables icon — Generate app icons for all platforms
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { execa } = require('execa');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, log, infoBox, warnBox, createTable } = require('../ui/components');

const ANDROID_ICON_SIZES = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const IOS_ICON_SIZES = [
  { name: 'Icon-App-20x20@1x.png', size: 20 },
  { name: 'Icon-App-20x20@2x.png', size: 40 },
  { name: 'Icon-App-20x20@3x.png', size: 60 },
  { name: 'Icon-App-29x29@1x.png', size: 29 },
  { name: 'Icon-App-29x29@2x.png', size: 58 },
  { name: 'Icon-App-29x29@3x.png', size: 87 },
  { name: 'Icon-App-40x40@1x.png', size: 40 },
  { name: 'Icon-App-40x40@2x.png', size: 80 },
  { name: 'Icon-App-40x40@3x.png', size: 120 },
  { name: 'Icon-App-60x60@2x.png', size: 120 },
  { name: 'Icon-App-60x60@3x.png', size: 180 },
  { name: 'Icon-App-76x76@1x.png', size: 76 },
  { name: 'Icon-App-76x76@2x.png', size: 152 },
  { name: 'Icon-App-83.5x83.5@2x.png', size: 167 },
  { name: 'Icon-App-1024x1024@1x.png', size: 1024 },
];

function iconCommand(program) {
  program
    .command('icon <source>')
    .description('🎨 Generate app icons from a single 1024x1024 image')
    .option('--android', 'Generate Android icons', true)
    .option('--ios', 'Generate iOS icons', true)
    .option('--web', 'Generate Web icons', true)
    .option('--adaptive', 'Generate adaptive icons (Android)')
    .option('--background <color>', 'Adaptive icon background color', '#FFFFFF')
    .action(async (source, opts) => {
      showBanner();
      log.chapter('App Icon Generator 🎨');

      const sourcePath = path.resolve(source);
      if (!(await fs.pathExists(sourcePath))) {
        log.error(`Source image not found: ${sourcePath}`);
        process.exit(1);
      }

      // Check for image processing
      let sharp;
      try {
        sharp = require('sharp');
      } catch {
        log.error('Image processing requires ' + chalk.cyan('sharp') + ':');
        log.info('  npm install sharp');
        log.info('  OR use Fables Docker image which includes it');
        process.exit(1);
      }

      const sp = spinner('Generating icons... 🎨');
      let generated = 0;

      // Android icons
      if (opts.android) {
        sp.text = 'Generating Android icons... 🤖';
        for (const { dir, size } of ANDROID_ICON_SIZES) {
          const outputDir = path.join('android/app/src/main/res', dir);
          await fs.ensureDir(outputDir);
          await sharp(sourcePath).resize(size, size).png().toFile(path.join(outputDir, 'ic_launcher.png'));
          await sharp(sourcePath).resize(size, size).png().toFile(path.join(outputDir, 'ic_launcher_round.png'));
          generated += 2;
        }

        // Adaptive icon
        if (opts.adaptive) {
          sp.text = 'Generating adaptive icons... 🤖✨';
          for (const { dir, size } of ANDROID_ICON_SIZES) {
            const outputDir = path.join('android/app/src/main/res', dir);
            await sharp(sourcePath).resize(size - 24, size - 24).png().toFile(path.join(outputDir, 'ic_launcher_foreground.png'));
            generated++;
          }

          // Create adaptive icon XML
          const xmlDir = 'android/app/src/main/res/values';
          await fs.ensureDir(xmlDir);
          await fs.writeFile(path.join(xmlDir, 'ic_launcher_background.xml'),
            `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${opts.background}</color>
</resources>`);

          const mipmapAnyDir = 'android/app/src/main/res/mipmap-anydpi-v26';
          await fs.ensureDir(mipmapAnyDir);
          await fs.writeFile(path.join(mipmapAnyDir, 'ic_launcher.xml'),
            `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`);

          await fs.writeFile(path.join(mipmapAnyDir, 'ic_launcher_round.xml'),
            `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`);

          generated += 2;
        }
      }

      // iOS icons
      if (opts.ios) {
        sp.text = 'Generating iOS icons... 🍎';
        const iosIconDir = 'ios/Runner/Assets.xcassets/AppIcon.appiconset';
        await fs.ensureDir(iosIconDir);

        for (const { name, size } of IOS_ICON_SIZES) {
          await sharp(sourcePath).resize(size, size).png().toFile(path.join(iosIconDir, name));
          generated++;
        }

        // Generate Contents.json
        const contents = {
          images: IOS_ICON_SIZES.map(({ name, size }) => ({
            size: `${size}x${size}`,
            filename: name,
            idiom: size >= 1024 ? 'ios-marketing' : 'iphone',
            scale: size >= 1024 ? '1x' : `${Math.round(size / 40)}x`,
          })),
          info: { version: 1, author: 'fables' },
        };
        await fs.writeFile(path.join(iosIconDir, 'Contents.json'), JSON.stringify(contents, null, 2));
        generated++;
      }

      // Web icons
      if (opts.web) {
        sp.text = 'Generating Web icons... 🌐';
        const webIconDir = 'web/icons';
        await fs.ensureDir(webIconDir);

        const webSizes = [192, 512];
        for (const size of webSizes) {
          await sharp(sourcePath).resize(size, size).png().toFile(path.join(webIconDir, `Icon-${size}.png`));
          generated++;
        }

        // Maskable icon
        await sharp(sourcePath).resize(512, 512).png().toFile(path.join(webIconDir, 'Icon-maskable-512.png'));
        generated++;

        // Favicon
        await sharp(sourcePath).resize(32, 32).png().toFile('web/favicon.png');
        generated++;
      }

      successSpinner(sp, `Generated ${generated} icons! 🎨🎉`);

      console.log(
        infoBox(
          '🎨 Icons Generated!',
          [
            chalk.white('Total: ') + chalk.cyan(`${generated} files`),
            opts.android ? chalk.white('Android: ') + chalk.green('✅ ') + chalk.gray(`${ANDROID_ICON_SIZES.length} densities`) : '',
            opts.ios ? chalk.white('iOS:     ') + chalk.green('✅ ') + chalk.gray(`${IOS_ICON_SIZES.length} sizes`) : '',
            opts.web ? chalk.white('Web:     ') + chalk.green('✅ ') + chalk.gray('PWA + favicon') : '',
            opts.adaptive ? chalk.white('Adaptive:') + chalk.green(' ✅') : '',
            '',
            chalk.hex('#F7C948')('📖 Fables — your app looks legendary! ✨'),
          ].join('\n')
        )
      );
    });
}

module.exports = { iconCommand };
