describe("Routing and guards", () => {
  it("loads public pages with clean URLs", () => {
    ["/", "/about", "/education", "/events", "/contact"].forEach((path) => {
      cy.visit(path);
      cy.location("pathname").should("eq", path);
      cy.location("search").should("eq", "");
    });
  });

  it("redirects logged-out users from protected pages to auth", () => {
    ["/store", "/profile", "/admin"].forEach((path) => {
      cy.visit(path);
      cy.location("pathname").should("eq", "/auth/login");
    });
  });
});
