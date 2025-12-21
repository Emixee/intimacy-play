/**
 * Expo Config Plugin pour Notifee
 * Ajoute le repo Maven Notifee dans android/build.gradle
 */

const { withProjectBuildGradle } = require("@expo/config-plugins");

function withNotifee(config) {
  return withProjectBuildGradle(config, (config) => {
    // Vérifier si le repo est déjà présent
    if (config.modResults.contents.includes("notifee.app/maven")) {
      return config;
    }

    // Ajouter le repo Maven Notifee dans allprojects.repositories
    config.modResults.contents = config.modResults.contents.replace(
      /allprojects\s*\{\s*repositories\s*\{/,
      `allprojects {
    repositories {
        maven { url 'https://notifee.app/maven' }`
    );

    return config;
  });
}

module.exports = withNotifee;