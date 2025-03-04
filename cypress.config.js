const { defineConfig } = require("cypress");

module.exports = defineConfig({
    reporter: "cypress-mochawesome-reporter",
    reporterOptions: {
        reportDir: "cypress/reports",
        overwrite: false,
        html: true,
        json: false
    },
    e2e: {
        baseUrl: "http://127.0.0.1:4010",
        setupNodeEvents(on, config) {
            require("cypress-mochawesome-reporter/plugin")(on);
        }
    }
});

