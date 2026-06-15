import { faker } from "@faker-js/faker";

describe("auth", () => {
  afterEach(() => {
    cy.cleanupUser();
  });

  it("registers a new account and logs out", () => {
    const loginForm = {
      name: faker.person.fullName(),
      email: `${faker.internet.userName()}@example.com`,
      password: `${faker.internet.password()}Aa1`,
    };

    cy.then(() => ({ email: loginForm.email })).as("user");

    cy.visitAndCheck("/");
    cy.findByRole("link", { name: /get started/i }).click();

    cy.findByRole("textbox", { name: /full name/i }).type(loginForm.name);
    cy.findByRole("textbox", { name: /email/i }).type(loginForm.email);
    cy.findByLabelText(/^password$/i).type(loginForm.password);
    cy.findByRole("button", { name: /create account/i }).click();

    cy.url().should("include", "/communities");
    cy.findByRole("heading", { name: /my communities/i });

    cy.findByRole("button", { name: loginForm.name }).click();
    cy.findByRole("button", { name: /logout/i }).click();
    cy.location("pathname").should("eq", "/");
  });

  it("logs in with an existing test user", () => {
    cy.login();
    cy.visitAndCheck("/communities");
    cy.findByRole("heading", { name: /my communities/i });
  });
});

describe("communities", () => {
  afterEach(() => {
    cy.cleanupUser();
  });

  it("creates a community", () => {
    cy.login();
    cy.visitAndCheck("/communities");

    cy.findByRole("link", { name: /\+ create/i }).click();
    cy.findByRole("textbox", { name: /community name/i }).type(
      `Test Community ${Date.now()}`
    );
    cy.findByRole("button", { name: /create community/i }).click();

    cy.url().should("match", /\/communities\/[^/]+$/);
  });
});

describe("items", () => {
  afterEach(() => {
    cy.cleanupUser();
  });

  it("adds an item and edits it", () => {
    cy.login();
    cy.visitAndCheck("/items/new");

    cy.findByRole("textbox", { name: /item name/i }).type("Test Drill");
    cy.findByRole("textbox", { name: /description/i }).type(
      "Cordless drill for community projects"
    );
    cy.findByRole("button", { name: /add item/i }).click();

    cy.url().should("match", /\/items\/[^/]+$/);
    cy.findByRole("heading", { name: /test drill/i });

    cy.findByRole("link", { name: /edit/i }).click();
    cy.url().should("include", "/edit");
    cy.findByRole("heading", { name: /edit item/i });

    cy.findByRole("textbox", { name: /item name/i })
      .clear()
      .type("Updated Drill");
    cy.findByRole("button", { name: /update item/i }).click();

    cy.url().should("match", /\/items\/[^/]+$/);
    cy.findByRole("heading", { name: /updated drill/i });
  });

  it("shows the add item form when the user has no items", () => {
    cy.login();
    cy.visitAndCheck("/items/new");
    cy.findByRole("heading", { name: /add new item/i });
    cy.findByRole("button", { name: /add item/i });
  });
});
