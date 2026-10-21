const base = require('./app.json');

/** Plain-http API (a LAN test backend) needs cleartext traffic allowed; https builds stay strict. */
module.exports = () => {
  const config = base.expo;
  if (!(process.env.EXPO_PUBLIC_API_URL ?? '').startsWith('http://')) return config;
  return {
    ...config,
    plugins: [...(config.plugins ?? []), ['expo-build-properties', { android: { usesCleartextTraffic: true } }]],
  };
};
