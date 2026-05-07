const { withSettingsGradle } = require('@expo/config-plugins');

const withAndroidPluginRepositories = (config) => {
  return withSettingsGradle(config, (config) => {
    const contents = config.modResults.contents;
    if (!contents.includes('gradlePluginPortal()')) {
      config.modResults.contents = contents.replace(
        'pluginManagement {',
        'pluginManagement {\n  repositories {\n    google()\n    mavenCentral()\n    gradlePluginPortal()\n  }\n'
      );
    }
    return config;
  });
};

/** @type {import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...((config.plugins || []).filter(
      (p) => p !== 'expo-router' && p !== 'expo-secure-store'
    )),
    'expo-router',
    'expo-secure-store',
    withAndroidPluginRepositories,
  ],
});
