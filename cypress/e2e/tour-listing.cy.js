/// <reference types="cypress" />

/**
 * Test Suite: Tour Listing Page (/tour)
 *
 * Test các chức năng:
 * - Load danh sách tours
 * - Search tours
 * - Filter tours (type, difficulty, price)
 * - Sort tours
 * - Pagination
 * - Navigate to tour detail
 */

describe("Tour Listing Page", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/tours*").as("getTours");
    cy.visit("/tour");
  });

  describe("Page Layout", () => {
    it("should display tour listing page", () => {
      cy.title().should("contain", "Tours");
    });

    it("should display hero section with search bar", () => {
      cy.get(".tour-index-hero").should("be.visible");
      cy.get("#searchInput").should("be.visible");
    });

    it("should display filter sidebar", () => {
      cy.get(".filter-sidebar").should("be.visible");
    });

    it("should have sort dropdown", () => {
      cy.get("#sortBySelect").should("be.visible");
    });
  });

  describe("Tour Loading", () => {
    it("should load tours from API", () => {
      cy.wait("@getTours", { timeout: 15000 });
      // Sau khi load, hoặc có tour cards hoặc no results
      cy.get("body").then(($body) => {
        const hasTours = $body.find("#toursGrid .tour-card").length > 0;
        const hasNoResults = $body.find("#noResults:visible").length > 0;
        expect(hasTours || hasNoResults).to.be.true;
      });
    });

    it("should display results count", () => {
      cy.wait("@getTours", { timeout: 15000 });
      cy.get("#resultsCount").should("be.visible");
    });
  });

  describe("Search", () => {
    it("should allow typing in search input", () => {
      cy.get("#searchInput").type("Ha Long");
      cy.get("#searchInput").should("have.value", "Ha Long");
    });

    it("should trigger search when clicking search button", () => {
      cy.get("#searchInput").type("beach");
      cy.get(".btn-hero-primary").click();
      cy.wait("@getTours", { timeout: 15000 });
    });
  });

  describe("Filters", () => {
    it("should have tour type filter checkboxes", () => {
      cy.get(".tour-type-filter").should("have.length.at.least", 1);
      cy.get("#classic").should("exist");
      cy.get("#adventure").should("exist");
      cy.get("#cultural").should("exist");
    });

    it("should have difficulty filter checkboxes", () => {
      cy.get(".difficulty-filter").should("have.length.at.least", 1);
      cy.get("#easy").should("exist");
      cy.get("#moderate").should("exist");
    });

    it("should have price range slider", () => {
      cy.get("#priceRange").should("exist");
      cy.get("#priceLabel").should("be.visible");
    });

    it("should update price label when moving slider", () => {
      cy.get("#priceRange").invoke("val", 10000000).trigger("input");
      cy.get("#priceLabel").should("not.contain", "50.000.000");
    });

    it('should clear filters when clicking "Clear All"', () => {
      // Check a filter first
      cy.get("#classic").check();
      cy.get("#classic").should("be.checked");

      // Click clear all
      cy.contains("Clear All").click();
      cy.get("#classic").should("not.be.checked");
    });
  });

  describe("Sort", () => {
    it("should have sort options", () => {
      cy.get("#sortBySelect option").should("have.length.at.least", 2);
    });

    it("should re-fetch when changing sort", () => {
      cy.wait("@getTours", { timeout: 15000 });
      cy.get("#sortBySelect").select("price:asc");
      cy.wait("@getTours", { timeout: 15000 });
    });
  });

  describe("Tour Card Interaction", () => {
    it("should navigate to tour details when clicking a card", () => {
      cy.wait("@getTours", { timeout: 15000 });
      cy.get("#toursGrid .tour-card", { timeout: 15000 }).then(($cards) => {
        if ($cards.length > 0) {
          cy.get("#toursGrid .card-book-btn").first().click();
          cy.url().should("include", "/tour/details/");
        }
      });
    });
  });
});
