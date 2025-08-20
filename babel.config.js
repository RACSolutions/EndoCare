module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        // Remove any reanimated plugin since we're not using it
        // 'react-native-reanimated/plugin' // ← Make sure this is commented out or removed
      ],
    };
  };