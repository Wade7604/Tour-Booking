// ***********************************************
// Custom Cypress Commands cho Tour Booking App
// ***********************************************

/**
 * Login bằng cách set token trực tiếp vào localStorage
 * (Bypass UI login - dùng cho test nhanh các trang cần auth)
 */
Cypress.Commands.add("loginByAPI", (email, password) => {
  const apiUrl = Cypress.env("API_BASE_URL");

  cy.request({
    method: "POST",
    url: `${apiUrl}/auth/login`,
    body: { email, password },
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.be.true;

    // Lưu token vào localStorage giống như app thật
    window.localStorage.setItem("idToken", response.body.data.idToken);
  });
});

/**
 * Logout - xóa token
 */
Cypress.Commands.add("logout", () => {
  window.localStorage.removeItem("idToken");
});

/**
 * Check nếu element tồn tại, không throw error nếu không có
 */
Cypress.Commands.add("getIfExists", (selector) => {
  return cy.get("body").then(($body) => {
    if ($body.find(selector).length > 0) {
      return cy.get(selector);
    }
    return cy.wrap(null);
  });
});

/**
 * Wait cho API response xong (tours, destinations load lên)
 */
Cypress.Commands.add("waitForPageLoad", () => {
  // Đợi spinner biến mất
  cy.get(".spinner-border", { timeout: 15000 }).should("not.be.visible");
});

/**
 * Intercept & wait cho API call
 */
Cypress.Commands.add("interceptAPI", (method, urlPattern, alias) => {
  cy.intercept(method, `${Cypress.env("API_BASE_URL")}${urlPattern}`).as(
    alias
  );
});
