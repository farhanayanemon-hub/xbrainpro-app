const appJson = require("./app.json");

module.exports = () => {
  const config = appJson.expo;
  const webBaseUrl = process.env.EXPO_WEB_BASE_URL;
  if (!webBaseUrl) return config;
  return {
    ...config,
    experiments: {
      ...config.experiments,
      baseUrl: webBaseUrl,
    },
  };
};
