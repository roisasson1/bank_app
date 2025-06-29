const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.REACT_APP_API_BASE_URL,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      return config;
    },

    viewportWidth: 1280,
    viewportHeight: 720,

    retries: {
      runMode: 1,
      openMode: 0,
    },

    video: true,
    screenshotsFolder: 'cypress/screenshots',
    downloadsFolder: 'cypress/downloads',
  },
});