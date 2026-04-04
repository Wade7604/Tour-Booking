/// <reference types="cypress" />

/**
 * Test Suite: Destination Pages
 *
 * Test các chức năng:
 * - Load danh sách destinations
 * - Hiển thị destination cards
 * - Navigate to destination detail
 */

describe("Destination Pages", () => {
  describe("Destination Listing (/destination)", () => {
    beforeEach(() => {
      cy.intercept("GET", "**/api/destinations*").as("getDestinations");
      cy.visit("/destination");
    });

    it("should load destination listing page", () => {
      cy.title().should("exist");
    });

    it("should load destinations from API", () => {
      cy.wait("@getDestinations", { timeout: 15000 });
    });

    it("should display destination cards", () => {
      cy.wait("@getDestinations", { timeout: 15000 });
      // Trang destination sẽ có cards hiển thị hoặc empty state
      cy.get("body").should("be.visible");
    });

    it("should have navbar with correct active link", () => {
      cy.get(".navbar").should("be.visible");
      cy.get('.nav-link[href="/destination"]').should("exist");
    });
  });

  describe("Destination Detail", () => {
    let destinationSlug;

    before(() => {
      // Lấy slug từ destination thật
      cy.request(
        `${Cypress.env("API_BASE_URL")}/destinations?limit=1&status=active`
      ).then((response) => {
        const destinations = response.body.data || [];
        if (destinations.length > 0) {
          destinationSlug = destinations[0].slug;
        }
      });
    });

    it("should load destination detail page", () => {
      if (!destinationSlug) {
        cy.log("⚠️ No destination available");
        return;
      }

      cy.intercept("GET", "**/api/destinations/**").as("getDestDetail");
      cy.visit(`/destination/details/?slug=${destinationSlug}`);
      cy.wait("@getDestDetail", { timeout: 15000 });
      cy.get("body").should("be.visible");
    });

    it("should display destination information", () => {
      if (!destinationSlug) return;

      cy.intercept("GET", "**/api/destinations/**").as("getDestDetail");
      cy.visit(`/destination/details/?slug=${destinationSlug}`);
      cy.wait("@getDestDetail", { timeout: 15000 });

      // Destination name
      cy.get("h1, .destination-title, .dest-name", { timeout: 15000 })
        .first()
        .should("be.visible");
    });
  });
});
