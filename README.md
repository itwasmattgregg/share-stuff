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
- [Cypress](https://cypress.io) — end-to-end testing
- [Vitest](https://vitest.dev) — unit testing

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

- User auth — [`app/models/user.server.ts`](./app/models/user.server.ts)
- Session management — [`app/session.server.ts`](./app/session.server.ts)
- Communities — [`app/models/community.server.ts`](./app/models/community.server.ts)
- Items — [`app/models/item.server.ts`](./app/models/item.server.ts)
- Notifications — [`app/models/notification.server.ts`](./app/models/notification.server.ts)
- Database schema — [`prisma/schema.prisma`](./prisma/schema.prisma)

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

### Cypress (E2E)

Run end-to-end tests in development:

```sh
npm run test:e2e:dev
```

A `cy.login()` helper lets you test authenticated flows without going through the login form. Clean up test users after each test with `cy.cleanupUser()`.

### Vitest (Unit)

Run unit tests:

```sh
npm test
```

### Type Checking

```sh
npm run typecheck
```

### Linting

```sh
npm run lint
```

### Formatting

```sh
npm run format
```
