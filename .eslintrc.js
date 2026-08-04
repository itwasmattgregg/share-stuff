/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "prettier",
  ],
  env: {
    "cypress/globals": true,
  },
  plugins: ["cypress"],
  // we're using vitest which has a very similar API to jest
  // (so the linting plugins work nicely), but it means we have to explicitly
  // set the jest version.
  settings: {
    jest: {
      version: 28,
    },
  },
  overrides: [
    {
      // Vitest needs vi.mock() before imports; keep that hoisting pattern valid.
      files: [
        "**/*.{test,spec}.{ts,tsx}",
        "test/**/*.{ts,tsx}",
      ],
      rules: {
        "import/first": "off",
        "import/no-duplicates": "off",
        "@typescript-eslint/consistent-type-imports": "off",
      },
    },
  ],
};
