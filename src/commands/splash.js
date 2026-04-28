/**
 * 🌊 fables splash — Generate splash screens for all platforms
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { showBanner } = require('../ui/banner');
const { spinner, successSpinner, failSpinner, log, infoBox, createTable } = require('../ui/components');

function splashCommand(program) {
  program
    .command('splash <source>')
    .description('🌊 Generate splash screen assets')
    .option('--background <color>', 'Background color', '#FFFFFF')
    .option('--android', 'Generate Android splash', true)
    .option('--ios', 'Generate iOS splash', true)
    .option('--dark-background <color>', 'Dark mode background color')
    .option('--image-dark <path>', 'Dark mode image')
    .action(async (source, opts) => {
      showBanner();
      log.chapter('Splash Screen Generator 🌊');

      const sourcePath = path.resolve(source);
      if (!(await fs.pathExists(sourcePath))) {
        log.error(`Source image not found: ${sourcePath}`);
        process.exit(1);
      }

      let sharp;
      try {
        sharp = require('sharp');
      } catch {
        log.error('Install sharp: ' + chalk.cyan('npm install sharp'));
        process.exit(1);
      }

      const sp = spinner('Generating splash screens... 🌊');
      let generated = 0;

      // Android splash
      if (opts.android) {
        sp.text = 'Generating Android splash... 🤖';

        const densities = [
          { dir: 'drawable-mdpi', scale: 1 },
          { dir: 'drawable-hdpi', scale: 1.5 },
          { dir: 'drawable-xhdpi', scale: 2 },
          { dir: 'drawable-xxhdpi', scale: 3 },
          { dir: 'drawable-xxxhdpi', scale: 4 },
        ];

        for (const { dir, scale } of densities) {
          const outputDir = path.join('android/app/src/main/res', dir);
          await fs.ensureDir(outputDir);

          const imgSize = Math.round(300 * scale);
          await sharp(sourcePath)
            .resize(imgSize, imgSize, { fit: 'contain', background: opts.background })
            .composite([{
              input: Buffer.from(
                `<svg><rect width="100%" height="100%" fill="${opts.background}"/></svg>`
              ),
              blend: 'dest-over',
            }])
            .png()
            .toFile(path.join(outputDir, 'splash.png'));
          generated++;
        }

        // Launch background XML
        const valuesDir = 'android/app/src/main/res/values';
        await fs.ensureDir(valuesDir);
        await fs.writeFile(path.join(valuesDir, 'launch_background.xml'),
          `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
</layer-list>`);

        await fs.writeFile(path.join(valuesDir, 'colors.xml'),
          `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">${opts.background}</color>
</resources>`);

        // Launch theme
        await fs.writeFile(path.join(valuesDir, 'styles.xml'),
          `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="LaunchTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <item name="android:windowBackground">@drawable/launch_background</item>
    </style>
    <style name="NormalTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <item name="android:windowBackground">@android:color/white</item>
    </style>
</resources>`);

        generated += 3;

        // Dark mode
        if (opts.darkBackground) {
          await fs.writeFile(path.join(valuesDir, 'colors-dark.xml'),
            `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">${opts.darkBackground}</color>
</resources>`);

          const nightDir = 'android/app/src/main/res/values-night';
          await fs.ensureDir(nightDir);
          await fs.writeFile(path.join(nightDir, 'colors.xml'),
            `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">${opts.darkBackground}</color>
</resources>`);
          generated += 2;
        }
      }

      // iOS splash
      if (opts.ios) {
        sp.text = 'Generating iOS splash... 🍎';

        const iosDir = 'ios/Runner/Base.lproj';
        await fs.ensureDir(iosDir);

        // Generate LaunchScreen.storyboard
        await fs.writeFile(path.join(iosDir, 'LaunchScreen.storyboard'),
          `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0">
    <scenes>
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="390" height="844"/>
                        <autoresizingMask key="autoresizingMask"/>
                        <subviews>
                            <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="splash" translatesAutoresizingMaskIntoConstraints="NO" id="YRO-k0-Aw4">
                                <rect key="frame" x="95" y="322" width="200" height="200"/>
                                <constraints>
                                    <constraint firstItem="YRO-k0-Aw4" firstAttribute="width" secondItem="YRO-k0-Aw4" secondAttribute="height" id="s4T-wQ-Yfb"/>
                                </constraints>
                            </imageView>
                        </subviews>
                        <color key="backgroundColor" systemColor="systemBackgroundColor"/>
                        <constraints>
                            <constraint firstItem="YRO-k0-Aw4" firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX" id="L2T-a4-dwE"/>
                            <constraint firstItem="YRO-k0-Aw4" firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="centerY" id="3EC-8G-2Bt"/>
                            <constraint firstItem="YRO-k0-Aw4" firstAttribute="width" secondItem="Ze5-6b-2t3" secondAttribute="width" multiplier="0.5" id="5hM-YG-8De"/>
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="0" y="0"/>
        </scene>
    </scenes>
    <resources>
        <image name="splash" width="300" height="300"/>
    </resources>
</document>`);
        generated++;

        // Copy splash image
        const assetsDir = 'ios/Runner/Assets.xcassets/LaunchImage.imageset';
        await fs.ensureDir(assetsDir);
        await sharp(sourcePath).resize(300, 300, { fit: 'contain' }).png().toFile(path.join(assetsDir, 'splash.png'));
        generated++;

        // Contents.json
        await fs.writeFile(path.join(assetsDir, 'Contents.json'), JSON.stringify({
          images: [
            { filename: 'splash.png', idiom: 'universal', scale: '1x' },
            { idiom: 'universal', scale: '2x' },
            { idiom: 'universal', scale: '3x' },
          ],
          info: { version: 1, author: 'fables' },
        }, null, 2));
        generated++;
      }

      successSpinner(sp, `Generated ${generated} splash assets! 🌊🎉`);

      console.log(
        infoBox(
          '🌊 Splash Screen Ready!',
          [
            chalk.white('Files: ') + chalk.cyan(`${generated} generated`),
            chalk.white('BG:    ') + chalk.hex(opts.background)(opts.background),
            opts.darkBackground ? chalk.white('Dark:  ') + chalk.hex(opts.darkBackground)(opts.darkBackground) : '',
            '',
            chalk.gray('Use flutter_native_splash for runtime control'),
            '',
            chalk.hex('#F7C948')('📖 Fables — first impressions matter! ✨'),
          ].join('\n')
        )
      );
    });
}

module.exports = { splashCommand };
