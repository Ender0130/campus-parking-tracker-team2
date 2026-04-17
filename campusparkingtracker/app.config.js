const appJson = require('./app.json');

module.exports = ({ config }) => ({
  ...appJson.expo,
  extra: {
    ...(appJson.expo.extra || {}),
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || undefined,
  },
});