/// <reference types="cypress" />

Cypress.on("uncaught:exception", () => {
  // Keep Cypress focused on assertion failures from our checks.
  return false;
});
