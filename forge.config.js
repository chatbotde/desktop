const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: './icons/icon', // Electron will automatically choose the right format (.ico/.icns/.png)
    name: 'Buddy',
    executableName: 'buddy',
    appBundleId: 'com.sonicthinking.buddy',
    appCategoryType: 'public.app-category.productivity',
    ignore: [
      /^\/frontend\/node_modules/,
      /^\/frontend\/src/,
      /^\/frontend\/public/,
      /^\/node_modules/
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'sonicthinking',
        description: 'A desktop companion app built with Electron',
        iconUrl: 'https://raw.githubusercontent.com/sonicthinking/buddy/main/icons/icon.ico',
        setupIcon: './icons/icon.ico',
        loadingGif: './icons/icon.png'
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        icon: './icons/icon.icns'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './icons/icon.png',
          categories: ['Utility', 'Office'],
          maintainer: 'sonicthinking',
          homepage: 'https://github.com/sonicthinking/buddy'
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './icons/icon.png',
          categories: ['Utility', 'Office'],
          license: 'ISC'
        }
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
