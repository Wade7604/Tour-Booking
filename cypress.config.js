const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // Thư mục chứa test specs
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",

    // Thư mục chứa fixture data
    fixturesFolder: "cypress/fixtures",

    // Thư mục chứa support files
    supportFile: "cypress/support/e2e.js",

    // Thư mục chứa screenshots khi test fail
    screenshotsFolder: "cypress/screenshots",

    // Thư mục chứa video recordings
    videosFolder: "cypress/videos",

    // Timeout settings
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,

    // Viewport mặc định
    viewportWidth: 1280,
    viewportHeight: 720,

    // Video recording
    video: false,

    // Retry on failure
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Environment variables
    env: {
      API_BASE_URL: "https://tour-booking-1-wbjc.onrender.com/api",
      // Frontend URL - dùng trong cy.visit()
      FRONTEND_URL: "https://tour-booking-bice.vercel.app/",
    },

    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
