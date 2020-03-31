/* eslint-env node */
module.exports = {
  presets: [
    [
      '@quasar/babel-preset-app',
      {
        presetEnv: { corejs: 3 }
      }
    ]
  ]
};
