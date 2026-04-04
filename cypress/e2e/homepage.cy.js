/// <reference types="cypress" />

/**
 * Test Suite: Homepage (index.html)
 *
 * Test các chức năng chính trên trang chủ:
 * - Load trang thành công
 * - Navbar hiển thị đúng
 * - Hero section + carousel
 * - Load danh sách tours
 * - Load danh sách destinations
 * - Navigation links hoạt động
 */

describe("Homepage", () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept("GET", "**/api/tours*").as("getTours");
    cy.intercept("GET", "**/api/destinations*").as("getDestinations");

    cy.visit("/");
  });

  describe("Page Layout", () => {
    it("should load the homepage successfully", () => {
      cy.title().should("contain", "Tour Booking");
    });

    it("should display the navbar with brand logo", () => {
      cy.get(".navbar-brand").should("be.visible");
      cy.get(".navbar-brand span").should("contain", "TourBooking");
    });

    it("should display navigation links", () => {
      cy.get('.nav-link[href="/tour"]').should("contain", "Tour");
      cy.get('.nav-link[href="/destination"]').should(
        "contain",
        "Destinations"
      );
    });

    it('should display Sign In button when not logged in', () => {
      cy.get("#authBtn").should("be.visible").and("contain", "Sign In");
    });

    it("should hide profile dropdown when not logged in", () => {
      cy.get("#profileDropdown").should("not.be.visible");
    });
  });

  describe("Hero Section", () => {
    it("should display hero carousel", () => {
      cy.get("#heroCarousel").should("be.visible");
      cy.get(".carousel-item").should("have.length.at.least", 1);
    });

    it("should display hero title and subtitle", () => {
      cy.get(".hero-title").should("be.visible");
      cy.get(".hero-subtitle").should("be.visible");
    });

    it('should have "Explore Tours" and "Destinations" buttons', () => {
      cy.get(".btn-hero-primary").should("contain", "Explore Tours");
      cy.get(".btn-hero-secondary").should("contain", "Destinations");
    });

    it("should scroll to tours section when clicking Explore Tours", () => {
      cy.get(".btn-hero-primary").click();
      // Kiểm tra section #tours hiển thị trong viewport
      cy.get("#tours").should("be.visible");
    });
  });

  describe("Featured Tours Section", () => {
    it("should show loading spinner initially", () => {
      // Nếu API chậm, spinner sẽ hiện
      cy.get("#toursLoading").should("exist");
    });

    it("should load and display tour cards", () => {
      cy.wait("@getTours", { timeout: 15000 });
      cy.get("#toursContainer .tour-card", { timeout: 15000 }).should(
        "have.length.at.least",
        1
      );
    });

    it("each tour card should have required info", () => {
      cy.wait("@getTours", { timeout: 15000 });
      cy.get("#toursContainer .tour-card", { timeout: 15000 })
        .first()
        .within(() => {
          cy.get(".card-image").should("be.visible");
          cy.get(".card-title").should("be.visible");
          cy.get(".card-price").should("be.visible");
          cy.get(".card-book-btn").should("contain", "Book Now");
        });
    });

    it("should navigate to tour details when clicking Book Now", () => {
      cy.wait("@getTours", { timeout: 15000 });
      cy.get("#toursContainer .card-book-btn", { timeout: 15000 })
        .first()
        .click();
      cy.url().should("include", "/tour/details/");
    });
  });

  describe("Popular Destinations Section", () => {
    it("should load and display destination cards", () => {
      cy.wait("@getDestinations", { timeout: 15000 });
      cy.get("#destinationsContainer .destination-grid-card", {
        timeout: 15000,
      }).should("have.length.at.least", 1);
    });

    it("each destination card should have name", () => {
      cy.wait("@getDestinations", { timeout: 15000 });
      cy.get("#destinationsContainer .destination-grid-card", {
        timeout: 15000,
      })
        .first()
        .within(() => {
          cy.get(".destination-name").should("be.visible");
        });
    });
  });

  describe("Footer", () => {
    it("should display footer with copyright", () => {
      cy.get("footer").should("be.visible");
      cy.get("footer").should("contain", "TourBooking");
    });
  });

  describe("Navigation", () => {
    it('should navigate to login when clicking "Sign In"', () => {
      cy.get("#authBtn").click();
      cy.url().should("include", "/login");
    });

    it('should navigate to tour listing page', () => {
      cy.get('.nav-link[href="/tour"]').click();
      cy.url().should("include", "/tour");
    });

    it('should navigate to destination page', () => {
      cy.get('.nav-link[href="/destination"]').click();
      cy.url().should("include", "/destination");
    });
  });
});
