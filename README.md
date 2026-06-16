# ShareStuff — Community Sharing Platform

A platform for sharing items within trusted, closed communities. Members can lend and borrow belongings and track requests — all within private groups they own or belong to.

Built with Remix v2, Prisma, SQLite, and Tailwind CSS.

## What It Does

ShareStuff lets people create and join private communities where they share their belongings with neighbours and friends. Think of it as a neighbourhood library for tools, books, games, kitchen gear, and more.

## Features

### Communities

- Create a community with a name, description, and rules
- Request to join existing communities
- Community owners approve or reject membership requests
- Only approved members can view community content

### Items

- Add items to your personal collection with name, description, category, and condition
- Optional photo per item (client-side compression, stored in Cloudflare R2)
- Items are visible to members of any community you belong to
- Mark items as available or unavailable
- Edit or delete your items at any time

### Lending

- Request to borrow an item with an optional note
- Queue system — multiple people can request the same item
- Full status lifecycle: `PENDING → APPROVED → BORROWED → RETURNED`
- Owners approve/reject requests and mark items as returned
- Lending dashboard tracks both your borrows and your incoming requests

### Notifications

- In-app notifications for request updates and approvals
- Mark individual notifications as read or delete them
- Unread count badge in the navigation

### Admin

- User management (view, role changes)
- Community oversight
- Report review
- Platform statistics

## Tech Stack

- [Remix v2](https://remix.run) — full-stack React framework
- [Prisma](https://prisma.io) — database ORM
- [SQLite](https://sqlite.org) — database
- [Tailwind CSS](https://tailwindcss.com) — utility-first styling
- [TypeScript](https://typescriptlang.org) — type safety
- [Fly.io](https://fly.io) — deployment with Docker
- [GitHub Actions](https://github.com/features/actions) — CI/CD
- [Vitest](https://vitest.dev) — unit and integration testing
- [Cypress](https://cypress.io) — optional end-to-end smoke tests

## Development

Initial setup:

```sh
npm run setup
```

Start the dev server:

```sh
npm run dev
```

This starts the app in development mode, rebuilding assets on file changes.

The database seed script creates a user you can use to get started:

- Email: `rachel@remix.run`
- Password: `racheliscool`

### Key files

- User auth — `[app/models/user.server.ts](./app/models/user.server.ts)`
- Session management — `[app/session.server.ts](./app/session.server.ts)`
- Communities — `[app/models/community.server.ts](./app/models/community.server.ts)`
- Items — `[app/models/item.server.ts](./app/models/item.server.ts)`
- Notifications — `[app/models/notification.server.ts](./app/models/notification.server.ts)`
- Database schema — `[prisma/schema.prisma](./prisma/schema.prisma)`

## Deployment

This app deploys to [Fly.io](https://fly.io). See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions.

GitHub Actions automatically deploy:

- `main` branch → production
- `dev` branch → staging

### Connecting to your database

The SQLite database lives at `/data/sqlite.db` in the deployed app. Connect to it with:

```sh
fly ssh console -C database-cli
```

## Testing

The test suite has three layers. Day-to-day development relies on **Vitest** — unit tests for models/utilities and **integration tests** for user flows.

### Run tests

```sh
npm test              # watch mode
npm run test:run      # single run (unit + integration)
npm run test:integration  # integration flows only
```

### Integration tests (page-level flows)

Integration tests live in [`test/integration/`](./test/integration/). They call real Remix loaders and actions against an isolated SQLite database (`prisma/test.db`), then render pages with the returned data to verify UI output (including formatted dates).

Helpers in [`test/integration/test-db.ts`](./test/integration/test-db.ts) reset the DB between tests, create users/communities, and build authenticated requests.

Current flows covered:

- Add an item and load the owner detail page
- View another member's item in a community (and block outsiders)
- Full lending lifecycle: request → approve → borrow → return
- Login blocks unverified users; verified login creates a session
- Signup via invite link joins the community before email verification
- Browse a listed community → request to join → owner approves
- Reject a lending request (with notification and borrower dashboard)
- Queue a second borrower while an item is out, then approve after return
- Submit a report (and validation when fields are missing)

### Unit tests

Unit tests live next to the code they cover (`app/**/*.test.ts(x)`). Models and utilities use mocked Prisma; route components use mocked loader/action data.

### Cypress (optional smoke tests)

A small Cypress suite exists for browser smoke checks. It is not required for local development.

```sh
npm run test:e2e:dev   # interactive
npm run test:e2e:run   # headless (builds app, runs against mocks on port 8811)
```

`cy.login()` logs in as the seeded test user. `cy.cleanupUser()` removes users created during a test.

### Other checks

```sh
npm run typecheck
npm run lint
npm run format
```

`npm run validate` runs unit/integration tests, lint, typecheck, and Cypress smoke tests together.

