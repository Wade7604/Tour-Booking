/// <reference types="cypress" />

/**
 * Test Suite: Responsive Design
 *
 * Test giao diện responsive trên các viewport khác nhau:
 * - Mobile (375x667 - iPhone SE)
 * - Tablet (768x1024 - iPad)
 * - Desktop (1280x720)
 */

describe("Responsive Design", () => {
  const viewports = [
    { name: "Mobile", width: 375, height: 667 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Desktop", width: 1280, height: 720 },
  ];

  viewports.forEach((viewport) => {
    describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit("/");
      });

      it("should load page correctly", () => {
        cy.get("body").should("be.visible");
        cy.get(".navbar").should("be.visible");
      });

      it("should display hero section", () => {
        cy.get(".hero-section").should("be.visible");
        cy.get(".hero-title").should("be.visible");
      });

      if (viewport.name === "Mobile") {
        it("should show hamburger menu on mobile", () => {
          cy.get(".navbar-toggler").should("be.visible");
        });

        it("should toggle navbar on hamburger click", () => {
          cy.get(".navbar-toggler").click();
          cy.get("#navbarNav").should("have.class", "show");
        });
      }

      if (viewport.name === "Desktop") {
        it("should show full navbar on desktop", () => {
          cy.get(".navbar-toggler").should("not.be.visible");
          cy.get(".nav-link").should("be.visible");
        });
      }
    });
  });
});
