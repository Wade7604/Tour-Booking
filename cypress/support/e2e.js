// ***********************************************************
// This file is processed and loaded automatically before test files.
//
// Custom commands & global behavior here.
// ***********************************************************

// Import commands
import "./commands";

// Suppress uncaught exceptions from the app (Firebase, third-party, etc.)
Cypress.on("uncaught:exception", (err, runnable) => {
  // Firebase auth errors, network errors, etc. - don't fail the test
  if (
    err.message.includes("Firebase") ||
    err.message.includes("auth") ||
    err.message.includes("network") ||
    err.message.includes("Failed to fetch") ||
    err.message.includes("Script error")
  ) {
    return false;
  }
  // Let other errors fail the test
  return true;
});
