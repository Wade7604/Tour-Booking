/// <reference types="cypress" />

/**
 * Test Suite: Authentication (Login & Register)
 *
 * Test các chức năng:
 * - Login form validation
 * - Login thành công / thất bại
 * - Register form validation
 * - Toggle password visibility
 * - Google login button hiển thị
 * - Redirect khi đã đăng nhập
 */

describe("Authentication", () => {
  describe("Login Page", () => {
    beforeEach(() => {
      cy.visit("/login");
    });

    it("should display login page correctly", () => {
      cy.title().should("contain", "Login");
      cy.get(".logo h1").should("contain", "TourBooking");
      cy.get("#loginForm").should("be.visible");
    });

    it("should have email and password inputs", () => {
      cy.get("#email").should("be.visible").and("have.attr", "type", "email");
      cy.get("#password")
        .should("be.visible")
        .and("have.attr", "type", "password");
    });

    it("should have Sign In button", () => {
      cy.get("#loginBtn").should("be.visible").and("contain", "Sign in");
    });

    it("should have Google login button", () => {
      cy.get("#googleLoginBtn")
        .should("be.visible")
        .and("contain", "Sign in with Google");
    });

    it("should have register link", () => {
      cy.get(".register-link a")
        .should("be.visible")
        .and("contain", "Sign up now");
    });

    it("should toggle password visibility", () => {
      cy.get("#password").type("TestPassword");
      cy.get("#password").should("have.attr", "type", "password");

      cy.get("#togglePassword").click();
      cy.get("#password").should("have.attr", "type", "text");

      cy.get("#togglePassword").click();
      cy.get("#password").should("have.attr", "type", "password");
    });

    it("should not submit empty form (HTML5 validation)", () => {
      cy.get("#loginBtn").click();
      // Trình duyệt sẽ chặn submit vì trường required
      cy.url().should("include", "/login");
    });

    it("should show error with invalid credentials", () => {
      cy.intercept("POST", "**/api/auth/login").as("loginRequest");

      cy.get("#email").type("wrong@example.com");
      cy.get("#password").type("WrongPass@123");
      cy.get("#loginBtn").click();

      cy.wait("@loginRequest", { timeout: 15000 });
      // Alert container sẽ hiện thông báo lỗi
      cy.get("#alertContainer .alert-danger", { timeout: 10000 }).should(
        "be.visible"
      );
    });

    it("should navigate to register page", () => {
      cy.get(".register-link a").click();
      cy.url().should("include", "/register");
    });
  });

  describe("Register Page", () => {
    beforeEach(() => {
      cy.visit("/register");
    });

    it("should display register page correctly", () => {
      cy.get("#registerForm").should("be.visible");
    });

    it("should have all required fields", () => {
      cy.get("#fullName").should("be.visible");
      cy.get("#email").should("be.visible");
      cy.get("#phone").should("be.visible");
      cy.get("#password").should("be.visible");
      cy.get("#confirmPassword").should("be.visible");
    });

    it("should validate password format (client-side)", () => {
      cy.get("#fullName").type("Test User");
      cy.get("#email").type("test@example.com");
      cy.get("#phone").type("0901234567");
      cy.get("#password").type("weak"); // Mật khẩu yếu
      cy.get("#confirmPassword").type("weak");

      cy.get("#registerBtn").click();

      // Kiểm tra xuất hiện lỗi validation
      cy.get(".is-invalid").should("exist");
    });

    it("should validate password confirmation match", () => {
      cy.get("#fullName").type("Test User");
      cy.get("#email").type("test@example.com");
      cy.get("#phone").type("0901234567");
      cy.get("#password").type("Test@1234");
      cy.get("#confirmPassword").type("DifferentPass@1234");

      cy.get("#registerBtn").click();

      // Confirm password field phải có class is-invalid
      cy.get("#confirmPassword").should("have.class", "is-invalid");
    });

    it("should validate Vietnamese phone format", () => {
      cy.get("#fullName").type("Test User");
      cy.get("#email").type("test@example.com");
      cy.get("#phone").type("1234"); // số điện thoại sai format
      cy.get("#password").type("Test@1234");
      cy.get("#confirmPassword").type("Test@1234");

      cy.get("#registerBtn").click();

      cy.get("#phone").should("have.class", "is-invalid");
    });
  });
});
