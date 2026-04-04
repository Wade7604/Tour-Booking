/// <reference types="cypress" />

/**
 * Test Suite: API Health Check
 *
 * Test trực tiếp các API endpoint
 * (Không cần frontend) - đảm bảo backend hoạt động
 */

describe("API Health Check", () => {
  const API = Cypress.env("API_BASE_URL");

  describe("Tours API", () => {
    it("GET /tours - should return tours list", () => {
      cy.request(`${API}/tours?limit=5&status=active`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("success", true);
        expect(response.body).to.have.property("data");
      });
    });

    it("GET /tours - should support pagination", () => {
      cy.request(`${API}/tours?page=1&limit=2`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
      });
    });

    it("GET /tours/:slug - should return tour detail (if exists)", () => {
      // Lấy slug đầu tiên
      cy.request(`${API}/tours?limit=1&status=active`).then((response) => {
        const tours = response.body.data?.tours || response.body.data || [];
        if (tours.length > 0) {
          const slug = tours[0].slug;
          cy.request(`${API}/tours/${slug}`).then((detailRes) => {
            expect(detailRes.status).to.eq(200);
            expect(detailRes.body.success).to.be.true;
          });
        }
      });
    });
  });

  describe("Destinations API", () => {
    it("GET /destinations - should return destinations list", () => {
      cy.request(`${API}/destinations?limit=5&status=active`).then(
        (response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property("success", true);
          expect(response.body).to.have.property("data");
        }
      );
    });

    it("GET /destinations/:slug - should return destination detail", () => {
      cy.request(`${API}/destinations?limit=1&status=active`).then(
        (response) => {
          const destinations = response.body.data || [];
          if (destinations.length > 0) {
            const slug = destinations[0].slug;
            cy.request(`${API}/destinations/${slug}`).then((detailRes) => {
              expect(detailRes.status).to.eq(200);
              expect(detailRes.body.success).to.be.true;
            });
          }
        }
      );
    });
  });

  describe("Auth API", () => {
    it("POST /auth/login - should reject invalid credentials", () => {
      cy.request({
        method: "POST",
        url: `${API}/auth/login`,
        body: {
          email: "fake-nonexistent@test.com",
          password: "WrongPassword@123",
        },
        failOnStatusCode: false,
      }).then((response) => {
        // Expect 400 or 401
        expect(response.status).to.be.oneOf([400, 401, 404]);
      });
    });

    it("GET /auth/me - should reject without token", () => {
      cy.request({
        method: "GET",
        url: `${API}/auth/me`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });
});
